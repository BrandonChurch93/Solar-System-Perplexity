# smooth: uranus

Commit 5dd60616578492129874abd81ce19cc1d89d5fa9. Capture rate 2. Parts: path. A calibration run: every number is written, the exit code is 0.

VERDICT: green. No number is over its limit.

## path

### landing (saturn.travel into uranus.hold, frames 3936 to 3959, first frame of the hold 3960, window 3924 to 3971)

The last part of the travel that arrives at uranus, from 0.68 of its length, in the camera of uranus, in px of the master a film frame: sky is the turn of the camera (what the stars do), centre the way of the centre of the body, edge the growth of its radius, centre and edge the fastest point of its edge. Every value is over the mean of the curve in the landing. loss is what a curve loses over one film frame.

| run | curve | mean | at the start | hold's own | step at the seam | at | step between capture frames at the seam | at | largest loss | at | growth of the loss in the last 4 | at | climb after a fall | at | under the hold's own | at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | sky | 51.11 px | 1.819 | 0.029 | 0.003 | 3959 |  |  | 0.332 | 3950 | 0.000 | 3960 | 0.004 | 3959 | 0.003 | 3959 |
| whole frames | centre | 0.1028 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.188 | 0.164 | 0.007 | 3962 |  |  | 0.007 | 3960 | 0.001 | 3957 | 0.000 |  | -0.011 | 3960 |
| whole frames | edge | 14.43 px | 0.744 | 0.005 | 0.041 | 3959 |  |  | 0.314 | 3953 | -0.020 | 3960 | 0.000 |  | -0.002 | 3960 |
| whole frames | centre and edge | 14.53 px | 0.746 | 0.011 | 0.041 | 3959 |  |  | 0.311 | 3953 | -0.020 | 3960 | 0.000 |  | -0.003 | 3960 |
| rate 2 | sky | 50.54 px | 1.840 | 0.029 | 0.003 | 3959 + 1/2 | 0.002 | 3959 | 0.348 | 3949 + 1/2 | 0.001 | 3960 | 0.006 | 3959 + 1/2 | 0.004 | 3958 + 1/2 |
| rate 2 | centre | 0.1025 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.186 | 0.165 | 0.008 | 3962 | 0.004 | 3962 | 0.007 | 3960 | 0.001 | 3956 + 1/2 | 0.000 |  | -0.009 | 3960 |
| rate 2 | edge | 14.17 px | 0.698 | 0.005 | 0.049 | 3958 + 1/2 | 0.022 | 3958 + 1/2 | 0.328 | 3952 + 1/2 | -0.020 | 3959 + 1/2 | 0.000 |  | -0.001 | 3960 |
| rate 2 | centre and edge | 14.27 px | 0.699 | 0.011 | 0.049 | 3958 + 1/2 | 0.022 | 3958 + 1/2 | 0.326 | 3952 + 1/2 | -0.020 | 3959 + 1/2 | 0.000 |  | -0.001 | 3960 |

Limits: step 0.08 of the mean over one film frame from 2 film frames before the hold to 2 into it; the largest loss not in the last 4 film frames before the hold, and no loss there larger than the one a film frame before by more than 0.08; no loss under a third of the one a film frame before while the speed is over the hold's own; climb after a fall 0.03; not under the hold's own by more than 0.08. A loss and a speed over the hold's own count from 0.01 of the mean. The two rules of the loss (where the largest lies and how it grows, and letting go) are shown and not judged: the path alone does not part a good arrival from a bad one by them. A curve whose mean is under 0.5 px a film frame stands still in the picture: it is given over that floor, shown and not judged. The 12 film frames before the landing and the frames further into the hold are shown and not judged.

No judged number of the landing is over its limit.

Every film frame of the window. The curves are over their mean in the landing; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment | sky | step | step at rate 2 | centre | step | step at rate 2 | edge | step | step at rate 2 | centre and edge | step | step at rate 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3924 | saturn.travel | 1.512 |  |  | 0.083 |  |  | 0.000 |  |  | 0.003 |  |  |
| 3925 | saturn.travel | 1.651 | 0.138 * | 0.137 * | 0.093 | 0.010 | 0.010 | 0.000 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 |
| 3926 | saturn.travel | 1.757 | 0.106 * | 0.103 * | 0.102 | 0.010 | 0.010 | 0.000 | 0.000 | 0.000 | 0.004 | 0.000 | 0.000 |
| 3927 | saturn.travel | 1.818 | 0.062 | 0.056 | 0.112 | 0.009 | 0.009 | 0.000 | 0.000 | 0.000 | 0.004 | 0.000 | 0.000 |
| 3928 | saturn.travel | 1.831 | 0.013 | 0.007 | 0.121 | 0.009 | 0.009 | 0.000 | 0.000 | 0.000 | 0.004 | 0.000 | 0.000 |
| 3929 | saturn.travel | 1.830 | 0.001 | 0.001 | 0.130 | 0.009 | 0.009 | 0.000 | 0.000 | 0.000 | 0.005 | 0.000 | 0.001 |
| 3930 | saturn.travel | 1.828 | 0.001 | 0.001 | 0.138 | 0.009 | 0.009 | 0.001 | 0.000 | 0.004 | 0.005 | 0.001 | 0.004 |
| 3931 | saturn.travel | 1.827 | 0.001 | 0.001 | 0.147 | 0.008 | 0.008 | 0.016 | 0.016 | 0.044 | 0.021 | 0.016 | 0.044 |
| 3932 | saturn.travel | 1.826 | 0.001 | 0.001 | 0.155 | 0.008 | 0.008 | 0.075 | 0.059 | 0.085 * | 0.080 | 0.059 | 0.084 * |
| 3933 | saturn.travel | 1.825 | 0.001 | 0.001 | 0.162 | 0.007 | 0.007 | 0.171 | 0.095 * | 0.116 * | 0.175 | 0.095 * | 0.115 * |
| 3934 | saturn.travel | 1.823 | 0.001 | 0.001 | 0.169 | 0.007 | 0.007 | 0.293 | 0.123 * | 0.138 * | 0.297 | 0.122 * | 0.137 * |
| 3935 | saturn.travel | 1.822 | 0.001 | 0.001 | 0.176 | 0.007 | 0.007 | 0.435 | 0.142 * | 0.152 * | 0.438 | 0.141 * | 0.151 * |
| 3936 landing | saturn.travel | 1.821 | 0.001 | 0.001 | 0.182 | 0.006 | 0.006 | 0.588 | 0.153 * | 0.159 * | 0.590 | 0.152 * | 0.158 * |
| 3937 | saturn.travel | 1.819 | 0.001 | 0.001 | 0.188 | 0.006 | 0.006 | 0.744 | 0.157 * | 0.160 * | 0.746 | 0.156 * | 0.159 * |
| 3938 | saturn.travel | 1.818 | 0.002 | 0.002 | 0.193 | 0.005 | 0.005 | 0.899 | 0.154 * | 0.157 * | 0.899 | 0.153 * | 0.156 * |
| 3939 | saturn.travel | 1.816 | 0.002 | 0.002 | 0.198 | 0.005 | 0.005 | 1.045 | 0.146 * | 0.148 * | 1.044 | 0.146 * | 0.147 * |
| 3940 | saturn.travel | 1.813 | 0.003 | 0.003 | 0.202 | 0.004 | 0.004 | 1.179 | 0.134 * | 0.134 * | 1.177 | 0.133 * | 0.133 * |
| 3941 | saturn.travel | 1.810 | 0.004 | 0.005 | 0.206 | 0.004 | 0.004 | 1.295 | 0.116 * | 0.116 * | 1.293 | 0.116 * | 0.116 * |
| 3942 | saturn.travel | 1.804 | 0.006 | 0.008 | 0.210 | 0.003 | 0.003 | 1.391 | 0.096 * | 0.095 * | 1.388 | 0.095 * | 0.094 * |
| 3943 | saturn.travel | 1.794 | 0.010 | 0.015 | 0.212 | 0.003 | 0.003 | 1.464 | 0.073 | 0.071 | 1.461 | 0.072 | 0.071 |
| 3944 | saturn.travel | 1.774 | 0.020 | 0.030 | 0.215 | 0.002 | 0.002 | 1.511 | 0.047 | 0.045 | 1.508 | 0.047 | 0.045 |
| 3945 | saturn.travel | 1.735 | 0.039 | 0.061 | 0.216 | 0.002 | 0.002 | 1.532 | 0.021 | 0.018 | 1.529 | 0.021 | 0.018 |
| 3946 | saturn.travel | 1.656 | 0.078 | 0.118 * | 0.217 | 0.001 | 0.001 | 1.534 | 0.002 | 0.001 | 1.531 | 0.002 | 0.001 |
| 3947 | saturn.travel | 1.509 | 0.147 * | 0.207 * | 0.218 | 0.001 | 0.000 | 1.533 | 0.002 | 0.004 | 1.529 | 0.002 | 0.004 |
| 3948 | saturn.travel | 1.266 | 0.243 * | 0.306 * | 0.218 | 0.000 | 0.000 | 1.527 | 0.006 | 0.012 | 1.523 | 0.006 | 0.012 |
| 3949 | saturn.travel | 0.940 | 0.326 * | 0.348 * | 0.217 | 0.001 | 0.001 | 1.509 | 0.018 | 0.035 | 1.505 | 0.018 | 0.035 |
| 3950 | saturn.travel | 0.608 | 0.332 * | 0.332 * | 0.216 | 0.001 | 0.001 | 1.456 | 0.053 | 0.099 * | 1.453 | 0.052 | 0.098 * |
| 3951 | saturn.travel | 0.352 | 0.256 * | 0.247 * | 0.215 | 0.002 | 0.002 | 1.316 | 0.140 * | 0.228 * | 1.314 | 0.139 * | 0.226 * |
| 3952 | saturn.travel | 0.192 | 0.160 * | 0.150 * | 0.212 | 0.002 | 0.003 | 1.045 | 0.271 * | 0.328 * | 1.045 | 0.269 * | 0.326 * |
| 3953 | saturn.travel | 0.104 | 0.088 * | 0.081 * | 0.209 | 0.003 | 0.003 | 0.731 | 0.314 * | 0.317 * | 0.733 | 0.311 * | 0.315 * |
| 3954 | saturn.travel | 0.058 | 0.046 | 0.042 | 0.206 | 0.003 | 0.004 | 0.500 | 0.232 * | 0.223 * | 0.503 | 0.230 * | 0.221 * |
| 3955 | saturn.travel | 0.035 | 0.023 | 0.021 | 0.202 | 0.004 | 0.004 | 0.342 | 0.158 * | 0.153 * | 0.346 | 0.157 * | 0.152 * |
| 3956 | saturn.travel | 0.025 | 0.011 | 0.009 | 0.198 | 0.004 | 0.005 | 0.222 | 0.120 * | 0.118 * | 0.227 | 0.119 * | 0.118 * |
| 3957 | saturn.travel | 0.022 | 0.003 | 0.002 | 0.193 | 0.005 | 0.005 | 0.131 | 0.091 * | 0.089 * | 0.137 | 0.090 * | 0.088 * |
| 3958 | saturn.travel | 0.023 | 0.001 | 0.003 | 0.187 | 0.006 | 0.006 | 0.068 | 0.063 | 0.061 | 0.074 | 0.063 | 0.061 |
| 3959 | saturn.travel | 0.026 | 0.003 | 0.003 | 0.181 | 0.006 | 0.006 | 0.027 | 0.041 | 0.039 | 0.033 | 0.041 | 0.039 |
| 3960 hold | uranus.hold | 0.029 | 0.003 | 0.002 | 0.175 | 0.007 | 0.007 | 0.007 | 0.020 | 0.018 | 0.013 | 0.020 | 0.018 |
| 3961 | uranus.hold | 0.029 | 0.000 | 0.000 | 0.168 | 0.007 | 0.007 | 0.005 | 0.002 | 0.001 | 0.011 | 0.002 | 0.001 |
| 3962 | uranus.hold | 0.029 | 0.000 | 0.000 | 0.160 | 0.007 | 0.008 | 0.005 | 0.000 | 0.000 | 0.010 | 0.000 | 0.000 |
| 3963 | uranus.hold | 0.029 | 0.000 | 0.000 | 0.152 | 0.008 | 0.008 | 0.005 | 0.000 | 0.000 | 0.010 | 0.000 | 0.000 |
| 3964 | uranus.hold | 0.029 | 0.000 | 0.000 | 0.144 | 0.008 | 0.009 | 0.005 | 0.000 | 0.000 | 0.010 | 0.000 | 0.000 |
| 3965 | uranus.hold | 0.029 | 0.000 | 0.000 | 0.135 | 0.009 | 0.009 | 0.005 | 0.000 | 0.000 | 0.010 | 0.000 | 0.000 |
| 3966 | uranus.hold | 0.029 | 0.000 | 0.000 | 0.126 | 0.009 | 0.009 | 0.005 | 0.000 | 0.000 | 0.009 | 0.000 | 0.000 |
| 3967 | uranus.hold | 0.028 | 0.000 | 0.000 | 0.117 | 0.009 | 0.010 | 0.005 | 0.000 | 0.000 | 0.009 | 0.000 | 0.000 |
| 3968 | uranus.hold | 0.028 | 0.000 | 0.000 | 0.107 | 0.010 | 0.010 | 0.005 | 0.000 | 0.000 | 0.009 | 0.000 | 0.000 |
| 3969 | uranus.hold | 0.028 | 0.000 | 0.000 | 0.097 | 0.010 | 0.010 | 0.005 | 0.000 | 0.000 | 0.008 | 0.000 | 0.000 |
| 3970 | uranus.hold | 0.028 | 0.000 | 0.000 | 0.086 | 0.010 | 0.011 | 0.005 | 0.000 | 0.000 | 0.008 | 0.000 | 0.000 |
| 3971 | uranus.hold | 0.028 | 0.000 | 0.000 | 0.076 | 0.011 | 0.011 | 0.005 | 0.000 | 0.000 | 0.008 | 0.000 | 0.000 |
