# Saturn stand-ins

Stand-ins for the Phase 2 blockout. Each is replaced when the stop is built.

## public/assets/saturn/full/standin-wrap.jpg and public/assets/saturn/web/standin-wrap.jpg

- Tool: `python3 tools/assets/standin.py saturn` (numpy and OpenCV, no model).
- Inputs: `references/approved/saturn-hero.png`, `assets-src/saturn/fit.json`.
- Prompt: none.
- What it does: unprojects the approved hero image onto the fitted sphere as an equirectangular map, 4096 wide for `full` and 2048 wide for `web`. The part of the globe the image does not show is filled by mirroring the visible part about a circle at 0.9 of the limb angle. No cleanup: the light, the limb glow and anything in front of the globe stay baked in.
- Take kept: the only one.
- Checks: the judged `hold` frame lines up with the approved hero image in `npm run compare`.

## public/assets/saturn/full/standin-close.jpg and public/assets/saturn/web/standin-close.jpg

- Tool: `python3 tools/assets/standin.py saturn`.
- Input: `references/approved/saturn-close.jpg`.
- Prompt: none.
- What it does: the approved close image, re-encoded at its own size for `full` and resized to 2048 wide for `web`. Nothing is redrawn.
- Take kept: the only one.
- Checks: the judged `terrain` frame lines up with the approved close image in `npm run compare`.
