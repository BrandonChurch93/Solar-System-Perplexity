# Belt assets

All belt assets are procedural. No image tool and no model made any of them, so there is no prompt. Nothing is painted, photographed or downloaded. The style target was Phobos in `references/approved/mars-hero.png` (looked at, not used as an input file).

## Files

`public/assets/shared/belt/full/`

| File | What it is |
| --- | --- |
| `manifest.json` | sizes, radius range and seed per rock, size of the detail tile |
| `rock-a.map.bin` | cube map 6 x 640 x 640 RGBA8: RGB object space normal, A albedo tone |
| `rock-a.aux.bin` | cube map 6 x 320 x 320: radius as uint16 little endian, then ambient occlusion as uint8 |
| `rock-b.map.bin`, `rock-b.aux.bin` | the same at 512 and 256 |
| `rock-c.map.bin`, `rock-c.aux.bin` | the same at 384 and 192 |
| `rock-d.map.bin`, `rock-d.aux.bin` | the same at 384 and 192 |
| `detail.bin` | tiling 512 x 512 RGBA8 regolith tile: RG height gradient, B cavity, A albedo speckle |

`public/assets/shared/belt/web/`: the same files at half the edge length, derived from `full`.

Cube faces are in GL order (+X, -X, +Y, -Y, +Z, -Z), rows top to bottom, no header.

## Recipe for the full set
- Tool: `python3 assets-src/belt/bake.py OUTDIR` (numpy, scipy.ndimage, Pillow for previews; no model).
- Input files: none. Every number is in `bake.py`: the table `ROCKS` (seed, size, axes, lumps, facets, crater count, largest crater, grooves) and the seed 977 of the detail tile. The generator is `numpy.random.default_rng(seed)` plus an integer hash for the noise, so a rerun gives the same bytes.
- Prompt: none.
- What it does, per rock: a triaxial ellipsoid, three octaves of low frequency lumps, four to seven planar facets cut with a smooth minimum, a power law set of craters (bowl, raised rim, a degradation value per crater, three fresh ones), one to three families of parallel grooves made of chains of pits, six sizes of small crater cells, two sizes of boulder cells, fine relief. The radius field is sampled on a padded cube grid; normals come from finite differences of the displaced surface, occlusion from two blurred height differences, albedo tone from low frequency mottling, streaks along the first groove axis, brighter slopes, darker floors and bright fresh rims.
- The detail tile: band limited noise with a power law spectrum, 520 small craters and 700 pebbles, all wrapped, so the tile repeats without an edge.
- Previews: `python3 assets-src/belt/preview.py TAKEDIR ROCK OUT.png` ray casts three views of a baked rock offline.

## Takes (shared by all files of the set; a take is one run of `bake.py`)
1. Take 1, rejected: ridged relief and regolith noise too strong, the craters drowned in lumps. `out/work/belt/bake/take1/`.
2. Take 2, rejected: relief lowered (0.022) and fine relief lowered (0.0016). Shapes good, but in the engine the surface read pale and airbrushed: too few small craters, low albedo contrast, no streaks. `out/work/belt/bake/take2/`.
3. Take 3, kept: more and sharper small craters (cell fill 0.45 to 0.62, depth 0.3 of the radius), albedo streaks along the groove axis, darker crater floors, brighter slopes, tone range 0.12 to 1. `out/work/belt/bake/take3/`, copied to `public/assets/shared/belt/full/`.

## Recipe for the web set
- Tool: `python3 assets-src/belt/web.py` (numpy). Input: `public/assets/shared/belt/full/`. Output: `public/assets/shared/belt/web/`.
- What it does: 2 x 2 box average of every cube face and of the detail tile; normals are renormalised after the average; the manifest sizes are halved.

## Checks
- No text, logo, border or baked stars: the files hold normals, tones, radii and occlusion only.
- Sizes on disk (`du -sh`): full 28 MB (limit 30 MB), web 6.9 MB (limit 10 MB). Largest file `rock-a.map.bin`, 9.4 MB.
- Texture memory of the full set with mipmaps: about 36.7 MB (limit 64 MB): normal and tone cubes 6 x (640^2 + 512^2 + 2 x 384^2) x 4 bytes x 4/3 = 30.9 MB, radius and occlusion cubes 6 x (320^2 + 256^2 + 2 x 192^2) x 3 bytes = 4.35 MB (no mipmaps), detail tile 512^2 x 4 x 4/3 = 1.4 MB.
- The web set loads and renders (`npm run still -- --frame 2782 --tier draft --assets web`), softer than full.
- Takes used: 3 of 6.
- Seams: cube faces are baked with a padded border and cropped, the mesh is welded across cube edges; no seam seen in the previews or in the native crops.
