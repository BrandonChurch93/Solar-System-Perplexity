# One place, one move

The working spec for the review note of 2026-11-23. The plan it serves is in `kit/PROGRESS.md`, section "Review note of 2026-11-23". This file is for the agents that build it. Where this file and the kit's cover rules disagree (`kit/03-METHOD.md` "The cover", the cover lines in `kit/02-STOPS.md`), this file wins, because Brandon's note outranks them. Every other rule in `AGENTS.md` and the kit stands.

## The note

Brandon, 05:57 UTC on 2026-11-23, after watching the frozen build:

> The main issue I have is the transitions between the planet view and the moment before the surface view comes in, it's a blurry mess, and it's obviously a transition. I think the goal would be to make it seamless. Like there's actually a place on the planet that the camera's going to
>
> Hey next, the surface for Jupiter, and Saturn both look completely weird. It looks like an image that is being stretched and contorted it shouldn't look like that. It should look like it's actually generated out of code.

## What is wrong now

Measured on the frozen build (commit 567b3a55):

- Every dive hardly moves for about 40 of its 90 frames, then crosses a factor of about 30 in scale in about 12 frames under heavy blur, then a full screen haze of 16 frames (31 on Venus) hides a swap from the globe scene to the close scene. The rises do the same in reverse.
- The ground on the way down is not the ground the camera lands on. The deepest patches on the globes were drawn in the style of the close images, not made from them.
- The globe is met at the wrong height and angle. Mars arrives at 0.032 radii, while the horizon of its close view (`terrain.dipDeg` 2.6) belongs to a height near 0.001. The curve and the tilt of the horizon jump under the haze.
- Jupiter's surface view is the close image as a relief pushed along a flow field, so it bends like a picture. Saturn's is a flat disc with one dimensional streaks, a hard outer edge and no depth.

## The rule

In every frame of a dive and a rise the picture shows a place on the body that the camera is flying to or leaving. No frame reads as a transition: no wash of one colour, no wall of fog, no smear, no stall followed by a rush, no change of picture. A viewer who steps through the frames one by one must not be able to name the frame where the scene changes.

A cover element that belongs to the world (a real cloud layer the camera passes) is allowed only as a thing in the scene: it has structure, it moves past with the right parallax, the place stays visible through or around it, and it never fills the frame with one colour.

## Words

- Globe side: the stop's set drawn in the `orbit` view, on the unit sphere.
- Close side: the stop's set drawn in the `terrain` view.
- Handover: the moment T where a dive stops being drawn from the globe side and starts being drawn from the close side. In a rise it is the other way round.
- Twin: the globe side camera at T. It is the camera of the close side at T, carried onto the sphere: same field of view, same picture.
- Place picture: the close side drawn at T, kept in a texture.
- Plates: top down pictures of the place, made from the approved close image, that sit on the globe as the deepest levels of its patch pyramid.

## Part A. The engine (owner: `handover_engineer`)

Folders: `src/director/`, `src/core/`, `src/bodies/`, `src/terrain/`, `src/post/`, `src/diagnostics/`, `tools/`, `tests/`, the new `handover` block in `config/showcase.json`, a new script line in `package.json`, and the three Mars folders `src/stops/mars/`, `assets-src/mars/`, `public/assets/mars/`. Branch `agent/engine-handover`, started from `origin/main`, looks on `agent/engine-handover-looks` (`--folder engine-handover`).

Everything here must leave a stop that has not opted in exactly as it is: same pixels, same cover. A stop opts in through its plan (E1). Main must build and render all nine stops at every commit.

**E1. Sides per shutter sample.** New file `src/director/handover.ts`. The names below are a contract: the stop builders code against them from the first hour. Add to them freely, change one only after telling every builder.

```ts
export interface HandoverTimes { at: number; dissolveFrames: number; placeFrames: number }
export interface Handover { time: number; firstFrame: number; lastFrame: number; placeFirstFrame: number; placeLastFrame: number }
export function handoverOf(stop: string, kind: 'dive' | 'rise'): Handover | null
export function sideAt(seg: Segment, time: number): ViewKind
export function placeWeight(seg: Segment, time: number): number
export function forceSide(view: ViewKind | null): void
```

- `MoveParams` gets `handover?: { dive?: Partial<HandoverTimes>; rise?: Partial<HandoverTimes> }`. Its presence opts the stop in. `at` is the share of the segment where T lies; the defaults live in `config.handover` and start at the cover centres of today.
- `StopPlan` gets `divePose(time, view)` and `risePose(time, view)`. Both views must give a valid pose from the first frame of the place window to the last frame of the dissolve. `dive(time)` and `rise(time)` become `{ pose: this.divePose(time, v), view: v }` with `v = sideAt(seg, time)`. A custom plan overrides the two pose methods.
- `sideAt` decides per shutter sample, from `time` alone. With `s` the position of the sample inside the shutter (0 to 1) and `w` the dissolve weight at `time` (0 before `firstFrame`, 1 after `lastFrame`, a smooth ramp between), the sample is drawn from the close side when `w` is above `fract(s * 8 + floor(s * 8) * 0.618)`. Both sides then share every part of the shutter, so neither gets half a blur. In a rise the weight runs the other way. `dissolveFrames` may be as low as 1.
- `forceSide` is for the harness only (the measures in E4). It must not be reachable from the film path.
- For a stop that opted in: `coverAmount` is 0, `coverWindow(seg)` gives nothing (so G13 counts every frame of its dives and rises), and the added softness is off (`soft` 0) in its dives and rises. The softness and the cover stay as they are everywhere else, so no frame outside the changed segments changes.
- `framePlan` and `rawMotion` in `src/core/motion.ts` must measure motion per side when the shutter of a frame spans both.

**E2. The place picture on the globe side.** Near T the globe side must show the very picture the close side shows, so the two sides are one picture at T and the swap cannot be seen.

- The engine draws the close side at T (side forced, one fixed time, anti-aliased) into a texture, once per stop and kind, and keeps it. It is made at run time from the scene itself, so it follows every change to the close side and needs no asset and no recipe. Give it some margin: a larger size than the frame and a wider field than the frame, the amounts in `config.handover`.
- On the globe side, while `placeWeight` is above 0, a pass after the set and the sky lays that picture over the sample, before accumulation, in scene linear values, so the lens, grade and blur treat it like the rest. For a pixel whose ray meets the sphere, the point on the sphere is projected into the twin. For a pixel whose ray misses, its direction is projected into the twin as a point at infinity. At T the pass is the identity: the globe side equals the close side.
- The pass is used only where it is honest: where the point is in front of the twin and seen from it, inside the picture, and where the picture is not enlarged by more than `config.handover.maxEnlarge` (use the screen derivatives of the picture coordinate). Feather every limit. Outside it the globe's own surface shows, which is why the plates must agree with it.
- `placeWeight` rises from 0 at `placeFirstFrame` to 1 at the first frame of the dissolve (dive), and falls the same way in a rise.
- The `texels` view must count the place picture where it is drawn, so G13 stays a true measure.
- Things on the globe side that pass in front (a moon, rings) must be handled by the stop: gone from the frame, or drawn after the pass.
- The twin must be geometrically true, not only equal at T: the horizon of the place picture must lie on the horizon of the sphere as the twin sees it. That fixes its height (`1 / cos(dip) - 1` for a level close view) and its pitch and roll (the nadir seen by both cameras is the same direction in camera space; `StopPlan.horizon` already computes it for both views). Give the plans a helper that returns the twin for a close side pose.
- Light, exposure, sky exposure, sky turn, Sun radius, glare and flare must be one function of time through T. Where a value differs between the sides today, it ramps across the place window and is equal at T.

**E3. The steady descent, in the generic plan.** Remove the surge. The generic globe side path of a dive becomes:

- Height above the sphere falls by a ratio per frame that rises smoothly from the hold's own rate, stays near constant, and ends at the rate the close side has at T. No frame's ratio may exceed `config.handover.maxRateOverMean` times the mean of the dive. By one fifth of the way to T the ratio is at least half the mean. The hold's last frame is the dive's first pose and speed, as today.
- The place stays inside the middle of the frame until the camera levels out, on a smooth path with no jerk.
- At T the globe side pose is the twin, and its velocity and turn rate are those of the close side at T carried onto the sphere, so the ground under the camera moves at the same speed and in the same direction on both sides.
- The rise is the mirror: it leaves the close side's pose and speed at its T and climbs with a ratio per frame that never spikes, into the pose and speed of the travel that follows, as today.

**E4. Measures.** `npm run handover -- --stop ID [--kind dive|rise] [--tier T]`, written to `out/work/handover/`. It reports and judges against numbers in `config.handover`:

1. Side difference at T: both sides drawn at T with the side forced and the shutter closed, their difference as a picture and as numbers (mean and 99th percentile, in display values 0 to 255).
2. Flow gap at T: for a grid of screen points, the image motion of the ground per frame just before T on the globe side and just after T on the close side, and the mean and the largest difference in pixels.
3. For every frame of the dive and the rise: height, the ratio of height to the frame before, the screen position of the place, raw shutter motion at the frame centre and at the edge, and from a draft frame the mean level, the mean colour and the share of the body that is flat (local contrast under a floor). Judged: the rate limits of E3, no step in level or colour between two frames beyond a limit, no frame with a flat share over a limit.
4. A sheet of every frame from 12 before T to 12 after, at the draft tier with no blur, and the same at the review tier.

The measure must fail on the frozen build's Mars dive and pass on the new one. Set the limits from that.

**E5. Mars is the proof.** Mars opts in first. Its hold and terrain frames must not change: frames 2325 and 2580 are compared with `out/stills/f02325-mars.hold.jpg` and `out/stills/f02580-mars.terrain.jpg` and must be the same picture. Its plates are made as in Part B. Its Phobos pass must be clear of the place window or drawn after the pass.

**Order inside Part A.** First E1 with its tests, pushed and reported within the first hour, so the builders can take it. Then E2 on Mars. Then E3, E4, E5.

## Part B. Every stop (owners: the stop builders)

Folders: `src/stops/<id>/`, `assets-src/<id>/`, `public/assets/<id>/`. Branch `agent/<id>-place`, started from `origin/main`, looks on `agent/<id>-place-looks` (`--folder <id>-place`). If shared code must change, ask `handover_engineer` by message.

What may not change: the `hold` and the `terrain` segment of your stop (Jupiter's and Saturn's terrain excepted, see Parts C and D). Their judged frames must come out as the same picture as the kept stills in `out/stills/`. The timeline does not change.

**S1. Find the camera of the close view.** Solve the approved close image `references/approved/<id>-close.jpg` against the unit sphere at your spot: height from the dip and the curve of its horizon, heading, pitch, roll, field of view as the terrain view uses it. Write it to `src/stops/<id>/place.json` with how it was measured. This is the twin at the terrain view's judged frame; the twin at T follows from the close side's pose at T.

**S2. Lay the place onto the globe.** From that camera, lay the ground of the close view back onto the sphere as top down gnomonic plates around the place.

- Where the close image looks at the ground steeply the plate is sharp and is used as it is. Toward the horizon it stretches. Repaint the stretched parts so the plate reads as the same place seen from straight above: with image generation led by the laid back plate (at most `assets.maxTakesPerAsset` takes per asset per round, recipe in `assets-src/<id>/RECIPE.md`), or by code. Never a third party picture.
- Colour match each plate to the level above it at its edge and feather it. Nest the plates into the patch pyramid as its deepest levels. Rework the levels above them so a feature seen at one level stays where it is at the next. The plate may fade in with nearness, as patches do today, but nothing may pop or morph in view: let levels come in while they are small on screen.
- The pyramid must hold G13 on every frame of the dive down to where the place picture takes over, and of the rise from where it lets go.
- Check: a simulated top down dive sheet (the globe side alone, place picture off) from the hold to the twin, 12 frames, no blur. Every frame must look like one place coming closer.

**S3. Fly one steady move.** Rewrite your globe side dive and rise paths to the rules of E3. Use the generic path if it fits your stop, your own if not; the measures of E4 judge both the same way.

**S4. Take the handover.** Opt in (`handover` in your params), give both sides' poses across the windows, and bring light, exposure, haze, the Sun and the sky to one function of time through T. Choose T and the window lengths for your stop. Remove your cover: no veil, no pall, no flare, no glare that fills the frame.

**S5. The rise.** The same in reverse, on its own line, with its own T. The place must still be seen as a place on the body as the camera leaves.

**Proof to push with each milestone.** The E4 report for dive and rise; the dense sheets across both handovers at the draft tier (sharp frames show every fault) and at the review tier; your four judged frames beside the kept stills; the top down dive sheet of S2. Look at every frame of every sheet yourself before you report, and write what is still wrong.

## Part C. Jupiter's surface view from code (owner: `jupiter_coder`)

Folders: the three Jupiter folders. Branch `agent/jupiter-code`, started from `origin/main`, looks with `--folder jupiter-code`. The terrain view (frames 3060 to 3239, judged at 3150) is rebuilt. No image is pushed through a flow field, and no picture is bent, warped or scrolled to make motion.

- The scene is a cloud deck in true 3D on the sphere at the red storm: a flow field (zonal jets, the storm's own turning, small eddies between them), cloud structure that comes from functions or from a simulation run by a tool in `assets-src/jupiter/` whose fields are stored, carried by that flow without ever stretching (detail is made again at every scale, it is not dragged), cloud tops with real height, light from the Sun with shadows cast by the tops, haze that deepens toward the limb, and the limb itself.
- The camera flies over it: clear forward movement and depth through all 180 frames. Near tops pass faster than far ones. The storm turns.
- The approved close image `references/approved/jupiter-close.jpg` sets the composition, the palette and the light at frame 3150: the storm's place, size and tilt in the frame, the curve and the angle of the horizon, the cream and rust bands, the blue grey turbulence in the lower right, the thin blue limb, the dark sky. The exact cloud shapes do not have to match it. It has to look as rich.
- The storm on the globe in the hold is the storm the dive goes to. If one scene can draw both the globe side and the close side from the same functions, no swap is needed. Otherwise Part B applies.
- Dive and rise follow the rule and Part B's S3 to S5.
- The hold must stay the same picture.

## Part D. Saturn's surface view from code (owner: `saturn_coder`)

Folders: the three Saturn folders. Branch `agent/saturn-code`, started from `origin/main`, looks with `--folder saturn-code`. The terrain view (frames 3630 to 3809, judged at 3720) is rebuilt. No stretched texture, no flat disc.

- The ring plane in true 3D. Its radial structure comes from functions at every scale (broad plateaus, gaps, ringlets, waves), filtered for the pixel so it never shimmers and never smears into streaks. Near the camera the sheet is made of ice: particles with size, depth and their own orbital speed, which merge into the sheet with distance without a seam. The plane has a soft thickness and no hard outer edge anywhere in frame.
- Light by the angle to the Sun (the lit face, the glow seen through thin parts, the dark gaps), the globe's shadow across the rings, the rings' shadow on the globe, and the true globe where the rings pass in front of and behind it.
- The camera skims the plane: clear forward movement and depth through all 180 frames, ice passing close with parallax, the globe ahead.
- The approved close image `references/approved/saturn-close.jpg` sets the composition, the palette and the light at frame 3720.
- `kit/02-STOPS.md` already says of Saturn: no cover is needed while the terrain view is true 3D, the dive is one continuous move. Make it so: one scene from the hold to the skim if it can be done, else Part B.
- The hold must stay the same picture.

## Rules for every agent on this work

- Read `AGENTS.md`, `kit/addenda/` and the kit files it names for your part before you change anything. The rules on determinism, config values, recipes, file sizes, copy (no em dashes, no exclamation points, no model names) and shader limits all hold.
- Work only in your folders. Push to your branch. Never push to `main`. Merge `origin/main` into your branch when told that something landed.
- Push looks at least every 30 minutes with `npm run looks -- --push --folder <name>`: the newest frames of what you are changing, good or bad.
- Iterate at the draft tier, prove at the review tier. Motion is judged on consecutive frames, never on single stills.
- Report to `/root` by message at each milestone and when blocked: branch, commit, what to look at, what is still wrong. Keep it short. Do not wait for an answer unless blocked; go on to the next step.
- A report is checked through the harness before it is taken. Say only what you measured.
