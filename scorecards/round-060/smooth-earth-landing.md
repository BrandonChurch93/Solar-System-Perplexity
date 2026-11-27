# smooth: earth

Commit 5dd60616578492129874abd81ce19cc1d89d5fa9. Capture rate 2. Parts: path. A calibration run: every number is written, the exit code is 0.

VERDICT: green. No number is over its limit.

## path

### landing (venus.travel into earth.hold, frames 1656 to 1679, first frame of the hold 1680, window 1644 to 1691)

The last part of the travel that arrives at earth, from 0.68 of its length, in the camera of earth, in px of the master a film frame: sky is the turn of the camera (what the stars do), centre the way of the centre of the body, edge the growth of its radius, centre and edge the fastest point of its edge. Every value is over the mean of the curve in the landing. loss is what a curve loses over one film frame.

| run | curve | mean | at the start | hold's own | step at the seam | at | step between capture frames at the seam | at | largest loss | at | growth of the loss in the last 4 | at | climb after a fall | at | under the hold's own | at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | sky | 63.81 px | 2.188 | 0.002 | 0.004 | 1679 |  |  | 0.405 | 1667 | -0.002 | 1679 | 0.000 |  | 0.000 | 1680 |
| whole frames | centre | 0.09914 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.134 | 0.264 | 0.003 | 1679 |  |  | -0.003 | 1680 | 0.000 | 1680 | 0.000 |  | 0.006 | 1679 |
| whole frames | edge | 8.718 px | 1.899 | 0.013 | 0.046 | 1679 |  |  | 0.291 | 1666 | -0.007 | 1677 | 0.000 |  | -0.003 | 1680 |
| whole frames | centre and edge | 8.817 px | 1.886 | 0.027 | 0.045 | 1679 |  |  | 0.287 | 1666 | -0.007 | 1677 | 0.000 |  | -0.003 | 1680 |
| rate 2 | sky | 63.2 px | 2.209 | 0.002 | 0.005 | 1678 + 1/2 | 0.002 | 1678 + 1/2 | 0.415 | 1667 | -0.001 | 1678 + 1/2 | 0.000 |  | 0.000 | 1679 + 1/2 |
| rate 2 | centre | 0.09947 px (under the floor 0.5 px, its values are over the floor; shown, not judged) | 0.133 | 0.264 | 0.003 | 1678 + 1/2 | 0.002 | 1678 + 1/2 | -0.003 | 1680 | 0.000 | 1680 | 0.000 |  | 0.007 | 1678 + 1/2 |
| rate 2 | edge | 8.624 px | 1.925 | 0.013 | 0.051 | 1678 + 1/2 | 0.024 | 1678 + 1/2 | 0.304 | 1666 + 1/2 | -0.004 | 1676 + 1/2 | 0.000 |  | -0.001 | 1680 |
| rate 2 | centre and edge | 8.723 px | 1.910 | 0.028 | 0.051 | 1678 + 1/2 | 0.024 | 1678 + 1/2 | 0.301 | 1666 + 1/2 | -0.004 | 1676 + 1/2 | 0.000 |  | -0.001 | 1680 |

Limits: step 0.08 of the mean over one film frame from 2 film frames before the hold to 2 into it; the largest loss not in the last 4 film frames before the hold, and no loss there larger than the one a film frame before by more than 0.08; no loss under a third of the one a film frame before while the speed is over the hold's own; climb after a fall 0.03; not under the hold's own by more than 0.08. A loss and a speed over the hold's own count from 0.01 of the mean. The two rules of the loss (where the largest lies and how it grows, and letting go) are shown and not judged: the path alone does not part a good arrival from a bad one by them. A curve whose mean is under 0.5 px a film frame stands still in the picture: it is given over that floor, shown and not judged. The 12 film frames before the landing and the frames further into the hold are shown and not judged.

No judged number of the landing is over its limit.

Every film frame of the window. The curves are over their mean in the landing; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment | sky | step | step at rate 2 | centre | step | step at rate 2 | edge | step | step at rate 2 | centre and edge | step | step at rate 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1644 | venus.travel | 2.189 |  |  | 0.153 |  |  | 1.293 |  |  | 1.287 |  |  |
| 1645 | venus.travel | 2.189 | 0.000 | 0.000 | 0.149 | 0.005 | 0.005 | 1.395 | 0.102 * | 0.102 * | 1.387 | 0.100 * | 0.101 * |
| 1646 | venus.travel | 2.189 | 0.000 | 0.000 | 0.145 | 0.004 | 0.004 | 1.490 | 0.095 * | 0.095 * | 1.481 | 0.094 * | 0.094 * |
| 1647 | venus.travel | 2.188 | 0.000 | 0.000 | 0.140 | 0.004 | 0.004 | 1.577 | 0.088 * | 0.087 * | 1.568 | 0.086 * | 0.086 * |
| 1648 | venus.travel | 2.188 | 0.000 | 0.000 | 0.137 | 0.004 | 0.004 | 1.656 | 0.079 | 0.079 | 1.645 | 0.078 | 0.078 |
| 1649 | venus.travel | 2.188 | 0.000 | 0.000 | 0.133 | 0.003 | 0.003 | 1.726 | 0.070 | 0.069 | 1.714 | 0.069 | 0.068 |
| 1650 | venus.travel | 2.188 | 0.000 | 0.000 | 0.131 | 0.003 | 0.003 | 1.786 | 0.060 | 0.059 | 1.773 | 0.059 | 0.058 |
| 1651 | venus.travel | 2.188 | 0.000 | 0.000 | 0.129 | 0.002 | 0.002 | 1.836 | 0.049 | 0.049 | 1.822 | 0.049 | 0.048 |
| 1652 | venus.travel | 2.188 | 0.000 | 0.000 | 0.128 | 0.001 | 0.001 | 1.874 | 0.038 | 0.038 | 1.860 | 0.038 | 0.037 |
| 1653 | venus.travel | 2.188 | 0.000 | 0.000 | 0.127 | 0.000 | 0.000 | 1.901 | 0.027 | 0.026 | 1.887 | 0.027 | 0.026 |
| 1654 | venus.travel | 2.188 | 0.000 | 0.000 | 0.128 | 0.000 | 0.001 | 1.917 | 0.016 | 0.014 | 1.903 | 0.015 | 0.014 |
| 1655 | venus.travel | 2.188 | 0.000 | 0.000 | 0.129 | 0.001 | 0.002 | 1.921 | 0.004 | 0.004 | 1.906 | 0.004 | 0.003 |
| 1656 landing | venus.travel | 2.188 | 0.000 | 0.000 | 0.131 | 0.002 | 0.003 | 1.913 | 0.008 | 0.014 | 1.899 | 0.008 | 0.013 |
| 1657 | venus.travel | 2.188 | 0.000 | 0.001 | 0.134 | 0.003 | 0.004 | 1.899 | 0.013 | 0.014 | 1.886 | 0.013 | 0.013 |
| 1658 | venus.travel | 2.187 | 0.001 | 0.002 | 0.138 | 0.004 | 0.004 | 1.891 | 0.008 | 0.008 | 1.878 | 0.008 | 0.007 |
| 1659 | venus.travel | 2.184 | 0.003 | 0.004 | 0.143 | 0.005 | 0.005 | 1.887 | 0.004 | 0.004 | 1.874 | 0.004 | 0.004 |
| 1660 | venus.travel | 2.178 | 0.006 | 0.009 | 0.148 | 0.005 | 0.005 | 1.884 | 0.003 | 0.004 | 1.871 | 0.003 | 0.004 |
| 1661 | venus.travel | 2.166 | 0.012 | 0.020 | 0.154 | 0.006 | 0.006 | 1.877 | 0.006 | 0.012 | 1.865 | 0.006 | 0.011 |
| 1662 | venus.travel | 2.140 | 0.026 | 0.042 | 0.160 | 0.006 | 0.006 | 1.859 | 0.018 | 0.033 | 1.848 | 0.017 | 0.032 |
| 1663 | venus.travel | 2.084 | 0.056 | 0.087 * | 0.166 | 0.006 | 0.007 | 1.812 | 0.047 | 0.081 * | 1.801 | 0.047 | 0.0797 |
| 1664 | venus.travel | 1.972 | 0.112 * | 0.168 * | 0.173 | 0.007 | 0.007 | 1.703 | 0.109 * | 0.169 * | 1.693 | 0.108 * | 0.167 * |
| 1665 | venus.travel | 1.764 | 0.208 * | 0.286 * | 0.180 | 0.007 | 0.007 | 1.496 | 0.207 * | 0.272 * | 1.489 | 0.204 * | 0.268 * |
| 1666 | venus.travel | 1.437 | 0.327 * | 0.393 * | 0.186 | 0.007 | 0.007 | 1.205 | 0.291 * | 0.304 * | 1.202 | 0.287 * | 0.301 * |
| 1667 | venus.travel | 1.032 | 0.405 * | 0.415 * | 0.193 | 0.007 | 0.007 | 0.924 | 0.280 * | 0.277 * | 0.925 | 0.277 * | 0.274 * |
| 1668 | venus.travel | 0.655 | 0.377 * | 0.372 * | 0.200 | 0.007 | 0.007 | 0.734 | 0.190 * | 0.179 * | 0.737 | 0.188 * | 0.177 * |
| 1669 | venus.travel | 0.386 | 0.270 * | 0.257 * | 0.207 | 0.007 | 0.007 | 0.631 | 0.103 * | 0.095 * | 0.635 | 0.102 * | 0.094 * |
| 1670 | venus.travel | 0.225 | 0.160 * | 0.149 * | 0.213 | 0.007 | 0.007 | 0.575 | 0.056 | 0.053 | 0.580 | 0.055 | 0.052 |
| 1671 | venus.travel | 0.138 | 0.088 * | 0.081 * | 0.220 | 0.006 | 0.006 | 0.534 | 0.040 | 0.040 | 0.541 | 0.040 | 0.039 |
| 1672 | venus.travel | 0.090 | 0.048 | 0.045 | 0.226 | 0.006 | 0.006 | 0.492 | 0.042 | 0.049 | 0.499 | 0.042 | 0.048 |
| 1673 | venus.travel | 0.061 | 0.028 | 0.027 | 0.232 | 0.006 | 0.006 | 0.438 | 0.053 | 0.063 | 0.447 | 0.052 | 0.062 |
| 1674 | venus.travel | 0.043 | 0.019 | 0.018 | 0.237 | 0.005 | 0.005 | 0.371 | 0.067 | 0.075 | 0.381 | 0.066 | 0.074 |
| 1675 | venus.travel | 0.030 | 0.013 | 0.013 | 0.242 | 0.005 | 0.005 | 0.295 | 0.077 | 0.0796 | 0.305 | 0.075 | 0.078 |
| 1676 | venus.travel | 0.020 | 0.010 | 0.009 | 0.247 | 0.005 | 0.005 | 0.217 | 0.078 | 0.079 | 0.229 | 0.077 | 0.077 |
| 1677 | venus.travel | 0.013 | 0.007 | 0.007 | 0.251 | 0.004 | 0.004 | 0.146 | 0.071 | 0.070 | 0.159 | 0.070 | 0.069 |
| 1678 | venus.travel | 0.007 | 0.006 | 0.006 | 0.255 | 0.004 | 0.004 | 0.087 | 0.059 | 0.058 | 0.101 | 0.058 | 0.057 |
| 1679 | venus.travel | 0.002 | 0.004 | 0.004 | 0.258 | 0.003 | 0.003 | 0.042 | 0.046 | 0.044 | 0.056 | 0.045 | 0.044 |
| 1680 hold | earth.hold | 0.002 | 0.001 | 0.000 | 0.261 | 0.003 | 0.003 | 0.016 | 0.026 | 0.023 | 0.030 | 0.025 | 0.023 |
| 1681 | earth.hold | 0.002 | 0.000 | 0.000 | 0.263 | 0.002 | 0.002 | 0.013 | 0.003 | 0.001 | 0.027 | 0.003 | 0.001 |
| 1682 | earth.hold | 0.002 | 0.000 | 0.000 | 0.265 | 0.002 | 0.002 | 0.013 | 0.000 | 0.000 | 0.028 | 0.000 | 0.000 |
| 1683 | earth.hold | 0.002 | 0.000 | 0.000 | 0.266 | 0.001 | 0.001 | 0.013 | 0.000 | 0.000 | 0.028 | 0.000 | 0.000 |
| 1684 | earth.hold | 0.002 | 0.000 | 0.000 | 0.267 | 0.001 | 0.001 | 0.013 | 0.000 | 0.000 | 0.028 | 0.000 | 0.000 |
| 1685 | earth.hold | 0.002 | 0.000 | 0.000 | 0.267 | 0.000 | 0.000 | 0.013 | 0.000 | 0.000 | 0.028 | 0.000 | 0.000 |
| 1686 | earth.hold | 0.002 | 0.000 | 0.000 | 0.266 | 0.000 | 0.001 | 0.013 | 0.000 | 0.000 | 0.028 | 0.000 | 0.000 |
| 1687 | earth.hold | 0.002 | 0.000 | 0.000 | 0.265 | 0.001 | 0.001 | 0.013 | 0.000 | 0.000 | 0.028 | 0.000 | 0.000 |
| 1688 | earth.hold | 0.002 | 0.000 | 0.000 | 0.264 | 0.002 | 0.002 | 0.013 | 0.000 | 0.000 | 0.028 | 0.000 | 0.000 |
| 1689 | earth.hold | 0.002 | 0.000 | 0.000 | 0.262 | 0.002 | 0.002 | 0.013 | 0.000 | 0.000 | 0.027 | 0.000 | 0.000 |
| 1690 | earth.hold | 0.002 | 0.000 | 0.000 | 0.259 | 0.003 | 0.003 | 0.013 | 0.000 | 0.000 | 0.027 | 0.000 | 0.000 |
| 1691 | earth.hold | 0.002 | 0.000 | 0.000 | 0.256 | 0.003 | 0.004 | 0.013 | 0.000 | 0.000 | 0.027 | 0.000 | 0.000 |
