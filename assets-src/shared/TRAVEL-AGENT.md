# Brief for the travel agent

You are a supporting agent of the Builder (`/root`) of a film project. Repo: https://github.com/BrandonChurch93/Solar-System-Perplexity (branch `main`). The film is one unbroken flight through the solar system, rendered by a three.js WebGL2 app with a deterministic frame harness. Nine stops (Sun to Neptune) are being built by nine other agents. Your job is the space between them: the eight `travel` segments and the three segments of the ending, prepared on your own branch so the Builder can take them when the stops are in. Work without questions: decide, log, continue.

## Setup

- You have your own VM. `git clone --depth 1 https://github.com/BrandonChurch93/Solar-System-Perplexity repo`, `git checkout -b agent/travel`, `npm ci`, `pip install -r tools/ml/requirements.txt` if Python packages are missing, `npx playwright-core install chromium` if `~/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome` is missing. `npm run build` must pass before anything renders. `npx vitest run` stays green. At most one render process at a time. Long jobs run detached with a log you poll: `(set -m; cmd > log 2>&1 &)`.
- Memory: you lose your memory when your context is compacted. Keep a lab notebook in `assets-src/travel/NOTES.md` (what you tried, measured and decided, what is next), commit and push it with every push. After a compaction read this file again, then the notebook.

## Read first

- `AGENTS.md`. Its rules on limits, git, conventions and assets bind you. You are a supporting agent, not the Builder.
- `kit/01-FILM.md`: "The shape of one stop", "The Sun", "The ending", "Camera rules", "Light across the film", "Travel". `kit/03-METHOD.md` sections 4 to 6. `kit/04-LOOK.md` (lens, motion blur, the ladder). `kit/05-ARCHITECTURE.md` (determinism, hashes, sets, harness). `kit/07-QUALITY-BAR.md`: rubrics R3, R4, R5 and R2. Every file in `kit/addenda/`.
- In `kit/PROGRESS.md`: "Look lock", "Open items" 1, 2, 3 and 15, "Tool record", "Render budget", and the decisions of Phase 2 that begin with "Moves" and "one world with a floating origin".
- Code: `src/director/film.ts` (all of it), `src/director/rig.ts`, `src/director/moves.ts` (`exitPose`, `hold`, `rise`), `src/space/dust.ts`, `src/space/sky.ts` (the Sun's disc and glare only), `src/space/aim.ts`, `src/core/engine.ts`, `src/space/belt/` and `assets-src/belt/NOTES.md` (how the belt rocks get a smooth blur at every tier).

## The segments (frames, 30 fps)

| Segment | Frames | Judged frame |
| --- | --- | --- |
| `sun.travel` | 450 to 539 | 495 |
| `mercury.travel` | 1035 to 1109 | 1072 |
| `venus.travel` | 1605 to 1679 | 1642 |
| `earth.travel` | 2175 to 2249 | 2212 |
| `mars.travel` | 2745 to 2819 | 2782 |
| `jupiter.travel` | 3315 to 3389 | 3352 |
| `saturn.travel` | 3885 to 3959 | 3922 |
| `uranus.travel` | 4455 to 4529 | 4492 |
| `ending.retreat` | 5025 to 5144 | 5085 |
| `ending.lookback` | 5145 to 5324 | 5235 |
| `ending.fade` | 5325 to 5399 | none |

## What the kit asks for

- Travel: the camera turns away from the body it is leaving and settles on open sky. The departing body leaves frame behind the camera; it is not seen shrinking. The next body is first a point of light at its true position on the sky for that stop, then a disc, then the hero framing by the start of its `hold`. Fine dust motes drift past the lens in every `travel`, faint, lit by the Sun. `sun.travel`: the camera turns away, Mercury grows from a dark speck in the glare.
- Camera: one continuous shot. The camera has mass: starts and stops are eased, no instant change of position, direction, speed or field of view, also at the joins `rise` to `travel` and `travel` to `hold`. No two stops use the same move back to back. Speed is felt through things near the camera. Stars do not streak. There is no warp effect. Stars hold still when the camera does.
- Light: the Sun is the only light. Its glare is placed where the Sun is for each stop. It gets smaller and its glare tighter at every stop, from a wall of fire at Mercury to a bright star at Neptune. Exposure changes happen during `travel`, slowly.
- Sky: one sky for the whole film. It turns only because the camera turns. In this engine the sky may change its turn only under a cover, where nobody sees it (see "Sky aim" in `assets-src/shared/STOP-AGENT.md`). Never blend a sky turn in view.
- Ending: after Neptune's rise the camera keeps pulling away, past Triton, and turns back to face the way it came. Lookback: the Sun is one bright star among thousands with the Milky Way behind it, Neptune a thin blue crescent at the edge of frame, the camera barely moves. Fade: a slow fall to black. The last frame is black.
- The bar for every frame: a still from a top-budget film or AAA game cinematic. R4 reads a contact sheet of every `travel` segment and of each segment of the ending at the `review` tier. R2 jurors see the judged frames.

## Known problems, worst first

1. Dust moves the wrong way. In `travel` the motes move toward the next body (the offset in `shotAt` is `approach * -28 * ...` and the shader subtracts it), which reads as flying backward. They must stream past the lens from the direction of flight.
2. Dust breaks into dots. A mote that crosses many pixels in one frame is drawn once per time sample, so at the `draft` and `review` tiers it is a dotted trail. Fast motion must be a smooth streak at every tier: draw each mote as its own streak across the shutter (`film.shutterDegrees`), with the same energy whatever the sample count, as the belt module does for its rocks.
3. Dust look: faint, sparse, lit by the Sun (brighter toward the Sun, with a soft falloff), a few near motes large and out of focus, never a snowfall, never over the judged hold framing. It gives the sense of speed, so its apparent speed follows the camera's real speed.
4. `mars.travel` (open items 3 and 15): Mars leaves the frame in about 6 frames, the peak turn is 8.1 degrees per frame at frame 2765, the move carries about 90 degrees of bank out of `mars.rise`, and Jupiter grows straight out of the center. Mars is approved and finished: `src/stops/mars/` cannot change, and nothing may change a frame of `mars.hold`, `mars.dive`, `mars.terrain` or `mars.rise`. The belt rocks (`src/space/belt/`, frames 2767 to 2801) are placed against the present camera of this segment; if you change that camera, say so in your report with the frames.
5. Every arrival looks alike (open item 1): give each of the eight its own side, swing and timing, and never the same move twice in a row.
6. The ending (open item 2): "camera is nearly frozen for over 200 frames on a mostly black frame". The lookback needs the Milky Way behind the Sun, thousands of stars, Neptune as a lit crescent with a glowing limb at the edge of frame, and a slow move that never stops. The ending may fix the sky for itself with an aim of its own, switched under the cover of `neptune.rise`.
7. A body that is smaller than a pixel must still be a clean, steady point of light with the body's color, not a flickering or missing pixel. Check how each stop is drawn from far away (Mars has its own glint in `src/stops/mars/`; the other stops are stand-ins until their agents deliver) and build what is missing in the engine, so no stop has to.
8. Joins: measure the camera's speed, turn rate and field of view frame by frame across `rise` to `travel` and `travel` to `hold` for all eight, and across `neptune.rise` to `ending.retreat` to `ending.lookback`. Any step is a defect.

## What you own, and what you may not touch

- Yours: `src/space/dust.ts`, a new folder `src/space/travel/` if you need modules, `assets-src/travel/` (notebook, probes, tests, recipes).
- Shared engine files you may change on your branch, each topic as its own small commit so the Builder can take them one at a time: `src/director/film.ts`, `src/director/rig.ts`, `src/space/sky.ts` (only the Sun's disc and glare; another agent is changing the sky pass, so stay out of it), `src/core/engine.ts` (only the dust call), `src/core/types.ts` (only what your changes need).
- Never: any folder under `src/stops/`, `public/assets/`, `references/`, `kit/`, `config/`, `tools/`, `tests/`, `src/space/belt/`. A per stop travel value that today lives in a stop's `plan.ts` (`travel`, `arrive`) is overridden from a table of your own in `src/space/travel/`, never by editing the plan. If you need a config value, write it in `assets-src/travel/REQUESTS.md`.
- The stops are in motion. Every other agent changes its own exit pose (`rise`) and hold. Build so your work follows from the plans as they are when the film starts, with no number copied from today's stand-ins. The Builder will ask you to check all eleven segments again when the finished stops are on `main`.
- Do not rotate a stop's world. `place()` in `src/director/film.ts` chooses each stop's rotation from the travel before it (`turnDeg`, `side`). Changing those for `mars.travel` would move the sky behind Jupiter, whose arrival shares its sky with the approved Mars rise. The same holds for `saturn.travel`: Saturn has no cover, so Uranus shares Saturn's sky and its sky patch is matched to the sky that `saturn.travel` leaves behind its hold. Do not change `turnDeg` or `side` of `mars.travel` or `saturn.travel`, and do not change anything that moves the camera's direction at the first frame of those two travels or at the hold after them. For the other six, a stop with a sky aim in its plan keeps its hold sky whatever you do, but say in your report which turns you changed.

## Proof that nothing else moved

With your changes, the judged Mars frames must keep their bytes: `npm run -s still -- --frame N --tier final` for N = 2325, 2580, 2427, 2726, then `sha256sum out/work/stills/f0NNNN-16x9-final-full.png`. The first 16 characters must be `9895a050abe22d0c`, `a7e1670abf3e4a24`, `0a022282c24d2285`, `79352ec57fa5c00b`. Check before every milestone report and give the four values.

## Harness

- `npm run` lists the commands; read `tools/` for options. `npm run still -- --frame N --tier draft|review|final`, `npm run sheet -- --segment ID.travel --tier review`, `npm run seq -- --first A --last B`, `npm run crops -- --frame N --regions ...`, `npm run -s aim` (the sky aims of every stop).
- Iterate at `draft`, confirm at `review`, render each judged frame at `final` before you report.
- Every position, size and seed is a closed-form function of film time or of the seeded generator in `src/core/random.ts`. No `Math.random`, `Date.now`, `performance.now`.

## Pictures every 30 minutes (binding)

- The harness logs every still, sheet and crop page as a look. Log anything else you look at with `npm run looks -- --add FILE --label "what it is"`.
- At least every 30 minutes of working time, also while a render runs: `npm run looks -- --push --folder travel --note "one line: what you are working on"`. It pushes your newest looks to `agent/travel-looks`. Unfinished and bad pictures are pushed, not held back. First push within 30 minutes of starting.

## Git

- Push code and the notebook to `agent/travel` at least every 30 minutes. No file over 95 MB. Never force push, never rebase. Merge `origin/main` when the Builder says `main` moved. Every commit message ends with the trailer `Co-authored-by: Perplexity <noreply@perplexity.ai>`.
- No em dashes and no exclamation points in any copy, file name or README. Almost no code comments. No model names or version strings in code that reaches the interface.

## Reporting

- Message the Builder (`/root`) briefly at three milestones, then when you are done: dust (direction, streaks, look), the eight travels (camera, arrival, Sun and exposure, joins), the ending. Each report: the commits on `agent/travel` by topic, the four Mars hashes, the measured numbers (join steps, peak turn per frame, frames in which the departing body is in view, the frame at which the next body passes one pixel and ten pixels, seconds per frame at `review` before and after), what is still weak.
- The last report starts with `DONE`. Before it, read the R4 rubric against your own contact sheets of all eleven segments and fix what it would raise.
- A message is not a question. Do not wait for a reply. The Builder never trusts a report and checks through the harness, so report what you measured.
