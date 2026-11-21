# Engine render time

Branch `agent/engine-perf`. Owner: the supporting agent `engine_profiler`. Shared engine and harness files only.

## Working notes (read again after any compaction)

- VM: 4 cores, 7 GB RAM. Repo at `/home/user/workspace/repo`, baselines at `/home/user/workspace/base/f{2325,2580,2427,2726}.png`, helper `/home/user/workspace/four.sh <outdir> [frames]` renders the four frames at `final` in turn and prints sha256 and seconds.
- One render process at a time. Long jobs detached with a polled log.
- `tools/perf.ts` (`npx tsx tools/perf.ts --tier review --frames 2325,2580`) times every draw call with a pixel read back after each.
- Rule for a kept change: four sha256 equal to the baselines, `npm run build`, `npx vitest run`, `npm run determinism`.

## Baselines

Build at the clone (main at the time of the clone), `final` tier, master format, `full` assets, this VM.

| Frame | View | Samples | Seconds | sha256 |
| --- | --- | --- | --- | --- |
| 2325 | hold | 16 | 72.2 | 9895a050abe22d0ce0ad92bdd6e8b1b52836d9728657555900b0f614b07f744d |
| 2580 | terrain | 16 | 92.5 | a7e1670abf3e4a249d78a07e48eab4264c3d4b0811584fb03984b87f45c1f5b8 |
| 2427 | dive | 64 | 236.5 | 0a022282c24d2285b0262002cb1f92952ec9a6c0dbbf1c86ca404992be7fc814 |
| 2726 | rise | 64 | 250.0 | 79352ec57fa5c00bacf5b4d004444bc515f7aaf5d7b9513a7d267c05e85c8b05 |

Seconds include the browser start and the set load (about 16 s).

## Where a sample goes (before any change)

`npx tsx tools/perf.ts --tier review`, seconds per sample, one pixel read back after every draw call so that the rasterizer has finished before the timer stops. The percentages are shares of the sample.

| Part | hold 2325 | terrain 2580 | dive 2427 | rise 2726 |
| --- | --- | --- | --- | --- |
| sky map pass (full screen) | 1.653 (50 %) | 2.223 (45 %) | 1.639 (47 %) | 2.413 (64 %) |
| star points (3,465,000 vertices) | 0.893 (27 %) | 1.150 (23 %) | 1.066 (31 %) | 0.772 (20 %) |
| planet (305,280 vertices, five patch levels) | 0.458 (14 %) | - | 0.568 (16 %) | 0.415 (11 %) |
| relief layers with apron (3) | - | 0.791 + 0.461 + 0.188 = 1.440 (29 %) | - | - |
| relief air | - | 0.081 (2 %) | - | - |
| moon | 0.131 (4 %) | - | - | - |
| haze shells (3) | 0.145 (4 %) | - | 0.168 (5 %) | 0.124 (3 %) |
| clear | 0.029 | 0.029 | 0.028 | 0.030 |
| accumulator | 0.023 | 0.026 | 0.025 | 0.026 |
| script between calls | 0.003 | 0.003 | 0.003 | 0.003 |
| all draw calls of a sample | 3.332 | 4.950 | 3.494 | 3.780 |

Once per frame (not per sample): lens chain 0.25 s (final pass to the canvas 0.14 s, bloom up 960 x 540 0.04 s, the rest under 0.02 s each), canvas to PNG and base64 in the page 0.25 to 0.34 s. No texture is uploaded between samples. Cover and dust are not drawn at these four frames.

Inside the sky map pass (draft tier, hold / terrain, by removing parts of the shader in `tools/perf.ts --edits`):

| Sky pass | hold 2325 | terrain 2580 |
| --- | --- | --- |
| as shipped | 1.63 | 2.18 |
| without the 8 extra band taps (`lo`) | 0.55 | 0.67 |
| without the patch taps | 1.53 | 2.11 |
| without any band or patch tap | 0.46 | 0.39 |

How SwiftShader behaves, measured here:
- Control flow does not skip arithmetic (first measured, later read in `src/Pipeline/SpirvShaderControlFlow.cpp`). `if`, `switch` and loops only set a mask per lane of the 2 x 2 quad; both sides of an `if` run for every pixel, and a loop is emitted as do-while, so its body runs at least once whatever the condition says. What is skipped is a texture sample when no lane of the quad is active (`If(AnyTrue(activeLaneMask()))` in `EmitImageSample`). Measured: taps inside `for (int k = 0; k < (cond ? 1 : 0); k++) { ... }` are skipped, the same taps inside a plain `if (cond)` were not. So the loop form pays only for texture taps, never for arithmetic; derivatives are taken outside the loop.
- `discard` is a demote to a helper lane: the rest of the shader still runs for that pixel. A shader that is mostly arithmetic costs quads shaded times instructions, and the only levers are fewer quads (do not send the geometry, scissor) or a leaner shader variant by `#define`.
- A 2 x 2 quad is shaded once per triangle that touches it, so triangles of about one pixel multiply the fragment cost (see the mesh density note under "Tried").
- `mix(x, y, a)` is `a * (y - x) + x`. With `a` exactly 0 the result is exactly `x`, so a term with zero weight can be skipped without changing a bit. With `a` exactly 1 the result can differ from `y` by one unit in the last place, so that case is not exact to skip.

## Changes

Seconds are the time `tools/still.ts` reports for one frame at `final` on this VM (16 samples for hold and terrain, 64 for dive and rise, plus about 16 s of start and set load).

### 1. Star points outside the view are not drawn (`4105862`)

`src/space/sky.ts`: the points go through an index list rebuilt on the CPU when the view changes (once per frame, because the sky uses the mid shutter view for every sample). The list is ascending, so the points that remain are drawn in the same order and the additive sum is the same. Margin: half the largest point plus 4 pixels plus the pixel jitter.

| Frame | Before | After | sha256 after |
| --- | --- | --- | --- |
| 2325 hold | 72.2 | 59.6 | 9895a050abe22d0ce0ad92bdd6e8b1b52836d9728657555900b0f614b07f744d (same) |
| 2580 terrain | 92.5 | 80.8 | a7e1670abf3e4a249d78a07e48eab4264c3d4b0811584fb03984b87f45c1f5b8 (same) |
| 2427 dive | 236.5 | 190.1 | 0a022282c24d2285b0262002cb1f92952ec9a6c0dbbf1c86ca404992be7fc814 (same) |
| 2726 rise | 250.0 | 207.5 | 79352ec57fa5c00bacf5b4d004444bc515f7aaf5d7b9513a7d267c05e85c8b05 (same) |

Star draw per sample: 0.89 to 0.22 s (hold), 1.15 to 0.28 s (terrain), 1.07 to 0.24 s (dive), 0.77 to 0.03 s (rise). Points drawn: 451,000, 589,000, 474,000 and 34,000 of 3,465,000. `npm run build`, `npx vitest run` (24 tests) and `npm run determinism` pass.

### 2. Sky pass: band, patch and glare work only where it has weight (`0ef5c3e`)

`src/space/sky.ts`, fragment shader of the sky map pass. The band block (nine band fetches, the region fetch, `inverseFilmic`, `pow`) sits in a single pass loop that runs only where the band weight `bc.z` is above zero. The four patch fetches of each sky patch run only where the patch weight is above zero. The sun glare block is a loop on `uSunGlare > 0`. Zero weight leaves `mix` and the additive patch exactly unchanged, the derivatives are taken outside the loops.

| Frame | Before | After | sha256 after |
| --- | --- | --- | --- |
| 2325 hold | 59.6 | 57.0 | 9895a050abe22d0ce0ad92bdd6e8b1b52836d9728657555900b0f614b07f744d (same) |
| 2580 terrain | 80.8 | 58.9 | a7e1670abf3e4a249d78a07e48eab4264c3d4b0811584fb03984b87f45c1f5b8 (same) |
| 2427 dive | 190.1 | 179.7 | 0a022282c24d2285b0262002cb1f92952ec9a6c0dbbf1c86ca404992be7fc814 (same) |
| 2726 rise | 207.5 | 87.5 | 79352ec57fa5c00bacf5b4d004444bc515f7aaf5d7b9513a7d267c05e85c8b05 (same) |

Sky pass per sample: 1.65 to 1.56 s (hold), 2.30 to 0.87 s (terrain), 1.68 to 1.54 s (dive), 2.36 to 0.49 s (rise). The gain depends on how much of the frame the galactic band covers: at the hold and the dive it covers most of it.

### 3. Star cull only in capture mode (`6e9659f`)

Asked for by the Builder. The cull loop walks all 3,465,000 points each time the view changes. Measured in headless Chrome on this VM (13 views, both asset sets, the star count is the same for `web` and `full`): 44 to 67 ms per call, median 52 ms. That is nothing against a software rendered frame (one call per frame) and far too much for the interactive app. `Sky.cull` is a public field, off by default. `src/main.ts` switches it on when `mode === 'capture'`, which is the mode of every harness tool that renders frames (`tools/lib/browser.ts`). In live, autopilot and export the stars draw as the plain non indexed range of all points, exactly as before change 1.

### 4. Sky and stars are not shaded under opaque objects, capture mode (`de72ad1`)

`src/core/engine.ts`, `src/core/pass.ts`, `src/core/tiles.ts` (new), `src/space/sky.ts`, `tests/tiles.test.ts`. Only when `Sky.cull` is on (capture mode). The sample target gets a stencil buffer. The world is drawn in two parts: first the opaque materials (not transparent, no blending, color write on), each marked once to write stencil 1 where it passes the depth test; then the sky pass and the star points, which pass only where the stencil is 0; then the blended materials (haze shells and the like) as before. An opaque fragment replaces the color, so what the sky wrote under it never reached the frame; the pixels with stencil 0 see the same draws in the same order as before. The stencil decides, not the depth, because a depth of 1.0 can also belong to an opaque fragment at the far plane.

SwiftShader does not reject a fragment early by stencil or by depth (WebGL2 has no `early_fragment_tests`), so the stencil alone gave nothing: sky pass 1.55 s with and without. What saves the time is a scissor. After the opaque part the alpha of the sample target is read back (the clear alpha is 0, an opaque fragment writes more), the frame is cut into 32 px tiles, tiles that still hold a pixel with alpha 0 are merged into rectangles (33 to 36 at these frames), and the sky pass is drawn once per rectangle with the scissor set. A tile is dropped only when every pixel of it carries stencil 1. Tiles of 16 px gave the same time as 32 px.

If the world holds a non transparent material that is not plainly opaque (blending, alpha to coverage, transmission, its own stencil use), or no opaque material at all, the old order is used. The terrain view has no opaque material (the relief layers are blended), so it is unchanged.

| Frame | Before | After | sha256 after |
| --- | --- | --- | --- |
| 2325 hold | 57.0 | 46.7 | 9895a050abe22d0ce0ad92bdd6e8b1b52836d9728657555900b0f614b07f744d (same) |
| 2580 terrain | 58.9 | 59.2 | a7e1670abf3e4a249d78a07e48eab4264c3d4b0811584fb03984b87f45c1f5b8 (same) |
| 2427 dive | 179.7 | 125.3 | 0a022282c24d2285b0262002cb1f92952ec9a6c0dbbf1c86ca404992be7fc814 (same) |
| 2726 rise | 87.5 | 79.5 | 79352ec57fa5c00bacf5b4d004444bc515f7aaf5d7b9513a7d267c05e85c8b05 (same) |

Sky pass per sample (draft): 1.56 to 0.89 s (hold, 49.6 % of the frame covered), 1.58 to 0.64 s (dive, 62.4 %), 0.49 to 0.37 s (rise, 34.7 %). Whole sample: 2.81 to 2.12 s, 2.88 to 1.89 s, 1.35 to 1.19 s. `npm run build`, `npx vitest run` (28 tests) and `npm run determinism` pass.

### 5. Star points that lie wholly on covered tiles are not drawn, capture mode (`c3f52bd`)

`src/space/sky.ts`, `src/core/tiles.ts`, `src/core/engine.ts`. The star cull keeps the list of points in view per view (as in change 1) and filters it per sample against the tile grid of change 4: a point is dropped when every tile touched by its padded square (half the largest point plus 4 pixels plus the pixel jitter) is covered, which means every one of its fragments would fail the stencil test. The order of the points that remain is unchanged. The filter walks only the points in view (about 450,000, a few ms), the walk over all 3,465,000 points still happens once per view. When no tile is open the star draw is skipped.

| Frame | Before | After | sha256 after |
| --- | --- | --- | --- |
| 2325 hold | 46.7 | 45.1 | 9895a050abe22d0ce0ad92bdd6e8b1b52836d9728657555900b0f614b07f744d (same) |
| 2580 terrain | 59.2 | 59.2 | a7e1670abf3e4a249d78a07e48eab4264c3d4b0811584fb03984b87f45c1f5b8 (same) |
| 2427 dive | 125.3 | 115.4 | 0a022282c24d2285b0262002cb1f92952ec9a6c0dbbf1c86ca404992be7fc814 (same) |
| 2726 rise | 79.5 | 81.0 | 79352ec57fa5c00bacf5b4d004444bc515f7aaf5d7b9513a7d267c05e85c8b05 (same) |

Points drawn: 451,000 to 205,000 (hold), 474,000 to 165,000 (dive), 34,000 to 28,000 (rise). Star draw per sample: 0.24 to 0.10 s (hold), 0.24 to 0.09 s (dive).

### Engine batch 2: changes 4 and 5 merged with main (`92edd3c`)

Main `4704442` (which holds engine batch 1) merged into the branch. On the merged tree, `final` tier: hold 2325 44.5 s, terrain 2580 59.8 s, dive 2427 114.8 s, rise 2726 79.2 s, all four sha256 equal to the baselines. `npm run build`, `npx vitest run` (28 tests) and `npm run determinism` pass.

### 6. Sky patch taps: explicit gradients outside capture mode (`6df2459`)

Asked for by the Builder, a robustness change for hardware drivers, not a speed change. Since change 2 the four `texture()` taps of `patchTexel` sit in a loop whose condition differs per pixel, where GLSL leaves implicit derivatives undefined. Tried on SwiftShader at the four frames (draft tier, sha256 against the draft references):

| Form | Hashes | Sky pass per sample, terrain / hold |
| --- | --- | --- |
| `texture()` in the loop (change 2) | identical | 0.88 to 0.94 / 0.85 to 0.88 s |
| `textureGrad` with the gradients of each of the four tap coordinates, taken outside the loop | identical | 1.09 to 1.14 / 0.92 to 0.94 s |
| `textureGrad` with one gradient pair `dFdx(p.xy)`, `dFdy(p.xy)` for the four taps | identical | 1.10 / 0.95 s |

So `textureGrad` gives the same bytes here but costs 0.06 to 0.2 s per sample where a patch is in view. Committed form: `textureGrad` with the one gradient pair is the default (live, autopilot, export); capture mode (`Sky.cull`) sets the define `PATCH_IMPLICIT` on the sky pass material and keeps the `texture()` form, whose shader text is the one that was proven in change 2. Final tier, capture: 44.1 / 60.8 / 115.5 / 79.2 s, four sha256 equal to the baselines; build, vitest and determinism pass.

### 7. NOT PROVABLY IDENTICAL, kept apart: the eight clean taps of the band are skipped when `cleanKeep` is 1 (`9e72ac2`)

`src/space/sky.ts`, sky pass. `band = inverseFilmic(mix(min(b0, lo), b0, uBandClean.y))` needs `lo`, the minimum of eight more band fetches, only when `cleanKeep` (`uBandClean.y`) is below 1. `skyframe.json` has `cleanKeep` 1, so the commit puts the eight fetches in a loop on `uBandClean.y < 1.0` and uses `b0` otherwise.

Why it is not exact in principle: on SwiftShader `mix(x, y, 1)` is `(y - x) + x`. Measured in a test shader on this Chrome (`mix(min(b0, lo), b0, uOne)` over 3 x 3,145,728 random float pairs): the result differs from `b0` in the last bit of the float32 for 2.3 to 3.9 % of the values. That is a relative step of 6e-8, before the value is rounded to the half float sample target (relative step 5e-4 to 1e-3), averaged over the samples and quantized to 8 bits.

What was measured on the frames: all four frames are byte identical to the baselines, at draft (one sample) and at final. Largest difference per channel 0 code values, PSNR infinite, on these four frames. Over a whole film a pixel here or there may differ by one code value; I could not produce one.

| Frame | Before | After | sha256 after |
| --- | --- | --- | --- |
| 2325 hold | 44.1 | 38.0 | 9895a050abe22d0ce0ad92bdd6e8b1b52836d9728657555900b0f614b07f744d (same) |
| 2580 terrain | 60.8 | 53.8 | a7e1670abf3e4a249d78a07e48eab4264c3d4b0811584fb03984b87f45c1f5b8 (same) |
| 2427 dive | 115.5 | 90.6 | 0a022282c24d2285b0262002cb1f92952ec9a6c0dbbf1c86ca404992be7fc814 (same) |
| 2726 rise | 79.2 | 73.8 | 79352ec57fa5c00bacf5b4d004444bc515f7aaf5d7b9513a7d267c05e85c8b05 (same) |

Sky pass per sample (draft): 0.85 to 0.32 s (hold), 0.89 to 0.56 s (terrain), 0.62 to 0.25 s (dive), 0.38 to 0.27 s (rise). Whole sample: 1.95 to 1.45 s (26 %), 3.00 to 2.55 s (15 %), 1.73 to 1.34 s (23 %), 1.20 to 1.14 s. Build, vitest and determinism pass. To drop it: `git revert 9e72ac2` (one block of the sky shader).

### 8. Capture: one sampler call instead of four where explicit gradients cannot change the texel (`5a24d88`)

What SwiftShader does (read in its sampler source, `src/Pipeline/SamplerCore.cpp` and `SpirvShaderSampling.cpp`, and confirmed by timing): `textureGrad` is sampled once per pixel of a 2 x 2 quad, each pixel with its own gradients, so four full sampler runs per quad. `texture()` with or without a bias is sampled once per quad; its gradients are lane 1 minus lane 0 and lane 2 minus lane 0, the same numbers as `dFdx` and `dFdy`. The equirect fetch (`equirectGrad` in `src/space/sky.ts`) is used by the sky pass, the planet map, the storm mask, the moon, the globe and the stand in, always with `textureGrad`, because the gradients are scaled by `uGrad` and corrected at the seam.

New `src/core/texel.ts`: `gradTexel(tex, uv, dx, dy)`. `textureGrad` stays the default. When `uImplicit` is 1 (set per sample in `engine.ts` from `sky.cull`, so in capture only) a quad uses `texture()` when one of these holds for all four pixels:

- (a) the gradients given are exactly `dFdx(uv)` and `dFdy(uv)` (compared as floats, bit equal), so the implicit call computes the same level and the same taps;
- (b) both the given and the implicit gradients are under one texel (`m < 0.9` in texels) and nearly isotropic (`m < 1.4 |det|`, implicit major squared under 1e8). Then both calls read level 0 with one tap: the level of detail clamps to 0, where the second mip has weight 0, the anisotropy `major² / |det|` rounds to one tap, and with one tap the tap sits exactly on the coordinate. The call is `texture(tex, uv, -15.0)`, the bias clamp of the sampler, which pins the level to 0 whatever the implicit gradients are.

Every other quad (minified, anisotropic, the seam column, the limb of a planet) stays on `textureGrad`. Live and export keep `textureGrad` everywhere. `SetLoader.load` hands the shared `uImplicit` uniform to every material of a set whose fragment shader declares it, so a stop material that includes `EQUIRECT_GLSL` needs no edit. This relies on how SwiftShader samples, which is why it is off outside capture.

| Frame | Before | After | sha256 after |
| --- | --- | --- | --- |
| 2325 hold | 38.0 | 34.5 | 9895a050abe22d0ce0ad92bdd6e8b1b52836d9728657555900b0f614b07f744d (same) |
| 2580 terrain | 53.8 | 51.8 | a7e1670abf3e4a249d78a07e48eab4264c3d4b0811584fb03984b87f45c1f5b8 (same) |
| 2427 dive | 90.6 | 83.4 | 0a022282c24d2285b0262002cb1f92952ec9a6c0dbbf1c86ca404992be7fc814 (same) |
| 2726 rise | 73.8 | 68.2 | 79352ec57fa5c00bacf5b4d004444bc515f7aaf5d7b9513a7d267c05e85c8b05 (same) |

Travel frame 2782 (64 samples, `tools/perf.ts`, render only): 35.6 to 30.1 s, sha256 the same before and after. Sky pass per sample there 0.373 to 0.289 s; planet at the hold 0.455 to 0.422 s. Build, vitest (8 files, 31 tests, `tests/texel.test.ts` is new) and determinism pass. Then main `14ef8ca` (engine batch 4) was merged into the branch (`186f1f8`).

### 9. Capture: terrain shield, hidden relief cells are not drawn and nothing is shaded under opaque terrain (`b8b53cb`)

Where the terrain sample went after change 8 (2580, 2.2 s per sample at `final`): the three relief layers 1.39 s, sky pass 0.51 s, stars 0.30 s, air 0.09 s. The layers are transparent meshes (blend `One, OneMinusSrcAlpha`, depth test and depth write on) of 1,034,838, 417,300 and 1,707,888 indices at `mesh: 420`, so triangles of about one pixel; every layer is shaded over its whole mesh, also where a nearer layer hides it and where its alpha is 0 (17 to 24 % of the alpha texels), and because the layers are transparent the engine could not use them to cover the sky (change 4 needs opaque materials).

What the change does, per sample, only in capture (`sky.cull`), only when exactly one `Relief` is visible and no other visible material writes depth or stencil (else the old path runs unchanged):

1. Once per set: the alpha texture of each layer is read back and every cell of the base grid gets two flags, "all texels 255" and "all texels 0" (`uniformCells`), then the distance in cells to the nearest cell without the flag (`reach`). A layer without an alpha texture and all apron cells count as unknown.
2. `Relief.screen`: the grid vertices are projected on the CPU. Cells off screen (1 px pad) are dropped. A cell is certainly transparent or certainly opaque when its flag reaches further than the texture footprint can: `reachNeeded` takes the texels per pixel from the screen Jacobian of the cell (upper bound `max(du, dv) * |J|_F / det`) and asks for `ceil((6 t + 2) / min(du, dv)) + 1` cells, which covers trilinear filtering (two levels, bilinear), the 4 tap anisotropy and the cell to texel rounding. Certainly transparent cells are dropped: the shader discards there (`alpha < 0.004`).
3. `Relief.mark`: the remaining cells are drawn into the sample target with the same vertex shader and a flat fragment shader, no blending, depth test and write: first the certainly opaque cells of every layer, writing alpha = layer number, then all other cells writing alpha = 0. Depth function is less or equal, so on a depth tie the unknown cell wins. After this pass a pixel carries the number of layer k only if the nearest relief fragment there is from a certainly opaque cell of k.
4. `marksIn` reads the target back and gives every 32 px tile the set of marks of its pixels. `Relief.hide` swaps in an index buffer (original cell order) without the cells of layer j whose padded screen box lies only on tiles where every pixel is marked by another layer. The sky pass and the star filter of changes 4 and 5 get the tiles where every pixel is marked as covered. The target is cleared, the frame is drawn as before, `Relief.show` swaps the full index back.

Why the pixels are the same: at a marked pixel the fragment F of layer k is the nearest of all relief fragments and its alpha is exactly 1.0. In the real pass F passes the depth test whatever was drawn before (only relief layers write depth), and `src * 1 + dst * (1 - 1)` replaces everything under it, sky, stars, air and farther layers; every later relief fragment there is farther and fails the depth test (or is another opaque fragment of a later layer at the same depth, which the mark pass resolves the same way, last wins). So dropping fragments of other layers at marked pixels, and not shading sky and stars there, cannot change the value, and the depth buffer ends the same. Two assumptions: the mark pass and the real pass give a vertex the same clip position (same vertex shader source, same matrices), and `dst` is finite (an Inf under opaque terrain would turn into NaN in the old path). Order of the kept cells is unchanged.

Checks beyond the four frames:
- A debug build wrote `alpha == 1.0 ? 0 : 1` from the real shader and compared it with the marks: 129 samples at frames 2488, 2490, 2500, 2540, 2580, 2620, 2660, 2669 and 2672, about 1.38 million marked pixels each, not one marked pixel with alpha other than exactly 1.0. About 165,000 opaque pixels per sample stay unmarked (the safety margin).
- `review` tier, eleven frames from the end of the dive to the start of the rise, sha256 of the PNG equal with and without the change at every frame:

| Frame | Samples | Before, s | After, s | sha256 (same before and after) |
| --- | --- | --- | --- | --- |
| 2470 | 16 | 40.4 | 32.5 | a6e6c8cfc5b620539d72511075c698c8ea2f9509298935d831781f87355abfaf |
| 2488 | 16 | 42.4 | 31.6 | dbe3c504d56e41f79e2cfb248e9a498f978eeecd217e70d50b5d5ef2552e1bf3 |
| 2490 | 4 | 10.7 | 8.1 | 71303fbc722c83ca20f71a3b8a0f806066192e30d15e00272dfcc505c61e7122 |
| 2500 | 4 | 10.3 | 7.7 | e106bd0bace9dae2f380f8a21368c3116781987efbc8c2b28409cd86bdf955ae |
| 2540 | 4 | 9.9 | 6.8 | 75b4772c1d66a51169e83fd419bc7f16ecb49031223e29807af4df0d401948ef |
| 2580 | 4 | 9.6 | 6.6 | d1b275360421c28e08069f8f8501b42f92228c5109e24d8326c994d0350e5dc3 |
| 2620 | 4 | 9.6 | 6.3 | e1cf1a26d7f005f39803a09dea2be54d65f52ddd6796218c47c8850f186fce9e |
| 2660 | 4 | 9.4 | 5.9 | 10522cdca0f3922b9256de4de2cb884334c47918d85d4bb1c1863ffa1b46bb37 |
| 2669 | 4 | 10.1 | 6.0 | 1e3ff45c99b8fc048e35afe54c9ee38fc3c752fa5e9aa86cf655f05fa8d05ebb |
| 2672 | 16 | 38.5 | 23.2 | e951252d07647b64a30034fa895ab5e5dd8a77240d290f5541d2c4366051482a |
| 2690 | 16 | 36.2 | 24.0 | 7d7d05929f25d377b21ce16f2ca983b9cd880c070738dad1bf3fc69ef322e1c3 |

`final` tier, `tools/still.ts` (about 16 s of each figure is start and set load). 2470 (end of the dive) and 2690 (start of the rise) are not judged frames; they are here because the terrain is on screen there for 64 samples, which makes them the most expensive frames of the stop.

| Frame | Before | After | sha256 after |
| --- | --- | --- | --- |
| 2325 hold | 34.5 | 34.0 | 9895a050abe22d0ce0ad92bdd6e8b1b52836d9728657555900b0f614b07f744d (same) |
| 2580 terrain | 51.8 | 40.4 | a7e1670abf3e4a249d78a07e48eab4264c3d4b0811584fb03984b87f45c1f5b8 (same) |
| 2427 dive | 83.4 | 82.6 | 0a022282c24d2285b0262002cb1f92952ec9a6c0dbbf1c86ca404992be7fc814 (same) |
| 2726 rise | 68.2 | 68.9 | 79352ec57fa5c00bacf5b4d004444bc515f7aaf5d7b9513a7d267c05e85c8b05 (same) |
| 2470 dive, terrain on screen (64 samples) | 175.7 | 143.8 | 269738a1d8b633e93b05cac5d616d9b6ca64a7a0ef339a156d99f434cee68a06 (same before and after) |
| 2690 rise, terrain on screen (64 samples) | 155.6 | 111.5 | 8db9bae092a6399e10164c5af097f3c699dfa0341811880c357894d7b6059aae (same before and after) |

Per sample at 2580 (`review`): layers 1.37 to 0.80 s (indices drawn 3,160,026 to 703,602), sky pass 0.49 to 0.22 s, stars 0.32 to 0.19 s, plus the mark pass 0.09 s and a second clear 0.03 s; the sample 2.4 to 1.6 s. New `tests/shield.test.ts`. Build, vitest and determinism pass.

### 10. Capture: haze shell triangles that the shader discards are not drawn (`397cd04`)

A `HazeShell` (`src/bodies/haze.ts`) is a back side sphere of 160 x 80 segments around the planet, additive, three of them on Mars. Its fragment shader discards every pixel whose view ray meets the planet (`b > 0.0 && rt2 < 0.99`), so only the thin ring between the planet disc and the top of the shell is ever written, but the whole far half of the sphere is shaded first: a discarded pixel pays for the whole shader, and the depth test does not stop it either. Cost 0.17 s per sample at the hold and the dive.

The discard region is a cone around the direction from the camera to the planet centre, which is convex, so a triangle whose three vertices lie inside it lies inside it entirely. New `src/bodies/trim.ts`: `hazeHidden` evaluates the shader's own test per vertex on the CPU, in double precision with a margin (`b` above the limit by `1e-3 * (1 + r)`), and `keepTriangles` writes the index without the triangles whose three vertices are hidden, order unchanged, so the additive sum per pixel has the same terms in the same order. `HazeShell` implements `Trim { hide(); show() }` and hangs itself on `mesh.userData.trim`; `engine.ts` calls `hide()` on every visible object with that field before a sample is drawn and `show()` after it, in capture only (`sky.cull`). Any other body whose shader discards a convex region can use the same hook.

In the same commit, a guard in change 9: a relief layer whose mesh is hidden is left out of the mark pass.

| Frame | Before | After | sha256 after |
| --- | --- | --- | --- |
| 2325 hold | 34.0 | 33.0 | 9895a050abe22d0ce0ad92bdd6e8b1b52836d9728657555900b0f614b07f744d (same) |
| 2580 terrain | 40.4 | 40.7 | a7e1670abf3e4a249d78a07e48eab4264c3d4b0811584fb03984b87f45c1f5b8 (same) |
| 2427 dive | 82.6 | 76.7 | 0a022282c24d2285b0262002cb1f92952ec9a6c0dbbf1c86ca404992be7fc814 (same) |
| 2726 rise | 68.9 | 63.7 | 79352ec57fa5c00bacf5b4d004444bc515f7aaf5d7b9513a7d267c05e85c8b05 (same) |

Haze shells per sample (`draft`): hold 0.168 to 0.063 s, dive 0.17 to 0.046 s, rise 0.044 s after. Without the 16 s of start and load the dive render is 9 to 11 % shorter (a second run gave 75.2 s), the rise 10 %, the hold 6 %. New `tests/trim.test.ts` (the dropped triangles are sampled and checked against the shader test in float arithmetic). Build, vitest (11 files) and determinism pass.

Then main `e23c58a` (engine batch 7) was merged into the branch (`a2a50dd`); on the merged tree the four frames again have the baseline sha256 (75.3, 64.7, 33.6 and 40.7 s for dive, rise, hold and terrain), build and vitest pass.

## All steps, `final` tier, seconds per frame on this VM

| Frame | Samples | Baseline | 1 | 2 and 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Now / baseline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2325 hold | 16 | 72.2 | 59.6 | 57.0 | 46.7 | 45.1 | 44.1 | 38.0 | 34.5 | 34.0 | 33.0 | 46 % |
| 2580 terrain | 16 | 92.5 | 80.8 | 58.9 | 59.2 | 59.2 | 60.8 | 53.8 | 51.8 | 40.4 | 40.7 | 44 % |
| 2427 dive | 64 | 236.5 | 190.1 | 179.7 | 125.3 | 115.4 | 115.5 | 90.6 | 83.4 | 82.6 | 76.7 | 32 % |
| 2726 rise | 64 | 250.0 | 207.5 | 87.5 | 79.5 | 81.0 | 79.2 | 73.8 | 68.2 | 68.9 | 63.7 | 25 % |

About 16 s of each figure is the browser start and the set load, which a film render pays once per worker and not per frame. Without it the render itself is 30 % (hold), 32 % (terrain), 28 % (dive) and 20 % (rise) of what it was. The sha256 of all four frames equals the baseline at every step; change 7 is the one step that is not provably identical on other content.

## Other kinds of frame

### Travel frame 2782 (`final`, 64 samples)

`tools/perf.ts`, render only (no browser start): 35.6 s before change 8, 30.1 s after, sha256 `453c2129c026490da2e66a46a7d4e596bc55a57115409a5bc5426c56cdf0a288` both times (tree before the merge of engine batch 4).

| Part | Seconds per sample | Share of the sample |
| --- | --- | --- |
| sky map pass (full screen, nothing covers it) | 0.289 (0.373 before change 8) | 62 % |
| belt layer, full screen `over` pass | 0.034 | 7 % |
| clear | 0.028 | 6 % |
| accumulator | 0.022 | 5 % |
| star points (18,621 drawn of 3,465,000) | 0.012 | 3 % |
| dust | 0.010 | 2 % |
| the rest (stand in, small passes, script) | about 0.07 | 15 % |
| all of a sample | about 0.47 | |

Once per frame: the belt build about 1.9 s (48 draws into scratch targets; the two rocks with 128 segment meshes are 589,824 indices each and cost about 0.09 s per draw in vertex work, 12 such draws, 12 more at about 0.035 s, 24 small ones under 0.01 s, plus the clears), lens chain 0.24 s (final pass to the canvas 0.13 s), PNG 0.25 to 0.28 s. At 64 samples the belt is about 13 % of the frame, at 16 samples it would be about 30 %. The belt module (`src/space/belt`) is not mine and was not touched.

### Saturn hold 3465 (`final`, 16 samples)

Measured in a local merge of `origin/agent/saturn` at `7cd6b55` with main (never pushed), `tools/perf.ts`, render only. sha256 `a5b3aa1fc30f91a90de114adcd34dfcb84ea1fa5935884c019063eee79d75854` in every exact variant below (before change 8, with it off and on, after engine batches 4 and 5). Change 8 off 27.0 s, on 25.4 s (sky pass 0.369 to 0.284 s per sample, globe unchanged).

| Part | Seconds per sample | Share of the sample |
| --- | --- | --- |
| rings, two passes of 25,920 indices each | 0.79 | 53 % |
| globe (440,064 indices) | 0.35 | 23 % |
| sky map pass, 27 rectangles around the globe | 0.28 | 19 % |
| accumulator | 0.025 | 2 % |
| star points | 0.01 | 1 % |
| all of a sample | about 1.5 | |

The transparent layers behave as on Mars as far as the engine goes: the globe is opaque and covers sky and stars (changes 4 and 5), the rings are transparent and cover nothing. What is new is the ring shader: it is almost pure arithmetic, and each of its two passes shades the whole ring mesh and discards the half that belongs to the other pass (in front of or behind the globe). A discarded pixel still pays for the whole shader (see the SwiftShader notes above). Taken apart by edits (two passes together 0.786 s): raster and header 0.125, sparkle block 0.197, noise 0.107, profile fetch 0.096, azimuth gain 0.075, grain 0.074, layout 0.069.

Recipe for the Saturn agent, proven locally with the same sha256: `assets-src/shared/saturn-rings-cull.patch` (against `src/stops/saturn/rings.ts` at `7cd6b55`; `src/stops` is not mine, so it is a patch and not a commit). `Rings.cull(camL)` builds one index list per pass on the CPU, per sample, and leaves out the triangles that lie wholly in the region that pass discards: pass 0 drops triangles with all three vertices inside the circle whose diameter runs from the ring centre to the camera (in the ring plane) or inside r < 1; pass 1 drops triangles farther than the radius plus a margin from that circle centre and farther than 1 from the origin. The order of the kept triangles is unchanged. It is called in `set.ts` right after `uCamL` is set. Rings 0.79 to 0.45 s per sample, frame 25.4 to 20.5 s (19 %). More could be dropped in pass 1 (the disc region r < 1 with x out of range). Wrapping the ring shading in a loop on the discard condition made it slower (0.79 to 0.98 s): a loop body always runs once.

## Tried, did not help or not kept

- Loops around arithmetic to skip it per quad, in the planet shader, the relief shader and the patch blend math (the "exact cut of the patch blend math"): no gain. Explained later by the SwiftShader source: control flow masks lanes, it never skips arithmetic; only texture taps are skipped.
- Stencil or depth test alone, without scissor rectangles, to keep the sky pass off covered pixels: no gain. The shader runs for a quad before the stencil result is applied and early depth is not used for these shaders. Tried again inside change 9 (the mark pass wrote stencil 1 at marked pixels; sky, stars and the relief air tested it): same sha256, same seconds, taken out. Scissor rectangles are the tool that works.
- 16 px tiles instead of 32 px for the cover map: more rectangles, no gain.
- `textureGrad` forms for the sky patch taps in capture: slower (four sampler runs per quad).
- `gradTexel` (change 8) on the six planet patch fetches (0.466 against 0.422 s) and on the relief colour fetch (no gain at `final`): left on `textureGrad`.
- A tolerance instead of bit equality in the seam test of change 8: 91 to 195 pixels differ at `draft`, 1 to 7 code values, PSNR 90 to 96 dB. Not exact, not kept.
- `texture()` with a level of detail bias in place of scaled gradients: 11 to 14 % but not exact, not kept.
- Coarser meshes (`draft`, not identical, not kept, under the one fifth threshold): planet segments 320 to 160 to 96 and moon 448 to 224 to 112 give planet 0.383 to 0.333 to 0.292 s and moon 0.107 to 0.066 to 0.046 s, a hold sample 1.32 to 1.26 to 1.17 s (11 % at most). The cause is that a 2 x 2 quad is shaded once per triangle that touches it; the Mars relief at `mesh: 420` and the moon at 448 segments are in that regime. This is a look setting of the stops, so it is only reported here.
- An alpha prepass of the relief with the shader logic duplicated: replaced by the cell flags of change 9, which need no second copy of the shader.
- Marks per tile as a set (change 9 keeps this form) against "one winner per tile": same seconds within noise.

## What is left in a sample

No exact change found after change 10 takes a tenth off any of the four frames. The goal of a tenth of the first cost per part was reached for the star points (0.9 to about 0.1 s per sample) and nearly for the sky pass (1.65 to about 0.3 s at the hold); the planet, moon and relief shaders are where they were per shaded pixel, only the pixels and triangles that cannot show were taken away.

Planet shader at the hold (`final`, 0.42 s per sample): map fetch 0.173, storm 0.087, patch levels 0.047, height fetches 0.045, haze 0.015, grazing 0.015, curve 0.010, inverse filmic 0.003, rest 0.06. Moon 0.13. These are fragment arithmetic and texture fetches on visible pixels; nothing exact was found that removes a tenth of a frame there.

Terrain after change 9 (2580, `review`, 1.6 s per sample): relief layers 0.80 (703,602 indices drawn of 3,160,026), sky pass 0.22 in about 120 rectangles, stars 0.19 (372,180 points), mark pass 0.09, air 0.08, two clears 0.06, accumulator 0.02. About a third of the pixels stay unmarked: the sky itself (8 %), the bands along the ridge lines (the safety margin, 8 %) and the apron cells, which change 9 treats as unknown. Flags for the apron atlas would shrink that, at the price of mirroring the apron mapping on the CPU; not done.

Once per frame: lens chain 0.24 s, PNG and base64 0.25 to 0.3 s, belt build in travel about 1.9 s (see above).

## Second task: stepping in fast frames (sample count, not a clock)

Working notes, kept current while the task runs.

### Finding (Part 1)

Measured with `tools/clocks.ts` (`npx tsx tools/clocks.ts --tier review --frames a,b`: per shader program, the distinct values of every uniform over the samples of a frame, and how far probe vertices move on screen from the first sample to the last). Every world layer of every stop has one view matrix and one time value per sample. The only layer on the mid shutter clock is the engine sky (`src/core/engine.ts`, the sky is drawn with `mid.skyQuaternion`, `mid.skyTurn`, `mid.camera.vfov`), and that is by design (kit/04-LOOK.md section 7: stars stay points). The stepping is too few samples for the screen motion: with 16 samples, a body that moves 40 to 130 px in the shutter is drawn as 16 copies 2.5 to 8 px apart.

Motion first to last sample (px at 1920 wide, review, 16 samples): Neptune 4984 globe 117; Uranus 4420 globe 70, rings 66, halo 133; Uranus 4126 globe 39, rings 66, moon 22; Saturn 3598 globe 8.2, rings median 5.1, p90 11.2, max 34.6; Saturn 3835 globe 19.5, rings p90 12.7, max 51.9; Mars 2427 globe 3.8; Sun 247 globe 4.1. The Sun's dashes at 247 are its own sky card (`src/stops/sun/skycard.ts`), a world mesh that moves 3.6 px while the engine stars behind it stand still.

### The rule (Part 2)

- `config/showcase.json`: `motion.maxStepPx` (1.5, px at the master format), `motion.probeGrid` ([17, 9]), `motion.bodyReach` (2.5 radii, used for stops with `rings: true`), `motion.minBodyPx` (2), `motion.terrainGround` (1, the default of the plan field `terrain.ground`), and per tier `maxSamplesPerFrame` (draft 1, review 64, final 128).
- `src/core/motion.ts`: `shutterMotion(open, mid, close)` is the largest screen distance any probe point travels between the two ends of the shutter. Probes: rays of the probe grid at mid shutter that hit a visible body (unit sphere of the set in orbit view, or within `bodyReach` radii for a ringed stop) or the ground plane of a terrain view (`y = -ground` in the set frame, `ground` from the plan field `terrain.ground`, default 1 stage unit, which is the director's own convention for the terrain stage), plus the body centre. Each point is fixed in its set and projected with the open and close shots. The result is scaled by `1 - cover.amount`. The sky has no probes (it stands on the mid clock), nor have the belt and the dust (they build their own blur once per frame).
- `samplesNeeded(base, cap, motion)`: `ceil(motion / maxStepPx)`; if that is not above today's count the frame keeps today's count, and with it today's pattern from `samplesFor`, so it is byte identical. Otherwise the smaller of the need and the cap.
- `frameSamples(source, frame, tier)` is what the engine calls in `renderFrame`; `showcase.samples()` and the frame record (`extra.samples`) carry the count used.
- `userData.skyClock = true` on a mesh or group under a set's `world`: the engine draws that object, in every sample, where the mid shutter view shows it (camera pose, set pose and field of view of mid shutter; `src/core/held.ts`). Default off. For a stop's own sky card.

### The tools (Part 3)

`tools/lib/samples.ts` (`samplesOf(frame, tier)`, `samplesOfSpan`, `stressSpan`) is the one source; `npm run samples` (`tools/samples.ts`) is its command line: `--tier T --frames a,b` or `--range a-b`, `--out file.json` (every frame, every tier), `--report [frames]`, `--stress [ids]`. Switched over: `tools/pack.ts` `plan()` (the film jobs of `tools/round.py` read that plan), the stress split of `tools/round.py`, `tools/budget.ts`, `tools/stress.ts` (shares the window), `tools/master.py` (`cost` and `lay_out`: a segment is cut into equal spans, as before, and the number of spans rises until the costliest span fits a job; with the old flat counts the result is the same spans as before, checked at 20, 45 and 90 minute jobs at review and final). `tools/film.ts` has no estimate by samples.

### How a stop uses the sky flag

In the stop's own folder: `mesh.userData.skyClock = true` on a mesh or group that hangs under the set's `world` (for the Sun: `this.mesh.userData.skyClock = true` in the constructor of `SkyCard`, `src/stops/sun/skycard.ts`). In every sample the engine then replaces the world matrix of that object (and of its children) so that it lands on the screen where the mid shutter camera, the mid shutter set pose and the mid shutter field of view put it. Only the outermost flagged object counts, it must be visible, and nothing happens in a frame of one sample. The stop's own per sample uniforms (a time, a weight) stay the stop's business. Tried in a scratch tree only: the Sun at 247 (`assets-src/shared/perf/skyclock-sun-247-review-unset-left-set-right.png`), the dashes become points. Without the flag nothing changes (byte proofs below).

### Proof (Part 4)

Tree: `agent/engine-perf` with main `a156ab3` merged. Before: main at `a156ab3` (and the same frames on `3ed3f34`, with the same sha256).

| Frame | Tier | Samples | sha256 before | after |
| --- | --- | --- | --- | --- |
| Mars hold 2325 | final | 16 | `9895a050…7f744d` | equal |
| Mars terrain 2580 | final | 16 | `a7e1670a…c1f5b8` | equal |
| Mars dive 2427 | final | 64 | `0a022282…7fc814` | equal |
| Travel 2726 | final | 64 | `79352ec5…c8b05` | equal |
| Jupiter hold 2895 | final | 16 | `99060a97…115ada` | equal |
| Jupiter terrain 3150 | final | 16 | `c2d177ba…4a3589` | equal |
| Uranus hold 4035 | final | 16 | `f5f7ee77…eb1222` | equal |
| Uranus terrain 4290 | final | 16 | `9e6c71d0…7dff7` | equal |
| Mars dive 2427 | review | 16 | `6cc683c4…d0eda` | equal |
| Saturn rise 3835 | review | 16 | `32f255c5…ff7df` | equal |
| Sun rise 247 | review | 16 | `40c2ba44…a82a5` | equal |

The final tier rows were rendered on both bases (the two Mars fast frames against the stored baselines); the review tier rows on `3ed3f34` only. `npm run build`, `npx vitest run` (59 tests, 13 files) and `npm run determinism` are green on the merged tree.

Pictures at full size, before on the left and after on the right, review tier, in `assets-src/shared/perf/`: `stepping-neptune-4984-…` (16 to 64 samples, the comb in the clouds is gone), `stepping-uranus-4126-…` (16 to 42, the puffs smear without teeth), `stepping-saturn-3598-…` (16 to 20, the weave of the rings stays, see below), `stepping-mars-2427-…` (16 and 16, the same bytes: the globe moves 3.8 px).

### Counts across the film

`npm run samples -- --report` (all of it in `assets-src/shared/perf/raised-review.txt` and `raised-final.txt`, one count per frame).

| Kind | Frames | Raised at review | Samples at review before, after | Raised at final | Samples at final before, after |
| --- | --- | --- | --- | --- | --- |
| hold | 1380 | 0 | 5520, 5520 | 0 | 22080, 22080 |
| terrain | 1620 | 7 | 6480, 6487 | 0 | 25920, 25920 |
| dive | 720 | 140 | 11520, 14609 | 9 | 46080, 46502 |
| rise | 690 | 132 | 11040, 14736 | 33 | 44160, 44727 |
| travel | 615 | 133 | 9840, 11847 | 0 | 39360, 39360 |
| retreat | 120 | 5 | 1920, 1929 | 0 | 7680, 7680 |
| lookback | 180 | 0 | 720, 720 | 0 | 2880, 2880 |
| fade | 75 | 0 | 300, 300 | 0 | 1200, 1200 |
| the film | 5400 | 417 | 47340, 56148 (+18.6 %) | 42 | 189360, 190349 (+0.5 %) |

Runs at review (first to last frame, lowest to highest count): sun.terrain 0 to 6 (5), sun.travel 463 to 472 (17 to 36), mercury.dive 729 to 743 (17 to 64), mercury.rise 990 to 1011 (17 to 64), mercury.travel 1043 to 1052 (19 to 45), venus.dive 1301 to 1308 (18 to 47), venus.rise 1565 to 1579 (17 to 32), venus.travel 1613 to 1622 (20 to 57), earth.dive 1870 to 1881 (17 to 58), earth.rise 2132 to 2149 (17 to 64), earth.travel 2185 to 2195 (18 to 35) and 2229 to 2235 (17 to 21), mars.dive 2441 to 2448 (18 to 46), mars.rise 2703 to 2720 (17 to 53), mars.travel 2755 to 2766 (19 to 51), jupiter.dive 3012 to 3022 (18 to 64), jupiter.rise 3273 to 3290 (19 to 64), jupiter.travel 3324 to 3334 (19 to 45) and 3367 to 3377 (18 to 27), saturn.dive 3592 to 3601 (17 to 20), saturn.rise 3844 to 3846 (17), saturn.travel 3896 to 3912 (17 to 43) and 3941 to 3950 (17 to 25), uranus.dive 4119 to 4156 (19 to 51), uranus.rise 4412 to 4432 (20 to 64), uranus.travel 4461 to 4471 (17 to 53) and 4510 to 4522 (21 to 55), neptune.dive 4690 to 4727 (19 to 54), neptune.rise 4981 to 4997 (18 to 64), ending.retreat 5083 to 5087 (17 to 19).

Runs at final: mercury.dive 738 to 743 (85 to 128), mercury.rise 990 to 1000 (65 to 101), earth.rise 2136 to 2139 (72 to 83), jupiter.dive 3019 to 3021 (82 to 103), jupiter.rise 3275 to 3281 (67 to 100), uranus.rise 4416 to 4418 (68 to 74), neptune.rise 4983 to 4990 (68 to 93).

Travel: the count comes from the body being left and the body arriving only (the sky stands on the mid clock, the belt and the dust blur themselves once per frame). 133 of 615 frames rise at review, in the first 10 to 17 frames of each travel and in four arrivals; none at final.

Terrain side of a dive or a rise: the default ground (1 stage unit under the terrain path) gives 3 to 20 px per shutter for every stop, which 16 samples cover, so these frames stay at 16. The one exception is Saturn's dive, 3592 to 3601 (29 px, 20 samples), where the measured ring motion was 35 px at most. At Saturn's rise 3835 the nearest ring moves 52 px (measured) and the default says 19: `terrain.ground` in Saturn's plan, set to the real height of the path over the ring plane in stage units, would count it right.

### Seconds per sample, and the added time

Measured here (4 cores, SwiftShader, 1920 x 1080), by the difference of two counts of the same frame where there is one:

| Kind | Seconds per sample |
| --- | --- |
| hold | Mars 1.05 to 1.2, Saturn 1.5 |
| terrain | Mars 1.5 to 1.6 |
| dive | Mars 1.0, Uranus 1.0 (4126), Saturn 1.75 (3598) |
| rise | Mars 0.8, Neptune 2.4 (4984: 55 s at 16 samples, 171 s at 64) |
| travel | 0.47, plus 1.9 s per frame for the belt |
| once per frame | lens chain 0.24, PNG 0.25 to 0.3 |

Added at review: 8808 samples (dive 3089, rise 3696, travel 2007, terrain 7, retreat 9). With Mars's seconds per sample that is about 1.9 hours on one machine on top of about 13 hours (15 %); with the costliest stops measured (Neptune's rise, Saturn's dive) for every stop it is about 4.2 hours on top of 21 (20 %). Added at final: 989 samples, 15 to 35 minutes on top of 49 to 81 hours (under 1 %). The frames that rise are the costliest frames of a segment: a job that holds the fast part of a rise can take up to four times as long per frame as before, which is why `tools/master.py` and the round job split now ask for the true counts.

### Saturn's rings at 3598 and 3835

Not a matter of the count: the weave is there at 16 and at 20 samples and gone at 64 (final). It is the ring profile fetched with a footprint under a pixel: `src/stops/saturn/rings.ts` line 163, `profAt(x, texels * uGrad * mix(uLodBias.x, uLodBias.y, uClose))`, with `lodBias: 1.2` and `lodBiasClose: 0.35` (`src/stops/saturn/look.ts` lines 56 and 57) and `uGrad` 0.5 for any frame of 4 samples or more. In the close view the footprint is 0.175 to 0.6 of a pixel, so one sample is aliased (the draft frame shows the herringbone in the same bands) and the picture relies on the jitter of the samples to filter it. The likely reason it shows under slow motion and not in a hold: the jitter follows the sample order, which is also the time order (a step of 0.245 px in x and 0.43 px in y per sample), so where the ring moves a few tenths of a pixel per sample, motion and jitter partly cancel and the samples see the ringlets at nearly the same place inside the pixel. That part is reasoning, not measured; the rest is from the renders. With `lodBiasClose: 1.2` (scratch tree, same frame, 20 samples) the weave is nearly gone: `assets-src/shared/perf/saturn-3598-rings-as-is-left-lodBiasClose-1.2-right.png`; the draft and the final frame are in `saturn-3598-rings-draft-1-sample-left-final-64-samples-right.png`. The grain (`grain: 0`) and the sparkle (`sparkle: 0`) change nothing in it.

## Third task: fast motion again (gradient scale, caps, what a cover hides)

Working notes (task received 15:00 UTC, 21 Nov; started from main `407a32b`). Commits: `63bfd2e` (A), `02cc08b` (C), `d84e94b` (B). Scratch pictures in `/home/user/workspace/t3/{before,after,mars,earth}`, chain `/home/user/workspace/t3chain.sh` with logs `/tmp/t3*.log`; the before set is rendered in the dev tree at `407a32b`.

### A. The gradient scale follows the motion

`src/core/motion.ts`: `rawMotion(open, mid, close)` is the shutter motion before the cover factor, `seenShare(mid)` is the cover factor, `shutterMotion` is their product (as before). `framePlan(source, frame, tier)` returns `{ samples, raw, seen, soft }`; `soft = softness(raw)` is a smoothstep from `motion.softFromPx` to `motion.softToPx` (px at 1920 wide). `setSamples(count, floor, soft)` in `src/diagnostics/diag.ts` sets `uGrad = sharp + (1 - sharp) * soft` with `sharp = max(1 / sqrt(count), floor)`; with `soft` 0 it takes the old expression, so a frame at or under `softFromPx` has the bytes of before. The engine asks once per frame (`renderFrame`), the live view stays at 0.

Raw motion of the frames the Builder named (px): Mars 2325 hold 0.45, 2427 dive 3.89, 2580 terrain 3.65 (the terrain peaks at 4.06 on 2669), 2726 rise 6.07, belt 2772 0.00, 2782 0.00, 2796 9.09. With the first proposal (4 and 12) 2726 and 2796 would have changed, so the keys are `softFromPx: 10`, `softToPx: 18`: all seven keep their bytes, Earth 1870 (18.9 px) is fully soft. At 16 samples 10 px is a step of 0.6 px, under which the sharper level cannot comb.

### B. Caps

`tiers.review.maxSamplesPerFrame` 64 to 128, `tiers.final.maxSamplesPerFrame` 128 to 256. Counts over the 5400 frames (the rule of `tools/lib/samples.ts`, hours with the seconds per sample of the table above, low is Mars, high is the costliest stop measured per kind):

| Tier, cap | Samples | Frames at the cap | Largest count | Machine hours |
| --- | --- | --- | --- | --- |
| review 64 | 57,070 | 61 (mercury.dive 9, mercury.rise 11, venus.dive 2, earth.dive 5, earth.rise 6, jupiter.dive 3, jupiter.rise 7, uranus.rise 7, neptune.rise 11) | 64 | 15.4 to 26.8 |
| review 128 | 58,721 | 6 (earth.dive 2, uranus.rise 1, neptune.rise 3) | 128 | 15.8 to 27.8 |
| final 128 | 191,011 | 6 (the same six) | 128 | 50.0 to 85.3 |
| final 256 | 191,130 | 0 | 162 | 50.1 to 85.4 |

Upper bound if every stop set `coverHides: 0` (the raw motion counts everywhere): review 128 gives 63,647 samples (35 frames at the cap, 17.1 to 30.6 hours), final 256 gives 195,459 samples (6 frames at the cap: jupiter.dive 2, neptune.dive 2, neptune.rise 2; 51.2 to 87.8 hours); without any cap the largest count would be 488.

### C. What a cover hides

Optional plan number `coverHides` (`MoveParams` in `src/director/moves.ts`, beside the other `cover` keys; default 1). The director copies it to `shot.cover.hides` only when the plan sets it, and the cover factor of the sample count is `max(1 - cover.amount * coverHides, 0)`. 1 is the old rule (an opaque cover: what it hides needs no samples), 0 counts the full motion under any cover, a value between is for a translucent cover through which a bright limb or ring shows (Uranus 4159 to 4161: raw 28.6 to 29.4 px, seen 6.9 to 2.5 px with the default; 4413: raw 69.3, seen 10.8). No plan sets it. The gradient scale of A reads the raw motion and does not depend on it.
