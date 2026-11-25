# MAIL 1165: the ringing at the stars of Mercury's hold sky

Round 52, Mercury, the detail critic, minor: dark ringing pits around the stars of the hold's sky patch and blotches between them, read as compression of the plate. Asked of the flight sky: where the ringing is made, the cure without moving a star, the file growth.

All film numbers: frame 615, final tier, 1920 x 1080, `--diag nograin`, main's code 53025569779c1793edcfde8da1679cedf92899d4, read at 1 to 1. Box of the film: x 0 to 700, y 560 to 1080 (the lower left sky). The same sky in the approved image at native size: box 0, 821, 1027, 1584; in the plate: 352, 1019, 1379, 1782 (the plate's middle 2816 x 1584 is the approved image 1 to 1, 1.467 texels a film pixel).

## The finding

1. The plate is already lossless. `public/assets/mercury/full/sky-hold.webp` is VP8L, 3520 x 1980, 5119222 bytes; the web card is the Lanczos half of it, byte for byte in its pixels. A lossless or near lossless plate cures nothing.
2. The pits are in the plate's file and come from the approved image. `references/approved/mercury-hero.png` has dark pixels beside its stars (61 percent of its stars at native size, open sky 0 percent). The plate carries them deeper (79 percent, two of three reach code 3 or under), because the recipe takes the film's bloom off the floor and the pit keeps its depth.
3. The patch drawing softens them, it does not make them: `patchTexel` in `src/space/sky.ts` is four linear taps a quarter pixel apart, the texture is loaded without mips, the tone curve is undone and done again. With the post sharpen off the film shows a pit at 14 percent of the stars.
4. The post chain's sharpen deepens them: 0.6 at the final tier, `src/post/chain.ts` lines 115 to 120 (`c + uSharpen * (c - mean of the 4 neighbours)`), the Builder's file, on every frame of the film. With it on, the same frame shows a pit at 49 percent of the stars, more than the approved image at film size (39 to 44 percent). The sharpen also draws a ring of its own at 2 px around any point: that share is what stays after the cure (8 percent of the stars; 0 percent with the sharpen off).
5. The blotches are the approved image's own: 8 px blocks in luma and coloured 16 px blocks. The film's blotch band equals the approved image's (luma 0.00202 against 0.00216, colour 0.00152 and 0.00140 against 0.00164 and 0.00166).

So: in the file, from the approved image, made deeper by the recipe's floor and by the post sharpen; not by the patch's filter, mip or tone curve.

## Pits

A star is a peak over the local floor by 0.08 or more (display units). The pit is the deepest pixel in the ring 1.5 to 4.5 px around it minus the floor (median of the ring 8 to 12 px). The control is the same reading at 2000 points of open sky.

| picture | stars | pit, median | of the floor | stars with a ring pixel under 0.4 of the floor | ring pixel at code 3 or under | control |
|---|---|---|---|---|---|---|
| approved image, native size | 555 | -0.0387 | -70 percent | 61 percent | 44 percent | 0 percent |
| approved image at 1920, area mean | 331 | -0.0313 | -53 percent | 39 percent | 26 percent | 0 percent |
| approved image at 1920, Lanczos (as G17 reads it) | 336 | -0.0339 | -56 percent | 44 percent | 28 percent | 0 percent |
| plate on main | 1011 | -0.0429 | -91 percent | 79 percent | 67 percent | 1 percent |
| plate, pits filled | 1011 | -0.0138 | -28 percent | 0 percent | 0 percent | 1 percent |
| frame 615, main | 320 | -0.0291 | -60 percent | 49 percent | 39 percent | 0 percent |
| frame 615, main, post sharpen off | 297 | -0.0157 | -33 percent | 14 percent | 4 percent | 0 percent |
| frame 615, pits filled | 319 | -0.0156 | -29 percent | 8 percent | 5 percent | 0 percent |
| frame 615, pits filled, post sharpen off | 296 | -0.0075 | -14 percent | 0 percent | 0 percent | 0 percent |
| frame 615, pits filled and hue calmed | 317 | -0.0154 | -29 percent | 8 percent | 5 percent | 0 percent |

In the plate with the pits filled the ring at a star reads like open sky (-28 against -27 percent of the floor).

## Blotches

Standard deviation in open sky of the band blur 2 minus blur 6 film px (2.9 minus 8.8 texels in the plate).

| picture | luma | blue minus luma | red minus luma |
|---|---|---|---|
| approved image at 1920 | 0.00216 | 0.00164 | 0.00166 |
| frame 615, main | 0.00202 | 0.00152 | 0.00140 |
| frame 615, pits filled | 0.00200 | 0.00154 | 0.00141 |
| frame 615, pits filled and hue calmed | 0.00200 | 0.00110 | 0.00092 |
| plate on main | 0.00274 | 0.00176 | 0.00175 |
| plate, pits filled | 0.00265 | 0.00178 | 0.00175 |
| plate, pits filled and hue calmed | 0.00262 | 0.00100 | 0.00090 |

## The cure

`mercury-hold/calm.py SRC FULL WEB [HUE]`, run once as the last step on the plate (after `reach.py`, and after any later step that writes `sky-hold.webp`). It lies in Mercury's folders, so it is handed to mercury_builder as script and files; nothing of it is committed there by me.

- Floor: per channel a 13 px median blurred 2.5 px (near) and a 31 px median blurred 6 px (wide). Noise: the scaled median deviation of the luma about the near floor (median 1.47 codes on main's plate).
- Star pixels: luma over the near floor by 4 times the noise (205167 pixels, 2.94 percent). They keep their bytes.
- Pit: a pixel within 7 texels of a star pixel whose luma lies under the lower of the two floors by more than 1 noise (in full from 2.5). It is raised to that floor with the floor's colour. Nothing is raised over the floor, nothing is lowered, nothing outside the rings changes.
- `HUE` (default 0, not part of the cure): share of the colour between the stars that is taken from the wide floor, luma kept. 1 halves the coloured blocks.
- The web card is the Lanczos half of the full card, as `reach.py` writes it.

On main's plate (sha256 638631a4b3fe5b83eb769239a8a6fd216086dd94c42a7e3295bd14cea3095433):

| | full | web |
|---|---|---|
| main | 5119222 bytes | 1492236 bytes |
| pits filled | 5071446 bytes (minus 47776), sha256 916d518380b749866930d562d6b7182a918940a8cd54870556950a9a4d71bce0 | 1441072 bytes (minus 51164), sha256 7668472657eec4b96db4c6e453c180ca28596d4766c82b4d5b1ccdbf09842f2d |
| pits filled and hue calmed (`HUE` 1) | 4730458 bytes (minus 388764), sha256 9c7fa9e879e85730626b00fcb948bbd0f7b949d5679f6cf1afb203858262e3e8 | 1365148 bytes (minus 127088), sha256 aba4677905828b83f7b24257962ffaf69dc5d380a7d216ee2b15caf8a75459c9 |

Pits filled: 377352 pixels of the full plate change (5.4 percent), 257932 by more than 1 code of luma, all upward, largest 51 codes; star pixels changed 0. The web card changes in 24.4 percent of its pixels (largest 41 codes); its pits fall from 72 to 27 percent of the stars, the rest are the lobes of the Lanczos half itself.

## Frame 615 with the pits filled, against main

- The sky (1009820 pixels): 211533 differ (20.9 percent), 37322 by more than 2 codes, 2292 by more than 8, largest 25; mean luma +0.213 codes.
- The globe (754787 pixels): 497 pixels differ by one code (largest 2). The Sun and its glare (308993 pixels): 294 pixels, by one code (largest 2). That is the bloom of the raised sky at the rounding; no pattern.
- Stars: 7905 peaks before, 7867 on the same pixel after, 13 on the pixel beside (two equal neighbours), 25 at the counting threshold (their peak changes by one code at most). Peak value at the kept stars: median change 0, largest 2 codes (the post sharpen reads the raised neighbours). No star moves, none is widened: the ring is raised to the floor, never over it.
- G17 against `references/approved/mercury-hero.png` (71 tiles, no grain): median 1.168 to 1.147, 25th 1.038 to 1.023; the gate (median at 0.8 or over) is green both ways. Tiles under 0.8 on main: six (8,0 0.379; 10,3 0.485; 11,4 0.636; 9,3 0.660; 4,3 0.673; 6,6 0.742). With the fill seven: the six within 0.014 and (8,1), which crosses from 0.805 to 0.791. Per tile, fill over main: median 0.977, least 0.918; the dark ring pixels are fine detail and the fill takes that energy out. (My first mail said five tiles and none crossing; that was read from g17.py's list of the worst five and was wrong.)
- With `HUE` 1 as well: the sky differs in 77.5 percent of its pixels (100990 over 2 codes, largest 23), the globe in 885 (largest 3), the Sun's region in 4573 (largest 2); G17 median 1.147, 25th 1.023, the same seven tiles.

## Frames 560 and 680 of the hold with the pits filled (MAIL 1212, point 4)

Final tier, no grain, main 53025569 against the same code with the filled plate; the pits read over the whole frame (box 20,20 to 1900,1060) and in the lower left sky (0,560 to 700,1080, the box of the finding). The approved picture is the view of 615, so G17 at 560 and 680 is no gate; the tile ratios are given for the fall alone. No mask of the globe was made for these two frames, so the split into sky and globe is not measured there.

| frame | pits, whole frame | pits, lower left | ring pixel at code 3 or under, lower left | pixels that differ | over 2 codes | over 8 | largest | star peaks, same pixel, beside, at the threshold | per tile, fill over main: median, least | tiles under 0.8, main to fill |
|---|---|---|---|---|---|---|---|---|---|---|
| 560 | 33 to 12 percent | 59 to 5 percent | 47 to 3 percent | 213594 (10.3 percent) | 37430 | 2980 | 27 | 7959, 7906, 22, 31 | 0.980, 0.932 at (2,1) | 17 to 17, none crosses |
| 615 | 29 to 13 percent | 49 to 8 percent | 39 to 5 percent | 212324 (10.2 percent) | 37322 | 2292 | 25 | 7905, 7867, 13, 25 | 0.977, 0.918 at (3,7) | 6 to 7, (8,1) 0.805 to 0.791 |
| 680 | 27 to 15 percent | 40 to 9 percent | 34 to 11 percent | 203748 (9.8 percent) | 32473 | 2053 | 28 | 8475, 8434, 15, 26 | 0.981, 0.931 at (7,0) | 7 to 8, (1,4) 0.800 to 0.776 |

- 560: the pits fall as at 615; no star moves (peak change at the kept stars 2 codes at most, at the threshold ones one code); no tile falls by more than 0.1 of its own ratio.
- 680: the same; the lower left sky is darker there (floor 0.046 against 0.053), so more of what the post sharpen leaves sits at code 3 or under (11 percent). One tile crosses 0.8, (1,4), by the same cause as (8,1) at 615: the ring pixels are fine detail and the fill takes that energy out.
- Whole frame at 615, for the same reading: 29 to 13 percent (the lower left box holds the darkest sky, hence the larger share there).

Pictures: `mercury-615-pits.png` (film x 200 to 395, y 640 to 752, times 4: approved at 1920, main, pits filled, pits filled and hue calmed), `mercury-615-pits-lifted.png` (the same, levels times 3).

## Tried and dropped

- The first form (everything between the stars taken to the floor): pits 0 percent, but the Milky Way's texture goes soft at 1 to 1 (fine detail 0.00246 to 0.00096 in the film) and specks of 0.08 to 0.11 over the floor that are not star pixels go with it. Not the approved image's sky any more.
- The stars taken out of the plate and drawn by the shared sky as points: not built. The plate's stars are the approved image's stars; filling the pits keeps them byte for byte.

## Not mine, as lines for the owners

- `assets-src/mercury/sky/RECIPE.md`, a step after `reach.py`: `python3 assets-src/mercury/sky/calm.py public/assets/mercury/full/sky-hold.webp public/assets/mercury/full/sky-hold.webp public/assets/mercury/web/sky-hold.webp` (the script copied from `assets-src/flightsky/mercury-hold/calm.py`; input and output may be the same file; run once).
- `src/post/chain.ts` 115 to 120, the Builder's: the sharpen's own ring is what is left at the stars after the cure. No change proposed.
- The same pits sit in the hold plates of the other stops (whole plate, the same reading): Earth 43 percent of the stars, Jupiter 44, Mars 64, Neptune 49, Sun 66, Uranus 68, Venus 54; Saturn 1. Not asked, not touched.

## Tools

`measure/pits.py BOX LO FILE...`, `measure/g17tiles.py APPROVED FILM...` (every kept tile, the ones under 0.8 and the ones that cross against the first film), `measure/blot.py BOX SCALE FILE...` (scale 1 for the film, 1.467 for the plate). The renders: main clone at 53025569 with the plate swapped in `public/assets/mercury/full/`, a local factor on `uSharpen` for the sharpen off control; never committed, restored after.
