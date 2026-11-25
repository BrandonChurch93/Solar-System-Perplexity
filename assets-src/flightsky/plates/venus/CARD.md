# Venus: the pit fill of the hold plate (MAIL 1212, point 3)

Frame 1185 (the judged hold frame), final tier, 1920 x 1080, no grain; main against the same code with the filled plate. Plate on main: `public/assets/venus/full/sky-hold.webp`, sha256 a53872f1910ebeb703da94a74d2036aaf69ffb6a405e32aa532ad1b52c9e7f08.

## Pits

A star is a peak over the local floor by 0.08 or more; the pit is the deepest pixel in the ring 1.5 to 4.5 px around it minus the floor; the control is the same reading at 2000 points of open sky.

| picture | stars | pit, median | of the floor | stars with a ring pixel under 0.4 of the floor | ring pixel at code 3 or under | control |
|---|---|---|---|---|---|---|
| plate on main | 9281 | -0.0292 | -64 percent | 54 percent | 44 percent | 0 percent |
| plate, pits filled | 9279 | -0.0154 | -29 percent | 4 percent | 10 percent | 0 percent |
| frame 1185, main | 2608 | -0.0293 | -36 percent | 21 percent | 18 percent | 0 percent |
| frame 1185, pits filled | 2603 | -0.0209 | -24 percent | 5 percent | 5 percent | 0 percent |

## G17

- 77 kept tiles. Median 0.962 to 0.935, 25th 0.844 to 0.840. The gate (median at 0.8 or over, no grain): green on main, green with the fill.
- Tiles under 0.8 on main: 2: (6,6) 0.791, (7,4) 0.792.
- Tiles under 0.8 with the fill: 2: (6,6) 0.791, (7,4) 0.792.
- Tiles that cross 0.8: none.
- Per tile, fill over main: median 0.978, least 0.958 (the rule: no kept tile falls by more than 0.1 of its own ratio: held).

## What changes in the frame

- Whole frame: 289852 of 2073600 pixels differ (14.0 percent), 40828 by more than 2 codes, 1099 by more than 8, largest 47; mean luma +0.130 codes.
- Outside the sky (643999 pixels, where a marked plate does not show in the frame): 499 pixels differ, 0 by more than 1 code, largest 1. In the sky (1429601 pixels): 289353 differ (20.2 percent), largest 47.
- Stars: 8834 peaks on main, 8762 on the same pixel with the fill, 23 on the pixel beside (equal neighbours), 49 at the counting threshold (their peak changes by at most 1 of 255). Peak value at the kept stars: largest change 1 of 255.

## The plate

- 397567 pixels of the full plate change (4.0 percent), largest 71 codes, 8688 by more than 20 codes, 571 by more than 40 (narrow dark gaps between bright specks in the densest star cloud); luma lowered by more than 1 code: 0 pixels; star pixels changed: 0.
- Full card: 5898168 to 5885536 bytes (-12632), sha256 65c4a678f7fc692348aaa65fd0a92f568f60396eab691d9f3f879e1969ad3192.
- Web card: 1772928 to 1717200 bytes (-55728), sha256 a1fa954c59f067274a0b44f4d4005ff78029b0a253e9b648da4e1cd511242b3c.

## How it was made, how it goes in

- `python3 assets-src/flightsky/mercury-hold/calm.py public/assets/venus/full/sky-hold.webp sky-hold-full.webp sky-hold-web.webp` on main's plate (f348295e; the same file on 328d0ee4). The same script and constants as Mercury's plate (d312: the pit fill alone, HUE off). Star pixels keep their bytes; a pixel within 7 texels of a star pixel that lies under the floor by more than 1 noise is raised to the floor; nothing is lowered. Deterministic.
- The web card is the Lanczos half of the filled full card (as main's web card is of its full card, byte for byte in the pixels).
- To lay in (venus's builder, in its own commit): `sky-hold-full.webp` to `public/assets/venus/full/sky-hold.webp`, `sky-hold-web.webp` to `public/assets/venus/web/sky-hold.webp`, and the step in the stop's recipe. If the stop's plate has changed since f348295e (the sha256 above), run the script on the new plate instead; the card's numbers then hold in kind, not in the digit.

## Not measured

- Grain on. Other frames of the hold than the judged one. The web tier in the film. Frames outside the hold.

## Picture

`venus-1185-pits.png`: film x 1459 to 1659, y 593 to 705, times 4; pixels over 4 codes in the box 636; main left, pits filled right; the lower pair with the levels times 3. The box is the sky with the most pixels changed by more than 4 codes.
- The largest change of the frame is 47 codes at film 1513, 636 ([70, 42, 16] to [117, 74, 36]); 93 pixels change by more than 16 codes, 2 by more than 32, 1 by more than 40: single deep gaps between bright specks. Picture: `venus-1185-cloud.png` (film x 1413 to 1613, y 580 to 692, times 4: main, pits filled, the difference times 4).
