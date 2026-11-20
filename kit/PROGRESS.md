# Progress

The Builder's memory. Read this first in every task. Update it before every commit.

## Status

- Current phase: 2 · Engine and blockout
- Current stop: none
- Current round: 1 (Phase 2, blockout, R4)
- Blocked: no
- App URL: https://grand-tour-film.pplx.app (review page: https://grand-tour-film.pplx.app/review.html). Visibility is set to Organization, so it asks for a sign-in. Site id 658cdf8a-abd6-46bd-a3ba-e37d5c3ba5a3. Private preview of the same build: https://www.perplexity.ai/computer/a/grand-tour-.DP5zrWnQuWx5hYYutNNyA
- Mars review: not reached

"Mars review" is one of `not reached`, `waiting` or `approved`. `AGENTS.md` says what each means.
- Last push: 2026-11-20 UTC, Phase 2 engine and blockout before round 1

## Latest pictures

Newest first. Each line links a comparison image in `out/stills/` so this page shows the state of the film.

- None yet.

## Phases

| Phase | State | Gate evidence | Commit |
| --- | --- | --- | --- |
| 0 · Ground truth | done | Push ok. `npm run gate -- --phase 0`: G1 build clean, G2 21 tests pass, G3 four frames identical across fresh loads and reversed order (preview, review tier), G4 all three formats exact and 5400 frames, G14 needs inside `config/webgl-caps.json`. Records, versions and budget are below. Published | see Push log |
| 1 · Rough cut | done | `npm run gate -- --phase 1`: G16 green (5400 frames, 960 x 540, 30 fps, 41 MB). One frame from the middle of each of the 46 segments was looked at: order and labels follow `segments`. Pushed, on the review page, shared in the thread | see Push log |
| 2 · Engine and blockout | in progress | | |
| 3 · Mars, the look lock | not started | | |
| 4 · The other eight stops | not started | | |
| 5 · The space between | not started | | |
| 6 · Polish and deliver | not started | | |

## Stops

State is one of `not started`, `stand-in`, `in progress` or `finished`. A finished stop also names the commit it was finished on.

| Stop | State | Rounds run | R1 | R2 | R3 | R4 | R8 | Open items |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sun | not started | 0 | | | | | | |
| mercury | not started | 0 | | | | | | |
| venus | not started | 0 | | | | | | |
| earth | not started | 0 | | | | | | |
| mars | not started | 0 | | | | | | |
| jupiter | not started | 0 | | | | | | |
| saturn | not started | 0 | | | | | | |
| uranus | not started | 0 | | | | | | |
| neptune | not started | 0 | | | | | | |

## Workspace record

Measured in Phase 0 on 2026-11-19. These replace the numbers in `AGENTS.md`.

- OS: Linux 6.1 VM, Ubuntu userland. 2 cores (Intel Xeon 2.90 GHz), 7.9 GB RAM (about 6.9 GB available when idle), 20 GB disk with 12 GB free at the start. No GPU.
- Node v20.20.2, npm 10.8.2. Python 3 with onnxruntime 1.32.0, opencv 5.1.0, numpy 2.5.5, scipy, Pillow 13.
- ffmpeg 8.0.1 with libx264, and ffprobe, both preinstalled.
- Browser: Chrome for Testing 147.0.7727.15 at `~/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome`, driven by playwright-core. Launch flags: `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --no-sandbox --disable-dev-shm-usage`. `SHOWCASE_CHROME` overrides the path.
- WebGL2 under software rendering (ANGLE on SwiftShader, Vulkan 1.3): MAX_TEXTURE_SIZE 8192, MAX_RENDERBUFFER_SIZE 8192, MAX_SAMPLES 4, 32 fragment texture units, point size 1 to 1023, 30 extensions including EXT_color_buffer_float, EXT_color_buffer_half_float, EXT_float_blend, OES_texture_float_linear and EXT_texture_filter_anisotropic. The full list is in `config/webgl-caps.json`, written by `npm run caps`.
- Codecs: `VideoEncoder` exists only on a secure context (http://localhost counts, about:blank does not). H.264 is reported as encodable: High, Main and Baseline at level 5.2 for all three formats (`avc1.640034` first choice), level 4.2 and 4.0 for master and preview. VP9, VP8 and AV1 are also reported. A real encode is proven in Phase 2 by `npm run proof`.
- Detached processes: a process started with `(set -m; cmd > log 2>&1 &)` outlived the step that started it and finished its work. Long renders run this way with a polled log.
- Sandbox agents: each got its own VM (4 cores, 7 GiB RAM, 18 GB free disk), cloned the repo shallow, pushed its own `agent/<folder>` branch and returned JPEG attachments. A 41 MB video arrived as an attachment from a sandbox agent, so render chunks can travel that way.
- Image limit: a 1400 px long edge arrives untouched. 1600 px is downscaled to about 1430 px. `critics.maxImageLongEdgePx` stays as it is.
- Memory: one spike set padded to `assetSets.full.maxSetMemoryMb` loads in about 20 s. Two such sets plus the 8192 sky held 2.86 GB of textures, the browser used 3.9 GB, and 3.9 GB of RAM was still free. Freeing a set gave its memory back (the total stayed flat across three travels). So two `full` sets fit in this VM and the harness uses `full` everywhere.

## Tool record

- Image models (through `generate_image`, 16:9): `seedream_5` returns 2816 x 1584 (JPEG bytes, re-encode before use), up to 10 reference images, the most cinematic and the model of all 18 approved images. `nano_banana_pro` returns 2752 x 1536 PNG, up to 14 reference images. `gpt_image_2_6_sunburst` returns 1672 x 941. One call takes about two minutes.
- Adding resolution: `python3 tools/ml/upscale.py` (Swin2SR Lightweight x2 through onnxruntime on the CPU, Apache-2.0, weights cached under `references/cache/models/`, never committed). On `references/approved/mars-close.jpg` to `assetSets.full.reliefWidth`: 351 s on two cores, 3.1 GB peak. Checked as `kit/06-ASSETS.md` says with `tools/ml/checkmoved.py`: flow median 0.006 px, 99th percentile 0.028 px, max 0.43 px, PSNR 50.6 dB, SSIM 0.9986. Native crops looked sharper than Lanczos with no new features. A general x4 model was tried and rejected because it smeared rock grain. Details in `tools/ml/MODELS.md`.
- Depth: `python3 tools/ml/depth.py` (Depth Anything V2 Small, Apache-2.0, onnxruntime CPU). On `references/approved/mars-close.jpg`: 10.5 s, 400 MB. Looked at the result: sky farthest, haze behind the wall, the near mesa nearest, clean cliff edges. Base and Large weights are not licensed for commercial use and are not used.
- Still to video: `generate_video` exists (16:9, 4 to 30 s, up to 1080p). Optional. Not used so far.
- Other tools: `search_images`, `fetch_image`, a text-only `llm`. No music or sound generator.
- App hosting: `deploy_website` makes a preview, `publish_website` puts a static folder at `<name>.pplx.app`. Limit 500 MB per site as a tarball.
- Agent model families that could see an image (each read a number from a test image): claude_opus_5_5, claude_sonnet_5_5, gpt_6_2_sol, gemini_4_carbon, kimi_k3, grok_4_7, pplx_computer_glm_5_3_1009. One listed family was not available. Critic juries mix the first, third and fourth.
- Progress notes: this workspace can share a file in the middle of a task. Text between steps may not always be shown, so each note is also written into the Session log.

## Pinned versions

Checked against each project's registry and release notes on 2026-11-19. Exact versions, no ranges, in `package.json` and `package-lock.json`.

| Package | Version | Use |
| --- | --- | --- |
| three | 0.187.0 | renderer |
| gsap | 3.15.1 | easing |
| mp4-muxer | 5.2.2 | Export |
| vite | 8.3.8 | build |
| typescript | 7.0.2 | types |
| vitest | 5.1.1 | unit tests |
| playwright-core | 1.65.1 | drives the pinned browser |
| tsx | 4.23.15 | runs the harness scripts |
| @types/three | 0.187.0 | types |
| @types/node | 20.19.43 | types |
| Chrome for Testing | 147.0.7727.15 | harness browser |
| ffmpeg | 8.0.1 | films and checks |

`.npmrc` sets `legacy-peer-deps=true`: a plain install crashed while resolving optional peers of vitest.

## Render budget

Phase 0, spike scene (one globe with an 8192 wrap map, shell atmosphere, 8192 sky, 60,000 star points, six-level bloom), this VM, 2 cores. Measured by `npm run budget`, pixel read back before the timer stops.

| Format | Seconds per sample | Fixed seconds per frame | Draft frame |
| --- | --- | --- | --- |
| preview 960 x 540 | 0.23 | 0.08 | 0.31 s |
| master 1920 x 1080 | 0.82 | 0.30 | 1.12 s |
| uhd 3840 x 2160 | 2.76 | 1.50 | 4.26 s |

- Starting a render (browser launch to page ready): 0.9 s. Loading the spike set: 5 s at `full`, 1.6 s at `web`. A set padded to the memory limit: about 20 s.
- The film has 3,255 slow frames and 2,145 fast frames. Samples for the whole film: draft 5,400, review 47,340, final 189,360.
- One judged still at `final`, master: a hold or terrain frame 13 s, a dive frame 53 s, plus the set load.

| Whole film | preview | master | uhd |
| --- | --- | --- | --- |
| draft | 0.5 h | 1.7 h | 6.4 h |
| review | 3.1 h | 11.2 h | 38 h |
| final | 12 h | 44 h | 147 h |

Phase 2, the blockout (stand-in sets, the real sky, stars, dust, lens chain), same VM, `npm run budget` on the `sun.hold` midpoint:

| Format | Seconds per sample | Fixed seconds per frame | Draft frame |
| --- | --- | --- | --- |
| preview 960 x 540 | 0.26 | 0.07 | 0.33 s |
| master 1920 x 1080 | 0.80 | 0.34 | 1.13 s |
| uhd 3840 x 2160 | 2.74 | 1.68 | 4.42 s |

- Loading a stand-in set: 3.6 s at `full` for the first, 1.0 s for the next. Textures: 69 MB per stand-in set, 179 MB for the sky at `full`. The browser held 1.3 GB with two sets.
- The blockout preview film at `draft` in `preview`: about 0.5 h on this VM. The whole film numbers in the table above still hold for the blockout. Measured again on Mars in Phase 3.

The first table is for the spike, which is far lighter than a finished stop. `AGENTS.md` measured 2.5 s per sample for a 300,000 triangle scene, three times this. Film renders above `draft` are split across sandbox agents by segment. One frame at `final` fits well inside `sandbox.chunkBudgetMinutes`, so no split-frame calls are needed. Measured again in Phases 2, 3 and 5.

## Judged frames

Computed in Phase 2 by `judgedFrames()` in `src/director/timeline.ts` from `film.hookSeconds` and `judged.fractions`. Frames are added, never removed.

| Frame | Segment | Stop | Why |
| --- | --- | --- | --- |
| 0 | sun.terrain | sun | frame 0 |
| 60 | sun.terrain | sun | hook |
| 90 | sun.terrain | sun | terrain |
| 247 | sun.rise | sun | rise |
| 360 | sun.hold | sun | hold |
| 495 | sun.travel | sun | travel |
| 615 | mercury.hold | mercury | hold |
| 717 | mercury.dive | mercury | dive |
| 870 | mercury.terrain | mercury | terrain |
| 1016 | mercury.rise | mercury | rise |
| 1072 | mercury.travel | mercury | travel |
| 1185 | venus.hold | venus | hold |
| 1287 | venus.dive | venus | dive |
| 1440 | venus.terrain | venus | terrain |
| 1586 | venus.rise | venus | rise |
| 1642 | venus.travel | venus | travel |
| 1755 | earth.hold | earth | hold |
| 1857 | earth.dive | earth | dive |
| 2010 | earth.terrain | earth | terrain |
| 2156 | earth.rise | earth | rise |
| 2212 | earth.travel | earth | travel |
| 2325 | mars.hold | mars | hold |
| 2427 | mars.dive | mars | dive |
| 2580 | mars.terrain | mars | terrain |
| 2726 | mars.rise | mars | rise |
| 2782 | mars.travel | mars | travel |
| 2895 | jupiter.hold | jupiter | hold |
| 2997 | jupiter.dive | jupiter | dive |
| 3150 | jupiter.terrain | jupiter | terrain |
| 3296 | jupiter.rise | jupiter | rise |
| 3352 | jupiter.travel | jupiter | travel |
| 3465 | saturn.hold | saturn | hold |
| 3567 | saturn.dive | saturn | dive |
| 3720 | saturn.terrain | saturn | terrain |
| 3866 | saturn.rise | saturn | rise |
| 3922 | saturn.travel | saturn | travel |
| 4035 | uranus.hold | uranus | hold |
| 4137 | uranus.dive | uranus | dive |
| 4290 | uranus.terrain | uranus | terrain |
| 4436 | uranus.rise | uranus | rise |
| 4492 | uranus.travel | uranus | travel |
| 4605 | neptune.hold | neptune | hold |
| 4707 | neptune.dive | neptune | dive |
| 4860 | neptune.terrain | neptune | terrain |
| 5006 | neptune.rise | neptune | rise |
| 5085 | ending.retreat | ending | retreat |
| 5235 | ending.lookback | ending | lookback |

## Look lock

To be written at the end of Phase 3: every locked setting, each technique that worked on Mars and each that did not.

## Decisions made by the Builder

- 2026-11-19, Phase 0. Harness scripts are TypeScript run with tsx. Asset tools (fitting, unprojecting, adding resolution, depth) and the rough cut are Python, run through npm scripts, because the image libraries are already in the workspace. Nothing in Python affects a rendered pixel at run time.
- Phase 0. The film is one world with a floating origin. Each stop has its own origin and rotation in that world. Everything is drawn relative to the camera, so precision is the same at every stop. A travel turns away from one body and approaches the next along its hold view axis from far enough that the next body starts under one pixel.
- Phase 0. Scene conventions: right-handed, camera looks down -Z, +Y up, every body has radius 1 at its stop origin. Wrap maps are equirectangular: u = lon / 360 + 0.5, v = lat / 180 + 0.5, lon 0 lat 0 faces local +Z. Each stop's fitted camera, sun direction and globe rotation live in `assets-src/<stop>/fit.json`.
- Phase 0. Each sample is rendered in linear light to a half float target, samples are averaged in a 32 bit float target, and bloom, tone curve and grade run once on the average. The alpha channel of the average carries body coverage for G5. The sky is drawn with the mid-shutter orientation in every sample.
- Phase 0. Only weights with a license that permits commercial use are installed for adding resolution and depth.
- Phase 0. Publishing: the kickoff prompt asks for the app to be published and forbids questions, so the Builder chose the address `grand-tour-film` itself. The host set visibility to Organization. Brandon can change that from the app card's Publish menu. A security review of the static build found nothing. The deploy step's automatic look check objected to the spike's stand-in picture, so validation is switched off for deploys while stand-ins are on screen.
- Phase 0. The published site asks for a sign-in, so the harness cannot read clips back from it. When a stop is finished its clip is also kept with `npm run keep -- --clips --stop <id>`, which is the case `AGENTS.md` allows, so a later task can rebuild the review page.
- Phase 0. `critics.maxImageLongEdgePx` unchanged after the image limit test.
- Phase 1. The rough cut was built by a supporting agent on its own VM (`tools/animatic.py`, dive spots in `tools/animatic-spots.json`, two runs gave the same file hash). The Builder checked it with G16 and by looking at one frame per segment. The label fades out over the last fifth of `ending.fade` so the last frame is pure black.
- Phase 2. Supporting agents, each on its own VM and branch: `agent/tools-stills` (sheet, seq, crops, compare, pack, keep), `agent/tools-film` (film, clip, stress, measure, gate checks G5 G6 G8 G9 G13 G15 G17), `agent/capture-export` (Export mode and proof), `agent/assets-shared` (the sky glow map), `agent/assets-fit` (sphere and camera fits, unprojection). The Builder writes the engine, the director, the stand-in sets, the modes and the diagnostic views, and integrates.
- Phase 2. The world has one fixed Sun direction. Each stop has a frame (a rotation and an origin) chosen so the Sun sits where that stop's approved hero image needs it. The next stop is placed far along its own hold view axis, so it starts under one pixel and grows into its hero framing. Code: `src/director/film.ts` (the film), `src/director/moves.ts` (one stop's moves), `src/stops/<id>/plan.ts` (that stop's numbers) and `src/stops/<id>/fit.json` (a short copy of `assets-src/<id>/fit.json`, so a new fit changes the stop's hash).
- Phase 2. Moves. `hold`: the fitted camera at the midpoint, with a slow orbit arc and a push. `dive`: a blend from the hold into a path that falls on a logarithmic altitude curve toward the spot, which turns with the globe. The view changes to the terrain at the center of the cover and the leftover height and distance decay into the terrain move. `rise`: its own line, not the dive backward, ending on an exit pose that keeps drifting outward. `travel`: turn first, then approach on a logarithmic curve. `sun.travel`: pull straight back until the Sun is the size it has at Mercury, cross-fade the body to the far Sun disc, then turn to Mercury.
- Phase 2. The Sun seen in the sky can sit in a different direction from the light that shades a body. Mercury's and Neptune's approved hero images show the Sun in frame where the terminator alone would not put it. The image wins.
- Phase 2. Stand-ins are unlit. The approved pixels carry their own light, and they are passed through the inverse of the tone curve so they come out of the lens chain as approved. Only the ending relights Neptune. Stand-in wrap maps are 4096 and 2048 wide, not the final sizes. Stand-in terrain is the approved close image on a plane, mirrored past its edges so no edge shows while the camera moves. Covers are a plain haze in the stop's color.
- Phase 2. Diagnostic views: `texels` writes red = texels per pixel divided by 2 (clamped) and green = 1 where the pixel counts for G13, with no lens or grade. `nograin` is the finished frame without grain and dither, for measuring. `ungraded` is the frame before lens and grade.
- Phase 2. Mercury's Sun radius in the sky is 8.8 degrees, measured from the circle fitted to the Sun in the approved hero image. The radius falls at every stop after it (the numbers are in each stop's `plan.ts`).
- Phase 2. Stand-in wraps for Mars and Jupiter paint Phobos and Io out of the unprojected image (a neighboring patch cloned seamlessly over the fitted circle), because a stand-in sphere takes each moon's place.
- Phase 2. Stars and dust write the far depth, so the near plane never clips them. Before this, travel frames were black.
- Phase 2. The far Sun disc dims as it grows in the sky (`clamp(sqrt(0.02 / radius), 0.4, 1)`), with a wide corona of 0.035, so Mercury's Sun is a glare and not a white card.
- Phase 2. In a travel the next body is drawn as a bright point with a small glow and streak while it is under a few pixels (size `max(15, 30 * height / 1080)` pixels, brightness 5 to 14 times its tint), so it reads against the stars before it becomes a disc.
- Phase 2. Stand-in rings narrower than a fifth of their radius are drawn as six faint thin lines. Neptune's fitted ring has no width, so it is given 2.5 percent each side.
- Phase 2. The stand-in terrain plate has overscan, so the terrain move never reaches the end of the image. The judged terrain frame is a slightly tighter crop of the approved close image. The finished reliefs in Phases 3 and 4 remove that.
- Phase 2. Dive entry offsets were cut to 55 to 60 percent. Rises use `sine.out`, so the pull-out is spread across the segment and not spent in its first frames. Earth leaves on azimuth -16.
- Phase 2. The lookback: Neptune 31 degrees off the Sun line, aim 8 degrees, distance 9, roll 13, lens 34. Neptune is relit there so it shows as a crescent.
- Phase 2. The menu opens with no slide. Under software rendering the slide never advanced and the menu stayed off screen.
- Phase 2. `cut/SHOTS.md` is written by `npx tsx tools/shots.ts` from the config and each stop's plan, so it cannot drift from the code.
- Phase 2. The sky glow map from the star map agent had not arrived when the blockout rounds started. The blockout uses the seeded stand-in sky. The real map is integrated when it lands, in Phase 2 or 3.

## Open items

None yet. One entry per issue left open by a round limit: the stop, the frame, the critic and its words, what was tried, what to try next.

## Running jobs

None. One entry per long job while it runs: the command, the frame range, the log file, the VM, when it started.

## Rounds

One line per round, written when the round starts: number, phase, stop. Scores and what changes next are added when it ends.

- Round 1, Phase 2, blockout, whole film. R4 blockout.

## Final scores

To be written by the record round in Phase 6.

## QA results

To be filled at the end of Phase 6.

## Failed QA items

None yet.

## Push log

- The kit was pushed by the planner on 2026-11-19.
- 2026-11-19: Builder push test, Phase 0 step 1.
- 2026-11-19: Phase 0 scaffold, harness, spike, records. Merged `agent/tools-ml`.
- 2026-11-19: Phase 0 gate.
- 2026-11-19: Phase 1 gate. Merged `agent/animatic`.
- 2026-11-20 UTC: Phase 2 engine, director, stand-in sets, modes, menu. Merged `agent/tools-stills`, `agent/capture-export`, `agent/assets-fit`, `agent/tools-film`.

## Session log

One entry per task: when it started, what it did, where it stopped.

- Task 1, started 2026-11-19 (America/Boise evening). Kickoff prompt without the Mars approval line. Read AGENTS.md and the kit in order. No addenda. Started Phase 0.
  - Progress note, Phase 0 gate: the engine scaffold, the harness and a spike scene work under software rendering, and every Phase 0 check is green. App: https://grand-tour-film.pplx.app, review page at /review.html (empty until the rough cut lands). Next: the rough cut, then the engine and the blockout of all nine stops. Open: none.
  - Progress note, rough cut: `out/roughcut.mp4` is pushed and on the review page. It is made only from the 18 approved stills and follows `segments` frame for frame, so Brandon can judge the pacing. App: https://grand-tour-film.pplx.app/review.html. Next: the engine and the blockout of all nine stops. Open: none. The build is continuing.
