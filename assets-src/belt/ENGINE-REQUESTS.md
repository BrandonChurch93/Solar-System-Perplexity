# Engine requests from the belt module

One shared file is touched: `src/core/engine.ts`, five lines. The exact change is `assets-src/belt/engine.patch` (made with `git diff origin/main -- src/core/engine.ts`). It is never committed on `agent/belt`; apply it with `git apply assets-src/belt/engine.patch`.

## The five lines
1. `import { Belt } from '../space/belt/belt'`
2. A field on `Engine`: `readonly belt = new Belt()`
3. In `prepare(frame)`, after the sets: `await this.belt.prepare(frame, this.assets, this.renderer)`. Loads the belt assets of the active set when `frame` is inside `mars.travel`, frees them when it is outside.
4. In `renderSample`, after the near scene and before `if (raw) return`: `this.belt.render(r, this.sampleTarget, this.director!, shot, view)`. In beauty views it composites the belt layer over the sample target (premultiplied over, alpha written, so rocks hide sky, planets and stars and sit under dust, cover and post). In raw diagnostic views it draws the rock meshes with `diagOut` after a depth clear.
5. In `ready(frame)`: `&& this.belt.ready(frame, this.assets)`. True outside `mars.travel`; inside it, true once the assets of the active set are loaded.

## Why frames outside mars.travel keep their bytes
- `Belt.render` returns on its first line when `shot.segment.id` is not the id in `src/space/belt/belt.json` (`mars.travel`). It then touches no GL state: no target switch, no clear, no draw.
- `Belt.prepare` outside the segment only disposes what the belt owns; `Belt.ready` returns true.
- Proof by render is in `NOTES.md` (four frames at the final tier, sha256 before and after).

## What the module needs from the engine and the director
- `director.shotAt(frame, time)`: the belt samples the shutter itself with its own time steps (12 to 64 per rock), so its motion blur does not depend on the tier's sample count. It builds its layer once per film frame, at engine sample 0, and composites the same layer in every engine sample.
- From the shot: `segment.id`, `camera` (position, quaternion, vfov), `sun.dir`, `sun.color`, `sun.intensity`, `post.exposure`, `dustOffset`, `frame`.
- From the view: `format`, `sample`, `diag`, `camera.view` (jitter for the raw views).

## Things the Builder may want to change at integration
- The engine could own the field privately; it is `readonly` and public only so tools can read `belt.bytes`.
- The belt is not a set in `SetLoader`; it loads `./assets/shared/belt/<full|web>/` itself. Its texture memory is `belt.bytes`.
- `npm run looks -- --push --folder belt` rejects `belt` because it is not a stop id; looks were pushed with `assets-src/belt/pushlooks.ts`.
- The travel dust offset moves dust toward Jupiter by my probe (flow direction dot Jupiter direction is +0.987). The rocks use the same closed form with the sign flipped (`flow: -1` in `belt.json`).

## Cost and memory to know about
- Texture memory of the full set with mipmaps: about 36.7 MB (normal and tone cubes 30.9 MB, radius and occlusion cubes 4.35 MB without mipmaps, detail tile 1.4 MB). `belt.bytes` reports it together with the render targets.
- Render targets, alive only while a frame of `mars.travel` is prepared: three half float targets of the frame plus a border of 96 px on each side (2112 x 1272 at the master size, 21.5 MB each, one with a depth buffer) and one layer target of the frame size (16.6 MB). About 92 MB at 1920 x 1080. They are freed with the assets when `prepare` sees a frame outside the segment.
- The layer is built once per film frame (engine sample 0), so the cost per frame does not grow with the tier's sample count. In a live (real time) mode the layer is rebuilt every displayed frame: up to 64 draws of a 128 grid cube sphere per rock plus the blur passes. If the live mode needs it cheaper, lower `steps.max` in `belt.json`.
- Dust is drawn after the belt, so motes pass in front of the rocks. That is correct for the near motes and wrong for motes farther than a rock; at this dust density it shows as a few faint points over the dark side of the hero rock.

## Tests
- The repo vitest config only includes `tests/`, which the belt agent does not own. The belt test is `assets-src/belt/belt.test.ts`, run with `npx vitest run --config assets-src/belt/vitest.config.ts`. Move it to `tests/` at integration.
