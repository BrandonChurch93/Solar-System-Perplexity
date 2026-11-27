# smooth: saturn

Commit 5dd60616578492129874abd81ce19cc1d89d5fa9. Capture rate 2. Parts: path. A calibration run: every number is written, the exit code is 0.

VERDICT: green. No number is over its limit.

## path

### landing (jupiter.travel into saturn.hold, frames 3366 to 3389, first frame of the hold 3390, window 3354 to 3401)

The last part of the travel that arrives at saturn, from 0.68 of its length, in the camera of saturn, in px of the master a film frame: sky is the turn of the camera (what the stars do), centre the way of the centre of the body, edge the growth of its radius, centre and edge the fastest point of its edge. Every value is over the mean of the curve in the landing. loss is what a curve loses over one film frame.

| run | curve | mean | at the start | hold's own | step at the seam | at | step between capture frames at the seam | at | largest loss | at | growth of the loss in the last 4 | at | climb after a fall | at | under the hold's own | at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | sky | 21.61 px | 2.288 | 0.065 | 0.003 | 3390 |  |  | 0.388 | 3377 | -0.000 | 3390 | 0.002 | 3389 | 0.003 | 3389 |
| whole frames | centre | 0.2131 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.464 | 0.287 | 0.016 | 3390 |  |  | 0.016 | 3390 | 0.001 | 3387 | 0.000 |  | -0.018 | 3390 |
| whole frames | edge | 7.372 px | 1.849 | 0.010 | 0.044 | 3389 |  |  | 0.293 | 3377 | -0.007 | 3387 | 0.000 |  | -0.003 | 3390 |
| whole frames | centre and edge | 7.585 px | 1.828 | 0.029 | 0.044 | 3389 |  |  | 0.285 | 3377 | -0.007 | 3387 | 0.000 |  | -0.004 | 3390 |
| rate 2 | sky | 21.46 px | 2.307 | 0.066 | 0.003 | 3389 + 1/2 | 0.001 | 3389 | 0.428 | 3377 | 0.000 | 3390 | 0.005 | 3389 + 1/2 | 0.004 | 3388 + 1/2 |
| rate 2 | centre | 0.2123 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.462 | 0.288 | 0.016 | 3390 | 0.008 | 3390 | 0.016 | 3390 | 0.001 | 3386 + 1/2 | 0.000 |  | -0.015 | 3390 |
| rate 2 | edge | 7.29 px | 1.872 | 0.010 | 0.050 | 3388 + 1/2 | 0.023 | 3388 + 1/2 | 0.297 | 3377 | -0.004 | 3386 + 1/2 | 0.000 |  | -0.001 | 3390 |
| rate 2 | centre and edge | 7.502 px | 1.849 | 0.029 | 0.050 | 3388 + 1/2 | 0.023 | 3388 + 1/2 | 0.289 | 3377 | -0.004 | 3386 + 1/2 | 0.000 |  | -0.002 | 3390 |

Limits: step 0.08 of the mean over one film frame from 2 film frames before the hold to 2 into it; the largest loss not in the last 4 film frames before the hold, and no loss there larger than the one a film frame before by more than 0.08; no loss under a third of the one a film frame before while the speed is over the hold's own; climb after a fall 0.03; not under the hold's own by more than 0.08. A loss and a speed over the hold's own count from 0.01 of the mean. The two rules of the loss (where the largest lies and how it grows, and letting go) are shown and not judged: the path alone does not part a good arrival from a bad one by them. A curve whose mean is under 0.5 px a film frame stands still in the picture: it is given over that floor, shown and not judged. The 12 film frames before the landing and the frames further into the hold are shown and not judged.

No judged number of the landing is over its limit.

- shown, not judged: whole frames, centre: loses most over one film frame (0.016 of the mean) at frame 3390, inside the last 4 film frames before the hold: the brake grows into the hold
- shown, not judged: rate 2, centre: loses most over one film frame (0.016 of the mean) at frame 3390, inside the last 4 film frames before the hold: the brake grows into the hold

Every film frame of the window. The curves are over their mean in the landing; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment | sky | step | step at rate 2 | centre | step | step at rate 2 | edge | step | step at rate 2 | centre and edge | step | step at rate 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3354 | jupiter.travel | 4.388 |  |  | 0.350 |  |  | 1.094 |  |  | 1.087 |  |  |
| 3355 | jupiter.travel | 4.080 | 0.308 * | 0.383 * | 0.363 | 0.013 | 0.013 | 1.204 | 0.109 * | 0.110 * | 1.194 | 0.107 * | 0.108 * |
| 3356 | jupiter.travel | 3.662 | 0.418 * | 0.475 * | 0.375 | 0.012 | 0.012 | 1.308 | 0.104 * | 0.105 * | 1.296 | 0.102 * | 0.103 * |
| 3357 | jupiter.travel | 3.168 | 0.494 * | 0.510 * | 0.387 | 0.012 | 0.012 | 1.406 | 0.098 * | 0.098 * | 1.392 | 0.096 * | 0.096 * |
| 3358 | jupiter.travel | 2.678 | 0.490 * | 0.485 * | 0.398 | 0.011 | 0.011 | 1.497 | 0.090 * | 0.090 * | 1.481 | 0.089 * | 0.089 * |
| 3359 | jupiter.travel | 2.369 | 0.308 * | 0.274 * | 0.408 | 0.010 | 0.010 | 1.579 | 0.082 * | 0.082 * | 1.561 | 0.0803 * | 0.0801 * |
| 3360 | jupiter.travel | 2.341 | 0.029 | 0.014 | 0.418 | 0.010 | 0.010 | 1.651 | 0.072 | 0.072 | 1.632 | 0.071 | 0.071 |
| 3361 | jupiter.travel | 2.333 | 0.008 | 0.008 | 0.427 | 0.009 | 0.009 | 1.714 | 0.062 | 0.062 | 1.693 | 0.061 | 0.061 |
| 3362 | jupiter.travel | 2.325 | 0.008 | 0.008 | 0.435 | 0.008 | 0.008 | 1.765 | 0.051 | 0.051 | 1.744 | 0.051 | 0.050 |
| 3363 | jupiter.travel | 2.318 | 0.008 | 0.008 | 0.442 | 0.007 | 0.007 | 1.805 | 0.040 | 0.039 | 1.783 | 0.039 | 0.038 |
| 3364 | jupiter.travel | 2.310 | 0.008 | 0.008 | 0.449 | 0.007 | 0.006 | 1.833 | 0.028 | 0.027 | 1.811 | 0.028 | 0.027 |
| 3365 | jupiter.travel | 2.303 | 0.007 | 0.007 | 0.455 | 0.006 | 0.006 | 1.849 | 0.016 | 0.015 | 1.827 | 0.016 | 0.015 |
| 3366 landing | jupiter.travel | 2.295 | 0.007 | 0.007 | 0.460 | 0.005 | 0.005 | 1.853 | 0.004 | 0.003 | 1.831 | 0.004 | 0.003 |
| 3367 | jupiter.travel | 2.288 | 0.008 | 0.009 | 0.464 | 0.004 | 0.004 | 1.849 | 0.004 | 0.004 | 1.828 | 0.003 | 0.004 |
| 3368 | jupiter.travel | 2.278 | 0.010 | 0.012 | 0.467 | 0.003 | 0.003 | 1.847 | 0.003 | 0.002 | 1.826 | 0.002 | 0.002 |
| 3369 | jupiter.travel | 2.265 | 0.013 | 0.017 | 0.469 | 0.002 | 0.002 | 1.845 | 0.001 | 0.001 | 1.824 | 0.001 | 0.001 |
| 3370 | jupiter.travel | 2.244 | 0.021 | 0.029 | 0.470 | 0.001 | 0.001 | 1.844 | 0.002 | 0.003 | 1.823 | 0.002 | 0.003 |
| 3371 | jupiter.travel | 2.207 | 0.037 | 0.054 | 0.470 | 0.000 | 0.000 | 1.839 | 0.004 | 0.008 | 1.819 | 0.004 | 0.008 |
| 3372 | jupiter.travel | 2.137 | 0.070 | 0.104 * | 0.470 | 0.001 | 0.001 | 1.827 | 0.012 | 0.022 | 1.807 | 0.012 | 0.021 |
| 3373 | jupiter.travel | 2.005 | 0.132 * | 0.191 * | 0.468 | 0.002 | 0.002 | 1.796 | 0.032 | 0.055 | 1.776 | 0.031 | 0.053 |
| 3374 | jupiter.travel | 1.772 | 0.233 * | 0.307 * | 0.466 | 0.003 | 0.003 | 1.720 | 0.075 | 0.121 * | 1.703 | 0.073 | 0.118 * |
| 3375 | jupiter.travel | 1.471 | 0.301 * | 0.283 * | 0.462 | 0.003 | 0.004 | 1.564 | 0.156 * | 0.222 * | 1.551 | 0.152 * | 0.216 * |
| 3376 | jupiter.travel | 1.294 | 0.178 * | 0.318 * | 0.458 | 0.004 | 0.005 | 1.311 | 0.254 * | 0.297 * | 1.304 | 0.247 * | 0.289 * |
| 3377 | jupiter.travel | 0.906 | 0.388 * | 0.428 * | 0.452 | 0.005 | 0.006 | 1.018 | 0.293 * | 0.297 * | 1.019 | 0.285 * | 0.289 * |
| 3378 | jupiter.travel | 0.576 | 0.330 * | 0.312 * | 0.446 | 0.006 | 0.007 | 0.785 | 0.233 * | 0.224 * | 0.793 | 0.227 * | 0.218 * |
| 3379 | jupiter.travel | 0.381 | 0.194 * | 0.181 * | 0.439 | 0.007 | 0.008 | 0.647 | 0.139 * | 0.129 * | 0.657 | 0.135 * | 0.126 * |
| 3380 | jupiter.travel | 0.271 | 0.110 * | 0.102 * | 0.431 | 0.008 | 0.009 | 0.571 | 0.075 | 0.070 | 0.584 | 0.074 | 0.068 |
| 3381 | jupiter.travel | 0.204 | 0.067 | 0.063 | 0.422 | 0.009 | 0.010 | 0.523 | 0.049 | 0.047 | 0.536 | 0.048 | 0.046 |
| 3382 | jupiter.travel | 0.158 | 0.046 | 0.045 | 0.412 | 0.010 | 0.010 | 0.478 | 0.045 | 0.050 | 0.491 | 0.045 | 0.049 |
| 3383 | jupiter.travel | 0.123 | 0.035 | 0.034 | 0.401 | 0.011 | 0.011 | 0.424 | 0.053 | 0.062 | 0.439 | 0.053 | 0.061 |
| 3384 | jupiter.travel | 0.096 | 0.027 | 0.026 | 0.390 | 0.012 | 0.012 | 0.359 | 0.066 | 0.073 | 0.374 | 0.064 | 0.072 |
| 3385 | jupiter.travel | 0.076 | 0.019 | 0.018 | 0.377 | 0.012 | 0.013 | 0.284 | 0.075 | 0.077 | 0.301 | 0.073 | 0.076 |
| 3386 | jupiter.travel | 0.065 | 0.012 | 0.011 | 0.364 | 0.013 | 0.014 | 0.208 | 0.076 | 0.076 | 0.227 | 0.074 | 0.075 |
| 3387 | jupiter.travel | 0.060 | 0.005 | 0.004 | 0.350 | 0.014 | 0.014 | 0.140 | 0.069 | 0.068 | 0.159 | 0.068 | 0.067 |
| 3388 | jupiter.travel | 0.060 | 0.000 | 0.002 | 0.336 | 0.015 | 0.015 | 0.082 | 0.057 | 0.056 | 0.102 | 0.057 | 0.056 |
| 3389 | jupiter.travel | 0.062 | 0.002 | 0.003 | 0.320 | 0.015 | 0.016 | 0.038 | 0.044 | 0.043 | 0.058 | 0.044 | 0.043 |
| 3390 hold | saturn.hold | 0.065 | 0.003 | 0.002 | 0.305 | 0.016 | 0.016 | 0.013 | 0.025 | 0.023 | 0.033 | 0.025 | 0.023 |
| 3391 | saturn.hold | 0.065 | 0.000 | 0.000 | 0.292 | 0.012 | 0.012 | 0.010 | 0.003 | 0.001 | 0.029 | 0.004 | 0.002 |
| 3392 | saturn.hold | 0.065 | 0.000 | 0.000 | 0.281 | 0.012 | 0.012 | 0.010 | 0.000 | 0.000 | 0.028 | 0.001 | 0.001 |
| 3393 | saturn.hold | 0.065 | 0.000 | 0.000 | 0.269 | 0.012 | 0.013 | 0.010 | 0.000 | 0.000 | 0.027 | 0.001 | 0.001 |
| 3394 | saturn.hold | 0.066 | 0.000 | 0.000 | 0.256 | 0.013 | 0.013 | 0.010 | 0.000 | 0.000 | 0.027 | 0.001 | 0.001 |
| 3395 | saturn.hold | 0.066 | 0.000 | 0.000 | 0.243 | 0.013 | 0.014 | 0.010 | 0.000 | 0.000 | 0.026 | 0.001 | 0.001 |
| 3396 | saturn.hold | 0.066 | 0.000 | 0.000 | 0.229 | 0.014 | 0.014 | 0.010 | 0.000 | 0.000 | 0.025 | 0.001 | 0.001 |
| 3397 | saturn.hold | 0.066 | 0.000 | 0.000 | 0.215 | 0.014 | 0.015 | 0.010 | 0.000 | 0.000 | 0.024 | 0.001 | 0.001 |
| 3398 | saturn.hold | 0.066 | 0.000 | 0.000 | 0.200 | 0.015 | 0.015 | 0.010 | 0.000 | 0.000 | 0.023 | 0.001 | 0.001 |
| 3399 | saturn.hold | 0.066 | 0.000 | 0.000 | 0.185 | 0.015 | 0.015 | 0.010 | 0.000 | 0.000 | 0.022 | 0.001 | 0.001 |
| 3400 | saturn.hold | 0.066 | 0.000 | 0.000 | 0.169 | 0.015 | 0.016 | 0.010 | 0.000 | 0.000 | 0.021 | 0.001 | 0.001 |
| 3401 | saturn.hold | 0.067 | 0.000 | 0.000 | 0.154 | 0.016 | 0.016 | 0.010 | 0.000 | 0.000 | 0.020 | 0.001 | 0.001 |
