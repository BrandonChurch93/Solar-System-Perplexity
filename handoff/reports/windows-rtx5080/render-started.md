# The 4K render is running on the Windows PC: send no cure into it

- **Started:** 2026-11-28 01:11 MST (08:11 UTC)
- **Commit:** `0562a78b79cf06b1ce6addca04d0c1e15c27929d` ("CURE 3: on a graphics card Neptune's shaders use their own asin, acos and atan")
- **Graphics:** `ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 (0x00002C02) Direct3D11 vs_5_0 ps_5_0, D3D11)`, Chrome 158.0.8127.37
- **Command (W6; the flags of the test, no `--angle`):** `node node_modules/tsx/dist/cli.mjs tools/capture.ts --format uhd --rate 2 --tier final --expect-gpu "RTX 5080" >> render-uhd.log 2>&1`
- **Frames:** 10,800 at 3840 by 2160, 60 fps, tier final, into `out/work/capture/uhd-r2-final` (empty before; no earlier render existed)
- **Hours the test estimates:** 15.3 (weighted by the cloud's costs) to 19.3 (every frame at the test mean of 6.4 s). The render's own pace will be added here.

## On whose word: Brandon's, over a LOOK with one line

The gate test of `0562a78` ended with **VERDICT: LOOK**, with one line left: **master 9916** (Neptune flight out, 1080p) at 36.84 dB and **SSIM 0.9185**, under the limit of 0.93. Every other line passes, including **uhd 9916 at 37.46 dB and 0.9330** and master 9720 at 40.70 / 0.9590.

By W5 a LOOK starts no render. Brandon was told at 01:06 MST that this line was below the limit. He then gave his own word: "I'd just go ahead and start, if run into problems just reach out to perplexity through GitHub". He had also received Partner's message recommending that the Direct3D render start at once rather than wait for Vulkan. **So the render was started on Brandon's explicit word, not by the gate.** I looked at the side by side picture of master 9916 first: it is the same picture (storm, cloud band, limb and sky in place), with no blobs, ripples or bands. Only the cirrus is a little softer.

If the Builder judges master 9916 not good enough, a later CURE can redraw the Neptune part of the film only. Per the last paragraph of "What the first cure changed", the finished parts of the other stops are kept. By W2 I will not pull, test or build while this render runs. A new CURE commit is noted and handled after the render, the finish and the log.

## Results of the test of CURE 3 (`0562a78`), 01:01:52 to 01:09:55 MST

| Frame | After cure 2 (PSNR / SSIM) | After cure 3 (PSNR / SSIM) | Line |
|---|---|---|---|
| master 9720, Neptune surface | 34.93 / 0.9262 | **40.70 / 0.9590** | passes |
| master 9480, Neptune flight in | 38.18 / 0.9306 | **38.93 / 0.9349** | passes |
| master 9916, Neptune flight out | 34.96 / 0.9051 | **36.84 / 0.9185** | **under 0.93: the one LOOK line** |
| uhd 9480 | 38.91 / 0.9424 | **39.66 / 0.9461** | passes |
| uhd 9916 | 35.49 / 0.9206 | **37.46 / 0.9330** | passes |
| preview 9400 / 9401, master 9090 | 48.30 / 48.17 / 40.70 | 48.32 / 48.18 / 40.71 | pass |

The third cure's cause (Direct3D's polynomial `asin`, `acos` and `atan` shifting the fine cloud pattern) is confirmed: 9720 rose by 5.8 dB, and 9916 by 1.9 dB at 1080p and 2.0 dB at 4K. Time per 4K frame: mean 6.4 s, slowest 40.8 s.

Files: `0562a78-REPORT.md`, `0562a78-report.json`, `0562a78-d3d11-*.jpg`, and full size `full/0562a78-master-009916.png` and `full/0562a78-uhd-009916.png`.

Verdict text:

```
LOOK. Nothing forbids the run, but a person reads these first:
- draw test master: frame 9916 (Neptune, flight out (heavy frame), film frame 4958) differs from the approved picture more than an encode explains: PSNR 36.84 dB, SSIM 0.9185. Look at C:\Users\Brandon\Desktop\Space-Fkythrough\Solar-System-Perplexity\out\work\capture-check\side\master-009916.jpg.

VERDICT: LOOK
```
