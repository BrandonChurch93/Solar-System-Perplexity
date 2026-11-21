# Brief for the belt agent (saved verbatim from the Builder, /root)

You are a supporting agent of the Builder (/root) of a film project. Repo: https://github.com/BrandonChurch93/Solar-System-Perplexity (branch main). The film is one unbroken flight through the solar system, rendered by a three.js WebGL2 app with a deterministic frame harness. Your job: build the asteroid belt beat of the segment `mars.travel` as a separate module, ready for the Builder to integrate later. Work without questions; decide, log, continue.

## SETUP
- You have your own VM. `git clone --depth 1 https://github.com/BrandonChurch93/Solar-System-Perplexity repo`, `git checkout -b agent/belt`, `npm ci`, `pip install -r tools/ml/requirements.txt` if Python packages are missing, `npx playwright-core install chromium` if `~/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome` is missing. `npm run build` must pass before anything renders; `npx vitest run` must stay green. At most one render process at a time. Long jobs run detached with a log you poll: `(set -m; cmd > log 2>&1 &)`.
- Memory: you lose your memory when your context is compacted. Keep a lab notebook in `assets-src/belt/NOTES.md` (what you tried, measured, decided, what is next), commit and push it with every push, and after a compaction read this brief again (save it first thing as `assets-src/belt/BRIEF.md`), then the notebook.

## READ FIRST (from the repo)
- `AGENTS.md` (its rules on limits, git, conventions, assets bind you; you are a supporting agent, not the Builder).
- `kit/01-FILM.md`: "Travel", "Camera rules". `kit/03-METHOD.md` section 4. `kit/04-LOOK.md` sections 1 to 7 (lens: depth of field only where something is close to the lens; motion blur must be smooth, never separate ghost copies). `kit/05-ARCHITECTURE.md` (determinism, hashes, sets, harness commands). `kit/07-QUALITY-BAR.md` rubrics R2, R3, R4 (your frames are judged by those). `kit/addenda/` both files. In `kit/PROGRESS.md`: "Look lock", "Workspace record", "Tool record", "Render budget".
- Code: `src/core/engine.ts`, `src/director/film.ts` (the travel part), `src/space/dust.ts`, `src/bodies/moonbody.ts`, `src/stops/mars/` (how Phobos is built as a displaced mesh: that rock is your style target), `src/diagnostics/diag.ts`.
- The style target for the rocks is Phobos in `references/approved/mars-hero.png` (dark, cratered, grooved, rim-lit).

## WHAT THE KIT ASKS FOR
"`mars.travel` crosses the asteroid belt: a few dark rocks tumble past close to the lens with motion blur. Sparse. It is a beat, not a field." Depth of field is used where something is close to the lens. Speed is felt through things near the camera. Stars do not streak. The bar for every frame: a still from a top-budget film or AAA game cinematic.

## WHAT TO BUILD
- `mars.travel` is frames 2745 to 2819 (30 fps). Its judged frame is 2782 (the middle). In it the camera turns away from Mars and settles on open sky; Jupiter grows from a point of light.
- Three to five rocks, each an irregular displaced mesh (not a sphere, not a card) with craters, grooves and fine regolith relief, dark carbonaceous grey-brown, lit only by the film's Sun for that segment (the engine's sun direction in the frame state), with a thin bright rim and a faint fill so the dark side is never pure black. Each tumbles on its own axis. They cross the frame at different depths: one very near the lens (large, soft, out of focus, fast), one or two at the focus distance (crisp, slower, holding up in native-size crops), one or two farther and small. Every rock enters from outside the frame and leaves it; nothing is created, destroyed, popped or faded inside the frame. Rocks hide stars and whatever is behind them (they write alpha like a body).
- Compose the judged frame 2782 as a picture: at least one crisp rock well placed, with the open sky and the Milky Way behind, and no rock covering the point of light that is Jupiter. A viewer shown that frame alone should call it a frame from a film. Check the frames around it too: R4 reads a contact sheet of the whole segment.
- Motion blur must be a smooth streak at every tier (samples per frame come from `tiers` in `config/showcase.json`; do not change the config). If the tier's samples are not enough for a rock that crosses many pixels per frame, accumulate extra time steps inside your own module (your own render target) so an edge never breaks into copies.
- Depth of field for the near rocks inside your module (for example: draw each rock to your own target and blur it by its circle of confusion before it is composited; or aperture samples of your own). Bokeh soft and wide, not a hard halo.
- Deterministic: every position, spin and seed is a closed-form function of film time or of the seeded generator in `src/core/random.ts`. No `Math.random`, `Date.now`, `performance.now`.
- Your module takes part in the diagnostic views in `src/diagnostics/diag.ts` (texels with the counted flag, layers, depth) the way Phobos does.
- Textures: procedural, or generated with the image tools with Phobos from the approved Mars hero as the style input. Every generated file has its recipe in `assets-src/belt/RECIPE.md` (output file, tool and model, input files by path, exact prompt, which take was kept and why, checks passed). At most six takes per asset. No text, logo, border, baked stars. Both asset sets: `public/assets/shared/belt/full/` (at most 30 MB on disk, at most 64 MB of texture memory with mipmaps) and `public/assets/shared/belt/web/` (at most 10 MB), `web` derived from `full`. Rejected takes stay under `out/work/`.

## WHAT YOU OWN
- Only `src/space/belt/` (new), `public/assets/shared/belt/` (new), `assets-src/belt/` (new). Never edit anything else in a commit.
- The hook into the shared engine (where the belt is created, updated and drawn) is the smallest change you can make. Keep it in your working tree, never commit a shared file. Save it as `git diff origin/main -- <shared files> > assets-src/belt/engine.patch` and describe it in `assets-src/belt/ENGINE-REQUESTS.md`. With the patch applied, every frame outside `mars.travel` must render the same bytes as without it. Prove it on your own VM: render frames 2325, 2427, 2580 and 2726 with `npm run still -- --frame N --tier final` on plain `origin/main`, keep their sha256, apply your patch and module, render again, compare. Report the eight hashes.

## HARNESS (run `npm run` for the list; read `tools/` for options)
- `npm run still -- --frame N --tier draft|review|final [--diag texels|layers|depth]`, `npm run sheet -- --segment mars.travel --tier review`, `npm run seq -- --first A --last B`, `npm run crops -- --frame N --regions ...`.
- Iterate at the draft tier, confirm at review, and render frame 2782 at final before you report.

## PICTURES EVERY 30 MINUTES (binding)
- The harness logs every still, sheet and crop page as a look. Log anything else you look at with `npm run looks -- --add FILE --label "what it is" --stop mars`.
- At least every 30 minutes of working time, also while a render runs: `npm run looks -- --push --folder belt --note "one line: what you are working on"`. It pushes your newest looks to the branch `agent/belt-looks`. Unfinished and bad pictures are pushed, not held back. First push within 30 minutes of starting.

## GIT
- Push code, the patch and the notebook to `agent/belt` at least every 30 minutes. Commit only your three folders. Generated binaries are committed once per milestone after the best take is chosen, never per take. No file over 95 MB. Never force push, never rebase. Merge `origin/main` when the Builder says main moved. Every commit message ends with the trailer `Co-authored-by: Perplexity <noreply@perplexity.ai>`.
- No em dashes and no exclamation points in any copy, file name or README. Almost no code comments. No model names or version strings in code that reaches the interface.

## REPORTING
- Message the Builder (`/root`) briefly at two moments: when the first rocks are in frame (commit, what is weak), and when you are done, with a message that starts with `DONE`: the commit on `agent/belt`, the eight hashes, the measured cost per frame of `mars.travel` at the review tier with and without the belt, what is still weak. A message is not a question; do not wait for a reply. Before `DONE`, read the R3 and R4 rubrics against your own contact sheet and native crops and fix what they would raise. The Builder never trusts a report and checks through the harness, so report what you measured.
