# smooth: mars

Commit 5dd60616578492129874abd81ce19cc1d89d5fa9. Capture rate 2. Parts: path. A calibration run: every number is written, the exit code is 0.

VERDICT: green. No number is over its limit.

## path

### landing (earth.travel into mars.hold, frames 2226 to 2249, first frame of the hold 2250, window 2214 to 2261)

The last part of the travel that arrives at mars, from 0.68 of its length, in the camera of mars, in px of the master a film frame: sky is the turn of the camera (what the stars do), centre the way of the centre of the body, edge the growth of its radius, centre and edge the fastest point of its edge. Every value is over the mean of the curve in the landing. loss is what a curve loses over one film frame.

| run | curve | mean | at the start | hold's own | step at the seam | at | step between capture frames at the seam | at | largest loss | at | growth of the loss in the last 4 | at | climb after a fall | at | under the hold's own | at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | sky | 68.57 px | 2.281 | 0.029 | 0.002 | 2249 |  |  | 0.432 | 2237 | 0.001 | 2250 | 0.007 | 2249 | 0.002 | 2249 |
| whole frames | centre | 0.07441 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.170 | 0.218 | 0.009 | 2249 |  |  | 0.007 | 2228 | 0.000 | 2250 | 0.072 | 2249 | 0.021 | 2249 |
| whole frames | edge | 12.65 px | 1.816 | 0.013 | 0.043 | 2249 |  |  | 0.288 | 2237 | -0.007 | 2247 | 0.000 |  | -0.003 | 2250 |
| whole frames | centre and edge | 12.72 px | 1.812 | 0.022 | 0.043 | 2249 |  |  | 0.286 | 2237 | -0.007 | 2247 | 0.000 |  | -0.002 | 2250 |
| rate 2 | sky | 67.98 px | 2.302 | 0.029 | 0.003 | 2248 + 1/2 | 0.001 | 2248 + 1/2 | 0.437 | 2237 | 0.001 | 2250 | 0.009 | 2249 + 1/2 | 0.003 | 2248 + 1/2 |
| rate 2 | centre | 0.07492 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.173 | 0.217 | 0.009 | 2249 + 1/2 | 0.004 | 2249 | 0.007 | 2227 + 1/2 | 0.000 | 2250 | 0.077 | 2249 + 1/2 | 0.024 | 2248 + 1/2 |
| rate 2 | edge | 12.5 px | 1.836 | 0.013 | 0.049 | 2248 + 1/2 | 0.023 | 2248 + 1/2 | 0.296 | 2237 | -0.004 | 2246 + 1/2 | 0.000 |  | -0.001 | 2250 |
| rate 2 | centre and edge | 12.58 px | 1.832 | 0.022 | 0.048 | 2248 + 1/2 | 0.023 | 2248 + 1/2 | 0.294 | 2237 | -0.004 | 2246 + 1/2 | 0.000 |  | -0.000 | 2250 |

Limits: step 0.08 of the mean over one film frame from 2 film frames before the hold to 2 into it; the largest loss not in the last 4 film frames before the hold, and no loss there larger than the one a film frame before by more than 0.08; no loss under a third of the one a film frame before while the speed is over the hold's own; climb after a fall 0.03; not under the hold's own by more than 0.08. A loss and a speed over the hold's own count from 0.01 of the mean. The two rules of the loss (where the largest lies and how it grows, and letting go) are shown and not judged: the path alone does not part a good arrival from a bad one by them. A curve whose mean is under 0.5 px a film frame stands still in the picture: it is given over that floor, shown and not judged. The 12 film frames before the landing and the frames further into the hold are shown and not judged.

No judged number of the landing is over its limit.

- shown, not judged: whole frames, centre: climbs again by 0.072 of the mean after it has started to fall, up to frame 2249, limit 0.03
- shown, not judged: rate 2, centre: climbs again by 0.077 of the mean after it has started to fall, up to frame 2249 + 1/2, limit 0.03

Every film frame of the window. The curves are over their mean in the landing; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment | sky | step | step at rate 2 | centre | step | step at rate 2 | edge | step | step at rate 2 | centre and edge | step | step at rate 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2214 | earth.travel | 2.297 |  |  | 0.246 |  |  | 0.987 |  |  | 0.991 |  |  |
| 2215 | earth.travel | 2.296 | 0.001 | 0.001 | 0.242 | 0.004 | 0.004 | 1.099 | 0.112 * | 0.113 * | 1.102 | 0.112 * | 0.112 * |
| 2216 | earth.travel | 2.295 | 0.001 | 0.001 | 0.238 | 0.004 | 0.004 | 1.207 | 0.108 * | 0.109 * | 1.210 | 0.107 * | 0.108 * |
| 2217 | earth.travel | 2.294 | 0.001 | 0.001 | 0.234 | 0.004 | 0.005 | 1.310 | 0.103 * | 0.103 * | 1.311 | 0.102 * | 0.102 * |
| 2218 | earth.travel | 2.293 | 0.001 | 0.001 | 0.229 | 0.005 | 0.005 | 1.406 | 0.096 * | 0.096 * | 1.406 | 0.095 * | 0.095 * |
| 2219 | earth.travel | 2.291 | 0.001 | 0.001 | 0.223 | 0.005 | 0.006 | 1.493 | 0.088 * | 0.088 * | 1.493 | 0.087 * | 0.087 * |
| 2220 | earth.travel | 2.290 | 0.001 | 0.001 | 0.218 | 0.006 | 0.006 | 1.572 | 0.079 | 0.078 | 1.571 | 0.078 | 0.078 |
| 2221 | earth.travel | 2.289 | 0.001 | 0.001 | 0.211 | 0.006 | 0.006 | 1.641 | 0.069 | 0.068 | 1.640 | 0.068 | 0.068 |
| 2222 | earth.travel | 2.288 | 0.001 | 0.001 | 0.205 | 0.006 | 0.007 | 1.699 | 0.058 | 0.057 | 1.697 | 0.058 | 0.057 |
| 2223 | earth.travel | 2.287 | 0.001 | 0.001 | 0.198 | 0.007 | 0.007 | 1.746 | 0.047 | 0.046 | 1.743 | 0.046 | 0.045 |
| 2224 | earth.travel | 2.285 | 0.001 | 0.001 | 0.192 | 0.007 | 0.007 | 1.781 | 0.035 | 0.034 | 1.778 | 0.035 | 0.033 |
| 2225 | earth.travel | 2.284 | 0.001 | 0.001 | 0.185 | 0.007 | 0.007 | 1.804 | 0.023 | 0.022 | 1.800 | 0.022 | 0.021 |
| 2226 landing | earth.travel | 2.283 | 0.001 | 0.001 | 0.177 | 0.007 | 0.007 | 1.814 | 0.010 | 0.009 | 1.810 | 0.010 | 0.009 |
| 2227 | earth.travel | 2.281 | 0.001 | 0.002 | 0.170 | 0.007 | 0.007 | 1.816 | 0.002 | 0.001 | 1.812 | 0.002 | 0.001 |
| 2228 | earth.travel | 2.279 | 0.003 | 0.004 | 0.163 | 0.007 | 0.007 | 1.817 | 0.001 | 0.001 | 1.813 | 0.001 | 0.000 |
| 2229 | earth.travel | 2.274 | 0.005 | 0.007 | 0.156 | 0.007 | 0.007 | 1.817 | 0.000 | 0.000 | 1.813 | 0.000 | 0.000 |
| 2230 | earth.travel | 2.266 | 0.009 | 0.013 | 0.150 | 0.007 | 0.007 | 1.816 | 0.001 | 0.002 | 1.812 | 0.001 | 0.002 |
| 2231 | earth.travel | 2.248 | 0.018 | 0.028 | 0.144 | 0.006 | 0.006 | 1.813 | 0.003 | 0.006 | 1.808 | 0.003 | 0.007 |
| 2232 | earth.travel | 2.211 | 0.037 | 0.057 | 0.138 | 0.006 | 0.005 | 1.804 | 0.010 | 0.017 | 1.798 | 0.010 | 0.017 |
| 2233 | earth.travel | 2.136 | 0.076 | 0.116 * | 0.133 | 0.005 | 0.005 | 1.779 | 0.025 | 0.043 | 1.773 | 0.025 | 0.043 |
| 2234 | earth.travel | 1.987 | 0.148 * | 0.216 * | 0.130 | 0.004 | 0.004 | 1.719 | 0.060 | 0.098 * | 1.714 | 0.060 | 0.098 * |
| 2235 | earth.travel | 1.726 | 0.262 * | 0.345 * | 0.127 | 0.003 | 0.003 | 1.590 | 0.129 * | 0.191 * | 1.585 | 0.128 * | 0.190 * |
| 2236 | earth.travel | 1.343 | 0.383 * | 0.435 * | 0.125 | 0.002 | 0.001 | 1.364 | 0.225 * | 0.280 * | 1.361 | 0.224 * | 0.279 * |
| 2237 | earth.travel | 0.911 | 0.432 * | 0.437 * | 0.125 | 0.000 | 0.000 | 1.077 | 0.288 * | 0.296 * | 1.075 | 0.286 * | 0.294 * |
| 2238 | earth.travel | 0.545 | 0.366 * | 0.356 * | 0.126 | 0.001 | 0.002 | 0.825 | 0.252 * | 0.246 * | 0.825 | 0.251 * | 0.245 * |
| 2239 | earth.travel | 0.303 | 0.242 * | 0.228 * | 0.128 | 0.002 | 0.003 | 0.664 | 0.161 * | 0.150 * | 0.665 | 0.160 * | 0.149 * |
| 2240 | earth.travel | 0.166 | 0.137 * | 0.126 * | 0.131 | 0.003 | 0.004 | 0.575 | 0.088 * | 0.082 * | 0.577 | 0.088 * | 0.081 * |
| 2241 | earth.travel | 0.094 | 0.072 | 0.066 | 0.136 | 0.005 | 0.005 | 0.521 | 0.055 | 0.052 | 0.523 | 0.054 | 0.052 |
| 2242 | earth.travel | 0.056 | 0.038 | 0.035 | 0.141 | 0.006 | 0.006 | 0.474 | 0.047 | 0.051 | 0.476 | 0.047 | 0.050 |
| 2243 | earth.travel | 0.035 | 0.021 | 0.019 | 0.148 | 0.006 | 0.007 | 0.420 | 0.054 | 0.061 | 0.423 | 0.053 | 0.061 |
| 2244 | earth.travel | 0.024 | 0.011 | 0.010 | 0.155 | 0.007 | 0.007 | 0.355 | 0.065 | 0.072 | 0.359 | 0.064 | 0.071 |
| 2245 | earth.travel | 0.020 | 0.004 | 0.004 | 0.163 | 0.008 | 0.008 | 0.282 | 0.073 | 0.076 | 0.287 | 0.073 | 0.075 |
| 2246 | earth.travel | 0.020 | 0.000 | 0.002 | 0.171 | 0.008 | 0.008 | 0.208 | 0.074 | 0.075 | 0.213 | 0.073 | 0.074 |
| 2247 | earth.travel | 0.022 | 0.002 | 0.002 | 0.179 | 0.008 | 0.009 | 0.140 | 0.067 | 0.067 | 0.147 | 0.067 | 0.066 |
| 2248 | earth.travel | 0.024 | 0.003 | 0.003 | 0.188 | 0.009 | 0.009 | 0.084 | 0.056 | 0.055 | 0.091 | 0.056 | 0.055 |
| 2249 | earth.travel | 0.027 | 0.002 | 0.002 | 0.196 | 0.009 | 0.009 | 0.041 | 0.043 | 0.042 | 0.048 | 0.043 | 0.042 |
| 2250 hold | mars.hold | 0.028 | 0.002 | 0.002 | 0.205 | 0.009 | 0.009 | 0.016 | 0.025 | 0.022 | 0.024 | 0.024 | 0.022 |
| 2251 | mars.hold | 0.029 | 0.000 | 0.000 | 0.214 | 0.009 | 0.009 | 0.013 | 0.003 | 0.001 | 0.022 | 0.003 | 0.000 |
| 2252 | mars.hold | 0.029 | 0.000 | 0.000 | 0.222 | 0.008 | 0.008 | 0.013 | 0.000 | 0.000 | 0.022 | 0.000 | 0.000 |
| 2253 | mars.hold | 0.029 | 0.000 | 0.000 | 0.230 | 0.008 | 0.008 | 0.013 | 0.000 | 0.000 | 0.022 | 0.000 | 0.000 |
| 2254 | mars.hold | 0.029 | 0.000 | 0.000 | 0.238 | 0.008 | 0.008 | 0.013 | 0.000 | 0.000 | 0.023 | 0.000 | 0.000 |
| 2255 | mars.hold | 0.029 | 0.000 | 0.000 | 0.246 | 0.008 | 0.008 | 0.013 | 0.000 | 0.000 | 0.023 | 0.000 | 0.000 |
| 2256 | mars.hold | 0.029 | 0.000 | 0.000 | 0.253 | 0.007 | 0.007 | 0.013 | 0.000 | 0.000 | 0.023 | 0.000 | 0.000 |
| 2257 | mars.hold | 0.029 | 0.000 | 0.000 | 0.260 | 0.007 | 0.007 | 0.013 | 0.000 | 0.000 | 0.023 | 0.000 | 0.000 |
| 2258 | mars.hold | 0.029 | 0.000 | 0.000 | 0.267 | 0.006 | 0.006 | 0.013 | 0.000 | 0.000 | 0.024 | 0.000 | 0.000 |
| 2259 | mars.hold | 0.029 | 0.000 | 0.000 | 0.272 | 0.006 | 0.006 | 0.013 | 0.000 | 0.000 | 0.024 | 0.000 | 0.000 |
| 2260 | mars.hold | 0.029 | 0.000 | 0.000 | 0.278 | 0.005 | 0.005 | 0.013 | 0.000 | 0.000 | 0.024 | 0.000 | 0.000 |
| 2261 | mars.hold | 0.029 | 0.000 | 0.000 | 0.283 | 0.005 | 0.005 | 0.013 | 0.000 | 0.000 | 0.024 | 0.000 | 0.000 |
