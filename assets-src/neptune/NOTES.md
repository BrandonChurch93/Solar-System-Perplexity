# Neptune stop notes

Lab notebook of the stop agent for `neptune`. Read `assets-src/shared/STOP-AGENT.md` first, then this.

## Log

- Start. Cloned, branch `agent/neptune`, merged `origin/main` at 9602aca. `npm ci` and `npm run build` pass. Rendered the stand-in `hold` and `terrain` comparisons at the draft tier and pushed them as the first looks.

## How the engine works (read once, kept here so it need not be read again)

- A stop = `src/stops/neptune/set.ts` (`createSet(ctx)` returns `StopSet { id, world, near?, sky?, update(state, shot, view), dispose }`) and `plan.ts` (`MoveParams`, `new StopPlan('neptune', fit, params)`). Mars is the pattern: `src/stops/mars/{set,plan,look,assets}.ts` with JSON beside them.
- Engine per sample: sky (with sky patches from `set.sky`, aim set by engine from `skyframe.json`), then `world` scene (set.world positioned at origin minus camera, rotated by `state.rotation`), then `near`, dust, cover. Post once on the average. Body pixels write alpha 1, sky 0 (G5 coverage). Diag views through `diagOut(...)` in `src/diagnostics/diag.ts`: texels (counted flag), layers, depth, flow.
- `state.view` is `orbit` or `terrain`. Terrain view: set.world origin = the spot on the globe, rotation = terrainFrame (x right, y normal, -z heading). Camera pose from `plan.terrain(t)`: position `(side*u, rise*u, -forward*u)` in camera heights around the fitted relief camera at origin, u from -0.5 to 0.5.
- Ending: `ending.retreat/lookback/fade` draw Neptune's set in the orbit view with `state.segment.stop !== plan.id`; Mars blends its light from `plan.lightDir` to `shot.sun.dir` (`lit`). LOOKBACK in `src/director/film.ts`: Neptune 31 deg off the Sun, distance 9 radii, vfov 34. So the crescent is seen at phase angle about 149 deg.
- Shared classes: `Planet` (`src/bodies/planet.ts`: wrap map, patch levels up to 6, storm turn about an axis by mask, light curve of 33 knots, ground haze, grazing haze), `HazeShell` (`src/bodies/haze.ts`), `MoonBody` (displaced, with baked lit map + mask), `Relief` (`src/terrain/relief.ts`: layers of color+alpha+dist with aprons, masks for mist/dust shift, valley fog march, air layer), `FarPoint`, `Cover` (engine-owned, set from plan colors).
- Approved pixels used as textures go through `inverseFilmic` and the lens vignette is undone on them (`uVignette`).
- Stand-in rings are a `RingGeometry` with 6 gaussian lines (shimmer risk). Neptune needs its own ring module.
- The loader counts texture bytes: w*h*4*(4/3 with mips), float data textures by byteLength. Limits: full 1400 MB, web 450 MB.
- Config: 30 fps. neptune.hold 151-156 s (frames 4530-4679, judged 4605), dive 156-159 (judged 4707), terrain 159-165 (judged 4860), rise 165-167.5 (judged 5006). Cover 0.5 s at 0.6 of dive, 0.4 of rise.
