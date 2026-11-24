# Calibration of npm run smooth, 2026-11-23

Nine jobs smcal-01 to smcal-09 on the Builder machines, commit 8c454593, parts path, pictures, place, parity, draft, whole film frames (the page had no capture rate yet). The full report of each stop lies beside this file as `<stop>.md`. A number marked RED is over the limit proposed in the first line of its table; these limits are a proposal until the Builder rules.

Pictures and place, limits: pictures level step 1.3, pop 1.45, block pop 20; place sides mean 6, sides 99th 60, body level step 3.2, body colour step 4.0, pop 1.9

| stop | job | move | pictures: level step | pop | block pop | place off: sides mean | sides 99th | body level step | body colour step | pop | red numbers |
|---|---|---|---|---|---|---|---|---|---|---|---|
| sun | smcal-01 | rise | 0.62 @205 | 1.15 @266 | 3.27 @202 |  |  |  |  |  | 0 |
| mercury | smcal-02 | dive | 0.70 @706 | 1.16 @732 | 7.89 @701 | 9.89 RED | 103 RED | 1.39 @745 | 1.44 @745 | 2.17 @743 RED | 3 |
| mercury | smcal-02 | rise | 1.61 @1024 RED | 1.48 @1034 RED | 47.20 @1044 RED | 10.43 RED | 93 RED | 3.93 @991 RED | 4.49 @991 RED | 2.08 @990 RED | 8 |
| venus | smcal-03 | dive | 0.99 @1277 | 1.18 @1319 | 5.74 @1337 | 2.86 | 40 | 0.93 @1331 | 1.18 @1331 | 1.55 @1342 | 0 |
| venus | smcal-03 | rise | 0.88 @1583 | 1.15 @1615 | 17.53 @1615 | 2.79 | 41 | 2.21 @1555 | 2.97 @1555 | 1.68 @1554 | 0 |
| earth | smcal-04 | dive | 0.60 @1902 | 1.47 @1887 RED | 4.67 @1870 | 10.97 RED | 122 RED | 1.64 @1919 | 2.03 @1919 | 2.20 @1918 RED | 4 |
| earth | smcal-04 | rise | 1.25 @2151 | 1.83 @2123 RED | 8.25 @2122 | 12.47 RED | 122 RED | 2.85 @2101 | 3.14 @2101 | 2.38 @2100 RED | 4 |
| mars | smcal-05 | dive | 1.82 @2403 RED | 1.87 @2421 RED | 51.12 @2403 RED | 14.39 RED | 98 RED | 3.61 @2454 RED | 4.17 @2454 RED | 4.35 @2453 RED | 8 |
| mars | smcal-05 | rise | 1.65 @2731 RED | 1.33 @2720 | 8.02 @2731 | 14.46 RED | 99 RED | 4.17 @2693 RED | 5.46 @2705 RED | 2.48 @2692 RED | 6 |
| jupiter | smcal-06 | dive | 1.23 @2990 | 1.34 @2975 | 11.72 @2975 | 4.57 | 44 | 2.32 @3025 | 3.22 @3025 | 1.82 @3023 | 0 |
| jupiter | smcal-06 | rise | 2.30 @3287 RED | 1.31 @3249 | 5.85 @3308 | 5.07 | 45 | 3.11 @3277 | 3.87 @3270 | 1.29 @3282 | 1 |
| saturn | smcal-07 | dive | 0.08 @3557 | 1.09 @3545 | 4.09 @3547 |  |  |  |  |  | 0 |
| saturn | smcal-07 | rise | 0.63 @3895 | 1.54 @3815 RED | 18.03 @3894 |  |  |  |  |  | 1 |
| uranus | smcal-08 | dive | 0.77 @4138 | 1.40 @4140 | 6.85 @4137 | 1.17 | 26 | 0.97 @4186 | 1.02 @4186 | 1.45 @4173 | 0 |
| uranus | smcal-08 | rise | 0.21 @4391 | 1.52 @4400 RED | 28.29 @4465 RED | 2.56 | 28 | 1.90 @4402 | 2.04 @4392 | 1.20 @4391 | 2 |
| neptune | smcal-09 | dive | 0.26 @4744 | 1.33 @4745 | 12.13 @4694 |  |  |  |  |  | 0 |
| neptune | smcal-09 | rise | 0.77 @4965 | 1.81 @4963 RED | 14.06 @4963 |  |  |  |  |  | 1 |

Parity (uhd scaled down against master, draft), limits: mean 12, coarse mean 3.2, block level 12, level 2.2

| stop | job | frames | largest mean | largest coarse mean | largest block level | largest level | frames with a red number |
|---|---|---|---|---|---|---|---|
| sun | smcal-01 | 4 | 10.68 @225 | 2.72 @225 | -4.7 @248 | -2.10 @225 | none |
| mercury | smcal-02 | 7 | 6.40 @1016 | 4.40 @1016 RED | 42.2 @1016 RED | 1.45 @713 | 713, 735, 998, 1016 |
| venus | smcal-03 | 7 | 2.83 @1586 | 1.24 @1586 | -4.7 @1586 | -0.47 @1328 | none |
| earth | smcal-04 | 7 | 5.17 @2156 | 3.41 @2156 RED | -21.7 @1853 RED | -1.85 @2156 | 1853, 1898, 2156 |
| mars | smcal-05 | 7 | 2.08 @2726 | 1.27 @2726 | 9.6 @2726 | 1.08 @2726 | none |
| jupiter | smcal-06 | 7 | 3.67 @3259 | 2.61 @3259 | -23.4 @3038 RED | -0.97 @3259 | 3038, 3259 |
| saturn | smcal-07 | 7 | 7.97 @3829 | 6.42 @3829 RED | -37.3 @3829 RED | -5.99 @3829 RED | 3720, 3829 |
| uranus | smcal-08 | 7 | 3.32 @4436 | 2.62 @4436 | -10.8 @4436 | -2.44 @4436 RED | 4436 |
| neptune | smcal-09 | 7 | 5.74 @4725 | 4.99 @4725 RED | 27.8 @4725 RED | 1.73 @4969 | 4725, 4748, 4969, 4988 |

Red numbers a stop would carry from these three parts: sun 0, mercury 13, venus 0, earth 10, mars 14, jupiter 2, saturn 4, uranus 3, neptune 3

pictures level step: 0.08, 0.21, 0.26, 0.60, 0.62, 0.63, 0.70, 0.77, 0.77, 0.88, 0.99, 1.23, 1.25, 1.61, 1.65, 1.82, 2.30
pictures pop: 1.09, 1.15, 1.15, 1.16, 1.18, 1.31, 1.33, 1.33, 1.34, 1.40, 1.47, 1.48, 1.52, 1.54, 1.81, 1.83, 1.87
pictures block pop: 3.27, 4.09, 4.67, 5.74, 5.85, 6.85, 7.89, 8.02, 8.25, 11.72, 12.13, 14.06, 17.53, 18.03, 28.29, 47.20, 51.12
place sides mean: 1.17, 2.56, 2.79, 2.86, 4.57, 5.07, 9.89, 10.43, 10.97, 12.47, 14.39, 14.46
place sides 99th: 26.00, 28.00, 40.00, 41.00, 44.00, 45.00, 93.00, 98.00, 99.00, 103.00, 122.00, 122.00
place body level step: 0.93, 0.97, 1.39, 1.64, 1.90, 2.21, 2.32, 2.85, 3.11, 3.61, 3.93, 4.17
place body colour step: 1.02, 1.18, 1.44, 2.03, 2.04, 2.97, 3.14, 3.22, 3.87, 4.17, 4.49, 5.46
place pop: 1.20, 1.29, 1.45, 1.55, 1.68, 1.82, 2.08, 2.17, 2.20, 2.38, 2.48, 4.35
parity mean: 1.17, 1.21, 1.25, 1.27, 1.27, 1.28, 1.32, 1.41, 1.43, 1.48, 1.48, 1.50, 1.51, 1.55, 1.55, 1.55, 1.67, 1.70, 1.74, 1.76, 1.78, 1.85, 1.86, 1.87, 1.88, 2.00, 2.07, 2.08, 2.12, 2.15, 2.18, 2.27, 2.28, 2.30, 2.41, 2.44, 2.54, 2.56, 2.66, 2.71, 2.83, 3.13, 3.28, 3.32, 3.44, 3.54, 3.67, 3.92, 3.93, 3.95, 4.17, 4.17, 4.31, 4.44, 5.17, 5.37, 5.74, 6.40, 7.97, 10.68
parity coarse: 0.24, 0.32, 0.36, 0.39, 0.41, 0.42, 0.47, 0.49, 0.49, 0.50, 0.51, 0.53, 0.55, 0.55, 0.55, 0.57, 0.66, 0.68, 0.70, 0.71, 0.72, 0.72, 0.79, 0.90, 0.90, 0.92, 0.95, 0.96, 0.98, 1.00, 1.01, 1.04, 1.04, 1.05, 1.05, 1.12, 1.18, 1.24, 1.27, 1.38, 1.47, 1.58, 1.69, 1.85, 1.91, 2.11, 2.30, 2.45, 2.49, 2.52, 2.61, 2.62, 2.72, 2.99, 3.03, 3.41, 3.52, 4.40, 4.99, 6.42
parity block level: 1.12, 1.17, 1.26, 1.30, 1.50, 1.86, 1.88, 1.91, 1.97, 1.98, 1.99, 2.02, 2.05, 2.12, 2.14, 2.17, 2.28, 2.29, 2.39, 2.44, 2.50, 2.67, 2.94, 3.09, 3.19, 3.39, 3.46, 3.62, 4.27, 4.42, 4.66, 4.66, 4.70, 4.72, 4.86, 5.36, 5.52, 5.60, 5.97, 7.22, 8.29, 9.55, 10.25, 10.40, 10.81, 12.65, 14.31, 15.06, 16.92, 17.33, 17.90, 21.73, 21.98, 22.41, 23.38, 27.36, 27.80, 31.43, 37.34, 42.22
parity level: 0.01, 0.07, 0.09, 0.13, 0.15, 0.20, 0.22, 0.23, 0.24, 0.28, 0.32, 0.33, 0.34, 0.35, 0.35, 0.36, 0.36, 0.37, 0.37, 0.38, 0.39, 0.40, 0.40, 0.42, 0.42, 0.43, 0.46, 0.47, 0.47, 0.50, 0.51, 0.51, 0.54, 0.59, 0.67, 0.76, 0.78, 0.80, 0.83, 0.85, 0.87, 0.91, 0.93, 0.95, 0.97, 1.00, 1.08, 1.20, 1.22, 1.45, 1.61, 1.70, 1.73, 1.80, 1.81, 1.85, 1.97, 2.10, 2.44, 5.99

## The speed curve over a fixed set of points (MAIL 400)

old: the mean over the points that have ground under them, frame by frame, as in the nine jobs. fixed set: every step and rebound over the points that have ground in all frames it compares (the ring of 8 picture points, 96 px). ground ring: 8 points on a circle on the ground round the ground point under the place (a proposal, `--ring ground`). Cells: worst step, fall before the largest value, climb after it, count of red numbers.

| stop | move | run | old: worst step, fall, climb, red | fixed set: worst step (points), fall, climb, red, fewest points | ground ring: worst step, fall, climb, red |
|---|---|---|---|---|---|
| sun | rise | whole | 0.159, 0.027, 0.256, 3 | 0.159 (8), 0.027, 0.256, 3, 8 | 0.162 (8), 0.059, 0.257, 4 |
| sun | rise | rate 2 | 0.161, 0.037, 0.250, 5 | 0.161 (8), 0.037, 0.250, 5, 8 | 0.164 (8), 0.068, 0.251, 5 |
| mercury | dive | whole | 0.608, 0.554, 0.000, 3 | 0.608 (8), 0.554, 0.000, 3, 8 | 0.629 (8), 0.559, 0.000, 3 |
| mercury | dive | rate 2 | 0.851, 0.569, 0.000, 5 | 0.851 (8), 0.569, 0.000, 5, 8 | 0.878 (8), 0.574, 0.000, 5 |
| mercury | rise | whole | 0.815, 0.000, 0.469, 5 | 0.815 (8), 0.000, 0.469, 5, 8 | 0.835 (8), 0.000, 0.525, 5 |
| mercury | rise | rate 2 | 0.884, 0.000, 0.468, 7 | 0.884 (8), 0.000, 0.468, 7, 8 | 0.905 (8), 0.000, 0.525, 8 |
| venus | dive | whole | 0.144, 0.000, 0.024, 1 | 0.144 (8), 0.000, 0.024, 1, 8 | 0.141 (8), 0.000, 0.012, 2 |
| venus | dive | rate 2 | 0.147, 0.000, 0.026, 1 | 0.147 (8), 0.000, 0.026, 1, 8 | 0.143 (8), 0.000, 0.016, 2 |
| venus | rise | whole | 0.205, 0.846, 0.000, 5 | 0.205 (8), 0.846, 0.000, 5, 8 | 0.206 (8), 0.846, 0.000, 5 |
| venus | rise | rate 2 | 0.228, 0.857, 0.000, 7 | 0.228 (8), 0.857, 0.000, 7, 8 | 0.228 (8), 0.857, 0.000, 7 |
| earth | dive | whole | 0.159, 0.000, 0.002, 1 | 0.159 (8), 0.000, 0.002, 1, 8 | 0.162 (8), 0.001, 0.004, 1 |
| earth | dive | rate 2 | 0.162, 0.001, 0.003, 2 | 0.162 (8), 0.001, 0.003, 2, 8 | 0.164 (8), 0.001, 0.005, 2 |
| earth | rise | whole | 0.519, 0.002, 0.000, 5 | 0.519 (8), 0.002, 0.000, 5, 8 | 0.528 (8), 0.000, 0.000, 4 |
| earth | rise | rate 2 | 0.592, 0.003, 0.006, 6 | 0.592 (8), 0.003, 0.006, 6, 8 | 0.603 (8), 0.000, 0.006, 6 |
| mars | dive | whole | 0.252, 0.000, 0.289, 4 | 0.252 (8), 0.000, 0.289, 4, 8 | 0.268 (8), 0.000, 0.282, 3 |
| mars | dive | rate 2 | 0.257, 0.000, 0.293, 5 | 0.257 (8), 0.000, 0.293, 5, 8 | 0.274 (8), 0.000, 0.277, 4 |
| mars | rise | whole | 0.532, 0.522, 0.000, 5 | 0.532 (8), 0.522, 0.000, 5, 8 | 0.551 (8), 0.645, 0.000, 5 |
| mars | rise | rate 2 | 0.543, 0.541, 0.000, 8 | 0.543 (8), 0.541, 0.000, 8, 8 | 0.561 (8), 0.664, 0.000, 8 |
| jupiter | dive | whole | 0.239, 0.492, 0.000, 5 | 0.239 (8), 0.492, 0.000, 5, 8 | 0.242 (8), 0.519, 0.000, 5 |
| jupiter | dive | rate 2 | 0.241, 0.497, 0.000, 6 | 0.241 (8), 0.497, 0.000, 6, 8 | 0.245 (8), 0.525, 0.000, 6 |
| jupiter | rise | whole | 0.325, 0.000, 0.191, 6 | 0.325 (8), 0.000, 0.191, 6, 5 | 0.334 (8), 0.000, 0.159, 6 |
| jupiter | rise | rate 2 | 0.329, 0.000, 0.198, 12 | 0.329 (8), 0.000, 0.198, 10, 5 | 0.338 (8), 0.000, 0.159, 9 |
| saturn | dive | whole | 0.160, 0.026, 0.000, 1 | 0.160 (8), 0.026, 0.000, 1, 8 | 0.160 (8), 0.039, 0.000, 2 |
| saturn | dive | rate 2 | 0.161, 0.034, 0.000, 3 | 0.161 (8), 0.034, 0.000, 3, 8 | 0.161 (8), 0.047, 0.000, 3 |
| saturn | rise | whole | 0.244, 0.237, 0.000, 3 | 0.244 (8), 0.237, 0.000, 3, 8 | 0.243 (8), 0.236, 0.000, 3 |
| saturn | rise | rate 2 | 0.246, 0.245, 0.000, 4 | 0.246 (8), 0.245, 0.000, 4, 8 | 0.245 (8), 0.242, 0.000, 4 |
| uranus | dive | whole | 0.193, 0.000, 0.262, 4 | 0.130 (8), 0.000, 0.262, 2, 6 | 0.139 (8), 0.000, 0.003, 1 |
| uranus | dive | rate 2 | 0.186, 0.000, 0.254, 6 | 0.131 (8), 0.000, 0.254, 2, 6 | 0.140 (8), 0.000, 0.004, 1 |
| uranus | rise | whole | 0.401, 0.016, 0.000, 4 | 0.401 (8), 0.016, 0.000, 2, 5 | 0.424 (8), 0.020, 0.000, 2 |
| uranus | rise | rate 2 | 0.446, 0.018, 0.000, 7 | 0.446 (8), 0.018, 0.000, 4, 5 | 0.472 (8), 0.020, 0.000, 4 |
| neptune | dive | whole | 0.140, 0.008, 0.340, 3 | 0.140 (8), 0.008, 0.340, 3, 8 | 0.141 (8), 0.008, 0.413, 3 |
| neptune | dive | rate 2 | 0.142, 0.011, 0.337, 3 | 0.142 (8), 0.011, 0.337, 3, 8 | 0.142 (8), 0.010, 0.409, 3 |
| neptune | rise | whole | 0.131, 0.045, 0.000, 3 | 0.131 (8), 0.045, 0.000, 3, 5 | 0.119 (8), 0.145, 0.000, 3 |
| neptune | rise | rate 2 | 0.136, 0.058, 0.000, 3 | 0.136 (8), 0.058, 0.000, 3, 5 | 0.122 (8), 0.162, 0.001, 4 |

red numbers of the speed curve: old 151 , fixed set 138 , ground ring 138 ; faults of rate and turn that differ: 0

## The frozen film by the tool itself (job B, sfz-01 to 09, 2026-11-24)

Commit 9109065a (the src of 8c454593, the tool and the smooth block of agent/harness), `npm run smooth -- --stop <id> --only pictures --calibrate`, draft tier, whole film frames, 213 pictures a stop (the sun 114), on nine render machines. Limits of d165: level step 1.3, pop 1.2, change in place 20 (8 film frames, smoothed over 20 px), block pop shown and not judged, Saturn's rings count as its body. The reports are in `frozen/`. The two pattern columns are not from these reports: they are the change of the pattern alone (MAIL 452 point 5, tool commit 6536383c) measured on quarter size copies of the same frozen frames; no limit is set for it yet.

| stop | job | move | level step | pop | block pop (not judged) | change in place | its ground | pattern alone | its ground | red numbers |
|---|---|---|---|---|---|---|---|---|---|---|
| sun | sfz-01 | rise | 0.62 @205 | 1.15 @266 | 2.68 @256 | 54.4 @229 RED | 12.6 | 1.04 @202 | 0.09 | 1 |
| mercury | sfz-02 | dive | 0.70 @706 | 1.16 @732 | 7.89 @701 | 111.2 @731 RED | 3.3 | 1.41 @729 | 0.01 | 1 |
| mercury | sfz-02 | rise | 1.61 @1024 RED | 1.48 @1034 RED | 13.80 @1045 | 134.2 @995 RED | 3.5 | 1.42 @993 | 0.03 | 3 |
| venus | sfz-03 | dive | 0.99 @1277 | 1.14 @1264 | 5.74 @1337 | 75.9 @1300 RED | 1.8 | 0.82 @1332 | 0.01 | 1 |
| venus | sfz-03 | rise | 0.88 @1583 | 1.13 @1602 | 7.52 @1615 | 95.2 @1568 RED | 3.9 | 1.08 @1544 | 0.02 | 1 |
| earth | sfz-04 | dive | 0.60 @1902 | 1.47 @1887 RED | 4.26 @1869 | 134.5 @1885 RED | 1.2 | 0.94 @1886 | 0.01 | 2 |
| earth | sfz-04 | rise | 1.25 @2151 | 1.83 @2123 RED | 8.25 @2122 | 151.1 @2119 RED | 2.3 | 1.03 @2103 | 0.02 | 2 |
| mars | sfz-05 | dive | 1.82 @2403 RED | 1.87 @2421 RED | 11.64 @2402 | 63.7 @2439 RED | 1.3 | 1.04 @2442 | 0.02 | 3 |
| mars | sfz-05 | rise | 1.65 @2731 RED | 1.31 @2720 RED | 6.61 @2738 | 76.7 @2697 RED | 2.5 | 1.12 @2698 | 0.02 | 3 |
| jupiter | sfz-06 | dive | 1.23 @2990 | 1.16 @2971 | 7.87 @3050 | 79.8 @3052 RED | 2.2 | 0.95 @3024 | 0.02 | 1 |
| jupiter | sfz-06 | rise | 2.30 @3287 RED | 1.27 @3294 RED | 5.68 @3249 | 77.7 @3274 RED | 2.8 | 0.72 @3239 | 0.03 | 3 |
| saturn | sfz-07 | dive | 0.08 @3557 | 1.09 @3545 | 4.09 @3547 | 10.0 @3551 | 5.2 | 0.17 @3546 | 0.10 | 0 |
| saturn | sfz-07 | rise | 0.63 @3895 | 1.54 @3815 RED | 15.55 @3895 | 25.5 @3814 RED | 11.0 | 0.27 @3853 | 0.20 | 2 |
| uranus | sfz-08 | dive | 0.77 @4138 | 1.20 @4175 RED | 5.63 @4167 | 95.1 @4171 RED | 9.1 | 1.01 @4174 | 0.13 | 2 |
| uranus | sfz-08 | rise | 0.21 @4391 | 1.52 @4400 RED | 28.29 @4465 | 89.4 @4397 RED | 14.5 | 0.98 @4397 | 0.22 | 2 |
| neptune | sfz-09 | dive | 0.26 @4744 | 1.30 @4716 RED | 7.89 @4745 | 75.6 @4743 RED | 7.0 | 1.43 @4737 | 0.32 | 2 |
| neptune | sfz-09 | rise | 0.77 @4965 | 1.79 @4963 RED | 12.02 @4964 | 69.9 @4958 RED | 4.9 | 1.48 @4957 | 0.32 | 2 |

The change in place: every ground is under 20 (largest 14.5, Uranus's rise), every frozen move but Saturn's dive is over it (smallest 25.5, Saturn's rise, then 54.4). The pattern alone: the grounds and Saturn's two moves end at 0.32, the smallest of the other moves is 0.72.
