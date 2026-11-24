# smooth: saturn

Commit 6a45d89409f4b50b0d110bbdbc91accea10fc254. Capture rate 2. Parts: path. A calibration run: every number is written, the exit code is 0.

VERDICT: green. No number is over its limit.

## path

### landing (jupiter.travel into saturn.hold, frames 3366 to 3389, first frame of the hold 3390, window 3354 to 3401)

The last part of the travel that arrives at saturn, from 0.68 of its length, in the camera of saturn, in px of the master a film frame: sky is the turn of the camera (what the stars do), centre the way of the centre of the body, edge the growth of its radius, centre and edge the fastest point of its edge. Every value is over the mean of the curve in the landing. loss is what a curve loses over one film frame.

| run | curve | mean | at the start | hold's own | step at the seam | at | step between capture frames at the seam | at | largest loss | at | growth of the loss in the last 4 | at | climb after a fall | at | under the hold's own | at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | sky | 30.1 px | 2.375 | 0.052 | 0.002 | 3390 |  |  | 0.425 | 3376 | -0.000 | 3390 | 0.002 | 3389 | 0.002 | 3389 |
| whole frames | centre | 0.1973 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.373 | 0.316 | 0.013 | 3392 |  |  | 0.011 | 3390 | 0.001 | 3387 | 0.000 |  | -0.018 | 3390 |
| whole frames | edge | 7.47 px | 1.849 | 0.010 | 0.044 | 3389 |  |  | 0.293 | 3377 | -0.007 | 3387 | 0.000 |  | -0.003 | 3390 |
| whole frames | centre and edge | 7.667 px | 1.826 | 0.030 | 0.044 | 3389 |  |  | 0.285 | 3377 | -0.007 | 3387 | 0.000 |  | -0.004 | 3390 |
| rate 2 | sky | 29.87 px | 2.395 | 0.052 | 0.002 | 3389 + 1/2 | 0.001 | 3389 | 0.432 | 3376 | 0.000 | 3390 | 0.004 | 3389 + 1/2 | 0.003 | 3388 + 1/2 |
| rate 2 | centre | 0.1968 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.370 | 0.318 | 0.013 | 3392 | 0.007 | 3392 | 0.011 | 3390 | 0.001 | 3386 + 1/2 | 0.000 |  | -0.015 | 3390 |
| rate 2 | edge | 7.386 px | 1.872 | 0.010 | 0.050 | 3388 + 1/2 | 0.023 | 3388 + 1/2 | 0.297 | 3377 | -0.004 | 3386 + 1/2 | 0.000 |  | -0.001 | 3390 |
| rate 2 | centre and edge | 7.583 px | 1.848 | 0.031 | 0.049 | 3388 + 1/2 | 0.023 | 3388 + 1/2 | 0.289 | 3377 | -0.004 | 3386 + 1/2 | 0.000 |  | -0.002 | 3390 |

Limits: step 0.08 of the mean over one film frame from 2 film frames before the hold to 2 into it; the largest loss not in the last 4 film frames before the hold, and no loss there larger than the one a film frame before by more than 0.08; no loss under a third of the one a film frame before while the speed is over the hold's own; climb after a fall 0.03; not under the hold's own by more than 0.08. A loss and a speed over the hold's own count from 0.01 of the mean. The two rules of the loss (where the largest lies and how it grows, and letting go) are shown and not judged: the path alone does not part a good arrival from a bad one by them. A curve whose mean is under 0.5 px a film frame stands still in the picture: it is given over that floor, shown and not judged. The 12 film frames before the landing and the frames further into the hold are shown and not judged.

No judged number of the landing is over its limit.

- shown, not judged: whole frames, centre: loses most over one film frame (0.011 of the mean) at frame 3390, inside the last 4 film frames before the hold: the brake grows into the hold
- shown, not judged: rate 2, centre: loses most over one film frame (0.011 of the mean) at frame 3390, inside the last 4 film frames before the hold: the brake grows into the hold

Every film frame of the window. The curves are over their mean in the landing; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment | sky | step | step at rate 2 | centre | step | step at rate 2 | edge | step | step at rate 2 | centre and edge | step | step at rate 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3354 | jupiter.travel | 2.392 |  |  | 0.203 |  |  | 1.095 |  |  | 1.080 |  |  |
| 3355 | jupiter.travel | 2.391 | 0.001 | 0.001 | 0.219 | 0.016 | 0.016 | 1.204 | 0.109 * | 0.110 * | 1.187 | 0.108 * | 0.108 * |
| 3356 | jupiter.travel | 2.390 | 0.001 | 0.001 | 0.234 | 0.016 | 0.016 | 1.308 | 0.104 * | 0.105 * | 1.290 | 0.103 * | 0.103 * |
| 3357 | jupiter.travel | 2.388 | 0.001 | 0.001 | 0.250 | 0.015 | 0.015 | 1.406 | 0.098 * | 0.098 * | 1.387 | 0.096 * | 0.097 * |
| 3358 | jupiter.travel | 2.387 | 0.001 | 0.001 | 0.265 | 0.015 | 0.015 | 1.497 | 0.090 * | 0.091 * | 1.476 | 0.089 * | 0.089 * |
| 3359 | jupiter.travel | 2.386 | 0.001 | 0.001 | 0.279 | 0.015 | 0.014 | 1.579 | 0.082 * | 0.082 * | 1.556 | 0.081 * | 0.081 * |
| 3360 | jupiter.travel | 2.384 | 0.001 | 0.001 | 0.293 | 0.014 | 0.014 | 1.651 | 0.072 | 0.072 | 1.628 | 0.072 | 0.071 |
| 3361 | jupiter.travel | 2.383 | 0.001 | 0.001 | 0.307 | 0.013 | 0.013 | 1.714 | 0.062 | 0.062 | 1.690 | 0.062 | 0.061 |
| 3362 | jupiter.travel | 2.382 | 0.001 | 0.001 | 0.320 | 0.013 | 0.013 | 1.765 | 0.051 | 0.051 | 1.740 | 0.051 | 0.050 |
| 3363 | jupiter.travel | 2.381 | 0.001 | 0.001 | 0.332 | 0.012 | 0.012 | 1.805 | 0.040 | 0.039 | 1.780 | 0.040 | 0.039 |
| 3364 | jupiter.travel | 2.379 | 0.001 | 0.001 | 0.343 | 0.011 | 0.011 | 1.833 | 0.028 | 0.027 | 1.808 | 0.028 | 0.027 |
| 3365 | jupiter.travel | 2.378 | 0.001 | 0.001 | 0.354 | 0.011 | 0.011 | 1.849 | 0.016 | 0.015 | 1.825 | 0.016 | 0.015 |
| 3366 landing | jupiter.travel | 2.377 | 0.001 | 0.001 | 0.364 | 0.010 | 0.010 | 1.853 | 0.004 | 0.003 | 1.829 | 0.004 | 0.003 |
| 3367 | jupiter.travel | 2.375 | 0.002 | 0.003 | 0.373 | 0.009 | 0.009 | 1.849 | 0.004 | 0.004 | 1.826 | 0.003 | 0.004 |
| 3368 | jupiter.travel | 2.371 | 0.004 | 0.006 | 0.381 | 0.008 | 0.008 | 1.847 | 0.003 | 0.002 | 1.824 | 0.002 | 0.002 |
| 3369 | jupiter.travel | 2.364 | 0.008 | 0.012 | 0.389 | 0.007 | 0.007 | 1.845 | 0.001 | 0.001 | 1.823 | 0.001 | 0.001 |
| 3370 | jupiter.travel | 2.348 | 0.016 | 0.025 | 0.395 | 0.007 | 0.006 | 1.844 | 0.002 | 0.003 | 1.822 | 0.001 | 0.002 |
| 3371 | jupiter.travel | 2.315 | 0.033 | 0.051 | 0.401 | 0.006 | 0.006 | 1.839 | 0.004 | 0.008 | 1.818 | 0.004 | 0.008 |
| 3372 | jupiter.travel | 2.247 | 0.068 | 0.104 * | 0.406 | 0.005 | 0.005 | 1.827 | 0.012 | 0.022 | 1.807 | 0.011 | 0.021 |
| 3373 | jupiter.travel | 2.114 | 0.134 * | 0.196 * | 0.410 | 0.004 | 0.004 | 1.796 | 0.032 | 0.055 | 1.776 | 0.031 | 0.053 |
| 3374 | jupiter.travel | 1.874 | 0.240 * | 0.322 * | 0.412 | 0.003 | 0.003 | 1.720 | 0.075 | 0.121 * | 1.703 | 0.073 | 0.118 * |
| 3375 | jupiter.travel | 1.512 | 0.362 * | 0.420 * | 0.415 | 0.002 | 0.002 | 1.564 | 0.156 * | 0.222 * | 1.551 | 0.152 * | 0.216 * |
| 3376 | jupiter.travel | 1.087 | 0.425 * | 0.432 * | 0.416 | 0.001 | 0.001 | 1.311 | 0.254 * | 0.297 * | 1.304 | 0.247 * | 0.289 * |
| 3377 | jupiter.travel | 0.712 | 0.375 * | 0.367 * | 0.416 | 0.000 | 0.000 | 1.018 | 0.293 * | 0.297 * | 1.019 | 0.285 * | 0.289 * |
| 3378 | jupiter.travel | 0.453 | 0.259 * | 0.245 * | 0.415 | 0.001 | 0.001 | 0.785 | 0.233 * | 0.224 * | 0.792 | 0.227 * | 0.218 * |
| 3379 | jupiter.travel | 0.300 | 0.153 * | 0.142 * | 0.413 | 0.002 | 0.002 | 0.647 | 0.139 * | 0.129 * | 0.657 | 0.135 * | 0.125 * |
| 3380 | jupiter.travel | 0.214 | 0.086 * | 0.0804 * | 0.411 | 0.003 | 0.003 | 0.571 | 0.075 | 0.070 | 0.583 | 0.073 | 0.068 |
| 3381 | jupiter.travel | 0.161 | 0.053 | 0.050 | 0.407 | 0.004 | 0.004 | 0.523 | 0.049 | 0.047 | 0.536 | 0.048 | 0.046 |
| 3382 | jupiter.travel | 0.125 | 0.036 | 0.035 | 0.402 | 0.005 | 0.005 | 0.478 | 0.045 | 0.050 | 0.492 | 0.044 | 0.049 |
| 3383 | jupiter.travel | 0.097 | 0.028 | 0.027 | 0.397 | 0.005 | 0.006 | 0.424 | 0.053 | 0.062 | 0.439 | 0.052 | 0.061 |
| 3384 | jupiter.travel | 0.076 | 0.021 | 0.021 | 0.391 | 0.006 | 0.007 | 0.359 | 0.066 | 0.073 | 0.375 | 0.064 | 0.072 |
| 3385 | jupiter.travel | 0.060 | 0.015 | 0.015 | 0.383 | 0.007 | 0.008 | 0.284 | 0.075 | 0.077 | 0.302 | 0.073 | 0.076 |
| 3386 | jupiter.travel | 0.051 | 0.009 | 0.008 | 0.375 | 0.008 | 0.009 | 0.208 | 0.076 | 0.076 | 0.227 | 0.074 | 0.075 |
| 3387 | jupiter.travel | 0.047 | 0.004 | 0.003 | 0.366 | 0.009 | 0.009 | 0.140 | 0.069 | 0.068 | 0.160 | 0.068 | 0.067 |
| 3388 | jupiter.travel | 0.047 | 0.000 | 0.001 | 0.357 | 0.010 | 0.010 | 0.082 | 0.057 | 0.056 | 0.103 | 0.057 | 0.056 |
| 3389 | jupiter.travel | 0.049 | 0.002 | 0.002 | 0.346 | 0.011 | 0.011 | 0.038 | 0.044 | 0.043 | 0.060 | 0.044 | 0.043 |
| 3390 hold | saturn.hold | 0.051 | 0.002 | 0.002 | 0.335 | 0.011 | 0.012 | 0.013 | 0.025 | 0.023 | 0.034 | 0.025 | 0.023 |
| 3391 | saturn.hold | 0.052 | 0.000 | 0.000 | 0.323 | 0.012 | 0.012 | 0.010 | 0.003 | 0.001 | 0.031 | 0.004 | 0.002 |
| 3392 | saturn.hold | 0.052 | 0.000 | 0.000 | 0.310 | 0.013 | 0.013 | 0.010 | 0.000 | 0.000 | 0.030 | 0.001 | 0.001 |
| 3393 | saturn.hold | 0.052 | 0.000 | 0.000 | 0.297 | 0.013 | 0.014 | 0.010 | 0.000 | 0.000 | 0.029 | 0.001 | 0.001 |
| 3394 | saturn.hold | 0.052 | 0.000 | 0.000 | 0.283 | 0.014 | 0.014 | 0.010 | 0.000 | 0.000 | 0.028 | 0.001 | 0.001 |
| 3395 | saturn.hold | 0.052 | 0.000 | 0.000 | 0.268 | 0.015 | 0.015 | 0.010 | 0.000 | 0.000 | 0.027 | 0.001 | 0.001 |
| 3396 | saturn.hold | 0.052 | 0.000 | 0.000 | 0.253 | 0.015 | 0.016 | 0.010 | 0.000 | 0.000 | 0.026 | 0.001 | 0.001 |
| 3397 | saturn.hold | 0.052 | 0.000 | 0.000 | 0.237 | 0.016 | 0.016 | 0.010 | 0.000 | 0.000 | 0.025 | 0.001 | 0.001 |
| 3398 | saturn.hold | 0.052 | 0.000 | 0.000 | 0.221 | 0.016 | 0.016 | 0.010 | 0.000 | 0.000 | 0.024 | 0.001 | 0.001 |
| 3399 | saturn.hold | 0.052 | 0.000 | 0.000 | 0.204 | 0.017 | 0.017 | 0.010 | 0.000 | 0.000 | 0.023 | 0.001 | 0.001 |
| 3400 | saturn.hold | 0.053 | 0.000 | 0.000 | 0.187 | 0.017 | 0.017 | 0.010 | 0.000 | 0.000 | 0.022 | 0.001 | 0.001 |
| 3401 | saturn.hold | 0.053 | 0.000 | 0.000 | 0.170 | 0.017 | 0.017 | 0.010 | 0.000 | 0.000 | 0.021 | 0.001 | 0.001 |
