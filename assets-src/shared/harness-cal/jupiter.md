# smooth: jupiter

Commit 8c45459350ebd4a899b50078da7290575e3cd3c3. Capture rate 2. Parts: path, pictures, place, parity. A calibration run: every number is written, the exit code is 0.

VERDICT: red. 115 numbers over the limit or not measured.

## path

### dive (jupiter.dive, frames 2970 to 3059, T at 3024, window 2958 to 3071)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.07526 log of the height a film frame | 1.477 | 3009 | 0.174 | 2975 |  |  | 0.020 | 0.049 | 0.050 | 0.412 | 0.000 at 3063 |
| whole frames | turn | 1.198 degrees a film frame | 2.415 | 2992 | 0.255 | 2989 |  |  | 0.001 | 0.004 | 0.018 | 0.859 | 0.000 at 2968 |
| whole frames | speed | 13.42 px a film frame at the place | 2.525 | 3044 | 0.239 | 3053 |  |  | 0.010 | 0.091 | 0.492 | 0.000 | 0.001 at 3063 |
| rate 2 | rate | 0.07486 log of the height a film frame | 1.486 | 3009 | 0.178 | 2975 | 0.089 | 2975 | 0.024 | 0.046 | 0.057 | 0.414 | 0.000 at 3062 + 1/2 |
| rate 2 | turn | 1.191 degrees a film frame | 2.448 | 2991 + 1/2 | 0.264 | 2989 | 0.144 | 2988 + 1/2 | 0.006 | 0.000 | 0.026 | 0.874 | 0.000 at 2968 + 1/2 |
| rate 2 | speed | 13.4 px a film frame at the place | 2.531 | 3043 + 1/2 | 0.241 | 3053 | 0.121 | 3053 | 0.012 | 0.085 | 0.497 | 0.000 | 0.001 at 3062 + 1/2 |

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

- RED whole frames, rate: changes by 0.174 of the mean over one film frame in 5 steps from frame 2973 to 2977, most at 2975, limit 0.08
- RED whole frames, rate: changes by 0.144 of the mean over one film frame in 3 steps from frame 2987 to 2989, most at 2989, limit 0.08
- RED whole frames, rate: changes by 0.126 of the mean over one film frame in 3 steps from frame 3012 to 3014, most at 3013, limit 0.08
- RED whole frames, rate: changes by 0.108 of the mean over one film frame in 7 steps from frame 3052 to 3058, most at 3056, limit 0.08
- RED whole frames, rate: falls by 0.05 of the mean before its largest value (frame 3009), lowest at frame 2981, limit 0.03
- RED whole frames, rate: climbs again by 0.412 of the mean after its largest value (frame 3009), up to frame 3043, limit 0.03
- RED whole frames, turn: changes by 0.243 of the mean over one film frame in 7 steps from frame 2972 to 2978, most at 2975, limit 0.08
- RED whole frames, turn: changes by 0.255 of the mean over one film frame in 6 steps from frame 2986 to 2991, most at 2989, limit 0.08
- RED whole frames, turn: changes by 0.112 of the mean over one film frame in 6 steps from frame 2997 to 3002, most at 3000, limit 0.08
- RED whole frames, turn: changes by 0.106 of the mean over one film frame in 10 steps from frame 3004 to 3013, most at 3012, limit 0.08
- RED whole frames, turn: changes by 0.097 of the mean over one film frame at frame 3049, limit 0.08
- RED whole frames, turn: changes by 0.201 of the mean over one film frame in 7 steps from frame 3051 to 3057, most at 3054, limit 0.08
- RED whole frames, turn: climbs again by 0.859 of the mean after its largest value (frame 2992), up to frame 3050, limit 0.03
- RED whole frames, speed: changes by 0.102 of the mean over one film frame in 4 steps from frame 2974 to 2977, most at 2975, limit 0.08
- RED whole frames, speed: changes by 0.107 of the mean over one film frame in 5 steps from frame 3021 to 3025, most at 3024, limit 0.08
- RED whole frames, speed: changes by 0.101 of the mean over one film frame in 12 steps from frame 3029 to 3040, most at 3036, limit 0.08
- RED whole frames, speed: changes by 0.239 of the mean over one film frame in 13 steps from frame 3048 to 3060, most at 3053, limit 0.08
- RED whole frames, speed: falls by 0.492 of the mean before its largest value (frame 3044), lowest at frame 3016, limit 0.03
- RED rate 2, rate: changes by 0.178 of the mean over one film frame in 11 steps from frame 2972 + 1/2 to 2977 + 1/2, most at 2975, limit 0.08
- RED rate 2, rate: changes by 0.081 of the mean over one film frame at frame 2986 + 1/2, limit 0.08
- RED rate 2, rate: changes by 0.149 of the mean over one film frame in 5 steps from frame 2987 + 1/2 to 2989 + 1/2, most at 2989, limit 0.08
- RED rate 2, rate: changes by 0.135 of the mean over one film frame in 6 steps from frame 3011 + 1/2 to 3014, most at 3012 + 1/2, limit 0.08
- RED rate 2, rate: changes by 0.109 of the mean over one film frame in 14 steps from frame 3052 to 3058 + 1/2, most at 3055 + 1/2, limit 0.08
- RED rate 2, rate: changes by 0.089 of the mean from one capture frame to the next in 3 steps from frame 2974 + 1/2 to 2975 + 1/2, most at 2975, limit 0.08
- RED rate 2, rate: changes by 0.082 of the mean from one capture frame to the next at frame 2976 + 1/2, limit 0.08
- RED rate 2, rate: changes by 0.082 of the mean from one capture frame to the next at frame 2988 + 1/2, limit 0.08
- RED rate 2, rate: falls by 0.057 of the mean before its largest value (frame 3009), lowest at frame 2981, limit 0.03
- RED rate 2, rate: climbs again by 0.414 of the mean after its largest value (frame 3009), up to frame 3043, limit 0.03
- RED rate 2, turn: changes by 0.248 of the mean over one film frame in 12 steps from frame 2972 to 2977 + 1/2, most at 2975, limit 0.08
- RED rate 2, turn: changes by 0.083 of the mean over one film frame at frame 2984 + 1/2, limit 0.08
- RED rate 2, turn: changes by 0.264 of the mean over one film frame in 12 steps from frame 2985 + 1/2 to 2991, most at 2989, limit 0.08
- RED rate 2, turn: changes by 0.113 of the mean over one film frame in 12 steps from frame 2997 to 3002 + 1/2, most at 3000, limit 0.08
- RED rate 2, turn: changes by 0.109 of the mean over one film frame in 19 steps from frame 3004 to 3013, most at 3012, limit 0.08
- RED rate 2, turn: changes by 0.121 of the mean over one film frame at frame 3049, limit 0.08
- RED rate 2, turn: changes by 0.206 of the mean over one film frame in 13 steps from frame 3051 to 3057, most at 3053 + 1/2, limit 0.08
- RED rate 2, turn: changes by 0.125 of the mean from one capture frame to the next in 9 steps from frame 2973 to 2977, most at 2975, limit 0.08
- RED rate 2, turn: changes by 0.144 of the mean from one capture frame to the next in 4 steps from frame 2987 + 1/2 to 2989, most at 2988 + 1/2, limit 0.08
- RED rate 2, turn: changes by 0.103 of the mean from one capture frame to the next in 7 steps from frame 3052 to 3055, most at 3053, limit 0.08
- RED rate 2, turn: climbs again by 0.874 of the mean after its largest value (frame 2991 + 1/2), up to frame 3049 + 1/2, limit 0.03
- RED rate 2, speed: changes by 0.105 of the mean over one film frame in 7 steps from frame 2974 to 2977, most at 2975, limit 0.08
- RED rate 2, speed: changes by 0.108 of the mean over one film frame in 8 steps from frame 3021 to 3024 + 1/2, most at 3023 + 1/2, limit 0.08
- RED rate 2, speed: changes by 0.102 of the mean over one film frame in 22 steps from frame 3029 to 3039 + 1/2, most at 3035 + 1/2, limit 0.08
- RED rate 2, speed: changes by 0.241 of the mean over one film frame in 27 steps from frame 3047 to 3060, most at 3053, limit 0.08
- RED rate 2, speed: changes by 0.121 of the mean from one capture frame to the next in 16 steps from frame 3050 + 1/2 to 3058, most at 3053, limit 0.08
- RED rate 2, speed: falls by 0.497 of the mean before its largest value (frame 3043 + 1/2), lowest at frame 3016, limit 0.03

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2958 | hold orbit | 3.250e+0 | 0.004 |  |  | 0.019 |  |  | 0.024 |  |  |
| 2959 | hold orbit | 3.249e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.024 | 0.000 | 0.000 |
| 2960 | hold orbit | 3.248e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.024 | 0.000 | 0.000 |
| 2961 | hold orbit | 3.248e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.024 | 0.000 | 0.000 |
| 2962 | hold orbit | 3.247e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.024 | 0.000 | 0.000 |
| 2963 | hold orbit | 3.246e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.024 | 0.000 | 0.000 |
| 2964 | hold orbit | 3.245e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.024 | 0.000 | 0.000 |
| 2965 | hold orbit | 3.244e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.024 | 0.000 | 0.000 |
| 2966 | hold orbit | 3.243e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.024 | 0.000 | 0.000 |
| 2967 | hold orbit | 3.242e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.023 | 0.000 | 0.000 |
| 2968 | hold orbit | 3.241e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.023 | 0.000 | 0.000 |
| 2969 | hold orbit | 3.241e+0 | 0.004 | 0.000 | 0.000 | 0.019 | 0.000 | 0.000 | 0.023 | 0.000 | 0.000 |
| 2970 first | dive orbit | 3.240e+0 | 0.004 | 0.000 | 0.005 | 0.018 | 0.000 | 0.005 | 0.023 | 0.000 | 0.003 |
| 2971 | dive orbit | 3.234e+0 | 0.024 | 0.020 | 0.052 | 0.020 | 0.001 | 0.056 | 0.033 | 0.010 | 0.026 |
| 2972 | dive orbit | 3.211e+0 | 0.095 | 0.072 | 0.102 * | 0.118 | 0.098 * | 0.144 * | 0.069 | 0.036 | 0.053 |
| 2973 | dive orbit | 3.160e+0 | 0.211 | 0.116 * | 0.139 * | 0.282 | 0.164 * | 0.196 * | 0.132 | 0.062 | 0.077 |
| 2974 | dive orbit | 3.076e+0 | 0.360 | 0.149 * | 0.168 * | 0.491 | 0.209 * | 0.235 * | 0.215 | 0.084 * | 0.097 * |
| 2975 | dive orbit | 2.955e+0 | 0.534 | 0.174 * | 0.178 * | 0.734 | 0.243 * | 0.248 * | 0.317 | 0.102 * | 0.105 * |
| 2976 | dive orbit | 2.804e+0 | 0.694 | 0.160 * | 0.156 * | 0.958 | 0.224 * | 0.220 * | 0.416 | 0.099 * | 0.100 * |
| 2977 | dive orbit | 2.632e+0 | 0.843 | 0.149 * | 0.151 * | 1.174 | 0.215 * | 0.220 * | 0.516 | 0.100 * | 0.102 * |
| 2978 | dive orbit | 2.461e+0 | 0.894 | 0.051 | 0.032 | 1.257 | 0.084 * | 0.057 | 0.562 | 0.046 | 0.034 |
| 2979 | dive orbit | 2.304e+0 | 0.873 | 0.021 | 0.022 | 1.243 | 0.015 | 0.016 | 0.563 | 0.001 | 0.006 |
| 2980 | dive orbit | 2.158e+0 | 0.868 | 0.005 | 0.013 | 1.256 | 0.013 | 0.020 | 0.573 | 0.010 | 0.012 |
| 2981 | dive orbit | 2.026e+0 | 0.844 | 0.024 | 0.031 | 1.240 | 0.016 | 0.026 | 0.566 | 0.006 | 0.011 |
| 2982 | dive orbit | 1.900e+0 | 0.849 | 0.005 | 0.014 | 1.269 | 0.029 | 0.044 | 0.578 | 0.011 | 0.017 |
| 2983 | dive orbit | 1.782e+0 | 0.850 | 0.001 | 0.010 | 1.291 | 0.022 | 0.035 | 0.584 | 0.006 | 0.011 |
| 2984 | dive orbit | 1.669e+0 | 0.878 | 0.028 | 0.039 | 1.356 | 0.065 | 0.083 * | 0.606 | 0.022 | 0.029 |
| 2985 | dive orbit | 1.558e+0 | 0.914 | 0.036 | 0.049 | 1.433 | 0.077 | 0.098 * | 0.631 | 0.025 | 0.033 |
| 2986 | dive orbit | 1.447e+0 | 0.980 | 0.066 | 0.081 * | 1.559 | 0.127 * | 0.152 * | 0.674 | 0.043 | 0.051 |
| 2987 | dive orbit | 1.336e+0 | 1.060 | 0.080 * | 0.091 * | 1.710 | 0.151 * | 0.169 * | 0.723 | 0.049 | 0.054 |
| 2988 | dive orbit | 1.224e+0 | 1.166 | 0.106 * | 0.142 * | 1.903 | 0.193 * | 0.252 * | 0.784 | 0.060 | 0.080 |
| 2989 | dive orbit | 1.109e+0 | 1.311 | 0.144 * | 0.149 * | 2.159 | 0.255 * | 0.264 * | 0.861 | 0.077 | 0.080 |
| 2990 | dive orbit | 9.990e-1 | 1.385 | 0.075 | 0.060 | 2.290 | 0.131 * | 0.106 * | 0.882 | 0.021 | 0.011 |
| 2991 | dive orbit | 8.954e-1 | 1.455 | 0.069 | 0.077 | 2.404 | 0.114 * | 0.126 * | 0.891 | 0.008 | 0.013 |
| 2992 | dive orbit | 8.017e-1 | 1.468 | 0.014 | 0.016 | 2.415 | 0.011 | 0.044 | 0.858 | 0.033 | 0.052 |
| 2993 | dive orbit | 7.182e-1 | 1.462 | 0.007 | 0.003 | 2.383 | 0.032 | 0.026 | 0.810 | 0.048 | 0.045 |
| 2994 | dive orbit | 6.433e-1 | 1.462 | 0.000 | 0.001 | 2.356 | 0.027 | 0.037 | 0.765 | 0.045 | 0.046 |
| 2995 | dive orbit | 5.763e-1 | 1.461 | 0.001 | 0.001 | 2.313 | 0.043 | 0.056 | 0.718 | 0.047 | 0.047 |
| 2996 | dive orbit | 5.163e-1 | 1.461 | 0.000 | 0.000 | 2.250 | 0.063 | 0.076 | 0.671 | 0.047 | 0.046 |
| 2997 | dive orbit | 4.625e-1 | 1.462 | 0.000 | 0.000 | 2.167 | 0.082 * | 0.093 * | 0.626 | 0.045 | 0.045 |
| 2998 | dive orbit | 4.143e-1 | 1.462 | 0.000 | 0.000 | 2.070 | 0.097 * | 0.104 * | 0.585 | 0.041 | 0.041 |
| 2999 | dive orbit | 3.711e-1 | 1.462 | 0.001 | 0.001 | 1.964 | 0.106 * | 0.111 * | 0.549 | 0.036 | 0.035 |
| 3000 | dive orbit | 3.325e-1 | 1.461 | 0.001 | 0.002 | 1.852 | 0.112 * | 0.113 * | 0.519 | 0.030 | 0.029 |
| 3001 | dive orbit | 2.979e-1 | 1.459 | 0.002 | 0.002 | 1.743 | 0.109 * | 0.108 * | 0.497 | 0.022 | 0.021 |
| 3002 | dive orbit | 2.669e-1 | 1.460 | 0.001 | 0.003 | 1.648 | 0.095 * | 0.094 * | 0.484 | 0.013 | 0.013 |
| 3003 | dive orbit | 2.391e-1 | 1.463 | 0.003 | 0.003 | 1.569 | 0.079 | 0.078 | 0.478 | 0.006 | 0.005 |
| 3004 | dive orbit | 2.142e-1 | 1.462 | 0.001 | 0.002 | 1.489 | 0.081 * | 0.100 * | 0.476 | 0.002 | 0.002 |
| 3005 | dive orbit | 1.919e-1 | 1.461 | 0.001 | 0.001 | 1.386 | 0.102 * | 0.104 * | 0.475 | 0.001 | 0.001 |
| 3006 | dive orbit | 1.719e-1 | 1.460 | 0.001 | 0.001 | 1.282 | 0.105 * | 0.106 * | 0.477 | 0.002 | 0.003 |
| 3007 | dive orbit | 1.540e-1 | 1.460 | 0.000 | 0.004 | 1.176 | 0.105 * | 0.106 * | 0.481 | 0.004 | 0.007 |
| 3008 | dive orbit | 1.379e-1 | 1.467 | 0.007 | 0.014 | 1.075 | 0.101 * | 0.101 * | 0.490 | 0.009 | 0.014 |
| 3009 | dive orbit | 1.234e-1 | 1.477 | 0.010 | 0.014 | 0.979 | 0.096 * | 0.102 * | 0.503 | 0.012 | 0.013 |
| 3010 | dive orbit | 1.107e-1 | 1.444 | 0.033 | 0.051 | 0.875 | 0.104 * | 0.107 * | 0.501 | 0.002 | 0.008 |
| 3011 | dive orbit | 9.971e-2 | 1.387 | 0.057 | 0.088 * | 0.779 | 0.096 * | 0.101 * | 0.492 | 0.010 | 0.021 |
| 3012 | dive orbit | 9.058e-2 | 1.276 | 0.111 * | 0.135 * | 0.673 | 0.106 * | 0.109 * | 0.464 | 0.028 | 0.038 |
| 3013 | dive orbit | 8.307e-2 | 1.149 | 0.126 * | 0.124 * | 0.577 | 0.096 * | 0.093 * | 0.430 | 0.033 | 0.034 |
| 3014 | dive orbit | 7.673e-2 | 1.055 | 0.094 * | 0.091 * | 0.508 | 0.069 | 0.066 | 0.409 | 0.021 | 0.020 |
| 3015 | dive orbit | 7.124e-2 | 0.986 | 0.069 | 0.067 | 0.459 | 0.049 | 0.047 | 0.401 | 0.008 | 0.007 |
| 3016 | dive orbit | 6.649e-2 | 0.918 | 0.068 | 0.070 | 0.416 | 0.043 | 0.043 | 0.399 | 0.002 | 0.003 |
| 3017 | dive orbit | 6.234e-2 | 0.855 | 0.063 | 0.063 | 0.380 | 0.036 | 0.035 | 0.407 | 0.009 | 0.019 |
| 3018 | dive orbit | 5.869e-2 | 0.802 | 0.052 | 0.051 | 0.352 | 0.028 | 0.027 | 0.436 | 0.029 | 0.042 |
| 3019 | dive orbit | 5.541e-2 | 0.764 | 0.039 | 0.037 | 0.333 | 0.020 | 0.019 | 0.487 | 0.051 | 0.062 |
| 3020 | dive orbit | 5.240e-2 | 0.741 | 0.023 | 0.021 | 0.320 | 0.013 | 0.012 | 0.556 | 0.069 | 0.080 |
| 3021 | dive orbit | 4.958e-2 | 0.735 | 0.006 | 0.004 | 0.312 | 0.008 | 0.007 | 0.641 | 0.085 * | 0.094 * |
| 3022 | dive orbit | 4.688e-2 | 0.745 | 0.010 | 0.020 | 0.308 | 0.004 | 0.003 | 0.739 | 0.098 * | 0.104 * |
| 3023 | dive orbit | 4.424e-2 | 0.770 | 0.025 | 0.034 | 0.307 | 0.002 | 0.001 | 0.844 | 0.106 * | 0.108 * |
| 3024 T | dive terrain | 4.163e-2 | 0.809 | 0.039 | 0.042 | 0.306 | 0.001 | 0.002 | 0.951 | 0.107 * | 0.107 * |
| 3025 | dive terrain | 3.907e-2 | 0.841 | 0.032 | 0.030 | 0.317 | 0.012 | 0.025 | 1.035 | 0.084 * | 0.079 |
| 3026 | dive terrain | 3.662e-2 | 0.859 | 0.018 | 0.018 | 0.343 | 0.025 | 0.027 | 1.102 | 0.067 | 0.070 |
| 3027 | dive terrain | 3.428e-2 | 0.878 | 0.018 | 0.019 | 0.370 | 0.027 | 0.029 | 1.174 | 0.071 | 0.074 |
| 3028 | dive terrain | 3.205e-2 | 0.897 | 0.019 | 0.019 | 0.400 | 0.030 | 0.031 | 1.249 | 0.076 | 0.079 |
| 3029 | dive terrain | 2.991e-2 | 0.916 | 0.019 | 0.020 | 0.432 | 0.032 | 0.034 | 1.330 | 0.081 * | 0.084 * |
| 3030 | dive terrain | 2.788e-2 | 0.936 | 0.020 | 0.020 | 0.466 | 0.034 | 0.036 | 1.415 | 0.085 * | 0.088 * |
| 3031 | dive terrain | 2.594e-2 | 0.956 | 0.020 | 0.020 | 0.503 | 0.037 | 0.039 | 1.505 | 0.090 * | 0.092 * |
| 3032 | dive terrain | 2.411e-2 | 0.976 | 0.020 | 0.020 | 0.542 | 0.039 | 0.041 | 1.598 | 0.093 * | 0.096 * |
| 3033 | dive terrain | 2.236e-2 | 0.996 | 0.020 | 0.020 | 0.584 | 0.042 | 0.043 | 1.695 | 0.097 * | 0.099 * |
| 3034 | dive terrain | 2.072e-2 | 1.017 | 0.020 | 0.020 | 0.628 | 0.044 | 0.046 | 1.795 | 0.100 * | 0.101 * |
| 3035 | dive terrain | 1.916e-2 | 1.037 | 0.020 | 0.020 | 0.674 | 0.046 | 0.047 | 1.896 | 0.101 * | 0.102 * |
| 3036 | dive terrain | 1.770e-2 | 1.056 | 0.020 | 0.020 | 0.721 | 0.048 | 0.049 | 1.997 | 0.101 * | 0.102 * |
| 3037 | dive terrain | 1.632e-2 | 1.075 | 0.019 | 0.019 | 0.770 | 0.049 | 0.050 | 2.097 | 0.100 * | 0.100 * |
| 3038 | dive terrain | 1.503e-2 | 1.093 | 0.018 | 0.018 | 0.820 | 0.049 | 0.050 | 2.193 | 0.096 * | 0.096 * |
| 3039 | dive terrain | 1.383e-2 | 1.109 | 0.016 | 0.016 | 0.869 | 0.049 | 0.049 | 2.283 | 0.090 * | 0.089 * |
| 3040 | dive terrain | 1.271e-2 | 1.124 | 0.014 | 0.014 | 0.916 | 0.047 | 0.047 | 2.364 | 0.081 * | 0.080 |
| 3041 | dive terrain | 1.167e-2 | 1.135 | 0.012 | 0.011 | 0.961 | 0.044 | 0.044 | 2.432 | 0.068 | 0.067 |
| 3042 | dive terrain | 1.070e-2 | 1.143 | 0.008 | 0.008 | 1.000 | 0.040 | 0.039 | 2.484 | 0.052 | 0.050 |
| 3043 | dive terrain | 9.820e-3 | 1.147 | 0.004 | 0.003 | 1.033 | 0.033 | 0.032 | 2.516 | 0.032 | 0.030 |
| 3044 | dive terrain | 9.009e-3 | 1.145 | 0.002 | 0.006 | 1.058 | 0.025 | 0.024 | 2.525 | 0.009 | 0.007 |
| 3045 | dive terrain | 8.271e-3 | 1.137 | 0.008 | 0.013 | 1.072 | 0.014 | 0.013 | 2.507 | 0.018 | 0.035 |
| 3046 | dive terrain | 7.602e-3 | 1.120 | 0.016 | 0.022 | 1.074 | 0.002 | 0.007 | 2.461 | 0.046 | 0.065 |
| 3047 | dive terrain | 7.001e-3 | 1.095 | 0.025 | 0.032 | 1.061 | 0.012 | 0.022 | 2.384 | 0.077 | 0.096 * |
| 3048 | dive terrain | 6.464e-3 | 1.059 | 0.036 | 0.043 | 1.041 | 0.020 | 0.049 | 2.278 | 0.106 * | 0.111 * |
| 3049 | dive terrain | 5.990e-3 | 1.012 | 0.047 | 0.055 | 1.138 | 0.097 * | 0.121 * | 2.169 | 0.109 * | 0.122 * |
| 3050 | dive terrain | 5.576e-3 | 0.952 | 0.059 | 0.068 | 1.164 | 0.027 | 0.052 | 2.029 | 0.139 * | 0.171 * |
| 3051 | dive terrain | 5.219e-3 | 0.880 | 0.072 | 0.080 | 1.075 | 0.089 * | 0.142 * | 1.841 | 0.188 * | 0.213 * |
| 3052 | dive terrain | 4.915e-3 | 0.797 | 0.084 * | 0.091 * | 0.912 | 0.163 * | 0.192 * | 1.618 | 0.223 * | 0.237 * |
| 3053 | dive terrain | 4.662e-3 | 0.702 | 0.094 * | 0.100 * | 0.713 | 0.199 * | 0.206 * | 1.379 | 0.239 * | 0.241 * |
| 3054 | dive terrain | 4.456e-3 | 0.600 | 0.103 * | 0.107 * | 0.512 | 0.201 * | 0.201 * | 1.141 | 0.237 * | 0.237 * |
| 3055 | dive terrain | 4.294e-3 | 0.492 | 0.107 * | 0.109 * | 0.333 | 0.179 * | 0.176 * | 0.917 | 0.224 * | 0.223 * |
| 3056 | dive terrain | 4.172e-3 | 0.384 | 0.108 * | 0.108 * | 0.192 | 0.141 * | 0.137 * | 0.710 | 0.207 * | 0.205 * |
| 3057 | dive terrain | 4.085e-3 | 0.281 | 0.104 * | 0.103 * | 0.094 | 0.098 * | 0.094 * | 0.522 | 0.188 * | 0.187 * |
| 3058 | dive terrain | 4.028e-3 | 0.187 | 0.094 * | 0.093 * | 0.036 | 0.058 | 0.057 | 0.354 | 0.168 * | 0.166 * |
| 3059 last | dive terrain | 3.995e-3 | 0.109 | 0.077 | 0.075 | 0.004 | 0.032 | 0.025 | 0.213 | 0.141 * | 0.137 * |
| 3060 | terrain terrain | 3.977e-3 | 0.060 | 0.049 | 0.046 | 0.000 | 0.004 | 0.000 | 0.122 | 0.091 * | 0.085 * |
| 3061 | terrain terrain | 3.961e-3 | 0.052 | 0.008 | 0.003 | 0.000 | 0.000 | 0.000 | 0.107 | 0.014 | 0.005 |
| 3062 | terrain terrain | 3.945e-3 | 0.052 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.108 | 0.001 | 0.001 |
| 3063 | terrain terrain | 3.930e-3 | 0.053 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.109 | 0.001 | 0.001 |
| 3064 | terrain terrain | 3.914e-3 | 0.053 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.110 | 0.001 | 0.001 |
| 3065 | terrain terrain | 3.899e-3 | 0.053 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.111 | 0.001 | 0.001 |
| 3066 | terrain terrain | 3.883e-3 | 0.053 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.111 | 0.001 | 0.001 |
| 3067 | terrain terrain | 3.868e-3 | 0.053 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.112 | 0.001 | 0.001 |
| 3068 | terrain terrain | 3.852e-3 | 0.053 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.113 | 0.001 | 0.001 |
| 3069 | terrain terrain | 3.837e-3 | 0.054 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.114 | 0.001 | 0.001 |
| 3070 | terrain terrain | 3.821e-3 | 0.054 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.115 | 0.001 | 0.001 |
| 3071 | terrain terrain | 3.806e-3 | 0.054 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.115 | 0.001 | 0.001 |

### rise (jupiter.rise, frames 3240 to 3314, T at 3270, window 3228 to 3326)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.09905 log of the height a film frame | 1.926 | 3277 | 0.497 | 3274 |  |  | 0.045 | 0.063 | 0.410 | 0.343 | 0.007 at 3324 |
| whole frames | turn | 2.196 degrees a film frame | 2.176 | 3286 | 0.522 | 3311 |  |  | 0.000 | 0.077 | 1.118 | 0.396 | 0.000 at 3326 |
| whole frames | speed | 19.89 px a film frame at the place | 2.595 | 3254 | 0.325 | 3248 |  |  | 0.012 | 0.006 | 0.000 | 0.191 | 0.418 at 3326 |
| rate 2 | rate | 0.0984 log of the height a film frame | 1.947 | 3277 | 0.560 | 3274 | 0.281 | 3273 + 1/2 | 0.055 | 0.054 | 0.428 | 0.367 | 0.007 at 3324 |
| rate 2 | turn | 2.182 degrees a film frame | 2.200 | 3286 | 0.544 | 3311 | 0.296 | 3310 + 1/2 | 0.000 | 0.065 | 1.139 | 0.418 | 0.000 at 3326 + 1/2 |
| rate 2 | speed | 19.63 px a film frame at the place | 2.628 | 3254 | 0.329 | 3248 | 0.165 | 3247 + 1/2 | 0.022 | 0.007 | 0.000 | 0.198 | 0.458 at 3326 + 1/2 |

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

- RED whole frames, rate: changes by 0.159 of the mean over one film frame in 8 steps from frame 3242 to 3249, most at 3245, limit 0.08
- RED whole frames, rate: changes by 0.497 of the mean over one film frame in 4 steps from frame 3272 to 3275, most at 3274, limit 0.08
- RED whole frames, rate: changes by 0.251 of the mean over one film frame in 5 steps from frame 3287 to 3291, most at 3288, limit 0.08
- RED whole frames, rate: changes by 0.122 of the mean over one film frame in 2 steps from frame 3308 to 3309, most at 3308, limit 0.08
- RED whole frames, rate: changes by 0.25 of the mean over one film frame in 4 steps from frame 3311 to 3314, most at 3312, limit 0.08
- RED whole frames, rate: falls by 0.41 of the mean before its largest value (frame 3277), lowest at frame 3270, limit 0.03
- RED whole frames, rate: climbs again by 0.343 of the mean after its largest value (frame 3277), up to frame 3310, limit 0.03
- RED whole frames, turn: changes by 0.226 of the mean over one film frame in 7 steps from frame 3244 to 3250, most at 3247, limit 0.08
- RED whole frames, turn: changes by 0.184 of the mean over one film frame in 2 steps from frame 3252 to 3253, most at 3252, limit 0.08
- RED whole frames, turn: changes by 0.285 of the mean over one film frame in 16 steps from frame 3274 to 3289, most at 3288, limit 0.08
- RED whole frames, turn: changes by 0.117 of the mean over one film frame in 3 steps from frame 3291 to 3293, most at 3292, limit 0.08
- RED whole frames, turn: changes by 0.091 of the mean over one film frame at frame 3303, limit 0.08
- RED whole frames, turn: changes by 0.152 of the mean over one film frame in 2 steps from frame 3305 to 3306, most at 3305, limit 0.08
- RED whole frames, turn: changes by 0.153 of the mean over one film frame at frame 3308, limit 0.08
- RED whole frames, turn: changes by 0.522 of the mean over one film frame in 5 steps from frame 3310 to 3314, most at 3311, limit 0.08
- RED whole frames, turn: falls by 1.118 of the mean before its largest value (frame 3286), lowest at frame 3270, limit 0.03
- RED whole frames, turn: climbs again by 0.396 of the mean after its largest value (frame 3286), up to frame 3305, limit 0.03
- RED whole frames, speed: changes by 0.325 of the mean over one film frame in 11 steps from frame 3242 to 3252, most at 3248, limit 0.08
- RED whole frames, speed: changes by 0.137 of the mean over one film frame in 13 steps from frame 3257 to 3269, most at 3261, limit 0.08
- RED whole frames, speed: changes by 0.106 of the mean over one film frame in 2 steps from frame 3275 to 3276, most at 3275, limit 0.08
- RED whole frames, speed: changes by 0.096 of the mean over one film frame in 2 steps from frame 3288 to 3289, most at 3288, limit 0.08
- RED whole frames, speed: changes by 0.203 of the mean over one film frame in 4 steps from frame 3310 to 3313, most at 3311, limit 0.08
- RED whole frames, speed: climbs again by 0.191 of the mean after its largest value (frame 3254), up to frame 3309, limit 0.03
- RED rate 2, rate: changes by 0.161 of the mean over one film frame in 15 steps from frame 3241 + 1/2 to 3248 + 1/2, most at 3244 + 1/2, limit 0.08
- RED rate 2, rate: changes by 0.56 of the mean over one film frame in 8 steps from frame 3271 + 1/2 to 3275, most at 3274, limit 0.08
- RED rate 2, rate: changes by 0.308 of the mean over one film frame in 9 steps from frame 3286 + 1/2 to 3290 + 1/2, most at 3287 + 1/2, limit 0.08
- RED rate 2, rate: changes by 0.14 of the mean over one film frame in 4 steps from frame 3307 + 1/2 to 3309, most at 3308, limit 0.08
- RED rate 2, rate: changes by 0.264 of the mean over one film frame in 9 steps from frame 3310 + 1/2 to 3314 + 1/2, most at 3312 + 1/2, limit 0.08
- RED rate 2, rate: changes by 0.08 of the mean from one capture frame to the next in 2 steps from frame 3244 to 3244 + 1/2, most at 3244 + 1/2, limit 0.08
- RED rate 2, rate: changes by 0.08 of the mean from one capture frame to the next at frame 3271 + 1/2, limit 0.08
- RED rate 2, rate: changes by 0.281 of the mean from one capture frame to the next in 4 steps from frame 3273 to 3274 + 1/2, most at 3273 + 1/2, limit 0.08
- RED rate 2, rate: changes by 0.178 of the mean from one capture frame to the next in 8 steps from frame 3286 + 1/2 to 3290, most at 3287, limit 0.08
- RED rate 2, rate: changes by 0.133 of the mean from one capture frame to the next in 6 steps from frame 3310 + 1/2 to 3313, most at 3312 + 1/2, limit 0.08
- RED rate 2, rate: falls by 0.428 of the mean before its largest value (frame 3277), lowest at frame 3270 + 1/2, limit 0.03
- RED rate 2, rate: climbs again by 0.367 of the mean after its largest value (frame 3277), up to frame 3309 + 1/2, limit 0.03
- RED rate 2, turn: changes by 0.232 of the mean over one film frame in 13 steps from frame 3244 to 3250, most at 3247 + 1/2, limit 0.08
- RED rate 2, turn: changes by 0.212 of the mean over one film frame in 3 steps from frame 3251 + 1/2 to 3252 + 1/2, most at 3252, limit 0.08
- RED rate 2, turn: changes by 0.244 of the mean over one film frame in 24 steps from frame 3273 to 3284 + 1/2, most at 3274 + 1/2, limit 0.08
- RED rate 2, turn: changes by 0.107 of the mean over one film frame in 2 steps from frame 3285 + 1/2 to 3286, most at 3285 + 1/2, limit 0.08
- RED rate 2, turn: changes by 0.342 of the mean over one film frame in 6 steps from frame 3287 to 3289 + 1/2, most at 3287 + 1/2, limit 0.08
- RED rate 2, turn: changes by 0.142 of the mean over one film frame in 5 steps from frame 3291 to 3293, most at 3291 + 1/2, limit 0.08
- RED rate 2, turn: changes by 0.105 of the mean over one film frame at frame 3303, limit 0.08
- RED rate 2, turn: changes by 0.168 of the mean over one film frame in 2 steps from frame 3304 + 1/2 to 3305, most at 3305, limit 0.08
- RED rate 2, turn: changes by 0.145 of the mean over one film frame in 2 steps from frame 3306 to 3306 + 1/2, most at 3306, limit 0.08
- RED rate 2, turn: changes by 0.184 of the mean over one film frame in 3 steps from frame 3307 + 1/2 to 3308 + 1/2, most at 3308, limit 0.08
- RED rate 2, turn: changes by 0.544 of the mean over one film frame in 11 steps from frame 3309 + 1/2 to 3314 + 1/2, most at 3311, limit 0.08
- RED rate 2, turn: changes by 0.117 of the mean from one capture frame to the next in 8 steps from frame 3245 to 3248 + 1/2, most at 3247, limit 0.08
- RED rate 2, turn: changes by 0.126 of the mean from one capture frame to the next in 2 steps from frame 3251 + 1/2 to 3252, most at 3252, limit 0.08
- RED rate 2, turn: changes by 0.129 of the mean from one capture frame to the next in 3 steps from frame 3273 + 1/2 to 3274 + 1/2, most at 3274, limit 0.08
- RED rate 2, turn: changes by 0.099 of the mean from one capture frame to the next in 8 steps from frame 3279 to 3282 + 1/2, most at 3279, limit 0.08
- RED rate 2, turn: changes by 0.082 of the mean from one capture frame to the next at frame 3285 + 1/2, limit 0.08
- RED rate 2, turn: changes by 0.195 of the mean from one capture frame to the next in 6 steps from frame 3286 + 1/2 to 3289, most at 3287, limit 0.08
- RED rate 2, turn: changes by 0.111 of the mean from one capture frame to the next at frame 3304 + 1/2, limit 0.08
- RED rate 2, turn: changes by 0.087 of the mean from one capture frame to the next at frame 3305 + 1/2, limit 0.08
- RED rate 2, turn: changes by 0.118 of the mean from one capture frame to the next at frame 3307 + 1/2, limit 0.08
- RED rate 2, turn: changes by 0.296 of the mean from one capture frame to the next in 9 steps from frame 3309 + 1/2 to 3313 + 1/2, most at 3310 + 1/2, limit 0.08
- RED rate 2, turn: falls by 1.139 of the mean before its largest value (frame 3286), lowest at frame 3270 + 1/2, limit 0.03
- RED rate 2, turn: climbs again by 0.418 of the mean after its largest value (frame 3286), up to frame 3305, limit 0.03
- RED rate 2, speed: changes by 0.329 of the mean over one film frame in 21 steps from frame 3241 + 1/2 to 3251 + 1/2, most at 3248, limit 0.08
- RED rate 2, speed: changes by 0.138 of the mean over one film frame in 27 steps from frame 3256 + 1/2 to 3269 + 1/2, most at 3261, limit 0.08
- RED rate 2, speed: changes by 0.146 of the mean over one film frame in 2 steps from frame 3275 to 3275 + 1/2, most at 3275, limit 0.08
- RED rate 2, speed: changes by 0.112 of the mean over one film frame in 3 steps from frame 3287 to 3288, most at 3287 + 1/2, limit 0.08
- RED rate 2, speed: changes by 0.096 of the mean over one film frame in 2 steps from frame 3289 to 3289 + 1/2, most at 3289, limit 0.08
- RED rate 2, speed: changes by 0.083 of the mean over one film frame at frame 3308, limit 0.08
- RED rate 2, speed: changes by 0.206 of the mean over one film frame in 8 steps from frame 3309 + 1/2 to 3313, most at 3311, limit 0.08
- RED rate 2, speed: changes by 0.165 of the mean from one capture frame to the next in 17 steps from frame 3242 + 1/2 to 3250 + 1/2, most at 3247 + 1/2, limit 0.08
- RED rate 2, speed: changes by 0.091 of the mean from one capture frame to the next at frame 3275, limit 0.08
- RED rate 2, speed: changes by 0.108 of the mean from one capture frame to the next at frame 3309 + 1/2, limit 0.08
- RED rate 2, speed: changes by 0.145 of the mean from one capture frame to the next at frame 3310 + 1/2, limit 0.08
- RED rate 2, speed: climbs again by 0.198 of the mean after its largest value (frame 3254), up to frame 3309, limit 0.03

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 3228 | terrain terrain | 3.012e-3 | 0.000 |  |  | 0.000 |  |  | 0.057 |  |  |
| 3229 | terrain terrain | 3.012e-3 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.056 | 0.001 | 0.001 |
| 3230 | terrain terrain | 3.012e-3 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.056 | 0.001 | 0.001 |
| 3231 | terrain terrain | 3.012e-3 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.055 | 0.001 | 0.001 |
| 3232 | terrain terrain | 3.012e-3 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.054 | 0.001 | 0.001 |
| 3233 | terrain terrain | 3.012e-3 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.053 | 0.001 | 0.001 |
| 3234 | terrain terrain | 3.012e-3 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.052 | 0.001 | 0.001 |
| 3235 | terrain terrain | 3.012e-3 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.052 | 0.001 | 0.001 |
| 3236 | terrain terrain | 3.012e-3 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.051 | 0.001 | 0.001 |
| 3237 | terrain terrain | 3.012e-3 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.050 | 0.001 | 0.001 |
| 3238 | terrain terrain | 3.012e-3 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.049 | 0.001 | 0.001 |
| 3239 | terrain terrain | 3.012e-3 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.049 | 0.001 | 0.001 |
| 3240 first | rise terrain | 3.013e-3 | 0.001 | 0.001 | 0.016 | 0.000 | 0.000 | 0.000 | 0.047 | 0.002 | 0.006 |
| 3241 | rise terrain | 3.026e-3 | 0.046 | 0.045 | 0.092 * | 0.000 | 0.000 | 0.000 | 0.059 | 0.012 | 0.088 * |
| 3242 | rise terrain | 3.073e-3 | 0.154 | 0.108 * | 0.132 * | 0.015 | 0.015 | 0.036 | 0.186 | 0.127 * | 0.168 * |
| 3243 | rise terrain | 3.164e-3 | 0.294 | 0.141 * | 0.154 * | 0.060 | 0.045 | 0.074 | 0.366 | 0.180 * | 0.202 * |
| 3244 | rise terrain | 3.308e-3 | 0.451 | 0.157 * | 0.161 * | 0.151 | 0.092 * | 0.127 * | 0.575 | 0.209 * | 0.229 * |
| 3245 | rise terrain | 3.514e-3 | 0.610 | 0.159 * | 0.159 * | 0.298 | 0.147 * | 0.181 * | 0.811 | 0.236 * | 0.260 * |
| 3246 | rise terrain | 3.788e-3 | 0.758 | 0.149 * | 0.148 * | 0.494 | 0.196 * | 0.220 * | 1.081 | 0.270 * | 0.295 * |
| 3247 | rise terrain | 4.137e-3 | 0.889 | 0.130 * | 0.129 * | 0.721 | 0.226 * | 0.232 * | 1.389 | 0.309 * | 0.328 * |
| 3248 | rise terrain | 4.566e-3 | 0.996 | 0.107 * | 0.105 * | 0.944 | 0.224 * | 0.223 * | 1.715 | 0.325 * | 0.329 * |
| 3249 | rise terrain | 5.080e-3 | 1.078 | 0.082 * | 0.079 | 1.125 | 0.180 * | 0.174 * | 2.019 | 0.305 * | 0.304 * |
| 3250 | rise terrain | 5.685e-3 | 1.136 | 0.058 | 0.056 | 1.218 | 0.093 * | 0.081 * | 2.266 | 0.247 * | 0.241 * |
| 3251 | rise terrain | 6.385e-3 | 1.173 | 0.037 | 0.035 | 1.184 | 0.034 | 0.131 * | 2.429 | 0.163 * | 0.154 * |
| 3252 | rise terrain | 7.185e-3 | 1.192 | 0.019 | 0.017 | 1.000 | 0.184 * | 0.212 * | 2.512 | 0.083 * | 0.075 |
| 3253 | rise terrain | 8.090e-3 | 1.197 | 0.005 | 0.003 | 0.892 | 0.108 * | 0.078 | 2.574 | 0.062 | 0.062 |
| 3254 | rise terrain | 9.102e-3 | 1.191 | 0.006 | 0.012 | 0.840 | 0.052 | 0.059 | 2.595 | 0.022 | 0.016 |
| 3255 | rise terrain | 1.023e-2 | 1.177 | 0.014 | 0.018 | 0.778 | 0.062 | 0.066 | 2.570 | 0.025 | 0.051 |
| 3256 | rise terrain | 1.147e-2 | 1.157 | 0.020 | 0.023 | 0.711 | 0.067 | 0.069 | 2.507 | 0.063 | 0.084 * |
| 3257 | rise terrain | 1.283e-2 | 1.133 | 0.024 | 0.026 | 0.642 | 0.069 | 0.070 | 2.414 | 0.093 * | 0.109 * |
| 3258 | rise terrain | 1.432e-2 | 1.106 | 0.027 | 0.028 | 0.574 | 0.068 | 0.068 | 2.300 | 0.114 * | 0.125 * |
| 3259 | rise terrain | 1.593e-2 | 1.078 | 0.028 | 0.029 | 0.509 | 0.065 | 0.065 | 2.172 | 0.127 * | 0.134 * |
| 3260 | rise terrain | 1.767e-2 | 1.049 | 0.029 | 0.029 | 0.448 | 0.061 | 0.060 | 2.038 | 0.135 * | 0.138 * |
| 3261 | rise terrain | 1.955e-2 | 1.019 | 0.029 | 0.029 | 0.393 | 0.056 | 0.055 | 1.901 | 0.137 * | 0.138 * |
| 3262 | rise terrain | 2.157e-2 | 0.990 | 0.029 | 0.029 | 0.342 | 0.051 | 0.050 | 1.766 | 0.135 * | 0.136 * |
| 3263 | rise terrain | 2.372e-2 | 0.962 | 0.029 | 0.029 | 0.297 | 0.045 | 0.045 | 1.636 | 0.130 * | 0.132 * |
| 3264 | rise terrain | 2.602e-2 | 0.934 | 0.028 | 0.028 | 0.256 | 0.041 | 0.040 | 1.512 | 0.124 * | 0.125 * |
| 3265 | rise terrain | 2.847e-2 | 0.907 | 0.027 | 0.027 | 0.220 | 0.036 | 0.036 | 1.395 | 0.117 * | 0.118 * |
| 3266 | rise terrain | 3.106e-2 | 0.881 | 0.026 | 0.026 | 0.188 | 0.032 | 0.031 | 1.286 | 0.109 * | 0.109 * |
| 3267 | rise terrain | 3.381e-2 | 0.856 | 0.025 | 0.025 | 0.161 | 0.028 | 0.027 | 1.185 | 0.101 * | 0.101 * |
| 3268 | rise terrain | 3.671e-2 | 0.832 | 0.024 | 0.024 | 0.137 | 0.024 | 0.024 | 1.092 | 0.093 * | 0.093 * |
| 3269 | rise terrain | 3.977e-2 | 0.809 | 0.023 | 0.023 | 0.117 | 0.020 | 0.020 | 1.007 | 0.085 * | 0.085 * |
| 3270 T | rise terrain | 4.300e-2 | 0.787 | 0.022 | 0.023 | 0.100 | 0.017 | 0.016 | 0.929 | 0.078 | 0.078 |
| 3271 | rise orbit | 4.660e-2 | 0.813 | 0.026 | 0.137 * | 0.101 | 0.001 | 0.028 | 0.900 | 0.029 | 0.059 |
| 3272 | rise orbit | 5.127e-2 | 0.965 | 0.152 * | 0.156 * | 0.140 | 0.039 | 0.059 | 0.936 | 0.036 | 0.034 |
| 3273 | rise orbit | 5.744e-2 | 1.147 | 0.182 * | 0.380 * | 0.218 | 0.077 | 0.148 * | 0.884 | 0.053 | 0.071 |
| 3274 | rise orbit | 6.760e-2 | 1.643 | 0.497 * | 0.560 * | 0.422 | 0.204 * | 0.244 * | 0.919 | 0.035 | 0.055 |
| 3275 | rise orbit | 8.124e-2 | 1.856 | 0.212 * | 0.129 * | 0.615 | 0.193 * | 0.175 * | 0.812 | 0.106 * | 0.146 * |
| 3276 | rise orbit | 9.775e-2 | 1.868 | 0.013 | 0.077 | 0.740 | 0.125 * | 0.145 * | 0.732 | 0.080 * | 0.061 |
| 3277 | rise orbit | 1.183e-1 | 1.926 | 0.058 | 0.055 | 0.880 | 0.140 * | 0.142 * | 0.717 | 0.015 | 0.028 |
| 3278 | rise orbit | 1.426e-1 | 1.884 | 0.042 | 0.059 | 0.989 | 0.108 * | 0.125 * | 0.679 | 0.037 | 0.041 |
| 3279 | rise orbit | 1.718e-1 | 1.880 | 0.005 | 0.009 | 1.146 | 0.158 * | 0.191 * | 0.664 | 0.015 | 0.009 |
| 3280 | rise orbit | 2.067e-1 | 1.867 | 0.012 | 0.022 | 1.326 | 0.179 * | 0.175 * | 0.653 | 0.011 | 0.013 |
| 3281 | rise orbit | 2.485e-1 | 1.862 | 0.006 | 0.011 | 1.504 | 0.179 * | 0.188 * | 0.654 | 0.001 | 0.013 |
| 3282 | rise orbit | 2.991e-1 | 1.871 | 0.010 | 0.010 | 1.687 | 0.182 * | 0.182 * | 0.671 | 0.017 | 0.020 |
| 3283 | rise orbit | 3.600e-1 | 1.870 | 0.001 | 0.005 | 1.845 | 0.159 * | 0.155 * | 0.694 | 0.023 | 0.029 |
| 3284 | rise orbit | 4.335e-1 | 1.877 | 0.007 | 0.012 | 1.992 | 0.147 * | 0.148 * | 0.727 | 0.034 | 0.034 |
| 3285 | rise orbit | 5.207e-1 | 1.850 | 0.026 | 0.037 | 2.078 | 0.086 * | 0.107 * | 0.752 | 0.025 | 0.040 |
| 3286 | rise orbit | 6.261e-1 | 1.862 | 0.011 | 0.108 * | 2.176 | 0.098 * | 0.107 * | 0.796 | 0.044 | 0.046 |
| 3287 | rise orbit | 7.363e-1 | 1.637 | 0.225 * | 0.308 * | 1.959 | 0.217 * | 0.342 * | 0.725 | 0.071 | 0.112 * |
| 3288 | rise orbit | 8.447e-1 | 1.386 | 0.251 * | 0.228 * | 1.674 | 0.285 * | 0.262 * | 0.629 | 0.096 * | 0.082 * |
| 3289 | rise orbit | 9.485e-1 | 1.170 | 0.215 * | 0.225 * | 1.436 | 0.238 * | 0.228 * | 0.533 | 0.096 * | 0.096 * |
| 3290 | rise orbit | 1.044e+0 | 0.972 | 0.198 * | 0.192 * | 1.364 | 0.073 | 0.056 | 0.466 | 0.067 | 0.058 |
| 3291 | rise orbit | 1.140e+0 | 0.888 | 0.085 * | 0.068 | 1.455 | 0.092 * | 0.142 * | 0.467 | 0.001 | 0.025 |
| 3292 | rise orbit | 1.239e+0 | 0.835 | 0.052 | 0.057 | 1.573 | 0.117 * | 0.107 * | 0.486 | 0.019 | 0.018 |
| 3293 | rise orbit | 1.339e+0 | 0.786 | 0.049 | 0.047 | 1.658 | 0.086 * | 0.086 * | 0.502 | 0.016 | 0.017 |
| 3294 | rise orbit | 1.442e+0 | 0.745 | 0.041 | 0.043 | 1.722 | 0.063 | 0.059 | 0.515 | 0.013 | 0.013 |
| 3295 | rise orbit | 1.545e+0 | 0.702 | 0.043 | 0.043 | 1.745 | 0.023 | 0.019 | 0.519 | 0.004 | 0.003 |
| 3296 | rise orbit | 1.650e+0 | 0.661 | 0.041 | 0.041 | 1.738 | 0.007 | 0.012 | 0.516 | 0.003 | 0.003 |
| 3297 | rise orbit | 1.756e+0 | 0.629 | 0.032 | 0.031 | 1.726 | 0.012 | 0.023 | 0.516 | 0.000 | 0.002 |
| 3298 | rise orbit | 1.863e+0 | 0.598 | 0.030 | 0.031 | 1.696 | 0.030 | 0.035 | 0.512 | 0.004 | 0.005 |
| 3299 | rise orbit | 1.974e+0 | 0.581 | 0.017 | 0.015 | 1.684 | 0.012 | 0.010 | 0.513 | 0.001 | 0.003 |
| 3300 | rise orbit | 2.087e+0 | 0.566 | 0.015 | 0.016 | 1.664 | 0.020 | 0.024 | 0.512 | 0.001 | 0.002 |
| 3301 | rise orbit | 2.206e+0 | 0.560 | 0.007 | 0.005 | 1.653 | 0.011 | 0.006 | 0.514 | 0.002 | 0.005 |
| 3302 | rise orbit | 2.332e+0 | 0.558 | 0.001 | 0.023 | 1.645 | 0.008 | 0.077 | 0.517 | 0.003 | 0.019 |
| 3303 | rise orbit | 2.458e+0 | 0.532 | 0.027 | 0.031 | 1.554 | 0.091 * | 0.105 * | 0.493 | 0.024 | 0.028 |
| 3304 | rise orbit | 2.598e+0 | 0.560 | 0.029 | 0.067 | 1.607 | 0.053 | 0.147 * | 0.517 | 0.024 | 0.055 |
| 3305 | rise orbit | 2.766e+0 | 0.633 | 0.073 | 0.080 | 1.759 | 0.152 * | 0.168 * | 0.576 | 0.059 | 0.063 |
| 3306 | rise orbit | 2.941e+0 | 0.620 | 0.013 | 0.026 | 1.651 | 0.108 * | 0.145 * | 0.549 | 0.027 | 0.040 |
| 3307 | rise orbit | 3.130e+0 | 0.626 | 0.007 | 0.087 * | 1.577 | 0.074 | 0.098 * | 0.534 | 0.014 | 0.047 |
| 3308 | rise orbit | 3.370e+0 | 0.749 | 0.122 * | 0.140 * | 1.729 | 0.153 * | 0.184 * | 0.608 | 0.074 | 0.083 * |
| 3309 | rise orbit | 3.668e+0 | 0.856 | 0.107 * | 0.105 * | 1.737 | 0.008 | 0.139 * | 0.657 | 0.049 | 0.095 * |
| 3310 | rise orbit | 4.000e+0 | 0.874 | 0.019 | 0.126 * | 1.483 | 0.254 * | 0.484 * | 0.525 | 0.132 * | 0.179 * |
| 3311 | rise orbit | 4.280e+0 | 0.683 | 0.191 * | 0.237 * | 0.962 | 0.522 * | 0.544 * | 0.322 | 0.203 * | 0.206 * |
| 3312 | rise orbit | 4.468e+0 | 0.434 | 0.250 * | 0.264 * | 0.541 | 0.420 * | 0.410 * | 0.196 | 0.126 * | 0.124 * |
| 3313 | rise orbit | 4.561e+0 | 0.207 | 0.227 * | 0.217 * | 0.247 | 0.294 * | 0.276 * | 0.076 | 0.120 * | 0.100 * |
| 3314 last | rise orbit | 4.595e+0 | 0.076 | 0.131 * | 0.125 * | 0.086 | 0.161 * | 0.154 * | 0.025 | 0.051 | 0.060 |
| 3315 | travel orbit | 4.601e+0 | 0.012 | 0.063 | 0.054 | 0.009 | 0.077 | 0.065 | 0.024 | 0.002 | 0.003 |
| 3316 | travel orbit | 4.603e+0 | 0.005 | 0.007 | 0.002 | 0.002 | 0.007 | 0.001 | 0.030 | 0.006 | 0.023 |
| 3317 | travel orbit | 4.605e+0 | 0.004 | 0.001 | 0.002 | 0.002 | 0.000 | 0.000 | 0.070 | 0.040 | 0.068 |
| 3318 | travel orbit | 4.606e+0 | 0.001 | 0.003 | 0.003 | 0.002 | 0.000 | 0.000 | 0.149 | 0.080 | 0.105 * |
| 3319 | travel orbit | 4.605e+0 | -0.002 | 0.004 | 0.004 | 0.002 | 0.000 | 0.000 | 0.270 | 0.120 * | 0.146 * |
| 3320 | travel orbit | 4.601e+0 | -0.007 | 0.005 | 0.005 | 0.002 | 0.000 | 0.000 | 0.428 | 0.159 * | 0.185 * |
| 3321 | travel orbit | 4.596e+0 | -0.013 | 0.006 | 0.006 | 0.002 | 0.000 | 0.000 | 0.626 | 0.197 * | 0.225 * |
| 3322 | travel orbit | 4.587e+0 | -0.019 | 0.006 | 0.007 | 0.002 | 0.000 | 0.000 | 0.863 | 0.237 * | 0.266 * |
| 3323 | travel orbit | 4.575e+0 | -0.026 | 0.007 | 0.007 | 0.002 | 0.000 | 0.000 | 1.141 | 0.278 * | 0.309 * |
| 3324 | travel orbit | 4.560e+0 | -0.033 | 0.007 | 0.007 | 0.002 | 0.000 | 0.000 | 1.463 | 0.322 * | 0.355 * |
| 3325 | travel orbit | 4.542e+0 | -0.040 | 0.007 | 0.007 | 0.002 | 0.000 | 0.000 | 1.831 | 0.368 * | 0.404 * |
| 3326 | travel orbit | 4.522e+0 | -0.046 | 0.006 | 0.006 | 0.002 | 0.000 | 0.000 | 2.250 | 0.418 * | 0.458 * |

## pictures

Note: the page has no capture rate yet: the pictures are whole film frames.

Tier draft, rate 1, 7.05 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

### dive (jupiter.dive, frames 2970 to 3059, window 2958 to 3071, 114 draft frames at rate 1)

Largest level step: 1.23 at frame 2990 (display values 0 to 255, the frame against the middle of its two neighbours), no limit yet, not judged.
Largest pop score: 1.34 from frame 2975 to the next, no limit yet, not judged.
Largest pop score of one block (a grid of 16 by 9): 11.72 from frame 2975 to the next, block column 12 row 5 from the top left, no limit yet, not judged.
The four largest pops, each with the next frame and what is left without the motion: out/work/smooth/jupiter-dive-pops.png

| frame | level | level step | motion px | left | median round it | pop | pop of one block | block |
|---|---|---|---|---|---|---|---|---|
| 2958 | 59.04 |  | 0.6 | 0.90 | 0.90 | 1.00 | 1.10 | 1,0 |
| 2959 | 59.05 | 0.00 | 0.6 | 0.90 | 0.90 | 1.00 | 1.08 | 3,0 |
| 2960 | 59.06 | 0.00 | 0.6 | 0.90 | 0.90 | 1.00 | 1.11 | 0,8 |
| 2961 | 59.08 | 0.00 | 0.6 | 0.90 | 0.90 | 1.01 | 1.13 | 15,3 |
| 2962 | 59.09 | 0.00 | 0.6 | 0.90 | 0.90 | 1.00 | 1.14 | 2,8 |
| 2963 | 59.10 | 0.00 | 0.6 | 0.89 | 0.90 | 0.99 | 1.08 | 0,0 |
| 2964 | 59.11 | 0.00 | 0.6 | 0.89 | 0.90 | 0.99 | 1.06 | 4,7 |
| 2965 | 59.12 | 0.00 | 0.6 | 0.89 | 0.90 | 0.99 | 1.14 | 0,8 |
| 2966 | 59.13 | 0.00 | 0.6 | 0.89 | 0.90 | 0.99 | 1.08 | 1,2 |
| 2967 | 59.14 | 0.00 | 0.6 | 0.88 | 0.90 | 0.98 | 1.04 | 1,8 |
| 2968 | 59.15 | 0.00 | 0.6 | 0.88 | 0.90 | 0.97 | 1.07 | 3,8 |
| 2969 | 59.16 | 0.00 | 0.6 | 0.88 | 1.01 | 0.88 | 1.08 | 13,4 |
| 2970 first | 59.17 | 0.02 | 0.8 | 1.11 | 1.25 | 0.89 | 1.56 | 8,1 |
| 2971 | 59.23 | 0.10 | 4.3 | 1.59 | 1.37 | 1.16 | 2.76 | 11,2 |
| 2972 | 59.48 | 0.18 | 10.1 | 1.64 | 1.61 | 1.02 | 4.07 | 11,2 |
| 2973 | 60.09 | 0.25 | 17.1 | 1.83 | 1.61 | 1.14 | 4.41 | 12,3 |
| 2974 | 61.20 | 0.31 | 25.1 | 2.03 | 1.63 | 1.25 | 9.39 | 12,4 |
| 2975 | 62.93 | 0.48 | 31.4 | 2.19 | 1.63 | 1.34 | 11.72 | 12,5 |
| 2976 | 65.62 | 0.36 | 37.7 | 2.12 | 1.65 | 1.29 | 10.18 | 12,5 |
| 2977 | 69.05 | 0.25 | 39.0 | 1.99 | 1.66 | 1.20 | 6.50 | 12,6 |
| 2978 | 72.97 | 0.19 | 37.5 | 1.82 | 1.67 | 1.09 | 4.10 | 12,6 |
| 2979 | 77.27 | 0.20 | 35.7 | 1.68 | 1.82 | 0.92 | 5.41 | 12,7 |
| 2980 | 81.96 | 0.06 | 33.9 | 1.62 | 1.83 | 0.89 | 4.91 | 12,7 |
| 2981 | 86.78 | 0.11 | 31.1 | 1.59 | 1.91 | 0.83 | 3.93 | 12,8 |
| 2982 | 91.84 | 0.10 | 28.6 | 1.65 | 2.01 | 0.82 | 9.30 | 11,8 |
| 2983 | 97.09 | 0.29 | 27.9 | 1.59 | 2.02 | 0.79 | 2.26 | 1,5 |
| 2984 | 102.92 | 0.17 | 28.2 | 1.67 | 2.02 | 0.83 | 2.72 | 1,5 |
| 2985 | 109.11 | 0.18 | 29.7 | 1.83 | 2.02 | 0.90 | 2.33 | 2,7 |
| 2986 | 115.65 | 0.31 | 29.7 | 2.06 | 2.07 | 0.99 | 3.27 | 0,5 |
| 2987 | 122.83 | 0.30 | 32.6 | 2.32 | 2.38 | 0.97 | 3.24 | 1,1 |
| 2988 | 130.60 | 0.46 | 36.3 | 2.71 | 2.67 | 1.01 | 4.04 | 0,4 |
| 2989 | 139.30 | 0.19 | 40.6 | 3.10 | 2.87 | 1.08 | 10.11 | 0,3 |
| 2990 | 148.38 | 1.23 | 42.7 | 3.02 | 3.10 | 0.97 | 2.63 | 13,5 |
| 2991 | 154.99 | 1.20 | 43.3 | 3.11 | 3.14 | 0.99 | 2.53 | 13,0 |
| 2992 | 159.20 | 0.65 | 42.7 | 3.18 | 3.16 | 1.00 | 2.08 | 13,0 |
| 2993 | 162.12 | 0.50 | 42.7 | 3.23 | 3.20 | 1.01 | 2.24 | 6,0 |
| 2994 | 164.03 | 0.37 | 41.6 | 3.27 | 3.22 | 1.01 | 3.99 | 15,8 |
| 2995 | 165.20 | 0.15 | 41.6 | 3.24 | 3.22 | 1.01 | 1.90 | 14,5 |
| 2996 | 166.68 | 0.09 | 40.1 | 3.21 | 3.23 | 0.99 | 1.70 | 13,0 |
| 2997 | 168.33 | 0.04 | 40.0 | 3.27 | 3.22 | 1.02 | 1.66 | 5,8 |
| 2998 | 169.89 | 0.09 | 38.8 | 3.33 | 3.22 | 1.03 | 2.03 | 1,8 |
| 2999 | 171.27 | 0.35 | 37.6 | 3.32 | 3.22 | 1.03 | 3.82 | 0,8 |
| 3000 | 171.95 | 0.37 | 37.1 | 3.30 | 3.22 | 1.02 | 1.77 | 2,0 |
| 3001 | 171.89 | 0.33 | 37.5 | 3.31 | 3.22 | 1.03 | 1.80 | 1,0 |
| 3002 | 171.17 | 0.26 | 36.4 | 3.25 | 3.20 | 1.02 | 2.15 | 0,5 |
| 3003 | 169.93 | 0.23 | 37.2 | 3.18 | 3.16 | 1.01 | 2.25 | 0,5 |
| 3004 | 168.23 | 0.11 | 37.1 | 3.11 | 3.12 | 0.99 | 1.97 | 3,8 |
| 3005 | 166.31 | 0.11 | 39.1 | 3.06 | 3.06 | 1.00 | 3.24 | 0,6 |
| 3006 | 164.17 | 0.46 | 38.6 | 3.02 | 3.00 | 1.01 | 3.19 | 0,8 |
| 3007 | 162.96 | 0.24 | 41.9 | 2.93 | 2.95 | 1.00 | 1.63 | 0,3 |
| 3008 | 162.24 | 0.17 | 42.7 | 2.88 | 2.90 | 0.99 | 2.53 | 0,8 |
| 3009 | 161.86 | 0.34 | 43.7 | 2.84 | 2.87 | 0.99 | 2.67 | 2,8 |
| 3010 | 160.79 | 0.45 | 43.2 | 2.76 | 2.85 | 0.97 | 1.77 | 0,8 |
| 3011 | 158.82 | 0.18 | 39.7 | 2.78 | 2.81 | 0.99 | 3.87 | 0,6 |
| 3012 | 157.20 | 0.05 | 36.8 | 2.79 | 2.77 | 1.01 | 2.11 | 15,0 |
| 3013 | 155.68 | 0.12 | 33.9 | 2.86 | 2.75 | 1.04 | 2.45 | 14,0 |
| 3014 | 154.41 | 0.38 | 32.4 | 2.74 | 2.67 | 1.03 | 2.00 | 6,8 |
| 3015 | 153.91 | 0.32 | 30.7 | 2.59 | 2.60 | 0.99 | 2.45 | 0,5 |
| 3016 | 154.04 | 0.09 | 28.6 | 2.46 | 2.45 | 1.01 | 2.04 | 0,6 |
| 3017 | 154.35 | 0.06 | 26.9 | 2.31 | 2.34 | 0.99 | 2.39 | 0,8 |
| 3018 | 154.54 | 0.11 | 25.8 | 2.23 | 2.21 | 1.01 | 2.69 | 3,8 |
| 3019 | 154.95 | 0.07 | 25.6 | 2.11 | 2.15 | 0.98 | 2.77 | 1,8 |
| 3020 | 155.50 | 0.03 | 25.7 | 1.97 | 2.10 | 0.94 | 3.09 | 3,8 |
| 3021 | 155.99 | 0.10 | 26.9 | 1.97 | 2.08 | 0.95 | 3.76 | 14,8 |
| 3022 | 156.69 | 0.02 | 27.2 | 1.94 | 2.06 | 0.94 | 2.44 | 6,8 |
| 3023 | 157.33 | 0.81 | 29.2 | 1.90 | 2.03 | 0.93 | 2.13 | 0,8 |
| 3024 | 156.36 | 0.42 | 29.8 | 2.08 | 2.00 | 1.04 | 1.83 | 1,8 |
| 3025 | 154.54 | 0.11 | 30.4 | 2.08 | 2.00 | 1.04 | 1.88 | 8,8 |
| 3026 | 152.51 | 0.15 | 30.5 | 2.04 | 2.00 | 1.02 | 2.51 | 0,8 |
| 3027 | 150.18 | 0.19 | 31.3 | 1.99 | 2.00 | 0.99 | 1.67 | 14,4 |
| 3028 | 147.48 | 0.13 | 31.9 | 2.01 | 2.00 | 1.00 | 2.05 | 9,8 |
| 3029 | 144.51 | 0.13 | 32.1 | 2.02 | 2.00 | 1.01 | 2.02 | 0,4 |
| 3030 | 141.27 | 0.05 | 32.7 | 1.99 | 2.03 | 0.98 | 2.39 | 0,8 |
| 3031 | 138.13 | 0.19 | 33.4 | 2.00 | 2.03 | 0.98 | 2.31 | 0,4 |
| 3032 | 135.36 | 0.27 | 33.8 | 2.00 | 2.03 | 0.98 | 2.63 | 0,6 |
| 3033 | 133.13 | 0.31 | 34.3 | 2.00 | 2.03 | 0.99 | 2.84 | 0,6 |
| 3034 | 130.27 | 0.23 | 34.2 | 2.03 | 2.03 | 1.00 | 2.44 | 1,8 |
| 3035 | 127.88 | 0.22 | 33.6 | 2.06 | 2.02 | 1.02 | 3.58 | 1,8 |
| 3036 | 125.04 | 0.10 | 34.6 | 2.03 | 2.02 | 1.01 | 3.37 | 4,8 |
| 3037 | 122.41 | 0.18 | 34.6 | 2.07 | 2.03 | 1.02 | 4.02 | 7,8 |
| 3038 | 119.42 | 0.47 | 34.2 | 2.09 | 2.03 | 1.03 | 2.43 | 0,0 |
| 3039 | 115.49 | 0.19 | 34.1 | 2.04 | 2.03 | 1.01 | 2.74 | 8,8 |
| 3040 | 111.18 | 0.16 | 33.2 | 2.04 | 2.04 | 1.00 | 3.81 | 8,8 |
| 3041 | 106.56 | 0.12 | 33.1 | 2.01 | 2.05 | 0.98 | 2.81 | 14,5 |
| 3042 | 102.19 | 0.11 | 32.5 | 2.03 | 2.07 | 0.98 | 3.24 | 15,5 |
| 3043 | 98.04 | 0.25 | 31.8 | 1.96 | 2.08 | 0.94 | 2.85 | 11,7 |
| 3044 | 94.39 | 0.21 | 31.1 | 1.99 | 2.13 | 0.93 | 3.07 | 12,7 |
| 3045 | 91.15 | 0.22 | 29.9 | 2.17 | 2.20 | 0.99 | 3.26 | 8,8 |
| 3046 | 88.35 | 0.12 | 28.8 | 2.32 | 2.26 | 1.02 | 4.06 | 8,8 |
| 3047 | 85.79 | 0.19 | 27.1 | 2.67 | 2.33 | 1.15 | 4.79 | 3,7 |
| 3048 | 83.61 | 0.06 | 26.9 | 2.79 | 2.39 | 1.17 | 4.42 | 14,8 |
| 3049 | 81.31 | 0.19 | 25.9 | 2.72 | 2.42 | 1.12 | 7.74 | 14,8 |
| 3050 | 78.62 | 0.19 | 23.4 | 2.62 | 2.42 | 1.08 | 7.87 | 14,8 |
| 3051 | 75.56 | 0.11 | 19.9 | 2.57 | 2.42 | 1.06 | 7.51 | 15,8 |
| 3052 | 72.27 | 0.14 | 15.7 | 2.46 | 2.42 | 1.02 | 4.45 | 15,8 |
| 3053 | 69.27 | 0.26 | 11.8 | 2.44 | 2.42 | 1.01 | 2.55 | 1,8 |
| 3054 | 66.79 | 0.23 | 8.7 | 2.35 | 2.43 | 0.97 | 2.20 | 0,8 |
| 3055 | 64.77 | 0.11 | 6.4 | 2.42 | 2.43 | 1.00 | 1.94 | 13,5 |
| 3056 | 62.97 | 0.07 | 5.2 | 2.73 | 2.38 | 1.14 | 3.02 | 13,5 |
| 3057 | 61.02 | 0.25 | 3.5 | 2.42 | 2.23 | 1.09 | 2.58 | 13,5 |
| 3058 | 59.56 | 0.27 | 1.9 | 2.10 | 1.99 | 1.06 | 1.78 | 13,5 |
| 3059 last | 58.63 | 0.15 | 1.1 | 1.62 | 1.66 | 0.98 | 2.16 | 13,5 |
| 3060 | 58.01 | 0.28 | 1.0 | 1.22 | 1.42 | 0.86 | 1.08 | 0,4 |
| 3061 | 57.94 | 0.00 | 1.0 | 1.21 | 1.22 | 0.99 | 1.10 | 1,7 |
| 3062 | 57.89 | 0.00 | 1.0 | 1.21 | 1.22 | 1.00 | 1.06 | 3,4 |
| 3063 | 57.84 | 0.00 | 1.0 | 1.21 | 1.22 | 0.99 | 1.12 | 7,7 |
| 3064 | 57.80 | 0.00 | 1.0 | 1.21 | 1.22 | 0.99 | 1.11 | 1,5 |
| 3065 | 57.77 | 0.00 | 1.0 | 1.22 | 1.22 | 1.00 | 1.11 | 4,8 |
| 3066 | 57.74 | 0.00 | 1.0 | 1.22 | 1.22 | 1.00 | 1.21 | 2,8 |
| 3067 | 57.72 | 0.00 | 1.0 | 1.22 | 1.22 | 1.00 | 1.28 | 2,8 |
| 3068 | 57.70 | 0.00 | 1.0 | 1.21 | 1.22 | 1.00 | 1.27 | 2,8 |
| 3069 | 57.69 | 0.01 | 1.0 | 1.21 | 1.22 | 1.00 | 1.33 | 4,8 |
| 3070 | 57.69 | 0.00 | 1.0 | 1.21 | 1.22 | 1.00 | 1.37 | 2,8 |
| 3071 | 57.69 |  |  |  |  |  |  |  |

### rise (jupiter.rise, frames 3240 to 3314, window 3228 to 3326, 99 draft frames at rate 1)

Largest level step: 2.30 at frame 3287 (display values 0 to 255, the frame against the middle of its two neighbours), no limit yet, not judged.
Largest pop score: 1.31 from frame 3249 to the next, no limit yet, not judged.
Largest pop score of one block (a grid of 16 by 9): 5.85 from frame 3308 to the next, block column 15 row 8 from the top left, no limit yet, not judged.
The four largest pops, each with the next frame and what is left without the motion: out/work/smooth/jupiter-rise-pops.png

| frame | level | level step | motion px | left | median round it | pop | pop of one block | block |
|---|---|---|---|---|---|---|---|---|
| 3228 | 59.71 |  | 1.1 | 1.29 | 1.27 | 1.01 | 1.44 | 3,6 |
| 3229 | 59.69 | 0.00 | 1.0 | 1.28 | 1.27 | 1.01 | 1.35 | 3,6 |
| 3230 | 59.66 | 0.01 | 1.0 | 1.27 | 1.27 | 1.00 | 1.36 | 3,6 |
| 3231 | 59.64 | 0.00 | 1.0 | 1.26 | 1.28 | 0.99 | 1.27 | 3,6 |
| 3232 | 59.63 | 0.00 | 1.0 | 1.26 | 1.28 | 0.99 | 1.22 | 3,6 |
| 3233 | 59.63 | 0.00 | 1.0 | 1.26 | 1.28 | 0.98 | 1.16 | 3,6 |
| 3234 | 59.63 | 0.00 | 1.0 | 1.26 | 1.28 | 0.98 | 1.12 | 2,6 |
| 3235 | 59.64 | 0.00 | 1.0 | 1.24 | 1.28 | 0.97 | 1.17 | 10,7 |
| 3236 | 59.65 | 0.00 | 1.0 | 1.24 | 1.28 | 0.97 | 1.30 | 10,7 |
| 3237 | 59.67 | 0.01 | 0.9 | 1.23 | 1.28 | 0.96 | 1.38 | 10,7 |
| 3238 | 59.71 | 0.00 | 0.9 | 1.23 | 1.39 | 0.89 | 1.29 | 10,7 |
| 3239 | 59.75 | 0.21 | 1.0 | 1.50 | 1.54 | 0.98 | 2.12 | 14,5 |
| 3240 first | 60.21 | 0.10 | 1.7 | 1.81 | 1.88 | 0.96 | 1.74 | 5,3 |
| 3241 | 60.88 | 0.25 | 3.8 | 2.26 | 2.15 | 1.05 | 2.19 | 11,4 |
| 3242 | 62.04 | 0.24 | 6.3 | 2.57 | 2.38 | 1.08 | 2.30 | 15,2 |
| 3243 | 63.69 | 0.23 | 9.0 | 2.61 | 2.53 | 1.03 | 2.14 | 11,4 |
| 3244 | 65.80 | 0.05 | 12.0 | 2.49 | 2.61 | 0.95 | 2.05 | 15,2 |
| 3245 | 68.01 | 0.17 | 16.4 | 2.60 | 2.74 | 0.95 | 2.03 | 15,2 |
| 3246 | 70.56 | 0.22 | 22.3 | 2.87 | 2.74 | 1.05 | 2.03 | 15,2 |
| 3247 | 73.53 | 0.18 | 30.1 | 3.18 | 2.83 | 1.12 | 2.83 | 15,4 |
| 3248 | 76.88 | 0.27 | 36.8 | 3.51 | 2.83 | 1.24 | 3.85 | 2,8 |
| 3249 | 79.69 | 0.36 | 41.5 | 3.72 | 2.83 | 1.31 | 5.68 | 2,8 |
| 3250 | 81.79 | 0.10 | 42.0 | 3.63 | 2.83 | 1.28 | 3.75 | 8,6 |
| 3251 | 83.69 | 0.13 | 39.6 | 3.47 | 2.83 | 1.22 | 4.18 | 14,3 |
| 3252 | 85.32 | 0.48 | 39.3 | 3.10 | 2.83 | 1.09 | 3.76 | 15,3 |
| 3253 | 87.92 | 0.24 | 40.5 | 2.96 | 2.83 | 1.05 | 2.93 | 15,3 |
| 3254 | 90.99 | 0.53 | 41.2 | 2.86 | 2.83 | 1.01 | 2.42 | 4,6 |
| 3255 | 95.12 | 0.01 | 42.2 | 2.80 | 2.80 | 1.00 | 4.55 | 12,8 |
| 3256 | 99.27 | 0.27 | 41.8 | 2.73 | 2.70 | 1.01 | 2.82 | 11,8 |
| 3257 | 103.97 | 0.10 | 42.2 | 2.60 | 2.66 | 0.98 | 2.37 | 8,0 |
| 3258 | 108.88 | 0.19 | 42.1 | 2.51 | 2.62 | 0.96 | 2.20 | 10,7 |
| 3259 | 113.40 | 0.26 | 41.8 | 2.48 | 2.62 | 0.95 | 2.11 | 8,8 |
| 3260 | 117.39 | 0.29 | 41.5 | 2.50 | 2.62 | 0.95 | 2.72 | 8,8 |
| 3261 | 120.81 | 0.53 | 41.1 | 2.49 | 2.62 | 0.95 | 2.90 | 7,8 |
| 3262 | 123.17 | 0.20 | 40.6 | 2.52 | 2.59 | 0.97 | 1.96 | 7,7 |
| 3263 | 125.13 | 0.08 | 39.9 | 2.57 | 2.59 | 0.99 | 2.80 | 7,7 |
| 3264 | 127.26 | 0.09 | 39.3 | 2.59 | 2.59 | 1.00 | 2.28 | 0,6 |
| 3265 | 129.21 | 0.25 | 38.5 | 2.57 | 2.59 | 0.99 | 1.75 | 7,6 |
| 3266 | 131.66 | 0.38 | 37.8 | 2.64 | 2.58 | 1.02 | 2.04 | 0,4 |
| 3267 | 134.86 | 0.07 | 37.0 | 2.70 | 2.60 | 1.04 | 1.95 | 11,3 |
| 3268 | 137.91 | 0.03 | 36.3 | 2.70 | 2.62 | 1.03 | 1.68 | 1,4 |
| 3269 | 140.89 | 0.39 | 35.4 | 2.74 | 2.67 | 1.03 | 1.90 | 14,4 |
| 3270 | 143.11 | 0.21 | 36.6 | 2.43 | 2.72 | 0.89 | 1.46 | 9,8 |
| 3271 | 145.74 | 0.71 | 42.4 | 2.61 | 2.75 | 0.95 | 1.69 | 9,7 |
| 3272 | 146.96 | 0.88 | 48.3 | 2.75 | 3.02 | 0.91 | 2.42 | 0,8 |
| 3273 | 146.42 | 0.16 | 64.3 | 3.29 | 3.30 | 1.00 | 3.05 | 15,0 |
| 3274 | 146.19 | 0.13 | 67.8 | 3.85 | 3.73 | 1.03 | 4.74 | 15,0 |
| 3275 | 146.22 | 1.56 | 68.2 | 4.17 | 4.35 | 0.96 | 2.29 | 0,0 |
| 3276 | 149.38 | 0.18 | 68.9 | 4.85 | 4.80 | 1.01 | 3.81 | 15,2 |
| 3277 | 152.88 | 1.56 | 67.7 | 5.43 | 5.17 | 1.05 | 4.48 | 15,1 |
| 3278 | 153.27 | 0.71 | 63.5 | 5.48 | 5.32 | 1.03 | 2.18 | 12,5 |
| 3279 | 152.23 | 0.69 | 63.7 | 5.96 | 5.32 | 1.12 | 2.77 | 11,4 |
| 3280 | 152.58 | 0.38 | 65.9 | 6.35 | 5.32 | 1.19 | 3.61 | 11,4 |
| 3281 | 152.17 | 0.14 | 60.9 | 6.58 | 5.32 | 1.24 | 4.88 | 15,3 |
| 3282 | 151.49 | 0.32 | 61.6 | 6.51 | 5.32 | 1.22 | 3.55 | 15,1 |
| 3283 | 150.17 | 1.54 | 64.6 | 6.76 | 5.32 | 1.27 | 4.75 | 15,1 |
| 3284 | 145.77 | 0.55 | 64.9 | 6.42 | 5.32 | 1.21 | 3.80 | 15,7 |
| 3285 | 140.28 | 0.13 | 69.3 | 5.75 | 5.32 | 1.08 | 2.68 | 14,1 |
| 3286 | 135.05 | 1.03 | 62.6 | 5.20 | 4.99 | 1.04 | 3.04 | 14,0 |
| 3287 | 127.75 | 2.30 | 53.9 | 4.49 | 4.73 | 0.95 | 2.34 | 14,0 |
| 3288 | 115.85 | 0.43 | 46.2 | 3.96 | 4.38 | 0.91 | 2.18 | 5,6 |
| 3289 | 104.81 | 0.99 | 40.4 | 3.65 | 4.11 | 0.89 | 1.86 | 0,4 |
| 3290 | 95.75 | 0.60 | 40.3 | 3.55 | 3.82 | 0.93 | 2.43 | 1,4 |
| 3291 | 87.89 | 0.53 | 42.9 | 3.67 | 3.66 | 1.00 | 3.46 | 1,5 |
| 3292 | 81.08 | 0.36 | 47.7 | 3.62 | 3.66 | 0.99 | 3.05 | 11,8 |
| 3293 | 75.00 | 0.32 | 36.8 | 4.26 | 3.58 | 1.19 | 5.51 | 1,3 |
| 3294 | 69.55 | 0.52 | 39.6 | 3.67 | 2.86 | 1.28 | 4.11 | 2,3 |
| 3295 | 63.08 | 1.07 | 44.0 | 2.17 | 2.81 | 0.77 | 2.07 | 11,6 |
| 3296 | 58.74 | 0.23 | 44.7 | 2.06 | 2.02 | 1.02 | 1.78 | 8,8 |
| 3297 | 54.87 | 0.18 | 58.4 | 1.87 | 1.89 | 0.99 | 1.75 | 11,5 |
| 3298 | 51.36 | 0.13 | 67.3 | 1.72 | 1.80 | 0.96 | 1.87 | 15,3 |
| 3299 | 48.10 | 0.09 | 69.7 | 1.63 | 1.75 | 0.94 | 2.09 | 11,5 |
| 3300 | 45.02 | 0.08 | 66.2 | 1.66 | 1.72 | 0.96 | 1.53 | 11,5 |
| 3301 | 42.09 | 0.09 | 71.6 | 1.62 | 1.71 | 0.94 | 1.46 | 10,5 |
| 3302 | 39.34 | 0.13 | 72.2 | 1.55 | 1.68 | 0.92 | 1.67 | 8,8 |
| 3303 | 36.85 | 0.09 | 75.7 | 1.55 | 1.65 | 0.94 | 1.68 | 7,0 |
| 3304 | 34.19 | 0.01 | 73.9 | 1.73 | 1.62 | 1.07 | 4.47 | 12,8 |
| 3305 | 31.51 | 0.23 | 80.0 | 1.53 | 1.62 | 0.95 | 2.42 | 14,0 |
| 3306 | 29.29 | 0.07 | 76.5 | 1.55 | 1.58 | 0.98 | 2.19 | 14,0 |
| 3307 | 27.22 | 0.24 | 77.7 | 1.77 | 1.55 | 1.14 | 5.20 | 13,8 |
| 3308 | 24.67 | 0.03 | 85.7 | 1.70 | 1.54 | 1.11 | 5.85 | 15,8 |
| 3309 | 22.08 | 0.25 | 73.4 | 1.62 | 1.48 | 1.09 | 4.12 | 12,0 |
| 3310 | 19.98 | 0.40 | 51.9 | 1.43 | 1.38 | 1.03 | 3.86 | 12,0 |
| 3311 | 18.68 | 0.29 | 31.7 | 1.23 | 1.23 | 1.00 | 2.78 | 14,3 |
| 3312 | 17.96 | 0.20 | 15.1 | 1.04 | 1.13 | 0.92 | 3.01 | 11,0 |
| 3313 | 17.64 | 0.11 | 5.5 | 1.03 | 0.83 | 1.24 | 3.95 | 1,8 |
| 3314 last | 17.53 | 0.05 | 0.6 | 0.62 | 0.82 | 0.75 | 1.87 | 1,8 |
| 3315 | 17.51 | 0.00 | 0.5 | 0.44 | 0.63 | 0.69 | 1.05 | 12,5 |
| 3316 | 17.51 | 0.00 | 0.5 | 0.52 | 0.63 | 0.81 | 1.10 | 9,2 |
| 3317 | 17.51 | 0.00 | 0.9 | 0.54 | 0.63 | 0.85 | 1.21 | 9,6 |
| 3318 | 17.51 | 0.01 | 1.3 | 0.57 | 0.62 | 0.92 | 1.47 | 9,1 |
| 3319 | 17.53 | 0.01 | 2.1 | 0.56 | 0.62 | 0.90 | 1.23 | 11,0 |
| 3320 | 17.56 | 0.01 | 2.9 | 0.59 | 0.62 | 0.94 | 1.69 | 10,1 |
| 3321 | 17.60 | 0.01 | 4.1 | 0.59 | 0.62 | 0.95 | 1.99 | 10,1 |
| 3322 | 17.66 | 0.01 | 5.5 | 0.62 | 0.62 | 1.01 | 2.79 | 10,1 |
| 3323 | 17.75 | 0.01 | 7.2 | 0.64 | 0.62 | 1.04 | 3.13 | 11,1 |
| 3324 | 17.86 | 0.02 | 9.3 | 0.65 | 0.62 | 1.05 | 2.60 | 8,7 |
| 3325 | 18.00 | 0.02 | 11.6 | 0.66 | 0.62 | 1.07 | 3.78 | 8,7 |
| 3326 | 18.18 |  |  |  |  |  |  |  |

## place

### dive (jupiter.dive, T at 3024, place window 3012 to 3024, frames 3011 to 3025 at rate 1)

Both sides at T, the globe side without the place picture (display values 0 to 255): mean difference 4.567 (no limit yet, not judged; with the picture the handover report allows 0.5), 99th percentile 44 (no limit yet, not judged; with the picture the handover report allows 4), 99.9th 83, max 192, 6.35 percent of pixels over 16. Picture: out/work/smooth/jupiter-dive-place-sides.png
Largest step between two frames on the body: mean level 2.32 into frame 3025 (no limit yet, not judged; with the picture the handover report allows 6), mean colour 3.22 into frame 3025 (no limit yet, not judged; with the picture the handover report allows 8).
Largest level step of the whole frame against the middle of its two neighbours: 1.54 at frame 3024.
Largest pop score: 1.82 from frame 3023 to the next (no limit yet, not judged).

| frame | level | body share | body level | body level step | body colour step | level step | pop | pop of one block |
|---|---|---|---|---|---|---|---|---|
| 3011 | 158.82 | 0.897 | 174.42 |  |  |  | 1.20 | 4.67 |
| 3012 | 157.19 | 0.896 | 172.40 | 2.02 | 2.10 | 0.04 | 1.16 | 4.28 |
| 3013 | 155.49 | 0.895 | 170.15 | 2.25 | 2.39 | 0.06 | 1.15 | 5.26 |
| 3014 | 153.89 | 0.894 | 167.99 | 2.16 | 2.22 | 0.37 | 1.09 | 3.89 |
| 3015 | 153.05 | 0.893 | 166.62 | 1.37 | 1.38 | 0.33 | 1.05 | 2.37 |
| 3016 | 152.87 | 0.894 | 166.00 | 0.63 | 0.76 | 0.11 | 1.03 | 2.17 |
| 3017 | 152.91 | 0.894 | 165.66 | 0.34 | 0.41 | 0.04 | 0.98 | 2.43 |
| 3018 | 152.87 | 0.894 | 165.31 | 0.35 | 0.50 | 0.13 | 0.97 | 2.71 |
| 3019 | 153.08 | 0.894 | 165.27 | 0.05 | 0.41 | 0.09 | 0.95 | 2.36 |
| 3020 | 153.46 | 0.894 | 165.42 | 0.16 | 0.33 | 0.00 | 0.92 | 2.95 |
| 3021 | 153.84 | 0.897 | 165.56 | 0.14 | 0.25 | 0.13 | 0.95 | 4.01 |
| 3022 | 154.47 | 0.899 | 165.94 | 0.38 | 0.43 | 0.00 | 0.94 | 2.25 |
| 3023 | 155.10 | 0.901 | 166.38 | 0.44 | 0.52 | 0.31 | 1.82 | 10.61 |
| 3024 T | 156.36 | 0.902 | 167.52 | 1.14 | 1.47 | 1.54 | 0.88 | 1.78 |
| 3025 | 154.54 | 0.905 | 165.20 | 2.32 | 3.22 |  |  |  |

### rise (jupiter.rise, T at 3270, place window 3270 to 3282, frames 3269 to 3283 at rate 1)

Both sides at T, the globe side without the place picture (display values 0 to 255): mean difference 5.072 (no limit yet, not judged; with the picture the handover report allows 0.5), 99th percentile 45 (no limit yet, not judged; with the picture the handover report allows 4), 99.9th 85, max 212, 7.14 percent of pixels over 16. Picture: out/work/smooth/jupiter-rise-place-sides.png
Largest step between two frames on the body: mean level 3.11 into frame 3277 (no limit yet, not judged; with the picture the handover report allows 6), mean colour 3.87 into frame 3270 (no limit yet, not judged; with the picture the handover report allows 8).
Largest level step of the whole frame against the middle of its two neighbours: 1.77 at frame 3275.
Largest pop score: 1.29 from frame 3282 to the next (no limit yet, not judged).

| frame | level | body share | body level | body level step | body colour step | level step | pop | pop of one block |
|---|---|---|---|---|---|---|---|---|
| 3269 | 140.89 | 0.938 | 146.97 |  |  |  | 0.54 | 1.63 |
| 3270 T | 143.11 | 0.936 | 149.78 | 2.81 | 3.87 | 1.35 | 0.99 | 5.81 |
| 3271 | 142.63 | 0.932 | 149.55 | 0.23 | 0.77 | 0.55 | 0.61 | 1.34 |
| 3272 | 143.25 | 0.927 | 150.85 | 1.30 | 1.84 | 0.85 | 0.66 | 1.93 |
| 3273 | 142.16 | 0.924 | 149.96 | 0.89 | 0.98 | 0.14 | 0.82 | 1.84 |
| 3274 | 141.36 | 0.920 | 149.12 | 0.85 | 1.00 | 0.24 | 0.90 | 2.97 |
| 3275 | 141.03 | 0.921 | 148.34 | 0.78 | 0.86 | 1.77 | 0.93 | 2.01 |
| 3276 | 144.24 | 0.924 | 151.01 | 2.67 | 3.05 | 0.36 | 1.01 | 4.15 |
| 3277 | 148.17 | 0.926 | 154.12 | 3.11 | 3.23 | 1.40 | 1.06 | 7.01 |
| 3278 | 149.31 | 0.933 | 154.41 | 0.29 | 0.84 | 0.59 | 1.01 | 2.70 |
| 3279 | 149.26 | 0.939 | 154.15 | 0.27 | 0.97 | 0.75 | 1.08 | 4.00 |
| 3280 | 150.71 | 0.945 | 155.73 | 1.59 | 2.00 | 0.43 | 1.14 | 5.84 |
| 3281 | 151.31 | 0.952 | 156.56 | 0.83 | 1.44 | 0.29 | 1.24 | 9.95 |
| 3282 | 151.32 | 0.960 | 155.99 | 0.57 | 1.01 | 0.58 | 1.29 | 10.40 |
| 3283 | 150.17 | 0.966 | 153.83 | 2.16 | 2.74 |  |  |  |

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 28.65, uhd 50.52.

Largest mean difference: 3.667 at frame 3259 (jupiter.rise), no limit yet, not judged.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 2.615 at frame 3259 (jupiter.rise), no limit yet, not judged.
Largest level difference of one block (a grid of 16 by 9): -23.376 at frame 3038 (jupiter.dive), no limit yet, not judged.
Largest level difference of the whole frame: -0.968 at frame 3259 (jupiter.rise), no limit yet, not judged.
Picture: out/work/smooth/jupiter-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2993 | jupiter.dive | 2.273 | 14.5 | 133 | 0.070 | 0.087 | 0.715 | 29.05 | 4.723 | 13,6 | 0.862 |
| 3015 | jupiter.dive | 1.735 | 9.2 | 101 | -0.370 | -0.617 | 0.997 | 15.69 | -8.289 | 15,4 | 1.217 |
| 3038 | jupiter.dive | 3.441 | 33.3 | 213 | -0.798 | -0.840 | 2.515 | 80.93 | -23.376 | 3,0 | 1.261 |
| 3150 | jupiter.terrain | 1.783 | 13.0 | 71 | 0.232 | 0.354 | 0.794 | 27.20 | 2.439 | 7,2 | 1.042 |
| 3259 | jupiter.rise | 3.667 | 31.4 | 211 | -0.968 | -1.021 | 2.615 | 60.00 | -21.982 | 2,0 | 1.276 |
| 3278 | jupiter.rise | 1.845 | 11.0 | 144 | 0.199 | 0.401 | 0.965 | 21.97 | 7.224 | 10,2 | 1.107 |
| 3296 | jupiter.rise | 3.128 | 30.4 | 164 | -0.087 | -0.236 | 1.575 | 94.53 | 5.602 | 6,3 | 0.891 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.
