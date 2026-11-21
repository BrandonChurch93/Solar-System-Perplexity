# Engine requests from the Mercury stop

## 1. `terrain.rollDeg` in `MoveParams` (`src/director/moves.ts`) (on main since batch 1)

Patch: `assets-src/mercury/engine.patch` (against `origin/main` b4ae65c, one file, 8 lines added, 5 removed).

What: an optional `rollDeg?: number` in `MoveParams.terrain`: the roll of the terrain image's camera about its own view axis, in degrees, with the sign of `entryRollDeg`. Unset or 0 changes nothing.

Why: the approved close image of Mercury has its horizon tilted by 11.3 degrees (measured by `assets-src/mercury/relief/camfit.py`: 46 horizon points, rms 0.02 degrees). The moves assume a level terrain image, so the globe's horizon is level on the orbit side of both covers and tilted by 11.3 degrees on the terrain side. The kit asks that the horizon carries across the cover.

Where it acts, all in `StopPlan`:
- `swoop`: the roll the dive ends with at the cover's center is `entryRollDeg * g + rollDeg`, on the same ramp as the entry roll.
- `climb` (rise with `level: true`): the roll starts at `rollDeg` at the cover's center and goes to `rise.rollDeg` with the existing weight `w`.
- `rise` without `level`: the level start pose inside `rise.tilt` takes the roll.
- `terrain`: the yaw axis is the image's up vector, so it is turned by the roll.
- `horizon`: the cover's horizon line for the terrain view is turned by the roll.

Checked:
- Byte identity with the patch off: Mars frames 2325 and 2580 at the draft tier, rendered on `origin/main` b4ae65c and with the patch applied, `cmp` reports no difference (sha256 fd128b1a999f76fa0790... and 7322ef9576f06ffb4186...). Every changed expression adds an exact zero or sits behind `if (t.rollDeg)` when the value is unset.
- Effect with the patch on (`out/work/mercury/check-roll.ts`, the up vector of the ground in camera space just before and just after each cover center, Mercury plan with `rollDeg: 11.27`, `horizonDeg: 19.8`, `dipDeg: 10.25`): dive orbit side tilt 11.27 degrees, terrain side 11.75; rise terrain side 10.59, orbit side 11.27. Without the patch: 0.00 against 11.73.
- `npx tsc --noEmit -p .` passes.

## 2. `tests/motion.test.ts`: let a plan set `coverHides` (batch 15 follow up) (on main at bf74284, 16:10 UTC; local copy dropped)

Patch: `assets-src/mercury/engine.patch` (against `origin/main` 03e3b51, one file, one line).

What: the last line of the test "what a cover hides" is `for (const p of plans) expect(p.p.coverHides).toBeUndefined()`. It fails as soon as any stop uses the key that batch 15 added. The patch replaces it by a range check: unset, or a number from 0 to 1.

Why: Mercury's plan sets `coverHides: 0`. Its cover is the Sun's glare, one bright object that crosses the lens; outside its core the globe, the limb and the sky stay readable in every cover frame (round 18, correction 1), so the cover hides none of the motion. With the default the cover frames lose their samples while the picture still moves in view: 740 (116 px in the shutter), 741 (92 px), 742 (55 px), 743 (23 px) and 990 to 997 (34 to 128 px) would be counted at `1 - cover.amount` of that and step in copies under the glare. With `coverHides: 0` they get the count of their raw motion (`npm run -s samples -- --tier review --range 734-752`: 128, 128, 91, 39 at 740 to 743; `--range 982-998`: 57, 88, then 128).

Checked: no engine source changes, so no frame of any stop changes. `npx vitest run` with the patch and Mercury's plan: 13 files, 62 tests pass. Without the patch the one assertion fails on this branch and nothing else.
