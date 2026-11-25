# Neptune: the pit fill of the hold plate (MAIL 1212, point 3)

Frame 4605 (the judged hold frame), final tier, 1920 x 1080, no grain; main against the same code with the filled plate. Plate on main: `public/assets/neptune/full/sky-hold.webp`, sha256 7018ee9dbd7e7b39e43a059099f80cc0dea0e06f3458cec3957fdcef6fcaec58.

## Pits

A star is a peak over the local floor by 0.08 or more; the pit is the deepest pixel in the ring 1.5 to 4.5 px around it minus the floor; the control is the same reading at 2000 points of open sky.

| picture | stars | pit, median | of the floor | stars with a ring pixel under 0.4 of the floor | ring pixel at code 3 or under | control |
|---|---|---|---|---|---|---|
| plate on main | 11520 | -0.0174 | -58 percent | 49 percent | 47 percent | 8 percent |
| plate, pits filled | 11517 | -0.0068 | -23 percent | 3 percent | 20 percent | 7 percent |
| frame 4605, main | 1813 | -0.0264 | -25 percent | 16 percent | 16 percent | 2 percent |
| frame 4605, pits filled | 1809 | -0.0194 | -18 percent | 7 percent | 10 percent | 1 percent |

## G17

- 65 kept tiles. Median 1.027 to 1.000, 25th 0.868 to 0.868. The gate (median at 0.8 or over, no grain): green on main, green with the fill.
- Tiles under 0.8 on main: 8: (7,7) 0.577, (3,2) 0.591, (6,6) 0.662, (7,6) 0.710, (8,7) 0.778, (1,2) 0.778, (10,5) 0.791, (9,7) 0.797.
- Tiles under 0.8 with the fill: 8: (7,7) 0.577, (3,2) 0.587, (6,6) 0.662, (7,6) 0.710, (10,5) 0.758, (1,2) 0.776, (8,7) 0.778, (9,7) 0.797.
- Tiles that cross 0.8: none.
- Per tile, fill over main: median 0.993, least 0.951 (the rule: no kept tile falls by more than 0.1 of its own ratio: held).

## What changes in the frame

- Whole frame: 192715 of 2073600 pixels differ (9.3 percent), 41238 by more than 2 codes, 2703 by more than 8, largest 41; mean luma +0.076 codes.
- Outside the sky (1080415 pixels, where a marked plate does not show in the frame): 606 pixels differ, 0 by more than 1 code, largest 1. In the sky (993185 pixels): 192109 differ (19.3 percent), largest 41.
- Stars: 5485 peaks on main, 5448 on the same pixel with the fill, 8 on the pixel beside (equal neighbours), 29 at the counting threshold (their peak changes by at most 1 of 255). Peak value at the kept stars: largest change 2 of 255.

## The plate

- 501399 pixels of the full plate change (3.7 percent), largest 75 codes, 14051 by more than 20 codes, 495 by more than 40 (narrow dark gaps between bright specks in the densest star cloud); luma lowered by more than 1 code: 0 pixels; star pixels changed: 0.
- Full card: 6962270 to 6891588 bytes (-70682), sha256 d90ec9468f59ce254a42ac9a735c99fb916bf96303466d1fa6ca73d13fdb3464.
- Web card: 2190470 to 2116936 bytes (-73534), sha256 52084a2471097241ac261fc753a6378731ab6d38862ae009846ac7382e706ce8.

## How it was made, how it goes in

- `python3 assets-src/flightsky/mercury-hold/calm.py public/assets/neptune/full/sky-hold.webp sky-hold-full.webp sky-hold-web.webp` on main's plate (f348295e; the same file on 328d0ee4). The same script and constants as Mercury's plate (d312: the pit fill alone, HUE off). Star pixels keep their bytes; a pixel within 7 texels of a star pixel that lies under the floor by more than 1 noise is raised to the floor; nothing is lowered. Deterministic.
- The web card is the Lanczos half of the filled full card (as main's web card is of its full card, byte for byte in the pixels).
- To lay in (neptune's builder, in its own commit): `sky-hold-full.webp` to `public/assets/neptune/full/sky-hold.webp`, `sky-hold-web.webp` to `public/assets/neptune/web/sky-hold.webp`, and the step in the stop's recipe. If the stop's plate has changed since f348295e (the sha256 above), run the script on the new plate instead; the card's numbers then hold in kind, not in the digit.

## Not measured

- Grain on. Other frames of the hold than the judged one. The web tier in the film. Frames outside the hold.

## Picture

`neptune-4605-pits.png`: film x 484 to 684, y 90 to 202, times 4; pixels over 4 codes in the box 785; main left, pits filled right; the lower pair with the levels times 3. The box is the sky with the most pixels changed by more than 4 codes.
- The largest change of the frame is 41 codes at film 714, 77 ([14, 24, 34] to [42, 56, 75]); 84 pixels change by more than 16 codes, 4 by more than 32, 1 by more than 40: single deep gaps between bright specks. Picture: `neptune-4605-cloud.png` (film x 614 to 814, y 21 to 133, times 4: main, pits filled, the difference times 4).
