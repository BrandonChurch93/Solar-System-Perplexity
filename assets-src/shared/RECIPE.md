# Shared assets

## public/assets/shared/full/sky.jpg and public/assets/shared/web/sky.jpg

- Tool: `python3 tools/spike-assets.py` (numpy and Pillow, no model).
- Inputs: `seed` from `config/showcase.json`.
- Prompt: none.
- What it does: a seeded dark glow band at `assetSets.<set>.skyWidth`. It is the Phase 0 stand-in for the sky glow and is replaced when the sky is graded.
- Take kept: the only one.
- Checks: no stars baked in, file size under `repo.maxFileMb`.
