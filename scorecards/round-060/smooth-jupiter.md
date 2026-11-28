# smooth: jupiter

Commit 262b9a68df0a6bda8d77518539580de554bb0dc5. Capture rate 2. Parts: path, pictures, place, parity, counts.

Joined from the files of 1 machine(s), nothing is rendered, measured or counted here. The path: /home/user/workspace/work/p6/hj9/05/jupiter (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The pictures: the dive /home/user/workspace/work/p6/hj9/01/jupiter-dive-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hj9/02/jupiter-dive-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz); the rise /home/user/workspace/work/p6/hj9/03/jupiter-rise-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hj9/04/jupiter-rise-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The place: /home/user/workspace/work/p6/hj9/05/jupiter (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The parity: /home/user/workspace/work/p6/hj9/05/jupiter (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The counts: /home/user/workspace/work/p6/hj9/06/jupiter (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

VERDICT: red. 2 numbers over the limit or not measured.

VERDICT BESIDE IT, the pictures read with the carry at the full size (the verdict above is the one that counts and makes the exit code): red. 4 numbers over the limit or not measured.

GROUND POP BESIDE IT, a number without a limit that makes no verdict (1.3 is named as the limit to come), read with the carry at the full size on the ground both frames show: largest 1.309 from frame 3268 + 1/2 to the next, most at pixel 1674, 122, a patch of 304 by 332 px; 3 of 424 rows read over 1.3 (pictures of the rise). It is not the line "The ground beside it" of the pictures: that line gives the change in place and the pattern on the surface view before a rise or after a dive, this number is read on the globe's ground through the move itself. Ground pop NOT READ on 2 of 426 rows, which says nothing of them, quiet or not: frame 3071 + 1/2: the last frame of the window, no next frame to carry onto it; frame 3326 + 1/2: the last frame of the window, no next frame to carry onto it.

## path

### dive (jupiter.dive, frames 2970 to 3059, T at 3059, window 2958 to 3071)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.07527 log of the height a film frame | 1.795 | 3020 | 0.059 | 3058 |  |  | 0.006 | 0.022 | 0.000 | 0.000 | 0.000 at 3063 |
| whole frames | turn | 1.159 degrees a film frame | 1.773 | 3020 | 0.058 | 3058 |  |  | 0.007 | 0.022 | 0.000 | 0.000 | 0.000 at 2968 |
| whole frames | speed | 5.324 px a film frame at the place | 1.863 | 3010 | 0.060 over 8 | 2974 |  |  | 0.013 | 0.002 | 0.000 | 0.000 | 0.000 at 2968 |
| rate 2 | rate | 0.07486 log of the height a film frame | 1.806 | 3020 | 0.060 | 3058 | 0.030 | 3058 | 0.007 | 0.018 | 0.000 | 0.000 | 0.000 at 3062 + 1/2 |
| rate 2 | turn | 1.152 degrees a film frame | 1.785 | 3020 + 1/2 | 0.065 | 3059 | 0.036 | 3059 | 0.008 | 0.000 | 0.010 | 0.000 | 0.000 at 2968 + 1/2 |
| rate 2 | speed | 5.376 px a film frame at the place | 1.885 | 3010 | 0.062 over 8 | 3022 + 1/2 | 0.031 over 8 | 3022 + 1/2 | 0.015 | 0.001 | 0.000 | 0.000 | 0.000 at 2968 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 3060, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.00499 of its height a film frame, the mean of its first 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 0.99 at frame 3060 + 1/2, limit 0.87; inside the dive itself 1.00 at frame 3060. Largest step from one capture frame to the next 0.69 at frame 3058, shown. The part along the surface view's own direction of motion: 0.99 at the lowest, lowest 0.99 at frame 3060 + 1/2, shown; under 0 the eye goes back.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2958 | hold orbit | 3.250e+0 | 0.004 |  |  | 0.020 |  |  | 0.060 |  |  | 0 |
| 2959 | hold orbit | 3.249e+0 | 0.004 | 0.000 | 0.000 | 0.020 | 0.000 | 0.000 | 0.060 | 0.000 | 0.000 | 8 |
| 2960 | hold orbit | 3.248e+0 | 0.004 | 0.000 | 0.000 | 0.020 | 0.000 | 0.000 | 0.060 | 0.000 | 0.000 | 8 |
| 2961 | hold orbit | 3.248e+0 | 0.004 | 0.000 | 0.000 | 0.020 | 0.000 | 0.000 | 0.060 | 0.000 | 0.000 | 8 |
| 2962 | hold orbit | 3.247e+0 | 0.004 | 0.000 | 0.000 | 0.020 | 0.000 | 0.000 | 0.060 | 0.000 | 0.000 | 8 |
| 2963 | hold orbit | 3.246e+0 | 0.004 | 0.000 | 0.000 | 0.020 | 0.000 | 0.000 | 0.060 | 0.000 | 0.000 | 8 |
| 2964 | hold orbit | 3.245e+0 | 0.004 | 0.000 | 0.000 | 0.020 | 0.000 | 0.000 | 0.059 | 0.000 | 0.000 | 8 |
| 2965 | hold orbit | 3.244e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.059 | 0.000 | 0.000 | 8 |
| 2966 | hold orbit | 3.243e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.059 | 0.000 | 0.000 | 8 |
| 2967 | hold orbit | 3.242e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.058 | 0.000 | 0.000 | 8 |
| 2968 | hold orbit | 3.241e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.058 | 0.000 | 0.000 | 8 |
| 2969 | hold orbit | 3.241e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.057 | 0.000 | 0.000 | 8 |
| 2970 first | dive orbit | 3.240e+0 | 0.004 | 0.000 | 0.002 | 0.019 | 0.000 | 0.002 | 0.057 | 0.000 | 0.004 | 8 |
| 2971 | dive orbit | 3.237e+0 | 0.010 | 0.006 | 0.016 | 0.012 | 0.007 | 0.010 | 0.070 | 0.013 | 0.028 | 8 |
| 2972 | dive orbit | 3.229e+0 | 0.033 | 0.023 | 0.034 | 0.019 | 0.007 | 0.038 | 0.108 | 0.038 | 0.053 | 8 |
| 2973 | dive orbit | 3.213e+0 | 0.069 | 0.036 | 0.038 | 0.063 | 0.044 | 0.046 | 0.166 | 0.058 | 0.060 | 8 |
| 2974 | dive orbit | 3.187e+0 | 0.107 | 0.038 | 0.038 | 0.109 | 0.046 | 0.046 | 0.227 | 0.060 | 0.060 | 8 |
| 2975 | dive orbit | 3.152e+0 | 0.145 | 0.038 | 0.038 | 0.155 | 0.046 | 0.046 | 0.287 | 0.060 | 0.060 | 8 |
| 2976 | dive orbit | 3.109e+0 | 0.183 | 0.038 | 0.038 | 0.201 | 0.046 | 0.046 | 0.347 | 0.060 | 0.059 | 8 |
| 2977 | dive orbit | 3.058e+0 | 0.222 | 0.038 | 0.039 | 0.247 | 0.046 | 0.046 | 0.406 | 0.059 | 0.059 | 8 |
| 2978 | dive orbit | 2.998e+0 | 0.260 | 0.039 | 0.039 | 0.293 | 0.046 | 0.046 | 0.464 | 0.058 | 0.058 | 8 |
| 2979 | dive orbit | 2.932e+0 | 0.299 | 0.039 | 0.039 | 0.338 | 0.045 | 0.046 | 0.521 | 0.057 | 0.057 | 8 |
| 2980 | dive orbit | 2.858e+0 | 0.338 | 0.039 | 0.039 | 0.383 | 0.045 | 0.045 | 0.578 | 0.056 | 0.056 | 8 |
| 2981 | dive orbit | 2.778e+0 | 0.377 | 0.039 | 0.040 | 0.428 | 0.045 | 0.045 | 0.633 | 0.055 | 0.055 | 8 |
| 2982 | dive orbit | 2.692e+0 | 0.417 | 0.040 | 0.040 | 0.473 | 0.045 | 0.045 | 0.688 | 0.055 | 0.054 | 8 |
| 2983 | dive orbit | 2.601e+0 | 0.457 | 0.040 | 0.040 | 0.517 | 0.044 | 0.044 | 0.741 | 0.054 | 0.053 | 8 |
| 2984 | dive orbit | 2.506e+0 | 0.497 | 0.040 | 0.041 | 0.561 | 0.044 | 0.044 | 0.794 | 0.053 | 0.053 | 8 |
| 2985 | dive orbit | 2.406e+0 | 0.538 | 0.041 | 0.041 | 0.605 | 0.044 | 0.044 | 0.846 | 0.052 | 0.052 | 8 |
| 2986 | dive orbit | 2.304e+0 | 0.579 | 0.041 | 0.041 | 0.648 | 0.043 | 0.044 | 0.897 | 0.051 | 0.051 | 8 |
| 2987 | dive orbit | 2.199e+0 | 0.620 | 0.041 | 0.042 | 0.691 | 0.043 | 0.043 | 0.947 | 0.050 | 0.051 | 8 |
| 2988 | dive orbit | 2.092e+0 | 0.662 | 0.042 | 0.042 | 0.734 | 0.043 | 0.043 | 0.997 | 0.050 | 0.050 | 8 |
| 2989 | dive orbit | 1.984e+0 | 0.704 | 0.042 | 0.043 | 0.776 | 0.042 | 0.043 | 1.046 | 0.049 | 0.049 | 8 |
| 2990 | dive orbit | 1.876e+0 | 0.746 | 0.043 | 0.043 | 0.818 | 0.042 | 0.042 | 1.095 | 0.048 | 0.049 | 8 |
| 2991 | dive orbit | 1.767e+0 | 0.789 | 0.043 | 0.043 | 0.860 | 0.042 | 0.042 | 1.142 | 0.048 | 0.048 | 8 |
| 2992 | dive orbit | 1.660e+0 | 0.833 | 0.043 | 0.044 | 0.901 | 0.042 | 0.042 | 1.190 | 0.047 | 0.048 | 8 |
| 2993 | dive orbit | 1.554e+0 | 0.877 | 0.044 | 0.044 | 0.943 | 0.041 | 0.042 | 1.236 | 0.047 | 0.047 | 8 |
| 2994 | dive orbit | 1.450e+0 | 0.921 | 0.044 | 0.045 | 0.984 | 0.041 | 0.042 | 1.282 | 0.046 | 0.047 | 8 |
| 2995 | dive orbit | 1.348e+0 | 0.966 | 0.045 | 0.045 | 1.025 | 0.041 | 0.041 | 1.327 | 0.045 | 0.046 | 8 |
| 2996 | dive orbit | 1.250e+0 | 1.011 | 0.045 | 0.046 | 1.067 | 0.041 | 0.041 | 1.372 | 0.045 | 0.046 | 8 |
| 2997 | dive orbit | 1.154e+0 | 1.056 | 0.046 | 0.046 | 1.108 | 0.041 | 0.041 | 1.416 | 0.044 | 0.045 | 8 |
| 2998 | dive orbit | 1.062e+0 | 1.102 | 0.046 | 0.047 | 1.149 | 0.041 | 0.042 | 1.460 | 0.043 | 0.045 | 8 |
| 2999 | dive orbit | 9.742e-1 | 1.149 | 0.047 | 0.047 | 1.190 | 0.041 | 0.042 | 1.502 | 0.042 | 0.044 | 8 |
| 3000 | dive orbit | 8.903e-1 | 1.196 | 0.047 | 0.048 | 1.232 | 0.042 | 0.042 | 1.544 | 0.042 | 0.043 | 8 |
| 3001 | dive orbit | 8.108e-1 | 1.244 | 0.048 | 0.048 | 1.274 | 0.042 | 0.042 | 1.584 | 0.041 | 0.042 | 8 |
| 3002 | dive orbit | 7.356e-1 | 1.292 | 0.048 | 0.049 | 1.316 | 0.042 | 0.043 | 1.623 | 0.039 | 0.041 | 8 |
| 3003 | dive orbit | 6.650e-1 | 1.341 | 0.049 | 0.049 | 1.359 | 0.043 | 0.043 | 1.661 | 0.038 | 0.039 | 8 |
| 3004 | dive orbit | 5.990e-1 | 1.390 | 0.049 | 0.050 | 1.402 | 0.043 | 0.044 | 1.698 | 0.037 | 0.038 | 8 |
| 3005 | dive orbit | 5.375e-1 | 1.440 | 0.050 | 0.050 | 1.446 | 0.044 | 0.045 | 1.733 | 0.035 | 0.036 | 8 |
| 3006 | dive orbit | 4.804e-1 | 1.490 | 0.050 | 0.051 | 1.491 | 0.045 | 0.046 | 1.767 | 0.033 | 0.035 | 8 |
| 3007 | dive orbit | 4.278e-1 | 1.541 | 0.051 | 0.052 | 1.537 | 0.046 | 0.047 | 1.798 | 0.032 | 0.033 | 8 |
| 3008 | dive orbit | 3.795e-1 | 1.593 | 0.052 | 0.052 | 1.584 | 0.047 | 0.048 | 1.828 | 0.030 | 0.031 | 8 |
| 3009 | dive orbit | 3.353e-1 | 1.644 | 0.051 | 0.051 | 1.630 | 0.046 | 0.046 | 1.854 | 0.026 | 0.027 | 8 |
| 3010 | dive orbit | 2.955e-1 | 1.680 | 0.037 | 0.034 | 1.663 | 0.033 | 0.030 | 1.863 | 0.009 | 0.006 | 8 |
| 3011 | dive orbit | 2.601e-1 | 1.697 | 0.017 | 0.015 | 1.676 | 0.014 | 0.011 | 1.849 | 0.013 | 0.021 | 8 |
| 3012 | dive orbit | 2.287e-1 | 1.707 | 0.010 | 0.010 | 1.684 | 0.008 | 0.008 | 1.829 | 0.021 | 0.021 | 8 |
| 3013 | dive orbit | 2.010e-1 | 1.718 | 0.010 | 0.010 | 1.693 | 0.009 | 0.009 | 1.808 | 0.021 | 0.022 | 8 |
| 3014 | dive orbit | 1.764e-1 | 1.728 | 0.010 | 0.011 | 1.702 | 0.009 | 0.010 | 1.786 | 0.021 | 0.022 | 8 |
| 3015 | dive orbit | 1.548e-1 | 1.739 | 0.011 | 0.011 | 1.712 | 0.010 | 0.011 | 1.765 | 0.021 | 0.022 | 8 |
| 3016 | dive orbit | 1.357e-1 | 1.750 | 0.011 | 0.011 | 1.723 | 0.011 | 0.012 | 1.743 | 0.022 | 0.022 | 8 |
| 3017 | dive orbit | 1.188e-1 | 1.761 | 0.011 | 0.011 | 1.735 | 0.012 | 0.012 | 1.721 | 0.022 | 0.022 | 8 |
| 3018 | dive orbit | 1.040e-1 | 1.773 | 0.011 | 0.012 | 1.748 | 0.012 | 0.013 | 1.700 | 0.022 | 0.022 | 8 |
| 3019 | dive orbit | 9.093e-2 | 1.784 | 0.012 | 0.012 | 1.761 | 0.013 | 0.014 | 1.678 | 0.022 | 0.022 | 8 |
| 3020 | dive orbit | 7.944e-2 | 1.795 | 0.011 | 0.011 | 1.773 | 0.012 | 0.012 | 1.654 | 0.023 | 0.031 | 8 |
| 3021 | dive orbit | 6.943e-2 | 1.790 | 0.005 | 0.019 | 1.770 | 0.003 | 0.017 | 1.617 | 0.037 | 0.050 | 8 |
| 3022 | dive orbit | 6.079e-2 | 1.764 | 0.026 | 0.034 | 1.746 | 0.024 | 0.032 | 1.563 | 0.055 | 0.062 | 8 |
| 3023 | dive orbit | 5.337e-2 | 1.730 | 0.034 | 0.035 | 1.714 | 0.032 | 0.033 | 1.502 | 0.060 | 0.062 | 8 |
| 3024 | dive orbit | 4.698e-2 | 1.695 | 0.035 | 0.035 | 1.681 | 0.033 | 0.034 | 1.443 | 0.059 | 0.060 | 8 |
| 3025 | dive orbit | 4.146e-2 | 1.660 | 0.035 | 0.036 | 1.647 | 0.034 | 0.034 | 1.386 | 0.058 | 0.059 | 8 |
| 3026 | dive orbit | 3.669e-2 | 1.624 | 0.036 | 0.036 | 1.613 | 0.034 | 0.035 | 1.329 | 0.057 | 0.058 | 8 |
| 3027 | dive orbit | 3.256e-2 | 1.588 | 0.036 | 0.037 | 1.578 | 0.035 | 0.036 | 1.273 | 0.056 | 0.057 | 8 |
| 3028 | dive orbit | 2.897e-2 | 1.551 | 0.037 | 0.037 | 1.542 | 0.036 | 0.037 | 1.219 | 0.054 | 0.055 | 8 |
| 3029 | dive orbit | 2.585e-2 | 1.514 | 0.037 | 0.038 | 1.505 | 0.037 | 0.038 | 1.166 | 0.053 | 0.054 | 8 |
| 3030 | dive orbit | 2.313e-2 | 1.476 | 0.038 | 0.038 | 1.467 | 0.038 | 0.039 | 1.113 | 0.052 | 0.053 | 8 |
| 3031 | dive orbit | 2.076e-2 | 1.438 | 0.038 | 0.039 | 1.428 | 0.039 | 0.039 | 1.062 | 0.051 | 0.052 | 8 |
| 3032 | dive orbit | 1.869e-2 | 1.399 | 0.039 | 0.039 | 1.389 | 0.040 | 0.040 | 1.012 | 0.050 | 0.051 | 8 |
| 3033 | dive orbit | 1.687e-2 | 1.360 | 0.039 | 0.040 | 1.348 | 0.040 | 0.041 | 0.963 | 0.049 | 0.050 | 8 |
| 3034 | dive orbit | 1.527e-2 | 1.320 | 0.040 | 0.040 | 1.307 | 0.041 | 0.042 | 0.915 | 0.048 | 0.048 | 8 |
| 3035 | dive orbit | 1.387e-2 | 1.280 | 0.040 | 0.041 | 1.265 | 0.042 | 0.043 | 0.869 | 0.047 | 0.047 | 8 |
| 3036 | dive orbit | 1.264e-2 | 1.239 | 0.041 | 0.042 | 1.222 | 0.043 | 0.044 | 0.823 | 0.046 | 0.046 | 8 |
| 3037 | dive orbit | 1.155e-2 | 1.197 | 0.042 | 0.042 | 1.178 | 0.044 | 0.045 | 0.779 | 0.044 | 0.045 | 8 |
| 3038 | dive orbit | 1.059e-2 | 1.154 | 0.042 | 0.043 | 1.133 | 0.045 | 0.046 | 0.736 | 0.043 | 0.043 | 8 |
| 3039 | dive orbit | 9.737e-3 | 1.111 | 0.043 | 0.044 | 1.087 | 0.046 | 0.047 | 0.694 | 0.042 | 0.042 | 8 |
| 3040 | dive orbit | 8.985e-3 | 1.067 | 0.044 | 0.045 | 1.041 | 0.047 | 0.047 | 0.653 | 0.041 | 0.041 | 8 |
| 3041 | dive orbit | 8.319e-3 | 1.023 | 0.045 | 0.045 | 0.993 | 0.047 | 0.048 | 0.614 | 0.039 | 0.039 | 8 |
| 3042 | dive orbit | 7.729e-3 | 0.977 | 0.046 | 0.046 | 0.945 | 0.048 | 0.049 | 0.576 | 0.038 | 0.038 | 8 |
| 3043 | dive orbit | 7.206e-3 | 0.931 | 0.046 | 0.047 | 0.896 | 0.049 | 0.050 | 0.540 | 0.036 | 0.037 | 8 |
| 3044 | dive orbit | 6.743e-3 | 0.884 | 0.047 | 0.048 | 0.846 | 0.050 | 0.051 | 0.505 | 0.035 | 0.035 | 8 |
| 3045 | dive orbit | 6.332e-3 | 0.835 | 0.048 | 0.049 | 0.795 | 0.051 | 0.052 | 0.471 | 0.033 | 0.034 | 8 |
| 3046 | dive orbit | 5.968e-3 | 0.786 | 0.049 | 0.050 | 0.744 | 0.052 | 0.052 | 0.439 | 0.032 | 0.032 | 8 |
| 3047 | dive orbit | 5.646e-3 | 0.736 | 0.050 | 0.051 | 0.691 | 0.052 | 0.053 | 0.409 | 0.030 | 0.030 | 8 |
| 3048 | dive orbit | 5.362e-3 | 0.685 | 0.051 | 0.052 | 0.638 | 0.053 | 0.054 | 0.381 | 0.028 | 0.028 | 8 |
| 3049 | dive orbit | 5.113e-3 | 0.633 | 0.052 | 0.053 | 0.585 | 0.054 | 0.055 | 0.354 | 0.027 | 0.027 | 8 |
| 3050 | dive orbit | 4.894e-3 | 0.580 | 0.053 | 0.054 | 0.530 | 0.054 | 0.055 | 0.329 | 0.026 | 0.026 | 8 |
| 3051 | dive orbit | 4.704e-3 | 0.526 | 0.054 | 0.055 | 0.475 | 0.055 | 0.056 | 0.304 | 0.025 | 0.025 | 8 |
| 3052 | dive orbit | 4.540e-3 | 0.471 | 0.055 | 0.056 | 0.419 | 0.056 | 0.056 | 0.280 | 0.024 | 0.024 | 8 |
| 3053 | dive orbit | 4.400e-3 | 0.416 | 0.056 | 0.057 | 0.363 | 0.056 | 0.057 | 0.257 | 0.023 | 0.023 | 8 |
| 3054 | dive orbit | 4.283e-3 | 0.359 | 0.057 | 0.057 | 0.306 | 0.057 | 0.058 | 0.235 | 0.022 | 0.022 | 8 |
| 3055 | dive orbit | 4.187e-3 | 0.302 | 0.057 | 0.058 | 0.249 | 0.057 | 0.058 | 0.214 | 0.021 | 0.020 | 8 |
| 3056 | dive orbit | 4.111e-3 | 0.244 | 0.058 | 0.059 | 0.191 | 0.058 | 0.059 | 0.196 | 0.019 | 0.018 | 8 |
| 3057 | dive orbit | 4.054e-3 | 0.185 | 0.059 | 0.059 | 0.133 | 0.058 | 0.059 | 0.180 | 0.016 | 0.015 | 8 |
| 3058 | dive orbit | 4.016e-3 | 0.126 | 0.059 | 0.060 | 0.075 | 0.058 | 0.060 | 0.167 | 0.012 | 0.012 | 8 |
| 3059 last | dive terrain | 3.993e-3 | 0.076 | 0.050 | 0.048 | 0.022 | 0.052 | 0.065 | 0.161 | 0.007 | 0.006 | 8 |
| 3060 | terrain terrain | 3.977e-3 | 0.054 | 0.022 | 0.018 | 0.000 | 0.022 | 0.000 | 0.159 | 0.002 | 0.001 | 8 |
| 3061 | terrain terrain | 3.961e-3 | 0.052 | 0.002 | 0.000 | 0.000 | 0.000 | 0.000 | 0.159 | 0.000 | 0.000 | 8 |
| 3062 | terrain terrain | 3.945e-3 | 0.052 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.159 | 0.000 | 0.000 | 8 |
| 3063 | terrain terrain | 3.930e-3 | 0.053 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.159 | 0.000 | 0.000 | 8 |
| 3064 | terrain terrain | 3.914e-3 | 0.053 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.159 | 0.000 | 0.000 | 8 |
| 3065 | terrain terrain | 3.899e-3 | 0.053 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.159 | 0.000 | 0.000 | 8 |
| 3066 | terrain terrain | 3.883e-3 | 0.053 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.159 | 0.000 | 0.000 | 8 |
| 3067 | terrain terrain | 3.868e-3 | 0.053 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.159 | 0.000 | 0.000 | 8 |
| 3068 | terrain terrain | 3.852e-3 | 0.053 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.159 | 0.000 | 0.000 | 8 |
| 3069 | terrain terrain | 3.837e-3 | 0.054 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.158 | 0.000 | 0.000 | 8 |
| 3070 | terrain terrain | 3.821e-3 | 0.054 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.158 | 0.000 | 0.000 | 8 |
| 3071 | terrain terrain | 3.806e-3 | 0.054 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.158 | 0.000 | 0.000 | 8 |

### rise (jupiter.rise, frames 3240 to 3314, T at 3240, window 3228 to 3326)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.09738 log of the height a film frame | 1.891 | 3275 | 0.077 | 3248 |  |  | 0.011 | 0.024 | 0.000 | 0.000 | 0.008 at 3324 |
| whole frames | turn | 1.969 degrees a film frame | 1.965 | 3282 | 0.078 | 3305 |  |  | 0.005 | 0.006 | 0.000 | 0.000 | 0.000 at 3326 |
| whole frames | speed | 7.646 px a film frame at the place | 1.989 | 3276 | 0.074 over 8 | 3273 |  |  | 0.001 | 0.036 | 0.000 | 0.000 | 1.015 at 3326 |
| rate 2 | rate | 0.09674 log of the height a film frame | 1.907 | 3274 + 1/2 | 0.077 | 3248 | 0.039 | 3248 | 0.013 | 0.020 | 0.000 | 0.000 | 0.008 at 3323 + 1/2 |
| rate 2 | turn | 1.955 degrees a film frame | 1.983 | 3281 + 1/2 | 0.078 | 3305 | 0.039 | 3305 | 0.000 | 0.005 | 0.000 | 0.000 | 0.000 at 3326 + 1/2 |
| rate 2 | speed | 7.409 px a film frame at the place | 1.977 | 3276 | 0.071 over 8 | 3273 | 0.036 over 8 | 3273 | 0.001 | 0.038 | 0.000 over 6 | 0.001 over 6 | 1.068 at 3326 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 5, rate 2 5.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 3240, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.00997 of its height a film frame, the mean of its last 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 0.95 at frame 3224, limit 0.87; inside the rise itself 1.03 at frame 3240 + 1/2. Largest step from one capture frame to the next 0.51 at frame 3247, shown. The part along the surface view's own direction of motion: 0.91 at the lowest, lowest 0.91 at frame 3224, shown; under 0 the eye goes back.

Rest between the rise and the travel (the seam into jupiter.travel at film frame 3315, 12 film frames to each side, read at rate 2): a rise and the travel after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body's edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest 2.07 at frame 3317, against 15.95 at frame 3303 and 43.27 at frame 3326 + 1/2 at the ends of the window. The lowest is 0.130 of the slower end, limit 0.07. Near 0 the picture comes to rest between the rise and the travel.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3228 | terrain terrain | 3.249e-3 | 0.034 |  |  | 0.000 |  |  | 0.076 |  |  | 0 |
| 3229 | terrain terrain | 3.260e-3 | 0.034 | 0.001 | 0.001 | 0.000 | 0.000 | 0.000 | 0.068 | 0.008 | 0.008 | 8 |
| 3230 | terrain terrain | 3.271e-3 | 0.035 | 0.001 | 0.001 | 0.000 | 0.000 | 0.000 | 0.061 | 0.007 | 0.007 | 8 |
| 3231 | terrain terrain | 3.283e-3 | 0.035 | 0.001 | 0.001 | 0.000 | 0.000 | 0.000 | 0.056 | 0.005 | 0.005 | 8 |
| 3232 | terrain terrain | 3.294e-3 | 0.036 | 0.001 | 0.001 | 0.000 | 0.000 | 0.000 | 0.053 | 0.003 | 0.003 | 8 |
| 3233 | terrain terrain | 3.306e-3 | 0.036 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.050 | 0.002 | 0.002 | 8 |
| 3234 | terrain terrain | 3.318e-3 | 0.037 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.049 | 0.002 | 0.002 | 8 |
| 3235 | terrain terrain | 3.330e-3 | 0.037 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.048 | 0.001 | 0.001 | 8 |
| 3236 | terrain terrain | 3.342e-3 | 0.038 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.047 | 0.001 | 0.001 | 8 |
| 3237 | terrain terrain | 3.354e-3 | 0.038 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.047 | 0.000 | 0.000 | 8 |
| 3238 | terrain terrain | 3.367e-3 | 0.038 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.047 | 0.000 | 0.000 | 8 |
| 3239 | terrain terrain | 3.380e-3 | 0.039 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.047 | 0.000 | 0.000 | 8 |
| 3240 first | rise terrain | 3.393e-3 | 0.039 | 0.000 | 0.003 | 0.000 | 0.000 | 0.000 | 0.047 | 0.000 | 0.000 | 8 |
| 3241 | rise orbit | 3.409e-3 | 0.049 | 0.011 | 0.029 | 0.005 | 0.005 | 0.025 | 0.048 | 0.001 | 0.004 | 8 |
| 3242 | rise orbit | 3.439e-3 | 0.091 | 0.042 | 0.061 | 0.045 | 0.040 | 0.055 | 0.056 | 0.008 | 0.020 | 8 |
| 3243 | rise orbit | 3.492e-3 | 0.157 | 0.066 | 0.071 | 0.102 | 0.057 | 0.061 | 0.081 | 0.025 | 0.031 | 8 |
| 3244 | rise orbit | 3.571e-3 | 0.229 | 0.072 | 0.074 | 0.162 | 0.060 | 0.060 | 0.113 | 0.032 | 0.035 | 8 |
| 3245 | rise orbit | 3.678e-3 | 0.303 | 0.074 | 0.076 | 0.222 | 0.060 | 0.060 | 0.148 | 0.035 | 0.037 | 8 |
| 3246 | rise orbit | 3.816e-3 | 0.379 | 0.075 | 0.077 | 0.281 | 0.059 | 0.060 | 0.185 | 0.036 | 0.038 | 8 |
| 3247 | rise orbit | 3.989e-3 | 0.455 | 0.076 | 0.077 | 0.340 | 0.059 | 0.059 | 0.222 | 0.038 | 0.039 | 8 |
| 3248 | rise orbit | 4.201e-3 | 0.532 | 0.077 | 0.077 | 0.399 | 0.059 | 0.059 | 0.261 | 0.039 | 0.040 | 8 |
| 3249 | rise orbit | 4.457e-3 | 0.608 | 0.077 | 0.077 | 0.457 | 0.058 | 0.059 | 0.301 | 0.040 | 0.042 | 8 |
| 3250 | rise orbit | 4.764e-3 | 0.684 | 0.076 | 0.077 | 0.514 | 0.058 | 0.058 | 0.344 | 0.042 | 0.044 | 8 |
| 3251 | rise orbit | 5.130e-3 | 0.760 | 0.076 | 0.076 | 0.572 | 0.057 | 0.057 | 0.388 | 0.044 | 0.046 | 8 |
| 3252 | rise orbit | 5.566e-3 | 0.836 | 0.075 | 0.076 | 0.628 | 0.057 | 0.057 | 0.435 | 0.047 | 0.049 | 8 |
| 3253 | rise orbit | 6.082e-3 | 0.911 | 0.075 | 0.076 | 0.684 | 0.056 | 0.056 | 0.485 | 0.050 | 0.053 | 8 |
| 3254 | rise orbit | 6.694e-3 | 0.986 | 0.075 | 0.075 | 0.739 | 0.055 | 0.055 | 0.540 | 0.055 | 0.058 | 8 |
| 3255 | rise orbit | 7.422e-3 | 1.060 | 0.074 | 0.074 | 0.794 | 0.054 | 0.055 | 0.599 | 0.060 | 0.062 | 8 |
| 3256 | rise orbit | 8.286e-3 | 1.130 | 0.070 | 0.070 | 0.847 | 0.054 | 0.054 | 0.662 | 0.063 | 0.064 | 8 |
| 3257 | rise orbit | 9.310e-3 | 1.197 | 0.066 | 0.066 | 0.900 | 0.053 | 0.053 | 0.727 | 0.065 | 0.066 | 8 |
| 3258 | rise orbit | 1.052e-2 | 1.259 | 0.063 | 0.062 | 0.952 | 0.052 | 0.052 | 0.793 | 0.066 | 0.067 | 8 |
| 3259 | rise orbit | 1.196e-2 | 1.318 | 0.059 | 0.059 | 1.003 | 0.051 | 0.051 | 0.860 | 0.067 | 0.067 | 8 |
| 3260 | rise orbit | 1.368e-2 | 1.374 | 0.056 | 0.056 | 1.053 | 0.050 | 0.050 | 0.927 | 0.067 | 0.067 | 8 |
| 3261 | rise orbit | 1.572e-2 | 1.426 | 0.052 | 0.052 | 1.102 | 0.049 | 0.049 | 0.995 | 0.068 | 0.068 | 8 |
| 3262 | rise orbit | 1.814e-2 | 1.476 | 0.050 | 0.050 | 1.150 | 0.048 | 0.048 | 1.063 | 0.068 | 0.068 | 8 |
| 3263 | rise orbit | 2.104e-2 | 1.523 | 0.047 | 0.047 | 1.197 | 0.047 | 0.047 | 1.132 | 0.069 | 0.068 | 8 |
| 3264 | rise orbit | 2.451e-2 | 1.567 | 0.044 | 0.044 | 1.243 | 0.046 | 0.046 | 1.201 | 0.069 | 0.069 | 8 |
| 3265 | rise orbit | 2.867e-2 | 1.609 | 0.042 | 0.042 | 1.289 | 0.045 | 0.046 | 1.271 | 0.070 | 0.069 | 8 |
| 3266 | rise orbit | 3.366e-2 | 1.648 | 0.039 | 0.039 | 1.333 | 0.045 | 0.045 | 1.341 | 0.070 | 0.069 | 8 |
| 3267 | rise orbit | 3.966e-2 | 1.685 | 0.037 | 0.037 | 1.377 | 0.044 | 0.044 | 1.412 | 0.071 | 0.070 | 8 |
| 3268 | rise orbit | 4.690e-2 | 1.720 | 0.035 | 0.035 | 1.420 | 0.043 | 0.043 | 1.483 | 0.071 | 0.070 | 8 |
| 3269 | rise orbit | 5.563e-2 | 1.753 | 0.033 | 0.033 | 1.463 | 0.043 | 0.043 | 1.555 | 0.072 | 0.070 | 8 |
| 3270 | rise orbit | 6.618e-2 | 1.784 | 0.031 | 0.031 | 1.505 | 0.042 | 0.042 | 1.627 | 0.072 | 0.071 | 8 |
| 3271 | rise orbit | 7.896e-2 | 1.813 | 0.029 | 0.029 | 1.547 | 0.042 | 0.042 | 1.700 | 0.073 | 0.071 | 8 |
| 3272 | rise orbit | 9.445e-2 | 1.840 | 0.027 | 0.027 | 1.588 | 0.042 | 0.042 | 1.774 | 0.073 | 0.071 | 8 |
| 3273 | rise orbit | 1.133e-1 | 1.864 | 0.025 | 0.024 | 1.630 | 0.042 | 0.042 | 1.847 | 0.074 | 0.071 | 8 |
| 3274 | rise orbit | 1.361e-1 | 1.886 | 0.022 | 0.022 | 1.672 | 0.042 | 0.043 | 1.921 | 0.073 | 0.071 | 8 |
| 3275 | rise orbit | 1.636e-1 | 1.891 | 0.005 | 0.018 | 1.715 | 0.042 | 0.043 | 1.975 | 0.055 | 0.049 | 8 |
| 3276 | rise orbit | 1.961e-1 | 1.861 | 0.030 | 0.045 | 1.758 | 0.043 | 0.044 | 1.989 | 0.014 | 0.008 | 8 |
| 3277 | rise orbit | 2.340e-1 | 1.814 | 0.047 | 0.049 | 1.802 | 0.044 | 0.045 | 1.984 | 0.005 | 0.007 | 8 |
| 3278 | rise orbit | 2.779e-1 | 1.765 | 0.050 | 0.052 | 1.847 | 0.045 | 0.047 | 1.976 | 0.008 | 0.009 | 8 |
| 3279 | rise orbit | 3.283e-1 | 1.712 | 0.052 | 0.055 | 1.894 | 0.047 | 0.048 | 1.965 | 0.011 | 0.013 | 8 |
| 3280 | rise orbit | 3.857e-1 | 1.656 | 0.056 | 0.059 | 1.939 | 0.044 | 0.044 | 1.949 | 0.016 | 0.020 | 8 |
| 3281 | rise orbit | 4.506e-1 | 1.595 | 0.061 | 0.064 | 1.964 | 0.026 | 0.023 | 1.924 | 0.025 | 0.030 | 8 |
| 3282 | rise orbit | 5.230e-1 | 1.531 | 0.064 | 0.065 | 1.965 | 0.001 | 0.021 | 1.889 | 0.035 | 0.039 | 8 |
| 3283 | rise orbit | 6.034e-1 | 1.468 | 0.063 | 0.064 | 1.929 | 0.036 | 0.057 | 1.845 | 0.044 | 0.047 | 8 |
| 3284 | rise orbit | 6.920e-1 | 1.407 | 0.060 | 0.060 | 1.869 | 0.061 | 0.063 | 1.794 | 0.052 | 0.054 | 8 |
| 3285 | rise orbit | 7.891e-1 | 1.349 | 0.059 | 0.059 | 1.806 | 0.062 | 0.063 | 1.736 | 0.058 | 0.060 | 8 |
| 3286 | rise orbit | 8.949e-1 | 1.291 | 0.057 | 0.058 | 1.744 | 0.062 | 0.063 | 1.672 | 0.063 | 0.064 | 8 |
| 3287 | rise orbit | 1.009e+0 | 1.235 | 0.056 | 0.057 | 1.682 | 0.062 | 0.063 | 1.605 | 0.067 | 0.067 | 8 |
| 3288 | rise orbit | 1.132e+0 | 1.179 | 0.056 | 0.056 | 1.620 | 0.063 | 0.063 | 1.535 | 0.070 | 0.069 | 8 |
| 3289 | rise orbit | 1.263e+0 | 1.125 | 0.055 | 0.055 | 1.556 | 0.063 | 0.064 | 1.464 | 0.071 | 0.070 | 8 |
| 3290 | rise orbit | 1.402e+0 | 1.071 | 0.054 | 0.054 | 1.492 | 0.064 | 0.065 | 1.392 | 0.072 | 0.071 | 8 |
| 3291 | rise orbit | 1.548e+0 | 1.017 | 0.053 | 0.054 | 1.427 | 0.065 | 0.066 | 1.320 | 0.072 | 0.071 | 8 |
| 3292 | rise orbit | 1.700e+0 | 0.965 | 0.053 | 0.053 | 1.361 | 0.066 | 0.067 | 1.248 | 0.071 | 0.070 | 8 |
| 3293 | rise orbit | 1.858e+0 | 0.913 | 0.052 | 0.052 | 1.294 | 0.067 | 0.068 | 1.178 | 0.070 | 0.069 | 8 |
| 3294 | rise orbit | 2.021e+0 | 0.862 | 0.051 | 0.051 | 1.226 | 0.068 | 0.070 | 1.110 | 0.069 | 0.068 | 8 |
| 3295 | rise orbit | 2.187e+0 | 0.811 | 0.050 | 0.051 | 1.156 | 0.069 | 0.071 | 1.043 | 0.067 | 0.066 | 8 |
| 3296 | rise orbit | 2.355e+0 | 0.762 | 0.050 | 0.050 | 1.086 | 0.071 | 0.072 | 0.978 | 0.065 | 0.065 | 8 |
| 3297 | rise orbit | 2.525e+0 | 0.713 | 0.049 | 0.049 | 1.014 | 0.072 | 0.073 | 0.915 | 0.063 | 0.063 | 8 |
| 3298 | rise orbit | 2.694e+0 | 0.665 | 0.048 | 0.048 | 0.941 | 0.073 | 0.074 | 0.853 | 0.061 | 0.061 | 8 |
| 3299 | rise orbit | 2.861e+0 | 0.618 | 0.047 | 0.048 | 0.868 | 0.074 | 0.075 | 0.794 | 0.059 | 0.059 | 8 |
| 3300 | rise orbit | 3.025e+0 | 0.572 | 0.046 | 0.046 | 0.793 | 0.075 | 0.076 | 0.740 | 0.055 | 0.054 | 8 |
| 3301 | rise orbit | 3.185e+0 | 0.530 | 0.042 | 0.042 | 0.717 | 0.075 | 0.076 | 0.699 | 0.041 | 0.044 | 8 |
| 3302 | rise orbit | 3.341e+0 | 0.492 | 0.038 | 0.038 | 0.641 | 0.076 | 0.077 | 0.584 | 0.038 | 0.037 | 8 |
| 3303 | rise orbit | 3.493e+0 | 0.457 | 0.035 | 0.035 | 0.564 | 0.077 | 0.078 | 0.563 | 0.020 | 0.019 | 7 |
| 3304 | rise orbit | 3.641e+0 | 0.425 | 0.032 | 0.031 | 0.487 | 0.077 | 0.078 | 0.503 | 0.009 | 0.006 | 7 |
| 3305 | rise orbit | 3.784e+0 | 0.396 | 0.029 | 0.028 | 0.409 | 0.078 | 0.078 | 0.503 | 0.000 | 0.001 | 6 |
| 3306 | rise orbit | 3.922e+0 | 0.369 | 0.028 | 0.029 | 0.334 | 0.075 | 0.075 | 0.499 | 0.004 | 0.010 | 6 |
| 3307 | rise orbit | 4.054e+0 | 0.339 | 0.030 | 0.032 | 0.267 | 0.068 | 0.067 | 0.484 | 0.015 | 0.022 | 6 |
| 3308 | rise orbit | 4.177e+0 | 0.306 | 0.033 | 0.035 | 0.207 | 0.060 | 0.060 | 0.461 | 0.024 | 0.025 | 6 |
| 3309 | rise orbit | 4.288e+0 | 0.270 | 0.037 | 0.039 | 0.154 | 0.052 | 0.052 | 0.438 | 0.023 | 0.023 | 6 |
| 3310 | rise orbit | 4.385e+0 | 0.229 | 0.041 | 0.044 | 0.109 | 0.045 | 0.044 | 0.418 | 0.020 | 0.020 | 6 |
| 3311 | rise orbit | 4.464e+0 | 0.184 | 0.045 | 0.048 | 0.073 | 0.037 | 0.036 | 0.376 | 0.008 | 0.008 | 6 |
| 3312 | rise orbit | 4.523e+0 | 0.135 | 0.049 | 0.053 | 0.043 | 0.029 | 0.028 | 0.370 | 0.006 | 0.006 | 5 |
| 3313 | rise orbit | 4.559e+0 | 0.081 | 0.054 | 0.056 | 0.022 | 0.021 | 0.020 | 0.366 | 0.004 | 0.004 | 5 |
| 3314 last | rise orbit | 4.571e+0 | 0.029 | 0.052 | 0.051 | 0.009 | 0.013 | 0.013 | 0.361 | 0.005 | 0.013 | 5 |
| 3315 | travel orbit | 4.574e+0 | 0.005 | 0.024 | 0.020 | 0.003 | 0.006 | 0.005 | 0.341 | 0.021 | 0.034 | 5 |
| 3316 | travel orbit | 4.575e+0 | 0.003 | 0.002 | 0.000 | 0.003 | 0.001 | 0.000 | 0.305 | 0.036 | 0.038 | 5 |
| 3317 | travel orbit | 4.576e+0 | 0.003 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.282 | 0.023 | 0.021 | 5 |
| 3318 | travel orbit | 4.577e+0 | 0.003 | 0.000 | 0.001 | 0.002 | 0.000 | 0.000 | 0.315 | 0.033 | 0.097 * | 5 |
| 3319 | travel orbit | 4.578e+0 | 0.001 | 0.002 | 0.003 | 0.002 | 0.000 | 0.000 | 0.458 | 0.143 * | 0.242 * | 5 |
| 3320 | travel orbit | 4.577e+0 | -0.002 | 0.003 | 0.004 | 0.002 | 0.000 | 0.000 | 0.741 | 0.298 * | 0.421 * | 5 |
| 3321 | travel orbit | 4.574e+0 | -0.007 | 0.005 | 0.006 | 0.002 | 0.000 | 0.000 | 1.209 | 0.468 * | 0.598 * | 6 |
| 3322 | travel orbit | 4.567e+0 | -0.014 | 0.007 | 0.007 | 0.002 | 0.000 | 0.000 | 1.853 | 0.644 * | 0.767 * | 6 |
| 3323 | travel orbit | 4.558e+0 | -0.022 | 0.008 | 0.008 | 0.002 | 0.000 | 0.000 | 2.649 | 0.796 * | 0.900 * | 6 |
| 3324 | travel orbit | 4.545e+0 | -0.029 | 0.008 | 0.008 | 0.002 | 0.000 | 0.000 | 3.556 | 0.908 * | 0.987 * | 6 |
| 3325 | travel orbit | 4.529e+0 | -0.036 | 0.007 | 0.007 | 0.002 | 0.000 | 0.000 | 4.532 | 0.976 * | 1.035 * | 6 |
| 3326 | travel orbit | 4.510e+0 | -0.042 | 0.005 | 0.005 | 0.002 | 0.000 | 0.000 | 5.547 | 1.015 * | 1.068 * | 6 |

## pictures

Tier draft, rate 2, 10.97 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

The dive is joined from 2 parts: /home/user/workspace/work/p6/hj9/01/jupiter-dive-p1of2 (capture frames 5916 to 6029, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hj9/02/jupiter-dive-p2of2 (capture frames 6030 to 6143, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

The rise is joined from 2 parts: /home/user/workspace/work/p6/hj9/03/jupiter-rise-p1of2 (capture frames 6456 to 6554, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hj9/04/jupiter-rise-p2of2 (capture frames 6555 to 6653, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

### dive (jupiter.dive, frames 2970 to 3059, window 2958 to 3071, 228 draft frames at rate 2)

Largest level step: 0.31 at frame 3027 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.09 from frame 2972 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 3.75 from frame 3042 to the next, block column 9 row 8 from the top left, shown, not judged.
Largest change in place: 113.7 from frame 3037 to 8 film frames later, most at pixel 1516, 448 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.84 from frame 3019 + 1/2 to 8 film frames later, most at pixel 1600, 288, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 3060 to 3071 + 1/2): change 2.5, pattern 0.03.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 2972 + 1/2 in /home/user/workspace/work/p6/hj9/01/jupiter-dive-p1of2-pops.png, frame 3037 + 1/2 in /home/user/workspace/work/p6/hj9/02/jupiter-dive-p2of2-pops.png, frame 3038 in /home/user/workspace/work/p6/hj9/02/jupiter-dive-p2of2-pops.png, frame 3039 + 1/2 in /home/user/workspace/work/p6/hj9/02/jupiter-dive-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 2996 in no panel (a slice --frames 5992-5992 draws it), frame 3019 + 1/2 in /home/user/workspace/work/p6/hj9/02/jupiter-dive-p2of2-changes.png, frame 3034 in /home/user/workspace/work/p6/hj9/02/jupiter-dive-p2of2-changes.png, frame 3042 in /home/user/workspace/work/p6/hj9/02/jupiter-dive-p2of2-changes.png.

- RED the pattern of the picture changes in place by 0.84 from frame 3019 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (38 frames over it, first 3017)

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2958 | 59.44 |  | 0.3 | 0.59 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 0,6 | 1.8 | 2.0 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2958 + 1/2 | 59.44 | 0.00 | 0.3 | 0.59 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 1,0 | 1.8 | 2.2 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2959 | 59.45 | 0.00 | 0.3 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 4,6 | 1.8 | 2.2 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2959 + 1/2 | 59.45 | 0.00 | 0.3 | 0.60 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 11,0 | 1.8 | 2.2 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2960 | 59.46 | 0.00 | 0.3 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 14,8 | 1.8 | 2.2 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2960 + 1/2 | 59.46 | 0.00 | 0.3 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 2,2 | 1.8 | 2.2 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2961 | 59.47 | 0.00 | 0.3 | 0.60 | 0.59 | 1.01 | 1.01 | 1.01 | 0.000 | 1.16 | 15,1 | 1.8 | 2.2 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2961 + 1/2 | 59.48 | 0.00 | 0.3 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 0,8 | 1.8 | 2.3 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2962 | 59.48 | 0.00 | 0.3 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 1,0 | 1.8 | 2.4 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2962 + 1/2 | 59.49 | 0.00 | 0.3 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 1,0 | 1.8 | 2.3 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2963 | 59.49 | 0.00 | 0.3 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 3,8 | 1.9 | 2.4 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2963 + 1/2 | 59.50 | 0.00 | 0.3 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 2,0 | 1.9 | 2.3 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2964 | 59.50 | 0.00 | 0.3 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 4,7 | 1.9 | 2.3 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2964 + 1/2 | 59.51 | 0.00 | 0.3 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 14,1 | 2.0 | 2.3 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2965 | 59.51 | 0.00 | 0.3 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 14,1 | 2.1 | 2.3 | 0.32 | 0.00 | 0.32 | 8.0 |
| 2965 + 1/2 | 59.52 | 0.00 | 0.3 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 2,6 | 2.1 | 2.5 | 0.32 | 0.01 | 0.32 | 8.0 |
| 2966 | 59.52 | 0.00 | 0.3 | 0.59 | 0.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 0,8 | 2.3 | 2.5 | 0.32 | 0.01 | 0.32 | 8.0 |
| 2966 + 1/2 | 59.53 | 0.00 | 0.3 | 0.59 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 15,6 | 2.4 | 2.7 | 0.32 | 0.01 | 0.32 | 8.0 |
| 2967 | 59.53 | 0.00 | 0.3 | 0.58 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 5,8 | 2.6 | 2.7 | 0.32 | 0.01 | 0.32 | 8.1 |
| 2967 + 1/2 | 59.54 | 0.00 | 0.3 | 0.58 | 0.59 | 0.98 | 0.98 | 0.98 | 0.000 | 1.05 | 9,8 | 2.7 | 3.4 | 0.32 | 0.02 | 0.32 | 8.1 |
| 2968 | 59.55 | 0.00 | 0.3 | 0.58 | 0.59 | 0.98 | 0.98 | 0.98 | 0.000 | 1.09 | 1,4 | 2.9 | 4.1 | 0.32 | 0.03 | 0.32 | 8.1 |
| 2968 + 1/2 | 59.55 | 0.00 | 0.3 | 0.58 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 11,2 | 3.1 | 4.9 | 0.32 | 0.04 | 0.32 | 8.1 |
| 2969 | 59.56 | 0.00 | 0.3 | 0.59 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 3,0 | 3.3 | 5.6 | 0.32 | 0.05 | 0.32 | 8.1 |
| 2969 + 1/2 | 59.57 | 0.00 | 0.3 | 0.58 | 0.59 | 0.98 | 0.98 | 0.98 | 0.000 | 1.06 | 13,4 | 3.7 | 6.5 | 0.32 | 0.06 | 0.32 | 8.2 |
| 2970 first | 59.57 | 0.00 | 0.3 | 0.56 | 0.59 | 0.95 | 0.95 | 0.95 | 0.000 | 1.05 | 10,4 | 4.2 | 7.4 | 0.32 | 0.07 | 0.32 | 8.2 |
| 2970 + 1/2 | 59.58 | 0.00 | 0.2 | 0.49 | 0.59 | 0.82 | 0.82 | 0.82 | 0.000 | 1.01 | 10,6 | 4.7 | 8.2 | 0.32 | 0.08 | 0.32 | 8.2 |
| 2971 | 59.60 | 0.01 | 0.2 | 0.49 | 0.68 | 0.73 | 0.73 | 0.73 | 0.000 | 1.07 | 5,6 | 5.2 | 9.0 | 0.32 | 0.09 | 0.32 | 8.2 |
| 2971 + 1/2 | 59.63 | 0.01 | 0.5 | 0.76 | 0.83 | 0.92 | 0.92 | 0.92 | 0.000 | 1.43 | 13,4 | 5.7 | 9.5 | 0.33 | 0.10 | 0.32 | 8.2 |
| 2972 | 59.69 | 0.02 | 0.8 | 1.06 | 0.99 | 1.07 | 1.07 | 1.07 | 0.000 | 2.10 | 13,5 | 6.1 | 10.0 | 0.33 | 0.11 | 0.32 | 8.2 |
| 2972 + 1/2 | 59.79 | 0.02 | 1.2 | 1.24 | 1.14 | 1.09 | 1.09 | 1.09 | 0.000 | 2.42 | 13,4 | 6.4 | 10.0 | 0.33 | 0.11 | 0.32 | 8.3 |
| 2973 | 59.91 | 0.02 | 1.6 | 1.32 | 1.23 | 1.07 | 1.07 | 1.07 | 0.000 | 2.46 | 11,2 | 6.8 | 10.0 | 0.33 | 0.11 | 0.32 | 8.3 |
| 2973 + 1/2 | 60.07 | 0.02 | 2.1 | 1.28 | 1.25 | 1.02 | 1.02 | 1.02 | 0.000 | 2.59 | 11,2 | 6.5 | 10.1 | 0.33 | 0.08 | 0.32 | 8.6 |
| 2974 | 60.27 | 0.02 | 2.4 | 1.22 | 1.30 | 0.94 | 0.94 | 0.94 | 0.000 | 2.45 | 11,2 | 6.7 | 9.8 | 0.33 | 0.08 | 0.32 | 8.7 |
| 2974 + 1/2 | 60.50 | 0.02 | 2.7 | 1.25 | 1.33 | 0.94 | 0.94 | 0.94 | 0.000 | 2.76 | 11,2 | 6.8 | 10.3 | 0.33 | 0.13 | 0.05 | 8.0 |
| 2975 | 60.76 | 0.02 | 3.2 | 1.34 | 1.35 | 1.00 | 1.00 | 1.00 | 0.000 | 2.45 | 11,2 | 6.9 | 10.2 | 0.33 | 0.08 | 0.33 | 8.8 |
| 2975 + 1/2 | 61.07 | 0.02 | 3.5 | 1.43 | 1.36 | 1.05 | 1.05 | 1.05 | 0.003 | 2.73 | 11,2 | 6.8 | 10.7 | 0.33 | 0.07 | 0.33 | 8.9 |
| 2976 | 61.41 | 0.02 | 3.8 | 1.43 | 1.38 | 1.04 | 1.05 | 1.04 | 0.002 | 2.46 | 11,2 | 6.6 | 11.0 | 0.33 | 0.07 | 0.33 | 8.9 |
| 2976 + 1/2 | 61.79 | 0.02 | 4.2 | 1.41 | 1.40 | 1.01 | 1.03 | 1.01 | 0.001 | 2.58 | 11,2 | 6.3 | 11.7 | 0.33 | 0.07 | 0.33 | 9.0 |
| 2977 | 62.21 | 0.01 | 4.5 | 1.39 | 1.42 | 0.98 | 0.99 | 0.98 | 0.004 | 1.95 | 11,2 | 6.2 | 12.0 | 0.34 | 0.06 | 0.33 | 9.0 |
| 2977 + 1/2 | 62.65 | 0.02 | 4.6 | 1.37 | 1.43 | 0.96 | 0.96 | 0.96 | 0.007 | 2.08 | 12,4 | 6.2 | 12.5 | 0.34 | 0.06 | 0.34 | 9.1 |
| 2978 | 63.13 | 0.02 | 5.1 | 1.42 | 1.43 | 0.99 | 0.97 | 0.97 | 0.010 | 2.45 | 12,4 | 6.2 | 12.8 | 0.34 | 0.06 | 0.34 | 9.2 |
| 2978 + 1/2 | 63.64 | 0.05 | 5.2 | 1.42 | 1.44 | 0.98 | 0.97 | 0.97 | 0.012 | 1.55 | 15,8 | 6.2 | 12.9 | 0.34 | 0.05 | 0.34 | 9.4 |
| 2979 | 64.25 | 0.04 | 5.4 | 1.45 | 1.45 | 1.00 | 1.01 | 1.00 | 0.007 | 1.63 | 15,8 | 6.4 | 13.6 | 0.35 | 0.05 | 0.34 | 9.5 |
| 2979 + 1/2 | 64.96 | 0.04 | 5.8 | 1.49 | 1.46 | 1.02 | 1.03 | 1.02 | 0.014 | 1.49 | 9,5 | 6.7 | 14.4 | 0.35 | 0.05 | 0.34 | 8.0 |
| 2980 | 65.74 | 0.03 | 5.9 | 1.51 | 1.47 | 1.03 | 1.02 | 1.02 | 0.024 | 1.52 | 9,5 | 7.1 | 15.4 | 0.35 | 0.05 | 0.35 | 9.0 |
| 2980 + 1/2 | 66.58 | 0.04 | 6.1 | 1.52 | 1.48 | 1.03 | 1.02 | 1.02 | 0.022 | 1.54 | 13,8 | 7.4 | 16.0 | 0.35 | 0.05 | 0.35 | 9.0 |
| 2981 | 67.51 | 0.03 | 6.4 | 1.52 | 1.49 | 1.02 | 1.01 | 1.01 | 0.021 | 1.79 | 12,5 | 7.9 | 16.6 | 0.35 | 0.05 | 0.35 | 9.0 |
| 2981 + 1/2 | 68.50 | 0.02 | 6.6 | 1.50 | 1.50 | 1.00 | 1.00 | 1.00 | 0.021 | 1.87 | 12,5 | 8.2 | 16.8 | 0.35 | 0.06 | 0.35 | 9.0 |
| 2982 | 69.54 | 0.02 | 6.8 | 1.51 | 1.50 | 1.00 | 0.99 | 0.99 | 0.029 | 1.74 | 12,2 | 8.6 | 17.9 | 0.36 | 0.06 | 0.35 | 9.0 |
| 2982 + 1/2 | 70.62 | 0.04 | 7.0 | 1.51 | 1.50 | 1.01 | 1.00 | 1.00 | 0.022 | 1.66 | 5,0 | 9.0 | 17.5 | 0.36 | 0.06 | 0.35 | 8.9 |
| 2983 | 71.78 | 0.04 | 7.2 | 1.54 | 1.50 | 1.02 | 1.02 | 1.02 | 0.022 | 1.86 | 8,1 | 9.6 | 18.1 | 0.36 | 0.06 | 0.36 | 9.0 |
| 2983 + 1/2 | 73.03 | 0.04 | 7.5 | 1.51 | 1.51 | 1.00 | 1.02 | 1.00 | 0.015 | 1.86 | 15,7 | 10.1 | 18.6 | 0.36 | 0.06 | 0.36 | 9.0 |
| 2984 | 74.35 | 0.04 | 7.7 | 1.51 | 1.51 | 1.00 | 1.00 | 1.00 | 0.017 | 2.16 | 15,7 | 10.5 | 18.8 | 0.36 | 0.07 | 0.36 | 8.9 |
| 2984 + 1/2 | 75.75 | 0.04 | 7.9 | 1.47 | 1.51 | 0.97 | 0.98 | 0.97 | 0.016 | 2.02 | 15,7 | 11.1 | 19.1 | 0.37 | 0.07 | 0.36 | 8.8 |
| 2985 | 77.22 | 0.03 | 8.2 | 1.47 | 1.51 | 0.97 | 0.98 | 0.97 | 0.021 | 1.87 | 15,7 | 11.9 | 20.2 | 0.36 | 0.07 | 0.36 | 8.8 |
| 2985 + 1/2 | 78.75 | 0.03 | 8.4 | 1.50 | 1.51 | 0.99 | 1.01 | 0.99 | 0.012 | 2.02 | 13,4 | 12.8 | 20.6 | 0.37 | 0.08 | 0.36 | 8.7 |
| 2986 | 80.35 | 0.04 | 8.8 | 1.51 | 1.52 | 0.99 | 1.01 | 0.99 | 0.012 | 1.95 | 13,5 | 14.3 | 21.3 | 0.37 | 0.08 | 0.37 | 8.6 |
| 2986 + 1/2 | 82.03 | 0.05 | 9.1 | 1.48 | 1.52 | 0.98 | 1.00 | 0.98 | 0.009 | 1.84 | 2,5 | 15.8 | 21.8 | 0.37 | 0.08 | 0.37 | 8.5 |
| 2987 | 83.82 | 0.06 | 9.5 | 1.50 | 1.52 | 0.99 | 1.00 | 0.99 | 0.017 | 1.90 | 2,3 | 16.8 | 21.9 | 0.37 | 0.09 | 0.37 | 8.4 |
| 2987 + 1/2 | 85.72 | 0.06 | 9.9 | 1.52 | 1.52 | 1.00 | 1.01 | 1.00 | 0.016 | 2.37 | 2,3 | 17.7 | 22.8 | 0.37 | 0.08 | 0.37 | 8.1 |
| 2988 | 87.74 | 0.06 | 10.4 | 1.52 | 1.52 | 1.00 | 1.01 | 1.00 | 0.018 | 2.57 | 2,3 | 18.5 | 26.5 | 0.37 | 0.08 | 0.37 | 8.0 |
| 2988 + 1/2 | 89.88 | 0.05 | 10.8 | 1.53 | 1.52 | 1.00 | 1.01 | 1.00 | 0.019 | 2.52 | 2,3 | 20.3 | 30.6 | 0.38 | 0.09 | 0.37 | 8.0 |
| 2989 | 92.13 | 0.06 | 11.3 | 1.53 | 1.53 | 1.00 | 0.99 | 0.99 | 0.039 | 2.55 | 2,3 | 22.4 | 32.3 | 0.38 | 0.10 | 0.38 | 8.0 |
| 2989 + 1/2 | 94.49 | 0.05 | 11.8 | 1.54 | 1.53 | 1.01 | 0.99 | 0.99 | 0.045 | 2.78 | 2,2 | 24.2 | 36.0 | 0.38 | 0.11 | 0.38 | 8.0 |
| 2990 | 96.96 | 0.06 | 12.3 | 1.53 | 1.53 | 1.00 | 0.97 | 0.97 | 0.055 | 2.52 | 1,4 | 26.5 | 39.0 | 0.38 | 0.08 | 0.38 | 8.0 |
| 2990 + 1/2 | 99.55 | 0.07 | 12.7 | 1.51 | 1.54 | 0.98 | 0.96 | 0.96 | 0.074 | 2.11 | 2,1 | 28.2 | 41.8 | 0.39 | 0.05 | 0.38 | 8.0 |
| 2991 | 102.28 | 0.07 | 13.3 | 1.52 | 1.54 | 0.98 | 0.95 | 0.95 | 0.073 | 1.93 | 2,1 | 27.8 | 41.0 | 0.39 | 0.04 | 0.38 | 9.4 |
| 2991 + 1/2 | 105.15 | 0.04 | 14.1 | 1.54 | 1.57 | 0.98 | 0.94 | 0.94 | 0.087 | 1.90 | 13,7 | 29.7 | 44.5 | 0.39 | 0.05 | 0.85 | 8.0 |
| 2992 | 108.12 | 0.04 | 14.1 | 1.59 | 1.58 | 1.00 | 0.95 | 0.95 | 0.115 | 2.22 | 0,2 | 30.6 | 48.0 | 0.39 | 0.05 | 0.39 | 9.3 |
| 2992 + 1/2 | 111.15 | 0.03 | 14.7 | 1.63 | 1.62 | 1.00 | 0.96 | 0.96 | 0.096 | 2.24 | 15,1 | 34.2 | 54.8 | 0.39 | 0.08 | 0.39 | 9.0 |
| 2993 | 114.24 | 0.05 | 15.1 | 1.65 | 1.66 | 1.00 | 1.03 | 1.00 | 0.073 | 2.54 | 0,2 | 38.7 | 63.7 | 0.39 | 0.09 | 0.38 | 8.6 |
| 2993 + 1/2 | 117.42 | 0.06 | 15.9 | 1.69 | 1.69 | 1.00 | 0.97 | 0.97 | 0.102 | 2.15 | 15,1 | 44.4 | 71.9 | 0.39 | 0.11 | 0.38 | 8.5 |
| 2994 | 120.71 | 0.07 | 16.0 | 1.72 | 1.75 | 0.98 | 0.99 | 0.98 | 0.055 | 1.91 | 12,6 | 48.8 | 74.0 | 0.38 | 0.11 | 0.38 | 8.7 |
| 2994 + 1/2 | 124.15 | 0.12 | 16.7 | 1.81 | 1.80 | 1.01 | 1.02 | 1.01 | 0.051 | 2.20 | 2,8 | 52.6 | 77.8 | 0.38 | 0.13 | 0.37 | 9.1 |
| 2995 | 127.83 | 0.09 | 17.5 | 1.89 | 1.91 | 0.99 | 0.99 | 0.99 | 0.050 | 2.43 | 2,8 | 57.0 | 67.4 | 0.37 | 0.16 | 0.37 | 9.6 |
| 2995 + 1/2 | 131.71 | 0.05 | 18.1 | 2.01 | 1.97 | 1.02 | 1.01 | 1.01 | 0.072 | 2.32 | 2,8 | 60.7 | 73.7 | 0.37 | 0.17 | 0.37 | 8.0 |
| 2996 | 135.68 | 0.02 | 18.8 | 2.06 | 2.08 | 0.99 | 0.99 | 0.99 | 0.084 | 2.65 | 2,8 | 62.4 | 78.6 | 0.36 | 0.21 | 0.36 | 10.9 |
| 2996 + 1/2 | 139.68 | 0.08 | 19.4 | 2.16 | 2.15 | 1.01 | 1.00 | 1.00 | 0.070 | 1.65 | 9,1 | 53.0 | 70.3 | 0.35 | 0.22 | 0.35 | 11.1 |
| 2997 | 143.83 | 0.09 | 19.9 | 2.24 | 2.28 | 0.98 | 0.99 | 0.98 | 0.051 | 1.80 | 0,4 | 51.5 | 79.3 | 0.35 | 0.23 | 0.95 | 8.0 |
| 2997 + 1/2 | 148.18 | 0.03 | 20.0 | 2.40 | 2.38 | 1.01 | 1.02 | 1.01 | 0.055 | 2.72 | 0,4 | 46.0 | 88.0 | 0.34 | 0.21 | 0.34 | 15.7 |
| 2998 | 152.59 | 0.06 | 20.1 | 2.52 | 2.51 | 1.00 | 0.99 | 0.99 | 0.074 | 1.90 | 6,2 | 47.3 | 81.5 | 0.34 | 0.21 | 0.33 | 15.7 |
| 2998 + 1/2 | 156.87 | 0.30 | 19.4 | 2.62 | 2.58 | 1.02 | 1.01 | 1.01 | 0.073 | 2.11 | 6,0 | 50.8 | 56.7 | 0.33 | 0.18 | 0.33 | 15.8 |
| 2999 | 160.56 | 0.18 | 19.0 | 2.64 | 2.65 | 1.00 | 0.99 | 0.99 | 0.068 | 1.95 | 7,0 | 54.6 | 63.7 | 0.33 | 0.17 | 0.32 | 15.8 |
| 2999 + 1/2 | 163.90 | 0.13 | 19.5 | 2.68 | 2.69 | 1.00 | 1.00 | 1.00 | 0.051 | 1.83 | 8,0 | 60.8 | 71.9 | 0.32 | 0.16 | 0.32 | 8.0 |
| 3000 | 166.97 | 0.14 | 19.7 | 2.73 | 2.71 | 1.01 | 1.01 | 1.01 | 0.032 | 2.13 | 0,0 | 52.0 | 79.5 | 0.31 | 0.16 | 0.31 | 8.0 |
| 3000 + 1/2 | 169.78 | 0.28 | 20.2 | 2.75 | 2.76 | 1.00 | 1.00 | 1.00 | 0.027 | 2.11 | 12,7 | 56.2 | 86.0 | 0.31 | 0.18 | 0.31 | 8.0 |
| 3001 | 172.01 | 0.17 | 20.5 | 2.79 | 2.80 | 0.99 | 1.00 | 0.99 | 0.015 | 2.27 | 12,7 | 45.2 | 61.5 | 0.30 | 0.12 | 0.30 | 8.0 |
| 3001 + 1/2 | 173.91 | 0.01 | 21.0 | 2.85 | 2.82 | 1.01 | 1.01 | 1.01 | 0.016 | 2.04 | 12,7 | 42.1 | 57.5 | 0.30 | 0.08 | 0.29 | 8.0 |
| 3002 | 175.82 | 0.13 | 21.4 | 2.86 | 2.86 | 1.00 | 1.01 | 1.00 | 0.011 | 1.90 | 10,0 | 40.5 | 54.5 | 0.29 | 0.07 | 0.29 | 8.0 |
| 3002 + 1/2 | 177.47 | 0.19 | 21.8 | 2.89 | 2.86 | 1.01 | 1.02 | 1.01 | 0.001 | 1.94 | 13,8 | 39.8 | 52.3 | 0.29 | 0.06 | 0.29 | 8.0 |
| 3003 | 178.75 | 0.17 | 22.2 | 2.88 | 2.87 | 1.00 | 1.01 | 1.00 | 0.005 | 1.79 | 6,0 | 41.6 | 54.4 | 0.29 | 0.07 | 0.28 | 8.0 |
| 3003 + 1/2 | 179.68 | 0.18 | 22.5 | 2.88 | 2.87 | 1.00 | 1.01 | 1.00 | 0.007 | 1.74 | 6,0 | 40.6 | 56.1 | 0.28 | 0.09 | 0.28 | 8.0 |
| 3004 | 180.26 | 0.07 | 22.9 | 2.87 | 2.87 | 1.00 | 1.00 | 1.00 | 0.010 | 1.69 | 6,0 | 41.0 | 60.4 | 0.28 | 0.11 | 0.28 | 8.0 |
| 3004 + 1/2 | 180.69 | 0.09 | 23.3 | 2.90 | 2.87 | 1.01 | 1.01 | 1.01 | 0.009 | 1.72 | 14,5 | 41.5 | 51.6 | 0.28 | 0.09 | 0.28 | 8.0 |
| 3005 | 180.94 | 0.09 | 23.6 | 2.91 | 2.87 | 1.01 | 1.02 | 1.01 | 0.006 | 1.78 | 14,5 | 39.9 | 51.7 | 0.28 | 0.09 | 0.28 | 8.0 |
| 3005 + 1/2 | 181.00 | 0.07 | 24.0 | 2.92 | 2.87 | 1.01 | 1.02 | 1.01 | 0.006 | 1.75 | 15,1 | 40.8 | 48.0 | 0.28 | 0.11 | 0.28 | 8.0 |
| 3006 | 180.92 | 0.05 | 24.2 | 2.94 | 2.87 | 1.02 | 1.03 | 1.02 | 0.007 | 1.77 | 4,2 | 41.1 | 49.1 | 0.28 | 0.13 | 0.28 | 8.0 |
| 3006 + 1/2 | 180.74 | 0.04 | 24.6 | 2.95 | 2.87 | 1.03 | 1.03 | 1.03 | 0.006 | 1.70 | 4,2 | 41.4 | 49.9 | 0.29 | 0.22 | 0.28 | 8.0 |
| 3007 | 180.48 | 0.05 | 24.9 | 2.92 | 2.87 | 1.02 | 1.03 | 1.02 | 0.003 | 1.83 | 4,2 | 38.4 | 49.8 | 0.28 | 0.28 | 0.28 | 8.0 |
| 3007 + 1/2 | 180.11 | 0.06 | 25.3 | 2.95 | 2.87 | 1.03 | 1.03 | 1.03 | 0.005 | 1.95 | 0,2 | 36.5 | 39.6 | 0.28 | 0.11 | 0.28 | 8.0 |
| 3008 | 179.63 | 0.03 | 25.6 | 2.93 | 2.87 | 1.02 | 1.03 | 1.02 | 0.003 | 2.00 | 0,2 | 34.5 | 39.7 | 0.28 | 0.07 | 0.28 | 8.0 |
| 3008 + 1/2 | 179.10 | 0.04 | 26.0 | 2.94 | 2.87 | 1.02 | 1.02 | 1.02 | 0.007 | 1.68 | 0,4 | 35.1 | 41.4 | 0.29 | 0.08 | 0.28 | 8.0 |
| 3009 | 178.66 | 0.04 | 26.2 | 2.92 | 2.87 | 1.02 | 1.02 | 1.02 | 0.008 | 1.82 | 0,1 | 35.2 | 41.4 | 0.29 | 0.11 | 0.29 | 8.0 |
| 3009 + 1/2 | 178.29 | 0.01 | 26.3 | 2.93 | 2.87 | 1.02 | 1.02 | 1.02 | 0.009 | 1.82 | 3,1 | 34.9 | 41.5 | 0.29 | 0.13 | 0.29 | 8.0 |
| 3010 | 177.91 | 0.03 | 26.3 | 2.90 | 2.87 | 1.01 | 1.01 | 1.01 | 0.009 | 1.92 | 3,1 | 34.2 | 37.7 | 0.30 | 0.12 | 0.29 | 8.0 |
| 3010 + 1/2 | 177.60 | 0.04 | 26.2 | 2.87 | 2.88 | 1.00 | 1.00 | 1.00 | 0.009 | 1.83 | 3,0 | 34.8 | 41.0 | 0.30 | 0.14 | 0.29 | 8.0 |
| 3011 | 177.21 | 0.03 | 26.1 | 2.88 | 2.87 | 1.00 | 1.00 | 1.00 | 0.012 | 2.11 | 2,0 | 35.4 | 41.5 | 0.30 | 0.15 | 0.30 | 8.0 |
| 3011 + 1/2 | 176.77 | 0.02 | 26.1 | 2.87 | 2.85 | 1.01 | 1.01 | 1.01 | 0.012 | 2.31 | 2,0 | 35.9 | 41.1 | 0.30 | 0.16 | 0.30 | 8.0 |
| 3012 | 176.27 | 0.08 | 26.3 | 2.84 | 2.80 | 1.01 | 0.99 | 0.99 | 0.015 | 1.69 | 1,0 | 37.6 | 42.2 | 0.30 | 0.18 | 0.30 | 8.0 |
| 3012 + 1/2 | 175.94 | 0.27 | 26.0 | 2.74 | 2.76 | 0.99 | 1.00 | 0.99 | 0.011 | 1.67 | 1,1 | 40.0 | 45.2 | 0.31 | 0.16 | 0.30 | 8.0 |
| 3013 | 175.05 | 0.02 | 25.8 | 2.65 | 2.71 | 0.98 | 0.98 | 0.98 | 0.008 | 1.61 | 2,3 | 42.7 | 50.6 | 0.31 | 0.17 | 0.31 | 8.0 |
| 3013 + 1/2 | 174.22 | 0.25 | 25.8 | 2.68 | 2.65 | 1.01 | 1.01 | 1.01 | 0.007 | 1.86 | 0,5 | 45.2 | 57.3 | 0.31 | 0.17 | 0.31 | 8.0 |
| 3014 | 173.89 | 0.10 | 25.6 | 2.64 | 2.63 | 1.00 | 1.01 | 1.00 | 0.007 | 1.55 | 8,6 | 49.0 | 60.6 | 0.32 | 0.17 | 0.31 | 8.0 |
| 3014 + 1/2 | 173.36 | 0.06 | 25.5 | 2.61 | 2.62 | 1.00 | 1.00 | 1.00 | 0.015 | 1.95 | 0,4 | 53.2 | 64.9 | 0.32 | 0.14 | 0.31 | 8.0 |
| 3015 | 172.72 | 0.01 | 25.3 | 2.60 | 2.59 | 1.01 | 1.00 | 1.00 | 0.018 | 1.99 | 0,3 | 56.8 | 69.3 | 0.32 | 0.19 | 0.32 | 8.0 |
| 3015 + 1/2 | 172.05 | 0.03 | 25.3 | 2.57 | 2.58 | 0.99 | 0.99 | 0.99 | 0.021 | 1.89 | 0,3 | 59.4 | 71.9 | 0.32 | 0.25 | 0.32 | 8.0 |
| 3016 | 171.45 | 0.06 | 25.3 | 2.54 | 2.56 | 0.99 | 1.01 | 0.99 | 0.016 | 1.81 | 0,3 | 61.5 | 73.4 | 0.32 | 0.31 | 0.32 | 8.0 |
| 3016 + 1/2 | 170.73 | 0.04 | 25.5 | 2.55 | 2.55 | 1.00 | 1.00 | 1.00 | 0.022 | 2.75 | 0,2 | 62.2 | 70.8 | 0.32 | 0.38 | 0.32 | 8.0 |
| 3017 | 169.93 | 0.07 | 25.3 | 2.49 | 2.55 | 0.98 | 1.00 | 0.98 | 0.017 | 1.84 | 9,6 | 62.6 | 69.2 | 0.33 | 0.49 | 0.32 | 8.0 |
| 3017 + 1/2 | 169.28 | 0.02 | 25.1 | 2.54 | 2.52 | 1.01 | 1.00 | 1.00 | 0.029 | 1.81 | 9,6 | 62.7 | 66.6 | 0.33 | 0.54 | 0.33 | 8.0 |
| 3018 | 168.58 | 0.02 | 24.9 | 2.56 | 2.49 | 1.03 | 1.00 | 1.00 | 0.035 | 1.86 | 9,6 | 62.8 | 66.2 | 0.33 | 0.62 | 0.33 | 8.0 |
| 3018 + 1/2 | 167.83 | 0.05 | 25.4 | 2.45 | 2.49 | 0.98 | 1.00 | 0.98 | 0.027 | 1.78 | 8,7 | 61.4 | 68.9 | 0.33 | 0.67 | 0.32 | 8.0 |
| 3019 | 166.99 | 0.03 | 25.0 | 2.48 | 2.44 | 1.01 | 0.99 | 0.99 | 0.037 | 1.77 | 9,7 | 61.2 | 68.0 | 0.33 | 0.60 | 0.32 | 8.0 |
| 3019 + 1/2 | 166.08 | 0.10 | 25.3 | 2.42 | 2.44 | 0.99 | 1.00 | 0.99 | 0.031 | 1.78 | 9,7 | 59.9 | 66.6 | 0.33 | 0.84 | 0.32 | 8.0 |
| 3020 | 165.38 | 0.10 | 25.0 | 2.43 | 2.42 | 1.01 | 1.01 | 1.01 | 0.028 | 1.80 | 10,3 | 58.0 | 66.3 | 0.34 | 0.59 | 0.33 | 8.0 |
| 3020 + 1/2 | 164.88 | 0.01 | 25.2 | 2.42 | 2.42 | 1.00 | 1.00 | 1.00 | 0.045 | 1.85 | 10,7 | 55.8 | 65.1 | 0.34 | 0.71 | 0.33 | 8.0 |
| 3021 | 164.37 | 0.12 | 24.9 | 2.41 | 2.42 | 1.00 | 0.99 | 0.99 | 0.046 | 1.96 | 8,8 | 53.1 | 62.7 | 0.34 | 0.53 | 0.33 | 8.0 |
| 3021 + 1/2 | 164.09 | 0.14 | 24.8 | 2.37 | 2.41 | 0.98 | 1.00 | 0.98 | 0.040 | 2.46 | 9,8 | 50.7 | 59.5 | 0.34 | 0.48 | 0.34 | 8.0 |
| 3022 | 163.53 | 0.09 | 24.6 | 2.41 | 2.39 | 1.01 | 1.01 | 1.01 | 0.031 | 1.83 | 10,7 | 47.8 | 55.8 | 0.35 | 0.454 | 0.34 | 8.0 |
| 3022 + 1/2 | 162.80 | 0.11 | 24.3 | 2.36 | 2.39 | 0.99 | 1.01 | 0.99 | 0.026 | 1.91 | 11,7 | 44.5 | 51.2 | 0.35 | 0.43 | 0.35 | 8.0 |
| 3023 | 161.85 | 0.02 | 23.7 | 2.42 | 2.32 | 1.04 | 0.98 | 0.98 | 0.051 | 2.61 | 11,8 | 41.7 | 46.5 | 0.36 | 0.41 | 0.35 | 8.0 |
| 3023 + 1/2 | 160.95 | 0.01 | 23.7 | 2.28 | 2.30 | 0.99 | 1.02 | 0.99 | 0.037 | 1.72 | 12,8 | 38.3 | 43.7 | 0.36 | 0.42 | 0.36 | 8.0 |
| 3024 | 160.05 | 0.10 | 23.3 | 2.24 | 2.23 | 1.00 | 0.99 | 0.99 | 0.057 | 1.79 | 11,8 | 36.4 | 47.1 | 0.37 | 0.49 | 0.36 | 8.0 |
| 3024 + 1/2 | 158.96 | 0.15 | 22.9 | 2.17 | 2.18 | 0.99 | 1.00 | 0.99 | 0.069 | 1.93 | 3,5 | 33.7 | 45.1 | 0.37 | 0.47 | 0.36 | 8.0 |
| 3025 | 157.56 | 0.03 | 22.6 | 2.13 | 2.13 | 1.00 | 0.99 | 0.99 | 0.078 | 2.03 | 5,2 | 31.3 | 39.5 | 0.37 | 0.44 | 0.37 | 8.0 |
| 3025 + 1/2 | 156.22 | 0.09 | 22.3 | 2.10 | 2.10 | 1.00 | 1.01 | 1.00 | 0.061 | 1.86 | 5,2 | 27.6 | 37.0 | 0.38 | 0.43 | 0.37 | 8.0 |
| 3026 | 155.05 | 0.04 | 22.0 | 2.07 | 2.06 | 1.00 | 0.99 | 0.99 | 0.070 | 2.28 | 12,8 | 24.7 | 35.0 | 0.38 | 0.39 | 0.37 | 8.0 |
| 3026 + 1/2 | 153.80 | 0.15 | 21.6 | 2.02 | 2.04 | 0.99 | 0.98 | 0.98 | 0.073 | 2.30 | 2,2 | 24.9 | 32.0 | 0.38 | 0.38 | 0.37 | 8.0 |
| 3027 | 152.26 | 0.31 | 21.9 | 2.00 | 2.02 | 0.99 | 0.97 | 0.97 | 0.074 | 2.32 | 2,5 | 26.0 | 29.8 | 0.39 | 0.38 | 0.38 | 8.0 |
| 3027 + 1/2 | 150.09 | 0.10 | 21.5 | 1.99 | 2.02 | 0.98 | 0.97 | 0.97 | 0.076 | 2.26 | 1,5 | 28.9 | 34.1 | 0.39 | 0.37 | 0.38 | 8.0 |
| 3028 | 147.73 | 0.05 | 21.1 | 1.97 | 2.02 | 0.97 | 0.96 | 0.96 | 0.065 | 2.71 | 1,5 | 32.7 | 38.8 | 0.40 | 0.37 | 0.39 | 8.0 |
| 3028 + 1/2 | 145.26 | 0.08 | 21.0 | 1.96 | 2.02 | 0.97 | 0.93 | 0.93 | 0.080 | 2.39 | 1,5 | 36.5 | 43.6 | 0.40 | 0.35 | 0.39 | 8.0 |
| 3029 | 142.96 | 0.05 | 20.5 | 1.95 | 2.02 | 0.96 | 0.93 | 0.93 | 0.079 | 3.23 | 0,5 | 40.2 | 48.5 | 0.40 | 0.36 | 0.39 | 8.0 |
| 3029 + 1/2 | 140.76 | 0.12 | 20.3 | 1.94 | 2.02 | 0.96 | 0.92 | 0.92 | 0.072 | 2.57 | 0,5 | 43.5 | 52.7 | 0.41 | 0.40 | 0.40 | 8.0 |
| 3030 | 138.81 | 0.13 | 19.9 | 1.93 | 2.02 | 0.96 | 0.93 | 0.93 | 0.061 | 2.05 | 9,7 | 46.5 | 56.3 | 0.41 | 0.42 | 0.40 | 8.0 |
| 3030 + 1/2 | 137.11 | 0.06 | 19.7 | 1.94 | 2.02 | 0.96 | 0.92 | 0.92 | 0.067 | 2.06 | 0,5 | 49.6 | 59.4 | 0.41 | 0.42 | 0.40 | 8.0 |
| 3031 | 135.54 | 0.11 | 19.4 | 1.95 | 2.02 | 0.96 | 0.93 | 0.93 | 0.057 | 2.15 | 9,8 | 53.9 | 61.9 | 0.41 | 0.44 | 0.40 | 8.0 |
| 3031 + 1/2 | 133.75 | 0.04 | 19.0 | 1.94 | 2.02 | 0.96 | 0.93 | 0.93 | 0.049 | 2.68 | 9,8 | 59.1 | 65.7 | 0.41 | 0.46 | 0.40 | 8.0 |
| 3032 | 131.87 | 0.30 | 18.8 | 1.95 | 2.02 | 0.96 | 0.93 | 0.93 | 0.054 | 3.32 | 9,8 | 63.9 | 72.2 | 0.42 | 0.49 | 0.41 | 8.2 |
| 3032 + 1/2 | 129.40 | 0.17 | 18.6 | 1.98 | 2.02 | 0.98 | 0.93 | 0.93 | 0.060 | 3.29 | 9,8 | 69.1 | 79.7 | 0.42 | 0.54 | 0.41 | 8.2 |
| 3033 | 126.59 | 0.05 | 18.1 | 2.01 | 2.02 | 0.99 | 0.97 | 0.97 | 0.044 | 2.54 | 10,8 | 75.2 | 87.3 | 0.42 | 0.61 | 0.41 | 8.2 |
| 3033 + 1/2 | 123.70 | 0.06 | 17.8 | 2.00 | 2.02 | 0.99 | 0.98 | 0.98 | 0.047 | 3.51 | 10,8 | 81.9 | 95.1 | 0.42 | 0.71 | 0.41 | 8.0 |
| 3034 | 120.91 | 0.12 | 17.5 | 1.99 | 2.02 | 0.99 | 0.98 | 0.98 | 0.040 | 3.20 | 10,8 | 90.2 | 102.0 | 0.42 | 0.73 | 0.42 | 8.0 |
| 3034 + 1/2 | 118.37 | 0.12 | 17.3 | 2.01 | 2.01 | 1.00 | 1.04 | 1.00 | 0.016 | 3.43 | 10,8 | 98.2 | 110.3 | 0.42 | 0.61 | 0.42 | 8.0 |
| 3035 | 115.59 | 0.07 | 17.1 | 2.03 | 2.00 | 1.01 | 1.04 | 1.01 | 0.023 | 3.50 | 10,8 | 105.9 | 117.5 | 0.43 | 0.64 | 0.42 | 8.0 |
| 3035 + 1/2 | 112.66 | 0.08 | 16.6 | 2.05 | 2.00 | 1.02 | 1.05 | 1.02 | 0.028 | 3.32 | 10,8 | 112.3 | 125.9 | 0.43 | 0.66 | 0.42 | 8.0 |
| 3036 | 109.89 | 0.02 | 16.3 | 2.08 | 2.00 | 1.04 | 1.08 | 1.04 | 0.016 | 3.05 | 10,8 | 111.8 | 132.7 | 0.43 | 0.66 | 0.43 | 8.0 |
| 3036 + 1/2 | 107.09 | 0.03 | 16.0 | 2.11 | 2.00 | 1.05 | 1.05 | 1.05 | 0.047 | 2.64 | 11,7 | 113.1 | 138.7 | 0.43 | 0.63 | 0.43 | 8.0 |
| 3037 | 104.35 | 0.01 | 15.7 | 2.15 | 2.00 | 1.07 | 1.09 | 1.07 | 0.033 | 3.07 | 2,0 | 113.7 | 142.1 | 0.44 | 0.59 | 0.43 | 8.0 |
| 3037 + 1/2 | 101.58 | 0.00 | 15.3 | 2.17 | 2.00 | 1.08 | 1.10 | 1.08 | 0.036 | 3.46 | 2,0 | 112.0 | 145.5 | 0.44 | 0.56 | 0.43 | 8.0 |
| 3038 | 98.82 | 0.03 | 15.0 | 2.17 | 2.00 | 1.08 | 1.08 | 1.08 | 0.051 | 3.26 | 2,0 | 108.8 | 146.3 | 0.44 | 0.53 | 0.44 | 8.0 |
| 3038 + 1/2 | 96.01 | 0.00 | 14.7 | 2.16 | 2.00 | 1.08 | 1.08 | 1.08 | 0.050 | 2.85 | 2,0 | 105.6 | 143.1 | 0.45 | 0.48 | 0.44 | 8.0 |
| 3039 | 93.19 | 0.05 | 14.3 | 2.14 | 2.00 | 1.07 | 1.06 | 1.06 | 0.053 | 2.51 | 12,8 | 101.6 | 138.4 | 0.45 | 0.44 | 0.45 | 8.0 |
| 3039 + 1/2 | 90.47 | 0.10 | 14.1 | 2.16 | 2.00 | 1.08 | 1.08 | 1.08 | 0.044 | 2.78 | 9,7 | 95.8 | 131.3 | 0.46 | 0.40 | 0.45 | 8.0 |
| 3040 | 87.95 | 0.04 | 13.8 | 2.10 | 2.00 | 1.05 | 1.05 | 1.05 | 0.052 | 2.46 | 9,7 | 90.1 | 123.9 | 0.46 | 0.36 | 0.45 | 8.0 |
| 3040 + 1/2 | 85.51 | 0.06 | 13.5 | 2.09 | 2.00 | 1.04 | 1.05 | 1.04 | 0.051 | 2.40 | 13,4 | 84.1 | 116.8 | 0.46 | 0.33 | 0.46 | 8.0 |
| 3041 | 83.18 | 0.14 | 13.1 | 2.06 | 2.00 | 1.03 | 1.02 | 1.02 | 0.051 | 2.66 | 9,8 | 77.5 | 110.0 | 0.46 | 0.31 | 0.46 | 8.0 |
| 3041 + 1/2 | 81.13 | 0.13 | 12.7 | 2.06 | 1.99 | 1.03 | 1.02 | 1.02 | 0.061 | 3.51 | 9,8 | 70.6 | 103.8 | 0.47 | 0.28 | 0.46 | 8.0 |
| 3042 | 79.34 | 0.12 | 12.4 | 2.01 | 1.98 | 1.02 | 1.00 | 1.00 | 0.050 | 3.75 | 9,8 | 63.6 | 98.8 | 0.47 | 0.28 | 0.47 | 8.0 |
| 3042 + 1/2 | 77.78 | 0.07 | 12.1 | 1.98 | 1.98 | 1.00 | 0.99 | 0.99 | 0.048 | 3.47 | 9,8 | 56.8 | 94.2 | 0.48 | 0.32 | 0.43 | 8.0 |
| 3043 | 76.37 | 0.01 | 11.8 | 1.96 | 1.95 | 1.00 | 1.02 | 1.00 | 0.043 | 3.18 | 9,8 | 50.9 | 89.7 | 0.48 | 0.26 | 0.48 | 8.0 |
| 3043 + 1/2 | 74.98 | 0.09 | 11.4 | 1.92 | 1.93 | 1.00 | 0.99 | 0.99 | 0.039 | 3.05 | 9,8 | 46.7 | 89.0 | 0.49 | 0.25 | 0.49 | 8.0 |
| 3044 | 73.76 | 0.10 | 11.1 | 1.89 | 1.89 | 1.00 | 0.98 | 0.98 | 0.051 | 2.73 | 9,8 | 45.2 | 87.5 | 0.49 | 0.25 | 0.49 | 8.0 |
| 3044 + 1/2 | 72.75 | 0.03 | 10.8 | 1.86 | 1.87 | 1.00 | 1.02 | 1.00 | 0.015 | 2.76 | 10,8 | 45.5 | 89.1 | 0.50 | 0.26 | 0.50 | 8.0 |
| 3045 | 71.80 | 0.03 | 10.4 | 1.84 | 1.83 | 1.00 | 1.00 | 1.00 | 0.027 | 2.59 | 10,8 | 46.1 | 88.2 | 0.51 | 0.28 | 0.50 | 8.7 |
| 3045 + 1/2 | 70.90 | 0.03 | 10.1 | 1.81 | 1.81 | 1.00 | 1.00 | 1.00 | 0.025 | 2.43 | 10,8 | 27.0 | 49.8 | 0.51 | 0.33 | 0.38 | 8.0 |
| 3046 | 69.95 | 0.03 | 9.6 | 1.78 | 1.80 | 0.99 | 0.99 | 0.99 | 0.026 | 2.05 | 10,8 | 22.7 | 51.3 | 0.51 | 0.38 | 0.37 | 8.0 |
| 3046 + 1/2 | 69.06 | 0.05 | 9.4 | 1.79 | 1.77 | 1.01 | 1.01 | 1.01 | 0.018 | 1.87 | 10,8 | 21.6 | 51.4 | 0.52 | 0.44 | 0.35 | 8.0 |
| 3047 | 68.25 | 0.04 | 9.0 | 1.76 | 1.76 | 1.00 | 1.01 | 1.00 | 0.019 | 1.89 | 0,6 | 21.1 | 51.8 | 0.53 | 0.52 | 0.34 | 8.0 |
| 3047 + 1/2 | 67.53 | 0.00 | 8.5 | 1.73 | 1.74 | 0.99 | 1.00 | 0.99 | 0.028 | 1.85 | 4,7 | 20.7 | 51.0 | 0.53 | 0.60 | 0.32 | 8.0 |
| 3048 | 66.82 | 0.00 | 8.3 | 1.72 | 1.72 | 1.00 | 1.00 | 1.00 | 0.036 | 1.89 | 3,7 | 20.9 | 49.5 | 0.54 | 0.55 | 0.53 | 9.4 |
| 3048 + 1/2 | 66.10 | 0.01 | 7.9 | 1.70 | 1.71 | 0.99 | 0.99 | 0.99 | 0.040 | 2.28 | 3,7 | 20.6 | 47.6 | 0.55 | 0.57 | 0.54 | 9.3 |
| 3049 | 65.42 | 0.00 | 7.5 | 1.68 | 1.70 | 0.99 | 0.98 | 0.98 | 0.035 | 2.55 | 3,7 | 19.6 | 45.9 | 0.56 | 0.61 | 0.26 | 8.0 |
| 3049 + 1/2 | 64.73 | 0.00 | 7.1 | 1.66 | 1.69 | 0.98 | 0.98 | 0.98 | 0.027 | 2.44 | 3,7 | 18.5 | 43.3 | 0.57 | 0.59 | 0.56 | 9.1 |
| 3050 | 64.04 | 0.04 | 6.8 | 1.63 | 1.69 | 0.96 | 0.96 | 0.96 | 0.030 | 2.20 | 3,7 | 17.7 | 41.7 | 0.58 | 0.58 | 0.57 | 8.9 |
| 3050 + 1/2 | 63.44 | 0.02 | 6.4 | 1.63 | 1.67 | 0.97 | 0.97 | 0.97 | 0.029 | 2.36 | 3,7 | 17.1 | 39.6 | 0.59 | 0.58 | 0.58 | 8.8 |
| 3051 | 62.88 | 0.03 | 6.1 | 1.70 | 1.65 | 1.03 | 1.03 | 1.03 | 0.030 | 3.26 | 0,7 | 16.1 | 37.0 | 0.60 | 0.61 | 0.13 | 8.0 |
| 3051 + 1/2 | 62.39 | 0.00 | 5.7 | 1.69 | 1.64 | 1.03 | 1.04 | 1.03 | 0.027 | 2.89 | 0,7 | 15.4 | 32.3 | 0.61 | 0.50 | 0.10 | 8.0 |
| 3052 | 61.90 | 0.01 | 5.3 | 1.67 | 1.63 | 1.02 | 1.04 | 1.02 | 0.023 | 2.48 | 0,7 | 14.7 | 30.3 | 0.62 | 0.43 | 0.61 | 8.6 |
| 3052 + 1/2 | 61.38 | 0.01 | 5.0 | 1.64 | 1.61 | 1.02 | 1.03 | 1.02 | 0.018 | 2.56 | 0,7 | 12.8 | 26.3 | 0.63 | 0.36 | 0.62 | 8.5 |
| 3053 | 60.85 | 0.01 | 4.6 | 1.59 | 1.59 | 1.00 | 1.00 | 1.00 | 0.017 | 2.46 | 0,7 | 11.0 | 24.1 | 0.64 | 0.29 | 0.63 | 8.4 |
| 3053 + 1/2 | 60.34 | 0.02 | 4.2 | 1.55 | 1.55 | 1.00 | 1.01 | 1.00 | 0.009 | 2.26 | 0,6 | 9.4 | 19.1 | 0.65 | 0.23 | 0.64 | 8.4 |
| 3054 | 59.87 | 0.03 | 3.8 | 1.50 | 1.51 | 1.00 | 0.99 | 0.99 | 0.008 | 2.52 | 2,7 | 7.7 | 14.9 | 0.66 | 0.21 | 0.65 | 8.3 |
| 3054 + 1/2 | 59.47 | 0.04 | 3.4 | 1.47 | 1.46 | 1.01 | 1.01 | 1.01 | 0.001 | 2.94 | 2,7 | 5.7 | 10.6 | 0.67 | 0.14 | 0.66 | 8.3 |
| 3055 | 59.15 | 0.04 | 3.1 | 1.42 | 1.42 | 1.00 | 1.00 | 1.00 | 0.000 | 2.47 | 2,7 | 3.9 | 7.1 | 0.68 | 0.08 | 0.66 | 8.2 |
| 3055 + 1/2 | 58.89 | 0.02 | 2.6 | 1.37 | 1.37 | 1.00 | 1.00 | 1.00 | 0.000 | 2.56 | 2,7 | 2.7 | 4.8 | 0.69 | 0.04 | 0.67 | 8.1 |
| 3056 | 58.69 | 0.02 | 2.3 | 1.32 | 1.30 | 1.01 | 1.01 | 1.01 | 0.000 | 2.54 | 5,8 | 2.5 | 5.0 | 0.70 | 0.02 | 0.68 | 8.4 |
| 3056 + 1/2 | 58.52 | 0.02 | 1.9 | 1.24 | 1.23 | 1.00 | 1.00 | 1.00 | 0.000 | 2.75 | 5,8 | 2.5 | 5.2 | 0.70 | 0.02 | 0.68 | 8.3 |
| 3057 | 58.41 | 0.02 | 1.5 | 1.14 | 1.14 | 1.00 | 1.00 | 1.00 | 0.000 | 2.87 | 5,8 | 2.4 | 5.5 | 0.70 | 0.02 | 0.68 | 8.3 |
| 3057 + 1/2 | 58.33 | 0.01 | 1.1 | 1.04 | 1.04 | 1.00 | 1.00 | 1.00 | 0.000 | 2.30 | 5,8 | 2.5 | 5.6 | 0.71 | 0.03 | 0.69 | 8.2 |
| 3058 | 58.28 | 0.01 | 0.8 | 0.95 | 0.97 | 0.97 | 0.97 | 0.97 | 0.000 | 1.83 | 5,8 | 2.5 | 5.7 | 0.71 | 0.03 | 0.69 | 8.2 |
| 3058 + 1/2 | 58.24 | 0.01 | 0.7 | 0.90 | 0.88 | 1.02 | 1.02 | 1.02 | 0.000 | 2.45 | 0,0 | 2.5 | 5.6 | 0.71 | 0.03 | 0.69 | 8.1 |
| 3059 last | 58.22 | 0.01 | 0.5 | 0.82 | 0.85 | 0.96 | 0.96 | 0.96 | 0.000 | 1.16 | 0,6 | 2.5 | 5.6 | 0.71 | 0.03 | 0.69 | 8.1 |
| 3059 + 1/2 | 58.18 | 0.00 | 0.5 | 0.80 | 0.81 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 8,5 | 2.5 | 5.6 | 0.71 | 0.03 | 0.69 | 8.1 |
| 3060 | 58.15 | 0.00 | 0.5 | 0.79 | 0.80 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 7,5 | 2.5 | 5.5 | 0.71 | 0.03 | 0.69 | 8.1 |
| 3060 + 1/2 | 58.13 | 0.00 | 0.5 | 0.79 | 0.80 | 0.99 | 0.99 | 0.99 | 0.000 | 1.06 | 6,2 | 2.5 | 5.4 | 0.71 | 0.03 | 0.69 | 8.2 |
| 3061 | 58.10 | 0.00 | 0.5 | 0.80 | 0.80 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 2,7 | 2.5 | 5.4 | 0.71 | 0.03 | 0.69 | 8.2 |
| 3061 + 1/2 | 58.08 | 0.00 | 0.5 | 0.79 | 0.80 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 13,0 | 2.5 | 5.3 | 0.71 | 0.03 | 0.69 | 8.2 |
| 3062 | 58.06 | 0.00 | 0.5 | 0.79 | 0.80 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 7,5 | 2.5 | 5.2 | 0.71 | 0.03 | 0.69 | 8.2 |
| 3062 + 1/2 | 58.04 | 0.00 | 0.5 | 0.79 | 0.80 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 5,3 | 2.5 | 5.1 | 0.71 | 0.03 | 0.69 | 8.2 |
| 3063 | 58.02 | 0.00 | 0.5 | 0.79 | 0.80 | 0.99 | 0.99 | 0.99 | 0.000 | 1.14 | 2,7 | 2.5 | 5.0 | 0.71 | 0.03 | 0.69 | 8.2 |
| 3063 + 1/2 | 58.01 | 0.00 | 0.5 | 0.79 | 0.80 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 2,7 | 2.5 | 5.1 | 0.71 | 0.03 | 0.69 | 8.0 |
| 3064 | 57.99 | 0.00 | 0.5 | 0.79 | 0.80 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 7,7 |  |  |  |  |  |  |
| 3064 + 1/2 | 57.97 | 0.00 | 0.5 | 0.80 | 0.80 | 1.01 | 1.01 | 1.01 | 0.000 | 1.08 | 5,4 |  |  |  |  |  |  |
| 3065 | 57.97 | 0.00 | 0.5 | 0.79 | 0.80 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 13,0 |  |  |  |  |  |  |
| 3065 + 1/2 | 57.96 | 0.00 | 0.5 | 0.79 | 0.80 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 2,1 |  |  |  |  |  |  |
| 3066 | 57.95 | 0.00 | 0.5 | 0.79 | 0.80 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 7,0 |  |  |  |  |  |  |
| 3066 + 1/2 | 57.94 | 0.00 | 0.5 | 0.80 | 0.79 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 6,4 |  |  |  |  |  |  |
| 3067 | 57.94 | 0.00 | 0.5 | 0.80 | 0.79 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 6,5 |  |  |  |  |  |  |
| 3067 + 1/2 | 57.93 | 0.00 | 0.5 | 0.80 | 0.79 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 14,3 |  |  |  |  |  |  |
| 3068 | 57.93 | 0.00 | 0.5 | 0.80 | 0.79 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 5,3 |  |  |  |  |  |  |
| 3068 + 1/2 | 57.93 | 0.00 | 0.5 | 0.79 | 0.80 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 12,2 |  |  |  |  |  |  |
| 3069 | 57.93 | 0.00 | 0.5 | 0.80 | 0.80 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 6,8 |  |  |  |  |  |  |
| 3069 + 1/2 | 57.93 | 0.00 | 0.5 | 0.80 | 0.80 | 1.01 | 1.01 | 1.01 | 0.000 | 1.11 | 3,6 |  |  |  |  |  |  |
| 3070 | 57.93 | 0.00 | 0.5 | 0.80 | 0.80 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 6,6 |  |  |  |  |  |  |
| 3070 + 1/2 | 57.93 | 0.00 | 0.5 | 0.80 | 0.80 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 8,5 |  |  |  |  |  |  |
| 3071 | 57.94 | 0.00 | 0.5 | 0.79 | 0.80 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 15,2 |  |  |  |  |  |  |
| 3071 + 1/2 | 57.94 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### dive, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.25 from frame 3037 + 1/2 to the next, limit 1.2.
Largest pop score of one block: 9.34 from frame 2989 + 1/2 to the next, block column 3 row 0 from the top left, shown, not judged.
Largest change in place: 114.5 from frame 3037 to 8 film frames later, most at pixel 1512, 460, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 3060 to 3071 + 1/2): change 2.0; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.112 from frame 3051 to the next, most at pixel 298, 950, a patch of 104 by 64 px; 0 of 227 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 228 rows, which says nothing of them, quiet or not: frame 3071 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 3037 in /home/user/workspace/work/p6/hj9/02/jupiter-dive-p2of2-pops-full.png, frame 3037 + 1/2 in /home/user/workspace/work/p6/hj9/02/jupiter-dive-p2of2-pops-full.png, frame 3038 in /home/user/workspace/work/p6/hj9/02/jupiter-dive-p2of2-pops-full.png, frame 3051 in /home/user/workspace/work/p6/hj9/02/jupiter-dive-p2of2-pops-full.png, frame 3051 + 1/2 in /home/user/workspace/work/p6/hj9/02/jupiter-dive-p2of2-pops-full.png.

With the carry at the full size the dive has 2 numbers over the limit or not measured.

- FULL SIZE RED pop score 1.25 from frame 3037 + 1/2 to the next, limit 1.2 (7 frames over it, first 3036 + 1/2)
- FULL SIZE RED the pattern of the picture changes in place by 0.84 from frame 3019 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (38 frames over it, first 3017)

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2958 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 8,6 | 2.2 | 2.3 | 0.32 | 0.99 | 0.250 | 0.250 | 0.999 | 0.324 | 1062,782 | 136 by 96 |
| 2958 + 1/2 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 10,8 | 2.1 | 2.3 | 0.32 | 0.99 | 0.249 | 0.250 | 0.998 | 0.324 | 1110,170 | 108 by 140 |
| 2959 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 6,0 | 2.2 | 2.3 | 0.32 | 1.00 | 0.250 | 0.250 | 0.999 | 0.324 | 1246,542 | 448 by 364 |
| 2959 + 1/2 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 12,4 | 2.2 | 2.3 | 0.32 | 1.00 | 0.250 | 0.249 | 0.999 | 0.324 | 746,630 | 92 by 88 |
| 2960 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 7,1 | 2.2 | 2.3 | 0.32 | 1.00 | 0.249 | 0.250 | 0.997 | 0.324 | 1238,346 | 80 by 68 |
| 2960 + 1/2 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 1,8 | 2.1 | 2.4 | 0.32 | 1.00 | 0.248 | 0.250 | 0.994 | 0.324 | 1210,866 | 84 by 80 |
| 2961 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 10,4 | 2.1 | 2.3 | 0.32 | 1.01 | 0.250 | 0.250 | 1.000 | 0.324 | 1066,274 | 76 by 88 |
| 2961 + 1/2 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 15,7 | 2.1 | 2.3 | 0.32 | 1.00 | 0.250 | 0.250 | 0.999 | 0.324 | 1266,606 | 100 by 80 |
| 2962 | 0.3 | 0.26 | 0.26 | 1.01 | 1.01 | 1.01 | 0.000 | 1.08 | 4,2 | 2.2 | 2.4 | 0.32 | 1.00 | 0.251 | 0.250 | 1.005 | 0.324 | 1206,670 | 180 by 176 |
| 2962 + 1/2 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 12,3 | 2.1 | 2.3 | 0.32 | 1.00 | 0.249 | 0.250 | 0.996 | 0.324 | 1090,706 | 72 by 52 |
| 2963 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 2,8 | 2.1 | 2.3 | 0.32 | 1.00 | 0.251 | 0.249 | 1.002 | 0.325 | 1174,738 | 72 by 72 |
| 2963 + 1/2 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 10,4 | 2.2 | 2.4 | 0.32 | 1.00 | 0.249 | 0.250 | 0.996 | 0.325 | 1258,510 | 140 by 148 |
| 2964 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 12,0 | 2.2 | 2.4 | 0.32 | 1.00 | 0.248 | 0.250 | 0.992 | 0.325 | 1026,790 | 216 by 156 |
| 2964 + 1/2 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 8,5 | 2.3 | 2.5 | 0.32 | 1.00 | 0.251 | 0.249 | 1.003 | 0.325 | 1018,678 | 140 by 128 |
| 2965 | 0.3 | 0.26 | 0.26 | 0.99 | 0.99 | 0.99 | 0.000 | 1.06 | 3,6 | 2.3 | 2.5 | 0.32 | 1.00 | 0.250 | 0.250 | 0.997 | 0.325 | 1242,710 | 132 by 124 |
| 2965 + 1/2 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 14,8 | 2.3 | 2.5 | 0.32 | 1.00 | 0.251 | 0.250 | 1.005 | 0.325 | 1054,174 | 80 by 76 |
| 2966 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 10,3 | 2.4 | 2.5 | 0.32 | 1.00 | 0.250 | 0.250 | 0.999 | 0.325 | 1166,650 | 104 by 108 |
| 2966 + 1/2 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 1,0 | 2.4 | 2.7 | 0.32 | 0.99 | 0.250 | 0.251 | 0.998 | 0.325 | 1162,570 | 216 by 352 |
| 2967 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 3,4 | 2.5 | 2.7 | 0.32 | 0.99 | 0.251 | 0.251 | 0.999 | 0.325 | 1298,618 | 84 by 116 |
| 2967 + 1/2 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 13,0 | 2.6 | 2.8 | 0.32 | 0.98 | 0.251 | 0.250 | 1.003 | 0.325 | 1246,506 | 184 by 324 |
| 2968 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 12,7 | 2.6 | 2.9 | 0.32 | 0.98 | 0.251 | 0.250 | 1.003 | 0.325 | 1090,658 | 88 by 80 |
| 2968 + 1/2 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 3,4 | 2.7 | 3.0 | 0.32 | 0.99 | 0.250 | 0.250 | 0.999 | 0.325 | 1162,738 | 92 by 120 |
| 2969 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 14,6 | 2.8 | 3.1 | 0.32 | 0.99 | 0.249 | 0.250 | 0.996 | 0.325 | 1086,706 | 156 by 184 |
| 2969 + 1/2 | 0.3 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 14,5 | 2.9 | 3.2 | 0.32 | 0.98 | 0.250 | 0.250 | 0.998 | 0.325 | 1066,282 | 60 by 60 |
| 2970 | 0.3 | 0.26 | 0.26 | 0.99 | 0.99 | 0.99 | 0.000 | 1.05 | 15,5 | 3.0 | 3.6 | 0.32 | 0.95 | 0.249 | 0.252 | 0.989 | 0.325 | 1106,878 | 164 by 108 |
| 2970 + 1/2 | 0.2 | 0.26 | 0.26 | 0.99 | 0.99 | 0.99 | 0.000 | 1.05 | 14,2 | 3.1 | 4.1 | 0.32 | 0.82 | 0.254 | 0.253 | 1.002 | 0.326 | 1098,678 | 92 by 100 |
| 2971 | 0.2 | 0.26 | 0.26 | 0.98 | 0.98 | 0.98 | 0.000 | 1.18 | 11,3 | 3.3 | 4.8 | 0.32 | 0.73 | 0.256 | 0.257 | 0.998 | 0.326 | 1182,566 | 156 by 120 |
| 2971 + 1/2 | 0.5 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.34 | 11,3 | 3.4 | 5.0 | 0.33 | 0.92 | 0.260 | 0.260 | 1.000 | 0.326 | 954,234 | 192 by 128 |
| 2972 | 0.8 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.72 | 11,3 | 3.6 | 6.3 | 0.33 | 1.07 | 0.265 | 0.263 | 1.005 | 0.327 | 934,242 | 324 by 184 |
| 2972 + 1/2 | 1.2 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.89 | 11,3 | 3.7 | 6.6 | 0.33 | 1.09 | 0.266 | 0.266 | 0.999 | 0.328 | 1090,670 | 68 by 64 |
| 2973 | 1.6 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 2.11 | 11,3 | 3.8 | 6.6 | 0.33 | 1.07 | 0.268 | 0.267 | 1.003 | 0.329 | 1078,726 | 188 by 232 |
| 2973 + 1/2 | 2.1 | 0.33 | 0.33 | 1.01 | 1.01 | 1.01 | 0.000 | 2.26 | 11,2 | 3.9 | 6.0 | 0.33 | 1.02 | 0.268 | 0.268 | 1.000 | 0.330 | 862,134 | 236 by 156 |
| 2974 | 2.4 | 0.34 | 0.34 | 1.00 | 1.00 | 1.00 | 0.000 | 2.53 | 11,2 | 4.1 | 6.8 | 0.33 | 0.94 | 0.269 | 0.270 | 0.997 | 0.332 | 1098,654 | 60 by 84 |
| 2974 + 1/2 | 2.7 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.000 | 2.75 | 11,2 | 4.3 | 8.1 | 0.33 | 0.94 | 0.271 | 0.270 | 1.004 | 0.334 | 850,86 | 56 by 32 |
| 2975 | 3.2 | 0.36 | 0.37 | 0.99 | 0.99 | 0.99 | 0.000 | 2.94 | 11,2 | 4.4 | 7.9 | 0.33 | 1.00 | 0.271 | 0.272 | 0.995 | 0.336 | 858,106 | 100 by 56 |
| 2975 + 1/2 | 3.5 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.002 | 3.06 | 11,2 | 4.5 | 7.8 | 0.33 | 1.05 | 0.274 | 0.274 | 0.998 | 0.339 | 1110,658 | 72 by 96 |
| 2976 | 3.8 | 0.40 | 0.40 | 1.00 | 1.02 | 1.00 | 0.002 | 3.06 | 11,2 | 4.6 | 7.5 | 0.33 | 1.04 | 0.278 | 0.276 | 1.009 | 0.342 | 962,214 | 72 by 84 |
| 2976 + 1/2 | 4.2 | 0.41 | 0.41 | 1.01 | 1.04 | 1.01 | 0.000 | 3.08 | 11,2 | 4.7 | 9.3 | 0.33 | 1.01 | 0.278 | 0.279 | 0.996 | 0.345 | 854,834 | 80 by 72 |
| 2977 | 4.5 | 0.41 | 0.42 | 0.99 | 1.02 | 0.99 | 0.004 | 2.34 | 11,2 | 4.7 | 7.6 | 0.34 | 0.98 | 0.282 | 0.279 | 1.011 | 0.348 | 774,110 | 64 by 48 |
| 2977 + 1/2 | 4.6 | 0.43 | 0.42 | 1.02 | 1.05 | 1.02 | 0.007 | 2.64 | 12,4 | 4.8 | 7.9 | 0.34 | 0.96 | 0.280 | 0.283 | 0.987 | 0.352 | 858,78 | 68 by 44 |
| 2978 | 5.1 | 0.46 | 0.42 | 1.08 | 1.06 | 1.06 | 0.010 | 3.66 | 12,4 | 4.9 | 8.4 | 0.34 | 0.97 | 0.285 | 0.284 | 1.004 | 0.357 | 1438,514 | 52 by 96 |
| 2978 + 1/2 | 5.2 | 0.44 | 0.43 | 1.03 | 1.01 | 1.01 | 0.011 | 2.60 | 12,4 | 4.9 | 7.7 | 0.34 | 0.97 | 0.285 | 0.286 | 1.000 | 0.362 | 854,70 | 64 by 52 |
| 2979 | 5.4 | 0.42 | 0.43 | 0.98 | 1.02 | 0.98 | 0.006 | 2.34 | 12,4 | 5.2 | 6.2 | 0.35 | 1.00 | 0.286 | 0.287 | 0.998 | 0.367 | 658,898 | 60 by 100 |
| 2979 + 1/2 | 5.8 | 0.43 | 0.44 | 0.99 | 1.03 | 0.99 | 0.013 | 2.22 | 12,4 | 5.4 | 6.3 | 0.35 | 1.02 | 0.288 | 0.289 | 0.997 | 0.373 | 726,390 | 100 by 76 |
| 2980 | 5.9 | 0.43 | 0.44 | 0.97 | 0.97 | 0.97 | 0.022 | 2.42 | 12,4 | 5.5 | 8.5 | 0.35 | 1.02 | 0.292 | 0.291 | 1.003 | 0.378 | 774,394 | 56 by 52 |
| 2980 + 1/2 | 6.1 | 0.43 | 0.44 | 0.98 | 0.98 | 0.98 | 0.020 | 2.49 | 12,4 | 5.9 | 8.6 | 0.35 | 1.02 | 0.293 | 0.297 | 0.988 | 0.385 | 982,206 | 84 by 72 |
| 2981 | 6.4 | 0.45 | 0.44 | 1.03 | 0.99 | 0.99 | 0.019 | 3.18 | 12,2 | 6.1 | 10.6 | 0.35 | 1.01 | 0.307 | 0.297 | 1.033 | 0.392 | 934,30 | 124 by 48 |
| 2981 + 1/2 | 6.6 | 0.44 | 0.44 | 0.99 | 0.98 | 0.98 | 0.019 | 2.90 | 12,5 | 5.7 | 6.5 | 0.35 | 1.00 | 0.302 | 0.302 | 0.999 | 0.399 | 898,34 | 72 by 40 |
| 2982 | 6.8 | 0.45 | 0.44 | 1.02 | 0.97 | 0.97 | 0.027 | 2.72 | 12,2 | 6.0 | 8.3 | 0.36 | 0.99 | 0.300 | 0.305 | 0.985 | 0.406 | 990,186 | 72 by 60 |
| 2982 + 1/2 | 7.0 | 0.45 | 0.45 | 0.99 | 0.97 | 0.97 | 0.021 | 2.49 | 12,5 | 6.2 | 8.1 | 0.36 | 1.00 | 0.304 | 0.304 | 0.998 | 0.413 | 1110,42 | 56 by 44 |
| 2983 | 7.2 | 0.44 | 0.45 | 0.97 | 0.96 | 0.96 | 0.021 | 2.96 | 12,5 | 6.1 | 14.3 | 0.36 | 1.02 | 0.307 | 0.305 | 1.005 | 0.421 | 802,42 | 48 by 44 |
| 2983 + 1/2 | 7.5 | 0.44 | 0.46 | 0.96 | 0.98 | 0.96 | 0.014 | 2.53 | 3,6 | 6.3 | 10.5 | 0.36 | 1.00 | 0.307 | 0.308 | 0.997 | 0.429 | 802,34 | 80 by 52 |
| 2984 | 7.7 | 0.46 | 0.46 | 0.98 | 0.96 | 0.96 | 0.016 | 2.88 | 3,6 | 8.2 | 10.4 | 0.36 | 1.00 | 0.309 | 0.309 | 0.998 | 0.437 | 778,30 | 48 by 40 |
| 2984 + 1/2 | 7.9 | 0.47 | 0.48 | 1.00 | 1.00 | 1.00 | 0.015 | 3.59 | 13,3 | 7.4 | 9.0 | 0.37 | 0.97 | 0.312 | 0.311 | 1.003 | 0.445 | 1230,666 | 136 by 124 |
| 2985 | 8.2 | 0.49 | 0.50 | 0.99 | 1.00 | 0.99 | 0.020 | 4.40 | 13,3 | 8.3 | 10.0 | 0.36 | 0.97 | 0.313 | 0.315 | 0.995 | 0.454 | 1266,738 | 80 by 76 |
| 2985 + 1/2 | 8.4 | 0.53 | 0.52 | 1.02 | 1.10 | 1.02 | 0.011 | 7.60 | 13,4 | 10.7 | 12.6 | 0.37 | 0.99 | 0.318 | 0.316 | 1.008 | 0.462 | 1274,734 | 68 by 84 |
| 2986 | 8.8 | 0.55 | 0.54 | 1.01 | 1.11 | 1.01 | 0.011 | 6.21 | 13,5 | 12.2 | 14.9 | 0.37 | 0.99 | 0.318 | 0.320 | 0.995 | 0.472 | 702,42 | 64 by 44 |
| 2986 + 1/2 | 9.1 | 0.56 | 0.56 | 1.00 | 1.13 | 1.00 | 0.008 | 5.81 | 3,1 | 12.9 | 15.6 | 0.37 | 0.98 | 0.321 | 0.323 | 0.995 | 0.481 | 1218,374 | 92 by 60 |
| 2987 | 9.5 | 0.57 | 0.56 | 1.01 | 1.12 | 1.01 | 0.015 | 6.52 | 3,1 | 14.6 | 18.9 | 0.37 | 0.99 | 0.328 | 0.325 | 1.008 | 0.491 | 1314,734 | 64 by 96 |
| 2987 + 1/2 | 9.9 | 0.58 | 0.57 | 1.02 | 1.12 | 1.02 | 0.015 | 8.00 | 2,3 | 16.3 | 22.6 | 0.37 | 1.00 | 0.329 | 0.331 | 0.992 | 0.501 | 1322,754 | 72 by 132 |
| 2988 | 10.4 | 0.58 | 0.57 | 1.02 | 1.10 | 1.02 | 0.018 | 8.12 | 2,3 | 17.9 | 26.7 | 0.37 | 1.00 | 0.335 | 0.333 | 1.007 | 0.511 | 1338,754 | 128 by 136 |
| 2988 + 1/2 | 10.8 | 0.60 | 0.58 | 1.05 | 1.12 | 1.05 | 0.018 | 7.98 | 2,2 | 19.1 | 29.2 | 0.38 | 1.00 | 0.337 | 0.340 | 0.989 | 0.522 | 1358,702 | 80 by 116 |
| 2989 | 11.3 | 0.61 | 0.58 | 1.06 | 1.05 | 1.05 | 0.038 | 8.96 | 3,0 | 20.9 | 30.4 | 0.38 | 0.99 | 0.346 | 0.345 | 1.004 | 0.532 | 1358,770 | 84 by 104 |
| 2989 + 1/2 | 11.8 | 0.62 | 0.58 | 1.07 | 1.04 | 1.04 | 0.044 | 9.34 | 3,0 | 22.6 | 28.8 | 0.38 | 0.99 | 0.353 | 0.354 | 0.996 | 0.544 | 1370,766 | 112 by 92 |
| 2990 | 12.3 | 0.61 | 0.58 | 1.05 | 0.98 | 0.98 | 0.054 | 8.82 | 3,0 | 22.0 | 28.1 | 0.38 | 0.97 | 0.362 | 0.365 | 0.992 | 0.555 | 1394,770 | 44 by 84 |
| 2990 + 1/2 | 12.7 | 0.60 | 0.59 | 1.01 | 0.94 | 0.94 | 0.073 | 7.83 | 3,0 | 27.8 | 40.7 | 0.39 | 0.96 | 0.378 | 0.377 | 1.002 | 0.568 | 1402,766 | 80 by 68 |
| 2991 | 13.3 | 0.60 | 0.60 | 1.00 | 0.91 | 0.91 | 0.071 | 7.12 | 2,1 | 27.8 | 39.6 | 0.39 | 0.95 | 0.392 | 0.393 | 0.997 | 0.580 | 1422,782 | 36 by 64 |
| 2991 + 1/2 | 14.1 | 0.62 | 0.60 | 1.03 | 0.90 | 0.90 | 0.082 | 5.71 | 2,1 | 29.2 | 42.3 | 0.39 | 0.94 | 0.408 | 0.411 | 0.993 | 0.593 | 1442,754 | 84 by 88 |
| 2992 | 14.1 | 0.63 | 0.60 | 1.05 | 0.87 | 0.87 | 0.107 | 5.29 | 1,2 | 31.5 | 48.1 | 0.39 | 0.95 | 0.430 | 0.427 | 1.007 | 0.606 | 1418,686 | 84 by 72 |
| 2992 + 1/2 | 14.7 | 0.62 | 0.60 | 1.02 | 0.89 | 0.89 | 0.086 | 4.58 | 1,3 | 34.0 | 54.1 | 0.39 | 0.96 | 0.446 | 0.448 | 0.996 | 0.620 | 1046,46 | 72 by 40 |
| 2993 | 15.1 | 0.60 | 0.61 | 0.98 | 0.96 | 0.96 | 0.068 | 4.64 | 0,0 | 39.1 | 64.6 | 0.39 | 1.00 | 0.466 | 0.465 | 1.002 | 0.634 | 766,434 | 72 by 60 |
| 2993 + 1/2 | 15.9 | 0.58 | 0.61 | 0.94 | 0.86 | 0.86 | 0.095 | 4.20 | 2,0 | 45.2 | 76.2 | 0.39 | 0.97 | 0.483 | 0.484 | 0.998 | 0.648 | 1490,806 | 108 by 108 |
| 2994 | 16.0 | 0.57 | 0.62 | 0.93 | 0.95 | 0.93 | 0.050 | 3.58 | 2,8 | 51.8 | 71.6 | 0.38 | 0.98 | 0.502 | 0.503 | 0.999 | 0.663 | 1558,754 | 72 by 92 |
| 2994 + 1/2 | 16.7 | 0.58 | 0.62 | 0.93 | 0.99 | 0.93 | 0.043 | 3.90 | 2,8 | 51.4 | 61.0 | 0.38 | 1.01 | 0.523 | 0.524 | 0.999 | 0.679 | 1530,818 | 108 by 112 |
| 2995 | 17.5 | 0.58 | 0.63 | 0.93 | 0.98 | 0.93 | 0.042 | 4.51 | 2,8 | 59.3 | 73.7 | 0.37 | 0.99 | 0.545 | 0.548 | 0.994 | 0.694 | 950,50 | 136 by 44 |
| 2995 + 1/2 | 18.1 | 0.60 | 0.63 | 0.95 | 0.98 | 0.95 | 0.062 | 4.11 | 1,8 | 64.4 | 74.5 | 0.37 | 1.01 | 0.573 | 0.569 | 1.006 | 0.711 | 1038,46 | 108 by 40 |
| 2996 | 18.8 | 0.63 | 0.65 | 0.97 | 0.96 | 0.96 | 0.075 | 3.69 | 2,8 | 68.7 | 80.1 | 0.36 | 0.99 | 0.594 | 0.596 | 0.997 | 0.728 | 1138,42 | 72 by 44 |
| 2996 + 1/2 | 19.4 | 0.66 | 0.65 | 1.01 | 1.00 | 1.00 | 0.059 | 2.75 | 0,4 | 56.8 | 73.3 | 0.35 | 1.00 | 0.618 | 0.615 | 1.005 | 0.746 | 1242,46 | 84 by 44 |
| 2997 | 19.9 | 0.68 | 0.69 | 0.98 | 0.99 | 0.98 | 0.040 | 2.62 | 0,4 | 55.6 | 81.0 | 0.35 | 0.98 | 0.636 | 0.640 | 0.994 | 0.764 | 1706,810 | 48 by 56 |
| 2997 + 1/2 | 20.0 | 0.73 | 0.72 | 1.01 | 1.02 | 1.01 | 0.045 | 4.94 | 1,8 | 51.4 | 84.9 | 0.34 | 1.01 | 0.662 | 0.662 | 1.000 | 0.783 | 1642,866 | 56 by 52 |
| 2998 | 20.1 | 0.77 | 0.77 | 1.00 | 0.98 | 0.98 | 0.059 | 3.57 | 1,8 | 54.5 | 81.9 | 0.34 | 0.99 | 0.688 | 0.693 | 0.993 | 0.803 | 1666,870 | 56 by 52 |
| 2998 + 1/2 | 19.4 | 0.81 | 0.81 | 1.01 | 1.01 | 1.01 | 0.055 | 1.94 | 7,0 | 54.5 | 65.7 | 0.33 | 1.01 | 0.725 | 0.716 | 1.012 | 0.821 | 58,450 | 40 by 84 |
| 2999 | 19.0 | 0.84 | 0.84 | 1.00 | 0.98 | 0.98 | 0.051 | 1.76 | 14,3 | 56.1 | 67.3 | 0.33 | 0.99 | 0.745 | 0.748 | 0.995 | 0.834 | 1702,890 | 60 by 52 |
| 2999 + 1/2 | 19.5 | 0.87 | 0.86 | 1.00 | 0.99 | 0.99 | 0.038 | 2.12 | 0,1 | 63.0 | 74.1 | 0.32 | 1.00 | 0.772 | 0.777 | 0.994 | 0.846 | 1442,902 | 68 by 56 |
| 3000 | 19.7 | 0.88 | 0.88 | 1.00 | 1.02 | 1.00 | 0.025 | 2.01 | 15,4 | 53.4 | 78.9 | 0.31 | 1.01 | 0.809 | 0.804 | 1.007 | 0.854 | 1718,78 | 84 by 124 |
| 3000 + 1/2 | 20.2 | 0.90 | 0.91 | 0.99 | 0.99 | 0.99 | 0.022 | 2.34 | 15,4 | 58.0 | 86.0 | 0.31 | 1.00 | 0.835 | 0.842 | 0.991 | 0.861 | 1730,74 | 60 by 84 |
| 3001 | 20.5 | 0.93 | 0.92 | 1.01 | 1.01 | 1.01 | 0.012 | 2.55 | 9,0 | 45.3 | 63.4 | 0.30 | 0.99 | 0.875 | 0.866 | 1.010 | 0.867 | 1134,46 | 64 by 36 |
| 3001 + 1/2 | 21.0 | 0.94 | 0.93 | 1.01 | 1.01 | 1.01 | 0.012 | 2.25 | 7,5 | 43.2 | 58.4 | 0.30 | 1.01 | 0.897 | 0.890 | 1.009 | 0.872 | 922,50 | 84 by 44 |
| 3002 | 21.4 | 0.94 | 0.94 | 1.00 | 1.02 | 1.00 | 0.007 | 2.51 | 7,5 | 42.3 | 64.5 | 0.29 | 1.00 | 0.904 | 0.908 | 0.996 | 0.875 | 1858,346 | 52 by 148 |
| 3002 + 1/2 | 21.8 | 0.95 | 0.94 | 1.01 | 1.03 | 1.01 | 0.000 | 2.95 | 7,5 | 41.8 | 57.9 | 0.29 | 1.01 | 0.919 | 0.913 | 1.007 | 0.878 | 1862,298 | 44 by 52 |
| 3003 | 22.2 | 0.94 | 0.94 | 1.00 | 1.02 | 1.00 | 0.003 | 3.31 | 7,5 | 42.8 | 60.4 | 0.29 | 1.00 | 0.922 | 0.927 | 0.994 | 0.879 | 1810,166 | 56 by 56 |
| 3003 + 1/2 | 22.5 | 0.95 | 0.94 | 1.01 | 1.01 | 1.01 | 0.005 | 3.49 | 7,5 | 41.0 | 60.9 | 0.28 | 1.00 | 0.935 | 0.934 | 1.001 | 0.880 | 874,618 | 68 by 92 |
| 3004 | 22.9 | 0.96 | 0.95 | 1.02 | 0.99 | 0.99 | 0.008 | 3.63 | 7,5 | 40.3 | 61.1 | 0.28 | 1.00 | 0.946 | 0.936 | 1.011 | 0.881 | 882,618 | 76 by 88 |
| 3004 + 1/2 | 23.3 | 0.96 | 0.95 | 1.01 | 1.00 | 1.00 | 0.008 | 2.93 | 7,5 | 41.1 | 52.1 | 0.28 | 1.01 | 0.949 | 0.936 | 1.014 | 0.881 | 890,622 | 72 by 88 |
| 3005 | 23.6 | 0.95 | 0.95 | 0.99 | 0.99 | 0.99 | 0.005 | 1.63 | 15,1 | 37.4 | 51.2 | 0.28 | 1.01 | 0.937 | 0.939 | 0.997 | 0.880 | 530,350 | 72 by 76 |
| 3005 + 1/2 | 24.0 | 0.94 | 0.95 | 0.99 | 0.99 | 0.99 | 0.004 | 1.61 | 15,1 | 37.9 | 47.1 | 0.28 | 1.01 | 0.932 | 0.940 | 0.991 | 0.880 | 842,354 | 80 by 60 |
| 3006 | 24.2 | 0.94 | 0.95 | 0.98 | 0.99 | 0.98 | 0.004 | 1.54 | 15,1 | 38.9 | 49.0 | 0.28 | 1.02 | 0.931 | 0.940 | 0.990 | 0.879 | 566,686 | 60 by 56 |
| 3006 + 1/2 | 24.6 | 0.95 | 0.95 | 1.00 | 0.99 | 0.99 | 0.005 | 1.39 | 4,4 | 39.2 | 49.1 | 0.29 | 1.03 | 0.944 | 0.942 | 1.003 | 0.878 | 1862,154 | 56 by 76 |
| 3007 | 24.9 | 0.96 | 0.95 | 1.00 | 1.02 | 1.00 | 0.003 | 1.61 | 15,0 | 39.6 | 49.0 | 0.28 | 1.02 | 0.951 | 0.955 | 0.997 | 0.878 | 1874,138 | 44 by 76 |
| 3007 + 1/2 | 25.3 | 0.97 | 0.96 | 1.02 | 1.02 | 1.02 | 0.005 | 1.52 | 0,2 | 36.6 | 39.1 | 0.28 | 1.03 | 0.965 | 0.965 | 1.000 | 0.878 | 1806,90 | 60 by 56 |
| 3008 | 25.6 | 0.99 | 0.96 | 1.03 | 1.05 | 1.03 | 0.002 | 1.73 | 15,0 | 34.2 | 39.0 | 0.28 | 1.02 | 0.980 | 0.978 | 1.002 | 0.877 | 466,246 | 80 by 76 |
| 3008 + 1/2 | 26.0 | 1.00 | 0.96 | 1.04 | 1.03 | 1.03 | 0.006 | 1.41 | 8,2 | 34.9 | 40.4 | 0.29 | 1.02 | 0.990 | 0.987 | 1.003 | 0.875 | 502,186 | 60 by 52 |
| 3009 | 26.2 | 1.00 | 0.96 | 1.04 | 1.03 | 1.03 | 0.007 | 1.52 | 3,8 | 34.8 | 40.2 | 0.29 | 1.02 | 0.994 | 0.985 | 1.009 | 0.875 | 490,158 | 64 by 60 |
| 3009 + 1/2 | 26.3 | 1.00 | 0.96 | 1.04 | 1.04 | 1.04 | 0.007 | 1.57 | 4,0 | 34.9 | 40.2 | 0.29 | 1.02 | 0.997 | 0.985 | 1.012 | 0.875 | 846,50 | 84 by 36 |
| 3010 | 26.3 | 0.99 | 0.96 | 1.02 | 1.02 | 1.02 | 0.008 | 1.97 | 3,0 | 34.2 | 38.3 | 0.30 | 1.01 | 0.980 | 0.983 | 0.997 | 0.874 | 398,58 | 88 by 40 |
| 3010 + 1/2 | 26.2 | 0.98 | 0.97 | 1.01 | 1.01 | 1.01 | 0.008 | 1.65 | 3,0 | 35.0 | 41.0 | 0.30 | 1.00 | 0.973 | 0.975 | 0.998 | 0.875 | 1566,618 | 84 by 52 |
| 3011 | 26.1 | 0.98 | 0.97 | 1.01 | 1.00 | 1.00 | 0.010 | 1.79 | 2,0 | 35.8 | 41.7 | 0.30 | 1.00 | 0.969 | 0.967 | 1.002 | 0.876 | 366,94 | 76 by 48 |
| 3011 + 1/2 | 26.1 | 0.97 | 0.98 | 1.00 | 1.00 | 1.00 | 0.009 | 2.00 | 2,0 | 36.5 | 41.2 | 0.30 | 1.01 | 0.962 | 0.965 | 0.997 | 0.875 | 78,650 | 36 by 64 |
| 3012 | 26.3 | 0.98 | 0.98 | 1.00 | 0.99 | 0.99 | 0.012 | 1.79 | 1,0 | 38.4 | 42.6 | 0.30 | 0.99 | 0.961 | 0.951 | 1.011 | 0.875 | 318,58 | 124 by 36 |
| 3012 + 1/2 | 26.0 | 0.95 | 0.98 | 0.97 | 0.97 | 0.97 | 0.010 | 1.46 | 1,1 | 40.7 | 45.8 | 0.31 | 0.99 | 0.939 | 0.949 | 0.989 | 0.875 | 1106,158 | 64 by 52 |
| 3013 | 25.8 | 0.96 | 0.98 | 0.97 | 0.98 | 0.97 | 0.007 | 1.31 | 10,0 | 43.3 | 50.4 | 0.31 | 0.98 | 0.937 | 0.939 | 0.998 | 0.875 | 1122,142 | 88 by 64 |
| 3013 + 1/2 | 25.8 | 0.94 | 0.99 | 0.96 | 0.98 | 0.96 | 0.006 | 1.44 | 2,3 | 46.1 | 56.7 | 0.31 | 1.01 | 0.931 | 0.939 | 0.992 | 0.875 | 150,70 | 88 by 56 |
| 3014 | 25.6 | 0.96 | 0.99 | 0.97 | 0.99 | 0.97 | 0.005 | 1.37 | 9,0 | 49.8 | 60.4 | 0.32 | 1.00 | 0.939 | 0.941 | 0.998 | 0.875 | 898,586 | 60 by 64 |
| 3014 + 1/2 | 25.5 | 0.96 | 0.99 | 0.96 | 0.98 | 0.96 | 0.013 | 1.53 | 1,3 | 53.9 | 65.0 | 0.32 | 1.00 | 0.945 | 0.945 | 1.000 | 0.874 | 90,494 | 88 by 112 |
| 3015 | 25.3 | 0.97 | 1.00 | 0.97 | 0.97 | 0.97 | 0.016 | 1.41 | 9,0 | 57.5 | 69.3 | 0.32 | 1.00 | 0.952 | 0.950 | 1.001 | 0.874 | 1290,774 | 108 by 72 |
| 3015 + 1/2 | 25.3 | 0.98 | 1.00 | 0.98 | 0.98 | 0.98 | 0.019 | 1.56 | 7,8 | 60.3 | 71.7 | 0.32 | 0.99 | 0.955 | 0.954 | 1.001 | 0.874 | 854,46 | 72 by 40 |
| 3016 | 25.3 | 0.99 | 1.00 | 0.99 | 0.99 | 0.99 | 0.016 | 1.46 | 1,2 | 62.3 | 73.4 | 0.32 | 0.99 | 0.957 | 0.957 | 1.000 | 0.873 | 1442,166 | 124 by 144 |
| 3016 + 1/2 | 25.5 | 1.01 | 1.00 | 1.01 | 1.00 | 1.00 | 0.018 | 1.59 | 1,8 | 62.9 | 70.8 | 0.32 | 1.00 | 0.961 | 0.958 | 1.003 | 0.872 | 1454,790 | 72 by 48 |
| 3017 | 25.3 | 1.00 | 1.01 | 0.99 | 1.00 | 0.99 | 0.015 | 1.40 | 8,0 | 63.7 | 69.4 | 0.33 | 0.98 | 0.958 | 0.964 | 0.994 | 0.871 | 1398,578 | 52 by 64 |
| 3017 + 1/2 | 25.1 | 1.05 | 1.01 | 1.04 | 1.00 | 1.00 | 0.024 | 1.43 | 1,8 | 62.9 | 66.1 | 0.33 | 1.00 | 0.968 | 0.967 | 1.001 | 0.870 | 722,1034 | 60 by 32 |
| 3018 | 24.9 | 1.07 | 1.01 | 1.06 | 0.99 | 0.99 | 0.030 | 1.48 | 9,8 | 62.3 | 65.3 | 0.33 | 1.00 | 0.974 | 0.970 | 1.004 | 0.870 | 90,1018 | 56 by 56 |
| 3018 + 1/2 | 25.4 | 1.02 | 1.01 | 1.01 | 1.00 | 1.00 | 0.025 | 1.41 | 12,0 | 60.4 | 64.3 | 0.33 | 0.98 | 0.973 | 0.989 | 0.984 | 0.865 | 1554,6 | 52 by 40 |
| 3019 | 25.0 | 1.06 | 1.01 | 1.05 | 1.02 | 1.02 | 0.033 | 1.94 | 5,8 | 61.1 | 66.7 | 0.33 | 0.99 | 1.003 | 1.003 | 1.000 | 0.865 | 642,1018 | 80 by 64 |
| 3019 + 1/2 | 25.3 | 1.06 | 1.01 | 1.05 | 1.06 | 1.05 | 0.029 | 1.85 | 5,8 | 59.9 | 65.9 | 0.33 | 0.99 | 1.031 | 1.038 | 0.993 | 0.862 | 1394,838 | 64 by 56 |
| 3020 | 25.0 | 1.10 | 1.01 | 1.09 | 1.11 | 1.09 | 0.025 | 1.81 | 11,7 | 57.9 | 66.2 | 0.34 | 1.01 | 1.074 | 1.069 | 1.004 | 0.861 | 70,1042 | 36 by 28 |
| 3020 + 1/2 | 25.2 | 1.13 | 1.01 | 1.12 | 1.12 | 1.12 | 0.040 | 2.04 | 11,7 | 55.8 | 65.1 | 0.34 | 1.00 | 1.108 | 1.101 | 1.006 | 0.859 | 86,1018 | 52 by 52 |
| 3021 | 24.9 | 1.14 | 1.01 | 1.13 | 1.13 | 1.13 | 0.041 | 2.40 | 11,7 | 51.6 | 62.4 | 0.34 | 0.99 | 1.128 | 1.120 | 1.006 | 0.859 | 1834,766 | 60 by 200 |
| 3021 + 1/2 | 24.8 | 1.15 | 1.01 | 1.14 | 1.15 | 1.14 | 0.036 | 2.45 | 13,5 | 51.0 | 59.7 | 0.34 | 0.98 | 1.133 | 1.139 | 0.994 | 0.856 | 1842,482 | 108 by 164 |
| 3022 | 24.6 | 1.14 | 1.01 | 1.14 | 1.16 | 1.14 | 0.026 | 2.42 | 13,5 | 48.0 | 57.2 | 0.35 | 1.01 | 1.151 | 1.148 | 1.002 | 0.854 | 62,50 | 52 by 40 |
| 3022 + 1/2 | 24.3 | 1.15 | 1.01 | 1.14 | 1.17 | 1.14 | 0.020 | 2.31 | 13,5 | 45.1 | 49.6 | 0.35 | 0.99 | 1.164 | 1.150 | 1.012 | 0.852 | 62,966 | 52 by 56 |
| 3023 | 23.7 | 1.15 | 1.01 | 1.14 | 1.14 | 1.14 | 0.043 | 2.25 | 11,8 | 42.2 | 45.5 | 0.36 | 0.98 | 1.169 | 1.150 | 1.017 | 0.851 | 66,906 | 80 by 60 |
| 3023 + 1/2 | 23.7 | 1.13 | 1.01 | 1.12 | 1.13 | 1.12 | 0.035 | 2.26 | 9,4 | 38.3 | 42.4 | 0.36 | 0.99 | 1.149 | 1.148 | 1.000 | 0.847 | 1574,242 | 132 by 112 |
| 3024 | 23.3 | 1.11 | 1.01 | 1.10 | 1.11 | 1.10 | 0.052 | 2.31 | 9,4 | 36.0 | 41.6 | 0.37 | 0.99 | 1.133 | 1.128 | 1.004 | 0.844 | 1266,6 | 116 by 72 |
| 3024 + 1/2 | 22.9 | 1.08 | 1.01 | 1.07 | 1.08 | 1.07 | 0.069 | 2.13 | 9,4 | 32.9 | 39.8 | 0.37 | 0.99 | 1.108 | 1.099 | 1.008 | 0.842 | 1250,6 | 120 by 80 |
| 3025 | 22.6 | 1.04 | 1.00 | 1.04 | 1.02 | 1.02 | 0.079 | 1.79 | 13,6 | 29.8 | 36.6 | 0.37 | 0.99 | 1.064 | 1.071 | 0.994 | 0.839 | 1538,274 | 132 by 124 |
| 3025 + 1/2 | 22.3 | 1.01 | 1.00 | 1.01 | 1.05 | 1.01 | 0.062 | 1.85 | 1,1 | 26.2 | 34.7 | 0.38 | 1.00 | 1.034 | 1.024 | 1.009 | 0.836 | 1686,438 | 88 by 88 |
| 3026 | 22.0 | 0.96 | 1.00 | 0.96 | 0.94 | 0.94 | 0.071 | 2.07 | 1,1 | 23.9 | 32.3 | 0.38 | 0.99 | 0.984 | 0.985 | 0.999 | 0.834 | 1162,6 | 64 by 36 |
| 3026 + 1/2 | 21.6 | 0.92 | 1.00 | 0.91 | 0.90 | 0.90 | 0.074 | 2.16 | 1,1 | 24.5 | 29.1 | 0.38 | 0.98 | 0.937 | 0.941 | 0.996 | 0.832 | 1374,186 | 112 by 84 |
| 3027 | 21.9 | 0.88 | 1.00 | 0.88 | 0.87 | 0.87 | 0.073 | 2.02 | 1,1 | 25.9 | 32.1 | 0.39 | 0.97 | 0.897 | 0.896 | 1.001 | 0.829 | 1330,170 | 244 by 168 |
| 3027 + 1/2 | 21.5 | 0.84 | 1.00 | 0.84 | 0.82 | 0.82 | 0.077 | 2.12 | 1,2 | 29.8 | 36.7 | 0.39 | 0.97 | 0.856 | 0.863 | 0.992 | 0.826 | 1058,6 | 120 by 64 |
| 3028 | 21.1 | 0.81 | 1.00 | 0.81 | 0.79 | 0.79 | 0.065 | 2.24 | 1,2 | 33.9 | 41.4 | 0.40 | 0.96 | 0.829 | 0.829 | 0.999 | 0.823 | 1038,6 | 84 by 48 |
| 3028 + 1/2 | 21.0 | 0.80 | 1.00 | 0.80 | 0.74 | 0.74 | 0.081 | 2.22 | 1,2 | 37.8 | 46.6 | 0.40 | 0.93 | 0.802 | 0.808 | 0.993 | 0.821 | 998,6 | 72 by 40 |
| 3029 | 20.5 | 0.79 | 1.00 | 0.79 | 0.73 | 0.73 | 0.080 | 2.12 | 0,2 | 40.5 | 48.5 | 0.40 | 0.93 | 0.788 | 0.789 | 0.999 | 0.818 | 954,6 | 68 by 32 |
| 3029 + 1/2 | 20.3 | 0.78 | 1.00 | 0.78 | 0.72 | 0.72 | 0.072 | 1.96 | 0,2 | 44.4 | 54.4 | 0.41 | 0.92 | 0.775 | 0.781 | 0.993 | 0.815 | 930,6 | 72 by 28 |
| 3030 | 19.9 | 0.78 | 1.00 | 0.78 | 0.73 | 0.73 | 0.062 | 1.90 | 5,8 | 47.8 | 58.9 | 0.41 | 0.93 | 0.773 | 0.781 | 0.989 | 0.812 | 902,6 | 100 by 48 |
| 3030 + 1/2 | 19.7 | 0.78 | 1.00 | 0.78 | 0.71 | 0.71 | 0.068 | 1.84 | 5,8 | 51.8 | 63.6 | 0.41 | 0.92 | 0.770 | 0.791 | 0.975 | 0.809 | 858,6 | 64 by 20 |
| 3031 | 19.4 | 0.82 | 1.00 | 0.82 | 0.76 | 0.76 | 0.057 | 2.00 | 9,8 | 55.6 | 66.7 | 0.41 | 0.93 | 0.806 | 0.794 | 1.015 | 0.806 | 830,6 | 148 by 64 |
| 3031 + 1/2 | 19.0 | 0.83 | 1.00 | 0.83 | 0.78 | 0.78 | 0.049 | 2.33 | 9,8 | 59.0 | 69.5 | 0.41 | 0.93 | 0.816 | 0.828 | 0.985 | 0.804 | 874,50 | 164 by 80 |
| 3032 | 18.8 | 0.86 | 1.00 | 0.86 | 0.81 | 0.81 | 0.054 | 2.24 | 9,8 | 65.1 | 76.9 | 0.42 | 0.93 | 0.850 | 0.853 | 0.997 | 0.801 | 762,6 | 320 by 148 |
| 3032 + 1/2 | 18.6 | 0.90 | 0.99 | 0.91 | 0.85 | 0.85 | 0.060 | 2.32 | 7,8 | 70.3 | 82.5 | 0.42 | 0.93 | 0.889 | 0.896 | 0.993 | 0.797 | 1238,278 | 160 by 104 |
| 3033 | 18.1 | 0.94 | 0.98 | 0.96 | 0.94 | 0.94 | 0.044 | 2.38 | 7,8 | 73.4 | 84.1 | 0.42 | 0.97 | 0.941 | 0.932 | 1.010 | 0.793 | 1142,230 | 216 by 124 |
| 3033 + 1/2 | 17.8 | 0.97 | 0.96 | 1.02 | 1.01 | 1.01 | 0.047 | 2.58 | 1,8 | 81.0 | 92.7 | 0.42 | 0.98 | 0.974 | 0.972 | 1.003 | 0.790 | 1050,194 | 224 by 120 |
| 3034 | 17.5 | 1.00 | 0.94 | 1.06 | 1.07 | 1.06 | 0.040 | 2.38 | 11,4 | 90.8 | 102.7 | 0.42 | 0.98 | 1.002 | 1.000 | 1.002 | 0.787 | 562,6 | 116 by 40 |
| 3034 + 1/2 | 17.3 | 1.02 | 0.93 | 1.10 | 1.17 | 1.10 | 0.016 | 2.48 | 11,4 | 98.0 | 112.5 | 0.42 | 1.00 | 1.026 | 1.032 | 0.994 | 0.784 | 542,6 | 92 by 32 |
| 3035 | 17.1 | 1.05 | 0.92 | 1.13 | 1.20 | 1.13 | 0.023 | 2.73 | 3,1 | 105.2 | 118.1 | 0.43 | 1.01 | 1.062 | 1.061 | 1.001 | 0.781 | 1650,602 | 56 by 52 |
| 3035 + 1/2 | 16.6 | 1.07 | 0.92 | 1.16 | 1.22 | 1.16 | 0.027 | 2.71 | 11,4 | 109.2 | 123.2 | 0.43 | 1.02 | 1.096 | 1.100 | 0.996 | 0.779 | 1678,626 | 64 by 56 |
| 3036 | 16.3 | 1.10 | 0.92 | 1.19 | 1.29 | 1.19 | 0.016 | 2.71 | 2,0 | 109.7 | 130.4 | 0.43 | 1.04 | 1.138 | 1.140 | 0.998 | 0.775 | 1702,650 | 72 by 60 |
| 3036 + 1/2 | 16.0 | 1.14 | 0.92 | 1.23 | 1.24 | 1.23 | 0.047 | 4.13 | 2,0 | 111.3 | 134.6 | 0.43 | 1.05 | 1.183 | 1.175 | 1.008 | 0.771 | 1770,710 | 96 by 88 |
| 3037 | 15.7 | 1.15 | 0.92 | 1.25 | 1.31 | 1.25 | 0.032 | 5.69 | 1,0 | 114.5 | 138.0 | 0.44 | 1.07 | 1.211 | 1.197 | 1.012 | 0.769 | 1806,738 | 104 by 92 |
| 3037 + 1/2 | 15.3 | 1.16 | 0.92 | 1.25 | 1.30 | 1.25 | 0.036 | 7.45 | 1,0 | 112.0 | 137.9 | 0.44 | 1.08 | 1.226 | 1.198 | 1.023 | 0.767 | 342,42 | 404 by 76 |
| 3038 | 15.0 | 1.14 | 0.92 | 1.23 | 1.26 | 1.23 | 0.050 | 8.22 | 1,0 | 107.0 | 139.0 | 0.44 | 1.08 | 1.211 | 1.199 | 1.010 | 0.763 | 126,10 | 316 by 56 |
| 3038 + 1/2 | 14.7 | 1.11 | 0.92 | 1.20 | 1.22 | 1.196 | 0.048 | 7.94 | 1,0 | 104.2 | 126.4 | 0.45 | 1.08 | 1.186 | 1.181 | 1.005 | 0.760 | 490,14 | 80 by 44 |
| 3039 | 14.3 | 1.07 | 0.92 | 1.16 | 1.17 | 1.16 | 0.051 | 6.75 | 1,0 | 101.9 | 132.8 | 0.45 | 1.06 | 1.150 | 1.168 | 0.984 | 0.757 | 450,6 | 80 by 32 |
| 3039 + 1/2 | 14.1 | 1.06 | 0.92 | 1.14 | 1.19 | 1.14 | 0.042 | 5.18 | 1,0 | 93.3 | 124.7 | 0.46 | 1.08 | 1.151 | 1.127 | 1.021 | 0.753 | 78,1018 | 28 by 56 |
| 3040 | 13.8 | 1.01 | 0.92 | 1.09 | 1.13 | 1.09 | 0.051 | 4.12 | 1,0 | 87.8 | 118.6 | 0.46 | 1.05 | 1.104 | 1.111 | 0.993 | 0.750 | 242,434 | 80 by 124 |
| 3040 + 1/2 | 13.5 | 0.98 | 0.92 | 1.06 | 1.09 | 1.06 | 0.050 | 3.20 | 13,4 | 83.5 | 113.9 | 0.46 | 1.04 | 1.073 | 1.073 | 1.001 | 0.746 | 106,534 | 52 by 72 |
| 3041 | 13.1 | 0.95 | 0.92 | 1.02 | 1.04 | 1.02 | 0.049 | 3.38 | 13,4 | 76.2 | 105.6 | 0.46 | 1.02 | 1.041 | 1.038 | 1.003 | 0.743 | 202,426 | 56 by 88 |
| 3041 + 1/2 | 12.7 | 0.91 | 0.91 | 1.00 | 1.00 | 1.00 | 0.062 | 3.34 | 13,4 | 69.2 | 101.1 | 0.47 | 1.02 | 1.003 | 0.999 | 1.004 | 0.740 | 182,418 | 120 by 120 |
| 3042 | 12.4 | 0.87 | 0.87 | 1.00 | 0.99 | 0.99 | 0.049 | 3.21 | 13,4 | 61.5 | 98.8 | 0.47 | 1.00 | 0.957 | 0.956 | 1.001 | 0.737 | 162,418 | 60 by 76 |
| 3042 + 1/2 | 12.1 | 0.82 | 0.83 | 0.99 | 0.98 | 0.98 | 0.047 | 2.93 | 13,4 | 56.0 | 94.8 | 0.48 | 0.99 | 0.910 | 0.917 | 0.993 | 0.733 | 142,410 | 100 by 108 |
| 3043 | 11.8 | 0.79 | 0.79 | 1.01 | 1.03 | 1.01 | 0.043 | 2.58 | 13,4 | 50.7 | 90.7 | 0.48 | 1.00 | 0.876 | 0.869 | 1.008 | 0.730 | 118,402 | 92 by 104 |
| 3043 + 1/2 | 11.4 | 0.75 | 0.75 | 1.00 | 0.99 | 0.99 | 0.039 | 2.04 | 13,4 | 47.5 | 88.6 | 0.49 | 0.99 | 0.827 | 0.827 | 1.000 | 0.727 | 102,398 | 92 by 96 |
| 3044 | 11.1 | 0.71 | 0.71 | 1.00 | 0.97 | 0.97 | 0.050 | 1.83 | 0,2 | 44.9 | 86.6 | 0.49 | 0.98 | 0.779 | 0.781 | 0.997 | 0.724 | 82,398 | 56 by 76 |
| 3044 + 1/2 | 10.8 | 0.67 | 0.67 | 1.00 | 1.04 | 1.00 | 0.015 | 1.74 | 0,2 | 43.8 | 89.3 | 0.50 | 1.00 | 0.735 | 0.736 | 0.998 | 0.721 | 62,390 | 60 by 68 |
| 3045 | 10.4 | 0.64 | 0.64 | 0.99 | 0.98 | 0.98 | 0.026 | 1.68 | 2,6 | 42.6 | 88.5 | 0.51 | 1.00 | 0.693 | 0.699 | 0.991 | 0.719 | 50,382 | 56 by 108 |
| 3045 + 1/2 | 10.1 | 0.61 | 0.62 | 0.99 | 0.98 | 0.98 | 0.025 | 1.54 | 2,6 | 21.5 | 48.3 | 0.51 | 1.00 | 0.664 | 0.662 | 1.003 | 0.715 | 194,494 | 68 by 76 |
| 3046 | 9.6 | 0.58 | 0.61 | 0.96 | 0.95 | 0.95 | 0.025 | 1.47 | 2,6 | 20.4 | 49.7 | 0.51 | 0.99 | 0.631 | 0.634 | 0.995 | 0.714 | 178,498 | 48 by 60 |
| 3046 + 1/2 | 9.4 | 0.56 | 0.60 | 0.94 | 0.94 | 0.94 | 0.018 | 1.36 | 2,6 | 20.3 | 50.0 | 0.52 | 1.01 | 0.605 | 0.607 | 0.996 | 0.710 | 154,486 | 60 by 64 |
| 3047 | 9.0 | 0.55 | 0.59 | 0.93 | 0.92 | 0.92 | 0.018 | 1.33 | 3,5 | 20.2 | 51.2 | 0.53 | 1.00 | 0.584 | 0.580 | 1.007 | 0.708 | 138,482 | 56 by 76 |
| 3047 + 1/2 | 8.5 | 0.52 | 0.58 | 0.89 | 0.89 | 0.89 | 0.028 | 1.30 | 15,8 | 20.5 | 51.2 | 0.53 | 0.99 | 0.555 | 0.562 | 0.987 | 0.706 | 118,474 | 52 by 60 |
| 3048 | 8.3 | 0.51 | 0.57 | 0.88 | 0.87 | 0.87 | 0.036 | 1.38 | 3,5 | 19.8 | 50.5 | 0.54 | 1.00 | 0.540 | 0.535 | 1.008 | 0.703 | 278,558 | 60 by 64 |
| 3048 + 1/2 | 7.9 | 0.48 | 0.56 | 0.86 | 0.84 | 0.84 | 0.040 | 1.42 | 15,8 | 19.3 | 48.1 | 0.55 | 0.99 | 0.516 | 0.520 | 0.993 | 0.701 | 86,462 | 56 by 80 |
| 3049 | 7.5 | 0.47 | 0.55 | 0.85 | 0.84 | 0.84 | 0.036 | 1.64 | 3,7 | 18.6 | 46.3 | 0.56 | 0.98 | 0.500 | 0.500 | 1.001 | 0.700 | 74,466 | 48 by 68 |
| 3049 + 1/2 | 7.1 | 0.46 | 0.53 | 0.86 | 0.86 | 0.86 | 0.028 | 1.36 | 3,7 | 17.3 | 43.9 | 0.57 | 0.98 | 0.483 | 0.508 | 0.950 | 0.698 | 242,550 | 56 by 112 |
| 3050 | 6.8 | 0.44 | 0.52 | 0.85 | 0.86 | 0.85 | 0.030 | 1.34 | 3,7 | 16.9 | 41.7 | 0.58 | 0.96 | 0.465 | 0.522 | 0.891 | 0.696 | 430,718 | 84 by 68 |
| 3050 + 1/2 | 6.4 | 0.50 | 0.51 | 0.97 | 0.98 | 0.97 | 0.030 | 3.33 | 0,5 | 16.4 | 40.1 | 0.59 | 0.97 | 0.545 | 0.579 | 0.941 | 0.694 | 210,538 | 60 by 64 |
| 3051 | 6.1 | 0.59 | 0.49 | 1.20 | 1.20 | 1.198 | 0.030 | 6.23 | 0,5 | 15.5 | 37.1 | 0.60 | 1.03 | 0.675 | 0.606 | 1.112 | 0.693 | 298,950 | 104 by 64 |
| 3051 + 1/2 | 5.7 | 0.61 | 0.49 | 1.25 | 1.26 | 1.25 | 0.027 | 5.84 | 0,5 | 14.5 | 32.7 | 0.61 | 1.03 | 0.697 | 0.652 | 1.069 | 0.691 | 274,954 | 120 by 68 |
| 3052 | 5.3 | 0.58 | 0.48 | 1.22 | 1.25 | 1.22 | 0.022 | 6.34 | 0,8 | 14.1 | 31.6 | 0.62 | 1.02 | 0.668 | 0.655 | 1.021 | 0.690 | 254,962 | 112 by 68 |
| 3052 + 1/2 | 5.0 | 0.56 | 0.47 | 1.20 | 1.23 | 1.201 | 0.018 | 6.04 | 0,8 | 12.3 | 26.5 | 0.63 | 1.02 | 0.635 | 0.626 | 1.014 | 0.690 | 1866,662 | 104 by 88 |
| 3053 | 4.6 | 0.52 | 0.45 | 1.15 | 1.12 | 1.12 | 0.016 | 5.11 | 0,8 | 10.7 | 26.5 | 0.64 | 1.00 | 0.583 | 0.589 | 0.991 | 0.688 | 54,854 | 48 by 80 |
| 3053 + 1/2 | 4.2 | 0.49 | 0.45 | 1.09 | 1.10 | 1.09 | 0.008 | 4.27 | 0,6 | 9.0 | 19.8 | 0.65 | 1.00 | 0.542 | 0.541 | 1.003 | 0.690 | 138,766 | 68 by 56 |
| 3054 | 3.8 | 0.45 | 0.43 | 1.04 | 1.05 | 1.04 | 0.006 | 4.00 | 0,6 | 7.2 | 15.3 | 0.66 | 0.99 | 0.499 | 0.498 | 1.000 | 0.691 | 118,766 | 116 by 64 |
| 3054 + 1/2 | 3.4 | 0.42 | 0.42 | 1.00 | 1.02 | 1.00 | 0.001 | 3.41 | 0,6 | 4.9 | 10.4 | 0.67 | 1.01 | 0.454 | 0.455 | 0.999 | 0.692 | 46,570 | 128 by 120 |
| 3055 | 3.1 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 2.85 | 5,8 | 3.0 | 6.5 | 0.68 | 1.00 | 0.411 | 0.413 | 0.996 | 0.697 | 698,1070 | 72 by 32 |
| 3055 + 1/2 | 2.6 | 0.36 | 0.36 | 0.98 | 0.98 | 0.98 | 0.000 | 2.04 | 5,8 | 2.1 | 3.5 | 0.69 | 1.00 | 0.371 | 0.374 | 0.992 | 0.698 | 694,1070 | 52 by 20 |
| 3056 | 2.3 | 0.34 | 0.34 | 1.00 | 1.00 | 1.00 | 0.000 | 1.50 | 9,2 | 1.8 | 2.8 | 0.70 | 1.01 | 0.337 | 0.346 | 0.973 | 0.699 | 1910,674 | 20 by 64 |
| 3056 + 1/2 | 1.9 | 0.32 | 0.33 | 0.97 | 0.97 | 0.97 | 0.000 | 1.74 | 0,0 | 1.8 | 2.9 | 0.70 | 1.00 | 0.321 | 0.325 | 0.988 | 0.699 | 182,982 | 128 by 88 |
| 3057 | 1.5 | 0.31 | 0.32 | 0.95 | 0.95 | 0.95 | 0.000 | 1.56 | 12,3 | 1.8 | 2.9 | 0.70 | 1.00 | 0.314 | 0.315 | 0.997 | 0.701 | 366,746 | 64 by 56 |
| 3057 + 1/2 | 1.1 | 0.30 | 0.32 | 0.96 | 0.96 | 0.96 | 0.000 | 2.10 | 14,4 | 1.8 | 3.0 | 0.71 | 1.00 | 0.308 | 0.311 | 0.991 | 0.703 | 246,946 | 64 by 56 |
| 3058 | 0.8 | 0.30 | 0.31 | 0.97 | 0.97 | 0.97 | 0.000 | 1.28 | 15,4 | 1.8 | 2.8 | 0.71 | 0.97 | 0.308 | 0.308 | 1.000 | 0.705 | 134,498 | 100 by 148 |
| 3058 + 1/2 | 0.7 | 0.33 | 0.29 | 1.11 | 1.11 | 1.11 | 0.000 | 3.41 | 5,1 | 1.8 | 3.1 | 0.71 | 1.02 | 0.308 | 0.307 | 1.001 | 0.706 | 298,950 | 88 by 60 |
| 3059 | 0.5 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.06 | 7,7 | 1.8 | 3.1 | 0.71 | 0.96 | 0.306 | 0.307 | 0.996 | 0.706 | 694,538 | 60 by 64 |
| 3059 + 1/2 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 11,5 | 1.8 | 3.2 | 0.71 | 0.99 | 0.307 | 0.306 | 1.005 | 0.706 | 106,490 | 164 by 116 |
| 3060 | 0.5 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.07 | 1,1 | 1.8 | 3.2 | 0.71 | 0.99 | 0.305 | 0.306 | 0.997 | 0.706 | 182,1022 | 100 by 64 |
| 3060 + 1/2 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 5,3 | 1.8 | 3.4 | 0.71 | 0.99 | 0.305 | 0.305 | 0.998 | 0.707 | 270,946 | 96 by 60 |
| 3061 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 5,6 | 1.8 | 3.2 | 0.71 | 1.00 | 0.305 | 0.305 | 1.002 | 0.707 | 702,542 | 72 by 120 |
| 3061 + 1/2 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 2,6 | 1.8 | 3.2 | 0.71 | 1.00 | 0.305 | 0.305 | 1.001 | 0.706 | 1134,470 | 72 by 72 |
| 3062 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 4,7 | 1.9 | 3.2 | 0.71 | 0.99 | 0.305 | 0.305 | 0.997 | 0.707 | 666,586 | 64 by 56 |
| 3062 + 1/2 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 3,5 | 1.9 | 3.2 | 0.71 | 0.99 | 0.305 | 0.304 | 1.004 | 0.706 | 42,490 | 80 by 124 |
| 3063 | 0.5 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.04 | 6,4 | 1.9 | 3.3 | 0.71 | 0.99 | 0.302 | 0.305 | 0.992 | 0.707 | 562,278 | 60 by 56 |
| 3063 + 1/2 | 0.5 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.07 | 7,5 | 2.0 | 3.2 | 0.71 | 1.00 | 0.304 | 0.305 | 0.996 | 0.707 | 938,390 | 108 by 96 |
| 3064 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 0,2 |  |  |  | 0.99 | 0.304 | 0.305 | 0.998 | 0.707 | 94,446 | 84 by 88 |
| 3064 + 1/2 | 0.5 | 0.29 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 1.10 | 1,5 |  |  |  | 1.01 | 0.308 | 0.305 | 1.007 | 0.707 | 462,470 | 100 by 88 |
| 3065 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 1,5 |  |  |  | 1.00 | 0.306 | 0.306 | 1.001 | 0.707 | 686,534 | 96 by 104 |
| 3065 + 1/2 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 5,6 |  |  |  | 1.00 | 0.306 | 0.307 | 1.000 | 0.707 | 1034,486 | 68 by 56 |
| 3066 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 2,7 |  |  |  | 1.00 | 0.306 | 0.307 | 0.997 | 0.708 | 286,946 | 76 by 56 |
| 3066 + 1/2 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 2,4 |  |  |  | 1.00 | 0.307 | 0.306 | 1.002 | 0.707 | 110,978 | 56 by 60 |
| 3067 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 5,5 |  |  |  | 1.00 | 0.307 | 0.305 | 1.006 | 0.707 | 762,346 | 128 by 152 |
| 3067 + 1/2 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 13,4 |  |  |  | 1.00 | 0.305 | 0.306 | 0.997 | 0.707 | 142,1002 | 68 by 72 |
| 3068 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 1,1 |  |  |  | 1.00 | 0.305 | 0.305 | 0.999 | 0.707 | 82,490 | 72 by 84 |
| 3068 + 1/2 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 0,4 |  |  |  | 1.00 | 0.304 | 0.305 | 0.997 | 0.708 | 110,538 | 140 by 120 |
| 3069 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 15,4 |  |  |  | 1.00 | 0.306 | 0.306 | 1.000 | 0.707 | 1066,434 | 76 by 84 |
| 3069 + 1/2 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 0,8 |  |  |  | 1.01 | 0.307 | 0.306 | 1.003 | 0.707 | 50,478 | 84 by 76 |
| 3070 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 1,8 |  |  |  | 1.00 | 0.306 | 0.306 | 0.999 | 0.708 | 134,990 | 52 by 60 |
| 3070 + 1/2 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 7,4 |  |  |  | 1.00 | 0.307 | 0.306 | 1.001 | 0.708 | 842,586 | 72 by 56 |
| 3071 | 0.5 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 5,4 |  |  |  | 0.99 | 0.306 | 0.307 | 0.998 | 0.707 | 290,590 | 64 by 124 |
| 3071 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

### rise (jupiter.rise, frames 3240 to 3314, window 3228 to 3326, 198 draft frames at rate 2)

Largest level step: 0.42 at frame 3266 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.19 from frame 3278 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 6.08 from frame 3247 + 1/2 to the next, block column 0 row 8 from the top left, shown, not judged.
Largest change in place: 120.8 from frame 3252 to 8 film frames later, most at pixel 1864, 556 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 1.40 from frame 3250 to 8 film frames later, most at pixel 1268, 315, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 3228 to 3239 + 1/2): change 12.1, pattern 0.04.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 3278 in /home/user/workspace/work/p6/hj9/04/jupiter-rise-p2of2-pops.png, frame 3278 + 1/2 in /home/user/workspace/work/p6/hj9/04/jupiter-rise-p2of2-pops.png, frame 3280 in /home/user/workspace/work/p6/hj9/04/jupiter-rise-p2of2-pops.png, frame 3280 + 1/2 in /home/user/workspace/work/p6/hj9/04/jupiter-rise-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 3250 in /home/user/workspace/work/p6/hj9/03/jupiter-rise-p1of2-changes.png, frame 3258 + 1/2 in /home/user/workspace/work/p6/hj9/03/jupiter-rise-p1of2-changes.png, frame 3266 + 1/2 in /home/user/workspace/work/p6/hj9/03/jupiter-rise-p1of2-changes.png, frame 3282 in no panel (a slice --frames 6564-6564 draws it).

- RED the pattern of the picture changes in place by 1.40 from frame 3250 to 8 film frames later, band 8 px, limit 0.45 (29 frames over it, first 3244 + 1/2)

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3228 | 48.65 |  | 1.1 | 0.88 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.27 | 0,8 | 12.1 | 20.5 | 0.73 | 0.04 | 0.68 | 8.0 |
| 3228 + 1/2 | 48.56 | 0.00 | 1.1 | 0.88 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.26 | 0,8 | 11.3 | 19.3 | 0.73 | 0.04 | 0.68 | 8.0 |
| 3229 | 48.48 | 0.00 | 1.1 | 0.89 | 0.88 | 1.01 | 1.01 | 1.01 | 0.000 | 1.12 | 3,5 | 10.4 | 18.0 | 0.73 | 0.04 | 0.67 | 8.0 |
| 3229 + 1/2 | 48.40 | 0.00 | 1.1 | 0.87 | 0.88 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 10,4 | 9.6 | 16.9 | 0.73 | 0.04 | 0.67 | 8.0 |
| 3230 | 48.32 | 0.00 | 1.2 | 0.87 | 0.88 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 0,7 | 8.8 | 15.6 | 0.73 | 0.04 | 0.67 | 8.0 |
| 3230 + 1/2 | 48.25 | 0.00 | 1.1 | 0.88 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 1,6 | 8.1 | 14.5 | 0.73 | 0.04 | 0.67 | 8.0 |
| 3231 | 48.18 | 0.00 | 1.1 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 0,7 | 7.5 | 13.5 | 0.73 | 0.04 | 0.67 | 8.0 |
| 3231 + 1/2 | 48.12 | 0.00 | 1.1 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 3,5 | 7.0 | 12.3 | 0.73 | 0.04 | 0.67 | 8.0 |
| 3232 | 48.06 | 0.00 | 1.1 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 0,7 | 6.6 | 11.3 | 0.73 | 0.04 | 0.67 | 8.0 |
| 3232 + 1/2 | 48.00 | 0.00 | 1.2 | 0.88 | 0.87 | 1.01 | 1.01 | 1.01 | 0.000 | 1.16 | 0,7 | 6.1 | 10.5 | 0.73 | 0.04 | 0.67 | 8.0 |
| 3233 | 47.94 | 0.00 | 1.2 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 0,7 | 5.6 | 9.9 | 0.73 | 0.04 | 0.67 | 8.0 |
| 3233 + 1/2 | 47.88 | 0.00 | 1.2 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.15 | 0,7 | 5.2 | 9.2 | 0.73 | 0.04 | 0.67 | 8.0 |
| 3234 | 47.83 | 0.00 | 1.2 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 0,6 | 4.9 | 8.8 | 0.73 | 0.04 | 0.67 | 8.0 |
| 3234 + 1/2 | 47.78 | 0.00 | 1.2 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 0,6 | 4.7 | 9.4 | 0.73 | 0.05 | 0.67 | 8.0 |
| 3235 | 47.73 | 0.00 | 1.2 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.22 | 3,8 | 4.6 | 11.7 | 0.73 | 0.05 | 0.67 | 8.0 |
| 3235 + 1/2 | 47.68 | 0.00 | 1.2 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.19 | 0,6 | 4.5 | 12.8 | 0.73 | 0.06 | 0.67 | 8.0 |
| 3236 | 47.64 | 0.00 | 1.1 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.24 | 3,8 | 4.5 | 13.3 | 0.73 | 0.05 | 0.67 | 8.0 |
| 3236 + 1/2 | 47.59 | 0.00 | 1.2 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.22 | 3,8 | 4.5 | 15.0 | 0.73 | 0.07 | 0.67 | 8.0 |
| 3237 | 47.55 | 0.00 | 1.2 | 0.87 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.30 | 0,6 | 4.7 | 15.1 | 0.73 | 0.08 | 0.66 | 8.0 |
| 3237 + 1/2 | 47.51 | 0.00 | 1.2 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.27 | 3,8 | 4.7 | 13.3 | 0.72 | 0.08 | 0.66 | 8.0 |
| 3238 | 47.47 | 0.00 | 1.2 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.29 | 3,8 | 5.0 | 11.4 | 0.72 | 0.08 | 0.66 | 8.0 |
| 3238 + 1/2 | 47.44 | 0.00 | 1.2 | 0.86 | 0.87 | 0.98 | 0.98 | 0.98 | 0.000 | 1.28 | 0,6 | 5.3 | 11.9 | 0.72 | 0.08 | 0.66 | 8.3 |
| 3239 | 47.41 | 0.00 | 1.2 | 0.86 | 0.87 | 0.98 | 0.98 | 0.98 | 0.000 | 1.27 | 4,5 | 5.7 | 12.5 | 0.72 | 0.09 | 0.66 | 8.4 |
| 3239 + 1/2 | 47.38 | 0.00 | 1.2 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.000 | 1.27 | 4,5 | 6.1 | 12.8 | 0.72 | 0.11 | 0.66 | 8.5 |
| 3240 first | 47.36 | 0.00 | 1.2 | 0.85 | 0.87 | 0.97 | 0.97 | 0.97 | 0.000 | 1.19 | 4,5 | 6.6 | 13.4 | 0.72 | 0.13 | 0.66 | 8.5 |
| 3240 + 1/2 | 47.34 | 0.01 | 1.3 | 0.86 | 0.89 | 0.97 | 0.97 | 0.97 | 0.000 | 1.30 | 12,3 | 7.1 | 14.2 | 0.72 | 0.15 | 0.66 | 8.6 |
| 3241 | 47.34 | 0.00 | 1.5 | 0.91 | 0.96 | 0.95 | 0.95 | 0.95 | 0.000 | 1.42 | 0,6 | 7.8 | 16.0 | 0.72 | 0.17 | 0.66 | 8.7 |
| 3241 + 1/2 | 47.34 | 0.01 | 1.9 | 1.04 | 1.05 | 0.99 | 0.99 | 0.99 | 0.000 | 1.56 | 11,0 | 8.4 | 16.7 | 0.72 | 0.20 | 0.66 | 8.8 |
| 3242 | 47.37 | 0.02 | 2.4 | 1.18 | 1.19 | 1.00 | 1.00 | 1.00 | 0.000 | 2.00 | 13,0 | 9.1 | 18.2 | 0.72 | 0.21 | 0.65 | 8.8 |
| 3242 + 1/2 | 47.44 | 0.02 | 2.9 | 1.33 | 1.31 | 1.02 | 1.02 | 1.02 | 0.003 | 2.13 | 11,0 | 9.9 | 19.1 | 0.72 | 0.23 | 0.65 | 8.9 |
| 3243 | 47.53 | 0.01 | 3.5 | 1.43 | 1.43 | 1.00 | 1.00 | 1.00 | 0.005 | 1.78 | 12,2 | 11.2 | 20.7 | 0.72 | 0.25 | 0.66 | 9.1 |
| 3243 + 1/2 | 47.65 | 0.02 | 4.0 | 1.52 | 1.50 | 1.02 | 1.02 | 1.02 | 0.006 | 1.99 | 12,2 | 12.6 | 22.1 | 0.72 | 0.26 | 0.65 | 9.2 |
| 3244 | 47.80 | 0.01 | 4.6 | 1.57 | 1.57 | 1.00 | 1.00 | 1.00 | 0.006 | 1.75 | 12,2 | 13.7 | 26.7 | 0.72 | 0.27 | 0.65 | 9.2 |
| 3244 + 1/2 | 47.98 | 0.00 | 5.2 | 1.62 | 1.62 | 1.00 | 1.01 | 1.00 | 0.003 | 1.69 | 11,5 | 15.0 | 33.3 | 0.73 | 0.50 | 0.02 | 8.0 |
| 3245 | 48.17 | 0.00 | 5.9 | 1.67 | 1.67 | 1.00 | 0.99 | 0.99 | 0.016 | 1.68 | 11,5 | 16.4 | 40.7 | 0.73 | 0.50 | 0.02 | 8.0 |
| 3245 + 1/2 | 48.36 | 0.01 | 6.4 | 1.72 | 1.72 | 1.00 | 0.99 | 0.99 | 0.021 | 1.63 | 9,6 | 18.0 | 48.1 | 0.73 | 0.53 | 0.03 | 8.0 |
| 3246 | 48.57 | 0.03 | 7.0 | 1.77 | 1.77 | 1.00 | 1.01 | 1.00 | 0.017 | 1.69 | 10,6 | 19.7 | 56.5 | 0.73 | 0.62 | 0.03 | 8.0 |
| 3246 + 1/2 | 48.84 | 0.03 | 7.7 | 1.82 | 1.82 | 1.00 | 1.00 | 1.00 | 0.023 | 1.97 | 0,8 | 21.5 | 64.9 | 0.74 | 0.53 | 0.03 | 8.0 |
| 3247 | 49.17 | 0.04 | 8.5 | 1.87 | 1.87 | 1.00 | 1.00 | 1.00 | 0.022 | 3.56 | 0,8 | 23.6 | 72.1 | 0.74 | 0.55 | 0.04 | 8.0 |
| 3247 + 1/2 | 49.58 | 0.03 | 9.2 | 1.94 | 1.90 | 1.02 | 1.02 | 1.02 | 0.018 | 6.08 | 0,8 | 26.2 | 84.8 | 0.74 | 0.51 | 0.04 | 8.0 |
| 3248 | 49.92 | 0.08 | 9.8 | 1.92 | 1.95 | 0.98 | 0.99 | 0.98 | 0.022 | 5.37 | 0,8 | 30.7 | 101.4 | 0.75 | 0.48 | 0.04 | 8.0 |
| 3248 + 1/2 | 50.42 | 0.01 | 10.6 | 1.96 | 1.95 | 1.00 | 1.00 | 1.00 | 0.025 | 4.23 | 0,8 | 36.9 | 118.5 | 0.75 | 0.60 | 0.04 | 8.0 |
| 3249 | 50.94 | 0.04 | 11.3 | 1.97 | 1.98 | 0.99 | 0.99 | 0.99 | 0.025 | 3.62 | 1,8 | 47.6 | 138.6 | 0.76 | 1.09 | 0.04 | 8.0 |
| 3249 + 1/2 | 51.54 | 0.01 | 12.0 | 2.00 | 2.00 | 1.00 | 1.00 | 1.00 | 0.019 | 3.85 | 2,8 | 76.4 | 157.1 | 0.76 | 0.77 | 0.04 | 8.0 |
| 3250 | 52.17 | 0.05 | 12.8 | 2.04 | 2.04 | 1.00 | 1.01 | 1.00 | 0.008 | 5.03 | 1,8 | 94.2 | 165.7 | 0.77 | 1.40 | 0.04 | 8.0 |
| 3250 + 1/2 | 52.90 | 0.10 | 13.5 | 2.08 | 2.08 | 1.00 | 1.00 | 1.00 | 0.008 | 4.08 | 15,8 | 103.4 | 171.5 | 0.77 | 0.92 | 0.04 | 8.0 |
| 3251 | 53.84 | 0.10 | 14.3 | 2.11 | 2.12 | 1.00 | 1.00 | 1.00 | 0.008 | 3.85 | 5,8 | 113.5 | 168.8 | 0.78 | 1.11 | 0.04 | 8.0 |
| 3251 + 1/2 | 54.98 | 0.09 | 14.9 | 2.16 | 2.15 | 1.00 | 1.01 | 1.00 | 0.008 | 4.03 | 14,8 | 118.7 | 162.6 | 0.78 | 1.19 | 0.04 | 8.0 |
| 3252 | 56.31 | 0.10 | 15.7 | 2.19 | 2.20 | 0.99 | 0.99 | 0.99 | 0.011 | 3.90 | 14,8 | 120.8 | 156.5 | 0.79 | 1.14 | 0.04 | 8.0 |
| 3252 + 1/2 | 57.83 | 0.06 | 16.3 | 2.25 | 2.24 | 1.00 | 1.03 | 1.00 | 0.008 | 3.11 | 5,8 | 120.5 | 150.6 | 0.80 | 1.08 | 0.04 | 8.0 |
| 3253 | 59.48 | 0.03 | 17.2 | 2.31 | 2.27 | 1.02 | 1.06 | 1.02 | 0.016 | 3.27 | 0,7 | 118.1 | 145.7 | 0.80 | 1.13 | 0.04 | 8.0 |
| 3253 + 1/2 | 61.05 | 0.09 | 17.9 | 2.39 | 2.30 | 1.04 | 1.10 | 1.04 | 0.007 | 3.68 | 6,8 | 112.9 | 137.8 | 0.81 | 1.09 | 0.04 | 8.0 |
| 3254 | 62.44 | 0.02 | 18.7 | 2.39 | 2.32 | 1.03 | 1.09 | 1.03 | 0.015 | 3.46 | 6,8 | 106.0 | 128.4 | 0.81 | 0.92 | 0.05 | 8.0 |
| 3254 + 1/2 | 63.87 | 0.11 | 19.4 | 2.29 | 2.32 | 0.98 | 1.03 | 0.98 | 0.015 | 3.25 | 9,8 | 96.5 | 119.3 | 0.82 | 1.08 | 0.05 | 8.0 |
| 3255 | 65.50 | 0.14 | 20.0 | 2.33 | 2.33 | 1.00 | 1.03 | 1.00 | 0.012 | 4.20 | 9,8 | 87.2 | 109.8 | 0.82 | 0.84 | 0.05 | 8.0 |
| 3255 + 1/2 | 67.43 | 0.08 | 20.8 | 2.40 | 2.33 | 1.03 | 1.05 | 1.03 | 0.023 | 4.13 | 9,8 | 77.4 | 99.8 | 0.82 | 0.71 | 0.79 | 11.1 |
| 3256 | 69.51 | 0.06 | 21.5 | 2.42 | 2.34 | 1.03 | 1.06 | 1.03 | 0.017 | 3.87 | 13,3 | 71.9 | 89.6 | 0.83 | 0.60 | 0.80 | 11.0 |
| 3256 + 1/2 | 71.72 | 0.15 | 22.1 | 2.42 | 2.37 | 1.02 | 1.05 | 1.02 | 0.022 | 3.65 | 13,3 | 69.0 | 81.1 | 0.83 | 0.94 | 0.05 | 8.0 |
| 3257 | 74.21 | 0.07 | 22.7 | 2.39 | 2.39 | 1.00 | 1.02 | 1.00 | 0.027 | 3.13 | 12,7 | 67.7 | 80.7 | 0.84 | 0.73 | 0.04 | 8.0 |
| 3257 + 1/2 | 76.85 | 0.05 | 23.4 | 2.44 | 2.39 | 1.02 | 1.03 | 1.02 | 0.028 | 3.05 | 9,7 | 67.4 | 79.2 | 0.84 | 0.81 | 0.04 | 8.0 |
| 3258 | 79.38 | 0.05 | 24.0 | 2.52 | 2.39 | 1.05 | 1.05 | 1.05 | 0.032 | 2.79 | 7,7 | 64.1 | 74.6 | 0.85 | 0.40 | 0.03 | 8.0 |
| 3258 + 1/2 | 82.02 | 0.02 | 24.5 | 2.60 | 2.40 | 1.09 | 1.08 | 1.08 | 0.029 | 3.33 | 3,0 | 56.8 | 66.1 | 0.86 | 0.49 | 0.85 | 8.0 |
| 3259 | 84.62 | 0.06 | 25.2 | 2.56 | 2.40 | 1.06 | 1.04 | 1.04 | 0.036 | 3.56 | 2,0 | 49.6 | 55.4 | 0.86 | 0.32 | 0.85 | 8.0 |
| 3259 + 1/2 | 87.34 | 0.04 | 25.7 | 2.51 | 2.41 | 1.04 | 0.99 | 0.99 | 0.043 | 3.51 | 11,8 | 40.8 | 47.5 | 0.86 | 0.32 | 0.86 | 8.0 |
| 3260 | 89.98 | 0.01 | 26.4 | 2.39 | 2.42 | 0.99 | 0.95 | 0.95 | 0.038 | 3.55 | 10,8 | 36.6 | 41.0 | 0.87 | 0.24 | 0.87 | 8.8 |
| 3260 + 1/2 | 92.60 | 0.09 | 26.9 | 2.34 | 2.43 | 0.96 | 0.92 | 0.92 | 0.044 | 3.75 | 10,8 | 40.4 | 48.3 | 0.88 | 0.31 | 0.87 | 9.4 |
| 3261 | 95.03 | 0.20 | 27.4 | 2.34 | 2.46 | 0.95 | 0.91 | 0.91 | 0.045 | 3.23 | 10,8 | 45.7 | 59.4 | 0.88 | 0.22 | 0.88 | 8.0 |
| 3261 + 1/2 | 97.05 | 0.35 | 27.9 | 2.32 | 2.49 | 0.93 | 0.89 | 0.89 | 0.051 | 2.85 | 10,7 | 49.5 | 66.2 | 0.89 | 0.26 | 0.89 | 8.0 |
| 3262 | 99.78 | 0.08 | 28.3 | 2.32 | 2.51 | 0.92 | 0.90 | 0.90 | 0.051 | 2.63 | 10,7 | 53.9 | 73.3 | 0.90 | 0.24 | 0.02 | 8.0 |
| 3262 + 1/2 | 102.36 | 0.39 | 28.9 | 2.41 | 2.54 | 0.95 | 0.92 | 0.92 | 0.059 | 2.93 | 0,8 | 57.7 | 78.6 | 0.90 | 0.19 | 0.02 | 8.0 |
| 3263 | 104.15 | 0.04 | 29.4 | 2.41 | 2.58 | 0.93 | 0.91 | 0.91 | 0.051 | 2.65 | 1,8 | 63.0 | 82.7 | 0.91 | 0.18 | 0.90 | 8.0 |
| 3263 + 1/2 | 105.87 | 0.20 | 29.9 | 2.47 | 2.64 | 0.94 | 0.91 | 0.91 | 0.065 | 2.44 | 9,7 | 67.4 | 86.2 | 0.92 | 0.19 | 0.91 | 8.0 |
| 3264 | 107.99 | 0.13 | 30.2 | 2.68 | 2.65 | 1.01 | 0.99 | 0.99 | 0.060 | 2.10 | 9,7 | 70.3 | 90.0 | 0.92 | 0.19 | 0.92 | 10.3 |
| 3264 + 1/2 | 109.84 | 0.26 | 30.5 | 2.99 | 2.69 | 1.11 | 1.11 | 1.11 | 0.054 | 2.69 | 9,6 | 75.3 | 97.3 | 0.93 | 0.22 | 0.93 | 12.4 |
| 3265 | 111.17 | 0.02 | 30.9 | 3.06 | 2.75 | 1.12 | 1.10 | 1.10 | 0.053 | 2.59 | 9,6 | 75.8 | 100.3 | 0.94 | 0.17 | 0.93 | 10.2 |
| 3265 + 1/2 | 112.54 | 0.10 | 31.4 | 2.88 | 2.82 | 1.02 | 1.01 | 1.01 | 0.044 | 2.44 | 9,6 | 81.7 | 103.8 | 0.94 | 0.18 | 0.94 | 10.1 |
| 3266 | 113.72 | 0.15 | 31.9 | 2.71 | 2.92 | 0.93 | 0.93 | 0.93 | 0.040 | 2.25 | 12,8 | 86.8 | 104.0 | 0.95 | 0.30 | 0.95 | 9.7 |
| 3266 + 1/2 | 115.19 | 0.42 | 32.3 | 2.78 | 2.98 | 0.94 | 0.94 | 0.94 | 0.031 | 2.19 | 12,8 | 82.7 | 105.2 | 0.96 | 0.49 | 0.95 | 9.2 |
| 3267 | 115.82 | 0.16 | 32.7 | 2.86 | 3.02 | 0.95 | 0.95 | 0.95 | 0.030 | 2.43 | 12,8 | 78.8 | 107.2 | 0.96 | 0.38 | 0.96 | 8.8 |
| 3267 + 1/2 | 116.14 | 0.24 | 33.2 | 2.96 | 3.05 | 0.97 | 0.98 | 0.97 | 0.022 | 2.18 | 12,7 | 77.6 | 107.4 | 0.97 | 0.28 | 0.96 | 9.7 |
| 3268 | 116.94 | 0.16 | 33.6 | 3.24 | 3.05 | 1.06 | 1.08 | 1.06 | 0.021 | 2.76 | 11,8 | 71.4 | 103.8 | 0.97 | 0.18 | 0.96 | 8.9 |
| 3268 + 1/2 | 117.41 | 0.27 | 34.2 | 3.29 | 3.07 | 1.07 | 1.07 | 1.07 | 0.022 | 2.33 | 11,7 | 66.6 | 97.9 | 0.97 | 0.11 | 0.97 | 8.5 |
| 3269 | 117.35 | 0.20 | 34.7 | 3.04 | 3.11 | 0.98 | 0.97 | 0.97 | 0.017 | 2.09 | 10,7 | 61.7 | 89.6 | 0.98 | 0.08 | 0.97 | 8.0 |
| 3269 + 1/2 | 117.69 | 0.13 | 35.1 | 3.07 | 3.13 | 0.98 | 0.98 | 0.98 | 0.009 | 2.02 | 10,7 | 65.7 | 80.5 | 0.98 | 0.06 | 0.98 | 9.6 |
| 3270 | 117.77 | 0.00 | 35.6 | 3.10 | 3.18 | 0.97 | 0.97 | 0.97 | 0.009 | 2.16 | 10,7 | 65.6 | 76.9 | 0.98 | 0.05 | 0.98 | 9.5 |
| 3270 + 1/2 | 117.84 | 0.06 | 36.1 | 3.11 | 3.23 | 0.96 | 0.97 | 0.96 | 0.005 | 2.13 | 10,6 | 64.8 | 79.3 | 0.99 | 0.06 | 0.99 | 9.1 |
| 3271 | 118.04 | 0.02 | 36.6 | 3.14 | 3.24 | 0.97 | 0.98 | 0.97 | 0.005 | 2.29 | 10,6 | 64.8 | 84.0 | 0.99 | 0.05 | 0.99 | 9.0 |
| 3271 + 1/2 | 118.27 | 0.22 | 37.1 | 3.22 | 3.27 | 0.99 | 0.99 | 0.99 | 0.008 | 2.12 | 10,6 | 64.3 | 85.7 | 0.99 | 0.05 | 0.99 | 8.5 |
| 3272 | 118.06 | 0.20 | 37.7 | 3.24 | 3.31 | 0.98 | 0.98 | 0.98 | 0.006 | 1.77 | 9,6 | 63.9 | 87.5 | 0.99 | 0.06 | 0.99 | 8.0 |
| 3272 + 1/2 | 118.25 | 0.21 | 38.2 | 3.33 | 3.36 | 0.99 | 1.00 | 0.99 | 0.002 | 1.73 | 9,6 | 62.7 | 87.0 | 1.00 | 0.06 | 1.00 | 8.0 |
| 3273 | 118.03 | 0.05 | 38.8 | 3.43 | 3.43 | 1.00 | 1.00 | 1.00 | 0.002 | 1.55 | 0,2 | 61.3 | 84.1 | 1.00 | 0.04 | 1.00 | 8.0 |
| 3273 + 1/2 | 117.93 | 0.06 | 39.2 | 3.54 | 3.52 | 1.01 | 1.00 | 1.00 | 0.002 | 1.65 | 10,5 | 59.2 | 78.3 | 1.00 | 0.05 | 1.00 | 11.8 |
| 3274 | 117.94 | 0.01 | 39.6 | 3.60 | 3.61 | 1.00 | 1.00 | 1.00 | 0.001 | 1.92 | 0,4 | 54.9 | 72.6 | 1.00 | 0.03 | 1.00 | 9.2 |
| 3274 + 1/2 | 117.93 | 0.04 | 39.9 | 3.69 | 3.65 | 1.01 | 1.01 | 1.01 | 0.000 | 1.87 | 0,5 | 49.3 | 65.4 | 1.00 | 0.04 | 1.00 | 8.0 |
| 3275 | 117.99 | 0.08 | 39.9 | 3.76 | 3.69 | 1.02 | 1.02 | 1.02 | 0.001 | 1.74 | 3,0 | 42.6 | 57.8 | 1.00 | 0.04 | 1.00 | 8.0 |
| 3275 + 1/2 | 117.90 | 0.13 | 39.8 | 3.88 | 3.73 | 1.04 | 1.04 | 1.04 | 0.000 | 1.82 | 3,0 | 37.5 | 56.5 | 1.00 | 0.06 | 1.00 | 8.0 |
| 3276 | 118.05 | 0.06 | 39.6 | 3.96 | 3.82 | 1.03 | 1.03 | 1.03 | 0.003 | 1.70 | 2,4 | 32.1 | 51.3 | 1.00 | 0.08 | 1.00 | 8.0 |
| 3276 + 1/2 | 118.09 | 0.07 | 39.4 | 4.07 | 3.87 | 1.05 | 1.06 | 1.05 | 0.001 | 2.34 | 3,0 | 28.4 | 41.5 | 1.00 | 0.11 | 1.00 | 8.6 |
| 3277 | 117.98 | 0.08 | 39.2 | 4.17 | 3.87 | 1.08 | 1.09 | 1.08 | 0.000 | 2.71 | 3,0 | 28.8 | 43.8 | 1.00 | 0.12 | 1.00 | 8.0 |
| 3277 + 1/2 | 117.71 | 0.08 | 38.9 | 4.34 | 3.87 | 1.12 | 1.13 | 1.12 | 0.001 | 2.03 | 3,0 | 31.6 | 51.7 | 1.00 | 0.13 | 1.00 | 8.0 |
| 3278 | 117.61 | 0.06 | 38.7 | 4.60 | 3.87 | 1.19 | 1.20 | 1.19 | 0.001 | 2.13 | 3,1 | 34.5 | 57.8 | 1.00 | 0.16 | 1.00 | 8.0 |
| 3278 + 1/2 | 117.37 | 0.11 | 38.5 | 4.54 | 3.87 | 1.17 | 1.19 | 1.17 | 0.002 | 2.04 | 4,1 | 38.6 | 63.6 | 1.00 | 0.19 | 1.00 | 8.0 |
| 3279 | 116.91 | 0.07 | 38.2 | 4.28 | 3.87 | 1.11 | 1.12 | 1.11 | 0.002 | 2.26 | 1,4 | 42.1 | 69.8 | 1.00 | 0.20 | 1.00 | 8.0 |
| 3279 + 1/2 | 116.58 | 0.09 | 37.9 | 4.37 | 3.87 | 1.13 | 1.14 | 1.13 | 0.003 | 2.22 | 14,0 | 45.5 | 75.1 | 1.00 | 0.22 | 1.00 | 8.0 |
| 3280 | 116.08 | 0.19 | 37.6 | 4.57 | 3.87 | 1.18 | 1.20 | 1.18 | 0.000 | 2.28 | 8,8 | 48.4 | 78.7 | 1.00 | 0.22 | 1.00 | 8.0 |
| 3280 + 1/2 | 115.20 | 0.14 | 37.1 | 4.49 | 3.87 | 1.16 | 1.17 | 1.16 | 0.001 | 2.61 | 8,8 | 52.6 | 82.1 | 1.00 | 0.18 | 1.00 | 8.0 |
| 3281 | 114.03 | 0.36 | 36.6 | 4.20 | 3.87 | 1.09 | 1.10 | 1.09 | 0.003 | 2.65 | 8,8 | 57.0 | 85.1 | 0.99 | 0.18 | 0.99 | 8.0 |
| 3281 + 1/2 | 112.15 | 0.19 | 36.0 | 3.70 | 3.92 | 0.94 | 0.94 | 0.94 | 0.006 | 2.65 | 8,8 | 61.9 | 87.1 | 0.97 | 0.21 | 0.97 | 8.0 |
| 3282 | 109.90 | 0.36 | 35.3 | 4.44 | 3.87 | 1.15 | 1.15 | 1.15 | 0.019 | 2.67 | 8,8 | 63.5 | 87.1 | 0.94 | 0.24 | 0.93 | 8.0 |
| 3282 + 1/2 | 106.92 | 0.12 | 34.4 | 4.40 | 3.87 | 1.14 | 1.13 | 1.13 | 0.034 | 2.16 | 6,0 | 62.3 | 84.5 | 0.90 | 0.27 | 0.90 | 8.0 |
| 3283 | 103.71 | 0.22 | 33.7 | 4.19 | 3.87 | 1.08 | 1.06 | 1.06 | 0.057 | 2.43 | 6,0 | 60.7 | 78.9 | 0.87 | 0.28 | 0.87 | 8.0 |
| 3283 + 1/2 | 100.04 | 0.11 | 32.0 | 4.32 | 3.87 | 1.12 | 1.09 | 1.09 | 0.065 | 2.39 | 9,8 | 59.7 | 71.8 | 0.84 | 0.32 | 0.84 | 8.0 |
| 3284 | 96.61 | 0.05 | 32.1 | 4.32 | 3.78 | 1.14 | 1.10 | 1.10 | 0.111 | 2.89 | 9,8 | 57.5 | 64.4 | 0.81 | 0.30 | 0.81 | 8.0 |
| 3284 + 1/2 | 93.28 | 0.12 | 32.7 | 3.86 | 3.69 | 1.05 | 1.03 | 1.03 | 0.088 | 2.41 | 9,8 | 54.2 | 60.0 | 0.79 | 0.32 | 0.78 | 8.0 |
| 3285 | 89.71 | 0.04 | 31.0 | 3.68 | 3.52 | 1.05 | 0.98 | 0.98 | 0.125 | 1.95 | 9,7 | 52.0 | 57.2 | 0.76 | 0.30 | 0.76 | 8.0 |
| 3285 + 1/2 | 86.22 | 0.03 | 31.7 | 3.27 | 3.51 | 0.93 | 0.90 | 0.90 | 0.143 | 1.93 | 9,7 | 51.2 | 54.5 | 0.74 | 0.35 | 0.73 | 8.0 |
| 3286 | 82.79 | 0.08 | 37.0 | 3.15 | 3.30 | 0.95 | 0.93 | 0.93 | 0.097 | 1.97 | 15,5 | 49.1 | 52.8 | 0.71 | 0.42 | 0.71 | 8.0 |
| 3286 + 1/2 | 79.52 | 0.01 | 39.0 | 3.11 | 3.26 | 0.95 | 0.98 | 0.95 | 0.070 | 2.43 | 15,4 | 48.5 | 51.2 | 0.69 | 0.24 | 0.68 | 8.0 |
| 3287 | 76.26 | 0.30 | 38.9 | 3.34 | 3.13 | 1.07 | 1.09 | 1.07 | 0.063 | 3.23 | 15,4 | 47.0 | 49.9 | 0.66 | 0.26 | 0.66 | 8.0 |
| 3287 + 1/2 | 73.61 | 0.01 | 38.5 | 3.26 | 3.03 | 1.08 | 1.08 | 1.08 | 0.075 | 3.60 | 15,4 | 43.5 | 47.5 | 0.64 | 0.21 | 0.63 | 8.0 |
| 3288 | 70.96 | 0.14 | 37.9 | 2.95 | 2.90 | 1.02 | 1.02 | 1.02 | 0.078 | 2.51 | 15,4 | 39.7 | 43.6 | 0.62 | 0.18 | 0.61 | 8.0 |
| 3288 + 1/2 | 68.05 | 0.03 | 37.0 | 2.69 | 2.72 | 0.99 | 0.97 | 0.97 | 0.088 | 3.19 | 14,4 | 36.5 | 40.9 | 0.59 | 0.17 | 0.59 | 8.0 |
| 3289 | 65.20 | 0.04 | 36.6 | 2.49 | 2.50 | 1.00 | 1.03 | 1.00 | 0.061 | 3.38 | 14,4 | 33.7 | 37.9 | 0.57 | 0.12 | 0.55 | 8.0 |
| 3289 + 1/2 | 62.43 | 0.06 | 35.6 | 2.31 | 2.30 | 1.00 | 0.99 | 0.99 | 0.082 | 2.16 | 14,4 | 30.9 | 34.8 | 0.54 | 0.10 | 0.52 | 8.0 |
| 3290 | 59.78 | 0.01 | 34.7 | 2.10 | 2.16 | 0.97 | 0.97 | 0.97 | 0.080 | 2.14 | 13,4 | 28.2 | 31.9 | 0.51 | 0.10 | 0.49 | 8.0 |
| 3290 + 1/2 | 57.10 | 0.08 | 33.8 | 1.99 | 2.06 | 0.97 | 0.96 | 0.96 | 0.089 | 2.33 | 13,4 | 26.3 | 29.5 | 0.48 | 0.09 | 0.46 | 8.0 |
| 3291 | 54.57 | 0.18 | 32.6 | 2.02 | 1.94 | 1.04 | 1.05 | 1.04 | 0.082 | 1.75 | 13,4 | 24.3 | 27.6 | 0.48 | 0.08 | 0.43 | 8.0 |
| 3291 + 1/2 | 52.41 | 0.02 | 32.0 | 1.88 | 1.82 | 1.03 | 1.02 | 1.02 | 0.090 | 1.66 | 12,4 | 22.0 | 25.1 | 0.46 | 0.07 | 0.41 | 8.0 |
| 3292 | 50.28 | 0.02 | 31.0 | 1.65 | 1.74 | 0.95 | 0.94 | 0.94 | 0.087 | 2.28 | 14,8 | 19.6 | 24.9 | 0.43 | 0.06 | 0.38 | 8.0 |
| 3292 + 1/2 | 48.10 | 0.05 | 29.8 | 1.60 | 1.58 | 1.01 | 1.01 | 1.01 | 0.077 | 2.06 | 12,4 | 18.1 | 24.7 | 0.41 | 0.06 | 0.36 | 8.0 |
| 3293 | 46.02 | 0.06 | 29.5 | 1.51 | 1.55 | 0.98 | 0.98 | 0.98 | 0.080 | 2.19 | 12,4 | 16.7 | 24.0 | 0.39 | 0.06 | 0.34 | 8.0 |
| 3293 + 1/2 | 44.07 | 0.07 | 28.6 | 1.47 | 1.51 | 0.98 | 0.99 | 0.98 | 0.075 | 1.82 | 1,6 | 15.4 | 23.8 | 0.38 | 0.04 | 0.32 | 8.0 |
| 3294 | 42.26 | 0.10 | 27.8 | 1.50 | 1.47 | 1.02 | 0.99 | 0.99 | 0.096 | 2.49 | 13,8 | 14.0 | 24.1 | 0.36 | 0.04 | 0.31 | 8.0 |
| 3294 + 1/2 | 40.65 | 0.02 | 26.8 | 1.48 | 1.45 | 1.02 | 1.02 | 1.02 | 0.071 | 2.05 | 0,0 | 12.5 | 24.4 | 0.35 | 0.04 | 0.29 | 8.0 |
| 3295 | 39.00 | 0.02 | 26.5 | 1.43 | 1.44 | 0.99 | 1.01 | 0.99 | 0.068 | 1.86 | 0,1 | 11.4 | 24.5 | 0.34 | 0.03 | 0.28 | 8.0 |
| 3295 + 1/2 | 37.31 | 0.06 | 25.3 | 1.40 | 1.41 | 0.99 | 0.99 | 0.99 | 0.078 | 1.96 | 1,0 | 10.8 | 23.2 | 0.33 | 0.03 | 0.26 | 8.0 |
| 3296 | 35.75 | 0.06 | 24.7 | 1.40 | 1.39 | 1.01 | 1.01 | 1.01 | 0.079 | 1.82 | 1,1 | 10.5 | 23.7 | 0.32 | 0.03 | 0.25 | 8.0 |
| 3296 + 1/2 | 34.30 | 0.05 | 23.6 | 1.38 | 1.37 | 1.00 | 1.01 | 1.00 | 0.083 | 2.58 | 15,0 | 10.3 | 23.6 | 0.31 | 0.02 | 0.24 | 8.0 |
| 3297 | 32.96 | 0.03 | 22.8 | 1.26 | 1.36 | 0.93 | 0.93 | 0.93 | 0.070 | 1.64 | 1,0 | 10.0 | 22.8 | 0.30 | 0.02 | 0.23 | 8.0 |
| 3297 + 1/2 | 31.66 | 0.03 | 22.0 | 1.30 | 1.33 | 0.98 | 1.01 | 0.98 | 0.051 | 2.25 | 15,0 | 9.8 | 21.7 | 0.29 | 0.02 | 0.22 | 8.0 |
| 3298 | 30.43 | 0.05 | 20.7 | 1.28 | 1.30 | 0.98 | 0.98 | 0.98 | 0.064 | 2.03 | 15,2 | 9.3 | 20.6 | 0.28 | 0.04 | 0.21 | 8.0 |
| 3298 + 1/2 | 29.31 | 0.04 | 20.0 | 1.31 | 1.29 | 1.02 | 1.01 | 1.01 | 0.073 | 2.16 | 15,2 | 9.1 | 19.0 | 0.27 | 0.04 | 0.20 | 8.0 |
| 3299 | 28.27 | 0.04 | 19.3 | 1.18 | 1.29 | 0.92 | 0.87 | 0.87 | 0.087 | 2.23 | 15,2 | 8.9 | 17.9 | 0.26 | 0.04 | 0.19 | 8.0 |
| 3299 + 1/2 | 27.31 | 0.04 | 18.1 | 1.35 | 1.26 | 1.07 | 1.03 | 1.03 | 0.080 | 2.78 | 15,2 | 8.8 | 17.3 | 0.25 | 0.04 | 0.18 | 8.0 |
| 3300 | 26.43 | 0.02 | 17.2 | 1.25 | 1.26 | 1.00 | 0.94 | 0.94 | 0.094 | 2.48 | 15,2 | 8.6 | 16.5 | 0.25 | 0.04 | 0.18 | 8.0 |
| 3300 + 1/2 | 25.59 | 0.03 | 17.0 | 1.22 | 1.25 | 0.98 | 0.93 | 0.93 | 0.097 | 1.76 | 5,7 | 8.4 | 15.6 | 0.24 | 0.04 | 0.17 | 8.0 |
| 3301 | 24.81 | 0.03 | 16.2 | 1.30 | 1.23 | 1.06 | 1.00 | 1.00 | 0.086 | 2.06 | 5,7 | 8.4 | 15.3 | 0.24 | 0.04 | 0.16 | 8.0 |
| 3301 + 1/2 | 24.09 | 0.02 | 15.0 | 1.21 | 1.23 | 0.98 | 0.94 | 0.94 | 0.084 | 2.02 | 13,0 | 8.2 | 14.7 | 0.23 | 0.05 | 0.16 | 8.0 |
| 3302 | 23.43 | 0.03 | 14.7 | 1.14 | 1.21 | 0.94 | 0.87 | 0.87 | 0.097 | 1.40 | 7,1 | 7.8 | 13.7 | 0.22 | 0.06 | 0.15 | 8.0 |
| 3302 + 1/2 | 22.83 | 0.03 | 14.1 | 1.24 | 1.19 | 1.04 | 1.00 | 1.00 | 0.051 | 1.75 | 15,3 | 7.4 | 12.5 | 0.22 | 0.05 | 0.15 | 8.0 |
| 3303 | 22.28 | 0.03 | 13.2 | 1.25 | 1.18 | 1.06 | 1.02 | 1.02 | 0.056 | 1.71 | 3,3 | 7.0 | 11.0 | 0.21 | 0.05 | 0.14 | 8.0 |
| 3303 + 1/2 | 21.79 | 0.02 | 12.8 | 1.17 | 1.18 | 0.99 | 0.98 | 0.98 | 0.053 | 1.54 | 14,1 | 6.7 | 10.3 | 0.20 | 0.06 | 0.14 | 8.0 |
| 3304 | 21.33 | 0.02 | 11.9 | 1.17 | 1.18 | 0.99 | 1.01 | 0.99 | 0.037 | 1.69 | 13,0 | 6.4 | 8.9 | 0.19 | 0.05 | 0.13 | 8.0 |
| 3304 + 1/2 | 20.91 | 0.02 | 11.1 | 1.20 | 1.17 | 1.03 | 1.05 | 1.03 | 0.033 | 1.66 | 14,1 | 6.4 | 7.8 | 0.19 | 0.04 | 0.13 | 8.0 |
| 3305 | 20.53 | 0.02 | 10.0 | 1.17 | 1.17 | 1.00 | 1.04 | 1.00 | 0.023 | 1.58 | 8,1 | 6.8 | 8.2 | 0.19 | 0.04 | 0.12 | 8.0 |
| 3305 + 1/2 | 20.19 | 0.01 | 9.3 | 1.06 | 1.17 | 0.91 | 0.95 | 0.91 | 0.026 | 1.74 | 14,3 | 7.2 | 8.9 | 0.18 | 0.03 | 0.12 | 8.0 |
| 3306 | 19.88 | 0.01 | 8.5 | 1.10 | 1.17 | 0.94 | 0.99 | 0.94 | 0.009 | 1.83 | 14,3 | 7.2 | 9.0 | 0.18 | 0.02 | 0.12 | 8.0 |
| 3306 + 1/2 | 19.59 | 0.01 | 7.8 | 1.17 | 1.13 | 1.03 | 1.06 | 1.03 | 0.012 | 1.79 | 14,2 | 7.4 | 9.2 | 0.18 | 0.02 | 0.12 | 8.1 |
| 3307 | 19.33 | 0.01 | 7.0 | 1.18 | 1.12 | 1.05 | 1.08 | 1.05 | 0.017 | 1.95 | 14,3 | 7.3 | 9.2 | 0.17 | 0.02 | 0.11 | 8.0 |
| 3307 + 1/2 | 19.10 | 0.01 | 6.1 | 1.09 | 1.12 | 0.97 | 0.99 | 0.97 | 0.012 | 1.66 | 14,8 | 7.3 | 9.2 | 0.17 | 0.02 | 0.11 | 8.0 |
| 3308 | 18.88 | 0.01 | 5.5 | 1.06 | 1.11 | 0.95 | 0.97 | 0.95 | 0.017 | 1.76 | 13,2 | 7.2 | 9.0 | 0.17 | 0.01 | 0.11 | 8.0 |
| 3308 + 1/2 | 18.68 | 0.01 | 4.7 | 1.06 | 1.09 | 0.97 | 0.98 | 0.97 | 0.014 | 1.89 | 11,0 | 7.0 | 8.7 | 0.16 | 0.01 | 0.11 | 8.0 |
| 3309 | 18.50 | 0.01 | 4.0 | 1.12 | 1.08 | 1.04 | 1.06 | 1.04 | 0.007 | 1.74 | 14,2 | 7.0 | 8.6 | 0.16 | 0.01 | 0.11 | 8.0 |
| 3309 + 1/2 | 18.34 | 0.01 | 3.3 | 1.17 | 1.06 | 1.10 | 1.12 | 1.10 | 0.001 | 1.91 | 4,5 | 6.8 | 8.4 | 0.16 | 0.01 | 0.10 | 8.0 |
| 3310 | 18.19 | 0.01 | 3.0 | 1.13 | 1.06 | 1.07 | 1.08 | 1.07 | 0.006 | 1.88 | 4,5 | 6.6 | 8.3 | 0.16 | 0.01 | 0.10 | 8.0 |
| 3310 + 1/2 | 18.07 | 0.01 | 2.4 | 1.09 | 1.04 | 1.04 | 1.05 | 1.04 | 0.007 | 1.86 | 4,7 | 6.5 | 8.0 | 0.16 | 0.01 | 0.10 | 8.0 |
| 3311 | 17.96 | 0.01 | 1.9 | 1.03 | 1.00 | 1.03 | 1.04 | 1.03 | 0.007 | 1.93 | 4,7 | 6.5 | 7.9 | 0.15 | 0.01 | 0.10 | 8.0 |
| 3311 + 1/2 | 17.87 | 0.01 | 1.5 | 0.94 | 0.93 | 1.00 | 1.00 | 1.00 | 0.010 | 1.92 | 13,2 | 6.4 | 7.8 | 0.16 | 0.02 | 0.10 | 8.0 |
| 3312 | 17.80 | 0.01 | 1.1 | 0.84 | 0.84 | 1.00 | 1.01 | 1.00 | 0.004 | 1.64 | 15,6 | 6.4 | 7.8 | 0.16 | 0.02 | 0.10 | 8.0 |
| 3312 + 1/2 | 17.74 | 0.01 | 0.9 | 0.73 | 0.73 | 1.00 | 1.00 | 1.00 | 0.002 | 1.65 | 13,7 | 6.1 | 7.3 | 0.16 | 0.02 | 0.10 | 8.0 |
| 3313 | 17.70 | 0.01 | 0.8 | 0.63 | 0.67 | 0.94 | 0.94 | 0.94 | 0.015 | 1.42 | 15,3 | 5.5 | 6.5 | 0.15 | 0.02 | 0.10 | 8.0 |
| 3313 + 1/2 | 17.68 | 0.01 | 0.6 | 0.55 | 0.62 | 0.88 | 0.89 | 0.88 | 0.011 | 1.13 | 15,3 | 5.1 | 6.2 | 0.15 | 0.03 | 0.10 | 8.1 |
| 3314 last | 17.67 | 0.01 | 0.6 | 0.50 | 0.61 | 0.82 | 0.83 | 0.82 | 0.000 | 1.08 | 8,5 | 5.0 | 6.2 | 0.15 | 0.02 | 0.10 | 8.1 |
| 3314 + 1/2 | 17.67 | 0.00 | 0.5 | 0.48 | 0.61 | 0.78 | 0.79 | 0.78 | 0.001 | 1.09 | 9,5 | 5.1 | 6.1 | 0.15 | 0.02 | 0.10 | 8.1 |
| 3315 | 17.67 | 0.00 | 0.4 | 0.47 | 0.61 | 0.77 | 0.78 | 0.77 | 0.004 | 1.03 | 11,2 | 5.3 | 7.1 | 0.15 | 0.02 | 0.10 | 8.0 |
| 3315 + 1/2 | 17.67 | 0.00 | 0.4 | 0.47 | 0.61 | 0.77 | 0.78 | 0.77 | 0.003 | 1.05 | 8,1 | 5.3 | 7.5 | 0.15 | 0.03 | 0.10 | 8.0 |
| 3316 | 17.67 | 0.00 | 0.4 | 0.46 | 0.61 | 0.76 | 0.77 | 0.76 | 0.003 | 1.07 | 11,4 | 5.1 | 7.7 | 0.15 | 0.03 | 0.10 | 8.0 |
| 3316 + 1/2 | 17.67 | 0.00 | 0.5 | 0.47 | 0.61 | 0.77 | 0.78 | 0.77 | 0.013 | 1.08 | 11,3 | 5.0 | 7.8 | 0.15 | 0.03 | 0.10 | 8.0 |
| 3317 | 17.67 | 0.00 | 0.5 | 0.47 | 0.61 | 0.78 | 0.79 | 0.78 | 0.007 | 1.03 | 12,6 | 5.1 | 8.4 | 0.15 | 0.03 | 0.10 | 8.0 |
| 3317 + 1/2 | 17.67 | 0.00 | 0.4 | 0.49 | 0.61 | 0.80 | 0.81 | 0.80 | 0.004 | 1.05 | 9,4 | 5.4 | 9.6 | 0.15 | 0.04 | 0.10 | 8.0 |
| 3318 | 17.67 | 0.00 | 0.5 | 0.51 | 0.61 | 0.83 | 0.85 | 0.83 | 0.002 | 1.13 | 9,5 | 5.3 | 10.4 | 0.15 | 0.05 | 0.10 | 8.0 |
| 3318 + 1/2 | 17.67 | 0.00 | 0.6 | 0.53 | 0.61 | 0.86 | 0.88 | 0.86 | 0.000 | 1.25 | 9,4 | 5.4 | 10.4 | 0.15 | 0.05 | 0.10 | 8.0 |
| 3319 | 17.68 | 0.00 | 0.7 | 0.54 | 0.61 | 0.88 | 0.90 | 0.88 | 0.003 | 1.31 | 9,6 |  |  |  |  |  |  |
| 3319 + 1/2 | 17.68 | 0.00 | 0.9 | 0.53 | 0.61 | 0.87 | 0.88 | 0.87 | 0.001 | 1.21 | 9,6 |  |  |  |  |  |  |
| 3320 | 17.68 | 0.00 | 1.0 | 0.50 | 0.61 | 0.82 | 0.82 | 0.82 | 0.007 | 1.25 | 10,1 |  |  |  |  |  |  |
| 3320 + 1/2 | 17.70 | 0.00 | 1.3 | 0.56 | 0.61 | 0.92 | 0.91 | 0.91 | 0.014 | 1.78 | 10,1 |  |  |  |  |  |  |
| 3321 | 17.71 | 0.00 | 1.5 | 0.61 | 0.60 | 1.02 | 1.02 | 1.02 | 0.013 | 1.82 | 7,3 |  |  |  |  |  |  |
| 3321 + 1/2 | 17.72 | 0.00 | 1.9 | 0.59 | 0.61 | 0.96 | 0.98 | 0.96 | 0.005 | 2.02 | 7,3 |  |  |  |  |  |  |
| 3322 | 17.75 | 0.00 | 2.2 | 0.61 | 0.62 | 0.98 | 1.01 | 0.98 | 0.003 | 2.04 | 7,3 |  |  |  |  |  |  |
| 3322 + 1/2 | 17.77 | 0.00 | 2.6 | 0.64 | 0.62 | 1.04 | 1.05 | 1.04 | 0.019 | 2.21 | 7,3 |  |  |  |  |  |  |
| 3323 | 17.81 | 0.01 | 3.0 | 0.63 | 0.64 | 0.98 | 0.97 | 0.97 | 0.019 | 2.03 | 7,3 |  |  |  |  |  |  |
| 3323 + 1/2 | 17.85 | 0.00 | 3.4 | 0.68 | 0.64 | 1.07 | 1.05 | 1.05 | 0.023 | 2.32 | 7,4 |  |  |  |  |  |  |
| 3324 | 17.90 | 0.00 | 3.9 | 0.63 | 0.65 | 0.97 | 1.00 | 0.97 | 0.013 | 2.10 | 7,4 |  |  |  |  |  |  |
| 3324 + 1/2 | 17.96 | 0.00 | 4.4 | 0.67 | 0.65 | 1.03 | 1.05 | 1.03 | 0.016 | 2.26 | 7,4 |  |  |  |  |  |  |
| 3325 | 18.02 | 0.00 | 4.8 | 0.64 | 0.66 | 0.98 | 1.00 | 0.98 | 0.018 | 2.17 | 11,8 |  |  |  |  |  |  |
| 3325 + 1/2 | 18.10 | 0.00 | 5.4 | 0.70 | 0.66 | 1.06 | 1.04 | 1.04 | 0.030 | 2.09 | 12,8 |  |  |  |  |  |  |
| 3326 | 18.18 | 0.00 | 6.0 | 0.66 | 0.66 | 0.99 | 0.97 | 0.97 | 0.022 | 2.62 | 12,8 |  |  |  |  |  |  |
| 3326 + 1/2 | 18.26 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### rise, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.51 from frame 3278 to the next, limit 1.2.
Largest pop score of one block: 6.93 from frame 3255 + 1/2 to the next, block column 13 row 3 from the top left, shown, not judged.
Largest change in place: 121.0 from frame 3252 to 8 film frames later, most at pixel 1840, 544, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 3228 to 3239 + 1/2): change 11.2; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.309 from frame 3268 + 1/2 to the next, most at pixel 1674, 122, a patch of 304 by 332 px; 3 of 197 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 198 rows, which says nothing of them, quiet or not: frame 3326 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 3268 in /home/user/workspace/work/p6/hj9/03/jupiter-rise-p1of2-pops-full.png, frame 3268 + 1/2 in /home/user/workspace/work/p6/hj9/03/jupiter-rise-p1of2-pops-full.png, frame 3278 in /home/user/workspace/work/p6/hj9/04/jupiter-rise-p2of2-pops-full.png, frame 3284 in /home/user/workspace/work/p6/hj9/04/jupiter-rise-p2of2-pops-full.png.

With the carry at the full size the rise has 2 numbers over the limit or not measured.

- FULL SIZE RED pop score 1.51 from frame 3278 to the next, limit 1.2 (19 frames over it, first 3258)
- FULL SIZE RED the pattern of the picture changes in place by 1.40 from frame 3250 to 8 film frames later, band 8 px, limit 0.45 (29 frames over it, first 3244 + 1/2)

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3228 | 1.1 | 0.30 | 0.30 | 1.01 | 1.01 | 1.01 | 0.000 | 1.32 | 7,8 | 11.2 | 20.1 | 0.73 | 1.00 | 0.319 | 0.319 | 1.000 | 0.720 | 6,578 | 64 by 68 |
| 3228 + 1/2 | 1.1 | 0.30 | 0.30 | 1.01 | 1.01 | 1.01 | 0.000 | 1.30 | 7,8 | 10.4 | 18.9 | 0.73 | 1.00 | 0.318 | 0.318 | 1.002 | 0.720 | 6,738 | 24 by 56 |
| 3229 | 1.1 | 0.30 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 1.36 | 7,8 | 9.6 | 17.6 | 0.73 | 1.01 | 0.316 | 0.317 | 0.998 | 0.720 | 6,954 | 24 by 48 |
| 3229 + 1/2 | 1.1 | 0.30 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 1.41 | 7,8 | 8.7 | 16.4 | 0.73 | 0.99 | 0.315 | 0.315 | 1.001 | 0.720 | 250,446 | 72 by 60 |
| 3230 | 1.2 | 0.30 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 1.34 | 7,8 | 8.0 | 15.2 | 0.73 | 1.00 | 0.314 | 0.314 | 1.000 | 0.720 | 6,958 | 36 by 56 |
| 3230 + 1/2 | 1.1 | 0.30 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 1.30 | 7,8 | 7.3 | 14.1 | 0.73 | 1.00 | 0.313 | 0.314 | 0.998 | 0.720 | 6,838 | 32 by 52 |
| 3231 | 1.1 | 0.30 | 0.29 | 1.01 | 1.01 | 1.01 | 0.000 | 1.30 | 7,8 | 6.6 | 13.0 | 0.73 | 1.00 | 0.313 | 0.311 | 1.005 | 0.720 | 6,726 | 28 by 64 |
| 3231 + 1/2 | 1.1 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 7,7 | 6.0 | 11.9 | 0.73 | 1.00 | 0.310 | 0.311 | 0.995 | 0.720 | 790,578 | 72 by 56 |
| 3232 | 1.1 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 2,3 | 5.4 | 10.8 | 0.73 | 1.00 | 0.308 | 0.310 | 0.995 | 0.720 | 638,302 | 52 by 56 |
| 3232 + 1/2 | 1.2 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 5,0 | 4.9 | 9.9 | 0.73 | 1.01 | 0.309 | 0.308 | 1.006 | 0.720 | 6,566 | 36 by 68 |
| 3233 | 1.2 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.07 | 5,3 | 4.4 | 9.1 | 0.73 | 1.00 | 0.306 | 0.308 | 0.993 | 0.720 | 466,238 | 80 by 76 |
| 3233 + 1/2 | 1.2 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 5,6 | 4.0 | 8.2 | 0.73 | 0.99 | 0.307 | 0.305 | 1.008 | 0.720 | 750,254 | 60 by 60 |
| 3234 | 1.2 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 3,6 | 3.6 | 7.5 | 0.73 | 1.00 | 0.304 | 0.305 | 0.999 | 0.720 | 54,582 | 104 by 96 |
| 3234 + 1/2 | 1.2 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 0,7 | 3.3 | 6.8 | 0.73 | 1.00 | 0.304 | 0.304 | 1.000 | 0.720 | 150,602 | 60 by 56 |
| 3235 | 1.2 | 0.29 | 0.29 | 0.99 | 0.99 | 0.99 | 0.000 | 1.06 | 12,4 | 3.0 | 6.1 | 0.73 | 0.99 | 0.303 | 0.303 | 1.002 | 0.720 | 294,446 | 156 by 80 |
| 3235 + 1/2 | 1.2 | 0.29 | 0.29 | 0.98 | 0.98 | 0.98 | 0.000 | 1.05 | 3,0 | 2.8 | 5.5 | 0.73 | 0.99 | 0.300 | 0.302 | 0.992 | 0.720 | 42,710 | 84 by 72 |
| 3236 | 1.1 | 0.29 | 0.29 | 0.98 | 0.98 | 0.98 | 0.000 | 1.09 | 8,3 | 2.7 | 5.0 | 0.73 | 0.99 | 0.302 | 0.301 | 1.003 | 0.720 | 326,478 | 80 by 60 |
| 3236 + 1/2 | 1.2 | 0.29 | 0.29 | 0.98 | 0.98 | 0.98 | 0.000 | 1.08 | 12,6 | 2.6 | 6.4 | 0.73 | 0.99 | 0.301 | 0.300 | 1.005 | 0.719 | 6,806 | 56 by 60 |
| 3237 | 1.2 | 0.29 | 0.29 | 0.98 | 0.98 | 0.98 | 0.000 | 1.08 | 5,2 | 2.6 | 6.6 | 0.73 | 0.99 | 0.300 | 0.301 | 0.996 | 0.719 | 838,354 | 132 by 116 |
| 3237 + 1/2 | 1.2 | 0.29 | 0.29 | 0.98 | 0.98 | 0.98 | 0.000 | 1.08 | 1,6 | 2.6 | 6.1 | 0.72 | 0.99 | 0.300 | 0.300 | 1.000 | 0.719 | 6,786 | 36 by 52 |
| 3238 | 1.2 | 0.29 | 0.29 | 0.98 | 0.98 | 0.98 | 0.000 | 1.05 | 7,0 | 2.7 | 4.8 | 0.72 | 0.99 | 0.300 | 0.300 | 1.000 | 0.719 | 1110,470 | 72 by 92 |
| 3238 + 1/2 | 1.2 | 0.29 | 0.29 | 0.98 | 0.98 | 0.98 | 0.000 | 1.08 | 0,4 | 2.8 | 4.5 | 0.72 | 0.98 | 0.300 | 0.299 | 1.004 | 0.719 | 6,726 | 72 by 144 |
| 3239 | 1.2 | 0.29 | 0.29 | 0.98 | 0.98 | 0.98 | 0.000 | 1.06 | 7,3 | 3.0 | 4.9 | 0.72 | 0.98 | 0.299 | 0.299 | 1.000 | 0.719 | 194,374 | 72 by 60 |
| 3239 + 1/2 | 1.2 | 0.28 | 0.29 | 0.97 | 0.97 | 0.97 | 0.000 | 1.09 | 0,6 | 3.3 | 5.5 | 0.72 | 0.99 | 0.298 | 0.298 | 0.998 | 0.719 | 26,786 | 72 by 64 |
| 3240 | 1.2 | 0.28 | 0.29 | 0.97 | 0.97 | 0.97 | 0.000 | 1.08 | 4,5 | 3.7 | 6.2 | 0.72 | 0.97 | 0.297 | 0.296 | 1.004 | 0.719 | 482,238 | 76 by 60 |
| 3240 + 1/2 | 1.3 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.85 | 12,3 | 4.2 | 7.3 | 0.72 | 0.97 | 0.294 | 0.298 | 0.989 | 0.719 | 298,454 | 112 by 96 |
| 3241 | 1.5 | 0.29 | 0.30 | 0.98 | 0.98 | 0.98 | 0.000 | 1.17 | 0,6 | 4.7 | 8.1 | 0.72 | 0.95 | 0.295 | 0.302 | 0.978 | 0.719 | 6,746 | 44 by 92 |
| 3241 + 1/2 | 1.9 | 0.30 | 0.31 | 0.98 | 0.98 | 0.98 | 0.000 | 1.19 | 0,6 | 5.3 | 9.2 | 0.72 | 0.99 | 0.306 | 0.310 | 0.987 | 0.719 | 34,734 | 104 by 88 |
| 3242 | 2.4 | 0.32 | 0.32 | 1.01 | 1.01 | 1.01 | 0.000 | 1.18 | 0,6 | 6.1 | 10.2 | 0.72 | 1.00 | 0.325 | 0.320 | 1.015 | 0.720 | 62,774 | 60 by 64 |
| 3242 + 1/2 | 2.9 | 0.33 | 0.33 | 1.00 | 1.00 | 1.00 | 0.003 | 1.27 | 1,0 | 7.0 | 11.0 | 0.72 | 1.02 | 0.334 | 0.335 | 0.997 | 0.721 | 394,502 | 72 by 60 |
| 3243 | 3.5 | 0.34 | 0.34 | 1.00 | 1.00 | 1.00 | 0.005 | 1.19 | 0,6 | 7.9 | 13.4 | 0.72 | 1.00 | 0.345 | 0.345 | 1.001 | 0.722 | 102,794 | 64 by 60 |
| 3243 + 1/2 | 4.0 | 0.35 | 0.35 | 0.99 | 0.99 | 0.99 | 0.005 | 1.20 | 0,6 | 8.9 | 12.2 | 0.72 | 1.02 | 0.356 | 0.358 | 0.994 | 0.723 | 862,290 | 116 by 148 |
| 3244 | 4.6 | 0.37 | 0.36 | 1.01 | 1.00 | 1.00 | 0.005 | 1.38 | 13,3 | 10.2 | 13.8 | 0.72 | 1.00 | 0.371 | 0.371 | 1.001 | 0.725 | 126,790 | 152 by 160 |
| 3244 + 1/2 | 5.2 | 0.38 | 0.38 | 0.99 | 1.02 | 0.99 | 0.003 | 1.32 | 0,0 | 12.2 | 22.2 | 0.73 | 1.00 | 0.385 | 0.386 | 0.997 | 0.727 | 162,598 | 104 by 84 |
| 3245 | 5.9 | 0.40 | 0.40 | 1.01 | 0.99 | 0.99 | 0.016 | 1.27 | 1,5 | 13.1 | 19.9 | 0.73 | 0.99 | 0.402 | 0.402 | 0.999 | 0.729 | 190,606 | 72 by 52 |
| 3245 + 1/2 | 6.4 | 0.41 | 0.41 | 1.01 | 1.00 | 1.00 | 0.020 | 1.30 | 1,6 | 14.7 | 20.5 | 0.73 | 0.99 | 0.419 | 0.414 | 1.012 | 0.732 | 6,518 | 72 by 84 |
| 3246 | 7.0 | 0.42 | 0.43 | 0.98 | 1.00 | 0.98 | 0.016 | 1.27 | 1,6 | 17.0 | 22.9 | 0.73 | 1.00 | 0.427 | 0.432 | 0.987 | 0.736 | 190,794 | 56 by 60 |
| 3246 + 1/2 | 7.7 | 0.44 | 0.45 | 0.98 | 0.97 | 0.97 | 0.023 | 1.46 | 1,6 | 19.3 | 23.4 | 0.74 | 1.00 | 0.446 | 0.446 | 1.000 | 0.739 | 6,1074 | 24 by 20 |
| 3247 | 8.5 | 0.48 | 0.46 | 1.03 | 1.03 | 1.03 | 0.021 | 2.24 | 0,8 | 21.8 | 26.0 | 0.74 | 1.00 | 0.465 | 0.469 | 0.990 | 0.742 | 42,1074 | 68 by 56 |
| 3247 + 1/2 | 9.2 | 0.49 | 0.48 | 1.01 | 1.00 | 1.00 | 0.018 | 2.90 | 0,8 | 23.8 | 31.3 | 0.74 | 1.02 | 0.493 | 0.491 | 1.005 | 0.746 | 590,1074 | 56 by 36 |
| 3248 | 9.8 | 0.49 | 0.51 | 0.97 | 0.98 | 0.97 | 0.022 | 2.67 | 0,8 | 25.8 | 37.7 | 0.75 | 0.98 | 0.516 | 0.520 | 0.994 | 0.750 | 6,582 | 28 by 52 |
| 3248 + 1/2 | 10.6 | 0.53 | 0.52 | 1.02 | 1.02 | 1.02 | 0.025 | 2.50 | 1,8 | 27.4 | 45.9 | 0.75 | 1.00 | 0.546 | 0.553 | 0.988 | 0.754 | 6,566 | 40 by 44 |
| 3249 | 11.3 | 0.55 | 0.56 | 0.98 | 0.97 | 0.97 | 0.025 | 2.43 | 1,8 | 29.1 | 54.3 | 0.76 | 0.99 | 0.589 | 0.592 | 0.994 | 0.758 | 6,414 | 32 by 52 |
| 3249 + 1/2 | 12.0 | 0.59 | 0.60 | 0.98 | 0.97 | 0.97 | 0.018 | 2.46 | 5,8 | 30.1 | 58.8 | 0.76 | 1.00 | 0.639 | 0.648 | 0.985 | 0.763 | 546,1074 | 92 by 32 |
| 3250 | 12.8 | 0.66 | 0.65 | 1.00 | 1.02 | 1.00 | 0.007 | 5.19 | 15,8 | 32.4 | 125.9 | 0.77 | 1.00 | 0.708 | 0.708 | 0.999 | 0.768 | 1866,1074 | 100 by 36 |
| 3250 + 1/2 | 13.5 | 0.71 | 0.72 | 0.99 | 0.99 | 0.99 | 0.007 | 6.07 | 15,8 | 38.9 | 147.6 | 0.77 | 1.00 | 0.778 | 0.784 | 0.992 | 0.774 | 1826,1074 | 88 by 44 |
| 3251 | 14.3 | 0.78 | 0.79 | 1.00 | 0.99 | 0.99 | 0.007 | 4.91 | 14,8 | 32.0 | 85.9 | 0.78 | 1.00 | 0.861 | 0.864 | 0.996 | 0.778 | 1790,1046 | 92 by 64 |
| 3251 + 1/2 | 14.9 | 0.86 | 0.86 | 0.99 | 1.00 | 0.99 | 0.007 | 5.85 | 14,8 | 82.8 | 173.6 | 0.78 | 1.00 | 0.950 | 0.954 | 0.996 | 0.784 | 1762,1026 | 92 by 60 |
| 3252 | 15.7 | 0.95 | 0.95 | 1.00 | 0.99 | 0.99 | 0.010 | 5.63 | 0,7 | 121.0 | 157.6 | 0.79 | 0.99 | 1.047 | 1.053 | 0.995 | 0.790 | 1914,1074 | 44 by 32 |
| 3252 + 1/2 | 16.3 | 1.04 | 1.04 | 1.00 | 1.01 | 1.00 | 0.006 | 4.57 | 0,7 | 120.1 | 145.8 | 0.80 | 1.00 | 1.156 | 1.159 | 0.998 | 0.796 | 1858,1066 | 60 by 52 |
| 3253 | 17.2 | 1.15 | 1.08 | 1.06 | 1.06 | 1.06 | 0.015 | 5.77 | 0,7 | 119.8 | 147.4 | 0.80 | 1.02 | 1.270 | 1.258 | 1.009 | 0.801 | 6,826 | 60 by 80 |
| 3253 + 1/2 | 17.9 | 1.24 | 1.14 | 1.09 | 1.13 | 1.09 | 0.007 | 5.36 | 0,7 | 116.1 | 137.8 | 0.81 | 1.04 | 1.371 | 1.237 | 1.109 | 0.807 | 6,510 | 84 by 60 |
| 3254 | 18.7 | 1.25 | 1.16 | 1.08 | 1.13 | 1.08 | 0.013 | 4.03 | 14,4 | 110.6 | 130.3 | 0.81 | 1.03 | 1.361 | 1.260 | 1.080 | 0.813 | 74,514 | 120 by 68 |
| 3254 + 1/2 | 19.4 | 1.13 | 1.17 | 0.96 | 1.00 | 0.96 | 0.014 | 4.59 | 13,3 | 101.4 | 123.2 | 0.82 | 0.98 | 1.203 | 1.353 | 0.889 | 0.820 | 174,526 | 84 by 76 |
| 3255 | 20.0 | 1.17 | 1.17 | 1.00 | 1.06 | 1.00 | 0.010 | 5.73 | 13,3 | 75.4 | 98.0 | 0.82 | 1.00 | 1.251 | 1.353 | 0.924 | 0.825 | 214,538 | 56 by 68 |
| 3255 + 1/2 | 20.8 | 1.26 | 1.17 | 1.08 | 1.13 | 1.08 | 0.020 | 6.93 | 13,3 | 70.0 | 82.4 | 0.82 | 1.03 | 1.346 | 1.309 | 1.028 | 0.832 | 66,370 | 96 by 148 |
| 3256 | 21.5 | 1.29 | 1.17 | 1.10 | 1.14 | 1.10 | 0.014 | 6.47 | 13,3 | 67.5 | 79.8 | 0.83 | 1.03 | 1.368 | 1.350 | 1.013 | 0.838 | 98,382 | 116 by 160 |
| 3256 + 1/2 | 22.1 | 1.31 | 1.21 | 1.08 | 1.12 | 1.08 | 0.018 | 6.15 | 13,3 | 67.7 | 80.3 | 0.83 | 1.02 | 1.370 | 1.361 | 1.006 | 0.845 | 734,526 | 52 by 52 |
| 3257 | 22.7 | 1.31 | 1.25 | 1.05 | 1.08 | 1.05 | 0.025 | 5.22 | 13,3 | 68.0 | 80.2 | 0.84 | 1.00 | 1.354 | 1.440 | 0.940 | 0.851 | 126,370 | 108 by 124 |
| 3257 + 1/2 | 23.4 | 1.45 | 1.25 | 1.16 | 1.16 | 1.16 | 0.026 | 3.80 | 13,3 | 65.5 | 79.0 | 0.84 | 1.02 | 1.510 | 1.528 | 0.989 | 0.857 | 162,382 | 104 by 120 |
| 3258 | 24.0 | 1.62 | 1.26 | 1.29 | 1.25 | 1.25 | 0.030 | 4.74 | 2,0 | 65.1 | 74.0 | 0.85 | 1.05 | 1.686 | 1.617 | 1.042 | 0.863 | 1886,710 | 96 by 104 |
| 3258 + 1/2 | 24.5 | 1.75 | 1.28 | 1.37 | 1.35 | 1.35 | 0.028 | 6.13 | 2,0 | 57.6 | 65.8 | 0.86 | 1.08 | 1.818 | 1.650 | 1.102 | 0.870 | 66,6 | 356 by 60 |
| 3259 | 25.2 | 1.68 | 1.30 | 1.29 | 1.28 | 1.28 | 0.033 | 6.74 | 2,0 | 50.0 | 55.9 | 0.86 | 1.04 | 1.724 | 1.650 | 1.045 | 0.876 | 74,6 | 468 by 68 |
| 3259 + 1/2 | 25.7 | 1.60 | 1.31 | 1.22 | 1.15 | 1.15 | 0.040 | 6.23 | 2,0 | 41.2 | 47.5 | 0.86 | 0.99 | 1.615 | 1.597 | 1.011 | 0.882 | 206,54 | 364 by 100 |
| 3260 | 26.4 | 1.48 | 1.32 | 1.12 | 1.07 | 1.07 | 0.035 | 4.30 | 3,0 | 37.0 | 42.7 | 0.87 | 0.95 | 1.470 | 1.487 | 0.989 | 0.888 | 366,70 | 352 by 80 |
| 3260 + 1/2 | 26.9 | 1.39 | 1.35 | 1.03 | 0.95 | 0.95 | 0.041 | 2.62 | 10,8 | 41.8 | 51.8 | 0.88 | 0.92 | 1.358 | 1.385 | 0.981 | 0.894 | 782,10 | 452 by 192 |
| 3261 | 27.4 | 1.34 | 1.42 | 0.94 | 0.89 | 0.89 | 0.041 | 2.37 | 10,8 | 46.8 | 58.2 | 0.88 | 0.91 | 1.301 | 1.280 | 1.016 | 0.901 | 1146,150 | 456 by 212 |
| 3261 + 1/2 | 27.9 | 1.25 | 1.45 | 0.86 | 0.78 | 0.78 | 0.048 | 1.75 | 10,8 | 50.8 | 64.8 | 0.89 | 0.89 | 1.201 | 1.207 | 0.996 | 0.906 | 1862,606 | 100 by 96 |
| 3262 | 28.3 | 1.18 | 1.47 | 0.80 | 0.72 | 0.72 | 0.046 | 1.76 | 9,8 | 55.2 | 72.8 | 0.90 | 0.90 | 1.112 | 1.145 | 0.972 | 0.912 | 1342,214 | 384 by 216 |
| 3262 + 1/2 | 28.9 | 1.16 | 1.50 | 0.78 | 0.72 | 0.72 | 0.052 | 1.77 | 2,7 | 57.5 | 79.4 | 0.90 | 0.92 | 1.088 | 1.100 | 0.988 | 0.917 | 1378,218 | 116 by 68 |
| 3263 | 29.4 | 1.13 | 1.50 | 0.76 | 0.68 | 0.68 | 0.044 | 1.98 | 9,7 | 62.7 | 81.8 | 0.91 | 0.91 | 1.061 | 1.100 | 0.964 | 0.923 | 1098,34 | 216 by 100 |
| 3263 + 1/2 | 29.9 | 1.15 | 1.50 | 0.77 | 0.69 | 0.69 | 0.058 | 1.93 | 9,7 | 67.7 | 84.2 | 0.92 | 0.91 | 1.088 | 1.297 | 0.839 | 0.928 | 1458,226 | 160 by 108 |
| 3264 | 30.2 | 1.53 | 1.47 | 1.04 | 1.00 | 1.00 | 0.053 | 2.81 | 12,6 | 66.8 | 98.2 | 0.92 | 0.99 | 1.507 | 1.544 | 0.976 | 0.934 | 1482,222 | 344 by 224 |
| 3264 + 1/2 | 30.5 | 2.00 | 1.47 | 1.36 | 1.35 | 1.35 | 0.048 | 3.49 | 12,6 | 62.2 | 92.2 | 0.93 | 1.11 | 2.000 | 1.597 | 1.252 | 0.938 | 1270,54 | 340 by 224 |
| 3265 | 30.9 | 2.03 | 1.47 | 1.38 | 1.37 | 1.37 | 0.048 | 3.37 | 12,6 | 61.7 | 92.2 | 0.94 | 1.10 | 2.039 | 1.597 | 1.277 | 0.943 | 1318,58 | 344 by 236 |
| 3265 + 1/2 | 31.4 | 1.69 | 1.47 | 1.15 | 1.14 | 1.14 | 0.040 | 2.60 | 11,0 | 63.4 | 92.8 | 0.94 | 1.01 | 1.687 | 1.720 | 0.981 | 0.948 | 1382,78 | 348 by 252 |
| 3266 | 31.9 | 1.36 | 1.50 | 0.91 | 0.90 | 0.90 | 0.035 | 1.94 | 11,0 | 65.4 | 115.2 | 0.95 | 0.93 | 1.342 | 1.605 | 0.836 | 0.953 | 1394,54 | 408 by 320 |
| 3266 + 1/2 | 32.3 | 1.45 | 1.46 | 0.99 | 0.99 | 0.99 | 0.026 | 2.08 | 12,0 | 57.4 | 85.0 | 0.96 | 0.94 | 1.440 | 1.557 | 0.925 | 0.958 | 1582,166 | 416 by 336 |
| 3267 | 32.7 | 1.53 | 1.43 | 1.07 | 1.05 | 1.05 | 0.025 | 2.25 | 12,0 | 55.9 | 100.5 | 0.96 | 0.95 | 1.522 | 1.516 | 1.004 | 0.961 | 1622,174 | 356 by 312 |
| 3267 + 1/2 | 33.2 | 1.59 | 1.40 | 1.14 | 1.14 | 1.14 | 0.019 | 2.05 | 12,0 | 66.7 | 100.6 | 0.97 | 0.97 | 1.592 | 1.793 | 0.888 | 0.966 | 1710,222 | 396 by 356 |
| 3268 | 33.6 | 2.06 | 1.39 | 1.48 | 1.49 | 1.48 | 0.017 | 2.81 | 12,7 | 65.3 | 99.6 | 0.97 | 1.06 | 2.064 | 1.587 | 1.301 | 0.969 | 1638,122 | 356 by 324 |
| 3268 + 1/2 | 34.2 | 2.08 | 1.38 | 1.51 | 1.50 | 1.50 | 0.018 | 3.46 | 12,7 | 68.0 | 98.7 | 0.97 | 1.07 | 2.077 | 1.587 | 1.309 | 0.973 | 1674,122 | 304 by 332 |
| 3269 | 34.7 | 1.59 | 1.38 | 1.15 | 1.14 | 1.14 | 0.014 | 1.94 | 15,2 | 63.3 | 90.8 | 0.98 | 0.97 | 1.582 | 1.815 | 0.872 | 0.976 | 1914,334 | 152 by 172 |
| 3269 + 1/2 | 35.1 | 1.57 | 1.40 | 1.12 | 1.12 | 1.12 | 0.007 | 1.85 | 10,7 | 66.4 | 82.7 | 0.98 | 0.98 | 1.566 | 1.562 | 1.002 | 0.978 | 1914,306 | 88 by 120 |
| 3270 | 35.6 | 1.55 | 1.43 | 1.08 | 1.09 | 1.08 | 0.007 | 1.71 | 12,6 | 66.9 | 77.5 | 0.98 | 0.97 | 1.542 | 1.539 | 1.002 | 0.981 | 1914,274 | 84 by 108 |
| 3270 + 1/2 | 36.1 | 1.51 | 1.45 | 1.04 | 1.07 | 1.04 | 0.003 | 1.56 | 12,6 | 65.8 | 79.4 | 0.99 | 0.96 | 1.511 | 1.494 | 1.012 | 0.982 | 1914,250 | 24 by 52 |
| 3271 | 36.6 | 1.45 | 1.52 | 0.95 | 1.01 | 0.95 | 0.003 | 1.55 | 10,6 | 66.5 | 86.5 | 0.99 | 0.97 | 1.445 | 1.453 | 0.995 | 0.984 | 1914,222 | 92 by 128 |
| 3271 + 1/2 | 37.1 | 1.40 | 1.53 | 0.91 | 0.93 | 0.91 | 0.006 | 1.53 | 10,6 | 64.9 | 87.2 | 0.99 | 0.99 | 1.395 | 1.400 | 0.997 | 0.985 | 822,1074 | 72 by 40 |
| 3272 | 37.7 | 1.35 | 1.54 | 0.88 | 0.89 | 0.88 | 0.004 | 1.27 | 0,7 | 64.2 | 87.6 | 0.99 | 0.98 | 1.352 | 1.402 | 0.964 | 0.985 | 6,898 | 60 by 72 |
| 3272 + 1/2 | 38.2 | 1.35 | 1.56 | 0.87 | 0.88 | 0.87 | 0.001 | 1.30 | 12,2 | 63.1 | 86.4 | 1.00 | 0.99 | 1.355 | 1.379 | 0.982 | 0.986 | 706,1074 | 76 by 32 |
| 3273 | 38.8 | 1.41 | 1.56 | 0.90 | 0.91 | 0.90 | 0.002 | 1.48 | 12,2 | 61.8 | 83.3 | 1.00 | 1.00 | 1.409 | 1.353 | 1.041 | 0.987 | 1914,62 | 52 by 68 |
| 3273 + 1/2 | 39.2 | 1.36 | 1.54 | 0.89 | 0.90 | 0.89 | 0.001 | 1.43 | 0,3 | 59.5 | 78.7 | 1.00 | 1.00 | 1.363 | 1.337 | 1.020 | 0.987 | 6,426 | 40 by 56 |
| 3274 | 39.6 | 1.32 | 1.54 | 0.86 | 0.87 | 0.86 | 0.001 | 1.27 | 2,8 | 55.0 | 72.3 | 1.00 | 1.00 | 1.318 | 1.338 | 0.985 | 0.987 | 6,1050 | 36 by 68 |
| 3274 + 1/2 | 39.9 | 1.31 | 1.56 | 0.84 | 0.85 | 0.84 | 0.000 | 1.31 | 10,5 | 48.9 | 65.5 | 1.00 | 1.01 | 1.314 | 1.310 | 1.003 | 0.987 | 82,6 | 68 by 36 |
| 3275 | 39.9 | 1.30 | 1.58 | 0.82 | 0.84 | 0.82 | 0.000 | 1.30 | 10,4 | 42.8 | 58.0 | 1.00 | 1.02 | 1.302 | 1.308 | 0.996 | 0.988 | 6,942 | 36 by 52 |
| 3275 + 1/2 | 39.8 | 1.30 | 1.59 | 0.82 | 0.84 | 0.82 | 0.000 | 1.31 | 0,7 | 38.1 | 56.8 | 1.00 | 1.04 | 1.302 | 1.308 | 0.995 | 0.988 | 10,866 | 76 by 88 |
| 3276 | 39.6 | 1.26 | 1.63 | 0.77 | 0.78 | 0.77 | 0.002 | 1.13 | 14,5 | 31.5 | 50.4 | 1.00 | 1.03 | 1.259 | 1.332 | 0.945 | 0.988 | 314,6 | 60 by 28 |
| 3276 + 1/2 | 39.4 | 1.36 | 1.63 | 0.84 | 0.84 | 0.84 | 0.001 | 1.33 | 14,5 | 26.0 | 41.4 | 1.00 | 1.05 | 1.362 | 1.485 | 0.917 | 0.988 | 394,6 | 100 by 32 |
| 3277 | 39.2 | 1.67 | 1.58 | 1.06 | 1.07 | 1.06 | 0.000 | 1.75 | 1,1 | 28.1 | 38.7 | 1.00 | 1.08 | 1.668 | 1.763 | 0.946 | 0.988 | 430,46 | 64 by 80 |
| 3277 + 1/2 | 38.9 | 2.16 | 1.62 | 1.34 | 1.34 | 1.34 | 0.001 | 2.20 | 1,1 | 31.5 | 44.9 | 1.00 | 1.12 | 2.164 | 2.165 | 0.999 | 0.988 | 1770,262 | 72 by 180 |
| 3278 | 38.7 | 2.69 | 1.78 | 1.51 | 1.60 | 1.51 | 0.001 | 2.65 | 1,1 | 34.9 | 51.0 | 1.00 | 1.19 | 2.687 | 2.208 | 1.217 | 0.988 | 6,546 | 32 by 92 |
| 3278 + 1/2 | 38.5 | 2.66 | 1.91 | 1.40 | 1.56 | 1.40 | 0.002 | 2.56 | 1,1 | 39.1 | 57.4 | 1.00 | 1.17 | 2.662 | 2.344 | 1.136 | 0.988 | 6,642 | 60 by 188 |
| 3279 | 38.2 | 2.25 | 1.97 | 1.14 | 1.29 | 1.14 | 0.002 | 2.52 | 15,8 | 41.5 | 66.1 | 1.00 | 1.11 | 2.252 | 2.675 | 0.842 | 0.988 | 558,166 | 44 by 48 |
| 3279 + 1/2 | 37.9 | 2.44 | 2.09 | 1.16 | 1.24 | 1.16 | 0.002 | 3.24 | 15,8 | 45.0 | 72.0 | 1.00 | 1.13 | 2.436 | 2.701 | 0.902 | 0.988 | 990,6 | 60 by 28 |
| 3280 | 37.6 | 2.76 | 2.09 | 1.32 | 1.39 | 1.32 | 0.000 | 3.47 | 15,8 | 45.9 | 75.6 | 1.00 | 1.18 | 2.756 | 2.344 | 1.176 | 0.988 | 1170,6 | 100 by 40 |
| 3280 + 1/2 | 37.1 | 2.74 | 2.09 | 1.31 | 1.38 | 1.31 | 0.000 | 3.72 | 0,8 | 50.0 | 78.7 | 1.00 | 1.16 | 2.739 | 2.336 | 1.172 | 0.988 | 638,254 | 80 by 72 |
| 3281 | 36.6 | 2.24 | 2.09 | 1.07 | 1.12 | 1.07 | 0.002 | 3.46 | 13,8 | 56.2 | 80.5 | 0.99 | 1.09 | 2.237 | 2.736 | 0.817 | 0.984 | 1750,918 | 348 by 228 |
| 3281 + 1/2 | 36.0 | 1.35 | 2.20 | 0.61 | 0.62 | 0.61 | 0.005 | 1.19 | 0,8 | 61.8 | 82.2 | 0.97 | 0.94 | 1.334 | 2.736 | 0.487 | 0.969 | 814,6 | 32 by 16 |
| 3282 | 35.3 | 2.71 | 2.09 | 1.29 | 1.34 | 1.29 | 0.018 | 2.34 | 11,8 | 63.8 | 79.7 | 0.94 | 1.15 | 2.733 | 2.342 | 1.167 | 0.936 | 1178,6 | 844 by 352 |
| 3282 + 1/2 | 34.4 | 2.80 | 2.09 | 1.34 | 1.38 | 1.34 | 0.032 | 2.79 | 8,4 | 62.8 | 80.1 | 0.90 | 1.13 | 2.852 | 2.591 | 1.101 | 0.902 | 678,590 | 208 by 212 |
| 3283 | 33.7 | 2.45 | 2.09 | 1.17 | 1.17 | 1.17 | 0.055 | 2.76 | 8,4 | 61.2 | 75.6 | 0.87 | 1.06 | 2.448 | 2.904 | 0.843 | 0.871 | 818,86 | 76 by 56 |
| 3283 + 1/2 | 32.0 | 2.90 | 2.09 | 1.39 | 1.38 | 1.38 | 0.063 | 2.71 | 8,4 | 60.4 | 68.0 | 0.84 | 1.09 | 2.955 | 2.788 | 1.060 | 0.842 | 826,118 | 88 by 56 |
| 3284 | 32.1 | 3.10 | 2.09 | 1.48 | 1.43 | 1.43 | 0.109 | 2.92 | 11,7 | 59.2 | 64.2 | 0.81 | 1.10 | 3.245 | 2.682 | 1.210 | 0.815 | 830,138 | 124 by 116 |
| 3284 + 1/2 | 32.7 | 2.63 | 2.09 | 1.25 | 1.21 | 1.21 | 0.086 | 2.33 | 8,4 | 57.4 | 61.9 | 0.79 | 1.03 | 2.723 | 2.798 | 0.973 | 0.790 | 834,162 | 68 by 52 |
| 3285 | 31.0 | 2.55 | 2.09 | 1.22 | 1.13 | 1.13 | 0.122 | 2.19 | 11,7 | 55.4 | 59.7 | 0.76 | 0.98 | 2.641 | 2.377 | 1.111 | 0.765 | 902,254 | 76 by 68 |
| 3285 + 1/2 | 31.7 | 2.02 | 2.20 | 0.92 | 0.80 | 0.80 | 0.142 | 1.82 | 1,1 | 53.7 | 57.3 | 0.74 | 0.90 | 2.030 | 2.382 | 0.852 | 0.742 | 594,6 | 148 by 36 |
| 3286 | 37.0 | 1.90 | 2.13 | 0.89 | 0.85 | 0.85 | 0.096 | 2.70 | 15,4 | 51.8 | 55.7 | 0.71 | 0.93 | 1.957 | 2.382 | 0.822 | 0.720 | 1914,586 | 28 by 88 |
| 3286 + 1/2 | 39.0 | 1.92 | 2.02 | 0.95 | 0.99 | 0.95 | 0.070 | 2.76 | 15,4 | 50.8 | 54.1 | 0.69 | 0.95 | 2.124 | 2.420 | 0.877 | 0.698 | 1914,626 | 64 by 92 |
| 3287 | 38.9 | 2.38 | 1.91 | 1.25 | 1.30 | 1.25 | 0.062 | 4.17 | 15,4 | 49.1 | 52.0 | 0.66 | 1.07 | 2.825 | 2.248 | 1.257 | 0.677 | 1826,574 | 96 by 152 |
| 3287 + 1/2 | 38.5 | 2.34 | 1.84 | 1.27 | 1.33 | 1.27 | 0.074 | 4.82 | 15,4 | 45.4 | 48.3 | 0.64 | 1.08 | 2.811 | 2.248 | 1.250 | 0.658 | 1786,574 | 160 by 152 |
| 3288 | 37.9 | 2.01 | 1.70 | 1.18 | 1.19 | 1.18 | 0.076 | 3.24 | 15,4 | 41.4 | 44.7 | 0.62 | 1.02 | 2.373 | 2.454 | 0.967 | 0.638 | 1750,566 | 68 by 100 |
| 3288 + 1/2 | 37.0 | 1.78 | 1.54 | 1.16 | 1.12 | 1.12 | 0.087 | 2.68 | 14,4 | 37.8 | 41.9 | 0.59 | 0.97 | 2.097 | 2.130 | 0.984 | 0.620 | 1714,566 | 72 by 84 |
| 3289 | 36.6 | 1.62 | 1.41 | 1.15 | 1.14 | 1.14 | 0.060 | 2.63 | 14,4 | 34.7 | 39.1 | 0.57 | 1.00 | 1.887 | 1.868 | 1.010 | 0.601 | 1678,558 | 64 by 84 |
| 3289 + 1/2 | 35.6 | 1.45 | 1.35 | 1.07 | 1.02 | 1.02 | 0.081 | 3.20 | 14,8 | 31.7 | 36.6 | 0.54 | 0.99 | 1.640 | 1.601 | 1.025 | 0.583 | 1642,554 | 88 by 108 |
| 3290 | 34.7 | 1.26 | 1.41 | 0.90 | 0.88 | 0.88 | 0.080 | 3.90 | 14,8 | 29.4 | 34.5 | 0.51 | 0.97 | 1.314 | 1.599 | 0.822 | 0.565 | 1614,554 | 60 by 68 |
| 3290 + 1/2 | 33.8 | 1.20 | 1.31 | 0.92 | 0.90 | 0.90 | 0.086 | 3.88 | 14,8 | 27.3 | 33.1 | 0.48 | 0.96 | 1.249 | 1.466 | 0.852 | 0.547 | 1582,554 | 56 by 76 |
| 3291 | 32.6 | 1.36 | 1.22 | 1.12 | 1.14 | 1.12 | 0.080 | 2.72 | 13,8 | 25.6 | 31.7 | 0.48 | 1.04 | 1.559 | 1.282 | 1.216 | 0.531 | 1030,6 | 188 by 68 |
| 3291 + 1/2 | 32.0 | 1.23 | 1.08 | 1.14 | 1.17 | 1.14 | 0.087 | 1.56 | 10,5 | 23.2 | 29.0 | 0.46 | 1.02 | 1.373 | 1.077 | 1.275 | 0.516 | 1530,542 | 92 by 128 |
| 3292 | 31.0 | 0.95 | 1.02 | 0.93 | 0.91 | 0.91 | 0.085 | 1.67 | 12,8 | 20.8 | 24.9 | 0.43 | 0.94 | 0.904 | 1.067 | 0.847 | 0.502 | 1506,550 | 56 by 112 |
| 3292 + 1/2 | 29.8 | 0.85 | 0.87 | 0.97 | 0.97 | 0.97 | 0.075 | 3.13 | 15,7 | 18.2 | 20.4 | 0.41 | 1.01 | 0.762 | 0.806 | 0.945 | 0.488 | 1482,546 | 56 by 100 |
| 3293 | 29.5 | 0.77 | 0.82 | 0.94 | 0.93 | 0.93 | 0.080 | 3.38 | 15,7 | 16.8 | 19.4 | 0.39 | 0.98 | 0.708 | 0.788 | 0.898 | 0.475 | 1458,518 | 60 by 100 |
| 3293 + 1/2 | 28.6 | 0.73 | 0.78 | 0.94 | 0.97 | 0.94 | 0.075 | 3.17 | 14,8 | 16.1 | 19.3 | 0.38 | 0.98 | 0.677 | 0.735 | 0.922 | 0.462 | 1438,534 | 48 by 108 |
| 3294 | 27.8 | 0.79 | 0.70 | 1.12 | 1.10 | 1.10 | 0.094 | 1.90 | 12,8 | 14.2 | 17.0 | 0.36 | 0.99 | 0.815 | 0.626 | 1.301 | 0.449 | 1414,530 | 64 by 112 |
| 3294 + 1/2 | 26.8 | 0.68 | 0.65 | 1.04 | 1.04 | 1.04 | 0.070 | 3.42 | 14,7 | 12.6 | 15.1 | 0.35 | 1.02 | 0.576 | 0.528 | 1.091 | 0.436 | 1398,502 | 60 by 84 |
| 3295 | 26.5 | 0.56 | 0.62 | 0.91 | 0.91 | 0.91 | 0.067 | 1.98 | 12,8 | 11.3 | 13.4 | 0.34 | 0.99 | 0.378 | 0.473 | 0.799 | 0.424 | 1378,522 | 44 by 88 |
| 3295 + 1/2 | 25.3 | 0.57 | 0.55 | 1.02 | 0.99 | 0.99 | 0.078 | 1.79 | 14,7 | 10.8 | 13.4 | 0.33 | 0.99 | 0.371 | 0.370 | 1.001 | 0.411 | 1362,498 | 48 by 88 |
| 3296 | 24.7 | 0.54 | 0.55 | 0.99 | 0.97 | 0.97 | 0.079 | 2.74 | 15,1 | 10.3 | 12.5 | 0.32 | 1.01 | 0.363 | 0.366 | 0.992 | 0.398 | 1342,526 | 52 by 84 |
| 3296 + 1/2 | 23.6 | 0.54 | 0.53 | 1.01 | 0.99 | 0.99 | 0.082 | 6.61 | 15,0 | 9.6 | 12.4 | 0.31 | 1.00 | 0.360 | 0.356 | 1.012 | 0.385 | 1330,514 | 48 by 80 |
| 3297 | 22.8 | 0.52 | 0.53 | 0.99 | 0.97 | 0.97 | 0.069 | 1.49 | 14,7 | 9.2 | 11.9 | 0.30 | 0.93 | 0.350 | 0.353 | 0.992 | 0.373 | 1314,514 | 52 by 88 |
| 3297 + 1/2 | 22.0 | 0.52 | 0.52 | 1.00 | 1.06 | 1.00 | 0.052 | 6.57 | 15,0 | 8.3 | 11.0 | 0.29 | 0.98 | 0.345 | 0.345 | 0.999 | 0.362 | 1302,502 | 56 by 80 |
| 3298 | 20.7 | 0.52 | 0.52 | 1.01 | 1.02 | 1.01 | 0.064 | 3.03 | 15,1 | 7.8 | 10.1 | 0.28 | 0.98 | 0.341 | 0.340 | 1.002 | 0.351 | 1294,518 | 52 by 92 |
| 3298 + 1/2 | 20.0 | 0.52 | 0.52 | 1.00 | 1.01 | 1.00 | 0.074 | 4.41 | 15,1 | 7.1 | 9.4 | 0.27 | 1.01 | 0.335 | 0.335 | 1.000 | 0.341 | 1282,510 | 64 by 76 |
| 3299 | 19.3 | 0.51 | 0.51 | 0.99 | 0.94 | 0.94 | 0.087 | 4.96 | 15,0 | 6.4 | 9.1 | 0.26 | 0.87 | 0.330 | 0.330 | 0.998 | 0.332 | 1266,502 | 56 by 72 |
| 3299 + 1/2 | 18.1 | 0.51 | 0.51 | 1.00 | 1.04 | 1.00 | 0.080 | 4.93 | 14,0 | 5.8 | 8.3 | 0.25 | 1.03 | 0.325 | 0.322 | 1.011 | 0.322 | 1258,506 | 68 by 72 |
| 3300 | 17.2 | 0.51 | 0.49 | 1.05 | 1.03 | 1.03 | 0.093 | 5.86 | 15,1 | 5.2 | 7.5 | 0.25 | 0.94 | 0.313 | 0.317 | 0.988 | 0.313 | 934,334 | 104 by 172 |
| 3300 + 1/2 | 17.0 | 0.47 | 0.49 | 0.96 | 0.95 | 0.95 | 0.096 | 2.11 | 13,0 | 5.0 | 7.2 | 0.24 | 0.93 | 0.309 | 0.310 | 0.998 | 0.304 | 1238,502 | 44 by 76 |
| 3301 | 16.2 | 0.46 | 0.46 | 1.00 | 0.96 | 0.96 | 0.086 | 4.23 | 15,3 | 4.6 | 5.6 | 0.24 | 1.00 | 0.307 | 0.305 | 1.006 | 0.296 | 1234,510 | 56 by 76 |
| 3301 + 1/2 | 15.0 | 0.45 | 0.45 | 1.01 | 1.03 | 1.01 | 0.083 | 3.17 | 15,4 | 4.5 | 5.5 | 0.23 | 0.94 | 0.301 | 0.300 | 1.001 | 0.287 | 1234,498 | 80 by 124 |
| 3302 | 14.7 | 0.44 | 0.44 | 0.99 | 0.94 | 0.94 | 0.094 | 1.83 | 7,1 | 4.3 | 4.8 | 0.22 | 0.87 | 0.293 | 0.297 | 0.986 | 0.279 | 974,298 | 96 by 56 |
| 3302 + 1/2 | 14.1 | 0.43 | 0.43 | 1.00 | 0.99 | 0.99 | 0.051 | 4.47 | 15,3 | 4.2 | 4.8 | 0.22 | 1.00 | 0.294 | 0.292 | 1.007 | 0.272 | 942,390 | 76 by 120 |
| 3303 | 13.2 | 0.42 | 0.42 | 1.01 | 1.01 | 1.01 | 0.055 | 2.27 | 7,2 | 4.1 | 4.6 | 0.21 | 1.02 | 0.291 | 0.290 | 1.004 | 0.264 | 990,266 | 80 by 112 |
| 3303 + 1/2 | 12.8 | 0.41 | 0.41 | 1.01 | 1.00 | 1.00 | 0.054 | 2.28 | 7,3 | 3.8 | 4.3 | 0.20 | 0.98 | 0.286 | 0.286 | 1.001 | 0.257 | 1214,510 | 64 by 52 |
| 3304 | 11.9 | 0.40 | 0.40 | 0.99 | 1.03 | 0.99 | 0.038 | 2.20 | 7,2 | 3.9 | 4.4 | 0.19 | 0.99 | 0.281 | 0.282 | 0.999 | 0.251 | 1210,490 | 64 by 60 |
| 3304 + 1/2 | 11.1 | 0.39 | 0.39 | 1.00 | 1.01 | 1.00 | 0.034 | 2.41 | 7,2 | 3.7 | 4.2 | 0.19 | 1.03 | 0.277 | 0.276 | 1.002 | 0.245 | 998,278 | 84 by 140 |
| 3305 | 10.0 | 0.38 | 0.38 | 1.01 | 1.02 | 1.01 | 0.024 | 2.36 | 7,2 | 3.6 | 4.0 | 0.19 | 1.00 | 0.271 | 0.274 | 0.988 | 0.239 | 1202,506 | 64 by 60 |
| 3305 + 1/2 | 9.3 | 0.37 | 0.37 | 0.99 | 1.01 | 0.99 | 0.027 | 2.05 | 14,3 | 3.4 | 3.7 | 0.18 | 0.91 | 0.271 | 0.270 | 1.002 | 0.233 | 1190,494 | 52 by 60 |
| 3306 | 8.5 | 0.37 | 0.36 | 1.00 | 1.03 | 1.00 | 0.009 | 1.83 | 7,3 | 3.3 | 3.6 | 0.18 | 0.94 | 0.270 | 0.269 | 1.003 | 0.228 | 1178,562 | 128 by 200 |
| 3306 + 1/2 | 7.8 | 0.36 | 0.36 | 1.00 | 1.03 | 1.00 | 0.012 | 2.01 | 14,2 | 3.2 | 3.5 | 0.18 | 1.03 | 0.266 | 0.269 | 0.988 | 0.223 | 1182,502 | 64 by 60 |
| 3307 | 7.0 | 0.35 | 0.35 | 1.00 | 1.01 | 1.00 | 0.018 | 1.84 | 13,1 | 3.0 | 3.4 | 0.17 | 1.05 | 0.268 | 0.265 | 1.010 | 0.218 | 1190,518 | 60 by 56 |
| 3307 + 1/2 | 6.1 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.013 | 1.56 | 14,4 | 2.9 | 3.2 | 0.17 | 0.97 | 0.265 | 0.264 | 1.003 | 0.214 | 1190,506 | 296 by 256 |
| 3308 | 5.5 | 0.34 | 0.34 | 1.00 | 1.00 | 1.00 | 0.017 | 1.45 | 13,2 | 2.8 | 3.1 | 0.17 | 0.95 | 0.262 | 0.263 | 0.998 | 0.210 | 1066,306 | 88 by 104 |
| 3308 + 1/2 | 4.7 | 0.33 | 0.33 | 1.00 | 0.99 | 0.99 | 0.014 | 1.53 | 5,1 | 2.7 | 2.9 | 0.16 | 0.97 | 0.261 | 0.261 | 0.997 | 0.206 | 998,490 | 152 by 108 |
| 3309 | 4.0 | 0.32 | 0.32 | 1.00 | 1.00 | 1.00 | 0.007 | 2.11 | 9,1 | 2.7 | 2.9 | 0.16 | 1.04 | 0.261 | 0.259 | 1.008 | 0.203 | 1178,522 | 64 by 52 |
| 3309 + 1/2 | 3.3 | 0.31 | 0.31 | 1.00 | 1.01 | 1.00 | 0.001 | 2.24 | 9,1 | 2.7 | 3.0 | 0.16 | 1.10 | 0.257 | 0.259 | 0.992 | 0.200 | 1174,530 | 96 by 112 |
| 3310 | 3.0 | 0.30 | 0.30 | 1.00 | 0.99 | 0.99 | 0.006 | 1.77 | 13,2 | 2.6 | 2.9 | 0.16 | 1.07 | 0.257 | 0.257 | 1.001 | 0.197 | 1154,406 | 128 by 84 |
| 3310 + 1/2 | 2.4 | 0.30 | 0.30 | 1.00 | 1.01 | 1.00 | 0.007 | 1.84 | 9,1 | 2.5 | 2.8 | 0.16 | 1.04 | 0.255 | 0.257 | 0.993 | 0.194 | 1150,342 | 172 by 144 |
| 3311 | 1.9 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.008 | 1.62 | 13,2 | 2.5 | 2.8 | 0.15 | 1.03 | 0.256 | 0.254 | 1.010 | 0.192 | 1174,526 | 60 by 64 |
| 3311 + 1/2 | 1.5 | 0.28 | 0.28 | 1.00 | 0.99 | 0.99 | 0.010 | 1.65 | 13,2 | 2.4 | 2.8 | 0.16 | 1.00 | 0.253 | 0.254 | 0.995 | 0.190 | 1166,530 | 52 by 52 |
| 3312 | 1.1 | 0.27 | 0.28 | 0.97 | 0.98 | 0.97 | 0.004 | 1.24 | 9,1 | 2.4 | 2.9 | 0.16 | 1.00 | 0.252 | 0.253 | 0.996 | 0.188 | 1134,626 | 168 by 120 |
| 3312 + 1/2 | 0.9 | 0.26 | 0.28 | 0.95 | 0.96 | 0.95 | 0.002 | 1.17 | 11,1 | 2.4 | 2.9 | 0.16 | 1.00 | 0.253 | 0.252 | 1.004 | 0.186 | 1210,454 | 128 by 116 |
| 3313 | 0.8 | 0.26 | 0.28 | 0.93 | 0.93 | 0.93 | 0.015 | 1.08 | 12,6 | 2.4 | 2.9 | 0.15 | 0.94 | 0.253 | 0.252 | 1.002 | 0.185 | 1070,398 | 92 by 180 |
| 3313 + 1/2 | 0.6 | 0.26 | 0.28 | 0.92 | 0.92 | 0.92 | 0.011 | 1.05 | 5,4 | 2.5 | 3.1 | 0.15 | 0.88 | 0.252 | 0.252 | 0.998 | 0.185 | 1182,546 | 276 by 284 |
| 3314 | 0.6 | 0.25 | 0.28 | 0.91 | 0.92 | 0.91 | 0.000 | 1.04 | 4,0 | 2.7 | 3.4 | 0.15 | 0.82 | 0.252 | 0.252 | 0.999 | 0.185 | 1570,670 | 80 by 80 |
| 3314 + 1/2 | 0.5 | 0.25 | 0.28 | 0.91 | 0.92 | 0.91 | 0.001 | 1.04 | 8,4 | 2.9 | 3.7 | 0.15 | 0.78 | 0.252 | 0.250 | 1.009 | 0.185 | 1162,598 | 196 by 244 |
| 3315 | 0.4 | 0.25 | 0.28 | 0.90 | 0.91 | 0.90 | 0.004 | 1.08 | 11,0 | 3.1 | 4.0 | 0.15 | 0.77 | 0.248 | 0.250 | 0.989 | 0.185 | 1174,542 | 56 by 60 |
| 3315 + 1/2 | 0.4 | 0.25 | 0.28 | 0.90 | 0.91 | 0.90 | 0.003 | 1.03 | 4,6 | 3.3 | 4.2 | 0.15 | 0.77 | 0.248 | 0.251 | 0.990 | 0.185 | 1178,546 | 64 by 60 |
| 3316 | 0.4 | 0.25 | 0.28 | 0.90 | 0.91 | 0.90 | 0.003 | 1.06 | 14,0 | 3.7 | 4.8 | 0.15 | 0.76 | 0.249 | 0.249 | 0.996 | 0.185 | 1182,594 | 240 by 188 |
| 3316 + 1/2 | 0.5 | 0.25 | 0.28 | 0.90 | 0.90 | 0.90 | 0.013 | 1.05 | 11,0 | 4.1 | 5.3 | 0.15 | 0.77 | 0.252 | 0.249 | 1.008 | 0.185 | 1086,406 | 216 by 280 |
| 3317 | 0.5 | 0.25 | 0.28 | 0.90 | 0.91 | 0.90 | 0.007 | 1.07 | 0,6 | 4.4 | 5.7 | 0.15 | 0.78 | 0.250 | 0.252 | 0.991 | 0.185 | 1170,538 | 48 by 48 |
| 3317 + 1/2 | 0.4 | 0.25 | 0.28 | 0.91 | 0.92 | 0.91 | 0.004 | 1.05 | 9,4 | 4.9 | 6.4 | 0.15 | 0.80 | 0.252 | 0.251 | 1.005 | 0.185 | 1178,558 | 84 by 156 |
| 3318 | 0.5 | 0.26 | 0.28 | 0.92 | 0.93 | 0.92 | 0.002 | 1.11 | 9,6 | 5.3 | 6.8 | 0.15 | 0.83 | 0.254 | 0.251 | 1.011 | 0.184 | 1102,450 | 168 by 164 |
| 3318 + 1/2 | 0.6 | 0.26 | 0.28 | 0.93 | 0.94 | 0.93 | 0.000 | 1.13 | 8,2 | 5.8 | 7.6 | 0.15 | 0.86 | 0.249 | 0.253 | 0.985 | 0.184 | 1570,630 | 116 by 140 |
| 3319 | 0.7 | 0.26 | 0.28 | 0.95 | 0.96 | 0.95 | 0.003 | 1.48 | 8,2 |  |  |  | 0.88 | 0.255 | 0.251 | 1.013 | 0.184 | 1178,554 | 68 by 92 |
| 3319 + 1/2 | 0.9 | 0.27 | 0.28 | 0.97 | 0.98 | 0.97 | 0.001 | 1.85 | 8,2 |  |  |  | 0.87 | 0.248 | 0.253 | 0.982 | 0.184 | 1170,470 | 60 by 72 |
| 3320 | 1.0 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.007 | 2.14 | 8,2 |  |  |  | 0.82 | 0.253 | 0.253 | 1.002 | 0.184 | 1014,570 | 72 by 72 |
| 3320 + 1/2 | 1.3 | 0.29 | 0.29 | 1.00 | 0.99 | 0.99 | 0.014 | 2.66 | 8,2 |  |  |  | 0.91 | 0.252 | 0.255 | 0.987 | 0.184 | 1186,546 | 60 by 56 |
| 3321 | 1.5 | 0.30 | 0.29 | 1.01 | 1.00 | 1.00 | 0.013 | 3.21 | 8,2 |  |  |  | 1.02 | 0.258 | 0.254 | 1.017 | 0.184 | 1182,562 | 56 by 52 |
| 3321 + 1/2 | 1.9 | 0.30 | 0.30 | 1.00 | 1.01 | 1.00 | 0.005 | 3.51 | 8,2 |  |  |  | 0.96 | 0.257 | 0.257 | 1.000 | 0.184 | 1062,306 | 44 by 44 |
| 3322 | 2.2 | 0.31 | 0.31 | 1.00 | 1.02 | 1.00 | 0.003 | 3.28 | 8,2 |  |  |  | 0.98 | 0.255 | 0.259 | 0.984 | 0.184 | 1186,574 | 52 by 60 |
| 3322 + 1/2 | 2.6 | 0.31 | 0.32 | 1.00 | 1.02 | 1.00 | 0.019 | 3.45 | 8,2 |  |  |  | 1.04 | 0.259 | 0.262 | 0.991 | 0.185 | 1094,806 | 56 by 64 |
| 3323 | 3.0 | 0.33 | 0.32 | 1.01 | 1.00 | 1.00 | 0.020 | 3.71 | 8,2 |  |  |  | 0.97 | 0.267 | 0.264 | 1.010 | 0.185 | 1186,598 | 52 by 48 |
| 3323 + 1/2 | 3.4 | 0.33 | 0.33 | 1.01 | 1.02 | 1.01 | 0.023 | 3.84 | 8,2 |  |  |  | 1.05 | 0.269 | 0.268 | 1.005 | 0.185 | 1190,610 | 52 by 44 |
| 3324 | 3.9 | 0.33 | 0.33 | 0.99 | 1.05 | 0.99 | 0.013 | 3.76 | 9,2 |  |  |  | 0.97 | 0.269 | 0.271 | 0.992 | 0.186 | 1202,630 | 52 by 48 |
| 3324 + 1/2 | 4.4 | 0.34 | 0.33 | 1.01 | 1.05 | 1.01 | 0.017 | 4.08 | 8,3 |  |  |  | 1.03 | 0.273 | 0.274 | 0.997 | 0.187 | 1198,642 | 52 by 52 |
| 3325 | 4.8 | 0.35 | 0.34 | 1.04 | 1.08 | 1.04 | 0.018 | 5.38 | 8,3 |  |  |  | 0.98 | 0.279 | 0.278 | 1.003 | 0.187 | 1202,662 | 56 by 52 |
| 3325 + 1/2 | 5.4 | 0.36 | 0.34 | 1.08 | 1.05 | 1.05 | 0.029 | 5.90 | 8,3 |  |  |  | 1.04 | 0.284 | 0.281 | 1.009 | 0.188 | 1206,682 | 56 by 44 |
| 3326 | 6.0 | 0.37 | 0.34 | 1.09 | 1.06 | 1.06 | 0.021 | 5.69 | 8,3 |  |  |  | 0.97 | 0.283 | 0.287 | 0.986 | 0.189 | 1214,710 | 48 by 48 |
| 3326 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

## place

### dive (jupiter.dive, T at 3059, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

### rise (jupiter.rise, T at 3240, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 2x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 13.7, uhd 44.9.

Largest mean difference: 1.889 at frame 3278 (jupiter.rise), limit 12.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 0.680 at frame 3259 (jupiter.rise), limit 3.2.
Largest level difference of one block (a grid of 16 by 9): -2.217 at frame 3038 (jupiter.dive), limit 12.
Largest level difference of the whole frame: 0.604 at frame 3278 (jupiter.rise), limit 2.2.
Picture: out/work/smooth/jupiter-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2895 | jupiter.hold | 1.237 | 5.2 | 45 | -0.117 | -0.118 | 0.205 | 2.56 | -0.323 | 12,3 | 1.194 |
| 2993 | jupiter.dive | 1.223 | 4.9 | 93 | -0.029 | -0.038 | 0.162 | 2.52 | -0.279 | 3,8 | 1.153 |
| 3015 | jupiter.dive | 1.621 | 6.4 | 52 | 0.553 | 0.618 | 0.620 | 4.12 | 1.060 | 3,5 | 1.045 |
| 3038 | jupiter.dive | 1.655 | 8.4 | 125 | 0.408 | 0.429 | 0.652 | 37.24 | -2.217 | 15,4 | 1.224 |
| 3150 | jupiter.terrain | 1.671 | 10.4 | 103 | 0.451 | 0.527 | 0.676 | 27.89 | 2.108 | 7,2 | 1.040 |
| 3259 | jupiter.rise | 1.687 | 8.5 | 100 | 0.482 | 0.504 | 0.680 | 29.12 | -1.844 | 15,3 | 1.229 |
| 3278 | jupiter.rise | 1.889 | 8.1 | 53 | 0.604 | 0.684 | 0.631 | 5.43 | 1.557 | 14,0 | 1.124 |
| 3296 | jupiter.rise | 1.217 | 5.4 | 58 | -0.020 | -0.022 | 0.156 | 5.29 | -0.292 | 7,5 | 1.357 |
| 3353 | jupiter.travel | 1.262 | 7.3 | 60 | -0.004 | -0.004 | 0.153 | 3.53 | -0.439 | 8,4 | 1.483 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.

## counts

Film frames 2820 to 3389 in order on one fresh page, 1140 pictures at rate 2, tier draft at preview, 3154 s. Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): 6 warm draws. Its work counts for that picture and stands in brackets. Judged: dive, rise and travel, every picture.

| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |
|---|---|---|---|---|---|---|---|
| jupiter.hold | no | 300 | 1 | 2820 | 20 | 129 | 102 |
| jupiter.dive | yes | 180 | 0 |  | 0 | 0 | 0 |
| jupiter.terrain | no | 360 | 0 |  | 0 | 0 | 0 |
| jupiter.rise | yes | 150 | 0 |  | 0 | 0 | 0 |
| jupiter.travel | yes | 150 | 0 |  | 0 | 0 | 0 |

Every picture with work (of the warm start call in brackets):

| frame | segment | programs | texture uploads | buffers | warm draws |
|---|---|---|---|---|---|
| 2820 | jupiter.hold | 20 (20) | 129 (129) | 102 (102) | 6 |
