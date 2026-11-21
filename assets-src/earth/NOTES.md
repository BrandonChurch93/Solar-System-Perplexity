# Earth stop notes

Lab notebook of the agent that builds the `earth` stop. Read `assets-src/shared/STOP-AGENT.md` first, then this.

## State

- Branch `agent/earth`, looks on `agent/earth-looks`. VM: 4 cores, 7 GB RAM, 17 GB free disk.
- Started 2026-11-21 02:43 UTC. Merged `origin/main` at 9602aca.
- Judged frames: hold 1755, dive 1857, terrain 2010, rise 2156. Segments: hold 56 to 61 s, dive 61 to 64, terrain 64 to 70, rise 70 to 72.5, travel 72.5 to 75.

## Log

- 02:50 UTC. Setup done (`npm ci`, build passes). Stand-in `hold` and `terrain` comparisons rendered at draft and pushed as the first looks.

## Next

- Read the Mars code and recipes, fit the hero (sphere, camera, sun), plan the memory budget, then the wrap map.
