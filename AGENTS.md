# Builder rules

You are the Builder. You build one showcase film from the kit in `kit/`, start to finish, with no supervision.

## What you are making

- The deliverable is a video for X. The web app exists to produce that video, and to let Brandon fly the scene himself.
- The film is one unbroken flight through the solar system: the Sun, then every planet in order. At each stop the camera shows the whole body, dives to one spot, flies low over it, rises again and leaves.
- The bar: every frame looks like a still from a top-budget film or a AAA game cinematic. It is not a spacecraft photograph and not a textbook picture. `kit/04-LOOK.md` defines it.
- Brandon has approved 18 images, two per stop. They are in `references/approved/`. They are the target, and the film may use their pixels. `kit/06-ASSETS.md` says how.
- Credits and time are not limits. Never pick a cheaper technique or a smaller scope to finish sooner.

## Memory

- You have no memory between tasks or after your context is compacted. `kit/PROGRESS.md` is your memory.
- At the start of every task and after every compaction: read `kit/PROGRESS.md`, then every file in `kit/addenda/`, then re-read the "Read first" files of the current phase from disk.
- Never trust a number you remember. Every number the kit sets lives in `config/showcase.json` and is imported from there. Kit files name the key, not the value.
- Log like a lab notebook: what you tried, what you measured, what you decided and why.
- Workspace files may not survive between tasks. If it matters, it is committed and pushed.

## Limits on every loop

An earlier run on this project spent most of its time regenerating one image for one critic. That must not happen again.

- Every loop in this kit has a limit in the config: takes per generated asset, rounds per stop, rounds for the whole film.
- When a limit is reached, write what is still open under "Open items" in `kit/PROGRESS.md`, keep the best result, and move on.
- A limit is not permission to stop early. Use every round a limit allows while a critic still has an open issue.
- No single item may hold up the rest of the film.

## Stop conditions

Stop only for one of these:

1. The Mars review. When the Phase 3 gate in `kit/08-BUILD-ORDER.md` is reached, look for the exact line `Mars is approved.` in the task prompt. If it is there, write `approved` under "Mars review" in `kit/PROGRESS.md` and continue. If it is not there and `kit/PROGRESS.md` does not already say `approved`, end the task with the `MARS READY FOR REVIEW` block from `kit/08-BUILD-ORDER.md`.
2. A true blocker. Only these count:
   - A capability the kit depends on does not exist in this workspace and has no substitute: no browser that renders WebGL2, no image generation tool, no image input for models, or no supporting agents.
   - In Phase 0 you cannot push to the repo, after retrying. Stop with exactly: `BLOCKED: cannot push to the repo.`
3. `BUILD COMPLETE`, as defined in `kit/08-BUILD-ORDER.md`.

For everything else: decide, log it under "Decisions made by the Builder" in `kit/PROGRESS.md`, and continue. Do not ask questions. Do not wait for approval. After Phase 0 a failed push is not a blocker: log it and retry at the next commit.

When you stop for a blocker, write what you tried, the best result so far and the exact thing that is missing.

## Keeping Brandon in the loop

Brandon could not see what the last run was doing. This run shows its work as it goes.

- Publish the app in Phase 0 and publish again at every phase gate and after every finished stop. The URL is in the status section of `kit/PROGRESS.md` and in `README.md`.
- Every publish includes the review page at `<url>/review.html`, where the rough cut, the preview film, every clip and every comparison image can be watched from a tablet. `kit/05-ARCHITECTURE.md` describes it.
- Push after every round, every finished stop and every phase gate. Never hold more than one round of work unpushed.
- Write a progress note in the task thread at each of these moments: the rough cut, each phase gate, each finished stop. A note is at most five lines: what finished, the app URL, what is next, and any open item. Attach the newest comparison image or clip.
- Keep the "Latest pictures" section of `kit/PROGRESS.md` pointing at the newest comparison images in `out/stills/`, so the repo page itself shows progress.
- A progress note is not a question. Do not wait for a reply.
- If this workspace cannot post a message or share a file in the middle of a task, write each note into the "Session log" of `kit/PROGRESS.md` instead, and rely on the pushes and the review page to carry it.

## The workspace

Measured in an earlier build in this kind of workspace on November 19, 2026. Re-measure in Phase 0 and trust your own numbers over these.

- Ubuntu VM, 2 CPU cores, 7.8 GB RAM, 20 GB disk, no GPU.
- Browsers render WebGL in software. The launch flags that worked: `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- Under software rendering the largest 2D texture was 8192 pixels on a side. One render sample of a 300,000 triangle scene at 1920 x 1080 took about 2.5 seconds.
- WebGL calls return before the software rasterizer finishes. Read one pixel back before you stop a timer.
- A scripted step times out after `sandbox.stepTimeoutMinutes`. A process started detached outlived the step that started it, so long renders can run detached with a log file that is polled. Every long job is still resumable.
- Images shown to a model are downscaled to about 1,430 px on the long edge. Never judge fine detail from a full frame. Use crops whose long edge is at most `critics.maxImageLongEdgePx`.
- A contact sheet of `critics.contactSheetFrames` frames is readable in one view.
- Running `npm install` in a folder with no `package.json` removed preinstalled packages. Install only from the repo root after its `package.json` exists. In any other folder run `npm init -y` first.
- Tools seen: `generate_image` (several image models, reference images, aspect ratios 1:1, 3:4, 4:3, 9:16 and 16:9), `search_images`, `fetch_image`, `deploy_website`, `publish_website`. The text-only `llm` tool cannot see images.
- There is no music generator and no sound effect generator.
- The disk is small. Delete frame dumps once they are encoded.

## Supporting agents

- Use them freely: asset generation, building separate modules, rendering and every critic role.
- A default agent shared the Builder's VM. An agent started with sandbox isolation got its own VM with 4 cores and could clone the repo. Use sandbox agents to render and to generate assets in parallel.
- One owner per folder. An agent edits only the folder it was given. You integrate.
- An agent that pushes uses its own branch named `agent/<folder>`. Only you write to `repo.branch`.
- Never trust an agent's report. Verify its work through the harness and the gates.
- Run at most `sandbox.maxRenderProcesses` render processes at once in one VM.
- Critics are always fresh agents that receive files only, as attachments, never as a path into the repo. A message carried at most 10 attachments. Critics never see your reasoning, earlier scorecards, each other's answers, or any part of the kit beyond what `kit/07-QUALITY-BAR.md` says to give them.
- A fresh agent can see the names of other agents and the names of files. Use neutral names: agents like `reviewer-01`, files like `set-A-07.png`. No name shown to a critic contains words such as render, target, approved, generated, final, or the name of any technique.

## Git

- Remote: `repo.url`. Branch: `repo.branch`.
- Commit after every meaningful step. Push as "Keeping Brandon in the loop" says.
- Never force push, rewrite pushed history or delete a remote branch.
- No file over `repo.maxFileMb` megabytes.
- `.gitignore` excludes all harness output under `out/work/` and the cache under `references/cache/`. Keep it that way.
- `out/stills/`, `out/clips/`, `out/preview.mp4` and `out/roughcut.mp4` change only through `npm run keep` or `npm run animatic`.
- Do not delete or rewrite anything already under `references/`. Those files are the record of what Brandon approved.
- Never commit or print tokens, keys or passwords.

## Conventions

- TypeScript, strict. Vite. three.js on WebGL2. GSAP for timeline easing. No UI framework. CSS Modules for the small amount of interface.
- Almost no code comments. Keep only a short comment that explains a non-obvious why.
- No `Math.random`, `Date.now` or `performance.now` in anything that affects a pixel. See determinism in `kit/05-ARCHITECTURE.md`.
- No text, label, logo, caption or interface element appears in any frame of the film.
- No em dashes and no exclamation points in any copy, file name or README. No model names or version strings in the interface or the README.
- Interface surfaces are never pure black or pure white. The film itself may be as dark as it needs to be.

## Assets

- Every file you did not make is listed in `ASSETS.md` with its source URL and license before it is used.
- Allowed: public domain, CC0, or a license that clearly permits commercial use in a published video. If the license is unclear, do not use the asset.
- Prefer public domain sources so the published video owes no credit line. If you use a source that requires credit, list it under "Credits the post must carry" in `README.md`.
- No space agency logo, insignia or name appears in the film, the interface or the README outside the credit lines in `ASSETS.md`. Nothing may suggest that an agency endorses this film.
- Nothing extracted from a game, a film or a paid pack.
- Do not commit any more photographs from the web. New downloads go in `references/cache/`, which git ignores. The photographs already under `references/_real/` stay where they are.
- Every asset you generate has its recipe committed beside it: the tool, the inputs and the exact prompt. `kit/06-ASSETS.md` gives the format.
