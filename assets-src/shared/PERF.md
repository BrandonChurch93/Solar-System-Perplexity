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
- An `if` block is not skipped. Both sides run for every pixel and the result is masked. A `for` loop is a real branch: its body does not run when no pixel of the 2 x 2 quad needs it. So `for (int k = 0; k < (cond ? 1 : 0); k++) { ... }` skips work that `if (cond) { ... }` does not. Derivatives are taken outside the loop.
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
