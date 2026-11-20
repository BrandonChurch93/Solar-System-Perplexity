# Phobos

The two equirectangular maps use the same moon-local directions: \((\cos(\mathrm{lat})\sin(\mathrm{lon}),\sin(\mathrm{lat}),\cos(\mathrm{lat})\cos(\mathrm{lon}))\). North is the first row. The hold rotation in `assets-src/mars/phobos/phobos.json` takes this frame to the world frame in `assets-src/mars/fit.json`. The hit position in the hero came from the moon fit, and the silhouette was traced independently of the circle originally used to fit its placement.

## Output paths

| Output | Tool and inputs |
| --- | --- |
| `public/assets/mars/full/phobos-color.jpg` | 4096 × 2048, JPEG quality 95, full chroma. Nano Banana Pro, Pillow, OpenCV and NumPy. Inputs: `references/approved/mars-hero.png`, `out/work/phobos/hero.png`, `out/work/phobos/flat-take-1.png`, both cached GeoTIFFs below, `assets-src/mars/fit.json` and the fitted radial field from `assets-src/mars/phobos/build.py`. |
| `public/assets/mars/web/phobos-color.jpg` | 2048 × 1024. Pillow Lanczos half-scale from the uncompressed master in memory just before both JPEG encodes. Same inputs and prompt as the full set. |
| `public/assets/mars/full/phobos-height.bin` | 2048 × 1024. NumPy, SciPy and OpenCV, no learned model. Inputs: `references/approved/mars-hero.png` traced as limb points and crater parameters in `assets-src/mars/phobos/build.py`, `assets-src/mars/fit.json`, and both cached GeoTIFFs below. Headerless little-endian uint16 in top-to-bottom row order. |
| `public/assets/mars/web/phobos-height.bin` | 1024 × 512. Box filter over each 2 × 2 block of the full master in floating point before quantizing. Same inputs as the full set. |

For height, the exact procedural brief was: "Reproduce the traced perspective limb, carve Stickney and other annotated craters in the exact approved screen positions with raised irregular rims and layered grooves, blend the opposing hemisphere into the registered real depth field, taper the mosaic's high frequencies at its undefined polar and shadow pixels, and finish with a very low-amplitude deterministic microrelief." The implemented prescription is the crater table, trace, map and blend in `build.py`. Decode with `radius * (lo + (hi - lo) * value / 65535)`. Do not apply the Mars globe rotation to the moon a second time.

## Color reference and exact prompt

The native crop is 560 × 500 starting at pixel (1190, 1002) of `references/approved/mars-hero.png`. The close reference `references/approved/mars-close.jpg` was reviewed for the common grade, but was not a generator input because it does not depict Phobos. The relight used `nano_banana_pro` with `aspect_ratio: "1:1"`, default background, Image 1 `references/approved/mars-hero.png`, Image 2 `out/work/phobos/hero.png`, and output `out/work/phobos/flat-take-1.png`. Exact prompt:

> Image 1 is the exact approved Phobos in its Mars shot. Image 2 is a native pixel crop of the same approved foreground moon and is the exact framing template to edit. Output exactly the framing and margins of Image 2, same 560 × 500 relative layout and 1:1 aspect ratio with padding if needed, a straight unretouched view of the same potato-shaped foreground moon. Change only the light: make this a flat, uniform, color-only reflectance capture of the matte dark gray stony regolith with subdued warm and cool patches. Remove all directional highlights, rim lighting, deep black cast shadows, and terminator shading. Preserve exactly the 2D position and size of the dark irregular silhouette, every small and medium crater, the big deeply excavated Stickney bowl at lower right, its entire ragged edge, the shallow crater directly above and left of it, and all existing streaks and parallel grooves. Preserve the fractional position and aspect of every crater and do not rotate, round off, or resize the object. Do not generate or move identifiable landmarks. Keep its rough natural geology, not tiled or stylized. The moon may have slight light and dark mineral variation but no light source, glare, shine, or shadow. Leave the off-body background untouched. No text, no watermark, no border, no logos, no stars, no stray objects.

Take 1 was retained only as a material input in verified regions. The affine-registration check downsized to a 560-pixel square, masked the approved features, and found 425 of 430 keypoint matches inliers, with median 0.41 px, p90 0.91 px, p99 1.63 px. The full unmasked `checkmoved.py` flow did not pass (p99 34.05 px across the deliberately changed cast shadows and background), so the complete relit picture was not accepted. Material outside the traced silhouette, at the limb and in regions that were too dark in the approved image to check the edit is rejected. Before unprojection, a masked low-pass separates the flat field's broad and local luminance. The broad difference is kept at 17 percent contrast, local luminance at 68 percent, and color difference at 41 percent. The radial field, not the relight silhouette, controls the projected new surface. Rotation, seams and poles are handled in 3D directions. The backside does not use the public mosaic's broad directional lighting: only its small residual features are combined with deterministic sphere-space mottles and grain and linked mineral contrast around synthetic crater relief, in the grade from the approved frame.

## Rebuild and inspection

Run from the repository root with Python, NumPy, SciPy, Pillow, OpenCV and a C++17 compiler:

```sh
mkdir -p references/cache out/work/phobos
curl -fLsS https://planetarymaps.usgs.gov/mosaic/Phobos_ME_HRSC_DEM_Global_2ppd.tif -o references/cache/Phobos_ME_HRSC_DEM_Global_2ppd.tif
curl -fLsS https://planetarymaps.usgs.gov/mosaic/Phobos_ME_SRC_Mosaic_Global_16ppd.tif -o references/cache/Phobos_ME_SRC_Mosaic_Global_16ppd.tif
convert references/approved/mars-hero.png -crop 560x500+1190+1002 +repage out/work/phobos/hero.png
OPENBLAS_NUM_THREADS=1 PYTHONDONTWRITEBYTECODE=1 python assets-src/mars/phobos/build.py
```

Place the relight output at `out/work/phobos/flat-take-1.png` before the Python step. An exact byte-for-byte regeneration of the image tool output is not guaranteed by its service. Run `build.py --check-only` on the committed pairs to repeat the independent render using only the shipped files and approved frame. The check uses a 1024 × 512 displaced mesh, perspective rasterization at 2816 × 1584, the fitted Sun direction, direct Lambert light, and a faint ambient. The goal mask is the cone through the native hand-traced limb. The reference is never used as the moon's shading or renderer input. It is used as comparison and background compositing only. The other views put one directional light in front of the lit far side, north pole and south pole. The outputs are in `out/work/phobos/`. For a stricter shadow diagnostic, set `PHOBOS_SHADOW=1` to enable the optional directional visibility pass; it is not the default because it obscures more of the Stickney floor than the approved art.

The final asset iteration is procedural take 5, combining the traced silhouette and broader crater floor with the retained portions of the first relight. It preserved better bowl registration and cleaner shadow transitions than the earlier mesh versions. Rejected variants stayed in the work directory. The approved original is on the left of `out/work/phobos/full-comparison.png`, with the geometry render composited at right. `out/work/phobos/full-body-rgba.png` contains only the rendered moon, and `out/work/phobos/back-poles.png` shows the far side, north and south from left to right.

| Check | Full | Web |
| --- | --- | --- |
| Silhouette IoU | 0.99521 | 0.99525 |
| Stickney projected center, hero target (1588, 1283) | (1588.08, 1283.00), 0.082 px error | (1588.08, 1283.00), 0.085 px error |
| Raw height length | 4,194,304 bytes | 1,048,576 bytes |
| Fractional surface radius range | 0.75867 to 1.07782 | 0.75870 to 1.07780 |
| Mean color step across wrap, 8-bit levels | 0.79 | 1.44 |
| Mean absolute RGB difference inside both masks, before film grade | 32.77 | 32.69 |

The comparison shows the correct shape, main craters and bowl orientation. It does not match the approved directional light pixel for pixel. The lit cap is paler and more uniformly lit, the lower terminator more broken, and Stickney's lit crescent narrower. No discrete wrap or polar pinch was evident in the lit reverse views or native map crops. Where the approved lighting was fully dark and could not validate edited texture, the material is lower contrast and synthetic. The lit reverse views verify continuous geometry, textures and crater registration, not an exact geological reconstruction.

## Lit side pass (lead, Phase 3)

Made by the Builder after the agent's delivery. The mesh and its map are right, but a shader light could not reproduce the approved hero's lit face and the lit rim of Stickney pixel for pixel, and Phobos is the largest thing in the hold frame. So the side of Phobos that the hero shows carries the hero's own pixels.

- Files: `public/assets/mars/full/phobos-lit.jpg`, `public/assets/mars/full/phobos-lit-mask.png`, `public/assets/mars/web/phobos-lit.jpg`, `public/assets/mars/web/phobos-lit-mask.png` (4096 x 2048 and 2048 x 1024, the moon's own map layout).
- Tool: `python3 assets-src/mars/phobos/lit.py`, run from the repo root. No image model is used. About 12 minutes and 4 GB.
- Inputs: `references/approved/mars-hero.png`, `assets-src/mars/fit.json`, `assets-src/mars/phobos/phobos.json`, `public/assets/mars/full/phobos-height.bin`.
- Steps: 1. Displace every texel of the moon's map by the height map and project it through the fitted camera at the hold pose. 2. Keep the texels the hero sees (a depth test against the nearest surface, facing the camera, at least 2.5 px inside the silhouette) and give each the hero pixel it lands on. 3. Fill the rest outward from the seen texels with a blur pyramid, so the soft edge of the mask never meets an unrelated color. 4. The mask is the seen region, softened by 2 degrees and grown by 14 degrees so the grazing ring at the silhouette also takes the hero's color and no shader-lit outline shows.
- Use: `src/bodies/moonbody.ts` mixes the baked color in by the mask. The baked color is display color, so it goes through the inverse tone curve and the lens vignette is cancelled for it, like the relief. Outside the mask the moon is lit by the shader as before, which is what shows as it tumbles.
- Check: the hold frame's Phobos crop beside the hero's (`out/work/phobos/lit-check.png` for the silhouette, a side by side crop at 1920 for the picture). The lit face, the grooves and the Stickney rim now match the hero. The outline that the first mask left along the silhouette is gone after the mask was grown.

## Ledger rows

| File | What it is | Source URL | License | Credit line | Date fetched |
| --- | --- | --- | --- | --- | --- |
| `references/cache/Phobos_ME_HRSC_DEM_Global_2ppd.tif` | Global Phobos DEM, used to give the hidden hemisphere its main shape | https://astrogeology.usgs.gov/search/map/phobos_mars_express_hrsc_dem_global_100m | Public domain, USGS asks users to cite authors | Willner, Oberst, Hussmann, Giese, Hoffman, Matz, Roatsch and Duxbury (2010), Mars Express HRSC and Viking, distributed by USGS Astrogeology | 2026-11-20 UTC |
| `references/cache/Phobos_ME_SRC_Mosaic_Global_16ppd.tif` | Global Phobos image mosaic, used as a microtexture guide only | https://astrogeology.usgs.gov/search/map/phobos_mars_express_src_global_mosaic_12m | Public domain, USGS asks users to cite authors | Willner, Oberst, Wählisch, Matz, Hoffman, Roatsch, Jaumann and Neukum (2008), Mars Express SRC and Viking, distributed by USGS Astrogeology | 2026-11-20 UTC |
