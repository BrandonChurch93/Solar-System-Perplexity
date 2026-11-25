# Globe notes

Notebook of the globe engineer (brief 243). Folders: `src/bodies/`, `src/core/sets.ts`, `tests/globe-*.test.ts`, this file. Branch `agent/engine-globe`, started from `412d2d09`.

Five options, all off by default. A stop that turns none of them on gets the shader text of the starting commit (sha256 `81b01893...` held by `tests/patches.test.ts`) and the same texture uploads.

| option | where | a stop turns it on with |
| --- | --- | --- |
| own light per patch level | `PatchSet.own` in `src/bodies/planet.ts` | `own: [false, false, true, ...]`, one entry per level, beside `widthsDeg` |
| gain of the own levels | `PatchSet.ownGain` in `src/bodies/planet.ts` | `ownGain: true` beside `own`, then `planet.setOwnGain([r, g, b])` each frame |
| level fade by the fine axis | `PatchSet.fadeMinor` in `src/bodies/planet.ts` | `fadeMinor: true` |
| one channel texture | `ctx.texture` in `src/core/sets.ts` | `ctx.texture(path, { srgb: false, channels: 1 })` |
| haze glow about a direction of the stop | `HazeParams.glow` in `src/bodies/haze.ts` | `glow: true` in the haze params, then `planet.setGlow(direction, colour, power)` and `shell.setGlow(...)` each frame |

Only the Mars set uses `src/bodies/planet.ts` today. The other stops have their own globe shaders and are not touched.

## 1. Own light per patch level (`own`)

A level with `own[i] = true` is shown as scene values: its texel is taken as a finished picture of the ground, with its own light in it. A level without the flag is albedo, lit by the shader as before.

What the shader does with the flag (weights `w` are the level weights of today: feather times fade):

```
for each level i, coarse to fine, t = texel (linear after the sRGB decode), o = own[i]:
  albedo = mix(albedo, t, w * (1 - o))
  ownSum = ownSum * (1 - w) + t * (w * o)
  own    = own    * (1 - w) + w * o
col = albedo path as today: lin * shade * uTint  (relief lift, night flat, terminator, tint)
if own > 0: col = mix(col, inverseFilmic(ownSum / own), own)
```

`own` is the share of the pixel that own levels hold after every level above them has taken its part. Where a level with the flag meets one without it, the pixel is `lit * (1 - w) + scene * w` with `w` the level's weight: no step, and no value outside the two ends (measured in `tests/globe-gl.test.ts`: the three channels give the same weight to 2e-4, the weight falls monotonically across the feather, the pixel outside the level is equal to the lit pixel). A lit level drawn over an own level takes the pixel back by its own weight.

A product of two mixes (mix the texel in as albedo, then mix the lit result with the scene value of the albedo) was tried first and dropped: at half weight it left about 0.30 where 0.10 was right, a bright band at the edge.

### What remains between the texel and the frame (for the baker)

With `own = 1` at a pixel, texel `T` (sRGB bytes) becomes:

1. `s = inverseFilmic(srgbToLinear(T))`. The texel is read as display light and taken back to scene light with the film's own curve (`INVERSE_FILMIC_GLSL` in `src/post/chain.ts`, the same call the lit path makes on the albedo; it clamps at 0.985 display, about 4.98 scene). So bake `T = sRGB(filmic(s))`.
2. `s * exp(-tau * uExtinction) + hazeLight * (1 - exp(-tau))`: the haze of the stop, as for every other pixel.
3. The grazing haze mix of the stop (`uGrazingShape`), as for every other pixel. On Mars its depth goes to 0 near the ground.
4. `* uGain * uWeight / vignette term`.

Not applied to an own share: `shade` (sun, terminator, relief shading), `uTint`, the relief lift, `uNightFlat`. Mips and the anisotropic filter average display light, not scene light, as for every other level.

Errors: `own` with a length other than the number of levels throws `own needs one entry per patch level`. All entries false gives the default shader text.

## 2. Level fade by the fine axis (`fadeMinor`)

Today a level fades out when the longer axis of the pixel footprint passes `fade` texels of the level above it. On a grazing view the longer axis is many times the shorter one, so the fine levels are dropped where the anisotropic filter could still draw them: blur along the short axis.

With `fadeMinor: true` the fade reads

```
fine = max(area / longer, longer / anisotropy) in texels of the level above
```

`area / longer` is the short axis of the footprint (the cross product of the two screen derivatives over the longer one). `longer / anisotropy` is the size the filter really samples at when the footprint is more stretched than its limit: the filter takes its mip level from the longer axis divided by min(stretch, anisotropy). `anisotropy` is read from each level's texture (`tex.anisotropy`, which the loader has already capped by the machine's limit) and from the wrap map for the first level. So the fade never asks the filter for more than it gives, and the longer axis is never undersampled. For Mars nothing else has to be passed: `src/stops/mars/set.ts` loads the wrap and the patches with `anisotropy: 16` already.

Texels view (`uDiag == 2`): red is unchanged, the longer axis in texels of the level really drawn (the drawn level is the last one with weight above one half, as today), so `tools/measure/texels.ts` and G13 read the truth with the flag on. With the flag the view also writes blue: `0.5 * (short axis in texels of the drawn level) / max(longer / anisotropy, 1)`. The divisor is the mip the filter is forced to by its anisotropy limit. Blue at 0.5 (1.0 texels) or more means the level is at full sharpness across the fine axis; less means the picture is magnified across it, either because there is no finer level there or because the footprint is more stretched than the filter's limit (then no level can help). Blue is 0 without the flag, as today.

Measured in `tests/globe-gl.test.ts` (a camera 0.005 radii up, pitched 20 degrees down, levels of 60, 30 and 15 degrees at 4096 px, anisotropy 16): at the centre pixel the 30 degree level has 2.92 by 0.92 texels per pixel. Without the flag the 15 degree level is not drawn there; with the flag it is drawn at full weight, red reads 1 (the longer axis is 5.93 texels of that level, clipped at 2) and blue reads 0.94 (1.88 texels on the fine axis). With anisotropy 2 on every texture the blue value falls to the predicted 1.88 / (5.93 / 2).

### Mars frame 2454, `side=orbit/noplace`, draft tier

Rendered in a scratch worktree with `fadeMinor: true` added to `src/stops/mars/set.ts` (never committed). `npm run still -- --frame 2454 --tier draft --diag "beauty/side=orbit/noplace"`, and the same with `texels`. Ground pixels counted: 1479102. "Before" blue values come from a scratch build that writes blue but leaves the fade on the longer axis.

| levels | fade | red under 1.0 | mean red | blue under 1.0 | blue under 0.5 |
| --- | --- | --- | --- | --- | --- |
| the five of today (96, 48, 24, 12, 3 deg) | longer axis | 0.5637 | 1.007 | 1.0000 | 0.9098 |
| the five of today | fadeMinor | 0.5637 | 1.053 | 0.9518 | 0.7741 |
| scratch seven (96, 48, 24, 12, 3, 1.2, 0.6 deg) | longer axis | 0.0000 | 1.723 | 0.8763 | 0.3073 |
| scratch seven | fadeMinor | 0.0000 | 1.872 | 0.3872 | 0.0235 |

Red is the G13 measure (longer axis, clipped at 2.0); blue is the fine axis. With the five levels of today the option changes the level on 10.9 percent of the ground pixels, all between rows 302 and 477 of 1080 (the far ground); the near ground is limited by the finest level (3 degrees), where no fade rule can help, so red under 1.0 does not move. The scratch seven reuse `patch-3.jpg` for the 1.2 and 0.6 degree levels: wrong content, right density, close to the plan of the Mars builder. There the share of ground magnified across the fine axis falls from 0.876 to 0.387, and the rest is where the footprint is more stretched than 16 to 1.

Moving check, scratch seven, frames 2453, 2454, 2455, draft (1 sample a pixel, the hardest case), grain off (`nograin/side=orbit/noplace`), luminance in 8 bit levels over the ground pixels:

| | frame to frame mean | second difference mean | p99 | p99.9 | max | detail, mean abs dx | dy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| longer axis | 2.844 | 4.180 | 41.59 | 65.00 | 105.3 | 0.723 | 1.355 |
| fadeMinor | 2.948 | 4.352 | 41.89 | 63.93 | 104.8 | 0.797 | 1.376 |

The second difference (a pixel that goes up and comes back) rises 4 percent in the mean with 10 percent more detail across; its tail does not rise. The same three frames with the five levels of today and the grain on: 3.757 before, 3.780 after. No sparkle is seen in the crops at 1 to 1 (`strip7-three-frames.png` in the looks). Limit of this check: the camera moves fast at these frames, so the numbers are mostly true motion; they show that the option adds no flicker beyond its added detail, not that there is none. The same holds at steps of a tenth of a frame (`shut/t=81.8000`, `81.8033`, `81.8067`): second difference mean 1.671 before, 1.720 after.

Still check for undersampling, scratch seven, frame 2454, every sample at the shutter middle (`nograin/side=orbit/noplace/shut`): the 1 sample picture against the 16 sample picture of the review tier. Mean difference over the ground 0.181 levels before, 0.238 after; p99 1.64 and 2.14; p99.9 3.99 and 5.20; max 30.7 both. The 16 sample picture has 19 percent more detail across with the option (0.797 to 0.949), so part of the rise is detail the single sample filter smooths; the rest I cannot separate.

Not checked: another GPU than the software renderer of the harness; the film tier in motion (a clip).

### Mars frames 2448 and 2704 with the plates of the Mars builder, draft tier

Rendered in a scratch worktree at `agent/mars-place` 41d7784 (merged with main da69509a): eight levels, 96, 48 and 26 degrees lit, 13, 6.5, 3.25, 1.2 and 0.6 degrees own, `fadeMinor` true in `src/stops/mars/levels.json`. Off is the same file with `"fadeMinor": false`. `--diag "beauty/side=orbit/noplace"` and `texels/side=orbit/noplace`. Blue with the option off comes from a scratch build that writes blue but leaves the fade on the longer axis. Frame 2704 is on the path of that branch, older than the rise of main 03510ddd.

| frame | ground pixels | fade | red under 1.0 | mean red | blue under 1.0 | blue under 0.5 |
| --- | --- | --- | --- | --- | --- | --- |
| 2448 | 1459307 | longer axis | 0.0000 | 1.686 | 0.8753 | 0.3946 |
| 2448 | 1459307 | fadeMinor | 0.0000 | 1.870 | 0.4799 | 0.0156 |
| 2704 | 1302406 | longer axis | 0.1041 | 1.552 | 0.9973 | 0.5297 |
| 2704 | 1302406 | fadeMinor | 0.1041 | 1.680 | 0.9357 | 0.1851 |

Beauty pictures, off against on: at 2448 the option changes 23.5 percent of the ground pixels by more than 2 of 255 (rows 310 to 879 of 1080, most in the far band about row 320); the mean gradient of those pixels rises from 10.79 to 14.52 levels. At 2704 it changes 21.8 percent (rows 386 to 857), gradient 9.03 to 12.09. Outside the ground no pixel moves by more than 1 level. Pairs in the looks: `pairM-2448-full`, `-crop` (far band at 2 to 1), `-texels`, and the same for 2704.

What the pictures show: with the option off the far half of the ground is smeared along the view; with it on the dunes, the channel and the crater rims of the far band are drawn. Seen in both, so not from the fade: thin bright orange fringes on edges of the own levels, and a worm like texture in the near ground of the deepest levels. At 2704 red under 1.0 is 0.1041 with and without the option (G13 allows 0.02): there the near ground is past the finest level (0.6 degrees), which no fade rule can help.

Moving check with these plates, frames 2447, 2448, 2449, draft, grain off, luminance in 8 bit levels over the ground: frame to frame mean 10.03 off and 10.77 on; second difference mean 16.38 and 17.81, p99 93.9 and 100.0, p99.9 137.7 and 143.9, max 222.9 both; detail, mean abs dx 2.058 and 2.641, dy 3.577 and 4.409. The camera moves many pixels a frame here, so these are mostly true motion: the second difference rises 9 percent with 28 percent more detail across.

The same at steps of a tenth of a frame (`nograin/side=orbit/noplace/shut`, `t=81.6000`, `81.6033`, `81.6067`), 1 sample, over the far band (ground above row 570, 480107 pixels): step to step mean 3.12 off and 4.30 on; second difference mean 3.74 and 5.61, p99.9 67.4 and 85.9. Over all the ground: 5.26 and 6.38. The ratio of second difference to step is 1.40 off and 1.44 on over the ground, near the 1.73 of pictures with no relation between them, so even a tenth of a frame moves the fine detail by about a pixel and this check cannot tell shimmer from motion at this frame. No sparkle is seen in the three crops at 1 to 1 (`stripM-2448-steps` in the looks).

Undersampling at the same instant (`t=81.6000`, 1 sample against the review tier picture), far band: mean difference 0.468 levels off and 0.839 on, p99 3.14 and 5.41, p99.9 5.57 and 9.35, max 27.0 and 27.7. Detail of the review picture there: dx 1.846 and 3.187, dy 5.109 and 7.322. So the single sample error rises 79 percent where the detail rises 43 to 73 percent: per unit of detail (error over dx plus dy) 0.067 off and 0.080 on. The option adds a little more single sample error than its detail alone explains. Not shown: whether this is seen in the film tier in motion.

## 3. One channel textures (`channels: 1`)

`ctx.texture(path, { srgb: false, channels: 1 })` uploads the image as a one channel texture (`THREE.RedFormat`, R8) and counts it at 1 byte a pixel (4/3 with mips). Without the option nothing changes: RGBA8, 4 bytes a pixel.

What a shader must read: the red channel only (`texture(uMask, uv).r`). Green and blue read 0 and alpha reads 1. A shader that reads `.g`, `.b`, `.a`, `.rgb` as grey or `dot(rgb, weights)` from a mask must be changed to `.r` before the mask is opted in.

What does not carry over: the sRGB decode. There is no one channel sRGB format in WebGL2, so the option throws `a one channel texture needs srgb: false` unless the texture is loaded with `srgb: false`. A mask or height that was loaded with `srgb: true` would change its values; keep it at four channels or re-bake it as linear.

The red channel of the image is what is uploaded. For a grey PNG the three channels are equal, so nothing is lost; for a colour image green and blue are dropped.

The budget tool reads the loader's own count (`showcase.memory()`), so it shows the saving with no change.

Measured in `tests/globe-gl.test.ts` (a 64 by 32 grey PNG with a value per pixel, loaded both ways in the harness browser): red is byte equal between the two at every mip level (6 levels), at a read between texels and at a minified read; the one channel texture reads green 0, blue 0, alpha 255; bytes counted 64 * 32 * 4 * 4/3 against 64 * 32 * 4/3; without mips 64 * 32.

Type: `SetContext.texture` takes `TextureOptions` from `src/core/types.ts` (owner: handover_engineer). Until this patch is in, a stop passing the option as an object literal gets a type error:

```diff
--- a/src/core/types.ts
+++ b/src/core/types.ts
@@ -89 +89 @@
-export interface TextureOptions { srgb?: boolean; mips?: boolean; repeat?: boolean; mirror?: boolean; anisotropy?: number; flipY?: boolean; linear?: boolean }
+export interface TextureOptions { srgb?: boolean; mips?: boolean; repeat?: boolean; mirror?: boolean; anisotropy?: number; flipY?: boolean; linear?: boolean; channels?: 1 }
```

## 4. A centre per patch level (`centresDeg`)

`patches.centresDeg: [[east, north], ...]`, one pair per level, degrees. The plate of a level stays gnomonic about `patches.spot`, north up; its square is moved in that plane by the tangent of the two angles: it spans centre - tan(width / 2) to centre + tan(width / 2) on each axis, in the plane's unit (tangent of the angle from the spot). Asked by the Mars builder for the corners of the frame the eye's foot leaves soft (MAIL 454 item 4). The text gets `uniform vec2 uPatchCentre[slots];` and reads `(g - uPatchCentre[i])` where it read `g`; with those two taken out it is the text without the option, and a stop that gives no centres keeps its text (`81b01893...`). No sampler. The cap draws the planet's text, so the colour follows there too. The heights of a cap stay centred on the spot (its grids are one lattice about it).

Measured (`tests/globe-levels.test.ts`, `tests/globe-cap.test.ts`): a level 6 degrees wide with centre 3 east shows from 0 to 6 east and from 3 south to 3 north, with centre 3 north the same turned, on the sphere and on the cap.

## 5. Haze glow about a direction of the stop (`glow`)

Asked by the Mars builder: the place picture has its glow on one side of the frame, and the haze had only the lobe about the sun (`hazeForward`, power 6), so no stop value could put light on one side.

With `glow: true` in a `HazeParams` the haze text gets three uniforms and one more term inside `hazeLight`:

```
hazeLight = ((day + twilight) * hazeForward(dir) + night + uHazeGlow * pow(max(dot(dir, uHazeGlowDir), 0.0), uHazeGlowPower)) * uHazeStrength
```

`dir` is the view direction in world axes (the camera is the origin of the world in this engine). The term is not scaled by day or twilight; the stop fades the colour itself. It is multiplied by `uHazeStrength` and, like the rest of the haze light, by `1 - exp(-tau)` on the ground (`src/bodies/planet.ts`) and in the shell (`HazeShell`).

How a stop uses it: put `glow: true` into the haze params of the planet (`look.haze`) and of each shell that should carry it, then each frame call `planet.setGlow(direction, colour, power)` and `shell.setGlow(direction, colour, power)`. `direction` is a world vector (normalised by the setter), `colour` is scene light `[r, g, b]`, `power` must be above 0. The colour starts at 0, so a stop that sets the option and never calls the setter draws the frames of today (with a different shader text). A setter on a haze without the option throws `this haze has no glow`.

Off: `hazeGlsl(false)` is the constant `HAZE_GLSL`, which Venus, Jupiter, Saturn and Neptune include as before; its sha256 (`8e0c217f...`), the shell's text (`692d6d8b...`) and the planet's text (`81b01893...`) are held by `tests/globe-haze.test.ts`. No uniform is added when off.

Measured in `tests/globe-gl.test.ts` (camera 3 radii out, glow direction 26.6 degrees off the view axis, haze depth 0.5): colour 0 and a direction behind the camera give the pixels of the build without the option, exactly; the added light has the channel ratios of the colour (1, 0.5, 0.25 to 1e-3), doubles with the colour, rises toward the glow direction, and the ratio between power 12 and power 6 at each pixel is the cosine to the sixth (to 1e-3).

## 6. Gain of the own levels (`ownGain`)

Asked by the Mars builder: the lit levels change with height (descent tint) and the close view at the rise is brighter than at the dive, and a baked plate cannot follow either. With `ownGain: true` in the patch set the last line of section 1 reads

```
if own > 0: col = mix(col, inverseFilmic(ownSum / own) * uOwnGain, own)
```

The gain multiplies the scene value of the own levels, after `inverseFilmic`, as a straight factor, the way `uTint` multiplies the lit levels (`lin * shade * uTint`). So an own level with gain g and the lit level under it with tint g move together, and a factor the stop sets is the factor the ground gets. It starts at 1 1 1. The stop sets it each frame with `planet.setOwnGain([r, g, b])`; the numbers and their curve by height live in the stop's params. Pixels with no own share (`own` is 0) do not read the gain.

First form, on main from 3d61ec53 and replaced here: `inverseFilmic(ownSum / own * uOwnGain)`, the gain on the texel before the curve. The Mars builder found it wrong in use: the curve is steep, so 1.5 on a look of 0.3 gave 0.58 where 0.45 was wanted, and an own level only agreed with the lit level under it at gain 1. No stop on main sets `ownGain` (checked at main fdf97b84), so the change of form moves no frame of main; it moves the frames of a branch that sets a gain other than 1.

Off: a set with own levels and no `ownGain` keeps the text it had (sha256 `813ceb84...`, held by `tests/globe-levels.test.ts`), with no uniform added; a set with no option keeps `81b01893...`. `ownGain: true` without an own level throws `ownGain needs an own level`; `setOwnGain` on a planet without the option throws `this planet has no own gain`.

Measured in `tests/globe-gl.test.ts` (128 pixel row through an own level of 30 degrees over a lit level): gain 1 1 1 gives the pixels of the build without the option, exactly; with gain 2 1 0.5 the centre pixel is the scene value of the texel times the gain to 1e-5; the channel with gain 1 keeps its values exactly; across the feather the other two channels move by `w * scene * (gain - 1)` to 1e-4 with `w` the weight read from the channel with gain 1; the pixels the own level does not reach are exactly those of the lit level alone.

## 7. The air of the globe by the eye's height (`setAir`)

Second review note, plan F: nothing in the picture may come by the clock or by the view. The engine (handover_engineer, type `Air` in `src/core/types.ts`) mixes the knots of a stop's `air` params over the log of the eye's height and hands `shot.air` per shutter sample. In `src/bodies/air.ts`:

- `HazeAir = { depth, scaleHeight, day, twilight, night, edge: [from, to], strength, extinction, forward }`, the numbers of `HAZE_GLSL`.
- `GlobeAir = { limb?, tint?, haze?: HazeAir }`, the part of `Air` the globe reads; each part is optional as in the engine's `Air` (agent/engine-handover dddef05: a body has a part at every height or at none) and `planet.setAir` writes only the parts the air holds. `Air` has more fields (`height`, `share`, `exposure`, `shell`, `sky`, `stars`, `sunRadius`, `glare`); the globe does not read them.
- `planet.setAir(air)` writes `uLimb`, `uTint` and the haze of the ground; `shell.setAir(air.shell)` writes a `HazeShell`; `setHazeAir(uniforms, hazeAir)` writes any material that includes `HAZE_GLSL` and made its uniforms with `hazeUniforms` (Venus, Jupiter, Saturn, Neptune). `uExtinction` is written where the material has it.
- `hazeAir(params)` turns the `HazeParams` a globe was made with into a `HazeAir`, with the defaults the shader has (`night` 0 0 0, `edge` -0.16 0.34), for a stop that writes its top knot from its look.

No shader text changes and no uniform is added: the setters write the uniforms the globe has today. A stop that never calls them keeps every byte. A stop turns it on in its `update`:

```
if (shot.air) {
  planet.setAir(shot.air)
  if (shot.air.shell) shell.setAir(shot.air.shell)
}
```

(a stop with a material of its own: `if (shot.air?.haze) setHazeAir(material.uniforms, shot.air.haze)`)

and takes out its own lines keyed to a view, a segment or a time. The top knot of the stop's `air` holds today's numbers of the hold; the engine hands the top knot through untouched at and above its height, so the hold keeps its bytes.

Measured (`tests/globe-air.test.ts`, 6 tests): an air with no haze, no limb or no tint leaves those uniforms as they were; with the air made from the params the globe was built with, every uniform of the planet and of the shell holds the value it had, compared as JSON; the planet text is `81b01893...` and the shell text `692d6d8b...` before and after; each field lands in its uniform; the arrays of the air are copied, not kept; uniforms without a haze are refused.

### Patch for `src/stops/mars/set.ts` (owner: mars_place_builder)

Today `low` and `near` are already functions of the log of the eye's height, but `ending` (the segment), `lit` (the retreat's clock) and `diveT` switch them. With the air:

```
-      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
-      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
-      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, lit).normalize()
+      const air = shot.air
+      if (!air) throw new Error('mars needs the air of its params')
+      light.copy(plan.lightDir).applyQuaternion(state.rotation).lerp(shot.sun.dir, air.sunShare ?? 0).normalize()
...
-      const low = ending ? 0 : 1 - smooth(...)
-      (the lines that write uTint, uHazeDay, uHazeTau, uHazeH, uHazeEdge of the planet and of the shell, and the `near` mixes over them)
+      planet.setAir(air)
+      shell.setAir(air.shell)
+      const low = air.share
```

and the numbers that stay in the set (`uGrazingShape.x`, `uGrazingDetail.w`, `uVignette`, the gains of halo and glint, the glow colours, the own gain) read `air.share` or their own knot field instead of `low`, `near`, `ending` and `diveT`. The knots: the heights `descent.high` 0.7, `near.high` 0.03, `descent.low` 0.05 and `near.low` 0.0022 of today, each with the values today's lines give at that height, the top knot equal to `look.haze`, `look.shellHaze`, tint 1 1 1 and `look.light.limb`. The curve between two knots is the engine's, not today's product of two smoothsteps, so dive frames move a little and hold frames do not. The light of the retreat (`lit`) is not air; it needs its own rule by height or by distance from the stop and is the stop builder's and the engine's to settle.

## 8. Relief cap (`cap`)

Second review note, plan F: relief as geometry on the globe itself from the height where the tallest thing shifts a pixel. `src/bodies/cap.ts`, class `ReliefCap`, turned on by `cap` in the options of `Planet`:

```
cap: {
  levels: [{ height, size, widthDeg, low, high, mask? }, ...],   coarse to fine
  border: [inner, outer],     radii of ground distance about the spot; the height goes to 0 between them
  from: [high, low],          heights of the eye in radii; the relief grows from 0 at `high` to full at `low`, over the log of the height
  cells: n,                   cells along the side of each level, a multiple of 64
  pixel: radians,             the angle of one pixel row of the master format (also `cap.setPixel`)
  feather, fade, reachDeg     optional
}
```

What a stop hands: square gnomonic plates of heights about `patches.spot`, north up, row 0 at the north edge, texel centres at (i + 0.5) / N, raw uint16, radii over the unit sphere = low + v / 65535 * (high - low). The stop reads the file with `ctx.buffer(path)` and makes the texture with `heightTexture(ctx, new Uint16Array(buffer), size)` from `src/core/sets.ts`: the heights stay 16 bit integers on the card (`R16UI`, nearest, with a mip chain made by a 2 by 2 box in JS), are counted in the set's bytes (2 bytes a texel plus a third for the mips: 10.67 MB for 2048 squared) and are disposed with the set.

What it draws:

- A mesh, child of `planet.mesh`, in the same depth buffer. Instanced patches (64 by 64 to a level) on one integer lattice per level, the vertices on the texel centres of the level (of its mip when `cells` is less than `size`, of the texels and the points between when it is more). A coarser grid drops the patches that lie wholly inside the next finer square less two of its cells, so the grids overlap in a band and there is no T junction. `reachDeg` adds grids of twice the width each, with no height, out to that half angle, so the border against the 320 segment sphere can lie beyond the horizon.
- Vertex shader only reads the heights (`usampler2D`, `texelFetch`, bilinear and between two mips by hand). The level of detail is the larger of the pixel's footprint (`pixel` times the distance of the vertex from the eye: an angle, no format in it) and the cell of the grid. Levels blend coarse to fine with the feather of the plates (0.12 of the width) and the fade of the patch levels (`fade`, in texels of the level above per pixel). Position = direction times (1 + height); the varying `vLocal` stays the undisplaced direction, so the fragment text reads colour, levels and light at the place straight under the point: colour is to be laid as a map from straight above.
- Fragment text: the planet's own text for its option set, without one line; the uniforms are the planet's own objects, so `setAir`, `setOwnGain`, `setGlow` and every uniform a stop writes on the planet hold on the cap.
- The sphere under it: the planet's text gets `uniform float uCapCut;` and one `discard` line. The cut is 0 and the cap is not drawn while the eye is at or above `from[0]`; below it the sphere is cut one cell inside the cap's outer edge.
- `cap.setSink(depth, radius)` with a `mask` beside a level: the cap sinks by `depth` (radii) where the mask is 1, within `radius` (radians of ground) of the eye's foot, so a close view's own mesh wins the depth test there (asked by handover_engineer; the stop sets both by `air.height`).

- Grids by pixel footprint (`fine`, default 1): a grid is drawn only while the cells of its parent are larger than `fine` pixels (of `pixel`, an angle) at the nearest ground the eye can see in it; the finest grid drawn is drawn whole. The eye's height less the highest `high` of the levels and the distance of its foot from the grid's square decide, nothing else. `fine: 0` draws every grid always. Why: triangles far under a pixel give wrong screen derivatives in the fragment text (the renderer snaps vertices to a sixteenth of a pixel), seen on Mars as a noisy square over the finest levels from 2.4 radii down to about 0.1. With `fine: 1` the cells of the finest grid drawn lie between about 0.45 and 1 pixel of the 1080 row format, twice that at 2160 rows; `fine: 0.5` halves them.

- Light of its own heights (`light: { relief, own, from? }`, numbers of the stop; `cap.setLight(relief, own)` per frame; MAIL 431 item 3, MAIL 454 item 2). The vertex shader takes the normal of the height pyramid at the vertex: central differences of the same read that places the vertex, over half the larger of pixel footprint and cell to each side, with the tangents of the gnomonic direction written out (no differences of positions). It goes to the fragment text as a varying. `relief` (1 is the true normal) adds the difference between that normal and the ball's to the normal the lit levels are shaded with: same Sun, wrap, curve and night as the ball. `own` multiplies the scene value of the own levels by 1 + lift, lift = clamp((nc.s - n0.s) / max(n0.s + wrap, 0.06), -0.85, 1.6), nc the heights' normal, n0 the ball's (the law of the wrap relief), for plates that carry no slope light of their own. The normal is that of the heights as baked: at full wherever the cap is drawn, not multiplied by the share of the band, not by the border, and without the sink. Only the displacement comes in by the band.
- `light.from` (a height of the eye in radii, above the band's top; `Infinity` is allowed): the cap is drawn from that height down, level above the band, lit by its heights at full. Without it the cap is drawn from the band's top as before. For a stop whose plates have no slope light, so that the ground is lit the same from the hold down. Cost: the cap's vertex work in every frame under that height.
- Without `light` the cap has no such varying, no uniform and four height reads a vertex fewer.
- Haze to its own surface (always with the cap, no number): the height of the vertex as drawn goes to the fragment text, and the haze depth is measured along the view ray from the eye to the point at that height over the datum, not to the ball, by `airDepth` of the chunk below. The density at a height is exp(-height / scale height) at both ends, not held at the datum's, so ground under the datum has more air over it.

### One air to the ground (`GROUND_AIR_GLSL`, MAIL 454 item 3)

`src/bodies/haze.ts` exports a chunk for any material that draws ground under the air of a body, the cap and a stop's close view alike. It goes after the haze text (`hazeGlsl(glow)` or `HAZE_GLSL`), whose uniforms and `hazeCh`, `hazeLight` it uses:

```
float airDepth(float ha, float ca, float hb, float cb, float scaleHeight, float depth)
float airDepthTo(vec3 eye, vec3 point, float scaleHeight, float depth)
vec3  airOver(vec3 col, float tau, float extinction, vec3 up, vec3 dir)
```

- `airDepth`: optical depth along the straight ray from the eye to a point of the ground. `ha`, `hb`: heights of the eye and of the point over the datum, in radii of the body (negative under the datum). `ca`, `cb`: cosine between the ray's direction (eye to point) and the local up at the eye and at the point. `scaleHeight`, `depth`: `uHazeH`, `uHazeTau`, the `scaleHeight` and `depth` of `Air.haze`. Three cases: the ray rises at the eye; it descends at both ends; it passes its lowest point between them.
- `airDepthTo`: the same from two positions measured from the body's centre in radii. In float32 the direction of a point nearer than about 1e-5 radii is coarse; a close view that has heights and cosines of its own calls `airDepth`.
- `airOver`: the colour seen through that air: `col * exp(-tau * extinction) + hazeLight(up, dir) * (1 - exp(-tau))`, `up` the local up at the point, `dir` the ray's direction, `extinction` the `uExtinction` of `Air.haze`.
- The glow of a haze made with `glow: true` is read by `hazeLight`, so it is a number of the air too: `HazeAir` has `glow?: Rgb` and `glowPower?: number`, both or neither, and `setHazeAir` writes them where the uniforms hold a glow and the air names one. The direction of the glow stays the stop's (`setHazeGlow`).
- A material takes its uniforms from `hazeUniforms(params)` plus `uExtinction`, writes them per frame with `setHazeAir(material.uniforms, shot.air.haze)`, and sets `uSunW` (and `uCam` if it uses it).
- `airDepth(ha, ca, hb, cb, scaleHeight, depth)` is also exported as a TypeScript function with the same lines, for a stop's tools.
- It is the ball's own law: with the point on the datum it is the depth the planet's text gives the ground. The planet's text for a stop without a cap does not hold the chunk.
- Measured against the integral of exp(-h / H) along the ray on the sphere (H 0.003, eye 0.0005, 0.002 and 0.01 radii up, rays from straight down to 17 degrees up, distances 1e-5 to 0.1 radii): the depth grows with the distance in every case and lies between 0.84 and 1.57 of the integral: 0.96 straight down, 0.90 at 17 degrees down or up, 0.87 at 3 degrees, 1.2 to 1.4 at half a degree, 1.57 for a level ray at short range, 1.0 to 1.1 at 0.1 radii. The spread is the Chapman term of the ball (`hazeCh`), kept so that the ball and the ground agree; a change of it would change every hold.

Off: a planet without `cap` keeps its text (`81b01893...`, own `813ceb84...`), has no child mesh and no uniform with `Cap` in its name. The text of the sphere of a planet with a cap is the text it had before these two; only the cap's own text differs.

Not there yet: no cast shadow (advice to a stop: multiply it into the colour plates it bakes from the same heights and Sun; a shadow plate would cost a sampler of the 16 and 5.6 MB a level), no march in the fragment shader.

Other owners: `src/core/caps.ts` needs `MAX_VERTEX_TEXTURE_IMAGE_UNITS: 10` and `MAX_COMBINED_TEXTURE_IMAGE_UNITS: 26` (on agent/engine-handover 051a2226). `SetContext` in `src/core/types.ts` is not changed: `heightTexture` is a function beside the loader and finds the set's counter through the context, also through a copy of it (`{ ...ctx }`).

Measured on the synthetic height (`tests/globe-cap.test.ts`, 11 tests in node and 10 in the harness browser, pictures of 96 to 192 pixels, float target):

- Every height 0, eye above the spot: no pixel differs from the globe without a cap by more than 1e-6. Eye 0.02 radii up looking along the ground: under 1 percent of the values differ by more than 1e-4.
- Eye above the band: the picture equals the picture of a globe without the option value for value, the triangle count is the sphere's, and the set's bytes rise by exactly the heights with their mips.
- A ridge 0.03 radii tall seen from 0.02 radii up: the column through it has ground, then sky; the red ground behind the ridge is gone; its crest stands more than 4 rows above the horizon of the sphere and within 2.5 rows of the row computed from the geometry.
- A trough 0.04 radii deep: the far ground moves down by more than 3 rows and every pixel the sphere covered is still covered (the sphere does not close the trough, the cap leaves no hole).
- Rim: a bump inside the border seen from four sides at 0.01 radii, with and without a skirt of 20 degrees: every pixel the sphere covered is covered.
- Pixel as an angle: a ridge one texel wide has its crest at the same share of the picture height at 96 and at 192 rows (within one row of 96); with a pixel 400 times wider it stands less than 0.6 as tall.
- Light: a mesa 0.01 radii tall seen from above, Sun 45 degrees up in the east. Without `light` no pixel of the row through it differs from the level ground. With the strength of its kind at 1 (own levels: `own`; lit levels: `relief`) the east wall is brighter than without by more than 10 percent, the west wall darker by more than 20 percent, the level ground and the mesa's top within 1 percent; with only the other strength at 1 every pixel of the row is within 1 percent of the picture without `light`.
- Light above the band (`light.from`): the same mesa with the eye above the band. Without `from` the cap is not drawn and the picture is the globe's value for value. With `from` above the eye the walls are lit as below the band (east over 10 percent brighter, west over 20 percent darker, within 0.05 of the ratio below the band), the level ground within 1 percent, and the cover of every pixel is the globe's.
- Haze: a globe with haze (scale height 0.01, depth 0.4) seen from above. Every height 0: no value differs from the globe without a cap by more than 2e-5. A pit 0.02 radii deep is more than 1.5 times as bright in the haze as the datum beside it, a mesa 0.02 tall less than half as bright, the datum itself within 1 percent.

### Measured on Mars (plan of `agent/mars-place` 632d7441, first bake c49c7dd5, set wired in a scratch worktree only)

Eye path of the dive: hold 2.49 to 2.4208 radii (frame 2400), 1.92 at 2406, 1.28 at 2409, 0.032 at 2430, 0.0021 at 2448, view change at frame 2454.25 with 0.00172 radii, field 30 degrees at the hold to 60 at the view change.

- Band `from: [2.4, 2.0]`: frames 2401.8 to 2405.6. Shift of the full relief at 3840 by 2160 (largest over the cap, displaced against undisplaced point, numpy on the height files): 0.55 px at 2400, 0.52 at the band's top, 0.39 at its bottom, 0.57 at 2407, 1.10 at 2409, 2.7 at 2412, 10.8 at 2418. The drawn shift (share times full) rises from 0 to 0.39 px over the band. The full relief passes half a pixel on the way down at frame 2406.6 (1.80 radii).
- Hold: frame 2325 with the cap built and not drawn has the sha256 of the frame without the option (`fd128b1a...`, draft).
- The swap of sphere for cap at the band's top, with every height 0 and the cap forced on at frame 2400 (draft, against the frame without a cap): 10.7 percent of the pixels differ, 201519 by 1 of 255, 13789 by 2, 3635 by 3, 2171 by 4 or more, largest 27, at fine detail of the plates. The cap lies on the true sphere and the sphere mesh on chords of 1.125 degrees, so the ground moves by a part of a pixel; before `fine` the same test gave a square of noise with differences up to 178.
- Grids over the dive with `fine: 1`: the 68 degree grid alone down to frame 2409.5 (1.18 radii), 34 from there, 17 from 2414.75 (0.47), 8.5 from 2419.25 (0.21), 3.8 from 2424.25 (0.089), 1.6 from 2430 (0.032), 0.7 from 2436 (0.011), 0.3 from 2441 (0.0047). Frame 2448 is the same picture byte for byte with `fine` 0, 0.5 and 1 (every grid drawn); frame 2409 loses the noise.
- Gap at the view change, 3840 by 2160, between the cap's triangles (vertices on the texel centres) and the bilinear surface through the same data, outside the close view, each level where it is the finest: `cells` = `size`: largest 2.8 / 11.0 / 14.4 / 12.9 / 7.0 px for the levels 8.5 / 3.8 / 1.6 / 0.7 / 0.3, 99.9th percentile 0.35 / 1.13 / 3.4 / 3.3 / 0.69, 99th 0.13 / 0.12 / 0.65 / 0.55 / 0.23; `cells` = 2 `size`: largest 0.71 / 2.7 / 3.6 / 3.2 / 1.75. A cell there is 1.2 px across in the middle and up to 7 px at the near edge of a level's ring. The large gaps are steps of the bake: largest step between two neighbours 1725 m in a 246 m texel on the seam of the two height sources, 1767 m in a 20 m texel inside the close view's own part; outside both the 99.9th percentile of the step is 294 / 188 / 118 / 49 / 16 m. Sent to mars_place_builder with rows and columns.
- Cost: a draft still (1920 by 1080, 1 sample) takes 21 s without the cap at 2409 and 2430 and 36 s at 2448; with the cap 28 s, 53 s and 67 s (`cells` 2048, `fine` 1).
- Memory: 10.67 MB a level of 2048 with its mips, 53.3 MB for five, counted in the set's bytes; the masks are one channel textures of the stop.
- Pictures (looks, folder engine-globe): 2430 and 2448 globe alone with and without the cap; 2447, 2448, 2449 in the film's own view. The walls show streaks: the colour of the plates is pulled down steps one texel wide.

### On the heights baked again (`agent/mars-place` f95c3606, no slope steeper than 2, same scratch wiring)

- Steps of the bake, largest between two neighbours of a level: 491 / 220 / 92 / 40 / 17 m in texels of 246 / 110 / 46 / 20 / 9 m (before: 1725 m and 1767 m); none over 2 texel widths on the seam, inside the close view's part or outside.
- Gap at the view change (frame 2454.25, 0.00172 radii), 3840 by 2160, same measure as above, each level where it is the finest, all the ground in frame: `cells` = `size`: largest 3.1 / 3.6 / 3.9 / 1.9 / 0.8 px, 99.9th percentile 0.44 / 1.34 / 1.21 / 0.71 / 0.32, share of the cells over half a pixel 0.08 / 0.39 / 1.2 / 0.36 / 0.014 percent. `cells` = 2 `size`: largest 0.78 / 0.91 / 0.98 / 0.46 / 0.20 px, 99.99th percentile 0.35 / 0.58 / 0.47 / 0.25 / 0.13, share over half a pixel 0.001 / 0.015 / 0.007 / 0 / 0 percent. The measure falls with the square of the cells, so 3 `size` (6144, a multiple of 64) would give 0.43 px at most; not rendered.
- Draft stills of the film's own view 2409, 2430, 2447, 2448, 2449 (`cells` 2048, `fine` 1): the curtain walls and streaks of the first bake are gone. 2447 to 2448 and 2448 to 2449 differ by a mean of 10.6 and 10.9 of 255 over the frame (first bake 12.2 and 12.2; the eye moves), no pop seen in the three. Time 38 s, 44 s, 68 s, 67 s, 66 s; without the cap 20 s, 21 s, 36 s (2409, 2430, 2448).
- One still at 3840 by 2160, frame 2448, one sample (`--format uhd --tier draft`), `fine` 0.5: `cells` 4096 takes 234 s, `cells` 2048 takes 108 s. Between the two 6.6 percent of the pixels differ, 0.008 percent by more than 8 of 255, 0.0007 percent by more than 32, largest 55. Read one to one, the rims, the mesa and the horizon show no facet in either. Not a final: one sample, no shutter.

### The swap of sphere for cap in the film's terms (MAIL 431 item 2)

Review tier, capture rate 2, 1920 by 1080, 16 samples a frame, heights of f95c3606, `cells` 2048, `fine` 1, pictures k = 2 times the film frame. The band's top (2.4 radii, frame 2401.8) lies between k 4803 and k 4804: 4803 is the last picture of the sphere alone, 4804 the first with the cap. Mean absolute change of the picture into each k, of 255:

| into k | 4800 | 4801 | 4802 | 4803 | 4804 (swap) | 4805 | 4806 | 4807 | 4808 |
|---|---|---|---|---|---|---|---|---|---|
| with the cap | 3.482 | 4.216 | 5.800 | 7.401 | 8.918 | 10.338 | 11.515 | 11.921 | 11.539 |
| without (`nocap`) | | | | 7.401 | 8.924 | 10.343 | 11.522 | | |

- 4802 and 4803 are byte equal with and without the cap (the cap is built and not drawn).
- The picture with the cap against the picture without it: k 4804 mean 0.031, largest 15, 6.7 percent of pixels differ, 0.05 percent by more than 2, none by more than 8; k 4805 mean 0.032, largest 20; k 4806 mean 0.036, largest 25.
- The swap is 0.35 percent of the change the film makes in that step (0.031 of 8.92). The step into 4804 is 1.8 percent over the mean of its four neighbours (8.918 against 8.764) and 0.5 percent over the mean of the two beside it (8.870), with or without the cap. Under a tenth: it stays, no finer sphere built.
- With the light and the haze of the cap's own surface in (`light: 1, 1`), k 4804 differs from the same picture before them on 0.06 percent of pixels, by 1 of 255.
- Time of a review picture: 25 s before the swap, 84 s after it, 182 s with `light`.

### Light and haze of the cap on Mars (heights of f95c3606, plates that still carry painted light, draft, scratch wiring)

- Haze to the own surface, no light option, against the same frame before: 2448 mean 8.86 of 255, brighter by 8.6, 29 percent of pixels by more than 8, largest 66 (the canyon floor lies down to 0.0022 radii under the datum); 2430 mean 0.67.
- `light: { relief: 1, own: 0 }` on top: 2448 changes on 0.01 percent of pixels, 2430 on 0.3 percent, 2409 on 1.5 percent (largest 72): the close levels of this stop are own levels.
- `light: { relief: 1, own: 1 }` on top: 2448 mean 1.17, 16.6 percent of pixels by more than 2, 3.6 percent by more than 8, largest 86; 2430 mean 1.65, 9.1 percent by more than 8. 2447 to 2448 and 2448 to 2449 differ by a mean of 7.9 and 8.5 (before 10.6 and 10.9). Read one to one at 2448 no facet and no noise is seen on the walls.
- Cost, draft still: 2430 44 s without `light`, 77 s with; 2448 68 s and 113 s (36 s without a cap).
- The strengths are the stop's. With plates without painted light the levels would be lit levels (`own: false`) and `relief` 1 alone lights them.

Not closed: by the measure the gap is under one pixel with `cells` = 2 `size` and under half a pixel only with 3 `size`; no march in the fragment text. The sink is not driven on Mars (numbers of handover_engineer). No picture at the final tier from here. Seen in the pictures and not the cap's: a thin straight crest north of the close ground (the bake, named by its builder), plates softer than the first set.

## 9. The frame factor (NOTE 501): a fade reads an angle, not a pixel

The fault: the colour levels of a globe come in by the texels of the parent a pixel (`uPatchFade`, 1.1 to 1.7, against `gd * scale * size` from `dFdx` and `dFdy`). A pixel of uhd is half as large as one of 16 by 9, so at uhd every level came in at twice the height, at preview at half.

- `src/core/frame.ts`: `frameUniform` (one object for the whole film, `{ value }`, usable as a uniform `uFrame`) and `setFrame(height, master)`. The engine writes it where it sets the size of the drawing buffer (`applySize`): the height of the format over the height of the master, 1 at 16 by 9, 2 at uhd, 0.5 at preview. It is the engine's format, not `view.format`: in the pass that draws a place picture `view.format` is the layout's, larger by the picture's scale, and a factor taken from it would change that picture at 16 by 9.
- `setPass(scale)` and `bufferFrame()`: a place picture is drawn at the format's size times a scale, and the edge limit gives uhd the scale 1 where 16 by 9 has 2, so a pixel of the uhd picture is a pixel of the master's picture. For code that reads a density a pixel of the buffer and does not know the picture's scale (the globe, the far point; the terrain shaders know it as `uFine`) the engine sets, while it draws a place picture, the picture's scale over the scale the master's picture has; `bufferFrame()` is the frame factor times that, 1 in the master's picture and in the uhd picture of today.
- `Planet.update` writes `uPatchFade` as the stop's two numbers over the factor. smoothstep(a, b, x * f) is smoothstep(a / f, b / f, x), so no text changes and at 16 by 9 the two numbers are the stop's own bits. The text hashes of the globe stand. The cap draws with the globe's uniforms and follows.
- Not touched, because it only picks a mip or is a diagnostic: `textureGrad` gradients (`uGrad`), `diagTexelsDir`, `drawn`, the texel plan of `src/core/texel.ts`.
- Already an angle: the cap (`pixel` is a number of the stop, an angle; its grids, its level choice and `uCapFade` read `pixel * distance`).
- `FarPoint` (every stop draws its body as a point from afar with it): the core of the point was 0.9 square pixels of the buffer whatever the format, and the gain read min(radius in buffer pixels, 1). Now the radius is taken in pixels of the master, and above 16 by 9 the core is widened by the factor squared (through `uWide`, which the text already has), so the point has the same angle and the same light at uhd. Under 16 by 9 the core stays a pixel's (a core of half a pixel would fall between the pixels). At 16 by 9 every uniform has the value of before.
- Seen and left, not mine or not in use: `src/bodies/standin.ts` (imported by nothing; line width by `fwidth`, a radius threshold in pixels); `src/core/place.ts` (the weight of a place picture falls by picture texels a frame pixel times the picture's scale; the picture is drawn at the format's size times that scale, so the ratio is the same in every format as long as the scale is; if the edge limit of `caps.ts` gives uhd a smaller scale than 16 by 9 the two differ: the engine's to check); `src/post/chain.ts` (sharpening one pixel wide, grain by the pixel) and `src/space` (dust has its own `height / 1080`).

Measured (`tests/globe-frame.test.ts`, 5 tests in node; `tests/globe-cap.test.ts`, one more in the harness browser): a level whose parent has 1.3 texels a row at 96 rows shows 0.73 of the finer level in the middle; at 192 rows with the factor 2 the same within 0.02, without the factor 1.0; at 48 rows with the factor 0.5 the same within 0.03, without it 0.0.

## 10. Check of a plate pyramid: does a level show its parent's picture (`globe-levels.py`, MAIL 584)

The smooth report judges the pattern that changes in place (a frame against the frame 8 later carried back, both reduced to their detail between 8 and 40 px, limit 0.45). A level that comes in adds to that number whatever it does not share with its parent in that band. `assets-src/shared/globe-levels.py` reads it from the files alone, in seconds, with the report's own function (`pattern` of `tools/img/smooth.py`) and the report's numbers from the config: each level against the part of its parent that it covers, both reduced to the state in which the level comes in (a parent texel 0.8 px of the frame, `--texel`).

`python3 assets-src/shared/globe-levels.py --dir public/assets/ID/full --json src/stops/ID/FILE.json [--key levels] [--suffix -dive] [--pairs 0-1,1-3] [--panel out.png]`, or the levels by hand: `--level FILE:WIDTHDEG[:EASTDEG,NORTHDEG]` twice or more. One line a pair; the exit code is 1 when a pair is over the limit. The panel shows parent, child and the judged pattern (white is 1). A pair is a test only when both files are the same kind of picture (colour with colour).

Measured on main b0035c5c: Mars's eight levels 0.06, 0.00, 0.06, 0.00, 0.00, 0.00, 0.00; Uranus's three patches 0.00, 0.00. Controls on Mars's patch-42 and patch-19: the child's width given as 21 in place of 19 degrees 1.51; the child moved 0.3 degrees east 1.08; an unrelated child (place-0p3) 1.41.

### The named trees (MAIL 591 item 2)

99th percentile of each level against its parent, limit 0.45, the files of each stop's proof tree:

- Mars b83618ec (patch-wide 96, patch-42, patch-19, land-8p5, land-3p8, land-1p6, land-0p7, land-0p3): 0.06, 0.00, 1.19 OVER (patch-19 under land-8p5: a bright mound with a crater where the child shows the dark plain with the canyon), 0.09, 0.69 OVER (in the outer tenth of land-1p6), 0.59 OVER, 0.98 OVER.
- Mercury 9b5f55cd (patch-1 76, patch-2 38, patch-3 19, patch-4 9.5; the rise's patch-3r, patch-4r): dive 1.09 OVER, 0.02, 0.02; rise patch-2 to patch-3r 0.70 OVER, patch-3r to patch-4r 0.01.
- Uranus 9a369939: patches 0.00, 0.00; place plates 0.00, 0.01, 0.00.
- Venus 3b52b0eb, pairs of one kind only: colour w to c 0.01 (dive), 0.02 (rise); light a to b 0.20, 0.13; light b to d 1.12, 1.10 OVER (the two have different colour partners, and 13 to 19 percent of the crop is judged: read with care).
- Not run: Saturn, Jupiter, Earth, Neptune, the Sun.

A pair over the limit says that the two files do not show one picture. It does not say that the film is red there: see the next part.

### What is red in Mars's dive at 2449 (MAIL 591 item 1)

The smooth report of Mars's named tree is red in the dive: the pattern changes in place by 1.27 from frame 2449 (limit 0.45). Measured with the report's own tool (pictures part, rate 2, body mask, draft) on b83618ec, cut to the capture frames 2449 to 2465.5, so 18 starts 2449 to 2457.5, each against the frame 8 film frames later. The parts were switched in a scratch tree by a query word in Mars's set (never committed). Largest of the 18 starts, and how many are over:

| run | what is drawn | largest | over |
| --- | --- | --- | --- |
| a | one texture: no levels, rim, grazing terms, air, cap, storm, relief shading, vignette, moon | 0.32 | 0 |
| d | a plus the plate levels | 0.25 | 0 |
| f | a plus the levels plus the relief cap | 0.25 | 0 |
| i | the film with the air alone off | 0.25 | 0 |
| b | a plus rim, grazing terms and air | 0.57 | 5 |
| h | a plus the levels plus rim, grazing terms and air | 1.46 | 12 |
| e | the film without the relief cap | 1.46 | 14 |
| c | the film as it is (the globe alone gives the same 34 frames, byte for byte) | 1.27 | 18 |

One part of the air off at a time in run h: shells (shell, halo, glint) off 1.46; grazing terms off 1.46; rim (`uLimb`) off 1.46; ground haze of the globe off (`uHazeTau` 0) 0.24, green. Run h with main's three numbers of `near.json` in place of the head's (hazeDay 0.25 for 0.4, hazeDepth 0.8 for 0.6, hazeScaleHeight 0.15 for 0.6) 1.45, 18 over. The film itself with main's three numbers: 1.34 at 2453, 18 over.

- No frame of the span shows a limb: the globe fills the frame (eye 0.032 down to 0.010 radii). The worst 1 percent of run c is one clump of far ground at the top edge of the frame (0.05 to 0.07 of the height from the top), seen 66 to 80 degrees off straight down.
- At the five starts looked at (runs a, b, d and twice c) the worst 1 percent lies where the picture has little detail and at the border of the judged area: contrast there 1.2 to 2.0 display values against the measure's floor of 1 (median of the judged 2.6 to 8.7), 84 to 100 percent of it within 10 px (of 270) of the border. In run c the judged pixels with a contrast over 3 (45 percent of them) read 0.07 at 2449 and 0.14 at 2453; in run b the same cut reads 0.45.
- The line: the ground haze in the fragment of `planet.ts`, `col = col * exp(-tau * uExtinction) + hazeLight(n, dir) * (1.0 - exp(-tau))`, with the depth `uHazeTau` that Mars's set drives by height. With it off the film is green; the head's three air numbers are not the cause.
- Main's Mars (b0035c5c, the old place) on the same pair reads 0.12 (whole frames, no mask; the named tree read the same way 1.05). Its dive looks at ground with strong detail up to the top of the frame; the head's dive (plan.ts headingDeg -245 for -105, new plates) looks across a plain with little detail, which the haze takes down to a contrast of 1 to 2 display values as the eye sinks.
- Not decided here: whether that is a fault of the picture or of the floor and the border of the measure. The measure is harness_builder's.

## 11. The turn of the body: cosine and sine from the page (`exactSpin`)

Found by mars_place_builder: the ground of the cap lay lower than its heights say, by one amount per move (dive T 0.000150 radii, rise T 0.000205). The cause: the vertex program of the cap turned its ground by `cos(uSpin)` and `sin(uSpin)` of the renderer, and on the film's renderer (ANGLE on SwiftShader) those two are not a cosine and a sine of one angle. Measured in the harness browser, vertex and fragment programs alike, c * c + s * s - 1 and c and s against `Math.cos` and `Math.sin`:

| spin (rad) | c * c + s * s - 1 | c - cos | s - sin |
| --- | --- | --- | --- |
| 0 | 0 | 0 | 0 |
| 0.02 | -1.0e-4 | -4.9e-5 | -2e-6 |
| 0.079 (Mars dive T) | -2.92e-4 | -1.43e-4 | -1.0e-5 |
| 0.187 (Mars rise T) | -3.78e-4 | -1.86e-4 | -2.2e-5 |
| 0.5 | -2.6e-5 | -1.0e-5 | -6e-6 |
| 1.0 | 4.1e-5 | 1.0e-5 | 1.8e-5 |
| 3.5 | -2.02e-4 | 1.00e-4 | 2.2e-5 |
| 5.0 | -2.96e-4 | -2.6e-5 | 1.47e-4 |

(one step of the reading is 2e-6.) Half of the second column is the amount the cap's sphere was too small: 1.46e-4 at 0.079 and 1.89e-4 at 0.187.

Two changes:

- The cap, always: `Planet.update` sets `uSpinTurn` (cos and sin of the spin from `Math`) and the vertex program of the cap turns its ground by it. No stop on main draws a cap, so no frame on main moves; a stop with a cap gets its ground on the sphere.
- The colours, only for a stop that sets `exactSpin: true` in the options of `Planet`: the fragment text of the globe and of the cap takes `uSpinTurn` in place of `cos(uSpin)` and `sin(uSpin)` (one line shorter, no `uSpin`). Without the option the text is the old text to the byte.

Why a stop with a place wants `exactSpin`: the fragment turns the direction of a pixel by the renderer's pair, so east and depth are scaled by the pair's length and the north component is not. The base map reads its latitude from the north component alone and does not move; the plate levels, the centres, the storm and the cut of the cap read the direction as it is, and slide north or south by about half the second column times sin times cos of the latitude, and east by the pair's angle error. This changes with the spin, so with time.

Measured (`tests/globe-cap.test.ts`, a green square 0.02 degrees wide on a flat cap, eye 0.001 radii straight above the true spot, 96 rows of 40 degrees; the square is 46 px wide when the ground lies on the sphere):

| spin | cap before, width | cap now, width | colours of the renderer, spot at 45 north, centre off by | the same at the equator | `exactSpin`, both |
| --- | --- | --- | --- | --- | --- |
| 0 | 46 | 46 | 0 | 0 | 0, width 46 |
| 0.079 | 40 | 45 | 9.5 px north to south | 0.5 px east to west | 0, width 46 |
| 0.187 | 38 | 45 | 12.5 px | 1.5 px | 0, width 46 |

(40 of 46 px at eye 0.001 is a ground 1.5e-4 too low, 38 is 2.1e-4: the builder's numbers.) Without `exactSpin` the heights of a cap (turned exactly) and its colours (turned by the renderer) do not lie on each other: at Mars's latitude and spin about 2e-5 to 4e-5 radii, which at an eye of 0.0017 radii is more than 1 percent of the height.

`exactSpin` moves bytes of every frame of the stop that sets it (the colours shift by the amounts above, far under a pixel from orbit). The other way to the same end, inside a stop: the turn in the mesh's quaternion and a spin of 0 handed to `update`; at spin 0 the renderer's pair is exact. `src/bodies/globe.ts` and `src/bodies/standin.ts` still turn by the renderer's pair (far views); not changed.

## 12. The floor of the pattern measure in a rise (TASK 697, MAIL 704, MAIL 710): the cure that keeps the band, for `tools/img/smooth.py`

Not a globe option. The measure belongs to harness_builder; this is the proof and the patch asked of this notebook. Limit 0.45, the statement of the measure and every key of `smooth.pictures` stand as they were. MEASURED, STATED and UNKNOWN are kept apart; a number without a word is MEASURED here, draft tier, rate 2, with the tool's own functions.

### The cause (MEASURED)

`change()` chains 16 flows of the quarter size frames and carries the later frame back onto the earlier one. On rigid sequences made from Jupiter's frame k 6539 (nothing changes in place) the chain ends 0.6 to 1.0 quarter px beside the true place in the later frame (median; 99th percentile 2 to 3). Where the later frame shows the ground z times smaller, the way back enlarges that error z times: 0.8, 1.4, 2.5, 3.4, 5.3, 7.5 quarter px at z 1.3, 2, 3, 4, 6, 8, against a fine width of 2. Reading of the same sequences: 0.09, 0.13, 0.25, 0.42, 0.73, 1.17 with the chain; 0.00, 0.00, 0.02, 0.05, 0.17, 0.35 with the true map; 0.000 to 0.004 with the true map and the later frame at full size. Speed alone (0 to 80 px a capture frame at z 1 to 2) reads 0.18 or less; dives read 0.05 or less; the reading is the same whichever end of the sequence is the sharp one.

### What was not taken (d236)

The first patch (eb2975a6) made both widths of the detail as many times wider as the carried frame is enlarged. It cured the floor and hid an exchange of detail finer than 8 px times the enlargement (handover_engineer's rig: a whole exchange at 16 px read 0.10, 0.09, 0.09 at z 2, 3, 3.7, a cut 0.08). `matched` is gone again.

### The cure

The widths stay 8 and 40 px. What changes is the picture the farther frame is carried from, and which frame the pair is read on.

- `carry(fw, bw, i, n, first, last, back)`: the map of the chain as `change()` made it, or the same chain run the other way (`back`), which carries frame i onto frame i + n. `change()` takes the map as `way` and returns its three values as before.
- `enlarged(mx, my, ok, wide)`: how many times larger the carried frame is drawn, per pixel, from the slopes of the map averaged over the wide width.
- `finer(full, scale, mx, my, step, levels)`: the carried frame taken from a picture `2^(step / 2)` times finer than the quarter size, reduced from the full size frame by area, the full size at most.
- `sharper(a, moved, full, scale, mx, my, ok, grown, sigma)`: where the carried frame is enlarged by 1.19 or more it is carried again from the finer picture of the nearest half step, and the map is set right by `SETTLE_ROUNDS` (3) rounds of one more flow between frame a and the carried picture, at the finest scale of the flow, smoothed over the change blur (5 quarter px). Where the frame is not enlarged the carried picture is `moved` to the bit.
- `readings(...)`: the onward reading (frame i against frame i + n carried back, cured when the carried frame is enlarged on the whole, median 1 or more) and, where frame i + n is the nearer one (the frame carried back is drawn smaller than 0.84), a second reading from the other end: frame i + n against frame i carried onto it from its finer picture, on the pixels where that one is enlarged by 1.19 or more.
- `reading(onward, back, scale)`: the number of the pair is the larger of the two 99th percentiles, with its place in frame i, the share judged, and the band at that place.
- `band(grown, scale, fine)`: the width in px of the nearer frame under which the window read nothing. 8 px where the carried frame is as large as it was or comes from a finer picture; beyond an enlargement of 4 the full size of the farther frame is not fine enough and the band is 8 times a quarter of the enlargement (10.6 px at 5.3); where the carried frame is drawn smaller (a dive read on its first frame) 8 px divided by that.
- `pictures()` gives `patternBand` beside `pattern`; `tools/smooth.ts` prints it in the why of a pattern red, in the line of the largest change of the pattern, and as a column `band px` of the table. `changes()` shows the cured carried picture and, when there is one, a second row for the reading on the later frame.

STATED: with no enlargement and no shrink over 1.19 nothing of this runs, and every pixel of the pattern is main's. In a pair that dives on the whole the onward reading is left as main has it, so a dive never reads less than on main; it reads more where the reading on the nearer frame is larger.

Tried and left (MEASURED on the rig's Mars map): one round of the default flow leaves a clean rise at 0.40 at z 4.4 and 0.53 to 0.58 at 5.3; a flow at the finest scale that is not smoothed follows the exchange and reads a cut at z 2 as 0.44; widths that grow by z / 4 beyond 4 lower the exchanges at 5.3.

### The rig's cases (handover_engineer's `rig.py`, Mars `wrap-color.jpg`, 1920 by 1080, 17 capture frames; read by `readings()` and `reading()`)

Each cell: main, then the cure. Main is `m697/old/smooth.py`, the text of ed003c70. Rise:

| case | z 2 | z 3 | z 3.7 | z 4.4 | z 5.3 |
|---|---|---|---|---|---|
| nothing exchanged, the first ground | 0.120, 0.012 | 0.337, 0.050 | 0.470, 0.072 | 0.700, 0.080 | 0.857, 0.100 |
| nothing exchanged, the second ground | 0.167, 0.019 | 0.558, 0.086 | 0.616, 0.107 | 0.801, 0.099 | 0.911, 0.145 |
| whole exchange, 16 px | 0.617, 0.553 | 0.825, 0.688 | 0.914, 0.765 | 0.954, 0.778 | 0.990, 0.835 |
| whole exchange, 32 px | 1.030, 0.807 | 1.106, 0.956 | 1.212, 0.961 | 1.224, 0.960 | 1.168, 0.891 |
| whole exchange, 64 px | 1.359, 0.971 | 1.339, 1.076 | 1.288, 1.043 | 1.286, 1.056 | 1.248, 1.030 |
| whole exchange, 128 px | 1.440, 0.924 | 1.429, 1.117 | 1.391, 1.144 | 1.312, 1.091 | 1.300, 1.065 |
| cut in one frame, 16 px | 0.617, 0.521 | 0.778, 0.712 | 0.933, 0.736 | 0.933, 0.872 | 0.970, 0.823 |
| first half, 16 px | 0.248, 0.228 | 0.528, 0.424 | 0.582, 0.456 | 0.721, 0.437 | 0.860, 0.515 |
| second half, 16 px | 0.213, 0.207 | 0.490, 0.244 | 0.613, 0.310 | 0.791, 0.400 | 0.875, 0.293 |
| middle half, 16 px | 0.223, 0.227 | 0.502, 0.328 | 0.533, 0.363 | 0.727, 0.357 | 0.835, 0.390 |
| middle half, 32 px | 0.419, 0.411 | 0.573, 0.495 | 0.670, 0.573 | 0.746, 0.587 | 0.834, 0.519 |
| middle half, 64 px | 0.629, 0.617 | 0.674, 0.625 | 0.722, 0.638 | 0.815, 0.660 | 0.880, 0.615 |

Dive (main judges 25, 11, 7, 5 and 3 percent of the frame at z 2 to 5.3; the reading on the nearer frame judges 96 to 100 percent):

| case | z 2 | z 3 | z 3.7 | z 4.4 | z 5.3 |
|---|---|---|---|---|---|
| nothing exchanged, the first ground | 0.016, 0.016 | 0.029, 0.050 | 0.028, 0.072 | 0.037, 0.080 | 0.121, 0.121 |
| nothing exchanged, the second ground | 0.030, 0.030 | 0.051, 0.086 | 0.054, 0.107 | 0.087, 0.099 | 0.220, 0.220 |
| whole exchange, 16 px | 0.096, 0.598 | 0.099, 0.758 | 0.118, 0.757 | 0.079, 0.857 | 0.204, 0.812 |
| whole exchange, 32 px | 0.389, 0.805 | 0.424, 1.010 | 0.431, 0.961 | 0.254, 0.955 | 0.248, 0.921 |
| whole exchange, 64 px | 1.109, 1.109 | 0.859, 1.081 | 0.921, 1.064 | 0.616, 1.012 | 0.562, 1.007 |
| whole exchange, 128 px | 1.384, 1.384 | 1.175, 1.175 | 1.172, 1.172 | 0.926, 1.061 | 0.897, 1.046 |
| cut in one frame, 16 px | 0.098, 0.563 | 0.088, 0.851 | 0.110, 0.797 | 0.107, 0.869 | 0.182, 0.801 |
| first half, 16 px | 0.031, 0.244 | 0.038, 0.418 | 0.049, 0.451 | 0.031, 0.479 | 0.073, 0.468 |
| second half, 16 px | 0.038, 0.219 | 0.075, 0.323 | 0.087, 0.384 | 0.092, 0.350 | 0.085, 0.357 |
| middle half, 16 px | 0.030, 0.282 | 0.060, 0.375 | 0.058, 0.406 | 0.057, 0.396 | 0.179, 0.370 |
| middle half, 32 px | 0.115, 0.445 | 0.152, 0.516 | 0.193, 0.573 | 0.078, 0.587 | 0.206, 0.533 |
| middle half, 64 px | 0.378, 0.625 | 0.308, 0.662 | 0.341, 0.662 | 0.191, 0.671 | 0.232, 0.593 |

- Bar (2): nothing exchanged reads 0.145 at most in a rise and 0.220 at most in a dive (that one is main's own reading on 3 percent of the frame at z 5.3; the reading on the nearer frame is 0.145 at most). Room under 0.45: 0.23.
- Bar (3): a whole exchange at 16, 32, 64 and 128 px reads 0.553 at the least in a rise (z 2, 16 px; main 0.617) and 0.598 in a dive (z 2, 16 px; main 0.096). A cut in one frame reads 0.521 at the least in a rise (z 2; main 0.617) and 0.563 in a dive (main 0.098). Room over 0.45: 0.07.
- Half an exchange at 16 px reads 0.21 to 0.52 in a rise and 0.22 to 0.48 in a dive; the middle half at 32 px 0.41 to 0.59, at 64 px 0.59 to 0.67. Not run: first and second half at 32 and 64 px, any half at 128 px.
- Six of the cases run again with the code as committed give the same pattern values to the digit. The band column was not kept from this run: it printed the middle band, the tool prints the band at the place.
- The cure took 0.2 to 0.4 s a pair on a free machine (1.1 s at most beside two other jobs), plus 0.12 s to read one full size frame; a row is read once or twice.

### The made proofs (`tools/smooth/made.py carried`, seed 710; `tests/smooth.test.ts`, eleven tests)

Full size frames 960 by 540 of a ground with detail at every width, 17 capture frames, read at a quarter. Shrink 2, 3, 3.7, 4.4, 5.3.

1. Nothing changes, rise: main 0.169, 0.281, 0.301, 0.471, 0.552; now 0.016, 0.028, 0.051, 0.052, 0.077. Dive: main 0.076, 0.157, 0.226, 0.200, none (it judges 24, 10, 6, 4 and 1 percent); on the nearer frame 0.016, 0.028, 0.055, 0.044, 0.078; the pair reads the larger, 0.076, 0.157, 0.226, 0.200, 0.078.
2. Whole exchange at 16, 32, 64 px, rise: main 0.82 to 1.36; now 0.69 to 0.75 at 16 px, 0.91 to 1.01 at 32 px, 0.91 to 1.09 at 64 px. Dive at 16 px: main 0.335, 0.216, 0.204, 0.345, none; now 0.717, 0.749, 0.742, 0.809, 0.719. At 32 px now 0.94 to 1.09, at 64 px 1.00 to 1.28.
3. Cut in one frame at 16 px, rise: main 0.80 to 0.93, now 0.69 to 0.82. Dive: main 0.496, 0.253, 0.242, 0.263, none; now 0.706, 0.803, 0.785, 0.761, 0.782.
4. Half an exchange, rise: 0.33 to 0.36 at 16 px, 0.61 to 0.64 at 32 px, 0.71 to 0.72 at 64 px.
5. No shrink (still, pans of 8 and 32 px, exchanged, half, cut): every pixel of the pattern equal to main's, the number and the judged share equal, no second reading. Every dive case: the onward pattern equal to main's in every pixel.
6. The band at the place of the reading: 8.0 px to z 3.7; 8.0 to 9.5 at 4.4; 9.2 to 11.5 at 5.3; 15.8, 23.9, 29.7, 35.0 px where a dive's number is main's reading on the first frame (z 2 to 4.4). The enlargement read from the flows lies within a tenth of the shrink.
7. Through `pictures()` from files at z 4.4: rise 0.048, dive 0.228 (main's reading, band 34.9 px), rise with a whole exchange 0.711, dive with a whole exchange 0.763.

### Real frames (looks `six-<tag>`: the two frames, the carried picture, the pattern, the map as a grid over the enlargement)

| row | tree | main | onward now | on the later frame | reads | band at the place | enlargement 1st, 50th, 99th percentile |
|---|---|---|---|---|---|---|---|
| Jupiter rise 3261 + 1/2 | `builder/proof-ju3` 062c4d01 | 0.690 at 300, 1076 | 0.272 | 0.116 on 2.6 percent | 0.272 at 316, 1072 | 11.1 px | 0.83, 2.30, 5.29 |
| Mercury dive 746 + 1/2 | `builder/proof-me3` 93607f34 | 1.019 at 924, 64 | equal to main | 0.251 on 60 percent | 1.019 at 924, 64 | 8.0 px | 0.48, 0.80, 1.18 |
| Neptune dive 4696 | main 2bc36ce6 | 0.716 at 628, 136 | equal to main | 0.450 on 52 percent | 0.716 at 628, 136 | 8.0 px | 0.68, 0.78, 1.05 |
| Venus rise 1543 | main 2bc36ce6 | 1.151 at 240, 744 | 0.593 | 0.764 on 3.7 percent | 0.764 at 159, 355 | 8.0 px | 0.80, 1.41, 2.12 |
| Venus dive 1282 + 1/2 | main 2bc36ce6 | 1.012 at 612, 132 | equal to main | 0.245 on 58 percent | 1.012 at 612, 132 | 8.0 px | 0.57, 0.72, 1.44 |

- Jupiter 3261 + 1/2 goes green: over 0.45 on 0.041 of the judged area on main, 0.001 with the cure (one spot at the bottom edge). No judged pixel is lost in any of the five rows.
- The three dives keep main's number: the red lies in the band under the limb, where the far ground is not enlarged in either frame. On the nearer frame the rest of the ground reads 0.25, 0.45 and 0.25.
- Venus 1543 stays red. Onward, lower left of the frame (crop `crop-ve1543-onward`): the first frame has small bright clumps there, the later frame smooth streaks, carried from the quarter size and from the finer picture alike. On the later frame, at the far ground under the horizon (crop `crop-ve1543-back`): the later frame has fine speckle where the first frame has smooth haze. STATED: both are a change of the picture in place, not the floor. UNKNOWN which layer of the stop draws either.
- Not read with the cure: Jupiter rise 3255, Neptune dive 4723, Mars dive 2466 (frames deleted for disk), Mercury rises 981 + 1/2 and 1009 (render stopped unfinished). UNKNOWN: any whole report; none was run.

### The dives: what changes in place (a finding, nothing changed in a stop's folder)

A rigid sequence through the same poses does not read red there. One real frame of the row laid on the unit sphere of its pose and seen through the 17 poses of the row:

| row | the film | first frame laid on the sphere | last frame laid on the sphere |
|---|---|---|---|
| Mercury dive 746 + 1/2 | 1.02 | 0.16 | 0.22 |
| Neptune dive 4696 | 0.72 | 0.20 | 0.16 |

So no row leaves the judged area. Where the film reads over 0.45:

| row | px from the limb, first frame (median; 10th to 90th percentile) | px from the limb in the later frame | 99th percentile by distance from the limb: 0 to 40, 40 to 80, 80 to 160, 160 to 320, over 320 px |
|---|---|---|---|
| Mercury dive 746 + 1/2 | 120; 72 to 205 | 55; 32 to 96 | none, 1.16, 1.10, 0.93, 0.19 |
| Neptune dive 4696 | 82; 41 to 130 | 71; 38 to 118 | 1.36, 1.26, 0.71, 0.23, 0.21 |

Seen in the crops (looks `pair-me746`, `pair-ne4696`): what changes in place is the band that rides with the limb and not with the ground. The ground that reads red comes nearer to the limb within the 8 film frames, a median 120 to 55 px in Mercury's row and 82 to 71 px in Neptune's, and the band of the limb comes to lie on it.
- Neptune 4696: the rim of the air at the upper left limb of the whole globe. The place of the reading (628, 136) lies 34 px inside the limb in the first frame and 27 px inside it 8 film frames later, at 552, 32 of that frame, 32 px from its top edge. The rim is a bright blue band about 40 px wide with a dark line inside it; the cloud wisps of the ground pass under it. UNKNOWN which part of the air draws the dark line.
- Mercury 746 + 1/2: the light along the limb. In the first frame bright arcs and streaks along the limb over the far ground; 8 film frames later that ground lies 25 px from the limb under a smooth bright band. UNKNOWN which of the stop's layers that are tied to the limb draws it (`rim`, `limb`, `silhouette`, `spill`, `haze` in `src/stops/mercury/set.ts`); the pyramid and the place picture are not what is seen there.


More rows, read with the first patch (the cure was not run on them):

- Mars dive 2466 (`builder/proof-mt3` 1483daf1): 1.294 at 900, 872; judged 0.42; 0.53 of the judged area over 0.45, spread over the whole ground; rigid through its poses 0.25 and 0.24. Over film frames 2466 to 2474 the globe's ground (smooth dune like land round the canyon) gives way to the close set (crisp layered cliffs) over the whole frame, half way at 2470; a straight edge of the close set stands in the lower left corner (pale wedge) and the lower right (dark wedge) at 2472 and 2474. Looks `ma2466-five`, `ma2466-both`, `pair-ma2466`.
- Neptune dive 4723: 1.116 at 740, 580; judged 0.41; 0.46 of the judged area over 0.45, not at the limb; rigid 0.07 and 0.10. The whole ground is exchanged: the globe's broad white cloud streaks for the place picture (dark storm, spiral, ridge clouds).
- Jupiter rise 3255: 0.623 at 1540, 392 on main, 0.552 with the first patch; its first frame laid on the body read 0.562 and 0.284; over 0.45 mostly within 160 px of the limb.
- Venus dive 1282 + 1/2: 1.012 at 612, 132, in the band under the limb at the top of the frame, as in Mercury's and Neptune's dives. UNKNOWN what draws it; no crop of the limb was made.

### What is still wrong

- Beyond z 5.3 nothing was measured. The full size of the farther frame is the finest picture there is; beyond 4 the band widens with the enlargement and the report says so.
- The enlargement at one place lies up to 13 percent beside the true one in the made films, so the band printed beyond z 4 does as well.
- A dive is read twice and its number is the larger. Where main's reading of the first frame stands, the band printed is that of main's window at that place (8 px times the shrink there), and the reading on the nearer frame is not printed beside it.
- The second reading leaves out the ground that is not enlarged by 1.19 in the nearer frame; there the pair is read as on main.

## 13. The range picture and the pose record (MAIL 741, MAIL 744): what the camera's map of the pattern reader reads

For a pair of capture frames of a dive or a rise the reader first carries one picture onto the other by the camera's own map, and lets the flow find only what is left. The map needs, for each pixel, how far the surface is, and for each frame where the camera stands and how the body is turned. Both come from here.

**The view.** `diag=range`, a raw view like `depth` (code 6 in `src/diagnostics/diag.ts`, handover_engineer's file; the change is one entry of the list, two constants, one branch of `diagOut` and the reader `rangeOf`). Asked like a beauty frame of the capture page: the same grid, one sample at the pixel's middle (`src/core/jitter.ts`) and the middle of the shutter, no blur, bloom, tone map or grain. The old view `depth` is not changed (one grey channel, `log2(1 + range) / 14`, one level is 3.9 percent of the range, too coarse to carry a pixel).

**The packing.** 24 bits in 8 bit colour, no extension: `n = 1 + floor(16777214 * clamp((log2(d) - RANGE_LOW) / RANGE_OCTAVES, 0, 1))`, `R = n >> 16`, `G = (n >> 8) & 255`, `B = n & 255`, alpha 255. `RANGE_LOW = -20`, `RANGE_OCTAVES = 32`: from 2^-20 to 2^12, one step is 1.3 millionths of the range. `n = 0` (black) is no surface: the sky and all that discards in a raw view (rims, veils, limbs, glare, the Sun's plate). `d` is the range along the pixel's ray from the lens (`length(vView)`), not z.

**The units.** A layer hands its range in its own units. The globe hands radii of the body. A layer of the close view hands the close view's units, also where it is drawn on the globe side: Jupiter's cloud layer at 3261 (view `orbit`) reads 332 times the sphere's range, sphere over picture median 0.0030107, the plan's twin scale 0.0030101. So the record names the units a layer may use, `[1, close]` with `close = plan.twinFrame(time).scale` (`[1]` where the twin has none: Saturn), and `points` of `tools/img/range.py` takes for each pixel the one that puts the point nearest the body's surface. The two lie 60 to 970 times apart by stop (close: sun 0.08088, mercury 0.016218, venus 0.018407, earth 0.030751, mars 0.0010305, jupiter 0.0030101, uranus 0.015133, neptune 0.023924). The pick is a guess where a layer stands far off the surface; the cure at the root is that every close layer hands radii (MAIL 752: one token a stop, patches to the Builder, after this commit).

**The record.** `poseRecord(film, plan, k, rate, fps, size)` in `tools/smooth/pose.ts` (harness_builder's folder, written here for it to lift; no page and no engine change, it calls `carriedCamera`, `film.shotAt` and the plan's turn). Per capture frame: `k`, `rate`, `time` (middle of the shutter), `view`; `camera` `p`, `q`, `vfov`, `width`, `height` in the frame of the stop's set, radius 1, the close view through the plan's twin, so both sides of the change of view stand in one frame; `sky.q`, the sky as the film draws it, `inverse(shot.skyTurn) * shot.skyQuaternion` (not the camera's turn: the sky has its own camera and its frame turns by `skyTurn`); `range` `low`, `octaves`, `units`; `bodies`, one entry: `id`, `place`, `turn` (`plan.drawn(time)` where the plan has one, as Mercury's, whose globe is drawn with it; `plan.turn(time)` elsewhere), `scale` and `axes` (the globe's fit, an oblate body), and `shape` where the plan hands one (section 16; the key is absent elsewhere). The further bodies of a stop and the lens of a stop that turns its world about the lens: section 17.

**The rule.** A point X of frame i stands in frame j at `place_j + S_j turn_j (turn_i^-1 (S_i^-1 (X - place_i)))`, S the `shape` of the record as a 3 by 3 matrix, the unit where the record names none. `tools/img/range.py`, pure functions with the picture and the record as inputs: `ranges` (the picture to ranges), `rays`, `points` (the point of each pixel in the pose frame and the unit taken), `carried` (the pixel place and the range in the other frame), `sky` (the same for what has no range, by the rotation alone), `read`.

**How a tool asks.** `openCapture({ dist, format, assets, diag: 'range' })` and a render of the capture frame at the draft tier, the same call as for the beauty; `npm run still -- --frame F --tier draft --diag range` for a film frame.

**Measured** (tree 1924a104 plus the view, draft, 1920 by 1080, rate 2, no flow; the check script carries the second picture onto the first by `carried` and reads the mean absolute level difference on the pixels that land on the same surface, range there within 1 percent):

| pair (capture frames) | surface of the frame | same surface there | way median, p99 px | as it is | carried | unit 1, close |
| --- | --- | --- | --- | --- | --- | --- |
| Jupiter 6522 to 6523 | 0.924 | 0.921 | 23.5, 89.7 | 17.43 | 2.37 | 0.000, 0.924 |
| Jupiter 6522 to 6538 | 0.924 | 0.911 | 303, 718 | 50.18 | 14.08 | 0.000, 0.924 |
| Uranus 8794 to 8795 | 0.585 | 0.584 | 16.1, 69.1 | 3.08 | 1.53 | 0.585, 0.000 |
| Uranus 8794 to 8810 | 0.585 | 0.584 | 234, 701 | 19.92 | 15.90 | 0.585, 0.000 |
| Uranus 8810 to 8826 | 0.635 | 0.635 | 250, 718 | 27.06 | 25.28 | 0.635, 0.000 |

- Uranus's range picture is the sphere's: sphere over picture p1 0.999827, median 1.00001, p99 1.00602 at 8794. What is left there after the carry is not a way on the screen: white clouds that come in by a weight at their place, and the level of the air near the limb, which changes with the height (0.031 radii at 8794, 0.181 at 8826).
- Made body (a flattened body that turns, in `tests/globe-range.test.ts`): the point is found within 1.2e-6 radii, the place in the other frame within 2.3e-5 px.

**Not measured.** What Saturn's ring sheet, Uranus's deck, Mercury's globe and Neptune's layers hand as units. Whether the close view's own sky is fixed to the frame of `sky.q`. A layer that comes in by a weight is in a raw view only from one half on, and parallax relief hands the range of its mesh (stated by handover_engineer).

## 14. The pale air beyond the edge (`limbAir`, MAIL 744 B b): a look only, off by default

What it is for. On Mars's hold the grazing air of the globe ends with the sphere: at the lit limb the pale air stops on one pixel, the sharpening of the post chain draws a dark line outside it and the edge shows its steps (frame 2325, final, row 560: 453, 430, 685 as the sum of the three channels across the edge; the approved hero in its own pixels, 1.467 of the film's: 443, 479, 563, 643, 668).

What it does. `src/bodies/limb.ts`, class `LimbAir`: a sphere of radius `1 + top * height` around the planet, back side, drawn after the globe and the shells (render order 6), premultiplied over what stands there (source one, destination one minus alpha; the alpha of the target is not written), no depth written. Each ray takes its nearest point to the centre; with `h` the height of that point above the unit sphere the share of the pale air is `1 - exp(-depth * exp(-h / height) * day * side)`, `depth`, day, side and the three colours being the planet's own grazing air (the same uniform objects, so what a stop sets per frame on the planet reaches the limb). At `h = 0` the share is the globe's own at its edge. In a raw view and without grazing depth it discards.

How a stop turns it on: `new Planet({ ..., grazing, limbAir: { height, top } })`, both numbers in the stop's own params. `height` is the scale height in radii, `top` the number of scale heights the sphere reaches (8 in the look). Without `grazing` the constructor throws. Without `limbAir` nothing is made and no text of the planet's shader changes (`tests/globe-limb.test.ts` holds the hash of the text).

Measured, Mars 2325 final, scratch only (a query word in a scratch copy of Mars's set, not in the repository): the disc has a radius of 605.6 px. Row 560 across the edge, sum of three channels: off 453, 430, 685, 651; height 0.0005: 461, 615, 663, 651; 0.001: 462, 555, 638, 659; 0.002: 454, 505, 564, 619, 645, 657; 0.004 and 0.008 read as a soft band of 10 and more px. Against the off picture at height 0.001: the pixels that change by more than 3 of 765 all lie between 600 and 620 px from the centre; everywhere else the largest change is 3 (the post chain's glow). Pictures: looks folder engine-globe, "Mars 2325 final, lit limb".

Which stops it can serve: only Mars builds its globe with `Planet` of `src/bodies`. Jupiter, Saturn, Venus and Neptune take pieces of `src/bodies/haze` and draw their limb in their own globe shader; Sun, Mercury, Earth and Uranus take nothing of the limb from `src/bodies`.

Not done: no stop turns it on; the dive and the rise were not rendered with it; the night side and the terminator were looked at only in the one frame.

## 15. What counts pixels, and what counts the texels of the loaded set (MAIL 795, d253)

The law. (a) Whatever counts screen pixels goes through the frame factor (`src/core/frame.ts`, section 9), so a capture at 3840 by 2160 is the picture of the render at 1920 by 1080. (b) The asset set must not move the moment at which a level, a patch or an exchange arrives: both sets count the full set's texels, the web set is only softer.

How I looked. Every line of `src/bodies` (11 files), `src/terrain` (3 files) and `src/core/sets.ts` that holds one of: `dFdx`, `dFdy`, `fwidth`, `textureGrad`, `textureLod`, `textureSize`, `texelFetch`, `gl_FragCoord`, `gl_PointSize`, `gl_PointCoord`, `view.format`, a height or a width of a format or of an image, `1080`, `pixel`, `px`, `texels`, `lod`, `anisotropy`; then the shader text around each hit and the code that fills its uniforms.

(a) Found, by file:

- `planet.ts`: the colour levels come in by the texels of the parent a pixel (`gd`, `thin`, `cap` from `dFdx`, `dFdy`). Through the factor since d193 (`uPatchFade` over `bufferFrame()`, `tests/globe-frame.test.ts`).
- `cap.ts`: the height levels, the grids and the mip of the heights read `pixel * distance`. `pixel` is the stop's own number, an angle (Mars gives the field of view over 1080), not the pixel of the buffer. Nothing to cure.
- `farpoint.ts`: the radius is taken in pixels of the master, the core is widened by the factor squared, the size of the point follows the format's height. Through the factor since d193.
- `limb.ts`, `haze.ts`, `air.ts`, `atmosphere.ts`, `trim.ts`, `globe.ts`, `moonbody.ts`: no term in pixels. `uAspect` with `vClip` is the vignette, a share of the frame.
- `standin.ts`: a line width by `fwidth`, a presence by `radiusPx > 0.6`, a gain by `min(radiusPx, 1)`, all in pixels of the buffer and without the factor. No file of `src`, `tools` or `tests` imports it, so it is on no pixel path. Left as it is.
- `relief.ts`: `dFdx` and `dFdy` only feed the gradients of `textureGrad` (which mip is read). The presence is a share the set gives. `screen` (the shield that keeps hidden cells from being drawn) counts the pixels of the buffer and the texels of the loaded alpha: it has to, it guards the real footprint of the real filter, and it removes only what cannot be seen.
- `cover.ts`, `shield.ts`: angles and cells, no pixel.
- `src/core/sets.ts`: the loader sets filters, wrap and anisotropy; it reads no size of the frame.
- Left out on purpose, in every file: which mip a sampler reads (`textureGrad` gradients, `uGrad`, implicit `texture`). At the capture a pixel is half as wide and reads one mip finer; that is the finer picture of the same scene, no moment moves by it.

So for (a) there is none without the factor on a pixel path of these folders.

(b) Found: two, both in the shared globe, both reaching only Mars (the one stop that builds its globe with `Planet`).

- The colour levels: a level comes in when its parent has fewer than `fade` texels a pixel, and the parent's texels were the loaded ones: `uPatchSize` from the width of the loaded file, `uMapWidth` from the stop (Mars gives the loaded wrap's width). With the web set (half the width) every level came in at about twice the height.
- The height levels of the cap: `uCapFade` against `foot * scale * uCapSize` of the parent, `uCapSize` being the loaded size (Mars: 2048 full, 1024 web).

The cure, off by default:

- `patches.counts?: number[]` of `Planet`: one width per colour level, the full set's. Given, `uPatchSize` holds these numbers; not given, the loaded widths as before. No text of the shader changes either way. The wrap is counted by `mapWidth`, which is the stop's to give: the full set's width in both sets.
- `count?: number` of a `CapLevel`: the full set's size of that height level. Given on any level, the cap's vertex program gets `uCapCount` and reads it in the one line that brings a level in; the mip of the heights (`lod`) keeps reading the loaded size, so the smaller set is not read softer than it is. Not given, the text is the old one to the letter (`tests/globe-count.test.ts`).
- With `counts` the texels view of the globe shows the counted texels, not the loaded ones. With the full set the two are the same.

How Mars turns it on (its builder's files, patch `count-mars.patch`, sent to the Builder): `levels.json` carries `"full": WIDTH` on each level (4096, 4096, 4096, 3686, 4096, 3686, 3277, 2176; `bake.py` writes that file and would have to write the widths), `assets.ts` types it, and `set.ts` gives `mapWidth: wrap.sets.full.color[0]`, `counts: patches.levels.map((l) => l.full)` and `count: l.size.full` on each cap level.

Measured (draft tier, `npm run still`, Mars's patch in a scratch tree only):

- Options off: 47 of 47 judged draft frames byte equal to the list of 86184412. The nine stop hashes stand, the engine hash goes 2981f5b6b07fec7a to 7de408a91944bdb0.
- Mars with its patch, full set: frames 2212, 2325, 2427, 2580, 2726, 2782 byte equal to the frames without it (the full set counts itself). Mars's stop hash goes 9a6cc1876b2f3ff5 to 25d69772f1148712.
- Mars's dive, web set against full set, texels view (which level each pixel reads): equal to full on 0.545 of the frame at 2400, 0.145 at 2427, 0.044 at 2450 before; 0.986, 1.000, 0.970 with the counts. Off by more than 3 of 255 after: 0.013, 0.000, 0.008 of the frame.
- The same frames, beauty against full, both reduced by 4, mean / 99th part / largest of 255: 2400 before 1.39 / 14.4 / 93.8, after 0.51 / 3.4 / 23.8; 2427 before 0.75 / 5.4 / 24.6, after 0.74 / 4.6 / 18.1; 2450 before 0.34 / 1.5 / 66.1, after 0.33 / 1.3 / 7.0.
- Looks `texels-panel` (full, web before, web with the counts; rows 2400, 2427, 2450) and `beauty-2427-crop`.

Not known: what the remaining unequal pixels of the texels view are (by the eye the place's own layers and the cap's cliff). Not done: no final tier frame, no web film render, three dive frames only, no frame at 3840 by 2160.

## 16. The drawn shape of a body in the pose record (MAIL 812.5): Earth's rise

Asked by harness_builder: rows of Earth's rise that the pattern reader refuses (capture 4223 to 4259, rate 2, k against k + 16), first by "two grounds" (apart 0.53 to 0.83), then by "the range does not carry the pattern" (bulk 8.5 to 30.2 px). Two causes, both MEASURED on draft captures of 4215, 4223, 4230, 4231, 4239, 4245, 4246, 4261, 4274, 4290 on b6a8d201.

**Cause A, the range picture of Earth's ground on the globe (the stop's file, not mine).** `src/stops/earth/relief.ts` draws its ground on the globe in three passes (a dim pass, then sea and towers blended under by the alpha that stands there). In the raw views the dim pass leaves the globe's code times one minus the ground's cover, and the ground's code is added on top, so a pixel where the cover is between 0.5 and 1 holds the sum of two codes and decodes 1.3 to 630 times too far. Share of the body's pixels more than 0.02 farther than the unit sphere, as it is and with the patch:

| capture | 4215 | 4223 | 4230 | 4231 | 4239 | 4245 | 4246 | 4261 | 4274 | 4290 |
|---|---|---|---|---|---|---|---|---|---|---|
| as it is | 0.009 | 0.035 | 0.087 | 0.094 | 0.448 | 0.573 | 0.576 | 0.248 | 0.019 | 0.002 |
| with the patch | 0.000 | 0.000 | 0.000 | 0.000 | 0.001 | 0.002 | 0.003 | 0.010 | 0.007 | 0.002 |

The patch, one line of `GROUND_FRAG` (the dim pass clears the pixel whole in a raw view where the ground is kept; the beauty is byte equal on 4230, 4245, 4274):

```
-  if (uDim > 0.5) outColor = vec4(0.0, 0.0, 0.0, ground * on);
+  if (uDim > 0.5) outColor = vec4(0.0, 0.0, 0.0, uDiag >= 2 ? 1.0 : ground * on);
```

Apart of the pairs 4215:4231, 4223:4239, 4230:4246, 4245:4261 (rebuilt with my own script, not the harness reader): as it is 0.008, 0.537, 0.830, 0.658; with the patch 0.002, 0.001, 0.001, 0.001.

**Cause B, the shape of the drawn globe (the record's, mine).** `src/stops/earth/set.ts` draws the globe, its air and the ground on the globe in a group `shape` whose matrix is `shape.json` (x 1.0043409, y 0.9907715, z 0.9975241, shear -0.0042483) mixed to the unit by `low`: a sphere where the eye stands under 0.05 radii, the whole shape over 0.7, between them by the log of the height (capture 4216 to 4290 of the rise). The group sits in the set's frame outside the globe's turn, so a point g of the turned body is drawn at `S g`. The record held no shape, so the rule of section 13 carried a point of a sphere.

What is in the record now. `bodies[0].shape`: nine numbers, the matrix by rows in the pose frame, as drawn at that frame. `poseRecord` asks the plan for `drawnShape(view, eye, time)` (type `Shaped` in `tools/smooth/pose.ts`; `eye` the record's camera place, `time` the record's time) and writes what it hands: `{ shape, place? }` or null. A plan without the member, or one that hands null, gives a record with no `shape` key, byte equal to the record before. `place` goes into `bodies[0].place` where given (a shape about a centre off the body's middle). `tools/img/range.py`: `carried` and `shaped` take the shape out before the turn and lay the other frame's shape on after it (`form`, `plain`).

How a stop turns it on: a method on its plan. For Earth (`src/stops/earth/plan.ts`, the builder's file; the same rule as lines 169 and 175 of its `set.ts`):

```
+import { descent, shape as figure } from './look'
...
+  drawnShape(view: ViewKind, eye: THREE.Vector3): { shape: number[] } {
+    const low = view === 'orbit' ? 1 - smooth((Math.log(Math.max(eye.length() - 1, 1e-4)) - Math.log(descent.low)) / (Math.log(descent.high) - Math.log(descent.low))) : 1
+    return { shape: figure.flatMap((row, i) => row.map((v, j) => v + ((i === j ? 1 : 0) - v) * low)) }
+  }
```

MEASURED (range pictures with patch A, records written by the patched plan, beauty frames of b6a8d201; the carried frame against the first by a flow of my own at quarter size, median and 90th part of the flow left in px, pairs as above):

| | 4215:4231 | 4223:4239 | 4230:4246 | 4245:4261 |
|---|---|---|---|---|
| as it is (no patch) | 0.1 | 1.0 | 3.4 | 21.5 |
| patch A, record without shape | 0.1, 1.6 | 1.0, 2.0 | 3.3, 5.0 | 7.7, 11.4 |
| patch A, record with shape | 0.1, 1.6 | 0.1, 2.0 | 0.3, 2.3 | 0.8, 3.8 |

The shape of the records: the unit at 4215 to 4231; at 4245 x 1.0003124, y 0.9993359, shear -0.0003057; at 4261 x 1.0017539, y 0.9962713; at 4290 the whole of `shape.json`. All other keys of the ten records are byte equal to the records before.

STATED from the code, not measured: in the terrain view the record says the unit (the place's ground is not in the group). In the film's ending (`set.ts`, `ending`) the set uses the whole shape whatever the height; the plan's method does not know the ending, and no record is written there today.

UNKNOWN: what the harness reader (`carry.py` of agent/harness-prove) says on these rows with both patches; the numbers above are my flow, not its bulk. Uranus draws its globe in a shape with a turn, two scales and a centre (`src/stops/uranus/set.ts`, `plan.ts` `shaped`); its plan hands no `drawnShape`, and whether that is part of the bulk on its rise is not measured. Sun and Mars rows of the same mail: not looked at.

Tests: `tests/globe-pose.test.ts` (the plan's shape and place reach the record with the view, the eye and the time of the frame; no key where there is none), `tests/globe-range.test.ts` (a made body in two shapes and two turns: the carried place equals the rule to 1e-9 px, the point lands on the body of the other frame, and the record without shape carries it elsewhere).

## 17. The further bodies of a stop in the pose record (MAIL 835 task 1): moons, rings, and the lens of Saturn

Asked by harness_builder and the Builder: Phobos crosses the face of Mars in capture 4776 to 4822, the record named one body, so a reader carried the moon by the turn of Mars. The record now names every body a stop draws with a range, each with its own place and turn.

**What is in the record now.**

- `bodies[1], bodies[2], ...`: `{ id, place, turn?, reach, sheet? }`. `place` and `turn` are those of the body at that frame in the pose frame, as for the first body. `reach` is the radius of the ball about `place` that holds everything the body draws (in radii of the stop). `turn` is left out where only the place is known. `sheet: { normal, inner, thick }` makes the body a flat ring instead of a ball: everything within `thick` of the plane through `place` with that normal, from the radius `inner` to `reach`.
- `poseRecord` asks the plan for `drawnBodies(view, eye, time)` (type `Bodied` in `tools/smooth/pose.ts`) and writes what it hands. A plan without the member: in the orbit view the bodies of `plan.nearBodies(time)` are written by their place alone (id `<stop>.near.<i>`, no `turn`); today that is Phobos and nothing else. A plan that hands an empty list, or a stop with neither, gives a record byte equal to the record before.
- `camera.q`: where the plan has `drawnSeat(time)` (type `Seated`), the turn the stop gives its whole world about the lens is taken into the camera (`q` times the inverse of that turn), because that is the lens the stop is drawn through. The sky keeps the film's camera. Only Saturn turns its world so (`plan.seat`, both of its scenes).
- `tools/img/range.py`: `beyond(body, x)` (how far a point stands outside what a further body holds), `owner(x, record)` (the index of the body each point belongs to: the first of the further bodies that holds it to `HOLD` = 0.001 of its reach, else the first body), `moved` (one body's rule), `carried` (each point by its owner's place, turn and shape; bodies are matched by index and equal id), `points` (the unit of a pixel is the one that puts its point nearest a surface of any body of the record, not of the first alone).

**The rule for a reader.** The pixels of a moon are the pixels whose point (`points`) lies in its ball: `owner(x, record) == i`. No second unit and no outline is needed; the range picture already holds the moon's own distance. Where two bodies hold a point the earlier named wins, so a plan names the smaller thing first (Titan before the rings).

**How a stop turns it on.** A method on its plan (the builder's file). The six patches are in the mail of this commit, one per stop; Mars as the pattern:

```
+  drawnBodies(view: ViewKind, _eye: THREE.Vector3, time: number): { id: string; place: number[]; turn: number[]; reach: number }[] {
+    if (view !== 'orbit') return []
+    const e = time - this.holdMid
+    const place = new THREE.Vector3().fromArray(phobos.center).applyAxisAngle(this.axis, THREE.MathUtils.degToRad(this.p.moonDegPerSecond) * e)
+    const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3().fromArray(phobos.tumbleAxis).normalize(), THREE.MathUtils.degToRad(moon.tumbleDegPerSecond) * e).multiply(new THREE.Quaternion().fromArray(phobos.holdQuaternion))
+    return [{ id: 'phobos', place: place.toArray(), turn: turn.toArray(), reach: phobos.radius * phobos.hi }]
+  }
```

**What each stop draws beside its globe (read in each set; a layer hands a range only where it calls `diagOut` with one).**

| stop | further body with a range | what the patch names | without a range (a reader sees sky there) |
|---|---|---|---|
| Sun | none (`convect`, `globe`, `ground` are the body) | nothing | prominences, loops, jets, corona, fringe |
| Mercury | none | nothing | the Sun's plate, glare, rim |
| Venus | none (the cloud relief is the body) | nothing | veil, rim |
| Earth | the Moon (`moon.ts`), orbit view | `moon`: the hold eye drawn to `look.moon.center` by `near`, round the axis by 0.13 deg/s of `plan.clock`; fixed turn; reach radius times near times 1.25 (its mesh) | |
| Mars | Phobos (`bodies/moonbody.ts`), orbit view; no Deimos is drawn | `phobos`: as above | |
| Jupiter | Io (`io.ts`), orbit view | `io`: `look.io.home` round the axis by 2.6 deg/s before the middle of the terrain, by `riseDeg` and the same rate from the middle of the rise after; turn about y by 0.6 deg/s; reach radius times 1.12 | |
| Saturn | Titan (`titan.ts`), the ring sheet and the grains (`sheet.ts`, `grains.ts`), both views | `titan` (home round the axis by 0.3 deg/s, reach 1.6 radii of its disc, its mesh); `rings` as a sheet (normal `ringNormal`, inner 1.2458, reach 3.9, thick 0.15, at rest in the pose frame); `drawn` (the globe turns by `plan.spin` in both scenes, `plan.turn` says the unit where the spot is on the rings); `drawnSeat` | |
| Uranus | Miranda and Ariel (`moons.ts`), orbit view | `miranda`, `ariel`: the fitted place drawn to the hold eye by `depth`, round the ring normal by 0.6 deg/s; own turn | the rings and arcs (`rings.ts`: they discard in the raw views) |
| Neptune | Triton (`triton.ts`), orbit view | `triton`: the fitted place before the middle of the terrain, `look.triton.stage` after; round the axis by 0.3 deg/s; turn about `up` by 0.4 deg/s; reach the fitted radius | the ring (`ring.ts` discards in the raw views) |

**COMPUTED from the plans with the patches in (no picture; `out/work/tmp/bodies.ts`, every capture frame of each hold, dive and rise at rate 2):** how far a body lands from its own place over 16 capture frames when it is carried by the globe's rule, median and most, in px of 1920 by 1080, and the capture frames where its ball is in the frame and its middle is not behind the globe.

| stop, body | hold | dive | rise |
|---|---|---|---|
| Earth, moon | 3.8, 4.0 (3360 to 3659) | 4.9, 6.9 (3660 to 3702) | 3.5, 11.9 (4316 to 4349) |
| Mars, phobos | 74.2, 97.2 (4500 to 4799; reach up to 256 px) | 171.5, 788.9 (4800 to 4825; reach up to 793 px) | not in the frame |
| Jupiter, io | 3.0, 3.0 (5640 to 5939) | 3.2, 5.9 (5940 to 6010) | 2.1, 9.0 (6572 to 6629) |
| Saturn, titan | 9.1, 9.5 (6780 to 7079) | 7.9, 9.5 (7080 to 7228) | 8.2, 8.3 (7699 to 7769) |
| Saturn, a point of the rings | 2.5, 2.7 | 1.5, 2.5 | 1.7, 1.9 |
| Uranus, miranda | 1.0, 1.1 (7920 to 8219) | 1.7, 2.3 (8220 to 8268) | behind the globe (8820 to 8909) |
| Uranus, ariel | 0.7, 0.7 (7920 to 8219) | 1.0, 2.2 (8220 to 8250) | not in the frame |
| Neptune, triton | 7.0, 7.1 (9060 to 9359) | 7.0, 7.2 (9360 to 9393) | 7.7, 8.3 (10009 to 10049) |

**MEASURED on draft captures (range and beauty at 95fcf006, records written with the patches in; pairs k against k + 16).** On the pixels the record gives the body: the share whose range in the later frame agrees with the carried range to 0.2 percent (the geometry), the median flow left between the first frame and the later frame carried back (my own flow at quarter size, px), and the mean difference of grey (of 255). Each cell: by the globe's rule, then by its own.

| pair | body, pixels | range agrees | flow left | grey apart |
|---|---|---|---|---|
| Mars 4780:4796 (hold) | phobos, 96752 | 5.0%, 99.5% | 82.4, 0.0 | 37.9, 2.0 |
| Mars 4800:4816 (dive) | phobos, 99344 | 3.7%, 96.9% | 65.9, 3.2 | 39.4, 21.7 |
| Earth 3500:3516 (hold) | moon, 5125 | 85.0%, 99.5% | 3.4, 0.1 | 19.8, 2.4 |
| Earth 3670:3686 (dive) | moon, 5339 | 78.4%, 97.6% | 3.3, 0.4 | 19.1, 4.2 |
| Earth 4320:4336 (rise) | moon, 5169 | 49.3%, 96.6% | 2.3, 1.5 | 28.3, 9.3 |
| Jupiter 5800:5816 (hold) | io, 4153 | 89.1%, 99.9% | 2.9, 0.4 | 18.3, 3.1 |
| Jupiter 5960:5976 (dive) | io, 5267 | 86.9%, 93.4% | 2.9, 1.1 | 20.8, 13.1 |
| Jupiter 6610:6626 (rise) | io, 2901 | 98.4%, 98.2% | 0.8, 0.6 | 4.2, 4.6 |
| Saturn 6900:6916 (hold) | titan, 3167 | 75.0%, 99.2% | 8.7, 0.0 | 47.9, 1.4 |
| Saturn 6900:6916 (hold) | rings, 712335 | 99.8%, 99.8% | 2.6, 0.1 | 5.8, 3.5 |
| Saturn 7100:7116 (dive) | titan, 3459 | 71.8%, 99.6% | 9.0, 0.1 | 45.9, 1.5 |
| Saturn 7100:7116 (dive) | rings, 850546 | 99.7%, 99.7% | 2.4, 0.1 | 5.5, 3.3 |
| Saturn 7200:7216 (dive, terrain view) | titan, 1706 | 71.3%, 98.5% | 6.4, 0.1 | 48.7, 2.2 |
| Saturn 7720:7736 (rise) | titan, 2547 | 72.6%, 98.8% | 7.6, 0.1 | 47.1, 2.1 |
| Uranus 8000:8016 (hold) | miranda, 1154 | 95.9%, 98.4% | 0.4, 0.1 | 9.6, 7.1 |
| Uranus 8000:8016 (hold) | ariel, 655 | 97.6%, 98.9% | 0.2, 0.1 | 7.8, 5.5 |
| Uranus 8230:8246 (dive) | miranda, 1149 | 93.3%, 99.0% | 0.4, 0.2 | 9.4, 8.4 |
| Uranus 8230:8246 (dive) | ariel, 772 | 93.8%, 98.6% | 0.3, 0.2 | 9.6, 5.5 |
| Neptune 9200:9216 (hold) | triton, 12648 | 0.0%, 99.5% | 35.2, 0.3 | 103.5, 2.3 |
| Neptune 9364:9380 (dive) | triton, 12219 | none held, 99.8% | none, 0.2 | none, 2.1 |
| Neptune 10020:10036 (rise) | triton, 12834 | 0.0%, 99.3% | 29.3, 0.3 | 44.1, 2.6 |

On Neptune the one body record also picks the wrong unit for Triton's pixels (the close unit puts them nearer the globe), which is why nothing agrees there.

**Mars, the named case.** With the fallback alone (no patch: place, no turn) the pair 4780:4796 reads flow left 0.6 px and grey apart 3.6 on the moon; with the patch 0.0 px and 2.0. In the dive the moon's shape lands (range agrees on 96.9 percent, the median of range there over carried range is 1.00000) and its light does not: the mean grey of the moon's pixels goes from 63.2 to 50.1 between 4800 and 4816. STATED from `src/stops/mars/set.ts` and `phobos.json` (`lit`): the baked lit side of the moon is shown in full while the eye stands within 12 degrees of the hold's eye as seen from the moon, and is gone at 24, where the moon's own light draws it; computed from the plan the angle is 11.54 at capture 4806, 13.74 at 4810, 17.66 at 4814, 24.01 at 4818, so the baked side goes out over capture 4808 to 4818 (five film frames). A reader that carries the moon rightly will still read a change of pattern on it in those frames; that is the picture, not the record.

**Saturn, the lens.** MEASURED on 6900 and 7100: a sphere fitted to the points of Titan's mesh stood 0.0273 and 0.0261 radii beside the place of the record (across the ray; 0.0005 along it), and the globe's points stood off the unit shape by a slope of 0.011 and 0.014 per 1000 px across the picture. With the seat in the camera: 0.0002 and 0.0003 radii, slope 0.0002 and 0.0001. The record of Saturn was written through a lens that is not the one the stop is drawn through (`plan.seat(time)` turns the world about the lens in the lens's own frame). The patch hands it as `drawnSeat`.

Also MEASURED on the same frames: every point of Saturn's globe stands 0.0200 outside the unit shape (median; with the seat in). STATED from `src/stops/saturn/kept/globe.ts`: the mesh is blown up by `limbInflate` 1.02 where the limb is shown and the range is that of the mesh, not of the globe drawn inside it.

**STATED, not measured.** The moons of Earth, Mars, Jupiter, Uranus and Neptune are named in the orbit view alone, as their sets draw them in the orbit group; whether any is seen from a place picture was not looked at. Earth's Moon is kept round on the screen by its shader (`uRound`), so it is not exactly a ball that turns. The grains of Saturn's rings go round on their own orbits and the globe's shadow lies on the rings; the sheet carries both as at rest.

**UNKNOWN.** What the harness reader says with these records. The turn of each moon was not measured apart from its place (the turns are small: Phobos 0.24 degrees in 16 capture frames).

Tests: `tests/globe-pose.test.ts` (a plan's further bodies reach the record with the view, the eye and the time of the frame; the fallback of the near bodies, in the orbit view alone; the seat goes into the camera and nothing else changes; no key where there is none), `tests/globe-range.test.ts` (a made globe, moon and ring: every pixel is given to the body that drew it, the carried place equals each body's own rule to 1e-9 px, a record of one body lands the moon and the ring elsewhere, a body without a turn goes by its place alone, a body whose id differs in the other record goes with the globe).

## 18. The unit of the close view, the near plane, and three stops looked at (MAIL 835 tasks 2 and 3)

All flows here are my own (`tools/img/range.py` and a dense flow at a quarter of the size, pairs of capture frames k to k + 16, draft); "flow left" is what stays after the later frame is carried back by the record, as median, 90th and 99th percentile in px of the full frame. None is the harness reader's number.

**Uranus, rise 8790 to 8834: the shape is not the bulk there.** MEASURED on 8790:8806, 8806:8822, 8818:8834: the record with `drawnShape` and without is the same record, flow left 0.3, 36.4; 0.5, 32.4; 12.3, 90.7 (99th up to 147.4) either way; the points stand 0.00000 to 0.00004 off the unit sphere. Computed from the plan: the roundness of the globe is 1 from capture 8293 to 8399 and from 8760 to 8849, and between 0 and 1 in 8228 to 8292 (dive) and 8850 to 8889 (rise). What changes in 8790 to 8834 is the picture: the clouds of the close deck go, the white clouds of the globe come in, the glare of the Sun moves (look `uranus-rise`). Where the shape counts: dive 8267:8283 flow left 2.3, 5.7 without the shape (points 0.00223 off the sphere) and 0.3, 4.8 with it; 8274:8290 2.7, 6.9 (0.00154) and 0.2, 7.1; rise 8850:8866 2.0, 8.9 and 1.1, 12.8. The patch for the plan (`drawnShape`, with `drawnBodies`) went to the Builder with section 17.

**The Sun, rise 352 to 392: the record named the wrong unit.** `range.units[1]` was `plan.twinFrame(time).scale`; the Sun's plan lays its close view by its own `twin` (the radius of its stage), 0.0484809 against 0.0808819. MEASURED: the points of the close view stood 0.028 to 0.037 radii off the unit shape, with the plan's own unit 0.00019. Flow left 352:368 7.8, 16.2 to 1.1, 2.7; 368:384 34.3, 69.1 to 1.1, 2.7; 376:392 44.7, 91.6 to 1.2, 2.8. The grey stays 22 to 23 of 255 apart after the carry: the surface boils by itself (the two keys below are for that).

The unit is now the length the plan's own `twin` gives a step of 1 (`poseRecord`), and it is named only where it is not 1. Computed for the other stops, own twin against `twinFrame`: Mercury 0.0162045 against 0.0162181, Venus 0.0184000 against 0.0184070, Jupiter 0.00301254 against 0.00301008, Neptune 0.0239197 against 0.0239242, Uranus by a factor 0.999998, Earth and Mars equal, Saturn 1 (no second unit, as before). The twin is the same along the three axes to 4e-9 and does not change with the time.

**Mars, row 5364: the pick of the unit, then an exchange of two grounds.** 5364 is the first orbit frame after the seam; the eye stands 0.00138 radii over the sphere and the ground lies deeper under the sphere than that. `points` took the close unit on 36.0 percent of the surface, because the point at the lens was nearer a surface than the true one. The record now holds `camera.near` (the film's near plane of that frame in the units of the pose frame: 0.000275 at 5364) and `points` does not take a unit that puts a point in front of it. MEASURED on 5364:5380: close unit taken 36.0 percent to 0.0, flow left 4.3, 36.7, 59.1 to 3.1, 22.3, 51.9.

What is left there is not the map. 5356:5364, 5364:5372 and 5356:5372 leave 0.1, 0.3 to 0.5 (grey 2.4 to 3.4 apart); 5372:5380 leaves 3.5, 56.7, 201.5 (grey 22.6). STATED from `src/stops/mars/set.ts` and `close.json` (presence 0.0019 to 0.0034): the ground of the close view is drawn in the globe's scene by a weight of the eye's height, computed 0.977 at 5372, 0.807 at 5374, 0.525 at 5376, 0.221 at 5378, 0.018 at 5380, and 0.011 at 4934 to 0.963 at 4946 in the dive. The close ground and the globe's ground are two pictures of one place (look `mars-5364`), and one gives way to the other in eight capture frames.

**Checked again.** 24 pairs of Earth, Mars, Jupiter, Saturn, Uranus and Neptune read with the new record give the numbers they gave before, to the digit printed. NOT measured: a pair in the close view of Mercury, Venus, Jupiter or Neptune, where the unit moved by 0.02 to 0.08 percent.

**UNKNOWN.** What the harness reader says of any of these rows.

Tests: `tests/globe-pose.test.ts` (the unit is the plan's own twin, 0.3 away from `twinFrame` on the Sun; the near plane in the orbit view is the film's, in the close view the film's times the unit), `tests/globe-range.test.ts` (a made eye low over ground under the sphere: half the pixels wrong without the near plane, none with it).

## 19. The range of a ball traced in a larger mesh (MAIL 835 task 4): Jupiter's dive, Saturn's hold

**Jupiter.** MEASURED: the points of the globe's range lie on a sphere of radius 1.02996, not 1. STATED from `src/stops/jupiter/globe.ts`: the mesh is scaled by 1 plus the rim and the picture is traced on the unit sphere inside it; the range handed is that of the mesh. A point 0.03 too far out turns by the wrong arc, which is the flow left in the dive and the rise. Io's mesh is its ball times 1.12 in the same way.

The patch (two lines, the builder's files, through the Builder):

```
src/stops/jupiter/globe.ts, last argument of diagOut:
-  length(vView));
+  length(vView) * (rt < 1.0 ? (along - sqrt(max(1.0 - rt * rt, 0.0))) / length(vPos) : 1.0));
src/stops/jupiter/io.ts, last argument of diagOut:
-  length(vView));
+  length(vView) * (rt < uBall.w ? depth / length(vPos) : 1.0));
```

MEASURED with the patch rendered: points off the unit shape 0.02994 to 0.00000; the beauty frames 5960, 5976, 6580, 6596 are byte equal with and without it, 4 of 4. Flow left on the globe: dive 5960:5976 3.1, 5.2, 7.0 to 0.1, 0.5, 2.9; rise 6580:6596 14.5, 18.2, 44.7 to 0.3, 1.4, 13.2. On Io (by its own rule, the record with the plan's `drawnBodies`): 5960:5976 1.6, 2.6 to 0.9, 1.2; 6580:6596 8.5, 26.9 to 0.9, 5.5 (look `flow-6580`). STATED: Earth's Moon (1 + PAD) and Titan (1.6) are meshes larger than their ball as well; no patch was written for them.

**Saturn.** The same one line for `src/stops/saturn/globe.ts` and `src/stops/saturn/kept/globe.ts` (`uLimbW > 0.0 && rt < 1.0 ? (along - sqrt(max(1.0 - rt * rt, 0.0))) / length(vLocal - uCam) : 1.0`): points off the unit shape 0.01996 to 0.00000 at 6900 and 7100, the beauty frames 6900, 6916, 7100, 7116 byte equal, 4 of 4. The flows do not change by it.

The hold by region, record as it is against the record with the plan's `drawn`, `drawnSeat` and `drawnBodies` (section 17), flow left:

| pair | region | as it is | full record |
|---|---|---|---|
| 6900:6916 (hold) | globe | 0.3, 0.9, 1.5 | 0.2, 1.8, 2.8 |
| 6900:6916 (hold) | Titan | 1.1, 2.4, 2.9 | 0.0, 0.1, 0.1 |
| 6900:6916 (hold) | rings | 0.1, 0.6, 1.7 | 0.1, 0.6, 2.1 |
| 7100:7116 (dive) | globe | 0.4, 1.3, 6.2 | 0.5, 2.2, 6.1 |
| 7100:7116 (dive) | Titan | 1.2, 2.8, 3.2 | 0.1, 0.1, 0.2 |
| 7100:7116 (dive) | rings | 0.1, 0.8, 3.7 | 0.1, 0.9, 3.9 |

The globe turns 0.3733 degrees in 16 capture frames (`plan.spin`, drawn with `uSpin`). STATED: two patterns lie on the same pixels of the globe, the map that turns with the spin and the shadow of the rings with the terminator that stay. No one carry lands both: the full record lands Titan and the lens, and on the globe its 90th percentile is larger than that of the record as it is. Nothing in the record closes the remainder of Saturn's hold; a reader would have to judge the shadow apart from the map.

**UNKNOWN.** Whether Jupiter's 99th percentile of 1.063 at the harness falls under its limit with the patch (my flow says the cause is gone; the harness's number was not run). Which of Saturn's two patterns the harness reader follows.

## 20. A body that moves by itself and a body with its own light (asked by harness_builder, the Builder's MAIL 842.2 b and e)

"The one that draws it says it, in the record, beside the drawn shape; a missing field means rigid." Two optional keys on a body of the pose record:

- `bodies[i].flows`: px of the record's frame (`camera.width` by `camera.height`) a film frame, the largest speed at which the surface moves by itself on the screen at that frame's range.
- `bodies[i].light`: radii of the body about its `place`, how far its own light reaches.

**How a stop turns it on.** Two methods on its plan, beside `drawnShape` (types `Flowing` and `Lit` in `tools/smooth/pose.ts`):

```
drawnFlow(view: ViewKind, eye: THREE.Vector3, time: number, lens: { vfov: number; width: number; height: number }): number | null
drawnLight(view: ViewKind, eye: THREE.Vector3, time: number): number | null
```

`eye` is the camera of the record in the pose frame, `lens` is what turns a speed on the body into px of the record. They fill `bodies[0]`. A further body carries its own in what `drawnBodies` hands (`flows`, `light` on the entry). A plan without the method, or one that hands null, zero, a negative or a number that is not finite, gives no key, and the record is byte equal to the record without. No plan on main hands either today. What the reader does with them is the harness's (`tools/img/carry.py`).

Test: `tests/globe-pose.test.ts` (both reach the record with the view, the eye, the time and the lens of the frame; nothing else changes; no key for null, 0, a negative, NaN, infinity; a further body keeps its own).

## 21. Detail from the stop's own code on the cap (`cap.detail`, asked by mars_place_builder, MAIL 866 item 5): off by default

**What it does.** A stop hands the cap a piece of shader text with one function, and the cap's fragment program reads it at every fragment of the cap: a factor on the colour of the ground and a small height that only the light sees. The place of the surface, its depth, its edge and the range picture do not change. The sphere outside the cap gets nothing of it.

**How a stop turns it on.**

```
new Planet({ ..., cap: { ..., detail: { text, uniforms } } })
```

`text` must define

```
vec4 groundDetail(vec3 dir, float height, vec3 normal, float texelPx)
```

- `dir`: unit direction of the fragment in the frame of the map (the turn of the body taken out).
- `height`: radii above the sphere, the cap's own height at the fragment.
- `normal`: the cap's smooth normal in the same frame.
- `texelPx`: the longest width of one texel of the finest plate drawn there, in pixels of the master. The finest plate drawn is the last level whose weight is at least 0.5, the wrap map where there is none. It goes through the frame factor (`uFrame`, set from `bufferFrame()` in `Planet.update`), so a draft and a final give the same number at the same place. Sizes are the ones the levels count by (`patches.counts`, section 15).
- returns `rgb`, a factor on the linear colour of the ground before the light (the map after `inverseFilmic` and the own levels alike), and `a`, a height in radii for the light only.

The text is laid after the helpers and before `main`, so `PI`, `dFdx`, `dFdy`, `fwidth` and the helpers above it can be used. Its uniforms are named `uDetail` and a name of the stop's own; every one declared must be given in `uniforms` and none else. `capDetail` (exported from `src/bodies/cap.ts`) refuses a text without the function, a text that holds `void main`, `discard`, `outColor`, `gl_FragDepth` or any sampler, a uniform with another name, one declared and not given, one given and not declared, and one declared twice. A sampler is refused because no texture unit is counted for it against the 16 of `src/core/caps.ts`.

**How the light reads the height.** Three reads: at the fragment, one pixel of the buffer to the right, one up (`normalize(dir + dFdx(dir))`, `height + dFdx(height)`, `normalize(normal + dFdx(normal))`, the same with `dFdy`). With `p = dir * (1 + height)` and its two steps `sx`, `sy`, the slope of the returned height along the surface is `(bx * cross(sy, normal) + by * cross(normal, sx)) / dot(sx, cross(sy, normal))`; its negative is added to the normal before the normalize that the light already does, at full weight whatever `light.relief` and `light.from` are. With `light` on the own levels get the same tilt beside `light.own`; without it they get the light factor of the tilted normal and exactly 1 where the tilt is zero.

**Limits.**

- The two neighbours are one pixel of the buffer apart, not of the master. A height finer than a pixel aliases, and the same text gives a different tilt at draft and at final where it is not smooth over a pixel. The stop fades its own height by `texelPx` or by its own measure.
- The cap is drawn only inside its border and its `from` band. The detail ends where the cap ends. A text that gives `rgb` 1 and height 0 where `texelPx` is at or under 1 leaves no step there; that is the stop's to keep.
- Three calls of the stop's function for each fragment of the cap. The time on a film frame is not measured.
- No film frame with the option on was drawn in this branch. The stop's builder shows it.

**What was measured** (test page of `tests/globe-cap.test.ts`, float target, the harness browser):

- Hook absent: `planetFrag` gives the same string with `detail` undefined as without the key, for four option sets; the text of the globe hashes to the kept value; a cap built without `detail` has no `uFrame` and no `uDetail` uniform, and its vertex text is the one of before (`tests/globe-detail.test.ts`).
- A text that returns `vec4(1.0, 1.0, 1.0, 0.0)`: four views of 96 by 96 over a mesa of the cap's own heights (with `light` and own levels, with `light` and no own levels, without `light`, without `light` and with `exactSpin` and a turn of 0.3): 0 values of the float picture differ from the same view without `detail`.
- A factor `uDetailTint` of 0.5, 0.25, 0.75, with `light`, with and without own levels: at every pixel of full alpha the linear value is the value without times the factor within 1 part in 10000; no alpha changes.
- A height `2e-4 * sin(60 * dir.x)` on a flat cap, 192 by 96: the change of the light at columns 40 to 151 of the middle row is the one of the forward difference over one pixel counted by hand, within 5 percent of the largest swing (asserted); at the 17 columns printed inside the cap the two differ by at most 0.00002 against a swing of 0.0086. Columns off the cap change by 0.
- A height `5e-4 * sin(300 * height)` over a mesa seen from above: the light changes on the two ramps only (up to 0.077 of the value), by less than 1e-5 on the flat top and on the floor.
- `texelPx` at the centre, plate of 8 texels over 6 degrees, from 2 radii above with a field of 4 degrees: 8.975 at 96 rows and frame 1, 8.975 at 192 rows and frame 2, 8.975 at 48 rows and frame 0.5 (the three agree to 4 parts in a million); counted by hand 9.005. The 0.33 percent between the drawn and the hand count is not explained; the test allows 1 percent.

**The clock test** (`tests/globe-cap.test.ts`, "brings a colour level in by the texels of its parent", limit 5000 ms, MAIL 866 item 3). Cause: each of its five shots disposed its planet before the next was built, so each shot compiled the program anew. Cure: the page keeps the planet of the last shot until the next shot has drawn, so shots with the same shader text use one program. The limit is not touched.

## 22. The cap's patches sifted by the lens (`cap.cull`, proposed by handover_engineer, MAIL 888 point 2): off by default

**What it does.** The cap draws its patches as instances of one small grid (`CAP_PATCHES` by `CAP_PATCHES` to a grid, 512 triangles a patch at Mars's 1024 cells). Without the option every patch of every drawn grid goes through the vertex shader whatever the lens sees. With it, before each draw the patches that lie wholly outside the lens of that draw are left out of the instance list. The shader text, the uniforms and the order of the patches that stay are the same, so the picture is the same to the bit; only the count of vertices changes.

**How a stop turns it on.**

```
new Planet({ ..., cap: { ..., cull: true } })
```

Nothing else. No number of the stop is involved.

**How it works.**

- `ReliefCap.lens` is a `THREE.LOD` with no level, added to the globe's mesh before the cap's mesh (`Planet` does it). The renderer calls `update(camera)` of an LOD while it walks the scene, with the camera of that very draw and before it loads the instance list of the cap's mesh. So the sift is by the lens that draws: the jitter of a sample, a shutter sample, the wider picture of the place pass, the range pass, the texel view and a view from the side each sift by their own camera, in the same way. Nothing reads a camera of an earlier draw.
- `capSift` (exported, pure) takes each patch as the body it can fill: its square on the plane of the spot, padded by a thousandth of a patch, times every height between the lowest and the highest any level can give (the levels' `low` and `high`, the sink, 0, times the cap's share). That body lies inside the hull of 8 points. A patch is left out only when all 8 lie outside one side of the lens widened by a 64th (left, right, top, bottom or the near plane; never the far plane), with a slack for what a 32 bit float loses at the size of the scene.
- A patch that is hidden but inside the lens stays. Nothing is judged by what covers what.
- The cap's mesh refuses to draw (it throws) when the matrix of the draw is not the one it was sifted by, which can only happen when the lens object is not in the scene before the mesh.
- What reads beyond the edge of the picture (bloom, the place pass) reads a buffer that a camera drew; that camera is the one sifted by. Shadows and glows of the cap come from its height textures in the fragment shader, not from its patches, so no patch reaches into the picture through one.

**Limits.**

- It saves vertices only. Fragments, and patches in front of the lens that the ground hides, cost what they did.
- The bounds of the height are the levels' own `low` and `high`, the same for every patch. Close to the ground the patches around the camera cannot be left out, since their body reaches above the camera. Bounds from the heights of each patch would leave out more; not built.
- `renderer.info.render.triangles` falls with it.

**What was measured.**

- `tests/globe-cull.test.ts` (no browser): for 12 lenses (6 views, each at two turns of the globe, the globe moved, turned and scaled in the world; near the ground, from above, from the side, with the picture shifted by `setViewOffset`) no patch that `capSift` leaves out has a point of its 5 by 5 corners at the lowest height, at 0 or at the highest height inside the lens; the patches that stay keep their order; at 8 or more of the 12 fewer than half stay. With a lowest height at the centre every patch stays. Without `cull` a cap has no lens object and the mesh has no hook; with it the vertex text, the fragment text and the names of the uniforms are the same, the lens object is ahead of the mesh, and a draw by a camera that the lens did not sift by throws.
- `tests/globe-cap.test.ts` (browser, float target): 9 views of a cap with heights (low over the ground at six places and fields, from above, with a turned globe, with the picture shifted by `setViewOffset`): 0 float values differ with `cull` from without; the cap's triangles kept are 25, 53, 21, 19, 34, 14, 82, 100 and 73 percent.
- Mars with `cull: true` as a scratch edit of `src/stops/mars/set.ts` (not in the repository) against the same tree without it, draft, 1 sample, 1920 by 1080, the harness browser (software GL), full sha256 of the png:
  rate 1, frames 2400 to 2488 at every 8th, 2456 and 2580: 14 of 14 byte equal;
  rate 2, frames 2440 to 2460 by halves (41 capture frames, 41 different pictures): 41 of 41 byte equal;
  the 13 Mars frames of the Builder's list of 115 (2325, 2427, 2444, 2448, 2455, 2459, 2580, 2690, 2694, 2701, 2705, 2726, 2782) with the option on: 13 of 13 equal to the list of main.
- Seconds of one draft frame (one sample, with post and the png), off to on, same order of frames in both sessions: 2432 10.1 to 8.9; 2440 13.2 to 10.0; 2448 16.3 to 11.7; 2456 21.0 to 15.2; 2464 26.9 to 20.5; 2472 28.9 to 21.3. Within 0.3 s at 2400, 2408, 2416, 2424, 2480, 2488 and 2580. From an earlier pair of sessions (the same sift, before the refusal of the mesh compared the whole matrix): 2690 29.1 to 22.3; 2694 26.1 to 20.9; 2701 21.3 to 17.6; 2705 17.3 to 15.0; no change at 2325, 2427, 2726 and 2782. At rate 2 over 2440.5 to 2460 the frame takes 13.1 to 25.0 s off and 9.8 to 19.8 s on.
- Patches kept (counted once with a readout that is not in the code): 2455 8692 of 20640; 2459 11869 of 24060; 2690 10593 of 24060. The cap's mesh is drawn once in a draft frame of Mars and its lens is asked twice, since the engine walks the world twice (an earlier line here said drawn twice; corrected after the count of section 23).
- At 2580 and 2478 this tree does not draw the cap, so nothing is sifted there and the seconds do not change.

**Not measured.** The final tier. Any stop but Mars (no other stop has a cap). Hardware GL.

**The patch for Mars** (one word in `src/stops/mars/set.ts`, sent to the Builder, not in the repository): `cap: { cull: true, levels: capLevels, ...`.

## 23. An own level under a whole level is not read (MAIL 954 ruling 1): always on for a body with own levels

**What it does.** A body with own levels (`patches.own`) used to read every colour level whose weight was above 0 at a pixel. Now it weighs its levels first and reads them after, and it does not read a level when both hold: a level above it has the weight exactly 1.0 at this pixel, and the level's own weight on the lit ground, `w * (1.0 - uPatchOwn[i])`, is exactly 0 (an own level). The picture is the same to the bit; only texture reads are saved. A body without own levels keeps its text to the letter.

**How a stop turns it on.** It does not. It comes with `patches.own`. No number of a stop is involved.

**Why it is exact.** Per level the pixel holds three sums: `albedo = mix(albedo, t, w * (1.0 - o))`, `ownSum = ownSum * (1.0 - w) + t * (w * o)`, `own = own * (1.0 - w) + w * o`. At a level with `w == 1.0` the factor `1.0 - w` is exactly 0, so `ownSum` and `own` forget every finite value they held, whether the product and the sum are fused or not. A level whose weight on `albedo` is exactly 0 leaves `albedo` as it is under both forms of `mix`. So what such a level under a whole level adds is multiplied by exactly 0 before anything reads it. The other numbers a level hands on (`parent`, `fine`, `drawn`, `texels`, `seen`, `near`) come from the weights alone and are computed as before, in the same order.

**What stays read, and why.** A lit level under a whole level, and the base map. `mix(x, y, 1.0)` is not `y` to the bit on the harness renderer (2 of 25 165 824 pairs differ by one last bit, measured with the cost table below), and a lit level under a whole own level still decides the lit ground the own light is mixed over. `tests/globe-lean.test.ts` holds both in 32 bit floats.

**The text.** `patchLevels` in `src/bodies/planet.ts`. With own levels: `float whole = -1.0;`, then per level `float w<i> = 0.0;` and inside `if (uPatchCount > i.5)` the weight as before, `w<i> = w; if (w == 1.0) whole = i.0;` and the numbers handed on; then per level `if (w<i> > 0.0 && !(whole > i.5 && w<i> * (1.0 - uPatchOwn[i]) == 0.0))` with the read and the three sums as before. Without own levels: the one pass as before.

**What was measured.**

- `tests/globe-lean.test.ts` (no browser, 4 tests). In 32 bit floats, for 40 000 stacks of 8 levels (weights exactly 1, exactly 0 and between; own flags 0 and 1, and in the second half parts between), under three forms of `mix` (by the two weights, by a step from x, fused) and two forms of the sums (plain, fused): `albedo`, `ownSum` and `own` are the same floats with the rule and with every level read, and the rule leaves out more than 20 000 reads in each of the six pairs. A sum at `w == 1.0` gives the same float from any value it held before and from 0. A wider rule that also leaves out the lit levels under a whole level moves `albedo` in more than 1000 of 20 000 stacks under either form of `mix`, and `mix(x, y, 1.0)` by a step from x is not `y` for some of 20 000 pairs. The text of four shapes without own levels has the sha256 it had at 8cfc71f2 and holds no `whole`. The text with own levels holds the weighing and the reading line by line, each level read once.
- `tests/globe-gl.test.ts` (browser, float target, 1 case more): a stack of five levels (lit, own, lit, own, own), 128 by 128, drawn with the text as it is and with the same text where the rule is taken out (the page puts `-1.0` for `whole` in the guards, so every level with a weight is read): 0 of 65 536 float values differ; the same for the stack with `fadeMinor`, and for a grazing view of three levels (own, own, own without and with `fadeMinor`; own, lit, own with `fadeMinor`). With the two lower own levels given another colour the pixels where the top level shows its plain scene value are the same floats (more than 200 pixels) and more than 200 pixels elsewhere move.
- Changes of the code made on purpose, each run against `tests/globe-gl.test.ts` and `tests/globe-lean.test.ts` (12 tests): the guard asks for a whole level at or above the level itself (6 red, among them the new browser case and the text case); the guard without the weight on the lit ground, so lit levels are left out too (2 red: the new browser case and the text case); `whole` set from `w >= 0.5` (3 red); `whole` starting at 9.0 (4 red). Each taken back.
- `tests/globe-levels.test.ts`: the sha256 that pins the text of a body with own levels is the new one (it was 813ceb84..., it is 6fbf99f9...). That text is the one this change is meant to move. The sha256 of a body without own levels (`KEPT`) is as before in every file that holds it.
- Mars, on a scratch merge that was never pushed: the tree of this commit with the folders of Mars (`src/stops/mars`, `public/assets/mars`, `assets-src/mars`) as on `agent/mars-place` e53c76b7, against the tree of 8cfc71f2 with the same folders. Outside the four files of this change the two trees are the same. Draft, 1 sample, full set, the harness browser (software GL), full sha256 of the png, frames 2436, 2444, 2448, 2455, 2459, 2464, 2472 of the dive and 2690, 2694, 2701, 2705, 2712 of the rise, each side in one session after a warm frame:
  1920 by 1080: 12 of 12 byte equal, 12 different pictures;
  3840 by 2160: 12 of 12 byte equal, 12 different pictures.
- Seconds of the same frames (one render each, the same order on both sides). 1920 by 1080, before to after: 2436 13.3 to 13.5; 2444 17.2 to 17.7; 2448 18.3 to 18.4; 2455 23.1 to 22.1; 2459 28.3 to 27.0; 2464 30.1 to 27.7; 2472 30.3 to 27.4; 2690 29.3 to 26.9; 2694 27.1 to 25.7; 2701 20.6 to 20.3; 2705 16.4 to 16.7; 2712 10.9 to 11.0; the 12 together 264.9 to 254.4. 3840 by 2160: 27.2 to 28.2; 35.9 to 36.0; 38.9 to 38.5; 50.5 to 46.6; 61.1 to 55.3; 68.0 to 60.2; 68.2 to 58.2; 66.5 to 57.9; 58.9 to 53.3; 41.9 to 40.9; 33.1 to 33.6; 23.9 to 24.2; together 574.1 to 532.9. Mars's set of that commit does not turn `cull` on.
- Without Mars's folders, this commit against 8cfc71f2, draft, 1920 by 1080, frames 615, 717, 1755, 1857, 2325, 2427, 2895, 2997: 8 of 8 byte equal.
- The same 12 frames again with Mars's folders as on `agent/mars-place` 00c41dcd (two trees built by taking the three folders whole, not by a merge; they differ in the four files of this change only): 12 of 12 byte equal at 1920 by 1080 and 12 of 12 at 3840 by 2160. Seconds of the 12 together, before to after: 265.9 to 250.2 and 578.5 to 535.5. At 3840 by 2160 the frames 2459 to 2694 gain 4.9 to 10.5 s each; 2436 took 0.8 s more.

**Not measured.** The final tier. Hardware GL: the rule rests on IEEE arithmetic of 32 bit floats (`x * 0.0` is 0 for a finite x, `1.0 - 1.0` is 0), which the harness renderer keeps; a renderer that does not would also not keep the frames of a body without this change. A stop other than Mars (no other stop has own levels). Whether the seconds gained hold with `cull` on (the scratch rows of the cost table, with `cull` on, gave 1.9 to 2.5 s at 2464 and 2472).

### The cost of the cap at draft, and the list to draw on (MAIL 933, MAIL 954 rulings 2 and 3; scratch, nothing of it is in the code)

Measured on a scratch merge of 3fc99fe5 and `agent/mars-place` 7cebce4c, Mars with `cull: true`, draft, 1920 by 1080, software GL, with uniform switches that were reverted. One render a row after a warm frame.

- Frames 2464 and 2472: 23.4 to 23.7 s and 22.4 to 22.5 s; with the plain globe in the cap's place 6.1 and 6.2 s.
- The cap is drawn once a frame. Its lens is asked twice, since the engine walks the world twice (about 2 ms each). Section 22 said "drawn, and so sifted, twice"; that was wrong and is corrected there.
- Triangles alone (no work per pixel, no height reads), over the plain globe: 7.1 and 5.8 s for 5 688 320 and 4 543 488 triangles on 1 984 183 and 1 766 281 covered pixels; 1.06 and 1.09 fragments shaded a covered pixel.
- Height reads of the vertex shader: about 1 s together. The 8 colour levels per pixel: 8.0 and 8.1 s. The base map: 0.8 and 0.7 s. The detail hook: 0.2 and 0.1 s. Slope reads of the wrap height, air, grazing: within the noise. The cap's shaders hold no march.

The list to draw on if the sandbox master does not fit its hours (MAIL 954: not taken now, each moves a byte or changes what the ground holds at a slant):

- Every read that is multiplied by 0 not read (lit levels and the base map too): 2464 24.2 to 17.5 s, 2472 23.0 to 15.8, 2690 22.1 to 15.6; PNG equal 12 of 12 at draft, but not exact (`mix(x, y, 1.0)` is not `y` to the bit in 2 of 25 165 824 pairs on this renderer).
- Anisotropy of the colour levels 8, 4, 2, 1 in place of 16: 2464 24.0 to 23.4, 21.9, 19.9, 17.6 s; 2472 22.9 to 21.6, 19.8, 17.9, 15.5 s. Bytes move.
- Cells 512 in place of 1024 (a quarter of the triangles): 24.0 to 17.0 s and 22.8 to 16.5 s. Bytes move.
- The frame at 960 by 540: 12.1 and 10.8 s.
- Fewer triangles at a slant: not built. The number that decides it is measured in the part below.

### The triangles of the cap that reach no pixel: measured, nothing built (MAIL 954 ruling 3, MAIL 978)

Scratch code in no branch, reverted. The tree: 29995967 with Mars's three folders of `agent/mars-place` 00c41dcd, Mars with `cull: true`, draft, 1 sample, software GL, one render at a time, one render a number. After a frame every triangle of the kept patches draws its own number with the depth test and the picture of numbers is read back: a triangle whose number is in the picture wins a pixel. Every triangle is also sorted on the CPU by the positions the cap's own vertex program gives (read back from a float target). Then the same frame is rendered three times more with the cap's mesh swapped: the same triangles as a plain mesh (the control of the swap), (a) only the patches that hold a winning triangle, (b) only the winning triangles.

| frame, size | patches | triangles | win a pixel | outside the lens | facing away | in the lens, between pixel centres | hold a centre | as drawn s | control s | (a) patches, s | (b) s |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2448, 1920 by 1080 | 7 506 | 3 843 072 | 1 460 652 (38.0 %) | 5.5 % | 1.1 % | 54.1 % | 39.3 % | 13.7 | 14.0 | 7 186, 13.6 | 11.2 |
| 2464, 1920 by 1080 | 11 110 | 5 688 320 | 1 395 110 (24.5 %) | 9.3 % | 18.7 % | 45.2 % | 26.8 % | 21.6 | 21.5 | 7 987, 19.3 | 15.8 |
| 2472, 1920 by 1080 | 8 874 | 4 543 488 | 1 081 149 (23.8 %) | 15.2 % | 27.7 % | 30.3 % | 26.8 % | 19.7 | 19.7 | 5 145, 17.5 | 14.8 |
| 2690, 1920 by 1080 | 9 204 | 4 712 448 | 1 393 083 (29.6 %) | 17.9 % | 13.4 % | 37.0 % | 31.7 % | 19.1 | 19.5 | 6 533, 18.0 | 15.1 |
| 2701, 1920 by 1080 | 10 457 | 5 353 984 | 1 576 539 (29.4 %) | 5.2 % | 2.0 % | 62.2 % | 30.6 % | 15.6 | 15.8 | 9 910, 15.4 | 11.4 |
| 2464, 3840 by 2160 | 11 110 | 5 688 320 | 2 747 682 (48.3 %) | 9.3 % | 18.7 % | 19.1 % | 52.9 % | 53.9 | 53.8 | 8 045, 52.1 | 48.5 |
| 2472, 3840 by 2160 | 8 874 | 4 543 488 | 1 797 939 (39.6 %) | 15.2 % | 27.7 % | 12.3 % | 44.7 % | 50.7 | 50.3 | 5 198, 47.7 | 44.7 |
| 2701, 3840 by 2160 | 10 457 | 5 353 984 | 3 054 748 (57.1 %) | 5.2 % | 2.0 % | 33.5 % | 59.3 % | 36.6 | 36.1 | 9 927, 35.7 | 33.3 |

- Every PNG of the control, (a) and (b) is equal to the frame as drawn: 15 of 15 and 9 of 9.
- Of the kept triangles 62 to 76 % reach no pixel at 1920 by 1080 and 43 to 60 % at 3840 by 2160.
- (b) against as drawn: 2.5 to 5.8 s a frame at 1920 by 1080, 3.3 to 6.0 s at 3840 by 2160. (a): 0.1 to 2.3 s and 0.9 to 3.0 s, in the deep frames (2464, 2472, 2690), where 13 to 28 % of the triangles lie past the horizon. The control is off by 0.5 s at most.
- A triangle between pixel centres has a median area of 0.08 to 0.28 of a pixel at 1920 by 1080 and 0.26 to 0.55 at 3840 by 2160. At 2701 the finest grid drawn (0.7 degrees) holds 2 097 152 triangles; 117 376 of them win a pixel at 1920 by 1080 and 471 711 at 3840 by 2160.
- The CPU count against the card: the fragments differ by 32 to 790 of 2.0 to 2.2 million at 1920 by 1080 and by 100 to 837 of 7.9 to 8.7 million at 3840 by 2160; 2.8 to 4.0 % of the winners (0.8 to 1.5 % at 3840 by 2160) sit in a class the CPU count calls without a fragment, since the card snaps positions to a part of a pixel. The column "win a pixel" is the card's own.

What it says, as a reading and not as a measurement: the triangles past the horizon or outside the lens come in whole patches and could be known beforehand, with (a) as the ceiling (it also knows ground hidden behind nearer ground). The triangles between pixel centres come from the finest grid being finer than a pixel by the stop's own numbers (`cells` 1024, `fine` 1, and `pixel` as the angle of a pixel at 1080 rows whatever the size of the frame); which of them catches a centre hangs on where it falls inside the pixel, so fewer of them means a coarser grid and bytes that move, as with cells 512.

Not measured: a rule beforehand for (a) and whether it keeps the bytes; other frames; the final tier, where 16 samples may make more triangles win; a hardware card.

### Bounds of the height per patch: built, measured, not taken (MAIL 933)

A table of the least and the highest texel per tile of 8 by 8 of every height level, in a pyramid; per patch the range of the heights of the levels that can reach it, widened by the mip the vertex shader can read at the largest size of a pixel on the ground in the patch; a level that is whole over the patch replaces the range below it. Unit tests held it (a twin of the vertex shader's height; 4 changes made on purpose each turned one red) and the same Mars draft frames were byte equal with it. Patches kept with the common bounds to with the bounds per patch: 2455 8668 to 8319 of 20640; 2459 11846 to 11084 of 24060; 2472 8822 to 8009; 2476 8274 to 7387; 2690 10542 to 9859; 2694 12537 to 12197; 2701 12642 to 12584 of 20640. Seconds of a draft frame, common to per patch: 2432 8.9 to 8.9; 2440 10.0 to 10.2; 2448 11.7 to 11.7; 2456 15.2 to 14.9; 2464 20.5 to 20.8; 2472 21.3 to 20.9. The sift itself: about 2 ms a draw with the common bounds, about 15 ms with the bounds per patch. The patches that stay are nearly all in the lens; the heights were not what kept them. Not in the repository.

## Proof with the options off

Draft stills `out/work/stills/f%05d-16x9-draft-full.png`, sha256, frames 360 (sun.hold), 615 (mercury.hold), 717 (mercury.dive), 1185 (venus.hold), 1857 (earth.dive), 2325 (mars.hold), 2427 (mars.dive), 2997 (jupiter.dive), 3465 (saturn.hold), 4035 (uranus.hold), 4707 (neptune.dive). The references were rendered at `412d2d09` before any change. The runs are named in the log below.

## Log

- Tasks 1, 2 and 3 (code and tests). `npx vitest run`: 64 files, 135 tests green, of them `tests/globe-levels.test.ts` (6, shader text per option set) and `tests/globe-gl.test.ts` (5, in the harness browser with its flags). Options off: the 11 draft stills are byte equal to the references (run with the planet shader change only, then again with every change in). Not yet shown: a film frame with an option on.
- Task 2 on pictures: Mars 2454 `side=orbit/noplace` before and after, texels shares, three consecutive frames (section 2). The Mars set in the repository is unchanged; the flag was set only in a scratch worktree.
- Merged main d690e42a (only `kit/PROGRESS.md` differs from the starting commit).
- Haze glow (section 5), asked by the Mars builder. `npx vitest run`: 66 files, 140 tests green (`tests/globe-haze.test.ts` 4, one more in `tests/globe-gl.test.ts`). Options off: the 11 draft stills are byte equal to the references of `412d2d09` again. Not yet shown: a film frame with the glow on.
- Glow on a picture (scratch worktree, never committed): Mars 2454 and 2448, `beauty/side=orbit/noplace`, draft, `glow: true` on `look.haze` and `look.shellHaze`, direction on the horizon 40 degrees right of the view axis, colour 1.0 0.55 0.35, power 12. Mean change of the frame by third of its width, in 8 bit levels (r g b), frame 2454: left 0.0 0.0 0.0, middle 3.5 2.7 2.0, right 28.9 23.6 17.9; frame 2448: left 0, middle 3.6 2.8 2.1, right 30.3 24.7 18.9. With the scratch edit removed the still of 2454 has the sha256 it had before the glow existed (29a3ada1...).
- MAIL 255 item 2: fadeMinor off and on with the real plates of `agent/mars-place` 41d7784 at Mars 2448 and 2704 (section 2, last part). Nothing of the Mars stop was changed in this branch. Merged main 03510ddd.
- Options off after the merge of main 03510ddd: the 11 draft stills at f6dcf002 are byte equal to the same frames rendered at main 03510ddd. Main itself differs from the references of `412d2d09` at frame 2427 only (the Mars dive of the handover engine). `npx vitest run`: 76 files, 160 tests green.
- Gain of the own levels (section 6), asked by the Mars builder. `npx vitest run`: 76 files, 162 tests green (one more in `tests/globe-levels.test.ts`, one more in `tests/globe-gl.test.ts`). Options off: the 11 draft stills are byte equal to the same frames of main 03510ddd.
- Gain of the own levels moved from the texel to the scene value (section 6), asked by the Mars builder. `npx vitest run`: 82 files, 180 tests green. Options off: the 11 draft stills are byte equal to the same frames of main fdf97b84. On `agent/mars-place` 8b7c9a40 with this planet shader in a scratch worktree (`beauty/side=orbit/noplace`, draft): frame 2448, where that stop's gain is 1, keeps its bytes (sha256 `1e19db65...`); frame 2426 changes on 810912 of 2073600 pixels, by at most 4 of 255, mean 106.82 69.34 53.78 to 107.27 69.80 54.18.
- Air setters (section 7) and relief cap (section 8), MAIL 373 and 376. Commits 329343cd (air), 8445b6f6 (cap, loader), 63761051 (grids by footprint). Options off at 8445b6f6 against main 72816fc: the nine hold frames 360, 615, 1185, 1755, 2325, 2895, 3465, 4035, 4605 and the dive frames 717, 1857, 2427, 2997, 4707 at draft are byte equal (frame 360 was rendered one edit of `cap.ts` before the commit). `npx vitest run` after the merge of main 304f1c68: 244 tests green, tsc clean.
- Merge of main 304f1c68 (e28f9c95): the same 14 draft frames with the options off are byte equal to main 72816fc but frame 717, which main itself changed (Mercury); 717 at e28f9c95 equals 717 rendered at main 304f1c68 (`93a380d7...`). `npx tsc --noEmit` clean, `npx vitest run` 244 green.
- Merge of main 65fb91d (e8283808, the capture rate): the same 14 draft frames with the options off are byte equal to the 14 of e28f9c95. `npx tsc --noEmit` clean, `npx vitest run` 256 green (33 files), `vite build` clean (run by the still tool).
- Cap on Mars's heights baked again (section 8, last part): drafts 2409 to 2449, one still at 3840 by 2160, the gap measured again.
- Merge of main 94be42ed and 4d7175f6 (69ac8b40, plan E's one move). Swap of sphere for cap measured in the film's terms: it stays (section 8). Light of the cap's own heights (`light`) and haze to its own surface (MAIL 431 item 3). Proof with the options off on the merge with these changes in the tree: the 14 draft frames; 13 are byte equal to the 14 of e8283808, frame 2427 (changed by main's plan E) is byte equal to 2427 rendered at main 4d7175f6 (`4d85b04d...`). `npx tsc --noEmit` clean, `npx vitest run` 291 passed, 0 failed, 1 todo of main's (37 files), `vite build` clean (run by the still tool).
- MAIL 454: the light at full wherever the cap is drawn and from a height the stop names (`light.from`); the air to the ground as one exported chunk (`GROUND_AIR_GLSL`), used by the cap; a centre per colour level (`centresDeg`, section 4).
- `light.from` on Mars, scratch tree (heights v3, light 1,1), draft: with `from` Infinity the hold 2325 differs from the picture without `from` by mean 0.08 of 255, largest 64 (the canyon's walls), 12 percent of the pixels, 0.01 percent by more than 8; frame 2400 above the band by mean 0.07; frame 2409 in the band by nothing. The hold took 28.6 s against 19.5 s. The hold is the approved picture, so the stop keeps `from` under the hold's height or sends the pair to the Builder (MAIL 454 item 2, iii).
- Proof of the commit named to the Builder (1e36be06, and its merge with main f2375d2e, abe760fd): tsc clean, the whole suite 316 passed and 0 failed on the merge, build made; 20 draft frames with the options off equal to main's (14 frames of nine stops, Mars 2401 to 2406; 2997 against main f2375d2e, which changed it).
- A second Sun for the cap's own light was asked and ruled out (MAIL 462): the cap lights with the globe's Sun.
- The frame factor (section 9, NOTE 501). Commits d788d85c (the factor) and 73f4aa6e (the scale of a place picture against the master's), merged with main 26677ed9 as dace4ba6. On 73f4aa6e: `npx vitest run` 376 passed, 0 failed; 20 draft frames at 16 by 9: 360, 615, 1185, 1755, 2325, 2895, 3465, 4035, 4605, 717, 1857, 2997, 4707 byte equal to the same frames of abe760fd (before the change), Mars 2401 to 2406 and 2427 byte equal to the same rendered at main 6884e808, which had changed them. On dace4ba6: tsc clean, 376 passed, build made; 615 and 717 equal to main 26677ed9, 2325 and 2427 equal to 73f4aa6e.
- `npm run smooth -- --stop mars --only parity` (uhd scaled down by 2 against 16 by 9, draft, levels of 255), main 26677ed9 against dace4ba6. Both green. Mean, 99th percentile, largest coarse difference, block level:
  - 2423 dive: 1.286, 4.6, 18.25, -1.813 to 1.255, 4.5, 18.25, -1.816
  - 2445 dive: 1.393, 5.9, 3.61, -0.903 to 1.284, 4.5, 3.47, -1.051
  - 2468 dive: 1.316, 5.1, 5.46, -0.965 to 1.310, 5.0, 5.46, -0.965
  - 2580 terrain: 1.552, 9.3, 8.23, -2.046, the same after (the place picture has the master's pixels at uhd, so its factor is 1)
  - 2689 rise: 1.353, 6.2, 5.16, -1.431, the same after
  - 2708 rise: 1.475, 7.0, 3.87, -1.394 to 1.310, 5.0, 3.58, -1.360
  - 2726 rise: 1.540, 8.8, 31.23, -1.633 to 1.188, 4.0, 13.66, -0.855
  The four numbers the limits read (mean 1.552, coarse mean 0.549, block -2.046, level -0.508) stand at 2580 before and after. Mars was inside the limits before the change; the change is seen on five of the seven frames, most at 2726. Seconds a draft frame at uhd 18.9 before, 22.0 after (one run each).
- Merge of main e7fc53a2 (88ba5871; the parity now reads the hold and the leaving leg, nine frames). Mars parity again, main e7fc53a2 against the merge, both green. Mean, 99th percentile, largest coarse difference, block level:
  - 2325 hold: 2.014, 16.5, 28.38, 3.250 to 1.305, 6.1, 6.24, -1.270. In the difference picture the band of Valles Marineris, where a plate level came in earlier at uhd, is gone.
  - 2783 travel: 1.919, 20.9, 32.65, -2.806 to 1.918, 20.9, 32.65, -2.806; level -0.98, fine detail 1.755. The difference picture shows the stars (`src/space`, not this folder) and faintly the moon's fine detail. The largest pixel fell from 210 to 169.
  - The seven frames between as in the entry above, to the digit.
  The largest numbers before: mean 2.014 and block 3.250 at the hold; after: mean 1.918, coarse mean 1.024, block -2.806, level -0.980, all at 2783.
- MAIL 591: the named-tree table of `globe-levels.py` and what is red in Mars's dive at 2449 (section 10, two new parts). Runs a to o and j on b83618ec in a scratch tree, the judge's own tool; nothing of it is in the repository's code.
- Merged main 1c3da4b2 (6ecaad26). The turn of the body (section 11): the cap's vertex program turns by `uSpinTurn` from the page, and `exactSpin` gives the same pair to the fragment of the globe and of the cap. `npx vitest run`: 461 tests green, two new in `tests/globe-cap.test.ts` (one of text, one in the harness browser; the browser test fails on the old vertex program with widths 40 and 38 for 46). Options off: the 11 draft stills of the proof list, rendered at 6ecaad26 and at this tree, are byte equal, 11 of 11. Not rendered: a film frame with a cap (no stop on main draws one), and a frame with `exactSpin` on.
- TASK 697, MAIL 704: merged main ed003c70 (226eec4e). Section 12: the pattern measure follows the enlargement of the carried frame (`enlarged`, `matched` in `tools/img/smooth.py`), made proofs in `tools/smooth/made.py` (`carried`, `spread`) and ten new tests in `tests/smooth.test.ts`. Nothing in `src/` is touched, so the frames of every stop stand. `npx vitest run` on the merge with the patch: 564 tests, 561 green; the three red ones are in `tests/weights.test.ts` ("no dive of the film leaves a sky over 24 frames and a picture over 12 to the engine any more") and are red on main ed003c70 alone as well (that file run in a clean tree: 6 of 9). `tests/smooth.test.ts` 68 of 68 in 156 s on a loaded machine, `tests/globe-cap.test.ts` 24 of 24 in the whole run.
- MAIL 710 (d236): the first patch not taken; the cure that keeps the band (section 12, rewritten). Merged main dfdc58cf. `tools/img/smooth.py` (`carry`, `finer`, `sharper`, `band`, `readings`, `reading`; `matched` removed), `tools/smooth.ts` (`patternBand` printed), `tools/smooth/made.py` (`carried` on full size films), `tests/smooth.test.ts`. Nothing in `src/` is touched, so the frames of every stop stand. `npx tsc --noEmit` clean. `npx vitest run` on the merge 4516efa8: 565 tests, 564 green, one red: `tests/globe-cap.test.ts` "brings a colour level in by the texels of its parent" ran 5018 ms against its limit of 5000 in the whole run; that file alone: 24 of 24, the same test in 3343 ms. `tests/smooth.test.ts` 69 of 69 in 92 s in the whole run, `tests/weights.test.ts` 9 of 9. One report printed by `tools/smooth.ts` with these tools on main 2bc36ce6 in a scratch tree (`--stop venus --kind rise --only pictures --frames 3086-3086`): the row of frame 1543 reads 0.76 at 159, 355, `band 8 px` in the red line, in the line of the largest change of the pattern and in the column `band px` (8.0); the panel of the changes has the second row for the reading on the later frame.
- MAIL 744 B (b): the pale air beyond the edge (`limbAir`, section 14), `src/bodies/limb.ts`, one option of `Planet`, `tests/globe-limb.test.ts` (5 tests). Merged main 7346c598 (0ed3b250). On the merge with the change: tsc clean; `npx vitest run` 58 files, 621 tests, 1 red (`tests/globe-cap.test.ts`, "brings a colour level in by the texels of its parent", 5002 ms against its limit of 5000; the file alone: 24 passed, that test 3791 ms; the test was not touched). With the option off the 47 judged frames at draft have the hashes of 767f8d11, 47 of 47. Looked at on Mars 2325 final only, in a scratch copy of Mars's set; no stop turns it on.
- MAIL 795 item 4 (d253): the audit of what counts pixels and what counts loaded texels (section 15). (a) none without the frame factor on a pixel path of `src/bodies`, `src/terrain`, `src/core/sets.ts`. (b) two terms counted the loaded set, both in the shared globe: cured by `patches.counts` (`src/bodies/planet.ts`) and `count` of a cap level (`src/bodies/cap.ts`), off by default, `tests/globe-count.test.ts` (5 tests). Merged main cc9015f2 (a76f725c). The pose record corrected after harness_builder measured it (section 13): the sky is `inverse(skyTurn) * skyQuaternion`, the body's turn is `plan.drawn` where a plan has it; `tests/globe-pose.test.ts` (3 tests). Over 8 film frames the sky stands apart from the camera by 8.39 degrees at Mercury 1434, 1.61 at Mars 4814, 1.20 at Earth 3680, 0.04 at Venus 2516; Mercury's drawn turn stands apart from `plan.turn` by 4.92 degrees at capture 2032 and 2.52 at 1740. The test runs and the proof are in the mail of the commit and in section 15.
- MAIL 812.5 (asked by harness_builder): Earth's rise, rows 4223 to 4259 refused by the pattern reader (section 16). Cause A, the range picture of Earth's ground on the globe holds the sum of two codes where its cover is partial (one line of `src/stops/earth/relief.ts`, a patch, the builder's file). Cause B, the drawn shape of the globe was not in the pose record: `bodies[0].shape` from the plan's `drawnShape` (`tools/smooth/pose.ts`), taken by `carried` and `shaped` of `tools/img/range.py`, one test more in `tests/globe-pose.test.ts` and one in `tests/globe-range.test.ts`; Earth's plan hands it by a patch (the builder's file). Nothing in `src/` is touched. Flow left with both, median px at four pairs: 0.1, 0.1, 0.3, 0.8 (before 0.1, 1.0, 3.4, 21.5).
  On the merge of main 6af0b7e4 (62ae7720): tsc clean; `npx vitest run` 60 files, 631 tests, 630 passed, 1 red (`tests/globe-cap.test.ts`, "brings a colour level in by the texels of its parent", 5063 ms against its limit of 5000, while the whole set ran; the file alone 24 of 24, that test 2749 ms; the test is not touched), 405 s. Options off, draft, frames 615, 717, 1755, 1857, 2325, 2427, 2895, 2997: 8 of 8 byte equal to the list of 86184412; engine hash 7de408a91944bdb0.
- MAIL 835 task 1 (the moon, asked by harness_builder): every body a stop draws in its dive, rise and hold, in the pose record (section 17). `tools/smooth/pose.ts` (`drawnBodies`, `drawnSeat`, the fallback from `nearBodies`), `tools/img/range.py` (`beyond`, `owner`, `off`, `moved`, `HOLD`), `tests/globe-pose.test.ts` (3 tests more), `tests/globe-range.test.ts` (1 more). Only `tools/`, `tests/` and this notebook change, nothing under `src/`. Six patches for the plans of Earth, Mars, Jupiter, Saturn, Uranus and Neptune went to the Builder, none is in the repository. Before the merge: tsc clean; `npx vitest run` 60 files, 635 tests, 635 passed, 397 s; options off, draft, frames 615, 717, 1755, 1857, 2325, 2427, 2895, 2997: 8 of 8 byte equal to the list of 86184412. On the merge of main 9f603521 (5be4706c): tsc clean; `npx vitest run` 60 files, 639 tests, 639 passed, 400 s. The 8 frames were not rendered again on the merge (main changed `src/director/film.ts` and `src/space/farsun`; this commit changes no file under `src/`).
- MAIL 835 tasks 2, 3 and 4, and the two keys asked by harness_builder (sections 18, 19, 20). `tools/smooth/pose.ts` (the close unit is the plan's own twin, `camera.near`, `drawnFlow` and `drawnLight` to `bodies[0].flows` and `bodies[0].light`), `tools/img/range.py` (`points` takes no unit in front of the near plane), `tests/globe-pose.test.ts` (2 tests more), `tests/globe-range.test.ts` (1 more). Nothing under `src/` changes. Patches for the builders' files went to the Builder, none is in the repository: the range of the traced ball for Jupiter's globe and Io and for Saturn's two globes; Uranus's `drawnShape` went with section 17. Merged main 63cf4b21 (6381d7ef; main changed `kit/` and `scorecards/` alone). On the merge with the changes: tsc clean; `npx vitest run` 60 files, 642 tests, 641 passed, 1 red (`tests/globe-cap.test.ts`, "brings a colour level in by the texels of its parent", 5003 ms against its limit of 5000 while the whole set ran; the file alone 24 of 24, that test 2586 ms; the test is not touched), 399 s. Options off, draft, frames 615, 717, 1755, 1857, 2325, 2427, 2895, 2997: 6 of 8 byte equal to the list of 86184412; 615 and 717 (Mercury) are 90038bb5cfadf649 and 4d8319ccbe410fd2, not 5646f2965e4fecff and 41586877bcd3191d. This tree differs from main 63cf4b21 in `tools/`, `tests/` and this notebook alone (`git diff --stat origin/main`), and main changed `src/space/farsun` and `src/director/film.ts` after 86184412; the two frames were not rendered at main apart.
- MAIL 866 items 3 and 5 (the hook asked by mars_place_builder): the detail of a cap from the stop's own code (section 21). `src/bodies/cap.ts` (`detail`, `capDetail`), `src/bodies/planet.ts` (`PatchShader.detail`, `uFrame` on the cap), `tests/globe-detail.test.ts` (4 tests), `tests/globe-cap.test.ts` (5 tests more in the browser; the page keeps the last planet until the next has drawn, the cure of the clock test). Hook absent, draft, full set, 1920 by 1080, the 115 frames of the Builder's list of main 63cf4b21 (MAIL 867), full sha256 of the png, one session for every 20 frames: 115 back, 115 byte equal; drawn on the tree before the merge of main 4bc15f82, which brings `kit/PROGRESS.md` only; engine hash 6a5237758f4b4713. On the merge: tsc clean; `npx vitest run` 61 files, 651 tests, 651 passed, 395 s; the clock test 3511 ms in that whole run against its limit of 5000 (5003 before the cure), 2021 and 2030 ms with its file alone (2586 before). Not shown: a film frame with the option on; the time of the three calls on a film frame.
- MAIL 888 point 2 (the cull proposed by handover_engineer) and MAIL 900: the cap's patches sifted by the lens of each draw (section 22). `src/bodies/cap.ts` (`cull`, `capSift`, the lens object and the refusal of the mesh), `src/bodies/planet.ts` (the lens object ahead of the cap's mesh), `tests/globe-cull.test.ts` (3 tests), `tests/globe-cap.test.ts` (1 test more in the browser; the test "brings a colour level in by the texels of its parent" takes the limit of its neighbours, 120000 ms: it was the one browser test of the file left at the default of 5000 and took 5014 ms once on the Builder's machine under load). Option off, draft, full set, 1920 by 1080, full sha256 of the png. On the tree of 7b482c07 with the cull: the 115 frames of the Builder's list: 115 back, 115 byte equal; engine hash 920de43abbec29a9; `npx vitest run` 62 files, 655 of 655, 397 s, the clock test 3868 ms. On the merge of main 64c4ccb4 (508f3333) with the cull: tsc clean; `npx vitest run` 64 files, 720 of 720, 408 s, the clock test 3566 ms; frames 615, 717, 1755, 1857, 2325, 2427, 2895, 2997: 8 of 8 byte equal to the list; engine hash 8c639223a2a3e013. Option on at Mars (a scratch edit, not in the repository), on the tree of 7b482c07 with the cull: 14 of 14 frames at rate 1 and 41 of 41 capture frames at rate 2 byte equal to the option off, 13 of 13 of Mars's frames of the list equal to the list (section 22). Not rendered with the option on after the merge of main.
- MAIL 954 ruling 1: an own level under a whole level is not read (section 23), on `take/b10e` 8cfc71f2. `src/bodies/planet.ts` (`patchLevels`, two passes for a body with own levels; the text without own levels to the letter), `tests/globe-lean.test.ts` (4 tests), `tests/globe-gl.test.ts` (1 case more in the browser), `tests/globe-levels.test.ts` (the pin of the text with own levels). On the code commit 29995967: tsc clean; `npx vitest run` 75 files, 826 tests, 824 passed, 2 red, both in `tests/pass.test.ts` ("leads every other answer by 2 degrees at every stop of the film", Mercury 0.0042 against 2; "refuses a turn that the end of the rise cannot reach, unless the stop says it takes the corner", 0.0074 against 1), 567 s; the same two are red on 8cfc71f2 with that file run alone, and the Builder's d281 names them and their cause (not in this change, not touched). Mars on a scratch merge with `agent/mars-place` e53c76b7, 12 frames of dive and rise, before against after: 12 of 12 byte equal at 1920 by 1080 and 12 of 12 at 3840 by 2160, draft. Frames 615, 717, 1755, 1857, 2325, 2427, 2895, 2997 against 8cfc71f2, draft: 8 of 8 byte equal. Also in this section: the cost table of MAIL 933, the list to draw on of MAIL 954, the bounds per patch that were not taken. Origin main is not merged here: the base is `take/b10e` as ruled, and 8cfc71f2 does not hold main 9d53040b.
- MAIL 954 ruling 3 and MAIL 978: the triangles of the cap that reach no pixel, counted on five frames of Mars at two sizes, and the seconds with them left out (a part of section 23). Scratch only; nothing in the code. The 12 Mars pairs of section 23 again on `agent/mars-place` 00c41dcd: 12 of 12 byte equal at both sizes. On `take/b10e` b1721d2c.
