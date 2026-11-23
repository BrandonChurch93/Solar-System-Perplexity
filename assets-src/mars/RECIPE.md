# Mars stand-ins

Stand-ins for the Phase 2 blockout. Each is replaced when the stop is built.

## public/assets/mars/full/standin-wrap.jpg and public/assets/mars/web/standin-wrap.jpg

- Tool: `python3 tools/assets/standin.py mars` (numpy and OpenCV, no model).
- Inputs: `references/approved/mars-hero.png`, `assets-src/mars/fit.json`.
- Prompt: none.
- What it does: unprojects the approved hero image onto the fitted sphere as an equirectangular map, 4096 wide for `full` and 2048 wide for `web`. The part of the globe the image does not show is filled by mirroring the visible part about a circle at 0.9 of the limb angle. A moon that sits in front of the disc is painted out first, because a stand-in sphere takes its place: a patch of the same globe from beside the moon is copied over its fitted circle with OpenCV seamless cloning. No other cleanup: the light, the limb glow, rings and shadows stay baked in.
- Take kept: the only one.
- Checks: the judged `hold` frame lines up with the approved hero image in `npm run compare`.

## public/assets/mars/full/standin-close.jpg and public/assets/mars/web/standin-close.jpg

- Tool: `python3 tools/assets/standin.py mars`.
- Input: `references/approved/mars-close.jpg`.
- Prompt: none.
- What it does: the approved close image, re-encoded at its own size for `full` and resized to 2048 wide for `web`. Nothing is redrawn.
- Take kept: the only one.
- Checks: the judged `terrain` frame lines up with the approved close image in `npm run compare`.

# The place under the dive (brief 238)

The ground on the globe under the place the dive flies to. All tools are in `assets-src/mars/place/`, their values in `assets-src/mars/place/plates.json`; the log is `assets-src/mars/PLACE-NOTES.md`. No third party picture is used: the inputs are the close view as the engine draws it at T and the patch levels of the globe.

## public/assets/mars/{full,web}/place-8p5.jpg, place-3p8.jpg, place-1p6.jpg, place-0p7.jpg, place-0p3.jpg, patch-42.jpg, patch-19.jpg, patch-wide.jpg

- Chain: `sh assets-src/mars/place/dump.sh` (the close side at T as the engine draws it, and the twin cameras, `geometry.ts`), then `sh assets-src/mars/place/plates.sh lay force bake`.
  - lay: `dehaze.py` takes the air out of the close side picture; `layback.py` lays it back onto the unit sphere from the dive twin as top down gnomonic plates of 3.8, 1.6, 0.7 and 0.3 degrees.
  - force: every plate from 3.8 degrees down is the plate above, cropped, with its take nested (`nestbase.py`, tone matched at the rim), then held to the picture (`force.py`): where the twin sees the ground steeply the lay back is used as it is, where it stretches the take stands and only its tone is drawn to the picture, fading with the stretch.
  - bake: `bake.py` nests the plates from the deepest up, feathers and tone matches each to the plate above at its rim, bends highlights over, writes the JPEGs of both sets (94, 4:4:4, web at half size) and `src/stops/mars/levels.json`. The 8.5 degree plate is nested into new lit levels of 19 and 42 degrees made from the levels of main 03510ddd (albedo = look / light) and at half share into patch-wide.
- Takes: image generation through the skill media (default route, square, 1254 px out), two input images each: the lead (image 1) and the close side picture at T (image 2, `out/work/place/gen/dive-picture.jpg` from dump.sh). Takes enlarged two times with `python3 tools/ml/upscale.py --width 2508 --tile 448` where a file ends in `-x2`. Leads, prompts and kept takes are in `assets-src/mars/place/takes/`.

| Plate | Lead (tool, inputs) | Prompt | Takes used | Kept |
| --- | --- | --- | --- | --- |
| 8.5 deg | `filllead.py --above toned-8.5.png,8.5 --width-deg 8.5 --grey 0.07,0.27,0.93,0.66 --inset p12-take1.png,1.2` (the old land of the globe with a grey band across the middle and a sample of the place at its true size) | `p85-prompt.txt` | 1 of 6 | `p85-take1.png`, `p85-take1-x2.png` |
| 3.8 deg | `filllead.py --above p85-take1.png,8.5 --width-deg 3.8 --grey 0.08,0.08,0.92,0.92 --inset p12-take1.png,1.2` | `p38-prompt.txt` | 5 of 6 (four for an earlier plate of 3.25 degrees with `p3-prompt3.txt`, lead `p3-lead3.png`; its take 4 is no longer used) | `p38-take5.png`, `p38-take5-x2.png` |
| 1.6 deg | `ringlead.py` (held plate inside the fan, grey around, a rim of the plate above): `p12-lead.png` | `p12-prompt.txt` | 1 of 6 | `p12-take1.png` |
| 0.7 deg | `ringlead.py`: `p06-lead.png` | `p06-prompt.txt` | 1 of 6 | `p06-take1.png`, `p06-take1-x2.png` |
| 0.3 deg | none: a crop of the 0.7 plate held to the picture | none | 0 | |

- Checks: `topdown.py` (the pyramid seen from straight above at a row of widths), `predict.py` (G13 per frame from the cameras), `memory.ts` (bytes of both sets), the dense sheets of `npm run handover`, `tools/samebytes.ts` (kept frames keep their bytes).

## src/stops/mars/near.json

- By hand against the film frame at T: the haze and the glow of the globe side close to the ground, compared in bands of the frame with the close side at frame 2454 (`out/work/place/bands.py`). No generated input.
