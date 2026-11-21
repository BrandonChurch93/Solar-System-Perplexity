# Engine requests from the earth stop

## 1. Test of the orbit patch aim ignores the orbit turn (`tests/skyframe.test.ts`)

- What: `assets-src/earth/engine.patch` changes one test, no engine code. In "every stop has an orbit patch aim on the view of its judged hold frame" the expected view becomes `sky.frame x inverse(sky.orbits[id]) x camera` when the stop has an orbit turn, and stays `sky.frame x camera` when it has none.
- Why: the test compares the patch aim with the sky the camera would see with no turn. That holds only while a stop's `skyAim.orbit` equals the aim that follows from the plans before it. As soon as a stop's own frame or any earlier stop moves, the engine keeps the sky behind the hold in place with a turn (`sky.orbits[id]`), which is what the brief promises, and the test fails. On this branch `light.sunDir` in Earth's plan turned Earth's frame; `skyAim.orbit` kept the sky; the test reported 0.27 for `earth` in place of 1. On `main` the same failure appears for any stop with an orbit aim once a stop before it changes.
- Checked: with the patch `npx vitest run` is green (28 tests) on this branch; without it one test fails, for `earth` only. `npm run -s aim -- --stop earth` reads the plan's aims back within 0.000002 degrees. No engine file is touched, so no frame can change (Mars 2325 and 2580 not rendered again for this reason).
