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
