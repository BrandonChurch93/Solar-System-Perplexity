# Earth: the pit fill of the hold plate (MAIL 1212, point 3)

Frame 1755 (the judged hold frame), final tier, 1920 x 1080, no grain; main against the same code with the filled plate. Plate on main: `public/assets/earth/full/sky-hold.webp`, sha256 34514b9f44595e816370488e17f6ea7f88ba8e09578895f4adb9d11ec8d836c8.

## Pits

A star is a peak over the local floor by 0.08 or more; the pit is the deepest pixel in the ring 1.5 to 4.5 px around it minus the floor; the control is the same reading at 2000 points of open sky.

| picture | stars | pit, median | of the floor | stars with a ring pixel under 0.4 of the floor | ring pixel at code 3 or under | control |
|---|---|---|---|---|---|---|
| plate on main | 8187 | -0.0244 | -49 percent | 43 percent | 37 percent | 7 percent |
| plate, pits filled | 8180 | -0.0106 | -22 percent | 1 percent | 12 percent | 6 percent |
| frame 1755, main | 2995 | -0.0318 | -38 percent | 21 percent | 15 percent | 3 percent |
| frame 1755, pits filled | 2996 | -0.0241 | -29 percent | 10 percent | 7 percent | 2 percent |

## G17

- 72 kept tiles. Median 1.194 to 1.186, 25th 1.130 to 1.110. The gate (median at 0.8 or over, no grain): green on main, green with the fill.
- Tiles under 0.8 on main: 0: none.
- Tiles under 0.8 with the fill: 0: none.
- Tiles that cross 0.8: none.
- Per tile, fill over main: median 0.994, least 0.956 (the rule: no kept tile falls by more than 0.1 of its own ratio: held).

## What changes in the frame

- Whole frame: 259937 of 2073600 pixels differ (12.5 percent), 47162 by more than 2 codes, 1583 by more than 8, largest 25; mean luma +0.108 codes.
- Outside the sky (671530 pixels, where a marked plate does not show in the frame): 691 pixels differ, 0 by more than 1 code, largest 1. In the sky (1402070 pixels): 259246 differ (18.5 percent), largest 25.
- Stars: 10313 peaks on main, 10253 on the same pixel with the fill, 25 on the pixel beside (equal neighbours), 35 at the counting threshold (their peak changes by at most 1 of 255). Peak value at the kept stars: largest change 1 of 255.

## The plate

- 333826 pixels of the full plate change (4.8 percent), largest 62 codes, 4113 by more than 20 codes, 51 by more than 40 (narrow dark gaps between bright specks in the densest star cloud); luma lowered by more than 1 code: 0 pixels; star pixels changed: 0.
- Full card: 5603942 to 5648896 bytes (+44954), sha256 0d0599874fe682f3d325607e2ed437d080ac0b8bc67b1ff4384aa7e78d360768.
- Web card: 1613002 to 1588932 bytes (-24070), sha256 3a19488b5435f2ce80f5407a1a968137b88cd7190025334d6494d55b7221261c.

## How it was made, how it goes in

- `python3 assets-src/flightsky/mercury-hold/calm.py public/assets/earth/full/sky-hold.webp sky-hold-full.webp sky-hold-web.webp` on main's plate (f348295e; the same file on 328d0ee4). The same script and constants as Mercury's plate (d312: the pit fill alone, HUE off). Star pixels keep their bytes; a pixel within 7 texels of a star pixel that lies under the floor by more than 1 noise is raised to the floor; nothing is lowered. Deterministic.
- The web card is the Lanczos half of the filled full card (main's web card is that half of its full card but for 7 pixels by one code).
- To lay in (earth's builder, in its own commit): `sky-hold-full.webp` to `public/assets/earth/full/sky-hold.webp`, `sky-hold-web.webp` to `public/assets/earth/web/sky-hold.webp`, and the step in the stop's recipe. If the stop's plate has changed since f348295e (the sha256 above), run the script on the new plate instead; the card's numbers then hold in kind, not in the digit.

## Not measured

- Grain on. Other frames of the hold than the judged one. The web tier in the film. Frames outside the hold.

## Picture

`earth-1755-pits.png`: film x 227 to 427, y 351 to 463, times 4; pixels over 4 codes in the box 689; main left, pits filled right; the lower pair with the levels times 3. The box is the sky with the most pixels changed by more than 4 codes.
- The largest change of the frame is 25 codes at film 426, 309; 4 pixels change by more than 16 codes, none by more than 32.
