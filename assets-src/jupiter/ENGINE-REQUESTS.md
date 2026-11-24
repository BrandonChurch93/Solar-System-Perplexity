# Jupiter: requests to the engine

Owner of the shared code: `handover_engineer`. Nothing here is in the stop's commits; a patch, when there is one, is `assets-src/jupiter/engine.patch`.

## 1. The sky of a rise on the stop's own time (served on main: `skyShare`, `skyCarryShare`, `skyLiftAt` of `StopPlan`)

What the stop does: Jupiter's globe side runs along the engine's dive and rise path at a paced time (`src/stops/jupiter/place.json` `pace`, read by `plan.ts`), so that the mean level of the body never steps by more than the limit between two frames. In the rise the pace is slow for the first frames after the handover and fast in the middle, and the whole disc is in the frame from 3290 where the unpaced rise had it from about 3300.

What does not follow: three schedules of `src/director/film.ts` run on the film clock and cannot be reached from a stop.

- The carry (`skyCarry`, weight `skyTurnWeight(segment, time)`): 78 degrees at Jupiter's rise handover, fading over the whole rise, about 3 degrees a frame from 3287 to 3303 on top of the camera's own turn.
- The share of the surface sky (`skyWeight(segment, time)`, with `skyFloor` and `skyGlow`): the stop's sky patch of the surface view fades over `skyFrames` after the handover on the clock.
- The star lift of a rise (`skyStars`).

The stop can reach the sky turn alone (`skyTurnShare`). It now finishes the turn 17 frames after the handover (`place.json` `sky.turnFrames`), so that the 159 degrees are turned while the planet fills most of the frame. Left in view: the Milky Way crosses the top right corner in 3281 to 3283, and from 3287 the stars still move by the carry.

Asked for: hooks on `StopPlan`, each returning `null` by default so that no other stop changes by a byte.

- `skyCarryShare(seg, time): number | null`, used in place of `skyTurnWeight(segment, time)` for the carry.
- `skyLookShare(seg, time): number | null`, used in place of `skyWeight(segment, time)`.
- `skyLiftAt(seg, time): number | null`, the time the star lift is read at.

With them Jupiter would give the carry the share of its turn, and the surface sky and the star lift its paced time.

## 2. The test of the sky share holds the engine's clock against a stop's own share (open, 2026-11-24 00:10 UTC)

What the stop does since the commit "one scene through the change of view": `plan.ts` gives `skyShare`, `skyCarryShare` and `skyTurnShare` from the camera's height (`place.json` `scene.sky`, `scene.skyTurn`), through the hooks of request 1, so that the surface view's sky comes in by height and not by time (second review note, F).

What fails: `tests/place.test.ts` line 455, `expect(globe.skyShare).toBe(skyWeight(s, time))`, for Jupiter (expected 0.0010255 to be 0). The test holds every stop to the engine's clock and does not know the hook. It is the only test of the 224 that fails on the merge of this commit with main 304f1c68.

Asked for: the one line in `assets-src/jupiter/engine.patch`: `expect(globe.skyShare).toBe(p.skyShare(s, time)?.low ?? skyWeight(s, time))`. With it `tests/place.test.ts` passes (30 of 30) on this tree. No other stop gives a share of its own, so no other stop's test changes.
