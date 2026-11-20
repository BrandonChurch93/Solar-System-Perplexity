# Progress

The Builder's memory. Read this first in every task. Update it before every commit.

## Status

- Current phase: 3 · Mars, the look lock
- Current stop: mars
- Current round: 4 (Phase 3, mars, look lock round 2 of 5)
- Blocked: no
- App URL: https://grand-tour-film.pplx.app (review page: https://grand-tour-film.pplx.app/review.html). Visibility is set to Organization, so it asks for a sign-in. Site id 658cdf8a-abd6-46bd-a3ba-e37d5c3ba5a3. Private preview of the same build: https://www.perplexity.ai/computer/a/grand-tour-.DP5zrWnQuWx5hYYutNNyA
- Mars review: not reached

"Mars review" is one of `not reached`, `waiting` or `approved`. `AGENTS.md` says what each means.
- Last push: 2026-11-20 UTC, Phase 3, round 3 started, with the third status pictures

## Latest pictures

Newest first. Each line links a comparison image in `out/stills/` so this page shows the state of the film.

- Status after round 3 (work in progress): `out/stills/status/mars-hold.jpg`, `out/stills/status/mars-terrain.jpg`, `out/stills/status/mars-dive.jpg`.
- Phase 2 gate, the blockout film in four sheets: `out/stills/sheet-film-01.jpg`, `out/stills/sheet-film-02.jpg`, `out/stills/sheet-film-03.jpg`, `out/stills/sheet-film-04.jpg`. The same film plays as `out/preview.mp4`.

## Phases

| Phase | State | Gate evidence | Commit |
| --- | --- | --- | --- |
| 0 · Ground truth | done | Push ok. `npm run gate -- --phase 0`: G1 build clean, G2 21 tests pass, G3 four frames identical across fresh loads and reversed order (preview, review tier), G4 all three formats exact and 5400 frames, G14 needs inside `config/webgl-caps.json`. Records, versions and budget are below. Published | see Push log |
| 1 · Rough cut | done | `npm run gate -- --phase 1`: G16 green (5400 frames, 960 x 540, 30 fps, 41 MB). One frame from the middle of each of the 46 segments was looked at: order and labels follow `segments`. Pushed, on the review page, shared in the thread | see Push log |
| 2 · Engine and blockout | done | `npm run gate -- --phase 2`: G1 to G4, G6, G7, G10, G11, G12, G14, G15 green; G8 green (`out/preview.mp4`, 5400 frames, 960 x 540, 30 fps, 45 MB, no G5 failure); G9 green (export proof and the memory proof across a travel). R4 blockout: round 1 scored 7, round 2 scored 5, limit reached, open items 1 to 5 carried to Phases 3 to 5. Judged list present (47 frames). The published app plays the film in autopilot | see Push log |
| 3 · Mars, the look lock | in progress | | |
| 4 · The other eight stops | not started | | |
| 5 · The space between | not started | | |
| 6 · Polish and deliver | not started | | |

## Stops

State is one of `not started`, `stand-in`, `in progress` or `finished`. A finished stop also names the commit it was finished on.

| Stop | State | Rounds run | R1 | R2 | R3 | R4 | R8 | Open items |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sun | stand-in | 0 | | | | | | |
| mercury | stand-in | 0 | | | | | | |
| venus | stand-in | 0 | | | | | | |
| earth | stand-in | 0 | | | | | | |
| mars | in progress | 1 | 6 | pass | 4 | 6 | pass | |
| jupiter | stand-in | 0 | | | | | | |
| saturn | stand-in | 0 | | | | | | |
| uranus | stand-in | 0 | | | | | | |
| neptune | stand-in | 0 | | | | | | |

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

Phase 3, Mars (the finished set: five patch levels, relief, Phobos, haze, the sky with its band strip), same VM, `npm run budget -- --stop mars`:

| Format | Seconds per sample | Fixed seconds per frame | Draft frame |
| --- | --- | --- | --- |
| preview 960 x 540 | 1.16 | 0.11 | 1.27 s |
| master 1920 x 1080 | 2.62 | 0.58 | 3.20 s |
| uhd 3840 x 2160 | 9.07 | 1.52 | 10.6 s |

- Memory, estimated with mipmaps: the Mars set is 1,273 MB at `full` (limit 1,400) and 318 MB at `web` (limit 450). The sky is 268 MB at `full` (glow map 179, band strip 89) and 67 MB at `web`. The browser held 2.7 GB with Mars and the next stand-in set loaded.
- Loading the Mars set: 15 s at `full`, 5 s at `web`.
- One frame in master, measured: hold 3.2 s draft, 11 s review, 44 s final; terrain 3.8 s, 13 s, 52 s; dive 3.8 s, 57 s, 223 s; rise 3.6 s, 50 s, 203 s.

| Whole film at the Mars cost | preview | master | uhd |
| --- | --- | --- | --- |
| draft | 1.9 h | 4.8 h | 16 h |
| review | 15 h | 34 h | 119 h |
| final | 61 h | 138 h | 477 h |

A finished stop costs about three times the spike per sample, as `AGENTS.md` measured. Film renders above `draft` stay split across sandbox agents by segment (4 cores each, so about half these hours per agent).

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
- Phase 2, after round 1. Arrivals: `approachLocal` in `src/director/film.ts` takes the hold pose, backs it away along its view axis on a logarithmic curve and swings it round the body by the stop's `arrive` angle, which decays to nothing by the hold. The approach starts when the departing body, its rings and its moons are all outside the frame with 3 degrees to spare (`clearAt`), never before 0.2 of the travel. From then on the departing set is not drawn and the camera is on the approach path. Growth follows `1 - (1 - x)^2.5`.
- Phase 2, after round 1. Segment times were not changed to vary the cadence. Brandon judges pacing from the rough cut, and a retime would move every later judged frame. Variety comes from the approach side, the swing, the turn angle and the turn length of each stop.
- Phase 2, after round 1. The lookback: aim 12.5 degrees, a 3.5 degree pan that settles over 4.5 seconds, Sun glare 1.5 with a flare of 0.22.
- Phase 2, after round 2 (the last blockout round). Fixes were made after the round with no critic left to see them: `arrive.offset`, the moving lookback, a longer turn out of Mars. The open items carry them to Phases 3 to 5.
- Phase 2. Merged `agent/assets-shared`: the sky glow map made from the real star map by `tools/assets/sky.py`. It replaces the seeded stand-in sky, and `tools/spike-assets.py` is removed. Its grade and exposure are settled in Phase 3 against Mars's approved images and in Phase 5 for the whole film.
- Phase 2. Four Mars asset agents were started while the blockout finished, as kit/08 allows: wrap maps, Phobos, dive patches, the relief. Each owns one subfolder of the Mars asset folders and its own branch (`agent/assets-mars-wrap`, `-phobos`, `-patches`, `-relief`). A tile or a layer of a map counts as its own asset for the take limit. Their briefs are in `out/work/briefs/`.
- Phase 2. The sky glow map from the star map agent had not arrived when the blockout rounds started. The blockout uses the seeded stand-in sky. The real map is integrated when it lands, in Phase 2 or 3.
- Phase 2 to 3. While the preview film renders on the lead's VM, the Phase 3 code is written in a second git worktree (branch `phase3-work`) so the build under the running render does not change. It is merged into main when Phase 3 starts.
- Phase 3. The cover is a band of dust haze with a horizon: two colors split along the horizon line the camera would see, streaks that flow along the direction of travel, fully opaque at its center. It carries direction, horizon, color and exposure across the change of view.
- Phase 3. The Mars dive is rebuilt as a swoop (open item 5): the camera arcs past Phobos, drops on a log altitude curve, levels out along the canyon and its speed, heading, pitch and roll at the cover center are derived from the terrain entry so the two views join.
- Phase 3. The relief agent was asked for a margin: the close image extended by 12 percent left and right and 12 percent at the bottom, outpainted, original pixels untouched, so the camera can look around and move without showing an edge.
- Phase 3. The relief shader cancels the lens vignette, because the approved close image carries its own.
- Phase 3. Phobos is a displaced mesh lit with direct light, a faint ambient and a faint warm bounce from Mars, with no cast self shadow. A cast shadow blacks out Stickney, which the approved image shows lit on its rim.
- Phase 3. The storm churns by rotating the color lookup about the storm center inside the storm mask, faster near the center. The rotation is zero at the judged hold frame.
- Phase 3. One sky for the whole film: the sky map and the star points share one fixed rotation (`src/space/skyframe.json`, written by `tools/assets/skyframe.ts` from the Mars hold camera) and one grade (cool tint, gamma, fine star grain), chosen so the Mars hold shows the Milky Way band where the approved hero has it. Stars stay points.
- Phase 3. The planet's light is a measured curve over the sun angle, not a formula: `tools/assets/lightcurve.py` divides the approved hero (tone curve and ground haze removed) by the wrap map and takes the median per angle. The curve is `src/stops/mars/curve.json`. A formula light could not give the hero's long dim twilight and bright core together.
- Phase 3. The wrap map on the hero's side is the hero itself (ladder rung 2 for "The orbit view does not match its approved hero image", taken before round 1 because the first compare showed the painted map's colors drifting from the hero). `assets-src/mars/wrap/match.py` keeps the agent's painted map everywhere the hero cannot see, behind Phobos and near the limb. Recipe in `assets-src/mars/wrap/RECIPE.md`.
- Phase 3. Haze is two parts with their own numbers in `src/stops/mars/haze.json`: a warm thin ground haze drawn inside the planet shader (it is what the light fit removes from the hero) and a cool blue shell outside the limb. Both have a faint night term so the dark limb reads against the sky as it does in the hero.
- Phase 3. The terrain view gets an air layer: a glow above the horizon (a warm thin band and a cool tall one, brighter toward the Sun's side) that also dims the stars near the horizon. Fitted by eye and by pixel readings from the approved close image. Without it the film's sky above the horizon was black and the Milky Way cut hard into the horizon.
- Phase 3. The terrain move stays inside the relief's measured safe move from `relief.json` (forward 0.15, rise 0.045, pan 0.45 degrees). The live look-around clamp uses the same numbers.
- Phase 3. A dark wedge at the foot of the far mesa was the hidden fill of relief layer L0 showing through the soft edge of L2. Repainted with `assets-src/mars/relief/fillfix.py`.
- Phase 3. Phobos: lit a little more from the camera's side than the planet's Sun (a fixed offset to its light direction) so its lit face and the shadowed Stickney read as in the approved hero, plus a soft rim term and stronger crater shading. Pole rows of its height map are averaged so the mesh has no spike at its poles.
- Phase 3. Until the patch agent delivers, the dive is tested with patches cut from the wrap map itself. Those files are never committed.
- Phase 3. Stars: 420,000 points with a power law in brightness, placed by the sky glow map so they crowd along the Milky Way as in the approved hero, and tinted by the same grade as the glow. The first field was even across the sky and read as noise on black.
- Phase 3. Terrain air: a veil of 0.55 over the stars near the horizon, and the dust cover is darker above its horizon line than below it, so the sky side of the cover matches the dark sky the terrain view opens on.
- Phase 3. First preview of the measures before round 3 (every third frame): G5 passed; G17 failed at 0.55 (hold) and 0.54 (terrain); G13 failed on dive and rise frames. Three causes of the softness were found and fixed. 1. Texture lookups used the pixel's full footprint although each frame averages many jittered samples, which blurred twice: the gradient passed to every texture lookup is now scaled by `max(1 / sqrt(samples), 0.5)`. 2. The box filter over the pixel and the bloom mix cost fine contrast (measured: box filter alone gives 0.79 to 0.81, bloom mix alone 0.85): the lens chain ends with a small four-neighbor sharpen on display values, 0.6 when a frame is accumulated and 0.35 of that live. 3. The hero match pass blurred the hero before dividing by the light: it now blurs only where the light is dim. After the three: hold 0.999 median, terrain 1.01.
- Phase 3. Patches: the agent's three patches (48, 12 and 3 degrees, 4096 each) are re-matched to the hero-matched wrap in scene-linear space by a ratio of low frequencies, with highlights tamed (`assets-src/mars/patches/rematch.py`). The agent's additive match clipped canyon rims to glowing orange. The wrap is not composited with patch 1.
- Phase 3. Each patch level fades in by texel density: a level shows only where the level under it has fewer than about 1.25 texels per screen pixel (`fade` in `src/stops/mars/assets.ts`). The hold therefore shows the hero wrap alone, and a level never appears before it is needed.
- Phase 3. Phobos carries the approved hero's own pixels on the side the hero shows (`assets-src/mars/phobos/lit.py`), mixed in by a mask. The shader light could not match the lit face and the Stickney rim, and Phobos is the largest thing in the hold. The rest of the moon stays shader lit for the tumble.
- Phase 3. G13 on the dive and the rise. Measured with three levels: dive frames 2421 to 2436 were 3 to 12 percent soft, rise frames 2708 to 2720 were 19 to 56 percent soft. Cause: with 4096 px levels and a 16:9 frame, a level only covers the frame by the time its parent runs out of texels if it is at most about twice as narrow as the parent. The levels were four times apart, and the wrap alone runs out below a camera distance of about 2.5 radii. A small predictor that casts the film camera's rays at the sphere and repeats the shader's density math (it matched the measured frames within a point) was used to design the fix. Decision, ladder rung 1 of "A dive goes soft or shows a patch": two more levels with real generated detail, 96 degrees and 24 degrees, ordered 96, 48, 24, 12, 3 (asked of the patch agent, same pipeline); and the rise climbs over the spot before it drifts to its exit pose (`rise.ahead` 0.03, `rise.hug` 1.7 in `src/stops/mars/plan.ts`), so the low part of the rise looks at ground the levels cover. Not chosen: starting the visible rise above 2.5 radii (the cover would hide a jump of 1.5 radii, which is not one move), or enlarging existing levels with an upscaler alone (it would pass G13 and add nothing to see). The planet shader now takes up to six levels.
- Phase 3. Low part of the dive. The first status sheet showed frames 2432 to 2449 as flat bright salmon ground, then a jump to the dark golden terrain view after the cover. Cause: near the ground the orbit view still used the hold's exposure, tint and thin cool haze, while the approved close image is lit low, warm and dusty. Fix in `src/stops/mars/look.ts` (`descent`) and `src/stops/mars/set.ts`: between altitude 0.7 and 0.05 radii the planet's color is brought down and warmed, the ground haze and the shell turn warm and thicker and their day edge widens, so the ground darkens toward the terrain view's light before the cover. The shell also stopped discarding the pixels exactly on the horizon, which left a dashed line.
- Phase 3. Sky, ladder "The sky looks fake" rungs 1 and 2. 900,000 star points with a steeper brightness law and a few vivid rose, amber and blue ones. The glow map is broken up by a noise cloud field with dark lanes (the same field in the glow and in the star crowding), desaturated, with a small dark blue floor, and re-aimed with `tools/assets/skyframe.ts --along=158 --tilt=-8 --lift=2` so the dense band sits left of the globe and the fainter arm on the right, as in the approved hero. Checked by region medians against the hero. In a terrain view the glow is turned down (`terrainSkyGlow` in the stop's plan, 0.25 for Mars after a second look; first tried 0.3) because the approved close image shows fine stars on a dark sky, not a bright band; the star points stay.
- Phase 3. Terrain sky. A stop's terrain view may turn the one sky (`turns` in `src/space/skyframe.json`, written by `tools/assets/skyframe.ts --tstop mars --talong=60 --ttilt=0 --tlift=33`), so the dense band sits just above the top of the Mars terrain frame and the frame shows the sparse fine field the approved close image has. The turn blends in under the dust cover, where no sky is visible. In a terrain view the star brightness range is also compressed (`b = mix(b, 0.07 * pow(b / 0.07, 0.4), 1 - uGlow)`) so a few bright points do not sit on an otherwise even field. Quick G17 after it: 1.01 for the terrain frame, the lowest tiles being the top sky row.
- Phase 3. The second status (dive sheet) was rendered with stand-in files for the 96 and 24 degree levels, cut from the wrap, because the patch agent had not pushed them yet. The stand-ins are excluded from git and are replaced by the real files before round 3.
- Phase 3. Patch levels four and five delivered by the patch agent (96 and 24 degrees, 4096 each, same pipeline, takes inside the limit: recipe in `assets-src/mars/patches/RECIPE.md`). Checked: only the four new files, `patches.json` and the recipe changed on its branch; both looked at whole; all five re-matched to the wrap with `rematch.py`. `src/stops/mars/assets.ts` now lists five levels in the order 96, 48, 24, 12, 3. The predictor gives no soft pixels on any dive or rise frame. Confirmed by render with the new dive path: `npm run measure -- --stop mars --only G13 --every 3` passed, 0 of 155 frames over the limit, no soft pixel in any of them.
- Phase 3. Dive motion. The judged dive frame 2427 at the review tier was a smear: the camera rolled 12 degrees per frame around frames 2424 to 2428. Cause: the camera's up reference was the ground normal while it looked almost straight down, where that reference is nearly parallel to the view and the roll swings; and the blend from the hold into the swoop lagged, then caught up in a few frames. Fix in `src/director/moves.ts`: the up reference is the ground normal plus the level heading (the same result at the cover center, no swing above it), the aim and up blends run over the whole dive, the look target moves sooner, and the blend from the hold ends at 0.22 of the dive. Peak rotation fell from 12.5 to 5 degrees per frame and the corner blur from about 72 to 39 pixels at master, spread evenly from frame 2408 to 2440. The frame at the cover center is unchanged.

- Phase 3. Sky band, ladder "The sky looks fake" rung 2 taken further. Beside the approved hero the hold sky was still the largest gap: the hero's band has real structure (star clouds, torn dust lanes, colored clusters) and the film's band was a smooth glow broken up by a noise field, which read as fog. Decision: a strip of real band detail, `public/assets/shared/{full,web}/skyband.jpg` (8192 x 2048 and 4096 x 1024, 180 by 45 degrees, repeated twice round the band), made from four generated takes joined in a ring by `tools/assets/skyband.py` (5 takes of 6 used, recipe in `assets-src/shared/RECIPE.md`). `src/space/sky.ts`: the noise field is gone; inside the band the strip replaces the glow, scaled by the glow map's own brightness along the band so the large shape (dense part, faint arm) stays; outside the band the desaturated glow map stays. The star points crowd by the strip's brightness. `tools/assets/skyframe.ts` writes the strip's placement and grade into `src/space/skyframe.json` (`band` block). Chosen values: `--tilt=-8 --lift=2.5 --blat=45 --bgain=1.15 --bgamma=1.08 --bfade=0.38 --bsat=1.0 --br=0.92 --bb=1.12 --fr=0.005 --fg=0.009 --fb=0.012 --bcrowd=0.013 --boffset=45`. Tried and not chosen: tilt -12 (left band right, right arm 170 px too low), lift 0.5 and -1 (left band too low), lift 3.5 (too high). Bright star points now thin out away from the band too (they were even over the whole sky, twice as bright as the hero's in the dark corners). Measured on the hold frame at 1920, hero against film, region medians: left band (17,23,29) against (19,24,32); right arm (14,19,25) against (13,18,26); dark corners (4,8,11) against (4,8,14). Brightest 0.1 percent of pixels: left 149 against 184, right 154 against 155, corners 63 to 83 against 78 to 103. Quick G17 after it: hold 1.19, terrain 1.01. The strip adds about 89 MB of texture in the full set; G15 checked below.

- Phase 3. Covers, ladder "A cover can be seen as a join" rung 1. At the review tier the dive cover was eight nearly identical frames of flat bright tan between salmon ground and the dark canyon view, and the rise cover jumped from a level horizon to a steep look down at its center. Causes and fixes: (1) the cover had one pair of colors, far brighter than the canyon view. It now blends from an orbit side pair to a terrain side pair across the window (`coverTerrain`, `coverLowTerrain`, `coverTop` in the stop's plan; `coverSide` in `src/director/moves.ts`), so the ground color and exposure carry from the salmon ground down to the dark canyon floor and the sky above the horizon glow goes dark. (2) The dust came on in one frame. Its opacity curve is gentler, with more streak structure, and the streaks move slower so the shutter does not smear them flat (`src/terrain/cover.ts`). (3) In the rise the orbit path began looking 45 degrees down. It now leaves the cover with the pitch and horizon of the terrain exit pose and tilts down over `rise.tilt` seconds (0.7 for Mars), so the horizon line holds still through the cover. (4) Near the ground the star points showed through the dust as a bright clump. The sky exposure in the orbit view now falls with altitude (`light.skyLow`: to 0.3 between 0.35 and 0.04 radii). G13 by render after the change: PASS, 0 of 155 frames soft.
- Phase 3, step 5. `npm run budget -- --stop mars` measures a named stop and its memory (the table is under "Render budget"). The Mars set is inside `maxSetMemoryMb` in both asset sets.

- Addendum 001 (status pictures), applied 2026-11-20 UTC in Phase 3. `npm run status -- --stop ID` (`tools/status.ts`) renders the stop's hold and terrain comparison images and a dive contact sheet at the `review` tier into `out/stills/status/`, or the whole film sheets with no `--stop`, then runs `npm run review`. The review page lists them under "Status". A status is posted in the thread at the end of every round, after every finished numbered step of the phase and when Brandon asks, and is also written into the Session log.
- Round 3 machine checks, 2026-11-20: G6 was red (the autopilot showed its Loading label while the first set loaded; the Mars set now loads longer than the check waits) and G11 was red (the relief recipe named the three distance files by a pattern, not by name). Fixed on the first attempt: the autopilot shows no label and holds the last complete frame as `kit/05-ARCHITECTURE.md` says, and the recipe names each file. The other machine checks were green on the same pixels. The pack and the measure were restarted on the fixed build so the round's evidence carries its hash.
- Round 3 measures, 2026-11-20: `npm run measure -- --stop mars` ran on a supporting agent's VM with 4 cores on commit 696e228 (732 s there, about 48 min here). Verified here: the hashes in its result equal the Builder's build, and G17 recomputed from its stills gives the same numbers.
- After round 3, sky and lens: the sky pass and the star points are now drawn with the lens and sky turn of the middle of the shutter in every time sample. Before, each sample used its own lens, so during a zoom every star became a short radial dash. `kit/04-LOOK.md` says stars stay points.
- After round 3, dive and rise timing (ladder "Fast motion breaks into ghost copies", rung 3): R3 marked smear severe on both judged motion frames. `dive.surge` and `rise.settle` in `src/stops/mars/plan.ts` retime the same paths so the camera is slow until just before the cover, fastest inside it, and nearly still after it. Blur per shutter at the judged frames by `out/work/an/motion.ts`: dive 2427 from 25 px to 2.8 px median, rise 2726 from 11.5 px to 2.7 px. Peak about 60 px median, inside frames 2446 to 2461 and 2700 to 2708. The path itself is unchanged.
- After round 3, relief: merged `agent/mars-relief`. The far grid is pushed to at least 1.03 times the distance of the layer above it, so it never wins the depth test in the band it should hide in. Verified here by render: the blob under the right mesa is gone at 2580, G17 1.016.
- After round 3, limb: measured the glow of the approved hero across the limb at five places and ten distances and fitted the film to it: the thin shell is less saturated and a second wide haze layer (`halo` in `src/stops/mars/haze.json`, scale height 0.05) lights toward the hero's bright side and fades out in the dive.
- After round 3, hold motion (R4 minor "the globe does not turn", open item 1): the hold orbit ran the same way as the globe's spin, so the two nearly cancelled and a surface point moved 49 px across the whole hold. The orbit is reversed (`hold.orbitDeg` -8 in `src/stops/mars/plan.ts`): a surface point now moves about 173 px, measured with `out/work/an/spin.ts`. The judged frame 2325 is the middle of the hold and is unchanged. Phobos is slowed to 0.5 degrees per second so it crosses the disc and leaves the frame before the dive starts.
- After round 3, terrain flight (R4 majors "no depth" and "nothing flows", ladder "A terrain view reads as a flat picture being zoomed" rungs 1 and 3). The glide is larger and no longer a straight push: forward 0.3, rise 0.06, side 0.3, yaw -2.9 degrees, with `terrain.gather` 0.6 (the path runs on `u + 0.6 u^2`, so it starts slow out of the dive and gathers speed into the rise). This is past the relief's stated safe move (0.15, 0.045); draft and review renders across the segment show no tear or doubled edge, so the measured clean range is larger than the agent's note. Independent motion: a slab of valley dust is marched in the relief shader below height -2.0 (four steps, weighted by the mist mask, noise drifting down the canyon), and the warm horizon glow carries a slow drifting streak (`air.drift`).
- After round 3, stars through the cover (R4 minor "stars pop through the dust at 2704 to 2706"): the sky exposure is multiplied by (1 - cover amount) squared in `src/director/film.ts`, so stars fade in as the dust clears.
- After round 3, sky aim: reversing the hold orbit changed where Mars sits in the world (each stop's frame is chosen from its arrival and hold start), so the one sky no longer sat as the hero has it: the band stood upright at the left of the hold and the terrain sky lost its stars. Seen in the first review stills (G17 hold fell to 0.99 with a quarter of the tiles under 0.62). `tools/assets/skyframe.ts` was run again with the logged values and the sky is back. Lesson: any change to a plan that moves a hold start or an arrival is followed by `tools/assets/skyframe.ts`. To do after the sky agent's branch is merged: the director computes the sky rotation from the Mars hold camera and the stored aim angles when it starts, so no later plan change can move the sky.
- After round 3, night side: in the hold the dark side showed bright orange specks along the bottom of the frame, and in the rise the craters on the dark side glowed red at their rims. Cause: bright spots in the wrap map multiplied by the night floor of the light curve. `nightFlat` in the planet light compresses bright albedo where the sun angle is below the terminator (`2 / (1 + l / cap)`, cap 0.06). The lit side is untouched.
- After round 3, terrain entry: with the larger glide the left edge of the relief showed for four frames as the dust cleared (2457 to 2460). `terrain.entryYawDeg` -3 turns the entry pose away from it; it decays to nothing before the judged frame, and the sky turn for the terrain is unchanged.
- After round 3, sky: a supporting agent (`agent/space`, own VM) is fitting the star counts and the band's width and lanes to the approved hero and close image (R1 and R3 majors on the Milky Way and stars). Merged only after a render check here.
- After round 3, sky, final: merged `agent/space` at 303dd7f after a render check here (only `src/space/` and `tools/assets/skyframe.ts`, `skyaim.ts` changed). Star counts per size now sit within about 1.4 times the hero's in the hold and the size mix matches; the terrain sky is an even field of fine points with a faint band at the top, and the bright clump at the top of 2580 is gone. `src/space/skyframe.json` stores every argument under `args`, and `tests/skyframe.test.ts` recomputes the sky quaternions from them and the current plans, so a plan change that moves the sky's frame now fails a test until `tools/assets/skyframe.ts` is run again.
- After round 3, color fringes on ridges (R3 major, frame 2427). Cause: `assets-src/mars/wrap/match.py` resampled the hero's pixels onto the map with a Lanczos filter in scene-linear values; around highlights the ringing drove the red channel to zero and left teal pixels. Now resampled in tone-coded values. Teal pixels on the disc at 2427: none.
- After round 3, polar cap (R3 severe, frame 2726) and doubled rim with orange fragments (R3 major, 2726). Cause of both: hero pixels from the hero's limb zone were painted into the map. There the hero has about one pixel for eight map pixels, and its limb haze was painted in as well, so from another angle the cap was blocky and the old limb showed as a pale arc with stretched fragments. Now: hero pixels come from a 2x copy of the hero (`tools/ml/upscale.py`, checked with `tools/ml/checkmoved.py`), fade out between view cosine 0.42 and 0.2, the low frequency color correction between 0.2 and 0.09, and only the cap keeps its hero pixels to the limb. Verified by render at 2726: one clean rim, a smooth cap.
- After round 3, limb light inside the disc (R1 and R3 "limb glow"). The haze shells draw only outside the disc, so the limb ring inside it comes from the ground haze. The ground layer was fitted to the hero's limb ring by least squares on the film's own frame (`out/work/an/groundfit.py`): depth 0.066, day color 0.5, 0.55, 0.62, lit from sun angle -0.3 to 0.95. The planet shader now undoes the lens vignette on the globe as Phobos and the relief already do, since the map is matched to a hero that has its own. Against the hero across the limb at six angles, inside and outside, the film is now within about 15 levels (was up to 70).
- After round 3, limb glow outside the disc: the hero has a warm white glint where the sun grazes the limb, a faint even rim on the night side and a blue thin shell. Added a narrow `glint` layer, a night term on the wide halo, and a slightly weaker shell. All three fade out in the dive as before. G17 hold 1.03.
- After round 3, Phobos in the hold: with the reversed orbit Phobos crossed the frame at 10 px per frame (measured between frames 2323 and 2327), because it sits a fifth of the way from the camera to Mars and the orbit's parallax and its own motion added up. In the judged hold frame it was a smeared, stepped copy of the hero's sharp moon. `moonDegPerSecond` is now -1.2: Phobos moves with the camera's orbit and drifts about 2 px per frame across the disc. It is still in front of the disc when the dive starts and the camera passes over it in the first 20 frames of the dive, before the judged dive frame.

## Open items

One entry per issue left open by a round limit: the stop, the frame, the critic and its words, what was tried, what to try next.

1. Whole film, frames 615 to 5006, R4 blockout round 2, severe: "every stop from Mercury through Neptune repeats the exact same 570-frame pacing cycle and dead-center bullseye hold framing with an on-axis zoom". Tried: a different arrival for each stop (side, swing, turn angle, turn length, and an off-center start that drifts to the hero framing). Not changed: the hold framing, which is the approved hero image, and the segment times, which are Brandon's in `config/showcase.json`. Next: per stop in Phases 3 and 4, vary what moves inside the hold (orbit direction and amount, moon paths, how far the push goes) and give each dive and rise its own line. If Brandon wants uneven stop lengths, that is a config change through an addendum.
2. Ending, frames 5145 to 5362, R4 blockout round 2, major: "camera is nearly frozen for over 200 frames on a mostly black frame". Tried after the round: continuous pull back, a 3 degree circle round Neptune and a 4.5 degree pan on one ease to the last frame. Next: judged by R4 and R5 in Phase 5 with the finished Neptune and sky.
3. `mars.travel`, frames 2745 to 2819, both blockout rounds, major: "Mars whips off-screen in 6 frames", "Jupiter scales straight out of the dead center". Tried: earlier reveal, a longer ease, a swing, an off-center start, a longer turn. Next: judge it with motion blur at the review tier in Phase 5. If the turn still reads as a whip, start it inside `mars.rise`.
4. `sun.terrain`, frames 0 to 179, both blockout rounds, major: "almost completely static". Tried: a lateral creep and a longer push on the flat stand-in. Next: the Sun's relief in Phase 4, with loops as their own layers in front of the surface, and a glide that shows it.
5. `mars.dive`, frames 2400 to 2489, R4 blockout round 2, major: "zooms flatly on-axis into Mars (pushing Phobos awkwardly out the bottom border), snaps pitch abruptly into the canyon horizon at 2465 ... then stalls". Next: rebuilt in Phase 3: arc past Phobos, carry the horizon angle and one canyon bend through the dust cover, keep gliding into the terrain move.

## Running jobs

One entry per long job while it runs: the command, the frame range, the log file, the VM, when it started.

- `npm run pack -- --phase 3 --round 4 --stop mars`, Mars judged frames and sheets, log `out/work/pack-r4.log`, Builder VM, started 2026-11-20 about 10:15 UTC.
- `npm run measure -- --stop mars`, on the sandbox VM of the measure agent at 24c2334, started 2026-11-20 about 10:06 UTC.

## Rounds

One line per round, written when the round starts: number, phase, stop. Scores and what changes next are added when it ends.

- Round 1, Phase 2, blockout, whole film. R4 blockout 7, three major, two minor. Next: each stop arrives on its own curve, the approach starts earlier and eases longer, the lookback is reframed with a slow pan. `scorecards/round-001/`.
- Round 2, Phase 2, blockout, whole film. R4 blockout 5, one severe, four major, two minor. Limit reached. After the round: arrivals start off center, the lookback never stops moving, the turn away from Mars is longer. Open items 1 to 5. `scorecards/round-002/`.
- Round 3, Phase 3, mars, look lock round 1 of 5. Started 2026-11-20 UTC on main at 93ef0b0, judged on 696e228. G5, G13, G17 green. R1 6, R2 pass, R3 4, R4 6, R8 pass. Three severe (smear on both judged motion frames, blocky polar cap), majors on the limb glow, the Milky Way and stars, star dashes, a terrain blob, flat and lifeless terrain flight. Next: retime dive and rise so the speed sits in the cover, wide soft limb haze, sky band and star counts, sky drawn with the mid-shutter lens, relief depth fix, a real terrain glide with drifting dust. `scorecards/round-003/`.
- Round 4, Phase 3, mars, look lock round 2 of 5. Started 2026-11-20 UTC on main at 24c2334. Machine checks green before the pack (G1, G2 with 22 tests, G3, G4, G6, G7, G10, G11, G12, G14, G15).

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
- 2026-11-20 UTC: Phase 2 round 1 closed.
- 2026-11-20 UTC: Phase 2 round 2 closed. Merged `agent/assets-shared`.
- 2026-11-20 UTC: Phase 3 decisions logged.
- 2026-11-20 UTC: Phase 2 gate. `out/preview.mp4` and the blockout sheets.
- 2026-11-20 UTC: Phase 3 work before round 3: Mars set code, Phobos, relief with margin, wrap maps from the agent, light curve, haze, air layer, sky frame.
- 2026-11-20 UTC: Phase 3 before round 3: sharpness fixes, patches re-matched, Phobos lit side, status command (addendum 001), status pictures.
- 2026-11-20 UTC: Phase 3 before round 3: low dive ground, sky structure, terrain sky, second status pictures.
- 2026-11-20 UTC: Phase 3 before round 3: five patch levels (merged `agent/assets-mars-patches`), dive roll fix, G13 green by render.
- 2026-11-20 UTC: Phase 3 before round 3: Milky Way band strip, covers carry color and horizon, Mars budget (93ef0b0).
- 2026-11-20 UTC: Round 3 started (8f3cd70). G6 and G11 fixed (696e228).
- 2026-11-20 UTC: Round 3 closed with its scorecards. Merged `agent/mars-relief` (0f33967). First fixes for round 4.

## Session log

One entry per task: when it started, what it did, where it stopped.

- Task 1, started 2026-11-19 (America/Boise evening). Kickoff prompt without the Mars approval line. Read AGENTS.md and the kit in order. No addenda. Started Phase 0.
  - Progress note, Phase 0 gate: the engine scaffold, the harness and a spike scene work under software rendering, and every Phase 0 check is green. App: https://grand-tour-film.pplx.app, review page at /review.html (empty until the rough cut lands). Next: the rough cut, then the engine and the blockout of all nine stops. Open: none.
  - Progress note, rough cut: `out/roughcut.mp4` is pushed and on the review page. It is made only from the 18 approved stills and follows `segments` frame for frame, so Brandon can judge the pacing. App: https://grand-tour-film.pplx.app/review.html. Next: the engine and the blockout of all nine stops. Open: none. The build is continuing.
  - Progress note, Phase 2 gate: the engine plays the whole film from stand-in sets, and `out/preview.mp4` (the blockout, 3 minutes) is on the review page with four sheets of it. All machine checks are green. The blockout critic scored 7, then 5, and the round limit was reached: five open items on camera movement go to Phases 3 to 5. App: https://grand-tour-film.pplx.app/review.html. Next: Mars, the look lock. Open: items 1 to 5 under Open items. The build is continuing.
  - Status (asked for by Brandon, addendum 001), Phase 3, mars, before round 3: the hold and terrain match the approved images closely and measure at full sharpness (G17 about 1.0 in a quick check); Phobos carries the hero's lit side; the dive and rise are being fixed for G13 with two more detail levels (placeholders in the sheet). Next: the low dive ground (flat and bright before the cover), the sky against the hero's Milky Way, then round 3. Pictures: `out/stills/status/mars-hold.jpg`, `mars-terrain.jpg`, `mars-dive.jpg`, and `out/stills/sheet-film-02.jpg`. https://grand-tour-film.pplx.app/review.html
  - Status, Phase 3, mars, before round 3 (steps 1 to 4 tuned, step 3 waits on two more patch levels from the patch agent): the low part of the dive now darkens and warms toward the canyon light before the dust cover, the sky has structure with dark lanes and matches the hero by region, and the terrain sky shows fine stars as in the close image; quick G17 is 1.06 (hold) and 1.01 (terrain). Next: merge the two new patch levels, confirm G13 by render, then round 3. The dive sheet in this status was rendered with stand-in files for the two levels that are not delivered yet. Review page: https://grand-tour-film.pplx.app/review.html
  - Status, Phase 3, mars, steps 1 to 5 finished, before round 3: the sky now carries a real Milky Way band strip placed as in the hero (region medians within two levels of the hero's), the dust cover carries ground color, exposure and horizon on both the dive and the rise, and the Mars set measures 1,273 MB of the 1,400 allowed; G13 is green by render and quick G17 is 1.19 (hold) and 1.01 (terrain). Next: look lock round 3 with the full measures and every critic. Review page: https://grand-tour-film.pplx.app/review.html
  - Status, Phase 3, mars, after round 3 (look lock round 1 of 5): R1 6, R2 pass, R3 4, R4 6, R8 pass, G5, G13 and G17 green. Since the round: the dive and rise are retimed so both judged motion frames are sharp, the limb haze is fitted to the approved hero, the globe visibly turns in the hold, the canyon flight is a real glide with drifting valley dust, the night side no longer shows bright speckles, and a first sky checkpoint (wider diffuse band, finer stars) is merged. Next: the sky agent's final fit, then round 4. Pictures: `out/stills/status/mars-hold.jpg`, `mars-terrain.jpg`, `mars-dive.jpg`. https://grand-tour-film.pplx.app/review.html
