# Engine requests, uranus

## 1. Sky pass loses its ray on some low orbit frames (11:20 UTC, round 2)

Patch: `assets-src/uranus/engine.patch` (5 lines in `src/space/sky.ts`, `Sky.render`).

What happens now. The sky fragment shader builds its ray from `uInvProj * vec4(ndc, 1.0, 1.0)` and divides by `v.w`. For a perspective matrix `v.w` is `inv[11] + inv[15]`, two numbers near `1 / (2 near)` whose true sum is `1 / far`. In the orbit view below an altitude of about 0.2 radii the engine sets `near = 0.02 * altitude` with `far = 80000`, so both terms are 250 to 1250 and their float32 sum is a whole number of steps of 3e-5 to 1.2e-4, while the true value is 1.25e-5. On frames where the two rounded terms cancel, `v.w` is exactly 0, the ray is not a number, and the whole sky pass (Milky Way band glow, sky patches, Sun disc and corona) drops out for that frame. The star points use another path and stay. A nonzero wrong `v.w` is harmless because the ray is normalised.

Where it shows. Frames with `fround(fround(inv[11]) + fround(inv[15])) === 0` at the mid time of the frame, with the cover amount at that frame (from `out/work/u/dbg/skyw-all.ts`, engine at e5c57ba, my plan at this commit):

- mercury.dive 743 (cover 0.04), mercury.rise 990 to 992 (0.04 to 0.02)
- venus.rise 1560 to 1562 (1.00, 1.00, 0.95), earth.dive 1883 (1.00), earth.rise 2130, 2131 (1.00, 0.93)
- mars.dive 2453 (1.00), mars.rise 2700, 2702 (1.00, 0.89)
- jupiter.dive 3023 (0.98), jupiter.rise 3270, 3271, 3273 (1.00, 0.93, 0.64)
- uranus.dive 4149, 4154, 4156 to 4158, 4160, 4162 and uranus.rise 4411 to 4415 (my cover is being rebuilt to thin over these frames)
- neptune.dive 4719, 4723 to 4725 (cover 0), 4731 to 4733 (1.00), neptune.rise 4980 (1.00)

This is the cause of the round 1 notes on Uranus "the Milky Way pops on in one frame between 4415 and 4416" and "dust lane pops on between 4169 and 4170", and of the Sun dot blinking off for single frames.

The change. After the inverse projection is copied into the uniform, if the float32 sum of elements 11 and 15 is exactly 0, set element 11 to 0 and element 15 to 1. Then `v.w` is 1 and the ray is `normalize(v.xyz)`, which is the true ray. Every frame whose sum is not 0 takes the old path with the old numbers, so it renders the same bytes as before. Only frames that are broken now change.

Checked. Mars 2325 and 2580 at draft before and after the change: `cmp` reports identical files (`out/work/u/eng/before-2325.png` against `after-2325.png`, the same for 2580). Uranus 4412 with the cover switched off: before, no Sun disc and no band; after, the Sun disc is at (1431, 576) where the plan puts it.
