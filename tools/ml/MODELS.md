# CPU image tools

Run with Python 3.11 or newer and install the packages in `tools/ml/requirements.txt` if missing. Check free disk before installing. The scripts select the ONNX Runtime CPU provider and limit inference to two threads. On first use, the scripts verify and cache the model below `references/cache/models/`. Later runs verify the cached file again. Model binaries are not committed.

## Models

| Job | Checkpoint and license | Pinned ONNX download | SHA-256 |
| --- | --- | --- | --- |
| Upscale | Swin2SR Lightweight 2x, Apache-2.0, per the [official project and listed lightweight checkpoint](https://github.com/mv-lab/swin2sr#license-and-acknowledgement). The [ONNX model card](https://huggingface.co/Xenova/swin2SR-lightweight-x2-64) identifies the [base checkpoint](https://huggingface.co/caidas/swin2SR-lightweight-x2-64). | [model.onnx](https://huggingface.co/Xenova/swin2SR-lightweight-x2-64/resolve/92a21aca5713f20faf9a87590cdfbdce2e34112c/onnx/model.onnx) | `c2abbfe0cc8e685b5e11964970f8ebe3d24072e904fd5545a30ac31ec1e110db` |
| Depth | Depth Anything V2 Small, Apache-2.0, per the [official model card](https://huggingface.co/depth-anything/Depth-Anything-V2-Small) and [upstream model license statement](https://github.com/DepthAnything/Depth-Anything-V2#license). The [ONNX model card](https://huggingface.co/onnx-community/depth-anything-v2-small) identifies that same checkpoint. Do not use Base, Large or Giant. | [model.onnx](https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/4472b7362082ad9968fee890ca0f1e5aca36b93d/onnx/model.onnx) | `afb6a5c28f3b6bf1618c6e43f02073ef9dfdc70e937502d51603e57b0a1df10c` |

The classical 2x model kept the fine texture in the Mars rock crop. The comparison checkpoint, Real-ESRGAN General x4v3 with the [upstream BSD-3-Clause license](https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE), smoothed that texture into larger surfaces and was not retained. Classical super-resolution still estimates missing pixels, so compare each take with the approved input.

## Mars reproduction

```sh
WIDTH=$(node -p 'require("./config/showcase.json").assetSets.full.reliefWidth')
python3 tools/ml/upscale.py --in references/approved/mars-close.jpg --out out/work/mars-upscaled.png --width "$WIDTH"
python3 tools/ml/checkmoved.py --a references/approved/mars-close.jpg --b out/work/mars-upscaled.png --heatmap out/work/mars-flow.jpg
python3 tools/ml/depth.py --in references/approved/mars-close.jpg --out-prefix out/work/mars-depth
```

**Upscale:** `--tile` is the input tile edge. The model's attention windows stay aligned to the image grid. Linear feathering merges overlaps in a rolling row buffer, and Lanczos resizes to the requested width if it differs from the native network output. Preserve the color plate losslessly through review when possible.

**Check moved:** PSNR and Gaussian-window SSIM compare RGB values after Lanczos reduction to the original pixel grid. Farneback flow compares luminance on the same grid, and the JPEG visualizes magnitude from zero to the shift limit. A percentile above `--max-shift` exits with status 1. Flow alone does not prove that an isolated feature is unchanged or that a flat region contains no new texture. Review the image as well.

**Depth:** The global prediction anchors relative distances. Local predictions are fit to that frame using affine least squares on the interior of each overlap tile, with low-correlation tiles pulled toward the global prediction. Tiles are then feathered together. The raw output is tightly packed little-endian float32, row-major from the top-left, with no image header. Depth is normalized per image to zero far and one near, not measured in meters. The sidecar reports output shape and range. Use the 16-bit PNG to inspect full-resolution values and the smaller grayscale JPEG to review the scene. Hand-mask sky for relief use.
