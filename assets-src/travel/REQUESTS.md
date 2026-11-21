# Requests from the travel agent

1. `src/core/engine.ts`, `renderSample`, the sky patch weight. Today: `base = kind === 'travel' ? ... : kind === 'rise' && state.view === 'orbit' ? 0 : 1`. In the three ending kinds (`retreat`, `lookback`, `fade`) the last stop's orbit patch is therefore drawn at full weight. The ending switches the sky to its own aim under the cover of the last stop's rise, so a patch of the last stop would sit on a sky that has turned. Wanted: `base` 0 when `shot.segment.stop` is the ending. Not changed on `agent/travel` because the brief limits my changes in that file to the dust call.
2. `DUST_COUNT` in `src/core/engine.ts` was raised from 2600 to 4500 with the dust call (commit 5887f47).
