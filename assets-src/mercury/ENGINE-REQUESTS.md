# Engine requests from the Mercury stop

## 1. `terrain.rollDeg` in `MoveParams` (`src/director/moves.ts`)

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
