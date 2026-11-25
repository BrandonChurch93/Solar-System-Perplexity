# smooth: saturn

Commit 690afebef51deca42701692d9a18810593b2ad90. Capture rate 2. Parts: path, pictures, place, parity, counts.

Joined from the files of 1 machine(s), nothing is rendered, measured or counted here. The path: ../work/p6/sa9/03/saturn (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The pictures: the dive ../work/p6/sj2/01/saturn-dive-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), ../work/p6/sj2/02/saturn-dive-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz); the rise ../work/p6/sj2/03/saturn-rise-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), ../work/p6/sj2/04/saturn-rise-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The place: ../work/p6/sa9/03/saturn (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The parity: ../work/p6/sa9/03/saturn (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The counts: ../work/p6/sj2/05/saturn (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

VERDICT: green. No number is over its limit.

## path

### dive (saturn.dive, frames 3540 to 3629, T at 3589, window 3528 to 3641)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.007337 log of the height a film frame | 1.228 | 3590 | 0.066 | 3544 |  |  | 0.009 | 0.008 | 0.000 | 0.000 | 0.001 at 3641 |
| whole frames | turn | 0.2174 degrees a film frame | 1.973 | 3586 | 0.062 | 3573 |  |  | 0.000 | 0.001 | 0.000 | 0.000 | 0.000 at 3534 |
| whole frames | speed | 2.932 px a film frame at the place | 1.572 | 3609 | 0.066 over 8 | 3543 |  |  | 0.009 | 0.020 | 0.000 | 0.000 | 0.007 at 3641 |
| rate 2 | rate | 0.007313 log of the height a film frame | 1.232 | 3599 + 1/2 | 0.067 | 3543 + 1/2 | 0.034 | 3543 | 0.011 | 0.007 | 0.000 | 0.000 | 0.001 at 3641 + 1/2 |
| rate 2 | turn | 0.2163 degrees a film frame | 1.984 | 3586 | 0.062 | 3573 | 0.031 | 3573 | 0.000 | 0.001 | 0.000 | 0.000 | 0.000 at 3534 |
| rate 2 | speed | 2.927 px a film frame at the place | 1.576 | 3608 + 1/2 | 0.068 over 8 | 3543 | 0.035 over 8 | 3542 + 1/2 | 0.011 | 0.029 | 0.000 | 0.006 over 8 | 0.007 at 3641 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the plane of the rings between their two radii, where the globe does not hide it. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 3630, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.0208 of its height a film frame, the mean of its first 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 1.00 at frame 3638 + 1/2, limit 0.87; inside the dive itself 1.00 at frame 3630. Largest step from one capture frame to the next 0.04 at frame 3624 + 1/2, shown. The part along the surface view's own direction of motion: 1.00 at the lowest, lowest 1.00 at frame 3638 + 1/2, shown; under 0 the eye goes back.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3528 | hold orbit | 4.489e+0 | 0.034 |  |  | 0.213 |  |  | 0.222 |  |  | 0 |
| 3529 | hold orbit | 4.488e+0 | 0.034 | 0.000 | 0.000 | 0.214 | 0.000 | 0.000 | 0.220 | 0.002 | 0.002 | 8 |
| 3530 | hold orbit | 4.487e+0 | 0.034 | 0.000 | 0.000 | 0.214 | 0.000 | 0.000 | 0.218 | 0.002 | 0.002 | 8 |
| 3531 | hold orbit | 4.486e+0 | 0.034 | 0.000 | 0.000 | 0.214 | 0.000 | 0.000 | 0.217 | 0.002 | 0.002 | 8 |
| 3532 | hold orbit | 4.485e+0 | 0.034 | 0.000 | 0.000 | 0.215 | 0.000 | 0.000 | 0.215 | 0.002 | 0.002 | 8 |
| 3533 | hold orbit | 4.484e+0 | 0.034 | 0.000 | 0.000 | 0.215 | 0.000 | 0.000 | 0.213 | 0.002 | 0.002 | 8 |
| 3534 | hold orbit | 4.483e+0 | 0.034 | 0.000 | 0.000 | 0.216 | 0.000 | 0.000 | 0.212 | 0.002 | 0.002 | 8 |
| 3535 | hold orbit | 4.482e+0 | 0.034 | 0.000 | 0.000 | 0.216 | 0.000 | 0.000 | 0.210 | 0.002 | 0.002 | 8 |
| 3536 | hold orbit | 4.481e+0 | 0.034 | 0.000 | 0.000 | 0.217 | 0.000 | 0.000 | 0.209 | 0.002 | 0.002 | 8 |
| 3537 | hold orbit | 4.479e+0 | 0.034 | 0.000 | 0.000 | 0.217 | 0.000 | 0.000 | 0.207 | 0.002 | 0.002 | 8 |
| 3538 | hold orbit | 4.478e+0 | 0.034 | 0.000 | 0.000 | 0.218 | 0.000 | 0.000 | 0.205 | 0.002 | 0.002 | 8 |
| 3539 | hold orbit | 4.477e+0 | 0.034 | 0.000 | 0.000 | 0.218 | 0.000 | 0.000 | 0.204 | 0.002 | 0.002 | 8 |
| 3540 first | dive orbit | 4.476e+0 | 0.034 | 0.000 | 0.002 | 0.219 | 0.000 | 0.000 | 0.202 | 0.001 | 0.001 | 8 |
| 3541 | dive orbit | 4.475e+0 | 0.043 | 0.009 | 0.025 | 0.219 | 0.000 | 0.000 | 0.211 | 0.009 | 0.027 | 8 |
| 3542 | dive orbit | 4.472e+0 | 0.079 | 0.036 | 0.054 | 0.219 | 0.000 | 0.000 | 0.252 | 0.040 | 0.062 | 8 |
| 3543 | dive orbit | 4.467e+0 | 0.141 | 0.061 | 0.067 | 0.219 | 0.000 | 0.000 | 0.318 | 0.066 | 0.068 | 8 |
| 3544 | dive orbit | 4.461e+0 | 0.207 | 0.066 | 0.066 | 0.219 | 0.000 | 0.001 | 0.374 | 0.057 | 0.055 | 8 |
| 3545 | dive orbit | 4.452e+0 | 0.271 | 0.064 | 0.064 | 0.221 | 0.002 | 0.003 | 0.424 | 0.049 | 0.049 | 8 |
| 3546 | dive orbit | 4.441e+0 | 0.332 | 0.062 | 0.062 | 0.225 | 0.004 | 0.006 | 0.467 | 0.043 | 0.043 | 8 |
| 3547 | dive orbit | 4.428e+0 | 0.392 | 0.060 | 0.060 | 0.232 | 0.007 | 0.010 | 0.505 | 0.038 | 0.037 | 8 |
| 3548 | dive orbit | 4.414e+0 | 0.450 | 0.058 | 0.058 | 0.243 | 0.012 | 0.015 | 0.538 | 0.033 | 0.032 | 8 |
| 3549 | dive orbit | 4.397e+0 | 0.506 | 0.056 | 0.056 | 0.260 | 0.017 | 0.021 | 0.567 | 0.029 | 0.028 | 8 |
| 3550 | dive orbit | 4.379e+0 | 0.559 | 0.054 | 0.053 | 0.283 | 0.023 | 0.027 | 0.592 | 0.026 | 0.025 | 8 |
| 3551 | dive orbit | 4.360e+0 | 0.611 | 0.052 | 0.051 | 0.312 | 0.029 | 0.033 | 0.616 | 0.023 | 0.023 | 8 |
| 3552 | dive orbit | 4.339e+0 | 0.660 | 0.049 | 0.049 | 0.348 | 0.035 | 0.040 | 0.638 | 0.022 | 0.023 | 8 |
| 3553 | dive orbit | 4.316e+0 | 0.708 | 0.047 | 0.047 | 0.389 | 0.042 | 0.046 | 0.661 | 0.023 | 0.024 | 8 |
| 3554 | dive orbit | 4.292e+0 | 0.753 | 0.045 | 0.045 | 0.437 | 0.048 | 0.051 | 0.686 | 0.024 | 0.026 | 8 |
| 3555 | dive orbit | 4.267e+0 | 0.796 | 0.043 | 0.043 | 0.490 | 0.053 | 0.055 | 0.712 | 0.027 | 0.027 | 8 |
| 3556 | dive orbit | 4.241e+0 | 0.837 | 0.041 | 0.041 | 0.545 | 0.055 | 0.056 | 0.737 | 0.025 | 0.024 | 8 |
| 3557 | dive orbit | 4.214e+0 | 0.876 | 0.039 | 0.039 | 0.601 | 0.056 | 0.057 | 0.758 | 0.022 | 0.021 | 8 |
| 3558 | dive orbit | 4.186e+0 | 0.913 | 0.037 | 0.037 | 0.658 | 0.057 | 0.058 | 0.777 | 0.018 | 0.018 | 8 |
| 3559 | dive orbit | 4.157e+0 | 0.948 | 0.035 | 0.035 | 0.716 | 0.058 | 0.059 | 0.792 | 0.015 | 0.015 | 8 |
| 3560 | dive orbit | 4.127e+0 | 0.981 | 0.033 | 0.033 | 0.775 | 0.058 | 0.059 | 0.804 | 0.012 | 0.012 | 8 |
| 3561 | dive orbit | 4.096e+0 | 1.012 | 0.031 | 0.031 | 0.833 | 0.059 | 0.059 | 0.814 | 0.010 | 0.010 | 8 |
| 3562 | dive orbit | 4.065e+0 | 1.041 | 0.029 | 0.029 | 0.893 | 0.059 | 0.060 | 0.822 | 0.008 | 0.008 | 8 |
| 3563 | dive orbit | 4.034e+0 | 1.068 | 0.027 | 0.027 | 0.952 | 0.060 | 0.060 | 0.828 | 0.006 | 0.006 | 8 |
| 3564 | dive orbit | 4.001e+0 | 1.092 | 0.025 | 0.024 | 1.012 | 0.060 | 0.060 | 0.833 | 0.005 | 0.004 | 8 |
| 3565 | dive orbit | 3.969e+0 | 1.115 | 0.023 | 0.022 | 1.072 | 0.060 | 0.061 | 0.836 | 0.003 | 0.003 | 8 |
| 3566 | dive orbit | 3.936e+0 | 1.135 | 0.021 | 0.020 | 1.133 | 0.060 | 0.061 | 0.837 | 0.002 | 0.002 | 8 |
| 3567 | dive orbit | 3.903e+0 | 1.154 | 0.018 | 0.018 | 1.193 | 0.061 | 0.061 | 0.838 | 0.001 | 0.001 | 8 |
| 3568 | dive orbit | 3.869e+0 | 1.170 | 0.016 | 0.016 | 1.254 | 0.061 | 0.061 | 0.839 | 0.001 | 0.001 | 8 |
| 3569 | dive orbit | 3.836e+0 | 1.185 | 0.014 | 0.014 | 1.315 | 0.061 | 0.061 | 0.840 | 0.001 | 0.001 | 8 |
| 3570 | dive orbit | 3.802e+0 | 1.197 | 0.012 | 0.012 | 1.377 | 0.061 | 0.062 | 0.842 | 0.002 | 0.003 | 8 |
| 3571 | dive orbit | 3.769e+0 | 1.207 | 0.010 | 0.010 | 1.438 | 0.061 | 0.062 | 0.845 | 0.004 | 0.005 | 8 |
| 3572 | dive orbit | 3.735e+0 | 1.215 | 0.008 | 0.008 | 1.499 | 0.062 | 0.062 | 0.851 | 0.006 | 0.008 | 8 |
| 3573 | dive orbit | 3.702e+0 | 1.221 | 0.006 | 0.006 | 1.561 | 0.062 | 0.062 | 0.860 | 0.009 | 0.010 | 8 |
| 3574 | dive orbit | 3.669e+0 | 1.225 | 0.004 | 0.004 | 1.621 | 0.060 | 0.060 | 0.869 | 0.009 | 0.009 | 8 |
| 3575 | dive orbit | 3.636e+0 | 1.227 | 0.002 | 0.002 | 1.676 | 0.055 | 0.055 | 0.876 | 0.007 | 0.007 | 8 |
| 3576 | dive orbit | 3.603e+0 | 1.228 | 0.000 | 0.000 | 1.727 | 0.051 | 0.050 | 0.883 | 0.007 | 0.007 | 8 |
| 3577 | dive orbit | 3.571e+0 | 1.228 | 0.000 | 0.000 | 1.773 | 0.046 | 0.046 | 0.891 | 0.008 | 0.009 | 8 |
| 3578 | dive orbit | 3.539e+0 | 1.228 | 0.000 | 0.000 | 1.814 | 0.041 | 0.041 | 0.900 | 0.009 | 0.010 | 8 |
| 3579 | dive orbit | 3.507e+0 | 1.228 | 0.000 | 0.000 | 1.851 | 0.037 | 0.036 | 0.911 | 0.011 | 0.012 | 8 |
| 3580 | dive orbit | 3.476e+0 | 1.228 | 0.000 | 0.000 | 1.882 | 0.032 | 0.031 | 0.924 | 0.013 | 0.015 | 8 |
| 3581 | dive orbit | 3.445e+0 | 1.228 | 0.000 | 0.000 | 1.909 | 0.027 | 0.027 | 0.940 | 0.016 | 0.017 | 8 |
| 3582 | dive orbit | 3.414e+0 | 1.228 | 0.000 | 0.000 | 1.932 | 0.022 | 0.022 | 0.957 | 0.018 | 0.018 | 8 |
| 3583 | dive orbit | 3.383e+0 | 1.228 | 0.000 | 0.000 | 1.949 | 0.018 | 0.017 | 0.975 | 0.018 | 0.018 | 8 |
| 3584 | dive orbit | 3.353e+0 | 1.228 | 0.000 | 0.000 | 1.962 | 0.013 | 0.012 | 0.993 | 0.017 | 0.017 | 8 |
| 3585 | dive orbit | 3.323e+0 | 1.228 | 0.000 | 0.000 | 1.970 | 0.008 | 0.007 | 1.008 | 0.016 | 0.015 | 8 |
| 3586 | dive orbit | 3.293e+0 | 1.228 | 0.000 | 0.000 | 1.973 | 0.003 | 0.003 | 1.022 | 0.014 | 0.013 | 8 |
| 3587 | dive orbit | 3.264e+0 | 1.228 | 0.000 | 0.000 | 1.971 | 0.002 | 0.007 | 1.034 | 0.012 | 0.012 | 8 |
| 3588 | dive orbit | 3.234e+0 | 1.228 | 0.000 | 0.000 | 1.960 | 0.010 | 0.016 | 1.046 | 0.012 | 0.013 | 8 |
| 3589 T | dive terrain | 3.205e+0 | 1.228 | 0.000 | 0.000 | 1.942 | 0.019 | 0.024 | 1.060 | 0.014 | 0.016 | 8 |
| 3590 | dive terrain | 3.176e+0 | 1.228 | 0.000 | 0.000 | 1.915 | 0.027 | 0.032 | 1.077 | 0.017 | 0.020 | 8 |
| 3591 | dive terrain | 3.148e+0 | 1.228 | 0.000 | 0.000 | 1.880 | 0.035 | 0.040 | 1.099 | 0.022 | 0.026 | 8 |
| 3592 | dive terrain | 3.120e+0 | 1.228 | 0.000 | 0.000 | 1.837 | 0.043 | 0.049 | 1.128 | 0.029 | 0.034 | 8 |
| 3593 | dive terrain | 3.092e+0 | 1.228 | 0.000 | 0.000 | 1.786 | 0.051 | 0.054 | 1.164 | 0.036 | 0.039 | 8 |
| 3594 | dive terrain | 3.064e+0 | 1.228 | 0.000 | 0.000 | 1.732 | 0.054 | 0.054 | 1.203 | 0.039 | 0.039 | 8 |
| 3595 | dive terrain | 3.037e+0 | 1.228 | 0.000 | 0.000 | 1.677 | 0.054 | 0.054 | 1.241 | 0.038 | 0.038 | 8 |
| 3596 | dive terrain | 3.009e+0 | 1.228 | 0.000 | 0.000 | 1.623 | 0.054 | 0.054 | 1.277 | 0.036 | 0.036 | 8 |
| 3597 | dive terrain | 2.982e+0 | 1.228 | 0.000 | 0.000 | 1.569 | 0.054 | 0.055 | 1.311 | 0.034 | 0.034 | 8 |
| 3598 | dive terrain | 2.956e+0 | 1.228 | 0.000 | 0.000 | 1.515 | 0.054 | 0.055 | 1.344 | 0.032 | 0.032 | 8 |
| 3599 | dive terrain | 2.929e+0 | 1.228 | 0.000 | 0.000 | 1.460 | 0.054 | 0.055 | 1.374 | 0.030 | 0.030 | 8 |
| 3600 | dive terrain | 2.903e+0 | 1.228 | 0.000 | 0.000 | 1.406 | 0.054 | 0.055 | 1.402 | 0.028 | 0.028 | 8 |
| 3601 | dive terrain | 2.877e+0 | 1.228 | 0.000 | 0.000 | 1.352 | 0.054 | 0.055 | 1.427 | 0.026 | 0.026 | 8 |
| 3602 | dive terrain | 2.851e+0 | 1.228 | 0.000 | 0.000 | 1.297 | 0.054 | 0.055 | 1.451 | 0.024 | 0.024 | 8 |
| 3603 | dive terrain | 2.825e+0 | 1.228 | 0.000 | 0.000 | 1.243 | 0.055 | 0.055 | 1.473 | 0.022 | 0.022 | 8 |
| 3604 | dive terrain | 2.800e+0 | 1.228 | 0.000 | 0.000 | 1.188 | 0.055 | 0.055 | 1.494 | 0.021 | 0.021 | 8 |
| 3605 | dive terrain | 2.775e+0 | 1.228 | 0.000 | 0.000 | 1.134 | 0.055 | 0.055 | 1.514 | 0.020 | 0.020 | 8 |
| 3606 | dive terrain | 2.750e+0 | 1.228 | 0.000 | 0.000 | 1.079 | 0.055 | 0.055 | 1.534 | 0.020 | 0.022 | 8 |
| 3607 | dive terrain | 2.725e+0 | 1.228 | 0.000 | 0.000 | 1.024 | 0.055 | 0.055 | 1.556 | 0.022 | 0.022 | 8 |
| 3608 | dive terrain | 2.701e+0 | 1.228 | 0.000 | 0.000 | 0.969 | 0.055 | 0.055 | 1.569 | 0.013 | 0.012 | 8 |
| 3609 | dive terrain | 2.677e+0 | 1.228 | 0.000 | 0.000 | 0.914 | 0.055 | 0.055 | 1.572 | 0.003 | 0.003 | 8 |
| 3610 | dive terrain | 2.653e+0 | 1.228 | 0.000 | 0.000 | 0.859 | 0.055 | 0.055 | 1.567 | 0.006 | 0.011 | 8 |
| 3611 | dive terrain | 2.629e+0 | 1.228 | 0.000 | 0.000 | 0.804 | 0.055 | 0.055 | 1.553 | 0.014 | 0.018 | 8 |
| 3612 | dive terrain | 2.606e+0 | 1.228 | 0.000 | 0.000 | 0.749 | 0.055 | 0.055 | 1.533 | 0.020 | 0.023 | 8 |
| 3613 | dive terrain | 2.582e+0 | 1.227 | 0.000 | 0.003 | 0.694 | 0.055 | 0.055 | 1.508 | 0.025 | 0.027 | 8 |
| 3614 | dive terrain | 2.559e+0 | 1.221 | 0.006 | 0.013 | 0.639 | 0.055 | 0.056 | 1.481 | 0.027 | 0.029 | 8 |
| 3615 | dive terrain | 2.537e+0 | 1.204 | 0.017 | 0.024 | 0.584 | 0.055 | 0.056 | 1.451 | 0.030 | 0.034 | 8 |
| 3616 | dive terrain | 2.515e+0 | 1.176 | 0.028 | 0.035 | 0.528 | 0.055 | 0.056 | 1.415 | 0.036 | 0.040 | 8 |
| 3617 | dive terrain | 2.494e+0 | 1.137 | 0.039 | 0.046 | 0.473 | 0.055 | 0.056 | 1.372 | 0.042 | 0.046 | 8 |
| 3618 | dive terrain | 2.474e+0 | 1.086 | 0.050 | 0.057 | 0.417 | 0.056 | 0.056 | 1.324 | 0.048 | 0.050 | 8 |
| 3619 | dive terrain | 2.455e+0 | 1.027 | 0.059 | 0.060 | 0.362 | 0.056 | 0.056 | 1.273 | 0.051 | 0.054 | 8 |
| 3620 | dive terrain | 2.438e+0 | 0.967 | 0.060 | 0.060 | 0.306 | 0.056 | 0.056 | 1.217 | 0.056 | 0.058 | 8 |
| 3621 | dive terrain | 2.422e+0 | 0.907 | 0.060 | 0.060 | 0.251 | 0.055 | 0.056 | 1.159 | 0.059 | 0.061 | 8 |
| 3622 | dive terrain | 2.407e+0 | 0.847 | 0.060 | 0.060 | 0.200 | 0.051 | 0.051 | 1.096 | 0.062 | 0.064 | 8 |
| 3623 | dive terrain | 2.393e+0 | 0.787 | 0.060 | 0.060 | 0.154 | 0.045 | 0.045 | 1.033 | 0.064 | 0.064 | 8 |
| 3624 | dive terrain | 2.380e+0 | 0.727 | 0.060 | 0.060 | 0.115 | 0.039 | 0.039 | 0.973 | 0.060 | 0.059 | 8 |
| 3625 | dive terrain | 2.369e+0 | 0.668 | 0.059 | 0.059 | 0.082 | 0.033 | 0.033 | 0.924 | 0.050 | 0.048 | 8 |
| 3626 | dive terrain | 2.358e+0 | 0.617 | 0.051 | 0.050 | 0.055 | 0.027 | 0.026 | 0.878 | 0.045 | 0.045 | 8 |
| 3627 | dive terrain | 2.348e+0 | 0.576 | 0.040 | 0.039 | 0.034 | 0.020 | 0.020 | 0.838 | 0.040 | 0.039 | 8 |
| 3628 | dive terrain | 2.339e+0 | 0.547 | 0.030 | 0.028 | 0.021 | 0.013 | 0.012 | 0.805 | 0.033 | 0.032 | 8 |
| 3629 last | dive terrain | 2.330e+0 | 0.528 | 0.019 | 0.018 | 0.016 | 0.006 | 0.005 | 0.787 | 0.018 | 0.015 | 8 |
| 3630 | terrain terrain | 2.321e+0 | 0.520 | 0.008 | 0.007 | 0.015 | 0.001 | 0.001 | 0.805 | 0.018 | 0.029 | 8 |
| 3631 | terrain terrain | 2.312e+0 | 0.518 | 0.002 | 0.001 | 0.014 | 0.000 | 0.000 | 0.825 | 0.020 | 0.014 | 8 |
| 3632 | terrain terrain | 2.303e+0 | 0.517 | 0.001 | 0.001 | 0.014 | 0.000 | 0.000 | 0.832 | 0.006 | 0.006 | 8 |
| 3633 | terrain terrain | 2.295e+0 | 0.516 | 0.001 | 0.001 | 0.014 | 0.000 | 0.000 | 0.838 | 0.006 | 0.007 | 8 |
| 3634 | terrain terrain | 2.286e+0 | 0.515 | 0.001 | 0.001 | 0.014 | 0.000 | 0.000 | 0.845 | 0.007 | 0.007 | 8 |
| 3635 | terrain terrain | 2.277e+0 | 0.513 | 0.001 | 0.001 | 0.013 | 0.000 | 0.000 | 0.851 | 0.007 | 0.007 | 8 |
| 3636 | terrain terrain | 2.269e+0 | 0.512 | 0.001 | 0.001 | 0.013 | 0.000 | 0.000 | 0.858 | 0.007 | 0.007 | 8 |
| 3637 | terrain terrain | 2.260e+0 | 0.511 | 0.001 | 0.001 | 0.013 | 0.000 | 0.000 | 0.865 | 0.007 | 0.007 | 8 |
| 3638 | terrain terrain | 2.252e+0 | 0.510 | 0.001 | 0.001 | 0.013 | 0.000 | 0.000 | 0.872 | 0.007 | 0.007 | 8 |
| 3639 | terrain terrain | 2.244e+0 | 0.509 | 0.001 | 0.001 | 0.012 | 0.000 | 0.000 | 0.879 | 0.007 | 0.007 | 8 |
| 3640 | terrain terrain | 2.235e+0 | 0.508 | 0.001 | 0.001 | 0.012 | 0.000 | 0.000 | 0.886 | 0.007 | 0.007 | 8 |
| 3641 | terrain terrain | 2.227e+0 | 0.506 | 0.001 | 0.001 | 0.012 | 0.000 | 0.000 | 0.893 | 0.007 | 0.007 | 8 |

### rise (saturn.rise, frames 3810 to 3884, T at 3852, window 3798 to 3896)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.01629 log of the height a film frame | 1.198 | 3846 | 0.053 | 3816 |  |  | 0.004 | 0.019 | 0.000 | 0.000 | 0.112 at 3891 |
| whole frames | turn | 0.4823 degrees a film frame | 2.091 | 3842 | 0.072 | 3838 |  |  | 0.002 | 0.003 | 0.000 | 0.000 | 0.000 at 3896 |
| whole frames | speed | 9.894 px a film frame at the place | 1.437 | 3847 | 0.055 over 8 | 3840 |  |  | 0.036 | 0.047 | 0.010 over 6 | 0.029 over 6 | 1.151 at 3896 |
| rate 2 | rate | 0.01626 log of the height a film frame | 1.201 | 3851 + 1/2 | 0.053 | 3815 + 1/2 | 0.027 | 3815 + 1/2 | 0.005 | 0.019 | 0.000 | 0.000 | 0.113 at 3891 |
| rate 2 | turn | 0.4791 degrees a film frame | 2.105 | 3842 | 0.073 | 3838 + 1/2 | 0.036 | 3838 + 1/2 | 0.003 | 0.002 | 0.000 | 0.000 | 0.000 at 3896 + 1/2 |
| rate 2 | speed | 9.854 px a film frame at the place | 1.442 | 3847 | 0.055 over 8 | 3839 + 1/2 | 0.028 over 8 | 3839 + 1/2 | 0.045 | 0.048 | 0.012 over 6 | 0.028 over 6 | 1.311 at 3896 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the plane of the rings between their two radii, where the globe does not hide it. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 6, rate 2 6.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 3810, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.0208 of its height a film frame, the mean of its last 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 1.00 at frame 3794, limit 0.87; inside the rise itself 1.02 at frame 3810 + 1/2. Largest step from one capture frame to the next 0.07 at frame 3815, shown. The part along the surface view's own direction of motion: 0.98 at the lowest, lowest 0.98 at frame 3794, shown; under 0 the eye goes back.

Rest between the rise and the travel (the seam into saturn.travel at film frame 3885, 12 film frames to each side, read at rate 2): a rise and the travel after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body's edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest 3.34 at frame 3889, against 8.95 at frame 3873 and 34.77 at frame 3896 + 1/2 at the ends of the window. The lowest is 0.373 of the slower end, limit 0.07. Near 0 the picture comes to rest between the rise and the travel.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3798 | terrain terrain | 1.565e+0 | 0.290 |  |  | 0.006 |  |  | 0.319 |  |  | 0 |
| 3799 | terrain terrain | 1.573e+0 | 0.291 | 0.002 | 0.002 | 0.006 | 0.000 | 0.000 | 0.339 | 0.020 | 0.019 | 8 |
| 3800 | terrain terrain | 1.580e+0 | 0.293 | 0.002 | 0.002 | 0.006 | 0.000 | 0.000 | 0.355 | 0.016 | 0.015 | 8 |
| 3801 | terrain terrain | 1.588e+0 | 0.294 | 0.001 | 0.001 | 0.006 | 0.000 | 0.000 | 0.367 | 0.012 | 0.012 | 8 |
| 3802 | terrain terrain | 1.596e+0 | 0.296 | 0.001 | 0.001 | 0.007 | 0.000 | 0.000 | 0.377 | 0.009 | 0.009 | 8 |
| 3803 | terrain terrain | 1.603e+0 | 0.297 | 0.001 | 0.001 | 0.007 | 0.000 | 0.000 | 0.383 | 0.006 | 0.006 | 8 |
| 3804 | terrain terrain | 1.611e+0 | 0.299 | 0.002 | 0.002 | 0.007 | 0.000 | 0.000 | 0.387 | 0.004 | 0.004 | 8 |
| 3805 | terrain terrain | 1.619e+0 | 0.300 | 0.002 | 0.002 | 0.007 | 0.000 | 0.000 | 0.389 | 0.002 | 0.002 | 8 |
| 3806 | terrain terrain | 1.627e+0 | 0.302 | 0.002 | 0.002 | 0.007 | 0.000 | 0.000 | 0.389 | 0.000 | 0.001 | 8 |
| 3807 | terrain terrain | 1.635e+0 | 0.304 | 0.002 | 0.002 | 0.007 | 0.000 | 0.000 | 0.388 | 0.001 | 0.002 | 8 |
| 3808 | terrain terrain | 1.643e+0 | 0.306 | 0.002 | 0.002 | 0.006 | 0.000 | 0.000 | 0.387 | 0.002 | 0.002 | 8 |
| 3809 | terrain terrain | 1.652e+0 | 0.307 | 0.002 | 0.002 | 0.006 | 0.000 | 0.000 | 0.385 | 0.002 | 0.002 | 8 |
| 3810 first | rise terrain | 1.660e+0 | 0.309 | 0.002 | 0.002 | 0.006 | 0.000 | 0.003 | 0.384 | 0.001 | 0.017 | 8 |
| 3811 | rise terrain | 1.668e+0 | 0.313 | 0.004 | 0.010 | 0.004 | 0.002 | 0.021 | 0.420 | 0.036 | 0.055 | 8 |
| 3812 | rise terrain | 1.677e+0 | 0.328 | 0.014 | 0.022 | 0.044 | 0.040 | 0.060 | 0.472 | 0.053 | 0.052 | 8 |
| 3813 | rise terrain | 1.687e+0 | 0.353 | 0.026 | 0.033 | 0.111 | 0.067 | 0.073 | 0.515 | 0.042 | 0.041 | 8 |
| 3814 | rise terrain | 1.698e+0 | 0.391 | 0.037 | 0.044 | 0.183 | 0.072 | 0.073 | 0.556 | 0.041 | 0.041 | 8 |
| 3815 | rise terrain | 1.710e+0 | 0.439 | 0.048 | 0.053 | 0.256 | 0.072 | 0.073 | 0.592 | 0.037 | 0.036 | 8 |
| 3816 | rise terrain | 1.724e+0 | 0.492 | 0.053 | 0.053 | 0.328 | 0.072 | 0.073 | 0.626 | 0.034 | 0.034 | 8 |
| 3817 | rise terrain | 1.739e+0 | 0.543 | 0.051 | 0.051 | 0.400 | 0.072 | 0.073 | 0.660 | 0.034 | 0.035 | 8 |
| 3818 | rise terrain | 1.756e+0 | 0.592 | 0.049 | 0.049 | 0.472 | 0.072 | 0.073 | 0.695 | 0.035 | 0.035 | 8 |
| 3819 | rise terrain | 1.774e+0 | 0.640 | 0.047 | 0.047 | 0.545 | 0.072 | 0.073 | 0.731 | 0.035 | 0.036 | 8 |
| 3820 | rise terrain | 1.794e+0 | 0.685 | 0.045 | 0.045 | 0.617 | 0.072 | 0.073 | 0.767 | 0.036 | 0.036 | 8 |
| 3821 | rise terrain | 1.816e+0 | 0.729 | 0.043 | 0.043 | 0.689 | 0.072 | 0.073 | 0.803 | 0.036 | 0.036 | 8 |
| 3822 | rise terrain | 1.839e+0 | 0.770 | 0.042 | 0.041 | 0.762 | 0.072 | 0.073 | 0.839 | 0.036 | 0.036 | 8 |
| 3823 | rise terrain | 1.863e+0 | 0.810 | 0.040 | 0.039 | 0.834 | 0.072 | 0.073 | 0.875 | 0.036 | 0.036 | 8 |
| 3824 | rise terrain | 1.889e+0 | 0.847 | 0.038 | 0.038 | 0.906 | 0.072 | 0.073 | 0.911 | 0.036 | 0.036 | 8 |
| 3825 | rise terrain | 1.916e+0 | 0.883 | 0.036 | 0.036 | 0.979 | 0.072 | 0.073 | 0.946 | 0.035 | 0.036 | 8 |
| 3826 | rise terrain | 1.945e+0 | 0.917 | 0.034 | 0.034 | 1.051 | 0.072 | 0.073 | 0.973 | 0.027 | 0.028 | 8 |
| 3827 | rise terrain | 1.976e+0 | 0.949 | 0.032 | 0.032 | 1.123 | 0.072 | 0.073 | 0.997 | 0.024 | 0.024 | 8 |
| 3828 | rise terrain | 2.007e+0 | 0.979 | 0.030 | 0.030 | 1.196 | 0.072 | 0.073 | 1.014 | 0.017 | 0.016 | 8 |
| 3829 | rise terrain | 2.041e+0 | 1.007 | 0.028 | 0.028 | 1.268 | 0.072 | 0.073 | 1.024 | 0.010 | 0.009 | 8 |
| 3830 | rise terrain | 2.075e+0 | 1.033 | 0.026 | 0.026 | 1.340 | 0.072 | 0.073 | 1.028 | 0.004 | 0.004 | 8 |
| 3831 | rise terrain | 2.111e+0 | 1.058 | 0.024 | 0.024 | 1.413 | 0.072 | 0.073 | 1.029 | 0.001 | 0.001 | 8 |
| 3832 | rise terrain | 2.149e+0 | 1.080 | 0.022 | 0.022 | 1.485 | 0.072 | 0.073 | 1.030 | 0.000 | 0.001 | 8 |
| 3833 | rise terrain | 2.188e+0 | 1.100 | 0.020 | 0.020 | 1.558 | 0.072 | 0.073 | 1.032 | 0.002 | 0.004 | 8 |
| 3834 | rise terrain | 2.228e+0 | 1.119 | 0.018 | 0.018 | 1.630 | 0.072 | 0.073 | 1.039 | 0.007 | 0.011 | 8 |
| 3835 | rise terrain | 2.269e+0 | 1.135 | 0.017 | 0.016 | 1.702 | 0.072 | 0.073 | 1.054 | 0.014 | 0.019 | 8 |
| 3836 | rise terrain | 2.312e+0 | 1.150 | 0.015 | 0.014 | 1.775 | 0.072 | 0.073 | 1.076 | 0.022 | 0.026 | 8 |
| 3837 | rise terrain | 2.357e+0 | 1.163 | 0.013 | 0.012 | 1.847 | 0.072 | 0.073 | 1.106 | 0.030 | 0.035 | 8 |
| 3838 | rise terrain | 2.402e+0 | 1.173 | 0.011 | 0.011 | 1.920 | 0.072 | 0.073 | 1.145 | 0.040 | 0.046 | 8 |
| 3839 | rise terrain | 2.449e+0 | 1.182 | 0.009 | 0.009 | 1.991 | 0.072 | 0.072 | 1.196 | 0.051 | 0.055 | 8 |
| 3840 | rise terrain | 2.497e+0 | 1.189 | 0.007 | 0.007 | 2.049 | 0.057 | 0.055 | 1.251 | 0.055 | 0.054 | 8 |
| 3841 | rise terrain | 2.546e+0 | 1.194 | 0.005 | 0.005 | 2.082 | 0.033 | 0.030 | 1.296 | 0.045 | 0.044 | 8 |
| 3842 | rise terrain | 2.596e+0 | 1.197 | 0.003 | 0.003 | 2.091 | 0.009 | 0.006 | 1.331 | 0.035 | 0.034 | 8 |
| 3843 | rise terrain | 2.647e+0 | 1.198 | 0.001 | 0.001 | 2.087 | 0.004 | 0.010 | 1.363 | 0.032 | 0.032 | 8 |
| 3844 | rise terrain | 2.699e+0 | 1.198 | 0.000 | 0.000 | 2.073 | 0.013 | 0.019 | 1.392 | 0.029 | 0.029 | 8 |
| 3845 | rise terrain | 2.752e+0 | 1.198 | 0.000 | 0.000 | 2.051 | 0.022 | 0.028 | 1.415 | 0.023 | 0.022 | 8 |
| 3846 | rise terrain | 2.807e+0 | 1.198 | 0.000 | 0.000 | 2.020 | 0.031 | 0.037 | 1.430 | 0.015 | 0.015 | 8 |
| 3847 | rise terrain | 2.862e+0 | 1.198 | 0.000 | 0.000 | 1.980 | 0.040 | 0.046 | 1.437 | 0.007 | 0.006 | 8 |
| 3848 | rise terrain | 2.918e+0 | 1.198 | 0.000 | 0.000 | 1.931 | 0.049 | 0.055 | 1.413 | 0.003 | 0.009 | 8 |
| 3849 | rise terrain | 2.976e+0 | 1.198 | 0.000 | 0.000 | 1.873 | 0.058 | 0.064 | 1.399 | 0.014 | 0.021 | 7 |
| 3850 | rise terrain | 3.035e+0 | 1.198 | 0.000 | 0.000 | 1.806 | 0.066 | 0.070 | 1.375 | 0.024 | 0.029 | 7 |
| 3851 | rise terrain | 3.095e+0 | 1.198 | 0.000 | 0.000 | 1.737 | 0.070 | 0.070 | 1.345 | 0.029 | 0.031 | 7 |
| 3852 T | rise terrain | 3.155e+0 | 1.198 | 0.000 | 0.000 | 1.667 | 0.070 | 0.070 | 1.295 | 0.031 | 0.032 | 7 |
| 3853 | rise orbit | 3.218e+0 | 1.198 | 0.000 | 0.000 | 1.597 | 0.070 | 0.070 | 1.262 | 0.033 | 0.034 | 6 |
| 3854 | rise orbit | 3.281e+0 | 1.198 | 0.000 | 0.000 | 1.527 | 0.070 | 0.070 | 1.229 | 0.034 | 0.034 | 6 |
| 3855 | rise orbit | 3.346e+0 | 1.198 | 0.000 | 0.000 | 1.457 | 0.070 | 0.070 | 1.209 | 0.033 | 0.033 | 6 |
| 3856 | rise orbit | 3.412e+0 | 1.198 | 0.000 | 0.001 | 1.387 | 0.070 | 0.070 | 1.175 | 0.033 | 0.033 | 7 |
| 3857 | rise orbit | 3.479e+0 | 1.197 | 0.001 | 0.002 | 1.317 | 0.070 | 0.070 | 1.145 | 0.031 | 0.031 | 7 |
| 3858 | rise orbit | 3.547e+0 | 1.196 | 0.002 | 0.003 | 1.247 | 0.070 | 0.070 | 1.131 | 0.028 | 0.028 | 7 |
| 3859 | rise orbit | 3.617e+0 | 1.193 | 0.003 | 0.004 | 1.176 | 0.070 | 0.071 | 1.105 | 0.027 | 0.025 | 8 |
| 3860 | rise orbit | 3.688e+0 | 1.189 | 0.004 | 0.005 | 1.106 | 0.070 | 0.071 | 1.081 | 0.023 | 0.024 | 8 |
| 3861 | rise orbit | 3.760e+0 | 1.184 | 0.005 | 0.006 | 1.036 | 0.070 | 0.071 | 1.061 | 0.020 | 0.020 | 8 |
| 3862 | rise orbit | 3.833e+0 | 1.178 | 0.006 | 0.007 | 0.966 | 0.070 | 0.071 | 1.044 | 0.017 | 0.017 | 8 |
| 3863 | rise orbit | 3.906e+0 | 1.171 | 0.007 | 0.008 | 0.896 | 0.070 | 0.071 | 1.030 | 0.014 | 0.015 | 8 |
| 3864 | rise orbit | 3.981e+0 | 1.163 | 0.008 | 0.009 | 0.826 | 0.070 | 0.071 | 1.018 | 0.012 | 0.012 | 8 |
| 3865 | rise orbit | 4.057e+0 | 1.154 | 0.009 | 0.010 | 0.756 | 0.070 | 0.071 | 1.008 | 0.010 | 0.010 | 8 |
| 3866 | rise orbit | 4.133e+0 | 1.144 | 0.010 | 0.011 | 0.686 | 0.070 | 0.071 | 1.000 | 0.008 | 0.009 | 8 |
| 3867 | rise orbit | 4.210e+0 | 1.133 | 0.011 | 0.012 | 0.617 | 0.069 | 0.069 | 0.994 | 0.005 | 0.005 | 8 |
| 3868 | rise orbit | 4.288e+0 | 1.122 | 0.012 | 0.013 | 0.552 | 0.065 | 0.065 | 0.993 | 0.001 | 0.001 | 8 |
| 3869 | rise orbit | 4.366e+0 | 1.109 | 0.013 | 0.014 | 0.491 | 0.061 | 0.061 | 0.994 | 0.001 | 0.002 | 8 |
| 3870 | rise orbit | 4.444e+0 | 1.095 | 0.014 | 0.015 | 0.433 | 0.058 | 0.058 | 0.997 | 0.002 | 0.002 | 8 |
| 3871 | rise orbit | 4.523e+0 | 1.080 | 0.015 | 0.016 | 0.379 | 0.054 | 0.054 | 0.998 | 0.002 | 0.002 | 8 |
| 3872 | rise orbit | 4.603e+0 | 1.064 | 0.016 | 0.017 | 0.329 | 0.050 | 0.050 | 0.999 | 0.000 | 0.007 | 8 |
| 3873 | rise orbit | 4.682e+0 | 1.047 | 0.017 | 0.017 | 0.282 | 0.047 | 0.047 | 0.976 | 0.022 | 0.027 | 8 |
| 3874 | rise orbit | 4.761e+0 | 1.029 | 0.017 | 0.018 | 0.239 | 0.043 | 0.043 | 0.949 | 0.028 | 0.028 | 8 |
| 3875 | rise orbit | 4.840e+0 | 1.012 | 0.017 | 0.018 | 0.199 | 0.039 | 0.039 | 0.920 | 0.028 | 0.029 | 8 |
| 3876 | rise orbit | 4.919e+0 | 0.995 | 0.017 | 0.018 | 0.164 | 0.036 | 0.036 | 0.891 | 0.029 | 0.030 | 8 |
| 3877 | rise orbit | 4.998e+0 | 0.977 | 0.017 | 0.018 | 0.131 | 0.032 | 0.032 | 0.861 | 0.030 | 0.031 | 8 |
| 3878 | rise orbit | 5.077e+0 | 0.960 | 0.017 | 0.018 | 0.103 | 0.028 | 0.028 | 0.830 | 0.032 | 0.033 | 8 |
| 3879 | rise orbit | 5.155e+0 | 0.942 | 0.017 | 0.018 | 0.078 | 0.025 | 0.024 | 0.796 | 0.033 | 0.034 | 8 |
| 3880 | rise orbit | 5.234e+0 | 0.925 | 0.017 | 0.018 | 0.057 | 0.021 | 0.021 | 0.761 | 0.035 | 0.037 | 8 |
| 3881 | rise orbit | 5.311e+0 | 0.907 | 0.017 | 0.018 | 0.040 | 0.017 | 0.017 | 0.724 | 0.037 | 0.039 | 8 |
| 3882 | rise orbit | 5.389e+0 | 0.890 | 0.017 | 0.018 | 0.026 | 0.014 | 0.013 | 0.685 | 0.040 | 0.041 | 8 |
| 3883 | rise orbit | 5.466e+0 | 0.872 | 0.017 | 0.018 | 0.016 | 0.010 | 0.010 | 0.643 | 0.042 | 0.044 | 8 |
| 3884 last | rise orbit | 5.543e+0 | 0.855 | 0.017 | 0.018 | 0.010 | 0.006 | 0.006 | 0.598 | 0.045 | 0.047 | 8 |
| 3885 | travel orbit | 5.619e+0 | 0.837 | 0.017 | 0.018 | 0.007 | 0.003 | 0.002 | 0.550 | 0.047 | 0.048 | 8 |
| 3886 | travel orbit | 5.694e+0 | 0.818 | 0.019 | 0.025 | 0.007 | 0.000 | 0.000 | 0.505 | 0.045 | 0.045 | 8 |
| 3887 | travel orbit | 5.768e+0 | 0.787 | 0.032 | 0.046 | 0.007 | 0.000 | 0.000 | 0.463 | 0.042 | 0.048 | 8 |
| 3888 | travel orbit | 5.837e+0 | 0.731 | 0.056 | 0.072 | 0.007 | 0.000 | 0.000 | 0.408 | 0.054 | 0.070 | 8 |
| 3889 | travel orbit | 5.899e+0 | 0.650 | 0.082 * | 0.096 * | 0.007 | 0.000 | 0.000 | 0.325 | 0.083 * | 0.109 * | 8 |
| 3890 | travel orbit | 5.952e+0 | 0.548 | 0.102 * | 0.110 * | 0.006 | 0.000 | 0.000 | 0.199 | 0.126 * | 0.131 * | 8 |
| 3891 | travel orbit | 5.995e+0 | 0.436 | 0.112 * | 0.113 * | 0.006 | 0.000 | 0.000 | 0.137 | 0.062 | 0.166 * | 8 |
| 3892 | travel orbit | 6.027e+0 | 0.327 | 0.109 * | 0.109 * | 0.006 | 0.000 | 0.000 | 0.431 | 0.295 * | 0.425 * | 8 |
| 3893 | travel orbit | 6.049e+0 | 0.233 | 0.094 * | 0.091 * | 0.006 | 0.000 | 0.000 | 0.925 | 0.494 * | 0.615 * | 8 |
| 3894 | travel orbit | 6.066e+0 | 0.167 | 0.066 | 0.062 | 0.006 | 0.000 | 0.000 | 1.616 | 0.690 * | 0.829 * | 8 |
| 3895 | travel orbit | 6.080e+0 | 0.139 | 0.028 | 0.023 | 0.006 | 0.000 | 0.000 | 2.527 | 0.912 * | 1.064 * | 8 |
| 3896 | travel orbit | 6.095e+0 | 0.154 | 0.015 | 0.042 | 0.006 | 0.000 | 0.000 | 3.679 | 1.151 * | 1.311 * | 8 |

## pictures

Tier draft, rate 2, 5.3 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

The dive is joined from 2 parts: ../work/p6/sj2/01/saturn-dive-p1of2 (capture frames 7056 to 7169, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), ../work/p6/sj2/02/saturn-dive-p2of2 (capture frames 7170 to 7283, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

The rise is joined from 2 parts: ../work/p6/sj2/03/saturn-rise-p1of2 (capture frames 7596 to 7694, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), ../work/p6/sj2/04/saturn-rise-p2of2 (capture frames 7695 to 7793, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

### dive (saturn.dive, frames 3540 to 3629, window 3528 to 3641, 228 draft frames at rate 2)

Largest level step: 0.02 at frame 3601 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.07 from frame 3568 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 1.92 from frame 3622 to the next, block column 15 row 7 from the top left, shown, not judged.
Largest change in place: 16.5 from frame 3601 + 1/2 to 8 film frames later, most at pixel 940, 752 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.33 from frame 3576 to 8 film frames later, most at pixel 1404, 428, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 3630 to 3641 + 1/2): change 6.1, pattern 0.05.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 3567 in ../work/p6/sj2/01/saturn-dive-p1of2-pops.png, frame 3568 in ../work/p6/sj2/01/saturn-dive-p1of2-pops.png, frame 3568 + 1/2 in ../work/p6/sj2/01/saturn-dive-p1of2-pops.png, frame 3569 in ../work/p6/sj2/01/saturn-dive-p1of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 3576 in ../work/p6/sj2/01/saturn-dive-p1of2-changes.png, frame 3584 in ../work/p6/sj2/01/saturn-dive-p1of2-changes.png, frame 3592 in no panel (a slice --frames 7184-7184 draws it), frame 3601 + 1/2 in ../work/p6/sj2/02/saturn-dive-p2of2-changes.png.

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3528 | 73.62 |  | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 10,8 | 1.5 | 4.0 | 0.52 | 0.00 | 0.51 | 8.1 |
| 3528 + 1/2 | 73.63 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 10,8 | 1.4 | 4.1 | 0.52 | 0.00 | 0.51 | 8.1 |
| 3529 | 73.64 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 12,4 | 1.5 | 4.2 | 0.52 | 0.00 | 0.51 | 8.1 |
| 3529 + 1/2 | 73.65 | 0.00 | 0.5 | 0.59 | 0.59 | 1.01 | 1.01 | 1.01 | 0.000 | 1.20 | 13,4 | 1.4 | 4.1 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3530 | 73.66 | 0.00 | 0.4 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 3,7 | 1.5 | 4.3 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3530 + 1/2 | 73.67 | 0.00 | 0.5 | 0.59 | 0.59 | 1.01 | 1.01 | 1.01 | 0.000 | 1.20 | 13,4 | 1.5 | 4.0 | 0.52 | 0.01 | 0.51 | 8.1 |
| 3531 | 73.68 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 9,0 | 1.5 | 4.1 | 0.52 | 0.01 | 0.51 | 8.1 |
| 3531 + 1/2 | 73.69 | 0.00 | 0.5 | 0.58 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.19 | 15,1 | 1.6 | 4.0 | 0.52 | 0.00 | 0.52 | 8.0 |
| 3532 | 73.70 | 0.00 | 0.5 | 0.59 | 0.59 | 1.01 | 1.01 | 1.01 | 0.000 | 1.21 | 3,3 | 1.5 | 3.7 | 0.52 | 0.00 | 0.52 | 8.0 |
| 3532 + 1/2 | 73.71 | 0.00 | 0.5 | 0.58 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 0,0 | 1.6 | 3.7 | 0.52 | 0.00 | 0.52 | 8.1 |
| 3533 | 73.72 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 4,0 | 1.7 | 3.6 | 0.52 | 0.01 | 0.52 | 8.1 |
| 3533 + 1/2 | 73.73 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 15,1 | 1.7 | 3.8 | 0.52 | 0.01 | 0.52 | 8.1 |
| 3534 | 73.74 | 0.00 | 0.5 | 0.59 | 0.59 | 1.01 | 1.01 | 1.01 | 0.000 | 1.20 | 14,4 | 1.7 | 3.6 | 0.52 | 0.01 | 0.52 | 8.0 |
| 3534 + 1/2 | 73.74 | 0.00 | 0.5 | 0.58 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 8,6 | 1.8 | 3.6 | 0.52 | 0.01 | 0.52 | 8.2 |
| 3535 | 73.76 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 10,0 | 1.7 | 2.9 | 0.52 | 0.01 | 0.52 | 8.1 |
| 3535 + 1/2 | 73.76 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 15,1 | 1.9 | 3.0 | 0.52 | 0.01 | 0.52 | 8.0 |
| 3536 | 73.77 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 13,1 | 2.0 | 3.5 | 0.52 | 0.01 | 0.52 | 8.1 |
| 3536 + 1/2 | 73.78 | 0.00 | 0.5 | 0.58 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 13,0 | 2.1 | 3.7 | 0.52 | 0.01 | 0.52 | 8.1 |
| 3537 | 73.79 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 6,0 | 2.2 | 3.9 | 0.52 | 0.01 | 0.52 | 8.1 |
| 3537 + 1/2 | 73.80 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 15,1 | 2.4 | 4.3 | 0.52 | 0.01 | 0.52 | 8.1 |
| 3538 | 73.81 | 0.00 | 0.5 | 0.59 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.15 | 12,3 | 2.6 | 4.2 | 0.52 | 0.01 | 0.52 | 8.1 |
| 3538 + 1/2 | 73.82 | 0.00 | 0.5 | 0.58 | 0.59 | 0.98 | 0.98 | 0.98 | 0.000 | 1.09 | 14,2 | 2.7 | 4.7 | 0.52 | 0.01 | 0.52 | 8.1 |
| 3539 | 73.83 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 13,4 | 2.8 | 5.1 | 0.53 | 0.02 | 0.52 | 8.1 |
| 3539 + 1/2 | 73.83 | 0.00 | 0.5 | 0.59 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 15,1 | 3.0 | 5.7 | 0.53 | 0.03 | 0.52 | 8.0 |
| 3540 first | 73.84 | 0.00 | 0.5 | 0.59 | 0.60 | 0.99 | 0.99 | 0.99 | 0.000 | 1.22 | 14,1 | 3.1 | 6.0 | 0.52 | 0.05 | 0.51 | 8.0 |
| 3540 + 1/2 | 73.86 | 0.00 | 0.5 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 14,2 | 3.7 | 6.7 | 0.52 | 0.06 | 0.51 | 8.0 |
| 3541 | 73.87 | 0.00 | 0.5 | 0.63 | 0.64 | 0.98 | 0.98 | 0.98 | 0.000 | 1.07 | 15,0 | 4.1 | 7.6 | 0.52 | 0.09 | 0.51 | 8.0 |
| 3541 + 1/2 | 73.89 | 0.01 | 0.5 | 0.67 | 0.68 | 0.99 | 0.99 | 0.99 | 0.000 | 1.22 | 15,1 | 4.4 | 8.5 | 0.52 | 0.10 | 0.51 | 8.0 |
| 3542 | 73.92 | 0.00 | 0.6 | 0.73 | 0.72 | 1.01 | 1.01 | 1.01 | 0.000 | 1.14 | 12,4 | 4.8 | 9.1 | 0.52 | 0.12 | 0.51 | 8.0 |
| 3542 + 1/2 | 73.96 | 0.01 | 0.6 | 0.77 | 0.77 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 14,2 | 5.1 | 9.9 | 0.52 | 0.11 | 0.50 | 8.0 |
| 3543 | 74.00 | 0.01 | 0.7 | 0.81 | 0.81 | 1.01 | 1.01 | 1.01 | 0.001 | 1.24 | 5,1 | 5.5 | 10.5 | 0.52 | 0.12 | 0.50 | 8.0 |
| 3543 + 1/2 | 74.06 | 0.00 | 0.7 | 0.85 | 0.86 | 0.99 | 0.99 | 0.99 | 0.000 | 1.39 | 4,2 | 5.7 | 11.0 | 0.52 | 0.11 | 0.50 | 8.0 |
| 3544 | 74.13 | 0.01 | 0.8 | 0.90 | 0.89 | 1.01 | 1.01 | 1.01 | 0.000 | 1.35 | 4,2 | 5.9 | 12.0 | 0.51 | 0.07 | 0.49 | 8.2 |
| 3544 + 1/2 | 74.21 | 0.00 | 0.8 | 0.93 | 0.94 | 1.00 | 1.00 | 1.00 | 0.000 | 1.50 | 4,2 | 6.2 | 13.0 | 0.50 | 0.05 | 0.49 | 8.0 |
| 3545 | 74.30 | 0.01 | 0.9 | 0.97 | 0.97 | 1.00 | 1.00 | 1.00 | 0.000 | 1.38 | 4,2 | 6.5 | 13.5 | 0.50 | 0.05 | 0.49 | 8.0 |
| 3545 + 1/2 | 74.39 | 0.00 | 0.9 | 1.01 | 1.01 | 1.00 | 1.00 | 1.00 | 0.000 | 1.33 | 4,2 | 7.0 | 14.1 | 0.50 | 0.05 | 0.49 | 8.0 |
| 3546 | 74.50 | 0.00 | 0.9 | 1.05 | 1.04 | 1.00 | 1.00 | 1.00 | 0.000 | 1.29 | 14,8 | 7.5 | 14.4 | 0.50 | 0.05 | 0.49 | 8.0 |
| 3546 + 1/2 | 74.61 | 0.00 | 1.0 | 1.07 | 1.07 | 1.00 | 1.00 | 1.00 | 0.000 | 1.31 | 3,3 | 7.7 | 14.8 | 0.50 | 0.05 | 0.49 | 8.0 |
| 3547 | 74.72 | 0.00 | 1.0 | 1.09 | 1.10 | 0.99 | 1.00 | 0.99 | 0.000 | 1.42 | 10,6 | 7.9 | 15.2 | 0.50 | 0.04 | 0.49 | 8.0 |
| 3547 + 1/2 | 74.83 | 0.00 | 1.1 | 1.12 | 1.13 | 1.00 | 0.99 | 0.99 | 0.001 | 1.66 | 10,6 | 8.6 | 16.4 | 0.50 | 0.04 | 0.48 | 8.0 |
| 3548 | 74.96 | 0.00 | 1.2 | 1.17 | 1.16 | 1.01 | 1.01 | 1.01 | 0.000 | 1.66 | 10,6 | 9.5 | 19.0 | 0.49 | 0.04 | 0.48 | 8.0 |
| 3548 + 1/2 | 75.08 | 0.00 | 1.2 | 1.19 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 1.76 | 10,6 | 9.9 | 20.4 | 0.49 | 0.04 | 0.47 | 8.0 |
| 3549 | 75.20 | 0.00 | 1.3 | 1.22 | 1.22 | 1.00 | 1.00 | 1.00 | 0.000 | 1.69 | 10,6 | 10.2 | 21.9 | 0.49 | 0.04 | 0.47 | 8.0 |
| 3549 + 1/2 | 75.33 | 0.00 | 1.4 | 1.25 | 1.25 | 1.00 | 1.00 | 1.00 | 0.001 | 1.46 | 15,7 | 11.0 | 24.2 | 0.48 | 0.04 | 0.47 | 8.0 |
| 3550 | 75.45 | 0.00 | 1.4 | 1.28 | 1.27 | 1.01 | 1.01 | 1.01 | 0.007 | 1.35 | 15,7 | 11.4 | 25.9 | 0.48 | 0.05 | 0.47 | 8.0 |
| 3550 + 1/2 | 75.59 | 0.00 | 1.5 | 1.30 | 1.31 | 0.99 | 0.99 | 0.99 | 0.007 | 1.23 | 2,4 | 11.8 | 27.3 | 0.48 | 0.06 | 0.47 | 8.0 |
| 3551 | 75.73 | 0.01 | 1.5 | 1.33 | 1.34 | 1.00 | 1.00 | 1.00 | 0.003 | 1.20 | 2,4 | 12.1 | 29.1 | 0.48 | 0.06 | 0.46 | 8.0 |
| 3551 + 1/2 | 75.88 | 0.00 | 1.5 | 1.38 | 1.38 | 1.00 | 1.00 | 1.00 | 0.011 | 1.31 | 2,4 | 12.0 | 32.2 | 0.48 | 0.07 | 0.46 | 8.0 |
| 3552 | 76.04 | 0.00 | 1.6 | 1.42 | 1.41 | 1.00 | 1.00 | 1.00 | 0.006 | 1.44 | 14,0 | 12.3 | 34.1 | 0.48 | 0.08 | 0.46 | 8.0 |
| 3552 + 1/2 | 76.20 | 0.00 | 1.7 | 1.44 | 1.45 | 0.99 | 1.00 | 0.99 | 0.000 | 1.28 | 14,0 | 12.6 | 32.6 | 0.48 | 0.08 | 0.46 | 8.0 |
| 3553 | 76.36 | 0.00 | 1.8 | 1.49 | 1.48 | 1.01 | 1.02 | 1.01 | 0.003 | 1.31 | 14,0 | 12.6 | 33.9 | 0.47 | 0.08 | 0.46 | 8.0 |
| 3553 + 1/2 | 76.52 | 0.00 | 1.9 | 1.52 | 1.52 | 0.99 | 0.97 | 0.97 | 0.010 | 1.30 | 10,0 | 12.6 | 37.0 | 0.47 | 0.09 | 0.46 | 8.0 |
| 3554 | 76.69 | 0.00 | 2.0 | 1.56 | 1.56 | 1.00 | 1.00 | 1.00 | 0.004 | 1.45 | 14,0 | 12.9 | 38.9 | 0.47 | 0.10 | 0.46 | 8.0 |
| 3554 + 1/2 | 76.86 | 0.00 | 2.0 | 1.61 | 1.60 | 1.00 | 1.01 | 1.00 | 0.012 | 1.37 | 9,0 | 13.1 | 41.8 | 0.47 | 0.11 | 0.45 | 8.0 |
| 3555 | 77.03 | 0.00 | 2.1 | 1.65 | 1.63 | 1.01 | 1.00 | 1.00 | 0.014 | 1.41 | 9,0 | 13.3 | 41.3 | 0.47 | 0.11 | 0.45 | 8.0 |
| 3555 + 1/2 | 77.19 | 0.00 | 2.2 | 1.65 | 1.68 | 0.99 | 1.01 | 0.99 | 0.023 | 1.37 | 9,0 | 13.4 | 42.2 | 0.46 | 0.12 | 0.45 | 8.0 |
| 3556 | 77.36 | 0.00 | 2.3 | 1.70 | 1.68 | 1.02 | 1.00 | 1.00 | 0.028 | 1.39 | 11,1 | 13.4 | 45.5 | 0.47 | 0.13 | 0.45 | 8.0 |
| 3556 + 1/2 | 77.53 | 0.00 | 2.4 | 1.70 | 1.73 | 0.99 | 0.99 | 0.99 | 0.023 | 1.42 | 11,1 | 13.6 | 47.2 | 0.46 | 0.13 | 0.45 | 8.0 |
| 3557 | 77.70 | 0.00 | 2.5 | 1.75 | 1.73 | 1.01 | 1.01 | 1.01 | 0.038 | 1.45 | 6,1 | 13.5 | 48.4 | 0.46 | 0.13 | 0.45 | 8.0 |
| 3557 + 1/2 | 77.87 | 0.00 | 2.5 | 1.76 | 1.76 | 1.00 | 1.00 | 1.00 | 0.034 | 1.33 | 11,2 | 13.7 | 50.3 | 0.46 | 0.14 | 0.45 | 8.0 |
| 3558 | 78.04 | 0.00 | 2.6 | 1.76 | 1.76 | 1.00 | 1.00 | 1.00 | 0.028 | 1.28 | 11,1 | 13.9 | 50.0 | 0.46 | 0.14 | 0.45 | 8.0 |
| 3558 + 1/2 | 78.20 | 0.00 | 2.7 | 1.77 | 1.77 | 1.00 | 1.01 | 1.00 | 0.028 | 1.32 | 6,1 | 14.0 | 51.0 | 0.46 | 0.14 | 0.45 | 8.0 |
| 3559 | 78.36 | 0.00 | 2.7 | 1.79 | 1.78 | 1.00 | 0.99 | 0.99 | 0.039 | 1.34 | 5,1 | 14.3 | 51.7 | 0.46 | 0.15 | 0.44 | 8.0 |
| 3559 + 1/2 | 78.52 | 0.00 | 2.8 | 1.80 | 1.80 | 1.00 | 1.00 | 1.00 | 0.032 | 1.17 | 11,5 | 14.4 | 51.2 | 0.46 | 0.15 | 0.44 | 8.0 |
| 3560 | 78.68 | 0.00 | 2.8 | 1.81 | 1.80 | 1.00 | 1.01 | 1.00 | 0.025 | 1.20 | 6,1 | 14.1 | 54.7 | 0.46 | 0.16 | 0.45 | 8.0 |
| 3560 + 1/2 | 78.85 | 0.00 | 3.1 | 1.81 | 1.81 | 1.00 | 0.99 | 0.99 | 0.038 | 1.34 | 0,3 | 14.3 | 55.3 | 0.46 | 0.16 | 0.45 | 8.0 |
| 3561 | 79.01 | 0.01 | 3.0 | 1.82 | 1.83 | 0.99 | 0.99 | 0.99 | 0.047 | 1.21 | 10,7 | 14.2 | 56.5 | 0.46 | 0.16 | 0.45 | 8.0 |
| 3561 + 1/2 | 79.16 | 0.00 | 3.1 | 1.85 | 1.85 | 1.00 | 0.99 | 0.99 | 0.039 | 1.15 | 0,3 | 13.6 | 58.5 | 0.46 | 0.16 | 0.44 | 8.0 |
| 3562 | 79.31 | 0.01 | 3.0 | 1.88 | 1.88 | 1.00 | 1.00 | 1.00 | 0.035 | 1.29 | 0,3 | 13.4 | 56.7 | 0.46 | 0.16 | 0.44 | 8.0 |
| 3562 + 1/2 | 79.45 | 0.00 | 3.2 | 1.90 | 1.89 | 1.01 | 1.01 | 1.01 | 0.041 | 1.43 | 6,2 | 13.1 | 60.0 | 0.46 | 0.17 | 0.45 | 8.0 |
| 3563 | 79.59 | 0.00 | 3.2 | 1.91 | 1.93 | 0.99 | 0.98 | 0.98 | 0.031 | 1.24 | 11,3 | 13.3 | 62.1 | 0.46 | 0.17 | 0.45 | 8.0 |
| 3563 + 1/2 | 79.74 | 0.00 | 3.3 | 1.96 | 1.94 | 1.01 | 1.04 | 1.01 | 0.032 | 1.37 | 6,2 | 13.1 | 56.2 | 0.46 | 0.17 | 0.45 | 8.0 |
| 3564 | 79.87 | 0.01 | 3.2 | 1.97 | 1.98 | 0.99 | 1.04 | 0.99 | 0.044 | 1.25 | 11,3 | 13.0 | 60.1 | 0.46 | 0.17 | 0.45 | 8.0 |
| 3564 + 1/2 | 80.00 | 0.01 | 3.4 | 2.01 | 1.99 | 1.01 | 1.04 | 1.01 | 0.041 | 1.43 | 1,0 | 12.9 | 62.5 | 0.47 | 0.16 | 0.45 | 8.0 |
| 3565 | 80.11 | 0.01 | 3.5 | 2.02 | 2.02 | 1.00 | 1.04 | 1.00 | 0.041 | 1.52 | 1,0 | 12.8 | 57.1 | 0.47 | 0.16 | 0.45 | 8.0 |
| 3565 + 1/2 | 80.20 | 0.00 | 3.5 | 2.06 | 2.02 | 1.02 | 1.05 | 1.02 | 0.044 | 1.64 | 1,0 | 13.0 | 59.0 | 0.47 | 0.16 | 0.45 | 8.0 |
| 3566 | 80.28 | 0.01 | 3.5 | 2.08 | 2.02 | 1.03 | 1.08 | 1.03 | 0.045 | 1.75 | 1,0 | 13.1 | 56.1 | 0.46 | 0.16 | 0.45 | 8.0 |
| 3566 + 1/2 | 80.34 | 0.01 | 3.5 | 2.11 | 2.02 | 1.05 | 1.06 | 1.05 | 0.047 | 1.75 | 1,0 | 13.2 | 52.6 | 0.47 | 0.16 | 0.45 | 8.0 |
| 3567 | 80.38 | 0.01 | 3.6 | 2.12 | 2.02 | 1.05 | 1.05 | 1.05 | 0.051 | 1.81 | 1,0 | 13.2 | 54.6 | 0.47 | 0.17 | 0.45 | 8.0 |
| 3567 + 1/2 | 80.41 | 0.01 | 3.7 | 2.12 | 2.02 | 1.05 | 1.06 | 1.05 | 0.059 | 1.80 | 1,0 | 13.2 | 53.6 | 0.47 | 0.17 | 0.45 | 8.0 |
| 3568 | 80.40 | 0.01 | 3.5 | 2.14 | 2.02 | 1.06 | 1.11 | 1.06 | 0.036 | 1.71 | 1,0 | 12.9 | 48.0 | 0.47 | 0.17 | 0.45 | 8.0 |
| 3568 + 1/2 | 80.37 | 0.00 | 3.8 | 2.16 | 2.02 | 1.07 | 1.11 | 1.07 | 0.044 | 1.68 | 1,0 | 12.6 | 42.0 | 0.47 | 0.18 | 0.45 | 8.0 |
| 3569 | 80.35 | 0.01 | 3.7 | 2.15 | 2.02 | 1.06 | 1.09 | 1.06 | 0.044 | 1.55 | 1,0 | 12.5 | 38.0 | 0.46 | 0.19 | 0.45 | 8.0 |
| 3569 + 1/2 | 80.30 | 0.00 | 3.8 | 2.13 | 2.02 | 1.05 | 1.04 | 1.04 | 0.054 | 1.53 | 2,0 | 12.4 | 36.7 | 0.46 | 0.16 | 0.45 | 8.0 |
| 3570 | 80.26 | 0.01 | 3.9 | 2.12 | 2.02 | 1.05 | 1.04 | 1.04 | 0.052 | 1.58 | 2,0 | 12.4 | 34.7 | 0.46 | 0.20 | 0.45 | 8.0 |
| 3570 + 1/2 | 80.18 | 0.01 | 3.8 | 2.11 | 2.02 | 1.05 | 1.08 | 1.05 | 0.043 | 1.52 | 2,0 | 12.1 | 29.4 | 0.46 | 0.20 | 0.44 | 8.0 |
| 3571 | 80.09 | 0.02 | 3.9 | 2.10 | 2.02 | 1.04 | 1.05 | 1.04 | 0.048 | 1.60 | 2,0 | 12.0 | 26.6 | 0.46 | 0.18 | 0.44 | 8.0 |
| 3571 + 1/2 | 79.97 | 0.00 | 3.9 | 2.09 | 2.02 | 1.03 | 0.99 | 0.99 | 0.058 | 1.45 | 2,0 | 11.8 | 24.4 | 0.45 | 0.25 | 0.44 | 8.0 |
| 3572 | 79.84 | 0.01 | 3.9 | 2.07 | 2.02 | 1.03 | 0.97 | 0.97 | 0.070 | 1.57 | 1,1 | 11.6 | 22.8 | 0.45 | 0.22 | 0.44 | 8.0 |
| 3572 + 1/2 | 79.69 | 0.01 | 4.0 | 2.04 | 2.02 | 1.01 | 0.97 | 0.97 | 0.065 | 1.42 | 1,1 | 11.6 | 26.2 | 0.45 | 0.24 | 0.44 | 8.0 |
| 3573 | 79.53 | 0.01 | 4.0 | 2.02 | 2.02 | 1.00 | 0.99 | 0.99 | 0.057 | 1.45 | 14,2 | 11.5 | 30.2 | 0.45 | 0.24 | 0.44 | 8.0 |
| 3573 + 1/2 | 79.36 | 0.01 | 4.0 | 2.02 | 2.01 | 1.00 | 1.02 | 1.00 | 0.048 | 1.35 | 1,1 | 11.4 | 34.8 | 0.45 | 0.18 | 0.44 | 8.0 |
| 3574 | 79.17 | 0.01 | 4.1 | 2.01 | 2.00 | 1.00 | 1.01 | 1.00 | 0.048 | 1.35 | 14,2 | 11.3 | 35.8 | 0.45 | 0.28 | 0.44 | 8.0 |
| 3574 + 1/2 | 78.95 | 0.01 | 4.0 | 1.97 | 1.98 | 0.99 | 0.98 | 0.98 | 0.053 | 1.30 | 1,1 | 11.0 | 34.6 | 0.45 | 0.26 | 0.44 | 8.0 |
| 3575 | 78.71 | 0.01 | 4.0 | 1.95 | 1.97 | 0.99 | 0.99 | 0.99 | 0.047 | 1.30 | 13,8 | 10.9 | 31.2 | 0.45 | 0.32 | 0.44 | 8.0 |
| 3575 + 1/2 | 78.46 | 0.01 | 4.0 | 1.93 | 1.95 | 0.99 | 0.96 | 0.96 | 0.055 | 1.31 | 13,8 | 10.7 | 29.2 | 0.45 | 0.31 | 0.44 | 8.0 |
| 3576 | 78.19 | 0.00 | 4.4 | 1.91 | 1.94 | 0.99 | 0.92 | 0.92 | 0.069 | 1.28 | 0,4 | 10.7 | 29.0 | 0.45 | 0.33 | 0.44 | 8.0 |
| 3576 + 1/2 | 77.92 | 0.00 | 4.2 | 1.96 | 1.92 | 1.02 | 0.96 | 0.96 | 0.069 | 1.41 | 0,4 | 10.6 | 30.3 | 0.45 | 0.33 | 0.44 | 8.0 |
| 3577 | 77.64 | 0.01 | 4.1 | 1.92 | 1.92 | 1.00 | 1.01 | 1.00 | 0.038 | 1.30 | 13,8 | 10.8 | 33.0 | 0.46 | 0.26 | 0.45 | 8.0 |
| 3577 + 1/2 | 77.34 | 0.01 | 4.1 | 1.89 | 1.91 | 0.99 | 0.98 | 0.98 | 0.046 | 1.36 | 0,6 | 11.1 | 32.3 | 0.45 | 0.23 | 0.44 | 8.3 |
| 3578 | 77.03 | 0.00 | 4.2 | 1.90 | 1.91 | 1.00 | 1.03 | 1.00 | 0.042 | 1.25 | 0,6 | 11.4 | 33.5 | 0.45 | 0.25 | 0.44 | 8.3 |
| 3578 + 1/2 | 76.71 | 0.00 | 4.1 | 1.92 | 1.90 | 1.01 | 1.05 | 1.01 | 0.031 | 1.37 | 2,8 | 12.7 | 60.6 | 0.46 | 0.18 | 0.45 | 8.3 |
| 3579 | 76.39 | 0.01 | 4.2 | 1.91 | 1.88 | 1.01 | 1.01 | 1.01 | 0.044 | 1.31 | 5,1 | 13.3 | 60.4 | 0.46 | 0.20 | 0.45 | 8.2 |
| 3579 + 1/2 | 76.07 | 0.00 | 4.1 | 1.88 | 1.88 | 1.00 | 1.00 | 1.00 | 0.050 | 1.35 | 1,7 | 13.5 | 59.2 | 0.46 | 0.23 | 0.45 | 8.0 |
| 3580 | 75.75 | 0.01 | 4.3 | 1.87 | 1.87 | 1.00 | 1.04 | 1.00 | 0.041 | 1.38 | 1,0 | 13.6 | 59.2 | 0.46 | 0.25 | 0.45 | 8.0 |
| 3580 + 1/2 | 75.41 | 0.01 | 4.2 | 1.87 | 1.87 | 1.00 | 1.04 | 1.00 | 0.029 | 1.35 | 9,2 | 13.8 | 60.9 | 0.46 | 0.26 | 0.45 | 8.2 |
| 3581 | 75.06 | 0.00 | 4.3 | 1.86 | 1.85 | 1.00 | 1.04 | 1.00 | 0.045 | 1.42 | 1,0 | 13.8 | 55.9 | 0.46 | 0.26 | 0.45 | 8.2 |
| 3581 + 1/2 | 74.70 | 0.00 | 4.3 | 1.84 | 1.84 | 1.00 | 1.01 | 1.00 | 0.039 | 1.32 | 0,1 | 13.8 | 53.3 | 0.45 | 0.26 | 0.44 | 8.4 |
| 3582 | 74.33 | 0.00 | 4.4 | 1.83 | 1.82 | 1.01 | 1.02 | 1.01 | 0.051 | 1.33 | 9,2 | 14.1 | 53.3 | 0.45 | 0.26 | 0.44 | 8.5 |
| 3582 + 1/2 | 73.95 | 0.01 | 4.4 | 1.80 | 1.80 | 1.00 | 0.99 | 0.99 | 0.054 | 1.27 | 1,0 | 14.2 | 50.9 | 0.45 | 0.27 | 0.44 | 8.6 |
| 3583 | 73.56 | 0.00 | 4.4 | 1.78 | 1.77 | 1.00 | 1.04 | 1.00 | 0.040 | 1.45 | 14,3 | 14.1 | 47.0 | 0.44 | 0.28 | 0.43 | 8.7 |
| 3583 + 1/2 | 73.17 | 0.00 | 4.5 | 1.75 | 1.75 | 1.00 | 0.99 | 0.99 | 0.048 | 1.51 | 14,3 | 14.1 | 48.0 | 0.44 | 0.28 | 0.43 | 8.9 |
| 3584 | 72.77 | 0.00 | 4.4 | 1.73 | 1.74 | 1.00 | 0.99 | 0.99 | 0.041 | 1.37 | 14,3 | 14.1 | 46.9 | 0.44 | 0.27 | 0.43 | 9.1 |
| 3584 + 1/2 | 72.38 | 0.00 | 4.5 | 1.72 | 1.72 | 1.00 | 0.99 | 0.99 | 0.038 | 1.58 | 14,3 | 14.0 | 47.6 | 0.44 | 0.23 | 0.42 | 9.3 |
| 3585 | 71.98 | 0.00 | 4.6 | 1.70 | 1.71 | 0.99 | 1.00 | 0.99 | 0.038 | 1.27 | 14,3 | 13.9 | 51.4 | 0.43 | 0.23 | 0.42 | 9.6 |
| 3585 + 1/2 | 71.59 | 0.00 | 4.6 | 1.71 | 1.69 | 1.01 | 0.98 | 0.98 | 0.054 | 1.66 | 14,3 | 14.0 | 52.6 | 0.43 | 0.21 | 0.42 | 10.0 |
| 3586 | 71.18 | 0.00 | 4.6 | 1.69 | 1.68 | 1.00 | 1.02 | 1.00 | 0.030 | 1.40 | 0,0 | 13.8 | 49.3 | 0.43 | 0.20 | 0.42 | 10.3 |
| 3586 + 1/2 | 70.77 | 0.00 | 4.6 | 1.67 | 1.67 | 1.00 | 0.99 | 0.99 | 0.041 | 1.46 | 14,3 | 13.9 | 50.5 | 0.42 | 0.19 | 0.41 | 8.0 |
| 3587 | 70.35 | 0.00 | 4.6 | 1.65 | 1.66 | 0.99 | 0.98 | 0.98 | 0.033 | 1.26 | 14,3 | 14.0 | 52.2 | 0.42 | 0.17 | 0.41 | 8.1 |
| 3587 + 1/2 | 69.93 | 0.00 | 4.6 | 1.65 | 1.65 | 1.00 | 0.97 | 0.97 | 0.051 | 1.54 | 4,8 | 14.2 | 51.4 | 0.40 | 0.16 | 0.39 | 8.2 |
| 3588 | 69.51 | 0.00 | 4.6 | 1.65 | 1.64 | 1.00 | 1.02 | 1.00 | 0.026 | 1.42 | 13,1 | 14.4 | 48.0 | 0.40 | 0.15 | 0.39 | 8.1 |
| 3588 + 1/2 | 69.10 | 0.00 | 4.6 | 1.64 | 1.64 | 1.00 | 1.00 | 1.00 | 0.027 | 1.33 | 0,2 | 14.5 | 48.5 | 0.40 | 0.13 | 0.39 | 8.0 |
| 3589 | 68.69 | 0.01 | 4.6 | 1.63 | 1.63 | 1.00 | 1.03 | 1.00 | 0.031 | 1.39 | 13,3 | 14.7 | 47.6 | 0.39 | 0.13 | 0.39 | 8.0 |
| 3589 + 1/2 | 68.26 | 0.00 | 4.7 | 1.60 | 1.63 | 0.98 | 1.01 | 0.98 | 0.020 | 1.39 | 13,3 | 15.0 | 46.8 | 0.40 | 0.12 | 0.39 | 8.0 |
| 3590 | 67.84 | 0.00 | 4.6 | 1.62 | 1.62 | 1.00 | 0.98 | 0.98 | 0.032 | 1.29 | 0,2 | 15.2 | 42.2 | 0.39 | 0.12 | 0.38 | 8.0 |
| 3590 + 1/2 | 67.43 | 0.00 | 4.6 | 1.60 | 1.61 | 0.99 | 0.99 | 0.99 | 0.043 | 1.41 | 0,2 | 15.6 | 42.2 | 0.39 | 0.11 | 0.38 | 8.0 |
| 3591 | 67.02 | 0.00 | 4.7 | 1.63 | 1.60 | 1.02 | 1.03 | 1.02 | 0.028 | 1.36 | 5,3 | 15.6 | 42.3 | 0.39 | 0.10 | 0.38 | 8.0 |
| 3591 + 1/2 | 66.61 | 0.00 | 4.6 | 1.57 | 1.60 | 0.98 | 0.97 | 0.97 | 0.026 | 1.31 | 11,8 | 15.7 | 45.3 | 0.39 | 0.09 | 0.38 | 8.0 |
| 3592 | 66.21 | 0.00 | 4.6 | 1.61 | 1.59 | 1.01 | 0.99 | 0.99 | 0.039 | 1.36 | 0,2 | 15.8 | 43.1 | 0.39 | 0.10 | 0.38 | 8.0 |
| 3592 + 1/2 | 65.82 | 0.00 | 4.6 | 1.58 | 1.59 | 0.99 | 1.02 | 0.99 | 0.023 | 1.33 | 2,1 | 15.6 | 38.5 | 0.38 | 0.09 | 0.38 | 8.0 |
| 3593 | 65.43 | 0.00 | 4.6 | 1.59 | 1.58 | 1.01 | 1.01 | 1.01 | 0.028 | 1.57 | 12,8 | 15.5 | 40.9 | 0.38 | 0.09 | 0.37 | 8.0 |
| 3593 + 1/2 | 65.05 | 0.00 | 4.5 | 1.59 | 1.57 | 1.01 | 1.00 | 1.00 | 0.023 | 1.28 | 2,1 | 15.4 | 39.5 | 0.38 | 0.09 | 0.37 | 8.0 |
| 3594 | 64.68 | 0.01 | 4.6 | 1.56 | 1.57 | 0.99 | 1.01 | 0.99 | 0.034 | 1.35 | 1,0 | 15.3 | 39.7 | 0.38 | 0.09 | 0.37 | 8.1 |
| 3594 + 1/2 | 64.31 | 0.01 | 4.5 | 1.56 | 1.57 | 0.99 | 1.03 | 0.99 | 0.020 | 1.35 | 0,1 | 15.3 | 35.0 | 0.38 | 0.09 | 0.37 | 8.1 |
| 3595 | 63.96 | 0.00 | 4.7 | 1.57 | 1.55 | 1.01 | 0.97 | 0.97 | 0.057 | 1.46 | 1,0 | 15.3 | 33.7 | 0.38 | 0.10 | 0.37 | 8.0 |
| 3595 + 1/2 | 63.62 | 0.01 | 4.7 | 1.54 | 1.55 | 0.99 | 0.95 | 0.95 | 0.055 | 1.50 | 0,1 | 15.5 | 33.1 | 0.38 | 0.11 | 0.37 | 8.0 |
| 3596 | 63.29 | 0.00 | 4.5 | 1.55 | 1.53 | 1.02 | 1.03 | 1.02 | 0.025 | 1.46 | 1,0 | 15.7 | 29.6 | 0.38 | 0.10 | 0.37 | 8.0 |
| 3596 + 1/2 | 62.96 | 0.00 | 4.4 | 1.51 | 1.53 | 0.99 | 1.04 | 0.99 | 0.025 | 1.41 | 0,1 | 15.7 | 29.7 | 0.38 | 0.11 | 0.37 | 8.0 |
| 3597 | 62.65 | 0.01 | 4.6 | 1.52 | 1.51 | 1.01 | 1.00 | 1.00 | 0.046 | 1.39 | 10,8 | 15.8 | 30.1 | 0.38 | 0.11 | 0.37 | 8.0 |
| 3597 + 1/2 | 62.34 | 0.00 | 4.4 | 1.48 | 1.51 | 0.98 | 1.00 | 0.98 | 0.032 | 1.39 | 1,0 | 16.1 | 29.2 | 0.37 | 0.11 | 0.36 | 8.0 |
| 3598 | 62.05 | 0.00 | 4.5 | 1.48 | 1.49 | 0.99 | 1.02 | 0.99 | 0.029 | 1.52 | 12,0 | 16.2 | 29.5 | 0.37 | 0.11 | 0.36 | 8.0 |
| 3598 + 1/2 | 61.76 | 0.01 | 4.5 | 1.47 | 1.48 | 0.99 | 1.01 | 0.99 | 0.032 | 1.40 | 0,0 | 16.5 | 27.4 | 0.37 | 0.10 | 0.35 | 8.0 |
| 3599 | 61.48 | 0.01 | 4.4 | 1.50 | 1.47 | 1.03 | 0.98 | 0.98 | 0.056 | 1.36 | 5,6 | 16.4 | 27.3 | 0.37 | 0.09 | 0.35 | 8.8 |
| 3599 + 1/2 | 61.22 | 0.00 | 4.5 | 1.46 | 1.45 | 1.01 | 0.99 | 0.99 | 0.056 | 1.32 | 5,7 | 16.3 | 27.1 | 0.36 | 0.09 | 0.35 | 8.8 |
| 3600 | 60.96 | 0.01 | 4.4 | 1.44 | 1.45 | 0.99 | 1.00 | 0.99 | 0.050 | 1.24 | 14,0 | 16.3 | 27.0 | 0.36 | 0.09 | 0.35 | 8.8 |
| 3600 + 1/2 | 60.73 | 0.00 | 4.3 | 1.43 | 1.44 | 1.00 | 1.00 | 1.00 | 0.046 | 1.28 | 0,0 | 16.3 | 26.8 | 0.36 | 0.09 | 0.35 | 8.8 |
| 3601 | 60.50 | 0.02 | 4.4 | 1.43 | 1.43 | 1.00 | 1.00 | 1.00 | 0.046 | 1.28 | 7,0 | 16.4 | 26.8 | 0.36 | 0.09 | 0.35 | 8.8 |
| 3601 + 1/2 | 60.30 | 0.01 | 4.2 | 1.43 | 1.43 | 1.00 | 0.99 | 0.99 | 0.046 | 1.25 | 12,1 | 16.5 | 26.5 | 0.36 | 0.10 | 0.34 | 8.7 |
| 3602 | 60.09 | 0.00 | 4.3 | 1.41 | 1.43 | 0.98 | 0.97 | 0.97 | 0.053 | 1.27 | 15,7 | 16.4 | 26.0 | 0.36 | 0.09 | 0.34 | 8.7 |
| 3602 + 1/2 | 59.89 | 0.00 | 4.4 | 1.41 | 1.42 | 0.99 | 0.96 | 0.96 | 0.057 | 1.33 | 13,8 | 16.3 | 25.5 | 0.36 | 0.10 | 0.34 | 8.7 |
| 3603 | 59.69 | 0.01 | 4.3 | 1.41 | 1.42 | 0.99 | 0.95 | 0.95 | 0.059 | 1.16 | 6,6 | 16.2 | 25.2 | 0.36 | 0.10 | 0.34 | 8.7 |
| 3603 + 1/2 | 59.48 | 0.00 | 4.3 | 1.40 | 1.42 | 0.99 | 0.97 | 0.97 | 0.053 | 1.20 | 14,0 | 16.2 | 24.7 | 0.35 | 0.11 | 0.34 | 8.7 |
| 3604 | 59.26 | 0.00 | 4.2 | 1.41 | 1.42 | 1.00 | 0.98 | 0.98 | 0.042 | 1.20 | 12,0 | 15.9 | 24.1 | 0.35 | 0.11 | 0.34 | 8.6 |
| 3604 + 1/2 | 59.06 | 0.00 | 4.2 | 1.40 | 1.41 | 0.99 | 0.97 | 0.97 | 0.044 | 1.20 | 12,3 | 15.9 | 23.8 | 0.35 | 0.11 | 0.34 | 8.7 |
| 3605 | 58.85 | 0.00 | 4.3 | 1.44 | 1.41 | 1.02 | 0.94 | 0.94 | 0.068 | 1.48 | 5,7 | 15.8 | 23.5 | 0.35 | 0.12 | 0.34 | 8.6 |
| 3605 + 1/2 | 58.64 | 0.00 | 4.3 | 1.37 | 1.41 | 0.98 | 0.95 | 0.95 | 0.051 | 1.17 | 13,1 | 15.6 | 23.3 | 0.35 | 0.12 | 0.34 | 8.7 |
| 3606 | 58.44 | 0.00 | 4.2 | 1.42 | 1.40 | 1.01 | 0.95 | 0.95 | 0.067 | 1.37 | 6,8 | 15.4 | 22.9 | 0.35 | 0.12 | 0.34 | 8.7 |
| 3606 + 1/2 | 58.24 | 0.01 | 4.3 | 1.39 | 1.40 | 0.99 | 0.96 | 0.96 | 0.051 | 1.18 | 3,8 | 15.0 | 22.7 | 0.35 | 0.12 | 0.34 | 8.7 |
| 3607 | 58.06 | 0.00 | 4.2 | 1.42 | 1.39 | 1.02 | 0.94 | 0.94 | 0.069 | 1.21 | 14,7 | 14.7 | 22.7 | 0.35 | 0.13 | 0.34 | 8.7 |
| 3607 + 1/2 | 57.87 | 0.00 | 4.1 | 1.36 | 1.39 | 0.97 | 1.01 | 0.97 | 0.024 | 1.30 | 10,8 | 14.4 | 22.3 | 0.35 | 0.13 | 0.34 | 8.7 |
| 3608 | 57.70 | 0.01 | 4.1 | 1.42 | 1.38 | 1.03 | 0.98 | 0.98 | 0.071 | 1.29 | 5,6 | 14.1 | 22.4 | 0.36 | 0.13 | 0.34 | 8.7 |
| 3608 + 1/2 | 57.54 | 0.00 | 4.1 | 1.40 | 1.37 | 1.02 | 0.99 | 0.99 | 0.047 | 1.20 | 5,2 | 13.6 | 22.1 | 0.38 | 0.12 | 0.36 | 8.7 |
| 3609 | 57.38 | 0.01 | 3.9 | 1.37 | 1.37 | 1.00 | 1.07 | 1.00 | 0.018 | 1.21 | 14,8 | 13.3 | 21.7 | 0.38 | 0.12 | 0.37 | 8.7 |
| 3609 + 1/2 | 57.24 | 0.01 | 3.9 | 1.37 | 1.37 | 1.01 | 1.05 | 1.01 | 0.025 | 1.32 | 14,8 | 13.0 | 21.7 | 0.39 | 0.13 | 0.37 | 8.7 |
| 3610 | 57.12 | 0.01 | 3.8 | 1.38 | 1.35 | 1.02 | 1.06 | 1.02 | 0.020 | 1.31 | 6,8 | 12.7 | 21.5 | 0.39 | 0.13 | 0.37 | 8.7 |
| 3610 + 1/2 | 57.01 | 0.01 | 3.8 | 1.34 | 1.35 | 0.99 | 1.06 | 0.99 | 0.015 | 1.24 | 8,1 | 12.4 | 21.6 | 0.39 | 0.13 | 0.37 | 8.7 |
| 3611 | 56.91 | 0.01 | 4.0 | 1.35 | 1.34 | 1.00 | 0.99 | 0.99 | 0.046 | 1.23 | 9,2 | 12.2 | 21.3 | 0.39 | 0.14 | 0.37 | 8.7 |
| 3611 + 1/2 | 56.83 | 0.00 | 3.6 | 1.34 | 1.33 | 1.01 | 1.06 | 1.01 | 0.017 | 1.30 | 6,8 | 11.9 | 21.3 | 0.41 | 0.14 | 0.39 | 8.7 |
| 3612 | 56.75 | 0.01 | 3.7 | 1.32 | 1.33 | 0.99 | 1.07 | 0.99 | 0.009 | 1.22 | 9,7 | 11.7 | 21.1 | 0.41 | 0.14 | 0.40 | 8.7 |
| 3612 + 1/2 | 56.69 | 0.01 | 3.5 | 1.33 | 1.31 | 1.01 | 1.05 | 1.01 | 0.016 | 1.39 | 9,2 | 11.4 | 21.1 | 0.41 | 0.14 | 0.40 | 8.7 |
| 3613 | 56.65 | 0.01 | 3.5 | 1.30 | 1.30 | 1.00 | 1.04 | 1.00 | 0.013 | 1.31 | 11,0 | 11.3 | 20.7 | 0.42 | 0.14 | 0.40 | 8.7 |
| 3613 + 1/2 | 56.63 | 0.01 | 3.5 | 1.28 | 1.29 | 0.99 | 1.02 | 0.99 | 0.017 | 1.43 | 9,2 | 11.0 | 21.1 | 0.42 | 0.14 | 0.40 | 8.7 |
| 3614 | 56.63 | 0.01 | 3.4 | 1.27 | 1.27 | 1.00 | 1.03 | 1.00 | 0.013 | 1.21 | 9,2 | 10.8 | 21.1 | 0.42 | 0.14 | 0.40 | 8.7 |
| 3614 + 1/2 | 56.63 | 0.01 | 3.3 | 1.26 | 1.26 | 1.00 | 1.03 | 1.00 | 0.012 | 1.40 | 9,2 | 10.5 | 20.5 | 0.42 | 0.15 | 0.41 | 8.7 |
| 3615 | 56.66 | 0.01 | 3.2 | 1.25 | 1.25 | 1.00 | 1.00 | 1.00 | 0.012 | 1.35 | 9,2 | 10.5 | 20.3 | 0.43 | 0.14 | 0.41 | 8.7 |
| 3615 + 1/2 | 56.69 | 0.01 | 3.2 | 1.23 | 1.24 | 0.99 | 1.00 | 0.99 | 0.009 | 1.21 | 9,2 | 10.4 | 19.9 | 0.43 | 0.15 | 0.41 | 8.7 |
| 3616 | 56.74 | 0.00 | 3.2 | 1.22 | 1.22 | 1.00 | 1.02 | 1.00 | 0.005 | 1.28 | 9,2 | 10.1 | 19.5 | 0.43 | 0.14 | 0.41 | 8.6 |
| 3616 + 1/2 | 56.80 | 0.01 | 3.1 | 1.22 | 1.22 | 1.00 | 1.01 | 1.00 | 0.006 | 1.18 | 0,5 | 9.9 | 19.5 | 0.43 | 0.14 | 0.42 | 8.6 |
| 3617 | 56.87 | 0.00 | 3.1 | 1.22 | 1.21 | 1.01 | 1.02 | 1.01 | 0.005 | 1.46 | 9,1 | 9.8 | 19.4 | 0.43 | 0.14 | 0.42 | 8.6 |
| 3617 + 1/2 | 56.95 | 0.01 | 3.1 | 1.20 | 1.21 | 0.99 | 1.00 | 0.99 | 0.004 | 1.41 | 15,7 | 9.6 | 18.9 | 0.44 | 0.13 | 0.42 | 8.6 |
| 3618 | 57.04 | 0.00 | 3.0 | 1.21 | 1.20 | 1.00 | 1.00 | 1.00 | 0.009 | 1.65 | 15,7 | 9.4 | 18.5 | 0.44 | 0.13 | 0.42 | 8.6 |
| 3618 + 1/2 | 57.13 | 0.00 | 3.0 | 1.21 | 1.19 | 1.02 | 1.01 | 1.01 | 0.009 | 1.73 | 15,7 | 9.1 | 18.3 | 0.44 | 0.12 | 0.42 | 8.6 |
| 3619 | 57.24 | 0.01 | 3.0 | 1.17 | 1.18 | 0.99 | 1.00 | 0.99 | 0.005 | 1.46 | 15,7 | 8.8 | 17.6 | 0.44 | 0.12 | 0.43 | 8.5 |
| 3619 + 1/2 | 57.35 | 0.00 | 3.0 | 1.15 | 1.16 | 0.99 | 0.99 | 0.99 | 0.008 | 1.69 | 15,7 | 8.6 | 17.1 | 0.44 | 0.11 | 0.43 | 8.5 |
| 3620 | 57.47 | 0.00 | 2.9 | 1.16 | 1.15 | 1.01 | 1.01 | 1.01 | 0.008 | 1.56 | 15,7 | 8.2 | 16.5 | 0.45 | 0.11 | 0.43 | 8.5 |
| 3620 + 1/2 | 57.58 | 0.00 | 2.9 | 1.15 | 1.12 | 1.03 | 1.01 | 1.01 | 0.009 | 1.43 | 15,7 | 7.8 | 15.5 | 0.45 | 0.10 | 0.43 | 8.5 |
| 3621 | 57.71 | 0.00 | 2.8 | 1.09 | 1.11 | 0.98 | 0.98 | 0.98 | 0.006 | 1.64 | 15,7 | 7.4 | 14.5 | 0.45 | 0.09 | 0.44 | 8.5 |
| 3621 + 1/2 | 57.83 | 0.00 | 2.7 | 1.07 | 1.08 | 0.99 | 0.99 | 0.99 | 0.005 | 1.54 | 15,7 | 6.8 | 13.0 | 0.46 | 0.08 | 0.44 | 8.4 |
| 3622 | 57.95 | 0.00 | 2.7 | 1.07 | 1.06 | 1.01 | 1.01 | 1.01 | 0.005 | 1.92 | 15,7 | 6.3 | 11.6 | 0.46 | 0.07 | 0.44 | 8.4 |
| 3622 + 1/2 | 58.08 | 0.00 | 2.7 | 1.05 | 1.05 | 1.01 | 0.99 | 0.99 | 0.006 | 1.46 | 15,7 | 5.6 | 10.1 | 0.46 | 0.05 | 0.45 | 8.4 |
| 3623 | 58.21 | 0.00 | 2.5 | 1.03 | 1.03 | 0.99 | 1.00 | 0.99 | 0.001 | 1.59 | 15,7 | 5.1 | 8.7 | 0.47 | 0.04 | 0.45 | 8.4 |
| 3623 + 1/2 | 58.34 | 0.00 | 2.5 | 1.01 | 1.00 | 1.01 | 1.02 | 1.01 | 0.000 | 1.49 | 15,7 | 4.9 | 8.0 | 0.47 | 0.04 | 0.45 | 8.3 |
| 3624 | 58.47 | 0.00 | 2.4 | 0.98 | 0.98 | 0.99 | 0.98 | 0.98 | 0.003 | 1.26 | 10,1 | 4.8 | 7.7 | 0.47 | 0.03 | 0.45 | 8.3 |
| 3624 + 1/2 | 58.61 | 0.00 | 2.2 | 0.95 | 0.94 | 1.01 | 1.01 | 1.01 | 0.001 | 1.29 | 9,6 | 4.8 | 7.4 | 0.47 | 0.03 | 0.46 | 8.3 |
| 3625 | 58.74 | 0.00 | 2.2 | 0.91 | 0.92 | 0.99 | 0.99 | 0.99 | 0.001 | 1.41 | 3,3 | 5.0 | 7.4 | 0.48 | 0.02 | 0.46 | 8.4 |
| 3625 + 1/2 | 58.88 | 0.00 | 2.0 | 0.88 | 0.89 | 0.99 | 0.99 | 0.99 | 0.000 | 1.31 | 3,3 | 5.2 | 7.4 | 0.48 | 0.02 | 0.46 | 8.4 |
| 3626 | 59.02 | 0.00 | 1.8 | 0.86 | 0.86 | 1.00 | 1.00 | 1.00 | 0.000 | 1.25 | 7,8 | 5.5 | 7.8 | 0.48 | 0.02 | 0.46 | 8.3 |
| 3626 + 1/2 | 59.17 | 0.00 | 1.7 | 0.84 | 0.83 | 1.02 | 1.02 | 1.02 | 0.002 | 1.49 | 4,6 | 5.6 | 8.6 | 0.48 | 0.03 | 0.46 | 8.5 |
| 3627 | 59.32 | 0.00 | 1.5 | 0.79 | 0.80 | 0.99 | 0.99 | 0.99 | 0.000 | 1.41 | 5,6 | 5.8 | 8.7 | 0.48 | 0.03 | 0.47 | 8.5 |
| 3627 + 1/2 | 59.48 | 0.00 | 1.3 | 0.75 | 0.77 | 0.98 | 0.98 | 0.98 | 0.000 | 1.75 | 6,6 | 5.9 | 9.2 | 0.48 | 0.03 | 0.47 | 8.4 |
| 3628 | 59.64 | 0.00 | 1.2 | 0.72 | 0.75 | 0.96 | 0.96 | 0.96 | 0.000 | 1.74 | 7,6 | 6.0 | 8.9 | 0.48 | 0.04 | 0.47 | 8.4 |
| 3628 + 1/2 | 59.81 | 0.00 | 1.1 | 0.70 | 0.75 | 0.94 | 0.94 | 0.94 | 0.000 | 1.58 | 8,6 | 6.0 | 7.9 | 0.49 | 0.03 | 0.47 | 8.4 |
| 3629 last | 59.98 | 0.01 | 1.2 | 0.71 | 0.75 | 0.95 | 0.94 | 0.94 | 0.001 | 1.26 | 10,8 | 6.1 | 8.8 | 0.49 | 0.04 | 0.47 | 8.0 |
| 3629 + 1/2 | 60.17 | 0.00 | 1.4 | 0.72 | 0.75 | 0.97 | 0.96 | 0.96 | 0.002 | 1.30 | 14,5 | 6.1 | 9.0 | 0.49 | 0.04 | 0.47 | 8.0 |
| 3630 | 60.37 | 0.00 | 1.5 | 0.73 | 0.74 | 0.98 | 0.98 | 0.98 | 0.001 | 1.31 | 15,7 | 6.1 | 8.2 | 0.49 | 0.03 | 0.47 | 8.0 |
| 3630 + 1/2 | 60.56 | 0.00 | 1.5 | 0.73 | 0.74 | 0.98 | 0.98 | 0.98 | 0.000 | 1.30 | 6,8 | 6.1 | 9.1 | 0.49 | 0.04 | 0.47 | 8.0 |
| 3631 | 60.76 | 0.00 | 1.5 | 0.73 | 0.74 | 0.98 | 0.98 | 0.98 | 0.000 | 1.38 | 12,8 | 6.1 | 9.2 | 0.49 | 0.04 | 0.48 | 8.0 |
| 3631 + 1/2 | 60.96 | 0.00 | 1.5 | 0.74 | 0.74 | 0.99 | 0.99 | 0.99 | 0.000 | 1.31 | 15,8 | 6.1 | 11.3 | 0.49 | 0.04 | 0.48 | 8.0 |
| 3632 | 61.16 | 0.00 | 1.4 | 0.74 | 0.74 | 0.99 | 0.99 | 0.99 | 0.000 | 1.26 | 13,7 | 6.0 | 9.0 | 0.49 | 0.04 | 0.48 | 8.0 |
| 3632 + 1/2 | 61.36 | 0.00 | 1.5 | 0.74 | 0.74 | 0.99 | 0.99 | 0.99 | 0.001 | 1.18 | 14,5 | 6.0 | 8.3 | 0.49 | 0.04 | 0.48 | 8.0 |
| 3633 | 61.56 | 0.00 | 1.5 | 0.74 | 0.74 | 0.99 | 0.99 | 0.99 | 0.000 | 1.25 | 15,8 | 6.0 | 9.1 | 0.50 | 0.05 | 0.48 | 8.0 |
| 3633 + 1/2 | 61.76 | 0.00 | 1.5 | 0.74 | 0.74 | 0.99 | 0.99 | 0.99 | 0.000 | 1.39 | 15,8 | 5.9 | 8.4 | 0.50 | 0.05 | 0.48 | 8.0 |
| 3634 | 61.96 | 0.00 | 1.5 | 0.74 | 0.74 | 1.00 | 1.00 | 1.00 | 0.000 | 1.27 | 6,7 |  |  |  |  |  |  |
| 3634 + 1/2 | 62.16 | 0.00 | 1.5 | 0.73 | 0.74 | 0.99 | 0.99 | 0.99 | 0.000 | 1.21 | 15,8 |  |  |  |  |  |  |
| 3635 | 62.37 | 0.00 | 1.4 | 0.74 | 0.74 | 1.00 | 1.00 | 1.00 | 0.000 | 1.24 | 15,8 |  |  |  |  |  |  |
| 3635 + 1/2 | 62.57 | 0.00 | 1.5 | 0.74 | 0.74 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 4,5 |  |  |  |  |  |  |
| 3636 | 62.78 | 0.00 | 1.5 | 0.74 | 0.74 | 1.00 | 1.01 | 1.00 | 0.000 | 1.24 | 6,8 |  |  |  |  |  |  |
| 3636 + 1/2 | 62.98 | 0.00 | 1.4 | 0.75 | 0.74 | 1.00 | 1.00 | 1.00 | 0.000 | 1.53 | 15,8 |  |  |  |  |  |  |
| 3637 | 63.19 | 0.00 | 1.5 | 0.75 | 0.75 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 0,0 |  |  |  |  |  |  |
| 3637 + 1/2 | 63.40 | 0.00 | 1.4 | 0.75 | 0.75 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 12,8 |  |  |  |  |  |  |
| 3638 | 63.61 | 0.00 | 1.5 | 0.74 | 0.75 | 0.99 | 0.99 | 0.99 | 0.000 | 1.23 | 15,0 |  |  |  |  |  |  |
| 3638 + 1/2 | 63.82 | 0.00 | 1.5 | 0.75 | 0.75 | 1.00 | 1.01 | 1.00 | 0.000 | 1.21 | 9,8 |  |  |  |  |  |  |
| 3639 | 64.03 | 0.00 | 1.4 | 0.75 | 0.76 | 0.99 | 0.99 | 0.99 | 0.000 | 1.16 | 7,8 |  |  |  |  |  |  |
| 3639 + 1/2 | 64.23 | 0.00 | 1.5 | 0.76 | 0.76 | 1.00 | 1.00 | 1.00 | 0.001 | 1.16 | 8,6 |  |  |  |  |  |  |
| 3640 | 64.45 | 0.00 | 1.4 | 0.76 | 0.76 | 1.00 | 1.00 | 1.00 | 0.000 | 1.25 | 9,8 |  |  |  |  |  |  |
| 3640 + 1/2 | 64.66 | 0.00 | 1.5 | 0.76 | 0.76 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 15,8 |  |  |  |  |  |  |
| 3641 | 64.87 | 0.00 | 1.4 | 0.76 | 0.76 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 15,1 |  |  |  |  |  |  |
| 3641 + 1/2 | 65.08 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

### rise (saturn.rise, frames 3810 to 3884, window 3798 to 3896, 198 draft frames at rate 2)

Largest level step: 0.05 at frame 3875 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.196 from frame 3872 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 8.66 from frame 3896 to the next, block column 10 row 7 from the top left, shown, not judged.
Largest change in place: 24.1 from frame 3831 to 8 film frames later, most at pixel 1108, 896 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.41 from frame 3813 + 1/2 to 8 film frames later, most at pixel 1136, 792, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 3798 to 3809 + 1/2): change 17.0, pattern 0.35.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 3872 in ../work/p6/sj2/04/saturn-rise-p2of2-pops.png, frame 3872 + 1/2 in ../work/p6/sj2/04/saturn-rise-p2of2-pops.png, frame 3873 in ../work/p6/sj2/04/saturn-rise-p2of2-pops.png, frame 3873 + 1/2 in ../work/p6/sj2/04/saturn-rise-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 3798 in ../work/p6/sj2/03/saturn-rise-p1of2-changes.png, frame 3813 + 1/2 in ../work/p6/sj2/03/saturn-rise-p1of2-changes.png, frame 3831 in ../work/p6/sj2/03/saturn-rise-p1of2-changes.png, frame 3855 + 1/2 in no panel (a slice --frames 7711-7711 draws it).

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3798 | 92.48 |  | 1.7 | 1.59 | 1.57 | 1.01 | 1.03 | 1.01 | 0.016 | 1.36 | 3,2 | 17.0 | 20.3 | 0.69 | 0.35 | 0.66 | 8.0 |
| 3798 + 1/2 | 92.30 | 0.00 | 1.7 | 1.60 | 1.57 | 1.02 | 1.03 | 1.02 | 0.013 | 1.20 | 8,8 | 16.3 | 18.8 | 0.68 | 0.34 | 0.66 | 8.0 |
| 3799 | 92.11 | 0.00 | 1.8 | 1.60 | 1.57 | 1.02 | 1.02 | 1.02 | 0.016 | 1.13 | 6,3 | 15.5 | 17.5 | 0.68 | 0.34 | 0.66 | 8.0 |
| 3799 + 1/2 | 91.92 | 0.00 | 1.7 | 1.58 | 1.57 | 1.00 | 1.00 | 1.00 | 0.018 | 1.18 | 8,8 | 15.0 | 16.9 | 0.68 | 0.32 | 0.66 | 8.0 |
| 3800 | 91.73 | 0.00 | 1.8 | 1.60 | 1.57 | 1.02 | 1.03 | 1.02 | 0.016 | 1.19 | 12,0 | 14.7 | 16.9 | 0.68 | 0.32 | 0.66 | 8.0 |
| 3800 + 1/2 | 91.55 | 0.00 | 1.8 | 1.59 | 1.57 | 1.01 | 1.01 | 1.01 | 0.012 | 1.15 | 9,8 | 14.4 | 16.9 | 0.68 | 0.32 | 0.66 | 8.0 |
| 3801 | 91.37 | 0.00 | 1.8 | 1.59 | 1.57 | 1.01 | 1.01 | 1.01 | 0.013 | 1.27 | 0,7 | 14.0 | 16.8 | 0.68 | 0.30 | 0.66 | 8.0 |
| 3801 + 1/2 | 91.18 | 0.00 | 1.7 | 1.57 | 1.57 | 1.00 | 1.00 | 1.00 | 0.014 | 1.21 | 4,7 | 13.9 | 16.9 | 0.68 | 0.30 | 0.65 | 8.0 |
| 3802 | 90.99 | 0.00 | 1.8 | 1.58 | 1.57 | 1.00 | 1.01 | 1.00 | 0.013 | 1.19 | 5,6 | 13.6 | 16.0 | 0.68 | 0.29 | 0.65 | 8.0 |
| 3802 + 1/2 | 90.81 | 0.00 | 1.8 | 1.60 | 1.58 | 1.01 | 0.99 | 0.99 | 0.017 | 1.14 | 1,0 | 13.3 | 15.5 | 0.68 | 0.29 | 0.65 | 8.0 |
| 3803 | 90.63 | 0.00 | 1.8 | 1.58 | 1.58 | 1.00 | 0.98 | 0.98 | 0.022 | 1.15 | 7,0 | 13.1 | 15.6 | 0.67 | 0.29 | 0.65 | 8.0 |
| 3803 + 1/2 | 90.45 | 0.00 | 1.8 | 1.59 | 1.58 | 1.01 | 0.99 | 0.99 | 0.016 | 1.12 | 4,2 | 13.0 | 15.9 | 0.68 | 0.29 | 0.65 | 8.0 |
| 3804 | 90.27 | 0.00 | 1.8 | 1.57 | 1.58 | 0.99 | 0.98 | 0.98 | 0.016 | 1.15 | 8,0 | 13.1 | 16.6 | 0.67 | 0.29 | 0.65 | 8.0 |
| 3804 + 1/2 | 90.10 | 0.00 | 1.9 | 1.57 | 1.59 | 0.99 | 0.95 | 0.95 | 0.023 | 1.08 | 8,0 | 13.0 | 17.2 | 0.67 | 0.29 | 0.65 | 8.0 |
| 3805 | 89.92 | 0.00 | 1.9 | 1.58 | 1.59 | 1.00 | 0.97 | 0.97 | 0.021 | 1.20 | 2,8 | 13.0 | 17.8 | 0.67 | 0.30 | 0.64 | 8.0 |
| 3805 + 1/2 | 89.75 | 0.00 | 1.8 | 1.58 | 1.59 | 1.00 | 0.97 | 0.97 | 0.018 | 1.17 | 1,8 | 13.1 | 18.7 | 0.66 | 0.30 | 0.64 | 8.0 |
| 3806 | 89.56 | 0.00 | 1.8 | 1.56 | 1.59 | 0.98 | 0.98 | 0.98 | 0.015 | 1.13 | 10,0 | 13.1 | 19.6 | 0.66 | 0.31 | 0.63 | 8.0 |
| 3806 + 1/2 | 89.39 | 0.01 | 1.8 | 1.57 | 1.59 | 0.99 | 0.98 | 0.98 | 0.016 | 1.25 | 12,0 | 13.1 | 20.1 | 0.65 | 0.31 | 0.63 | 8.0 |
| 3807 | 89.20 | 0.00 | 1.8 | 1.57 | 1.59 | 0.99 | 0.98 | 0.98 | 0.016 | 1.13 | 2,5 | 13.1 | 21.0 | 0.64 | 0.32 | 0.62 | 8.0 |
| 3807 + 1/2 | 89.01 | 0.00 | 1.8 | 1.57 | 1.59 | 0.99 | 0.98 | 0.98 | 0.016 | 1.23 | 12,0 | 13.2 | 21.6 | 0.64 | 0.32 | 0.61 | 8.0 |
| 3808 | 88.82 | 0.00 | 1.8 | 1.55 | 1.59 | 0.97 | 0.96 | 0.96 | 0.015 | 1.16 | 13,1 | 13.4 | 22.4 | 0.63 | 0.33 | 0.60 | 8.0 |
| 3808 + 1/2 | 88.63 | 0.00 | 1.8 | 1.55 | 1.59 | 0.98 | 0.96 | 0.96 | 0.015 | 1.26 | 12,0 | 13.7 | 23.1 | 0.60 | 0.34 | 0.57 | 8.0 |
| 3809 | 88.43 | 0.00 | 1.8 | 1.55 | 1.59 | 0.97 | 0.96 | 0.96 | 0.017 | 1.23 | 0,5 | 13.9 | 24.1 | 0.59 | 0.35 | 0.57 | 8.0 |
| 3809 + 1/2 | 88.24 | 0.01 | 1.8 | 1.57 | 1.59 | 0.98 | 0.96 | 0.96 | 0.022 | 1.29 | 12,0 | 14.3 | 25.0 | 0.59 | 0.36 | 0.56 | 8.0 |
| 3810 first | 88.03 | 0.01 | 1.9 | 1.59 | 1.62 | 0.98 | 0.97 | 0.97 | 0.020 | 1.34 | 5,6 | 14.6 | 26.0 | 0.58 | 0.37 | 0.56 | 8.0 |
| 3810 + 1/2 | 87.79 | 0.00 | 2.1 | 1.65 | 1.66 | 1.00 | 1.04 | 1.00 | 0.016 | 1.56 | 5,6 | 14.7 | 26.5 | 0.59 | 0.38 | 0.56 | 8.0 |
| 3811 | 87.56 | 0.01 | 2.4 | 1.75 | 1.68 | 1.04 | 1.10 | 1.04 | 0.019 | 1.67 | 5,7 | 15.0 | 26.9 | 0.57 | 0.38 | 0.55 | 8.0 |
| 3811 + 1/2 | 87.33 | 0.00 | 2.6 | 1.80 | 1.68 | 1.07 | 1.14 | 1.07 | 0.016 | 1.80 | 5,7 | 15.2 | 27.4 | 0.57 | 0.40 | 0.54 | 8.0 |
| 3812 | 87.10 | 0.00 | 2.8 | 1.80 | 1.70 | 1.06 | 1.16 | 1.06 | 0.015 | 1.47 | 4,6 | 15.0 | 27.6 | 0.56 | 0.40 | 0.54 | 8.0 |
| 3812 + 1/2 | 86.86 | 0.00 | 3.0 | 1.89 | 1.70 | 1.11 | 1.20 | 1.11 | 0.018 | 1.59 | 5,8 | 15.4 | 27.6 | 0.55 | 0.40 | 0.52 | 8.0 |
| 3813 | 86.62 | 0.00 | 3.2 | 1.88 | 1.70 | 1.11 | 1.20 | 1.11 | 0.020 | 1.38 | 4,7 | 15.6 | 28.2 | 0.55 | 0.40 | 0.52 | 8.0 |
| 3813 + 1/2 | 86.38 | 0.01 | 3.4 | 1.87 | 1.70 | 1.10 | 1.14 | 1.10 | 0.033 | 1.56 | 0,1 | 15.1 | 28.6 | 0.53 | 0.41 | 0.50 | 8.0 |
| 3814 | 86.12 | 0.00 | 3.5 | 1.87 | 1.70 | 1.10 | 1.16 | 1.10 | 0.024 | 1.50 | 0,1 | 15.3 | 28.4 | 0.52 | 0.40 | 0.50 | 8.0 |
| 3814 + 1/2 | 85.86 | 0.00 | 3.6 | 1.90 | 1.70 | 1.12 | 1.18 | 1.12 | 0.028 | 1.73 | 5,8 | 13.9 | 28.5 | 0.52 | 0.39 | 0.49 | 8.0 |
| 3815 | 85.59 | 0.00 | 3.8 | 1.84 | 1.70 | 1.09 | 1.16 | 1.09 | 0.025 | 1.44 | 3,1 | 13.9 | 28.6 | 0.52 | 0.39 | 0.49 | 8.0 |
| 3815 + 1/2 | 85.32 | 0.00 | 3.9 | 1.85 | 1.70 | 1.09 | 1.10 | 1.09 | 0.038 | 1.40 | 5,2 | 14.0 | 28.4 | 0.52 | 0.38 | 0.49 | 8.0 |
| 3816 | 85.05 | 0.00 | 4.1 | 1.82 | 1.70 | 1.07 | 1.03 | 1.03 | 0.069 | 1.42 | 5,2 | 14.0 | 28.5 | 0.50 | 0.38 | 0.48 | 8.0 |
| 3816 + 1/2 | 84.77 | 0.01 | 4.2 | 1.82 | 1.70 | 1.07 | 1.06 | 1.06 | 0.058 | 1.33 | 5,2 | 13.8 | 28.4 | 0.50 | 0.37 | 0.47 | 8.0 |
| 3817 | 84.48 | 0.00 | 4.3 | 1.79 | 1.70 | 1.06 | 1.05 | 1.05 | 0.061 | 1.36 | 9,0 | 13.3 | 28.5 | 0.45 | 0.21 | 0.41 | 8.0 |
| 3817 + 1/2 | 84.19 | 0.00 | 4.6 | 1.73 | 1.70 | 1.02 | 1.00 | 1.00 | 0.052 | 1.32 | 9,0 | 13.3 | 29.2 | 0.44 | 0.22 | 0.41 | 8.1 |
| 3818 | 83.90 | 0.00 | 4.6 | 1.76 | 1.70 | 1.04 | 1.06 | 1.04 | 0.042 | 1.26 | 13,0 | 13.3 | 31.3 | 0.45 | 0.23 | 0.41 | 8.1 |
| 3818 + 1/2 | 83.59 | 0.00 | 4.7 | 1.72 | 1.70 | 1.01 | 0.96 | 0.96 | 0.072 | 1.25 | 10,7 | 13.1 | 31.9 | 0.45 | 0.23 | 0.41 | 8.2 |
| 3819 | 83.29 | 0.00 | 4.8 | 1.71 | 1.70 | 1.01 | 1.08 | 1.01 | 0.039 | 1.34 | 9,0 | 12.2 | 25.7 | 0.44 | 0.22 | 0.41 | 8.3 |
| 3819 + 1/2 | 82.98 | 0.00 | 5.0 | 1.65 | 1.70 | 0.97 | 0.95 | 0.95 | 0.078 | 1.44 | 15,8 | 12.4 | 26.3 | 0.44 | 0.21 | 0.41 | 8.3 |
| 3820 | 82.66 | 0.00 | 5.0 | 1.68 | 1.65 | 1.02 | 1.00 | 1.00 | 0.066 | 1.56 | 15,8 | 12.3 | 25.8 | 0.45 | 0.20 | 0.41 | 8.4 |
| 3820 + 1/2 | 82.34 | 0.00 | 5.3 | 1.65 | 1.65 | 1.00 | 1.04 | 1.00 | 0.060 | 1.67 | 15,8 | 12.5 | 26.0 | 0.45 | 0.19 | 0.41 | 8.4 |
| 3821 | 82.02 | 0.00 | 5.4 | 1.65 | 1.64 | 1.01 | 1.00 | 1.00 | 0.084 | 1.70 | 15,8 | 12.9 | 26.2 | 0.45 | 0.19 | 0.41 | 8.4 |
| 3821 + 1/2 | 81.70 | 0.00 | 5.6 | 1.62 | 1.63 | 0.99 | 0.99 | 0.99 | 0.072 | 1.75 | 15,8 | 13.2 | 26.1 | 0.45 | 0.18 | 0.41 | 8.5 |
| 3822 | 81.38 | 0.00 | 5.5 | 1.62 | 1.61 | 1.00 | 0.93 | 0.93 | 0.096 | 1.76 | 15,8 | 13.0 | 26.3 | 0.45 | 0.17 | 0.41 | 8.6 |
| 3822 + 1/2 | 81.06 | 0.00 | 6.0 | 1.60 | 1.61 | 0.99 | 0.92 | 0.92 | 0.091 | 1.68 | 15,8 | 13.0 | 26.7 | 0.45 | 0.17 | 0.41 | 8.7 |
| 3823 | 80.74 | 0.00 | 6.0 | 1.53 | 1.61 | 0.95 | 0.87 | 0.87 | 0.098 | 1.60 | 15,8 | 14.0 | 26.8 | 0.45 | 0.17 | 0.41 | 8.0 |
| 3823 + 1/2 | 80.41 | 0.01 | 6.1 | 1.57 | 1.61 | 0.98 | 0.87 | 0.87 | 0.107 | 1.62 | 15,8 | 15.1 | 27.4 | 0.45 | 0.17 | 0.41 | 8.0 |
| 3824 | 80.10 | 0.01 | 6.1 | 1.58 | 1.61 | 0.98 | 0.87 | 0.87 | 0.108 | 1.64 | 5,8 | 16.1 | 26.1 | 0.45 | 0.18 | 0.41 | 8.0 |
| 3824 + 1/2 | 79.81 | 0.01 | 6.3 | 1.54 | 1.61 | 0.96 | 0.80 | 0.80 | 0.168 | 1.49 | 15,8 | 17.2 | 27.1 | 0.45 | 0.20 | 0.41 | 8.0 |
| 3825 | 79.53 | 0.01 | 6.4 | 1.56 | 1.61 | 0.97 | 0.88 | 0.88 | 0.135 | 1.47 | 14,8 | 18.2 | 27.2 | 0.45 | 0.21 | 0.42 | 8.0 |
| 3825 + 1/2 | 79.27 | 0.01 | 6.6 | 1.49 | 1.61 | 0.93 | 0.83 | 0.83 | 0.112 | 1.47 | 10,8 | 18.8 | 28.5 | 0.46 | 0.22 | 0.42 | 8.0 |
| 3826 | 79.02 | 0.01 | 6.7 | 1.53 | 1.61 | 0.95 | 0.87 | 0.87 | 0.101 | 1.46 | 14,8 | 19.6 | 29.3 | 0.44 | 0.22 | 0.41 | 8.0 |
| 3826 + 1/2 | 78.80 | 0.01 | 6.7 | 1.54 | 1.61 | 0.96 | 0.94 | 0.94 | 0.102 | 1.47 | 14,8 | 20.4 | 30.0 | 0.44 | 0.23 | 0.40 | 8.0 |
| 3827 | 78.60 | 0.01 | 7.0 | 1.58 | 1.61 | 0.98 | 0.95 | 0.95 | 0.078 | 1.50 | 7,8 | 21.5 | 39.6 | 0.43 | 0.24 | 0.39 | 8.0 |
| 3827 + 1/2 | 78.41 | 0.01 | 7.1 | 1.56 | 1.61 | 0.97 | 0.95 | 0.95 | 0.075 | 1.51 | 7,8 | 21.8 | 40.5 | 0.42 | 0.26 | 0.39 | 8.0 |
| 3828 | 78.24 | 0.02 | 7.3 | 1.54 | 1.61 | 0.95 | 0.93 | 0.93 | 0.082 | 1.41 | 7,8 | 22.0 | 41.5 | 0.42 | 0.27 | 0.38 | 8.0 |
| 3828 + 1/2 | 78.12 | 0.02 | 7.3 | 1.52 | 1.61 | 0.95 | 0.97 | 0.95 | 0.067 | 1.90 | 15,6 | 22.4 | 42.2 | 0.40 | 0.24 | 0.37 | 8.0 |
| 3829 | 78.04 | 0.01 | 7.5 | 1.58 | 1.61 | 0.98 | 0.99 | 0.98 | 0.069 | 1.49 | 11,1 | 22.7 | 41.3 | 0.40 | 0.25 | 0.37 | 8.0 |
| 3829 + 1/2 | 77.96 | 0.02 | 7.7 | 1.56 | 1.61 | 0.97 | 1.02 | 0.97 | 0.062 | 1.50 | 3,2 | 22.8 | 40.4 | 0.39 | 0.26 | 0.36 | 8.0 |
| 3830 | 77.92 | 0.01 | 7.6 | 1.60 | 1.61 | 1.00 | 1.03 | 1.00 | 0.066 | 1.53 | 12,3 | 23.6 | 37.9 | 0.36 | 0.28 | 0.32 | 8.0 |
| 3830 + 1/2 | 77.90 | 0.01 | 7.9 | 1.60 | 1.61 | 1.00 | 0.99 | 0.99 | 0.078 | 1.44 | 12,3 | 23.8 | 36.5 | 0.36 | 0.28 | 0.32 | 8.0 |
| 3831 | 77.89 | 0.01 | 8.1 | 1.63 | 1.61 | 1.02 | 1.09 | 1.02 | 0.056 | 1.40 | 12,3 | 24.1 | 36.0 | 0.34 | 0.29 | 0.30 | 8.0 |
| 3831 + 1/2 | 77.91 | 0.01 | 8.2 | 1.61 | 1.63 | 0.99 | 1.07 | 0.99 | 0.060 | 1.48 | 12,3 | 24.1 | 35.9 | 0.34 | 0.30 | 0.30 | 8.0 |
| 3832 | 77.95 | 0.01 | 8.3 | 1.65 | 1.62 | 1.02 | 1.06 | 1.02 | 0.077 | 1.50 | 6,8 | 23.7 | 35.7 | 0.33 | 0.32 | 0.30 | 8.0 |
| 3832 + 1/2 | 78.00 | 0.01 | 8.6 | 1.65 | 1.62 | 1.01 | 1.10 | 1.01 | 0.060 | 1.42 | 11,3 | 23.3 | 35.2 | 0.33 | 0.32 | 0.29 | 8.2 |
| 3833 | 78.06 | 0.00 | 8.8 | 1.64 | 1.62 | 1.01 | 1.10 | 1.01 | 0.055 | 1.48 | 15,5 | 22.8 | 34.5 | 0.33 | 0.31 | 0.30 | 8.0 |
| 3833 + 1/2 | 78.12 | 0.00 | 9.0 | 1.67 | 1.62 | 1.03 | 1.02 | 1.02 | 0.100 | 1.50 | 2,1 | 22.4 | 33.8 | 0.33 | 0.31 | 0.29 | 8.0 |
| 3834 | 78.18 | 0.00 | 9.3 | 1.69 | 1.62 | 1.04 | 1.03 | 1.03 | 0.085 | 1.69 | 2,1 | 22.0 | 32.7 | 0.33 | 0.31 | 0.30 | 8.0 |
| 3834 + 1/2 | 78.25 | 0.00 | 9.4 | 1.73 | 1.62 | 1.07 | 0.99 | 0.99 | 0.106 | 1.81 | 0,5 | 21.6 | 31.9 | 0.33 | 0.30 | 0.30 | 8.0 |
| 3835 | 78.33 | 0.01 | 9.7 | 1.77 | 1.62 | 1.09 | 1.05 | 1.05 | 0.089 | 1.74 | 0,5 | 21.2 | 31.0 | 0.33 | 0.30 | 0.29 | 8.0 |
| 3835 + 1/2 | 78.38 | 0.00 | 9.9 | 1.77 | 1.62 | 1.09 | 1.07 | 1.07 | 0.092 | 1.68 | 2,6 | 20.8 | 29.8 | 0.33 | 0.29 | 0.29 | 8.0 |
| 3836 | 78.44 | 0.00 | 10.1 | 1.82 | 1.62 | 1.12 | 1.04 | 1.04 | 0.105 | 2.23 | 2,6 | 20.5 | 28.4 | 0.34 | 0.28 | 0.30 | 8.0 |
| 3836 + 1/2 | 78.51 | 0.01 | 10.4 | 1.81 | 1.62 | 1.12 | 1.02 | 1.02 | 0.107 | 1.92 | 14,8 | 20.0 | 26.7 | 0.34 | 0.26 | 0.31 | 8.0 |
| 3837 | 78.58 | 0.00 | 10.7 | 1.84 | 1.62 | 1.13 | 1.07 | 1.07 | 0.101 | 1.94 | 14,8 | 19.5 | 24.9 | 0.36 | 0.25 | 0.32 | 8.0 |
| 3837 + 1/2 | 78.66 | 0.00 | 10.9 | 1.81 | 1.62 | 1.12 | 1.01 | 1.01 | 0.127 | 2.32 | 14,7 | 19.0 | 23.2 | 0.37 | 0.24 | 0.34 | 8.0 |
| 3838 | 78.74 | 0.00 | 11.2 | 1.80 | 1.62 | 1.11 | 1.01 | 1.01 | 0.119 | 2.59 | 14,7 | 18.6 | 21.7 | 0.38 | 0.23 | 0.36 | 8.0 |
| 3838 + 1/2 | 78.82 | 0.01 | 11.4 | 1.75 | 1.62 | 1.08 | 1.00 | 1.00 | 0.096 | 2.63 | 14,7 | 18.0 | 21.4 | 0.38 | 0.22 | 0.36 | 8.0 |
| 3839 | 78.92 | 0.00 | 11.5 | 1.70 | 1.62 | 1.05 | 0.96 | 0.96 | 0.092 | 2.80 | 14,7 | 17.4 | 20.9 | 0.38 | 0.20 | 0.37 | 8.0 |
| 3839 + 1/2 | 79.03 | 0.01 | 11.9 | 1.65 | 1.61 | 1.03 | 0.93 | 0.93 | 0.103 | 2.67 | 14,7 | 17.0 | 21.2 | 0.39 | 0.20 | 0.37 | 8.0 |
| 3840 | 79.15 | 0.00 | 12.0 | 1.60 | 1.62 | 0.99 | 0.95 | 0.95 | 0.079 | 2.37 | 14,7 | 16.5 | 21.0 | 0.41 | 0.17 | 0.39 | 8.0 |
| 3840 + 1/2 | 79.27 | 0.00 | 12.2 | 1.59 | 1.61 | 0.99 | 0.93 | 0.93 | 0.080 | 2.49 | 14,7 | 16.5 | 23.4 | 0.41 | 0.17 | 0.39 | 8.0 |
| 3841 | 79.39 | 0.01 | 12.2 | 1.61 | 1.61 | 1.00 | 0.93 | 0.93 | 0.076 | 2.24 | 13,7 | 16.1 | 24.5 | 0.41 | 0.18 | 0.39 | 8.0 |
| 3841 + 1/2 | 79.49 | 0.00 | 12.3 | 1.57 | 1.61 | 0.98 | 0.97 | 0.97 | 0.066 | 2.80 | 13,7 | 15.7 | 23.5 | 0.41 | 0.18 | 0.39 | 8.0 |
| 3842 | 79.58 | 0.01 | 12.6 | 1.57 | 1.61 | 0.97 | 0.94 | 0.94 | 0.065 | 3.14 | 13,7 | 15.4 | 23.3 | 0.41 | 0.23 | 0.39 | 8.0 |
| 3842 + 1/2 | 79.66 | 0.01 | 12.5 | 1.56 | 1.61 | 0.97 | 0.91 | 0.91 | 0.081 | 3.36 | 13,7 | 14.7 | 22.7 | 0.40 | 0.25 | 0.38 | 8.0 |
| 3843 | 79.71 | 0.01 | 12.6 | 1.53 | 1.61 | 0.95 | 0.96 | 0.95 | 0.054 | 3.65 | 13,7 | 14.1 | 24.5 | 0.41 | 0.21 | 0.39 | 8.0 |
| 3843 + 1/2 | 79.76 | 0.02 | 12.6 | 1.56 | 1.61 | 0.97 | 0.96 | 0.96 | 0.060 | 3.99 | 13,7 | 13.6 | 21.9 | 0.41 | 0.17 | 0.38 | 8.0 |
| 3844 | 79.83 | 0.00 | 12.5 | 1.57 | 1.61 | 0.97 | 1.01 | 0.97 | 0.053 | 4.92 | 13,7 | 13.0 | 21.2 | 0.40 | 0.17 | 0.37 | 8.0 |
| 3844 + 1/2 | 79.91 | 0.00 | 12.5 | 1.53 | 1.61 | 0.95 | 0.99 | 0.95 | 0.051 | 4.05 | 13,7 | 12.4 | 21.2 | 0.40 | 0.17 | 0.37 | 8.0 |
| 3845 | 79.97 | 0.00 | 12.6 | 1.52 | 1.61 | 0.94 | 0.98 | 0.94 | 0.053 | 3.65 | 13,7 | 11.9 | 22.3 | 0.39 | 0.19 | 0.37 | 8.0 |
| 3845 + 1/2 | 80.05 | 0.00 | 12.6 | 1.50 | 1.61 | 0.93 | 0.96 | 0.93 | 0.050 | 3.53 | 12,8 | 11.3 | 21.2 | 0.39 | 0.21 | 0.37 | 8.0 |
| 3846 | 80.12 | 0.00 | 12.6 | 1.52 | 1.61 | 0.95 | 0.96 | 0.95 | 0.051 | 3.79 | 12,8 | 10.9 | 22.6 | 0.38 | 0.21 | 0.35 | 8.0 |
| 3846 + 1/2 | 80.18 | 0.00 | 12.7 | 1.52 | 1.61 | 0.94 | 1.00 | 0.94 | 0.047 | 3.61 | 12,8 | 11.5 | 21.9 | 0.38 | 0.22 | 0.35 | 8.0 |
| 3847 | 80.25 | 0.01 | 12.4 | 1.51 | 1.61 | 0.94 | 0.98 | 0.94 | 0.043 | 3.85 | 12,8 | 12.3 | 21.8 | 0.38 | 0.23 | 0.35 | 8.0 |
| 3847 + 1/2 | 80.31 | 0.01 | 12.3 | 1.54 | 1.61 | 0.96 | 0.98 | 0.96 | 0.048 | 3.94 | 12,7 | 13.2 | 22.1 | 0.36 | 0.22 | 0.33 | 8.0 |
| 3848 | 80.33 | 0.02 | 12.2 | 1.59 | 1.61 | 0.99 | 0.99 | 0.99 | 0.048 | 3.52 | 12,7 | 14.0 | 23.0 | 0.35 | 0.21 | 0.33 | 8.0 |
| 3848 + 1/2 | 80.31 | 0.03 | 12.0 | 1.61 | 1.65 | 0.97 | 1.01 | 0.97 | 0.046 | 3.95 | 12,7 | 15.0 | 22.9 | 0.34 | 0.19 | 0.32 | 8.0 |
| 3849 | 80.24 | 0.02 | 12.0 | 1.70 | 1.67 | 1.02 | 1.06 | 1.02 | 0.047 | 4.35 | 12,7 | 15.9 | 22.7 | 0.33 | 0.18 | 0.31 | 8.0 |
| 3849 + 1/2 | 80.12 | 0.00 | 11.8 | 1.73 | 1.73 | 1.00 | 1.03 | 1.00 | 0.055 | 3.86 | 11,8 | 16.5 | 22.2 | 0.32 | 0.17 | 0.30 | 8.0 |
| 3850 | 80.00 | 0.02 | 11.7 | 1.76 | 1.76 | 1.00 | 1.03 | 1.00 | 0.064 | 3.60 | 11,8 | 16.5 | 23.1 | 0.32 | 0.17 | 0.30 | 8.0 |
| 3850 + 1/2 | 79.86 | 0.01 | 11.7 | 1.79 | 1.78 | 1.00 | 0.99 | 0.99 | 0.075 | 3.28 | 11,8 | 17.4 | 24.1 | 0.32 | 0.17 | 0.29 | 8.0 |
| 3851 | 79.69 | 0.01 | 11.4 | 1.81 | 1.80 | 1.01 | 0.98 | 0.98 | 0.076 | 3.57 | 11,7 | 18.4 | 25.8 | 0.31 | 0.17 | 0.29 | 8.0 |
| 3851 + 1/2 | 79.50 | 0.01 | 11.3 | 1.80 | 1.82 | 0.99 | 0.96 | 0.96 | 0.080 | 3.97 | 11,7 | 19.7 | 27.3 | 0.31 | 0.19 | 0.28 | 8.0 |
| 3852 | 79.28 | 0.00 | 11.1 | 1.83 | 1.82 | 1.00 | 0.98 | 0.98 | 0.080 | 4.40 | 11,7 | 20.4 | 28.6 | 0.31 | 0.19 | 0.28 | 8.0 |
| 3852 + 1/2 | 79.08 | 0.01 | 10.8 | 1.84 | 1.83 | 1.01 | 0.99 | 0.99 | 0.073 | 4.57 | 11,7 | 21.2 | 29.8 | 0.31 | 0.18 | 0.28 | 8.1 |
| 3853 | 78.86 | 0.00 | 10.9 | 1.84 | 1.85 | 0.99 | 1.02 | 0.99 | 0.071 | 4.80 | 11,7 | 22.0 | 30.8 | 0.30 | 0.20 | 0.28 | 8.1 |
| 3853 + 1/2 | 78.64 | 0.00 | 10.6 | 1.88 | 1.85 | 1.02 | 1.02 | 1.02 | 0.079 | 4.62 | 11,7 | 22.6 | 31.2 | 0.30 | 0.20 | 0.28 | 8.2 |
| 3854 | 78.42 | 0.00 | 10.4 | 1.89 | 1.86 | 1.02 | 1.02 | 1.02 | 0.069 | 4.47 | 11,7 | 22.8 | 31.8 | 0.30 | 0.19 | 0.28 | 8.2 |
| 3854 + 1/2 | 78.20 | 0.00 | 10.0 | 1.86 | 1.88 | 0.99 | 1.04 | 0.99 | 0.057 | 3.73 | 11,7 | 22.4 | 30.4 | 0.29 | 0.20 | 0.27 | 8.2 |
| 3855 | 77.98 | 0.00 | 10.0 | 1.94 | 1.88 | 1.03 | 1.01 | 1.01 | 0.080 | 3.30 | 11,7 | 23.2 | 30.5 | 0.29 | 0.23 | 0.27 | 8.2 |
| 3855 + 1/2 | 77.76 | 0.01 | 9.7 | 1.96 | 1.89 | 1.04 | 1.02 | 1.02 | 0.092 | 2.61 | 11,7 | 23.5 | 31.0 | 0.29 | 0.24 | 0.27 | 8.2 |
| 3856 | 77.54 | 0.00 | 9.4 | 1.87 | 1.90 | 0.98 | 0.99 | 0.98 | 0.078 | 2.16 | 10,7 | 23.2 | 31.1 | 0.29 | 0.23 | 0.27 | 8.3 |
| 3856 + 1/2 | 77.31 | 0.00 | 9.4 | 1.94 | 1.90 | 1.02 | 0.91 | 0.91 | 0.115 | 2.08 | 10,7 | 21.4 | 30.7 | 0.29 | 0.24 | 0.26 | 8.3 |
| 3857 | 77.10 | 0.01 | 8.9 | 1.87 | 1.93 | 0.97 | 0.98 | 0.97 | 0.089 | 2.17 | 10,7 | 20.9 | 30.4 | 0.29 | 0.24 | 0.27 | 8.3 |
| 3857 + 1/2 | 76.91 | 0.01 | 8.7 | 1.90 | 1.94 | 0.98 | 1.02 | 0.98 | 0.066 | 2.40 | 10,7 | 20.2 | 32.2 | 0.30 | 0.24 | 0.28 | 8.3 |
| 3858 | 76.74 | 0.00 | 8.7 | 1.90 | 1.94 | 0.98 | 0.98 | 0.98 | 0.072 | 2.37 | 10,7 | 19.5 | 30.9 | 0.30 | 0.22 | 0.27 | 8.2 |
| 3858 + 1/2 | 76.58 | 0.00 | 8.5 | 1.92 | 1.95 | 0.98 | 0.98 | 0.98 | 0.083 | 2.37 | 10,7 | 17.9 | 28.5 | 0.30 | 0.20 | 0.27 | 8.1 |
| 3859 | 76.42 | 0.00 | 8.2 | 1.96 | 1.95 | 1.00 | 1.03 | 1.00 | 0.072 | 2.53 | 10,7 | 17.4 | 27.4 | 0.30 | 0.18 | 0.28 | 8.0 |
| 3859 + 1/2 | 76.28 | 0.01 | 8.1 | 1.97 | 1.96 | 1.01 | 0.98 | 0.98 | 0.085 | 2.38 | 10,6 | 17.2 | 26.5 | 0.30 | 0.17 | 0.28 | 8.0 |
| 3860 | 76.15 | 0.01 | 7.9 | 2.03 | 1.96 | 1.04 | 1.04 | 1.04 | 0.078 | 2.58 | 10,6 | 17.6 | 25.4 | 0.31 | 0.16 | 0.29 | 8.0 |
| 3860 + 1/2 | 76.01 | 0.01 | 7.8 | 2.06 | 1.97 | 1.05 | 1.05 | 1.05 | 0.091 | 2.64 | 10,6 | 17.5 | 24.9 | 0.31 | 0.15 | 0.29 | 8.0 |
| 3861 | 75.89 | 0.01 | 7.5 | 2.07 | 1.97 | 1.05 | 1.04 | 1.04 | 0.091 | 2.65 | 10,6 | 16.6 | 24.6 | 0.30 | 0.14 | 0.29 | 8.0 |
| 3861 + 1/2 | 75.78 | 0.02 | 7.4 | 2.07 | 1.98 | 1.05 | 1.06 | 1.05 | 0.083 | 2.52 | 10,6 | 16.3 | 24.2 | 0.30 | 0.14 | 0.29 | 8.0 |
| 3862 | 75.71 | 0.01 | 7.4 | 2.08 | 1.99 | 1.05 | 1.02 | 1.02 | 0.094 | 2.23 | 10,6 | 16.0 | 24.0 | 0.30 | 0.13 | 0.28 | 8.0 |
| 3862 + 1/2 | 75.65 | 0.00 | 7.0 | 2.07 | 2.00 | 1.03 | 1.04 | 1.03 | 0.083 | 2.58 | 9,7 | 16.0 | 24.1 | 0.31 | 0.13 | 0.29 | 9.4 |
| 3863 | 75.60 | 0.02 | 6.9 | 2.11 | 2.01 | 1.05 | 1.05 | 1.05 | 0.074 | 2.13 | 9,7 | 15.7 | 26.2 | 0.32 | 0.12 | 0.29 | 9.5 |
| 3863 + 1/2 | 75.58 | 0.00 | 6.7 | 2.01 | 2.03 | 0.99 | 0.98 | 0.98 | 0.080 | 2.17 | 9,7 | 16.7 | 26.8 | 0.32 | 0.13 | 0.28 | 9.6 |
| 3864 | 75.56 | 0.02 | 6.3 | 2.08 | 2.03 | 1.03 | 1.02 | 1.02 | 0.072 | 2.58 | 9,7 | 17.3 | 28.6 | 0.32 | 0.11 | 0.29 | 9.7 |
| 3864 + 1/2 | 75.51 | 0.00 | 6.3 | 1.99 | 2.06 | 0.96 | 0.96 | 0.96 | 0.077 | 1.98 | 9,7 | 17.3 | 26.7 | 0.32 | 0.11 | 0.29 | 9.9 |
| 3865 | 75.47 | 0.01 | 5.9 | 1.99 | 2.07 | 0.96 | 0.95 | 0.95 | 0.071 | 2.02 | 9,7 | 17.6 | 28.2 | 0.33 | 0.11 | 0.30 | 8.0 |
| 3865 + 1/2 | 75.44 | 0.01 | 5.9 | 1.95 | 2.07 | 0.94 | 0.95 | 0.94 | 0.060 | 1.56 | 9,7 | 17.8 | 27.3 | 0.33 | 0.12 | 0.30 | 8.0 |
| 3866 | 75.42 | 0.00 | 5.6 | 2.02 | 2.07 | 0.97 | 0.94 | 0.94 | 0.074 | 1.59 | 9,7 | 18.1 | 29.4 | 0.32 | 0.11 | 0.30 | 8.0 |
| 3866 + 1/2 | 75.40 | 0.00 | 5.6 | 1.97 | 2.08 | 0.95 | 0.96 | 0.95 | 0.061 | 1.37 | 4,4 | 17.8 | 28.2 | 0.32 | 0.17 | 0.30 | 8.0 |
| 3867 | 75.37 | 0.00 | 5.4 | 1.97 | 2.08 | 0.95 | 0.97 | 0.95 | 0.055 | 1.35 | 4,4 | 18.1 | 28.6 | 0.31 | 0.17 | 0.29 | 8.0 |
| 3867 + 1/2 | 75.34 | 0.00 | 5.1 | 2.03 | 2.10 | 0.97 | 0.97 | 0.97 | 0.067 | 1.39 | 9,6 | 18.3 | 29.3 | 0.30 | 0.22 | 0.29 | 8.0 |
| 3868 | 75.29 | 0.01 | 5.1 | 2.06 | 2.12 | 0.97 | 0.99 | 0.97 | 0.059 | 1.46 | 14,6 | 18.3 | 30.4 | 0.30 | 0.25 | 0.28 | 8.0 |
| 3868 + 1/2 | 75.23 | 0.00 | 4.8 | 2.13 | 2.15 | 0.99 | 0.99 | 0.99 | 0.071 | 1.50 | 14,6 | 18.4 | 30.2 | 0.29 | 0.20 | 0.28 | 8.0 |
| 3869 | 75.16 | 0.01 | 4.6 | 2.18 | 2.16 | 1.01 | 1.02 | 1.01 | 0.067 | 1.67 | 14,6 | 19.0 | 30.0 | 0.29 | 0.20 | 0.28 | 8.0 |
| 3869 + 1/2 | 75.08 | 0.02 | 4.6 | 2.23 | 2.16 | 1.03 | 1.04 | 1.03 | 0.076 | 1.63 | 14,6 | 18.9 | 30.2 | 0.28 | 0.20 | 0.27 | 8.0 |
| 3870 | 75.03 | 0.03 | 4.4 | 2.27 | 2.16 | 1.05 | 1.09 | 1.05 | 0.060 | 1.75 | 14,6 | 19.0 | 30.7 | 0.28 | 0.20 | 0.27 | 8.0 |
| 3870 + 1/2 | 75.03 | 0.04 | 4.5 | 2.38 | 2.16 | 1.10 | 1.14 | 1.10 | 0.064 | 1.79 | 15,6 | 19.8 | 31.2 | 0.27 | 0.18 | 0.26 | 8.0 |
| 3871 | 75.12 | 0.02 | 4.2 | 2.42 | 2.16 | 1.12 | 1.15 | 1.12 | 0.072 | 1.82 | 14,6 | 20.0 | 31.1 | 0.27 | 0.19 | 0.25 | 8.0 |
| 3871 + 1/2 | 75.25 | 0.01 | 4.1 | 2.47 | 2.16 | 1.15 | 1.17 | 1.15 | 0.079 | 1.70 | 15,6 | 20.0 | 30.7 | 0.26 | 0.15 | 0.24 | 8.0 |
| 3872 | 75.41 | 0.01 | 4.1 | 2.53 | 2.16 | 1.17 | 1.21 | 1.17 | 0.079 | 1.79 | 14,6 | 20.7 | 30.3 | 0.26 | 0.15 | 0.24 | 8.0 |
| 3872 + 1/2 | 75.58 | 0.01 | 3.7 | 2.58 | 2.16 | 1.20 | 1.23 | 1.196 | 0.078 | 1.70 | 12,8 | 21.0 | 30.2 | 0.25 | 0.15 | 0.24 | 8.0 |
| 3873 | 75.77 | 0.00 | 3.7 | 2.57 | 2.16 | 1.19 | 1.24 | 1.19 | 0.072 | 1.87 | 12,8 | 21.3 | 30.5 | 0.24 | 0.15 | 0.23 | 8.0 |
| 3873 + 1/2 | 75.95 | 0.01 | 3.8 | 2.57 | 2.16 | 1.19 | 1.20 | 1.19 | 0.091 | 1.92 | 12,8 | 20.9 | 30.0 | 0.24 | 0.15 | 0.23 | 8.0 |
| 3874 | 76.12 | 0.02 | 3.5 | 2.50 | 2.16 | 1.16 | 1.18 | 1.16 | 0.089 | 2.12 | 12,8 | 20.4 | 29.4 | 0.25 | 0.14 | 0.23 | 8.0 |
| 3874 + 1/2 | 76.26 | 0.03 | 3.6 | 2.43 | 2.16 | 1.13 | 1.16 | 1.13 | 0.086 | 2.30 | 12,8 | 20.0 | 29.0 | 0.24 | 0.14 | 0.23 | 8.1 |
| 3875 | 76.34 | 0.04 | 3.3 | 2.40 | 2.16 | 1.11 | 1.12 | 1.11 | 0.098 | 2.17 | 12,8 | 19.8 | 28.5 | 0.24 | 0.13 | 0.23 | 8.2 |
| 3875 + 1/2 | 76.35 | 0.05 | 3.4 | 2.36 | 2.16 | 1.09 | 1.10 | 1.09 | 0.084 | 2.09 | 12,8 | 19.2 | 27.6 | 0.24 | 0.13 | 0.23 | 8.2 |
| 3876 | 76.26 | 0.02 | 3.6 | 2.30 | 2.16 | 1.07 | 1.07 | 1.07 | 0.091 | 1.99 | 12,8 | 18.8 | 27.3 | 0.24 | 0.12 | 0.22 | 8.3 |
| 3876 + 1/2 | 76.12 | 0.04 | 3.3 | 2.25 | 2.16 | 1.04 | 1.04 | 1.04 | 0.090 | 1.95 | 12,8 | 18.5 | 26.7 | 0.23 | 0.13 | 0.22 | 8.3 |
| 3877 | 75.91 | 0.04 | 3.2 | 2.20 | 2.14 | 1.03 | 1.03 | 1.03 | 0.085 | 1.82 | 12,1 | 18.3 | 26.3 | 0.23 | 0.12 | 0.22 | 8.4 |
| 3877 + 1/2 | 75.62 | 0.01 | 3.2 | 2.10 | 2.12 | 0.99 | 0.98 | 0.98 | 0.093 | 1.72 | 13,0 | 17.7 | 25.4 | 0.23 | 0.11 | 0.22 | 8.4 |
| 3878 | 75.32 | 0.00 | 3.0 | 2.04 | 2.05 | 1.00 | 1.01 | 1.00 | 0.097 | 1.74 | 12,0 | 17.1 | 23.9 | 0.22 | 0.11 | 0.21 | 8.4 |
| 3878 + 1/2 | 75.02 | 0.00 | 3.0 | 2.00 | 1.99 | 1.00 | 0.98 | 0.98 | 0.100 | 1.83 | 11,8 | 16.6 | 23.0 | 0.22 | 0.11 | 0.21 | 8.4 |
| 3879 | 74.72 | 0.01 | 2.7 | 1.94 | 1.93 | 1.00 | 1.01 | 1.00 | 0.106 | 1.91 | 11,8 | 16.8 | 22.0 | 0.22 | 0.10 | 0.21 | 8.4 |
| 3879 + 1/2 | 74.46 | 0.02 | 3.0 | 1.87 | 1.85 | 1.01 | 0.99 | 0.99 | 0.100 | 1.96 | 11,8 | 16.5 | 22.6 | 0.22 | 0.13 | 0.21 | 8.9 |
| 3880 | 74.24 | 0.01 | 2.8 | 1.77 | 1.79 | 0.99 | 1.04 | 0.99 | 0.097 | 1.97 | 11,8 | 16.1 | 22.5 | 0.22 | 0.13 | 0.20 | 8.8 |
| 3880 + 1/2 | 74.04 | 0.01 | 2.4 | 1.71 | 1.69 | 1.02 | 0.95 | 0.95 | 0.110 | 2.01 | 11,8 | 15.7 | 22.4 | 0.22 | 0.13 | 0.21 | 8.8 |
| 3881 | 73.86 | 0.00 | 2.6 | 1.61 | 1.64 | 0.98 | 1.00 | 0.98 | 0.093 | 1.90 | 11,8 | 16.1 | 22.9 | 0.22 | 0.12 | 0.21 | 8.7 |
| 3881 + 1/2 | 73.68 | 0.00 | 2.5 | 1.57 | 1.55 | 1.01 | 1.04 | 1.01 | 0.096 | 1.73 | 11,8 | 15.5 | 22.1 | 0.22 | 0.12 | 0.21 | 8.6 |
| 3882 | 73.50 | 0.00 | 2.3 | 1.50 | 1.53 | 0.98 | 0.94 | 0.94 | 0.102 | 1.63 | 11,8 | 14.9 | 21.5 | 0.22 | 0.11 | 0.21 | 8.6 |
| 3882 + 1/2 | 73.32 | 0.01 | 2.4 | 1.49 | 1.44 | 1.03 | 1.02 | 1.02 | 0.095 | 1.60 | 11,8 | 13.8 | 20.9 | 0.22 | 0.10 | 0.21 | 8.6 |
| 3883 | 73.11 | 0.01 | 2.2 | 1.39 | 1.43 | 0.97 | 0.97 | 0.97 | 0.092 | 1.37 | 11,8 | 12.8 | 20.3 | 0.23 | 0.08 | 0.22 | 8.9 |
| 3883 + 1/2 | 72.90 | 0.01 | 2.2 | 1.38 | 1.38 | 1.00 | 0.99 | 0.99 | 0.090 | 1.48 | 3,4 | 11.8 | 19.2 | 0.23 | 0.08 | 0.22 | 8.9 |
| 3884 last | 72.66 | 0.01 | 1.9 | 1.37 | 1.37 | 1.00 | 0.98 | 0.98 | 0.083 | 1.35 | 7,7 | 10.9 | 18.0 | 0.24 | 0.07 | 0.22 | 8.4 |
| 3884 + 1/2 | 72.41 | 0.02 | 2.0 | 1.35 | 1.36 | 0.99 | 1.02 | 0.99 | 0.077 | 1.33 | 10,8 | 9.8 | 16.8 | 0.22 | 0.05 | 0.21 | 8.0 |
| 3885 | 72.12 | 0.00 | 2.0 | 1.35 | 1.36 | 0.99 | 1.01 | 0.99 | 0.080 | 1.39 | 10,8 | 9.5 | 18.1 | 0.21 | 0.06 | 0.20 | 8.0 |
| 3885 + 1/2 | 71.83 | 0.00 | 1.8 | 1.33 | 1.36 | 0.97 | 0.96 | 0.96 | 0.088 | 1.38 | 10,8 | 10.4 | 17.8 | 0.16 | 0.08 | 0.15 | 8.0 |
| 3886 | 71.54 | 0.00 | 1.8 | 1.34 | 1.36 | 0.98 | 1.01 | 0.98 | 0.078 | 1.53 | 4,7 | 10.2 | 18.7 | 0.15 | 0.07 | 0.14 | 8.0 |
| 3886 + 1/2 | 71.25 | 0.00 | 1.7 | 1.30 | 1.36 | 0.96 | 1.01 | 0.96 | 0.074 | 1.39 | 4,7 | 10.6 | 19.0 | 0.15 | 0.08 | 0.13 | 8.0 |
| 3887 | 70.96 | 0.01 | 1.5 | 1.30 | 1.35 | 0.96 | 0.99 | 0.96 | 0.075 | 1.49 | 4,7 | 11.3 | 21.0 | 0.14 | 0.09 | 0.13 | 8.0 |
| 3887 + 1/2 | 70.69 | 0.00 | 1.4 | 1.29 | 1.35 | 0.95 | 1.00 | 0.95 | 0.068 | 1.28 | 6,6 | 11.1 | 21.1 | 0.14 | 0.08 | 0.13 | 8.5 |
| 3888 | 70.41 | 0.01 | 1.4 | 1.29 | 1.35 | 0.96 | 1.03 | 0.96 | 0.052 | 1.38 | 7,7 | 11.3 | 22.1 | 0.14 | 0.09 | 0.13 | 8.8 |
| 3888 + 1/2 | 70.16 | 0.01 | 1.2 | 1.25 | 1.35 | 0.93 | 0.99 | 0.93 | 0.052 | 1.44 | 4,8 | 12.8 | 23.4 | 0.13 | 0.09 | 0.12 | 8.8 |
| 3889 | 69.92 | 0.01 | 1.1 | 1.20 | 1.35 | 0.89 | 0.98 | 0.89 | 0.043 | 1.23 | 2,7 |  |  |  |  |  |  |
| 3889 + 1/2 | 69.69 | 0.01 | 1.0 | 1.16 | 1.35 | 0.86 | 0.97 | 0.86 | 0.034 | 1.16 | 2,7 |  |  |  |  |  |  |
| 3890 | 69.49 | 0.01 | 0.8 | 1.05 | 1.35 | 0.78 | 0.94 | 0.78 | 0.013 | 1.34 | 5,4 |  |  |  |  |  |  |
| 3890 + 1/2 | 69.32 | 0.02 | 0.7 | 0.94 | 1.35 | 0.69 | 0.86 | 0.69 | 0.002 | 1.42 | 5,4 |  |  |  |  |  |  |
| 3891 | 69.18 | 0.01 | 0.9 | 0.99 | 1.35 | 0.74 | 0.90 | 0.74 | 0.011 | 1.56 | 5,5 |  |  |  |  |  |  |
| 3891 + 1/2 | 69.07 | 0.02 | 1.3 | 1.12 | 1.34 | 0.84 | 0.96 | 0.84 | 0.030 | 1.76 | 5,5 |  |  |  |  |  |  |
| 3892 | 68.99 | 0.01 | 1.8 | 1.25 | 1.33 | 0.94 | 1.02 | 0.94 | 0.062 | 1.83 | 10,7 |  |  |  |  |  |  |
| 3892 + 1/2 | 68.95 | 0.02 | 2.5 | 1.34 | 1.31 | 1.03 | 0.99 | 0.99 | 0.107 | 2.17 | 10,7 |  |  |  |  |  |  |
| 3893 | 68.95 | 0.01 | 3.2 | 1.38 | 1.30 | 1.06 | 0.85 | 0.85 | 0.166 | 2.77 | 10,7 |  |  |  |  |  |  |
| 3893 + 1/2 | 68.97 | 0.01 | 4.6 | 1.43 | 1.30 | 1.10 | 0.85 | 0.85 | 0.178 | 4.24 | 10,7 |  |  |  |  |  |  |
| 3894 | 69.02 | 0.00 | 5.2 | 1.40 | 1.30 | 1.08 | 0.86 | 0.86 | 0.156 | 5.42 | 10,7 |  |  |  |  |  |  |
| 3894 + 1/2 | 69.07 | 0.01 | 4.9 | 1.40 | 1.29 | 1.08 | 1.04 | 1.04 | 0.096 | 5.83 | 10,7 |  |  |  |  |  |  |
| 3895 | 69.09 | 0.01 | 5.6 | 1.35 | 1.28 | 1.06 | 1.09 | 1.06 | 0.078 | 6.82 | 10,7 |  |  |  |  |  |  |
| 3895 + 1/2 | 69.09 | 0.02 | 7.2 | 1.42 | 1.26 | 1.13 | 1.15 | 1.13 | 0.109 | 6.90 | 10,7 |  |  |  |  |  |  |
| 3896 | 69.13 | 0.01 | 7.5 | 1.49 | 1.25 | 1.19 | 1.11 | 1.11 | 0.094 | 8.66 | 10,7 |  |  |  |  |  |  |
| 3896 + 1/2 | 69.15 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

## place

### dive (saturn.dive, T at 3589, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

### rise (saturn.rise, T at 3852, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 2x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 7.66, uhd 18.12.

Largest mean difference: 1.992 at frame 3720 (saturn.terrain), limit 12.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 0.543 at frame 3720 (saturn.terrain), limit 3.2.
Largest level difference of one block (a grid of 16 by 9): -3.770 at frame 3720 (saturn.terrain), limit 12.
Largest level difference of the whole frame: -0.427 at frame 3720 (saturn.terrain), limit 2.2.
Picture: out/work/smooth/saturn-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 3465 | saturn.hold | 1.423 | 7.5 | 90 | -0.116 | -0.193 | 0.245 | 6.16 | -0.892 | 3,3 | 1.106 |
| 3563 | saturn.dive | 1.501 | 8.1 | 119 | -0.086 | -0.174 | 0.250 | 6.56 | -0.829 | 4,3 | 1.113 |
| 3585 | saturn.dive | 1.415 | 7.0 | 47 | -0.018 | -0.087 | 0.188 | 2.44 | -0.436 | 5,4 | 1.203 |
| 3608 | saturn.dive | 1.464 | 8.4 | 146 | -0.015 | -0.016 | 0.172 | 4.08 | -0.375 | 7,4 | 1.394 |
| 3720 | saturn.terrain | 1.992 | 13.5 | 94 | -0.427 | -0.436 | 0.543 | 9.28 | -3.770 | 1,8 | 1.438 |
| 3829 | saturn.rise | 1.443 | 7.8 | 110 | -0.034 | -0.037 | 0.173 | 2.38 | -0.346 | 8,5 | 1.370 |
| 3848 | saturn.rise | 1.385 | 7.1 | 104 | -0.032 | -0.035 | 0.179 | 3.94 | -0.345 | 7,6 | 1.384 |
| 3866 | saturn.rise | 1.497 | 8.7 | 59 | -0.006 | -0.015 | 0.195 | 9.89 | 0.527 | 2,1 | 1.369 |
| 3923 | saturn.travel | 1.558 | 10.5 | 72 | 0.016 | 0.020 | 0.220 | 7.30 | 0.416 | 10,8 | 1.379 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.

## counts

Film frames 3390 to 3959 in order on one fresh page, 1140 pictures at rate 2, tier draft at preview, 2970 s. Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): 7 warm draws. Its work counts for that picture and stands in brackets. Judged: dive, rise and travel, every picture.

| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |
|---|---|---|---|---|---|---|---|
| saturn.hold | no | 300 | 1 | 3390 | 27 | 136 | 130 |
| saturn.dive | yes | 180 | 0 |  | 0 | 0 | 0 |
| saturn.terrain | no | 360 | 0 |  | 0 | 0 | 0 |
| saturn.rise | yes | 150 | 0 |  | 0 | 0 | 0 |
| saturn.travel | yes | 150 | 0 |  | 0 | 0 | 0 |

Every picture with work (of the warm start call in brackets):

| frame | segment | programs | texture uploads | buffers | warm draws |
|---|---|---|---|---|---|
| 3390 | saturn.hold | 27 (27) | 136 (136) | 130 (130) | 7 |
