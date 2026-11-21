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

- 05:12 UTC. First commit pushed to `agent/travel`. Looks: the harness tags every picture with the stop of its segment, and `--push --folder travel` drops pictures tagged with another stop, so sheets and stills of travel segments never reach `agent/travel-looks` on their own. Every picture I want pushed is added with `npm run looks -- --add FILE --stop travel --label "..."` (`sheets.sh` does it). Baseline draft sheets pushed 05:14.
- 05:20 Builder mail: `saturn.travel` is a fixed point like `mars.travel` for the turn. Do not change `turnDeg` or `side` of `mars.travel` or `saturn.travel`, and nothing that moves the camera's direction at the first frame of those two travels or at the hold after them. The path between may change. Saturn's exit pose is still moving on its agent's branch: do Saturn's travel late.
- `geom.ts`: prints for each travel the total turn, pan and its screen direction, roll, where the leaving body, the next body and the Sun sit at the first frame.

## Design decisions

- Dust: `shot.dustOffset` stays as it is (the belt reads it). The dust has its own flow: `src/space/travel/flow.ts` integrates the camera's flight direction times a logarithmic function of its real speed, at four fixed steps per frame from the first frame of the segment, cached per segment. Each mote is one instanced quad drawn from its screen position at shutter open to shutter close, energy divided by the streak's area, drawn the same in every time sample, so every tier gets the same smooth streak. Near motes get a circle of confusion (large faint discs). Lit by the Sun with a forward lobe. Amount is zero at both joins.
- Sub-pixel bodies: "sky lock" in `shotAt`: rotate the arriving set about the camera per time sample so the far point holds still on the sky like the stars do, fading out as the disc grows (3 to 40 px).
- Camera: turn spread over most of the segment with pan and roll decoupled, approach curve whose logarithmic rate starts at zero (no speed step at `begin`), own table in `src/space/travel/` that overrides each plan's `travel` and `arrive`, each of the eight its own side, swing and timing. `mars.travel` and `saturn.travel` keep their world rotation and both end directions.
- Ending: own sky aim switched under the `neptune.rise` cover, Milky Way behind the Sun, Neptune a lit crescent at the frame edge, a move that never stops, last frame black.
- 05:31 Milestone 1 (dust) reported to the Builder: commits 9bb0511, 5887f47, four Mars hashes match (out/work/travel/dust/), review still of 1078 20.0 s (before not measured).
- 05:32 Camera committed: 32254ec (path module), eb1daef (film.ts travel branch), 8a4921b (probes). `place()` and the legacy `clearAt`/`begin` are untouched, so every stop's world rotation and origin keep their bits and no turn changed. The new clear time (`clear[]`, from the new turn) replaces `begin` only inside the travel branch.

## Camera as built

- `src/space/travel/path.ts`: `TravelLook` per leaving stop (table `TRAVEL`, defaults `BASE`). `betaEase(a, b)` is the closed-form CDF of u^a (1-u)^b: zero rate at both ends, peak at a/(a+b). `TravelShape.turn(qa, qb, u)`: the view axis follows the great circle from the leaving to the arriving axis with the pan ease, plus a sideways bow (sin^2 of the pan, zero at both ends), and the roll is its own slerp between the two swing-transported orientations with the roll ease. `inFrame` is an exact frustum test.
- `film.ts`: `travelCamera(index, time)`: position = approach(x) + (leaving(time) - approach(0)) * settleLeft(x) with x = ramp(clear, 1, u); the approach uses `e = shape.grow(x)` so its logarithmic rate starts at zero. `clearOf(i, shape)`: first u at which the leaving body, rings and moons are out of frame under the new turn.
- Auto bow: if a travel's clear time with the table's bow is later than `clearBy` (0.34), the director tries bows from -24 to 24 in steps of 2 and takes the one nearest the table's bow whose clear time is within 0.02 of the best. Today that changes mars (bow 10 to -16, clear 0.41 to 0.30, Phobos no longer crosses the frame) and saturn (bow 8 to 20, clear 0.61 to 0.37, Titan no longer crosses). It follows the plans, no number copied.
- Sky lock (`LOCK_PX` 3 to 40 px of radius at 1080 lines): in a travel the arriving set is rotated about the camera, per time sample, by slerp(identity, q_sample * q_mid^-1, lock), so a far body holds still on the sky across the shutter like the stars do (they are drawn at the middle of the shutter). At one sample per frame nothing changes.
- Point phase: the grow and pan eases are set so the next body is in frame about 10 frames before it passes 10 px (mercury pan [2,5] grow [3,3], earth panSpan [0,0.9] grow [3,4], uranus pan [2,5] grow [4,3]).
- Draft sheets `out/work/travel/cam1/` (05:30): all eight read as turn away, open sky, point, disc, hero. sun.travel: the swap from the Sun set to the sky's disc happens in frames 477 to 488 (orange granules to a white disc), check it at review.
