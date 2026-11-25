# smooth: mercury

Commit 73809f4b11afa1e653514111a8aa3711831119d3. Capture rate 2. Parts: path. A calibration run: every number is written, the exit code is 0.

VERDICT: green. No number is over its limit.

## path

### landing (sun.travel into mercury.hold, frames 512 to 539, first frame of the hold 540, window 500 to 551)

The last part of the travel that arrives at mercury, from 0.68 of its length, in the camera of mercury, in px of the master a film frame: sky is the turn of the camera (what the stars do), centre the way of the centre of the body, edge the growth of its radius, centre and edge the fastest point of its edge. Every value is over the mean of the curve in the landing. loss is what a curve loses over one film frame.

This travel has no landing law yet: shown, not judged.

| run | curve | mean | at the start | hold's own | step at the seam | at | step between capture frames at the seam | at | largest loss | at | growth of the loss in the last 4 | at | climb after a fall | at | under the hold's own | at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | sky | 2.161 px | 2.288 | 0.757 | 0.016 | 539 |  |  | 0.268 | 514 | 0.007 | 537 | 0.217 | 535 | 0.001 | 540 |
| whole frames | centre | 0.1638 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.276 | 0.283 | 0.009 | 542 |  |  | 0.008 | 540 | 0.001 | 537 | 0.000 |  | -0.013 | 540 |
| whole frames | edge | 14.5 px | 1.177 | 0.009 | 0.045 | 539 |  |  | 0.115 | 532 | -0.013 | 537 | 0.000 |  | -0.002 | 540 |
| whole frames | centre and edge | 14.66 px | 1.174 | 0.019 | 0.045 | 539 |  |  | 0.114 | 532 | -0.013 | 537 | 0.000 |  | -0.002 | 540 |
| rate 2 | sky | 2.169 px | 2.391 | 0.755 | 0.017 | 538 + 1/2 | 0.008 | 538 + 1/2 | 0.283 | 513 + 1/2 | 0.008 | 536 + 1/2 | 0.218 | 534 + 1/2 | 0.002 | 540 |
| rate 2 | centre | 0.1635 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.272 | 0.284 | 0.009 | 542 | 0.005 | 542 | 0.008 | 540 | 0.001 | 536 + 1/2 | 0.000 |  | -0.011 | 540 |
| rate 2 | edge | 14.31 px | 1.158 | 0.009 | 0.054 | 538 + 1/2 | 0.024 | 538 + 1/2 | 0.117 | 532 | -0.012 | 536 + 1/2 | 0.000 |  | -0.001 | 540 |
| rate 2 | centre and edge | 14.48 px | 1.154 | 0.019 | 0.054 | 538 + 1/2 | 0.024 | 538 + 1/2 | 0.116 | 532 | -0.012 | 536 + 1/2 | 0.000 |  | -0.001 | 540 |

Limits: step 0.08 of the mean over one film frame from 2 film frames before the hold to 2 into it; the largest loss not in the last 4 film frames before the hold, and no loss there larger than the one a film frame before by more than 0.08; no loss under a third of the one a film frame before while the speed is over the hold's own; climb after a fall 0.03; not under the hold's own by more than 0.08. A loss and a speed over the hold's own count from 0.01 of the mean. The two rules of the loss (where the largest lies and how it grows, and letting go) are shown and not judged: the path alone does not part a good arrival from a bad one by them. A curve whose mean is under 0.5 px a film frame stands still in the picture: it is given over that floor, shown and not judged. The 12 film frames before the landing and the frames further into the hold are shown and not judged.

Nothing of this landing is judged.

- shown, not judged: whole frames, sky: climbs again by 0.217 of the mean after it has started to fall, up to frame 535, limit 0.03
- shown, not judged: rate 2, sky: climbs again by 0.218 of the mean after it has started to fall, up to frame 534 + 1/2, limit 0.03

Every film frame of the window. The curves are over their mean in the landing; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment | sky | step | step at rate 2 | centre | step | step at rate 2 | edge | step | step at rate 2 | centre and edge | step | step at rate 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 500 | sun.travel | 8.304 |  |  | 36.201 |  |  | 0.002 |  |  | 1.236 |  |  |
| 501 | sun.travel | 7.861 | 0.443 * | 0.465 * | 34.850 | 1.351 * | 1.563 * | 0.023 | 0.021 | 0.037 | 1.211 | 0.026 | 0.024 |
| 502 | sun.travel | 7.382 | 0.479 * | 0.496 * | 33.314 | 1.535 * | 1.535 * | 0.067 | 0.045 | 0.059 | 1.203 | 0.008 | 0.014 |
| 503 | sun.travel | 6.876 | 0.506 * | 0.517 * | 32.343 | 0.971 * | 0.871 * | 0.133 | 0.065 | 0.077 | 1.234 | 0.031 | 0.064 |
| 504 | sun.travel | 6.352 | 0.524 * | 0.528 * | 32.434 | 0.091 * | 0.713 * | 0.214 | 0.082 * | 0.091 * | 1.318 | 0.084 * | 0.115 * |
| 505 | sun.travel | 5.821 | 0.532 * | 0.530 * | 33.430 | 0.996 * | 1.237 * | 0.309 | 0.095 * | 0.102 * | 1.445 | 0.128 * | 0.144 * |
| 506 | sun.travel | 5.291 | 0.530 * | 0.527 * | 34.648 | 1.218 * | 1.191 * | 0.413 | 0.104 * | 0.110 * | 1.590 | 0.145 * | 0.147 * |
| 507 | sun.travel | 4.772 | 0.519 * | 0.516 * | 35.214 | 0.567 * | 0.435 * | 0.524 | 0.111 * | 0.115 * | 1.719 | 0.129 * | 0.127 * |
| 508 | sun.travel | 4.272 | 0.500 * | 0.495 * | 34.256 | 0.959 * | 2.343 * | 0.638 | 0.114 * | 0.117 * | 1.799 | 0.0804 * | 0.074 |
| 509 | sun.travel | 3.798 | 0.473 * | 0.468 * | 30.866 | 3.390 * | 5.400 * | 0.754 | 0.115 * | 0.117 * | 1.798 | 0.002 | 0.072 |
| 510 | sun.travel | 3.359 | 0.440 * | 0.434 * | 23.989 | 6.877 * | 9.643 * | 0.867 | 0.114 * | 0.115 * | 1.676 | 0.122 * | 0.221 * |
| 511 | sun.travel | 2.958 | 0.401 * | 0.394 * | 12.384 | 11.605 * | 14.843 * | 0.977 | 0.110 * | 0.111 * | 1.389 | 0.287 * | 0.406 * |
| 512 landing | sun.travel | 2.601 | 0.357 * | 0.351 * | 0.745 | 11.640 * | 10.463 * | 1.081 | 0.104 * | 0.105 * | 1.095 | 0.294 * | 0.258 * |
| 513 | sun.travel | 2.288 | 0.312 * | 0.306 * | 0.276 | 0.469 * | 0.010 | 1.177 | 0.096 * | 0.096 * | 1.174 | 0.079 | 0.096 * |
| 514 | sun.travel | 2.021 | 0.268 * | 0.261 * | 0.285 | 0.009 | 0.009 | 1.264 | 0.087 * | 0.087 * | 1.260 | 0.086 * | 0.086 * |
| 515 | sun.travel | 1.795 | 0.226 * | 0.220 * | 0.294 | 0.009 | 0.009 | 1.340 | 0.076 | 0.076 | 1.335 | 0.075 | 0.075 |
| 516 | sun.travel | 1.607 | 0.189 * | 0.184 * | 0.302 | 0.008 | 0.008 | 1.404 | 0.064 | 0.063 | 1.399 | 0.064 | 0.063 |
| 517 | sun.travel | 1.448 | 0.159 * | 0.155 * | 0.310 | 0.008 | 0.008 | 1.455 | 0.051 | 0.050 | 1.450 | 0.051 | 0.050 |
| 518 | sun.travel | 1.312 | 0.136 * | 0.134 * | 0.317 | 0.007 | 0.007 | 1.493 | 0.037 | 0.036 | 1.487 | 0.037 | 0.036 |
| 519 | sun.travel | 1.190 | 0.121 * | 0.119 * | 0.323 | 0.006 | 0.006 | 1.515 | 0.023 | 0.021 | 1.510 | 0.023 | 0.021 |
| 520 | sun.travel | 1.078 | 0.112 * | 0.111 * | 0.329 | 0.006 | 0.006 | 1.524 | 0.008 | 0.006 | 1.518 | 0.008 | 0.007 |
| 521 | sun.travel | 0.973 | 0.106 * | 0.105 * | 0.334 | 0.005 | 0.005 | 1.517 | 0.007 | 0.016 | 1.512 | 0.006 | 0.016 |
| 522 | sun.travel | 0.873 | 0.100 * | 0.099 * | 0.339 | 0.004 | 0.004 | 1.496 | 0.021 | 0.031 | 1.491 | 0.021 | 0.030 |
| 523 | sun.travel | 0.781 | 0.092 * | 0.090 * | 0.342 | 0.004 | 0.004 | 1.460 | 0.036 | 0.045 | 1.456 | 0.035 | 0.044 |
| 524 | sun.travel | 0.702 | 0.079 | 0.077 | 0.345 | 0.003 | 0.003 | 1.411 | 0.050 | 0.059 | 1.407 | 0.049 | 0.058 |
| 525 | sun.travel | 0.642 | 0.060 | 0.057 | 0.348 | 0.002 | 0.002 | 1.348 | 0.063 | 0.071 | 1.345 | 0.062 | 0.070 |
| 526 | sun.travel | 0.608 | 0.034 | 0.031 | 0.349 | 0.002 | 0.001 | 1.273 | 0.075 | 0.083 * | 1.271 | 0.074 | 0.082 * |
| 527 | sun.travel | 0.602 | 0.006 | 0.010 | 0.350 | 0.001 | 0.001 | 1.187 | 0.086 * | 0.093 * | 1.186 | 0.085 * | 0.092 * |
| 528 | sun.travel | 0.620 | 0.019 | 0.030 | 0.350 | 0.000 | 0.000 | 1.092 | 0.095 * | 0.102 * | 1.092 | 0.094 * | 0.101 * |
| 529 | sun.travel | 0.656 | 0.035 | 0.041 | 0.349 | 0.001 | 0.001 | 0.989 | 0.103 * | 0.109 * | 0.990 | 0.102 * | 0.108 * |
| 530 | sun.travel | 0.698 | 0.043 | 0.043 | 0.348 | 0.001 | 0.002 | 0.879 | 0.109 * | 0.114 * | 0.881 | 0.108 * | 0.113 * |
| 531 | sun.travel | 0.740 | 0.042 | 0.041 | 0.346 | 0.002 | 0.003 | 0.766 | 0.113 * | 0.116 * | 0.769 | 0.112 * | 0.115 * |
| 532 | sun.travel | 0.776 | 0.036 | 0.034 | 0.343 | 0.003 | 0.003 | 0.650 | 0.115 * | 0.117 * | 0.655 | 0.114 * | 0.116 * |
| 533 | sun.travel | 0.801 | 0.026 | 0.024 | 0.340 | 0.004 | 0.004 | 0.536 | 0.115 * | 0.116 * | 0.542 | 0.113 * | 0.115 * |
| 534 | sun.travel | 0.816 | 0.014 | 0.013 | 0.335 | 0.004 | 0.005 | 0.425 | 0.111 * | 0.112 * | 0.432 | 0.110 * | 0.111 * |
| 535 | sun.travel | 0.819 | 0.003 | 0.004 | 0.330 | 0.005 | 0.005 | 0.320 | 0.105 * | 0.105 * | 0.328 | 0.104 * | 0.104 * |
| 536 | sun.travel | 0.812 | 0.007 | 0.012 | 0.325 | 0.006 | 0.006 | 0.225 | 0.095 * | 0.095 * | 0.234 | 0.094 * | 0.094 * |
| 537 | sun.travel | 0.798 | 0.014 | 0.017 | 0.318 | 0.006 | 0.007 | 0.143 | 0.082 * | 0.081 * | 0.152 | 0.081 * | 0.081 * |
| 538 | sun.travel | 0.780 | 0.017 | 0.017 | 0.311 | 0.007 | 0.007 | 0.077 | 0.066 | 0.064 | 0.087 | 0.065 | 0.064 |
| 539 | sun.travel | 0.765 | 0.016 | 0.015 | 0.304 | 0.008 | 0.008 | 0.032 | 0.045 | 0.043 | 0.042 | 0.045 | 0.043 |
| 540 hold | mercury.hold | 0.756 | 0.008 | 0.007 | 0.296 | 0.008 | 0.008 | 0.011 | 0.021 | 0.018 | 0.021 | 0.021 | 0.018 |
| 541 | mercury.hold | 0.757 | 0.000 | 0.002 | 0.287 | 0.009 | 0.009 | 0.009 | 0.002 | 0.001 | 0.019 | 0.002 | 0.001 |
| 542 | mercury.hold | 0.758 | 0.002 | 0.002 | 0.278 | 0.009 | 0.009 | 0.009 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 |
| 543 | mercury.hold | 0.760 | 0.002 | 0.002 | 0.268 | 0.010 | 0.010 | 0.009 | 0.000 | 0.000 | 0.018 | 0.000 | 0.000 |
| 544 | mercury.hold | 0.761 | 0.002 | 0.002 | 0.258 | 0.010 | 0.010 | 0.009 | 0.000 | 0.000 | 0.018 | 0.000 | 0.000 |
| 545 | mercury.hold | 0.763 | 0.002 | 0.002 | 0.248 | 0.010 | 0.011 | 0.009 | 0.000 | 0.000 | 0.018 | 0.000 | 0.000 |
| 546 | mercury.hold | 0.765 | 0.002 | 0.002 | 0.237 | 0.011 | 0.011 | 0.009 | 0.000 | 0.000 | 0.017 | 0.000 | 0.000 |
| 547 | mercury.hold | 0.766 | 0.002 | 0.002 | 0.226 | 0.011 | 0.011 | 0.009 | 0.000 | 0.000 | 0.017 | 0.000 | 0.000 |
| 548 | mercury.hold | 0.768 | 0.002 | 0.002 | 0.215 | 0.011 | 0.011 | 0.009 | 0.000 | 0.000 | 0.016 | 0.000 | 0.000 |
| 549 | mercury.hold | 0.769 | 0.002 | 0.002 | 0.204 | 0.011 | 0.011 | 0.009 | 0.000 | 0.000 | 0.016 | 0.000 | 0.000 |
| 550 | mercury.hold | 0.771 | 0.002 | 0.002 | 0.193 | 0.011 | 0.011 | 0.009 | 0.000 | 0.000 | 0.016 | 0.000 | 0.000 |
| 551 | mercury.hold | 0.773 | 0.002 | 0.002 | 0.182 | 0.011 | 0.011 | 0.009 | 0.000 | 0.000 | 0.015 | 0.000 | 0.000 |
