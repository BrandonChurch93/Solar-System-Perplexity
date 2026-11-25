# smooth: venus

Commit 9d59e6999a2ac769f1c2fd941b03a2ea9a0f700a. Capture rate 2. Parts: path, pictures, place, parity, counts.

Joined from the files of 1 machine(s), nothing is rendered, measured or counted here. The path: /home/user/workspace/work/p6/sm53/05/venus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The pictures: the dive /home/user/workspace/work/p6/sm53/01/venus-dive-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm53/02/venus-dive-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz); the rise /home/user/workspace/work/p6/sm53/03/venus-rise-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm53/04/venus-rise-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The place: /home/user/workspace/work/p6/sm53/05/venus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The parity: /home/user/workspace/work/p6/sm53/05/venus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The counts: /home/user/workspace/work/p6/sm53/06/venus (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

VERDICT: red. 3 numbers over the limit or not measured.

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
| whole frames | rate | 0.07499 log of the height a film frame | 1.709 | 1567 | 0.078 | 1535 |  |  | 0.017 | 0.013 | 0.000 | 0.000 | 0.040 at 1616 |
| whole frames | turn | 1.203 degrees a film frame | 1.936 | 1559 | 0.073 | 1534 |  |  | 0.013 | 0.000 | 0.000 | 0.000 | 0.000 at 1524 |
| whole frames | speed | 5.707 px a film frame at the place | 1.955 | 1573 | 0.079 over 8 | 1565 |  |  | 0.004 | 0.005 | 0.008 over 8 | 0.000 | 2.668 at 1614 |
| rate 2 | rate | 0.07452 log of the height a film frame | 1.722 | 1566 + 1/2 | 0.079 | 1535 + 1/2 | 0.039 | 1535 | 0.021 | 0.010 | 0.000 | 0.000 | 0.046 at 1616 + 1/2 |
| rate 2 | turn | 1.195 degrees a film frame | 1.950 | 1558 + 1/2 | 0.074 | 1534 | 0.037 | 1533 + 1/2 | 0.017 | 0.001 | 0.000 | 0.000 | 0.000 at 1524 |
| rate 2 | speed | 5.624 px a film frame at the place | 1.956 | 1572 + 1/2 | 0.079 over 8 | 1565 + 1/2 | 0.040 over 8 | 1565 + 1/2 | 0.005 | 0.005 | 0.012 over 8 | 0.003 over 8 | 2.708 at 1614 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 1530, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.003 of its height a film frame, the mean of its last 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 0.99 at frame 1530 + 1/2, limit 0.87; inside the rise itself 0.99 at frame 1530 + 1/2. Largest step from one capture frame to the next 1.16 at frame 1537, shown. The part along the surface view's own direction of motion: 0.98 at the lowest, lowest -7.21 at frame 1545 + 1/2, shown; under 0 the eye goes back.

Rest between the rise and the travel (the seam into venus.travel at film frame 1605, 12 film frames to each side, read at rate 2): a rise and the travel after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body's edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest 2.58 at frame 1606 + 1/2, against 13.39 at frame 1593 and 91.53 at frame 1616 + 1/2 at the ends of the window. The lowest is 0.193 of the slower end, limit 0.07. Near 0 the picture comes to rest between the rise and the travel.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1518 | terrain terrain | 1.710e-2 | -0.006 |  |  | 0.034 |  |  | 0.133 |  |  | 0 |
| 1519 | terrain terrain | 1.709e-2 | -0.006 | 0.000 | 0.000 | 0.034 | 0.000 | 0.000 | 0.131 | 0.002 | 0.002 | 8 |
| 1520 | terrain terrain | 1.708e-2 | -0.006 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.129 | 0.002 | 0.002 | 8 |
| 1521 | terrain terrain | 1.707e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.127 | 0.002 | 0.002 | 8 |
| 1522 | terrain terrain | 1.707e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.125 | 0.002 | 0.002 | 8 |
| 1523 | terrain terrain | 1.706e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.123 | 0.001 | 0.001 | 8 |
| 1524 | terrain terrain | 1.706e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.122 | 0.001 | 0.001 | 8 |
| 1525 | terrain terrain | 1.705e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.121 | 0.001 | 0.001 | 8 |
| 1526 | terrain terrain | 1.704e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.121 | 0.001 | 0.001 | 8 |
| 1527 | terrain terrain | 1.704e-2 | -0.005 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 0.120 | 0.000 | 0.000 | 8 |
| 1528 | terrain terrain | 1.703e-2 | -0.005 | 0.000 | 0.000 | 0.032 | 0.000 | 0.000 | 0.120 | 0.000 | 0.000 | 8 |
| 1529 | terrain terrain | 1.702e-2 | -0.005 | 0.000 | 0.000 | 0.032 | 0.000 | 0.000 | 0.120 | 0.000 | 0.000 | 8 |
| 1530 first | rise terrain | 1.702e-2 | -0.005 | 0.000 | 0.004 | 0.032 | 0.000 | 0.003 | 0.121 | 0.001 | 0.001 | 8 |
| 1531 | rise terrain | 1.703e-2 | 0.012 | 0.017 | 0.046 | 0.046 | 0.013 | 0.041 | 0.117 | 0.004 | 0.010 | 8 |
| 1532 | rise terrain | 1.713e-2 | 0.073 | 0.061 | 0.075 | 0.103 | 0.057 | 0.072 | 0.108 | 0.008 | 0.007 | 8 |
| 1533 | rise terrain | 1.732e-2 | 0.149 | 0.076 | 0.078 | 0.176 | 0.073 | 0.074 | 0.116 | 0.008 | 0.018 | 8 |
| 1534 | rise terrain | 1.761e-2 | 0.227 | 0.078 | 0.079 | 0.249 | 0.073 | 0.074 | 0.139 | 0.023 | 0.030 | 8 |
| 1535 | rise terrain | 1.802e-2 | 0.305 | 0.078 | 0.079 | 0.322 | 0.073 | 0.074 | 0.170 | 0.031 | 0.033 | 8 |
| 1536 | rise terrain | 1.855e-2 | 0.383 | 0.078 | 0.079 | 0.395 | 0.073 | 0.074 | 0.202 | 0.032 | 0.033 | 8 |
| 1537 | rise terrain | 1.920e-2 | 0.461 | 0.078 | 0.078 | 0.468 | 0.073 | 0.073 | 0.233 | 0.031 | 0.032 | 8 |
| 1538 | rise terrain | 1.999e-2 | 0.538 | 0.077 | 0.077 | 0.541 | 0.073 | 0.073 | 0.263 | 0.030 | 0.030 | 8 |
| 1539 T | rise terrain | 2.093e-2 | 0.613 | 0.075 | 0.076 | 0.613 | 0.073 | 0.073 | 0.291 | 0.028 | 0.028 | 8 |
| 1540 | rise orbit | 2.203e-2 | 0.687 | 0.074 | 0.074 | 0.686 | 0.073 | 0.073 | 0.318 | 0.026 | 0.026 | 8 |
| 1541 | rise orbit | 2.332e-2 | 0.759 | 0.072 | 0.073 | 0.758 | 0.072 | 0.073 | 0.343 | 0.025 | 0.025 | 8 |
| 1542 | rise orbit | 2.482e-2 | 0.830 | 0.071 | 0.071 | 0.831 | 0.072 | 0.073 | 0.367 | 0.024 | 0.024 | 8 |
| 1543 | rise orbit | 2.655e-2 | 0.899 | 0.070 | 0.070 | 0.903 | 0.072 | 0.073 | 0.392 | 0.025 | 0.025 | 8 |
| 1544 | rise orbit | 2.855e-2 | 0.967 | 0.068 | 0.068 | 0.975 | 0.072 | 0.073 | 0.418 | 0.026 | 0.027 | 8 |
| 1545 | rise orbit | 3.085e-2 | 1.031 | 0.064 | 0.063 | 1.047 | 0.072 | 0.072 | 0.446 | 0.028 | 0.029 | 8 |
| 1546 | rise orbit | 3.347e-2 | 1.090 | 0.059 | 0.059 | 1.119 | 0.072 | 0.072 | 0.476 | 0.031 | 0.032 | 8 |
| 1547 | rise orbit | 3.648e-2 | 1.146 | 0.055 | 0.055 | 1.191 | 0.072 | 0.072 | 0.509 | 0.033 | 0.035 | 8 |
| 1548 | rise orbit | 3.990e-2 | 1.197 | 0.052 | 0.052 | 1.262 | 0.072 | 0.072 | 0.545 | 0.036 | 0.039 | 8 |
| 1549 | rise orbit | 4.381e-2 | 1.246 | 0.049 | 0.048 | 1.334 | 0.071 | 0.072 | 0.589 | 0.044 | 0.050 | 8 |
| 1550 | rise orbit | 4.827e-2 | 1.291 | 0.046 | 0.045 | 1.405 | 0.071 | 0.072 | 0.641 | 0.052 | 0.054 | 8 |
| 1551 | rise orbit | 5.334e-2 | 1.334 | 0.043 | 0.043 | 1.476 | 0.071 | 0.071 | 0.696 | 0.055 | 0.057 | 8 |
| 1552 | rise orbit | 5.914e-2 | 1.374 | 0.040 | 0.040 | 1.547 | 0.071 | 0.071 | 0.755 | 0.059 | 0.061 | 8 |
| 1553 | rise orbit | 6.574e-2 | 1.412 | 0.038 | 0.038 | 1.617 | 0.070 | 0.071 | 0.817 | 0.062 | 0.065 | 8 |
| 1554 | rise orbit | 7.328e-2 | 1.448 | 0.036 | 0.036 | 1.687 | 0.070 | 0.070 | 0.883 | 0.066 | 0.068 | 8 |
| 1555 | rise orbit | 8.189e-2 | 1.482 | 0.034 | 0.034 | 1.757 | 0.070 | 0.070 | 0.953 | 0.070 | 0.072 | 8 |
| 1556 | rise orbit | 9.173e-2 | 1.513 | 0.032 | 0.032 | 1.826 | 0.069 | 0.070 | 1.026 | 0.073 | 0.075 | 8 |
| 1557 | rise orbit | 1.030e-1 | 1.543 | 0.030 | 0.030 | 1.894 | 0.068 | 0.068 | 1.102 | 0.076 | 0.077 | 8 |
| 1558 | rise orbit | 1.158e-1 | 1.564 | 0.021 | 0.020 | 1.934 | 0.040 | 0.035 | 1.177 | 0.076 | 0.075 | 8 |
| 1559 | rise orbit | 1.303e-1 | 1.576 | 0.012 | 0.012 | 1.936 | 0.002 | 0.004 | 1.250 | 0.072 | 0.072 | 8 |
| 1560 | rise orbit | 1.468e-1 | 1.589 | 0.013 | 0.015 | 1.932 | 0.004 | 0.004 | 1.323 | 0.073 | 0.073 | 8 |
| 1561 | rise orbit | 1.656e-1 | 1.605 | 0.015 | 0.017 | 1.928 | 0.004 | 0.004 | 1.397 | 0.074 | 0.074 | 8 |
| 1562 | rise orbit | 1.870e-1 | 1.622 | 0.017 | 0.018 | 1.925 | 0.004 | 0.004 | 1.473 | 0.076 | 0.076 | 8 |
| 1563 | rise orbit | 2.115e-1 | 1.640 | 0.019 | 0.020 | 1.921 | 0.004 | 0.004 | 1.550 | 0.077 | 0.077 | 8 |
| 1564 | rise orbit | 2.395e-1 | 1.661 | 0.020 | 0.021 | 1.917 | 0.004 | 0.004 | 1.628 | 0.078 | 0.078 | 8 |
| 1565 | rise orbit | 2.717e-1 | 1.682 | 0.021 | 0.022 | 1.913 | 0.004 | 0.004 | 1.707 | 0.079 | 0.079 | 8 |
| 1566 | rise orbit | 3.088e-1 | 1.703 | 0.021 | 0.022 | 1.909 | 0.004 | 0.007 | 1.786 | 0.079 | 0.078 | 8 |
| 1567 | rise orbit | 3.510e-1 | 1.709 | 0.006 | 0.011 | 1.898 | 0.011 | 0.019 | 1.848 | 0.063 | 0.059 | 8 |
| 1568 | rise orbit | 3.984e-1 | 1.690 | 0.019 | 0.027 | 1.875 | 0.023 | 0.031 | 1.884 | 0.035 | 0.032 | 8 |
| 1569 | rise orbit | 4.514e-1 | 1.664 | 0.027 | 0.027 | 1.840 | 0.035 | 0.043 | 1.907 | 0.023 | 0.023 | 8 |
| 1570 | rise orbit | 5.103e-1 | 1.638 | 0.026 | 0.026 | 1.793 | 0.047 | 0.054 | 1.927 | 0.020 | 0.020 | 8 |
| 1571 | rise orbit | 5.760e-1 | 1.613 | 0.025 | 0.025 | 1.735 | 0.058 | 0.066 | 1.943 | 0.016 | 0.016 | 8 |
| 1572 | rise orbit | 6.489e-1 | 1.589 | 0.024 | 0.026 | 1.666 | 0.069 | 0.074 | 1.953 | 0.010 | 0.010 | 8 |
| 1573 | rise orbit | 7.294e-1 | 1.561 | 0.028 | 0.031 | 1.592 | 0.073 | 0.074 | 1.955 | 0.002 | 0.003 | 8 |
| 1574 | rise orbit | 8.180e-1 | 1.528 | 0.033 | 0.037 | 1.520 | 0.073 | 0.073 | 1.947 | 0.007 | 0.011 | 8 |
| 1575 | rise orbit | 9.146e-1 | 1.490 | 0.038 | 0.042 | 1.447 | 0.073 | 0.073 | 1.931 | 0.016 | 0.019 | 8 |
| 1576 | rise orbit | 1.019e+0 | 1.446 | 0.044 | 0.048 | 1.375 | 0.072 | 0.073 | 1.907 | 0.024 | 0.027 | 8 |
| 1577 | rise orbit | 1.132e+0 | 1.396 | 0.049 | 0.053 | 1.303 | 0.072 | 0.073 | 1.874 | 0.032 | 0.035 | 8 |
| 1578 | rise orbit | 1.252e+0 | 1.341 | 0.055 | 0.059 | 1.231 | 0.072 | 0.072 | 1.834 | 0.041 | 0.044 | 8 |
| 1579 | rise orbit | 1.378e+0 | 1.282 | 0.059 | 0.059 | 1.159 | 0.072 | 0.072 | 1.786 | 0.047 | 0.047 | 8 |
| 1580 | rise orbit | 1.510e+0 | 1.225 | 0.058 | 0.058 | 1.088 | 0.071 | 0.072 | 1.737 | 0.050 | 0.050 | 8 |
| 1581 | rise orbit | 1.649e+0 | 1.169 | 0.056 | 0.056 | 1.016 | 0.071 | 0.072 | 1.685 | 0.052 | 0.053 | 8 |
| 1582 | rise orbit | 1.792e+0 | 1.114 | 0.055 | 0.055 | 0.945 | 0.071 | 0.072 | 1.630 | 0.055 | 0.057 | 8 |
| 1583 | rise orbit | 1.941e+0 | 1.061 | 0.053 | 0.054 | 0.874 | 0.071 | 0.072 | 1.572 | 0.058 | 0.060 | 8 |
| 1584 | rise orbit | 2.093e+0 | 1.008 | 0.052 | 0.052 | 0.803 | 0.071 | 0.071 | 1.510 | 0.062 | 0.064 | 8 |
| 1585 | rise orbit | 2.249e+0 | 0.957 | 0.051 | 0.051 | 0.732 | 0.071 | 0.071 | 1.444 | 0.065 | 0.068 | 8 |
| 1586 | rise orbit | 2.408e+0 | 0.907 | 0.050 | 0.050 | 0.662 | 0.070 | 0.071 | 1.375 | 0.069 | 0.071 | 8 |
| 1587 | rise orbit | 2.567e+0 | 0.858 | 0.049 | 0.050 | 0.595 | 0.067 | 0.067 | 1.304 | 0.071 | 0.073 | 8 |
| 1588 | rise orbit | 2.727e+0 | 0.806 | 0.051 | 0.055 | 0.531 | 0.064 | 0.064 | 1.231 | 0.073 | 0.076 | 8 |
| 1589 | rise orbit | 2.885e+0 | 0.750 | 0.057 | 0.059 | 0.471 | 0.060 | 0.060 | 1.155 | 0.076 | 0.078 | 8 |
| 1590 | rise orbit | 3.038e+0 | 0.690 | 0.059 | 0.060 | 0.415 | 0.056 | 0.056 | 1.077 | 0.078 | 0.078 | 8 |
| 1591 | rise orbit | 3.186e+0 | 0.631 | 0.059 | 0.059 | 0.362 | 0.053 | 0.053 | 1.000 | 0.078 | 0.078 | 8 |
| 1592 | rise orbit | 3.326e+0 | 0.574 | 0.057 | 0.057 | 0.313 | 0.049 | 0.049 | 0.922 | 0.078 | 0.078 | 8 |
| 1593 | rise orbit | 3.459e+0 | 0.522 | 0.053 | 0.052 | 0.267 | 0.046 | 0.045 | 0.845 | 0.077 | 0.078 | 8 |
| 1594 | rise orbit | 3.584e+0 | 0.474 | 0.048 | 0.047 | 0.225 | 0.042 | 0.042 | 0.768 | 0.077 | 0.078 | 8 |
| 1595 | rise orbit | 3.702e+0 | 0.432 | 0.043 | 0.042 | 0.186 | 0.038 | 0.038 | 0.691 | 0.077 | 0.078 | 8 |
| 1596 | rise orbit | 3.812e+0 | 0.393 | 0.039 | 0.039 | 0.152 | 0.035 | 0.035 | 0.614 | 0.077 | 0.078 | 8 |
| 1597 | rise orbit | 3.916e+0 | 0.356 | 0.037 | 0.037 | 0.120 | 0.031 | 0.031 | 0.538 | 0.076 | 0.077 | 8 |
| 1598 | rise orbit | 4.010e+0 | 0.318 | 0.038 | 0.040 | 0.093 | 0.028 | 0.027 | 0.464 | 0.074 | 0.075 | 8 |
| 1599 | rise orbit | 4.094e+0 | 0.276 | 0.042 | 0.046 | 0.069 | 0.024 | 0.024 | 0.390 | 0.074 | 0.075 | 8 |
| 1600 | rise orbit | 4.166e+0 | 0.233 | 0.043 | 0.043 | 0.048 | 0.021 | 0.020 | 0.318 | 0.072 | 0.072 | 8 |
| 1601 | rise orbit | 4.229e+0 | 0.200 | 0.033 | 0.032 | 0.031 | 0.017 | 0.017 | 0.256 | 0.062 | 0.061 | 8 |
| 1602 | rise orbit | 4.285e+0 | 0.174 | 0.026 | 0.025 | 0.018 | 0.013 | 0.013 | 0.211 | 0.045 | 0.043 | 8 |
| 1603 | rise orbit | 4.333e+0 | 0.149 | 0.025 | 0.027 | 0.008 | 0.010 | 0.009 | 0.187 | 0.024 | 0.022 | 8 |
| 1604 last | rise orbit | 4.373e+0 | 0.123 | 0.026 | 0.026 | 0.002 | 0.006 | 0.006 | 0.177 | 0.010 | 0.007 | 8 |
| 1605 | travel orbit | 4.409e+0 | 0.110 | 0.013 | 0.010 | 0.001 | 0.000 | 0.001 | 0.182 | 0.005 | 0.005 | 8 |
| 1606 | travel orbit | 4.445e+0 | 0.108 | 0.003 | 0.003 | 0.001 | 0.000 | 0.000 | 0.181 | 0.001 | 0.003 | 8 |
| 1607 | travel orbit | 4.480e+0 | 0.104 | 0.003 | 0.005 | 0.001 | 0.000 | 0.000 | 0.181 | 0.001 | 0.039 | 8 |
| 1608 | travel orbit | 4.513e+0 | 0.099 | 0.005 | 0.006 | 0.002 | 0.000 | 0.000 | 0.311 | 0.130 * | 0.385 * | 8 |
| 1609 | travel orbit | 4.545e+0 | 0.093 | 0.006 | 0.006 | 0.002 | 0.000 | 0.000 | 0.903 | 0.592 * | 0.978 * | 8 |
| 1610 | travel orbit | 4.575e+0 | 0.089 | 0.005 | 0.004 | 0.002 | 0.000 | 0.000 | 2.110 | 1.207 * | 1.632 * | 8 |
| 1611 | travel orbit | 4.605e+0 | 0.088 | 0.001 | 0.002 | 0.002 | 0.000 | 0.000 | 3.943 | 1.833 * | 2.206 * | 8 |
| 1612 | travel orbit | 4.637e+0 | 0.092 | 0.004 | 0.009 | 0.002 | 0.000 | 0.000 | 6.275 | 2.331 * | 2.574 * | 8 |
| 1613 | travel orbit | 4.673e+0 | 0.104 | 0.012 | 0.017 | 0.002 | 0.000 | 0.000 | 8.878 | 2.603 * | 2.703 * | 8 |
| 1614 | travel orbit | 4.717e+0 | 0.124 | 0.020 | 0.027 | 0.002 | 0.000 | 0.000 | 11.545 | 2.668 * | 2.708 * | 8 |
| 1615 | travel orbit | 4.772e+0 | 0.154 | 0.030 | 0.037 | 0.002 | 0.000 | 0.000 | 14.188 | 2.642 * | 2.676 * | 8 |
| 1616 | travel orbit | 4.842e+0 | 0.195 | 0.040 | 0.046 | 0.002 | 0.000 | 0.000 | 16.734 | 2.546 * | 2.568 * | 8 |

## pictures

Tier draft, rate 2, 4.15 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

The dive is joined from 2 parts: /home/user/workspace/work/p6/sm53/01/venus-dive-p1of2 (capture frames 2496 to 2609, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm53/02/venus-dive-p2of2 (capture frames 2610 to 2723, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

The rise is joined from 2 parts: /home/user/workspace/work/p6/sm53/03/venus-rise-p1of2 (capture frames 3036 to 3134, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm53/04/venus-rise-p2of2 (capture frames 3135 to 3233, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

### dive (venus.dive, frames 1260 to 1349, window 1248 to 1361, 228 draft frames at rate 2)

Largest level step: 0.33 at frame 1316 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.12 from frame 1316 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 5.52 from frame 1316 to the next, block column 0 row 0 from the top left, shown, not judged.
Largest change in place: 61.1 from frame 1320 to 8 film frames later, most at pixel 908, 248 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.62 from frame 1275 + 1/2 to 8 film frames later, most at pixel 1363, 857, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 1350 to 1361 + 1/2): change 2.0, pattern 0.02.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 1270 in /home/user/workspace/work/p6/sm53/01/venus-dive-p1of2-pops.png, frame 1316 in /home/user/workspace/work/p6/sm53/02/venus-dive-p2of2-pops.png, frame 1318 + 1/2 in /home/user/workspace/work/p6/sm53/02/venus-dive-p2of2-pops.png, frame 1320 in /home/user/workspace/work/p6/sm53/02/venus-dive-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 1275 + 1/2 in /home/user/workspace/work/p6/sm53/01/venus-dive-p1of2-changes.png, frame 1303 in no panel (a slice --frames 2606-2606 draws it), frame 1311 in /home/user/workspace/work/p6/sm53/02/venus-dive-p2of2-changes.png, frame 1320 in /home/user/workspace/work/p6/sm53/02/venus-dive-p2of2-changes.png.

- RED the pattern of the picture changes in place by 0.62 from frame 1275 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (25 frames over it, first 1274)

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
| 1271 | 56.46 | 0.01 | 8.0 | 1.64 | 1.65 | 0.99 | 1.02 | 0.99 | 0.013 | 1.52 | 5,3 | 13.1 | 25.5 | 0.31 | 0.28 | 0.27 | 8.0 |
| 1271 + 1/2 | 56.79 | 0.00 | 8.5 | 1.65 | 1.65 | 1.00 | 1.04 | 1.00 | 0.007 | 1.60 | 6,8 | 13.1 | 25.9 | 0.31 | 0.32 | 0.28 | 8.0 |
| 1272 | 57.12 | 0.00 | 8.9 | 1.68 | 1.65 | 1.02 | 1.05 | 1.02 | 0.010 | 1.55 | 6,8 | 13.0 | 26.7 | 0.32 | 0.34 | 0.30 | 8.0 |
| 1272 + 1/2 | 57.44 | 0.01 | 9.5 | 1.73 | 1.65 | 1.05 | 1.09 | 1.05 | 0.005 | 1.74 | 6,8 | 12.6 | 27.3 | 0.32 | 0.38 | 0.31 | 8.0 |
| 1273 | 57.77 | 0.01 | 9.9 | 1.73 | 1.65 | 1.04 | 1.07 | 1.04 | 0.015 | 1.77 | 13,6 | 12.0 | 27.6 | 0.32 | 0.40 | 0.33 | 8.0 |
| 1273 + 1/2 | 58.13 | 0.01 | 10.4 | 1.72 | 1.65 | 1.04 | 1.06 | 1.04 | 0.011 | 2.15 | 6,8 | 11.6 | 27.0 | 0.32 | 0.43 | 0.34 | 8.0 |
| 1274 | 58.51 | 0.00 | 10.8 | 1.70 | 1.66 | 1.03 | 1.03 | 1.03 | 0.023 | 2.31 | 6,8 | 10.6 | 25.8 | 0.32 | 0.47 | 0.36 | 8.0 |
| 1274 + 1/2 | 58.90 | 0.00 | 11.4 | 1.70 | 1.66 | 1.02 | 1.00 | 1.00 | 0.040 | 2.01 | 6,8 | 10.4 | 22.9 | 0.33 | 0.50 | 0.37 | 8.0 |
| 1275 | 59.29 | 0.01 | 11.8 | 1.67 | 1.68 | 0.99 | 1.00 | 0.99 | 0.025 | 1.95 | 13,6 | 10.4 | 21.7 | 0.33 | 0.49 | 0.39 | 8.0 |
| 1275 + 1/2 | 59.66 | 0.01 | 12.2 | 1.65 | 1.69 | 0.98 | 0.98 | 0.98 | 0.034 | 2.12 | 13,6 | 10.3 | 19.6 | 0.33 | 0.62 | 0.40 | 8.0 |
| 1276 | 60.00 | 0.01 | 12.7 | 1.62 | 1.70 | 0.96 | 0.94 | 0.94 | 0.044 | 1.91 | 12,6 | 10.7 | 17.8 | 0.34 | 0.57 | 0.42 | 8.0 |
| 1276 + 1/2 | 60.32 | 0.00 | 13.2 | 1.63 | 1.71 | 0.96 | 0.93 | 0.93 | 0.052 | 2.00 | 2,4 | 11.4 | 15.7 | 0.34 | 0.56 | 0.43 | 8.0 |
| 1277 | 60.63 | 0.02 | 13.5 | 1.66 | 1.71 | 0.97 | 0.93 | 0.93 | 0.056 | 1.99 | 15,7 | 12.0 | 17.3 | 0.34 | 0.56 | 0.44 | 8.0 |
| 1277 + 1/2 | 60.91 | 0.00 | 13.9 | 1.64 | 1.72 | 0.95 | 0.91 | 0.91 | 0.071 | 1.95 | 15,7 | 12.8 | 13.6 | 0.35 | 0.48 | 0.46 | 8.0 |
| 1278 | 61.20 | 0.00 | 14.2 | 1.65 | 1.72 | 0.96 | 0.93 | 0.93 | 0.068 | 2.03 | 14,7 | 13.5 | 15.7 | 0.35 | 0.38 | 0.47 | 8.0 |
| 1278 + 1/2 | 61.49 | 0.01 | 14.5 | 1.65 | 1.72 | 0.96 | 0.93 | 0.93 | 0.070 | 1.95 | 13,7 | 14.7 | 17.5 | 0.35 | 0.29 | 0.49 | 8.0 |
| 1279 | 61.82 | 0.01 | 14.6 | 1.65 | 1.72 | 0.96 | 0.93 | 0.93 | 0.088 | 1.75 | 11,8 | 15.7 | 18.3 | 0.36 | 0.22 | 0.50 | 8.0 |
| 1279 + 1/2 | 62.12 | 0.02 | 15.4 | 1.68 | 1.73 | 0.97 | 0.93 | 0.93 | 0.123 | 1.70 | 11,8 | 17.1 | 20.5 | 0.36 | 0.20 | 0.52 | 8.0 |
| 1280 | 62.38 | 0.05 | 15.3 | 1.71 | 1.76 | 0.97 | 0.94 | 0.94 | 0.103 | 1.72 | 11,8 | 18.2 | 22.0 | 0.36 | 0.19 | 0.54 | 8.0 |
| 1280 + 1/2 | 62.54 | 0.04 | 15.8 | 1.78 | 1.81 | 0.98 | 0.98 | 0.98 | 0.061 | 1.97 | 11,8 | 19.8 | 23.1 | 0.36 | 0.18 | 0.55 | 8.0 |
| 1281 | 62.62 | 0.02 | 15.3 | 1.89 | 1.88 | 1.01 | 1.00 | 1.00 | 0.080 | 1.96 | 15,7 | 21.0 | 24.1 | 0.36 | 0.19 | 0.57 | 8.0 |
| 1281 + 1/2 | 62.66 | 0.00 | 16.0 | 1.98 | 1.97 | 1.01 | 1.03 | 1.01 | 0.108 | 1.94 | 15,7 | 22.0 | 24.3 | 0.35 | 0.19 | 0.58 | 8.0 |
| 1282 | 62.69 | 0.01 | 16.1 | 2.05 | 2.01 | 1.02 | 1.02 | 1.02 | 0.149 | 1.90 | 11,8 | 23.6 | 26.9 | 0.35 | 0.19 | 0.59 | 8.0 |
| 1282 + 1/2 | 62.74 | 0.03 | 17.4 | 2.04 | 2.07 | 0.99 | 0.99 | 0.99 | 0.125 | 2.11 | 3,1 | 24.8 | 29.7 | 0.35 | 0.20 | 0.35 | 8.0 |
| 1283 | 62.85 | 0.08 | 16.3 | 2.10 | 2.08 | 1.01 | 1.03 | 1.01 | 0.143 | 1.80 | 8,5 | 26.2 | 29.0 | 0.35 | 0.19 | 0.61 | 8.0 |
| 1283 + 1/2 | 63.14 | 0.03 | 18.1 | 2.11 | 2.12 | 1.00 | 0.98 | 0.98 | 0.138 | 1.90 | 3,7 | 27.1 | 29.9 | 0.34 | 0.19 | 0.62 | 8.0 |
| 1284 | 63.49 | 0.03 | 17.0 | 2.14 | 2.13 | 1.00 | 0.96 | 0.96 | 0.147 | 1.94 | 3,6 | 27.0 | 29.7 | 0.34 | 0.19 | 0.34 | 8.0 |
| 1284 + 1/2 | 63.90 | 0.04 | 18.1 | 2.16 | 2.19 | 0.99 | 1.00 | 0.99 | 0.140 | 3.12 | 0,6 | 27.6 | 31.2 | 0.34 | 0.19 | 0.33 | 8.0 |
| 1285 | 64.39 | 0.01 | 18.5 | 2.23 | 2.22 | 1.00 | 0.99 | 0.99 | 0.155 | 2.24 | 2,7 | 28.1 | 30.2 | 0.33 | 0.18 | 0.33 | 8.0 |
| 1285 + 1/2 | 64.91 | 0.01 | 17.7 | 2.29 | 2.27 | 1.01 | 1.00 | 1.00 | 0.135 | 2.32 | 5,7 | 29.3 | 31.9 | 0.33 | 0.15 | 0.65 | 8.0 |
| 1286 | 65.44 | 0.03 | 19.2 | 2.31 | 2.32 | 0.99 | 0.99 | 0.99 | 0.155 | 2.61 | 5,8 | 30.9 | 33.0 | 0.33 | 0.14 | 0.66 | 8.0 |
| 1286 + 1/2 | 66.05 | 0.00 | 19.3 | 2.36 | 2.37 | 1.00 | 1.03 | 1.00 | 0.106 | 3.08 | 5,8 | 31.6 | 37.7 | 0.32 | 0.15 | 0.32 | 8.0 |
| 1287 | 66.65 | 0.09 | 19.7 | 2.42 | 2.42 | 1.00 | 0.99 | 0.99 | 0.115 | 3.15 | 5,8 | 32.6 | 36.9 | 0.32 | 0.18 | 0.32 | 8.0 |
| 1287 + 1/2 | 67.06 | 0.33 | 20.4 | 2.48 | 2.48 | 1.00 | 0.98 | 0.98 | 0.164 | 3.19 | 4,8 | 33.6 | 39.8 | 0.32 | 0.17 | 0.31 | 8.0 |
| 1288 | 66.80 | 0.13 | 19.4 | 2.54 | 2.54 | 1.00 | 1.02 | 1.00 | 0.159 | 3.56 | 4,8 | 34.3 | 43.8 | 0.32 | 0.15 | 0.31 | 8.0 |
| 1288 + 1/2 | 66.29 | 0.05 | 20.7 | 2.60 | 2.58 | 1.01 | 1.00 | 1.00 | 0.143 | 4.39 | 4,8 | 35.2 | 49.0 | 0.31 | 0.13 | 0.31 | 8.0 |
| 1289 | 65.67 | 0.02 | 19.5 | 2.62 | 2.63 | 1.00 | 1.01 | 1.00 | 0.098 | 3.97 | 3,8 | 35.6 | 51.6 | 0.31 | 0.12 | 0.31 | 8.0 |
| 1289 + 1/2 | 65.02 | 0.01 | 20.5 | 2.68 | 2.63 | 1.02 | 1.02 | 1.02 | 0.101 | 4.73 | 3,8 | 35.5 | 51.7 | 0.31 | 0.13 | 0.31 | 8.0 |
| 1290 | 64.38 | 0.07 | 20.7 | 2.65 | 2.66 | 1.00 | 1.00 | 1.00 | 0.078 | 4.07 | 2,8 | 35.4 | 38.6 | 0.31 | 0.13 | 0.31 | 8.0 |
| 1290 + 1/2 | 63.61 | 0.04 | 20.8 | 2.76 | 2.66 | 1.04 | 1.05 | 1.04 | 0.068 | 4.43 | 2,8 | 35.8 | 39.2 | 0.31 | 0.13 | 0.30 | 8.0 |
| 1291 | 62.92 | 0.02 | 21.3 | 2.78 | 2.66 | 1.04 | 1.05 | 1.04 | 0.083 | 4.96 | 2,8 | 36.2 | 38.1 | 0.31 | 0.14 | 0.30 | 8.0 |
| 1291 + 1/2 | 62.27 | 0.08 | 22.4 | 2.81 | 2.67 | 1.05 | 1.05 | 1.05 | 0.116 | 4.53 | 2,8 | 36.6 | 41.3 | 0.31 | 0.11 | 0.30 | 8.0 |
| 1292 | 61.77 | 0.10 | 21.5 | 2.83 | 2.69 | 1.05 | 1.06 | 1.05 | 0.083 | 4.13 | 1,8 | 36.8 | 43.7 | 0.31 | 0.12 | 0.30 | 8.0 |
| 1292 + 1/2 | 61.47 | 0.03 | 21.9 | 2.84 | 2.70 | 1.05 | 1.06 | 1.05 | 0.115 | 4.00 | 1,8 | 36.3 | 42.5 | 0.31 | 0.12 | 0.30 | 8.0 |
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
| 1304 | 68.48 | 0.01 | 24.2 | 2.19 | 2.29 | 0.96 | 0.97 | 0.96 | 0.077 | 2.03 | 0,4 | 53.8 | 66.9 | 0.31 | 0.30 | 0.31 | 8.0 |
| 1304 + 1/2 | 68.67 | 0.03 | 22.9 | 2.12 | 2.29 | 0.93 | 0.93 | 0.93 | 0.123 | 2.06 | 4,2 | 55.2 | 67.8 | 0.31 | 0.32 | 0.31 | 8.0 |
| 1305 | 68.80 | 0.01 | 23.5 | 2.13 | 2.29 | 0.93 | 0.91 | 0.91 | 0.136 | 1.88 | 0,4 | 56.0 | 68.1 | 0.31 | 0.32 | 0.31 | 8.0 |
| 1305 + 1/2 | 68.95 | 0.04 | 23.3 | 2.09 | 2.29 | 0.91 | 0.89 | 0.89 | 0.125 | 1.70 | 6,5 | 56.7 | 68.3 | 0.31 | 0.35 | 0.31 | 8.0 |
| 1306 | 69.01 | 0.10 | 24.2 | 2.06 | 2.29 | 0.90 | 0.87 | 0.87 | 0.130 | 1.83 | 5,5 | 56.9 | 67.6 | 0.31 | 0.42 | 0.31 | 8.0 |
| 1306 + 1/2 | 68.87 | 0.01 | 22.9 | 2.06 | 2.29 | 0.90 | 0.89 | 0.89 | 0.127 | 1.97 | 5,5 | 56.7 | 66.4 | 0.31 | 0.38 | 0.31 | 8.0 |
| 1307 | 68.70 | 0.03 | 24.0 | 2.06 | 2.29 | 0.90 | 0.91 | 0.90 | 0.109 | 2.06 | 5,5 | 56.1 | 65.0 | 0.31 | 0.33 | 0.31 | 8.0 |
| 1307 + 1/2 | 68.47 | 0.08 | 24.1 | 2.09 | 2.29 | 0.91 | 0.93 | 0.91 | 0.125 | 2.21 | 5,5 | 55.2 | 63.2 | 0.31 | 0.35 | 0.31 | 8.0 |
| 1308 | 68.08 | 0.09 | 23.8 | 2.14 | 2.29 | 0.93 | 0.93 | 0.93 | 0.123 | 2.25 | 5,5 | 54.1 | 61.4 | 0.31 | 0.34 | 0.31 | 8.0 |
| 1308 + 1/2 | 67.51 | 0.02 | 23.7 | 2.22 | 2.29 | 0.97 | 0.98 | 0.97 | 0.092 | 2.55 | 4,5 | 52.9 | 59.4 | 0.31 | 0.31 | 0.30 | 8.0 |
| 1309 | 66.98 | 0.07 | 23.6 | 2.25 | 2.29 | 0.98 | 1.01 | 0.98 | 0.121 | 2.85 | 4,5 | 51.6 | 57.5 | 0.30 | 0.33 | 0.30 | 8.0 |
| 1309 + 1/2 | 66.30 | 0.05 | 22.8 | 2.24 | 2.29 | 0.98 | 0.98 | 0.98 | 0.146 | 2.72 | 4,5 | 50.4 | 56.0 | 0.30 | 0.35 | 0.30 | 8.0 |
| 1310 | 65.72 | 0.05 | 22.6 | 2.27 | 2.29 | 0.99 | 0.99 | 0.99 | 0.156 | 2.95 | 4,5 | 49.3 | 54.4 | 0.30 | 0.42 | 0.29 | 8.0 |
| 1310 + 1/2 | 65.04 | 0.10 | 24.2 | 2.27 | 2.29 | 0.99 | 0.98 | 0.98 | 0.145 | 2.93 | 3,5 | 48.9 | 52.7 | 0.30 | 0.47 | 0.29 | 8.0 |
| 1311 | 64.56 | 0.03 | 23.9 | 2.29 | 2.29 | 1.00 | 0.98 | 0.98 | 0.159 | 3.52 | 3,5 | 49.7 | 54.3 | 0.30 | 0.55 | 0.30 | 8.0 |
| 1311 + 1/2 | 64.13 | 0.06 | 23.3 | 2.29 | 2.29 | 1.00 | 1.00 | 1.00 | 0.145 | 3.57 | 3,5 | 50.8 | 57.9 | 0.30 | 0.43 | 0.29 | 10.7 |
| 1312 | 63.82 | 0.06 | 23.3 | 2.28 | 2.31 | 0.99 | 0.96 | 0.96 | 0.176 | 3.26 | 6,8 | 54.1 | 60.2 | 0.30 | 0.449 | 0.30 | 8.0 |
| 1312 + 1/2 | 63.63 | 0.02 | 24.2 | 2.33 | 2.32 | 1.00 | 0.99 | 0.99 | 0.130 | 3.76 | 2,5 | 53.2 | 63.3 | 0.30 | 0.41 | 0.30 | 8.0 |
| 1313 | 63.47 | 0.08 | 25.5 | 2.36 | 2.37 | 0.99 | 1.00 | 0.99 | 0.124 | 3.57 | 2,5 | 55.9 | 67.7 | 0.30 | 0.31 | 0.30 | 8.0 |
| 1313 + 1/2 | 63.48 | 0.03 | 24.9 | 2.42 | 2.42 | 1.00 | 0.99 | 0.99 | 0.110 | 3.46 | 2,5 | 57.5 | 70.5 | 0.30 | 0.27 | 0.30 | 8.0 |
| 1314 | 63.54 | 0.05 | 26.8 | 2.48 | 2.49 | 1.00 | 1.01 | 1.00 | 0.069 | 3.46 | 1,5 | 58.7 | 73.2 | 0.30 | 0.21 | 0.29 | 8.0 |
| 1314 + 1/2 | 63.71 | 0.03 | 25.2 | 2.56 | 2.52 | 1.02 | 1.02 | 1.02 | 0.059 | 3.53 | 1,5 | 53.8 | 72.7 | 0.30 | 0.19 | 0.30 | 8.0 |
| 1315 | 63.94 | 0.09 | 25.2 | 2.66 | 2.53 | 1.05 | 1.02 | 1.02 | 0.072 | 3.67 | 1,5 | 53.9 | 72.1 | 0.30 | 0.16 | 0.30 | 8.5 |
| 1315 + 1/2 | 64.35 | 0.15 | 26.1 | 2.72 | 2.53 | 1.08 | 1.01 | 1.01 | 0.078 | 3.12 | 0,5 | 54.8 | 72.1 | 0.31 | 0.15 | 0.30 | 8.5 |
| 1316 | 65.06 | 0.33 | 26.0 | 3.05 | 2.53 | 1.21 | 1.12 | 1.12 | 0.084 | 5.52 | 0,0 | 55.5 | 70.9 | 0.31 | 0.14 | 0.59 | 8.0 |
| 1316 + 1/2 | 66.43 | 0.21 | 25.4 | 2.83 | 2.53 | 1.12 | 1.04 | 1.04 | 0.082 | 2.75 | 0,5 | 56.1 | 68.6 | 0.31 | 0.16 | 0.31 | 8.4 |
| 1317 | 67.39 | 0.06 | 25.2 | 2.80 | 2.53 | 1.11 | 1.04 | 1.04 | 0.067 | 2.75 | 9,0 | 56.8 | 70.4 | 0.31 | 0.18 | 0.31 | 8.3 |
| 1317 + 1/2 | 68.47 | 0.00 | 24.2 | 2.86 | 2.53 | 1.13 | 1.06 | 1.06 | 0.065 | 3.04 | 11,7 | 56.1 | 69.4 | 0.32 | 0.23 | 0.31 | 9.4 |
| 1318 | 69.53 | 0.05 | 24.3 | 2.86 | 2.53 | 1.13 | 1.05 | 1.05 | 0.084 | 3.14 | 9,0 | 55.9 | 67.0 | 0.32 | 0.30 | 0.31 | 9.5 |
| 1318 + 1/2 | 70.69 | 0.01 | 23.9 | 2.87 | 2.53 | 1.13 | 1.09 | 1.09 | 0.053 | 3.09 | 9,0 | 56.4 | 66.0 | 0.32 | 0.36 | 0.32 | 9.5 |
| 1319 | 71.83 | 0.08 | 23.9 | 2.86 | 2.53 | 1.13 | 1.05 | 1.05 | 0.064 | 3.27 | 4,5 | 58.6 | 67.9 | 0.32 | 0.36 | 0.32 | 9.8 |
| 1319 + 1/2 | 72.83 | 0.02 | 23.0 | 2.83 | 2.53 | 1.12 | 1.08 | 1.08 | 0.053 | 3.46 | 11,8 | 60.1 | 72.6 | 0.33 | 0.37 | 0.32 | 10.0 |
| 1320 | 73.86 | 0.10 | 23.0 | 2.78 | 2.53 | 1.10 | 1.09 | 1.09 | 0.036 | 4.05 | 11,8 | 61.1 | 77.1 | 0.33 | 0.36 | 0.32 | 10.4 |
| 1320 + 1/2 | 74.69 | 0.05 | 22.3 | 2.74 | 2.53 | 1.08 | 1.07 | 1.07 | 0.042 | 3.59 | 11,8 | 56.8 | 69.7 | 0.33 | 0.38 | 0.54 | 8.0 |
| 1321 | 75.42 | 0.09 | 22.3 | 2.69 | 2.53 | 1.06 | 1.04 | 1.04 | 0.048 | 3.23 | 3,5 | 53.9 | 68.3 | 0.33 | 0.40 | 0.33 | 10.8 |
| 1321 + 1/2 | 75.98 | 0.03 | 21.6 | 2.63 | 2.53 | 1.04 | 1.02 | 1.02 | 0.053 | 3.58 | 3,5 | 52.2 | 69.8 | 0.34 | 0.449 | 0.33 | 10.9 |
| 1322 | 76.49 | 0.04 | 21.3 | 2.59 | 2.53 | 1.02 | 1.03 | 1.02 | 0.027 | 3.23 | 3,5 | 49.9 | 71.4 | 0.34 | 0.53 | 0.34 | 11.0 |
| 1322 + 1/2 | 76.92 | 0.06 | 21.0 | 2.56 | 2.53 | 1.01 | 1.02 | 1.01 | 0.030 | 3.32 | 3,5 | 47.4 | 73.0 | 0.34 | 0.50 | 0.34 | 8.0 |
| 1323 | 77.23 | 0.07 | 20.6 | 2.51 | 2.51 | 1.00 | 0.99 | 0.99 | 0.051 | 2.61 | 2,6 | 44.3 | 72.2 | 0.35 | 0.44 | 0.34 | 8.0 |
| 1323 + 1/2 | 77.39 | 0.06 | 20.2 | 2.47 | 2.46 | 1.00 | 0.99 | 0.99 | 0.060 | 2.80 | 2,5 | 40.7 | 63.1 | 0.35 | 0.451 | 0.35 | 8.0 |
| 1324 | 77.44 | 0.05 | 19.7 | 2.40 | 2.43 | 0.99 | 0.99 | 0.99 | 0.050 | 2.98 | 2,7 | 37.8 | 54.3 | 0.36 | 0.48 | 0.35 | 8.0 |
| 1324 + 1/2 | 77.38 | 0.01 | 19.3 | 2.39 | 2.38 | 1.01 | 1.01 | 1.01 | 0.046 | 2.62 | 1,6 | 33.8 | 46.7 | 0.36 | 0.50 | 0.36 | 8.0 |
| 1325 | 77.30 | 0.05 | 19.0 | 2.35 | 2.35 | 1.00 | 1.00 | 1.00 | 0.048 | 2.67 | 1,6 | 29.2 | 39.9 | 0.36 | 0.51 | 0.36 | 8.0 |
| 1325 + 1/2 | 77.10 | 0.03 | 18.6 | 2.31 | 2.30 | 1.00 | 0.99 | 0.99 | 0.048 | 3.94 | 15,8 | 24.7 | 39.3 | 0.37 | 0.49 | 0.37 | 8.0 |
| 1326 | 76.85 | 0.03 | 18.2 | 2.26 | 2.28 | 0.99 | 1.00 | 0.99 | 0.031 | 2.70 | 1,7 | 22.3 | 35.3 | 0.37 | 0.47 | 0.37 | 8.0 |
| 1326 + 1/2 | 76.54 | 0.01 | 17.9 | 2.25 | 2.23 | 1.01 | 1.01 | 1.01 | 0.026 | 2.81 | 1,7 | 21.7 | 27.4 | 0.38 | 0.454 | 0.37 | 8.0 |
| 1327 | 76.21 | 0.03 | 17.5 | 2.21 | 2.20 | 1.01 | 1.01 | 1.01 | 0.025 | 2.89 | 0,7 | 21.3 | 25.1 | 0.38 | 0.42 | 0.38 | 8.0 |
| 1327 + 1/2 | 75.82 | 0.03 | 17.2 | 2.16 | 2.14 | 1.01 | 0.99 | 0.99 | 0.031 | 3.05 | 2,8 | 21.0 | 25.6 | 0.39 | 0.39 | 0.38 | 8.0 |
| 1328 | 75.38 | 0.05 | 16.8 | 2.06 | 2.06 | 1.00 | 1.00 | 1.00 | 0.029 | 2.95 | 2,8 | 20.6 | 25.6 | 0.39 | 0.37 | 0.39 | 8.0 |
| 1328 + 1/2 | 74.84 | 0.03 | 16.4 | 1.96 | 1.96 | 1.00 | 1.00 | 1.00 | 0.020 | 3.11 | 0,5 | 20.3 | 25.6 | 0.40 | 0.37 | 0.39 | 8.0 |
| 1329 | 74.24 | 0.03 | 15.9 | 1.86 | 1.87 | 0.99 | 1.00 | 0.99 | 0.016 | 3.08 | 0,5 | 19.9 | 25.6 | 0.40 | 0.35 | 0.40 | 12.3 |
| 1329 + 1/2 | 73.58 | 0.00 | 15.5 | 1.79 | 1.80 | 0.99 | 1.00 | 0.99 | 0.011 | 3.12 | 0,5 | 19.5 | 25.2 | 0.40 | 0.37 | 0.43 | 8.0 |
| 1330 | 72.91 | 0.02 | 15.1 | 1.74 | 1.75 | 1.00 | 1.00 | 1.00 | 0.013 | 2.85 | 0,5 | 19.0 | 24.7 | 0.41 | 0.41 | 0.42 | 8.0 |
| 1330 + 1/2 | 72.20 | 0.04 | 14.7 | 1.71 | 1.70 | 1.00 | 1.00 | 1.00 | 0.011 | 2.72 | 0,5 | 18.5 | 23.9 | 0.41 | 0.48 | 0.41 | 8.0 |
| 1331 | 71.42 | 0.02 | 14.2 | 1.67 | 1.69 | 0.99 | 0.99 | 0.99 | 0.011 | 2.41 | 8,8 | 17.4 | 23.0 | 0.42 | 0.50 | 0.41 | 8.0 |
| 1331 + 1/2 | 70.67 | 0.04 | 13.7 | 1.66 | 1.65 | 1.01 | 1.01 | 1.01 | 0.012 | 2.72 | 8,8 | 16.5 | 24.3 | 0.42 | 0.49 | 0.40 | 8.0 |
| 1332 | 70.00 | 0.03 | 13.3 | 1.63 | 1.63 | 1.00 | 1.00 | 1.00 | 0.012 | 2.28 | 8,8 | 15.3 | 21.7 | 0.43 | 0.53 | 0.39 | 8.0 |
| 1332 + 1/2 | 69.39 | 0.04 | 12.9 | 1.61 | 1.61 | 1.00 | 1.00 | 1.00 | 0.011 | 2.35 | 7,8 | 14.2 | 17.9 | 0.43 | 0.53 | 0.38 | 8.0 |
| 1333 | 68.87 | 0.01 | 12.5 | 1.59 | 1.58 | 1.01 | 1.00 | 1.00 | 0.019 | 2.40 | 7,8 | 13.2 | 15.2 | 0.44 | 0.50 | 0.37 | 8.0 |
| 1333 + 1/2 | 68.36 | 0.00 | 12.0 | 1.55 | 1.56 | 0.99 | 1.00 | 0.99 | 0.006 | 2.19 | 7,8 | 12.5 | 14.5 | 0.44 | 0.44 | 0.36 | 8.0 |
| 1334 | 67.85 | 0.01 | 11.7 | 1.54 | 1.53 | 1.00 | 0.99 | 0.99 | 0.016 | 2.38 | 7,8 | 11.8 | 13.8 | 0.45 | 0.42 | 0.34 | 8.0 |
| 1334 + 1/2 | 67.38 | 0.01 | 11.2 | 1.51 | 1.51 | 1.00 | 1.01 | 1.00 | 0.007 | 2.32 | 7,8 | 11.0 | 13.0 | 0.45 | 0.36 | 0.33 | 8.0 |
| 1335 | 66.93 | 0.02 | 10.8 | 1.48 | 1.49 | 0.99 | 0.99 | 0.99 | 0.017 | 2.13 | 1,8 | 10.4 | 12.7 | 0.46 | 0.31 | 0.31 | 8.0 |
| 1335 + 1/2 | 66.52 | 0.02 | 10.3 | 1.47 | 1.47 | 1.00 | 1.00 | 1.00 | 0.017 | 2.12 | 1,8 | 9.5 | 13.1 | 0.47 | 0.29 | 0.30 | 8.0 |
| 1336 | 66.14 | 0.01 | 9.9 | 1.45 | 1.46 | 1.00 | 1.00 | 1.00 | 0.012 | 2.28 | 1,8 | 8.6 | 13.0 | 0.47 | 0.24 | 0.27 | 8.0 |
| 1336 + 1/2 | 65.79 | 0.02 | 9.4 | 1.44 | 1.44 | 1.00 | 0.99 | 0.99 | 0.013 | 1.95 | 1,8 | 7.8 | 12.1 | 0.48 | 0.16 | 0.25 | 8.0 |
| 1337 | 65.48 | 0.01 | 8.9 | 1.43 | 1.42 | 1.01 | 1.01 | 1.01 | 0.008 | 2.35 | 0,8 | 7.0 | 11.2 | 0.49 | 0.11 | 0.49 | 9.3 |
| 1337 + 1/2 | 65.19 | 0.01 | 8.5 | 1.40 | 1.42 | 0.99 | 0.99 | 0.99 | 0.009 | 3.42 | 0,8 | 6.4 | 10.7 | 0.50 | 0.09 | 0.49 | 9.2 |
| 1338 | 64.93 | 0.02 | 8.0 | 1.41 | 1.39 | 1.01 | 1.02 | 1.01 | 0.005 | 3.12 | 0,8 | 5.8 | 10.0 | 0.50 | 0.08 | 0.13 | 8.0 |
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
| 1349 + 1/2 | 64.03 | 0.00 | 0.7 | 0.71 | 0.72 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 13,7 | 1.8 | 4.6 | 0.58 | 0.02 | 0.58 | 8.3 |
| 1350 | 64.07 | 0.00 | 0.7 | 0.71 | 0.72 | 0.98 | 0.98 | 0.98 | 0.000 | 1.08 | 0,3 | 1.8 | 4.5 | 0.59 | 0.02 | 0.58 | 8.3 |
| 1350 + 1/2 | 64.10 | 0.00 | 0.7 | 0.71 | 0.72 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 0,1 | 1.8 | 4.3 | 0.59 | 0.02 | 0.58 | 8.3 |
| 1351 | 64.13 | 0.00 | 0.7 | 0.71 | 0.72 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 1,8 | 1.9 | 4.2 | 0.59 | 0.02 | 0.58 | 8.3 |
| 1351 + 1/2 | 64.16 | 0.00 | 0.7 | 0.71 | 0.72 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 13,7 | 2.0 | 4.1 | 0.58 | 0.02 | 0.58 | 8.3 |
| 1352 | 64.20 | 0.00 | 0.7 | 0.71 | 0.72 | 0.98 | 0.98 | 0.98 | 0.000 | 1.10 | 7,8 | 1.9 | 3.8 | 0.58 | 0.02 | 0.58 | 8.3 |
| 1352 + 1/2 | 64.23 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 12,8 | 2.0 | 3.9 | 0.58 | 0.02 | 0.58 | 8.4 |
| 1353 | 64.27 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 6,0 | 2.0 | 3.9 | 0.58 | 0.02 | 0.58 | 8.4 |
| 1353 + 1/2 | 64.30 | 0.00 | 0.7 | 0.73 | 0.72 | 1.01 | 1.01 | 1.01 | 0.000 | 1.12 | 7,8 | 2.0 | 4.1 | 0.58 | 0.02 | 0.58 | 8.4 |
| 1354 | 64.33 | 0.00 | 0.8 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 12,8 |  |  |  |  |  |  |
| 1354 + 1/2 | 64.36 | 0.00 | 0.7 | 0.71 | 0.72 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 1,7 |  |  |  |  |  |  |
| 1355 | 64.39 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 7,8 |  |  |  |  |  |  |
| 1355 + 1/2 | 64.42 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.23 | 12,8 |  |  |  |  |  |  |
| 1356 | 64.46 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 0,1 |  |  |  |  |  |  |
| 1356 + 1/2 | 64.49 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 3,4 |  |  |  |  |  |  |
| 1357 | 64.52 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.24 | 12,8 |  |  |  |  |  |  |
| 1357 + 1/2 | 64.56 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 9,0 |  |  |  |  |  |  |
| 1358 | 64.59 | 0.00 | 0.7 | 0.73 | 0.72 | 1.01 | 1.01 | 1.01 | 0.000 | 1.12 | 6,0 |  |  |  |  |  |  |
| 1358 + 1/2 | 64.62 | 0.00 | 0.7 | 0.73 | 0.72 | 1.01 | 1.01 | 1.01 | 0.000 | 1.15 | 0,0 |  |  |  |  |  |  |
| 1359 | 64.65 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 13,8 |  |  |  |  |  |  |
| 1359 + 1/2 | 64.68 | 0.00 | 0.7 | 0.73 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 13,8 |  |  |  |  |  |  |
| 1360 | 64.71 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 2,8 |  |  |  |  |  |  |
| 1360 + 1/2 | 64.74 | 0.00 | 0.7 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 13,8 |  |  |  |  |  |  |
| 1361 | 64.77 | 0.00 | 0.7 | 0.72 | 0.73 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 13,8 |  |  |  |  |  |  |
| 1361 + 1/2 | 64.80 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

### rise (venus.rise, frames 1530 to 1604, window 1518 to 1616, 198 draft frames at rate 2)

Largest level step: 0.33 at frame 1565 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.21 from frame 1610 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 5.12 from frame 1552 + 1/2 to the next, block column 15 row 8 from the top left, shown, not judged.
Largest change in place: 67.5 from frame 1546 + 1/2 to 8 film frames later, most at pixel 1904, 428 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.85 from frame 1543 + 1/2 to 8 film frames later, most at pixel 732, 318, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 1518 to 1529 + 1/2): change 1.5, pattern 0.01.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 1539 + 1/2 in /home/user/workspace/work/p6/sm53/03/venus-rise-p1of2-pops.png, frame 1610 + 1/2 in /home/user/workspace/work/p6/sm53/04/venus-rise-p2of2-pops.png, frame 1612 in /home/user/workspace/work/p6/sm53/04/venus-rise-p2of2-pops.png, frame 1612 + 1/2 in /home/user/workspace/work/p6/sm53/04/venus-rise-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 1543 + 1/2 in /home/user/workspace/work/p6/sm53/03/venus-rise-p1of2-changes.png, frame 1558 in no panel (a slice --frames 3116-3116 draws it), frame 1569 + 1/2 in no panel (a slice --frames 3139-3139 draws it), frame 1608 + 1/2 in /home/user/workspace/work/p6/sm53/04/venus-rise-p2of2-changes.png.

- RED pop score 1.21 from frame 1610 + 1/2 to the next, limit 1.2
- RED the pattern of the picture changes in place by 0.85 from frame 1543 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (17 frames over it, first 1542)

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
| 1536 | 73.87 | 0.02 | 4.3 | 1.28 | 1.28 | 1.00 | 1.01 | 1.00 | 0.000 | 1.73 | 13,5 | 12.5 | 14.5 | 0.62 | 0.18 | 0.61 | 8.0 |
| 1536 + 1/2 | 74.25 | 0.02 | 4.7 | 1.32 | 1.31 | 1.00 | 1.01 | 1.00 | 0.001 | 1.75 | 14,8 | 13.8 | 16.3 | 0.62 | 0.19 | 0.62 | 8.0 |
| 1537 | 74.67 | 0.01 | 5.2 | 1.34 | 1.33 | 1.01 | 1.00 | 1.00 | 0.006 | 2.00 | 13,8 | 15.2 | 18.2 | 0.62 | 0.19 | 0.62 | 8.0 |
| 1537 + 1/2 | 75.10 | 0.02 | 5.6 | 1.36 | 1.34 | 1.01 | 1.01 | 1.01 | 0.006 | 2.77 | 13,8 | 16.7 | 19.3 | 0.62 | 0.19 | 0.62 | 8.0 |
| 1538 | 75.58 | 0.00 | 6.1 | 1.35 | 1.35 | 1.00 | 1.00 | 1.00 | 0.006 | 2.88 | 13,8 | 18.2 | 21.4 | 0.63 | 0.18 | 0.62 | 8.0 |
| 1538 + 1/2 | 76.06 | 0.01 | 6.6 | 1.36 | 1.35 | 1.00 | 1.01 | 1.00 | 0.005 | 3.10 | 13,8 | 19.9 | 23.8 | 0.63 | 0.15 | 0.63 | 8.0 |
| 1539 | 76.56 | 0.01 | 7.0 | 1.35 | 1.42 | 0.95 | 0.95 | 0.95 | 0.012 | 3.36 | 13,8 | 21.5 | 27.3 | 0.63 | 0.13 | 0.63 | 8.0 |
| 1539 + 1/2 | 77.06 | 0.02 | 7.6 | 1.68 | 1.42 | 1.18 | 1.17 | 1.17 | 0.016 | 3.12 | 13,8 | 23.7 | 31.6 | 0.63 | 0.13 | 0.63 | 8.0 |
| 1540 | 77.62 | 0.01 | 8.0 | 1.49 | 1.51 | 0.98 | 1.00 | 0.98 | 0.015 | 2.86 | 13,8 | 25.6 | 40.8 | 0.63 | 0.10 | 0.63 | 9.1 |
| 1540 + 1/2 | 78.19 | 0.02 | 8.5 | 1.52 | 1.51 | 1.00 | 1.00 | 1.00 | 0.020 | 2.19 | 13,8 | 28.9 | 45.9 | 0.64 | 0.10 | 0.64 | 9.0 |
| 1541 | 78.79 | 0.03 | 9.0 | 1.51 | 1.52 | 0.99 | 0.99 | 0.99 | 0.015 | 2.30 | 4,7 | 31.6 | 49.7 | 0.64 | 0.44 | 0.03 | 8.0 |
| 1541 + 1/2 | 79.46 | 0.02 | 9.4 | 1.52 | 1.54 | 0.99 | 0.96 | 0.96 | 0.029 | 2.32 | 4,7 | 34.2 | 52.9 | 0.65 | 0.40 | 0.03 | 8.0 |
| 1542 | 80.16 | 0.00 | 9.9 | 1.53 | 1.56 | 0.98 | 0.98 | 0.98 | 0.020 | 2.26 | 4,7 | 37.2 | 56.5 | 0.66 | 0.64 | 0.03 | 8.0 |
| 1542 + 1/2 | 80.87 | 0.00 | 10.2 | 1.55 | 1.58 | 0.98 | 0.98 | 0.98 | 0.018 | 2.40 | 4,7 | 39.3 | 59.2 | 0.66 | 0.58 | 0.03 | 8.0 |
| 1543 | 81.58 | 0.01 | 10.7 | 1.57 | 1.61 | 0.98 | 0.98 | 0.98 | 0.017 | 2.20 | 4,7 | 41.2 | 64.0 | 0.66 | 0.70 | 0.04 | 8.0 |
| 1543 + 1/2 | 82.29 | 0.01 | 11.0 | 1.60 | 1.64 | 0.98 | 0.98 | 0.98 | 0.019 | 2.33 | 12,7 | 43.4 | 66.5 | 0.67 | 0.85 | 0.04 | 8.0 |
| 1544 | 83.03 | 0.02 | 11.5 | 1.62 | 1.67 | 0.97 | 0.97 | 0.97 | 0.019 | 2.44 | 12,7 | 46.5 | 69.7 | 0.68 | 0.74 | 0.04 | 8.0 |
| 1544 + 1/2 | 83.72 | 0.02 | 11.7 | 1.66 | 1.69 | 0.98 | 0.98 | 0.98 | 0.016 | 3.19 | 12,7 | 51.9 | 74.5 | 0.68 | 0.66 | 0.04 | 8.0 |
| 1545 | 84.38 | 0.05 | 12.1 | 1.71 | 1.76 | 0.97 | 0.99 | 0.97 | 0.013 | 2.84 | 12,7 | 56.5 | 79.9 | 0.69 | 0.77 | 0.04 | 8.0 |
| 1545 + 1/2 | 84.94 | 0.03 | 12.3 | 1.83 | 1.86 | 0.99 | 0.98 | 0.98 | 0.019 | 3.03 | 0,6 | 62.5 | 82.5 | 0.69 | 0.74 | 0.04 | 8.0 |
| 1546 | 85.44 | 0.08 | 12.6 | 2.01 | 2.02 | 0.99 | 0.99 | 0.99 | 0.014 | 3.41 | 0,6 | 65.1 | 89.7 | 0.70 | 0.74 | 0.04 | 8.0 |
| 1546 + 1/2 | 85.78 | 0.11 | 12.8 | 2.21 | 2.14 | 1.03 | 1.02 | 1.02 | 0.016 | 3.74 | 0,6 | 67.5 | 87.1 | 0.71 | 0.56 | 0.05 | 8.0 |
| 1547 | 85.91 | 0.05 | 13.3 | 2.28 | 2.25 | 1.01 | 1.02 | 1.01 | 0.008 | 3.27 | 7,2 | 65.8 | 75.9 | 0.72 | 0.38 | 0.07 | 8.0 |
| 1547 + 1/2 | 85.93 | 0.04 | 13.5 | 2.29 | 2.32 | 0.99 | 0.99 | 0.99 | 0.008 | 3.04 | 0,6 | 64.5 | 76.8 | 0.73 | 0.37 | 0.73 | 9.3 |
| 1548 | 86.04 | 0.06 | 13.8 | 2.36 | 2.38 | 0.99 | 1.00 | 0.99 | 0.003 | 3.72 | 15,4 | 61.0 | 77.8 | 0.74 | 0.34 | 0.73 | 8.8 |
| 1548 + 1/2 | 86.04 | 0.10 | 14.0 | 2.47 | 2.43 | 1.02 | 1.04 | 1.02 | 0.003 | 4.45 | 15,4 | 55.1 | 77.4 | 0.74 | 0.22 | 0.07 | 8.0 |
| 1549 | 85.84 | 0.07 | 14.3 | 2.49 | 2.49 | 1.00 | 1.01 | 1.00 | 0.019 | 3.61 | 14,4 | 50.7 | 76.0 | 0.75 | 0.31 | 0.07 | 8.0 |
| 1549 + 1/2 | 85.50 | 0.05 | 14.6 | 2.51 | 2.53 | 0.99 | 1.01 | 0.99 | 0.027 | 2.77 | 1,6 | 48.6 | 73.3 | 0.75 | 0.18 | 0.07 | 8.0 |
| 1550 | 85.05 | 0.08 | 15.0 | 2.56 | 2.57 | 1.00 | 1.02 | 1.00 | 0.024 | 2.74 | 14,8 | 47.0 | 69.0 | 0.76 | 0.20 | 0.06 | 8.0 |
| 1550 + 1/2 | 84.44 | 0.14 | 15.4 | 2.64 | 2.62 | 1.01 | 1.02 | 1.01 | 0.040 | 3.35 | 1,8 | 45.7 | 63.8 | 0.77 | 0.20 | 0.07 | 8.0 |
| 1551 | 83.56 | 0.03 | 15.8 | 2.72 | 2.66 | 1.03 | 1.07 | 1.03 | 0.022 | 4.07 | 1,8 | 44.0 | 59.5 | 0.78 | 0.24 | 0.07 | 8.0 |
| 1551 + 1/2 | 82.60 | 0.03 | 16.1 | 2.82 | 2.69 | 1.05 | 1.07 | 1.05 | 0.032 | 3.44 | 1,8 | 42.9 | 53.6 | 0.78 | 0.24 | 0.06 | 8.0 |
| 1552 | 81.57 | 0.08 | 16.5 | 2.84 | 2.72 | 1.04 | 1.04 | 1.04 | 0.045 | 4.77 | 15,8 | 43.1 | 47.7 | 0.79 | 0.25 | 0.06 | 8.0 |
| 1552 + 1/2 | 80.38 | 0.01 | 17.0 | 2.91 | 2.74 | 1.06 | 1.11 | 1.06 | 0.032 | 5.12 | 15,8 | 44.0 | 46.4 | 0.80 | 0.24 | 0.06 | 8.0 |
| 1553 | 79.17 | 0.10 | 17.1 | 3.00 | 2.76 | 1.09 | 1.10 | 1.09 | 0.050 | 4.21 | 15,8 | 45.5 | 48.5 | 0.81 | 0.18 | 0.06 | 8.0 |
| 1553 + 1/2 | 78.15 | 0.04 | 17.5 | 3.02 | 2.77 | 1.09 | 1.00 | 1.00 | 0.075 | 3.83 | 14,8 | 47.0 | 50.5 | 0.82 | 0.13 | 0.06 | 8.0 |
| 1554 | 77.21 | 0.09 | 17.7 | 3.07 | 2.78 | 1.10 | 1.00 | 1.00 | 0.068 | 4.13 | 14,8 | 48.4 | 52.7 | 0.84 | 0.41 | 0.06 | 8.0 |
| 1554 + 1/2 | 76.45 | 0.17 | 17.9 | 2.99 | 2.78 | 1.08 | 0.98 | 0.98 | 0.069 | 3.31 | 7,0 | 49.8 | 55.0 | 0.85 | 0.25 | 0.05 | 8.0 |
| 1555 | 76.04 | 0.21 | 17.9 | 2.99 | 2.78 | 1.08 | 0.99 | 0.99 | 0.063 | 3.23 | 13,7 | 51.0 | 56.9 | 0.86 | 0.23 | 0.05 | 8.0 |
| 1555 + 1/2 | 76.04 | 0.15 | 18.2 | 2.81 | 2.80 | 1.01 | 1.04 | 1.01 | 0.024 | 3.01 | 13,7 | 52.4 | 59.1 | 0.87 | 0.22 | 0.04 | 8.0 |
| 1556 | 76.33 | 0.05 | 18.7 | 2.82 | 2.82 | 1.00 | 0.99 | 0.99 | 0.038 | 3.11 | 12,7 | 53.7 | 61.2 | 0.88 | 0.13 | 0.03 | 8.0 |
| 1556 + 1/2 | 76.72 | 0.16 | 19.1 | 2.78 | 2.82 | 0.98 | 0.93 | 0.93 | 0.055 | 4.03 | 12,7 | 54.8 | 63.1 | 0.89 | 0.11 | 0.89 | 9.8 |
| 1557 | 76.79 | 0.13 | 18.7 | 2.67 | 2.83 | 0.94 | 0.95 | 0.94 | 0.045 | 4.08 | 12,7 | 55.7 | 64.9 | 0.90 | 0.11 | 0.90 | 9.5 |
| 1557 + 1/2 | 77.12 | 0.06 | 19.3 | 2.72 | 2.84 | 0.96 | 0.93 | 0.93 | 0.060 | 3.40 | 12,7 | 56.3 | 66.4 | 0.91 | 0.10 | 0.91 | 9.2 |
| 1558 | 77.56 | 0.05 | 18.6 | 2.77 | 2.87 | 0.97 | 1.02 | 0.97 | 0.030 | 3.22 | 0,8 | 56.4 | 67.0 | 0.92 | 0.11 | 0.91 | 8.0 |
| 1558 + 1/2 | 78.11 | 0.01 | 19.9 | 2.75 | 2.87 | 0.96 | 0.99 | 0.96 | 0.049 | 3.34 | 0,8 | 56.0 | 67.3 | 0.92 | 0.11 | 0.92 | 8.0 |
| 1559 | 78.67 | 0.01 | 19.0 | 2.78 | 2.90 | 0.96 | 1.01 | 0.96 | 0.032 | 3.38 | 1,4 | 55.4 | 67.2 | 0.93 | 0.10 | 0.93 | 8.0 |
| 1559 + 1/2 | 79.26 | 0.18 | 19.4 | 2.82 | 2.90 | 0.97 | 1.01 | 0.97 | 0.039 | 3.35 | 1,8 | 54.4 | 66.3 | 0.94 | 0.09 | 0.93 | 8.0 |
| 1560 | 80.20 | 0.08 | 19.4 | 2.78 | 2.92 | 0.95 | 1.02 | 0.95 | 0.030 | 2.84 | 2,3 | 52.9 | 64.8 | 0.94 | 0.08 | 0.94 | 8.0 |
| 1560 + 1/2 | 81.31 | 0.03 | 19.9 | 2.78 | 2.92 | 0.95 | 1.00 | 0.95 | 0.035 | 3.11 | 2,4 | 51.2 | 63.2 | 0.94 | 0.08 | 0.94 | 8.0 |
| 1561 | 82.37 | 0.02 | 19.9 | 2.84 | 2.93 | 0.97 | 1.03 | 0.97 | 0.030 | 3.15 | 2,4 | 49.5 | 61.2 | 0.94 | 0.08 | 0.94 | 8.0 |
| 1561 + 1/2 | 83.46 | 0.13 | 20.2 | 2.89 | 2.93 | 0.99 | 1.06 | 0.99 | 0.026 | 3.03 | 2,4 | 47.6 | 58.9 | 0.95 | 0.09 | 0.94 | 8.0 |
| 1562 | 84.81 | 0.06 | 20.4 | 2.93 | 2.92 | 1.00 | 1.02 | 1.00 | 0.036 | 2.82 | 2,4 | 45.7 | 56.6 | 0.95 | 0.11 | 0.95 | 8.0 |
| 1562 + 1/2 | 86.04 | 0.02 | 21.5 | 2.92 | 2.93 | 1.00 | 1.00 | 1.00 | 0.040 | 2.41 | 2,4 | 44.0 | 54.4 | 0.95 | 0.12 | 0.95 | 8.0 |
| 1563 | 87.30 | 0.05 | 23.3 | 2.90 | 2.93 | 0.99 | 0.98 | 0.98 | 0.040 | 2.04 | 3,3 | 42.5 | 52.6 | 0.95 | 0.12 | 0.95 | 8.0 |
| 1563 + 1/2 | 88.46 | 0.09 | 23.6 | 2.92 | 2.93 | 1.00 | 0.98 | 0.98 | 0.026 | 2.20 | 11,8 | 41.1 | 50.5 | 0.95 | 0.13 | 0.95 | 8.0 |
| 1564 | 89.44 | 0.16 | 23.1 | 3.15 | 2.93 | 1.07 | 0.98 | 0.98 | 0.032 | 2.91 | 13,0 | 39.7 | 48.7 | 0.95 | 0.15 | 0.95 | 8.0 |
| 1564 + 1/2 | 90.09 | 0.33 | 22.6 | 3.12 | 2.94 | 1.06 | 0.90 | 0.90 | 0.037 | 2.23 | 3,3 | 38.6 | 46.8 | 0.95 | 0.16 | 0.95 | 8.0 |
| 1565 | 90.08 | 0.06 | 22.4 | 3.19 | 2.98 | 1.07 | 0.91 | 0.91 | 0.043 | 1.79 | 3,3 | 37.6 | 45.2 | 0.95 | 0.16 | 0.95 | 8.0 |
| 1565 + 1/2 | 89.95 | 0.33 | 22.5 | 3.12 | 3.05 | 1.02 | 0.89 | 0.89 | 0.049 | 1.76 | 8,8 | 37.5 | 43.3 | 0.95 | 0.17 | 0.94 | 8.0 |
| 1566 | 89.15 | 0.09 | 22.9 | 3.09 | 3.11 | 0.99 | 0.90 | 0.90 | 0.052 | 2.27 | 12,5 | 38.2 | 41.9 | 0.94 | 0.17 | 0.94 | 8.0 |
| 1566 + 1/2 | 88.17 | 0.09 | 23.1 | 2.83 | 3.12 | 0.91 | 0.97 | 0.91 | 0.025 | 1.94 | 12,5 | 38.8 | 42.0 | 0.94 | 0.17 | 0.94 | 8.0 |
| 1567 | 87.38 | 0.13 | 23.0 | 2.95 | 3.12 | 0.94 | 1.04 | 0.94 | 0.024 | 1.64 | 10,8 | 39.5 | 42.7 | 0.94 | 0.15 | 0.94 | 8.0 |
| 1567 + 1/2 | 86.31 | 0.10 | 22.9 | 3.01 | 3.13 | 0.96 | 1.06 | 0.96 | 0.015 | 1.81 | 0,0 | 40.4 | 43.6 | 0.94 | 0.14 | 0.93 | 8.0 |
| 1568 | 85.05 | 0.12 | 22.5 | 3.10 | 3.13 | 0.99 | 1.04 | 0.99 | 0.046 | 2.04 | 0,2 | 41.1 | 44.4 | 0.93 | 0.12 | 0.93 | 8.0 |
| 1568 + 1/2 | 83.55 | 0.15 | 22.5 | 3.11 | 3.13 | 0.99 | 1.06 | 0.99 | 0.035 | 2.19 | 0,2 | 41.5 | 44.8 | 0.92 | 0.11 | 0.92 | 8.0 |
| 1569 | 81.74 | 0.03 | 22.8 | 3.17 | 3.12 | 1.02 | 1.08 | 1.02 | 0.051 | 2.40 | 0,1 | 42.0 | 45.1 | 0.91 | 0.09 | 0.91 | 8.0 |
| 1569 + 1/2 | 80.00 | 0.01 | 22.3 | 3.26 | 3.12 | 1.04 | 1.09 | 1.04 | 0.062 | 2.56 | 0,1 | 42.4 | 45.5 | 0.90 | 0.09 | 0.90 | 8.0 |
| 1570 | 78.28 | 0.08 | 22.7 | 3.35 | 3.12 | 1.07 | 1.13 | 1.07 | 0.070 | 2.59 | 0,8 | 42.3 | 44.9 | 0.89 | 0.10 | 0.89 | 8.0 |
| 1570 + 1/2 | 76.40 | 0.08 | 22.5 | 3.40 | 3.12 | 1.09 | 1.10 | 1.09 | 0.096 | 2.67 | 3,8 | 42.0 | 44.9 | 0.88 | 0.12 | 0.88 | 8.0 |
| 1571 | 74.68 | 0.01 | 22.3 | 3.45 | 3.12 | 1.10 | 1.14 | 1.10 | 0.091 | 2.78 | 0,7 | 41.6 | 44.7 | 0.87 | 0.12 | 0.87 | 8.0 |
| 1571 + 1/2 | 72.93 | 0.01 | 21.8 | 3.48 | 3.12 | 1.11 | 1.16 | 1.11 | 0.078 | 2.51 | 0,7 | 41.0 | 44.8 | 0.86 | 0.15 | 0.86 | 8.0 |
| 1572 | 71.17 | 0.03 | 21.5 | 3.47 | 3.12 | 1.11 | 1.13 | 1.11 | 0.112 | 2.87 | 0,6 | 40.3 | 44.8 | 0.85 | 0.19 | 0.85 | 8.0 |
| 1572 + 1/2 | 69.47 | 0.00 | 20.9 | 3.45 | 3.12 | 1.11 | 1.13 | 1.11 | 0.106 | 2.36 | 0,3 | 39.6 | 44.5 | 0.84 | 0.20 | 0.84 | 8.0 |
| 1573 | 67.77 | 0.04 | 20.2 | 3.40 | 3.11 | 1.09 | 1.10 | 1.09 | 0.131 | 2.38 | 0,4 | 38.5 | 43.9 | 0.83 | 0.25 | 0.83 | 8.0 |
| 1573 + 1/2 | 66.16 | 0.05 | 20.4 | 3.39 | 3.10 | 1.09 | 1.04 | 1.04 | 0.164 | 2.24 | 4,7 | 37.5 | 43.0 | 0.82 | 0.36 | 0.82 | 8.0 |
| 1574 | 64.65 | 0.06 | 21.0 | 3.33 | 3.06 | 1.09 | 1.05 | 1.05 | 0.137 | 2.27 | 4,7 | 36.3 | 41.9 | 0.81 | 0.42 | 0.81 | 8.0 |
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
| 1582 | 49.08 | 0.02 | 14.2 | 1.96 | 1.96 | 1.00 | 1.03 | 1.00 | 0.036 | 1.76 | 9,8 | 14.7 | 20.9 | 0.53 | 0.19 | 0.53 | 8.0 |
| 1582 + 1/2 | 48.50 | 0.01 | 13.6 | 1.92 | 1.93 | 1.00 | 1.00 | 1.00 | 0.053 | 1.50 | 11,6 | 13.5 | 19.6 | 0.51 | 0.17 | 0.50 | 8.0 |
| 1583 | 47.93 | 0.01 | 12.9 | 1.89 | 1.89 | 1.00 | 1.00 | 1.00 | 0.057 | 1.45 | 13,8 | 12.2 | 17.4 | 0.49 | 0.14 | 0.48 | 8.0 |
| 1583 + 1/2 | 47.35 | 0.00 | 12.2 | 1.87 | 1.87 | 1.00 | 0.99 | 0.99 | 0.058 | 1.55 | 8,8 | 11.1 | 16.3 | 0.47 | 0.12 | 0.47 | 8.0 |
| 1584 | 46.77 | 0.01 | 11.8 | 1.85 | 1.83 | 1.01 | 1.03 | 1.01 | 0.046 | 1.44 | 3,8 | 10.1 | 14.9 | 0.45 | 0.10 | 0.45 | 8.0 |
| 1584 + 1/2 | 46.20 | 0.02 | 11.2 | 1.80 | 1.80 | 0.99 | 0.98 | 0.98 | 0.061 | 1.63 | 0,0 | 9.0 | 13.0 | 0.43 | 0.08 | 0.43 | 8.0 |
| 1585 | 45.67 | 0.01 | 10.8 | 1.76 | 1.76 | 1.00 | 1.01 | 1.00 | 0.050 | 1.64 | 15,6 | 8.2 | 11.7 | 0.42 | 0.07 | 0.42 | 8.0 |
| 1585 + 1/2 | 45.15 | 0.01 | 10.4 | 1.72 | 1.72 | 1.00 | 1.00 | 1.00 | 0.045 | 1.76 | 9,7 | 7.4 | 10.2 | 0.40 | 0.05 | 0.40 | 8.0 |
| 1586 | 44.66 | 0.01 | 10.0 | 1.67 | 1.68 | 0.99 | 0.98 | 0.98 | 0.045 | 1.55 | 9,7 | 6.8 | 10.0 | 0.39 | 0.05 | 0.39 | 8.0 |
| 1586 + 1/2 | 44.18 | 0.00 | 9.7 | 1.65 | 1.66 | 1.00 | 1.00 | 1.00 | 0.034 | 1.48 | 6,8 | 6.2 | 8.8 | 0.38 | 0.05 | 0.38 | 8.0 |
| 1587 | 43.71 | 0.02 | 9.2 | 1.64 | 1.64 | 1.00 | 1.00 | 1.00 | 0.034 | 1.64 | 10,4 | 5.6 | 7.5 | 0.37 | 0.06 | 0.37 | 8.0 |
| 1587 + 1/2 | 43.28 | 0.01 | 9.0 | 1.62 | 1.62 | 1.00 | 1.01 | 1.00 | 0.024 | 1.56 | 10,4 | 5.0 | 6.6 | 0.36 | 0.08 | 0.35 | 8.0 |
| 1588 | 42.86 | 0.01 | 8.6 | 1.59 | 1.60 | 1.00 | 1.00 | 1.00 | 0.026 | 1.58 | 10,4 | 4.3 | 5.9 | 0.35 | 0.11 | 0.34 | 8.0 |
| 1588 + 1/2 | 42.46 | 0.01 | 8.3 | 1.57 | 1.58 | 1.00 | 0.99 | 0.99 | 0.035 | 1.53 | 14,1 | 3.9 | 5.2 | 0.33 | 0.12 | 0.33 | 8.0 |
| 1589 | 42.08 | 0.01 | 7.9 | 1.56 | 1.55 | 1.01 | 1.01 | 1.01 | 0.035 | 1.57 | 14,1 | 4.3 | 5.5 | 0.32 | 0.12 | 0.32 | 8.0 |
| 1589 + 1/2 | 41.72 | 0.01 | 7.5 | 1.53 | 1.54 | 0.99 | 0.99 | 0.99 | 0.039 | 1.47 | 3,1 | 4.7 | 7.0 | 0.32 | 0.11 | 0.31 | 8.0 |
| 1590 | 41.37 | 0.01 | 7.2 | 1.51 | 1.51 | 1.00 | 1.00 | 1.00 | 0.034 | 1.53 | 7,3 | 5.1 | 8.0 | 0.31 | 0.12 | 0.30 | 8.0 |
| 1590 + 1/2 | 41.05 | 0.01 | 6.8 | 1.50 | 1.49 | 1.00 | 1.00 | 1.00 | 0.036 | 1.53 | 7,3 | 5.3 | 8.0 | 0.30 | 0.11 | 0.30 | 8.0 |
| 1591 | 40.74 | 0.01 | 6.4 | 1.47 | 1.48 | 0.99 | 0.99 | 0.99 | 0.032 | 1.52 | 7,3 | 5.1 | 7.6 | 0.29 | 0.14 | 0.29 | 8.0 |
| 1591 + 1/2 | 40.45 | 0.01 | 6.1 | 1.46 | 1.46 | 1.00 | 1.01 | 1.00 | 0.027 | 1.50 | 5,0 | 4.7 | 7.0 | 0.28 | 0.16 | 0.28 | 8.0 |
| 1592 | 40.17 | 0.01 | 5.7 | 1.44 | 1.45 | 0.99 | 0.99 | 0.99 | 0.025 | 1.48 | 5,0 | 4.0 | 5.9 | 0.28 | 0.14 | 0.28 | 8.0 |
| 1592 + 1/2 | 39.88 | 0.01 | 5.5 | 1.43 | 1.44 | 1.00 | 0.99 | 0.99 | 0.031 | 1.38 | 9,4 | 3.5 | 4.6 | 0.27 | 0.14 | 0.27 | 8.0 |
| 1593 | 39.57 | 0.00 | 5.1 | 1.43 | 1.42 | 1.01 | 1.01 | 1.01 | 0.021 | 1.66 | 14,0 | 3.0 | 4.7 | 0.27 | 0.12 | 0.26 | 8.0 |
| 1593 + 1/2 | 39.26 | 0.00 | 4.7 | 1.41 | 1.42 | 0.99 | 0.99 | 0.99 | 0.025 | 1.56 | 9,4 | 2.8 | 5.2 | 0.26 | 0.11 | 0.26 | 8.0 |
| 1594 | 38.95 | 0.01 | 4.4 | 1.41 | 1.40 | 1.01 | 1.00 | 1.00 | 0.027 | 1.51 | 9,4 | 2.8 | 5.7 | 0.25 | 0.11 | 0.25 | 8.0 |
| 1594 + 1/2 | 38.63 | 0.00 | 4.1 | 1.39 | 1.39 | 1.00 | 1.01 | 1.00 | 0.023 | 1.55 | 14,0 | 3.0 | 6.3 | 0.25 | 0.10 | 0.25 | 8.0 |
| 1595 | 38.31 | 0.00 | 3.8 | 1.37 | 1.38 | 1.00 | 0.99 | 0.99 | 0.022 | 1.43 | 9,4 | 3.4 | 6.5 | 0.25 | 0.09 | 0.24 | 8.0 |
| 1595 + 1/2 | 37.99 | 0.00 | 3.5 | 1.36 | 1.36 | 1.00 | 1.00 | 1.00 | 0.015 | 1.46 | 15,4 | 4.2 | 6.9 | 0.24 | 0.09 | 0.24 | 8.0 |
| 1596 | 37.67 | 0.00 | 3.2 | 1.34 | 1.36 | 0.98 | 0.98 | 0.98 | 0.014 | 1.42 | 10,6 | 5.0 | 7.2 | 0.24 | 0.09 | 0.24 | 8.0 |
| 1596 + 1/2 | 37.36 | 0.00 | 2.9 | 1.35 | 1.35 | 1.00 | 0.99 | 0.99 | 0.015 | 1.47 | 6,2 | 5.9 | 8.2 | 0.23 | 0.08 | 0.23 | 8.0 |
| 1597 | 37.06 | 0.00 | 2.6 | 1.36 | 1.33 | 1.02 | 1.01 | 1.01 | 0.010 | 1.60 | 11,5 | 6.6 | 9.1 | 0.23 | 0.07 | 0.23 | 8.0 |
| 1597 + 1/2 | 36.77 | 0.01 | 2.5 | 1.33 | 1.33 | 1.00 | 1.00 | 1.00 | 0.006 | 1.58 | 12,3 | 6.6 | 9.5 | 0.23 | 0.07 | 0.23 | 8.0 |
| 1598 | 36.49 | 0.01 | 2.2 | 1.33 | 1.32 | 1.01 | 1.01 | 1.01 | 0.000 | 1.69 | 15,0 | 6.6 | 9.7 | 0.22 | 0.06 | 0.22 | 8.0 |
| 1598 + 1/2 | 36.22 | 0.01 | 1.9 | 1.31 | 1.30 | 1.01 | 1.01 | 1.01 | 0.000 | 1.70 | 15,0 | 6.5 | 9.3 | 0.22 | 0.06 | 0.22 | 8.0 |
| 1599 | 35.97 | 0.01 | 1.7 | 1.28 | 1.27 | 1.01 | 1.01 | 1.01 | 0.000 | 1.58 | 0,0 | 6.3 | 9.0 | 0.22 | 0.05 | 0.22 | 8.0 |
| 1599 + 1/2 | 35.74 | 0.01 | 1.5 | 1.23 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 1.58 | 0,0 | 6.2 | 8.5 | 0.22 | 0.05 | 0.21 | 8.0 |
| 1600 | 35.53 | 0.00 | 1.3 | 1.17 | 1.17 | 1.01 | 1.01 | 1.01 | 0.000 | 1.64 | 15,0 | 5.9 | 8.0 | 0.21 | 0.05 | 0.21 | 8.0 |
| 1600 + 1/2 | 35.33 | 0.00 | 1.1 | 1.11 | 1.11 | 1.00 | 1.00 | 1.00 | 0.000 | 1.50 | 12,2 | 5.7 | 7.7 | 0.21 | 0.04 | 0.21 | 8.0 |
| 1601 | 35.13 | 0.00 | 1.0 | 1.05 | 1.04 | 1.01 | 1.01 | 1.01 | 0.000 | 1.55 | 15,0 | 5.8 | 7.6 | 0.21 | 0.05 | 0.21 | 8.0 |
| 1601 + 1/2 | 34.94 | 0.00 | 0.9 | 0.98 | 0.98 | 1.00 | 1.00 | 1.00 | 0.000 | 1.53 | 14,0 | 4.3 | 5.3 | 0.21 | 0.04 | 0.21 | 8.0 |
| 1602 | 34.76 | 0.00 | 0.7 | 0.91 | 0.93 | 0.98 | 0.98 | 0.98 | 0.000 | 1.33 | 14,0 | 3.1 | 3.6 | 0.20 | 0.03 | 0.20 | 8.0 |
| 1602 + 1/2 | 34.58 | 0.00 | 0.6 | 0.84 | 0.94 | 0.90 | 0.90 | 0.90 | 0.000 | 1.20 | 8,3 | 2.4 | 3.0 | 0.20 | 0.03 | 0.20 | 8.0 |
| 1603 | 34.41 | 0.00 | 0.5 | 0.77 | 0.89 | 0.86 | 0.86 | 0.86 | 0.000 | 1.14 | 13,8 | 2.8 | 3.2 | 0.20 | 0.03 | 0.20 | 8.0 |
| 1603 + 1/2 | 34.24 | 0.00 | 0.5 | 0.71 | 0.89 | 0.80 | 0.82 | 0.80 | 0.000 | 1.10 | 3,4 | 3.8 | 5.1 | 0.20 | 0.03 | 0.20 | 8.0 |
| 1604 last | 34.09 | 0.00 | 0.4 | 0.68 | 0.89 | 0.76 | 0.78 | 0.76 | 0.000 | 1.11 | 4,4 | 5.1 | 6.8 | 0.20 | 0.03 | 0.20 | 8.0 |
| 1604 + 1/2 | 33.94 | 0.00 | 0.4 | 0.66 | 0.89 | 0.74 | 0.76 | 0.74 | 0.000 | 1.14 | 4,3 | 6.8 | 9.0 | 0.20 | 0.04 | 0.19 | 8.0 |
| 1605 | 33.79 | 0.00 | 0.4 | 0.66 | 0.89 | 0.74 | 0.76 | 0.74 | 0.000 | 1.15 | 4,4 | 9.3 | 11.8 | 0.19 | 0.06 | 0.19 | 8.0 |
| 1605 + 1/2 | 33.63 | 0.00 | 0.4 | 0.66 | 0.89 | 0.73 | 0.76 | 0.73 | 0.000 | 1.09 | 3,5 | 11.6 | 15.0 | 0.19 | 0.11 | 0.19 | 8.0 |
| 1606 | 33.48 | 0.00 | 0.4 | 0.65 | 0.89 | 0.73 | 0.76 | 0.73 | 0.000 | 1.09 | 13,4 | 15.0 | 19.1 | 0.19 | 0.18 | 0.19 | 8.0 |
| 1606 + 1/2 | 33.33 | 0.00 | 0.4 | 0.64 | 0.89 | 0.72 | 0.75 | 0.72 | 0.000 | 1.13 | 10,8 | 17.4 | 22.6 | 0.19 | 0.32 | 0.18 | 8.0 |
| 1607 | 33.19 | 0.00 | 0.4 | 0.63 | 0.89 | 0.71 | 0.74 | 0.71 | 0.000 | 1.08 | 11,8 | 20.6 | 27.0 | 0.18 | 0.37 | 0.18 | 8.0 |
| 1607 + 1/2 | 33.04 | 0.01 | 0.4 | 0.65 | 0.89 | 0.73 | 0.76 | 0.73 | 0.000 | 1.37 | 6,3 | 24.5 | 31.3 | 0.18 | 0.48 | 0.18 | 8.0 |
| 1608 | 32.91 | 0.00 | 0.5 | 0.75 | 0.89 | 0.84 | 0.88 | 0.84 | 0.000 | 1.90 | 6,4 | 28.3 | 35.5 | 0.17 | 0.54 | 0.17 | 8.0 |
| 1608 + 1/2 | 32.78 | 0.00 | 0.8 | 0.85 | 0.89 | 0.96 | 1.03 | 0.96 | 0.000 | 2.23 | 5,3 | 32.1 | 39.4 | 0.17 | 0.62 | 0.17 | 8.0 |
| 1609 | 32.66 | 0.00 | 1.2 | 0.81 | 0.89 | 0.91 | 0.98 | 0.91 | 0.000 | 1.70 | 6,4 |  |  |  |  |  |  |
| 1609 + 1/2 | 32.54 | 0.00 | 1.7 | 0.88 | 0.85 | 1.04 | 1.09 | 1.04 | 0.005 | 2.13 | 6,3 |  |  |  |  |  |  |
| 1610 | 32.43 | 0.00 | 2.3 | 0.73 | 0.85 | 0.87 | 0.92 | 0.87 | 0.000 | 2.05 | 9,3 |  |  |  |  |  |  |
| 1610 + 1/2 | 32.33 | 0.00 | 3.1 | 0.99 | 0.81 | 1.21 | 1.24 | 1.21 | 0.002 | 2.26 | 5,3 |  |  |  |  |  |  |
| 1611 | 32.23 | 0.00 | 3.9 | 0.82 | 0.80 | 1.02 | 1.02 | 1.02 | 0.011 | 2.27 | 9,3 |  |  |  |  |  |  |
| 1611 + 1/2 | 32.13 | 0.00 | 4.9 | 0.91 | 0.80 | 1.14 | 1.13 | 1.13 | 0.016 | 2.19 | 9,2 |  |  |  |  |  |  |
| 1612 | 32.03 | 0.01 | 5.9 | 0.94 | 0.81 | 1.16 | 1.13 | 1.13 | 0.022 | 2.15 | 8,1 |  |  |  |  |  |  |
| 1612 + 1/2 | 31.92 | 0.01 | 7.1 | 1.05 | 0.84 | 1.26 | 1.19 | 1.19 | 0.052 | 2.89 | 5,3 |  |  |  |  |  |  |
| 1613 | 31.79 | 0.03 | 8.1 | 1.00 | 0.86 | 1.16 | 1.08 | 1.08 | 0.064 | 2.44 | 5,3 |  |  |  |  |  |  |
| 1613 + 1/2 | 31.58 | 0.09 | 9.3 | 0.97 | 0.87 | 1.11 | 1.07 | 1.07 | 0.058 | 2.41 | 7,0 |  |  |  |  |  |  |
| 1614 | 31.19 | 0.11 | 10.4 | 0.89 | 0.89 | 1.01 | 0.96 | 0.96 | 0.050 | 2.48 | 7,0 |  |  |  |  |  |  |
| 1614 + 1/2 | 30.59 | 0.09 | 11.6 | 0.99 | 0.90 | 1.10 | 1.08 | 1.08 | 0.042 | 2.66 | 7,0 |  |  |  |  |  |  |
| 1615 | 29.80 | 0.09 | 12.2 | 1.02 | 0.90 | 1.13 | 1.12 | 1.12 | 0.027 | 2.78 | 7,0 |  |  |  |  |  |  |
| 1615 + 1/2 | 28.84 | 0.08 | 12.4 | 0.94 | 0.90 | 1.05 | 1.00 | 1.00 | 0.033 | 2.47 | 7,0 |  |  |  |  |  |  |
| 1616 | 27.72 | 0.16 | 12.6 | 0.92 | 0.90 | 1.02 | 0.98 | 0.98 | 0.030 | 3.58 | 0,1 |  |  |  |  |  |  |
| 1616 + 1/2 | 26.28 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

## place

### dive (venus.dive, T at 1343, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

### rise (venus.rise, T at 1539, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 2x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 8.06, uhd 17.6.

Largest mean difference: 1.607 at frame 1568 (venus.rise), limit 12.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 0.392 at frame 1283 (venus.dive), limit 3.2.
Largest level difference of one block (a grid of 16 by 9): -1.284 at frame 1328 (venus.dive), limit 12.
Largest level difference of the whole frame: -0.164 at frame 1568 (venus.rise), limit 2.2.
Picture: out/work/smooth/venus-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1185 | venus.hold | 1.261 | 5.8 | 54 | -0.045 | -0.062 | 0.190 | 14.17 | 0.383 | 10,3 | 1.157 |
| 1283 | venus.dive | 1.467 | 7.6 | 50 | -0.121 | -0.140 | 0.392 | 10.92 | -1.025 | 3,2 | 1.106 |
| 1305 | venus.dive | 1.458 | 7.6 | 147 | -0.111 | -0.119 | 0.291 | 12.65 | -0.964 | 10,5 | 1.185 |
| 1328 | venus.dive | 1.282 | 5.8 | 65 | -0.131 | -0.136 | 0.229 | 7.28 | -1.284 | 2,8 | 1.235 |
| 1440 | venus.terrain | 1.222 | 4.9 | 46 | -0.098 | -0.146 | 0.198 | 4.77 | -0.535 | 3,5 | 1.220 |
| 1549 | venus.rise | 1.250 | 4.9 | 81 | -0.064 | -0.078 | 0.191 | 5.70 | -0.612 | 4,8 | 1.259 |
| 1568 | venus.rise | 1.607 | 8.9 | 160 | -0.164 | -0.173 | 0.343 | 10.74 | -1.023 | 6,6 | 1.074 |
| 1586 | venus.rise | 1.433 | 7.7 | 57 | -0.085 | -0.089 | 0.338 | 9.82 | -0.887 | 8,1 | 1.182 |
| 1643 | venus.travel | 1.189 | 5.7 | 87 | -0.001 | -0.002 | 0.146 | 3.55 | -0.213 | 8,4 | 1.542 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.

## counts

Film frames 1110 to 1679 in order on one fresh page, 1140 pictures at rate 2, tier draft at preview, 1267 s. Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): 4 warm draws. Its work counts for that picture and stands in brackets. Judged: dive, rise and travel, every picture.

| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |
|---|---|---|---|---|---|---|---|
| venus.hold | no | 300 | 1 | 1110 | 21 | 136 | 107 |
| venus.dive | yes | 180 | 0 |  | 0 | 0 | 0 |
| venus.terrain | no | 360 | 0 |  | 0 | 0 | 0 |
| venus.rise | yes | 150 | 0 |  | 0 | 0 | 0 |
| venus.travel | yes | 150 | 0 |  | 0 | 0 | 0 |

Every picture with work (of the warm start call in brackets):

| frame | segment | programs | texture uploads | buffers | warm draws |
|---|---|---|---|---|---|
| 1110 | venus.hold | 21 (21) | 136 (136) | 107 (107) | 4 |
