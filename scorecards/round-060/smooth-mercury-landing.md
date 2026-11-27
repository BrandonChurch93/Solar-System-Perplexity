# smooth: mercury

Commit 5dd60616578492129874abd81ce19cc1d89d5fa9. Capture rate 2. Parts: path. A calibration run: every number is written, the exit code is 0.

VERDICT: green. No number is over its limit.

## path

### landing (sun.travel into mercury.hold, frames 512 to 539, first frame of the hold 540, window 500 to 551)

The last part of the travel that arrives at mercury, from 0.68 of its length, in the camera of mercury, in px of the master a film frame: sky is the turn of the camera (what the stars do), centre the way of the centre of the body, edge the growth of its radius, centre and edge the fastest point of its edge. Every value is over the mean of the curve in the landing. loss is what a curve loses over one film frame.

This travel has no landing law yet: shown, not judged.

| run | curve | mean | at the start | hold's own | step at the seam | at | step between capture frames at the seam | at | largest loss | at | growth of the loss in the last 4 | at | climb after a fall | at | under the hold's own | at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | sky | 2.656 px | 2.344 | 0.616 | 0.016 | 539 |  |  | 0.252 | 514 | 0.003 | 537 | 0.041 | 533 | 0.001 | 540 |
| whole frames | centre | 0.1638 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.276 | 0.289 | 0.008 | 540 |  |  | 0.008 | 540 | 0.001 | 537 | 0.000 |  | -0.007 | 540 |
| whole frames | edge | 14.5 px | 1.177 | 0.009 | 0.045 | 539 |  |  | 0.115 | 532 | -0.013 | 537 | 0.000 |  | -0.002 | 540 |
| whole frames | centre and edge | 14.66 px | 1.174 | 0.019 | 0.045 | 539 |  |  | 0.114 | 532 | -0.013 | 537 | 0.000 |  | -0.002 | 540 |
| rate 2 | sky | 2.661 px | 2.442 | 0.615 | 0.017 | 538 + 1/2 | 0.008 | 538 + 1/2 | 0.264 | 513 + 1/2 | 0.004 | 536 + 1/2 | 0.041 | 533 | 0.001 | 540 |
| rate 2 | centre | 0.1635 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.272 | 0.289 | 0.008 | 540 | 0.004 | 540 | 0.008 | 540 | 0.001 | 536 + 1/2 | 0.000 |  | -0.005 | 540 |
| rate 2 | edge | 14.31 px | 1.158 | 0.009 | 0.054 | 538 + 1/2 | 0.024 | 538 + 1/2 | 0.117 | 532 | -0.012 | 536 + 1/2 | 0.000 |  | -0.001 | 540 |
| rate 2 | centre and edge | 14.48 px | 1.154 | 0.019 | 0.054 | 538 + 1/2 | 0.024 | 538 + 1/2 | 0.116 | 532 | -0.012 | 536 + 1/2 | 0.000 |  | -0.001 | 540 |

Limits: step 0.08 of the mean over one film frame from 2 film frames before the hold to 2 into it; the largest loss not in the last 4 film frames before the hold, and no loss there larger than the one a film frame before by more than 0.08; no loss under a third of the one a film frame before while the speed is over the hold's own; climb after a fall 0.03; not under the hold's own by more than 0.08. A loss and a speed over the hold's own count from 0.01 of the mean. The two rules of the loss (where the largest lies and how it grows, and letting go) are shown and not judged: the path alone does not part a good arrival from a bad one by them. A curve whose mean is under 0.5 px a film frame stands still in the picture: it is given over that floor, shown and not judged. The 12 film frames before the landing and the frames further into the hold are shown and not judged.

Nothing of this landing is judged.

- shown, not judged: whole frames, sky: lets go: the loss over one film frame falls from 0.021 to 0.006 of the mean at frame 528, to under a third, while the speed is still over the hold's own (0.616)
- shown, not judged: whole frames, sky: climbs again by 0.041 of the mean after it has started to fall, up to frame 533, limit 0.03
- shown, not judged: rate 2, sky: lets go: the loss over one film frame falls from 0.019 to 0.004 of the mean at frame 528, to under a third, while the speed is still over the hold's own (0.615)
- shown, not judged: rate 2, sky: climbs again by 0.041 of the mean after it has started to fall, up to frame 533, limit 0.03

Every film frame of the window. The curves are over their mean in the landing; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment | sky | step | step at rate 2 | centre | step | step at rate 2 | edge | step | step at rate 2 | centre and edge | step | step at rate 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 500 | sun.travel | 7.442 |  |  | 40.805 |  |  | 0.002 |  |  | 1.393 |  |  |
| 501 | sun.travel | 7.076 | 0.366 * | 0.386 * | 41.625 | 0.820 * | 0.712 * | 0.023 | 0.021 | 0.037 | 1.442 | 0.048 | 0.049 |
| 502 | sun.travel | 6.680 | 0.397 * | 0.412 * | 40.863 | 0.762 * | 1.480 * | 0.067 | 0.045 | 0.059 | 1.460 | 0.018 | 0.015 |
| 503 | sun.travel | 6.260 | 0.420 * | 0.430 * | 39.172 | 1.690 * | 1.843 * | 0.133 | 0.065 | 0.077 | 1.467 | 0.007 | 0.012 |
| 504 | sun.travel | 5.824 | 0.435 * | 0.441 * | 37.405 | 1.767 * | 1.746 * | 0.214 | 0.082 * | 0.091 * | 1.487 | 0.020 | 0.038 |
| 505 | sun.travel | 5.381 | 0.443 * | 0.444 * | 36.086 | 1.319 * | 1.257 * | 0.309 | 0.095 * | 0.102 * | 1.536 | 0.049 | 0.067 |
| 506 | sun.travel | 4.938 | 0.443 * | 0.442 * | 35.234 | 0.853 * | 0.816 * | 0.413 | 0.104 * | 0.110 * | 1.610 | 0.074 | 0.082 * |
| 507 | sun.travel | 4.501 | 0.436 * | 0.434 * | 34.381 | 0.852 * | 1.228 * | 0.524 | 0.111 * | 0.115 * | 1.690 | 0.081 * | 0.081 * |
| 508 | sun.travel | 4.079 | 0.423 * | 0.420 * | 32.732 | 1.650 * | 2.628 * | 0.638 | 0.114 * | 0.117 * | 1.747 | 0.057 | 0.053 |
| 509 | sun.travel | 3.675 | 0.403 * | 0.400 * | 29.268 | 3.464 * | 5.174 * | 0.754 | 0.115 * | 0.117 * | 1.743 | 0.004 | 0.064 |
| 510 | sun.travel | 3.297 | 0.379 * | 0.375 * | 22.760 | 6.508 * | 9.081 * | 0.867 | 0.114 * | 0.115 * | 1.634 | 0.109 * | 0.202 * |
| 511 | sun.travel | 2.947 | 0.350 * | 0.345 * | 11.798 | 10.962 * | 14.114 * | 0.977 | 0.110 * | 0.111 * | 1.369 | 0.265 * | 0.381 * |
| 512 landing | sun.travel | 2.629 | 0.318 * | 0.314 * | 0.709 | 11.088 * | 9.966 * | 1.081 | 0.104 * | 0.105 * | 1.093 | 0.275 * | 0.241 * |
| 513 | sun.travel | 2.344 | 0.285 * | 0.280 * | 0.276 | 0.433 * | 0.010 | 1.177 | 0.096 * | 0.096 * | 1.174 | 0.0804 * | 0.096 * |
| 514 | sun.travel | 2.092 | 0.252 * | 0.247 * | 0.285 | 0.009 | 0.009 | 1.264 | 0.087 * | 0.087 * | 1.260 | 0.086 * | 0.086 * |
| 515 | sun.travel | 1.872 | 0.220 * | 0.216 * | 0.294 | 0.009 | 0.009 | 1.340 | 0.076 | 0.076 | 1.335 | 0.075 | 0.075 |
| 516 | sun.travel | 1.681 | 0.191 * | 0.187 * | 0.302 | 0.008 | 0.008 | 1.404 | 0.064 | 0.063 | 1.399 | 0.064 | 0.063 |
| 517 | sun.travel | 1.515 | 0.166 * | 0.163 * | 0.310 | 0.008 | 0.008 | 1.455 | 0.051 | 0.050 | 1.450 | 0.051 | 0.050 |
| 518 | sun.travel | 1.371 | 0.145 * | 0.142 * | 0.317 | 0.007 | 0.007 | 1.493 | 0.037 | 0.036 | 1.487 | 0.037 | 0.036 |
| 519 | sun.travel | 1.243 | 0.128 * | 0.126 * | 0.323 | 0.006 | 0.006 | 1.515 | 0.023 | 0.021 | 1.510 | 0.023 | 0.021 |
| 520 | sun.travel | 1.128 | 0.115 * | 0.113 * | 0.329 | 0.006 | 0.006 | 1.524 | 0.008 | 0.006 | 1.518 | 0.008 | 0.007 |
| 521 | sun.travel | 1.025 | 0.103 * | 0.102 * | 0.334 | 0.005 | 0.005 | 1.517 | 0.007 | 0.016 | 1.512 | 0.006 | 0.016 |
| 522 | sun.travel | 0.932 | 0.093 * | 0.091 * | 0.339 | 0.004 | 0.004 | 1.496 | 0.021 | 0.031 | 1.491 | 0.021 | 0.030 |
| 523 | sun.travel | 0.850 | 0.082 * | 0.0803 * | 0.342 | 0.004 | 0.004 | 1.460 | 0.036 | 0.045 | 1.456 | 0.035 | 0.044 |
| 524 | sun.travel | 0.780 | 0.069 | 0.067 | 0.345 | 0.003 | 0.003 | 1.411 | 0.050 | 0.059 | 1.407 | 0.049 | 0.058 |
| 525 | sun.travel | 0.726 | 0.054 | 0.052 | 0.348 | 0.002 | 0.002 | 1.348 | 0.063 | 0.071 | 1.345 | 0.062 | 0.070 |
| 526 | sun.travel | 0.689 | 0.038 | 0.035 | 0.349 | 0.002 | 0.001 | 1.273 | 0.075 | 0.083 * | 1.271 | 0.074 | 0.082 * |
| 527 | sun.travel | 0.668 | 0.021 | 0.019 | 0.350 | 0.001 | 0.001 | 1.187 | 0.086 * | 0.093 * | 1.186 | 0.085 * | 0.092 * |
| 528 | sun.travel | 0.662 | 0.006 | 0.004 | 0.350 | 0.000 | 0.000 | 1.092 | 0.095 * | 0.102 * | 1.092 | 0.094 * | 0.101 * |
| 529 | sun.travel | 0.667 | 0.005 | 0.009 | 0.349 | 0.001 | 0.001 | 0.989 | 0.103 * | 0.109 * | 0.990 | 0.102 * | 0.108 * |
| 530 | sun.travel | 0.678 | 0.011 | 0.012 | 0.348 | 0.001 | 0.002 | 0.879 | 0.109 * | 0.114 * | 0.881 | 0.108 * | 0.113 * |
| 531 | sun.travel | 0.690 | 0.012 | 0.012 | 0.346 | 0.002 | 0.003 | 0.766 | 0.113 * | 0.116 * | 0.769 | 0.112 * | 0.115 * |
| 532 | sun.travel | 0.699 | 0.009 | 0.009 | 0.343 | 0.003 | 0.003 | 0.650 | 0.115 * | 0.117 * | 0.655 | 0.114 * | 0.116 * |
| 533 | sun.travel | 0.703 | 0.004 | 0.003 | 0.340 | 0.004 | 0.004 | 0.536 | 0.115 * | 0.116 * | 0.542 | 0.113 * | 0.115 * |
| 534 | sun.travel | 0.700 | 0.003 | 0.007 | 0.335 | 0.004 | 0.005 | 0.425 | 0.111 * | 0.112 * | 0.432 | 0.110 * | 0.111 * |
| 535 | sun.travel | 0.691 | 0.009 | 0.013 | 0.330 | 0.005 | 0.005 | 0.320 | 0.105 * | 0.105 * | 0.328 | 0.104 * | 0.104 * |
| 536 | sun.travel | 0.676 | 0.015 | 0.017 | 0.325 | 0.006 | 0.006 | 0.225 | 0.095 * | 0.095 * | 0.234 | 0.094 * | 0.094 * |
| 537 | sun.travel | 0.658 | 0.018 | 0.019 | 0.318 | 0.006 | 0.007 | 0.143 | 0.082 * | 0.081 * | 0.152 | 0.081 * | 0.081 * |
| 538 | sun.travel | 0.639 | 0.019 | 0.019 | 0.311 | 0.007 | 0.007 | 0.077 | 0.066 | 0.064 | 0.087 | 0.065 | 0.064 |
| 539 | sun.travel | 0.623 | 0.016 | 0.015 | 0.304 | 0.008 | 0.008 | 0.032 | 0.045 | 0.043 | 0.042 | 0.045 | 0.043 |
| 540 hold | mercury.hold | 0.616 | 0.008 | 0.007 | 0.296 | 0.008 | 0.008 | 0.011 | 0.021 | 0.018 | 0.021 | 0.021 | 0.018 |
| 541 | mercury.hold | 0.616 | 0.000 | 0.001 | 0.291 | 0.005 | 0.004 | 0.009 | 0.002 | 0.001 | 0.019 | 0.002 | 0.001 |
| 542 | mercury.hold | 0.617 | 0.001 | 0.001 | 0.287 | 0.004 | 0.005 | 0.009 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 |
| 543 | mercury.hold | 0.618 | 0.001 | 0.001 | 0.282 | 0.005 | 0.005 | 0.009 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 |
| 544 | mercury.hold | 0.620 | 0.001 | 0.001 | 0.276 | 0.006 | 0.006 | 0.009 | 0.000 | 0.000 | 0.018 | 0.000 | 0.000 |
| 545 | mercury.hold | 0.621 | 0.001 | 0.001 | 0.270 | 0.006 | 0.007 | 0.009 | 0.000 | 0.000 | 0.018 | 0.000 | 0.000 |
| 546 | mercury.hold | 0.622 | 0.001 | 0.001 | 0.263 | 0.007 | 0.007 | 0.009 | 0.000 | 0.000 | 0.018 | 0.000 | 0.000 |
| 547 | mercury.hold | 0.623 | 0.001 | 0.001 | 0.255 | 0.008 | 0.008 | 0.009 | 0.000 | 0.000 | 0.018 | 0.000 | 0.000 |
| 548 | mercury.hold | 0.625 | 0.001 | 0.001 | 0.247 | 0.008 | 0.008 | 0.009 | 0.000 | 0.000 | 0.017 | 0.000 | 0.000 |
| 549 | mercury.hold | 0.626 | 0.001 | 0.001 | 0.238 | 0.009 | 0.009 | 0.009 | 0.000 | 0.000 | 0.017 | 0.000 | 0.000 |
| 550 | mercury.hold | 0.627 | 0.001 | 0.001 | 0.229 | 0.009 | 0.009 | 0.009 | 0.000 | 0.000 | 0.017 | 0.000 | 0.000 |
| 551 | mercury.hold | 0.629 | 0.001 | 0.001 | 0.220 | 0.010 | 0.010 | 0.009 | 0.000 | 0.000 | 0.017 | 0.000 | 0.000 |
