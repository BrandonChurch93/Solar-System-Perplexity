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
