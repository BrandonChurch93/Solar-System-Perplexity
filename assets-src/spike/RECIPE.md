# Spike stand-in

A stand-in used only by the Phase 0 spike scene. It is replaced in Phase 2.

## public/assets/spike/full/wrap.jpg and public/assets/spike/web/wrap.jpg

- Tool: `python3 tools/spike-assets.py` (Pillow, no model).
- Input: `references/approved/mars-hero.png`.
- Prompt: none.
- What it does: crops the centre of the hero image, resizes it and mirrors it into an equirectangular image at `assetSets.<set>.wrapMapWidth`.
- Take kept: the only one. It is a stand-in for measuring load time and memory.
- Checks: file size under `repo.maxFileMb`.
