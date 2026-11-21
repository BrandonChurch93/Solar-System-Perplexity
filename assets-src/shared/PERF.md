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
