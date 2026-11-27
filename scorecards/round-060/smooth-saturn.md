# smooth: saturn

Commit 262b9a68df0a6bda8d77518539580de554bb0dc5. Capture rate 2. Parts: path, pictures, place, parity, counts.

Joined from the files of 1 machine(s), nothing is rendered, measured or counted here. The path: /home/user/workspace/work/p6/ht9/05/saturn (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The pictures: the dive /home/user/workspace/work/p6/ht9/01/saturn-dive-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/ht9/02/saturn-dive-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz); the rise /home/user/workspace/work/p6/ht9/03/saturn-rise-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/ht9/04/saturn-rise-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The place: /home/user/workspace/work/p6/ht9/05/saturn (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The parity: /home/user/workspace/work/p6/ht9/05/saturn (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The counts: /home/user/workspace/work/p6/ht9/06/saturn (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

VERDICT: green. No number is over its limit.

VERDICT BESIDE IT, the pictures read with the carry at the full size (the verdict above is the one that counts and makes the exit code): red. 1 number over the limit or not measured.

GROUND POP BESIDE IT, a number without a limit that makes no verdict (1.3 is named as the limit to come), read with the carry at the full size on the ground both frames show: largest 1.159 from frame 3838 + 1/2 to the next, most at pixel 1238, 786, a patch of 164 by 220 px; 0 of 424 rows read over 1.3 (pictures of the rise). It is not the line "The ground beside it" of the pictures: that line gives the change in place and the pattern on the surface view before a rise or after a dive, this number is read on the globe's ground through the move itself. Ground pop NOT READ on 2 of 426 rows, which says nothing of them, quiet or not: frame 3641 + 1/2: the last frame of the window, no next frame to carry onto it; frame 3896 + 1/2: the last frame of the window, no next frame to carry onto it.

## path

### dive (saturn.dive, frames 3540 to 3629, T at 3589, window 3528 to 3641)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.006195 log of the height a film frame | 1.215 | 3611 | 0.065 | 3544 |  |  | 0.009 | 0.007 | 0.000 | 0.000 | 0.001 at 3641 |
| whole frames | turn | 0.2181 degrees a film frame | 1.974 | 3586 | 0.062 | 3573 |  |  | 0.000 | 0.001 | 0.000 | 0.000 | 0.000 at 3534 |
| whole frames | speed | 2.434 px a film frame at the place | 1.814 | 3610 | 0.068 over 8 | 3623 |  |  | 0.004 | 0.021 | 0.014 over 8 | 0.000 | 0.009 at 3641 |
| rate 2 | rate | 0.006176 log of the height a film frame | 1.219 | 3592 + 1/2 | 0.066 | 3543 + 1/2 | 0.033 | 3543 | 0.011 | 0.006 | 0.000 | 0.000 | 0.001 at 3641 + 1/2 |
| rate 2 | turn | 0.2169 degrees a film frame | 1.984 | 3586 | 0.062 | 3573 | 0.031 | 3573 | 0.000 | 0.001 | 0.000 | 0.000 | 0.000 at 3534 |
| rate 2 | speed | 2.431 px a film frame at the place | 1.816 | 3610 | 0.069 over 8 | 3623 + 1/2 | 0.035 over 8 | 3623 | 0.005 | 0.027 | 0.015 over 8 | 0.002 over 8 | 0.009 at 3641 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the plane of the rings between their two radii, where the globe does not hide it. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 3630, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.0208 of its height a film frame, the mean of its first 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 1.00 at frame 3637 + 1/2, limit 0.87; inside the dive itself 1.00 at frame 3630. Largest step from one capture frame to the next 0.03 at frame 3624 + 1/2, shown. The part along the surface view's own direction of motion: 1.00 at the lowest, lowest 1.00 at frame 3637 + 1/2, shown; under 0 the eye goes back.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3528 | hold orbit | 4.056e+0 | 0.041 |  |  | 0.212 |  |  | 0.266 |  |  | 0 |
| 3529 | hold orbit | 4.055e+0 | 0.041 | 0.000 | 0.000 | 0.213 | 0.000 | 0.000 | 0.265 | 0.002 | 0.002 | 8 |
| 3530 | hold orbit | 4.053e+0 | 0.041 | 0.000 | 0.000 | 0.213 | 0.000 | 0.000 | 0.263 | 0.002 | 0.002 | 8 |
| 3531 | hold orbit | 4.053e+0 | 0.041 | 0.000 | 0.000 | 0.214 | 0.000 | 0.000 | 0.261 | 0.002 | 0.002 | 8 |
| 3532 | hold orbit | 4.051e+0 | 0.041 | 0.000 | 0.000 | 0.214 | 0.000 | 0.000 | 0.259 | 0.002 | 0.002 | 8 |
| 3533 | hold orbit | 4.051e+0 | 0.041 | 0.000 | 0.000 | 0.215 | 0.000 | 0.000 | 0.257 | 0.002 | 0.002 | 8 |
| 3534 | hold orbit | 4.049e+0 | 0.041 | 0.000 | 0.000 | 0.215 | 0.000 | 0.000 | 0.255 | 0.002 | 0.002 | 8 |
| 3535 | hold orbit | 4.048e+0 | 0.041 | 0.000 | 0.000 | 0.216 | 0.000 | 0.000 | 0.254 | 0.002 | 0.002 | 8 |
| 3536 | hold orbit | 4.047e+0 | 0.041 | 0.000 | 0.000 | 0.216 | 0.000 | 0.000 | 0.252 | 0.002 | 0.002 | 8 |
| 3537 | hold orbit | 4.046e+0 | 0.041 | 0.000 | 0.000 | 0.217 | 0.000 | 0.000 | 0.250 | 0.002 | 0.002 | 8 |
| 3538 | hold orbit | 4.045e+0 | 0.041 | 0.000 | 0.000 | 0.217 | 0.000 | 0.000 | 0.248 | 0.002 | 0.002 | 8 |
| 3539 | hold orbit | 4.044e+0 | 0.041 | 0.000 | 0.000 | 0.218 | 0.000 | 0.000 | 0.246 | 0.002 | 0.002 | 8 |
| 3540 first | dive orbit | 4.043e+0 | 0.041 | 0.000 | 0.002 | 0.218 | 0.000 | 0.000 | 0.245 | 0.002 | 0.002 | 8 |
| 3541 | dive orbit | 4.042e+0 | 0.050 | 0.009 | 0.025 | 0.218 | 0.000 | 0.000 | 0.249 | 0.004 | 0.015 | 8 |
| 3542 | dive orbit | 4.040e+0 | 0.086 | 0.036 | 0.053 | 0.218 | 0.000 | 0.000 | 0.268 | 0.019 | 0.021 | 8 |
| 3543 | dive orbit | 4.036e+0 | 0.146 | 0.060 | 0.066 | 0.218 | 0.000 | 0.000 | 0.280 | 0.012 | 0.013 | 8 |
| 3544 | dive orbit | 4.031e+0 | 0.211 | 0.065 | 0.065 | 0.219 | 0.000 | 0.001 | 0.299 | 0.018 | 0.021 | 8 |
| 3545 | dive orbit | 4.024e+0 | 0.274 | 0.063 | 0.063 | 0.220 | 0.001 | 0.003 | 0.317 | 0.018 | 0.017 | 8 |
| 3546 | dive orbit | 4.016e+0 | 0.335 | 0.061 | 0.061 | 0.224 | 0.004 | 0.006 | 0.330 | 0.013 | 0.013 | 8 |
| 3547 | dive orbit | 4.006e+0 | 0.393 | 0.059 | 0.059 | 0.231 | 0.007 | 0.010 | 0.339 | 0.009 | 0.008 | 8 |
| 3548 | dive orbit | 3.995e+0 | 0.450 | 0.057 | 0.057 | 0.242 | 0.011 | 0.015 | 0.343 | 0.005 | 0.004 | 8 |
| 3549 | dive orbit | 3.982e+0 | 0.505 | 0.055 | 0.055 | 0.259 | 0.017 | 0.021 | 0.345 | 0.002 | 0.001 | 8 |
| 3550 | dive orbit | 3.969e+0 | 0.558 | 0.053 | 0.053 | 0.282 | 0.023 | 0.027 | 0.346 | 0.000 | 0.001 | 8 |
| 3551 | dive orbit | 3.954e+0 | 0.608 | 0.051 | 0.051 | 0.311 | 0.029 | 0.033 | 0.347 | 0.001 | 0.004 | 8 |
| 3552 | dive orbit | 3.938e+0 | 0.657 | 0.049 | 0.049 | 0.346 | 0.035 | 0.040 | 0.352 | 0.005 | 0.010 | 8 |
| 3553 | dive orbit | 3.921e+0 | 0.704 | 0.047 | 0.046 | 0.388 | 0.042 | 0.046 | 0.365 | 0.013 | 0.019 | 8 |
| 3554 | dive orbit | 3.902e+0 | 0.748 | 0.045 | 0.044 | 0.436 | 0.048 | 0.051 | 0.388 | 0.023 | 0.030 | 8 |
| 3555 | dive orbit | 3.883e+0 | 0.791 | 0.043 | 0.042 | 0.489 | 0.053 | 0.055 | 0.421 | 0.033 | 0.036 | 8 |
| 3556 | dive orbit | 3.863e+0 | 0.831 | 0.041 | 0.040 | 0.544 | 0.055 | 0.056 | 0.458 | 0.037 | 0.037 | 8 |
| 3557 | dive orbit | 3.843e+0 | 0.870 | 0.038 | 0.038 | 0.600 | 0.056 | 0.057 | 0.495 | 0.037 | 0.037 | 8 |
| 3558 | dive orbit | 3.821e+0 | 0.906 | 0.036 | 0.036 | 0.657 | 0.057 | 0.058 | 0.532 | 0.037 | 0.037 | 8 |
| 3559 | dive orbit | 3.799e+0 | 0.941 | 0.034 | 0.034 | 0.715 | 0.058 | 0.059 | 0.568 | 0.036 | 0.036 | 8 |
| 3560 | dive orbit | 3.776e+0 | 0.973 | 0.032 | 0.032 | 0.774 | 0.058 | 0.059 | 0.603 | 0.035 | 0.035 | 8 |
| 3561 | dive orbit | 3.753e+0 | 1.003 | 0.030 | 0.030 | 0.833 | 0.059 | 0.060 | 0.637 | 0.034 | 0.034 | 8 |
| 3562 | dive orbit | 3.729e+0 | 1.032 | 0.028 | 0.028 | 0.892 | 0.059 | 0.060 | 0.671 | 0.034 | 0.034 | 8 |
| 3563 | dive orbit | 3.704e+0 | 1.058 | 0.026 | 0.026 | 0.952 | 0.060 | 0.060 | 0.703 | 0.032 | 0.032 | 8 |
| 3564 | dive orbit | 3.680e+0 | 1.082 | 0.024 | 0.024 | 1.012 | 0.060 | 0.060 | 0.734 | 0.031 | 0.030 | 8 |
| 3565 | dive orbit | 3.655e+0 | 1.104 | 0.022 | 0.022 | 1.072 | 0.060 | 0.061 | 0.762 | 0.029 | 0.028 | 8 |
| 3566 | dive orbit | 3.629e+0 | 1.125 | 0.020 | 0.020 | 1.132 | 0.060 | 0.061 | 0.789 | 0.026 | 0.026 | 8 |
| 3567 | dive orbit | 3.604e+0 | 1.143 | 0.018 | 0.018 | 1.193 | 0.061 | 0.061 | 0.813 | 0.024 | 0.024 | 8 |
| 3568 | dive orbit | 3.578e+0 | 1.159 | 0.016 | 0.016 | 1.254 | 0.061 | 0.061 | 0.836 | 0.022 | 0.022 | 8 |
| 3569 | dive orbit | 3.552e+0 | 1.173 | 0.014 | 0.014 | 1.315 | 0.061 | 0.062 | 0.856 | 0.020 | 0.020 | 8 |
| 3570 | dive orbit | 3.526e+0 | 1.185 | 0.012 | 0.012 | 1.376 | 0.061 | 0.062 | 0.874 | 0.018 | 0.018 | 8 |
| 3571 | dive orbit | 3.500e+0 | 1.195 | 0.010 | 0.010 | 1.438 | 0.061 | 0.062 | 0.890 | 0.016 | 0.016 | 8 |
| 3572 | dive orbit | 3.474e+0 | 1.203 | 0.008 | 0.008 | 1.499 | 0.062 | 0.062 | 0.905 | 0.015 | 0.015 | 8 |
| 3573 | dive orbit | 3.448e+0 | 1.209 | 0.006 | 0.006 | 1.561 | 0.062 | 0.062 | 0.919 | 0.015 | 0.015 | 8 |
| 3574 | dive orbit | 3.422e+0 | 1.213 | 0.004 | 0.004 | 1.621 | 0.060 | 0.060 | 0.930 | 0.011 | 0.010 | 8 |
| 3575 | dive orbit | 3.397e+0 | 1.215 | 0.002 | 0.002 | 1.676 | 0.055 | 0.055 | 0.934 | 0.003 | 0.003 | 8 |
| 3576 | dive orbit | 3.371e+0 | 1.215 | 0.000 | 0.000 | 1.727 | 0.051 | 0.050 | 0.932 | 0.002 | 0.003 | 8 |
| 3577 | dive orbit | 3.346e+0 | 1.215 | 0.000 | 0.000 | 1.773 | 0.046 | 0.046 | 0.929 | 0.003 | 0.004 | 8 |
| 3578 | dive orbit | 3.321e+0 | 1.215 | 0.000 | 0.000 | 1.814 | 0.041 | 0.041 | 0.925 | 0.004 | 0.004 | 8 |
| 3579 | dive orbit | 3.296e+0 | 1.215 | 0.000 | 0.000 | 1.851 | 0.037 | 0.036 | 0.921 | 0.003 | 0.003 | 8 |
| 3580 | dive orbit | 3.271e+0 | 1.215 | 0.000 | 0.000 | 1.883 | 0.032 | 0.031 | 0.920 | 0.002 | 0.002 | 8 |
| 3581 | dive orbit | 3.247e+0 | 1.215 | 0.000 | 0.000 | 1.910 | 0.027 | 0.027 | 0.920 | 0.000 | 0.002 | 8 |
| 3582 | dive orbit | 3.222e+0 | 1.215 | 0.000 | 0.000 | 1.932 | 0.022 | 0.022 | 0.922 | 0.002 | 0.004 | 8 |
| 3583 | dive orbit | 3.198e+0 | 1.215 | 0.000 | 0.000 | 1.950 | 0.018 | 0.017 | 0.926 | 0.004 | 0.004 | 8 |
| 3584 | dive orbit | 3.174e+0 | 1.215 | 0.000 | 0.000 | 1.962 | 0.013 | 0.012 | 0.929 | 0.003 | 0.003 | 8 |
| 3585 | dive orbit | 3.150e+0 | 1.215 | 0.000 | 0.000 | 1.970 | 0.008 | 0.007 | 0.930 | 0.001 | 0.001 | 8 |
| 3586 | dive orbit | 3.127e+0 | 1.215 | 0.000 | 0.000 | 1.974 | 0.003 | 0.003 | 0.929 | 0.001 | 0.003 | 8 |
| 3587 | dive orbit | 3.103e+0 | 1.215 | 0.000 | 0.000 | 1.971 | 0.002 | 0.007 | 0.925 | 0.004 | 0.004 | 8 |
| 3588 | dive orbit | 3.080e+0 | 1.215 | 0.000 | 0.000 | 1.961 | 0.010 | 0.016 | 0.922 | 0.004 | 0.004 | 8 |
| 3589 T | dive terrain | 3.057e+0 | 1.215 | 0.000 | 0.000 | 1.942 | 0.019 | 0.024 | 0.921 | 0.001 | 0.002 | 8 |
| 3590 | dive terrain | 3.034e+0 | 1.215 | 0.000 | 0.000 | 1.916 | 0.027 | 0.032 | 0.925 | 0.005 | 0.010 | 8 |
| 3591 | dive terrain | 3.011e+0 | 1.215 | 0.000 | 0.000 | 1.881 | 0.035 | 0.040 | 0.939 | 0.014 | 0.021 | 8 |
| 3592 | dive terrain | 2.989e+0 | 1.215 | 0.000 | 0.000 | 1.837 | 0.043 | 0.049 | 0.966 | 0.027 | 0.036 | 8 |
| 3593 | dive terrain | 2.966e+0 | 1.215 | 0.000 | 0.000 | 1.786 | 0.051 | 0.054 | 1.008 | 0.042 | 0.049 | 8 |
| 3594 | dive terrain | 2.944e+0 | 1.215 | 0.000 | 0.000 | 1.732 | 0.054 | 0.054 | 1.058 | 0.050 | 0.051 | 8 |
| 3595 | dive terrain | 2.922e+0 | 1.215 | 0.000 | 0.000 | 1.678 | 0.054 | 0.054 | 1.109 | 0.052 | 0.053 | 8 |
| 3596 | dive terrain | 2.900e+0 | 1.215 | 0.000 | 0.000 | 1.624 | 0.054 | 0.054 | 1.162 | 0.053 | 0.054 | 8 |
| 3597 | dive terrain | 2.878e+0 | 1.215 | 0.000 | 0.000 | 1.570 | 0.054 | 0.055 | 1.216 | 0.054 | 0.054 | 8 |
| 3598 | dive terrain | 2.857e+0 | 1.215 | 0.000 | 0.000 | 1.516 | 0.054 | 0.055 | 1.271 | 0.055 | 0.055 | 8 |
| 3599 | dive terrain | 2.835e+0 | 1.215 | 0.000 | 0.000 | 1.461 | 0.054 | 0.055 | 1.326 | 0.055 | 0.055 | 8 |
| 3600 | dive terrain | 2.814e+0 | 1.215 | 0.000 | 0.000 | 1.407 | 0.054 | 0.055 | 1.381 | 0.055 | 0.055 | 8 |
| 3601 | dive terrain | 2.793e+0 | 1.215 | 0.000 | 0.000 | 1.352 | 0.054 | 0.055 | 1.436 | 0.055 | 0.055 | 8 |
| 3602 | dive terrain | 2.772e+0 | 1.215 | 0.000 | 0.000 | 1.298 | 0.054 | 0.055 | 1.491 | 0.055 | 0.055 | 8 |
| 3603 | dive terrain | 2.751e+0 | 1.215 | 0.000 | 0.000 | 1.243 | 0.055 | 0.055 | 1.545 | 0.055 | 0.055 | 8 |
| 3604 | dive terrain | 2.730e+0 | 1.215 | 0.000 | 0.000 | 1.189 | 0.055 | 0.055 | 1.599 | 0.054 | 0.054 | 8 |
| 3605 | dive terrain | 2.710e+0 | 1.215 | 0.000 | 0.000 | 1.134 | 0.055 | 0.055 | 1.650 | 0.051 | 0.050 | 8 |
| 3606 | dive terrain | 2.690e+0 | 1.215 | 0.000 | 0.000 | 1.080 | 0.055 | 0.055 | 1.699 | 0.049 | 0.050 | 8 |
| 3607 | dive terrain | 2.669e+0 | 1.215 | 0.000 | 0.000 | 1.025 | 0.055 | 0.055 | 1.747 | 0.048 | 0.048 | 8 |
| 3608 | dive terrain | 2.649e+0 | 1.215 | 0.000 | 0.000 | 0.970 | 0.055 | 0.055 | 1.783 | 0.036 | 0.034 | 8 |
| 3609 | dive terrain | 2.630e+0 | 1.215 | 0.000 | 0.000 | 0.915 | 0.055 | 0.055 | 1.805 | 0.022 | 0.020 | 8 |
| 3610 | dive terrain | 2.610e+0 | 1.215 | 0.000 | 0.000 | 0.860 | 0.055 | 0.055 | 1.814 | 0.008 | 0.007 | 8 |
| 3611 | dive terrain | 2.590e+0 | 1.215 | 0.000 | 0.000 | 0.805 | 0.055 | 0.055 | 1.810 | 0.004 | 0.011 | 8 |
| 3612 | dive terrain | 2.571e+0 | 1.215 | 0.000 | 0.000 | 0.750 | 0.055 | 0.055 | 1.795 | 0.015 | 0.021 | 8 |
| 3613 | dive terrain | 2.551e+0 | 1.215 | 0.000 | 0.002 | 0.695 | 0.055 | 0.056 | 1.770 | 0.025 | 0.029 | 8 |
| 3614 | dive terrain | 2.532e+0 | 1.210 | 0.005 | 0.011 | 0.640 | 0.055 | 0.056 | 1.740 | 0.030 | 0.032 | 8 |
| 3615 | dive terrain | 2.514e+0 | 1.195 | 0.014 | 0.020 | 0.584 | 0.055 | 0.056 | 1.707 | 0.033 | 0.034 | 8 |
| 3616 | dive terrain | 2.496e+0 | 1.172 | 0.024 | 0.030 | 0.529 | 0.055 | 0.056 | 1.672 | 0.035 | 0.036 | 8 |
| 3617 | dive terrain | 2.478e+0 | 1.138 | 0.033 | 0.039 | 0.473 | 0.055 | 0.056 | 1.635 | 0.037 | 0.038 | 8 |
| 3618 | dive terrain | 2.461e+0 | 1.096 | 0.043 | 0.048 | 0.418 | 0.056 | 0.056 | 1.590 | 0.045 | 0.057 | 8 |
| 3619 | dive terrain | 2.445e+0 | 1.046 | 0.050 | 0.051 | 0.362 | 0.056 | 0.056 | 1.533 | 0.058 | 0.059 | 8 |
| 3620 | dive terrain | 2.430e+0 | 0.995 | 0.051 | 0.051 | 0.306 | 0.056 | 0.056 | 1.474 | 0.059 | 0.059 | 8 |
| 3621 | dive terrain | 2.416e+0 | 0.944 | 0.051 | 0.051 | 0.251 | 0.055 | 0.056 | 1.415 | 0.059 | 0.061 | 8 |
| 3622 | dive terrain | 2.403e+0 | 0.893 | 0.051 | 0.051 | 0.200 | 0.051 | 0.051 | 1.351 | 0.064 | 0.067 | 8 |
| 3623 | dive terrain | 2.390e+0 | 0.842 | 0.051 | 0.051 | 0.155 | 0.045 | 0.045 | 1.282 | 0.068 | 0.069 | 8 |
| 3624 | dive terrain | 2.379e+0 | 0.791 | 0.051 | 0.051 | 0.115 | 0.039 | 0.039 | 1.214 | 0.068 | 0.068 | 8 |
| 3625 | dive terrain | 2.368e+0 | 0.741 | 0.050 | 0.050 | 0.082 | 0.033 | 0.033 | 1.152 | 0.062 | 0.061 | 8 |
| 3626 | dive terrain | 2.358e+0 | 0.697 | 0.043 | 0.042 | 0.055 | 0.027 | 0.026 | 1.093 | 0.060 | 0.059 | 8 |
| 3627 | dive terrain | 2.348e+0 | 0.663 | 0.034 | 0.033 | 0.034 | 0.021 | 0.020 | 1.038 | 0.054 | 0.053 | 8 |
| 3628 | dive terrain | 2.339e+0 | 0.638 | 0.025 | 0.024 | 0.021 | 0.013 | 0.012 | 0.991 | 0.047 | 0.046 | 8 |
| 3629 last | dive terrain | 2.330e+0 | 0.622 | 0.016 | 0.015 | 0.016 | 0.006 | 0.005 | 0.962 | 0.029 | 0.026 | 8 |
| 3630 | terrain terrain | 2.321e+0 | 0.615 | 0.007 | 0.006 | 0.014 | 0.001 | 0.001 | 0.974 | 0.012 | 0.027 | 8 |
| 3631 | terrain terrain | 2.312e+0 | 0.614 | 0.002 | 0.001 | 0.014 | 0.000 | 0.000 | 0.994 | 0.021 | 0.015 | 8 |
| 3632 | terrain terrain | 2.303e+0 | 0.612 | 0.001 | 0.001 | 0.014 | 0.000 | 0.000 | 1.002 | 0.008 | 0.008 | 8 |
| 3633 | terrain terrain | 2.295e+0 | 0.611 | 0.001 | 0.001 | 0.014 | 0.000 | 0.000 | 1.010 | 0.008 | 0.008 | 8 |
| 3634 | terrain terrain | 2.286e+0 | 0.609 | 0.001 | 0.001 | 0.014 | 0.000 | 0.000 | 1.018 | 0.008 | 0.008 | 8 |
| 3635 | terrain terrain | 2.277e+0 | 0.608 | 0.001 | 0.001 | 0.013 | 0.000 | 0.000 | 1.026 | 0.008 | 0.008 | 8 |
| 3636 | terrain terrain | 2.269e+0 | 0.607 | 0.001 | 0.001 | 0.013 | 0.000 | 0.000 | 1.034 | 0.008 | 0.008 | 8 |
| 3637 | terrain terrain | 2.260e+0 | 0.605 | 0.001 | 0.001 | 0.013 | 0.000 | 0.000 | 1.042 | 0.008 | 0.008 | 8 |
| 3638 | terrain terrain | 2.252e+0 | 0.604 | 0.001 | 0.001 | 0.013 | 0.000 | 0.000 | 1.051 | 0.008 | 0.008 | 8 |
| 3639 | terrain terrain | 2.244e+0 | 0.603 | 0.001 | 0.001 | 0.012 | 0.000 | 0.000 | 1.059 | 0.009 | 0.009 | 8 |
| 3640 | terrain terrain | 2.235e+0 | 0.601 | 0.001 | 0.001 | 0.012 | 0.000 | 0.000 | 1.068 | 0.009 | 0.009 | 8 |
| 3641 | terrain terrain | 2.227e+0 | 0.600 | 0.001 | 0.001 | 0.012 | 0.000 | 0.000 | 1.076 | 0.009 | 0.009 | 8 |

### rise (saturn.rise, frames 3810 to 3884, T at 3852, window 3798 to 3896)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.01631 log of the height a film frame | 1.197 | 3850 | 0.053 | 3816 |  |  | 0.004 | 0.019 | 0.000 | 0.000 | 0.112 at 3891 |
| whole frames | turn | 0.4862 degrees a film frame | 2.091 | 3842 | 0.072 | 3838 |  |  | 0.002 | 0.003 | 0.000 | 0.000 | 0.000 at 3896 |
| whole frames | speed | 9.753 px a film frame at the place | 1.528 | 3847 | 0.063 over 8 | 3840 |  |  | 0.036 | 0.029 | 0.000 | 0.001 over 6 | 1.138 at 3896 |
| rate 2 | rate | 0.01628 log of the height a film frame | 1.199 | 3845 | 0.053 | 3815 + 1/2 | 0.027 | 3815 + 1/2 | 0.005 | 0.020 | 0.000 | 0.000 | 0.113 at 3891 |
| rate 2 | turn | 0.4829 degrees a film frame | 2.105 | 3842 | 0.073 | 3838 + 1/2 | 0.036 | 3838 + 1/2 | 0.003 | 0.002 | 0.000 | 0.000 | 0.000 at 3896 + 1/2 |
| rate 2 | speed | 9.709 px a film frame at the place | 1.534 | 3847 | 0.065 over 8 | 3839 + 1/2 | 0.032 over 8 | 3839 | 0.045 | 0.029 | 0.000 | 0.001 over 6 | 1.298 at 3896 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the plane of the rings between their two radii, where the globe does not hide it. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 6, rate 2 6.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 3810, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.0208 of its height a film frame, the mean of its last 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 1.00 at frame 3794, limit 0.87; inside the rise itself 1.02 at frame 3810 + 1/2. Largest step from one capture frame to the next 0.07 at frame 3815, shown. The part along the surface view's own direction of motion: 0.98 at the lowest, lowest 0.98 at frame 3794, shown; under 0 the eye goes back.

Rest between the rise and the travel (the seam into saturn.travel at film frame 3885, 12 film frames to each side, read at rate 2): a rise and the travel after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body's edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest 3.97 at frame 3889 + 1/2, against 10.05 at frame 3873 and 33.98 at frame 3896 + 1/2 at the ends of the window. The lowest is 0.395 of the slower end, limit 0.07. Near 0 the picture comes to rest between the rise and the travel.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3798 | terrain terrain | 1.565e+0 | 0.289 |  |  | 0.006 |  |  | 0.324 |  |  | 0 |
| 3799 | terrain terrain | 1.573e+0 | 0.291 | 0.002 | 0.002 | 0.006 | 0.000 | 0.000 | 0.344 | 0.020 | 0.020 | 8 |
| 3800 | terrain terrain | 1.580e+0 | 0.293 | 0.002 | 0.002 | 0.006 | 0.000 | 0.000 | 0.360 | 0.016 | 0.016 | 8 |
| 3801 | terrain terrain | 1.588e+0 | 0.294 | 0.001 | 0.001 | 0.006 | 0.000 | 0.000 | 0.373 | 0.012 | 0.012 | 8 |
| 3802 | terrain terrain | 1.596e+0 | 0.295 | 0.001 | 0.001 | 0.006 | 0.000 | 0.000 | 0.382 | 0.009 | 0.009 | 8 |
| 3803 | terrain terrain | 1.603e+0 | 0.297 | 0.001 | 0.001 | 0.006 | 0.000 | 0.000 | 0.389 | 0.007 | 0.006 | 8 |
| 3804 | terrain terrain | 1.611e+0 | 0.298 | 0.002 | 0.002 | 0.006 | 0.000 | 0.000 | 0.393 | 0.004 | 0.004 | 8 |
| 3805 | terrain terrain | 1.619e+0 | 0.300 | 0.002 | 0.002 | 0.006 | 0.000 | 0.000 | 0.395 | 0.002 | 0.002 | 8 |
| 3806 | terrain terrain | 1.627e+0 | 0.302 | 0.002 | 0.002 | 0.006 | 0.000 | 0.000 | 0.395 | 0.000 | 0.001 | 8 |
| 3807 | terrain terrain | 1.635e+0 | 0.303 | 0.002 | 0.002 | 0.006 | 0.000 | 0.000 | 0.394 | 0.001 | 0.002 | 8 |
| 3808 | terrain terrain | 1.643e+0 | 0.305 | 0.002 | 0.002 | 0.006 | 0.000 | 0.000 | 0.392 | 0.002 | 0.002 | 8 |
| 3809 | terrain terrain | 1.652e+0 | 0.307 | 0.002 | 0.002 | 0.006 | 0.000 | 0.000 | 0.390 | 0.002 | 0.002 | 8 |
| 3810 first | rise terrain | 1.660e+0 | 0.309 | 0.002 | 0.002 | 0.006 | 0.000 | 0.003 | 0.390 | 0.001 | 0.017 | 8 |
| 3811 | rise terrain | 1.668e+0 | 0.313 | 0.004 | 0.010 | 0.004 | 0.002 | 0.021 | 0.426 | 0.036 | 0.055 | 8 |
| 3812 | rise terrain | 1.677e+0 | 0.327 | 0.014 | 0.021 | 0.044 | 0.040 | 0.060 | 0.479 | 0.053 | 0.052 | 8 |
| 3813 | rise terrain | 1.687e+0 | 0.353 | 0.026 | 0.033 | 0.111 | 0.067 | 0.073 | 0.521 | 0.043 | 0.042 | 8 |
| 3814 | rise terrain | 1.698e+0 | 0.390 | 0.037 | 0.044 | 0.183 | 0.072 | 0.073 | 0.563 | 0.042 | 0.042 | 8 |
| 3815 | rise terrain | 1.710e+0 | 0.438 | 0.048 | 0.053 | 0.256 | 0.072 | 0.073 | 0.600 | 0.037 | 0.036 | 8 |
| 3816 | rise terrain | 1.724e+0 | 0.491 | 0.053 | 0.053 | 0.328 | 0.072 | 0.073 | 0.634 | 0.034 | 0.034 | 8 |
| 3817 | rise terrain | 1.739e+0 | 0.542 | 0.051 | 0.051 | 0.400 | 0.072 | 0.073 | 0.668 | 0.035 | 0.035 | 8 |
| 3818 | rise terrain | 1.756e+0 | 0.592 | 0.049 | 0.049 | 0.472 | 0.072 | 0.073 | 0.704 | 0.035 | 0.035 | 8 |
| 3819 | rise terrain | 1.774e+0 | 0.639 | 0.047 | 0.047 | 0.545 | 0.072 | 0.073 | 0.739 | 0.035 | 0.036 | 8 |
| 3820 | rise terrain | 1.794e+0 | 0.684 | 0.045 | 0.045 | 0.617 | 0.072 | 0.073 | 0.775 | 0.036 | 0.036 | 8 |
| 3821 | rise terrain | 1.816e+0 | 0.728 | 0.043 | 0.043 | 0.689 | 0.072 | 0.073 | 0.811 | 0.036 | 0.036 | 8 |
| 3822 | rise terrain | 1.839e+0 | 0.769 | 0.042 | 0.041 | 0.762 | 0.072 | 0.073 | 0.847 | 0.036 | 0.036 | 8 |
| 3823 | rise terrain | 1.863e+0 | 0.809 | 0.040 | 0.039 | 0.834 | 0.072 | 0.073 | 0.883 | 0.036 | 0.036 | 8 |
| 3824 | rise terrain | 1.889e+0 | 0.846 | 0.038 | 0.037 | 0.906 | 0.072 | 0.073 | 0.919 | 0.036 | 0.036 | 8 |
| 3825 | rise terrain | 1.916e+0 | 0.882 | 0.036 | 0.036 | 0.979 | 0.072 | 0.073 | 0.954 | 0.035 | 0.036 | 8 |
| 3826 | rise terrain | 1.945e+0 | 0.916 | 0.034 | 0.034 | 1.051 | 0.072 | 0.073 | 0.981 | 0.028 | 0.028 | 8 |
| 3827 | rise terrain | 1.976e+0 | 0.948 | 0.032 | 0.032 | 1.123 | 0.072 | 0.073 | 1.006 | 0.025 | 0.025 | 8 |
| 3828 | rise terrain | 2.007e+0 | 0.978 | 0.030 | 0.030 | 1.196 | 0.072 | 0.073 | 1.025 | 0.018 | 0.018 | 8 |
| 3829 | rise terrain | 2.041e+0 | 1.006 | 0.028 | 0.028 | 1.268 | 0.072 | 0.073 | 1.037 | 0.012 | 0.011 | 8 |
| 3830 | rise terrain | 2.075e+0 | 1.032 | 0.026 | 0.026 | 1.340 | 0.072 | 0.073 | 1.045 | 0.008 | 0.007 | 8 |
| 3831 | rise terrain | 2.111e+0 | 1.056 | 0.024 | 0.024 | 1.413 | 0.072 | 0.073 | 1.050 | 0.006 | 0.005 | 8 |
| 3832 | rise terrain | 2.149e+0 | 1.078 | 0.022 | 0.022 | 1.485 | 0.072 | 0.073 | 1.056 | 0.006 | 0.007 | 8 |
| 3833 | rise terrain | 2.188e+0 | 1.099 | 0.020 | 0.020 | 1.558 | 0.072 | 0.073 | 1.066 | 0.009 | 0.012 | 8 |
| 3834 | rise terrain | 2.228e+0 | 1.117 | 0.018 | 0.018 | 1.630 | 0.072 | 0.073 | 1.080 | 0.015 | 0.019 | 8 |
| 3835 | rise terrain | 2.269e+0 | 1.134 | 0.017 | 0.016 | 1.702 | 0.072 | 0.073 | 1.104 | 0.023 | 0.029 | 8 |
| 3836 | rise terrain | 2.312e+0 | 1.148 | 0.015 | 0.014 | 1.775 | 0.072 | 0.073 | 1.135 | 0.032 | 0.036 | 8 |
| 3837 | rise terrain | 2.357e+0 | 1.161 | 0.013 | 0.012 | 1.847 | 0.072 | 0.073 | 1.175 | 0.040 | 0.045 | 8 |
| 3838 | rise terrain | 2.402e+0 | 1.172 | 0.011 | 0.011 | 1.920 | 0.072 | 0.073 | 1.225 | 0.050 | 0.056 | 8 |
| 3839 | rise terrain | 2.449e+0 | 1.181 | 0.009 | 0.009 | 1.991 | 0.072 | 0.072 | 1.285 | 0.061 | 0.065 | 8 |
| 3840 | rise terrain | 2.497e+0 | 1.188 | 0.007 | 0.007 | 2.049 | 0.057 | 0.055 | 1.348 | 0.063 | 0.062 | 8 |
| 3841 | rise terrain | 2.546e+0 | 1.193 | 0.005 | 0.005 | 2.082 | 0.033 | 0.030 | 1.400 | 0.051 | 0.050 | 8 |
| 3842 | rise terrain | 2.596e+0 | 1.196 | 0.003 | 0.003 | 2.091 | 0.009 | 0.006 | 1.439 | 0.039 | 0.038 | 8 |
| 3843 | rise terrain | 2.647e+0 | 1.197 | 0.001 | 0.001 | 2.087 | 0.004 | 0.010 | 1.473 | 0.034 | 0.034 | 8 |
| 3844 | rise terrain | 2.699e+0 | 1.197 | 0.000 | 0.000 | 2.073 | 0.013 | 0.019 | 1.504 | 0.031 | 0.030 | 8 |
| 3845 | rise terrain | 2.752e+0 | 1.197 | 0.000 | 0.000 | 2.051 | 0.022 | 0.028 | 1.527 | 0.024 | 0.023 | 8 |
| 3846 | rise terrain | 2.807e+0 | 1.197 | 0.000 | 0.000 | 2.020 | 0.031 | 0.037 | 1.543 | 0.015 | 0.015 | 8 |
| 3847 | rise terrain | 2.862e+0 | 1.197 | 0.000 | 0.000 | 1.980 | 0.040 | 0.046 | 1.528 | 0.006 | 0.005 | 8 |
| 3848 | rise terrain | 2.918e+0 | 1.197 | 0.000 | 0.000 | 1.931 | 0.049 | 0.055 | 1.523 | 0.005 | 0.012 | 7 |
| 3849 | rise terrain | 2.976e+0 | 1.197 | 0.000 | 0.000 | 1.873 | 0.058 | 0.064 | 1.507 | 0.016 | 0.024 | 7 |
| 3850 | rise terrain | 3.035e+0 | 1.197 | 0.000 | 0.000 | 1.806 | 0.066 | 0.070 | 1.459 | 0.027 | 0.031 | 7 |
| 3851 | rise terrain | 3.095e+0 | 1.197 | 0.000 | 0.000 | 1.737 | 0.070 | 0.070 | 1.427 | 0.032 | 0.034 | 6 |
| 3852 T | rise terrain | 3.155e+0 | 1.197 | 0.000 | 0.000 | 1.667 | 0.070 | 0.070 | 1.391 | 0.035 | 0.037 | 6 |
| 3853 | rise orbit | 3.218e+0 | 1.197 | 0.000 | 0.000 | 1.597 | 0.070 | 0.070 | 1.353 | 0.038 | 0.039 | 6 |
| 3854 | rise orbit | 3.281e+0 | 1.197 | 0.000 | 0.000 | 1.527 | 0.070 | 0.070 | 1.314 | 0.039 | 0.039 | 6 |
| 3855 | rise orbit | 3.346e+0 | 1.197 | 0.000 | 0.000 | 1.457 | 0.070 | 0.070 | 1.275 | 0.039 | 0.039 | 6 |
| 3856 | rise orbit | 3.412e+0 | 1.197 | 0.000 | 0.001 | 1.387 | 0.070 | 0.070 | 1.238 | 0.038 | 0.037 | 6 |
| 3857 | rise orbit | 3.479e+0 | 1.196 | 0.001 | 0.002 | 1.317 | 0.070 | 0.070 | 1.202 | 0.035 | 0.035 | 6 |
| 3858 | rise orbit | 3.547e+0 | 1.194 | 0.002 | 0.003 | 1.246 | 0.070 | 0.070 | 1.176 | 0.032 | 0.032 | 6 |
| 3859 | rise orbit | 3.617e+0 | 1.191 | 0.003 | 0.004 | 1.176 | 0.070 | 0.071 | 1.144 | 0.032 | 0.032 | 7 |
| 3860 | rise orbit | 3.688e+0 | 1.187 | 0.004 | 0.005 | 1.106 | 0.070 | 0.071 | 1.126 | 0.029 | 0.030 | 7 |
| 3861 | rise orbit | 3.760e+0 | 1.182 | 0.005 | 0.006 | 1.036 | 0.070 | 0.071 | 1.098 | 0.028 | 0.028 | 8 |
| 3862 | rise orbit | 3.833e+0 | 1.177 | 0.006 | 0.007 | 0.966 | 0.070 | 0.071 | 1.074 | 0.024 | 0.025 | 8 |
| 3863 | rise orbit | 3.906e+0 | 1.170 | 0.007 | 0.008 | 0.896 | 0.070 | 0.071 | 1.053 | 0.021 | 0.022 | 8 |
| 3864 | rise orbit | 3.981e+0 | 1.162 | 0.008 | 0.009 | 0.826 | 0.070 | 0.071 | 1.034 | 0.018 | 0.019 | 8 |
| 3865 | rise orbit | 4.057e+0 | 1.153 | 0.009 | 0.010 | 0.756 | 0.070 | 0.071 | 1.019 | 0.016 | 0.016 | 8 |
| 3866 | rise orbit | 4.133e+0 | 1.143 | 0.010 | 0.011 | 0.686 | 0.070 | 0.071 | 1.005 | 0.013 | 0.014 | 8 |
| 3867 | rise orbit | 4.210e+0 | 1.132 | 0.011 | 0.012 | 0.617 | 0.069 | 0.069 | 0.995 | 0.010 | 0.010 | 8 |
| 3868 | rise orbit | 4.288e+0 | 1.120 | 0.012 | 0.012 | 0.552 | 0.065 | 0.065 | 0.990 | 0.006 | 0.008 | 8 |
| 3869 | rise orbit | 4.366e+0 | 1.108 | 0.012 | 0.013 | 0.491 | 0.061 | 0.061 | 0.978 | 0.011 | 0.020 | 8 |
| 3870 | rise orbit | 4.445e+0 | 1.095 | 0.013 | 0.013 | 0.433 | 0.058 | 0.058 | 0.952 | 0.026 | 0.036 | 8 |
| 3871 | rise orbit | 4.524e+0 | 1.082 | 0.013 | 0.014 | 0.379 | 0.054 | 0.054 | 0.911 | 0.041 | 0.047 | 8 |
| 3872 | rise orbit | 4.603e+0 | 1.068 | 0.014 | 0.015 | 0.329 | 0.050 | 0.050 | 0.863 | 0.049 | 0.050 | 8 |
| 3873 | rise orbit | 4.683e+0 | 1.052 | 0.015 | 0.016 | 0.282 | 0.047 | 0.047 | 0.814 | 0.049 | 0.048 | 8 |
| 3874 | rise orbit | 4.763e+0 | 1.036 | 0.016 | 0.017 | 0.239 | 0.043 | 0.043 | 0.764 | 0.050 | 0.048 | 8 |
| 3875 | rise orbit | 4.843e+0 | 1.019 | 0.017 | 0.018 | 0.199 | 0.039 | 0.039 | 0.719 | 0.045 | 0.044 | 8 |
| 3876 | rise orbit | 4.922e+0 | 1.001 | 0.018 | 0.018 | 0.164 | 0.036 | 0.036 | 0.683 | 0.036 | 0.035 | 8 |
| 3877 | rise orbit | 5.002e+0 | 0.983 | 0.018 | 0.018 | 0.131 | 0.032 | 0.032 | 0.650 | 0.033 | 0.033 | 8 |
| 3878 | rise orbit | 5.082e+0 | 0.966 | 0.018 | 0.018 | 0.103 | 0.028 | 0.028 | 0.618 | 0.032 | 0.032 | 8 |
| 3879 | rise orbit | 5.161e+0 | 0.948 | 0.018 | 0.018 | 0.078 | 0.025 | 0.024 | 0.587 | 0.031 | 0.031 | 8 |
| 3880 | rise orbit | 5.240e+0 | 0.930 | 0.018 | 0.018 | 0.057 | 0.021 | 0.021 | 0.557 | 0.030 | 0.030 | 8 |
| 3881 | rise orbit | 5.318e+0 | 0.912 | 0.018 | 0.018 | 0.040 | 0.017 | 0.017 | 0.528 | 0.029 | 0.029 | 8 |
| 3882 | rise orbit | 5.396e+0 | 0.895 | 0.018 | 0.018 | 0.026 | 0.014 | 0.013 | 0.500 | 0.028 | 0.028 | 8 |
| 3883 | rise orbit | 5.474e+0 | 0.877 | 0.018 | 0.018 | 0.016 | 0.010 | 0.010 | 0.473 | 0.028 | 0.028 | 8 |
| 3884 last | rise orbit | 5.551e+0 | 0.859 | 0.018 | 0.018 | 0.010 | 0.006 | 0.006 | 0.445 | 0.028 | 0.029 | 8 |
| 3885 | travel orbit | 5.628e+0 | 0.841 | 0.018 | 0.018 | 0.007 | 0.003 | 0.002 | 0.416 | 0.029 | 0.029 | 8 |
| 3886 | travel orbit | 5.704e+0 | 0.821 | 0.019 | 0.025 | 0.007 | 0.000 | 0.000 | 0.390 | 0.026 | 0.025 | 8 |
| 3887 | travel orbit | 5.778e+0 | 0.789 | 0.032 | 0.046 | 0.007 | 0.000 | 0.000 | 0.367 | 0.023 | 0.029 | 8 |
| 3888 | travel orbit | 5.847e+0 | 0.733 | 0.056 | 0.073 | 0.007 | 0.000 | 0.000 | 0.331 | 0.036 | 0.053 | 8 |
| 3889 | travel orbit | 5.910e+0 | 0.651 | 0.082 * | 0.096 * | 0.007 | 0.000 | 0.000 | 0.265 | 0.066 | 0.090 * | 8 |
| 3890 | travel orbit | 5.963e+0 | 0.549 | 0.102 * | 0.110 * | 0.006 | 0.000 | 0.000 | 0.163 | 0.102 * | 0.105 * | 8 |
| 3891 | travel orbit | 6.006e+0 | 0.438 | 0.112 * | 0.113 * | 0.006 | 0.000 | 0.000 | 0.168 | 0.006 | 0.202 * | 8 |
| 3892 | travel orbit | 6.038e+0 | 0.329 | 0.109 * | 0.108 * | 0.006 | 0.000 | 0.000 | 0.467 | 0.299 * | 0.417 * | 8 |
| 3893 | travel orbit | 6.061e+0 | 0.236 | 0.093 * | 0.091 * | 0.006 | 0.000 | 0.000 | 0.951 | 0.484 * | 0.604 * | 8 |
| 3894 | travel orbit | 6.078e+0 | 0.171 | 0.065 | 0.061 | 0.006 | 0.000 | 0.000 | 1.630 | 0.679 * | 0.817 * | 8 |
| 3895 | travel orbit | 6.093e+0 | 0.144 | 0.027 | 0.022 | 0.006 | 0.000 | 0.000 | 2.529 | 0.899 * | 1.051 * | 8 |
| 3896 | travel orbit | 6.108e+0 | 0.160 | 0.016 | 0.043 | 0.006 | 0.000 | 0.000 | 3.667 | 1.138 * | 1.298 * | 8 |

## pictures

Tier draft, rate 2, 7.63 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

The dive is joined from 2 parts: /home/user/workspace/work/p6/ht9/01/saturn-dive-p1of2 (capture frames 7056 to 7169, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/ht9/02/saturn-dive-p2of2 (capture frames 7170 to 7283, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

The rise is joined from 2 parts: /home/user/workspace/work/p6/ht9/03/saturn-rise-p1of2 (capture frames 7596 to 7694, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/ht9/04/saturn-rise-p2of2 (capture frames 7695 to 7793, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

### dive (saturn.dive, frames 3540 to 3629, window 3528 to 3641, 228 draft frames at rate 2)

Largest level step: 0.01 at frame 3596 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.05 from frame 3573 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 1.90 from frame 3622 to the next, block column 15 row 7 from the top left, shown, not judged.
Largest change in place: 18.8 from frame 3578 to 8 film frames later, most at pixel 1480, 500 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.35 from frame 3573 + 1/2 to 8 film frames later, most at pixel 1424, 460, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 3630 to 3641 + 1/2): change 6.6, pattern 0.06.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 3571 in /home/user/workspace/work/p6/ht9/01/saturn-dive-p1of2-pops.png, frame 3572 in /home/user/workspace/work/p6/ht9/01/saturn-dive-p1of2-pops.png, frame 3572 + 1/2 in /home/user/workspace/work/p6/ht9/01/saturn-dive-p1of2-pops.png, frame 3573 + 1/2 in /home/user/workspace/work/p6/ht9/01/saturn-dive-p1of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 3562 in /home/user/workspace/work/p6/ht9/01/saturn-dive-p1of2-changes.png, frame 3573 + 1/2 in /home/user/workspace/work/p6/ht9/01/saturn-dive-p1of2-changes.png, frame 3581 + 1/2 in /home/user/workspace/work/p6/ht9/01/saturn-dive-p1of2-changes.png, frame 3589 + 1/2 in no panel (a slice --frames 7179-7179 draws it).

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3528 | 72.70 |  | 0.5 | 0.57 | 0.57 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 14,1 | 1.4 | 4.2 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3528 + 1/2 | 72.71 | 0.00 | 0.5 | 0.57 | 0.57 | 1.00 | 0.99 | 0.99 | 0.004 | 1.24 | 5,6 | 1.4 | 4.1 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3529 | 72.72 | 0.00 | 0.5 | 0.57 | 0.57 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 14,5 | 1.4 | 4.0 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3529 + 1/2 | 72.73 | 0.00 | 0.5 | 0.58 | 0.57 | 1.01 | 1.01 | 1.01 | 0.000 | 1.30 | 14,4 | 1.4 | 4.1 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3530 | 72.74 | 0.00 | 0.4 | 0.56 | 0.57 | 0.98 | 0.98 | 0.98 | 0.000 | 1.11 | 3,6 | 1.4 | 4.1 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3530 + 1/2 | 72.75 | 0.00 | 0.5 | 0.57 | 0.57 | 1.00 | 1.00 | 1.00 | 0.001 | 1.12 | 2,3 | 1.5 | 4.1 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3531 | 72.76 | 0.00 | 0.5 | 0.57 | 0.57 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 15,5 | 1.5 | 4.0 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3531 + 1/2 | 72.77 | 0.00 | 0.5 | 0.57 | 0.57 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 1,2 | 1.5 | 4.1 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3532 | 72.78 | 0.00 | 0.5 | 0.57 | 0.57 | 0.99 | 1.00 | 0.99 | 0.000 | 1.12 | 7,2 | 1.5 | 4.0 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3532 + 1/2 | 72.78 | 0.00 | 0.5 | 0.57 | 0.57 | 0.99 | 0.99 | 0.99 | 0.000 | 1.33 | 12,4 | 1.5 | 4.0 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3533 | 72.79 | 0.00 | 0.5 | 0.56 | 0.57 | 0.99 | 0.99 | 0.99 | 0.000 | 1.16 | 1,3 | 1.5 | 4.0 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3533 + 1/2 | 72.80 | 0.00 | 0.5 | 0.57 | 0.57 | 1.00 | 1.00 | 1.00 | 0.001 | 1.17 | 14,4 | 1.5 | 4.0 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3534 | 72.81 | 0.00 | 0.5 | 0.58 | 0.57 | 1.01 | 1.01 | 1.01 | 0.001 | 1.19 | 4,6 | 1.6 | 4.0 | 0.52 | 0.00 | 0.51 | 8.0 |
| 3534 + 1/2 | 72.82 | 0.00 | 0.5 | 0.57 | 0.57 | 0.99 | 0.99 | 0.99 | 0.000 | 1.15 | 3,3 | 1.5 | 3.8 | 0.52 | 0.00 | 0.51 | 8.3 |
| 3535 | 72.83 | 0.00 | 0.5 | 0.57 | 0.57 | 1.00 | 1.00 | 1.00 | 0.000 | 1.29 | 15,5 | 1.7 | 3.9 | 0.52 | 0.01 | 0.51 | 8.0 |
| 3535 + 1/2 | 72.83 | 0.00 | 0.5 | 0.57 | 0.57 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 3,3 | 2.2 | 3.8 | 0.52 | 0.01 | 0.51 | 8.0 |
| 3536 | 72.84 | 0.00 | 0.5 | 0.58 | 0.57 | 1.02 | 1.02 | 1.02 | 0.000 | 1.20 | 4,5 | 2.7 | 3.9 | 0.52 | 0.01 | 0.51 | 8.0 |
| 3536 + 1/2 | 72.85 | 0.00 | 0.6 | 0.57 | 0.57 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 14,2 | 3.1 | 4.6 | 0.52 | 0.01 | 0.51 | 8.0 |
| 3537 | 72.86 | 0.00 | 0.5 | 0.57 | 0.57 | 0.99 | 0.99 | 0.99 | 0.000 | 1.15 | 14,2 | 3.4 | 5.2 | 0.52 | 0.02 | 0.51 | 8.0 |
| 3537 + 1/2 | 72.87 | 0.00 | 0.5 | 0.57 | 0.57 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 13,6 | 3.6 | 5.6 | 0.52 | 0.02 | 0.51 | 8.0 |
| 3538 | 72.88 | 0.00 | 0.4 | 0.57 | 0.57 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 15,1 | 3.6 | 5.6 | 0.52 | 0.02 | 0.51 | 8.0 |
| 3538 + 1/2 | 72.89 | 0.00 | 0.5 | 0.58 | 0.57 | 1.00 | 1.00 | 1.00 | 0.001 | 1.13 | 14,3 | 3.7 | 5.6 | 0.52 | 0.02 | 0.51 | 8.0 |
| 3539 | 72.89 | 0.00 | 0.5 | 0.57 | 0.58 | 0.98 | 0.98 | 0.98 | 0.000 | 1.14 | 14,2 | 3.7 | 5.8 | 0.52 | 0.02 | 0.51 | 8.0 |
| 3539 + 1/2 | 72.90 | 0.00 | 0.5 | 0.58 | 0.58 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 9,0 | 3.7 | 5.7 | 0.52 | 0.02 | 0.51 | 8.0 |
| 3540 first | 72.91 | 0.00 | 0.5 | 0.57 | 0.58 | 0.98 | 0.98 | 0.98 | 0.002 | 1.16 | 15,1 | 3.7 | 5.7 | 0.52 | 0.02 | 0.51 | 8.0 |
| 3540 + 1/2 | 72.92 | 0.00 | 0.5 | 0.58 | 0.58 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 13,3 | 3.7 | 5.7 | 0.52 | 0.02 | 0.51 | 8.0 |
| 3541 | 72.93 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 5,6 | 3.8 | 5.7 | 0.52 | 0.02 | 0.51 | 8.0 |
| 3541 + 1/2 | 72.93 | 0.00 | 0.5 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.001 | 1.17 | 14,2 | 3.7 | 5.6 | 0.52 | 0.02 | 0.51 | 8.0 |
| 3542 | 72.94 | 0.00 | 0.5 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.002 | 1.29 | 12,5 | 3.5 | 5.4 | 0.52 | 0.02 | 0.51 | 8.0 |
| 3542 + 1/2 | 72.94 | 0.00 | 0.5 | 0.60 | 0.61 | 0.99 | 0.99 | 0.99 | 0.000 | 1.55 | 12,5 | 3.4 | 4.7 | 0.52 | 0.02 | 0.51 | 8.0 |
| 3543 | 72.93 | 0.00 | 0.5 | 0.62 | 0.62 | 1.00 | 1.00 | 1.00 | 0.002 | 1.77 | 12,5 | 3.2 | 4.2 | 0.51 | 0.02 | 0.50 | 8.0 |
| 3543 + 1/2 | 72.93 | 0.00 | 0.5 | 0.64 | 0.63 | 1.00 | 1.00 | 1.00 | 0.000 | 1.84 | 11,6 | 2.9 | 4.6 | 0.51 | 0.01 | 0.50 | 8.0 |
| 3544 | 72.93 | 0.01 | 0.6 | 0.65 | 0.65 | 1.00 | 1.00 | 1.00 | 0.000 | 1.72 | 12,5 | 2.9 | 6.2 | 0.51 | 0.01 | 0.50 | 8.0 |
| 3544 + 1/2 | 72.95 | 0.00 | 0.6 | 0.66 | 0.66 | 1.01 | 1.01 | 1.01 | 0.000 | 1.44 | 11,6 | 3.1 | 7.0 | 0.51 | 0.01 | 0.49 | 8.0 |
| 3545 | 72.97 | 0.01 | 0.6 | 0.67 | 0.67 | 0.99 | 0.99 | 0.99 | 0.002 | 1.30 | 4,3 | 3.4 | 8.4 | 0.51 | 0.01 | 0.49 | 8.0 |
| 3545 + 1/2 | 73.01 | 0.00 | 0.6 | 0.68 | 0.68 | 1.00 | 1.00 | 1.00 | 0.000 | 1.27 | 3,3 | 3.9 | 10.1 | 0.51 | 0.01 | 0.49 | 8.0 |
| 3546 | 73.05 | 0.00 | 0.6 | 0.70 | 0.70 | 1.01 | 1.01 | 1.01 | 0.000 | 1.39 | 1,3 | 4.4 | 11.7 | 0.50 | 0.01 | 0.49 | 8.0 |
| 3546 + 1/2 | 73.10 | 0.00 | 0.6 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.49 | 11,5 | 4.6 | 13.5 | 0.50 | 0.02 | 0.49 | 8.0 |
| 3547 | 73.16 | 0.00 | 0.7 | 0.74 | 0.74 | 1.00 | 1.00 | 1.00 | 0.002 | 1.56 | 11,5 | 4.8 | 15.7 | 0.50 | 0.02 | 0.49 | 8.0 |
| 3547 + 1/2 | 73.22 | 0.00 | 0.7 | 0.76 | 0.76 | 1.01 | 1.01 | 1.01 | 0.001 | 1.73 | 11,5 | 4.9 | 18.2 | 0.50 | 0.02 | 0.48 | 8.0 |
| 3548 | 73.28 | 0.00 | 0.8 | 0.78 | 0.79 | 0.99 | 0.99 | 0.99 | 0.000 | 1.78 | 11,5 | 5.2 | 17.5 | 0.50 | 0.02 | 0.49 | 8.0 |
| 3548 + 1/2 | 73.35 | 0.00 | 0.7 | 0.81 | 0.81 | 1.00 | 1.00 | 1.00 | 0.002 | 1.76 | 11,5 | 6.0 | 19.4 | 0.50 | 0.03 | 0.49 | 8.0 |
| 3549 | 73.42 | 0.00 | 0.9 | 0.84 | 0.83 | 1.00 | 1.00 | 1.00 | 0.000 | 1.75 | 11,5 | 6.3 | 21.4 | 0.50 | 0.03 | 0.49 | 8.0 |
| 3549 + 1/2 | 73.50 | 0.00 | 0.9 | 0.86 | 0.86 | 0.99 | 0.99 | 0.99 | 0.001 | 1.75 | 11,5 | 6.7 | 24.9 | 0.50 | 0.04 | 0.48 | 8.0 |
| 3550 | 73.58 | 0.00 | 0.9 | 0.89 | 0.89 | 0.99 | 1.00 | 0.99 | 0.000 | 1.53 | 11,5 | 7.0 | 27.0 | 0.50 | 0.04 | 0.48 | 8.0 |
| 3550 + 1/2 | 73.66 | 0.00 | 1.0 | 0.93 | 0.92 | 1.01 | 1.01 | 1.01 | 0.010 | 1.46 | 11,5 | 7.2 | 29.5 | 0.49 | 0.05 | 0.48 | 8.0 |
| 3551 | 73.75 | 0.00 | 1.1 | 0.95 | 0.97 | 0.98 | 0.99 | 0.98 | 0.004 | 1.24 | 2,4 | 8.0 | 31.6 | 0.49 | 0.06 | 0.48 | 8.0 |
| 3551 + 1/2 | 73.84 | 0.00 | 1.1 | 1.00 | 1.00 | 1.01 | 1.01 | 1.01 | 0.008 | 1.40 | 14,0 | 8.7 | 32.8 | 0.50 | 0.06 | 0.48 | 8.0 |
| 3552 | 73.93 | 0.00 | 1.2 | 1.04 | 1.04 | 1.00 | 1.00 | 1.00 | 0.009 | 1.48 | 14,0 | 9.0 | 30.9 | 0.50 | 0.06 | 0.48 | 8.0 |
| 3552 + 1/2 | 74.04 | 0.00 | 1.3 | 1.08 | 1.07 | 1.00 | 1.00 | 1.00 | 0.000 | 1.39 | 14,0 | 9.2 | 33.7 | 0.49 | 0.07 | 0.48 | 8.0 |
| 3553 | 74.13 | 0.00 | 1.3 | 1.11 | 1.11 | 0.99 | 0.99 | 0.99 | 0.000 | 1.53 | 14,0 | 9.7 | 37.2 | 0.49 | 0.08 | 0.47 | 8.0 |
| 3553 + 1/2 | 74.23 | 0.00 | 1.4 | 1.15 | 1.15 | 1.00 | 1.00 | 1.00 | 0.012 | 1.36 | 14,0 | 9.9 | 39.6 | 0.49 | 0.08 | 0.47 | 8.0 |
| 3554 | 74.34 | 0.00 | 1.5 | 1.20 | 1.20 | 1.00 | 1.00 | 1.00 | 0.015 | 1.59 | 14,0 | 10.3 | 41.9 | 0.49 | 0.09 | 0.47 | 8.0 |
| 3554 + 1/2 | 74.44 | 0.00 | 1.6 | 1.25 | 1.24 | 1.01 | 1.01 | 1.01 | 0.017 | 1.35 | 13,0 | 10.6 | 43.8 | 0.49 | 0.10 | 0.47 | 8.0 |
| 3555 | 74.54 | 0.00 | 1.7 | 1.28 | 1.29 | 1.00 | 1.00 | 1.00 | 0.010 | 1.30 | 5,1 | 10.9 | 41.8 | 0.48 | 0.10 | 0.47 | 8.0 |
| 3555 + 1/2 | 74.64 | 0.00 | 1.7 | 1.32 | 1.31 | 1.01 | 1.01 | 1.01 | 0.016 | 1.28 | 13,2 | 11.3 | 44.6 | 0.48 | 0.11 | 0.47 | 8.0 |
| 3556 | 74.74 | 0.00 | 1.8 | 1.34 | 1.35 | 0.99 | 1.00 | 0.99 | 0.002 | 1.46 | 14,1 | 11.6 | 48.3 | 0.48 | 0.12 | 0.47 | 8.0 |
| 3556 + 1/2 | 74.84 | 0.00 | 1.9 | 1.38 | 1.38 | 1.00 | 1.00 | 1.00 | 0.023 | 1.44 | 5,1 | 11.8 | 50.7 | 0.48 | 0.12 | 0.47 | 8.0 |
| 3557 | 74.94 | 0.00 | 1.9 | 1.42 | 1.40 | 1.01 | 1.01 | 1.01 | 0.008 | 1.46 | 5,1 | 12.4 | 53.2 | 0.48 | 0.13 | 0.47 | 8.0 |
| 3557 + 1/2 | 75.04 | 0.00 | 2.1 | 1.43 | 1.44 | 1.00 | 1.00 | 1.00 | 0.007 | 1.41 | 5,1 | 12.5 | 52.0 | 0.48 | 0.14 | 0.46 | 8.0 |
| 3558 | 75.14 | 0.00 | 2.2 | 1.46 | 1.45 | 1.00 | 1.00 | 1.00 | 0.019 | 1.33 | 5,1 | 12.7 | 52.0 | 0.48 | 0.14 | 0.46 | 8.0 |
| 3558 + 1/2 | 75.24 | 0.00 | 2.2 | 1.48 | 1.48 | 1.00 | 0.99 | 0.99 | 0.029 | 1.56 | 5,1 | 13.0 | 56.6 | 0.48 | 0.15 | 0.46 | 8.0 |
| 3559 | 75.34 | 0.00 | 2.3 | 1.50 | 1.49 | 1.00 | 1.02 | 1.00 | 0.019 | 1.51 | 5,1 | 13.0 | 60.4 | 0.47 | 0.17 | 0.46 | 8.0 |
| 3559 + 1/2 | 75.44 | 0.00 | 2.3 | 1.51 | 1.52 | 1.00 | 1.00 | 1.00 | 0.016 | 1.27 | 5,1 | 13.1 | 61.3 | 0.47 | 0.17 | 0.46 | 8.0 |
| 3560 | 75.54 | 0.00 | 2.4 | 1.56 | 1.53 | 1.02 | 1.03 | 1.02 | 0.030 | 1.35 | 11,2 | 13.5 | 64.5 | 0.46 | 0.19 | 0.45 | 8.0 |
| 3560 + 1/2 | 75.63 | 0.00 | 2.5 | 1.54 | 1.55 | 0.99 | 1.00 | 0.99 | 0.038 | 1.23 | 11,2 | 13.9 | 60.5 | 0.46 | 0.20 | 0.45 | 8.0 |
| 3561 | 75.71 | 0.00 | 2.5 | 1.54 | 1.56 | 0.99 | 0.98 | 0.98 | 0.040 | 1.16 | 10,1 | 13.8 | 62.6 | 0.46 | 0.19 | 0.45 | 8.0 |
| 3561 + 1/2 | 75.79 | 0.00 | 2.6 | 1.57 | 1.57 | 1.00 | 0.99 | 0.99 | 0.036 | 1.22 | 14,1 | 14.1 | 65.2 | 0.46 | 0.20 | 0.45 | 8.0 |
| 3562 | 75.87 | 0.00 | 2.7 | 1.57 | 1.58 | 0.99 | 1.00 | 0.99 | 0.041 | 1.13 | 11,3 | 14.2 | 68.4 | 0.46 | 0.20 | 0.45 | 8.0 |
| 3562 + 1/2 | 75.95 | 0.00 | 2.6 | 1.60 | 1.59 | 1.01 | 0.98 | 0.98 | 0.034 | 1.21 | 11,2 | 14.3 | 69.0 | 0.46 | 0.20 | 0.45 | 8.0 |
| 3563 | 76.04 | 0.00 | 2.8 | 1.60 | 1.62 | 0.99 | 1.00 | 0.99 | 0.027 | 1.19 | 10,2 | 13.5 | 65.1 | 0.47 | 0.19 | 0.45 | 8.0 |
| 3563 + 1/2 | 76.12 | 0.00 | 2.9 | 1.64 | 1.62 | 1.01 | 1.01 | 1.01 | 0.041 | 1.29 | 10,8 | 13.7 | 66.0 | 0.47 | 0.19 | 0.45 | 8.0 |
| 3564 | 76.21 | 0.00 | 3.0 | 1.65 | 1.65 | 1.00 | 1.02 | 1.00 | 0.027 | 1.23 | 10,2 | 13.8 | 68.9 | 0.46 | 0.19 | 0.45 | 8.0 |
| 3564 + 1/2 | 76.30 | 0.00 | 2.9 | 1.66 | 1.67 | 0.99 | 0.98 | 0.98 | 0.029 | 1.24 | 11,3 | 14.0 | 68.1 | 0.46 | 0.20 | 0.45 | 8.0 |
| 3565 | 76.38 | 0.00 | 3.2 | 1.70 | 1.68 | 1.01 | 1.01 | 1.01 | 0.044 | 1.21 | 6,2 | 14.0 | 69.8 | 0.46 | 0.19 | 0.45 | 8.0 |
| 3565 + 1/2 | 76.46 | 0.00 | 3.0 | 1.70 | 1.72 | 0.99 | 0.99 | 0.99 | 0.033 | 1.21 | 12,0 | 14.1 | 67.3 | 0.46 | 0.18 | 0.45 | 8.0 |
| 3566 | 76.54 | 0.00 | 3.1 | 1.74 | 1.73 | 1.01 | 1.02 | 1.01 | 0.033 | 1.20 | 6,0 | 14.1 | 68.6 | 0.46 | 0.19 | 0.45 | 8.0 |
| 3566 + 1/2 | 76.62 | 0.00 | 3.2 | 1.75 | 1.76 | 1.00 | 1.02 | 1.00 | 0.037 | 1.24 | 12,0 | 14.6 | 69.6 | 0.46 | 0.18 | 0.45 | 8.0 |
| 3567 | 76.70 | 0.00 | 3.2 | 1.79 | 1.77 | 1.01 | 0.99 | 0.99 | 0.059 | 1.17 | 6,2 | 14.3 | 68.5 | 0.46 | 0.17 | 0.44 | 8.0 |
| 3567 + 1/2 | 76.77 | 0.00 | 3.4 | 1.78 | 1.81 | 0.98 | 0.97 | 0.97 | 0.047 | 1.30 | 6,0 | 14.3 | 62.8 | 0.47 | 0.15 | 0.45 | 8.0 |
| 3568 | 76.84 | 0.00 | 3.4 | 1.84 | 1.81 | 1.02 | 1.01 | 1.01 | 0.050 | 1.34 | 6,0 | 14.5 | 69.8 | 0.46 | 0.17 | 0.45 | 8.0 |
| 3568 + 1/2 | 76.91 | 0.00 | 3.4 | 1.84 | 1.82 | 1.01 | 1.02 | 1.01 | 0.033 | 1.29 | 0,0 | 14.5 | 70.9 | 0.46 | 0.17 | 0.45 | 8.0 |
| 3569 | 76.98 | 0.01 | 3.4 | 1.87 | 1.82 | 1.03 | 1.04 | 1.03 | 0.039 | 1.32 | 6,0 | 14.5 | 72.7 | 0.47 | 0.16 | 0.45 | 8.0 |
| 3569 + 1/2 | 77.03 | 0.00 | 3.4 | 1.88 | 1.82 | 1.03 | 1.03 | 1.03 | 0.044 | 1.33 | 6,0 | 14.4 | 70.1 | 0.47 | 0.17 | 0.45 | 8.0 |
| 3570 | 77.08 | 0.01 | 3.5 | 1.89 | 1.82 | 1.04 | 1.04 | 1.04 | 0.039 | 1.33 | 0,0 | 14.3 | 65.1 | 0.46 | 0.17 | 0.44 | 8.0 |
| 3570 + 1/2 | 77.11 | 0.01 | 3.5 | 1.90 | 1.82 | 1.04 | 1.03 | 1.03 | 0.040 | 1.39 | 6,0 | 14.5 | 59.7 | 0.46 | 0.16 | 0.44 | 8.0 |
| 3571 | 77.12 | 0.00 | 3.6 | 1.92 | 1.82 | 1.05 | 1.06 | 1.05 | 0.041 | 1.35 | 5,0 | 14.4 | 58.9 | 0.46 | 0.19 | 0.44 | 8.0 |
| 3571 + 1/2 | 77.12 | 0.01 | 3.8 | 1.91 | 1.82 | 1.05 | 1.03 | 1.03 | 0.068 | 1.37 | 5,0 | 14.6 | 60.1 | 0.45 | 0.20 | 0.44 | 8.0 |
| 3572 | 77.11 | 0.01 | 3.6 | 1.93 | 1.82 | 1.06 | 1.04 | 1.04 | 0.045 | 1.33 | 12,2 | 14.5 | 61.9 | 0.46 | 0.25 | 0.44 | 8.0 |
| 3572 + 1/2 | 77.08 | 0.01 | 3.7 | 1.93 | 1.82 | 1.06 | 1.04 | 1.04 | 0.045 | 1.30 | 1,1 | 14.8 | 56.1 | 0.46 | 0.23 | 0.44 | 8.0 |
| 3573 | 77.04 | 0.01 | 3.8 | 1.91 | 1.82 | 1.05 | 1.02 | 1.02 | 0.047 | 1.34 | 1,1 | 15.1 | 54.0 | 0.46 | 0.28 | 0.44 | 8.0 |
| 3573 + 1/2 | 76.98 | 0.01 | 3.8 | 1.94 | 1.82 | 1.06 | 1.05 | 1.05 | 0.037 | 1.26 | 6,1 | 15.1 | 43.6 | 0.46 | 0.35 | 0.44 | 8.0 |
| 3574 | 76.90 | 0.01 | 3.7 | 1.91 | 1.82 | 1.05 | 1.03 | 1.03 | 0.045 | 1.34 | 1,1 | 15.5 | 47.7 | 0.46 | 0.31 | 0.44 | 8.0 |
| 3574 + 1/2 | 76.80 | 0.01 | 3.9 | 1.86 | 1.82 | 1.02 | 0.99 | 0.99 | 0.045 | 1.23 | 1,1 | 15.5 | 37.3 | 0.46 | 0.31 | 0.44 | 8.0 |
| 3575 | 76.69 | 0.00 | 3.7 | 1.89 | 1.82 | 1.04 | 1.05 | 1.04 | 0.028 | 1.26 | 5,1 | 16.7 | 65.0 | 0.46 | 0.16 | 0.45 | 8.0 |
| 3575 + 1/2 | 76.57 | 0.01 | 3.8 | 1.87 | 1.82 | 1.03 | 1.04 | 1.03 | 0.026 | 1.21 | 14,3 | 16.8 | 62.6 | 0.46 | 0.15 | 0.45 | 8.0 |
| 3576 | 76.45 | 0.01 | 3.8 | 1.83 | 1.83 | 1.00 | 1.01 | 1.00 | 0.034 | 1.26 | 5,1 | 17.1 | 62.8 | 0.45 | 0.14 | 0.44 | 8.7 |
| 3576 + 1/2 | 76.31 | 0.00 | 3.8 | 1.82 | 1.82 | 1.00 | 1.01 | 1.00 | 0.021 | 1.32 | 5,1 | 17.2 | 65.1 | 0.45 | 0.14 | 0.44 | 8.7 |
| 3577 | 76.17 | 0.01 | 3.9 | 1.82 | 1.81 | 1.01 | 1.03 | 1.01 | 0.026 | 1.27 | 5,1 | 17.1 | 63.3 | 0.45 | 0.17 | 0.44 | 8.6 |
| 3577 + 1/2 | 76.01 | 0.01 | 3.8 | 1.79 | 1.78 | 1.00 | 0.96 | 0.96 | 0.047 | 1.28 | 13,8 | 17.1 | 60.1 | 0.46 | 0.19 | 0.44 | 8.0 |
| 3578 | 75.84 | 0.01 | 3.8 | 1.75 | 1.76 | 0.99 | 1.00 | 0.99 | 0.035 | 1.32 | 5,1 | 18.8 | 56.7 | 0.46 | 0.16 | 0.45 | 8.6 |
| 3578 + 1/2 | 75.64 | 0.00 | 3.8 | 1.73 | 1.72 | 1.01 | 1.02 | 1.01 | 0.036 | 1.32 | 13,8 | 18.1 | 56.8 | 0.46 | 0.16 | 0.45 | 8.6 |
| 3579 | 75.44 | 0.01 | 3.8 | 1.69 | 1.71 | 0.99 | 0.99 | 0.99 | 0.037 | 1.33 | 13,8 | 18.0 | 55.0 | 0.46 | 0.16 | 0.45 | 8.7 |
| 3579 + 1/2 | 75.23 | 0.01 | 3.7 | 1.68 | 1.67 | 1.01 | 1.00 | 1.00 | 0.024 | 1.28 | 13,8 | 17.7 | 53.1 | 0.46 | 0.17 | 0.45 | 8.6 |
| 3580 | 75.00 | 0.01 | 3.8 | 1.66 | 1.66 | 1.00 | 1.00 | 1.00 | 0.023 | 1.27 | 13,8 | 17.4 | 54.8 | 0.46 | 0.17 | 0.45 | 8.7 |
| 3580 + 1/2 | 74.75 | 0.01 | 3.9 | 1.63 | 1.64 | 0.99 | 0.97 | 0.97 | 0.029 | 1.26 | 14,2 | 17.3 | 55.4 | 0.46 | 0.16 | 0.45 | 8.6 |
| 3581 | 74.49 | 0.01 | 4.0 | 1.61 | 1.63 | 0.99 | 0.95 | 0.95 | 0.043 | 1.23 | 13,1 | 17.1 | 53.7 | 0.46 | 0.15 | 0.45 | 8.6 |
| 3581 + 1/2 | 74.22 | 0.00 | 3.8 | 1.63 | 1.62 | 1.01 | 1.00 | 1.00 | 0.025 | 1.20 | 0,5 | 16.9 | 51.5 | 0.46 | 0.14 | 0.45 | 8.0 |
| 3582 | 73.94 | 0.01 | 3.8 | 1.62 | 1.61 | 1.01 | 1.03 | 1.01 | 0.020 | 1.20 | 0,5 | 16.7 | 51.3 | 0.46 | 0.14 | 0.45 | 8.5 |
| 3582 + 1/2 | 73.64 | 0.00 | 3.9 | 1.60 | 1.60 | 1.00 | 1.00 | 1.00 | 0.029 | 1.25 | 12,0 | 16.6 | 54.0 | 0.46 | 0.14 | 0.45 | 8.5 |
| 3583 | 73.35 | 0.00 | 3.9 | 1.60 | 1.60 | 1.00 | 1.00 | 1.00 | 0.024 | 1.29 | 0,8 | 16.2 | 53.0 | 0.46 | 0.13 | 0.45 | 8.5 |
| 3583 + 1/2 | 73.05 | 0.01 | 3.9 | 1.59 | 1.59 | 1.00 | 1.00 | 1.00 | 0.030 | 1.26 | 5,2 | 16.1 | 55.3 | 0.46 | 0.14 | 0.45 | 8.5 |
| 3584 | 72.74 | 0.00 | 3.9 | 1.59 | 1.59 | 1.00 | 1.00 | 1.00 | 0.023 | 1.24 | 0,5 | 16.2 | 51.6 | 0.47 | 0.13 | 0.46 | 8.5 |
| 3584 + 1/2 | 72.41 | 0.01 | 3.9 | 1.58 | 1.58 | 1.00 | 1.00 | 1.00 | 0.020 | 1.30 | 9,2 | 16.0 | 49.8 | 0.47 | 0.13 | 0.46 | 8.5 |
| 3585 | 72.08 | 0.00 | 4.0 | 1.58 | 1.57 | 1.01 | 1.00 | 1.00 | 0.017 | 1.25 | 7,2 | 15.6 | 50.0 | 0.47 | 0.13 | 0.46 | 8.5 |
| 3585 + 1/2 | 71.74 | 0.00 | 4.0 | 1.56 | 1.57 | 1.00 | 1.00 | 1.00 | 0.017 | 1.33 | 14,3 | 15.3 | 49.8 | 0.46 | 0.13 | 0.45 | 8.5 |
| 3586 | 71.40 | 0.00 | 4.0 | 1.54 | 1.56 | 0.99 | 0.97 | 0.97 | 0.028 | 1.21 | 9,2 | 14.9 | 50.6 | 0.46 | 0.12 | 0.45 | 8.2 |
| 3586 + 1/2 | 71.04 | 0.00 | 3.9 | 1.55 | 1.54 | 1.01 | 1.02 | 1.01 | 0.012 | 1.24 | 0,7 | 14.8 | 49.4 | 0.46 | 0.12 | 0.45 | 8.5 |
| 3587 | 70.69 | 0.00 | 3.9 | 1.54 | 1.54 | 1.00 | 0.98 | 0.98 | 0.027 | 1.43 | 14,3 | 15.1 | 49.6 | 0.46 | 0.12 | 0.45 | 8.0 |
| 3587 + 1/2 | 70.34 | 0.00 | 4.0 | 1.52 | 1.54 | 0.99 | 1.02 | 0.99 | 0.014 | 1.20 | 2,8 | 15.3 | 47.6 | 0.46 | 0.12 | 0.45 | 8.0 |
| 3588 | 69.98 | 0.00 | 4.0 | 1.53 | 1.53 | 1.00 | 1.00 | 1.00 | 0.021 | 1.22 | 15,6 | 15.5 | 45.1 | 0.45 | 0.12 | 0.44 | 8.0 |
| 3588 + 1/2 | 69.62 | 0.00 | 3.9 | 1.54 | 1.52 | 1.01 | 0.99 | 0.99 | 0.027 | 1.40 | 14,3 | 15.6 | 46.0 | 0.45 | 0.11 | 0.44 | 8.0 |
| 3589 | 69.26 | 0.00 | 4.0 | 1.51 | 1.52 | 0.99 | 0.99 | 0.99 | 0.032 | 1.21 | 14,3 | 15.7 | 41.6 | 0.44 | 0.16 | 0.43 | 8.0 |
| 3589 + 1/2 | 68.90 | 0.00 | 3.9 | 1.51 | 1.50 | 1.01 | 1.00 | 1.00 | 0.016 | 1.25 | 13,2 | 15.6 | 44.8 | 0.44 | 0.16 | 0.43 | 8.0 |
| 3590 | 68.55 | 0.00 | 3.9 | 1.49 | 1.50 | 1.00 | 1.00 | 1.00 | 0.011 | 1.38 | 14,3 | 15.5 | 47.2 | 0.44 | 0.17 | 0.42 | 8.0 |
| 3590 + 1/2 | 68.20 | 0.00 | 4.0 | 1.48 | 1.49 | 0.99 | 1.04 | 0.99 | 0.004 | 1.23 | 13,0 | 15.4 | 46.9 | 0.42 | 0.08 | 0.41 | 8.0 |
| 3591 | 67.84 | 0.00 | 3.9 | 1.49 | 1.49 | 1.00 | 1.03 | 1.00 | 0.005 | 1.35 | 5,3 | 15.1 | 45.8 | 0.42 | 0.07 | 0.40 | 8.0 |
| 3591 + 1/2 | 67.49 | 0.00 | 3.9 | 1.49 | 1.48 | 1.00 | 1.01 | 1.00 | 0.018 | 1.20 | 13,2 | 14.9 | 40.7 | 0.42 | 0.07 | 0.40 | 8.0 |
| 3592 | 67.14 | 0.00 | 4.0 | 1.48 | 1.48 | 0.99 | 1.00 | 0.99 | 0.011 | 1.25 | 6,0 | 14.7 | 40.1 | 0.41 | 0.06 | 0.39 | 8.0 |
| 3592 + 1/2 | 66.80 | 0.01 | 4.0 | 1.48 | 1.48 | 1.00 | 1.01 | 1.00 | 0.014 | 1.30 | 1,0 | 14.4 | 41.2 | 0.41 | 0.06 | 0.39 | 8.0 |
| 3593 | 66.47 | 0.00 | 3.9 | 1.45 | 1.48 | 0.98 | 1.00 | 0.98 | 0.011 | 1.31 | 0,1 | 13.7 | 43.9 | 0.40 | 0.06 | 0.38 | 8.4 |
| 3593 + 1/2 | 66.15 | 0.00 | 3.9 | 1.49 | 1.45 | 1.03 | 0.99 | 0.99 | 0.017 | 1.36 | 12,8 | 13.3 | 39.3 | 0.40 | 0.06 | 0.38 | 8.4 |
| 3594 | 65.83 | 0.00 | 3.9 | 1.45 | 1.44 | 1.01 | 1.00 | 1.00 | 0.017 | 1.42 | 12,8 | 12.9 | 38.5 | 0.40 | 0.06 | 0.38 | 8.4 |
| 3594 + 1/2 | 65.51 | 0.00 | 3.8 | 1.43 | 1.43 | 1.00 | 1.01 | 1.00 | 0.011 | 1.31 | 0,1 | 12.7 | 39.6 | 0.39 | 0.06 | 0.38 | 8.5 |
| 3595 | 65.21 | 0.00 | 4.0 | 1.42 | 1.43 | 1.00 | 1.01 | 1.00 | 0.013 | 1.41 | 12,8 | 12.6 | 40.0 | 0.39 | 0.06 | 0.37 | 8.5 |
| 3595 + 1/2 | 64.91 | 0.00 | 3.8 | 1.42 | 1.41 | 1.00 | 0.97 | 0.97 | 0.019 | 1.29 | 6,8 | 12.7 | 41.4 | 0.39 | 0.06 | 0.37 | 8.5 |
| 3596 | 64.62 | 0.01 | 3.8 | 1.38 | 1.41 | 0.98 | 0.98 | 0.98 | 0.022 | 1.29 | 8,0 | 12.9 | 39.6 | 0.39 | 0.06 | 0.37 | 8.5 |
| 3596 + 1/2 | 64.35 | 0.01 | 3.9 | 1.36 | 1.40 | 0.97 | 0.99 | 0.97 | 0.017 | 1.32 | 12,8 | 12.9 | 34.2 | 0.39 | 0.06 | 0.37 | 8.5 |
| 3597 | 64.11 | 0.01 | 3.9 | 1.41 | 1.36 | 1.03 | 1.04 | 1.03 | 0.022 | 1.36 | 15,7 | 13.0 | 34.5 | 0.39 | 0.07 | 0.37 | 8.6 |
| 3597 + 1/2 | 63.89 | 0.00 | 3.9 | 1.35 | 1.36 | 0.99 | 0.99 | 0.99 | 0.021 | 1.43 | 12,0 | 13.1 | 31.7 | 0.39 | 0.08 | 0.37 | 8.5 |
| 3598 | 63.67 | 0.01 | 3.9 | 1.36 | 1.36 | 1.00 | 0.94 | 0.94 | 0.051 | 1.41 | 4,8 | 13.1 | 31.8 | 0.39 | 0.10 | 0.37 | 8.0 |
| 3598 + 1/2 | 63.46 | 0.01 | 3.9 | 1.35 | 1.36 | 0.99 | 1.02 | 0.99 | 0.025 | 1.30 | 7,7 | 13.1 | 30.6 | 0.39 | 0.10 | 0.37 | 8.0 |
| 3599 | 63.26 | 0.00 | 4.0 | 1.36 | 1.35 | 1.01 | 1.06 | 1.01 | 0.029 | 1.35 | 12,1 | 13.2 | 27.7 | 0.39 | 0.10 | 0.37 | 8.0 |
| 3599 + 1/2 | 63.07 | 0.01 | 3.9 | 1.36 | 1.35 | 1.01 | 0.97 | 0.97 | 0.060 | 1.34 | 6,5 | 13.1 | 28.9 | 0.39 | 0.10 | 0.36 | 8.0 |
| 3600 | 62.90 | 0.01 | 4.1 | 1.34 | 1.35 | 0.99 | 0.97 | 0.97 | 0.058 | 1.36 | 6,7 | 12.8 | 26.4 | 0.38 | 0.10 | 0.36 | 8.0 |
| 3600 + 1/2 | 62.72 | 0.00 | 3.9 | 1.32 | 1.34 | 0.98 | 0.97 | 0.97 | 0.059 | 1.34 | 13,8 | 12.8 | 26.4 | 0.38 | 0.10 | 0.36 | 8.0 |
| 3601 | 62.54 | 0.00 | 4.1 | 1.32 | 1.34 | 0.98 | 0.97 | 0.97 | 0.060 | 1.30 | 5,8 | 12.8 | 26.8 | 0.38 | 0.10 | 0.35 | 8.0 |
| 3601 + 1/2 | 62.37 | 0.00 | 4.0 | 1.29 | 1.34 | 0.96 | 0.98 | 0.96 | 0.056 | 1.36 | 13,8 | 12.8 | 27.1 | 0.38 | 0.11 | 0.35 | 8.0 |
| 3602 | 62.20 | 0.00 | 4.0 | 1.31 | 1.34 | 0.98 | 0.98 | 0.98 | 0.063 | 1.19 | 5,8 | 12.7 | 25.7 | 0.37 | 0.10 | 0.35 | 8.7 |
| 3602 + 1/2 | 62.03 | 0.00 | 4.1 | 1.31 | 1.34 | 0.98 | 0.97 | 0.97 | 0.060 | 1.49 | 6,7 | 12.6 | 22.4 | 0.37 | 0.10 | 0.35 | 8.7 |
| 3603 | 61.87 | 0.00 | 3.9 | 1.31 | 1.33 | 0.98 | 0.97 | 0.97 | 0.058 | 1.42 | 8,8 | 12.5 | 20.0 | 0.37 | 0.10 | 0.35 | 8.8 |
| 3603 + 1/2 | 61.72 | 0.00 | 4.1 | 1.31 | 1.33 | 0.98 | 1.00 | 0.98 | 0.050 | 1.28 | 14,0 | 12.4 | 19.6 | 0.37 | 0.10 | 0.35 | 8.7 |
| 3604 | 61.56 | 0.00 | 3.9 | 1.33 | 1.33 | 1.00 | 1.00 | 1.00 | 0.048 | 1.28 | 7,6 | 12.2 | 19.2 | 0.37 | 0.10 | 0.35 | 8.7 |
| 3604 + 1/2 | 61.42 | 0.00 | 4.0 | 1.34 | 1.32 | 1.01 | 0.99 | 0.99 | 0.051 | 1.28 | 4,8 | 12.0 | 19.4 | 0.37 | 0.10 | 0.35 | 8.7 |
| 3605 | 61.27 | 0.00 | 4.0 | 1.33 | 1.32 | 1.01 | 1.01 | 1.01 | 0.047 | 1.34 | 10,1 | 12.0 | 19.0 | 0.37 | 0.10 | 0.35 | 8.7 |
| 3605 + 1/2 | 61.13 | 0.00 | 4.1 | 1.31 | 1.32 | 0.99 | 0.96 | 0.96 | 0.057 | 1.22 | 13,8 | 11.8 | 18.7 | 0.37 | 0.10 | 0.35 | 8.7 |
| 3606 | 60.97 | 0.00 | 3.9 | 1.32 | 1.32 | 1.00 | 1.01 | 1.00 | 0.040 | 1.27 | 14,4 | 11.7 | 18.6 | 0.37 | 0.10 | 0.35 | 8.7 |
| 3606 + 1/2 | 60.82 | 0.00 | 4.0 | 1.33 | 1.32 | 1.01 | 1.04 | 1.01 | 0.034 | 1.28 | 6,6 | 11.6 | 18.5 | 0.37 | 0.11 | 0.35 | 8.7 |
| 3607 | 60.67 | 0.00 | 4.1 | 1.34 | 1.32 | 1.02 | 1.00 | 1.00 | 0.054 | 1.26 | 14,8 | 11.6 | 18.9 | 0.37 | 0.11 | 0.35 | 8.7 |
| 3607 + 1/2 | 60.51 | 0.00 | 4.2 | 1.37 | 1.31 | 1.04 | 0.96 | 0.96 | 0.080 | 1.47 | 14,8 | 11.4 | 18.4 | 0.37 | 0.11 | 0.35 | 8.6 |
| 3608 | 60.36 | 0.00 | 4.1 | 1.32 | 1.31 | 1.00 | 0.99 | 0.99 | 0.051 | 1.25 | 7,8 | 11.1 | 18.6 | 0.38 | 0.10 | 0.36 | 8.6 |
| 3608 + 1/2 | 60.20 | 0.00 | 4.1 | 1.34 | 1.31 | 1.02 | 0.99 | 0.99 | 0.054 | 1.31 | 4,8 | 10.8 | 18.7 | 0.38 | 0.11 | 0.36 | 8.6 |
| 3609 | 60.05 | 0.00 | 4.0 | 1.34 | 1.31 | 1.03 | 1.04 | 1.03 | 0.035 | 1.21 | 5,2 | 10.8 | 19.1 | 0.38 | 0.11 | 0.36 | 8.7 |
| 3609 + 1/2 | 59.90 | 0.01 | 4.2 | 1.33 | 1.31 | 1.02 | 0.92 | 0.92 | 0.069 | 1.30 | 0,6 | 10.6 | 19.4 | 0.38 | 0.11 | 0.36 | 8.7 |
| 3610 | 59.77 | 0.00 | 4.0 | 1.30 | 1.31 | 0.99 | 1.04 | 0.99 | 0.027 | 1.33 | 0,6 | 10.4 | 18.9 | 0.39 | 0.11 | 0.36 | 8.7 |
| 3610 + 1/2 | 59.64 | 0.00 | 4.0 | 1.31 | 1.31 | 1.00 | 0.96 | 0.96 | 0.055 | 1.24 | 5,2 | 10.4 | 19.4 | 0.39 | 0.11 | 0.36 | 8.7 |
| 3611 | 59.52 | 0.00 | 3.8 | 1.31 | 1.31 | 1.00 | 1.05 | 1.00 | 0.024 | 1.35 | 12,8 | 10.0 | 19.1 | 0.39 | 0.11 | 0.36 | 8.6 |
| 3611 + 1/2 | 59.41 | 0.00 | 3.8 | 1.31 | 1.31 | 1.00 | 1.07 | 1.00 | 0.022 | 1.33 | 10,8 | 10.0 | 19.5 | 0.39 | 0.11 | 0.36 | 8.7 |
| 3612 | 59.31 | 0.00 | 4.2 | 1.32 | 1.31 | 1.01 | 0.93 | 0.93 | 0.077 | 1.25 | 9,2 | 9.8 | 19.8 | 0.39 | 0.11 | 0.36 | 8.7 |
| 3612 + 1/2 | 59.22 | 0.00 | 3.7 | 1.31 | 1.30 | 1.01 | 1.07 | 1.01 | 0.019 | 1.40 | 13,8 | 9.6 | 19.4 | 0.40 | 0.11 | 0.38 | 8.7 |
| 3613 | 59.13 | 0.00 | 3.6 | 1.31 | 1.29 | 1.02 | 1.06 | 1.02 | 0.027 | 1.23 | 5,0 | 9.2 | 19.2 | 0.40 | 0.11 | 0.38 | 8.7 |
| 3613 + 1/2 | 59.06 | 0.00 | 3.7 | 1.27 | 1.29 | 0.99 | 1.07 | 0.99 | 0.014 | 1.19 | 7,0 | 9.1 | 19.3 | 0.40 | 0.11 | 0.38 | 8.6 |
| 3614 | 58.99 | 0.00 | 3.6 | 1.27 | 1.28 | 0.99 | 1.06 | 0.99 | 0.016 | 1.30 | 13,8 | 9.1 | 19.2 | 0.41 | 0.11 | 0.38 | 8.6 |
| 3614 + 1/2 | 58.93 | 0.00 | 3.7 | 1.26 | 1.27 | 1.00 | 0.99 | 0.99 | 0.042 | 1.55 | 3,7 | 9.5 | 19.1 | 0.41 | 0.11 | 0.38 | 8.6 |
| 3615 | 58.88 | 0.01 | 3.7 | 1.28 | 1.26 | 1.02 | 1.00 | 1.00 | 0.044 | 1.31 | 15,8 | 9.2 | 18.6 | 0.41 | 0.11 | 0.38 | 8.7 |
| 3615 + 1/2 | 58.84 | 0.00 | 3.5 | 1.26 | 1.25 | 1.01 | 1.06 | 1.01 | 0.020 | 1.30 | 15,7 | 9.4 | 18.8 | 0.41 | 0.11 | 0.39 | 8.6 |
| 3616 | 58.80 | 0.00 | 3.4 | 1.24 | 1.25 | 0.99 | 1.07 | 0.99 | 0.010 | 1.19 | 6,7 | 8.9 | 18.7 | 0.41 | 0.11 | 0.39 | 8.5 |
| 3616 + 1/2 | 58.77 | 0.01 | 3.4 | 1.24 | 1.24 | 1.00 | 1.04 | 1.00 | 0.014 | 1.24 | 9,1 | 8.6 | 18.8 | 0.41 | 0.11 | 0.39 | 8.5 |
| 3617 | 58.76 | 0.00 | 3.3 | 1.23 | 1.24 | 0.99 | 1.03 | 0.99 | 0.017 | 1.33 | 14,8 | 8.4 | 17.9 | 0.41 | 0.10 | 0.39 | 8.5 |
| 3617 + 1/2 | 58.75 | 0.01 | 3.3 | 1.25 | 1.21 | 1.03 | 1.08 | 1.03 | 0.017 | 1.32 | 6,8 | 7.9 | 17.9 | 0.42 | 0.10 | 0.39 | 8.5 |
| 3618 | 58.75 | 0.01 | 3.2 | 1.18 | 1.21 | 0.98 | 1.04 | 0.98 | 0.008 | 1.35 | 9,1 | 7.9 | 17.6 | 0.42 | 0.10 | 0.39 | 8.5 |
| 3618 + 1/2 | 58.76 | 0.00 | 3.5 | 1.20 | 1.17 | 1.02 | 0.92 | 0.92 | 0.050 | 1.65 | 15,7 | 7.6 | 17.1 | 0.42 | 0.10 | 0.39 | 8.5 |
| 3619 | 58.78 | 0.00 | 3.1 | 1.16 | 1.17 | 0.99 | 1.03 | 0.99 | 0.010 | 1.64 | 15,7 | 7.3 | 16.8 | 0.43 | 0.08 | 0.40 | 8.5 |
| 3619 + 1/2 | 58.81 | 0.00 | 3.1 | 1.16 | 1.14 | 1.02 | 1.05 | 1.02 | 0.011 | 1.33 | 9,1 | 7.0 | 15.9 | 0.43 | 0.08 | 0.40 | 8.4 |
| 3620 | 58.85 | 0.01 | 3.0 | 1.12 | 1.14 | 0.99 | 1.04 | 0.99 | 0.006 | 1.36 | 15,7 | 6.6 | 15.0 | 0.43 | 0.07 | 0.40 | 8.4 |
| 3620 + 1/2 | 58.90 | 0.00 | 3.0 | 1.09 | 1.12 | 0.98 | 1.03 | 0.98 | 0.008 | 1.66 | 15,7 | 6.4 | 14.3 | 0.43 | 0.06 | 0.40 | 8.4 |
| 3621 | 58.96 | 0.00 | 2.9 | 1.11 | 1.08 | 1.03 | 1.02 | 1.02 | 0.013 | 1.88 | 15,7 | 6.0 | 13.2 | 0.44 | 0.06 | 0.41 | 8.4 |
| 3621 + 1/2 | 59.02 | 0.00 | 2.8 | 1.07 | 1.08 | 0.99 | 1.01 | 0.99 | 0.007 | 1.33 | 15,7 | 5.6 | 12.1 | 0.44 | 0.06 | 0.41 | 8.4 |
| 3622 | 59.09 | 0.00 | 2.8 | 1.06 | 1.06 | 1.00 | 1.03 | 1.00 | 0.008 | 1.90 | 15,7 | 5.3 | 10.6 | 0.44 | 0.05 | 0.41 | 8.5 |
| 3622 + 1/2 | 59.17 | 0.00 | 2.8 | 1.06 | 1.03 | 1.03 | 0.94 | 0.94 | 0.033 | 1.63 | 15,7 | 4.7 | 9.4 | 0.44 | 0.03 | 0.41 | 8.3 |
| 3623 | 59.26 | 0.00 | 2.5 | 1.00 | 1.02 | 0.98 | 1.03 | 0.98 | 0.004 | 1.53 | 15,7 | 4.6 | 8.4 | 0.47 | 0.03 | 0.44 | 8.1 |
| 3623 + 1/2 | 59.35 | 0.00 | 2.4 | 0.97 | 0.97 | 1.00 | 1.03 | 1.00 | 0.000 | 1.37 | 15,7 | 4.6 | 8.1 | 0.47 | 0.03 | 0.44 | 8.1 |
| 3624 | 59.45 | 0.00 | 2.3 | 0.94 | 0.95 | 1.00 | 1.00 | 1.00 | 0.003 | 1.23 | 8,5 | 4.8 | 7.6 | 0.47 | 0.03 | 0.44 | 8.3 |
| 3624 + 1/2 | 59.56 | 0.00 | 2.2 | 0.92 | 0.91 | 1.01 | 1.02 | 1.01 | 0.000 | 1.32 | 9,6 | 5.0 | 7.7 | 0.47 | 0.03 | 0.45 | 8.3 |
| 3625 | 59.67 | 0.00 | 2.1 | 0.88 | 0.88 | 1.00 | 1.00 | 1.00 | 0.001 | 1.42 | 3,3 | 5.2 | 7.7 | 0.48 | 0.03 | 0.45 | 8.3 |
| 3625 + 1/2 | 59.79 | 0.00 | 2.0 | 0.84 | 0.86 | 0.98 | 0.98 | 0.98 | 0.001 | 1.27 | 6,4 | 5.4 | 7.1 | 0.48 | 0.03 | 0.45 | 8.4 |
| 3626 | 59.92 | 0.01 | 1.8 | 0.83 | 0.83 | 1.01 | 1.01 | 1.01 | 0.000 | 1.26 | 3,6 | 5.6 | 9.6 | 0.48 | 0.03 | 0.45 | 8.5 |
| 3626 + 1/2 | 60.06 | 0.00 | 1.6 | 0.82 | 0.80 | 1.02 | 1.02 | 1.02 | 0.000 | 1.39 | 5,6 | 5.8 | 9.4 | 0.48 | 0.03 | 0.45 | 8.4 |
| 3627 | 60.20 | 0.00 | 1.4 | 0.77 | 0.77 | 1.00 | 1.00 | 1.00 | 0.000 | 1.54 | 6,6 | 6.0 | 9.2 | 0.48 | 0.04 | 0.45 | 8.0 |
| 3627 + 1/2 | 60.35 | 0.01 | 1.2 | 0.73 | 0.75 | 0.97 | 0.97 | 0.97 | 0.000 | 1.71 | 6,6 | 6.1 | 9.2 | 0.48 | 0.04 | 0.45 | 8.4 |
| 3628 | 60.51 | 0.00 | 1.1 | 0.69 | 0.73 | 0.94 | 0.94 | 0.94 | 0.000 | 1.67 | 6,6 | 6.2 | 8.6 | 0.48 | 0.04 | 0.45 | 8.0 |
| 3628 + 1/2 | 60.68 | 0.00 | 1.1 | 0.68 | 0.73 | 0.94 | 0.94 | 0.94 | 0.001 | 1.47 | 8,6 | 6.3 | 7.7 | 0.48 | 0.04 | 0.45 | 8.0 |
| 3629 last | 60.85 | 0.01 | 1.2 | 0.68 | 0.73 | 0.94 | 0.94 | 0.94 | 0.001 | 1.23 | 10,8 | 6.4 | 8.3 | 0.48 | 0.05 | 0.45 | 8.0 |
| 3629 + 1/2 | 61.04 | 0.00 | 1.4 | 0.72 | 0.73 | 0.99 | 0.98 | 0.98 | 0.002 | 1.50 | 13,8 | 6.5 | 8.2 | 0.48 | 0.05 | 0.45 | 8.0 |
| 3630 | 61.24 | 0.00 | 1.5 | 0.71 | 0.73 | 0.97 | 0.97 | 0.97 | 0.001 | 1.33 | 15,5 | 6.6 | 8.1 | 0.48 | 0.05 | 0.46 | 8.0 |
| 3630 + 1/2 | 61.44 | 0.00 | 1.5 | 0.73 | 0.73 | 1.00 | 1.00 | 1.00 | 0.001 | 1.41 | 6,8 | 6.5 | 7.7 | 0.49 | 0.05 | 0.46 | 8.0 |
| 3631 | 61.65 | 0.00 | 1.5 | 0.72 | 0.73 | 0.98 | 0.98 | 0.98 | 0.001 | 1.49 | 12,8 | 6.5 | 7.9 | 0.49 | 0.05 | 0.46 | 8.0 |
| 3631 + 1/2 | 61.85 | 0.00 | 1.5 | 0.72 | 0.73 | 0.99 | 0.99 | 0.99 | 0.000 | 1.20 | 15,5 | 6.5 | 8.2 | 0.49 | 0.05 | 0.46 | 8.0 |
| 3632 | 62.06 | 0.00 | 1.5 | 0.72 | 0.73 | 0.98 | 0.98 | 0.98 | 0.002 | 1.17 | 13,8 | 6.5 | 8.1 | 0.49 | 0.06 | 0.46 | 8.0 |
| 3632 + 1/2 | 62.26 | 0.00 | 1.5 | 0.73 | 0.73 | 1.00 | 1.00 | 1.00 | 0.002 | 1.41 | 15,8 | 6.5 | 8.0 | 0.49 | 0.06 | 0.46 | 8.0 |
| 3633 | 62.47 | 0.00 | 1.5 | 0.72 | 0.73 | 0.99 | 0.99 | 0.99 | 0.001 | 1.26 | 6,8 | 6.5 | 7.9 | 0.49 | 0.06 | 0.47 | 8.0 |
| 3633 + 1/2 | 62.68 | 0.00 | 1.5 | 0.73 | 0.73 | 1.00 | 1.00 | 1.00 | 0.003 | 1.36 | 15,8 | 6.5 | 8.5 | 0.49 | 0.06 | 0.47 | 8.0 |
| 3634 | 62.89 | 0.00 | 1.5 | 0.72 | 0.73 | 0.98 | 0.98 | 0.98 | 0.005 | 1.28 | 6,7 |  |  |  |  |  |  |
| 3634 + 1/2 | 63.10 | 0.00 | 1.5 | 0.72 | 0.73 | 0.99 | 0.99 | 0.99 | 0.001 | 1.18 | 15,8 |  |  |  |  |  |  |
| 3635 | 63.31 | 0.00 | 1.4 | 0.73 | 0.73 | 1.00 | 1.00 | 1.00 | 0.002 | 1.21 | 9,8 |  |  |  |  |  |  |
| 3635 + 1/2 | 63.52 | 0.00 | 1.5 | 0.73 | 0.73 | 1.00 | 1.00 | 1.00 | 0.002 | 1.15 | 13,7 |  |  |  |  |  |  |
| 3636 | 63.73 | 0.00 | 1.4 | 0.73 | 0.73 | 1.01 | 1.01 | 1.01 | 0.000 | 1.16 | 15,8 |  |  |  |  |  |  |
| 3636 + 1/2 | 63.94 | 0.00 | 1.5 | 0.73 | 0.73 | 1.00 | 1.00 | 1.00 | 0.008 | 1.33 | 15,8 |  |  |  |  |  |  |
| 3637 | 64.15 | 0.00 | 1.5 | 0.74 | 0.73 | 1.00 | 1.01 | 1.00 | 0.003 | 1.22 | 9,8 |  |  |  |  |  |  |
| 3637 + 1/2 | 64.37 | 0.00 | 1.5 | 0.74 | 0.73 | 1.01 | 1.00 | 1.00 | 0.006 | 1.20 | 14,8 |  |  |  |  |  |  |
| 3638 | 64.58 | 0.00 | 1.5 | 0.72 | 0.74 | 0.98 | 0.98 | 0.98 | 0.000 | 1.18 | 14,5 |  |  |  |  |  |  |
| 3638 + 1/2 | 64.80 | 0.00 | 1.5 | 0.73 | 0.74 | 0.99 | 0.99 | 0.99 | 0.000 | 1.23 | 9,8 |  |  |  |  |  |  |
| 3639 | 65.01 | 0.00 | 1.5 | 0.74 | 0.74 | 1.00 | 1.00 | 1.00 | 0.004 | 1.13 | 4,5 |  |  |  |  |  |  |
| 3639 + 1/2 | 65.23 | 0.00 | 1.5 | 0.74 | 0.74 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 12,8 |  |  |  |  |  |  |
| 3640 | 65.45 | 0.00 | 1.4 | 0.74 | 0.74 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 9,8 |  |  |  |  |  |  |
| 3640 + 1/2 | 65.67 | 0.00 | 1.5 | 0.75 | 0.74 | 1.00 | 1.00 | 1.00 | 0.000 | 1.35 | 14,8 |  |  |  |  |  |  |
| 3641 | 65.88 | 0.00 | 1.5 | 0.75 | 0.75 | 1.00 | 1.00 | 1.00 | 0.001 | 1.09 | 4,2 |  |  |  |  |  |  |
| 3641 + 1/2 | 66.10 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### dive, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.03 from frame 3612 + 1/2 to the next, limit 1.2.
Largest pop score of one block: 2.37 from frame 3548 + 1/2 to the next, block column 11 row 5 from the top left, shown, not judged.
Largest change in place: 14.7 from frame 3585 to 8 film frames later, most at pixel 916, 808, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 3630 to 3641 + 1/2): change 6.9; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.102 from frame 3595 + 1/2 to the next, most at pixel 1218, 362, a patch of 104 by 140 px; 0 of 227 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 228 rows, which says nothing of them, quiet or not: frame 3641 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 3574 in /home/user/workspace/work/p6/ht9/01/saturn-dive-p1of2-pops-full.png, frame 3576 + 1/2 in /home/user/workspace/work/p6/ht9/01/saturn-dive-p1of2-pops-full.png, frame 3595 + 1/2 in /home/user/workspace/work/p6/ht9/02/saturn-dive-p2of2-pops-full.png, frame 3608 in /home/user/workspace/work/p6/ht9/02/saturn-dive-p2of2-pops-full.png, frame 3612 + 1/2 in /home/user/workspace/work/p6/ht9/02/saturn-dive-p2of2-pops-full.png.

With the carry at the full size the dive has no number over its limit.

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3528 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 14,8 | 1.0 | 2.1 | 0.52 | 1.00 | 0.238 | 0.239 | 0.954 | 0.145 | 1042,342 | 212 by 300 |
| 3528 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.004 | 1.10 | 2,4 | 1.0 | 1.9 | 0.52 | 0.99 | 0.239 | 0.238 | 0.958 | 0.145 | 1022,446 | 124 by 92 |
| 3529 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 4,8 | 1.0 | 2.0 | 0.52 | 1.00 | 0.236 | 0.238 | 0.945 | 0.146 | 842,574 | 124 by 324 |
| 3529 + 1/2 | 0.5 | 0.27 | 0.27 | 1.01 | 1.01 | 1.01 | 0.000 | 1.10 | 8,7 | 1.0 | 2.1 | 0.52 | 1.01 | 0.238 | 0.237 | 0.952 | 0.146 | 1054,282 | 180 by 200 |
| 3530 | 0.4 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 9,7 | 1.0 | 1.9 | 0.52 | 0.98 | 0.238 | 0.237 | 0.953 | 0.146 | 802,630 | 216 by 116 |
| 3530 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.001 | 1.11 | 9,7 | 1.0 | 2.1 | 0.52 | 1.00 | 0.235 | 0.238 | 0.941 | 0.146 | 1250,418 | 168 by 88 |
| 3531 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 4,8 | 1.0 | 1.8 | 0.52 | 1.00 | 0.240 | 0.238 | 0.958 | 0.146 | 1030,286 | 104 by 112 |
| 3531 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 4,8 | 1.0 | 1.9 | 0.52 | 1.00 | 0.239 | 0.237 | 0.955 | 0.146 | 982,626 | 100 by 188 |
| 3532 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 11,3 | 1.0 | 1.9 | 0.52 | 0.99 | 0.238 | 0.239 | 0.951 | 0.146 | 990,458 | 176 by 184 |
| 3532 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 14,1 | 1.0 | 2.0 | 0.52 | 0.99 | 0.235 | 0.239 | 0.940 | 0.146 | 1258,562 | 76 by 96 |
| 3533 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 4,8 | 1.0 | 1.9 | 0.52 | 0.99 | 0.239 | 0.238 | 0.954 | 0.146 | 902,450 | 144 by 140 |
| 3533 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.001 | 1.09 | 10,0 | 1.0 | 1.9 | 0.52 | 1.00 | 0.239 | 0.239 | 0.956 | 0.146 | 978,502 | 88 by 156 |
| 3534 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.001 | 1.09 | 7,8 | 1.0 | 1.9 | 0.52 | 1.01 | 0.240 | 0.239 | 0.961 | 0.146 | 1006,498 | 208 by 240 |
| 3534 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 2,7 | 1.0 | 1.7 | 0.52 | 0.99 | 0.239 | 0.238 | 0.954 | 0.146 | 1002,454 | 72 by 64 |
| 3535 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 12,8 | 1.4 | 2.0 | 0.52 | 1.00 | 0.237 | 0.239 | 0.949 | 0.146 | 934,614 | 64 by 68 |
| 3535 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 13,5 | 2.0 | 2.9 | 0.52 | 1.00 | 0.238 | 0.238 | 0.951 | 0.146 | 966,542 | 176 by 88 |
| 3536 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 7,8 | 2.6 | 3.7 | 0.52 | 1.02 | 0.240 | 0.238 | 0.961 | 0.146 | 1194,386 | 144 by 180 |
| 3536 + 1/2 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 12,3 | 3.0 | 4.5 | 0.52 | 1.00 | 0.238 | 0.239 | 0.950 | 0.146 | 1098,334 | 80 by 76 |
| 3537 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 10,2 | 3.5 | 5.3 | 0.52 | 0.99 | 0.242 | 0.238 | 0.969 | 0.146 | 886,554 | 164 by 100 |
| 3537 + 1/2 | 0.5 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.06 | 3,1 | 3.6 | 5.7 | 0.52 | 0.99 | 0.237 | 0.239 | 0.950 | 0.147 | 758,582 | 112 by 96 |
| 3538 | 0.4 | 0.27 | 0.27 | 0.99 | 1.00 | 0.99 | 0.000 | 1.09 | 5,6 | 3.8 | 5.6 | 0.52 | 1.00 | 0.239 | 0.240 | 0.955 | 0.147 | 1058,438 | 360 by 164 |
| 3538 + 1/2 | 0.5 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.001 | 1.08 | 13,1 | 3.9 | 6.1 | 0.52 | 1.00 | 0.240 | 0.238 | 0.959 | 0.147 | 946,398 | 72 by 52 |
| 3539 | 0.5 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 13,5 | 3.9 | 6.1 | 0.52 | 0.98 | 0.241 | 0.239 | 0.962 | 0.147 | 930,586 | 128 by 164 |
| 3539 + 1/2 | 0.5 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 9,6 | 4.0 | 6.2 | 0.52 | 1.00 | 0.236 | 0.240 | 0.944 | 0.147 | 1258,454 | 52 by 80 |
| 3540 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.002 | 1.09 | 9,7 | 3.6 | 6.1 | 0.52 | 0.98 | 0.240 | 0.240 | 0.960 | 0.147 | 1034,430 | 92 by 112 |
| 3540 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 11,7 | 3.8 | 6.2 | 0.52 | 0.99 | 0.239 | 0.240 | 0.954 | 0.147 | 838,682 | 56 by 64 |
| 3541 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 9,8 | 4.0 | 6.1 | 0.52 | 1.00 | 0.241 | 0.239 | 0.962 | 0.147 | 1050,250 | 140 by 84 |
| 3541 + 1/2 | 0.5 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.001 | 1.14 | 12,6 | 3.9 | 6.0 | 0.52 | 1.00 | 0.240 | 0.238 | 0.960 | 0.147 | 1006,510 | 212 by 136 |
| 3542 | 0.5 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.002 | 1.39 | 10,6 | 3.8 | 6.1 | 0.52 | 1.00 | 0.238 | 0.240 | 0.951 | 0.147 | 1106,326 | 168 by 152 |
| 3542 + 1/2 | 0.5 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.76 | 12,5 | 3.5 | 5.2 | 0.52 | 0.99 | 0.237 | 0.239 | 0.948 | 0.147 | 1110,578 | 152 by 132 |
| 3543 | 0.5 | 0.29 | 0.28 | 1.02 | 1.02 | 1.02 | 0.002 | 2.06 | 11,6 | 3.1 | 4.8 | 0.51 | 1.00 | 0.239 | 0.238 | 0.957 | 0.147 | 954,506 | 132 by 224 |
| 3543 + 1/2 | 0.5 | 0.29 | 0.29 | 1.02 | 1.02 | 1.02 | 0.000 | 2.14 | 12,5 | 2.4 | 3.7 | 0.51 | 1.00 | 0.238 | 0.238 | 0.953 | 0.147 | 1198,474 | 212 by 288 |
| 3544 | 0.6 | 0.29 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 2.05 | 12,5 | 1.7 | 2.9 | 0.51 | 1.00 | 0.238 | 0.239 | 0.951 | 0.147 | 1034,438 | 244 by 240 |
| 3544 + 1/2 | 0.6 | 0.29 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 1.68 | 11,6 | 1.3 | 2.4 | 0.51 | 1.01 | 0.239 | 0.239 | 0.956 | 0.147 | 1006,502 | 192 by 136 |
| 3545 | 0.6 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.002 | 1.41 | 4,3 | 1.2 | 2.1 | 0.51 | 0.99 | 0.240 | 0.239 | 0.959 | 0.148 | 950,594 | 276 by 136 |
| 3545 + 1/2 | 0.6 | 0.29 | 0.29 | 0.98 | 0.98 | 0.98 | 0.000 | 1.40 | 11,5 | 1.3 | 2.1 | 0.51 | 1.00 | 0.239 | 0.239 | 0.957 | 0.148 | 890,534 | 112 by 100 |
| 3546 | 0.6 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.56 | 11,5 | 1.4 | 2.2 | 0.50 | 1.01 | 0.239 | 0.240 | 0.955 | 0.148 | 898,478 | 100 by 88 |
| 3546 + 1/2 | 0.6 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.87 | 11,5 | 1.5 | 2.4 | 0.50 | 1.00 | 0.241 | 0.240 | 0.965 | 0.148 | 1294,678 | 96 by 108 |
| 3547 | 0.7 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.002 | 2.00 | 11,5 | 1.4 | 2.7 | 0.50 | 1.00 | 0.242 | 0.240 | 0.969 | 0.148 | 870,638 | 288 by 228 |
| 3547 + 1/2 | 0.7 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.001 | 2.20 | 11,5 | 1.6 | 3.0 | 0.50 | 1.01 | 0.241 | 0.240 | 0.964 | 0.148 | 970,526 | 108 by 136 |
| 3548 | 0.8 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 2.33 | 11,5 | 1.8 | 3.1 | 0.50 | 0.99 | 0.240 | 0.240 | 0.959 | 0.149 | 1030,414 | 76 by 92 |
| 3548 + 1/2 | 0.7 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.002 | 2.37 | 11,5 | 1.9 | 3.5 | 0.50 | 1.00 | 0.239 | 0.240 | 0.956 | 0.149 | 950,398 | 192 by 352 |
| 3549 | 0.9 | 0.31 | 0.31 | 1.00 | 1.01 | 1.00 | 0.000 | 2.34 | 11,5 | 2.1 | 3.8 | 0.50 | 1.00 | 0.237 | 0.240 | 0.949 | 0.149 | 870,658 | 80 by 180 |
| 3549 + 1/2 | 0.9 | 0.31 | 0.31 | 0.99 | 0.99 | 0.99 | 0.001 | 2.37 | 11,5 | 2.3 | 4.1 | 0.50 | 0.99 | 0.240 | 0.239 | 0.960 | 0.149 | 1238,610 | 168 by 232 |
| 3550 | 0.9 | 0.31 | 0.31 | 1.01 | 1.01 | 1.01 | 0.000 | 2.10 | 11,5 | 2.3 | 4.3 | 0.50 | 0.99 | 0.239 | 0.240 | 0.958 | 0.149 | 950,302 | 92 by 92 |
| 3550 + 1/2 | 1.0 | 0.32 | 0.32 | 1.00 | 0.99 | 0.99 | 0.010 | 1.85 | 11,5 | 2.4 | 4.1 | 0.49 | 1.01 | 0.239 | 0.240 | 0.957 | 0.149 | 1006,502 | 248 by 148 |
| 3551 | 1.1 | 0.32 | 0.32 | 1.00 | 1.00 | 1.00 | 0.004 | 1.43 | 11,5 | 2.5 | 4.9 | 0.49 | 0.98 | 0.240 | 0.239 | 0.960 | 0.150 | 846,638 | 124 by 112 |
| 3551 + 1/2 | 1.1 | 0.33 | 0.32 | 1.00 | 1.00 | 1.00 | 0.008 | 1.13 | 4,6 | 2.7 | 5.2 | 0.50 | 1.01 | 0.239 | 0.240 | 0.957 | 0.150 | 1146,338 | 172 by 152 |
| 3552 | 1.2 | 0.33 | 0.33 | 0.99 | 0.99 | 0.99 | 0.009 | 1.18 | 0,4 | 2.7 | 5.3 | 0.50 | 1.00 | 0.240 | 0.240 | 0.959 | 0.150 | 1070,598 | 164 by 244 |
| 3552 + 1/2 | 1.3 | 0.34 | 0.33 | 1.01 | 1.01 | 1.01 | 0.000 | 1.19 | 8,7 | 3.2 | 5.7 | 0.49 | 1.00 | 0.240 | 0.240 | 0.960 | 0.150 | 1018,362 | 164 by 116 |
| 3553 | 1.3 | 0.34 | 0.34 | 0.99 | 1.00 | 0.99 | 0.000 | 1.20 | 0,4 | 3.0 | 5.7 | 0.49 | 0.99 | 0.241 | 0.240 | 0.966 | 0.151 | 970,542 | 84 by 116 |
| 3553 + 1/2 | 1.4 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.012 | 1.13 | 0,3 | 3.2 | 5.7 | 0.49 | 1.00 | 0.238 | 0.240 | 0.952 | 0.151 | 1262,514 | 240 by 252 |
| 3554 | 1.5 | 0.35 | 0.36 | 0.99 | 0.99 | 0.99 | 0.014 | 1.15 | 12,2 | 3.3 | 5.5 | 0.49 | 1.00 | 0.240 | 0.241 | 0.958 | 0.151 | 1094,422 | 168 by 176 |
| 3554 + 1/2 | 1.6 | 0.36 | 0.36 | 1.00 | 1.00 | 1.00 | 0.017 | 1.41 | 10,7 | 3.0 | 5.6 | 0.49 | 1.01 | 0.240 | 0.240 | 0.960 | 0.151 | 834,530 | 224 by 192 |
| 3555 | 1.7 | 0.37 | 0.37 | 1.01 | 1.02 | 1.01 | 0.010 | 1.29 | 10,7 | 2.9 | 5.6 | 0.48 | 1.00 | 0.241 | 0.241 | 0.964 | 0.152 | 1066,262 | 52 by 60 |
| 3555 + 1/2 | 1.7 | 0.38 | 0.38 | 0.99 | 0.98 | 0.98 | 0.015 | 1.22 | 5,1 | 3.3 | 5.5 | 0.48 | 1.01 | 0.244 | 0.241 | 0.978 | 0.152 | 922,550 | 180 by 220 |
| 3556 | 1.8 | 0.39 | 0.38 | 1.01 | 1.02 | 1.01 | 0.002 | 1.27 | 5,1 | 3.4 | 5.6 | 0.48 | 0.99 | 0.242 | 0.241 | 0.968 | 0.152 | 1002,490 | 428 by 352 |
| 3556 + 1/2 | 1.9 | 0.39 | 0.39 | 1.00 | 0.99 | 0.99 | 0.022 | 1.27 | 5,1 | 3.8 | 6.2 | 0.48 | 1.00 | 0.239 | 0.241 | 0.957 | 0.152 | 1086,638 | 216 by 200 |
| 3557 | 1.9 | 0.39 | 0.40 | 1.00 | 1.00 | 1.00 | 0.008 | 1.40 | 5,1 | 3.9 | 6.4 | 0.48 | 1.01 | 0.241 | 0.240 | 0.962 | 0.153 | 1058,394 | 308 by 324 |
| 3557 + 1/2 | 2.1 | 0.40 | 0.41 | 0.99 | 1.00 | 0.99 | 0.007 | 1.33 | 5,1 | 4.1 | 6.2 | 0.48 | 1.00 | 0.238 | 0.241 | 0.953 | 0.153 | 738,626 | 64 by 128 |
| 3558 | 2.2 | 0.42 | 0.41 | 1.01 | 1.01 | 1.01 | 0.018 | 1.37 | 5,1 | 4.4 | 7.4 | 0.48 | 1.00 | 0.241 | 0.241 | 0.963 | 0.153 | 1266,606 | 132 by 124 |
| 3558 + 1/2 | 2.2 | 0.43 | 0.43 | 1.00 | 0.99 | 0.99 | 0.028 | 1.42 | 5,1 | 4.4 | 7.2 | 0.48 | 0.99 | 0.241 | 0.240 | 0.964 | 0.153 | 998,514 | 196 by 120 |
| 3559 | 2.3 | 0.43 | 0.43 | 1.00 | 1.01 | 1.00 | 0.018 | 1.34 | 9,8 | 4.4 | 7.6 | 0.47 | 1.00 | 0.244 | 0.241 | 0.975 | 0.154 | 942,606 | 156 by 96 |
| 3559 + 1/2 | 2.3 | 0.44 | 0.43 | 1.01 | 1.01 | 1.01 | 0.015 | 1.34 | 11,8 | 4.7 | 8.1 | 0.47 | 1.00 | 0.240 | 0.244 | 0.961 | 0.154 | 1170,490 | 88 by 120 |
| 3560 | 2.4 | 0.44 | 0.44 | 1.00 | 1.00 | 1.00 | 0.030 | 1.37 | 5,1 | 5.1 | 8.5 | 0.46 | 1.02 | 0.244 | 0.242 | 0.975 | 0.154 | 990,546 | 112 by 136 |
| 3560 + 1/2 | 2.5 | 0.44 | 0.44 | 1.00 | 0.99 | 0.99 | 0.037 | 1.18 | 1,3 | 5.3 | 8.8 | 0.46 | 0.99 | 0.244 | 0.242 | 0.977 | 0.155 | 1074,266 | 160 by 124 |
| 3561 | 2.5 | 0.44 | 0.45 | 1.00 | 0.99 | 0.99 | 0.040 | 1.17 | 2,0 | 5.2 | 8.1 | 0.46 | 0.98 | 0.241 | 0.243 | 0.962 | 0.155 | 1002,602 | 80 by 124 |
| 3561 + 1/2 | 2.6 | 0.45 | 0.45 | 1.00 | 1.00 | 1.00 | 0.035 | 1.25 | 5,1 | 5.1 | 7.8 | 0.46 | 0.99 | 0.242 | 0.243 | 0.970 | 0.155 | 1098,410 | 88 by 84 |
| 3562 | 2.7 | 0.46 | 0.46 | 1.00 | 1.01 | 1.00 | 0.040 | 1.24 | 10,7 | 5.7 | 9.4 | 0.46 | 0.99 | 0.243 | 0.242 | 0.972 | 0.155 | 1074,686 | 332 by 216 |
| 3562 + 1/2 | 2.6 | 0.46 | 0.46 | 1.00 | 0.99 | 0.99 | 0.033 | 1.22 | 6,2 | 5.7 | 9.5 | 0.46 | 0.98 | 0.244 | 0.243 | 0.974 | 0.156 | 1026,506 | 292 by 176 |
| 3563 | 2.8 | 0.47 | 0.47 | 0.99 | 1.01 | 0.99 | 0.026 | 1.19 | 2,0 | 5.8 | 9.8 | 0.47 | 0.99 | 0.242 | 0.243 | 0.969 | 0.156 | 1134,318 | 132 by 152 |
| 3563 + 1/2 | 2.9 | 0.48 | 0.47 | 1.01 | 1.00 | 1.00 | 0.039 | 1.25 | 10,2 | 5.7 | 9.5 | 0.47 | 1.01 | 0.245 | 0.243 | 0.979 | 0.156 | 1054,254 | 176 by 92 |
| 3564 | 3.0 | 0.48 | 0.48 | 1.01 | 1.01 | 1.01 | 0.025 | 1.39 | 11,8 | 5.8 | 9.4 | 0.46 | 1.00 | 0.240 | 0.244 | 0.958 | 0.157 | 1074,442 | 136 by 112 |
| 3564 + 1/2 | 2.9 | 0.48 | 0.49 | 0.98 | 0.99 | 0.98 | 0.028 | 1.30 | 10,2 | 5.9 | 9.5 | 0.46 | 0.98 | 0.243 | 0.245 | 0.973 | 0.157 | 758,418 | 88 by 96 |
| 3565 | 3.2 | 0.49 | 0.49 | 1.01 | 1.02 | 1.01 | 0.042 | 1.65 | 11,8 | 5.6 | 8.7 | 0.46 | 1.01 | 0.246 | 0.244 | 0.984 | 0.157 | 1014,234 | 136 by 72 |
| 3565 + 1/2 | 3.0 | 0.49 | 0.49 | 1.00 | 1.01 | 1.00 | 0.032 | 1.24 | 11,3 | 5.8 | 9.3 | 0.46 | 0.99 | 0.244 | 0.247 | 0.978 | 0.157 | 1078,330 | 152 by 132 |
| 3566 | 3.1 | 0.49 | 0.49 | 1.00 | 1.01 | 1.00 | 0.032 | 1.25 | 11,8 | 6.4 | 10.3 | 0.46 | 1.01 | 0.248 | 0.247 | 0.994 | 0.158 | 934,618 | 100 by 132 |
| 3566 + 1/2 | 3.2 | 0.50 | 0.49 | 1.01 | 1.01 | 1.01 | 0.036 | 1.28 | 11,8 | 5.8 | 9.1 | 0.46 | 1.00 | 0.248 | 0.247 | 0.990 | 0.158 | 1386,594 | 68 by 96 |
| 3567 | 3.2 | 0.49 | 0.50 | 0.98 | 0.97 | 0.97 | 0.058 | 1.23 | 15,4 | 6.5 | 10.5 | 0.46 | 0.99 | 0.247 | 0.248 | 0.989 | 0.158 | 1074,230 | 244 by 132 |
| 3567 + 1/2 | 3.4 | 0.52 | 0.50 | 1.03 | 0.99 | 0.99 | 0.046 | 1.54 | 11,8 | 6.3 | 9.5 | 0.47 | 0.97 | 0.247 | 0.248 | 0.988 | 0.159 | 1106,330 | 284 by 512 |
| 3568 | 3.4 | 0.51 | 0.51 | 1.01 | 1.00 | 1.00 | 0.048 | 1.34 | 15,4 | 7.0 | 11.6 | 0.46 | 1.01 | 0.249 | 0.249 | 0.996 | 0.159 | 1246,474 | 232 by 132 |
| 3568 + 1/2 | 3.4 | 0.51 | 0.51 | 1.00 | 1.00 | 1.00 | 0.032 | 1.36 | 11,3 | 7.1 | 11.1 | 0.46 | 1.01 | 0.250 | 0.254 | 0.986 | 0.159 | 846,682 | 104 by 192 |
| 3569 | 3.4 | 0.51 | 0.51 | 0.99 | 1.02 | 0.99 | 0.038 | 1.30 | 15,4 | 7.0 | 11.2 | 0.47 | 1.03 | 0.258 | 0.255 | 1.014 | 0.159 | 1078,266 | 212 by 120 |
| 3569 + 1/2 | 3.4 | 0.51 | 0.51 | 1.01 | 1.02 | 1.01 | 0.043 | 1.28 | 11,3 | 7.2 | 11.4 | 0.47 | 1.03 | 0.261 | 0.258 | 1.009 | 0.160 | 902,690 | 184 by 128 |
| 3570 | 3.5 | 0.51 | 0.51 | 1.00 | 1.02 | 1.00 | 0.037 | 1.49 | 10,7 | 6.9 | 10.8 | 0.46 | 1.04 | 0.259 | 0.260 | 0.998 | 0.160 | 1022,278 | 152 by 92 |
| 3570 + 1/2 | 3.5 | 0.52 | 0.51 | 1.02 | 1.01 | 1.01 | 0.039 | 1.23 | 0,0 | 7.1 | 10.2 | 0.46 | 1.03 | 0.259 | 0.261 | 0.990 | 0.160 | 1122,662 | 104 by 72 |
| 3571 | 3.6 | 0.52 | 0.51 | 1.02 | 1.03 | 1.02 | 0.039 | 1.33 | 10,8 | 7.5 | 11.2 | 0.46 | 1.05 | 0.262 | 0.259 | 1.012 | 0.161 | 1118,398 | 68 by 108 |
| 3571 + 1/2 | 3.8 | 0.52 | 0.51 | 1.03 | 1.01 | 1.01 | 0.066 | 1.68 | 11,8 | 7.8 | 10.9 | 0.45 | 1.03 | 0.264 | 0.260 | 1.015 | 0.161 | 1078,702 | 76 by 72 |
| 3572 | 3.6 | 0.52 | 0.51 | 1.02 | 1.02 | 1.02 | 0.045 | 1.87 | 12,8 | 8.1 | 11.9 | 0.46 | 1.04 | 0.259 | 0.266 | 0.972 | 0.161 | 1142,638 | 128 by 92 |
| 3572 + 1/2 | 3.7 | 0.53 | 0.51 | 1.04 | 1.00 | 1.00 | 0.043 | 1.39 | 12,8 | 8.7 | 13.0 | 0.46 | 1.04 | 0.268 | 0.267 | 1.002 | 0.161 | 1122,290 | 148 by 92 |
| 3573 | 3.8 | 0.53 | 0.51 | 1.04 | 1.00 | 1.00 | 0.047 | 1.41 | 12,8 | 9.1 | 13.5 | 0.46 | 1.02 | 0.276 | 0.269 | 1.024 | 0.162 | 1086,690 | 324 by 104 |
| 3573 + 1/2 | 3.8 | 0.52 | 0.51 | 1.02 | 1.02 | 1.02 | 0.037 | 1.32 | 10,7 | 9.2 | 13.1 | 0.46 | 1.05 | 0.271 | 0.274 | 0.986 | 0.161 | 1190,382 | 120 by 152 |
| 3574 | 3.7 | 0.52 | 0.51 | 1.02 | 1.03 | 1.02 | 0.044 | 1.35 | 3,4 | 9.4 | 13.5 | 0.46 | 1.03 | 0.273 | 0.277 | 0.986 | 0.162 | 1142,282 | 144 by 76 |
| 3574 + 1/2 | 3.9 | 0.52 | 0.51 | 1.02 | 1.00 | 1.00 | 0.045 | 1.62 | 12,8 | 9.7 | 13.1 | 0.46 | 0.99 | 0.278 | 0.275 | 1.010 | 0.162 | 1122,450 | 100 by 144 |
| 3575 | 3.7 | 0.51 | 0.51 | 0.99 | 1.02 | 0.99 | 0.027 | 1.31 | 15,5 | 10.5 | 15.1 | 0.46 | 1.04 | 0.285 | 0.278 | 1.026 | 0.162 | 1186,354 | 108 by 96 |
| 3575 + 1/2 | 3.8 | 0.51 | 0.51 | 1.00 | 1.02 | 1.00 | 0.026 | 1.29 | 10,7 | 10.8 | 14.7 | 0.46 | 1.03 | 0.277 | 0.279 | 0.996 | 0.162 | 1162,658 | 96 by 144 |
| 3576 | 3.8 | 0.51 | 0.51 | 1.01 | 1.02 | 1.01 | 0.033 | 1.35 | 11,8 | 11.1 | 14.8 | 0.45 | 1.00 | 0.278 | 0.282 | 0.986 | 0.162 | 1090,322 | 180 by 180 |
| 3576 + 1/2 | 3.8 | 0.52 | 0.51 | 1.03 | 1.04 | 1.03 | 0.021 | 1.53 | 10,8 | 11.5 | 15.3 | 0.45 | 1.00 | 0.279 | 0.281 | 0.994 | 0.162 | 966,718 | 112 by 144 |
| 3577 | 3.9 | 0.52 | 0.51 | 1.03 | 1.00 | 1.00 | 0.026 | 1.32 | 0,1 | 11.7 | 15.6 | 0.45 | 1.01 | 0.287 | 0.281 | 1.022 | 0.162 | 1146,350 | 192 by 240 |
| 3577 + 1/2 | 3.8 | 0.50 | 0.51 | 0.99 | 0.95 | 0.95 | 0.047 | 1.33 | 0,1 | 12.0 | 15.4 | 0.46 | 0.96 | 0.283 | 0.287 | 0.986 | 0.162 | 1030,750 | 56 by 84 |
| 3578 | 3.8 | 0.50 | 0.51 | 0.99 | 0.99 | 0.99 | 0.034 | 1.44 | 13,4 | 12.1 | 15.8 | 0.46 | 0.99 | 0.287 | 0.290 | 0.992 | 0.162 | 1122,410 | 200 by 108 |
| 3578 + 1/2 | 3.8 | 0.50 | 0.51 | 0.99 | 0.99 | 0.99 | 0.036 | 1.37 | 0,1 | 12.6 | 16.1 | 0.46 | 1.01 | 0.293 | 0.287 | 1.021 | 0.162 | 1178,422 | 136 by 136 |
| 3579 | 3.8 | 0.51 | 0.51 | 1.00 | 0.99 | 0.99 | 0.037 | 1.36 | 13,4 | 12.5 | 15.9 | 0.46 | 0.99 | 0.292 | 0.290 | 1.005 | 0.162 | 1054,602 | 144 by 96 |
| 3579 + 1/2 | 3.7 | 0.50 | 0.50 | 1.00 | 1.00 | 1.00 | 0.024 | 1.34 | 13,4 | 13.1 | 16.4 | 0.46 | 1.00 | 0.288 | 0.293 | 0.982 | 0.162 | 1114,710 | 52 by 84 |
| 3580 | 3.8 | 0.50 | 0.50 | 1.00 | 1.00 | 1.00 | 0.024 | 1.44 | 11,8 | 13.0 | 16.4 | 0.46 | 1.00 | 0.299 | 0.291 | 1.028 | 0.162 | 1114,354 | 112 by 212 |
| 3580 + 1/2 | 3.9 | 0.51 | 0.50 | 1.01 | 0.98 | 0.98 | 0.029 | 1.37 | 0,1 | 13.3 | 16.7 | 0.46 | 0.97 | 0.290 | 0.300 | 0.966 | 0.162 | 914,738 | 68 by 92 |
| 3581 | 4.0 | 0.52 | 0.50 | 1.04 | 0.95 | 0.95 | 0.043 | 1.25 | 0,1 | 13.8 | 17.1 | 0.46 | 0.95 | 0.301 | 0.300 | 1.004 | 0.162 | 994,734 | 68 by 60 |
| 3581 + 1/2 | 3.8 | 0.49 | 0.50 | 0.97 | 0.97 | 0.97 | 0.025 | 1.30 | 0,1 | 14.1 | 17.4 | 0.46 | 1.00 | 0.301 | 0.301 | 0.999 | 0.162 | 882,698 | 244 by 100 |
| 3582 | 3.8 | 0.49 | 0.50 | 0.98 | 1.01 | 0.98 | 0.020 | 1.28 | 12,4 | 14.2 | 17.5 | 0.46 | 1.01 | 0.302 | 0.301 | 1.002 | 0.162 | 1070,302 | 124 by 112 |
| 3582 + 1/2 | 3.9 | 0.49 | 0.50 | 0.97 | 0.99 | 0.97 | 0.029 | 1.27 | 12,4 | 14.1 | 17.5 | 0.46 | 1.00 | 0.303 | 0.301 | 1.006 | 0.161 | 1038,718 | 88 by 60 |
| 3583 | 3.9 | 0.49 | 0.50 | 0.98 | 0.99 | 0.98 | 0.024 | 1.38 | 12,4 | 14.7 | 17.7 | 0.46 | 1.00 | 0.299 | 0.305 | 0.979 | 0.161 | 1122,594 | 156 by 100 |
| 3583 + 1/2 | 3.9 | 0.49 | 0.50 | 0.98 | 1.00 | 0.98 | 0.029 | 1.32 | 7,2 | 14.7 | 17.7 | 0.46 | 1.00 | 0.309 | 0.305 | 1.014 | 0.161 | 1162,418 | 68 by 60 |
| 3584 | 3.9 | 0.49 | 0.50 | 0.99 | 1.00 | 0.99 | 0.023 | 1.37 | 7,2 | 14.7 | 17.6 | 0.47 | 1.00 | 0.306 | 0.308 | 0.996 | 0.161 | 962,734 | 88 by 120 |
| 3584 + 1/2 | 3.9 | 0.50 | 0.50 | 1.00 | 1.00 | 1.00 | 0.020 | 1.47 | 7,2 | 14.6 | 18.1 | 0.47 | 1.00 | 0.306 | 0.310 | 0.988 | 0.161 | 1042,594 | 148 by 180 |
| 3585 | 4.0 | 0.51 | 0.50 | 1.02 | 1.00 | 1.00 | 0.017 | 1.43 | 7,2 | 14.7 | 18.2 | 0.47 | 1.00 | 0.311 | 0.309 | 1.006 | 0.160 | 1122,498 | 144 by 176 |
| 3585 + 1/2 | 4.0 | 0.50 | 0.49 | 1.01 | 1.02 | 1.01 | 0.017 | 1.41 | 7,2 | 14.4 | 17.9 | 0.46 | 1.00 | 0.316 | 0.309 | 1.022 | 0.160 | 1238,510 | 100 by 92 |
| 3586 | 4.0 | 0.50 | 0.49 | 1.00 | 1.00 | 1.00 | 0.027 | 1.35 | 7,2 | 14.2 | 17.3 | 0.46 | 0.97 | 0.311 | 0.310 | 1.005 | 0.160 | 1066,562 | 116 by 116 |
| 3586 + 1/2 | 3.9 | 0.49 | 0.49 | 1.00 | 1.02 | 1.00 | 0.012 | 1.33 | 7,2 | 14.3 | 17.2 | 0.46 | 1.01 | 0.308 | 0.314 | 0.981 | 0.160 | 1022,658 | 160 by 92 |
| 3587 | 3.9 | 0.49 | 0.49 | 1.00 | 0.99 | 0.99 | 0.027 | 1.26 | 0,2 | 14.3 | 16.6 | 0.46 | 0.98 | 0.309 | 0.315 | 0.982 | 0.160 | 1430,682 | 84 by 120 |
| 3587 + 1/2 | 4.0 | 0.49 | 0.49 | 1.00 | 1.02 | 1.00 | 0.014 | 1.22 | 3,4 | 14.5 | 16.4 | 0.46 | 0.99 | 0.318 | 0.314 | 1.013 | 0.159 | 1118,622 | 144 by 116 |
| 3588 | 4.0 | 0.50 | 0.49 | 1.02 | 1.00 | 1.00 | 0.021 | 1.33 | 3,3 | 14.3 | 16.4 | 0.45 | 1.00 | 0.319 | 0.322 | 0.991 | 0.159 | 1282,538 | 92 by 96 |
| 3588 + 1/2 | 3.9 | 0.50 | 0.49 | 1.02 | 0.98 | 0.98 | 0.027 | 1.26 | 3,3 | 14.1 | 16.7 | 0.45 | 0.99 | 0.332 | 0.319 | 1.041 | 0.159 | 1078,566 | 200 by 204 |
| 3589 | 4.0 | 0.50 | 0.49 | 1.02 | 1.00 | 1.00 | 0.032 | 1.31 | 8,2 | 14.2 | 17.5 | 0.44 | 0.99 | 0.326 | 0.322 | 1.013 | 0.159 | 1034,650 | 64 by 64 |
| 3589 + 1/2 | 3.9 | 0.50 | 0.49 | 1.02 | 1.00 | 1.00 | 0.016 | 1.36 | 8,2 | 14.2 | 17.5 | 0.44 | 1.00 | 0.318 | 0.328 | 0.971 | 0.158 | 1266,334 | 56 by 56 |
| 3590 | 3.9 | 0.49 | 0.49 | 1.00 | 1.01 | 1.00 | 0.011 | 1.22 | 8,2 | 14.2 | 17.4 | 0.44 | 1.00 | 0.324 | 0.327 | 0.992 | 0.158 | 990,698 | 76 by 100 |
| 3590 + 1/2 | 4.0 | 0.49 | 0.49 | 1.00 | 1.04 | 1.00 | 0.004 | 1.27 | 8,2 | 14.2 | 17.1 | 0.42 | 0.99 | 0.329 | 0.326 | 1.010 | 0.158 | 1074,562 | 188 by 152 |
| 3591 | 3.9 | 0.49 | 0.49 | 1.00 | 1.03 | 1.00 | 0.005 | 1.26 | 14,3 | 13.9 | 16.7 | 0.42 | 1.00 | 0.327 | 0.331 | 0.990 | 0.158 | 1102,626 | 88 by 96 |
| 3591 + 1/2 | 3.9 | 0.49 | 0.49 | 1.00 | 1.01 | 1.00 | 0.018 | 1.23 | 8,5 | 13.7 | 16.7 | 0.42 | 1.00 | 0.340 | 0.328 | 1.035 | 0.158 | 1002,706 | 76 by 112 |
| 3592 | 4.0 | 0.48 | 0.49 | 0.99 | 1.01 | 0.99 | 0.011 | 1.25 | 3,4 | 13.5 | 16.1 | 0.41 | 0.99 | 0.332 | 0.326 | 1.018 | 0.158 | 1042,686 | 168 by 136 |
| 3592 + 1/2 | 4.0 | 0.48 | 0.49 | 0.99 | 1.01 | 0.99 | 0.014 | 1.21 | 12,0 | 13.3 | 15.5 | 0.41 | 1.00 | 0.325 | 0.334 | 0.974 | 0.157 | 1194,626 | 96 by 52 |
| 3593 | 3.9 | 0.49 | 0.49 | 1.00 | 1.01 | 1.00 | 0.011 | 1.20 | 3,8 | 12.4 | 14.8 | 0.40 | 0.98 | 0.325 | 0.333 | 0.975 | 0.157 | 1182,378 | 88 by 116 |
| 3593 + 1/2 | 3.9 | 0.49 | 0.48 | 1.02 | 0.99 | 0.99 | 0.017 | 1.39 | 6,3 | 12.1 | 14.0 | 0.40 | 0.99 | 0.336 | 0.329 | 1.020 | 0.157 | 1062,590 | 172 by 192 |
| 3594 | 3.9 | 0.49 | 0.48 | 1.01 | 1.01 | 1.01 | 0.017 | 1.26 | 12,5 | 11.9 | 13.4 | 0.40 | 1.00 | 0.333 | 0.336 | 0.993 | 0.157 | 1198,618 | 384 by 196 |
| 3594 + 1/2 | 3.8 | 0.48 | 0.48 | 1.00 | 1.02 | 1.00 | 0.012 | 1.30 | 9,4 | 11.6 | 12.9 | 0.39 | 1.00 | 0.339 | 0.336 | 1.009 | 0.157 | 1138,474 | 92 by 112 |
| 3595 | 4.0 | 0.48 | 0.48 | 1.00 | 1.02 | 1.00 | 0.013 | 1.30 | 10,3 | 11.5 | 12.3 | 0.39 | 1.00 | 0.336 | 0.336 | 0.998 | 0.157 | 1034,686 | 144 by 100 |
| 3595 + 1/2 | 3.8 | 0.48 | 0.48 | 1.01 | 1.00 | 1.00 | 0.019 | 1.40 | 10,3 | 11.2 | 12.0 | 0.39 | 0.97 | 0.345 | 0.313 | 1.102 | 0.157 | 1218,362 | 104 by 140 |
| 3596 | 3.8 | 0.47 | 0.47 | 1.00 | 0.99 | 0.99 | 0.021 | 1.19 | 14,3 | 11.4 | 12.3 | 0.39 | 0.98 | 0.291 | 0.306 | 0.950 | 0.157 | 1266,334 | 60 by 52 |
| 3596 + 1/2 | 3.9 | 0.46 | 0.47 | 0.99 | 1.00 | 0.99 | 0.017 | 1.23 | 4,3 | 11.9 | 12.4 | 0.39 | 0.97 | 0.275 | 0.284 | 0.967 | 0.157 | 1070,370 | 80 by 84 |
| 3597 | 3.9 | 0.46 | 0.47 | 0.99 | 1.01 | 0.99 | 0.021 | 1.25 | 13,8 | 11.0 | 12.3 | 0.39 | 1.03 | 0.277 | 0.275 | 1.008 | 0.156 | 1014,646 | 56 by 52 |
| 3597 + 1/2 | 3.9 | 0.46 | 0.46 | 0.99 | 1.01 | 0.99 | 0.021 | 1.27 | 12,5 | 11.6 | 12.3 | 0.39 | 0.99 | 0.276 | 0.276 | 0.998 | 0.156 | 1138,642 | 148 by 156 |
| 3598 | 3.9 | 0.46 | 0.46 | 1.00 | 0.95 | 0.95 | 0.051 | 1.28 | 15,8 | 12.0 | 12.6 | 0.39 | 0.94 | 0.275 | 0.278 | 0.989 | 0.156 | 1282,394 | 124 by 96 |
| 3598 + 1/2 | 3.9 | 0.45 | 0.46 | 0.97 | 1.00 | 0.97 | 0.025 | 1.16 | 11,2 | 11.6 | 12.6 | 0.39 | 0.99 | 0.279 | 0.275 | 1.013 | 0.156 | 1122,506 | 100 by 144 |
| 3599 | 4.0 | 0.45 | 0.46 | 0.99 | 1.03 | 0.99 | 0.029 | 1.24 | 8,2 | 11.2 | 12.6 | 0.39 | 1.01 | 0.280 | 0.276 | 1.016 | 0.156 | 1182,430 | 72 by 116 |
| 3599 + 1/2 | 3.9 | 0.47 | 0.46 | 1.02 | 0.99 | 0.99 | 0.060 | 2.15 | 6,5 | 11.4 | 13.3 | 0.39 | 0.97 | 0.274 | 0.279 | 0.982 | 0.156 | 790,658 | 68 by 64 |
| 3600 | 4.1 | 0.45 | 0.46 | 0.98 | 0.96 | 0.96 | 0.058 | 1.26 | 13,5 | 11.6 | 12.7 | 0.38 | 0.97 | 0.276 | 0.277 | 0.997 | 0.156 | 1186,382 | 84 by 72 |
| 3600 + 1/2 | 3.9 | 0.45 | 0.46 | 0.99 | 0.98 | 0.98 | 0.059 | 1.27 | 4,6 | 11.8 | 13.3 | 0.38 | 0.97 | 0.284 | 0.275 | 1.032 | 0.156 | 1038,626 | 88 by 124 |
| 3601 | 4.1 | 0.46 | 0.46 | 1.00 | 0.98 | 0.98 | 0.060 | 1.31 | 8,2 | 11.8 | 13.6 | 0.38 | 0.97 | 0.273 | 0.277 | 0.985 | 0.156 | 1262,330 | 80 by 64 |
| 3601 + 1/2 | 4.0 | 0.46 | 0.46 | 1.00 | 0.99 | 0.99 | 0.056 | 1.24 | 8,2 | 11.7 | 13.4 | 0.38 | 0.96 | 0.275 | 0.278 | 0.989 | 0.156 | 1078,534 | 112 by 196 |
| 3602 | 4.0 | 0.45 | 0.46 | 0.99 | 0.97 | 0.97 | 0.063 | 1.27 | 8,2 | 11.7 | 13.5 | 0.37 | 0.98 | 0.278 | 0.275 | 1.011 | 0.156 | 1130,422 | 124 by 152 |
| 3602 + 1/2 | 4.1 | 0.46 | 0.46 | 1.00 | 0.97 | 0.97 | 0.060 | 1.23 | 1,4 | 11.7 | 13.4 | 0.37 | 0.97 | 0.278 | 0.275 | 1.010 | 0.157 | 1202,402 | 80 by 64 |
| 3603 | 3.9 | 0.45 | 0.46 | 0.99 | 0.98 | 0.98 | 0.058 | 1.29 | 1,4 | 10.9 | 12.6 | 0.37 | 0.97 | 0.275 | 0.276 | 0.997 | 0.156 | 1074,510 | 132 by 168 |
| 3603 + 1/2 | 4.1 | 0.46 | 0.45 | 1.01 | 1.01 | 1.01 | 0.050 | 1.35 | 13,8 | 10.9 | 13.2 | 0.37 | 0.98 | 0.275 | 0.276 | 0.995 | 0.157 | 1070,602 | 80 by 64 |
| 3604 | 3.9 | 0.46 | 0.45 | 1.01 | 1.01 | 1.01 | 0.048 | 1.29 | 14,8 | 11.1 | 12.9 | 0.37 | 1.00 | 0.272 | 0.276 | 0.986 | 0.156 | 1146,486 | 140 by 96 |
| 3604 + 1/2 | 4.0 | 0.46 | 0.45 | 1.02 | 1.00 | 1.00 | 0.051 | 1.41 | 13,8 | 11.0 | 12.8 | 0.37 | 0.99 | 0.276 | 0.274 | 1.011 | 0.157 | 1214,330 | 76 by 76 |
| 3605 | 4.0 | 0.45 | 0.45 | 0.99 | 1.01 | 0.99 | 0.047 | 1.79 | 12,7 | 11.0 | 12.9 | 0.37 | 1.01 | 0.277 | 0.272 | 1.018 | 0.157 | 1190,370 | 80 by 72 |
| 3605 + 1/2 | 4.1 | 0.45 | 0.45 | 1.00 | 0.98 | 0.98 | 0.057 | 1.48 | 13,8 | 10.6 | 12.5 | 0.37 | 0.96 | 0.273 | 0.273 | 0.998 | 0.157 | 1046,622 | 76 by 64 |
| 3606 | 3.9 | 0.45 | 0.45 | 1.00 | 1.00 | 1.00 | 0.040 | 1.36 | 13,8 | 10.6 | 12.5 | 0.37 | 1.00 | 0.270 | 0.271 | 0.995 | 0.157 | 1122,454 | 64 by 80 |
| 3606 + 1/2 | 4.0 | 0.45 | 0.45 | 1.01 | 1.03 | 1.01 | 0.034 | 1.62 | 14,8 | 10.3 | 12.4 | 0.37 | 1.01 | 0.269 | 0.271 | 0.993 | 0.157 | 1022,654 | 116 by 92 |
| 3607 | 4.1 | 0.45 | 0.45 | 1.00 | 0.99 | 0.99 | 0.054 | 1.29 | 11,7 | 10.0 | 11.9 | 0.37 | 1.00 | 0.269 | 0.271 | 0.995 | 0.157 | 1154,510 | 68 by 124 |
| 3607 + 1/2 | 4.2 | 0.46 | 0.45 | 1.02 | 0.94 | 0.94 | 0.080 | 1.36 | 6,7 | 9.5 | 11.5 | 0.37 | 0.96 | 0.272 | 0.270 | 1.005 | 0.157 | 1086,522 | 68 by 80 |
| 3608 | 4.1 | 0.46 | 0.45 | 1.02 | 1.02 | 1.02 | 0.051 | 1.40 | 13,8 | 9.5 | 11.1 | 0.38 | 0.99 | 0.277 | 0.271 | 1.019 | 0.157 | 1082,510 | 100 by 112 |
| 3608 + 1/2 | 4.1 | 0.45 | 0.45 | 1.01 | 0.99 | 0.99 | 0.054 | 1.24 | 14,5 | 9.3 | 10.6 | 0.38 | 0.99 | 0.271 | 0.272 | 0.999 | 0.157 | 1234,342 | 84 by 100 |
| 3609 | 4.0 | 0.44 | 0.45 | 0.99 | 1.01 | 0.99 | 0.035 | 1.22 | 13,7 | 9.0 | 11.2 | 0.38 | 1.03 | 0.271 | 0.270 | 1.006 | 0.157 | 1058,622 | 120 by 60 |
| 3609 + 1/2 | 4.2 | 0.45 | 0.44 | 1.02 | 0.96 | 0.96 | 0.069 | 1.71 | 12,7 | 8.7 | 10.5 | 0.38 | 0.92 | 0.262 | 0.270 | 0.970 | 0.157 | 1170,562 | 84 by 88 |
| 3610 | 4.0 | 0.44 | 0.44 | 0.99 | 1.03 | 0.99 | 0.026 | 1.28 | 15,8 | 8.4 | 10.2 | 0.39 | 0.99 | 0.268 | 0.266 | 1.007 | 0.157 | 1194,310 | 156 by 116 |
| 3610 + 1/2 | 4.0 | 0.44 | 0.44 | 1.00 | 0.98 | 0.98 | 0.055 | 1.27 | 14,7 | 8.3 | 10.2 | 0.39 | 0.96 | 0.270 | 0.263 | 1.027 | 0.157 | 1142,422 | 112 by 100 |
| 3611 | 3.8 | 0.43 | 0.44 | 0.98 | 1.02 | 0.98 | 0.023 | 1.15 | 2,4 | 7.6 | 9.8 | 0.39 | 1.00 | 0.263 | 0.266 | 0.987 | 0.157 | 1254,294 | 56 by 52 |
| 3611 + 1/2 | 3.8 | 0.44 | 0.44 | 0.99 | 1.03 | 0.99 | 0.021 | 1.51 | 15,8 | 8.0 | 9.7 | 0.39 | 1.00 | 0.263 | 0.264 | 0.996 | 0.157 | 1134,518 | 84 by 104 |
| 3612 | 4.2 | 0.44 | 0.44 | 1.02 | 0.94 | 0.94 | 0.077 | 1.25 | 12,7 | 7.8 | 9.7 | 0.39 | 0.93 | 0.264 | 0.263 | 1.005 | 0.157 | 1142,418 | 80 by 84 |
| 3612 + 1/2 | 3.7 | 0.44 | 0.43 | 1.03 | 1.08 | 1.03 | 0.019 | 1.89 | 12,7 | 7.5 | 9.4 | 0.40 | 1.01 | 0.263 | 0.263 | 1.000 | 0.158 | 1098,514 | 88 by 100 |
| 3613 | 3.6 | 0.42 | 0.43 | 0.98 | 1.03 | 0.98 | 0.027 | 1.19 | 0,4 | 7.2 | 9.9 | 0.40 | 1.02 | 0.262 | 0.265 | 0.988 | 0.158 | 1202,326 | 108 by 84 |
| 3613 + 1/2 | 3.7 | 0.42 | 0.42 | 1.00 | 1.05 | 1.00 | 0.014 | 1.26 | 14,8 | 6.8 | 9.2 | 0.40 | 0.99 | 0.269 | 0.262 | 1.026 | 0.158 | 1106,466 | 224 by 152 |
| 3614 | 3.6 | 0.41 | 0.42 | 0.99 | 1.04 | 0.99 | 0.016 | 1.34 | 1,4 | 6.3 | 9.0 | 0.41 | 0.99 | 0.266 | 0.261 | 1.018 | 0.158 | 1202,342 | 160 by 192 |
| 3614 + 1/2 | 3.7 | 0.42 | 0.42 | 1.01 | 1.01 | 1.01 | 0.042 | 1.36 | 15,8 | 6.4 | 9.0 | 0.41 | 0.99 | 0.260 | 0.264 | 0.987 | 0.158 | 1046,594 | 116 by 120 |
| 3615 | 3.7 | 0.42 | 0.41 | 1.02 | 0.99 | 0.99 | 0.045 | 1.54 | 15,8 | 6.0 | 8.9 | 0.41 | 1.00 | 0.260 | 0.261 | 0.996 | 0.158 | 1074,486 | 152 by 132 |
| 3615 + 1/2 | 3.5 | 0.40 | 0.41 | 0.98 | 1.01 | 0.98 | 0.020 | 1.33 | 15,8 | 5.5 | 8.7 | 0.41 | 1.01 | 0.262 | 0.258 | 1.014 | 0.158 | 1238,302 | 120 by 108 |
| 3616 | 3.4 | 0.40 | 0.40 | 0.99 | 1.03 | 0.99 | 0.010 | 1.35 | 14,7 | 5.6 | 8.6 | 0.41 | 0.99 | 0.255 | 0.260 | 0.981 | 0.159 | 1226,286 | 76 by 80 |
| 3616 + 1/2 | 3.4 | 0.39 | 0.40 | 0.97 | 0.99 | 0.97 | 0.014 | 1.36 | 15,7 | 5.5 | 8.5 | 0.41 | 1.00 | 0.256 | 0.259 | 0.991 | 0.159 | 1146,374 | 80 by 92 |
| 3617 | 3.3 | 0.39 | 0.40 | 0.99 | 1.00 | 0.99 | 0.016 | 1.22 | 14,7 | 5.3 | 8.3 | 0.41 | 0.99 | 0.261 | 0.256 | 1.018 | 0.159 | 1170,382 | 84 by 108 |
| 3617 + 1/2 | 3.3 | 0.39 | 0.39 | 1.01 | 1.02 | 1.01 | 0.017 | 2.01 | 15,8 | 5.2 | 9.2 | 0.42 | 1.03 | 0.257 | 0.256 | 1.005 | 0.159 | 1230,298 | 104 by 76 |
| 3618 | 3.2 | 0.38 | 0.39 | 0.99 | 1.02 | 0.99 | 0.007 | 1.38 | 14,8 | 5.2 | 9.2 | 0.42 | 0.98 | 0.255 | 0.256 | 0.994 | 0.159 | 1118,458 | 144 by 108 |
| 3618 + 1/2 | 3.5 | 0.40 | 0.38 | 1.06 | 0.96 | 0.96 | 0.050 | 1.90 | 15,7 | 4.9 | 8.2 | 0.42 | 0.92 | 0.255 | 0.255 | 1.002 | 0.159 | 1182,378 | 96 by 96 |
| 3619 | 3.1 | 0.38 | 0.38 | 1.00 | 1.01 | 1.00 | 0.010 | 1.36 | 14,7 | 4.7 | 8.5 | 0.43 | 0.99 | 0.255 | 0.254 | 1.002 | 0.160 | 1074,498 | 92 by 140 |
| 3619 + 1/2 | 3.1 | 0.37 | 0.37 | 0.99 | 0.99 | 0.99 | 0.011 | 1.28 | 12,6 | 4.4 | 6.7 | 0.43 | 1.02 | 0.254 | 0.254 | 0.999 | 0.160 | 1150,362 | 72 by 112 |
| 3620 | 3.0 | 0.37 | 0.37 | 1.01 | 1.02 | 1.01 | 0.006 | 1.55 | 14,7 | 4.2 | 7.1 | 0.43 | 0.99 | 0.250 | 0.254 | 0.987 | 0.160 | 1210,314 | 64 by 64 |
| 3620 + 1/2 | 3.0 | 0.37 | 0.37 | 1.00 | 1.02 | 1.00 | 0.007 | 1.47 | 14,7 | 3.9 | 5.8 | 0.43 | 0.98 | 0.253 | 0.251 | 1.011 | 0.160 | 1038,594 | 216 by 104 |
| 3621 | 2.9 | 0.37 | 0.36 | 1.01 | 1.01 | 1.01 | 0.012 | 1.51 | 14,7 | 3.7 | 5.4 | 0.44 | 1.02 | 0.251 | 0.249 | 1.005 | 0.161 | 1206,378 | 200 by 216 |
| 3621 + 1/2 | 2.8 | 0.35 | 0.36 | 0.98 | 1.00 | 0.98 | 0.007 | 1.52 | 15,7 | 3.7 | 6.0 | 0.44 | 0.99 | 0.247 | 0.250 | 0.990 | 0.161 | 1586,726 | 68 by 56 |
| 3622 | 2.8 | 0.35 | 0.36 | 0.98 | 1.01 | 0.98 | 0.008 | 1.79 | 15,7 | 3.7 | 5.6 | 0.44 | 1.00 | 0.248 | 0.248 | 0.992 | 0.161 | 1162,294 | 268 by 164 |
| 3622 + 1/2 | 2.8 | 0.36 | 0.34 | 1.04 | 0.97 | 0.97 | 0.033 | 1.64 | 13,4 | 3.8 | 4.6 | 0.44 | 0.94 | 0.247 | 0.248 | 0.988 | 0.162 | 1098,274 | 64 by 60 |
| 3623 | 2.5 | 0.34 | 0.34 | 0.99 | 1.01 | 0.99 | 0.004 | 1.52 | 13,4 | 3.9 | 5.3 | 0.47 | 0.98 | 0.249 | 0.246 | 0.995 | 0.162 | 1094,510 | 100 by 116 |
| 3623 + 1/2 | 2.4 | 0.33 | 0.33 | 1.00 | 1.02 | 1.00 | 0.000 | 1.45 | 13,4 | 4.4 | 5.9 | 0.47 | 1.00 | 0.241 | 0.246 | 0.964 | 0.163 | 1338,614 | 224 by 196 |
| 3624 | 2.3 | 0.33 | 0.33 | 0.98 | 0.98 | 0.98 | 0.003 | 1.38 | 13,4 | 4.7 | 6.1 | 0.47 | 1.00 | 0.245 | 0.242 | 0.981 | 0.163 | 1246,290 | 76 by 60 |
| 3624 + 1/2 | 2.2 | 0.32 | 0.33 | 0.98 | 0.99 | 0.98 | 0.000 | 1.21 | 3,4 | 4.8 | 6.2 | 0.47 | 1.01 | 0.242 | 0.243 | 0.966 | 0.163 | 1146,370 | 272 by 176 |
| 3625 | 2.1 | 0.32 | 0.33 | 0.98 | 0.98 | 0.98 | 0.001 | 1.27 | 4,3 | 5.3 | 6.4 | 0.48 | 1.00 | 0.243 | 0.242 | 0.971 | 0.164 | 1134,414 | 192 by 252 |
| 3625 + 1/2 | 2.0 | 0.31 | 0.33 | 0.96 | 0.96 | 0.96 | 0.001 | 1.32 | 0,4 | 5.4 | 6.6 | 0.48 | 0.98 | 0.243 | 0.241 | 0.972 | 0.164 | 1082,530 | 172 by 208 |
| 3626 | 1.8 | 0.31 | 0.33 | 0.94 | 0.95 | 0.94 | 0.000 | 1.21 | 4,3 | 5.6 | 7.2 | 0.48 | 1.01 | 0.240 | 0.243 | 0.960 | 0.165 | 1234,302 | 120 by 64 |
| 3626 + 1/2 | 1.6 | 0.30 | 0.33 | 0.92 | 0.92 | 0.92 | 0.000 | 1.12 | 5,3 | 5.8 | 7.3 | 0.48 | 1.02 | 0.240 | 0.242 | 0.959 | 0.165 | 1106,638 | 372 by 324 |
| 3627 | 1.4 | 0.30 | 0.33 | 0.92 | 0.92 | 0.92 | 0.000 | 1.10 | 6,4 | 6.0 | 7.8 | 0.48 | 1.00 | 0.244 | 0.240 | 0.976 | 0.166 | 1158,354 | 128 by 136 |
| 3627 + 1/2 | 1.2 | 0.30 | 0.33 | 0.91 | 0.92 | 0.91 | 0.000 | 1.12 | 4,5 | 6.1 | 7.9 | 0.48 | 0.97 | 0.239 | 0.241 | 0.954 | 0.166 | 1274,250 | 76 by 68 |
| 3628 | 1.1 | 0.30 | 0.33 | 0.92 | 0.93 | 0.92 | 0.000 | 1.13 | 3,5 | 6.5 | 7.8 | 0.48 | 0.94 | 0.243 | 0.240 | 0.971 | 0.167 | 1038,594 | 96 by 92 |
| 3628 + 1/2 | 1.1 | 0.30 | 0.33 | 0.93 | 0.94 | 0.93 | 0.001 | 1.08 | 10,8 | 6.3 | 8.0 | 0.48 | 0.94 | 0.237 | 0.240 | 0.949 | 0.168 | 1098,462 | 68 by 72 |
| 3629 | 1.2 | 0.31 | 0.33 | 0.96 | 0.96 | 0.96 | 0.001 | 1.14 | 4,3 | 6.4 | 8.0 | 0.48 | 0.94 | 0.241 | 0.241 | 0.963 | 0.168 | 1198,302 | 124 by 84 |
| 3629 + 1/2 | 1.4 | 0.32 | 0.33 | 0.99 | 0.99 | 0.99 | 0.001 | 1.20 | 15,7 | 6.8 | 8.0 | 0.48 | 0.98 | 0.240 | 0.239 | 0.960 | 0.169 | 1150,410 | 144 by 180 |
| 3630 | 1.5 | 0.32 | 0.33 | 0.99 | 0.99 | 0.99 | 0.001 | 1.48 | 15,7 | 6.7 | 7.5 | 0.48 | 0.97 | 0.242 | 0.240 | 0.969 | 0.169 | 1254,274 | 104 by 84 |
| 3630 + 1/2 | 1.5 | 0.32 | 0.33 | 0.99 | 0.99 | 0.99 | 0.001 | 1.20 | 15,8 | 6.9 | 8.1 | 0.49 | 1.00 | 0.238 | 0.240 | 0.952 | 0.170 | 1062,590 | 92 by 76 |
| 3631 | 1.5 | 0.32 | 0.33 | 0.99 | 0.99 | 0.99 | 0.000 | 1.16 | 10,8 | 6.7 | 7.6 | 0.49 | 0.98 | 0.240 | 0.239 | 0.958 | 0.171 | 1130,478 | 112 by 92 |
| 3631 + 1/2 | 1.5 | 0.33 | 0.32 | 1.01 | 1.01 | 1.01 | 0.000 | 1.32 | 15,7 | 6.8 | 8.1 | 0.49 | 0.99 | 0.240 | 0.238 | 0.959 | 0.171 | 1214,378 | 164 by 268 |
| 3632 | 1.5 | 0.32 | 0.33 | 0.99 | 0.99 | 0.99 | 0.001 | 1.12 | 14,7 | 6.5 | 7.4 | 0.49 | 0.98 | 0.236 | 0.239 | 0.946 | 0.172 | 1322,278 | 156 by 104 |
| 3632 + 1/2 | 1.5 | 0.32 | 0.33 | 1.00 | 1.00 | 1.00 | 0.002 | 1.21 | 14,7 | 6.8 | 8.0 | 0.49 | 1.00 | 0.238 | 0.239 | 0.951 | 0.172 | 1138,466 | 72 by 80 |
| 3633 | 1.5 | 0.32 | 0.33 | 0.99 | 1.00 | 0.99 | 0.001 | 1.19 | 13,7 | 6.7 | 8.0 | 0.49 | 0.99 | 0.239 | 0.237 | 0.957 | 0.173 | 1478,434 | 248 by 284 |
| 3633 + 1/2 | 1.5 | 0.33 | 0.33 | 1.00 | 1.00 | 1.00 | 0.002 | 1.22 | 5,6 | 6.9 | 8.2 | 0.49 | 1.00 | 0.240 | 0.239 | 0.959 | 0.174 | 1058,626 | 132 by 152 |
| 3634 | 1.5 | 0.33 | 0.33 | 1.00 | 1.00 | 1.00 | 0.005 | 1.21 | 13,7 |  |  |  | 0.98 | 0.237 | 0.240 | 0.947 | 0.174 | 1122,602 | 104 by 224 |
| 3634 + 1/2 | 1.5 | 0.33 | 0.33 | 1.01 | 1.01 | 1.01 | 0.001 | 1.20 | 14,5 |  |  |  | 0.99 | 0.241 | 0.239 | 0.964 | 0.175 | 1102,554 | 84 by 88 |
| 3635 | 1.4 | 0.33 | 0.33 | 1.01 | 1.01 | 1.01 | 0.002 | 1.49 | 15,7 |  |  |  | 1.00 | 0.242 | 0.238 | 0.967 | 0.176 | 1286,250 | 108 by 88 |
| 3635 + 1/2 | 1.5 | 0.33 | 0.33 | 1.00 | 1.00 | 1.00 | 0.002 | 1.58 | 0,4 |  |  |  | 1.00 | 0.238 | 0.240 | 0.952 | 0.177 | 1474,354 | 140 by 96 |
| 3636 | 1.4 | 0.33 | 0.33 | 0.99 | 1.00 | 0.99 | 0.000 | 1.22 | 0,4 |  |  |  | 1.01 | 0.239 | 0.239 | 0.955 | 0.177 | 1506,422 | 152 by 196 |
| 3636 + 1/2 | 1.5 | 0.33 | 0.33 | 1.00 | 1.00 | 1.00 | 0.008 | 1.27 | 0,4 |  |  |  | 1.00 | 0.235 | 0.240 | 0.940 | 0.178 | 1190,602 | 248 by 132 |
| 3637 | 1.5 | 0.33 | 0.33 | 1.00 | 1.00 | 1.00 | 0.003 | 1.36 | 0,4 |  |  |  | 1.00 | 0.241 | 0.240 | 0.963 | 0.179 | 1306,246 | 80 by 64 |
| 3637 + 1/2 | 1.5 | 0.33 | 0.33 | 1.01 | 1.01 | 1.01 | 0.006 | 1.67 | 0,4 |  |  |  | 1.00 | 0.242 | 0.239 | 0.968 | 0.179 | 1174,530 | 136 by 192 |
| 3638 | 1.5 | 0.33 | 0.33 | 0.99 | 0.99 | 0.99 | 0.000 | 1.24 | 0,4 |  |  |  | 0.98 | 0.242 | 0.241 | 0.968 | 0.180 | 1218,322 | 124 by 244 |
| 3638 + 1/2 | 1.5 | 0.33 | 0.33 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 11,8 |  |  |  | 0.99 | 0.238 | 0.241 | 0.952 | 0.181 | 1302,262 | 80 by 144 |
| 3639 | 1.5 | 0.34 | 0.33 | 1.01 | 1.01 | 1.01 | 0.004 | 1.28 | 15,7 |  |  |  | 1.00 | 0.241 | 0.240 | 0.963 | 0.181 | 1174,398 | 76 by 72 |
| 3639 + 1/2 | 1.5 | 0.34 | 0.33 | 1.01 | 1.01 | 1.01 | 0.000 | 1.30 | 0,6 |  |  |  | 1.00 | 0.240 | 0.240 | 0.960 | 0.182 | 1162,510 | 140 by 116 |
| 3640 | 1.4 | 0.33 | 0.34 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 2,4 |  |  |  | 1.00 | 0.239 | 0.240 | 0.956 | 0.183 | 1314,246 | 88 by 72 |
| 3640 + 1/2 | 1.5 | 0.34 | 0.34 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 9,4 |  |  |  | 1.00 | 0.241 | 0.240 | 0.965 | 0.183 | 1278,266 | 64 by 88 |
| 3641 | 1.5 | 0.34 | 0.34 | 1.00 | 1.00 | 1.00 | 0.001 | 1.14 | 4,5 |  |  |  | 1.00 | 0.239 | 0.240 | 0.957 | 0.184 | 1146,494 | 136 by 172 |
| 3641 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

### rise (saturn.rise, frames 3810 to 3884, window 3798 to 3896, 198 draft frames at rate 2)

Largest level step: 0.05 at frame 3838 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.19 from frame 3873 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 5.91 from frame 3896 to the next, block column 9 row 6 from the top left, shown, not judged.
Largest change in place: 21.8 from frame 3853 + 1/2 to 8 film frames later, most at pixel 768, 988 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.27 from frame 3814 to 8 film frames later, most at pixel 1204, 836, band 8.2 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 3798 to 3809 + 1/2): change 11.3, pattern 0.13.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 3873 in /home/user/workspace/work/p6/ht9/04/saturn-rise-p2of2-pops.png, frame 3873 + 1/2 in /home/user/workspace/work/p6/ht9/04/saturn-rise-p2of2-pops.png, frame 3874 in /home/user/workspace/work/p6/ht9/04/saturn-rise-p2of2-pops.png, frame 3874 + 1/2 in /home/user/workspace/work/p6/ht9/04/saturn-rise-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 3814 in /home/user/workspace/work/p6/ht9/03/saturn-rise-p1of2-changes.png, frame 3829 in /home/user/workspace/work/p6/ht9/03/saturn-rise-p1of2-changes.png, frame 3838 + 1/2 in /home/user/workspace/work/p6/ht9/03/saturn-rise-p1of2-changes.png, frame 3853 + 1/2 in no panel (a slice --frames 7707-7707 draws it).

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3798 | 97.44 |  | 1.7 | 1.44 | 1.43 | 1.01 | 1.02 | 1.01 | 0.024 | 1.22 | 5,7 | 11.2 | 15.9 | 0.67 | 0.12 | 0.61 | 8.0 |
| 3798 + 1/2 | 97.16 | 0.00 | 1.7 | 1.44 | 1.43 | 1.01 | 1.02 | 1.01 | 0.028 | 1.22 | 11,8 | 11.2 | 16.1 | 0.67 | 0.12 | 0.61 | 8.0 |
| 3799 | 96.89 | 0.00 | 1.7 | 1.43 | 1.44 | 0.99 | 1.00 | 0.99 | 0.033 | 1.16 | 5,3 | 11.3 | 16.5 | 0.67 | 0.12 | 0.61 | 8.0 |
| 3799 + 1/2 | 96.62 | 0.00 | 1.7 | 1.42 | 1.44 | 0.98 | 1.00 | 0.98 | 0.025 | 1.16 | 11,8 | 11.1 | 16.2 | 0.67 | 0.12 | 0.61 | 8.0 |
| 3800 | 96.36 | 0.00 | 1.8 | 1.45 | 1.44 | 1.00 | 0.99 | 0.99 | 0.036 | 1.22 | 12,0 | 11.1 | 16.4 | 0.66 | 0.13 | 0.60 | 8.0 |
| 3800 + 1/2 | 96.10 | 0.00 | 1.7 | 1.45 | 1.45 | 1.00 | 0.97 | 0.97 | 0.037 | 1.12 | 15,7 | 11.0 | 16.6 | 0.66 | 0.13 | 0.60 | 8.0 |
| 3801 | 95.84 | 0.00 | 1.8 | 1.46 | 1.45 | 1.01 | 1.00 | 1.00 | 0.029 | 1.14 | 5,8 | 10.9 | 16.5 | 0.66 | 0.13 | 0.60 | 8.0 |
| 3801 + 1/2 | 95.58 | 0.00 | 1.8 | 1.44 | 1.45 | 0.99 | 0.98 | 0.98 | 0.034 | 1.18 | 9,8 | 10.9 | 16.6 | 0.66 | 0.13 | 0.60 | 8.0 |
| 3802 | 95.32 | 0.00 | 1.8 | 1.45 | 1.45 | 0.99 | 1.02 | 0.99 | 0.019 | 1.20 | 5,6 | 10.9 | 16.8 | 0.66 | 0.13 | 0.60 | 8.0 |
| 3802 + 1/2 | 95.07 | 0.00 | 1.8 | 1.46 | 1.45 | 1.00 | 0.96 | 0.96 | 0.035 | 1.17 | 5,6 | 10.8 | 17.1 | 0.66 | 0.13 | 0.60 | 8.0 |
| 3803 | 94.82 | 0.00 | 1.8 | 1.46 | 1.46 | 1.00 | 0.98 | 0.98 | 0.029 | 1.10 | 15,7 | 10.8 | 16.9 | 0.66 | 0.13 | 0.60 | 8.0 |
| 3803 + 1/2 | 94.57 | 0.00 | 1.9 | 1.44 | 1.46 | 0.99 | 1.00 | 0.99 | 0.026 | 1.10 | 9,8 | 11.0 | 17.4 | 0.66 | 0.14 | 0.60 | 8.0 |
| 3804 | 94.33 | 0.00 | 1.8 | 1.48 | 1.46 | 1.02 | 0.99 | 0.99 | 0.032 | 1.41 | 2,8 | 11.4 | 17.7 | 0.66 | 0.14 | 0.59 | 8.0 |
| 3804 + 1/2 | 94.09 | 0.00 | 1.8 | 1.47 | 1.46 | 1.00 | 0.96 | 0.96 | 0.032 | 1.19 | 1,7 | 11.7 | 18.4 | 0.65 | 0.15 | 0.59 | 8.0 |
| 3805 | 93.85 | 0.00 | 1.8 | 1.45 | 1.46 | 1.00 | 0.96 | 0.96 | 0.041 | 1.10 | 15,1 | 11.8 | 19.1 | 0.65 | 0.16 | 0.58 | 8.0 |
| 3805 + 1/2 | 93.61 | 0.00 | 1.8 | 1.46 | 1.46 | 1.00 | 0.99 | 0.99 | 0.034 | 1.15 | 5,6 | 12.1 | 19.7 | 0.65 | 0.17 | 0.58 | 8.0 |
| 3806 | 93.37 | 0.00 | 1.8 | 1.46 | 1.46 | 1.00 | 1.03 | 1.00 | 0.020 | 1.14 | 2,3 | 12.1 | 20.4 | 0.65 | 0.17 | 0.58 | 8.0 |
| 3806 + 1/2 | 93.13 | 0.00 | 1.8 | 1.48 | 1.46 | 1.01 | 0.98 | 0.98 | 0.033 | 1.26 | 12,0 | 12.0 | 21.3 | 0.64 | 0.18 | 0.58 | 8.0 |
| 3807 | 92.89 | 0.00 | 1.8 | 1.49 | 1.46 | 1.02 | 1.02 | 1.02 | 0.028 | 1.19 | 0,4 | 12.1 | 21.7 | 0.62 | 0.21 | 0.55 | 8.0 |
| 3807 + 1/2 | 92.65 | 0.00 | 1.8 | 1.46 | 1.47 | 0.99 | 1.00 | 0.99 | 0.026 | 1.14 | 4,4 | 12.3 | 22.5 | 0.61 | 0.21 | 0.55 | 8.0 |
| 3808 | 92.40 | 0.00 | 1.8 | 1.45 | 1.48 | 0.98 | 1.02 | 0.98 | 0.021 | 1.13 | 0,8 | 12.8 | 22.9 | 0.58 | 0.24 | 0.51 | 8.0 |
| 3808 + 1/2 | 92.16 | 0.00 | 1.8 | 1.46 | 1.48 | 0.98 | 0.95 | 0.95 | 0.032 | 1.34 | 12,0 | 13.0 | 23.7 | 0.57 | 0.24 | 0.51 | 8.0 |
| 3809 | 91.91 | 0.00 | 1.8 | 1.47 | 1.48 | 0.99 | 0.95 | 0.95 | 0.033 | 1.22 | 0,5 | 13.1 | 24.7 | 0.57 | 0.26 | 0.50 | 8.0 |
| 3809 + 1/2 | 91.67 | 0.00 | 1.8 | 1.48 | 1.49 | 0.99 | 0.97 | 0.97 | 0.032 | 1.17 | 13,1 | 13.4 | 25.3 | 0.57 | 0.26 | 0.50 | 8.0 |
| 3810 first | 91.42 | 0.00 | 1.9 | 1.49 | 1.54 | 0.96 | 0.94 | 0.94 | 0.034 | 1.34 | 5,6 | 13.6 | 25.7 | 0.57 | 0.25 | 0.50 | 8.1 |
| 3810 + 1/2 | 91.17 | 0.00 | 2.1 | 1.59 | 1.56 | 1.02 | 1.00 | 1.00 | 0.039 | 1.57 | 4,6 | 13.9 | 26.1 | 0.56 | 0.26 | 0.49 | 8.1 |
| 3811 | 90.91 | 0.00 | 2.4 | 1.66 | 1.62 | 1.03 | 1.06 | 1.03 | 0.043 | 1.81 | 5,7 | 14.1 | 26.2 | 0.55 | 0.26 | 0.49 | 8.1 |
| 3811 + 1/2 | 90.64 | 0.00 | 2.5 | 1.71 | 1.63 | 1.05 | 1.16 | 1.05 | 0.027 | 2.05 | 5,8 | 14.2 | 26.5 | 0.55 | 0.26 | 0.48 | 8.2 |
| 3812 | 90.37 | 0.00 | 2.7 | 1.74 | 1.63 | 1.07 | 1.23 | 1.07 | 0.017 | 1.52 | 4,6 | 14.0 | 26.7 | 0.54 | 0.26 | 0.48 | 8.2 |
| 3812 + 1/2 | 90.09 | 0.00 | 3.0 | 1.78 | 1.63 | 1.09 | 1.13 | 1.09 | 0.038 | 2.20 | 5,8 | 12.3 | 27.0 | 0.53 | 0.27 | 0.47 | 8.2 |
| 3813 | 89.80 | 0.00 | 3.2 | 1.73 | 1.63 | 1.06 | 1.11 | 1.06 | 0.039 | 1.47 | 8,8 | 12.4 | 27.1 | 0.53 | 0.27 | 0.47 | 8.2 |
| 3813 + 1/2 | 89.50 | 0.00 | 3.4 | 1.76 | 1.63 | 1.08 | 1.12 | 1.08 | 0.039 | 1.61 | 7,8 | 12.6 | 27.5 | 0.53 | 0.27 | 0.46 | 8.2 |
| 3814 | 89.21 | 0.00 | 3.5 | 1.74 | 1.63 | 1.07 | 1.08 | 1.07 | 0.042 | 1.46 | 7,8 | 12.8 | 27.5 | 0.51 | 0.27 | 0.44 | 8.2 |
| 3814 + 1/2 | 88.92 | 0.00 | 3.7 | 1.82 | 1.63 | 1.12 | 1.15 | 1.12 | 0.053 | 2.12 | 5,8 | 12.0 | 27.6 | 0.50 | 0.27 | 0.44 | 8.2 |
| 3815 | 88.62 | 0.00 | 3.8 | 1.74 | 1.63 | 1.07 | 1.12 | 1.07 | 0.035 | 1.63 | 7,8 | 11.7 | 27.7 | 0.50 | 0.27 | 0.44 | 8.3 |
| 3815 + 1/2 | 88.32 | 0.00 | 4.0 | 1.77 | 1.63 | 1.09 | 1.03 | 1.03 | 0.078 | 1.82 | 5,8 | 11.5 | 27.3 | 0.50 | 0.26 | 0.44 | 8.3 |
| 3816 | 88.01 | 0.00 | 4.1 | 1.73 | 1.63 | 1.06 | 1.09 | 1.06 | 0.052 | 1.47 | 3,2 | 11.6 | 27.5 | 0.50 | 0.26 | 0.43 | 8.3 |
| 3816 + 1/2 | 87.69 | 0.00 | 4.2 | 1.76 | 1.63 | 1.08 | 1.08 | 1.08 | 0.067 | 1.37 | 8,0 | 12.6 | 35.2 | 0.45 | 0.24 | 0.38 | 9.0 |
| 3817 | 87.37 | 0.00 | 4.4 | 1.71 | 1.63 | 1.05 | 1.07 | 1.05 | 0.054 | 1.32 | 3,8 | 11.8 | 37.8 | 0.44 | 0.25 | 0.37 | 8.9 |
| 3817 + 1/2 | 87.05 | 0.00 | 4.6 | 1.72 | 1.63 | 1.06 | 1.06 | 1.06 | 0.053 | 1.35 | 3,8 | 12.6 | 43.8 | 0.44 | 0.24 | 0.37 | 9.0 |
| 3818 | 86.73 | 0.00 | 4.6 | 1.68 | 1.63 | 1.03 | 1.05 | 1.03 | 0.061 | 1.28 | 13,0 | 12.7 | 44.1 | 0.44 | 0.25 | 0.37 | 9.0 |
| 3818 + 1/2 | 86.40 | 0.00 | 4.6 | 1.64 | 1.63 | 1.01 | 0.96 | 0.96 | 0.070 | 1.34 | 15,8 | 12.7 | 45.4 | 0.45 | 0.25 | 0.37 | 9.0 |
| 3819 | 86.07 | 0.00 | 4.9 | 1.65 | 1.63 | 1.01 | 1.09 | 1.01 | 0.041 | 1.38 | 7,5 | 12.9 | 46.2 | 0.45 | 0.25 | 0.37 | 9.0 |
| 3819 + 1/2 | 85.74 | 0.00 | 5.0 | 1.61 | 1.62 | 0.99 | 0.97 | 0.97 | 0.072 | 1.62 | 15,8 | 13.0 | 45.6 | 0.45 | 0.24 | 0.38 | 9.1 |
| 3820 | 85.40 | 0.00 | 5.1 | 1.61 | 1.61 | 1.00 | 0.88 | 0.88 | 0.106 | 1.76 | 15,8 | 13.3 | 44.3 | 0.45 | 0.24 | 0.38 | 9.1 |
| 3820 + 1/2 | 85.06 | 0.00 | 5.3 | 1.61 | 1.59 | 1.01 | 1.08 | 1.01 | 0.051 | 1.74 | 15,8 | 13.4 | 44.4 | 0.45 | 0.23 | 0.38 | 9.1 |
| 3821 | 84.73 | 0.00 | 5.5 | 1.56 | 1.59 | 0.98 | 1.03 | 0.98 | 0.073 | 1.70 | 15,8 | 13.5 | 42.6 | 0.45 | 0.21 | 0.38 | 9.1 |
| 3821 + 1/2 | 84.40 | 0.00 | 5.6 | 1.58 | 1.57 | 1.01 | 0.89 | 0.89 | 0.113 | 1.74 | 15,8 | 13.7 | 42.0 | 0.45 | 0.19 | 0.38 | 9.0 |
| 3822 | 84.07 | 0.00 | 5.6 | 1.54 | 1.57 | 0.99 | 0.98 | 0.98 | 0.082 | 1.68 | 15,8 | 13.7 | 38.5 | 0.45 | 0.19 | 0.38 | 9.0 |
| 3822 + 1/2 | 83.73 | 0.00 | 5.7 | 1.53 | 1.56 | 0.98 | 0.91 | 0.91 | 0.096 | 1.66 | 15,8 | 13.5 | 37.0 | 0.45 | 0.18 | 0.38 | 9.0 |
| 3823 | 83.41 | 0.00 | 6.0 | 1.48 | 1.55 | 0.96 | 0.91 | 0.91 | 0.094 | 1.55 | 15,8 | 12.1 | 21.7 | 0.45 | 0.16 | 0.38 | 8.5 |
| 3823 + 1/2 | 83.08 | 0.00 | 6.1 | 1.51 | 1.55 | 0.97 | 0.91 | 0.91 | 0.089 | 1.48 | 5,8 | 12.4 | 24.1 | 0.45 | 0.16 | 0.38 | 8.5 |
| 3824 | 82.75 | 0.01 | 6.2 | 1.47 | 1.55 | 0.95 | 0.78 | 0.78 | 0.162 | 1.49 | 14,8 | 13.2 | 23.8 | 0.45 | 0.16 | 0.38 | 8.5 |
| 3824 + 1/2 | 82.44 | 0.00 | 6.5 | 1.50 | 1.55 | 0.97 | 0.90 | 0.90 | 0.108 | 1.60 | 14,8 | 13.9 | 23.4 | 0.45 | 0.16 | 0.38 | 8.7 |
| 3825 | 82.13 | 0.00 | 6.5 | 1.57 | 1.54 | 1.02 | 0.91 | 0.91 | 0.137 | 1.72 | 14,8 | 14.6 | 22.5 | 0.45 | 0.17 | 0.37 | 8.6 |
| 3825 + 1/2 | 81.83 | 0.01 | 6.7 | 1.53 | 1.55 | 0.99 | 0.91 | 0.91 | 0.091 | 1.72 | 14,8 | 15.2 | 24.6 | 0.44 | 0.20 | 0.37 | 8.0 |
| 3826 | 81.55 | 0.01 | 6.8 | 1.51 | 1.55 | 0.98 | 0.97 | 0.97 | 0.071 | 1.69 | 14,8 | 15.9 | 25.0 | 0.44 | 0.19 | 0.37 | 8.1 |
| 3826 + 1/2 | 81.28 | 0.01 | 6.9 | 1.49 | 1.55 | 0.97 | 1.02 | 0.97 | 0.062 | 1.75 | 14,8 | 16.6 | 25.8 | 0.44 | 0.20 | 0.36 | 8.2 |
| 3827 | 81.03 | 0.01 | 7.0 | 1.47 | 1.55 | 0.95 | 0.95 | 0.95 | 0.081 | 1.73 | 14,8 | 17.1 | 25.8 | 0.43 | 0.19 | 0.36 | 8.1 |
| 3827 + 1/2 | 80.78 | 0.01 | 7.0 | 1.50 | 1.55 | 0.97 | 0.91 | 0.91 | 0.103 | 1.57 | 14,8 | 17.6 | 25.5 | 0.42 | 0.19 | 0.35 | 8.2 |
| 3828 | 80.56 | 0.02 | 7.2 | 1.52 | 1.55 | 0.98 | 0.93 | 0.93 | 0.099 | 1.55 | 15,5 | 18.0 | 24.9 | 0.40 | 0.17 | 0.33 | 8.2 |
| 3828 + 1/2 | 80.38 | 0.01 | 7.5 | 1.48 | 1.55 | 0.96 | 0.98 | 0.96 | 0.081 | 1.62 | 13,8 | 18.5 | 24.6 | 0.40 | 0.16 | 0.34 | 8.1 |
| 3829 | 80.22 | 0.00 | 7.5 | 1.50 | 1.55 | 0.97 | 1.03 | 0.97 | 0.071 | 1.62 | 13,8 | 18.7 | 23.7 | 0.39 | 0.16 | 0.34 | 8.1 |
| 3829 + 1/2 | 80.06 | 0.01 | 7.7 | 1.50 | 1.55 | 0.97 | 1.03 | 0.97 | 0.075 | 1.58 | 13,8 | 18.1 | 23.0 | 0.38 | 0.15 | 0.33 | 8.0 |
| 3830 | 79.93 | 0.01 | 7.9 | 1.53 | 1.55 | 0.99 | 1.09 | 0.99 | 0.062 | 1.54 | 13,8 | 17.6 | 22.2 | 0.37 | 0.15 | 0.32 | 8.0 |
| 3830 + 1/2 | 79.81 | 0.01 | 8.1 | 1.55 | 1.55 | 1.00 | 1.07 | 1.00 | 0.081 | 1.48 | 13,8 | 17.2 | 21.9 | 0.34 | 0.17 | 0.29 | 8.0 |
| 3831 | 79.72 | 0.01 | 8.2 | 1.55 | 1.55 | 1.00 | 1.10 | 1.00 | 0.069 | 1.38 | 3,5 | 15.1 | 22.9 | 0.34 | 0.20 | 0.29 | 8.0 |
| 3831 + 1/2 | 79.63 | 0.00 | 8.5 | 1.55 | 1.55 | 1.00 | 1.10 | 1.00 | 0.066 | 1.44 | 12,8 | 15.0 | 22.4 | 0.33 | 0.19 | 0.29 | 8.0 |
| 3832 | 79.56 | 0.00 | 8.6 | 1.59 | 1.55 | 1.03 | 1.11 | 1.03 | 0.079 | 1.49 | 12,8 | 14.7 | 20.8 | 0.33 | 0.20 | 0.29 | 8.0 |
| 3832 + 1/2 | 79.49 | 0.00 | 8.8 | 1.57 | 1.55 | 1.02 | 1.06 | 1.02 | 0.093 | 1.54 | 15,5 | 14.6 | 19.9 | 0.33 | 0.20 | 0.29 | 8.0 |
| 3833 | 79.43 | 0.00 | 9.0 | 1.55 | 1.55 | 1.00 | 0.98 | 0.98 | 0.114 | 1.77 | 0,5 | 15.0 | 25.2 | 0.33 | 0.21 | 0.29 | 8.0 |
| 3833 + 1/2 | 79.39 | 0.00 | 9.3 | 1.63 | 1.54 | 1.05 | 1.06 | 1.05 | 0.105 | 1.80 | 0,5 | 14.8 | 25.0 | 0.33 | 0.24 | 0.29 | 8.0 |
| 3834 | 79.34 | 0.01 | 9.5 | 1.63 | 1.54 | 1.06 | 1.02 | 1.02 | 0.126 | 1.83 | 0,5 | 14.5 | 24.2 | 0.33 | 0.24 | 0.29 | 8.0 |
| 3834 + 1/2 | 79.32 | 0.00 | 9.6 | 1.66 | 1.54 | 1.07 | 1.00 | 1.00 | 0.121 | 1.92 | 0,5 | 14.1 | 23.3 | 0.33 | 0.20 | 0.29 | 8.0 |
| 3835 | 79.30 | 0.00 | 9.9 | 1.67 | 1.54 | 1.08 | 1.00 | 1.00 | 0.114 | 1.89 | 2,6 | 13.8 | 22.0 | 0.33 | 0.24 | 0.29 | 8.0 |
| 3835 + 1/2 | 79.28 | 0.00 | 10.2 | 1.71 | 1.55 | 1.10 | 1.02 | 1.02 | 0.126 | 1.66 | 0,6 | 13.9 | 21.0 | 0.34 | 0.23 | 0.30 | 8.0 |
| 3836 | 79.27 | 0.00 | 10.4 | 1.71 | 1.55 | 1.11 | 1.01 | 1.01 | 0.134 | 1.62 | 0,6 | 13.9 | 22.6 | 0.34 | 0.18 | 0.31 | 8.4 |
| 3836 + 1/2 | 79.27 | 0.01 | 10.7 | 1.70 | 1.55 | 1.10 | 1.08 | 1.08 | 0.108 | 1.74 | 3,1 | 13.7 | 21.6 | 0.37 | 0.19 | 0.33 | 8.4 |
| 3837 | 79.29 | 0.00 | 11.0 | 1.69 | 1.55 | 1.09 | 1.06 | 1.06 | 0.108 | 1.90 | 1,6 | 13.5 | 21.2 | 0.37 | 0.15 | 0.33 | 8.3 |
| 3837 + 1/2 | 79.31 | 0.00 | 11.2 | 1.68 | 1.55 | 1.09 | 1.00 | 1.00 | 0.118 | 1.90 | 1,5 | 13.5 | 21.0 | 0.37 | 0.15 | 0.33 | 8.3 |
| 3838 | 79.33 | 0.01 | 11.4 | 1.59 | 1.55 | 1.03 | 0.94 | 0.94 | 0.116 | 2.00 | 14,5 | 14.1 | 20.0 | 0.38 | 0.25 | 0.35 | 8.0 |
| 3838 + 1/2 | 79.36 | 0.05 | 11.6 | 1.58 | 1.55 | 1.02 | 0.92 | 0.92 | 0.113 | 1.87 | 14,5 | 13.9 | 18.8 | 0.38 | 0.26 | 0.35 | 8.0 |
| 3839 | 79.49 | 0.00 | 11.9 | 1.52 | 1.55 | 0.98 | 0.88 | 0.88 | 0.120 | 2.36 | 14,5 | 14.0 | 19.6 | 0.38 | 0.22 | 0.35 | 8.0 |
| 3839 + 1/2 | 79.62 | 0.00 | 12.2 | 1.48 | 1.54 | 0.96 | 0.88 | 0.88 | 0.102 | 2.14 | 14,5 | 13.3 | 24.0 | 0.40 | 0.18 | 0.37 | 8.0 |
| 3840 | 79.75 | 0.00 | 12.2 | 1.45 | 1.54 | 0.94 | 0.88 | 0.88 | 0.084 | 1.67 | 5,4 | 13.3 | 33.1 | 0.40 | 0.16 | 0.37 | 8.0 |
| 3840 + 1/2 | 79.87 | 0.00 | 12.3 | 1.46 | 1.54 | 0.95 | 0.92 | 0.92 | 0.085 | 1.42 | 5,4 | 13.0 | 35.1 | 0.40 | 0.15 | 0.37 | 8.0 |
| 3841 | 79.97 | 0.00 | 12.4 | 1.49 | 1.54 | 0.97 | 0.96 | 0.96 | 0.080 | 1.57 | 5,4 | 12.9 | 30.3 | 0.40 | 0.15 | 0.37 | 8.0 |
| 3841 + 1/2 | 80.08 | 0.02 | 12.5 | 1.54 | 1.53 | 1.01 | 0.99 | 0.99 | 0.073 | 1.59 | 5,0 | 12.7 | 30.0 | 0.40 | 0.16 | 0.37 | 8.0 |
| 3842 | 80.15 | 0.00 | 12.6 | 1.54 | 1.52 | 1.01 | 0.96 | 0.96 | 0.080 | 1.66 | 13,5 | 12.6 | 31.3 | 0.40 | 0.20 | 0.38 | 8.0 |
| 3842 + 1/2 | 80.21 | 0.00 | 12.9 | 1.54 | 1.52 | 1.01 | 0.95 | 0.95 | 0.087 | 1.59 | 10,4 | 12.2 | 31.2 | 0.40 | 0.22 | 0.38 | 8.0 |
| 3843 | 80.27 | 0.01 | 12.9 | 1.53 | 1.53 | 1.00 | 0.96 | 0.96 | 0.085 | 1.78 | 10,4 | 12.7 | 31.3 | 0.40 | 0.22 | 0.37 | 8.0 |
| 3843 + 1/2 | 80.36 | 0.01 | 13.0 | 1.55 | 1.52 | 1.02 | 0.98 | 0.98 | 0.075 | 2.14 | 13,5 | 12.7 | 31.5 | 0.40 | 0.21 | 0.37 | 8.0 |
| 3844 | 80.46 | 0.01 | 13.0 | 1.54 | 1.52 | 1.01 | 1.01 | 1.01 | 0.074 | 1.68 | 10,4 | 12.6 | 30.7 | 0.40 | 0.19 | 0.38 | 8.0 |
| 3844 + 1/2 | 80.55 | 0.00 | 12.8 | 1.54 | 1.52 | 1.01 | 1.03 | 1.01 | 0.064 | 1.66 | 10,4 | 12.3 | 30.9 | 0.40 | 0.14 | 0.38 | 8.0 |
| 3845 | 80.65 | 0.00 | 12.9 | 1.51 | 1.53 | 0.99 | 1.05 | 0.99 | 0.060 | 1.80 | 4,4 | 12.3 | 29.5 | 0.39 | 0.12 | 0.36 | 8.2 |
| 3845 + 1/2 | 80.73 | 0.00 | 12.9 | 1.51 | 1.53 | 0.99 | 1.04 | 0.99 | 0.052 | 2.13 | 4,4 | 12.7 | 29.3 | 0.38 | 0.07 | 0.36 | 8.0 |
| 3846 | 80.81 | 0.01 | 12.8 | 1.48 | 1.53 | 0.97 | 1.05 | 0.97 | 0.055 | 2.30 | 4,4 | 12.9 | 29.9 | 0.38 | 0.07 | 0.36 | 8.0 |
| 3846 + 1/2 | 80.87 | 0.02 | 12.7 | 1.50 | 1.53 | 0.98 | 1.01 | 0.98 | 0.061 | 2.36 | 4,4 | 13.5 | 29.7 | 0.38 | 0.09 | 0.36 | 8.0 |
| 3847 | 80.90 | 0.05 | 12.9 | 1.47 | 1.53 | 0.96 | 0.99 | 0.96 | 0.051 | 2.19 | 4,4 | 14.2 | 21.5 | 0.37 | 0.08 | 0.35 | 8.0 |
| 3847 + 1/2 | 80.84 | 0.03 | 12.7 | 1.44 | 1.54 | 0.94 | 0.97 | 0.94 | 0.054 | 2.02 | 4,4 | 14.8 | 21.6 | 0.37 | 0.10 | 0.35 | 8.0 |
| 3848 | 80.71 | 0.01 | 12.6 | 1.41 | 1.54 | 0.92 | 0.96 | 0.92 | 0.050 | 1.77 | 4,4 | 15.1 | 21.2 | 0.37 | 0.12 | 0.35 | 8.0 |
| 3848 + 1/2 | 80.56 | 0.01 | 12.5 | 1.42 | 1.54 | 0.92 | 0.96 | 0.92 | 0.047 | 1.88 | 10,8 | 15.7 | 22.1 | 0.36 | 0.13 | 0.34 | 8.0 |
| 3849 | 80.39 | 0.01 | 12.2 | 1.43 | 1.54 | 0.93 | 0.96 | 0.93 | 0.050 | 1.58 | 4,4 | 16.6 | 23.1 | 0.33 | 0.15 | 0.31 | 8.0 |
| 3849 + 1/2 | 80.20 | 0.02 | 12.1 | 1.46 | 1.54 | 0.95 | 0.98 | 0.95 | 0.053 | 1.62 | 9,2 | 17.4 | 24.3 | 0.33 | 0.16 | 0.30 | 8.0 |
| 3850 | 79.98 | 0.01 | 12.1 | 1.50 | 1.55 | 0.97 | 1.00 | 0.97 | 0.058 | 1.51 | 10,8 | 17.9 | 25.7 | 0.32 | 0.15 | 0.30 | 8.0 |
| 3850 + 1/2 | 79.73 | 0.01 | 11.9 | 1.54 | 1.56 | 0.99 | 1.03 | 0.99 | 0.055 | 1.66 | 9,2 | 18.1 | 26.6 | 0.32 | 0.15 | 0.30 | 8.0 |
| 3851 | 79.46 | 0.00 | 11.7 | 1.57 | 1.58 | 0.99 | 1.01 | 0.99 | 0.063 | 1.61 | 9,1 | 18.9 | 27.7 | 0.31 | 0.15 | 0.29 | 8.0 |
| 3851 + 1/2 | 79.18 | 0.00 | 11.7 | 1.61 | 1.59 | 1.01 | 0.97 | 0.97 | 0.082 | 1.62 | 3,4 | 19.8 | 28.3 | 0.31 | 0.16 | 0.29 | 8.0 |
| 3852 | 78.91 | 0.00 | 11.5 | 1.61 | 1.63 | 0.99 | 0.97 | 0.97 | 0.076 | 2.08 | 9,1 | 20.0 | 28.4 | 0.31 | 0.16 | 0.29 | 8.0 |
| 3852 + 1/2 | 78.64 | 0.00 | 11.4 | 1.65 | 1.63 | 1.01 | 0.96 | 0.96 | 0.082 | 2.00 | 9,1 | 20.6 | 28.5 | 0.30 | 0.18 | 0.28 | 8.0 |
| 3853 | 78.36 | 0.01 | 11.1 | 1.68 | 1.65 | 1.01 | 1.01 | 1.01 | 0.072 | 2.12 | 9,1 | 21.4 | 28.1 | 0.30 | 0.20 | 0.28 | 8.0 |
| 3853 + 1/2 | 78.06 | 0.00 | 10.9 | 1.69 | 1.67 | 1.01 | 0.99 | 0.99 | 0.074 | 1.64 | 1,5 | 21.8 | 28.3 | 0.29 | 0.20 | 0.28 | 8.0 |
| 3854 | 77.76 | 0.00 | 10.5 | 1.66 | 1.69 | 0.98 | 1.04 | 0.98 | 0.058 | 1.61 | 2,0 | 21.5 | 28.9 | 0.29 | 0.22 | 0.27 | 8.2 |
| 3854 + 1/2 | 77.46 | 0.00 | 10.5 | 1.70 | 1.69 | 1.01 | 0.96 | 0.96 | 0.084 | 1.70 | 0,0 | 20.5 | 33.1 | 0.28 | 0.22 | 0.27 | 8.3 |
| 3855 | 77.15 | 0.00 | 10.2 | 1.73 | 1.69 | 1.02 | 1.00 | 1.00 | 0.073 | 1.74 | 0,0 | 20.2 | 30.9 | 0.29 | 0.21 | 0.27 | 8.4 |
| 3855 + 1/2 | 76.85 | 0.00 | 10.0 | 1.70 | 1.70 | 1.00 | 1.03 | 1.00 | 0.060 | 1.83 | 0,0 | 20.0 | 29.8 | 0.29 | 0.20 | 0.27 | 8.6 |
| 3856 | 76.54 | 0.01 | 9.8 | 1.71 | 1.70 | 1.00 | 1.02 | 1.00 | 0.067 | 1.83 | 0,0 | 20.0 | 30.2 | 0.29 | 0.19 | 0.27 | 8.6 |
| 3856 + 1/2 | 76.26 | 0.01 | 9.4 | 1.69 | 1.72 | 0.98 | 0.97 | 0.97 | 0.083 | 1.67 | 8,1 | 19.7 | 30.5 | 0.29 | 0.20 | 0.27 | 8.6 |
| 3857 | 76.00 | 0.01 | 9.2 | 1.74 | 1.72 | 1.01 | 1.00 | 1.00 | 0.089 | 1.57 | 8,1 | 18.3 | 30.7 | 0.28 | 0.25 | 0.26 | 8.5 |
| 3857 + 1/2 | 75.76 | 0.01 | 9.2 | 1.74 | 1.72 | 1.01 | 0.97 | 0.97 | 0.086 | 1.71 | 8,1 | 17.6 | 29.7 | 0.28 | 0.22 | 0.26 | 8.3 |
| 3858 | 75.54 | 0.01 | 8.8 | 1.69 | 1.73 | 0.98 | 0.99 | 0.98 | 0.075 | 1.71 | 8,1 | 17.6 | 30.3 | 0.29 | 0.22 | 0.27 | 8.2 |
| 3858 + 1/2 | 75.34 | 0.00 | 8.5 | 1.73 | 1.73 | 1.00 | 1.07 | 1.00 | 0.063 | 2.09 | 8,1 | 17.3 | 29.5 | 0.29 | 0.20 | 0.27 | 8.2 |
| 3859 | 75.14 | 0.01 | 8.5 | 1.74 | 1.73 | 1.00 | 0.99 | 0.99 | 0.088 | 2.14 | 8,1 | 16.6 | 28.0 | 0.29 | 0.19 | 0.27 | 8.1 |
| 3859 + 1/2 | 74.95 | 0.00 | 8.3 | 1.74 | 1.74 | 1.00 | 1.03 | 1.00 | 0.069 | 2.03 | 8,1 | 16.5 | 26.8 | 0.29 | 0.17 | 0.28 | 8.0 |
| 3860 | 74.76 | 0.01 | 8.0 | 1.76 | 1.74 | 1.01 | 1.00 | 1.00 | 0.077 | 1.91 | 8,1 | 16.1 | 25.7 | 0.30 | 0.16 | 0.28 | 8.0 |
| 3860 + 1/2 | 74.55 | 0.00 | 7.8 | 1.78 | 1.74 | 1.02 | 1.02 | 1.02 | 0.081 | 1.60 | 8,0 | 15.2 | 24.4 | 0.30 | 0.16 | 0.28 | 8.9 |
| 3861 | 74.34 | 0.01 | 7.7 | 1.83 | 1.74 | 1.05 | 1.03 | 1.03 | 0.089 | 2.04 | 7,1 | 15.0 | 23.5 | 0.30 | 0.14 | 0.28 | 9.0 |
| 3861 + 1/2 | 74.16 | 0.01 | 7.6 | 1.82 | 1.75 | 1.04 | 1.03 | 1.03 | 0.078 | 1.76 | 7,1 | 14.9 | 23.2 | 0.31 | 0.14 | 0.29 | 9.1 |
| 3862 | 73.99 | 0.01 | 7.3 | 1.80 | 1.75 | 1.03 | 1.02 | 1.02 | 0.084 | 1.67 | 7,1 | 15.4 | 23.5 | 0.31 | 0.12 | 0.29 | 9.2 |
| 3862 + 1/2 | 73.85 | 0.01 | 7.1 | 1.79 | 1.75 | 1.02 | 1.01 | 1.01 | 0.081 | 1.81 | 7,1 | 15.3 | 22.4 | 0.31 | 0.12 | 0.29 | 9.3 |
| 3863 | 73.72 | 0.00 | 7.0 | 1.75 | 1.75 | 1.00 | 1.01 | 1.00 | 0.075 | 1.49 | 7,4 | 15.2 | 22.5 | 0.31 | 0.12 | 0.29 | 9.4 |
| 3863 + 1/2 | 73.59 | 0.02 | 6.9 | 1.77 | 1.75 | 1.01 | 0.98 | 0.98 | 0.078 | 1.52 | 7,4 | 15.4 | 22.7 | 0.31 | 0.12 | 0.29 | 9.5 |
| 3864 | 73.49 | 0.01 | 6.4 | 1.75 | 1.76 | 0.99 | 1.00 | 0.99 | 0.070 | 1.55 | 7,4 | 15.5 | 21.9 | 0.32 | 0.10 | 0.30 | 8.0 |
| 3864 + 1/2 | 73.41 | 0.00 | 6.4 | 1.78 | 1.76 | 1.01 | 0.98 | 0.98 | 0.073 | 1.68 | 7,4 | 15.6 | 22.5 | 0.32 | 0.10 | 0.30 | 8.0 |
| 3865 | 73.33 | 0.00 | 6.1 | 1.75 | 1.77 | 0.99 | 0.98 | 0.98 | 0.068 | 1.75 | 9,5 | 16.0 | 24.1 | 0.32 | 0.10 | 0.30 | 8.0 |
| 3865 + 1/2 | 73.25 | 0.01 | 6.0 | 1.69 | 1.78 | 0.95 | 0.94 | 0.94 | 0.070 | 1.55 | 9,5 | 15.8 | 22.8 | 0.32 | 0.10 | 0.30 | 8.0 |
| 3866 | 73.19 | 0.01 | 5.6 | 1.74 | 1.78 | 0.97 | 0.99 | 0.97 | 0.054 | 1.62 | 9,5 | 15.9 | 23.3 | 0.32 | 0.08 | 0.29 | 8.0 |
| 3866 + 1/2 | 73.15 | 0.00 | 5.5 | 1.72 | 1.78 | 0.97 | 0.99 | 0.97 | 0.055 | 1.74 | 9,5 | 15.7 | 21.9 | 0.31 | 0.08 | 0.29 | 8.0 |
| 3867 | 73.11 | 0.00 | 5.3 | 1.75 | 1.79 | 0.98 | 0.96 | 0.96 | 0.070 | 1.69 | 10,8 | 16.1 | 24.6 | 0.31 | 0.08 | 0.29 | 8.0 |
| 3867 + 1/2 | 73.07 | 0.00 | 5.2 | 1.75 | 1.79 | 0.98 | 1.00 | 0.98 | 0.056 | 1.40 | 10,6 | 15.7 | 22.4 | 0.31 | 0.07 | 0.29 | 8.0 |
| 3868 | 73.03 | 0.01 | 5.1 | 1.75 | 1.80 | 0.97 | 0.99 | 0.97 | 0.057 | 1.32 | 10,6 | 15.4 | 24.1 | 0.30 | 0.08 | 0.29 | 8.0 |
| 3868 + 1/2 | 72.97 | 0.01 | 4.9 | 1.78 | 1.81 | 0.98 | 1.01 | 0.98 | 0.063 | 1.35 | 14,6 | 15.8 | 27.5 | 0.30 | 0.08 | 0.29 | 8.0 |
| 3869 | 72.89 | 0.01 | 4.6 | 1.79 | 1.82 | 0.98 | 0.99 | 0.98 | 0.067 | 1.42 | 14,6 | 15.7 | 26.5 | 0.29 | 0.09 | 0.28 | 8.0 |
| 3869 + 1/2 | 72.80 | 0.01 | 4.7 | 1.81 | 1.83 | 0.99 | 0.99 | 0.99 | 0.069 | 1.55 | 15,6 | 15.3 | 27.0 | 0.29 | 0.09 | 0.28 | 8.0 |
| 3870 | 72.70 | 0.03 | 4.3 | 1.85 | 1.87 | 0.99 | 1.00 | 0.99 | 0.077 | 1.54 | 14,6 | 15.8 | 24.1 | 0.28 | 0.10 | 0.27 | 8.0 |
| 3870 + 1/2 | 72.64 | 0.02 | 4.4 | 1.93 | 1.89 | 1.02 | 1.03 | 1.02 | 0.071 | 1.61 | 14,6 | 16.0 | 23.7 | 0.28 | 0.10 | 0.27 | 8.0 |
| 3871 | 72.64 | 0.03 | 4.0 | 2.01 | 1.89 | 1.07 | 1.11 | 1.07 | 0.057 | 1.63 | 15,6 | 16.1 | 28.0 | 0.27 | 0.11 | 0.27 | 8.0 |
| 3871 + 1/2 | 72.69 | 0.02 | 4.0 | 2.09 | 1.89 | 1.11 | 1.14 | 1.11 | 0.067 | 1.70 | 14,6 | 16.2 | 33.2 | 0.27 | 0.11 | 0.26 | 8.0 |
| 3872 | 72.78 | 0.01 | 3.8 | 2.14 | 1.89 | 1.14 | 1.20 | 1.14 | 0.054 | 1.65 | 15,6 | 16.3 | 36.2 | 0.26 | 0.12 | 0.25 | 8.1 |
| 3872 + 1/2 | 72.88 | 0.00 | 3.7 | 2.18 | 1.89 | 1.15 | 1.20 | 1.15 | 0.069 | 1.84 | 12,8 | 16.2 | 34.7 | 0.26 | 0.11 | 0.25 | 8.0 |
| 3873 | 72.99 | 0.00 | 3.6 | 2.24 | 1.89 | 1.19 | 1.26 | 1.19 | 0.057 | 1.91 | 12,8 | 15.6 | 29.4 | 0.25 | 0.13 | 0.24 | 8.0 |
| 3873 + 1/2 | 73.10 | 0.00 | 3.7 | 2.25 | 1.89 | 1.19 | 1.24 | 1.19 | 0.073 | 2.27 | 12,8 | 15.7 | 28.3 | 0.25 | 0.12 | 0.24 | 8.0 |
| 3874 | 73.22 | 0.01 | 3.5 | 2.23 | 1.89 | 1.18 | 1.25 | 1.18 | 0.059 | 2.13 | 12,8 | 15.3 | 27.3 | 0.25 | 0.12 | 0.24 | 8.0 |
| 3874 + 1/2 | 73.30 | 0.02 | 3.2 | 2.23 | 1.89 | 1.18 | 1.22 | 1.18 | 0.071 | 2.08 | 12,8 | 15.3 | 26.9 | 0.25 | 0.12 | 0.24 | 8.0 |
| 3875 | 73.34 | 0.03 | 3.2 | 2.17 | 1.89 | 1.15 | 1.23 | 1.15 | 0.053 | 2.01 | 12,1 | 16.0 | 26.7 | 0.24 | 0.11 | 0.23 | 8.0 |
| 3875 + 1/2 | 73.33 | 0.03 | 3.0 | 2.17 | 1.89 | 1.15 | 1.21 | 1.15 | 0.056 | 2.05 | 12,1 | 16.0 | 27.8 | 0.24 | 0.11 | 0.23 | 8.0 |
| 3876 | 73.26 | 0.02 | 3.1 | 2.13 | 1.89 | 1.13 | 1.16 | 1.13 | 0.070 | 1.93 | 12,1 | 16.0 | 28.6 | 0.24 | 0.11 | 0.23 | 8.0 |
| 3876 + 1/2 | 73.13 | 0.03 | 2.9 | 2.09 | 1.89 | 1.11 | 1.14 | 1.11 | 0.067 | 2.08 | 12,1 | 15.3 | 26.7 | 0.24 | 0.11 | 0.23 | 8.0 |
| 3877 | 72.95 | 0.02 | 2.8 | 2.04 | 1.89 | 1.08 | 1.16 | 1.08 | 0.041 | 2.07 | 12,1 | 14.9 | 26.0 | 0.24 | 0.11 | 0.23 | 8.0 |
| 3877 + 1/2 | 72.73 | 0.01 | 2.8 | 2.01 | 1.89 | 1.06 | 1.05 | 1.05 | 0.085 | 1.84 | 11,8 | 14.6 | 25.0 | 0.23 | 0.11 | 0.22 | 8.0 |
| 3878 | 72.49 | 0.00 | 2.5 | 1.95 | 1.89 | 1.03 | 1.06 | 1.03 | 0.053 | 1.93 | 11,8 | 14.3 | 23.1 | 0.23 | 0.12 | 0.22 | 8.3 |
| 3878 + 1/2 | 72.24 | 0.00 | 2.7 | 1.92 | 1.89 | 1.02 | 0.98 | 0.98 | 0.082 | 1.96 | 11,8 | 14.4 | 22.3 | 0.23 | 0.12 | 0.22 | 8.4 |
| 3879 | 71.99 | 0.00 | 2.4 | 1.84 | 1.85 | 0.99 | 1.01 | 0.99 | 0.073 | 2.08 | 11,8 | 14.8 | 21.8 | 0.23 | 0.12 | 0.22 | 8.2 |
| 3879 + 1/2 | 71.74 | 0.01 | 2.4 | 1.78 | 1.79 | 1.00 | 1.04 | 1.00 | 0.059 | 1.92 | 11,8 | 14.5 | 22.0 | 0.23 | 0.11 | 0.22 | 8.2 |
| 3880 | 71.51 | 0.02 | 2.3 | 1.73 | 1.70 | 1.02 | 0.97 | 0.97 | 0.063 | 1.83 | 11,8 | 14.5 | 20.5 | 0.23 | 0.11 | 0.22 | 8.0 |
| 3880 + 1/2 | 71.31 | 0.01 | 2.1 | 1.61 | 1.64 | 0.98 | 0.99 | 0.98 | 0.082 | 1.87 | 11,8 | 14.7 | 20.8 | 0.23 | 0.11 | 0.22 | 8.1 |
| 3881 | 71.14 | 0.01 | 2.2 | 1.55 | 1.55 | 1.00 | 1.03 | 1.00 | 0.065 | 1.71 | 11,8 | 14.8 | 20.9 | 0.23 | 0.10 | 0.22 | 8.0 |
| 3881 + 1/2 | 70.99 | 0.01 | 2.2 | 1.48 | 1.49 | 1.00 | 0.98 | 0.98 | 0.087 | 1.49 | 11,8 | 14.2 | 19.9 | 0.23 | 0.10 | 0.22 | 8.0 |
| 3882 | 70.85 | 0.01 | 2.0 | 1.42 | 1.44 | 0.99 | 1.00 | 0.99 | 0.080 | 1.40 | 11,8 | 13.6 | 19.2 | 0.23 | 0.10 | 0.22 | 8.0 |
| 3882 + 1/2 | 70.73 | 0.00 | 2.1 | 1.39 | 1.38 | 1.01 | 0.96 | 0.96 | 0.087 | 1.38 | 11,7 | 13.1 | 18.4 | 0.23 | 0.10 | 0.22 | 8.0 |
| 3883 | 70.61 | 0.00 | 2.0 | 1.34 | 1.35 | 0.99 | 1.02 | 0.99 | 0.066 | 1.43 | 10,8 | 12.3 | 18.8 | 0.24 | 0.09 | 0.23 | 8.0 |
| 3883 + 1/2 | 70.49 | 0.01 | 1.8 | 1.31 | 1.32 | 1.00 | 1.02 | 1.00 | 0.067 | 1.57 | 10,8 | 11.8 | 18.8 | 0.24 | 0.08 | 0.23 | 8.0 |
| 3884 last | 70.35 | 0.02 | 1.8 | 1.29 | 1.29 | 1.00 | 0.98 | 0.98 | 0.067 | 1.63 | 10,8 | 11.2 | 18.0 | 0.24 | 0.07 | 0.23 | 8.1 |
| 3884 + 1/2 | 70.17 | 0.02 | 1.7 | 1.27 | 1.28 | 1.00 | 1.00 | 1.00 | 0.059 | 1.67 | 10,8 | 10.4 | 17.7 | 0.24 | 0.06 | 0.23 | 8.2 |
| 3885 | 69.95 | 0.01 | 1.6 | 1.24 | 1.28 | 0.97 | 1.00 | 0.97 | 0.069 | 1.71 | 10,8 | 10.9 | 16.1 | 0.20 | 0.07 | 0.19 | 8.0 |
| 3885 + 1/2 | 69.72 | 0.00 | 1.7 | 1.26 | 1.28 | 0.98 | 0.99 | 0.98 | 0.072 | 1.75 | 10,8 | 10.8 | 18.1 | 0.15 | 0.08 | 0.14 | 8.1 |
| 3886 | 69.47 | 0.00 | 1.6 | 1.25 | 1.28 | 0.97 | 1.00 | 0.97 | 0.060 | 1.67 | 10,8 | 11.8 | 16.8 | 0.14 | 0.08 | 0.13 | 8.0 |
| 3886 + 1/2 | 69.23 | 0.00 | 1.5 | 1.23 | 1.27 | 0.97 | 1.00 | 0.97 | 0.056 | 1.52 | 10,8 | 9.2 | 17.1 | 0.13 | 0.07 | 0.12 | 8.0 |
| 3887 | 68.99 | 0.01 | 1.5 | 1.23 | 1.26 | 0.97 | 1.01 | 0.97 | 0.061 | 1.40 | 10,8 | 9.0 | 18.2 | 0.13 | 0.06 | 0.12 | 8.0 |
| 3887 + 1/2 | 68.76 | 0.00 | 1.4 | 1.22 | 1.26 | 0.97 | 1.00 | 0.97 | 0.052 | 1.35 | 10,8 | 8.6 | 17.5 | 0.13 | 0.06 | 0.12 | 8.3 |
| 3888 | 68.53 | 0.00 | 1.3 | 1.20 | 1.26 | 0.95 | 1.00 | 0.95 | 0.043 | 1.26 | 10,8 | 8.5 | 22.1 | 0.13 | 0.06 | 0.12 | 8.0 |
| 3888 + 1/2 | 68.31 | 0.01 | 1.2 | 1.15 | 1.26 | 0.92 | 0.98 | 0.92 | 0.037 | 1.31 | 2,8 | 8.6 | 22.3 | 0.12 | 0.05 | 0.11 | 8.2 |
| 3889 | 68.10 | 0.01 | 1.0 | 1.13 | 1.26 | 0.90 | 0.99 | 0.90 | 0.027 | 1.24 | 2,8 |  |  |  |  |  |  |
| 3889 + 1/2 | 67.92 | 0.01 | 0.9 | 1.06 | 1.25 | 0.85 | 0.97 | 0.85 | 0.015 | 1.20 | 4,5 |  |  |  |  |  |  |
| 3890 | 67.75 | 0.01 | 0.8 | 0.95 | 1.25 | 0.76 | 0.90 | 0.76 | 0.012 | 1.41 | 4,5 |  |  |  |  |  |  |
| 3890 + 1/2 | 67.61 | 0.01 | 0.7 | 0.89 | 1.24 | 0.72 | 0.87 | 0.72 | 0.003 | 1.52 | 4,5 |  |  |  |  |  |  |
| 3891 | 67.49 | 0.01 | 1.0 | 0.98 | 1.24 | 0.79 | 0.92 | 0.79 | 0.016 | 1.61 | 4,5 |  |  |  |  |  |  |
| 3891 + 1/2 | 67.39 | 0.02 | 1.4 | 1.08 | 1.23 | 0.88 | 0.98 | 0.88 | 0.034 | 1.81 | 4,6 |  |  |  |  |  |  |
| 3892 | 67.32 | 0.01 | 1.9 | 1.20 | 1.23 | 0.98 | 1.01 | 0.98 | 0.057 | 2.06 | 4,6 |  |  |  |  |  |  |
| 3892 + 1/2 | 67.27 | 0.02 | 2.5 | 1.27 | 1.21 | 1.05 | 1.03 | 1.03 | 0.104 | 2.19 | 4,6 |  |  |  |  |  |  |
| 3893 | 67.26 | 0.01 | 3.2 | 1.30 | 1.20 | 1.08 | 0.82 | 0.82 | 0.157 | 1.88 | 8,8 |  |  |  |  |  |  |
| 3893 + 1/2 | 67.26 | 0.00 | 4.4 | 1.32 | 1.19 | 1.10 | 0.85 | 0.85 | 0.167 | 1.93 | 6,3 |  |  |  |  |  |  |
| 3894 | 67.25 | 0.01 | 4.0 | 1.34 | 1.19 | 1.12 | 0.96 | 0.96 | 0.113 | 2.16 | 8,8 |  |  |  |  |  |  |
| 3894 + 1/2 | 67.23 | 0.03 | 4.7 | 1.23 | 1.17 | 1.05 | 1.00 | 1.00 | 0.079 | 2.32 | 9,6 |  |  |  |  |  |  |
| 3895 | 67.14 | 0.03 | 5.3 | 1.19 | 1.15 | 1.03 | 1.04 | 1.03 | 0.069 | 2.90 | 9,6 |  |  |  |  |  |  |
| 3895 + 1/2 | 67.00 | 0.01 | 6.2 | 1.25 | 1.15 | 1.09 | 1.12 | 1.09 | 0.088 | 4.21 | 9,6 |  |  |  |  |  |  |
| 3896 | 66.87 | 0.02 | 6.8 | 1.30 | 1.14 | 1.14 | 1.14 | 1.14 | 0.051 | 5.91 | 9,6 |  |  |  |  |  |  |
| 3896 + 1/2 | 66.70 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### rise, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.203 from frame 3873 + 1/2 to the next, limit 1.2.
Largest pop score of one block: 9.94 from frame 3896 to the next, block column 9 row 6 from the top left, shown, not judged.
Largest change in place: 18.9 from frame 3829 to 8 film frames later, most at pixel 80, 796, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 3798 to 3809 + 1/2): change 10.0; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.159 from frame 3838 + 1/2 to the next, most at pixel 1238, 786, a patch of 164 by 220 px; 0 of 197 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 198 rows, which says nothing of them, quiet or not: frame 3896 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 3838 + 1/2 in /home/user/workspace/work/p6/ht9/03/saturn-rise-p1of2-pops-full.png, frame 3873 in /home/user/workspace/work/p6/ht9/04/saturn-rise-p2of2-pops-full.png, frame 3873 + 1/2 in /home/user/workspace/work/p6/ht9/04/saturn-rise-p2of2-pops-full.png, frame 3874 in /home/user/workspace/work/p6/ht9/04/saturn-rise-p2of2-pops-full.png, frame 3877 in /home/user/workspace/work/p6/ht9/04/saturn-rise-p2of2-pops-full.png.

With the carry at the full size the rise has 1 number over the limit or not measured.

- FULL SIZE RED pop score 1.203 from frame 3873 + 1/2 to the next, limit 1.2

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3798 | 1.7 | 0.41 | 0.40 | 1.02 | 1.02 | 1.02 | 0.023 | 1.41 | 3,8 | 9.9 | 12.5 | 0.67 | 1.01 | 0.249 | 0.248 | 0.994 | 0.313 | 1270,714 | 104 by 80 |
| 3798 + 1/2 | 1.7 | 0.40 | 0.40 | 1.00 | 1.01 | 1.00 | 0.027 | 1.22 | 3,8 | 9.8 | 12.8 | 0.67 | 1.01 | 0.250 | 0.248 | 0.999 | 0.312 | 1322,698 | 80 by 144 |
| 3799 | 1.7 | 0.41 | 0.40 | 1.01 | 1.01 | 1.01 | 0.033 | 1.22 | 3,4 | 9.9 | 12.9 | 0.67 | 0.99 | 0.249 | 0.248 | 0.996 | 0.311 | 1366,622 | 108 by 128 |
| 3799 + 1/2 | 1.7 | 0.40 | 0.40 | 1.00 | 1.01 | 1.00 | 0.024 | 1.23 | 4,3 | 10.0 | 11.7 | 0.67 | 0.98 | 0.247 | 0.247 | 0.988 | 0.311 | 1410,438 | 92 by 100 |
| 3800 | 1.8 | 0.41 | 0.40 | 1.02 | 1.00 | 1.00 | 0.035 | 1.57 | 4,3 | 9.9 | 11.7 | 0.66 | 0.99 | 0.244 | 0.246 | 0.976 | 0.311 | 1398,490 | 80 by 52 |
| 3800 + 1/2 | 1.7 | 0.40 | 0.40 | 0.99 | 0.97 | 0.97 | 0.036 | 1.19 | 12,0 | 9.8 | 11.8 | 0.66 | 0.97 | 0.245 | 0.245 | 0.979 | 0.310 | 1254,694 | 160 by 188 |
| 3801 | 1.8 | 0.41 | 0.40 | 1.02 | 1.01 | 1.01 | 0.028 | 1.51 | 2,5 | 9.8 | 11.5 | 0.66 | 1.00 | 0.246 | 0.244 | 0.983 | 0.310 | 1302,714 | 92 by 96 |
| 3801 + 1/2 | 1.8 | 0.40 | 0.40 | 0.99 | 0.99 | 0.99 | 0.033 | 1.37 | 2,5 | 9.6 | 11.6 | 0.66 | 0.98 | 0.242 | 0.246 | 0.969 | 0.309 | 1410,462 | 140 by 112 |
| 3802 | 1.8 | 0.40 | 0.40 | 1.00 | 1.02 | 1.00 | 0.019 | 1.44 | 1,4 | 9.7 | 11.7 | 0.66 | 0.99 | 0.246 | 0.244 | 0.984 | 0.309 | 1242,722 | 128 by 88 |
| 3802 + 1/2 | 1.8 | 0.40 | 0.40 | 1.00 | 0.98 | 0.98 | 0.034 | 1.21 | 3,3 | 9.4 | 11.5 | 0.66 | 0.96 | 0.246 | 0.243 | 0.983 | 0.308 | 1346,654 | 92 by 84 |
| 3803 | 1.8 | 0.40 | 0.40 | 0.99 | 0.99 | 0.99 | 0.028 | 1.35 | 2,4 | 9.2 | 11.5 | 0.66 | 0.98 | 0.243 | 0.245 | 0.970 | 0.308 | 1142,714 | 76 by 80 |
| 3803 + 1/2 | 1.9 | 0.41 | 0.40 | 1.01 | 1.01 | 1.01 | 0.025 | 1.43 | 1,4 | 9.3 | 11.6 | 0.66 | 0.99 | 0.244 | 0.243 | 0.977 | 0.307 | 1254,734 | 128 by 96 |
| 3804 | 1.8 | 0.40 | 0.40 | 1.00 | 0.99 | 0.99 | 0.031 | 1.31 | 3,5 | 9.4 | 11.7 | 0.66 | 0.99 | 0.243 | 0.244 | 0.972 | 0.307 | 1390,610 | 168 by 164 |
| 3804 + 1/2 | 1.8 | 0.40 | 0.40 | 0.99 | 0.98 | 0.98 | 0.031 | 1.30 | 3,4 | 9.6 | 12.5 | 0.65 | 0.96 | 0.244 | 0.244 | 0.974 | 0.306 | 1430,462 | 100 by 84 |
| 3805 | 1.8 | 0.39 | 0.40 | 0.98 | 0.97 | 0.97 | 0.040 | 1.32 | 4,3 | 10.1 | 13.9 | 0.65 | 0.96 | 0.246 | 0.242 | 0.984 | 0.306 | 1318,686 | 72 by 72 |
| 3805 + 1/2 | 1.8 | 0.40 | 0.40 | 0.99 | 0.99 | 0.99 | 0.033 | 1.45 | 2,5 | 10.2 | 13.5 | 0.65 | 0.99 | 0.241 | 0.243 | 0.965 | 0.305 | 1254,702 | 88 by 96 |
| 3806 | 1.8 | 0.39 | 0.40 | 0.96 | 0.98 | 0.96 | 0.020 | 1.10 | 8,2 | 10.4 | 16.6 | 0.65 | 1.00 | 0.242 | 0.243 | 0.968 | 0.305 | 1290,750 | 68 by 68 |
| 3806 + 1/2 | 1.8 | 0.39 | 0.40 | 0.97 | 0.96 | 0.96 | 0.033 | 1.21 | 3,4 | 10.5 | 17.1 | 0.64 | 0.98 | 0.243 | 0.242 | 0.972 | 0.304 | 1322,626 | 184 by 148 |
| 3807 | 1.8 | 0.39 | 0.40 | 0.97 | 0.97 | 0.97 | 0.028 | 1.23 | 12,0 | 10.3 | 17.6 | 0.62 | 1.02 | 0.243 | 0.243 | 0.971 | 0.304 | 1326,602 | 148 by 156 |
| 3807 + 1/2 | 1.8 | 0.39 | 0.40 | 0.97 | 0.99 | 0.97 | 0.025 | 1.44 | 3,4 | 10.4 | 18.2 | 0.61 | 0.99 | 0.240 | 0.243 | 0.958 | 0.303 | 1694,818 | 76 by 88 |
| 3808 | 1.8 | 0.39 | 0.40 | 0.97 | 0.99 | 0.97 | 0.020 | 1.71 | 0,5 | 10.5 | 18.7 | 0.58 | 0.98 | 0.244 | 0.241 | 0.977 | 0.303 | 1266,742 | 100 by 100 |
| 3808 + 1/2 | 1.8 | 0.38 | 0.40 | 0.96 | 0.95 | 0.95 | 0.031 | 1.16 | 5,3 | 10.4 | 19.2 | 0.57 | 0.95 | 0.241 | 0.241 | 0.966 | 0.302 | 1514,290 | 156 by 168 |
| 3809 | 1.8 | 0.39 | 0.40 | 0.97 | 0.97 | 0.97 | 0.032 | 1.75 | 0,5 | 10.6 | 19.8 | 0.57 | 0.95 | 0.241 | 0.241 | 0.966 | 0.302 | 1274,618 | 108 by 152 |
| 3809 + 1/2 | 1.8 | 0.39 | 0.40 | 0.96 | 0.96 | 0.96 | 0.031 | 1.40 | 2,4 | 11.0 | 20.1 | 0.57 | 0.97 | 0.241 | 0.241 | 0.963 | 0.301 | 1278,742 | 112 by 76 |
| 3810 | 1.9 | 0.40 | 0.41 | 0.98 | 0.97 | 0.97 | 0.033 | 1.42 | 3,4 | 11.2 | 20.6 | 0.57 | 0.94 | 0.240 | 0.241 | 0.962 | 0.301 | 1342,654 | 56 by 80 |
| 3810 + 1/2 | 2.1 | 0.41 | 0.41 | 1.00 | 1.00 | 1.00 | 0.038 | 1.65 | 0,5 | 11.2 | 21.2 | 0.56 | 1.00 | 0.238 | 0.241 | 0.953 | 0.300 | 1182,738 | 60 by 68 |
| 3811 | 2.4 | 0.42 | 0.42 | 0.99 | 1.01 | 0.99 | 0.043 | 1.32 | 3,3 | 11.3 | 21.5 | 0.55 | 1.03 | 0.242 | 0.240 | 0.968 | 0.300 | 1318,714 | 68 by 80 |
| 3811 + 1/2 | 2.5 | 0.44 | 0.43 | 1.04 | 1.07 | 1.04 | 0.027 | 1.86 | 0,5 | 11.4 | 21.7 | 0.55 | 1.05 | 0.240 | 0.242 | 0.959 | 0.300 | 1498,414 | 116 by 108 |
| 3812 | 2.7 | 0.44 | 0.44 | 1.00 | 1.08 | 1.00 | 0.016 | 1.31 | 5,8 | 10.8 | 23.1 | 0.54 | 1.07 | 0.243 | 0.243 | 0.972 | 0.300 | 1378,474 | 136 by 100 |
| 3812 + 1/2 | 3.0 | 0.45 | 0.44 | 1.03 | 1.06 | 1.03 | 0.037 | 1.27 | 10,6 | 10.2 | 14.2 | 0.53 | 1.09 | 0.244 | 0.242 | 0.976 | 0.299 | 1254,774 | 96 by 136 |
| 3813 | 3.2 | 0.45 | 0.44 | 1.03 | 1.05 | 1.03 | 0.038 | 1.48 | 0,5 | 10.1 | 14.8 | 0.53 | 1.06 | 0.245 | 0.243 | 0.981 | 0.300 | 1426,378 | 192 by 148 |
| 3813 + 1/2 | 3.4 | 0.44 | 0.44 | 0.98 | 1.01 | 0.98 | 0.036 | 1.25 | 7,5 | 10.3 | 14.9 | 0.53 | 1.08 | 0.240 | 0.244 | 0.962 | 0.299 | 1446,382 | 92 by 84 |
| 3814 | 3.5 | 0.43 | 0.45 | 0.97 | 0.97 | 0.97 | 0.041 | 1.29 | 3,8 | 10.4 | 18.8 | 0.51 | 1.07 | 0.243 | 0.242 | 0.974 | 0.299 | 1430,246 | 128 by 120 |
| 3814 + 1/2 | 3.7 | 0.45 | 0.45 | 1.00 | 1.00 | 1.00 | 0.052 | 1.27 | 4,8 | 10.3 | 14.4 | 0.50 | 1.12 | 0.240 | 0.244 | 0.962 | 0.299 | 1290,650 | 88 by 92 |
| 3815 | 3.8 | 0.46 | 0.45 | 1.03 | 1.05 | 1.03 | 0.035 | 1.90 | 0,5 | 10.3 | 14.6 | 0.50 | 1.07 | 0.244 | 0.243 | 0.977 | 0.300 | 1478,350 | 100 by 108 |
| 3815 + 1/2 | 4.0 | 0.44 | 0.46 | 0.97 | 0.94 | 0.94 | 0.076 | 1.21 | 7,5 | 10.1 | 15.5 | 0.50 | 1.03 | 0.245 | 0.244 | 0.982 | 0.300 | 1426,422 | 84 by 68 |
| 3816 | 4.1 | 0.45 | 0.46 | 0.99 | 1.01 | 0.99 | 0.051 | 1.31 | 2,8 | 10.2 | 14.5 | 0.50 | 1.06 | 0.243 | 0.245 | 0.972 | 0.300 | 1462,262 | 256 by 248 |
| 3816 + 1/2 | 4.2 | 0.46 | 0.46 | 0.99 | 1.00 | 0.99 | 0.067 | 1.34 | 3,8 | 9.9 | 14.0 | 0.45 | 1.08 | 0.245 | 0.246 | 0.981 | 0.300 | 1486,194 | 64 by 48 |
| 3817 | 4.4 | 0.47 | 0.46 | 1.01 | 1.03 | 1.01 | 0.053 | 1.73 | 3,8 | 10.2 | 13.9 | 0.44 | 1.05 | 0.246 | 0.245 | 0.986 | 0.300 | 1522,302 | 136 by 156 |
| 3817 + 1/2 | 4.6 | 0.46 | 0.46 | 1.00 | 1.03 | 1.00 | 0.052 | 1.57 | 4,6 | 10.3 | 14.8 | 0.44 | 1.06 | 0.246 | 0.248 | 0.983 | 0.300 | 1442,298 | 56 by 80 |
| 3818 | 4.6 | 0.46 | 0.47 | 0.99 | 1.01 | 0.99 | 0.060 | 1.60 | 2,8 | 10.6 | 14.4 | 0.44 | 1.03 | 0.249 | 0.249 | 0.995 | 0.300 | 1394,418 | 112 by 136 |
| 3818 + 1/2 | 4.6 | 0.47 | 0.47 | 1.00 | 1.01 | 1.00 | 0.069 | 1.34 | 5,3 | 10.5 | 13.1 | 0.45 | 0.96 | 0.251 | 0.250 | 1.003 | 0.300 | 1470,210 | 144 by 144 |
| 3819 | 4.9 | 0.48 | 0.47 | 1.03 | 1.08 | 1.03 | 0.040 | 1.47 | 0,5 | 10.6 | 13.8 | 0.45 | 1.01 | 0.252 | 0.251 | 1.003 | 0.300 | 1422,398 | 88 by 88 |
| 3819 + 1/2 | 5.0 | 0.46 | 0.47 | 0.99 | 0.99 | 0.99 | 0.071 | 1.21 | 7,6 | 10.9 | 15.5 | 0.45 | 0.97 | 0.251 | 0.253 | 0.991 | 0.300 | 1350,454 | 160 by 208 |
| 3820 | 5.1 | 0.47 | 0.48 | 0.98 | 0.93 | 0.93 | 0.105 | 1.20 | 10,7 | 11.0 | 16.1 | 0.45 | 0.88 | 0.255 | 0.253 | 1.005 | 0.301 | 1478,346 | 148 by 124 |
| 3820 + 1/2 | 5.3 | 0.48 | 0.48 | 1.00 | 1.03 | 1.00 | 0.050 | 1.21 | 1,8 | 11.1 | 15.2 | 0.45 | 1.01 | 0.255 | 0.256 | 0.997 | 0.301 | 1526,254 | 128 by 132 |
| 3821 | 5.5 | 0.48 | 0.48 | 1.01 | 1.01 | 1.01 | 0.073 | 1.46 | 0,5 | 11.4 | 15.9 | 0.45 | 0.98 | 0.257 | 0.257 | 1.002 | 0.301 | 1390,558 | 72 by 60 |
| 3821 + 1/2 | 5.6 | 0.48 | 0.48 | 1.01 | 0.94 | 0.94 | 0.113 | 1.28 | 0,6 | 11.2 | 15.7 | 0.45 | 0.89 | 0.259 | 0.259 | 0.998 | 0.301 | 1390,214 | 68 by 48 |
| 3822 | 5.6 | 0.48 | 0.48 | 0.98 | 0.98 | 0.98 | 0.082 | 1.21 | 13,1 | 11.3 | 16.4 | 0.45 | 0.98 | 0.261 | 0.260 | 1.003 | 0.301 | 1494,330 | 100 by 168 |
| 3822 + 1/2 | 5.7 | 0.48 | 0.49 | 0.98 | 0.96 | 0.96 | 0.097 | 1.21 | 3,4 | 11.6 | 16.6 | 0.45 | 0.91 | 0.261 | 0.264 | 0.991 | 0.301 | 1522,350 | 232 by 124 |
| 3823 | 6.0 | 0.49 | 0.49 | 1.01 | 0.99 | 0.99 | 0.095 | 1.49 | 0,6 | 12.3 | 17.5 | 0.45 | 0.91 | 0.267 | 0.265 | 1.006 | 0.301 | 1334,554 | 128 by 116 |
| 3823 + 1/2 | 6.1 | 0.49 | 0.49 | 1.01 | 0.99 | 0.99 | 0.089 | 1.25 | 3,4 | 12.6 | 17.7 | 0.45 | 0.91 | 0.269 | 0.268 | 1.007 | 0.301 | 1350,658 | 88 by 84 |
| 3824 | 6.2 | 0.49 | 0.49 | 1.00 | 0.90 | 0.90 | 0.163 | 1.43 | 0,5 | 13.9 | 18.0 | 0.45 | 0.78 | 0.269 | 0.273 | 0.985 | 0.301 | 1350,470 | 108 by 68 |
| 3824 + 1/2 | 6.5 | 0.49 | 0.49 | 0.99 | 0.95 | 0.95 | 0.108 | 1.22 | 12,8 | 14.4 | 18.1 | 0.45 | 0.90 | 0.278 | 0.273 | 1.019 | 0.300 | 1342,566 | 92 by 104 |
| 3825 | 6.5 | 0.49 | 0.50 | 0.99 | 0.91 | 0.91 | 0.139 | 1.22 | 12,8 | 14.8 | 17.4 | 0.45 | 0.91 | 0.276 | 0.279 | 0.987 | 0.300 | 1482,266 | 84 by 92 |
| 3825 + 1/2 | 6.7 | 0.50 | 0.50 | 1.01 | 0.98 | 0.98 | 0.091 | 1.24 | 12,8 | 15.6 | 18.5 | 0.44 | 0.91 | 0.281 | 0.280 | 1.001 | 0.299 | 1354,466 | 120 by 84 |
| 3826 | 6.8 | 0.50 | 0.50 | 1.00 | 1.02 | 1.00 | 0.071 | 1.34 | 0,5 | 16.1 | 18.6 | 0.44 | 0.97 | 0.283 | 0.283 | 0.998 | 0.299 | 1470,422 | 128 by 88 |
| 3826 + 1/2 | 6.9 | 0.51 | 0.50 | 1.01 | 1.04 | 1.01 | 0.062 | 1.59 | 2,5 | 16.2 | 18.6 | 0.44 | 0.97 | 0.289 | 0.285 | 1.016 | 0.298 | 1338,646 | 144 by 208 |
| 3827 | 7.0 | 0.50 | 0.51 | 0.99 | 0.98 | 0.98 | 0.081 | 1.28 | 13,2 | 16.8 | 18.8 | 0.43 | 0.95 | 0.286 | 0.292 | 0.980 | 0.297 | 1298,754 | 136 by 104 |
| 3827 + 1/2 | 7.0 | 0.51 | 0.51 | 1.00 | 0.96 | 0.96 | 0.104 | 1.30 | 11,1 | 17.4 | 19.3 | 0.42 | 0.91 | 0.295 | 0.294 | 1.005 | 0.295 | 1450,318 | 140 by 120 |
| 3828 | 7.2 | 0.52 | 0.51 | 1.01 | 0.98 | 0.98 | 0.100 | 1.36 | 13,2 | 18.5 | 20.0 | 0.40 | 0.93 | 0.298 | 0.296 | 1.007 | 0.293 | 1898,746 | 40 by 76 |
| 3828 + 1/2 | 7.5 | 0.52 | 0.52 | 1.00 | 1.01 | 1.00 | 0.081 | 1.38 | 13,2 | 18.8 | 20.3 | 0.40 | 0.96 | 0.299 | 0.298 | 1.006 | 0.291 | 1454,454 | 84 by 108 |
| 3829 | 7.5 | 0.52 | 0.52 | 0.99 | 1.03 | 0.99 | 0.071 | 1.35 | 3,5 | 18.9 | 20.5 | 0.39 | 0.97 | 0.297 | 0.301 | 0.985 | 0.290 | 1362,490 | 56 by 132 |
| 3829 + 1/2 | 7.7 | 0.53 | 0.52 | 1.00 | 1.05 | 1.00 | 0.075 | 1.29 | 2,5 | 18.5 | 21.5 | 0.38 | 0.97 | 0.307 | 0.301 | 1.019 | 0.288 | 1434,274 | 100 by 48 |
| 3830 | 7.9 | 0.53 | 0.53 | 0.99 | 1.07 | 0.99 | 0.062 | 1.53 | 3,7 | 17.4 | 19.9 | 0.37 | 0.99 | 0.303 | 0.308 | 0.985 | 0.286 | 1362,654 | 124 by 88 |
| 3830 + 1/2 | 8.1 | 0.54 | 0.53 | 1.01 | 1.02 | 1.01 | 0.081 | 1.35 | 1,8 | 17.4 | 20.5 | 0.34 | 1.00 | 0.313 | 0.308 | 1.018 | 0.284 | 1294,638 | 92 by 84 |
| 3831 | 8.2 | 0.53 | 0.54 | 1.00 | 1.04 | 1.00 | 0.070 | 1.55 | 2,5 | 15.2 | 21.0 | 0.34 | 1.00 | 0.309 | 0.315 | 0.979 | 0.283 | 1438,458 | 44 by 52 |
| 3831 + 1/2 | 8.5 | 0.54 | 0.54 | 1.01 | 1.06 | 1.01 | 0.067 | 1.39 | 4,8 | 14.8 | 21.4 | 0.33 | 1.00 | 0.323 | 0.315 | 1.023 | 0.281 | 1470,334 | 148 by 84 |
| 3832 | 8.6 | 0.55 | 0.54 | 1.02 | 1.06 | 1.02 | 0.080 | 1.61 | 3,5 | 14.5 | 19.6 | 0.33 | 1.03 | 0.317 | 0.317 | 1.000 | 0.280 | 1462,398 | 88 by 124 |
| 3832 + 1/2 | 8.8 | 0.55 | 0.54 | 1.01 | 1.02 | 1.01 | 0.093 | 1.66 | 15,5 | 14.9 | 20.6 | 0.33 | 1.02 | 0.319 | 0.320 | 0.998 | 0.278 | 1210,818 | 104 by 124 |
| 3833 | 9.0 | 0.55 | 0.54 | 1.01 | 0.99 | 0.99 | 0.116 | 1.53 | 15,5 | 14.4 | 17.6 | 0.33 | 0.98 | 0.316 | 0.320 | 0.988 | 0.277 | 1438,358 | 68 by 64 |
| 3833 + 1/2 | 9.3 | 0.56 | 0.54 | 1.02 | 1.02 | 1.02 | 0.106 | 1.44 | 15,5 | 13.8 | 18.0 | 0.33 | 1.05 | 0.322 | 0.320 | 1.008 | 0.275 | 1330,590 | 120 by 76 |
| 3834 | 9.5 | 0.54 | 0.55 | 1.00 | 0.98 | 0.98 | 0.128 | 1.81 | 15,5 | 13.6 | 16.7 | 0.33 | 1.02 | 0.320 | 0.326 | 0.983 | 0.274 | 1290,742 | 112 by 152 |
| 3834 + 1/2 | 9.6 | 0.56 | 0.55 | 1.02 | 1.00 | 1.00 | 0.124 | 1.38 | 0,4 | 13.5 | 20.4 | 0.33 | 1.00 | 0.329 | 0.323 | 1.019 | 0.272 | 1386,486 | 124 by 124 |
| 3835 | 9.9 | 0.56 | 0.55 | 1.03 | 1.00 | 1.00 | 0.116 | 1.35 | 0,5 | 11.9 | 14.7 | 0.33 | 1.00 | 0.333 | 0.323 | 1.031 | 0.271 | 1418,426 | 164 by 296 |
| 3835 + 1/2 | 10.2 | 0.55 | 0.55 | 1.00 | 0.96 | 0.96 | 0.128 | 1.48 | 3,5 | 12.7 | 19.1 | 0.34 | 1.02 | 0.324 | 0.331 | 0.978 | 0.269 | 1290,746 | 100 by 104 |
| 3836 | 10.4 | 0.55 | 0.55 | 1.00 | 0.96 | 0.96 | 0.136 | 1.75 | 2,5 | 9.1 | 14.5 | 0.34 | 1.01 | 0.322 | 0.333 | 0.967 | 0.268 | 1178,834 | 68 by 104 |
| 3836 + 1/2 | 10.7 | 0.55 | 0.55 | 1.00 | 1.02 | 1.00 | 0.109 | 1.75 | 2,6 | 10.2 | 14.2 | 0.37 | 1.08 | 0.339 | 0.329 | 1.031 | 0.266 | 1390,442 | 96 by 128 |
| 3837 | 11.0 | 0.54 | 0.55 | 0.99 | 0.98 | 0.98 | 0.109 | 1.61 | 2,5 | 9.4 | 15.0 | 0.37 | 1.06 | 0.334 | 0.329 | 1.014 | 0.265 | 1374,358 | 88 by 104 |
| 3837 + 1/2 | 11.2 | 0.54 | 0.55 | 0.99 | 0.95 | 0.95 | 0.119 | 1.54 | 5,5 | 9.6 | 14.1 | 0.37 | 1.00 | 0.334 | 0.336 | 0.992 | 0.264 | 1302,354 | 100 by 96 |
| 3838 | 11.4 | 0.54 | 0.55 | 0.98 | 0.92 | 0.92 | 0.117 | 1.86 | 5,6 | 10.4 | 13.3 | 0.38 | 0.94 | 0.325 | 0.391 | 0.831 | 0.262 | 1406,378 | 48 by 44 |
| 3838 + 1/2 | 11.6 | 0.57 | 0.55 | 1.04 | 1.00 | 1.00 | 0.113 | 2.02 | 12,7 | 10.5 | 12.0 | 0.38 | 0.92 | 0.448 | 0.387 | 1.159 | 0.261 | 1238,786 | 164 by 220 |
| 3839 | 11.9 | 0.57 | 0.55 | 1.03 | 0.99 | 0.99 | 0.119 | 2.02 | 10,6 | 10.7 | 12.0 | 0.38 | 0.88 | 0.461 | 0.434 | 1.061 | 0.260 | 1234,786 | 212 by 288 |
| 3839 + 1/2 | 12.2 | 0.57 | 0.55 | 1.04 | 0.99 | 0.99 | 0.102 | 1.92 | 12,7 | 10.2 | 11.8 | 0.40 | 0.88 | 0.440 | 0.439 | 1.004 | 0.259 | 1346,586 | 244 by 256 |
| 3840 | 12.2 | 0.56 | 0.55 | 1.01 | 1.01 | 1.01 | 0.084 | 1.76 | 12,7 | 10.1 | 12.1 | 0.40 | 0.88 | 0.429 | 0.433 | 0.990 | 0.258 | 1358,502 | 108 by 80 |
| 3840 + 1/2 | 12.3 | 0.55 | 0.55 | 1.01 | 1.03 | 1.01 | 0.085 | 1.83 | 5,6 | 10.0 | 12.1 | 0.40 | 0.92 | 0.425 | 0.425 | 1.001 | 0.257 | 1150,882 | 116 by 164 |
| 3841 | 12.4 | 0.56 | 0.55 | 1.02 | 1.04 | 1.02 | 0.079 | 1.75 | 5,6 | 9.8 | 12.2 | 0.40 | 0.96 | 0.422 | 0.419 | 1.007 | 0.256 | 1266,682 | 68 by 80 |
| 3841 + 1/2 | 12.5 | 0.57 | 0.55 | 1.03 | 1.04 | 1.03 | 0.072 | 1.61 | 9,6 | 9.9 | 12.3 | 0.40 | 0.99 | 0.412 | 0.410 | 1.005 | 0.255 | 1178,814 | 60 by 64 |
| 3842 | 12.6 | 0.55 | 0.55 | 1.00 | 1.02 | 1.00 | 0.077 | 1.60 | 9,6 | 9.8 | 12.1 | 0.40 | 0.96 | 0.399 | 0.400 | 0.996 | 0.253 | 1202,734 | 72 by 104 |
| 3842 + 1/2 | 12.9 | 0.55 | 0.55 | 1.01 | 0.98 | 0.98 | 0.085 | 1.52 | 9,6 | 9.8 | 12.1 | 0.40 | 0.95 | 0.389 | 0.393 | 0.989 | 0.252 | 1238,686 | 92 by 112 |
| 3843 | 12.9 | 0.54 | 0.55 | 0.98 | 0.97 | 0.97 | 0.083 | 1.58 | 10,4 | 9.8 | 12.0 | 0.40 | 0.96 | 0.388 | 0.382 | 1.014 | 0.251 | 1306,534 | 112 by 208 |
| 3843 + 1/2 | 13.0 | 0.57 | 0.55 | 1.04 | 1.02 | 1.02 | 0.074 | 1.84 | 10,2 | 9.8 | 11.8 | 0.40 | 0.98 | 0.375 | 0.376 | 0.998 | 0.250 | 1282,534 | 92 by 92 |
| 3844 | 13.0 | 0.56 | 0.55 | 1.02 | 1.00 | 1.00 | 0.074 | 1.96 | 4,5 | 9.6 | 11.6 | 0.40 | 1.01 | 0.365 | 0.372 | 0.981 | 0.249 | 1042,930 | 100 by 140 |
| 3844 + 1/2 | 12.8 | 0.53 | 0.55 | 0.97 | 1.01 | 0.97 | 0.063 | 1.90 | 4,5 | 9.6 | 11.4 | 0.40 | 1.01 | 0.364 | 0.367 | 0.993 | 0.248 | 1270,390 | 108 by 60 |
| 3845 | 12.9 | 0.54 | 0.55 | 0.98 | 1.01 | 0.98 | 0.059 | 1.94 | 4,4 | 9.5 | 11.1 | 0.39 | 0.99 | 0.369 | 0.360 | 1.026 | 0.246 | 1258,530 | 56 by 88 |
| 3845 + 1/2 | 12.9 | 0.53 | 0.55 | 0.95 | 0.97 | 0.95 | 0.051 | 2.24 | 4,4 | 9.4 | 10.7 | 0.38 | 0.99 | 0.355 | 0.356 | 0.999 | 0.245 | 1178,374 | 68 by 72 |
| 3846 | 12.8 | 0.53 | 0.55 | 0.97 | 1.00 | 0.97 | 0.054 | 2.20 | 4,4 | 9.3 | 10.6 | 0.38 | 0.97 | 0.347 | 0.350 | 0.992 | 0.244 | 1270,450 | 64 by 108 |
| 3846 + 1/2 | 12.7 | 0.53 | 0.55 | 0.96 | 0.96 | 0.96 | 0.059 | 2.31 | 4,4 | 9.3 | 11.2 | 0.38 | 0.98 | 0.339 | 0.347 | 0.976 | 0.243 | 1202,410 | 68 by 52 |
| 3847 | 12.9 | 0.55 | 0.55 | 1.00 | 1.00 | 1.00 | 0.048 | 2.28 | 4,4 | 9.4 | 12.4 | 0.37 | 0.96 | 0.344 | 0.343 | 1.004 | 0.242 | 1086,350 | 68 by 72 |
| 3847 + 1/2 | 12.7 | 0.54 | 0.55 | 0.98 | 0.99 | 0.98 | 0.052 | 2.10 | 4,4 | 9.5 | 14.4 | 0.37 | 0.94 | 0.348 | 0.337 | 1.031 | 0.241 | 910,954 | 88 by 72 |
| 3848 | 12.6 | 0.54 | 0.55 | 0.98 | 1.01 | 0.98 | 0.048 | 1.86 | 4,4 | 9.8 | 13.7 | 0.37 | 0.92 | 0.335 | 0.338 | 0.992 | 0.239 | 1222,466 | 108 by 148 |
| 3848 + 1/2 | 12.5 | 0.56 | 0.55 | 1.01 | 1.00 | 1.00 | 0.044 | 2.09 | 15,7 | 9.9 | 15.7 | 0.36 | 0.92 | 0.331 | 0.331 | 1.001 | 0.238 | 1190,578 | 132 by 84 |
| 3849 | 12.2 | 0.53 | 0.55 | 0.96 | 0.97 | 0.96 | 0.049 | 1.88 | 15,7 | 9.7 | 14.9 | 0.33 | 0.93 | 0.326 | 0.329 | 0.991 | 0.237 | 1082,358 | 60 by 56 |
| 3849 + 1/2 | 12.1 | 0.54 | 0.55 | 0.97 | 0.98 | 0.97 | 0.051 | 1.96 | 15,7 | 10.0 | 20.6 | 0.33 | 0.95 | 0.327 | 0.323 | 1.013 | 0.236 | 1014,970 | 188 by 96 |
| 3850 | 12.1 | 0.53 | 0.55 | 0.96 | 0.97 | 0.96 | 0.057 | 2.04 | 15,7 | 10.2 | 15.0 | 0.32 | 0.97 | 0.318 | 0.323 | 0.984 | 0.234 | 1022,882 | 212 by 112 |
| 3850 + 1/2 | 11.9 | 0.54 | 0.55 | 0.98 | 1.00 | 0.98 | 0.055 | 2.03 | 15,7 | 10.6 | 16.0 | 0.32 | 0.99 | 0.319 | 0.321 | 0.994 | 0.233 | 1210,934 | 104 by 140 |
| 3851 | 11.7 | 0.54 | 0.55 | 0.98 | 0.98 | 0.98 | 0.062 | 2.17 | 15,7 | 10.6 | 18.4 | 0.31 | 0.99 | 0.318 | 0.318 | 1.000 | 0.231 | 1150,446 | 88 by 100 |
| 3851 + 1/2 | 11.7 | 0.55 | 0.55 | 1.00 | 0.96 | 0.96 | 0.081 | 1.82 | 15,7 | 10.9 | 20.3 | 0.31 | 0.97 | 0.323 | 0.316 | 1.025 | 0.230 | 1138,838 | 228 by 128 |
| 3852 | 11.5 | 0.55 | 0.55 | 1.00 | 0.97 | 0.97 | 0.076 | 2.36 | 15,8 | 11.4 | 21.7 | 0.31 | 0.97 | 0.313 | 0.315 | 0.993 | 0.228 | 1206,914 | 228 by 144 |
| 3852 + 1/2 | 11.4 | 0.57 | 0.55 | 1.03 | 1.00 | 1.00 | 0.083 | 3.55 | 15,8 | 10.6 | 21.3 | 0.30 | 0.96 | 0.312 | 0.307 | 1.017 | 0.227 | 1006,366 | 192 by 132 |
| 3853 | 11.1 | 0.57 | 0.55 | 1.04 | 1.02 | 1.02 | 0.073 | 4.40 | 15,8 | 9.7 | 20.9 | 0.30 | 1.01 | 0.301 | 0.300 | 1.002 | 0.225 | 1106,830 | 124 by 120 |
| 3853 + 1/2 | 10.9 | 0.57 | 0.55 | 1.03 | 1.00 | 1.00 | 0.075 | 4.62 | 15,8 | 9.4 | 20.7 | 0.29 | 0.99 | 0.288 | 0.290 | 0.993 | 0.223 | 990,718 | 196 by 168 |
| 3854 | 10.5 | 0.55 | 0.55 | 1.00 | 1.03 | 1.00 | 0.058 | 5.02 | 15,8 | 8.3 | 22.6 | 0.29 | 0.98 | 0.279 | 0.283 | 0.987 | 0.222 | 994,954 | 84 by 108 |
| 3854 + 1/2 | 10.5 | 0.56 | 0.55 | 1.02 | 1.01 | 1.01 | 0.084 | 4.51 | 15,8 | 8.3 | 21.5 | 0.28 | 0.96 | 0.278 | 0.278 | 1.001 | 0.220 | 1062,446 | 92 by 168 |
| 3855 | 10.2 | 0.57 | 0.55 | 1.04 | 1.03 | 1.03 | 0.072 | 4.39 | 15,8 | 8.3 | 21.2 | 0.29 | 1.00 | 0.276 | 0.267 | 1.032 | 0.218 | 830,866 | 136 by 128 |
| 3855 + 1/2 | 10.0 | 0.55 | 0.55 | 1.00 | 1.01 | 1.00 | 0.060 | 3.92 | 15,8 | 7.9 | 22.9 | 0.29 | 1.00 | 0.257 | 0.265 | 0.969 | 0.217 | 630,866 | 120 by 72 |
| 3856 | 9.8 | 0.55 | 0.55 | 1.01 | 1.02 | 1.01 | 0.068 | 3.08 | 15,8 | 7.4 | 21.1 | 0.29 | 1.00 | 0.253 | 0.255 | 0.994 | 0.215 | 886,730 | 272 by 152 |
| 3856 + 1/2 | 9.4 | 0.57 | 0.55 | 1.03 | 1.02 | 1.02 | 0.084 | 3.85 | 14,8 | 7.0 | 21.5 | 0.29 | 0.97 | 0.253 | 0.253 | 1.001 | 0.213 | 1058,442 | 100 by 156 |
| 3857 | 9.2 | 0.57 | 0.55 | 1.04 | 1.03 | 1.03 | 0.090 | 4.58 | 14,8 | 6.8 | 26.6 | 0.28 | 1.00 | 0.253 | 0.248 | 1.010 | 0.211 | 810,850 | 128 by 172 |
| 3857 + 1/2 | 9.2 | 0.57 | 0.55 | 1.04 | 1.02 | 1.02 | 0.087 | 4.74 | 14,8 | 5.8 | 22.2 | 0.28 | 0.97 | 0.243 | 0.248 | 0.973 | 0.209 | 742,938 | 68 by 72 |
| 3858 | 8.8 | 0.56 | 0.55 | 1.03 | 1.04 | 1.03 | 0.076 | 4.82 | 14,8 | 5.8 | 23.2 | 0.29 | 0.98 | 0.239 | 0.243 | 0.956 | 0.207 | 414,770 | 44 by 64 |
| 3858 + 1/2 | 8.5 | 0.57 | 0.55 | 1.03 | 1.08 | 1.03 | 0.063 | 4.56 | 14,8 | 5.1 | 17.6 | 0.29 | 1.00 | 0.244 | 0.239 | 0.974 | 0.205 | 946,662 | 176 by 184 |
| 3859 | 8.5 | 0.57 | 0.55 | 1.05 | 1.05 | 1.05 | 0.088 | 4.45 | 14,8 | 5.0 | 14.9 | 0.29 | 0.99 | 0.240 | 0.239 | 0.958 | 0.203 | 1002,650 | 92 by 108 |
| 3859 + 1/2 | 8.3 | 0.56 | 0.55 | 1.02 | 1.04 | 1.02 | 0.070 | 4.56 | 14,8 | 4.4 | 17.4 | 0.29 | 1.00 | 0.239 | 0.238 | 0.955 | 0.201 | 926,874 | 324 by 252 |
| 3860 | 8.0 | 0.54 | 0.55 | 0.99 | 1.01 | 0.99 | 0.077 | 4.06 | 14,8 | 4.6 | 18.1 | 0.30 | 1.00 | 0.237 | 0.238 | 0.948 | 0.199 | 730,930 | 128 by 72 |
| 3860 + 1/2 | 7.8 | 0.54 | 0.54 | 1.00 | 1.02 | 1.00 | 0.082 | 3.86 | 14,8 | 4.6 | 14.0 | 0.30 | 1.02 | 0.237 | 0.238 | 0.948 | 0.197 | 966,598 | 80 by 140 |
| 3861 | 7.7 | 0.54 | 0.54 | 1.01 | 1.00 | 1.00 | 0.090 | 3.63 | 14,8 | 4.9 | 16.3 | 0.30 | 1.03 | 0.237 | 0.237 | 0.947 | 0.195 | 950,562 | 68 by 92 |
| 3861 + 1/2 | 7.6 | 0.53 | 0.53 | 1.00 | 1.00 | 1.00 | 0.078 | 2.86 | 14,8 | 4.7 | 15.7 | 0.31 | 1.03 | 0.239 | 0.237 | 0.956 | 0.193 | 398,774 | 72 by 84 |
| 3862 | 7.3 | 0.52 | 0.53 | 0.99 | 0.99 | 0.99 | 0.084 | 2.38 | 13,7 | 4.4 | 16.9 | 0.31 | 1.02 | 0.236 | 0.238 | 0.946 | 0.191 | 774,650 | 76 by 96 |
| 3862 + 1/2 | 7.1 | 0.53 | 0.53 | 0.99 | 0.99 | 0.99 | 0.081 | 2.01 | 13,8 | 4.5 | 12.7 | 0.31 | 1.01 | 0.238 | 0.239 | 0.952 | 0.188 | 842,578 | 80 by 60 |
| 3863 | 7.0 | 0.52 | 0.53 | 0.97 | 0.98 | 0.97 | 0.076 | 1.71 | 13,7 | 4.7 | 10.8 | 0.31 | 1.00 | 0.239 | 0.238 | 0.956 | 0.186 | 930,566 | 156 by 160 |
| 3863 + 1/2 | 6.9 | 0.52 | 0.53 | 0.97 | 0.97 | 0.97 | 0.077 | 1.63 | 13,8 | 5.0 | 11.0 | 0.31 | 0.98 | 0.238 | 0.239 | 0.953 | 0.184 | 866,634 | 124 by 76 |
| 3864 | 6.4 | 0.53 | 0.53 | 0.99 | 1.01 | 0.99 | 0.070 | 1.84 | 13,8 | 4.3 | 13.3 | 0.32 | 0.99 | 0.239 | 0.238 | 0.958 | 0.182 | 694,910 | 124 by 152 |
| 3864 + 1/2 | 6.4 | 0.52 | 0.53 | 0.97 | 0.96 | 0.96 | 0.073 | 1.39 | 13,8 | 4.3 | 12.4 | 0.32 | 0.98 | 0.239 | 0.239 | 0.954 | 0.179 | 738,862 | 224 by 156 |
| 3865 | 6.1 | 0.51 | 0.53 | 0.96 | 0.95 | 0.95 | 0.068 | 1.22 | 13,8 | 5.0 | 12.1 | 0.32 | 0.98 | 0.236 | 0.239 | 0.943 | 0.177 | 702,674 | 176 by 100 |
| 3865 + 1/2 | 6.0 | 0.50 | 0.53 | 0.94 | 0.94 | 0.94 | 0.070 | 1.39 | 10,6 | 5.4 | 11.9 | 0.32 | 0.94 | 0.239 | 0.239 | 0.958 | 0.175 | 842,678 | 112 by 176 |
| 3866 | 5.6 | 0.51 | 0.53 | 0.97 | 0.96 | 0.96 | 0.054 | 1.43 | 13,8 | 5.4 | 11.7 | 0.32 | 0.97 | 0.240 | 0.239 | 0.961 | 0.172 | 874,594 | 164 by 136 |
| 3866 + 1/2 | 5.5 | 0.51 | 0.53 | 0.95 | 0.96 | 0.95 | 0.055 | 1.23 | 2,3 | 5.3 | 9.9 | 0.31 | 0.97 | 0.239 | 0.239 | 0.956 | 0.170 | 610,562 | 196 by 248 |
| 3867 | 5.3 | 0.52 | 0.53 | 0.98 | 0.94 | 0.94 | 0.070 | 1.35 | 10,8 | 5.6 | 10.9 | 0.31 | 0.96 | 0.239 | 0.239 | 0.955 | 0.168 | 786,910 | 72 by 60 |
| 3867 + 1/2 | 5.2 | 0.50 | 0.53 | 0.94 | 0.95 | 0.94 | 0.055 | 1.40 | 2,8 | 5.7 | 11.1 | 0.31 | 0.98 | 0.239 | 0.239 | 0.955 | 0.165 | 698,890 | 112 by 120 |
| 3868 | 5.1 | 0.49 | 0.53 | 0.93 | 0.93 | 0.93 | 0.057 | 1.19 | 1,4 | 5.6 | 12.9 | 0.30 | 0.97 | 0.239 | 0.239 | 0.956 | 0.163 | 814,646 | 92 by 168 |
| 3868 + 1/2 | 4.9 | 0.50 | 0.53 | 0.95 | 0.93 | 0.93 | 0.062 | 1.24 | 3,8 | 6.1 | 11.6 | 0.30 | 0.98 | 0.240 | 0.239 | 0.961 | 0.161 | 854,446 | 136 by 104 |
| 3869 | 4.6 | 0.49 | 0.53 | 0.92 | 0.89 | 0.89 | 0.066 | 1.25 | 3,8 | 6.6 | 11.6 | 0.29 | 0.98 | 0.235 | 0.240 | 0.940 | 0.159 | 858,702 | 292 by 216 |
| 3869 + 1/2 | 4.7 | 0.49 | 0.53 | 0.93 | 0.88 | 0.88 | 0.068 | 1.25 | 3,8 | 6.4 | 10.4 | 0.29 | 0.99 | 0.241 | 0.239 | 0.964 | 0.157 | 786,394 | 140 by 128 |
| 3870 | 4.3 | 0.50 | 0.55 | 0.92 | 0.91 | 0.91 | 0.076 | 1.26 | 0,4 | 6.3 | 10.8 | 0.28 | 0.99 | 0.240 | 0.238 | 0.958 | 0.154 | 682,866 | 176 by 96 |
| 3870 + 1/2 | 4.4 | 0.57 | 0.59 | 0.97 | 0.95 | 0.95 | 0.070 | 1.39 | 15,6 | 6.7 | 12.6 | 0.28 | 1.02 | 0.238 | 0.239 | 0.951 | 0.152 | 842,470 | 124 by 108 |
| 3871 | 4.0 | 0.64 | 0.63 | 1.02 | 1.03 | 1.02 | 0.057 | 1.57 | 8,1 | 6.0 | 12.4 | 0.27 | 1.07 | 0.239 | 0.238 | 0.956 | 0.150 | 802,374 | 116 by 120 |
| 3871 + 1/2 | 4.0 | 0.69 | 0.65 | 1.07 | 1.06 | 1.06 | 0.066 | 1.78 | 13,6 | 6.2 | 11.8 | 0.27 | 1.11 | 0.236 | 0.239 | 0.944 | 0.148 | 774,622 | 76 by 80 |
| 3872 | 3.8 | 0.74 | 0.65 | 1.13 | 1.15 | 1.13 | 0.054 | 2.00 | 8,1 | 5.8 | 9.6 | 0.26 | 1.14 | 0.239 | 0.238 | 0.956 | 0.146 | 842,454 | 108 by 104 |
| 3872 + 1/2 | 3.7 | 0.76 | 0.65 | 1.17 | 1.17 | 1.17 | 0.068 | 2.29 | 3,0 | 5.7 | 11.7 | 0.26 | 1.15 | 0.239 | 0.237 | 0.955 | 0.143 | 858,550 | 164 by 324 |
| 3873 | 3.6 | 0.77 | 0.65 | 1.19 | 1.22 | 1.19 | 0.057 | 2.45 | 3,0 | 5.3 | 7.5 | 0.25 | 1.19 | 0.238 | 0.238 | 0.952 | 0.142 | 606,770 | 136 by 116 |
| 3873 + 1/2 | 3.7 | 0.78 | 0.65 | 1.20 | 1.21 | 1.203 | 0.073 | 2.96 | 3,0 | 5.4 | 9.1 | 0.25 | 1.19 | 0.236 | 0.237 | 0.946 | 0.139 | 646,826 | 96 by 112 |
| 3874 | 3.5 | 0.77 | 0.65 | 1.19 | 1.20 | 1.19 | 0.058 | 3.10 | 3,0 | 5.0 | 8.1 | 0.25 | 1.18 | 0.235 | 0.237 | 0.940 | 0.137 | 622,514 | 76 by 120 |
| 3874 + 1/2 | 3.2 | 0.76 | 0.65 | 1.17 | 1.16 | 1.16 | 0.071 | 3.41 | 3,0 | 5.6 | 9.5 | 0.25 | 1.18 | 0.235 | 0.237 | 0.940 | 0.136 | 822,862 | 60 by 64 |
| 3875 | 3.2 | 0.75 | 0.65 | 1.15 | 1.19 | 1.15 | 0.052 | 2.81 | 3,0 | 5.3 | 8.0 | 0.24 | 1.15 | 0.237 | 0.236 | 0.950 | 0.134 | 574,654 | 144 by 148 |
| 3875 + 1/2 | 3.0 | 0.74 | 0.65 | 1.15 | 1.16 | 1.15 | 0.055 | 1.96 | 1,0 | 4.7 | 8.7 | 0.24 | 1.15 | 0.237 | 0.237 | 0.947 | 0.132 | 646,818 | 68 by 80 |
| 3876 | 3.1 | 0.77 | 0.65 | 1.19 | 1.17 | 1.17 | 0.069 | 2.07 | 14,7 | 4.9 | 9.5 | 0.24 | 1.13 | 0.237 | 0.237 | 0.947 | 0.130 | 786,482 | 144 by 88 |
| 3876 + 1/2 | 2.9 | 0.76 | 0.65 | 1.18 | 1.19 | 1.18 | 0.066 | 2.11 | 14,7 | 4.7 | 6.9 | 0.24 | 1.11 | 0.237 | 0.237 | 0.946 | 0.128 | 738,374 | 104 by 152 |
| 3877 | 2.8 | 0.78 | 0.65 | 1.20 | 1.23 | 1.198 | 0.040 | 2.12 | 14,7 | 4.9 | 7.4 | 0.24 | 1.08 | 0.239 | 0.237 | 0.955 | 0.126 | 658,794 | 84 by 56 |
| 3877 + 1/2 | 2.8 | 0.77 | 0.65 | 1.19 | 1.16 | 1.16 | 0.084 | 2.07 | 4,1 | 5.0 | 8.0 | 0.23 | 1.05 | 0.238 | 0.238 | 0.951 | 0.124 | 758,602 | 148 by 212 |
| 3878 | 2.5 | 0.74 | 0.65 | 1.15 | 1.16 | 1.15 | 0.052 | 1.96 | 4,1 | 5.3 | 8.0 | 0.23 | 1.03 | 0.238 | 0.237 | 0.954 | 0.122 | 746,614 | 104 by 136 |
| 3878 + 1/2 | 2.7 | 0.72 | 0.65 | 1.12 | 1.09 | 1.09 | 0.082 | 1.96 | 11,8 | 4.8 | 7.4 | 0.23 | 0.98 | 0.236 | 0.237 | 0.945 | 0.121 | 634,454 | 136 by 188 |
| 3879 | 2.4 | 0.70 | 0.65 | 1.07 | 1.06 | 1.06 | 0.073 | 1.90 | 11,8 | 5.1 | 8.3 | 0.23 | 0.99 | 0.237 | 0.237 | 0.949 | 0.119 | 798,590 | 192 by 224 |
| 3879 + 1/2 | 2.4 | 0.65 | 0.67 | 0.98 | 1.02 | 0.98 | 0.059 | 1.84 | 11,8 | 5.2 | 9.3 | 0.23 | 1.00 | 0.235 | 0.238 | 0.940 | 0.117 | 774,438 | 84 by 64 |
| 3880 | 2.3 | 0.64 | 0.63 | 1.02 | 0.98 | 0.98 | 0.063 | 1.67 | 11,8 | 5.3 | 10.2 | 0.23 | 0.97 | 0.238 | 0.238 | 0.953 | 0.116 | 746,530 | 276 by 216 |
| 3880 + 1/2 | 2.1 | 0.60 | 0.61 | 0.99 | 0.98 | 0.98 | 0.082 | 1.66 | 11,8 | 5.5 | 9.7 | 0.23 | 0.98 | 0.238 | 0.237 | 0.952 | 0.114 | 654,810 | 64 by 52 |
| 3881 | 2.2 | 0.57 | 0.58 | 0.99 | 1.03 | 0.99 | 0.065 | 1.52 | 1,8 | 5.2 | 8.7 | 0.23 | 1.00 | 0.240 | 0.237 | 0.960 | 0.113 | 838,778 | 204 by 292 |
| 3881 + 1/2 | 2.2 | 0.55 | 0.55 | 1.01 | 0.97 | 0.97 | 0.088 | 1.48 | 11,8 | 5.0 | 8.9 | 0.23 | 0.98 | 0.236 | 0.238 | 0.944 | 0.111 | 862,506 | 84 by 72 |
| 3882 | 2.0 | 0.52 | 0.53 | 0.98 | 1.00 | 0.98 | 0.080 | 1.36 | 11,7 | 4.9 | 9.4 | 0.23 | 0.99 | 0.237 | 0.238 | 0.948 | 0.109 | 646,794 | 92 by 64 |
| 3882 + 1/2 | 2.1 | 0.52 | 0.51 | 1.01 | 0.99 | 0.99 | 0.087 | 1.30 | 11,7 | 4.9 | 8.4 | 0.23 | 0.96 | 0.239 | 0.237 | 0.954 | 0.108 | 794,570 | 92 by 84 |
| 3883 | 2.0 | 0.49 | 0.49 | 1.00 | 1.01 | 1.00 | 0.066 | 1.49 | 0,4 | 4.6 | 8.8 | 0.24 | 0.99 | 0.238 | 0.238 | 0.950 | 0.106 | 598,778 | 96 by 112 |
| 3883 + 1/2 | 1.8 | 0.47 | 0.48 | 0.99 | 1.01 | 0.99 | 0.067 | 1.43 | 10,8 | 4.6 | 8.7 | 0.24 | 1.00 | 0.240 | 0.237 | 0.959 | 0.105 | 658,798 | 132 by 80 |
| 3884 | 1.8 | 0.46 | 0.47 | 0.99 | 0.97 | 0.97 | 0.067 | 1.49 | 10,8 | 4.1 | 8.4 | 0.24 | 0.98 | 0.236 | 0.238 | 0.944 | 0.103 | 794,594 | 84 by 72 |
| 3884 + 1/2 | 1.7 | 0.46 | 0.47 | 0.99 | 0.97 | 0.97 | 0.059 | 1.55 | 10,8 | 3.8 | 9.1 | 0.24 | 1.00 | 0.237 | 0.237 | 0.949 | 0.102 | 838,790 | 72 by 96 |
| 3885 | 1.6 | 0.44 | 0.47 | 0.93 | 0.96 | 0.93 | 0.069 | 1.56 | 10,8 | 3.6 | 8.1 | 0.20 | 0.97 | 0.239 | 0.236 | 0.954 | 0.101 | 742,434 | 140 by 80 |
| 3885 + 1/2 | 1.7 | 0.45 | 0.47 | 0.95 | 0.97 | 0.95 | 0.072 | 1.70 | 10,8 | 3.2 | 6.9 | 0.15 | 0.98 | 0.235 | 0.237 | 0.941 | 0.099 | 566,602 | 152 by 188 |
| 3886 | 1.6 | 0.44 | 0.47 | 0.94 | 0.97 | 0.94 | 0.061 | 1.65 | 10,8 | 2.8 | 7.7 | 0.14 | 0.97 | 0.233 | 0.236 | 0.930 | 0.098 | 650,494 | 192 by 196 |
| 3886 + 1/2 | 1.5 | 0.43 | 0.47 | 0.92 | 0.96 | 0.92 | 0.056 | 1.39 | 10,8 | 2.8 | 10.2 | 0.13 | 0.97 | 0.237 | 0.235 | 0.948 | 0.097 | 478,522 | 200 by 276 |
| 3887 | 1.5 | 0.43 | 0.47 | 0.93 | 0.95 | 0.93 | 0.061 | 1.32 | 10,8 | 3.5 | 13.0 | 0.13 | 0.97 | 0.235 | 0.236 | 0.940 | 0.096 | 714,582 | 248 by 176 |
| 3887 + 1/2 | 1.4 | 0.42 | 0.47 | 0.90 | 0.94 | 0.90 | 0.052 | 1.20 | 10,8 | 3.4 | 14.6 | 0.13 | 0.97 | 0.237 | 0.236 | 0.947 | 0.094 | 786,594 | 212 by 216 |
| 3888 | 1.3 | 0.41 | 0.47 | 0.87 | 0.94 | 0.87 | 0.043 | 1.17 | 10,8 | 4.1 | 14.4 | 0.13 | 0.95 | 0.236 | 0.236 | 0.943 | 0.093 | 802,694 | 248 by 252 |
| 3888 + 1/2 | 1.2 | 0.40 | 0.47 | 0.86 | 0.95 | 0.86 | 0.037 | 1.10 | 10,8 | 4.7 | 18.9 | 0.12 | 0.92 | 0.236 | 0.235 | 0.946 | 0.092 | 634,758 | 64 by 72 |
| 3889 | 1.0 | 0.38 | 0.47 | 0.82 | 0.93 | 0.82 | 0.027 | 1.19 | 8,7 |  |  |  | 0.90 | 0.234 | 0.235 | 0.936 | 0.091 | 682,702 | 132 by 140 |
| 3889 + 1/2 | 0.9 | 0.37 | 0.47 | 0.79 | 0.91 | 0.79 | 0.015 | 1.06 | 5,1 |  |  |  | 0.85 | 0.234 | 0.234 | 0.937 | 0.091 | 730,446 | 100 by 64 |
| 3890 | 0.8 | 0.35 | 0.47 | 0.75 | 0.89 | 0.75 | 0.012 | 1.07 | 10,0 |  |  |  | 0.76 | 0.231 | 0.234 | 0.924 | 0.090 | 490,670 | 112 by 64 |
| 3890 + 1/2 | 0.7 | 0.34 | 0.47 | 0.73 | 0.87 | 0.73 | 0.003 | 1.07 | 10,7 |  |  |  | 0.72 | 0.234 | 0.235 | 0.937 | 0.089 | 774,494 | 208 by 220 |
| 3891 | 1.0 | 0.36 | 0.47 | 0.76 | 0.90 | 0.76 | 0.017 | 1.27 | 5,3 |  |  |  | 0.79 | 0.235 | 0.235 | 0.941 | 0.089 | 574,534 | 72 by 88 |
| 3891 + 1/2 | 1.4 | 0.39 | 0.47 | 0.83 | 0.95 | 0.83 | 0.034 | 1.43 | 5,3 |  |  |  | 0.88 | 0.236 | 0.236 | 0.942 | 0.089 | 642,670 | 208 by 224 |
| 3892 | 1.9 | 0.44 | 0.47 | 0.93 | 1.02 | 0.93 | 0.057 | 1.78 | 2,5 |  |  |  | 0.98 | 0.237 | 0.237 | 0.949 | 0.089 | 730,666 | 128 by 148 |
| 3892 + 1/2 | 2.5 | 0.48 | 0.50 | 0.97 | 1.03 | 0.97 | 0.105 | 2.05 | 2,5 |  |  |  | 1.03 | 0.239 | 0.239 | 0.957 | 0.088 | 510,778 | 100 by 68 |
| 3893 | 3.2 | 0.53 | 0.52 | 1.02 | 0.96 | 0.96 | 0.157 | 2.43 | 8,5 |  |  |  | 0.82 | 0.243 | 0.239 | 0.971 | 0.088 | 622,790 | 104 by 72 |
| 3893 + 1/2 | 4.4 | 0.57 | 0.53 | 1.09 | 0.99 | 0.99 | 0.164 | 3.10 | 7,4 |  |  |  | 0.85 | 0.241 | 0.239 | 0.965 | 0.088 | 502,786 | 80 by 48 |
| 3894 | 4.0 | 0.57 | 0.53 | 1.09 | 1.07 | 1.07 | 0.112 | 3.55 | 7,4 |  |  |  | 0.96 | 0.239 | 0.240 | 0.956 | 0.088 | 502,622 | 140 by 192 |
| 3894 + 1/2 | 4.7 | 0.56 | 0.53 | 1.06 | 1.13 | 1.06 | 0.077 | 4.24 | 7,4 |  |  |  | 1.00 | 0.239 | 0.239 | 0.956 | 0.089 | 634,498 | 468 by 312 |
| 3895 | 5.3 | 0.56 | 0.53 | 1.07 | 1.22 | 1.07 | 0.067 | 4.92 | 9,6 |  |  |  | 1.03 | 0.238 | 0.239 | 0.952 | 0.089 | 746,494 | 64 by 60 |
| 3895 + 1/2 | 6.2 | 0.60 | 0.53 | 1.14 | 1.31 | 1.14 | 0.083 | 6.20 | 9,6 |  |  |  | 1.09 | 0.238 | 0.242 | 0.952 | 0.090 | 658,610 | 72 by 104 |
| 3896 | 6.8 | 0.61 | 0.53 | 1.15 | 1.36 | 1.15 | 0.046 | 9.94 | 9,6 |  |  |  | 1.14 | 0.245 | 0.243 | 0.982 | 0.090 | 618,446 | 68 by 40 |
| 3896 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

## place

### dive (saturn.dive, T at 3589, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

### rise (saturn.rise, T at 3852, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 2x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 10.66, uhd 26.89.

Largest mean difference: 1.915 at frame 3720 (saturn.terrain), limit 12.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 0.422 at frame 3720 (saturn.terrain), limit 3.2.
Largest level difference of one block (a grid of 16 by 9): -4.741 at frame 3720 (saturn.terrain), limit 12.
Largest level difference of the whole frame: -0.292 at frame 3720 (saturn.terrain), limit 2.2.
Picture: apart/out/work/smooth/saturn-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 3465 | saturn.hold | 1.392 | 7.1 | 36 | -0.125 | -0.199 | 0.247 | 4.21 | -0.888 | 4,3 | 1.102 |
| 3563 | saturn.dive | 1.443 | 7.4 | 50 | -0.114 | -0.191 | 0.243 | 3.66 | -0.987 | 4,3 | 1.115 |
| 3585 | saturn.dive | 1.407 | 6.9 | 35 | -0.003 | 0.068 | 0.188 | 2.06 | -0.494 | 5,4 | 1.261 |
| 3608 | saturn.dive | 1.479 | 8.6 | 32 | -0.015 | -0.017 | 0.165 | 1.92 | -0.182 | 6,4 | 1.404 |
| 3720 | saturn.terrain | 1.915 | 12.1 | 94 | -0.292 | -0.297 | 0.422 | 9.84 | -4.741 | 3,8 | 1.410 |
| 3829 | saturn.rise | 1.429 | 7.8 | 39 | -0.019 | -0.021 | 0.157 | 1.94 | -0.271 | 6,5 | 1.390 |
| 3848 | saturn.rise | 1.346 | 6.8 | 59 | -0.029 | -0.032 | 0.165 | 1.88 | -0.326 | 4,5 | 1.404 |
| 3866 | saturn.rise | 1.440 | 7.9 | 64 | -0.027 | -0.029 | 0.177 | 1.91 | -0.353 | 2,5 | 1.395 |
| 3923 | saturn.travel | 1.637 | 11.7 | 33 | 0.017 | 0.019 | 0.232 | 9.89 | 0.605 | 10,8 | 1.368 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.

## counts

Film frames 3390 to 3959 in order on one fresh page, 1140 pictures at rate 2, tier draft at preview, 5310 s. Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): 7 warm draws. Its work counts for that picture and stands in brackets. Judged: dive, rise and travel, every picture.

| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |
|---|---|---|---|---|---|---|---|
| saturn.hold | no | 300 | 1 | 3390 | 26 | 144 | 125 |
| saturn.dive | yes | 180 | 0 |  | 0 | 0 | 0 |
| saturn.terrain | no | 360 | 0 |  | 0 | 0 | 0 |
| saturn.rise | yes | 150 | 0 |  | 0 | 0 | 0 |
| saturn.travel | yes | 150 | 0 |  | 0 | 0 | 0 |

Every picture with work (of the warm start call in brackets):

| frame | segment | programs | texture uploads | buffers | warm draws |
|---|---|---|---|---|---|
| 3390 | saturn.hold | 26 (26) | 144 (144) | 125 (125) | 7 |
