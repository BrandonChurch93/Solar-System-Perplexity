# Engine requests of the saturn stop

## 1. A sky patch may give its own weight

- Patch: `assets-src/saturn/engine.patch` (two files, three lines: `src/core/types.ts`, `src/core/engine.ts`).
- What: `SkyPatch` gets one optional field, `weight?: (time: number, view: ViewKind) => number`. Where the engine picks the weight of a patch for a sample, a patch that has the field has its weight multiplied by `patch.weight(shot.time, state.view)`. A patch without the field is drawn exactly as before.
- Why: Saturn has no cover. Its dive and its rise are one continuous move, and the sky is in view on every frame of them. The engine picks sky patches by view (`patch.view === state.view`) with weight 1, so where the view changes from orbit to terrain the hold patch goes and the terrain patch comes in one frame, in plain sight. Mars hides that frame under its cover. With the field the stop fades the hold patch out over the first part of the dive and fades the terrain patch in after the view has changed, and the reverse in the rise, as a closed-form function of film time. It cannot live in the stop folder: the engine reads every field of a patch before it calls the set's `update`, so anything the set changes there would arrive one sample late and depend on which frame was drawn before.
- Off by default: no other stop sets the field.
- Check that Mars did not change: frames 2325 and 2580 rendered at the draft tier with the patch and without it (`npm run still -- --frame N --tier draft --out ...`), same bytes.
  - 2325: sha256 `fd128b1a999f76fa079027e50ace59ac82ec5083c1c53b65667f23176a9a98cf` with and without.
  - 2580: sha256 `7322ef9576f06ffb418698ffa8b0a82fe155aa5542608d8d4122681ea5700d5a` with and without.
- Not needed from the engine: the camera path and the missing cover. `plan.ts` subclasses `StopPlan` and overrides `dive`, `rise`, `terrain` and `coverAmount`, which the engine already calls through the plan. `npm run measure` already takes `--no-cover saturn`.

## 2. A plan may scale the sky exposure over time (polish list of round 26, item 2)

- Request 1 is on main; `assets-src/saturn/engine.patch` now holds only this request (`git diff origin/main -- src/director/film.ts src/director/moves.ts`, two files, six lines).
- What: `StopPlan` gets one method, `skyGain(time: number): number`, which returns 1. In the stop branch of `FilmDirector.shotAt` (after the view specific sky lines, before the drift and the cover), `light.sky` is multiplied by `p.skyGain(time)` when it is not 1. Nothing else reads it.
- Why: R4 round 26, "the Milky Way pops back in from black space" in the rise. Measured at the draft tier in the upper left of the frame (x 40 to 700, y 40 to 300, median of the channel mean): the approved close image has 9.7, the terrain patch gives 10.3 at 3720, and the shared sky behind it has 29.3, because the Milky Way band crosses that part of the terrain view. The pop is the dark patch fading over a sky three times brighter, from 3810 to 3831 (14.7 at 3816, 21.3 at 3822, 25.7 at 3828). The engine gives a stop no way to dim the shared sky through the terrain view over time: `light.skyLow` acts only in the orbit view, `light.terrainSkyGlow` below 1 is a discrete mode that also switches the star mode at the view change, and Saturn has no cover to hide a step.
- Use in the stop (`src/stops/saturn/plan.ts`): `skyGain` is 1 outside the dive and the rise, falls to `skim.skyNear` (0.35) along the dive, stays there over the terrain view and returns to 1 along the rise, reaching 1 at `riseEnd` (frame 3882). The exposure scales patches too, so the terrain patch gain in `src/stops/saturn/sky.json` is 1.85 / 0.35 = 5.2857 and the terrain frames keep their sky (3663 and 3720: median 10.0 and 10.3 before and after). Patch and shared sky then have the same level at any patch weight. After: 3813 10.7, 3816 11.7, 3819 12.3, 3822 13.3, 3825 13.7, 3828 14.3, 3831 16.0, 3837 22.0, 3846 26.7, 3866 31.3.
- Off by default: the base method returns 1 and no other plan overrides it; with 1 the multiplication is skipped.
- Check that Mars did not change: frames 2325 and 2580 rendered at the draft tier with the patch (`npm run build`) and with the patch reversed (`git apply -R`, `npx vite build`), same bytes, and the same hashes as in request 1.
  - 2325: sha256 `fd128b1a999f76fa079027e50ace59ac82ec5083c1c53b65667f23176a9a98cf` with and without.
  - 2580: sha256 `7322ef9576f06ffb418698ffa8b0a82fe155aa5542608d8d4122681ea5700d5a` with and without.
- Exit and travel: `npx tsx assets-src/saturn/check/exit.ts` against `out/work/saturn/exit-before.json`: frames 3885, 3886, 3900, 3930, 3959, 3960 and 4000 are identical in every field; 3883 and 3884 keep exposure 0.55. `skyAim.orbit` is untouched.
- Without the patch the stop does not type check (`override skyGain`) and the terrain patch would be 2.86 times too bright, so the stop's polish commits need this request merged with them.
