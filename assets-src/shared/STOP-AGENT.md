# Stop agent brief

You are a supporting agent of the Builder of this film. You build one stop of it, start to finish: the orbit view, the terrain view, the dive and the rise. The Builder integrates your work, runs the critics and decides when the stop is finished.

Your stop id is in the message that started you. It is written `ID` below.

Mars is finished and Brandon approved it. Its look is the target for your stop, and its code and asset scripts are your pattern: `src/stops/mars/`, `assets-src/mars/`, `public/assets/mars/`.

## Memory

- You lose your memory when your context is compacted. `assets-src/ID/NOTES.md` is your memory. Keep it like a lab notebook: what you tried, what you measured, what you decided and why, what is next. Commit and push it with every push.
- After every compaction read `assets-src/shared/STOP-AGENT.md` (this file), then `assets-src/ID/NOTES.md`, then carry on.

## Read first, in this order

1. `AGENTS.md`. You are a supporting agent, not the Builder, but its rules on limits, git, conventions and assets bind you.
2. `kit/02-STOPS.md`: the shared rules and your stop's section. `kit/03-METHOD.md`. `kit/04-LOOK.md`. `kit/06-ASSETS.md`.
3. `kit/07-QUALITY-BAR.md`: the measures G5, G13 and G17, and the rubrics R1, R2, R3, R4 and R8. Your stop is judged by exactly those, on its judged frames.
4. `kit/05-ARCHITECTURE.md`: sets, hashes, determinism, the harness commands.
5. `kit/addenda/`, both files.
6. In `kit/PROGRESS.md`: "Look lock" (every word of it), "Workspace record", "Tool record", "Render budget", "Judged frames", and the decisions of Phase 3 when you want to know how a thing was done on Mars.
7. `tools/assets/README.md`, `tools/ml/MODELS.md`, `tools/measure/README.md`, every `RECIPE.md` under `assets-src/mars/`.
8. The two approved images of your stop: `references/approved/ID-hero.png` and `references/approved/ID-close.jpg`, at native size, in crops. They are the target. Everything is judged against them.

## What you own

- Only these three folders: `src/stops/ID/`, `public/assets/ID/`, `assets-src/ID/`.
- Never edit anything else: not the shared engine (`src/core`, `src/bodies`, `src/terrain`, `src/space`, `src/post`, `src/director`, `src/diagnostics`, `src/capture`), not `config/`, `tools/`, `kit/`, `references/`, `ASSETS.md`, `package.json`, the lock file, or another stop's folders.
- When a shared module does not do what your stop needs, copy it into `src/stops/ID/` and change the copy, or write your own module there (rings, cloud layers, plasma loops, a second moon). Stop code is hashed per stop, so nothing you do there can change another stop.
- A stop is one `createSet` in `src/stops/ID/set.ts` that returns a `StopSet` (`src/core/types.ts`), and one `plan.ts` with the camera moves, the light and the cover (`MoveParams` in `src/director/moves.ts`).
- Engine requests. If something can only be done in the shared engine (a new camera move parameter, a change to the cover, the lens chain, the sky), make the smallest change in your working tree that adds it. It must be additive and off by default, so that every other stop renders the same bytes as before. Save it with `git diff origin/main -- <the shared files> > assets-src/ID/engine.patch`, describe it in `assets-src/ID/ENGINE-REQUESTS.md` (what, why, how you checked that Mars frame 2325 and frame 2580 did not change), commit both, push, and message the Builder. Keep working with the change in your working tree. Never commit a shared file to your branch. When the Builder says it is on `main`, drop your local copy of the change and merge `main`.
- Third-party files you need as inputs (real maps, height data) go under `references/cache/`, which git ignores. Write their ledger rows (file, what it is, source URL, license, credit line, date fetched) in `assets-src/ID/ASSETS-ROWS.md`. The Builder copies them into `ASSETS.md`. Nothing third-party is shipped as it is: it is painted into the approved style first and ships as a generated asset in your folder. Do not add files to `public/assets/third-party/` or `public/assets/shared/`.

## Setup

- You have your own VM. Clone shallow: `git clone --depth 1 https://github.com/BrandonChurch93/Solar-System-Perplexity repo`, then `git checkout -b agent/ID`. From the repo root: `npm ci`, `pip install -r tools/ml/requirements.txt` if the Python packages are missing. The harness browser is expected at `~/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome`; if it is missing, `npx playwright-core install chromium`.
- `npm run build` must pass before anything is rendered. `npx vitest run` must stay green.
- At most one render process at a time in your VM. Long jobs run detached with a log that you poll: `(set -m; cmd > log 2>&1 &)`.
- Merge `origin/main` into your branch at the start, after every message from the Builder that says `main` moved, and before every milestone. Never rebase, never force.

## Pictures, every 30 minutes

Brandon watches this build through pictures. Addendum 002 binds you.

- The harness logs every still, comparison, sheet and crop page it renders as a look. Log anything else you are looking at (a painted map, a fit overlay, a depth map, a failed take) with `npm run looks -- --add FILE --label "what it is" --stop ID`.
- At least every 30 minutes of working time, also while a render or a generation runs: `npm run looks -- --push --folder ID --note "one line: what you are working on"`. It writes your newest looks to the branch `agent/ID-looks`. Unfinished and bad pictures are pushed, not held back.
- Your first push of looks comes within 30 minutes of starting: the stand-in `hold` and `terrain` frames beside the approved images (`npm run compare -- --stop ID --view hold --tier draft`, the same with `--view terrain`).
- While the orbit view or the terrain view is in work, render its comparison again after each real change, so the newest key frame beside the approved image is always among your looks.

## Git

- Push code, JSON and `NOTES.md` to `agent/ID` at least every 30 minutes, together with the looks.
- Generated binaries under `public/assets/ID/` are committed once per milestone and once per round, after the best take is chosen, never per take. History cannot be rewritten.
- Commit only your three folders: `git add src/stops/ID public/assets/ID assets-src/ID`.
- Every commit message ends with the trailer `Co-authored-by: Perplexity <noreply@perplexity.ai>`.
- No file over `repo.maxFileMb`. Rejected takes, downloads and frame dumps stay under `out/work/` and `references/cache/`.

## Budgets

- Every number comes from `config/showcase.json`. Read it there, never from memory.
- Texture memory of your set, with mipmaps: at or under `assetSets.full.maxSetMemoryMb` for `full` and `assetSets.web.maxSetMemoryMb` for `web`. Mars uses 1,386 and 414 MB. Plan the budget before you make the assets: wrap, patch levels, relief layers, aprons, moons, sky patches.
- On disk, `public/assets/ID/full/` at most 150 MB and `public/assets/ID/web/` at most 40 MB. The published site holds 500 MB for nine stops and the review films.
- Both asset sets exist for every file your set loads. Build `full` first and derive `web` from it.
- At most `assets.maxTakesPerAsset` takes per generated asset per round.
- Every generated asset has its recipe in `assets-src/ID/RECIPE.md` (or one `RECIPE.md` per subfolder, as Mars has): the output file, the tool and model, the input files by path, the exact prompt, which take was kept and why, the checks it passed.

## What to build, and the order

The first build of your stop already carries everything "Look lock" lists under "What worked" and under "Still open on Mars, so start past it". Your stop has only `quality.maxRoundsPerStop` rounds with the critics.

1. Orbit view. The judged `hold` frame beside the approved hero is called the same shot: framing, every feature in its place, color and grade, contrast and blacks, fine detail, light direction, limb glow, moons, rings, sky.
   - The wrap map on the side the hero shows is the hero's own pixels, faded toward the limb. The rest of the map is painted at the detail of the dive patches, with no seam, no pinched pole and no soft region, because the rise shows the far side. Poles are painted on a polar projection.
   - Light is a curve measured from the hero (`tools/assets/lightcurve.py`), not a formula.
   - Haze in fitted layers, measured against the hero across the limb, and one layer drawn across the disc's edge on the lit side and the night side.
   - Everything the stop's section of `kit/02-STOPS.md` lists under "Keep" and "Motion in the hold": the globe turns, clouds and bands flow as their own layer with a soft shadow, moons move, shadows are computed where the kit says computed.
   - The hero's own sky as a sky patch for the `hold` (`assets-src/mars/sky/`). The engine aims every sky patch from your plan; your set does not set `aim`.
2. Terrain view, with the technique your stop's section names. The judged `terrain` frame beside the approved close image has lost nothing. Between the first and the last frame of the segment the foreground and the horizon clearly move against each other: a flight through space, not a zoom into a picture. Aprons are painted past every edge from the start, behind the entry point and past the exit, so the covers can move. Flow as `kit/03-METHOD.md` says. Fine detail is added in shadowed foregrounds with the approved pixels kept as the low frequencies.
   - The terrain view may ask for a turn of the fixed sky with `skyAim: { terrain: [along, tilt, lift] }` in `plan.ts`, as Mars does, and carries its own sky patch. See "Sky aim".
3. Dive and rise. Sharp all the way in: G13 holds on every frame outside the cover. Patch levels at most twice apart, designed with a predictor before anything is rendered. The cover belongs to your world, streams with the camera on both sides and thins over ten frames or more; color, exposure, horizon and direction of travel carry across it. The rise is a view of its own: check the far side, the poles and the terminator from its angle. The judged `dive` and `rise` frames are sharp.
   - Samples under the cover. The engine counts the samples of a fast frame from the screen motion in the shutter times what the cover leaves in view, `1 - cover.amount * coverHides`. `coverHides` is an optional number in `plan.ts` beside the other `cover` keys, default 1 (the cover hides all it covers). If your cover is translucent and a bright limb, ring or coast shows through it in stacked copies, set it lower: 0 counts the full motion at any cover amount. `npm run -s samples -- --tier review --range A-B` prints the counts. See "What a cover hides" in `assets-src/shared/PERF.md`.
   - The length and the centre of your cover. `coverWindow` is an optional key in `plan.ts` beside the other `cover` keys: `coverWindow: { dive: { seconds, center }, rise: { seconds, center } }`, every part optional. `seconds` replaces `cover.seconds` of the config for that move of your stop, `center` (a share of the segment, between 0 and 1) replaces `cover.diveCenterFraction` or `cover.riseCenterFraction`. The window grows about its centre and stays inside its segment. The view switch, the cover amount, the sky fades, the sample counts, the cover sheets and the frames G13 skips all follow it. The camera path also reads the window (the entry and the exit on the terrain side run to its edges, the swoop and the settle run from its centre), so frames outside the cover move a little too: look at the whole dive or rise again after a change. If your plan draws its own cover shape in frames about the centre (Venus, Uranus), `seconds` does not lengthen that shape. See "A cover window per stop" in `assets-src/shared/PERF.md`.
   - The sky under your cover. The director dims the sky by what the cover leaves in view: `skyExposure` is multiplied by `plan.skyUnderCover(amount, time)`, and the base method of `StopPlan` returns `Math.pow(1 - amount, 2)`. A cover that leaves space in view therefore shows a pure black sky around its centre for several frames. A plan class may override it, for example with a floor: `override skyUnderCover(amount: number): number { return Math.max(floor, Math.pow(1 - amount, 2)) }`, with `floor` a number of your own look file. Nothing else reads it and no plan overrides it now. Warning: the override changes every frame of your dive and rise in which the cover is above 0 and the sky is in view, and stars showing through a cover that used to hide the view switch can give the switch away. If you override it, render your own cover sheets again (`npm run sheet -- --segment ID --cover`, both moves) and look at every frame of them before you report.
   - How much your own cover hides. If your stop draws its cover in its own folder and keeps the engine's `coverAmount` low so that the sky is not dimmed, the sample rule would count the full motion under it. Override `coverHidden(segment, time)` in your plan class and return the share of the frame your own cover hides at that time, between 0 and 1: `override coverHidden(seg: Segment, time: number): number { return myVeil(seg, time) }`. The sample rule then reads `1 - coverHidden` in place of `1 - cover.amount * coverHides`. It dims nothing and draws nothing: only the sample count of fast frames reads it. The base method returns `undefined`, which means today's rule, and no plan overrides it now. Warning: a share that is too high under a cover that lets a bright edge through gives stacked copies of that edge, as with `coverHides`; check with `npm run -s samples -- --tier review --range A-B` and your cover sheets.
   - The sky turn across your cover. The fixed sky has one turn for the orbit view and one for the terrain view, and the director switches from one to the other at the centre of the cover. A cover that leaves the sky in view shows the star field jump there. `skyTurnEase: { dive: true, rise: true }` in `plan.ts` beside `coverWindow` (each move optional) eases the turn over the whole cover window of that move instead: the terrain turn at one edge of the window, the orbit turn at the other, a smooth step between. Default: the switch. A plan class may also override `skyTurnShare(segment, time)` and return the share of the terrain turn itself (1 terrain, 0 orbit, `null` for the switch). Warning: only the turn eases. `terrainSkyGlow`, the star rule of the terrain view and the sky patch of each view still change at the centre, and a sky patch is fitted to one turn, so a patch that is in view while the turn eases slides against the stars. The sky is drawn at the middle of the shutter, so the turn gives no streaks: the stars step from frame to frame, at most 1.875 times the angle between the two turns divided by the frames of the window (two turns 2.9 rad apart over a 1 s window step 10 degrees per frame at the centre). A longer `coverWindow` makes the steps smaller. Render both cover sheets again and look at every frame.
   - The Sun's glare through the swap. The glare of the sky pass sits where the Sun is in the camera, and the camera changes at the centre of the cover, so a glare that is in view on the terrain side can be gone on the orbit side. `glareCarry: { dive: seconds, rise: seconds }` inside `light` in `plan.ts` (each move optional) keeps it: at the centre the glare stays at the place it had in the terrain camera, and over the given seconds on the orbit side it glides along the shortest arc to the true Sun. Default: off. The Sun of the sky pass moves as a whole, its disc and its glare together; the light on the bodies and the lens flare keep the true Sun. If something in your terrain view hides the engine's disc (Venus's air dome does), the disc is in view on the orbit side while it is carried, as a hard disc from the swap frame on: hide it there in your own pass as well, or do not set the key. The engine asks the director for the glare's place per sample (`FilmDirector.glareOf`), and the director calls your `dive` or `rise` once more at the centre for it, so keep them pure. Warning: over a short carry the glare crosses the frame fast when the two cameras look in very different directions; measure your sky luminance frame by frame across the centre before you report.
   - A cover pass that cannot reach a pixel is not drawn. Nothing to set: the engine skips its own cover pass when the amount is too small to give any alpha (below about 0.1 with no rush) or when `coverShell` puts the cover out of the frame, which saves 0.07 to 0.15 s per sample. The picture is the same to the byte.
4. Check your own work the way the critics will: `npm run measure -- --stop ID` (G5, G13, G17), `npm run compare` for both views at the `final` tier, `npm run sheet -- --segment ID.hold` and the same for `dive`, `terrain` and `rise` at the `review` tier, native crops of every surface with `npm run crops`. Read the R1, R3 and R4 rubrics against your own pictures and fix what they would raise before you report.

Mars is not the ceiling. Round 5 left ten issues open on it (open items 6 to 15 in `kit/PROGRESS.md`). Build so your stop does not meet them.

## Sky aim

- The one sky is fitted to Mars. What sits behind your stop at its hold follows from the plans of every stop between yours and Mars, so it moves whenever one of them changes its exit or its travel. Your stop can fix it instead: `skyAim: { orbit: [along, tilt, lift] }` in your `plan.ts`, beside `skyAim.terrain`. It is the sky direction and roll your camera sees at the judged `hold` frame: `along` in degrees along the band of the Milky Way, `lift` in degrees off the band, `tilt` the roll.
- `npm run -s aim -- --stop ID` prints the aims your branch shows now. Paste the orbit values into your plan and render the judged hold again: it is the same picture. From then on the sky behind your hold and your dive stays where it is, whatever any stop does, and the rim of your sky patch stays matched to the sky around it.
- You may choose other values, for example to put the band of the one sky where your approved hero has its band, so your patch has less to replace and the dive leaves the patch without a visible rim.
- `skyAim.terrain` fixes the sky of the terrain view at its judged frame. Without it the terrain view keeps the orbit view's sky, turned only by the camera.
- The sky changes its turn only under a cover, never in view. Your orbit aim holds from the rise of the stop before yours (after its cover), through its travel and your hold, to your dive cover. From your rise cover on, the sky already belongs to the next stop. So the sky behind your rise is not yours to tune: on your branch it is your own sky, on `main` it becomes the next stop's. Do not paint anything against it.
- Jupiter: the arrival shares its sky with the approved Mars rise, so an orbit aim in Jupiter's plan is ignored. Jupiter's sky follows only from Mars, which is finished, and from Jupiter's own plan.
- A stop with no cover (its plan returns 0 from `coverAmount()`, as Saturn's does) has the sky in view from its hold to the next stop's dive cover, so nothing can hide a change. The engine reads this from the plan: that stop keeps one sky across both of its views (a terrain aim in its plan is ignored), and the stop after it shares that sky (an orbit aim in the next stop's plan is ignored). Saturn's aim decides the sky behind Uranus's hold. It follows from Saturn's aim, Saturn's exit and travel, and Uranus's own arrival and hold, and from nothing else. Uranus matches the rim of its sky patch last, after Saturn's rise is final, and keeps the rim wide and soft until then. `npm run -s aim -- --stop ID` says which case a stop is in.
- Sun: there is no cover between the Sun's hold and Mercury's, so both share one sky and Mercury's aim decides it. The engine drops a leaving stop's sky patch at the first frame of its `travel`: a hold patch of the Sun fades out with its own `weight` before the hold ends.

## Working with the Builder

- Message the Builder (`/root`) at each milestone, briefly: what is done, the commit on `agent/ID`, the measured numbers, what is still weak. Milestones: orbit view, terrain view, dive and rise, then `READY` when all four segments hold together and your own checks are done.
- A message is not a question. Do not wait for a reply. Carry on with the next thing.
- After `READY` the Builder integrates your folders on `main` and starts a round. You may be asked to render your stop's measures, pack or clip at a commit of `main` the Builder names, and to push the results to a branch. Then the critics' issues come back to you, worst first, and you fix causes, not symptoms, until the next round. While the critics are out, keep improving what you already know is weak.
- The Builder never trusts a report. It checks your work through the harness and the gates, so report what you measured, not what you hope.
- Do not stop until the Builder tells you your stop is finished.

## Rules that are easy to break

- No `Math.random`, `Date.now` or `performance.now` in anything that affects a pixel. Every motion is a closed-form function of film time.
- No text, logo, label, border or stray object in any asset or frame. No baked stars in anything that is not a sky patch.
- Never edit `references/`. Work on copies under `out/work/`.
- No em dashes and no exclamation points in any copy, file name or README. No model names or version strings in code that reaches the interface.
- Almost no code comments.
- Never lower a threshold. Never tune a picture to pass a measure at the cost of how it looks.
- Stop-local shaders take part in the diagnostic views (`src/diagnostics/diag.ts`): texels with the counted flag for G13, layers, depth, flow. A surface drawn by a formula with no texture behind it is not counted. Body and relief pixels write alpha, the sky writes none, because G5 reads coverage from it.
