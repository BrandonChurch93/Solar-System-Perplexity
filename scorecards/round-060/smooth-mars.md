# smooth: mars

Commit 262b9a68df0a6bda8d77518539580de554bb0dc5. Capture rate 2. Parts: path, pictures, place, parity, counts.

Joined from the files of 1 machine(s), nothing is rendered, measured or counted here. The path: /home/user/workspace/work/p6/ha9/05/mars (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The pictures: the dive /home/user/workspace/work/p6/ha9/01/mars-dive-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/ha9/02/mars-dive-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz); the rise /home/user/workspace/work/p6/ha9/03/mars-rise-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/ha9/04/mars-rise-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The place: /home/user/workspace/work/p6/ha9/05/mars (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The parity: /home/user/workspace/work/p6/ha9/05/mars (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The counts: /home/user/workspace/work/p6/ha9/06/mars (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

VERDICT: red. 4 numbers over the limit or not measured.

VERDICT BESIDE IT, the pictures read with the carry at the full size (the verdict above is the one that counts and makes the exit code): red. 5 numbers over the limit or not measured.

GROUND POP BESIDE IT, a number without a limit that makes no verdict (1.3 is named as the limit to come), read with the carry at the full size on the ground both frames show: largest 1.312 from frame 2683 + 1/2 to the next, most at pixel 1894, 302, a patch of 272 by 252 px; 1 of 424 rows read over 1.3 (pictures of the rise). It is not the line "The ground beside it" of the pictures: that line gives the change in place and the pattern on the surface view before a rise or after a dive, this number is read on the globe's ground through the move itself. Ground pop NOT READ on 2 of 426 rows, which says nothing of them, quiet or not: frame 2501 + 1/2: the last frame of the window, no next frame to carry onto it; frame 2756 + 1/2: the last frame of the window, no next frame to carry onto it.

## path

### dive (mars.dive, frames 2400 to 2489, T at 2477, window 2388 to 2501)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.08478 log of the height a film frame | 1.639 | 2454 | 0.057 | 2410 |  |  | 0.002 | 0.006 | 0.000 | 0.000 | 0.000 at 2501 |
| whole frames | turn | 1.519 degrees a film frame | 1.661 | 2437 | 0.065 | 2419 |  |  | 0.008 | 0.000 | 0.000 | 0.000 | 0.000 at 2398 |
| whole frames | speed | 6.106 px a film frame at the place | 1.716 | 2435 | 0.063 over 8 | 2415 |  |  | 0.001 | 0.001 | 0.000 | 0.000 | 0.001 at 2398 |
| rate 2 | rate | 0.08432 log of the height a film frame | 1.648 | 2454 | 0.057 | 2410 | 0.029 | 2409 + 1/2 | 0.003 | 0.005 | 0.000 | 0.000 | 0.000 at 2501 + 1/2 |
| rate 2 | turn | 1.51 degrees a film frame | 1.671 | 2436 | 0.066 | 2418 + 1/2 | 0.033 | 2418 | 0.010 | 0.000 | 0.000 | 0.000 | 0.000 at 2398 + 1/2 |
| rate 2 | speed | 6.203 px a film frame at the place | 1.735 | 2435 | 0.063 over 8 | 2415 + 1/2 | 0.032 over 8 | 2415 | 0.001 | 0.001 | 0.000 | 0.000 over 8 | 0.001 at 2398 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 2490, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.0059 of its height a film frame, the mean of its first 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 1.00 at frame 2490 + 1/2, limit 0.87; inside the dive itself 1.00 at frame 2490. Largest step from one capture frame to the next 0.75 at frame 2483, shown. The part along the surface view's own direction of motion: 1.00 at the lowest, lowest 1.00 at frame 2490 + 1/2, shown; under 0 the eye goes back.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2388 | hold orbit | 2.432e+0 | 0.005 |  |  | 0.038 |  |  | 0.167 |  |  | 0 |
| 2389 | hold orbit | 2.431e+0 | 0.005 | 0.000 | 0.000 | 0.038 | 0.000 | 0.000 | 0.168 | 0.000 | 0.000 | 8 |
| 2390 | hold orbit | 2.430e+0 | 0.005 | 0.000 | 0.000 | 0.038 | 0.000 | 0.000 | 0.168 | 0.000 | 0.000 | 8 |
| 2391 | hold orbit | 2.429e+0 | 0.005 | 0.000 | 0.000 | 0.038 | 0.000 | 0.000 | 0.169 | 0.001 | 0.001 | 8 |
| 2392 | hold orbit | 2.428e+0 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.169 | 0.001 | 0.001 | 8 |
| 2393 | hold orbit | 2.427e+0 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.170 | 0.001 | 0.001 | 8 |
| 2394 | hold orbit | 2.426e+0 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.171 | 0.001 | 0.001 | 8 |
| 2395 | hold orbit | 2.425e+0 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.171 | 0.001 | 0.001 | 8 |
| 2396 | hold orbit | 2.424e+0 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.172 | 0.001 | 0.001 | 8 |
| 2397 | hold orbit | 2.423e+0 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.173 | 0.001 | 0.001 | 8 |
| 2398 | hold orbit | 2.422e+0 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.174 | 0.001 | 0.001 | 8 |
| 2399 | hold orbit | 2.421e+0 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.175 | 0.001 | 0.001 | 8 |
| 2400 first | dive orbit | 2.421e+0 | 0.005 | 0.000 | 0.001 | 0.037 | 0.000 | 0.002 | 0.176 | 0.001 | 0.001 | 8 |
| 2401 | dive orbit | 2.419e+0 | 0.007 | 0.002 | 0.007 | 0.045 | 0.008 | 0.021 | 0.177 | 0.001 | 0.002 | 8 |
| 2402 | dive orbit | 2.416e+0 | 0.017 | 0.010 | 0.015 | 0.073 | 0.028 | 0.039 | 0.179 | 0.002 | 0.003 | 8 |
| 2403 | dive orbit | 2.409e+0 | 0.034 | 0.018 | 0.023 | 0.117 | 0.044 | 0.050 | 0.183 | 0.004 | 0.006 | 8 |
| 2404 | dive orbit | 2.397e+0 | 0.060 | 0.025 | 0.031 | 0.169 | 0.052 | 0.056 | 0.191 | 0.007 | 0.011 | 8 |
| 2405 | dive orbit | 2.378e+0 | 0.093 | 0.033 | 0.039 | 0.225 | 0.056 | 0.056 | 0.204 | 0.013 | 0.018 | 8 |
| 2406 | dive orbit | 2.351e+0 | 0.135 | 0.041 | 0.047 | 0.281 | 0.055 | 0.055 | 0.227 | 0.023 | 0.031 | 8 |
| 2407 | dive orbit | 2.314e+0 | 0.184 | 0.049 | 0.055 | 0.332 | 0.052 | 0.052 | 0.264 | 0.037 | 0.048 | 8 |
| 2408 | dive orbit | 2.268e+0 | 0.240 | 0.056 | 0.057 | 0.379 | 0.047 | 0.047 | 0.316 | 0.053 | 0.057 | 8 |
| 2409 | dive orbit | 2.211e+0 | 0.297 | 0.057 | 0.057 | 0.420 | 0.040 | 0.040 | 0.375 | 0.059 | 0.060 | 8 |
| 2410 | dive orbit | 2.146e+0 | 0.354 | 0.057 | 0.057 | 0.454 | 0.034 | 0.033 | 0.435 | 0.060 | 0.061 | 8 |
| 2411 | dive orbit | 2.072e+0 | 0.412 | 0.057 | 0.057 | 0.483 | 0.029 | 0.029 | 0.497 | 0.061 | 0.062 | 8 |
| 2412 | dive orbit | 1.991e+0 | 0.469 | 0.057 | 0.057 | 0.510 | 0.028 | 0.029 | 0.559 | 0.062 | 0.062 | 8 |
| 2413 | dive orbit | 1.905e+0 | 0.525 | 0.057 | 0.057 | 0.540 | 0.030 | 0.033 | 0.622 | 0.063 | 0.063 | 8 |
| 2414 | dive orbit | 1.813e+0 | 0.582 | 0.057 | 0.057 | 0.576 | 0.036 | 0.041 | 0.684 | 0.063 | 0.063 | 8 |
| 2415 | dive orbit | 1.717e+0 | 0.639 | 0.057 | 0.057 | 0.620 | 0.044 | 0.050 | 0.747 | 0.063 | 0.063 | 8 |
| 2416 | dive orbit | 1.619e+0 | 0.695 | 0.056 | 0.057 | 0.673 | 0.053 | 0.058 | 0.810 | 0.063 | 0.063 | 8 |
| 2417 | dive orbit | 1.519e+0 | 0.751 | 0.056 | 0.057 | 0.734 | 0.061 | 0.064 | 0.873 | 0.062 | 0.063 | 8 |
| 2418 | dive orbit | 1.419e+0 | 0.808 | 0.056 | 0.057 | 0.799 | 0.065 | 0.066 | 0.934 | 0.062 | 0.063 | 8 |
| 2419 | dive orbit | 1.318e+0 | 0.864 | 0.056 | 0.057 | 0.864 | 0.065 | 0.065 | 0.996 | 0.061 | 0.062 | 8 |
| 2420 | dive orbit | 1.220e+0 | 0.920 | 0.056 | 0.057 | 0.925 | 0.062 | 0.061 | 1.056 | 0.060 | 0.061 | 8 |
| 2421 | dive orbit | 1.123e+0 | 0.977 | 0.057 | 0.057 | 0.984 | 0.059 | 0.059 | 1.115 | 0.059 | 0.060 | 8 |
| 2422 | dive orbit | 1.028e+0 | 1.034 | 0.057 | 0.057 | 1.042 | 0.058 | 0.059 | 1.173 | 0.059 | 0.060 | 8 |
| 2423 | dive orbit | 9.376e-1 | 1.090 | 0.057 | 0.057 | 1.101 | 0.058 | 0.059 | 1.231 | 0.058 | 0.059 | 8 |
| 2424 | dive orbit | 8.507e-1 | 1.147 | 0.057 | 0.057 | 1.159 | 0.058 | 0.059 | 1.288 | 0.057 | 0.058 | 8 |
| 2425 | dive orbit | 7.682e-1 | 1.203 | 0.057 | 0.057 | 1.218 | 0.058 | 0.059 | 1.344 | 0.056 | 0.058 | 8 |
| 2426 | dive orbit | 6.904e-1 | 1.260 | 0.057 | 0.057 | 1.276 | 0.058 | 0.059 | 1.400 | 0.055 | 0.057 | 8 |
| 2427 | dive orbit | 6.175e-1 | 1.316 | 0.057 | 0.057 | 1.335 | 0.058 | 0.059 | 1.454 | 0.054 | 0.056 | 8 |
| 2428 | dive orbit | 5.496e-1 | 1.373 | 0.057 | 0.057 | 1.393 | 0.058 | 0.059 | 1.507 | 0.053 | 0.055 | 8 |
| 2429 | dive orbit | 4.869e-1 | 1.429 | 0.056 | 0.057 | 1.451 | 0.058 | 0.058 | 1.559 | 0.052 | 0.054 | 8 |
| 2430 | dive orbit | 4.294e-1 | 1.482 | 0.053 | 0.052 | 1.505 | 0.054 | 0.054 | 1.607 | 0.047 | 0.048 | 8 |
| 2431 | dive orbit | 3.772e-1 | 1.527 | 0.045 | 0.044 | 1.552 | 0.046 | 0.046 | 1.646 | 0.039 | 0.039 | 8 |
| 2432 | dive orbit | 3.304e-1 | 1.565 | 0.037 | 0.036 | 1.590 | 0.038 | 0.037 | 1.676 | 0.030 | 0.030 | 8 |
| 2433 | dive orbit | 2.886e-1 | 1.594 | 0.029 | 0.029 | 1.620 | 0.030 | 0.029 | 1.697 | 0.022 | 0.021 | 8 |
| 2434 | dive orbit | 2.517e-1 | 1.616 | 0.022 | 0.021 | 1.642 | 0.022 | 0.021 | 1.710 | 0.013 | 0.013 | 8 |
| 2435 | dive orbit | 2.192e-1 | 1.629 | 0.014 | 0.013 | 1.656 | 0.014 | 0.013 | 1.716 | 0.005 | 0.004 | 8 |
| 2436 | dive orbit | 1.908e-1 | 1.635 | 0.006 | 0.005 | 1.661 | 0.006 | 0.005 | 1.713 | 0.003 | 0.007 | 8 |
| 2437 | dive orbit | 1.661e-1 | 1.636 | 0.001 | 0.000 | 1.661 | 0.000 | 0.001 | 1.704 | 0.008 | 0.009 | 8 |
| 2438 | dive orbit | 1.446e-1 | 1.636 | 0.000 | 0.000 | 1.661 | 0.001 | 0.001 | 1.696 | 0.009 | 0.009 | 8 |
| 2439 | dive orbit | 1.259e-1 | 1.636 | 0.000 | 0.000 | 1.660 | 0.001 | 0.001 | 1.687 | 0.009 | 0.009 | 8 |
| 2440 | dive orbit | 1.096e-1 | 1.636 | 0.000 | 0.000 | 1.659 | 0.001 | 0.001 | 1.678 | 0.009 | 0.009 | 8 |
| 2441 | dive orbit | 9.539e-2 | 1.636 | 0.000 | 0.000 | 1.658 | 0.001 | 0.001 | 1.669 | 0.009 | 0.009 | 8 |
| 2442 | dive orbit | 8.303e-2 | 1.636 | 0.000 | 0.000 | 1.657 | 0.001 | 0.001 | 1.660 | 0.009 | 0.009 | 8 |
| 2443 | dive orbit | 7.228e-2 | 1.636 | 0.000 | 0.000 | 1.655 | 0.001 | 0.002 | 1.651 | 0.009 | 0.010 | 8 |
| 2444 | dive orbit | 6.292e-2 | 1.636 | 0.000 | 0.000 | 1.654 | 0.002 | 0.002 | 1.642 | 0.009 | 0.010 | 8 |
| 2445 | dive orbit | 5.477e-2 | 1.636 | 0.000 | 0.000 | 1.652 | 0.002 | 0.002 | 1.632 | 0.009 | 0.010 | 8 |
| 2446 | dive orbit | 4.767e-2 | 1.637 | 0.000 | 0.000 | 1.650 | 0.002 | 0.002 | 1.623 | 0.010 | 0.010 | 8 |
| 2447 | dive orbit | 4.149e-2 | 1.637 | 0.000 | 0.000 | 1.648 | 0.002 | 0.002 | 1.613 | 0.010 | 0.010 | 8 |
| 2448 | dive orbit | 3.612e-2 | 1.637 | 0.000 | 0.000 | 1.645 | 0.002 | 0.003 | 1.602 | 0.010 | 0.011 | 8 |
| 2449 | dive orbit | 3.144e-2 | 1.637 | 0.000 | 0.000 | 1.643 | 0.003 | 0.003 | 1.592 | 0.011 | 0.011 | 8 |
| 2450 | dive orbit | 2.736e-2 | 1.638 | 0.000 | 0.000 | 1.640 | 0.003 | 0.003 | 1.581 | 0.011 | 0.011 | 8 |
| 2451 | dive orbit | 2.381e-2 | 1.638 | 0.000 | 0.000 | 1.637 | 0.003 | 0.003 | 1.570 | 0.011 | 0.012 | 8 |
| 2452 | dive orbit | 2.073e-2 | 1.638 | 0.000 | 0.000 | 1.633 | 0.003 | 0.004 | 1.558 | 0.012 | 0.012 | 8 |
| 2453 | dive orbit | 1.804e-2 | 1.639 | 0.000 | 0.000 | 1.630 | 0.004 | 0.004 | 1.546 | 0.012 | 0.013 | 8 |
| 2454 | dive orbit | 1.570e-2 | 1.639 | 0.000 | 0.000 | 1.626 | 0.004 | 0.005 | 1.534 | 0.012 | 0.014 | 8 |
| 2455 | dive orbit | 1.366e-2 | 1.637 | 0.002 | 0.006 | 1.619 | 0.007 | 0.011 | 1.519 | 0.015 | 0.020 | 8 |
| 2456 | dive orbit | 1.190e-2 | 1.628 | 0.009 | 0.014 | 1.605 | 0.014 | 0.019 | 1.497 | 0.022 | 0.027 | 8 |
| 2457 | dive orbit | 1.038e-2 | 1.611 | 0.017 | 0.022 | 1.583 | 0.022 | 0.027 | 1.468 | 0.029 | 0.034 | 8 |
| 2458 | dive orbit | 9.075e-3 | 1.586 | 0.025 | 0.030 | 1.553 | 0.030 | 0.035 | 1.432 | 0.036 | 0.041 | 8 |
| 2459 | dive orbit | 7.956e-3 | 1.553 | 0.033 | 0.038 | 1.515 | 0.038 | 0.043 | 1.390 | 0.042 | 0.048 | 8 |
| 2460 | dive orbit | 6.998e-3 | 1.512 | 0.041 | 0.046 | 1.470 | 0.045 | 0.050 | 1.341 | 0.049 | 0.054 | 8 |
| 2461 | dive orbit | 6.181e-3 | 1.464 | 0.049 | 0.054 | 1.417 | 0.053 | 0.058 | 1.286 | 0.055 | 0.059 | 8 |
| 2462 | dive orbit | 5.485e-3 | 1.409 | 0.055 | 0.056 | 1.358 | 0.059 | 0.060 | 1.227 | 0.059 | 0.061 | 8 |
| 2463 | dive orbit | 4.891e-3 | 1.353 | 0.056 | 0.056 | 1.299 | 0.060 | 0.060 | 1.168 | 0.059 | 0.060 | 8 |
| 2464 | dive orbit | 4.381e-3 | 1.297 | 0.056 | 0.056 | 1.239 | 0.059 | 0.060 | 1.110 | 0.058 | 0.059 | 8 |
| 2465 | dive orbit | 3.944e-3 | 1.241 | 0.056 | 0.056 | 1.181 | 0.059 | 0.059 | 1.053 | 0.057 | 0.058 | 8 |
| 2466 | dive orbit | 3.567e-3 | 1.185 | 0.056 | 0.056 | 1.122 | 0.059 | 0.059 | 0.997 | 0.056 | 0.057 | 8 |
| 2467 | dive orbit | 3.241e-3 | 1.129 | 0.056 | 0.056 | 1.064 | 0.058 | 0.058 | 0.942 | 0.055 | 0.056 | 8 |
| 2468 | dive orbit | 2.959e-3 | 1.073 | 0.056 | 0.056 | 1.006 | 0.058 | 0.058 | 0.888 | 0.054 | 0.054 | 8 |
| 2469 | dive orbit | 2.715e-3 | 1.017 | 0.056 | 0.056 | 0.949 | 0.057 | 0.057 | 0.836 | 0.053 | 0.053 | 8 |
| 2470 | dive orbit | 2.502e-3 | 0.961 | 0.056 | 0.056 | 0.892 | 0.057 | 0.057 | 0.784 | 0.052 | 0.052 | 8 |
| 2471 | dive orbit | 2.318e-3 | 0.905 | 0.056 | 0.056 | 0.836 | 0.056 | 0.057 | 0.733 | 0.051 | 0.051 | 8 |
| 2472 | dive orbit | 2.156e-3 | 0.849 | 0.056 | 0.056 | 0.780 | 0.056 | 0.056 | 0.684 | 0.050 | 0.050 | 8 |
| 2473 | dive orbit | 2.016e-3 | 0.793 | 0.056 | 0.056 | 0.725 | 0.055 | 0.056 | 0.635 | 0.049 | 0.049 | 8 |
| 2474 | dive orbit | 1.894e-3 | 0.737 | 0.056 | 0.057 | 0.670 | 0.055 | 0.055 | 0.587 | 0.048 | 0.048 | 8 |
| 2475 | dive orbit | 1.788e-3 | 0.680 | 0.056 | 0.057 | 0.616 | 0.054 | 0.055 | 0.541 | 0.047 | 0.047 | 8 |
| 2476 | dive orbit | 1.696e-3 | 0.624 | 0.056 | 0.057 | 0.562 | 0.054 | 0.054 | 0.495 | 0.046 | 0.046 | 8 |
| 2477 T | dive terrain | 1.616e-3 | 0.568 | 0.056 | 0.057 | 0.508 | 0.054 | 0.054 | 0.450 | 0.045 | 0.045 | 8 |
| 2478 | dive terrain | 1.548e-3 | 0.512 | 0.056 | 0.057 | 0.455 | 0.053 | 0.054 | 0.405 | 0.044 | 0.044 | 8 |
| 2479 | dive terrain | 1.489e-3 | 0.455 | 0.056 | 0.057 | 0.402 | 0.053 | 0.053 | 0.362 | 0.043 | 0.043 | 8 |
| 2480 | dive terrain | 1.440e-3 | 0.399 | 0.056 | 0.057 | 0.349 | 0.053 | 0.053 | 0.320 | 0.042 | 0.042 | 8 |
| 2481 | dive terrain | 1.398e-3 | 0.342 | 0.056 | 0.057 | 0.297 | 0.053 | 0.053 | 0.278 | 0.042 | 0.041 | 8 |
| 2482 | dive terrain | 1.365e-3 | 0.286 | 0.057 | 0.057 | 0.244 | 0.052 | 0.053 | 0.237 | 0.041 | 0.041 | 8 |
| 2483 | dive terrain | 1.339e-3 | 0.229 | 0.056 | 0.057 | 0.192 | 0.052 | 0.052 | 0.197 | 0.040 | 0.040 | 8 |
| 2484 | dive terrain | 1.319e-3 | 0.176 | 0.053 | 0.052 | 0.144 | 0.048 | 0.048 | 0.160 | 0.037 | 0.036 | 8 |
| 2485 | dive terrain | 1.304e-3 | 0.131 | 0.045 | 0.045 | 0.103 | 0.041 | 0.040 | 0.129 | 0.030 | 0.029 | 8 |
| 2486 | dive terrain | 1.294e-3 | 0.094 | 0.037 | 0.037 | 0.070 | 0.033 | 0.032 | 0.114 | 0.015 | 0.013 | 8 |
| 2487 | dive terrain | 1.287e-3 | 0.064 | 0.030 | 0.029 | 0.045 | 0.024 | 0.023 | 0.112 | 0.002 | 0.002 | 8 |
| 2488 | dive terrain | 1.282e-3 | 0.042 | 0.022 | 0.021 | 0.031 | 0.015 | 0.013 | 0.111 | 0.001 | 0.001 | 8 |
| 2489 last | dive terrain | 1.279e-3 | 0.029 | 0.014 | 0.013 | 0.026 | 0.005 | 0.004 | 0.110 | 0.001 | 0.000 | 8 |
| 2490 | terrain terrain | 1.277e-3 | 0.023 | 0.006 | 0.005 | 0.025 | 0.000 | 0.000 | 0.110 | 0.000 | 0.001 | 8 |
| 2491 | terrain terrain | 1.274e-3 | 0.022 | 0.000 | 0.000 | 0.025 | 0.000 | 0.000 | 0.111 | 0.001 | 0.001 | 8 |
| 2492 | terrain terrain | 1.272e-3 | 0.022 | 0.000 | 0.000 | 0.025 | 0.000 | 0.000 | 0.112 | 0.001 | 0.001 | 8 |
| 2493 | terrain terrain | 1.270e-3 | 0.022 | 0.000 | 0.000 | 0.025 | 0.000 | 0.000 | 0.113 | 0.001 | 0.001 | 8 |
| 2494 | terrain terrain | 1.267e-3 | 0.023 | 0.000 | 0.000 | 0.025 | 0.000 | 0.000 | 0.114 | 0.001 | 0.001 | 8 |
| 2495 | terrain terrain | 1.265e-3 | 0.023 | 0.000 | 0.000 | 0.025 | 0.000 | 0.000 | 0.115 | 0.001 | 0.001 | 8 |
| 2496 | terrain terrain | 1.262e-3 | 0.023 | 0.000 | 0.000 | 0.025 | 0.000 | 0.000 | 0.116 | 0.001 | 0.001 | 8 |
| 2497 | terrain terrain | 1.260e-3 | 0.023 | 0.000 | 0.000 | 0.025 | 0.000 | 0.000 | 0.116 | 0.001 | 0.001 | 8 |
| 2498 | terrain terrain | 1.257e-3 | 0.023 | 0.000 | 0.000 | 0.025 | 0.000 | 0.000 | 0.117 | 0.001 | 0.001 | 8 |
| 2499 | terrain terrain | 1.255e-3 | 0.023 | 0.000 | 0.000 | 0.025 | 0.000 | 0.000 | 0.118 | 0.001 | 0.001 | 8 |
| 2500 | terrain terrain | 1.252e-3 | 0.023 | 0.000 | 0.000 | 0.025 | 0.000 | 0.000 | 0.119 | 0.001 | 0.001 | 8 |
| 2501 | terrain terrain | 1.250e-3 | 0.023 | 0.000 | 0.000 | 0.025 | 0.000 | 0.000 | 0.120 | 0.001 | 0.001 | 8 |

### rise (mars.rise, frames 2670 to 2744, T at 2681, window 2658 to 2756)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.1127 log of the height a film frame | 1.904 | 2704 | 0.062 | 2674 |  |  | 0.012 | 0.019 | 0.000 | 0.000 | 0.014 at 2756 |
| whole frames | turn | 0.5035 degrees a film frame | 1.752 | 2712 | 0.063 | 2681 |  |  | 0.007 | 0.022 | 0.012 | 0.000 | 0.000 at 2659 |
| whole frames | speed | 10.3 px a film frame at the place | 1.700 | 2704 | 0.055 over 8 | 2702 |  |  | 0.001 | 0.009 | 0.000 | 0.012 over 8 | 1.384 at 2756 |
| rate 2 | rate | 0.1119 log of the height a film frame | 1.917 | 2704 | 0.063 | 2673 | 0.031 | 2672 + 1/2 | 0.015 | 0.016 | 0.000 | 0.000 | 0.017 at 2756 + 1/2 |
| rate 2 | turn | 0.5002 degrees a film frame | 1.767 | 2711 + 1/2 | 0.063 | 2681 | 0.031 | 2680 + 1/2 | 0.009 | 0.016 | 0.016 | 0.000 | 0.000 at 2659 |
| rate 2 | speed | 10.05 px a film frame at the place | 1.677 | 2704 | 0.053 over 8 | 2702 | 0.027 over 8 | 2702 | 0.001 | 0.008 | 0.000 | 0.015 over 8 | 1.497 at 2756 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 2670, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.0136 of its height a film frame, the mean of its last 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 0.99 at frame 2654, limit 0.87; inside the rise itself 1.03 at frame 2670 + 1/2. Largest step from one capture frame to the next 0.60 at frame 2674 + 1/2, shown. The part along the surface view's own direction of motion: 0.97 at the lowest, lowest 0.97 at frame 2654, shown; under 0 the eye goes back.

Rest between the rise and the travel (the seam into mars.travel at film frame 2745, 12 film frames to each side, read at rate 2): a rise and the travel after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body's edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest 5.63 at frame 2746 + 1/2, against 43.92 at frame 2733 and 66.53 at frame 2756 + 1/2 at the ends of the window. The lowest is 0.128 of the slower end, limit 0.07. Near 0 the picture comes to rest between the rise and the travel.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2658 | terrain terrain | 8.442e-4 | 0.012 |  |  | 0.076 |  |  | 0.446 |  |  | 0 |
| 2659 | terrain terrain | 8.455e-4 | 0.013 | 0.001 | 0.001 | 0.075 | 0.000 | 0.000 | 0.443 | 0.003 | 0.003 | 8 |
| 2660 | terrain terrain | 8.469e-4 | 0.014 | 0.001 | 0.001 | 0.075 | 0.000 | 0.000 | 0.440 | 0.003 | 0.003 | 8 |
| 2661 | terrain terrain | 8.483e-4 | 0.015 | 0.001 | 0.001 | 0.075 | 0.000 | 0.000 | 0.437 | 0.003 | 0.003 | 8 |
| 2662 | terrain terrain | 8.497e-4 | 0.015 | 0.001 | 0.001 | 0.075 | 0.000 | 0.000 | 0.434 | 0.003 | 0.003 | 8 |
| 2663 | terrain terrain | 8.513e-4 | 0.016 | 0.000 | 0.000 | 0.075 | 0.000 | 0.000 | 0.432 | 0.003 | 0.003 | 8 |
| 2664 | terrain terrain | 8.528e-4 | 0.016 | 0.000 | 0.000 | 0.074 | 0.000 | 0.000 | 0.429 | 0.002 | 0.002 | 8 |
| 2665 | terrain terrain | 8.544e-4 | 0.016 | 0.000 | 0.000 | 0.074 | 0.000 | 0.000 | 0.427 | 0.002 | 0.002 | 8 |
| 2666 | terrain terrain | 8.560e-4 | 0.017 | 0.000 | 0.000 | 0.074 | 0.000 | 0.000 | 0.426 | 0.002 | 0.002 | 8 |
| 2667 | terrain terrain | 8.576e-4 | 0.017 | 0.000 | 0.000 | 0.074 | 0.000 | 0.000 | 0.424 | 0.001 | 0.001 | 8 |
| 2668 | terrain terrain | 8.592e-4 | 0.017 | 0.000 | 0.000 | 0.074 | 0.000 | 0.000 | 0.423 | 0.001 | 0.001 | 8 |
| 2669 | terrain terrain | 8.608e-4 | 0.017 | 0.000 | 0.000 | 0.074 | 0.000 | 0.000 | 0.422 | 0.001 | 0.001 | 8 |
| 2670 first | rise terrain | 8.624e-4 | 0.017 | 0.000 | 0.003 | 0.074 | 0.000 | 0.002 | 0.421 | 0.001 | 0.001 | 8 |
| 2671 | rise terrain | 8.653e-4 | 0.029 | 0.012 | 0.033 | 0.066 | 0.007 | 0.015 | 0.422 | 0.001 | 0.005 | 8 |
| 2672 | rise terrain | 8.725e-4 | 0.074 | 0.045 | 0.061 | 0.055 | 0.012 | 0.012 | 0.429 | 0.007 | 0.011 | 8 |
| 2673 | rise terrain | 8.859e-4 | 0.136 | 0.062 | 0.063 | 0.084 | 0.029 | 0.046 | 0.440 | 0.011 | 0.012 | 8 |
| 2674 | rise terrain | 9.059e-4 | 0.198 | 0.062 | 0.063 | 0.134 | 0.050 | 0.055 | 0.453 | 0.013 | 0.014 | 8 |
| 2675 | rise terrain | 9.328e-4 | 0.260 | 0.062 | 0.062 | 0.190 | 0.056 | 0.058 | 0.467 | 0.014 | 0.015 | 8 |
| 2676 | rise terrain | 9.672e-4 | 0.322 | 0.062 | 0.062 | 0.249 | 0.059 | 0.060 | 0.483 | 0.016 | 0.017 | 8 |
| 2677 | rise terrain | 1.010e-3 | 0.384 | 0.062 | 0.062 | 0.310 | 0.060 | 0.061 | 0.501 | 0.018 | 0.019 | 8 |
| 2678 | rise terrain | 1.062e-3 | 0.445 | 0.062 | 0.062 | 0.371 | 0.061 | 0.062 | 0.521 | 0.020 | 0.022 | 8 |
| 2679 | rise terrain | 1.124e-3 | 0.507 | 0.061 | 0.062 | 0.433 | 0.062 | 0.063 | 0.545 | 0.024 | 0.027 | 8 |
| 2680 | rise terrain | 1.198e-3 | 0.568 | 0.061 | 0.062 | 0.496 | 0.062 | 0.063 | 0.574 | 0.029 | 0.032 | 8 |
| 2681 T | rise terrain | 1.287e-3 | 0.629 | 0.061 | 0.061 | 0.558 | 0.063 | 0.063 | 0.608 | 0.034 | 0.035 | 8 |
| 2682 | rise orbit | 1.390e-3 | 0.690 | 0.061 | 0.061 | 0.621 | 0.062 | 0.063 | 0.645 | 0.037 | 0.038 | 8 |
| 2683 | rise orbit | 1.513e-3 | 0.750 | 0.061 | 0.061 | 0.683 | 0.062 | 0.062 | 0.684 | 0.040 | 0.040 | 8 |
| 2684 | rise orbit | 1.658e-3 | 0.811 | 0.060 | 0.061 | 0.744 | 0.061 | 0.062 | 0.726 | 0.042 | 0.042 | 8 |
| 2685 | rise orbit | 1.829e-3 | 0.871 | 0.060 | 0.060 | 0.805 | 0.061 | 0.061 | 0.770 | 0.043 | 0.044 | 8 |
| 2686 | rise orbit | 2.031e-3 | 0.931 | 0.060 | 0.060 | 0.865 | 0.060 | 0.060 | 0.815 | 0.045 | 0.045 | 8 |
| 2687 | rise orbit | 2.270e-3 | 0.990 | 0.060 | 0.060 | 0.923 | 0.059 | 0.059 | 0.861 | 0.046 | 0.046 | 8 |
| 2688 | rise orbit | 2.555e-3 | 1.049 | 0.059 | 0.060 | 0.981 | 0.058 | 0.058 | 0.908 | 0.047 | 0.047 | 8 |
| 2689 | rise orbit | 2.895e-3 | 1.108 | 0.059 | 0.059 | 1.038 | 0.057 | 0.057 | 0.956 | 0.048 | 0.048 | 8 |
| 2690 | rise orbit | 3.302e-3 | 1.167 | 0.059 | 0.059 | 1.094 | 0.056 | 0.056 | 1.006 | 0.049 | 0.048 | 8 |
| 2691 | rise orbit | 3.791e-3 | 1.225 | 0.058 | 0.059 | 1.149 | 0.055 | 0.055 | 1.055 | 0.050 | 0.049 | 8 |
| 2692 | rise orbit | 4.380e-3 | 1.284 | 0.058 | 0.058 | 1.204 | 0.054 | 0.055 | 1.106 | 0.051 | 0.050 | 8 |
| 2693 | rise orbit | 5.095e-3 | 1.341 | 0.058 | 0.058 | 1.257 | 0.054 | 0.054 | 1.157 | 0.051 | 0.050 | 8 |
| 2694 | rise orbit | 5.965e-3 | 1.399 | 0.058 | 0.058 | 1.311 | 0.054 | 0.054 | 1.209 | 0.052 | 0.051 | 8 |
| 2695 | rise orbit | 7.029e-3 | 1.456 | 0.057 | 0.058 | 1.365 | 0.054 | 0.054 | 1.262 | 0.053 | 0.051 | 8 |
| 2696 | rise orbit | 8.335e-3 | 1.513 | 0.057 | 0.057 | 1.418 | 0.054 | 0.054 | 1.315 | 0.053 | 0.051 | 8 |
| 2697 | rise orbit | 9.948e-3 | 1.570 | 0.057 | 0.057 | 1.472 | 0.054 | 0.055 | 1.368 | 0.053 | 0.052 | 8 |
| 2698 | rise orbit | 1.195e-2 | 1.627 | 0.057 | 0.057 | 1.527 | 0.055 | 0.055 | 1.422 | 0.054 | 0.052 | 8 |
| 2699 | rise orbit | 1.444e-2 | 1.683 | 0.056 | 0.057 | 1.582 | 0.055 | 0.056 | 1.476 | 0.054 | 0.052 | 8 |
| 2700 | rise orbit | 1.757e-2 | 1.739 | 0.056 | 0.056 | 1.638 | 0.056 | 0.057 | 1.530 | 0.054 | 0.052 | 8 |
| 2701 | rise orbit | 2.151e-2 | 1.795 | 0.055 | 0.056 | 1.690 | 0.052 | 0.051 | 1.585 | 0.054 | 0.053 | 8 |
| 2702 | rise orbit | 2.649e-2 | 1.848 | 0.053 | 0.053 | 1.713 | 0.023 | 0.019 | 1.640 | 0.055 | 0.053 | 8 |
| 2703 | rise orbit | 3.277e-2 | 1.891 | 0.043 | 0.041 | 1.716 | 0.003 | 0.002 | 1.686 | 0.046 | 0.042 | 8 |
| 2704 | rise orbit | 4.061e-2 | 1.904 | 0.013 | 0.009 | 1.718 | 0.002 | 0.003 | 1.700 | 0.014 | 0.010 | 8 |
| 2705 | rise orbit | 5.031e-2 | 1.901 | 0.003 | 0.003 | 1.722 | 0.003 | 0.004 | 1.697 | 0.004 | 0.003 | 8 |
| 2706 | rise orbit | 6.230e-2 | 1.897 | 0.004 | 0.010 | 1.726 | 0.004 | 0.004 | 1.691 | 0.005 | 0.010 | 8 |
| 2707 | rise orbit | 7.698e-2 | 1.878 | 0.018 | 0.033 | 1.730 | 0.005 | 0.005 | 1.671 | 0.020 | 0.032 | 8 |
| 2708 | rise orbit | 9.468e-2 | 1.837 | 0.041 | 0.050 | 1.735 | 0.005 | 0.005 | 1.629 | 0.042 | 0.047 | 8 |
| 2709 | rise orbit | 1.158e-1 | 1.787 | 0.050 | 0.051 | 1.741 | 0.005 | 0.006 | 1.579 | 0.050 | 0.047 | 8 |
| 2710 | rise orbit | 1.408e-1 | 1.737 | 0.050 | 0.051 | 1.746 | 0.006 | 0.006 | 1.531 | 0.048 | 0.045 | 8 |
| 2711 | rise orbit | 1.703e-1 | 1.687 | 0.050 | 0.050 | 1.752 | 0.006 | 0.006 | 1.486 | 0.045 | 0.042 | 8 |
| 2712 | rise orbit | 2.048e-1 | 1.636 | 0.050 | 0.051 | 1.752 | 0.000 | 0.015 | 1.443 | 0.043 | 0.040 | 8 |
| 2713 | rise orbit | 2.448e-1 | 1.585 | 0.052 | 0.053 | 1.726 | 0.027 | 0.045 | 1.401 | 0.042 | 0.040 | 8 |
| 2714 | rise orbit | 2.909e-1 | 1.532 | 0.053 | 0.053 | 1.677 | 0.048 | 0.051 | 1.360 | 0.041 | 0.039 | 8 |
| 2715 | rise orbit | 3.437e-1 | 1.480 | 0.052 | 0.053 | 1.627 | 0.051 | 0.051 | 1.320 | 0.040 | 0.038 | 8 |
| 2716 | rise orbit | 4.036e-1 | 1.427 | 0.052 | 0.052 | 1.576 | 0.051 | 0.052 | 1.281 | 0.039 | 0.037 | 8 |
| 2717 | rise orbit | 4.713e-1 | 1.375 | 0.052 | 0.052 | 1.524 | 0.051 | 0.052 | 1.243 | 0.038 | 0.037 | 8 |
| 2718 | rise orbit | 5.471e-1 | 1.324 | 0.052 | 0.052 | 1.472 | 0.052 | 0.052 | 1.205 | 0.038 | 0.036 | 8 |
| 2719 | rise orbit | 6.314e-1 | 1.272 | 0.051 | 0.052 | 1.420 | 0.052 | 0.053 | 1.168 | 0.037 | 0.036 | 8 |
| 2720 | rise orbit | 7.245e-1 | 1.221 | 0.051 | 0.052 | 1.368 | 0.053 | 0.053 | 1.131 | 0.037 | 0.036 | 8 |
| 2721 | rise orbit | 8.265e-1 | 1.170 | 0.051 | 0.051 | 1.314 | 0.053 | 0.054 | 1.093 | 0.037 | 0.037 | 8 |
| 2722 | rise orbit | 9.376e-1 | 1.119 | 0.051 | 0.051 | 1.261 | 0.053 | 0.054 | 1.056 | 0.038 | 0.037 | 8 |
| 2723 | rise orbit | 1.058e+0 | 1.068 | 0.051 | 0.051 | 1.207 | 0.054 | 0.054 | 1.017 | 0.038 | 0.038 | 8 |
| 2724 | rise orbit | 1.186e+0 | 1.017 | 0.051 | 0.051 | 1.153 | 0.054 | 0.055 | 0.978 | 0.039 | 0.039 | 8 |
| 2725 | rise orbit | 1.322e+0 | 0.967 | 0.051 | 0.051 | 1.099 | 0.054 | 0.055 | 0.938 | 0.040 | 0.040 | 8 |
| 2726 | rise orbit | 1.466e+0 | 0.917 | 0.050 | 0.051 | 1.044 | 0.055 | 0.055 | 0.897 | 0.041 | 0.041 | 8 |
| 2727 | rise orbit | 1.617e+0 | 0.866 | 0.050 | 0.051 | 0.989 | 0.055 | 0.056 | 0.855 | 0.042 | 0.042 | 8 |
| 2728 | rise orbit | 1.772e+0 | 0.816 | 0.050 | 0.051 | 0.933 | 0.055 | 0.056 | 0.813 | 0.043 | 0.042 | 8 |
| 2729 | rise orbit | 1.932e+0 | 0.766 | 0.050 | 0.050 | 0.878 | 0.056 | 0.056 | 0.773 | 0.040 | 0.039 | 8 |
| 2730 | rise orbit | 2.094e+0 | 0.716 | 0.050 | 0.050 | 0.822 | 0.056 | 0.056 | 0.739 | 0.034 | 0.031 | 8 |
| 2731 | rise orbit | 2.257e+0 | 0.666 | 0.050 | 0.050 | 0.766 | 0.056 | 0.057 | 0.717 | 0.021 | 0.020 | 8 |
| 2732 | rise orbit | 2.419e+0 | 0.616 | 0.050 | 0.050 | 0.710 | 0.056 | 0.057 | 0.705 | 0.013 | 0.011 | 8 |
| 2733 | rise orbit | 2.579e+0 | 0.566 | 0.050 | 0.050 | 0.653 | 0.056 | 0.057 | 0.699 | 0.006 | 0.004 | 8 |
| 2734 | rise orbit | 2.733e+0 | 0.516 | 0.050 | 0.050 | 0.597 | 0.057 | 0.057 | 0.699 | 0.000 | 0.003 | 8 |
| 2735 | rise orbit | 2.881e+0 | 0.467 | 0.050 | 0.050 | 0.540 | 0.057 | 0.057 | 0.702 | 0.003 | 0.005 | 8 |
| 2736 | rise orbit | 3.019e+0 | 0.417 | 0.050 | 0.050 | 0.483 | 0.057 | 0.057 | 0.707 | 0.004 | 0.005 | 8 |
| 2737 | rise orbit | 3.147e+0 | 0.368 | 0.050 | 0.050 | 0.426 | 0.057 | 0.058 | 0.710 | 0.003 | 0.004 | 8 |
| 2738 | rise orbit | 3.262e+0 | 0.318 | 0.050 | 0.050 | 0.368 | 0.057 | 0.058 | 0.711 | 0.001 | 0.002 | 8 |
| 2739 | rise orbit | 3.362e+0 | 0.269 | 0.049 | 0.050 | 0.311 | 0.057 | 0.058 | 0.707 | 0.004 | 0.007 | 8 |
| 2740 | rise orbit | 3.446e+0 | 0.219 | 0.049 | 0.050 | 0.253 | 0.058 | 0.058 | 0.698 | 0.009 | 0.012 | 8 |
| 2741 | rise orbit | 3.512e+0 | 0.170 | 0.049 | 0.050 | 0.196 | 0.058 | 0.058 | 0.685 | 0.014 | 0.017 | 8 |
| 2742 | rise orbit | 3.560e+0 | 0.120 | 0.049 | 0.050 | 0.138 | 0.058 | 0.058 | 0.667 | 0.018 | 0.021 | 8 |
| 2743 | rise orbit | 3.589e+0 | 0.071 | 0.049 | 0.050 | 0.080 | 0.058 | 0.058 | 0.645 | 0.021 | 0.022 | 8 |
| 2744 last | rise orbit | 3.600e+0 | 0.029 | 0.042 | 0.041 | 0.027 | 0.053 | 0.052 | 0.626 | 0.019 | 0.019 | 8 |
| 2745 | travel orbit | 3.604e+0 | 0.010 | 0.019 | 0.016 | 0.005 | 0.022 | 0.016 | 0.617 | 0.009 | 0.008 | 8 |
| 2746 | travel orbit | 3.607e+0 | 0.008 | 0.002 | 0.000 | 0.005 | 0.000 | 0.000 | 0.615 | 0.002 | 0.002 | 8 |
| 2747 | travel orbit | 3.611e+0 | 0.008 | 0.000 | 0.000 | 0.005 | 0.000 | 0.000 | 0.616 | 0.001 | 0.017 | 8 |
| 2748 | travel orbit | 3.614e+0 | 0.008 | 0.000 | 0.000 | 0.005 | 0.000 | 0.000 | 0.654 | 0.037 | 0.088 * | 8 |
| 2749 | travel orbit | 3.617e+0 | 0.009 | 0.000 | 0.001 | 0.005 | 0.000 | 0.000 | 0.782 | 0.129 * | 0.220 * | 8 |
| 2750 | travel orbit | 3.621e+0 | 0.009 | 0.001 | 0.001 | 0.005 | 0.000 | 0.000 | 1.061 | 0.278 * | 0.405 * | 8 |
| 2751 | travel orbit | 3.626e+0 | 0.011 | 0.002 | 0.002 | 0.005 | 0.000 | 0.000 | 1.534 | 0.473 * | 0.623 * | 8 |
| 2752 | travel orbit | 3.631e+0 | 0.014 | 0.003 | 0.004 | 0.004 | 0.000 | 0.000 | 2.226 | 0.692 * | 0.850 * | 8 |
| 2753 | travel orbit | 3.639e+0 | 0.018 | 0.004 | 0.006 | 0.004 | 0.000 | 0.000 | 3.134 | 0.908 * | 1.057 * | 8 |
| 2754 | travel orbit | 3.649e+0 | 0.025 | 0.007 | 0.009 | 0.004 | 0.000 | 0.000 | 4.230 | 1.096 * | 1.222 * | 8 |
| 2755 | travel orbit | 3.664e+0 | 0.035 | 0.010 | 0.013 | 0.004 | 0.000 | 0.000 | 5.467 | 1.237 * | 1.331 * | 8 |
| 2756 | travel orbit | 3.684e+0 | 0.049 | 0.014 | 0.017 | 0.004 | 0.000 | 0.000 | 6.851 | 1.384 * | 1.497 * | 8 |

## pictures

Tier draft, rate 2, 11.6 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

The dive is joined from 2 parts: /home/user/workspace/work/p6/ha9/01/mars-dive-p1of2 (capture frames 4776 to 4889, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/ha9/02/mars-dive-p2of2 (capture frames 4890 to 5003, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

The rise is joined from 2 parts: /home/user/workspace/work/p6/ha9/03/mars-rise-p1of2 (capture frames 5316 to 5414, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/ha9/04/mars-rise-p2of2 (capture frames 5415 to 5513, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

### dive (mars.dive, frames 2400 to 2489, window 2388 to 2501, 228 draft frames at rate 2)

Largest level step: 1.33 at frame 2412 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.17 from frame 2408 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 17.92 from frame 2407 + 1/2 to the next, block column 12 row 6 from the top left, shown, not judged.
Largest change in place: 94.7 from frame 2468 to 8 film frames later, most at pixel 1672, 276 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 1.24 from frame 2464 + 1/2 to 8 film frames later, most at pixel 1380, 136, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 2490 to 2501 + 1/2): change 1.8, pattern 0.04.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 2407 in /home/user/workspace/work/p6/ha9/01/mars-dive-p1of2-pops.png, frame 2407 + 1/2 in /home/user/workspace/work/p6/ha9/01/mars-dive-p1of2-pops.png, frame 2408 in /home/user/workspace/work/p6/ha9/01/mars-dive-p1of2-pops.png, frame 2471 in /home/user/workspace/work/p6/ha9/02/mars-dive-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 2401 + 1/2 in /home/user/workspace/work/p6/ha9/01/mars-dive-p1of2-changes.png, frame 2456 + 1/2 in /home/user/workspace/work/p6/ha9/02/mars-dive-p2of2-changes.png, frame 2464 + 1/2 in /home/user/workspace/work/p6/ha9/02/mars-dive-p2of2-changes.png, frame 2472 + 1/2 in no panel (a slice --frames 4945-4945 draws it).

- RED the level of frame 2412 + 1/2 lies 1.33 off the line through its two neighbours, limit 1.3
- RED the pattern of the picture changes in place by 1.24 from frame 2464 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (41 frames over it, first 2400)

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2388 | 54.68 |  | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 11,3 | 2.6 | 6.5 | 0.48 | 0.03 | 0.45 | 8.0 |
| 2388 + 1/2 | 54.71 | 0.00 | 0.7 | 0.88 | 0.87 | 1.01 | 1.01 | 1.01 | 0.000 | 1.14 | 12,2 | 2.6 | 7.2 | 0.48 | 0.03 | 0.45 | 8.0 |
| 2389 | 54.75 | 0.00 | 0.7 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 15,7 | 2.7 | 7.2 | 0.48 | 0.03 | 0.45 | 8.0 |
| 2389 + 1/2 | 54.78 | 0.00 | 0.7 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 12,1 | 2.6 | 7.5 | 0.48 | 0.03 | 0.45 | 8.0 |
| 2390 | 54.82 | 0.00 | 0.7 | 0.88 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 7,6 | 2.7 | 7.6 | 0.48 | 0.03 | 0.45 | 8.0 |
| 2390 + 1/2 | 54.85 | 0.00 | 0.7 | 0.88 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 15,1 | 2.7 | 7.8 | 0.48 | 0.03 | 0.45 | 8.0 |
| 2391 | 54.89 | 0.00 | 0.7 | 0.87 | 0.88 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 15,8 | 2.7 | 7.8 | 0.48 | 0.03 | 0.45 | 8.0 |
| 2391 + 1/2 | 54.93 | 0.00 | 0.7 | 0.88 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 11,1 | 2.7 | 7.8 | 0.48 | 0.03 | 0.45 | 8.0 |
| 2392 | 54.96 | 0.00 | 0.7 | 0.89 | 0.88 | 1.01 | 1.01 | 1.01 | 0.000 | 1.19 | 15,1 | 2.7 | 7.8 | 0.48 | 0.03 | 0.45 | 8.0 |
| 2392 + 1/2 | 55.00 | 0.00 | 0.7 | 0.88 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 15,8 | 2.8 | 7.9 | 0.48 | 0.03 | 0.45 | 8.0 |
| 2393 | 55.03 | 0.00 | 0.7 | 0.88 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 11,1 | 2.9 | 8.4 | 0.48 | 0.03 | 0.45 | 8.0 |
| 2393 + 1/2 | 55.07 | 0.00 | 0.7 | 0.88 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 11,1 | 3.0 | 8.6 | 0.48 | 0.03 | 0.45 | 8.0 |
| 2394 | 55.10 | 0.00 | 0.7 | 0.89 | 0.88 | 1.01 | 1.01 | 1.01 | 0.000 | 1.14 | 5,3 | 3.0 | 9.0 | 0.48 | 0.04 | 0.45 | 8.0 |
| 2394 + 1/2 | 55.14 | 0.00 | 0.7 | 0.88 | 0.89 | 1.00 | 1.00 | 1.00 | 0.000 | 1.23 | 15,8 | 3.1 | 9.6 | 0.48 | 0.05 | 0.45 | 8.0 |
| 2395 | 55.18 | 0.00 | 0.7 | 0.88 | 0.89 | 0.99 | 0.99 | 0.99 | 0.000 | 1.16 | 13,8 | 3.3 | 10.6 | 0.48 | 0.09 | 0.45 | 8.0 |
| 2395 + 1/2 | 55.21 | 0.00 | 0.7 | 0.89 | 0.89 | 1.01 | 1.01 | 1.01 | 0.000 | 1.13 | 15,1 | 4.2 | 11.7 | 0.48 | 0.13 | 0.45 | 8.0 |
| 2396 | 55.25 | 0.00 | 0.7 | 0.89 | 0.89 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 15,7 | 4.4 | 13.0 | 0.48 | 0.13 | 0.45 | 8.0 |
| 2396 + 1/2 | 55.29 | 0.00 | 0.7 | 0.89 | 0.89 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 8,0 | 4.1 | 11.3 | 0.48 | 0.11 | 0.44 | 8.0 |
| 2397 | 55.32 | 0.00 | 0.7 | 0.89 | 0.89 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 5,3 | 4.8 | 11.6 | 0.47 | 0.11 | 0.44 | 8.0 |
| 2397 + 1/2 | 55.36 | 0.00 | 0.7 | 0.89 | 0.89 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 14,8 | 6.0 | 12.4 | 0.46 | 0.12 | 0.43 | 8.0 |
| 2398 | 55.39 | 0.00 | 0.7 | 0.90 | 0.89 | 1.01 | 1.01 | 1.01 | 0.000 | 1.17 | 7,6 | 8.2 | 12.2 | 0.45 | 0.15 | 0.42 | 8.0 |
| 2398 + 1/2 | 55.43 | 0.00 | 0.7 | 0.89 | 0.90 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 4,4 | 12.3 | 18.8 | 0.44 | 0.20 | 0.42 | 8.0 |
| 2399 | 55.47 | 0.00 | 0.7 | 0.89 | 0.90 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 14,8 | 19.2 | 29.0 | 0.43 | 0.26 | 0.41 | 8.0 |
| 2399 + 1/2 | 55.50 | 0.00 | 0.7 | 0.90 | 0.91 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 8,6 | 28.3 | 43.2 | 0.41 | 0.43 | 0.06 | 8.0 |
| 2400 first | 55.53 | 0.00 | 0.7 | 0.92 | 0.93 | 0.98 | 0.98 | 0.98 | 0.000 | 1.24 | 8,6 | 38.8 | 64.3 | 0.40 | 0.68 | 0.07 | 8.0 |
| 2400 + 1/2 | 55.57 | 0.00 | 0.8 | 0.97 | 0.95 | 1.02 | 1.02 | 1.02 | 0.000 | 1.33 | 0,7 | 23.4 | 55.2 | 0.39 | 0.80 | 0.07 | 8.0 |
| 2401 | 55.62 | 0.01 | 1.1 | 1.00 | 0.98 | 1.02 | 1.02 | 1.02 | 0.000 | 1.36 | 2,7 | 11.2 | 31.1 | 0.38 | 0.99 | 0.07 | 8.0 |
| 2401 + 1/2 | 55.69 | 0.01 | 1.4 | 1.03 | 1.00 | 1.04 | 1.04 | 1.04 | 0.000 | 1.37 | 2,8 | 10.5 | 17.8 | 0.36 | 1.00 | 0.06 | 8.0 |
| 2402 | 55.78 | 0.02 | 1.8 | 1.06 | 1.00 | 1.05 | 1.05 | 1.05 | 0.000 | 1.51 | 3,3 | 7.0 | 19.1 | 0.35 | 0.68 | 0.05 | 8.0 |
| 2402 + 1/2 | 55.92 | 0.02 | 2.3 | 1.00 | 1.05 | 0.96 | 0.96 | 0.96 | 0.001 | 1.53 | 3,6 | 3.8 | 10.6 | 0.35 | 0.60 | 0.04 | 8.0 |
| 2403 | 56.09 | 0.03 | 2.8 | 0.99 | 1.09 | 0.91 | 0.91 | 0.91 | 0.001 | 1.62 | 3,6 | 3.5 | 11.1 | 0.34 | 0.46 | 0.03 | 8.0 |
| 2403 + 1/2 | 56.31 | 0.03 | 3.3 | 1.13 | 1.19 | 0.95 | 0.95 | 0.95 | 0.001 | 1.57 | 9,5 | 3.3 | 12.4 | 0.34 | 0.48 | 0.05 | 8.0 |
| 2404 | 56.59 | 0.03 | 3.9 | 1.32 | 1.28 | 1.03 | 1.03 | 1.03 | 0.002 | 1.93 | 11,7 | 3.0 | 10.1 | 0.34 | 0.25 | 0.11 | 8.0 |
| 2404 + 1/2 | 56.92 | 0.04 | 4.6 | 1.43 | 1.41 | 1.02 | 1.04 | 1.02 | 0.007 | 2.92 | 11,7 | 2.9 | 6.1 | 0.34 | 0.19 | 0.18 | 8.0 |
| 2405 | 57.33 | 0.04 | 5.2 | 1.50 | 1.49 | 1.01 | 1.04 | 1.01 | 0.008 | 3.02 | 11,7 | 2.9 | 6.0 | 0.34 | 0.12 | 0.25 | 8.0 |
| 2405 + 1/2 | 57.81 | 0.04 | 5.9 | 1.54 | 1.52 | 1.01 | 1.05 | 1.01 | 0.014 | 3.44 | 11,7 | 3.1 | 6.1 | 0.34 | 0.07 | 0.30 | 8.0 |
| 2406 | 58.38 | 0.04 | 6.6 | 1.61 | 1.54 | 1.04 | 1.08 | 1.04 | 0.020 | 3.88 | 11,6 | 3.3 | 5.6 | 0.34 | 0.09 | 0.35 | 8.0 |
| 2406 + 1/2 | 59.02 | 0.04 | 7.3 | 1.71 | 1.54 | 1.11 | 1.13 | 1.11 | 0.019 | 6.82 | 12,6 | 3.5 | 6.2 | 0.35 | 0.09 | 0.39 | 8.0 |
| 2407 | 59.73 | 0.01 | 8.2 | 1.79 | 1.54 | 1.16 | 1.15 | 1.15 | 0.030 | 10.71 | 12,5 | 3.8 | 6.3 | 0.35 | 0.10 | 0.43 | 8.0 |
| 2407 + 1/2 | 60.46 | 0.02 | 9.5 | 1.86 | 1.54 | 1.21 | 1.16 | 1.16 | 0.043 | 17.92 | 12,6 | 4.0 | 6.1 | 0.36 | 0.13 | 0.46 | 8.0 |
| 2408 | 61.22 | 0.03 | 11.7 | 1.94 | 1.54 | 1.26 | 1.17 | 1.17 | 0.063 | 15.16 | 12,6 | 4.4 | 6.1 | 0.36 | 0.13 | 0.49 | 8.0 |
| 2408 + 1/2 | 62.04 | 0.13 | 14.8 | 1.86 | 1.54 | 1.21 | 1.14 | 1.14 | 0.053 | 6.34 | 13,5 | 4.9 | 6.8 | 0.37 | 0.16 | 0.52 | 8.0 |
| 2409 | 63.12 | 0.19 | 17.0 | 1.75 | 1.54 | 1.13 | 1.04 | 1.04 | 0.053 | 2.99 | 12,5 | 5.1 | 7.6 | 0.38 | 0.20 | 0.55 | 8.0 |
| 2409 + 1/2 | 64.57 | 0.08 | 19.1 | 1.73 | 1.54 | 1.12 | 1.06 | 1.06 | 0.049 | 3.74 | 11,7 | 4.9 | 6.6 | 0.39 | 0.21 | 0.59 | 8.0 |
| 2410 | 66.18 | 0.02 | 21.4 | 1.70 | 1.54 | 1.10 | 1.07 | 1.07 | 0.042 | 3.36 | 11,7 | 5.0 | 6.4 | 0.40 | 0.22 | 0.63 | 8.0 |
| 2410 + 1/2 | 67.74 | 0.19 | 20.9 | 1.76 | 1.54 | 1.14 | 1.11 | 1.11 | 0.040 | 5.92 | 12,7 | 5.1 | 7.1 | 0.41 | 0.20 | 0.67 | 8.0 |
| 2411 | 68.90 | 0.50 | 19.7 | 1.85 | 1.54 | 1.20 | 1.10 | 1.10 | 0.060 | 3.89 | 12,7 | 5.0 | 7.9 | 0.42 | 0.24 | 0.70 | 8.0 |
| 2411 + 1/2 | 69.07 | 0.46 | 18.2 | 1.81 | 1.54 | 1.18 | 1.10 | 1.10 | 0.051 | 4.95 | 13,5 | 5.1 | 8.8 | 0.43 | 0.30 | 0.73 | 8.0 |
| 2412 | 68.33 | 0.41 | 9.4 | 3.49 | 1.54 | 2.26 | 0.97 | 0.97 | 0.065 | 2.74 | 2,8 | 5.2 | 9.4 | 0.44 | 0.28 | 0.76 | 8.0 |
| 2412 + 1/2 | 66.77 | 1.33 | 7.3 | 1.59 | 1.54 | 1.03 | 1.04 | 1.03 | 0.020 | 2.66 | 1,7 | 5.7 | 10.5 | 0.43 | 0.22 | 0.78 | 8.0 |
| 2413 | 67.86 | 0.01 | 7.9 | 1.56 | 1.54 | 1.01 | 1.03 | 1.01 | 0.019 | 2.80 | 1,7 | 6.1 | 11.4 | 0.43 | 0.19 | 0.80 | 8.0 |
| 2413 + 1/2 | 68.96 | 0.01 | 8.3 | 1.54 | 1.55 | 1.00 | 1.02 | 1.00 | 0.019 | 2.73 | 1,7 | 5.8 | 12.5 | 0.43 | 0.15 | 0.83 | 8.0 |
| 2414 | 70.09 | 0.02 | 9.1 | 1.56 | 1.54 | 1.01 | 1.02 | 1.01 | 0.029 | 2.79 | 1,3 | 6.5 | 13.9 | 0.42 | 0.13 | 0.85 | 8.0 |
| 2414 + 1/2 | 71.26 | 0.03 | 9.7 | 1.53 | 1.54 | 0.99 | 1.00 | 0.99 | 0.029 | 2.87 | 1,3 | 6.7 | 15.1 | 0.42 | 0.12 | 0.41 | 10.0 |
| 2415 | 72.50 | 0.02 | 10.4 | 1.53 | 1.53 | 1.00 | 0.98 | 0.98 | 0.040 | 2.73 | 1,3 | 6.5 | 15.3 | 0.41 | 0.15 | 0.41 | 10.0 |
| 2415 + 1/2 | 73.77 | 0.03 | 11.2 | 1.51 | 1.53 | 0.99 | 0.99 | 0.99 | 0.054 | 2.61 | 4,2 | 6.9 | 16.7 | 0.40 | 0.17 | 0.40 | 10.0 |
| 2416 | 75.10 | 0.03 | 11.8 | 1.53 | 1.51 | 1.02 | 1.02 | 1.02 | 0.027 | 2.75 | 4,2 | 7.3 | 16.8 | 0.39 | 0.18 | 0.39 | 10.1 |
| 2416 + 1/2 | 76.50 | 0.02 | 12.5 | 1.50 | 1.50 | 1.00 | 0.99 | 0.99 | 0.033 | 2.63 | 1,2 | 7.9 | 17.8 | 0.38 | 0.15 | 0.38 | 8.0 |
| 2417 | 77.94 | 0.04 | 13.2 | 1.49 | 1.49 | 0.99 | 0.98 | 0.98 | 0.035 | 2.62 | 1,2 | 8.0 | 18.4 | 0.37 | 0.14 | 0.37 | 10.0 |
| 2417 + 1/2 | 79.46 | 0.03 | 14.0 | 1.46 | 1.49 | 0.98 | 0.96 | 0.96 | 0.037 | 3.09 | 1,1 | 8.4 | 17.9 | 0.36 | 0.13 | 0.36 | 10.0 |
| 2418 | 81.04 | 0.02 | 14.7 | 1.44 | 1.48 | 0.97 | 0.93 | 0.93 | 0.053 | 2.99 | 1,1 | 8.9 | 15.8 | 0.35 | 0.13 | 0.35 | 9.8 |
| 2418 + 1/2 | 82.66 | 0.00 | 15.5 | 1.47 | 1.46 | 1.00 | 0.96 | 0.96 | 0.047 | 2.23 | 4,1 | 8.7 | 14.3 | 0.35 | 0.11 | 0.34 | 9.7 |
| 2419 | 84.26 | 0.06 | 16.2 | 1.49 | 1.46 | 1.02 | 0.98 | 0.98 | 0.048 | 3.11 | 4,1 | 9.1 | 16.5 | 0.34 | 0.10 | 0.34 | 9.4 |
| 2419 + 1/2 | 85.75 | 0.16 | 16.9 | 1.46 | 1.45 | 1.00 | 0.99 | 0.99 | 0.039 | 3.62 | 4,1 | 9.8 | 18.9 | 0.33 | 0.08 | 0.33 | 9.2 |
| 2420 | 86.93 | 0.06 | 17.8 | 1.46 | 1.45 | 1.01 | 1.02 | 1.01 | 0.040 | 3.58 | 4,1 | 10.4 | 18.4 | 0.32 | 0.07 | 0.32 | 8.9 |
| 2420 + 1/2 | 87.98 | 0.04 | 18.4 | 1.44 | 1.44 | 1.00 | 1.01 | 1.00 | 0.034 | 2.60 | 4,1 | 10.9 | 12.2 | 0.31 | 0.07 | 0.31 | 8.7 |
| 2421 | 89.11 | 0.01 | 19.1 | 1.39 | 1.44 | 0.97 | 1.01 | 0.97 | 0.019 | 2.51 | 11,0 | 11.5 | 13.4 | 0.30 | 0.06 | 0.30 | 8.8 |
| 2421 + 1/2 | 90.25 | 0.03 | 20.0 | 1.39 | 1.44 | 0.97 | 0.99 | 0.97 | 0.029 | 2.51 | 12,0 | 11.4 | 13.8 | 0.29 | 0.06 | 0.29 | 15.8 |
| 2422 | 91.45 | 0.05 | 20.5 | 1.37 | 1.43 | 0.96 | 0.99 | 0.96 | 0.032 | 2.97 | 12,0 | 10.3 | 15.2 | 0.28 | 0.06 | 0.28 | 16.1 |
| 2422 + 1/2 | 92.76 | 0.01 | 21.2 | 1.39 | 1.41 | 0.98 | 1.00 | 0.98 | 0.034 | 3.12 | 12,0 | 7.1 | 15.2 | 0.28 | 0.06 | 0.27 | 16.4 |
| 2423 | 94.04 | 0.04 | 21.8 | 1.40 | 1.40 | 1.00 | 1.02 | 1.00 | 0.020 | 2.84 | 12,0 | 5.2 | 10.7 | 0.27 | 0.05 | 0.26 | 16.6 |
| 2423 + 1/2 | 95.24 | 0.03 | 22.5 | 1.44 | 1.39 | 1.03 | 1.04 | 1.03 | 0.017 | 2.88 | 12,0 | 4.9 | 7.7 | 0.26 | 0.06 | 0.26 | 16.9 |
| 2424 | 96.38 | 0.05 | 23.2 | 1.45 | 1.39 | 1.04 | 1.06 | 1.04 | 0.013 | 3.07 | 0,0 | 4.9 | 8.0 | 0.25 | 0.06 | 0.25 | 17.1 |
| 2424 + 1/2 | 97.41 | 0.14 | 23.8 | 1.42 | 1.39 | 1.02 | 1.04 | 1.02 | 0.016 | 3.13 | 0,0 | 4.9 | 7.6 | 0.24 | 0.06 | 0.24 | 17.3 |
| 2425 | 98.15 | 0.00 | 24.5 | 1.40 | 1.38 | 1.01 | 1.00 | 1.00 | 0.019 | 3.26 | 12,0 | 5.6 | 7.7 | 0.24 | 0.07 | 0.24 | 17.4 |
| 2425 + 1/2 | 98.90 | 0.00 | 25.1 | 1.38 | 1.39 | 0.99 | 1.00 | 0.99 | 0.009 | 3.02 | 12,0 | 6.0 | 7.1 | 0.23 | 0.07 | 0.23 | 17.6 |
| 2426 | 99.64 | 0.17 | 25.8 | 1.39 | 1.38 | 1.01 | 1.00 | 1.00 | 0.014 | 2.54 | 13,6 | 6.6 | 8.0 | 0.23 | 0.08 | 0.23 | 17.7 |
| 2426 + 1/2 | 100.05 | 0.13 | 26.4 | 1.38 | 1.39 | 0.99 | 1.00 | 0.99 | 0.007 | 2.69 | 13,6 | 7.2 | 8.8 | 0.23 | 0.07 | 0.22 | 17.8 |
| 2427 | 100.20 | 0.08 | 27.1 | 1.35 | 1.39 | 0.97 | 1.00 | 0.97 | 0.002 | 2.63 | 14,0 | 8.0 | 9.8 | 0.22 | 0.07 | 0.22 | 17.7 |
| 2427 + 1/2 | 100.19 | 0.13 | 27.7 | 1.33 | 1.39 | 0.96 | 0.99 | 0.96 | 0.004 | 2.80 | 1,5 | 8.7 | 9.1 | 0.22 | 0.09 | 0.21 | 17.8 |
| 2428 | 99.93 | 0.20 | 28.4 | 1.32 | 1.39 | 0.95 | 0.99 | 0.95 | 0.000 | 2.62 | 14,7 | 9.7 | 10.3 | 0.22 | 0.08 | 0.21 | 17.9 |
| 2428 + 1/2 | 99.26 | 0.19 | 29.1 | 1.32 | 1.39 | 0.95 | 0.99 | 0.95 | 0.001 | 2.79 | 0,5 | 10.8 | 11.4 | 0.21 | 0.10 | 0.21 | 17.8 |
| 2429 | 98.22 | 0.17 | 29.6 | 1.30 | 1.39 | 0.94 | 0.97 | 0.94 | 0.000 | 2.59 | 15,0 | 11.6 | 12.6 | 0.21 | 0.08 | 0.21 | 17.1 |
| 2429 + 1/2 | 96.84 | 0.08 | 30.3 | 1.29 | 1.39 | 0.93 | 0.96 | 0.93 | 0.001 | 2.53 | 15,0 | 12.5 | 13.6 | 0.21 | 0.06 | 0.21 | 16.9 |
| 2430 | 95.29 | 0.02 | 30.8 | 1.32 | 1.39 | 0.95 | 0.97 | 0.95 | 0.004 | 2.85 | 15,0 | 12.9 | 13.9 | 0.21 | 0.05 | 0.21 | 17.4 |
| 2430 + 1/2 | 93.78 | 0.02 | 31.2 | 1.30 | 1.40 | 0.93 | 0.96 | 0.93 | 0.004 | 2.75 | 15,7 | 13.6 | 14.6 | 0.21 | 0.05 | 0.21 | 18.1 |
| 2431 | 92.23 | 0.04 | 31.5 | 1.31 | 1.40 | 0.94 | 0.96 | 0.94 | 0.001 | 2.33 | 15,7 | 13.8 | 15.1 | 0.21 | 0.05 | 0.99 | 8.0 |
| 2431 + 1/2 | 90.76 | 0.03 | 32.1 | 1.29 | 1.40 | 0.92 | 0.93 | 0.92 | 0.001 | 1.64 | 14,4 | 14.0 | 15.7 | 0.21 | 0.06 | 0.99 | 8.0 |
| 2432 | 89.22 | 0.11 | 32.3 | 1.32 | 1.40 | 0.94 | 0.95 | 0.94 | 0.004 | 1.77 | 15,6 | 14.5 | 16.3 | 0.21 | 0.07 | 1.00 | 8.0 |
| 2432 + 1/2 | 87.91 | 0.19 | 32.6 | 1.33 | 1.40 | 0.95 | 0.97 | 0.95 | 0.002 | 1.68 | 15,4 | 15.0 | 16.4 | 0.21 | 0.08 | 1.00 | 8.0 |
| 2433 | 86.98 | 0.30 | 32.8 | 1.36 | 1.40 | 0.97 | 0.99 | 0.97 | 0.001 | 1.65 | 8,8 | 15.5 | 16.9 | 0.21 | 0.09 | 1.00 | 8.0 |
| 2433 + 1/2 | 86.65 | 0.04 | 32.9 | 1.41 | 1.43 | 0.98 | 0.99 | 0.98 | 0.000 | 1.53 | 7,8 | 15.4 | 16.9 | 0.21 | 0.10 | 1.00 | 8.0 |
| 2434 | 86.40 | 0.08 | 33.0 | 1.47 | 1.46 | 1.00 | 1.00 | 1.00 | 0.002 | 1.60 | 7,8 | 16.1 | 17.4 | 0.21 | 0.10 | 1.00 | 8.0 |
| 2434 + 1/2 | 86.31 | 0.01 | 33.2 | 1.52 | 1.52 | 1.00 | 1.00 | 1.00 | 0.003 | 2.34 | 7,8 | 16.3 | 17.2 | 0.22 | 0.10 | 1.00 | 8.0 |
| 2435 | 86.20 | 0.06 | 33.3 | 1.57 | 1.57 | 1.00 | 1.00 | 1.00 | 0.004 | 1.57 | 3,1 | 16.4 | 17.3 | 0.22 | 0.11 | 1.00 | 8.0 |
| 2435 + 1/2 | 85.97 | 0.05 | 33.2 | 1.61 | 1.63 | 0.99 | 0.99 | 0.99 | 0.002 | 1.96 | 1,0 | 16.3 | 17.7 | 0.22 | 0.12 | 1.00 | 8.0 |
| 2436 | 85.83 | 0.10 | 33.4 | 1.68 | 1.67 | 1.01 | 1.01 | 1.01 | 0.001 | 1.90 | 1,0 | 16.1 | 17.4 | 0.22 | 0.12 | 1.00 | 8.0 |
| 2436 + 1/2 | 85.49 | 0.01 | 33.3 | 1.72 | 1.73 | 1.00 | 0.99 | 0.99 | 0.002 | 2.13 | 1,0 | 15.6 | 16.8 | 0.22 | 0.12 | 0.99 | 8.0 |
| 2437 | 85.18 | 0.00 | 33.2 | 1.78 | 1.77 | 1.00 | 1.01 | 1.00 | 0.003 | 2.02 | 1,0 | 15.4 | 16.4 | 0.23 | 0.12 | 1.00 | 8.0 |
| 2437 + 1/2 | 84.88 | 0.03 | 33.0 | 1.82 | 1.81 | 1.01 | 1.00 | 1.00 | 0.008 | 1.68 | 15,4 | 15.1 | 16.9 | 0.23 | 0.13 | 1.00 | 8.0 |
| 2438 | 84.51 | 0.03 | 33.1 | 1.85 | 1.85 | 1.00 | 1.00 | 1.00 | 0.001 | 1.69 | 3,0 | 14.9 | 16.5 | 0.23 | 0.11 | 1.00 | 8.0 |
| 2438 + 1/2 | 84.20 | 0.05 | 32.9 | 1.88 | 1.88 | 1.00 | 1.00 | 1.00 | 0.004 | 1.80 | 3,0 | 14.5 | 16.0 | 0.23 | 0.07 | 0.23 | 14.3 |
| 2439 | 83.99 | 0.01 | 33.0 | 1.93 | 1.90 | 1.01 | 1.01 | 1.01 | 0.004 | 1.71 | 1,7 | 15.0 | 17.7 | 0.24 | 0.06 | 0.23 | 14.0 |
| 2439 + 1/2 | 83.79 | 0.04 | 33.1 | 1.93 | 1.92 | 1.00 | 1.01 | 1.00 | 0.001 | 1.80 | 1,7 | 15.3 | 16.9 | 0.24 | 0.05 | 0.24 | 13.6 |
| 2440 | 83.68 | 0.06 | 32.7 | 1.92 | 1.93 | 0.99 | 0.99 | 0.99 | 0.004 | 1.48 | 12,6 | 14.9 | 16.7 | 0.24 | 0.05 | 0.24 | 13.0 |
| 2440 + 1/2 | 83.68 | 0.03 | 33.0 | 1.94 | 1.94 | 1.00 | 1.00 | 1.00 | 0.000 | 1.49 | 7,2 | 14.9 | 16.2 | 0.24 | 0.06 | 0.24 | 12.5 |
| 2441 | 83.73 | 0.06 | 33.0 | 1.94 | 1.96 | 0.99 | 1.00 | 0.99 | 0.000 | 1.78 | 4,0 | 14.9 | 16.0 | 0.25 | 0.06 | 0.25 | 12.1 |
| 2441 + 1/2 | 83.68 | 0.08 | 32.7 | 1.97 | 1.96 | 1.01 | 1.00 | 1.00 | 0.001 | 1.96 | 4,0 | 14.8 | 16.2 | 0.25 | 0.07 | 0.25 | 11.7 |
| 2442 | 83.79 | 0.10 | 32.5 | 1.98 | 1.98 | 1.00 | 1.00 | 1.00 | 0.002 | 2.06 | 4,0 | 14.9 | 16.5 | 0.26 | 0.07 | 0.25 | 11.5 |
| 2442 + 1/2 | 84.09 | 0.02 | 32.5 | 2.00 | 2.00 | 1.00 | 1.00 | 1.00 | 0.003 | 1.96 | 4,0 | 15.1 | 16.9 | 0.26 | 0.06 | 0.26 | 11.9 |
| 2443 | 84.37 | 0.02 | 32.5 | 2.03 | 2.02 | 1.00 | 1.00 | 1.00 | 0.008 | 1.61 | 4,0 | 15.3 | 16.9 | 0.26 | 0.07 | 0.26 | 8.6 |
| 2443 + 1/2 | 84.61 | 0.03 | 32.5 | 2.04 | 2.04 | 1.00 | 1.00 | 1.00 | 0.005 | 1.43 | 1,6 | 15.3 | 17.4 | 0.27 | 0.07 | 0.26 | 11.3 |
| 2444 | 84.91 | 0.01 | 32.7 | 2.05 | 2.06 | 1.00 | 0.99 | 0.99 | 0.005 | 1.48 | 14,8 | 15.4 | 17.7 | 0.27 | 0.07 | 0.27 | 10.9 |
| 2444 + 1/2 | 85.23 | 0.14 | 32.6 | 2.07 | 2.08 | 0.99 | 1.00 | 0.99 | 0.001 | 1.70 | 0,6 | 15.7 | 17.5 | 0.28 | 0.06 | 0.27 | 10.4 |
| 2445 | 85.84 | 0.01 | 32.4 | 2.12 | 2.10 | 1.01 | 1.01 | 1.01 | 0.000 | 1.45 | 14,8 | 15.9 | 17.5 | 0.28 | 0.06 | 0.28 | 10.0 |
| 2445 + 1/2 | 86.47 | 0.04 | 32.3 | 2.14 | 2.17 | 0.99 | 0.98 | 0.98 | 0.002 | 1.49 | 5,0 | 16.1 | 18.9 | 0.29 | 0.06 | 0.28 | 10.1 |
| 2446 | 87.02 | 0.09 | 32.4 | 2.22 | 2.20 | 1.01 | 1.01 | 1.01 | 0.001 | 1.60 | 8,1 | 16.4 | 19.0 | 0.29 | 0.06 | 0.29 | 10.1 |
| 2446 + 1/2 | 87.75 | 0.05 | 32.2 | 2.27 | 2.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.63 | 8,1 | 16.7 | 21.4 | 0.30 | 0.06 | 0.30 | 10.0 |
| 2447 | 88.60 | 0.18 | 32.2 | 2.32 | 2.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.75 | 0,0 | 17.1 | 20.5 | 0.30 | 0.07 | 0.30 | 9.9 |
| 2447 + 1/2 | 89.08 | 0.10 | 32.1 | 2.34 | 2.34 | 1.00 | 1.00 | 1.00 | 0.000 | 1.64 | 0,0 | 17.3 | 21.4 | 0.31 | 0.07 | 0.31 | 9.9 |
| 2448 | 89.37 | 0.10 | 32.2 | 2.36 | 2.36 | 1.00 | 1.00 | 1.00 | 0.000 | 1.58 | 5,6 | 18.2 | 22.5 | 0.32 | 0.08 | 0.32 | 9.7 |
| 2448 + 1/2 | 89.46 | 0.04 | 32.0 | 2.39 | 2.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.63 | 15,6 | 18.6 | 25.0 | 0.32 | 0.10 | 0.32 | 9.6 |
| 2449 | 89.63 | 0.07 | 32.0 | 2.41 | 2.41 | 1.00 | 1.00 | 1.00 | 0.000 | 1.53 | 5,8 | 19.7 | 27.3 | 0.33 | 0.12 | 0.33 | 9.3 |
| 2449 + 1/2 | 89.67 | 0.10 | 32.0 | 2.43 | 2.43 | 1.00 | 1.00 | 1.00 | 0.001 | 1.58 | 9,1 | 20.8 | 29.0 | 0.34 | 0.14 | 0.34 | 9.1 |
| 2450 | 89.51 | 0.05 | 31.7 | 2.45 | 2.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.68 | 9,1 | 21.6 | 30.8 | 0.35 | 0.15 | 0.34 | 9.5 |
| 2450 + 1/2 | 89.46 | 0.07 | 31.9 | 2.48 | 2.48 | 1.00 | 1.00 | 1.00 | 0.000 | 1.62 | 8,0 | 22.2 | 33.5 | 0.35 | 0.16 | 0.35 | 9.4 |
| 2451 | 89.55 | 0.05 | 31.7 | 2.51 | 2.50 | 1.00 | 1.01 | 1.00 | 0.000 | 1.83 | 13,8 | 23.3 | 34.2 | 0.36 | 0.18 | 0.36 | 9.3 |
| 2451 + 1/2 | 89.54 | 0.17 | 31.5 | 2.51 | 2.51 | 1.00 | 1.00 | 1.00 | 0.002 | 2.01 | 13,8 | 23.8 | 35.4 | 0.37 | 0.18 | 0.37 | 9.1 |
| 2452 | 89.20 | 0.10 | 31.3 | 2.53 | 2.51 | 1.01 | 1.01 | 1.01 | 0.001 | 1.90 | 13,8 | 25.0 | 36.9 | 0.38 | 0.19 | 0.38 | 8.0 |
| 2452 + 1/2 | 88.65 | 0.02 | 31.3 | 2.56 | 2.51 | 1.02 | 1.02 | 1.02 | 0.001 | 1.68 | 1,8 | 25.9 | 36.4 | 0.39 | 0.20 | 0.38 | 8.0 |
| 2453 | 88.13 | 0.05 | 31.1 | 2.56 | 2.51 | 1.02 | 1.01 | 1.01 | 0.003 | 1.70 | 0,5 | 26.6 | 35.5 | 0.39 | 0.22 | 0.39 | 8.0 |
| 2453 + 1/2 | 87.52 | 0.00 | 31.1 | 2.52 | 2.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.56 | 11,1 | 26.8 | 29.9 | 0.40 | 0.22 | 0.40 | 8.0 |
| 2454 | 86.90 | 0.16 | 31.0 | 2.58 | 2.52 | 1.03 | 1.02 | 1.02 | 0.003 | 1.58 | 4,8 | 27.4 | 29.0 | 0.41 | 0.22 | 0.40 | 8.0 |
| 2454 + 1/2 | 86.60 | 0.10 | 30.9 | 2.56 | 2.53 | 1.01 | 1.02 | 1.01 | 0.001 | 1.64 | 15,2 | 28.0 | 30.1 | 0.42 | 0.24 | 0.41 | 8.0 |
| 2455 | 86.09 | 0.04 | 30.8 | 2.59 | 2.53 | 1.03 | 1.03 | 1.03 | 0.000 | 1.92 | 3,8 | 28.9 | 30.0 | 0.42 | 0.23 | 0.41 | 8.0 |
| 2455 + 1/2 | 85.52 | 0.08 | 30.8 | 2.51 | 2.53 | 0.99 | 1.00 | 0.99 | 0.001 | 1.71 | 15,2 | 29.1 | 30.5 | 0.42 | 0.24 | 0.42 | 8.0 |
| 2456 | 84.79 | 0.12 | 30.4 | 2.51 | 2.53 | 0.99 | 1.00 | 0.99 | 0.001 | 1.75 | 2,8 | 29.5 | 31.4 | 0.43 | 0.24 | 0.42 | 8.0 |
| 2456 + 1/2 | 83.83 | 0.06 | 29.8 | 2.55 | 2.53 | 1.01 | 0.99 | 0.99 | 0.005 | 1.79 | 1,8 | 29.6 | 31.6 | 0.43 | 0.27 | 0.43 | 8.6 |
| 2457 | 82.74 | 0.00 | 29.6 | 2.54 | 2.56 | 0.99 | 1.00 | 0.99 | 0.004 | 1.51 | 10,0 | 29.9 | 31.6 | 0.44 | 0.32 | 0.43 | 8.5 |
| 2457 + 1/2 | 81.66 | 0.04 | 29.7 | 2.52 | 2.56 | 0.98 | 1.00 | 0.98 | 0.002 | 1.50 | 0,5 | 30.1 | 32.9 | 0.44 | 0.44 | 0.44 | 8.5 |
| 2458 | 80.49 | 0.10 | 29.4 | 2.51 | 2.56 | 0.98 | 0.99 | 0.98 | 0.006 | 1.57 | 12,1 | 31.3 | 44.0 | 0.45 | 0.61 | 0.44 | 8.0 |
| 2458 + 1/2 | 79.13 | 0.05 | 28.8 | 2.56 | 2.56 | 1.00 | 1.00 | 1.00 | 0.010 | 1.66 | 3,4 | 40.9 | 54.1 | 0.45 | 0.73 | 0.44 | 8.0 |
| 2459 | 77.68 | 0.04 | 28.4 | 2.63 | 2.56 | 1.03 | 1.03 | 1.03 | 0.008 | 1.89 | 3,4 | 49.4 | 61.9 | 0.45 | 0.85 | 0.45 | 8.0 |
| 2459 + 1/2 | 76.14 | 0.05 | 28.1 | 2.66 | 2.56 | 1.04 | 1.04 | 1.04 | 0.011 | 1.86 | 3,4 | 54.4 | 68.0 | 0.45 | 0.74 | 0.45 | 8.0 |
| 2460 | 74.50 | 0.10 | 27.8 | 2.75 | 2.57 | 1.07 | 1.07 | 1.07 | 0.014 | 2.25 | 12,8 | 50.6 | 67.6 | 0.45 | 0.83 | 0.45 | 8.0 |
| 2460 + 1/2 | 72.64 | 0.02 | 27.5 | 2.84 | 2.58 | 1.10 | 1.10 | 1.10 | 0.014 | 2.13 | 8,3 | 55.5 | 73.0 | 0.46 | 0.94 | 0.45 | 8.0 |
| 2461 | 70.75 | 0.04 | 26.4 | 2.80 | 2.58 | 1.09 | 1.07 | 1.07 | 0.025 | 2.07 | 8,3 | 59.9 | 77.6 | 0.46 | 1.00 | 0.45 | 8.0 |
| 2461 + 1/2 | 68.94 | 0.08 | 25.9 | 2.72 | 2.59 | 1.05 | 1.03 | 1.03 | 0.020 | 1.95 | 3,4 | 64.1 | 81.7 | 0.46 | 1.04 | 0.46 | 8.0 |
| 2462 | 67.29 | 0.13 | 25.1 | 2.62 | 2.59 | 1.01 | 1.00 | 1.00 | 0.019 | 2.08 | 2,4 | 69.6 | 85.6 | 0.47 | 1.09 | 0.46 | 8.0 |
| 2462 + 1/2 | 65.89 | 0.10 | 24.8 | 2.58 | 2.63 | 0.98 | 0.97 | 0.97 | 0.028 | 2.14 | 2,4 | 74.6 | 88.7 | 0.47 | 1.10 | 0.46 | 8.0 |
| 2463 | 64.69 | 0.07 | 24.2 | 2.48 | 2.63 | 0.94 | 0.94 | 0.94 | 0.026 | 2.27 | 2,4 | 78.4 | 91.2 | 0.47 | 1.15 | 0.46 | 8.0 |
| 2463 + 1/2 | 63.64 | 0.10 | 23.7 | 2.45 | 2.65 | 0.92 | 0.92 | 0.92 | 0.029 | 2.31 | 2,4 | 82.0 | 93.2 | 0.47 | 1.16 | 0.46 | 8.0 |
| 2464 | 62.79 | 0.11 | 23.2 | 2.46 | 2.65 | 0.93 | 0.92 | 0.92 | 0.034 | 2.08 | 1,4 | 85.8 | 95.5 | 0.47 | 1.21 | 0.46 | 8.0 |
| 2464 + 1/2 | 62.15 | 0.14 | 22.5 | 2.56 | 2.65 | 0.97 | 0.96 | 0.96 | 0.034 | 2.71 | 9,0 | 88.7 | 95.2 | 0.47 | 1.24 | 0.46 | 8.0 |
| 2465 | 61.79 | 0.08 | 22.1 | 2.71 | 2.63 | 1.03 | 0.99 | 0.99 | 0.046 | 3.03 | 10,1 | 89.8 | 100.6 | 0.47 | 1.21 | 0.47 | 8.0 |
| 2465 + 1/2 | 61.61 | 0.05 | 21.6 | 2.75 | 2.63 | 1.05 | 1.02 | 1.02 | 0.038 | 3.37 | 10,1 | 90.4 | 98.5 | 0.48 | 1.14 | 0.47 | 8.0 |
| 2466 | 61.51 | 0.03 | 21.0 | 2.82 | 2.63 | 1.07 | 1.05 | 1.05 | 0.021 | 3.35 | 10,1 | 89.6 | 101.8 | 0.48 | 1.11 | 0.57 | 8.0 |
| 2466 + 1/2 | 61.36 | 0.07 | 20.3 | 2.86 | 2.63 | 1.09 | 1.06 | 1.06 | 0.021 | 3.13 | 10,1 | 90.4 | 103.0 | 0.48 | 1.05 | 0.48 | 8.0 |
| 2467 | 61.07 | 0.13 | 20.0 | 2.88 | 2.63 | 1.09 | 0.99 | 0.99 | 0.046 | 4.35 | 15,0 | 92.6 | 105.7 | 0.49 | 1.09 | 0.48 | 8.3 |
| 2467 + 1/2 | 60.53 | 0.08 | 19.5 | 2.88 | 2.63 | 1.09 | 1.07 | 1.07 | 0.021 | 5.13 | 15,0 | 94.1 | 107.9 | 0.49 | 1.21 | 0.56 | 8.0 |
| 2468 | 59.83 | 0.03 | 19.2 | 2.75 | 2.63 | 1.05 | 1.05 | 1.05 | 0.008 | 4.07 | 15,0 | 94.7 | 109.6 | 0.50 | 1.19 | 0.49 | 13.3 |
| 2468 + 1/2 | 59.06 | 0.04 | 18.5 | 2.64 | 2.61 | 1.01 | 1.01 | 1.01 | 0.004 | 3.30 | 14,0 | 94.2 | 110.0 | 0.50 | 1.22 | 0.50 | 13.0 |
| 2469 | 58.36 | 0.12 | 17.9 | 2.55 | 2.61 | 0.98 | 0.98 | 0.98 | 0.005 | 2.56 | 4,1 | 92.7 | 110.5 | 0.51 | 1.21 | 0.50 | 12.6 |
| 2469 + 1/2 | 57.91 | 0.17 | 17.2 | 2.60 | 2.57 | 1.01 | 1.03 | 1.01 | 0.001 | 2.88 | 14,2 | 88.4 | 109.1 | 0.51 | 1.19 | 0.51 | 11.8 |
| 2470 | 57.79 | 0.16 | 16.5 | 2.75 | 2.55 | 1.07 | 1.08 | 1.07 | 0.003 | 4.71 | 14,2 | 80.9 | 100.4 | 0.52 | 1.15 | 0.53 | 8.0 |
| 2470 + 1/2 | 57.99 | 0.11 | 15.8 | 2.85 | 2.51 | 1.13 | 1.11 | 1.11 | 0.011 | 5.33 | 15,2 | 69.6 | 86.4 | 0.52 | 1.10 | 0.52 | 11.2 |
| 2471 | 58.42 | 0.00 | 15.2 | 2.86 | 2.47 | 1.16 | 1.14 | 1.14 | 0.008 | 5.19 | 15,2 | 56.7 | 70.0 | 0.53 | 1.02 | 0.52 | 11.7 |
| 2471 + 1/2 | 58.84 | 0.04 | 14.6 | 2.77 | 2.46 | 1.13 | 1.13 | 1.13 | 0.006 | 4.68 | 15,2 | 43.7 | 54.2 | 0.53 | 0.94 | 0.53 | 11.5 |
| 2472 | 59.18 | 0.09 | 13.9 | 2.63 | 2.46 | 1.07 | 1.09 | 1.07 | 0.003 | 4.07 | 14,2 | 32.8 | 40.1 | 0.54 | 0.85 | 0.54 | 11.4 |
| 2472 + 1/2 | 59.33 | 0.11 | 13.2 | 2.45 | 2.43 | 1.01 | 1.01 | 1.01 | 0.005 | 3.28 | 14,2 | 25.7 | 30.4 | 0.55 | 0.76 | 0.54 | 11.1 |
| 2473 | 59.25 | 0.10 | 12.6 | 2.31 | 2.31 | 1.00 | 1.00 | 1.00 | 0.003 | 2.56 | 14,2 | 20.3 | 26.1 | 0.55 | 0.76 | 0.45 | 8.0 |
| 2473 + 1/2 | 58.98 | 0.11 | 12.0 | 2.17 | 2.18 | 1.00 | 1.00 | 1.00 | 0.003 | 2.22 | 2,7 | 16.5 | 21.8 | 0.56 | 0.61 | 0.43 | 8.0 |
| 2474 | 58.48 | 0.10 | 11.4 | 2.05 | 2.06 | 0.99 | 0.99 | 0.99 | 0.018 | 2.04 | 2,7 | 12.9 | 17.4 | 0.57 | 0.52 | 0.42 | 8.0 |
| 2474 + 1/2 | 57.78 | 0.03 | 10.8 | 1.95 | 1.96 | 1.00 | 1.00 | 1.00 | 0.012 | 2.10 | 15,7 | 9.9 | 13.6 | 0.58 | 0.35 | 0.40 | 8.0 |
| 2475 | 57.01 | 0.01 | 10.3 | 1.86 | 1.86 | 1.00 | 1.00 | 1.00 | 0.016 | 2.03 | 15,7 | 7.3 | 10.3 | 0.58 | 0.19 | 0.38 | 8.0 |
| 2475 + 1/2 | 56.22 | 0.02 | 9.8 | 1.77 | 1.77 | 1.00 | 1.00 | 1.00 | 0.017 | 1.82 | 15,7 | 6.0 | 9.0 | 0.59 | 0.08 | 0.36 | 8.0 |
| 2476 | 55.47 | 0.02 | 9.3 | 1.68 | 1.70 | 0.99 | 0.99 | 0.99 | 0.010 | 1.93 | 15,7 | 5.4 | 8.2 | 0.60 | 0.06 | 0.60 | 9.9 |
| 2476 + 1/2 | 54.77 | 0.04 | 8.8 | 1.64 | 1.64 | 1.00 | 1.00 | 1.00 | 0.016 | 1.64 | 12,8 | 5.0 | 7.7 | 0.61 | 0.06 | 0.26 | 8.0 |
| 2477 | 54.15 | 0.04 | 8.4 | 1.60 | 1.61 | 0.99 | 1.00 | 0.99 | 0.012 | 1.62 | 0,7 | 4.7 | 7.0 | 0.62 | 0.07 | 0.18 | 8.0 |
| 2477 + 1/2 | 53.60 | 0.03 | 7.9 | 1.57 | 1.57 | 1.00 | 1.00 | 1.00 | 0.015 | 1.50 | 9,5 | 4.4 | 6.5 | 0.63 | 0.05 | 0.63 | 9.5 |
| 2478 | 53.11 | 0.01 | 7.4 | 1.54 | 1.54 | 1.00 | 1.00 | 1.00 | 0.012 | 1.57 | 9,5 | 4.1 | 5.9 | 0.64 | 0.05 | 0.63 | 9.4 |
| 2478 + 1/2 | 52.64 | 0.02 | 7.0 | 1.51 | 1.51 | 1.00 | 1.00 | 1.00 | 0.011 | 1.66 | 9,5 | 3.8 | 5.3 | 0.65 | 0.05 | 0.64 | 9.2 |
| 2479 | 52.21 | 0.02 | 6.5 | 1.48 | 1.49 | 0.99 | 0.99 | 0.99 | 0.007 | 1.66 | 9,5 | 3.5 | 5.0 | 0.66 | 0.05 | 0.65 | 9.1 |
| 2479 + 1/2 | 51.84 | 0.02 | 6.1 | 1.47 | 1.47 | 1.00 | 1.00 | 1.00 | 0.002 | 1.63 | 7,2 | 3.3 | 4.9 | 0.66 | 0.06 | 0.66 | 9.0 |
| 2480 | 51.49 | 0.02 | 5.6 | 1.45 | 1.45 | 1.00 | 1.00 | 1.00 | 0.005 | 1.78 | 7,2 | 3.0 | 4.6 | 0.67 | 0.05 | 0.67 | 8.9 |
| 2480 + 1/2 | 51.18 | 0.02 | 5.2 | 1.43 | 1.43 | 1.00 | 1.00 | 1.00 | 0.001 | 1.74 | 7,2 | 2.7 | 4.7 | 0.68 | 0.05 | 0.68 | 8.8 |
| 2481 | 50.90 | 0.01 | 4.7 | 1.41 | 1.42 | 1.00 | 1.00 | 1.00 | 0.000 | 1.78 | 7,2 | 2.5 | 4.6 | 0.69 | 0.05 | 0.69 | 8.7 |
| 2481 + 1/2 | 50.66 | 0.02 | 4.3 | 1.40 | 1.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.72 | 7,2 | 2.3 | 4.5 | 0.70 | 0.05 | 0.69 | 8.6 |
| 2482 | 50.46 | 0.01 | 3.8 | 1.37 | 1.37 | 1.00 | 1.00 | 1.00 | 0.000 | 1.77 | 8,0 | 2.2 | 4.5 | 0.70 | 0.05 | 0.70 | 8.6 |
| 2482 + 1/2 | 50.27 | 0.01 | 3.3 | 1.34 | 1.34 | 1.01 | 1.01 | 1.01 | 0.000 | 1.82 | 8,0 | 2.1 | 4.4 | 0.71 | 0.05 | 0.71 | 8.6 |
| 2483 | 50.11 | 0.01 | 3.0 | 1.30 | 1.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.91 | 10,6 | 2.0 | 4.3 | 0.71 | 0.05 | 0.71 | 8.5 |
| 2483 + 1/2 | 49.98 | 0.01 | 2.6 | 1.25 | 1.25 | 1.00 | 1.00 | 1.00 | 0.000 | 1.82 | 8,0 | 1.9 | 4.4 | 0.72 | 0.05 | 0.72 | 8.5 |
| 2484 | 49.86 | 0.01 | 2.3 | 1.20 | 1.20 | 1.01 | 1.01 | 1.01 | 0.000 | 1.80 | 8,0 | 1.9 | 4.3 | 0.72 | 0.04 | 0.72 | 8.4 |
| 2484 + 1/2 | 49.77 | 0.01 | 2.0 | 1.14 | 1.14 | 1.00 | 1.00 | 1.00 | 0.000 | 1.81 | 8,0 | 1.9 | 4.2 | 0.73 | 0.04 | 0.72 | 8.4 |
| 2485 | 49.69 | 0.01 | 1.6 | 1.07 | 1.07 | 1.00 | 1.00 | 1.00 | 0.000 | 1.73 | 8,0 | 1.9 | 4.1 | 0.73 | 0.04 | 0.72 | 8.4 |
| 2485 + 1/2 | 49.63 | 0.00 | 1.4 | 0.99 | 1.00 | 1.00 | 1.00 | 1.00 | 0.000 | 1.61 | 13,7 | 1.9 | 4.1 | 0.74 | 0.04 | 0.73 | 8.3 |
| 2486 | 49.58 | 0.01 | 1.2 | 0.93 | 0.93 | 1.00 | 1.00 | 1.00 | 0.000 | 1.51 | 13,7 | 1.8 | 4.2 | 0.74 | 0.04 | 0.73 | 8.3 |
| 2486 + 1/2 | 49.54 | 0.00 | 1.0 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.39 | 7,0 | 1.8 | 4.0 | 0.74 | 0.04 | 0.73 | 8.3 |
| 2487 | 49.51 | 0.00 | 0.9 | 0.82 | 0.83 | 0.99 | 0.99 | 0.99 | 0.000 | 1.27 | 14,7 | 1.8 | 4.2 | 0.74 | 0.04 | 0.73 | 8.3 |
| 2487 + 1/2 | 49.48 | 0.00 | 0.7 | 0.78 | 0.79 | 0.99 | 0.99 | 0.99 | 0.000 | 1.16 | 15,7 | 1.7 | 4.1 | 0.74 | 0.04 | 0.73 | 8.4 |
| 2488 | 49.47 | 0.00 | 0.7 | 0.76 | 0.76 | 0.99 | 0.99 | 0.99 | 0.000 | 1.22 | 15,7 | 1.7 | 4.2 | 0.74 | 0.04 | 0.73 | 8.4 |
| 2488 + 1/2 | 49.46 | 0.00 | 0.6 | 0.74 | 0.75 | 0.98 | 0.98 | 0.98 | 0.000 | 1.07 | 3,7 | 1.8 | 4.1 | 0.74 | 0.04 | 0.73 | 8.4 |
| 2489 last | 49.45 | 0.00 | 0.6 | 0.73 | 0.75 | 0.98 | 0.98 | 0.98 | 0.000 | 1.09 | 0,7 | 1.7 | 4.0 | 0.74 | 0.04 | 0.73 | 8.4 |
| 2489 + 1/2 | 49.45 | 0.00 | 0.6 | 0.73 | 0.75 | 0.98 | 0.98 | 0.98 | 0.000 | 1.06 | 0,6 | 1.8 | 4.2 | 0.74 | 0.04 | 0.73 | 8.4 |
| 2490 | 49.44 | 0.00 | 0.6 | 0.73 | 0.75 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 0,5 | 1.8 | 4.2 | 0.74 | 0.04 | 0.73 | 8.4 |
| 2490 + 1/2 | 49.44 | 0.00 | 0.6 | 0.73 | 0.75 | 0.98 | 0.98 | 0.98 | 0.000 | 1.10 | 11,7 | 1.7 | 4.3 | 0.74 | 0.04 | 0.73 | 8.4 |
| 2491 | 49.44 | 0.00 | 0.6 | 0.74 | 0.75 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 7,4 | 1.8 | 4.2 | 0.74 | 0.04 | 0.73 | 8.4 |
| 2491 + 1/2 | 49.43 | 0.00 | 0.6 | 0.73 | 0.75 | 0.98 | 0.98 | 0.98 | 0.000 | 1.13 | 0,5 | 1.8 | 4.2 | 0.74 | 0.04 | 0.73 | 8.3 |
| 2492 | 49.43 | 0.00 | 0.6 | 0.73 | 0.75 | 0.98 | 0.98 | 0.98 | 0.000 | 1.09 | 0,5 | 1.8 | 4.2 | 0.74 | 0.04 | 0.73 | 8.3 |
| 2492 + 1/2 | 49.42 | 0.00 | 0.6 | 0.74 | 0.75 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 2,7 | 1.8 | 4.2 | 0.74 | 0.04 | 0.73 | 8.3 |
| 2493 | 49.41 | 0.00 | 0.6 | 0.74 | 0.75 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 11,5 | 1.8 | 4.4 | 0.74 | 0.04 | 0.73 | 8.4 |
| 2493 + 1/2 | 49.41 | 0.00 | 0.6 | 0.74 | 0.75 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 5,2 | 1.8 | 4.3 | 0.74 | 0.04 | 0.73 | 8.3 |
| 2494 | 49.41 | 0.00 | 0.6 | 0.74 | 0.75 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 6,2 |  |  |  |  |  |  |
| 2494 + 1/2 | 49.40 | 0.00 | 0.6 | 0.74 | 0.75 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 8,4 |  |  |  |  |  |  |
| 2495 | 49.39 | 0.00 | 0.6 | 0.74 | 0.75 | 0.99 | 0.99 | 0.99 | 0.000 | 1.07 | 3,2 |  |  |  |  |  |  |
| 2495 + 1/2 | 49.39 | 0.00 | 0.6 | 0.74 | 0.75 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 15,5 |  |  |  |  |  |  |
| 2496 | 49.38 | 0.00 | 0.6 | 0.75 | 0.74 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 14,0 |  |  |  |  |  |  |
| 2496 + 1/2 | 49.37 | 0.00 | 0.6 | 0.74 | 0.75 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 14,0 |  |  |  |  |  |  |
| 2497 | 49.37 | 0.00 | 0.6 | 0.74 | 0.75 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 7,4 |  |  |  |  |  |  |
| 2497 + 1/2 | 49.36 | 0.00 | 0.6 | 0.75 | 0.75 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 0,7 |  |  |  |  |  |  |
| 2498 | 49.36 | 0.00 | 0.6 | 0.75 | 0.75 | 1.01 | 1.01 | 1.01 | 0.000 | 1.14 | 13,7 |  |  |  |  |  |  |
| 2498 + 1/2 | 49.35 | 0.00 | 0.6 | 0.75 | 0.75 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 1,7 |  |  |  |  |  |  |
| 2499 | 49.34 | 0.00 | 0.6 | 0.75 | 0.75 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 14,2 |  |  |  |  |  |  |
| 2499 + 1/2 | 49.34 | 0.00 | 0.6 | 0.75 | 0.75 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 12,6 |  |  |  |  |  |  |
| 2500 | 49.33 | 0.00 | 0.6 | 0.75 | 0.75 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 7,0 |  |  |  |  |  |  |
| 2500 + 1/2 | 49.32 | 0.00 | 0.6 | 0.75 | 0.75 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 15,3 |  |  |  |  |  |  |
| 2501 | 49.32 | 0.00 | 0.6 | 0.76 | 0.75 | 1.01 | 1.01 | 1.01 | 0.000 | 1.08 | 15,8 |  |  |  |  |  |  |
| 2501 + 1/2 | 49.31 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### dive, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.36 from frame 2408 to the next, limit 1.2.
Largest pop score of one block: 47.38 from frame 2407 + 1/2 to the next, block column 12 row 5 from the top left, shown, not judged.
Largest change in place: 90.7 from frame 2468 + 1/2 to 8 film frames later, most at pixel 1560, 312, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 2490 to 2501 + 1/2): change 0.8; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.197 from frame 2407 + 1/2 to the next, most at pixel 1478, 734, a patch of 84 by 176 px; 0 of 227 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 228 rows, which says nothing of them, quiet or not: frame 2501 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 2407 + 1/2 in /home/user/workspace/work/p6/ha9/01/mars-dive-p1of2-pops-full.png, frame 2408 in /home/user/workspace/work/p6/ha9/01/mars-dive-p1of2-pops-full.png, frame 2460 + 1/2 in /home/user/workspace/work/p6/ha9/02/mars-dive-p2of2-pops-full.png, frame 2471 in /home/user/workspace/work/p6/ha9/02/mars-dive-p2of2-pops-full.png, frame 2471 + 1/2 in /home/user/workspace/work/p6/ha9/02/mars-dive-p2of2-pops-full.png.

With the carry at the full size the dive has 3 numbers over the limit or not measured.

- FULL SIZE RED the level of frame 2412 + 1/2 lies 1.33 off the line through its two neighbours, limit 1.3
- FULL SIZE RED pop score 1.36 from frame 2408 to the next, limit 1.2 (13 frames over it, first 2407 + 1/2)
- FULL SIZE RED the pattern of the picture changes in place by 1.24 from frame 2464 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (41 frames over it, first 2400)

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2388 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 13,0 | 1.2 | 4.7 | 0.48 | 1.00 | 0.284 | 0.284 | 1.001 | 0.474 | 938,806 | 60 by 68 |
| 2388 + 1/2 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 6,4 | 1.3 | 5.3 | 0.48 | 1.01 | 0.285 | 0.284 | 1.005 | 0.475 | 966,858 | 80 by 124 |
| 2389 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 7,7 | 1.4 | 5.3 | 0.48 | 1.00 | 0.284 | 0.285 | 0.997 | 0.474 | 1098,630 | 60 by 56 |
| 2389 + 1/2 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 9,6 | 1.4 | 5.3 | 0.48 | 1.00 | 0.286 | 0.285 | 1.002 | 0.475 | 946,778 | 56 by 56 |
| 2390 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 7,6 | 1.5 | 5.5 | 0.48 | 1.00 | 0.285 | 0.285 | 0.997 | 0.475 | 946,794 | 52 by 76 |
| 2390 + 1/2 | 0.7 | 0.29 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 1.12 | 7,6 | 1.5 | 5.5 | 0.48 | 1.00 | 0.286 | 0.285 | 1.003 | 0.475 | 954,858 | 64 by 120 |
| 2391 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 10,4 | 1.6 | 5.7 | 0.48 | 0.99 | 0.285 | 0.285 | 0.999 | 0.475 | 1106,622 | 140 by 72 |
| 2391 + 1/2 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.26 | 8,0 | 1.6 | 5.5 | 0.48 | 1.00 | 0.285 | 0.285 | 1.000 | 0.475 | 946,782 | 52 by 76 |
| 2392 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.25 | 8,0 | 1.5 | 5.5 | 0.48 | 1.01 | 0.286 | 0.285 | 1.003 | 0.475 | 1166,618 | 84 by 56 |
| 2392 + 1/2 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 2,7 | 1.6 | 5.4 | 0.48 | 1.00 | 0.284 | 0.285 | 0.998 | 0.475 | 1026,650 | 52 by 60 |
| 2393 | 0.7 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 4,1 | 1.5 | 5.6 | 0.48 | 1.00 | 0.282 | 0.285 | 0.990 | 0.476 | 946,790 | 48 by 108 |
| 2393 + 1/2 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 15,1 | 1.6 | 5.6 | 0.48 | 1.00 | 0.285 | 0.285 | 1.000 | 0.476 | 970,766 | 60 by 136 |
| 2394 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 2,8 | 1.6 | 6.1 | 0.48 | 1.01 | 0.286 | 0.285 | 1.002 | 0.476 | 1058,630 | 92 by 72 |
| 2394 + 1/2 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 1,8 | 1.7 | 6.9 | 0.48 | 1.00 | 0.285 | 0.285 | 1.001 | 0.476 | 1030,654 | 56 by 52 |
| 2395 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 13,5 | 2.2 | 8.0 | 0.48 | 0.99 | 0.285 | 0.285 | 1.002 | 0.476 | 1154,606 | 188 by 124 |
| 2395 + 1/2 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 4,1 | 3.2 | 8.6 | 0.48 | 1.01 | 0.284 | 0.285 | 0.996 | 0.476 | 966,846 | 68 by 60 |
| 2396 | 0.7 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.06 | 6,7 | 2.8 | 8.8 | 0.48 | 1.00 | 0.283 | 0.285 | 0.992 | 0.476 | 1222,634 | 96 by 100 |
| 2396 + 1/2 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.26 | 8,0 | 2.8 | 7.1 | 0.48 | 1.00 | 0.287 | 0.285 | 1.009 | 0.476 | 1026,654 | 72 by 72 |
| 2397 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 8,0 | 3.4 | 7.9 | 0.47 | 1.00 | 0.285 | 0.286 | 0.997 | 0.476 | 1294,694 | 88 by 64 |
| 2397 + 1/2 | 0.7 | 0.30 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 1.12 | 8,0 | 5.2 | 7.9 | 0.46 | 1.00 | 0.286 | 0.286 | 1.003 | 0.477 | 962,774 | 52 by 100 |
| 2398 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.05 | 12,8 | 8.1 | 11.7 | 0.45 | 1.01 | 0.286 | 0.286 | 1.000 | 0.477 | 1170,610 | 108 by 56 |
| 2398 + 1/2 | 0.7 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 2,6 | 13.2 | 19.2 | 0.44 | 0.99 | 0.286 | 0.286 | 0.999 | 0.477 | 1238,634 | 96 by 64 |
| 2399 | 0.7 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 10,3 | 20.0 | 29.7 | 0.43 | 0.99 | 0.285 | 0.286 | 0.998 | 0.477 | 1066,638 | 84 by 112 |
| 2399 + 1/2 | 0.7 | 0.29 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 12,7 | 29.2 | 44.3 | 0.41 | 0.99 | 0.286 | 0.287 | 0.998 | 0.477 | 990,842 | 76 by 52 |
| 2400 | 0.7 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 15,8 | 39.3 | 66.3 | 0.40 | 0.98 | 0.288 | 0.291 | 0.989 | 0.477 | 1234,750 | 72 by 88 |
| 2400 + 1/2 | 0.8 | 0.31 | 0.31 | 0.99 | 0.99 | 0.99 | 0.000 | 1.60 | 8,6 | 22.3 | 57.3 | 0.39 | 1.02 | 0.296 | 0.299 | 0.989 | 0.477 | 970,786 | 56 by 64 |
| 2401 | 1.1 | 0.32 | 0.32 | 1.00 | 1.00 | 1.00 | 0.000 | 1.89 | 8,6 | 10.0 | 32.1 | 0.38 | 1.02 | 0.311 | 0.310 | 1.001 | 0.477 | 966,778 | 52 by 68 |
| 2401 + 1/2 | 1.4 | 0.33 | 0.33 | 1.00 | 1.00 | 1.00 | 0.000 | 1.96 | 8,5 | 8.8 | 17.0 | 0.36 | 1.04 | 0.325 | 0.325 | 1.000 | 0.477 | 1238,630 | 64 by 52 |
| 2402 | 1.8 | 0.35 | 0.36 | 0.98 | 0.98 | 0.98 | 0.000 | 2.05 | 8,5 | 5.9 | 20.2 | 0.35 | 1.05 | 0.339 | 0.344 | 0.986 | 0.478 | 1258,634 | 160 by 120 |
| 2402 + 1/2 | 2.3 | 0.38 | 0.37 | 1.01 | 1.01 | 1.01 | 0.001 | 2.46 | 8,5 | 3.6 | 11.2 | 0.35 | 0.96 | 0.362 | 0.362 | 1.002 | 0.478 | 1266,626 | 144 by 120 |
| 2403 | 2.8 | 0.40 | 0.40 | 1.00 | 1.00 | 1.00 | 0.001 | 3.03 | 8,5 | 2.8 | 11.5 | 0.34 | 0.91 | 0.385 | 0.386 | 0.997 | 0.479 | 1270,618 | 72 by 60 |
| 2403 + 1/2 | 3.3 | 0.42 | 0.42 | 1.01 | 1.01 | 1.01 | 0.001 | 3.85 | 8,5 | 2.7 | 9.9 | 0.34 | 0.95 | 0.409 | 0.407 | 1.006 | 0.480 | 1294,626 | 76 by 64 |
| 2404 | 3.9 | 0.44 | 0.44 | 0.99 | 0.98 | 0.98 | 0.002 | 3.39 | 8,6 | 3.0 | 10.4 | 0.34 | 1.03 | 0.429 | 0.442 | 0.970 | 0.481 | 1306,622 | 68 by 64 |
| 2404 + 1/2 | 4.6 | 0.46 | 0.47 | 0.99 | 1.00 | 0.99 | 0.007 | 4.21 | 9,5 | 3.7 | 19.8 | 0.34 | 1.02 | 0.474 | 0.481 | 0.986 | 0.483 | 1050,666 | 132 by 196 |
| 2405 | 5.2 | 0.50 | 0.50 | 0.99 | 0.99 | 0.99 | 0.008 | 4.82 | 9,5 | 4.2 | 15.3 | 0.34 | 1.01 | 0.534 | 0.544 | 0.981 | 0.485 | 1066,670 | 88 by 184 |
| 2405 + 1/2 | 5.9 | 0.54 | 0.54 | 0.99 | 1.00 | 0.99 | 0.015 | 6.41 | 11,5 | 4.0 | 9.6 | 0.34 | 1.01 | 0.613 | 0.618 | 0.991 | 0.487 | 1242,598 | 240 by 124 |
| 2406 | 6.6 | 0.58 | 0.58 | 1.01 | 1.04 | 1.01 | 0.020 | 10.56 | 11,6 | 4.1 | 9.1 | 0.34 | 1.04 | 0.703 | 0.716 | 0.981 | 0.490 | 1346,754 | 76 by 172 |
| 2406 + 1/2 | 7.3 | 0.65 | 0.60 | 1.08 | 1.09 | 1.08 | 0.019 | 14.72 | 11,6 | 4.2 | 10.8 | 0.35 | 1.11 | 0.819 | 0.811 | 1.010 | 0.490 | 1386,750 | 84 by 168 |
| 2407 | 8.2 | 0.75 | 0.63 | 1.19 | 1.16 | 1.16 | 0.030 | 27.29 | 12,5 | 4.4 | 8.9 | 0.35 | 1.15 | 0.920 | 0.794 | 1.159 | 0.488 | 1430,742 | 100 by 176 |
| 2407 + 1/2 | 9.5 | 0.83 | 0.65 | 1.29 | 1.24 | 1.24 | 0.043 | 47.38 | 12,5 | 4.3 | 7.0 | 0.36 | 1.16 | 0.950 | 0.794 | 1.197 | 0.487 | 1478,734 | 84 by 176 |
| 2408 | 11.7 | 0.95 | 0.65 | 1.46 | 1.36 | 1.36 | 0.063 | 46.26 | 12,5 | 4.4 | 7.1 | 0.36 | 1.17 | 0.768 | 0.743 | 1.034 | 0.488 | 1486,650 | 104 by 204 |
| 2408 + 1/2 | 14.8 | 0.85 | 0.65 | 1.32 | 1.22 | 1.22 | 0.052 | 14.01 | 12,5 | 4.7 | 6.7 | 0.37 | 1.14 | 0.565 | 0.663 | 0.853 | 0.491 | 1246,646 | 96 by 148 |
| 2409 | 17.0 | 0.72 | 0.65 | 1.11 | 0.97 | 0.97 | 0.052 | 9.57 | 12,4 | 4.7 | 6.0 | 0.38 | 1.04 | 0.551 | 0.562 | 0.981 | 0.495 | 1290,634 | 112 by 244 |
| 2409 + 1/2 | 19.1 | 0.74 | 0.65 | 1.14 | 1.07 | 1.07 | 0.049 | 9.72 | 14,4 | 4.9 | 6.5 | 0.39 | 1.06 | 0.558 | 0.528 | 1.057 | 0.499 | 1330,646 | 72 by 192 |
| 2410 | 21.4 | 0.76 | 0.65 | 1.17 | 1.16 | 1.16 | 0.041 | 9.77 | 12,5 | 5.0 | 6.5 | 0.40 | 1.07 | 0.505 | 0.485 | 1.041 | 0.506 | 1402,622 | 96 by 204 |
| 2410 + 1/2 | 20.9 | 0.79 | 0.65 | 1.23 | 1.24 | 1.23 | 0.038 | 14.20 | 12,5 | 5.1 | 7.2 | 0.41 | 1.11 | 0.420 | 0.425 | 0.989 | 0.515 | 1446,674 | 72 by 268 |
| 2411 | 19.7 | 0.85 | 0.65 | 1.31 | 1.20 | 1.202 | 0.055 | 8.99 | 12,5 | 5.1 | 7.4 | 0.42 | 1.10 | 0.344 | 0.379 | 0.908 | 0.528 | 1522,614 | 52 by 160 |
| 2411 + 1/2 | 18.2 | 0.82 | 0.65 | 1.27 | 1.24 | 1.24 | 0.045 | 8.35 | 2,3 | 5.4 | 7.8 | 0.43 | 1.10 | 0.331 | 0.343 | 0.967 | 0.548 | 1022,638 | 80 by 100 |
| 2412 | 9.4 | 2.35 | 0.65 | 3.63 | 1.00 | 1.00 | 0.060 | 9.44 | 2,2 | 5.7 | 8.2 | 0.44 | 0.97 | 0.338 | 0.343 | 0.986 | 0.560 | 1002,30 | 76 by 32 |
| 2412 + 1/2 | 7.3 | 0.62 | 0.65 | 0.95 | 1.03 | 0.95 | 0.018 | 10.93 | 1,4 | 6.0 | 8.8 | 0.43 | 1.03 | 0.341 | 0.343 | 0.996 | 0.570 | 1030,30 | 64 by 36 |
| 2413 | 7.9 | 0.64 | 0.65 | 0.99 | 1.08 | 0.99 | 0.016 | 12.71 | 1,4 | 6.3 | 9.3 | 0.43 | 1.01 | 0.348 | 0.344 | 1.009 | 0.580 | 1130,706 | 112 by 124 |
| 2413 + 1/2 | 8.3 | 0.66 | 0.65 | 1.02 | 1.10 | 1.02 | 0.016 | 15.03 | 1,3 | 6.3 | 10.0 | 0.43 | 1.00 | 0.347 | 0.353 | 0.983 | 0.592 | 714,654 | 104 by 120 |
| 2414 | 9.1 | 0.70 | 0.65 | 1.08 | 1.10 | 1.08 | 0.026 | 16.52 | 1,3 | 6.5 | 11.4 | 0.42 | 1.01 | 0.375 | 0.353 | 1.060 | 0.604 | 1054,26 | 84 by 28 |
| 2414 + 1/2 | 9.7 | 0.67 | 0.65 | 1.04 | 1.05 | 1.04 | 0.027 | 17.10 | 1,3 | 6.5 | 12.3 | 0.42 | 0.99 | 0.359 | 0.358 | 1.003 | 0.615 | 1242,614 | 104 by 68 |
| 2415 | 10.4 | 0.69 | 0.64 | 1.08 | 1.04 | 1.04 | 0.037 | 16.99 | 1,3 | 6.4 | 11.6 | 0.41 | 0.98 | 0.360 | 0.358 | 1.004 | 0.628 | 1022,654 | 88 by 64 |
| 2415 + 1/2 | 11.2 | 0.65 | 0.64 | 1.02 | 1.00 | 1.00 | 0.050 | 14.47 | 1,3 | 6.9 | 12.1 | 0.40 | 0.99 | 0.357 | 0.356 | 1.003 | 0.641 | 1158,730 | 96 by 92 |
| 2416 | 11.8 | 0.65 | 0.63 | 1.03 | 1.03 | 1.03 | 0.024 | 11.21 | 1,3 | 7.2 | 10.8 | 0.39 | 1.02 | 0.352 | 0.353 | 0.999 | 0.655 | 702,570 | 76 by 56 |
| 2416 + 1/2 | 12.5 | 0.63 | 0.61 | 1.04 | 0.99 | 0.99 | 0.029 | 8.68 | 0,3 | 7.8 | 12.1 | 0.38 | 0.99 | 0.349 | 0.347 | 1.004 | 0.669 | 546,618 | 96 by 84 |
| 2417 | 13.2 | 0.60 | 0.60 | 1.00 | 1.01 | 1.00 | 0.032 | 8.77 | 0,3 | 8.1 | 12.8 | 0.37 | 0.98 | 0.342 | 0.345 | 0.989 | 0.684 | 546,614 | 100 by 124 |
| 2417 + 1/2 | 14.0 | 0.59 | 0.59 | 1.00 | 0.98 | 0.98 | 0.035 | 6.16 | 1,1 | 9.0 | 15.4 | 0.36 | 0.96 | 0.342 | 0.344 | 0.996 | 0.700 | 1038,658 | 76 by 72 |
| 2418 | 14.7 | 0.57 | 0.58 | 0.99 | 0.96 | 0.96 | 0.049 | 6.11 | 1,1 | 9.8 | 16.0 | 0.35 | 0.93 | 0.340 | 0.344 | 0.987 | 0.716 | 1026,578 | 72 by 76 |
| 2418 + 1/2 | 15.5 | 0.56 | 0.57 | 1.00 | 1.00 | 1.00 | 0.040 | 7.40 | 0,3 | 10.3 | 15.4 | 0.35 | 0.96 | 0.346 | 0.349 | 0.992 | 0.733 | 1094,578 | 56 by 56 |
| 2419 | 16.2 | 0.56 | 0.55 | 1.03 | 1.01 | 1.01 | 0.040 | 7.69 | 15,6 | 11.1 | 15.1 | 0.34 | 0.98 | 0.359 | 0.349 | 1.026 | 0.750 | 1030,662 | 80 by 96 |
| 2419 + 1/2 | 16.9 | 0.53 | 0.53 | 0.99 | 1.02 | 0.99 | 0.030 | 8.69 | 15,6 | 12.1 | 15.6 | 0.33 | 0.99 | 0.355 | 0.356 | 0.999 | 0.766 | 46,646 | 40 by 56 |
| 2420 | 17.8 | 0.51 | 0.51 | 0.99 | 1.02 | 0.99 | 0.030 | 8.31 | 15,6 | 12.2 | 14.8 | 0.32 | 1.01 | 0.353 | 0.362 | 0.975 | 0.779 | 1518,762 | 92 by 96 |
| 2420 + 1/2 | 18.4 | 0.49 | 0.48 | 1.04 | 1.03 | 1.03 | 0.027 | 7.98 | 15,5 | 10.9 | 13.0 | 0.31 | 1.00 | 0.366 | 0.361 | 1.013 | 0.793 | 998,646 | 120 by 100 |
| 2421 | 19.1 | 0.45 | 0.46 | 0.98 | 1.01 | 0.98 | 0.015 | 4.05 | 15,4 | 11.0 | 13.3 | 0.30 | 0.97 | 0.366 | 0.365 | 1.002 | 0.806 | 1118,586 | 64 by 52 |
| 2421 + 1/2 | 20.0 | 0.42 | 0.43 | 0.98 | 0.94 | 0.94 | 0.020 | 2.48 | 0,1 | 11.4 | 14.6 | 0.29 | 0.97 | 0.370 | 0.365 | 1.013 | 0.818 | 58,1014 | 32 by 128 |
| 2422 | 20.5 | 0.41 | 0.42 | 0.96 | 0.93 | 0.93 | 0.024 | 2.33 | 12,0 | 9.5 | 14.6 | 0.28 | 0.96 | 0.365 | 0.365 | 1.000 | 0.827 | 478,102 | 76 by 72 |
| 2422 + 1/2 | 21.2 | 0.41 | 0.42 | 0.96 | 0.90 | 0.90 | 0.027 | 2.31 | 12,0 | 6.0 | 14.8 | 0.28 | 0.98 | 0.364 | 0.367 | 0.990 | 0.835 | 1138,594 | 60 by 56 |
| 2423 | 21.8 | 0.41 | 0.42 | 0.96 | 0.93 | 0.93 | 0.015 | 3.54 | 0,0 | 4.1 | 10.1 | 0.27 | 1.00 | 0.363 | 0.368 | 0.988 | 0.842 | 174,322 | 80 by 96 |
| 2423 + 1/2 | 22.5 | 0.42 | 0.42 | 0.99 | 0.91 | 0.91 | 0.014 | 2.81 | 15,2 | 4.2 | 6.3 | 0.26 | 1.03 | 0.371 | 0.368 | 1.008 | 0.848 | 446,54 | 68 by 52 |
| 2424 | 23.2 | 0.42 | 0.42 | 0.99 | 0.95 | 0.95 | 0.011 | 2.58 | 13,0 | 4.0 | 5.0 | 0.25 | 1.04 | 0.372 | 0.373 | 0.998 | 0.853 | 1686,926 | 64 by 56 |
| 2424 + 1/2 | 23.8 | 0.42 | 0.42 | 0.98 | 0.95 | 0.95 | 0.012 | 2.46 | 13,0 | 4.2 | 5.0 | 0.24 | 1.02 | 0.375 | 0.377 | 0.993 | 0.858 | 110,278 | 80 by 92 |
| 2425 | 24.5 | 0.42 | 0.42 | 0.99 | 0.93 | 0.93 | 0.012 | 2.62 | 13,0 | 4.9 | 5.7 | 0.24 | 1.00 | 0.383 | 0.378 | 1.012 | 0.862 | 86,266 | 92 by 88 |
| 2425 + 1/2 | 25.1 | 0.41 | 0.42 | 0.97 | 0.94 | 0.94 | 0.006 | 2.56 | 14,0 | 5.5 | 6.5 | 0.23 | 0.99 | 0.383 | 0.382 | 1.003 | 0.866 | 70,238 | 72 by 76 |
| 2426 | 25.8 | 0.41 | 0.42 | 0.96 | 0.93 | 0.93 | 0.007 | 2.95 | 15,1 | 6.3 | 7.2 | 0.23 | 1.00 | 0.382 | 0.382 | 0.999 | 0.869 | 50,222 | 56 by 80 |
| 2426 + 1/2 | 26.4 | 0.40 | 0.42 | 0.94 | 0.94 | 0.94 | 0.003 | 3.16 | 14,0 | 7.2 | 8.2 | 0.23 | 0.99 | 0.382 | 0.380 | 1.004 | 0.870 | 54,178 | 56 by 60 |
| 2427 | 27.1 | 0.39 | 0.42 | 0.92 | 0.93 | 0.92 | 0.001 | 2.92 | 14,0 | 7.9 | 9.6 | 0.22 | 0.97 | 0.378 | 0.382 | 0.990 | 0.872 | 46,150 | 44 by 52 |
| 2427 + 1/2 | 27.7 | 0.38 | 0.42 | 0.90 | 0.91 | 0.90 | 0.001 | 3.43 | 15,0 | 8.6 | 9.0 | 0.22 | 0.96 | 0.374 | 0.382 | 0.980 | 0.872 | 1262,702 | 56 by 56 |
| 2428 | 28.4 | 0.39 | 0.42 | 0.91 | 0.93 | 0.91 | 0.000 | 3.44 | 15,0 | 9.8 | 10.3 | 0.22 | 0.95 | 0.382 | 0.384 | 0.993 | 0.872 | 1770,866 | 84 by 228 |
| 2428 + 1/2 | 29.1 | 0.40 | 0.42 | 0.93 | 0.95 | 0.93 | 0.000 | 3.84 | 15,0 | 10.7 | 12.0 | 0.21 | 0.95 | 0.391 | 0.389 | 1.006 | 0.871 | 1846,962 | 48 by 60 |
| 2429 | 29.6 | 0.40 | 0.42 | 0.94 | 0.95 | 0.94 | 0.000 | 2.96 | 15,0 | 11.9 | 12.7 | 0.21 | 0.94 | 0.396 | 0.401 | 0.987 | 0.871 | 1646,946 | 52 by 164 |
| 2429 + 1/2 | 30.3 | 0.41 | 0.42 | 0.97 | 1.00 | 0.97 | 0.000 | 1.64 | 15,0 | 12.9 | 13.4 | 0.21 | 0.93 | 0.411 | 0.410 | 1.001 | 0.870 | 1770,954 | 60 by 76 |
| 2430 | 30.8 | 0.42 | 0.43 | 0.98 | 0.99 | 0.98 | 0.001 | 1.47 | 4,4 | 13.5 | 14.3 | 0.21 | 0.95 | 0.425 | 0.427 | 0.994 | 0.870 | 1006,482 | 56 by 52 |
| 2430 + 1/2 | 31.2 | 0.44 | 0.44 | 1.00 | 1.00 | 1.00 | 0.001 | 1.35 | 4,4 | 14.1 | 14.9 | 0.21 | 0.93 | 0.444 | 0.445 | 0.998 | 0.868 | 562,602 | 52 by 60 |
| 2431 | 31.5 | 0.46 | 0.47 | 1.00 | 1.00 | 1.00 | 0.000 | 1.31 | 3,4 | 14.3 | 15.3 | 0.21 | 0.94 | 0.465 | 0.466 | 0.997 | 0.867 | 974,890 | 96 by 72 |
| 2431 + 1/2 | 32.1 | 0.49 | 0.49 | 1.00 | 1.01 | 1.00 | 0.000 | 1.29 | 8,7 | 14.6 | 16.2 | 0.21 | 0.92 | 0.488 | 0.486 | 1.005 | 0.865 | 1230,674 | 80 by 80 |
| 2432 | 32.3 | 0.51 | 0.51 | 0.99 | 0.99 | 0.99 | 0.001 | 1.25 | 7,4 | 14.8 | 16.9 | 0.21 | 0.94 | 0.508 | 0.513 | 0.989 | 0.865 | 1046,954 | 108 by 92 |
| 2432 + 1/2 | 32.6 | 0.54 | 0.53 | 1.01 | 1.01 | 1.01 | 0.000 | 1.35 | 8,8 | 15.4 | 16.9 | 0.21 | 0.95 | 0.538 | 0.532 | 1.011 | 0.863 | 1034,982 | 100 by 64 |
| 2433 | 32.8 | 0.56 | 0.56 | 0.99 | 0.99 | 0.99 | 0.000 | 1.44 | 0,1 | 15.7 | 17.0 | 0.21 | 0.97 | 0.556 | 0.562 | 0.990 | 0.863 | 1154,1026 | 84 by 32 |
| 2433 + 1/2 | 32.9 | 0.59 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.45 | 1,4 | 15.8 | 17.1 | 0.21 | 0.98 | 0.587 | 0.591 | 0.992 | 0.863 | 1106,1018 | 60 by 44 |
| 2434 | 33.0 | 0.63 | 0.62 | 1.01 | 1.01 | 1.01 | 0.000 | 1.87 | 1,3 | 16.3 | 17.6 | 0.21 | 1.00 | 0.626 | 0.621 | 1.008 | 0.862 | 1082,1026 | 52 by 32 |
| 2434 + 1/2 | 33.2 | 0.66 | 0.65 | 1.00 | 1.00 | 1.00 | 0.001 | 1.93 | 1,3 | 16.2 | 17.1 | 0.22 | 1.00 | 0.656 | 0.655 | 1.001 | 0.862 | 1182,898 | 60 by 60 |
| 2435 | 33.3 | 0.68 | 0.68 | 1.01 | 1.01 | 1.01 | 0.001 | 1.95 | 1,3 | 16.6 | 17.2 | 0.22 | 1.00 | 0.684 | 0.677 | 1.011 | 0.862 | 1014,1026 | 52 by 32 |
| 2435 + 1/2 | 33.2 | 0.70 | 0.71 | 0.99 | 0.99 | 0.99 | 0.001 | 2.00 | 1,3 | 16.7 | 18.1 | 0.22 | 0.99 | 0.697 | 0.706 | 0.988 | 0.862 | 950,870 | 100 by 80 |
| 2436 | 33.4 | 0.73 | 0.70 | 1.03 | 1.03 | 1.03 | 0.000 | 2.03 | 1,3 | 16.4 | 18.8 | 0.22 | 1.01 | 0.728 | 0.724 | 1.005 | 0.861 | 66,58 | 72 by 44 |
| 2436 + 1/2 | 33.3 | 0.75 | 0.71 | 1.06 | 1.06 | 1.06 | 0.001 | 2.19 | 7,8 | 16.2 | 17.8 | 0.22 | 0.99 | 0.751 | 0.754 | 0.997 | 0.861 | 970,1010 | 160 by 124 |
| 2437 | 33.2 | 0.78 | 0.71 | 1.10 | 1.10 | 1.10 | 0.001 | 2.67 | 7,8 | 15.9 | 17.5 | 0.23 | 1.00 | 0.779 | 0.780 | 0.999 | 0.862 | 862,1014 | 108 by 68 |
| 2437 + 1/2 | 33.0 | 0.81 | 0.71 | 1.15 | 1.14 | 1.14 | 0.004 | 2.03 | 7,8 | 15.3 | 16.4 | 0.23 | 1.00 | 0.810 | 0.800 | 1.013 | 0.864 | 818,1022 | 208 by 204 |
| 2438 | 33.1 | 0.82 | 0.71 | 1.16 | 1.16 | 1.16 | 0.000 | 2.33 | 8,4 | 15.0 | 17.4 | 0.23 | 1.00 | 0.820 | 0.825 | 0.994 | 0.862 | 590,554 | 104 by 88 |
| 2438 + 1/2 | 32.9 | 0.84 | 0.71 | 1.18 | 1.18 | 1.18 | 0.001 | 3.12 | 8,4 | 15.0 | 17.5 | 0.23 | 1.00 | 0.840 | 0.832 | 1.010 | 0.864 | 570,542 | 112 by 92 |
| 2439 | 33.0 | 0.85 | 0.71 | 1.19 | 1.19 | 1.19 | 0.001 | 3.09 | 8,4 | 15.6 | 20.9 | 0.24 | 1.01 | 0.846 | 0.834 | 1.015 | 0.863 | 546,538 | 104 by 80 |
| 2439 + 1/2 | 33.1 | 0.84 | 0.72 | 1.18 | 1.18 | 1.18 | 0.000 | 2.72 | 8,4 | 15.3 | 17.5 | 0.24 | 1.00 | 0.844 | 0.834 | 1.013 | 0.862 | 526,530 | 108 by 80 |
| 2440 | 32.7 | 0.83 | 0.72 | 1.15 | 1.15 | 1.15 | 0.000 | 2.07 | 4,4 | 15.2 | 16.9 | 0.24 | 0.99 | 0.827 | 0.827 | 0.999 | 0.863 | 490,530 | 100 by 68 |
| 2440 + 1/2 | 33.0 | 0.81 | 0.72 | 1.12 | 1.12 | 1.12 | 0.000 | 1.73 | 10,1 | 15.2 | 16.7 | 0.24 | 1.00 | 0.811 | 0.809 | 1.002 | 0.862 | 446,534 | 156 by 128 |
| 2441 | 33.0 | 0.79 | 0.72 | 1.10 | 1.10 | 1.10 | 0.000 | 1.90 | 10,0 | 14.9 | 16.0 | 0.25 | 0.99 | 0.792 | 0.795 | 0.996 | 0.863 | 1238,54 | 108 by 72 |
| 2441 + 1/2 | 32.7 | 0.78 | 0.72 | 1.08 | 1.08 | 1.08 | 0.000 | 1.78 | 10,0 | 14.8 | 16.2 | 0.25 | 1.00 | 0.779 | 0.779 | 1.001 | 0.864 | 490,486 | 72 by 44 |
| 2442 | 32.5 | 0.77 | 0.73 | 1.05 | 1.05 | 1.05 | 0.000 | 1.62 | 10,0 | 15.0 | 16.2 | 0.26 | 1.00 | 0.766 | 0.767 | 0.998 | 0.865 | 310,962 | 128 by 220 |
| 2442 + 1/2 | 32.5 | 0.76 | 0.73 | 1.03 | 1.03 | 1.03 | 0.001 | 1.49 | 11,0 | 15.1 | 17.1 | 0.26 | 1.00 | 0.755 | 0.753 | 1.003 | 0.864 | 70,566 | 40 by 92 |
| 2443 | 32.5 | 0.74 | 0.74 | 1.00 | 0.99 | 0.99 | 0.003 | 1.43 | 14,3 | 15.2 | 16.5 | 0.26 | 1.00 | 0.740 | 0.742 | 0.997 | 0.866 | 1834,862 | 36 by 60 |
| 2443 + 1/2 | 32.5 | 0.73 | 0.75 | 0.97 | 0.97 | 0.97 | 0.001 | 1.32 | 14,3 | 15.8 | 18.2 | 0.27 | 1.00 | 0.728 | 0.726 | 1.003 | 0.866 | 402,438 | 60 by 48 |
| 2444 | 32.7 | 0.71 | 0.75 | 0.95 | 0.94 | 0.94 | 0.002 | 1.25 | 14,3 | 15.3 | 17.0 | 0.27 | 0.99 | 0.713 | 0.715 | 0.997 | 0.865 | 374,426 | 176 by 76 |
| 2444 + 1/2 | 32.6 | 0.70 | 0.76 | 0.92 | 0.92 | 0.92 | 0.000 | 1.23 | 11,6 | 15.8 | 17.9 | 0.28 | 0.99 | 0.701 | 0.704 | 0.995 | 0.865 | 270,426 | 164 by 68 |
| 2445 | 32.4 | 0.70 | 0.77 | 0.90 | 0.90 | 0.90 | 0.000 | 1.25 | 2,3 | 16.1 | 17.9 | 0.28 | 1.01 | 0.696 | 0.702 | 0.991 | 0.865 | 246,410 | 164 by 68 |
| 2445 + 1/2 | 32.3 | 0.69 | 0.77 | 0.89 | 0.89 | 0.89 | 0.001 | 1.28 | 1,3 | 16.5 | 18.9 | 0.29 | 0.98 | 0.687 | 0.702 | 0.979 | 0.866 | 214,394 | 88 by 52 |
| 2446 | 32.4 | 0.70 | 0.77 | 0.91 | 0.91 | 0.91 | 0.000 | 1.25 | 1,3 | 16.5 | 19.3 | 0.29 | 1.01 | 0.703 | 0.702 | 1.001 | 0.867 | 178,378 | 72 by 56 |
| 2446 + 1/2 | 32.2 | 0.71 | 0.77 | 0.92 | 0.92 | 0.92 | 0.000 | 1.24 | 9,8 | 16.3 | 18.1 | 0.30 | 1.00 | 0.709 | 0.708 | 1.002 | 0.867 | 154,362 | 60 by 52 |
| 2447 | 32.2 | 0.71 | 0.77 | 0.93 | 0.93 | 0.93 | 0.000 | 1.38 | 1,2 | 17.3 | 19.9 | 0.30 | 1.00 | 0.713 | 0.715 | 0.998 | 0.867 | 134,342 | 76 by 52 |
| 2447 + 1/2 | 32.1 | 0.72 | 0.77 | 0.93 | 0.93 | 0.93 | 0.000 | 1.61 | 0,2 | 17.6 | 20.1 | 0.31 | 1.00 | 0.720 | 0.717 | 1.005 | 0.868 | 106,326 | 68 by 56 |
| 2448 | 32.2 | 0.72 | 0.77 | 0.94 | 0.94 | 0.94 | 0.000 | 1.70 | 0,2 | 17.7 | 20.1 | 0.32 | 1.00 | 0.721 | 0.720 | 1.002 | 0.868 | 1066,990 | 52 by 48 |
| 2448 + 1/2 | 32.0 | 0.72 | 0.77 | 0.93 | 0.93 | 0.93 | 0.000 | 1.79 | 0,2 | 19.0 | 22.0 | 0.32 | 1.00 | 0.720 | 0.721 | 0.998 | 0.868 | 78,282 | 68 by 48 |
| 2449 | 32.0 | 0.72 | 0.77 | 0.94 | 0.94 | 0.94 | 0.000 | 1.60 | 0,2 | 19.9 | 25.1 | 0.33 | 1.00 | 0.721 | 0.728 | 0.990 | 0.869 | 66,262 | 168 by 52 |
| 2449 + 1/2 | 32.0 | 0.74 | 0.77 | 0.95 | 0.95 | 0.95 | 0.000 | 1.27 | 2,1 | 21.1 | 26.3 | 0.34 | 1.00 | 0.735 | 0.737 | 0.998 | 0.870 | 346,726 | 56 by 60 |
| 2450 | 31.7 | 0.75 | 0.77 | 0.98 | 0.98 | 0.98 | 0.000 | 1.47 | 0,1 | 21.7 | 27.6 | 0.35 | 1.00 | 0.752 | 0.755 | 0.996 | 0.871 | 570,950 | 64 by 64 |
| 2450 + 1/2 | 31.9 | 0.78 | 0.78 | 1.00 | 1.00 | 1.00 | 0.000 | 1.50 | 2,1 | 22.4 | 29.2 | 0.35 | 1.00 | 0.776 | 0.774 | 1.002 | 0.872 | 62,190 | 156 by 60 |
| 2451 | 31.7 | 0.80 | 0.80 | 1.00 | 1.00 | 1.00 | 0.000 | 1.62 | 2,1 | 22.9 | 30.2 | 0.36 | 1.00 | 0.796 | 0.798 | 0.998 | 0.872 | 1370,974 | 84 by 72 |
| 2451 + 1/2 | 31.5 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.55 | 2,1 | 23.8 | 31.6 | 0.37 | 1.00 | 0.820 | 0.823 | 0.996 | 0.873 | 90,822 | 40 by 92 |
| 2452 | 31.3 | 0.85 | 0.84 | 1.01 | 1.01 | 1.01 | 0.000 | 1.56 | 3,1 | 24.8 | 32.4 | 0.38 | 1.01 | 0.851 | 0.845 | 1.007 | 0.875 | 1834,998 | 96 by 108 |
| 2452 + 1/2 | 31.3 | 0.87 | 0.88 | 0.99 | 0.99 | 0.99 | 0.000 | 1.50 | 8,0 | 25.7 | 31.6 | 0.39 | 1.02 | 0.869 | 0.876 | 0.992 | 0.875 | 122,1026 | 68 by 60 |
| 2453 | 31.1 | 0.90 | 0.90 | 1.00 | 1.00 | 1.00 | 0.001 | 1.58 | 9,0 | 26.4 | 30.7 | 0.39 | 1.01 | 0.902 | 0.902 | 1.000 | 0.876 | 86,834 | 40 by 48 |
| 2453 + 1/2 | 31.1 | 0.93 | 0.94 | 0.99 | 1.00 | 0.99 | 0.000 | 1.68 | 8,0 | 26.8 | 29.7 | 0.40 | 1.00 | 0.934 | 0.939 | 0.994 | 0.877 | 1002,586 | 60 by 52 |
| 2454 | 31.0 | 0.98 | 0.97 | 1.01 | 1.00 | 1.00 | 0.000 | 1.70 | 10,0 | 27.5 | 29.1 | 0.41 | 1.02 | 0.977 | 0.970 | 1.007 | 0.878 | 102,954 | 40 by 84 |
| 2454 + 1/2 | 30.9 | 1.01 | 1.01 | 1.00 | 1.00 | 1.00 | 0.000 | 1.85 | 10,0 | 28.6 | 30.2 | 0.42 | 1.01 | 1.007 | 1.012 | 0.995 | 0.880 | 1010,602 | 60 by 48 |
| 2455 | 30.8 | 1.05 | 1.04 | 1.01 | 1.01 | 1.01 | 0.000 | 1.94 | 10,0 | 29.3 | 30.6 | 0.42 | 1.03 | 1.047 | 1.040 | 1.006 | 0.881 | 1010,610 | 64 by 52 |
| 2455 + 1/2 | 30.8 | 1.07 | 1.08 | 0.99 | 0.99 | 0.99 | 0.000 | 1.93 | 10,0 | 29.7 | 31.3 | 0.42 | 0.99 | 1.073 | 1.082 | 0.992 | 0.882 | 1010,622 | 64 by 48 |
| 2456 | 30.4 | 1.12 | 1.12 | 1.00 | 1.00 | 1.00 | 0.000 | 1.92 | 10,0 | 30.1 | 32.0 | 0.43 | 0.99 | 1.118 | 1.120 | 0.998 | 0.884 | 1014,626 | 80 by 52 |
| 2456 + 1/2 | 29.8 | 1.17 | 1.16 | 1.01 | 1.00 | 1.00 | 0.001 | 1.86 | 10,0 | 30.6 | 33.0 | 0.43 | 0.99 | 1.166 | 1.160 | 1.005 | 0.886 | 126,1034 | 72 by 44 |
| 2457 | 29.6 | 1.20 | 1.21 | 0.99 | 1.00 | 0.99 | 0.001 | 1.60 | 10,0 | 30.6 | 31.7 | 0.44 | 0.99 | 1.202 | 1.212 | 0.992 | 0.889 | 1838,954 | 24 by 48 |
| 2457 + 1/2 | 29.7 | 1.26 | 1.26 | 1.00 | 1.00 | 1.00 | 0.001 | 1.43 | 11,0 | 30.4 | 33.5 | 0.44 | 0.98 | 1.258 | 1.263 | 0.996 | 0.889 | 722,418 | 56 by 56 |
| 2458 | 29.4 | 1.32 | 1.31 | 1.01 | 1.02 | 1.01 | 0.005 | 1.51 | 8,3 | 32.9 | 45.6 | 0.45 | 0.98 | 1.323 | 1.337 | 0.990 | 0.890 | 710,414 | 52 by 48 |
| 2458 + 1/2 | 28.8 | 1.42 | 1.35 | 1.05 | 1.07 | 1.05 | 0.006 | 2.09 | 8,3 | 43.1 | 56.9 | 0.45 | 1.00 | 1.417 | 1.423 | 0.996 | 0.893 | 1738,802 | 60 by 84 |
| 2459 | 28.4 | 1.52 | 1.38 | 1.10 | 1.13 | 1.10 | 0.006 | 2.61 | 8,3 | 52.3 | 65.4 | 0.45 | 1.03 | 1.522 | 1.532 | 0.993 | 0.893 | 874,502 | 60 by 56 |
| 2459 + 1/2 | 28.1 | 1.65 | 1.41 | 1.17 | 1.20 | 1.17 | 0.009 | 3.31 | 8,3 | 57.9 | 71.3 | 0.45 | 1.04 | 1.648 | 1.663 | 0.991 | 0.892 | 442,554 | 88 by 60 |
| 2460 | 27.8 | 1.80 | 1.44 | 1.25 | 1.29 | 1.25 | 0.013 | 4.10 | 8,3 | 63.0 | 73.2 | 0.45 | 1.07 | 1.805 | 1.763 | 1.024 | 0.891 | 874,502 | 60 by 92 |
| 2460 + 1/2 | 27.5 | 1.92 | 1.47 | 1.30 | 1.35 | 1.30 | 0.011 | 4.73 | 8,3 | 60.2 | 76.0 | 0.46 | 1.10 | 1.922 | 1.789 | 1.074 | 0.890 | 1378,938 | 104 by 100 |
| 2461 | 26.4 | 1.87 | 1.47 | 1.27 | 1.30 | 1.27 | 0.022 | 4.53 | 8,3 | 64.1 | 80.0 | 0.46 | 1.07 | 1.878 | 1.789 | 1.050 | 0.894 | 910,6 | 68 by 24 |
| 2461 + 1/2 | 25.9 | 1.77 | 1.47 | 1.20 | 1.22 | 1.198 | 0.015 | 4.18 | 8,3 | 64.8 | 83.6 | 0.46 | 1.03 | 1.774 | 1.773 | 1.000 | 0.887 | 1002,6 | 68 by 24 |
| 2462 | 25.1 | 1.66 | 1.49 | 1.11 | 1.13 | 1.11 | 0.015 | 3.57 | 8,3 | 70.3 | 81.8 | 0.47 | 1.00 | 1.669 | 1.675 | 0.996 | 0.881 | 390,6 | 80 by 28 |
| 2462 + 1/2 | 24.8 | 1.57 | 1.52 | 1.03 | 1.04 | 1.03 | 0.025 | 3.06 | 8,3 | 66.4 | 73.0 | 0.47 | 0.97 | 1.576 | 1.571 | 1.003 | 0.870 | 858,514 | 76 by 60 |
| 2463 | 24.2 | 1.48 | 1.53 | 0.96 | 0.97 | 0.96 | 0.023 | 2.47 | 8,3 | 67.7 | 78.9 | 0.47 | 0.94 | 1.474 | 1.478 | 0.997 | 0.864 | 978,702 | 116 by 52 |
| 2463 + 1/2 | 23.7 | 1.40 | 1.54 | 0.91 | 0.90 | 0.90 | 0.028 | 2.08 | 8,3 | 70.7 | 83.8 | 0.47 | 0.92 | 1.381 | 1.439 | 0.960 | 0.856 | 1226,906 | 60 by 68 |
| 2464 | 23.2 | 1.37 | 1.55 | 0.88 | 0.87 | 0.87 | 0.032 | 2.83 | 9,0 | 64.8 | 85.9 | 0.47 | 0.92 | 1.339 | 1.439 | 0.931 | 0.850 | 1122,66 | 176 by 28 |
| 2464 + 1/2 | 22.5 | 1.47 | 1.56 | 0.95 | 0.93 | 0.93 | 0.030 | 5.62 | 9,0 | 67.8 | 89.0 | 0.47 | 0.96 | 1.403 | 1.430 | 0.981 | 0.845 | 1138,90 | 232 by 60 |
| 2465 | 22.1 | 1.60 | 1.54 | 1.04 | 0.98 | 0.98 | 0.044 | 6.15 | 10,1 | 73.3 | 81.5 | 0.47 | 0.99 | 1.479 | 1.444 | 1.024 | 0.838 | 1258,106 | 296 by 76 |
| 2465 + 1/2 | 21.6 | 1.63 | 1.54 | 1.05 | 1.02 | 1.02 | 0.036 | 7.02 | 10,1 | 83.5 | 94.6 | 0.48 | 1.02 | 1.494 | 1.468 | 1.018 | 0.832 | 1270,118 | 252 by 84 |
| 2466 | 21.0 | 1.62 | 1.54 | 1.05 | 1.04 | 1.04 | 0.019 | 7.09 | 11,1 | 77.7 | 86.0 | 0.48 | 1.05 | 1.485 | 1.468 | 1.012 | 0.826 | 1342,142 | 216 by 100 |
| 2466 + 1/2 | 20.3 | 1.57 | 1.54 | 1.02 | 1.02 | 1.02 | 0.016 | 7.30 | 11,1 | 82.7 | 90.9 | 0.48 | 1.06 | 1.457 | 1.445 | 1.008 | 0.822 | 734,102 | 256 by 96 |
| 2467 | 20.0 | 1.54 | 1.56 | 0.99 | 0.91 | 0.91 | 0.045 | 6.60 | 11,1 | 86.9 | 92.6 | 0.49 | 0.99 | 1.405 | 1.401 | 1.003 | 0.816 | 750,118 | 96 by 48 |
| 2467 + 1/2 | 19.5 | 1.54 | 1.56 | 0.99 | 0.97 | 0.97 | 0.020 | 5.85 | 11,1 | 81.0 | 86.5 | 0.49 | 1.07 | 1.344 | 1.358 | 0.990 | 0.810 | 514,158 | 128 by 100 |
| 2468 | 19.2 | 1.53 | 1.54 | 0.99 | 1.01 | 0.99 | 0.008 | 5.11 | 11,1 | 88.5 | 94.8 | 0.50 | 1.05 | 1.311 | 1.343 | 0.976 | 0.804 | 1054,958 | 100 by 64 |
| 2468 + 1/2 | 18.5 | 1.47 | 1.54 | 0.96 | 0.98 | 0.96 | 0.004 | 4.28 | 4,1 | 90.7 | 98.0 | 0.50 | 1.01 | 1.295 | 1.343 | 0.964 | 0.799 | 1058,974 | 136 by 80 |
| 2469 | 17.9 | 1.42 | 1.53 | 0.93 | 0.95 | 0.93 | 0.006 | 4.31 | 4,1 | 89.8 | 97.1 | 0.51 | 0.98 | 1.342 | 1.414 | 0.950 | 0.795 | 1002,1018 | 160 by 92 |
| 2469 + 1/2 | 17.2 | 1.51 | 1.50 | 1.01 | 1.04 | 1.01 | 0.001 | 6.91 | 13,2 | 80.5 | 89.1 | 0.51 | 1.01 | 1.516 | 1.544 | 0.982 | 0.789 | 1030,1014 | 160 by 80 |
| 2470 | 16.5 | 1.75 | 1.47 | 1.19 | 1.21 | 1.19 | 0.002 | 11.82 | 13,2 | 73.3 | 80.8 | 0.52 | 1.07 | 1.745 | 1.693 | 1.031 | 0.784 | 1814,226 | 192 by 104 |
| 2470 + 1/2 | 15.8 | 1.91 | 1.47 | 1.29 | 1.28 | 1.28 | 0.011 | 14.10 | 13,2 | 70.8 | 81.5 | 0.52 | 1.11 | 1.869 | 1.812 | 1.031 | 0.780 | 1850,242 | 292 by 120 |
| 2471 | 15.2 | 1.94 | 1.45 | 1.34 | 1.34 | 1.34 | 0.007 | 15.02 | 13,2 | 58.9 | 70.6 | 0.53 | 1.14 | 1.908 | 1.828 | 1.044 | 0.777 | 1686,230 | 312 by 136 |
| 2471 + 1/2 | 14.6 | 1.87 | 1.41 | 1.33 | 1.33 | 1.33 | 0.006 | 15.10 | 14,2 | 45.5 | 55.7 | 0.53 | 1.13 | 1.879 | 1.828 | 1.028 | 0.774 | 514,526 | 204 by 148 |
| 2472 | 13.9 | 1.72 | 1.40 | 1.23 | 1.25 | 1.23 | 0.003 | 13.95 | 14,2 | 34.5 | 42.3 | 0.54 | 1.07 | 1.786 | 1.770 | 1.009 | 0.770 | 298,998 | 164 by 128 |
| 2472 + 1/2 | 13.2 | 1.55 | 1.39 | 1.11 | 1.12 | 1.11 | 0.005 | 11.89 | 14,2 | 26.4 | 32.1 | 0.55 | 1.01 | 1.660 | 1.644 | 1.010 | 0.768 | 118,554 | 72 by 64 |
| 2473 | 12.6 | 1.36 | 1.30 | 1.04 | 1.06 | 1.04 | 0.003 | 10.06 | 14,2 | 21.5 | 25.7 | 0.55 | 1.00 | 1.502 | 1.498 | 1.003 | 0.764 | 1094,314 | 68 by 60 |
| 2473 + 1/2 | 12.0 | 1.19 | 1.20 | 0.99 | 1.00 | 0.99 | 0.003 | 7.98 | 14,2 | 16.7 | 21.0 | 0.56 | 1.00 | 1.335 | 1.333 | 1.001 | 0.762 | 182,1030 | 148 by 144 |
| 2474 | 11.4 | 1.03 | 1.04 | 1.00 | 0.98 | 0.98 | 0.019 | 6.16 | 14,2 | 12.7 | 16.8 | 0.57 | 0.99 | 1.164 | 1.165 | 0.999 | 0.760 | 98,990 | 120 by 124 |
| 2474 + 1/2 | 10.8 | 0.88 | 0.89 | 0.99 | 1.00 | 0.99 | 0.012 | 4.67 | 14,2 | 9.7 | 12.7 | 0.58 | 1.00 | 0.996 | 1.001 | 0.995 | 0.758 | 110,1034 | 84 by 80 |
| 2475 | 10.3 | 0.75 | 0.75 | 1.00 | 1.00 | 1.00 | 0.016 | 3.25 | 14,2 | 6.7 | 9.2 | 0.58 | 1.00 | 0.838 | 0.837 | 1.001 | 0.755 | 102,566 | 100 by 68 |
| 2475 + 1/2 | 9.8 | 0.61 | 0.62 | 0.99 | 0.98 | 0.98 | 0.017 | 2.75 | 4,4 | 4.2 | 5.9 | 0.59 | 1.00 | 0.679 | 0.686 | 0.990 | 0.752 | 122,550 | 72 by 76 |
| 2476 | 9.3 | 0.49 | 0.50 | 0.97 | 0.98 | 0.97 | 0.010 | 2.01 | 4,4 | 2.3 | 5.1 | 0.60 | 0.99 | 0.533 | 0.548 | 0.972 | 0.749 | 130,550 | 60 by 68 |
| 2476 + 1/2 | 8.8 | 0.40 | 0.42 | 0.94 | 0.93 | 0.93 | 0.015 | 1.31 | 4,4 | 1.6 | 4.6 | 0.61 | 1.00 | 0.418 | 0.452 | 0.926 | 0.747 | 54,458 | 104 by 48 |
| 2477 | 8.4 | 0.35 | 0.37 | 0.95 | 0.95 | 0.95 | 0.012 | 1.10 | 5,1 | 1.5 | 4.5 | 0.62 | 0.99 | 0.370 | 0.392 | 0.944 | 0.745 | 618,402 | 64 by 56 |
| 2477 + 1/2 | 7.9 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.015 | 1.12 | 0,8 | 1.4 | 3.9 | 0.63 | 1.00 | 0.366 | 0.367 | 0.996 | 0.744 | 54,934 | 56 by 60 |
| 2478 | 7.4 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.010 | 1.31 | 0,8 | 1.4 | 3.6 | 0.64 | 1.00 | 0.364 | 0.362 | 1.007 | 0.742 | 210,446 | 80 by 56 |
| 2478 + 1/2 | 7.0 | 0.34 | 0.34 | 1.00 | 1.00 | 1.00 | 0.010 | 1.16 | 0,8 | 1.3 | 3.3 | 0.65 | 1.00 | 0.357 | 0.357 | 1.001 | 0.740 | 526,402 | 56 by 52 |
| 2479 | 6.5 | 0.34 | 0.34 | 1.00 | 1.00 | 1.00 | 0.006 | 1.18 | 1,2 | 1.2 | 3.0 | 0.66 | 0.99 | 0.350 | 0.350 | 1.001 | 0.737 | 734,722 | 60 by 64 |
| 2479 + 1/2 | 6.1 | 0.33 | 0.33 | 0.99 | 1.00 | 0.99 | 0.001 | 1.13 | 3,0 | 1.2 | 2.8 | 0.66 | 1.00 | 0.343 | 0.345 | 0.994 | 0.736 | 634,342 | 108 by 80 |
| 2480 | 5.6 | 0.32 | 0.32 | 1.00 | 1.00 | 1.00 | 0.004 | 1.20 | 13,0 | 1.1 | 2.5 | 0.67 | 1.00 | 0.339 | 0.339 | 1.001 | 0.734 | 170,430 | 64 by 64 |
| 2480 + 1/2 | 5.2 | 0.32 | 0.32 | 1.00 | 1.00 | 1.00 | 0.001 | 1.18 | 6,8 | 1.1 | 2.3 | 0.68 | 1.00 | 0.335 | 0.334 | 1.001 | 0.733 | 822,994 | 72 by 60 |
| 2481 | 4.7 | 0.32 | 0.32 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 13,3 | 1.0 | 2.1 | 0.69 | 1.00 | 0.329 | 0.329 | 1.001 | 0.732 | 706,558 | 60 by 60 |
| 2481 + 1/2 | 4.3 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 12,2 | 1.0 | 1.7 | 0.70 | 1.00 | 0.323 | 0.325 | 0.995 | 0.732 | 886,710 | 68 by 68 |
| 2482 | 3.8 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 1,0 | 0.9 | 1.6 | 0.70 | 1.00 | 0.321 | 0.320 | 1.004 | 0.735 | 806,1010 | 104 by 64 |
| 2482 + 1/2 | 3.3 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 2,0 | 0.9 | 1.5 | 0.71 | 1.01 | 0.316 | 0.316 | 1.000 | 0.740 | 570,366 | 84 by 80 |
| 2483 | 3.0 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 4,6 | 0.8 | 1.2 | 0.71 | 1.00 | 0.311 | 0.311 | 0.998 | 0.743 | 578,742 | 68 by 64 |
| 2483 + 1/2 | 2.6 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 11,2 | 0.8 | 1.1 | 0.72 | 1.00 | 0.307 | 0.308 | 0.994 | 0.745 | 814,458 | 84 by 80 |
| 2484 | 2.3 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 5,2 | 0.8 | 1.2 | 0.72 | 1.01 | 0.306 | 0.304 | 1.006 | 0.748 | 802,1034 | 76 by 64 |
| 2484 + 1/2 | 2.0 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.25 | 7,2 | 0.8 | 1.1 | 0.73 | 1.00 | 0.302 | 0.303 | 0.997 | 0.749 | 902,286 | 192 by 128 |
| 2485 | 1.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.28 | 9,2 | 0.8 | 1.1 | 0.73 | 1.00 | 0.299 | 0.299 | 0.999 | 0.748 | 1130,294 | 104 by 88 |
| 2485 + 1/2 | 1.4 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 9,2 | 0.8 | 1.1 | 0.74 | 1.00 | 0.297 | 0.297 | 1.001 | 0.748 | 686,614 | 96 by 72 |
| 2486 | 1.2 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 9,2 | 0.7 | 1.1 | 0.74 | 1.00 | 0.295 | 0.295 | 1.002 | 0.749 | 838,494 | 56 by 76 |
| 2486 + 1/2 | 1.0 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 11,5 | 0.7 | 1.1 | 0.74 | 1.00 | 0.292 | 0.292 | 1.000 | 0.750 | 850,578 | 116 by 128 |
| 2487 | 0.9 | 0.28 | 0.28 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 4,8 | 0.8 | 1.1 | 0.74 | 0.99 | 0.289 | 0.290 | 0.997 | 0.750 | 722,734 | 132 by 108 |
| 2487 + 1/2 | 0.7 | 0.28 | 0.28 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 4,8 | 0.7 | 1.1 | 0.74 | 0.99 | 0.287 | 0.289 | 0.993 | 0.750 | 846,502 | 44 by 64 |
| 2488 | 0.7 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 13,7 | 0.7 | 1.1 | 0.74 | 0.99 | 0.288 | 0.289 | 0.997 | 0.750 | 662,538 | 68 by 72 |
| 2488 + 1/2 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.05 | 11,6 | 0.7 | 1.1 | 0.74 | 0.98 | 0.289 | 0.289 | 1.002 | 0.750 | 806,502 | 52 by 48 |
| 2489 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 7,4 | 0.7 | 1.1 | 0.74 | 0.98 | 0.289 | 0.289 | 1.001 | 0.750 | 850,510 | 116 by 136 |
| 2489 + 1/2 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 3,2 | 0.8 | 1.1 | 0.74 | 0.98 | 0.289 | 0.289 | 1.001 | 0.750 | 834,590 | 116 by 100 |
| 2490 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 11,3 | 0.7 | 1.1 | 0.74 | 0.99 | 0.288 | 0.289 | 0.997 | 0.750 | 822,586 | 136 by 120 |
| 2490 + 1/2 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 7,4 | 0.7 | 1.2 | 0.74 | 0.98 | 0.289 | 0.289 | 1.000 | 0.750 | 838,514 | 64 by 68 |
| 2491 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 5,4 | 0.8 | 1.2 | 0.74 | 0.99 | 0.290 | 0.289 | 1.005 | 0.750 | 670,582 | 80 by 96 |
| 2491 + 1/2 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 0,2 | 0.7 | 1.1 | 0.74 | 0.98 | 0.288 | 0.289 | 0.997 | 0.750 | 826,594 | 124 by 116 |
| 2492 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 11,8 | 0.8 | 1.1 | 0.74 | 0.98 | 0.289 | 0.288 | 1.004 | 0.750 | 842,506 | 60 by 76 |
| 2492 + 1/2 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 1,6 | 0.8 | 1.2 | 0.74 | 0.99 | 0.287 | 0.288 | 0.997 | 0.750 | 818,490 | 56 by 60 |
| 2493 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 8,1 | 0.7 | 1.1 | 0.74 | 1.00 | 0.287 | 0.289 | 0.993 | 0.750 | 862,618 | 88 by 144 |
| 2493 + 1/2 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 15,3 | 0.7 | 1.2 | 0.74 | 1.00 | 0.289 | 0.288 | 1.005 | 0.750 | 826,582 | 72 by 116 |
| 2494 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 11,1 |  |  |  | 1.00 | 0.289 | 0.288 | 1.003 | 0.750 | 926,662 | 72 by 72 |
| 2494 + 1/2 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 12,0 |  |  |  | 0.99 | 0.288 | 0.289 | 0.998 | 0.750 | 802,642 | 132 by 72 |
| 2495 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 8,4 |  |  |  | 0.99 | 0.288 | 0.288 | 1.000 | 0.750 | 838,582 | 56 by 128 |
| 2495 + 1/2 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 1,3 |  |  |  | 1.00 | 0.288 | 0.288 | 1.001 | 0.750 | 910,726 | 148 by 84 |
| 2496 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 0,4 |  |  |  | 1.00 | 0.288 | 0.288 | 0.998 | 0.750 | 930,682 | 64 by 56 |
| 2496 + 1/2 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 4,1 |  |  |  | 1.00 | 0.287 | 0.288 | 0.996 | 0.750 | 834,514 | 56 by 48 |
| 2497 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 15,0 |  |  |  | 1.00 | 0.288 | 0.288 | 0.999 | 0.750 | 774,602 | 88 by 232 |
| 2497 + 1/2 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 8,0 |  |  |  | 1.00 | 0.290 | 0.288 | 1.006 | 0.750 | 658,606 | 72 by 64 |
| 2498 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 7,1 |  |  |  | 1.01 | 0.289 | 0.288 | 1.003 | 0.750 | 922,658 | 108 by 124 |
| 2498 + 1/2 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 7,4 |  |  |  | 1.00 | 0.288 | 0.288 | 1.001 | 0.750 | 854,554 | 80 by 68 |
| 2499 | 0.6 | 0.28 | 0.28 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 10,6 |  |  |  | 0.99 | 0.287 | 0.288 | 0.998 | 0.750 | 846,582 | 88 by 152 |
| 2499 + 1/2 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 10,0 |  |  |  | 1.00 | 0.287 | 0.288 | 0.999 | 0.750 | 626,338 | 88 by 132 |
| 2500 | 0.6 | 0.28 | 0.28 | 0.99 | 0.99 | 0.99 | 0.000 | 1.06 | 6,6 |  |  |  | 1.00 | 0.286 | 0.288 | 0.995 | 0.750 | 858,686 | 92 by 72 |
| 2500 + 1/2 | 0.6 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 10,5 |  |  |  | 1.00 | 0.289 | 0.288 | 1.001 | 0.750 | 842,582 | 104 by 156 |
| 2501 | 0.6 | 0.28 | 0.28 | 1.01 | 1.01 | 1.01 | 0.000 | 1.10 | 15,4 |  |  |  | 1.01 | 0.290 | 0.289 | 1.004 | 0.750 | 622,598 | 112 by 84 |
| 2501 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

### rise (mars.rise, frames 2670 to 2744, window 2658 to 2756, 198 draft frames at rate 2)

Largest level step: 0.37 at frame 2684 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.28 from frame 2683 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 15.36 from frame 2683 + 1/2 to the next, block column 15 row 2 from the top left, shown, not judged.
Largest change in place: 83.5 from frame 2681 + 1/2 to 8 film frames later, most at pixel 1800, 288 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 1.00 from frame 2683 to 8 film frames later, most at pixel 464, 1076, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 2658 to 2669 + 1/2): change 3.5, pattern 0.08.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 2683 + 1/2 in /home/user/workspace/work/p6/ha9/03/mars-rise-p1of2-pops.png, frame 2684 in /home/user/workspace/work/p6/ha9/03/mars-rise-p1of2-pops.png, frame 2741 in /home/user/workspace/work/p6/ha9/04/mars-rise-p2of2-pops.png, frame 2752 in /home/user/workspace/work/p6/ha9/04/mars-rise-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 2683 in /home/user/workspace/work/p6/ha9/03/mars-rise-p1of2-changes.png, frame 2697 + 1/2 in /home/user/workspace/work/p6/ha9/03/mars-rise-p1of2-changes.png, frame 2705 + 1/2 in /home/user/workspace/work/p6/ha9/03/mars-rise-p1of2-changes.png, frame 2718 + 1/2 in no panel (a slice --frames 5437-5437 draws it).

- RED pop score 1.28 from frame 2683 + 1/2 to the next, limit 1.2 (3 frames over it, first 2683 + 1/2)
- RED the pattern of the picture changes in place by 1.00 from frame 2683 to 8 film frames later, band 8 px, limit 0.45 (36 frames over it, first 2677 + 1/2)

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2658 | 50.18 |  | 1.2 | 1.50 | 1.50 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 11,0 | 3.5 | 6.8 | 0.75 | 0.08 | 0.74 | 8.2 |
| 2658 + 1/2 | 50.19 | 0.00 | 1.2 | 1.50 | 1.50 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 3,5 | 3.4 | 6.8 | 0.75 | 0.08 | 0.74 | 8.2 |
| 2659 | 50.19 | 0.00 | 1.2 | 1.49 | 1.49 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 15,1 | 3.4 | 6.9 | 0.75 | 0.07 | 0.74 | 8.2 |
| 2659 + 1/2 | 50.20 | 0.00 | 1.1 | 1.49 | 1.49 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 2,5 | 3.4 | 6.9 | 0.75 | 0.07 | 0.74 | 8.2 |
| 2660 | 50.21 | 0.00 | 1.2 | 1.49 | 1.49 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 3,5 | 3.4 | 6.9 | 0.75 | 0.07 | 0.74 | 8.2 |
| 2660 + 1/2 | 50.21 | 0.00 | 1.2 | 1.48 | 1.48 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 8,5 | 3.4 | 6.8 | 0.75 | 0.08 | 0.74 | 8.2 |
| 2661 | 50.22 | 0.00 | 1.2 | 1.48 | 1.48 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 3,8 | 3.4 | 6.9 | 0.75 | 0.07 | 0.74 | 8.2 |
| 2661 + 1/2 | 50.22 | 0.00 | 1.2 | 1.46 | 1.48 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 12,0 | 3.4 | 6.8 | 0.75 | 0.07 | 0.74 | 8.2 |
| 2662 | 50.22 | 0.00 | 1.2 | 1.48 | 1.47 | 1.01 | 1.01 | 1.01 | 0.000 | 1.09 | 11,7 | 3.4 | 6.9 | 0.75 | 0.07 | 0.74 | 8.2 |
| 2662 + 1/2 | 50.23 | 0.00 | 1.2 | 1.46 | 1.47 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 13,1 | 3.4 | 6.8 | 0.75 | 0.07 | 0.74 | 8.3 |
| 2663 | 50.23 | 0.00 | 1.1 | 1.47 | 1.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 10,2 | 3.4 | 6.6 | 0.75 | 0.07 | 0.74 | 8.3 |
| 2663 + 1/2 | 50.23 | 0.00 | 1.1 | 1.46 | 1.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 12,2 | 3.3 | 6.6 | 0.75 | 0.07 | 0.75 | 8.2 |
| 2664 | 50.23 | 0.00 | 1.1 | 1.45 | 1.46 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 3,5 | 3.3 | 6.8 | 0.75 | 0.06 | 0.75 | 8.2 |
| 2664 + 1/2 | 50.24 | 0.00 | 1.1 | 1.45 | 1.45 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 4,7 | 3.2 | 6.6 | 0.75 | 0.06 | 0.75 | 8.2 |
| 2665 | 50.24 | 0.00 | 1.1 | 1.45 | 1.45 | 1.00 | 1.00 | 1.00 | 0.000 | 1.28 | 4,7 | 3.0 | 6.1 | 0.75 | 0.06 | 0.75 | 8.1 |
| 2665 + 1/2 | 50.24 | 0.00 | 1.1 | 1.44 | 1.45 | 0.99 | 0.99 | 0.99 | 0.000 | 1.17 | 3,5 | 2.9 | 5.6 | 0.76 | 0.07 | 0.75 | 8.1 |
| 2666 | 50.24 | 0.00 | 1.1 | 1.45 | 1.45 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 4,7 | 2.7 | 5.0 | 0.76 | 0.07 | 0.75 | 8.0 |
| 2666 + 1/2 | 50.25 | 0.00 | 1.1 | 1.44 | 1.45 | 0.99 | 0.99 | 0.99 | 0.000 | 1.19 | 4,7 | 2.8 | 6.7 | 0.76 | 0.07 | 0.75 | 8.0 |
| 2667 | 50.25 | 0.00 | 1.2 | 1.44 | 1.45 | 0.99 | 0.99 | 0.99 | 0.000 | 1.20 | 3,5 | 2.9 | 6.6 | 0.76 | 0.07 | 0.75 | 8.0 |
| 2667 + 1/2 | 50.25 | 0.00 | 1.1 | 1.44 | 1.45 | 0.99 | 0.99 | 0.99 | 0.000 | 1.18 | 4,7 | 3.0 | 6.7 | 0.76 | 0.07 | 0.75 | 8.0 |
| 2668 | 50.25 | 0.00 | 1.1 | 1.44 | 1.45 | 0.99 | 0.99 | 0.99 | 0.000 | 1.17 | 3,4 | 3.1 | 7.7 | 0.76 | 0.07 | 0.75 | 8.0 |
| 2668 + 1/2 | 50.26 | 0.00 | 1.1 | 1.44 | 1.45 | 0.99 | 0.99 | 0.99 | 0.000 | 1.24 | 3,5 | 3.3 | 7.4 | 0.76 | 0.07 | 0.75 | 8.0 |
| 2669 | 50.26 | 0.00 | 1.1 | 1.44 | 1.45 | 0.99 | 0.99 | 0.99 | 0.000 | 1.19 | 3,4 | 3.4 | 6.7 | 0.76 | 0.07 | 0.75 | 8.0 |
| 2669 + 1/2 | 50.26 | 0.00 | 1.1 | 1.43 | 1.45 | 0.99 | 0.99 | 0.99 | 0.000 | 1.28 | 3,5 | 3.7 | 6.9 | 0.76 | 0.06 | 0.75 | 8.0 |
| 2670 first | 50.26 | 0.00 | 1.1 | 1.42 | 1.45 | 0.98 | 0.98 | 0.98 | 0.000 | 1.30 | 3,5 | 3.8 | 7.5 | 0.76 | 0.05 | 0.76 | 8.0 |
| 2670 + 1/2 | 50.26 | 0.00 | 1.1 | 1.36 | 1.45 | 0.93 | 0.93 | 0.93 | 0.000 | 1.14 | 3,5 | 4.2 | 8.2 | 0.76 | 0.05 | 0.76 | 8.0 |
| 2671 | 50.27 | 0.00 | 1.1 | 1.22 | 1.45 | 0.84 | 0.84 | 0.84 | 0.000 | 1.30 | 11,6 | 4.6 | 9.1 | 0.76 | 0.05 | 0.76 | 8.0 |
| 2671 + 1/2 | 50.28 | 0.00 | 1.3 | 1.19 | 1.45 | 0.82 | 0.82 | 0.82 | 0.000 | 1.36 | 11,6 | 4.9 | 9.9 | 0.76 | 0.04 | 0.76 | 8.3 |
| 2672 | 50.29 | 0.01 | 1.7 | 1.31 | 1.45 | 0.90 | 0.90 | 0.90 | 0.000 | 1.59 | 11,6 | 5.2 | 10.7 | 0.76 | 0.04 | 0.76 | 8.4 |
| 2672 + 1/2 | 50.32 | 0.00 | 2.1 | 1.40 | 1.48 | 0.95 | 0.95 | 0.95 | 0.000 | 1.66 | 10,6 | 5.6 | 11.4 | 0.76 | 0.05 | 0.76 | 8.4 |
| 2673 | 50.35 | 0.00 | 2.5 | 1.50 | 1.50 | 1.00 | 1.00 | 1.00 | 0.000 | 1.76 | 10,6 | 5.9 | 11.7 | 0.76 | 0.05 | 0.76 | 8.5 |
| 2673 + 1/2 | 50.38 | 0.00 | 3.0 | 1.55 | 1.54 | 1.00 | 1.00 | 1.00 | 0.000 | 1.84 | 10,6 | 6.3 | 12.0 | 0.76 | 0.05 | 0.76 | 8.5 |
| 2674 | 50.42 | 0.00 | 3.4 | 1.59 | 1.60 | 0.99 | 0.99 | 0.99 | 0.000 | 1.92 | 11,6 | 6.7 | 11.6 | 0.76 | 0.06 | 0.76 | 8.6 |
| 2674 + 1/2 | 50.46 | 0.00 | 3.9 | 1.65 | 1.62 | 1.02 | 1.02 | 1.02 | 0.000 | 1.84 | 11,6 | 8.4 | 13.8 | 0.76 | 0.07 | 0.76 | 8.7 |
| 2675 | 50.50 | 0.00 | 4.5 | 1.68 | 1.65 | 1.02 | 1.02 | 1.02 | 0.000 | 1.91 | 11,6 | 12.3 | 26.6 | 0.76 | 0.08 | 0.76 | 8.1 |
| 2675 + 1/2 | 50.56 | 0.01 | 5.0 | 1.71 | 1.66 | 1.03 | 1.03 | 1.03 | 0.000 | 1.73 | 11,6 | 24.2 | 43.2 | 0.76 | 0.12 | 0.75 | 8.0 |
| 2676 | 50.62 | 0.01 | 5.5 | 1.69 | 1.66 | 1.01 | 1.02 | 1.01 | 0.000 | 1.64 | 11,6 | 39.7 | 65.5 | 0.76 | 0.23 | 0.75 | 8.0 |
| 2676 + 1/2 | 50.70 | 0.00 | 6.0 | 1.68 | 1.67 | 1.00 | 1.00 | 1.00 | 0.000 | 1.55 | 7,0 | 56.2 | 88.2 | 0.76 | 0.42 | 0.75 | 8.0 |
| 2677 | 50.77 | 0.00 | 6.6 | 1.69 | 1.68 | 1.01 | 1.01 | 1.01 | 0.000 | 1.53 | 10,5 | 67.7 | 96.8 | 0.77 | 0.44 | 0.75 | 8.0 |
| 2677 + 1/2 | 50.85 | 0.02 | 7.2 | 1.69 | 1.68 | 1.00 | 1.01 | 1.00 | 0.000 | 1.56 | 10,5 | 71.4 | 97.2 | 0.77 | 0.50 | 0.75 | 8.0 |
| 2678 | 50.98 | 0.00 | 7.6 | 1.70 | 1.69 | 1.01 | 1.01 | 1.01 | 0.000 | 1.51 | 2,4 | 74.0 | 98.3 | 0.77 | 0.49 | 0.75 | 8.0 |
| 2678 + 1/2 | 51.09 | 0.01 | 8.3 | 1.71 | 1.69 | 1.01 | 1.01 | 1.01 | 0.007 | 1.70 | 10,5 | 74.4 | 99.0 | 0.77 | 0.50 | 0.75 | 8.0 |
| 2679 | 51.23 | 0.00 | 8.9 | 1.69 | 1.70 | 1.00 | 0.99 | 0.99 | 0.009 | 1.60 | 2,4 | 75.7 | 99.8 | 0.77 | 0.57 | 0.75 | 8.0 |
| 2679 + 1/2 | 51.38 | 0.00 | 9.6 | 1.70 | 1.70 | 1.00 | 1.00 | 1.00 | 0.008 | 1.45 | 10,5 | 77.5 | 100.7 | 0.77 | 0.60 | 0.75 | 8.0 |
| 2680 | 51.53 | 0.02 | 10.1 | 1.67 | 1.71 | 0.98 | 0.98 | 0.98 | 0.009 | 1.41 | 15,3 | 79.3 | 101.6 | 0.78 | 0.68 | 0.75 | 8.3 |
| 2680 + 1/2 | 51.72 | 0.03 | 10.9 | 1.66 | 1.71 | 0.97 | 0.97 | 0.97 | 0.004 | 1.46 | 15,3 | 80.9 | 102.0 | 0.78 | 0.74 | 0.76 | 8.0 |
| 2681 | 51.98 | 0.01 | 11.4 | 1.65 | 1.74 | 0.95 | 0.95 | 0.95 | 0.004 | 1.59 | 15,3 | 82.2 | 102.7 | 0.78 | 0.85 | 0.75 | 8.0 |
| 2681 + 1/2 | 52.26 | 0.06 | 12.2 | 1.78 | 1.81 | 0.98 | 0.98 | 0.98 | 0.009 | 2.36 | 15,3 | 83.5 | 102.9 | 0.78 | 0.92 | 0.75 | 8.0 |
| 2682 | 52.43 | 0.08 | 13.0 | 1.91 | 1.94 | 0.99 | 0.99 | 0.99 | 0.011 | 3.97 | 15,2 | 82.2 | 99.7 | 0.78 | 0.97 | 0.76 | 8.0 |
| 2682 + 1/2 | 52.45 | 0.10 | 14.3 | 2.21 | 2.00 | 1.10 | 1.07 | 1.07 | 0.025 | 7.51 | 15,2 | 78.6 | 93.1 | 0.78 | 0.90 | 0.76 | 8.0 |
| 2683 | 52.27 | 0.17 | 15.6 | 2.60 | 2.10 | 1.24 | 1.18 | 1.18 | 0.038 | 11.68 | 15,2 | 74.0 | 81.6 | 0.78 | 1.00 | 0.76 | 8.0 |
| 2683 + 1/2 | 51.75 | 0.09 | 16.7 | 2.84 | 2.16 | 1.32 | 1.28 | 1.28 | 0.022 | 15.36 | 15,2 | 64.6 | 81.5 | 0.79 | 0.84 | 0.76 | 8.0 |
| 2684 | 51.05 | 0.05 | 17.3 | 2.75 | 2.21 | 1.25 | 1.22 | 1.22 | 0.018 | 13.05 | 15,2 | 61.7 | 76.4 | 0.79 | 0.62 | 0.77 | 9.0 |
| 2684 + 1/2 | 50.45 | 0.37 | 18.0 | 2.28 | 2.27 | 1.00 | 1.00 | 1.00 | 0.012 | 3.56 | 14,2 | 59.9 | 75.7 | 0.80 | 0.61 | 0.76 | 9.1 |
| 2685 | 50.60 | 0.10 | 18.9 | 2.09 | 2.38 | 0.88 | 0.89 | 0.88 | 0.010 | 2.03 | 11,2 | 57.2 | 71.9 | 0.80 | 0.74 | 0.76 | 8.8 |
| 2685 + 1/2 | 50.93 | 0.07 | 19.8 | 2.11 | 2.45 | 0.86 | 0.88 | 0.86 | 0.003 | 1.99 | 11,2 | 53.8 | 66.5 | 0.80 | 0.70 | 0.76 | 8.7 |
| 2686 | 51.12 | 0.13 | 20.8 | 2.21 | 2.50 | 0.88 | 0.91 | 0.88 | 0.008 | 2.15 | 11,2 | 49.4 | 61.6 | 0.80 | 0.73 | 0.76 | 8.6 |
| 2686 + 1/2 | 51.05 | 0.14 | 21.6 | 2.34 | 2.56 | 0.91 | 0.96 | 0.91 | 0.006 | 2.36 | 11,2 | 44.7 | 58.0 | 0.81 | 0.69 | 0.76 | 8.6 |
| 2687 | 50.70 | 0.02 | 22.7 | 2.43 | 2.60 | 0.93 | 1.00 | 0.93 | 0.004 | 2.49 | 14,0 | 39.1 | 54.1 | 0.81 | 0.64 | 0.76 | 8.4 |
| 2687 + 1/2 | 50.31 | 0.08 | 23.8 | 2.47 | 2.62 | 0.94 | 1.00 | 0.94 | 0.010 | 2.69 | 11,2 | 34.2 | 49.3 | 0.81 | 0.61 | 0.76 | 8.3 |
| 2688 | 50.09 | 0.23 | 25.0 | 2.52 | 2.67 | 0.94 | 0.96 | 0.94 | 0.038 | 3.14 | 7,1 | 32.9 | 43.7 | 0.81 | 0.58 | 0.77 | 8.3 |
| 2688 + 1/2 | 50.32 | 0.32 | 26.4 | 2.81 | 2.67 | 1.05 | 1.04 | 1.04 | 0.048 | 3.47 | 13,0 | 33.3 | 39.4 | 0.81 | 0.51 | 0.77 | 8.0 |
| 2689 | 51.19 | 0.20 | 27.1 | 3.05 | 2.73 | 1.12 | 1.08 | 1.08 | 0.067 | 5.52 | 13,0 | 33.7 | 39.0 | 0.81 | 0.43 | 0.77 | 8.0 |
| 2689 + 1/2 | 52.45 | 0.02 | 29.1 | 3.04 | 2.76 | 1.10 | 1.04 | 1.04 | 0.100 | 4.82 | 13,0 | 33.9 | 48.6 | 0.82 | 0.38 | 0.78 | 8.0 |
| 2690 | 53.76 | 0.04 | 31.0 | 2.79 | 2.78 | 1.00 | 0.96 | 0.96 | 0.086 | 3.07 | 14,0 | 34.2 | 56.4 | 0.83 | 0.39 | 0.79 | 16.6 |
| 2690 + 1/2 | 54.98 | 0.02 | 32.3 | 2.63 | 2.80 | 0.94 | 0.92 | 0.92 | 0.082 | 2.22 | 10,1 | 34.4 | 57.8 | 0.84 | 0.36 | 0.80 | 17.4 |
| 2691 | 56.24 | 0.12 | 33.3 | 2.61 | 2.81 | 0.93 | 0.91 | 0.91 | 0.081 | 1.64 | 7,0 | 34.6 | 55.0 | 0.84 | 0.31 | 0.80 | 25.8 |
| 2691 + 1/2 | 57.74 | 0.15 | 35.0 | 2.72 | 2.82 | 0.96 | 0.92 | 0.92 | 0.089 | 1.59 | 8,6 | 33.9 | 51.8 | 0.85 | 0.33 | 0.81 | 21.0 |
| 2692 | 59.54 | 0.11 | 33.1 | 2.79 | 2.82 | 0.99 | 0.99 | 0.99 | 0.063 | 1.87 | 8,4 | 35.5 | 48.2 | 0.85 | 0.44 | 0.83 | 10.2 |
| 2692 + 1/2 | 61.57 | 0.01 | 34.0 | 2.93 | 2.82 | 1.04 | 1.04 | 1.04 | 0.077 | 1.96 | 8,4 | 36.5 | 48.0 | 0.86 | 0.39 | 0.84 | 18.4 |
| 2693 | 63.58 | 0.05 | 35.0 | 3.01 | 2.85 | 1.06 | 1.07 | 1.06 | 0.071 | 2.08 | 8,8 | 34.6 | 47.9 | 0.86 | 0.34 | 0.84 | 13.7 |
| 2693 + 1/2 | 65.68 | 0.06 | 35.8 | 3.01 | 2.89 | 1.04 | 1.07 | 1.04 | 0.077 | 1.98 | 8,8 | 32.7 | 49.2 | 0.86 | 0.46 | 0.85 | 9.0 |
| 2694 | 67.92 | 0.08 | 35.9 | 2.87 | 2.96 | 0.97 | 1.04 | 0.97 | 0.058 | 1.74 | 8,8 | 31.0 | 50.2 | 0.87 | 0.48 | 0.86 | 9.0 |
| 2694 + 1/2 | 69.99 | 0.05 | 36.9 | 2.81 | 2.97 | 0.95 | 0.99 | 0.95 | 0.063 | 1.75 | 15,8 | 32.9 | 51.2 | 0.87 | 0.52 | 0.86 | 8.3 |
| 2695 | 71.97 | 0.13 | 38.9 | 2.77 | 2.97 | 0.93 | 0.95 | 0.93 | 0.083 | 1.67 | 7,8 | 32.8 | 51.0 | 0.86 | 0.87 | 0.86 | 8.0 |
| 2695 + 1/2 | 73.69 | 0.25 | 39.7 | 2.83 | 2.97 | 0.95 | 0.98 | 0.95 | 0.084 | 1.50 | 14,1 | 32.2 | 51.9 | 0.87 | 0.58 | 0.86 | 8.0 |
| 2696 | 74.92 | 0.04 | 39.9 | 2.91 | 2.97 | 0.98 | 0.98 | 0.98 | 0.076 | 1.65 | 13,7 | 31.0 | 48.3 | 0.87 | 0.46 | 0.86 | 8.0 |
| 2696 + 1/2 | 76.06 | 0.04 | 42.1 | 3.01 | 2.94 | 1.03 | 0.98 | 0.98 | 0.102 | 1.69 | 15,2 | 29.5 | 45.2 | 0.87 | 0.47 | 0.87 | 8.0 |
| 2697 | 77.12 | 0.06 | 43.4 | 3.15 | 2.94 | 1.07 | 1.03 | 1.03 | 0.098 | 1.87 | 15,2 | 28.5 | 46.7 | 0.88 | 0.67 | 0.87 | 8.0 |
| 2697 + 1/2 | 78.06 | 0.21 | 43.3 | 3.29 | 2.92 | 1.13 | 1.08 | 1.08 | 0.079 | 2.58 | 15,0 | 26.8 | 43.4 | 0.88 | 0.89 | 0.88 | 8.0 |
| 2698 | 78.59 | 0.09 | 42.7 | 3.43 | 2.89 | 1.19 | 1.08 | 1.08 | 0.094 | 2.40 | 13,1 | 25.9 | 37.7 | 0.88 | 0.65 | 0.88 | 8.0 |
| 2698 + 1/2 | 79.29 | 0.03 | 43.8 | 3.51 | 2.89 | 1.21 | 1.10 | 1.10 | 0.092 | 2.22 | 15,2 | 24.8 | 32.0 | 0.89 | 0.57 | 0.89 | 8.0 |
| 2699 | 79.95 | 0.11 | 44.4 | 3.54 | 2.89 | 1.22 | 1.13 | 1.13 | 0.080 | 4.09 | 15,0 | 23.2 | 28.2 | 0.89 | 0.78 | 0.89 | 8.0 |
| 2699 + 1/2 | 80.39 | 0.29 | 45.7 | 3.47 | 2.89 | 1.20 | 1.10 | 1.10 | 0.097 | 2.33 | 15,2 | 21.0 | 30.3 | 0.89 | 0.23 | 0.89 | 8.0 |
| 2700 | 80.26 | 0.25 | 46.9 | 3.44 | 2.89 | 1.19 | 1.15 | 1.15 | 0.068 | 2.25 | 13,1 | 21.2 | 29.0 | 0.90 | 0.26 | 0.90 | 8.0 |
| 2700 + 1/2 | 79.64 | 0.13 | 46.4 | 3.39 | 2.89 | 1.17 | 1.14 | 1.14 | 0.070 | 2.22 | 15,1 | 20.1 | 27.6 | 0.90 | 0.15 | 0.90 | 8.0 |
| 2701 | 78.75 | 0.02 | 46.7 | 3.30 | 2.85 | 1.16 | 1.13 | 1.13 | 0.076 | 2.04 | 0,8 | 20.9 | 26.5 | 0.91 | 0.16 | 0.91 | 8.0 |
| 2701 + 1/2 | 77.90 | 0.07 | 47.4 | 3.14 | 2.83 | 1.11 | 1.13 | 1.11 | 0.037 | 2.11 | 10,2 | 20.4 | 26.4 | 0.92 | 0.26 | 0.91 | 8.0 |
| 2702 | 77.18 | 0.06 | 47.8 | 2.99 | 2.82 | 1.06 | 1.04 | 1.04 | 0.069 | 2.23 | 10,2 | 18.1 | 23.1 | 0.91 | 0.25 | 0.90 | 8.0 |
| 2702 + 1/2 | 76.35 | 0.01 | 48.0 | 2.94 | 2.79 | 1.05 | 1.08 | 1.05 | 0.037 | 2.30 | 8,8 | 18.6 | 24.1 | 0.93 | 0.21 | 0.90 | 8.0 |
| 2703 | 75.54 | 0.05 | 48.6 | 2.82 | 2.74 | 1.03 | 1.04 | 1.03 | 0.043 | 2.10 | 8,8 | 17.7 | 23.3 | 0.93 | 0.24 | 0.90 | 9.7 |
| 2703 + 1/2 | 74.83 | 0.26 | 48.6 | 2.71 | 2.73 | 0.99 | 1.00 | 0.99 | 0.037 | 2.12 | 8,8 | 17.3 | 21.0 | 0.94 | 0.18 | 0.92 | 8.0 |
| 2704 | 74.64 | 0.12 | 48.4 | 2.64 | 2.63 | 1.01 | 1.02 | 1.01 | 0.022 | 2.42 | 7,8 | 17.6 | 20.5 | 0.94 | 0.20 | 0.92 | 14.8 |
| 2704 + 1/2 | 74.69 | 0.11 | 48.4 | 2.55 | 2.57 | 0.99 | 0.98 | 0.98 | 0.034 | 2.27 | 7,8 | 17.3 | 20.1 | 0.94 | 0.22 | 0.92 | 8.0 |
| 2705 | 74.95 | 0.17 | 48.5 | 2.50 | 2.50 | 1.00 | 1.01 | 1.00 | 0.022 | 2.09 | 7,7 | 18.2 | 21.4 | 0.94 | 0.19 | 0.91 | 11.1 |
| 2705 + 1/2 | 74.87 | 0.19 | 48.3 | 2.46 | 2.47 | 1.00 | 1.00 | 1.00 | 0.033 | 1.87 | 7,7 | 17.7 | 27.4 | 0.93 | 0.22 | 0.90 | 10.9 |
| 2706 | 74.42 | 0.21 | 48.1 | 2.43 | 2.44 | 1.00 | 1.00 | 1.00 | 0.031 | 1.96 | 7,6 | 16.7 | 23.5 | 0.93 | 0.12 | 0.91 | 12.5 |
| 2706 + 1/2 | 74.38 | 0.05 | 47.6 | 2.41 | 2.38 | 1.01 | 1.02 | 1.01 | 0.038 | 2.67 | 7,8 | 17.6 | 21.7 | 0.93 | 0.11 | 0.89 | 8.0 |
| 2707 | 74.45 | 0.15 | 46.8 | 2.32 | 2.34 | 0.99 | 0.98 | 0.98 | 0.053 | 2.27 | 7,8 | 16.7 | 22.9 | 0.93 | 0.13 | 0.91 | 9.5 |
| 2707 + 1/2 | 74.83 | 0.20 | 46.1 | 2.28 | 2.27 | 1.01 | 1.01 | 1.01 | 0.045 | 2.16 | 7,7 | 16.6 | 22.6 | 0.93 | 0.12 | 0.91 | 9.6 |
| 2708 | 75.60 | 0.19 | 45.4 | 2.21 | 2.19 | 1.01 | 1.00 | 1.00 | 0.049 | 1.91 | 7,5 | 16.6 | 20.2 | 0.93 | 0.16 | 0.92 | 9.6 |
| 2708 + 1/2 | 76.00 | 0.15 | 44.9 | 2.10 | 2.14 | 0.98 | 0.99 | 0.98 | 0.044 | 2.01 | 7,4 | 16.0 | 30.5 | 0.93 | 0.13 | 0.92 | 10.0 |
| 2709 | 76.11 | 0.04 | 44.1 | 2.07 | 2.06 | 1.01 | 0.98 | 0.98 | 0.051 | 1.95 | 7,4 | 15.6 | 22.6 | 0.92 | 0.21 | 0.92 | 8.0 |
| 2709 + 1/2 | 76.15 | 0.08 | 43.3 | 2.02 | 2.01 | 1.01 | 1.03 | 1.01 | 0.045 | 2.13 | 13,0 | 14.5 | 20.4 | 0.92 | 0.07 | 0.91 | 8.0 |
| 2710 | 76.34 | 0.10 | 42.6 | 1.94 | 1.94 | 1.00 | 0.95 | 0.95 | 0.056 | 1.68 | 6,5 | 13.0 | 17.4 | 0.91 | 0.07 | 0.90 | 8.0 |
| 2710 + 1/2 | 76.74 | 0.08 | 41.5 | 1.87 | 1.88 | 0.99 | 0.99 | 0.99 | 0.041 | 1.82 | 6,5 | 12.5 | 24.0 | 0.91 | 0.06 | 0.90 | 10.6 |
| 2711 | 77.31 | 0.11 | 41.1 | 1.82 | 1.83 | 1.00 | 1.04 | 1.00 | 0.021 | 1.79 | 6,5 | 11.4 | 16.0 | 0.90 | 0.07 | 0.90 | 10.9 |
| 2711 + 1/2 | 77.65 | 0.00 | 40.3 | 1.79 | 1.79 | 1.00 | 0.98 | 0.98 | 0.052 | 1.73 | 8,8 | 10.5 | 17.1 | 0.89 | 0.12 | 0.89 | 9.2 |
| 2712 | 77.99 | 0.13 | 39.7 | 1.74 | 1.77 | 0.98 | 0.99 | 0.98 | 0.043 | 2.02 | 14,1 | 10.0 | 17.3 | 0.88 | 0.08 | 0.88 | 8.0 |
| 2712 + 1/2 | 78.59 | 0.14 | 39.0 | 1.70 | 1.76 | 0.97 | 0.95 | 0.95 | 0.046 | 2.08 | 13,1 | 9.9 | 17.4 | 0.88 | 0.05 | 0.87 | 8.0 |
| 2713 | 78.91 | 0.10 | 38.4 | 1.66 | 1.75 | 0.95 | 0.96 | 0.95 | 0.036 | 2.15 | 13,1 | 9.6 | 17.6 | 0.88 | 0.05 | 0.87 | 8.0 |
| 2713 + 1/2 | 79.43 | 0.06 | 37.9 | 1.61 | 1.75 | 0.92 | 0.93 | 0.92 | 0.035 | 2.10 | 13,1 | 9.7 | 17.6 | 0.87 | 0.04 | 0.87 | 8.0 |
| 2714 | 79.83 | 0.07 | 37.2 | 1.63 | 1.75 | 0.93 | 0.94 | 0.93 | 0.031 | 2.63 | 14,2 | 9.5 | 17.0 | 0.86 | 0.04 | 0.86 | 8.0 |
| 2714 + 1/2 | 80.37 | 0.10 | 36.5 | 1.62 | 1.75 | 0.93 | 0.89 | 0.89 | 0.049 | 2.19 | 12,1 | 9.3 | 16.6 | 0.85 | 0.03 | 0.85 | 8.0 |
| 2715 | 80.71 | 0.07 | 35.8 | 1.61 | 1.74 | 0.93 | 0.90 | 0.90 | 0.046 | 2.61 | 14,2 | 9.1 | 16.6 | 0.85 | 0.05 | 0.84 | 8.0 |
| 2715 + 1/2 | 80.91 | 0.03 | 35.2 | 1.62 | 1.74 | 0.93 | 0.92 | 0.92 | 0.038 | 2.40 | 12,1 | 9.1 | 15.2 | 0.84 | 0.06 | 0.83 | 8.0 |
| 2716 | 81.18 | 0.24 | 34.5 | 1.64 | 1.74 | 0.94 | 0.93 | 0.93 | 0.040 | 3.00 | 14,3 | 9.7 | 14.5 | 0.83 | 0.08 | 0.82 | 8.0 |
| 2716 + 1/2 | 80.96 | 0.05 | 33.6 | 1.65 | 1.74 | 0.95 | 0.94 | 0.94 | 0.045 | 2.75 | 15,3 | 10.1 | 16.5 | 0.82 | 0.09 | 0.81 | 8.0 |
| 2717 | 80.83 | 0.11 | 33.1 | 1.65 | 1.74 | 0.95 | 0.95 | 0.95 | 0.055 | 4.21 | 14,3 | 10.4 | 18.1 | 0.81 | 0.11 | 0.80 | 8.0 |
| 2717 + 1/2 | 80.49 | 0.10 | 32.1 | 1.67 | 1.74 | 0.96 | 0.94 | 0.94 | 0.066 | 4.48 | 14,3 | 10.6 | 16.5 | 0.80 | 0.15 | 0.79 | 8.0 |
| 2718 | 79.94 | 0.18 | 31.7 | 1.70 | 1.74 | 0.98 | 0.98 | 0.98 | 0.053 | 3.22 | 14,3 | 11.2 | 18.3 | 0.79 | 0.20 | 0.78 | 8.0 |
| 2718 + 1/2 | 79.03 | 0.14 | 30.9 | 1.74 | 1.74 | 1.00 | 0.98 | 0.98 | 0.044 | 2.60 | 5,7 | 13.1 | 18.4 | 0.78 | 0.21 | 0.77 | 8.0 |
| 2719 | 77.84 | 0.15 | 30.1 | 1.74 | 1.73 | 1.01 | 1.00 | 1.00 | 0.060 | 2.65 | 4,7 | 12.8 | 19.5 | 0.76 | 0.20 | 0.76 | 8.0 |
| 2719 + 1/2 | 76.35 | 0.17 | 29.4 | 1.75 | 1.73 | 1.01 | 1.03 | 1.01 | 0.059 | 3.42 | 15,6 | 12.0 | 20.6 | 0.75 | 0.22 | 0.74 | 8.0 |
| 2720 | 74.53 | 0.07 | 28.4 | 1.75 | 1.72 | 1.02 | 1.00 | 1.00 | 0.065 | 3.89 | 15,6 | 11.3 | 20.9 | 0.73 | 0.27 | 0.72 | 8.0 |
| 2720 + 1/2 | 72.57 | 0.14 | 27.6 | 1.76 | 1.71 | 1.03 | 0.99 | 0.99 | 0.076 | 4.53 | 15,6 | 11.0 | 21.7 | 0.72 | 0.31 | 0.71 | 8.0 |
| 2721 | 70.34 | 0.02 | 26.6 | 1.74 | 1.71 | 1.02 | 0.99 | 0.99 | 0.074 | 2.67 | 15,6 | 10.7 | 21.1 | 0.71 | 0.40 | 0.70 | 8.0 |
| 2721 + 1/2 | 68.07 | 0.01 | 25.8 | 1.76 | 1.71 | 1.03 | 1.01 | 1.01 | 0.082 | 3.40 | 14,6 | 10.5 | 21.7 | 0.69 | 0.454 | 0.69 | 8.0 |
| 2722 | 65.79 | 0.03 | 24.6 | 1.75 | 1.71 | 1.02 | 1.04 | 1.02 | 0.053 | 2.85 | 14,6 | 10.3 | 20.9 | 0.68 | 0.39 | 0.68 | 8.0 |
| 2722 + 1/2 | 63.57 | 0.06 | 23.9 | 1.74 | 1.71 | 1.02 | 1.02 | 1.02 | 0.048 | 2.45 | 12,3 | 10.1 | 20.6 | 0.67 | 0.33 | 0.66 | 8.0 |
| 2723 | 61.47 | 0.11 | 22.9 | 1.73 | 1.71 | 1.01 | 1.01 | 1.01 | 0.058 | 2.23 | 13,5 | 9.7 | 19.9 | 0.65 | 0.28 | 0.64 | 8.0 |
| 2723 + 1/2 | 59.60 | 0.04 | 22.1 | 1.73 | 1.71 | 1.01 | 1.02 | 1.01 | 0.058 | 2.17 | 12,4 | 9.4 | 18.7 | 0.64 | 0.26 | 0.62 | 8.0 |
| 2724 | 57.80 | 0.01 | 21.4 | 1.78 | 1.71 | 1.04 | 1.06 | 1.04 | 0.048 | 2.52 | 13,6 | 9.1 | 17.4 | 0.63 | 0.23 | 0.60 | 8.0 |
| 2724 + 1/2 | 56.02 | 0.03 | 20.9 | 1.75 | 1.71 | 1.02 | 1.00 | 1.00 | 0.052 | 2.24 | 4,5 | 8.9 | 16.3 | 0.62 | 0.20 | 0.58 | 8.0 |
| 2725 | 54.31 | 0.07 | 20.1 | 1.78 | 1.71 | 1.04 | 1.05 | 1.04 | 0.044 | 2.86 | 9,8 | 8.3 | 14.9 | 0.61 | 0.17 | 0.56 | 8.0 |
| 2725 + 1/2 | 52.74 | 0.06 | 19.2 | 1.75 | 1.71 | 1.03 | 1.06 | 1.03 | 0.054 | 2.41 | 9,6 | 8.2 | 14.8 | 0.59 | 0.13 | 0.54 | 8.0 |
| 2726 | 51.30 | 0.00 | 18.6 | 1.74 | 1.71 | 1.02 | 1.07 | 1.02 | 0.042 | 2.13 | 8,8 | 7.4 | 13.3 | 0.58 | 0.10 | 0.52 | 8.0 |
| 2726 + 1/2 | 49.86 | 0.01 | 18.3 | 1.71 | 1.69 | 1.01 | 1.03 | 1.01 | 0.066 | 2.31 | 8,8 | 7.9 | 15.6 | 0.57 | 0.06 | 0.50 | 8.0 |
| 2727 | 48.40 | 0.04 | 17.5 | 1.63 | 1.68 | 0.97 | 0.98 | 0.97 | 0.063 | 2.04 | 6,8 | 7.5 | 11.7 | 0.56 | 0.04 | 0.48 | 8.0 |
| 2727 + 1/2 | 47.02 | 0.04 | 17.1 | 1.64 | 1.65 | 1.00 | 1.01 | 1.00 | 0.059 | 2.16 | 11,4 | 6.7 | 10.4 | 0.55 | 0.03 | 0.47 | 8.0 |
| 2728 | 45.72 | 0.03 | 16.2 | 1.64 | 1.65 | 1.00 | 0.98 | 0.98 | 0.076 | 2.50 | 8,7 | 6.0 | 9.8 | 0.54 | 0.02 | 0.45 | 8.0 |
| 2728 + 1/2 | 44.48 | 0.03 | 15.9 | 1.61 | 1.64 | 0.98 | 0.96 | 0.96 | 0.070 | 2.29 | 8,7 | 5.3 | 8.6 | 0.53 | 0.01 | 0.44 | 8.0 |
| 2729 | 43.31 | 0.03 | 15.0 | 1.64 | 1.64 | 1.00 | 1.01 | 1.00 | 0.057 | 1.89 | 10,6 | 5.0 | 7.7 | 0.51 | 0.01 | 0.42 | 8.0 |
| 2729 + 1/2 | 42.19 | 0.02 | 14.6 | 1.65 | 1.63 | 1.01 | 1.02 | 1.01 | 0.074 | 2.63 | 10,6 | 4.7 | 6.6 | 0.50 | 0.01 | 0.41 | 8.0 |
| 2730 | 41.11 | 0.02 | 14.1 | 1.65 | 1.63 | 1.01 | 1.02 | 1.01 | 0.082 | 2.31 | 10,6 | 4.5 | 6.3 | 0.48 | 0.01 | 0.40 | 8.0 |
| 2730 + 1/2 | 40.08 | 0.02 | 13.6 | 1.63 | 1.62 | 1.01 | 1.02 | 1.01 | 0.059 | 1.93 | 7,6 | 4.4 | 5.9 | 0.47 | 0.01 | 0.39 | 8.0 |
| 2731 | 39.07 | 0.03 | 13.1 | 1.63 | 1.61 | 1.01 | 1.03 | 1.01 | 0.062 | 2.15 | 0,8 | 4.2 | 6.1 | 0.46 | 0.01 | 0.37 | 8.0 |
| 2731 + 1/2 | 38.12 | 0.02 | 12.5 | 1.62 | 1.60 | 1.01 | 1.03 | 1.01 | 0.050 | 2.82 | 9,6 | 4.0 | 6.4 | 0.45 | 0.01 | 0.36 | 8.0 |
| 2732 | 37.22 | 0.03 | 12.0 | 1.59 | 1.56 | 1.02 | 1.04 | 1.02 | 0.045 | 3.23 | 9,6 | 3.9 | 6.0 | 0.44 | 0.02 | 0.35 | 8.0 |
| 2732 + 1/2 | 36.37 | 0.03 | 11.4 | 1.52 | 1.52 | 0.99 | 0.99 | 0.99 | 0.059 | 2.87 | 9,5 | 3.7 | 5.7 | 0.43 | 0.02 | 0.34 | 8.0 |
| 2733 | 35.59 | 0.03 | 11.1 | 1.42 | 1.49 | 0.95 | 0.90 | 0.90 | 0.092 | 2.47 | 9,5 | 3.5 | 5.3 | 0.42 | 0.02 | 0.33 | 8.0 |
| 2733 + 1/2 | 34.87 | 0.03 | 10.3 | 1.36 | 1.45 | 0.94 | 0.90 | 0.90 | 0.038 | 2.04 | 9,5 | 3.3 | 5.0 | 0.41 | 0.03 | 0.32 | 8.0 |
| 2734 | 34.20 | 0.03 | 9.9 | 1.36 | 1.44 | 0.94 | 0.93 | 0.93 | 0.054 | 2.20 | 9,5 | 3.3 | 4.8 | 0.40 | 0.04 | 0.31 | 8.0 |
| 2734 + 1/2 | 33.59 | 0.03 | 9.5 | 1.38 | 1.42 | 0.97 | 0.96 | 0.96 | 0.057 | 2.67 | 9,5 | 3.3 | 5.1 | 0.39 | 0.04 | 0.31 | 8.0 |
| 2735 | 33.04 | 0.02 | 8.9 | 1.41 | 1.41 | 1.00 | 1.02 | 1.00 | 0.022 | 2.30 | 9,5 | 3.3 | 5.6 | 0.38 | 0.06 | 0.30 | 8.0 |
| 2735 + 1/2 | 32.53 | 0.02 | 8.3 | 1.45 | 1.40 | 1.04 | 1.06 | 1.04 | 0.034 | 2.23 | 9,5 | 3.1 | 6.1 | 0.37 | 0.07 | 0.30 | 8.0 |
| 2736 | 32.05 | 0.01 | 8.0 | 1.46 | 1.39 | 1.05 | 1.07 | 1.05 | 0.025 | 2.08 | 9,4 | 3.1 | 6.0 | 0.36 | 0.07 | 0.29 | 8.0 |
| 2736 + 1/2 | 31.61 | 0.02 | 7.3 | 1.43 | 1.37 | 1.04 | 1.06 | 1.04 | 0.035 | 1.89 | 9,4 | 3.2 | 6.3 | 0.35 | 0.07 | 0.28 | 8.0 |
| 2737 | 31.20 | 0.02 | 6.9 | 1.34 | 1.37 | 0.98 | 0.99 | 0.98 | 0.022 | 1.84 | 11,2 | 3.0 | 6.4 | 0.34 | 0.07 | 0.28 | 8.0 |
| 2737 + 1/2 | 30.83 | 0.02 | 6.5 | 1.21 | 1.36 | 0.89 | 0.91 | 0.89 | 0.027 | 1.51 | 11,2 | 3.0 | 6.6 | 0.34 | 0.07 | 0.27 | 8.0 |
| 2738 | 30.50 | 0.01 | 6.1 | 1.11 | 1.36 | 0.82 | 0.83 | 0.82 | 0.028 | 1.72 | 9,4 | 3.3 | 6.9 | 0.33 | 0.07 | 0.26 | 8.0 |
| 2738 + 1/2 | 30.20 | 0.02 | 5.5 | 1.07 | 1.35 | 0.80 | 0.81 | 0.80 | 0.029 | 1.82 | 8,5 | 3.4 | 6.7 | 0.32 | 0.07 | 0.26 | 8.0 |
| 2739 | 29.93 | 0.01 | 5.0 | 1.16 | 1.33 | 0.87 | 0.88 | 0.87 | 0.033 | 1.93 | 8,5 | 3.8 | 7.1 | 0.31 | 0.07 | 0.25 | 8.0 |
| 2739 + 1/2 | 29.68 | 0.01 | 4.7 | 1.26 | 1.28 | 0.98 | 0.99 | 0.98 | 0.032 | 2.13 | 9,4 | 3.9 | 7.1 | 0.31 | 0.07 | 0.25 | 8.0 |
| 2740 | 29.45 | 0.01 | 4.0 | 1.36 | 1.22 | 1.11 | 1.12 | 1.11 | 0.028 | 2.12 | 12,4 | 3.7 | 7.1 | 0.30 | 0.07 | 0.24 | 8.0 |
| 2740 + 1/2 | 29.26 | 0.01 | 3.8 | 1.40 | 1.19 | 1.18 | 1.17 | 1.17 | 0.017 | 2.49 | 14,6 | 3.7 | 7.2 | 0.30 | 0.08 | 0.24 | 8.0 |
| 2741 | 29.09 | 0.02 | 3.3 | 1.39 | 1.14 | 1.22 | 1.21 | 1.21 | 0.039 | 2.78 | 12,4 | 3.8 | 7.1 | 0.29 | 0.08 | 0.24 | 8.0 |
| 2741 + 1/2 | 28.96 | 0.01 | 3.0 | 1.32 | 1.11 | 1.19 | 1.18 | 1.18 | 0.036 | 2.87 | 13,4 | 4.1 | 7.3 | 0.29 | 0.08 | 0.23 | 8.0 |
| 2742 | 28.85 | 0.02 | 2.6 | 1.23 | 1.09 | 1.13 | 1.13 | 1.13 | 0.029 | 2.59 | 12,3 | 4.1 | 6.6 | 0.29 | 0.08 | 0.23 | 8.0 |
| 2742 + 1/2 | 28.77 | 0.01 | 2.2 | 1.12 | 1.02 | 1.10 | 1.10 | 1.10 | 0.029 | 2.66 | 11,2 | 3.7 | 5.9 | 0.28 | 0.08 | 0.23 | 8.0 |
| 2743 | 28.72 | 0.01 | 1.9 | 0.96 | 0.95 | 1.01 | 1.02 | 1.01 | 0.027 | 2.15 | 11,2 | 3.5 | 6.0 | 0.28 | 0.08 | 0.23 | 8.0 |
| 2743 + 1/2 | 28.69 | 0.01 | 1.6 | 0.80 | 0.89 | 0.89 | 0.90 | 0.89 | 0.029 | 1.54 | 8,4 | 3.1 | 5.7 | 0.28 | 0.07 | 0.23 | 8.0 |
| 2744 last | 28.68 | 0.01 | 1.5 | 0.71 | 0.84 | 0.84 | 0.85 | 0.84 | 0.026 | 1.58 | 8,4 | 2.7 | 4.5 | 0.27 | 0.06 | 0.23 | 8.0 |
| 2744 + 1/2 | 28.69 | 0.00 | 1.5 | 0.71 | 0.81 | 0.87 | 0.89 | 0.87 | 0.002 | 1.54 | 8,4 | 2.7 | 4.9 | 0.27 | 0.06 | 0.23 | 8.0 |
| 2745 | 28.70 | 0.00 | 1.5 | 0.71 | 0.81 | 0.87 | 0.89 | 0.87 | 0.034 | 1.45 | 8,4 | 2.8 | 5.1 | 0.27 | 0.06 | 0.23 | 8.0 |
| 2745 + 1/2 | 28.71 | 0.00 | 1.4 | 0.70 | 0.79 | 0.88 | 0.89 | 0.88 | 0.018 | 1.47 | 6,4 | 2.6 | 4.4 | 0.27 | 0.06 | 0.23 | 8.0 |
| 2746 | 28.72 | 0.00 | 1.5 | 0.71 | 0.79 | 0.89 | 0.90 | 0.89 | 0.018 | 1.45 | 7,5 | 2.4 | 3.9 | 0.27 | 0.05 | 0.23 | 8.0 |
| 2746 + 1/2 | 28.73 | 0.01 | 1.5 | 0.70 | 0.79 | 0.90 | 0.91 | 0.90 | 0.031 | 1.53 | 7,5 | 2.6 | 4.1 | 0.27 | 0.05 | 0.23 | 8.0 |
| 2747 | 28.75 | 0.01 | 1.6 | 0.71 | 0.79 | 0.91 | 0.96 | 0.91 | 0.009 | 1.54 | 7,5 | 2.4 | 3.7 | 0.27 | 0.05 | 0.23 | 8.0 |
| 2747 + 1/2 | 28.79 | 0.01 | 1.6 | 0.71 | 0.79 | 0.90 | 0.96 | 0.90 | 0.006 | 1.55 | 7,5 | 2.2 | 3.3 | 0.26 | 0.05 | 0.22 | 8.0 |
| 2748 | 28.86 | 0.01 | 1.7 | 0.71 | 0.78 | 0.91 | 0.95 | 0.91 | 0.011 | 1.52 | 7,5 | 2.4 | 3.9 | 0.26 | 0.06 | 0.22 | 8.0 |
| 2748 + 1/2 | 28.95 | 0.02 | 1.8 | 0.69 | 0.77 | 0.89 | 0.93 | 0.89 | 0.023 | 1.42 | 7,4 | 2.6 | 4.5 | 0.25 | 0.06 | 0.21 | 8.0 |
| 2749 | 29.07 | 0.02 | 2.1 | 0.63 | 0.76 | 0.83 | 0.86 | 0.83 | 0.025 | 1.19 | 1,2 |  |  |  |  |  |  |
| 2749 + 1/2 | 29.23 | 0.02 | 2.4 | 0.53 | 0.75 | 0.71 | 0.71 | 0.71 | 0.037 | 1.18 | 0,3 |  |  |  |  |  |  |
| 2750 | 29.43 | 0.02 | 2.7 | 0.70 | 0.74 | 0.94 | 0.92 | 0.92 | 0.051 | 1.37 | 0,3 |  |  |  |  |  |  |
| 2750 + 1/2 | 29.66 | 0.02 | 3.3 | 0.83 | 0.71 | 1.16 | 1.14 | 1.14 | 0.054 | 2.01 | 7,4 |  |  |  |  |  |  |
| 2751 | 29.92 | 0.02 | 4.1 | 0.79 | 0.71 | 1.11 | 1.11 | 1.11 | 0.024 | 2.04 | 7,4 |  |  |  |  |  |  |
| 2751 + 1/2 | 30.22 | 0.01 | 5.0 | 0.67 | 0.71 | 0.94 | 0.93 | 0.93 | 0.062 | 1.63 | 14,5 |  |  |  |  |  |  |
| 2752 | 30.54 | 0.01 | 5.6 | 0.85 | 0.71 | 1.20 | 1.20 | 1.197 | 0.029 | 2.35 | 3,2 |  |  |  |  |  |  |
| 2752 + 1/2 | 30.88 | 0.01 | 6.8 | 0.74 | 0.71 | 1.04 | 0.99 | 0.99 | 0.076 | 1.78 | 6,7 |  |  |  |  |  |  |
| 2753 | 31.24 | 0.00 | 7.9 | 0.87 | 0.71 | 1.23 | 1.13 | 1.13 | 0.091 | 3.18 | 3,2 |  |  |  |  |  |  |
| 2753 + 1/2 | 31.61 | 0.01 | 9.0 | 0.78 | 0.71 | 1.09 | 1.07 | 1.07 | 0.044 | 2.69 | 7,3 |  |  |  |  |  |  |
| 2754 | 31.96 | 0.05 | 10.2 | 0.85 | 0.73 | 1.17 | 1.16 | 1.16 | 0.038 | 2.90 | 7,3 |  |  |  |  |  |  |
| 2754 + 1/2 | 32.21 | 0.09 | 10.9 | 0.77 | 0.74 | 1.05 | 1.06 | 1.05 | 0.040 | 3.04 | 7,3 |  |  |  |  |  |  |
| 2755 | 32.27 | 0.07 | 12.0 | 0.79 | 0.74 | 1.07 | 1.05 | 1.05 | 0.062 | 2.80 | 6,3 |  |  |  |  |  |  |
| 2755 + 1/2 | 32.19 | 0.06 | 13.3 | 0.79 | 0.75 | 1.05 | 1.06 | 1.05 | 0.049 | 2.89 | 3,1 |  |  |  |  |  |  |
| 2756 | 31.98 | 0.05 | 13.6 | 0.76 | 0.77 | 0.99 | 1.03 | 0.99 | 0.038 | 4.83 | 6,3 |  |  |  |  |  |  |
| 2756 + 1/2 | 31.69 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### rise, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.60 from frame 2683 + 1/2 to the next, limit 1.2.
Largest pop score of one block: 40.14 from frame 2683 + 1/2 to the next, block column 15 row 2 from the top left, shown, not judged.
Largest change in place: 74.9 from frame 2680 + 1/2 to 8 film frames later, most at pixel 1916, 288, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 2658 to 2669 + 1/2): change 1.0; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.312 from frame 2683 + 1/2 to the next, most at pixel 1894, 302, a patch of 272 by 252 px; 1 of 197 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 198 rows, which says nothing of them, quiet or not: frame 2756 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 2683 in /home/user/workspace/work/p6/ha9/03/mars-rise-p1of2-pops-full.png, frame 2683 + 1/2 in /home/user/workspace/work/p6/ha9/03/mars-rise-p1of2-pops-full.png, frame 2684 in /home/user/workspace/work/p6/ha9/03/mars-rise-p1of2-pops-full.png, frame 2693 in /home/user/workspace/work/p6/ha9/03/mars-rise-p1of2-pops-full.png.

With the carry at the full size the rise has 2 numbers over the limit or not measured.

- FULL SIZE RED pop score 1.60 from frame 2683 + 1/2 to the next, limit 1.2 (5 frames over it, first 2683)
- FULL SIZE RED the pattern of the picture changes in place by 1.00 from frame 2683 to 8 film frames later, band 8 px, limit 0.45 (36 frames over it, first 2677 + 1/2)

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2658 | 1.2 | 0.30 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 1.13 | 0,7 | 1.0 | 2.2 | 0.75 | 1.00 | 0.306 | 0.305 | 1.005 | 0.750 | 454,666 | 68 by 80 |
| 2658 + 1/2 | 1.2 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 2,7 | 1.0 | 2.2 | 0.75 | 1.00 | 0.305 | 0.306 | 0.998 | 0.751 | 650,658 | 124 by 152 |
| 2659 | 1.2 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 3,6 | 1.0 | 2.2 | 0.75 | 1.00 | 0.305 | 0.305 | 1.000 | 0.750 | 482,742 | 96 by 88 |
| 2659 + 1/2 | 1.1 | 0.30 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 9,8 | 1.0 | 2.1 | 0.75 | 1.00 | 0.306 | 0.305 | 1.004 | 0.750 | 590,494 | 144 by 240 |
| 2660 | 1.2 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 5,7 | 1.0 | 2.1 | 0.75 | 1.00 | 0.304 | 0.306 | 0.995 | 0.750 | 626,642 | 100 by 136 |
| 2660 + 1/2 | 1.2 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 3,8 | 1.0 | 2.1 | 0.75 | 1.00 | 0.304 | 0.305 | 0.997 | 0.751 | 534,538 | 132 by 100 |
| 2661 | 1.2 | 0.30 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 1.11 | 3,5 | 1.0 | 2.1 | 0.75 | 1.00 | 0.307 | 0.305 | 1.008 | 0.750 | 598,510 | 64 by 68 |
| 2661 + 1/2 | 1.2 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 13,8 | 1.0 | 2.0 | 0.75 | 0.99 | 0.305 | 0.305 | 1.001 | 0.750 | 602,718 | 84 by 160 |
| 2662 | 1.2 | 0.30 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 5,6 | 1.0 | 2.0 | 0.75 | 1.01 | 0.305 | 0.305 | 0.998 | 0.751 | 702,786 | 84 by 88 |
| 2662 + 1/2 | 1.2 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 2,8 | 1.0 | 2.0 | 0.75 | 1.00 | 0.304 | 0.305 | 0.996 | 0.751 | 602,850 | 216 by 132 |
| 2663 | 1.1 | 0.30 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 1.13 | 4,7 | 1.0 | 2.1 | 0.75 | 1.00 | 0.306 | 0.304 | 1.006 | 0.752 | 598,514 | 68 by 124 |
| 2663 + 1/2 | 1.1 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 5,8 | 1.0 | 2.0 | 0.75 | 1.00 | 0.304 | 0.305 | 0.997 | 0.751 | 502,690 | 212 by 348 |
| 2664 | 1.1 | 0.30 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 3,4 | 1.0 | 2.1 | 0.75 | 0.99 | 0.305 | 0.304 | 1.003 | 0.751 | 438,542 | 192 by 280 |
| 2664 + 1/2 | 1.1 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 6,5 | 1.0 | 2.0 | 0.75 | 1.00 | 0.304 | 0.304 | 1.000 | 0.752 | 590,514 | 56 by 68 |
| 2665 | 1.1 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 5,6 | 1.0 | 1.8 | 0.75 | 1.00 | 0.304 | 0.305 | 0.997 | 0.751 | 618,818 | 196 by 176 |
| 2665 + 1/2 | 1.1 | 0.30 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 3,8 | 1.0 | 1.9 | 0.76 | 0.99 | 0.306 | 0.304 | 1.006 | 0.751 | 518,602 | 176 by 188 |
| 2666 | 1.1 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 3,8 | 1.0 | 1.7 | 0.76 | 1.00 | 0.304 | 0.304 | 1.001 | 0.751 | 594,514 | 60 by 96 |
| 2666 + 1/2 | 1.1 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 4,7 | 1.0 | 1.7 | 0.76 | 0.99 | 0.302 | 0.304 | 0.994 | 0.751 | 586,514 | 60 by 72 |
| 2667 | 1.2 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 3,5 | 1.0 | 1.8 | 0.76 | 0.99 | 0.303 | 0.303 | 1.003 | 0.751 | 466,630 | 152 by 240 |
| 2667 + 1/2 | 1.1 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 3,5 | 1.1 | 2.1 | 0.76 | 0.99 | 0.303 | 0.303 | 0.998 | 0.750 | 714,702 | 56 by 72 |
| 2668 | 1.1 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 3,5 | 1.1 | 2.3 | 0.76 | 0.99 | 0.303 | 0.303 | 0.999 | 0.750 | 466,678 | 88 by 96 |
| 2668 + 1/2 | 1.1 | 0.29 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 3,5 | 1.1 | 2.6 | 0.76 | 0.99 | 0.304 | 0.302 | 1.005 | 0.750 | 582,506 | 60 by 68 |
| 2669 | 1.1 | 0.29 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 4,7 | 1.2 | 3.1 | 0.76 | 0.99 | 0.302 | 0.303 | 0.997 | 0.751 | 470,730 | 60 by 60 |
| 2669 + 1/2 | 1.1 | 0.29 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 3,5 | 1.3 | 3.4 | 0.76 | 0.99 | 0.301 | 0.303 | 0.994 | 0.751 | 514,674 | 140 by 196 |
| 2670 | 1.1 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 3,5 | 1.3 | 3.6 | 0.76 | 0.98 | 0.305 | 0.300 | 1.016 | 0.751 | 418,662 | 192 by 260 |
| 2670 + 1/2 | 1.1 | 0.29 | 0.30 | 0.98 | 0.98 | 0.98 | 0.000 | 1.11 | 9,6 | 1.4 | 3.9 | 0.76 | 0.93 | 0.299 | 0.303 | 0.988 | 0.752 | 598,834 | 212 by 116 |
| 2671 | 1.1 | 0.29 | 0.30 | 0.98 | 0.98 | 0.98 | 0.000 | 1.09 | 6,7 | 1.4 | 4.2 | 0.76 | 0.84 | 0.300 | 0.305 | 0.984 | 0.752 | 706,694 | 64 by 56 |
| 2671 + 1/2 | 1.3 | 0.29 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 3,5 | 1.6 | 4.4 | 0.76 | 0.82 | 0.304 | 0.302 | 1.005 | 0.753 | 470,670 | 144 by 212 |
| 2672 | 1.7 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.24 | 15,8 | 1.7 | 4.6 | 0.76 | 0.90 | 0.305 | 0.309 | 0.987 | 0.754 | 590,626 | 108 by 112 |
| 2672 + 1/2 | 2.1 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 2,4 | 1.8 | 4.8 | 0.76 | 0.95 | 0.314 | 0.314 | 1.001 | 0.754 | 286,590 | 68 by 100 |
| 2673 | 2.5 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 6,3 | 1.9 | 5.0 | 0.76 | 1.00 | 0.322 | 0.322 | 1.000 | 0.754 | 274,582 | 96 by 96 |
| 2673 + 1/2 | 3.0 | 0.32 | 0.31 | 1.01 | 1.01 | 1.01 | 0.000 | 1.17 | 8,8 | 2.0 | 5.1 | 0.76 | 1.00 | 0.331 | 0.329 | 1.005 | 0.755 | 486,730 | 180 by 156 |
| 2674 | 3.4 | 0.32 | 0.32 | 0.99 | 0.99 | 0.99 | 0.000 | 1.23 | 14,8 | 2.8 | 5.4 | 0.76 | 0.99 | 0.335 | 0.338 | 0.991 | 0.755 | 6,466 | 28 by 52 |
| 2674 + 1/2 | 3.9 | 0.33 | 0.33 | 1.01 | 1.01 | 1.01 | 0.000 | 1.34 | 3,5 | 5.6 | 9.8 | 0.76 | 1.02 | 0.346 | 0.344 | 1.008 | 0.756 | 454,642 | 80 by 84 |
| 2675 | 4.5 | 0.33 | 0.34 | 1.00 | 1.00 | 1.00 | 0.000 | 1.32 | 2,7 | 12.6 | 21.4 | 0.76 | 1.02 | 0.352 | 0.354 | 0.995 | 0.757 | 6,762 | 32 by 84 |
| 2675 + 1/2 | 5.0 | 0.34 | 0.34 | 1.01 | 1.01 | 1.01 | 0.000 | 1.22 | 2,7 | 24.1 | 41.5 | 0.76 | 1.03 | 0.361 | 0.358 | 1.009 | 0.758 | 578,854 | 72 by 104 |
| 2676 | 5.5 | 0.34 | 0.35 | 0.99 | 0.99 | 0.99 | 0.000 | 1.18 | 4,6 | 38.3 | 65.8 | 0.76 | 1.01 | 0.364 | 0.367 | 0.993 | 0.759 | 542,674 | 88 by 108 |
| 2676 + 1/2 | 6.0 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.000 | 1.27 | 4,6 | 54.0 | 100.7 | 0.76 | 1.00 | 0.372 | 0.371 | 1.003 | 0.761 | 434,646 | 92 by 112 |
| 2677 | 6.6 | 0.36 | 0.36 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 0,8 | 65.6 | 105.6 | 0.77 | 1.01 | 0.378 | 0.377 | 1.000 | 0.762 | 306,374 | 164 by 80 |
| 2677 + 1/2 | 7.2 | 0.36 | 0.36 | 1.00 | 1.00 | 1.00 | 0.000 | 1.42 | 0,8 | 67.4 | 106.0 | 0.77 | 1.00 | 0.383 | 0.384 | 0.998 | 0.764 | 194,386 | 64 by 48 |
| 2678 | 7.6 | 0.37 | 0.37 | 1.00 | 1.00 | 1.00 | 0.000 | 1.35 | 0,7 | 69.6 | 98.9 | 0.77 | 1.01 | 0.390 | 0.390 | 0.999 | 0.765 | 594,818 | 60 by 72 |
| 2678 + 1/2 | 8.3 | 0.37 | 0.37 | 1.01 | 1.00 | 1.00 | 0.007 | 1.77 | 0,7 | 70.5 | 99.5 | 0.77 | 1.01 | 0.397 | 0.395 | 1.006 | 0.767 | 6,846 | 28 by 60 |
| 2679 | 8.9 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.009 | 1.53 | 0,7 | 72.8 | 100.7 | 0.77 | 0.99 | 0.401 | 0.399 | 1.004 | 0.768 | 222,390 | 96 by 64 |
| 2679 + 1/2 | 9.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.008 | 1.25 | 3,6 | 73.2 | 105.1 | 0.77 | 1.00 | 0.401 | 0.402 | 0.998 | 0.771 | 610,530 | 60 by 76 |
| 2680 | 10.1 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.009 | 1.33 | 3,6 | 73.3 | 94.1 | 0.78 | 0.98 | 0.403 | 0.403 | 1.000 | 0.772 | 558,462 | 68 by 64 |
| 2680 + 1/2 | 10.9 | 0.39 | 0.38 | 1.00 | 1.00 | 1.00 | 0.004 | 1.45 | 3,6 | 74.9 | 94.1 | 0.78 | 0.97 | 0.405 | 0.405 | 0.999 | 0.775 | 314,390 | 56 by 52 |
| 2681 | 11.4 | 0.39 | 0.49 | 0.80 | 0.80 | 0.80 | 0.004 | 1.36 | 3,6 | 71.8 | 87.5 | 0.78 | 0.95 | 0.407 | 0.521 | 0.782 | 0.777 | 486,422 | 60 by 48 |
| 2681 + 1/2 | 12.2 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.009 | 8.01 | 15,3 | 73.5 | 84.1 | 0.78 | 0.98 | 0.637 | 0.640 | 0.995 | 0.779 | 1874,442 | 84 by 72 |
| 2682 | 13.0 | 0.79 | 0.88 | 0.90 | 0.93 | 0.90 | 0.011 | 13.23 | 15,3 | 72.9 | 86.9 | 0.78 | 0.99 | 0.873 | 0.978 | 0.893 | 0.782 | 498,1062 | 104 by 44 |
| 2682 + 1/2 | 14.3 | 1.16 | 0.98 | 1.19 | 1.13 | 1.13 | 0.025 | 21.68 | 15,3 | 68.0 | 74.6 | 0.78 | 1.07 | 1.319 | 1.380 | 0.955 | 0.784 | 6,550 | 28 by 88 |
| 2683 | 15.6 | 1.63 | 1.17 | 1.40 | 1.36 | 1.36 | 0.038 | 30.43 | 15,2 | 52.3 | 61.0 | 0.78 | 1.18 | 1.887 | 1.744 | 1.082 | 0.787 | 1914,378 | 216 by 176 |
| 2683 + 1/2 | 16.7 | 1.97 | 1.17 | 1.68 | 1.60 | 1.60 | 0.022 | 40.14 | 15,2 | 40.7 | 49.8 | 0.79 | 1.28 | 2.277 | 1.735 | 1.312 | 0.790 | 1894,302 | 272 by 252 |
| 2684 | 17.3 | 1.90 | 1.23 | 1.54 | 1.49 | 1.49 | 0.018 | 30.75 | 15,2 | 34.6 | 46.9 | 0.79 | 1.22 | 2.169 | 1.735 | 1.250 | 0.792 | 1866,310 | 260 by 140 |
| 2684 + 1/2 | 18.0 | 1.41 | 1.37 | 1.03 | 1.06 | 1.03 | 0.012 | 14.55 | 13,3 | 35.7 | 41.1 | 0.80 | 1.00 | 1.583 | 1.725 | 0.917 | 0.796 | 1598,450 | 128 by 80 |
| 2685 | 18.9 | 1.17 | 1.47 | 0.80 | 0.83 | 0.80 | 0.009 | 3.91 | 11,2 | 33.9 | 38.9 | 0.80 | 0.88 | 1.282 | 1.430 | 0.897 | 0.799 | 514,910 | 112 by 68 |
| 2685 + 1/2 | 19.8 | 1.17 | 1.51 | 0.77 | 0.82 | 0.77 | 0.003 | 3.59 | 11,2 | 31.4 | 38.3 | 0.80 | 0.86 | 1.251 | 1.291 | 0.969 | 0.802 | 542,626 | 56 by 76 |
| 2686 | 20.8 | 1.29 | 1.52 | 0.85 | 0.89 | 0.85 | 0.008 | 3.97 | 11,2 | 29.2 | 36.3 | 0.80 | 0.88 | 1.276 | 1.291 | 0.988 | 0.806 | 398,402 | 92 by 112 |
| 2686 + 1/2 | 21.6 | 1.44 | 1.54 | 0.94 | 0.98 | 0.94 | 0.006 | 4.34 | 11,2 | 29.6 | 54.0 | 0.81 | 0.91 | 1.301 | 1.307 | 0.995 | 0.809 | 398,534 | 60 by 76 |
| 2687 | 22.7 | 1.53 | 1.58 | 0.97 | 1.04 | 0.97 | 0.004 | 4.76 | 11,2 | 30.6 | 43.2 | 0.81 | 0.93 | 1.339 | 1.340 | 0.999 | 0.813 | 430,522 | 68 by 120 |
| 2687 + 1/2 | 23.8 | 1.51 | 1.62 | 0.93 | 0.99 | 0.93 | 0.009 | 4.93 | 11,2 | 31.4 | 34.3 | 0.81 | 0.94 | 1.379 | 1.391 | 0.991 | 0.817 | 454,522 | 60 by 124 |
| 2688 | 25.0 | 1.51 | 1.67 | 0.90 | 0.88 | 0.88 | 0.039 | 5.02 | 11,2 | 32.8 | 35.6 | 0.81 | 0.94 | 1.444 | 1.448 | 0.997 | 0.820 | 478,526 | 64 by 120 |
| 2688 + 1/2 | 26.4 | 1.78 | 1.67 | 1.07 | 1.02 | 1.02 | 0.048 | 4.68 | 13,0 | 32.9 | 35.5 | 0.81 | 1.04 | 1.517 | 1.508 | 1.006 | 0.824 | 554,590 | 92 by 116 |
| 2689 | 27.1 | 2.00 | 1.74 | 1.15 | 1.09 | 1.09 | 0.068 | 6.88 | 15,0 | 33.5 | 43.6 | 0.81 | 1.08 | 1.572 | 1.521 | 1.033 | 0.828 | 1466,226 | 232 by 68 |
| 2689 + 1/2 | 29.1 | 1.93 | 1.79 | 1.07 | 1.02 | 1.02 | 0.099 | 6.35 | 14,0 | 33.6 | 41.7 | 0.82 | 1.04 | 1.587 | 1.521 | 1.043 | 0.832 | 1454,226 | 500 by 92 |
| 2690 | 31.0 | 1.70 | 1.84 | 0.92 | 0.92 | 0.92 | 0.086 | 3.32 | 15,0 | 33.4 | 49.3 | 0.83 | 0.96 | 1.525 | 1.564 | 0.975 | 0.836 | 1270,194 | 332 by 84 |
| 2690 + 1/2 | 32.3 | 1.55 | 1.86 | 0.83 | 0.87 | 0.83 | 0.081 | 3.42 | 10,1 | 34.0 | 50.2 | 0.84 | 0.92 | 1.472 | 1.571 | 0.937 | 0.840 | 1286,182 | 112 by 44 |
| 2691 | 33.3 | 1.60 | 1.89 | 0.85 | 0.90 | 0.85 | 0.079 | 2.26 | 8,5 | 36.3 | 68.0 | 0.84 | 0.91 | 1.556 | 1.630 | 0.955 | 0.845 | 442,1074 | 92 by 28 |
| 2691 + 1/2 | 35.0 | 1.81 | 1.89 | 0.96 | 1.00 | 0.96 | 0.086 | 2.44 | 8,5 | 34.8 | 49.4 | 0.85 | 0.92 | 1.735 | 1.747 | 0.993 | 0.849 | 1914,1010 | 24 by 92 |
| 2692 | 33.1 | 2.00 | 1.86 | 1.08 | 1.19 | 1.08 | 0.060 | 2.56 | 8,5 | 34.4 | 44.5 | 0.85 | 0.99 | 1.939 | 1.941 | 0.999 | 0.853 | 1806,1074 | 136 by 24 |
| 2692 + 1/2 | 34.0 | 2.19 | 1.84 | 1.19 | 1.30 | 1.19 | 0.073 | 2.89 | 8,4 | 36.1 | 45.3 | 0.86 | 1.04 | 2.148 | 2.125 | 1.011 | 0.858 | 1750,1022 | 160 by 216 |
| 2693 | 35.0 | 2.35 | 1.84 | 1.27 | 1.43 | 1.27 | 0.067 | 3.20 | 8,4 | 34.5 | 44.4 | 0.86 | 1.06 | 2.343 | 2.142 | 1.094 | 0.862 | 1650,1074 | 196 by 364 |
| 2693 + 1/2 | 35.8 | 2.30 | 1.84 | 1.25 | 1.39 | 1.25 | 0.074 | 2.96 | 8,4 | 32.8 | 48.0 | 0.86 | 1.04 | 2.310 | 2.142 | 1.079 | 0.866 | 1610,1074 | 136 by 208 |
| 2694 | 35.9 | 2.17 | 1.84 | 1.18 | 1.32 | 1.18 | 0.056 | 2.46 | 8,4 | 31.7 | 47.7 | 0.87 | 0.97 | 2.136 | 2.153 | 0.992 | 0.871 | 1422,1074 | 64 by 24 |
| 2694 + 1/2 | 36.9 | 2.00 | 1.84 | 1.09 | 1.21 | 1.09 | 0.060 | 2.23 | 9,3 | 32.4 | 51.4 | 0.87 | 0.95 | 1.995 | 2.010 | 0.993 | 0.876 | 1914,1074 | 36 by 44 |
| 2695 | 38.9 | 1.88 | 1.84 | 1.02 | 1.12 | 1.02 | 0.076 | 2.22 | 14,2 | 31.3 | 50.4 | 0.86 | 0.93 | 1.884 | 1.904 | 0.989 | 0.880 | 1330,1074 | 80 by 36 |
| 2695 + 1/2 | 39.7 | 1.85 | 1.85 | 1.00 | 1.11 | 1.00 | 0.079 | 2.69 | 14,2 | 30.9 | 47.4 | 0.87 | 0.95 | 1.814 | 1.825 | 0.994 | 0.885 | 6,1074 | 36 by 28 |
| 2696 | 39.9 | 1.83 | 1.86 | 0.98 | 1.06 | 0.98 | 0.072 | 3.04 | 14,2 | 31.6 | 44.5 | 0.87 | 0.98 | 1.766 | 1.783 | 0.990 | 0.889 | 1414,1074 | 56 by 36 |
| 2696 + 1/2 | 42.1 | 1.94 | 1.84 | 1.05 | 1.03 | 1.03 | 0.098 | 3.21 | 14,2 | 28.8 | 39.2 | 0.87 | 0.98 | 1.753 | 1.757 | 0.998 | 0.894 | 794,590 | 60 by 44 |
| 2697 | 43.4 | 1.96 | 1.84 | 1.06 | 1.04 | 1.04 | 0.093 | 3.23 | 14,2 | 28.8 | 38.1 | 0.88 | 1.03 | 1.749 | 1.746 | 1.001 | 0.898 | 782,574 | 76 by 48 |
| 2697 + 1/2 | 43.3 | 1.97 | 1.82 | 1.09 | 1.07 | 1.07 | 0.075 | 3.79 | 13,2 | 27.1 | 43.1 | 0.88 | 1.08 | 1.740 | 1.738 | 1.001 | 0.903 | 786,562 | 76 by 52 |
| 2698 | 42.7 | 2.01 | 1.80 | 1.12 | 1.05 | 1.05 | 0.088 | 3.87 | 13,2 | 26.2 | 36.2 | 0.88 | 1.08 | 1.727 | 1.726 | 1.000 | 0.907 | 566,1074 | 84 by 32 |
| 2698 + 1/2 | 43.8 | 1.96 | 1.80 | 1.09 | 1.02 | 1.02 | 0.085 | 3.82 | 13,2 | 25.7 | 33.1 | 0.89 | 1.10 | 1.712 | 1.711 | 1.001 | 0.911 | 1294,1074 | 96 by 32 |
| 2699 | 44.4 | 1.97 | 1.80 | 1.09 | 1.03 | 1.03 | 0.073 | 3.66 | 14,2 | 22.0 | 32.7 | 0.89 | 1.13 | 1.695 | 1.689 | 1.004 | 0.915 | 454,1074 | 80 by 28 |
| 2699 + 1/2 | 45.7 | 1.88 | 1.80 | 1.05 | 0.96 | 0.96 | 0.091 | 3.52 | 14,2 | 19.6 | 22.1 | 0.89 | 1.10 | 1.665 | 1.654 | 1.007 | 0.919 | 1074,1074 | 64 by 24 |
| 2700 | 46.9 | 1.79 | 1.76 | 1.02 | 1.05 | 1.02 | 0.063 | 3.32 | 14,2 | 19.3 | 27.3 | 0.90 | 1.15 | 1.613 | 1.613 | 1.000 | 0.922 | 826,1074 | 68 by 32 |
| 2700 + 1/2 | 46.4 | 1.69 | 1.71 | 0.99 | 1.02 | 0.99 | 0.064 | 2.94 | 14,2 | 18.6 | 25.0 | 0.90 | 1.14 | 1.561 | 1.559 | 1.001 | 0.928 | 374,1074 | 72 by 32 |
| 2701 | 46.7 | 1.63 | 1.60 | 1.02 | 0.96 | 0.96 | 0.073 | 2.38 | 14,2 | 19.6 | 24.9 | 0.91 | 1.13 | 1.506 | 1.496 | 1.006 | 0.933 | 26,1074 | 84 by 32 |
| 2701 + 1/2 | 47.4 | 1.50 | 1.51 | 1.00 | 1.06 | 1.00 | 0.033 | 1.80 | 15,2 | 19.2 | 24.9 | 0.92 | 1.11 | 1.432 | 1.434 | 0.998 | 0.936 | 314,1074 | 68 by 32 |
| 2702 | 47.8 | 1.40 | 1.42 | 0.98 | 0.93 | 0.93 | 0.065 | 1.44 | 4,0 | 17.7 | 24.6 | 0.91 | 1.04 | 1.363 | 1.368 | 0.996 | 0.938 | 250,1074 | 80 by 28 |
| 2702 + 1/2 | 48.0 | 1.34 | 1.35 | 0.99 | 1.03 | 0.99 | 0.032 | 1.38 | 3,1 | 18.3 | 23.9 | 0.93 | 1.05 | 1.303 | 1.320 | 0.987 | 0.939 | 442,1074 | 52 by 32 |
| 2703 | 48.6 | 1.31 | 1.32 | 0.99 | 0.99 | 0.99 | 0.038 | 1.52 | 3,1 | 17.5 | 24.1 | 0.93 | 1.03 | 1.278 | 1.278 | 1.000 | 0.940 | 386,1074 | 68 by 24 |
| 2703 + 1/2 | 48.6 | 1.29 | 1.30 | 0.99 | 1.00 | 0.99 | 0.033 | 1.44 | 3,1 | 17.9 | 30.4 | 0.94 | 0.99 | 1.252 | 1.255 | 0.998 | 0.940 | 1778,1074 | 64 by 24 |
| 2704 | 48.4 | 1.29 | 1.29 | 1.01 | 1.03 | 1.01 | 0.019 | 1.68 | 7,8 | 18.2 | 21.4 | 0.94 | 1.01 | 1.232 | 1.233 | 1.000 | 0.940 | 902,1074 | 88 by 36 |
| 2704 + 1/2 | 48.4 | 1.28 | 1.29 | 0.99 | 0.98 | 0.98 | 0.030 | 1.68 | 7,8 | 18.2 | 22.4 | 0.94 | 0.98 | 1.207 | 1.230 | 0.981 | 0.940 | 222,1074 | 80 by 24 |
| 2705 | 48.5 | 1.26 | 1.28 | 0.98 | 0.99 | 0.98 | 0.021 | 1.43 | 7,8 | 19.2 | 25.5 | 0.94 | 1.00 | 1.213 | 1.230 | 0.986 | 0.939 | 794,1074 | 56 by 28 |
| 2705 + 1/2 | 48.3 | 1.28 | 1.28 | 1.00 | 1.01 | 1.00 | 0.030 | 1.69 | 8,2 | 18.4 | 20.6 | 0.93 | 1.00 | 1.228 | 1.219 | 1.007 | 0.938 | 1710,414 | 144 by 128 |
| 2706 | 48.1 | 1.29 | 1.27 | 1.01 | 1.01 | 1.01 | 0.028 | 2.78 | 13,3 | 17.0 | 27.6 | 0.93 | 1.00 | 1.232 | 1.219 | 1.011 | 0.937 | 1654,426 | 120 by 136 |
| 2706 + 1/2 | 47.6 | 1.28 | 1.27 | 1.01 | 1.02 | 1.01 | 0.035 | 3.25 | 13,3 | 16.5 | 28.9 | 0.93 | 1.01 | 1.226 | 1.211 | 1.012 | 0.935 | 1598,434 | 100 by 144 |
| 2707 | 46.8 | 1.25 | 1.27 | 0.99 | 0.98 | 0.98 | 0.048 | 2.81 | 7,3 | 15.3 | 20.4 | 0.93 | 0.98 | 1.194 | 1.205 | 0.991 | 0.933 | 1546,446 | 84 by 132 |
| 2707 + 1/2 | 46.1 | 1.27 | 1.25 | 1.01 | 1.02 | 1.01 | 0.041 | 2.99 | 7,3 | 16.3 | 32.3 | 0.93 | 1.01 | 1.185 | 1.171 | 1.012 | 0.931 | 850,466 | 92 by 92 |
| 2708 | 45.4 | 1.26 | 1.24 | 1.01 | 1.00 | 1.00 | 0.045 | 2.65 | 7,3 | 15.8 | 21.3 | 0.93 | 1.00 | 1.148 | 1.144 | 1.004 | 0.928 | 834,458 | 132 by 80 |
| 2708 + 1/2 | 44.9 | 1.24 | 1.22 | 1.01 | 1.01 | 1.01 | 0.040 | 2.07 | 7,4 | 14.9 | 20.4 | 0.93 | 0.98 | 1.103 | 1.100 | 1.003 | 0.925 | 6,574 | 44 by 52 |
| 2709 | 44.1 | 1.19 | 1.20 | 0.99 | 0.97 | 0.97 | 0.045 | 1.99 | 15,4 | 13.9 | 19.1 | 0.92 | 0.98 | 1.052 | 1.054 | 0.998 | 0.922 | 46,586 | 108 by 100 |
| 2709 + 1/2 | 43.3 | 1.17 | 1.16 | 1.00 | 1.02 | 1.00 | 0.041 | 4.17 | 14,0 | 12.7 | 19.0 | 0.92 | 1.01 | 1.005 | 1.001 | 1.004 | 0.918 | 66,610 | 128 by 100 |
| 2710 | 42.6 | 1.14 | 1.15 | 1.00 | 0.91 | 0.91 | 0.049 | 1.60 | 14,4 | 12.0 | 18.3 | 0.91 | 0.95 | 0.950 | 0.961 | 0.989 | 0.914 | 314,646 | 160 by 80 |
| 2710 + 1/2 | 41.5 | 1.12 | 1.11 | 1.01 | 1.00 | 1.00 | 0.037 | 1.90 | 13,1 | 11.5 | 18.8 | 0.91 | 0.99 | 0.917 | 0.917 | 1.000 | 0.910 | 202,1074 | 100 by 32 |
| 2711 | 41.1 | 1.06 | 1.10 | 0.97 | 1.09 | 0.97 | 0.019 | 2.58 | 14,1 | 10.6 | 14.7 | 0.90 | 1.00 | 0.883 | 0.877 | 1.007 | 0.905 | 6,606 | 44 by 72 |
| 2711 + 1/2 | 40.3 | 1.08 | 1.04 | 1.04 | 0.98 | 0.98 | 0.048 | 2.13 | 13,1 | 9.7 | 13.1 | 0.89 | 0.98 | 0.837 | 0.833 | 1.005 | 0.900 | 510,750 | 92 by 52 |
| 2712 | 39.7 | 1.03 | 1.03 | 1.00 | 1.04 | 1.00 | 0.040 | 3.87 | 14,1 | 8.3 | 12.1 | 0.88 | 0.98 | 0.783 | 0.783 | 1.001 | 0.895 | 110,582 | 144 by 120 |
| 2712 + 1/2 | 39.0 | 0.99 | 0.98 | 1.01 | 0.98 | 0.98 | 0.043 | 4.01 | 13,1 | 8.3 | 11.1 | 0.88 | 0.95 | 0.728 | 0.734 | 0.992 | 0.889 | 806,1074 | 48 by 24 |
| 2713 | 38.4 | 0.94 | 0.94 | 1.00 | 1.01 | 1.00 | 0.033 | 3.26 | 13,1 | 8.0 | 10.6 | 0.88 | 0.95 | 0.685 | 0.684 | 1.001 | 0.882 | 1826,1074 | 152 by 88 |
| 2713 + 1/2 | 37.9 | 0.89 | 0.91 | 0.98 | 0.98 | 0.98 | 0.033 | 5.56 | 14,2 | 6.8 | 9.9 | 0.87 | 0.92 | 0.640 | 0.644 | 0.993 | 0.876 | 710,6 | 60 by 24 |
| 2714 | 37.2 | 0.87 | 0.88 | 1.00 | 1.04 | 1.00 | 0.029 | 8.89 | 14,2 | 6.7 | 11.0 | 0.86 | 0.93 | 0.604 | 0.602 | 1.002 | 0.867 | 1730,1074 | 92 by 32 |
| 2714 + 1/2 | 36.5 | 0.86 | 0.86 | 1.00 | 0.94 | 0.94 | 0.048 | 5.10 | 15,2 | 6.4 | 9.9 | 0.85 | 0.89 | 0.565 | 0.565 | 1.001 | 0.859 | 842,50 | 100 by 48 |
| 2715 | 35.8 | 0.85 | 0.85 | 0.99 | 1.01 | 0.99 | 0.043 | 8.49 | 14,2 | 6.7 | 10.1 | 0.85 | 0.90 | 0.526 | 0.531 | 0.991 | 0.851 | 782,62 | 116 by 56 |
| 2715 + 1/2 | 35.2 | 0.84 | 0.84 | 1.00 | 1.00 | 1.00 | 0.037 | 7.48 | 14,2 | 7.3 | 12.4 | 0.84 | 0.92 | 0.496 | 0.503 | 0.986 | 0.843 | 818,1074 | 60 by 36 |
| 2716 | 34.5 | 0.83 | 0.82 | 1.01 | 1.00 | 1.00 | 0.038 | 6.63 | 14,2 | 7.7 | 12.1 | 0.83 | 0.93 | 0.480 | 0.478 | 1.003 | 0.834 | 750,1074 | 56 by 36 |
| 2716 + 1/2 | 33.6 | 0.79 | 0.82 | 0.97 | 0.96 | 0.96 | 0.043 | 5.95 | 14,2 | 8.5 | 15.8 | 0.82 | 0.94 | 0.461 | 0.467 | 0.986 | 0.825 | 382,1074 | 124 by 36 |
| 2717 | 33.1 | 0.78 | 0.81 | 0.97 | 1.00 | 0.97 | 0.053 | 8.07 | 14,3 | 9.5 | 14.8 | 0.81 | 0.95 | 0.455 | 0.459 | 0.991 | 0.815 | 278,1074 | 60 by 40 |
| 2717 + 1/2 | 32.1 | 0.77 | 0.80 | 0.96 | 0.91 | 0.91 | 0.064 | 8.98 | 14,3 | 10.5 | 14.7 | 0.80 | 0.94 | 0.455 | 0.459 | 0.992 | 0.804 | 462,1074 | 176 by 40 |
| 2718 | 31.7 | 0.76 | 0.80 | 0.95 | 0.94 | 0.94 | 0.051 | 6.98 | 15,4 | 11.6 | 18.1 | 0.79 | 0.98 | 0.458 | 0.466 | 0.981 | 0.793 | 1914,822 | 64 by 112 |
| 2718 + 1/2 | 30.9 | 0.80 | 0.80 | 1.00 | 0.96 | 0.96 | 0.043 | 5.93 | 12,2 | 12.6 | 18.9 | 0.78 | 0.98 | 0.477 | 0.473 | 1.010 | 0.781 | 302,1074 | 60 by 28 |
| 2719 | 30.1 | 0.80 | 0.79 | 1.02 | 1.02 | 1.02 | 0.058 | 9.04 | 14,4 | 12.7 | 16.7 | 0.76 | 1.00 | 0.487 | 0.481 | 1.013 | 0.768 | 1838,862 | 140 by 316 |
| 2719 + 1/2 | 29.4 | 0.80 | 0.78 | 1.03 | 1.10 | 1.03 | 0.056 | 9.38 | 14,4 | 13.7 | 16.9 | 0.75 | 1.01 | 0.491 | 0.482 | 1.018 | 0.753 | 1838,1030 | 244 by 460 |
| 2720 | 28.4 | 0.81 | 0.78 | 1.04 | 1.06 | 1.04 | 0.064 | 9.13 | 15,6 | 12.8 | 14.8 | 0.73 | 1.00 | 0.485 | 0.483 | 1.004 | 0.738 | 246,1074 | 60 by 32 |
| 2720 + 1/2 | 27.6 | 0.80 | 0.77 | 1.05 | 1.02 | 1.02 | 0.074 | 12.12 | 15,6 | 12.0 | 14.2 | 0.72 | 0.99 | 0.479 | 0.476 | 1.007 | 0.723 | 1814,1074 | 36 by 40 |
| 2721 | 26.6 | 0.78 | 0.76 | 1.02 | 0.99 | 0.99 | 0.071 | 9.28 | 14,5 | 11.2 | 13.9 | 0.71 | 0.99 | 0.467 | 0.472 | 0.990 | 0.709 | 1394,1074 | 108 by 28 |
| 2721 + 1/2 | 25.8 | 0.76 | 0.75 | 1.01 | 0.98 | 0.98 | 0.080 | 12.17 | 14,6 | 10.4 | 15.2 | 0.69 | 1.01 | 0.462 | 0.466 | 0.991 | 0.695 | 366,1074 | 112 by 48 |
| 2722 | 24.6 | 0.75 | 0.74 | 1.01 | 1.07 | 1.01 | 0.052 | 11.30 | 14,6 | 9.8 | 15.2 | 0.68 | 1.02 | 0.465 | 0.462 | 1.006 | 0.681 | 1350,1074 | 68 by 96 |
| 2722 + 1/2 | 23.9 | 0.72 | 0.72 | 1.00 | 1.02 | 1.00 | 0.047 | 11.74 | 12,3 | 9.0 | 13.1 | 0.67 | 1.02 | 0.462 | 0.463 | 0.998 | 0.667 | 646,710 | 80 by 64 |
| 2723 | 22.9 | 0.70 | 0.70 | 1.00 | 0.97 | 0.97 | 0.056 | 8.94 | 13,5 | 8.6 | 15.6 | 0.65 | 1.01 | 0.461 | 0.464 | 0.992 | 0.654 | 1270,978 | 76 by 116 |
| 2723 + 1/2 | 22.1 | 0.68 | 0.69 | 0.99 | 0.98 | 0.98 | 0.056 | 8.76 | 13,5 | 7.9 | 13.6 | 0.64 | 1.01 | 0.464 | 0.463 | 1.003 | 0.641 | 1246,942 | 60 by 72 |
| 2724 | 21.4 | 0.67 | 0.68 | 0.99 | 1.00 | 0.99 | 0.047 | 12.15 | 13,6 | 7.3 | 12.7 | 0.63 | 1.04 | 0.464 | 0.471 | 0.985 | 0.628 | 1514,1074 | 60 by 44 |
| 2724 + 1/2 | 20.9 | 0.68 | 0.67 | 1.01 | 0.91 | 0.91 | 0.050 | 11.44 | 13,7 | 6.8 | 11.1 | 0.62 | 1.00 | 0.478 | 0.476 | 1.004 | 0.616 | 982,382 | 52 by 100 |
| 2725 | 20.1 | 0.67 | 0.66 | 1.01 | 0.99 | 0.99 | 0.042 | 8.55 | 12,4 | 6.4 | 10.3 | 0.61 | 1.04 | 0.488 | 0.496 | 0.985 | 0.604 | 974,534 | 76 by 80 |
| 2725 + 1/2 | 19.2 | 0.65 | 0.65 | 1.00 | 1.05 | 1.00 | 0.051 | 9.11 | 12,7 | 5.8 | 9.7 | 0.59 | 1.03 | 0.514 | 0.505 | 1.018 | 0.592 | 942,534 | 80 by 80 |
| 2726 | 18.6 | 0.63 | 0.63 | 1.00 | 1.10 | 1.00 | 0.042 | 10.09 | 12,7 | 5.6 | 8.8 | 0.58 | 1.02 | 0.524 | 0.506 | 1.036 | 0.581 | 942,370 | 52 by 72 |
| 2726 + 1/2 | 18.3 | 0.62 | 0.61 | 1.01 | 1.03 | 1.01 | 0.063 | 9.54 | 12,7 | 5.1 | 9.7 | 0.57 | 1.01 | 0.521 | 0.506 | 1.030 | 0.570 | 930,370 | 52 by 80 |
| 2727 | 17.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.060 | 7.91 | 12,6 | 5.1 | 8.7 | 0.56 | 0.97 | 0.498 | 0.494 | 1.008 | 0.559 | 910,502 | 72 by 88 |
| 2727 + 1/2 | 17.1 | 0.57 | 0.57 | 1.00 | 1.07 | 1.00 | 0.056 | 7.58 | 11,8 | 4.6 | 7.1 | 0.55 | 1.00 | 0.468 | 0.467 | 1.001 | 0.548 | 818,366 | 124 by 224 |
| 2728 | 16.2 | 0.54 | 0.54 | 1.00 | 0.95 | 0.95 | 0.072 | 8.78 | 11,8 | 4.2 | 6.7 | 0.54 | 0.98 | 0.435 | 0.430 | 1.014 | 0.537 | 782,398 | 156 by 216 |
| 2728 + 1/2 | 15.9 | 0.51 | 0.51 | 1.01 | 0.98 | 0.98 | 0.068 | 8.41 | 11,7 | 4.1 | 6.1 | 0.53 | 0.96 | 0.392 | 0.397 | 0.987 | 0.527 | 730,438 | 108 by 124 |
| 2729 | 15.0 | 0.48 | 0.49 | 0.98 | 1.01 | 0.98 | 0.054 | 8.56 | 11,6 | 3.8 | 6.4 | 0.51 | 1.00 | 0.358 | 0.364 | 0.984 | 0.517 | 1238,826 | 68 by 72 |
| 2729 + 1/2 | 14.6 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.070 | 7.83 | 11,7 | 3.7 | 5.2 | 0.50 | 1.01 | 0.337 | 0.344 | 0.981 | 0.505 | 1206,910 | 76 by 92 |
| 2730 | 14.1 | 0.45 | 0.45 | 1.00 | 0.99 | 0.99 | 0.077 | 6.38 | 11,6 | 3.5 | 4.8 | 0.48 | 1.01 | 0.329 | 0.328 | 1.001 | 0.493 | 1234,742 | 104 by 196 |
| 2730 + 1/2 | 13.6 | 0.43 | 0.44 | 0.99 | 1.00 | 0.99 | 0.055 | 6.55 | 10,8 | 3.3 | 4.8 | 0.47 | 1.01 | 0.320 | 0.319 | 1.002 | 0.479 | 1190,750 | 60 by 80 |
| 2731 | 13.1 | 0.42 | 0.42 | 1.00 | 1.00 | 1.00 | 0.058 | 6.11 | 10,8 | 3.1 | 4.4 | 0.46 | 1.01 | 0.310 | 0.314 | 0.986 | 0.466 | 1178,842 | 72 by 148 |
| 2731 + 1/2 | 12.5 | 0.41 | 0.41 | 1.00 | 1.00 | 1.00 | 0.047 | 5.85 | 10,7 | 2.9 | 4.0 | 0.45 | 1.01 | 0.305 | 0.309 | 0.987 | 0.454 | 1154,822 | 72 by 160 |
| 2732 | 12.0 | 0.40 | 0.40 | 1.00 | 1.00 | 1.00 | 0.041 | 6.16 | 10,7 | 2.7 | 3.8 | 0.44 | 1.02 | 0.308 | 0.302 | 1.020 | 0.442 | 654,314 | 80 by 64 |
| 2732 + 1/2 | 11.4 | 0.39 | 0.39 | 1.00 | 1.03 | 1.00 | 0.056 | 5.06 | 10,5 | 2.5 | 3.6 | 0.43 | 0.99 | 0.299 | 0.300 | 0.997 | 0.430 | 1110,794 | 100 by 208 |
| 2733 | 11.1 | 0.38 | 0.38 | 0.99 | 0.87 | 0.87 | 0.090 | 4.80 | 9,8 | 2.4 | 3.3 | 0.42 | 0.90 | 0.295 | 0.296 | 0.997 | 0.419 | 1130,682 | 56 by 80 |
| 2733 + 1/2 | 10.3 | 0.37 | 0.37 | 1.01 | 0.97 | 0.97 | 0.037 | 4.42 | 9,8 | 2.2 | 3.3 | 0.41 | 0.90 | 0.292 | 0.291 | 1.004 | 0.409 | 1102,694 | 72 by 140 |
| 2734 | 9.9 | 0.36 | 0.36 | 1.00 | 1.00 | 1.00 | 0.053 | 3.87 | 9,7 | 2.1 | 3.1 | 0.40 | 0.93 | 0.288 | 0.290 | 0.993 | 0.398 | 1086,766 | 60 by 56 |
| 2734 + 1/2 | 9.5 | 0.34 | 0.35 | 0.99 | 0.99 | 0.99 | 0.054 | 4.09 | 9,7 | 2.0 | 2.8 | 0.39 | 0.96 | 0.287 | 0.285 | 1.008 | 0.388 | 1078,670 | 84 by 160 |
| 2735 | 8.9 | 0.34 | 0.34 | 1.00 | 1.02 | 1.00 | 0.020 | 4.32 | 9,7 | 1.9 | 2.6 | 0.38 | 1.00 | 0.282 | 0.284 | 0.993 | 0.379 | 1050,746 | 60 by 96 |
| 2735 + 1/2 | 8.3 | 0.34 | 0.34 | 1.00 | 1.01 | 1.00 | 0.031 | 4.08 | 9,7 | 1.9 | 2.6 | 0.37 | 1.04 | 0.281 | 0.281 | 1.001 | 0.370 | 1066,642 | 56 by 148 |
| 2736 | 8.0 | 0.33 | 0.34 | 1.00 | 1.02 | 1.00 | 0.024 | 3.33 | 9,7 | 1.7 | 2.1 | 0.36 | 1.05 | 0.279 | 0.280 | 0.998 | 0.361 | 1042,722 | 76 by 64 |
| 2736 + 1/2 | 7.3 | 0.33 | 0.33 | 1.00 | 1.01 | 1.00 | 0.033 | 3.05 | 9,4 | 1.7 | 2.2 | 0.35 | 1.04 | 0.278 | 0.277 | 1.005 | 0.353 | 1042,646 | 88 by 128 |
| 2737 | 6.9 | 0.33 | 0.33 | 1.00 | 1.02 | 1.00 | 0.020 | 3.05 | 9,4 | 1.5 | 1.9 | 0.34 | 0.98 | 0.275 | 0.276 | 0.994 | 0.345 | 1070,566 | 60 by 80 |
| 2737 + 1/2 | 6.5 | 0.33 | 0.33 | 1.00 | 1.03 | 1.00 | 0.025 | 2.73 | 9,4 | 1.5 | 1.9 | 0.34 | 0.89 | 0.274 | 0.275 | 0.999 | 0.337 | 1018,674 | 64 by 128 |
| 2738 | 6.1 | 0.32 | 0.32 | 1.01 | 1.03 | 1.01 | 0.026 | 2.69 | 9,4 | 1.5 | 1.8 | 0.33 | 0.82 | 0.275 | 0.274 | 1.002 | 0.329 | 882,238 | 116 by 116 |
| 2738 + 1/2 | 5.5 | 0.31 | 0.32 | 0.99 | 1.01 | 0.99 | 0.027 | 2.15 | 9,4 | 1.3 | 1.6 | 0.32 | 0.80 | 0.273 | 0.274 | 0.995 | 0.321 | 586,306 | 68 by 72 |
| 2739 | 5.0 | 0.31 | 0.31 | 1.00 | 1.01 | 1.00 | 0.031 | 2.24 | 9,4 | 1.3 | 1.8 | 0.31 | 0.87 | 0.274 | 0.273 | 1.004 | 0.314 | 1014,606 | 56 by 124 |
| 2739 + 1/2 | 4.7 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.030 | 2.06 | 9,4 | 1.2 | 1.8 | 0.31 | 0.98 | 0.272 | 0.271 | 1.004 | 0.308 | 862,238 | 60 by 52 |
| 2740 | 4.0 | 0.30 | 0.30 | 1.00 | 0.99 | 0.99 | 0.027 | 1.91 | 9,4 | 1.1 | 1.6 | 0.30 | 1.11 | 0.270 | 0.271 | 0.995 | 0.303 | 1002,570 | 64 by 96 |
| 2740 + 1/2 | 3.8 | 0.30 | 0.30 | 0.98 | 0.97 | 0.97 | 0.016 | 1.56 | 8,7 | 1.1 | 1.7 | 0.30 | 1.17 | 0.270 | 0.270 | 1.000 | 0.298 | 1014,542 | 76 by 140 |
| 2741 | 3.3 | 0.29 | 0.30 | 0.97 | 0.94 | 0.94 | 0.038 | 1.67 | 9,4 | 1.0 | 1.8 | 0.29 | 1.21 | 0.270 | 0.270 | 1.000 | 0.295 | 974,610 | 96 by 100 |
| 2741 + 1/2 | 3.0 | 0.29 | 0.30 | 0.96 | 0.93 | 0.93 | 0.036 | 1.36 | 8,7 | 1.1 | 2.2 | 0.29 | 1.18 | 0.270 | 0.270 | 1.001 | 0.291 | 982,574 | 92 by 132 |
| 2742 | 2.6 | 0.29 | 0.30 | 0.94 | 0.93 | 0.93 | 0.027 | 1.36 | 8,6 | 1.1 | 2.0 | 0.29 | 1.13 | 0.269 | 0.269 | 1.002 | 0.289 | 970,622 | 136 by 164 |
| 2742 + 1/2 | 2.2 | 0.28 | 0.30 | 0.92 | 0.92 | 0.92 | 0.028 | 1.28 | 5,0 | 1.1 | 1.6 | 0.28 | 1.10 | 0.267 | 0.269 | 0.994 | 0.287 | 966,554 | 108 by 92 |
| 2743 | 1.9 | 0.28 | 0.30 | 0.93 | 0.93 | 0.93 | 0.027 | 1.24 | 8,4 | 1.2 | 1.5 | 0.28 | 1.01 | 0.268 | 0.267 | 1.004 | 0.285 | 834,214 | 56 by 60 |
| 2743 + 1/2 | 1.6 | 0.28 | 0.30 | 0.91 | 0.91 | 0.91 | 0.029 | 1.23 | 8,4 | 1.1 | 1.4 | 0.28 | 0.89 | 0.267 | 0.267 | 0.999 | 0.285 | 970,550 | 80 by 140 |
| 2744 | 1.5 | 0.27 | 0.30 | 0.89 | 0.89 | 0.89 | 0.025 | 1.19 | 6,1 | 1.2 | 1.5 | 0.27 | 0.84 | 0.267 | 0.266 | 1.003 | 0.284 | 970,538 | 92 by 184 |
| 2744 + 1/2 | 1.5 | 0.27 | 0.30 | 0.88 | 0.90 | 0.88 | 0.002 | 1.13 | 6,1 | 1.2 | 1.5 | 0.27 | 0.87 | 0.265 | 0.266 | 0.998 | 0.284 | 990,574 | 132 by 112 |
| 2745 | 1.5 | 0.27 | 0.30 | 0.88 | 0.88 | 0.88 | 0.033 | 1.16 | 4,0 | 1.4 | 1.7 | 0.27 | 0.87 | 0.265 | 0.266 | 0.994 | 0.283 | 934,626 | 72 by 60 |
| 2745 + 1/2 | 1.4 | 0.27 | 0.30 | 0.88 | 0.89 | 0.88 | 0.018 | 1.07 | 3,0 | 1.4 | 1.9 | 0.27 | 0.88 | 0.265 | 0.265 | 0.999 | 0.284 | 962,534 | 68 by 64 |
| 2746 | 1.5 | 0.27 | 0.30 | 0.89 | 0.89 | 0.89 | 0.017 | 1.17 | 1,8 | 1.5 | 2.1 | 0.27 | 0.89 | 0.267 | 0.265 | 1.005 | 0.283 | 934,594 | 64 by 84 |
| 2746 + 1/2 | 1.5 | 0.27 | 0.30 | 0.89 | 0.88 | 0.88 | 0.029 | 1.12 | 1,8 | 1.7 | 3.0 | 0.27 | 0.90 | 0.266 | 0.267 | 0.993 | 0.283 | 990,566 | 104 by 76 |
| 2747 | 1.6 | 0.27 | 0.30 | 0.90 | 0.91 | 0.90 | 0.009 | 1.13 | 7,5 | 1.9 | 2.7 | 0.27 | 0.91 | 0.268 | 0.269 | 0.996 | 0.283 | 942,630 | 92 by 56 |
| 2747 + 1/2 | 1.6 | 0.28 | 0.30 | 0.93 | 0.94 | 0.93 | 0.006 | 1.18 | 4,2 | 2.1 | 2.9 | 0.26 | 0.90 | 0.271 | 0.268 | 1.013 | 0.283 | 950,534 | 64 by 108 |
| 2748 | 1.7 | 0.30 | 0.31 | 0.96 | 0.97 | 0.96 | 0.011 | 1.23 | 4,2 | 2.3 | 3.5 | 0.26 | 0.91 | 0.272 | 0.270 | 1.011 | 0.283 | 606,218 | 184 by 236 |
| 2748 + 1/2 | 1.8 | 0.32 | 0.32 | 1.00 | 0.99 | 0.99 | 0.023 | 1.35 | 4,0 | 2.6 | 3.8 | 0.25 | 0.89 | 0.268 | 0.272 | 0.985 | 0.283 | 798,186 | 60 by 60 |
| 2749 | 2.1 | 0.34 | 0.34 | 0.99 | 1.00 | 0.99 | 0.023 | 1.27 | 8,5 |  |  |  | 0.83 | 0.273 | 0.270 | 1.011 | 0.283 | 938,554 | 52 by 100 |
| 2749 + 1/2 | 2.4 | 0.37 | 0.37 | 1.01 | 1.00 | 1.00 | 0.036 | 1.37 | 14,5 |  |  |  | 0.71 | 0.267 | 0.271 | 0.985 | 0.283 | 786,174 | 72 by 52 |
| 2750 | 2.7 | 0.40 | 0.40 | 1.00 | 0.98 | 0.98 | 0.049 | 1.52 | 15,3 |  |  |  | 0.92 | 0.272 | 0.268 | 1.017 | 0.283 | 794,178 | 64 by 60 |
| 2750 + 1/2 | 3.3 | 0.42 | 0.42 | 1.01 | 1.04 | 1.01 | 0.052 | 1.75 | 15,3 |  |  |  | 1.14 | 0.269 | 0.266 | 1.010 | 0.283 | 518,250 | 80 by 92 |
| 2751 | 4.1 | 0.44 | 0.43 | 1.04 | 1.07 | 1.04 | 0.023 | 2.21 | 0,3 |  |  |  | 1.11 | 0.265 | 0.269 | 0.982 | 0.283 | 482,346 | 76 by 72 |
| 2751 + 1/2 | 5.0 | 0.46 | 0.44 | 1.06 | 1.10 | 1.06 | 0.056 | 1.97 | 14,5 |  |  |  | 0.93 | 0.266 | 0.269 | 0.988 | 0.284 | 470,374 | 96 by 84 |
| 2752 | 5.6 | 0.48 | 0.44 | 1.08 | 1.15 | 1.08 | 0.027 | 2.06 | 14,5 |  |  |  | 1.197 | 0.269 | 0.271 | 0.995 | 0.284 | 910,510 | 72 by 164 |
| 2752 + 1/2 | 6.8 | 0.49 | 0.44 | 1.12 | 1.14 | 1.12 | 0.069 | 2.60 | 7,6 |  |  |  | 0.99 | 0.275 | 0.270 | 1.018 | 0.284 | 766,150 | 60 by 56 |
| 2753 | 7.9 | 0.50 | 0.44 | 1.13 | 1.10 | 1.10 | 0.086 | 2.96 | 6,7 |  |  |  | 1.13 | 0.280 | 0.273 | 1.023 | 0.285 | 878,490 | 60 by 92 |
| 2753 + 1/2 | 9.0 | 0.50 | 0.45 | 1.11 | 1.17 | 1.11 | 0.040 | 3.24 | 6,7 |  |  |  | 1.07 | 0.271 | 0.278 | 0.977 | 0.285 | 910,478 | 84 by 100 |
| 2754 | 10.2 | 0.49 | 0.45 | 1.08 | 1.15 | 1.08 | 0.032 | 3.10 | 7,5 |  |  |  | 1.16 | 0.276 | 0.283 | 0.976 | 0.286 | 858,450 | 52 by 100 |
| 2754 + 1/2 | 10.9 | 0.48 | 0.45 | 1.06 | 1.13 | 1.06 | 0.032 | 3.37 | 7,5 |  |  |  | 1.05 | 0.287 | 0.279 | 1.029 | 0.284 | 706,98 | 56 by 56 |
| 2755 | 12.0 | 0.47 | 0.46 | 1.03 | 1.07 | 1.03 | 0.054 | 4.06 | 7,5 |  |  |  | 1.05 | 0.286 | 0.285 | 1.004 | 0.282 | 686,70 | 56 by 44 |
| 2755 + 1/2 | 13.3 | 0.46 | 0.46 | 1.00 | 1.07 | 1.00 | 0.040 | 3.68 | 7,3 |  |  |  | 1.05 | 0.283 | 0.288 | 0.984 | 0.276 | 666,50 | 52 by 36 |
| 2756 | 13.6 | 0.45 | 0.47 | 0.97 | 1.06 | 0.97 | 0.032 | 3.89 | 7,3 |  |  |  | 0.99 | 0.288 | 0.288 | 0.997 | 0.267 | 766,386 | 60 by 104 |
| 2756 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

## place

### dive (mars.dive, T at 2477, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

### rise (mars.rise, T at 2681, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 2x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 18.42, uhd 35.07.

Largest mean difference: 1.597 at frame 2783 (mars.travel), limit 12.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 0.403 at frame 2580 (mars.terrain), limit 3.2.
Largest level difference of one block (a grid of 16 by 9): -1.755 at frame 2580 (mars.terrain), limit 12.
Largest level difference of the whole frame: -0.357 at frame 2580 (mars.terrain), limit 2.2.
Picture: out/work/smooth/mars-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2325 | mars.hold | 1.267 | 6.0 | 84 | -0.051 | -0.089 | 0.190 | 5.95 | 0.475 | 8,0 | 1.098 |
| 2423 | mars.dive | 1.197 | 4.0 | 68 | -0.048 | -0.060 | 0.161 | 4.67 | -0.245 | 3,0 | 1.234 |
| 2445 | mars.dive | 1.386 | 5.4 | 53 | -0.309 | -0.531 | 0.356 | 4.22 | -0.872 | 8,7 | 1.064 |
| 2468 | mars.dive | 1.309 | 5.3 | 110 | -0.146 | -0.151 | 0.240 | 5.01 | -0.814 | 7,5 | 1.209 |
| 2580 | mars.terrain | 1.506 | 9.3 | 54 | -0.357 | -0.415 | 0.403 | 8.26 | -1.755 | 5,5 | 0.959 |
| 2689 | mars.rise | 1.253 | 4.7 | 113 | -0.117 | -0.125 | 0.212 | 3.29 | -0.410 | 6,5 | 1.226 |
| 2708 | mars.rise | 1.323 | 4.9 | 70 | -0.115 | -0.139 | 0.221 | 3.26 | -0.677 | 7,5 | 1.173 |
| 2726 | mars.rise | 1.426 | 7.0 | 92 | -0.014 | -0.028 | 0.206 | 9.10 | 1.024 | 11,8 | 1.321 |
| 2783 | mars.travel | 1.597 | 11.2 | 36 | 0.007 | 0.008 | 0.242 | 7.89 | 0.536 | 10,2 | 1.347 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.

## counts

Film frames 2250 to 2819 in order on one fresh page, 1140 pictures at rate 2, tier draft at preview, 4827 s. Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): 11 warm draws. Its work counts for that picture and stands in brackets. Judged: dive, rise and travel, every picture.

| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |
|---|---|---|---|---|---|---|---|
| mars.hold | no | 300 | 1 | 2250 | 29 | 280 | 209 |
| mars.dive | yes | 180 | 0 |  | 0 | 0 | 0 |
| mars.terrain | no | 360 | 0 |  | 0 | 0 | 0 |
| mars.rise | yes | 150 | 0 |  | 0 | 0 | 0 |
| mars.travel | yes | 150 | 0 |  | 0 | 0 | 0 |

Every picture with work (of the warm start call in brackets):

| frame | segment | programs | texture uploads | buffers | warm draws |
|---|---|---|---|---|---|
| 2250 | mars.hold | 29 (29) | 280 (280) | 209 (209) | 11 |
