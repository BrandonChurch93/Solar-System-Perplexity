# smooth: uranus

Commit 262b9a68df0a6bda8d77518539580de554bb0dc5. Capture rate 2. Parts: path, pictures, place, parity, counts.

Joined from the files of 1 machine(s), nothing is rendered, measured or counted here. The path: /home/user/workspace/work/p6/hu9/05/uranus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The pictures: the dive /home/user/workspace/work/p6/hu9/01/uranus-dive-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hu9/02/uranus-dive-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz); the rise /home/user/workspace/work/p6/hu9/03/uranus-rise-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hu9/04/uranus-rise-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The place: /home/user/workspace/work/p6/hu9/05/uranus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The parity: /home/user/workspace/work/p6/hu9/05/uranus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The counts: /home/user/workspace/work/p6/hu9/06/uranus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

VERDICT: red. 2 numbers over the limit or not measured.

VERDICT BESIDE IT, the pictures read with the carry at the full size (the verdict above is the one that counts and makes the exit code): red. 3 numbers over the limit or not measured.

GROUND POP BESIDE IT, a number without a limit that makes no verdict (1.3 is named as the limit to come), read with the carry at the full size on the ground both frames show: largest 1.081 from frame 4458 to the next, most at pixel 1198, 450, a patch of 80 by 76 px; 0 of 424 rows read over 1.3 (pictures of the rise). It is not the line "The ground beside it" of the pictures: that line gives the change in place and the pattern on the surface view before a rise or after a dive, this number is read on the globe's ground through the move itself. Ground pop NOT READ on 2 of 426 rows, which says nothing of them, quiet or not: frame 4211 + 1/2: the last frame of the window, no next frame to carry onto it; frame 4466 + 1/2: the last frame of the window, no next frame to carry onto it.

## path

### dive (uranus.dive, frames 4110 to 4199, T at 4186, window 4098 to 4211)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.064 log of the height a film frame | 1.408 | 4177 | 0.068 | 4197 |  |  | 0.005 | 0.023 | 0.000 | 0.000 | 0.000 at 4211 |
| whole frames | turn | 1.425 degrees a film frame | 1.655 | 4137 | 0.071 | 4115 |  |  | 0.007 | 0.005 | 0.000 | 0.009 | 0.000 at 4099 |
| whole frames | speed | 4.428 px a film frame at the place | 1.739 | 4140 | 0.071 over 8 | 4119 |  |  | 0.001 | 0.003 | 0.000 | 0.019 over 6 | 0.002 at 4209 |
| rate 2 | rate | 0.06365 log of the height a film frame | 1.415 | 4177 | 0.069 | 4197 + 1/2 | 0.034 | 4197 + 1/2 | 0.006 | 0.019 | 0.000 | 0.000 | 0.000 at 4211 + 1/2 |
| rate 2 | turn | 1.418 degrees a film frame | 1.665 | 4137 | 0.071 | 4114 | 0.036 | 4114 | 0.009 | 0.004 | 0.000 | 0.013 | 0.000 at 4099 |
| rate 2 | speed | 4.442 px a film frame at the place | 1.762 | 4140 | 0.072 over 8 | 4119 | 0.036 over 8 | 4118 + 1/2 | 0.001 | 0.003 | 0.000 over 7 | 0.020 over 6 | 0.002 at 4209 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 6, rate 2 6.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 4200, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.0179 of its height a film frame, the mean of its first 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 1.00 at frame 4200 + 1/2, limit 0.87; inside the dive itself 1.00 at frame 4200. Largest step from one capture frame to the next 0.24 at frame 4198, shown. The part along the surface view's own direction of motion: 1.00 at the lowest, lowest 1.00 at frame 4200 + 1/2, shown; under 0 the eye goes back.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4098 | hold orbit | 4.611e+0 | 0.004 |  |  | 0.027 |  |  | 0.097 |  |  | 0 |
| 4099 | hold orbit | 4.609e+0 | 0.004 | 0.000 | 0.000 | 0.027 | 0.000 | 0.000 | 0.098 | 0.001 | 0.001 | 8 |
| 4100 | hold orbit | 4.608e+0 | 0.004 | 0.000 | 0.000 | 0.027 | 0.000 | 0.000 | 0.099 | 0.001 | 0.001 | 8 |
| 4101 | hold orbit | 4.607e+0 | 0.004 | 0.000 | 0.000 | 0.027 | 0.000 | 0.000 | 0.099 | 0.001 | 0.001 | 8 |
| 4102 | hold orbit | 4.606e+0 | 0.004 | 0.000 | 0.000 | 0.027 | 0.000 | 0.000 | 0.100 | 0.001 | 0.001 | 8 |
| 4103 | hold orbit | 4.605e+0 | 0.004 | 0.000 | 0.000 | 0.027 | 0.000 | 0.000 | 0.101 | 0.001 | 0.001 | 8 |
| 4104 | hold orbit | 4.604e+0 | 0.004 | 0.000 | 0.000 | 0.027 | 0.000 | 0.000 | 0.102 | 0.001 | 0.001 | 8 |
| 4105 | hold orbit | 4.603e+0 | 0.004 | 0.000 | 0.000 | 0.027 | 0.000 | 0.000 | 0.102 | 0.001 | 0.001 | 8 |
| 4106 | hold orbit | 4.601e+0 | 0.004 | 0.000 | 0.000 | 0.027 | 0.000 | 0.000 | 0.103 | 0.001 | 0.001 | 8 |
| 4107 | hold orbit | 4.600e+0 | 0.004 | 0.000 | 0.000 | 0.026 | 0.000 | 0.000 | 0.104 | 0.001 | 0.001 | 8 |
| 4108 | hold orbit | 4.599e+0 | 0.004 | 0.000 | 0.000 | 0.026 | 0.000 | 0.000 | 0.105 | 0.001 | 0.001 | 8 |
| 4109 | hold orbit | 4.598e+0 | 0.004 | 0.000 | 0.000 | 0.026 | 0.000 | 0.000 | 0.105 | 0.001 | 0.001 | 8 |
| 4110 first | dive orbit | 4.597e+0 | 0.004 | 0.000 | 0.001 | 0.026 | 0.000 | 0.002 | 0.106 | 0.001 | 0.001 | 8 |
| 4111 | dive orbit | 4.594e+0 | 0.009 | 0.005 | 0.014 | 0.034 | 0.007 | 0.021 | 0.106 | 0.000 | 0.000 | 8 |
| 4112 | dive orbit | 4.585e+0 | 0.030 | 0.021 | 0.031 | 0.065 | 0.031 | 0.049 | 0.108 | 0.002 | 0.008 | 8 |
| 4113 | dive orbit | 4.566e+0 | 0.067 | 0.037 | 0.047 | 0.123 | 0.058 | 0.070 | 0.131 | 0.023 | 0.051 | 8 |
| 4114 | dive orbit | 4.532e+0 | 0.116 | 0.049 | 0.051 | 0.194 | 0.071 | 0.071 | 0.191 | 0.060 | 0.066 | 8 |
| 4115 | dive orbit | 4.484e+0 | 0.166 | 0.050 | 0.051 | 0.265 | 0.071 | 0.071 | 0.258 | 0.068 | 0.070 | 8 |
| 4116 | dive orbit | 4.423e+0 | 0.217 | 0.050 | 0.051 | 0.335 | 0.070 | 0.070 | 0.328 | 0.070 | 0.071 | 8 |
| 4117 | dive orbit | 4.348e+0 | 0.267 | 0.050 | 0.051 | 0.404 | 0.069 | 0.070 | 0.399 | 0.071 | 0.071 | 8 |
| 4118 | dive orbit | 4.260e+0 | 0.318 | 0.051 | 0.051 | 0.473 | 0.069 | 0.069 | 0.470 | 0.071 | 0.072 | 8 |
| 4119 | dive orbit | 4.161e+0 | 0.368 | 0.051 | 0.051 | 0.541 | 0.068 | 0.068 | 0.541 | 0.071 | 0.072 | 8 |
| 4120 | dive orbit | 4.051e+0 | 0.419 | 0.051 | 0.051 | 0.609 | 0.068 | 0.068 | 0.612 | 0.071 | 0.071 | 8 |
| 4121 | dive orbit | 3.931e+0 | 0.469 | 0.051 | 0.051 | 0.677 | 0.068 | 0.068 | 0.682 | 0.070 | 0.070 | 8 |
| 4122 | dive orbit | 3.803e+0 | 0.520 | 0.051 | 0.051 | 0.744 | 0.068 | 0.068 | 0.751 | 0.069 | 0.070 | 8 |
| 4123 | dive orbit | 3.666e+0 | 0.570 | 0.051 | 0.051 | 0.811 | 0.067 | 0.068 | 0.819 | 0.068 | 0.069 | 8 |
| 4124 | dive orbit | 3.523e+0 | 0.621 | 0.051 | 0.051 | 0.879 | 0.067 | 0.067 | 0.886 | 0.067 | 0.068 | 8 |
| 4125 | dive orbit | 3.375e+0 | 0.672 | 0.051 | 0.051 | 0.946 | 0.067 | 0.067 | 0.953 | 0.066 | 0.067 | 8 |
| 4126 | dive orbit | 3.223e+0 | 0.722 | 0.051 | 0.051 | 1.012 | 0.067 | 0.067 | 1.018 | 0.065 | 0.066 | 8 |
| 4127 | dive orbit | 3.067e+0 | 0.773 | 0.051 | 0.051 | 1.079 | 0.067 | 0.067 | 1.082 | 0.064 | 0.065 | 8 |
| 4128 | dive orbit | 2.910e+0 | 0.823 | 0.051 | 0.051 | 1.145 | 0.066 | 0.067 | 1.146 | 0.063 | 0.064 | 8 |
| 4129 | dive orbit | 2.751e+0 | 0.874 | 0.051 | 0.051 | 1.211 | 0.066 | 0.067 | 1.208 | 0.062 | 0.063 | 8 |
| 4130 | dive orbit | 2.593e+0 | 0.925 | 0.051 | 0.051 | 1.277 | 0.066 | 0.066 | 1.268 | 0.061 | 0.062 | 8 |
| 4131 | dive orbit | 2.436e+0 | 0.975 | 0.051 | 0.051 | 1.343 | 0.066 | 0.066 | 1.327 | 0.059 | 0.060 | 8 |
| 4132 | dive orbit | 2.281e+0 | 1.026 | 0.051 | 0.051 | 1.409 | 0.066 | 0.066 | 1.385 | 0.057 | 0.058 | 8 |
| 4133 | dive orbit | 2.130e+0 | 1.077 | 0.051 | 0.051 | 1.474 | 0.065 | 0.066 | 1.440 | 0.056 | 0.057 | 8 |
| 4134 | dive orbit | 1.981e+0 | 1.128 | 0.051 | 0.051 | 1.539 | 0.065 | 0.066 | 1.494 | 0.053 | 0.054 | 8 |
| 4135 | dive orbit | 1.837e+0 | 1.178 | 0.051 | 0.051 | 1.601 | 0.061 | 0.061 | 1.545 | 0.051 | 0.052 | 8 |
| 4136 | dive orbit | 1.698e+0 | 1.229 | 0.051 | 0.051 | 1.641 | 0.040 | 0.037 | 1.594 | 0.049 | 0.050 | 8 |
| 4137 | dive orbit | 1.565e+0 | 1.280 | 0.051 | 0.051 | 1.655 | 0.014 | 0.011 | 1.643 | 0.048 | 0.049 | 8 |
| 4138 | dive orbit | 1.437e+0 | 1.330 | 0.050 | 0.050 | 1.652 | 0.003 | 0.005 | 1.690 | 0.047 | 0.048 | 8 |
| 4139 | dive orbit | 1.317e+0 | 1.370 | 0.040 | 0.039 | 1.647 | 0.005 | 0.005 | 1.725 | 0.035 | 0.033 | 8 |
| 4140 | dive orbit | 1.204e+0 | 1.394 | 0.024 | 0.022 | 1.642 | 0.005 | 0.005 | 1.739 | 0.015 | 0.012 | 8 |
| 4141 | dive orbit | 1.101e+0 | 1.402 | 0.008 | 0.006 | 1.636 | 0.006 | 0.006 | 1.735 | 0.004 | 0.013 | 8 |
| 4142 | dive orbit | 1.006e+0 | 1.402 | 0.000 | 0.000 | 1.630 | 0.006 | 0.006 | 1.722 | 0.013 | 0.015 | 8 |
| 4143 | dive orbit | 9.199e-1 | 1.403 | 0.000 | 0.000 | 1.625 | 0.006 | 0.006 | 1.708 | 0.014 | 0.016 | 8 |
| 4144 | dive orbit | 8.409e-1 | 1.403 | 0.000 | 0.000 | 1.619 | 0.006 | 0.006 | 1.694 | 0.014 | 0.016 | 8 |
| 4145 | dive orbit | 7.687e-1 | 1.403 | 0.000 | 0.000 | 1.613 | 0.006 | 0.006 | 1.679 | 0.014 | 0.016 | 8 |
| 4146 | dive orbit | 7.027e-1 | 1.403 | 0.000 | 0.000 | 1.607 | 0.006 | 0.006 | 1.665 | 0.014 | 0.016 | 8 |
| 4147 | dive orbit | 6.423e-1 | 1.403 | 0.000 | 0.000 | 1.601 | 0.006 | 0.006 | 1.651 | 0.014 | 0.016 | 8 |
| 4148 | dive orbit | 5.872e-1 | 1.404 | 0.000 | 0.000 | 1.595 | 0.006 | 0.006 | 1.637 | 0.014 | 0.015 | 8 |
| 4149 | dive orbit | 5.367e-1 | 1.404 | 0.000 | 0.000 | 1.589 | 0.006 | 0.006 | 1.624 | 0.013 | 0.014 | 8 |
| 4150 | dive orbit | 4.906e-1 | 1.404 | 0.000 | 0.000 | 1.583 | 0.006 | 0.006 | 1.613 | 0.011 | 0.013 | 8 |
| 4151 | dive orbit | 4.484e-1 | 1.404 | 0.000 | 0.000 | 1.577 | 0.006 | 0.006 | 1.603 | 0.010 | 0.012 | 8 |
| 4152 | dive orbit | 4.099e-1 | 1.404 | 0.000 | 0.000 | 1.571 | 0.006 | 0.006 | 1.594 | 0.009 | 0.011 | 8 |
| 4153 | dive orbit | 3.746e-1 | 1.404 | 0.000 | 0.000 | 1.566 | 0.006 | 0.006 | 1.585 | 0.009 | 0.010 | 8 |
| 4154 | dive orbit | 3.424e-1 | 1.405 | 0.000 | 0.000 | 1.560 | 0.006 | 0.006 | 1.575 | 0.009 | 0.011 | 8 |
| 4155 | dive orbit | 3.130e-1 | 1.405 | 0.000 | 0.000 | 1.554 | 0.006 | 0.006 | 1.565 | 0.011 | 0.013 | 8 |
| 4156 | dive orbit | 2.861e-1 | 1.405 | 0.000 | 0.000 | 1.549 | 0.005 | 0.005 | 1.552 | 0.013 | 0.018 | 8 |
| 4157 | dive orbit | 2.615e-1 | 1.405 | 0.000 | 0.000 | 1.545 | 0.004 | 0.004 | 1.531 | 0.021 | 0.027 | 8 |
| 4158 | dive orbit | 2.390e-1 | 1.405 | 0.000 | 0.000 | 1.541 | 0.004 | 0.004 | 1.501 | 0.030 | 0.036 | 8 |
| 4159 | dive orbit | 2.184e-1 | 1.405 | 0.000 | 0.000 | 1.535 | 0.006 | 0.010 | 1.463 | 0.038 | 0.043 | 8 |
| 4160 | dive orbit | 1.996e-1 | 1.406 | 0.000 | 0.000 | 1.523 | 0.011 | 0.015 | 1.417 | 0.046 | 0.050 | 8 |
| 4161 | dive orbit | 1.825e-1 | 1.406 | 0.000 | 0.000 | 1.507 | 0.017 | 0.020 | 1.367 | 0.050 | 0.051 | 8 |
| 4162 | dive orbit | 1.668e-1 | 1.406 | 0.000 | 0.000 | 1.484 | 0.022 | 0.025 | 1.316 | 0.051 | 0.051 | 8 |
| 4163 | dive orbit | 1.524e-1 | 1.406 | 0.000 | 0.000 | 1.459 | 0.025 | 0.026 | 1.265 | 0.051 | 0.052 | 8 |
| 4164 | dive orbit | 1.393e-1 | 1.406 | 0.000 | 0.000 | 1.434 | 0.024 | 0.024 | 1.213 | 0.052 | 0.053 | 8 |
| 4165 | dive orbit | 1.273e-1 | 1.406 | 0.000 | 0.000 | 1.409 | 0.026 | 0.029 | 1.158 | 0.055 | 0.061 | 8 |
| 4166 | dive orbit | 1.163e-1 | 1.406 | 0.000 | 0.000 | 1.377 | 0.032 | 0.036 | 1.093 | 0.065 | 0.069 | 8 |
| 4167 | dive orbit | 1.063e-1 | 1.406 | 0.000 | 0.000 | 1.338 | 0.039 | 0.043 | 1.023 | 0.069 | 0.069 | 8 |
| 4168 | dive orbit | 9.718e-2 | 1.407 | 0.000 | 0.000 | 1.295 | 0.043 | 0.044 | 0.965 | 0.059 | 0.055 | 8 |
| 4169 | dive orbit | 8.882e-2 | 1.407 | 0.000 | 0.000 | 1.251 | 0.044 | 0.044 | 0.929 | 0.036 | 0.033 | 8 |
| 4170 | dive orbit | 8.117e-2 | 1.407 | 0.000 | 0.000 | 1.208 | 0.044 | 0.044 | 0.905 | 0.024 | 0.023 | 8 |
| 4171 | dive orbit | 7.418e-2 | 1.407 | 0.000 | 0.000 | 1.163 | 0.044 | 0.045 | 0.887 | 0.018 | 0.017 | 8 |
| 4172 | dive orbit | 6.779e-2 | 1.407 | 0.000 | 0.000 | 1.119 | 0.044 | 0.045 | 0.873 | 0.014 | 0.014 | 8 |
| 4173 | dive orbit | 6.195e-2 | 1.407 | 0.000 | 0.000 | 1.074 | 0.045 | 0.045 | 0.862 | 0.011 | 0.011 | 8 |
| 4174 | dive orbit | 5.662e-2 | 1.407 | 0.000 | 0.000 | 1.029 | 0.045 | 0.045 | 0.854 | 0.008 | 0.008 | 8 |
| 4175 | dive orbit | 5.174e-2 | 1.407 | 0.000 | 0.000 | 0.984 | 0.045 | 0.045 | 0.848 | 0.006 | 0.006 | 8 |
| 4176 | dive orbit | 4.729e-2 | 1.407 | 0.000 | 0.000 | 0.939 | 0.045 | 0.046 | 0.844 | 0.003 | 0.003 | 8 |
| 4177 | dive orbit | 4.321e-2 | 1.408 | 0.000 | 0.001 | 0.894 | 0.046 | 0.046 | 0.843 | 0.001 | 0.001 | 8 |
| 4178 | dive orbit | 3.950e-2 | 1.402 | 0.005 | 0.019 | 0.847 | 0.046 | 0.047 | 0.841 | 0.002 | 0.006 | 8 |
| 4179 | dive orbit | 3.618e-2 | 1.372 | 0.031 | 0.050 | 0.800 | 0.048 | 0.049 | 0.831 | 0.010 | 0.018 | 8 |
| 4180 | dive orbit | 3.327e-2 | 1.313 | 0.058 | 0.068 | 0.750 | 0.050 | 0.051 | 0.810 | 0.021 | 0.026 | 8 |
| 4181 | dive orbit | 3.072e-2 | 1.245 | 0.068 | 0.069 | 0.700 | 0.050 | 0.051 | 0.784 | 0.026 | 0.028 | 8 |
| 4182 | dive orbit | 2.849e-2 | 1.177 | 0.068 | 0.069 | 0.649 | 0.050 | 0.051 | 0.756 | 0.028 | 0.030 | 8 |
| 4183 | dive orbit | 2.654e-2 | 1.109 | 0.068 | 0.069 | 0.599 | 0.050 | 0.051 | 0.726 | 0.030 | 0.031 | 8 |
| 4184 | dive orbit | 2.483e-2 | 1.040 | 0.068 | 0.069 | 0.548 | 0.050 | 0.051 | 0.694 | 0.031 | 0.033 | 8 |
| 4185 | dive orbit | 2.333e-2 | 0.972 | 0.068 | 0.069 | 0.498 | 0.050 | 0.050 | 0.661 | 0.033 | 0.034 | 8 |
| 4186 T | dive terrain | 2.202e-2 | 0.904 | 0.068 | 0.069 | 0.448 | 0.050 | 0.050 | 0.627 | 0.034 | 0.035 | 8 |
| 4187 | dive terrain | 2.087e-2 | 0.835 | 0.068 | 0.069 | 0.399 | 0.049 | 0.049 | 0.594 | 0.033 | 0.034 | 8 |
| 4188 | dive terrain | 1.987e-2 | 0.767 | 0.068 | 0.069 | 0.351 | 0.048 | 0.049 | 0.471 | 0.039 | 0.038 | 8 |
| 4189 | dive terrain | 1.901e-2 | 0.699 | 0.068 | 0.069 | 0.304 | 0.047 | 0.047 | 0.434 | 0.037 | 0.036 | 7 |
| 4190 | dive terrain | 1.825e-2 | 0.630 | 0.068 | 0.069 | 0.258 | 0.045 | 0.045 | 0.401 | 0.033 | 0.033 | 7 |
| 4191 | dive terrain | 1.761e-2 | 0.562 | 0.068 | 0.069 | 0.217 | 0.042 | 0.041 | 0.300 | 0.024 | 0.023 | 7 |
| 4192 | dive terrain | 1.706e-2 | 0.493 | 0.068 | 0.069 | 0.179 | 0.038 | 0.038 | 0.281 | 0.019 | 0.018 | 6 |
| 4193 | dive terrain | 1.660e-2 | 0.425 | 0.068 | 0.069 | 0.143 | 0.036 | 0.036 | 0.268 | 0.013 | 0.012 | 6 |
| 4194 | dive terrain | 1.623e-2 | 0.357 | 0.068 | 0.069 | 0.109 | 0.034 | 0.034 | 0.263 | 0.005 | 0.003 | 6 |
| 4195 | dive terrain | 1.593e-2 | 0.288 | 0.068 | 0.069 | 0.077 | 0.032 | 0.032 | 0.267 | 0.004 | 0.009 | 6 |
| 4196 | dive terrain | 1.571e-2 | 0.220 | 0.068 | 0.069 | 0.047 | 0.030 | 0.030 | 0.277 | 0.010 | 0.011 | 6 |
| 4197 | dive terrain | 1.556e-2 | 0.151 | 0.068 | 0.069 | 0.022 | 0.025 | 0.024 | 0.282 | 0.005 | 0.004 | 6 |
| 4198 | dive terrain | 1.547e-2 | 0.084 | 0.068 | 0.068 | 0.015 | 0.007 | 0.006 | 0.274 | 0.008 | 0.013 | 6 |
| 4199 last | dive terrain | 1.544e-2 | 0.032 | 0.052 | 0.049 | 0.024 | 0.009 | 0.009 | 0.264 | 0.011 | 0.010 | 6 |
| 4200 | terrain terrain | 1.544e-2 | 0.009 | 0.023 | 0.019 | 0.029 | 0.005 | 0.004 | 0.260 | 0.003 | 0.003 | 6 |
| 4201 | terrain terrain | 1.543e-2 | 0.007 | 0.002 | 0.001 | 0.030 | 0.000 | 0.000 | 0.261 | 0.001 | 0.001 | 6 |
| 4202 | terrain terrain | 1.542e-2 | 0.007 | 0.000 | 0.000 | 0.030 | 0.000 | 0.000 | 0.263 | 0.001 | 0.001 | 6 |
| 4203 | terrain terrain | 1.541e-2 | 0.007 | 0.000 | 0.000 | 0.030 | 0.000 | 0.000 | 0.264 | 0.001 | 0.002 | 6 |
| 4204 | terrain terrain | 1.541e-2 | 0.007 | 0.000 | 0.000 | 0.030 | 0.000 | 0.000 | 0.266 | 0.002 | 0.002 | 6 |
| 4205 | terrain terrain | 1.540e-2 | 0.006 | 0.000 | 0.000 | 0.030 | 0.000 | 0.000 | 0.267 | 0.002 | 0.002 | 6 |
| 4206 | terrain terrain | 1.540e-2 | 0.006 | 0.000 | 0.000 | 0.030 | 0.000 | 0.000 | 0.269 | 0.002 | 0.002 | 6 |
| 4207 | terrain terrain | 1.539e-2 | 0.006 | 0.000 | 0.000 | 0.030 | 0.000 | 0.000 | 0.271 | 0.002 | 0.002 | 6 |
| 4208 | terrain terrain | 1.538e-2 | 0.006 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.243 | 0.002 | 0.002 | 6 |
| 4209 | terrain terrain | 1.538e-2 | 0.006 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.245 | 0.002 | 0.002 | 7 |
| 4210 | terrain terrain | 1.537e-2 | 0.006 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.246 | 0.002 | 0.002 | 7 |
| 4211 | terrain terrain | 1.537e-2 | 0.006 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.248 | 0.002 | 0.002 | 7 |

### rise (uranus.rise, frames 4380 to 4454, T at 4391, window 4368 to 4466)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.07997 log of the height a film frame | 1.361 | 4407 | 0.064 | 4385 |  |  | 0.009 | 0.049 | 0.000 | 0.000 | 0.114 at 4465 |
| whole frames | turn | 1.717 degrees a film frame | 1.768 | 4417 | 0.074 | 4402 |  |  | 0.003 | 0.021 | 0.000 | 0.000 | 0.002 at 4466 |
| whole frames | speed | 5.697 px a film frame at the place | 1.629 | 4433 | 0.069 over 5 | 4384 |  |  |  | 0.023 | 0.019 over 8 | 0.000 | 5.299 at 4462 |
| rate 2 | rate | 0.07956 log of the height a film frame | 1.368 | 4406 + 1/2 | 0.064 | 4385 | 0.032 | 4385 | 0.011 | 0.050 | 0.000 | 0.000 | 0.117 at 4464 + 1/2 |
| rate 2 | turn | 1.706 degrees a film frame | 1.780 | 4417 + 1/2 | 0.075 | 4402 | 0.037 | 4401 + 1/2 | 0.003 | 0.018 | 0.000 | 0.000 | 0.005 at 4466 + 1/2 |
| rate 2 | speed | 5.659 px a film frame at the place | 1.605 | 4432 + 1/2 | 0.072 over 5 | 4384 | 0.036 over 5 | 4383 + 1/2 |  | 0.022 | 0.027 over 8 | 0.000 | 5.366 at 4462 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 5, rate 2 4.

Rows of the speed shown and not judged: whole frames 3 (frames 4379 to 4381), rate 2 7 (frames 4378 + 1/2 to 4381 + 1/2).

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 4380, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.0179 of its height a film frame, the mean of its last 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 0.98 at frame 4382, limit 0.87; inside the rise itself 0.98 at frame 4382. Largest step from one capture frame to the next 0.21 at frame 4395 + 1/2, shown. The part along the surface view's own direction of motion: 0.96 at the lowest, lowest -1.85 at frame 4395 + 1/2, shown; under 0 the eye goes back.

Rest between the rise and the travel (the seam into uranus.travel at film frame 4455, 12 film frames to each side, read at rate 2): a rise and the travel after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body's edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest 8.54 at frame 4457 + 1/2, against 26.18 at frame 4443 and 170.97 at frame 4466 + 1/2 at the ends of the window. The lowest is 0.326 of the slower end, limit 0.07. Near 0 the picture comes to rest between the rise and the travel.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4368 | terrain terrain | 1.536e-2 | 0.005 |  |  | 0.022 |  |  |  |  |  | 0 |
| 4369 | terrain terrain | 1.537e-2 | 0.005 | 0.000 | 0.000 | 0.022 | 0.000 | 0.000 |  |  |  | 4 |
| 4370 | terrain terrain | 1.537e-2 | 0.005 | 0.000 | 0.000 | 0.022 | 0.000 | 0.000 |  |  |  | 4 |
| 4371 | terrain terrain | 1.538e-2 | 0.005 | 0.000 | 0.000 | 0.022 | 0.000 | 0.000 |  |  |  | 4 |
| 4372 | terrain terrain | 1.539e-2 | 0.005 | 0.000 | 0.000 | 0.022 | 0.000 | 0.000 |  |  |  | 4 |
| 4373 | terrain terrain | 1.539e-2 | 0.005 | 0.000 | 0.000 | 0.022 | 0.000 | 0.000 |  |  |  | 4 |
| 4374 | terrain terrain | 1.540e-2 | 0.005 | 0.000 | 0.000 | 0.022 | 0.000 | 0.000 |  |  |  | 4 |
| 4375 | terrain terrain | 1.541e-2 | 0.005 | 0.000 | 0.000 | 0.022 | 0.000 | 0.000 |  |  |  | 4 |
| 4376 | terrain terrain | 1.541e-2 | 0.005 | 0.000 | 0.000 | 0.022 | 0.000 | 0.000 |  |  |  | 4 |
| 4377 | terrain terrain | 1.542e-2 | 0.005 | 0.000 | 0.000 | 0.022 | 0.000 | 0.000 |  |  |  | 4 |
| 4378 | terrain terrain | 1.542e-2 | 0.005 | 0.000 | 0.000 | 0.022 | 0.000 | 0.000 |  |  |  | 4 |
| 4379 | terrain terrain | 1.543e-2 | 0.005 | 0.000 | 0.000 | 0.022 | 0.000 | 0.000 |  |  |  | 4 |
| 4380 first | rise terrain | 1.544e-2 | 0.006 | 0.000 | 0.002 | 0.022 | 0.000 | 0.001 |  |  |  | 4 |
| 4381 | rise terrain | 1.545e-2 | 0.014 | 0.009 | 0.024 | 0.024 | 0.003 | 0.008 | 0.179 |  |  | 4 |
| 4382 | rise terrain | 1.551e-2 | 0.048 | 0.034 | 0.050 | 0.036 | 0.012 | 0.018 | 0.206 | 0.026 | 0.041 | 5 |
| 4383 | rise terrain | 1.564e-2 | 0.105 | 0.057 | 0.064 | 0.058 | 0.022 | 0.027 | 0.256 | 0.050 | 0.067 | 5 |
| 4384 | rise terrain | 1.586e-2 | 0.169 | 0.064 | 0.064 | 0.085 | 0.028 | 0.029 | 0.325 | 0.069 | 0.072 | 5 |
| 4385 | rise terrain | 1.615e-2 | 0.232 | 0.064 | 0.064 | 0.116 | 0.031 | 0.034 | 0.392 | 0.067 | 0.068 | 5 |
| 4386 | rise terrain | 1.654e-2 | 0.296 | 0.064 | 0.064 | 0.153 | 0.037 | 0.042 | 0.454 | 0.061 | 0.062 | 5 |
| 4387 | rise terrain | 1.702e-2 | 0.359 | 0.064 | 0.064 | 0.197 | 0.045 | 0.048 | 0.508 | 0.054 | 0.055 | 5 |
| 4388 | rise terrain | 1.761e-2 | 0.423 | 0.064 | 0.064 | 0.246 | 0.049 | 0.050 | 0.553 | 0.045 | 0.046 | 5 |
| 4389 | rise terrain | 1.831e-2 | 0.486 | 0.064 | 0.064 | 0.297 | 0.051 | 0.052 | 0.590 | 0.037 | 0.037 | 5 |
| 4390 | rise terrain | 1.913e-2 | 0.550 | 0.064 | 0.064 | 0.349 | 0.052 | 0.053 | 0.619 | 0.029 | 0.029 | 5 |
| 4391 T | rise terrain | 2.009e-2 | 0.614 | 0.064 | 0.064 | 0.403 | 0.054 | 0.055 | 0.640 | 0.022 | 0.021 | 5 |
| 4392 | rise orbit | 2.121e-2 | 0.677 | 0.064 | 0.064 | 0.457 | 0.055 | 0.056 | 0.656 | 0.015 | 0.015 | 5 |
| 4393 | rise orbit | 2.251e-2 | 0.741 | 0.064 | 0.064 | 0.514 | 0.056 | 0.058 | 0.653 | 0.010 | 0.009 | 5 |
| 4394 | rise orbit | 2.400e-2 | 0.804 | 0.064 | 0.064 | 0.572 | 0.058 | 0.059 | 0.651 | 0.002 | 0.004 | 6 |
| 4395 | rise orbit | 2.573e-2 | 0.868 | 0.064 | 0.064 | 0.631 | 0.059 | 0.060 | 0.650 | 0.001 | 0.002 | 6 |
| 4396 | rise orbit | 2.771e-2 | 0.931 | 0.064 | 0.064 | 0.690 | 0.060 | 0.061 | 0.752 | 0.006 | 0.009 | 6 |
| 4397 | rise orbit | 3.001e-2 | 0.995 | 0.064 | 0.064 | 0.752 | 0.062 | 0.064 | 0.741 | 0.011 | 0.015 | 7 |
| 4398 | rise orbit | 3.266e-2 | 1.058 | 0.064 | 0.064 | 0.817 | 0.065 | 0.067 | 0.819 | 0.001 | 0.003 | 7 |
| 4399 | rise orbit | 3.573e-2 | 1.122 | 0.064 | 0.064 | 0.884 | 0.067 | 0.069 | 0.806 | 0.013 | 0.017 | 8 |
| 4400 | rise orbit | 3.928e-2 | 1.186 | 0.064 | 0.064 | 0.954 | 0.070 | 0.072 | 0.801 | 0.005 | 0.007 | 8 |
| 4401 | rise orbit | 4.341e-2 | 1.249 | 0.064 | 0.064 | 1.026 | 0.072 | 0.074 | 0.800 | 0.001 | 0.002 | 8 |
| 4402 | rise orbit | 4.820e-2 | 1.309 | 0.060 | 0.060 | 1.100 | 0.074 | 0.075 | 0.802 | 0.002 | 0.002 | 8 |
| 4403 | rise orbit | 5.368e-2 | 1.348 | 0.039 | 0.036 | 1.172 | 0.072 | 0.072 | 0.808 | 0.006 | 0.008 | 8 |
| 4404 | rise orbit | 5.985e-2 | 1.361 | 0.013 | 0.009 | 1.241 | 0.068 | 0.068 | 0.820 | 0.012 | 0.016 | 8 |
| 4405 | rise orbit | 6.674e-2 | 1.361 | 0.000 | 0.000 | 1.307 | 0.067 | 0.067 | 0.840 | 0.019 | 0.022 | 8 |
| 4406 | rise orbit | 7.441e-2 | 1.361 | 0.000 | 0.000 | 1.374 | 0.067 | 0.068 | 0.864 | 0.025 | 0.026 | 8 |
| 4407 | rise orbit | 8.297e-2 | 1.361 | 0.000 | 0.000 | 1.440 | 0.066 | 0.066 | 0.892 | 0.028 | 0.027 | 8 |
| 4408 | rise orbit | 9.251e-2 | 1.361 | 0.000 | 0.000 | 1.500 | 0.060 | 0.059 | 0.919 | 0.027 | 0.026 | 8 |
| 4409 | rise orbit | 1.032e-1 | 1.361 | 0.000 | 0.000 | 1.553 | 0.052 | 0.052 | 0.927 | 0.009 | 0.010 | 8 |
| 4410 | rise orbit | 1.150e-1 | 1.361 | 0.000 | 0.000 | 1.599 | 0.046 | 0.046 | 0.915 | 0.013 | 0.015 | 8 |
| 4411 | rise orbit | 1.282e-1 | 1.361 | 0.000 | 0.000 | 1.642 | 0.044 | 0.044 | 0.918 | 0.003 | 0.018 | 8 |
| 4412 | rise orbit | 1.430e-1 | 1.361 | 0.000 | 0.000 | 1.684 | 0.041 | 0.042 | 0.942 | 0.024 | 0.035 | 8 |
| 4413 | rise orbit | 1.594e-1 | 1.361 | 0.000 | 0.000 | 1.721 | 0.037 | 0.036 | 0.986 | 0.044 | 0.047 | 8 |
| 4414 | rise orbit | 1.778e-1 | 1.361 | 0.000 | 0.000 | 1.747 | 0.026 | 0.025 | 1.034 | 0.047 | 0.047 | 8 |
| 4415 | rise orbit | 1.982e-1 | 1.361 | 0.000 | 0.000 | 1.762 | 0.015 | 0.013 | 1.080 | 0.046 | 0.045 | 8 |
| 4416 | rise orbit | 2.210e-1 | 1.361 | 0.000 | 0.000 | 1.767 | 0.005 | 0.004 | 1.125 | 0.045 | 0.044 | 8 |
| 4417 | rise orbit | 2.464e-1 | 1.361 | 0.000 | 0.000 | 1.768 | 0.002 | 0.001 | 1.170 | 0.045 | 0.044 | 8 |
| 4418 | rise orbit | 2.747e-1 | 1.361 | 0.000 | 0.000 | 1.768 | 0.000 | 0.001 | 1.216 | 0.045 | 0.044 | 8 |
| 4419 | rise orbit | 3.063e-1 | 1.361 | 0.000 | 0.000 | 1.766 | 0.002 | 0.003 | 1.261 | 0.045 | 0.044 | 8 |
| 4420 | rise orbit | 3.416e-1 | 1.361 | 0.000 | 0.000 | 1.762 | 0.004 | 0.008 | 1.305 | 0.044 | 0.042 | 8 |
| 4421 | rise orbit | 3.808e-1 | 1.361 | 0.000 | 0.000 | 1.751 | 0.011 | 0.015 | 1.342 | 0.038 | 0.035 | 8 |
| 4422 | rise orbit | 4.246e-1 | 1.361 | 0.000 | 0.000 | 1.733 | 0.018 | 0.022 | 1.372 | 0.029 | 0.027 | 8 |
| 4423 | rise orbit | 4.734e-1 | 1.361 | 0.000 | 0.000 | 1.708 | 0.025 | 0.029 | 1.398 | 0.026 | 0.024 | 8 |
| 4424 | rise orbit | 5.279e-1 | 1.361 | 0.000 | 0.000 | 1.679 | 0.029 | 0.030 | 1.424 | 0.026 | 0.025 | 8 |
| 4425 | rise orbit | 5.885e-1 | 1.361 | 0.000 | 0.000 | 1.650 | 0.030 | 0.030 | 1.450 | 0.027 | 0.025 | 8 |
| 4426 | rise orbit | 6.562e-1 | 1.361 | 0.000 | 0.000 | 1.620 | 0.030 | 0.030 | 1.478 | 0.027 | 0.026 | 8 |
| 4427 | rise orbit | 7.316e-1 | 1.361 | 0.000 | 0.000 | 1.590 | 0.030 | 0.030 | 1.505 | 0.027 | 0.025 | 8 |
| 4428 | rise orbit | 8.157e-1 | 1.360 | 0.000 | 0.000 | 1.561 | 0.029 | 0.030 | 1.531 | 0.026 | 0.025 | 8 |
| 4429 | rise orbit | 9.094e-1 | 1.360 | 0.000 | 0.000 | 1.532 | 0.029 | 0.029 | 1.557 | 0.026 | 0.024 | 8 |
| 4430 | rise orbit | 1.014e+0 | 1.360 | 0.000 | 0.000 | 1.503 | 0.029 | 0.029 | 1.581 | 0.024 | 0.023 | 8 |
| 4431 | rise orbit | 1.131e+0 | 1.360 | 0.000 | 0.000 | 1.475 | 0.028 | 0.028 | 1.604 | 0.023 | 0.021 | 8 |
| 4432 | rise orbit | 1.260e+0 | 1.359 | 0.001 | 0.005 | 1.447 | 0.028 | 0.028 | 1.624 | 0.020 | 0.019 | 8 |
| 4433 | rise orbit | 1.404e+0 | 1.349 | 0.011 | 0.021 | 1.420 | 0.027 | 0.031 | 1.629 | 0.005 | 0.008 | 8 |
| 4434 | rise orbit | 1.560e+0 | 1.322 | 0.027 | 0.037 | 1.382 | 0.038 | 0.051 | 1.614 | 0.016 | 0.027 | 8 |
| 4435 | rise orbit | 1.728e+0 | 1.279 | 0.042 | 0.049 | 1.323 | 0.059 | 0.071 | 1.579 | 0.035 | 0.042 | 8 |
| 4436 | rise orbit | 1.907e+0 | 1.230 | 0.049 | 0.050 | 1.250 | 0.073 | 0.074 | 1.533 | 0.045 | 0.046 | 8 |
| 4437 | rise orbit | 2.096e+0 | 1.181 | 0.049 | 0.050 | 1.177 | 0.073 | 0.074 | 1.485 | 0.049 | 0.049 | 8 |
| 4438 | rise orbit | 2.294e+0 | 1.131 | 0.049 | 0.050 | 1.104 | 0.072 | 0.073 | 1.433 | 0.052 | 0.052 | 8 |
| 4439 | rise orbit | 2.502e+0 | 1.082 | 0.049 | 0.050 | 1.032 | 0.072 | 0.073 | 1.378 | 0.054 | 0.054 | 8 |
| 4440 | rise orbit | 2.717e+0 | 1.033 | 0.049 | 0.049 | 0.960 | 0.072 | 0.073 | 1.322 | 0.057 | 0.056 | 8 |
| 4441 | rise orbit | 2.939e+0 | 0.984 | 0.049 | 0.049 | 0.888 | 0.072 | 0.073 | 1.264 | 0.058 | 0.056 | 8 |
| 4442 | rise orbit | 3.168e+0 | 0.935 | 0.049 | 0.049 | 0.816 | 0.072 | 0.072 | 1.207 | 0.057 | 0.055 | 8 |
| 4443 | rise orbit | 3.400e+0 | 0.886 | 0.049 | 0.049 | 0.746 | 0.071 | 0.071 | 1.152 | 0.055 | 0.053 | 8 |
| 4444 | rise orbit | 3.636e+0 | 0.838 | 0.048 | 0.049 | 0.676 | 0.070 | 0.071 | 1.099 | 0.053 | 0.051 | 8 |
| 4445 | rise orbit | 3.873e+0 | 0.789 | 0.048 | 0.049 | 0.606 | 0.070 | 0.070 | 1.049 | 0.050 | 0.048 | 8 |
| 4446 | rise orbit | 4.109e+0 | 0.741 | 0.048 | 0.049 | 0.537 | 0.069 | 0.069 | 1.003 | 0.047 | 0.045 | 8 |
| 4447 | rise orbit | 4.343e+0 | 0.693 | 0.048 | 0.049 | 0.468 | 0.069 | 0.069 | 0.958 | 0.044 | 0.043 | 8 |
| 4448 | rise orbit | 4.573e+0 | 0.644 | 0.049 | 0.049 | 0.400 | 0.068 | 0.068 | 0.916 | 0.043 | 0.041 | 8 |
| 4449 | rise orbit | 4.796e+0 | 0.595 | 0.049 | 0.049 | 0.333 | 0.068 | 0.068 | 0.874 | 0.042 | 0.040 | 8 |
| 4450 | rise orbit | 5.010e+0 | 0.547 | 0.049 | 0.049 | 0.266 | 0.067 | 0.067 | 0.832 | 0.041 | 0.040 | 8 |
| 4451 | rise orbit | 5.213e+0 | 0.497 | 0.049 | 0.050 | 0.199 | 0.067 | 0.067 | 0.791 | 0.041 | 0.040 | 8 |
| 4452 | rise orbit | 5.404e+0 | 0.448 | 0.049 | 0.050 | 0.134 | 0.065 | 0.066 | 0.751 | 0.040 | 0.039 | 8 |
| 4453 | rise orbit | 5.579e+0 | 0.399 | 0.050 | 0.050 | 0.073 | 0.061 | 0.061 | 0.714 | 0.038 | 0.037 | 8 |
| 4454 last | rise orbit | 5.737e+0 | 0.349 | 0.050 | 0.050 | 0.027 | 0.046 | 0.044 | 0.678 | 0.035 | 0.035 | 8 |
| 4455 | travel orbit | 5.876e+0 | 0.299 | 0.049 | 0.050 | 0.005 | 0.021 | 0.018 | 0.655 | 0.023 | 0.022 | 8 |
| 4456 | travel orbit | 5.997e+0 | 0.256 | 0.043 | 0.042 | 0.001 | 0.004 | 0.003 | 0.646 | 0.010 | 0.054 | 8 |
| 4457 | travel orbit | 6.106e+0 | 0.226 | 0.031 | 0.030 | 0.001 | 0.000 | 0.000 | 0.596 | 0.050 | 0.053 | 8 |
| 4458 | travel orbit | 6.207e+0 | 0.204 | 0.022 | 0.021 | 0.001 | 0.000 | 0.000 | 0.843 | 0.247 * | 0.845 * | 8 |
| 4459 | travel orbit | 6.306e+0 | 0.198 | 0.006 | 0.009 | 0.001 | 0.000 | 0.000 | 2.254 | 1.411 * | 2.509 * | 8 |
| 4460 | travel orbit | 6.416e+0 | 0.217 | 0.019 | 0.037 | 0.001 | 0.000 | 0.000 | 5.434 | 3.180 * | 4.272 * | 8 |
| 4461 | travel orbit | 6.554e+0 | 0.265 | 0.047 | 0.064 | 0.001 | 0.000 | 0.000 | 10.141 | 4.707 * | 5.276 * | 8 |
| 4462 | travel orbit | 6.733e+0 | 0.337 | 0.072 | 0.086 * | 0.001 | 0.000 | 0.000 | 15.441 | 5.299 * | 5.366 * | 8 |
| 4463 | travel orbit | 6.968e+0 | 0.431 | 0.094 * | 0.107 * | 0.001 | 0.000 | 0.000 | 20.451 | 5.010 * | 4.985 * | 8 |
| 4464 | travel orbit | 7.277e+0 | 0.543 | 0.112 * | 0.117 * | 0.001 | 0.000 | 0.000 | 24.744 | 4.293 * | 4.223 * | 8 |
| 4465 | travel orbit | 7.670e+0 | 0.656 | 0.114 * | 0.114 * | 0.001 | 0.000 | 0.001 | 27.746 | 3.002 * | 2.837 * | 8 |
| 4466 | travel orbit | 8.149e+0 | 0.758 | 0.101 * | 0.100 * | 0.003 | 0.002 | 0.005 | 29.569 | 1.824 * | 1.696 * | 8 |

## pictures

Tier draft, rate 2, 12.34 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

The dive is joined from 2 parts: /home/user/workspace/work/p6/hu9/01/uranus-dive-p1of2 (capture frames 8196 to 8309, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hu9/02/uranus-dive-p2of2 (capture frames 8310 to 8423, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

The rise is joined from 2 parts: /home/user/workspace/work/p6/hu9/03/uranus-rise-p1of2 (capture frames 8736 to 8834, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hu9/04/uranus-rise-p2of2 (capture frames 8835 to 8933, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

### dive (uranus.dive, frames 4110 to 4199, window 4098 to 4211, 228 draft frames at rate 2)

Largest level step: 0.07 at frame 4139 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.12 from frame 4176 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 4.39 from frame 4135 + 1/2 to the next, block column 14 row 8 from the top left, shown, not judged.
Largest change in place: 91.7 from frame 4163 to 8 film frames later, most at pixel 1220, 268 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 1.60 from frame 4175 + 1/2 to 8 film frames later, most at pixel 970, 620, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 4200 to 4211 + 1/2): change 9.0, pattern 0.31.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 4118 in /home/user/workspace/work/p6/hu9/01/uranus-dive-p1of2-pops.png, frame 4118 + 1/2 in /home/user/workspace/work/p6/hu9/01/uranus-dive-p1of2-pops.png, frame 4175 in /home/user/workspace/work/p6/hu9/02/uranus-dive-p2of2-pops.png, frame 4176 in /home/user/workspace/work/p6/hu9/02/uranus-dive-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 4159 in /home/user/workspace/work/p6/hu9/02/uranus-dive-p2of2-changes.png, frame 4167 in /home/user/workspace/work/p6/hu9/02/uranus-dive-p2of2-changes.png, frame 4175 + 1/2 in /home/user/workspace/work/p6/hu9/02/uranus-dive-p2of2-changes.png, frame 4183 + 1/2 in /home/user/workspace/work/p6/hu9/02/uranus-dive-p2of2-changes.png.

- RED the pattern of the picture changes in place by 1.60 from frame 4175 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (93 frames over it, first 4139)

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4098 | 43.84 |  | 0.5 | 0.88 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 12,0 | 1.3 | 2.0 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4098 + 1/2 | 43.84 | 0.00 | 0.5 | 0.88 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 2,5 | 1.3 | 2.0 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4099 | 43.84 | 0.00 | 0.5 | 0.87 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 10,0 | 1.2 | 2.0 | 0.17 | 0.00 | 0.17 | 8.1 |
| 4099 + 1/2 | 43.84 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 12,3 | 1.2 | 1.8 | 0.17 | 0.00 | 0.17 | 8.1 |
| 4100 | 43.84 | 0.00 | 0.5 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.18 | 15,8 | 1.2 | 1.9 | 0.17 | 0.00 | 0.17 | 8.1 |
| 4100 + 1/2 | 43.85 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 6,7 | 1.2 | 1.9 | 0.17 | 0.00 | 0.17 | 8.1 |
| 4101 | 43.85 | 0.00 | 0.5 | 0.88 | 0.87 | 1.01 | 1.01 | 1.01 | 0.000 | 1.17 | 14,0 | 1.2 | 1.9 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4101 + 1/2 | 43.85 | 0.00 | 0.5 | 0.87 | 0.87 | 1.01 | 1.01 | 1.01 | 0.000 | 1.16 | 13,7 | 1.2 | 1.9 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4102 | 43.85 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 4,5 | 1.1 | 1.8 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4102 + 1/2 | 43.86 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 15,0 | 1.1 | 1.7 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4103 | 43.86 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 2,4 | 1.1 | 1.8 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4103 + 1/2 | 43.86 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 3,8 | 1.0 | 1.9 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4104 | 43.86 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 6,8 | 1.1 | 2.0 | 0.17 | 0.00 | 0.17 | 8.1 |
| 4104 + 1/2 | 43.87 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 8,8 | 1.2 | 2.1 | 0.17 | 0.00 | 0.17 | 8.1 |
| 4105 | 43.87 | 0.00 | 0.5 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 15,8 | 1.3 | 2.2 | 0.17 | 0.01 | 0.17 | 8.1 |
| 4105 + 1/2 | 43.87 | 0.00 | 0.5 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 15,8 | 1.4 | 2.2 | 0.17 | 0.01 | 0.17 | 8.0 |
| 4106 | 43.88 | 0.00 | 0.5 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 6,7 | 1.6 | 2.2 | 0.17 | 0.01 | 0.17 | 8.0 |
| 4106 + 1/2 | 43.88 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 3,0 | 1.7 | 2.3 | 0.17 | 0.01 | 0.17 | 8.0 |
| 4107 | 43.88 | 0.00 | 0.5 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 13,7 | 1.9 | 2.5 | 0.17 | 0.02 | 0.17 | 8.0 |
| 4107 + 1/2 | 43.88 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 5,6 | 2.2 | 3.0 | 0.17 | 0.02 | 0.17 | 8.0 |
| 4108 | 43.88 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 2,2 | 2.4 | 3.5 | 0.17 | 0.03 | 0.17 | 8.0 |
| 4108 + 1/2 | 43.88 | 0.00 | 0.5 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 15,4 | 2.7 | 3.8 | 0.17 | 0.04 | 0.17 | 8.0 |
| 4109 | 43.89 | 0.00 | 0.5 | 0.87 | 0.88 | 0.99 | 0.99 | 0.99 | 0.000 | 1.04 | 14,3 | 3.0 | 4.2 | 0.17 | 0.05 | 0.17 | 8.0 |
| 4109 + 1/2 | 43.89 | 0.00 | 0.5 | 0.87 | 0.89 | 0.98 | 0.98 | 0.98 | 0.000 | 1.09 | 1,8 | 3.4 | 4.8 | 0.17 | 0.06 | 0.17 | 8.0 |
| 4110 first | 43.89 | 0.00 | 0.5 | 0.90 | 0.95 | 0.94 | 0.94 | 0.94 | 0.000 | 1.09 | 1,6 | 3.8 | 5.2 | 0.17 | 0.07 | 0.17 | 8.2 |
| 4110 + 1/2 | 43.90 | 0.00 | 0.6 | 1.04 | 1.09 | 0.95 | 0.95 | 0.95 | 0.000 | 1.20 | 1,1 | 4.1 | 5.7 | 0.17 | 0.09 | 0.17 | 8.3 |
| 4111 | 43.90 | 0.00 | 0.9 | 1.28 | 1.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.45 | 0,3 | 4.5 | 6.2 | 0.17 | 0.10 | 0.17 | 8.3 |
| 4111 + 1/2 | 43.92 | 0.01 | 1.2 | 1.52 | 1.47 | 1.03 | 1.03 | 1.03 | 0.000 | 1.70 | 1,6 | 4.8 | 6.9 | 0.17 | 0.11 | 0.17 | 8.3 |
| 4112 | 43.94 | 0.00 | 1.8 | 1.67 | 1.61 | 1.04 | 1.04 | 1.04 | 0.000 | 1.87 | 13,2 | 5.0 | 7.2 | 0.17 | 0.11 | 0.17 | 8.4 |
| 4112 + 1/2 | 43.97 | 0.01 | 2.5 | 1.70 | 1.69 | 1.01 | 1.01 | 1.01 | 0.000 | 1.96 | 13,2 | 5.4 | 7.5 | 0.17 | 0.12 | 0.17 | 8.4 |
| 4113 | 44.02 | 0.01 | 3.1 | 1.71 | 1.76 | 0.97 | 0.98 | 0.97 | 0.000 | 1.77 | 13,2 | 5.6 | 7.6 | 0.17 | 0.17 | 0.03 | 8.0 |
| 4113 + 1/2 | 44.09 | 0.01 | 3.8 | 1.82 | 1.81 | 1.00 | 1.03 | 1.00 | 0.000 | 1.93 | 1,1 | 5.9 | 7.4 | 0.17 | 0.21 | 0.04 | 8.0 |
| 4114 | 44.17 | 0.01 | 4.5 | 1.92 | 1.88 | 1.02 | 1.04 | 1.02 | 0.003 | 1.92 | 10,6 | 6.1 | 7.5 | 0.17 | 0.20 | 0.05 | 8.0 |
| 4114 + 1/2 | 44.27 | 0.01 | 5.2 | 2.00 | 1.93 | 1.04 | 1.07 | 1.04 | 0.007 | 1.99 | 10,6 | 6.5 | 7.5 | 0.18 | 0.18 | 0.06 | 8.0 |
| 4115 | 44.39 | 0.01 | 5.8 | 1.98 | 1.94 | 1.02 | 1.05 | 1.02 | 0.005 | 1.91 | 7,1 | 6.8 | 7.3 | 0.18 | 0.11 | 0.17 | 8.4 |
| 4115 + 1/2 | 44.52 | 0.00 | 6.4 | 1.95 | 1.98 | 0.98 | 1.06 | 0.98 | 0.000 | 1.86 | 7,1 | 7.0 | 7.5 | 0.18 | 0.12 | 0.10 | 8.0 |
| 4116 | 44.66 | 0.01 | 7.0 | 1.94 | 1.98 | 0.98 | 1.01 | 0.98 | 0.011 | 1.95 | 5,3 | 7.2 | 7.8 | 0.18 | 0.14 | 0.13 | 8.0 |
| 4116 + 1/2 | 44.81 | 0.01 | 7.5 | 1.97 | 1.97 | 1.00 | 1.07 | 1.00 | 0.001 | 1.97 | 5,3 | 7.4 | 7.9 | 0.18 | 0.15 | 0.15 | 8.0 |
| 4117 | 44.99 | 0.01 | 8.0 | 2.05 | 1.97 | 1.04 | 1.11 | 1.04 | 0.003 | 1.94 | 5,3 | 7.3 | 7.9 | 0.18 | 0.18 | 0.17 | 8.0 |
| 4117 + 1/2 | 45.18 | 0.02 | 8.6 | 2.15 | 1.97 | 1.09 | 1.16 | 1.09 | 0.005 | 1.93 | 5,3 | 7.1 | 7.7 | 0.19 | 0.17 | 0.18 | 8.0 |
| 4118 | 45.41 | 0.00 | 9.0 | 2.15 | 1.97 | 1.09 | 1.14 | 1.09 | 0.013 | 1.76 | 5,3 | 6.7 | 7.2 | 0.19 | 0.17 | 0.20 | 8.0 |
| 4118 + 1/2 | 45.64 | 0.01 | 9.5 | 2.16 | 1.97 | 1.10 | 1.15 | 1.10 | 0.014 | 1.82 | 1,3 | 6.3 | 6.9 | 0.19 | 0.18 | 0.21 | 8.0 |
| 4119 | 45.90 | 0.01 | 9.9 | 2.09 | 1.97 | 1.06 | 1.08 | 1.06 | 0.027 | 1.85 | 1,4 | 6.0 | 6.7 | 0.20 | 0.23 | 0.23 | 8.0 |
| 4119 + 1/2 | 46.17 | 0.01 | 10.2 | 2.06 | 1.97 | 1.05 | 1.03 | 1.03 | 0.032 | 1.56 | 1,4 | 5.5 | 6.3 | 0.20 | 0.22 | 0.24 | 8.0 |
| 4120 | 46.44 | 0.01 | 10.6 | 2.04 | 1.97 | 1.04 | 1.05 | 1.04 | 0.029 | 1.83 | 5,0 | 5.1 | 6.1 | 0.20 | 0.27 | 0.25 | 8.0 |
| 4120 + 1/2 | 46.72 | 0.01 | 11.0 | 2.03 | 1.97 | 1.03 | 0.97 | 0.97 | 0.044 | 1.98 | 15,0 | 4.9 | 5.9 | 0.21 | 0.30 | 0.27 | 8.0 |
| 4121 | 47.00 | 0.01 | 11.3 | 2.03 | 1.97 | 1.03 | 1.02 | 1.02 | 0.036 | 2.10 | 15,0 | 4.7 | 5.5 | 0.21 | 0.29 | 0.28 | 8.0 |
| 4121 + 1/2 | 47.31 | 0.01 | 11.5 | 2.05 | 1.97 | 1.04 | 1.01 | 1.01 | 0.042 | 2.51 | 15,0 | 4.8 | 5.9 | 0.22 | 0.31 | 0.29 | 8.0 |
| 4122 | 47.64 | 0.01 | 11.7 | 2.04 | 1.97 | 1.04 | 0.98 | 0.98 | 0.043 | 2.47 | 15,2 | 4.8 | 5.8 | 0.22 | 0.33 | 0.30 | 8.0 |
| 4122 + 1/2 | 47.98 | 0.01 | 11.7 | 2.03 | 1.97 | 1.03 | 1.03 | 1.03 | 0.037 | 2.54 | 15,2 | 5.0 | 6.3 | 0.23 | 0.32 | 0.32 | 8.0 |
| 4123 | 48.34 | 0.01 | 11.9 | 2.04 | 1.95 | 1.05 | 1.02 | 1.02 | 0.038 | 1.84 | 15,2 | 5.4 | 6.8 | 0.24 | 0.34 | 0.33 | 8.0 |
| 4123 + 1/2 | 48.72 | 0.00 | 11.9 | 1.99 | 1.94 | 1.02 | 1.02 | 1.02 | 0.036 | 1.70 | 2,7 | 5.6 | 7.1 | 0.24 | 0.32 | 0.35 | 8.0 |
| 4124 | 49.10 | 0.00 | 11.8 | 1.96 | 1.92 | 1.02 | 1.01 | 1.01 | 0.044 | 2.01 | 12,0 | 5.8 | 7.8 | 0.25 | 0.30 | 0.36 | 8.0 |
| 4124 + 1/2 | 49.48 | 0.00 | 11.7 | 1.90 | 1.89 | 1.00 | 0.98 | 0.98 | 0.068 | 1.65 | 12,0 | 6.2 | 8.0 | 0.25 | 0.29 | 0.38 | 8.0 |
| 4125 | 49.87 | 0.01 | 11.5 | 1.83 | 1.79 | 1.02 | 1.02 | 1.02 | 0.061 | 1.83 | 12,0 | 6.6 | 8.6 | 0.26 | 0.27 | 0.39 | 8.0 |
| 4125 + 1/2 | 50.24 | 0.03 | 11.4 | 1.68 | 1.73 | 0.97 | 0.99 | 0.97 | 0.051 | 1.77 | 12,2 | 7.1 | 9.2 | 0.26 | 0.25 | 0.41 | 8.0 |
| 4126 | 50.67 | 0.02 | 11.2 | 1.59 | 1.65 | 0.96 | 0.93 | 0.93 | 0.069 | 1.90 | 13,1 | 7.8 | 9.6 | 0.27 | 0.22 | 0.42 | 8.0 |
| 4126 + 1/2 | 51.14 | 0.01 | 11.4 | 1.60 | 1.61 | 1.00 | 1.02 | 1.00 | 0.071 | 1.90 | 12,2 | 8.4 | 10.5 | 0.27 | 0.20 | 0.27 | 8.0 |
| 4127 | 51.64 | 0.02 | 10.8 | 1.63 | 1.58 | 1.03 | 1.04 | 1.03 | 0.076 | 1.89 | 12,2 | 8.8 | 11.5 | 0.28 | 0.22 | 0.28 | 8.0 |
| 4127 + 1/2 | 52.19 | 0.02 | 10.6 | 1.57 | 1.54 | 1.02 | 1.03 | 1.02 | 0.073 | 1.91 | 13,3 | 9.4 | 12.7 | 0.28 | 0.25 | 0.28 | 8.0 |
| 4128 | 52.78 | 0.02 | 10.6 | 1.44 | 1.53 | 0.94 | 0.99 | 0.94 | 0.058 | 1.91 | 13,3 | 9.3 | 12.8 | 0.29 | 0.26 | 0.28 | 8.0 |
| 4128 + 1/2 | 53.40 | 0.02 | 10.6 | 1.45 | 1.46 | 0.99 | 1.00 | 0.99 | 0.098 | 1.92 | 13,3 | 8.9 | 13.9 | 0.29 | 0.27 | 0.29 | 8.0 |
| 4129 | 54.06 | 0.02 | 10.4 | 1.49 | 1.43 | 1.04 | 1.01 | 1.01 | 0.079 | 1.83 | 13,1 | 9.0 | 15.2 | 0.30 | 0.30 | 0.29 | 8.0 |
| 4129 + 1/2 | 54.76 | 0.01 | 10.5 | 1.42 | 1.37 | 1.04 | 1.02 | 1.02 | 0.092 | 1.81 | 13,3 | 8.8 | 16.2 | 0.30 | 0.32 | 0.30 | 8.0 |
| 4130 | 55.49 | 0.01 | 10.4 | 1.28 | 1.36 | 0.94 | 0.93 | 0.93 | 0.099 | 1.79 | 14,3 | 8.6 | 17.3 | 0.31 | 0.39 | 0.30 | 8.0 |
| 4130 + 1/2 | 56.24 | 0.01 | 10.7 | 1.27 | 1.29 | 0.99 | 1.01 | 0.99 | 0.084 | 1.93 | 14,3 | 8.8 | 18.4 | 0.31 | 0.36 | 0.31 | 8.0 |
| 4131 | 57.01 | 0.00 | 11.0 | 1.29 | 1.28 | 1.01 | 1.00 | 1.00 | 0.084 | 1.75 | 14,8 | 8.0 | 14.0 | 0.32 | 0.35 | 0.31 | 8.0 |
| 4131 + 1/2 | 57.78 | 0.02 | 11.2 | 1.30 | 1.27 | 1.02 | 1.02 | 1.02 | 0.080 | 2.55 | 13,6 | 8.3 | 14.7 | 0.32 | 0.29 | 0.31 | 8.0 |
| 4132 | 58.51 | 0.02 | 11.7 | 1.27 | 1.25 | 1.02 | 1.02 | 1.02 | 0.097 | 2.35 | 13,8 | 9.0 | 16.2 | 0.32 | 0.25 | 0.32 | 8.0 |
| 4132 + 1/2 | 59.20 | 0.06 | 11.8 | 1.22 | 1.22 | 1.00 | 1.00 | 1.00 | 0.101 | 2.93 | 13,7 | 9.3 | 17.4 | 0.33 | 0.25 | 0.32 | 8.0 |
| 4133 | 59.77 | 0.04 | 12.5 | 1.16 | 1.16 | 1.00 | 1.01 | 1.00 | 0.115 | 3.20 | 13,8 | 9.0 | 17.8 | 0.33 | 0.25 | 0.33 | 8.0 |
| 4133 + 1/2 | 60.26 | 0.03 | 12.3 | 1.10 | 1.10 | 1.00 | 0.96 | 0.96 | 0.129 | 3.10 | 13,8 | 9.2 | 16.8 | 0.33 | 0.26 | 0.33 | 8.0 |
| 4134 | 60.69 | 0.02 | 12.8 | 1.04 | 1.05 | 0.98 | 1.02 | 0.98 | 0.117 | 3.14 | 13,8 | 9.5 | 19.1 | 0.34 | 0.25 | 0.33 | 8.0 |
| 4134 + 1/2 | 61.10 | 0.03 | 13.0 | 1.01 | 1.00 | 1.01 | 1.03 | 1.01 | 0.121 | 3.76 | 13,8 | 9.0 | 14.6 | 0.34 | 0.25 | 0.33 | 8.0 |
| 4135 | 61.44 | 0.01 | 13.1 | 0.96 | 0.96 | 0.99 | 0.95 | 0.95 | 0.143 | 4.16 | 13,8 | 8.7 | 14.8 | 0.34 | 0.29 | 0.33 | 8.0 |
| 4135 + 1/2 | 61.76 | 0.02 | 13.5 | 0.92 | 0.91 | 1.01 | 1.04 | 1.01 | 0.135 | 4.39 | 14,8 | 7.8 | 14.3 | 0.34 | 0.33 | 0.34 | 8.0 |
| 4136 | 62.11 | 0.00 | 13.6 | 0.86 | 0.86 | 1.00 | 0.93 | 0.93 | 0.210 | 4.11 | 14,8 | 8.5 | 13.7 | 0.34 | 0.37 | 0.34 | 8.0 |
| 4136 + 1/2 | 62.47 | 0.01 | 14.0 | 0.81 | 0.82 | 0.99 | 0.94 | 0.94 | 0.143 | 1.67 | 4,8 | 8.7 | 14.4 | 0.35 | 0.41 | 0.34 | 8.0 |
| 4137 | 62.80 | 0.06 | 14.3 | 0.77 | 0.80 | 0.97 | 0.86 | 0.86 | 0.170 | 2.39 | 14,8 | 9.4 | 12.5 | 0.35 | 0.44 | 0.34 | 8.0 |
| 4137 + 1/2 | 63.24 | 0.01 | 14.8 | 0.74 | 0.80 | 0.92 | 0.85 | 0.85 | 0.185 | 2.02 | 15,7 | 10.1 | 13.1 | 0.35 | 0.41 | 0.35 | 8.0 |
| 4138 | 63.72 | 0.06 | 14.6 | 0.71 | 0.80 | 0.89 | 0.88 | 0.88 | 0.129 | 1.79 | 14,1 | 10.7 | 13.3 | 0.36 | 0.41 | 0.35 | 8.0 |
| 4138 + 1/2 | 64.07 | 0.06 | 15.4 | 0.70 | 0.80 | 0.87 | 0.85 | 0.85 | 0.169 | 1.99 | 14,1 | 10.9 | 12.5 | 0.36 | 0.43 | 0.36 | 8.0 |
| 4139 | 64.30 | 0.07 | 15.6 | 0.69 | 0.80 | 0.87 | 0.89 | 0.87 | 0.124 | 2.48 | 14,1 | 11.0 | 13.5 | 0.37 | 0.48 | 0.36 | 8.0 |
| 4139 + 1/2 | 64.40 | 0.07 | 15.4 | 0.69 | 0.80 | 0.87 | 0.91 | 0.87 | 0.101 | 2.23 | 14,1 | 11.5 | 14.5 | 0.38 | 0.56 | 0.37 | 8.0 |
| 4140 | 64.35 | 0.05 | 15.8 | 0.69 | 0.80 | 0.87 | 0.88 | 0.87 | 0.141 | 2.79 | 15,1 | 12.1 | 14.7 | 0.38 | 0.68 | 0.38 | 8.0 |
| 4140 + 1/2 | 64.20 | 0.05 | 15.6 | 0.67 | 0.80 | 0.85 | 0.89 | 0.85 | 0.124 | 2.44 | 15,1 | 12.9 | 16.3 | 0.39 | 0.73 | 0.38 | 8.0 |
| 4141 | 63.94 | 0.05 | 15.5 | 0.68 | 0.80 | 0.85 | 0.93 | 0.85 | 0.086 | 2.45 | 15,1 | 13.2 | 18.1 | 0.40 | 0.69 | 0.39 | 8.0 |
| 4141 + 1/2 | 63.57 | 0.06 | 15.2 | 0.69 | 0.80 | 0.87 | 0.94 | 0.87 | 0.075 | 2.56 | 15,1 | 12.8 | 18.8 | 0.41 | 0.60 | 0.40 | 8.0 |
| 4142 | 63.08 | 0.05 | 15.3 | 0.69 | 0.80 | 0.87 | 0.94 | 0.87 | 0.086 | 2.33 | 15,1 | 12.6 | 17.7 | 0.41 | 0.52 | 0.41 | 8.0 |
| 4142 + 1/2 | 62.50 | 0.04 | 15.1 | 0.70 | 0.80 | 0.88 | 0.98 | 0.88 | 0.056 | 2.20 | 15,1 | 12.4 | 18.4 | 0.42 | 0.52 | 0.41 | 8.0 |
| 4143 | 61.84 | 0.04 | 15.2 | 0.70 | 0.80 | 0.88 | 0.97 | 0.88 | 0.066 | 1.94 | 12,0 | 11.6 | 18.8 | 0.43 | 0.54 | 0.42 | 8.0 |
| 4143 + 1/2 | 61.09 | 0.02 | 14.8 | 0.71 | 0.80 | 0.89 | 0.99 | 0.89 | 0.063 | 2.09 | 12,0 | 11.5 | 16.7 | 0.44 | 0.56 | 0.42 | 8.0 |
| 4144 | 60.30 | 0.02 | 14.6 | 0.73 | 0.80 | 0.91 | 0.97 | 0.91 | 0.065 | 1.84 | 15,0 | 10.9 | 16.2 | 0.44 | 0.59 | 0.43 | 8.0 |
| 4144 + 1/2 | 59.48 | 0.01 | 14.7 | 0.76 | 0.80 | 0.96 | 1.05 | 0.96 | 0.084 | 2.09 | 15,0 | 11.0 | 15.9 | 0.45 | 0.54 | 0.43 | 8.0 |
| 4145 | 58.63 | 0.01 | 14.5 | 0.79 | 0.79 | 0.99 | 1.02 | 0.99 | 0.066 | 2.05 | 3,1 | 12.0 | 14.5 | 0.45 | 0.48 | 0.44 | 8.0 |
| 4145 + 1/2 | 57.76 | 0.01 | 14.5 | 0.81 | 0.81 | 1.01 | 0.97 | 0.97 | 0.061 | 3.75 | 3,1 | 13.1 | 17.7 | 0.46 | 0.41 | 0.44 | 8.0 |
| 4146 | 56.90 | 0.01 | 14.5 | 0.83 | 0.83 | 1.00 | 0.98 | 0.98 | 0.079 | 1.92 | 2,4 | 14.8 | 21.3 | 0.47 | 0.39 | 0.45 | 8.0 |
| 4146 + 1/2 | 56.07 | 0.02 | 14.3 | 0.84 | 0.84 | 1.00 | 1.02 | 1.00 | 0.062 | 1.83 | 2,4 | 16.9 | 24.7 | 0.47 | 0.42 | 0.45 | 8.0 |
| 4147 | 55.26 | 0.02 | 14.3 | 0.86 | 0.87 | 1.00 | 0.97 | 0.97 | 0.069 | 1.88 | 2,4 | 19.3 | 29.2 | 0.48 | 0.448 | 0.46 | 8.0 |
| 4147 + 1/2 | 54.48 | 0.01 | 14.2 | 0.89 | 0.88 | 1.01 | 1.05 | 1.01 | 0.058 | 1.95 | 2,2 | 21.6 | 33.3 | 0.48 | 0.454 | 0.46 | 8.0 |
| 4148 | 53.72 | 0.01 | 14.4 | 0.92 | 0.89 | 1.03 | 0.96 | 0.96 | 0.063 | 1.76 | 2,4 | 23.5 | 36.0 | 0.48 | 0.49 | 0.46 | 8.0 |
| 4148 + 1/2 | 52.98 | 0.00 | 14.2 | 0.93 | 0.90 | 1.03 | 0.99 | 0.99 | 0.067 | 2.28 | 1,6 | 23.8 | 36.6 | 0.49 | 0.54 | 0.46 | 8.0 |
| 4149 | 52.23 | 0.01 | 14.1 | 0.92 | 0.90 | 1.02 | 1.00 | 1.00 | 0.058 | 3.55 | 3,1 | 25.7 | 35.7 | 0.49 | 0.56 | 0.46 | 8.0 |
| 4149 + 1/2 | 51.50 | 0.02 | 14.1 | 0.90 | 0.92 | 0.99 | 1.00 | 0.99 | 0.058 | 1.92 | 1,6 | 27.7 | 33.9 | 0.49 | 0.64 | 0.47 | 8.0 |
| 4150 | 50.80 | 0.03 | 14.0 | 0.89 | 0.92 | 0.98 | 1.01 | 0.98 | 0.055 | 2.27 | 3,1 | 30.0 | 36.5 | 0.50 | 0.74 | 0.47 | 8.0 |
| 4150 + 1/2 | 50.16 | 0.03 | 14.3 | 0.90 | 0.92 | 0.98 | 0.99 | 0.98 | 0.086 | 2.18 | 3,1 | 31.7 | 39.1 | 0.50 | 0.90 | 0.47 | 8.0 |
| 4151 | 49.59 | 0.03 | 14.7 | 0.92 | 0.92 | 0.99 | 0.97 | 0.97 | 0.096 | 2.25 | 0,7 | 33.2 | 43.3 | 0.50 | 0.99 | 0.47 | 8.0 |
| 4151 + 1/2 | 49.07 | 0.03 | 13.6 | 0.92 | 0.94 | 0.98 | 1.01 | 0.98 | 0.061 | 1.69 | 11,4 | 35.1 | 45.6 | 0.50 | 0.92 | 0.47 | 8.0 |
| 4152 | 48.61 | 0.03 | 13.7 | 0.95 | 0.95 | 1.00 | 1.00 | 1.00 | 0.066 | 1.90 | 1,2 | 36.7 | 46.7 | 0.50 | 0.89 | 0.47 | 8.0 |
| 4152 + 1/2 | 48.21 | 0.03 | 13.5 | 0.97 | 0.96 | 1.00 | 1.00 | 1.00 | 0.060 | 1.92 | 1,2 | 37.7 | 47.4 | 0.50 | 0.87 | 0.47 | 8.0 |
| 4153 | 47.88 | 0.04 | 13.3 | 0.98 | 1.00 | 0.98 | 0.98 | 0.98 | 0.054 | 1.74 | 2,0 | 38.8 | 46.9 | 0.50 | 0.82 | 0.47 | 8.0 |
| 4153 + 1/2 | 47.62 | 0.04 | 13.1 | 1.03 | 1.01 | 1.02 | 1.02 | 1.02 | 0.048 | 2.83 | 1,2 | 40.9 | 47.1 | 0.51 | 0.81 | 0.47 | 8.0 |
| 4154 | 47.44 | 0.05 | 13.2 | 1.05 | 1.06 | 0.99 | 0.97 | 0.97 | 0.047 | 2.36 | 12,0 | 43.7 | 47.0 | 0.51 | 0.81 | 0.47 | 8.0 |
| 4154 + 1/2 | 47.36 | 0.06 | 12.8 | 1.08 | 1.08 | 1.01 | 1.04 | 1.01 | 0.034 | 2.67 | 12,0 | 46.5 | 49.2 | 0.51 | 0.88 | 0.47 | 8.0 |
| 4155 | 47.40 | 0.06 | 12.8 | 1.11 | 1.10 | 1.00 | 1.00 | 1.00 | 0.042 | 2.95 | 12,0 | 48.1 | 52.7 | 0.51 | 0.95 | 0.47 | 8.0 |
| 4155 + 1/2 | 47.55 | 0.05 | 12.8 | 1.12 | 1.12 | 1.00 | 0.99 | 0.99 | 0.054 | 2.19 | 9,0 | 51.5 | 56.0 | 0.51 | 0.94 | 0.47 | 8.0 |
| 4156 | 47.79 | 0.05 | 12.7 | 1.14 | 1.13 | 1.01 | 1.01 | 1.01 | 0.050 | 2.06 | 9,0 | 55.3 | 59.5 | 0.50 | 0.94 | 0.46 | 8.0 |
| 4156 + 1/2 | 48.14 | 0.03 | 12.7 | 1.13 | 1.14 | 0.99 | 0.99 | 0.99 | 0.056 | 2.05 | 0,2 | 59.4 | 62.8 | 0.50 | 0.97 | 0.46 | 8.0 |
| 4157 | 48.55 | 0.01 | 12.8 | 1.14 | 1.14 | 1.00 | 1.02 | 1.00 | 0.052 | 2.04 | 12,0 | 63.5 | 67.2 | 0.50 | 1.05 | 0.46 | 8.0 |
| 4157 + 1/2 | 48.98 | 0.04 | 12.8 | 1.15 | 1.15 | 1.00 | 0.99 | 0.99 | 0.069 | 1.83 | 0,2 | 67.3 | 72.1 | 0.50 | 1.04 | 0.46 | 8.0 |
| 4158 | 49.33 | 0.07 | 13.0 | 1.17 | 1.17 | 1.00 | 0.98 | 0.98 | 0.067 | 1.83 | 9,1 | 71.0 | 77.0 | 0.50 | 1.15 | 0.46 | 8.0 |
| 4158 + 1/2 | 49.54 | 0.06 | 13.0 | 1.19 | 1.18 | 1.01 | 1.01 | 1.01 | 0.060 | 2.01 | 9,1 | 74.6 | 81.2 | 0.49 | 1.21 | 0.45 | 8.0 |
| 4159 | 49.64 | 0.04 | 12.9 | 1.20 | 1.20 | 1.00 | 1.00 | 1.00 | 0.083 | 2.02 | 9,1 | 78.1 | 85.2 | 0.49 | 1.20 | 0.45 | 8.0 |
| 4159 + 1/2 | 49.65 | 0.03 | 13.1 | 1.22 | 1.21 | 1.00 | 0.99 | 0.99 | 0.087 | 2.05 | 9,1 | 81.2 | 88.3 | 0.49 | 1.19 | 0.44 | 8.0 |
| 4160 | 49.61 | 0.02 | 13.1 | 1.22 | 1.23 | 0.99 | 1.00 | 0.99 | 0.069 | 1.96 | 9,1 | 84.0 | 90.7 | 0.48 | 1.14 | 0.44 | 8.0 |
| 4160 + 1/2 | 49.51 | 0.00 | 12.8 | 1.24 | 1.24 | 1.00 | 1.01 | 1.00 | 0.087 | 1.85 | 9,1 | 86.3 | 93.0 | 0.47 | 1.10 | 0.42 | 8.0 |
| 4161 | 49.42 | 0.02 | 13.0 | 1.25 | 1.26 | 0.99 | 1.02 | 0.99 | 0.061 | 2.03 | 13,2 | 87.9 | 94.5 | 0.46 | 1.03 | 0.41 | 8.0 |
| 4161 + 1/2 | 49.36 | 0.02 | 13.3 | 1.28 | 1.27 | 1.01 | 1.02 | 1.01 | 0.071 | 1.87 | 15,2 | 89.5 | 96.6 | 0.45 | 0.93 | 0.40 | 8.0 |
| 4162 | 49.34 | 0.02 | 13.1 | 1.29 | 1.29 | 1.00 | 1.02 | 1.00 | 0.068 | 1.98 | 13,2 | 90.7 | 97.5 | 0.45 | 0.98 | 0.39 | 8.0 |
| 4162 + 1/2 | 49.37 | 0.03 | 13.3 | 1.30 | 1.29 | 1.01 | 0.98 | 0.98 | 0.091 | 1.78 | 13,2 | 91.6 | 97.9 | 0.44 | 0.99 | 0.37 | 8.0 |
| 4163 | 49.46 | 0.02 | 13.4 | 1.30 | 1.32 | 0.99 | 0.99 | 0.99 | 0.078 | 1.70 | 13,2 | 91.7 | 98.3 | 0.43 | 1.03 | 0.25 | 8.0 |
| 4163 + 1/2 | 49.60 | 0.03 | 13.1 | 1.33 | 1.32 | 1.00 | 1.03 | 1.00 | 0.074 | 1.59 | 10,2 | 89.9 | 97.6 | 0.43 | 1.19 | 0.24 | 8.0 |
| 4164 | 49.79 | 0.03 | 13.4 | 1.34 | 1.34 | 1.00 | 0.96 | 0.96 | 0.106 | 1.61 | 11,2 | 88.5 | 97.0 | 0.41 | 1.20 | 0.22 | 8.0 |
| 4164 + 1/2 | 50.04 | 0.03 | 13.3 | 1.35 | 1.36 | 0.99 | 0.99 | 0.99 | 0.087 | 1.72 | 11,2 | 87.5 | 96.1 | 0.41 | 1.11 | 0.32 | 8.0 |
| 4165 | 50.35 | 0.03 | 13.3 | 1.37 | 1.36 | 1.00 | 0.99 | 0.99 | 0.086 | 1.84 | 11,2 | 86.5 | 94.3 | 0.41 | 1.21 | 0.32 | 8.0 |
| 4165 + 1/2 | 50.71 | 0.03 | 13.4 | 1.38 | 1.39 | 0.99 | 1.01 | 0.99 | 0.071 | 1.87 | 14,3 | 85.3 | 92.0 | 0.40 | 1.26 | 0.31 | 8.0 |
| 4166 | 51.14 | 0.04 | 13.5 | 1.42 | 1.40 | 1.01 | 1.04 | 1.01 | 0.057 | 2.09 | 14,3 | 83.1 | 88.8 | 0.39 | 1.34 | 0.30 | 8.0 |
| 4166 + 1/2 | 51.64 | 0.02 | 13.5 | 1.43 | 1.43 | 1.00 | 0.96 | 0.96 | 0.076 | 2.10 | 15,3 | 80.9 | 85.5 | 0.38 | 1.36 | 0.29 | 8.0 |
| 4167 | 52.19 | 0.02 | 13.6 | 1.44 | 1.44 | 1.00 | 1.00 | 1.00 | 0.057 | 1.87 | 13,3 | 79.0 | 82.5 | 0.38 | 1.40 | 0.28 | 8.0 |
| 4167 + 1/2 | 52.78 | 0.00 | 13.7 | 1.46 | 1.46 | 1.00 | 1.00 | 1.00 | 0.057 | 1.85 | 13,3 | 76.8 | 83.5 | 0.37 | 1.38 | 0.27 | 8.0 |
| 4168 | 53.38 | 0.01 | 13.7 | 1.48 | 1.47 | 1.01 | 1.01 | 1.01 | 0.056 | 1.84 | 15,4 | 75.6 | 84.4 | 0.36 | 1.25 | 0.18 | 8.0 |
| 4168 + 1/2 | 53.96 | 0.02 | 13.6 | 1.48 | 1.50 | 0.99 | 0.99 | 0.99 | 0.056 | 1.99 | 15,4 | 75.9 | 85.0 | 0.35 | 1.32 | 0.18 | 8.0 |
| 4169 | 54.52 | 0.04 | 13.9 | 1.52 | 1.52 | 1.00 | 1.02 | 1.00 | 0.049 | 2.10 | 15,4 | 75.9 | 85.2 | 0.35 | 1.35 | 0.18 | 8.0 |
| 4169 + 1/2 | 54.99 | 0.05 | 13.8 | 1.56 | 1.56 | 1.00 | 1.05 | 1.00 | 0.031 | 2.20 | 15,4 | 75.7 | 85.2 | 0.35 | 1.45 | 0.19 | 8.0 |
| 4170 | 55.37 | 0.03 | 13.9 | 1.60 | 1.60 | 1.00 | 0.95 | 0.95 | 0.075 | 2.25 | 14,1 | 75.1 | 84.7 | 0.34 | 1.35 | 0.18 | 8.0 |
| 4170 + 1/2 | 55.68 | 0.01 | 13.7 | 1.63 | 1.65 | 0.99 | 0.99 | 0.99 | 0.060 | 2.49 | 14,1 | 74.5 | 84.0 | 0.34 | 1.34 | 0.18 | 8.0 |
| 4171 | 55.97 | 0.01 | 13.8 | 1.70 | 1.68 | 1.01 | 1.02 | 1.01 | 0.074 | 2.55 | 14,1 | 73.7 | 82.7 | 0.33 | 1.45 | 0.18 | 8.0 |
| 4171 + 1/2 | 56.23 | 0.02 | 13.8 | 1.73 | 1.73 | 1.00 | 1.01 | 1.00 | 0.081 | 2.44 | 14,1 | 72.4 | 80.8 | 0.33 | 1.30 | 0.18 | 8.0 |
| 4172 | 56.46 | 0.03 | 13.9 | 1.78 | 1.73 | 1.03 | 0.97 | 0.97 | 0.096 | 2.59 | 13,1 | 70.8 | 78.7 | 0.32 | 1.38 | 0.18 | 8.0 |
| 4172 + 1/2 | 56.62 | 0.02 | 13.9 | 1.82 | 1.73 | 1.05 | 1.03 | 1.03 | 0.087 | 2.74 | 13,1 | 69.2 | 75.8 | 0.32 | 1.35 | 0.18 | 8.0 |
| 4173 | 56.75 | 0.01 | 14.0 | 1.83 | 1.73 | 1.06 | 1.03 | 1.03 | 0.089 | 2.94 | 13,1 | 67.4 | 72.8 | 0.31 | 1.29 | 0.18 | 8.0 |
| 4173 + 1/2 | 56.86 | 0.02 | 14.0 | 1.85 | 1.73 | 1.07 | 1.03 | 1.03 | 0.087 | 3.11 | 13,1 | 66.3 | 69.7 | 0.31 | 1.36 | 0.17 | 8.0 |
| 4174 | 56.93 | 0.01 | 13.9 | 1.89 | 1.73 | 1.09 | 1.09 | 1.09 | 0.083 | 3.63 | 13,1 | 64.5 | 66.9 | 0.30 | 1.26 | 0.18 | 8.0 |
| 4174 + 1/2 | 56.99 | 0.01 | 14.1 | 1.93 | 1.73 | 1.11 | 1.08 | 1.08 | 0.082 | 3.80 | 13,1 | 62.6 | 66.2 | 0.30 | 1.31 | 0.17 | 8.0 |
| 4175 | 57.03 | 0.01 | 14.1 | 1.92 | 1.73 | 1.11 | 1.13 | 1.11 | 0.065 | 3.47 | 13,1 | 61.0 | 65.5 | 0.30 | 1.24 | 0.18 | 8.0 |
| 4175 + 1/2 | 57.04 | 0.01 | 14.1 | 1.89 | 1.73 | 1.09 | 1.09 | 1.09 | 0.079 | 2.95 | 13,1 | 59.8 | 64.3 | 0.30 | 1.60 | 0.17 | 8.0 |
| 4176 | 57.04 | 0.00 | 14.1 | 1.94 | 1.73 | 1.12 | 1.17 | 1.12 | 0.064 | 2.81 | 12,1 | 58.6 | 63.0 | 0.30 | 1.10 | 0.17 | 8.0 |
| 4176 + 1/2 | 57.05 | 0.00 | 14.3 | 1.89 | 1.73 | 1.09 | 1.13 | 1.09 | 0.052 | 2.46 | 11,1 | 57.3 | 61.6 | 0.30 | 1.15 | 0.17 | 8.0 |
| 4177 | 57.05 | 0.00 | 14.4 | 1.87 | 1.73 | 1.08 | 1.13 | 1.08 | 0.035 | 2.39 | 14,3 | 55.7 | 59.7 | 0.30 | 1.04 | 0.17 | 8.0 |
| 4177 + 1/2 | 57.05 | 0.00 | 14.5 | 1.85 | 1.73 | 1.07 | 1.13 | 1.07 | 0.038 | 2.75 | 12,1 | 54.1 | 57.7 | 0.29 | 1.25 | 0.16 | 8.0 |
| 4178 | 57.04 | 0.00 | 13.9 | 1.84 | 1.73 | 1.06 | 1.12 | 1.06 | 0.045 | 2.66 | 12,1 | 52.4 | 55.7 | 0.30 | 1.02 | 0.16 | 8.0 |
| 4178 + 1/2 | 57.02 | 0.00 | 14.0 | 1.83 | 1.73 | 1.06 | 1.13 | 1.06 | 0.039 | 2.31 | 13,2 | 50.5 | 53.6 | 0.30 | 1.14 | 0.15 | 8.0 |
| 4179 | 57.00 | 0.00 | 13.4 | 1.81 | 1.73 | 1.05 | 1.10 | 1.05 | 0.040 | 2.02 | 14,3 | 48.5 | 51.5 | 0.30 | 1.12 | 0.14 | 8.0 |
| 4179 + 1/2 | 56.98 | 0.01 | 13.2 | 1.77 | 1.73 | 1.02 | 1.04 | 1.02 | 0.055 | 2.10 | 12,2 | 46.9 | 49.5 | 0.30 | 1.20 | 0.13 | 8.0 |
| 4180 | 56.93 | 0.01 | 12.9 | 1.73 | 1.72 | 1.00 | 1.03 | 1.00 | 0.044 | 1.96 | 12,2 | 45.2 | 47.3 | 0.30 | 1.08 | 0.13 | 8.0 |
| 4180 + 1/2 | 56.87 | 0.00 | 12.6 | 1.68 | 1.68 | 1.00 | 1.02 | 1.00 | 0.046 | 1.90 | 13,3 | 43.6 | 45.5 | 0.30 | 1.09 | 0.13 | 8.0 |
| 4181 | 56.80 | 0.00 | 12.1 | 1.62 | 1.65 | 0.99 | 0.95 | 0.95 | 0.056 | 1.54 | 13,3 | 42.2 | 44.4 | 0.31 | 1.09 | 0.12 | 8.0 |
| 4181 + 1/2 | 56.72 | 0.00 | 12.0 | 1.60 | 1.62 | 0.99 | 0.98 | 0.98 | 0.050 | 1.36 | 11,7 | 40.8 | 42.9 | 0.31 | 1.19 | 0.12 | 8.0 |
| 4182 | 56.63 | 0.00 | 11.3 | 1.61 | 1.59 | 1.01 | 0.99 | 0.99 | 0.055 | 2.03 | 14,4 | 39.2 | 41.5 | 0.31 | 1.12 | 0.11 | 8.0 |
| 4182 + 1/2 | 56.54 | 0.00 | 11.1 | 1.58 | 1.59 | 0.99 | 0.99 | 0.99 | 0.041 | 1.38 | 9,6 | 37.7 | 39.9 | 0.30 | 1.20 | 0.10 | 8.0 |
| 4183 | 56.45 | 0.00 | 10.9 | 1.58 | 1.58 | 1.00 | 0.98 | 0.98 | 0.058 | 1.41 | 6,1 | 36.0 | 38.2 | 0.31 | 1.40 | 0.10 | 8.0 |
| 4183 + 1/2 | 56.36 | 0.00 | 10.5 | 1.58 | 1.57 | 1.00 | 1.03 | 1.00 | 0.032 | 1.62 | 14,4 | 34.3 | 36.6 | 0.31 | 1.31 | 0.09 | 8.0 |
| 4184 | 56.28 | 0.00 | 10.0 | 1.56 | 1.57 | 1.00 | 1.02 | 1.00 | 0.032 | 1.59 | 14,4 | 32.5 | 34.7 | 0.31 | 1.34 | 0.09 | 8.0 |
| 4184 + 1/2 | 56.20 | 0.00 | 9.7 | 1.56 | 1.54 | 1.01 | 1.03 | 1.01 | 0.032 | 1.43 | 10,2 | 30.6 | 32.9 | 0.31 | 1.39 | 0.08 | 8.0 |
| 4185 | 56.13 | 0.00 | 9.0 | 1.52 | 1.54 | 0.99 | 0.99 | 0.99 | 0.049 | 1.42 | 10,2 | 28.7 | 31.0 | 0.31 | 1.04 | 0.07 | 8.0 |
| 4185 + 1/2 | 56.06 | 0.00 | 8.9 | 1.51 | 1.52 | 1.00 | 0.98 | 0.98 | 0.042 | 1.36 | 10,2 | 26.7 | 28.9 | 0.32 | 1.05 | 0.07 | 8.0 |
| 4186 | 55.98 | 0.00 | 8.5 | 1.52 | 1.49 | 1.02 | 1.07 | 1.02 | 0.032 | 1.35 | 10,2 | 24.8 | 26.9 | 0.32 | 1.13 | 0.06 | 8.0 |
| 4186 + 1/2 | 55.92 | 0.00 | 8.2 | 1.47 | 1.48 | 0.99 | 0.94 | 0.94 | 0.068 | 1.33 | 15,3 | 22.7 | 24.9 | 0.33 | 1.03 | 0.05 | 8.0 |
| 4187 | 55.85 | 0.00 | 7.8 | 1.45 | 1.44 | 1.01 | 1.00 | 1.00 | 0.049 | 1.30 | 15,3 | 20.8 | 22.8 | 0.32 | 0.63 | 0.04 | 8.0 |
| 4187 + 1/2 | 55.78 | 0.00 | 7.5 | 1.41 | 1.41 | 1.00 | 0.99 | 0.99 | 0.043 | 1.42 | 14,5 | 18.7 | 20.6 | 0.32 | 0.35 | 0.24 | 8.0 |
| 4188 | 55.71 | 0.00 | 7.0 | 1.37 | 1.37 | 1.00 | 0.97 | 0.97 | 0.040 | 1.34 | 12,1 | 16.7 | 18.5 | 0.33 | 0.33 | 0.24 | 8.2 |
| 4188 + 1/2 | 55.65 | 0.00 | 6.7 | 1.33 | 1.34 | 0.99 | 0.98 | 0.98 | 0.025 | 1.47 | 14,5 | 14.7 | 16.6 | 0.33 | 0.32 | 0.24 | 8.8 |
| 4189 | 55.59 | 0.00 | 6.4 | 1.29 | 1.32 | 0.98 | 0.99 | 0.98 | 0.028 | 1.37 | 13,5 | 12.9 | 14.7 | 0.33 | 0.33 | 0.25 | 8.8 |
| 4189 + 1/2 | 55.54 | 0.00 | 6.2 | 1.28 | 1.31 | 0.98 | 0.94 | 0.94 | 0.028 | 1.46 | 4,2 | 11.1 | 12.9 | 0.32 | 0.32 | 0.25 | 8.7 |
| 4190 | 55.49 | 0.00 | 5.8 | 1.31 | 1.30 | 1.01 | 1.02 | 1.01 | 0.039 | 1.64 | 4,2 | 9.4 | 11.2 | 0.32 | 0.31 | 0.25 | 8.7 |
| 4190 + 1/2 | 55.45 | 0.00 | 5.5 | 1.28 | 1.30 | 0.98 | 0.97 | 0.97 | 0.031 | 1.67 | 4,2 | 7.8 | 9.6 | 0.34 | 0.29 | 0.26 | 8.7 |
| 4191 | 55.42 | 0.00 | 5.2 | 1.31 | 1.28 | 1.03 | 1.03 | 1.03 | 0.013 | 1.65 | 10,3 | 6.3 | 8.0 | 0.35 | 0.29 | 0.27 | 8.7 |
| 4191 + 1/2 | 55.39 | 0.00 | 4.7 | 1.31 | 1.27 | 1.03 | 1.05 | 1.03 | 0.010 | 1.81 | 4,2 | 5.4 | 6.6 | 0.35 | 0.29 | 0.27 | 8.7 |
| 4192 | 55.36 | 0.00 | 4.4 | 1.27 | 1.26 | 1.01 | 1.03 | 1.01 | 0.015 | 1.71 | 10,3 | 5.7 | 6.6 | 0.35 | 0.30 | 0.27 | 8.7 |
| 4192 + 1/2 | 55.34 | 0.00 | 4.2 | 1.25 | 1.25 | 1.01 | 1.04 | 1.01 | 0.005 | 1.84 | 11,4 | 6.4 | 7.4 | 0.35 | 0.29 | 0.27 | 8.7 |
| 4193 | 55.32 | 0.00 | 3.7 | 1.22 | 1.20 | 1.01 | 1.04 | 1.01 | 0.000 | 2.16 | 14,0 | 7.0 | 8.1 | 0.35 | 0.29 | 0.27 | 8.7 |
| 4193 + 1/2 | 55.30 | 0.00 | 3.7 | 1.16 | 1.15 | 1.00 | 1.01 | 1.00 | 0.019 | 1.84 | 11,4 | 7.5 | 8.7 | 0.35 | 0.31 | 0.27 | 8.7 |
| 4194 | 55.29 | 0.00 | 3.4 | 1.09 | 1.08 | 1.01 | 1.01 | 1.01 | 0.011 | 1.84 | 15,1 | 8.0 | 9.2 | 0.35 | 0.32 | 0.27 | 8.7 |
| 4194 + 1/2 | 55.27 | 0.00 | 3.3 | 1.00 | 1.00 | 1.01 | 1.00 | 1.00 | 0.022 | 1.74 | 15,1 | 8.4 | 9.6 | 0.36 | 0.35 | 0.27 | 8.7 |
| 4195 | 55.26 | 0.00 | 3.0 | 0.91 | 0.90 | 1.01 | 1.01 | 1.01 | 0.016 | 1.64 | 14,0 | 8.7 | 9.8 | 0.37 | 0.37 | 0.27 | 8.0 |
| 4195 + 1/2 | 55.25 | 0.00 | 2.8 | 0.79 | 0.79 | 1.00 | 1.00 | 1.00 | 0.008 | 1.41 | 14,0 | 8.9 | 10.1 | 0.37 | 0.37 | 0.27 | 8.0 |
| 4196 | 55.24 | 0.00 | 2.6 | 0.68 | 0.72 | 0.94 | 0.94 | 0.94 | 0.009 | 1.38 | 6,8 | 9.1 | 10.3 | 0.38 | 0.38 | 0.27 | 8.0 |
| 4196 + 1/2 | 55.24 | 0.00 | 2.4 | 0.59 | 0.66 | 0.89 | 0.89 | 0.89 | 0.007 | 1.33 | 2,5 | 9.1 | 10.2 | 0.37 | 0.39 | 0.27 | 8.0 |
| 4197 | 55.23 | 0.00 | 2.1 | 0.53 | 0.64 | 0.82 | 0.80 | 0.80 | 0.031 | 1.25 | 4,6 | 9.1 | 10.1 | 0.37 | 0.38 | 0.27 | 8.0 |
| 4197 + 1/2 | 55.23 | 0.00 | 1.9 | 0.53 | 0.64 | 0.82 | 0.82 | 0.82 | 0.012 | 1.21 | 3,5 | 9.1 | 10.2 | 0.38 | 0.37 | 0.27 | 8.0 |
| 4198 | 55.24 | 0.00 | 1.8 | 0.56 | 0.64 | 0.87 | 0.87 | 0.87 | 0.005 | 1.09 | 2,4 | 9.1 | 10.1 | 0.38 | 0.37 | 0.27 | 8.0 |
| 4198 + 1/2 | 55.24 | 0.00 | 1.7 | 0.60 | 0.64 | 0.93 | 0.94 | 0.93 | 0.005 | 1.16 | 3,6 | 9.2 | 10.1 | 0.38 | 0.36 | 0.27 | 8.0 |
| 4199 last | 55.24 | 0.00 | 1.6 | 0.62 | 0.64 | 0.97 | 0.97 | 0.97 | 0.001 | 1.18 | 11,4 | 9.1 | 10.0 | 0.38 | 0.33 | 0.27 | 8.0 |
| 4199 + 1/2 | 55.25 | 0.00 | 1.6 | 0.63 | 0.64 | 0.99 | 0.99 | 0.99 | 0.008 | 1.15 | 3,5 | 9.1 | 9.9 | 0.38 | 0.32 | 0.27 | 8.0 |
| 4200 | 55.25 | 0.00 | 1.6 | 0.63 | 0.64 | 0.98 | 0.98 | 0.98 | 0.008 | 1.09 | 6,2 | 9.0 | 9.9 | 0.38 | 0.31 | 0.27 | 8.0 |
| 4200 + 1/2 | 55.26 | 0.00 | 1.6 | 0.63 | 0.64 | 0.99 | 0.98 | 0.98 | 0.016 | 1.09 | 12,5 | 9.0 | 9.8 | 0.38 | 0.28 | 0.28 | 8.0 |
| 4201 | 55.26 | 0.00 | 1.6 | 0.63 | 0.64 | 0.99 | 0.99 | 0.99 | 0.002 | 1.15 | 0,4 | 9.0 | 9.8 | 0.39 | 0.27 | 0.28 | 8.0 |
| 4201 + 1/2 | 55.27 | 0.00 | 1.6 | 0.64 | 0.64 | 1.00 | 1.00 | 1.00 | 0.001 | 1.22 | 9,7 | 9.0 | 9.8 | 0.38 | 0.26 | 0.28 | 8.0 |
| 4202 | 55.27 | 0.00 | 1.6 | 0.64 | 0.64 | 1.00 | 1.00 | 1.00 | 0.004 | 1.25 | 11,4 | 9.0 | 9.7 | 0.37 | 0.26 | 0.28 | 8.0 |
| 4202 + 1/2 | 55.28 | 0.00 | 1.7 | 0.64 | 0.64 | 1.00 | 1.00 | 1.00 | 0.011 | 1.14 | 11,4 | 9.0 | 9.6 | 0.37 | 0.25 | 0.28 | 8.0 |
| 4203 | 55.29 | 0.00 | 1.5 | 0.64 | 0.64 | 1.01 | 1.00 | 1.00 | 0.014 | 1.17 | 9,7 | 8.9 | 9.5 | 0.37 | 0.24 | 0.28 | 8.0 |
| 4203 + 1/2 | 55.29 | 0.00 | 1.6 | 0.64 | 0.64 | 1.01 | 1.01 | 1.01 | 0.004 | 1.39 | 9,7 | 8.8 | 9.3 | 0.38 | 0.24 | 0.29 | 8.0 |
| 4204 | 55.30 | 0.00 | 1.6 | 0.64 | 0.64 | 1.00 | 1.00 | 1.00 | 0.017 | 1.14 | 6,0 |  |  |  |  |  |  |
| 4204 + 1/2 | 55.30 | 0.00 | 1.6 | 0.64 | 0.64 | 1.00 | 0.99 | 0.99 | 0.030 | 1.24 | 6,0 |  |  |  |  |  |  |
| 4205 | 55.31 | 0.00 | 1.5 | 0.65 | 0.64 | 1.01 | 1.01 | 1.01 | 0.007 | 1.19 | 13,8 |  |  |  |  |  |  |
| 4205 + 1/2 | 55.32 | 0.00 | 1.6 | 0.64 | 0.64 | 1.00 | 1.01 | 1.00 | 0.003 | 1.16 | 6,0 |  |  |  |  |  |  |
| 4206 | 55.32 | 0.00 | 1.7 | 0.64 | 0.64 | 0.99 | 0.99 | 0.99 | 0.008 | 1.10 | 15,2 |  |  |  |  |  |  |
| 4206 + 1/2 | 55.33 | 0.00 | 1.5 | 0.64 | 0.64 | 0.99 | 1.00 | 0.99 | 0.000 | 1.33 | 9,7 |  |  |  |  |  |  |
| 4207 | 55.33 | 0.00 | 1.6 | 0.64 | 0.64 | 0.99 | 0.99 | 0.99 | 0.013 | 1.13 | 1,5 |  |  |  |  |  |  |
| 4207 + 1/2 | 55.34 | 0.00 | 1.6 | 0.64 | 0.64 | 1.00 | 1.00 | 1.00 | 0.007 | 1.10 | 13,1 |  |  |  |  |  |  |
| 4208 | 55.35 | 0.00 | 1.6 | 0.64 | 0.64 | 0.99 | 0.99 | 0.99 | 0.011 | 1.12 | 9,8 |  |  |  |  |  |  |
| 4208 + 1/2 | 55.36 | 0.00 | 1.6 | 0.64 | 0.64 | 1.00 | 1.00 | 1.00 | 0.001 | 1.14 | 3,8 |  |  |  |  |  |  |
| 4209 | 55.37 | 0.00 | 1.7 | 0.65 | 0.64 | 1.01 | 1.00 | 1.00 | 0.025 | 1.19 | 6,0 |  |  |  |  |  |  |
| 4209 + 1/2 | 55.38 | 0.00 | 1.7 | 0.64 | 0.64 | 1.00 | 0.99 | 0.99 | 0.016 | 1.20 | 6,0 |  |  |  |  |  |  |
| 4210 | 55.39 | 0.00 | 1.7 | 0.65 | 0.64 | 1.02 | 1.01 | 1.01 | 0.014 | 1.21 | 2,5 |  |  |  |  |  |  |
| 4210 + 1/2 | 55.40 | 0.00 | 1.6 | 0.65 | 0.65 | 1.00 | 1.00 | 1.00 | 0.023 | 1.16 | 6,0 |  |  |  |  |  |  |
| 4211 | 55.41 | 0.00 | 1.7 | 0.65 | 0.65 | 1.00 | 1.00 | 1.00 | 0.010 | 1.11 | 1,0 |  |  |  |  |  |  |
| 4211 + 1/2 | 55.42 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### dive, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.13 from frame 4120 to the next, limit 1.2.
Largest pop score of one block: 12.36 from frame 4135 to the next, block column 13 row 8 from the top left, shown, not judged.
Largest change in place: 87.6 from frame 4162 + 1/2 to 8 film frames later, most at pixel 1220, 264, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 4200 to 4211 + 1/2): change 11.2; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.047 from frame 4196 + 1/2 to the next, most at pixel 1366, 974, a patch of 112 by 112 px; 0 of 227 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 228 rows, which says nothing of them, quiet or not: frame 4211 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 4119 in /home/user/workspace/work/p6/hu9/01/uranus-dive-p1of2-pops-full.png, frame 4119 + 1/2 in /home/user/workspace/work/p6/hu9/01/uranus-dive-p1of2-pops-full.png, frame 4120 in /home/user/workspace/work/p6/hu9/01/uranus-dive-p1of2-pops-full.png, frame 4121 in /home/user/workspace/work/p6/hu9/01/uranus-dive-p1of2-pops-full.png, frame 4196 + 1/2 in /home/user/workspace/work/p6/hu9/02/uranus-dive-p2of2-pops-full.png.

With the carry at the full size the dive has 1 number over the limit or not measured.

- FULL SIZE RED the pattern of the picture changes in place by 1.60 from frame 4175 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (93 frames over it, first 4139)

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4098 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 5,6 | 0.5 | 0.6 | 0.17 | 1.00 | 0.237 | 0.239 | 0.950 | 0.175 | 1070,474 | 124 by 88 |
| 4098 + 1/2 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 8,8 | 0.5 | 0.6 | 0.17 | 1.00 | 0.240 | 0.238 | 0.959 | 0.175 | 834,770 | 100 by 88 |
| 4099 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 0,2 | 0.6 | 0.7 | 0.17 | 1.00 | 0.238 | 0.239 | 0.954 | 0.175 | 1030,706 | 132 by 104 |
| 4099 + 1/2 | 0.5 | 0.31 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 3,1 | 0.5 | 0.6 | 0.17 | 1.00 | 0.239 | 0.239 | 0.955 | 0.175 | 902,618 | 128 by 104 |
| 4100 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 5,1 | 0.6 | 0.7 | 0.17 | 0.99 | 0.239 | 0.239 | 0.955 | 0.175 | 1178,782 | 156 by 120 |
| 4100 + 1/2 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 14,3 | 0.6 | 0.7 | 0.17 | 1.00 | 0.241 | 0.239 | 0.966 | 0.175 | 1014,686 | 136 by 128 |
| 4101 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 11,0 | 0.6 | 0.7 | 0.17 | 1.01 | 0.238 | 0.239 | 0.952 | 0.175 | 1210,662 | 204 by 200 |
| 4101 + 1/2 | 0.5 | 0.31 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 12,6 | 0.6 | 0.7 | 0.17 | 1.01 | 0.239 | 0.238 | 0.955 | 0.175 | 1038,446 | 184 by 208 |
| 4102 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 0,1 | 0.6 | 0.8 | 0.17 | 1.00 | 0.239 | 0.238 | 0.955 | 0.175 | 846,822 | 84 by 80 |
| 4102 + 1/2 | 0.5 | 0.31 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 8,1 | 0.6 | 0.7 | 0.17 | 1.00 | 0.238 | 0.239 | 0.951 | 0.175 | 1190,490 | 172 by 192 |
| 4103 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 4,8 | 0.6 | 0.8 | 0.17 | 1.00 | 0.237 | 0.239 | 0.950 | 0.175 | 982,654 | 108 by 176 |
| 4103 + 1/2 | 0.5 | 0.31 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 10,7 | 0.6 | 0.7 | 0.17 | 1.00 | 0.239 | 0.238 | 0.957 | 0.175 | 926,726 | 468 by 236 |
| 4104 | 0.5 | 0.31 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 0,3 | 0.6 | 0.7 | 0.17 | 1.00 | 0.239 | 0.239 | 0.954 | 0.175 | 882,666 | 140 by 264 |
| 4104 + 1/2 | 0.5 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 6,2 | 0.6 | 0.7 | 0.17 | 1.00 | 0.238 | 0.239 | 0.953 | 0.175 | 1190,386 | 168 by 144 |
| 4105 | 0.5 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 0,3 | 0.6 | 0.7 | 0.17 | 0.99 | 0.240 | 0.239 | 0.961 | 0.175 | 1110,314 | 100 by 112 |
| 4105 + 1/2 | 0.5 | 0.30 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 1,3 | 0.6 | 0.8 | 0.17 | 0.99 | 0.239 | 0.240 | 0.955 | 0.175 | 942,690 | 128 by 188 |
| 4106 | 0.5 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 10,7 | 0.6 | 0.7 | 0.17 | 0.99 | 0.241 | 0.239 | 0.962 | 0.175 | 1074,734 | 132 by 228 |
| 4106 + 1/2 | 0.5 | 0.30 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 0,3 | 0.7 | 0.8 | 0.17 | 1.00 | 0.240 | 0.238 | 0.958 | 0.175 | 826,674 | 216 by 152 |
| 4107 | 0.5 | 0.30 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 5,0 | 0.7 | 0.8 | 0.17 | 0.99 | 0.238 | 0.240 | 0.953 | 0.175 | 1134,618 | 156 by 180 |
| 4107 + 1/2 | 0.5 | 0.30 | 0.31 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 0,8 | 0.7 | 0.8 | 0.17 | 1.00 | 0.238 | 0.239 | 0.953 | 0.175 | 1190,538 | 68 by 68 |
| 4108 | 0.5 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 14,2 | 0.7 | 1.0 | 0.17 | 1.00 | 0.241 | 0.238 | 0.962 | 0.176 | 1110,590 | 80 by 92 |
| 4108 + 1/2 | 0.5 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.05 | 13,7 | 0.8 | 1.2 | 0.17 | 0.99 | 0.238 | 0.240 | 0.953 | 0.176 | 1070,670 | 260 by 340 |
| 4109 | 0.5 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.05 | 2,5 | 0.8 | 1.3 | 0.17 | 0.99 | 0.239 | 0.240 | 0.957 | 0.176 | 838,694 | 344 by 340 |
| 4109 + 1/2 | 0.5 | 0.31 | 0.31 | 0.99 | 0.99 | 0.99 | 0.000 | 1.07 | 13,8 | 0.9 | 1.4 | 0.17 | 0.98 | 0.240 | 0.239 | 0.961 | 0.176 | 1226,782 | 316 by 164 |
| 4110 | 0.5 | 0.31 | 0.32 | 0.98 | 0.98 | 0.98 | 0.000 | 1.05 | 7,8 | 1.1 | 1.5 | 0.17 | 0.94 | 0.239 | 0.240 | 0.958 | 0.176 | 1170,674 | 140 by 96 |
| 4110 + 1/2 | 0.6 | 0.33 | 0.34 | 0.97 | 0.97 | 0.97 | 0.000 | 1.15 | 1,1 | 1.2 | 1.9 | 0.17 | 0.95 | 0.240 | 0.241 | 0.961 | 0.176 | 906,710 | 68 by 76 |
| 4111 | 0.9 | 0.37 | 0.37 | 0.99 | 0.99 | 0.99 | 0.000 | 1.15 | 13,2 | 1.4 | 2.9 | 0.17 | 1.00 | 0.243 | 0.241 | 0.972 | 0.176 | 1202,742 | 336 by 204 |
| 4111 + 1/2 | 1.2 | 0.41 | 0.42 | 0.98 | 0.98 | 0.98 | 0.000 | 1.27 | 6,2 | 1.5 | 3.1 | 0.17 | 1.03 | 0.242 | 0.243 | 0.967 | 0.176 | 938,646 | 136 by 148 |
| 4112 | 1.8 | 0.48 | 0.49 | 0.98 | 0.98 | 0.98 | 0.000 | 1.51 | 6,2 | 1.5 | 2.4 | 0.17 | 1.04 | 0.244 | 0.244 | 0.974 | 0.176 | 1230,366 | 80 by 116 |
| 4112 + 1/2 | 2.5 | 0.56 | 0.56 | 1.01 | 1.01 | 1.01 | 0.000 | 1.90 | 5,4 | 1.9 | 4.3 | 0.17 | 1.01 | 0.244 | 0.245 | 0.977 | 0.177 | 1138,458 | 116 by 96 |
| 4113 | 3.1 | 0.64 | 0.63 | 1.01 | 1.01 | 1.01 | 0.000 | 2.11 | 5,4 | 1.7 | 3.0 | 0.17 | 0.97 | 0.246 | 0.247 | 0.985 | 0.177 | 1022,310 | 96 by 72 |
| 4113 + 1/2 | 3.8 | 0.71 | 0.70 | 1.01 | 1.03 | 1.01 | 0.000 | 2.50 | 6,2 | 1.8 | 3.1 | 0.17 | 1.00 | 0.251 | 0.248 | 1.002 | 0.178 | 742,730 | 80 by 104 |
| 4114 | 4.5 | 0.76 | 0.76 | 1.00 | 1.00 | 1.00 | 0.003 | 2.61 | 6,2 | 1.9 | 2.7 | 0.17 | 1.02 | 0.249 | 0.251 | 0.992 | 0.179 | 894,686 | 128 by 112 |
| 4114 + 1/2 | 5.2 | 0.81 | 0.80 | 1.01 | 0.99 | 0.99 | 0.006 | 2.67 | 6,2 | 1.9 | 2.7 | 0.18 | 1.04 | 0.252 | 0.252 | 1.004 | 0.180 | 1114,278 | 88 by 76 |
| 4115 | 5.8 | 0.85 | 0.85 | 1.00 | 1.00 | 1.00 | 0.005 | 2.17 | 6,2 | 2.0 | 3.1 | 0.18 | 1.02 | 0.256 | 0.252 | 1.013 | 0.182 | 1186,326 | 124 by 84 |
| 4115 + 1/2 | 6.4 | 0.88 | 0.88 | 1.00 | 1.04 | 1.00 | 0.000 | 2.05 | 5,3 | 2.1 | 3.2 | 0.18 | 0.98 | 0.252 | 0.256 | 0.985 | 0.183 | 1074,262 | 120 by 128 |
| 4116 | 7.0 | 0.92 | 0.92 | 1.00 | 1.01 | 1.00 | 0.011 | 2.37 | 5,3 | 2.1 | 2.9 | 0.18 | 0.98 | 0.257 | 0.257 | 1.000 | 0.185 | 1122,286 | 72 by 68 |
| 4116 + 1/2 | 7.5 | 0.95 | 0.94 | 1.01 | 1.11 | 1.01 | 0.000 | 2.54 | 5,3 | 2.3 | 3.4 | 0.18 | 1.00 | 0.261 | 0.258 | 1.014 | 0.187 | 1238,346 | 312 by 156 |
| 4117 | 8.0 | 0.97 | 0.95 | 1.01 | 1.12 | 1.01 | 0.003 | 2.34 | 5,3 | 2.3 | 3.3 | 0.18 | 1.04 | 0.259 | 0.263 | 0.983 | 0.190 | 1018,234 | 100 by 44 |
| 4117 + 1/2 | 8.6 | 0.99 | 0.95 | 1.03 | 1.13 | 1.03 | 0.005 | 2.24 | 5,3 | 2.3 | 3.3 | 0.19 | 1.09 | 0.265 | 0.264 | 1.004 | 0.192 | 1158,338 | 128 by 148 |
| 4118 | 9.0 | 1.02 | 0.95 | 1.07 | 1.14 | 1.07 | 0.013 | 2.02 | 10,6 | 2.5 | 3.3 | 0.19 | 1.09 | 0.266 | 0.266 | 1.003 | 0.195 | 1046,234 | 68 by 40 |
| 4118 + 1/2 | 9.5 | 1.04 | 0.95 | 1.09 | 1.16 | 1.09 | 0.014 | 2.09 | 10,6 | 2.3 | 3.2 | 0.19 | 1.10 | 0.266 | 0.267 | 0.997 | 0.198 | 1058,234 | 100 by 48 |
| 4119 | 9.9 | 1.07 | 0.95 | 1.13 | 1.15 | 1.13 | 0.027 | 1.86 | 5,0 | 2.5 | 3.2 | 0.20 | 1.06 | 0.271 | 0.267 | 1.016 | 0.202 | 1162,338 | 180 by 96 |
| 4119 + 1/2 | 10.2 | 1.08 | 0.95 | 1.13 | 1.11 | 1.11 | 0.031 | 1.68 | 13,6 | 2.7 | 3.5 | 0.20 | 1.03 | 0.268 | 0.271 | 0.987 | 0.206 | 1078,230 | 64 by 52 |
| 4120 | 10.6 | 1.08 | 0.95 | 1.13 | 1.15 | 1.13 | 0.028 | 2.10 | 5,0 | 2.9 | 3.7 | 0.20 | 1.04 | 0.275 | 0.271 | 1.014 | 0.210 | 1278,342 | 64 by 72 |
| 4120 + 1/2 | 11.0 | 1.06 | 0.95 | 1.12 | 1.05 | 1.05 | 0.044 | 1.71 | 10,1 | 3.0 | 4.2 | 0.21 | 0.97 | 0.272 | 0.274 | 0.992 | 0.214 | 1158,438 | 52 by 60 |
| 4121 | 11.3 | 1.06 | 0.95 | 1.12 | 1.10 | 1.10 | 0.036 | 2.49 | 15,2 | 2.9 | 4.0 | 0.21 | 1.02 | 0.279 | 0.274 | 1.020 | 0.219 | 1122,230 | 228 by 112 |
| 4121 + 1/2 | 11.5 | 1.07 | 0.95 | 1.12 | 1.05 | 1.05 | 0.042 | 3.21 | 15,2 | 3.1 | 4.5 | 0.22 | 1.01 | 0.273 | 0.277 | 0.985 | 0.224 | 1270,318 | 108 by 116 |
| 4122 | 11.7 | 1.05 | 0.95 | 1.10 | 1.02 | 1.02 | 0.042 | 4.02 | 15,2 | 3.6 | 4.9 | 0.22 | 0.98 | 0.275 | 0.279 | 0.987 | 0.230 | 1270,362 | 76 by 100 |
| 4122 + 1/2 | 11.7 | 1.02 | 0.95 | 1.07 | 1.03 | 1.03 | 0.037 | 3.09 | 15,2 | 3.8 | 5.0 | 0.23 | 1.03 | 0.278 | 0.276 | 1.010 | 0.236 | 1158,426 | 60 by 56 |
| 4123 | 11.9 | 1.04 | 0.95 | 1.10 | 1.03 | 1.03 | 0.038 | 3.65 | 15,2 | 4.3 | 5.8 | 0.24 | 1.02 | 0.279 | 0.278 | 1.005 | 0.242 | 930,602 | 144 by 112 |
| 4123 + 1/2 | 11.9 | 1.01 | 0.95 | 1.06 | 1.02 | 1.02 | 0.035 | 2.27 | 15,2 | 4.6 | 6.3 | 0.24 | 1.02 | 0.277 | 0.280 | 0.988 | 0.248 | 1226,338 | 84 by 80 |
| 4124 | 11.8 | 1.01 | 0.95 | 1.06 | 1.01 | 1.01 | 0.043 | 2.31 | 12,0 | 4.9 | 6.6 | 0.25 | 1.01 | 0.281 | 0.280 | 1.002 | 0.256 | 1322,354 | 76 by 104 |
| 4124 + 1/2 | 11.7 | 0.98 | 0.95 | 1.03 | 0.96 | 0.96 | 0.064 | 2.53 | 12,0 | 5.3 | 6.5 | 0.25 | 0.98 | 0.282 | 0.282 | 0.997 | 0.263 | 1190,278 | 152 by 112 |
| 4125 | 11.5 | 0.95 | 0.95 | 1.01 | 0.98 | 0.98 | 0.059 | 2.63 | 12,0 | 5.8 | 7.1 | 0.26 | 1.02 | 0.285 | 0.283 | 1.007 | 0.272 | 1290,338 | 104 by 84 |
| 4125 + 1/2 | 11.4 | 0.93 | 0.93 | 1.00 | 1.04 | 1.00 | 0.050 | 2.26 | 13,1 | 6.4 | 7.7 | 0.26 | 0.97 | 0.284 | 0.289 | 0.984 | 0.280 | 1334,338 | 100 by 72 |
| 4126 | 11.2 | 0.90 | 0.90 | 1.00 | 0.96 | 0.96 | 0.068 | 2.21 | 13,1 | 6.7 | 8.4 | 0.27 | 0.93 | 0.296 | 0.289 | 1.025 | 0.290 | 1142,614 | 76 by 56 |
| 4126 + 1/2 | 11.4 | 0.87 | 0.88 | 0.99 | 1.02 | 0.99 | 0.070 | 2.48 | 14,7 | 7.2 | 8.6 | 0.27 | 1.00 | 0.293 | 0.298 | 0.982 | 0.299 | 1266,298 | 72 by 128 |
| 4127 | 10.8 | 0.86 | 0.86 | 1.00 | 0.98 | 0.98 | 0.076 | 2.69 | 14,7 | 7.2 | 9.5 | 0.28 | 1.03 | 0.300 | 0.299 | 1.005 | 0.310 | 1086,562 | 124 by 72 |
| 4127 + 1/2 | 10.6 | 0.85 | 0.85 | 1.00 | 0.97 | 0.97 | 0.072 | 2.66 | 14,1 | 7.5 | 10.1 | 0.28 | 1.02 | 0.302 | 0.301 | 1.001 | 0.321 | 1178,522 | 88 by 76 |
| 4128 | 10.6 | 0.83 | 0.83 | 1.00 | 1.05 | 1.00 | 0.056 | 3.11 | 14,1 | 7.1 | 9.9 | 0.29 | 0.94 | 0.302 | 0.304 | 0.994 | 0.333 | 1142,602 | 68 by 116 |
| 4128 + 1/2 | 10.6 | 0.82 | 0.82 | 1.00 | 1.04 | 1.00 | 0.095 | 2.42 | 12,5 | 7.1 | 10.7 | 0.29 | 0.99 | 0.308 | 0.305 | 1.010 | 0.345 | 1070,534 | 92 by 80 |
| 4129 | 10.4 | 0.81 | 0.79 | 1.02 | 0.97 | 0.97 | 0.076 | 3.14 | 12,5 | 7.7 | 10.7 | 0.30 | 1.01 | 0.307 | 0.305 | 1.006 | 0.358 | 1090,638 | 56 by 68 |
| 4129 + 1/2 | 10.5 | 0.77 | 0.77 | 1.00 | 1.02 | 1.00 | 0.087 | 4.22 | 11,8 | 8.4 | 12.0 | 0.30 | 1.02 | 0.307 | 0.305 | 1.005 | 0.371 | 1446,318 | 76 by 96 |
| 4130 | 10.4 | 0.73 | 0.74 | 0.99 | 0.96 | 0.96 | 0.095 | 5.17 | 11,8 | 9.1 | 13.9 | 0.31 | 0.93 | 0.304 | 0.304 | 0.998 | 0.384 | 1154,594 | 64 by 56 |
| 4130 + 1/2 | 10.7 | 0.70 | 0.71 | 0.99 | 1.03 | 0.99 | 0.079 | 5.83 | 11,8 | 8.4 | 12.9 | 0.31 | 0.99 | 0.302 | 0.301 | 1.002 | 0.398 | 1418,246 | 368 by 208 |
| 4131 | 11.0 | 0.69 | 0.69 | 1.01 | 0.99 | 0.99 | 0.079 | 7.72 | 12,7 | 8.3 | 14.2 | 0.32 | 1.00 | 0.298 | 0.300 | 0.995 | 0.412 | 1438,246 | 128 by 132 |
| 4131 + 1/2 | 11.2 | 0.67 | 0.68 | 0.99 | 0.99 | 0.99 | 0.074 | 7.49 | 12,8 | 8.9 | 14.6 | 0.32 | 1.02 | 0.296 | 0.298 | 0.992 | 0.426 | 1042,58 | 44 by 60 |
| 4132 | 11.7 | 0.67 | 0.65 | 1.03 | 1.04 | 1.03 | 0.089 | 9.38 | 12,8 | 7.3 | 10.3 | 0.32 | 1.02 | 0.298 | 0.298 | 0.999 | 0.441 | 1010,54 | 172 by 60 |
| 4132 + 1/2 | 11.8 | 0.63 | 0.65 | 0.97 | 0.96 | 0.96 | 0.093 | 4.39 | 13,7 | 7.4 | 9.4 | 0.33 | 1.00 | 0.298 | 0.300 | 0.995 | 0.457 | 994,38 | 60 by 36 |
| 4133 | 12.5 | 0.62 | 0.62 | 1.01 | 0.99 | 0.99 | 0.106 | 7.99 | 12,8 | 7.8 | 9.9 | 0.33 | 1.00 | 0.304 | 0.300 | 1.016 | 0.472 | 1558,310 | 72 by 96 |
| 4133 + 1/2 | 12.3 | 0.61 | 0.61 | 0.99 | 0.95 | 0.95 | 0.124 | 6.35 | 13,7 | 8.1 | 12.3 | 0.33 | 0.96 | 0.301 | 0.305 | 0.988 | 0.488 | 1578,318 | 52 by 76 |
| 4134 | 12.8 | 0.61 | 0.59 | 1.02 | 1.05 | 1.02 | 0.115 | 7.83 | 13,7 | 8.3 | 12.3 | 0.34 | 0.98 | 0.306 | 0.306 | 0.997 | 0.504 | 1602,318 | 116 by 152 |
| 4134 + 1/2 | 13.0 | 0.58 | 0.56 | 1.03 | 1.06 | 1.03 | 0.116 | 11.47 | 13,8 | 8.4 | 12.4 | 0.34 | 1.01 | 0.308 | 0.308 | 1.001 | 0.520 | 1594,274 | 116 by 152 |
| 4135 | 13.1 | 0.52 | 0.55 | 0.94 | 0.86 | 0.86 | 0.138 | 12.36 | 13,8 | 8.9 | 14.0 | 0.34 | 0.95 | 0.311 | 0.311 | 1.000 | 0.536 | 1618,278 | 116 by 140 |
| 4135 + 1/2 | 13.5 | 0.52 | 0.50 | 1.04 | 0.97 | 0.97 | 0.129 | 10.08 | 14,7 | 9.2 | 11.9 | 0.34 | 1.01 | 0.314 | 0.313 | 1.002 | 0.553 | 1638,278 | 112 by 144 |
| 4136 | 13.6 | 0.48 | 0.48 | 1.00 | 0.82 | 0.82 | 0.205 | 6.41 | 14,7 | 9.7 | 13.3 | 0.34 | 0.93 | 0.315 | 0.315 | 1.000 | 0.570 | 1658,270 | 96 by 124 |
| 4136 + 1/2 | 14.0 | 0.45 | 0.48 | 0.93 | 0.88 | 0.88 | 0.137 | 3.60 | 14,7 | 10.5 | 13.5 | 0.35 | 0.94 | 0.317 | 0.318 | 0.997 | 0.587 | 1714,326 | 60 by 88 |
| 4137 | 14.3 | 0.43 | 0.48 | 0.89 | 0.77 | 0.77 | 0.161 | 3.57 | 14,8 | 11.0 | 15.0 | 0.35 | 0.86 | 0.320 | 0.321 | 0.996 | 0.606 | 1734,322 | 132 by 176 |
| 4137 + 1/2 | 14.8 | 0.41 | 0.48 | 0.86 | 0.75 | 0.75 | 0.177 | 3.22 | 15,7 | 12.0 | 16.4 | 0.35 | 0.85 | 0.326 | 0.326 | 1.000 | 0.624 | 1754,314 | 68 by 96 |
| 4138 | 14.6 | 0.39 | 0.48 | 0.82 | 0.79 | 0.79 | 0.122 | 2.35 | 3,8 | 12.9 | 16.4 | 0.36 | 0.88 | 0.333 | 0.334 | 0.996 | 0.640 | 1786,318 | 64 by 96 |
| 4138 + 1/2 | 15.4 | 0.39 | 0.48 | 0.82 | 0.77 | 0.77 | 0.160 | 2.52 | 14,1 | 12.9 | 15.6 | 0.36 | 0.85 | 0.343 | 0.337 | 1.016 | 0.653 | 1806,310 | 72 by 92 |
| 4139 | 15.6 | 0.39 | 0.48 | 0.80 | 0.81 | 0.80 | 0.117 | 2.56 | 14,1 | 13.2 | 17.1 | 0.37 | 0.87 | 0.342 | 0.348 | 0.982 | 0.663 | 1846,326 | 156 by 212 |
| 4139 + 1/2 | 15.4 | 0.39 | 0.48 | 0.82 | 0.85 | 0.82 | 0.095 | 2.69 | 14,1 | 14.0 | 18.8 | 0.38 | 0.87 | 0.354 | 0.352 | 1.005 | 0.673 | 1854,302 | 64 by 100 |
| 4140 | 15.8 | 0.40 | 0.48 | 0.83 | 0.83 | 0.83 | 0.137 | 3.97 | 15,1 | 14.8 | 19.2 | 0.38 | 0.87 | 0.361 | 0.363 | 0.994 | 0.680 | 1802,186 | 64 by 76 |
| 4140 + 1/2 | 15.6 | 0.40 | 0.48 | 0.83 | 0.87 | 0.83 | 0.119 | 4.55 | 15,1 | 15.8 | 20.5 | 0.39 | 0.85 | 0.372 | 0.373 | 1.000 | 0.688 | 1846,214 | 56 by 84 |
| 4141 | 15.5 | 0.40 | 0.48 | 0.84 | 0.92 | 0.84 | 0.081 | 4.12 | 15,1 | 13.6 | 24.2 | 0.40 | 0.85 | 0.384 | 0.381 | 1.008 | 0.695 | 950,122 | 124 by 64 |
| 4141 + 1/2 | 15.2 | 0.41 | 0.48 | 0.86 | 0.94 | 0.86 | 0.071 | 3.74 | 15,1 | 12.2 | 15.2 | 0.41 | 0.87 | 0.390 | 0.390 | 1.001 | 0.702 | 938,98 | 104 by 56 |
| 4142 | 15.3 | 0.41 | 0.48 | 0.85 | 0.93 | 0.85 | 0.082 | 2.94 | 15,1 | 13.6 | 17.7 | 0.41 | 0.87 | 0.396 | 0.396 | 1.000 | 0.708 | 930,78 | 92 by 44 |
| 4142 + 1/2 | 15.1 | 0.42 | 0.48 | 0.86 | 0.98 | 0.86 | 0.051 | 2.17 | 15,1 | 13.2 | 19.5 | 0.42 | 0.88 | 0.401 | 0.404 | 0.993 | 0.714 | 1766,222 | 132 by 156 |
| 4143 | 15.2 | 0.43 | 0.48 | 0.88 | 1.01 | 0.88 | 0.060 | 2.41 | 15,1 | 13.7 | 19.9 | 0.43 | 0.88 | 0.413 | 0.410 | 1.006 | 0.721 | 1798,218 | 104 by 128 |
| 4143 + 1/2 | 14.8 | 0.43 | 0.48 | 0.89 | 1.01 | 0.89 | 0.060 | 2.41 | 15,1 | 13.8 | 16.7 | 0.44 | 0.89 | 0.419 | 0.420 | 0.998 | 0.725 | 1838,218 | 76 by 76 |
| 4144 | 14.6 | 0.45 | 0.48 | 0.93 | 0.95 | 0.93 | 0.063 | 1.69 | 15,0 | 13.4 | 17.0 | 0.44 | 0.91 | 0.428 | 0.429 | 0.998 | 0.730 | 1810,10 | 80 by 52 |
| 4144 + 1/2 | 14.7 | 0.48 | 0.48 | 1.00 | 1.05 | 1.00 | 0.081 | 2.29 | 2,3 | 14.3 | 18.8 | 0.45 | 0.96 | 0.438 | 0.440 | 0.994 | 0.735 | 1838,10 | 44 by 32 |
| 4145 | 14.5 | 0.51 | 0.51 | 1.01 | 1.02 | 1.01 | 0.064 | 2.54 | 3,1 | 15.1 | 19.9 | 0.45 | 0.99 | 0.453 | 0.452 | 1.002 | 0.739 | 1862,10 | 32 by 56 |
| 4145 + 1/2 | 14.5 | 0.54 | 0.53 | 1.01 | 0.98 | 0.98 | 0.060 | 5.22 | 3,1 | 16.8 | 20.8 | 0.46 | 0.97 | 0.466 | 0.464 | 1.005 | 0.743 | 302,646 | 56 by 88 |
| 4146 | 14.5 | 0.55 | 0.55 | 1.00 | 0.98 | 0.98 | 0.078 | 1.80 | 2,5 | 16.0 | 23.4 | 0.47 | 0.98 | 0.474 | 0.480 | 0.988 | 0.747 | 282,654 | 52 by 104 |
| 4146 + 1/2 | 14.3 | 0.57 | 0.57 | 0.99 | 1.01 | 0.99 | 0.061 | 1.77 | 2,5 | 16.6 | 21.9 | 0.47 | 1.00 | 0.494 | 0.492 | 1.004 | 0.751 | 290,634 | 60 by 92 |
| 4147 | 14.3 | 0.60 | 0.60 | 1.00 | 0.96 | 0.96 | 0.069 | 1.71 | 5,0 | 17.0 | 19.3 | 0.48 | 0.97 | 0.509 | 0.509 | 1.000 | 0.756 | 254,734 | 52 by 92 |
| 4147 + 1/2 | 14.2 | 0.63 | 0.62 | 1.01 | 1.05 | 1.01 | 0.057 | 2.97 | 2,2 | 19.0 | 24.4 | 0.48 | 1.01 | 0.525 | 0.524 | 1.002 | 0.760 | 254,626 | 48 by 140 |
| 4148 | 14.4 | 0.68 | 0.64 | 1.07 | 0.98 | 0.98 | 0.062 | 1.84 | 4,1 | 20.9 | 26.4 | 0.48 | 0.96 | 0.540 | 0.542 | 0.996 | 0.765 | 226,718 | 60 by 148 |
| 4148 + 1/2 | 14.2 | 0.68 | 0.65 | 1.05 | 1.01 | 1.01 | 0.064 | 2.21 | 1,6 | 23.7 | 30.2 | 0.49 | 0.99 | 0.558 | 0.554 | 1.008 | 0.769 | 214,730 | 52 by 72 |
| 4149 | 14.1 | 0.67 | 0.65 | 1.02 | 0.99 | 0.99 | 0.057 | 3.69 | 3,1 | 26.5 | 35.0 | 0.49 | 1.00 | 0.568 | 0.568 | 0.999 | 0.774 | 826,10 | 68 by 36 |
| 4149 + 1/2 | 14.1 | 0.65 | 0.67 | 0.98 | 1.00 | 0.98 | 0.055 | 2.30 | 1,6 | 24.2 | 27.3 | 0.49 | 0.99 | 0.578 | 0.584 | 0.990 | 0.778 | 198,710 | 64 by 164 |
| 4150 | 14.0 | 0.65 | 0.68 | 0.97 | 1.01 | 0.97 | 0.052 | 2.44 | 1,6 | 26.2 | 42.0 | 0.50 | 0.98 | 0.600 | 0.599 | 1.000 | 0.783 | 546,210 | 52 by 84 |
| 4150 + 1/2 | 14.3 | 0.65 | 0.68 | 0.96 | 0.99 | 0.96 | 0.081 | 2.17 | 1,6 | 24.8 | 29.8 | 0.50 | 0.98 | 0.621 | 0.622 | 0.999 | 0.786 | 386,354 | 68 by 104 |
| 4151 | 14.7 | 0.67 | 0.68 | 0.98 | 0.98 | 0.98 | 0.090 | 2.84 | 0,7 | 22.1 | 29.3 | 0.50 | 0.97 | 0.644 | 0.643 | 1.003 | 0.792 | 878,6 | 76 by 32 |
| 4151 + 1/2 | 13.6 | 0.68 | 0.70 | 0.98 | 1.01 | 0.98 | 0.058 | 1.77 | 1,6 | 21.9 | 34.3 | 0.50 | 0.98 | 0.664 | 0.668 | 0.994 | 0.794 | 1870,6 | 40 by 36 |
| 4152 | 13.7 | 0.72 | 0.72 | 1.00 | 0.99 | 0.99 | 0.062 | 1.57 | 0,2 | 23.9 | 29.6 | 0.50 | 1.00 | 0.692 | 0.696 | 0.995 | 0.797 | 58,910 | 88 by 212 |
| 4152 + 1/2 | 13.5 | 0.75 | 0.75 | 1.00 | 1.00 | 1.00 | 0.057 | 1.80 | 0,2 | 27.9 | 34.0 | 0.50 | 1.00 | 0.727 | 0.725 | 1.003 | 0.798 | 958,6 | 108 by 32 |
| 4153 | 13.3 | 0.79 | 0.79 | 0.99 | 1.00 | 0.99 | 0.051 | 1.94 | 0,2 | 24.6 | 30.0 | 0.50 | 0.98 | 0.759 | 0.764 | 0.993 | 0.800 | 338,422 | 48 by 80 |
| 4153 + 1/2 | 13.1 | 0.83 | 0.84 | 0.99 | 0.99 | 0.99 | 0.045 | 2.42 | 12,0 | 28.5 | 30.8 | 0.51 | 1.02 | 0.800 | 0.808 | 0.991 | 0.800 | 338,398 | 136 by 132 |
| 4154 | 13.2 | 0.88 | 0.88 | 1.00 | 0.99 | 0.99 | 0.044 | 3.07 | 12,0 | 33.8 | 38.3 | 0.51 | 0.97 | 0.856 | 0.854 | 1.003 | 0.802 | 994,6 | 192 by 80 |
| 4154 + 1/2 | 12.8 | 0.94 | 0.94 | 0.99 | 1.01 | 0.99 | 0.029 | 3.26 | 12,0 | 39.1 | 41.4 | 0.51 | 1.01 | 0.908 | 0.912 | 0.996 | 0.803 | 1838,6 | 132 by 48 |
| 4155 | 12.8 | 1.00 | 0.99 | 1.00 | 1.01 | 1.00 | 0.038 | 3.24 | 12,0 | 43.9 | 46.1 | 0.51 | 1.00 | 0.967 | 0.964 | 1.003 | 0.802 | 1806,6 | 100 by 44 |
| 4155 + 1/2 | 12.8 | 1.05 | 1.05 | 1.00 | 0.99 | 0.99 | 0.050 | 3.28 | 9,0 | 48.5 | 51.3 | 0.51 | 0.99 | 1.020 | 1.019 | 1.001 | 0.802 | 1266,6 | 272 by 48 |
| 4156 | 12.7 | 1.11 | 1.10 | 1.01 | 1.01 | 1.01 | 0.046 | 3.00 | 11,0 | 53.1 | 56.6 | 0.50 | 1.01 | 1.072 | 1.069 | 1.002 | 0.801 | 1762,30 | 144 by 60 |
| 4156 + 1/2 | 12.7 | 1.15 | 1.13 | 1.01 | 0.99 | 0.99 | 0.052 | 3.35 | 13,0 | 57.7 | 62.1 | 0.50 | 0.99 | 1.119 | 1.111 | 1.007 | 0.798 | 1606,34 | 152 by 76 |
| 4157 | 12.8 | 1.16 | 1.16 | 1.00 | 1.03 | 1.00 | 0.048 | 3.20 | 12,0 | 63.4 | 67.7 | 0.50 | 1.00 | 1.150 | 1.151 | 0.999 | 0.795 | 1506,50 | 120 by 64 |
| 4157 + 1/2 | 12.8 | 1.17 | 1.18 | 0.99 | 0.98 | 0.98 | 0.067 | 3.21 | 10,0 | 67.1 | 72.5 | 0.50 | 0.99 | 1.183 | 1.186 | 0.997 | 0.790 | 1398,66 | 420 by 60 |
| 4158 | 13.0 | 1.19 | 1.19 | 1.00 | 1.00 | 1.00 | 0.065 | 3.24 | 10,0 | 70.0 | 75.7 | 0.50 | 0.98 | 1.222 | 1.223 | 1.000 | 0.784 | 1594,82 | 204 by 60 |
| 4158 + 1/2 | 13.0 | 1.21 | 1.21 | 1.00 | 1.01 | 1.00 | 0.057 | 3.86 | 13,1 | 74.2 | 81.0 | 0.49 | 1.01 | 1.262 | 1.257 | 1.004 | 0.778 | 1078,102 | 80 by 52 |
| 4159 | 12.9 | 1.23 | 1.22 | 1.01 | 1.00 | 1.00 | 0.081 | 4.37 | 13,1 | 80.2 | 86.7 | 0.49 | 1.00 | 1.292 | 1.287 | 1.003 | 0.772 | 1798,138 | 124 by 52 |
| 4159 + 1/2 | 13.1 | 1.23 | 1.23 | 1.00 | 0.99 | 0.99 | 0.085 | 4.32 | 13,1 | 81.4 | 87.0 | 0.49 | 0.99 | 1.313 | 1.313 | 1.000 | 0.765 | 1838,162 | 92 by 52 |
| 4160 | 13.1 | 1.24 | 1.24 | 1.00 | 1.01 | 1.00 | 0.068 | 4.36 | 13,1 | 76.3 | 86.6 | 0.48 | 0.99 | 1.335 | 1.337 | 0.999 | 0.759 | 1714,162 | 196 by 64 |
| 4160 + 1/2 | 12.8 | 1.26 | 1.25 | 1.00 | 1.00 | 1.00 | 0.086 | 4.27 | 13,1 | 85.5 | 90.3 | 0.47 | 1.00 | 1.360 | 1.353 | 1.005 | 0.753 | 1498,158 | 304 by 52 |
| 4161 | 13.0 | 1.26 | 1.27 | 1.00 | 1.02 | 1.00 | 0.059 | 3.56 | 13,1 | 85.0 | 91.6 | 0.46 | 0.99 | 1.372 | 1.374 | 0.998 | 0.746 | 1690,186 | 120 by 44 |
| 4161 + 1/2 | 13.3 | 1.28 | 1.28 | 1.00 | 1.01 | 1.00 | 0.070 | 3.30 | 15,2 | 81.1 | 89.6 | 0.45 | 1.01 | 1.388 | 1.386 | 1.001 | 0.740 | 1466,186 | 140 by 48 |
| 4162 | 13.1 | 1.29 | 1.29 | 1.00 | 1.02 | 1.00 | 0.065 | 3.35 | 15,2 | 79.6 | 88.6 | 0.45 | 1.00 | 1.401 | 1.404 | 0.998 | 0.734 | 1402,202 | 208 by 60 |
| 4162 + 1/2 | 13.3 | 1.30 | 1.29 | 1.00 | 0.99 | 0.99 | 0.089 | 3.46 | 14,2 | 87.6 | 100.8 | 0.44 | 0.98 | 1.419 | 1.411 | 1.006 | 0.727 | 1542,218 | 108 by 52 |
| 4163 | 13.4 | 1.30 | 1.30 | 1.00 | 1.01 | 1.00 | 0.077 | 3.64 | 14,2 | 83.1 | 94.4 | 0.43 | 0.99 | 1.421 | 1.426 | 0.996 | 0.720 | 1470,226 | 504 by 88 |
| 4163 + 1/2 | 13.1 | 1.31 | 1.30 | 1.01 | 1.02 | 1.01 | 0.072 | 3.73 | 14,2 | 78.9 | 88.1 | 0.43 | 1.00 | 1.434 | 1.431 | 1.002 | 0.714 | 1682,266 | 92 by 56 |
| 4164 | 13.4 | 1.31 | 1.30 | 1.01 | 0.98 | 0.98 | 0.104 | 3.38 | 14,2 | 79.5 | 86.9 | 0.41 | 0.96 | 1.442 | 1.438 | 1.003 | 0.708 | 1858,338 | 68 by 60 |
| 4164 + 1/2 | 13.3 | 1.31 | 1.31 | 1.00 | 1.00 | 1.00 | 0.084 | 2.81 | 13,2 | 85.2 | 92.6 | 0.41 | 0.99 | 1.442 | 1.446 | 0.997 | 0.701 | 1750,310 | 196 by 60 |
| 4165 | 13.3 | 1.31 | 1.31 | 1.00 | 0.99 | 0.99 | 0.086 | 3.12 | 15,3 | 79.7 | 85.5 | 0.41 | 0.99 | 1.451 | 1.453 | 0.998 | 0.696 | 1782,342 | 324 by 112 |
| 4165 + 1/2 | 13.4 | 1.31 | 1.31 | 1.00 | 1.00 | 1.00 | 0.070 | 2.83 | 15,3 | 82.7 | 89.7 | 0.40 | 0.99 | 1.464 | 1.464 | 1.000 | 0.689 | 1722,350 | 160 by 60 |
| 4166 | 13.5 | 1.32 | 1.31 | 1.01 | 1.03 | 1.01 | 0.055 | 3.74 | 15,3 | 78.3 | 83.4 | 0.39 | 1.01 | 1.476 | 1.474 | 1.002 | 0.683 | 1854,374 | 136 by 56 |
| 4166 + 1/2 | 13.5 | 1.32 | 1.31 | 1.01 | 0.99 | 0.99 | 0.075 | 3.75 | 15,3 | 80.2 | 86.9 | 0.38 | 0.96 | 1.484 | 1.476 | 1.005 | 0.678 | 1846,410 | 144 by 80 |
| 4167 | 13.6 | 1.33 | 1.31 | 1.01 | 1.02 | 1.01 | 0.055 | 3.36 | 15,3 | 80.4 | 87.4 | 0.38 | 1.00 | 1.487 | 1.476 | 1.007 | 0.671 | 1818,406 | 456 by 116 |
| 4167 + 1/2 | 13.7 | 1.32 | 1.32 | 1.01 | 1.02 | 1.01 | 0.057 | 2.21 | 15,3 | 43.9 | 70.1 | 0.37 | 1.00 | 1.476 | 1.472 | 1.002 | 0.664 | 1706,414 | 332 by 104 |
| 4168 | 13.7 | 1.30 | 1.32 | 0.99 | 0.99 | 0.99 | 0.055 | 2.08 | 15,4 | 80.0 | 88.8 | 0.36 | 1.01 | 1.461 | 1.463 | 0.999 | 0.659 | 1526,386 | 180 by 72 |
| 4168 + 1/2 | 13.6 | 1.30 | 1.33 | 0.98 | 0.98 | 0.98 | 0.055 | 2.20 | 15,4 | 75.9 | 84.7 | 0.35 | 0.99 | 1.448 | 1.458 | 0.994 | 0.653 | 1718,454 | 136 by 56 |
| 4169 | 13.9 | 1.31 | 1.33 | 0.98 | 0.99 | 0.98 | 0.049 | 2.81 | 13,0 | 76.1 | 83.0 | 0.35 | 1.00 | 1.449 | 1.457 | 0.995 | 0.646 | 1654,446 | 120 by 64 |
| 4169 + 1/2 | 13.8 | 1.33 | 1.34 | 0.99 | 1.01 | 0.99 | 0.031 | 3.24 | 13,0 | 74.6 | 84.9 | 0.35 | 1.00 | 1.455 | 1.454 | 1.000 | 0.640 | 1718,474 | 248 by 112 |
| 4170 | 13.9 | 1.34 | 1.33 | 1.01 | 0.96 | 0.96 | 0.075 | 3.83 | 13,0 | 75.3 | 85.7 | 0.34 | 0.95 | 1.459 | 1.458 | 1.001 | 0.634 | 1774,502 | 96 by 64 |
| 4170 + 1/2 | 13.7 | 1.36 | 1.33 | 1.03 | 1.00 | 1.00 | 0.059 | 3.81 | 13,0 | 25.7 | 29.8 | 0.34 | 0.99 | 1.461 | 1.463 | 0.999 | 0.628 | 1470,414 | 200 by 80 |
| 4171 | 13.8 | 1.39 | 1.33 | 1.04 | 1.01 | 1.01 | 0.073 | 3.61 | 13,0 | 73.4 | 81.7 | 0.33 | 1.01 | 1.470 | 1.463 | 1.004 | 0.622 | 1378,402 | 192 by 72 |
| 4171 + 1/2 | 13.8 | 1.40 | 1.33 | 1.06 | 1.01 | 1.01 | 0.081 | 3.40 | 13,1 | 72.8 | 80.0 | 0.33 | 1.00 | 1.466 | 1.471 | 0.997 | 0.616 | 1650,486 | 168 by 100 |
| 4172 | 13.9 | 1.43 | 1.33 | 1.08 | 1.00 | 1.00 | 0.095 | 4.44 | 13,1 | 69.6 | 74.1 | 0.32 | 0.97 | 1.472 | 1.474 | 0.998 | 0.610 | 1758,562 | 172 by 96 |
| 4172 + 1/2 | 13.9 | 1.45 | 1.33 | 1.09 | 1.05 | 1.05 | 0.087 | 4.73 | 13,1 | 71.1 | 76.0 | 0.32 | 1.03 | 1.478 | 1.470 | 1.005 | 0.604 | 1594,482 | 184 by 124 |
| 4173 | 14.0 | 1.47 | 1.33 | 1.11 | 1.06 | 1.06 | 0.088 | 4.69 | 13,1 | 68.1 | 76.5 | 0.31 | 1.03 | 1.484 | 1.470 | 1.009 | 0.599 | 1646,514 | 144 by 88 |
| 4173 + 1/2 | 14.0 | 1.48 | 1.33 | 1.11 | 1.06 | 1.06 | 0.087 | 6.14 | 13,1 | 67.7 | 72.5 | 0.31 | 1.03 | 1.469 | 1.467 | 1.002 | 0.592 | 1766,582 | 192 by 140 |
| 4174 | 13.9 | 1.48 | 1.33 | 1.11 | 1.08 | 1.08 | 0.081 | 5.62 | 13,1 | 64.9 | 71.1 | 0.30 | 1.09 | 1.456 | 1.460 | 0.997 | 0.588 | 94,402 | 80 by 80 |
| 4174 + 1/2 | 14.1 | 1.49 | 1.33 | 1.12 | 1.08 | 1.08 | 0.081 | 5.65 | 13,1 | 63.3 | 70.8 | 0.30 | 1.08 | 1.452 | 1.444 | 1.005 | 0.581 | 1862,634 | 136 by 92 |
| 4175 | 14.1 | 1.48 | 1.33 | 1.11 | 1.10 | 1.10 | 0.065 | 5.04 | 13,1 | 61.8 | 71.0 | 0.30 | 1.11 | 1.433 | 1.432 | 1.001 | 0.576 | 1482,538 | 212 by 76 |
| 4175 + 1/2 | 14.1 | 1.46 | 1.33 | 1.10 | 1.07 | 1.07 | 0.078 | 4.15 | 13,1 | 59.5 | 67.8 | 0.30 | 1.09 | 1.412 | 1.411 | 1.001 | 0.570 | 1854,678 | 224 by 144 |
| 4176 | 14.1 | 1.45 | 1.32 | 1.10 | 1.10 | 1.10 | 0.061 | 4.71 | 13,2 | 55.9 | 62.3 | 0.30 | 1.12 | 1.389 | 1.388 | 1.000 | 0.568 | 1810,998 | 64 by 84 |
| 4176 + 1/2 | 14.3 | 1.41 | 1.32 | 1.07 | 1.07 | 1.07 | 0.051 | 4.61 | 13,2 | 54.4 | 62.7 | 0.30 | 1.09 | 1.364 | 1.365 | 0.999 | 0.560 | 1714,698 | 124 by 120 |
| 4177 | 14.4 | 1.38 | 1.32 | 1.05 | 1.06 | 1.05 | 0.035 | 4.28 | 13,2 | 50.2 | 55.2 | 0.30 | 1.08 | 1.341 | 1.336 | 1.004 | 0.554 | 1170,686 | 56 by 68 |
| 4177 + 1/2 | 14.5 | 1.35 | 1.32 | 1.02 | 1.04 | 1.02 | 0.037 | 4.35 | 13,2 | 45.9 | 52.8 | 0.29 | 1.07 | 1.307 | 1.306 | 1.001 | 0.549 | 1334,570 | 160 by 76 |
| 4178 | 13.9 | 1.31 | 1.31 | 1.00 | 1.03 | 1.00 | 0.042 | 3.32 | 13,2 | 56.6 | 59.7 | 0.30 | 1.06 | 1.272 | 1.275 | 0.997 | 0.547 | 1382,582 | 128 by 100 |
| 4178 + 1/2 | 14.0 | 1.27 | 1.29 | 0.99 | 1.00 | 0.99 | 0.037 | 3.15 | 13,2 | 41.0 | 44.7 | 0.30 | 1.06 | 1.244 | 1.242 | 1.001 | 0.542 | 238,902 | 52 by 56 |
| 4179 | 13.4 | 1.27 | 1.25 | 1.01 | 1.01 | 1.01 | 0.038 | 2.83 | 13,2 | 52.2 | 54.5 | 0.30 | 1.05 | 1.213 | 1.214 | 0.999 | 0.539 | 202,906 | 44 by 52 |
| 4179 + 1/2 | 13.2 | 1.23 | 1.23 | 1.00 | 0.99 | 0.99 | 0.052 | 3.00 | 14,3 | 37.8 | 40.7 | 0.30 | 1.02 | 1.185 | 1.178 | 1.006 | 0.536 | 162,914 | 56 by 60 |
| 4180 | 12.9 | 1.20 | 1.18 | 1.01 | 1.00 | 1.00 | 0.043 | 3.38 | 13,3 | 47.9 | 50.6 | 0.30 | 1.00 | 1.143 | 1.148 | 0.995 | 0.533 | 118,914 | 52 by 56 |
| 4180 + 1/2 | 12.6 | 1.14 | 1.15 | 0.99 | 1.02 | 0.99 | 0.042 | 3.39 | 13,3 | 47.2 | 49.5 | 0.30 | 1.00 | 1.112 | 1.111 | 1.000 | 0.530 | 78,918 | 44 by 60 |
| 4181 | 12.1 | 1.10 | 1.10 | 1.00 | 0.98 | 0.98 | 0.054 | 3.62 | 13,3 | 44.1 | 46.6 | 0.31 | 0.95 | 1.079 | 1.081 | 0.999 | 0.527 | 1702,850 | 108 by 72 |
| 4181 + 1/2 | 12.0 | 1.06 | 1.06 | 1.00 | 1.01 | 1.00 | 0.048 | 1.69 | 9,1 | 42.3 | 44.4 | 0.31 | 0.98 | 1.049 | 1.046 | 1.003 | 0.522 | 1458,638 | 156 by 140 |
| 4182 | 11.3 | 1.02 | 1.02 | 1.00 | 0.98 | 0.98 | 0.053 | 2.31 | 13,3 | 41.8 | 43.6 | 0.31 | 0.99 | 1.013 | 1.017 | 0.996 | 0.521 | 1158,830 | 140 by 152 |
| 4182 + 1/2 | 11.1 | 0.97 | 0.98 | 1.00 | 1.02 | 1.00 | 0.040 | 1.54 | 9,1 | 38.0 | 40.1 | 0.30 | 0.99 | 0.984 | 0.981 | 1.003 | 0.518 | 1566,754 | 92 by 64 |
| 4183 | 10.9 | 0.93 | 0.94 | 0.99 | 0.98 | 0.98 | 0.055 | 1.56 | 11,7 | 38.1 | 39.6 | 0.31 | 0.98 | 0.949 | 0.950 | 0.999 | 0.516 | 670,698 | 164 by 104 |
| 4183 + 1/2 | 10.5 | 0.90 | 0.90 | 1.00 | 1.02 | 1.00 | 0.031 | 1.87 | 13,3 | 36.3 | 37.8 | 0.31 | 1.00 | 0.916 | 0.918 | 0.998 | 0.511 | 90,1058 | 56 by 52 |
| 4184 | 10.0 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.032 | 1.74 | 13,3 | 34.3 | 35.8 | 0.31 | 1.00 | 0.887 | 0.886 | 1.000 | 0.511 | 1246,822 | 164 by 92 |
| 4184 + 1/2 | 9.7 | 0.85 | 0.84 | 1.01 | 1.02 | 1.01 | 0.031 | 1.81 | 13,4 | 32.4 | 33.8 | 0.31 | 1.01 | 0.857 | 0.853 | 1.005 | 0.506 | 874,766 | 136 by 96 |
| 4185 | 9.0 | 0.81 | 0.82 | 0.99 | 0.98 | 0.98 | 0.049 | 1.81 | 13,4 | 30.4 | 31.8 | 0.31 | 0.99 | 0.820 | 0.828 | 0.990 | 0.509 | 74,1054 | 68 by 52 |
| 4185 + 1/2 | 8.9 | 0.79 | 0.79 | 1.00 | 1.00 | 1.00 | 0.042 | 1.94 | 13,4 | 28.3 | 29.7 | 0.32 | 0.98 | 0.798 | 0.787 | 1.014 | 0.503 | 1310,842 | 104 by 88 |
| 4186 | 8.5 | 0.76 | 0.76 | 1.00 | 1.05 | 1.00 | 0.032 | 1.89 | 13,4 | 26.3 | 27.6 | 0.32 | 1.02 | 0.754 | 0.763 | 0.989 | 0.503 | 642,682 | 144 by 140 |
| 4186 + 1/2 | 8.2 | 0.73 | 0.73 | 1.00 | 0.95 | 0.95 | 0.068 | 1.74 | 13,4 | 24.2 | 25.5 | 0.33 | 0.94 | 0.728 | 0.719 | 1.012 | 0.497 | 1510,834 | 188 by 96 |
| 4187 | 7.8 | 0.70 | 0.70 | 1.00 | 0.99 | 0.99 | 0.047 | 1.62 | 13,4 | 22.2 | 23.3 | 0.32 | 1.00 | 0.684 | 0.696 | 0.983 | 0.497 | 1794,922 | 84 by 112 |
| 4187 + 1/2 | 7.5 | 0.68 | 0.67 | 1.01 | 1.02 | 1.01 | 0.043 | 1.65 | 12,4 | 20.1 | 21.1 | 0.32 | 0.99 | 0.664 | 0.653 | 1.017 | 0.497 | 1690,958 | 188 by 144 |
| 4188 | 7.0 | 0.64 | 0.64 | 1.00 | 0.99 | 0.99 | 0.039 | 1.46 | 8,2 | 17.9 | 18.9 | 0.33 | 0.97 | 0.621 | 0.626 | 0.992 | 0.497 | 1578,838 | 184 by 76 |
| 4188 + 1/2 | 6.7 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.024 | 1.51 | 12,4 | 15.8 | 16.8 | 0.33 | 0.98 | 0.589 | 0.586 | 1.004 | 0.494 | 1818,942 | 108 by 112 |
| 4189 | 6.4 | 0.57 | 0.58 | 0.98 | 1.01 | 0.98 | 0.026 | 1.57 | 8,2 | 13.7 | 14.6 | 0.33 | 0.98 | 0.551 | 0.557 | 0.989 | 0.494 | 1266,866 | 96 by 112 |
| 4189 + 1/2 | 6.2 | 0.56 | 0.55 | 1.01 | 0.98 | 0.98 | 0.027 | 1.62 | 8,2 | 11.6 | 12.4 | 0.32 | 0.94 | 0.526 | 0.519 | 1.012 | 0.491 | 1594,886 | 240 by 112 |
| 4190 | 5.8 | 0.53 | 0.53 | 1.01 | 1.02 | 1.01 | 0.037 | 1.87 | 8,2 | 9.7 | 10.4 | 0.32 | 1.01 | 0.488 | 0.494 | 0.987 | 0.491 | 1506,818 | 56 by 80 |
| 4190 + 1/2 | 5.5 | 0.50 | 0.50 | 0.99 | 0.98 | 0.98 | 0.028 | 1.67 | 8,2 | 7.8 | 8.5 | 0.34 | 0.97 | 0.463 | 0.461 | 1.005 | 0.491 | 1430,926 | 92 by 140 |
| 4191 | 5.2 | 0.48 | 0.48 | 1.00 | 1.02 | 1.00 | 0.011 | 1.63 | 8,2 | 6.1 | 6.6 | 0.35 | 1.03 | 0.434 | 0.439 | 0.987 | 0.489 | 1402,774 | 88 by 72 |
| 4191 + 1/2 | 4.7 | 0.45 | 0.45 | 1.01 | 1.00 | 1.00 | 0.009 | 1.48 | 8,2 | 6.1 | 6.4 | 0.35 | 1.03 | 0.416 | 0.409 | 1.016 | 0.492 | 1622,898 | 272 by 184 |
| 4192 | 4.4 | 0.43 | 0.43 | 0.98 | 0.98 | 0.98 | 0.013 | 1.39 | 8,2 | 6.8 | 7.3 | 0.35 | 1.01 | 0.385 | 0.394 | 0.976 | 0.492 | 1050,670 | 60 by 56 |
| 4192 + 1/2 | 4.2 | 0.41 | 0.41 | 1.01 | 1.01 | 1.01 | 0.004 | 1.37 | 14,0 | 7.7 | 8.4 | 0.35 | 1.01 | 0.373 | 0.374 | 0.999 | 0.491 | 770,818 | 104 by 152 |
| 4193 | 3.7 | 0.40 | 0.40 | 0.99 | 1.00 | 0.99 | 0.000 | 1.35 | 9,8 | 8.3 | 9.2 | 0.35 | 1.01 | 0.363 | 0.363 | 0.999 | 0.488 | 430,902 | 64 by 108 |
| 4193 + 1/2 | 3.7 | 0.38 | 0.38 | 1.01 | 1.00 | 1.00 | 0.015 | 1.41 | 9,8 | 9.1 | 9.9 | 0.35 | 1.00 | 0.353 | 0.355 | 0.994 | 0.490 | 758,990 | 84 by 60 |
| 4194 | 3.4 | 0.36 | 0.37 | 0.98 | 0.98 | 0.98 | 0.011 | 1.43 | 8,8 | 9.6 | 10.3 | 0.35 | 1.01 | 0.343 | 0.358 | 0.958 | 0.489 | 1254,1010 | 160 by 136 |
| 4194 + 1/2 | 3.3 | 0.36 | 0.36 | 0.99 | 0.98 | 0.98 | 0.021 | 1.41 | 4,6 | 10.2 | 11.0 | 0.36 | 1.00 | 0.347 | 0.358 | 0.970 | 0.488 | 1034,838 | 176 by 100 |
| 4195 | 3.0 | 0.36 | 0.36 | 1.00 | 0.99 | 0.99 | 0.016 | 1.43 | 8,8 | 10.5 | 11.3 | 0.37 | 1.01 | 0.363 | 0.364 | 0.996 | 0.487 | 1378,926 | 168 by 96 |
| 4195 + 1/2 | 2.8 | 0.36 | 0.36 | 1.00 | 1.01 | 1.00 | 0.006 | 1.52 | 2,6 | 10.7 | 11.5 | 0.37 | 1.00 | 0.382 | 0.376 | 1.016 | 0.487 | 878,890 | 72 by 96 |
| 4196 | 2.6 | 0.35 | 0.36 | 0.98 | 0.99 | 0.98 | 0.009 | 1.58 | 8,8 | 11.0 | 11.6 | 0.38 | 0.94 | 0.388 | 0.391 | 0.993 | 0.490 | 1078,982 | 172 by 128 |
| 4196 + 1/2 | 2.4 | 0.36 | 0.35 | 1.02 | 1.02 | 1.02 | 0.007 | 1.52 | 11,8 | 11.1 | 11.7 | 0.37 | 0.89 | 0.413 | 0.394 | 1.047 | 0.489 | 1366,974 | 112 by 112 |
| 4197 | 2.1 | 0.35 | 0.35 | 0.99 | 0.97 | 0.97 | 0.029 | 1.41 | 12,8 | 11.1 | 11.6 | 0.37 | 0.80 | 0.400 | 0.400 | 1.000 | 0.491 | 1478,1006 | 84 by 112 |
| 4197 + 1/2 | 1.9 | 0.34 | 0.35 | 0.98 | 0.98 | 0.98 | 0.011 | 1.40 | 12,8 | 11.2 | 11.7 | 0.38 | 0.82 | 0.403 | 0.399 | 1.011 | 0.489 | 1474,950 | 352 by 240 |
| 4198 | 1.8 | 0.34 | 0.35 | 0.99 | 0.99 | 0.99 | 0.004 | 1.23 | 4,7 | 11.3 | 11.9 | 0.38 | 0.87 | 0.397 | 0.397 | 1.000 | 0.492 | 1114,854 | 96 by 140 |
| 4198 + 1/2 | 1.7 | 0.34 | 0.35 | 0.98 | 0.98 | 0.98 | 0.004 | 1.18 | 13,7 | 11.0 | 11.6 | 0.38 | 0.93 | 0.385 | 0.396 | 0.973 | 0.492 | 494,746 | 196 by 116 |
| 4199 | 1.6 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.000 | 1.24 | 13,7 | 11.3 | 11.8 | 0.38 | 0.97 | 0.394 | 0.388 | 1.017 | 0.490 | 1446,966 | 132 by 108 |
| 4199 + 1/2 | 1.6 | 0.34 | 0.35 | 0.99 | 0.99 | 0.99 | 0.007 | 1.12 | 15,8 | 11.1 | 11.6 | 0.38 | 0.99 | 0.384 | 0.388 | 0.989 | 0.493 | 1174,862 | 192 by 108 |
| 4200 | 1.6 | 0.35 | 0.35 | 1.00 | 0.99 | 0.99 | 0.008 | 1.28 | 11,8 | 11.1 | 11.6 | 0.38 | 0.98 | 0.390 | 0.387 | 1.010 | 0.493 | 1702,982 | 76 by 72 |
| 4200 + 1/2 | 1.6 | 0.34 | 0.35 | 0.98 | 0.98 | 0.98 | 0.015 | 1.19 | 11,8 | 11.2 | 11.7 | 0.38 | 0.98 | 0.383 | 0.389 | 0.984 | 0.493 | 406,658 | 100 by 140 |
| 4201 | 1.6 | 0.34 | 0.35 | 0.99 | 1.00 | 0.99 | 0.002 | 1.14 | 11,8 | 11.1 | 11.4 | 0.39 | 0.99 | 0.390 | 0.389 | 1.002 | 0.492 | 1154,942 | 312 by 244 |
| 4201 + 1/2 | 1.6 | 0.34 | 0.35 | 0.99 | 1.00 | 0.99 | 0.001 | 1.17 | 8,7 | 11.0 | 11.4 | 0.38 | 1.00 | 0.388 | 0.391 | 0.993 | 0.492 | 994,906 | 172 by 152 |
| 4202 | 1.6 | 0.35 | 0.35 | 1.00 | 1.01 | 1.00 | 0.004 | 1.24 | 4,6 | 11.1 | 11.5 | 0.37 | 1.00 | 0.396 | 0.389 | 1.017 | 0.492 | 1314,1034 | 120 by 132 |
| 4202 + 1/2 | 1.7 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.011 | 1.14 | 4,8 | 10.8 | 11.0 | 0.37 | 1.00 | 0.392 | 0.387 | 1.013 | 0.490 | 814,810 | 88 by 112 |
| 4203 | 1.5 | 0.34 | 0.35 | 0.99 | 0.98 | 0.98 | 0.013 | 1.12 | 13,7 | 10.7 | 11.0 | 0.37 | 1.00 | 0.385 | 0.393 | 0.981 | 0.488 | 1122,934 | 128 by 92 |
| 4203 + 1/2 | 1.6 | 0.34 | 0.35 | 0.99 | 1.00 | 0.99 | 0.004 | 1.18 | 4,8 | 10.9 | 11.1 | 0.38 | 1.01 | 0.386 | 0.392 | 0.985 | 0.490 | 914,806 | 96 by 104 |
| 4204 | 1.6 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.017 | 1.24 | 11,8 |  |  |  | 1.00 | 0.393 | 0.389 | 1.011 | 0.490 | 1726,994 | 120 by 88 |
| 4204 + 1/2 | 1.6 | 0.35 | 0.35 | 1.00 | 0.98 | 0.98 | 0.028 | 1.16 | 0,4 |  |  |  | 0.99 | 0.392 | 0.396 | 0.988 | 0.491 | 38,550 | 68 by 124 |
| 4205 | 1.5 | 0.35 | 0.35 | 1.01 | 1.01 | 1.01 | 0.007 | 1.33 | 13,8 |  |  |  | 1.01 | 0.399 | 0.393 | 1.015 | 0.493 | 1590,1054 | 156 by 208 |
| 4205 + 1/2 | 1.6 | 0.35 | 0.35 | 1.02 | 1.02 | 1.02 | 0.002 | 1.23 | 10,8 |  |  |  | 1.00 | 0.403 | 0.392 | 1.026 | 0.492 | 1242,922 | 264 by 192 |
| 4206 | 1.7 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.007 | 1.27 | 12,8 |  |  |  | 0.99 | 0.393 | 0.400 | 0.984 | 0.492 | 1514,962 | 100 by 108 |
| 4206 + 1/2 | 1.5 | 0.34 | 0.35 | 0.99 | 1.00 | 0.99 | 0.000 | 1.12 | 11,3 |  |  |  | 0.99 | 0.382 | 0.397 | 0.963 | 0.492 | 1174,834 | 128 by 92 |
| 4207 | 1.6 | 0.35 | 0.35 | 1.01 | 1.01 | 1.01 | 0.012 | 1.27 | 9,8 |  |  |  | 0.99 | 0.400 | 0.393 | 1.017 | 0.493 | 1018,838 | 316 by 224 |
| 4207 + 1/2 | 1.6 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.007 | 1.17 | 4,8 |  |  |  | 1.00 | 0.393 | 0.391 | 1.004 | 0.490 | 1250,1062 | 132 by 60 |
| 4208 | 1.6 | 0.35 | 0.35 | 1.01 | 1.01 | 1.01 | 0.011 | 1.29 | 9,8 |  |  |  | 0.99 | 0.397 | 0.394 | 1.008 | 0.491 | 1250,946 | 324 by 200 |
| 4208 + 1/2 | 1.6 | 0.34 | 0.35 | 0.99 | 1.00 | 0.99 | 0.001 | 1.13 | 3,8 |  |  |  | 1.00 | 0.386 | 0.395 | 0.976 | 0.492 | 502,794 | 256 by 128 |
| 4209 | 1.7 | 0.35 | 0.35 | 1.00 | 0.99 | 0.99 | 0.021 | 1.13 | 13,4 |  |  |  | 1.00 | 0.394 | 0.397 | 0.994 | 0.492 | 1702,918 | 152 by 76 |
| 4209 + 1/2 | 1.7 | 0.35 | 0.35 | 1.01 | 1.00 | 1.00 | 0.014 | 1.14 | 10,8 |  |  |  | 0.99 | 0.396 | 0.394 | 1.006 | 0.494 | 1038,942 | 144 by 168 |
| 4210 | 1.7 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.012 | 1.39 | 2,6 |  |  |  | 1.01 | 0.398 | 0.395 | 1.005 | 0.492 | 310,726 | 152 by 124 |
| 4210 + 1/2 | 1.6 | 0.35 | 0.35 | 1.01 | 1.00 | 1.00 | 0.022 | 1.13 | 13,8 |  |  |  | 1.00 | 0.394 | 0.397 | 0.992 | 0.492 | 894,890 | 88 by 144 |
| 4211 | 1.7 | 0.35 | 0.35 | 1.01 | 1.01 | 1.01 | 0.009 | 1.19 | 10,7 |  |  |  | 1.00 | 0.397 | 0.392 | 1.012 | 0.494 | 1366,966 | 288 by 232 |
| 4211 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

### rise (uranus.rise, frames 4380 to 4454, window 4368 to 4466, 198 draft frames at rate 2)

Largest level step: 0.27 at frame 4465 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.11 from frame 4463 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 6.78 from frame 4462 to the next, block column 13 row 3 from the top left, shown, not judged.
Largest change in place: 72.7 from frame 4401 + 1/2 to 8 film frames later, most at pixel 1484, 556 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 1.48 from frame 4411 to 8 film frames later, most at pixel 1242, 293, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 4368 to 4379 + 1/2): change 13.2, pattern 0.24.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 4395 + 1/2 in /home/user/workspace/work/p6/hu9/03/uranus-rise-p1of2-pops.png, frame 4432 + 1/2 in /home/user/workspace/work/p6/hu9/04/uranus-rise-p2of2-pops.png, frame 4452 + 1/2 in /home/user/workspace/work/p6/hu9/04/uranus-rise-p2of2-pops.png, frame 4463 in /home/user/workspace/work/p6/hu9/04/uranus-rise-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 4387 in /home/user/workspace/work/p6/hu9/03/uranus-rise-p1of2-changes.png, frame 4395 in /home/user/workspace/work/p6/hu9/03/uranus-rise-p1of2-changes.png, frame 4403 in /home/user/workspace/work/p6/hu9/03/uranus-rise-p1of2-changes.png, frame 4411 in /home/user/workspace/work/p6/hu9/03/uranus-rise-p1of2-changes.png.

- RED the pattern of the picture changes in place by 1.48 from frame 4411 to 8 film frames later, band 8 px, limit 0.45 (90 frames over it, first 4380 + 1/2)

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4368 | 62.59 |  | 1.7 | 0.83 | 0.83 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 1,6 | 12.8 | 17.5 | 0.40 | 0.20 | 0.40 | 8.4 |
| 4368 + 1/2 | 62.61 | 0.00 | 1.6 | 0.83 | 0.83 | 1.01 | 1.01 | 1.01 | 0.000 | 1.12 | 1,6 | 12.9 | 17.6 | 0.40 | 0.20 | 0.40 | 8.4 |
| 4369 | 62.63 | 0.00 | 1.6 | 0.82 | 0.83 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 0,1 | 13.0 | 17.8 | 0.40 | 0.21 | 0.39 | 8.5 |
| 4369 + 1/2 | 62.65 | 0.00 | 1.6 | 0.82 | 0.83 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 0,1 | 13.0 | 17.8 | 0.40 | 0.22 | 0.39 | 8.5 |
| 4370 | 62.66 | 0.00 | 1.6 | 0.83 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 1,8 | 13.1 | 17.9 | 0.40 | 0.23 | 0.39 | 8.5 |
| 4370 + 1/2 | 62.68 | 0.00 | 1.6 | 0.83 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.23 | 6,1 | 13.1 | 17.9 | 0.40 | 0.23 | 0.39 | 8.2 |
| 4371 | 62.70 | 0.00 | 1.6 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 1,8 | 13.1 | 17.8 | 0.40 | 0.24 | 0.39 | 8.2 |
| 4371 + 1/2 | 62.72 | 0.00 | 1.6 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 6,1 | 13.2 | 17.7 | 0.40 | 0.24 | 0.39 | 8.2 |
| 4372 | 62.74 | 0.00 | 1.6 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 6,1 | 13.2 | 17.5 | 0.40 | 0.24 | 0.39 | 8.2 |
| 4372 + 1/2 | 62.75 | 0.00 | 1.6 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 1,8 | 13.2 | 17.5 | 0.40 | 0.24 | 0.39 | 8.4 |
| 4373 | 62.77 | 0.00 | 1.6 | 0.83 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 0,8 | 13.2 | 17.5 | 0.40 | 0.25 | 0.39 | 8.4 |
| 4373 + 1/2 | 62.78 | 0.00 | 1.6 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 13,0 | 13.3 | 17.6 | 0.40 | 0.25 | 0.39 | 8.4 |
| 4374 | 62.79 | 0.00 | 1.6 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 14,0 | 13.5 | 17.9 | 0.40 | 0.25 | 0.39 | 8.4 |
| 4374 + 1/2 | 62.79 | 0.00 | 1.6 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 14,2 | 13.8 | 18.2 | 0.40 | 0.26 | 0.39 | 8.4 |
| 4375 | 62.80 | 0.00 | 1.6 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 14,0 | 14.2 | 18.5 | 0.39 | 0.27 | 0.39 | 8.4 |
| 4375 + 1/2 | 62.80 | 0.00 | 1.6 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 9,8 | 14.9 | 19.1 | 0.39 | 0.28 | 0.38 | 8.5 |
| 4376 | 62.80 | 0.00 | 1.6 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 6,7 | 15.6 | 19.4 | 0.39 | 0.29 | 0.38 | 8.5 |
| 4376 + 1/2 | 62.80 | 0.00 | 1.6 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 1,7 | 16.6 | 20.0 | 0.38 | 0.32 | 0.38 | 8.6 |
| 4377 | 62.79 | 0.00 | 1.6 | 0.82 | 0.82 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 6,7 | 17.7 | 20.6 | 0.38 | 0.33 | 0.37 | 8.7 |
| 4377 + 1/2 | 62.79 | 0.00 | 1.6 | 0.82 | 0.82 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 11,0 | 19.0 | 21.3 | 0.38 | 0.34 | 0.37 | 8.7 |
| 4378 | 62.78 | 0.00 | 1.6 | 0.82 | 0.83 | 0.99 | 0.99 | 0.99 | 0.000 | 1.07 | 6,7 | 20.4 | 21.9 | 0.37 | 0.37 | 0.36 | 8.8 |
| 4378 + 1/2 | 62.77 | 0.00 | 1.6 | 0.83 | 0.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 0,7 | 22.0 | 23.9 | 0.37 | 0.38 | 0.36 | 8.7 |
| 4379 | 62.77 | 0.00 | 1.6 | 0.82 | 0.83 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 0,7 | 23.5 | 26.1 | 0.36 | 0.39 | 0.35 | 8.8 |
| 4379 + 1/2 | 62.76 | 0.01 | 1.6 | 0.81 | 0.83 | 0.98 | 0.98 | 0.98 | 0.000 | 1.17 | 0,7 | 25.7 | 28.3 | 0.36 | 0.41 | 0.35 | 8.9 |
| 4380 first | 62.77 | 0.01 | 1.6 | 0.82 | 0.85 | 0.97 | 0.97 | 0.97 | 0.000 | 1.24 | 0,7 | 28.0 | 30.9 | 0.35 | 0.44 | 0.34 | 8.9 |
| 4380 + 1/2 | 62.80 | 0.00 | 1.6 | 0.87 | 0.89 | 0.98 | 0.98 | 0.98 | 0.000 | 1.34 | 1,8 | 30.4 | 33.6 | 0.35 | 0.46 | 0.33 | 9.0 |
| 4381 | 62.84 | 0.00 | 1.7 | 0.95 | 0.96 | 0.99 | 0.99 | 0.99 | 0.000 | 1.46 | 1,8 | 33.0 | 36.3 | 0.34 | 0.48 | 0.33 | 9.1 |
| 4381 + 1/2 | 62.88 | 0.00 | 1.9 | 1.06 | 1.07 | 0.99 | 0.99 | 0.99 | 0.000 | 1.59 | 1,8 | 35.7 | 39.2 | 0.34 | 0.69 | 0.13 | 8.0 |
| 4382 | 62.94 | 0.01 | 2.1 | 1.19 | 1.18 | 1.00 | 1.00 | 1.00 | 0.000 | 1.89 | 7,1 | 38.3 | 41.9 | 0.34 | 0.63 | 0.17 | 8.0 |
| 4382 + 1/2 | 63.01 | 0.01 | 2.4 | 1.31 | 1.30 | 1.00 | 1.00 | 1.00 | 0.000 | 2.09 | 7,1 | 40.9 | 44.7 | 0.33 | 0.79 | 0.19 | 8.0 |
| 4383 | 63.09 | 0.01 | 2.8 | 1.42 | 1.40 | 1.01 | 1.01 | 1.01 | 0.001 | 2.00 | 7,1 | 43.2 | 47.3 | 0.33 | 0.97 | 0.21 | 8.0 |
| 4383 + 1/2 | 63.19 | 0.01 | 3.1 | 1.49 | 1.48 | 1.00 | 1.03 | 1.00 | 0.002 | 1.99 | 7,1 | 45.5 | 49.8 | 0.33 | 1.09 | 0.22 | 8.0 |
| 4384 | 63.31 | 0.01 | 3.4 | 1.55 | 1.54 | 1.00 | 1.04 | 1.00 | 0.000 | 2.00 | 7,1 | 47.8 | 52.1 | 0.33 | 1.27 | 0.22 | 8.0 |
| 4384 + 1/2 | 63.44 | 0.01 | 3.8 | 1.60 | 1.59 | 1.01 | 1.06 | 1.01 | 0.000 | 2.03 | 7,1 | 49.9 | 54.3 | 0.33 | 1.25 | 0.21 | 8.0 |
| 4385 | 63.58 | 0.01 | 4.1 | 1.63 | 1.63 | 1.00 | 1.06 | 1.00 | 0.000 | 1.86 | 0,8 | 51.9 | 56.3 | 0.33 | 1.27 | 0.20 | 8.0 |
| 4385 + 1/2 | 63.74 | 0.01 | 4.5 | 1.67 | 1.65 | 1.01 | 1.05 | 1.01 | 0.013 | 1.87 | 0,0 | 53.7 | 57.9 | 0.33 | 1.30 | 0.18 | 8.0 |
| 4386 | 63.92 | 0.01 | 4.7 | 1.67 | 1.68 | 1.00 | 1.05 | 1.00 | 0.010 | 1.96 | 0,0 | 55.3 | 59.3 | 0.33 | 1.27 | 0.17 | 8.0 |
| 4386 + 1/2 | 64.11 | 0.00 | 5.0 | 1.68 | 1.68 | 1.00 | 1.00 | 1.00 | 0.023 | 1.71 | 9,1 | 56.7 | 60.5 | 0.33 | 1.16 | 0.16 | 8.0 |
| 4387 | 64.30 | 0.01 | 5.2 | 1.71 | 1.68 | 1.01 | 0.93 | 0.93 | 0.055 | 1.80 | 0,0 | 57.9 | 61.5 | 0.34 | 1.08 | 0.14 | 8.0 |
| 4387 + 1/2 | 64.51 | 0.01 | 5.5 | 1.69 | 1.73 | 0.98 | 0.95 | 0.95 | 0.052 | 1.43 | 0,0 | 58.9 | 62.2 | 0.34 | 1.17 | 0.13 | 8.0 |
| 4388 | 64.74 | 0.00 | 5.7 | 1.76 | 1.73 | 1.02 | 0.96 | 0.96 | 0.055 | 1.58 | 9,1 | 59.7 | 62.7 | 0.35 | 0.89 | 0.12 | 8.0 |
| 4388 + 1/2 | 64.98 | 0.01 | 5.9 | 1.74 | 1.78 | 0.98 | 0.97 | 0.97 | 0.051 | 1.68 | 6,8 | 60.4 | 63.2 | 0.36 | 0.92 | 0.11 | 8.0 |
| 4389 | 65.23 | 0.00 | 6.1 | 1.80 | 1.78 | 1.01 | 0.98 | 0.98 | 0.056 | 1.74 | 5,8 | 61.1 | 63.3 | 0.36 | 1.23 | 0.10 | 8.0 |
| 4389 + 1/2 | 65.49 | 0.00 | 6.3 | 1.81 | 1.80 | 1.00 | 1.03 | 1.00 | 0.039 | 1.79 | 5,8 | 61.5 | 63.4 | 0.37 | 1.01 | 0.10 | 8.0 |
| 4390 | 65.75 | 0.00 | 6.4 | 1.84 | 1.81 | 1.02 | 1.01 | 1.01 | 0.060 | 1.76 | 5,8 | 61.9 | 63.4 | 0.37 | 0.96 | 0.09 | 8.0 |
| 4390 + 1/2 | 66.00 | 0.00 | 6.7 | 1.83 | 1.81 | 1.01 | 1.04 | 1.01 | 0.050 | 1.63 | 5,8 | 62.3 | 64.6 | 0.38 | 1.11 | 0.09 | 8.0 |
| 4391 | 66.25 | 0.01 | 6.8 | 1.81 | 1.81 | 1.00 | 1.00 | 1.00 | 0.069 | 1.81 | 15,5 | 62.4 | 66.1 | 0.38 | 1.00 | 0.37 | 10.6 |
| 4391 + 1/2 | 66.49 | 0.00 | 7.0 | 1.83 | 1.81 | 1.01 | 1.05 | 1.01 | 0.054 | 1.74 | 4,8 | 62.5 | 67.4 | 0.39 | 1.01 | 0.38 | 10.5 |
| 4392 | 66.73 | 0.01 | 7.2 | 1.87 | 1.81 | 1.03 | 1.05 | 1.03 | 0.057 | 1.81 | 15,2 | 63.2 | 68.6 | 0.39 | 0.99 | 0.38 | 10.4 |
| 4392 + 1/2 | 66.98 | 0.00 | 7.5 | 1.89 | 1.81 | 1.05 | 1.09 | 1.05 | 0.053 | 2.10 | 15,2 | 64.0 | 69.7 | 0.40 | 0.97 | 0.39 | 10.2 |
| 4393 | 67.23 | 0.00 | 7.8 | 1.91 | 1.81 | 1.06 | 1.09 | 1.06 | 0.061 | 2.28 | 15,2 | 64.7 | 70.5 | 0.40 | 0.91 | 0.39 | 10.1 |
| 4393 + 1/2 | 67.48 | 0.00 | 8.1 | 1.94 | 1.81 | 1.07 | 1.10 | 1.07 | 0.067 | 2.14 | 15,2 | 65.3 | 71.2 | 0.41 | 0.83 | 0.40 | 9.8 |
| 4394 | 67.73 | 0.00 | 8.3 | 1.88 | 1.81 | 1.04 | 1.10 | 1.04 | 0.060 | 1.89 | 12,1 | 65.6 | 71.6 | 0.42 | 0.72 | 0.40 | 9.7 |
| 4394 + 1/2 | 67.99 | 0.00 | 8.7 | 1.89 | 1.81 | 1.04 | 1.08 | 1.04 | 0.054 | 1.74 | 10,0 | 66.0 | 72.0 | 0.42 | 0.58 | 0.41 | 9.4 |
| 4395 | 68.25 | 0.00 | 9.0 | 1.94 | 1.81 | 1.07 | 1.09 | 1.07 | 0.064 | 2.17 | 12,1 | 66.1 | 72.3 | 0.43 | 0.43 | 0.41 | 9.3 |
| 4395 + 1/2 | 68.51 | 0.02 | 9.4 | 1.96 | 1.81 | 1.08 | 1.16 | 1.08 | 0.058 | 2.78 | 15,1 | 66.1 | 72.4 | 0.44 | 0.43 | 0.03 | 8.0 |
| 4396 | 68.75 | 0.01 | 9.9 | 1.95 | 1.81 | 1.08 | 0.99 | 0.99 | 0.089 | 2.60 | 10,0 | 65.7 | 72.1 | 0.45 | 0.46 | 0.04 | 8.0 |
| 4396 + 1/2 | 69.01 | 0.00 | 10.3 | 1.90 | 1.81 | 1.05 | 1.03 | 1.03 | 0.071 | 2.95 | 15,1 | 65.2 | 71.6 | 0.45 | 0.56 | 0.04 | 8.0 |
| 4397 | 69.27 | 0.00 | 10.8 | 1.86 | 1.81 | 1.03 | 1.04 | 1.03 | 0.088 | 3.02 | 15,1 | 64.5 | 71.0 | 0.46 | 0.54 | 0.04 | 8.0 |
| 4397 + 1/2 | 69.54 | 0.01 | 10.9 | 1.86 | 1.81 | 1.03 | 0.98 | 0.98 | 0.106 | 2.43 | 15,1 | 63.5 | 70.0 | 0.46 | 0.49 | 0.04 | 8.0 |
| 4398 | 69.80 | 0.01 | 11.4 | 1.81 | 1.80 | 1.01 | 1.03 | 1.01 | 0.080 | 2.56 | 15,0 | 65.7 | 77.4 | 0.48 | 0.48 | 0.07 | 8.0 |
| 4398 + 1/2 | 70.04 | 0.02 | 11.7 | 1.79 | 1.76 | 1.01 | 0.99 | 0.99 | 0.088 | 2.31 | 15,1 | 65.2 | 78.5 | 0.48 | 0.53 | 0.07 | 8.0 |
| 4399 | 70.26 | 0.02 | 12.2 | 1.71 | 1.73 | 0.99 | 1.02 | 0.99 | 0.066 | 2.82 | 15,1 | 67.1 | 78.3 | 0.49 | 1.21 | 0.09 | 8.0 |
| 4399 + 1/2 | 70.42 | 0.03 | 12.6 | 1.67 | 1.69 | 0.99 | 0.98 | 0.98 | 0.071 | 2.16 | 0,5 | 69.2 | 77.9 | 0.50 | 1.16 | 0.10 | 8.0 |
| 4400 | 70.52 | 0.01 | 12.9 | 1.64 | 1.67 | 0.98 | 1.02 | 0.98 | 0.049 | 5.04 | 15,1 | 71.2 | 77.9 | 0.51 | 0.93 | 0.11 | 8.0 |
| 4400 + 1/2 | 70.59 | 0.01 | 13.4 | 1.67 | 1.64 | 1.01 | 0.94 | 0.94 | 0.061 | 2.11 | 0,6 | 72.0 | 76.2 | 0.51 | 1.17 | 0.11 | 8.0 |
| 4401 | 70.64 | 0.03 | 13.7 | 1.64 | 1.62 | 1.02 | 0.92 | 0.92 | 0.089 | 2.57 | 14,5 | 72.2 | 77.6 | 0.52 | 1.41 | 0.11 | 8.0 |
| 4401 + 1/2 | 70.65 | 0.05 | 14.1 | 1.59 | 1.60 | 0.99 | 1.04 | 0.99 | 0.051 | 2.84 | 15,0 | 72.7 | 77.9 | 0.53 | 1.41 | 0.13 | 8.0 |
| 4402 | 70.56 | 0.08 | 14.5 | 1.56 | 1.57 | 1.00 | 1.02 | 1.00 | 0.053 | 2.46 | 14,5 | 72.7 | 77.5 | 0.54 | 1.30 | 0.14 | 8.0 |
| 4402 + 1/2 | 70.33 | 0.08 | 14.9 | 1.54 | 1.54 | 1.00 | 1.07 | 1.00 | 0.055 | 2.85 | 15,0 | 72.3 | 77.9 | 0.55 | 1.36 | 0.14 | 8.0 |
| 4403 | 69.92 | 0.06 | 15.1 | 1.52 | 1.53 | 0.99 | 0.99 | 0.99 | 0.083 | 2.89 | 2,6 | 71.0 | 78.2 | 0.56 | 1.47 | 0.14 | 8.0 |
| 4403 + 1/2 | 69.41 | 0.01 | 15.4 | 1.50 | 1.51 | 0.99 | 0.97 | 0.97 | 0.095 | 3.32 | 2,6 | 69.1 | 78.5 | 0.56 | 1.32 | 0.14 | 8.0 |
| 4404 | 68.88 | 0.03 | 15.4 | 1.47 | 1.51 | 0.98 | 1.00 | 0.98 | 0.077 | 3.56 | 2,6 | 67.4 | 77.6 | 0.57 | 1.38 | 0.14 | 8.0 |
| 4404 + 1/2 | 68.41 | 0.04 | 15.4 | 1.48 | 1.50 | 0.98 | 1.00 | 0.98 | 0.073 | 3.39 | 14,4 | 64.7 | 75.9 | 0.58 | 1.09 | 0.14 | 8.0 |
| 4405 | 68.02 | 0.07 | 15.8 | 1.50 | 1.50 | 1.00 | 0.99 | 0.99 | 0.110 | 3.61 | 14,4 | 62.6 | 73.9 | 0.59 | 1.20 | 0.14 | 8.0 |
| 4405 + 1/2 | 67.77 | 0.07 | 16.1 | 1.51 | 1.50 | 1.01 | 0.98 | 0.98 | 0.116 | 3.00 | 12,3 | 59.9 | 70.9 | 0.60 | 0.94 | 0.13 | 8.0 |
| 4406 | 67.65 | 0.04 | 16.3 | 1.49 | 1.50 | 1.00 | 0.92 | 0.92 | 0.160 | 3.76 | 12,3 | 57.3 | 64.5 | 0.60 | 1.22 | 0.13 | 8.0 |
| 4406 + 1/2 | 67.62 | 0.05 | 16.4 | 1.50 | 1.49 | 1.01 | 0.99 | 0.99 | 0.134 | 3.87 | 12,3 | 54.4 | 63.3 | 0.61 | 1.05 | 0.13 | 8.0 |
| 4407 | 67.67 | 0.05 | 16.4 | 1.49 | 1.49 | 1.00 | 1.00 | 1.00 | 0.138 | 3.81 | 12,3 | 51.7 | 62.4 | 0.62 | 1.11 | 0.12 | 8.0 |
| 4407 + 1/2 | 67.83 | 0.04 | 16.4 | 1.49 | 1.49 | 1.00 | 1.02 | 1.00 | 0.139 | 3.54 | 12,3 | 49.4 | 60.7 | 0.64 | 1.16 | 0.13 | 8.0 |
| 4408 | 68.06 | 0.04 | 16.7 | 1.50 | 1.48 | 1.01 | 1.02 | 1.01 | 0.134 | 3.01 | 12,3 | 47.4 | 59.1 | 0.65 | 1.38 | 0.13 | 8.0 |
| 4408 + 1/2 | 68.38 | 0.03 | 16.3 | 1.49 | 1.47 | 1.01 | 1.03 | 1.01 | 0.131 | 2.63 | 12,3 | 45.8 | 56.9 | 0.66 | 1.30 | 0.13 | 8.0 |
| 4409 | 68.76 | 0.04 | 16.7 | 1.50 | 1.47 | 1.02 | 1.01 | 1.01 | 0.146 | 2.55 | 10,2 | 44.1 | 54.8 | 0.67 | 1.30 | 0.13 | 8.0 |
| 4409 + 1/2 | 69.21 | 0.04 | 16.7 | 1.46 | 1.47 | 0.99 | 1.01 | 0.99 | 0.113 | 2.73 | 11,2 | 41.9 | 52.6 | 0.68 | 1.20 | 0.13 | 8.0 |
| 4410 | 69.73 | 0.03 | 16.5 | 1.45 | 1.46 | 1.00 | 1.00 | 1.00 | 0.132 | 2.90 | 11,2 | 39.5 | 50.0 | 0.69 | 1.16 | 0.12 | 8.0 |
| 4410 + 1/2 | 70.32 | 0.03 | 16.7 | 1.44 | 1.46 | 0.99 | 0.96 | 0.96 | 0.161 | 2.72 | 11,2 | 36.7 | 47.5 | 0.70 | 1.26 | 0.12 | 8.0 |
| 4411 | 70.97 | 0.05 | 16.6 | 1.40 | 1.45 | 0.96 | 0.95 | 0.95 | 0.134 | 2.08 | 11,2 | 33.9 | 46.1 | 0.71 | 1.48 | 0.11 | 8.0 |
| 4411 + 1/2 | 71.72 | 0.06 | 16.3 | 1.40 | 1.44 | 0.97 | 0.98 | 0.97 | 0.106 | 2.25 | 10,1 | 31.1 | 44.3 | 0.72 | 1.15 | 0.10 | 8.0 |
| 4412 | 72.58 | 0.03 | 16.8 | 1.38 | 1.44 | 0.96 | 0.98 | 0.96 | 0.086 | 2.19 | 10,1 | 29.4 | 42.4 | 0.73 | 1.10 | 0.09 | 8.0 |
| 4412 + 1/2 | 73.52 | 0.02 | 16.2 | 1.42 | 1.43 | 0.99 | 0.96 | 0.96 | 0.142 | 2.52 | 10,1 | 26.8 | 40.2 | 0.74 | 0.93 | 0.08 | 8.0 |
| 4413 | 74.49 | 0.01 | 17.7 | 1.42 | 1.42 | 1.00 | 0.97 | 0.97 | 0.111 | 2.70 | 10,1 | 26.2 | 37.0 | 0.74 | 0.98 | 0.07 | 8.0 |
| 4413 + 1/2 | 75.49 | 0.02 | 18.2 | 1.44 | 1.42 | 1.02 | 0.99 | 0.99 | 0.119 | 2.69 | 10,1 | 26.2 | 34.0 | 0.75 | 0.74 | 0.07 | 8.0 |
| 4414 | 76.45 | 0.15 | 20.2 | 1.40 | 1.42 | 0.99 | 0.98 | 0.98 | 0.109 | 2.57 | 9,1 | 26.2 | 30.8 | 0.76 | 0.81 | 0.06 | 8.0 |
| 4414 + 1/2 | 77.10 | 0.19 | 17.9 | 1.42 | 1.42 | 1.00 | 1.02 | 1.00 | 0.080 | 3.28 | 14,0 | 26.4 | 28.7 | 0.77 | 0.94 | 0.74 | 8.0 |
| 4415 | 77.38 | 0.02 | 17.7 | 1.46 | 1.41 | 1.04 | 1.01 | 1.01 | 0.103 | 3.68 | 13,0 | 26.6 | 28.7 | 0.78 | 0.96 | 0.75 | 8.0 |
| 4415 + 1/2 | 77.71 | 0.01 | 17.5 | 1.44 | 1.41 | 1.03 | 1.05 | 1.03 | 0.078 | 3.23 | 11,0 | 26.9 | 29.2 | 0.79 | 0.83 | 0.77 | 8.0 |
| 4416 | 78.05 | 0.02 | 17.3 | 1.42 | 1.40 | 1.02 | 1.05 | 1.02 | 0.065 | 3.17 | 10,0 | 26.7 | 29.9 | 0.80 | 0.70 | 0.06 | 8.0 |
| 4416 + 1/2 | 78.45 | 0.01 | 17.6 | 1.40 | 1.40 | 1.00 | 1.05 | 1.00 | 0.066 | 2.60 | 10,0 | 26.2 | 27.1 | 0.81 | 0.95 | 0.05 | 8.0 |
| 4417 | 78.85 | 0.04 | 17.5 | 1.40 | 1.40 | 1.00 | 1.04 | 1.00 | 0.073 | 2.76 | 9,0 | 25.4 | 26.5 | 0.81 | 0.59 | 0.05 | 8.0 |
| 4417 + 1/2 | 79.34 | 0.02 | 17.3 | 1.39 | 1.40 | 0.99 | 1.03 | 0.99 | 0.070 | 2.61 | 8,0 | 24.6 | 25.5 | 0.82 | 0.4496 | 0.05 | 8.0 |
| 4418 | 79.87 | 0.05 | 16.5 | 1.39 | 1.40 | 1.00 | 1.03 | 1.00 | 0.112 | 2.75 | 8,0 | 23.3 | 24.2 | 0.82 | 0.76 | 0.04 | 8.0 |
| 4418 + 1/2 | 80.50 | 0.06 | 17.7 | 1.38 | 1.40 | 0.99 | 1.02 | 0.99 | 0.080 | 2.42 | 8,0 | 22.5 | 23.6 | 0.82 | 0.55 | 0.04 | 8.0 |
| 4419 | 81.25 | 0.06 | 18.0 | 1.38 | 1.40 | 0.99 | 0.99 | 0.99 | 0.109 | 2.11 | 8,0 | 21.8 | 22.9 | 0.82 | 0.48 | 0.04 | 8.0 |
| 4419 + 1/2 | 82.11 | 0.02 | 18.3 | 1.39 | 1.40 | 1.00 | 1.00 | 1.00 | 0.085 | 1.80 | 8,0 | 21.1 | 23.3 | 0.82 | 0.39 | 0.04 | 8.0 |
| 4420 | 83.02 | 0.02 | 18.3 | 1.40 | 1.40 | 1.00 | 1.01 | 1.00 | 0.088 | 2.14 | 14,8 | 20.1 | 21.7 | 0.83 | 0.455 | 0.04 | 8.0 |
| 4420 + 1/2 | 83.88 | 0.02 | 18.5 | 1.42 | 1.40 | 1.01 | 0.99 | 0.99 | 0.095 | 2.36 | 14,8 | 19.0 | 20.6 | 0.83 | 0.46 | 0.04 | 8.0 |
| 4421 | 84.71 | 0.01 | 18.2 | 1.42 | 1.40 | 1.02 | 0.98 | 0.98 | 0.103 | 2.55 | 13,8 | 17.9 | 19.0 | 0.83 | 0.49 | 0.04 | 8.0 |
| 4421 + 1/2 | 85.55 | 0.00 | 18.8 | 1.39 | 1.40 | 0.99 | 0.92 | 0.92 | 0.139 | 2.75 | 13,8 | 16.7 | 18.5 | 0.83 | 0.76 | 0.04 | 8.0 |
| 4422 | 86.39 | 0.02 | 18.3 | 1.41 | 1.40 | 1.01 | 0.96 | 0.96 | 0.082 | 2.86 | 13,8 | 15.5 | 18.8 | 0.83 | 0.70 | 0.04 | 8.0 |
| 4422 + 1/2 | 87.20 | 0.01 | 19.0 | 1.36 | 1.40 | 0.97 | 0.86 | 0.86 | 0.138 | 2.96 | 13,8 | 14.5 | 18.6 | 0.83 | 0.82 | 0.04 | 8.0 |
| 4423 | 87.99 | 0.03 | 19.0 | 1.35 | 1.40 | 0.96 | 0.93 | 0.93 | 0.076 | 2.26 | 13,8 | 13.5 | 17.7 | 0.83 | 0.62 | 0.04 | 8.0 |
| 4423 + 1/2 | 88.71 | 0.02 | 18.5 | 1.39 | 1.40 | 0.99 | 0.83 | 0.83 | 0.125 | 2.10 | 12,8 | 12.6 | 16.2 | 0.82 | 0.69 | 0.04 | 8.0 |
| 4424 | 89.39 | 0.01 | 19.3 | 1.31 | 1.40 | 0.93 | 0.90 | 0.90 | 0.071 | 2.13 | 12,8 | 12.1 | 16.5 | 0.82 | 0.64 | 0.04 | 8.0 |
| 4424 + 1/2 | 90.06 | 0.02 | 19.6 | 1.30 | 1.40 | 0.93 | 0.89 | 0.89 | 0.064 | 2.03 | 12,8 | 11.6 | 17.2 | 0.82 | 0.59 | 0.04 | 8.0 |
| 4425 | 90.78 | 0.02 | 20.0 | 1.31 | 1.40 | 0.93 | 0.92 | 0.92 | 0.053 | 2.33 | 12,7 | 10.7 | 17.5 | 0.82 | 0.61 | 0.04 | 8.0 |
| 4425 + 1/2 | 91.46 | 0.02 | 19.9 | 1.34 | 1.41 | 0.95 | 0.91 | 0.91 | 0.061 | 2.60 | 12,7 | 10.1 | 17.7 | 0.82 | 0.55 | 0.03 | 8.0 |
| 4426 | 92.11 | 0.03 | 20.0 | 1.38 | 1.42 | 0.97 | 0.91 | 0.91 | 0.069 | 2.51 | 12,7 | 9.5 | 17.6 | 0.82 | 0.56 | 0.03 | 8.0 |
| 4426 + 1/2 | 92.70 | 0.04 | 20.2 | 1.43 | 1.42 | 1.01 | 0.93 | 0.93 | 0.077 | 2.41 | 12,7 | 9.2 | 16.9 | 0.81 | 0.53 | 0.04 | 8.0 |
| 4427 | 93.21 | 0.05 | 20.3 | 1.43 | 1.43 | 1.00 | 0.96 | 0.96 | 0.061 | 2.03 | 11,5 | 8.9 | 15.5 | 0.81 | 0.50 | 0.03 | 8.0 |
| 4427 + 1/2 | 93.63 | 0.04 | 21.2 | 1.40 | 1.43 | 0.98 | 0.97 | 0.97 | 0.048 | 2.14 | 11,5 | 9.0 | 13.7 | 0.81 | 0.44 | 0.03 | 8.0 |
| 4428 | 93.98 | 0.03 | 21.5 | 1.44 | 1.46 | 0.98 | 0.86 | 0.86 | 0.092 | 2.61 | 11,6 | 8.9 | 12.8 | 0.81 | 0.37 | 0.03 | 8.0 |
| 4428 + 1/2 | 94.27 | 0.02 | 21.7 | 1.50 | 1.50 | 1.00 | 1.01 | 1.00 | 0.036 | 3.02 | 11,6 | 8.6 | 11.9 | 0.80 | 0.31 | 0.03 | 8.0 |
| 4429 | 94.53 | 0.04 | 22.1 | 1.56 | 1.56 | 1.00 | 0.98 | 0.98 | 0.038 | 2.89 | 11,6 | 8.4 | 11.9 | 0.80 | 0.24 | 0.80 | 8.0 |
| 4429 + 1/2 | 94.86 | 0.04 | 22.4 | 1.62 | 1.64 | 0.99 | 1.00 | 0.99 | 0.036 | 2.69 | 11,6 | 8.1 | 11.9 | 0.79 | 0.19 | 0.79 | 8.3 |
| 4430 | 95.12 | 0.08 | 22.7 | 1.71 | 1.69 | 1.01 | 1.02 | 1.01 | 0.032 | 3.91 | 2,8 | 8.0 | 13.5 | 0.79 | 0.15 | 0.79 | 8.2 |
| 4430 + 1/2 | 95.22 | 0.13 | 22.9 | 1.77 | 1.74 | 1.02 | 1.03 | 1.02 | 0.038 | 3.74 | 2,8 | 8.2 | 19.4 | 0.78 | 0.14 | 0.78 | 8.0 |
| 4431 | 95.05 | 0.10 | 23.1 | 1.83 | 1.77 | 1.03 | 1.09 | 1.03 | 0.037 | 3.57 | 2,7 | 8.0 | 13.6 | 0.77 | 0.14 | 0.77 | 8.0 |
| 4431 + 1/2 | 94.68 | 0.10 | 23.2 | 1.86 | 1.77 | 1.05 | 1.11 | 1.05 | 0.038 | 3.59 | 2,7 | 7.6 | 12.7 | 0.76 | 0.14 | 0.76 | 8.0 |
| 4432 | 94.12 | 0.08 | 23.4 | 1.88 | 1.77 | 1.06 | 1.13 | 1.06 | 0.047 | 2.72 | 2,7 | 7.6 | 12.4 | 0.75 | 0.12 | 0.73 | 8.0 |
| 4432 + 1/2 | 93.39 | 0.17 | 23.4 | 1.93 | 1.77 | 1.08 | 1.20 | 1.08 | 0.035 | 2.70 | 2,0 | 7.4 | 12.0 | 0.74 | 0.11 | 0.71 | 8.0 |
| 4433 | 92.33 | 0.15 | 23.4 | 1.88 | 1.78 | 1.06 | 1.18 | 1.06 | 0.044 | 2.44 | 1,2 | 7.2 | 11.6 | 0.71 | 0.11 | 0.69 | 8.0 |
| 4433 + 1/2 | 90.97 | 0.19 | 23.1 | 1.88 | 1.78 | 1.06 | 1.15 | 1.06 | 0.055 | 2.77 | 1,2 | 7.0 | 11.3 | 0.69 | 0.12 | 0.67 | 8.0 |
| 4434 | 89.24 | 0.04 | 22.7 | 1.87 | 1.78 | 1.05 | 1.13 | 1.05 | 0.062 | 2.94 | 1,2 | 6.9 | 10.9 | 0.66 | 0.14 | 0.64 | 8.0 |
| 4434 + 1/2 | 87.43 | 0.09 | 22.2 | 1.81 | 1.78 | 1.02 | 1.12 | 1.02 | 0.062 | 3.01 | 15,3 | 6.7 | 10.3 | 0.63 | 0.18 | 0.62 | 8.0 |
| 4435 | 85.43 | 0.01 | 22.1 | 1.78 | 1.78 | 1.00 | 1.11 | 1.00 | 0.072 | 3.39 | 0,2 | 6.8 | 10.1 | 0.60 | 0.23 | 0.59 | 8.0 |
| 4435 + 1/2 | 83.41 | 0.02 | 21.9 | 1.78 | 1.78 | 1.00 | 1.09 | 1.00 | 0.070 | 3.50 | 0,2 | 6.8 | 9.7 | 0.58 | 0.28 | 0.57 | 8.0 |
| 4436 | 81.42 | 0.06 | 21.2 | 1.78 | 1.78 | 1.00 | 1.05 | 1.00 | 0.092 | 3.02 | 15,4 | 6.7 | 9.6 | 0.55 | 0.32 | 0.54 | 8.0 |
| 4436 + 1/2 | 79.32 | 0.04 | 20.9 | 1.78 | 1.78 | 1.00 | 1.03 | 1.00 | 0.100 | 3.09 | 15,5 | 6.7 | 9.4 | 0.53 | 0.30 | 0.52 | 8.0 |
| 4437 | 77.13 | 0.02 | 20.8 | 1.79 | 1.78 | 1.01 | 1.03 | 1.01 | 0.108 | 4.72 | 15,5 | 6.7 | 9.4 | 0.50 | 0.31 | 0.49 | 8.0 |
| 4437 + 1/2 | 74.89 | 0.05 | 20.4 | 1.78 | 1.78 | 1.00 | 1.04 | 1.00 | 0.098 | 5.01 | 15,5 | 6.7 | 9.4 | 0.48 | 0.30 | 0.47 | 8.0 |
| 4438 | 72.56 | 0.05 | 19.7 | 1.80 | 1.78 | 1.01 | 0.97 | 0.97 | 0.121 | 3.41 | 15,5 | 6.7 | 9.1 | 0.45 | 0.29 | 0.45 | 8.0 |
| 4438 + 1/2 | 70.12 | 0.03 | 19.3 | 1.77 | 1.78 | 1.00 | 0.95 | 0.95 | 0.124 | 3.15 | 15,6 | 6.7 | 8.7 | 0.43 | 0.26 | 0.43 | 8.0 |
| 4439 | 67.75 | 0.03 | 19.2 | 1.76 | 1.78 | 0.99 | 0.90 | 0.90 | 0.137 | 3.11 | 15,7 | 6.8 | 9.9 | 0.41 | 0.23 | 0.41 | 8.0 |
| 4439 + 1/2 | 65.45 | 0.05 | 18.4 | 1.79 | 1.77 | 1.01 | 0.89 | 0.89 | 0.160 | 3.23 | 15,7 | 7.0 | 11.0 | 0.39 | 0.21 | 0.39 | 8.0 |
| 4440 | 63.25 | 0.03 | 18.4 | 1.79 | 1.77 | 1.01 | 0.93 | 0.93 | 0.145 | 3.36 | 15,5 | 7.0 | 12.0 | 0.37 | 0.18 | 0.37 | 8.0 |
| 4440 + 1/2 | 61.13 | 0.04 | 17.5 | 1.77 | 1.77 | 1.00 | 0.99 | 0.99 | 0.105 | 2.91 | 15,5 | 7.1 | 13.0 | 0.35 | 0.15 | 0.35 | 8.0 |
| 4441 | 59.08 | 0.04 | 16.9 | 1.78 | 1.76 | 1.01 | 1.00 | 1.00 | 0.106 | 2.68 | 13,3 | 7.4 | 13.0 | 0.33 | 0.13 | 0.33 | 8.0 |
| 4441 + 1/2 | 57.12 | 0.06 | 16.6 | 1.76 | 1.75 | 1.00 | 1.00 | 1.00 | 0.093 | 2.57 | 13,3 | 7.3 | 11.6 | 0.32 | 0.10 | 0.31 | 8.0 |
| 4442 | 55.27 | 0.03 | 16.0 | 1.74 | 1.73 | 1.00 | 0.94 | 0.94 | 0.127 | 2.45 | 13,3 | 7.3 | 11.4 | 0.30 | 0.08 | 0.30 | 8.0 |
| 4442 + 1/2 | 53.49 | 0.04 | 15.6 | 1.69 | 1.72 | 0.98 | 0.94 | 0.94 | 0.105 | 2.00 | 13,3 | 7.5 | 10.8 | 0.29 | 0.06 | 0.28 | 8.0 |
| 4443 | 51.78 | 0.03 | 15.0 | 1.71 | 1.69 | 1.01 | 0.97 | 0.97 | 0.095 | 2.05 | 13,3 | 7.6 | 12.6 | 0.27 | 0.04 | 0.27 | 8.0 |
| 4443 + 1/2 | 50.14 | 0.03 | 14.5 | 1.69 | 1.69 | 1.00 | 0.97 | 0.97 | 0.091 | 2.07 | 15,1 | 7.5 | 12.0 | 0.26 | 0.03 | 0.26 | 8.0 |
| 4444 | 48.57 | 0.05 | 14.2 | 1.68 | 1.67 | 1.01 | 1.04 | 1.01 | 0.065 | 2.23 | 11,1 | 7.5 | 11.5 | 0.25 | 0.02 | 0.24 | 8.0 |
| 4444 + 1/2 | 47.09 | 0.04 | 13.5 | 1.65 | 1.65 | 1.00 | 0.95 | 0.95 | 0.083 | 2.04 | 5,7 | 7.5 | 10.4 | 0.23 | 0.03 | 0.23 | 8.0 |
| 4445 | 45.70 | 0.04 | 13.1 | 1.62 | 1.63 | 0.99 | 1.02 | 0.99 | 0.057 | 2.01 | 5,7 | 7.6 | 9.7 | 0.22 | 0.02 | 0.22 | 8.0 |
| 4445 + 1/2 | 44.39 | 0.04 | 12.5 | 1.60 | 1.62 | 0.99 | 0.99 | 0.99 | 0.062 | 2.05 | 5,7 | 7.7 | 9.0 | 0.21 | 0.02 | 0.21 | 8.0 |
| 4446 | 43.16 | 0.03 | 12.0 | 1.60 | 1.61 | 0.99 | 1.05 | 0.99 | 0.038 | 1.81 | 5,7 | 7.8 | 9.0 | 0.20 | 0.03 | 0.20 | 8.0 |
| 4446 + 1/2 | 41.99 | 0.04 | 11.5 | 1.61 | 1.60 | 1.01 | 1.03 | 1.01 | 0.055 | 1.85 | 5,7 | 7.9 | 9.0 | 0.19 | 0.04 | 0.19 | 8.0 |
| 4447 | 40.89 | 0.03 | 10.7 | 1.60 | 1.59 | 1.01 | 1.03 | 1.01 | 0.054 | 1.81 | 14,1 | 8.0 | 9.0 | 0.18 | 0.04 | 0.18 | 8.0 |
| 4447 + 1/2 | 39.86 | 0.03 | 10.2 | 1.58 | 1.56 | 1.01 | 1.09 | 1.01 | 0.033 | 1.70 | 14,1 | 7.8 | 8.8 | 0.18 | 0.03 | 0.17 | 8.0 |
| 4448 | 38.88 | 0.03 | 9.4 | 1.53 | 1.54 | 0.99 | 0.99 | 0.99 | 0.055 | 2.17 | 13,1 | 7.7 | 8.5 | 0.17 | 0.03 | 0.17 | 8.0 |
| 4448 + 1/2 | 37.96 | 0.03 | 8.7 | 1.47 | 1.52 | 0.97 | 1.01 | 0.97 | 0.028 | 2.11 | 13,1 | 7.5 | 8.2 | 0.16 | 0.03 | 0.16 | 8.0 |
| 4449 | 37.10 | 0.03 | 8.0 | 1.45 | 1.49 | 0.97 | 0.99 | 0.97 | 0.024 | 1.88 | 13,1 | 7.2 | 8.0 | 0.16 | 0.04 | 0.15 | 8.0 |
| 4449 + 1/2 | 36.30 | 0.03 | 7.4 | 1.48 | 1.47 | 1.00 | 1.03 | 1.00 | 0.023 | 1.99 | 13,1 | 7.1 | 7.9 | 0.15 | 0.05 | 0.15 | 8.0 |
| 4450 | 35.54 | 0.02 | 6.5 | 1.48 | 1.46 | 1.01 | 1.05 | 1.01 | 0.020 | 1.75 | 14,2 | 7.0 | 7.6 | 0.15 | 0.07 | 0.14 | 8.0 |
| 4450 + 1/2 | 34.83 | 0.02 | 5.8 | 1.50 | 1.45 | 1.04 | 1.06 | 1.04 | 0.021 | 1.70 | 14,2 | 7.0 | 7.7 | 0.14 | 0.11 | 0.14 | 8.0 |
| 4451 | 34.17 | 0.02 | 5.1 | 1.45 | 1.44 | 1.01 | 1.06 | 1.01 | 0.006 | 1.69 | 14,2 | 6.4 | 7.0 | 0.14 | 0.09 | 0.13 | 8.0 |
| 4451 + 1/2 | 33.56 | 0.02 | 4.2 | 1.36 | 1.44 | 0.94 | 0.99 | 0.94 | 0.003 | 1.73 | 15,0 | 6.0 | 6.4 | 0.13 | 0.09 | 0.13 | 8.0 |
| 4452 | 32.98 | 0.02 | 3.4 | 1.38 | 1.39 | 0.99 | 1.02 | 0.99 | 0.006 | 1.88 | 13,7 | 5.9 | 6.4 | 0.13 | 0.09 | 0.12 | 8.0 |
| 4452 + 1/2 | 32.44 | 0.02 | 2.5 | 1.43 | 1.33 | 1.07 | 1.08 | 1.07 | 0.007 | 2.30 | 2,8 | 5.8 | 6.6 | 0.12 | 0.08 | 0.12 | 8.0 |
| 4453 | 31.94 | 0.02 | 1.9 | 1.31 | 1.23 | 1.07 | 1.06 | 1.06 | 0.007 | 1.98 | 2,8 | 5.9 | 6.6 | 0.12 | 0.09 | 0.12 | 8.0 |
| 4453 + 1/2 | 31.48 | 0.02 | 1.5 | 1.10 | 1.12 | 0.98 | 0.99 | 0.98 | 0.005 | 1.74 | 1,7 | 5.5 | 6.2 | 0.12 | 0.08 | 0.11 | 8.0 |
| 4454 last | 31.05 | 0.02 | 1.2 | 0.92 | 0.99 | 0.93 | 0.96 | 0.93 | 0.006 | 1.43 | 13,2 | 6.0 | 6.7 | 0.11 | 0.09 | 0.11 | 8.0 |
| 4454 + 1/2 | 30.67 | 0.02 | 1.0 | 0.82 | 0.94 | 0.86 | 0.98 | 0.86 | 0.003 | 1.50 | 13,2 | 5.8 | 6.7 | 0.11 | 0.07 | 0.11 | 8.0 |
| 4455 | 30.31 | 0.02 | 0.9 | 0.76 | 0.93 | 0.81 | 0.92 | 0.81 | 0.002 | 1.32 | 13,2 | 6.2 | 6.9 | 0.11 | 0.09 | 0.10 | 8.0 |
| 4455 + 1/2 | 30.00 | 0.01 | 0.8 | 0.74 | 0.90 | 0.82 | 0.94 | 0.82 | 0.001 | 1.29 | 5,3 | 6.5 | 7.5 | 0.10 | 0.06 | 0.10 | 8.0 |
| 4456 | 29.71 | 0.01 | 0.8 | 0.71 | 0.88 | 0.81 | 0.94 | 0.81 | 0.000 | 1.24 | 9,3 | 7.0 | 7.6 | 0.10 | 0.07 | 0.10 | 8.0 |
| 4456 + 1/2 | 29.44 | 0.01 | 0.7 | 0.69 | 0.87 | 0.79 | 0.92 | 0.79 | 0.002 | 1.30 | 9,3 |  |  | 0.10 | 0.06 | 0.10 | 8.0 |
| 4457 | 29.19 | 0.01 | 0.7 | 0.69 | 0.86 | 0.80 | 0.92 | 0.80 | 0.000 | 1.33 | 8,3 |  |  | 0.09 | 0.05 | 0.08 | 8.1 |
| 4457 + 1/2 | 28.96 | 0.01 | 0.8 | 0.69 | 0.84 | 0.82 | 0.93 | 0.82 | 0.000 | 1.58 | 12,2 |  |  | 0.08 | 0.06 | 0.07 | 8.0 |
| 4458 | 28.74 | 0.01 | 1.0 | 0.71 | 0.83 | 0.86 | 0.95 | 0.86 | 0.004 | 1.77 | 6,5 |  |  | 0.06 | 0.07 | 0.06 | 8.1 |
| 4458 + 1/2 | 28.54 | 0.01 | 1.6 | 0.74 | 0.82 | 0.90 | 0.97 | 0.90 | 0.005 | 2.33 | 12,2 |  |  | 0.05 | 0.05 | 0.05 | 8.6 |
| 4459 | 28.36 | 0.01 | 2.4 | 0.75 | 0.82 | 0.92 | 1.01 | 0.92 | 0.003 | 2.48 | 12,2 |  |  |  |  |  |  |
| 4459 + 1/2 | 28.19 | 0.01 | 3.3 | 0.81 | 0.82 | 1.00 | 1.01 | 1.00 | 0.021 | 2.22 | 11,5 |  |  |  |  |  |  |
| 4460 | 28.04 | 0.00 | 4.9 | 0.79 | 0.82 | 0.97 | 0.88 | 0.88 | 0.046 | 2.71 | 13,2 |  |  |  |  |  |  |
| 4460 + 1/2 | 27.89 | 0.01 | 6.3 | 0.85 | 0.81 | 1.04 | 0.92 | 0.92 | 0.054 | 3.04 | 6,4 |  |  |  |  |  |  |
| 4461 | 27.76 | 0.00 | 8.1 | 0.84 | 0.81 | 1.03 | 0.89 | 0.89 | 0.062 | 4.34 | 13,3 |  |  |  |  |  |  |
| 4461 + 1/2 | 27.63 | 0.01 | 9.8 | 0.88 | 0.81 | 1.08 | 0.98 | 0.98 | 0.055 | 5.96 | 13,3 |  |  |  |  |  |  |
| 4462 | 27.49 | 0.01 | 11.5 | 0.87 | 0.81 | 1.06 | 0.95 | 0.95 | 0.067 | 6.78 | 13,3 |  |  |  |  |  |  |
| 4462 + 1/2 | 27.33 | 0.01 | 16.5 | 0.96 | 0.81 | 1.18 | 1.01 | 1.01 | 0.107 | 5.35 | 14,3 |  |  |  |  |  |  |
| 4463 | 27.19 | 0.00 | 18.7 | 0.94 | 0.82 | 1.15 | 1.11 | 1.11 | 0.060 | 5.30 | 12,8 |  |  |  |  |  |  |
| 4463 + 1/2 | 27.06 | 0.01 | 18.9 | 0.88 | 0.83 | 1.06 | 1.05 | 1.05 | 0.048 | 5.83 | 7,4 |  |  |  |  |  |  |
| 4464 | 26.94 | 0.01 | 17.9 | 0.82 | 0.86 | 0.95 | 1.01 | 0.95 | 0.033 | 5.50 | 8,6 |  |  |  |  |  |  |
| 4464 + 1/2 | 26.84 | 0.01 | 16.8 | 0.81 | 0.86 | 0.94 | 0.96 | 0.94 | 0.035 | 4.80 | 9,7 |  |  |  |  |  |  |
| 4465 | 26.72 | 0.12 | 15.2 | 0.75 | 0.87 | 0.86 | 0.91 | 0.86 | 0.036 | 6.34 | 9,7 |  |  |  |  |  |  |
| 4465 + 1/2 | 26.37 | 0.27 | 13.5 | 0.76 | 0.88 | 0.86 | 0.87 | 0.86 | 0.032 | 6.57 | 10,7 |  |  |  |  |  |  |
| 4466 | 25.48 | 0.25 | 11.0 | 0.76 | 0.91 | 0.83 | 0.85 | 0.83 | 0.027 | 6.09 | 10,7 |  |  |  |  |  |  |
| 4466 + 1/2 | 24.09 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### rise, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.33 from frame 4463 to the next, limit 1.2.
Largest pop score of one block: 19.23 from frame 4465 + 1/2 to the next, block column 10 row 7 from the top left, shown, not judged.
Largest change in place: 75.5 from frame 4401 + 1/2 to 8 film frames later, most at pixel 1296, 504, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 4368 to 4379 + 1/2): change 14.0; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.081 from frame 4458 to the next, most at pixel 1198, 450, a patch of 80 by 76 px; 0 of 197 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 198 rows, which says nothing of them, quiet or not: frame 4466 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 4458 in /home/user/workspace/work/p6/hu9/04/uranus-rise-p2of2-pops-full.png, frame 4462 + 1/2 in /home/user/workspace/work/p6/hu9/04/uranus-rise-p2of2-pops-full.png, frame 4463 in /home/user/workspace/work/p6/hu9/04/uranus-rise-p2of2-pops-full.png, frame 4463 + 1/2 in /home/user/workspace/work/p6/hu9/04/uranus-rise-p2of2-pops-full.png, frame 4464 in /home/user/workspace/work/p6/hu9/04/uranus-rise-p2of2-pops-full.png.

With the carry at the full size the rise has 2 numbers over the limit or not measured.

- FULL SIZE RED pop score 1.33 from frame 4463 to the next, limit 1.2 (2 frames over it, first 4463)
- FULL SIZE RED the pattern of the picture changes in place by 1.48 from frame 4411 to 8 film frames later, band 8 px, limit 0.45 (90 frames over it, first 4380 + 1/2)

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4368 | 1.7 | 0.37 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 1,8 | 14.0 | 14.8 | 0.40 | 1.00 | 0.443 | 0.444 | 0.997 | 0.456 | 926,650 | 100 by 96 |
| 4368 + 1/2 | 1.6 | 0.38 | 0.38 | 1.01 | 1.01 | 1.01 | 0.000 | 1.14 | 7,1 | 14.0 | 14.9 | 0.40 | 1.01 | 0.447 | 0.444 | 1.006 | 0.458 | 406,578 | 108 by 132 |
| 4369 | 1.6 | 0.37 | 0.38 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 1,8 | 13.9 | 14.8 | 0.40 | 1.00 | 0.442 | 0.447 | 0.987 | 0.457 | 1678,958 | 92 by 156 |
| 4369 + 1/2 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 1,8 | 14.0 | 14.9 | 0.40 | 0.99 | 0.448 | 0.448 | 0.999 | 0.458 | 1454,842 | 156 by 108 |
| 4370 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.26 | 1,8 | 13.9 | 14.7 | 0.40 | 1.00 | 0.449 | 0.446 | 1.006 | 0.457 | 1910,1002 | 192 by 104 |
| 4370 + 1/2 | 1.6 | 0.38 | 0.38 | 1.01 | 1.01 | 1.01 | 0.000 | 1.16 | 5,0 | 14.0 | 14.9 | 0.40 | 1.00 | 0.450 | 0.448 | 1.004 | 0.457 | 1042,946 | 84 by 100 |
| 4371 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 1,8 | 13.9 | 14.8 | 0.40 | 1.00 | 0.445 | 0.449 | 0.991 | 0.456 | 1214,846 | 52 by 84 |
| 4371 + 1/2 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.27 | 10,4 | 13.9 | 14.8 | 0.40 | 1.00 | 0.449 | 0.448 | 1.002 | 0.456 | 102,486 | 92 by 68 |
| 4372 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 1,8 | 13.9 | 14.8 | 0.40 | 1.00 | 0.446 | 0.449 | 0.995 | 0.456 | 334,438 | 88 by 56 |
| 4372 + 1/2 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 15,6 | 13.8 | 14.7 | 0.40 | 1.00 | 0.449 | 0.450 | 0.998 | 0.457 | 1214,818 | 100 by 96 |
| 4373 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 5,5 | 13.7 | 14.7 | 0.40 | 1.00 | 0.451 | 0.449 | 1.005 | 0.456 | 634,602 | 140 by 252 |
| 4373 + 1/2 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 1,2 | 13.8 | 14.8 | 0.40 | 1.00 | 0.453 | 0.450 | 1.007 | 0.456 | 162,690 | 116 by 212 |
| 4374 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 6,8 | 13.9 | 14.9 | 0.40 | 1.00 | 0.448 | 0.452 | 0.992 | 0.456 | 574,774 | 112 by 104 |
| 4374 + 1/2 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 10,4 | 14.3 | 15.3 | 0.40 | 1.00 | 0.452 | 0.452 | 0.999 | 0.457 | 1254,858 | 108 by 108 |
| 4375 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 12,5 | 14.7 | 16.0 | 0.39 | 1.00 | 0.452 | 0.451 | 1.004 | 0.456 | 202,418 | 152 by 124 |
| 4375 + 1/2 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 6,7 | 15.5 | 16.8 | 0.39 | 1.00 | 0.451 | 0.452 | 0.998 | 0.454 | 554,698 | 140 by 140 |
| 4376 | 1.6 | 0.38 | 0.38 | 0.99 | 0.99 | 0.99 | 0.000 | 1.22 | 6,7 | 16.4 | 17.7 | 0.39 | 1.00 | 0.450 | 0.453 | 0.994 | 0.455 | 826,894 | 132 by 136 |
| 4376 + 1/2 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 7,7 | 17.6 | 18.9 | 0.38 | 1.00 | 0.454 | 0.452 | 1.004 | 0.457 | 1258,862 | 64 by 60 |
| 4377 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 5,7 | 18.9 | 20.2 | 0.38 | 0.99 | 0.453 | 0.453 | 0.999 | 0.455 | 1630,938 | 128 by 104 |
| 4377 + 1/2 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 15,3 | 20.4 | 21.8 | 0.38 | 0.99 | 0.454 | 0.453 | 1.001 | 0.454 | 1606,890 | 92 by 88 |
| 4378 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 6,7 | 22.2 | 23.5 | 0.37 | 0.99 | 0.453 | 0.453 | 0.999 | 0.455 | 538,638 | 84 by 100 |
| 4378 + 1/2 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 10,4 | 24.0 | 25.2 | 0.37 | 1.00 | 0.454 | 0.452 | 1.005 | 0.454 | 1606,954 | 100 by 72 |
| 4379 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 15,4 | 25.9 | 27.1 | 0.36 | 1.00 | 0.451 | 0.450 | 1.002 | 0.456 | 1102,974 | 148 by 124 |
| 4379 + 1/2 | 1.6 | 0.38 | 0.38 | 0.99 | 0.99 | 0.99 | 0.000 | 1.07 | 11,0 | 28.1 | 29.0 | 0.36 | 0.98 | 0.447 | 0.453 | 0.988 | 0.456 | 810,870 | 144 by 96 |
| 4380 | 1.6 | 0.37 | 0.38 | 0.98 | 0.98 | 0.98 | 0.000 | 1.97 | 1,8 | 30.5 | 31.2 | 0.35 | 0.97 | 0.440 | 0.453 | 0.971 | 0.454 | 218,978 | 128 by 112 |
| 4380 + 1/2 | 1.6 | 0.38 | 0.39 | 0.98 | 0.98 | 0.98 | 0.000 | 2.15 | 1,8 | 33.0 | 33.7 | 0.35 | 0.98 | 0.456 | 0.467 | 0.976 | 0.452 | 78,1002 | 80 by 68 |
| 4381 | 1.7 | 0.40 | 0.40 | 0.99 | 0.99 | 0.99 | 0.000 | 2.35 | 1,8 | 35.5 | 36.5 | 0.34 | 0.99 | 0.487 | 0.493 | 0.986 | 0.454 | 378,842 | 196 by 156 |
| 4381 + 1/2 | 1.9 | 0.42 | 0.43 | 0.99 | 0.99 | 0.99 | 0.000 | 2.53 | 1,8 | 38.0 | 39.5 | 0.34 | 0.99 | 0.531 | 0.539 | 0.985 | 0.451 | 554,482 | 68 by 76 |
| 4382 | 2.1 | 0.46 | 0.47 | 0.98 | 0.98 | 0.98 | 0.000 | 2.84 | 1,8 | 40.5 | 42.5 | 0.34 | 1.00 | 0.592 | 0.605 | 0.979 | 0.450 | 1250,874 | 48 by 40 |
| 4382 + 1/2 | 2.4 | 0.51 | 0.51 | 1.00 | 1.00 | 1.00 | 0.000 | 3.25 | 1,8 | 43.0 | 45.5 | 0.33 | 1.00 | 0.678 | 0.682 | 0.994 | 0.451 | 1478,1070 | 72 by 28 |
| 4383 | 2.8 | 0.56 | 0.57 | 0.99 | 0.99 | 0.99 | 0.001 | 3.28 | 1,8 | 45.2 | 48.2 | 0.33 | 1.01 | 0.772 | 0.775 | 0.997 | 0.449 | 1834,1070 | 180 by 60 |
| 4383 + 1/2 | 3.1 | 0.63 | 0.62 | 1.01 | 1.01 | 1.01 | 0.001 | 3.11 | 1,8 | 47.2 | 50.7 | 0.33 | 1.00 | 0.871 | 0.871 | 1.000 | 0.446 | 174,1018 | 152 by 100 |
| 4384 | 3.4 | 0.68 | 0.68 | 1.00 | 0.99 | 0.99 | 0.000 | 3.03 | 0,8 | 48.4 | 52.1 | 0.33 | 1.00 | 0.971 | 0.966 | 1.005 | 0.444 | 122,1022 | 84 by 60 |
| 4384 + 1/2 | 3.8 | 0.74 | 0.73 | 1.01 | 1.01 | 1.01 | 0.000 | 3.11 | 0,8 | 50.2 | 54.0 | 0.33 | 1.01 | 1.061 | 1.057 | 1.004 | 0.446 | 110,1026 | 80 by 52 |
| 4385 | 4.1 | 0.78 | 0.79 | 0.99 | 1.00 | 0.99 | 0.000 | 2.91 | 0,8 | 51.9 | 55.8 | 0.33 | 1.00 | 1.143 | 1.142 | 1.001 | 0.445 | 94,1034 | 108 by 52 |
| 4385 + 1/2 | 4.5 | 0.84 | 0.84 | 1.01 | 1.00 | 1.00 | 0.013 | 2.48 | 0,8 | 53.7 | 57.4 | 0.33 | 1.01 | 1.222 | 1.219 | 1.003 | 0.445 | 1694,990 | 88 by 68 |
| 4386 | 4.7 | 0.89 | 0.89 | 1.00 | 1.01 | 1.00 | 0.010 | 2.30 | 9,1 | 55.2 | 58.9 | 0.33 | 1.00 | 1.295 | 1.293 | 1.002 | 0.446 | 942,818 | 84 by 52 |
| 4386 + 1/2 | 5.0 | 0.94 | 0.94 | 1.00 | 1.01 | 1.00 | 0.022 | 2.20 | 9,1 | 56.9 | 60.3 | 0.33 | 1.00 | 1.364 | 1.360 | 1.002 | 0.446 | 950,830 | 200 by 92 |
| 4387 | 5.2 | 0.98 | 0.98 | 1.01 | 0.99 | 0.99 | 0.056 | 2.43 | 9,1 | 58.0 | 61.6 | 0.34 | 0.93 | 1.425 | 1.421 | 1.003 | 0.448 | 958,854 | 136 by 80 |
| 4387 + 1/2 | 5.5 | 1.01 | 1.02 | 0.99 | 1.00 | 0.99 | 0.052 | 2.03 | 14,4 | 59.2 | 62.6 | 0.34 | 0.95 | 1.479 | 1.482 | 0.998 | 0.452 | 874,750 | 76 by 68 |
| 4388 | 5.7 | 1.06 | 1.05 | 1.01 | 1.00 | 1.00 | 0.056 | 2.37 | 9,1 | 60.2 | 63.6 | 0.35 | 0.96 | 1.540 | 1.533 | 1.005 | 0.453 | 978,894 | 168 by 84 |
| 4388 + 1/2 | 5.9 | 1.09 | 1.09 | 1.00 | 1.01 | 1.00 | 0.051 | 2.03 | 9,1 | 61.1 | 64.0 | 0.36 | 0.97 | 1.586 | 1.588 | 0.999 | 0.455 | 998,922 | 76 by 60 |
| 4389 | 6.1 | 1.13 | 1.12 | 1.00 | 0.99 | 0.99 | 0.057 | 1.68 | 6,8 | 62.1 | 64.3 | 0.36 | 0.98 | 1.636 | 1.632 | 1.002 | 0.456 | 934,878 | 52 by 48 |
| 4389 + 1/2 | 6.3 | 1.16 | 1.16 | 0.99 | 1.02 | 0.99 | 0.039 | 1.74 | 6,0 | 62.5 | 64.4 | 0.37 | 1.00 | 1.678 | 1.678 | 1.000 | 0.458 | 1346,962 | 112 by 56 |
| 4390 | 6.4 | 1.20 | 1.19 | 1.01 | 0.99 | 0.99 | 0.058 | 1.67 | 8,0 | 62.8 | 64.6 | 0.37 | 1.01 | 1.720 | 1.715 | 1.003 | 0.460 | 1270,962 | 124 by 60 |
| 4390 + 1/2 | 6.7 | 1.22 | 1.22 | 1.00 | 1.01 | 1.00 | 0.049 | 2.00 | 6,0 | 63.1 | 65.2 | 0.38 | 1.01 | 1.751 | 1.749 | 1.002 | 0.462 | 1262,970 | 112 by 52 |
| 4391 | 6.8 | 1.24 | 1.25 | 0.99 | 1.00 | 0.99 | 0.069 | 1.75 | 13,2 | 63.2 | 65.9 | 0.38 | 1.00 | 1.777 | 1.777 | 1.000 | 0.465 | 1250,978 | 116 by 52 |
| 4391 + 1/2 | 7.0 | 1.28 | 1.27 | 1.01 | 1.04 | 1.01 | 0.054 | 1.97 | 13,2 | 63.5 | 68.5 | 0.39 | 1.01 | 1.803 | 1.796 | 1.004 | 0.467 | 1302,994 | 112 by 56 |
| 4392 | 7.2 | 1.31 | 1.29 | 1.02 | 1.06 | 1.02 | 0.056 | 2.56 | 13,2 | 63.4 | 69.4 | 0.39 | 1.03 | 1.816 | 1.817 | 1.000 | 0.470 | 1298,1006 | 64 by 52 |
| 4392 + 1/2 | 7.5 | 1.33 | 1.30 | 1.02 | 1.08 | 1.02 | 0.054 | 2.68 | 13,2 | 63.3 | 69.6 | 0.40 | 1.05 | 1.830 | 1.824 | 1.003 | 0.472 | 1286,1014 | 64 by 52 |
| 4393 | 7.8 | 1.35 | 1.30 | 1.04 | 1.09 | 1.04 | 0.061 | 2.80 | 15,2 | 65.8 | 71.7 | 0.40 | 1.06 | 1.832 | 1.826 | 1.003 | 0.475 | 1278,1022 | 60 by 56 |
| 4393 + 1/2 | 8.1 | 1.37 | 1.30 | 1.05 | 1.08 | 1.05 | 0.065 | 2.82 | 15,2 | 67.1 | 73.3 | 0.41 | 1.07 | 1.833 | 1.826 | 1.003 | 0.479 | 1274,1030 | 60 by 56 |
| 4394 | 8.3 | 1.36 | 1.30 | 1.05 | 1.08 | 1.05 | 0.059 | 2.60 | 15,2 | 69.5 | 76.6 | 0.42 | 1.04 | 1.823 | 1.824 | 0.999 | 0.482 | 1262,1034 | 68 by 52 |
| 4394 + 1/2 | 8.7 | 1.39 | 1.30 | 1.07 | 1.09 | 1.07 | 0.053 | 2.94 | 10,0 | 69.8 | 76.7 | 0.42 | 1.04 | 1.816 | 1.809 | 1.004 | 0.486 | 1246,1038 | 64 by 60 |
| 4395 | 9.0 | 1.39 | 1.30 | 1.07 | 1.07 | 1.07 | 0.063 | 2.82 | 10,0 | 70.0 | 76.8 | 0.43 | 1.07 | 1.796 | 1.802 | 0.996 | 0.489 | 1306,1022 | 132 by 96 |
| 4395 + 1/2 | 9.4 | 1.39 | 1.30 | 1.07 | 1.10 | 1.07 | 0.057 | 3.35 | 10,0 | 70.0 | 76.7 | 0.44 | 1.08 | 1.789 | 1.783 | 1.003 | 0.493 | 1222,1002 | 64 by 52 |
| 4396 | 9.9 | 1.39 | 1.30 | 1.07 | 1.01 | 1.01 | 0.085 | 3.24 | 10,0 | 69.4 | 76.2 | 0.45 | 0.99 | 1.770 | 1.768 | 1.001 | 0.498 | 1214,1010 | 68 by 52 |
| 4396 + 1/2 | 10.3 | 1.39 | 1.30 | 1.07 | 1.04 | 1.04 | 0.068 | 3.34 | 10,0 | 68.9 | 75.7 | 0.45 | 1.03 | 1.748 | 1.747 | 1.000 | 0.502 | 1210,1018 | 68 by 48 |
| 4397 | 10.8 | 1.39 | 1.30 | 1.07 | 1.05 | 1.05 | 0.085 | 3.20 | 10,0 | 68.2 | 74.9 | 0.46 | 1.03 | 1.725 | 1.729 | 0.998 | 0.506 | 1206,1026 | 76 by 52 |
| 4397 + 1/2 | 10.9 | 1.39 | 1.30 | 1.07 | 1.00 | 1.00 | 0.104 | 2.29 | 11,0 | 67.0 | 73.9 | 0.46 | 0.98 | 1.710 | 1.700 | 1.005 | 0.511 | 1202,1030 | 80 by 52 |
| 4398 | 11.4 | 1.36 | 1.30 | 1.04 | 1.01 | 1.01 | 0.078 | 2.31 | 14,1 | 66.7 | 72.4 | 0.48 | 1.01 | 1.675 | 1.681 | 0.996 | 0.516 | 1194,1034 | 88 by 56 |
| 4398 + 1/2 | 11.7 | 1.35 | 1.31 | 1.04 | 0.99 | 0.99 | 0.085 | 2.53 | 14,1 | 65.6 | 71.2 | 0.48 | 0.99 | 1.653 | 1.648 | 1.003 | 0.521 | 1182,1038 | 104 by 68 |
| 4399 | 12.2 | 1.32 | 1.32 | 1.00 | 1.02 | 1.00 | 0.064 | 2.56 | 13,0 | 65.9 | 75.2 | 0.49 | 0.99 | 1.621 | 1.625 | 0.998 | 0.528 | 1378,934 | 60 by 52 |
| 4399 + 1/2 | 12.6 | 1.30 | 1.32 | 0.98 | 0.98 | 0.98 | 0.068 | 2.42 | 13,0 | 68.0 | 89.3 | 0.50 | 0.98 | 1.597 | 1.601 | 0.997 | 0.533 | 1362,930 | 60 by 52 |
| 4400 | 12.9 | 1.31 | 1.32 | 0.99 | 1.00 | 0.99 | 0.045 | 3.40 | 15,1 | 71.9 | 87.3 | 0.51 | 0.98 | 1.581 | 1.581 | 0.999 | 0.539 | 170,806 | 108 by 52 |
| 4400 + 1/2 | 13.4 | 1.32 | 1.33 | 0.99 | 0.94 | 0.94 | 0.059 | 2.70 | 14,5 | 74.8 | 85.9 | 0.51 | 0.94 | 1.566 | 1.564 | 1.001 | 0.545 | 1246,1022 | 76 by 56 |
| 4401 | 13.7 | 1.29 | 1.33 | 0.97 | 0.91 | 0.91 | 0.086 | 3.14 | 14,5 | 71.6 | 87.6 | 0.52 | 0.92 | 1.548 | 1.560 | 0.992 | 0.551 | 210,830 | 88 by 48 |
| 4401 + 1/2 | 14.1 | 1.27 | 1.33 | 0.96 | 0.99 | 0.96 | 0.047 | 3.33 | 14,5 | 75.5 | 85.6 | 0.53 | 0.99 | 1.540 | 1.553 | 0.992 | 0.558 | 1426,946 | 64 by 48 |
| 4402 | 14.5 | 1.29 | 1.32 | 0.98 | 1.00 | 0.98 | 0.050 | 3.42 | 14,5 | 74.1 | 82.1 | 0.54 | 1.00 | 1.554 | 1.549 | 1.003 | 0.564 | 1826,626 | 116 by 60 |
| 4402 + 1/2 | 14.9 | 1.26 | 1.32 | 0.95 | 1.00 | 0.95 | 0.053 | 3.38 | 15,5 | 66.8 | 78.0 | 0.55 | 1.00 | 1.551 | 1.551 | 1.000 | 0.571 | 1894,626 | 132 by 60 |
| 4403 | 15.1 | 1.26 | 1.32 | 0.96 | 0.98 | 0.96 | 0.080 | 3.20 | 13,4 | 64.1 | 71.0 | 0.56 | 0.99 | 1.557 | 1.552 | 1.003 | 0.577 | 1838,598 | 288 by 80 |
| 4403 + 1/2 | 15.4 | 1.27 | 1.32 | 0.96 | 0.97 | 0.96 | 0.092 | 3.82 | 13,4 | 59.2 | 69.1 | 0.56 | 0.97 | 1.547 | 1.552 | 0.997 | 0.584 | 1758,578 | 120 by 72 |
| 4404 | 15.4 | 1.27 | 1.31 | 0.97 | 1.00 | 0.97 | 0.072 | 4.33 | 13,4 | 58.3 | 69.4 | 0.57 | 0.98 | 1.553 | 1.552 | 1.001 | 0.592 | 1818,554 | 240 by 64 |
| 4404 + 1/2 | 15.4 | 1.27 | 1.30 | 0.98 | 1.01 | 0.98 | 0.067 | 4.48 | 13,4 | 49.2 | 58.5 | 0.58 | 0.98 | 1.548 | 1.557 | 0.994 | 0.599 | 1394,474 | 132 by 68 |
| 4405 | 15.8 | 1.29 | 1.30 | 0.99 | 0.99 | 0.99 | 0.103 | 4.29 | 13,4 | 47.2 | 60.6 | 0.59 | 0.99 | 1.562 | 1.551 | 1.007 | 0.607 | 1886,530 | 228 by 84 |
| 4405 + 1/2 | 16.1 | 1.30 | 1.30 | 1.01 | 1.00 | 1.00 | 0.108 | 3.77 | 13,4 | 51.4 | 58.5 | 0.60 | 0.98 | 1.566 | 1.549 | 1.011 | 0.614 | 1350,438 | 264 by 64 |
| 4406 | 16.3 | 1.30 | 1.29 | 1.00 | 0.95 | 0.95 | 0.152 | 4.19 | 12,3 | 39.7 | 47.4 | 0.60 | 0.92 | 1.547 | 1.556 | 0.994 | 0.623 | 1434,430 | 624 by 100 |
| 4406 + 1/2 | 16.4 | 1.32 | 1.29 | 1.03 | 1.00 | 1.00 | 0.128 | 3.94 | 12,3 | 32.0 | 53.0 | 0.61 | 0.99 | 1.551 | 1.547 | 1.003 | 0.632 | 1710,442 | 732 by 108 |
| 4407 | 16.4 | 1.32 | 1.29 | 1.03 | 1.01 | 1.01 | 0.132 | 4.10 | 13,3 | 28.4 | 40.0 | 0.62 | 1.00 | 1.546 | 1.541 | 1.003 | 0.641 | 1626,410 | 196 by 48 |
| 4407 + 1/2 | 16.4 | 1.33 | 1.28 | 1.04 | 1.03 | 1.03 | 0.131 | 4.18 | 13,3 | 28.0 | 33.2 | 0.64 | 1.00 | 1.536 | 1.537 | 0.999 | 0.650 | 1546,386 | 972 by 116 |
| 4408 | 16.7 | 1.35 | 1.27 | 1.06 | 1.05 | 1.05 | 0.129 | 3.76 | 14,3 | 22.0 | 24.6 | 0.65 | 1.01 | 1.527 | 1.517 | 1.006 | 0.660 | 1454,358 | 688 by 108 |
| 4408 + 1/2 | 16.3 | 1.33 | 1.27 | 1.05 | 1.06 | 1.05 | 0.126 | 3.17 | 10,2 | 23.5 | 29.1 | 0.66 | 1.01 | 1.499 | 1.504 | 0.997 | 0.670 | 1554,354 | 504 by 64 |
| 4409 | 16.7 | 1.34 | 1.27 | 1.06 | 1.05 | 1.05 | 0.136 | 3.53 | 10,2 | 23.2 | 27.1 | 0.67 | 1.01 | 1.480 | 1.474 | 1.004 | 0.680 | 1766,346 | 584 by 68 |
| 4409 + 1/2 | 16.7 | 1.33 | 1.27 | 1.05 | 1.05 | 1.05 | 0.104 | 3.77 | 10,2 | 24.8 | 28.1 | 0.68 | 0.99 | 1.449 | 1.446 | 1.002 | 0.690 | 1902,338 | 648 by 84 |
| 4410 | 16.5 | 1.32 | 1.27 | 1.04 | 1.03 | 1.03 | 0.125 | 3.65 | 10,2 | 25.9 | 28.8 | 0.69 | 1.00 | 1.413 | 1.418 | 0.997 | 0.701 | 1502,282 | 272 by 52 |
| 4410 + 1/2 | 16.7 | 1.30 | 1.26 | 1.03 | 1.00 | 1.00 | 0.153 | 3.20 | 10,2 | 26.9 | 29.3 | 0.70 | 0.96 | 1.387 | 1.393 | 0.995 | 0.712 | 1418,262 | 160 by 44 |
| 4411 | 16.6 | 1.28 | 1.26 | 1.01 | 0.99 | 0.99 | 0.128 | 2.75 | 9,2 | 27.5 | 29.7 | 0.71 | 0.95 | 1.373 | 1.370 | 1.002 | 0.722 | 1866,258 | 328 by 60 |
| 4411 + 1/2 | 16.3 | 1.26 | 1.27 | 1.00 | 1.02 | 1.00 | 0.100 | 2.70 | 12,1 | 27.5 | 29.9 | 0.72 | 0.97 | 1.354 | 1.351 | 1.002 | 0.733 | 1874,242 | 688 by 80 |
| 4412 | 16.8 | 1.27 | 1.24 | 1.02 | 1.04 | 1.02 | 0.080 | 3.07 | 11,1 | 27.3 | 29.9 | 0.73 | 0.96 | 1.328 | 1.319 | 1.007 | 0.743 | 1434,190 | 636 by 60 |
| 4412 + 1/2 | 16.2 | 1.23 | 1.24 | 0.99 | 0.98 | 0.98 | 0.133 | 3.04 | 11,1 | 27.4 | 29.6 | 0.74 | 0.96 | 1.284 | 1.302 | 0.986 | 0.754 | 1878,186 | 220 by 48 |
| 4413 | 17.7 | 1.23 | 1.22 | 1.00 | 0.99 | 0.99 | 0.099 | 3.09 | 10,1 | 27.6 | 29.6 | 0.74 | 0.97 | 1.275 | 1.278 | 0.998 | 0.765 | 1846,150 | 448 by 60 |
| 4413 + 1/2 | 18.2 | 1.22 | 1.21 | 1.00 | 1.00 | 1.00 | 0.109 | 3.10 | 9,1 | 27.8 | 29.3 | 0.75 | 0.99 | 1.272 | 1.266 | 1.005 | 0.776 | 1598,122 | 532 by 72 |
| 4414 | 20.2 | 1.19 | 1.21 | 0.98 | 0.98 | 0.98 | 0.101 | 2.96 | 9,1 | 27.9 | 29.0 | 0.76 | 0.98 | 1.245 | 1.265 | 0.984 | 0.786 | 1378,122 | 340 by 56 |
| 4414 + 1/2 | 17.9 | 1.20 | 1.20 | 1.00 | 1.01 | 1.00 | 0.071 | 4.12 | 14,0 | 28.0 | 29.6 | 0.77 | 1.00 | 1.257 | 1.249 | 1.006 | 0.795 | 1746,58 | 268 by 64 |
| 4415 | 17.7 | 1.20 | 1.19 | 1.01 | 0.97 | 0.97 | 0.096 | 3.84 | 11,0 | 28.1 | 29.9 | 0.78 | 1.01 | 1.254 | 1.237 | 1.014 | 0.802 | 1446,58 | 652 by 72 |
| 4415 + 1/2 | 17.5 | 1.19 | 1.18 | 1.01 | 1.02 | 1.01 | 0.073 | 3.88 | 10,0 | 28.2 | 29.9 | 0.79 | 1.03 | 1.229 | 1.232 | 0.998 | 0.806 | 1326,50 | 272 by 64 |
| 4416 | 17.3 | 1.18 | 1.18 | 1.00 | 1.03 | 1.00 | 0.061 | 3.52 | 10,0 | 28.0 | 28.9 | 0.80 | 1.02 | 1.210 | 1.210 | 1.000 | 0.810 | 1326,42 | 192 by 56 |
| 4416 + 1/2 | 17.6 | 1.16 | 1.17 | 0.99 | 1.01 | 0.99 | 0.063 | 3.43 | 9,0 | 27.2 | 28.4 | 0.81 | 1.00 | 1.190 | 1.197 | 0.995 | 0.813 | 1158,50 | 104 by 64 |
| 4417 | 17.5 | 1.15 | 1.16 | 0.99 | 1.01 | 0.99 | 0.070 | 3.38 | 9,0 | 26.5 | 27.9 | 0.81 | 1.00 | 1.184 | 1.181 | 1.002 | 0.816 | 1110,46 | 108 by 56 |
| 4417 + 1/2 | 17.3 | 1.14 | 1.16 | 0.98 | 1.00 | 0.98 | 0.067 | 3.12 | 9,0 | 25.8 | 27.8 | 0.82 | 0.99 | 1.172 | 1.173 | 0.999 | 0.822 | 1114,10 | 144 by 48 |
| 4418 | 16.5 | 1.14 | 1.16 | 0.99 | 0.99 | 0.99 | 0.107 | 3.13 | 8,0 | 24.9 | 26.6 | 0.82 | 1.00 | 1.161 | 1.164 | 0.998 | 0.825 | 1014,26 | 232 by 52 |
| 4418 + 1/2 | 17.7 | 1.14 | 1.16 | 0.99 | 1.01 | 0.99 | 0.077 | 3.02 | 8,0 | 23.9 | 25.1 | 0.82 | 0.99 | 1.154 | 1.158 | 0.996 | 0.827 | 978,34 | 140 by 68 |
| 4419 | 18.0 | 1.15 | 1.15 | 1.00 | 0.99 | 0.99 | 0.104 | 2.57 | 8,0 | 23.1 | 24.4 | 0.82 | 0.99 | 1.155 | 1.148 | 1.006 | 0.829 | 6,990 | 52 by 124 |
| 4419 + 1/2 | 18.3 | 1.16 | 1.15 | 1.01 | 1.00 | 1.00 | 0.082 | 2.56 | 0,8 | 22.2 | 23.7 | 0.82 | 1.00 | 1.142 | 1.138 | 1.003 | 0.829 | 898,10 | 80 by 48 |
| 4420 | 18.3 | 1.16 | 1.15 | 1.01 | 1.01 | 1.01 | 0.083 | 2.10 | 7,0 | 21.1 | 22.8 | 0.83 | 1.00 | 1.123 | 1.125 | 0.998 | 0.829 | 70,1026 | 56 by 96 |
| 4420 + 1/2 | 18.5 | 1.17 | 1.14 | 1.02 | 1.00 | 1.00 | 0.091 | 2.11 | 7,0 | 19.9 | 21.7 | 0.83 | 0.99 | 1.108 | 1.103 | 1.005 | 0.829 | 78,1074 | 60 by 112 |
| 4421 | 18.2 | 1.16 | 1.14 | 1.02 | 1.00 | 1.00 | 0.100 | 1.84 | 7,0 | 18.7 | 20.1 | 0.83 | 0.98 | 1.082 | 1.085 | 0.997 | 0.828 | 1658,710 | 80 by 60 |
| 4421 + 1/2 | 18.8 | 1.15 | 1.14 | 1.01 | 0.95 | 0.95 | 0.130 | 2.00 | 0,8 | 17.3 | 18.8 | 0.83 | 0.92 | 1.063 | 1.060 | 1.002 | 0.826 | 814,6 | 56 by 44 |
| 4422 | 18.3 | 1.15 | 1.13 | 1.02 | 1.05 | 1.02 | 0.079 | 1.76 | 13,8 | 16.1 | 19.9 | 0.83 | 0.96 | 1.038 | 1.032 | 1.006 | 0.825 | 1610,686 | 80 by 56 |
| 4422 + 1/2 | 19.0 | 1.13 | 1.14 | 0.99 | 0.95 | 0.95 | 0.131 | 1.90 | 13,8 | 14.9 | 19.3 | 0.83 | 0.86 | 1.002 | 0.998 | 1.003 | 0.824 | 1590,1074 | 68 by 40 |
| 4423 | 19.0 | 1.11 | 1.14 | 0.98 | 1.06 | 0.98 | 0.075 | 1.94 | 1,8 | 13.7 | 19.8 | 0.83 | 0.93 | 0.959 | 0.954 | 1.005 | 0.823 | 1566,1054 | 80 by 76 |
| 4423 + 1/2 | 18.5 | 1.12 | 1.14 | 0.99 | 0.96 | 0.96 | 0.120 | 1.88 | 1,8 | 12.8 | 19.2 | 0.82 | 0.83 | 0.906 | 0.909 | 0.997 | 0.821 | 1542,1030 | 64 by 88 |
| 4424 | 19.3 | 1.05 | 1.13 | 0.93 | 1.03 | 0.93 | 0.068 | 1.59 | 12,8 | 11.8 | 17.3 | 0.82 | 0.90 | 0.859 | 0.867 | 0.991 | 0.819 | 1526,1002 | 64 by 68 |
| 4424 + 1/2 | 19.6 | 1.02 | 1.13 | 0.90 | 0.99 | 0.90 | 0.061 | 1.55 | 12,7 | 11.3 | 17.8 | 0.82 | 0.89 | 0.827 | 0.822 | 1.007 | 0.818 | 682,686 | 56 by 96 |
| 4425 | 20.0 | 1.01 | 1.13 | 0.89 | 0.97 | 0.89 | 0.052 | 2.77 | 1,8 | 11.2 | 18.2 | 0.82 | 0.92 | 0.784 | 0.785 | 1.000 | 0.816 | 762,666 | 72 by 120 |
| 4425 + 1/2 | 19.9 | 0.99 | 1.12 | 0.88 | 0.93 | 0.88 | 0.059 | 1.58 | 7,6 | 11.1 | 18.6 | 0.82 | 0.91 | 0.742 | 0.739 | 1.005 | 0.814 | 1022,470 | 156 by 112 |
| 4426 | 20.0 | 0.96 | 1.12 | 0.86 | 0.89 | 0.86 | 0.068 | 2.79 | 1,8 | 10.6 | 20.9 | 0.82 | 0.91 | 0.693 | 0.693 | 1.000 | 0.812 | 1270,430 | 120 by 80 |
| 4426 + 1/2 | 20.2 | 0.99 | 1.11 | 0.90 | 0.86 | 0.86 | 0.075 | 2.37 | 1,8 | 9.9 | 20.5 | 0.81 | 0.93 | 0.644 | 0.656 | 0.982 | 0.809 | 1334,494 | 76 by 64 |
| 4427 | 20.3 | 0.97 | 1.10 | 0.88 | 0.87 | 0.87 | 0.059 | 1.77 | 15,8 | 9.4 | 19.2 | 0.81 | 0.96 | 0.619 | 0.610 | 1.015 | 0.806 | 1914,794 | 48 by 104 |
| 4427 + 1/2 | 21.2 | 0.92 | 1.09 | 0.84 | 0.85 | 0.84 | 0.047 | 2.34 | 0,1 | 8.3 | 16.7 | 0.81 | 0.97 | 0.576 | 0.571 | 1.009 | 0.803 | 1766,894 | 112 by 168 |
| 4428 | 21.5 | 0.90 | 1.08 | 0.84 | 0.71 | 0.71 | 0.087 | 1.74 | 2,8 | 7.3 | 15.6 | 0.81 | 0.86 | 0.523 | 0.533 | 0.980 | 0.800 | 1914,106 | 60 by 56 |
| 4428 + 1/2 | 21.7 | 0.93 | 1.06 | 0.88 | 0.88 | 0.88 | 0.035 | 2.54 | 0,1 | 7.0 | 13.4 | 0.80 | 1.00 | 0.490 | 0.501 | 0.980 | 0.797 | 1854,118 | 108 by 108 |
| 4429 | 22.1 | 0.98 | 1.05 | 0.93 | 0.88 | 0.88 | 0.037 | 2.29 | 2,8 | 7.7 | 13.4 | 0.80 | 0.98 | 0.473 | 0.484 | 0.977 | 0.793 | 1866,186 | 156 by 152 |
| 4429 + 1/2 | 22.4 | 1.03 | 1.05 | 0.99 | 0.95 | 0.95 | 0.035 | 2.49 | 0,2 | 7.6 | 13.4 | 0.79 | 0.99 | 0.478 | 0.472 | 1.013 | 0.789 | 1818,190 | 288 by 220 |
| 4430 | 22.7 | 1.09 | 1.04 | 1.05 | 0.99 | 0.99 | 0.032 | 2.82 | 2,8 | 8.0 | 14.4 | 0.79 | 1.01 | 0.471 | 0.468 | 1.006 | 0.784 | 1914,90 | 124 by 116 |
| 4430 + 1/2 | 22.9 | 1.14 | 1.04 | 1.10 | 1.00 | 1.00 | 0.038 | 3.22 | 2,8 | 7.8 | 19.3 | 0.78 | 1.02 | 0.463 | 0.461 | 1.003 | 0.777 | 1914,130 | 172 by 152 |
| 4431 | 23.1 | 1.14 | 1.04 | 1.10 | 1.08 | 1.08 | 0.037 | 3.22 | 2,7 | 7.9 | 13.1 | 0.77 | 1.03 | 0.452 | 0.449 | 1.007 | 0.769 | 1914,174 | 144 by 148 |
| 4431 + 1/2 | 23.2 | 1.15 | 1.04 | 1.11 | 1.10 | 1.10 | 0.037 | 3.83 | 0,6 | 7.3 | 14.4 | 0.76 | 1.05 | 0.435 | 0.439 | 0.990 | 0.760 | 1914,230 | 260 by 272 |
| 4432 | 23.4 | 1.13 | 1.04 | 1.09 | 1.09 | 1.09 | 0.045 | 4.53 | 0,6 | 7.2 | 12.9 | 0.75 | 1.06 | 0.427 | 0.432 | 0.988 | 0.749 | 1614,710 | 76 by 136 |
| 4432 + 1/2 | 23.4 | 1.16 | 1.04 | 1.12 | 1.18 | 1.12 | 0.034 | 4.16 | 0,5 | 7.4 | 12.5 | 0.74 | 1.08 | 0.419 | 0.428 | 0.980 | 0.737 | 1506,730 | 108 by 260 |
| 4433 | 23.4 | 1.11 | 1.05 | 1.05 | 1.16 | 1.05 | 0.042 | 2.94 | 3,8 | 6.8 | 11.0 | 0.71 | 1.06 | 0.429 | 0.409 | 1.048 | 0.719 | 1214,438 | 292 by 156 |
| 4433 + 1/2 | 23.1 | 1.09 | 1.06 | 1.03 | 1.11 | 1.03 | 0.054 | 2.48 | 15,2 | 6.7 | 12.0 | 0.69 | 1.06 | 0.399 | 0.388 | 1.029 | 0.694 | 1250,870 | 160 by 92 |
| 4434 | 22.7 | 1.07 | 1.06 | 1.01 | 1.05 | 1.01 | 0.061 | 3.71 | 15,3 | 6.1 | 11.0 | 0.66 | 1.05 | 0.356 | 0.370 | 0.962 | 0.667 | 1450,6 | 160 by 96 |
| 4434 + 1/2 | 22.2 | 1.01 | 1.07 | 0.95 | 1.05 | 0.95 | 0.061 | 4.03 | 15,3 | 6.1 | 12.1 | 0.63 | 1.02 | 0.341 | 0.344 | 0.992 | 0.641 | 1418,6 | 180 by 108 |
| 4435 | 22.1 | 0.97 | 1.07 | 0.91 | 1.01 | 0.91 | 0.071 | 3.03 | 15,2 | 5.7 | 10.3 | 0.60 | 1.00 | 0.332 | 0.333 | 0.998 | 0.615 | 1142,674 | 56 by 60 |
| 4435 + 1/2 | 21.9 | 0.98 | 1.07 | 0.92 | 1.00 | 0.92 | 0.069 | 4.41 | 15,4 | 5.6 | 10.2 | 0.58 | 1.00 | 0.325 | 0.326 | 0.995 | 0.590 | 1322,6 | 216 by 132 |
| 4436 | 21.2 | 0.99 | 1.07 | 0.93 | 0.96 | 0.93 | 0.091 | 3.37 | 15,5 | 5.5 | 8.8 | 0.55 | 1.00 | 0.320 | 0.321 | 0.997 | 0.565 | 1358,58 | 208 by 124 |
| 4436 + 1/2 | 20.9 | 1.02 | 1.07 | 0.95 | 0.97 | 0.95 | 0.099 | 4.23 | 15,4 | 5.4 | 8.5 | 0.53 | 1.00 | 0.318 | 0.318 | 1.000 | 0.541 | 1330,66 | 192 by 104 |
| 4437 | 20.8 | 1.04 | 1.07 | 0.97 | 1.00 | 0.97 | 0.107 | 4.66 | 15,5 | 5.2 | 7.0 | 0.50 | 1.01 | 0.315 | 0.319 | 0.988 | 0.516 | 1362,102 | 288 by 136 |
| 4437 + 1/2 | 20.4 | 1.06 | 1.07 | 0.99 | 1.06 | 0.99 | 0.097 | 4.22 | 15,5 | 5.1 | 6.6 | 0.48 | 1.00 | 0.316 | 0.320 | 0.987 | 0.492 | 1074,14 | 96 by 32 |
| 4438 | 19.7 | 1.07 | 1.06 | 1.01 | 0.99 | 0.99 | 0.121 | 3.35 | 15,4 | 4.9 | 7.0 | 0.45 | 0.97 | 0.322 | 0.322 | 0.999 | 0.469 | 1002,278 | 56 by 52 |
| 4438 + 1/2 | 19.3 | 1.09 | 1.05 | 1.04 | 1.01 | 1.01 | 0.123 | 4.21 | 15,7 | 4.4 | 6.5 | 0.43 | 0.95 | 0.329 | 0.332 | 0.991 | 0.446 | 1510,334 | 52 by 64 |
| 4439 | 19.2 | 1.10 | 1.04 | 1.06 | 0.95 | 0.95 | 0.136 | 5.34 | 15,7 | 4.3 | 6.3 | 0.41 | 0.90 | 0.342 | 0.338 | 1.010 | 0.424 | 1434,714 | 60 by 112 |
| 4439 + 1/2 | 18.4 | 1.11 | 1.03 | 1.08 | 0.92 | 0.92 | 0.158 | 5.54 | 15,7 | 4.1 | 6.1 | 0.39 | 0.89 | 0.348 | 0.353 | 0.986 | 0.404 | 1414,714 | 56 by 64 |
| 4440 | 18.4 | 1.12 | 1.02 | 1.10 | 1.00 | 1.00 | 0.144 | 4.69 | 15,5 | 4.0 | 6.8 | 0.37 | 0.93 | 0.364 | 0.363 | 1.005 | 0.383 | 1374,722 | 68 by 112 |
| 4440 + 1/2 | 17.5 | 1.09 | 1.00 | 1.09 | 1.08 | 1.08 | 0.106 | 4.46 | 15,5 | 4.0 | 7.0 | 0.35 | 0.99 | 0.377 | 0.378 | 0.998 | 0.364 | 1338,626 | 80 by 128 |
| 4441 | 16.9 | 1.10 | 0.99 | 1.11 | 1.11 | 1.11 | 0.105 | 3.87 | 15,5 | 3.8 | 6.2 | 0.33 | 1.00 | 0.402 | 0.378 | 1.063 | 0.344 | 1158,530 | 212 by 240 |
| 4441 + 1/2 | 16.6 | 1.08 | 0.99 | 1.10 | 1.13 | 1.10 | 0.092 | 3.22 | 14,6 | 3.7 | 6.0 | 0.32 | 1.00 | 0.391 | 0.378 | 1.035 | 0.326 | 946,742 | 64 by 64 |
| 4442 | 16.0 | 1.04 | 0.98 | 1.06 | 0.99 | 0.99 | 0.128 | 2.86 | 14,6 | 3.5 | 6.2 | 0.30 | 0.94 | 0.379 | 0.366 | 1.035 | 0.309 | 1186,742 | 76 by 80 |
| 4442 + 1/2 | 15.6 | 0.99 | 0.97 | 1.02 | 0.98 | 0.98 | 0.106 | 2.35 | 11,7 | 3.2 | 5.8 | 0.29 | 0.94 | 0.341 | 0.354 | 0.964 | 0.293 | 1370,366 | 60 by 60 |
| 4443 | 15.0 | 0.98 | 0.96 | 1.02 | 0.99 | 0.99 | 0.095 | 3.42 | 6,8 | 3.3 | 6.2 | 0.27 | 0.97 | 0.329 | 0.328 | 1.002 | 0.278 | 1274,342 | 52 by 56 |
| 4443 + 1/2 | 14.5 | 0.95 | 0.95 | 1.00 | 0.98 | 0.98 | 0.092 | 3.48 | 15,1 | 3.0 | 5.3 | 0.26 | 0.97 | 0.315 | 0.318 | 0.990 | 0.264 | 1262,350 | 88 by 72 |
| 4444 | 14.2 | 0.92 | 0.92 | 1.00 | 1.07 | 1.00 | 0.066 | 3.07 | 15,1 | 3.0 | 6.2 | 0.25 | 1.01 | 0.308 | 0.305 | 1.011 | 0.251 | 1266,354 | 56 by 56 |
| 4444 + 1/2 | 13.5 | 0.89 | 0.89 | 0.99 | 0.91 | 0.91 | 0.084 | 2.70 | 5,7 | 2.6 | 4.9 | 0.23 | 0.95 | 0.294 | 0.298 | 0.985 | 0.239 | 1130,582 | 68 by 60 |
| 4445 | 13.1 | 0.87 | 0.87 | 1.00 | 1.02 | 1.00 | 0.057 | 2.85 | 7,8 | 2.6 | 4.6 | 0.22 | 0.99 | 0.289 | 0.289 | 0.999 | 0.228 | 1122,602 | 132 by 144 |
| 4445 + 1/2 | 12.5 | 0.85 | 0.85 | 1.00 | 0.98 | 0.98 | 0.062 | 2.56 | 7,8 | 2.6 | 4.4 | 0.21 | 0.99 | 0.284 | 0.285 | 0.996 | 0.217 | 1234,382 | 84 by 76 |
| 4446 | 12.0 | 0.83 | 0.82 | 1.00 | 1.08 | 1.00 | 0.039 | 2.33 | 5,7 | 2.3 | 3.9 | 0.20 | 0.99 | 0.282 | 0.282 | 1.002 | 0.208 | 862,578 | 132 by 96 |
| 4446 + 1/2 | 11.5 | 0.80 | 0.80 | 1.00 | 0.99 | 0.99 | 0.056 | 2.21 | 14,1 | 2.2 | 3.7 | 0.19 | 1.01 | 0.279 | 0.281 | 0.994 | 0.198 | 1298,394 | 44 by 60 |
| 4447 | 10.7 | 0.78 | 0.78 | 1.00 | 0.99 | 0.99 | 0.055 | 2.80 | 14,1 | 1.9 | 3.3 | 0.18 | 1.01 | 0.278 | 0.280 | 0.991 | 0.190 | 1282,398 | 60 by 68 |
| 4447 + 1/2 | 10.2 | 0.75 | 0.75 | 1.01 | 1.08 | 1.01 | 0.034 | 1.81 | 14,1 | 1.7 | 3.0 | 0.18 | 1.01 | 0.279 | 0.278 | 1.003 | 0.182 | 1202,378 | 96 by 76 |
| 4448 | 9.4 | 0.72 | 0.72 | 1.00 | 0.97 | 0.97 | 0.055 | 2.38 | 13,1 | 1.7 | 2.8 | 0.17 | 0.99 | 0.281 | 0.278 | 1.010 | 0.174 | 1254,386 | 76 by 92 |
| 4448 + 1/2 | 8.7 | 0.69 | 0.69 | 1.00 | 1.04 | 1.00 | 0.029 | 2.47 | 13,1 | 1.5 | 2.6 | 0.16 | 0.97 | 0.273 | 0.280 | 0.974 | 0.167 | 1118,342 | 96 by 84 |
| 4449 | 8.0 | 0.66 | 0.67 | 0.99 | 1.00 | 0.99 | 0.025 | 2.47 | 13,1 | 1.4 | 2.3 | 0.16 | 0.97 | 0.282 | 0.274 | 1.030 | 0.161 | 1202,406 | 60 by 64 |
| 4449 + 1/2 | 7.4 | 0.65 | 0.64 | 1.00 | 1.00 | 1.00 | 0.024 | 2.34 | 13,1 | 1.3 | 2.2 | 0.15 | 1.00 | 0.274 | 0.273 | 1.004 | 0.155 | 1254,414 | 52 by 64 |
| 4450 | 6.5 | 0.63 | 0.63 | 1.00 | 0.99 | 0.99 | 0.020 | 2.00 | 13,1 | 1.3 | 1.9 | 0.15 | 1.01 | 0.273 | 0.272 | 1.003 | 0.150 | 1234,394 | 116 by 96 |
| 4450 + 1/2 | 5.8 | 0.61 | 0.61 | 1.00 | 0.98 | 0.98 | 0.022 | 2.03 | 5,6 | 1.3 | 1.7 | 0.14 | 1.04 | 0.268 | 0.272 | 0.984 | 0.144 | 922,686 | 196 by 136 |
| 4451 | 5.1 | 0.60 | 0.60 | 1.00 | 1.02 | 1.00 | 0.006 | 1.82 | 5,6 | 1.2 | 1.7 | 0.14 | 1.01 | 0.271 | 0.270 | 1.004 | 0.139 | 1138,390 | 156 by 116 |
| 4451 + 1/2 | 4.2 | 0.58 | 0.58 | 1.01 | 1.03 | 1.01 | 0.003 | 1.74 | 13,2 | 1.2 | 1.8 | 0.13 | 0.94 | 0.271 | 0.267 | 1.015 | 0.135 | 1114,370 | 104 by 72 |
| 4452 | 3.4 | 0.56 | 0.57 | 0.99 | 1.00 | 0.99 | 0.006 | 1.65 | 13,2 | 1.2 | 1.8 | 0.13 | 0.99 | 0.266 | 0.269 | 0.988 | 0.130 | 1122,486 | 216 by 120 |
| 4452 + 1/2 | 2.5 | 0.55 | 0.56 | 0.98 | 1.00 | 0.98 | 0.007 | 1.56 | 5,5 | 1.2 | 1.7 | 0.12 | 1.07 | 0.267 | 0.266 | 1.003 | 0.126 | 1018,470 | 88 by 80 |
| 4453 | 1.9 | 0.53 | 0.56 | 0.95 | 1.00 | 0.95 | 0.007 | 1.59 | 13,2 | 1.4 | 1.9 | 0.12 | 1.06 | 0.266 | 0.265 | 1.003 | 0.123 | 1062,566 | 108 by 200 |
| 4453 + 1/2 | 1.5 | 0.52 | 0.56 | 0.93 | 1.01 | 0.93 | 0.005 | 1.59 | 13,2 | 1.8 | 2.2 | 0.12 | 0.98 | 0.265 | 0.265 | 0.998 | 0.119 | 1126,362 | 68 by 60 |
| 4454 | 1.2 | 0.50 | 0.56 | 0.89 | 0.99 | 0.89 | 0.006 | 1.61 | 13,2 | 2.3 | 2.6 | 0.11 | 0.93 | 0.265 | 0.263 | 1.008 | 0.116 | 1134,422 | 128 by 112 |
| 4454 + 1/2 | 1.0 | 0.49 | 0.56 | 0.87 | 0.97 | 0.87 | 0.003 | 1.53 | 13,2 | 3.0 | 3.4 | 0.11 | 0.86 | 0.259 | 0.262 | 0.986 | 0.114 | 1234,454 | 52 by 48 |
| 4455 | 0.9 | 0.47 | 0.56 | 0.83 | 0.94 | 0.83 | 0.002 | 1.35 | 5,4 | 3.7 | 4.1 | 0.11 | 0.81 | 0.260 | 0.260 | 1.000 | 0.111 | 1206,462 | 92 by 76 |
| 4455 + 1/2 | 0.8 | 0.45 | 0.56 | 0.81 | 0.91 | 0.81 | 0.001 | 1.46 | 7,2 | 4.4 | 5.0 | 0.10 | 0.82 | 0.258 | 0.260 | 0.993 | 0.109 | 1098,418 | 124 by 104 |
| 4456 | 0.8 | 0.44 | 0.56 | 0.79 | 0.89 | 0.79 | 0.000 | 1.54 | 7,2 | 5.2 | 5.8 | 0.10 | 0.81 | 0.262 | 0.258 | 1.013 | 0.107 | 786,602 | 112 by 216 |
| 4456 + 1/2 | 0.7 | 0.42 | 0.55 | 0.77 | 0.86 | 0.77 | 0.002 | 1.50 | 7,2 |  |  | 0.10 | 0.79 | 0.258 | 0.259 | 0.998 | 0.105 | 1018,410 | 136 by 92 |
| 4457 | 0.7 | 0.42 | 0.54 | 0.77 | 0.87 | 0.77 | 0.000 | 1.53 | 7,2 |  |  | 0.09 | 0.80 | 0.253 | 0.261 | 0.972 | 0.104 | 1066,362 | 112 by 76 |
| 4457 + 1/2 | 0.8 | 0.41 | 0.53 | 0.78 | 0.89 | 0.78 | 0.000 | 1.64 | 12,2 |  |  | 0.08 | 0.82 | 0.260 | 0.262 | 0.992 | 0.102 | 1206,458 | 52 by 60 |
| 4458 | 1.0 | 0.42 | 0.53 | 0.81 | 0.90 | 0.81 | 0.004 | 1.94 | 6,4 |  |  | 0.06 | 0.86 | 0.278 | 0.257 | 1.081 | 0.100 | 1198,450 | 80 by 76 |
| 4458 + 1/2 | 1.6 | 0.45 | 0.52 | 0.87 | 0.96 | 0.87 | 0.005 | 2.52 | 12,2 |  |  | 0.05 | 0.90 | 0.266 | 0.269 | 0.988 | 0.099 | 1126,418 | 120 by 92 |
| 4459 | 2.4 | 0.48 | 0.52 | 0.92 | 1.03 | 0.92 | 0.003 | 2.92 | 11,5 |  |  |  | 0.92 | 0.253 | 0.278 | 0.912 | 0.098 | 1186,598 | 124 by 264 |
| 4459 + 1/2 | 3.3 | 0.51 | 0.52 | 0.99 | 1.01 | 0.99 | 0.022 | 3.19 | 11,5 |  |  |  | 1.00 | 0.280 | 0.272 | 1.032 | 0.096 | 1206,462 | 116 by 76 |
| 4460 | 4.9 | 0.53 | 0.51 | 1.04 | 0.91 | 0.91 | 0.047 | 4.55 | 10,7 |  |  |  | 0.88 | 0.278 | 0.284 | 0.977 | 0.094 | 1286,682 | 132 by 108 |
| 4460 + 1/2 | 6.3 | 0.56 | 0.49 | 1.13 | 0.94 | 0.94 | 0.055 | 5.71 | 10,7 |  |  |  | 0.92 | 0.288 | 0.287 | 1.003 | 0.093 | 1178,478 | 92 by 60 |
| 4461 | 8.1 | 0.57 | 0.48 | 1.18 | 0.95 | 0.95 | 0.063 | 7.58 | 7,3 |  |  |  | 0.89 | 0.294 | 0.297 | 0.988 | 0.091 | 1038,778 | 144 by 260 |
| 4461 + 1/2 | 9.8 | 0.58 | 0.48 | 1.23 | 1.04 | 1.04 | 0.056 | 7.93 | 7,3 |  |  |  | 0.98 | 0.307 | 0.310 | 0.990 | 0.089 | 1330,790 | 92 by 136 |
| 4462 | 11.5 | 0.59 | 0.47 | 1.25 | 1.05 | 1.05 | 0.068 | 10.71 | 8,3 |  |  |  | 0.95 | 0.326 | 0.319 | 1.022 | 0.088 | 1390,770 | 104 by 148 |
| 4462 + 1/2 | 16.5 | 0.66 | 0.46 | 1.44 | 1.17 | 1.17 | 0.105 | 12.14 | 8,3 |  |  |  | 1.01 | 0.331 | 0.333 | 0.993 | 0.086 | 1370,874 | 120 by 168 |
| 4463 | 18.7 | 0.67 | 0.45 | 1.48 | 1.33 | 1.33 | 0.057 | 15.01 | 12,8 |  |  |  | 1.11 | 0.347 | 0.335 | 1.035 | 0.084 | 1418,898 | 120 by 172 |
| 4463 + 1/2 | 18.9 | 0.61 | 0.45 | 1.36 | 1.25 | 1.25 | 0.045 | 11.69 | 12,8 |  |  |  | 1.05 | 0.340 | 0.359 | 0.948 | 0.082 | 1518,850 | 96 by 156 |
| 4464 | 17.9 | 0.56 | 0.45 | 1.25 | 1.19 | 1.19 | 0.033 | 10.47 | 10,4 |  |  |  | 0.95 | 0.370 | 0.364 | 1.016 | 0.079 | 1366,594 | 88 by 28 |
| 4464 + 1/2 | 16.8 | 0.53 | 0.44 | 1.21 | 1.12 | 1.12 | 0.034 | 9.50 | 9,7 |  |  |  | 0.94 | 0.397 | 0.376 | 1.056 | 0.072 | 1418,634 | 92 by 32 |
| 4465 | 15.2 | 0.52 | 0.44 | 1.18 | 1.10 | 1.10 | 0.035 | 13.36 | 9,7 |  |  |  | 0.86 | 0.382 | 0.383 | 0.997 | 0.063 | 1486,682 | 108 by 32 |
| 4465 + 1/2 | 13.5 | 0.52 | 0.44 | 1.18 | 1.11 | 1.11 | 0.031 | 19.23 | 10,7 |  |  |  | 0.86 | 0.381 | 0.391 | 0.974 | 0.054 | 1554,730 | 120 by 36 |
| 4466 | 11.0 | 0.47 | 0.44 | 1.08 | 1.02 | 1.02 | 0.026 | 16.98 | 10,7 |  |  |  | 0.83 | 0.385 | 0.382 | 1.009 | 0.043 | 1618,774 | 168 by 40 |
| 4466 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

## place

### dive (uranus.dive, T at 4186, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

### rise (uranus.rise, T at 4391, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 2x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 14.61, uhd 38.69.

Largest mean difference: 1.550 at frame 4493 (uranus.travel), limit 12.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 0.229 at frame 4493 (uranus.travel), limit 3.2.
Largest level difference of one block (a grid of 16 by 9): -0.263 at frame 4418 (uranus.rise), limit 12.
Largest level difference of the whole frame: -0.103 at frame 4290 (uranus.terrain), limit 2.2.
Picture: r/out/work/smooth/uranus-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 4035 | uranus.hold | 1.233 | 5.9 | 128 | -0.097 | -0.100 | 0.194 | 6.74 | -0.214 | 5,5 | 1.293 |
| 4133 | uranus.dive | 1.125 | 3.7 | 160 | -0.047 | -0.050 | 0.158 | 6.83 | -0.197 | 9,3 | 1.493 |
| 4155 | uranus.dive | 1.120 | 3.5 | 41 | -0.048 | -0.056 | 0.150 | 1.85 | -0.211 | 9,1 | 1.549 |
| 4178 | uranus.dive | 1.197 | 4.8 | 51 | -0.037 | -0.047 | 0.165 | 2.85 | -0.244 | 10,4 | 1.398 |
| 4290 | uranus.terrain | 1.232 | 5.5 | 50 | -0.103 | -0.104 | 0.194 | 1.90 | -0.253 | 5,5 | 1.311 |
| 4399 | uranus.rise | 1.162 | 4.0 | 32 | -0.029 | -0.040 | 0.159 | 3.36 | -0.187 | 13,0 | 1.404 |
| 4418 | uranus.rise | 1.161 | 3.7 | 68 | -0.072 | -0.078 | 0.172 | 3.64 | -0.263 | 14,6 | 1.421 |
| 4436 | uranus.rise | 1.296 | 6.7 | 102 | -0.047 | -0.050 | 0.166 | 7.04 | -0.230 | 8,5 | 1.432 |
| 4493 | uranus.travel | 1.550 | 10.3 | 141 | 0.006 | 0.010 | 0.229 | 7.07 | 0.145 | 3,2 | 1.386 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.

## counts

Film frames 3960 to 4529 in order on one fresh page, 1140 pictures at rate 2, tier draft at preview, 3254 s. Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): 10 warm draws. Its work counts for that picture and stands in brackets. Judged: dive, rise and travel, every picture.

| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |
|---|---|---|---|---|---|---|---|
| uranus.hold | no | 300 | 1 | 3960 | 28 | 134 | 132 |
| uranus.dive | yes | 180 | 0 |  | 0 | 0 | 0 |
| uranus.terrain | no | 360 | 0 |  | 0 | 0 | 0 |
| uranus.rise | yes | 150 | 0 |  | 0 | 0 | 0 |
| uranus.travel | yes | 150 | 0 |  | 0 | 0 | 0 |

Every picture with work (of the warm start call in brackets):

| frame | segment | programs | texture uploads | buffers | warm draws |
|---|---|---|---|---|---|
| 3960 | uranus.hold | 28 (28) | 134 (134) | 132 (132) | 10 |
