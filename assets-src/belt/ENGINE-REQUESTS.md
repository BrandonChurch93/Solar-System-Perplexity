# Engine requests from the belt module

The first request (the hook of the belt in `src/core/engine.ts`) is on main since 3523b45 and is closed. The dust order request is on main since ffe0a2d (engine batch 10). It is written out again below because the travel agent is rebuilding `src/space/dust.ts`: whatever the new dust looks like, the order has to survive.

## Dust order against the rocks (`assets-src/belt/dust.patch`)

State on main bf74284 (checked Nov 21, task 3): `git diff origin/main -- src/core/engine.ts src/space/dust.ts` is empty on `agent/belt`, and `git apply --reverse --check assets-src/belt/dust.patch` passes on main. So the exact patch against main bf74284 is empty: nothing to apply today. The belt agent did not touch `src/space/dust.ts` or `src/space/travel` in task 3.

`assets-src/belt/dust.patch` is the change itself with the context lines of bf74284: it applies with `git apply` to main bf74284 with the dust order taken out (made by taking the two files of bf74284, reversing the old patch, and `git diff` back). If the rebuilt dust drops the order, this is what to put back; if the rebuilt file moves the lines, the five parts under "The change" are the whole of it.

What the belt gives and what the dust must do with it, unchanged from task 2:
- `Belt.cover(shot)` returns `null` or `{ mask, rocks }`. `mask` is the belt layer of this film frame (alpha is the coverage of the rocks, with their motion blur and focus blur). `rocks` holds one sphere per drawn rock (centre in the camera space of the shutter middle, radius in flow units), at most five.
- New in task 3: every rock now carries the blur of its own screen motion, and the near rock passes at 0.5 to 0.9 units with a streak of 60 to 90 px. Its mask is therefore wide and soft, and the sphere test with a margin of 1.25 radii covers the solid part of it. A mote behind the near rock that sits in the outer part of the streak is not dimmed. Seen at native size this is not visible (the streak there is under a third opaque).

### What is wrong without it
The dust is drawn after the belt, additive, without a depth test, so every mote draws over every rock. In the flow space of the travel the motes live within 3.5 units of the camera (the near layer within 1.2). The near rock passes at 1.05 to 0.8 units and the hero at 3.5 to 3.1, so motes that are farther than the near rock (most of them) show on its face.

### The change
1. `src/core/engine.ts`, one line: `this.dust.render(r, this.sampleTarget, this.director!, shot, view, this.belt.cover(shot))`. `Belt.cover(shot)` returns `null` outside `mars.travel`, in raw diagnostic views and in frames where no rock is drawn; otherwise `{ mask, rocks }`: the belt layer of this film frame (alpha is the coverage of the rocks with their motion blur and focus blur) and one sphere per drawn rock (centre in the camera space of the shutter middle, radius in flow units).
2. `src/space/dust.ts`:
   - `Dust.render` takes an optional last argument `cover: DustCover | null = null`.
   - A second material `masked` with the same shader source and `defines: { OCCLUDE: 1 }`, sharing the uniform objects of the first, plus `uMask` and `uRock[5]`. The mesh uses it only when `cover` is not null.
   - Under `#ifdef OCCLUDE` the vertex shader sets `vBehind = 1` for a mote whose distance along its ray is past the front of a rock sphere and whose ray passes within 1.25 radii of the centre (the margin covers the focus blur and the smear of the near rock). The fragment shader multiplies the colour of such a mote by `1 - alpha` of the belt layer at the pixel (read inside a one pass `for` loop with `textureLod`, so fragments of motes in front pay nothing in the software rasterizer).
   - So a mote behind a rock is hidden where the rock covers it and fades across the rock's soft edge; a mote in front of every rock draws as before.

### Why other frames keep their bytes
With `cover === null` the mesh uses the first material, whose shader source without the define is the text main has now, so the program is the same and so are the pixels. Measured on this VM at the draft tier, plain main against the branch with the patch: see `NOTES.md` (frames 2325 and 2580, and 2212, the middle of earth.travel, as a travel frame with dust and without the belt).

### Limits
- One mask for all rocks: a mote that is behind the near rock by the sphere test is hidden by the alpha of whatever rock is at its pixel. With the first margin of 2.5 radii this hid 81 pixels of motes over far1 in the final 2782 (far1 is at 11 units, past all dust, so those motes are in front of it). The margin is now 1.25 radii, so it can only happen in the few frames where far1 passes right beside the near rock (2784 to 2787).
- A rock is tested as a sphere of its largest radius; the edge is exact because the mask is the drawn alpha.
- The streak of a mote is tested as a whole at the middle of the shutter.

## What the module needs from the engine and the director
- `director.shotAt(frame, time)`: the belt samples the shutter itself with its own time steps (12 to 64 per rock). It builds its layer once per film frame, at engine sample 0, and composites the same layer in every engine sample. Every time step is drawn with the camera of its own time, so the layer holds each rock's full screen motion as blur.
- `Flow` from `src/space/travel/flow.ts` (read only): the rocks live in the flow space of the dust, so they shift against the stars with the same travel as the motes.
- From the shot: `segment`, `camera` (quaternion, vfov), `sun.dir`, `sun.color`, `sun.intensity`, `post.exposure`, `frame`, `time`.
- From the view: `format`, `sample`, `diag`, `camera.view` (jitter for the raw views).

## Cost and memory to know about
- Texture memory of the full set with mipmaps: about 36.7 MB. `belt.bytes` reports it together with the render targets.
- Render targets, alive only while a frame of `mars.travel` is prepared: three half float targets of the frame plus a border of 96 px on each side and one layer target of the frame size, about 92 MB at 1920 x 1080.
- The layer is built once per film frame, so the cost does not grow with the tier's sample count. Up to 64 draws per rock plus the blur passes.

## Tests
- The repo vitest config only includes `tests/`, which the belt agent does not own. The belt test is `assets-src/belt/belt.test.ts`, run with `npx vitest run --config assets-src/belt/vitest.config.ts`. Move it to `tests/` at integration.
- `npm run looks -- --push --folder belt` rejects `belt` because it is not a stop id; looks are pushed with `assets-src/belt/pushlooks.ts`.
