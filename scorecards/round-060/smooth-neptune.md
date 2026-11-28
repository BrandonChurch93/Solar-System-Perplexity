# smooth: neptune

Commit 262b9a68df0a6bda8d77518539580de554bb0dc5. Capture rate 2. Parts: path, pictures, place, parity, counts.

Joined from the files of 1 machine(s), nothing is rendered, measured or counted here. The path: /home/user/workspace/work/p6/sm60/05/neptune (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The pictures: the dive /home/user/workspace/work/p6/sm60/01/neptune-dive-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm60/02/neptune-dive-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz); the rise /home/user/workspace/work/p6/sm60/03/neptune-rise-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm60/04/neptune-rise-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The place: /home/user/workspace/work/p6/sm60/05/neptune (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The parity: /home/user/workspace/work/p6/sm60/05/neptune (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The counts: /home/user/workspace/work/p6/sm60/06/neptune (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

VERDICT: red. 3 numbers over the limit or not measured.

VERDICT BESIDE IT, the pictures read with the carry at the full size (the verdict above is the one that counts and makes the exit code): red. 3 numbers over the limit or not measured.

GROUND POP BESIDE IT, a number without a limit that makes no verdict (1.3 is named as the limit to come), read with the carry at the full size on the ground both frames show: largest 1.187 from frame 4767 + 1/2 to the next, most at pixel 1770, 950, a patch of 120 by 76 px; 0 of 424 rows read over 1.3 (pictures of the dive). It is not the line "The ground beside it" of the pictures: that line gives the change in place and the pattern on the surface view before a rise or after a dive, this number is read on the globe's ground through the move itself. Ground pop NOT READ on 2 of 426 rows, which says nothing of them, quiet or not: frame 4781 + 1/2: the last frame of the window, no next frame to carry onto it; frame 5036 + 1/2: the last frame of the window, no next frame to carry onto it.

## path

### dive (neptune.dive, frames 4680 to 4769, T at 4758, window 4668 to 4781)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.05047 log of the height a film frame | 1.507 | 4738 | 0.067 | 4761 |  |  | 0.008 | 0.035 | 0.000 | 0.000 | 0.000 at 4773 |
| whole frames | turn | 0.7526 degrees a film frame | 1.920 | 4722 | 0.061 | 4712 |  |  | 0.001 | 0.003 | 0.009 | 0.000 | 0.000 at 4673 |
| whole frames | speed | 3.69 px a film frame at the place | 1.735 | 4714 | 0.059 over 8 | 4748 |  |  | 0.001 | 0.002 | 0.000 | 0.013 over 8 | 0.002 at 4781 |
| rate 2 | rate | 0.05019 log of the height a film frame | 1.516 | 4738 + 1/2 | 0.068 | 4760 + 1/2 | 0.034 | 4760 + 1/2 | 0.010 | 0.030 | 0.000 | 0.000 | 0.000 at 4772 + 1/2 |
| rate 2 | turn | 0.7451 degrees a film frame | 1.940 | 4721 + 1/2 | 0.064 | 4758 + 1/2 | 0.033 | 4758 + 1/2 | 0.001 | 0.046 | 0.010 | 0.000 | 0.000 at 4781 + 1/2 |
| rate 2 | speed | 3.702 px a film frame at the place | 1.746 | 4714 | 0.060 over 8 | 4747 + 1/2 | 0.030 over 8 | 4747 + 1/2 | 0.001 | 0.002 | 0.001 over 8 | 0.014 over 8 | 0.002 at 4781 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 4770, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.0046 of its height a film frame, the mean of its first 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 1.00 at frame 4785 + 1/2, limit 0.87; inside the dive itself 1.01 at frame 4770. Largest step from one capture frame to the next 0.76 at frame 4768 + 1/2, shown. The part along the surface view's own direction of motion: 1.00 at the lowest, lowest 1.00 at frame 4785 + 1/2, shown; under 0 the eye goes back.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4668 | hold orbit | 2.081e+0 | 0.007 |  |  | 0.061 |  |  | 0.134 |  |  | 0 |
| 4669 | hold orbit | 2.080e+0 | 0.007 | 0.000 | 0.000 | 0.061 | 0.000 | 0.000 | 0.134 | 0.000 | 0.000 | 8 |
| 4670 | hold orbit | 2.079e+0 | 0.007 | 0.000 | 0.000 | 0.061 | 0.000 | 0.000 | 0.134 | 0.000 | 0.000 | 8 |
| 4671 | hold orbit | 2.079e+0 | 0.007 | 0.000 | 0.000 | 0.061 | 0.000 | 0.000 | 0.134 | 0.000 | 0.000 | 8 |
| 4672 | hold orbit | 2.078e+0 | 0.007 | 0.000 | 0.000 | 0.061 | 0.000 | 0.000 | 0.134 | 0.000 | 0.000 | 8 |
| 4673 | hold orbit | 2.077e+0 | 0.007 | 0.000 | 0.000 | 0.062 | 0.000 | 0.000 | 0.134 | 0.000 | 0.000 | 8 |
| 4674 | hold orbit | 2.077e+0 | 0.007 | 0.000 | 0.000 | 0.062 | 0.000 | 0.000 | 0.134 | 0.000 | 0.000 | 8 |
| 4675 | hold orbit | 2.076e+0 | 0.007 | 0.000 | 0.000 | 0.062 | 0.000 | 0.000 | 0.133 | 0.000 | 0.000 | 8 |
| 4676 | hold orbit | 2.075e+0 | 0.007 | 0.000 | 0.000 | 0.062 | 0.000 | 0.000 | 0.133 | 0.000 | 0.000 | 8 |
| 4677 | hold orbit | 2.074e+0 | 0.007 | 0.000 | 0.000 | 0.062 | 0.000 | 0.000 | 0.133 | 0.000 | 0.000 | 8 |
| 4678 | hold orbit | 2.074e+0 | 0.007 | 0.000 | 0.000 | 0.063 | 0.000 | 0.000 | 0.133 | 0.000 | 0.000 | 8 |
| 4679 | hold orbit | 2.073e+0 | 0.007 | 0.000 | 0.000 | 0.063 | 0.000 | 0.000 | 0.133 | 0.000 | 0.000 | 8 |
| 4680 first | dive orbit | 2.072e+0 | 0.007 | 0.000 | 0.002 | 0.063 | 0.000 | 0.000 | 0.132 | 0.000 | 0.000 | 8 |
| 4681 | dive orbit | 2.071e+0 | 0.015 | 0.008 | 0.022 | 0.062 | 0.001 | 0.003 | 0.132 | 0.001 | 0.001 | 8 |
| 4682 | dive orbit | 2.066e+0 | 0.046 | 0.031 | 0.042 | 0.058 | 0.004 | 0.005 | 0.133 | 0.001 | 0.008 | 8 |
| 4683 | dive orbit | 2.057e+0 | 0.089 | 0.042 | 0.043 | 0.053 | 0.005 | 0.004 | 0.148 | 0.015 | 0.032 | 8 |
| 4684 | dive orbit | 2.043e+0 | 0.131 | 0.043 | 0.043 | 0.055 | 0.002 | 0.010 | 0.188 | 0.040 | 0.045 | 8 |
| 4685 | dive orbit | 2.025e+0 | 0.174 | 0.043 | 0.043 | 0.070 | 0.015 | 0.025 | 0.235 | 0.047 | 0.049 | 8 |
| 4686 | dive orbit | 2.003e+0 | 0.217 | 0.043 | 0.043 | 0.100 | 0.030 | 0.037 | 0.285 | 0.050 | 0.052 | 8 |
| 4687 | dive orbit | 1.977e+0 | 0.261 | 0.043 | 0.043 | 0.141 | 0.041 | 0.047 | 0.337 | 0.052 | 0.053 | 8 |
| 4688 | dive orbit | 1.947e+0 | 0.304 | 0.043 | 0.043 | 0.191 | 0.050 | 0.056 | 0.391 | 0.054 | 0.055 | 8 |
| 4689 | dive orbit | 1.913e+0 | 0.347 | 0.043 | 0.044 | 0.247 | 0.057 | 0.058 | 0.447 | 0.055 | 0.056 | 8 |
| 4690 | dive orbit | 1.876e+0 | 0.390 | 0.043 | 0.044 | 0.305 | 0.058 | 0.059 | 0.503 | 0.057 | 0.057 | 8 |
| 4691 | dive orbit | 1.835e+0 | 0.434 | 0.043 | 0.044 | 0.364 | 0.058 | 0.059 | 0.560 | 0.057 | 0.058 | 8 |
| 4692 | dive orbit | 1.791e+0 | 0.477 | 0.043 | 0.044 | 0.422 | 0.059 | 0.059 | 0.618 | 0.058 | 0.058 | 8 |
| 4693 | dive orbit | 1.745e+0 | 0.520 | 0.043 | 0.044 | 0.481 | 0.059 | 0.060 | 0.676 | 0.058 | 0.058 | 8 |
| 4694 | dive orbit | 1.696e+0 | 0.564 | 0.043 | 0.044 | 0.540 | 0.059 | 0.060 | 0.734 | 0.058 | 0.058 | 8 |
| 4695 | dive orbit | 1.645e+0 | 0.607 | 0.044 | 0.044 | 0.600 | 0.059 | 0.060 | 0.792 | 0.058 | 0.058 | 8 |
| 4696 | dive orbit | 1.592e+0 | 0.651 | 0.044 | 0.044 | 0.659 | 0.059 | 0.060 | 0.850 | 0.058 | 0.058 | 8 |
| 4697 | dive orbit | 1.537e+0 | 0.695 | 0.044 | 0.044 | 0.718 | 0.059 | 0.060 | 0.908 | 0.058 | 0.058 | 8 |
| 4698 | dive orbit | 1.480e+0 | 0.739 | 0.044 | 0.044 | 0.777 | 0.059 | 0.060 | 0.965 | 0.057 | 0.058 | 8 |
| 4699 | dive orbit | 1.423e+0 | 0.782 | 0.044 | 0.044 | 0.837 | 0.059 | 0.060 | 1.022 | 0.057 | 0.057 | 8 |
| 4700 | dive orbit | 1.365e+0 | 0.827 | 0.044 | 0.044 | 0.896 | 0.060 | 0.060 | 1.078 | 0.056 | 0.057 | 8 |
| 4701 | dive orbit | 1.306e+0 | 0.871 | 0.044 | 0.045 | 0.956 | 0.060 | 0.060 | 1.134 | 0.056 | 0.056 | 8 |
| 4702 | dive orbit | 1.247e+0 | 0.915 | 0.044 | 0.045 | 1.016 | 0.060 | 0.060 | 1.189 | 0.055 | 0.056 | 8 |
| 4703 | dive orbit | 1.188e+0 | 0.960 | 0.045 | 0.045 | 1.075 | 0.060 | 0.060 | 1.244 | 0.055 | 0.055 | 8 |
| 4704 | dive orbit | 1.130e+0 | 1.004 | 0.045 | 0.045 | 1.135 | 0.060 | 0.060 | 1.298 | 0.054 | 0.054 | 8 |
| 4705 | dive orbit | 1.071e+0 | 1.049 | 0.045 | 0.045 | 1.195 | 0.060 | 0.060 | 1.351 | 0.053 | 0.053 | 8 |
| 4706 | dive orbit | 1.014e+0 | 1.094 | 0.045 | 0.045 | 1.255 | 0.060 | 0.061 | 1.402 | 0.052 | 0.052 | 8 |
| 4707 | dive orbit | 9.571e-1 | 1.140 | 0.045 | 0.046 | 1.315 | 0.060 | 0.061 | 1.453 | 0.051 | 0.051 | 8 |
| 4708 | dive orbit | 9.016e-1 | 1.185 | 0.046 | 0.046 | 1.375 | 0.060 | 0.061 | 1.503 | 0.050 | 0.050 | 8 |
| 4709 | dive orbit | 8.473e-1 | 1.231 | 0.046 | 0.046 | 1.435 | 0.060 | 0.061 | 1.551 | 0.048 | 0.049 | 8 |
| 4710 | dive orbit | 7.944e-1 | 1.277 | 0.046 | 0.047 | 1.495 | 0.060 | 0.061 | 1.598 | 0.047 | 0.047 | 8 |
| 4711 | dive orbit | 7.430e-1 | 1.323 | 0.046 | 0.047 | 1.556 | 0.060 | 0.061 | 1.643 | 0.046 | 0.046 | 8 |
| 4712 | dive orbit | 6.934e-1 | 1.370 | 0.047 | 0.047 | 1.616 | 0.061 | 0.061 | 1.687 | 0.044 | 0.044 | 8 |
| 4713 | dive orbit | 6.458e-1 | 1.410 | 0.040 | 0.039 | 1.677 | 0.060 | 0.061 | 1.723 | 0.036 | 0.034 | 8 |
| 4714 | dive orbit | 6.009e-1 | 1.428 | 0.018 | 0.015 | 1.731 | 0.055 | 0.055 | 1.735 | 0.012 | 0.008 | 8 |
| 4715 | dive orbit | 5.589e-1 | 1.433 | 0.005 | 0.005 | 1.779 | 0.048 | 0.047 | 1.734 | 0.001 | 0.004 | 8 |
| 4716 | dive orbit | 5.198e-1 | 1.438 | 0.005 | 0.005 | 1.820 | 0.041 | 0.040 | 1.731 | 0.003 | 0.005 | 8 |
| 4717 | dive orbit | 4.833e-1 | 1.443 | 0.005 | 0.005 | 1.854 | 0.034 | 0.033 | 1.726 | 0.005 | 0.007 | 8 |
| 4718 | dive orbit | 4.492e-1 | 1.448 | 0.005 | 0.005 | 1.881 | 0.027 | 0.026 | 1.719 | 0.007 | 0.009 | 8 |
| 4719 | dive orbit | 4.174e-1 | 1.453 | 0.005 | 0.005 | 1.901 | 0.020 | 0.019 | 1.710 | 0.009 | 0.012 | 8 |
| 4720 | dive orbit | 3.878e-1 | 1.458 | 0.005 | 0.005 | 1.913 | 0.013 | 0.012 | 1.698 | 0.012 | 0.015 | 8 |
| 4721 | dive orbit | 3.602e-1 | 1.463 | 0.005 | 0.005 | 1.919 | 0.006 | 0.005 | 1.683 | 0.015 | 0.017 | 8 |
| 4722 | dive orbit | 3.345e-1 | 1.467 | 0.005 | 0.005 | 1.920 | 0.000 | 0.002 | 1.665 | 0.018 | 0.019 | 8 |
| 4723 | dive orbit | 3.105e-1 | 1.472 | 0.005 | 0.005 | 1.916 | 0.004 | 0.007 | 1.645 | 0.020 | 0.022 | 8 |
| 4724 | dive orbit | 2.883e-1 | 1.476 | 0.004 | 0.004 | 1.907 | 0.009 | 0.012 | 1.623 | 0.022 | 0.024 | 8 |
| 4725 | dive orbit | 2.675e-1 | 1.481 | 0.004 | 0.004 | 1.893 | 0.013 | 0.017 | 1.598 | 0.025 | 0.026 | 8 |
| 4726 | dive orbit | 2.482e-1 | 1.485 | 0.004 | 0.004 | 1.875 | 0.018 | 0.021 | 1.571 | 0.027 | 0.029 | 8 |
| 4727 | dive orbit | 2.302e-1 | 1.489 | 0.004 | 0.004 | 1.852 | 0.023 | 0.026 | 1.542 | 0.029 | 0.031 | 8 |
| 4728 | dive orbit | 2.135e-1 | 1.492 | 0.003 | 0.003 | 1.824 | 0.028 | 0.031 | 1.510 | 0.032 | 0.033 | 8 |
| 4729 | dive orbit | 1.980e-1 | 1.495 | 0.003 | 0.003 | 1.792 | 0.033 | 0.036 | 1.476 | 0.034 | 0.035 | 8 |
| 4730 | dive orbit | 1.836e-1 | 1.498 | 0.003 | 0.003 | 1.754 | 0.037 | 0.041 | 1.440 | 0.036 | 0.037 | 8 |
| 4731 | dive orbit | 1.702e-1 | 1.500 | 0.002 | 0.002 | 1.712 | 0.042 | 0.044 | 1.402 | 0.038 | 0.038 | 8 |
| 4732 | dive orbit | 1.578e-1 | 1.502 | 0.002 | 0.002 | 1.669 | 0.043 | 0.044 | 1.365 | 0.038 | 0.038 | 8 |
| 4733 | dive orbit | 1.462e-1 | 1.503 | 0.002 | 0.002 | 1.626 | 0.043 | 0.044 | 1.327 | 0.037 | 0.037 | 8 |
| 4734 | dive orbit | 1.356e-1 | 1.505 | 0.001 | 0.001 | 1.583 | 0.043 | 0.044 | 1.291 | 0.037 | 0.036 | 8 |
| 4735 | dive orbit | 1.256e-1 | 1.506 | 0.001 | 0.001 | 1.539 | 0.043 | 0.044 | 1.255 | 0.036 | 0.036 | 8 |
| 4736 | dive orbit | 1.164e-1 | 1.506 | 0.001 | 0.001 | 1.496 | 0.043 | 0.044 | 1.220 | 0.035 | 0.035 | 8 |
| 4737 | dive orbit | 1.079e-1 | 1.507 | 0.001 | 0.001 | 1.453 | 0.044 | 0.044 | 1.185 | 0.034 | 0.034 | 8 |
| 4738 | dive orbit | 1.000e-1 | 1.507 | 0.000 | 0.000 | 1.409 | 0.044 | 0.044 | 1.152 | 0.033 | 0.033 | 8 |
| 4739 | dive orbit | 9.267e-2 | 1.507 | 0.000 | 0.000 | 1.365 | 0.044 | 0.044 | 1.121 | 0.032 | 0.031 | 8 |
| 4740 | dive orbit | 8.589e-2 | 1.507 | 0.000 | 0.001 | 1.321 | 0.044 | 0.045 | 1.091 | 0.030 | 0.029 | 8 |
| 4741 | dive orbit | 7.960e-2 | 1.506 | 0.001 | 0.001 | 1.277 | 0.044 | 0.045 | 1.063 | 0.028 | 0.027 | 8 |
| 4742 | dive orbit | 7.377e-2 | 1.505 | 0.001 | 0.001 | 1.232 | 0.045 | 0.045 | 1.037 | 0.026 | 0.025 | 8 |
| 4743 | dive orbit | 6.838e-2 | 1.504 | 0.001 | 0.002 | 1.187 | 0.045 | 0.046 | 1.015 | 0.023 | 0.022 | 8 |
| 4744 | dive orbit | 6.339e-2 | 1.502 | 0.002 | 0.002 | 1.141 | 0.046 | 0.046 | 0.996 | 0.019 | 0.018 | 8 |
| 4745 | dive orbit | 5.877e-2 | 1.500 | 0.002 | 0.003 | 1.095 | 0.046 | 0.047 | 0.981 | 0.015 | 0.014 | 8 |
| 4746 | dive orbit | 5.451e-2 | 1.489 | 0.011 | 0.032 | 1.048 | 0.047 | 0.048 | 0.964 | 0.017 | 0.036 | 8 |
| 4747 | dive orbit | 5.069e-2 | 1.443 | 0.047 | 0.061 | 1.001 | 0.047 | 0.048 | 0.916 | 0.048 | 0.060 | 8 |
| 4748 | dive orbit | 4.727e-2 | 1.381 | 0.061 | 0.062 | 0.953 | 0.048 | 0.049 | 0.856 | 0.059 | 0.060 | 8 |
| 4749 | dive orbit | 4.423e-2 | 1.319 | 0.062 | 0.063 | 0.904 | 0.049 | 0.050 | 0.800 | 0.056 | 0.057 | 8 |
| 4750 | dive orbit | 4.151e-2 | 1.257 | 0.063 | 0.063 | 0.855 | 0.050 | 0.051 | 0.747 | 0.053 | 0.053 | 8 |
| 4751 | dive orbit | 3.908e-2 | 1.194 | 0.063 | 0.064 | 0.805 | 0.050 | 0.051 | 0.698 | 0.049 | 0.049 | 8 |
| 4752 | dive orbit | 3.692e-2 | 1.130 | 0.064 | 0.064 | 0.753 | 0.051 | 0.052 | 0.652 | 0.045 | 0.045 | 8 |
| 4753 | dive orbit | 3.498e-2 | 1.066 | 0.064 | 0.065 | 0.702 | 0.052 | 0.053 | 0.612 | 0.041 | 0.041 | 8 |
| 4754 | dive orbit | 3.326e-2 | 1.001 | 0.065 | 0.065 | 0.649 | 0.053 | 0.054 | 0.576 | 0.036 | 0.036 | 8 |
| 4755 | dive orbit | 3.172e-2 | 0.936 | 0.065 | 0.066 | 0.596 | 0.053 | 0.054 | 0.544 | 0.031 | 0.031 | 8 |
| 4756 | dive orbit | 3.036e-2 | 0.870 | 0.066 | 0.066 | 0.542 | 0.054 | 0.055 | 0.517 | 0.027 | 0.026 | 8 |
| 4757 | dive orbit | 2.915e-2 | 0.804 | 0.066 | 0.067 | 0.488 | 0.054 | 0.055 | 0.495 | 0.022 | 0.022 | 8 |
| 4758 T | dive terrain | 2.809e-2 | 0.738 | 0.067 | 0.067 | 0.432 | 0.056 | 0.064 | 0.478 | 0.017 | 0.017 | 8 |
| 4759 | dive terrain | 2.715e-2 | 0.671 | 0.067 | 0.067 | 0.376 | 0.056 | 0.061 | 0.466 | 0.012 | 0.012 | 8 |
| 4760 | dive terrain | 2.634e-2 | 0.604 | 0.067 | 0.068 | 0.322 | 0.055 | 0.057 | 0.459 | 0.007 | 0.007 | 8 |
| 4761 | dive terrain | 2.563e-2 | 0.536 | 0.067 | 0.068 | 0.268 | 0.053 | 0.056 | 0.455 | 0.003 | 0.003 | 8 |
| 4762 | dive terrain | 2.503e-2 | 0.470 | 0.067 | 0.067 | 0.221 | 0.048 | 0.050 | 0.453 | 0.003 | 0.003 | 8 |
| 4763 | dive terrain | 2.453e-2 | 0.404 | 0.066 | 0.066 | 0.180 | 0.041 | 0.045 | 0.453 | 0.000 | 0.002 | 8 |
| 4764 | dive terrain | 2.411e-2 | 0.339 | 0.065 | 0.065 | 0.145 | 0.035 | 0.040 | 0.456 | 0.003 | 0.004 | 8 |
| 4765 | dive terrain | 2.378e-2 | 0.276 | 0.064 | 0.064 | 0.117 | 0.028 | 0.035 | 0.460 | 0.004 | 0.003 | 8 |
| 4766 | dive terrain | 2.352e-2 | 0.213 | 0.063 | 0.063 | 0.097 | 0.020 | 0.032 | 0.463 | 0.003 | 0.003 | 8 |
| 4767 | dive terrain | 2.335e-2 | 0.151 | 0.062 | 0.062 | 0.084 | 0.013 | 0.035 | 0.465 | 0.002 | 0.002 | 8 |
| 4768 | dive terrain | 2.324e-2 | 0.091 | 0.061 | 0.061 | 0.076 | 0.007 | 0.014 | 0.465 | 0.001 | 0.001 | 8 |
| 4769 last | dive terrain | 2.320e-2 | 0.032 | 0.059 | 0.059 | 0.073 | 0.003 | 0.000 | 0.466 | 0.001 | 0.001 | 8 |
| 4770 | terrain terrain | 2.320e-2 | -0.003 | 0.035 | 0.030 | 0.075 | 0.002 | 0.046 | 0.468 | 0.002 | 0.002 | 8 |
| 4771 | terrain terrain | 2.321e-2 | -0.006 | 0.003 | 0.001 | 0.078 | 0.003 | 0.027 | 0.470 | 0.002 | 0.002 | 8 |
| 4772 | terrain terrain | 2.322e-2 | -0.006 | 0.000 | 0.000 | 0.078 | 0.000 | 0.000 | 0.471 | 0.002 | 0.002 | 8 |
| 4773 | terrain terrain | 2.323e-2 | -0.006 | 0.000 | 0.000 | 0.077 | 0.000 | 0.000 | 0.473 | 0.002 | 0.002 | 8 |
| 4774 | terrain terrain | 2.323e-2 | -0.006 | 0.000 | 0.000 | 0.077 | 0.000 | 0.000 | 0.475 | 0.002 | 0.002 | 8 |
| 4775 | terrain terrain | 2.324e-2 | -0.006 | 0.000 | 0.000 | 0.077 | 0.000 | 0.000 | 0.478 | 0.002 | 0.002 | 8 |
| 4776 | terrain terrain | 2.325e-2 | -0.006 | 0.000 | 0.000 | 0.077 | 0.000 | 0.000 | 0.480 | 0.002 | 0.002 | 8 |
| 4777 | terrain terrain | 2.326e-2 | -0.006 | 0.000 | 0.000 | 0.077 | 0.000 | 0.000 | 0.482 | 0.002 | 0.002 | 8 |
| 4778 | terrain terrain | 2.326e-2 | -0.006 | 0.000 | 0.000 | 0.077 | 0.000 | 0.000 | 0.484 | 0.002 | 0.002 | 8 |
| 4779 | terrain terrain | 2.327e-2 | -0.006 | 0.000 | 0.000 | 0.077 | 0.000 | 0.000 | 0.487 | 0.002 | 0.002 | 8 |
| 4780 | terrain terrain | 2.328e-2 | -0.006 | 0.000 | 0.000 | 0.077 | 0.000 | 0.000 | 0.489 | 0.002 | 0.002 | 8 |
| 4781 | terrain terrain | 2.329e-2 | -0.006 | 0.000 | 0.000 | 0.077 | 0.000 | 0.000 | 0.491 | 0.002 | 0.002 | 8 |

### rise (neptune.rise, frames 4950 to 5024, T at 4956, window 4938 to 5036)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.06938 log of the height a film frame | 1.411 | 5002 | 0.066 | 5022 |  |  | 0.019 | 0.041 | 0.000 | 0.000 | 0.004 at 5036 |
| whole frames | turn | 1.461 degrees a film frame | 1.853 | 4984 | 0.065 | 4957 |  |  | 0.001 | 0.028 | 0.000 | 0.000 | 0.040 at 5031 |
| whole frames | speed | 7.264 px a film frame at the place | 1.579 | 4990 | 0.065 over 8 | 4963 |  |  | 0.003 | 0.026 | 0.014 over 8 | 0.000 | 0.060 at 5036 |
| rate 2 | rate | 0.06892 log of the height a film frame | 1.420 | 5002 + 1/2 | 0.066 | 5022 | 0.033 | 5022 | 0.023 | 0.036 | 0.000 | 0.000 | 0.004 at 5036 + 1/2 |
| rate 2 | turn | 1.45 degrees a film frame | 1.869 | 4983 + 1/2 | 0.068 | 4957 + 1/2 | 0.034 | 4957 | 0.019 | 0.029 | 0.000 | 0.005 | 0.040 at 5030 + 1/2 |
| rate 2 | speed | 7.117 px a film frame at the place | 1.591 | 4990 | 0.065 over 8 | 4963 | 0.032 over 8 | 4962 + 1/2 | 0.004 | 0.026 | 0.016 over 8 | 0.000 | 0.063 at 5036 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 6, rate 2 6.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 4950, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.00432 of its height a film frame, the mean of its last 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 0.94 at frame 4950 + 1/2, limit 0.87; inside the rise itself 0.94 at frame 4950 + 1/2. Largest step from one capture frame to the next 1.35 at frame 4952 + 1/2, shown. The part along the surface view's own direction of motion: 0.92 at the lowest, lowest -1.08 at frame 4956 + 1/2, shown; under 0 the eye goes back.

Rest between the rise and the retreat (the seam into ending.retreat at film frame 5025, 12 film frames to each side, read at rate 2): a rise and the retreat after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body's edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest 0.46 at frame 5025, against 41.78 at frame 5013 and 2.94 at frame 5036 + 1/2 at the ends of the window. The lowest is 0.158 of the slower end, limit 0.07. Near 0 the picture comes to rest between the rise and the retreat.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4938 | terrain terrain | 2.461e-2 | 0.005 |  |  | 0.037 |  |  | 0.216 |  |  | 0 |
| 4939 | terrain terrain | 2.462e-2 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.216 | 0.000 | 0.000 | 8 |
| 4940 | terrain terrain | 2.463e-2 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.217 | 0.000 | 0.000 | 8 |
| 4941 | terrain terrain | 2.464e-2 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.217 | 0.000 | 0.000 | 8 |
| 4942 | terrain terrain | 2.465e-2 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.218 | 0.000 | 0.000 | 8 |
| 4943 | terrain terrain | 2.466e-2 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.218 | 0.000 | 0.000 | 8 |
| 4944 | terrain terrain | 2.467e-2 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.218 | 0.000 | 0.000 | 8 |
| 4945 | terrain terrain | 2.468e-2 | 0.005 | 0.000 | 0.000 | 0.037 | 0.000 | 0.000 | 0.218 | 0.000 | 0.000 | 8 |
| 4946 | terrain terrain | 2.469e-2 | 0.005 | 0.000 | 0.000 | 0.038 | 0.000 | 0.000 | 0.219 | 0.000 | 0.000 | 8 |
| 4947 | terrain terrain | 2.470e-2 | 0.005 | 0.000 | 0.000 | 0.038 | 0.000 | 0.000 | 0.219 | 0.000 | 0.000 | 8 |
| 4948 | terrain terrain | 2.471e-2 | 0.005 | 0.000 | 0.000 | 0.038 | 0.000 | 0.000 | 0.219 | 0.000 | 0.000 | 8 |
| 4949 | terrain terrain | 2.472e-2 | 0.005 | 0.000 | 0.000 | 0.038 | 0.000 | 0.000 | 0.219 | 0.000 | 0.000 | 8 |
| 4950 first | rise terrain | 2.473e-2 | 0.006 | 0.000 | 0.005 | 0.036 | 0.001 | 0.019 | 0.219 | 0.000 | 0.001 | 8 |
| 4951 | rise terrain | 2.477e-2 | 0.024 | 0.019 | 0.049 | 0.038 | 0.001 | 0.018 | 0.216 | 0.003 | 0.007 | 8 |
| 4952 | rise terrain | 2.491e-2 | 0.083 | 0.059 | 0.066 | 0.055 | 0.017 | 0.046 | 0.209 | 0.008 | 0.008 | 8 |
| 4953 | rise terrain | 2.517e-2 | 0.148 | 0.065 | 0.066 | 0.094 | 0.039 | 0.059 | 0.203 | 0.006 | 0.005 | 8 |
| 4954 | rise terrain | 2.554e-2 | 0.213 | 0.065 | 0.066 | 0.152 | 0.059 | 0.067 | 0.210 | 0.008 | 0.023 | 8 |
| 4955 | rise terrain | 2.604e-2 | 0.278 | 0.065 | 0.066 | 0.216 | 0.064 | 0.066 | 0.241 | 0.031 | 0.041 | 8 |
| 4956 T | rise terrain | 2.667e-2 | 0.344 | 0.065 | 0.066 | 0.281 | 0.064 | 0.066 | 0.286 | 0.044 | 0.049 | 8 |
| 4957 | rise orbit | 2.744e-2 | 0.409 | 0.065 | 0.066 | 0.345 | 0.065 | 0.068 | 0.336 | 0.050 | 0.053 | 8 |
| 4958 | rise orbit | 2.835e-2 | 0.474 | 0.065 | 0.066 | 0.410 | 0.064 | 0.066 | 0.390 | 0.054 | 0.057 | 8 |
| 4959 | rise orbit | 2.943e-2 | 0.539 | 0.065 | 0.066 | 0.474 | 0.064 | 0.065 | 0.448 | 0.058 | 0.061 | 8 |
| 4960 | rise orbit | 3.070e-2 | 0.605 | 0.065 | 0.066 | 0.538 | 0.064 | 0.064 | 0.510 | 0.062 | 0.064 | 8 |
| 4961 | rise orbit | 3.216e-2 | 0.670 | 0.065 | 0.066 | 0.601 | 0.064 | 0.064 | 0.575 | 0.064 | 0.065 | 8 |
| 4962 | rise orbit | 3.384e-2 | 0.735 | 0.065 | 0.066 | 0.665 | 0.063 | 0.064 | 0.639 | 0.065 | 0.065 | 8 |
| 4963 | rise orbit | 3.577e-2 | 0.800 | 0.065 | 0.066 | 0.728 | 0.063 | 0.064 | 0.704 | 0.065 | 0.065 | 8 |
| 4964 | rise orbit | 3.799e-2 | 0.866 | 0.065 | 0.066 | 0.790 | 0.063 | 0.063 | 0.769 | 0.065 | 0.065 | 8 |
| 4965 | rise orbit | 4.052e-2 | 0.931 | 0.065 | 0.066 | 0.853 | 0.062 | 0.063 | 0.834 | 0.065 | 0.065 | 8 |
| 4966 | rise orbit | 4.342e-2 | 0.996 | 0.065 | 0.066 | 0.915 | 0.062 | 0.063 | 0.898 | 0.065 | 0.064 | 8 |
| 4967 | rise orbit | 4.674e-2 | 1.062 | 0.065 | 0.066 | 0.977 | 0.062 | 0.062 | 0.963 | 0.064 | 0.064 | 8 |
| 4968 | rise orbit | 5.054e-2 | 1.127 | 0.065 | 0.066 | 1.038 | 0.061 | 0.062 | 1.026 | 0.064 | 0.063 | 8 |
| 4969 | rise orbit | 5.490e-2 | 1.193 | 0.065 | 0.066 | 1.100 | 0.061 | 0.062 | 1.090 | 0.063 | 0.063 | 8 |
| 4970 | rise orbit | 5.991e-2 | 1.258 | 0.065 | 0.066 | 1.160 | 0.061 | 0.061 | 1.153 | 0.063 | 0.062 | 8 |
| 4971 | rise orbit | 6.567e-2 | 1.323 | 0.065 | 0.066 | 1.220 | 0.060 | 0.061 | 1.215 | 0.062 | 0.062 | 8 |
| 4972 | rise orbit | 7.228e-2 | 1.382 | 0.059 | 0.058 | 1.280 | 0.060 | 0.060 | 1.274 | 0.059 | 0.058 | 8 |
| 4973 | rise orbit | 7.966e-2 | 1.401 | 0.019 | 0.012 | 1.340 | 0.059 | 0.060 | 1.314 | 0.039 | 0.037 | 8 |
| 4974 | rise orbit | 8.780e-2 | 1.402 | 0.000 | 0.000 | 1.399 | 0.059 | 0.059 | 1.344 | 0.031 | 0.031 | 8 |
| 4975 | rise orbit | 9.677e-2 | 1.402 | 0.000 | 0.000 | 1.457 | 0.058 | 0.059 | 1.375 | 0.031 | 0.032 | 8 |
| 4976 | rise orbit | 1.066e-1 | 1.402 | 0.000 | 0.000 | 1.515 | 0.058 | 0.058 | 1.406 | 0.031 | 0.032 | 8 |
| 4977 | rise orbit | 1.176e-1 | 1.402 | 0.000 | 0.000 | 1.572 | 0.057 | 0.058 | 1.437 | 0.031 | 0.032 | 8 |
| 4978 | rise orbit | 1.296e-1 | 1.402 | 0.000 | 0.000 | 1.629 | 0.057 | 0.057 | 1.467 | 0.031 | 0.032 | 8 |
| 4979 | rise orbit | 1.428e-1 | 1.403 | 0.000 | 0.000 | 1.685 | 0.056 | 0.057 | 1.498 | 0.031 | 0.032 | 8 |
| 4980 | rise orbit | 1.574e-1 | 1.403 | 0.000 | 0.000 | 1.741 | 0.056 | 0.056 | 1.529 | 0.031 | 0.032 | 8 |
| 4981 | rise orbit | 1.735e-1 | 1.403 | 0.000 | 0.000 | 1.793 | 0.053 | 0.053 | 1.558 | 0.030 | 0.030 | 8 |
| 4982 | rise orbit | 1.913e-1 | 1.404 | 0.000 | 0.000 | 1.832 | 0.038 | 0.036 | 1.580 | 0.022 | 0.021 | 8 |
| 4983 | rise orbit | 2.108e-1 | 1.404 | 0.000 | 0.000 | 1.851 | 0.020 | 0.018 | 1.591 | 0.011 | 0.010 | 8 |
| 4984 | rise orbit | 2.324e-1 | 1.404 | 0.000 | 0.000 | 1.853 | 0.002 | 0.006 | 1.592 | 0.001 | 0.003 | 8 |
| 4985 | rise orbit | 2.562e-1 | 1.404 | 0.000 | 0.000 | 1.846 | 0.007 | 0.008 | 1.589 | 0.003 | 0.003 | 8 |
| 4986 | rise orbit | 2.824e-1 | 1.405 | 0.000 | 0.000 | 1.838 | 0.008 | 0.008 | 1.586 | 0.003 | 0.003 | 8 |
| 4987 | rise orbit | 3.113e-1 | 1.405 | 0.000 | 0.000 | 1.830 | 0.008 | 0.008 | 1.583 | 0.002 | 0.002 | 8 |
| 4988 | rise orbit | 3.432e-1 | 1.405 | 0.000 | 0.000 | 1.823 | 0.008 | 0.008 | 1.582 | 0.002 | 0.001 | 8 |
| 4989 | rise orbit | 3.784e-1 | 1.406 | 0.000 | 0.000 | 1.815 | 0.008 | 0.008 | 1.581 | 0.001 | 0.001 | 8 |
| 4990 | rise orbit | 4.171e-1 | 1.406 | 0.000 | 0.000 | 1.805 | 0.009 | 0.016 | 1.579 | 0.001 | 0.005 | 8 |
| 4991 | rise orbit | 4.599e-1 | 1.406 | 0.000 | 0.000 | 1.784 | 0.021 | 0.031 | 1.572 | 0.008 | 0.013 | 8 |
| 4992 | rise orbit | 5.070e-1 | 1.407 | 0.000 | 0.000 | 1.747 | 0.037 | 0.047 | 1.556 | 0.016 | 0.021 | 8 |
| 4993 | rise orbit | 5.590e-1 | 1.407 | 0.000 | 0.000 | 1.695 | 0.052 | 0.060 | 1.533 | 0.023 | 0.028 | 8 |
| 4994 | rise orbit | 6.164e-1 | 1.408 | 0.000 | 0.000 | 1.634 | 0.061 | 0.062 | 1.505 | 0.028 | 0.029 | 8 |
| 4995 | rise orbit | 6.796e-1 | 1.408 | 0.000 | 0.000 | 1.572 | 0.062 | 0.062 | 1.478 | 0.027 | 0.028 | 8 |
| 4996 | rise orbit | 7.494e-1 | 1.408 | 0.000 | 0.000 | 1.511 | 0.061 | 0.061 | 1.453 | 0.026 | 0.026 | 8 |
| 4997 | rise orbit | 8.263e-1 | 1.409 | 0.000 | 0.000 | 1.451 | 0.060 | 0.061 | 1.428 | 0.025 | 0.025 | 8 |
| 4998 | rise orbit | 9.112e-1 | 1.409 | 0.000 | 0.000 | 1.391 | 0.060 | 0.060 | 1.404 | 0.024 | 0.024 | 8 |
| 4999 | rise orbit | 1.005e+0 | 1.410 | 0.000 | 0.000 | 1.332 | 0.059 | 0.060 | 1.382 | 0.023 | 0.023 | 8 |
| 5000 | rise orbit | 1.108e+0 | 1.410 | 0.000 | 0.000 | 1.273 | 0.059 | 0.059 | 1.360 | 0.021 | 0.022 | 8 |
| 5001 | rise orbit | 1.222e+0 | 1.410 | 0.000 | 0.000 | 1.215 | 0.058 | 0.059 | 1.341 | 0.020 | 0.020 | 8 |
| 5002 | rise orbit | 1.348e+0 | 1.411 | 0.000 | 0.000 | 1.157 | 0.058 | 0.058 | 1.323 | 0.018 | 0.018 | 8 |
| 5003 | rise orbit | 1.486e+0 | 1.407 | 0.004 | 0.023 | 1.100 | 0.057 | 0.058 | 1.304 | 0.018 | 0.029 | 8 |
| 5004 | rise orbit | 1.634e+0 | 1.366 | 0.041 | 0.063 | 1.043 | 0.057 | 0.057 | 1.263 | 0.041 | 0.055 | 8 |
| 5005 | rise orbit | 1.788e+0 | 1.301 | 0.065 | 0.066 | 0.987 | 0.056 | 0.057 | 1.206 | 0.057 | 0.057 | 8 |
| 5006 | rise orbit | 1.948e+0 | 1.236 | 0.065 | 0.066 | 0.931 | 0.056 | 0.056 | 1.148 | 0.058 | 0.058 | 8 |
| 5007 | rise orbit | 2.113e+0 | 1.171 | 0.065 | 0.066 | 0.876 | 0.055 | 0.056 | 1.090 | 0.058 | 0.058 | 8 |
| 5008 | rise orbit | 2.281e+0 | 1.106 | 0.065 | 0.066 | 0.821 | 0.055 | 0.055 | 1.031 | 0.059 | 0.058 | 8 |
| 5009 | rise orbit | 2.452e+0 | 1.040 | 0.065 | 0.066 | 0.766 | 0.055 | 0.055 | 0.972 | 0.059 | 0.059 | 8 |
| 5010 | rise orbit | 2.624e+0 | 0.975 | 0.065 | 0.066 | 0.712 | 0.054 | 0.055 | 0.913 | 0.059 | 0.059 | 8 |
| 5011 | rise orbit | 2.795e+0 | 0.909 | 0.065 | 0.066 | 0.658 | 0.054 | 0.054 | 0.854 | 0.059 | 0.059 | 8 |
| 5012 | rise orbit | 2.963e+0 | 0.844 | 0.065 | 0.066 | 0.604 | 0.054 | 0.054 | 0.795 | 0.059 | 0.059 | 8 |
| 5013 | rise orbit | 3.127e+0 | 0.779 | 0.065 | 0.066 | 0.550 | 0.054 | 0.054 | 0.743 | 0.062 | 0.062 | 8 |
| 5014 | rise orbit | 3.286e+0 | 0.713 | 0.065 | 0.066 | 0.497 | 0.053 | 0.054 | 0.681 | 0.062 | 0.063 | 7 |
| 5015 | rise orbit | 3.437e+0 | 0.648 | 0.066 | 0.066 | 0.444 | 0.053 | 0.054 | 0.618 | 0.063 | 0.063 | 7 |
| 5016 | rise orbit | 3.579e+0 | 0.582 | 0.066 | 0.066 | 0.391 | 0.053 | 0.053 | 0.555 | 0.063 | 0.064 | 7 |
| 5017 | rise orbit | 3.709e+0 | 0.517 | 0.066 | 0.066 | 0.338 | 0.053 | 0.053 | 0.492 | 0.063 | 0.064 | 7 |
| 5018 | rise orbit | 3.827e+0 | 0.451 | 0.066 | 0.066 | 0.285 | 0.053 | 0.053 | 0.429 | 0.063 | 0.064 | 7 |
| 5019 | rise orbit | 3.931e+0 | 0.385 | 0.066 | 0.066 | 0.233 | 0.053 | 0.053 | 0.350 | 0.061 | 0.062 | 7 |
| 5020 | rise orbit | 4.019e+0 | 0.320 | 0.066 | 0.066 | 0.180 | 0.052 | 0.053 | 0.289 | 0.061 | 0.062 | 6 |
| 5021 | rise orbit | 4.090e+0 | 0.254 | 0.066 | 0.066 | 0.128 | 0.052 | 0.053 | 0.228 | 0.061 | 0.062 | 6 |
| 5022 | rise orbit | 4.144e+0 | 0.188 | 0.066 | 0.066 | 0.077 | 0.051 | 0.051 | 0.168 | 0.060 | 0.061 | 6 |
| 5023 | rise orbit | 4.180e+0 | 0.123 | 0.066 | 0.066 | 0.040 | 0.037 | 0.035 | 0.108 | 0.060 | 0.061 | 6 |
| 5024 last | rise orbit | 4.197e+0 | 0.058 | 0.065 | 0.065 | 0.026 | 0.013 | 0.010 | 0.049 | 0.059 | 0.059 | 6 |
| 5025 | retreat orbit | 4.202e+0 | 0.017 | 0.041 | 0.036 | 0.038 | 0.012 | 0.024 | 0.043 | 0.006 | 0.024 | 6 |
| 5026 | retreat orbit | 4.206e+0 | 0.014 | 0.003 | 0.002 | 0.066 | 0.028 | 0.032 | 0.069 | 0.026 | 0.029 | 6 |
| 5027 | retreat orbit | 4.210e+0 | 0.016 | 0.002 | 0.002 | 0.099 | 0.033 | 0.036 | 0.100 | 0.031 | 0.035 | 6 |
| 5028 | retreat orbit | 4.216e+0 | 0.018 | 0.002 | 0.002 | 0.136 | 0.037 | 0.038 | 0.137 | 0.037 | 0.041 | 6 |
| 5029 | retreat orbit | 4.222e+0 | 0.021 | 0.002 | 0.003 | 0.175 | 0.039 | 0.040 | 0.178 | 0.042 | 0.045 | 6 |
| 5030 | retreat orbit | 4.229e+0 | 0.023 | 0.003 | 0.003 | 0.214 | 0.040 | 0.040 | 0.224 | 0.046 | 0.049 | 6 |
| 5031 | retreat orbit | 4.236e+0 | 0.026 | 0.003 | 0.003 | 0.254 | 0.040 | 0.040 | 0.273 | 0.049 | 0.053 | 6 |
| 5032 | retreat orbit | 4.245e+0 | 0.029 | 0.003 | 0.003 | 0.293 | 0.039 | 0.039 | 0.326 | 0.053 | 0.056 | 6 |
| 5033 | retreat orbit | 4.254e+0 | 0.032 | 0.003 | 0.003 | 0.331 | 0.038 | 0.038 | 0.382 | 0.056 | 0.059 | 6 |
| 5034 | retreat orbit | 4.265e+0 | 0.036 | 0.003 | 0.004 | 0.367 | 0.036 | 0.036 | 0.408 | 0.059 | 0.062 | 6 |
| 5035 | retreat orbit | 4.277e+0 | 0.039 | 0.004 | 0.004 | 0.401 | 0.034 | 0.034 | 0.466 | 0.058 | 0.061 | 7 |
| 5036 | retreat orbit | 4.290e+0 | 0.043 | 0.004 | 0.004 | 0.433 | 0.032 | 0.032 | 0.526 | 0.060 | 0.063 | 7 |

## pictures

Tier draft, rate 2, 40.38 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

The dive is joined from 2 parts: /home/user/workspace/work/p6/sm60/01/neptune-dive-p1of2 (capture frames 9336 to 9449, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm60/02/neptune-dive-p2of2 (capture frames 9450 to 9563, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

The rise is joined from 2 parts: /home/user/workspace/work/p6/sm60/03/neptune-rise-p1of2 (capture frames 9876 to 9974, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm60/04/neptune-rise-p2of2 (capture frames 9975 to 10073, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

### dive (neptune.dive, frames 4680 to 4769, window 4668 to 4781, 228 draft frames at rate 2)

Largest level step: 0.17 at frame 4704 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.11 from frame 4713 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 3.82 from frame 4751 to the next, block column 15 row 8 from the top left, shown, not judged.
Largest change in place: 34.7 from frame 4726 + 1/2 to 8 film frames later, most at pixel 1652, 412 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.46 from frame 4745 to 8 film frames later, most at pixel 1196, 284, band 8.3 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 4770 to 4781 + 1/2): change 9.3, pattern 0.11.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 4711 in /home/user/workspace/work/p6/sm60/01/neptune-dive-p1of2-pops.png, frame 4713 in /home/user/workspace/work/p6/sm60/01/neptune-dive-p1of2-pops.png, frame 4713 + 1/2 in /home/user/workspace/work/p6/sm60/01/neptune-dive-p1of2-pops.png, frame 4746 + 1/2 in /home/user/workspace/work/p6/sm60/02/neptune-dive-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 4726 + 1/2 in /home/user/workspace/work/p6/sm60/02/neptune-dive-p2of2-changes.png, frame 4734 + 1/2 in /home/user/workspace/work/p6/sm60/02/neptune-dive-p2of2-changes.png, frame 4745 in /home/user/workspace/work/p6/sm60/02/neptune-dive-p2of2-changes.png, frame 4753 in /home/user/workspace/work/p6/sm60/02/neptune-dive-p2of2-changes.png.

- RED the pattern of the picture changes in place by 0.46 from frame 4745 to 8 film frames later, band 8.3 px, limit 0.45

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4668 | 52.60 |  | 0.6 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 15,3 | 2.0 | 2.7 | 0.49 | 0.02 | 0.42 | 8.0 |
| 4668 + 1/2 | 52.64 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.001 | 1.13 | 7,6 | 2.0 | 2.7 | 0.49 | 0.02 | 0.42 | 8.0 |
| 4669 | 52.67 | 0.00 | 0.6 | 0.60 | 0.59 | 1.01 | 1.01 | 1.01 | 0.000 | 1.18 | 1,4 | 1.9 | 2.8 | 0.49 | 0.02 | 0.42 | 8.0 |
| 4669 + 1/2 | 52.70 | 0.00 | 0.5 | 0.59 | 0.59 | 1.00 | 1.01 | 1.00 | 0.000 | 1.13 | 15,8 | 1.9 | 2.8 | 0.49 | 0.02 | 0.42 | 8.1 |
| 4670 | 52.73 | 0.00 | 0.6 | 0.59 | 0.59 | 0.99 | 0.99 | 0.99 | 0.005 | 1.12 | 15,3 | 1.9 | 2.8 | 0.49 | 0.02 | 0.42 | 8.1 |
| 4670 + 1/2 | 52.77 | 0.00 | 0.6 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 14,0 | 1.9 | 2.8 | 0.49 | 0.02 | 0.42 | 8.0 |
| 4671 | 52.80 | 0.00 | 0.6 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 15,6 | 1.9 | 2.8 | 0.49 | 0.02 | 0.42 | 8.0 |
| 4671 + 1/2 | 52.83 | 0.00 | 0.6 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 1,2 | 1.9 | 2.8 | 0.49 | 0.02 | 0.42 | 8.0 |
| 4672 | 52.87 | 0.00 | 0.6 | 0.60 | 0.59 | 1.01 | 1.01 | 1.01 | 0.003 | 1.12 | 15,3 | 1.9 | 2.8 | 0.49 | 0.02 | 0.42 | 8.0 |
| 4672 + 1/2 | 52.90 | 0.00 | 0.6 | 0.59 | 0.60 | 1.00 | 0.99 | 0.99 | 0.004 | 1.15 | 3,3 | 1.9 | 2.7 | 0.49 | 0.02 | 0.42 | 8.0 |
| 4673 | 52.93 | 0.00 | 0.6 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 11,3 | 1.9 | 2.7 | 0.49 | 0.02 | 0.42 | 8.0 |
| 4673 + 1/2 | 52.97 | 0.00 | 0.6 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 1,2 | 1.9 | 2.7 | 0.49 | 0.02 | 0.42 | 8.0 |
| 4674 | 53.00 | 0.00 | 0.5 | 0.59 | 0.60 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 3,2 | 1.9 | 2.6 | 0.49 | 0.02 | 0.42 | 8.0 |
| 4674 + 1/2 | 53.03 | 0.00 | 0.6 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 15,3 | 1.9 | 2.6 | 0.49 | 0.02 | 0.42 | 8.0 |
| 4675 | 53.06 | 0.00 | 0.6 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.007 | 1.14 | 2,7 | 1.9 | 2.6 | 0.49 | 0.03 | 0.42 | 8.0 |
| 4675 + 1/2 | 53.10 | 0.00 | 0.6 | 0.60 | 0.60 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 3,1 | 1.9 | 2.6 | 0.50 | 0.03 | 0.42 | 8.0 |
| 4676 | 53.13 | 0.00 | 0.6 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.001 | 1.15 | 10,3 | 1.8 | 2.6 | 0.50 | 0.03 | 0.42 | 8.0 |
| 4676 + 1/2 | 53.16 | 0.00 | 0.6 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 15,3 | 1.9 | 2.9 | 0.50 | 0.04 | 0.42 | 8.0 |
| 4677 | 53.20 | 0.00 | 0.6 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 1,8 | 2.0 | 3.0 | 0.50 | 0.05 | 0.42 | 8.0 |
| 4677 + 1/2 | 53.23 | 0.00 | 0.6 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 3,1 | 2.1 | 3.0 | 0.49 | 0.06 | 0.41 | 8.0 |
| 4678 | 53.26 | 0.00 | 0.6 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.004 | 1.14 | 3,1 | 2.4 | 3.5 | 0.48 | 0.07 | 0.41 | 8.0 |
| 4678 + 1/2 | 53.29 | 0.00 | 0.6 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.003 | 1.11 | 2,0 | 2.5 | 3.9 | 0.49 | 0.08 | 0.41 | 8.0 |
| 4679 | 53.32 | 0.00 | 0.6 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 0,8 | 2.8 | 4.4 | 0.48 | 0.09 | 0.41 | 8.0 |
| 4679 + 1/2 | 53.36 | 0.00 | 0.6 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.001 | 1.13 | 2,1 | 3.0 | 5.0 | 0.48 | 0.10 | 0.41 | 8.0 |
| 4680 first | 53.39 | 0.00 | 0.6 | 0.60 | 0.60 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 12,1 | 3.3 | 5.6 | 0.48 | 0.12 | 0.41 | 8.0 |
| 4680 + 1/2 | 53.42 | 0.00 | 0.6 | 0.60 | 0.61 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 0,2 | 3.6 | 6.1 | 0.47 | 0.13 | 0.41 | 8.0 |
| 4681 | 53.47 | 0.01 | 0.6 | 0.61 | 0.63 | 0.98 | 0.98 | 0.98 | 0.000 | 1.26 | 7,1 | 3.9 | 6.6 | 0.47 | 0.14 | 0.41 | 8.0 |
| 4681 + 1/2 | 53.53 | 0.01 | 0.7 | 0.65 | 0.66 | 0.98 | 0.98 | 0.98 | 0.002 | 1.70 | 7,1 | 4.2 | 7.0 | 0.47 | 0.16 | 0.40 | 8.1 |
| 4682 | 53.61 | 0.01 | 0.9 | 0.70 | 0.70 | 1.00 | 1.00 | 1.00 | 0.000 | 2.11 | 7,1 | 4.5 | 7.5 | 0.47 | 0.16 | 0.40 | 8.0 |
| 4682 + 1/2 | 53.71 | 0.01 | 0.9 | 0.76 | 0.77 | 0.99 | 0.99 | 0.99 | 0.000 | 2.39 | 7,1 | 4.6 | 8.0 | 0.47 | 0.17 | 0.40 | 8.1 |
| 4683 | 53.84 | 0.01 | 1.1 | 0.83 | 0.82 | 1.01 | 1.01 | 1.01 | 0.000 | 2.61 | 7,1 | 4.9 | 8.3 | 0.47 | 0.21 | 0.40 | 8.1 |
| 4683 + 1/2 | 53.99 | 0.01 | 1.1 | 0.88 | 0.89 | 1.00 | 1.00 | 1.00 | 0.001 | 2.53 | 7,1 | 5.1 | 8.5 | 0.46 | 0.21 | 0.40 | 8.0 |
| 4684 | 54.16 | 0.01 | 1.3 | 0.95 | 0.95 | 1.00 | 1.00 | 1.00 | 0.000 | 2.53 | 7,1 | 5.1 | 8.5 | 0.46 | 0.20 | 0.40 | 8.0 |
| 4684 + 1/2 | 54.35 | 0.01 | 1.5 | 1.02 | 1.01 | 1.00 | 1.00 | 1.00 | 0.000 | 2.65 | 7,1 | 4.9 | 9.5 | 0.46 | 0.23 | 0.40 | 8.0 |
| 4685 | 54.57 | 0.01 | 1.7 | 1.08 | 1.08 | 1.00 | 1.00 | 1.00 | 0.012 | 2.12 | 7,1 | 4.8 | 6.8 | 0.46 | 0.26 | 0.40 | 8.0 |
| 4685 + 1/2 | 54.80 | 0.01 | 1.9 | 1.14 | 1.13 | 1.01 | 1.01 | 1.01 | 0.000 | 2.18 | 7,1 | 5.0 | 7.7 | 0.47 | 0.23 | 0.40 | 8.0 |
| 4686 | 55.06 | 0.01 | 2.0 | 1.18 | 1.17 | 1.01 | 1.02 | 1.01 | 0.000 | 1.80 | 7,2 | 5.2 | 7.2 | 0.47 | 0.24 | 0.40 | 8.0 |
| 4686 + 1/2 | 55.33 | 0.01 | 2.3 | 1.21 | 1.19 | 1.02 | 1.03 | 1.02 | 0.000 | 1.80 | 7,2 | 5.4 | 8.7 | 0.47 | 0.25 | 0.40 | 8.0 |
| 4687 | 55.62 | 0.01 | 2.4 | 1.24 | 1.20 | 1.03 | 1.04 | 1.03 | 0.003 | 1.72 | 8,2 | 5.7 | 10.0 | 0.47 | 0.19 | 0.40 | 8.0 |
| 4687 + 1/2 | 55.94 | 0.01 | 2.8 | 1.24 | 1.21 | 1.03 | 1.03 | 1.03 | 0.003 | 1.59 | 8,2 | 5.7 | 10.3 | 0.48 | 0.21 | 0.41 | 8.0 |
| 4688 | 56.27 | 0.01 | 2.8 | 1.25 | 1.21 | 1.03 | 1.03 | 1.03 | 0.000 | 1.57 | 8,2 | 5.8 | 10.6 | 0.48 | 0.16 | 0.41 | 8.3 |
| 4688 + 1/2 | 56.62 | 0.01 | 3.1 | 1.24 | 1.22 | 1.02 | 1.03 | 1.02 | 0.005 | 1.54 | 5,4 | 5.8 | 10.0 | 0.48 | 0.21 | 0.41 | 8.8 |
| 4689 | 56.99 | 0.01 | 3.3 | 1.22 | 1.23 | 0.99 | 1.00 | 0.99 | 0.007 | 1.48 | 3,8 | 5.8 | 8.9 | 0.49 | 0.17 | 0.41 | 8.3 |
| 4689 + 1/2 | 57.37 | 0.01 | 3.5 | 1.21 | 1.23 | 0.98 | 0.99 | 0.98 | 0.007 | 1.54 | 3,2 | 5.6 | 8.2 | 0.49 | 0.17 | 0.42 | 8.3 |
| 4690 | 57.77 | 0.01 | 3.8 | 1.20 | 1.24 | 0.97 | 0.97 | 0.97 | 0.006 | 1.50 | 3,8 | 5.6 | 8.2 | 0.49 | 0.18 | 0.42 | 8.0 |
| 4690 + 1/2 | 58.20 | 0.01 | 3.9 | 1.22 | 1.24 | 0.98 | 0.98 | 0.98 | 0.009 | 1.58 | 3,8 | 5.5 | 8.1 | 0.49 | 0.17 | 0.42 | 8.0 |
| 4691 | 58.64 | 0.01 | 4.2 | 1.22 | 1.24 | 0.98 | 0.98 | 0.98 | 0.011 | 1.85 | 3,2 | 5.3 | 8.1 | 0.49 | 0.18 | 0.42 | 8.0 |
| 4691 + 1/2 | 59.10 | 0.01 | 4.4 | 1.23 | 1.25 | 0.99 | 0.98 | 0.98 | 0.008 | 1.69 | 15,1 | 5.3 | 8.2 | 0.49 | 0.18 | 0.42 | 8.0 |
| 4692 | 59.59 | 0.01 | 4.6 | 1.25 | 1.25 | 1.00 | 0.99 | 0.99 | 0.012 | 2.06 | 3,2 | 5.3 | 8.1 | 0.49 | 0.18 | 0.42 | 8.0 |
| 4692 + 1/2 | 60.10 | 0.01 | 4.8 | 1.26 | 1.26 | 1.00 | 0.98 | 0.98 | 0.020 | 1.85 | 3,2 | 5.4 | 7.6 | 0.49 | 0.19 | 0.42 | 8.0 |
| 4693 | 60.63 | 0.01 | 4.9 | 1.28 | 1.27 | 1.01 | 1.02 | 1.01 | 0.008 | 2.06 | 3,2 | 5.5 | 8.0 | 0.49 | 0.20 | 0.42 | 8.0 |
| 4693 + 1/2 | 61.19 | 0.00 | 5.3 | 1.30 | 1.27 | 1.03 | 1.02 | 1.02 | 0.017 | 2.19 | 7,1 | 5.6 | 9.2 | 0.49 | 0.19 | 0.42 | 8.0 |
| 4694 | 61.75 | 0.01 | 5.4 | 1.31 | 1.28 | 1.02 | 1.04 | 1.02 | 0.012 | 2.01 | 7,1 | 5.6 | 10.5 | 0.49 | 0.18 | 0.43 | 8.0 |
| 4694 + 1/2 | 62.30 | 0.01 | 5.8 | 1.33 | 1.29 | 1.03 | 1.05 | 1.03 | 0.016 | 2.09 | 7,1 | 5.8 | 12.9 | 0.49 | 0.17 | 0.43 | 8.0 |
| 4695 | 62.87 | 0.00 | 5.8 | 1.34 | 1.30 | 1.03 | 1.05 | 1.03 | 0.013 | 2.20 | 2,2 | 5.8 | 14.0 | 0.50 | 0.14 | 0.43 | 8.0 |
| 4695 + 1/2 | 63.44 | 0.01 | 6.3 | 1.35 | 1.31 | 1.04 | 1.04 | 1.04 | 0.018 | 2.24 | 2,2 | 5.8 | 14.4 | 0.50 | 0.12 | 0.43 | 8.2 |
| 4696 | 64.03 | 0.01 | 6.5 | 1.34 | 1.31 | 1.02 | 1.03 | 1.02 | 0.018 | 2.32 | 2,2 | 5.7 | 14.0 | 0.50 | 0.10 | 0.44 | 8.4 |
| 4696 + 1/2 | 64.64 | 0.01 | 6.8 | 1.36 | 1.32 | 1.03 | 1.05 | 1.03 | 0.017 | 2.38 | 2,2 | 5.8 | 12.9 | 0.49 | 0.09 | 0.43 | 8.3 |
| 4697 | 65.27 | 0.01 | 7.1 | 1.35 | 1.33 | 1.02 | 1.04 | 1.02 | 0.017 | 2.48 | 2,2 | 5.7 | 12.0 | 0.49 | 0.08 | 0.44 | 8.3 |
| 4697 + 1/2 | 65.91 | 0.01 | 7.3 | 1.35 | 1.33 | 1.01 | 1.02 | 1.01 | 0.024 | 2.76 | 2,2 | 5.6 | 10.3 | 0.49 | 0.08 | 0.44 | 8.0 |
| 4698 | 66.58 | 0.01 | 7.9 | 1.34 | 1.34 | 1.01 | 0.99 | 0.99 | 0.047 | 3.03 | 2,2 | 5.6 | 9.3 | 0.48 | 0.09 | 0.44 | 8.1 |
| 4698 + 1/2 | 67.26 | 0.01 | 8.2 | 1.34 | 1.34 | 1.00 | 0.98 | 0.98 | 0.033 | 2.81 | 2,2 | 5.5 | 8.2 | 0.49 | 0.10 | 0.44 | 8.0 |
| 4699 | 67.98 | 0.01 | 8.5 | 1.31 | 1.34 | 0.98 | 0.95 | 0.95 | 0.042 | 2.15 | 2,2 | 5.5 | 8.3 | 0.48 | 0.12 | 0.45 | 9.6 |
| 4699 + 1/2 | 68.70 | 0.01 | 8.9 | 1.27 | 1.35 | 0.94 | 0.93 | 0.93 | 0.035 | 1.99 | 14,7 | 5.3 | 7.3 | 0.48 | 0.13 | 0.45 | 8.0 |
| 4700 | 69.41 | 0.00 | 9.1 | 1.27 | 1.35 | 0.94 | 0.93 | 0.93 | 0.038 | 2.22 | 14,7 | 5.4 | 7.7 | 0.48 | 0.15 | 0.45 | 8.0 |
| 4700 + 1/2 | 70.10 | 0.00 | 9.4 | 1.30 | 1.35 | 0.96 | 0.94 | 0.94 | 0.046 | 2.13 | 14,7 | 5.4 | 8.3 | 0.48 | 0.20 | 0.45 | 8.0 |
| 4701 | 70.79 | 0.01 | 9.6 | 1.32 | 1.36 | 0.98 | 0.95 | 0.95 | 0.048 | 1.72 | 5,1 | 5.3 | 8.4 | 0.48 | 0.27 | 0.45 | 8.0 |
| 4701 + 1/2 | 71.46 | 0.01 | 10.0 | 1.35 | 1.37 | 0.99 | 0.98 | 0.98 | 0.047 | 2.14 | 14,3 | 5.2 | 8.3 | 0.48 | 0.30 | 0.45 | 8.0 |
| 4702 | 72.12 | 0.01 | 10.2 | 1.37 | 1.38 | 1.00 | 0.97 | 0.97 | 0.066 | 2.34 | 14,3 | 5.3 | 9.4 | 0.48 | 0.24 | 0.45 | 8.2 |
| 4702 + 1/2 | 72.76 | 0.00 | 10.8 | 1.39 | 1.39 | 1.00 | 0.99 | 0.99 | 0.054 | 2.44 | 14,3 | 5.3 | 8.6 | 0.48 | 0.19 | 0.45 | 11.9 |
| 4703 | 73.40 | 0.03 | 10.8 | 1.42 | 1.40 | 1.01 | 1.00 | 1.00 | 0.050 | 2.07 | 1,1 | 5.2 | 8.0 | 0.47 | 0.21 | 0.44 | 12.0 |
| 4703 + 1/2 | 73.99 | 0.04 | 11.5 | 1.41 | 1.41 | 1.01 | 1.02 | 1.01 | 0.038 | 1.88 | 15,8 | 5.2 | 7.6 | 0.47 | 0.21 | 0.44 | 12.1 |
| 4704 | 74.49 | 0.16 | 11.6 | 1.55 | 1.41 | 1.10 | 0.98 | 0.98 | 0.077 | 2.03 | 4,2 | 5.4 | 8.8 | 0.47 | 0.22 | 0.44 | 12.1 |
| 4704 + 1/2 | 74.68 | 0.17 | 12.0 | 1.41 | 1.42 | 0.99 | 1.00 | 0.99 | 0.044 | 2.36 | 4,2 | 5.4 | 9.7 | 0.46 | 0.25 | 0.44 | 12.2 |
| 4705 | 75.20 | 0.01 | 12.4 | 1.40 | 1.43 | 0.98 | 0.98 | 0.98 | 0.049 | 2.33 | 4,2 | 5.4 | 11.0 | 0.46 | 0.28 | 0.43 | 12.3 |
| 4705 + 1/2 | 75.71 | 0.02 | 13.0 | 1.43 | 1.46 | 0.98 | 0.98 | 0.98 | 0.066 | 2.31 | 4,2 | 5.9 | 11.6 | 0.45 | 0.29 | 0.43 | 12.3 |
| 4706 | 76.17 | 0.00 | 13.0 | 1.44 | 1.48 | 0.97 | 1.01 | 0.97 | 0.039 | 2.43 | 4,2 | 6.2 | 12.8 | 0.45 | 0.33 | 0.43 | 9.0 |
| 4706 + 1/2 | 76.64 | 0.01 | 13.2 | 1.48 | 1.51 | 0.98 | 1.02 | 0.98 | 0.047 | 2.52 | 3,2 | 6.2 | 9.4 | 0.44 | 0.39 | 0.43 | 8.7 |
| 4707 | 77.10 | 0.02 | 13.7 | 1.49 | 1.54 | 0.97 | 0.98 | 0.97 | 0.058 | 2.09 | 11,3 | 6.7 | 9.9 | 0.44 | 0.38 | 0.43 | 8.6 |
| 4707 + 1/2 | 77.50 | 0.01 | 14.0 | 1.53 | 1.55 | 0.99 | 0.98 | 0.98 | 0.055 | 2.45 | 11,3 | 7.1 | 10.4 | 0.44 | 0.36 | 0.43 | 8.8 |
| 4708 | 77.89 | 0.00 | 14.3 | 1.55 | 1.56 | 1.00 | 1.01 | 1.00 | 0.041 | 2.53 | 11,3 | 7.5 | 11.0 | 0.44 | 0.33 | 0.43 | 8.5 |
| 4708 + 1/2 | 78.28 | 0.02 | 14.4 | 1.58 | 1.59 | 0.99 | 1.00 | 0.99 | 0.035 | 2.51 | 11,3 | 8.0 | 11.6 | 0.44 | 0.32 | 0.44 | 8.3 |
| 4709 | 78.63 | 0.02 | 14.7 | 1.62 | 1.59 | 1.02 | 1.01 | 1.01 | 0.044 | 2.54 | 11,3 | 8.4 | 12.2 | 0.45 | 0.30 | 0.44 | 8.1 |
| 4709 + 1/2 | 78.94 | 0.01 | 15.1 | 1.64 | 1.61 | 1.02 | 1.04 | 1.02 | 0.030 | 2.31 | 11,3 | 9.0 | 13.2 | 0.45 | 0.28 | 0.44 | 8.0 |
| 4710 | 79.24 | 0.02 | 15.5 | 1.66 | 1.61 | 1.04 | 1.06 | 1.04 | 0.022 | 2.13 | 1,6 | 9.7 | 13.9 | 0.45 | 0.26 | 0.44 | 8.0 |
| 4710 + 1/2 | 79.57 | 0.02 | 15.5 | 1.72 | 1.61 | 1.07 | 1.05 | 1.05 | 0.043 | 2.69 | 1,6 | 10.3 | 15.3 | 0.45 | 0.24 | 0.45 | 8.0 |
| 4711 | 79.95 | 0.03 | 15.9 | 1.78 | 1.61 | 1.11 | 1.11 | 1.11 | 0.026 | 2.44 | 3,1 | 11.0 | 15.8 | 0.46 | 0.22 | 0.45 | 8.0 |
| 4711 + 1/2 | 80.27 | 0.04 | 16.0 | 1.80 | 1.61 | 1.12 | 1.07 | 1.07 | 0.034 | 2.35 | 3,1 | 11.5 | 16.0 | 0.46 | 0.19 | 0.45 | 8.0 |
| 4712 | 80.51 | 0.01 | 16.2 | 1.81 | 1.61 | 1.13 | 1.06 | 1.06 | 0.050 | 2.32 | 0,6 | 12.2 | 15.4 | 0.46 | 0.17 | 0.46 | 8.0 |
| 4712 + 1/2 | 80.72 | 0.03 | 16.4 | 1.84 | 1.61 | 1.15 | 1.08 | 1.08 | 0.044 | 2.50 | 0,6 | 12.8 | 15.6 | 0.46 | 0.15 | 0.46 | 8.0 |
| 4713 | 81.00 | 0.03 | 16.6 | 1.86 | 1.61 | 1.16 | 1.10 | 1.10 | 0.043 | 2.36 | 0,6 | 13.4 | 14.3 | 0.47 | 0.15 | 0.86 | 8.0 |
| 4713 + 1/2 | 81.33 | 0.03 | 16.4 | 1.92 | 1.61 | 1.19 | 1.11 | 1.11 | 0.039 | 2.23 | 3,0 | 14.0 | 14.9 | 0.47 | 0.14 | 0.84 | 8.0 |
| 4714 | 81.60 | 0.10 | 16.4 | 1.88 | 1.61 | 1.17 | 1.06 | 1.06 | 0.048 | 2.39 | 3,7 | 14.7 | 15.7 | 0.47 | 0.14 | 0.83 | 8.0 |
| 4714 + 1/2 | 81.67 | 0.04 | 16.3 | 1.85 | 1.61 | 1.15 | 1.05 | 1.05 | 0.048 | 2.66 | 2,0 | 15.3 | 16.3 | 0.47 | 0.15 | 0.82 | 8.0 |
| 4715 | 81.65 | 0.02 | 16.1 | 1.80 | 1.61 | 1.12 | 1.00 | 1.00 | 0.050 | 2.62 | 2,0 | 15.9 | 16.9 | 0.48 | 0.15 | 0.81 | 8.0 |
| 4715 + 1/2 | 81.61 | 0.07 | 15.8 | 1.77 | 1.61 | 1.10 | 1.01 | 1.01 | 0.044 | 2.39 | 6,1 | 16.5 | 17.8 | 0.48 | 0.16 | 0.80 | 8.0 |
| 4716 | 81.42 | 0.00 | 15.8 | 1.70 | 1.61 | 1.06 | 1.00 | 1.00 | 0.037 | 2.38 | 2,7 | 17.3 | 18.6 | 0.48 | 0.17 | 0.79 | 8.0 |
| 4716 + 1/2 | 81.22 | 0.08 | 15.6 | 1.64 | 1.61 | 1.02 | 1.02 | 1.02 | 0.026 | 2.24 | 2,7 | 18.2 | 19.5 | 0.49 | 0.17 | 0.79 | 8.0 |
| 4717 | 81.18 | 0.04 | 15.3 | 1.61 | 1.61 | 1.00 | 1.00 | 1.00 | 0.031 | 2.05 | 6,1 | 19.1 | 20.4 | 0.49 | 0.17 | 0.78 | 8.0 |
| 4717 + 1/2 | 81.21 | 0.04 | 14.7 | 1.60 | 1.60 | 1.00 | 1.01 | 1.00 | 0.030 | 2.40 | 1,7 | 20.1 | 21.4 | 0.49 | 0.19 | 0.77 | 8.0 |
| 4718 | 81.33 | 0.02 | 14.7 | 1.59 | 1.59 | 1.00 | 1.00 | 1.00 | 0.038 | 2.65 | 1,7 | 21.2 | 22.7 | 0.50 | 0.19 | 0.76 | 8.0 |
| 4718 + 1/2 | 81.48 | 0.01 | 14.5 | 1.57 | 1.57 | 1.00 | 0.99 | 0.99 | 0.040 | 2.53 | 1,7 | 22.3 | 24.1 | 0.50 | 0.19 | 0.76 | 8.0 |
| 4719 | 81.66 | 0.01 | 14.4 | 1.55 | 1.56 | 0.99 | 0.99 | 0.99 | 0.040 | 2.34 | 1,7 | 23.3 | 25.5 | 0.50 | 0.20 | 0.75 | 8.0 |
| 4719 + 1/2 | 81.86 | 0.02 | 14.3 | 1.54 | 1.53 | 1.01 | 0.97 | 0.97 | 0.052 | 3.28 | 0,7 | 24.3 | 26.9 | 0.50 | 0.19 | 0.74 | 8.0 |
| 4720 | 82.10 | 0.01 | 14.3 | 1.52 | 1.51 | 1.00 | 1.05 | 1.00 | 0.030 | 3.38 | 0,7 | 25.4 | 28.3 | 0.51 | 0.19 | 0.73 | 8.0 |
| 4720 + 1/2 | 82.33 | 0.02 | 14.2 | 1.49 | 1.50 | 0.99 | 0.97 | 0.97 | 0.056 | 2.86 | 0,7 | 26.4 | 29.8 | 0.51 | 0.17 | 0.72 | 8.0 |
| 4721 | 82.52 | 0.01 | 14.0 | 1.48 | 1.47 | 1.00 | 1.02 | 1.00 | 0.052 | 1.98 | 0,7 | 27.1 | 31.3 | 0.51 | 0.14 | 0.72 | 8.0 |
| 4721 + 1/2 | 82.71 | 0.02 | 14.2 | 1.45 | 1.45 | 1.00 | 1.01 | 1.00 | 0.055 | 1.83 | 0,3 | 28.0 | 32.5 | 0.51 | 0.12 | 0.71 | 8.0 |
| 4722 | 82.94 | 0.02 | 14.0 | 1.43 | 1.43 | 1.00 | 1.00 | 1.00 | 0.057 | 2.00 | 0,3 | 28.9 | 33.1 | 0.51 | 0.12 | 0.51 | 9.7 |
| 4722 + 1/2 | 83.21 | 0.02 | 14.1 | 1.41 | 1.42 | 1.00 | 0.98 | 0.98 | 0.060 | 1.92 | 14,7 | 29.8 | 33.2 | 0.51 | 0.13 | 0.51 | 9.6 |
| 4723 | 83.44 | 0.00 | 13.9 | 1.41 | 1.40 | 1.00 | 1.00 | 1.00 | 0.056 | 1.68 | 12,5 | 30.9 | 33.8 | 0.51 | 0.14 | 0.51 | 8.0 |
| 4723 + 1/2 | 83.67 | 0.01 | 13.5 | 1.39 | 1.39 | 1.00 | 1.01 | 1.00 | 0.049 | 1.65 | 14,7 | 31.8 | 34.1 | 0.51 | 0.18 | 0.51 | 9.4 |
| 4724 | 83.93 | 0.01 | 13.7 | 1.37 | 1.37 | 1.00 | 0.99 | 0.99 | 0.057 | 1.87 | 15,8 | 32.8 | 35.1 | 0.51 | 0.22 | 0.51 | 8.0 |
| 4724 + 1/2 | 84.21 | 0.01 | 13.4 | 1.35 | 1.38 | 0.98 | 1.02 | 0.98 | 0.048 | 1.58 | 6,0 | 33.6 | 36.1 | 0.52 | 0.21 | 0.51 | 8.4 |
| 4725 | 84.51 | 0.00 | 13.3 | 1.34 | 1.36 | 0.98 | 0.99 | 0.98 | 0.064 | 1.55 | 6,0 | 33.7 | 37.0 | 0.51 | 0.18 | 0.51 | 8.0 |
| 4725 + 1/2 | 84.80 | 0.02 | 13.6 | 1.32 | 1.35 | 0.98 | 0.98 | 0.98 | 0.071 | 1.47 | 13,5 | 34.3 | 37.8 | 0.51 | 0.18 | 0.51 | 9.1 |
| 4726 | 85.14 | 0.01 | 13.7 | 1.31 | 1.35 | 0.97 | 0.98 | 0.97 | 0.072 | 1.86 | 15,7 | 34.7 | 38.4 | 0.51 | 0.19 | 0.51 | 9.0 |
| 4726 + 1/2 | 85.49 | 0.00 | 13.8 | 1.31 | 1.34 | 0.98 | 0.97 | 0.97 | 0.077 | 1.62 | 15,7 | 34.7 | 38.9 | 0.51 | 0.19 | 0.51 | 9.0 |
| 4727 | 85.83 | 0.01 | 13.8 | 1.31 | 1.34 | 0.98 | 0.97 | 0.97 | 0.081 | 1.82 | 15,7 | 34.3 | 39.0 | 0.51 | 0.19 | 0.51 | 8.9 |
| 4727 + 1/2 | 86.18 | 0.00 | 13.2 | 1.32 | 1.34 | 0.98 | 0.97 | 0.97 | 0.081 | 1.43 | 15,7 | 34.7 | 39.9 | 0.51 | 0.20 | 0.51 | 8.8 |
| 4728 | 86.52 | 0.03 | 13.2 | 1.32 | 1.34 | 0.98 | 0.97 | 0.97 | 0.086 | 1.44 | 12,3 | 33.7 | 40.3 | 0.51 | 0.21 | 0.51 | 8.7 |
| 4728 + 1/2 | 86.81 | 0.01 | 13.2 | 1.32 | 1.34 | 0.98 | 0.99 | 0.98 | 0.079 | 1.55 | 10,0 | 32.8 | 40.1 | 0.51 | 0.23 | 0.51 | 8.7 |
| 4729 | 87.08 | 0.00 | 13.4 | 1.31 | 1.34 | 0.98 | 0.97 | 0.97 | 0.087 | 1.55 | 12,3 | 32.6 | 39.3 | 0.51 | 0.25 | 0.51 | 8.6 |
| 4729 + 1/2 | 87.37 | 0.00 | 13.5 | 1.32 | 1.34 | 0.98 | 0.97 | 0.97 | 0.094 | 1.54 | 12,3 | 32.9 | 39.0 | 0.51 | 0.27 | 0.51 | 8.5 |
| 4730 | 87.66 | 0.02 | 14.3 | 1.33 | 1.34 | 0.99 | 0.99 | 0.99 | 0.094 | 1.55 | 12,3 | 32.9 | 39.3 | 0.51 | 0.29 | 0.51 | 8.4 |
| 4730 + 1/2 | 87.91 | 0.02 | 14.9 | 1.35 | 1.34 | 1.00 | 0.98 | 0.98 | 0.100 | 1.47 | 12,3 | 32.8 | 39.5 | 0.52 | 0.32 | 0.51 | 8.2 |
| 4731 | 88.13 | 0.02 | 15.2 | 1.34 | 1.34 | 1.00 | 0.97 | 0.97 | 0.104 | 1.51 | 4,2 | 32.7 | 39.5 | 0.52 | 0.33 | 0.51 | 8.1 |
| 4731 + 1/2 | 88.32 | 0.02 | 16.0 | 1.34 | 1.34 | 1.00 | 0.99 | 0.99 | 0.103 | 1.63 | 4,2 | 32.4 | 39.4 | 0.52 | 0.34 | 0.51 | 8.0 |
| 4732 | 88.47 | 0.02 | 16.2 | 1.34 | 1.34 | 1.00 | 0.99 | 0.99 | 0.101 | 1.55 | 4,2 | 29.9 | 35.9 | 0.51 | 0.34 | 0.51 | 8.0 |
| 4732 + 1/2 | 88.58 | 0.11 | 16.7 | 1.47 | 1.34 | 1.10 | 0.98 | 0.98 | 0.116 | 1.50 | 4,2 | 29.4 | 36.0 | 0.51 | 0.33 | 0.51 | 8.0 |
| 4733 | 88.46 | 0.10 | 15.6 | 1.33 | 1.34 | 0.99 | 1.00 | 0.99 | 0.113 | 1.63 | 4,2 | 28.6 | 35.8 | 0.51 | 0.31 | 0.51 | 8.0 |
| 4733 + 1/2 | 88.55 | 0.05 | 15.6 | 1.33 | 1.35 | 0.99 | 1.00 | 0.99 | 0.119 | 1.38 | 4,2 | 28.9 | 35.8 | 0.51 | 0.29 | 0.51 | 8.0 |
| 4734 | 88.55 | 0.03 | 15.5 | 1.35 | 1.35 | 1.00 | 1.01 | 1.00 | 0.117 | 1.59 | 0,8 | 28.2 | 35.7 | 0.51 | 0.29 | 0.50 | 8.0 |
| 4734 + 1/2 | 88.49 | 0.01 | 14.7 | 1.33 | 1.35 | 0.99 | 1.00 | 0.99 | 0.116 | 1.51 | 0,8 | 28.0 | 36.0 | 0.51 | 0.26 | 0.50 | 8.0 |
| 4735 | 88.41 | 0.01 | 15.7 | 1.35 | 1.35 | 1.00 | 1.01 | 1.00 | 0.117 | 1.44 | 0,2 | 28.0 | 36.0 | 0.51 | 0.26 | 0.60 | 8.0 |
| 4735 + 1/2 | 88.30 | 0.02 | 15.6 | 1.35 | 1.37 | 0.99 | 1.00 | 0.99 | 0.122 | 1.36 | 0,2 | 25.8 | 35.8 | 0.50 | 0.26 | 0.60 | 8.0 |
| 4736 | 88.15 | 0.02 | 13.3 | 1.36 | 1.38 | 0.98 | 0.99 | 0.98 | 0.133 | 1.27 | 3,2 | 24.6 | 35.1 | 0.50 | 0.25 | 0.50 | 8.0 |
| 4736 + 1/2 | 87.96 | 0.00 | 13.4 | 1.37 | 1.39 | 0.99 | 1.00 | 0.99 | 0.127 | 1.24 | 3,2 | 23.3 | 34.9 | 0.50 | 0.26 | 0.49 | 8.0 |
| 4737 | 87.77 | 0.01 | 13.0 | 1.39 | 1.41 | 0.99 | 0.99 | 0.99 | 0.127 | 1.22 | 3,2 | 22.4 | 35.4 | 0.49 | 0.28 | 0.49 | 8.0 |
| 4737 + 1/2 | 87.56 | 0.01 | 12.9 | 1.40 | 1.42 | 0.98 | 0.99 | 0.98 | 0.124 | 1.20 | 13,0 | 22.6 | 35.4 | 0.48 | 0.30 | 0.48 | 8.0 |
| 4738 | 87.32 | 0.02 | 12.5 | 1.42 | 1.44 | 0.98 | 1.02 | 0.98 | 0.108 | 1.28 | 1,0 | 23.3 | 34.9 | 0.48 | 0.33 | 0.48 | 8.0 |
| 4738 + 1/2 | 87.06 | 0.02 | 15.2 | 1.43 | 1.45 | 0.99 | 1.00 | 0.99 | 0.118 | 1.34 | 0,5 | 24.1 | 33.3 | 0.48 | 0.35 | 0.48 | 8.0 |
| 4739 | 86.74 | 0.03 | 14.7 | 1.46 | 1.46 | 1.00 | 1.02 | 1.00 | 0.093 | 1.27 | 14,4 | 24.8 | 31.2 | 0.47 | 0.36 | 0.47 | 8.0 |
| 4739 + 1/2 | 86.37 | 0.02 | 14.5 | 1.45 | 1.47 | 0.98 | 1.01 | 0.98 | 0.111 | 1.27 | 2,7 | 25.7 | 30.0 | 0.47 | 0.35 | 0.47 | 8.0 |
| 4740 | 85.97 | 0.01 | 14.4 | 1.47 | 1.50 | 0.98 | 0.96 | 0.96 | 0.137 | 1.33 | 10,4 | 26.6 | 30.4 | 0.47 | 0.35 | 0.46 | 8.0 |
| 4740 + 1/2 | 85.55 | 0.00 | 14.7 | 1.52 | 1.52 | 1.00 | 1.02 | 1.00 | 0.093 | 1.30 | 2,8 | 27.4 | 30.6 | 0.45 | 0.29 | 0.59 | 8.0 |
| 4741 | 85.13 | 0.01 | 15.2 | 1.57 | 1.57 | 1.00 | 0.96 | 0.96 | 0.093 | 1.36 | 2,8 | 28.2 | 31.7 | 0.44 | 0.29 | 0.59 | 8.0 |
| 4741 + 1/2 | 84.69 | 0.01 | 15.0 | 1.62 | 1.62 | 1.00 | 1.01 | 1.00 | 0.057 | 1.59 | 0,8 | 28.8 | 32.3 | 0.44 | 0.31 | 0.44 | 10.0 |
| 4742 | 84.25 | 0.02 | 14.9 | 1.67 | 1.67 | 1.00 | 1.02 | 1.00 | 0.045 | 1.50 | 1,8 | 29.5 | 32.6 | 0.44 | 0.33 | 0.44 | 9.9 |
| 4742 + 1/2 | 83.77 | 0.01 | 14.9 | 1.72 | 1.72 | 1.00 | 1.00 | 1.00 | 0.046 | 1.71 | 11,1 | 29.9 | 32.6 | 0.44 | 0.35 | 0.44 | 9.9 |
| 4743 | 83.26 | 0.00 | 14.7 | 1.76 | 1.75 | 1.00 | 0.99 | 0.99 | 0.042 | 1.71 | 0,8 | 30.1 | 31.8 | 0.44 | 0.41 | 0.44 | 9.8 |
| 4743 + 1/2 | 82.75 | 0.00 | 14.6 | 1.78 | 1.80 | 0.99 | 1.02 | 0.99 | 0.032 | 1.99 | 15,2 | 30.4 | 32.4 | 0.44 | 0.43 | 0.44 | 9.8 |
| 4744 | 82.23 | 0.03 | 14.9 | 1.85 | 1.78 | 1.04 | 1.00 | 1.00 | 0.050 | 2.02 | 0,8 | 30.6 | 32.7 | 0.44 | 0.44 | 0.44 | 8.3 |
| 4744 + 1/2 | 81.66 | 0.04 | 14.8 | 1.89 | 1.78 | 1.06 | 1.03 | 1.03 | 0.046 | 1.66 | 0,8 | 30.7 | 32.9 | 0.45 | 0.447 | 0.44 | 8.3 |
| 4745 | 81.00 | 0.03 | 14.7 | 1.91 | 1.78 | 1.07 | 1.03 | 1.03 | 0.066 | 1.94 | 11,1 | 30.7 | 33.0 | 0.45 | 0.46 | 0.45 | 8.3 |
| 4745 + 1/2 | 80.28 | 0.04 | 14.8 | 1.93 | 1.78 | 1.08 | 1.08 | 1.08 | 0.043 | 1.78 | 12,1 | 30.6 | 32.9 | 0.46 | 0.44 | 0.45 | 8.3 |
| 4746 | 79.48 | 0.03 | 14.5 | 1.94 | 1.78 | 1.09 | 1.11 | 1.09 | 0.037 | 2.04 | 11,1 | 30.3 | 32.9 | 0.46 | 0.43 | 0.46 | 8.3 |
| 4746 + 1/2 | 78.63 | 0.02 | 14.2 | 1.95 | 1.78 | 1.09 | 1.09 | 1.09 | 0.053 | 1.85 | 13,8 | 30.0 | 32.6 | 0.47 | 0.41 | 0.46 | 8.3 |
| 4747 | 77.73 | 0.01 | 13.8 | 1.92 | 1.78 | 1.08 | 1.11 | 1.08 | 0.037 | 1.69 | 13,5 | 29.6 | 32.2 | 0.47 | 0.36 | 0.47 | 8.2 |
| 4747 + 1/2 | 76.82 | 0.01 | 13.3 | 1.94 | 1.78 | 1.09 | 1.08 | 1.08 | 0.061 | 2.00 | 13,8 | 29.1 | 31.7 | 0.48 | 0.32 | 0.47 | 8.2 |
| 4748 | 75.88 | 0.00 | 12.7 | 1.95 | 1.78 | 1.09 | 1.08 | 1.08 | 0.074 | 1.86 | 13,8 | 28.6 | 31.2 | 0.48 | 0.33 | 0.48 | 8.2 |
| 4748 + 1/2 | 74.95 | 0.01 | 12.3 | 1.93 | 1.78 | 1.08 | 1.01 | 1.01 | 0.108 | 1.58 | 0,1 | 28.1 | 30.6 | 0.49 | 0.34 | 0.48 | 8.0 |
| 4749 | 74.04 | 0.02 | 11.9 | 1.92 | 1.78 | 1.08 | 1.01 | 1.01 | 0.108 | 1.78 | 14,8 | 27.5 | 30.0 | 0.49 | 0.35 | 0.49 | 8.0 |
| 4749 + 1/2 | 73.16 | 0.02 | 11.4 | 1.94 | 1.78 | 1.09 | 1.02 | 1.02 | 0.106 | 2.33 | 14,8 | 26.8 | 29.2 | 0.50 | 0.35 | 0.49 | 8.0 |
| 4750 | 72.31 | 0.01 | 10.9 | 1.88 | 1.78 | 1.06 | 1.01 | 1.01 | 0.092 | 1.63 | 13,8 | 26.0 | 28.5 | 0.50 | 0.39 | 0.50 | 8.0 |
| 4750 + 1/2 | 71.50 | 0.00 | 10.6 | 1.89 | 1.78 | 1.06 | 1.00 | 1.00 | 0.095 | 2.54 | 15,8 | 25.3 | 27.6 | 0.51 | 0.39 | 0.51 | 8.0 |
| 4751 | 70.69 | 0.01 | 10.2 | 1.88 | 1.78 | 1.05 | 1.02 | 1.02 | 0.083 | 3.82 | 15,8 | 24.6 | 27.4 | 0.52 | 0.39 | 0.51 | 8.0 |
| 4751 + 1/2 | 69.90 | 0.01 | 9.9 | 1.84 | 1.78 | 1.03 | 1.00 | 1.00 | 0.079 | 1.64 | 15,8 | 23.8 | 27.6 | 0.52 | 0.39 | 0.52 | 8.0 |
| 4752 | 69.14 | 0.01 | 9.3 | 1.78 | 1.79 | 0.99 | 1.03 | 0.99 | 0.051 | 1.45 | 14,0 | 23.0 | 27.1 | 0.53 | 0.39 | 0.52 | 8.0 |
| 4752 + 1/2 | 68.36 | 0.01 | 9.0 | 1.74 | 1.76 | 0.99 | 0.99 | 0.99 | 0.058 | 1.33 | 0,1 | 22.2 | 26.7 | 0.53 | 0.41 | 0.53 | 8.0 |
| 4753 | 67.60 | 0.05 | 8.9 | 1.73 | 1.72 | 1.01 | 1.01 | 1.01 | 0.053 | 1.71 | 14,8 | 21.3 | 26.6 | 0.54 | 0.41 | 0.53 | 8.0 |
| 4753 + 1/2 | 66.94 | 0.04 | 8.7 | 1.70 | 1.68 | 1.01 | 0.99 | 0.99 | 0.056 | 1.71 | 14,8 | 20.5 | 25.6 | 0.54 | 0.41 | 0.53 | 8.0 |
| 4754 | 66.35 | 0.02 | 8.2 | 1.63 | 1.66 | 0.98 | 1.01 | 0.98 | 0.016 | 1.36 | 6,1 | 19.7 | 25.0 | 0.55 | 0.39 | 0.54 | 8.0 |
| 4754 + 1/2 | 65.81 | 0.01 | 8.1 | 1.61 | 1.61 | 1.00 | 1.00 | 1.00 | 0.018 | 1.83 | 15,8 | 18.9 | 24.2 | 0.55 | 0.38 | 0.54 | 8.0 |
| 4755 | 65.29 | 0.03 | 7.8 | 1.59 | 1.60 | 1.00 | 1.00 | 1.00 | 0.029 | 2.13 | 15,8 | 18.1 | 23.4 | 0.56 | 0.36 | 0.55 | 8.0 |
| 4755 + 1/2 | 64.82 | 0.02 | 7.7 | 1.58 | 1.57 | 1.01 | 1.00 | 1.00 | 0.027 | 1.44 | 15,8 | 17.3 | 22.1 | 0.56 | 0.33 | 0.55 | 8.0 |
| 4756 | 64.38 | 0.01 | 7.4 | 1.55 | 1.56 | 1.00 | 0.99 | 0.99 | 0.029 | 1.32 | 15,8 | 16.5 | 20.9 | 0.56 | 0.29 | 0.55 | 8.0 |
| 4756 + 1/2 | 63.93 | 0.01 | 7.3 | 1.53 | 1.53 | 1.00 | 1.00 | 1.00 | 0.021 | 1.67 | 15,8 | 15.7 | 21.2 | 0.57 | 0.26 | 0.56 | 8.0 |
| 4757 | 63.49 | 0.01 | 7.0 | 1.51 | 1.49 | 1.01 | 1.01 | 1.01 | 0.016 | 1.42 | 4,1 | 15.0 | 20.6 | 0.58 | 0.23 | 0.56 | 8.0 |
| 4757 + 1/2 | 63.02 | 0.02 | 6.8 | 1.45 | 1.45 | 1.01 | 1.00 | 1.00 | 0.012 | 1.36 | 12,6 | 14.4 | 20.6 | 0.58 | 0.19 | 0.56 | 8.0 |
| 4758 | 62.60 | 0.02 | 6.6 | 1.38 | 1.41 | 0.98 | 0.98 | 0.98 | 0.004 | 1.43 | 4,1 | 13.8 | 20.3 | 0.59 | 0.17 | 0.56 | 8.0 |
| 4758 + 1/2 | 62.21 | 0.04 | 6.3 | 1.33 | 1.37 | 0.97 | 0.96 | 0.96 | 0.010 | 1.46 | 12,6 | 13.3 | 20.0 | 0.59 | 0.15 | 0.56 | 8.0 |
| 4759 | 61.92 | 0.04 | 6.1 | 1.32 | 1.36 | 0.97 | 0.96 | 0.96 | 0.007 | 1.49 | 13,7 | 13.0 | 19.7 | 0.60 | 0.14 | 0.57 | 8.0 |
| 4759 + 1/2 | 61.70 | 0.03 | 5.8 | 1.31 | 1.35 | 0.98 | 0.98 | 0.98 | 0.001 | 1.35 | 4,1 | 12.8 | 19.3 | 0.60 | 0.13 | 0.57 | 8.0 |
| 4760 | 61.56 | 0.02 | 5.6 | 1.32 | 1.33 | 0.99 | 0.99 | 0.99 | 0.000 | 1.27 | 4,1 | 12.5 | 19.6 | 0.61 | 0.12 | 0.58 | 8.0 |
| 4760 + 1/2 | 61.44 | 0.00 | 5.4 | 1.36 | 1.32 | 1.03 | 1.03 | 1.03 | 0.000 | 1.55 | 13,7 | 12.1 | 19.6 | 0.62 | 0.11 | 0.58 | 8.0 |
| 4761 | 61.32 | 0.01 | 5.2 | 1.36 | 1.32 | 1.03 | 1.03 | 1.03 | 0.000 | 1.43 | 15,1 | 11.8 | 19.6 | 0.63 | 0.11 | 0.59 | 9.2 |
| 4761 + 1/2 | 61.22 | 0.00 | 5.0 | 1.32 | 1.32 | 1.00 | 1.00 | 1.00 | 0.000 | 1.48 | 13,0 | 11.4 | 18.4 | 0.64 | 0.10 | 0.60 | 9.1 |
| 4762 | 61.13 | 0.02 | 4.7 | 1.33 | 1.31 | 1.01 | 1.01 | 1.01 | 0.000 | 1.49 | 11,1 | 10.9 | 17.2 | 0.65 | 0.10 | 0.60 | 8.1 |
| 4762 + 1/2 | 61.07 | 0.00 | 4.4 | 1.32 | 1.30 | 1.02 | 1.02 | 1.02 | 0.000 | 1.47 | 13,0 | 10.6 | 17.0 | 0.66 | 0.09 | 0.61 | 8.1 |
| 4763 | 61.03 | 0.02 | 4.2 | 1.27 | 1.30 | 0.98 | 0.98 | 0.98 | 0.000 | 1.48 | 12,1 | 10.4 | 16.4 | 0.66 | 0.09 | 0.62 | 8.1 |
| 4763 + 1/2 | 61.02 | 0.00 | 3.9 | 1.29 | 1.27 | 1.02 | 1.02 | 1.02 | 0.000 | 1.41 | 12,1 | 10.1 | 16.4 | 0.67 | 0.09 | 0.62 | 8.1 |
| 4764 | 61.02 | 0.00 | 3.7 | 1.26 | 1.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.36 | 15,1 | 10.0 | 15.8 | 0.68 | 0.08 | 0.63 | 8.0 |
| 4764 + 1/2 | 61.01 | 0.01 | 3.4 | 1.21 | 1.25 | 0.96 | 0.96 | 0.96 | 0.000 | 1.30 | 11,1 | 10.0 | 15.8 | 0.69 | 0.08 | 0.64 | 8.0 |
| 4765 | 61.04 | 0.01 | 3.2 | 1.24 | 1.23 | 1.01 | 1.01 | 1.01 | 0.000 | 1.35 | 14,7 | 9.7 | 15.5 | 0.69 | 0.09 | 0.64 | 8.1 |
| 4765 + 1/2 | 61.07 | 0.00 | 3.0 | 1.19 | 1.23 | 0.97 | 0.97 | 0.97 | 0.000 | 1.31 | 2,3 | 9.6 | 15.7 | 0.70 | 0.09 | 0.65 | 8.0 |
| 4766 | 61.11 | 0.01 | 2.7 | 1.19 | 1.23 | 0.97 | 0.97 | 0.97 | 0.000 | 1.30 | 14,7 | 9.4 | 15.3 | 0.71 | 0.09 | 0.65 | 8.0 |
| 4766 + 1/2 | 61.14 | 0.02 | 2.5 | 1.19 | 1.23 | 0.97 | 0.97 | 0.97 | 0.000 | 1.26 | 11,7 | 9.4 | 15.1 | 0.71 | 0.09 | 0.66 | 8.1 |
| 4767 | 61.14 | 0.00 | 2.2 | 1.12 | 1.23 | 0.91 | 0.91 | 0.91 | 0.000 | 1.14 | 11,5 | 9.3 | 15.5 | 0.72 | 0.09 | 0.66 | 8.0 |
| 4767 + 1/2 | 61.15 | 0.00 | 2.0 | 1.18 | 1.23 | 0.96 | 0.96 | 0.96 | 0.000 | 1.44 | 14,7 | 9.3 | 16.1 | 0.72 | 0.09 | 0.66 | 8.0 |
| 4768 | 61.16 | 0.00 | 1.8 | 1.13 | 1.23 | 0.92 | 0.92 | 0.92 | 0.000 | 1.19 | 15,8 | 9.3 | 17.5 | 0.72 | 0.09 | 0.66 | 8.0 |
| 4768 + 1/2 | 61.16 | 0.01 | 1.6 | 1.18 | 1.23 | 0.96 | 0.96 | 0.96 | 0.000 | 1.40 | 14,7 | 9.4 | 17.7 | 0.72 | 0.09 | 0.66 | 8.0 |
| 4769 last | 61.19 | 0.01 | 1.6 | 1.23 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 15,8 | 9.2 | 17.0 | 0.72 | 0.09 | 0.67 | 8.0 |
| 4769 + 1/2 | 61.20 | 0.00 | 1.6 | 1.23 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 10,7 | 9.1 | 17.6 | 0.72 | 0.09 | 0.66 | 8.0 |
| 4770 | 61.22 | 0.01 | 1.5 | 1.23 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 8,2 | 9.1 | 17.5 | 0.72 | 0.09 | 0.66 | 8.0 |
| 4770 + 1/2 | 61.22 | 0.01 | 1.5 | 1.22 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 10,7 | 9.0 | 17.6 | 0.72 | 0.10 | 0.66 | 8.0 |
| 4771 | 61.24 | 0.00 | 1.6 | 1.23 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 3,2 | 8.9 | 17.9 | 0.72 | 0.10 | 0.66 | 8.0 |
| 4771 + 1/2 | 61.25 | 0.00 | 1.6 | 1.23 | 1.22 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 10,7 | 9.0 | 18.4 | 0.72 | 0.10 | 0.67 | 8.1 |
| 4772 | 61.26 | 0.00 | 1.5 | 1.22 | 1.22 | 1.00 | 1.00 | 1.00 | 0.000 | 1.23 | 3,2 | 9.1 | 19.4 | 0.72 | 0.11 | 0.67 | 8.1 |
| 4772 + 1/2 | 61.27 | 0.00 | 1.6 | 1.22 | 1.22 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 15,3 | 9.1 | 19.7 | 0.72 | 0.11 | 0.67 | 8.1 |
| 4773 | 61.28 | 0.01 | 1.5 | 1.23 | 1.22 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 3,2 | 9.3 | 20.0 | 0.72 | 0.11 | 0.67 | 8.1 |
| 4773 + 1/2 | 61.28 | 0.00 | 1.6 | 1.22 | 1.22 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 3,2 | 9.3 | 19.6 | 0.72 | 0.11 | 0.67 | 8.1 |
| 4774 | 61.29 | 0.00 | 1.5 | 1.23 | 1.22 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 3,2 |  |  |  |  |  |  |
| 4774 + 1/2 | 61.31 | 0.01 | 1.5 | 1.23 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 8,3 |  |  |  |  |  |  |
| 4775 | 61.31 | 0.00 | 1.5 | 1.22 | 1.23 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 12,8 |  |  |  |  |  |  |
| 4775 + 1/2 | 61.31 | 0.00 | 1.6 | 1.23 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 3,2 |  |  |  |  |  |  |
| 4776 | 61.32 | 0.00 | 1.5 | 1.23 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 3,2 |  |  |  |  |  |  |
| 4776 + 1/2 | 61.32 | 0.00 | 1.5 | 1.21 | 1.23 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 13,3 |  |  |  |  |  |  |
| 4777 | 61.33 | 0.01 | 1.6 | 1.22 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 12,8 |  |  |  |  |  |  |
| 4777 + 1/2 | 61.34 | 0.01 | 1.6 | 1.23 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 14,1 |  |  |  |  |  |  |
| 4778 | 61.34 | 0.00 | 1.5 | 1.22 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 12,8 |  |  |  |  |  |  |
| 4778 + 1/2 | 61.34 | 0.00 | 1.5 | 1.23 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 12,8 |  |  |  |  |  |  |
| 4779 | 61.34 | 0.00 | 1.5 | 1.23 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 15,7 |  |  |  |  |  |  |
| 4779 + 1/2 | 61.34 | 0.00 | 1.5 | 1.22 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 15,7 |  |  |  |  |  |  |
| 4780 | 61.33 | 0.00 | 1.5 | 1.22 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 15,7 |  |  |  |  |  |  |
| 4780 + 1/2 | 61.33 | 0.00 | 1.6 | 1.23 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.23 | 11,8 |  |  |  |  |  |  |
| 4781 | 61.33 | 0.00 | 1.6 | 1.22 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.27 | 15,7 |  |  |  |  |  |  |
| 4781 + 1/2 | 61.33 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### dive, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.15 from frame 4746 to the next, limit 1.2.
Largest pop score of one block: 6.20 from frame 4698 + 1/2 to the next, block column 2 row 2 from the top left, shown, not judged.
Largest change in place: 37.2 from frame 4726 to 8 film frames later, most at pixel 1628, 380, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 4770 to 4781 + 1/2): change 5.6; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.187 from frame 4767 + 1/2 to the next, most at pixel 1770, 950, a patch of 120 by 76 px; 0 of 227 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 228 rows, which says nothing of them, quiet or not: frame 4781 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 4745 + 1/2 in /home/user/workspace/work/p6/sm60/02/neptune-dive-p2of2-pops-full.png, frame 4746 in /home/user/workspace/work/p6/sm60/02/neptune-dive-p2of2-pops-full.png, frame 4746 + 1/2 in /home/user/workspace/work/p6/sm60/02/neptune-dive-p2of2-pops-full.png, frame 4747 in /home/user/workspace/work/p6/sm60/02/neptune-dive-p2of2-pops-full.png, frame 4767 + 1/2 in /home/user/workspace/work/p6/sm60/02/neptune-dive-p2of2-pops-full.png.

With the carry at the full size the dive has 1 number over the limit or not measured.

- FULL SIZE RED the pattern of the picture changes in place by 0.46 from frame 4745 to 8 film frames later, band 8.3 px, limit 0.45

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4668 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 11,5 | 1.7 | 2.6 | 0.49 | 1.00 | 0.260 | 0.260 | 1.001 | 0.499 | 1106,510 | 108 by 120 |
| 4668 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.001 | 1.08 | 10,4 | 1.8 | 2.6 | 0.49 | 1.00 | 0.260 | 0.260 | 1.000 | 0.499 | 1266,666 | 128 by 208 |
| 4669 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 14,0 | 1.7 | 2.6 | 0.49 | 1.01 | 0.260 | 0.260 | 0.998 | 0.499 | 1150,326 | 64 by 60 |
| 4669 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 3,2 | 1.7 | 2.6 | 0.49 | 1.00 | 0.260 | 0.260 | 1.002 | 0.499 | 1370,722 | 80 by 96 |
| 4670 | 0.6 | 0.27 | 0.27 | 1.00 | 0.99 | 0.99 | 0.005 | 1.11 | 3,1 | 1.7 | 2.6 | 0.49 | 0.99 | 0.260 | 0.260 | 1.000 | 0.499 | 958,574 | 284 by 228 |
| 4670 + 1/2 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 0,6 | 1.8 | 2.5 | 0.49 | 1.00 | 0.260 | 0.260 | 0.996 | 0.500 | 1174,718 | 64 by 76 |
| 4671 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 8,0 | 1.8 | 2.6 | 0.49 | 1.00 | 0.262 | 0.260 | 1.006 | 0.499 | 602,366 | 100 by 80 |
| 4671 + 1/2 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 10,4 | 1.8 | 2.5 | 0.49 | 1.00 | 0.261 | 0.261 | 0.998 | 0.500 | 754,522 | 136 by 124 |
| 4672 | 0.6 | 0.27 | 0.27 | 1.01 | 1.00 | 1.00 | 0.003 | 1.08 | 6,0 | 1.8 | 2.5 | 0.49 | 1.01 | 0.262 | 0.261 | 1.005 | 0.499 | 630,462 | 144 by 188 |
| 4672 + 1/2 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.004 | 1.07 | 6,0 | 1.8 | 2.6 | 0.49 | 0.99 | 0.260 | 0.260 | 1.000 | 0.499 | 966,574 | 152 by 176 |
| 4673 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 4,1 | 1.8 | 2.5 | 0.49 | 1.00 | 0.260 | 0.260 | 0.999 | 0.499 | 1570,1010 | 76 by 72 |
| 4673 + 1/2 | 0.6 | 0.27 | 0.27 | 0.99 | 1.00 | 0.99 | 0.000 | 1.10 | 2,1 | 1.8 | 2.5 | 0.49 | 1.00 | 0.259 | 0.260 | 0.995 | 0.500 | 1402,966 | 100 by 140 |
| 4674 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 14,5 | 1.8 | 2.5 | 0.49 | 0.99 | 0.260 | 0.260 | 1.000 | 0.500 | 494,474 | 60 by 60 |
| 4674 + 1/2 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 2,1 | 1.8 | 2.5 | 0.49 | 1.00 | 0.260 | 0.259 | 1.004 | 0.500 | 922,202 | 88 by 100 |
| 4675 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.007 | 1.09 | 3,1 | 1.8 | 2.5 | 0.49 | 1.00 | 0.260 | 0.260 | 1.000 | 0.500 | 1134,614 | 104 by 88 |
| 4675 + 1/2 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 3,2 | 1.8 | 2.4 | 0.50 | 0.99 | 0.259 | 0.260 | 0.996 | 0.500 | 566,370 | 128 by 68 |
| 4676 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.001 | 1.06 | 2,4 | 1.8 | 2.4 | 0.50 | 1.00 | 0.260 | 0.259 | 1.001 | 0.500 | 690,514 | 132 by 152 |
| 4676 + 1/2 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 10,4 | 1.8 | 2.4 | 0.50 | 1.00 | 0.259 | 0.260 | 0.996 | 0.500 | 642,434 | 164 by 132 |
| 4677 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 2,1 | 1.8 | 2.4 | 0.50 | 1.00 | 0.260 | 0.260 | 0.999 | 0.500 | 1046,594 | 148 by 144 |
| 4677 + 1/2 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 9,4 | 1.8 | 2.3 | 0.49 | 1.00 | 0.261 | 0.260 | 1.002 | 0.500 | 886,538 | 60 by 100 |
| 4678 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.004 | 1.08 | 12,0 | 1.8 | 2.4 | 0.48 | 1.00 | 0.261 | 0.260 | 1.001 | 0.501 | 614,438 | 144 by 100 |
| 4678 + 1/2 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.003 | 1.07 | 3,1 | 1.7 | 2.2 | 0.49 | 1.00 | 0.261 | 0.260 | 1.002 | 0.501 | 1010,574 | 168 by 96 |
| 4679 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 3,1 | 1.7 | 2.2 | 0.48 | 1.00 | 0.259 | 0.260 | 0.997 | 0.501 | 1170,726 | 64 by 64 |
| 4679 + 1/2 | 0.6 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.001 | 1.19 | 2,1 | 1.7 | 2.2 | 0.48 | 1.00 | 0.259 | 0.259 | 1.000 | 0.500 | 1266,670 | 72 by 68 |
| 4680 | 0.6 | 0.27 | 0.27 | 0.99 | 1.00 | 0.99 | 0.000 | 1.07 | 6,3 | 1.7 | 2.2 | 0.48 | 0.99 | 0.258 | 0.259 | 0.995 | 0.501 | 1058,766 | 132 by 76 |
| 4680 + 1/2 | 0.6 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.07 | 9,8 | 1.7 | 2.3 | 0.47 | 0.99 | 0.260 | 0.259 | 1.004 | 0.501 | 1138,1070 | 116 by 52 |
| 4681 | 0.6 | 0.27 | 0.27 | 0.98 | 0.98 | 0.98 | 0.000 | 1.05 | 3,0 | 1.6 | 2.4 | 0.47 | 0.98 | 0.258 | 0.260 | 0.990 | 0.501 | 1338,718 | 56 by 72 |
| 4681 + 1/2 | 0.7 | 0.27 | 0.27 | 0.98 | 0.98 | 0.98 | 0.002 | 1.11 | 8,1 | 1.6 | 2.5 | 0.47 | 0.98 | 0.261 | 0.262 | 0.994 | 0.501 | 654,450 | 164 by 148 |
| 4682 | 0.9 | 0.28 | 0.28 | 0.99 | 0.99 | 0.99 | 0.000 | 1.17 | 4,2 | 1.6 | 2.6 | 0.47 | 1.00 | 0.265 | 0.263 | 1.008 | 0.502 | 1310,678 | 212 by 132 |
| 4682 + 1/2 | 0.9 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.26 | 4,2 | 1.6 | 2.7 | 0.47 | 0.99 | 0.265 | 0.265 | 0.999 | 0.503 | 578,306 | 76 by 112 |
| 4683 | 1.1 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.44 | 6,1 | 1.6 | 2.8 | 0.47 | 1.01 | 0.265 | 0.266 | 0.996 | 0.505 | 898,1074 | 88 by 32 |
| 4683 + 1/2 | 1.1 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.001 | 1.56 | 6,1 | 1.6 | 2.9 | 0.46 | 1.00 | 0.267 | 0.267 | 1.000 | 0.506 | 1158,330 | 112 by 72 |
| 4684 | 1.3 | 0.33 | 0.33 | 1.00 | 1.00 | 1.00 | 0.000 | 1.76 | 6,1 | 1.7 | 3.1 | 0.46 | 1.00 | 0.269 | 0.270 | 0.998 | 0.508 | 1486,562 | 248 by 160 |
| 4684 + 1/2 | 1.5 | 0.34 | 0.34 | 1.00 | 1.01 | 1.00 | 0.000 | 1.78 | 6,1 | 1.8 | 3.2 | 0.46 | 1.00 | 0.274 | 0.271 | 1.012 | 0.511 | 742,374 | 56 by 52 |
| 4685 | 1.7 | 0.36 | 0.36 | 1.00 | 0.99 | 0.99 | 0.012 | 1.87 | 6,1 | 1.9 | 3.4 | 0.46 | 1.00 | 0.272 | 0.274 | 0.994 | 0.513 | 1594,962 | 192 by 192 |
| 4685 + 1/2 | 1.9 | 0.38 | 0.38 | 1.00 | 1.01 | 1.00 | 0.000 | 2.14 | 6,1 | 2.0 | 3.6 | 0.47 | 1.01 | 0.274 | 0.276 | 0.994 | 0.516 | 1542,614 | 140 by 168 |
| 4686 | 2.0 | 0.39 | 0.40 | 1.00 | 1.00 | 1.00 | 0.000 | 2.01 | 13,8 | 2.1 | 3.7 | 0.47 | 1.01 | 0.277 | 0.278 | 0.998 | 0.519 | 1606,954 | 52 by 56 |
| 4686 + 1/2 | 2.3 | 0.41 | 0.41 | 1.00 | 1.00 | 1.00 | 0.000 | 2.14 | 13,8 | 2.2 | 3.9 | 0.47 | 1.02 | 0.282 | 0.280 | 1.005 | 0.522 | 634,358 | 64 by 60 |
| 4687 | 2.4 | 0.43 | 0.43 | 1.01 | 1.00 | 1.00 | 0.003 | 2.27 | 13,8 | 2.3 | 4.1 | 0.47 | 1.03 | 0.285 | 0.283 | 1.007 | 0.526 | 1062,502 | 96 by 60 |
| 4687 + 1/2 | 2.8 | 0.45 | 0.45 | 0.99 | 0.99 | 0.99 | 0.003 | 2.20 | 13,8 | 2.4 | 4.2 | 0.48 | 1.03 | 0.284 | 0.287 | 0.989 | 0.531 | 1602,966 | 56 by 56 |
| 4688 | 2.8 | 0.47 | 0.46 | 1.01 | 1.01 | 1.01 | 0.000 | 2.05 | 13,8 | 2.5 | 4.4 | 0.48 | 1.03 | 0.290 | 0.287 | 1.012 | 0.535 | 626,350 | 108 by 64 |
| 4688 + 1/2 | 3.1 | 0.48 | 0.48 | 1.00 | 1.00 | 1.00 | 0.005 | 2.20 | 13,8 | 2.6 | 4.5 | 0.48 | 1.02 | 0.289 | 0.292 | 0.990 | 0.540 | 694,478 | 96 by 60 |
| 4689 | 3.3 | 0.49 | 0.49 | 1.00 | 0.99 | 0.99 | 0.007 | 1.95 | 13,4 | 2.6 | 4.7 | 0.49 | 0.99 | 0.294 | 0.293 | 1.003 | 0.546 | 734,362 | 176 by 68 |
| 4689 + 1/2 | 3.5 | 0.50 | 0.50 | 1.00 | 1.02 | 1.00 | 0.006 | 2.10 | 8,0 | 2.7 | 4.8 | 0.49 | 0.98 | 0.296 | 0.295 | 1.002 | 0.552 | 734,350 | 100 by 56 |
| 4690 | 3.8 | 0.51 | 0.51 | 1.00 | 1.03 | 1.00 | 0.006 | 2.08 | 8,0 | 2.7 | 4.9 | 0.49 | 0.97 | 0.296 | 0.295 | 1.005 | 0.555 | 458,450 | 56 by 56 |
| 4690 + 1/2 | 3.9 | 0.52 | 0.52 | 1.01 | 1.05 | 1.01 | 0.009 | 2.17 | 2,3 | 2.6 | 5.1 | 0.49 | 0.98 | 0.296 | 0.293 | 1.009 | 0.564 | 570,326 | 100 by 56 |
| 4691 | 4.2 | 0.52 | 0.52 | 1.01 | 1.06 | 1.01 | 0.011 | 2.15 | 2,3 | 2.7 | 5.1 | 0.49 | 0.98 | 0.291 | 0.294 | 0.992 | 0.566 | 1406,742 | 64 by 56 |
| 4691 + 1/2 | 4.4 | 0.53 | 0.52 | 1.03 | 1.06 | 1.03 | 0.008 | 2.19 | 2,3 | 2.6 | 4.9 | 0.49 | 0.98 | 0.289 | 0.292 | 0.992 | 0.575 | 1014,554 | 288 by 148 |
| 4692 | 4.6 | 0.54 | 0.52 | 1.04 | 1.05 | 1.04 | 0.013 | 2.32 | 2,3 | 2.5 | 5.0 | 0.49 | 0.99 | 0.291 | 0.292 | 0.997 | 0.581 | 1106,278 | 80 by 56 |
| 4692 + 1/2 | 4.8 | 0.54 | 0.52 | 1.04 | 1.02 | 1.02 | 0.020 | 2.28 | 2,3 | 2.6 | 4.8 | 0.49 | 0.98 | 0.292 | 0.292 | 1.001 | 0.587 | 402,346 | 48 by 56 |
| 4693 | 4.9 | 0.54 | 0.52 | 1.03 | 1.07 | 1.03 | 0.008 | 2.37 | 5,0 | 2.5 | 4.7 | 0.49 | 1.01 | 0.293 | 0.294 | 0.999 | 0.593 | 1174,286 | 132 by 64 |
| 4693 + 1/2 | 5.3 | 0.54 | 0.52 | 1.04 | 1.06 | 1.04 | 0.017 | 2.84 | 2,2 | 2.5 | 4.8 | 0.49 | 1.02 | 0.296 | 0.294 | 1.008 | 0.603 | 1226,190 | 112 by 104 |
| 4694 | 5.4 | 0.53 | 0.52 | 1.03 | 1.07 | 1.03 | 0.011 | 3.50 | 2,2 | 2.6 | 5.8 | 0.49 | 1.02 | 0.295 | 0.294 | 1.002 | 0.612 | 1198,514 | 84 by 76 |
| 4694 + 1/2 | 5.8 | 0.53 | 0.52 | 1.03 | 1.06 | 1.03 | 0.015 | 3.51 | 2,2 | 2.6 | 6.2 | 0.49 | 1.03 | 0.295 | 0.294 | 1.006 | 0.620 | 1182,274 | 172 by 76 |
| 4695 | 5.8 | 0.53 | 0.52 | 1.03 | 1.06 | 1.03 | 0.012 | 4.46 | 2,2 | 2.6 | 7.7 | 0.50 | 1.03 | 0.292 | 0.294 | 0.992 | 0.629 | 1262,542 | 136 by 160 |
| 4695 + 1/2 | 6.3 | 0.53 | 0.52 | 1.03 | 1.04 | 1.03 | 0.017 | 4.70 | 2,2 | 2.6 | 7.7 | 0.50 | 1.04 | 0.293 | 0.295 | 0.994 | 0.638 | 1198,502 | 84 by 76 |
| 4696 | 6.5 | 0.54 | 0.52 | 1.03 | 1.05 | 1.03 | 0.017 | 5.50 | 2,2 | 2.6 | 4.6 | 0.50 | 1.02 | 0.294 | 0.293 | 1.004 | 0.649 | 654,434 | 104 by 84 |
| 4696 + 1/2 | 6.8 | 0.53 | 0.52 | 1.02 | 1.05 | 1.02 | 0.016 | 5.62 | 2,2 | 2.8 | 5.2 | 0.49 | 1.03 | 0.295 | 0.293 | 1.007 | 0.660 | 726,514 | 148 by 72 |
| 4697 | 7.1 | 0.53 | 0.52 | 1.01 | 1.04 | 1.01 | 0.016 | 5.59 | 2,2 | 2.8 | 6.5 | 0.49 | 1.02 | 0.293 | 0.297 | 0.987 | 0.671 | 1298,586 | 92 by 76 |
| 4697 + 1/2 | 7.3 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.023 | 5.61 | 2,2 | 2.6 | 4.2 | 0.49 | 1.01 | 0.298 | 0.298 | 0.999 | 0.682 | 646,414 | 124 by 60 |
| 4698 | 7.9 | 0.52 | 0.52 | 1.01 | 0.99 | 0.99 | 0.043 | 5.80 | 2,2 | 2.6 | 4.5 | 0.48 | 0.99 | 0.301 | 0.301 | 0.999 | 0.694 | 618,402 | 88 by 64 |
| 4698 + 1/2 | 8.2 | 0.52 | 0.52 | 1.00 | 1.02 | 1.00 | 0.032 | 6.20 | 2,2 | 2.6 | 4.0 | 0.49 | 0.98 | 0.305 | 0.305 | 1.001 | 0.706 | 306,282 | 48 by 48 |
| 4699 | 8.5 | 0.52 | 0.52 | 0.99 | 1.01 | 0.99 | 0.040 | 5.47 | 2,2 | 2.7 | 4.5 | 0.48 | 0.95 | 0.308 | 0.308 | 1.001 | 0.714 | 870,38 | 64 by 44 |
| 4699 + 1/2 | 8.9 | 0.48 | 0.52 | 0.92 | 0.98 | 0.92 | 0.033 | 3.14 | 1,2 | 2.7 | 4.5 | 0.48 | 0.93 | 0.315 | 0.309 | 1.019 | 0.723 | 942,46 | 244 by 52 |
| 4700 | 9.1 | 0.46 | 0.52 | 0.88 | 0.95 | 0.88 | 0.036 | 2.93 | 3,0 | 3.0 | 6.8 | 0.48 | 0.93 | 0.310 | 0.314 | 0.989 | 0.734 | 798,510 | 80 by 60 |
| 4700 + 1/2 | 9.4 | 0.45 | 0.52 | 0.86 | 0.93 | 0.86 | 0.044 | 3.19 | 3,0 | 3.0 | 7.9 | 0.48 | 0.94 | 0.313 | 0.315 | 0.993 | 0.742 | 1782,886 | 112 by 172 |
| 4701 | 9.6 | 0.45 | 0.52 | 0.85 | 0.91 | 0.85 | 0.045 | 3.23 | 3,0 | 3.2 | 6.3 | 0.48 | 0.95 | 0.315 | 0.315 | 1.002 | 0.752 | 890,514 | 92 by 104 |
| 4701 + 1/2 | 10.0 | 0.44 | 0.52 | 0.85 | 0.91 | 0.85 | 0.042 | 3.15 | 1,1 | 3.3 | 6.2 | 0.48 | 0.98 | 0.317 | 0.316 | 1.002 | 0.760 | 1802,918 | 104 by 120 |
| 4702 | 10.2 | 0.44 | 0.52 | 0.85 | 0.86 | 0.85 | 0.059 | 3.74 | 2,0 | 3.4 | 6.3 | 0.48 | 0.97 | 0.317 | 0.316 | 1.001 | 0.769 | 738,42 | 84 by 44 |
| 4702 + 1/2 | 10.8 | 0.45 | 0.52 | 0.86 | 0.89 | 0.86 | 0.049 | 4.16 | 2,0 | 3.6 | 5.2 | 0.48 | 0.99 | 0.316 | 0.319 | 0.993 | 0.776 | 1030,474 | 192 by 108 |
| 4703 | 10.8 | 0.45 | 0.52 | 0.86 | 0.87 | 0.86 | 0.041 | 4.39 | 2,0 | 3.8 | 5.7 | 0.47 | 1.00 | 0.322 | 0.319 | 1.011 | 0.786 | 930,474 | 136 by 84 |
| 4703 + 1/2 | 11.5 | 0.44 | 0.52 | 0.85 | 0.90 | 0.85 | 0.032 | 4.23 | 2,0 | 4.0 | 6.2 | 0.47 | 1.01 | 0.321 | 0.323 | 0.992 | 0.794 | 1562,778 | 60 by 72 |
| 4704 | 11.6 | 0.53 | 0.52 | 1.03 | 0.79 | 0.79 | 0.072 | 3.58 | 2,0 | 4.3 | 6.6 | 0.47 | 0.98 | 0.324 | 0.324 | 1.001 | 0.800 | 910,494 | 104 by 108 |
| 4704 + 1/2 | 12.0 | 0.43 | 0.52 | 0.82 | 0.84 | 0.82 | 0.040 | 3.46 | 2,0 | 4.6 | 7.0 | 0.46 | 0.99 | 0.326 | 0.326 | 1.001 | 0.807 | 494,302 | 124 by 72 |
| 4705 | 12.4 | 0.44 | 0.52 | 0.85 | 0.86 | 0.85 | 0.043 | 2.98 | 2,0 | 5.0 | 7.5 | 0.46 | 0.98 | 0.327 | 0.329 | 0.994 | 0.813 | 1066,914 | 72 by 52 |
| 4705 + 1/2 | 13.0 | 0.46 | 0.52 | 0.88 | 0.88 | 0.88 | 0.059 | 2.39 | 15,4 | 5.3 | 8.1 | 0.45 | 0.98 | 0.333 | 0.332 | 1.002 | 0.818 | 1854,670 | 76 by 104 |
| 4706 | 13.0 | 0.48 | 0.52 | 0.92 | 0.96 | 0.92 | 0.035 | 1.74 | 2,0 | 5.7 | 8.6 | 0.45 | 0.97 | 0.336 | 0.335 | 1.005 | 0.824 | 462,266 | 120 by 76 |
| 4706 + 1/2 | 13.2 | 0.49 | 0.52 | 0.93 | 0.96 | 0.93 | 0.040 | 2.63 | 1,0 | 6.1 | 9.0 | 0.44 | 0.98 | 0.337 | 0.340 | 0.993 | 0.829 | 1854,622 | 72 by 92 |
| 4707 | 13.7 | 0.51 | 0.53 | 0.96 | 0.93 | 0.93 | 0.051 | 2.01 | 1,0 | 6.5 | 9.4 | 0.44 | 0.97 | 0.343 | 0.343 | 0.999 | 0.834 | 1866,950 | 56 by 116 |
| 4707 + 1/2 | 14.0 | 0.53 | 0.54 | 0.99 | 0.96 | 0.96 | 0.050 | 1.66 | 1,0 | 6.9 | 9.9 | 0.44 | 0.98 | 0.352 | 0.346 | 1.017 | 0.838 | 50,222 | 48 by 52 |
| 4708 | 14.3 | 0.54 | 0.54 | 0.99 | 1.05 | 0.99 | 0.036 | 1.71 | 14,2 | 7.4 | 10.4 | 0.44 | 1.00 | 0.349 | 0.352 | 0.992 | 0.843 | 242,46 | 80 by 40 |
| 4708 + 1/2 | 14.4 | 0.55 | 0.55 | 1.00 | 1.04 | 1.00 | 0.031 | 1.68 | 14,2 | 7.9 | 10.8 | 0.44 | 0.99 | 0.352 | 0.356 | 0.987 | 0.845 | 1870,582 | 64 by 72 |
| 4709 | 14.7 | 0.56 | 0.56 | 0.99 | 1.01 | 0.99 | 0.039 | 1.88 | 14,2 | 8.6 | 11.0 | 0.45 | 1.01 | 0.361 | 0.359 | 1.006 | 0.849 | 1858,554 | 96 by 116 |
| 4709 + 1/2 | 15.1 | 0.58 | 0.57 | 1.01 | 1.15 | 1.01 | 0.026 | 2.24 | 14,2 | 9.2 | 11.2 | 0.45 | 1.02 | 0.366 | 0.365 | 1.003 | 0.854 | 1778,434 | 60 by 76 |
| 4710 | 15.5 | 0.58 | 0.59 | 1.00 | 1.17 | 1.00 | 0.018 | 2.42 | 15,2 | 9.8 | 11.4 | 0.45 | 1.04 | 0.369 | 0.373 | 0.989 | 0.854 | 1794,430 | 92 by 124 |
| 4710 + 1/2 | 15.5 | 0.60 | 0.59 | 1.01 | 1.07 | 1.01 | 0.039 | 2.21 | 15,2 | 10.5 | 11.6 | 0.45 | 1.05 | 0.379 | 0.378 | 1.002 | 0.856 | 1858,506 | 88 by 112 |
| 4711 | 15.9 | 0.64 | 0.60 | 1.08 | 1.20 | 1.08 | 0.021 | 2.30 | 15,2 | 11.2 | 11.9 | 0.46 | 1.11 | 0.388 | 0.388 | 1.001 | 0.858 | 1830,446 | 96 by 124 |
| 4711 + 1/2 | 16.0 | 0.66 | 0.60 | 1.09 | 1.06 | 1.06 | 0.033 | 1.89 | 14,1 | 11.9 | 12.7 | 0.46 | 1.07 | 0.397 | 0.395 | 1.005 | 0.859 | 1850,462 | 112 by 124 |
| 4712 | 16.2 | 0.64 | 0.61 | 1.06 | 0.97 | 0.97 | 0.045 | 1.77 | 14,1 | 12.6 | 13.4 | 0.46 | 1.06 | 0.401 | 0.404 | 0.994 | 0.861 | 1794,386 | 48 by 56 |
| 4712 + 1/2 | 16.4 | 0.65 | 0.62 | 1.06 | 1.01 | 1.01 | 0.040 | 1.74 | 14,1 | 13.3 | 15.8 | 0.46 | 1.08 | 0.411 | 0.411 | 1.002 | 0.861 | 1834,418 | 180 by 216 |
| 4713 | 16.6 | 0.66 | 0.62 | 1.06 | 1.04 | 1.04 | 0.038 | 2.34 | 14,1 | 14.0 | 14.8 | 0.47 | 1.10 | 0.420 | 0.421 | 0.998 | 0.863 | 1826,394 | 160 by 188 |
| 4713 + 1/2 | 16.4 | 0.70 | 0.63 | 1.12 | 1.04 | 1.04 | 0.034 | 1.65 | 0,6 | 14.7 | 15.4 | 0.47 | 1.11 | 0.431 | 0.427 | 1.008 | 0.866 | 1874,442 | 60 by 72 |
| 4714 | 16.4 | 0.70 | 0.63 | 1.12 | 0.94 | 0.94 | 0.043 | 1.69 | 15,1 | 15.4 | 16.0 | 0.47 | 1.06 | 0.434 | 0.434 | 1.000 | 0.867 | 1426,46 | 92 by 64 |
| 4714 + 1/2 | 16.3 | 0.68 | 0.63 | 1.08 | 0.90 | 0.90 | 0.043 | 1.67 | 15,6 | 16.0 | 16.6 | 0.47 | 1.05 | 0.444 | 0.436 | 1.019 | 0.868 | 1570,142 | 104 by 92 |
| 4715 | 16.1 | 0.69 | 0.63 | 1.09 | 0.85 | 0.85 | 0.047 | 1.64 | 15,6 | 16.7 | 17.6 | 0.48 | 1.00 | 0.438 | 0.445 | 0.984 | 0.868 | 1826,362 | 64 by 72 |
| 4715 + 1/2 | 15.8 | 0.66 | 0.64 | 1.03 | 0.88 | 0.88 | 0.043 | 1.49 | 15,6 | 17.6 | 18.7 | 0.48 | 1.01 | 0.446 | 0.449 | 0.992 | 0.869 | 1522,826 | 68 by 64 |
| 4716 | 15.8 | 0.64 | 0.64 | 1.00 | 0.91 | 0.91 | 0.036 | 1.63 | 15,6 | 18.6 | 19.7 | 0.48 | 1.00 | 0.455 | 0.453 | 1.004 | 0.869 | 1846,366 | 60 by 76 |
| 4716 + 1/2 | 15.6 | 0.60 | 0.64 | 0.93 | 1.00 | 0.93 | 0.024 | 1.56 | 15,6 | 19.7 | 20.8 | 0.49 | 1.02 | 0.460 | 0.463 | 0.994 | 0.869 | 1658,194 | 68 by 48 |
| 4717 | 15.3 | 0.61 | 0.64 | 0.95 | 0.98 | 0.95 | 0.029 | 1.50 | 15,6 | 20.8 | 22.0 | 0.49 | 1.00 | 0.471 | 0.466 | 1.009 | 0.871 | 1814,638 | 80 by 96 |
| 4717 + 1/2 | 14.7 | 0.63 | 0.64 | 0.98 | 1.06 | 0.98 | 0.027 | 1.46 | 4,1 | 22.1 | 23.3 | 0.49 | 1.00 | 0.473 | 0.478 | 0.990 | 0.871 | 1678,218 | 68 by 68 |
| 4718 | 14.7 | 0.62 | 0.64 | 0.98 | 1.01 | 0.98 | 0.035 | 1.58 | 1,7 | 23.4 | 24.6 | 0.50 | 1.00 | 0.485 | 0.484 | 1.003 | 0.872 | 1778,586 | 80 by 80 |
| 4718 + 1/2 | 14.5 | 0.63 | 0.64 | 0.98 | 1.01 | 0.98 | 0.038 | 1.63 | 1,7 | 24.6 | 26.0 | 0.50 | 0.99 | 0.494 | 0.494 | 1.000 | 0.873 | 1746,266 | 56 by 48 |
| 4719 | 14.4 | 0.62 | 0.64 | 0.97 | 1.01 | 0.97 | 0.037 | 1.57 | 1,5 | 25.8 | 27.4 | 0.50 | 0.99 | 0.503 | 0.504 | 0.999 | 0.872 | 766,526 | 92 by 80 |
| 4719 + 1/2 | 14.3 | 0.64 | 0.63 | 1.01 | 0.98 | 0.98 | 0.051 | 2.15 | 0,7 | 27.2 | 28.9 | 0.50 | 0.97 | 0.514 | 0.511 | 1.005 | 0.873 | 786,554 | 64 by 64 |
| 4720 | 14.3 | 0.64 | 0.63 | 1.01 | 1.12 | 1.01 | 0.027 | 2.15 | 0,7 | 28.4 | 30.2 | 0.51 | 1.00 | 0.519 | 0.518 | 1.001 | 0.873 | 714,490 | 60 by 52 |
| 4720 + 1/2 | 14.2 | 0.64 | 0.63 | 1.02 | 0.98 | 0.98 | 0.055 | 1.61 | 0,7 | 29.6 | 31.4 | 0.51 | 0.97 | 0.523 | 0.525 | 0.996 | 0.874 | 830,574 | 48 by 48 |
| 4721 | 14.0 | 0.65 | 0.63 | 1.03 | 1.05 | 1.03 | 0.049 | 1.46 | 4,8 | 30.6 | 33.1 | 0.51 | 1.00 | 0.531 | 0.531 | 1.001 | 0.873 | 182,10 | 44 by 12 |
| 4721 + 1/2 | 14.2 | 0.63 | 0.63 | 1.00 | 1.04 | 1.00 | 0.053 | 1.34 | 5,0 | 31.8 | 34.2 | 0.51 | 1.00 | 0.540 | 0.535 | 1.009 | 0.875 | 726,490 | 108 by 92 |
| 4722 | 14.0 | 0.63 | 0.63 | 1.00 | 1.02 | 1.00 | 0.055 | 1.37 | 3,0 | 32.1 | 34.0 | 0.51 | 1.00 | 0.539 | 0.539 | 1.000 | 0.874 | 750,526 | 116 by 112 |
| 4722 + 1/2 | 14.1 | 0.63 | 0.63 | 1.00 | 0.99 | 0.99 | 0.057 | 1.42 | 2,7 | 33.3 | 35.3 | 0.51 | 0.98 | 0.538 | 0.542 | 0.993 | 0.872 | 750,518 | 56 by 52 |
| 4723 | 13.9 | 0.64 | 0.63 | 1.01 | 1.03 | 1.01 | 0.052 | 1.38 | 2,7 | 33.9 | 36.2 | 0.51 | 1.00 | 0.545 | 0.542 | 1.006 | 0.872 | 742,510 | 68 by 64 |
| 4723 + 1/2 | 13.5 | 0.65 | 0.63 | 1.03 | 1.07 | 1.03 | 0.047 | 1.42 | 2,7 | 34.5 | 37.1 | 0.51 | 1.00 | 0.545 | 0.546 | 0.997 | 0.871 | 794,558 | 52 by 56 |
| 4724 | 13.7 | 0.64 | 0.63 | 1.01 | 1.03 | 1.01 | 0.053 | 1.28 | 11,4 | 34.9 | 36.8 | 0.51 | 0.99 | 0.548 | 0.548 | 0.999 | 0.871 | 650,442 | 68 by 60 |
| 4724 + 1/2 | 13.4 | 0.63 | 0.63 | 1.01 | 1.07 | 1.01 | 0.047 | 1.38 | 13,4 | 35.7 | 38.5 | 0.52 | 0.98 | 0.551 | 0.552 | 0.999 | 0.870 | 790,538 | 76 by 64 |
| 4725 | 13.3 | 0.63 | 0.63 | 1.00 | 1.02 | 1.00 | 0.062 | 1.41 | 1,7 | 35.8 | 40.7 | 0.51 | 0.98 | 0.556 | 0.555 | 1.002 | 0.869 | 702,486 | 56 by 56 |
| 4725 + 1/2 | 13.6 | 0.62 | 0.63 | 0.98 | 1.00 | 0.98 | 0.069 | 1.54 | 12,4 | 36.6 | 41.3 | 0.51 | 0.98 | 0.559 | 0.559 | 1.000 | 0.868 | 694,466 | 96 by 92 |
| 4726 | 13.7 | 0.61 | 0.63 | 0.97 | 1.00 | 0.97 | 0.071 | 1.56 | 13,5 | 37.2 | 41.7 | 0.51 | 0.97 | 0.562 | 0.562 | 0.999 | 0.867 | 686,466 | 68 by 60 |
| 4726 + 1/2 | 13.8 | 0.61 | 0.63 | 0.97 | 0.99 | 0.97 | 0.075 | 1.53 | 13,5 | 36.9 | 42.2 | 0.51 | 0.97 | 0.566 | 0.562 | 1.007 | 0.866 | 682,470 | 72 by 64 |
| 4727 | 13.8 | 0.60 | 0.63 | 0.95 | 0.99 | 0.95 | 0.077 | 1.73 | 13,5 | 36.4 | 41.7 | 0.51 | 0.97 | 0.569 | 0.562 | 1.013 | 0.865 | 678,470 | 68 by 76 |
| 4727 + 1/2 | 13.2 | 0.61 | 0.64 | 0.96 | 0.98 | 0.96 | 0.079 | 1.49 | 6,2 | 32.2 | 36.7 | 0.51 | 0.97 | 0.562 | 0.563 | 0.998 | 0.864 | 666,466 | 72 by 52 |
| 4728 | 13.2 | 0.62 | 0.64 | 0.98 | 0.97 | 0.97 | 0.084 | 1.32 | 6,2 | 32.9 | 37.4 | 0.51 | 0.97 | 0.560 | 0.561 | 0.999 | 0.862 | 602,402 | 56 by 48 |
| 4728 + 1/2 | 13.2 | 0.62 | 0.64 | 0.97 | 1.00 | 0.97 | 0.076 | 1.79 | 10,0 | 33.0 | 38.9 | 0.51 | 0.98 | 0.559 | 0.561 | 0.998 | 0.861 | 742,502 | 64 by 52 |
| 4729 | 13.4 | 0.62 | 0.64 | 0.97 | 0.97 | 0.97 | 0.083 | 1.18 | 9,3 | 33.4 | 39.4 | 0.51 | 0.97 | 0.557 | 0.564 | 0.987 | 0.859 | 634,430 | 52 by 52 |
| 4729 + 1/2 | 13.5 | 0.63 | 0.64 | 0.98 | 0.98 | 0.98 | 0.091 | 1.25 | 13,8 | 32.2 | 36.8 | 0.51 | 0.97 | 0.569 | 0.569 | 1.000 | 0.858 | 626,418 | 52 by 56 |
| 4730 | 14.3 | 0.64 | 0.64 | 1.00 | 1.01 | 1.00 | 0.089 | 1.34 | 9,0 | 32.7 | 36.9 | 0.51 | 0.99 | 0.578 | 0.576 | 1.004 | 0.858 | 614,414 | 52 by 56 |
| 4730 + 1/2 | 14.9 | 0.64 | 0.64 | 1.00 | 0.99 | 0.99 | 0.095 | 1.62 | 5,4 | 31.3 | 37.1 | 0.52 | 0.98 | 0.584 | 0.580 | 1.007 | 0.856 | 726,490 | 64 by 64 |
| 4731 | 15.2 | 0.64 | 0.64 | 1.00 | 0.97 | 0.97 | 0.099 | 1.33 | 4,2 | 31.4 | 34.8 | 0.52 | 0.97 | 0.583 | 0.584 | 0.998 | 0.854 | 598,406 | 64 by 72 |
| 4731 + 1/2 | 16.0 | 0.64 | 0.64 | 1.00 | 0.98 | 0.98 | 0.099 | 1.58 | 4,2 | 30.7 | 35.3 | 0.52 | 0.99 | 0.590 | 0.584 | 1.010 | 0.853 | 538,358 | 132 by 104 |
| 4732 | 16.2 | 0.62 | 0.64 | 0.98 | 0.97 | 0.97 | 0.098 | 1.51 | 4,2 | 29.2 | 35.0 | 0.51 | 0.99 | 0.583 | 0.592 | 0.985 | 0.850 | 766,510 | 76 by 56 |
| 4732 + 1/2 | 16.7 | 0.73 | 0.64 | 1.15 | 0.93 | 0.93 | 0.113 | 1.61 | 4,2 | 29.4 | 34.7 | 0.51 | 0.98 | 0.595 | 0.592 | 1.005 | 0.850 | 1594,258 | 356 by 204 |
| 4733 | 15.6 | 0.62 | 0.65 | 0.97 | 0.97 | 0.97 | 0.109 | 1.60 | 4,2 | 29.6 | 35.3 | 0.51 | 0.99 | 0.595 | 0.607 | 0.980 | 0.847 | 502,338 | 60 by 52 |
| 4733 + 1/2 | 15.6 | 0.64 | 0.65 | 0.98 | 0.98 | 0.98 | 0.116 | 1.39 | 4,2 | 29.4 | 36.4 | 0.51 | 0.99 | 0.619 | 0.613 | 1.010 | 0.846 | 554,382 | 60 by 56 |
| 4734 | 15.5 | 0.66 | 0.66 | 1.00 | 1.00 | 1.00 | 0.115 | 1.31 | 4,2 | 29.1 | 38.3 | 0.51 | 1.00 | 0.630 | 0.626 | 1.006 | 0.843 | 546,374 | 56 by 56 |
| 4734 + 1/2 | 14.7 | 0.65 | 0.67 | 0.97 | 1.00 | 0.97 | 0.114 | 1.27 | 5,1 | 28.9 | 36.7 | 0.51 | 0.99 | 0.634 | 0.639 | 0.992 | 0.841 | 530,370 | 48 by 52 |
| 4735 | 15.7 | 0.66 | 0.69 | 0.97 | 1.00 | 0.97 | 0.115 | 1.21 | 14,4 | 28.5 | 36.6 | 0.51 | 1.00 | 0.647 | 0.646 | 1.001 | 0.839 | 522,366 | 52 by 60 |
| 4735 + 1/2 | 15.6 | 0.68 | 0.70 | 0.96 | 1.00 | 0.96 | 0.120 | 1.30 | 4,2 | 26.0 | 34.9 | 0.50 | 0.99 | 0.659 | 0.659 | 1.000 | 0.836 | 514,362 | 60 by 64 |
| 4736 | 13.3 | 0.70 | 0.72 | 0.97 | 0.99 | 0.97 | 0.132 | 1.24 | 4,2 | 23.6 | 34.9 | 0.50 | 0.98 | 0.671 | 0.668 | 1.005 | 0.833 | 434,306 | 64 by 56 |
| 4736 + 1/2 | 13.4 | 0.71 | 0.73 | 0.97 | 1.00 | 0.97 | 0.127 | 1.17 | 15,6 | 22.7 | 33.8 | 0.50 | 0.99 | 0.676 | 0.685 | 0.988 | 0.831 | 426,298 | 64 by 64 |
| 4737 | 13.0 | 0.73 | 0.74 | 0.99 | 1.00 | 0.99 | 0.126 | 1.25 | 15,6 | 21.9 | 30.3 | 0.49 | 0.99 | 0.698 | 0.694 | 1.006 | 0.828 | 414,294 | 52 by 52 |
| 4737 + 1/2 | 12.9 | 0.75 | 0.76 | 0.99 | 0.97 | 0.97 | 0.123 | 1.23 | 13,0 | 22.6 | 30.4 | 0.48 | 0.98 | 0.712 | 0.718 | 0.992 | 0.825 | 406,290 | 52 by 56 |
| 4738 | 12.5 | 0.78 | 0.77 | 1.01 | 1.03 | 1.01 | 0.107 | 1.22 | 5,3 | 23.3 | 31.1 | 0.48 | 0.98 | 0.738 | 0.741 | 0.996 | 0.823 | 622,426 | 136 by 104 |
| 4738 + 1/2 | 15.2 | 0.80 | 0.79 | 1.00 | 0.99 | 0.99 | 0.113 | 1.27 | 15,6 | 24.3 | 29.5 | 0.48 | 0.99 | 0.770 | 0.767 | 1.004 | 0.820 | 1282,830 | 56 by 56 |
| 4739 | 14.7 | 0.81 | 0.81 | 1.00 | 1.00 | 1.00 | 0.093 | 1.38 | 10,4 | 25.1 | 27.6 | 0.47 | 1.00 | 0.796 | 0.796 | 0.999 | 0.818 | 1286,830 | 52 by 56 |
| 4739 + 1/2 | 14.5 | 0.83 | 0.83 | 1.00 | 1.02 | 1.00 | 0.106 | 1.36 | 15,6 | 26.0 | 28.4 | 0.47 | 0.98 | 0.823 | 0.825 | 0.997 | 0.815 | 1298,838 | 52 by 52 |
| 4740 | 14.4 | 0.86 | 0.87 | 0.98 | 0.96 | 0.96 | 0.132 | 1.42 | 10,4 | 27.0 | 29.7 | 0.47 | 0.96 | 0.855 | 0.855 | 0.999 | 0.812 | 1314,842 | 52 by 56 |
| 4740 + 1/2 | 14.7 | 0.91 | 0.92 | 1.00 | 1.02 | 1.00 | 0.092 | 1.45 | 10,4 | 27.8 | 30.7 | 0.45 | 1.00 | 0.888 | 0.891 | 0.996 | 0.809 | 1402,878 | 48 by 52 |
| 4741 | 15.2 | 0.97 | 0.98 | 1.00 | 0.96 | 0.96 | 0.093 | 1.31 | 11,7 | 28.6 | 31.7 | 0.44 | 0.96 | 0.927 | 0.926 | 1.001 | 0.806 | 1418,886 | 48 by 52 |
| 4741 + 1/2 | 15.0 | 1.04 | 1.03 | 1.01 | 1.03 | 1.01 | 0.057 | 1.78 | 11,1 | 29.4 | 32.4 | 0.44 | 1.00 | 0.965 | 0.965 | 1.000 | 0.803 | 1430,890 | 52 by 52 |
| 4742 | 14.9 | 1.08 | 1.08 | 1.00 | 1.01 | 1.00 | 0.044 | 1.54 | 11,1 | 30.1 | 32.7 | 0.44 | 1.00 | 1.003 | 1.000 | 1.003 | 0.799 | 1446,898 | 52 by 56 |
| 4742 + 1/2 | 14.9 | 1.12 | 1.12 | 1.01 | 1.00 | 1.00 | 0.046 | 2.05 | 11,1 | 30.5 | 32.9 | 0.44 | 1.00 | 1.035 | 1.037 | 0.998 | 0.797 | 1458,906 | 52 by 56 |
| 4743 | 14.7 | 1.15 | 1.15 | 1.00 | 0.99 | 0.99 | 0.042 | 1.76 | 9,0 | 30.7 | 32.2 | 0.44 | 0.99 | 1.071 | 1.072 | 0.999 | 0.793 | 1478,906 | 52 by 56 |
| 4743 + 1/2 | 14.6 | 1.19 | 1.15 | 1.03 | 1.05 | 1.03 | 0.031 | 2.26 | 11,1 | 31.0 | 32.7 | 0.44 | 0.99 | 1.108 | 1.111 | 0.997 | 0.790 | 1502,918 | 56 by 56 |
| 4744 | 14.9 | 1.24 | 1.15 | 1.07 | 1.02 | 1.02 | 0.051 | 1.77 | 12,5 | 31.2 | 33.0 | 0.44 | 1.00 | 1.152 | 1.150 | 1.001 | 0.787 | 1514,926 | 56 by 56 |
| 4744 + 1/2 | 14.8 | 1.26 | 1.15 | 1.10 | 1.06 | 1.06 | 0.047 | 1.65 | 13,5 | 31.4 | 33.3 | 0.45 | 1.03 | 1.192 | 1.193 | 0.999 | 0.783 | 1538,930 | 60 by 60 |
| 4745 | 14.7 | 1.30 | 1.15 | 1.12 | 1.08 | 1.08 | 0.066 | 2.23 | 8,0 | 31.4 | 33.3 | 0.45 | 1.03 | 1.235 | 1.233 | 1.002 | 0.780 | 1582,622 | 48 by 52 |
| 4745 + 1/2 | 14.8 | 1.32 | 1.15 | 1.14 | 1.14 | 1.14 | 0.043 | 2.17 | 9,1 | 31.3 | 33.2 | 0.46 | 1.08 | 1.273 | 1.269 | 1.003 | 0.777 | 1090,686 | 56 by 72 |
| 4746 | 14.5 | 1.32 | 1.15 | 1.15 | 1.17 | 1.15 | 0.037 | 2.01 | 9,1 | 31.1 | 33.1 | 0.46 | 1.09 | 1.304 | 1.292 | 1.009 | 0.774 | 1594,954 | 68 by 56 |
| 4746 + 1/2 | 14.2 | 1.32 | 1.15 | 1.14 | 1.15 | 1.14 | 0.052 | 2.10 | 13,8 | 30.8 | 32.8 | 0.47 | 1.09 | 1.319 | 1.308 | 1.009 | 0.771 | 1618,962 | 64 by 60 |
| 4747 | 13.8 | 1.30 | 1.15 | 1.13 | 1.18 | 1.13 | 0.036 | 2.33 | 13,5 | 30.4 | 32.4 | 0.47 | 1.08 | 1.311 | 1.324 | 0.991 | 0.767 | 1646,630 | 56 by 48 |
| 4747 + 1/2 | 13.3 | 1.30 | 1.15 | 1.13 | 1.13 | 1.13 | 0.061 | 2.48 | 13,8 | 29.9 | 31.9 | 0.48 | 1.08 | 1.328 | 1.315 | 1.010 | 0.765 | 1662,982 | 68 by 56 |
| 4748 | 12.7 | 1.30 | 1.15 | 1.13 | 1.13 | 1.13 | 0.075 | 2.26 | 13,8 | 29.3 | 31.4 | 0.48 | 1.08 | 1.339 | 1.316 | 1.018 | 0.762 | 1682,986 | 64 by 64 |
| 4748 + 1/2 | 12.3 | 1.26 | 1.15 | 1.09 | 1.04 | 1.04 | 0.110 | 1.68 | 12,4 | 28.8 | 30.8 | 0.49 | 1.01 | 1.305 | 1.331 | 0.980 | 0.760 | 1574,942 | 88 by 64 |
| 4749 | 11.9 | 1.26 | 1.15 | 1.09 | 1.05 | 1.05 | 0.110 | 3.01 | 14,8 | 28.1 | 30.2 | 0.49 | 1.01 | 1.320 | 1.319 | 1.000 | 0.757 | 1738,1006 | 68 by 56 |
| 4749 + 1/2 | 11.4 | 1.26 | 1.15 | 1.10 | 1.06 | 1.06 | 0.108 | 4.00 | 14,8 | 27.4 | 29.4 | 0.50 | 1.02 | 1.334 | 1.296 | 1.029 | 0.755 | 1762,1010 | 72 by 60 |
| 4750 | 10.9 | 1.21 | 1.15 | 1.05 | 1.03 | 1.03 | 0.094 | 1.84 | 13,8 | 26.6 | 28.6 | 0.50 | 1.01 | 1.282 | 1.304 | 0.983 | 0.753 | 1630,966 | 100 by 64 |
| 4750 + 1/2 | 10.6 | 1.21 | 1.15 | 1.05 | 1.02 | 1.02 | 0.096 | 1.83 | 14,8 | 25.8 | 27.8 | 0.51 | 1.00 | 1.288 | 1.275 | 1.010 | 0.750 | 1810,1030 | 68 by 48 |
| 4751 | 10.2 | 1.18 | 1.15 | 1.02 | 1.02 | 1.02 | 0.085 | 1.69 | 14,5 | 25.0 | 26.9 | 0.52 | 1.02 | 1.269 | 1.270 | 0.999 | 0.748 | 1834,1034 | 68 by 48 |
| 4751 + 1/2 | 9.9 | 1.15 | 1.14 | 1.01 | 1.00 | 1.00 | 0.081 | 2.00 | 14,8 | 24.2 | 26.0 | 0.52 | 1.00 | 1.258 | 1.240 | 1.014 | 0.746 | 1690,990 | 120 by 76 |
| 4752 | 9.3 | 1.09 | 1.10 | 1.00 | 1.02 | 1.00 | 0.051 | 1.74 | 14,8 | 23.3 | 25.0 | 0.53 | 0.99 | 1.210 | 1.220 | 0.992 | 0.743 | 1678,994 | 108 by 72 |
| 4752 + 1/2 | 9.0 | 1.04 | 1.07 | 0.98 | 0.97 | 0.97 | 0.059 | 1.50 | 13,4 | 22.5 | 24.1 | 0.53 | 0.99 | 1.169 | 1.197 | 0.977 | 0.742 | 1154,706 | 52 by 80 |
| 4753 | 8.9 | 1.04 | 1.03 | 1.01 | 1.01 | 1.01 | 0.053 | 2.61 | 14,8 | 21.6 | 23.3 | 0.54 | 1.01 | 1.183 | 1.170 | 1.011 | 0.739 | 1714,1010 | 124 by 76 |
| 4753 + 1/2 | 8.7 | 1.02 | 1.01 | 1.01 | 1.00 | 1.00 | 0.057 | 2.67 | 14,8 | 20.8 | 22.4 | 0.54 | 0.99 | 1.170 | 1.129 | 1.036 | 0.738 | 1734,1014 | 116 by 72 |
| 4754 | 8.2 | 0.94 | 1.00 | 0.94 | 0.97 | 0.94 | 0.016 | 1.32 | 2,2 | 19.9 | 21.4 | 0.55 | 0.98 | 1.076 | 1.138 | 0.945 | 0.736 | 338,326 | 68 by 60 |
| 4754 + 1/2 | 8.1 | 0.96 | 0.96 | 1.00 | 1.00 | 1.00 | 0.018 | 2.45 | 15,8 | 19.0 | 20.5 | 0.55 | 1.00 | 1.090 | 1.091 | 0.999 | 0.734 | 1838,1022 | 124 by 64 |
| 4755 | 7.8 | 0.98 | 0.94 | 1.03 | 1.03 | 1.03 | 0.029 | 3.32 | 15,8 | 18.1 | 19.6 | 0.56 | 1.00 | 1.106 | 1.065 | 1.038 | 0.733 | 1790,1034 | 120 by 64 |
| 4755 + 1/2 | 7.7 | 0.95 | 0.92 | 1.03 | 1.02 | 1.02 | 0.027 | 1.50 | 15,5 | 17.5 | 21.9 | 0.56 | 1.00 | 1.055 | 1.032 | 1.022 | 0.731 | 1314,810 | 100 by 84 |
| 4756 | 7.4 | 0.89 | 0.92 | 0.97 | 0.96 | 0.96 | 0.029 | 1.64 | 15,8 | 16.6 | 20.1 | 0.56 | 0.99 | 0.975 | 1.021 | 0.955 | 0.730 | 302,318 | 72 by 56 |
| 4756 + 1/2 | 7.3 | 0.88 | 0.89 | 0.99 | 0.99 | 0.99 | 0.021 | 1.70 | 15,8 | 15.6 | 17.2 | 0.57 | 1.00 | 0.968 | 0.981 | 0.986 | 0.729 | 1198,726 | 60 by 96 |
| 4757 | 7.0 | 0.89 | 0.87 | 1.03 | 1.03 | 1.03 | 0.017 | 1.50 | 13,2 | 14.8 | 16.6 | 0.58 | 1.01 | 0.987 | 0.956 | 1.033 | 0.728 | 1542,858 | 92 by 72 |
| 4757 + 1/2 | 6.8 | 0.86 | 0.84 | 1.02 | 1.02 | 1.02 | 0.012 | 1.47 | 11,6 | 13.9 | 15.6 | 0.58 | 1.00 | 0.944 | 0.925 | 1.021 | 0.727 | 902,618 | 92 by 72 |
| 4758 | 6.6 | 0.80 | 0.83 | 0.97 | 0.97 | 0.97 | 0.004 | 1.44 | 12,4 | 13.1 | 15.0 | 0.59 | 0.98 | 0.879 | 0.913 | 0.963 | 0.727 | 1834,1042 | 104 by 60 |
| 4758 + 1/2 | 6.3 | 0.80 | 0.79 | 1.01 | 1.01 | 1.01 | 0.010 | 1.55 | 13,7 | 12.3 | 14.0 | 0.59 | 0.96 | 0.881 | 0.872 | 1.010 | 0.726 | 1222,722 | 64 by 104 |
| 4759 | 6.1 | 0.78 | 0.77 | 1.02 | 1.02 | 1.02 | 0.007 | 1.72 | 13,7 | 11.6 | 14.5 | 0.60 | 0.96 | 0.866 | 0.843 | 1.027 | 0.725 | 1582,870 | 88 by 80 |
| 4759 + 1/2 | 5.8 | 0.73 | 0.76 | 0.97 | 0.97 | 0.97 | 0.001 | 1.49 | 2,2 | 10.9 | 14.7 | 0.60 | 0.98 | 0.807 | 0.844 | 0.956 | 0.724 | 902,618 | 108 by 72 |
| 4760 | 5.6 | 0.72 | 0.73 | 0.99 | 0.99 | 0.99 | 0.000 | 1.39 | 2,2 | 10.1 | 15.0 | 0.61 | 0.99 | 0.800 | 0.814 | 0.983 | 0.724 | 1702,1022 | 60 by 68 |
| 4760 + 1/2 | 5.4 | 0.73 | 0.72 | 1.03 | 1.03 | 1.03 | 0.000 | 2.05 | 13,7 | 9.5 | 15.0 | 0.62 | 1.03 | 0.821 | 0.795 | 1.034 | 0.724 | 1250,750 | 64 by 104 |
| 4761 | 5.2 | 0.71 | 0.69 | 1.02 | 1.02 | 1.02 | 0.000 | 1.61 | 11,7 | 9.0 | 14.1 | 0.63 | 1.03 | 0.789 | 0.772 | 1.022 | 0.723 | 1410,846 | 116 by 100 |
| 4761 + 1/2 | 5.0 | 0.65 | 0.68 | 0.95 | 0.95 | 0.95 | 0.000 | 1.53 | 7,5 | 8.4 | 14.0 | 0.64 | 1.00 | 0.717 | 0.767 | 0.936 | 0.724 | 906,622 | 136 by 76 |
| 4762 | 4.7 | 0.66 | 0.64 | 1.03 | 1.03 | 1.03 | 0.000 | 1.87 | 13,7 | 7.8 | 13.4 | 0.65 | 1.01 | 0.744 | 0.713 | 1.044 | 0.724 | 1658,898 | 92 by 76 |
| 4762 + 1/2 | 4.4 | 0.63 | 0.64 | 0.99 | 0.99 | 0.99 | 0.000 | 1.65 | 10,5 | 7.4 | 12.4 | 0.66 | 1.02 | 0.708 | 0.719 | 0.985 | 0.724 | 1262,714 | 72 by 112 |
| 4763 | 4.2 | 0.59 | 0.63 | 0.94 | 0.94 | 0.94 | 0.000 | 1.34 | 2,3 | 7.1 | 11.7 | 0.66 | 0.98 | 0.661 | 0.714 | 0.925 | 0.724 | 906,626 | 140 by 92 |
| 4763 + 1/2 | 3.9 | 0.64 | 0.60 | 1.06 | 1.06 | 1.06 | 0.000 | 1.95 | 14,7 | 6.6 | 11.0 | 0.67 | 1.02 | 0.720 | 0.663 | 1.087 | 0.725 | 918,630 | 128 by 84 |
| 4764 | 3.7 | 0.59 | 0.60 | 0.99 | 0.99 | 0.99 | 0.000 | 1.80 | 10,6 | 6.3 | 9.9 | 0.68 | 1.00 | 0.665 | 0.673 | 0.987 | 0.725 | 1286,738 | 68 by 116 |
| 4764 + 1/2 | 3.4 | 0.53 | 0.59 | 0.89 | 0.89 | 0.89 | 0.000 | 1.44 | 15,8 | 6.0 | 8.9 | 0.69 | 0.96 | 0.587 | 0.675 | 0.869 | 0.726 | 630,486 | 128 by 68 |
| 4765 | 3.2 | 0.60 | 0.55 | 1.09 | 1.09 | 1.09 | 0.000 | 2.20 | 14,7 | 5.8 | 8.9 | 0.69 | 1.01 | 0.686 | 0.588 | 1.167 | 0.727 | 966,646 | 168 by 100 |
| 4765 + 1/2 | 3.0 | 0.52 | 0.55 | 0.95 | 0.95 | 0.95 | 0.000 | 1.68 | 10,6 | 5.6 | 8.8 | 0.70 | 0.97 | 0.589 | 0.610 | 0.964 | 0.729 | 1298,738 | 64 by 88 |
| 4766 | 2.7 | 0.52 | 0.55 | 0.95 | 0.95 | 0.95 | 0.000 | 1.98 | 14,7 | 5.3 | 8.5 | 0.71 | 0.97 | 0.585 | 0.611 | 0.957 | 0.730 | 1742,934 | 128 by 92 |
| 4766 + 1/2 | 2.5 | 0.56 | 0.53 | 1.05 | 1.05 | 1.05 | 0.000 | 2.07 | 10,6 | 5.1 | 8.5 | 0.71 | 0.97 | 0.634 | 0.587 | 1.081 | 0.734 | 922,638 | 164 by 96 |
| 4767 | 2.2 | 0.44 | 0.53 | 0.84 | 0.84 | 0.84 | 0.000 | 1.21 | 15,8 | 5.2 | 9.2 | 0.72 | 0.91 | 0.487 | 0.607 | 0.803 | 0.744 | 190,302 | 104 by 72 |
| 4767 + 1/2 | 2.0 | 0.55 | 0.53 | 1.04 | 1.04 | 1.04 | 0.000 | 2.22 | 14,7 | 5.0 | 9.1 | 0.72 | 0.96 | 0.628 | 0.529 | 1.187 | 0.749 | 1770,950 | 120 by 76 |
| 4768 | 1.8 | 0.45 | 0.53 | 0.86 | 0.86 | 0.86 | 0.000 | 1.22 | 10,6 | 5.2 | 8.9 | 0.72 | 0.92 | 0.508 | 0.589 | 0.862 | 0.749 | 934,646 | 160 by 112 |
| 4768 + 1/2 | 1.6 | 0.49 | 0.53 | 0.93 | 0.93 | 0.93 | 0.000 | 2.17 | 14,7 | 5.1 | 8.8 | 0.72 | 0.96 | 0.551 | 0.615 | 0.895 | 0.751 | 1782,958 | 140 by 92 |
| 4769 | 1.6 | 0.55 | 0.52 | 1.04 | 1.04 | 1.04 | 0.000 | 1.61 | 14,7 | 5.2 | 9.0 | 0.72 | 1.00 | 0.628 | 0.577 | 1.089 | 0.752 | 1782,958 | 120 by 80 |
| 4769 + 1/2 | 1.6 | 0.53 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.29 | 10,6 | 5.2 | 9.6 | 0.72 | 1.00 | 0.603 | 0.599 | 1.006 | 0.752 | 886,630 | 172 by 120 |
| 4770 | 1.5 | 0.53 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 10,6 | 5.1 | 9.1 | 0.72 | 1.00 | 0.604 | 0.599 | 1.007 | 0.752 | 1342,794 | 56 by 84 |
| 4770 + 1/2 | 1.5 | 0.52 | 0.52 | 0.99 | 0.99 | 0.99 | 0.000 | 1.23 | 13,7 | 5.3 | 8.7 | 0.72 | 1.00 | 0.595 | 0.602 | 0.988 | 0.751 | 1534,906 | 60 by 56 |
| 4771 | 1.6 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 9,5 | 5.3 | 9.1 | 0.72 | 1.00 | 0.596 | 0.600 | 0.994 | 0.752 | 1366,746 | 64 by 68 |
| 4771 + 1/2 | 1.6 | 0.52 | 0.52 | 1.01 | 1.01 | 1.01 | 0.000 | 1.20 | 8,2 | 5.4 | 9.5 | 0.72 | 1.00 | 0.601 | 0.597 | 1.007 | 0.752 | 1342,770 | 56 by 80 |
| 4772 | 1.5 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 3,2 | 5.6 | 10.3 | 0.72 | 1.00 | 0.598 | 0.601 | 0.995 | 0.751 | 1002,682 | 60 by 52 |
| 4772 + 1/2 | 1.6 | 0.52 | 0.52 | 1.01 | 1.01 | 1.01 | 0.000 | 1.12 | 1,2 | 5.4 | 10.4 | 0.72 | 1.00 | 0.601 | 0.601 | 1.001 | 0.751 | 1026,674 | 92 by 60 |
| 4773 | 1.5 | 0.53 | 0.52 | 1.01 | 1.01 | 1.01 | 0.000 | 1.18 | 13,7 | 5.4 | 10.4 | 0.72 | 1.00 | 0.603 | 0.599 | 1.007 | 0.751 | 1350,778 | 56 by 80 |
| 4773 + 1/2 | 1.6 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 7,5 | 5.6 | 10.5 | 0.72 | 1.00 | 0.600 | 0.602 | 0.997 | 0.751 | 1378,830 | 88 by 132 |
| 4774 | 1.5 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 3,2 |  |  |  | 1.00 | 0.597 | 0.601 | 0.993 | 0.751 | 966,678 | 108 by 120 |
| 4774 + 1/2 | 1.5 | 0.53 | 0.52 | 1.01 | 1.01 | 1.01 | 0.000 | 1.16 | 10,7 |  |  |  | 1.00 | 0.602 | 0.597 | 1.009 | 0.751 | 1362,774 | 60 by 76 |
| 4775 | 1.5 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 15,7 |  |  |  | 0.99 | 0.597 | 0.599 | 0.996 | 0.751 | 918,642 | 124 by 104 |
| 4775 + 1/2 | 1.6 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 9,2 |  |  |  | 1.00 | 0.597 | 0.599 | 0.998 | 0.750 | 1374,806 | 64 by 68 |
| 4776 | 1.5 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 10,5 |  |  |  | 1.00 | 0.600 | 0.594 | 1.010 | 0.750 | 1370,778 | 60 by 72 |
| 4776 + 1/2 | 1.5 | 0.51 | 0.52 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 0,3 |  |  |  | 0.99 | 0.591 | 0.598 | 0.987 | 0.750 | 966,666 | 116 by 68 |
| 4777 | 1.6 | 0.52 | 0.52 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 12,8 |  |  |  | 1.00 | 0.592 | 0.598 | 0.989 | 0.750 | 1378,814 | 88 by 84 |
| 4777 + 1/2 | 1.6 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 11,7 |  |  |  | 1.00 | 0.599 | 0.595 | 1.007 | 0.750 | 1386,778 | 64 by 64 |
| 4778 | 1.5 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 10,5 |  |  |  | 1.00 | 0.598 | 0.598 | 1.000 | 0.750 | 978,670 | 104 by 68 |
| 4778 + 1/2 | 1.5 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 11,7 |  |  |  | 1.00 | 0.598 | 0.598 | 1.000 | 0.750 | 1054,694 | 76 by 56 |
| 4779 | 1.5 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 13,4 |  |  |  | 1.00 | 0.598 | 0.597 | 1.002 | 0.750 | 1398,782 | 68 by 68 |
| 4779 + 1/2 | 1.5 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 13,4 |  |  |  | 1.00 | 0.597 | 0.598 | 0.997 | 0.749 | 970,682 | 124 by 84 |
| 4780 | 1.5 | 0.52 | 0.52 | 0.99 | 0.99 | 0.99 | 0.000 | 1.16 | 11,8 |  |  |  | 1.00 | 0.596 | 0.598 | 0.997 | 0.749 | 1402,802 | 60 by 60 |
| 4780 + 1/2 | 1.6 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 11,8 |  |  |  | 1.00 | 0.599 | 0.597 | 1.003 | 0.749 | 1418,774 | 76 by 120 |
| 4781 | 1.6 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 11,7 |  |  |  | 1.00 | 0.598 | 0.599 | 0.998 | 0.749 | 1074,702 | 196 by 88 |
| 4781 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

### rise (neptune.rise, frames 4950 to 5024, window 4938 to 5036, 198 draft frames at rate 2)

Largest level step: 0.11 at frame 4968 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.10 from frame 4968 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 5.22 from frame 5003 + 1/2 to the next, block column 15 row 7 from the top left, shown, not judged.
Largest change in place: 45.0 from frame 4964 to 8 film frames later, most at pixel 152, 996 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.39 from frame 4991 to 8 film frames later, most at pixel 928, 436, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 4938 to 4949 + 1/2): change 7.9, pattern 0.17.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 4966 + 1/2 in /home/user/workspace/work/p6/sm60/03/neptune-rise-p1of2-pops.png, frame 4967 + 1/2 in /home/user/workspace/work/p6/sm60/03/neptune-rise-p1of2-pops.png, frame 4968 in /home/user/workspace/work/p6/sm60/03/neptune-rise-p1of2-pops.png, frame 4968 + 1/2 in /home/user/workspace/work/p6/sm60/03/neptune-rise-p1of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 4960 + 1/2 in /home/user/workspace/work/p6/sm60/03/neptune-rise-p1of2-changes.png, frame 4968 + 1/2 in /home/user/workspace/work/p6/sm60/03/neptune-rise-p1of2-changes.png, frame 4983 in no panel (a slice --frames 9966-9966 draws it), frame 4991 in /home/user/workspace/work/p6/sm60/04/neptune-rise-p2of2-changes.png.

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4938 | 67.81 |  | 1.4 | 1.20 | 1.20 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 15,0 | 7.9 | 23.1 | 0.68 | 0.16 | 0.66 | 8.1 |
| 4938 + 1/2 | 67.84 | 0.01 | 1.4 | 1.19 | 1.20 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 13,2 | 7.8 | 22.3 | 0.68 | 0.16 | 0.66 | 8.1 |
| 4939 | 67.87 | 0.01 | 1.4 | 1.19 | 1.20 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 8,6 | 7.7 | 20.7 | 0.68 | 0.16 | 0.67 | 8.1 |
| 4939 + 1/2 | 67.90 | 0.01 | 1.4 | 1.19 | 1.20 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 4,4 | 7.6 | 19.5 | 0.68 | 0.17 | 0.67 | 8.1 |
| 4940 | 67.93 | 0.00 | 1.4 | 1.19 | 1.20 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 5,7 | 7.6 | 17.2 | 0.68 | 0.17 | 0.67 | 8.1 |
| 4940 + 1/2 | 67.96 | 0.00 | 1.4 | 1.20 | 1.20 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 7,0 | 7.5 | 15.9 | 0.68 | 0.16 | 0.67 | 8.1 |
| 4941 | 67.99 | 0.00 | 1.4 | 1.18 | 1.20 | 0.99 | 0.99 | 0.99 | 0.000 | 1.20 | 5,7 | 7.4 | 14.6 | 0.68 | 0.16 | 0.67 | 8.1 |
| 4941 + 1/2 | 68.02 | 0.00 | 1.3 | 1.19 | 1.19 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 10,7 | 7.3 | 14.8 | 0.68 | 0.16 | 0.67 | 8.2 |
| 4942 | 68.06 | 0.00 | 1.4 | 1.19 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 5,7 | 7.1 | 15.2 | 0.68 | 0.16 | 0.67 | 8.2 |
| 4942 + 1/2 | 68.09 | 0.00 | 1.4 | 1.20 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 5,7 | 7.1 | 16.0 | 0.68 | 0.16 | 0.67 | 8.2 |
| 4943 | 68.12 | 0.00 | 1.4 | 1.20 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 12,2 | 7.0 | 16.9 | 0.68 | 0.15 | 0.67 | 8.1 |
| 4943 + 1/2 | 68.15 | 0.01 | 1.4 | 1.19 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 8,8 | 6.8 | 14.4 | 0.68 | 0.15 | 0.67 | 8.1 |
| 4944 | 68.19 | 0.01 | 1.4 | 1.19 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 1,1 | 6.7 | 13.3 | 0.69 | 0.14 | 0.67 | 8.1 |
| 4944 + 1/2 | 68.22 | 0.00 | 1.4 | 1.20 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 6,7 | 6.4 | 12.2 | 0.69 | 0.13 | 0.67 | 8.1 |
| 4945 | 68.25 | 0.00 | 1.4 | 1.20 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 6,7 | 6.2 | 11.8 | 0.69 | 0.13 | 0.67 | 8.0 |
| 4945 + 1/2 | 68.29 | 0.00 | 1.4 | 1.19 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 6,7 | 6.0 | 11.1 | 0.70 | 0.12 | 0.68 | 8.0 |
| 4946 | 68.32 | 0.00 | 1.4 | 1.18 | 1.19 | 0.99 | 0.99 | 0.99 | 0.000 | 1.17 | 12,7 | 5.8 | 11.3 | 0.70 | 0.12 | 0.68 | 8.0 |
| 4946 + 1/2 | 68.35 | 0.00 | 1.4 | 1.20 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 5,5 | 5.7 | 12.2 | 0.70 | 0.12 | 0.68 | 8.0 |
| 4947 | 68.37 | 0.00 | 1.4 | 1.19 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 7,7 | 5.8 | 12.5 | 0.71 | 0.12 | 0.68 | 8.0 |
| 4947 + 1/2 | 68.40 | 0.00 | 1.4 | 1.20 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 6,7 | 6.4 | 13.2 | 0.71 | 0.12 | 0.68 | 8.0 |
| 4948 | 68.42 | 0.00 | 1.4 | 1.20 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 7,7 | 7.2 | 13.7 | 0.71 | 0.12 | 0.68 | 8.0 |
| 4948 + 1/2 | 68.46 | 0.00 | 1.4 | 1.19 | 1.20 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 8,7 | 7.9 | 13.3 | 0.71 | 0.12 | 0.69 | 8.0 |
| 4949 | 68.48 | 0.00 | 1.4 | 1.19 | 1.20 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 5,5 | 8.9 | 14.2 | 0.71 | 0.13 | 0.69 | 8.0 |
| 4949 + 1/2 | 68.51 | 0.00 | 1.4 | 1.19 | 1.20 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 14,4 | 10.1 | 13.8 | 0.71 | 0.15 | 0.69 | 8.0 |
| 4950 first | 68.53 | 0.00 | 1.4 | 1.18 | 1.20 | 0.98 | 0.98 | 0.98 | 0.000 | 1.11 | 14,8 | 11.5 | 15.2 | 0.71 | 0.17 | 0.69 | 8.0 |
| 4950 + 1/2 | 68.55 | 0.00 | 1.5 | 1.15 | 1.20 | 0.96 | 0.96 | 0.96 | 0.000 | 1.26 | 12,8 | 12.8 | 16.6 | 0.71 | 0.18 | 0.69 | 8.0 |
| 4951 | 68.57 | 0.01 | 1.7 | 1.13 | 1.20 | 0.94 | 0.94 | 0.94 | 0.000 | 1.30 | 12,1 | 14.3 | 17.9 | 0.71 | 0.16 | 0.69 | 8.0 |
| 4951 + 1/2 | 68.61 | 0.00 | 2.0 | 1.10 | 1.20 | 0.92 | 0.92 | 0.92 | 0.000 | 1.42 | 9,1 | 15.6 | 18.7 | 0.71 | 0.15 | 0.69 | 8.0 |
| 4952 | 68.64 | 0.01 | 2.5 | 1.15 | 1.20 | 0.96 | 0.96 | 0.96 | 0.000 | 1.53 | 9,1 | 17.0 | 20.3 | 0.71 | 0.11 | 0.69 | 8.0 |
| 4952 + 1/2 | 68.70 | 0.01 | 3.0 | 1.20 | 1.22 | 0.99 | 0.99 | 0.99 | 0.000 | 1.48 | 9,1 | 18.4 | 22.0 | 0.71 | 0.12 | 0.69 | 8.0 |
| 4953 | 68.77 | 0.01 | 3.6 | 1.24 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.31 | 8,1 | 19.9 | 23.7 | 0.71 | 0.14 | 0.69 | 8.0 |
| 4953 + 1/2 | 68.85 | 0.01 | 4.2 | 1.26 | 1.30 | 0.97 | 0.97 | 0.97 | 0.000 | 1.27 | 9,1 | 21.4 | 25.1 | 0.70 | 0.16 | 0.69 | 8.0 |
| 4954 | 68.96 | 0.01 | 4.9 | 1.36 | 1.35 | 1.01 | 1.01 | 1.01 | 0.000 | 1.59 | 12,1 | 22.9 | 26.5 | 0.70 | 0.17 | 0.69 | 8.0 |
| 4954 + 1/2 | 69.10 | 0.01 | 5.5 | 1.45 | 1.41 | 1.03 | 1.03 | 1.03 | 0.002 | 1.84 | 8,1 | 24.4 | 28.1 | 0.70 | 0.19 | 0.69 | 8.0 |
| 4955 | 69.25 | 0.00 | 6.2 | 1.46 | 1.45 | 1.01 | 1.01 | 1.01 | 0.003 | 1.88 | 12,1 | 25.9 | 29.7 | 0.70 | 0.19 | 0.69 | 8.0 |
| 4955 + 1/2 | 69.42 | 0.00 | 6.8 | 1.45 | 1.45 | 1.00 | 1.00 | 1.00 | 0.005 | 1.66 | 8,1 | 27.6 | 31.3 | 0.70 | 0.21 | 0.69 | 8.0 |
| 4956 | 69.59 | 0.01 | 7.5 | 1.45 | 1.47 | 0.98 | 0.97 | 0.97 | 0.008 | 1.36 | 14,2 | 29.1 | 32.7 | 0.70 | 0.23 | 0.69 | 8.0 |
| 4956 + 1/2 | 69.78 | 0.02 | 8.1 | 1.49 | 1.51 | 0.99 | 0.99 | 0.99 | 0.003 | 1.56 | 14,0 | 30.6 | 33.8 | 0.70 | 0.25 | 0.69 | 8.0 |
| 4957 | 70.00 | 0.00 | 8.7 | 1.57 | 1.56 | 1.00 | 1.01 | 1.00 | 0.007 | 1.53 | 14,0 | 31.9 | 35.0 | 0.69 | 0.27 | 0.69 | 8.0 |
| 4957 + 1/2 | 70.24 | 0.01 | 9.4 | 1.63 | 1.60 | 1.02 | 1.02 | 1.02 | 0.011 | 1.39 | 8,1 | 33.2 | 36.4 | 0.69 | 0.27 | 0.69 | 8.0 |
| 4958 | 70.48 | 0.00 | 10.0 | 1.63 | 1.65 | 0.99 | 0.99 | 0.99 | 0.011 | 1.41 | 1,0 | 34.5 | 37.7 | 0.69 | 0.26 | 0.69 | 8.0 |
| 4958 + 1/2 | 70.74 | 0.03 | 10.6 | 1.67 | 1.66 | 1.01 | 1.01 | 1.01 | 0.013 | 1.47 | 15,5 | 35.9 | 39.5 | 0.69 | 0.27 | 0.68 | 8.0 |
| 4959 | 71.06 | 0.07 | 11.2 | 1.68 | 1.71 | 0.98 | 0.97 | 0.97 | 0.023 | 1.83 | 15,8 | 37.0 | 39.8 | 0.69 | 0.29 | 0.68 | 8.0 |
| 4959 + 1/2 | 71.51 | 0.03 | 11.8 | 1.75 | 1.76 | 1.00 | 1.01 | 1.00 | 0.012 | 1.71 | 15,5 | 38.2 | 40.5 | 0.69 | 0.25 | 0.68 | 8.0 |
| 4960 | 72.01 | 0.01 | 12.4 | 1.84 | 1.81 | 1.01 | 1.02 | 1.01 | 0.020 | 1.68 | 15,5 | 39.3 | 41.0 | 0.69 | 0.23 | 0.68 | 8.0 |
| 4960 + 1/2 | 72.53 | 0.01 | 13.0 | 1.87 | 1.87 | 1.00 | 1.02 | 1.00 | 0.021 | 1.88 | 15,5 | 40.3 | 41.6 | 0.69 | 0.23 | 0.68 | 8.0 |
| 4961 | 73.03 | 0.02 | 13.6 | 1.92 | 1.89 | 1.02 | 1.01 | 1.01 | 0.041 | 1.77 | 15,5 | 41.1 | 42.4 | 0.69 | 0.23 | 0.68 | 8.0 |
| 4961 + 1/2 | 73.56 | 0.01 | 14.1 | 1.91 | 1.94 | 0.98 | 0.99 | 0.98 | 0.058 | 1.71 | 15,5 | 41.9 | 42.7 | 0.69 | 0.21 | 0.68 | 8.0 |
| 4962 | 74.11 | 0.04 | 14.7 | 1.95 | 1.94 | 1.00 | 1.05 | 1.00 | 0.021 | 1.67 | 15,5 | 42.7 | 45.7 | 0.69 | 0.22 | 0.69 | 8.0 |
| 4962 + 1/2 | 74.73 | 0.02 | 15.3 | 1.97 | 2.00 | 0.98 | 0.95 | 0.95 | 0.085 | 1.42 | 13,0 | 43.7 | 49.0 | 0.69 | 0.23 | 0.69 | 8.0 |
| 4963 | 75.41 | 0.01 | 15.9 | 2.05 | 2.02 | 1.01 | 1.03 | 1.01 | 0.062 | 1.57 | 12,4 | 44.8 | 48.3 | 0.69 | 0.25 | 0.69 | 8.0 |
| 4963 + 1/2 | 76.09 | 0.03 | 16.4 | 2.08 | 2.04 | 1.02 | 1.05 | 1.02 | 0.066 | 1.59 | 12,0 | 45.0 | 48.4 | 0.69 | 0.23 | 0.69 | 8.0 |
| 4964 | 76.73 | 0.01 | 17.1 | 2.14 | 2.04 | 1.05 | 1.07 | 1.05 | 0.081 | 1.64 | 12,4 | 45.0 | 48.0 | 0.69 | 0.22 | 0.69 | 8.0 |
| 4964 + 1/2 | 77.38 | 0.02 | 17.7 | 2.15 | 2.04 | 1.05 | 1.09 | 1.05 | 0.070 | 1.70 | 12,2 | 44.8 | 47.4 | 0.69 | 0.23 | 0.69 | 8.0 |
| 4965 | 78.00 | 0.00 | 18.0 | 2.16 | 2.04 | 1.06 | 1.09 | 1.06 | 0.074 | 1.54 | 12,4 | 44.2 | 46.7 | 0.69 | 0.26 | 0.69 | 8.0 |
| 4965 + 1/2 | 78.62 | 0.03 | 18.5 | 2.19 | 2.04 | 1.07 | 1.09 | 1.07 | 0.087 | 1.89 | 14,8 | 43.2 | 44.9 | 0.69 | 0.26 | 0.69 | 8.0 |
| 4966 | 79.30 | 0.04 | 19.5 | 2.18 | 2.04 | 1.07 | 1.08 | 1.07 | 0.104 | 1.42 | 3,3 | 42.0 | 45.2 | 0.69 | 0.26 | 0.69 | 8.0 |
| 4966 + 1/2 | 80.05 | 0.02 | 19.7 | 2.22 | 2.04 | 1.09 | 1.10 | 1.09 | 0.087 | 1.60 | 14,7 | 40.4 | 43.6 | 0.69 | 0.27 | 0.69 | 8.0 |
| 4967 | 80.78 | 0.01 | 20.6 | 2.23 | 2.04 | 1.09 | 1.09 | 1.09 | 0.108 | 1.53 | 3,0 | 39.4 | 42.3 | 0.69 | 0.32 | 0.69 | 8.0 |
| 4967 + 1/2 | 81.48 | 0.03 | 21.3 | 2.24 | 2.04 | 1.10 | 1.16 | 1.10 | 0.037 | 1.76 | 11,0 | 38.3 | 40.2 | 0.70 | 0.34 | 0.70 | 8.0 |
| 4968 | 82.23 | 0.04 | 21.9 | 2.25 | 2.04 | 1.10 | 1.14 | 1.10 | 0.070 | 1.85 | 13,7 | 38.0 | 41.5 | 0.70 | 0.31 | 0.70 | 8.0 |
| 4968 + 1/2 | 82.90 | 0.11 | 22.4 | 2.24 | 2.04 | 1.10 | 1.09 | 1.09 | 0.106 | 1.65 | 13,7 | 37.7 | 41.4 | 0.70 | 0.37 | 0.70 | 8.0 |
| 4969 | 83.35 | 0.10 | 23.1 | 2.21 | 2.04 | 1.08 | 1.06 | 1.06 | 0.122 | 1.62 | 13,7 | 36.2 | 41.4 | 0.70 | 0.25 | 0.70 | 8.0 |
| 4969 + 1/2 | 83.61 | 0.02 | 23.5 | 2.18 | 2.04 | 1.07 | 1.04 | 1.04 | 0.116 | 1.77 | 13,7 | 34.5 | 45.0 | 0.70 | 0.26 | 0.70 | 8.0 |
| 4970 | 83.83 | 0.06 | 24.1 | 2.13 | 2.04 | 1.04 | 1.03 | 1.03 | 0.115 | 1.75 | 2,0 | 33.1 | 49.8 | 0.70 | 0.27 | 0.70 | 8.0 |
| 4970 + 1/2 | 84.16 | 0.05 | 24.7 | 2.12 | 2.04 | 1.04 | 1.03 | 1.03 | 0.107 | 1.99 | 3,0 | 32.5 | 60.1 | 0.70 | 0.28 | 0.70 | 8.0 |
| 4971 | 84.40 | 0.01 | 25.6 | 2.09 | 2.04 | 1.02 | 1.00 | 1.00 | 0.119 | 2.06 | 3,0 | 31.6 | 57.5 | 0.70 | 0.30 | 0.70 | 8.0 |
| 4971 + 1/2 | 84.66 | 0.02 | 26.2 | 2.04 | 2.04 | 1.00 | 1.01 | 1.00 | 0.109 | 1.70 | 12,6 | 28.9 | 56.8 | 0.70 | 0.29 | 0.70 | 8.0 |
| 4972 | 84.89 | 0.05 | 26.2 | 2.00 | 1.98 | 1.01 | 0.99 | 0.99 | 0.132 | 2.01 | 12,6 | 27.9 | 53.8 | 0.70 | 0.33 | 0.70 | 8.0 |
| 4972 + 1/2 | 85.21 | 0.03 | 26.2 | 1.92 | 1.92 | 1.00 | 1.01 | 1.00 | 0.140 | 2.02 | 12,6 | 28.1 | 50.6 | 0.70 | 0.32 | 0.70 | 8.0 |
| 4973 | 85.58 | 0.06 | 26.5 | 1.84 | 1.84 | 1.00 | 1.00 | 1.00 | 0.136 | 1.55 | 12,6 | 26.7 | 48.0 | 0.70 | 0.29 | 0.70 | 8.0 |
| 4973 + 1/2 | 85.82 | 0.07 | 26.1 | 1.77 | 1.76 | 1.00 | 0.98 | 0.98 | 0.153 | 1.46 | 12,6 | 25.1 | 45.0 | 0.70 | 0.26 | 0.70 | 8.0 |
| 4974 | 85.93 | 0.06 | 27.1 | 1.68 | 1.69 | 1.00 | 0.97 | 0.97 | 0.156 | 1.65 | 12,6 | 23.4 | 42.3 | 0.70 | 0.21 | 0.70 | 8.0 |
| 4974 + 1/2 | 85.93 | 0.05 | 27.0 | 1.61 | 1.62 | 0.99 | 1.06 | 0.99 | 0.114 | 1.71 | 12,6 | 23.2 | 41.3 | 0.70 | 0.19 | 0.70 | 8.0 |
| 4975 | 85.82 | 0.01 | 24.7 | 1.55 | 1.54 | 1.01 | 0.97 | 0.97 | 0.228 | 1.64 | 12,6 | 22.9 | 40.3 | 0.70 | 0.18 | 0.70 | 8.0 |
| 4975 + 1/2 | 85.68 | 0.00 | 27.2 | 1.47 | 1.50 | 0.98 | 1.01 | 0.98 | 0.136 | 1.50 | 12,6 | 22.6 | 38.1 | 0.70 | 0.19 | 0.69 | 8.0 |
| 4976 | 85.55 | 0.06 | 27.7 | 1.42 | 1.46 | 0.98 | 1.02 | 0.98 | 0.138 | 1.49 | 12,6 | 22.4 | 37.1 | 0.70 | 0.21 | 0.69 | 8.0 |
| 4976 + 1/2 | 85.29 | 0.05 | 24.9 | 1.44 | 1.42 | 1.02 | 0.96 | 0.96 | 0.229 | 1.54 | 14,0 | 21.6 | 35.5 | 0.69 | 0.25 | 0.69 | 8.0 |
| 4977 | 84.95 | 0.07 | 24.8 | 1.41 | 1.41 | 1.00 | 0.95 | 0.95 | 0.254 | 1.37 | 15,5 | 21.9 | 34.0 | 0.69 | 0.19 | 0.69 | 8.0 |
| 4977 + 1/2 | 84.47 | 0.04 | 25.2 | 1.39 | 1.37 | 1.02 | 1.01 | 1.01 | 0.198 | 1.49 | 15,1 | 21.9 | 36.1 | 0.69 | 0.19 | 0.69 | 8.0 |
| 4978 | 83.91 | 0.08 | 28.0 | 1.33 | 1.35 | 0.98 | 1.07 | 0.98 | 0.123 | 1.50 | 10,5 | 22.2 | 36.4 | 0.70 | 0.19 | 0.69 | 8.0 |
| 4978 + 1/2 | 83.19 | 0.06 | 27.2 | 1.31 | 1.32 | 1.00 | 1.00 | 1.00 | 0.187 | 1.49 | 15,5 | 22.2 | 36.5 | 0.69 | 0.20 | 0.69 | 8.0 |
| 4979 | 82.35 | 0.06 | 28.9 | 1.25 | 1.31 | 0.96 | 0.96 | 0.96 | 0.166 | 1.23 | 8,4 | 22.1 | 36.4 | 0.69 | 0.18 | 0.69 | 8.0 |
| 4979 + 1/2 | 81.38 | 0.01 | 28.1 | 1.25 | 1.30 | 0.96 | 0.98 | 0.96 | 0.159 | 1.35 | 0,2 | 22.1 | 35.3 | 0.70 | 0.19 | 0.69 | 8.0 |
| 4980 | 80.40 | 0.02 | 28.2 | 1.23 | 1.29 | 0.95 | 1.02 | 0.95 | 0.133 | 1.35 | 0,2 | 22.1 | 33.5 | 0.70 | 0.19 | 0.69 | 8.0 |
| 4980 + 1/2 | 79.38 | 0.02 | 28.4 | 1.23 | 1.29 | 0.95 | 1.03 | 0.95 | 0.130 | 1.39 | 0,2 | 22.3 | 32.8 | 0.70 | 0.19 | 0.69 | 8.0 |
| 4981 | 78.33 | 0.02 | 24.5 | 1.27 | 1.27 | 1.00 | 0.96 | 0.96 | 0.223 | 1.41 | 0,2 | 22.4 | 31.8 | 0.70 | 0.20 | 0.69 | 8.0 |
| 4981 + 1/2 | 77.31 | 0.02 | 28.6 | 1.22 | 1.26 | 0.97 | 1.03 | 0.97 | 0.147 | 1.39 | 0,2 | 22.4 | 30.1 | 0.70 | 0.20 | 0.69 | 8.0 |
| 4982 | 76.34 | 0.06 | 27.8 | 1.24 | 1.26 | 0.99 | 0.99 | 0.99 | 0.173 | 1.48 | 1,2 | 22.5 | 30.0 | 0.70 | 0.20 | 0.69 | 8.0 |
| 4982 + 1/2 | 75.49 | 0.01 | 28.4 | 1.23 | 1.25 | 0.98 | 1.00 | 0.98 | 0.159 | 1.66 | 11,3 | 24.2 | 33.3 | 0.70 | 0.25 | 0.69 | 8.0 |
| 4983 | 74.63 | 0.03 | 29.0 | 1.23 | 1.25 | 0.99 | 0.99 | 0.99 | 0.168 | 1.73 | 11,3 | 24.8 | 32.1 | 0.70 | 0.23 | 0.69 | 8.0 |
| 4983 + 1/2 | 73.70 | 0.01 | 26.0 | 1.28 | 1.24 | 1.04 | 0.95 | 0.95 | 0.236 | 1.67 | 11,3 | 26.4 | 44.1 | 0.70 | 0.25 | 0.68 | 8.0 |
| 4984 | 72.79 | 0.00 | 26.0 | 1.29 | 1.23 | 1.05 | 0.93 | 0.93 | 0.242 | 1.75 | 3,8 | 27.2 | 44.5 | 0.70 | 0.24 | 0.68 | 8.0 |
| 4984 + 1/2 | 71.87 | 0.04 | 26.3 | 1.30 | 1.23 | 1.06 | 0.89 | 0.89 | 0.249 | 2.38 | 3,8 | 28.1 | 45.3 | 0.69 | 0.23 | 0.66 | 8.0 |
| 4985 | 70.87 | 0.01 | 26.5 | 1.29 | 1.23 | 1.05 | 0.96 | 0.96 | 0.208 | 1.84 | 3,8 | 28.9 | 45.6 | 0.69 | 0.23 | 0.66 | 8.0 |
| 4985 + 1/2 | 69.86 | 0.04 | 28.7 | 1.25 | 1.23 | 1.02 | 0.95 | 0.95 | 0.216 | 2.27 | 4,8 | 35.1 | 47.2 | 0.69 | 0.24 | 0.66 | 8.0 |
| 4986 | 68.77 | 0.04 | 25.1 | 1.26 | 1.23 | 1.03 | 0.97 | 0.97 | 0.207 | 1.92 | 14,1 | 37.8 | 46.0 | 0.69 | 0.25 | 0.65 | 8.0 |
| 4986 + 1/2 | 67.62 | 0.02 | 29.4 | 1.20 | 1.23 | 0.98 | 0.99 | 0.98 | 0.149 | 1.89 | 7,0 | 37.8 | 44.8 | 0.69 | 0.26 | 0.64 | 8.0 |
| 4987 | 66.41 | 0.02 | 28.3 | 1.20 | 1.21 | 0.99 | 0.93 | 0.93 | 0.194 | 2.13 | 5,7 | 37.9 | 43.5 | 0.68 | 0.29 | 0.62 | 8.0 |
| 4987 + 1/2 | 65.16 | 0.03 | 29.8 | 1.17 | 1.20 | 0.97 | 0.98 | 0.97 | 0.136 | 2.40 | 5,7 | 37.2 | 42.4 | 0.68 | 0.31 | 0.61 | 8.0 |
| 4988 | 63.86 | 0.02 | 25.4 | 1.19 | 1.20 | 0.99 | 0.85 | 0.85 | 0.243 | 2.43 | 5,7 | 36.0 | 40.5 | 0.68 | 0.33 | 0.60 | 8.0 |
| 4988 + 1/2 | 62.52 | 0.00 | 29.5 | 1.13 | 1.20 | 0.94 | 0.98 | 0.94 | 0.125 | 1.65 | 6,7 | 34.6 | 39.7 | 0.68 | 0.33 | 0.59 | 8.0 |
| 4989 | 61.18 | 0.00 | 29.7 | 1.13 | 1.20 | 0.95 | 0.98 | 0.95 | 0.133 | 2.00 | 6,7 | 33.2 | 38.8 | 0.67 | 0.34 | 0.58 | 8.0 |
| 4989 + 1/2 | 59.83 | 0.01 | 29.6 | 1.13 | 1.20 | 0.94 | 1.02 | 0.94 | 0.110 | 2.22 | 6,7 | 31.7 | 37.7 | 0.67 | 0.35 | 0.57 | 8.0 |
| 4990 | 58.47 | 0.01 | 29.6 | 1.12 | 1.20 | 0.94 | 1.07 | 0.94 | 0.079 | 1.90 | 6,7 | 30.2 | 36.5 | 0.66 | 0.34 | 0.57 | 8.0 |
| 4990 + 1/2 | 57.11 | 0.01 | 29.2 | 1.12 | 1.20 | 0.93 | 1.04 | 0.93 | 0.097 | 1.88 | 0,8 | 28.7 | 36.2 | 0.66 | 0.37 | 0.55 | 8.0 |
| 4991 | 55.77 | 0.01 | 29.1 | 1.13 | 1.20 | 0.94 | 0.99 | 0.94 | 0.128 | 1.75 | 6,6 | 27.1 | 35.5 | 0.65 | 0.39 | 0.53 | 8.0 |
| 4991 + 1/2 | 54.46 | 0.01 | 29.0 | 1.14 | 1.20 | 0.95 | 1.00 | 0.95 | 0.132 | 1.83 | 5,1 | 25.4 | 34.8 | 0.64 | 0.39 | 0.52 | 8.0 |
| 4992 | 53.16 | 0.01 | 29.1 | 1.17 | 1.20 | 0.98 | 1.01 | 0.98 | 0.142 | 2.13 | 1,7 | 23.8 | 33.8 | 0.63 | 0.38 | 0.51 | 8.0 |
| 4992 + 1/2 | 51.90 | 0.03 | 28.8 | 1.19 | 1.20 | 0.99 | 1.01 | 0.99 | 0.131 | 2.03 | 1,7 | 22.2 | 32.7 | 0.62 | 0.37 | 0.49 | 8.0 |
| 4993 | 50.68 | 0.04 | 28.1 | 1.18 | 1.20 | 0.99 | 0.99 | 0.99 | 0.148 | 1.94 | 0,1 | 20.6 | 31.5 | 0.60 | 0.36 | 0.47 | 8.0 |
| 4993 + 1/2 | 49.55 | 0.01 | 28.8 | 1.23 | 1.19 | 1.03 | 0.96 | 0.96 | 0.183 | 2.27 | 0,1 | 19.1 | 30.1 | 0.58 | 0.33 | 0.46 | 8.0 |
| 4994 | 48.42 | 0.00 | 26.2 | 1.20 | 1.19 | 1.00 | 1.09 | 1.00 | 0.130 | 2.91 | 0,1 | 17.8 | 28.6 | 0.55 | 0.32 | 0.44 | 8.0 |
| 4994 + 1/2 | 47.30 | 0.02 | 26.5 | 1.19 | 1.20 | 0.99 | 1.07 | 0.99 | 0.110 | 2.78 | 0,1 | 16.5 | 27.5 | 0.54 | 0.27 | 0.43 | 8.0 |
| 4995 | 46.22 | 0.02 | 25.2 | 1.18 | 1.20 | 0.99 | 1.07 | 0.99 | 0.103 | 2.58 | 1,1 | 15.2 | 26.0 | 0.51 | 0.28 | 0.41 | 8.0 |
| 4995 + 1/2 | 45.18 | 0.03 | 25.1 | 1.17 | 1.20 | 0.98 | 1.07 | 0.98 | 0.117 | 2.09 | 1,1 | 14.0 | 24.5 | 0.49 | 0.25 | 0.40 | 8.0 |
| 4996 | 44.21 | 0.03 | 25.3 | 1.17 | 1.21 | 0.97 | 1.07 | 0.97 | 0.109 | 1.96 | 15,8 | 13.1 | 22.9 | 0.48 | 0.22 | 0.39 | 8.0 |
| 4996 + 1/2 | 43.29 | 0.03 | 24.0 | 1.20 | 1.22 | 0.98 | 1.08 | 0.98 | 0.124 | 2.83 | 15,8 | 12.4 | 21.5 | 0.47 | 0.21 | 0.38 | 8.0 |
| 4997 | 42.44 | 0.03 | 26.0 | 1.22 | 1.23 | 0.99 | 1.04 | 0.99 | 0.187 | 2.09 | 1,2 | 11.6 | 19.9 | 0.46 | 0.28 | 0.37 | 8.0 |
| 4997 + 1/2 | 41.66 | 0.01 | 24.9 | 1.24 | 1.25 | 0.99 | 0.96 | 0.96 | 0.226 | 2.41 | 1,2 | 10.9 | 18.7 | 0.44 | 0.17 | 0.37 | 8.0 |
| 4998 | 40.90 | 0.02 | 25.3 | 1.27 | 1.26 | 1.01 | 0.96 | 0.96 | 0.219 | 2.75 | 2,2 | 10.2 | 17.2 | 0.43 | 0.17 | 0.36 | 8.0 |
| 4998 + 1/2 | 40.19 | 0.03 | 24.7 | 1.28 | 1.28 | 1.00 | 1.00 | 1.00 | 0.225 | 2.49 | 2,2 | 9.5 | 15.8 | 0.41 | 0.19 | 0.35 | 8.0 |
| 4999 | 39.53 | 0.04 | 25.1 | 1.30 | 1.29 | 1.00 | 0.92 | 0.92 | 0.270 | 2.27 | 5,5 | 9.0 | 14.6 | 0.40 | 0.20 | 0.34 | 8.0 |
| 4999 + 1/2 | 38.94 | 0.04 | 25.5 | 1.32 | 1.30 | 1.01 | 0.78 | 0.78 | 0.301 | 2.27 | 5,5 | 8.5 | 13.5 | 0.39 | 0.18 | 0.34 | 8.0 |
| 5000 | 38.44 | 0.05 | 25.3 | 1.31 | 1.31 | 1.00 | 0.89 | 0.89 | 0.295 | 2.23 | 5,5 | 8.3 | 12.9 | 0.37 | 0.21 | 0.33 | 8.0 |
| 5000 + 1/2 | 38.04 | 0.02 | 24.9 | 1.32 | 1.31 | 1.01 | 0.94 | 0.94 | 0.256 | 2.50 | 0,5 | 7.9 | 12.3 | 0.38 | 0.17 | 0.34 | 8.0 |
| 5001 | 37.60 | 0.02 | 27.1 | 1.32 | 1.31 | 1.01 | 0.91 | 0.91 | 0.241 | 2.47 | 0,6 | 7.9 | 11.5 | 0.37 | 0.17 | 0.34 | 8.0 |
| 5001 + 1/2 | 37.21 | 0.02 | 26.2 | 1.31 | 1.31 | 1.00 | 0.94 | 0.94 | 0.266 | 2.47 | 1,5 | 7.7 | 10.8 | 0.37 | 0.16 | 0.34 | 8.0 |
| 5002 | 36.86 | 0.04 | 27.1 | 1.31 | 1.31 | 1.00 | 0.97 | 0.97 | 0.224 | 2.92 | 1,5 | 7.6 | 9.9 | 0.36 | 0.15 | 0.33 | 8.0 |
| 5002 + 1/2 | 36.58 | 0.01 | 26.6 | 1.34 | 1.31 | 1.03 | 1.05 | 1.03 | 0.184 | 2.52 | 1,5 | 7.4 | 9.2 | 0.35 | 0.12 | 0.33 | 8.0 |
| 5003 | 36.28 | 0.05 | 25.8 | 1.37 | 1.31 | 1.05 | 1.05 | 1.05 | 0.219 | 2.71 | 13,0 | 7.6 | 8.5 | 0.34 | 0.11 | 0.32 | 8.0 |
| 5003 + 1/2 | 36.06 | 0.02 | 25.1 | 1.37 | 1.31 | 1.05 | 1.01 | 1.01 | 0.174 | 5.22 | 15,7 | 7.5 | 8.4 | 0.33 | 0.08 | 0.31 | 8.0 |
| 5004 | 35.89 | 0.00 | 24.4 | 1.33 | 1.31 | 1.02 | 0.97 | 0.97 | 0.200 | 2.62 | 15,6 | 7.5 | 8.8 | 0.33 | 0.10 | 0.31 | 8.0 |
| 5004 + 1/2 | 35.72 | 0.01 | 24.0 | 1.34 | 1.31 | 1.02 | 0.88 | 0.88 | 0.293 | 2.30 | 2,5 | 7.6 | 8.4 | 0.32 | 0.09 | 0.30 | 8.0 |
| 5005 | 35.54 | 0.00 | 22.5 | 1.35 | 1.31 | 1.04 | 1.00 | 1.00 | 0.232 | 2.11 | 11,0 | 7.8 | 8.6 | 0.32 | 0.06 | 0.30 | 8.0 |
| 5005 + 1/2 | 35.35 | 0.00 | 21.2 | 1.40 | 1.31 | 1.07 | 0.96 | 0.96 | 0.271 | 2.19 | 15,7 | 7.7 | 9.4 | 0.31 | 0.06 | 0.29 | 8.0 |
| 5006 | 35.16 | 0.02 | 20.1 | 1.37 | 1.31 | 1.04 | 0.95 | 0.95 | 0.211 | 2.03 | 11,0 | 7.8 | 9.6 | 0.30 | 0.04 | 0.29 | 8.0 |
| 5006 + 1/2 | 34.94 | 0.01 | 18.4 | 1.34 | 1.31 | 1.02 | 1.03 | 1.02 | 0.174 | 2.18 | 15,5 | 8.3 | 10.2 | 0.29 | 0.03 | 0.28 | 8.0 |
| 5007 | 34.73 | 0.00 | 17.6 | 1.35 | 1.31 | 1.03 | 0.98 | 0.98 | 0.188 | 1.98 | 11,0 | 8.6 | 10.1 | 0.29 | 0.03 | 0.27 | 8.0 |
| 5007 + 1/2 | 34.51 | 0.00 | 16.6 | 1.32 | 1.31 | 1.00 | 1.03 | 1.00 | 0.174 | 1.87 | 11,0 | 8.7 | 9.5 | 0.29 | 0.03 | 0.27 | 8.0 |
| 5008 | 34.29 | 0.00 | 16.4 | 1.31 | 1.31 | 1.00 | 0.99 | 0.99 | 0.161 | 2.23 | 14,5 | 8.2 | 9.3 | 0.29 | 0.02 | 0.27 | 8.0 |
| 5008 + 1/2 | 34.05 | 0.02 | 15.7 | 1.30 | 1.31 | 0.98 | 1.01 | 0.98 | 0.147 | 1.70 | 10,0 | 7.8 | 8.8 | 0.30 | 0.02 | 0.26 | 8.0 |
| 5009 | 33.78 | 0.02 | 14.5 | 1.27 | 1.31 | 0.97 | 0.96 | 0.96 | 0.135 | 1.73 | 9,8 | 7.7 | 8.6 | 0.31 | 0.02 | 0.26 | 8.0 |
| 5009 + 1/2 | 33.47 | 0.02 | 14.6 | 1.28 | 1.31 | 0.98 | 0.99 | 0.98 | 0.141 | 1.89 | 14,4 | 7.5 | 9.3 | 0.29 | 0.02 | 0.25 | 8.0 |
| 5010 | 33.12 | 0.00 | 13.8 | 1.26 | 1.31 | 0.96 | 1.00 | 0.96 | 0.119 | 2.11 | 14,4 | 7.1 | 9.7 | 0.30 | 0.01 | 0.26 | 8.0 |
| 5010 + 1/2 | 32.76 | 0.03 | 13.2 | 1.29 | 1.31 | 0.99 | 1.02 | 0.99 | 0.124 | 2.60 | 14,4 | 6.7 | 10.1 | 0.29 | 0.03 | 0.25 | 8.0 |
| 5011 | 32.35 | 0.02 | 12.8 | 1.29 | 1.30 | 0.99 | 0.99 | 0.99 | 0.148 | 2.30 | 14,4 | 6.5 | 10.8 | 0.29 | 0.04 | 0.25 | 8.0 |
| 5011 + 1/2 | 31.89 | 0.01 | 12.0 | 1.28 | 1.30 | 0.99 | 0.98 | 0.98 | 0.126 | 1.84 | 14,4 | 6.3 | 9.9 | 0.28 | 0.03 | 0.24 | 8.0 |
| 5012 | 31.40 | 0.00 | 11.1 | 1.30 | 1.30 | 1.00 | 1.00 | 1.00 | 0.111 | 2.11 | 0,4 | 6.2 | 10.1 | 0.27 | 0.03 | 0.23 | 8.0 |
| 5012 + 1/2 | 30.91 | 0.00 | 10.9 | 1.30 | 1.29 | 1.01 | 1.01 | 1.01 | 0.076 | 1.68 | 14,3 | 6.0 | 9.6 | 0.26 | 0.03 | 0.22 | 8.0 |
| 5013 | 30.44 | 0.00 | 10.2 | 1.30 | 1.29 | 1.01 | 1.03 | 1.01 | 0.078 | 1.67 | 14,3 | 5.8 | 9.2 | 0.25 | 0.03 | 0.21 | 8.0 |
| 5013 + 1/2 | 29.97 | 0.01 | 9.2 | 1.31 | 1.29 | 1.02 | 1.10 | 1.02 | 0.035 | 1.81 | 14,3 | 5.7 | 9.1 | 0.24 | 0.03 | 0.20 | 8.0 |
| 5014 | 29.53 | 0.02 | 9.0 | 1.33 | 1.28 | 1.04 | 1.09 | 1.04 | 0.051 | 1.79 | 14,3 | 5.1 | 8.4 | 0.23 | 0.06 | 0.20 | 8.0 |
| 5014 + 1/2 | 29.11 | 0.01 | 8.2 | 1.32 | 1.28 | 1.03 | 1.02 | 1.02 | 0.095 | 1.80 | 0,4 | 4.9 | 7.7 | 0.23 | 0.07 | 0.19 | 8.0 |
| 5015 | 28.72 | 0.01 | 7.6 | 1.33 | 1.28 | 1.04 | 1.06 | 1.04 | 0.082 | 1.79 | 1,4 | 4.7 | 7.4 | 0.22 | 0.09 | 0.18 | 8.0 |
| 5015 + 1/2 | 28.34 | 0.02 | 7.0 | 1.30 | 1.27 | 1.02 | 1.09 | 1.02 | 0.035 | 2.22 | 1,4 | 4.3 | 6.4 | 0.21 | 0.10 | 0.18 | 8.0 |
| 5016 | 28.00 | 0.01 | 6.5 | 1.28 | 1.26 | 1.01 | 1.03 | 1.01 | 0.065 | 1.61 | 1,4 | 3.9 | 5.8 | 0.21 | 0.10 | 0.18 | 8.0 |
| 5016 + 1/2 | 27.67 | 0.01 | 6.0 | 1.28 | 1.26 | 1.02 | 1.04 | 1.02 | 0.059 | 1.84 | 1,5 | 3.6 | 5.3 | 0.21 | 0.09 | 0.18 | 8.0 |
| 5017 | 27.36 | 0.02 | 5.0 | 1.26 | 1.25 | 1.01 | 1.06 | 1.01 | 0.029 | 1.86 | 1,5 | 3.3 | 4.9 | 0.21 | 0.08 | 0.18 | 8.0 |
| 5017 + 1/2 | 27.08 | 0.01 | 4.6 | 1.24 | 1.25 | 0.99 | 1.07 | 0.99 | 0.010 | 2.41 | 2,6 | 2.9 | 4.3 | 0.20 | 0.07 | 0.17 | 8.0 |
| 5018 | 26.82 | 0.01 | 4.1 | 1.24 | 1.23 | 1.00 | 1.07 | 1.00 | 0.014 | 2.49 | 2,6 | 2.6 | 3.8 | 0.20 | 0.06 | 0.17 | 8.0 |
| 5018 + 1/2 | 26.58 | 0.00 | 3.6 | 1.23 | 1.23 | 1.00 | 1.06 | 1.00 | 0.005 | 2.11 | 2,6 | 2.4 | 3.4 | 0.19 | 0.05 | 0.16 | 8.0 |
| 5019 | 26.35 | 0.01 | 3.2 | 1.22 | 1.21 | 1.01 | 1.07 | 1.01 | 0.008 | 1.92 | 7,6 | 2.3 | 3.2 | 0.18 | 0.05 | 0.16 | 8.0 |
| 5019 + 1/2 | 26.13 | 0.02 | 2.8 | 1.20 | 1.20 | 1.00 | 1.04 | 1.00 | 0.009 | 2.08 | 7,6 | 2.2 | 3.1 | 0.18 | 0.04 | 0.16 | 8.0 |
| 5020 | 25.95 | 0.01 | 2.4 | 1.17 | 1.18 | 1.00 | 1.02 | 1.00 | 0.008 | 1.99 | 6,7 | 2.3 | 3.1 | 0.17 | 0.04 | 0.15 | 8.0 |
| 5020 + 1/2 | 25.77 | 0.01 | 2.0 | 1.11 | 1.19 | 0.93 | 0.95 | 0.93 | 0.008 | 2.03 | 5,7 | 2.5 | 3.3 | 0.16 | 0.04 | 0.15 | 8.0 |
| 5021 | 25.62 | 0.01 | 1.6 | 1.01 | 1.19 | 0.85 | 0.85 | 0.85 | 0.016 | 1.87 | 5,7 | 2.9 | 3.6 | 0.16 | 0.03 | 0.15 | 8.0 |
| 5021 + 1/2 | 25.49 | 0.01 | 1.4 | 0.92 | 1.19 | 0.77 | 0.78 | 0.77 | 0.000 | 1.64 | 7,5 | 3.4 | 3.9 | 0.16 | 0.02 | 0.15 | 8.0 |
| 5022 | 25.38 | 0.01 | 1.2 | 0.85 | 1.19 | 0.72 | 0.72 | 0.72 | 0.009 | 1.92 | 6,6 | 4.0 | 4.8 | 0.15 | 0.02 | 0.14 | 8.0 |
| 5022 + 1/2 | 25.29 | 0.01 | 0.8 | 0.77 | 1.19 | 0.65 | 0.66 | 0.65 | 0.009 | 1.91 | 2,3 | 4.7 | 5.6 | 0.15 | 0.02 | 0.15 | 8.0 |
| 5023 | 25.22 | 0.01 | 0.7 | 0.71 | 1.19 | 0.60 | 0.60 | 0.60 | 0.005 | 1.78 | 2,3 | 5.6 | 6.5 | 0.15 | 0.03 | 0.14 | 8.1 |
| 5023 + 1/2 | 25.16 | 0.01 | 0.6 | 0.65 | 1.19 | 0.55 | 0.56 | 0.55 | 0.006 | 1.31 | 2,3 | 6.5 | 7.4 | 0.15 | 0.03 | 0.14 | 8.3 |
| 5024 last | 25.13 | 0.01 | 0.6 | 0.67 | 1.19 | 0.56 | 0.57 | 0.56 | 0.001 | 1.12 | 13,0 | 7.5 | 8.3 | 0.15 | 0.04 | 0.14 | 8.2 |
| 5024 + 1/2 | 25.11 | 0.00 | 0.7 | 0.76 | 1.19 | 0.64 | 0.64 | 0.64 | 0.012 | 1.10 | 4,5 | 8.6 | 9.4 | 0.15 | 0.05 | 0.14 | 8.3 |
| 5025 | 25.09 | 0.00 | 1.0 | 0.88 | 1.19 | 0.74 | 0.74 | 0.74 | 0.007 | 1.21 | 15,2 | 9.7 | 10.6 | 0.15 | 0.06 | 0.14 | 8.4 |
| 5025 + 1/2 | 25.08 | 0.00 | 1.0 | 0.97 | 1.19 | 0.82 | 0.82 | 0.82 | 0.002 | 1.41 | 13,0 | 10.8 | 11.9 | 0.15 | 0.07 | 0.14 | 8.4 |
| 5026 | 25.06 | 0.00 | 1.3 | 1.07 | 1.19 | 0.90 | 0.91 | 0.90 | 0.007 | 1.41 | 10,5 | 11.9 | 13.0 | 0.15 | 0.08 | 0.14 | 8.6 |
| 5026 + 1/2 | 25.04 | 0.00 | 1.7 | 1.10 | 1.19 | 0.93 | 0.93 | 0.93 | 0.016 | 1.40 | 8,8 | 13.0 | 14.2 | 0.15 | 0.10 | 0.14 | 8.3 |
| 5027 | 25.02 | 0.00 | 1.9 | 1.13 | 1.19 | 0.95 | 0.95 | 0.95 | 0.009 | 1.43 | 9,7 | 14.0 | 15.4 | 0.15 | 0.11 | 0.14 | 8.3 |
| 5027 + 1/2 | 25.00 | 0.00 | 2.2 | 1.13 | 1.19 | 0.96 | 0.96 | 0.96 | 0.016 | 1.29 | 6,8 | 15.1 | 16.5 | 0.16 | 0.12 | 0.14 | 8.3 |
| 5028 | 24.97 | 0.00 | 2.6 | 1.16 | 1.21 | 0.96 | 0.96 | 0.96 | 0.005 | 1.39 | 2,0 | 16.1 | 17.3 | 0.16 | 0.14 | 0.14 | 8.3 |
| 5028 + 1/2 | 24.94 | 0.00 | 2.8 | 1.24 | 1.24 | 1.00 | 1.00 | 1.00 | 0.014 | 1.53 | 1,1 | 17.1 | 18.3 | 0.16 | 0.16 | 0.14 | 8.3 |
| 5029 | 24.91 | 0.00 | 3.3 | 1.33 | 1.32 | 1.00 | 1.01 | 1.00 | 0.008 | 1.46 | 10,8 |  |  |  |  |  |  |
| 5029 + 1/2 | 24.88 | 0.00 | 3.6 | 1.40 | 1.37 | 1.02 | 1.02 | 1.02 | 0.021 | 1.63 | 15,0 |  |  |  |  |  |  |
| 5030 | 24.84 | 0.00 | 3.8 | 1.45 | 1.41 | 1.03 | 1.04 | 1.03 | 0.007 | 1.62 | 12,3 |  |  |  |  |  |  |
| 5030 + 1/2 | 24.79 | 0.00 | 4.3 | 1.45 | 1.42 | 1.02 | 1.02 | 1.02 | 0.006 | 1.63 | 12,3 |  |  |  |  |  |  |
| 5031 | 24.75 | 0.01 | 4.6 | 1.47 | 1.43 | 1.02 | 1.02 | 1.02 | 0.007 | 1.52 | 12,1 |  |  |  |  |  |  |
| 5031 + 1/2 | 24.70 | 0.00 | 4.9 | 1.44 | 1.45 | 0.99 | 1.00 | 0.99 | 0.006 | 1.44 | 8,0 |  |  |  |  |  |  |
| 5032 | 24.64 | 0.00 | 5.2 | 1.41 | 1.46 | 0.97 | 0.98 | 0.97 | 0.004 | 1.55 | 8,0 |  |  |  |  |  |  |
| 5032 + 1/2 | 24.58 | 0.00 | 5.4 | 1.42 | 1.46 | 0.97 | 0.98 | 0.97 | 0.004 | 1.56 | 8,0 |  |  |  |  |  |  |
| 5033 | 24.51 | 0.00 | 5.9 | 1.47 | 1.45 | 1.01 | 1.01 | 1.01 | 0.002 | 1.63 | 8,0 |  |  |  |  |  |  |
| 5033 + 1/2 | 24.43 | 0.00 | 6.1 | 1.47 | 1.45 | 1.01 | 1.01 | 1.01 | 0.001 | 1.60 | 8,0 |  |  |  |  |  |  |
| 5034 | 24.36 | 0.00 | 6.2 | 1.51 | 1.45 | 1.04 | 1.04 | 1.04 | 0.001 | 1.57 | 8,0 |  |  |  |  |  |  |
| 5034 + 1/2 | 24.27 | 0.00 | 6.7 | 1.53 | 1.45 | 1.05 | 1.05 | 1.05 | 0.003 | 1.51 | 8,0 |  |  |  |  |  |  |
| 5035 | 24.19 | 0.00 | 6.9 | 1.52 | 1.45 | 1.04 | 1.05 | 1.04 | 0.002 | 1.53 | 8,0 |  |  |  |  |  |  |
| 5035 + 1/2 | 24.10 | 0.00 | 7.2 | 1.52 | 1.45 | 1.05 | 1.05 | 1.05 | 0.015 | 1.55 | 8,0 |  |  |  |  |  |  |
| 5036 | 24.00 | 0.00 | 7.5 | 1.51 | 1.45 | 1.04 | 1.03 | 1.03 | 0.015 | 1.42 | 11,7 |  |  |  |  |  |  |
| 5036 + 1/2 | 23.90 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### rise, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.16 from frame 4968 to the next, limit 1.2.
Largest pop score of one block: 6.64 from frame 5003 + 1/2 to the next, block column 15 row 7 from the top left, shown, not judged.
Largest change in place: 46.6 from frame 4964 to 8 film frames later, most at pixel 156, 1000, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 4938 to 4949 + 1/2): change 3.9; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.034 from frame 4956 to the next, most at pixel 1082, 854, a patch of 132 by 108 px; 0 of 197 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 198 rows, which says nothing of them, quiet or not: frame 5036 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 4956 in /home/user/workspace/work/p6/sm60/03/neptune-rise-p1of2-pops-full.png, frame 4966 + 1/2 in /home/user/workspace/work/p6/sm60/03/neptune-rise-p1of2-pops-full.png, frame 4967 + 1/2 in /home/user/workspace/work/p6/sm60/03/neptune-rise-p1of2-pops-full.png, frame 4968 in /home/user/workspace/work/p6/sm60/03/neptune-rise-p1of2-pops-full.png, frame 4968 + 1/2 in /home/user/workspace/work/p6/sm60/03/neptune-rise-p1of2-pops-full.png.

With the carry at the full size the rise has no number over its limit.

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4938 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 8,6 | 3.8 | 11.8 | 0.68 | 1.00 | 0.620 | 0.619 | 1.001 | 0.701 | 1386,890 | 56 by 52 |
| 4938 + 1/2 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 6,4 | 3.9 | 14.3 | 0.68 | 0.99 | 0.619 | 0.620 | 0.997 | 0.701 | 1046,830 | 72 by 128 |
| 4939 | 1.4 | 0.52 | 0.52 | 1.01 | 1.01 | 1.01 | 0.000 | 1.23 | 6,7 | 3.8 | 12.9 | 0.68 | 1.00 | 0.624 | 0.619 | 1.007 | 0.701 | 986,826 | 100 by 76 |
| 4939 + 1/2 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.27 | 6,7 | 3.9 | 10.3 | 0.68 | 1.00 | 0.620 | 0.620 | 0.999 | 0.701 | 1394,886 | 52 by 52 |
| 4940 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.27 | 6,7 | 3.7 | 7.5 | 0.68 | 1.00 | 0.618 | 0.621 | 0.997 | 0.701 | 1398,898 | 52 by 52 |
| 4940 + 1/2 | 1.4 | 0.52 | 0.52 | 1.01 | 1.01 | 1.01 | 0.000 | 1.20 | 8,6 | 3.6 | 7.2 | 0.68 | 1.00 | 0.622 | 0.619 | 1.005 | 0.700 | 986,774 | 64 by 96 |
| 4941 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.27 | 6,7 | 3.6 | 7.3 | 0.68 | 0.99 | 0.615 | 0.619 | 0.994 | 0.700 | 854,834 | 180 by 144 |
| 4941 + 1/2 | 1.3 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 6,7 | 3.5 | 7.4 | 0.68 | 0.99 | 0.619 | 0.618 | 1.001 | 0.700 | 994,834 | 84 by 68 |
| 4942 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.23 | 13,8 | 3.6 | 7.1 | 0.68 | 1.00 | 0.616 | 0.619 | 0.995 | 0.700 | 1414,898 | 52 by 52 |
| 4942 + 1/2 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.23 | 13,8 | 3.5 | 7.2 | 0.68 | 1.00 | 0.620 | 0.619 | 1.001 | 0.700 | 1418,906 | 52 by 52 |
| 4943 | 1.4 | 0.52 | 0.52 | 1.01 | 1.01 | 1.01 | 0.000 | 1.16 | 13,8 | 3.5 | 7.4 | 0.68 | 1.00 | 0.620 | 0.619 | 1.003 | 0.700 | 1002,842 | 72 by 132 |
| 4943 + 1/2 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 6,7 | 3.3 | 7.1 | 0.68 | 1.00 | 0.619 | 0.619 | 1.000 | 0.700 | 1086,850 | 56 by 80 |
| 4944 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 9,6 | 3.4 | 7.3 | 0.69 | 1.00 | 0.618 | 0.618 | 1.000 | 0.700 | 1422,906 | 52 by 64 |
| 4944 + 1/2 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 9,6 | 3.2 | 7.2 | 0.69 | 1.00 | 0.618 | 0.617 | 1.001 | 0.700 | 1430,910 | 56 by 56 |
| 4945 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 7,7 | 3.4 | 6.9 | 0.69 | 1.00 | 0.616 | 0.617 | 0.999 | 0.699 | 1438,914 | 56 by 48 |
| 4945 + 1/2 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.23 | 7,7 | 3.7 | 8.3 | 0.70 | 1.00 | 0.615 | 0.616 | 1.000 | 0.700 | 1442,922 | 44 by 52 |
| 4946 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.25 | 7,7 | 4.0 | 8.7 | 0.70 | 0.99 | 0.614 | 0.616 | 0.997 | 0.699 | 1038,846 | 84 by 124 |
| 4946 + 1/2 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 7,7 | 4.4 | 10.3 | 0.70 | 1.00 | 0.615 | 0.616 | 0.998 | 0.699 | 1106,866 | 64 by 60 |
| 4947 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 7,7 | 5.1 | 11.3 | 0.71 | 1.00 | 0.617 | 0.615 | 1.003 | 0.699 | 1446,922 | 60 by 60 |
| 4947 + 1/2 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 12,7 | 5.7 | 12.0 | 0.71 | 1.00 | 0.618 | 0.616 | 1.003 | 0.699 | 1458,922 | 56 by 52 |
| 4948 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 9,7 | 6.5 | 12.2 | 0.71 | 1.00 | 0.615 | 0.618 | 0.996 | 0.699 | 1118,870 | 60 by 60 |
| 4948 + 1/2 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 7,5 | 7.4 | 12.2 | 0.71 | 1.00 | 0.617 | 0.617 | 1.000 | 0.699 | 1098,870 | 124 by 120 |
| 4949 | 1.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 8,7 | 8.6 | 11.9 | 0.71 | 0.99 | 0.618 | 0.615 | 1.005 | 0.699 | 1030,854 | 168 by 148 |
| 4949 + 1/2 | 1.4 | 0.52 | 0.52 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 14,4 | 10.0 | 13.3 | 0.71 | 1.00 | 0.615 | 0.598 | 1.028 | 0.699 | 1122,870 | 192 by 136 |
| 4950 | 1.4 | 0.49 | 0.52 | 0.95 | 0.95 | 0.95 | 0.000 | 1.11 | 15,6 | 11.4 | 14.7 | 0.71 | 0.98 | 0.579 | 0.587 | 0.988 | 0.698 | 302,462 | 136 by 100 |
| 4950 + 1/2 | 1.5 | 0.44 | 0.52 | 0.85 | 0.85 | 0.85 | 0.000 | 1.69 | 12,8 | 12.9 | 16.2 | 0.71 | 0.96 | 0.514 | 0.569 | 0.902 | 0.698 | 1538,1058 | 68 by 64 |
| 4951 | 1.7 | 0.47 | 0.52 | 0.92 | 0.92 | 0.92 | 0.000 | 1.57 | 14,4 | 14.4 | 17.8 | 0.71 | 0.94 | 0.558 | 0.569 | 0.981 | 0.700 | 730,634 | 76 by 60 |
| 4951 + 1/2 | 2.0 | 0.48 | 0.52 | 0.92 | 0.92 | 0.92 | 0.000 | 1.18 | 7,7 | 16.1 | 18.6 | 0.71 | 0.92 | 0.559 | 0.581 | 0.964 | 0.702 | 1058,854 | 156 by 116 |
| 4952 | 2.5 | 0.51 | 0.52 | 0.97 | 0.97 | 0.97 | 0.000 | 1.48 | 14,4 | 17.7 | 20.2 | 0.71 | 0.96 | 0.603 | 0.592 | 1.017 | 0.703 | 1066,858 | 168 by 128 |
| 4952 + 1/2 | 3.0 | 0.53 | 0.54 | 0.98 | 0.98 | 0.98 | 0.000 | 1.61 | 13,8 | 19.4 | 22.1 | 0.71 | 0.99 | 0.625 | 0.633 | 0.987 | 0.702 | 1650,1038 | 88 by 72 |
| 4953 | 3.6 | 0.57 | 0.56 | 1.02 | 1.02 | 1.02 | 0.000 | 1.30 | 12,8 | 21.0 | 24.0 | 0.71 | 1.00 | 0.664 | 0.651 | 1.019 | 0.702 | 1050,866 | 136 by 108 |
| 4953 + 1/2 | 4.2 | 0.58 | 0.59 | 0.98 | 0.98 | 0.98 | 0.000 | 1.47 | 14,4 | 22.6 | 25.6 | 0.70 | 0.97 | 0.678 | 0.694 | 0.977 | 0.702 | 1074,854 | 152 by 124 |
| 4954 | 4.9 | 0.62 | 0.62 | 0.99 | 0.99 | 0.99 | 0.000 | 1.22 | 11,7 | 24.3 | 27.3 | 0.70 | 1.01 | 0.723 | 0.731 | 0.989 | 0.702 | 174,478 | 104 by 96 |
| 4954 + 1/2 | 5.5 | 0.67 | 0.65 | 1.02 | 1.02 | 1.02 | 0.002 | 1.37 | 12,8 | 26.1 | 28.8 | 0.70 | 1.03 | 0.785 | 0.766 | 1.025 | 0.702 | 1058,862 | 116 by 96 |
| 4955 | 6.2 | 0.69 | 0.69 | 0.99 | 0.99 | 0.99 | 0.003 | 1.24 | 5,4 | 27.8 | 30.1 | 0.70 | 1.01 | 0.808 | 0.814 | 0.994 | 0.702 | 1070,806 | 132 by 124 |
| 4955 + 1/2 | 6.8 | 0.72 | 0.74 | 0.97 | 0.98 | 0.97 | 0.005 | 1.22 | 15,3 | 29.2 | 30.9 | 0.70 | 1.00 | 0.842 | 0.869 | 0.969 | 0.702 | 674,670 | 68 by 60 |
| 4956 | 7.5 | 0.79 | 0.77 | 1.03 | 1.02 | 1.02 | 0.008 | 1.34 | 13,4 | 31.0 | 32.9 | 0.70 | 0.97 | 0.929 | 0.898 | 1.034 | 0.702 | 1082,854 | 132 by 108 |
| 4956 + 1/2 | 8.1 | 0.82 | 0.82 | 0.99 | 1.00 | 0.99 | 0.003 | 1.35 | 15,3 | 32.5 | 34.3 | 0.70 | 0.99 | 0.954 | 0.968 | 0.986 | 0.703 | 1574,1074 | 108 by 84 |
| 4957 | 8.7 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.007 | 1.36 | 15,3 | 33.9 | 36.0 | 0.69 | 1.00 | 1.007 | 1.023 | 0.985 | 0.703 | 222,482 | 96 by 96 |
| 4957 + 1/2 | 9.4 | 0.93 | 0.90 | 1.03 | 1.02 | 1.02 | 0.011 | 1.46 | 9,6 | 35.3 | 37.6 | 0.69 | 1.02 | 1.091 | 1.059 | 1.030 | 0.703 | 1534,1006 | 76 by 88 |
| 4958 | 10.0 | 0.94 | 0.96 | 0.98 | 0.98 | 0.98 | 0.011 | 1.29 | 3,4 | 36.8 | 39.3 | 0.69 | 0.99 | 1.112 | 1.138 | 0.977 | 0.704 | 1534,1014 | 96 by 92 |
| 4958 + 1/2 | 10.6 | 1.00 | 1.00 | 1.00 | 1.01 | 1.00 | 0.013 | 1.33 | 14,8 | 38.0 | 40.8 | 0.69 | 1.01 | 1.184 | 1.184 | 1.000 | 0.704 | 1106,838 | 116 by 104 |
| 4959 | 11.2 | 1.05 | 1.04 | 1.01 | 1.00 | 1.00 | 0.023 | 1.90 | 15,8 | 39.0 | 42.1 | 0.69 | 0.97 | 1.256 | 1.241 | 1.012 | 0.705 | 1822,1074 | 152 by 32 |
| 4959 + 1/2 | 11.8 | 1.08 | 1.08 | 1.00 | 1.00 | 1.00 | 0.012 | 1.66 | 15,8 | 40.0 | 42.9 | 0.69 | 1.00 | 1.297 | 1.308 | 0.991 | 0.705 | 1882,1074 | 72 by 44 |
| 4960 | 12.4 | 1.12 | 1.11 | 1.01 | 1.01 | 1.01 | 0.020 | 1.52 | 14,8 | 40.9 | 44.0 | 0.69 | 1.01 | 1.361 | 1.340 | 1.016 | 0.706 | 1514,966 | 152 by 80 |
| 4960 + 1/2 | 13.0 | 1.14 | 1.16 | 0.98 | 0.99 | 0.98 | 0.021 | 1.44 | 15,5 | 41.6 | 44.6 | 0.69 | 1.00 | 1.383 | 1.413 | 0.978 | 0.706 | 274,462 | 96 by 84 |
| 4961 | 13.6 | 1.20 | 1.18 | 1.02 | 1.01 | 1.01 | 0.041 | 1.38 | 9,6 | 42.3 | 44.8 | 0.69 | 1.01 | 1.465 | 1.434 | 1.022 | 0.707 | 1134,802 | 76 by 80 |
| 4961 + 1/2 | 14.1 | 1.22 | 1.25 | 0.97 | 0.98 | 0.97 | 0.058 | 1.49 | 15,5 | 42.9 | 45.1 | 0.69 | 0.98 | 1.485 | 1.522 | 0.976 | 0.708 | 1914,1074 | 48 by 20 |
| 4962 | 14.7 | 1.29 | 1.27 | 1.02 | 1.06 | 1.02 | 0.021 | 1.57 | 12,4 | 43.6 | 46.8 | 0.69 | 1.00 | 1.578 | 1.545 | 1.021 | 0.708 | 1142,790 | 80 by 64 |
| 4962 + 1/2 | 15.3 | 1.32 | 1.35 | 0.98 | 0.94 | 0.94 | 0.086 | 1.35 | 15,5 | 44.3 | 48.9 | 0.69 | 0.95 | 1.605 | 1.643 | 0.977 | 0.709 | 742,598 | 64 by 80 |
| 4963 | 15.9 | 1.40 | 1.37 | 1.02 | 1.02 | 1.02 | 0.062 | 1.71 | 15,8 | 45.8 | 50.3 | 0.69 | 1.01 | 1.708 | 1.660 | 1.029 | 0.710 | 1914,1050 | 44 by 56 |
| 4963 + 1/2 | 16.4 | 1.42 | 1.46 | 0.97 | 1.00 | 0.97 | 0.067 | 1.40 | 12,4 | 46.3 | 50.5 | 0.69 | 1.02 | 1.716 | 1.765 | 0.972 | 0.710 | 542,510 | 56 by 80 |
| 4964 | 17.1 | 1.52 | 1.46 | 1.04 | 1.05 | 1.04 | 0.082 | 2.32 | 15,8 | 46.6 | 50.4 | 0.69 | 1.05 | 1.822 | 1.773 | 1.028 | 0.711 | 1862,1022 | 76 by 84 |
| 4964 + 1/2 | 17.7 | 1.52 | 1.46 | 1.04 | 1.07 | 1.04 | 0.070 | 1.67 | 12,2 | 46.2 | 49.9 | 0.69 | 1.05 | 1.829 | 1.853 | 0.987 | 0.712 | 1830,1058 | 56 by 56 |
| 4965 | 18.0 | 1.57 | 1.46 | 1.08 | 1.10 | 1.08 | 0.075 | 1.59 | 15,8 | 45.7 | 49.0 | 0.69 | 1.06 | 1.884 | 1.879 | 1.003 | 0.713 | 1810,990 | 60 by 56 |
| 4965 + 1/2 | 18.5 | 1.61 | 1.46 | 1.10 | 1.12 | 1.10 | 0.088 | 2.51 | 14,8 | 44.2 | 47.2 | 0.69 | 1.07 | 1.930 | 1.909 | 1.011 | 0.714 | 1778,1014 | 56 by 80 |
| 4966 | 19.5 | 1.61 | 1.46 | 1.10 | 1.12 | 1.10 | 0.104 | 1.51 | 3,1 | 43.2 | 47.3 | 0.69 | 1.07 | 1.933 | 1.950 | 0.991 | 0.714 | 450,474 | 60 by 68 |
| 4966 + 1/2 | 19.7 | 1.68 | 1.46 | 1.15 | 1.16 | 1.15 | 0.088 | 1.96 | 3,1 | 41.8 | 44.0 | 0.69 | 1.09 | 1.984 | 1.952 | 1.017 | 0.715 | 1730,970 | 68 by 76 |
| 4967 | 20.6 | 1.67 | 1.46 | 1.15 | 1.14 | 1.14 | 0.108 | 1.65 | 14,8 | 40.4 | 42.0 | 0.69 | 1.09 | 1.971 | 1.983 | 0.994 | 0.716 | 1706,970 | 56 by 60 |
| 4967 + 1/2 | 21.3 | 1.69 | 1.46 | 1.16 | 1.21 | 1.16 | 0.037 | 2.15 | 4,1 | 39.3 | 41.8 | 0.70 | 1.10 | 1.982 | 1.977 | 1.002 | 0.717 | 1398,838 | 60 by 72 |
| 4968 | 21.9 | 1.70 | 1.46 | 1.16 | 1.20 | 1.16 | 0.070 | 2.83 | 8,1 | 38.8 | 41.7 | 0.70 | 1.10 | 1.984 | 1.967 | 1.009 | 0.717 | 1658,930 | 60 by 64 |
| 4968 + 1/2 | 22.4 | 1.71 | 1.46 | 1.17 | 1.15 | 1.15 | 0.106 | 2.00 | 8,1 | 37.9 | 41.5 | 0.70 | 1.09 | 1.963 | 1.956 | 1.004 | 0.718 | 1870,990 | 76 by 76 |
| 4969 | 23.1 | 1.67 | 1.46 | 1.15 | 1.12 | 1.12 | 0.122 | 1.92 | 2,0 | 36.1 | 38.5 | 0.70 | 1.06 | 1.930 | 1.938 | 0.996 | 0.719 | 1614,886 | 60 by 60 |
| 4969 + 1/2 | 23.5 | 1.69 | 1.46 | 1.15 | 1.12 | 1.12 | 0.117 | 2.26 | 4,0 | 34.0 | 36.9 | 0.70 | 1.04 | 1.913 | 1.895 | 1.009 | 0.719 | 1590,882 | 64 by 64 |
| 4970 | 24.1 | 1.64 | 1.46 | 1.12 | 1.09 | 1.09 | 0.115 | 2.34 | 2,0 | 32.7 | 42.5 | 0.70 | 1.03 | 1.861 | 1.852 | 1.005 | 0.720 | 1778,942 | 80 by 80 |
| 4970 + 1/2 | 24.7 | 1.61 | 1.46 | 1.10 | 1.06 | 1.06 | 0.108 | 2.44 | 3,0 | 31.6 | 43.6 | 0.70 | 1.03 | 1.791 | 1.806 | 0.992 | 0.720 | 1554,846 | 52 by 60 |
| 4971 | 25.6 | 1.58 | 1.46 | 1.08 | 1.04 | 1.04 | 0.119 | 3.92 | 3,0 | 30.9 | 47.2 | 0.70 | 1.00 | 1.752 | 1.745 | 1.004 | 0.721 | 1526,846 | 56 by 60 |
| 4971 + 1/2 | 26.2 | 1.53 | 1.46 | 1.05 | 1.03 | 1.03 | 0.109 | 2.74 | 3,0 | 29.6 | 43.8 | 0.70 | 1.00 | 1.699 | 1.689 | 1.006 | 0.721 | 1506,830 | 52 by 60 |
| 4972 | 26.2 | 1.50 | 1.47 | 1.02 | 0.99 | 0.99 | 0.133 | 2.35 | 5,0 | 28.7 | 43.8 | 0.70 | 0.99 | 1.627 | 1.620 | 1.004 | 0.721 | 1486,818 | 52 by 56 |
| 4972 + 1/2 | 26.2 | 1.43 | 1.42 | 1.01 | 1.01 | 1.01 | 0.141 | 2.11 | 1,0 | 29.0 | 42.6 | 0.70 | 1.00 | 1.541 | 1.527 | 1.009 | 0.722 | 1466,798 | 56 by 56 |
| 4973 | 26.5 | 1.34 | 1.34 | 1.00 | 1.00 | 1.00 | 0.137 | 1.95 | 1,0 | 25.8 | 39.7 | 0.70 | 1.00 | 1.426 | 1.444 | 0.988 | 0.722 | 1850,938 | 64 by 52 |
| 4973 + 1/2 | 26.1 | 1.26 | 1.25 | 1.00 | 0.99 | 0.99 | 0.152 | 1.38 | 15,7 | 23.8 | 37.9 | 0.70 | 0.98 | 1.347 | 1.353 | 0.996 | 0.723 | 1814,918 | 52 by 52 |
| 4974 | 27.1 | 1.17 | 1.16 | 1.00 | 0.97 | 0.97 | 0.154 | 1.41 | 11,4 | 22.1 | 36.5 | 0.70 | 0.97 | 1.279 | 1.276 | 1.002 | 0.723 | 1414,766 | 52 by 52 |
| 4974 + 1/2 | 27.0 | 1.07 | 1.09 | 0.98 | 1.06 | 0.98 | 0.113 | 1.69 | 11,6 | 21.5 | 34.1 | 0.70 | 0.99 | 1.205 | 1.201 | 1.004 | 0.724 | 1398,758 | 52 by 52 |
| 4975 | 24.7 | 1.01 | 0.99 | 1.01 | 0.96 | 0.96 | 0.225 | 1.38 | 11,6 | 20.9 | 32.4 | 0.70 | 0.97 | 1.123 | 1.127 | 0.997 | 0.724 | 1378,742 | 52 by 52 |
| 4975 + 1/2 | 27.2 | 0.92 | 0.95 | 0.97 | 1.00 | 0.97 | 0.134 | 1.85 | 13,6 | 19.5 | 31.4 | 0.70 | 0.98 | 1.048 | 1.054 | 0.995 | 0.725 | 1574,822 | 56 by 52 |
| 4976 | 27.7 | 0.87 | 0.91 | 0.96 | 1.01 | 0.96 | 0.136 | 1.31 | 12,6 | 19.5 | 31.5 | 0.70 | 0.98 | 0.984 | 0.997 | 0.987 | 0.725 | 1546,806 | 56 by 52 |
| 4976 + 1/2 | 24.9 | 0.89 | 0.85 | 1.05 | 0.98 | 0.98 | 0.225 | 2.16 | 14,0 | 19.2 | 30.1 | 0.69 | 0.96 | 0.946 | 0.943 | 1.004 | 0.726 | 1522,794 | 56 by 52 |
| 4977 | 24.8 | 0.83 | 0.85 | 0.98 | 0.96 | 0.96 | 0.248 | 1.68 | 11,5 | 19.4 | 27.4 | 0.69 | 0.95 | 0.901 | 0.904 | 0.997 | 0.727 | 1326,706 | 64 by 56 |
| 4977 + 1/2 | 25.2 | 0.83 | 0.82 | 1.00 | 1.01 | 1.00 | 0.192 | 2.39 | 15,1 | 19.1 | 30.5 | 0.69 | 1.01 | 0.861 | 0.862 | 0.999 | 0.727 | 1306,694 | 60 by 52 |
| 4978 | 28.0 | 0.78 | 0.82 | 0.95 | 1.06 | 0.95 | 0.122 | 2.08 | 10,5 | 19.6 | 30.5 | 0.70 | 0.98 | 0.823 | 0.820 | 1.003 | 0.728 | 1290,682 | 64 by 56 |
| 4978 + 1/2 | 27.2 | 0.75 | 0.80 | 0.93 | 0.98 | 0.93 | 0.185 | 1.96 | 10,5 | 19.6 | 32.0 | 0.69 | 1.00 | 0.779 | 0.760 | 1.026 | 0.729 | 1346,710 | 68 by 48 |
| 4979 | 28.9 | 0.68 | 0.79 | 0.86 | 0.92 | 0.86 | 0.165 | 1.54 | 10,5 | 19.5 | 32.1 | 0.69 | 0.96 | 0.697 | 0.725 | 0.961 | 0.729 | 782,486 | 136 by 76 |
| 4979 + 1/2 | 28.1 | 0.70 | 0.79 | 0.89 | 0.96 | 0.89 | 0.156 | 1.58 | 8,4 | 19.5 | 31.1 | 0.70 | 0.96 | 0.671 | 0.680 | 0.986 | 0.730 | 1030,570 | 108 by 56 |
| 4980 | 28.2 | 0.67 | 0.78 | 0.86 | 1.01 | 0.86 | 0.132 | 1.54 | 8,4 | 19.6 | 29.7 | 0.70 | 0.95 | 0.663 | 0.667 | 0.994 | 0.730 | 1234,642 | 60 by 52 |
| 4980 + 1/2 | 28.4 | 0.69 | 0.78 | 0.88 | 1.04 | 0.88 | 0.129 | 1.67 | 9,4 | 20.1 | 29.3 | 0.70 | 0.95 | 0.664 | 0.658 | 1.008 | 0.730 | 1218,634 | 64 by 48 |
| 4981 | 24.5 | 0.75 | 0.78 | 0.96 | 0.98 | 0.96 | 0.219 | 1.77 | 9,4 | 20.1 | 28.4 | 0.70 | 0.96 | 0.653 | 0.656 | 0.995 | 0.729 | 1202,622 | 64 by 48 |
| 4981 + 1/2 | 28.6 | 0.70 | 0.77 | 0.92 | 1.04 | 0.92 | 0.144 | 1.79 | 9,4 | 20.1 | 31.1 | 0.70 | 0.97 | 0.649 | 0.649 | 1.001 | 0.729 | 1190,614 | 84 by 48 |
| 4982 | 27.8 | 0.74 | 0.76 | 0.97 | 0.99 | 0.97 | 0.170 | 1.88 | 9,4 | 20.3 | 30.9 | 0.70 | 0.99 | 0.645 | 0.643 | 1.003 | 0.728 | 1018,542 | 72 by 48 |
| 4982 + 1/2 | 28.4 | 0.73 | 0.75 | 0.97 | 1.01 | 0.97 | 0.157 | 1.86 | 9,4 | 21.8 | 34.7 | 0.70 | 0.98 | 0.637 | 0.638 | 0.999 | 0.727 | 1134,586 | 152 by 84 |
| 4983 | 29.0 | 0.72 | 0.74 | 0.97 | 1.00 | 0.97 | 0.166 | 1.72 | 11,3 | 23.0 | 36.5 | 0.70 | 0.99 | 0.630 | 0.633 | 0.997 | 0.726 | 242,1074 | 88 by 32 |
| 4983 + 1/2 | 26.0 | 0.78 | 0.74 | 1.06 | 0.97 | 0.97 | 0.231 | 1.58 | 9,2 | 25.1 | 34.8 | 0.70 | 0.95 | 0.628 | 0.624 | 1.007 | 0.724 | 1006,526 | 80 by 52 |
| 4984 | 26.0 | 0.81 | 0.73 | 1.11 | 0.95 | 0.95 | 0.236 | 1.57 | 9,2 | 25.7 | 39.1 | 0.70 | 0.93 | 0.617 | 0.619 | 0.996 | 0.722 | 1026,526 | 100 by 64 |
| 4984 + 1/2 | 26.3 | 0.79 | 0.73 | 1.09 | 0.91 | 0.91 | 0.243 | 1.49 | 13,7 | 25.8 | 41.1 | 0.69 | 0.89 | 0.611 | 0.610 | 1.002 | 0.720 | 410,1010 | 96 by 92 |
| 4985 | 26.5 | 0.79 | 0.72 | 1.09 | 0.99 | 0.99 | 0.204 | 1.89 | 13,2 | 26.8 | 40.7 | 0.69 | 0.96 | 0.602 | 0.600 | 1.003 | 0.718 | 998,510 | 64 by 48 |
| 4985 + 1/2 | 28.7 | 0.78 | 0.72 | 1.08 | 1.00 | 1.00 | 0.214 | 2.29 | 15,3 | 31.9 | 43.6 | 0.69 | 0.95 | 0.590 | 0.594 | 0.994 | 0.715 | 962,498 | 132 by 56 |
| 4986 | 25.1 | 0.78 | 0.72 | 1.08 | 1.00 | 1.00 | 0.201 | 1.51 | 7,3 | 32.8 | 42.8 | 0.69 | 0.97 | 0.585 | 0.581 | 1.007 | 0.712 | 974,494 | 64 by 48 |
| 4986 + 1/2 | 29.4 | 0.74 | 0.71 | 1.04 | 0.98 | 0.98 | 0.147 | 1.49 | 7,3 | 34.1 | 44.2 | 0.69 | 0.98 | 0.571 | 0.574 | 0.996 | 0.709 | 138,894 | 72 by 56 |
| 4987 | 28.3 | 0.76 | 0.70 | 1.08 | 0.93 | 0.93 | 0.193 | 1.56 | 7,3 | 33.6 | 44.5 | 0.68 | 0.93 | 0.563 | 0.564 | 0.998 | 0.705 | 918,466 | 68 by 52 |
| 4987 + 1/2 | 29.8 | 0.72 | 0.70 | 1.02 | 0.99 | 0.99 | 0.135 | 1.72 | 8,0 | 34.0 | 43.2 | 0.68 | 0.97 | 0.557 | 0.555 | 1.004 | 0.702 | 906,454 | 64 by 52 |
| 4988 | 25.4 | 0.74 | 0.70 | 1.06 | 0.87 | 0.87 | 0.240 | 1.67 | 8,0 | 33.4 | 40.4 | 0.68 | 0.85 | 0.546 | 0.551 | 0.992 | 0.698 | 202,418 | 56 by 56 |
| 4988 + 1/2 | 29.5 | 0.69 | 0.71 | 0.97 | 0.99 | 0.97 | 0.125 | 1.44 | 14,7 | 33.0 | 41.0 | 0.68 | 0.94 | 0.545 | 0.542 | 1.005 | 0.694 | 602,214 | 100 by 112 |
| 4989 | 29.7 | 0.68 | 0.71 | 0.95 | 0.96 | 0.95 | 0.132 | 1.47 | 14,7 | 31.8 | 36.8 | 0.67 | 0.95 | 0.536 | 0.541 | 0.991 | 0.691 | 238,178 | 100 by 84 |
| 4989 + 1/2 | 29.6 | 0.68 | 0.70 | 0.97 | 1.03 | 0.97 | 0.110 | 1.71 | 14,6 | 30.9 | 34.8 | 0.67 | 0.94 | 0.537 | 0.536 | 1.002 | 0.687 | 242,6 | 56 by 28 |
| 4990 | 29.6 | 0.68 | 0.71 | 0.96 | 1.10 | 0.96 | 0.078 | 1.79 | 15,5 | 28.9 | 32.7 | 0.66 | 0.94 | 0.537 | 0.535 | 1.003 | 0.684 | 954,1074 | 76 by 32 |
| 4990 + 1/2 | 29.2 | 0.68 | 0.71 | 0.96 | 1.07 | 0.96 | 0.096 | 1.81 | 14,6 | 27.4 | 31.6 | 0.66 | 0.93 | 0.533 | 0.531 | 1.004 | 0.680 | 1006,1030 | 84 by 56 |
| 4991 | 29.1 | 0.69 | 0.71 | 0.98 | 1.02 | 0.98 | 0.127 | 1.71 | 15,5 | 25.9 | 29.7 | 0.65 | 0.94 | 0.526 | 0.527 | 0.998 | 0.676 | 610,162 | 64 by 76 |
| 4991 + 1/2 | 29.0 | 0.70 | 0.71 | 0.99 | 1.06 | 0.99 | 0.130 | 1.61 | 0,1 | 24.6 | 28.1 | 0.64 | 0.95 | 0.521 | 0.518 | 1.006 | 0.673 | 6,146 | 36 by 56 |
| 4992 | 29.1 | 0.72 | 0.70 | 1.04 | 1.08 | 1.04 | 0.140 | 1.53 | 11,1 | 22.9 | 26.7 | 0.63 | 0.98 | 0.509 | 0.507 | 1.004 | 0.669 | 846,770 | 84 by 84 |
| 4992 + 1/2 | 28.8 | 0.73 | 0.70 | 1.05 | 1.05 | 1.05 | 0.130 | 1.72 | 14,4 | 22.7 | 25.3 | 0.62 | 0.99 | 0.494 | 0.497 | 0.994 | 0.665 | 638,174 | 168 by 108 |
| 4993 | 28.1 | 0.70 | 0.71 | 0.99 | 0.95 | 0.95 | 0.147 | 1.60 | 11,1 | 21.4 | 23.5 | 0.60 | 0.99 | 0.484 | 0.479 | 1.011 | 0.661 | 654,182 | 116 by 84 |
| 4993 + 1/2 | 28.8 | 0.68 | 0.71 | 0.97 | 0.95 | 0.95 | 0.181 | 1.80 | 12,4 | 19.9 | 22.5 | 0.58 | 0.96 | 0.463 | 0.470 | 0.986 | 0.657 | 150,162 | 52 by 60 |
| 4994 | 26.2 | 0.67 | 0.71 | 0.94 | 1.04 | 0.94 | 0.129 | 1.96 | 14,3 | 18.8 | 21.4 | 0.55 | 1.00 | 0.457 | 0.451 | 1.012 | 0.653 | 6,214 | 36 by 56 |
| 4994 + 1/2 | 26.5 | 0.64 | 0.71 | 0.91 | 0.97 | 0.91 | 0.110 | 2.07 | 14,3 | 17.3 | 19.8 | 0.54 | 0.99 | 0.439 | 0.442 | 0.994 | 0.649 | 662,190 | 96 by 92 |
| 4995 | 25.2 | 0.62 | 0.71 | 0.88 | 0.95 | 0.88 | 0.102 | 2.08 | 14,3 | 15.9 | 18.7 | 0.51 | 0.99 | 0.427 | 0.428 | 0.999 | 0.646 | 94,214 | 64 by 68 |
| 4995 + 1/2 | 25.1 | 0.62 | 0.71 | 0.88 | 0.93 | 0.88 | 0.115 | 1.99 | 14,3 | 14.6 | 17.5 | 0.49 | 0.98 | 0.416 | 0.416 | 1.001 | 0.641 | 702,202 | 92 by 76 |
| 4996 | 25.3 | 0.62 | 0.71 | 0.88 | 0.94 | 0.88 | 0.109 | 1.94 | 14,3 | 13.4 | 16.6 | 0.48 | 0.97 | 0.405 | 0.408 | 0.991 | 0.637 | 414,294 | 84 by 52 |
| 4996 + 1/2 | 24.0 | 0.65 | 0.71 | 0.91 | 0.97 | 0.91 | 0.122 | 3.35 | 15,8 | 12.2 | 15.2 | 0.47 | 0.98 | 0.400 | 0.398 | 1.006 | 0.633 | 702,198 | 76 by 68 |
| 4997 | 26.0 | 0.67 | 0.72 | 0.93 | 0.93 | 0.93 | 0.185 | 1.84 | 12,6 | 10.9 | 13.9 | 0.46 | 0.99 | 0.391 | 0.392 | 0.997 | 0.629 | 454,306 | 68 by 52 |
| 4997 + 1/2 | 24.9 | 0.68 | 0.73 | 0.94 | 0.83 | 0.83 | 0.224 | 1.30 | 12,2 | 9.8 | 12.9 | 0.44 | 0.96 | 0.383 | 0.386 | 0.993 | 0.625 | 6,102 | 56 by 48 |
| 4998 | 25.3 | 0.72 | 0.74 | 0.97 | 0.85 | 0.85 | 0.217 | 1.33 | 15,0 | 8.7 | 11.8 | 0.43 | 0.96 | 0.381 | 0.378 | 1.007 | 0.621 | 746,214 | 128 by 84 |
| 4998 + 1/2 | 24.7 | 0.75 | 0.75 | 1.00 | 0.96 | 0.96 | 0.223 | 2.50 | 15,0 | 7.9 | 10.9 | 0.41 | 1.00 | 0.373 | 0.373 | 0.999 | 0.617 | 922,606 | 56 by 56 |
| 4999 | 25.1 | 0.77 | 0.76 | 1.01 | 0.85 | 0.85 | 0.269 | 3.54 | 15,0 | 7.9 | 10.1 | 0.40 | 0.92 | 0.366 | 0.368 | 0.994 | 0.612 | 566,250 | 76 by 52 |
| 4999 + 1/2 | 25.5 | 0.82 | 0.76 | 1.08 | 0.74 | 0.74 | 0.295 | 2.12 | 12,7 | 8.0 | 8.9 | 0.39 | 0.78 | 0.363 | 0.361 | 1.006 | 0.608 | 682,690 | 72 by 52 |
| 5000 | 25.3 | 0.80 | 0.76 | 1.05 | 0.88 | 0.88 | 0.292 | 4.77 | 15,0 | 8.1 | 8.4 | 0.37 | 0.89 | 0.356 | 0.358 | 0.993 | 0.604 | 6,674 | 40 by 60 |
| 5000 + 1/2 | 24.9 | 0.82 | 0.76 | 1.08 | 0.98 | 0.98 | 0.255 | 4.08 | 15,0 | 8.2 | 8.6 | 0.38 | 0.94 | 0.354 | 0.356 | 0.994 | 0.598 | 1026,418 | 52 by 52 |
| 5001 | 27.1 | 0.84 | 0.76 | 1.10 | 1.03 | 1.03 | 0.236 | 2.32 | 14,4 | 8.2 | 9.2 | 0.37 | 0.91 | 0.353 | 0.355 | 0.996 | 0.595 | 142,6 | 72 by 32 |
| 5001 + 1/2 | 26.2 | 0.81 | 0.76 | 1.06 | 1.00 | 1.00 | 0.264 | 5.07 | 15,0 | 8.2 | 9.1 | 0.37 | 0.94 | 0.356 | 0.352 | 1.011 | 0.591 | 638,266 | 60 by 56 |
| 5002 | 27.1 | 0.81 | 0.76 | 1.06 | 1.05 | 1.05 | 0.223 | 3.78 | 15,0 | 8.3 | 8.9 | 0.36 | 0.97 | 0.350 | 0.351 | 0.998 | 0.586 | 818,210 | 80 by 128 |
| 5002 + 1/2 | 26.6 | 0.83 | 0.76 | 1.09 | 1.11 | 1.09 | 0.183 | 4.51 | 14,0 | 8.4 | 9.1 | 0.35 | 1.03 | 0.348 | 0.348 | 1.001 | 0.582 | 1010,386 | 48 by 52 |
| 5003 | 25.8 | 0.84 | 0.76 | 1.11 | 1.09 | 1.09 | 0.217 | 4.03 | 14,0 | 8.5 | 9.3 | 0.34 | 1.05 | 0.346 | 0.345 | 1.003 | 0.577 | 678,274 | 52 by 56 |
| 5003 + 1/2 | 25.1 | 0.89 | 0.76 | 1.17 | 1.10 | 1.10 | 0.170 | 6.64 | 15,7 | 8.6 | 8.9 | 0.33 | 1.01 | 0.342 | 0.342 | 0.998 | 0.572 | 686,278 | 180 by 200 |
| 5004 | 24.4 | 0.85 | 0.76 | 1.12 | 1.07 | 1.07 | 0.199 | 4.17 | 13,0 | 8.6 | 9.1 | 0.33 | 0.97 | 0.338 | 0.340 | 0.993 | 0.567 | 1058,1074 | 56 by 28 |
| 5004 + 1/2 | 24.0 | 0.86 | 0.76 | 1.13 | 0.92 | 0.92 | 0.291 | 3.18 | 13,0 | 8.6 | 9.0 | 0.32 | 0.88 | 0.338 | 0.339 | 1.000 | 0.561 | 1046,1042 | 80 by 68 |
| 5005 | 22.5 | 0.89 | 0.76 | 1.17 | 1.14 | 1.14 | 0.229 | 3.20 | 14,8 | 8.4 | 8.8 | 0.32 | 1.00 | 0.331 | 0.338 | 0.980 | 0.555 | 1042,462 | 60 by 56 |
| 5005 + 1/2 | 21.2 | 0.91 | 0.76 | 1.20 | 1.07 | 1.07 | 0.269 | 3.04 | 15,7 | 8.2 | 8.4 | 0.31 | 0.96 | 0.339 | 0.334 | 1.017 | 0.550 | 1042,974 | 76 by 68 |
| 5006 | 20.1 | 0.86 | 0.76 | 1.13 | 0.99 | 0.99 | 0.210 | 2.62 | 11,0 | 7.9 | 8.3 | 0.30 | 0.95 | 0.334 | 0.333 | 1.001 | 0.543 | 1034,950 | 68 by 64 |
| 5006 + 1/2 | 18.4 | 0.78 | 0.76 | 1.02 | 1.05 | 1.02 | 0.173 | 3.29 | 11,0 | 7.6 | 7.9 | 0.29 | 1.02 | 0.334 | 0.333 | 1.001 | 0.537 | 878,1074 | 52 by 44 |
| 5007 | 17.6 | 0.78 | 0.76 | 1.03 | 1.00 | 1.00 | 0.188 | 3.42 | 11,0 | 7.5 | 8.4 | 0.29 | 0.98 | 0.333 | 0.331 | 1.005 | 0.530 | 38,518 | 64 by 68 |
| 5007 + 1/2 | 16.6 | 0.74 | 0.76 | 0.98 | 1.01 | 0.98 | 0.173 | 2.71 | 11,0 | 7.4 | 8.2 | 0.29 | 1.00 | 0.329 | 0.328 | 1.002 | 0.523 | 854,234 | 80 by 68 |
| 5008 | 16.4 | 0.74 | 0.73 | 1.01 | 1.00 | 1.00 | 0.158 | 3.03 | 10,8 | 7.4 | 8.0 | 0.29 | 0.99 | 0.324 | 0.325 | 0.996 | 0.515 | 910,1074 | 48 by 24 |
| 5008 + 1/2 | 15.7 | 0.71 | 0.72 | 0.99 | 1.05 | 0.99 | 0.145 | 2.28 | 0,0 | 7.2 | 7.6 | 0.30 | 0.98 | 0.321 | 0.320 | 1.005 | 0.507 | 734,1074 | 68 by 32 |
| 5009 | 14.5 | 0.70 | 0.70 | 1.00 | 0.97 | 0.97 | 0.134 | 2.54 | 1,0 | 6.9 | 7.2 | 0.31 | 0.96 | 0.315 | 0.315 | 1.000 | 0.497 | 746,1046 | 100 by 68 |
| 5009 + 1/2 | 14.6 | 0.69 | 0.69 | 1.00 | 0.98 | 0.98 | 0.139 | 2.95 | 1,0 | 6.5 | 6.8 | 0.29 | 0.98 | 0.310 | 0.310 | 0.999 | 0.485 | 282,150 | 56 by 56 |
| 5010 | 13.8 | 0.67 | 0.68 | 0.99 | 1.02 | 0.99 | 0.119 | 3.07 | 1,0 | 6.0 | 6.4 | 0.30 | 0.96 | 0.304 | 0.307 | 0.992 | 0.472 | 6,506 | 20 by 56 |
| 5010 + 1/2 | 13.2 | 0.67 | 0.67 | 0.99 | 0.99 | 0.99 | 0.123 | 2.92 | 1,0 | 5.7 | 6.0 | 0.29 | 0.99 | 0.304 | 0.304 | 1.001 | 0.458 | 6,602 | 24 by 100 |
| 5011 | 12.8 | 0.67 | 0.66 | 1.02 | 1.00 | 1.00 | 0.146 | 2.48 | 9,7 | 5.3 | 5.7 | 0.29 | 0.99 | 0.303 | 0.301 | 1.006 | 0.442 | 6,630 | 44 by 72 |
| 5011 + 1/2 | 12.0 | 0.66 | 0.66 | 0.99 | 0.97 | 0.97 | 0.126 | 1.89 | 2,0 | 4.9 | 5.3 | 0.28 | 0.98 | 0.299 | 0.298 | 1.003 | 0.423 | 594,1074 | 56 by 32 |
| 5012 | 11.1 | 0.65 | 0.65 | 1.00 | 0.97 | 0.97 | 0.109 | 2.05 | 2,0 | 4.6 | 4.9 | 0.27 | 1.00 | 0.293 | 0.293 | 1.000 | 0.404 | 82,634 | 48 by 96 |
| 5012 + 1/2 | 10.9 | 0.65 | 0.65 | 1.01 | 0.97 | 0.97 | 0.075 | 2.32 | 0,6 | 4.4 | 4.6 | 0.26 | 1.01 | 0.286 | 0.289 | 0.989 | 0.385 | 122,526 | 56 by 164 |
| 5013 | 10.2 | 0.64 | 0.64 | 0.99 | 1.00 | 0.99 | 0.077 | 2.73 | 0,5 | 4.1 | 4.4 | 0.25 | 1.01 | 0.286 | 0.283 | 1.012 | 0.367 | 126,590 | 52 by 92 |
| 5013 + 1/2 | 9.2 | 0.64 | 0.64 | 1.00 | 1.08 | 1.00 | 0.034 | 3.70 | 0,5 | 3.8 | 4.1 | 0.24 | 1.02 | 0.279 | 0.283 | 0.987 | 0.350 | 166,506 | 48 by 96 |
| 5014 | 9.0 | 0.63 | 0.64 | 1.00 | 1.03 | 1.00 | 0.051 | 3.07 | 0,5 | 3.6 | 3.8 | 0.23 | 1.04 | 0.279 | 0.280 | 1.000 | 0.336 | 174,558 | 48 by 108 |
| 5014 + 1/2 | 8.2 | 0.63 | 0.63 | 1.00 | 0.96 | 0.96 | 0.095 | 3.82 | 0,4 | 3.2 | 3.5 | 0.23 | 1.02 | 0.277 | 0.279 | 0.990 | 0.322 | 182,582 | 48 by 68 |
| 5015 | 7.6 | 0.63 | 0.62 | 1.01 | 0.99 | 0.99 | 0.083 | 2.53 | 0,4 | 3.0 | 3.2 | 0.22 | 1.04 | 0.280 | 0.276 | 1.014 | 0.310 | 250,346 | 120 by 180 |
| 5015 + 1/2 | 7.0 | 0.61 | 0.62 | 0.99 | 1.04 | 0.99 | 0.035 | 2.32 | 6,8 | 2.7 | 2.9 | 0.21 | 1.02 | 0.276 | 0.276 | 0.999 | 0.298 | 194,574 | 60 by 104 |
| 5016 | 6.5 | 0.61 | 0.61 | 1.00 | 0.98 | 0.98 | 0.065 | 2.38 | 6,8 | 2.5 | 2.6 | 0.21 | 1.01 | 0.274 | 0.276 | 0.991 | 0.288 | 770,310 | 80 by 64 |
| 5016 + 1/2 | 6.0 | 0.60 | 0.60 | 1.00 | 0.98 | 0.98 | 0.059 | 2.32 | 5,8 | 2.3 | 2.6 | 0.21 | 1.02 | 0.275 | 0.275 | 1.003 | 0.278 | 250,478 | 76 by 92 |
| 5017 | 5.0 | 0.60 | 0.59 | 1.01 | 1.04 | 1.01 | 0.029 | 2.59 | 2,6 | 2.0 | 2.2 | 0.21 | 1.01 | 0.277 | 0.273 | 1.013 | 0.269 | 242,554 | 60 by 72 |
| 5017 + 1/2 | 4.6 | 0.59 | 0.59 | 1.00 | 1.07 | 1.00 | 0.010 | 2.92 | 2,6 | 1.7 | 1.9 | 0.20 | 0.99 | 0.273 | 0.274 | 0.995 | 0.261 | 262,546 | 44 by 104 |
| 5018 | 4.1 | 0.59 | 0.58 | 1.01 | 1.08 | 1.01 | 0.014 | 3.14 | 2,6 | 1.6 | 1.7 | 0.20 | 1.00 | 0.273 | 0.272 | 1.001 | 0.254 | 282,494 | 72 by 100 |
| 5018 + 1/2 | 3.6 | 0.57 | 0.57 | 1.00 | 1.06 | 1.00 | 0.005 | 2.48 | 1,3 | 1.4 | 1.6 | 0.19 | 1.00 | 0.272 | 0.271 | 1.004 | 0.248 | 922,738 | 260 by 240 |
| 5019 | 3.2 | 0.56 | 0.55 | 1.01 | 1.05 | 1.01 | 0.008 | 2.39 | 2,1 | 1.4 | 1.6 | 0.18 | 1.01 | 0.270 | 0.268 | 1.006 | 0.242 | 950,714 | 328 by 252 |
| 5019 + 1/2 | 2.8 | 0.54 | 0.54 | 0.99 | 1.01 | 0.99 | 0.009 | 2.82 | 1,4 | 1.6 | 1.9 | 0.18 | 1.00 | 0.264 | 0.263 | 1.002 | 0.237 | 302,522 | 64 by 108 |
| 5020 | 2.4 | 0.52 | 0.52 | 0.99 | 0.99 | 0.99 | 0.008 | 2.70 | 1,4 | 2.0 | 2.5 | 0.17 | 1.00 | 0.256 | 0.260 | 0.987 | 0.232 | 582,206 | 80 by 76 |
| 5020 + 1/2 | 2.0 | 0.49 | 0.53 | 0.93 | 0.94 | 0.93 | 0.008 | 2.21 | 1,4 | 2.5 | 3.0 | 0.16 | 0.93 | 0.255 | 0.256 | 0.995 | 0.228 | 310,522 | 60 by 152 |
| 5021 | 1.6 | 0.47 | 0.53 | 0.90 | 0.90 | 0.90 | 0.016 | 1.85 | 2,2 | 3.0 | 3.7 | 0.16 | 0.85 | 0.256 | 0.253 | 1.011 | 0.225 | 314,534 | 56 by 100 |
| 5021 + 1/2 | 1.4 | 0.45 | 0.53 | 0.85 | 0.86 | 0.85 | 0.000 | 1.87 | 2,2 | 3.6 | 4.4 | 0.16 | 0.77 | 0.251 | 0.253 | 0.991 | 0.222 | 342,370 | 72 by 64 |
| 5022 | 1.2 | 0.42 | 0.53 | 0.79 | 0.79 | 0.79 | 0.009 | 1.58 | 2,2 | 4.6 | 5.2 | 0.15 | 0.72 | 0.251 | 0.250 | 1.004 | 0.219 | 306,518 | 76 by 132 |
| 5022 + 1/2 | 0.8 | 0.38 | 0.53 | 0.71 | 0.71 | 0.71 | 0.009 | 1.36 | 2,2 | 5.5 | 6.2 | 0.15 | 0.65 | 0.250 | 0.250 | 0.999 | 0.217 | 330,526 | 60 by 116 |
| 5023 | 0.7 | 0.34 | 0.53 | 0.64 | 0.64 | 0.64 | 0.005 | 1.12 | 2,3 | 6.6 | 7.1 | 0.15 | 0.60 | 0.248 | 0.249 | 0.992 | 0.215 | 722,190 | 96 by 152 |
| 5023 + 1/2 | 0.6 | 0.30 | 0.53 | 0.57 | 0.57 | 0.57 | 0.006 | 1.06 | 12,3 | 7.7 | 8.1 | 0.15 | 0.55 | 0.249 | 0.247 | 0.994 | 0.215 | 330,526 | 88 by 136 |
| 5024 | 0.6 | 0.28 | 0.53 | 0.54 | 0.54 | 0.54 | 0.001 | 1.02 | 13,8 | 9.0 | 9.3 | 0.15 | 0.56 | 0.246 | 0.248 | 0.984 | 0.214 | 814,422 | 204 by 168 |
| 5024 + 1/2 | 0.7 | 0.30 | 0.53 | 0.57 | 0.57 | 0.57 | 0.013 | 1.05 | 14,0 | 10.2 | 10.5 | 0.15 | 0.64 | 0.245 | 0.248 | 0.979 | 0.214 | 602,762 | 212 by 236 |
| 5025 | 1.0 | 0.32 | 0.53 | 0.61 | 0.61 | 0.61 | 0.007 | 1.13 | 13,1 | 11.4 | 11.8 | 0.15 | 0.74 | 0.247 | 0.249 | 0.989 | 0.214 | 766,258 | 64 by 68 |
| 5025 + 1/2 | 1.0 | 0.35 | 0.53 | 0.67 | 0.67 | 0.67 | 0.002 | 1.20 | 15,0 | 12.7 | 13.1 | 0.15 | 0.82 | 0.252 | 0.252 | 0.999 | 0.214 | 870,222 | 136 by 140 |
| 5026 | 1.3 | 0.38 | 0.53 | 0.72 | 0.73 | 0.72 | 0.007 | 1.18 | 15,6 | 13.9 | 14.4 | 0.15 | 0.90 | 0.258 | 0.261 | 0.988 | 0.213 | 870,418 | 88 by 108 |
| 5026 + 1/2 | 1.7 | 0.41 | 0.53 | 0.78 | 0.78 | 0.78 | 0.016 | 1.23 | 12,2 | 15.2 | 15.7 | 0.15 | 0.93 | 0.269 | 0.269 | 1.002 | 0.213 | 718,138 | 148 by 172 |
| 5027 | 1.9 | 0.44 | 0.53 | 0.84 | 0.84 | 0.84 | 0.009 | 1.24 | 15,7 | 16.4 | 16.9 | 0.15 | 0.95 | 0.280 | 0.280 | 0.999 | 0.213 | 874,234 | 72 by 60 |
| 5027 + 1/2 | 2.2 | 0.48 | 0.53 | 0.91 | 0.91 | 0.91 | 0.017 | 1.30 | 15,7 | 17.6 | 18.2 | 0.16 | 0.96 | 0.291 | 0.291 | 0.999 | 0.213 | 990,346 | 68 by 112 |
| 5028 | 2.6 | 0.51 | 0.53 | 0.97 | 0.97 | 0.97 | 0.005 | 1.25 | 14,2 | 18.8 | 19.4 | 0.16 | 0.96 | 0.302 | 0.304 | 0.992 | 0.212 | 902,354 | 148 by 136 |
| 5028 + 1/2 | 2.8 | 0.54 | 0.54 | 1.00 | 0.99 | 0.99 | 0.014 | 1.48 | 11,8 | 19.9 | 20.6 | 0.16 | 1.00 | 0.318 | 0.318 | 1.000 | 0.212 | 298,486 | 48 by 64 |
| 5029 | 3.3 | 0.57 | 0.57 | 1.01 | 1.01 | 1.01 | 0.009 | 1.45 | 10,2 |  |  |  | 1.00 | 0.334 | 0.335 | 0.999 | 0.212 | 510,310 | 196 by 208 |
| 5029 + 1/2 | 3.6 | 0.59 | 0.60 | 1.00 | 0.99 | 0.99 | 0.021 | 1.43 | 10,2 |  |  |  | 1.02 | 0.352 | 0.349 | 1.009 | 0.211 | 626,402 | 88 by 80 |
| 5030 | 3.8 | 0.62 | 0.62 | 1.01 | 1.01 | 1.01 | 0.008 | 1.38 | 10,2 |  |  |  | 1.03 | 0.363 | 0.369 | 0.983 | 0.211 | 562,234 | 92 by 64 |
| 5030 + 1/2 | 4.3 | 0.64 | 0.64 | 1.00 | 1.00 | 1.00 | 0.006 | 1.56 | 10,2 |  |  |  | 1.02 | 0.387 | 0.380 | 1.018 | 0.211 | 890,358 | 148 by 132 |
| 5031 | 4.6 | 0.66 | 0.66 | 1.00 | 1.00 | 1.00 | 0.007 | 1.53 | 1,8 |  |  |  | 1.02 | 0.397 | 0.402 | 0.986 | 0.210 | 438,386 | 60 by 60 |
| 5031 + 1/2 | 4.9 | 0.69 | 0.68 | 1.01 | 1.01 | 1.01 | 0.006 | 1.58 | 1,8 |  |  |  | 0.99 | 0.418 | 0.416 | 1.005 | 0.210 | 494,314 | 172 by 128 |
| 5032 | 5.2 | 0.69 | 0.70 | 1.00 | 1.00 | 1.00 | 0.004 | 1.63 | 1,8 |  |  |  | 0.97 | 0.435 | 0.435 | 1.001 | 0.209 | 314,418 | 88 by 152 |
| 5032 + 1/2 | 5.4 | 0.71 | 0.71 | 1.00 | 1.00 | 1.00 | 0.004 | 1.75 | 1,8 |  |  |  | 0.97 | 0.452 | 0.450 | 1.004 | 0.209 | 654,326 | 196 by 208 |
| 5033 | 5.9 | 0.72 | 0.72 | 1.01 | 1.01 | 1.01 | 0.002 | 1.70 | 8,0 |  |  |  | 1.01 | 0.465 | 0.469 | 0.993 | 0.208 | 882,238 | 120 by 92 |
| 5033 + 1/2 | 6.1 | 0.73 | 0.73 | 0.99 | 1.01 | 0.99 | 0.001 | 1.69 | 8,0 |  |  |  | 1.01 | 0.486 | 0.482 | 1.008 | 0.208 | 442,410 | 72 by 68 |
| 5034 | 6.2 | 0.74 | 0.73 | 1.01 | 1.02 | 1.01 | 0.000 | 1.67 | 8,0 |  |  |  | 1.04 | 0.498 | 0.499 | 0.998 | 0.207 | 762,350 | 68 by 60 |
| 5034 + 1/2 | 6.7 | 0.74 | 0.74 | 1.00 | 1.02 | 1.00 | 0.003 | 1.64 | 1,8 |  |  |  | 1.05 | 0.512 | 0.513 | 0.998 | 0.206 | 826,250 | 64 by 60 |
| 5035 | 6.9 | 0.75 | 0.74 | 1.01 | 1.04 | 1.01 | 0.002 | 1.58 | 8,0 |  |  |  | 1.04 | 0.529 | 0.527 | 1.003 | 0.206 | 778,330 | 100 by 108 |
| 5035 + 1/2 | 7.2 | 0.76 | 0.75 | 1.01 | 1.04 | 1.01 | 0.015 | 1.44 | 8,0 |  |  |  | 1.05 | 0.541 | 0.541 | 1.001 | 0.205 | 698,418 | 72 by 64 |
| 5036 | 7.5 | 0.75 | 0.75 | 1.00 | 1.02 | 1.00 | 0.015 | 1.41 | 6,7 |  |  |  | 1.03 | 0.553 | 0.556 | 0.994 | 0.204 | 790,262 | 72 by 104 |
| 5036 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

## place

### dive (neptune.dive, T at 4758, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

### rise (neptune.rise, T at 4956, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 2x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 41.87, uhd 143.86.

Largest mean difference: 1.315 at frame 4748 (neptune.dive), limit 12.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 0.168 at frame 4605 (neptune.hold), limit 3.2.
Largest level difference of one block (a grid of 16 by 9): -0.417 at frame 5006 (neptune.rise), limit 12.
Largest level difference of the whole frame: -0.049 at frame 4605 (neptune.hold), limit 2.2.
Picture: out/work/smooth/neptune-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 4605 | neptune.hold | 1.156 | 4.3 | 123 | -0.049 | -0.056 | 0.168 | 5.98 | -0.332 | 10,5 | 1.256 |
| 4703 | neptune.dive | 1.184 | 4.2 | 40 | -0.046 | -0.050 | 0.158 | 1.80 | -0.187 | 9,6 | 1.393 |
| 4725 | neptune.dive | 1.195 | 3.8 | 46 | -0.012 | -0.014 | 0.150 | 2.74 | -0.073 | 5,1 | 1.496 |
| 4748 | neptune.dive | 1.315 | 5.6 | 60 | -0.013 | -0.014 | 0.165 | 3.52 | -0.203 | 9,0 | 1.541 |
| 4860 | neptune.terrain | 1.315 | 6.0 | 69 | -0.016 | -0.017 | 0.167 | 5.49 | -0.171 | 8,1 | 1.531 |
| 4969 | neptune.rise | 1.267 | 5.1 | 65 | -0.005 | -0.007 | 0.159 | 2.91 | 0.143 | 15,4 | 1.551 |
| 4988 | neptune.rise | 1.160 | 3.7 | 46 | -0.011 | -0.012 | 0.145 | 1.44 | 0.097 | 15,7 | 1.623 |
| 5006 | neptune.rise | 1.156 | 4.2 | 125 | -0.026 | -0.029 | 0.155 | 10.66 | -0.417 | 6,2 | 1.493 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.

## counts

Film frames 4530 to 5024 in order on one fresh page, 990 pictures at rate 2, tier draft at preview, 13333 s. Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): 0 warm draws. Its work counts for that picture and stands in brackets. Judged: dive, rise and travel, every picture.

- RED counts: neptune.dive makes 1 programs, 0 texture uploads and 10 buffers in 2 of its 180 pictures, first at frame 4696, most at frame 4696 (1, 0, 5), limit 0, 0, 0 a picture
- RED counts: neptune.rise makes 3 programs, 0 texture uploads and 15 buffers in 1 of its 150 pictures, first at frame 4950, most at frame 4950 (3, 0, 15), limit 0, 0, 0 a picture

| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |
|---|---|---|---|---|---|---|---|
| neptune.hold | no | 300 | 2 | 4530 | 11 | 76 | 49 |
| neptune.dive | yes | 180 | 2 | 4696 | 1 | 0 | 10 |
| neptune.terrain | no | 360 | 0 |  | 0 | 0 | 0 |
| neptune.rise | yes | 150 | 1 | 4950 | 3 | 0 | 15 |

Every picture with work (of the warm start call in brackets):

| frame | segment | programs | texture uploads | buffers | warm draws |
|---|---|---|---|---|---|
| 4530 | neptune.hold | 11 | 75 (54) | 48 |  |
| 4530 + 1/2 | neptune.hold | 0 | 1 | 1 |  |
| 4696 | neptune.dive | 1 | 0 | 5 |  |
| 4758 | neptune.dive | 0 | 0 | 5 |  |
| 4950 | neptune.rise | 3 | 0 | 15 |  |
