# smooth: neptune

Commit 5dd60616578492129874abd81ce19cc1d89d5fa9. Capture rate 2. Parts: path. A calibration run: every number is written, the exit code is 0.

VERDICT: green. No number is over its limit.

## path

### landing (uranus.travel into neptune.hold, frames 4506 to 4529, first frame of the hold 4530, window 4494 to 4541)

The last part of the travel that arrives at neptune, from 0.68 of its length, in the camera of neptune, in px of the master a film frame: sky is the turn of the camera (what the stars do), centre the way of the centre of the body, edge the growth of its radius, centre and edge the fastest point of its edge. Every value is over the mean of the curve in the landing. loss is what a curve loses over one film frame.

| run | curve | mean | at the start | hold's own | step at the seam | at | step between capture frames at the seam | at | largest loss | at | growth of the loss in the last 4 | at | climb after a fall | at | under the hold's own | at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | sky | 41.78 px | 2.386 | 0.039 | 0.006 | 4529 |  |  | 0.418 | 4516 | -0.003 | 4529 | 0.000 |  | -0.000 | 4530 |
| whole frames | centre | 0.07973 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.173 | 0.112 | 0.005 | 4531 |  |  | 0.005 | 4530 | 0.000 | 4527 | 0.000 |  | -0.007 | 4530 |
| whole frames | edge | 14.87 px | 1.785 | 0.011 | 0.043 | 4529 |  |  | 0.272 | 4517 | -0.007 | 4527 | 0.000 |  | -0.003 | 4530 |
| whole frames | centre and edge | 14.95 px | 1.781 | 0.015 | 0.043 | 4529 |  |  | 0.271 | 4517 | -0.007 | 4527 | 0.000 |  | -0.003 | 4530 |
| rate 2 | sky | 41.45 px | 2.406 | 0.039 | 0.007 | 4528 + 1/2 | 0.003 | 4528 + 1/2 | 0.426 | 4515 + 1/2 | -0.003 | 4529 | 0.000 |  | 0.000 | 4530 |
| rate 2 | centre | 0.07946 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.172 | 0.113 | 0.005 | 4531 + 1/2 | 0.002 | 4531 | 0.005 | 4530 | 0.000 | 4526 + 1/2 | 0.000 |  | -0.006 | 4530 |
| rate 2 | edge | 14.7 px | 1.805 | 0.012 | 0.048 | 4528 + 1/2 | 0.023 | 4528 + 1/2 | 0.290 | 4517 + 1/2 | -0.004 | 4526 + 1/2 | 0.000 |  | -0.001 | 4530 |
| rate 2 | centre and edge | 14.77 px | 1.801 | 0.015 | 0.048 | 4528 + 1/2 | 0.022 | 4528 + 1/2 | 0.289 | 4517 + 1/2 | -0.004 | 4526 + 1/2 | 0.000 |  | -0.001 | 4530 |

Limits: step 0.08 of the mean over one film frame from 2 film frames before the hold to 2 into it; the largest loss not in the last 4 film frames before the hold, and no loss there larger than the one a film frame before by more than 0.08; no loss under a third of the one a film frame before while the speed is over the hold's own; climb after a fall 0.03; not under the hold's own by more than 0.08. A loss and a speed over the hold's own count from 0.01 of the mean. The two rules of the loss (where the largest lies and how it grows, and letting go) are shown and not judged: the path alone does not part a good arrival from a bad one by them. A curve whose mean is under 0.5 px a film frame stands still in the picture: it is given over that floor, shown and not judged. The 12 film frames before the landing and the frames further into the hold are shown and not judged.

No judged number of the landing is over its limit.

Every film frame of the window. The curves are over their mean in the landing; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment | sky | step | step at rate 2 | centre | step | step at rate 2 | edge | step | step at rate 2 | centre and edge | step | step at rate 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4494 | uranus.travel | 2.376 |  |  | 0.130 |  |  | 0.884 |  |  | 0.884 |  |  |
| 4495 | uranus.travel | 2.377 | 0.001 | 0.001 | 0.135 | 0.005 | 0.005 | 0.999 | 0.115 * | 0.116 * | 0.998 | 0.114 * | 0.116 * |
| 4496 | uranus.travel | 2.378 | 0.001 | 0.001 | 0.140 | 0.005 | 0.005 | 1.111 | 0.112 * | 0.113 * | 1.109 | 0.111 * | 0.112 * |
| 4497 | uranus.travel | 2.379 | 0.001 | 0.001 | 0.144 | 0.005 | 0.004 | 1.218 | 0.107 * | 0.108 * | 1.216 | 0.107 * | 0.107 * |
| 4498 | uranus.travel | 2.380 | 0.001 | 0.001 | 0.149 | 0.004 | 0.004 | 1.319 | 0.101 * | 0.101 * | 1.317 | 0.101 * | 0.101 * |
| 4499 | uranus.travel | 2.380 | 0.001 | 0.001 | 0.153 | 0.004 | 0.004 | 1.412 | 0.094 * | 0.094 * | 1.410 | 0.093 * | 0.093 * |
| 4500 | uranus.travel | 2.381 | 0.001 | 0.001 | 0.156 | 0.004 | 0.004 | 1.497 | 0.085 * | 0.085 * | 1.495 | 0.085 * | 0.085 * |
| 4501 | uranus.travel | 2.382 | 0.001 | 0.001 | 0.160 | 0.003 | 0.003 | 1.573 | 0.075 | 0.075 | 1.570 | 0.075 | 0.075 |
| 4502 | uranus.travel | 2.383 | 0.001 | 0.001 | 0.163 | 0.003 | 0.003 | 1.638 | 0.065 | 0.064 | 1.635 | 0.065 | 0.064 |
| 4503 | uranus.travel | 2.384 | 0.001 | 0.001 | 0.165 | 0.003 | 0.003 | 1.692 | 0.054 | 0.053 | 1.688 | 0.054 | 0.053 |
| 4504 | uranus.travel | 2.385 | 0.001 | 0.001 | 0.168 | 0.002 | 0.002 | 1.733 | 0.042 | 0.041 | 1.730 | 0.042 | 0.041 |
| 4505 | uranus.travel | 2.385 | 0.001 | 0.001 | 0.170 | 0.002 | 0.002 | 1.763 | 0.030 | 0.028 | 1.759 | 0.029 | 0.028 |
| 4506 landing | uranus.travel | 2.386 | 0.001 | 0.001 | 0.171 | 0.002 | 0.002 | 1.780 | 0.017 | 0.016 | 1.776 | 0.017 | 0.016 |
| 4507 | uranus.travel | 2.386 | 0.000 | 0.001 | 0.173 | 0.001 | 0.001 | 1.785 | 0.005 | 0.004 | 1.781 | 0.005 | 0.004 |
| 4508 | uranus.travel | 2.384 | 0.002 | 0.005 | 0.174 | 0.001 | 0.001 | 1.786 | 0.001 | 0.001 | 1.782 | 0.001 | 0.001 |
| 4509 | uranus.travel | 2.377 | 0.007 | 0.012 | 0.175 | 0.001 | 0.001 | 1.786 | 0.000 | 0.000 | 1.783 | 0.000 | 0.000 |
| 4510 | uranus.travel | 2.360 | 0.017 | 0.028 | 0.175 | 0.000 | 0.000 | 1.786 | 0.000 | 0.001 | 1.782 | 0.000 | 0.001 |
| 4511 | uranus.travel | 2.322 | 0.038 | 0.060 | 0.175 | 0.000 | 0.000 | 1.784 | 0.002 | 0.005 | 1.780 | 0.002 | 0.005 |
| 4512 | uranus.travel | 2.243 | 0.079 | 0.122 * | 0.175 | 0.000 | 0.001 | 1.777 | 0.007 | 0.013 | 1.773 | 0.007 | 0.013 |
| 4513 | uranus.travel | 2.087 | 0.156 * | 0.225 * | 0.174 | 0.001 | 0.001 | 1.759 | 0.018 | 0.032 | 1.755 | 0.018 | 0.032 |
| 4514 | uranus.travel | 1.816 | 0.271 * | 0.351 * | 0.173 | 0.001 | 0.001 | 1.714 | 0.045 | 0.075 | 1.711 | 0.045 | 0.074 |
| 4515 | uranus.travel | 1.432 | 0.384 * | 0.426 * | 0.172 | 0.001 | 0.002 | 1.614 | 0.100 * | 0.154 * | 1.611 | 0.100 * | 0.154 * |
| 4516 | uranus.travel | 1.014 | 0.418 * | 0.420 * | 0.170 | 0.002 | 0.002 | 1.424 | 0.190 * | 0.252 * | 1.422 | 0.189 * | 0.251 * |
| 4517 | uranus.travel | 0.672 | 0.342 * | 0.332 * | 0.168 | 0.002 | 0.002 | 1.151 | 0.272 * | 0.290 * | 1.151 | 0.271 * | 0.289 * |
| 4518 | uranus.travel | 0.448 | 0.224 * | 0.210 * | 0.166 | 0.002 | 0.002 | 0.881 | 0.271 * | 0.269 * | 0.882 | 0.269 * | 0.268 * |
| 4519 | uranus.travel | 0.319 | 0.129 * | 0.120 * | 0.163 | 0.003 | 0.003 | 0.691 | 0.190 * | 0.180 * | 0.693 | 0.189 * | 0.179 * |
| 4520 | uranus.travel | 0.244 | 0.075 | 0.070 | 0.160 | 0.003 | 0.003 | 0.582 | 0.108 * | 0.101 * | 0.585 | 0.108 * | 0.100 * |
| 4521 | uranus.travel | 0.196 | 0.048 | 0.046 | 0.157 | 0.003 | 0.003 | 0.518 | 0.064 | 0.061 | 0.521 | 0.064 | 0.061 |
| 4522 | uranus.travel | 0.160 | 0.036 | 0.035 | 0.154 | 0.003 | 0.004 | 0.467 | 0.051 | 0.052 | 0.470 | 0.051 | 0.052 |
| 4523 | uranus.travel | 0.131 | 0.030 | 0.029 | 0.150 | 0.004 | 0.004 | 0.413 | 0.055 | 0.061 | 0.415 | 0.054 | 0.061 |
| 4524 | uranus.travel | 0.106 | 0.025 | 0.025 | 0.146 | 0.004 | 0.004 | 0.348 | 0.064 | 0.071 | 0.351 | 0.064 | 0.071 |
| 4525 | uranus.travel | 0.085 | 0.021 | 0.020 | 0.142 | 0.004 | 0.004 | 0.276 | 0.072 | 0.075 | 0.279 | 0.072 | 0.075 |
| 4526 | uranus.travel | 0.069 | 0.016 | 0.016 | 0.138 | 0.004 | 0.004 | 0.203 | 0.073 | 0.074 | 0.206 | 0.073 | 0.073 |
| 4527 | uranus.travel | 0.057 | 0.012 | 0.012 | 0.134 | 0.004 | 0.005 | 0.136 | 0.066 | 0.066 | 0.140 | 0.066 | 0.066 |
| 4528 | uranus.travel | 0.048 | 0.009 | 0.009 | 0.129 | 0.005 | 0.005 | 0.081 | 0.055 | 0.054 | 0.085 | 0.055 | 0.054 |
| 4529 | uranus.travel | 0.042 | 0.006 | 0.006 | 0.124 | 0.005 | 0.005 | 0.039 | 0.043 | 0.041 | 0.043 | 0.043 | 0.041 |
| 4530 hold | neptune.hold | 0.039 | 0.003 | 0.002 | 0.120 | 0.005 | 0.005 | 0.014 | 0.024 | 0.022 | 0.018 | 0.024 | 0.022 |
| 4531 | neptune.hold | 0.039 | 0.000 | 0.000 | 0.115 | 0.005 | 0.005 | 0.011 | 0.003 | 0.001 | 0.015 | 0.003 | 0.001 |
| 4532 | neptune.hold | 0.039 | 0.000 | 0.000 | 0.110 | 0.005 | 0.005 | 0.011 | 0.000 | 0.000 | 0.015 | 0.000 | 0.000 |
| 4533 | neptune.hold | 0.039 | 0.000 | 0.000 | 0.105 | 0.005 | 0.005 | 0.011 | 0.000 | 0.000 | 0.015 | 0.000 | 0.000 |
| 4534 | neptune.hold | 0.039 | 0.000 | 0.000 | 0.100 | 0.005 | 0.005 | 0.011 | 0.000 | 0.000 | 0.015 | 0.000 | 0.000 |
| 4535 | neptune.hold | 0.039 | 0.000 | 0.000 | 0.096 | 0.004 | 0.004 | 0.011 | 0.000 | 0.000 | 0.015 | 0.000 | 0.000 |
| 4536 | neptune.hold | 0.039 | 0.000 | 0.000 | 0.092 | 0.004 | 0.004 | 0.011 | 0.000 | 0.000 | 0.014 | 0.000 | 0.000 |
| 4537 | neptune.hold | 0.039 | 0.000 | 0.000 | 0.088 | 0.004 | 0.004 | 0.011 | 0.000 | 0.000 | 0.014 | 0.000 | 0.000 |
| 4538 | neptune.hold | 0.039 | 0.000 | 0.000 | 0.084 | 0.003 | 0.003 | 0.011 | 0.000 | 0.000 | 0.014 | 0.000 | 0.000 |
| 4539 | neptune.hold | 0.040 | 0.000 | 0.000 | 0.082 | 0.003 | 0.003 | 0.011 | 0.000 | 0.000 | 0.014 | 0.000 | 0.000 |
| 4540 | neptune.hold | 0.040 | 0.000 | 0.000 | 0.079 | 0.002 | 0.002 | 0.011 | 0.000 | 0.000 | 0.014 | 0.000 | 0.000 |
| 4541 | neptune.hold | 0.040 | 0.000 | 0.000 | 0.078 | 0.002 | 0.001 | 0.011 | 0.000 | 0.000 | 0.014 | 0.000 | 0.000 |
