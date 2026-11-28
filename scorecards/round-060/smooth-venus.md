# smooth: venus

Commit 262b9a68df0a6bda8d77518539580de554bb0dc5. Capture rate 2. Parts: path, pictures, place, parity, counts.

Joined from the files of 1 machine(s), nothing is rendered, measured or counted here. The path: /home/user/workspace/work/p6/hv9/05/venus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The pictures: the dive /home/user/workspace/work/p6/hv9/01/venus-dive-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hv9/02/venus-dive-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz); the rise /home/user/workspace/work/p6/hv9/03/venus-rise-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hv9/04/venus-rise-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The place: /home/user/workspace/work/p6/hv9/05/venus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The parity: /home/user/workspace/work/p6/hv9/05/venus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The counts: /home/user/workspace/work/p6/hv9/06/venus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

VERDICT: red. 2 numbers over the limit or not measured.

VERDICT BESIDE IT, the pictures read with the carry at the full size (the verdict above is the one that counts and makes the exit code): red. 3 numbers over the limit or not measured.

GROUND POP BESIDE IT, a number without a limit that makes no verdict (1.3 is named as the limit to come), read with the carry at the full size on the ground both frames show: largest 1.915 from frame 1539 + 1/2 to the next, most at pixel 62, 742, a patch of 328 by 448 px; 1 of 424 rows read over 1.3 (pictures of the rise). It is not the line "The ground beside it" of the pictures: that line gives the change in place and the pattern on the surface view before a rise or after a dive, this number is read on the globe's ground through the move itself. Ground pop NOT READ on 2 of 426 rows, which says nothing of them, quiet or not: frame 1361 + 1/2: the last frame of the window, no next frame to carry onto it; frame 1616 + 1/2: the last frame of the window, no next frame to carry onto it.

## path

### dive (venus.dive, frames 1260 to 1349, T at 1343, window 1248 to 1361)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.05767 log of the height a film frame | 1.718 | 1314 | 0.059 | 1323 |  |  | 0.002 | 0.006 | 0.000 | 0.000 | 0.000 at 1353 |
| whole frames | turn | 1.494 degrees a film frame | 1.703 | 1299 | 0.067 | 1343 |  |  | 0.000 | 0.007 | 0.000 | 0.009 | 0.000 at 1361 |
| whole frames | speed | 5.616 px a film frame at the place | 1.666 | 1295 | 0.079 over 8 | 1269 |  |  | 0.003 | 0.001 | 0.000 | 0.000 | 0.002 at 1361 |
| rate 2 | rate | 0.05736 log of the height a film frame | 1.728 | 1314 | 0.059 | 1322 + 1/2 | 0.030 | 1322 | 0.003 | 0.005 | 0.000 | 0.000 | 0.000 at 1352 + 1/2 |
| rate 2 | turn | 1.486 degrees a film frame | 1.712 | 1299 | 0.067 | 1343 | 0.034 | 1343 | 0.000 | 0.006 | 0.000 | 0.014 | 0.000 at 1361 + 1/2 |
| rate 2 | speed | 5.628 px a film frame at the place | 1.673 | 1295 | 0.080 over 8 | 1269 | 0.040 over 8 | 1269 | 0.004 | 0.002 | 0.000 | 0.000 | 0.002 at 1361 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 1350, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.00477 of its height a film frame, the mean of its first 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 1.00 at frame 1350, limit 0.87; inside the dive itself 1.00 at frame 1350. Largest step from one capture frame to the next 0.66 at frame 1342 + 1/2, shown. The part along the surface view's own direction of motion: 1.00 at the lowest, lowest 1.00 at frame 1350, shown; under 0 the eye goes back.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1248 | hold orbit | 3.471e+0 | 0.005 |  |  | 0.034 |  |  | 0.094 |  |  | 0 |
| 1249 | hold orbit | 3.470e+0 | 0.005 | 0.000 | 0.000 | 0.034 | 0.000 | 0.000 | 0.094 | 0.001 | 0.001 | 8 |
| 1250 | hold orbit | 3.470e+0 | 0.005 | 0.000 | 0.000 | 0.034 | 0.000 | 0.000 | 0.095 | 0.001 | 0.001 | 8 |
| 1251 | hold orbit | 3.469e+0 | 0.005 | 0.000 | 0.000 | 0.034 | 0.000 | 0.000 | 0.096 | 0.001 | 0.001 | 8 |
| 1252 | hold orbit | 3.468e+0 | 0.005 | 0.000 | 0.000 | 0.034 | 0.000 | 0.000 | 0.096 | 0.001 | 0.001 | 8 |
| 1253 | hold orbit | 3.467e+0 | 0.005 | 0.000 | 0.000 | 0.034 | 0.000 | 0.000 | 0.097 | 0.001 | 0.001 | 8 |
| 1254 | hold orbit | 3.466e+0 | 0.005 | 0.000 | 0.000 | 0.034 | 0.000 | 0.000 | 0.097 | 0.001 | 0.001 | 8 |
| 1255 | hold orbit | 3.465e+0 | 0.005 | 0.000 | 0.000 | 0.034 | 0.000 | 0.000 | 0.098 | 0.001 | 0.000 | 8 |
| 1256 | hold orbit | 3.464e+0 | 0.005 | 0.000 | 0.000 | 0.034 | 0.000 | 0.000 | 0.098 | 0.000 | 0.000 | 8 |
| 1257 | hold orbit | 3.463e+0 | 0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.099 | 0.000 | 0.000 | 8 |
| 1258 | hold orbit | 3.462e+0 | 0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.099 | 0.000 | 0.000 | 8 |
| 1259 | hold orbit | 3.461e+0 | 0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.100 | 0.000 | 0.000 | 8 |
| 1260 first | dive orbit | 3.460e+0 | 0.005 | 0.000 | 0.001 | 0.033 | 0.000 | 0.000 | 0.100 | 0.000 | 0.001 | 8 |
| 1261 | dive orbit | 3.459e+0 | 0.007 | 0.002 | 0.006 | 0.033 | 0.000 | 0.000 | 0.103 | 0.003 | 0.009 | 8 |
| 1262 | dive orbit | 3.456e+0 | 0.015 | 0.008 | 0.012 | 0.035 | 0.001 | 0.005 | 0.115 | 0.012 | 0.018 | 8 |
| 1263 | dive orbit | 3.450e+0 | 0.029 | 0.014 | 0.019 | 0.043 | 0.008 | 0.015 | 0.138 | 0.022 | 0.029 | 8 |
| 1264 | dive orbit | 3.440e+0 | 0.050 | 0.021 | 0.025 | 0.062 | 0.019 | 0.026 | 0.170 | 0.033 | 0.039 | 8 |
| 1265 | dive orbit | 3.425e+0 | 0.077 | 0.027 | 0.032 | 0.092 | 0.030 | 0.035 | 0.213 | 0.043 | 0.049 | 8 |
| 1266 | dive orbit | 3.403e+0 | 0.111 | 0.034 | 0.038 | 0.130 | 0.038 | 0.044 | 0.266 | 0.053 | 0.059 | 8 |
| 1267 | dive orbit | 3.374e+0 | 0.151 | 0.040 | 0.045 | 0.176 | 0.046 | 0.051 | 0.330 | 0.063 | 0.069 | 8 |
| 1268 | dive orbit | 3.335e+0 | 0.198 | 0.047 | 0.051 | 0.230 | 0.054 | 0.058 | 0.402 | 0.073 | 0.078 | 8 |
| 1269 | dive orbit | 3.288e+0 | 0.250 | 0.052 | 0.052 | 0.290 | 0.059 | 0.061 | 0.481 | 0.079 | 0.0796 | 8 |
| 1270 | dive orbit | 3.231e+0 | 0.302 | 0.052 | 0.052 | 0.351 | 0.061 | 0.061 | 0.560 | 0.079 | 0.078 | 8 |
| 1271 | dive orbit | 3.166e+0 | 0.354 | 0.052 | 0.052 | 0.412 | 0.061 | 0.062 | 0.637 | 0.077 | 0.077 | 8 |
| 1272 | dive orbit | 3.092e+0 | 0.406 | 0.052 | 0.052 | 0.473 | 0.062 | 0.062 | 0.712 | 0.075 | 0.075 | 8 |
| 1273 | dive orbit | 3.012e+0 | 0.458 | 0.052 | 0.052 | 0.535 | 0.062 | 0.062 | 0.785 | 0.073 | 0.073 | 8 |
| 1274 | dive orbit | 2.924e+0 | 0.510 | 0.052 | 0.052 | 0.597 | 0.062 | 0.062 | 0.855 | 0.070 | 0.070 | 8 |
| 1275 | dive orbit | 2.831e+0 | 0.563 | 0.052 | 0.052 | 0.658 | 0.061 | 0.062 | 0.923 | 0.068 | 0.068 | 8 |
| 1276 | dive orbit | 2.732e+0 | 0.615 | 0.052 | 0.053 | 0.719 | 0.061 | 0.061 | 0.989 | 0.065 | 0.065 | 8 |
| 1277 | dive orbit | 2.629e+0 | 0.667 | 0.052 | 0.053 | 0.779 | 0.060 | 0.061 | 1.051 | 0.063 | 0.062 | 8 |
| 1278 | dive orbit | 2.522e+0 | 0.719 | 0.052 | 0.053 | 0.838 | 0.060 | 0.060 | 1.111 | 0.060 | 0.059 | 8 |
| 1279 | dive orbit | 2.413e+0 | 0.772 | 0.052 | 0.053 | 0.897 | 0.059 | 0.059 | 1.168 | 0.057 | 0.056 | 8 |
| 1280 | dive orbit | 2.301e+0 | 0.824 | 0.052 | 0.053 | 0.955 | 0.058 | 0.058 | 1.221 | 0.054 | 0.053 | 8 |
| 1281 | dive orbit | 2.187e+0 | 0.876 | 0.052 | 0.053 | 1.012 | 0.057 | 0.057 | 1.272 | 0.051 | 0.050 | 8 |
| 1282 | dive orbit | 2.073e+0 | 0.929 | 0.053 | 0.053 | 1.067 | 0.056 | 0.056 | 1.320 | 0.048 | 0.047 | 8 |
| 1283 | dive orbit | 1.959e+0 | 0.982 | 0.053 | 0.053 | 1.121 | 0.054 | 0.054 | 1.364 | 0.045 | 0.044 | 8 |
| 1284 | dive orbit | 1.846e+0 | 1.034 | 0.053 | 0.053 | 1.174 | 0.053 | 0.053 | 1.406 | 0.042 | 0.041 | 8 |
| 1285 | dive orbit | 1.733e+0 | 1.087 | 0.053 | 0.053 | 1.226 | 0.052 | 0.052 | 1.444 | 0.039 | 0.039 | 8 |
| 1286 | dive orbit | 1.623e+0 | 1.140 | 0.053 | 0.053 | 1.276 | 0.050 | 0.050 | 1.480 | 0.036 | 0.036 | 8 |
| 1287 | dive orbit | 1.515e+0 | 1.193 | 0.053 | 0.053 | 1.325 | 0.049 | 0.049 | 1.513 | 0.033 | 0.033 | 8 |
| 1288 | dive orbit | 1.410e+0 | 1.246 | 0.053 | 0.053 | 1.372 | 0.047 | 0.047 | 1.543 | 0.030 | 0.030 | 8 |
| 1289 | dive orbit | 1.308e+0 | 1.299 | 0.053 | 0.053 | 1.418 | 0.046 | 0.046 | 1.570 | 0.027 | 0.027 | 8 |
| 1290 | dive orbit | 1.210e+0 | 1.352 | 0.053 | 0.053 | 1.463 | 0.045 | 0.045 | 1.595 | 0.025 | 0.025 | 8 |
| 1291 | dive orbit | 1.116e+0 | 1.405 | 0.053 | 0.054 | 1.506 | 0.043 | 0.043 | 1.617 | 0.022 | 0.022 | 8 |
| 1292 | dive orbit | 1.026e+0 | 1.458 | 0.053 | 0.054 | 1.548 | 0.042 | 0.042 | 1.637 | 0.020 | 0.020 | 8 |
| 1293 | dive orbit | 9.405e-1 | 1.511 | 0.053 | 0.053 | 1.588 | 0.040 | 0.040 | 1.654 | 0.017 | 0.017 | 8 |
| 1294 | dive orbit | 8.596e-1 | 1.559 | 0.048 | 0.047 | 1.623 | 0.035 | 0.034 | 1.664 | 0.010 | 0.010 | 8 |
| 1295 | dive orbit | 7.839e-1 | 1.600 | 0.041 | 0.041 | 1.651 | 0.028 | 0.028 | 1.666 | 0.002 | 0.003 | 8 |
| 1296 | dive orbit | 7.133e-1 | 1.635 | 0.035 | 0.034 | 1.673 | 0.022 | 0.021 | 1.662 | 0.004 | 0.006 | 8 |
| 1297 | dive orbit | 6.481e-1 | 1.663 | 0.028 | 0.028 | 1.689 | 0.016 | 0.015 | 1.653 | 0.009 | 0.011 | 8 |
| 1298 | dive orbit | 5.881e-1 | 1.685 | 0.022 | 0.021 | 1.699 | 0.010 | 0.009 | 1.639 | 0.014 | 0.015 | 8 |
| 1299 | dive orbit | 5.331e-1 | 1.700 | 0.015 | 0.015 | 1.703 | 0.004 | 0.003 | 1.621 | 0.018 | 0.019 | 8 |
| 1300 | dive orbit | 4.831e-1 | 1.709 | 0.009 | 0.008 | 1.701 | 0.002 | 0.006 | 1.600 | 0.022 | 0.024 | 8 |
| 1301 | dive orbit | 4.377e-1 | 1.712 | 0.003 | 0.002 | 1.693 | 0.007 | 0.009 | 1.574 | 0.025 | 0.026 | 8 |
| 1302 | dive orbit | 3.965e-1 | 1.713 | 0.001 | 0.001 | 1.684 | 0.009 | 0.009 | 1.548 | 0.026 | 0.026 | 8 |
| 1303 | dive orbit | 3.592e-1 | 1.713 | 0.001 | 0.001 | 1.675 | 0.009 | 0.009 | 1.523 | 0.025 | 0.025 | 8 |
| 1304 | dive orbit | 3.254e-1 | 1.714 | 0.001 | 0.001 | 1.665 | 0.009 | 0.009 | 1.499 | 0.024 | 0.024 | 8 |
| 1305 | dive orbit | 2.948e-1 | 1.715 | 0.001 | 0.001 | 1.656 | 0.009 | 0.009 | 1.475 | 0.024 | 0.024 | 8 |
| 1306 | dive orbit | 2.670e-1 | 1.715 | 0.001 | 0.001 | 1.647 | 0.009 | 0.009 | 1.451 | 0.023 | 0.023 | 8 |
| 1307 | dive orbit | 2.418e-1 | 1.716 | 0.001 | 0.001 | 1.638 | 0.009 | 0.009 | 1.428 | 0.023 | 0.023 | 8 |
| 1308 | dive orbit | 2.190e-1 | 1.716 | 0.001 | 0.001 | 1.629 | 0.009 | 0.009 | 1.406 | 0.023 | 0.023 | 8 |
| 1309 | dive orbit | 1.984e-1 | 1.717 | 0.000 | 0.000 | 1.621 | 0.008 | 0.008 | 1.383 | 0.022 | 0.022 | 8 |
| 1310 | dive orbit | 1.797e-1 | 1.717 | 0.000 | 0.000 | 1.613 | 0.008 | 0.008 | 1.362 | 0.022 | 0.021 | 8 |
| 1311 | dive orbit | 1.628e-1 | 1.718 | 0.000 | 0.000 | 1.605 | 0.008 | 0.007 | 1.344 | 0.018 | 0.013 | 8 |
| 1312 | dive orbit | 1.474e-1 | 1.718 | 0.000 | 0.000 | 1.598 | 0.007 | 0.007 | 1.336 | 0.008 | 0.007 | 8 |
| 1313 | dive orbit | 1.335e-1 | 1.718 | 0.000 | 0.000 | 1.592 | 0.006 | 0.006 | 1.330 | 0.006 | 0.006 | 8 |
| 1314 | dive orbit | 1.209e-1 | 1.718 | 0.000 | 0.000 | 1.586 | 0.006 | 0.006 | 1.326 | 0.005 | 0.005 | 8 |
| 1315 | dive orbit | 1.095e-1 | 1.716 | 0.002 | 0.007 | 1.579 | 0.007 | 0.010 | 1.319 | 0.006 | 0.010 | 8 |
| 1316 | dive orbit | 9.924e-2 | 1.706 | 0.010 | 0.015 | 1.567 | 0.013 | 0.017 | 1.308 | 0.011 | 0.015 | 8 |
| 1317 | dive orbit | 9.004e-2 | 1.688 | 0.018 | 0.024 | 1.547 | 0.019 | 0.023 | 1.291 | 0.017 | 0.021 | 8 |
| 1318 | dive orbit | 8.181e-2 | 1.661 | 0.027 | 0.032 | 1.522 | 0.026 | 0.030 | 1.269 | 0.022 | 0.026 | 8 |
| 1319 | dive orbit | 7.449e-2 | 1.626 | 0.035 | 0.040 | 1.490 | 0.032 | 0.037 | 1.242 | 0.027 | 0.031 | 8 |
| 1320 | dive orbit | 6.799e-2 | 1.583 | 0.043 | 0.048 | 1.451 | 0.039 | 0.043 | 1.209 | 0.032 | 0.036 | 8 |
| 1321 | dive orbit | 6.224e-2 | 1.532 | 0.051 | 0.057 | 1.405 | 0.046 | 0.050 | 1.172 | 0.037 | 0.041 | 8 |
| 1322 | dive orbit | 5.717e-2 | 1.474 | 0.058 | 0.059 | 1.354 | 0.051 | 0.052 | 1.132 | 0.040 | 0.041 | 8 |
| 1323 | dive orbit | 5.269e-2 | 1.415 | 0.059 | 0.059 | 1.302 | 0.052 | 0.052 | 1.094 | 0.038 | 0.039 | 8 |
| 1324 | dive orbit | 4.872e-2 | 1.356 | 0.059 | 0.059 | 1.250 | 0.052 | 0.052 | 1.059 | 0.035 | 0.036 | 8 |
| 1325 | dive orbit | 4.521e-2 | 1.297 | 0.059 | 0.059 | 1.199 | 0.051 | 0.051 | 1.026 | 0.033 | 0.033 | 8 |
| 1326 | dive orbit | 4.210e-2 | 1.238 | 0.059 | 0.059 | 1.149 | 0.050 | 0.051 | 0.994 | 0.031 | 0.032 | 8 |
| 1327 | dive orbit | 3.933e-2 | 1.179 | 0.059 | 0.059 | 1.099 | 0.050 | 0.050 | 0.963 | 0.031 | 0.032 | 8 |
| 1328 | dive orbit | 3.687e-2 | 1.120 | 0.059 | 0.059 | 1.049 | 0.049 | 0.050 | 0.932 | 0.031 | 0.033 | 8 |
| 1329 | dive orbit | 3.468e-2 | 1.061 | 0.059 | 0.059 | 1.000 | 0.049 | 0.049 | 0.899 | 0.032 | 0.034 | 8 |
| 1330 | dive orbit | 3.274e-2 | 1.002 | 0.059 | 0.059 | 0.952 | 0.048 | 0.049 | 0.866 | 0.034 | 0.035 | 8 |
| 1331 | dive orbit | 3.100e-2 | 0.943 | 0.059 | 0.059 | 0.904 | 0.048 | 0.049 | 0.831 | 0.035 | 0.037 | 8 |
| 1332 | dive orbit | 2.946e-2 | 0.884 | 0.059 | 0.059 | 0.855 | 0.048 | 0.049 | 0.794 | 0.037 | 0.039 | 8 |
| 1333 | dive orbit | 2.809e-2 | 0.825 | 0.059 | 0.059 | 0.806 | 0.049 | 0.049 | 0.755 | 0.039 | 0.041 | 8 |
| 1334 | dive orbit | 2.688e-2 | 0.766 | 0.059 | 0.059 | 0.757 | 0.050 | 0.050 | 0.714 | 0.041 | 0.043 | 8 |
| 1335 | dive orbit | 2.581e-2 | 0.707 | 0.059 | 0.059 | 0.706 | 0.051 | 0.052 | 0.671 | 0.043 | 0.045 | 8 |
| 1336 | dive orbit | 2.486e-2 | 0.648 | 0.059 | 0.059 | 0.654 | 0.052 | 0.053 | 0.626 | 0.046 | 0.047 | 8 |
| 1337 | dive orbit | 2.403e-2 | 0.589 | 0.059 | 0.059 | 0.600 | 0.054 | 0.055 | 0.578 | 0.048 | 0.050 | 8 |
| 1338 | dive orbit | 2.331e-2 | 0.530 | 0.059 | 0.059 | 0.544 | 0.056 | 0.058 | 0.527 | 0.050 | 0.052 | 8 |
| 1339 | dive orbit | 2.268e-2 | 0.471 | 0.059 | 0.059 | 0.486 | 0.058 | 0.060 | 0.475 | 0.053 | 0.054 | 8 |
| 1340 | dive orbit | 2.215e-2 | 0.412 | 0.059 | 0.059 | 0.426 | 0.060 | 0.062 | 0.420 | 0.055 | 0.056 | 8 |
| 1341 | dive orbit | 2.170e-2 | 0.353 | 0.059 | 0.059 | 0.363 | 0.063 | 0.064 | 0.364 | 0.057 | 0.057 | 8 |
| 1342 | dive orbit | 2.134e-2 | 0.294 | 0.059 | 0.059 | 0.298 | 0.065 | 0.067 | 0.306 | 0.058 | 0.058 | 8 |
| 1343 T | dive terrain | 2.105e-2 | 0.235 | 0.059 | 0.059 | 0.231 | 0.067 | 0.067 | 0.248 | 0.058 | 0.058 | 8 |
| 1344 | dive terrain | 2.084e-2 | 0.180 | 0.055 | 0.055 | 0.168 | 0.064 | 0.063 | 0.195 | 0.053 | 0.052 | 8 |
| 1345 | dive terrain | 2.068e-2 | 0.132 | 0.047 | 0.046 | 0.112 | 0.055 | 0.055 | 0.153 | 0.042 | 0.040 | 8 |
| 1346 | dive terrain | 2.057e-2 | 0.093 | 0.039 | 0.038 | 0.066 | 0.046 | 0.045 | 0.124 | 0.029 | 0.027 | 8 |
| 1347 | dive terrain | 2.049e-2 | 0.062 | 0.031 | 0.030 | 0.030 | 0.036 | 0.034 | 0.108 | 0.016 | 0.015 | 8 |
| 1348 | dive terrain | 2.045e-2 | 0.040 | 0.023 | 0.022 | 0.012 | 0.018 | 0.014 | 0.101 | 0.007 | 0.007 | 8 |
| 1349 last | dive terrain | 2.042e-2 | 0.025 | 0.014 | 0.013 | 0.021 | 0.009 | 0.010 | 0.098 | 0.003 | 0.003 | 8 |
| 1350 | terrain terrain | 2.039e-2 | 0.019 | 0.006 | 0.005 | 0.028 | 0.007 | 0.006 | 0.097 | 0.001 | 0.001 | 8 |
| 1351 | terrain terrain | 2.037e-2 | 0.019 | 0.001 | 0.000 | 0.029 | 0.001 | 0.000 | 0.099 | 0.001 | 0.002 | 8 |
| 1352 | terrain terrain | 2.035e-2 | 0.019 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.100 | 0.002 | 0.002 | 8 |
| 1353 | terrain terrain | 2.033e-2 | 0.019 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.102 | 0.002 | 0.002 | 8 |
| 1354 | terrain terrain | 2.031e-2 | 0.019 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.104 | 0.002 | 0.002 | 8 |
| 1355 | terrain terrain | 2.028e-2 | 0.019 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.106 | 0.002 | 0.002 | 8 |
| 1356 | terrain terrain | 2.026e-2 | 0.019 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.107 | 0.002 | 0.002 | 8 |
| 1357 | terrain terrain | 2.024e-2 | 0.019 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.109 | 0.002 | 0.002 | 8 |
| 1358 | terrain terrain | 2.022e-2 | 0.019 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.111 | 0.002 | 0.002 | 8 |
| 1359 | terrain terrain | 2.020e-2 | 0.019 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.113 | 0.002 | 0.002 | 8 |
| 1360 | terrain terrain | 2.017e-2 | 0.019 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.114 | 0.002 | 0.002 | 8 |
| 1361 | terrain terrain | 2.015e-2 | 0.019 | 0.000 | 0.000 | 0.029 | 0.000 | 0.000 | 0.116 | 0.002 | 0.002 | 8 |

### rise (venus.rise, frames 1530 to 1604, T at 1539, window 1518 to 1616)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.07503 log of the height a film frame | 1.708 | 1567 | 0.078 | 1535 |  |  | 0.017 | 0.012 | 0.000 | 0.000 | 0.036 at 1616 |
| whole frames | turn | 1.203 degrees a film frame | 1.936 | 1559 | 0.073 | 1534 |  |  | 0.013 | 0.000 | 0.000 | 0.000 | 0.000 at 1524 |
| whole frames | speed | 6.159 px a film frame at the place | 1.811 | 1573 | 0.073 over 8 | 1565 |  |  | 0.004 | 0.003 | 0.008 over 8 | 0.019 over 8 | 2.411 at 1614 |
| rate 2 | rate | 0.07457 log of the height a film frame | 1.720 | 1566 + 1/2 | 0.079 | 1535 + 1/2 | 0.039 | 1535 | 0.021 | 0.010 | 0.000 | 0.000 | 0.040 at 1616 + 1/2 |
| rate 2 | turn | 1.195 degrees a film frame | 1.950 | 1558 + 1/2 | 0.074 | 1534 | 0.037 | 1533 + 1/2 | 0.017 | 0.001 | 0.000 | 0.000 | 0.000 at 1524 |
| rate 2 | speed | 6.095 px a film frame at the place | 1.805 | 1572 + 1/2 | 0.073 over 8 | 1565 + 1/2 | 0.037 over 8 | 1565 + 1/2 | 0.005 | 0.004 | 0.011 over 8 | 0.020 over 8 | 2.459 at 1613 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 1530, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.003 of its height a film frame, the mean of its last 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 0.99 at frame 1530 + 1/2, limit 0.87; inside the rise itself 0.99 at frame 1530 + 1/2. Largest step from one capture frame to the next 1.16 at frame 1537, shown. The part along the surface view's own direction of motion: 0.98 at the lowest, lowest -7.21 at frame 1545 + 1/2, shown; under 0 the eye goes back.

Rest between the rise and the travel (the seam into venus.travel at film frame 1605, 12 film frames to each side, read at rate 2): a rise and the travel after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body's edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest 6.91 at frame 1606 + 1/2, against 14.05 at frame 1593 and 86.42 at frame 1616 + 1/2 at the ends of the window. The lowest is 0.492 of the slower end, limit 0.07. Near 0 the picture comes to rest between the rise and the travel.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1518 | terrain terrain | 1.710e-2 | -0.006 |  |  | 0.034 |  |  | 0.123 |  |  | 0 |
| 1519 | terrain terrain | 1.709e-2 | -0.006 | 0.000 | 0.000 | 0.034 | 0.000 | 0.000 | 0.121 | 0.002 | 0.002 | 8 |
| 1520 | terrain terrain | 1.708e-2 | -0.006 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.119 | 0.002 | 0.002 | 8 |
| 1521 | terrain terrain | 1.707e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.117 | 0.002 | 0.002 | 8 |
| 1522 | terrain terrain | 1.707e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.116 | 0.002 | 0.002 | 8 |
| 1523 | terrain terrain | 1.706e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.114 | 0.001 | 0.001 | 8 |
| 1524 | terrain terrain | 1.706e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.113 | 0.001 | 0.001 | 8 |
| 1525 | terrain terrain | 1.705e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.112 | 0.001 | 0.001 | 8 |
| 1526 | terrain terrain | 1.704e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.112 | 0.001 | 0.001 | 8 |
| 1527 | terrain terrain | 1.704e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.111 | 0.000 | 0.000 | 8 |
| 1528 | terrain terrain | 1.703e-2 | -0.005 | 0.000 | 0.000 | 0.032 | 0.000 | 0.000 | 0.111 | 0.000 | 0.000 | 8 |
| 1529 | terrain terrain | 1.702e-2 | -0.005 | 0.000 | 0.000 | 0.032 | 0.000 | 0.000 | 0.112 | 0.000 | 0.000 | 8 |
| 1530 first | rise terrain | 1.702e-2 | -0.005 | 0.000 | 0.004 | 0.032 | 0.000 | 0.003 | 0.112 | 0.000 | 0.001 | 8 |
| 1531 | rise terrain | 1.703e-2 | 0.012 | 0.017 | 0.046 | 0.046 | 0.013 | 0.041 | 0.108 | 0.004 | 0.009 | 8 |
| 1532 | rise terrain | 1.713e-2 | 0.073 | 0.061 | 0.075 | 0.103 | 0.057 | 0.072 | 0.100 | 0.008 | 0.007 | 8 |
| 1533 | rise terrain | 1.732e-2 | 0.149 | 0.076 | 0.078 | 0.176 | 0.073 | 0.074 | 0.108 | 0.007 | 0.016 | 8 |
| 1534 | rise terrain | 1.761e-2 | 0.226 | 0.078 | 0.079 | 0.249 | 0.073 | 0.074 | 0.129 | 0.021 | 0.027 | 8 |
| 1535 | rise terrain | 1.802e-2 | 0.305 | 0.078 | 0.079 | 0.322 | 0.073 | 0.074 | 0.157 | 0.029 | 0.030 | 8 |
| 1536 | rise terrain | 1.855e-2 | 0.383 | 0.078 | 0.079 | 0.395 | 0.073 | 0.074 | 0.187 | 0.030 | 0.030 | 8 |
| 1537 | rise terrain | 1.920e-2 | 0.461 | 0.078 | 0.078 | 0.468 | 0.073 | 0.073 | 0.216 | 0.029 | 0.029 | 8 |
| 1538 | rise terrain | 1.999e-2 | 0.537 | 0.077 | 0.077 | 0.541 | 0.073 | 0.073 | 0.244 | 0.028 | 0.028 | 8 |
| 1539 T | rise terrain | 2.093e-2 | 0.613 | 0.075 | 0.076 | 0.613 | 0.073 | 0.073 | 0.270 | 0.026 | 0.026 | 8 |
| 1540 | rise orbit | 2.203e-2 | 0.686 | 0.074 | 0.074 | 0.686 | 0.073 | 0.073 | 0.294 | 0.024 | 0.024 | 8 |
| 1541 | rise orbit | 2.332e-2 | 0.759 | 0.072 | 0.072 | 0.758 | 0.072 | 0.073 | 0.318 | 0.023 | 0.023 | 8 |
| 1542 | rise orbit | 2.482e-2 | 0.829 | 0.071 | 0.071 | 0.831 | 0.072 | 0.073 | 0.340 | 0.023 | 0.022 | 8 |
| 1543 | rise orbit | 2.655e-2 | 0.899 | 0.070 | 0.070 | 0.903 | 0.072 | 0.073 | 0.363 | 0.023 | 0.023 | 8 |
| 1544 | rise orbit | 2.855e-2 | 0.966 | 0.068 | 0.068 | 0.975 | 0.072 | 0.073 | 0.387 | 0.024 | 0.025 | 8 |
| 1545 | rise orbit | 3.085e-2 | 1.030 | 0.064 | 0.063 | 1.047 | 0.072 | 0.072 | 0.413 | 0.026 | 0.027 | 8 |
| 1546 | rise orbit | 3.347e-2 | 1.089 | 0.059 | 0.059 | 1.119 | 0.072 | 0.072 | 0.441 | 0.028 | 0.030 | 8 |
| 1547 | rise orbit | 3.648e-2 | 1.145 | 0.055 | 0.055 | 1.191 | 0.072 | 0.072 | 0.472 | 0.031 | 0.032 | 8 |
| 1548 | rise orbit | 3.990e-2 | 1.197 | 0.052 | 0.052 | 1.262 | 0.072 | 0.072 | 0.505 | 0.033 | 0.036 | 8 |
| 1549 | rise orbit | 4.381e-2 | 1.245 | 0.049 | 0.048 | 1.334 | 0.071 | 0.072 | 0.546 | 0.040 | 0.046 | 8 |
| 1550 | rise orbit | 4.827e-2 | 1.291 | 0.046 | 0.045 | 1.405 | 0.071 | 0.072 | 0.594 | 0.048 | 0.050 | 8 |
| 1551 | rise orbit | 5.334e-2 | 1.333 | 0.043 | 0.043 | 1.476 | 0.071 | 0.071 | 0.645 | 0.051 | 0.053 | 8 |
| 1552 | rise orbit | 5.914e-2 | 1.374 | 0.040 | 0.040 | 1.547 | 0.071 | 0.071 | 0.699 | 0.054 | 0.056 | 8 |
| 1553 | rise orbit | 6.574e-2 | 1.411 | 0.038 | 0.038 | 1.617 | 0.070 | 0.071 | 0.757 | 0.058 | 0.060 | 8 |
| 1554 | rise orbit | 7.328e-2 | 1.447 | 0.036 | 0.036 | 1.687 | 0.070 | 0.070 | 0.818 | 0.061 | 0.063 | 8 |
| 1555 | rise orbit | 8.189e-2 | 1.481 | 0.034 | 0.034 | 1.757 | 0.070 | 0.070 | 0.883 | 0.064 | 0.066 | 8 |
| 1556 | rise orbit | 9.173e-2 | 1.512 | 0.032 | 0.032 | 1.826 | 0.069 | 0.070 | 0.950 | 0.068 | 0.070 | 8 |
| 1557 | rise orbit | 1.030e-1 | 1.542 | 0.030 | 0.030 | 1.894 | 0.068 | 0.068 | 1.021 | 0.071 | 0.071 | 8 |
| 1558 | rise orbit | 1.158e-1 | 1.563 | 0.021 | 0.020 | 1.934 | 0.040 | 0.035 | 1.091 | 0.070 | 0.069 | 8 |
| 1559 | rise orbit | 1.303e-1 | 1.575 | 0.012 | 0.012 | 1.936 | 0.002 | 0.004 | 1.158 | 0.067 | 0.066 | 8 |
| 1560 | rise orbit | 1.468e-1 | 1.588 | 0.013 | 0.015 | 1.932 | 0.004 | 0.004 | 1.226 | 0.068 | 0.068 | 8 |
| 1561 | rise orbit | 1.656e-1 | 1.604 | 0.015 | 0.017 | 1.928 | 0.004 | 0.004 | 1.295 | 0.069 | 0.069 | 8 |
| 1562 | rise orbit | 1.870e-1 | 1.621 | 0.017 | 0.018 | 1.925 | 0.004 | 0.004 | 1.365 | 0.070 | 0.070 | 8 |
| 1563 | rise orbit | 2.115e-1 | 1.639 | 0.019 | 0.020 | 1.921 | 0.004 | 0.004 | 1.436 | 0.071 | 0.071 | 8 |
| 1564 | rise orbit | 2.395e-1 | 1.660 | 0.020 | 0.021 | 1.917 | 0.004 | 0.004 | 1.508 | 0.072 | 0.072 | 8 |
| 1565 | rise orbit | 2.717e-1 | 1.681 | 0.021 | 0.022 | 1.913 | 0.004 | 0.004 | 1.582 | 0.073 | 0.073 | 8 |
| 1566 | rise orbit | 3.088e-1 | 1.702 | 0.021 | 0.022 | 1.909 | 0.004 | 0.007 | 1.655 | 0.073 | 0.072 | 8 |
| 1567 | rise orbit | 3.510e-1 | 1.708 | 0.006 | 0.011 | 1.898 | 0.011 | 0.019 | 1.713 | 0.058 | 0.054 | 8 |
| 1568 | rise orbit | 3.984e-1 | 1.689 | 0.019 | 0.027 | 1.875 | 0.023 | 0.031 | 1.745 | 0.033 | 0.029 | 8 |
| 1569 | rise orbit | 4.514e-1 | 1.663 | 0.027 | 0.027 | 1.840 | 0.035 | 0.043 | 1.767 | 0.022 | 0.022 | 8 |
| 1570 | rise orbit | 5.103e-1 | 1.637 | 0.026 | 0.026 | 1.793 | 0.047 | 0.054 | 1.785 | 0.018 | 0.018 | 8 |
| 1571 | rise orbit | 5.760e-1 | 1.612 | 0.025 | 0.025 | 1.735 | 0.058 | 0.066 | 1.800 | 0.015 | 0.015 | 8 |
| 1572 | rise orbit | 6.489e-1 | 1.588 | 0.024 | 0.026 | 1.666 | 0.069 | 0.074 | 1.810 | 0.010 | 0.009 | 8 |
| 1573 | rise orbit | 7.294e-1 | 1.560 | 0.028 | 0.031 | 1.592 | 0.073 | 0.074 | 1.811 | 0.001 | 0.003 | 8 |
| 1574 | rise orbit | 8.180e-1 | 1.527 | 0.033 | 0.037 | 1.520 | 0.073 | 0.073 | 1.804 | 0.007 | 0.010 | 8 |
| 1575 | rise orbit | 9.146e-1 | 1.489 | 0.038 | 0.042 | 1.447 | 0.073 | 0.073 | 1.789 | 0.015 | 0.018 | 8 |
| 1576 | rise orbit | 1.019e+0 | 1.445 | 0.044 | 0.048 | 1.375 | 0.072 | 0.073 | 1.767 | 0.023 | 0.025 | 8 |
| 1577 | rise orbit | 1.132e+0 | 1.395 | 0.049 | 0.053 | 1.303 | 0.072 | 0.073 | 1.737 | 0.030 | 0.033 | 8 |
| 1578 | rise orbit | 1.252e+0 | 1.340 | 0.055 | 0.059 | 1.231 | 0.072 | 0.072 | 1.699 | 0.038 | 0.040 | 8 |
| 1579 | rise orbit | 1.378e+0 | 1.282 | 0.059 | 0.059 | 1.159 | 0.072 | 0.072 | 1.655 | 0.044 | 0.044 | 8 |
| 1580 | rise orbit | 1.510e+0 | 1.224 | 0.058 | 0.058 | 1.088 | 0.071 | 0.072 | 1.610 | 0.046 | 0.046 | 8 |
| 1581 | rise orbit | 1.649e+0 | 1.168 | 0.056 | 0.056 | 1.016 | 0.071 | 0.072 | 1.561 | 0.048 | 0.049 | 8 |
| 1582 | rise orbit | 1.792e+0 | 1.113 | 0.055 | 0.055 | 0.945 | 0.071 | 0.072 | 1.510 | 0.051 | 0.052 | 8 |
| 1583 | rise orbit | 1.941e+0 | 1.060 | 0.053 | 0.054 | 0.874 | 0.071 | 0.072 | 1.456 | 0.054 | 0.056 | 8 |
| 1584 | rise orbit | 2.093e+0 | 1.008 | 0.052 | 0.052 | 0.803 | 0.071 | 0.071 | 1.399 | 0.057 | 0.059 | 8 |
| 1585 | rise orbit | 2.249e+0 | 0.957 | 0.051 | 0.051 | 0.732 | 0.071 | 0.071 | 1.338 | 0.061 | 0.063 | 8 |
| 1586 | rise orbit | 2.408e+0 | 0.907 | 0.050 | 0.050 | 0.662 | 0.070 | 0.071 | 1.274 | 0.064 | 0.065 | 8 |
| 1587 | rise orbit | 2.567e+0 | 0.857 | 0.049 | 0.050 | 0.595 | 0.067 | 0.067 | 1.209 | 0.066 | 0.067 | 8 |
| 1588 | rise orbit | 2.727e+0 | 0.806 | 0.051 | 0.055 | 0.531 | 0.064 | 0.064 | 1.141 | 0.067 | 0.068 | 8 |
| 1589 | rise orbit | 2.885e+0 | 0.749 | 0.057 | 0.059 | 0.471 | 0.060 | 0.060 | 1.075 | 0.066 | 0.066 | 8 |
| 1590 | rise orbit | 3.038e+0 | 0.690 | 0.059 | 0.060 | 0.415 | 0.056 | 0.056 | 1.015 | 0.060 | 0.059 | 8 |
| 1591 | rise orbit | 3.186e+0 | 0.631 | 0.059 | 0.059 | 0.362 | 0.053 | 0.053 | 0.964 | 0.051 | 0.050 | 8 |
| 1592 | rise orbit | 3.326e+0 | 0.575 | 0.056 | 0.056 | 0.313 | 0.049 | 0.049 | 0.923 | 0.041 | 0.040 | 8 |
| 1593 | rise orbit | 3.459e+0 | 0.523 | 0.052 | 0.052 | 0.267 | 0.046 | 0.045 | 0.892 | 0.031 | 0.030 | 8 |
| 1594 | rise orbit | 3.585e+0 | 0.476 | 0.047 | 0.047 | 0.225 | 0.042 | 0.042 | 0.870 | 0.022 | 0.021 | 8 |
| 1595 | rise orbit | 3.703e+0 | 0.433 | 0.042 | 0.042 | 0.186 | 0.038 | 0.038 | 0.857 | 0.013 | 0.012 | 8 |
| 1596 | rise orbit | 3.815e+0 | 0.395 | 0.038 | 0.038 | 0.152 | 0.035 | 0.035 | 0.851 | 0.006 | 0.005 | 8 |
| 1597 | rise orbit | 3.919e+0 | 0.359 | 0.036 | 0.036 | 0.120 | 0.031 | 0.031 | 0.850 | 0.001 | 0.002 | 8 |
| 1598 | rise orbit | 4.015e+0 | 0.322 | 0.037 | 0.040 | 0.093 | 0.028 | 0.027 | 0.853 | 0.003 | 0.004 | 8 |
| 1599 | rise orbit | 4.100e+0 | 0.280 | 0.042 | 0.045 | 0.069 | 0.024 | 0.024 | 0.858 | 0.005 | 0.006 | 8 |
| 1600 | rise orbit | 4.173e+0 | 0.237 | 0.043 | 0.042 | 0.048 | 0.021 | 0.020 | 0.863 | 0.006 | 0.006 | 8 |
| 1601 | rise orbit | 4.238e+0 | 0.205 | 0.032 | 0.031 | 0.031 | 0.017 | 0.017 | 0.868 | 0.004 | 0.004 | 8 |
| 1602 | rise orbit | 4.295e+0 | 0.179 | 0.025 | 0.025 | 0.018 | 0.013 | 0.013 | 0.869 | 0.001 | 0.001 | 8 |
| 1603 | rise orbit | 4.346e+0 | 0.155 | 0.025 | 0.027 | 0.008 | 0.010 | 0.009 | 0.866 | 0.003 | 0.005 | 8 |
| 1604 last | rise orbit | 4.388e+0 | 0.129 | 0.026 | 0.026 | 0.002 | 0.006 | 0.006 | 0.861 | 0.005 | 0.005 | 8 |
| 1605 | travel orbit | 4.426e+0 | 0.117 | 0.012 | 0.010 | 0.001 | 0.000 | 0.001 | 0.862 | 0.001 | 0.004 | 8 |
| 1606 | travel orbit | 4.465e+0 | 0.114 | 0.002 | 0.002 | 0.001 | 0.000 | 0.000 | 0.866 | 0.003 | 0.003 | 8 |
| 1607 | travel orbit | 4.502e+0 | 0.111 | 0.003 | 0.005 | 0.001 | 0.000 | 0.000 | 0.887 | 0.021 | 0.090 * | 8 |
| 1608 | travel orbit | 4.538e+0 | 0.106 | 0.005 | 0.006 | 0.002 | 0.000 | 0.000 | 1.068 | 0.182 * | 0.392 * | 8 |
| 1609 | travel orbit | 4.572e+0 | 0.100 | 0.005 | 0.005 | 0.002 | 0.000 | 0.000 | 1.614 | 0.546 * | 0.819 * | 8 |
| 1610 | travel orbit | 4.605e+0 | 0.096 | 0.005 | 0.004 | 0.002 | 0.000 | 0.000 | 2.583 | 0.968 * | 1.255 * | 8 |
| 1611 | travel orbit | 4.638e+0 | 0.094 | 0.001 | 0.002 | 0.002 | 0.000 | 0.000 | 4.002 | 1.419 * | 1.738 * | 8 |
| 1612 | travel orbit | 4.673e+0 | 0.099 | 0.004 | 0.009 | 0.002 | 0.000 | 0.000 | 5.899 | 1.897 * | 2.192 * | 8 |
| 1613 | travel orbit | 4.712e+0 | 0.112 | 0.013 | 0.019 | 0.002 | 0.000 | 0.000 | 8.192 | 2.293 * | 2.459 * | 8 |
| 1614 | travel orbit | 4.759e+0 | 0.133 | 0.022 | 0.026 | 0.002 | 0.000 | 0.000 | 10.603 | 2.411 * | 2.433 * | 8 |
| 1615 | travel orbit | 4.817e+0 | 0.162 | 0.029 | 0.033 | 0.002 | 0.000 | 0.000 | 12.794 | 2.191 * | 2.181 * | 8 |
| 1616 | travel orbit | 4.889e+0 | 0.198 | 0.036 | 0.040 | 0.002 | 0.000 | 0.000 | 14.768 | 1.973 * | 1.969 * | 8 |

## pictures

Tier draft, rate 2, 4.34 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

The dive is joined from 2 parts: /home/user/workspace/work/p6/hv9/01/venus-dive-p1of2 (capture frames 2496 to 2609, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hv9/02/venus-dive-p2of2 (capture frames 2610 to 2723, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

The rise is joined from 2 parts: /home/user/workspace/work/p6/hv9/03/venus-rise-p1of2 (capture frames 3036 to 3134, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hv9/04/venus-rise-p2of2 (capture frames 3135 to 3233, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

### dive (venus.dive, frames 1260 to 1349, window 1248 to 1361, 228 draft frames at rate 2)

Largest level step: 0.34 at frame 1287 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.09 from frame 1270 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 4.96 from frame 1291 to the next, block column 2 row 8 from the top left, shown, not judged.
Largest change in place: 61.2 from frame 1320 to 8 film frames later, most at pixel 908, 248 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.62 from frame 1275 + 1/2 to 8 film frames later, most at pixel 1363, 858, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 1350 to 1361 + 1/2): change 2.0, pattern 0.02.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 1269 + 1/2 in /home/user/workspace/work/p6/hv9/01/venus-dive-p1of2-pops.png, frame 1270 in /home/user/workspace/work/p6/hv9/01/venus-dive-p1of2-pops.png, frame 1317 + 1/2 in /home/user/workspace/work/p6/hv9/02/venus-dive-p2of2-pops.png, frame 1320 in /home/user/workspace/work/p6/hv9/02/venus-dive-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 1275 + 1/2 in /home/user/workspace/work/p6/hv9/01/venus-dive-p1of2-changes.png, frame 1303 in no panel (a slice --frames 2606-2606 draws it), frame 1311 in /home/user/workspace/work/p6/hv9/02/venus-dive-p2of2-changes.png, frame 1320 in /home/user/workspace/work/p6/hv9/02/venus-dive-p2of2-changes.png.

- RED the pattern of the picture changes in place by 0.62 from frame 1275 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (28 frames over it, first 1274)

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1248 | 54.23 |  | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 1,7 | 3.3 | 4.9 | 0.29 | 0.07 | 0.29 | 8.1 |
| 1248 + 1/2 | 54.22 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 1,7 | 3.3 | 5.4 | 0.29 | 0.08 | 0.29 | 8.1 |
| 1249 | 54.22 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 2,8 | 3.4 | 6.0 | 0.29 | 0.09 | 0.29 | 8.1 |
| 1249 + 1/2 | 54.21 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 7,0 | 3.4 | 6.5 | 0.29 | 0.10 | 0.29 | 8.1 |
| 1250 | 54.21 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.26 | 1,7 | 3.5 | 7.0 | 0.29 | 0.11 | 0.29 | 8.1 |
| 1250 + 1/2 | 54.20 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 3,0 | 3.6 | 7.5 | 0.29 | 0.12 | 0.29 | 8.1 |
| 1251 | 54.19 | 0.00 | 0.6 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.20 | 11,0 | 3.6 | 7.9 | 0.29 | 0.12 | 0.29 | 8.1 |
| 1251 + 1/2 | 54.19 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 11,6 | 3.6 | 8.2 | 0.29 | 0.11 | 0.29 | 8.1 |
| 1252 | 54.18 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 4,6 | 3.7 | 8.4 | 0.29 | 0.11 | 0.29 | 8.1 |
| 1252 + 1/2 | 54.18 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 15,1 | 3.6 | 8.5 | 0.29 | 0.10 | 0.29 | 8.1 |
| 1253 | 54.17 | 0.00 | 0.6 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.15 | 2,8 | 3.6 | 8.4 | 0.29 | 0.08 | 0.29 | 8.1 |
| 1253 + 1/2 | 54.17 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.25 | 11,6 | 3.6 | 8.2 | 0.29 | 0.07 | 0.29 | 8.1 |
| 1254 | 54.16 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 7,0 | 3.5 | 7.9 | 0.29 | 0.06 | 0.29 | 8.1 |
| 1254 + 1/2 | 54.16 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 2,7 | 3.4 | 7.6 | 0.29 | 0.05 | 0.29 | 8.1 |
| 1255 | 54.15 | 0.00 | 0.6 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 12,0 | 3.3 | 7.0 | 0.29 | 0.04 | 0.29 | 8.1 |
| 1255 + 1/2 | 54.14 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 15,0 | 3.3 | 6.6 | 0.29 | 0.03 | 0.29 | 8.1 |
| 1256 | 54.14 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 5,0 | 3.3 | 6.1 | 0.29 | 0.03 | 0.29 | 8.1 |
| 1256 + 1/2 | 54.14 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 12,7 | 3.3 | 5.6 | 0.29 | 0.03 | 0.29 | 8.1 |
| 1257 | 54.13 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 9,8 | 3.2 | 5.0 | 0.29 | 0.03 | 0.29 | 8.1 |
| 1257 + 1/2 | 54.13 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 15,2 | 3.2 | 4.6 | 0.29 | 0.03 | 0.29 | 8.2 |
| 1258 | 54.12 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 11,2 | 3.3 | 4.3 | 0.29 | 0.03 | 0.29 | 8.2 |
| 1258 + 1/2 | 54.12 | 0.00 | 0.6 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 7,0 | 3.3 | 4.5 | 0.29 | 0.03 | 0.29 | 8.2 |
| 1259 | 54.11 | 0.00 | 0.6 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 14,3 | 3.3 | 4.6 | 0.29 | 0.04 | 0.29 | 8.2 |
| 1259 + 1/2 | 54.11 | 0.00 | 0.6 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 15,0 | 3.6 | 5.0 | 0.29 | 0.04 | 0.29 | 8.2 |
| 1260 first | 54.10 | 0.00 | 0.6 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 11,0 | 3.9 | 5.7 | 0.29 | 0.04 | 0.29 | 8.3 |
| 1260 + 1/2 | 54.09 | 0.00 | 0.6 | 0.87 | 0.88 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 0,2 | 4.5 | 7.0 | 0.29 | 0.05 | 0.29 | 8.4 |
| 1261 | 54.08 | 0.00 | 0.6 | 0.89 | 0.90 | 0.98 | 0.98 | 0.98 | 0.000 | 1.21 | 5,5 | 4.8 | 8.1 | 0.29 | 0.05 | 0.29 | 8.4 |
| 1261 + 1/2 | 54.07 | 0.01 | 0.7 | 0.93 | 0.95 | 0.99 | 0.99 | 0.99 | 0.000 | 1.33 | 5,5 | 5.5 | 9.3 | 0.29 | 0.06 | 0.29 | 8.0 |
| 1262 | 54.08 | 0.00 | 0.7 | 1.01 | 1.02 | 0.98 | 0.98 | 0.98 | 0.000 | 1.36 | 6,5 | 6.2 | 10.6 | 0.29 | 0.07 | 0.29 | 8.0 |
| 1262 + 1/2 | 54.08 | 0.00 | 0.9 | 1.11 | 1.13 | 0.99 | 0.99 | 0.99 | 0.000 | 1.38 | 6,5 | 6.7 | 11.8 | 0.29 | 0.08 | 0.29 | 8.0 |
| 1263 | 54.10 | 0.00 | 1.0 | 1.25 | 1.25 | 1.00 | 1.00 | 1.00 | 0.000 | 1.58 | 5,5 | 7.5 | 13.5 | 0.29 | 0.09 | 0.29 | 8.0 |
| 1263 + 1/2 | 54.12 | 0.00 | 1.3 | 1.38 | 1.37 | 1.01 | 1.01 | 1.01 | 0.000 | 1.80 | 5,5 | 8.0 | 15.0 | 0.29 | 0.10 | 0.29 | 8.0 |
| 1264 | 54.15 | 0.01 | 1.5 | 1.48 | 1.46 | 1.02 | 1.02 | 1.02 | 0.000 | 1.73 | 5,5 | 8.3 | 16.4 | 0.29 | 0.11 | 0.29 | 8.0 |
| 1264 + 1/2 | 54.19 | 0.01 | 1.8 | 1.57 | 1.51 | 1.04 | 1.05 | 1.04 | 0.000 | 1.87 | 6,5 | 8.7 | 16.8 | 0.29 | 0.12 | 0.29 | 8.0 |
| 1265 | 54.25 | 0.01 | 2.1 | 1.59 | 1.54 | 1.03 | 1.04 | 1.03 | 0.001 | 1.67 | 6,5 | 9.4 | 18.0 | 0.29 | 0.13 | 0.29 | 8.0 |
| 1265 + 1/2 | 54.32 | 0.01 | 2.5 | 1.57 | 1.54 | 1.02 | 1.03 | 1.02 | 0.003 | 1.80 | 8,5 | 10.1 | 19.3 | 0.29 | 0.15 | 0.29 | 8.0 |
| 1266 | 54.41 | 0.01 | 2.9 | 1.53 | 1.56 | 0.98 | 0.98 | 0.98 | 0.005 | 1.65 | 9,4 | 10.6 | 20.6 | 0.29 | 0.16 | 0.29 | 8.0 |
| 1266 + 1/2 | 54.51 | 0.01 | 3.4 | 1.56 | 1.56 | 1.00 | 1.00 | 1.00 | 0.005 | 1.62 | 8,5 | 11.5 | 20.8 | 0.29 | 0.17 | 0.29 | 8.0 |
| 1267 | 54.64 | 0.01 | 3.9 | 1.57 | 1.57 | 1.00 | 1.00 | 1.00 | 0.005 | 1.75 | 9,4 | 11.8 | 22.0 | 0.30 | 0.21 | 0.06 | 8.0 |
| 1267 + 1/2 | 54.79 | 0.01 | 4.4 | 1.56 | 1.57 | 0.99 | 0.99 | 0.99 | 0.006 | 1.77 | 5,0 | 12.5 | 23.6 | 0.30 | 0.20 | 0.09 | 8.0 |
| 1268 | 54.96 | 0.01 | 4.9 | 1.54 | 1.58 | 0.97 | 0.97 | 0.97 | 0.010 | 1.92 | 5,0 | 12.7 | 24.5 | 0.30 | 0.23 | 0.13 | 8.0 |
| 1268 + 1/2 | 55.15 | 0.01 | 5.4 | 1.54 | 1.61 | 0.96 | 0.97 | 0.96 | 0.012 | 1.75 | 5,0 | 13.1 | 25.3 | 0.30 | 0.25 | 0.16 | 8.0 |
| 1269 | 55.37 | 0.01 | 5.9 | 1.64 | 1.61 | 1.02 | 1.03 | 1.02 | 0.013 | 1.56 | 6,7 | 13.3 | 26.2 | 0.30 | 0.28 | 0.18 | 8.0 |
| 1269 + 1/2 | 55.60 | 0.01 | 6.4 | 1.75 | 1.63 | 1.07 | 1.10 | 1.07 | 0.014 | 1.56 | 6,7 | 13.4 | 26.5 | 0.30 | 0.26 | 0.20 | 8.0 |
| 1270 | 55.86 | 0.01 | 7.0 | 1.78 | 1.63 | 1.09 | 1.12 | 1.09 | 0.011 | 1.53 | 6,7 | 13.4 | 26.0 | 0.31 | 0.25 | 0.22 | 8.0 |
| 1270 + 1/2 | 56.15 | 0.01 | 7.5 | 1.73 | 1.64 | 1.05 | 1.09 | 1.05 | 0.010 | 1.64 | 0,3 | 13.0 | 25.7 | 0.31 | 0.28 | 0.24 | 8.0 |
| 1271 | 56.46 | 0.01 | 8.0 | 1.64 | 1.64 | 1.00 | 1.03 | 1.00 | 0.013 | 1.52 | 5,3 | 13.1 | 25.5 | 0.31 | 0.27 | 0.27 | 8.0 |
| 1271 + 1/2 | 56.79 | 0.00 | 8.5 | 1.65 | 1.64 | 1.01 | 1.04 | 1.01 | 0.007 | 1.60 | 6,8 | 13.1 | 25.9 | 0.31 | 0.31 | 0.28 | 8.0 |
| 1272 | 57.12 | 0.00 | 8.9 | 1.69 | 1.65 | 1.02 | 1.06 | 1.02 | 0.010 | 1.55 | 6,8 | 13.0 | 26.7 | 0.32 | 0.33 | 0.30 | 8.0 |
| 1272 + 1/2 | 57.44 | 0.01 | 9.5 | 1.73 | 1.65 | 1.05 | 1.09 | 1.05 | 0.005 | 1.74 | 6,8 | 12.6 | 27.3 | 0.32 | 0.37 | 0.31 | 8.0 |
| 1273 | 57.77 | 0.01 | 9.9 | 1.73 | 1.65 | 1.05 | 1.07 | 1.05 | 0.015 | 1.77 | 13,6 | 12.0 | 27.6 | 0.32 | 0.40 | 0.33 | 8.0 |
| 1273 + 1/2 | 58.13 | 0.01 | 10.4 | 1.72 | 1.65 | 1.04 | 1.06 | 1.04 | 0.011 | 2.16 | 6,8 | 11.6 | 27.0 | 0.32 | 0.43 | 0.34 | 8.0 |
| 1274 | 58.51 | 0.00 | 10.8 | 1.70 | 1.65 | 1.03 | 1.03 | 1.03 | 0.024 | 2.31 | 6,8 | 10.6 | 25.8 | 0.32 | 0.47 | 0.36 | 8.0 |
| 1274 + 1/2 | 58.90 | 0.00 | 11.4 | 1.70 | 1.66 | 1.02 | 1.00 | 1.00 | 0.039 | 2.01 | 6,8 | 10.4 | 22.9 | 0.33 | 0.50 | 0.37 | 8.0 |
| 1275 | 59.29 | 0.01 | 11.8 | 1.67 | 1.68 | 0.99 | 1.00 | 0.99 | 0.025 | 1.95 | 13,6 | 10.4 | 21.7 | 0.33 | 0.47 | 0.39 | 8.0 |
| 1275 + 1/2 | 59.66 | 0.01 | 12.2 | 1.65 | 1.69 | 0.98 | 0.98 | 0.98 | 0.033 | 2.12 | 13,6 | 10.3 | 19.6 | 0.33 | 0.62 | 0.40 | 8.0 |
| 1276 | 60.00 | 0.01 | 12.7 | 1.62 | 1.70 | 0.96 | 0.94 | 0.94 | 0.044 | 1.91 | 12,6 | 10.7 | 17.8 | 0.34 | 0.56 | 0.42 | 8.0 |
| 1276 + 1/2 | 60.32 | 0.00 | 13.2 | 1.63 | 1.70 | 0.96 | 0.93 | 0.93 | 0.052 | 2.00 | 2,4 | 11.4 | 15.7 | 0.34 | 0.56 | 0.43 | 8.0 |
| 1277 | 60.63 | 0.01 | 13.4 | 1.65 | 1.71 | 0.97 | 0.93 | 0.93 | 0.056 | 1.99 | 15,7 | 12.0 | 16.7 | 0.34 | 0.55 | 0.44 | 8.0 |
| 1277 + 1/2 | 60.92 | 0.00 | 13.9 | 1.64 | 1.72 | 0.95 | 0.91 | 0.91 | 0.072 | 1.95 | 15,7 | 12.8 | 13.6 | 0.35 | 0.48 | 0.46 | 8.0 |
| 1278 | 61.20 | 0.00 | 14.2 | 1.65 | 1.72 | 0.96 | 0.93 | 0.93 | 0.067 | 2.03 | 14,7 | 13.5 | 15.7 | 0.35 | 0.37 | 0.47 | 8.0 |
| 1278 + 1/2 | 61.49 | 0.01 | 14.5 | 1.64 | 1.72 | 0.96 | 0.93 | 0.93 | 0.071 | 1.95 | 13,7 | 14.7 | 17.5 | 0.35 | 0.29 | 0.49 | 8.0 |
| 1279 | 61.81 | 0.01 | 14.6 | 1.65 | 1.72 | 0.96 | 0.93 | 0.93 | 0.084 | 1.75 | 11,8 | 15.7 | 18.3 | 0.36 | 0.22 | 0.50 | 8.0 |
| 1279 + 1/2 | 62.11 | 0.02 | 15.2 | 1.67 | 1.73 | 0.96 | 0.93 | 0.93 | 0.103 | 1.70 | 11,8 | 17.1 | 20.5 | 0.36 | 0.20 | 0.52 | 8.0 |
| 1280 | 62.37 | 0.05 | 15.1 | 1.70 | 1.75 | 0.97 | 0.94 | 0.94 | 0.105 | 1.72 | 11,8 | 18.2 | 22.0 | 0.36 | 0.19 | 0.54 | 8.0 |
| 1280 + 1/2 | 62.54 | 0.04 | 15.7 | 1.77 | 1.80 | 0.98 | 0.97 | 0.97 | 0.074 | 1.97 | 11,8 | 19.9 | 23.1 | 0.36 | 0.18 | 0.56 | 8.0 |
| 1281 | 62.62 | 0.02 | 15.1 | 1.88 | 1.87 | 1.01 | 1.01 | 1.01 | 0.095 | 1.96 | 15,7 | 21.0 | 24.1 | 0.36 | 0.19 | 0.57 | 8.0 |
| 1281 + 1/2 | 62.65 | 0.00 | 16.0 | 1.97 | 1.95 | 1.01 | 1.03 | 1.01 | 0.109 | 1.94 | 15,7 | 22.0 | 24.3 | 0.35 | 0.19 | 0.58 | 8.0 |
| 1282 | 62.69 | 0.00 | 16.2 | 2.03 | 1.99 | 1.02 | 1.02 | 1.02 | 0.128 | 1.90 | 11,8 | 23.6 | 26.9 | 0.35 | 0.19 | 0.59 | 8.0 |
| 1282 + 1/2 | 62.72 | 0.04 | 17.4 | 2.02 | 2.05 | 0.99 | 0.99 | 0.99 | 0.125 | 2.11 | 3,1 | 24.8 | 29.7 | 0.35 | 0.20 | 0.35 | 8.0 |
| 1283 | 62.83 | 0.09 | 16.2 | 2.06 | 2.05 | 1.00 | 1.03 | 1.00 | 0.132 | 1.80 | 8,5 | 26.2 | 29.0 | 0.35 | 0.19 | 0.61 | 8.0 |
| 1283 + 1/2 | 63.11 | 0.03 | 18.1 | 2.08 | 2.07 | 1.00 | 0.99 | 0.99 | 0.140 | 1.90 | 3,7 | 27.1 | 29.9 | 0.34 | 0.19 | 0.62 | 8.0 |
| 1284 | 63.46 | 0.03 | 17.1 | 2.08 | 2.09 | 0.99 | 0.98 | 0.98 | 0.146 | 1.94 | 3,6 | 27.0 | 29.7 | 0.34 | 0.19 | 0.34 | 8.0 |
| 1284 + 1/2 | 63.88 | 0.04 | 18.0 | 2.11 | 2.13 | 0.99 | 0.98 | 0.98 | 0.141 | 1.91 | 8,5 | 27.6 | 31.2 | 0.34 | 0.19 | 0.33 | 8.0 |
| 1285 | 64.37 | 0.01 | 18.4 | 2.19 | 2.18 | 1.00 | 0.99 | 0.99 | 0.158 | 2.24 | 2,7 | 28.1 | 30.2 | 0.33 | 0.18 | 0.33 | 8.0 |
| 1285 + 1/2 | 64.89 | 0.01 | 17.7 | 2.25 | 2.24 | 1.01 | 1.01 | 1.01 | 0.136 | 2.32 | 5,7 | 29.3 | 31.9 | 0.33 | 0.15 | 0.65 | 8.0 |
| 1286 | 65.44 | 0.03 | 19.2 | 2.29 | 2.30 | 0.99 | 0.99 | 0.99 | 0.160 | 2.62 | 5,8 | 30.9 | 33.0 | 0.33 | 0.14 | 0.66 | 8.0 |
| 1286 + 1/2 | 66.04 | 0.00 | 19.3 | 2.35 | 2.36 | 1.00 | 1.01 | 1.00 | 0.112 | 3.08 | 5,8 | 31.6 | 37.7 | 0.32 | 0.15 | 0.32 | 8.0 |
| 1287 | 66.64 | 0.09 | 19.7 | 2.43 | 2.41 | 1.01 | 0.99 | 0.99 | 0.123 | 3.15 | 5,8 | 32.6 | 36.9 | 0.32 | 0.18 | 0.32 | 8.0 |
| 1287 + 1/2 | 67.06 | 0.34 | 20.4 | 2.48 | 2.48 | 1.00 | 0.98 | 0.98 | 0.161 | 3.19 | 4,8 | 33.6 | 39.8 | 0.32 | 0.17 | 0.31 | 8.0 |
| 1288 | 66.80 | 0.13 | 19.4 | 2.54 | 2.54 | 1.00 | 1.01 | 1.00 | 0.159 | 3.56 | 4,8 | 34.3 | 43.8 | 0.32 | 0.15 | 0.31 | 8.0 |
| 1288 + 1/2 | 66.29 | 0.05 | 20.7 | 2.60 | 2.58 | 1.01 | 1.00 | 1.00 | 0.143 | 4.39 | 4,8 | 35.2 | 49.0 | 0.31 | 0.13 | 0.31 | 8.0 |
| 1289 | 65.67 | 0.02 | 19.5 | 2.62 | 2.63 | 1.00 | 1.01 | 1.00 | 0.098 | 3.97 | 3,8 | 35.6 | 51.6 | 0.31 | 0.12 | 0.31 | 8.0 |
| 1289 + 1/2 | 65.02 | 0.01 | 20.5 | 2.68 | 2.63 | 1.02 | 1.02 | 1.02 | 0.101 | 4.73 | 3,8 | 35.5 | 51.7 | 0.31 | 0.13 | 0.31 | 8.0 |
| 1290 | 64.38 | 0.07 | 20.7 | 2.65 | 2.66 | 1.00 | 1.00 | 1.00 | 0.078 | 4.07 | 2,8 | 35.4 | 38.6 | 0.31 | 0.13 | 0.31 | 8.0 |
| 1290 + 1/2 | 63.61 | 0.04 | 20.8 | 2.76 | 2.66 | 1.04 | 1.05 | 1.04 | 0.068 | 4.43 | 2,8 | 35.8 | 39.2 | 0.31 | 0.13 | 0.30 | 8.0 |
| 1291 | 62.92 | 0.02 | 21.3 | 2.78 | 2.66 | 1.04 | 1.05 | 1.04 | 0.083 | 4.96 | 2,8 | 36.2 | 38.1 | 0.31 | 0.14 | 0.30 | 8.0 |
| 1291 + 1/2 | 62.27 | 0.08 | 22.4 | 2.81 | 2.67 | 1.05 | 1.05 | 1.05 | 0.116 | 4.53 | 2,8 | 36.6 | 41.3 | 0.31 | 0.11 | 0.30 | 8.0 |
| 1292 | 61.77 | 0.10 | 21.5 | 2.83 | 2.69 | 1.05 | 1.06 | 1.05 | 0.083 | 4.05 | 1,8 | 36.8 | 43.7 | 0.31 | 0.12 | 0.30 | 8.0 |
| 1292 + 1/2 | 61.47 | 0.03 | 21.9 | 2.84 | 2.70 | 1.05 | 1.06 | 1.05 | 0.115 | 3.92 | 1,8 | 36.3 | 42.5 | 0.31 | 0.12 | 0.30 | 8.0 |
| 1293 | 61.24 | 0.02 | 22.5 | 2.78 | 2.70 | 1.03 | 1.03 | 1.03 | 0.133 | 2.77 | 1,8 | 36.0 | 42.9 | 0.31 | 0.13 | 0.31 | 8.0 |
| 1293 + 1/2 | 60.96 | 0.04 | 24.4 | 2.71 | 2.70 | 1.00 | 1.00 | 1.00 | 0.157 | 2.49 | 5,6 | 35.6 | 43.3 | 0.31 | 0.15 | 0.31 | 8.0 |
| 1294 | 60.62 | 0.10 | 23.0 | 2.66 | 2.70 | 0.98 | 0.98 | 0.98 | 0.127 | 2.58 | 5,6 | 35.4 | 44.2 | 0.31 | 0.16 | 0.31 | 8.0 |
| 1294 + 1/2 | 60.48 | 0.13 | 22.5 | 2.66 | 2.70 | 0.98 | 0.98 | 0.98 | 0.114 | 2.60 | 5,6 | 34.8 | 41.9 | 0.31 | 0.18 | 0.73 | 8.0 |
| 1295 | 60.61 | 0.09 | 23.1 | 2.66 | 2.70 | 0.99 | 0.99 | 0.99 | 0.101 | 2.62 | 5,6 | 34.1 | 39.0 | 0.31 | 0.21 | 0.73 | 8.0 |
| 1295 + 1/2 | 60.90 | 0.03 | 24.3 | 2.69 | 2.70 | 1.00 | 1.01 | 1.00 | 0.079 | 2.44 | 4,6 | 32.4 | 37.3 | 0.31 | 0.22 | 0.74 | 8.0 |
| 1296 | 61.26 | 0.06 | 24.1 | 2.75 | 2.70 | 1.02 | 1.03 | 1.02 | 0.083 | 2.55 | 4,6 | 32.2 | 36.2 | 0.30 | 0.23 | 0.74 | 8.0 |
| 1296 + 1/2 | 61.73 | 0.01 | 24.4 | 2.77 | 2.70 | 1.03 | 1.04 | 1.03 | 0.078 | 2.70 | 4,6 | 32.1 | 36.3 | 0.31 | 0.24 | 0.74 | 8.0 |
| 1297 | 62.17 | 0.03 | 23.6 | 2.79 | 2.70 | 1.03 | 1.05 | 1.03 | 0.095 | 2.67 | 4,6 | 32.5 | 36.8 | 0.31 | 0.25 | 0.30 | 12.9 |
| 1297 + 1/2 | 62.68 | 0.01 | 24.1 | 2.80 | 2.70 | 1.04 | 1.05 | 1.04 | 0.089 | 2.48 | 3,6 | 32.5 | 35.8 | 0.31 | 0.26 | 0.30 | 12.8 |
| 1298 | 63.16 | 0.07 | 24.4 | 2.76 | 2.70 | 1.02 | 1.02 | 1.02 | 0.140 | 2.50 | 3,6 | 33.6 | 37.9 | 0.31 | 0.27 | 0.30 | 12.8 |
| 1298 + 1/2 | 63.51 | 0.12 | 25.2 | 2.77 | 2.70 | 1.03 | 1.04 | 1.03 | 0.088 | 2.50 | 3,6 | 34.7 | 40.3 | 0.31 | 0.29 | 0.30 | 12.8 |
| 1299 | 64.11 | 0.01 | 24.8 | 2.74 | 2.68 | 1.02 | 1.02 | 1.02 | 0.107 | 2.20 | 2,6 | 36.1 | 42.8 | 0.31 | 0.29 | 0.30 | 12.7 |
| 1299 + 1/2 | 64.69 | 0.04 | 23.6 | 2.76 | 2.66 | 1.04 | 1.04 | 1.04 | 0.095 | 2.65 | 14,7 | 37.5 | 45.5 | 0.31 | 0.30 | 0.31 | 12.7 |
| 1300 | 65.35 | 0.01 | 24.2 | 2.71 | 2.66 | 1.02 | 1.02 | 1.02 | 0.109 | 2.49 | 14,7 | 39.4 | 48.5 | 0.31 | 0.30 | 0.31 | 12.7 |
| 1300 + 1/2 | 65.97 | 0.03 | 24.5 | 2.70 | 2.64 | 1.02 | 1.02 | 1.02 | 0.103 | 2.55 | 1,8 | 41.2 | 51.4 | 0.31 | 0.30 | 0.31 | 12.7 |
| 1301 | 66.65 | 0.05 | 23.6 | 2.63 | 2.60 | 1.01 | 1.02 | 1.01 | 0.118 | 2.53 | 15,7 | 43.4 | 54.2 | 0.31 | 0.30 | 0.31 | 12.7 |
| 1301 + 1/2 | 67.22 | 0.10 | 23.9 | 2.54 | 2.54 | 1.00 | 1.01 | 1.00 | 0.103 | 2.63 | 15,7 | 45.0 | 56.8 | 0.31 | 0.30 | 0.31 | 12.7 |
| 1302 | 67.59 | 0.07 | 23.7 | 2.44 | 2.46 | 0.99 | 0.98 | 0.98 | 0.116 | 2.75 | 15,7 | 46.9 | 59.2 | 0.31 | 0.31 | 0.31 | 12.6 |
| 1302 + 1/2 | 67.82 | 0.01 | 24.1 | 2.38 | 2.38 | 1.00 | 1.01 | 1.00 | 0.105 | 2.35 | 15,7 | 49.0 | 61.8 | 0.31 | 0.30 | 0.31 | 9.5 |
| 1303 | 68.02 | 0.02 | 23.2 | 2.32 | 2.34 | 0.99 | 0.98 | 0.98 | 0.118 | 2.11 | 0,4 | 51.0 | 63.9 | 0.31 | 0.31 | 0.31 | 9.6 |
| 1303 + 1/2 | 68.26 | 0.01 | 23.9 | 2.29 | 2.30 | 0.99 | 0.97 | 0.97 | 0.110 | 2.33 | 0,4 | 52.5 | 65.4 | 0.31 | 0.30 | 0.31 | 9.6 |
| 1304 | 68.48 | 0.01 | 24.2 | 2.19 | 2.29 | 0.96 | 0.97 | 0.96 | 0.077 | 2.03 | 0,4 | 53.9 | 66.9 | 0.31 | 0.30 | 0.31 | 9.7 |
| 1304 + 1/2 | 68.67 | 0.03 | 22.9 | 2.12 | 2.29 | 0.93 | 0.93 | 0.93 | 0.123 | 2.06 | 4,2 | 55.2 | 67.8 | 0.31 | 0.32 | 0.31 | 8.0 |
| 1305 | 68.80 | 0.01 | 23.5 | 2.13 | 2.29 | 0.93 | 0.91 | 0.91 | 0.136 | 1.88 | 0,4 | 56.0 | 68.1 | 0.31 | 0.33 | 0.31 | 8.0 |
| 1305 + 1/2 | 68.95 | 0.04 | 23.3 | 2.09 | 2.29 | 0.91 | 0.89 | 0.89 | 0.125 | 1.70 | 6,5 | 56.7 | 68.3 | 0.31 | 0.35 | 0.31 | 8.0 |
| 1306 | 69.01 | 0.10 | 24.2 | 2.06 | 2.29 | 0.90 | 0.87 | 0.87 | 0.130 | 1.83 | 5,5 | 56.9 | 67.6 | 0.31 | 0.41 | 0.31 | 8.0 |
| 1306 + 1/2 | 68.87 | 0.01 | 22.9 | 2.06 | 2.29 | 0.90 | 0.88 | 0.88 | 0.127 | 1.97 | 5,5 | 56.7 | 66.4 | 0.31 | 0.38 | 0.31 | 8.0 |
| 1307 | 68.70 | 0.03 | 24.0 | 2.06 | 2.29 | 0.90 | 0.90 | 0.90 | 0.109 | 2.06 | 5,5 | 56.1 | 65.0 | 0.31 | 0.33 | 0.31 | 8.0 |
| 1307 + 1/2 | 68.47 | 0.08 | 24.1 | 2.09 | 2.29 | 0.91 | 0.92 | 0.91 | 0.125 | 2.21 | 5,5 | 55.2 | 63.2 | 0.31 | 0.35 | 0.31 | 8.0 |
| 1308 | 68.08 | 0.09 | 23.8 | 2.14 | 2.29 | 0.93 | 0.92 | 0.92 | 0.123 | 2.25 | 5,5 | 54.1 | 61.4 | 0.31 | 0.35 | 0.31 | 8.0 |
| 1308 + 1/2 | 67.51 | 0.02 | 23.7 | 2.22 | 2.29 | 0.97 | 0.98 | 0.97 | 0.092 | 2.55 | 4,5 | 52.9 | 59.4 | 0.31 | 0.32 | 0.30 | 8.0 |
| 1309 | 66.98 | 0.07 | 23.6 | 2.25 | 2.29 | 0.98 | 1.01 | 0.98 | 0.121 | 2.85 | 4,5 | 51.6 | 57.5 | 0.30 | 0.34 | 0.30 | 8.0 |
| 1309 + 1/2 | 66.30 | 0.05 | 22.8 | 2.24 | 2.29 | 0.98 | 0.98 | 0.98 | 0.146 | 2.72 | 4,5 | 50.5 | 56.0 | 0.30 | 0.36 | 0.29 | 8.0 |
| 1310 | 65.72 | 0.05 | 22.6 | 2.27 | 2.29 | 0.99 | 0.99 | 0.99 | 0.156 | 2.95 | 4,5 | 49.3 | 54.4 | 0.30 | 0.46 | 0.29 | 8.0 |
| 1310 + 1/2 | 65.04 | 0.10 | 24.2 | 2.27 | 2.29 | 0.99 | 0.98 | 0.98 | 0.145 | 2.93 | 3,5 | 48.6 | 52.7 | 0.30 | 0.49 | 0.29 | 8.0 |
| 1311 | 64.56 | 0.03 | 24.0 | 2.29 | 2.29 | 1.00 | 0.98 | 0.98 | 0.159 | 3.52 | 3,5 | 48.4 | 52.4 | 0.30 | 0.55 | 0.30 | 8.0 |
| 1311 + 1/2 | 64.13 | 0.06 | 23.3 | 2.29 | 2.29 | 1.00 | 1.00 | 1.00 | 0.142 | 3.57 | 3,5 | 49.4 | 55.7 | 0.30 | 0.47 | 0.29 | 8.0 |
| 1312 | 63.82 | 0.05 | 23.3 | 2.28 | 2.31 | 0.99 | 0.96 | 0.96 | 0.176 | 3.26 | 6,8 | 51.2 | 58.9 | 0.30 | 0.49 | 0.29 | 8.0 |
| 1312 + 1/2 | 63.63 | 0.02 | 24.2 | 2.33 | 2.32 | 1.00 | 0.99 | 0.99 | 0.130 | 3.76 | 2,5 | 52.2 | 63.5 | 0.30 | 0.40 | 0.29 | 8.0 |
| 1313 | 63.47 | 0.08 | 25.6 | 2.35 | 2.37 | 0.99 | 1.01 | 0.99 | 0.119 | 3.57 | 2,5 | 54.6 | 67.0 | 0.30 | 0.25 | 0.29 | 8.0 |
| 1313 + 1/2 | 63.48 | 0.03 | 25.0 | 2.41 | 2.41 | 1.00 | 0.98 | 0.98 | 0.119 | 3.46 | 2,5 | 56.0 | 70.3 | 0.30 | 0.20 | 0.29 | 12.1 |
| 1314 | 63.54 | 0.05 | 26.8 | 2.47 | 2.48 | 1.00 | 1.03 | 1.00 | 0.085 | 3.46 | 1,5 | 57.1 | 73.0 | 0.30 | 0.16 | 0.29 | 11.9 |
| 1314 + 1/2 | 63.71 | 0.03 | 25.2 | 2.55 | 2.49 | 1.02 | 1.06 | 1.02 | 0.039 | 3.53 | 1,5 | 53.0 | 72.0 | 0.30 | 0.16 | 0.29 | 8.5 |
| 1315 | 63.95 | 0.09 | 25.1 | 2.66 | 2.50 | 1.06 | 1.05 | 1.05 | 0.072 | 3.67 | 1,5 | 52.8 | 71.8 | 0.30 | 0.16 | 0.30 | 8.4 |
| 1315 + 1/2 | 64.36 | 0.15 | 26.0 | 2.71 | 2.50 | 1.09 | 1.05 | 1.05 | 0.076 | 3.12 | 0,5 | 53.9 | 71.3 | 0.30 | 0.14 | 0.30 | 8.4 |
| 1316 | 65.07 | 0.09 | 25.1 | 2.70 | 2.50 | 1.08 | 1.05 | 1.05 | 0.058 | 3.19 | 0,5 | 55.0 | 70.9 | 0.31 | 0.14 | 0.59 | 8.0 |
| 1316 + 1/2 | 65.95 | 0.02 | 25.7 | 2.70 | 2.50 | 1.08 | 1.04 | 1.04 | 0.073 | 2.74 | 0,5 | 55.8 | 69.4 | 0.31 | 0.15 | 0.59 | 8.0 |
| 1317 | 66.80 | 0.07 | 24.8 | 2.71 | 2.50 | 1.09 | 1.03 | 1.03 | 0.078 | 2.63 | 11,7 | 56.8 | 70.4 | 0.31 | 0.18 | 0.31 | 8.1 |
| 1317 + 1/2 | 67.79 | 0.01 | 24.2 | 2.75 | 2.50 | 1.10 | 1.06 | 1.06 | 0.068 | 3.04 | 11,7 | 56.5 | 70.0 | 0.32 | 0.24 | 0.31 | 9.4 |
| 1318 | 68.80 | 0.05 | 24.7 | 2.76 | 2.50 | 1.10 | 1.03 | 1.03 | 0.101 | 2.95 | 11,7 | 56.6 | 67.5 | 0.32 | 0.30 | 0.31 | 9.5 |
| 1318 + 1/2 | 69.91 | 0.01 | 24.1 | 2.76 | 2.50 | 1.11 | 1.04 | 1.04 | 0.084 | 2.93 | 4,5 | 57.1 | 66.1 | 0.32 | 0.36 | 0.32 | 9.6 |
| 1319 | 71.04 | 0.05 | 24.0 | 2.76 | 2.50 | 1.10 | 1.02 | 1.02 | 0.097 | 3.27 | 4,5 | 58.8 | 67.9 | 0.32 | 0.35 | 0.32 | 9.8 |
| 1319 + 1/2 | 72.07 | 0.03 | 23.6 | 2.74 | 2.50 | 1.10 | 1.00 | 1.00 | 0.116 | 3.46 | 11,8 | 60.2 | 72.6 | 0.33 | 0.37 | 0.32 | 10.0 |
| 1320 | 73.16 | 0.10 | 23.2 | 2.70 | 2.50 | 1.08 | 1.08 | 1.08 | 0.047 | 4.05 | 11,8 | 61.2 | 77.1 | 0.33 | 0.36 | 0.32 | 10.4 |
| 1320 + 1/2 | 74.06 | 0.05 | 22.5 | 2.67 | 2.50 | 1.07 | 1.03 | 1.03 | 0.069 | 3.59 | 11,8 | 56.7 | 69.4 | 0.33 | 0.37 | 0.32 | 10.6 |
| 1321 | 74.86 | 0.08 | 22.2 | 2.62 | 2.50 | 1.05 | 1.05 | 1.05 | 0.050 | 3.23 | 3,5 | 53.7 | 68.2 | 0.33 | 0.41 | 0.54 | 8.0 |
| 1321 + 1/2 | 75.50 | 0.03 | 21.5 | 2.57 | 2.50 | 1.03 | 0.99 | 0.99 | 0.071 | 3.58 | 3,5 | 52.3 | 69.7 | 0.34 | 0.4499 | 0.33 | 10.9 |
| 1322 | 76.07 | 0.05 | 21.2 | 2.55 | 2.50 | 1.02 | 1.03 | 1.02 | 0.037 | 3.23 | 3,5 | 50.3 | 71.3 | 0.34 | 0.53 | 0.34 | 11.0 |
| 1322 + 1/2 | 76.55 | 0.06 | 20.9 | 2.52 | 2.51 | 1.00 | 1.03 | 1.00 | 0.044 | 3.32 | 3,5 | 47.6 | 72.9 | 0.34 | 0.50 | 0.34 | 8.0 |
| 1323 | 76.91 | 0.08 | 20.6 | 2.48 | 2.47 | 1.00 | 0.99 | 0.99 | 0.072 | 2.61 | 2,6 | 44.4 | 72.1 | 0.35 | 0.44 | 0.34 | 8.0 |
| 1323 + 1/2 | 77.13 | 0.06 | 20.1 | 2.43 | 2.43 | 1.00 | 1.01 | 1.00 | 0.060 | 2.80 | 2,5 | 40.8 | 62.9 | 0.35 | 0.454 | 0.35 | 8.0 |
| 1324 | 77.22 | 0.06 | 19.7 | 2.38 | 2.40 | 0.99 | 0.99 | 0.99 | 0.056 | 2.98 | 2,7 | 37.8 | 55.0 | 0.36 | 0.47 | 0.35 | 8.0 |
| 1324 + 1/2 | 77.19 | 0.02 | 19.3 | 2.37 | 2.36 | 1.00 | 1.00 | 1.00 | 0.054 | 2.62 | 1,6 | 33.5 | 46.7 | 0.36 | 0.50 | 0.36 | 8.0 |
| 1325 | 77.13 | 0.05 | 19.0 | 2.33 | 2.33 | 1.00 | 1.00 | 1.00 | 0.046 | 2.67 | 1,6 | 28.8 | 40.2 | 0.36 | 0.50 | 0.36 | 8.0 |
| 1325 + 1/2 | 76.96 | 0.04 | 18.6 | 2.29 | 2.29 | 1.00 | 0.99 | 0.99 | 0.050 | 3.94 | 15,8 | 24.6 | 39.3 | 0.37 | 0.49 | 0.37 | 8.0 |
| 1326 | 76.73 | 0.03 | 18.2 | 2.24 | 2.26 | 0.99 | 1.00 | 0.99 | 0.035 | 2.70 | 1,7 | 22.2 | 35.4 | 0.37 | 0.47 | 0.37 | 8.0 |
| 1326 + 1/2 | 76.43 | 0.01 | 17.8 | 2.23 | 2.22 | 1.01 | 1.01 | 1.01 | 0.030 | 2.81 | 1,7 | 21.8 | 29.0 | 0.38 | 0.455 | 0.37 | 8.0 |
| 1327 | 76.12 | 0.03 | 17.5 | 2.20 | 2.19 | 1.00 | 1.01 | 1.00 | 0.026 | 2.89 | 0,7 | 21.3 | 25.1 | 0.38 | 0.41 | 0.38 | 8.0 |
| 1327 + 1/2 | 75.75 | 0.03 | 17.2 | 2.14 | 2.13 | 1.01 | 0.99 | 0.99 | 0.031 | 3.05 | 2,8 | 20.9 | 25.6 | 0.39 | 0.39 | 0.38 | 8.0 |
| 1328 | 75.31 | 0.05 | 16.8 | 2.06 | 2.05 | 1.00 | 1.00 | 1.00 | 0.029 | 2.95 | 2,8 | 20.6 | 25.6 | 0.39 | 0.37 | 0.39 | 8.0 |
| 1328 + 1/2 | 74.78 | 0.03 | 16.4 | 1.95 | 1.95 | 1.00 | 1.00 | 1.00 | 0.020 | 3.11 | 0,5 | 20.3 | 25.6 | 0.40 | 0.37 | 0.39 | 8.0 |
| 1329 | 74.19 | 0.03 | 15.9 | 1.85 | 1.87 | 0.99 | 1.00 | 0.99 | 0.016 | 3.08 | 0,5 | 19.9 | 25.6 | 0.40 | 0.35 | 0.40 | 12.3 |
| 1329 + 1/2 | 73.54 | 0.00 | 15.5 | 1.78 | 1.80 | 0.99 | 0.99 | 0.99 | 0.012 | 3.12 | 0,5 | 19.5 | 25.2 | 0.40 | 0.38 | 0.43 | 8.0 |
| 1330 | 72.87 | 0.02 | 15.1 | 1.74 | 1.74 | 1.00 | 1.00 | 1.00 | 0.013 | 2.85 | 0,5 | 19.0 | 24.7 | 0.41 | 0.41 | 0.42 | 8.0 |
| 1330 + 1/2 | 72.17 | 0.04 | 14.7 | 1.71 | 1.70 | 1.00 | 1.00 | 1.00 | 0.011 | 2.72 | 0,5 | 18.5 | 23.9 | 0.41 | 0.48 | 0.41 | 8.0 |
| 1331 | 71.39 | 0.02 | 14.2 | 1.66 | 1.68 | 0.99 | 0.99 | 0.99 | 0.011 | 2.41 | 8,8 | 17.4 | 23.0 | 0.42 | 0.50 | 0.41 | 8.0 |
| 1331 + 1/2 | 70.65 | 0.04 | 13.7 | 1.66 | 1.65 | 1.01 | 1.01 | 1.01 | 0.012 | 2.72 | 8,8 | 16.5 | 24.3 | 0.42 | 0.49 | 0.40 | 8.0 |
| 1332 | 69.98 | 0.03 | 13.3 | 1.63 | 1.63 | 1.00 | 1.00 | 1.00 | 0.013 | 2.28 | 8,8 | 15.3 | 21.7 | 0.43 | 0.55 | 0.39 | 8.0 |
| 1332 + 1/2 | 69.37 | 0.04 | 12.9 | 1.61 | 1.61 | 1.00 | 1.00 | 1.00 | 0.012 | 2.35 | 7,8 | 14.2 | 17.9 | 0.43 | 0.53 | 0.38 | 8.0 |
| 1333 | 68.85 | 0.01 | 12.5 | 1.59 | 1.58 | 1.01 | 1.00 | 1.00 | 0.019 | 2.40 | 7,8 | 13.2 | 15.2 | 0.44 | 0.50 | 0.37 | 8.0 |
| 1333 + 1/2 | 68.35 | 0.00 | 12.0 | 1.55 | 1.56 | 0.99 | 1.00 | 0.99 | 0.011 | 2.19 | 7,8 | 12.5 | 14.5 | 0.44 | 0.44 | 0.36 | 8.0 |
| 1334 | 67.84 | 0.01 | 11.7 | 1.53 | 1.53 | 1.00 | 1.00 | 1.00 | 0.016 | 2.38 | 7,8 | 11.8 | 13.8 | 0.45 | 0.41 | 0.34 | 8.0 |
| 1334 + 1/2 | 67.37 | 0.01 | 11.2 | 1.51 | 1.51 | 1.00 | 1.01 | 1.00 | 0.007 | 2.32 | 7,8 | 11.0 | 13.0 | 0.45 | 0.35 | 0.33 | 8.0 |
| 1335 | 66.93 | 0.02 | 10.8 | 1.48 | 1.49 | 0.99 | 0.99 | 0.99 | 0.017 | 2.13 | 1,8 | 10.4 | 12.7 | 0.46 | 0.31 | 0.31 | 8.0 |
| 1335 + 1/2 | 66.51 | 0.02 | 10.3 | 1.47 | 1.47 | 1.01 | 1.00 | 1.00 | 0.017 | 2.12 | 1,8 | 9.5 | 13.1 | 0.47 | 0.29 | 0.30 | 8.0 |
| 1336 | 66.14 | 0.01 | 9.9 | 1.45 | 1.46 | 1.00 | 1.00 | 1.00 | 0.012 | 2.28 | 1,8 | 8.6 | 13.0 | 0.47 | 0.23 | 0.27 | 8.0 |
| 1336 + 1/2 | 65.78 | 0.02 | 9.4 | 1.44 | 1.44 | 1.00 | 0.99 | 0.99 | 0.013 | 1.95 | 1,8 | 7.8 | 12.1 | 0.48 | 0.16 | 0.25 | 8.0 |
| 1337 | 65.47 | 0.01 | 8.9 | 1.43 | 1.42 | 1.01 | 1.01 | 1.01 | 0.008 | 2.35 | 0,8 | 7.0 | 11.2 | 0.49 | 0.11 | 0.49 | 9.3 |
| 1337 + 1/2 | 65.19 | 0.01 | 8.5 | 1.40 | 1.42 | 0.99 | 0.99 | 0.99 | 0.009 | 3.42 | 0,8 | 6.4 | 10.7 | 0.50 | 0.09 | 0.49 | 9.2 |
| 1338 | 64.93 | 0.02 | 8.0 | 1.41 | 1.39 | 1.01 | 1.01 | 1.01 | 0.005 | 3.12 | 0,8 | 5.8 | 10.0 | 0.50 | 0.08 | 0.13 | 8.0 |
| 1338 + 1/2 | 64.72 | 0.02 | 7.6 | 1.37 | 1.38 | 0.99 | 1.00 | 0.99 | 0.004 | 2.59 | 0,8 | 5.3 | 9.6 | 0.51 | 0.10 | 0.08 | 8.0 |
| 1339 | 64.54 | 0.01 | 7.1 | 1.36 | 1.35 | 1.00 | 1.00 | 1.00 | 0.005 | 2.36 | 13,8 | 5.0 | 8.7 | 0.52 | 0.06 | 0.03 | 8.0 |
| 1339 + 1/2 | 64.38 | 0.01 | 6.6 | 1.34 | 1.34 | 1.00 | 1.00 | 1.00 | 0.007 | 1.75 | 13,8 | 4.5 | 8.5 | 0.52 | 0.05 | 0.52 | 8.8 |
| 1340 | 64.24 | 0.01 | 6.1 | 1.32 | 1.33 | 1.00 | 1.00 | 1.00 | 0.005 | 1.96 | 13,8 | 4.2 | 8.2 | 0.53 | 0.04 | 0.53 | 8.7 |
| 1340 + 1/2 | 64.10 | 0.00 | 5.6 | 1.32 | 1.30 | 1.01 | 1.01 | 1.01 | 0.000 | 1.80 | 14,4 | 3.9 | 8.3 | 0.54 | 0.04 | 0.54 | 8.6 |
| 1341 | 63.97 | 0.01 | 5.1 | 1.28 | 1.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.99 | 14,4 | 3.5 | 8.1 | 0.55 | 0.03 | 0.54 | 8.6 |
| 1341 + 1/2 | 63.86 | 0.04 | 4.6 | 1.26 | 1.26 | 1.00 | 0.99 | 0.99 | 0.003 | 2.21 | 14,4 | 3.4 | 7.4 | 0.55 | 0.03 | 0.55 | 8.9 |
| 1342 | 63.83 | 0.01 | 4.1 | 1.25 | 1.25 | 1.00 | 1.00 | 1.00 | 0.000 | 2.26 | 14,4 | 3.0 | 6.4 | 0.56 | 0.03 | 0.55 | 8.8 |
| 1342 + 1/2 | 63.80 | 0.00 | 3.7 | 1.24 | 1.24 | 1.01 | 1.01 | 1.01 | 0.000 | 2.29 | 14,4 | 2.9 | 6.8 | 0.56 | 0.03 | 0.56 | 8.7 |
| 1343 | 63.78 | 0.01 | 3.2 | 1.22 | 1.22 | 1.00 | 1.00 | 1.00 | 0.000 | 2.11 | 14,4 | 2.9 | 6.7 | 0.57 | 0.03 | 0.56 | 8.7 |
| 1343 + 1/2 | 63.77 | 0.00 | 2.9 | 1.20 | 1.19 | 1.01 | 1.01 | 1.01 | 0.000 | 2.15 | 14,4 | 2.5 | 5.8 | 0.57 | 0.03 | 0.57 | 8.6 |
| 1344 | 63.78 | 0.00 | 2.4 | 1.17 | 1.15 | 1.01 | 1.01 | 1.01 | 0.000 | 2.01 | 14,4 | 2.4 | 6.1 | 0.57 | 0.03 | 0.57 | 8.6 |
| 1344 + 1/2 | 63.78 | 0.00 | 2.1 | 1.11 | 1.11 | 1.00 | 1.00 | 1.00 | 0.000 | 1.75 | 14,4 | 2.4 | 6.1 | 0.58 | 0.03 | 0.57 | 8.5 |
| 1345 | 63.79 | 0.00 | 1.7 | 1.06 | 1.05 | 1.01 | 1.01 | 1.01 | 0.000 | 1.63 | 14,5 | 2.1 | 5.2 | 0.58 | 0.03 | 0.57 | 8.4 |
| 1345 + 1/2 | 63.81 | 0.00 | 1.5 | 0.99 | 0.98 | 1.01 | 1.01 | 1.01 | 0.000 | 1.65 | 14,5 | 2.1 | 5.2 | 0.58 | 0.02 | 0.58 | 8.4 |
| 1346 | 63.83 | 0.00 | 1.2 | 0.90 | 0.90 | 1.00 | 1.00 | 1.00 | 0.000 | 1.57 | 14,5 | 2.0 | 5.5 | 0.58 | 0.03 | 0.58 | 8.4 |
| 1346 + 1/2 | 63.85 | 0.00 | 1.0 | 0.82 | 0.82 | 0.99 | 0.99 | 0.99 | 0.000 | 1.49 | 14,5 | 1.9 | 5.7 | 0.58 | 0.03 | 0.58 | 8.3 |
| 1347 | 63.88 | 0.00 | 0.8 | 0.75 | 0.77 | 0.98 | 0.98 | 0.98 | 0.000 | 1.34 | 14,5 | 1.8 | 5.3 | 0.58 | 0.03 | 0.58 | 8.3 |
| 1347 + 1/2 | 63.91 | 0.00 | 0.8 | 0.73 | 0.74 | 0.98 | 0.98 | 0.98 | 0.000 | 1.28 | 13,7 | 1.8 | 5.1 | 0.58 | 0.02 | 0.58 | 8.4 |
| 1348 | 63.94 | 0.00 | 0.7 | 0.71 | 0.73 | 0.98 | 0.98 | 0.98 | 0.000 | 1.13 | 14,8 | 1.8 | 4.8 | 0.58 | 0.02 | 0.58 | 8.3 |
| 1348 + 1/2 | 63.97 | 0.00 | 0.7 | 0.71 | 0.72 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 13,7 | 1.8 | 4.7 | 0.58 | 0.02 | 0.58 | 8.3 |
| 1349 last | 64.00 | 0.00 | 0.7 | 0.71 | 0.72 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 1,8 | 1.8 | 4.6 | 0.59 | 0.02 | 0.58 | 8.3 |
| 1349 + 1/2 | 64.03 | 0.00 | 0.7 | 0.71 | 0.72 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 13,7 | 1.8 | 4.6 | 0.59 | 0.02 | 0.58 | 8.3 |
| 1350 | 64.07 | 0.00 | 0.7 | 0.71 | 0.72 | 0.98 | 0.98 | 0.98 | 0.000 | 1.08 | 0,3 | 1.8 | 4.5 | 0.59 | 0.02 | 0.58 | 8.3 |
| 1350 + 1/2 | 64.10 | 0.00 | 0.7 | 0.71 | 0.72 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 0,1 | 1.8 | 4.3 | 0.59 | 0.02 | 0.58 | 8.3 |
| 1351 | 64.13 | 0.00 | 0.7 | 0.71 | 0.72 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 1,8 | 1.9 | 4.2 | 0.59 | 0.02 | 0.58 | 8.3 |
| 1351 + 1/2 | 64.16 | 0.00 | 0.7 | 0.71 | 0.72 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 13,7 | 2.0 | 4.1 | 0.58 | 0.02 | 0.58 | 8.3 |
| 1352 | 64.20 | 0.00 | 0.7 | 0.71 | 0.72 | 0.98 | 0.98 | 0.98 | 0.000 | 1.10 | 7,8 | 1.9 | 3.8 | 0.58 | 0.02 | 0.58 | 8.3 |
| 1352 + 1/2 | 64.23 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 12,8 | 2.0 | 3.9 | 0.58 | 0.02 | 0.58 | 8.4 |
| 1353 | 64.27 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 6,0 | 2.0 | 3.9 | 0.58 | 0.02 | 0.58 | 8.4 |
| 1353 + 1/2 | 64.30 | 0.00 | 0.7 | 0.73 | 0.72 | 1.01 | 1.01 | 1.01 | 0.000 | 1.12 | 7,8 | 2.0 | 4.1 | 0.58 | 0.02 | 0.58 | 8.4 |
| 1354 | 64.33 | 0.00 | 0.8 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 12,8 |  |  |  |  |  |  |
| 1354 + 1/2 | 64.36 | 0.00 | 0.7 | 0.71 | 0.72 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 1,7 |  |  |  |  |  |  |
| 1355 | 64.39 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 7,8 |  |  |  |  |  |  |
| 1355 + 1/2 | 64.42 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.23 | 12,8 |  |  |  |  |  |  |
| 1356 | 64.46 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 0,1 |  |  |  |  |  |  |
| 1356 + 1/2 | 64.49 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 3,4 |  |  |  |  |  |  |
| 1357 | 64.52 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.24 | 12,8 |  |  |  |  |  |  |
| 1357 + 1/2 | 64.56 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 9,0 |  |  |  |  |  |  |
| 1358 | 64.59 | 0.00 | 0.7 | 0.73 | 0.72 | 1.01 | 1.01 | 1.01 | 0.000 | 1.11 | 15,7 |  |  |  |  |  |  |
| 1358 + 1/2 | 64.62 | 0.00 | 0.7 | 0.73 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 0,0 |  |  |  |  |  |  |
| 1359 | 64.65 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 13,8 |  |  |  |  |  |  |
| 1359 + 1/2 | 64.68 | 0.00 | 0.7 | 0.73 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 13,8 |  |  |  |  |  |  |
| 1360 | 64.71 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 2,8 |  |  |  |  |  |  |
| 1360 + 1/2 | 64.74 | 0.00 | 0.7 | 0.72 | 0.73 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 8,0 |  |  |  |  |  |  |
| 1361 | 64.77 | 0.00 | 0.7 | 0.72 | 0.73 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 13,8 |  |  |  |  |  |  |
| 1361 + 1/2 | 64.80 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### dive, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.19 from frame 1296 to the next, limit 1.2.
Largest pop score of one block: 5.30 from frame 1327 to the next, block column 1 row 4 from the top left, shown, not judged.
Largest change in place: 57.4 from frame 1314 to 8 film frames later, most at pixel 900, 212, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 1350 to 1361 + 1/2): change 1.0; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.041 from frame 1342 + 1/2 to the next, most at pixel 194, 1070, a patch of 80 by 24 px; 0 of 227 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 228 rows, which says nothing of them, quiet or not: frame 1361 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 1296 in /home/user/workspace/work/p6/hv9/01/venus-dive-p1of2-pops-full.png, frame 1296 + 1/2 in /home/user/workspace/work/p6/hv9/01/venus-dive-p1of2-pops-full.png, frame 1297 in /home/user/workspace/work/p6/hv9/01/venus-dive-p1of2-pops-full.png, frame 1320 in /home/user/workspace/work/p6/hv9/02/venus-dive-p2of2-pops-full.png, frame 1342 + 1/2 in /home/user/workspace/work/p6/hv9/02/venus-dive-p2of2-pops-full.png.

With the carry at the full size the dive has 1 number over the limit or not measured.

- FULL SIZE RED the pattern of the picture changes in place by 0.62 from frame 1275 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (28 frames over it, first 1274)

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1248 | 0.6 | 0.28 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 7,8 | 3.9 | 5.1 | 0.29 | 1.00 | 0.279 | 0.278 | 1.003 | 0.289 | 882,918 | 64 by 64 |
| 1248 + 1/2 | 0.6 | 0.28 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 3,0 | 4.0 | 5.6 | 0.29 | 1.00 | 0.278 | 0.278 | 0.999 | 0.289 | 1146,478 | 192 by 136 |
| 1249 | 0.6 | 0.28 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 12,6 | 4.1 | 6.2 | 0.29 | 1.00 | 0.277 | 0.278 | 0.999 | 0.289 | 662,590 | 88 by 164 |
| 1249 + 1/2 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 0,5 | 4.1 | 6.6 | 0.29 | 1.00 | 0.278 | 0.278 | 1.000 | 0.290 | 906,822 | 140 by 152 |
| 1250 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 15,7 | 4.2 | 7.1 | 0.29 | 1.00 | 0.276 | 0.278 | 0.991 | 0.290 | 710,694 | 108 by 152 |
| 1250 + 1/2 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 1,1 | 4.2 | 7.6 | 0.29 | 1.00 | 0.279 | 0.279 | 0.999 | 0.290 | 1294,594 | 52 by 64 |
| 1251 | 0.6 | 0.28 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 15,1 | 4.3 | 8.0 | 0.29 | 0.99 | 0.280 | 0.279 | 1.004 | 0.290 | 898,802 | 164 by 112 |
| 1251 + 1/2 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 11,6 | 4.2 | 8.3 | 0.29 | 1.00 | 0.280 | 0.280 | 1.002 | 0.290 | 1202,474 | 184 by 160 |
| 1252 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 2,1 | 4.3 | 8.5 | 0.29 | 1.00 | 0.279 | 0.280 | 0.996 | 0.290 | 914,906 | 68 by 64 |
| 1252 + 1/2 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 5,7 | 4.2 | 8.6 | 0.29 | 1.00 | 0.280 | 0.281 | 0.998 | 0.290 | 814,718 | 252 by 140 |
| 1253 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 0,8 | 4.0 | 8.5 | 0.29 | 0.99 | 0.282 | 0.282 | 0.999 | 0.290 | 1142,354 | 216 by 164 |
| 1253 + 1/2 | 0.6 | 0.29 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 1.14 | 8,6 | 3.9 | 8.3 | 0.29 | 1.00 | 0.285 | 0.282 | 1.008 | 0.290 | 862,926 | 104 by 60 |
| 1254 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 7,6 | 3.6 | 7.9 | 0.29 | 1.00 | 0.283 | 0.283 | 1.000 | 0.290 | 854,826 | 136 by 160 |
| 1254 + 1/2 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 8,6 | 3.4 | 7.5 | 0.29 | 1.00 | 0.283 | 0.284 | 0.997 | 0.290 | 690,718 | 72 by 152 |
| 1255 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 8,6 | 3.2 | 7.0 | 0.29 | 0.99 | 0.283 | 0.283 | 0.999 | 0.290 | 830,918 | 84 by 56 |
| 1255 + 1/2 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 7,6 | 3.0 | 6.4 | 0.29 | 1.00 | 0.285 | 0.284 | 1.007 | 0.290 | 962,798 | 268 by 196 |
| 1256 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 8,6 | 3.0 | 5.9 | 0.29 | 1.00 | 0.284 | 0.284 | 0.999 | 0.290 | 1074,786 | 168 by 108 |
| 1256 + 1/2 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 8,6 | 3.0 | 5.2 | 0.29 | 1.00 | 0.284 | 0.285 | 0.999 | 0.290 | 706,410 | 140 by 276 |
| 1257 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 8,6 | 2.9 | 4.6 | 0.29 | 1.00 | 0.284 | 0.284 | 0.999 | 0.291 | 674,730 | 68 by 80 |
| 1257 + 1/2 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 7,6 | 2.8 | 4.2 | 0.29 | 1.00 | 0.285 | 0.283 | 1.007 | 0.291 | 706,730 | 184 by 176 |
| 1258 | 0.6 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 7,6 | 2.7 | 4.1 | 0.29 | 1.00 | 0.283 | 0.283 | 0.999 | 0.291 | 922,798 | 64 by 112 |
| 1258 + 1/2 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 8,6 | 2.6 | 4.3 | 0.29 | 1.00 | 0.283 | 0.283 | 1.000 | 0.291 | 782,826 | 304 by 196 |
| 1259 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 14,1 | 2.4 | 4.4 | 0.29 | 0.99 | 0.283 | 0.282 | 1.002 | 0.291 | 782,850 | 92 by 76 |
| 1259 + 1/2 | 0.6 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 14,6 | 2.2 | 4.6 | 0.29 | 0.99 | 0.281 | 0.282 | 0.997 | 0.291 | 870,918 | 124 by 80 |
| 1260 | 0.6 | 0.28 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.16 | 12,0 | 2.1 | 4.7 | 0.29 | 0.99 | 0.279 | 0.282 | 0.989 | 0.291 | 1202,474 | 68 by 128 |
| 1260 + 1/2 | 0.6 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.06 | 9,6 | 2.1 | 4.8 | 0.29 | 0.99 | 0.282 | 0.280 | 1.005 | 0.291 | 954,810 | 64 by 100 |
| 1261 | 0.6 | 0.28 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.05 | 6,4 | 2.1 | 4.9 | 0.29 | 0.98 | 0.283 | 0.279 | 1.014 | 0.291 | 922,738 | 184 by 292 |
| 1261 + 1/2 | 0.7 | 0.29 | 0.29 | 0.98 | 0.98 | 0.98 | 0.000 | 1.10 | 5,3 | 2.1 | 5.0 | 0.29 | 0.99 | 0.279 | 0.280 | 0.997 | 0.291 | 714,746 | 108 by 168 |
| 1262 | 0.7 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 15,0 | 2.1 | 5.0 | 0.29 | 0.98 | 0.278 | 0.275 | 1.010 | 0.291 | 694,754 | 212 by 176 |
| 1262 + 1/2 | 0.9 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 5,2 | 2.1 | 5.1 | 0.29 | 0.99 | 0.272 | 0.278 | 0.976 | 0.292 | 878,286 | 108 by 120 |
| 1263 | 1.0 | 0.31 | 0.32 | 0.98 | 0.98 | 0.98 | 0.000 | 1.23 | 4,4 | 2.1 | 5.1 | 0.29 | 1.00 | 0.268 | 0.281 | 0.953 | 0.292 | 838,706 | 112 by 136 |
| 1263 + 1/2 | 1.3 | 0.33 | 0.33 | 1.01 | 1.01 | 1.01 | 0.000 | 1.39 | 7,0 | 2.2 | 5.0 | 0.29 | 1.01 | 0.284 | 0.281 | 1.008 | 0.292 | 818,818 | 288 by 236 |
| 1264 | 1.5 | 0.35 | 0.35 | 0.99 | 0.99 | 0.99 | 0.000 | 1.62 | 7,0 | 2.2 | 5.0 | 0.29 | 1.02 | 0.294 | 0.285 | 1.033 | 0.293 | 622,590 | 76 by 92 |
| 1264 + 1/2 | 1.8 | 0.37 | 0.37 | 1.00 | 1.00 | 1.00 | 0.000 | 1.85 | 4,4 | 2.4 | 4.9 | 0.29 | 1.04 | 0.291 | 0.290 | 1.005 | 0.294 | 610,710 | 40 by 80 |
| 1265 | 2.1 | 0.39 | 0.39 | 0.99 | 0.99 | 0.99 | 0.001 | 2.10 | 7,0 | 2.5 | 4.8 | 0.29 | 1.03 | 0.285 | 0.294 | 0.970 | 0.295 | 638,766 | 48 by 60 |
| 1265 + 1/2 | 2.5 | 0.41 | 0.41 | 1.00 | 1.00 | 1.00 | 0.003 | 2.27 | 4,4 | 2.7 | 4.7 | 0.29 | 1.02 | 0.297 | 0.290 | 1.024 | 0.296 | 718,734 | 108 by 116 |
| 1266 | 2.9 | 0.43 | 0.43 | 1.00 | 1.00 | 1.00 | 0.004 | 2.73 | 4,4 | 2.6 | 4.8 | 0.29 | 0.98 | 0.294 | 0.292 | 1.008 | 0.297 | 814,634 | 236 by 300 |
| 1266 + 1/2 | 3.4 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.004 | 2.85 | 4,4 | 2.8 | 5.2 | 0.29 | 1.00 | 0.289 | 0.296 | 0.976 | 0.298 | 646,770 | 128 by 104 |
| 1267 | 3.9 | 0.48 | 0.48 | 1.01 | 1.01 | 1.01 | 0.004 | 3.20 | 4,4 | 3.1 | 6.0 | 0.30 | 1.00 | 0.296 | 0.295 | 1.001 | 0.300 | 814,806 | 196 by 148 |
| 1267 + 1/2 | 4.4 | 0.50 | 0.50 | 1.00 | 1.01 | 1.00 | 0.005 | 3.38 | 4,4 | 3.4 | 6.3 | 0.30 | 0.99 | 0.296 | 0.299 | 0.988 | 0.302 | 1178,178 | 124 by 120 |
| 1268 | 4.9 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.010 | 3.01 | 4,4 | 3.9 | 7.3 | 0.30 | 0.97 | 0.304 | 0.300 | 1.013 | 0.304 | 1222,302 | 60 by 52 |
| 1268 + 1/2 | 5.4 | 0.54 | 0.54 | 1.00 | 1.00 | 1.00 | 0.012 | 2.72 | 5,0 | 4.5 | 8.7 | 0.30 | 0.96 | 0.303 | 0.304 | 0.997 | 0.307 | 662,410 | 124 by 100 |
| 1269 | 5.9 | 0.55 | 0.55 | 1.01 | 1.01 | 1.01 | 0.013 | 2.89 | 5,0 | 5.0 | 9.8 | 0.30 | 1.02 | 0.309 | 0.304 | 1.015 | 0.310 | 586,710 | 72 by 64 |
| 1269 + 1/2 | 6.4 | 0.56 | 0.56 | 1.00 | 0.99 | 0.99 | 0.013 | 2.85 | 5,0 | 5.5 | 10.4 | 0.30 | 1.07 | 0.305 | 0.308 | 0.989 | 0.313 | 1094,342 | 104 by 112 |
| 1270 | 7.0 | 0.57 | 0.58 | 0.99 | 1.01 | 0.99 | 0.011 | 3.36 | 5,0 | 6.1 | 10.9 | 0.31 | 1.09 | 0.308 | 0.309 | 0.996 | 0.316 | 574,586 | 68 by 96 |
| 1270 + 1/2 | 7.5 | 0.59 | 0.58 | 1.01 | 1.03 | 1.01 | 0.010 | 3.24 | 5,0 | 6.6 | 10.6 | 0.31 | 1.05 | 0.317 | 0.308 | 1.029 | 0.320 | 1126,154 | 92 by 72 |
| 1271 | 8.0 | 0.60 | 0.59 | 1.02 | 1.04 | 1.02 | 0.011 | 3.00 | 3,3 | 7.1 | 12.7 | 0.31 | 1.00 | 0.309 | 0.315 | 0.979 | 0.325 | 1090,158 | 112 by 76 |
| 1271 + 1/2 | 8.5 | 0.61 | 0.60 | 1.01 | 1.04 | 1.01 | 0.006 | 3.15 | 3,3 | 7.6 | 14.5 | 0.31 | 1.01 | 0.314 | 0.318 | 0.985 | 0.329 | 1206,306 | 56 by 68 |
| 1272 | 8.9 | 0.60 | 0.60 | 1.00 | 1.02 | 1.00 | 0.009 | 3.12 | 3,3 | 8.2 | 18.4 | 0.32 | 1.02 | 0.320 | 0.321 | 0.997 | 0.334 | 1122,170 | 248 by 116 |
| 1272 + 1/2 | 9.5 | 0.60 | 0.61 | 0.98 | 1.03 | 0.98 | 0.005 | 2.83 | 3,6 | 8.8 | 17.5 | 0.32 | 1.05 | 0.328 | 0.325 | 1.010 | 0.340 | 1210,302 | 60 by 68 |
| 1273 | 9.9 | 0.61 | 0.62 | 0.98 | 1.02 | 0.98 | 0.013 | 3.04 | 3,6 | 9.3 | 19.5 | 0.32 | 1.05 | 0.329 | 0.336 | 0.982 | 0.345 | 966,90 | 68 by 36 |
| 1273 + 1/2 | 10.4 | 0.63 | 0.62 | 1.02 | 1.05 | 1.02 | 0.010 | 3.32 | 3,6 | 9.7 | 19.9 | 0.32 | 1.04 | 0.343 | 0.340 | 1.011 | 0.352 | 1214,274 | 52 by 88 |
| 1274 | 10.8 | 0.65 | 0.63 | 1.02 | 1.03 | 1.02 | 0.023 | 3.39 | 3,6 | 9.8 | 19.3 | 0.32 | 1.03 | 0.350 | 0.348 | 1.005 | 0.358 | 1102,138 | 76 by 68 |
| 1274 + 1/2 | 11.4 | 0.65 | 0.64 | 1.01 | 0.97 | 0.97 | 0.039 | 2.46 | 2,4 | 9.8 | 15.8 | 0.33 | 1.00 | 0.353 | 0.356 | 0.990 | 0.364 | 1074,510 | 64 by 60 |
| 1275 | 11.8 | 0.65 | 0.64 | 1.01 | 1.02 | 1.01 | 0.025 | 2.81 | 2,4 | 9.7 | 16.5 | 0.33 | 0.99 | 0.362 | 0.362 | 1.002 | 0.371 | 1134,130 | 60 by 56 |
| 1275 + 1/2 | 12.2 | 0.64 | 0.65 | 0.99 | 0.98 | 0.98 | 0.033 | 3.44 | 2,4 | 9.9 | 14.8 | 0.33 | 0.98 | 0.371 | 0.377 | 0.983 | 0.378 | 1198,258 | 60 by 60 |
| 1276 | 12.7 | 0.64 | 0.65 | 0.99 | 0.97 | 0.97 | 0.044 | 3.61 | 2,4 | 10.3 | 13.8 | 0.34 | 0.94 | 0.392 | 0.386 | 1.014 | 0.385 | 1190,278 | 56 by 68 |
| 1276 + 1/2 | 13.2 | 0.64 | 0.65 | 1.00 | 0.98 | 0.98 | 0.051 | 4.16 | 2,4 | 10.9 | 14.8 | 0.34 | 0.93 | 0.402 | 0.401 | 1.001 | 0.393 | 1142,350 | 68 by 60 |
| 1277 | 13.4 | 0.64 | 0.65 | 0.98 | 0.95 | 0.95 | 0.054 | 3.54 | 2,4 | 11.7 | 12.5 | 0.34 | 0.93 | 0.411 | 0.416 | 0.987 | 0.400 | 1042,310 | 56 by 60 |
| 1277 + 1/2 | 13.9 | 0.65 | 0.65 | 1.01 | 0.96 | 0.96 | 0.070 | 4.24 | 2,4 | 12.7 | 13.7 | 0.35 | 0.91 | 0.431 | 0.430 | 1.003 | 0.408 | 1182,270 | 72 by 72 |
| 1278 | 14.2 | 0.66 | 0.65 | 1.01 | 0.99 | 0.99 | 0.066 | 4.12 | 2,4 | 13.7 | 15.9 | 0.35 | 0.93 | 0.449 | 0.454 | 0.988 | 0.416 | 1146,338 | 92 by 80 |
| 1278 + 1/2 | 14.5 | 0.65 | 0.66 | 0.99 | 0.98 | 0.98 | 0.069 | 2.51 | 2,4 | 14.8 | 17.6 | 0.35 | 0.93 | 0.477 | 0.474 | 1.007 | 0.424 | 1074,114 | 84 by 76 |
| 1279 | 14.6 | 0.66 | 0.66 | 0.99 | 0.99 | 0.99 | 0.082 | 2.25 | 11,8 | 15.8 | 19.2 | 0.36 | 0.93 | 0.499 | 0.498 | 1.002 | 0.433 | 1018,286 | 56 by 56 |
| 1279 + 1/2 | 15.2 | 0.67 | 0.67 | 1.00 | 0.98 | 0.98 | 0.100 | 2.45 | 11,8 | 17.0 | 20.6 | 0.36 | 0.93 | 0.519 | 0.522 | 0.995 | 0.442 | 1142,314 | 100 by 124 |
| 1280 | 15.1 | 0.68 | 0.69 | 0.99 | 0.98 | 0.98 | 0.103 | 2.60 | 11,8 | 18.3 | 22.2 | 0.36 | 0.94 | 0.545 | 0.545 | 1.000 | 0.450 | 1170,250 | 52 by 56 |
| 1280 + 1/2 | 15.7 | 0.71 | 0.70 | 1.01 | 1.03 | 1.01 | 0.072 | 2.99 | 1,5 | 19.4 | 23.2 | 0.36 | 0.97 | 0.571 | 0.565 | 1.011 | 0.459 | 1086,442 | 60 by 56 |
| 1281 | 15.1 | 0.72 | 0.72 | 0.99 | 0.97 | 0.97 | 0.094 | 3.14 | 1,5 | 20.5 | 24.0 | 0.36 | 1.01 | 0.585 | 0.595 | 0.982 | 0.469 | 582,578 | 96 by 80 |
| 1281 + 1/2 | 16.0 | 0.74 | 0.74 | 1.00 | 1.01 | 1.00 | 0.107 | 3.48 | 1,5 | 21.9 | 24.8 | 0.35 | 1.01 | 0.619 | 0.610 | 1.015 | 0.479 | 1166,230 | 56 by 64 |
| 1282 | 16.2 | 0.76 | 0.77 | 0.99 | 0.99 | 0.99 | 0.126 | 3.18 | 11,8 | 23.2 | 26.1 | 0.35 | 1.02 | 0.635 | 0.639 | 0.994 | 0.489 | 282,534 | 40 by 72 |
| 1282 + 1/2 | 17.4 | 0.80 | 0.78 | 1.02 | 1.00 | 1.00 | 0.124 | 3.25 | 1,6 | 24.5 | 27.0 | 0.35 | 0.99 | 0.659 | 0.669 | 0.986 | 0.499 | 978,994 | 56 by 64 |
| 1283 | 16.2 | 0.81 | 0.81 | 0.99 | 1.03 | 0.99 | 0.130 | 2.59 | 0,5 | 25.8 | 28.0 | 0.35 | 1.00 | 0.702 | 0.703 | 0.998 | 0.510 | 1114,306 | 60 by 68 |
| 1283 + 1/2 | 18.1 | 0.83 | 0.83 | 1.00 | 0.99 | 0.99 | 0.137 | 2.99 | 0,6 | 27.4 | 29.7 | 0.34 | 0.99 | 0.747 | 0.756 | 0.988 | 0.521 | 730,854 | 148 by 92 |
| 1284 | 17.1 | 0.85 | 0.85 | 1.00 | 0.97 | 0.97 | 0.143 | 2.28 | 0,7 | 27.1 | 47.7 | 0.34 | 0.98 | 0.810 | 0.809 | 1.001 | 0.532 | 950,794 | 60 by 76 |
| 1284 + 1/2 | 18.0 | 0.88 | 0.87 | 1.01 | 1.01 | 1.01 | 0.137 | 2.94 | 0,7 | 28.2 | 44.3 | 0.34 | 0.98 | 0.871 | 0.870 | 1.001 | 0.543 | 734,922 | 156 by 124 |
| 1285 | 18.4 | 0.90 | 0.88 | 1.03 | 1.00 | 1.00 | 0.151 | 2.78 | 5,7 | 27.4 | 29.7 | 0.33 | 0.99 | 0.930 | 0.925 | 1.006 | 0.556 | 706,962 | 228 by 204 |
| 1285 + 1/2 | 17.7 | 0.91 | 0.89 | 1.02 | 1.00 | 1.00 | 0.129 | 2.90 | 0,7 | 28.2 | 35.6 | 0.33 | 1.01 | 0.979 | 0.972 | 1.007 | 0.567 | 686,986 | 148 by 144 |
| 1286 | 19.2 | 0.89 | 0.91 | 0.98 | 1.00 | 0.98 | 0.155 | 2.45 | 5,8 | 29.1 | 29.8 | 0.33 | 0.99 | 1.014 | 1.009 | 1.005 | 0.580 | 678,1026 | 132 by 132 |
| 1286 + 1/2 | 19.3 | 0.89 | 0.91 | 0.97 | 1.01 | 0.97 | 0.106 | 2.18 | 5,8 | 30.1 | 30.9 | 0.32 | 1.00 | 1.040 | 1.051 | 0.989 | 0.592 | 86,706 | 48 by 56 |
| 1287 | 19.7 | 0.92 | 0.91 | 1.01 | 1.01 | 1.01 | 0.114 | 2.00 | 4,7 | 31.2 | 32.1 | 0.32 | 0.99 | 1.088 | 1.073 | 1.014 | 0.605 | 58,842 | 48 by 256 |
| 1287 + 1/2 | 20.4 | 0.92 | 0.93 | 0.99 | 0.98 | 0.98 | 0.152 | 1.58 | 4,7 | 32.2 | 33.2 | 0.32 | 0.98 | 1.106 | 1.115 | 0.991 | 0.615 | 394,1010 | 156 by 160 |
| 1288 | 19.4 | 0.94 | 0.94 | 1.00 | 1.02 | 1.00 | 0.153 | 1.69 | 13,7 | 33.1 | 34.5 | 0.32 | 1.00 | 1.142 | 1.138 | 1.004 | 0.622 | 482,938 | 68 by 80 |
| 1288 + 1/2 | 20.7 | 0.96 | 0.96 | 0.99 | 0.98 | 0.98 | 0.138 | 1.68 | 13,7 | 33.9 | 35.3 | 0.31 | 1.00 | 1.169 | 1.172 | 0.997 | 0.627 | 450,898 | 156 by 112 |
| 1289 | 19.5 | 0.98 | 0.99 | 1.00 | 1.01 | 1.00 | 0.094 | 1.63 | 13,7 | 34.6 | 36.3 | 0.31 | 1.00 | 1.202 | 1.208 | 0.995 | 0.633 | 482,1030 | 60 by 56 |
| 1289 + 1/2 | 20.5 | 1.02 | 1.02 | 1.00 | 1.00 | 1.00 | 0.098 | 1.72 | 13,8 | 35.2 | 36.0 | 0.31 | 1.02 | 1.247 | 1.239 | 1.007 | 0.637 | 406,950 | 80 by 60 |
| 1290 | 20.7 | 1.05 | 1.05 | 1.00 | 1.00 | 1.00 | 0.074 | 1.90 | 13,8 | 35.8 | 36.7 | 0.31 | 1.00 | 1.276 | 1.276 | 1.000 | 0.642 | 430,990 | 108 by 92 |
| 1290 + 1/2 | 20.8 | 1.07 | 1.07 | 1.00 | 1.00 | 1.00 | 0.064 | 1.41 | 13,8 | 36.2 | 39.7 | 0.31 | 1.04 | 1.305 | 1.312 | 0.995 | 0.647 | 298,942 | 64 by 72 |
| 1291 | 21.3 | 1.10 | 1.10 | 1.00 | 1.00 | 1.00 | 0.080 | 1.62 | 2,8 | 36.4 | 37.4 | 0.31 | 1.04 | 1.348 | 1.342 | 1.004 | 0.651 | 246,962 | 84 by 104 |
| 1291 + 1/2 | 22.4 | 1.13 | 1.13 | 1.00 | 0.99 | 0.99 | 0.109 | 1.69 | 2,8 | 36.5 | 37.6 | 0.31 | 1.05 | 1.379 | 1.383 | 0.997 | 0.656 | 230,970 | 68 by 76 |
| 1292 | 21.5 | 1.16 | 1.16 | 1.00 | 1.01 | 1.00 | 0.077 | 1.44 | 13,4 | 36.5 | 37.6 | 0.31 | 1.05 | 1.419 | 1.419 | 1.000 | 0.660 | 90,1042 | 48 by 36 |
| 1292 + 1/2 | 21.9 | 1.19 | 1.18 | 1.01 | 1.01 | 1.01 | 0.111 | 1.48 | 1,8 | 36.3 | 37.9 | 0.31 | 1.05 | 1.458 | 1.456 | 1.002 | 0.663 | 114,978 | 88 by 124 |
| 1293 | 22.5 | 1.23 | 1.17 | 1.04 | 1.03 | 1.03 | 0.128 | 1.32 | 1,8 | 35.8 | 36.7 | 0.31 | 1.03 | 1.494 | 1.488 | 1.004 | 0.667 | 126,990 | 92 by 112 |
| 1293 + 1/2 | 24.4 | 1.25 | 1.17 | 1.06 | 1.05 | 1.05 | 0.150 | 1.41 | 0,1 | 35.3 | 36.3 | 0.31 | 1.00 | 1.518 | 1.526 | 0.995 | 0.671 | 70,362 | 64 by 68 |
| 1294 | 23.0 | 1.28 | 1.17 | 1.09 | 1.08 | 1.08 | 0.122 | 1.43 | 7,8 | 34.6 | 35.7 | 0.31 | 0.98 | 1.558 | 1.557 | 1.000 | 0.675 | 498,1006 | 140 by 216 |
| 1294 + 1/2 | 22.5 | 1.31 | 1.17 | 1.11 | 1.11 | 1.11 | 0.108 | 1.48 | 5,6 | 33.9 | 35.7 | 0.31 | 0.98 | 1.597 | 1.596 | 1.001 | 0.678 | 74,310 | 84 by 72 |
| 1295 | 23.1 | 1.35 | 1.17 | 1.15 | 1.16 | 1.15 | 0.096 | 1.52 | 5,6 | 33.2 | 35.4 | 0.31 | 0.99 | 1.634 | 1.621 | 1.008 | 0.681 | 162,406 | 60 by 60 |
| 1295 + 1/2 | 24.3 | 1.36 | 1.17 | 1.16 | 1.17 | 1.16 | 0.074 | 1.50 | 6,8 | 32.7 | 35.1 | 0.31 | 1.00 | 1.646 | 1.645 | 1.000 | 0.685 | 310,990 | 120 by 196 |
| 1296 | 24.1 | 1.39 | 1.17 | 1.19 | 1.20 | 1.19 | 0.078 | 1.62 | 13,6 | 32.4 | 38.5 | 0.30 | 1.02 | 1.667 | 1.640 | 1.016 | 0.688 | 270,938 | 80 by 128 |
| 1296 + 1/2 | 24.4 | 1.39 | 1.17 | 1.18 | 1.20 | 1.18 | 0.074 | 1.75 | 13,6 | 32.7 | 35.5 | 0.31 | 1.03 | 1.656 | 1.639 | 1.010 | 0.692 | 250,918 | 156 by 204 |
| 1297 | 23.6 | 1.38 | 1.17 | 1.17 | 1.18 | 1.17 | 0.091 | 2.04 | 14,7 | 32.8 | 38.6 | 0.31 | 1.03 | 1.633 | 1.630 | 1.002 | 0.696 | 198,926 | 68 by 64 |
| 1297 + 1/2 | 24.1 | 1.36 | 1.17 | 1.16 | 1.16 | 1.16 | 0.084 | 2.20 | 14,7 | 32.8 | 37.0 | 0.31 | 1.04 | 1.604 | 1.603 | 1.001 | 0.699 | 134,934 | 84 by 148 |
| 1298 | 24.4 | 1.35 | 1.17 | 1.15 | 1.14 | 1.14 | 0.138 | 2.11 | 14,7 | 33.7 | 37.9 | 0.31 | 1.02 | 1.572 | 1.566 | 1.004 | 0.703 | 94,946 | 44 by 52 |
| 1298 + 1/2 | 25.2 | 1.33 | 1.17 | 1.13 | 1.14 | 1.13 | 0.087 | 2.14 | 14,7 | 34.4 | 40.3 | 0.31 | 1.03 | 1.529 | 1.531 | 0.999 | 0.707 | 690,922 | 72 by 88 |
| 1299 | 24.8 | 1.30 | 1.17 | 1.10 | 1.10 | 1.10 | 0.102 | 2.26 | 14,7 | 35.4 | 42.9 | 0.31 | 1.02 | 1.489 | 1.487 | 1.002 | 0.711 | 366,986 | 112 by 64 |
| 1299 + 1/2 | 23.6 | 1.27 | 1.17 | 1.08 | 1.09 | 1.08 | 0.091 | 2.32 | 14,7 | 37.1 | 45.6 | 0.31 | 1.04 | 1.445 | 1.437 | 1.005 | 0.714 | 626,958 | 72 by 104 |
| 1300 | 24.2 | 1.23 | 1.17 | 1.05 | 1.04 | 1.04 | 0.105 | 1.87 | 14,7 | 39.0 | 48.4 | 0.31 | 1.02 | 1.385 | 1.389 | 0.998 | 0.719 | 578,962 | 68 by 96 |
| 1300 + 1/2 | 24.5 | 1.20 | 1.17 | 1.02 | 1.02 | 1.02 | 0.102 | 1.89 | 14,6 | 41.0 | 51.2 | 0.31 | 1.02 | 1.332 | 1.328 | 1.003 | 0.723 | 54,198 | 40 by 56 |
| 1301 | 23.6 | 1.15 | 1.14 | 1.01 | 1.01 | 1.01 | 0.115 | 1.79 | 14,6 | 42.8 | 54.0 | 0.31 | 1.01 | 1.271 | 1.260 | 1.008 | 0.726 | 198,886 | 156 by 136 |
| 1301 + 1/2 | 23.9 | 1.09 | 1.10 | 0.99 | 1.00 | 0.99 | 0.099 | 1.78 | 14,6 | 44.7 | 56.7 | 0.31 | 1.00 | 1.189 | 1.197 | 0.993 | 0.729 | 1538,1018 | 156 by 60 |
| 1302 | 23.7 | 1.05 | 1.05 | 1.01 | 0.99 | 0.99 | 0.113 | 1.54 | 13,4 | 46.7 | 59.2 | 0.31 | 0.98 | 1.123 | 1.115 | 1.007 | 0.730 | 234,62 | 64 by 48 |
| 1302 + 1/2 | 24.1 | 1.00 | 1.02 | 0.98 | 1.00 | 0.98 | 0.100 | 1.68 | 15,6 | 48.7 | 61.7 | 0.31 | 1.00 | 1.042 | 1.042 | 0.999 | 0.732 | 122,970 | 72 by 104 |
| 1303 | 23.2 | 0.95 | 1.01 | 0.94 | 0.95 | 0.94 | 0.115 | 1.57 | 15,6 | 50.6 | 63.7 | 0.31 | 0.98 | 0.962 | 0.964 | 0.997 | 0.732 | 278,590 | 68 by 56 |
| 1303 + 1/2 | 23.9 | 0.91 | 1.01 | 0.91 | 0.90 | 0.90 | 0.107 | 1.44 | 15,6 | 52.5 | 65.3 | 0.31 | 0.97 | 0.887 | 0.886 | 1.001 | 0.733 | 466,34 | 76 by 36 |
| 1304 | 24.2 | 0.85 | 1.01 | 0.84 | 0.88 | 0.84 | 0.074 | 1.31 | 2,0 | 54.1 | 66.8 | 0.31 | 0.96 | 0.811 | 0.817 | 0.993 | 0.733 | 186,578 | 72 by 64 |
| 1304 + 1/2 | 22.9 | 0.79 | 1.01 | 0.78 | 0.79 | 0.78 | 0.123 | 1.30 | 14,4 | 55.3 | 67.7 | 0.31 | 0.93 | 0.746 | 0.750 | 0.995 | 0.733 | 586,270 | 76 by 56 |
| 1305 | 23.5 | 0.75 | 1.01 | 0.74 | 0.71 | 0.71 | 0.133 | 1.41 | 14,4 | 56.2 | 68.0 | 0.31 | 0.91 | 0.689 | 0.701 | 0.984 | 0.733 | 106,570 | 64 by 56 |
| 1305 + 1/2 | 23.3 | 0.71 | 1.01 | 0.70 | 0.67 | 0.67 | 0.123 | 1.23 | 10,3 | 57.0 | 68.0 | 0.31 | 0.89 | 0.656 | 0.665 | 0.986 | 0.734 | 1370,510 | 80 by 68 |
| 1306 | 24.2 | 0.69 | 1.01 | 0.69 | 0.66 | 0.66 | 0.128 | 1.36 | 14,4 | 57.3 | 67.4 | 0.31 | 0.87 | 0.641 | 0.666 | 0.963 | 0.733 | 826,86 | 76 by 44 |
| 1306 + 1/2 | 22.9 | 0.70 | 1.01 | 0.70 | 0.68 | 0.68 | 0.124 | 1.46 | 14,4 | 57.2 | 66.4 | 0.31 | 0.88 | 0.641 | 0.666 | 0.962 | 0.732 | 778,78 | 60 by 40 |
| 1307 | 24.0 | 0.72 | 1.01 | 0.72 | 0.73 | 0.72 | 0.108 | 1.25 | 11,4 | 56.7 | 64.9 | 0.31 | 0.90 | 0.676 | 0.683 | 0.990 | 0.732 | 1422,526 | 80 by 64 |
| 1307 + 1/2 | 24.1 | 0.77 | 1.01 | 0.76 | 0.79 | 0.76 | 0.121 | 1.39 | 3,0 | 55.8 | 63.1 | 0.31 | 0.91 | 0.725 | 0.735 | 0.986 | 0.731 | 1482,978 | 60 by 56 |
| 1308 | 23.8 | 0.82 | 1.01 | 0.81 | 0.82 | 0.81 | 0.121 | 1.28 | 12,8 | 54.6 | 61.1 | 0.31 | 0.92 | 0.794 | 0.798 | 0.995 | 0.730 | 878,110 | 64 by 40 |
| 1308 + 1/2 | 23.7 | 0.88 | 1.01 | 0.87 | 0.91 | 0.87 | 0.090 | 1.41 | 11,8 | 53.2 | 59.2 | 0.31 | 0.97 | 0.871 | 0.869 | 1.003 | 0.728 | 894,574 | 56 by 100 |
| 1309 | 23.6 | 0.93 | 1.01 | 0.92 | 0.98 | 0.92 | 0.118 | 1.67 | 11,8 | 51.9 | 57.3 | 0.30 | 0.98 | 0.943 | 0.912 | 1.034 | 0.728 | 810,110 | 52 by 40 |
| 1309 + 1/2 | 22.8 | 0.94 | 1.01 | 0.93 | 0.95 | 0.93 | 0.143 | 1.51 | 11,8 | 50.7 | 55.6 | 0.30 | 0.98 | 0.953 | 0.961 | 0.992 | 0.727 | 422,110 | 64 by 40 |
| 1310 | 22.6 | 0.96 | 1.01 | 0.95 | 0.97 | 0.95 | 0.152 | 1.56 | 5,8 | 49.8 | 54.1 | 0.30 | 0.99 | 0.979 | 0.975 | 1.004 | 0.724 | 874,126 | 68 by 40 |
| 1310 + 1/2 | 24.2 | 0.98 | 1.01 | 0.98 | 0.99 | 0.98 | 0.144 | 1.71 | 3,4 | 49.2 | 52.6 | 0.30 | 0.98 | 0.997 | 0.999 | 0.998 | 0.723 | 430,226 | 84 by 56 |
| 1311 | 24.0 | 1.01 | 1.00 | 1.02 | 1.00 | 1.00 | 0.158 | 1.97 | 13,5 | 48.9 | 51.7 | 0.30 | 0.98 | 1.019 | 1.012 | 1.006 | 0.720 | 442,230 | 56 by 52 |
| 1311 + 1/2 | 23.3 | 1.01 | 1.02 | 0.99 | 1.03 | 0.99 | 0.139 | 1.85 | 3,5 | 49.5 | 56.3 | 0.30 | 1.00 | 1.028 | 1.032 | 0.996 | 0.719 | 626,146 | 100 by 68 |
| 1312 | 23.3 | 1.03 | 1.03 | 0.99 | 0.95 | 0.95 | 0.174 | 1.96 | 13,5 | 51.8 | 59.2 | 0.30 | 0.96 | 1.046 | 1.044 | 1.002 | 0.717 | 646,150 | 60 by 68 |
| 1312 + 1/2 | 24.2 | 1.05 | 1.06 | 1.00 | 0.99 | 0.99 | 0.126 | 1.95 | 2,5 | 53.0 | 62.8 | 0.30 | 0.99 | 1.060 | 1.059 | 1.001 | 0.714 | 790,646 | 56 by 68 |
| 1313 | 25.6 | 1.09 | 1.10 | 0.99 | 1.02 | 0.99 | 0.115 | 1.85 | 14,5 | 54.9 | 67.1 | 0.30 | 0.99 | 1.072 | 1.067 | 1.004 | 0.711 | 682,170 | 60 by 60 |
| 1313 + 1/2 | 25.0 | 1.14 | 1.14 | 1.00 | 0.96 | 0.96 | 0.117 | 1.87 | 2,5 | 56.9 | 70.5 | 0.30 | 0.98 | 1.078 | 1.068 | 1.010 | 0.709 | 714,178 | 52 by 84 |
| 1314 | 26.8 | 1.18 | 1.20 | 0.98 | 1.02 | 0.98 | 0.079 | 1.86 | 4,8 | 57.4 | 73.6 | 0.30 | 1.00 | 1.075 | 1.068 | 1.007 | 0.706 | 1198,870 | 56 by 60 |
| 1314 + 1/2 | 25.2 | 1.27 | 1.25 | 1.01 | 1.07 | 1.01 | 0.037 | 2.29 | 7,0 | 53.5 | 72.3 | 0.30 | 1.02 | 1.063 | 1.052 | 1.011 | 0.703 | 482,1018 | 64 by 48 |
| 1315 | 25.1 | 1.32 | 1.33 | 0.99 | 0.99 | 0.99 | 0.069 | 2.24 | 8,0 | 53.4 | 74.1 | 0.30 | 1.05 | 1.030 | 1.037 | 0.993 | 0.701 | 1790,662 | 72 by 100 |
| 1315 + 1/2 | 26.0 | 1.40 | 1.34 | 1.04 | 0.99 | 0.99 | 0.071 | 2.87 | 8,0 | 54.2 | 74.6 | 0.30 | 1.05 | 1.010 | 1.012 | 0.998 | 0.698 | 674,658 | 48 by 64 |
| 1316 | 25.1 | 1.40 | 1.34 | 1.05 | 1.00 | 1.00 | 0.055 | 3.24 | 8,0 | 54.5 | 72.3 | 0.31 | 1.05 | 0.993 | 1.002 | 0.991 | 0.694 | 1854,666 | 36 by 76 |
| 1316 + 1/2 | 25.7 | 1.40 | 1.34 | 1.04 | 1.00 | 1.00 | 0.071 | 2.79 | 8,0 | 51.2 | 68.3 | 0.31 | 1.04 | 0.995 | 0.991 | 1.003 | 0.692 | 758,782 | 64 by 60 |
| 1317 | 24.8 | 1.44 | 1.34 | 1.07 | 1.00 | 1.00 | 0.079 | 2.70 | 8,0 | 53.8 | 67.1 | 0.31 | 1.03 | 0.990 | 0.994 | 0.996 | 0.689 | 626,646 | 56 by 60 |
| 1317 + 1/2 | 24.2 | 1.51 | 1.34 | 1.13 | 1.08 | 1.08 | 0.066 | 3.54 | 8,0 | 53.5 | 68.4 | 0.32 | 1.06 | 0.988 | 0.993 | 0.995 | 0.685 | 1306,946 | 164 by 112 |
| 1318 | 24.7 | 1.54 | 1.34 | 1.15 | 1.05 | 1.05 | 0.099 | 3.42 | 8,0 | 52.7 | 65.1 | 0.32 | 1.03 | 0.996 | 0.990 | 1.005 | 0.683 | 578,666 | 80 by 92 |
| 1318 + 1/2 | 24.1 | 1.57 | 1.34 | 1.17 | 1.08 | 1.08 | 0.085 | 3.22 | 9,0 | 53.4 | 63.9 | 0.32 | 1.04 | 0.992 | 0.993 | 0.998 | 0.679 | 554,650 | 56 by 60 |
| 1319 | 24.0 | 1.63 | 1.34 | 1.21 | 1.09 | 1.09 | 0.095 | 3.31 | 9,0 | 52.9 | 63.3 | 0.32 | 1.02 | 0.991 | 0.999 | 0.992 | 0.677 | 1258,794 | 80 by 48 |
| 1319 + 1/2 | 23.6 | 1.64 | 1.34 | 1.22 | 1.08 | 1.08 | 0.115 | 3.12 | 9,0 | 51.5 | 67.2 | 0.33 | 1.00 | 1.002 | 0.997 | 1.005 | 0.674 | 598,838 | 64 by 60 |
| 1320 | 23.2 | 1.58 | 1.34 | 1.18 | 1.21 | 1.18 | 0.046 | 2.73 | 3,1 | 53.1 | 77.1 | 0.33 | 1.08 | 1.002 | 1.003 | 0.999 | 0.671 | 1462,1018 | 140 by 64 |
| 1320 + 1/2 | 22.5 | 1.59 | 1.34 | 1.19 | 1.15 | 1.15 | 0.068 | 2.87 | 3,1 | 52.5 | 63.9 | 0.33 | 1.03 | 1.016 | 1.003 | 1.013 | 0.669 | 766,854 | 68 by 56 |
| 1321 | 22.2 | 1.55 | 1.34 | 1.16 | 1.19 | 1.16 | 0.051 | 2.96 | 3,1 | 50.6 | 62.9 | 0.33 | 1.05 | 1.004 | 1.009 | 0.995 | 0.665 | 506,866 | 60 by 60 |
| 1321 + 1/2 | 21.5 | 1.50 | 1.34 | 1.12 | 1.09 | 1.09 | 0.070 | 2.31 | 3,1 | 47.9 | 59.6 | 0.34 | 0.99 | 1.007 | 1.013 | 0.994 | 0.663 | 710,874 | 80 by 52 |
| 1322 | 21.2 | 1.49 | 1.34 | 1.11 | 1.15 | 1.11 | 0.035 | 2.12 | 3,1 | 44.5 | 55.3 | 0.34 | 1.02 | 1.011 | 1.017 | 0.994 | 0.661 | 1290,886 | 68 by 52 |
| 1322 + 1/2 | 20.9 | 1.46 | 1.34 | 1.09 | 1.13 | 1.09 | 0.043 | 2.01 | 12,3 | 46.3 | 62.3 | 0.34 | 1.00 | 1.026 | 1.020 | 1.006 | 0.658 | 658,898 | 84 by 52 |
| 1323 | 20.6 | 1.40 | 1.34 | 1.05 | 1.04 | 1.04 | 0.070 | 2.47 | 12,3 | 42.1 | 65.2 | 0.35 | 0.99 | 1.029 | 1.030 | 0.999 | 0.655 | 322,702 | 64 by 52 |
| 1323 + 1/2 | 20.1 | 1.35 | 1.35 | 1.00 | 1.03 | 1.00 | 0.059 | 2.97 | 12,3 | 40.8 | 60.9 | 0.35 | 1.00 | 1.034 | 1.038 | 0.996 | 0.652 | 610,922 | 104 by 56 |
| 1324 | 19.7 | 1.31 | 1.33 | 0.99 | 1.00 | 0.99 | 0.056 | 3.30 | 12,3 | 39.1 | 56.2 | 0.36 | 0.99 | 1.047 | 1.047 | 1.000 | 0.650 | 1530,418 | 72 by 76 |
| 1324 + 1/2 | 19.3 | 1.30 | 1.30 | 1.00 | 1.01 | 1.00 | 0.051 | 3.08 | 12,3 | 36.0 | 49.2 | 0.36 | 1.00 | 1.061 | 1.066 | 0.995 | 0.647 | 1550,414 | 124 by 100 |
| 1325 | 19.0 | 1.29 | 1.28 | 1.01 | 1.01 | 1.01 | 0.045 | 3.67 | 3,4 | 32.1 | 47.9 | 0.36 | 1.00 | 1.085 | 1.065 | 1.020 | 0.645 | 418,590 | 156 by 116 |
| 1325 + 1/2 | 18.6 | 1.25 | 1.25 | 1.00 | 1.00 | 1.00 | 0.048 | 3.84 | 3,4 | 29.9 | 44.8 | 0.37 | 0.99 | 1.092 | 1.065 | 1.026 | 0.642 | 278,654 | 96 by 72 |
| 1326 | 18.2 | 1.21 | 1.21 | 1.00 | 1.01 | 1.00 | 0.034 | 2.85 | 2,5 | 27.2 | 42.1 | 0.37 | 0.99 | 1.068 | 1.071 | 0.997 | 0.640 | 250,658 | 80 by 80 |
| 1326 + 1/2 | 17.8 | 1.18 | 1.18 | 1.00 | 1.00 | 1.00 | 0.029 | 4.06 | 1,4 | 24.8 | 41.0 | 0.38 | 1.01 | 1.058 | 1.055 | 1.003 | 0.637 | 370,446 | 104 by 60 |
| 1327 | 17.5 | 1.15 | 1.14 | 1.01 | 1.02 | 1.01 | 0.026 | 5.30 | 1,4 | 23.9 | 38.6 | 0.38 | 1.00 | 1.041 | 1.031 | 1.010 | 0.634 | 170,510 | 288 by 140 |
| 1327 + 1/2 | 17.2 | 1.10 | 1.09 | 1.01 | 0.99 | 0.99 | 0.031 | 4.54 | 0,4 | 21.6 | 30.0 | 0.39 | 0.99 | 1.004 | 0.981 | 1.023 | 0.631 | 158,490 | 276 by 156 |
| 1328 | 16.8 | 1.03 | 1.02 | 1.01 | 1.00 | 1.00 | 0.029 | 3.42 | 0,4 | 20.7 | 25.1 | 0.39 | 1.00 | 0.920 | 0.925 | 0.995 | 0.629 | 46,486 | 140 by 72 |
| 1328 + 1/2 | 16.4 | 0.95 | 0.95 | 1.00 | 1.00 | 1.00 | 0.020 | 2.00 | 0,3 | 20.2 | 24.5 | 0.40 | 1.00 | 0.847 | 0.853 | 0.993 | 0.627 | 38,462 | 180 by 84 |
| 1329 | 15.9 | 0.87 | 0.88 | 0.99 | 0.99 | 0.99 | 0.016 | 1.67 | 0,7 | 19.8 | 25.0 | 0.40 | 0.99 | 0.786 | 0.791 | 0.993 | 0.625 | 26,442 | 192 by 76 |
| 1329 + 1/2 | 15.5 | 0.81 | 0.81 | 1.00 | 1.00 | 1.00 | 0.012 | 1.48 | 6,8 | 19.3 | 24.3 | 0.40 | 0.99 | 0.735 | 0.739 | 0.995 | 0.623 | 1850,414 | 76 by 68 |
| 1330 | 15.1 | 0.75 | 0.76 | 0.99 | 0.99 | 0.99 | 0.012 | 1.41 | 5,6 | 18.8 | 23.7 | 0.41 | 1.00 | 0.693 | 0.705 | 0.983 | 0.620 | 1862,406 | 44 by 40 |
| 1330 + 1/2 | 14.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.010 | 1.45 | 8,8 | 18.2 | 23.0 | 0.41 | 1.00 | 0.675 | 0.670 | 1.007 | 0.618 | 446,918 | 64 by 104 |
| 1331 | 14.2 | 0.68 | 0.68 | 0.99 | 0.99 | 0.99 | 0.011 | 1.45 | 3,7 | 17.4 | 22.0 | 0.42 | 0.99 | 0.647 | 0.652 | 0.991 | 0.617 | 426,930 | 68 by 104 |
| 1331 + 1/2 | 13.7 | 0.65 | 0.65 | 1.00 | 1.00 | 1.00 | 0.011 | 1.65 | 12,7 | 16.3 | 23.2 | 0.42 | 1.01 | 0.630 | 0.629 | 1.002 | 0.614 | 394,934 | 68 by 104 |
| 1332 | 13.3 | 0.62 | 0.63 | 1.00 | 0.99 | 0.99 | 0.012 | 1.37 | 4,7 | 15.2 | 19.6 | 0.43 | 1.00 | 0.611 | 0.610 | 1.002 | 0.612 | 370,938 | 68 by 88 |
| 1332 + 1/2 | 12.9 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.012 | 1.61 | 12,7 | 14.2 | 16.0 | 0.43 | 1.00 | 0.590 | 0.594 | 0.993 | 0.611 | 346,946 | 72 by 100 |
| 1333 | 12.5 | 0.58 | 0.58 | 1.00 | 0.99 | 0.99 | 0.019 | 1.39 | 4,7 | 13.3 | 14.9 | 0.44 | 1.00 | 0.576 | 0.575 | 1.002 | 0.609 | 322,950 | 72 by 112 |
| 1333 + 1/2 | 12.0 | 0.56 | 0.56 | 1.00 | 1.01 | 1.00 | 0.011 | 1.37 | 2,7 | 12.5 | 13.8 | 0.44 | 0.99 | 0.560 | 0.558 | 1.003 | 0.608 | 294,954 | 64 by 96 |
| 1334 | 11.7 | 0.54 | 0.54 | 0.99 | 0.99 | 0.99 | 0.015 | 1.57 | 14,7 | 11.7 | 13.1 | 0.45 | 1.00 | 0.541 | 0.544 | 0.994 | 0.605 | 270,958 | 72 by 100 |
| 1334 + 1/2 | 11.2 | 0.53 | 0.53 | 1.00 | 1.01 | 1.00 | 0.007 | 1.64 | 14,7 | 10.9 | 12.7 | 0.45 | 1.00 | 0.529 | 0.526 | 1.004 | 0.604 | 242,962 | 64 by 108 |
| 1335 | 10.8 | 0.51 | 0.52 | 0.99 | 0.99 | 0.99 | 0.017 | 1.65 | 14,7 | 10.3 | 12.0 | 0.46 | 0.99 | 0.512 | 0.513 | 0.997 | 0.604 | 222,966 | 64 by 96 |
| 1335 + 1/2 | 10.3 | 0.50 | 0.50 | 1.00 | 1.00 | 1.00 | 0.018 | 1.63 | 14,7 | 9.2 | 10.9 | 0.47 | 1.00 | 0.498 | 0.499 | 0.999 | 0.603 | 190,962 | 68 by 132 |
| 1336 | 9.9 | 0.49 | 0.49 | 1.00 | 1.00 | 1.00 | 0.013 | 1.49 | 1,8 | 8.3 | 9.8 | 0.47 | 1.00 | 0.485 | 0.486 | 0.998 | 0.601 | 122,886 | 64 by 60 |
| 1336 + 1/2 | 9.4 | 0.48 | 0.47 | 1.01 | 1.01 | 1.01 | 0.012 | 1.92 | 14,8 | 7.4 | 8.8 | 0.48 | 0.99 | 0.474 | 0.468 | 1.012 | 0.601 | 146,966 | 68 by 124 |
| 1337 | 8.9 | 0.46 | 0.46 | 0.99 | 1.00 | 0.99 | 0.008 | 1.74 | 13,8 | 6.5 | 7.8 | 0.49 | 1.01 | 0.452 | 0.456 | 0.991 | 0.601 | 74,882 | 68 by 56 |
| 1337 + 1/2 | 8.5 | 0.44 | 0.44 | 1.01 | 1.00 | 1.00 | 0.010 | 1.92 | 0,8 | 5.8 | 6.9 | 0.50 | 0.99 | 0.437 | 0.431 | 1.014 | 0.599 | 102,966 | 100 by 212 |
| 1338 | 8.0 | 0.42 | 0.42 | 1.00 | 1.00 | 1.00 | 0.005 | 1.86 | 0,8 | 5.0 | 6.0 | 0.50 | 1.01 | 0.411 | 0.412 | 0.996 | 0.598 | 1686,1010 | 272 by 56 |
| 1338 + 1/2 | 7.6 | 0.40 | 0.40 | 1.00 | 1.00 | 1.00 | 0.004 | 1.58 | 0,8 | 4.4 | 5.3 | 0.51 | 0.99 | 0.388 | 0.392 | 0.989 | 0.597 | 58,1046 | 44 by 128 |
| 1339 | 7.1 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.005 | 1.52 | 13,8 | 3.9 | 5.2 | 0.52 | 1.00 | 0.374 | 0.373 | 1.001 | 0.597 | 1638,834 | 60 by 52 |
| 1339 + 1/2 | 6.6 | 0.37 | 0.37 | 1.00 | 1.00 | 1.00 | 0.007 | 1.66 | 13,8 | 3.3 | 5.1 | 0.52 | 1.00 | 0.358 | 0.361 | 0.994 | 0.596 | 1674,1046 | 84 by 32 |
| 1340 | 6.1 | 0.35 | 0.36 | 0.99 | 0.99 | 0.99 | 0.005 | 1.29 | 13,8 | 2.8 | 4.7 | 0.53 | 1.00 | 0.348 | 0.350 | 0.995 | 0.596 | 398,570 | 68 by 64 |
| 1340 + 1/2 | 5.6 | 0.34 | 0.34 | 1.00 | 1.01 | 1.00 | 0.000 | 1.53 | 13,7 | 2.3 | 4.7 | 0.54 | 1.01 | 0.341 | 0.341 | 1.000 | 0.596 | 1642,850 | 156 by 52 |
| 1341 | 5.1 | 0.33 | 0.33 | 1.00 | 1.00 | 1.00 | 0.000 | 1.43 | 13,7 | 2.0 | 4.5 | 0.55 | 0.99 | 0.334 | 0.330 | 1.011 | 0.595 | 1138,762 | 52 by 52 |
| 1341 + 1/2 | 4.6 | 0.32 | 0.33 | 0.98 | 0.98 | 0.98 | 0.003 | 1.20 | 15,6 | 1.7 | 4.3 | 0.55 | 0.99 | 0.319 | 0.324 | 0.986 | 0.597 | 630,1038 | 56 by 52 |
| 1342 | 4.1 | 0.31 | 0.32 | 0.98 | 0.98 | 0.98 | 0.000 | 1.50 | 13,7 | 1.6 | 4.3 | 0.56 | 1.00 | 0.314 | 0.317 | 0.990 | 0.597 | 1646,858 | 84 by 52 |
| 1342 + 1/2 | 3.7 | 0.32 | 0.30 | 1.06 | 1.06 | 1.06 | 0.000 | 2.22 | 0,3 | 1.5 | 4.0 | 0.56 | 1.01 | 0.315 | 0.302 | 1.041 | 0.598 | 194,1070 | 80 by 24 |
| 1343 | 3.2 | 0.29 | 0.30 | 0.97 | 0.97 | 0.97 | 0.000 | 1.42 | 13,7 | 1.5 | 3.8 | 0.57 | 1.00 | 0.290 | 0.299 | 0.970 | 0.598 | 1662,874 | 140 by 56 |
| 1343 + 1/2 | 2.9 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.37 | 12,7 | 1.3 | 3.7 | 0.57 | 1.01 | 0.285 | 0.285 | 0.999 | 0.600 | 1518,870 | 72 by 52 |
| 1344 | 2.4 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.29 | 13,7 | 1.3 | 3.4 | 0.57 | 1.01 | 0.280 | 0.281 | 0.995 | 0.601 | 1566,886 | 216 by 128 |
| 1344 + 1/2 | 2.1 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.61 | 13,7 | 1.2 | 3.2 | 0.58 | 1.00 | 0.278 | 0.278 | 1.000 | 0.604 | 1662,874 | 76 by 56 |
| 1345 | 1.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.31 | 12,7 | 1.1 | 3.2 | 0.58 | 1.01 | 0.276 | 0.273 | 1.010 | 0.606 | 1530,878 | 76 by 52 |
| 1345 + 1/2 | 1.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 15,8 | 1.1 | 3.0 | 0.58 | 1.01 | 0.269 | 0.272 | 0.988 | 0.607 | 1830,974 | 176 by 72 |
| 1346 | 1.2 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.31 | 13,7 | 1.0 | 3.0 | 0.58 | 1.00 | 0.268 | 0.268 | 1.000 | 0.609 | 1670,878 | 92 by 48 |
| 1346 + 1/2 | 1.0 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 13,7 | 1.0 | 2.9 | 0.58 | 0.99 | 0.267 | 0.268 | 0.997 | 0.609 | 1694,890 | 96 by 64 |
| 1347 | 0.8 | 0.26 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 15,8 | 0.9 | 2.9 | 0.58 | 0.98 | 0.267 | 0.266 | 1.005 | 0.609 | 1582,886 | 68 by 56 |
| 1347 + 1/2 | 0.8 | 0.26 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 14,8 | 1.0 | 2.8 | 0.58 | 0.98 | 0.265 | 0.265 | 0.998 | 0.609 | 1630,898 | 64 by 64 |
| 1348 | 0.7 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 4,8 | 1.0 | 2.7 | 0.58 | 0.98 | 0.264 | 0.265 | 0.999 | 0.609 | 570,1070 | 104 by 32 |
| 1348 + 1/2 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 4,8 | 0.9 | 2.8 | 0.58 | 0.99 | 0.264 | 0.264 | 1.001 | 0.609 | 566,1070 | 100 by 36 |
| 1349 | 0.7 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.07 | 4,8 | 0.9 | 2.7 | 0.59 | 0.99 | 0.263 | 0.264 | 0.998 | 0.609 | 254,686 | 72 by 60 |
| 1349 + 1/2 | 0.7 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.07 | 10,2 | 1.0 | 2.8 | 0.59 | 0.99 | 0.263 | 0.263 | 0.998 | 0.609 | 1622,890 | 132 by 68 |
| 1350 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 11,2 | 0.9 | 2.6 | 0.59 | 0.98 | 0.263 | 0.263 | 1.001 | 0.609 | 1686,898 | 104 by 80 |
| 1350 + 1/2 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 1,1 | 0.9 | 2.6 | 0.59 | 0.99 | 0.263 | 0.264 | 0.997 | 0.609 | 1082,990 | 96 by 88 |
| 1351 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.05 | 5,7 | 0.9 | 2.5 | 0.59 | 0.99 | 0.264 | 0.264 | 1.003 | 0.609 | 530,1070 | 68 by 28 |
| 1351 + 1/2 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 15,0 | 1.0 | 2.4 | 0.58 | 0.99 | 0.264 | 0.264 | 1.000 | 0.609 | 1626,898 | 224 by 104 |
| 1352 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 3,4 | 1.0 | 2.3 | 0.58 | 0.98 | 0.264 | 0.264 | 1.001 | 0.609 | 1746,906 | 64 by 60 |
| 1352 + 1/2 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 5,6 | 0.9 | 2.3 | 0.58 | 1.00 | 0.264 | 0.264 | 0.998 | 0.609 | 530,1070 | 56 by 20 |
| 1353 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 1,1 | 1.0 | 2.2 | 0.58 | 1.00 | 0.264 | 0.265 | 0.998 | 0.609 | 530,1070 | 52 by 24 |
| 1353 + 1/2 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 6,4 | 1.0 | 2.3 | 0.58 | 1.01 | 0.265 | 0.264 | 1.003 | 0.609 | 1710,898 | 144 by 56 |
| 1354 | 0.8 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 9,0 |  |  |  | 1.00 | 0.265 | 0.264 | 1.001 | 0.609 | 1714,910 | 120 by 64 |
| 1354 + 1/2 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 1,3 |  |  |  | 0.99 | 0.263 | 0.265 | 0.994 | 0.609 | 910,1070 | 68 by 36 |
| 1355 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 15,3 |  |  |  | 1.00 | 0.264 | 0.264 | 1.001 | 0.609 | 1590,906 | 104 by 64 |
| 1355 + 1/2 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 9,0 |  |  |  | 1.00 | 0.265 | 0.264 | 1.004 | 0.608 | 1726,918 | 120 by 56 |
| 1356 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 7,8 |  |  |  | 1.00 | 0.264 | 0.264 | 0.998 | 0.608 | 914,1070 | 80 by 32 |
| 1356 + 1/2 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 3,1 |  |  |  | 1.00 | 0.264 | 0.264 | 0.999 | 0.608 | 1570,910 | 136 by 72 |
| 1357 | 0.7 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 6,8 |  |  |  | 1.00 | 0.263 | 0.264 | 0.997 | 0.608 | 1638,918 | 120 by 104 |
| 1357 + 1/2 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 14,7 |  |  |  | 1.00 | 0.264 | 0.264 | 1.002 | 0.608 | 1646,910 | 132 by 84 |
| 1358 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 14,7 |  |  |  | 1.01 | 0.264 | 0.265 | 0.995 | 0.608 | 1718,918 | 68 by 64 |
| 1358 + 1/2 | 0.7 | 0.27 | 0.27 | 1.01 | 1.01 | 1.01 | 0.000 | 1.11 | 0,0 |  |  |  | 1.00 | 0.266 | 0.265 | 1.004 | 0.608 | 1906,1034 | 128 by 76 |
| 1359 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 14,7 |  |  |  | 1.00 | 0.266 | 0.264 | 1.005 | 0.608 | 1614,910 | 200 by 64 |
| 1359 + 1/2 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 5,7 |  |  |  | 1.00 | 0.265 | 0.265 | 1.002 | 0.608 | 1734,922 | 64 by 64 |
| 1360 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 13,2 |  |  |  | 1.00 | 0.263 | 0.265 | 0.994 | 0.608 | 1006,538 | 56 by 72 |
| 1360 + 1/2 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 2,4 |  |  |  | 1.00 | 0.264 | 0.264 | 1.000 | 0.608 | 1554,1070 | 64 by 32 |
| 1361 | 0.7 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 13,2 |  |  |  | 1.00 | 0.264 | 0.263 | 1.002 | 0.608 | 1562,906 | 140 by 76 |
| 1361 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

### rise (venus.rise, frames 1530 to 1604, window 1518 to 1616, 198 draft frames at rate 2)

Largest level step: 0.33 at frame 1565 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.18 from frame 1539 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 5.12 from frame 1552 + 1/2 to the next, block column 15 row 8 from the top left, shown, not judged.
Largest change in place: 67.4 from frame 1546 + 1/2 to 8 film frames later, most at pixel 1904, 428 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.72 from frame 1544 to 8 film frames later, most at pixel 155, 345, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 1518 to 1529 + 1/2): change 1.5, pattern 0.01.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 1539 + 1/2 in /home/user/workspace/work/p6/hv9/03/venus-rise-p1of2-pops.png, frame 1571 + 1/2 in /home/user/workspace/work/p6/hv9/04/venus-rise-p2of2-pops.png, frame 1572 in /home/user/workspace/work/p6/hv9/04/venus-rise-p2of2-pops.png, frame 1610 + 1/2 in /home/user/workspace/work/p6/hv9/04/venus-rise-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 1544 in /home/user/workspace/work/p6/hv9/03/venus-rise-p1of2-changes.png, frame 1558 in no panel (a slice --frames 3116-3116 draws it), frame 1569 + 1/2 in no panel (a slice --frames 3139-3139 draws it), frame 1608 + 1/2 in /home/user/workspace/work/p6/hv9/04/venus-rise-p2of2-changes.png.

- RED the pattern of the picture changes in place by 0.72 from frame 1544 to 8 film frames later, band 8 px, limit 0.45 (17 frames over it, first 1542 + 1/2)

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1518 | 71.69 |  | 0.5 | 0.62 | 0.62 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 7,5 | 1.5 | 2.2 | 0.61 | 0.01 | 0.60 | 8.0 |
| 1518 + 1/2 | 71.69 | 0.00 | 0.5 | 0.62 | 0.62 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 5,8 | 1.4 | 2.1 | 0.61 | 0.01 | 0.60 | 8.0 |
| 1519 | 71.70 | 0.00 | 0.5 | 0.62 | 0.62 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 5,8 | 1.4 | 2.2 | 0.61 | 0.01 | 0.60 | 8.0 |
| 1519 + 1/2 | 71.70 | 0.00 | 0.5 | 0.62 | 0.62 | 1.01 | 1.01 | 1.01 | 0.000 | 1.13 | 3,0 | 1.4 | 2.2 | 0.61 | 0.01 | 0.60 | 8.0 |
| 1520 | 71.71 | 0.00 | 0.5 | 0.61 | 0.62 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 2,7 | 1.4 | 2.2 | 0.61 | 0.01 | 0.60 | 8.0 |
| 1520 + 1/2 | 71.71 | 0.00 | 0.5 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 2,0 | 1.5 | 2.2 | 0.61 | 0.01 | 0.60 | 8.0 |
| 1521 | 71.72 | 0.00 | 0.5 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 5,1 | 1.4 | 2.2 | 0.61 | 0.01 | 0.60 | 8.0 |
| 1521 + 1/2 | 71.72 | 0.00 | 0.5 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 7,5 | 1.5 | 2.2 | 0.61 | 0.01 | 0.60 | 8.0 |
| 1522 | 71.72 | 0.00 | 0.5 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 14,4 | 1.5 | 2.3 | 0.61 | 0.01 | 0.60 | 8.1 |
| 1522 + 1/2 | 71.73 | 0.00 | 0.5 | 0.61 | 0.61 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 7,5 | 1.5 | 2.3 | 0.61 | 0.01 | 0.60 | 8.1 |
| 1523 | 71.74 | 0.00 | 0.5 | 0.61 | 0.61 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 15,5 | 1.5 | 2.3 | 0.61 | 0.01 | 0.60 | 8.1 |
| 1523 + 1/2 | 71.74 | 0.00 | 0.5 | 0.60 | 0.61 | 0.98 | 0.98 | 0.98 | 0.000 | 1.08 | 1,0 | 1.5 | 2.3 | 0.61 | 0.01 | 0.60 | 8.1 |
| 1524 | 71.75 | 0.00 | 0.5 | 0.61 | 0.61 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 1,0 | 1.5 | 2.3 | 0.61 | 0.01 | 0.60 | 8.0 |
| 1524 + 1/2 | 71.75 | 0.00 | 0.5 | 0.61 | 0.61 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 5,5 | 1.5 | 2.8 | 0.61 | 0.01 | 0.60 | 8.0 |
| 1525 | 71.76 | 0.00 | 0.5 | 0.60 | 0.61 | 0.98 | 0.98 | 0.98 | 0.000 | 1.10 | 11,4 | 1.6 | 3.1 | 0.61 | 0.01 | 0.60 | 8.0 |
| 1525 + 1/2 | 71.76 | 0.00 | 0.5 | 0.60 | 0.61 | 0.98 | 0.98 | 0.98 | 0.000 | 1.10 | 11,3 | 1.7 | 3.3 | 0.61 | 0.01 | 0.60 | 8.1 |
| 1526 | 71.77 | 0.00 | 0.5 | 0.60 | 0.61 | 0.98 | 0.98 | 0.98 | 0.000 | 1.10 | 5,4 | 1.8 | 3.6 | 0.61 | 0.01 | 0.60 | 8.0 |
| 1526 + 1/2 | 71.77 | 0.00 | 0.5 | 0.60 | 0.61 | 0.98 | 0.98 | 0.98 | 0.000 | 1.12 | 5,8 | 2.0 | 3.8 | 0.61 | 0.01 | 0.60 | 8.0 |
| 1527 | 71.78 | 0.00 | 0.5 | 0.60 | 0.61 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 6,7 | 2.3 | 4.1 | 0.61 | 0.02 | 0.60 | 8.0 |
| 1527 + 1/2 | 71.78 | 0.00 | 0.4 | 0.60 | 0.61 | 0.98 | 0.98 | 0.98 | 0.000 | 1.10 | 14,5 | 2.6 | 4.9 | 0.61 | 0.02 | 0.60 | 8.0 |
| 1528 | 71.78 | 0.00 | 0.5 | 0.60 | 0.61 | 0.98 | 0.98 | 0.98 | 0.000 | 1.06 | 11,5 | 3.0 | 6.4 | 0.61 | 0.02 | 0.60 | 8.2 |
| 1528 + 1/2 | 71.79 | 0.00 | 0.5 | 0.60 | 0.61 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 5,5 | 3.3 | 7.9 | 0.61 | 0.03 | 0.60 | 8.2 |
| 1529 | 71.80 | 0.00 | 0.5 | 0.60 | 0.61 | 0.98 | 0.98 | 0.98 | 0.000 | 1.09 | 15,8 | 3.7 | 9.1 | 0.61 | 0.04 | 0.60 | 8.2 |
| 1529 + 1/2 | 71.80 | 0.00 | 0.4 | 0.60 | 0.61 | 0.98 | 0.98 | 0.98 | 0.000 | 1.15 | 14,5 | 4.1 | 10.3 | 0.61 | 0.05 | 0.60 | 8.2 |
| 1530 first | 71.80 | 0.01 | 0.5 | 0.61 | 0.63 | 0.97 | 0.97 | 0.97 | 0.000 | 1.14 | 14,5 | 4.5 | 11.8 | 0.61 | 0.06 | 0.60 | 8.2 |
| 1530 + 1/2 | 71.81 | 0.00 | 0.5 | 0.65 | 0.68 | 0.97 | 0.97 | 0.97 | 0.000 | 1.41 | 2,8 | 4.9 | 12.9 | 0.61 | 0.07 | 0.60 | 8.2 |
| 1531 | 71.84 | 0.02 | 0.7 | 0.74 | 0.76 | 0.97 | 0.97 | 0.97 | 0.000 | 1.62 | 2,8 | 5.5 | 13.9 | 0.61 | 0.09 | 0.60 | 8.2 |
| 1531 + 1/2 | 71.89 | 0.02 | 0.9 | 0.87 | 0.86 | 1.01 | 1.01 | 1.01 | 0.000 | 1.81 | 3,7 | 6.0 | 15.0 | 0.61 | 0.10 | 0.60 | 8.2 |
| 1532 | 71.98 | 0.02 | 1.3 | 0.99 | 0.97 | 1.02 | 1.02 | 1.02 | 0.000 | 1.91 | 1,4 | 6.2 | 14.2 | 0.61 | 0.11 | 0.60 | 8.2 |
| 1532 + 1/2 | 72.11 | 0.02 | 1.6 | 1.07 | 1.05 | 1.01 | 1.01 | 1.01 | 0.000 | 1.77 | 14,6 | 6.7 | 14.2 | 0.61 | 0.12 | 0.61 | 8.2 |
| 1533 | 72.26 | 0.02 | 2.0 | 1.12 | 1.10 | 1.02 | 1.02 | 1.02 | 0.000 | 1.87 | 1,4 | 7.0 | 14.3 | 0.61 | 0.12 | 0.61 | 8.1 |
| 1533 + 1/2 | 72.45 | 0.01 | 2.4 | 1.14 | 1.13 | 1.01 | 1.01 | 1.01 | 0.000 | 1.87 | 2,8 | 7.4 | 14.8 | 0.61 | 0.14 | 0.61 | 8.1 |
| 1534 | 72.67 | 0.02 | 2.7 | 1.15 | 1.16 | 0.99 | 0.99 | 0.99 | 0.000 | 1.83 | 3,7 | 7.9 | 15.0 | 0.61 | 0.15 | 0.61 | 8.0 |
| 1534 + 1/2 | 72.93 | 0.01 | 3.1 | 1.17 | 1.17 | 1.00 | 1.00 | 1.00 | 0.000 | 2.11 | 3,7 | 8.7 | 14.7 | 0.61 | 0.16 | 0.61 | 8.0 |
| 1535 | 73.21 | 0.02 | 3.5 | 1.20 | 1.21 | 1.00 | 1.00 | 1.00 | 0.000 | 2.10 | 3,7 | 9.9 | 14.2 | 0.61 | 0.16 | 0.61 | 8.0 |
| 1535 + 1/2 | 73.53 | 0.01 | 3.9 | 1.24 | 1.24 | 1.00 | 0.99 | 0.99 | 0.002 | 1.87 | 3,7 | 11.2 | 14.4 | 0.62 | 0.17 | 0.61 | 8.0 |
| 1536 | 73.87 | 0.02 | 4.3 | 1.28 | 1.28 | 1.00 | 1.01 | 1.00 | 0.000 | 1.73 | 13,5 | 12.5 | 14.4 | 0.62 | 0.18 | 0.61 | 8.0 |
| 1536 + 1/2 | 74.25 | 0.02 | 4.7 | 1.32 | 1.31 | 1.00 | 1.01 | 1.00 | 0.001 | 1.75 | 14,8 | 13.8 | 16.2 | 0.62 | 0.19 | 0.62 | 8.0 |
| 1537 | 74.67 | 0.01 | 5.2 | 1.34 | 1.33 | 1.01 | 1.00 | 1.00 | 0.006 | 2.00 | 13,8 | 15.2 | 18.1 | 0.62 | 0.19 | 0.62 | 8.0 |
| 1537 + 1/2 | 75.10 | 0.02 | 5.6 | 1.36 | 1.34 | 1.01 | 1.01 | 1.01 | 0.006 | 2.77 | 13,8 | 16.7 | 19.5 | 0.62 | 0.19 | 0.62 | 8.0 |
| 1538 | 75.58 | 0.00 | 6.1 | 1.35 | 1.35 | 1.00 | 1.00 | 1.00 | 0.006 | 2.88 | 13,8 | 18.2 | 21.4 | 0.63 | 0.18 | 0.62 | 8.0 |
| 1538 + 1/2 | 76.06 | 0.01 | 6.6 | 1.36 | 1.35 | 1.00 | 1.01 | 1.00 | 0.005 | 3.10 | 13,8 | 19.8 | 24.0 | 0.63 | 0.15 | 0.62 | 8.0 |
| 1539 | 76.56 | 0.01 | 7.0 | 1.35 | 1.42 | 0.95 | 0.95 | 0.95 | 0.012 | 3.36 | 13,8 | 21.4 | 25.9 | 0.63 | 0.16 | 0.02 | 8.0 |
| 1539 + 1/2 | 77.06 | 0.02 | 7.6 | 1.68 | 1.42 | 1.18 | 1.18 | 1.18 | 0.016 | 3.12 | 13,8 | 23.5 | 31.4 | 0.63 | 0.13 | 0.63 | 8.0 |
| 1540 | 77.62 | 0.01 | 8.0 | 1.49 | 1.51 | 0.98 | 1.01 | 0.98 | 0.015 | 2.86 | 13,8 | 25.5 | 39.3 | 0.63 | 0.10 | 0.63 | 9.2 |
| 1540 + 1/2 | 78.18 | 0.02 | 8.5 | 1.52 | 1.51 | 1.00 | 1.00 | 1.00 | 0.020 | 2.19 | 13,8 | 29.3 | 45.9 | 0.64 | 0.10 | 0.63 | 9.1 |
| 1541 | 78.79 | 0.03 | 9.0 | 1.51 | 1.52 | 0.99 | 1.00 | 0.99 | 0.013 | 2.30 | 4,7 | 32.1 | 49.8 | 0.64 | 0.13 | 0.64 | 8.9 |
| 1541 + 1/2 | 79.45 | 0.02 | 9.4 | 1.52 | 1.54 | 0.99 | 0.96 | 0.96 | 0.035 | 2.32 | 4,7 | 34.6 | 52.6 | 0.64 | 0.18 | 0.64 | 8.8 |
| 1542 | 80.16 | 0.00 | 9.9 | 1.53 | 1.56 | 0.98 | 0.98 | 0.98 | 0.022 | 2.26 | 4,7 | 37.7 | 56.5 | 0.65 | 0.39 | 0.03 | 8.0 |
| 1542 + 1/2 | 80.86 | 0.00 | 10.3 | 1.54 | 1.58 | 0.98 | 0.97 | 0.97 | 0.021 | 2.40 | 4,7 | 40.1 | 59.2 | 0.66 | 0.61 | 0.03 | 8.0 |
| 1543 | 81.57 | 0.00 | 10.7 | 1.57 | 1.60 | 0.98 | 0.98 | 0.98 | 0.018 | 2.20 | 4,7 | 41.9 | 64.0 | 0.66 | 0.64 | 0.03 | 8.0 |
| 1543 + 1/2 | 82.28 | 0.01 | 11.0 | 1.59 | 1.63 | 0.98 | 0.98 | 0.98 | 0.019 | 2.33 | 12,7 | 44.5 | 66.6 | 0.67 | 0.61 | 0.03 | 8.0 |
| 1544 | 83.00 | 0.02 | 11.5 | 1.61 | 1.66 | 0.97 | 0.97 | 0.97 | 0.019 | 2.44 | 12,7 | 47.8 | 69.9 | 0.67 | 0.72 | 0.03 | 8.0 |
| 1544 + 1/2 | 83.69 | 0.02 | 11.7 | 1.65 | 1.69 | 0.97 | 0.98 | 0.97 | 0.016 | 3.19 | 12,7 | 52.6 | 72.0 | 0.68 | 0.70 | 0.04 | 8.0 |
| 1545 | 84.34 | 0.05 | 12.1 | 1.70 | 1.75 | 0.97 | 0.99 | 0.97 | 0.014 | 2.84 | 12,7 | 57.6 | 77.7 | 0.69 | 0.43 | 0.04 | 8.0 |
| 1545 + 1/2 | 84.90 | 0.04 | 12.3 | 1.82 | 1.84 | 0.99 | 0.98 | 0.98 | 0.020 | 3.03 | 0,6 | 63.3 | 84.6 | 0.69 | 0.68 | 0.04 | 8.0 |
| 1546 | 85.39 | 0.08 | 12.6 | 1.98 | 1.99 | 0.99 | 0.99 | 0.99 | 0.018 | 3.41 | 0,6 | 65.5 | 89.6 | 0.70 | 0.72 | 0.04 | 8.0 |
| 1546 + 1/2 | 85.72 | 0.11 | 12.8 | 2.16 | 2.10 | 1.03 | 1.02 | 1.02 | 0.015 | 3.74 | 0,6 | 67.4 | 87.2 | 0.71 | 0.50 | 0.05 | 8.0 |
| 1547 | 85.83 | 0.05 | 13.3 | 2.22 | 2.20 | 1.01 | 1.01 | 1.01 | 0.009 | 3.50 | 7,2 | 66.3 | 74.2 | 0.72 | 0.46 | 0.07 | 8.0 |
| 1547 + 1/2 | 85.83 | 0.04 | 13.6 | 2.23 | 2.27 | 0.99 | 1.00 | 0.99 | 0.004 | 3.04 | 0,6 | 63.7 | 75.6 | 0.73 | 0.448 | 0.08 | 8.0 |
| 1548 | 85.91 | 0.06 | 13.7 | 2.31 | 2.32 | 0.99 | 1.02 | 0.99 | 0.007 | 3.72 | 15,4 | 60.1 | 77.2 | 0.74 | 0.38 | 0.08 | 8.0 |
| 1548 + 1/2 | 85.88 | 0.10 | 14.0 | 2.40 | 2.36 | 1.02 | 1.05 | 1.02 | 0.004 | 4.45 | 15,4 | 54.3 | 76.6 | 0.74 | 0.33 | 0.08 | 8.0 |
| 1549 | 85.66 | 0.07 | 14.3 | 2.42 | 2.42 | 1.00 | 1.03 | 1.00 | 0.018 | 3.61 | 14,4 | 49.7 | 75.4 | 0.75 | 0.49 | 0.07 | 8.0 |
| 1549 + 1/2 | 85.29 | 0.05 | 14.6 | 2.43 | 2.45 | 0.99 | 1.04 | 0.99 | 0.008 | 2.77 | 1,6 | 47.4 | 72.6 | 0.75 | 0.32 | 0.07 | 8.0 |
| 1550 | 84.82 | 0.08 | 15.0 | 2.47 | 2.49 | 0.99 | 1.02 | 0.99 | 0.027 | 2.74 | 14,8 | 45.8 | 68.6 | 0.76 | 0.24 | 0.07 | 8.0 |
| 1550 + 1/2 | 84.18 | 0.14 | 15.4 | 2.55 | 2.54 | 1.00 | 1.04 | 1.00 | 0.026 | 3.35 | 1,8 | 45.1 | 64.1 | 0.77 | 0.32 | 0.07 | 8.0 |
| 1551 | 83.26 | 0.03 | 15.8 | 2.63 | 2.58 | 1.02 | 1.07 | 1.02 | 0.022 | 4.07 | 1,8 | 43.4 | 60.1 | 0.78 | 0.31 | 0.07 | 8.0 |
| 1551 + 1/2 | 82.28 | 0.03 | 16.2 | 2.71 | 2.61 | 1.04 | 1.08 | 1.04 | 0.030 | 3.44 | 1,8 | 42.3 | 53.7 | 0.78 | 0.24 | 0.07 | 8.0 |
| 1552 | 81.22 | 0.08 | 16.6 | 2.73 | 2.61 | 1.04 | 1.05 | 1.04 | 0.041 | 4.77 | 15,8 | 42.5 | 48.1 | 0.79 | 0.20 | 0.06 | 8.0 |
| 1552 + 1/2 | 80.01 | 0.01 | 17.0 | 2.78 | 2.62 | 1.06 | 1.08 | 1.06 | 0.041 | 5.12 | 15,8 | 43.4 | 46.3 | 0.81 | 0.17 | 0.80 | 8.0 |
| 1553 | 78.77 | 0.10 | 17.4 | 2.83 | 2.63 | 1.07 | 1.08 | 1.07 | 0.047 | 4.21 | 15,8 | 44.7 | 47.8 | 0.82 | 0.15 | 0.07 | 8.0 |
| 1553 + 1/2 | 77.73 | 0.05 | 17.5 | 2.86 | 2.65 | 1.08 | 1.06 | 1.06 | 0.052 | 3.83 | 14,8 | 46.1 | 49.7 | 0.82 | 0.14 | 0.06 | 8.0 |
| 1554 | 76.79 | 0.10 | 17.8 | 2.90 | 2.67 | 1.09 | 1.00 | 1.00 | 0.062 | 4.13 | 14,8 | 47.5 | 51.8 | 0.83 | 0.28 | 0.06 | 8.0 |
| 1554 + 1/2 | 76.04 | 0.18 | 17.9 | 2.80 | 2.68 | 1.04 | 0.94 | 0.94 | 0.064 | 3.04 | 13,7 | 48.9 | 54.0 | 0.84 | 0.22 | 0.05 | 8.0 |
| 1555 | 75.65 | 0.21 | 18.0 | 2.71 | 2.70 | 1.00 | 0.91 | 0.91 | 0.055 | 3.23 | 13,7 | 50.3 | 55.9 | 0.86 | 0.35 | 0.04 | 8.0 |
| 1555 + 1/2 | 75.68 | 0.15 | 18.1 | 2.61 | 2.72 | 0.96 | 1.00 | 0.96 | 0.017 | 3.01 | 13,7 | 51.7 | 58.1 | 0.87 | 0.21 | 0.04 | 8.0 |
| 1556 | 76.02 | 0.04 | 18.8 | 2.62 | 2.73 | 0.96 | 0.96 | 0.96 | 0.032 | 3.11 | 12,7 | 52.8 | 60.1 | 0.88 | 0.13 | 0.03 | 8.0 |
| 1556 + 1/2 | 76.44 | 0.08 | 19.2 | 2.63 | 2.74 | 0.96 | 0.92 | 0.92 | 0.053 | 4.03 | 12,7 | 53.9 | 62.0 | 0.89 | 0.19 | 0.02 | 8.0 |
| 1557 | 76.71 | 0.03 | 18.7 | 2.61 | 2.75 | 0.95 | 0.95 | 0.95 | 0.044 | 4.08 | 12,7 | 54.9 | 63.9 | 0.90 | 0.11 | 0.90 | 9.5 |
| 1557 + 1/2 | 77.04 | 0.06 | 19.3 | 2.66 | 2.76 | 0.96 | 0.92 | 0.92 | 0.060 | 3.40 | 12,7 | 55.4 | 65.4 | 0.91 | 0.11 | 0.91 | 9.2 |
| 1558 | 77.49 | 0.05 | 19.6 | 2.68 | 2.78 | 0.96 | 0.95 | 0.95 | 0.060 | 3.22 | 0,8 | 55.5 | 66.1 | 0.91 | 0.11 | 0.91 | 8.0 |
| 1558 + 1/2 | 78.04 | 0.01 | 19.9 | 2.69 | 2.79 | 0.97 | 0.98 | 0.97 | 0.049 | 3.34 | 0,8 | 55.2 | 66.5 | 0.92 | 0.11 | 0.92 | 8.0 |
| 1559 | 78.61 | 0.01 | 19.0 | 2.73 | 2.81 | 0.97 | 1.01 | 0.97 | 0.033 | 3.38 | 1,4 | 54.7 | 66.3 | 0.93 | 0.10 | 0.93 | 8.0 |
| 1559 + 1/2 | 79.20 | 0.18 | 19.4 | 2.78 | 2.82 | 0.98 | 1.01 | 0.98 | 0.038 | 3.35 | 1,8 | 53.7 | 65.6 | 0.94 | 0.09 | 0.93 | 8.0 |
| 1560 | 80.16 | 0.08 | 19.3 | 2.75 | 2.83 | 0.97 | 1.02 | 0.97 | 0.028 | 2.88 | 2,3 | 52.2 | 64.1 | 0.94 | 0.08 | 0.94 | 8.0 |
| 1560 + 1/2 | 81.28 | 0.03 | 19.9 | 2.75 | 2.85 | 0.97 | 1.00 | 0.97 | 0.035 | 3.11 | 2,4 | 50.6 | 62.6 | 0.94 | 0.08 | 0.94 | 8.0 |
| 1561 | 82.34 | 0.02 | 19.8 | 2.82 | 2.87 | 0.98 | 1.03 | 0.98 | 0.030 | 3.15 | 2,4 | 48.9 | 60.7 | 0.94 | 0.08 | 0.94 | 8.0 |
| 1561 + 1/2 | 83.44 | 0.13 | 20.2 | 2.87 | 2.88 | 1.00 | 1.05 | 1.00 | 0.027 | 3.03 | 2,4 | 47.2 | 58.6 | 0.95 | 0.09 | 0.94 | 8.0 |
| 1562 | 84.79 | 0.06 | 20.4 | 2.92 | 2.88 | 1.01 | 1.02 | 1.01 | 0.038 | 2.82 | 2,4 | 45.5 | 56.3 | 0.95 | 0.11 | 0.95 | 8.0 |
| 1562 + 1/2 | 86.03 | 0.02 | 21.5 | 2.91 | 2.88 | 1.01 | 1.01 | 1.01 | 0.040 | 2.41 | 2,4 | 43.8 | 54.2 | 0.95 | 0.12 | 0.95 | 8.0 |
| 1563 | 87.30 | 0.05 | 23.4 | 2.89 | 2.91 | 0.99 | 0.99 | 0.99 | 0.040 | 2.03 | 3,3 | 42.5 | 52.5 | 0.95 | 0.12 | 0.95 | 8.0 |
| 1563 + 1/2 | 88.47 | 0.09 | 23.6 | 2.92 | 2.91 | 1.00 | 0.99 | 0.99 | 0.025 | 2.20 | 11,8 | 41.0 | 50.5 | 0.95 | 0.13 | 0.95 | 8.0 |
| 1564 | 89.44 | 0.16 | 23.1 | 3.15 | 2.92 | 1.08 | 1.00 | 1.00 | 0.032 | 3.70 | 15,2 | 39.7 | 48.6 | 0.95 | 0.15 | 0.95 | 8.0 |
| 1564 + 1/2 | 90.10 | 0.33 | 22.5 | 3.10 | 2.93 | 1.06 | 0.91 | 0.91 | 0.038 | 2.23 | 3,3 | 38.6 | 46.8 | 0.95 | 0.16 | 0.95 | 8.0 |
| 1565 | 90.09 | 0.06 | 22.4 | 3.18 | 2.98 | 1.07 | 0.93 | 0.93 | 0.041 | 1.79 | 3,3 | 37.6 | 45.2 | 0.95 | 0.16 | 0.95 | 8.0 |
| 1565 + 1/2 | 89.95 | 0.33 | 22.5 | 3.13 | 3.04 | 1.03 | 0.89 | 0.89 | 0.050 | 1.76 | 8,8 | 37.5 | 43.3 | 0.95 | 0.17 | 0.94 | 8.0 |
| 1566 | 89.15 | 0.09 | 22.9 | 3.07 | 3.10 | 0.99 | 0.91 | 0.91 | 0.051 | 2.27 | 12,5 | 38.2 | 41.9 | 0.94 | 0.17 | 0.94 | 8.0 |
| 1566 + 1/2 | 88.17 | 0.09 | 23.1 | 2.83 | 3.11 | 0.91 | 0.98 | 0.91 | 0.024 | 1.94 | 12,5 | 38.8 | 42.0 | 0.94 | 0.17 | 0.94 | 8.0 |
| 1567 | 87.38 | 0.13 | 23.0 | 2.95 | 3.12 | 0.95 | 1.04 | 0.95 | 0.026 | 1.64 | 10,8 | 39.5 | 42.7 | 0.94 | 0.15 | 0.94 | 8.0 |
| 1567 + 1/2 | 86.31 | 0.10 | 22.9 | 3.01 | 3.14 | 0.96 | 1.06 | 0.96 | 0.015 | 1.81 | 0,0 | 40.4 | 43.6 | 0.94 | 0.14 | 0.93 | 8.0 |
| 1568 | 85.05 | 0.12 | 22.5 | 3.10 | 3.14 | 0.99 | 1.05 | 0.99 | 0.046 | 2.04 | 0,2 | 41.1 | 44.4 | 0.93 | 0.12 | 0.93 | 8.0 |
| 1568 + 1/2 | 83.55 | 0.15 | 22.5 | 3.11 | 3.14 | 0.99 | 1.06 | 0.99 | 0.035 | 2.19 | 0,2 | 41.5 | 44.8 | 0.92 | 0.11 | 0.92 | 8.0 |
| 1569 | 81.74 | 0.03 | 22.8 | 3.17 | 3.12 | 1.02 | 1.08 | 1.02 | 0.051 | 2.40 | 0,1 | 42.0 | 45.1 | 0.91 | 0.09 | 0.91 | 8.0 |
| 1569 + 1/2 | 80.00 | 0.01 | 22.3 | 3.26 | 3.12 | 1.05 | 1.09 | 1.05 | 0.062 | 2.56 | 0,1 | 42.4 | 45.5 | 0.90 | 0.09 | 0.90 | 8.0 |
| 1570 | 78.28 | 0.08 | 22.7 | 3.35 | 3.12 | 1.07 | 1.13 | 1.07 | 0.070 | 2.59 | 0,8 | 42.3 | 44.9 | 0.89 | 0.10 | 0.89 | 8.0 |
| 1570 + 1/2 | 76.40 | 0.08 | 22.5 | 3.40 | 3.12 | 1.09 | 1.10 | 1.09 | 0.096 | 2.67 | 3,8 | 42.0 | 44.9 | 0.88 | 0.12 | 0.88 | 8.0 |
| 1571 | 74.68 | 0.01 | 22.3 | 3.45 | 3.12 | 1.11 | 1.14 | 1.11 | 0.091 | 2.78 | 0,7 | 41.6 | 44.7 | 0.87 | 0.12 | 0.87 | 8.0 |
| 1571 + 1/2 | 72.93 | 0.01 | 21.8 | 3.48 | 3.12 | 1.11 | 1.16 | 1.11 | 0.078 | 2.51 | 0,7 | 41.0 | 44.8 | 0.86 | 0.15 | 0.86 | 8.0 |
| 1572 | 71.17 | 0.03 | 21.5 | 3.47 | 3.12 | 1.11 | 1.13 | 1.11 | 0.112 | 2.87 | 0,6 | 40.3 | 44.8 | 0.85 | 0.19 | 0.85 | 8.0 |
| 1572 + 1/2 | 69.47 | 0.00 | 20.9 | 3.45 | 3.11 | 1.11 | 1.13 | 1.11 | 0.106 | 2.36 | 0,3 | 39.6 | 44.5 | 0.84 | 0.20 | 0.84 | 8.0 |
| 1573 | 67.77 | 0.04 | 20.2 | 3.40 | 3.11 | 1.09 | 1.10 | 1.09 | 0.131 | 2.38 | 0,4 | 38.5 | 43.9 | 0.83 | 0.25 | 0.83 | 8.0 |
| 1573 + 1/2 | 66.16 | 0.05 | 20.4 | 3.39 | 3.09 | 1.10 | 1.04 | 1.04 | 0.164 | 2.24 | 4,7 | 37.5 | 43.0 | 0.82 | 0.36 | 0.82 | 8.0 |
| 1574 | 64.65 | 0.06 | 21.0 | 3.33 | 3.05 | 1.09 | 1.05 | 1.05 | 0.137 | 2.27 | 4,7 | 36.3 | 41.9 | 0.81 | 0.42 | 0.81 | 8.0 |
| 1574 + 1/2 | 63.26 | 0.05 | 21.2 | 3.24 | 3.02 | 1.07 | 1.02 | 1.02 | 0.147 | 2.29 | 1,8 | 35.0 | 40.4 | 0.80 | 0.51 | 0.80 | 8.0 |
| 1575 | 61.97 | 0.04 | 22.0 | 3.16 | 3.02 | 1.05 | 0.96 | 0.96 | 0.164 | 2.16 | 2,2 | 34.0 | 38.9 | 0.79 | 0.58 | 0.79 | 8.0 |
| 1575 + 1/2 | 60.75 | 0.01 | 21.9 | 3.14 | 3.02 | 1.04 | 1.06 | 1.04 | 0.101 | 2.15 | 0,5 | 32.6 | 37.0 | 0.77 | 0.57 | 0.77 | 8.0 |
| 1576 | 59.54 | 0.00 | 21.8 | 3.03 | 2.98 | 1.02 | 1.00 | 1.00 | 0.119 | 1.96 | 2,2 | 31.5 | 35.6 | 0.76 | 0.46 | 0.76 | 8.0 |
| 1576 + 1/2 | 58.35 | 0.03 | 23.1 | 2.85 | 2.89 | 0.99 | 1.00 | 0.99 | 0.080 | 1.87 | 2,1 | 30.4 | 34.4 | 0.75 | 0.42 | 0.74 | 8.0 |
| 1577 | 57.20 | 0.03 | 22.8 | 2.75 | 2.75 | 1.00 | 1.01 | 1.00 | 0.048 | 1.75 | 2,1 | 29.2 | 33.0 | 0.73 | 0.40 | 0.73 | 8.0 |
| 1577 + 1/2 | 56.13 | 0.02 | 21.7 | 2.65 | 2.66 | 1.00 | 1.00 | 1.00 | 0.047 | 1.71 | 3,2 | 27.8 | 31.9 | 0.71 | 0.39 | 0.71 | 8.0 |
| 1578 | 55.10 | 0.05 | 20.9 | 2.56 | 2.55 | 1.00 | 0.99 | 0.99 | 0.048 | 1.99 | 3,2 | 26.4 | 30.9 | 0.70 | 0.39 | 0.69 | 8.0 |
| 1578 + 1/2 | 54.17 | 0.05 | 19.9 | 2.46 | 2.46 | 1.00 | 1.01 | 1.00 | 0.039 | 1.92 | 3,2 | 25.0 | 29.7 | 0.68 | 0.38 | 0.67 | 8.0 |
| 1579 | 53.35 | 0.01 | 19.1 | 2.35 | 2.37 | 0.99 | 1.00 | 0.99 | 0.039 | 1.83 | 3,2 | 23.4 | 28.7 | 0.66 | 0.36 | 0.65 | 8.0 |
| 1579 + 1/2 | 52.56 | 0.01 | 18.1 | 2.28 | 2.28 | 1.00 | 0.99 | 0.99 | 0.044 | 1.72 | 3,2 | 22.0 | 28.1 | 0.63 | 0.32 | 0.63 | 8.0 |
| 1580 | 51.79 | 0.01 | 17.1 | 2.20 | 2.20 | 1.00 | 1.02 | 1.00 | 0.035 | 1.62 | 3,2 | 20.5 | 27.3 | 0.61 | 0.30 | 0.61 | 8.0 |
| 1580 + 1/2 | 51.04 | 0.02 | 16.4 | 2.11 | 2.14 | 0.99 | 0.97 | 0.97 | 0.053 | 1.50 | 11,5 | 19.0 | 25.5 | 0.59 | 0.27 | 0.59 | 8.0 |
| 1581 | 50.34 | 0.02 | 15.6 | 2.07 | 2.06 | 1.00 | 1.01 | 1.00 | 0.041 | 1.90 | 11,6 | 17.5 | 23.8 | 0.57 | 0.24 | 0.57 | 8.0 |
| 1581 + 1/2 | 49.69 | 0.02 | 14.9 | 2.01 | 2.01 | 1.00 | 0.96 | 0.96 | 0.066 | 2.03 | 15,1 | 16.0 | 22.7 | 0.55 | 0.22 | 0.55 | 8.0 |
| 1582 | 49.08 | 0.02 | 14.2 | 1.96 | 1.96 | 1.00 | 1.03 | 1.00 | 0.036 | 1.76 | 9,8 | 14.7 | 20.8 | 0.53 | 0.19 | 0.53 | 8.0 |
| 1582 + 1/2 | 48.50 | 0.01 | 13.6 | 1.92 | 1.93 | 1.00 | 1.00 | 1.00 | 0.053 | 1.50 | 11,6 | 13.5 | 19.7 | 0.51 | 0.17 | 0.50 | 8.0 |
| 1583 | 47.93 | 0.01 | 12.9 | 1.89 | 1.89 | 1.00 | 1.00 | 1.00 | 0.057 | 1.45 | 13,8 | 12.2 | 17.8 | 0.49 | 0.14 | 0.48 | 8.0 |
| 1583 + 1/2 | 47.35 | 0.00 | 12.2 | 1.87 | 1.87 | 1.00 | 0.99 | 0.99 | 0.058 | 1.55 | 8,8 | 11.1 | 16.4 | 0.47 | 0.12 | 0.47 | 8.0 |
| 1584 | 46.77 | 0.01 | 11.8 | 1.85 | 1.83 | 1.01 | 1.03 | 1.01 | 0.046 | 1.44 | 3,8 | 9.9 | 15.1 | 0.45 | 0.10 | 0.45 | 8.0 |
| 1584 + 1/2 | 46.20 | 0.02 | 11.2 | 1.80 | 1.80 | 0.99 | 0.98 | 0.98 | 0.061 | 1.63 | 0,0 | 8.9 | 13.2 | 0.43 | 0.08 | 0.43 | 8.0 |
| 1585 | 45.67 | 0.01 | 10.8 | 1.76 | 1.76 | 1.00 | 1.01 | 1.00 | 0.050 | 1.64 | 15,6 | 8.0 | 11.4 | 0.42 | 0.07 | 0.42 | 8.0 |
| 1585 + 1/2 | 45.15 | 0.01 | 10.4 | 1.72 | 1.72 | 1.00 | 1.00 | 1.00 | 0.045 | 1.76 | 9,7 | 7.4 | 10.6 | 0.40 | 0.05 | 0.40 | 8.0 |
| 1586 | 44.66 | 0.01 | 10.0 | 1.67 | 1.68 | 0.99 | 0.98 | 0.98 | 0.045 | 1.55 | 9,7 | 6.9 | 10.7 | 0.39 | 0.05 | 0.39 | 8.0 |
| 1586 + 1/2 | 44.18 | 0.00 | 9.7 | 1.65 | 1.66 | 1.00 | 1.00 | 1.00 | 0.034 | 1.48 | 6,8 | 6.1 | 9.5 | 0.38 | 0.05 | 0.38 | 8.0 |
| 1587 | 43.71 | 0.02 | 9.2 | 1.64 | 1.64 | 1.00 | 1.00 | 1.00 | 0.034 | 1.64 | 10,4 | 5.7 | 8.3 | 0.37 | 0.05 | 0.37 | 8.0 |
| 1587 + 1/2 | 43.28 | 0.01 | 9.0 | 1.62 | 1.62 | 1.00 | 1.01 | 1.00 | 0.025 | 1.56 | 10,4 | 4.9 | 6.6 | 0.36 | 0.05 | 0.36 | 8.0 |
| 1588 | 42.86 | 0.01 | 8.6 | 1.59 | 1.60 | 1.00 | 1.00 | 1.00 | 0.026 | 1.57 | 10,4 | 4.3 | 6.2 | 0.35 | 0.06 | 0.34 | 8.0 |
| 1588 + 1/2 | 42.46 | 0.01 | 8.3 | 1.58 | 1.58 | 1.00 | 0.99 | 0.99 | 0.038 | 1.53 | 14,1 | 3.9 | 5.3 | 0.34 | 0.07 | 0.33 | 8.0 |
| 1589 | 42.08 | 0.01 | 7.9 | 1.56 | 1.55 | 1.01 | 1.01 | 1.01 | 0.034 | 1.57 | 14,1 | 4.5 | 6.0 | 0.33 | 0.09 | 0.32 | 8.0 |
| 1589 + 1/2 | 41.72 | 0.00 | 7.6 | 1.53 | 1.54 | 0.99 | 0.99 | 0.99 | 0.038 | 1.46 | 3,1 | 5.8 | 8.3 | 0.32 | 0.10 | 0.31 | 8.0 |
| 1590 | 41.37 | 0.01 | 7.3 | 1.51 | 1.51 | 1.00 | 1.00 | 1.00 | 0.035 | 1.56 | 7,3 | 7.0 | 10.1 | 0.31 | 0.09 | 0.30 | 8.0 |
| 1590 + 1/2 | 41.04 | 0.01 | 6.8 | 1.50 | 1.49 | 1.01 | 1.00 | 1.00 | 0.036 | 1.60 | 7,3 | 8.3 | 12.1 | 0.30 | 0.10 | 0.30 | 8.0 |
| 1591 | 40.73 | 0.01 | 6.5 | 1.47 | 1.48 | 0.99 | 1.00 | 0.99 | 0.029 | 1.61 | 5,0 | 9.2 | 13.4 | 0.29 | 0.09 | 0.29 | 8.0 |
| 1591 + 1/2 | 40.44 | 0.01 | 6.1 | 1.45 | 1.45 | 1.00 | 1.00 | 1.00 | 0.026 | 1.59 | 5,0 | 9.9 | 14.4 | 0.28 | 0.08 | 0.28 | 8.0 |
| 1592 | 40.16 | 0.01 | 5.8 | 1.44 | 1.44 | 1.00 | 1.00 | 1.00 | 0.023 | 1.58 | 7,3 | 10.4 | 15.3 | 0.28 | 0.08 | 0.28 | 8.0 |
| 1592 + 1/2 | 39.86 | 0.01 | 5.5 | 1.43 | 1.44 | 1.00 | 1.00 | 1.00 | 0.020 | 1.52 | 7,3 | 10.2 | 14.7 | 0.27 | 0.07 | 0.27 | 8.0 |
| 1593 | 39.55 | 0.00 | 5.1 | 1.43 | 1.43 | 1.00 | 1.00 | 1.00 | 0.018 | 1.66 | 14,0 | 10.2 | 14.8 | 0.27 | 0.06 | 0.26 | 8.0 |
| 1593 + 1/2 | 39.23 | 0.00 | 4.7 | 1.43 | 1.43 | 1.00 | 1.00 | 1.00 | 0.020 | 1.54 | 14,1 | 10.1 | 14.4 | 0.26 | 0.06 | 0.26 | 8.0 |
| 1594 | 38.92 | 0.00 | 4.5 | 1.42 | 1.42 | 1.00 | 1.01 | 1.00 | 0.015 | 1.50 | 6,2 | 9.6 | 13.5 | 0.26 | 0.06 | 0.25 | 8.0 |
| 1594 + 1/2 | 38.59 | 0.00 | 4.2 | 1.42 | 1.41 | 1.01 | 1.00 | 1.00 | 0.018 | 1.58 | 6,2 | 9.1 | 12.6 | 0.25 | 0.07 | 0.25 | 8.0 |
| 1595 | 38.27 | 0.00 | 3.8 | 1.40 | 1.41 | 1.00 | 1.00 | 1.00 | 0.012 | 1.48 | 6,2 | 8.2 | 11.2 | 0.25 | 0.06 | 0.24 | 8.0 |
| 1595 + 1/2 | 37.94 | 0.00 | 3.5 | 1.39 | 1.39 | 1.00 | 1.00 | 1.00 | 0.011 | 1.62 | 6,2 | 7.2 | 9.9 | 0.24 | 0.07 | 0.24 | 8.0 |
| 1596 | 37.63 | 0.00 | 3.3 | 1.37 | 1.38 | 0.99 | 0.99 | 0.99 | 0.009 | 1.45 | 9,3 | 6.1 | 8.3 | 0.24 | 0.08 | 0.24 | 8.0 |
| 1596 + 1/2 | 37.31 | 0.00 | 3.1 | 1.37 | 1.37 | 1.00 | 1.00 | 1.00 | 0.010 | 1.54 | 9,4 | 5.5 | 6.5 | 0.23 | 0.07 | 0.23 | 8.0 |
| 1597 | 37.01 | 0.00 | 2.8 | 1.36 | 1.35 | 1.01 | 1.01 | 1.01 | 0.008 | 1.59 | 11,5 | 5.4 | 6.6 | 0.23 | 0.08 | 0.23 | 8.0 |
| 1597 + 1/2 | 36.71 | 0.01 | 2.7 | 1.33 | 1.33 | 1.00 | 1.00 | 1.00 | 0.006 | 1.57 | 12,3 | 5.6 | 6.7 | 0.23 | 0.08 | 0.22 | 8.0 |
| 1598 | 36.43 | 0.01 | 2.4 | 1.31 | 1.30 | 1.00 | 1.00 | 1.00 | 0.007 | 1.69 | 15,0 | 5.7 | 6.8 | 0.22 | 0.08 | 0.22 | 8.0 |
| 1598 + 1/2 | 36.16 | 0.01 | 2.1 | 1.27 | 1.26 | 1.01 | 1.01 | 1.01 | 0.002 | 1.71 | 15,0 | 6.0 | 7.0 | 0.22 | 0.09 | 0.22 | 8.0 |
| 1599 | 35.91 | 0.01 | 1.9 | 1.22 | 1.23 | 1.00 | 1.00 | 1.00 | 0.003 | 1.60 | 0,0 | 6.1 | 7.1 | 0.22 | 0.09 | 0.22 | 8.0 |
| 1599 + 1/2 | 35.68 | 0.01 | 1.8 | 1.18 | 1.19 | 1.00 | 0.99 | 0.99 | 0.003 | 1.58 | 0,0 | 6.3 | 7.3 | 0.22 | 0.09 | 0.21 | 8.0 |
| 1600 | 35.47 | 0.00 | 1.6 | 1.15 | 1.14 | 1.01 | 1.01 | 1.01 | 0.000 | 1.64 | 15,0 | 6.5 | 7.6 | 0.21 | 0.11 | 0.21 | 8.0 |
| 1600 + 1/2 | 35.26 | 0.00 | 1.4 | 1.09 | 1.10 | 0.99 | 0.99 | 0.99 | 0.000 | 1.51 | 12,2 | 6.8 | 7.8 | 0.21 | 0.10 | 0.21 | 8.0 |
| 1601 | 35.06 | 0.00 | 1.3 | 1.06 | 1.05 | 1.01 | 1.01 | 1.01 | 0.000 | 1.55 | 15,0 | 7.2 | 8.4 | 0.21 | 0.11 | 0.21 | 8.0 |
| 1601 + 1/2 | 34.87 | 0.00 | 1.2 | 1.01 | 1.01 | 1.00 | 1.00 | 1.00 | 0.000 | 1.53 | 14,0 | 7.4 | 8.7 | 0.21 | 0.12 | 0.20 | 8.0 |
| 1602 | 34.68 | 0.00 | 1.1 | 0.97 | 0.97 | 1.00 | 1.00 | 1.00 | 0.000 | 1.33 | 14,0 | 7.4 | 8.6 | 0.20 | 0.12 | 0.20 | 8.0 |
| 1602 + 1/2 | 34.50 | 0.00 | 1.0 | 0.92 | 0.97 | 0.95 | 0.96 | 0.95 | 0.000 | 1.26 | 6,4 | 7.5 | 8.9 | 0.20 | 0.10 | 0.20 | 8.0 |
| 1603 | 34.32 | 0.00 | 0.9 | 0.90 | 0.94 | 0.95 | 0.95 | 0.95 | 0.000 | 1.32 | 6,3 | 8.2 | 9.8 | 0.20 | 0.12 | 0.20 | 8.0 |
| 1603 + 1/2 | 34.16 | 0.01 | 0.8 | 0.85 | 0.91 | 0.93 | 0.94 | 0.93 | 0.000 | 1.28 | 7,3 | 9.2 | 11.2 | 0.20 | 0.11 | 0.20 | 8.0 |
| 1604 last | 34.00 | 0.00 | 0.8 | 0.84 | 0.91 | 0.92 | 0.95 | 0.92 | 0.000 | 1.28 | 7,3 | 10.1 | 12.3 | 0.20 | 0.09 | 0.20 | 8.0 |
| 1604 + 1/2 | 33.84 | 0.00 | 0.8 | 0.85 | 0.91 | 0.93 | 0.96 | 0.93 | 0.000 | 1.42 | 6,3 | 11.7 | 14.4 | 0.19 | 0.10 | 0.19 | 8.0 |
| 1605 | 33.68 | 0.00 | 0.8 | 0.84 | 0.91 | 0.92 | 0.95 | 0.92 | 0.000 | 1.31 | 7,3 | 13.6 | 16.9 | 0.19 | 0.14 | 0.19 | 8.0 |
| 1605 + 1/2 | 33.53 | 0.00 | 0.8 | 0.84 | 0.90 | 0.93 | 0.96 | 0.93 | 0.000 | 1.31 | 5,4 | 15.4 | 19.2 | 0.19 | 0.20 | 0.19 | 8.0 |
| 1606 | 33.37 | 0.00 | 0.8 | 0.84 | 0.90 | 0.93 | 0.97 | 0.93 | 0.000 | 1.38 | 6,3 | 17.9 | 22.1 | 0.19 | 0.29 | 0.19 | 8.0 |
| 1606 + 1/2 | 33.22 | 0.00 | 0.8 | 0.84 | 0.90 | 0.93 | 0.97 | 0.93 | 0.000 | 1.29 | 5,4 | 20.6 | 25.1 | 0.18 | 0.36 | 0.18 | 8.0 |
| 1607 | 33.07 | 0.00 | 0.8 | 0.85 | 0.90 | 0.94 | 0.98 | 0.94 | 0.000 | 1.25 | 3,3 | 22.9 | 27.7 | 0.18 | 0.43 | 0.18 | 8.0 |
| 1607 + 1/2 | 32.93 | 0.00 | 0.9 | 0.84 | 0.90 | 0.93 | 0.98 | 0.93 | 0.000 | 1.35 | 2,2 | 26.0 | 31.0 | 0.17 | 0.52 | 0.17 | 8.0 |
| 1608 | 32.79 | 0.00 | 1.1 | 0.82 | 0.90 | 0.91 | 0.96 | 0.91 | 0.000 | 1.49 | 6,1 | 29.8 | 34.5 | 0.17 | 0.57 | 0.16 | 8.0 |
| 1608 + 1/2 | 32.65 | 0.00 | 1.4 | 0.79 | 0.89 | 0.89 | 0.94 | 0.89 | 0.000 | 1.57 | 6,1 | 33.5 | 38.2 | 0.15 | 0.60 | 0.15 | 8.0 |
| 1609 | 32.52 | 0.00 | 1.7 | 0.88 | 0.85 | 1.04 | 1.04 | 1.04 | 0.005 | 1.74 | 6,1 |  |  |  |  |  |  |
| 1609 + 1/2 | 32.40 | 0.00 | 2.2 | 0.81 | 0.85 | 0.95 | 0.96 | 0.95 | 0.001 | 1.29 | 4,0 |  |  |  |  |  |  |
| 1610 | 32.28 | 0.00 | 2.7 | 0.82 | 0.85 | 0.97 | 0.97 | 0.97 | 0.004 | 1.39 | 4,6 |  |  |  |  |  |  |
| 1610 + 1/2 | 32.17 | 0.00 | 3.3 | 0.97 | 0.85 | 1.15 | 1.14 | 1.14 | 0.006 | 1.71 | 6,1 |  |  |  |  |  |  |
| 1611 | 32.05 | 0.01 | 4.1 | 0.85 | 0.84 | 1.00 | 0.96 | 0.96 | 0.018 | 1.57 | 7,0 |  |  |  |  |  |  |
| 1611 + 1/2 | 31.91 | 0.01 | 4.9 | 0.91 | 0.84 | 1.08 | 1.05 | 1.05 | 0.013 | 1.74 | 7,0 |  |  |  |  |  |  |
| 1612 | 31.75 | 0.04 | 5.8 | 0.94 | 0.84 | 1.12 | 1.04 | 1.04 | 0.029 | 1.94 | 7,0 |  |  |  |  |  |  |
| 1612 + 1/2 | 31.53 | 0.07 | 6.8 | 1.03 | 0.84 | 1.22 | 1.06 | 1.06 | 0.079 | 2.19 | 7,0 |  |  |  |  |  |  |
| 1613 | 31.16 | 0.07 | 8.0 | 0.96 | 0.84 | 1.13 | 1.04 | 1.04 | 0.048 | 2.42 | 7,0 |  |  |  |  |  |  |
| 1613 + 1/2 | 30.67 | 0.07 | 9.1 | 0.90 | 0.85 | 1.07 | 0.99 | 0.99 | 0.032 | 2.39 | 7,0 |  |  |  |  |  |  |
| 1614 | 30.03 | 0.07 | 10.0 | 0.95 | 0.85 | 1.13 | 1.01 | 1.01 | 0.054 | 2.65 | 7,0 |  |  |  |  |  |  |
| 1614 + 1/2 | 29.26 | 0.07 | 10.4 | 0.93 | 0.85 | 1.10 | 1.03 | 1.03 | 0.031 | 2.51 | 7,0 |  |  |  |  |  |  |
| 1615 | 28.36 | 0.07 | 10.7 | 0.95 | 0.87 | 1.10 | 1.07 | 1.07 | 0.022 | 2.27 | 0,2 |  |  |  |  |  |  |
| 1615 + 1/2 | 27.33 | 0.19 | 11.0 | 0.85 | 0.90 | 0.95 | 0.94 | 0.94 | 0.027 | 3.02 | 0,1 |  |  |  |  |  |  |
| 1616 | 25.92 | 0.20 | 10.9 | 0.92 | 0.90 | 1.02 | 0.96 | 0.96 | 0.038 | 2.91 | 3,2 |  |  |  |  |  |  |
| 1616 + 1/2 | 24.13 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### rise, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.62 from frame 1539 + 1/2 to the next, limit 1.2.
Largest pop score of one block: 12.34 from frame 1615 + 1/2 to the next, block column 0 row 1 from the top left, shown, not judged.
Largest change in place: 64.8 from frame 1546 + 1/2 to 8 film frames later, most at pixel 1128, 280, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 1518 to 1529 + 1/2): change 0.7; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.915 from frame 1539 + 1/2 to the next, most at pixel 62, 742, a patch of 328 by 448 px; 1 of 197 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 198 rows, which says nothing of them, quiet or not: frame 1616 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 1539 + 1/2 in /home/user/workspace/work/p6/hv9/03/venus-rise-p1of2-pops-full.png, frame 1571 + 1/2 in /home/user/workspace/work/p6/hv9/04/venus-rise-p2of2-pops-full.png, frame 1572 in /home/user/workspace/work/p6/hv9/04/venus-rise-p2of2-pops-full.png, frame 1572 + 1/2 in /home/user/workspace/work/p6/hv9/04/venus-rise-p2of2-pops-full.png.

With the carry at the full size the rise has 2 numbers over the limit or not measured.

- FULL SIZE RED pop score 1.62 from frame 1539 + 1/2 to the next, limit 1.2 (16 frames over it, first 1539 + 1/2)
- FULL SIZE RED the pattern of the picture changes in place by 0.72 from frame 1544 to 8 film frames later, band 8 px, limit 0.45 (17 frames over it, first 1542 + 1/2)

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1518 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 1,1 | 0.7 | 1.2 | 0.61 | 0.99 | 0.266 | 0.265 | 1.003 | 0.602 | 1666,638 | 140 by 220 |
| 1518 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 4,0 | 0.7 | 1.1 | 0.61 | 1.00 | 0.265 | 0.265 | 0.999 | 0.602 | 482,654 | 88 by 76 |
| 1519 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 8,8 | 0.7 | 1.2 | 0.61 | 1.00 | 0.264 | 0.265 | 0.997 | 0.602 | 998,986 | 156 by 120 |
| 1519 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 10,2 | 0.7 | 1.2 | 0.61 | 1.01 | 0.265 | 0.265 | 1.001 | 0.602 | 374,862 | 144 by 140 |
| 1520 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 15,1 | 0.7 | 1.2 | 0.61 | 1.00 | 0.265 | 0.265 | 0.999 | 0.602 | 1546,690 | 120 by 100 |
| 1520 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 5,2 | 0.7 | 1.1 | 0.61 | 1.00 | 0.265 | 0.265 | 0.999 | 0.602 | 1758,798 | 212 by 72 |
| 1521 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 11,1 | 0.7 | 1.1 | 0.61 | 1.00 | 0.266 | 0.265 | 1.005 | 0.602 | 846,702 | 88 by 104 |
| 1521 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 14,6 | 0.6 | 1.0 | 0.61 | 1.00 | 0.265 | 0.265 | 0.998 | 0.602 | 910,1002 | 248 by 132 |
| 1522 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 15,6 | 0.7 | 1.1 | 0.61 | 1.00 | 0.266 | 0.266 | 0.999 | 0.602 | 1750,802 | 256 by 200 |
| 1522 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 10,2 | 0.6 | 1.1 | 0.61 | 0.99 | 0.265 | 0.265 | 1.000 | 0.602 | 1650,746 | 76 by 68 |
| 1523 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 0,1 | 0.7 | 1.0 | 0.61 | 0.99 | 0.266 | 0.265 | 1.003 | 0.602 | 370,914 | 148 by 168 |
| 1523 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 5,1 | 0.7 | 1.2 | 0.61 | 0.98 | 0.264 | 0.266 | 0.995 | 0.602 | 514,678 | 168 by 80 |
| 1524 | 0.5 | 0.27 | 0.27 | 1.01 | 1.01 | 1.01 | 0.000 | 1.35 | 12,2 | 0.7 | 1.2 | 0.61 | 0.99 | 0.266 | 0.266 | 0.999 | 0.602 | 338,954 | 64 by 80 |
| 1524 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 14,0 | 0.7 | 1.3 | 0.61 | 0.99 | 0.266 | 0.265 | 1.002 | 0.602 | 982,682 | 144 by 168 |
| 1525 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 15,7 | 0.7 | 1.4 | 0.61 | 0.98 | 0.267 | 0.265 | 1.005 | 0.602 | 1006,998 | 112 by 108 |
| 1525 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.05 | 8,6 | 0.8 | 1.6 | 0.61 | 0.98 | 0.265 | 0.265 | 0.997 | 0.602 | 226,1018 | 64 by 60 |
| 1526 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 8,5 | 0.8 | 1.8 | 0.61 | 0.98 | 0.265 | 0.265 | 1.000 | 0.602 | 1658,750 | 196 by 116 |
| 1526 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 5,0 | 0.9 | 2.0 | 0.61 | 0.98 | 0.265 | 0.265 | 0.999 | 0.602 | 1674,818 | 96 by 108 |
| 1527 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 10,8 | 1.0 | 2.2 | 0.61 | 0.99 | 0.265 | 0.265 | 1.001 | 0.602 | 886,554 | 104 by 88 |
| 1527 + 1/2 | 0.4 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 3,7 | 1.2 | 2.6 | 0.61 | 0.98 | 0.266 | 0.265 | 1.004 | 0.601 | 398,902 | 236 by 176 |
| 1528 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 7,5 | 1.3 | 3.2 | 0.61 | 0.98 | 0.265 | 0.265 | 0.998 | 0.602 | 1246,590 | 80 by 60 |
| 1528 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 5,6 | 1.5 | 3.8 | 0.61 | 0.99 | 0.265 | 0.265 | 0.998 | 0.602 | 618,746 | 64 by 100 |
| 1529 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 6,6 | 1.6 | 4.2 | 0.61 | 0.98 | 0.266 | 0.265 | 1.002 | 0.602 | 638,730 | 100 by 64 |
| 1529 + 1/2 | 0.4 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.06 | 15,8 | 1.8 | 4.7 | 0.61 | 0.98 | 0.265 | 0.265 | 0.999 | 0.602 | 1910,978 | 52 by 128 |
| 1530 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 14,5 | 1.9 | 5.1 | 0.61 | 0.97 | 0.265 | 0.265 | 1.000 | 0.602 | 1694,650 | 72 by 84 |
| 1530 + 1/2 | 0.5 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 12,2 | 2.0 | 5.4 | 0.61 | 0.97 | 0.265 | 0.268 | 0.991 | 0.602 | 330,962 | 148 by 100 |
| 1531 | 0.7 | 0.28 | 0.28 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 3,5 | 2.1 | 5.8 | 0.61 | 0.97 | 0.270 | 0.270 | 0.997 | 0.603 | 602,694 | 76 by 104 |
| 1531 + 1/2 | 0.9 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 3,5 | 2.3 | 6.1 | 0.61 | 1.01 | 0.276 | 0.276 | 1.000 | 0.603 | 458,662 | 180 by 84 |
| 1532 | 1.3 | 0.29 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 14,6 | 2.8 | 6.2 | 0.61 | 1.02 | 0.281 | 0.281 | 1.001 | 0.604 | 342,954 | 112 by 128 |
| 1532 + 1/2 | 1.6 | 0.30 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 12,1 | 3.6 | 7.3 | 0.61 | 1.01 | 0.287 | 0.287 | 0.999 | 0.605 | 626,738 | 72 by 68 |
| 1533 | 2.0 | 0.32 | 0.32 | 1.01 | 1.01 | 1.01 | 0.000 | 1.23 | 12,1 | 4.7 | 7.4 | 0.61 | 1.02 | 0.292 | 0.292 | 1.003 | 0.606 | 1654,642 | 172 by 76 |
| 1533 + 1/2 | 2.4 | 0.33 | 0.33 | 1.00 | 1.00 | 1.00 | 0.000 | 1.45 | 11,1 | 5.8 | 8.4 | 0.61 | 1.01 | 0.296 | 0.296 | 1.000 | 0.607 | 1682,646 | 136 by 80 |
| 1534 | 2.7 | 0.34 | 0.34 | 1.00 | 1.00 | 1.00 | 0.000 | 1.47 | 11,1 | 7.0 | 9.5 | 0.61 | 0.99 | 0.301 | 0.301 | 0.998 | 0.609 | 1666,654 | 68 by 84 |
| 1534 + 1/2 | 3.1 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.000 | 1.80 | 11,1 | 8.3 | 10.6 | 0.61 | 1.00 | 0.306 | 0.306 | 1.001 | 0.612 | 1650,646 | 92 by 72 |
| 1535 | 3.5 | 0.37 | 0.37 | 1.00 | 1.00 | 1.00 | 0.000 | 1.77 | 11,1 | 9.8 | 11.5 | 0.61 | 1.00 | 0.311 | 0.311 | 0.999 | 0.614 | 1618,634 | 136 by 76 |
| 1535 + 1/2 | 3.9 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.002 | 1.96 | 11,1 | 11.2 | 12.4 | 0.62 | 0.99 | 0.316 | 0.316 | 0.999 | 0.615 | 1658,658 | 88 by 76 |
| 1536 | 4.3 | 0.39 | 0.40 | 1.00 | 1.00 | 1.00 | 0.000 | 2.12 | 11,1 | 12.6 | 14.0 | 0.62 | 1.00 | 0.322 | 0.320 | 1.004 | 0.618 | 1642,658 | 132 by 96 |
| 1536 + 1/2 | 4.7 | 0.41 | 0.41 | 1.01 | 1.01 | 1.01 | 0.001 | 2.01 | 12,1 | 14.1 | 15.8 | 0.62 | 1.00 | 0.325 | 0.326 | 0.998 | 0.620 | 1646,666 | 116 by 92 |
| 1537 | 5.2 | 0.42 | 0.42 | 1.00 | 0.99 | 0.99 | 0.006 | 2.12 | 11,1 | 15.6 | 17.7 | 0.62 | 1.00 | 0.330 | 0.331 | 0.997 | 0.623 | 1606,650 | 148 by 108 |
| 1537 + 1/2 | 5.6 | 0.44 | 0.43 | 1.00 | 1.00 | 1.00 | 0.006 | 2.15 | 11,1 | 16.9 | 20.2 | 0.62 | 1.01 | 0.337 | 0.333 | 1.010 | 0.626 | 1602,654 | 84 by 72 |
| 1538 | 6.1 | 0.45 | 0.45 | 1.00 | 1.00 | 1.00 | 0.006 | 2.22 | 11,1 | 18.8 | 24.6 | 0.63 | 1.00 | 0.337 | 0.338 | 0.997 | 0.629 | 1590,654 | 88 by 68 |
| 1538 + 1/2 | 6.6 | 0.46 | 0.46 | 1.00 | 1.01 | 1.00 | 0.005 | 2.22 | 12,1 | 20.3 | 29.0 | 0.63 | 1.00 | 0.341 | 0.338 | 1.011 | 0.632 | 1574,654 | 172 by 92 |
| 1539 | 7.0 | 0.47 | 0.58 | 0.81 | 0.81 | 0.81 | 0.012 | 2.30 | 12,1 | 22.3 | 32.1 | 0.63 | 0.95 | 0.339 | 0.486 | 0.697 | 0.636 | 1586,670 | 92 by 72 |
| 1539 + 1/2 | 7.6 | 0.96 | 0.59 | 1.63 | 1.62 | 1.62 | 0.016 | 3.93 | 0,8 | 24.2 | 35.5 | 0.63 | 1.18 | 0.930 | 0.486 | 1.915 | 0.639 | 62,742 | 328 by 448 |
| 1540 | 8.0 | 0.71 | 0.74 | 0.96 | 0.99 | 0.96 | 0.015 | 1.67 | 13,2 | 25.8 | 45.7 | 0.63 | 0.98 | 0.630 | 0.645 | 0.976 | 0.643 | 1586,686 | 132 by 112 |
| 1540 + 1/2 | 8.5 | 0.74 | 0.74 | 0.99 | 1.00 | 0.99 | 0.020 | 1.58 | 13,2 | 28.8 | 51.4 | 0.64 | 1.00 | 0.641 | 0.660 | 0.971 | 0.647 | 1574,682 | 72 by 68 |
| 1541 | 9.0 | 0.75 | 0.74 | 1.01 | 1.02 | 1.01 | 0.014 | 2.79 | 0,3 | 32.0 | 52.5 | 0.64 | 0.99 | 0.650 | 0.655 | 0.993 | 0.651 | 1554,678 | 76 by 80 |
| 1541 + 1/2 | 9.4 | 0.74 | 0.75 | 1.00 | 0.95 | 0.95 | 0.035 | 1.54 | 15,8 | 34.7 | 54.2 | 0.64 | 0.96 | 0.669 | 0.672 | 0.995 | 0.656 | 1550,686 | 104 by 88 |
| 1542 | 9.9 | 0.74 | 0.76 | 0.98 | 0.97 | 0.97 | 0.023 | 1.64 | 2,7 | 36.7 | 53.3 | 0.65 | 0.98 | 0.694 | 0.692 | 1.002 | 0.660 | 1538,686 | 108 by 84 |
| 1542 + 1/2 | 10.3 | 0.75 | 0.78 | 0.96 | 0.96 | 0.96 | 0.022 | 1.70 | 2,7 | 39.0 | 60.2 | 0.66 | 0.97 | 0.716 | 0.714 | 1.003 | 0.665 | 1530,694 | 156 by 104 |
| 1543 | 10.7 | 0.77 | 0.80 | 0.95 | 0.96 | 0.95 | 0.018 | 1.76 | 3,7 | 41.5 | 62.4 | 0.66 | 0.98 | 0.733 | 0.733 | 1.001 | 0.670 | 1518,690 | 96 by 80 |
| 1543 + 1/2 | 11.0 | 0.79 | 0.84 | 0.95 | 0.95 | 0.95 | 0.019 | 1.92 | 3,7 | 44.7 | 63.9 | 0.67 | 0.98 | 0.750 | 0.752 | 0.997 | 0.676 | 1498,690 | 64 by 72 |
| 1544 | 11.5 | 0.82 | 0.89 | 0.92 | 0.91 | 0.91 | 0.019 | 2.04 | 3,7 | 47.6 | 70.7 | 0.67 | 0.97 | 0.770 | 0.773 | 0.997 | 0.681 | 1486,694 | 88 by 76 |
| 1544 + 1/2 | 11.7 | 0.86 | 0.94 | 0.91 | 0.90 | 0.90 | 0.016 | 2.09 | 3,7 | 53.8 | 68.7 | 0.68 | 0.97 | 0.796 | 0.811 | 0.982 | 0.687 | 1466,694 | 92 by 84 |
| 1545 | 12.1 | 0.92 | 0.99 | 0.94 | 0.95 | 0.94 | 0.014 | 2.05 | 3,7 | 54.5 | 77.4 | 0.69 | 0.97 | 0.851 | 0.865 | 0.984 | 0.693 | 594,294 | 104 by 36 |
| 1545 + 1/2 | 12.3 | 1.01 | 1.07 | 0.95 | 0.94 | 0.94 | 0.021 | 1.97 | 3,7 | 61.4 | 87.4 | 0.69 | 0.98 | 0.934 | 0.978 | 0.955 | 0.699 | 6,354 | 112 by 48 |
| 1546 | 12.6 | 1.17 | 1.17 | 1.00 | 0.99 | 0.99 | 0.018 | 4.32 | 0,3 | 63.1 | 80.2 | 0.70 | 0.99 | 1.105 | 1.114 | 0.992 | 0.705 | 62,366 | 220 by 76 |
| 1546 + 1/2 | 12.8 | 1.33 | 1.29 | 1.03 | 1.06 | 1.03 | 0.016 | 8.29 | 0,3 | 64.8 | 75.0 | 0.71 | 1.02 | 1.294 | 1.225 | 1.057 | 0.712 | 50,402 | 268 by 108 |
| 1547 | 13.3 | 1.40 | 1.37 | 1.02 | 1.13 | 1.02 | 0.008 | 7.79 | 1,3 | 63.3 | 73.6 | 0.72 | 1.01 | 1.371 | 1.320 | 1.039 | 0.719 | 850,298 | 212 by 56 |
| 1547 + 1/2 | 13.6 | 1.41 | 1.36 | 1.04 | 1.15 | 1.04 | 0.002 | 3.77 | 2,3 | 61.8 | 72.6 | 0.73 | 0.99 | 1.345 | 1.373 | 0.980 | 0.726 | 1122,318 | 244 by 60 |
| 1548 | 13.7 | 1.48 | 1.36 | 1.08 | 1.19 | 1.08 | 0.006 | 4.86 | 15,4 | 60.3 | 71.2 | 0.74 | 0.99 | 1.375 | 1.385 | 0.992 | 0.733 | 1874,506 | 228 by 120 |
| 1548 + 1/2 | 14.0 | 1.56 | 1.36 | 1.14 | 1.26 | 1.14 | 0.002 | 6.20 | 15,4 | 55.2 | 74.3 | 0.74 | 1.02 | 1.413 | 1.375 | 1.028 | 0.741 | 1850,522 | 212 by 136 |
| 1549 | 14.3 | 1.59 | 1.36 | 1.16 | 1.25 | 1.16 | 0.014 | 5.39 | 14,4 | 51.0 | 72.4 | 0.75 | 1.00 | 1.400 | 1.375 | 1.018 | 0.749 | 1814,554 | 208 by 96 |
| 1549 + 1/2 | 14.6 | 1.60 | 1.36 | 1.17 | 1.29 | 1.17 | 0.006 | 3.66 | 14,4 | 48.6 | 68.3 | 0.75 | 0.99 | 1.375 | 1.383 | 0.994 | 0.757 | 1650,522 | 104 by 60 |
| 1550 | 15.0 | 1.58 | 1.36 | 1.16 | 1.22 | 1.16 | 0.025 | 3.32 | 2,1 | 47.0 | 65.0 | 0.76 | 0.99 | 1.353 | 1.376 | 0.984 | 0.765 | 114,1074 | 76 by 28 |
| 1550 + 1/2 | 15.4 | 1.64 | 1.36 | 1.20 | 1.26 | 1.202 | 0.024 | 3.46 | 3,1 | 45.1 | 58.2 | 0.77 | 1.00 | 1.366 | 1.372 | 0.995 | 0.774 | 1582,630 | 224 by 120 |
| 1551 | 15.8 | 1.65 | 1.36 | 1.21 | 1.28 | 1.21 | 0.019 | 3.57 | 6,1 | 43.1 | 58.1 | 0.78 | 1.02 | 1.376 | 1.360 | 1.012 | 0.783 | 198,1074 | 64 by 28 |
| 1551 + 1/2 | 16.2 | 1.70 | 1.36 | 1.25 | 1.28 | 1.25 | 0.029 | 3.53 | 11,1 | 42.7 | 49.9 | 0.78 | 1.04 | 1.370 | 1.355 | 1.011 | 0.792 | 234,1074 | 116 by 40 |
| 1552 | 16.6 | 1.69 | 1.36 | 1.24 | 1.23 | 1.23 | 0.040 | 4.29 | 11,1 | 42.8 | 45.4 | 0.79 | 1.04 | 1.344 | 1.345 | 0.999 | 0.801 | 1914,1074 | 40 by 28 |
| 1552 + 1/2 | 17.0 | 1.72 | 1.36 | 1.26 | 1.25 | 1.25 | 0.040 | 4.80 | 11,1 | 43.9 | 47.0 | 0.81 | 1.06 | 1.321 | 1.316 | 1.004 | 0.811 | 1906,1074 | 52 by 32 |
| 1553 | 17.4 | 1.73 | 1.36 | 1.27 | 1.26 | 1.26 | 0.044 | 5.06 | 11,1 | 45.3 | 48.3 | 0.82 | 1.07 | 1.287 | 1.287 | 1.000 | 0.820 | 762,130 | 120 by 36 |
| 1553 + 1/2 | 17.5 | 1.72 | 1.36 | 1.26 | 1.21 | 1.21 | 0.048 | 5.62 | 11,1 | 46.7 | 49.9 | 0.82 | 1.06 | 1.253 | 1.247 | 1.005 | 0.831 | 1802,1074 | 72 by 36 |
| 1554 | 17.8 | 1.70 | 1.36 | 1.24 | 1.07 | 1.07 | 0.055 | 3.87 | 3,0 | 48.0 | 52.0 | 0.83 | 1.00 | 1.206 | 1.208 | 0.998 | 0.841 | 1758,1074 | 76 by 44 |
| 1554 + 1/2 | 17.9 | 1.62 | 1.36 | 1.19 | 1.01 | 1.01 | 0.058 | 4.53 | 5,0 | 49.3 | 54.2 | 0.84 | 0.94 | 1.163 | 1.155 | 1.007 | 0.851 | 1714,1074 | 68 by 56 |
| 1555 | 18.0 | 1.51 | 1.35 | 1.12 | 0.96 | 0.96 | 0.045 | 3.13 | 12,1 | 50.5 | 56.3 | 0.86 | 0.91 | 1.104 | 1.110 | 0.995 | 0.862 | 1610,950 | 108 by 96 |
| 1555 + 1/2 | 18.1 | 1.29 | 1.35 | 0.95 | 1.05 | 0.95 | 0.012 | 3.74 | 11,0 | 51.6 | 58.6 | 0.87 | 0.96 | 1.056 | 1.063 | 0.994 | 0.873 | 1662,1074 | 76 by 40 |
| 1556 | 18.8 | 1.25 | 1.29 | 0.97 | 0.98 | 0.97 | 0.024 | 3.46 | 10,0 | 52.7 | 60.7 | 0.88 | 0.96 | 1.022 | 1.025 | 0.997 | 0.884 | 546,42 | 96 by 40 |
| 1556 + 1/2 | 19.2 | 1.23 | 1.28 | 0.96 | 0.88 | 0.88 | 0.046 | 2.31 | 0,0 | 53.8 | 62.6 | 0.89 | 0.92 | 0.993 | 1.021 | 0.972 | 0.893 | 898,38 | 96 by 40 |
| 1557 | 18.7 | 1.17 | 1.28 | 0.92 | 0.89 | 0.89 | 0.039 | 3.60 | 10,0 | 54.7 | 64.6 | 0.90 | 0.95 | 0.993 | 1.021 | 0.973 | 0.900 | 870,1074 | 48 by 28 |
| 1557 + 1/2 | 19.3 | 1.20 | 1.28 | 0.94 | 0.86 | 0.86 | 0.057 | 2.01 | 0,4 | 55.2 | 66.2 | 0.91 | 0.92 | 1.020 | 1.027 | 0.993 | 0.906 | 1086,46 | 68 by 44 |
| 1558 | 19.6 | 1.19 | 1.28 | 0.93 | 0.90 | 0.90 | 0.055 | 2.38 | 0,8 | 55.4 | 67.0 | 0.91 | 0.95 | 1.061 | 1.051 | 1.010 | 0.910 | 6,1022 | 68 by 88 |
| 1558 + 1/2 | 19.9 | 1.19 | 1.28 | 0.93 | 0.94 | 0.93 | 0.046 | 2.81 | 11,0 | 55.0 | 67.5 | 0.92 | 0.97 | 1.082 | 1.072 | 1.009 | 0.914 | 1322,1074 | 96 by 32 |
| 1559 | 19.0 | 1.24 | 1.28 | 0.97 | 1.00 | 0.97 | 0.029 | 2.73 | 11,0 | 54.4 | 67.2 | 0.93 | 0.97 | 1.084 | 1.088 | 0.996 | 0.920 | 1226,46 | 68 by 52 |
| 1559 + 1/2 | 19.4 | 1.27 | 1.28 | 0.99 | 0.99 | 0.99 | 0.034 | 2.11 | 1,3 | 53.3 | 66.4 | 0.94 | 0.98 | 1.094 | 1.085 | 1.009 | 0.926 | 206,1074 | 104 by 76 |
| 1560 | 19.3 | 1.25 | 1.28 | 0.98 | 1.03 | 0.98 | 0.025 | 1.94 | 1,7 | 51.9 | 65.1 | 0.94 | 0.97 | 1.097 | 1.087 | 1.010 | 0.929 | 1914,1074 | 60 by 28 |
| 1560 + 1/2 | 19.9 | 1.24 | 1.28 | 0.97 | 0.98 | 0.97 | 0.031 | 1.81 | 0,4 | 50.2 | 63.4 | 0.94 | 0.97 | 1.085 | 1.091 | 0.995 | 0.931 | 1018,1074 | 84 by 32 |
| 1561 | 19.8 | 1.26 | 1.28 | 0.99 | 1.01 | 0.99 | 0.027 | 1.78 | 0,8 | 48.5 | 61.4 | 0.94 | 0.98 | 1.088 | 1.083 | 1.005 | 0.935 | 866,1074 | 68 by 28 |
| 1561 + 1/2 | 20.2 | 1.27 | 1.28 | 0.99 | 1.04 | 0.99 | 0.023 | 1.78 | 15,8 | 46.7 | 59.2 | 0.95 | 1.00 | 1.081 | 1.075 | 1.005 | 0.936 | 1638,1074 | 76 by 32 |
| 1562 | 20.4 | 1.29 | 1.27 | 1.02 | 0.95 | 0.95 | 0.035 | 1.63 | 9,3 | 44.9 | 56.9 | 0.95 | 1.01 | 1.065 | 1.049 | 1.014 | 0.938 | 1470,1074 | 72 by 24 |
| 1562 + 1/2 | 21.5 | 1.21 | 1.28 | 0.95 | 0.88 | 0.88 | 0.036 | 1.80 | 15,8 | 43.2 | 54.5 | 0.95 | 1.01 | 1.018 | 0.982 | 1.036 | 0.939 | 1522,1074 | 64 by 32 |
| 1563 | 23.4 | 1.08 | 1.28 | 0.85 | 0.78 | 0.78 | 0.037 | 1.58 | 12,8 | 41.7 | 52.3 | 0.95 | 0.99 | 0.900 | 0.901 | 1.000 | 0.939 | 1470,1074 | 104 by 40 |
| 1563 + 1/2 | 23.6 | 1.07 | 1.28 | 0.84 | 0.71 | 0.71 | 0.023 | 1.51 | 9,3 | 40.3 | 50.4 | 0.95 | 0.99 | 0.783 | 0.808 | 0.969 | 0.940 | 1366,1074 | 84 by 68 |
| 1564 | 23.1 | 1.27 | 1.28 | 0.99 | 0.77 | 0.77 | 0.028 | 5.00 | 15,2 | 39.0 | 48.4 | 0.95 | 1.00 | 0.716 | 0.757 | 0.947 | 0.939 | 1814,354 | 104 by 112 |
| 1564 + 1/2 | 22.5 | 1.27 | 1.29 | 0.98 | 0.64 | 0.64 | 0.035 | 1.37 | 11,8 | 37.8 | 46.5 | 0.95 | 0.91 | 0.685 | 0.757 | 0.905 | 0.939 | 1134,1074 | 64 by 32 |
| 1565 | 22.4 | 1.42 | 1.29 | 1.11 | 0.70 | 0.70 | 0.039 | 1.46 | 6,4 | 36.8 | 44.7 | 0.95 | 0.93 | 0.730 | 0.770 | 0.948 | 0.938 | 1390,382 | 60 by 52 |
| 1565 + 1/2 | 22.5 | 1.46 | 1.34 | 1.09 | 0.69 | 0.69 | 0.048 | 1.54 | 6,4 | 36.2 | 43.0 | 0.95 | 0.89 | 0.824 | 0.837 | 0.984 | 0.937 | 1362,1074 | 60 by 28 |
| 1566 | 22.9 | 1.40 | 1.42 | 0.99 | 0.77 | 0.77 | 0.047 | 1.52 | 6,4 | 36.9 | 41.6 | 0.94 | 0.91 | 0.945 | 0.958 | 0.986 | 0.935 | 1358,398 | 60 by 64 |
| 1566 + 1/2 | 23.1 | 1.28 | 1.44 | 0.89 | 0.95 | 0.89 | 0.022 | 1.73 | 15,2 | 37.8 | 40.3 | 0.94 | 0.91 | 1.092 | 1.094 | 0.998 | 0.933 | 6,434 | 48 by 136 |
| 1567 | 23.0 | 1.42 | 1.51 | 0.94 | 0.99 | 0.94 | 0.023 | 1.55 | 15,3 | 38.9 | 41.0 | 0.94 | 0.95 | 1.244 | 1.235 | 1.007 | 0.930 | 1246,1074 | 68 by 28 |
| 1567 + 1/2 | 22.9 | 1.56 | 1.57 | 0.99 | 1.06 | 0.99 | 0.014 | 1.66 | 15,3 | 39.9 | 41.9 | 0.94 | 0.96 | 1.377 | 1.375 | 1.002 | 0.927 | 814,1074 | 48 by 40 |
| 1568 | 22.5 | 1.68 | 1.63 | 1.03 | 1.03 | 1.03 | 0.044 | 2.08 | 15,4 | 40.8 | 42.7 | 0.93 | 0.99 | 1.505 | 1.497 | 1.005 | 0.922 | 6,854 | 36 by 64 |
| 1568 + 1/2 | 22.5 | 1.76 | 1.62 | 1.09 | 1.11 | 1.09 | 0.034 | 1.74 | 15,5 | 41.5 | 43.4 | 0.92 | 0.99 | 1.617 | 1.610 | 1.004 | 0.915 | 774,1074 | 56 by 40 |
| 1569 | 22.8 | 1.84 | 1.62 | 1.14 | 1.15 | 1.14 | 0.048 | 2.21 | 15,5 | 41.9 | 43.8 | 0.91 | 1.02 | 1.716 | 1.710 | 1.003 | 0.905 | 1406,1074 | 60 by 40 |
| 1569 + 1/2 | 22.3 | 1.93 | 1.62 | 1.19 | 1.18 | 1.18 | 0.061 | 2.02 | 14,3 | 42.2 | 43.9 | 0.90 | 1.05 | 1.802 | 1.802 | 1.000 | 0.895 | 6,514 | 32 by 76 |
| 1570 | 22.7 | 2.00 | 1.62 | 1.23 | 1.22 | 1.22 | 0.068 | 2.22 | 14,3 | 42.2 | 43.9 | 0.89 | 1.07 | 1.888 | 1.871 | 1.009 | 0.885 | 6,1034 | 44 by 96 |
| 1570 + 1/2 | 22.5 | 2.06 | 1.62 | 1.27 | 1.21 | 1.21 | 0.094 | 2.01 | 14,5 | 42.0 | 43.8 | 0.88 | 1.09 | 1.941 | 1.943 | 0.999 | 0.875 | 6,318 | 40 by 88 |
| 1571 | 22.3 | 2.11 | 1.62 | 1.30 | 1.26 | 1.26 | 0.089 | 2.17 | 14,4 | 41.6 | 43.3 | 0.87 | 1.11 | 1.999 | 1.993 | 1.003 | 0.865 | 1286,1074 | 104 by 40 |
| 1571 + 1/2 | 21.8 | 2.16 | 1.62 | 1.33 | 1.32 | 1.32 | 0.077 | 2.01 | 14,8 | 41.1 | 43.1 | 0.86 | 1.11 | 2.045 | 2.034 | 1.005 | 0.855 | 590,1074 | 72 by 36 |
| 1572 | 21.5 | 2.15 | 1.62 | 1.33 | 1.27 | 1.27 | 0.109 | 2.01 | 0,6 | 40.4 | 42.6 | 0.85 | 1.11 | 2.069 | 2.046 | 1.011 | 0.844 | 6,734 | 56 by 104 |
| 1572 + 1/2 | 20.9 | 2.14 | 1.62 | 1.33 | 1.28 | 1.28 | 0.103 | 2.84 | 14,4 | 39.5 | 41.7 | 0.84 | 1.11 | 2.084 | 2.046 | 1.019 | 0.834 | 250,1074 | 64 by 36 |
| 1573 | 20.2 | 2.12 | 1.62 | 1.31 | 1.24 | 1.24 | 0.129 | 2.19 | 13,2 | 38.4 | 40.9 | 0.83 | 1.09 | 2.048 | 2.032 | 1.008 | 0.823 | 790,1074 | 76 by 36 |
| 1573 + 1/2 | 20.4 | 2.10 | 1.62 | 1.30 | 1.15 | 1.15 | 0.160 | 1.88 | 0,4 | 37.2 | 39.7 | 0.82 | 1.04 | 1.996 | 1.985 | 1.005 | 0.813 | 6,274 | 48 by 156 |
| 1574 | 21.0 | 2.00 | 1.62 | 1.24 | 1.16 | 1.16 | 0.135 | 2.10 | 13,7 | 35.9 | 38.7 | 0.81 | 1.05 | 1.923 | 1.922 | 1.001 | 0.802 | 6,350 | 32 by 84 |
| 1574 + 1/2 | 21.2 | 1.94 | 1.62 | 1.20 | 1.08 | 1.08 | 0.143 | 1.64 | 0,6 | 34.5 | 37.1 | 0.80 | 1.02 | 1.848 | 1.850 | 0.999 | 0.791 | 238,750 | 144 by 160 |
| 1575 | 22.0 | 1.84 | 1.62 | 1.14 | 1.04 | 1.04 | 0.159 | 1.68 | 12,8 | 33.2 | 36.1 | 0.79 | 0.96 | 1.777 | 1.778 | 1.000 | 0.780 | 1038,1074 | 52 by 28 |
| 1575 + 1/2 | 21.9 | 1.80 | 1.62 | 1.11 | 1.06 | 1.06 | 0.098 | 2.33 | 14,5 | 31.7 | 34.7 | 0.77 | 1.04 | 1.707 | 1.704 | 1.002 | 0.769 | 382,1074 | 52 by 24 |
| 1576 | 21.8 | 1.71 | 1.61 | 1.06 | 0.99 | 0.99 | 0.116 | 1.90 | 12,8 | 30.2 | 33.3 | 0.76 | 1.00 | 1.630 | 1.635 | 0.997 | 0.757 | 122,366 | 72 by 148 |
| 1576 + 1/2 | 23.1 | 1.54 | 1.59 | 0.97 | 0.99 | 0.97 | 0.076 | 1.42 | 13,2 | 28.9 | 32.2 | 0.75 | 0.99 | 1.562 | 1.564 | 0.999 | 0.743 | 834,982 | 160 by 84 |
| 1577 | 22.8 | 1.47 | 1.47 | 1.00 | 1.01 | 1.00 | 0.045 | 1.42 | 13,5 | 27.4 | 32.0 | 0.73 | 1.00 | 1.498 | 1.494 | 1.003 | 0.728 | 54,246 | 60 by 84 |
| 1577 + 1/2 | 21.7 | 1.39 | 1.40 | 1.00 | 1.00 | 1.00 | 0.045 | 1.52 | 12,6 | 26.0 | 29.1 | 0.71 | 1.00 | 1.425 | 1.428 | 0.998 | 0.712 | 430,970 | 52 by 56 |
| 1578 | 20.9 | 1.32 | 1.32 | 1.00 | 0.99 | 0.99 | 0.048 | 1.42 | 12,5 | 24.5 | 27.4 | 0.70 | 0.99 | 1.358 | 1.358 | 1.000 | 0.696 | 318,198 | 116 by 112 |
| 1578 + 1/2 | 19.9 | 1.24 | 1.25 | 0.99 | 1.01 | 0.99 | 0.039 | 1.76 | 12,5 | 23.0 | 26.1 | 0.68 | 1.00 | 1.290 | 1.292 | 0.999 | 0.677 | 338,210 | 84 by 96 |
| 1579 | 19.1 | 1.18 | 1.19 | 0.99 | 1.00 | 0.99 | 0.038 | 1.71 | 12,5 | 21.5 | 24.6 | 0.66 | 0.99 | 1.226 | 1.225 | 1.001 | 0.658 | 358,226 | 160 by 360 |
| 1579 + 1/2 | 18.1 | 1.13 | 1.13 | 1.00 | 0.98 | 0.98 | 0.042 | 1.59 | 10,8 | 20.1 | 23.0 | 0.63 | 0.99 | 1.159 | 1.164 | 0.996 | 0.637 | 402,346 | 148 by 288 |
| 1580 | 17.1 | 1.08 | 1.08 | 1.00 | 1.02 | 1.00 | 0.035 | 1.66 | 11,6 | 18.6 | 21.3 | 0.61 | 1.00 | 1.102 | 1.097 | 1.005 | 0.616 | 410,374 | 100 by 220 |
| 1580 + 1/2 | 16.4 | 1.04 | 1.04 | 1.00 | 0.98 | 0.98 | 0.053 | 1.53 | 1,8 | 17.1 | 19.6 | 0.59 | 0.97 | 1.035 | 1.033 | 1.002 | 0.596 | 438,518 | 68 by 80 |
| 1581 | 15.6 | 0.99 | 0.99 | 1.00 | 1.02 | 1.00 | 0.041 | 2.26 | 11,6 | 15.6 | 17.8 | 0.57 | 1.00 | 0.964 | 0.964 | 1.000 | 0.576 | 474,442 | 148 by 256 |
| 1581 + 1/2 | 14.9 | 0.94 | 0.94 | 1.01 | 0.95 | 0.95 | 0.065 | 2.67 | 2,8 | 14.0 | 16.1 | 0.55 | 0.96 | 0.893 | 0.900 | 0.992 | 0.556 | 878,370 | 92 by 152 |
| 1582 | 14.2 | 0.88 | 0.89 | 0.99 | 1.04 | 0.99 | 0.037 | 2.32 | 2,8 | 12.6 | 14.7 | 0.53 | 1.00 | 0.837 | 0.837 | 1.000 | 0.536 | 222,286 | 68 by 80 |
| 1582 + 1/2 | 13.6 | 0.84 | 0.84 | 1.00 | 0.98 | 0.98 | 0.054 | 2.21 | 3,8 | 11.3 | 13.1 | 0.51 | 1.00 | 0.780 | 0.779 | 1.001 | 0.516 | 482,6 | 96 by 76 |
| 1583 | 12.9 | 0.81 | 0.81 | 0.99 | 0.99 | 0.99 | 0.057 | 2.22 | 3,8 | 9.9 | 11.7 | 0.49 | 1.00 | 0.722 | 0.728 | 0.991 | 0.496 | 846,378 | 88 by 92 |
| 1583 + 1/2 | 12.2 | 0.78 | 0.78 | 1.01 | 1.00 | 1.00 | 0.057 | 2.52 | 8,8 | 8.7 | 10.4 | 0.47 | 0.99 | 0.676 | 0.675 | 1.001 | 0.477 | 882,442 | 80 by 160 |
| 1584 | 11.8 | 0.75 | 0.75 | 0.99 | 1.03 | 0.99 | 0.045 | 2.21 | 9,7 | 7.6 | 9.2 | 0.45 | 1.01 | 0.628 | 0.630 | 0.997 | 0.459 | 870,54 | 108 by 60 |
| 1584 + 1/2 | 11.2 | 0.73 | 0.72 | 1.00 | 0.96 | 0.96 | 0.061 | 2.66 | 6,8 | 6.4 | 7.9 | 0.43 | 0.98 | 0.584 | 0.590 | 0.990 | 0.443 | 970,618 | 60 by 60 |
| 1585 | 10.8 | 0.70 | 0.69 | 1.01 | 1.02 | 1.01 | 0.050 | 2.55 | 9,7 | 5.6 | 7.0 | 0.42 | 1.00 | 0.552 | 0.546 | 1.011 | 0.428 | 654,6 | 124 by 44 |
| 1585 + 1/2 | 10.4 | 0.66 | 0.67 | 0.98 | 0.99 | 0.98 | 0.045 | 2.69 | 9,7 | 4.7 | 6.0 | 0.40 | 1.00 | 0.507 | 0.514 | 0.986 | 0.413 | 682,302 | 124 by 140 |
| 1586 | 10.0 | 0.64 | 0.64 | 1.01 | 1.00 | 1.00 | 0.045 | 2.42 | 7,8 | 3.9 | 5.2 | 0.39 | 0.98 | 0.477 | 0.477 | 1.000 | 0.399 | 834,454 | 64 by 80 |
| 1586 + 1/2 | 9.7 | 0.62 | 0.62 | 0.99 | 1.00 | 0.99 | 0.034 | 2.34 | 6,8 | 3.4 | 4.5 | 0.38 | 1.00 | 0.447 | 0.451 | 0.991 | 0.386 | 1174,642 | 44 by 56 |
| 1587 | 9.2 | 0.59 | 0.59 | 1.01 | 1.00 | 1.00 | 0.034 | 2.49 | 8,7 | 2.7 | 3.7 | 0.37 | 1.00 | 0.425 | 0.424 | 1.003 | 0.373 | 602,6 | 136 by 44 |
| 1587 + 1/2 | 9.0 | 0.57 | 0.57 | 0.99 | 1.01 | 0.99 | 0.024 | 2.97 | 9,6 | 2.3 | 3.2 | 0.36 | 1.00 | 0.400 | 0.406 | 0.986 | 0.362 | 1158,594 | 56 by 132 |
| 1588 | 8.6 | 0.55 | 0.55 | 1.01 | 1.02 | 1.01 | 0.026 | 2.76 | 9,6 | 2.0 | 2.7 | 0.35 | 1.00 | 0.387 | 0.386 | 1.003 | 0.350 | 810,462 | 64 by 80 |
| 1588 + 1/2 | 8.3 | 0.53 | 0.54 | 0.99 | 0.96 | 0.96 | 0.038 | 2.59 | 9,6 | 1.9 | 2.5 | 0.34 | 0.99 | 0.371 | 0.371 | 0.999 | 0.340 | 882,494 | 60 by 64 |
| 1589 | 7.9 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.033 | 2.48 | 10,2 | 1.9 | 2.7 | 0.33 | 1.01 | 0.356 | 0.360 | 0.988 | 0.330 | 970,602 | 56 by 52 |
| 1589 + 1/2 | 7.6 | 0.51 | 0.51 | 1.01 | 0.99 | 0.99 | 0.037 | 2.19 | 10,2 | 2.0 | 2.9 | 0.32 | 0.99 | 0.348 | 0.348 | 1.002 | 0.321 | 634,210 | 96 by 64 |
| 1590 | 7.3 | 0.49 | 0.50 | 0.99 | 0.97 | 0.97 | 0.034 | 1.93 | 9,6 | 2.2 | 3.2 | 0.31 | 1.00 | 0.340 | 0.339 | 1.002 | 0.312 | 790,466 | 68 by 60 |
| 1590 + 1/2 | 6.8 | 0.48 | 0.49 | 0.99 | 0.96 | 0.96 | 0.035 | 2.16 | 2,1 | 2.2 | 3.3 | 0.30 | 1.00 | 0.330 | 0.335 | 0.986 | 0.304 | 794,478 | 120 by 128 |
| 1591 | 6.5 | 0.49 | 0.49 | 1.00 | 0.99 | 0.99 | 0.029 | 2.19 | 2,1 | 2.4 | 3.4 | 0.29 | 0.99 | 0.330 | 0.329 | 1.001 | 0.296 | 834,370 | 72 by 76 |
| 1591 + 1/2 | 6.1 | 0.48 | 0.49 | 0.98 | 0.99 | 0.98 | 0.025 | 2.17 | 2,1 | 2.4 | 3.5 | 0.28 | 1.00 | 0.328 | 0.327 | 1.004 | 0.289 | 782,402 | 68 by 68 |
| 1592 | 5.8 | 0.49 | 0.48 | 1.02 | 1.02 | 1.02 | 0.022 | 2.07 | 2,1 | 2.5 | 3.6 | 0.28 | 1.00 | 0.324 | 0.323 | 1.002 | 0.282 | 982,202 | 108 by 92 |
| 1592 + 1/2 | 5.5 | 0.48 | 0.48 | 1.01 | 1.03 | 1.01 | 0.020 | 2.46 | 2,1 | 2.6 | 3.7 | 0.27 | 1.00 | 0.318 | 0.322 | 0.989 | 0.276 | 798,390 | 88 by 104 |
| 1593 | 5.1 | 0.47 | 0.47 | 1.01 | 1.02 | 1.01 | 0.018 | 2.37 | 2,1 | 2.7 | 4.0 | 0.27 | 1.00 | 0.315 | 0.319 | 0.987 | 0.270 | 818,506 | 56 by 68 |
| 1593 + 1/2 | 4.7 | 0.47 | 0.47 | 1.00 | 1.01 | 1.00 | 0.019 | 2.19 | 9,4 | 2.9 | 4.1 | 0.26 | 1.00 | 0.320 | 0.318 | 1.006 | 0.264 | 674,414 | 56 by 76 |
| 1594 | 4.5 | 0.46 | 0.46 | 0.99 | 1.02 | 0.99 | 0.014 | 2.02 | 9,4 | 3.0 | 4.2 | 0.26 | 1.00 | 0.317 | 0.317 | 0.999 | 0.258 | 806,354 | 80 by 64 |
| 1594 + 1/2 | 4.2 | 0.45 | 0.45 | 1.01 | 1.01 | 1.01 | 0.017 | 1.95 | 9,3 | 3.2 | 4.4 | 0.25 | 1.00 | 0.329 | 0.317 | 1.039 | 0.253 | 578,62 | 96 by 64 |
| 1595 | 3.8 | 0.44 | 0.44 | 0.99 | 1.01 | 0.99 | 0.012 | 1.86 | 8,0 | 3.3 | 4.6 | 0.25 | 1.00 | 0.312 | 0.317 | 0.987 | 0.248 | 630,270 | 68 by 92 |
| 1595 + 1/2 | 3.5 | 0.43 | 0.43 | 1.00 | 1.00 | 1.00 | 0.011 | 1.91 | 8,0 | 3.5 | 4.7 | 0.24 | 1.00 | 0.316 | 0.314 | 1.008 | 0.244 | 742,466 | 100 by 124 |
| 1596 | 3.3 | 0.42 | 0.42 | 1.00 | 1.01 | 1.00 | 0.008 | 1.82 | 3,0 | 3.6 | 4.8 | 0.24 | 0.99 | 0.314 | 0.313 | 1.003 | 0.239 | 758,478 | 72 by 76 |
| 1596 + 1/2 | 3.1 | 0.41 | 0.41 | 1.00 | 1.00 | 1.00 | 0.010 | 1.77 | 3,0 | 3.6 | 4.9 | 0.23 | 1.00 | 0.314 | 0.313 | 1.003 | 0.235 | 1026,542 | 72 by 112 |
| 1597 | 2.8 | 0.40 | 0.40 | 0.99 | 0.99 | 0.99 | 0.008 | 1.71 | 3,0 | 3.7 | 5.0 | 0.23 | 1.01 | 0.311 | 0.312 | 0.997 | 0.232 | 654,414 | 68 by 116 |
| 1597 + 1/2 | 2.7 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.006 | 1.65 | 8,1 | 3.8 | 5.0 | 0.23 | 1.00 | 0.311 | 0.310 | 1.005 | 0.228 | 802,518 | 84 by 52 |
| 1598 | 2.4 | 0.39 | 0.39 | 1.01 | 1.00 | 1.00 | 0.007 | 1.55 | 3,0 | 3.8 | 5.1 | 0.22 | 1.00 | 0.309 | 0.306 | 1.008 | 0.225 | 754,498 | 108 by 156 |
| 1598 + 1/2 | 2.1 | 0.38 | 0.38 | 1.00 | 1.01 | 1.00 | 0.003 | 1.92 | 4,0 | 3.8 | 4.9 | 0.22 | 1.01 | 0.300 | 0.306 | 0.982 | 0.222 | 558,298 | 144 by 244 |
| 1599 | 1.9 | 0.36 | 0.37 | 0.99 | 0.99 | 0.99 | 0.003 | 1.77 | 4,0 | 3.8 | 4.9 | 0.22 | 1.00 | 0.301 | 0.302 | 0.997 | 0.219 | 1018,458 | 76 by 100 |
| 1599 + 1/2 | 1.8 | 0.36 | 0.35 | 1.00 | 1.00 | 1.00 | 0.003 | 1.84 | 4,0 | 3.8 | 4.9 | 0.22 | 0.99 | 0.303 | 0.299 | 1.014 | 0.216 | 998,538 | 64 by 80 |
| 1600 | 1.6 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.000 | 1.64 | 4,0 | 3.9 | 5.0 | 0.21 | 1.01 | 0.297 | 0.299 | 0.993 | 0.214 | 634,434 | 64 by 64 |
| 1600 + 1/2 | 1.4 | 0.34 | 0.34 | 0.98 | 0.98 | 0.98 | 0.000 | 1.46 | 8,5 | 4.1 | 5.2 | 0.21 | 0.99 | 0.297 | 0.297 | 1.001 | 0.212 | 618,362 | 80 by 68 |
| 1601 | 1.3 | 0.33 | 0.34 | 0.96 | 0.96 | 0.96 | 0.000 | 1.43 | 8,5 | 4.3 | 5.4 | 0.21 | 1.01 | 0.297 | 0.297 | 0.999 | 0.210 | 974,610 | 52 by 60 |
| 1601 + 1/2 | 1.2 | 0.32 | 0.34 | 0.94 | 0.94 | 0.94 | 0.000 | 1.34 | 8,5 | 4.7 | 5.7 | 0.21 | 1.00 | 0.296 | 0.297 | 0.994 | 0.208 | 766,498 | 84 by 56 |
| 1602 | 1.1 | 0.32 | 0.34 | 0.94 | 0.94 | 0.94 | 0.000 | 1.29 | 8,5 | 5.3 | 6.3 | 0.20 | 1.00 | 0.301 | 0.297 | 1.013 | 0.206 | 706,462 | 128 by 120 |
| 1602 + 1/2 | 1.0 | 0.32 | 0.34 | 0.92 | 0.92 | 0.92 | 0.000 | 1.22 | 8,5 | 6.1 | 7.1 | 0.20 | 0.95 | 0.297 | 0.297 | 1.002 | 0.204 | 630,358 | 140 by 212 |
| 1603 | 0.9 | 0.31 | 0.34 | 0.90 | 0.90 | 0.90 | 0.000 | 1.15 | 8,5 | 7.1 | 8.2 | 0.20 | 0.95 | 0.298 | 0.299 | 0.997 | 0.203 | 874,402 | 72 by 72 |
| 1603 + 1/2 | 0.8 | 0.30 | 0.34 | 0.88 | 0.88 | 0.88 | 0.000 | 1.06 | 8,5 | 8.2 | 9.6 | 0.20 | 0.93 | 0.295 | 0.298 | 0.990 | 0.201 | 730,490 | 132 by 168 |
| 1604 | 0.8 | 0.30 | 0.34 | 0.88 | 0.88 | 0.88 | 0.000 | 1.07 | 5,4 | 9.7 | 11.6 | 0.20 | 0.92 | 0.300 | 0.295 | 1.019 | 0.200 | 694,462 | 128 by 92 |
| 1604 + 1/2 | 0.8 | 0.30 | 0.34 | 0.87 | 0.87 | 0.87 | 0.000 | 1.06 | 7,1 | 11.8 | 14.2 | 0.19 | 0.93 | 0.294 | 0.297 | 0.990 | 0.198 | 618,354 | 72 by 68 |
| 1605 | 0.8 | 0.30 | 0.34 | 0.87 | 0.87 | 0.87 | 0.000 | 1.07 | 4,3 | 13.8 | 16.4 | 0.19 | 0.92 | 0.294 | 0.299 | 0.984 | 0.197 | 610,394 | 84 by 108 |
| 1605 + 1/2 | 0.8 | 0.30 | 0.34 | 0.87 | 0.87 | 0.87 | 0.000 | 1.11 | 6,4 | 15.8 | 19.5 | 0.19 | 0.93 | 0.302 | 0.296 | 1.022 | 0.195 | 762,502 | 172 by 196 |
| 1606 | 0.8 | 0.30 | 0.34 | 0.87 | 0.87 | 0.87 | 0.000 | 1.11 | 8,4 | 18.0 | 22.6 | 0.19 | 0.93 | 0.297 | 0.300 | 0.989 | 0.194 | 798,466 | 172 by 136 |
| 1606 + 1/2 | 0.8 | 0.30 | 0.34 | 0.87 | 0.87 | 0.87 | 0.000 | 1.12 | 8,4 | 19.6 | 25.4 | 0.18 | 0.93 | 0.298 | 0.300 | 0.993 | 0.192 | 622,362 | 176 by 192 |
| 1607 | 0.8 | 0.30 | 0.34 | 0.88 | 0.88 | 0.88 | 0.000 | 1.19 | 7,4 | 22.2 | 28.8 | 0.18 | 0.94 | 0.305 | 0.298 | 1.022 | 0.191 | 718,486 | 96 by 120 |
| 1607 + 1/2 | 0.9 | 0.31 | 0.34 | 0.89 | 0.89 | 0.89 | 0.000 | 1.35 | 8,4 | 25.4 | 32.1 | 0.17 | 0.93 | 0.298 | 0.306 | 0.973 | 0.190 | 594,402 | 116 by 164 |
| 1608 | 1.1 | 0.32 | 0.34 | 0.93 | 0.93 | 0.93 | 0.000 | 1.50 | 8,4 | 27.5 | 32.9 | 0.17 | 0.91 | 0.308 | 0.314 | 0.980 | 0.189 | 682,442 | 92 by 124 |
| 1608 + 1/2 | 1.4 | 0.34 | 0.35 | 0.98 | 0.98 | 0.98 | 0.000 | 1.88 | 3,0 | 30.8 | 37.1 | 0.15 | 0.89 | 0.324 | 0.321 | 1.011 | 0.187 | 922,498 | 68 by 120 |
| 1609 | 1.7 | 0.36 | 0.36 | 1.00 | 0.99 | 0.99 | 0.005 | 2.80 | 3,0 |  |  |  | 1.04 | 0.333 | 0.330 | 1.010 | 0.186 | 582,390 | 60 by 88 |
| 1609 + 1/2 | 2.2 | 0.39 | 0.39 | 1.00 | 1.03 | 1.00 | 0.001 | 3.58 | 2,0 |  |  |  | 0.95 | 0.336 | 0.341 | 0.984 | 0.185 | 378,238 | 120 by 180 |
| 1610 | 2.7 | 0.41 | 0.41 | 1.01 | 1.05 | 1.01 | 0.004 | 4.78 | 2,0 |  |  |  | 0.97 | 0.349 | 0.355 | 0.984 | 0.184 | 338,294 | 136 by 176 |
| 1610 + 1/2 | 3.3 | 0.43 | 0.43 | 1.01 | 1.09 | 1.01 | 0.005 | 5.89 | 2,0 |  |  |  | 1.14 | 0.374 | 0.377 | 0.992 | 0.184 | 346,250 | 116 by 180 |
| 1611 | 4.1 | 0.45 | 0.43 | 1.05 | 1.07 | 1.05 | 0.018 | 6.87 | 2,0 |  |  |  | 0.96 | 0.405 | 0.403 | 1.005 | 0.183 | 314,282 | 140 by 184 |
| 1611 + 1/2 | 4.9 | 0.47 | 0.43 | 1.11 | 1.14 | 1.11 | 0.013 | 8.12 | 2,0 |  |  |  | 1.05 | 0.432 | 0.455 | 0.949 | 0.182 | 310,270 | 124 by 184 |
| 1612 | 5.8 | 0.50 | 0.43 | 1.17 | 1.14 | 1.14 | 0.026 | 4.95 | 2,0 |  |  |  | 1.04 | 0.505 | 0.496 | 1.019 | 0.182 | 310,226 | 120 by 168 |
| 1612 + 1/2 | 6.8 | 0.51 | 0.43 | 1.20 | 1.02 | 1.02 | 0.076 | 4.93 | 7,3 |  |  |  | 1.06 | 0.559 | 0.534 | 1.048 | 0.181 | 290,218 | 144 by 184 |
| 1613 | 8.0 | 0.52 | 0.43 | 1.21 | 1.13 | 1.13 | 0.044 | 6.07 | 6,5 |  |  |  | 1.04 | 0.562 | 0.580 | 0.968 | 0.180 | 286,186 | 152 by 188 |
| 1613 + 1/2 | 9.1 | 0.52 | 0.43 | 1.21 | 1.18 | 1.18 | 0.027 | 6.95 | 6,5 |  |  |  | 0.99 | 0.602 | 0.593 | 1.014 | 0.178 | 254,186 | 156 by 200 |
| 1614 | 10.0 | 0.52 | 0.43 | 1.21 | 1.12 | 1.12 | 0.047 | 5.89 | 7,3 |  |  |  | 1.01 | 0.624 | 0.625 | 1.000 | 0.176 | 242,154 | 160 by 208 |
| 1614 + 1/2 | 10.4 | 0.52 | 0.43 | 1.20 | 1.18 | 1.18 | 0.026 | 6.59 | 7,2 |  |  |  | 1.03 | 0.647 | 0.660 | 0.982 | 0.173 | 210,142 | 160 by 208 |
| 1615 | 10.7 | 0.52 | 0.43 | 1.21 | 1.20 | 1.202 | 0.019 | 7.39 | 0,1 |  |  |  | 1.07 | 0.695 | 0.663 | 1.047 | 0.169 | 150,182 | 152 by 212 |
| 1615 + 1/2 | 11.0 | 0.50 | 0.43 | 1.17 | 1.16 | 1.16 | 0.023 | 12.34 | 0,1 |  |  |  | 0.94 | 0.727 | 0.663 | 1.096 | 0.165 | 114,162 | 136 by 188 |
| 1616 | 10.9 | 0.48 | 0.43 | 1.12 | 1.08 | 1.08 | 0.030 | 7.16 | 0,1 |  |  |  | 0.96 | 0.679 | 0.631 | 1.077 | 0.156 | 86,126 | 80 by 112 |
| 1616 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

## place

### dive (venus.dive, T at 1343, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

### rise (venus.rise, T at 1539, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 2x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 9.06, uhd 19.81.

Largest mean difference: 1.607 at frame 1568 (venus.rise), limit 12.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 0.387 at frame 1283 (venus.dive), limit 3.2.
Largest level difference of one block (a grid of 16 by 9): -1.284 at frame 1328 (venus.dive), limit 12.
Largest level difference of the whole frame: -0.164 at frame 1568 (venus.rise), limit 2.2.
Picture: out/work/smooth/venus-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1185 | venus.hold | 1.261 | 5.8 | 54 | -0.045 | -0.062 | 0.190 | 14.17 | 0.383 | 10,3 | 1.157 |
| 1283 | venus.dive | 1.462 | 7.5 | 50 | -0.128 | -0.145 | 0.387 | 10.92 | -1.025 | 3,2 | 1.106 |
| 1305 | venus.dive | 1.458 | 7.6 | 147 | -0.111 | -0.119 | 0.291 | 12.65 | -0.964 | 10,5 | 1.185 |
| 1328 | venus.dive | 1.279 | 5.8 | 65 | -0.140 | -0.145 | 0.232 | 7.28 | -1.284 | 2,8 | 1.241 |
| 1440 | venus.terrain | 1.222 | 4.9 | 46 | -0.098 | -0.146 | 0.198 | 4.77 | -0.535 | 3,5 | 1.220 |
| 1549 | venus.rise | 1.250 | 4.9 | 81 | -0.077 | -0.087 | 0.194 | 5.70 | -0.612 | 4,8 | 1.265 |
| 1568 | venus.rise | 1.607 | 8.9 | 160 | -0.164 | -0.173 | 0.343 | 10.74 | -1.023 | 6,6 | 1.074 |
| 1586 | venus.rise | 1.433 | 7.7 | 57 | -0.085 | -0.089 | 0.338 | 9.82 | -0.887 | 8,1 | 1.182 |
| 1643 | venus.travel | 1.205 | 6.0 | 91 | -0.001 | -0.002 | 0.148 | 3.53 | -0.210 | 8,4 | 1.528 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.

## counts

Film frames 1110 to 1679 in order on one fresh page, 1140 pictures at rate 2, tier draft at preview, 1385 s. Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): 4 warm draws. Its work counts for that picture and stands in brackets. Judged: dive, rise and travel, every picture.

| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |
|---|---|---|---|---|---|---|---|
| venus.hold | no | 300 | 1 | 1110 | 21 | 138 | 107 |
| venus.dive | yes | 180 | 0 |  | 0 | 0 | 0 |
| venus.terrain | no | 360 | 0 |  | 0 | 0 | 0 |
| venus.rise | yes | 150 | 0 |  | 0 | 0 | 0 |
| venus.travel | yes | 150 | 0 |  | 0 | 0 | 0 |

Every picture with work (of the warm start call in brackets):

| frame | segment | programs | texture uploads | buffers | warm draws |
|---|---|---|---|---|---|
| 1110 | venus.hold | 21 (21) | 138 (138) | 107 (107) | 4 |
