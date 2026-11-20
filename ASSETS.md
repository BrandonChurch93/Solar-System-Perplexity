# Assets ledger

One row per third-party file that the app ships or that fed a generated asset. The rules are in `AGENTS.md` and `kit/06-ASSETS.md`.

| File | What it is | Source URL | License | Credit line | Date fetched |
| --- | --- | --- | --- | --- | --- |
| `references/cache/models/swin2sr-lightweight-x2.onnx` (not committed, not shipped) | Weights used by `tools/ml/upscale.py` to add resolution to approved images | https://huggingface.co/Xenova/swin2SR-lightweight-x2-64 | Apache-2.0 | none required | 2026-11-19 |
| `references/cache/models/depth-anything-v2-small.onnx` (not committed, not shipped) | Weights used by `tools/ml/depth.py` to estimate depth for relief | https://huggingface.co/onnx-community/depth-anything-v2-small | Apache-2.0 | none required | 2026-11-19 |

Pinned download URLs and hashes for both are in `tools/ml/MODELS.md`.

## Not third-party

- The images under `references/approved/`, `references/drafts/` and `references/style-pass/` were generated for this project in the reference run. Their prompts and inputs are recorded beside them.
- The photographs under `references/_real/` were inputs to the reference run. Their sources are in each folder's `sources.json`. They are not shipped in the app and no more are to be committed.
