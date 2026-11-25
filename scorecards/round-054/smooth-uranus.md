# smooth: uranus

Commit 9d59e6999a2ac769f1c2fd941b03a2ea9a0f700a. Capture rate 2. Parts: path, pictures, place, parity, counts.

Joined from the files of 1 machine(s), nothing is rendered, measured or counted here. The path: /home/user/workspace/work/p6/sm54/05/uranus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The pictures: the dive /home/user/workspace/work/p6/sm54/01/uranus-dive-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm54/02/uranus-dive-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz); the rise /home/user/workspace/work/p6/sm54/03/uranus-rise-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm54/04/uranus-rise-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The place: /home/user/workspace/work/p6/sm54/05/uranus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The parity: /home/user/workspace/work/p6/sm54/05/uranus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The counts: /home/user/workspace/work/p6/sm54/06/uranus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

VERDICT: red. 3 numbers over the limit or not measured.

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
| whole frames | rate | 0.07988 log of the height a film frame | 1.363 | 4407 | 0.064 | 4385 |  |  | 0.009 | 0.049 | 0.000 | 0.000 | 0.124 at 4465 |
| whole frames | turn | 1.717 degrees a film frame | 1.768 | 4417 | 0.074 | 4402 |  |  | 0.003 | 0.021 | 0.000 | 0.000 | 0.002 at 4466 |
| whole frames | speed | 5.603 px a film frame at the place | 1.657 | 4433 | 0.070 over 5 | 4384 |  |  |  | 0.067 | 0.019 over 8 | 0.000 | 5.555 at 4462 |
| rate 2 | rate | 0.07947 log of the height a film frame | 1.370 | 4406 + 1/2 | 0.064 | 4385 | 0.032 | 4385 | 0.011 | 0.050 | 0.000 | 0.000 | 0.126 at 4465 |
| rate 2 | turn | 1.706 degrees a film frame | 1.780 | 4417 + 1/2 | 0.075 | 4402 | 0.037 | 4401 + 1/2 | 0.003 | 0.018 | 0.000 | 0.000 | 0.005 at 4466 + 1/2 |
| rate 2 | speed | 5.556 px a film frame at the place | 1.635 | 4432 + 1/2 | 0.073 over 5 | 4384 | 0.037 over 5 | 4383 + 1/2 |  | 0.067 | 0.027 over 8 | 0.000 | 5.625 at 4462 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 5, rate 2 4.

Rows of the speed shown and not judged: whole frames 3 (frames 4379 to 4381), rate 2 7 (frames 4378 + 1/2 to 4381 + 1/2).

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 4380, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.0179 of its height a film frame, the mean of its last 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 0.98 at frame 4382, limit 0.87; inside the rise itself 0.98 at frame 4382. Largest step from one capture frame to the next 0.21 at frame 4395 + 1/2, shown. The part along the surface view's own direction of motion: 0.96 at the lowest, lowest -1.85 at frame 4395 + 1/2, shown; under 0 the eye goes back.

Rest between the rise and the travel (the seam into uranus.travel at film frame 4455, 12 film frames to each side, read at rate 2): a rise and the travel after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body's edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest 5.68 at frame 4457, against 27.10 at frame 4443 and 179.35 at frame 4466 + 1/2 at the ends of the window. The lowest is 0.210 of the slower end, limit 0.07. Near 0 the picture comes to rest between the rise and the travel.

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
| 4381 | rise terrain | 1.545e-2 | 0.014 | 0.009 | 0.024 | 0.024 | 0.003 | 0.008 | 0.182 |  |  | 4 |
| 4382 | rise terrain | 1.551e-2 | 0.048 | 0.034 | 0.050 | 0.036 | 0.012 | 0.018 | 0.209 | 0.027 | 0.042 | 5 |
| 4383 | rise terrain | 1.564e-2 | 0.105 | 0.057 | 0.064 | 0.058 | 0.022 | 0.027 | 0.260 | 0.051 | 0.069 | 5 |
| 4384 | rise terrain | 1.586e-2 | 0.169 | 0.064 | 0.064 | 0.085 | 0.028 | 0.029 | 0.331 | 0.070 | 0.073 | 5 |
| 4385 | rise terrain | 1.615e-2 | 0.232 | 0.064 | 0.064 | 0.116 | 0.031 | 0.034 | 0.399 | 0.068 | 0.069 | 5 |
| 4386 | rise terrain | 1.654e-2 | 0.296 | 0.064 | 0.064 | 0.153 | 0.037 | 0.042 | 0.461 | 0.062 | 0.063 | 5 |
| 4387 | rise terrain | 1.702e-2 | 0.360 | 0.064 | 0.064 | 0.197 | 0.045 | 0.048 | 0.516 | 0.055 | 0.056 | 5 |
| 4388 | rise terrain | 1.761e-2 | 0.423 | 0.064 | 0.064 | 0.246 | 0.049 | 0.050 | 0.562 | 0.046 | 0.047 | 5 |
| 4389 | rise terrain | 1.831e-2 | 0.487 | 0.064 | 0.064 | 0.297 | 0.051 | 0.052 | 0.600 | 0.038 | 0.038 | 5 |
| 4390 | rise terrain | 1.913e-2 | 0.551 | 0.064 | 0.064 | 0.349 | 0.052 | 0.053 | 0.629 | 0.029 | 0.029 | 5 |
| 4391 T | rise terrain | 2.009e-2 | 0.614 | 0.064 | 0.064 | 0.403 | 0.054 | 0.055 | 0.651 | 0.022 | 0.022 | 5 |
| 4392 | rise orbit | 2.121e-2 | 0.678 | 0.064 | 0.064 | 0.457 | 0.055 | 0.056 | 0.667 | 0.015 | 0.015 | 5 |
| 4393 | rise orbit | 2.251e-2 | 0.742 | 0.064 | 0.064 | 0.514 | 0.056 | 0.058 | 0.664 | 0.010 | 0.009 | 5 |
| 4394 | rise orbit | 2.400e-2 | 0.805 | 0.064 | 0.064 | 0.572 | 0.058 | 0.059 | 0.662 | 0.002 | 0.004 | 6 |
| 4395 | rise orbit | 2.573e-2 | 0.869 | 0.064 | 0.064 | 0.631 | 0.059 | 0.060 | 0.661 | 0.001 | 0.002 | 6 |
| 4396 | rise orbit | 2.771e-2 | 0.932 | 0.064 | 0.064 | 0.690 | 0.060 | 0.061 | 0.764 | 0.006 | 0.010 | 6 |
| 4397 | rise orbit | 3.001e-2 | 0.996 | 0.064 | 0.064 | 0.752 | 0.062 | 0.064 | 0.754 | 0.011 | 0.015 | 7 |
| 4398 | rise orbit | 3.266e-2 | 1.060 | 0.064 | 0.064 | 0.817 | 0.065 | 0.067 | 0.833 | 0.001 | 0.003 | 7 |
| 4399 | rise orbit | 3.573e-2 | 1.123 | 0.064 | 0.064 | 0.884 | 0.067 | 0.069 | 0.819 | 0.014 | 0.017 | 8 |
| 4400 | rise orbit | 3.928e-2 | 1.187 | 0.064 | 0.064 | 0.954 | 0.070 | 0.072 | 0.814 | 0.005 | 0.007 | 8 |
| 4401 | rise orbit | 4.341e-2 | 1.251 | 0.064 | 0.064 | 1.026 | 0.072 | 0.074 | 0.814 | 0.001 | 0.003 | 8 |
| 4402 | rise orbit | 4.820e-2 | 1.311 | 0.060 | 0.060 | 1.100 | 0.074 | 0.075 | 0.816 | 0.002 | 0.002 | 8 |
| 4403 | rise orbit | 5.368e-2 | 1.350 | 0.039 | 0.036 | 1.172 | 0.072 | 0.072 | 0.822 | 0.006 | 0.008 | 8 |
| 4404 | rise orbit | 5.985e-2 | 1.362 | 0.013 | 0.009 | 1.241 | 0.068 | 0.068 | 0.834 | 0.012 | 0.016 | 8 |
| 4405 | rise orbit | 6.674e-2 | 1.363 | 0.000 | 0.000 | 1.307 | 0.067 | 0.067 | 0.854 | 0.020 | 0.022 | 8 |
| 4406 | rise orbit | 7.441e-2 | 1.363 | 0.000 | 0.000 | 1.374 | 0.067 | 0.068 | 0.879 | 0.025 | 0.027 | 8 |
| 4407 | rise orbit | 8.297e-2 | 1.363 | 0.000 | 0.000 | 1.440 | 0.066 | 0.066 | 0.907 | 0.028 | 0.028 | 8 |
| 4408 | rise orbit | 9.251e-2 | 1.363 | 0.000 | 0.000 | 1.500 | 0.060 | 0.059 | 0.934 | 0.027 | 0.026 | 8 |
| 4409 | rise orbit | 1.032e-1 | 1.363 | 0.000 | 0.000 | 1.553 | 0.052 | 0.052 | 0.943 | 0.009 | 0.010 | 8 |
| 4410 | rise orbit | 1.150e-1 | 1.363 | 0.000 | 0.000 | 1.599 | 0.046 | 0.046 | 0.930 | 0.013 | 0.015 | 8 |
| 4411 | rise orbit | 1.282e-1 | 1.363 | 0.000 | 0.000 | 1.642 | 0.044 | 0.044 | 0.933 | 0.003 | 0.018 | 8 |
| 4412 | rise orbit | 1.430e-1 | 1.363 | 0.000 | 0.000 | 1.684 | 0.041 | 0.042 | 0.958 | 0.025 | 0.035 | 8 |
| 4413 | rise orbit | 1.594e-1 | 1.363 | 0.000 | 0.000 | 1.721 | 0.037 | 0.036 | 1.003 | 0.045 | 0.048 | 8 |
| 4414 | rise orbit | 1.778e-1 | 1.363 | 0.000 | 0.000 | 1.747 | 0.026 | 0.025 | 1.051 | 0.048 | 0.048 | 8 |
| 4415 | rise orbit | 1.982e-1 | 1.363 | 0.000 | 0.000 | 1.762 | 0.015 | 0.013 | 1.098 | 0.047 | 0.046 | 8 |
| 4416 | rise orbit | 2.210e-1 | 1.363 | 0.000 | 0.000 | 1.767 | 0.005 | 0.004 | 1.144 | 0.046 | 0.045 | 8 |
| 4417 | rise orbit | 2.464e-1 | 1.363 | 0.000 | 0.000 | 1.768 | 0.002 | 0.001 | 1.190 | 0.046 | 0.045 | 8 |
| 4418 | rise orbit | 2.747e-1 | 1.363 | 0.000 | 0.000 | 1.768 | 0.000 | 0.001 | 1.236 | 0.046 | 0.045 | 8 |
| 4419 | rise orbit | 3.063e-1 | 1.363 | 0.000 | 0.000 | 1.766 | 0.002 | 0.003 | 1.282 | 0.046 | 0.045 | 8 |
| 4420 | rise orbit | 3.416e-1 | 1.363 | 0.000 | 0.000 | 1.762 | 0.004 | 0.008 | 1.327 | 0.045 | 0.043 | 8 |
| 4421 | rise orbit | 3.808e-1 | 1.362 | 0.000 | 0.000 | 1.751 | 0.011 | 0.015 | 1.365 | 0.038 | 0.035 | 8 |
| 4422 | rise orbit | 4.246e-1 | 1.362 | 0.000 | 0.000 | 1.733 | 0.018 | 0.022 | 1.395 | 0.030 | 0.027 | 8 |
| 4423 | rise orbit | 4.734e-1 | 1.362 | 0.000 | 0.000 | 1.708 | 0.025 | 0.029 | 1.421 | 0.026 | 0.024 | 8 |
| 4424 | rise orbit | 5.279e-1 | 1.362 | 0.000 | 0.000 | 1.679 | 0.029 | 0.030 | 1.448 | 0.026 | 0.025 | 8 |
| 4425 | rise orbit | 5.885e-1 | 1.362 | 0.000 | 0.000 | 1.650 | 0.030 | 0.030 | 1.475 | 0.027 | 0.026 | 8 |
| 4426 | rise orbit | 6.562e-1 | 1.362 | 0.000 | 0.000 | 1.620 | 0.030 | 0.030 | 1.502 | 0.028 | 0.026 | 8 |
| 4427 | rise orbit | 7.316e-1 | 1.362 | 0.000 | 0.000 | 1.590 | 0.030 | 0.030 | 1.530 | 0.028 | 0.026 | 8 |
| 4428 | rise orbit | 8.157e-1 | 1.362 | 0.000 | 0.000 | 1.561 | 0.029 | 0.030 | 1.557 | 0.027 | 0.025 | 8 |
| 4429 | rise orbit | 9.094e-1 | 1.362 | 0.000 | 0.000 | 1.532 | 0.029 | 0.029 | 1.583 | 0.026 | 0.024 | 8 |
| 4430 | rise orbit | 1.014e+0 | 1.362 | 0.000 | 0.000 | 1.503 | 0.029 | 0.029 | 1.608 | 0.025 | 0.023 | 8 |
| 4431 | rise orbit | 1.131e+0 | 1.362 | 0.000 | 0.000 | 1.475 | 0.028 | 0.028 | 1.631 | 0.023 | 0.022 | 8 |
| 4432 | rise orbit | 1.260e+0 | 1.361 | 0.001 | 0.005 | 1.447 | 0.028 | 0.028 | 1.651 | 0.021 | 0.019 | 8 |
| 4433 | rise orbit | 1.404e+0 | 1.350 | 0.011 | 0.021 | 1.420 | 0.027 | 0.031 | 1.657 | 0.005 | 0.008 | 8 |
| 4434 | rise orbit | 1.560e+0 | 1.323 | 0.027 | 0.037 | 1.382 | 0.038 | 0.051 | 1.641 | 0.016 | 0.027 | 8 |
| 4435 | rise orbit | 1.728e+0 | 1.281 | 0.043 | 0.049 | 1.323 | 0.059 | 0.071 | 1.605 | 0.035 | 0.043 | 8 |
| 4436 | rise orbit | 1.907e+0 | 1.231 | 0.049 | 0.050 | 1.250 | 0.073 | 0.074 | 1.559 | 0.046 | 0.047 | 8 |
| 4437 | rise orbit | 2.096e+0 | 1.182 | 0.050 | 0.050 | 1.177 | 0.073 | 0.074 | 1.510 | 0.050 | 0.050 | 8 |
| 4438 | rise orbit | 2.294e+0 | 1.132 | 0.050 | 0.050 | 1.104 | 0.072 | 0.073 | 1.457 | 0.053 | 0.053 | 8 |
| 4439 | rise orbit | 2.502e+0 | 1.083 | 0.050 | 0.050 | 1.032 | 0.072 | 0.073 | 1.402 | 0.055 | 0.055 | 8 |
| 4440 | rise orbit | 2.717e+0 | 1.033 | 0.050 | 0.050 | 0.960 | 0.072 | 0.073 | 1.344 | 0.057 | 0.057 | 8 |
| 4441 | rise orbit | 2.939e+0 | 0.984 | 0.050 | 0.050 | 0.888 | 0.072 | 0.073 | 1.285 | 0.059 | 0.059 | 8 |
| 4442 | rise orbit | 3.167e+0 | 0.934 | 0.050 | 0.050 | 0.816 | 0.072 | 0.072 | 1.224 | 0.061 | 0.060 | 8 |
| 4443 | rise orbit | 3.399e+0 | 0.885 | 0.050 | 0.050 | 0.746 | 0.071 | 0.071 | 1.162 | 0.062 | 0.061 | 8 |
| 4444 | rise orbit | 3.633e+0 | 0.835 | 0.050 | 0.050 | 0.676 | 0.070 | 0.071 | 1.100 | 0.063 | 0.062 | 8 |
| 4445 | rise orbit | 3.869e+0 | 0.786 | 0.049 | 0.050 | 0.606 | 0.070 | 0.070 | 1.036 | 0.063 | 0.062 | 8 |
| 4446 | rise orbit | 4.103e+0 | 0.736 | 0.049 | 0.050 | 0.537 | 0.069 | 0.069 | 0.973 | 0.064 | 0.063 | 8 |
| 4447 | rise orbit | 4.335e+0 | 0.687 | 0.049 | 0.050 | 0.468 | 0.069 | 0.069 | 0.909 | 0.064 | 0.063 | 8 |
| 4448 | rise orbit | 4.561e+0 | 0.637 | 0.049 | 0.050 | 0.400 | 0.068 | 0.068 | 0.845 | 0.064 | 0.063 | 8 |
| 4449 | rise orbit | 4.780e+0 | 0.588 | 0.049 | 0.050 | 0.333 | 0.068 | 0.068 | 0.781 | 0.064 | 0.063 | 8 |
| 4450 | rise orbit | 4.990e+0 | 0.538 | 0.049 | 0.050 | 0.266 | 0.067 | 0.067 | 0.717 | 0.064 | 0.063 | 8 |
| 4451 | rise orbit | 5.189e+0 | 0.489 | 0.049 | 0.050 | 0.199 | 0.067 | 0.067 | 0.653 | 0.064 | 0.063 | 8 |
| 4452 | rise orbit | 5.375e+0 | 0.440 | 0.049 | 0.050 | 0.134 | 0.065 | 0.066 | 0.590 | 0.063 | 0.063 | 8 |
| 4453 | rise orbit | 5.545e+0 | 0.390 | 0.049 | 0.050 | 0.073 | 0.061 | 0.061 | 0.527 | 0.063 | 0.062 | 8 |
| 4454 last | rise orbit | 5.698e+0 | 0.341 | 0.049 | 0.050 | 0.027 | 0.046 | 0.044 | 0.464 | 0.064 | 0.065 | 8 |
| 4455 | travel orbit | 5.832e+0 | 0.291 | 0.049 | 0.050 | 0.005 | 0.021 | 0.018 | 0.397 | 0.067 | 0.067 | 8 |
| 4456 | travel orbit | 5.949e+0 | 0.248 | 0.043 | 0.042 | 0.001 | 0.004 | 0.003 | 0.337 | 0.060 | 0.058 | 8 |
| 4457 | travel orbit | 6.053e+0 | 0.218 | 0.030 | 0.029 | 0.001 | 0.000 | 0.000 | 0.296 | 0.042 | 0.040 | 8 |
| 4458 | travel orbit | 6.149e+0 | 0.197 | 0.021 | 0.020 | 0.001 | 0.000 | 0.000 | 0.432 | 0.136 * | 0.871 * | 8 |
| 4459 | travel orbit | 6.244e+0 | 0.192 | 0.005 | 0.009 | 0.001 | 0.000 | 0.000 | 2.004 | 1.573 * | 2.746 * | 8 |
| 4460 | travel orbit | 6.351e+0 | 0.211 | 0.019 | 0.036 | 0.001 | 0.000 | 0.000 | 5.440 | 3.435 * | 4.564 * | 8 |
| 4461 | travel orbit | 6.482e+0 | 0.257 | 0.046 | 0.062 | 0.001 | 0.000 | 0.000 | 10.432 | 4.993 * | 5.562 * | 8 |
| 4462 | travel orbit | 6.655e+0 | 0.328 | 0.071 | 0.085 * | 0.001 | 0.000 | 0.000 | 15.987 | 5.555 * | 5.625 * | 8 |
| 4463 | travel orbit | 6.882e+0 | 0.421 | 0.093 * | 0.107 * | 0.001 | 0.000 | 0.000 | 21.184 | 5.198 * | 5.173 * | 8 |
| 4464 | travel orbit | 7.182e+0 | 0.534 | 0.113 * | 0.123 * | 0.001 | 0.000 | 0.000 | 25.643 | 4.459 * | 4.396 * | 8 |
| 4465 | travel orbit | 7.569e+0 | 0.658 | 0.124 * | 0.126 * | 0.001 | 0.000 | 0.001 | 29.072 | 3.429 * | 3.320 * | 8 |
| 4466 | travel orbit | 8.054e+0 | 0.777 | 0.118 * | 0.118 * | 0.003 | 0.002 | 0.005 | 31.424 | 2.352 * | 2.205 * | 8 |

## pictures

Tier draft, rate 2, 6.1 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

The dive is joined from 2 parts: /home/user/workspace/work/p6/sm54/01/uranus-dive-p1of2 (capture frames 8196 to 8309, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm54/02/uranus-dive-p2of2 (capture frames 8310 to 8423, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

The rise is joined from 2 parts: /home/user/workspace/work/p6/sm54/03/uranus-rise-p1of2 (capture frames 8736 to 8834, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm54/04/uranus-rise-p2of2 (capture frames 8835 to 8933, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

### dive (uranus.dive, frames 4110 to 4199, window 4098 to 4211, 228 draft frames at rate 2)

Largest level step: 0.33 at frame 4142 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.63 from frame 4144 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 8.62 from frame 4148 to the next, block column 0 row 8 from the top left, shown, not judged.
Largest change in place: 97.6 from frame 4161 to 8 film frames later, most at pixel 1224, 272 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 1.61 from frame 4163 to 8 film frames later, most at pixel 1712, 268, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 4200 to 4211 + 1/2): change 9.2, pattern 0.33.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 4143 + 1/2 in /home/user/workspace/work/p6/sm54/01/uranus-dive-p1of2-pops.png, frame 4144 in /home/user/workspace/work/p6/sm54/01/uranus-dive-p1of2-pops.png, frame 4144 + 1/2 in /home/user/workspace/work/p6/sm54/01/uranus-dive-p1of2-pops.png, frame 4145 in /home/user/workspace/work/p6/sm54/01/uranus-dive-p1of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 4155 in /home/user/workspace/work/p6/sm54/02/uranus-dive-p2of2-changes.png, frame 4163 in /home/user/workspace/work/p6/sm54/02/uranus-dive-p2of2-changes.png, frame 4176 in /home/user/workspace/work/p6/sm54/02/uranus-dive-p2of2-changes.png, frame 4184 in /home/user/workspace/work/p6/sm54/02/uranus-dive-p2of2-changes.png.

- RED pop score 1.63 from frame 4144 + 1/2 to the next, limit 1.2 (7 frames over it, first 4141 + 1/2)
- RED the pattern of the picture changes in place by 1.61 from frame 4163 to 8 film frames later, band 8 px, limit 0.45 (102 frames over it, first 4136 + 1/2)

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4098 | 43.84 |  | 0.5 | 0.88 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 12,0 | 1.2 | 2.0 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4098 + 1/2 | 43.84 | 0.00 | 0.5 | 0.88 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 2,5 | 1.2 | 1.9 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4099 | 43.84 | 0.00 | 0.5 | 0.87 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 10,0 | 1.2 | 1.9 | 0.17 | 0.00 | 0.17 | 8.1 |
| 4099 + 1/2 | 43.84 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 12,3 | 1.2 | 1.8 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4100 | 43.84 | 0.00 | 0.5 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.18 | 15,8 | 1.2 | 1.9 | 0.17 | 0.00 | 0.17 | 8.1 |
| 4100 + 1/2 | 43.84 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 6,7 | 1.1 | 1.9 | 0.17 | 0.00 | 0.17 | 8.1 |
| 4101 | 43.85 | 0.00 | 0.5 | 0.88 | 0.87 | 1.01 | 1.01 | 1.01 | 0.000 | 1.17 | 14,0 | 1.1 | 1.9 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4101 + 1/2 | 43.85 | 0.00 | 0.5 | 0.87 | 0.87 | 1.01 | 1.01 | 1.01 | 0.000 | 1.16 | 13,7 | 1.1 | 1.9 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4102 | 43.85 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 4,5 | 1.0 | 1.7 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4102 + 1/2 | 43.85 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 15,0 | 1.0 | 1.7 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4103 | 43.85 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 2,4 | 1.1 | 1.8 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4103 + 1/2 | 43.86 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 3,8 | 1.0 | 1.8 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4104 | 43.86 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 6,8 | 1.1 | 2.0 | 0.17 | 0.00 | 0.17 | 8.0 |
| 4104 + 1/2 | 43.87 | 0.00 | 0.5 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 8,8 | 1.2 | 2.0 | 0.17 | 0.00 | 0.17 | 8.1 |
| 4105 | 43.87 | 0.00 | 0.5 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 15,8 | 1.3 | 2.1 | 0.17 | 0.01 | 0.17 | 8.1 |
| 4105 + 1/2 | 43.87 | 0.00 | 0.5 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 15,8 | 1.4 | 2.1 | 0.17 | 0.01 | 0.17 | 8.0 |
| 4106 | 43.87 | 0.00 | 0.5 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 6,7 | 1.6 | 2.3 | 0.17 | 0.01 | 0.17 | 8.0 |
| 4106 + 1/2 | 43.87 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 3,0 | 1.7 | 2.3 | 0.17 | 0.01 | 0.17 | 8.0 |
| 4107 | 43.88 | 0.00 | 0.5 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 13,7 | 1.8 | 2.5 | 0.17 | 0.02 | 0.17 | 8.0 |
| 4107 + 1/2 | 43.88 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 5,6 | 2.1 | 2.9 | 0.17 | 0.02 | 0.17 | 8.0 |
| 4108 | 43.88 | 0.00 | 0.5 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 2,2 | 2.3 | 3.2 | 0.17 | 0.03 | 0.17 | 8.0 |
| 4108 + 1/2 | 43.88 | 0.00 | 0.5 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 15,4 | 2.6 | 3.4 | 0.17 | 0.04 | 0.17 | 8.0 |
| 4109 | 43.89 | 0.00 | 0.5 | 0.87 | 0.88 | 0.99 | 0.99 | 0.99 | 0.000 | 1.04 | 7,5 | 2.9 | 3.9 | 0.17 | 0.05 | 0.17 | 8.0 |
| 4109 + 1/2 | 43.89 | 0.00 | 0.5 | 0.87 | 0.89 | 0.98 | 0.98 | 0.98 | 0.000 | 1.09 | 1,8 | 3.3 | 4.4 | 0.17 | 0.06 | 0.17 | 8.0 |
| 4110 first | 43.89 | 0.00 | 0.5 | 0.90 | 0.95 | 0.94 | 0.94 | 0.94 | 0.000 | 1.09 | 1,6 | 3.7 | 5.2 | 0.17 | 0.07 | 0.17 | 8.2 |
| 4110 + 1/2 | 43.89 | 0.00 | 0.6 | 1.04 | 1.09 | 0.95 | 0.95 | 0.95 | 0.000 | 1.26 | 1,1 | 4.1 | 5.7 | 0.17 | 0.08 | 0.17 | 8.2 |
| 4111 | 43.90 | 0.00 | 0.9 | 1.28 | 1.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.54 | 14,3 | 4.4 | 6.2 | 0.17 | 0.09 | 0.17 | 8.3 |
| 4111 + 1/2 | 43.91 | 0.01 | 1.2 | 1.52 | 1.47 | 1.03 | 1.03 | 1.03 | 0.000 | 1.73 | 14,4 | 4.6 | 6.9 | 0.17 | 0.10 | 0.17 | 8.3 |
| 4112 | 43.94 | 0.00 | 1.8 | 1.67 | 1.61 | 1.04 | 1.04 | 1.04 | 0.000 | 1.91 | 13,2 | 4.9 | 7.4 | 0.17 | 0.11 | 0.17 | 8.4 |
| 4112 + 1/2 | 43.97 | 0.01 | 2.5 | 1.70 | 1.69 | 1.01 | 1.01 | 1.01 | 0.000 | 1.95 | 13,2 | 5.4 | 7.7 | 0.17 | 0.12 | 0.17 | 8.4 |
| 4113 | 44.02 | 0.01 | 3.1 | 1.71 | 1.76 | 0.97 | 0.97 | 0.97 | 0.000 | 1.77 | 10,6 | 5.5 | 7.1 | 0.17 | 0.15 | 0.03 | 8.0 |
| 4113 + 1/2 | 44.09 | 0.01 | 3.8 | 1.82 | 1.82 | 1.00 | 1.02 | 1.00 | 0.000 | 1.91 | 1,1 | 5.8 | 6.8 | 0.17 | 0.29 | 0.04 | 8.0 |
| 4114 | 44.16 | 0.01 | 4.5 | 1.92 | 1.88 | 1.02 | 1.07 | 1.02 | 0.003 | 1.94 | 10,6 | 6.1 | 7.2 | 0.17 | 0.31 | 0.05 | 8.0 |
| 4114 + 1/2 | 44.27 | 0.01 | 5.2 | 2.00 | 1.93 | 1.04 | 1.08 | 1.04 | 0.006 | 2.01 | 10,6 | 6.6 | 7.5 | 0.17 | 0.31 | 0.06 | 8.0 |
| 4115 | 44.39 | 0.01 | 5.8 | 1.98 | 1.94 | 1.02 | 1.06 | 1.02 | 0.007 | 1.90 | 7,1 | 6.8 | 7.3 | 0.18 | 0.11 | 0.17 | 8.5 |
| 4115 + 1/2 | 44.52 | 0.00 | 6.4 | 1.94 | 1.98 | 0.98 | 1.08 | 0.98 | 0.000 | 1.87 | 5,3 | 7.1 | 7.5 | 0.18 | 0.10 | 0.17 | 8.4 |
| 4116 | 44.66 | 0.01 | 7.1 | 1.94 | 1.98 | 0.98 | 1.07 | 0.98 | 0.003 | 1.99 | 5,3 | 7.3 | 7.8 | 0.18 | 0.10 | 0.18 | 8.4 |
| 4116 + 1/2 | 44.81 | 0.01 | 7.6 | 1.98 | 1.98 | 1.00 | 1.10 | 1.00 | 0.000 | 2.02 | 5,3 | 7.4 | 7.9 | 0.18 | 0.10 | 0.15 | 8.0 |
| 4117 | 44.98 | 0.01 | 8.2 | 2.07 | 1.98 | 1.05 | 1.14 | 1.05 | 0.004 | 2.00 | 5,3 | 7.3 | 7.8 | 0.18 | 0.15 | 0.16 | 8.0 |
| 4117 + 1/2 | 45.18 | 0.02 | 8.8 | 2.18 | 1.98 | 1.10 | 1.20 | 1.10 | 0.007 | 1.95 | 5,3 | 7.1 | 7.7 | 0.19 | 0.14 | 0.18 | 8.0 |
| 4118 | 45.40 | 0.00 | 9.3 | 2.15 | 1.98 | 1.09 | 1.16 | 1.09 | 0.014 | 1.82 | 1,3 | 6.7 | 7.6 | 0.19 | 0.21 | 0.19 | 8.0 |
| 4118 + 1/2 | 45.63 | 0.01 | 10.0 | 2.09 | 1.98 | 1.06 | 1.11 | 1.06 | 0.020 | 1.62 | 1,4 | 6.4 | 6.9 | 0.19 | 0.27 | 0.21 | 8.0 |
| 4119 | 45.89 | 0.01 | 10.6 | 2.03 | 1.98 | 1.03 | 1.08 | 1.03 | 0.021 | 1.89 | 1,7 | 6.1 | 7.4 | 0.19 | 0.30 | 0.22 | 8.0 |
| 4119 + 1/2 | 46.17 | 0.01 | 11.2 | 2.05 | 1.98 | 1.04 | 1.06 | 1.04 | 0.027 | 1.93 | 15,0 | 5.5 | 6.3 | 0.20 | 0.30 | 0.24 | 8.0 |
| 4120 | 46.43 | 0.01 | 12.0 | 2.11 | 1.98 | 1.07 | 1.06 | 1.06 | 0.039 | 1.83 | 15,0 | 5.0 | 6.1 | 0.20 | 0.31 | 0.25 | 8.0 |
| 4120 + 1/2 | 46.70 | 0.00 | 12.5 | 2.15 | 1.98 | 1.09 | 1.06 | 1.06 | 0.051 | 1.88 | 15,0 | 4.7 | 6.0 | 0.21 | 0.32 | 0.26 | 8.0 |
| 4121 | 46.98 | 0.01 | 13.3 | 2.14 | 1.98 | 1.08 | 1.04 | 1.04 | 0.056 | 2.67 | 15,0 | 4.4 | 5.5 | 0.21 | 0.31 | 0.27 | 8.0 |
| 4121 + 1/2 | 47.29 | 0.00 | 13.9 | 2.07 | 1.98 | 1.05 | 1.03 | 1.03 | 0.051 | 2.45 | 15,0 | 4.1 | 5.0 | 0.22 | 0.36 | 0.29 | 8.0 |
| 4122 | 47.60 | 0.01 | 14.6 | 2.07 | 1.98 | 1.05 | 0.95 | 0.95 | 0.071 | 1.99 | 15,2 | 4.1 | 4.9 | 0.22 | 0.33 | 0.30 | 8.0 |
| 4122 + 1/2 | 47.94 | 0.00 | 15.5 | 2.07 | 1.98 | 1.05 | 1.02 | 1.02 | 0.062 | 2.23 | 15,2 | 4.0 | 5.0 | 0.23 | 0.32 | 0.32 | 8.0 |
| 4123 | 48.28 | 0.00 | 16.0 | 2.13 | 1.96 | 1.08 | 1.04 | 1.04 | 0.070 | 2.03 | 2,8 | 4.3 | 5.9 | 0.23 | 0.34 | 0.33 | 8.0 |
| 4123 + 1/2 | 48.62 | 0.00 | 16.8 | 2.02 | 1.95 | 1.04 | 1.01 | 1.01 | 0.069 | 2.08 | 2,8 | 4.5 | 6.5 | 0.24 | 0.32 | 0.34 | 8.0 |
| 4124 | 48.95 | 0.02 | 17.5 | 1.97 | 1.94 | 1.02 | 0.98 | 0.98 | 0.086 | 2.33 | 2,8 | 4.9 | 7.2 | 0.25 | 0.30 | 0.36 | 8.0 |
| 4124 + 1/2 | 49.25 | 0.01 | 18.4 | 1.95 | 1.91 | 1.02 | 1.05 | 1.02 | 0.071 | 2.21 | 2,8 | 5.2 | 7.6 | 0.25 | 0.29 | 0.37 | 8.0 |
| 4125 | 49.54 | 0.01 | 19.0 | 1.84 | 1.88 | 0.98 | 0.96 | 0.96 | 0.087 | 2.10 | 4,7 | 5.6 | 8.3 | 0.25 | 0.27 | 0.39 | 8.0 |
| 4125 + 1/2 | 49.80 | 0.03 | 19.9 | 1.81 | 1.81 | 1.00 | 1.00 | 1.00 | 0.106 | 1.82 | 12,2 | 5.9 | 8.8 | 0.26 | 0.24 | 0.41 | 8.0 |
| 4126 | 50.13 | 0.03 | 20.6 | 1.78 | 1.76 | 1.01 | 1.01 | 1.01 | 0.110 | 2.19 | 12,5 | 6.1 | 9.2 | 0.26 | 0.22 | 0.42 | 8.0 |
| 4126 + 1/2 | 50.52 | 0.00 | 21.0 | 1.72 | 1.73 | 1.00 | 0.98 | 0.98 | 0.131 | 2.37 | 4,7 | 6.6 | 9.9 | 0.27 | 0.19 | 0.44 | 8.0 |
| 4127 | 50.92 | 0.02 | 21.3 | 1.67 | 1.66 | 1.01 | 1.03 | 1.01 | 0.118 | 2.32 | 3,8 | 7.0 | 10.2 | 0.27 | 0.21 | 0.27 | 8.0 |
| 4127 + 1/2 | 51.37 | 0.04 | 21.0 | 1.59 | 1.58 | 1.01 | 1.02 | 1.01 | 0.153 | 2.53 | 4,8 | 7.5 | 11.0 | 0.28 | 0.23 | 0.28 | 8.0 |
| 4128 | 51.90 | 0.03 | 19.4 | 1.49 | 1.53 | 0.98 | 0.99 | 0.98 | 0.245 | 2.20 | 4,8 | 7.4 | 10.7 | 0.28 | 0.24 | 0.28 | 8.0 |
| 4128 + 1/2 | 52.47 | 0.06 | 18.3 | 1.46 | 1.42 | 1.03 | 0.94 | 0.94 | 0.312 | 1.95 | 11,8 | 7.5 | 11.1 | 0.29 | 0.27 | 0.29 | 8.0 |
| 4129 | 53.16 | 0.03 | 20.8 | 1.34 | 1.40 | 0.96 | 1.02 | 0.96 | 0.218 | 2.28 | 4,8 | 7.5 | 12.1 | 0.29 | 0.30 | 0.29 | 8.0 |
| 4129 + 1/2 | 53.92 | 0.05 | 17.7 | 1.33 | 1.32 | 1.01 | 1.02 | 1.01 | 0.265 | 3.59 | 5,8 | 7.6 | 14.0 | 0.30 | 0.29 | 0.29 | 8.0 |
| 4130 | 54.77 | 0.04 | 17.0 | 1.29 | 1.27 | 1.02 | 1.01 | 1.01 | 0.295 | 2.03 | 13,5 | 7.7 | 15.3 | 0.31 | 0.35 | 0.30 | 8.0 |
| 4130 + 1/2 | 55.69 | 0.03 | 16.7 | 1.21 | 1.23 | 0.98 | 0.97 | 0.97 | 0.302 | 1.72 | 14,7 | 7.8 | 17.0 | 0.31 | 0.33 | 0.30 | 8.0 |
| 4131 | 56.54 | 0.00 | 18.0 | 1.16 | 1.17 | 0.99 | 1.02 | 0.99 | 0.302 | 1.89 | 14,3 | 8.0 | 17.7 | 0.32 | 0.33 | 0.31 | 8.0 |
| 4131 + 1/2 | 57.40 | 0.00 | 17.5 | 1.14 | 1.14 | 1.00 | 0.98 | 0.98 | 0.264 | 1.82 | 5,8 | 8.6 | 18.8 | 0.32 | 0.26 | 0.31 | 8.0 |
| 4132 | 58.26 | 0.06 | 17.8 | 1.12 | 1.11 | 1.01 | 1.02 | 1.01 | 0.295 | 1.92 | 13,7 | 9.1 | 18.9 | 0.32 | 0.24 | 0.32 | 8.0 |
| 4132 + 1/2 | 59.02 | 0.11 | 17.9 | 1.06 | 1.13 | 0.94 | 0.88 | 0.88 | 0.313 | 1.90 | 5,1 | 9.2 | 17.0 | 0.33 | 0.24 | 0.32 | 8.0 |
| 4133 | 59.55 | 0.08 | 16.6 | 1.03 | 1.13 | 0.91 | 0.94 | 0.91 | 0.253 | 2.86 | 5,1 | 9.2 | 17.0 | 0.33 | 0.23 | 0.33 | 8.0 |
| 4133 + 1/2 | 59.92 | 0.04 | 16.3 | 0.99 | 1.13 | 0.87 | 0.86 | 0.86 | 0.237 | 2.21 | 15,4 | 9.8 | 16.0 | 0.33 | 0.24 | 0.33 | 8.0 |
| 4134 | 60.37 | 0.05 | 18.7 | 0.93 | 1.13 | 0.82 | 0.83 | 0.82 | 0.226 | 2.24 | 5,1 | 10.2 | 18.8 | 0.34 | 0.25 | 0.33 | 8.0 |
| 4134 + 1/2 | 60.71 | 0.06 | 17.8 | 0.86 | 1.13 | 0.76 | 0.76 | 0.76 | 0.244 | 2.22 | 5,1 | 10.4 | 17.4 | 0.34 | 0.27 | 0.34 | 8.0 |
| 4135 | 61.17 | 0.03 | 16.8 | 0.83 | 1.13 | 0.74 | 0.74 | 0.74 | 0.185 | 2.14 | 3,6 | 10.4 | 16.5 | 0.34 | 0.31 | 0.34 | 8.0 |
| 4135 + 1/2 | 61.68 | 0.01 | 16.8 | 0.83 | 1.13 | 0.73 | 0.69 | 0.69 | 0.222 | 2.23 | 3,6 | 9.9 | 14.9 | 0.34 | 0.39 | 0.34 | 8.0 |
| 4136 | 62.21 | 0.01 | 19.3 | 0.86 | 1.13 | 0.76 | 0.71 | 0.71 | 0.196 | 2.14 | 3,6 | 11.1 | 16.6 | 0.35 | 0.44 | 0.34 | 8.0 |
| 4136 + 1/2 | 62.76 | 0.04 | 16.3 | 0.87 | 1.13 | 0.77 | 0.64 | 0.64 | 0.247 | 2.25 | 3,6 | 12.1 | 19.6 | 0.35 | 0.47 | 0.34 | 8.0 |
| 4137 | 63.39 | 0.03 | 16.3 | 0.92 | 1.13 | 0.81 | 0.71 | 0.71 | 0.233 | 3.94 | 15,6 | 13.3 | 21.1 | 0.35 | 0.47 | 0.35 | 8.0 |
| 4137 + 1/2 | 64.07 | 0.04 | 16.9 | 0.92 | 1.13 | 0.81 | 0.73 | 0.73 | 0.206 | 2.75 | 15,8 | 14.1 | 20.7 | 0.35 | 0.50 | 0.35 | 8.0 |
| 4138 | 64.85 | 0.00 | 16.8 | 0.97 | 1.13 | 0.85 | 0.72 | 0.72 | 0.193 | 2.87 | 15,8 | 15.2 | 22.1 | 0.36 | 0.51 | 0.35 | 8.0 |
| 4138 + 1/2 | 65.62 | 0.04 | 18.8 | 0.98 | 1.13 | 0.87 | 0.78 | 0.78 | 0.154 | 2.61 | 3,5 | 15.7 | 23.3 | 0.36 | 0.48 | 0.36 | 8.0 |
| 4139 | 66.48 | 0.08 | 20.2 | 1.05 | 1.13 | 0.93 | 0.73 | 0.73 | 0.181 | 2.31 | 3,5 | 15.7 | 20.6 | 0.37 | 0.48 | 0.36 | 8.0 |
| 4139 + 1/2 | 67.49 | 0.00 | 22.7 | 1.01 | 1.13 | 0.89 | 0.82 | 0.82 | 0.157 | 2.24 | 14,1 | 15.9 | 19.8 | 0.37 | 0.53 | 0.37 | 8.0 |
| 4140 | 68.51 | 0.13 | 23.0 | 1.07 | 1.17 | 0.91 | 0.98 | 0.91 | 0.103 | 2.80 | 15,2 | 17.0 | 21.2 | 0.38 | 0.59 | 0.37 | 8.0 |
| 4140 + 1/2 | 69.27 | 0.14 | 23.0 | 1.22 | 1.26 | 0.97 | 1.11 | 0.97 | 0.076 | 3.12 | 15,1 | 18.5 | 22.4 | 0.38 | 0.64 | 0.38 | 8.0 |
| 4141 | 69.76 | 0.10 | 22.9 | 1.44 | 1.29 | 1.12 | 1.29 | 1.12 | 0.070 | 2.59 | 15,1 | 19.3 | 26.9 | 0.39 | 0.66 | 0.39 | 8.0 |
| 4141 + 1/2 | 70.05 | 0.16 | 23.3 | 1.57 | 1.29 | 1.22 | 1.25 | 1.22 | 0.076 | 3.57 | 2,5 | 17.3 | 32.0 | 0.40 | 0.62 | 0.39 | 8.0 |
| 4142 | 70.03 | 0.33 | 23.1 | 1.47 | 1.29 | 1.14 | 1.24 | 1.14 | 0.080 | 3.11 | 1,0 | 15.6 | 26.7 | 0.41 | 0.54 | 0.40 | 8.0 |
| 4142 + 1/2 | 69.35 | 0.05 | 22.6 | 1.45 | 1.29 | 1.12 | 1.30 | 1.12 | 0.082 | 3.39 | 1,0 | 14.0 | 22.0 | 0.42 | 0.50 | 0.41 | 8.0 |
| 4143 | 68.79 | 0.03 | 22.1 | 1.60 | 1.29 | 1.24 | 1.45 | 1.24 | 0.067 | 2.98 | 1,0 | 14.1 | 24.8 | 0.42 | 0.53 | 0.42 | 8.0 |
| 4143 + 1/2 | 68.28 | 0.02 | 21.8 | 1.88 | 1.29 | 1.46 | 1.55 | 1.46 | 0.070 | 3.46 | 0,1 | 14.4 | 29.3 | 0.43 | 0.55 | 0.42 | 8.0 |
| 4144 | 67.73 | 0.00 | 21.8 | 2.06 | 1.29 | 1.59 | 1.56 | 1.56 | 0.067 | 3.65 | 1,0 | 14.1 | 28.8 | 0.44 | 0.64 | 0.43 | 8.0 |
| 4144 + 1/2 | 67.18 | 0.11 | 21.7 | 2.26 | 1.29 | 1.75 | 1.63 | 1.63 | 0.061 | 3.47 | 1,0 | 13.6 | 21.7 | 0.44 | 0.67 | 0.43 | 8.0 |
| 4145 | 66.39 | 0.11 | 21.3 | 2.22 | 1.29 | 1.72 | 1.52 | 1.52 | 0.071 | 3.08 | 1,4 | 13.2 | 19.6 | 0.45 | 0.62 | 0.44 | 8.0 |
| 4145 + 1/2 | 65.39 | 0.03 | 21.0 | 2.20 | 1.29 | 1.71 | 1.39 | 1.39 | 0.061 | 3.25 | 1,4 | 13.6 | 19.6 | 0.46 | 0.49 | 0.44 | 8.0 |
| 4146 | 64.34 | 0.13 | 20.5 | 2.39 | 1.29 | 1.85 | 1.14 | 1.14 | 0.096 | 2.17 | 1,3 | 15.0 | 20.7 | 0.46 | 0.455 | 0.45 | 8.0 |
| 4146 + 1/2 | 63.01 | 0.07 | 19.8 | 2.08 | 1.30 | 1.59 | 0.95 | 0.95 | 0.100 | 2.00 | 2,4 | 16.6 | 24.5 | 0.47 | 0.53 | 0.45 | 8.0 |
| 4147 | 61.55 | 0.16 | 19.5 | 1.71 | 1.33 | 1.28 | 0.92 | 0.92 | 0.090 | 2.53 | 5,0 | 18.5 | 29.4 | 0.47 | 0.59 | 0.46 | 8.0 |
| 4147 + 1/2 | 60.40 | 0.04 | 18.9 | 1.55 | 1.37 | 1.14 | 0.86 | 0.86 | 0.098 | 2.35 | 1,7 | 21.1 | 33.9 | 0.48 | 0.67 | 0.47 | 8.0 |
| 4148 | 59.33 | 0.01 | 18.6 | 1.45 | 1.40 | 1.04 | 0.82 | 0.82 | 0.103 | 8.62 | 0,8 | 23.9 | 36.8 | 0.48 | 0.72 | 0.46 | 8.0 |
| 4148 + 1/2 | 58.28 | 0.00 | 15.8 | 1.45 | 1.44 | 1.01 | 0.84 | 0.84 | 0.121 | 2.27 | 5,0 | 25.8 | 37.3 | 0.48 | 0.75 | 0.47 | 8.0 |
| 4149 | 57.24 | 0.08 | 14.9 | 1.36 | 1.45 | 0.94 | 0.84 | 0.84 | 0.131 | 2.61 | 3,1 | 27.3 | 33.2 | 0.49 | 0.76 | 0.47 | 8.0 |
| 4149 + 1/2 | 56.34 | 0.05 | 14.6 | 1.18 | 1.45 | 0.81 | 0.87 | 0.81 | 0.090 | 3.80 | 0,8 | 29.7 | 34.6 | 0.49 | 0.75 | 0.47 | 8.0 |
| 4150 | 55.55 | 0.03 | 14.4 | 1.01 | 1.45 | 0.70 | 0.79 | 0.70 | 0.101 | 1.70 | 8,3 | 32.7 | 37.9 | 0.50 | 0.83 | 0.47 | 8.0 |
| 4150 + 1/2 | 54.82 | 0.03 | 14.2 | 0.97 | 1.45 | 0.67 | 0.74 | 0.67 | 0.098 | 1.76 | 8,3 | 35.6 | 40.8 | 0.50 | 0.99 | 0.48 | 8.0 |
| 4151 | 54.14 | 0.04 | 14.7 | 0.98 | 1.46 | 0.67 | 0.73 | 0.67 | 0.114 | 1.63 | 8,3 | 38.7 | 45.9 | 0.50 | 1.03 | 0.48 | 8.0 |
| 4151 + 1/2 | 53.54 | 0.03 | 14.2 | 0.99 | 1.46 | 0.68 | 0.76 | 0.68 | 0.100 | 1.61 | 8,3 | 41.6 | 50.9 | 0.51 | 1.03 | 0.48 | 8.0 |
| 4152 | 53.00 | 0.01 | 13.9 | 1.02 | 1.46 | 0.70 | 0.80 | 0.70 | 0.100 | 1.60 | 8,3 | 43.8 | 53.5 | 0.51 | 1.12 | 0.48 | 8.0 |
| 4152 + 1/2 | 52.48 | 0.02 | 13.7 | 1.06 | 1.46 | 0.73 | 0.81 | 0.73 | 0.102 | 1.55 | 14,5 | 46.2 | 55.9 | 0.51 | 1.17 | 0.48 | 8.0 |
| 4153 | 52.00 | 0.02 | 13.6 | 1.09 | 1.46 | 0.75 | 0.86 | 0.75 | 0.088 | 1.76 | 8,0 | 47.4 | 56.2 | 0.51 | 1.11 | 0.48 | 8.0 |
| 4153 + 1/2 | 51.57 | 0.03 | 13.5 | 1.14 | 1.46 | 0.78 | 0.97 | 0.78 | 0.041 | 1.86 | 8,0 | 50.2 | 57.4 | 0.51 | 1.02 | 0.48 | 8.0 |
| 4154 | 51.20 | 0.03 | 13.5 | 1.19 | 1.46 | 0.81 | 0.96 | 0.81 | 0.077 | 1.98 | 8,0 | 52.8 | 59.0 | 0.51 | 0.95 | 0.48 | 8.0 |
| 4154 + 1/2 | 50.89 | 0.04 | 13.0 | 1.25 | 1.46 | 0.86 | 1.01 | 0.86 | 0.066 | 2.34 | 12,0 | 56.4 | 61.5 | 0.51 | 0.93 | 0.41 | 8.0 |
| 4155 | 50.67 | 0.04 | 13.0 | 1.31 | 1.46 | 0.90 | 0.99 | 0.90 | 0.065 | 2.80 | 12,0 | 60.2 | 64.9 | 0.51 | 0.94 | 0.47 | 8.0 |
| 4155 + 1/2 | 50.52 | 0.04 | 13.0 | 1.37 | 1.46 | 0.94 | 1.02 | 0.94 | 0.050 | 2.52 | 9,0 | 63.7 | 69.9 | 0.51 | 1.01 | 0.46 | 8.0 |
| 4156 | 50.46 | 0.05 | 12.9 | 1.43 | 1.46 | 0.98 | 0.99 | 0.98 | 0.072 | 2.71 | 9,0 | 67.8 | 74.8 | 0.51 | 1.12 | 0.46 | 8.0 |
| 4156 + 1/2 | 50.48 | 0.03 | 12.7 | 1.46 | 1.48 | 0.99 | 0.98 | 0.98 | 0.072 | 2.55 | 9,0 | 73.1 | 79.1 | 0.51 | 1.19 | 0.35 | 8.0 |
| 4157 | 50.56 | 0.01 | 12.7 | 1.51 | 1.51 | 1.00 | 1.02 | 1.00 | 0.049 | 2.70 | 12,0 | 77.9 | 82.7 | 0.51 | 1.33 | 0.32 | 8.0 |
| 4157 + 1/2 | 50.65 | 0.03 | 12.6 | 1.56 | 1.54 | 1.02 | 1.01 | 1.01 | 0.066 | 2.63 | 9,0 | 82.2 | 86.2 | 0.51 | 1.38 | 0.46 | 8.0 |
| 4158 | 50.69 | 0.06 | 12.9 | 1.56 | 1.58 | 0.99 | 0.99 | 0.99 | 0.064 | 2.56 | 10,0 | 86.3 | 90.4 | 0.51 | 1.45 | 0.45 | 8.0 |
| 4158 + 1/2 | 50.60 | 0.04 | 12.9 | 1.60 | 1.59 | 1.00 | 1.01 | 1.00 | 0.062 | 2.52 | 9,1 | 89.7 | 94.6 | 0.50 | 1.53 | 0.44 | 8.0 |
| 4159 | 50.44 | 0.03 | 13.0 | 1.62 | 1.61 | 1.00 | 1.02 | 1.00 | 0.054 | 2.59 | 9,1 | 92.4 | 98.2 | 0.50 | 1.53 | 0.44 | 8.0 |
| 4159 + 1/2 | 50.22 | 0.01 | 13.0 | 1.62 | 1.63 | 1.00 | 1.02 | 1.00 | 0.058 | 2.65 | 9,1 | 94.6 | 101.0 | 0.50 | 1.49 | 0.43 | 8.0 |
| 4160 | 49.98 | 0.01 | 13.0 | 1.64 | 1.63 | 1.00 | 1.04 | 1.00 | 0.037 | 2.74 | 9,1 | 96.3 | 102.7 | 0.49 | 1.53 | 0.43 | 8.0 |
| 4160 + 1/2 | 49.73 | 0.02 | 12.9 | 1.64 | 1.64 | 1.00 | 1.01 | 1.00 | 0.062 | 2.76 | 9,1 | 97.1 | 103.8 | 0.49 | 1.57 | 0.42 | 8.0 |
| 4161 | 49.51 | 0.03 | 13.1 | 1.64 | 1.64 | 1.00 | 1.03 | 1.00 | 0.049 | 2.55 | 10,1 | 97.6 | 103.8 | 0.48 | 1.57 | 0.41 | 8.0 |
| 4161 + 1/2 | 49.36 | 0.03 | 13.0 | 1.66 | 1.64 | 1.01 | 1.03 | 1.01 | 0.051 | 2.41 | 13,2 | 97.5 | 103.4 | 0.47 | 1.56 | 0.40 | 8.0 |
| 4162 | 49.27 | 0.03 | 13.1 | 1.65 | 1.64 | 1.00 | 1.02 | 1.00 | 0.048 | 2.53 | 13,2 | 97.2 | 102.5 | 0.46 | 1.59 | 0.39 | 8.0 |
| 4162 + 1/2 | 49.23 | 0.04 | 13.2 | 1.65 | 1.65 | 1.00 | 0.99 | 0.99 | 0.066 | 2.26 | 13,2 | 96.2 | 101.3 | 0.45 | 1.61 | 0.38 | 8.0 |
| 4163 | 49.28 | 0.02 | 13.2 | 1.64 | 1.65 | 1.00 | 0.99 | 0.99 | 0.072 | 2.14 | 13,2 | 95.1 | 100.1 | 0.44 | 1.61 | 0.37 | 8.0 |
| 4163 + 1/2 | 49.37 | 0.03 | 13.1 | 1.67 | 1.65 | 1.01 | 1.02 | 1.01 | 0.071 | 1.97 | 13,2 | 93.8 | 98.5 | 0.43 | 1.49 | 0.35 | 8.0 |
| 4164 | 49.52 | 0.03 | 13.2 | 1.67 | 1.65 | 1.01 | 0.98 | 0.98 | 0.087 | 1.84 | 13,2 | 90.7 | 96.1 | 0.42 | 1.40 | 0.34 | 8.0 |
| 4164 + 1/2 | 49.72 | 0.03 | 13.2 | 1.65 | 1.65 | 1.00 | 1.00 | 1.00 | 0.064 | 1.77 | 11,2 | 88.2 | 93.8 | 0.41 | 1.35 | 0.33 | 8.0 |
| 4165 | 49.98 | 0.03 | 13.2 | 1.67 | 1.65 | 1.01 | 1.02 | 1.01 | 0.051 | 2.21 | 15,3 | 85.3 | 91.8 | 0.40 | 1.37 | 0.17 | 8.0 |
| 4165 + 1/2 | 50.30 | 0.03 | 13.3 | 1.66 | 1.66 | 1.00 | 1.01 | 1.00 | 0.045 | 2.15 | 15,3 | 82.6 | 89.4 | 0.39 | 1.39 | 0.17 | 8.0 |
| 4166 | 50.68 | 0.04 | 13.4 | 1.67 | 1.66 | 1.01 | 1.02 | 1.01 | 0.036 | 2.43 | 15,3 | 79.8 | 86.3 | 0.38 | 1.36 | 0.18 | 8.0 |
| 4166 + 1/2 | 51.12 | 0.03 | 13.4 | 1.67 | 1.66 | 1.01 | 0.99 | 0.99 | 0.046 | 2.44 | 15,3 | 77.7 | 83.1 | 0.37 | 1.40 | 0.17 | 8.0 |
| 4167 | 51.62 | 0.02 | 13.4 | 1.67 | 1.66 | 1.00 | 1.00 | 1.00 | 0.043 | 2.41 | 15,3 | 76.0 | 79.7 | 0.36 | 1.41 | 0.18 | 8.0 |
| 4167 + 1/2 | 52.17 | 0.01 | 13.6 | 1.66 | 1.67 | 0.99 | 1.00 | 0.99 | 0.035 | 2.07 | 14,3 | 73.8 | 79.4 | 0.35 | 1.41 | 0.17 | 8.0 |
| 4168 | 52.73 | 0.00 | 13.6 | 1.66 | 1.67 | 0.99 | 1.00 | 0.99 | 0.042 | 2.17 | 15,4 | 71.8 | 79.2 | 0.34 | 1.26 | 0.18 | 8.0 |
| 4168 + 1/2 | 53.28 | 0.01 | 13.4 | 1.64 | 1.67 | 0.98 | 0.98 | 0.98 | 0.051 | 2.24 | 15,4 | 70.4 | 78.9 | 0.34 | 1.29 | 0.17 | 8.0 |
| 4169 | 53.80 | 0.04 | 13.7 | 1.65 | 1.67 | 0.98 | 0.99 | 0.98 | 0.039 | 2.41 | 15,4 | 69.4 | 78.4 | 0.33 | 1.17 | 0.17 | 8.0 |
| 4169 + 1/2 | 54.25 | 0.05 | 13.7 | 1.65 | 1.67 | 0.98 | 0.97 | 0.97 | 0.035 | 2.16 | 15,4 | 68.8 | 78.1 | 0.32 | 1.30 | 0.18 | 8.0 |
| 4170 | 54.61 | 0.03 | 13.7 | 1.67 | 1.68 | 1.00 | 0.94 | 0.94 | 0.063 | 2.21 | 13,0 | 68.0 | 77.4 | 0.32 | 1.28 | 0.18 | 8.0 |
| 4170 + 1/2 | 54.90 | 0.01 | 13.7 | 1.68 | 1.71 | 0.98 | 0.96 | 0.96 | 0.074 | 2.40 | 14,1 | 67.4 | 76.6 | 0.31 | 1.30 | 0.18 | 8.0 |
| 4171 | 55.19 | 0.01 | 13.7 | 1.74 | 1.72 | 1.01 | 1.00 | 1.00 | 0.046 | 2.51 | 14,1 | 66.4 | 75.4 | 0.31 | 1.45 | 0.19 | 8.0 |
| 4171 + 1/2 | 55.46 | 0.01 | 13.8 | 1.76 | 1.74 | 1.01 | 0.98 | 0.98 | 0.068 | 2.39 | 14,1 | 65.4 | 73.7 | 0.30 | 1.31 | 0.19 | 8.0 |
| 4172 | 55.72 | 0.02 | 13.9 | 1.80 | 1.74 | 1.04 | 0.97 | 0.97 | 0.079 | 2.58 | 13,1 | 64.4 | 71.7 | 0.30 | 1.11 | 0.18 | 8.0 |
| 4172 + 1/2 | 55.94 | 0.01 | 13.9 | 1.82 | 1.74 | 1.05 | 1.02 | 1.02 | 0.079 | 2.73 | 13,1 | 63.4 | 69.1 | 0.29 | 1.36 | 0.18 | 8.0 |
| 4173 | 56.13 | 0.01 | 13.8 | 1.83 | 1.74 | 1.05 | 1.02 | 1.02 | 0.079 | 2.94 | 13,1 | 62.3 | 66.3 | 0.28 | 1.27 | 0.19 | 8.0 |
| 4173 + 1/2 | 56.32 | 0.01 | 13.9 | 1.85 | 1.74 | 1.07 | 1.04 | 1.04 | 0.067 | 3.09 | 13,1 | 61.2 | 63.6 | 0.28 | 1.28 | 0.18 | 8.0 |
| 4174 | 56.47 | 0.01 | 14.0 | 1.89 | 1.74 | 1.08 | 1.07 | 1.07 | 0.081 | 3.61 | 13,1 | 59.8 | 63.4 | 0.28 | 1.19 | 0.18 | 8.0 |
| 4174 + 1/2 | 56.61 | 0.01 | 14.0 | 1.92 | 1.74 | 1.11 | 1.06 | 1.06 | 0.075 | 3.80 | 13,1 | 58.5 | 62.8 | 0.29 | 1.14 | 0.18 | 8.0 |
| 4175 | 56.71 | 0.01 | 14.1 | 1.91 | 1.74 | 1.10 | 1.12 | 1.10 | 0.043 | 3.47 | 13,1 | 57.4 | 62.1 | 0.29 | 1.25 | 0.18 | 8.0 |
| 4175 + 1/2 | 56.79 | 0.01 | 14.3 | 1.88 | 1.74 | 1.08 | 1.07 | 1.07 | 0.073 | 2.93 | 13,1 | 56.3 | 61.1 | 0.29 | 1.16 | 0.17 | 8.0 |
| 4176 | 56.85 | 0.00 | 13.9 | 1.93 | 1.74 | 1.11 | 1.16 | 1.11 | 0.038 | 2.77 | 12,1 | 55.1 | 59.9 | 0.29 | 1.49 | 0.17 | 8.0 |
| 4176 + 1/2 | 56.91 | 0.00 | 14.1 | 1.87 | 1.74 | 1.07 | 1.11 | 1.07 | 0.051 | 2.47 | 11,1 | 53.9 | 58.6 | 0.28 | 1.12 | 0.17 | 8.0 |
| 4177 | 56.96 | 0.01 | 14.3 | 1.84 | 1.74 | 1.06 | 1.09 | 1.06 | 0.057 | 2.39 | 14,3 | 52.3 | 56.8 | 0.29 | 1.33 | 0.17 | 8.0 |
| 4177 + 1/2 | 57.01 | 0.01 | 14.3 | 1.83 | 1.74 | 1.05 | 1.10 | 1.05 | 0.040 | 2.75 | 12,1 | 50.8 | 55.0 | 0.29 | 1.10 | 0.17 | 8.0 |
| 4178 | 57.03 | 0.01 | 13.9 | 1.81 | 1.74 | 1.04 | 1.09 | 1.04 | 0.052 | 2.62 | 12,1 | 49.2 | 53.2 | 0.29 | 1.30 | 0.17 | 8.0 |
| 4178 + 1/2 | 57.05 | 0.00 | 13.8 | 1.80 | 1.74 | 1.03 | 1.11 | 1.03 | 0.038 | 2.33 | 13,2 | 47.5 | 51.2 | 0.29 | 1.14 | 0.15 | 8.0 |
| 4179 | 57.06 | 0.01 | 13.4 | 1.79 | 1.74 | 1.03 | 1.06 | 1.03 | 0.060 | 2.02 | 14,3 | 45.9 | 49.2 | 0.30 | 1.27 | 0.14 | 8.0 |
| 4179 + 1/2 | 57.05 | 0.01 | 13.1 | 1.74 | 1.73 | 1.00 | 1.02 | 1.00 | 0.055 | 2.10 | 12,2 | 44.2 | 47.3 | 0.30 | 1.23 | 0.14 | 8.0 |
| 4180 | 57.03 | 0.01 | 13.0 | 1.71 | 1.70 | 1.01 | 1.01 | 1.01 | 0.053 | 1.98 | 12,2 | 42.7 | 45.1 | 0.30 | 1.04 | 0.13 | 8.0 |
| 4180 + 1/2 | 56.97 | 0.01 | 12.7 | 1.66 | 1.66 | 1.00 | 1.02 | 1.00 | 0.042 | 1.89 | 13,3 | 41.3 | 43.3 | 0.31 | 1.10 | 0.12 | 8.0 |
| 4181 | 56.91 | 0.01 | 12.0 | 1.60 | 1.63 | 0.99 | 0.96 | 0.96 | 0.045 | 1.55 | 13,3 | 40.1 | 42.3 | 0.31 | 1.21 | 0.12 | 8.0 |
| 4181 + 1/2 | 56.83 | 0.00 | 12.0 | 1.59 | 1.60 | 0.99 | 0.97 | 0.97 | 0.051 | 1.35 | 11,7 | 38.8 | 40.9 | 0.31 | 0.96 | 0.11 | 8.0 |
| 4182 | 56.75 | 0.00 | 11.5 | 1.60 | 1.58 | 1.01 | 0.99 | 0.99 | 0.055 | 1.99 | 14,4 | 37.5 | 39.7 | 0.31 | 1.08 | 0.10 | 8.0 |
| 4182 + 1/2 | 56.65 | 0.00 | 11.2 | 1.57 | 1.58 | 1.00 | 0.97 | 0.97 | 0.052 | 1.33 | 13,6 | 36.0 | 38.3 | 0.31 | 0.98 | 0.10 | 8.0 |
| 4183 | 56.56 | 0.00 | 10.9 | 1.58 | 1.57 | 1.00 | 0.98 | 0.98 | 0.060 | 1.41 | 6,1 | 34.4 | 36.7 | 0.31 | 1.23 | 0.09 | 8.0 |
| 4183 + 1/2 | 56.47 | 0.00 | 10.5 | 1.57 | 1.57 | 1.00 | 1.04 | 1.00 | 0.032 | 1.59 | 14,4 | 32.8 | 35.2 | 0.31 | 1.07 | 0.09 | 8.0 |
| 4184 | 56.38 | 0.00 | 10.0 | 1.56 | 1.56 | 1.00 | 1.02 | 1.00 | 0.038 | 1.59 | 14,4 | 31.1 | 33.4 | 0.31 | 1.18 | 0.08 | 8.0 |
| 4184 + 1/2 | 56.29 | 0.00 | 9.6 | 1.56 | 1.55 | 1.01 | 1.04 | 1.01 | 0.028 | 1.56 | 14,0 | 29.4 | 31.6 | 0.31 | 1.10 | 0.07 | 8.0 |
| 4185 | 56.22 | 0.00 | 9.0 | 1.53 | 1.54 | 0.99 | 1.00 | 0.99 | 0.047 | 1.42 | 0,2 | 27.7 | 29.9 | 0.31 | 0.99 | 0.07 | 8.0 |
| 4185 + 1/2 | 56.14 | 0.00 | 8.8 | 1.51 | 1.53 | 0.99 | 0.98 | 0.98 | 0.042 | 1.36 | 10,2 | 25.8 | 27.9 | 0.32 | 1.13 | 0.06 | 8.0 |
| 4186 | 56.06 | 0.00 | 8.5 | 1.52 | 1.49 | 1.02 | 1.06 | 1.02 | 0.051 | 1.40 | 0,2 | 23.9 | 25.9 | 0.32 | 1.29 | 0.06 | 8.0 |
| 4186 + 1/2 | 55.99 | 0.00 | 8.2 | 1.48 | 1.48 | 0.99 | 0.94 | 0.94 | 0.061 | 1.33 | 15,3 | 21.9 | 23.9 | 0.33 | 0.80 | 0.05 | 8.0 |
| 4187 | 55.92 | 0.00 | 7.9 | 1.46 | 1.45 | 1.01 | 0.99 | 0.99 | 0.044 | 1.30 | 15,3 | 20.0 | 22.0 | 0.33 | 0.62 | 0.04 | 8.0 |
| 4187 + 1/2 | 55.84 | 0.00 | 7.5 | 1.42 | 1.42 | 1.00 | 0.99 | 0.99 | 0.035 | 1.37 | 14,5 | 18.1 | 19.9 | 0.33 | 0.33 | 0.24 | 8.2 |
| 4188 | 55.76 | 0.00 | 7.2 | 1.38 | 1.38 | 1.00 | 0.97 | 0.97 | 0.030 | 1.45 | 0,8 | 16.2 | 18.0 | 0.33 | 0.31 | 0.25 | 8.3 |
| 4188 + 1/2 | 55.70 | 0.00 | 6.7 | 1.35 | 1.35 | 0.99 | 0.98 | 0.98 | 0.031 | 1.48 | 14,5 | 14.4 | 16.2 | 0.33 | 0.33 | 0.25 | 8.2 |
| 4189 | 55.63 | 0.00 | 6.4 | 1.30 | 1.33 | 0.98 | 0.99 | 0.98 | 0.017 | 1.50 | 13,5 | 12.6 | 14.5 | 0.32 | 0.36 | 0.25 | 8.2 |
| 4189 + 1/2 | 55.57 | 0.00 | 6.0 | 1.29 | 1.32 | 0.98 | 0.94 | 0.94 | 0.033 | 1.45 | 13,5 | 10.8 | 12.8 | 0.33 | 0.36 | 0.25 | 8.2 |
| 4190 | 55.51 | 0.00 | 6.0 | 1.32 | 1.31 | 1.01 | 1.03 | 1.01 | 0.009 | 1.63 | 4,2 | 9.1 | 11.2 | 0.33 | 0.36 | 0.25 | 8.2 |
| 4190 + 1/2 | 55.45 | 0.00 | 5.4 | 1.29 | 1.31 | 0.98 | 0.97 | 0.97 | 0.036 | 1.66 | 4,2 | 7.6 | 9.7 | 0.33 | 0.36 | 0.25 | 8.7 |
| 4191 | 55.41 | 0.00 | 5.2 | 1.32 | 1.29 | 1.02 | 1.03 | 1.02 | 0.011 | 1.65 | 10,3 | 6.2 | 8.2 | 0.35 | 0.34 | 0.27 | 8.3 |
| 4191 + 1/2 | 55.36 | 0.00 | 4.6 | 1.32 | 1.29 | 1.03 | 1.05 | 1.03 | 0.009 | 1.79 | 4,2 | 5.5 | 6.8 | 0.35 | 0.33 | 0.27 | 8.3 |
| 4192 | 55.32 | 0.00 | 4.4 | 1.29 | 1.28 | 1.01 | 1.03 | 1.01 | 0.010 | 1.70 | 10,3 | 5.9 | 6.8 | 0.35 | 0.32 | 0.27 | 8.7 |
| 4192 + 1/2 | 55.28 | 0.00 | 4.1 | 1.26 | 1.25 | 1.01 | 1.04 | 1.01 | 0.021 | 1.87 | 11,4 | 6.6 | 7.6 | 0.35 | 0.30 | 0.27 | 8.7 |
| 4193 | 55.24 | 0.00 | 3.9 | 1.22 | 1.21 | 1.01 | 1.04 | 1.01 | 0.004 | 1.96 | 14,0 | 7.3 | 8.3 | 0.36 | 0.31 | 0.27 | 8.8 |
| 4193 + 1/2 | 55.21 | 0.00 | 3.6 | 1.16 | 1.16 | 1.00 | 1.02 | 1.00 | 0.010 | 1.86 | 11,4 | 7.8 | 8.9 | 0.36 | 0.32 | 0.27 | 8.8 |
| 4194 | 55.19 | 0.00 | 3.4 | 1.09 | 1.08 | 1.01 | 1.00 | 1.00 | 0.031 | 1.78 | 15,1 | 8.2 | 9.3 | 0.36 | 0.32 | 0.27 | 8.4 |
| 4194 + 1/2 | 55.16 | 0.00 | 3.2 | 1.01 | 1.00 | 1.00 | 1.01 | 1.00 | 0.008 | 1.67 | 15,1 | 8.6 | 9.7 | 0.37 | 0.34 | 0.27 | 8.4 |
| 4195 | 55.14 | 0.00 | 3.1 | 0.91 | 0.91 | 1.01 | 1.01 | 1.01 | 0.022 | 1.56 | 15,1 | 8.9 | 9.8 | 0.37 | 0.35 | 0.27 | 8.0 |
| 4195 + 1/2 | 55.12 | 0.00 | 2.7 | 0.80 | 0.80 | 1.01 | 1.00 | 1.00 | 0.027 | 1.32 | 7,7 | 9.0 | 10.0 | 0.37 | 0.35 | 0.27 | 8.0 |
| 4196 | 55.11 | 0.00 | 2.6 | 0.68 | 0.73 | 0.94 | 0.94 | 0.94 | 0.012 | 1.34 | 6,8 | 9.2 | 10.2 | 0.37 | 0.37 | 0.27 | 8.0 |
| 4196 + 1/2 | 55.10 | 0.00 | 2.4 | 0.60 | 0.66 | 0.90 | 0.89 | 0.89 | 0.017 | 1.38 | 5,7 | 9.3 | 10.2 | 0.38 | 0.37 | 0.27 | 8.0 |
| 4197 | 55.09 | 0.00 | 2.2 | 0.54 | 0.65 | 0.83 | 0.83 | 0.83 | 0.006 | 1.36 | 2,5 | 9.2 | 10.1 | 0.38 | 0.35 | 0.27 | 8.0 |
| 4197 + 1/2 | 55.09 | 0.00 | 1.8 | 0.54 | 0.65 | 0.83 | 0.83 | 0.83 | 0.005 | 1.22 | 8,8 | 9.3 | 10.2 | 0.38 | 0.35 | 0.28 | 8.0 |
| 4198 | 55.10 | 0.00 | 1.8 | 0.57 | 0.65 | 0.88 | 0.87 | 0.87 | 0.011 | 1.12 | 5,7 | 9.3 | 10.1 | 0.37 | 0.35 | 0.28 | 8.0 |
| 4198 + 1/2 | 55.10 | 0.00 | 1.7 | 0.61 | 0.65 | 0.93 | 0.94 | 0.93 | 0.002 | 1.22 | 0,4 | 9.3 | 10.1 | 0.38 | 0.35 | 0.28 | 8.0 |
| 4199 last | 55.11 | 0.00 | 1.6 | 0.63 | 0.65 | 0.97 | 0.98 | 0.97 | 0.003 | 1.19 | 11,4 | 9.3 | 10.0 | 0.38 | 0.33 | 0.28 | 8.0 |
| 4199 + 1/2 | 55.12 | 0.00 | 1.6 | 0.64 | 0.65 | 0.99 | 0.99 | 0.99 | 0.003 | 1.10 | 15,8 | 9.2 | 9.9 | 0.36 | 0.32 | 0.28 | 8.0 |
| 4200 | 55.13 | 0.00 | 1.6 | 0.64 | 0.65 | 0.98 | 0.98 | 0.98 | 0.014 | 1.12 | 2,5 | 9.2 | 9.9 | 0.36 | 0.33 | 0.28 | 8.0 |
| 4200 + 1/2 | 55.14 | 0.00 | 1.6 | 0.64 | 0.65 | 0.99 | 0.99 | 0.99 | 0.007 | 1.12 | 4,6 | 9.2 | 9.8 | 0.36 | 0.32 | 0.28 | 8.0 |
| 4201 | 55.15 | 0.00 | 1.6 | 0.64 | 0.65 | 0.99 | 0.99 | 0.99 | 0.008 | 1.12 | 0,5 | 9.1 | 9.8 | 0.36 | 0.32 | 0.28 | 8.0 |
| 4201 + 1/2 | 55.16 | 0.00 | 1.5 | 0.65 | 0.65 | 1.00 | 1.00 | 1.00 | 0.003 | 1.19 | 9,7 | 9.2 | 9.8 | 0.36 | 0.31 | 0.28 | 8.4 |
| 4202 | 55.17 | 0.00 | 1.6 | 0.65 | 0.65 | 1.00 | 1.00 | 1.00 | 0.003 | 1.23 | 11,4 | 9.2 | 9.8 | 0.35 | 0.30 | 0.28 | 8.4 |
| 4202 + 1/2 | 55.18 | 0.00 | 1.6 | 0.65 | 0.65 | 1.00 | 1.00 | 1.00 | 0.018 | 1.21 | 0,5 | 9.2 | 9.8 | 0.35 | 0.29 | 0.28 | 8.3 |
| 4203 | 55.19 | 0.00 | 1.5 | 0.64 | 0.65 | 0.99 | 1.00 | 0.99 | 0.009 | 1.16 | 4,8 | 9.1 | 9.7 | 0.35 | 0.28 | 0.28 | 8.3 |
| 4203 + 1/2 | 55.20 | 0.00 | 1.6 | 0.65 | 0.65 | 1.00 | 1.00 | 1.00 | 0.015 | 1.18 | 10,7 | 9.0 | 9.5 | 0.36 | 0.28 | 0.29 | 8.3 |
| 4204 | 55.21 | 0.00 | 1.7 | 0.65 | 0.65 | 1.00 | 1.01 | 1.00 | 0.002 | 1.17 | 6,0 |  |  |  |  |  |  |
| 4204 + 1/2 | 55.22 | 0.00 | 1.6 | 0.65 | 0.65 | 1.00 | 1.00 | 1.00 | 0.015 | 1.27 | 6,0 |  |  |  |  |  |  |
| 4205 | 55.23 | 0.00 | 1.5 | 0.65 | 0.65 | 1.01 | 1.01 | 1.01 | 0.006 | 1.20 | 6,0 |  |  |  |  |  |  |
| 4205 + 1/2 | 55.24 | 0.00 | 1.6 | 0.65 | 0.65 | 1.01 | 1.01 | 1.01 | 0.013 | 1.15 | 1,5 |  |  |  |  |  |  |
| 4206 | 55.25 | 0.00 | 1.6 | 0.64 | 0.65 | 1.00 | 1.00 | 1.00 | 0.008 | 1.12 | 15,0 |  |  |  |  |  |  |
| 4206 + 1/2 | 55.26 | 0.00 | 1.5 | 0.64 | 0.65 | 0.99 | 0.99 | 0.99 | 0.017 | 1.19 | 9,7 |  |  |  |  |  |  |
| 4207 | 55.27 | 0.00 | 1.6 | 0.65 | 0.65 | 1.00 | 0.99 | 0.99 | 0.026 | 1.15 | 4,6 |  |  |  |  |  |  |
| 4207 + 1/2 | 55.29 | 0.00 | 1.6 | 0.65 | 0.65 | 1.00 | 0.99 | 0.99 | 0.018 | 1.14 | 0,8 |  |  |  |  |  |  |
| 4208 | 55.30 | 0.00 | 1.7 | 0.64 | 0.65 | 0.99 | 0.99 | 0.99 | 0.003 | 1.12 | 10,8 |  |  |  |  |  |  |
| 4208 + 1/2 | 55.31 | 0.00 | 1.6 | 0.65 | 0.65 | 1.00 | 1.00 | 1.00 | 0.011 | 1.19 | 9,8 |  |  |  |  |  |  |
| 4209 | 55.33 | 0.00 | 1.7 | 0.66 | 0.65 | 1.01 | 1.01 | 1.01 | 0.004 | 1.17 | 6,0 |  |  |  |  |  |  |
| 4209 + 1/2 | 55.34 | 0.00 | 1.6 | 0.66 | 0.65 | 1.01 | 0.99 | 0.99 | 0.047 | 1.30 | 9,8 |  |  |  |  |  |  |
| 4210 | 55.36 | 0.00 | 1.7 | 0.66 | 0.65 | 1.01 | 1.01 | 1.01 | 0.006 | 1.15 | 2,5 |  |  |  |  |  |  |
| 4210 + 1/2 | 55.37 | 0.00 | 1.8 | 0.65 | 0.65 | 1.00 | 1.01 | 1.00 | 0.004 | 1.15 | 6,0 |  |  |  |  |  |  |
| 4211 | 55.38 | 0.00 | 1.8 | 0.65 | 0.65 | 1.00 | 1.00 | 1.00 | 0.005 | 1.13 | 1,0 |  |  |  |  |  |  |
| 4211 + 1/2 | 55.40 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

### rise (uranus.rise, frames 4380 to 4454, window 4368 to 4466, 198 draft frames at rate 2)

Largest level step: 0.28 at frame 4466 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.18 from frame 4416 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 8.69 from frame 4466 to the next, block column 10 row 7 from the top left, shown, not judged.
Largest change in place: 86.9 from frame 4401 to 8 film frames later, most at pixel 1484, 568 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 1.60 from frame 4399 + 1/2 to 8 film frames later, most at pixel 1827, 619, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 4368 to 4379 + 1/2): change 14.0, pattern 0.20.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 4415 + 1/2 in /home/user/workspace/work/p6/sm54/03/uranus-rise-p1of2-pops.png, frame 4416 in /home/user/workspace/work/p6/sm54/03/uranus-rise-p1of2-pops.png, frame 4416 + 1/2 in /home/user/workspace/work/p6/sm54/03/uranus-rise-p1of2-pops.png, frame 4417 in /home/user/workspace/work/p6/sm54/03/uranus-rise-p1of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 4383 + 1/2 in /home/user/workspace/work/p6/sm54/03/uranus-rise-p1of2-changes.png, frame 4391 + 1/2 in /home/user/workspace/work/p6/sm54/03/uranus-rise-p1of2-changes.png, frame 4399 + 1/2 in /home/user/workspace/work/p6/sm54/03/uranus-rise-p1of2-changes.png, frame 4407 + 1/2 in /home/user/workspace/work/p6/sm54/03/uranus-rise-p1of2-changes.png.

- RED the pattern of the picture changes in place by 1.60 from frame 4399 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (81 frames over it, first 4385)

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4368 | 68.18 |  | 1.7 | 0.91 | 0.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 6,8 | 13.2 | 17.8 | 0.40 | 0.20 | 0.39 | 8.4 |
| 4368 + 1/2 | 68.21 | 0.00 | 1.7 | 0.91 | 0.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 1,6 | 13.3 | 18.0 | 0.40 | 0.20 | 0.39 | 8.4 |
| 4369 | 68.25 | 0.00 | 1.7 | 0.91 | 0.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 1,6 | 13.3 | 18.1 | 0.40 | 0.20 | 0.39 | 8.5 |
| 4369 + 1/2 | 68.29 | 0.00 | 1.6 | 0.90 | 0.91 | 0.99 | 0.99 | 0.99 | 0.000 | 1.17 | 1,6 | 13.4 | 18.2 | 0.40 | 0.20 | 0.39 | 8.5 |
| 4370 | 68.33 | 0.00 | 1.7 | 0.91 | 0.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 1,6 | 13.5 | 18.4 | 0.40 | 0.20 | 0.39 | 8.5 |
| 4370 + 1/2 | 68.37 | 0.00 | 1.6 | 0.92 | 0.91 | 1.01 | 1.01 | 1.01 | 0.000 | 1.23 | 6,1 | 13.7 | 18.5 | 0.40 | 0.20 | 0.39 | 8.5 |
| 4371 | 68.42 | 0.00 | 1.6 | 0.91 | 0.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 1,6 | 13.8 | 18.7 | 0.40 | 0.20 | 0.39 | 8.5 |
| 4371 + 1/2 | 68.46 | 0.00 | 1.7 | 0.91 | 0.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.29 | 5,8 | 14.0 | 18.6 | 0.40 | 0.19 | 0.39 | 8.5 |
| 4372 | 68.49 | 0.00 | 1.7 | 0.91 | 0.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.29 | 5,8 | 14.0 | 18.7 | 0.39 | 0.17 | 0.39 | 8.6 |
| 4372 + 1/2 | 68.52 | 0.00 | 1.6 | 0.92 | 0.91 | 1.01 | 1.01 | 1.01 | 0.000 | 1.27 | 5,8 | 14.2 | 19.1 | 0.39 | 0.16 | 0.39 | 8.6 |
| 4373 | 68.55 | 0.00 | 1.7 | 0.92 | 0.91 | 1.01 | 1.01 | 1.01 | 0.000 | 1.25 | 5,8 | 14.2 | 19.8 | 0.39 | 0.14 | 0.39 | 8.6 |
| 4373 + 1/2 | 68.57 | 0.00 | 1.7 | 0.91 | 0.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.23 | 5,8 | 14.3 | 21.1 | 0.39 | 0.14 | 0.39 | 8.6 |
| 4374 | 68.58 | 0.01 | 1.6 | 0.91 | 0.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 14,0 | 14.5 | 21.9 | 0.39 | 0.14 | 0.39 | 8.7 |
| 4374 + 1/2 | 68.59 | 0.00 | 1.6 | 0.92 | 0.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 5,8 | 14.2 | 19.3 | 0.39 | 0.14 | 0.39 | 8.4 |
| 4375 | 68.59 | 0.00 | 1.6 | 0.92 | 0.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 14,0 | 14.7 | 20.2 | 0.39 | 0.14 | 0.39 | 8.5 |
| 4375 + 1/2 | 68.58 | 0.00 | 1.7 | 0.92 | 0.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 1,7 | 15.4 | 19.9 | 0.39 | 0.15 | 0.38 | 8.5 |
| 4376 | 68.57 | 0.00 | 1.6 | 0.91 | 0.92 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 1,7 | 16.1 | 20.5 | 0.38 | 0.15 | 0.38 | 8.5 |
| 4376 + 1/2 | 68.55 | 0.00 | 1.6 | 0.91 | 0.92 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 1,7 | 16.9 | 20.5 | 0.38 | 0.15 | 0.38 | 8.6 |
| 4377 | 68.53 | 0.00 | 1.6 | 0.91 | 0.92 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 2,8 | 17.9 | 20.9 | 0.38 | 0.15 | 0.37 | 8.6 |
| 4377 + 1/2 | 68.50 | 0.00 | 1.6 | 0.91 | 0.92 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 11,0 | 19.0 | 21.4 | 0.37 | 0.16 | 0.37 | 8.7 |
| 4378 | 68.47 | 0.00 | 1.6 | 0.91 | 0.92 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 0,7 | 20.1 | 22.1 | 0.36 | 0.17 | 0.36 | 8.8 |
| 4378 + 1/2 | 68.45 | 0.00 | 1.6 | 0.92 | 0.92 | 1.00 | 1.00 | 1.00 | 0.000 | 1.27 | 0,7 | 21.5 | 23.3 | 0.36 | 0.18 | 0.36 | 8.9 |
| 4379 | 68.43 | 0.00 | 1.6 | 0.92 | 0.92 | 1.00 | 1.00 | 1.00 | 0.000 | 1.44 | 0,7 | 23.3 | 25.4 | 0.36 | 0.18 | 0.35 | 8.9 |
| 4379 + 1/2 | 68.41 | 0.00 | 1.6 | 0.90 | 0.92 | 0.98 | 0.98 | 0.98 | 0.001 | 1.41 | 0,7 | 25.4 | 27.7 | 0.35 | 0.19 | 0.35 | 9.0 |
| 4380 first | 68.39 | 0.00 | 1.6 | 0.92 | 0.94 | 0.98 | 0.98 | 0.98 | 0.000 | 1.46 | 0,7 | 27.7 | 30.2 | 0.35 | 0.20 | 0.35 | 9.1 |
| 4380 + 1/2 | 68.38 | 0.00 | 1.7 | 0.97 | 0.99 | 0.98 | 0.98 | 0.98 | 0.000 | 1.50 | 0,7 | 30.2 | 32.9 | 0.35 | 0.21 | 0.34 | 9.2 |
| 4381 | 68.38 | 0.00 | 1.8 | 1.06 | 1.07 | 0.99 | 0.99 | 0.99 | 0.000 | 1.48 | 0,7 | 32.8 | 35.7 | 0.34 | 0.22 | 0.34 | 9.3 |
| 4381 + 1/2 | 68.38 | 0.01 | 2.0 | 1.16 | 1.17 | 0.99 | 0.99 | 0.99 | 0.000 | 1.64 | 0,7 | 35.6 | 38.5 | 0.34 | 0.22 | 0.33 | 9.5 |
| 4382 | 68.39 | 0.01 | 2.2 | 1.29 | 1.29 | 1.00 | 1.00 | 1.00 | 0.002 | 1.89 | 7,1 | 38.2 | 41.2 | 0.34 | 0.23 | 0.33 | 9.6 |
| 4382 + 1/2 | 68.42 | 0.01 | 2.5 | 1.41 | 1.41 | 1.00 | 1.01 | 1.00 | 0.001 | 2.09 | 7,1 | 40.8 | 44.0 | 0.33 | 0.23 | 0.33 | 9.7 |
| 4383 | 68.47 | 0.01 | 2.9 | 1.52 | 1.50 | 1.01 | 1.02 | 1.01 | 0.005 | 2.00 | 7,1 | 43.3 | 46.5 | 0.33 | 0.26 | 0.20 | 8.0 |
| 4383 + 1/2 | 68.53 | 0.01 | 3.2 | 1.59 | 1.59 | 1.00 | 1.03 | 1.00 | 0.003 | 1.99 | 7,1 | 45.6 | 49.0 | 0.33 | 0.29 | 0.21 | 8.0 |
| 4384 | 68.62 | 0.01 | 3.5 | 1.65 | 1.65 | 1.00 | 1.05 | 1.00 | 0.003 | 2.00 | 7,1 | 47.8 | 51.4 | 0.33 | 0.29 | 0.21 | 8.0 |
| 4384 + 1/2 | 68.72 | 0.01 | 3.9 | 1.70 | 1.69 | 1.01 | 1.06 | 1.01 | 0.001 | 2.02 | 7,1 | 49.8 | 53.5 | 0.33 | 0.27 | 0.21 | 8.0 |
| 4385 | 68.84 | 0.02 | 4.2 | 1.73 | 1.73 | 1.00 | 1.07 | 1.00 | 0.004 | 1.81 | 8,1 | 51.6 | 55.4 | 0.33 | 0.52 | 0.20 | 8.0 |
| 4385 + 1/2 | 68.99 | 0.01 | 4.5 | 1.76 | 1.75 | 1.01 | 1.05 | 1.01 | 0.015 | 1.87 | 0,0 | 53.1 | 57.0 | 0.33 | 1.18 | 0.19 | 8.0 |
| 4386 | 69.17 | 0.01 | 4.8 | 1.77 | 1.76 | 1.00 | 1.04 | 1.00 | 0.013 | 1.96 | 0,0 | 54.7 | 58.5 | 0.34 | 1.31 | 0.16 | 8.0 |
| 4386 + 1/2 | 69.36 | 0.01 | 5.1 | 1.77 | 1.77 | 1.00 | 1.01 | 1.00 | 0.022 | 1.71 | 0,8 | 56.0 | 59.6 | 0.34 | 1.09 | 0.14 | 8.0 |
| 4387 | 69.56 | 0.01 | 5.3 | 1.78 | 1.77 | 1.01 | 0.93 | 0.93 | 0.052 | 1.80 | 0,0 | 57.1 | 60.7 | 0.34 | 1.07 | 0.12 | 8.0 |
| 4387 + 1/2 | 69.78 | 0.02 | 5.5 | 1.77 | 1.80 | 0.98 | 0.95 | 0.95 | 0.049 | 1.63 | 6,8 | 58.5 | 61.6 | 0.35 | 1.10 | 0.11 | 8.0 |
| 4388 | 70.04 | 0.01 | 5.8 | 1.83 | 1.80 | 1.02 | 0.96 | 0.96 | 0.050 | 1.77 | 6,8 | 59.9 | 62.4 | 0.35 | 1.08 | 0.10 | 8.0 |
| 4388 + 1/2 | 70.32 | 0.01 | 6.0 | 1.82 | 1.85 | 0.98 | 0.96 | 0.96 | 0.044 | 1.85 | 6,8 | 61.2 | 63.4 | 0.36 | 0.70 | 0.09 | 8.0 |
| 4389 | 70.62 | 0.00 | 6.1 | 1.87 | 1.85 | 1.01 | 0.97 | 0.97 | 0.056 | 1.90 | 5,8 | 62.2 | 64.2 | 0.36 | 0.98 | 0.08 | 8.0 |
| 4389 + 1/2 | 70.92 | 0.00 | 6.2 | 1.88 | 1.87 | 1.00 | 1.02 | 1.00 | 0.037 | 1.83 | 5,8 | 63.1 | 65.2 | 0.37 | 0.92 | 0.07 | 8.0 |
| 4390 | 71.23 | 0.00 | 6.5 | 1.91 | 1.88 | 1.02 | 0.99 | 0.99 | 0.055 | 1.79 | 5,8 | 63.8 | 65.8 | 0.37 | 0.84 | 0.07 | 8.0 |
| 4390 + 1/2 | 71.52 | 0.00 | 6.7 | 1.89 | 1.89 | 1.00 | 1.01 | 1.00 | 0.052 | 1.47 | 8,0 | 64.3 | 66.3 | 0.38 | 0.82 | 0.06 | 8.0 |
| 4391 | 71.81 | 0.01 | 6.8 | 1.87 | 1.90 | 0.99 | 0.98 | 0.98 | 0.069 | 1.83 | 15,5 | 64.6 | 66.9 | 0.39 | 1.03 | 0.05 | 8.0 |
| 4391 + 1/2 | 72.09 | 0.00 | 6.9 | 1.90 | 1.90 | 1.00 | 1.03 | 1.00 | 0.045 | 1.87 | 4,8 | 64.8 | 67.0 | 0.39 | 0.67 | 0.39 | 10.1 |
| 4392 | 72.37 | 0.00 | 7.2 | 1.93 | 1.89 | 1.02 | 1.04 | 1.02 | 0.041 | 2.03 | 4,8 | 65.4 | 68.3 | 0.40 | 0.84 | 0.05 | 8.0 |
| 4392 + 1/2 | 72.65 | 0.00 | 7.5 | 1.96 | 1.90 | 1.03 | 1.07 | 1.03 | 0.042 | 2.10 | 15,2 | 66.2 | 71.1 | 0.40 | 0.76 | 0.04 | 8.0 |
| 4393 | 72.93 | 0.01 | 7.7 | 1.97 | 1.90 | 1.04 | 1.08 | 1.04 | 0.046 | 2.28 | 15,2 | 67.4 | 73.8 | 0.41 | 0.68 | 0.40 | 9.7 |
| 4393 + 1/2 | 73.20 | 0.00 | 8.0 | 2.01 | 1.90 | 1.06 | 1.06 | 1.06 | 0.074 | 2.17 | 3,8 | 69.6 | 76.7 | 0.42 | 0.65 | 0.41 | 9.6 |
| 4394 | 73.46 | 0.00 | 8.2 | 1.96 | 1.90 | 1.04 | 1.06 | 1.04 | 0.073 | 1.91 | 12,1 | 72.0 | 79.5 | 0.42 | 0.62 | 0.41 | 9.5 |
| 4394 + 1/2 | 73.71 | 0.01 | 8.7 | 1.98 | 1.90 | 1.04 | 1.05 | 1.04 | 0.059 | 1.87 | 3,8 | 74.0 | 82.4 | 0.43 | 0.71 | 0.02 | 8.0 |
| 4395 | 73.95 | 0.01 | 9.0 | 2.04 | 1.90 | 1.08 | 1.06 | 1.06 | 0.071 | 2.18 | 12,1 | 76.0 | 84.9 | 0.44 | 0.69 | 0.03 | 8.0 |
| 4395 + 1/2 | 74.17 | 0.03 | 9.3 | 2.08 | 1.90 | 1.10 | 1.13 | 1.10 | 0.060 | 2.78 | 15,1 | 77.6 | 87.1 | 0.44 | 0.49 | 0.03 | 8.0 |
| 4396 | 74.33 | 0.00 | 9.8 | 2.08 | 1.90 | 1.10 | 0.98 | 0.98 | 0.105 | 2.60 | 10,0 | 79.1 | 89.0 | 0.45 | 0.75 | 0.03 | 8.0 |
| 4396 + 1/2 | 74.49 | 0.01 | 10.2 | 2.04 | 1.90 | 1.08 | 1.03 | 1.03 | 0.072 | 2.95 | 15,1 | 80.4 | 90.3 | 0.46 | 0.49 | 0.03 | 8.0 |
| 4397 | 74.62 | 0.01 | 10.7 | 2.01 | 1.90 | 1.06 | 1.05 | 1.05 | 0.088 | 3.00 | 15,1 | 81.7 | 91.3 | 0.46 | 0.29 | 0.03 | 8.0 |
| 4397 + 1/2 | 74.73 | 0.03 | 11.2 | 2.02 | 1.90 | 1.07 | 1.00 | 1.00 | 0.092 | 2.54 | 15,1 | 83.0 | 91.4 | 0.47 | 0.39 | 0.04 | 8.0 |
| 4398 | 74.79 | 0.02 | 11.5 | 1.99 | 1.90 | 1.05 | 1.01 | 1.01 | 0.103 | 2.62 | 15,0 | 83.9 | 91.6 | 0.48 | 0.67 | 0.05 | 8.0 |
| 4398 + 1/2 | 74.79 | 0.03 | 11.6 | 1.97 | 1.89 | 1.04 | 1.00 | 1.00 | 0.076 | 2.31 | 15,1 | 84.0 | 90.5 | 0.49 | 0.94 | 0.09 | 8.0 |
| 4399 | 74.73 | 0.04 | 12.1 | 1.90 | 1.89 | 1.01 | 1.01 | 1.01 | 0.068 | 2.75 | 15,1 | 84.5 | 89.1 | 0.51 | 0.84 | 0.11 | 8.0 |
| 4399 + 1/2 | 74.58 | 0.05 | 12.6 | 1.87 | 1.90 | 0.99 | 0.98 | 0.98 | 0.070 | 1.94 | 13,0 | 84.2 | 90.2 | 0.52 | 1.60 | 0.12 | 8.0 |
| 4400 | 74.32 | 0.03 | 12.8 | 1.86 | 1.89 | 0.99 | 1.01 | 0.99 | 0.046 | 5.03 | 15,1 | 85.3 | 91.9 | 0.53 | 1.27 | 0.13 | 8.0 |
| 4400 + 1/2 | 74.01 | 0.02 | 13.3 | 1.90 | 1.87 | 1.02 | 0.96 | 0.96 | 0.051 | 1.66 | 14,5 | 86.9 | 93.8 | 0.54 | 1.25 | 0.15 | 8.0 |
| 4401 | 73.65 | 0.04 | 13.7 | 1.88 | 1.85 | 1.02 | 0.98 | 0.98 | 0.042 | 3.64 | 15,1 | 86.9 | 93.9 | 0.54 | 1.21 | 0.15 | 8.0 |
| 4401 + 1/2 | 73.20 | 0.06 | 14.0 | 1.83 | 1.84 | 1.00 | 1.02 | 1.00 | 0.043 | 2.89 | 15,0 | 86.4 | 93.3 | 0.55 | 1.32 | 0.16 | 8.0 |
| 4402 | 72.64 | 0.09 | 14.4 | 1.82 | 1.82 | 1.00 | 1.01 | 1.00 | 0.046 | 2.28 | 14,5 | 85.9 | 92.0 | 0.56 | 1.49 | 0.15 | 8.0 |
| 4402 + 1/2 | 71.89 | 0.10 | 14.8 | 1.80 | 1.80 | 1.00 | 1.07 | 1.00 | 0.043 | 2.87 | 15,0 | 84.3 | 90.6 | 0.56 | 1.46 | 0.15 | 8.0 |
| 4403 | 70.96 | 0.06 | 15.0 | 1.77 | 1.78 | 1.00 | 0.99 | 0.99 | 0.073 | 2.29 | 2,6 | 81.8 | 88.8 | 0.57 | 1.26 | 0.16 | 8.0 |
| 4403 + 1/2 | 69.89 | 0.02 | 15.1 | 1.76 | 1.75 | 1.01 | 0.99 | 0.99 | 0.071 | 2.67 | 14,4 | 79.2 | 87.1 | 0.58 | 1.31 | 0.16 | 8.0 |
| 4404 | 68.80 | 0.03 | 15.3 | 1.72 | 1.73 | 0.99 | 1.02 | 0.99 | 0.052 | 3.34 | 14,4 | 76.8 | 84.9 | 0.59 | 1.34 | 0.16 | 8.0 |
| 4404 + 1/2 | 67.76 | 0.05 | 15.3 | 1.70 | 1.71 | 0.99 | 1.01 | 0.99 | 0.066 | 3.25 | 14,4 | 74.0 | 82.2 | 0.60 | 1.14 | 0.16 | 8.0 |
| 4405 | 66.82 | 0.08 | 15.8 | 1.71 | 1.71 | 1.00 | 0.98 | 0.98 | 0.114 | 3.45 | 14,4 | 71.3 | 79.1 | 0.60 | 0.94 | 0.16 | 8.0 |
| 4405 + 1/2 | 66.04 | 0.08 | 16.0 | 1.69 | 1.71 | 0.99 | 0.98 | 0.98 | 0.102 | 3.08 | 14,4 | 68.6 | 75.3 | 0.61 | 0.85 | 0.15 | 8.0 |
| 4406 | 65.43 | 0.05 | 16.1 | 1.66 | 1.71 | 0.97 | 0.93 | 0.93 | 0.134 | 3.54 | 12,3 | 65.7 | 71.6 | 0.62 | 1.13 | 0.15 | 8.0 |
| 4406 + 1/2 | 64.93 | 0.06 | 16.1 | 1.64 | 1.71 | 0.96 | 0.96 | 0.96 | 0.116 | 3.33 | 12,3 | 61.6 | 69.5 | 0.63 | 1.23 | 0.14 | 8.0 |
| 4407 | 64.55 | 0.07 | 16.3 | 1.62 | 1.71 | 0.94 | 0.97 | 0.94 | 0.100 | 3.47 | 13,3 | 58.7 | 68.4 | 0.64 | 1.23 | 0.14 | 8.0 |
| 4407 + 1/2 | 64.32 | 0.06 | 16.1 | 1.63 | 1.71 | 0.95 | 0.97 | 0.95 | 0.115 | 3.15 | 13,3 | 55.8 | 67.5 | 0.65 | 1.51 | 0.14 | 8.0 |
| 4408 | 64.20 | 0.07 | 16.5 | 1.63 | 1.71 | 0.95 | 0.97 | 0.95 | 0.101 | 2.53 | 13,3 | 54.4 | 64.7 | 0.66 | 1.40 | 0.14 | 8.0 |
| 4408 + 1/2 | 64.23 | 0.06 | 16.2 | 1.62 | 1.71 | 0.94 | 0.96 | 0.94 | 0.117 | 2.54 | 10,2 | 52.1 | 62.1 | 0.67 | 1.15 | 0.14 | 8.0 |
| 4409 | 64.39 | 0.07 | 16.6 | 1.63 | 1.71 | 0.95 | 0.96 | 0.95 | 0.129 | 2.83 | 11,2 | 49.8 | 59.8 | 0.68 | 1.27 | 0.13 | 8.0 |
| 4409 + 1/2 | 64.68 | 0.07 | 16.4 | 1.59 | 1.71 | 0.93 | 0.94 | 0.93 | 0.120 | 3.05 | 11,2 | 47.1 | 55.9 | 0.69 | 1.32 | 0.13 | 8.0 |
| 4410 | 65.11 | 0.07 | 16.3 | 1.60 | 1.71 | 0.93 | 0.94 | 0.93 | 0.133 | 2.82 | 11,2 | 46.4 | 52.9 | 0.70 | 1.32 | 0.13 | 8.0 |
| 4410 + 1/2 | 65.69 | 0.06 | 16.1 | 1.59 | 1.71 | 0.93 | 0.92 | 0.92 | 0.136 | 2.39 | 10,2 | 46.8 | 50.5 | 0.71 | 1.44 | 0.12 | 8.0 |
| 4411 | 66.40 | 0.09 | 16.3 | 1.58 | 1.71 | 0.92 | 0.93 | 0.92 | 0.137 | 2.10 | 11,1 | 47.5 | 52.3 | 0.72 | 1.30 | 0.11 | 8.0 |
| 4411 + 1/2 | 67.28 | 0.10 | 15.9 | 1.62 | 1.71 | 0.94 | 0.96 | 0.94 | 0.085 | 2.75 | 11,1 | 48.2 | 53.2 | 0.73 | 1.08 | 0.10 | 8.0 |
| 4412 | 68.36 | 0.07 | 16.5 | 1.62 | 1.71 | 0.95 | 0.96 | 0.95 | 0.104 | 2.49 | 11,1 | 48.1 | 53.5 | 0.74 | 0.87 | 0.09 | 8.0 |
| 4412 + 1/2 | 69.58 | 0.05 | 17.0 | 1.68 | 1.70 | 0.98 | 0.99 | 0.98 | 0.090 | 2.66 | 10,1 | 47.2 | 52.9 | 0.75 | 1.15 | 0.08 | 8.0 |
| 4413 | 70.91 | 0.05 | 17.5 | 1.72 | 1.69 | 1.02 | 1.01 | 1.01 | 0.094 | 2.56 | 10,1 | 46.0 | 51.5 | 0.75 | 0.76 | 0.08 | 8.0 |
| 4413 + 1/2 | 72.32 | 0.02 | 17.7 | 1.79 | 1.68 | 1.07 | 1.04 | 1.04 | 0.122 | 2.49 | 9,1 | 45.4 | 49.5 | 0.76 | 0.79 | 0.07 | 8.0 |
| 4414 | 73.78 | 0.12 | 18.6 | 1.82 | 1.67 | 1.09 | 1.08 | 1.08 | 0.097 | 2.57 | 12,8 | 44.5 | 47.1 | 0.77 | 0.93 | 0.07 | 8.0 |
| 4414 + 1/2 | 75.00 | 0.14 | 17.6 | 1.85 | 1.67 | 1.11 | 1.13 | 1.11 | 0.084 | 2.71 | 12,8 | 43.3 | 45.3 | 0.78 | 0.95 | 0.75 | 8.0 |
| 4415 | 75.93 | 0.06 | 17.3 | 1.94 | 1.67 | 1.16 | 1.18 | 1.16 | 0.068 | 2.77 | 11,0 | 42.1 | 44.7 | 0.79 | 0.88 | 0.76 | 8.0 |
| 4415 + 1/2 | 76.97 | 0.03 | 17.3 | 1.97 | 1.67 | 1.18 | 1.22 | 1.18 | 0.065 | 3.29 | 10,0 | 40.8 | 43.5 | 0.80 | 0.95 | 0.77 | 8.0 |
| 4416 | 78.08 | 0.04 | 17.2 | 1.97 | 1.67 | 1.18 | 1.25 | 1.18 | 0.047 | 3.03 | 10,0 | 39.2 | 41.2 | 0.81 | 0.88 | 0.78 | 8.0 |
| 4416 + 1/2 | 79.26 | 0.01 | 17.4 | 1.96 | 1.67 | 1.17 | 1.24 | 1.17 | 0.064 | 2.77 | 9,0 | 37.2 | 38.7 | 0.82 | 0.92 | 0.06 | 8.0 |
| 4417 | 80.44 | 0.04 | 17.3 | 1.95 | 1.67 | 1.17 | 1.23 | 1.17 | 0.067 | 2.89 | 8,0 | 34.8 | 36.0 | 0.82 | 0.50 | 0.05 | 8.0 |
| 4417 + 1/2 | 81.71 | 0.00 | 17.1 | 1.92 | 1.67 | 1.15 | 1.22 | 1.15 | 0.056 | 2.54 | 8,0 | 32.2 | 34.1 | 0.83 | 0.56 | 0.05 | 8.0 |
| 4418 | 82.97 | 0.02 | 16.7 | 1.89 | 1.67 | 1.13 | 1.17 | 1.13 | 0.087 | 2.34 | 8,0 | 29.5 | 30.5 | 0.83 | 0.36 | 0.05 | 8.0 |
| 4418 + 1/2 | 84.28 | 0.01 | 17.3 | 1.84 | 1.67 | 1.10 | 1.14 | 1.10 | 0.082 | 2.22 | 8,0 | 26.7 | 27.9 | 0.83 | 0.42 | 0.04 | 8.0 |
| 4419 | 85.61 | 0.01 | 17.9 | 1.79 | 1.67 | 1.07 | 1.09 | 1.07 | 0.089 | 1.87 | 8,0 | 24.6 | 25.9 | 0.83 | 0.39 | 0.04 | 8.0 |
| 4419 + 1/2 | 86.97 | 0.02 | 18.1 | 1.76 | 1.67 | 1.05 | 1.09 | 1.05 | 0.061 | 1.61 | 12,1 | 22.5 | 23.8 | 0.83 | 0.62 | 0.04 | 8.0 |
| 4420 | 88.28 | 0.06 | 18.1 | 1.72 | 1.67 | 1.03 | 1.04 | 1.03 | 0.081 | 1.68 | 12,1 | 20.4 | 21.8 | 0.83 | 0.55 | 0.03 | 8.0 |
| 4420 + 1/2 | 89.47 | 0.07 | 18.2 | 1.70 | 1.67 | 1.02 | 1.01 | 1.01 | 0.081 | 1.66 | 12,1 | 18.3 | 21.3 | 0.83 | 0.84 | 0.04 | 8.0 |
| 4421 | 90.53 | 0.04 | 18.0 | 1.66 | 1.64 | 1.01 | 1.03 | 1.01 | 0.084 | 1.61 | 12,1 | 16.2 | 25.3 | 0.83 | 0.84 | 0.04 | 8.0 |
| 4421 + 1/2 | 91.50 | 0.05 | 18.7 | 1.58 | 1.61 | 0.98 | 0.94 | 0.94 | 0.126 | 1.83 | 13,8 | 14.7 | 25.9 | 0.83 | 0.67 | 0.04 | 8.0 |
| 4422 | 92.39 | 0.06 | 18.2 | 1.56 | 1.61 | 0.97 | 1.03 | 0.97 | 0.071 | 2.35 | 13,8 | 14.6 | 25.1 | 0.83 | 0.445 | 0.04 | 8.0 |
| 4422 + 1/2 | 93.15 | 0.05 | 18.5 | 1.51 | 1.61 | 0.94 | 0.90 | 0.90 | 0.119 | 2.75 | 13,8 | 14.9 | 25.0 | 0.83 | 0.71 | 0.04 | 8.0 |
| 4423 | 93.82 | 0.07 | 19.0 | 1.45 | 1.61 | 0.90 | 0.90 | 0.90 | 0.078 | 2.37 | 13,8 | 15.3 | 24.0 | 0.83 | 0.52 | 0.03 | 8.0 |
| 4423 + 1/2 | 94.35 | 0.05 | 19.2 | 1.41 | 1.61 | 0.87 | 0.81 | 0.81 | 0.115 | 2.53 | 12,8 | 15.5 | 23.3 | 0.83 | 0.47 | 0.03 | 8.0 |
| 4424 | 94.79 | 0.03 | 19.1 | 1.36 | 1.61 | 0.84 | 0.85 | 0.84 | 0.069 | 2.76 | 12,8 | 15.6 | 23.0 | 0.82 | 0.58 | 0.03 | 8.0 |
| 4424 + 1/2 | 95.17 | 0.01 | 19.8 | 1.31 | 1.61 | 0.81 | 0.76 | 0.76 | 0.090 | 2.55 | 12,8 | 15.7 | 24.7 | 0.82 | 0.63 | 0.03 | 8.0 |
| 4425 | 95.58 | 0.01 | 19.8 | 1.29 | 1.61 | 0.80 | 0.83 | 0.80 | 0.047 | 3.01 | 12,7 | 15.4 | 25.4 | 0.82 | 0.69 | 0.03 | 8.0 |
| 4425 + 1/2 | 95.95 | 0.02 | 19.9 | 1.30 | 1.61 | 0.81 | 0.82 | 0.81 | 0.056 | 3.19 | 12,7 | 14.6 | 25.3 | 0.82 | 0.69 | 0.04 | 8.0 |
| 4426 | 96.28 | 0.03 | 20.0 | 1.32 | 1.61 | 0.82 | 0.81 | 0.81 | 0.061 | 3.01 | 12,7 | 13.8 | 24.9 | 0.82 | 0.65 | 0.03 | 8.0 |
| 4426 + 1/2 | 96.55 | 0.04 | 20.1 | 1.35 | 1.61 | 0.84 | 0.81 | 0.81 | 0.071 | 2.65 | 12,7 | 13.0 | 24.0 | 0.82 | 0.55 | 0.03 | 8.0 |
| 4427 | 96.73 | 0.05 | 20.0 | 1.36 | 1.61 | 0.85 | 0.85 | 0.85 | 0.053 | 2.14 | 12,7 | 12.2 | 22.0 | 0.81 | 0.49 | 0.03 | 8.0 |
| 4427 + 1/2 | 96.80 | 0.04 | 20.3 | 1.35 | 1.61 | 0.84 | 0.87 | 0.84 | 0.043 | 2.18 | 11,5 | 12.0 | 18.9 | 0.81 | 0.55 | 0.03 | 8.0 |
| 4428 | 96.81 | 0.02 | 21.2 | 1.35 | 1.61 | 0.84 | 0.85 | 0.84 | 0.052 | 2.96 | 11,6 | 11.8 | 17.3 | 0.81 | 0.48 | 0.03 | 8.0 |
| 4428 + 1/2 | 96.78 | 0.02 | 21.6 | 1.38 | 1.61 | 0.86 | 0.89 | 0.86 | 0.035 | 3.26 | 11,6 | 11.2 | 15.3 | 0.80 | 0.29 | 0.80 | 9.3 |
| 4429 | 96.80 | 0.05 | 21.9 | 1.41 | 1.61 | 0.88 | 0.89 | 0.88 | 0.039 | 2.98 | 11,6 | 10.7 | 13.2 | 0.80 | 0.27 | 0.80 | 8.0 |
| 4429 + 1/2 | 96.92 | 0.01 | 22.1 | 1.52 | 1.61 | 0.94 | 0.89 | 0.89 | 0.058 | 2.88 | 2,8 | 10.1 | 13.8 | 0.79 | 0.20 | 0.79 | 8.9 |
| 4430 | 97.02 | 0.01 | 22.7 | 1.64 | 1.63 | 1.01 | 1.00 | 1.00 | 0.036 | 3.42 | 2,8 | 9.5 | 16.0 | 0.79 | 0.17 | 0.79 | 8.7 |
| 4430 + 1/2 | 97.13 | 0.10 | 23.0 | 1.75 | 1.66 | 1.05 | 1.05 | 1.05 | 0.036 | 2.85 | 2,8 | 9.5 | 21.1 | 0.78 | 0.14 | 0.78 | 8.6 |
| 4431 | 97.04 | 0.08 | 23.1 | 1.77 | 1.70 | 1.04 | 1.08 | 1.04 | 0.038 | 2.55 | 2,7 | 9.1 | 19.6 | 0.77 | 0.14 | 0.77 | 8.0 |
| 4431 + 1/2 | 96.80 | 0.11 | 23.2 | 1.81 | 1.70 | 1.06 | 1.09 | 1.06 | 0.036 | 2.51 | 2,7 | 8.6 | 14.0 | 0.76 | 0.14 | 0.76 | 8.0 |
| 4432 | 96.34 | 0.15 | 23.3 | 1.79 | 1.71 | 1.05 | 1.13 | 1.05 | 0.033 | 2.89 | 2,3 | 8.4 | 13.7 | 0.75 | 0.12 | 0.74 | 8.0 |
| 4432 + 1/2 | 95.60 | 0.21 | 23.3 | 1.79 | 1.72 | 1.04 | 1.14 | 1.04 | 0.038 | 2.36 | 2,3 | 7.9 | 12.9 | 0.74 | 0.11 | 0.72 | 8.0 |
| 4433 | 94.44 | 0.22 | 23.2 | 1.75 | 1.73 | 1.01 | 1.14 | 1.01 | 0.040 | 2.23 | 1,2 | 7.6 | 12.3 | 0.71 | 0.11 | 0.70 | 8.0 |
| 4433 + 1/2 | 92.84 | 0.19 | 22.9 | 1.74 | 1.74 | 1.00 | 1.09 | 1.00 | 0.055 | 2.73 | 1,2 | 7.3 | 11.9 | 0.69 | 0.13 | 0.67 | 8.0 |
| 4434 | 90.85 | 0.04 | 22.6 | 1.76 | 1.74 | 1.02 | 1.10 | 1.02 | 0.060 | 2.85 | 15,3 | 7.0 | 11.3 | 0.66 | 0.14 | 0.65 | 8.0 |
| 4434 + 1/2 | 88.78 | 0.09 | 22.2 | 1.74 | 1.74 | 1.00 | 1.08 | 1.00 | 0.070 | 3.02 | 15,3 | 6.9 | 10.8 | 0.63 | 0.18 | 0.62 | 8.0 |
| 4435 | 86.52 | 0.09 | 22.0 | 1.69 | 1.74 | 0.97 | 1.06 | 0.97 | 0.076 | 2.89 | 0,2 | 6.7 | 10.1 | 0.60 | 0.23 | 0.59 | 8.0 |
| 4435 + 1/2 | 84.08 | 0.01 | 21.9 | 1.70 | 1.74 | 0.98 | 1.06 | 0.98 | 0.074 | 3.30 | 0,2 | 6.6 | 9.6 | 0.58 | 0.27 | 0.57 | 8.0 |
| 4436 | 81.62 | 0.02 | 21.2 | 1.71 | 1.74 | 0.98 | 1.01 | 0.98 | 0.094 | 3.01 | 15,4 | 6.4 | 8.9 | 0.55 | 0.31 | 0.54 | 8.0 |
| 4436 + 1/2 | 79.11 | 0.03 | 20.8 | 1.71 | 1.74 | 0.98 | 0.97 | 0.97 | 0.111 | 3.14 | 15,5 | 6.3 | 8.9 | 0.53 | 0.32 | 0.52 | 8.0 |
| 4437 | 76.66 | 0.01 | 20.8 | 1.73 | 1.74 | 1.00 | 1.05 | 1.00 | 0.081 | 4.65 | 15,5 | 6.3 | 8.4 | 0.50 | 0.30 | 0.49 | 8.0 |
| 4437 + 1/2 | 74.22 | 0.02 | 20.2 | 1.73 | 1.74 | 1.00 | 1.01 | 1.00 | 0.098 | 5.10 | 15,5 | 6.2 | 7.9 | 0.48 | 0.29 | 0.47 | 8.0 |
| 4438 | 71.83 | 0.02 | 19.9 | 1.75 | 1.74 | 1.01 | 0.92 | 0.92 | 0.143 | 3.26 | 15,5 | 6.1 | 7.6 | 0.45 | 0.28 | 0.45 | 8.0 |
| 4438 + 1/2 | 69.41 | 0.04 | 19.3 | 1.76 | 1.74 | 1.01 | 0.95 | 0.95 | 0.124 | 3.36 | 15,5 | 6.1 | 7.3 | 0.43 | 0.26 | 0.43 | 8.0 |
| 4439 | 67.05 | 0.05 | 19.1 | 1.75 | 1.74 | 1.01 | 0.93 | 0.93 | 0.127 | 3.12 | 15,5 | 6.2 | 8.2 | 0.41 | 0.23 | 0.41 | 8.0 |
| 4439 + 1/2 | 64.79 | 0.05 | 18.6 | 1.78 | 1.73 | 1.03 | 0.95 | 0.95 | 0.128 | 3.17 | 15,7 | 6.3 | 9.4 | 0.39 | 0.21 | 0.39 | 8.0 |
| 4440 | 62.63 | 0.03 | 18.1 | 1.79 | 1.72 | 1.04 | 0.96 | 0.96 | 0.130 | 3.49 | 15,5 | 6.4 | 10.1 | 0.37 | 0.18 | 0.37 | 8.0 |
| 4440 + 1/2 | 60.52 | 0.04 | 17.5 | 1.76 | 1.72 | 1.03 | 0.96 | 0.96 | 0.114 | 2.87 | 15,5 | 6.6 | 11.1 | 0.35 | 0.15 | 0.35 | 8.0 |
| 4441 | 58.50 | 0.05 | 17.0 | 1.79 | 1.71 | 1.04 | 0.97 | 0.97 | 0.111 | 2.81 | 15,5 | 6.5 | 11.7 | 0.33 | 0.13 | 0.33 | 8.0 |
| 4441 + 1/2 | 56.58 | 0.06 | 16.8 | 1.76 | 1.71 | 1.03 | 0.99 | 0.99 | 0.101 | 2.61 | 13,3 | 6.6 | 12.2 | 0.32 | 0.09 | 0.31 | 8.0 |
| 4442 | 54.78 | 0.04 | 16.1 | 1.75 | 1.71 | 1.02 | 0.97 | 0.97 | 0.111 | 2.56 | 13,3 | 6.5 | 12.0 | 0.30 | 0.07 | 0.30 | 8.0 |
| 4442 + 1/2 | 53.06 | 0.04 | 15.6 | 1.71 | 1.70 | 1.01 | 0.97 | 0.97 | 0.098 | 2.00 | 13,3 | 6.6 | 11.9 | 0.29 | 0.05 | 0.28 | 8.0 |
| 4443 | 51.41 | 0.04 | 14.9 | 1.72 | 1.70 | 1.01 | 0.99 | 0.99 | 0.090 | 2.02 | 13,3 | 6.5 | 12.2 | 0.27 | 0.03 | 0.27 | 8.0 |
| 4443 + 1/2 | 49.83 | 0.03 | 14.6 | 1.70 | 1.69 | 1.01 | 1.12 | 1.01 | 0.046 | 2.52 | 15,1 | 6.6 | 14.3 | 0.26 | 0.03 | 0.25 | 8.0 |
| 4444 | 48.31 | 0.05 | 14.2 | 1.67 | 1.67 | 1.00 | 1.03 | 1.00 | 0.066 | 2.23 | 11,1 | 6.5 | 14.7 | 0.24 | 0.02 | 0.24 | 8.0 |
| 4444 + 1/2 | 46.89 | 0.04 | 13.5 | 1.65 | 1.65 | 1.00 | 1.02 | 1.00 | 0.063 | 2.07 | 5,7 | 6.4 | 14.9 | 0.23 | 0.02 | 0.23 | 8.0 |
| 4445 | 45.53 | 0.04 | 13.0 | 1.62 | 1.63 | 1.00 | 0.96 | 0.96 | 0.073 | 2.04 | 7,8 | 6.2 | 13.8 | 0.22 | 0.02 | 0.22 | 8.0 |
| 4445 + 1/2 | 44.26 | 0.04 | 12.4 | 1.61 | 1.62 | 1.00 | 1.01 | 1.00 | 0.056 | 2.22 | 14,1 | 6.2 | 14.2 | 0.21 | 0.02 | 0.21 | 8.0 |
| 4446 | 43.06 | 0.03 | 11.8 | 1.61 | 1.61 | 1.00 | 1.03 | 1.00 | 0.048 | 1.96 | 14,1 | 6.0 | 13.1 | 0.20 | 0.02 | 0.20 | 8.0 |
| 4446 + 1/2 | 41.92 | 0.03 | 11.4 | 1.61 | 1.61 | 1.00 | 1.07 | 1.00 | 0.039 | 1.91 | 5,7 | 5.9 | 12.4 | 0.19 | 0.02 | 0.19 | 8.0 |
| 4447 | 40.84 | 0.03 | 10.6 | 1.61 | 1.61 | 1.00 | 1.05 | 1.00 | 0.046 | 1.62 | 14,1 | 5.7 | 11.4 | 0.18 | 0.02 | 0.18 | 8.0 |
| 4447 + 1/2 | 39.82 | 0.03 | 10.0 | 1.60 | 1.58 | 1.02 | 1.09 | 1.02 | 0.033 | 1.67 | 15,2 | 5.5 | 10.0 | 0.18 | 0.02 | 0.17 | 8.0 |
| 4448 | 38.86 | 0.03 | 9.3 | 1.55 | 1.55 | 1.00 | 1.00 | 1.00 | 0.055 | 2.04 | 13,1 | 5.3 | 9.0 | 0.17 | 0.03 | 0.17 | 8.0 |
| 4448 + 1/2 | 37.95 | 0.02 | 8.5 | 1.48 | 1.53 | 0.97 | 1.01 | 0.97 | 0.031 | 2.11 | 13,1 | 5.1 | 7.6 | 0.16 | 0.02 | 0.16 | 8.0 |
| 4449 | 37.10 | 0.03 | 7.8 | 1.47 | 1.49 | 0.98 | 1.00 | 0.98 | 0.022 | 1.73 | 13,1 | 4.9 | 6.2 | 0.16 | 0.03 | 0.15 | 8.0 |
| 4449 + 1/2 | 36.29 | 0.03 | 7.1 | 1.48 | 1.48 | 1.00 | 1.02 | 1.00 | 0.024 | 2.03 | 13,1 | 4.8 | 5.5 | 0.15 | 0.05 | 0.15 | 8.0 |
| 4450 | 35.54 | 0.02 | 6.3 | 1.48 | 1.47 | 1.00 | 1.04 | 1.00 | 0.023 | 1.85 | 13,1 | 4.9 | 5.5 | 0.15 | 0.08 | 0.14 | 8.0 |
| 4450 + 1/2 | 34.84 | 0.02 | 5.6 | 1.50 | 1.46 | 1.03 | 1.07 | 1.03 | 0.010 | 1.91 | 13,1 | 5.0 | 5.5 | 0.14 | 0.16 | 0.14 | 8.0 |
| 4451 | 34.19 | 0.02 | 4.9 | 1.45 | 1.45 | 1.00 | 1.04 | 1.00 | 0.008 | 1.92 | 13,2 | 4.3 | 4.7 | 0.14 | 0.13 | 0.13 | 8.0 |
| 4451 + 1/2 | 33.57 | 0.02 | 4.0 | 1.36 | 1.44 | 0.95 | 0.98 | 0.95 | 0.008 | 2.23 | 13,2 | 4.0 | 5.0 | 0.13 | 0.12 | 0.13 | 8.0 |
| 4452 | 32.99 | 0.02 | 3.3 | 1.39 | 1.40 | 1.00 | 1.01 | 1.00 | 0.011 | 2.12 | 13,2 | 4.0 | 5.0 | 0.13 | 0.15 | 0.13 | 8.0 |
| 4452 + 1/2 | 32.46 | 0.02 | 2.4 | 1.43 | 1.33 | 1.07 | 1.08 | 1.07 | 0.008 | 2.30 | 2,8 | 3.6 | 4.6 | 0.12 | 0.12 | 0.12 | 8.0 |
| 4453 | 31.96 | 0.01 | 1.8 | 1.29 | 1.22 | 1.06 | 1.06 | 1.06 | 0.010 | 1.98 | 1,7 | 4.0 | 4.9 | 0.12 | 0.14 | 0.12 | 8.0 |
| 4453 + 1/2 | 31.50 | 0.02 | 1.3 | 1.07 | 1.10 | 0.98 | 0.99 | 0.98 | 0.006 | 1.74 | 1,7 | 3.8 | 5.2 | 0.12 | 0.11 | 0.11 | 8.0 |
| 4454 last | 31.07 | 0.02 | 1.1 | 0.90 | 0.99 | 0.91 | 0.96 | 0.91 | 0.005 | 1.38 | 7,1 | 4.4 | 4.8 | 0.11 | 0.13 | 0.11 | 8.0 |
| 4454 + 1/2 | 30.69 | 0.02 | 0.9 | 0.80 | 0.92 | 0.86 | 0.96 | 0.86 | 0.000 | 1.37 | 12,2 | 4.2 | 4.5 | 0.11 | 0.10 | 0.11 | 8.0 |
| 4455 | 30.33 | 0.02 | 0.8 | 0.75 | 0.92 | 0.81 | 0.96 | 0.81 | 0.001 | 1.21 | 6,6 | 4.9 | 5.1 | 0.11 | 0.12 | 0.11 | 8.0 |
| 4455 + 1/2 | 30.02 | 0.01 | 0.7 | 0.74 | 0.92 | 0.80 | 0.94 | 0.80 | 0.000 | 1.32 | 7,2 | 5.3 | 6.1 | 0.11 | 0.09 | 0.10 | 8.0 |
| 4456 | 29.73 | 0.01 | 0.7 | 0.74 | 0.90 | 0.83 | 0.96 | 0.83 | 0.000 | 1.46 | 7,2 | 6.1 | 7.3 | 0.10 | 0.10 | 0.10 | 8.0 |
| 4456 + 1/2 | 29.46 | 0.01 | 0.6 | 0.72 | 0.89 | 0.82 | 0.94 | 0.82 | 0.000 | 1.57 | 7,2 | 6.8 | 7.9 | 0.10 | 0.07 | 0.10 | 8.0 |
| 4457 | 29.21 | 0.01 | 0.6 | 0.71 | 0.88 | 0.81 | 0.93 | 0.81 | 0.002 | 1.67 | 7,2 |  |  | 0.09 | 0.06 | 0.09 | 8.1 |
| 4457 + 1/2 | 28.98 | 0.01 | 0.6 | 0.68 | 0.87 | 0.78 | 0.90 | 0.78 | 0.000 | 1.46 | 7,2 |  |  | 0.08 | 0.07 | 0.08 | 8.3 |
| 4458 | 28.77 | 0.01 | 0.8 | 0.70 | 0.85 | 0.82 | 0.93 | 0.82 | 0.001 | 1.61 | 6,4 |  |  | 0.07 | 0.22 | 0.06 | 8.0 |
| 4458 + 1/2 | 28.57 | 0.01 | 1.5 | 0.74 | 0.83 | 0.89 | 0.97 | 0.89 | 0.005 | 1.84 | 7,2 |  |  | 0.05 | 0.10 | 0.05 | 8.0 |
| 4459 | 28.39 | 0.01 | 2.3 | 0.77 | 0.83 | 0.92 | 1.01 | 0.92 | 0.004 | 2.11 | 6,4 |  |  |  |  |  |  |
| 4459 + 1/2 | 28.22 | 0.01 | 3.3 | 0.81 | 0.83 | 0.97 | 1.03 | 0.97 | 0.015 | 2.21 | 12,2 |  |  |  |  |  |  |
| 4460 | 28.07 | 0.01 | 4.9 | 0.81 | 0.83 | 0.97 | 0.94 | 0.94 | 0.036 | 2.27 | 6,3 |  |  |  |  |  |  |
| 4460 + 1/2 | 27.92 | 0.01 | 6.5 | 0.86 | 0.82 | 1.04 | 0.93 | 0.93 | 0.059 | 3.36 | 6,4 |  |  |  |  |  |  |
| 4461 | 27.80 | 0.00 | 8.6 | 0.84 | 0.82 | 1.02 | 0.96 | 0.96 | 0.049 | 5.30 | 13,2 |  |  |  |  |  |  |
| 4461 + 1/2 | 27.67 | 0.00 | 9.9 | 0.91 | 0.82 | 1.10 | 1.00 | 1.00 | 0.057 | 4.64 | 6,4 |  |  |  |  |  |  |
| 4462 | 27.56 | 0.01 | 11.8 | 0.88 | 0.82 | 1.07 | 0.94 | 0.94 | 0.066 | 8.63 | 13,3 |  |  |  |  |  |  |
| 4462 + 1/2 | 27.41 | 0.01 | 14.8 | 0.94 | 0.82 | 1.14 | 1.02 | 1.02 | 0.119 | 5.88 | 13,3 |  |  |  |  |  |  |
| 4463 | 27.26 | 0.01 | 18.9 | 0.98 | 0.83 | 1.17 | 1.03 | 1.03 | 0.097 | 5.34 | 14,3 |  |  |  |  |  |  |
| 4463 + 1/2 | 27.12 | 0.00 | 20.1 | 0.95 | 0.85 | 1.11 | 1.12 | 1.11 | 0.053 | 5.67 | 12,8 |  |  |  |  |  |  |
| 4464 | 26.99 | 0.01 | 20.2 | 0.88 | 0.87 | 1.01 | 1.03 | 1.01 | 0.043 | 6.77 | 7,4 |  |  |  |  |  |  |
| 4464 + 1/2 | 26.88 | 0.00 | 18.5 | 0.79 | 0.88 | 0.90 | 0.93 | 0.90 | 0.033 | 5.16 | 8,6 |  |  |  |  |  |  |
| 4465 | 26.78 | 0.05 | 16.7 | 0.79 | 0.89 | 0.88 | 0.91 | 0.88 | 0.037 | 5.93 | 9,7 |  |  |  |  |  |  |
| 4465 + 1/2 | 26.58 | 0.25 | 14.9 | 0.83 | 0.92 | 0.90 | 0.92 | 0.90 | 0.039 | 6.25 | 10,7 |  |  |  |  |  |  |
| 4466 | 25.88 | 0.28 | 12.4 | 0.82 | 0.94 | 0.86 | 0.93 | 0.86 | 0.028 | 8.69 | 10,7 |  |  |  |  |  |  |
| 4466 + 1/2 | 24.62 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

## place

### dive (uranus.dive, T at 4186, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

### rise (uranus.rise, T at 4391, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 2x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 9.62, uhd 23.22.

Largest mean difference: 1.557 at frame 4493 (uranus.travel), limit 12.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 0.231 at frame 4493 (uranus.travel), limit 3.2.
Largest level difference of one block (a grid of 16 by 9): -0.287 at frame 4133 (uranus.dive), limit 12.
Largest level difference of the whole frame: -0.103 at frame 4290 (uranus.terrain), limit 2.2.
Picture: out/work/smooth/uranus-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 4035 | uranus.hold | 1.234 | 5.9 | 128 | -0.099 | -0.102 | 0.195 | 6.74 | -0.245 | 5,5 | 1.292 |
| 4133 | uranus.dive | 1.121 | 3.7 | 162 | -0.045 | -0.048 | 0.158 | 6.81 | -0.287 | 14,6 | 1.504 |
| 4155 | uranus.dive | 1.136 | 3.6 | 44 | -0.054 | -0.063 | 0.155 | 1.88 | -0.221 | 10,0 | 1.499 |
| 4178 | uranus.dive | 1.184 | 4.7 | 50 | -0.034 | -0.041 | 0.159 | 2.84 | -0.183 | 13,2 | 1.412 |
| 4290 | uranus.terrain | 1.230 | 5.4 | 49 | -0.103 | -0.105 | 0.195 | 1.90 | -0.264 | 5,5 | 1.310 |
| 4399 | uranus.rise | 1.150 | 3.9 | 35 | -0.030 | -0.042 | 0.158 | 2.63 | -0.187 | 13,0 | 1.436 |
| 4418 | uranus.rise | 1.170 | 3.7 | 67 | -0.080 | -0.086 | 0.173 | 3.59 | -0.225 | 5,2 | 1.394 |
| 4436 | uranus.rise | 1.280 | 6.5 | 106 | -0.035 | -0.039 | 0.175 | 7.28 | -0.226 | 8,5 | 1.437 |
| 4493 | uranus.travel | 1.557 | 10.4 | 141 | 0.006 | 0.010 | 0.231 | 7.07 | 0.151 | 3,2 | 1.385 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.

## counts

Film frames 3960 to 4529 in order on one fresh page, 1140 pictures at rate 2, tier draft at preview, 2129 s. Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): 10 warm draws. Its work counts for that picture and stands in brackets. Judged: dive, rise and travel, every picture.

| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |
|---|---|---|---|---|---|---|---|
| uranus.hold | no | 300 | 1 | 3960 | 28 | 142 | 132 |
| uranus.dive | yes | 180 | 0 |  | 0 | 0 | 0 |
| uranus.terrain | no | 360 | 0 |  | 0 | 0 | 0 |
| uranus.rise | yes | 150 | 0 |  | 0 | 0 | 0 |
| uranus.travel | yes | 150 | 0 |  | 0 | 0 | 0 |

Every picture with work (of the warm start call in brackets):

| frame | segment | programs | texture uploads | buffers | warm draws |
|---|---|---|---|---|---|
| 3960 | uranus.hold | 28 (28) | 142 (142) | 132 (132) | 10 |
