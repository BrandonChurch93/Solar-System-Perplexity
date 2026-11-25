# Mars: the pit fill of the hold plate (MAIL 1212, point 3)

Frame 2325 (the judged hold frame), final tier, 1920 x 1080, no grain; main against the same code with the filled plate. Plate on main: `public/assets/mars/full/sky-hold.webp`, sha256 0067b70133757c7ed64bb95a5f3fc27a52ccc0f957bc37b17bdcca6ddb0be0ae.

## Pits

A star is a peak over the local floor by 0.08 or more; the pit is the deepest pixel in the ring 1.5 to 4.5 px around it minus the floor; the control is the same reading at 2000 points of open sky.

| picture | stars | pit, median | of the floor | stars with a ring pixel under 0.4 of the floor | ring pixel at code 3 or under | control |
|---|---|---|---|---|---|---|
| plate on main | 9183 | -0.0377 | -74 percent | 64 percent | 50 percent | 5 percent |
| plate, pits filled | 9179 | -0.0137 | -26 percent | 0 percent | 1 percent | 4 percent |
| frame 2325, main | 2345 | -0.0327 | -32 percent | 16 percent | 9 percent | 1 percent |
| frame 2325, pits filled | 2338 | -0.0238 | -22 percent | 6 percent | 3 percent | 0 percent |

## G17

- 80 kept tiles. Median 1.167 to 1.145, 25th 1.026 to 1.026. The gate (median at 0.8 or over, no grain): green on main, green with the fill.
- Tiles under 0.8 on main: 2: (7,6) 0.669, (5,7) 0.765.
- Tiles under 0.8 with the fill: 2: (7,6) 0.669, (5,7) 0.765.
- Tiles that cross 0.8: none.
- Per tile, fill over main: median 0.989, least 0.941 (the rule: no kept tile falls by more than 0.1 of its own ratio: held).

## What changes in the frame

- Whole frame: 202984 of 2073600 pixels differ (9.8 percent), 35905 by more than 2 codes, 991 by more than 8, largest 26; mean luma +0.091 codes.
- Outside the sky (1016883 pixels, where a marked plate does not show in the frame): 701 pixels differ, 0 by more than 1 code, largest 1. In the sky (1056717 pixels): 202283 differ (19.1 percent), largest 26.
- Stars: 7436 peaks on main, 7387 on the same pixel with the fill, 18 on the pixel beside (equal neighbours), 31 at the counting threshold (their peak changes by at most 1 of 255). Peak value at the kept stars: largest change 1 of 255.

## The plate

- 487146 pixels of the full plate change (7.0 percent), largest 125 codes, 7033 by more than 20 codes, 562 by more than 40 (narrow dark gaps between bright specks in the densest star cloud); luma lowered by more than 1 code: 0 pixels; star pixels changed: 0.
- Full card: 6045282 to 6077068 bytes (+31786), sha256 90b49ad5a8a9991d7259ce1cf4117944f9fb96f67a88c2e8d6b79c858cf0b2e6.
- Web card: 1825904 to 1745414 bytes (-80490), sha256 a409c30f48490fe1b181b589163426feef850e866d7926c24e87160f35aafa33.

## How it was made, how it goes in

- `python3 assets-src/flightsky/mercury-hold/calm.py public/assets/mars/full/sky-hold.webp sky-hold-full.webp sky-hold-web.webp` on main's plate (f348295e; the same file on 328d0ee4). The same script and constants as Mercury's plate (d312: the pit fill alone, HUE off). Star pixels keep their bytes; a pixel within 7 texels of a star pixel that lies under the floor by more than 1 noise is raised to the floor; nothing is lowered. Deterministic.
- The web card is the Lanczos half of the filled full card (as main's web card is of its full card, byte for byte in the pixels).
- To lay in (mars's builder, in its own commit): `sky-hold-full.webp` to `public/assets/mars/full/sky-hold.webp`, `sky-hold-web.webp` to `public/assets/mars/web/sky-hold.webp`, and the step in the stop's recipe. If the stop's plate has changed since f348295e (the sha256 above), run the script on the new plate instead; the card's numbers then hold in kind, not in the digit.

## Not measured

- Grain on. Other frames of the hold than the judged one. The web tier in the film. Frames outside the hold.

## Picture

`mars-2325-pits.png`: film x 251 to 451, y 12 to 124, times 4; pixels over 4 codes in the box 568; main left, pits filled right; the lower pair with the levels times 3. The box is the sky with the most pixels changed by more than 4 codes.
- The largest change of the frame is 26 codes at film 411, 328; 9 pixels change by more than 16 codes, none by more than 32.
