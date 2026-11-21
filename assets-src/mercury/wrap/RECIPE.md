# Mercury wrap maps recipe

All paths are repo paths. Scripts are in `assets-src/mercury/wrap/` and run from the repo root with Python 3 (numpy, opencv, Pillow, scipy, tifffile). Work files go to `out/work/mercury/` (not tracked). `geo.py` holds the hero camera fit (`assets-src/mercury/fit.json`), the map convention and the film's tone curve. Map convention: direction of (lon, lat) = (cos lat sin lon, sin lat, cos lat cos lon), u = lon/360 + 0.5, north at top.

## Outputs

| File | What |
|---|---|
| `public/assets/mercury/<set>/wrap-color.jpg` | albedo map, full 8192 x 4096, web 4096 x 2048, JPEG quality 93, 4:4:4 |
| `public/assets/mercury/<set>/wrap-height.bin` | height map, full 4096 x 2048, web 2048 x 1024, raw little-endian uint16 |
| `src/stops/mercury/wrap.json` | sizes and projection |
| `src/stops/mercury/curve.json` | light curve and limb table measured from the hero |

The web set is the full set scaled to half with area averaging.

## Inputs

- `references/approved/mercury-hero.png`: the layout, color and detail of the side the hero shows, and the style of everything else.
- `references/cache/mercury/messenger-color-4096.png`, `references/cache/mercury/messenger-mono-8192.png`, `references/cache/mercury/Mercury_Messenger_USGS_DEM_Global_665m_v2.tif`: real MESSENGER color mosaic, monochrome mosaic and height model, layout guides for the far side only (ledger rows in `assets-src/mercury/ASSETS-ROWS.md`). No pixel of them ships: every map pixel is either a hero pixel or a repainted tile.

## Steps for wrap-color.jpg

1. Hero without its block grid, at twice the size: `python3 assets-src/mercury/tools/deblock.py references/approved/mercury-hero.png out/work/mercury/hero-db.png`, then `python3 tools/ml/upscale.py --in out/work/mercury/hero-db.png --out out/work/mercury/hero-db-2x.png --width 5632` (Swin2SR, see `tools/ml/MODELS.md`). The deblock step removes the 8 px block steps where the picture is calm (boundary step over inside step at the terminator 4.62 before, 0.75 after; night side 2.12 before, 0.99 after).
2. Light curve: `python3 assets-src/mercury/wrap/curve.py out/work/mercury/hero-db-2x.png` fits the hero's brightness against the Sun angle and the brightening toward the lit limb, writes `src/stops/mercury/curve.json` and `assets-src/mercury/wrap/hero-stats.json`. `python3 assets-src/mercury/wrap/rim.py` fits the lens glow outside the lit limb (`assets-src/mercury/wrap/rim.json`).
3. Guide map: `python3 assets-src/mercury/wrap/guide.py out/work/mercury/guide-8192.png`. Color and low-frequency albedo from the real color mosaic (blurred 7 px at 4096, its largest scales removed, graded to the hero's albedo statistics, faded toward the poles between 58 and 74 degrees of latitude), crater structure from the real height model at 8192 with the light of the film's Sun direction baked in softly, as the hero carries its relief. Constants at the top of the file (`LOW 0.6, MARK 0.22, UNIT 0.5, STEEP 2.5, SOFT 0.05, WIDE 60, KEEP 0.35, TINT 0.6, RING 0.14`).
4. Tiles: `python3 assets-src/mercury/wrap/tiles.py cut out/work/mercury/guide-8192.png` cuts 38 gnomonic tiles of 2048 px to `out/work/mercury/tiles/in-K.jpg`: `e0` to `e9` on the equator (field 50 degrees, every 36 degrees), `n0` to `n7` and `s0` to `s7` at latitude 40 and -40 (field 56, every 45, the south row offset by 22.5), `np0` to `np4` and `sp0` to `sp4` at latitude 70 and -70 (field 60, every 72), `np` and `sp` on the poles (field 50, polar projection, so no pole is pinched).
5. Each tile is repainted by the image model: `generate_image`, model `seedream_5`, aspect 1:1, two input images: image 1 `out/work/mercury/tiles/in-K.jpg`, image 2 `out/work/mercury/tiles/style.jpg` (a straight-down 2048 px gnomonic tile of the hero's day side: the hero's own pixels on the map, centred on lon 30, lat 10, field 40 degrees, sampled with `tiles.face_dirs(tiles.basis(30, 10), 40, 2048)`). Prompt (`wrap/prompts/tile.txt`):

```
Image 1 is a soft, low-detail, straight-down map tile of the surface of the planet Mercury. Image 2 is a finished, sharp map tile of another region of the same planet in the same straight-down view: it is the look to match.
Repaint image 1 at the same framing so that it has the surface look of image 2: crisp, densely cratered ground with sharp crater rims, thin bright rims and small soft rim shadows, faint bright ray streaks around the freshest small craters, chains of tiny secondary craters, wrinkle ridges and smooth plains, with fine sharp natural detail everywhere, as if seen at four times the resolution of image 1.
Keep the layout of image 1: every crater, basin, ridge and every pale, tan, blue or dark region stays in the same place with the same size and shape. Keep the brightness and the color of every region as it is in image 1: pale regions stay pale, crater floors keep the brightness they have in image 1 and do not turn into black holes. Do not move, add or remove any large feature, and do not add any large new ray crater.
No soft, blurred or hazy patches, no blotchy or camouflage patterns, no long cast shadows, no stars, no space, no planet edge, no text, no border, no frame. Output the same square tile.
```

For `np` and `sp` this paragraph is added at the end (`wrap/prompts/tile-pole.txt`), because the real mosaics have no data at the poles:

```
The flat grey disc in image 1 and the black streaks around it are missing data, not ground. Fill them with the same cratered ground as the rest of the tile, in the same colors, with craters of many sizes, so that no disc, ring, hole or radial streak remains. The harsh black shadows inside craters near it become normal crater floors.
```

6. Check of every take: `python3 assets-src/mercury/wrap/flowcheck.py out/work/mercury/tiles/in-K.jpg out/work/mercury/tiles/TAKE-K.png` (optical flow between the blurred input and the take: nothing may move).
7. Build: `python3 assets-src/mercury/wrap/tiles.py build public/assets/mercury/full/wrap-color.jpg out/work/mercury/painted-8192.png assets-src/mercury/wrap/takes.json`. Every take has its low frequencies (24 px at 2048) locked to its input, so brightness and color of every region stay the guide's, and is splatted back with smooth weights. The first argument only gives the size: every map pixel gets a tile weight of 1.0 or more (printed: min weight 1.0, 0 px under 0.05).
8. Hero side: `python3 assets-src/mercury/wrap/match.py out/work/mercury/painted-8192.png public/assets/mercury out/work/mercury/hero-db-2x.png`. Where the hero shows the ground lit, the map is the albedo that makes the stop's shader return the hero's own pixel (`geo.ground`, the exact inverse of the shading in `src/stops/mercury/globe.ts` with the night and dusk values of `look.ts`; run this step again when those values change), faded out toward the limb between view cosine 0.42 and 0.2 and toward the night by the mask `geo.day`: full from Sun cosine 0.07 up, fading to zero at 0, and below that kept only where the hero carries signal (blurred luminance 1.3 to 2 times its night floor), down to Sun cosine -0.14. The hero's featureless night floor never enters the map. The slow tone ratio between hero and painted map (blur 40 px) is carried on to the limb so no step shows where the hero pixels end. The night side of the hero is smooth and carries lens artifacts, so there the map is the painted map times one scalar level. Inside the hero's terminator band the painted map is held under `look.light.dusk.from`, so only the hero's own sunlit rims glint there. Writes both sets.

## Takes

| Asset | Takes | Kept | Why |
|---|---|---|---|
| 38 tiles, first guide | `a1` (`nano_banana_pro`), `b1` (`seedream_5`) on four tiles | none | the first guide carried the seams and blocks of the mosaic |
| 38 tiles, guide of step 3 before the high-Sun changes | `c1` (`seedream_5`), `d1` (`nano_banana_pro`) | `c1` on the tiles the film never sees lit | `seedream_5` adds real fine texture and crisp rims; `nano_banana_pro` kept the blur and drew embossed white lines |
| the tiles the film can see lit (e5 e6 e7 e8 e9 n4 n5 n6 n7 np3 np4 s4 s5 s6 s7 sp3) | `c2` (`seedream_5`), `d2` (`nano_banana_pro`) on seven of them | `c2` | painted from the final guide; pale cream blobs of the earlier guide under a high Sun are gone |

At most four takes per tile. `assets-src/mercury/wrap/takes.json` names the take per tile. All kept takes pass the flow check: median under 0.4 px, 99th percentile under 1 px at 2048.

## Steps for wrap-height.bin

1. `python3 assets-src/mercury/wrap/height.py public/assets/mercury out/work/mercury/hero-db-2x.png`: the real height model at 4096 x 2048, flattened to its 40 px low-pass where the hero's lit pixels are kept in the color map (the same `geo.day` mask) (the hero carries its own shading there, so relief from the height map would double it), full detail elsewhere. Encoded as uint16 over the range written to `assets-src/mercury/wrap/height-range.json`. Web is the full map averaged to half.

## Checks

- Frame 615 at review beside the hero (`python3 assets-src/mercury/tools/probe.py FILM align`): day side film over hero by Sun angle band 1.00 to 1.04, night side by radius 1.00 to 1.07.
- The far side from the rise angle (frame 1016) and the poles: no seam, no pinched pole.
