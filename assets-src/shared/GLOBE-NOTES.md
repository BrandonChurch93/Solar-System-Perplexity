# Globe notes

Notebook of the globe engineer (brief 243). Folders: `src/bodies/`, `src/core/sets.ts`, `tests/globe-*.test.ts`, this file. Branch `agent/engine-globe`, started from `412d2d09`.

Three options, all off by default. A stop that turns none of them on gets the shader text of the starting commit (sha256 `81b01893...` held by `tests/patches.test.ts`) and the same texture uploads.

| option | where | a stop turns it on with |
| --- | --- | --- |
| own light per patch level | `PatchSet.own` in `src/bodies/planet.ts` | `own: [false, false, true, ...]`, one entry per level, beside `widthsDeg` |
| level fade by the fine axis | `PatchSet.fadeMinor` in `src/bodies/planet.ts` | `fadeMinor: true` |
| one channel texture | `ctx.texture` in `src/core/sets.ts` | `ctx.texture(path, { srgb: false, channels: 1 })` |

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

Texels view (`uDiag == 2`): red is unchanged, the longer axis in texels of the level really drawn (the drawn level is the last one with weight above one half, as today), so `tools/measure/texels.ts` and G13 read the truth with the flag on. With the flag the view also writes blue: `0.5 * (short axis in texels of the drawn level) / max(longer / anisotropy, 1)`, that is the texels of the mip really sampled per pixel on the fine axis; 0.5 means one to one, less means the picture is magnified across the fine axis. Blue is 0 without the flag, as today.

Measured in `tests/globe-gl.test.ts` (a camera 0.005 radii up, pitched 20 degrees down, levels of 60, 30 and 15 degrees at 4096 px, anisotropy 16): at the centre pixel the 30 degree level has 2.92 by 0.92 texels per pixel. Without the flag the 15 degree level is not drawn there; with the flag it is drawn at full weight, red reads 1 (the longer axis is 5.93 texels of that level, clipped at 2) and blue reads 0.94 (1.88 texels on the fine axis). With anisotropy 2 on every texture the blue value falls to the predicted 1.88 / (5.93 / 2).

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

## 4. A centre per patch level

Not built. The Mars builder measured that it would save 18 MB, not a level.

## Proof with the options off

Draft stills `out/work/stills/f%05d-16x9-draft-full.png`, sha256, frames 360 (sun.hold), 615 (mercury.hold), 717 (mercury.dive), 1185 (venus.hold), 1857 (earth.dive), 2325 (mars.hold), 2427 (mars.dive), 2997 (jupiter.dive), 3465 (saturn.hold), 4035 (uranus.hold), 4707 (neptune.dive). The references were rendered at `412d2d09` before any change. The runs are named in the log below.

## Log

- Tasks 1, 2 and 3 (code and tests). `npx vitest run`: 64 files, 135 tests green, of them `tests/globe-levels.test.ts` (6, shader text per option set) and `tests/globe-gl.test.ts` (5, in the harness browser with its flags). Options off: the 11 draft stills are byte equal to the references (run with the planet shader change only, then again with every change in). Not yet shown: a film frame with an option on.
