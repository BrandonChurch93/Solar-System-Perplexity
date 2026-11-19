# 08 · Build order

Work the phases in order. A phase ends when every line of its gate is true and logged with evidence. Then commit, push, publish, write the progress note and start the next phase without waiting. The one planned stop is the Mars review at the end of Phase 3.

Every loop below has a limit in `kit/07-QUALITY-BAR.md`. A gate line that says "or its limit was reached" is met by reaching the limit and logging what is open.

## Before Phase 0

1. Read `AGENTS.md` and `kit/00-README.md`.
2. Read `kit/PROGRESS.md` and every file in `kit/addenda/`. If a phase is already in progress, continue it. Check "Running jobs" and pick up or restart anything listed there.

## Phase 0 · Ground truth

Read first: `AGENTS.md`, `kit/00-README.md`, `kit/05-ARCHITECTURE.md`, `kit/06-ASSETS.md`, `config/showcase.json`.

Steps:

1. Push a small change to `kit/PROGRESS.md` to `repo.url`. If it fails, retry. If it still fails, stop as `AGENTS.md` says.
2. Create `package.json` at the repo root before installing anything.
3. Record the workspace: OS, cores, memory, disk, Node and npm versions, the browser and its exact version, the WebGL2 limits and extensions under software rendering, and which codec strings the browser can encode for `export.videoCodec`. Write the limits to `config/webgl-caps.json`.
4. Confirm `ffmpeg` and `ffprobe` run. If either is missing, install a static build through npm.
5. Test whether a detached process outlives a scripted step. Test whether a sandbox agent gets its own VM, can clone the repo, can return a video file as an attachment and can push a branch.
6. Measure the image limit: view a landscape test image with fine numbered marks and find the longest edge that arrives without being downscaled. If it is smaller than `critics.maxImageLongEdgePx`, lower that key.
7. Record what you can call:
   - Image models, the largest size each returns and how many reference images each accepts.
   - A way to add resolution to an image without redrawing it. Install one that runs on a CPU if no tool offers it. Try it on one approved close image and check it as `kit/06-ASSETS.md` says.
   - A way to estimate depth from an image. Install one that runs on a CPU if no tool offers it. Try it on `references/approved/mars-close.jpg` and look at the result.
   - Any tool that turns a still into video. It is optional.
   - App hosting, and the largest site it accepts.
   - The model families available for supporting agents, and which of them can see images.
8. Verify current stable versions of the stack from each project's own documentation. Pin them.
9. Scaffold the app: config import and validation, seeded random, sampler, accumulator, the timeline with every segment, the set loader, the frame interface, `capture` mode.
10. Build the harness commands `still`, `determinism`, `gate` and `review`.
11. Build a spike scene: one globe with a wrap map at `assetSets.full.wrapMapWidth`, a shell atmosphere, a sky at `assetSets.full.skyWidth` with stars drawn as points, bloom, accumulation at every tier.
12. Measure seconds per sample at each format, the time and memory to load one `full` set and two, and the fixed cost of starting a render. If two sets at `assetSets.full.maxSetMemoryMb` plus the sky do not fit in this VM, log it. The harness then uses the `web` set for every frame that needs two sets, and the `full` set everywhere else.
13. Write the render budget table: time for one judged still at the `final` tier, and time for the whole film at each tier and format.
14. Publish the spike build with its review page. Record the URL in `kit/PROGRESS.md` and `README.md`.
15. Write the first progress note.

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
5. Run `npm run review` and publish, so the rough cut plays at `<url>/review.html`.
6. Share the file in the task thread with a progress note. Give the review page link. Say that the rough cut is made from the approved stills, that it exists so Brandon can judge the pacing, and that the build is continuing.
7. Continue without waiting. Pacing changes, if any, arrive later as an addendum.

Gate:

- G16 is green.
- The rough cut is pushed, published on the review page and shared.

## Phase 2 · Engine and blockout

Read first: `kit/01-FILM.md`, `kit/02-STOPS.md`, `kit/03-METHOD.md`, `kit/04-LOOK.md`, `kit/05-ARCHITECTURE.md`, and the checks, judged frames, packs and R4 blockout sections of `kit/07-QUALITY-BAR.md`.

The whole film plays from first frame to last before any stop is finished.

Steps:

1. Build the shared engine: the director, the camera rig with its drift, the set loader, the sampler with both sample counts, the lens and grade chain, the sky with stars as points and a first grade, the Sun as light and glare, dust motes.
2. Give all nine stops a stand-in set. A globe at the right size with a quick wrap map: the approved hero image unprojected with no cleanup is enough. Stand-in moons and rings. A stand-in terrain view: the approved close image on a flat plane facing the camera.
3. Animate every segment of the film, including the Sun's order and the ending. At every judged `hold` and `terrain` frame, match the composition of the approved image. Covers are a plain haze for now.
4. Build the `live`, `autopilot` and `export` modes and the menu.
5. Build the diagnostic views in `kit/04-LOOK.md` and the remaining harness commands.
6. Measure the render budget again on this scene and update the table.
7. Write `cut/SHOTS.md`: for every segment, the lens, the move, the start and end framing and what is in frame.
8. Write the judged frame list into `kit/PROGRESS.md`.
9. Run R4 blockout rounds, with the machine checks green before each: fix and repeat, up to `quality.blockoutMaxRounds`.
10. From the final build of this phase: render the blockout preview film at the `draft` tier, run `npm run proof`, run `npm run proof -- --memory`, then run `npm run keep`.
11. Publish and write the progress note.

While this phase runs, supporting agents may start on the wrap maps, moon maps and sky grade for every stop. Terrain views, detail patches and covers for stops other than the look lock stop wait until Mars is approved.

Gate:

- The machine checks are green.
- R4 blockout scores at least `quality.passScore` with no severe or major issue open, or its limit was reached.
- The judged frame list is in `kit/PROGRESS.md`.
- G8 and G9 are green. `out/preview.mp4` is committed.
- The published app plays the whole film in `autopilot`.

## Phase 3 · Mars, the look lock

Read first: the shared rules and the Mars section of `kit/02-STOPS.md`, `kit/03-METHOD.md`, `kit/04-LOOK.md`, `kit/06-ASSETS.md`, `kit/07-QUALITY-BAR.md`.

Prove every technique on one stop before spreading it across the film. The stop is `lookLockStop` in the config.

Steps:

1. Finish the orbit view: wrap maps grown from the approved hero image, atmosphere, the dust storm, Phobos, light.
2. Finish the terrain view: the relief and its motion.
3. Finish the dive and the rise: detail patches, the cover, both camera paths.
4. Set the lens, tone curve, grade, bloom and grain against Mars's two approved images. These become the film's defaults.
5. Measure the render budget and the memory of Mars's finished set, and update the table.
6. Run rounds with the measures and with R1, R2, R3, R4 and R8 on Mars's judged frames until the pass bar holds or `quality.lookLockMaxRounds` is reached.
7. From the final build of this phase: `npm run clip -- --stop mars --tier review`, `npm run compare` for both views, then `npm run keep`.
8. Write "Look lock" in `kit/PROGRESS.md`: every locked setting, each technique that worked and each that did not, so the other eight stops start from what Mars taught.
9. Run `npm run review` and publish, so the Mars clip and both comparison images are on the review page.
10. Mark Phase 3 `done` in `kit/PROGRESS.md`, commit and push.
11. Follow stop condition 1 in `AGENTS.md`.

Gate:

- The machine checks are green, with G11 and G15 covering Mars.
- The pass bar holds for Mars, or its limit was reached.
- `out/stills/compare-mars-hold.jpg` and `out/stills/compare-mars-terrain.jpg` are committed and pushed.
- The Mars clip is on the published review page, or committed under `out/clips/` if the page could not carry it.

### The Mars review

If stop condition 1 says to stop:

1. Write `waiting` under "Mars review" in `kit/PROGRESS.md`, commit and push.
2. Attach the clip and both comparison images to the final message.
3. End the task with exactly this block, filled in:

```
MARS READY FOR REVIEW
Review page: <url>/review.html
Watch it live: <url>?mode=autopilot&stop=mars
Fly it: <url>?stop=mars
Side by side: out/stills/compare-mars-hold.jpg and out/stills/compare-mars-terrain.jpg
Rounds run: <number> of <limit>
Scores: R1 <n>, R2 <pass or fail>, R3 <n>, R4 <n>, R8 <pass or fail>
Measures: G5 <pass or fail>, G13 <pass or fail>, G17 <pass or fail>
Open items: <list, or "none">
What I would improve next: <one to three lines>
To continue: send the resume prompt from kit/10-KICKOFF.md
```

When a task starts and "Mars review" says `waiting`:

- If the task prompt contains `Mars is approved.`, continue below.
- If it does not, do nothing to Phase 3. End the task with the same block again.

When the build resumes with `Mars is approved.`:

1. Write `approved` under "Mars review" in `kit/PROGRESS.md`. Phase 3 is done. Do not run its rounds or its gate again.
2. Read every file in `kit/addenda/`. If one asks for changes to Mars or to the look, make them first, run rounds on Mars until its pass bar holds or `quality.maxRoundsPerStop` is reached, and update "Look lock". There is no second review stop.
3. Start Phase 4.

## Phase 4 · The other eight stops

Read first: `kit/02-STOPS.md`, `kit/03-METHOD.md`, `kit/04-LOOK.md`, `kit/06-ASSETS.md`, `kit/07-QUALITY-BAR.md`, the "Look lock" section of `kit/PROGRESS.md`, and every file in `kit/addenda/`.

Finish the stops in the order of `buildOrderAfterLookLock` in the config.

Use supporting agents in parallel. An agent owns one stop: `src/stops/<id>/`, `public/assets/<id>/` and `assets-src/<id>/`. You integrate each stop, run its checks and its critics, and decide when it is finished.

For each stop:

1. Finish the orbit view.
2. Finish the terrain view with the technique its section of `kit/02-STOPS.md` names.
3. Finish the dive and the rise. The Sun has no dive.
4. Run rounds with the measures and with R1, R2, R3, R4 and R8 on the stop's judged frames until the pass bar holds or `quality.maxRoundsPerStop` is reached.
5. From the stop's final build: `npm run clip -- --stop <id> --tier review`, `npm run compare` for both views, `npm run keep`.
6. Mark the stop `finished` in the "Stops" table of `kit/PROGRESS.md` with the commit it was finished on.
7. Commit, push, run `npm run review`, publish and write the progress note for that stop, with its comparison images attached.

Gate:

- The machine checks are green, with G11 and G15 covering all nine stops.
- Every stop is marked `finished`: its pass bar held, or its limit was reached.
- 18 comparison images are committed, two per stop, each from the build its stop was finished on.
- The app is published with every finished clip on the review page.

## Phase 5 · The space between

Read first: the camera, light, travel and ending sections of `kit/01-FILM.md`, sections 4 to 6 of `kit/03-METHOD.md`, `kit/04-LOOK.md`, `kit/07-QUALITY-BAR.md`.

Steps:

1. Finish every `travel`: the next body growing from a point, the Sun's size and glare for each stop, the slow changes of exposure, dust near the lens.
2. Finish the asteroid belt in `mars.travel`.
3. Finish the ending.
4. Finish the sky grade.
5. Watch the whole film contact sheets. Bring the grade of every stop into one film. After any change to the shared engine, check each finished stop as "Freshness" in `kit/07-QUALITY-BAR.md` says.
6. Build `npm run stress` if it is not built, and run it.
7. Measure the render budget again and update the table.
8. Run whole film rounds with R5, R6 and R7, with R2 on its whole film list, and with R3 and R4 on the `travel` segments and the ending, until the whole film pass bar holds or `quality.wholeFilmMaxRounds` is reached.
9. From the final build of this phase: render the preview film, run `npm run keep`, run `npm run review`, publish and write the progress note.

Gate:

- The machine checks are green.
- The whole film pass bar holds, or its limit was reached.
- G8 is green. `out/preview.mp4` is committed.

## Phase 6 · Polish and deliver

Read first: "Open items" in `kit/PROGRESS.md`, `kit/05-ARCHITECTURE.md`, `kit/07-QUALITY-BAR.md`, `kit/09-QA-GAUNTLET.md`.

Steps:

1. Work the open items, worst first, for up to `quality.polishMaxRounds` rounds. In each round fix a batch, then run the measures and the critics that raised those issues on the frames they touch, and R4 on any segment whose motion changed.
2. Freeze the build. From here on, nothing under `src/`, `public/` or `config/` changes except to fix a machine check or a failed QA item.
3. Render every judged still and both comparison images of every stop from the frozen build.
4. Run the record round: the measures and every critic once, on the full judged list, from the frozen build. Write the scores into `kit/PROGRESS.md` as the final scores. The record round is a record. It is not followed by fixes.
5. Render the sandbox master: every frame of the film in `formats.master`, in chunks as `kit/05-ARCHITECTURE.md` describes, at the highest tier that fits in `sandbox.sandboxMasterMaxHours` and never below `review`, with the segments split across sandbox agents. Join the chunks into the master. It is too large to commit. Share it as a file in the final message. If it cannot be shared, log why and continue.
6. Make the nine clips by joining each stop's chunks. Make the final preview film by scaling the master down to `formats.preview`, with a record that carries the per-frame G5 results from the master render. If the sandbox master could not be rendered in the time allowed, render the nine clips at the `review` tier and the preview film at the highest tier that fits in `sandbox.previewFilmMaxHours`, and log it.
7. Run `npm run keep -- --clips`.
8. Run `npm run proof` and `npm run proof -- --memory` on the frozen build.
9. Write `cut/CUES.md`.
10. Write `README.md`: what this is, the app URL, how to fly it, how to export the film and a single clip, where the comparison images and scorecards are, and any credit the post must carry.
11. Run `npm run review` and publish the final build.
12. Run every item in `kit/09-QA-GAUNTLET.md` and record the evidence. If an item fails, fix it and run the gauntlet again, for at most `quality.gauntletMaxPasses` passes in all.
13. If a fix in step 12 changed anything under `src/`, `public/` or `config/`, render the judged stills of the stops it touched again and run the record round again, for at most `quality.recordRoundMaxRuns` runs in all. The sandbox master is rendered again only if the fix changed what the film shows, and only once.
14. Commit and push.

Gate:

- The machine checks are green, or a red one is logged as a severe open item under its limit.
- G8 and G9 are green.
- Every item in `kit/09-QA-GAUNTLET.md` has its evidence in `kit/PROGRESS.md`. An item that still fails after the last pass is listed under "Failed QA items" with what was tried.

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
Final scores: R1 <lowest stop and its score>, R2 <pass or fail>, R3 <lowest>, R4 <lowest>, R5 <n>, R6 <n>, R7 <n>, R8 <pass or fail>
Open items: <list with the stop and frame of each, or "none">
Failed QA items: <list, or "none">
```
