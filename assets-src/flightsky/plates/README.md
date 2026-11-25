# The hold sky plates with the pits filled (MAIL 1212, point 3)

One folder a stop: `sky-hold-full.webp` (goes to `public/assets/<stop>/full/sky-hold.webp`), `sky-hold-web.webp` (to `public/assets/<stop>/web/sky-hold.webp`), `CARD.md` (the measures at the stop's judged hold frame, final tier, no grain, main against the filled plate), the pictures. Nothing here is loaded by the film; each stop's builder lays its plate in with its own commit. Made by `../mercury-hold/calm.py` from main's plates (f348295e).

| stop | frame | pits in the frame, stars with a ring pixel under 0.4 of the floor | G17 median | tiles under 0.8, main to fill | per tile least | outside the sky, pixels over 1 code | full card bytes | web card bytes |
|---|---|---|---|---|---|---|---|---|
| Sun | 360 | 10 to 5 percent | 1.033 to 1.031 | 1 to 1 | 0.970 | 1 (largest 2) | 7918818 to 7849002 | 2460728 to 2366572 |
| Venus | 1185 | 21 to 5 percent | 0.962 to 0.935 | 2 to 2 | 0.958 | 0 | 5898168 to 5885536 | 1772928 to 1717200 |
| Earth | 1755 | 21 to 10 percent | 1.194 to 1.186 | 0 to 0 | 0.956 | 0 | 5603942 to 5648896 | 1613002 to 1588932 |
| Mars | 2325 | 16 to 6 percent | 1.167 to 1.145 | 2 to 2 | 0.941 | 0 | 6045282 to 6077068 | 1825904 to 1745414 |
| Uranus | 4035 | 27 to 9 percent | 1.178 to 1.157 | 4 to 4 | 0.962 | 0 | 8788576 to 8712990 | 2563054 to 2474370 |
| Neptune | 4605 | 16 to 7 percent | 1.027 to 1.000 | 8 to 8 | 0.951 | 0 | 6962270 to 6891588 | 2190470 to 2116936 |

- No tile crosses 0.8 at any of the six; the gate is green both ways at all six; no kept tile falls by more than 0.1 of its own ratio.
- Uranus alone has the script's fifth argument on (40): the fill fades out where the sky's floor is brighter than 40 codes, because the plain script lightened the dark lanes of its brightest star cloud (58 pixels of the frame by more than 32 codes, a tile across 0.8). The reason and both sets of numbers are in its card.
- Jupiter: no plate. Its full card is 7200 x 4050 and lossy, made from a 3520 master that is not in the tree; the fill belongs on the master before the scale step. The script and that line went to jupiter_coder. Its pits on main: 44 percent of the stars on the card as shipped, 72 percent taken to the hero's scale.
- Saturn: 1 percent of the stars with a pit. Its hold sky has no such fault and is left.
- Mercury: its plate went to mercury_builder (`../MERCURY-1165.md`).
