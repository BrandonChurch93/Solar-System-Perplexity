# smooth: jupiter

Commit 5dd60616578492129874abd81ce19cc1d89d5fa9. Capture rate 2. Parts: path. A calibration run: every number is written, the exit code is 0.

VERDICT: green. No number is over its limit.

## path

### landing (mars.travel into jupiter.hold, frames 2796 to 2819, first frame of the hold 2820, window 2784 to 2831)

The last part of the travel that arrives at jupiter, from 0.68 of its length, in the camera of jupiter, in px of the master a film frame: sky is the turn of the camera (what the stars do), centre the way of the centre of the body, edge the growth of its radius, centre and edge the fastest point of its edge. Every value is over the mean of the curve in the landing. loss is what a curve loses over one film frame.

| run | curve | mean | at the start | hold's own | step at the seam | at | step between capture frames at the seam | at | largest loss | at | growth of the loss in the last 4 | at | climb after a fall | at | under the hold's own | at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | sky | 85.27 px | 2.139 | 0.009 | 0.002 | 2819 |  |  | 0.385 | 2808 | -0.002 | 2818 | 0.000 |  | 0.002 | 2819 |
| whole frames | centre | 0.04039 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.076 | 0.082 | 0.000 | 2819 |  |  | -0.000 | 2814 | 0.000 | 2820 | 0.000 |  | 0.000 | 2819 |
| whole frames | edge | 17.76 px | 1.046 | 0.006 | 0.040 | 2819 |  |  | 0.274 | 2812 | -0.020 | 2817 | 0.000 |  | -0.002 | 2820 |
| whole frames | centre and edge | 17.8 px | 1.046 | 0.008 | 0.040 | 2819 |  |  | 0.273 | 2812 | -0.020 | 2817 | 0.000 |  | -0.002 | 2820 |
| rate 2 | sky | 84.44 px | 2.160 | 0.009 | 0.004 | 2818 + 1/2 | 0.002 | 2818 + 1/2 | 0.406 | 2807 + 1/2 | -0.002 | 2817 + 1/2 | 0.001 | 2819 + 1/2 | 0.002 | 2818 + 1/2 |
| rate 2 | centre | 0.04039 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.076 | 0.082 | 0.000 | 2819 + 1/2 | 0.000 | 2819 | -0.000 | 2813 + 1/2 | 0.000 | 2820 | 0.000 |  | 0.000 | 2818 + 1/2 |
| rate 2 | edge | 17.48 px | 1.015 | 0.006 | 0.048 | 2818 + 1/2 | 0.021 | 2818 + 1/2 | 0.300 | 2811 + 1/2 | -0.016 | 2816 + 1/2 | 0.000 |  | -0.001 | 2820 |
| rate 2 | centre and edge | 17.52 px | 1.015 | 0.008 | 0.048 | 2818 + 1/2 | 0.021 | 2818 + 1/2 | 0.300 | 2811 + 1/2 | -0.016 | 2816 + 1/2 | 0.000 |  | -0.001 | 2820 |

Limits: step 0.08 of the mean over one film frame from 2 film frames before the hold to 2 into it; the largest loss not in the last 4 film frames before the hold, and no loss there larger than the one a film frame before by more than 0.08; no loss under a third of the one a film frame before while the speed is over the hold's own; climb after a fall 0.03; not under the hold's own by more than 0.08. A loss and a speed over the hold's own count from 0.01 of the mean. The two rules of the loss (where the largest lies and how it grows, and letting go) are shown and not judged: the path alone does not part a good arrival from a bad one by them. A curve whose mean is under 0.5 px a film frame stands still in the picture: it is given over that floor, shown and not judged. The 12 film frames before the landing and the frames further into the hold are shown and not judged.

No judged number of the landing is over its limit.

Every film frame of the window. The curves are over their mean in the landing; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment | sky | step | step at rate 2 | centre | step | step at rate 2 | edge | step | step at rate 2 | centre and edge | step | step at rate 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2784 | mars.travel | 2.144 |  |  | 0.054 |  |  | 0.000 |  |  | 0.002 |  |  |
| 2785 | mars.travel | 2.143 | 0.000 | 0.000 | 0.056 | 0.002 | 0.002 | 0.000 | 0.000 | 0.000 | 0.002 | 0.000 | 0.000 |
| 2786 | mars.travel | 2.143 | 0.000 | 0.000 | 0.058 | 0.002 | 0.002 | 0.001 | 0.001 | 0.001 | 0.002 | 0.001 | 0.001 |
| 2787 | mars.travel | 2.143 | 0.000 | 0.000 | 0.060 | 0.002 | 0.002 | 0.001 | 0.000 | 0.002 | 0.003 | 0.000 | 0.002 |
| 2788 | mars.travel | 2.142 | 0.000 | 0.000 | 0.062 | 0.002 | 0.002 | 0.013 | 0.012 | 0.036 | 0.015 | 0.012 | 0.036 |
| 2789 | mars.travel | 2.142 | 0.000 | 0.000 | 0.064 | 0.002 | 0.002 | 0.062 | 0.049 | 0.070 | 0.064 | 0.049 | 0.070 |
| 2790 | mars.travel | 2.141 | 0.000 | 0.000 | 0.066 | 0.002 | 0.002 | 0.142 | 0.0796 | 0.097 * | 0.143 | 0.079 | 0.097 * |
| 2791 | mars.travel | 2.141 | 0.000 | 0.000 | 0.068 | 0.002 | 0.002 | 0.245 | 0.104 * | 0.117 * | 0.247 | 0.103 * | 0.117 * |
| 2792 | mars.travel | 2.141 | 0.000 | 0.000 | 0.069 | 0.002 | 0.002 | 0.367 | 0.121 * | 0.132 * | 0.368 | 0.121 * | 0.131 * |
| 2793 | mars.travel | 2.140 | 0.000 | 0.000 | 0.071 | 0.002 | 0.002 | 0.500 | 0.133 * | 0.140 * | 0.500 | 0.133 * | 0.140 * |
| 2794 | mars.travel | 2.140 | 0.000 | 0.000 | 0.073 | 0.002 | 0.001 | 0.639 | 0.139 * | 0.143 * | 0.639 | 0.139 * | 0.143 * |
| 2795 | mars.travel | 2.140 | 0.000 | 0.000 | 0.074 | 0.001 | 0.001 | 0.779 | 0.140 * | 0.143 * | 0.779 | 0.140 * | 0.142 * |
| 2796 landing | mars.travel | 2.139 | 0.000 | 0.000 | 0.075 | 0.001 | 0.001 | 0.916 | 0.137 * | 0.139 * | 0.916 | 0.137 * | 0.138 * |
| 2797 | mars.travel | 2.139 | 0.001 | 0.001 | 0.076 | 0.001 | 0.001 | 1.046 | 0.130 * | 0.131 * | 1.046 | 0.129 * | 0.130 * |
| 2798 | mars.travel | 2.137 | 0.001 | 0.002 | 0.077 | 0.001 | 0.001 | 1.165 | 0.119 * | 0.119 * | 1.164 | 0.119 * | 0.119 * |
| 2799 | mars.travel | 2.135 | 0.003 | 0.004 | 0.078 | 0.001 | 0.001 | 1.270 | 0.105 * | 0.105 * | 1.269 | 0.105 * | 0.104 * |
| 2800 | mars.travel | 2.130 | 0.005 | 0.008 | 0.079 | 0.001 | 0.001 | 1.358 | 0.088 * | 0.088 * | 1.357 | 0.088 * | 0.087 * |
| 2801 | mars.travel | 2.119 | 0.011 | 0.017 | 0.079 | 0.001 | 0.001 | 1.428 | 0.070 | 0.068 | 1.427 | 0.070 | 0.068 |
| 2802 | mars.travel | 2.097 | 0.022 | 0.035 | 0.080 | 0.001 | 0.001 | 1.477 | 0.049 | 0.048 | 1.476 | 0.049 | 0.048 |
| 2803 | mars.travel | 2.051 | 0.046 | 0.071 | 0.080 | 0.000 | 0.000 | 1.505 | 0.028 | 0.026 | 1.504 | 0.028 | 0.026 |
| 2804 | mars.travel | 1.959 | 0.093 * | 0.140 * | 0.081 | 0.000 | 0.000 | 1.513 | 0.008 | 0.005 | 1.512 | 0.008 | 0.005 |
| 2805 | mars.travel | 1.783 | 0.176 * | 0.247 * | 0.081 | 0.000 | 0.000 | 1.513 | 0.000 | 0.001 | 1.512 | 0.000 | 0.001 |
| 2806 | mars.travel | 1.493 | 0.290 * | 0.362 * | 0.081 | 0.000 | 0.000 | 1.512 | 0.001 | 0.003 | 1.511 | 0.001 | 0.003 |
| 2807 | mars.travel | 1.109 | 0.384 * | 0.406 * | 0.082 | 0.000 | 0.000 | 1.506 | 0.005 | 0.011 | 1.505 | 0.005 | 0.011 |
| 2808 | mars.travel | 0.724 | 0.385 * | 0.384 * | 0.082 | 0.000 | 0.000 | 1.488 | 0.018 | 0.036 | 1.487 | 0.018 | 0.036 |
| 2809 | mars.travel | 0.430 | 0.293 * | 0.282 * | 0.082 | 0.000 | 0.000 | 1.432 | 0.056 | 0.106 * | 1.431 | 0.056 | 0.106 * |
| 2810 | mars.travel | 0.249 | 0.181 * | 0.169 * | 0.082 | 0.000 | 0.000 | 1.283 | 0.149 * | 0.234 * | 1.282 | 0.148 * | 0.233 * |
| 2811 | mars.travel | 0.150 | 0.100 * | 0.092 * | 0.082 | 0.000 | 0.000 | 1.016 | 0.267 * | 0.300 * | 1.016 | 0.267 * | 0.300 * |
| 2812 | mars.travel | 0.096 | 0.054 | 0.050 | 0.082 | 0.000 | 0.000 | 0.742 | 0.274 * | 0.271 * | 0.743 | 0.273 * | 0.271 * |
| 2813 | mars.travel | 0.066 | 0.030 | 0.028 | 0.082 | 0.000 | 0.000 | 0.559 | 0.182 * | 0.173 * | 0.561 | 0.182 * | 0.172 * |
| 2814 | mars.travel | 0.047 | 0.019 | 0.018 | 0.082 | 0.000 | 0.000 | 0.433 | 0.127 * | 0.124 * | 0.434 | 0.127 * | 0.124 * |
| 2815 | mars.travel | 0.033 | 0.013 | 0.013 | 0.082 | 0.000 | 0.000 | 0.319 | 0.114 * | 0.115 * | 0.320 | 0.114 * | 0.115 * |
| 2816 | mars.travel | 0.023 | 0.010 | 0.010 | 0.082 | 0.000 | 0.000 | 0.214 | 0.105 * | 0.105 * | 0.216 | 0.105 * | 0.105 * |
| 2817 | mars.travel | 0.015 | 0.008 | 0.008 | 0.082 | 0.000 | 0.000 | 0.128 | 0.085 * | 0.084 * | 0.130 | 0.085 * | 0.084 * |
| 2818 | mars.travel | 0.009 | 0.006 | 0.006 | 0.082 | 0.000 | 0.000 | 0.067 | 0.061 | 0.059 | 0.069 | 0.061 | 0.059 |
| 2819 | mars.travel | 0.006 | 0.002 | 0.002 | 0.082 | 0.000 | 0.000 | 0.027 | 0.040 | 0.038 | 0.030 | 0.040 | 0.038 |
| 2820 hold | jupiter.hold | 0.008 | 0.002 | 0.002 | 0.082 | 0.000 | 0.000 | 0.008 | 0.020 | 0.017 | 0.010 | 0.020 | 0.017 |
| 2821 | jupiter.hold | 0.009 | 0.000 | 0.000 | 0.082 | 0.000 | 0.000 | 0.006 | 0.002 | 0.001 | 0.008 | 0.002 | 0.001 |
| 2822 | jupiter.hold | 0.009 | 0.000 | 0.000 | 0.082 | 0.000 | 0.000 | 0.006 | 0.000 | 0.000 | 0.008 | 0.000 | 0.000 |
| 2823 | jupiter.hold | 0.009 | 0.000 | 0.000 | 0.082 | 0.000 | 0.000 | 0.006 | 0.000 | 0.000 | 0.008 | 0.000 | 0.000 |
| 2824 | jupiter.hold | 0.009 | 0.000 | 0.000 | 0.082 | 0.000 | 0.000 | 0.006 | 0.000 | 0.000 | 0.008 | 0.000 | 0.000 |
| 2825 | jupiter.hold | 0.009 | 0.000 | 0.000 | 0.082 | 0.000 | 0.000 | 0.006 | 0.000 | 0.000 | 0.008 | 0.000 | 0.000 |
| 2826 | jupiter.hold | 0.009 | 0.000 | 0.000 | 0.082 | 0.000 | 0.000 | 0.006 | 0.000 | 0.000 | 0.008 | 0.000 | 0.000 |
| 2827 | jupiter.hold | 0.009 | 0.000 | 0.000 | 0.082 | 0.000 | 0.000 | 0.006 | 0.000 | 0.000 | 0.008 | 0.000 | 0.000 |
| 2828 | jupiter.hold | 0.009 | 0.000 | 0.000 | 0.082 | 0.000 | 0.000 | 0.006 | 0.000 | 0.000 | 0.008 | 0.000 | 0.000 |
| 2829 | jupiter.hold | 0.009 | 0.000 | 0.000 | 0.082 | 0.000 | 0.000 | 0.006 | 0.000 | 0.000 | 0.008 | 0.000 | 0.000 |
| 2830 | jupiter.hold | 0.008 | 0.000 | 0.000 | 0.081 | 0.000 | 0.000 | 0.006 | 0.000 | 0.000 | 0.008 | 0.000 | 0.000 |
| 2831 | jupiter.hold | 0.008 | 0.000 | 0.000 | 0.081 | 0.000 | 0.000 | 0.006 | 0.000 | 0.000 | 0.008 | 0.000 | 0.000 |
