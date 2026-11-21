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
- 05:42 Review sheets `out/work/travel/cam2/` (mercury, saturn): fine. Review still 3927 (pan at 1.9 deg/frame, Uranus 1 px): with the sky lock the far point is one clean dot at its mid-shutter position. Dust at review read as thin sharp hairlines, all parallel in the pan (rain). Changed: core 0.85 + 0.9 seed px (was 0.62 + 0.6), extra falloff 1 / (1 + streak length / 24 px) so long pan streaks sink, `DUST.long`.
- Note for the report: commit 2fe2ec9 holds three topics in one commit (auto bow, sky lock, point phase). Keep later commits to one topic.

## Ending as built (05:50, uncommitted until the sheets are seen)

- `LOOKBACK` in `film.ts`, all values at the judged lookback frame (middle of `ending.lookback`), every rate constant in time so the move never stops, through the fade as well: `neptuneDeg 44` (angle Sun, camera, Neptune) growing 0.4 deg/s, `aimDeg 14` (the Sun sits 14 deg from the lens axis) falling 1.6 deg/s (0.055 deg/frame, about 1.7 px/frame), `distance 5.6` radii growing 1.5 percent/s, `rollDeg 13` growing 0.4 deg/s, `vfov 34`, `glare 3`, `flare 0.35`, `skyExposure 1`, `sky [0, 35, -5]` (along, tilt, lift: the galactic centre behind the Sun, band rising to the right).
- `lookback(t)` is the pose; the retreat blends from Neptune's exit pose into it as before, so the join retreat to lookback is continuous by construction.
- Sky: `aimSky()` adds `orbits[ending]`, fitted at the judged lookback frame. The ending uses it, and the orbit part of the last stop's rise (after its cover) uses it, the same rule every other stop follows for the next stop's sky.
- Measured: join rise to retreat turn 0.002 to 0.002, speed 1.01e-1 to 1.00e-1; retreat to lookback turn 0.055 to 0.055, fov 34, speed 8.88e-2 to 8.86e-2; lookback to fade 0.054 to 0.054. Retreat peak turn 1.61 deg/frame at 5084. Lookback turn 0.055 deg/frame all the way (was 0.03 falling to 0.01).
- Open: the engine draws a stop's sky patch with weight 1 in the ending kinds (`renderSample` in `engine.ts`: only `travel` and `rise` are special). With the real Neptune (it has a sky patch and its own aim) the patch would be drawn in the ending, pinned to a sky that has turned. That line is not the dust call, so it goes in `REQUESTS.md`.

## Log, continued (after the first compaction)

- 05:55 Sky lock v2 (167a49f): v1 only cancelled the camera's rotation across the shutter, so Jupiter's 1 px point at 2782 was still a 22 px streak from the parallax of the arrival swing. v2 rotates the arriving set about the camera so its direction in camera space equals the mid-shutter one. Review 2782: one round point with its glint; 2790: a small clean disc (`out/work/travel/lock2/`).
- 06:00 Dust (d7c9127, 8eb225e): forward lobe weaker (0.4 lobe^3 + 0.5 lobe^22), soft cap on a mote's peak brightness (`DUST.cap` 0.1: peak / (1 + peak / cap)), so short slow dashes no longer pop as scratches at 495. Retreat dust `sin^2(pi u) * 0.18` (was `sin * 0.6`): at 5085 the motes are barely there. Pictures `out/work/travel/dust3/`.
- 06:02 Merged origin/main 14ef8ca (engine batch 4: sky chain for a stop with no cover). One conflict in the imports of `film.ts`. New commit 3cedc19: when the last stop's rise has no cover (`sky.open`), the ending keeps that stop's sky instead of switching to its own aim in view.
- The looks tool on main now keeps every segment for a folder that is not a stop, so `--stop travel` is no longer needed (harmless).
- Checked the plans of the other agents' branches (src/stops only, in a scratch worktree, since removed): the probe gives the same picture (peaks 2.5 to 4.0 deg/frame, joins without a turn step). Saturn's present rise gives a speed step into `saturn.travel` (9.67e-2 to 8.00e-2 at 3885): its exit is still moving, check late. Mercury's plan on its branch has `sunGlare: 0.012` and its own sun plate (`src/stops/mercury/sunplate.ts`): the sky's disc is all but off at Mercury. Their assets are not complete in git, so no render of the real stops was possible here.
- 06:05 Sun disc (2cee692, then the wide look): for a wide disc (radius over about 4 deg: only the Sun's and Mercury's plans) no core dot, a white face with a warm limb, a wide glare. Gate `smoothstep(0.06, 0.085, uSunRadius)`, so Venus (3 deg), Earth (1.8) and Mars (1.1) keep their bits.
- 06:07 sun.travel rebuilt: the old cross-fade (Sun set to the sky's disc in frames 477 to 488) happened in view and the stand-in's set went dark brown before the white disc appeared. Now `hideSun()` in the constructor searches the bow (steps of 3, reach 90; the bow scales with the pan angle, 23 deg here) for the smallest one that takes the Sun's disc (set and sky disc, 1.2 radii) out of frame for at least 0.14 of the segment, and puts the swap in the middle 60 percent of that interval. Today: bow -75, swap frames 477 to 485, the Sun leaves over the top from 470, the glare comes back at the top from 488, the disc's edge is in the top right corner at 495, Mercury a point at 495, 1 px at 503. Peak turn 2.55 deg/frame (was 0.66). The sky's glare weight now rises from u 0.06 so the frames with the Sun out of view are not black. If no bow hides the Sun the old cross-fade (0.3 to 0.42) stays. Probe: `npx tsx assets-src/travel/sunswap.ts`.
- With Mercury's real plan (glare 0.012) the sky's disc will be nearly off at the hold; the swap is then from the Sun set to almost nothing, still out of view. Whether Mercury's own sun plate comes up in view in sun.travel must be checked when that stop is on main.

## Log, continued (after the second compaction)

- 06:30 Merged origin/main 9d33905 (engine batch 5, world pin: `pin()` runs after the place loop and before the shapes loop in the constructor). Proof on the merged head passed (`out/work/travel/b5/`). Review sheets of all eight travels in `out/work/travel/rev1/`.
- 06:36 Milestone 2 (the eight travels) reported. Turns changed: none.
- 06:40 Review sheets of the ending (`out/work/travel/rev1/ending.*`): retreat pulls away past Triton and turns back, the cover of the sky is not visible as a step (the sky goes from Neptune's to the lookback's between 5079 and 5090 while Neptune fills the turn), lookback holds the Sun in the band with the crescent at the left edge and drifts the whole time, fade ends black at 5399. Weak: at 5090 Neptune is dark and partly out of the top for about 10 frames before it settles left.
- 06:49 Final stills of the judged frames in `out/work/travel/fin1/`. 1618 at final: the limb of Venus leaving at 2.6 deg/frame is smooth (the blocky look was the review sample count).
- 06:52 Builder: batch 6 on main (45d1651) holds milestone 2 and request 1 (no sky patch of the last stop in the ending kinds). Merged (fast forward). Builder's list: (1) jupiter.travel 3335 to 3355 and venus.travel 1625 to 1639 are black frames with a few dim stars, the dust must carry them; (2) saturn.travel 3919 the same; (3) the broken ring arc of Uranus at 3939 is the stand-in, left to the Uranus agent.
- 07:05 Dust rebuilt for that (44f7f8b, b852c53, d41804e). What changed and why:
  - Near layer: a share `DUST.near` (0.35) of the motes wraps in a small box (`nearSpan` 2.4 instead of `span` 7), so about ten times more motes sit close to the lens where they are large, soft and move fast. Count 4500 to 12000 (engine.ts).
  - Streak: flow speed 2.6 to 0.9 (shorter streaks from the camera's own speed, still the logarithm of the real speed), and only a share `DUST.pan` (0.3) of the camera's rotation across the shutter goes into the streak. With the full rotation every mote was a long parallel hairline in a pan (rain, scratches); with none the motes were dots. Stars carry no pan streak either.
  - Shape: the streak tapers toward both ends (1.5 (1 - t^2)), the out of focus disc has a soft edge (was a hard rimmed disc that read as a pill), bokeh look starts at a larger radius (6 to 14 px).
  - Brightness: gain 55 to 150, cap 0.1 to 0.4, core spread 0.9 to 1.6 px, near fade 0.06 to 0.2.
  - Retreat amount 0.18 to 0.045 so the retreat keeps its barely there motes.
  - Pictures: `out/work/travel/d6f/pair-3342.png`, `pair-1632.png`, `pair-3919.png` (before and now at review, 1280 wide each); trials d6a to d6e at draft.
  - Not done: choosing the bow so the Milky Way crosses the open part. It needs the sky's brightness on the CPU (the sky texture is not read back anywhere today) and the bow is already used to clear moons; the dust now carries those frames.
- 07:12 Proof on the dust head passed (`out/work/travel/b6/`): 9895a050abe22d0c, a7e1670abf3e4a24, 0a022282c24d2285, 79352ec57fa5c00b. Milestone 3 (the ending) reported with the dust pairs.
- 07:20 Review sheets with the new dust in `out/work/travel/rev2/` (jupiter, venus, saturn, sun travel): the open sky frames carry motes that drift and streak with the flight, no frame is empty. Final stills of the ten judged frames with the new dust in `out/work/travel/fin2/` (17 to 70 s each).
- R4 read against the sheets: no jump in direction, speed or lens at any join (probe), leaving bodies blur smoothly at final, far points hold still (sky lock), stars hold still when the camera does. Left for the check with the finished stops: the speed into `saturn.travel` from Saturn's final rise, Mercury's own sun plate against the sky's disc in `sun.travel`, the lookback values against the real Neptune, 5090 to 5101 in the retreat.
