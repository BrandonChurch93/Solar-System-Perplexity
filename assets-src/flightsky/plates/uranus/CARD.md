# Uranus: the pit fill of the hold plate (MAIL 1212, point 3)

Frame 4035 (the judged hold frame), final tier, 1920 x 1080, no grain; main against the same code with the filled plate. Plate on main: `public/assets/uranus/full/sky-hold.webp`, sha256 bfae95e28229c4a41e312dc294397eda466ce9e214c7c2658794f3d96b0ac345.

## Pits

A star is a peak over the local floor by 0.08 or more; the pit is the deepest pixel in the ring 1.5 to 4.5 px around it minus the floor; the control is the same reading at 2000 points of open sky.

| picture | stars | pit, median | of the floor | stars with a ring pixel under 0.4 of the floor | ring pixel at code 3 or under | control |
|---|---|---|---|---|---|---|
| plate on main | 13218 | -0.0251 | -78 percent | 68 percent | 63 percent | 2 percent |
| plate, pits filled | 13210 | -0.0113 | -31 percent | 9 percent | 33 percent | 1 percent |
| frame 4035, main | 2728 | -0.0271 | -40 percent | 27 percent | 25 percent | 5 percent |
| frame 4035, pits filled | 2727 | -0.0198 | -28 percent | 9 percent | 14 percent | 4 percent |

## G17

- 70 kept tiles. Median 1.178 to 1.157, 25th 1.082 to 1.068. The gate (median at 0.8 or over, no grain): green on main, green with the fill.
- Tiles under 0.8 on main: 4: (7,3) 0.641, (6,2) 0.711, (5,2) 0.719, (5,3) 0.792.
- Tiles under 0.8 with the fill: 4: (7,3) 0.641, (6,2) 0.711, (5,2) 0.716, (5,3) 0.792.
- Tiles that cross 0.8: none.
- Per tile, fill over main: median 0.983, least 0.962 (the rule: no kept tile falls by more than 0.1 of its own ratio: held).

## What changes in the frame

- Whole frame: 378557 of 2073600 pixels differ (18.3 percent), 81041 by more than 2 codes, 4795 by more than 8, largest 31; mean luma +0.176 codes.
- Outside the sky (396725 pixels, where a marked plate does not show in the frame): 477 pixels differ, 0 by more than 1 code, largest 1. In the sky (1676875 pixels): 378080 differ (22.5 percent), largest 31.
- Stars: 8729 peaks on main, 8606 on the same pixel with the fill, 34 on the pixel beside (equal neighbours), 89 at the counting threshold (their peak changes by at most 2 of 255). Peak value at the kept stars: largest change 3 of 255.

## The plate

- 663040 pixels of the full plate change (4.9 percent), largest 56 codes, 11073 by more than 20 codes, 66 by more than 40 (narrow dark gaps between bright specks in the densest star cloud); luma lowered by more than 1 code: 0 pixels; star pixels changed: 0.
- Full card: 8788576 to 8712990 bytes (-75586), sha256 cb4d673ad9860dde5d78d942f7f2208b8fa4eed1a2edc387785ebad74abe5015.
- Web card: 2563054 to 2474370 bytes (-88684), sha256 f1f8c52bc502c9608b314e902d37f68b296089849838e8b61fd25fa300d6b26f.

## How it was made, how it goes in

- `python3 assets-src/flightsky/mercury-hold/calm.py public/assets/uranus/full/sky-hold.webp sky-hold-full.webp sky-hold-web.webp 0 40` on main's plate (f348295e; the same file on 328d0ee4). The same script and constants as Mercury's plate (d312: the pit fill alone, HUE off, the fourth argument 0), with one option on, the fifth argument: the fill fades out where the sky's floor is brighter than 40 codes of the plate and is off from 80 (1.1 percent of this plate lies over 60). Reason below. With the option absent the script writes Mercury's plate bit for bit (checked: sha256 916d5183...). Star pixels keep their bytes; a pixel within 7 texels of a star pixel that lies under the floor by more than 1 noise is raised to the floor; nothing is lowered. Deterministic.
- The web card is the Lanczos half of the filled full card (as main's web card is of its full card, byte for byte in the pixels).
- To lay in (uranus's builder, in its own commit): `sky-hold-full.webp` to `public/assets/uranus/full/sky-hold.webp`, `sky-hold-web.webp` to `public/assets/uranus/web/sky-hold.webp`, and the step in the stop's recipe. If the stop's plate has changed since f348295e (the sha256 above), run the script on the new plate instead; the card's numbers then hold in kind, not in the digit.

## Why the option, and the plain script's numbers

The plain script (as on Mercury and the five other plates) also lightens narrow dark lanes inside Uranus's brightest star cloud, which are the picture's own and no ringing. Measured in the same frame, plain script against main: 442 pixels change by more than 16 codes, 58 by more than 32, 19 by more than 40, largest 58 at film 1507, 671; tile (8,4) crosses 0.8 (0.849 to 0.792), per tile least 0.933; pits 27 to 9 percent of the stars, the same. With the option (this card): 102 pixels by more than 16 codes, none by more than 32, largest 31; no tile crosses; per tile least 0.962. Mercury's plate has no floor over 80 codes, so the option would do next to nothing there and is off. Picture: `uranus-4035-cloud.png` (film x 1407 to 1607, y 615 to 727, times 4: main, this plate, the plain script's plate). The plain script's plate is not on the branch (full sha256 6a66b1182264ac46e8f4fc7bb2ea67706140eace3eb021e3e5360e0eebaccbb4; the command without the last two arguments makes it).

## Not measured

- Grain on. Other frames of the hold than the judged one. The web tier in the film. Frames outside the hold.

## Picture

`uranus-4035-pits.png`: film x 858 to 1058, y 92 to 204, times 4; pixels over 4 codes in the box 1381; main left, pits filled right; the lower pair with the levels times 3. The box is the sky with the most pixels changed by more than 4 codes.
- The largest change of the frame is 31 codes at film 1347, 520; 102 pixels change by more than 16 codes, none by more than 32.
