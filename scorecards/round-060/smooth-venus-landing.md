# smooth: venus

Commit 5dd60616578492129874abd81ce19cc1d89d5fa9. Capture rate 2. Parts: path. A calibration run: every number is written, the exit code is 0.

VERDICT: green. No number is over its limit.

## path

### landing (mercury.travel into venus.hold, frames 1086 to 1109, first frame of the hold 1110, window 1074 to 1121)

The last part of the travel that arrives at venus, from 0.68 of its length, in the camera of venus, in px of the master a film frame: sky is the turn of the camera (what the stars do), centre the way of the centre of the body, edge the growth of its radius, centre and edge the fastest point of its edge. Every value is over the mean of the curve in the landing. loss is what a curve loses over one film frame.

| run | curve | mean | at the start | hold's own | step at the seam | at | step between capture frames at the seam | at | largest loss | at | growth of the loss in the last 4 | at | climb after a fall | at | under the hold's own | at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | sky | 72.26 px | 2.038 | 0.026 | 0.001 | 1109 |  |  | 0.381 | 1098 | -0.001 | 1110 | 0.000 |  | -0.000 | 1110 |
| whole frames | centre | 0.05837 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.165 | 0.036 | 0.007 | 1110 |  |  | 0.007 | 1110 | 0.000 | 1107 | 0.000 |  | -0.010 | 1110 |
| whole frames | edge | 9.248 px | 1.849 | 0.010 | 0.044 | 1109 |  |  | 0.293 | 1097 | -0.007 | 1107 | 0.000 |  | -0.003 | 1110 |
| whole frames | centre and edge | 9.306 px | 1.846 | 0.012 | 0.044 | 1109 |  |  | 0.291 | 1097 | -0.007 | 1107 | 0.000 |  | -0.004 | 1110 |
| rate 2 | sky | 71.54 px | 2.058 | 0.026 | 0.002 | 1108 + 1/2 | 0.001 | 1108 + 1/2 | 0.388 | 1098 | -0.001 | 1110 | 0.000 |  | -0.000 | 1110 |
| rate 2 | centre | 0.05796 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.166 | 0.037 | 0.007 | 1110 | 0.003 | 1109 + 1/2 | 0.007 | 1110 | 0.000 | 1106 + 1/2 | 0.000 |  | -0.008 | 1110 |
| rate 2 | edge | 9.145 px | 1.872 | 0.010 | 0.050 | 1108 + 1/2 | 0.023 | 1108 + 1/2 | 0.297 | 1097 | -0.004 | 1106 + 1/2 | 0.000 |  | -0.001 | 1110 |
| rate 2 | centre and edge | 9.203 px | 1.869 | 0.012 | 0.050 | 1108 + 1/2 | 0.023 | 1108 + 1/2 | 0.295 | 1097 | -0.004 | 1106 + 1/2 | 0.000 |  | -0.001 | 1110 |

Limits: step 0.08 of the mean over one film frame from 2 film frames before the hold to 2 into it; the largest loss not in the last 4 film frames before the hold, and no loss there larger than the one a film frame before by more than 0.08; no loss under a third of the one a film frame before while the speed is over the hold's own; climb after a fall 0.03; not under the hold's own by more than 0.08. A loss and a speed over the hold's own count from 0.01 of the mean. The two rules of the loss (where the largest lies and how it grows, and letting go) are shown and not judged: the path alone does not part a good arrival from a bad one by them. A curve whose mean is under 0.5 px a film frame stands still in the picture: it is given over that floor, shown and not judged. The 12 film frames before the landing and the frames further into the hold are shown and not judged.

No judged number of the landing is over its limit.

Every film frame of the window. The curves are over their mean in the landing; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment | sky | step | step at rate 2 | centre | step | step at rate 2 | edge | step | step at rate 2 | centre and edge | step | step at rate 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1074 | mercury.travel | 2.036 |  |  | 0.164 |  |  | 1.094 |  |  | 1.096 |  |  |
| 1075 | mercury.travel | 2.036 | 0.000 | 0.000 | 0.166 | 0.002 | 0.002 | 1.204 | 0.109 * | 0.110 * | 1.205 | 0.109 * | 0.110 * |
| 1076 | mercury.travel | 2.036 | 0.000 | 0.000 | 0.168 | 0.002 | 0.002 | 1.308 | 0.104 * | 0.105 * | 1.309 | 0.104 * | 0.104 * |
| 1077 | mercury.travel | 2.036 | 0.000 | 0.000 | 0.169 | 0.002 | 0.002 | 1.406 | 0.098 * | 0.098 * | 1.406 | 0.097 * | 0.098 * |
| 1078 | mercury.travel | 2.037 | 0.000 | 0.000 | 0.171 | 0.001 | 0.001 | 1.497 | 0.090 * | 0.090 * | 1.496 | 0.090 * | 0.090 * |
| 1079 | mercury.travel | 2.037 | 0.000 | 0.000 | 0.171 | 0.001 | 0.001 | 1.579 | 0.082 * | 0.082 * | 1.578 | 0.081 * | 0.081 * |
| 1080 | mercury.travel | 2.037 | 0.000 | 0.000 | 0.172 | 0.000 | 0.000 | 1.651 | 0.072 | 0.072 | 1.650 | 0.072 | 0.072 |
| 1081 | mercury.travel | 2.037 | 0.000 | 0.000 | 0.172 | 0.000 | 0.000 | 1.713 | 0.062 | 0.062 | 1.712 | 0.062 | 0.061 |
| 1082 | mercury.travel | 2.037 | 0.000 | 0.000 | 0.172 | 0.000 | 0.001 | 1.765 | 0.051 | 0.051 | 1.763 | 0.051 | 0.050 |
| 1083 | mercury.travel | 2.037 | 0.000 | 0.000 | 0.171 | 0.001 | 0.001 | 1.805 | 0.040 | 0.039 | 1.803 | 0.040 | 0.039 |
| 1084 | mercury.travel | 2.037 | 0.000 | 0.000 | 0.170 | 0.001 | 0.001 | 1.833 | 0.028 | 0.027 | 1.831 | 0.028 | 0.027 |
| 1085 | mercury.travel | 2.038 | 0.000 | 0.000 | 0.169 | 0.001 | 0.002 | 1.849 | 0.016 | 0.015 | 1.846 | 0.016 | 0.015 |
| 1086 landing | mercury.travel | 2.038 | 0.000 | 0.000 | 0.167 | 0.002 | 0.002 | 1.853 | 0.004 | 0.003 | 1.850 | 0.004 | 0.003 |
| 1087 | mercury.travel | 2.038 | 0.000 | 0.000 | 0.165 | 0.002 | 0.002 | 1.849 | 0.004 | 0.004 | 1.846 | 0.004 | 0.004 |
| 1088 | mercury.travel | 2.037 | 0.000 | 0.001 | 0.162 | 0.002 | 0.003 | 1.847 | 0.003 | 0.002 | 1.844 | 0.003 | 0.003 |
| 1089 | mercury.travel | 2.036 | 0.001 | 0.002 | 0.159 | 0.003 | 0.003 | 1.845 | 0.001 | 0.001 | 1.842 | 0.002 | 0.002 |
| 1090 | mercury.travel | 2.033 | 0.003 | 0.005 | 0.156 | 0.003 | 0.003 | 1.844 | 0.002 | 0.003 | 1.840 | 0.002 | 0.003 |
| 1091 | mercury.travel | 2.027 | 0.006 | 0.010 | 0.153 | 0.003 | 0.004 | 1.839 | 0.004 | 0.008 | 1.836 | 0.004 | 0.008 |
| 1092 | mercury.travel | 2.013 | 0.014 | 0.022 | 0.149 | 0.004 | 0.004 | 1.827 | 0.012 | 0.022 | 1.824 | 0.012 | 0.022 |
| 1093 | mercury.travel | 1.984 | 0.030 | 0.047 | 0.145 | 0.004 | 0.004 | 1.795 | 0.032 | 0.055 | 1.792 | 0.032 | 0.055 |
| 1094 | mercury.travel | 1.921 | 0.062 | 0.097 * | 0.141 | 0.004 | 0.004 | 1.720 | 0.075 | 0.121 * | 1.717 | 0.075 | 0.121 * |
| 1095 | mercury.travel | 1.797 | 0.124 * | 0.182 * | 0.136 | 0.005 | 0.005 | 1.564 | 0.156 * | 0.222 * | 1.562 | 0.155 * | 0.221 * |
| 1096 | mercury.travel | 1.575 | 0.222 * | 0.296 * | 0.132 | 0.005 | 0.005 | 1.311 | 0.254 * | 0.297 * | 1.310 | 0.252 * | 0.295 * |
| 1097 | mercury.travel | 1.245 | 0.331 * | 0.381 * | 0.127 | 0.005 | 0.005 | 1.018 | 0.293 * | 0.297 * | 1.018 | 0.291 * | 0.295 * |
| 1098 | mercury.travel | 0.864 | 0.381 * | 0.388 * | 0.121 | 0.005 | 0.005 | 0.785 | 0.233 * | 0.224 * | 0.787 | 0.231 * | 0.223 * |
| 1099 | mercury.travel | 0.533 | 0.330 * | 0.323 * | 0.116 | 0.005 | 0.006 | 0.647 | 0.139 * | 0.129 * | 0.649 | 0.138 * | 0.128 * |
| 1100 | mercury.travel | 0.310 | 0.223 * | 0.211 * | 0.110 | 0.006 | 0.006 | 0.571 | 0.075 | 0.070 | 0.574 | 0.075 | 0.070 |
| 1101 | mercury.travel | 0.182 | 0.128 * | 0.119 * | 0.104 | 0.006 | 0.006 | 0.523 | 0.049 | 0.047 | 0.525 | 0.049 | 0.047 |
| 1102 | mercury.travel | 0.113 | 0.069 | 0.064 | 0.098 | 0.006 | 0.006 | 0.478 | 0.045 | 0.050 | 0.480 | 0.045 | 0.050 |
| 1103 | mercury.travel | 0.075 | 0.037 | 0.034 | 0.092 | 0.006 | 0.006 | 0.424 | 0.053 | 0.062 | 0.427 | 0.053 | 0.062 |
| 1104 | mercury.travel | 0.055 | 0.021 | 0.020 | 0.086 | 0.006 | 0.006 | 0.359 | 0.066 | 0.073 | 0.361 | 0.065 | 0.073 |
| 1105 | mercury.travel | 0.042 | 0.012 | 0.012 | 0.079 | 0.006 | 0.006 | 0.284 | 0.075 | 0.077 | 0.287 | 0.074 | 0.077 |
| 1106 | mercury.travel | 0.035 | 0.007 | 0.007 | 0.073 | 0.007 | 0.007 | 0.209 | 0.076 | 0.076 | 0.211 | 0.076 | 0.076 |
| 1107 | mercury.travel | 0.030 | 0.004 | 0.004 | 0.066 | 0.007 | 0.007 | 0.140 | 0.069 | 0.068 | 0.142 | 0.069 | 0.068 |
| 1108 | mercury.travel | 0.028 | 0.002 | 0.002 | 0.060 | 0.007 | 0.007 | 0.082 | 0.057 | 0.056 | 0.085 | 0.057 | 0.056 |
| 1109 | mercury.travel | 0.027 | 0.001 | 0.001 | 0.053 | 0.007 | 0.007 | 0.038 | 0.044 | 0.043 | 0.041 | 0.044 | 0.043 |
| 1110 hold | venus.hold | 0.026 | 0.000 | 0.000 | 0.046 | 0.007 | 0.007 | 0.013 | 0.025 | 0.023 | 0.015 | 0.025 | 0.023 |
| 1111 | venus.hold | 0.026 | 0.000 | 0.000 | 0.039 | 0.007 | 0.007 | 0.010 | 0.003 | 0.001 | 0.012 | 0.003 | 0.001 |
| 1112 | venus.hold | 0.026 | 0.000 | 0.000 | 0.033 | 0.007 | 0.007 | 0.010 | 0.000 | 0.000 | 0.012 | 0.000 | 0.000 |
| 1113 | venus.hold | 0.026 | 0.000 | 0.000 | 0.026 | 0.006 | 0.006 | 0.010 | 0.000 | 0.000 | 0.011 | 0.000 | 0.000 |
| 1114 | venus.hold | 0.026 | 0.000 | 0.000 | 0.020 | 0.006 | 0.006 | 0.010 | 0.000 | 0.000 | 0.011 | 0.000 | 0.000 |
| 1115 | venus.hold | 0.026 | 0.000 | 0.000 | 0.015 | 0.005 | 0.005 | 0.010 | 0.000 | 0.000 | 0.011 | 0.000 | 0.000 |
| 1116 | venus.hold | 0.026 | 0.000 | 0.000 | 0.011 | 0.004 | 0.003 | 0.010 | 0.000 | 0.000 | 0.011 | 0.000 | 0.000 |
| 1117 | venus.hold | 0.026 | 0.000 | 0.000 | 0.011 | 0.000 | 0.002 | 0.010 | 0.000 | 0.000 | 0.011 | 0.000 | 0.000 |
| 1118 | venus.hold | 0.026 | 0.000 | 0.000 | 0.014 | 0.004 | 0.005 | 0.010 | 0.000 | 0.000 | 0.011 | 0.000 | 0.000 |
| 1119 | venus.hold | 0.026 | 0.000 | 0.000 | 0.020 | 0.005 | 0.006 | 0.010 | 0.000 | 0.000 | 0.011 | 0.000 | 0.000 |
| 1120 | venus.hold | 0.026 | 0.000 | 0.000 | 0.025 | 0.006 | 0.006 | 0.010 | 0.000 | 0.000 | 0.011 | 0.000 | 0.000 |
| 1121 | venus.hold | 0.026 | 0.000 | 0.000 | 0.031 | 0.006 | 0.006 | 0.010 | 0.000 | 0.000 | 0.012 | 0.000 | 0.000 |
