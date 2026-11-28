# Local render report: Windows desktop, RTX 5080

Written by Claude Code on Brandon's Windows desktop on 2026-11-27 (MST). The branch `local-render-report` carries this file and the side-by-side pictures in `handoff/reports/windows-rtx5080/`. Nothing else in the repo was changed.

## Test of CURE commit c980c36, 2026-11-28 00:01 to 00:09 MST (07:01 to 07:09 UTC): VERDICT LOOK, no render

- Commit tested: `c980c36861ff2f39ebfaa1bb59b34f99846312d5` ("CURE Neptune haze ripples under Direct3D: the slab loop of the cloud shader without its early end, failed frames at full size in the report"). Brought in by W3 from `9365ac1`, with 0 changed tracked files; `package-lock.json` unchanged.
- Command (W4, no `--angle`): `node node_modules/tsx/dist/cli.mjs tools/capture-check.ts --expect-gpu "RTX 5080" >> capture-check.log 2>&1`, exit 0.
- Graphics: `ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 (0x00002C02) Direct3D11 vs_5_0 ps_5_0, D3D11)`, Chrome 158.0.8127.37. Engine hash `a455bc02904b0d42`.
- Time per 4K frame: mean 6.3 s, slowest 37.6 s; the whole 4K film 14.9 to 18.8 h by the test.
- **No render was started** (W5). `src/` untouched. The watch of `main` goes on.

### What the second cure did

- **The haze ripples are cured.** The bright limb haze of 9480 is smooth now, as in the approved frame, at 1080p and at 4K. master 9480: 34.61 dB / SSIM 0.8948 before, **38.18 / 0.9306** now; uhd 9480: 35.33 / 0.9091 before, **38.91 / 0.9424** now. **Both 9480 lines pass.** The Builder's reading of the Direct3D translation holds.
- Everything the first cure fixed stays fixed (preview 9400: 48.30, 9401: 48.17, master 9090: 40.70; no blobs anywhere). The Sun frames pass under their own limit.

### What still fails: three lines, all on SSIM

| Frame | What | After cure 1 (PSNR / SSIM) | Now (PSNR / SSIM) | What I see (left the approved film, right this machine) |
|---|---|---|---|---|
| master 9720 | Neptune surface view | 34.68 / 0.9209 | 34.93 / **0.9262** | The same picture: storm, cloud streaks, limb and sky in place. The white cirrus holds less of its crisp, fine filament detail and reads softer. The deck's fine wave texture is a little flatter. No ripples, no blobs. |
| master 9916 | Neptune flight out (heavy) | 34.62 / 0.8977 | 34.96 / **0.9051** | The same picture. The cirrus band is softer, with less fine detail in its edges, and the deck's fine streaks differ in detail. |
| uhd 9916 | Neptune flight out, 4K | 35.15 / 0.9137 | 35.49 / **0.9206** | The same picture. At full size (bottom row) the storm's eye and the fine bright wave streaks of the deck are all there, slightly flatter and less contrasty than the approved ones; the cirrus at the lower left is softer. |

This is what the Builder expected: the ripples were a small part of these three distances, and the rest is the softer cirrus and slightly flatter deck. The full-size frames for judging that are in `full/`.

Files on the branch:
- `c980c36-REPORT.md` and `c980c36-report.json`
- `c980c36-d3d11-*.jpg`: side by side pictures of every Neptune and Sun frame W5 names
- `full/c980c36-master-009480.png`, `-009720.png` and `-009916.png` (1920 by 1080, 4.1 to 4.2 MB each), and `full/c980c36-uhd-009480.png` and `-009916.png` (3840 by 2160, 14.9 and 15.3 MB): the test's frames as drawn, copied unchanged

### The full text under "Verdict"

```
LOOK. Nothing forbids the run, but a person reads these first:
- draw test master: frame 9720 (Neptune, surface view, film frame 4860) differs from the approved picture more than an encode explains: PSNR 34.93 dB, SSIM 0.9262. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-009720.jpg.
- draw test master: frame 9916 (Neptune, flight out (heavy frame), film frame 4958) differs from the approved picture more than an encode explains: PSNR 34.96 dB, SSIM 0.9051. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-009916.jpg.
- draw test uhd: frame 9916 (Neptune, flight out (heavy frame), film frame 4958) differs from the approved picture more than an encode explains: PSNR 35.49 dB, SSIM 0.9206. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\uhd-009916.jpg.

VERDICT: LOOK
```

## Test of CURE commit 9365ac1, 2026-11-27 22:42 to 22:50 MST (2026-11-28 05:42 to 05:50 UTC): VERDICT LOOK, no render

- Commit tested: `9365ac1c16e0db936af82201a582ba9080453464` ("CURE Neptune bands and blobs, Saturn ring pixels at 4K, Windows section, test limits and tool guards"). The clone was brought to it by W3 (`git checkout -B main origin/main`), with 0 changed tracked files; `package-lock.json` unchanged, so no `npm ci`.
- Command (W4, no `--angle`): `node node_modules/tsx/dist/cli.mjs tools/capture-check.ts --expect-gpu "RTX 5080" >> capture-check.log 2>&1`, exit 0.
- Graphics: `ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 (0x00002C02) Direct3D11 vs_5_0 ps_5_0, D3D11)`, Chrome 158.0.8127.37. Engine hash `a455bc02904b0d42`.
- Time per 4K frame: mean 6.3 s, slowest 37.5 s; the whole 4K film 14.9 to 18.8 h by the test.
- **No render was started** (W5: only PASS is the go on this machine). `src/` untouched. Watching `main` every 10 minutes for the next CURE commit.

### What the cure did

- **The banded terminator is cured under Direct3D 11.** preview 9400: 31.39 dB before, **48.29** now; 9401: 31.28 before, **48.16** now; master 9090: 33.09 before, **40.70** now. The pictures are the approved pictures. This proves the Builder's theory of the handed table.
- **The black blobs and specks are cured.** No blob or speck is left in any Neptune frame at 1080p or 4K.
- Sun frames 180 and 396 (master) and 396 (uhd) pass under their own limit.

### What still fails: the five close Neptune frames, all on SSIM

| Frame | What | PSNR dB before cure | PSNR dB now | SSIM now | What I see (left the approved film, right this machine) |
|---|---|---|---|---|---|
| master 9720 | Neptune surface view | 32.32 | 34.68 | 0.9209 | The same picture. The deck texture is a little flatter and grainier, and the cirrus a little softer. No blobs. |
| master 9480 | Neptune flight in (heavy) | 30.61 | 34.61 | 0.8948 | The same picture, with one visible difference: **the bright haze along the upper limb (top right) carries fine horizontal ripples or stripes** that the approved frame does not have; the approved haze there is smooth. A few faint grey dots sit at the left end of the upper cloud streak. The cirrus is a little softer. |
| master 9916 | Neptune flight out (heavy) | 31.99 | 34.62 | 0.8977 | The same picture. The deck's fine streaks are a little coarser and the cirrus a little softer. No blobs. |
| uhd 9480 | Neptune flight in, 4K | 31.16 | 35.33 | 0.9091 | As master 9480: **limb haze ripples** in the top row. At full size (bottom row) the storm, the deck and the cirrus match, with the cirrus slightly softer. |
| uhd 9916 | Neptune flight out, 4K | 32.51 | 35.15 | 0.9137 | The same picture. At full size the deck's fine bright wisps differ in detail and the cirrus is slightly softer. |

The PSNR of each is above 34 dB; each fails only on SSIM under 0.93. My reading: what is left is (1) the ripple in the limb haze of the flight-in frames, which I first noted at uhd 9480 in the D3D11 report and which outlived the cure, and (2) a softer cirrus and a slightly different fine deck texture in the close views, which is the kind of difference the Sun frames show and which the Builder may judge the same way. That judgement is not mine to make on this machine (W5).

Pictures: `9365ac1-d3d11-*.jpg` in `handoff/reports/windows-rtx5080/`; the full report: `9365ac1-REPORT.md` and `9365ac1-report.json`.

### The full text under "Verdict"

```
LOOK. Nothing forbids the run, but a person reads these first:
- draw test master: frame 9720 (Neptune, surface view, film frame 4860) differs from the approved picture more than an encode explains: PSNR 34.68 dB, SSIM 0.9209. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-009720.jpg.
- draw test master: frame 9480 (Neptune, flight in (heavy frame), film frame 4740) differs from the approved picture more than an encode explains: PSNR 34.61 dB, SSIM 0.8948. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-009480.jpg.
- draw test master: frame 9916 (Neptune, flight out (heavy frame), film frame 4958) differs from the approved picture more than an encode explains: PSNR 34.62 dB, SSIM 0.8977. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-009916.jpg.
- draw test uhd: frame 9916 (Neptune, flight out (heavy frame), film frame 4958) differs from the approved picture more than an encode explains: PSNR 35.15 dB, SSIM 0.9137. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\uhd-009916.jpg.
- draw test uhd: frame 9480 (Neptune, flight in (heavy frame), film frame 4740) differs from the approved picture more than an encode explains: PSNR 35.33 dB, SSIM 0.9091. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\uhd-009480.jpg.

VERDICT: LOOK
```

## Summary

- **The 4K 60 fps render was not started.** The capture check on the RTX 5080 ended with `VERDICT: LOOK`, and on inspection **Neptune is drawn wrong in every view** (whole, surface, flight in, flight out). All other bodies tested match the approved film.
- Neptune on ANGLE Direct3D11 shows two faults:
  1. **Whole views** (capture 9090, 9400, 9401): the day/night terminator is drawn as hard, evenly spaced **stair-step bands** across the disc instead of a smooth fade.
  2. **Close and surface views** (capture 9480, 9720, 9916): the cloud deck is covered with **black blobs and streaks** of many sizes that are not in the approved film. uhd 9480 also shows striping along the bright limb.
- The Sun frames flagged by the same rule (capture 180, 396) are **the same picture**: differences are only in fine loop strands and granule detail. They would not stop the run.

## Machine and run

- Windows 11 Home 10.0.26300, AMD Ryzen 7 9800X3D, 66.2 GB RAM, NVIDIA GeForce RTX 5080 16 GB, driver 616.92, AC power.
- Browser graphics: `ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 (0x00002C02) Direct3D11 vs_5_0 ps_5_0, D3D11)`, Chrome 158.0.8127.37. This is Chrome's default backend on Windows; no `--angle` flag was given.
- Limits: largest texture 16384, render buffer 16384, viewport 32767 by 32767, **point sizes 1 to 1024**, 8 samples. The machine meets every need; `--ignore-limits` was not used.
- Clone: `git clone --depth 1`, commit `852ebae4dbcc41f3a8cbffd2adb4ff466987c78f`, 0 changed tracked files. Engine hash `a455bc02904b0d42` (approved). 34 handoff files proved by size and sha256.
- Tools: Node v24.13.0, git 2.56.0, ffmpeg 9.1 full_build (Gyan, winget; libx264 yes, libvpx-vp9 yes), gh 2.106.0 (winget; not signed in).
- Command: `node node_modules/tsx/dist/cli.mjs tools/capture-check.ts --expect-gpu "RTX 5080" >> capture-check.log 2>&1`
- Test time: 20:26:54 to 20:35:08 MST (8 min 14 s), exit code 0.

## What stopped

`VERDICT: LOOK`. Two kinds of line:

1. **Hours above the mark** (18.9 h at the test mean, 15 h weighted by the cloud costs). By the run's rules this alone is a go.
2. **11 frames "differ from the approved picture more than an encode explains"**. Each side-by-side was opened and judged:

| Test | Capture frame | Film frame | What | PSNR dB | SSIM | Judgement | Picture |
|---|---|---|---|---|---|---|---|
| preview | 9400 | 4700 | Neptune flight in | 31.39 | 0.9660 | **wrong**: banded terminator | `d3d11-preview-009400.jpg` |
| preview | 9401 | 4700.5 | Neptune flight in, in-between frame | 31.28 | 0.9657 | **wrong**: banded terminator | `d3d11-preview-009401.jpg` |
| master | 180 | 90 | Sun surface view | 32.57 | 0.9401 | same picture | `d3d11-master-000180.jpg` |
| master | 9090 | 4545 | Neptune whole view | 33.09 | 0.9366 | **wrong**: banded terminator | `d3d11-master-009090.jpg` |
| master | 9720 | 4860 | Neptune surface view | 32.32 | 0.8687 | **wrong**: black specks | `d3d11-master-009720.jpg` |
| master | 396 | 198 | Sun flight out (heavy) | 31.49 | 0.9152 | same picture | `d3d11-master-000396.jpg` |
| master | 9480 | 4740 | Neptune flight in (heavy) | 30.61 | 0.8389 | **wrong**: black blobs | `d3d11-master-009480.jpg` |
| master | 9916 | 4958 | Neptune flight out (heavy) | 31.99 | 0.8558 | **wrong**: black specks | `d3d11-master-009916.jpg` |
| uhd | 9916 | 4958 | Neptune flight out (heavy) | 32.51 | 0.8767 | **wrong**: black specks | `d3d11-uhd-009916.jpg` |
| uhd | 9480 | 4740 | Neptune flight in (heavy) | 31.16 | 0.8616 | **wrong**: black blobs, limb striping | `d3d11-uhd-009480.jpg` |
| uhd | 396 | 198 | Sun flight out (heavy) | 31.68 | 0.9208 | same picture | `d3d11-uhd-000396.jpg` |

Left half of each picture is the approved film, right half this machine; 4K pictures carry a second row at full size from the middle.

## Time per frame (D3D11)

- 4K (3840x2160): mean 6.3 s, slowest 37.2 s (Neptune flight in, capture 9480), over 13 test frames. Pure render time is mostly 0.1 to 9.6 s; the first frame of each body includes load and warm-up.
- 1080p (1920x1080): render 0.0 to 31.7 s per frame; the slowest is again Neptune flight in (9480).
- Whole 4K film estimate from the test: 15 to 18.9 hours.
- GPU while drawing: up to 100 percent busy, at most about 8.1 GB in use.

## Update 2: the two other backends, and a diagnosis (2026-11-27, 21:05 to 21:45 MST)

**Neither `--angle gl` nor `--angle vulkan` passes.** Both clear Neptune's banded terminator, but both keep Neptune's black specks, and both add a new fault on Venus that D3D11 does not have. Per Brandon's order no render was started, and `src/` was not touched.

### Commands

```
node node_modules/tsx/dist/cli.mjs tools/capture-check.ts --expect-gpu "RTX 5080" --angle gl >> capture-check-gl.log 2>&1
node node_modules/tsx/dist/cli.mjs tools/capture-check.ts --expect-gpu "RTX 5080" --angle vulkan >> capture-check-vulkan.log 2>&1
```

- GL: `ANGLE (NVIDIA Corporation, NVIDIA GeForce RTX 5080/PCIe/SSE2, OpenGL 4.5.0)`. Ran 21:05 to 21:35. **Stopped by me after its 1080p set** (preview and master complete; the 4K set was not drawn), because the verdict could no longer be PASS and the 1080p Neptune frames had answered the question. The PC went to sleep once during this run (the Mars frame 4650 shows 1658 s), because I had restored Brandon's sleep timer after the first give-up. No frame was affected.
- Vulkan: `ANGLE (NVIDIA, Vulkan 1.4.351 (NVIDIA NVIDIA GeForce RTX 5080 (0x00002C02)), NVIDIA)`. Ran 21:35:44 to 21:39:58, complete, exit 0, **VERDICT: LOOK**.

### The frames that matter, PSNR dB against the approved picture

| Frame | What | D3D11 | GL | Vulkan | Look (my judgement of the pictures) |
|---|---|---|---|---|---|
| preview 9400 | Neptune flight in, whole disc | 31.39 | **48.25** | **48.42** | D3D11 banded; GL and Vulkan clean, the same picture |
| master 9090 | Neptune whole view | 33.09 | **40.70** | **40.71** | D3D11 banded; GL and Vulkan clean |
| master 9720 | Neptune surface view | 32.32 | 34.80 | 34.79 | **black specks on all three** |
| master 9480 | Neptune flight in (heavy) | 30.61 | 31.82 | 31.80 | **black blobs on all three, same places** |
| master 9916 | Neptune flight out (heavy) | 31.99 | 33.07 | 33.05 | **black specks on all three** |
| uhd 9480 | Neptune flight in, 4K | 31.16 | not drawn | 32.30 | **black blobs on both** |
| uhd 9916 | Neptune flight out, 4K | 32.51 | not drawn | 33.63 | **black specks on both** |
| preview 2200 | Venus whole view (film frame 1100) | 48.97 | **27.59** | **27.55** | **new fault on GL and Vulkan**: a vertical strip down the left edge of the frame (about the first tenth of its width) filled with grey star-like speckles; fine on D3D11 |
| master 660 | Sun whole view | 38.66 | 38.31 | 33.08 | Vulkan: the same picture, slightly lower contrast in the corona and the surface |
| master 180, 396 | Sun surface, flight out | 32.57, 31.49 | 31.04, 29.55 | 29.66, 28.65 | the same picture on all three (fine strand detail only) |

Pictures, left the approved film and right this machine: `gl-*.jpg` and `vulkan-*.jpg` beside the `d3d11-*.jpg` in `handoff/reports/windows-rtx5080/`.

### Time per frame

| Backend | 4K mean | 4K slowest | Whole 4K film (test's two estimates) |
|---|---|---|---|
| D3D11 | 6.3 s | 37.2 s | 15 to 18.9 h |
| Vulkan | 3.2 s | 11.3 s | **7.4 to 9.5 h** |
| GL | not measured (4K set not drawn) | | 1080p frames took 0.1 to 4.6 s of render time, like the others |

### Diagnosis (read only; nothing in `src/` was changed)

There are **two separate Neptune faults**, told apart by which backends show them.

**1. Banded terminator in the whole views: Direct3D11 only.** It is gone on GL and Vulkan. The prime suspect is `knot()` in `src/stops/neptune/planet.ts:187-191`:

```glsl
vec3 knot(vec3 k[33], float ndl) {
  float x = clamp(ndl * 0.5 + 0.5, 0.0, 1.0) * 32.0;
  int i = int(min(floor(x), 31.0));
  return mix(k[i], k[i + 1], x - float(i));
}
```

It is called with uniform arrays (`uDeck`, `uCloud`, and in `deep.ts` `uGDeck`, `uGCloud`) passed **by value as a function argument** and indexed with a **dynamic index**. ANGLE's HLSL output copies such an array into a local array, which FXC compiles into indexable temp registers, a path known for miscompiles. The fault looks exactly like what would happen if the interpolation between knot `i` and `i + 1` were lost: shading constant within each of the 32 steps of `ndl`, which on a sphere shows as evenly spaced bands parallel to the terminator. That is what frames 9090 and 9400 show. Not proven: I did not build a test page for it. A low-risk cure that should leave the software picture bit for bit the same: read the uniform arrays directly instead of passing them as a parameter (one `knotDeck`, `knotCloud` and so on per array, or a macro), or store the curve in a 33 by 1 float texture with linear filtering.

**2. Black blobs and specks in the surface and flight views: every real GPU (D3D11, GL and Vulkan alike), in the same places.** So this is not a Direct3D translation fault. It is the scene's own arithmetic coming out differently on GPU hardware than in SwiftShader, where the film was approved. It sits in the deep scene, `src/stops/neptune/deep.ts`. The places where a small float difference flips a hard decision, in the order I would check them:

- The **self-shadow march**, `deep.ts:874-885` (`shade = min(shade, clamp(0.5 + clear / (...), 0.0, 1.0))`, then `shade = 1.0 - uShade.x * (1.0 - shade)`). The comment at `deep.ts:871-873` records that this same term once made "the navy chunks with stepped edges at 4705 to 4713" (MAIL 840 point 1). The blobs here look like that fault again: dark navy-to-black chunks with smooth edges, of many sizes, on the lit deck.
- The **deck march hit test**, `deep.ts:818-831` (`if (f < 0.5 * td * pix)` and `deckHit = deckHit || (td <= tEnd && f < 0.03)`): a ray that misses on the GPU and hits in software, or the reverse, changes `tDeck` and everything lit from it.
- The cirrus shadow hop loop, `deep.ts:891-909`, which changes its own loop counter (`i += 1 + int(0.9 * far / castGap)`): a threshold on `far` changes how many taps are skipped.
- Less likely: `hash3` (`deep.ts:155`) is integer-exact on every backend, so the noise itself should match. `endHash` in `planet.ts:211` converts a float to `uvec2`, which is undefined for negative values in GLSL ES and may differ by backend.

The quickest way to find it is the Builder's own method of MAIL 840: switch the terms off one at a time on a frame like 4740 and compare. But it has to be done on a GPU, because SwiftShader does not show the fault. The Windows test takes about 4 minutes on Vulkan.

**3. Venus strip on GL and Vulkan (not D3D11):** a column of grey speckles over the sky at the left edge of capture frame 2200. One difference between the backends is the point size limit: 1024 on D3D11 against 2047 on GL and Vulkan. A star or far point drawn larger than 1024 px would be clamped on D3D11 and drawn whole on the others. That is a guess. I did not read the sky code for it.

### Note on the test tool

`tools/capture-check.ts` (through `tools/capture.ts`) **reuses frames already on disk even when they were drawn with another backend.** My first `--angle gl` run finished in 31 s by reusing all 43 D3D11 frames, and reported the D3D11 graphics name and verdict as if they were its own. I cleared `out/work/capture-check/` before each later run. The tool could key its frame folder by the graphics name, or refuse reused frames whose manifest names other graphics.

### Where things stand

- No render. No release. `src/`, `config/`, `tools/` and `main` are untouched. Only this branch was pushed.
- Kept on the PC: `C:\Users\Brandon\Desktop\Space-Fkythrough\capture-check-d3d11\`, `capture-check-gl\` and `capture-check-vulkan\` (full reports, frames and logs).
- When the cure is on `main`, the PC test is the proof: about 4 minutes on Vulkan, 8 on D3D11. If one fix covers both faults, **Vulkan is the faster backend for the release (7.4 to 9.5 h)**, provided the Venus strip is cured as well. Otherwise D3D11, which has no Venus fault (15 to 18.9 h).

## Full REPORT.md of the D3D11 test

````markdown
# Capture check

Made by tools/capture-check.ts at 2026-11-28T03:26:54.334Z. It drew single test frames and no film.

## Machine

- System: win32 10.0.26300 x64
- Processor: AMD Ryzen 7 9800X3D 8-Core Processor, 8 threads
- Memory: 66.2 GB
- Free disk here: 1277.4 GB
- Node: v24.13.0
- Git commit: 852ebae4dbcc41f3a8cbffd2adb4ff466987c78f, changed tracked files: 0
- NVIDIA card by nvidia-smi: NVIDIA GeForce RTX 5080, 616.92, 16303 MiB

## Code and handoff files

- Engine hash: a455bc02904b0d42, the approved build
- Handoff files: 34 proved by size and sha256 (34 fetched from the branch handoff-local-render-assets just now), 0 wrong

## ffmpeg

- ffmpeg: ffmpeg version 9.1-full_build-www.gyan.dev Copyright (c) 2000-2026 the FFmpeg developers
- libx264 encoder: yes; libvpx-vp9 decoder: yes
- Subtitle strip at 57 s: see through values from 0 to 255, alive

## Draw test preview: 6 frames at 960 by 540

- Browser: 158.0.8127.37
- Graphics the browser drew on: ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 (0x00002C02) Direct3D11 vs_5_0 ps_5_0, D3D11)
- Engine hash of the page: a455bc02904b0d42; shutter 360 degrees
- NVIDIA card while drawing: busiest 72 percent, most memory in use 8077 MB (48 readings; before the draw 3 percent and 1721 MB)

| capture frame | film frame | what | PSNR dB | SSIM | seconds | render s | PNG MB | fine detail |
|---|---|---|---|---|---|---|---|---|
| 2200 | 1100 | film frame 1100, a frame the 30 fps film has | 48.97 | 0.9957 | 39.3 | 2.6 | 1.1 | n/a |
| 2201 | 1100 and a half | the new frame between film frames 1100 and 1101 | 48.94 | 0.9957 | 2.5 | 2.4 | 1.1 | n/a |
| 4880 | 2440 | film frame 2440, Mars flight in | 52.80 | 0.9975 | 6.3 | 1.6 | 1.1 | n/a |
| 4881 | 2440 and a half | the new frame between film frames 2440 and 2441 | 52.90 | 0.9976 | 0.2 | 0.2 | 1.1 | n/a |
| 9400 | 4700 | film frame 4700, Neptune flight in | 31.39 | 0.9660 | 36.8 | 36.7 | 1.1 | n/a |
| 9401 | 4700 and a half | the new frame between film frames 4700 and 4701 | 31.28 | 0.9657 | 1.7 | 1.7 | 1.1 | n/a |

## Draw test master: 24 frames at 1920 by 1080

- Browser: 158.0.8127.37
- Graphics the browser drew on: ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 (0x00002C02) Direct3D11 vs_5_0 ps_5_0, D3D11)
- Engine hash of the page: a455bc02904b0d42; shutter 360 degrees
- NVIDIA card while drawing: busiest 100 percent, most memory in use 7517 MB (84 readings; before the draw 2 percent and 1807 MB)

| capture frame | film frame | what | PSNR dB | SSIM | seconds | render s | PNG MB | fine detail |
|---|---|---|---|---|---|---|---|---|
| 180 | 90 | Sun, surface view, film frame 90 | 32.57 | 0.9401 | 52.9 | 0.3 | 4.8 | n/a |
| 660 | 330 | Sun, whole view, film frame 330 | 38.66 | 0.9746 | 0.1 | 0.0 | 5.0 | n/a |
| 1110 | 555 | Mercury, whole view, film frame 555 | 40.79 | 0.9655 | 5.3 | 0.5 | 4.2 | n/a |
| 1800 | 900 | Mercury, surface view, film frame 900 | 41.66 | 0.9854 | 0.3 | 0.2 | 5.0 | n/a |
| 2250 | 1125 | Venus, whole view, film frame 1125 | 40.72 | 0.9673 | 9.5 | 0.6 | 4.3 | n/a |
| 2730 | 1365 | Venus, surface view, film frame 1365 | 41.00 | 0.9621 | 0.2 | 0.1 | 4.2 | n/a |
| 3480 | 1740 | Earth, whole view, film frame 1740 | 41.84 | 0.9823 | 6.8 | 0.7 | 4.6 | n/a |
| 3930 | 1965 | Earth, surface view, film frame 1965 | 38.90 | 0.9620 | 0.2 | 0.1 | 4.7 | n/a |
| 4650 | 2325 | Mars, whole view, film frame 2325 | 40.23 | 0.9627 | 6.9 | 0.6 | 4.3 | n/a |
| 5220 | 2610 | Mars, surface view, film frame 2610 | 44.06 | 0.9851 | 1.9 | 1.8 | 4.5 | n/a |
| 5670 | 2835 | Jupiter, whole view, film frame 2835 | 40.55 | 0.9654 | 13.3 | 0.4 | 4.5 | n/a |
| 6300 | 3150 | Jupiter, surface view, film frame 3150 | 43.89 | 0.9852 | 0.3 | 0.2 | 4.5 | n/a |
| 6930 | 3465 | Saturn, whole view with the rings, film frame 3465 | 39.43 | 0.9646 | 13.7 | 0.4 | 4.6 | n/a |
| 7440 | 3720 | Saturn, surface view, film frame 3720 | 41.44 | 0.9826 | 2.5 | 2.5 | 4.7 | n/a |
| 7950 | 3975 | Uranus, whole view, film frame 3975 | 40.21 | 0.9565 | 5.5 | 0.4 | 4.4 | n/a |
| 8474 | 4237 | Uranus, surface view, film frame 4237 | 41.90 | 0.9628 | 1.2 | 1.1 | 4.1 | n/a |
| 9090 | 4545 | Neptune, whole view, film frame 4545 | 33.09 | 0.9366 | 2.1 | 2.0 | 4.2 | n/a |
| 9720 | 4860 | Neptune, surface view, film frame 4860 | 32.32 | 0.8687 | 0.8 | 0.7 | 4.4 | n/a |
| 10500 | 5250 | Ending, the look back with the stars, film frame 5250 | 40.51 | 0.9722 | 0.2 | 0.2 | 4.4 | n/a |
| 396 | 198 | Sun, flight out (heavy frame), film frame 198 | 31.49 | 0.9152 | 1.2 | 1.1 | 4.7 | n/a |
| 1416 | 708 | Mercury, flight in (heavy frame), film frame 708 | 40.00 | 0.9606 | 2.2 | 2.1 | 4.0 | n/a |
| 6514 | 3257 | Jupiter, flight out (heavy frame), film frame 3257 | 36.75 | 0.9419 | 0.9 | 0.8 | 4.2 | n/a |
| 9480 | 4740 | Neptune, flight in (heavy frame), film frame 4740 | 30.61 | 0.8389 | 31.7 | 31.7 | 4.4 | n/a |
| 9916 | 4958 | Neptune, flight out (heavy frame), film frame 4958 | 31.99 | 0.8558 | 4.1 | 4.0 | 4.4 | n/a |

## Draw test uhd: 13 frames at 3840 by 2160

- Browser: 158.0.8127.37
- Graphics the browser drew on: ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 (0x00002C02) Direct3D11 vs_5_0 ps_5_0, D3D11)
- Engine hash of the page: a455bc02904b0d42; shutter 360 degrees
- NVIDIA card while drawing: busiest 100 percent, most memory in use 7470 MB (95 readings; before the draw 10 percent and 1687 MB)

| capture frame | film frame | what | PSNR dB | SSIM | seconds | render s | PNG MB | fine detail |
|---|---|---|---|---|---|---|---|---|
| 3480 | 1740 | Earth, whole view, film frame 1740 | 38.06 | 0.9670 | 10.8 | 0.7 | 16.7 | 5.30 |
| 6930 | 3465 | Saturn, whole view with the rings, film frame 3465 | 38.37 | 0.9684 | 13.4 | 0.4 | 17.0 | 5.40 |
| 4650 | 2325 | Mars, whole view, film frame 2325 | 40.06 | 0.9675 | 7.6 | 0.6 | 15.5 | 2.81 |
| 10500 | 5250 | Ending, the look back with the stars, film frame 5250 | 36.99 | 0.9683 | 2.0 | 1.8 | 15.9 | 2.95 |
| 3930 | 1965 | Earth, surface view, film frame 1965 | 38.06 | 0.9664 | 0.5 | 0.2 | 17.2 | 4.06 |
| 5220 | 2610 | Mars, surface view, film frame 2610 | 40.67 | 0.9720 | 2.2 | 1.9 | 16.3 | 3.46 |
| 660 | 330 | Sun, whole view, film frame 330 | 36.49 | 0.9646 | 0.4 | 0.1 | 18.3 | 5.67 |
| 6300 | 3150 | Jupiter, surface view, film frame 3150 | 39.64 | 0.9699 | 9.7 | 8.5 | 16.3 | 3.18 |
| 9916 | 4958 | Neptune, flight out (heavy frame), film frame 4958 | 32.51 | 0.8767 | 9.9 | 9.6 | 16.0 | 2.58 |
| 9480 | 4740 | Neptune, flight in (heavy frame), film frame 4740 | 31.16 | 0.8616 | 37.2 | 36.9 | 16.1 | 2.58 |
| 396 | 198 | Sun, flight out (heavy frame), film frame 198 | 31.68 | 0.9208 | 76.5 | 1.8 | 16.6 | 2.88 |
| 1416 | 708 | Mercury, flight in (heavy frame), film frame 708 | 39.61 | 0.9683 | 8.7 | 6.1 | 14.5 | 2.19 |
| 6514 | 3257 | Jupiter, flight out (heavy frame), film frame 3257 | 36.32 | 0.9503 | 6.3 | 6.0 | 15.2 | 2.21 |

## The whole film

- Time per frame at 3840 by 2160 on this machine: mean 6.3 s, slowest 37.2 s (13 test frames; the test holds more heavy frames than the film does)
- Hours for the 10800 frames of the 4K film, every frame at the mean of the test: 18.9
- Hours for the 4K film, every part of the film weighed by what it cost in the cloud: 15
- These are estimates from 13 frames, not a promise. The run prints its own remaining time from the first minutes on.
- Disk: a 4K frame is about 16.3 MB as PNG; the run holds at most 600 of them at a time (9.8 GB) beside the parts and the films. Keep 35 GB free; 1277.4 GB are free here.
- Graphics named by the browser in every test: ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 (0x00002C02) Direct3D11 vs_5_0 ps_5_0, D3D11) (158.0.8127.37)
- The words asked for (--expect-gpu): RTX 5080
- Side by side pictures (left the approved film, right this machine; for 4K frames a second row at full size from the middle): C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side

## Verdict

LOOK. Nothing forbids the run, but a person reads these first:
- draw test preview: frame 9400 (film frame 4700, Neptune flight in) differs from the approved picture more than an encode explains: PSNR 31.39 dB, SSIM 0.9660. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\preview-009400.jpg.
- draw test preview: frame 9401 (the new frame between film frames 4700 and 4701) differs from the approved picture more than an encode explains: PSNR 31.28 dB, SSIM 0.9657. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\preview-009401.jpg.
- draw test master: frame 180 (Sun, surface view, film frame 90) differs from the approved picture more than an encode explains: PSNR 32.57 dB, SSIM 0.9401. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-000180.jpg.
- draw test master: frame 9090 (Neptune, whole view, film frame 4545) differs from the approved picture more than an encode explains: PSNR 33.09 dB, SSIM 0.9366. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-009090.jpg.
- draw test master: frame 9720 (Neptune, surface view, film frame 4860) differs from the approved picture more than an encode explains: PSNR 32.32 dB, SSIM 0.8687. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-009720.jpg.
- draw test master: frame 396 (Sun, flight out (heavy frame), film frame 198) differs from the approved picture more than an encode explains: PSNR 31.49 dB, SSIM 0.9152. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-000396.jpg.
- draw test master: frame 9480 (Neptune, flight in (heavy frame), film frame 4740) differs from the approved picture more than an encode explains: PSNR 30.61 dB, SSIM 0.8389. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-009480.jpg.
- draw test master: frame 9916 (Neptune, flight out (heavy frame), film frame 4958) differs from the approved picture more than an encode explains: PSNR 31.99 dB, SSIM 0.8558. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-009916.jpg.
- draw test uhd: frame 9916 (Neptune, flight out (heavy frame), film frame 4958) differs from the approved picture more than an encode explains: PSNR 32.51 dB, SSIM 0.8767. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\uhd-009916.jpg.
- draw test uhd: frame 9480 (Neptune, flight in (heavy frame), film frame 4740) differs from the approved picture more than an encode explains: PSNR 31.16 dB, SSIM 0.8616. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\uhd-009480.jpg.
- draw test uhd: frame 396 (Sun, flight out (heavy frame), film frame 198) differs from the approved picture more than an encode explains: PSNR 31.68 dB, SSIM 0.9208. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\uhd-000396.jpg.
- the 4K film is estimated at up to 18.9 hours on this machine, more than 14. Decide whether to run it, to run it on the other machine, or to draw the 1080p 60 fps film here instead.

VERDICT: LOOK
````
