# 08 · Build order

Work the phases in order. A phase ends when every line of its gate is true and logged with evidence. Then commit, push, publish, write the progress note and start the next phase without waiting. The one planned stop is the Mars review at the end of Phase 3.

## Before Phase 0

1. Read `AGENTS.md` and `kit/00-README.md`.
2. Read `kit/PROGRESS.md` and every file in `kit/addenda/`. If a phase is already in progress, continue it.

## Phase 0 · Ground truth

Read first: `AGENTS.md`, `kit/00-README.md`, `kit/05-ARCHITECTURE.md`, `config/showcase.json`.

Steps:

1. Push a small change to `kit/PROGRESS.md` to `repo.url`. If it fails, retry. If it still fails, stop as `AGENTS.md` says.
2. Record the workspace: OS, cores, memory, disk, Node and npm versions, browsers, the WebGL2 limits and extensions under software rendering, and whether the browser can encode `export.videoCodec`. Write the limits to `config/webgl-caps.json`.
3. Confirm `ffmpeg` and `ffprobe` run. If either is missing, install a static build through npm from the repo root once `package.json` exists.
4. Test whether a detached process outlives a scripted step. Test whether a sandbox agent gets its own VM, can clone the repo and can push a branch.
5. Measure the image limit: view a landscape test image with fine numbered marks and find the longest edge that arrives without being downscaled. If it is smaller than `critics.maxImageLongEdgePx`, lower that key.
6. Record what you can call:
   - Image models, the largest size each returns and how many reference images each accepts.
   - A way to add resolution to an image without changing it. Try it on one approved close image and check it as `kit/06-ASSETS.md` says.
   - A way to estimate depth from an image that runs here. Try it on `references/approved/mars-close.jpg` and look at the result.
   - Any tool that turns a still into video. It is optional.
   - App hosting, and the largest site it accepts.
   - The model families available for supporting agents, and which of them can see images.
7. Verify current stable versions of the stack from each project's own documentation. Pin them.
8. Scaffold the app: config import and validation, seeded random, sampler, accumulator, the timeline with every segment, the set loader, the frame interface, `capture` mode.
9. Build the harness commands `still`, `determinism` and `gate`.
10. Build a spike scene: one globe with a wrap map at `assetSets.full.wrapMapWidth`, a shell atmosphere, a sky sphere at `assetSets.full.skyWidth`, bloom, accumulation at every tier.
11. Measure seconds per sample at each format, the time and memory to load one `full` set and two, and the fixed cost of starting a render.
12. Write the render budget table: time for one judged still at the `final` tier, and time for the whole film at each tier and format.
13. Publish the spike build. Record the URL in `kit/PROGRESS.md` and `README.md`.
14. Write the first progress note.

Gate:

- A push has succeeded.
- G1, G2, G3, G4 and G14 are green on the spike.
- The workspace record, the tool record, the pinned versions and the render budget table are in `kit/PROGRESS.md`.
- The app is published, or the log says why it could not be.

## Phase 1 · Rough cut

Read first: `kit/01-FILM.md`, the rough cut section of `kit/05-ARCHITECTURE.md`, `config/showcase.json`.

Steps:

1. Build `npm run animatic`.
2. Make `out/roughcut.mp4`.
3. Look at one frame from every segment and confirm the order and the timing against `segments`.
4. Commit and push.
5. Build `npm run review` and publish, so the rough cut plays at `<url>/review.html`.
6. Share the file in the task thread with a progress note. Give the review page link. Say that the rough cut is made from the approved stills, that it exists so Brandon can judge the pacing, and that the build is continuing.
7. Continue without waiting. Pacing changes, if any, arrive later as an addendum.

Gate:

- G16 is green.
- The rough cut is pushed, published on the review page and shared.

## Phase 2 · Engine and blockout

Read first: `kit/01-FILM.md`, `kit/02-STOPS.md`, `kit/03-METHOD.md`, `kit/05-ARCHITECTURE.md`, and the gate, judged frames, packs and R4 blockout sections of `kit/07-QUALITY-BAR.md`.

The whole film plays from first frame to last before any stop is finished.

Steps:

1. Build the shared engine: the director, the camera rig with its drift, the set loader, the lens and grade chain, the sky from the real star map with a first grade, the Sun as light and glare, dust motes.
2. Give all nine stops a stand-in set. A globe at the right size with a quick wrap map: the approved hero image unprojected with no cleanup is enough. Stand-in moons and rings. A stand-in terrain view: the approved close image on a flat plane facing the camera.
3. Animate every segment of the film, including the Sun's order and the ending. At every judged `hold` and `terrain` frame, match the composition of the approved image. Covers are a plain haze for now.
4. Build the `live`, `autopilot` and `export` modes and the menu.
5. Build the diagnostic views in `kit/04-LOOK.md` and the remaining harness commands.
6. Write `cut/SHOTS.md`: for every segment, the lens, the move, the start and end framing and what is in frame.
7. Write the judged frame list into `kit/PROGRESS.md`.
8. Run R4 blockout. Fix and repeat, up to `quality.blockoutMaxRounds`.
9. From the final build of this phase: render the blockout preview film at the `draft` tier, run `npm run proof`, run `npm run proof -- --memory`, then run `npm run keep`.
10. Publish and write the progress note.

While this phase runs, supporting agents may start on the wrap maps, moon maps and sky grade for every stop. Terrain views, detail patches and covers for stops other than the look lock stop wait until Mars is approved.

Gate:

- G1 to G10, G12, G14 and G15 are green.
- R4 blockout scores at least `quality.passScore` with no severe or major issue open, or its limit was reached and the open issues are logged.
- The judged frame list is in `kit/PROGRESS.md`.
- `out/preview.mp4` is committed.
- The published app plays the whole film in `autopilot`.

## Phase 3 · Mars, the look lock

Read first: the shared rules and the Mars section of `kit/02-STOPS.md`, `kit/03-METHOD.md`, `kit/04-LOOK.md`, `kit/06-ASSETS.md`, `kit/07-QUALITY-BAR.md`.

Prove every technique on one stop before spreading it across the film. The stop is `lookLockStop` in the config.

Steps:

1. Finish the orbit view: wrap maps grown from the approved hero image, atmosphere, the dust storm, Phobos, light.
2. Finish the terrain view: the relief and its motion.
3. Finish the dive and the rise: detail patches, the cover, both camera paths.
4. Set the lens, tone curve, grade, bloom and grain against Mars's two approved images. These become the film's defaults.
5. Run rounds with R1, R2, R3, R4 and R8 on Mars's judged frames until the pass bar holds or `quality.lookLockMaxRounds` is reached.
6. From the final build of this phase: `npm run clip -- --stop mars --tier review`, `npm run compare` for both views, then `npm run keep`.
7. Write "Look lock" in `kit/PROGRESS.md`: every locked setting, each technique that worked and each that did not, so the other eight stops start from what Mars taught.
8. Publish.
9. Follow stop condition 1 in `AGENTS.md`.

Gate:

- G1 to G15 are green, with G11, G13 and G15 covering Mars.
- The pass bar holds for Mars, or the limit was reached and every open issue is logged.
- `out/clips/mars.mp4`, `out/stills/compare-mars-hold.jpg` and `out/stills/compare-mars-terrain.jpg` are committed and pushed.
- The app is published.

### The Mars review

If stop condition 1 says to stop, attach the clip and both comparison images to the final message and end the task with exactly this block, filled in:

```
MARS READY FOR REVIEW
Review page: <url>/review.html
Watch it live: <url>?mode=autopilot&stop=mars
Fly it: <url>?stop=mars
Clip: out/clips/mars.mp4
Side by side: out/stills/compare-mars-hold.jpg and out/stills/compare-mars-terrain.jpg
Rounds run: <number> of <limit>
Scores: R1 <n>, R2 <pass, fail or invalid>, R3 <n>, R4 <n>, R8 <pass or fail>
Open items: <list, or "none">
What I would improve next: <one to three lines>
To continue: send the resume prompt from kit/10-KICKOFF.md
```

When the build resumes with `Mars is approved.`:

1. Write `approved` under "Mars review" in `kit/PROGRESS.md`.
2. Read every file in `kit/addenda/`. If one asks for changes to Mars or to the look, make them first, run one round on Mars, and update "Look lock".
3. Start Phase 4.

## Phase 4 · The other eight stops

Read first: `kit/02-STOPS.md`, `kit/03-METHOD.md`, `kit/04-LOOK.md`, `kit/06-ASSETS.md`, `kit/07-QUALITY-BAR.md`, the "Look lock" section of `kit/PROGRESS.md`, and every file in `kit/addenda/`.

Finish the stops in the order of `buildOrderAfterLookLock` in the config.

Use supporting agents in parallel. An agent owns one stop: `src/stops/<id>/`, `public/assets/<id>/` and `assets-src/<id>/`. You integrate each stop, run its gate and its critics, and decide when it is finished.

For each stop:

1. Finish the orbit view.
2. Finish the terrain view with the technique its section of `kit/02-STOPS.md` names.
3. Finish the dive and the rise. The Sun has no dive.
4. Run rounds with R1, R2, R3, R4 and R8 on the stop's judged frames until the pass bar holds or `quality.maxRoundsPerStop` is reached.
5. From the stop's final build: `npm run clip`, `npm run compare` for both views, `npm run keep`.
6. Commit, push, publish and write the progress note for that stop, with its comparison images attached.

Gate:

- G1 to G15 are green for all nine stops.
- For every stop the pass bar holds, or its limit was reached and every open issue is logged.
- Nine clips and 18 comparison images are committed.
- The app is published.

## Phase 5 · The space between

Read first: the camera, light, travel and ending sections of `kit/01-FILM.md`, sections 4 to 6 of `kit/03-METHOD.md`, `kit/04-LOOK.md`, `kit/07-QUALITY-BAR.md`.

Steps:

1. Finish every `travel`: the next body growing from a point, the Sun's size and glare for each stop, the slow changes of exposure, dust near the lens.
2. Finish the asteroid belt in `mars.travel`.
3. Finish the ending.
4. Finish the sky grade.
5. Watch the whole film contact sheets. Bring the grade of every stop into one film.
6. Build `npm run stress` if it is not built, and run it.
7. Run whole film rounds with R5, R6 and R7, with R2 on its whole film list, and with R3 and R4 on the `travel` segments and the ending, until the whole film pass bar holds or `quality.wholeFilmMaxRounds` is reached.
8. From the final build of this phase: render the preview film, run `npm run keep`, publish and write the progress note.

Gate:

- G1 to G16 are green.
- The whole film pass bar holds, or its limit was reached and every open issue is logged.
- `out/preview.mp4` is committed.

## Phase 6 · Polish and deliver

Read first: "Open items" in `kit/PROGRESS.md`, `kit/05-ARCHITECTURE.md`, `kit/07-QUALITY-BAR.md`, `kit/09-QA-GAUNTLET.md`.

Steps:

1. Work the open items, worst first, for up to `quality.polishMaxRounds` rounds. In each round fix a batch, then run the critics that raised those issues on the frames they touch, and R4 on any segment whose motion changed.
2. Run the record round: every critic once, on the full judged list, from the final build. Write the scores into `kit/PROGRESS.md` as the final scores. After the record round nothing under `src/`, `public/` or `config/` changes except to fix a gate. If it does, run the record round again.
3. Render the sandbox master: every frame of the film in `formats.master`, at the highest tier that fits in `sandbox.sandboxMasterMaxHours` and never below `review`, with the frame range split across sandbox agents. Encode it at `export.bitrateMbps`. It is too large to commit. Share it as a file in the final message. If it cannot be shared, log why and continue.
4. Make the nine clips and the final preview film. They may be encoded from the sandbox master's frames, with the preview scaled down to `formats.preview`. If the sandbox master could not be rendered in the time allowed, render the nine clips at the `review` tier and the preview film at the highest tier that fits in `sandbox.previewFilmMaxHours`, and log it. Run `npm run keep`.
5. Run `npm run proof` and `npm run proof -- --memory` on the final build.
6. Write `cut/CUES.md`.
7. Write `README.md`: what this is, the app URL, how to fly it, how to export the film and a single clip, where the comparison images and scorecards are, and any credit the post must carry.
8. Publish the final build.
9. Run every item in `kit/09-QA-GAUNTLET.md` and record the evidence.
10. Commit and push.

Gate:

- G1 to G16 are green.
- Every item in `kit/09-QA-GAUNTLET.md` passes with evidence in `kit/PROGRESS.md`.

## BUILD COMPLETE

When the Phase 6 gate holds, end the task with exactly this block, filled in:

```
BUILD COMPLETE
Review page: <url>/review.html
Watch it live: <url>?mode=autopilot
Fly it: <url>
Export: <url>?mode=export
Sandbox master: <attached, or why not>
Preview film: out/preview.mp4
Clips: out/clips/
Side by side: out/stills/
Scorecards: scorecards/
Rounds run: <number>
Final scores: R1 <lowest stop and its score>, R2 <pass, fail or invalid>, R3 <lowest>, R4 <lowest>, R5 <n>, R6 <n>, R7 <n>, R8 <pass or fail>
Open items: <list with the stop and frame of each, or "none">
```
