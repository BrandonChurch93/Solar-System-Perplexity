# Sun: the pit fill of the hold plate (MAIL 1212, point 3)

Frame 360 (the judged hold frame), final tier, 1920 x 1080, no grain; main against the same code with the filled plate. Plate on main: `public/assets/sun/full/sky-hold.webp`, sha256 87125f7a2f986d43664a6036797fbf5b412252007e441b30e75a8db41b8abf25.

## Pits

A star is a peak over the local floor by 0.08 or more; the pit is the deepest pixel in the ring 1.5 to 4.5 px around it minus the floor; the control is the same reading at 2000 points of open sky.

| picture | stars | pit, median | of the floor | stars with a ring pixel under 0.4 of the floor | ring pixel at code 3 or under | control |
|---|---|---|---|---|---|---|
| plate on main | 13415 | -0.0185 | -80 percent | 66 percent | 70 percent | 5 percent |
| plate, pits filled | 13407 | -0.0093 | -35 percent | 10 percent | 35 percent | 4 percent |
| frame 360, main | 2931 | -0.0406 | -33 percent | 10 percent | 7 percent | 1 percent |
| frame 360, pits filled | 2928 | -0.0373 | -28 percent | 5 percent | 2 percent | 0 percent |

## G17

- 68 kept tiles. Median 1.033 to 1.031, 25th 0.994 to 0.985. The gate (median at 0.8 or over, no grain): green on main, green with the fill.
- Tiles under 0.8 on main: 1: (3,6) 0.777.
- Tiles under 0.8 with the fill: 1: (3,6) 0.777.
- Tiles that cross 0.8: none.
- Per tile, fill over main: median 1.000, least 0.970 (the rule: no kept tile falls by more than 0.1 of its own ratio: held).

## What changes in the frame

- Whole frame: 198535 of 2073600 pixels differ (9.6 percent), 24797 by more than 2 codes, 263 by more than 8, largest 25; mean luma +0.072 codes.
- Outside the sky (642822 pixels, where a marked plate does not show in the frame): 453 pixels differ, 1 by more than 1 code, largest 2. In the sky (1430778 pixels): 198082 differ (13.8 percent), largest 25.
- Stars: 12950 peaks on main, 12900 on the same pixel with the fill, 13 on the pixel beside (equal neighbours), 37 at the counting threshold (their peak changes by at most 1 of 255). Peak value at the kept stars: largest change 2 of 255.

## The plate

- 596359 pixels of the full plate change (5.2 percent), largest 38 codes, 671 by more than 20 codes, 0 by more than 40; luma lowered by more than 1 code: 0 pixels; star pixels changed: 0.
- Full card: 7918818 to 7849002 bytes (-69816), sha256 23fc77a66427ec82b5ede9673e1b87e7e32b48a5139e0030652260cd9c9d5204.
- Web card: 2460728 to 2366572 bytes (-94156), sha256 05dccd3977278b425b91297da5ff3be2280f315d73989a3e92266d577afb09f3.

## How it was made, how it goes in

- `python3 assets-src/flightsky/mercury-hold/calm.py public/assets/sun/full/sky-hold.webp sky-hold-full.webp sky-hold-web.webp` on main's plate (f348295e; the same file on 328d0ee4). The same script and constants as Mercury's plate (d312: the pit fill alone, HUE off). Star pixels keep their bytes; a pixel within 7 texels of a star pixel that lies under the floor by more than 1 noise is raised to the floor; nothing is lowered. Deterministic.
- The web card is the Lanczos half of the filled full card (as main's web card is of its full card, byte for byte in the pixels).
- To lay in (sun's builder, in its own commit): `sky-hold-full.webp` to `public/assets/sun/full/sky-hold.webp`, `sky-hold-web.webp` to `public/assets/sun/web/sky-hold.webp`, and the step in the stop's recipe. If the stop's plate has changed since f348295e (the sha256 above), run the script on the new plate instead; the card's numbers then hold in kind, not in the digit.

## Not measured

- Grain on. Other frames of the hold than the judged one. The web tier in the film. Frames outside the hold.

## Picture

`sun-360-pits.png`: film x 87 to 287, y 575 to 687, times 4; pixels over 4 codes in the box 385; main left, pits filled right; the lower pair with the levels times 3. The box is the sky with the most pixels changed by more than 4 codes.
- The largest change of the frame is 25 codes at film 205, 593; 7 pixels change by more than 16 codes, none by more than 32.
