# Belt assets

All belt assets are procedural. No image tool and no model made any of them, so there is no prompt. Nothing is painted, photographed or downloaded. The style target was Phobos in `references/approved/mars-hero.png` (looked at, not used as an input file).

## Files

`public/assets/shared/belt/full/`

| File | What it is |
| --- | --- |
| `manifest.json` | sizes, radius range and seed per rock, size of the detail tile |
| `rock-a.map.bin` | cube map 6 x 832 x 832 RGBA8: RGB object space normal, A albedo tone |
| `rock-a.aux.bin` | cube map 6 x 416 x 416: radius as uint16 little endian, then ambient occlusion as uint8 |
| `rock-b.map.bin`, `rock-b.aux.bin` | the same at 256 and 128 (baked at 512 and 256, then halved) |
| `rock-c.map.bin`, `rock-c.aux.bin` | the same at 384 and 192 |
| `detail.bin` | tiling 512 x 512 RGBA8 regolith tile: RG height gradient, B cavity, A albedo speckle |

`public/assets/shared/belt/web/`: the same files at half the edge length, derived from `full`.

Cube faces are in GL order (+X, -X, +Y, -Y, +Z, -Z), rows top to bottom, no header.

## Recipe for the full set
- Tool: `python3 assets-src/belt/bake.py OUTDIR [ROCK ...]` (numpy, scipy.ndimage, Pillow for previews; no model).
- Input files: none. Every number is in `bake.py`: the table `ROCKS` (seed, size, axes, lumps, facets, crater count, largest crater, grooves) and the seed 977 of the detail tile. The generator is `numpy.random.default_rng(seed)` plus an integer hash for the noise, so a rerun gives the same bytes.
- Prompt: none.
- What it does, per rock: a triaxial ellipsoid, three octaves of low frequency lumps, four to seven planar facets cut with a smooth minimum, a power law set of craters (bowl, raised rim, a degradation value per crater, three fresh ones), one to three families of parallel grooves made of chains of pits, six sizes of small crater cells, two sizes of boulder cells, fine relief. Rock a has four options of its own in the table: `soft` (how round the facet cuts blend), `wobble` (two octaves of noise at 5.3 per radius laid over the facets), `cracks` (families of fracture lines: cells per radius, width, depth) and `boulders` (cells per radius and fill for three sizes of blocks). The radius field is sampled on a padded cube grid; normals come from finite differences of the displaced surface, occlusion from two blurred height differences, albedo tone from low frequency mottling, streaks along the first groove axis, brighter slopes, darker floors and bright fresh rims.
- The detail tile: band limited noise with a power law spectrum, 520 small craters and 700 pebbles, all wrapped, so the tile repeats without an edge.
- Previews: `python3 assets-src/belt/preview.py TAKEDIR ROCK OUT.png` ray casts three views of a baked rock offline.

## Takes (shared by all files of the set; a take is one run of `bake.py`)
1. Take 1, rejected: ridged relief and regolith noise too strong, the craters drowned in lumps. `out/work/belt/bake/take1/`.
2. Take 2, rejected: relief lowered (0.022) and fine relief lowered (0.0016). Shapes good, but in the engine the surface read pale and airbrushed: too few small craters, low albedo contrast, no streaks. `out/work/belt/bake/take2/`.
3. Take 3, kept: more and sharper small craters (cell fill 0.45 to 0.62, depth 0.3 of the radius), albedo streaks along the groove axis, darker crater floors, brighter slopes, tone range 0.12 to 1. `out/work/belt/bake/take3/`, copied to `public/assets/shared/belt/full/`. Rocks b and c are still from this take.
4. Take 4, kept, rock a only (`python3 assets-src/belt/bake.py out/work/belt/bake/take4 a`): the film jury called the hero faceted, soft and stretched at frame 2782. 832 px a face (was 640) for 2.7 texels per pixel at a ball of 393 px; facets blended rounder (`soft` 0.12, was 0.07) and a wobble over them so no facet leaves a straight limb; boulders of 2 to 10 px on screen (the old ones were under a pixel); two families of fracture lines. In the engine: an irregular limb with no straight run, boulders and rims that hold at native size. `out/work/belt/bake/take4/`, `rock-a.*` copied to `public/assets/shared/belt/full/`.

After take 4, to stay inside the limits: `python3 assets-src/belt/half.py public/assets/shared/belt/full b` (2 x 2 average of rock b in place; it passes 14 px out of focus, so nothing it shows is lost) and rock d was removed from the table and from both sets (no rock in `belt.json` used it).

## Recipe for the web set
- Tool: `python3 assets-src/belt/web.py` (numpy). Input: `public/assets/shared/belt/full/`. Output: `public/assets/shared/belt/web/`.
- What it does: 2 x 2 box average of every cube face and of the detail tile; normals are renormalised after the average; the manifest sizes are halved.

## Files

Every file the two recipes above write, in both sets (`<set>` is `full` or `web`):

- `public/assets/shared/belt/<set>/detail.bin`
- `public/assets/shared/belt/<set>/manifest.json`
- `public/assets/shared/belt/<set>/rock-a.aux.bin`
- `public/assets/shared/belt/<set>/rock-a.map.bin`
- `public/assets/shared/belt/<set>/rock-b.aux.bin`
- `public/assets/shared/belt/<set>/rock-b.map.bin`
- `public/assets/shared/belt/<set>/rock-c.aux.bin`
- `public/assets/shared/belt/<set>/rock-c.map.bin`

## Checks
- No text, logo, border or baked stars: the files hold normals, tones, radii and occlusion only.
- Sizes on disk (`du -sh`): full 26 MB (26,847,664 bytes, limit 30 MB), web 6.5 MB (6,712,238 bytes, limit 10 MB). Largest file `rock-a.map.bin`, 16.6 MB.
- Texture memory of the full set with mipmaps: about 34.4 MB (limit 64 MB): normal and tone cubes 6 x (832^2 + 256^2 + 384^2) x 4 bytes x 4/3 = 29.0 MB, radius and occlusion cubes 6 x (416^2 + 128^2 + 192^2) x 3 bytes = 4.07 MB (no mipmaps), detail tile 512^2 x 4 x 4/3 = 1.4 MB.
- The web set loads and renders (`npm run still -- --frame 2782 --tier draft --assets web`), softer than full.
- Takes used: 4 of 6.
- Seams: cube faces are baked with a padded border and cropped, the mesh is welded across cube edges; no seam seen in the previews or in the native crops.
