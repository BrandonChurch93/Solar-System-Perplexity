# Travel lab notebook

After a compaction: read `assets-src/shared/TRAVEL-AGENT.md` first, then this file from the top.

## State (update on every push)

- Started 2026-11-20 (session clock). Branch `agent/travel` from origin/main `3523b45`. VM: 4 cores, 7 GB, chromium-1217 present, `npm ci` and `npm run build` ok.
- Looks: `npm run looks -- --push --folder travel --note "..."`.
- Probe (no render): `npx tsx assets-src/travel/probe.ts` prints the join steps, peak turn, frames with the departing body in view and the frames at which the next body passes 1, 10 and 100 px for all eleven segments. `--segment ID [--pad N]` or `--first A --last B` prints every frame.
- Byte proof: `assets-src/travel/proof.sh LABEL` renders 2325, 2580, 2427, 2726 at final into `out/work/travel/LABEL/` and prints the first 16 characters of each sha256. Wanted: 9895a050abe22d0c, a7e1670abf3e4a24, 0a022282c24d2285, 79352ec57fa5c00b.

## Facts read from the code (origin/main 3523b45)

- `shotAt` travel: position is the leaving pose (`exitPose`, drifting out at `rise.driftSpeed`) while `u < begin`, then the approach path of the next stop (`approachLocal`: the hold pose backed off along its view axis by `sigma`, logarithmic, `e = 1 - (1 - x)^power`). The next stop's origin is placed so both agree at `begin`. `begin` is when the leaving body, rings and moons are out of frame with 3 degrees to spare (`clearAt`), never before `travel.start` (0.2).
- Orientation: slerp from the leaving quaternion to the approach quaternion with power2.inOut over `u` in 0 to `turnEnd` (0.46 default). The slerp carries pan and roll together.
- The approach starts at its largest logarithmic rate at `begin` (`e'(0) = power`), so the camera's speed toward the next body steps from the drift to the maximum in one frame. Nothing shows it today except the dust.
- Dust: 2600 points in a 9 unit cube that wraps round the camera, `gl_PointSize`, one point per time sample (dots). Offset `approach * -28 * smoother(ramp(0.1, 1, u))`, subtracted in the shader, so motes move toward the next body: backward.
- The belt (`src/space/belt/motion.ts`) reads `shot.dustOffset` and the camera at the judged frame 2782 and a quarter frame each side of it. So `shot.dustOffset` must keep its present value in `mars.travel` or the rocks move. The dust gets its own field.
- Far bodies: stand-ins draw their own point sprite when the radius is under about 15 px (`src/bodies/standin.ts`), Mars uses `src/bodies/farpoint.ts`. Both are drawn once per time sample, so in a pan the point is a row of dots.
- The sky and stars are drawn at the middle of the shutter in every sample (stars stay points).

## Baseline measured with the probe (origin/main 3523b45)

| Segment | Peak turn deg/frame (frame) | Leaving body in view | Next body in frame from | 1 px | 10 px | 100 px |
| --- | --- | --- | --- | --- | --- | --- |
| sun.travel | 1.92 (470) | 450 to 487 | 450 | 493 | 501 | 513 |
| mercury.travel | 10.57 (1052) | 1035 to 1048 | 1059 | 1057 | 1066 | 1080 |
| venus.travel | 7.15 (1623) | 1605 to 1621 | 1628 | 1629 | 1638 | 1651 |
| earth.travel | 9.96 (2190) | 2175 to 2190 | 2195 | 2196 | 2205 | 2218 |
| mars.travel | 8.67 (2764) | 2745 to 2760 | 2769 | 2772 | 2779 | 2790 |
| jupiter.travel | 7.37 (3332) | 3315 to 3329 | 3335 | 3337 | 3345 | 3358 |
| saturn.travel | 6.61 (3903) | 3885 to 3900 | 3905 | 3916 | 3924 | 3937 |
| uranus.travel | 11.10 (4472) | 4455 to 4467 | 4477 | 4475 | 4484 | 4497 |

- Joins in and out: the turn rate is continuous within 0.02 deg/frame at every boundary, the lens is 30 at both ends everywhere. The step is inside the segment: the logarithmic rate toward the next body jumps by 0.33 to 0.43 per frame at `begin` (frames 488, 1051, 1623, 2191, 2767, 3332, 3911, 4470).
- Ending: retreat peak turn 1.58 deg/frame at 5085, lens 30 to 34, lookback turn 0.03 falling to 0.01 deg/frame.

## Log

