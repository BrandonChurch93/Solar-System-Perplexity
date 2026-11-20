# Assets ledger

One row per third-party file that the app ships or that fed a generated asset. The rules are in `AGENTS.md` and `kit/06-ASSETS.md`.

| File | What it is | Source URL | License | Credit line | Date fetched |
| --- | --- | --- | --- | --- | --- |
| `references/cache/models/swin2sr-lightweight-x2.onnx` (not committed, not shipped) | Weights used by `tools/ml/upscale.py` to add resolution to approved images | https://huggingface.co/Xenova/swin2SR-lightweight-x2-64 | Apache-2.0 | none required | 2026-11-19 |
| `references/cache/models/depth-anything-v2-small.onnx` (not committed, not shipped) | Weights used by `tools/ml/depth.py` to estimate depth for relief | https://huggingface.co/onnx-community/depth-anything-v2-small | Apache-2.0 | none required | 2026-11-19 |
| `references/cache/sky/milkyway_2020_8k_gal.exr` (not committed, not shipped; feeds `public/assets/shared/full/sky.jpg` and `public/assets/shared/web/sky.jpg`) | Starless Milky Way diffuse background in galactic coordinates from Deep Star Maps 2020 (8192 x 4096 linear OpenEXR, SHA-256 `d319113f35e45f7f66f2844f088639cc07cda74a5049299a6098d41e2ade3d28`) | https://svs.gsfc.nasa.gov/4851 | Public domain per the studio help page ("All of our content is in the public domain (unless otherwise noted), meaning that it is free to download, use, and redistribute for whatever purposes you see fit."); commercial use must not imply agency endorsement (https://www.nasa.gov/nasa-brand-center/images-and-media/); Gaia data "are open and free to use, provided credit is given to 'ESA/Gaia/DPAC'" (https://gea.esac.esa.int/archive/documentation/GDR2/Miscellaneous/sec_credit_and_citation_instructions/) | NASA/Goddard Space Flight Center Scientific Visualization Studio. Gaia DR2: ESA/Gaia/DPAC. | 2026-11-19 |

Pinned download URLs and hashes for both are in `tools/ml/MODELS.md`.

## Not third-party

- The images under `references/approved/`, `references/drafts/` and `references/style-pass/` were generated for this project in the reference run. Their prompts and inputs are recorded beside them.
- The photographs under `references/_real/` were inputs to the reference run. Their sources are in each folder's `sources.json`. They are not shipped in the app and no more are to be committed.
