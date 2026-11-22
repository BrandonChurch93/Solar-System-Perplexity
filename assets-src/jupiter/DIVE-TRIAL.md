# Dive trial (mail 99)

One commit on top of the READY head: `d96263f` on `6dac95f`. Only `src/stops/jupiter/plan.ts` changes: `plunge = { power: 8, lead: 0.48 }` (READY head: `{ power: 4 }`, no lead).

## What it does

- The camera path of the dive is the same path. Only the time on it changes, from frame 2970 to the cut at 3024.
- The size of the disc on screen (its logarithm) follows `m0 u + lead u^2 + (1 - m0 - lead) u^power`, with `u` from 0 at 2970 to 1 at the cut and `m0` the hold's own drift.
- READY head: `lead 0`, `power 4`. The disc hardly grows before 2990 and the growth doubles every few frames after it.
- Trial: the growth rate rises in a straight line from the first frame of the dive (a constant acceleration), then bends up into the plunge under the cover. No flat part and no kink.
- From the cut on (3024) nothing changes: the terrain side of the cover, the terrain view and the rise keep their bytes.

## Motion per frame, READY head and trial

Columns: radius of the disc on screen in px at 1920 x 1080 (the hold has 489), growth of the radius to the next frame in percent, screen motion inside the shutter in px (the engine's own measure, `rawMotion`; a frame counts as soft from 10 px), height of the camera over the cloud tops in planet radii. Tool: `out/work/jupiter/tools/divepace.ts`, run on each tree.

| frame | READY radius | READY growth | READY motion | READY height | trial radius | trial growth | trial motion | trial height |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2970 | 489 | 0.02 | 0.10 | 3.240 | 489 | 0.05 | 0.17 | 3.240 |
| 2971 | 489 | 0.02 | 0.10 | 3.239 | 489 | 0.11 | 0.42 | 3.238 |
| 2972 | 489 | 0.02 | 0.10 | 3.238 | 490 | 0.17 | 0.78 | 3.232 |
| 2973 | 489 | 0.03 | 0.12 | 3.237 | 491 | 0.22 | 1.09 | 3.222 |
| 2974 | 490 | 0.03 | 0.14 | 3.236 | 492 | 0.28 | 1.36 | 3.208 |
| 2975 | 490 | 0.04 | 0.17 | 3.234 | 493 | 0.34 | 1.62 | 3.190 |
| 2976 | 490 | 0.04 | 0.21 | 3.232 | 495 | 0.40 | 1.88 | 3.169 |
| 2977 | 490 | 0.06 | 0.27 | 3.230 | 497 | 0.46 | 2.15 | 3.144 |
| 2978 | 490 | 0.07 | 0.35 | 3.226 | 499 | 0.51 | 2.42 | 3.116 |
| 2979 | 491 | 0.09 | 0.45 | 3.222 | 502 | 0.57 | 2.69 | 3.084 |
| 2980 | 491 | 0.12 | 0.57 | 3.216 | 505 | 0.63 | 2.97 | 3.049 |
| 2981 | 492 | 0.15 | 0.71 | 3.209 | 508 | 0.69 | 3.23 | 3.012 |
| 2982 | 492 | 0.18 | 0.87 | 3.199 | 511 | 0.75 | 3.45 | 2.971 |
| 2983 | 493 | 0.22 | 1.06 | 3.188 | 515 | 0.81 | 3.57 | 2.928 |
| 2984 | 494 | 0.27 | 1.29 | 3.174 | 519 | 0.86 | 3.80 | 2.882 |
| 2985 | 496 | 0.33 | 1.54 | 3.157 | 524 | 0.92 | 4.05 | 2.833 |
| 2986 | 497 | 0.39 | 1.83 | 3.136 | 529 | 0.98 | 4.32 | 2.782 |
| 2987 | 499 | 0.46 | 2.16 | 3.112 | 534 | 1.04 | 4.59 | 2.729 |
| 2988 | 502 | 0.54 | 2.53 | 3.084 | 539 | 1.10 | 4.88 | 2.673 |
| 2989 | 504 | 0.63 | 2.94 | 3.051 | 545 | 1.16 | 5.17 | 2.615 |
| 2990 | 508 | 0.73 | 3.39 | 3.013 | 552 | 1.23 | 5.50 | 2.556 |
| 2991 | 511 | 0.84 | 3.83 | 2.970 | 559 | 1.29 | 5.85 | 2.494 |
| 2992 | 516 | 0.96 | 4.18 | 2.921 | 566 | 1.36 | 6.23 | 2.431 |
| 2993 | 521 | 1.09 | 4.74 | 2.867 | 574 | 1.42 | 6.62 | 2.365 |
| 2994 | 526 | 1.23 | 5.35 | 2.806 | 582 | 1.50 | 7.04 | 2.299 |
| 2995 | 533 | 1.39 | 6.03 | 2.738 | 591 | 1.57 | 7.57 | 2.230 |
| 2996 | 540 | 1.55 | 6.79 | 2.664 | 600 | 1.65 | 8.13 | 2.161 |
| 2997 | 549 | 1.73 | 7.64 | 2.583 | 610 | 1.74 | 8.74 | 2.089 |
| 2998 | 558 | 1.93 | 8.64 | 2.496 | 621 | 1.83 | 9.41 | 2.017 |
| 2999 | 569 | 2.14 | 9.75 | 2.401 | 632 | 1.93 | 10.18 | 1.942 |
| 3000 | 582 | 2.36 | 10.98 | 2.301 | 644 | 2.04 | 11.12 | 1.867 |
| 3001 | 595 | 2.60 | 12.48 | 2.194 | 658 | 2.16 | 12.21 | 1.789 |
| 3002 | 611 | 2.85 | 14.16 | 2.081 | 672 | 2.29 | 13.45 | 1.711 |
| 3003 | 629 | 3.12 | 16.16 | 1.963 | 688 | 2.44 | 14.93 | 1.630 |
| 3004 | 649 | 3.40 | 18.69 | 1.841 | 705 | 2.61 | 16.81 | 1.548 |
| 3005 | 671 | 3.71 | 21.71 | 1.715 | 723 | 2.79 | 19.09 | 1.465 |
| 3006 | 697 | 4.03 | 25.44 | 1.586 | 744 | 3.00 | 21.70 | 1.379 |
| 3007 | 725 | 4.36 | 30.25 | 1.456 | 766 | 3.24 | 24.96 | 1.292 |
| 3008 | 757 | 4.72 | 35.73 | 1.325 | 792 | 3.51 | 29.72 | 1.203 |
| 3009 | 794 | 5.10 | 44.17 | 1.195 | 820 | 3.82 | 35.24 | 1.113 |
| 3010 | 836 | 5.49 | 54.05 | 1.066 | 852 | 4.16 | 42.59 | 1.021 |
| 3011 | 883 | 5.91 | 68.38 | 0.941 | 888 | 4.55 | 52.60 | 0.929 |
| 3012 | 937 | 6.34 | 86.27 | 0.821 | 929 | 5.00 | 65.60 | 0.836 |
| 3013 | 998 | 6.80 | 104.83 | 0.706 | 977 | 5.50 | 80.45 | 0.743 |
| 3014 | 1068 | 7.28 | 123.85 | 0.599 | 1032 | 6.06 | 97.31 | 0.651 |
| 3015 | 1149 | 7.78 | 142.37 | 0.500 | 1097 | 6.71 | 116.24 | 0.561 |
| 3016 | 1242 | 8.30 | 158.41 | 0.411 | 1173 | 7.43 | 136.54 | 0.475 |
| 3017 | 1349 | 8.85 | 169.14 | 0.331 | 1263 | 8.24 | 156.40 | 0.393 |
| 3018 | 1474 | 9.42 | 171.42 | 0.262 | 1372 | 9.16 | 172.54 | 0.317 |
| 3019 | 1619 | 10.01 | 162.62 | 0.204 | 1503 | 10.19 | 180.12 | 0.249 |
| 3020 | 1790 | 10.63 | 141.71 | 0.155 | 1664 | 11.34 | 173.49 | 0.189 |
| 3021 | 1991 | 11.27 | 152.80 | 0.116 | 1864 | 12.63 | 163.02 | 0.139 |
| 3022 | 2228 | 11.94 | 162.46 | 0.085 | 2115 | 14.08 | 191.11 | 0.098 |
| 3023 | 2511 | cut | 158.35 | 0.062 | 2435 | cut | 197.52 | 0.067 |

## Read in three lines

- 2997, the judged frame: the disc is 610 px in radius (the hold 489, the READY head 549), 25 percent over the hold in place of 12, and it still grows 1.74 percent a frame. Motion in the shutter 8.74 px against 7.64, under the soft threshold of 10. The first frame over 10 px is 2999 (10.18) in the trial and 3000 (10.98) in the READY head.
- The start: the READY head moves under 1 px a frame until 2982 and then doubles every four to five frames. The trial is at 1 px by 2973, 3 px by 2980 and 5.5 px by 2990. The growth of the disc rises by 0.06 percent each frame from 2970 to 2992 (a straight line), then a little faster.
- The plunge: from 3001 to 3017 the trial is slower than the READY head (3005 19.1 px against 21.7, 3010 42.6 against 54.1, 3014 97 against 124), so the stretch the critic named in item 35 (3002 to 3010) is calmer. The speed taken out there comes back under the cover: 3019 to 3023 run at 163 to 198 px against 142 to 163.

## Other laws tried, at 2997

All offline with `divepace.ts`, none built.

| law | disc at 2997 | motion at 2997 | why not |
| --- | --- | --- | --- |
| the READY head's law with power 3.4 | 581 px | 10.27 px | over the threshold at the judged frame (mail 99 names it) |
| eased push, `A 0.46, u1 0.4, p 8` | 630 px | 8.83 px | the growth holds nearly flat from 2989 to 2997 (plus 11 percent in 8 frames after plus 100 percent in the 9 before): push, cruise, plunge reads as two moves |
| quadratic lead 0.50, power 10 | 614 px | 8.75 px | 4 px more disc for a sharper plunge and more speed under the cover |
| lead as u^1.8, `A 0.44`, power 8 | 617 px | 8.48 px | a harder start out of the hold for 7 px of disc |
| quadratic lead 0.50, power 8 | 615 px | 9.16 px | over "about 9" for 5 px of disc |
| quadratic lead 0.52, power 8 | 621 px | 9.59 px | too near the threshold |

Chosen: quadratic lead 0.48, power 8: 610 px at 8.74 px. It gives a larger disc at the judged frame than power 3.4 (581 px) with less blur.

## The judged frame 2997 at the final tier

- READY head: sha256 `0a35fc826196a462`. Trial: `645d422007dc1f39` (64 samples, 119 s). Both 1920 x 1080.
- Looked at both at native size and at twice the size at Io and its shadow, the storm, the upper belt and the lower left limb. The disc is cut by the top and the bottom edge of the frame now (diameter 1220 px in a frame 1080 high); in the READY head only the top touches the edge. Io, its shadow, the storm, the lit limb with its glow and the band of the sky are in frame in both. No rim of the sky patch shows.
- Sharpness, as the mean gradient of the luma in a window on the same content (the trial's window is 11 percent larger; the last column is the trial scaled back to the READY head's size):

| place | READY head | trial, per pixel | trial, same content size |
| --- | --- | --- | --- |
| Io and its shadow | 4.50 | 3.96 | 3.89 |
| the storm | 7.27 | 7.19 | 7.55 |
| upper belt | 4.17 | 3.88 | 3.95 |
| ovals, lower left | 5.50 | 5.40 | 5.60 |

- So per pixel the trial is 1 to 2 percent softer at the storm and the ovals and 7 to 12 percent softer at the upper belt and at Io, which sit far from the point the camera flies at. At twice the size Io's edge and the belt's curls are a little softer than in the READY head; the storm's arms and the small ovals read the same.

## The dive review sheet

- READY head `kept/dive-sheet-b22.png` (f504e72ebdbf8e8e), trial `kept/dive-sheet-trial.png` (8df5198d74d4ea49); frames 2970, 2978, 2986, 2994, 3002, 3010, 3019, 3027, 3035, 3043, 3051, 3059.
- 3027, 3035, 3043, 3051, 3059: the same bytes as the READY head. 2970 to 3019 differ, as they must.
- Looked at each of the seven changed frames beside the READY head at half size, and 2994, 3002 and 3010 at native size:
  - 2970: the hold's picture. 2978: the disc a little larger (499 against 490). 2986: clearly larger (529 against 497). 2994: 582 against 526, the top of the disc at the frame edge. 3002: 672 against 611. 3010: 852 against 836, and less smeared (42.6 px against 54.1): the curls of the belt beside the storm hold their shape.
  - 3019 (under the cover): the camera is higher (0.249 against 0.204 planet radii), so the black corner of sky at the upper left is larger; the cream haze and the pale smear at the lower left are the same in kind.
  - In the READY head the sheet reads still, still, still, a little, more, plunge. In the trial each of the first six frames is larger than the one before by a growing step.

## Measures on the trial (every frame, 1856 s)

Tree: d96263f, main da02e63 (code 3a09527), engine hash be043ade04a7ab6e, stop hash fcee457e7faf488b (the READY head: 02fedb3bb7c19edb). File `out/work/measure/jupiter-trial-full.json` on the agent's VM.

- G13 pass: 0 of 463 frames over 0.02 soft. The dive frames it counts (2970 to 3015; the cover frames are skipped) have 0 soft pixels in both. Texels a pixel, READY head | trial: 2990 2.000 | 1.972, 2997 1.975 | 1.885, 3000 1.932 | 1.814, 3005 1.745 | 1.749, 3010 1.796 | 1.784, 3012 1.680 | 1.691, 3014 1.684 | 1.700, 3015 1.614 | 1.652. The floor is 1.
- The G13 numbers of the other 417 frames (hold, terrain side of the dive, terrain, rise) are the same to the last digit as the READY head's. Worst frames as before: 3253 0.95 percent, 3254 0.78, 3261 0.71.
- G5 pass: coverage at 2997 0.544 (READY head 0.460); 2895 0.352, 3150 0.754, 3296 0.280 as before; invalid 0.
- G17 pass, unchanged: 2895 median 1.039, quarter point 0.949; 3150 median 1.023, quarter point 0.963.

## The dive cover review sheet

- READY head `kept/dive-cover-b20.png`, trial `kept/dive-cover-trial.png` (bc9ddcd176be7f8a); frames 3019 to 3030, every frame.
- 3024 to 3030 (the cut and the terrain side): the same bytes as the READY head, all seven.
- 3019 to 3023 (the orbit side) differ. Looked at each beside the READY head at 960 px a frame and at 900 px across the cut (`cov_a.jpg`, `cov_b.jpg`, `cov_cut.jpg` among the looks):
  - 3019, 3020: the camera is higher (0.249 against 0.204 planet radii at 3019), so the black corner of sky at the upper left is a little larger; the pale smear of the zone sits where the READY head already shows the red smear of the storm.
  - 3021: the red smear at the lower left, fainter than in the READY head. 3022: a trace of it; the READY head has none. 3023: cream haze, the limb line in the same place.
  - The cut 3023 to 3024: as small as in the READY head. Color, limb line and direction of the streaks carry across.
- Screen motion in the shutter under the cover, 3019 to 3023: 163 to 198 px (READY head 142 to 163). The trial's disc is 7 percent smaller than the READY head's at 3019 (radius 1503 against 1619) and 3 percent smaller at 3023 (2435 against 2511).

## The same proof on the round 33 build

Tree: branch head `ddc59b3`, which holds main 677e7286 (code 84b0ea4a, the round 33 build). `git diff origin/main -- src/stops/jupiter public/assets/jupiter` is the two lines of `plan.ts`.

- Drafts 2970 to 3023: 54 of 54 the same bytes as on main 3a09527. So the dive review sheet, the dive cover sheet and the measures above stand for this build.
- Drafts 2895, 3150, 3024 to 3033, 3261 to 3277: 29 of 29 the same bytes. Draft 3296 moves.
- Finals: 2895 c34e30ce2c61de16, 2997 645d422007dc1f39, 3150 173790897f041964: the same bytes as on main 3a09527. 3296 2f0f0822aa570c8e moves against main 3a09527 in 570,936 pixels, every one of them in the sky: the difference map is black inside the disc and on Io. That is the flight sky of the round 33 build, not this folder.
