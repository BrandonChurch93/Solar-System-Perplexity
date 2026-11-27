# smooth: earth

Commit 262b9a68df0a6bda8d77518539580de554bb0dc5. Capture rate 2. Parts: path, pictures, place, parity, counts.

Joined from the files of 1 machine(s), nothing is rendered, measured or counted here. The path: /home/user/workspace/work/p6/he9/05/earth (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The pictures: the dive /home/user/workspace/work/p6/he9/01/earth-dive-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/he9/02/earth-dive-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz); the rise /home/user/workspace/work/p6/he9/03/earth-rise-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/he9/04/earth-rise-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The place: /home/user/workspace/work/p6/he9/05/earth (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The parity: /home/user/workspace/work/p6/he9/05/earth (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The counts: /home/user/workspace/work/p6/he9/06/earth (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

VERDICT: green. No number is over its limit.

VERDICT BESIDE IT, the pictures read with the carry at the full size (the verdict above is the one that counts and makes the exit code): red. 1 number over the limit or not measured.

GROUND POP BESIDE IT, a number without a limit that makes no verdict (1.3 is named as the limit to come), read with the carry at the full size on the ground both frames show: largest 1.101 from frame 2184 to the next, most at pixel 790, 118, a patch of 140 by 112 px; 0 of 424 rows read over 1.3 (pictures of the rise). It is not the line "The ground beside it" of the pictures: that line gives the change in place and the pattern on the surface view before a rise or after a dive, this number is read on the globe's ground through the move itself. Ground pop NOT READ on 2 of 426 rows, which says nothing of them, quiet or not: frame 1931 + 1/2: the last frame of the window, no next frame to carry onto it; frame 2186 + 1/2: the last frame of the window, no next frame to carry onto it.

## path

### dive (earth.dive, frames 1830 to 1919, T at 1919, window 1818 to 1931)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.0527 log of the height a film frame | 1.553 | 1889 | 0.057 | 1916 |  |  | 0.005 | 0.003 | 0.000 | 0.000 | 0.000 at 1923 |
| whole frames | turn | 0.8724 degrees a film frame | 1.557 | 1889 | 0.057 | 1911 |  |  | 0.007 | 0.002 | 0.000 | 0.000 | 0.000 at 1828 |
| whole frames | speed | 3.496 px a film frame at the place | 1.759 | 1863 | 0.065 over 8 | 1839 |  |  | 0.003 | 0.002 | 0.004 over 8 | 0.000 over 8 | 0.002 at 1931 |
| rate 2 | rate | 0.05241 log of the height a film frame | 1.561 | 1889 | 0.058 | 1916 | 0.029 | 1916 | 0.006 | 0.002 | 0.000 | 0.000 | 0.000 at 1922 + 1/2 |
| rate 2 | turn | 0.8677 degrees a film frame | 1.565 | 1889 + 1/2 | 0.057 | 1911 | 0.029 | 1910 + 1/2 | 0.008 | 0.001 | 0.000 | 0.000 | 0.000 at 1828 + 1/2 |
| rate 2 | speed | 3.52 px a film frame at the place | 1.775 | 1863 | 0.065 over 8 | 1839 | 0.032 over 8 | 1839 | 0.004 | 0.002 | 0.005 over 8 | 0.001 over 8 | 0.002 at 1931 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 1920, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.00195 of its height a film frame, the mean of its first 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 0.99 at frame 1919 + 1/2, limit 0.87; inside the dive itself 0.99 at frame 1919 + 1/2. Largest step from one capture frame to the next 1.03 at frame 1915 + 1/2, shown. The part along the surface view's own direction of motion: 0.99 at the lowest, lowest 0.99 at frame 1919 + 1/2, shown; under 0 the eye goes back.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1818 | hold orbit | 3.378e+0 | 0.006 |  |  | 0.003 |  |  | 0.118 |  |  | 0 |
| 1819 | hold orbit | 3.377e+0 | 0.006 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.118 | 0.000 | 0.000 | 8 |
| 1820 | hold orbit | 3.376e+0 | 0.006 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.118 | 0.000 | 0.000 | 8 |
| 1821 | hold orbit | 3.374e+0 | 0.006 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.118 | 0.000 | 0.000 | 8 |
| 1822 | hold orbit | 3.373e+0 | 0.006 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.117 | 0.000 | 0.000 | 8 |
| 1823 | hold orbit | 3.372e+0 | 0.006 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.117 | 0.000 | 0.000 | 8 |
| 1824 | hold orbit | 3.371e+0 | 0.006 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.117 | 0.000 | 0.000 | 8 |
| 1825 | hold orbit | 3.370e+0 | 0.006 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.116 | 0.000 | 0.000 | 8 |
| 1826 | hold orbit | 3.369e+0 | 0.006 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.116 | 0.000 | 0.000 | 8 |
| 1827 | hold orbit | 3.368e+0 | 0.006 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.115 | 0.000 | 0.001 | 8 |
| 1828 | hold orbit | 3.367e+0 | 0.006 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.115 | 0.001 | 0.001 | 8 |
| 1829 | hold orbit | 3.366e+0 | 0.006 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.114 | 0.001 | 0.001 | 8 |
| 1830 first | dive orbit | 3.365e+0 | 0.006 | 0.000 | 0.001 | 0.003 | 0.000 | 0.004 | 0.113 | 0.001 | 0.003 | 8 |
| 1831 | dive orbit | 3.363e+0 | 0.011 | 0.005 | 0.013 | 0.010 | 0.007 | 0.012 | 0.110 | 0.003 | 0.004 | 8 |
| 1832 | dive orbit | 3.358e+0 | 0.029 | 0.019 | 0.028 | 0.028 | 0.018 | 0.027 | 0.106 | 0.004 | 0.004 | 8 |
| 1833 | dive orbit | 3.347e+0 | 0.063 | 0.033 | 0.043 | 0.060 | 0.033 | 0.042 | 0.110 | 0.004 | 0.026 | 8 |
| 1834 | dive orbit | 3.328e+0 | 0.109 | 0.047 | 0.051 | 0.106 | 0.046 | 0.050 | 0.152 | 0.042 | 0.056 | 8 |
| 1835 | dive orbit | 3.300e+0 | 0.160 | 0.051 | 0.051 | 0.156 | 0.049 | 0.050 | 0.212 | 0.060 | 0.062 | 8 |
| 1836 | dive orbit | 3.263e+0 | 0.211 | 0.051 | 0.051 | 0.205 | 0.050 | 0.050 | 0.275 | 0.063 | 0.064 | 8 |
| 1837 | dive orbit | 3.219e+0 | 0.261 | 0.051 | 0.051 | 0.255 | 0.050 | 0.050 | 0.339 | 0.064 | 0.065 | 8 |
| 1838 | dive orbit | 3.166e+0 | 0.312 | 0.051 | 0.051 | 0.304 | 0.050 | 0.050 | 0.404 | 0.065 | 0.065 | 8 |
| 1839 | dive orbit | 3.106e+0 | 0.362 | 0.051 | 0.051 | 0.354 | 0.050 | 0.050 | 0.469 | 0.065 | 0.065 | 8 |
| 1840 | dive orbit | 3.040e+0 | 0.413 | 0.051 | 0.051 | 0.404 | 0.050 | 0.050 | 0.533 | 0.065 | 0.065 | 8 |
| 1841 | dive orbit | 2.966e+0 | 0.463 | 0.051 | 0.051 | 0.453 | 0.050 | 0.050 | 0.598 | 0.065 | 0.065 | 8 |
| 1842 | dive orbit | 2.887e+0 | 0.514 | 0.051 | 0.051 | 0.503 | 0.050 | 0.050 | 0.662 | 0.064 | 0.064 | 8 |
| 1843 | dive orbit | 2.802e+0 | 0.564 | 0.051 | 0.051 | 0.553 | 0.050 | 0.050 | 0.726 | 0.064 | 0.064 | 8 |
| 1844 | dive orbit | 2.713e+0 | 0.615 | 0.051 | 0.051 | 0.603 | 0.050 | 0.050 | 0.789 | 0.063 | 0.064 | 8 |
| 1845 | dive orbit | 2.619e+0 | 0.665 | 0.051 | 0.051 | 0.653 | 0.050 | 0.050 | 0.852 | 0.063 | 0.063 | 8 |
| 1846 | dive orbit | 2.522e+0 | 0.716 | 0.051 | 0.051 | 0.703 | 0.050 | 0.050 | 0.914 | 0.062 | 0.062 | 8 |
| 1847 | dive orbit | 2.423e+0 | 0.767 | 0.051 | 0.051 | 0.753 | 0.050 | 0.050 | 0.975 | 0.061 | 0.062 | 8 |
| 1848 | dive orbit | 2.321e+0 | 0.817 | 0.051 | 0.051 | 0.803 | 0.050 | 0.050 | 1.035 | 0.060 | 0.061 | 8 |
| 1849 | dive orbit | 2.217e+0 | 0.868 | 0.051 | 0.051 | 0.853 | 0.050 | 0.050 | 1.095 | 0.060 | 0.060 | 8 |
| 1850 | dive orbit | 2.112e+0 | 0.918 | 0.051 | 0.051 | 0.903 | 0.050 | 0.050 | 1.154 | 0.059 | 0.059 | 8 |
| 1851 | dive orbit | 2.007e+0 | 0.969 | 0.051 | 0.051 | 0.953 | 0.050 | 0.050 | 1.211 | 0.058 | 0.058 | 8 |
| 1852 | dive orbit | 1.902e+0 | 1.019 | 0.051 | 0.051 | 1.003 | 0.050 | 0.050 | 1.268 | 0.057 | 0.057 | 8 |
| 1853 | dive orbit | 1.798e+0 | 1.070 | 0.051 | 0.051 | 1.053 | 0.050 | 0.050 | 1.324 | 0.056 | 0.056 | 8 |
| 1854 | dive orbit | 1.695e+0 | 1.120 | 0.051 | 0.051 | 1.104 | 0.050 | 0.051 | 1.378 | 0.054 | 0.055 | 8 |
| 1855 | dive orbit | 1.593e+0 | 1.171 | 0.051 | 0.051 | 1.154 | 0.050 | 0.051 | 1.431 | 0.053 | 0.054 | 8 |
| 1856 | dive orbit | 1.494e+0 | 1.221 | 0.051 | 0.051 | 1.204 | 0.050 | 0.051 | 1.483 | 0.052 | 0.052 | 8 |
| 1857 | dive orbit | 1.397e+0 | 1.272 | 0.051 | 0.051 | 1.254 | 0.050 | 0.051 | 1.533 | 0.050 | 0.051 | 8 |
| 1858 | dive orbit | 1.303e+0 | 1.323 | 0.051 | 0.051 | 1.305 | 0.050 | 0.051 | 1.581 | 0.049 | 0.049 | 8 |
| 1859 | dive orbit | 1.212e+0 | 1.373 | 0.051 | 0.051 | 1.355 | 0.050 | 0.051 | 1.628 | 0.047 | 0.048 | 8 |
| 1860 | dive orbit | 1.124e+0 | 1.424 | 0.051 | 0.051 | 1.406 | 0.050 | 0.051 | 1.673 | 0.045 | 0.046 | 8 |
| 1861 | dive orbit | 1.040e+0 | 1.474 | 0.050 | 0.050 | 1.456 | 0.050 | 0.050 | 1.716 | 0.042 | 0.043 | 8 |
| 1862 | dive orbit | 9.606e-1 | 1.514 | 0.041 | 0.039 | 1.497 | 0.041 | 0.039 | 1.746 | 0.030 | 0.029 | 8 |
| 1863 | dive orbit | 8.857e-1 | 1.540 | 0.026 | 0.024 | 1.523 | 0.026 | 0.025 | 1.759 | 0.013 | 0.011 | 8 |
| 1864 | dive orbit | 8.161e-1 | 1.552 | 0.011 | 0.009 | 1.535 | 0.012 | 0.010 | 1.754 | 0.005 | 0.014 | 8 |
| 1865 | dive orbit | 7.520e-1 | 1.553 | 0.001 | 0.000 | 1.537 | 0.002 | 0.001 | 1.737 | 0.016 | 0.018 | 8 |
| 1866 | dive orbit | 6.929e-1 | 1.553 | 0.000 | 0.000 | 1.537 | 0.001 | 0.001 | 1.720 | 0.018 | 0.018 | 8 |
| 1867 | dive orbit | 6.385e-1 | 1.553 | 0.000 | 0.000 | 1.538 | 0.001 | 0.001 | 1.702 | 0.018 | 0.019 | 8 |
| 1868 | dive orbit | 5.883e-1 | 1.553 | 0.000 | 0.000 | 1.539 | 0.001 | 0.001 | 1.683 | 0.018 | 0.019 | 8 |
| 1869 | dive orbit | 5.421e-1 | 1.553 | 0.000 | 0.000 | 1.540 | 0.001 | 0.001 | 1.665 | 0.018 | 0.019 | 8 |
| 1870 | dive orbit | 4.995e-1 | 1.553 | 0.000 | 0.000 | 1.541 | 0.001 | 0.001 | 1.646 | 0.019 | 0.019 | 8 |
| 1871 | dive orbit | 4.603e-1 | 1.553 | 0.000 | 0.000 | 1.542 | 0.001 | 0.001 | 1.627 | 0.019 | 0.019 | 8 |
| 1872 | dive orbit | 4.241e-1 | 1.553 | 0.000 | 0.000 | 1.542 | 0.001 | 0.001 | 1.608 | 0.019 | 0.019 | 8 |
| 1873 | dive orbit | 3.908e-1 | 1.553 | 0.000 | 0.000 | 1.543 | 0.001 | 0.001 | 1.589 | 0.019 | 0.020 | 8 |
| 1874 | dive orbit | 3.601e-1 | 1.553 | 0.000 | 0.000 | 1.544 | 0.001 | 0.001 | 1.570 | 0.019 | 0.020 | 8 |
| 1875 | dive orbit | 3.318e-1 | 1.553 | 0.000 | 0.000 | 1.545 | 0.001 | 0.001 | 1.551 | 0.019 | 0.020 | 8 |
| 1876 | dive orbit | 3.057e-1 | 1.553 | 0.000 | 0.000 | 1.546 | 0.001 | 0.001 | 1.531 | 0.019 | 0.020 | 8 |
| 1877 | dive orbit | 2.817e-1 | 1.553 | 0.000 | 0.000 | 1.547 | 0.001 | 0.001 | 1.512 | 0.020 | 0.020 | 8 |
| 1878 | dive orbit | 2.596e-1 | 1.553 | 0.000 | 0.000 | 1.547 | 0.001 | 0.001 | 1.492 | 0.020 | 0.020 | 8 |
| 1879 | dive orbit | 2.392e-1 | 1.553 | 0.000 | 0.000 | 1.548 | 0.001 | 0.001 | 1.472 | 0.020 | 0.020 | 8 |
| 1880 | dive orbit | 2.204e-1 | 1.553 | 0.000 | 0.000 | 1.549 | 0.001 | 0.001 | 1.452 | 0.020 | 0.020 | 8 |
| 1881 | dive orbit | 2.031e-1 | 1.553 | 0.000 | 0.000 | 1.550 | 0.001 | 0.001 | 1.433 | 0.020 | 0.020 | 8 |
| 1882 | dive orbit | 1.871e-1 | 1.553 | 0.000 | 0.000 | 1.551 | 0.001 | 0.001 | 1.413 | 0.020 | 0.020 | 8 |
| 1883 | dive orbit | 1.724e-1 | 1.553 | 0.000 | 0.000 | 1.552 | 0.001 | 0.001 | 1.393 | 0.020 | 0.020 | 8 |
| 1884 | dive orbit | 1.589e-1 | 1.553 | 0.000 | 0.000 | 1.552 | 0.001 | 0.001 | 1.372 | 0.020 | 0.021 | 8 |
| 1885 | dive orbit | 1.464e-1 | 1.553 | 0.000 | 0.000 | 1.553 | 0.001 | 0.001 | 1.352 | 0.020 | 0.021 | 8 |
| 1886 | dive orbit | 1.349e-1 | 1.553 | 0.000 | 0.000 | 1.554 | 0.001 | 0.001 | 1.332 | 0.020 | 0.021 | 8 |
| 1887 | dive orbit | 1.243e-1 | 1.553 | 0.000 | 0.000 | 1.555 | 0.001 | 0.001 | 1.311 | 0.020 | 0.021 | 8 |
| 1888 | dive orbit | 1.145e-1 | 1.553 | 0.000 | 0.000 | 1.556 | 0.001 | 0.001 | 1.291 | 0.021 | 0.021 | 8 |
| 1889 | dive orbit | 1.055e-1 | 1.553 | 0.000 | 0.000 | 1.557 | 0.001 | 0.001 | 1.270 | 0.021 | 0.021 | 8 |
| 1890 | dive orbit | 9.724e-2 | 1.550 | 0.003 | 0.012 | 1.554 | 0.002 | 0.011 | 1.247 | 0.023 | 0.030 | 8 |
| 1891 | dive orbit | 8.970e-2 | 1.530 | 0.019 | 0.031 | 1.536 | 0.018 | 0.030 | 1.212 | 0.035 | 0.045 | 8 |
| 1892 | dive orbit | 8.292e-2 | 1.492 | 0.038 | 0.050 | 1.499 | 0.037 | 0.049 | 1.163 | 0.049 | 0.057 | 8 |
| 1893 | dive orbit | 7.687e-2 | 1.438 | 0.054 | 0.058 | 1.446 | 0.053 | 0.057 | 1.104 | 0.059 | 0.061 | 8 |
| 1894 | dive orbit | 7.147e-2 | 1.380 | 0.057 | 0.058 | 1.390 | 0.056 | 0.057 | 1.044 | 0.059 | 0.060 | 8 |
| 1895 | dive orbit | 6.666e-2 | 1.323 | 0.057 | 0.058 | 1.333 | 0.056 | 0.057 | 0.987 | 0.057 | 0.058 | 8 |
| 1896 | dive orbit | 6.236e-2 | 1.265 | 0.057 | 0.058 | 1.277 | 0.056 | 0.057 | 0.932 | 0.055 | 0.055 | 8 |
| 1897 | dive orbit | 5.851e-2 | 1.208 | 0.057 | 0.058 | 1.221 | 0.056 | 0.057 | 0.879 | 0.053 | 0.053 | 8 |
| 1898 | dive orbit | 5.507e-2 | 1.150 | 0.057 | 0.058 | 1.164 | 0.056 | 0.057 | 0.828 | 0.051 | 0.051 | 8 |
| 1899 | dive orbit | 5.199e-2 | 1.093 | 0.057 | 0.058 | 1.108 | 0.057 | 0.057 | 0.779 | 0.049 | 0.049 | 8 |
| 1900 | dive orbit | 4.923e-2 | 1.035 | 0.057 | 0.058 | 1.051 | 0.057 | 0.057 | 0.731 | 0.047 | 0.047 | 8 |
| 1901 | dive orbit | 4.676e-2 | 0.978 | 0.057 | 0.058 | 0.994 | 0.057 | 0.057 | 0.686 | 0.045 | 0.045 | 8 |
| 1902 | dive orbit | 4.454e-2 | 0.920 | 0.057 | 0.058 | 0.938 | 0.057 | 0.057 | 0.642 | 0.044 | 0.044 | 8 |
| 1903 | dive orbit | 4.256e-2 | 0.863 | 0.057 | 0.058 | 0.881 | 0.057 | 0.057 | 0.601 | 0.042 | 0.042 | 8 |
| 1904 | dive orbit | 4.079e-2 | 0.806 | 0.057 | 0.058 | 0.824 | 0.057 | 0.057 | 0.561 | 0.040 | 0.040 | 8 |
| 1905 | dive orbit | 3.921e-2 | 0.748 | 0.057 | 0.058 | 0.768 | 0.057 | 0.057 | 0.523 | 0.038 | 0.038 | 8 |
| 1906 | dive orbit | 3.781e-2 | 0.691 | 0.057 | 0.058 | 0.711 | 0.057 | 0.057 | 0.486 | 0.036 | 0.036 | 8 |
| 1907 | dive orbit | 3.657e-2 | 0.633 | 0.057 | 0.058 | 0.654 | 0.057 | 0.057 | 0.452 | 0.034 | 0.034 | 8 |
| 1908 | dive orbit | 3.548e-2 | 0.576 | 0.057 | 0.058 | 0.597 | 0.057 | 0.057 | 0.419 | 0.033 | 0.033 | 8 |
| 1909 | dive orbit | 3.452e-2 | 0.518 | 0.057 | 0.058 | 0.540 | 0.057 | 0.057 | 0.388 | 0.031 | 0.031 | 8 |
| 1910 | dive orbit | 3.370e-2 | 0.461 | 0.057 | 0.058 | 0.484 | 0.057 | 0.057 | 0.358 | 0.030 | 0.030 | 8 |
| 1911 | dive orbit | 3.299e-2 | 0.403 | 0.057 | 0.058 | 0.427 | 0.057 | 0.057 | 0.329 | 0.029 | 0.029 | 8 |
| 1912 | dive orbit | 3.239e-2 | 0.346 | 0.057 | 0.058 | 0.370 | 0.057 | 0.057 | 0.301 | 0.027 | 0.027 | 8 |
| 1913 | dive orbit | 3.190e-2 | 0.288 | 0.057 | 0.058 | 0.313 | 0.057 | 0.057 | 0.276 | 0.025 | 0.025 | 8 |
| 1914 | dive orbit | 3.152e-2 | 0.231 | 0.057 | 0.058 | 0.256 | 0.057 | 0.057 | 0.254 | 0.022 | 0.022 | 8 |
| 1915 | dive orbit | 3.123e-2 | 0.173 | 0.057 | 0.058 | 0.200 | 0.057 | 0.057 | 0.236 | 0.018 | 0.017 | 8 |
| 1916 | dive orbit | 3.104e-2 | 0.116 | 0.057 | 0.058 | 0.144 | 0.056 | 0.056 | 0.223 | 0.013 | 0.012 | 8 |
| 1917 | dive orbit | 3.094e-2 | 0.062 | 0.054 | 0.054 | 0.092 | 0.051 | 0.051 | 0.216 | 0.007 | 0.006 | 8 |
| 1918 | dive orbit | 3.090e-2 | 0.023 | 0.038 | 0.036 | 0.059 | 0.033 | 0.031 | 0.214 | 0.002 | 0.001 | 8 |
| 1919 last | dive terrain | 3.090e-2 | 0.004 | 0.019 | 0.017 | 0.045 | 0.014 | 0.012 | 0.215 | 0.000 | 0.001 | 8 |
| 1920 | terrain terrain | 3.089e-2 | 0.001 | 0.003 | 0.002 | 0.043 | 0.002 | 0.001 | 0.216 | 0.001 | 0.001 | 8 |
| 1921 | terrain terrain | 3.089e-2 | 0.001 | 0.000 | 0.000 | 0.043 | 0.000 | 0.000 | 0.217 | 0.002 | 0.002 | 8 |
| 1922 | terrain terrain | 3.089e-2 | 0.001 | 0.000 | 0.000 | 0.043 | 0.000 | 0.000 | 0.219 | 0.002 | 0.002 | 8 |
| 1923 | terrain terrain | 3.089e-2 | 0.001 | 0.000 | 0.000 | 0.043 | 0.000 | 0.000 | 0.220 | 0.002 | 0.002 | 8 |
| 1924 | terrain terrain | 3.089e-2 | 0.001 | 0.000 | 0.000 | 0.043 | 0.000 | 0.000 | 0.222 | 0.002 | 0.002 | 8 |
| 1925 | terrain terrain | 3.089e-2 | 0.001 | 0.000 | 0.000 | 0.043 | 0.000 | 0.000 | 0.224 | 0.002 | 0.002 | 8 |
| 1926 | terrain terrain | 3.089e-2 | 0.001 | 0.000 | 0.000 | 0.043 | 0.000 | 0.000 | 0.225 | 0.002 | 0.002 | 8 |
| 1927 | terrain terrain | 3.088e-2 | 0.001 | 0.000 | 0.000 | 0.043 | 0.000 | 0.000 | 0.227 | 0.002 | 0.002 | 8 |
| 1928 | terrain terrain | 3.088e-2 | 0.001 | 0.000 | 0.000 | 0.043 | 0.000 | 0.000 | 0.228 | 0.002 | 0.002 | 8 |
| 1929 | terrain terrain | 3.088e-2 | 0.001 | 0.000 | 0.000 | 0.043 | 0.000 | 0.000 | 0.230 | 0.002 | 0.002 | 8 |
| 1930 | terrain terrain | 3.088e-2 | 0.001 | 0.000 | 0.000 | 0.043 | 0.000 | 0.000 | 0.231 | 0.002 | 0.002 | 8 |
| 1931 | terrain terrain | 3.088e-2 | 0.001 | 0.000 | 0.000 | 0.043 | 0.000 | 0.000 | 0.233 | 0.002 | 0.002 | 8 |

### rise (earth.rise, frames 2100 to 2174, T at 2100, window 2088 to 2186)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.06283 log of the height a film frame | 1.594 | 2144 | 0.054 | 2106 |  |  | 0.003 | 0.015 | 0.000 | 0.000 | 0.045 at 2186 |
| whole frames | turn | 1.262 degrees a film frame | 1.615 | 2146 | 0.072 | 2172 |  |  | 0.007 | 0.037 | 0.014 | 0.000 | 0.000 at 2186 |
| whole frames | speed | 4.65 px a film frame at the place | 1.599 | 2138 | 0.070 over 8 | 2126 |  |  | 0.002 | 0.014 | 0.001 over 8 | 0.002 over 8 | 5.437 at 2186 |
| rate 2 | rate | 0.06249 log of the height a film frame | 1.603 | 2144 + 1/2 | 0.054 | 2105 | 0.027 | 2105 | 0.004 | 0.013 | 0.000 | 0.000 | 0.064 at 2186 + 1/2 |
| rate 2 | turn | 1.254 degrees a film frame | 1.627 | 2146 | 0.073 | 2172 | 0.036 | 2172 | 0.009 | 0.036 | 0.016 | 0.000 | 0.000 at 2186 + 1/2 |
| rate 2 | speed | 4.571 px a film frame at the place | 1.600 | 2137 + 1/2 | 0.069 over 8 | 2126 | 0.035 over 8 | 2125 + 1/2 | 0.001 | 0.014 | 0.001 over 8 | 0.003 over 8 | 5.868 at 2186 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 2100, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.00403 of its height a film frame, the mean of its last 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 1.00 at frame 2084, limit 0.87; inside the rise itself 1.00 at frame 2100 + 1/2. Largest step from one capture frame to the next 0.57 at frame 2114 + 1/2, shown. The part along the surface view's own direction of motion: 0.61 at the lowest, lowest 0.61 at frame 2084, shown; under 0 the eye goes back.

Rest between the rise and the travel (the seam into earth.travel at film frame 2175, 12 film frames to each side, read at rate 2): a rise and the travel after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body's edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest 6.15 at frame 2175, against 32.99 at frame 2163 and 99.11 at frame 2186 + 1/2 at the ends of the window. The lowest is 0.186 of the slower end, limit 0.07. Near 0 the picture comes to rest between the rise and the travel.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2088 | terrain terrain | 3.227e-2 | 0.064 |  |  | 0.031 |  |  | 0.434 |  |  | 0 |
| 2089 | terrain terrain | 3.240e-2 | 0.064 | 0.000 | 0.001 | 0.031 | 0.000 | 0.000 | 0.419 | 0.014 | 0.015 | 8 |
| 2090 | terrain terrain | 3.252e-2 | 0.063 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.404 | 0.015 | 0.016 | 8 |
| 2091 | terrain terrain | 3.265e-2 | 0.062 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.389 | 0.015 | 0.016 | 8 |
| 2092 | terrain terrain | 3.278e-2 | 0.061 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.374 | 0.015 | 0.015 | 8 |
| 2093 | terrain terrain | 3.290e-2 | 0.059 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.359 | 0.014 | 0.015 | 8 |
| 2094 | terrain terrain | 3.302e-2 | 0.058 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.346 | 0.013 | 0.013 | 8 |
| 2095 | terrain terrain | 3.314e-2 | 0.057 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.334 | 0.012 | 0.012 | 8 |
| 2096 | terrain terrain | 3.325e-2 | 0.055 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.324 | 0.010 | 0.010 | 8 |
| 2097 | terrain terrain | 3.337e-2 | 0.054 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.316 | 0.008 | 0.008 | 8 |
| 2098 | terrain terrain | 3.348e-2 | 0.053 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.310 | 0.006 | 0.006 | 8 |
| 2099 | terrain terrain | 3.359e-2 | 0.053 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.306 | 0.004 | 0.004 | 8 |
| 2100 first | rise terrain | 3.370e-2 | 0.053 | 0.000 | 0.000 | 0.031 | 0.000 | 0.002 | 0.304 | 0.002 | 0.001 | 8 |
| 2101 | rise orbit | 3.382e-2 | 0.055 | 0.003 | 0.011 | 0.024 | 0.007 | 0.014 | 0.304 | 0.000 | 0.000 | 8 |
| 2102 | rise orbit | 3.397e-2 | 0.072 | 0.017 | 0.027 | 0.017 | 0.007 | 0.021 | 0.304 | 0.001 | 0.001 | 8 |
| 2103 | rise orbit | 3.420e-2 | 0.105 | 0.033 | 0.044 | 0.054 | 0.037 | 0.053 | 0.303 | 0.000 | 0.000 | 8 |
| 2104 | rise orbit | 3.453e-2 | 0.154 | 0.049 | 0.054 | 0.112 | 0.058 | 0.063 | 0.305 | 0.001 | 0.003 | 8 |
| 2105 | rise orbit | 3.498e-2 | 0.208 | 0.054 | 0.054 | 0.175 | 0.063 | 0.063 | 0.308 | 0.004 | 0.006 | 8 |
| 2106 | rise orbit | 3.556e-2 | 0.261 | 0.054 | 0.054 | 0.237 | 0.063 | 0.063 | 0.315 | 0.007 | 0.009 | 8 |
| 2107 | rise orbit | 3.627e-2 | 0.315 | 0.054 | 0.054 | 0.299 | 0.062 | 0.062 | 0.326 | 0.011 | 0.013 | 8 |
| 2108 | rise orbit | 3.712e-2 | 0.368 | 0.054 | 0.054 | 0.361 | 0.061 | 0.062 | 0.340 | 0.014 | 0.017 | 8 |
| 2109 | rise orbit | 3.812e-2 | 0.422 | 0.054 | 0.054 | 0.422 | 0.061 | 0.061 | 0.358 | 0.018 | 0.020 | 8 |
| 2110 | rise orbit | 3.928e-2 | 0.475 | 0.054 | 0.054 | 0.482 | 0.060 | 0.060 | 0.378 | 0.020 | 0.022 | 8 |
| 2111 | rise orbit | 4.060e-2 | 0.529 | 0.054 | 0.054 | 0.541 | 0.059 | 0.059 | 0.401 | 0.023 | 0.026 | 8 |
| 2112 | rise orbit | 4.212e-2 | 0.583 | 0.054 | 0.054 | 0.599 | 0.058 | 0.059 | 0.428 | 0.027 | 0.029 | 8 |
| 2113 | rise orbit | 4.383e-2 | 0.636 | 0.054 | 0.054 | 0.657 | 0.058 | 0.058 | 0.459 | 0.031 | 0.034 | 8 |
| 2114 | rise orbit | 4.578e-2 | 0.690 | 0.054 | 0.054 | 0.714 | 0.057 | 0.057 | 0.494 | 0.035 | 0.039 | 8 |
| 2115 | rise orbit | 4.796e-2 | 0.743 | 0.054 | 0.054 | 0.770 | 0.056 | 0.057 | 0.536 | 0.041 | 0.045 | 8 |
| 2116 | rise orbit | 5.042e-2 | 0.797 | 0.054 | 0.054 | 0.826 | 0.056 | 0.056 | 0.583 | 0.047 | 0.051 | 8 |
| 2117 | rise orbit | 5.319e-2 | 0.850 | 0.054 | 0.054 | 0.881 | 0.055 | 0.056 | 0.635 | 0.052 | 0.055 | 8 |
| 2118 | rise orbit | 5.630e-2 | 0.904 | 0.054 | 0.054 | 0.936 | 0.055 | 0.055 | 0.691 | 0.056 | 0.059 | 8 |
| 2119 | rise orbit | 5.979e-2 | 0.957 | 0.054 | 0.054 | 0.990 | 0.054 | 0.055 | 0.751 | 0.060 | 0.062 | 8 |
| 2120 | rise orbit | 6.371e-2 | 1.011 | 0.054 | 0.054 | 1.044 | 0.054 | 0.054 | 0.814 | 0.063 | 0.064 | 8 |
| 2121 | rise orbit | 6.812e-2 | 1.064 | 0.054 | 0.054 | 1.098 | 0.054 | 0.054 | 0.878 | 0.065 | 0.066 | 8 |
| 2122 | rise orbit | 7.307e-2 | 1.118 | 0.054 | 0.054 | 1.152 | 0.053 | 0.054 | 0.945 | 0.067 | 0.067 | 8 |
| 2123 | rise orbit | 7.866e-2 | 1.171 | 0.054 | 0.054 | 1.205 | 0.053 | 0.054 | 1.013 | 0.068 | 0.068 | 8 |
| 2124 | rise orbit | 8.495e-2 | 1.225 | 0.054 | 0.054 | 1.258 | 0.053 | 0.053 | 1.082 | 0.069 | 0.069 | 8 |
| 2125 | rise orbit | 9.205e-2 | 1.279 | 0.054 | 0.054 | 1.311 | 0.053 | 0.053 | 1.152 | 0.070 | 0.069 | 8 |
| 2126 | rise orbit | 1.001e-1 | 1.332 | 0.054 | 0.054 | 1.363 | 0.053 | 0.053 | 1.222 | 0.070 | 0.069 | 8 |
| 2127 | rise orbit | 1.092e-1 | 1.386 | 0.054 | 0.054 | 1.416 | 0.053 | 0.053 | 1.291 | 0.070 | 0.069 | 8 |
| 2128 | rise orbit | 1.195e-1 | 1.439 | 0.054 | 0.054 | 1.468 | 0.052 | 0.053 | 1.361 | 0.069 | 0.069 | 8 |
| 2129 | rise orbit | 1.313e-1 | 1.493 | 0.054 | 0.054 | 1.521 | 0.052 | 0.053 | 1.430 | 0.069 | 0.068 | 8 |
| 2130 | rise orbit | 1.446e-1 | 1.541 | 0.049 | 0.048 | 1.568 | 0.047 | 0.047 | 1.493 | 0.063 | 0.061 | 8 |
| 2131 | rise orbit | 1.597e-1 | 1.575 | 0.033 | 0.032 | 1.600 | 0.031 | 0.029 | 1.540 | 0.047 | 0.044 | 8 |
| 2132 | rise orbit | 1.765e-1 | 1.592 | 0.017 | 0.015 | 1.614 | 0.014 | 0.012 | 1.568 | 0.028 | 0.025 | 8 |
| 2133 | rise orbit | 1.951e-1 | 1.594 | 0.003 | 0.001 | 1.613 | 0.000 | 0.003 | 1.580 | 0.012 | 0.010 | 8 |
| 2134 | rise orbit | 2.156e-1 | 1.594 | 0.000 | 0.000 | 1.610 | 0.003 | 0.003 | 1.587 | 0.007 | 0.007 | 8 |
| 2135 | rise orbit | 2.383e-1 | 1.594 | 0.000 | 0.000 | 1.607 | 0.003 | 0.003 | 1.592 | 0.005 | 0.005 | 8 |
| 2136 | rise orbit | 2.635e-1 | 1.594 | 0.000 | 0.000 | 1.605 | 0.002 | 0.002 | 1.596 | 0.004 | 0.004 | 8 |
| 2137 | rise orbit | 2.912e-1 | 1.594 | 0.000 | 0.000 | 1.603 | 0.002 | 0.002 | 1.598 | 0.002 | 0.002 | 8 |
| 2138 | rise orbit | 3.219e-1 | 1.594 | 0.000 | 0.000 | 1.601 | 0.002 | 0.002 | 1.599 | 0.000 | 0.001 | 8 |
| 2139 | rise orbit | 3.558e-1 | 1.594 | 0.000 | 0.000 | 1.600 | 0.001 | 0.001 | 1.597 | 0.001 | 0.003 | 8 |
| 2140 | rise orbit | 3.933e-1 | 1.594 | 0.000 | 0.000 | 1.599 | 0.001 | 0.001 | 1.594 | 0.004 | 0.005 | 8 |
| 2141 | rise orbit | 4.348e-1 | 1.594 | 0.000 | 0.000 | 1.599 | 0.000 | 0.000 | 1.587 | 0.006 | 0.009 | 8 |
| 2142 | rise orbit | 4.806e-1 | 1.594 | 0.000 | 0.000 | 1.600 | 0.001 | 0.001 | 1.577 | 0.010 | 0.013 | 8 |
| 2143 | rise orbit | 5.312e-1 | 1.594 | 0.000 | 0.000 | 1.601 | 0.002 | 0.002 | 1.563 | 0.015 | 0.018 | 8 |
| 2144 | rise orbit | 5.872e-1 | 1.594 | 0.000 | 0.000 | 1.604 | 0.003 | 0.004 | 1.543 | 0.020 | 0.023 | 8 |
| 2145 | rise orbit | 6.490e-1 | 1.594 | 0.000 | 0.001 | 1.608 | 0.004 | 0.007 | 1.517 | 0.025 | 0.029 | 8 |
| 2146 | rise orbit | 7.172e-1 | 1.589 | 0.005 | 0.015 | 1.615 | 0.007 | 0.008 | 1.484 | 0.034 | 0.039 | 8 |
| 2147 | rise orbit | 7.914e-1 | 1.568 | 0.021 | 0.032 | 1.607 | 0.008 | 0.020 | 1.446 | 0.038 | 0.037 | 8 |
| 2148 | rise orbit | 8.713e-1 | 1.530 | 0.038 | 0.047 | 1.579 | 0.028 | 0.040 | 1.420 | 0.026 | 0.023 | 8 |
| 2149 | rise orbit | 9.563e-1 | 1.481 | 0.049 | 0.050 | 1.536 | 0.043 | 0.047 | 1.412 | 0.008 | 0.006 | 8 |
| 2150 | rise orbit | 1.046e+0 | 1.431 | 0.050 | 0.050 | 1.488 | 0.047 | 0.050 | 1.414 | 0.002 | 0.003 | 8 |
| 2151 | rise orbit | 1.141e+0 | 1.381 | 0.050 | 0.050 | 1.439 | 0.050 | 0.051 | 1.413 | 0.002 | 0.007 | 8 |
| 2152 | rise orbit | 1.241e+0 | 1.331 | 0.050 | 0.050 | 1.388 | 0.051 | 0.052 | 1.401 | 0.011 | 0.017 | 8 |
| 2153 | rise orbit | 1.345e+0 | 1.281 | 0.050 | 0.050 | 1.336 | 0.052 | 0.053 | 1.380 | 0.021 | 0.026 | 8 |
| 2154 | rise orbit | 1.453e+0 | 1.232 | 0.050 | 0.050 | 1.283 | 0.053 | 0.054 | 1.350 | 0.030 | 0.034 | 8 |
| 2155 | rise orbit | 1.565e+0 | 1.182 | 0.050 | 0.050 | 1.230 | 0.053 | 0.054 | 1.314 | 0.036 | 0.039 | 8 |
| 2156 | rise orbit | 1.680e+0 | 1.132 | 0.050 | 0.050 | 1.175 | 0.054 | 0.055 | 1.272 | 0.042 | 0.044 | 8 |
| 2157 | rise orbit | 1.798e+0 | 1.082 | 0.050 | 0.050 | 1.120 | 0.055 | 0.056 | 1.227 | 0.046 | 0.047 | 8 |
| 2158 | rise orbit | 1.919e+0 | 1.032 | 0.050 | 0.050 | 1.064 | 0.056 | 0.057 | 1.178 | 0.048 | 0.049 | 8 |
| 2159 | rise orbit | 2.041e+0 | 0.982 | 0.050 | 0.050 | 1.007 | 0.057 | 0.058 | 1.128 | 0.050 | 0.049 | 8 |
| 2160 | rise orbit | 2.164e+0 | 0.932 | 0.050 | 0.050 | 0.949 | 0.058 | 0.059 | 1.079 | 0.049 | 0.049 | 8 |
| 2161 | rise orbit | 2.288e+0 | 0.882 | 0.050 | 0.050 | 0.890 | 0.059 | 0.060 | 1.031 | 0.048 | 0.047 | 8 |
| 2162 | rise orbit | 2.411e+0 | 0.832 | 0.050 | 0.050 | 0.830 | 0.060 | 0.061 | 0.984 | 0.047 | 0.047 | 8 |
| 2163 | rise orbit | 2.532e+0 | 0.782 | 0.050 | 0.051 | 0.769 | 0.061 | 0.062 | 0.937 | 0.047 | 0.047 | 8 |
| 2164 | rise orbit | 2.651e+0 | 0.732 | 0.050 | 0.051 | 0.707 | 0.062 | 0.063 | 0.890 | 0.048 | 0.049 | 8 |
| 2165 | rise orbit | 2.767e+0 | 0.681 | 0.051 | 0.051 | 0.644 | 0.063 | 0.064 | 0.839 | 0.050 | 0.052 | 8 |
| 2166 | rise orbit | 2.879e+0 | 0.630 | 0.051 | 0.051 | 0.579 | 0.064 | 0.065 | 0.786 | 0.053 | 0.056 | 8 |
| 2167 | rise orbit | 2.985e+0 | 0.579 | 0.051 | 0.051 | 0.514 | 0.065 | 0.067 | 0.729 | 0.057 | 0.060 | 8 |
| 2168 | rise orbit | 3.086e+0 | 0.528 | 0.051 | 0.052 | 0.447 | 0.067 | 0.068 | 0.668 | 0.061 | 0.063 | 8 |
| 2169 | rise orbit | 3.180e+0 | 0.476 | 0.052 | 0.052 | 0.379 | 0.068 | 0.069 | 0.604 | 0.064 | 0.066 | 8 |
| 2170 | rise orbit | 3.266e+0 | 0.425 | 0.052 | 0.052 | 0.310 | 0.069 | 0.071 | 0.539 | 0.066 | 0.067 | 8 |
| 2171 | rise orbit | 3.343e+0 | 0.372 | 0.052 | 0.053 | 0.240 | 0.071 | 0.072 | 0.472 | 0.067 | 0.067 | 8 |
| 2172 | rise orbit | 3.411e+0 | 0.320 | 0.052 | 0.053 | 0.168 | 0.072 | 0.073 | 0.406 | 0.066 | 0.067 | 8 |
| 2173 | rise orbit | 3.470e+0 | 0.273 | 0.047 | 0.046 | 0.100 | 0.068 | 0.067 | 0.347 | 0.058 | 0.057 | 8 |
| 2174 last | rise orbit | 3.523e+0 | 0.241 | 0.032 | 0.030 | 0.046 | 0.053 | 0.052 | 0.311 | 0.037 | 0.034 | 8 |
| 2175 | travel orbit | 3.573e+0 | 0.226 | 0.015 | 0.013 | 0.009 | 0.037 | 0.036 | 0.297 | 0.014 | 0.011 | 8 |
| 2176 | travel orbit | 3.623e+0 | 0.221 | 0.005 | 0.005 | 0.002 | 0.008 | 0.003 | 0.306 | 0.009 | 0.023 | 8 |
| 2177 | travel orbit | 3.672e+0 | 0.214 | 0.007 | 0.009 | 0.002 | 0.000 | 0.000 | 0.331 | 0.026 | 0.036 | 8 |
| 2178 | travel orbit | 3.720e+0 | 0.203 | 0.011 | 0.014 | 0.002 | 0.000 | 0.000 | 0.391 | 0.060 | 0.138 * | 8 |
| 2179 | travel orbit | 3.764e+0 | 0.187 | 0.016 | 0.018 | 0.002 | 0.000 | 0.000 | 0.617 | 0.226 * | 0.432 * | 8 |
| 2180 | travel orbit | 3.804e+0 | 0.169 | 0.019 | 0.020 | 0.002 | 0.000 | 0.000 | 1.213 | 0.597 * | 0.950 * | 8 |
| 2181 | travel orbit | 3.839e+0 | 0.149 | 0.020 | 0.020 | 0.002 | 0.000 | 0.000 | 2.401 | 1.188 * | 1.684 * | 8 |
| 2182 | travel orbit | 3.871e+0 | 0.132 | 0.017 | 0.017 | 0.002 | 0.000 | 0.000 | 4.379 | 1.977 * | 2.587 * | 8 |
| 2183 | travel orbit | 3.901e+0 | 0.122 | 0.010 | 0.009 | 0.002 | 0.000 | 0.000 | 7.281 | 2.902 * | 3.567 * | 8 |
| 2184 | travel orbit | 3.931e+0 | 0.123 | 0.002 | 0.012 | 0.002 | 0.000 | 0.000 | 11.143 | 3.862 * | 4.509 * | 8 |
| 2185 | travel orbit | 3.967e+0 | 0.143 | 0.020 | 0.035 | 0.002 | 0.000 | 0.000 | 15.883 | 4.740 * | 5.298 * | 8 |
| 2186 | travel orbit | 4.014e+0 | 0.188 | 0.045 | 0.064 | 0.002 | 0.000 | 0.000 | 21.320 | 5.437 * | 5.868 * | 8 |

## pictures

Tier draft, rate 2, 10.59 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

The dive is joined from 2 parts: /home/user/workspace/work/p6/he9/01/earth-dive-p1of2 (capture frames 3636 to 3749, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/he9/02/earth-dive-p2of2 (capture frames 3750 to 3863, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

The rise is joined from 2 parts: /home/user/workspace/work/p6/he9/03/earth-rise-p1of2 (capture frames 4176 to 4274, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/he9/04/earth-rise-p2of2 (capture frames 4275 to 4373, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

### dive (earth.dive, frames 1830 to 1919, window 1818 to 1931, 228 draft frames at rate 2)

Largest level step: 0.19 at frame 1878 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.05 from frame 1864 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 4.67 from frame 1847 to the next, block column 15 row 1 from the top left, shown, not judged.
Largest change in place: 47.9 from frame 1896 to 8 film frames later, most at pixel 800, 216 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.39 from frame 1899 + 1/2 to 8 film frames later, most at pixel 1206, 938, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 1920 to 1931 + 1/2): change 1.6, pattern 0.02.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 1862 in /home/user/workspace/work/p6/he9/01/earth-dive-p1of2-pops.png, frame 1862 + 1/2 in /home/user/workspace/work/p6/he9/01/earth-dive-p1of2-pops.png, frame 1864 in /home/user/workspace/work/p6/he9/01/earth-dive-p1of2-pops.png, frame 1865 + 1/2 in /home/user/workspace/work/p6/he9/01/earth-dive-p1of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 1858 in no panel (a slice --frames 3716-3716 draws it), frame 1879 in /home/user/workspace/work/p6/he9/02/earth-dive-p2of2-changes.png, frame 1891 + 1/2 in /home/user/workspace/work/p6/he9/02/earth-dive-p2of2-changes.png, frame 1899 + 1/2 in /home/user/workspace/work/p6/he9/02/earth-dive-p2of2-changes.png.

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1818 | 44.47 |  | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 8,2 | 1.4 | 1.7 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1818 + 1/2 | 44.48 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 10,2 | 1.4 | 1.7 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1819 | 44.49 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 10,2 | 1.5 | 1.8 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1819 + 1/2 | 44.50 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 0,3 | 1.4 | 1.8 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1820 | 44.51 | 0.00 | 0.1 | 0.46 | 0.46 | 1.01 | 1.01 | 1.01 | 0.000 | 1.15 | 6,7 | 1.4 | 1.7 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1820 + 1/2 | 44.52 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 0,3 | 1.4 | 1.8 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1821 | 44.52 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 7,5 | 1.4 | 1.7 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1821 + 1/2 | 44.53 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 15,6 | 1.4 | 1.8 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1822 | 44.54 | 0.00 | 0.1 | 0.46 | 0.46 | 1.01 | 1.01 | 1.01 | 0.000 | 1.09 | 6,4 | 1.4 | 1.7 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1822 + 1/2 | 44.54 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 3,4 | 1.4 | 1.7 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1823 | 44.55 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 8,7 | 1.4 | 1.8 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1823 + 1/2 | 44.56 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 5,4 | 1.4 | 1.7 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1824 | 44.56 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 6,4 | 1.4 | 1.8 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1824 + 1/2 | 44.57 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 2,1 | 1.4 | 1.8 | 0.30 | 0.00 | 0.30 | 8.0 |
| 1825 | 44.58 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 5,5 | 1.4 | 1.9 | 0.30 | 0.00 | 0.30 | 8.1 |
| 1825 + 1/2 | 44.59 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 6,7 | 1.5 | 2.0 | 0.30 | 0.01 | 0.30 | 8.1 |
| 1826 | 44.60 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 6,4 | 1.6 | 2.6 | 0.30 | 0.01 | 0.30 | 8.1 |
| 1826 + 1/2 | 44.60 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 13,7 | 1.8 | 3.9 | 0.30 | 0.02 | 0.30 | 8.2 |
| 1827 | 44.61 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 5,4 | 1.9 | 3.7 | 0.30 | 0.02 | 0.30 | 8.2 |
| 1827 + 1/2 | 44.62 | 0.00 | 0.1 | 0.46 | 0.46 | 0.99 | 0.99 | 0.99 | 0.000 | 1.05 | 11,1 | 2.2 | 5.5 | 0.30 | 0.04 | 0.30 | 8.2 |
| 1828 | 44.63 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 6,6 | 2.6 | 5.8 | 0.30 | 0.05 | 0.30 | 8.3 |
| 1828 + 1/2 | 44.64 | 0.00 | 0.1 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 11,8 | 3.0 | 7.4 | 0.30 | 0.06 | 0.30 | 8.3 |
| 1829 | 44.64 | 0.00 | 0.1 | 0.46 | 0.46 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 11,8 | 3.4 | 8.1 | 0.30 | 0.08 | 0.30 | 8.4 |
| 1829 + 1/2 | 44.65 | 0.00 | 0.1 | 0.46 | 0.46 | 0.99 | 0.99 | 0.99 | 0.000 | 1.06 | 14,8 | 3.8 | 8.2 | 0.30 | 0.09 | 0.30 | 8.5 |
| 1830 first | 44.65 | 0.00 | 0.1 | 0.46 | 0.47 | 0.98 | 0.98 | 0.98 | 0.000 | 1.03 | 13,3 | 4.3 | 7.4 | 0.30 | 0.06 | 0.30 | 8.0 |
| 1830 + 1/2 | 44.66 | 0.00 | 0.2 | 0.48 | 0.50 | 0.96 | 0.96 | 0.96 | 0.000 | 1.03 | 12,2 | 4.6 | 9.0 | 0.30 | 0.05 | 0.30 | 8.0 |
| 1831 | 44.67 | 0.00 | 0.2 | 0.53 | 0.56 | 0.95 | 0.95 | 0.95 | 0.000 | 1.09 | 12,6 | 5.0 | 9.3 | 0.30 | 0.06 | 0.30 | 8.1 |
| 1831 + 1/2 | 44.69 | 0.01 | 0.3 | 0.64 | 0.67 | 0.96 | 0.96 | 0.96 | 0.000 | 1.09 | 11,2 | 5.3 | 8.6 | 0.30 | 0.06 | 0.30 | 8.1 |
| 1832 | 44.73 | 0.01 | 0.4 | 0.80 | 0.82 | 0.98 | 0.98 | 0.98 | 0.000 | 1.30 | 11,2 | 5.6 | 8.2 | 0.30 | 0.06 | 0.30 | 8.1 |
| 1832 + 1/2 | 44.77 | 0.01 | 0.6 | 1.01 | 1.01 | 0.99 | 0.99 | 0.99 | 0.000 | 1.53 | 11,2 | 5.9 | 9.0 | 0.30 | 0.06 | 0.30 | 8.2 |
| 1833 | 44.84 | 0.01 | 0.8 | 1.22 | 1.22 | 1.00 | 1.00 | 1.00 | 0.000 | 1.69 | 11,2 | 6.1 | 9.7 | 0.30 | 0.07 | 0.30 | 8.5 |
| 1833 + 1/2 | 44.93 | 0.02 | 1.1 | 1.43 | 1.41 | 1.01 | 1.01 | 1.01 | 0.000 | 1.86 | 11,2 | 6.5 | 10.1 | 0.30 | 0.07 | 0.30 | 8.6 |
| 1834 | 45.04 | 0.01 | 1.3 | 1.61 | 1.59 | 1.01 | 1.01 | 1.01 | 0.000 | 1.91 | 11,2 | 6.9 | 10.9 | 0.30 | 0.08 | 0.30 | 8.6 |
| 1834 + 1/2 | 45.18 | 0.01 | 1.6 | 1.75 | 1.73 | 1.01 | 1.01 | 1.01 | 0.000 | 1.92 | 11,2 | 7.3 | 11.3 | 0.31 | 0.09 | 0.30 | 8.7 |
| 1835 | 45.35 | 0.01 | 1.9 | 1.86 | 1.86 | 1.00 | 1.00 | 1.00 | 0.000 | 1.85 | 11,2 | 7.7 | 11.8 | 0.31 | 0.09 | 0.31 | 8.7 |
| 1835 + 1/2 | 45.54 | 0.01 | 2.0 | 1.96 | 1.95 | 1.00 | 1.00 | 1.00 | 0.000 | 1.74 | 10,6 | 8.0 | 12.4 | 0.31 | 0.10 | 0.31 | 8.7 |
| 1836 | 45.76 | 0.01 | 2.2 | 2.03 | 2.01 | 1.01 | 1.01 | 1.01 | 0.000 | 1.86 | 14,0 | 8.3 | 12.4 | 0.31 | 0.11 | 0.31 | 8.8 |
| 1836 + 1/2 | 46.01 | 0.01 | 2.5 | 2.06 | 2.06 | 1.00 | 1.00 | 1.00 | 0.001 | 1.63 | 10,6 | 8.6 | 12.7 | 0.31 | 0.12 | 0.31 | 8.8 |
| 1837 | 46.28 | 0.02 | 2.8 | 2.09 | 2.08 | 1.00 | 1.01 | 1.00 | 0.006 | 1.67 | 10,6 | 8.8 | 12.9 | 0.32 | 0.13 | 0.31 | 8.8 |
| 1837 + 1/2 | 46.58 | 0.01 | 2.9 | 2.10 | 2.09 | 1.01 | 1.00 | 1.00 | 0.009 | 1.59 | 10,6 | 8.9 | 12.6 | 0.32 | 0.13 | 0.31 | 8.9 |
| 1838 | 46.92 | 0.01 | 3.3 | 2.10 | 2.09 | 1.00 | 1.00 | 1.00 | 0.010 | 1.54 | 5,3 | 8.9 | 12.5 | 0.32 | 0.14 | 0.32 | 8.9 |
| 1838 + 1/2 | 47.28 | 0.02 | 3.4 | 2.09 | 2.10 | 1.00 | 1.00 | 1.00 | 0.010 | 1.53 | 10,6 | 9.0 | 12.5 | 0.32 | 0.14 | 0.32 | 8.9 |
| 1839 | 47.67 | 0.02 | 3.6 | 2.09 | 2.11 | 0.99 | 0.99 | 0.99 | 0.008 | 1.39 | 6,4 | 9.1 | 12.7 | 0.33 | 0.15 | 0.32 | 9.0 |
| 1839 + 1/2 | 48.09 | 0.01 | 3.9 | 2.12 | 2.12 | 1.00 | 1.01 | 1.00 | 0.009 | 1.44 | 14,1 | 9.1 | 12.7 | 0.33 | 0.15 | 0.33 | 9.1 |
| 1840 | 48.55 | 0.02 | 4.1 | 2.13 | 2.15 | 0.99 | 0.99 | 0.99 | 0.010 | 1.55 | 14,1 | 9.2 | 12.8 | 0.33 | 0.16 | 0.36 | 8.0 |
| 1840 + 1/2 | 49.03 | 0.02 | 4.3 | 2.17 | 2.16 | 1.01 | 1.01 | 1.01 | 0.010 | 1.58 | 14,1 | 9.5 | 13.1 | 0.33 | 0.18 | 0.38 | 8.0 |
| 1841 | 49.56 | 0.01 | 4.6 | 2.18 | 2.19 | 1.00 | 1.00 | 1.00 | 0.006 | 1.57 | 14,1 | 9.8 | 13.6 | 0.34 | 0.19 | 0.40 | 8.0 |
| 1841 + 1/2 | 50.11 | 0.01 | 4.8 | 2.21 | 2.20 | 1.00 | 1.00 | 1.00 | 0.006 | 1.56 | 10,7 | 10.3 | 14.0 | 0.34 | 0.19 | 0.42 | 8.0 |
| 1842 | 50.68 | 0.01 | 4.9 | 2.22 | 2.22 | 1.00 | 1.00 | 1.00 | 0.007 | 1.78 | 10,7 | 10.9 | 16.5 | 0.34 | 0.18 | 0.44 | 8.0 |
| 1842 + 1/2 | 51.28 | 0.01 | 5.2 | 2.24 | 2.24 | 1.00 | 1.00 | 1.00 | 0.007 | 1.73 | 10,7 | 11.6 | 16.7 | 0.35 | 0.16 | 0.46 | 8.0 |
| 1843 | 51.92 | 0.01 | 5.4 | 2.27 | 2.25 | 1.01 | 1.01 | 1.01 | 0.006 | 1.79 | 10,7 | 12.5 | 17.9 | 0.35 | 0.19 | 0.47 | 8.0 |
| 1843 + 1/2 | 52.57 | 0.02 | 5.7 | 2.27 | 2.27 | 1.00 | 1.00 | 1.00 | 0.007 | 1.75 | 15,1 | 13.7 | 18.3 | 0.35 | 0.22 | 0.49 | 8.0 |
| 1844 | 53.26 | 0.01 | 5.9 | 2.26 | 2.27 | 1.00 | 1.00 | 1.00 | 0.009 | 2.08 | 15,1 | 15.2 | 19.1 | 0.36 | 0.25 | 0.51 | 8.0 |
| 1844 + 1/2 | 53.97 | 0.01 | 6.2 | 2.27 | 2.28 | 1.00 | 1.00 | 1.00 | 0.005 | 2.39 | 15,1 | 16.4 | 21.0 | 0.36 | 0.27 | 0.52 | 8.0 |
| 1845 | 54.70 | 0.01 | 6.4 | 2.29 | 2.29 | 1.00 | 1.00 | 1.00 | 0.005 | 2.88 | 15,1 | 17.3 | 23.7 | 0.36 | 0.29 | 0.54 | 8.0 |
| 1845 + 1/2 | 55.46 | 0.01 | 6.6 | 2.31 | 2.31 | 1.00 | 1.00 | 1.00 | 0.003 | 4.13 | 15,1 | 18.1 | 24.5 | 0.37 | 0.29 | 0.56 | 8.0 |
| 1846 | 56.23 | 0.00 | 6.9 | 2.35 | 2.32 | 1.01 | 1.02 | 1.01 | 0.004 | 4.17 | 15,1 | 18.9 | 25.0 | 0.37 | 0.28 | 0.57 | 8.0 |
| 1846 + 1/2 | 57.01 | 0.01 | 7.1 | 2.34 | 2.36 | 0.99 | 0.99 | 0.99 | 0.013 | 3.55 | 15,1 | 19.6 | 24.8 | 0.38 | 0.25 | 0.59 | 8.0 |
| 1847 | 57.81 | 0.01 | 7.4 | 2.36 | 2.36 | 1.00 | 1.00 | 1.00 | 0.012 | 4.67 | 15,1 | 20.1 | 25.6 | 0.38 | 0.29 | 0.60 | 8.0 |
| 1847 + 1/2 | 58.63 | 0.01 | 7.6 | 2.36 | 2.37 | 1.00 | 1.00 | 1.00 | 0.014 | 3.50 | 15,1 | 20.9 | 26.2 | 0.38 | 0.26 | 0.62 | 8.0 |
| 1848 | 59.46 | 0.00 | 7.9 | 2.37 | 2.38 | 1.00 | 1.00 | 1.00 | 0.014 | 3.21 | 15,1 | 21.5 | 27.6 | 0.39 | 0.28 | 0.64 | 8.0 |
| 1848 + 1/2 | 60.30 | 0.00 | 8.2 | 2.39 | 2.40 | 0.99 | 1.00 | 0.99 | 0.023 | 2.96 | 15,1 | 21.7 | 30.4 | 0.39 | 0.27 | 0.66 | 8.0 |
| 1849 | 61.13 | 0.00 | 8.5 | 2.43 | 2.44 | 1.00 | 0.99 | 0.99 | 0.032 | 1.93 | 11,7 | 22.0 | 31.9 | 0.40 | 0.26 | 0.67 | 8.0 |
| 1849 + 1/2 | 61.97 | 0.00 | 8.8 | 2.49 | 2.51 | 0.99 | 0.99 | 0.99 | 0.024 | 2.20 | 10,8 | 22.3 | 33.4 | 0.40 | 0.24 | 0.69 | 8.0 |
| 1850 | 62.81 | 0.01 | 9.1 | 2.59 | 2.56 | 1.01 | 1.01 | 1.01 | 0.035 | 2.43 | 11,8 | 23.1 | 34.0 | 0.40 | 0.23 | 0.70 | 8.0 |
| 1850 + 1/2 | 63.63 | 0.02 | 9.4 | 2.64 | 2.64 | 1.00 | 1.01 | 1.00 | 0.047 | 2.48 | 11,8 | 24.0 | 34.8 | 0.40 | 0.24 | 0.40 | 8.4 |
| 1851 | 64.41 | 0.01 | 9.9 | 2.70 | 2.67 | 1.01 | 1.02 | 1.01 | 0.049 | 2.51 | 11,8 | 24.8 | 35.1 | 0.40 | 0.24 | 0.40 | 8.6 |
| 1851 + 1/2 | 65.17 | 0.01 | 10.4 | 2.72 | 2.70 | 1.01 | 1.02 | 1.01 | 0.043 | 2.26 | 11,8 | 25.8 | 35.4 | 0.40 | 0.25 | 0.40 | 8.5 |
| 1852 | 65.92 | 0.00 | 10.4 | 2.72 | 2.71 | 1.00 | 1.00 | 1.00 | 0.071 | 1.98 | 12,7 | 26.9 | 36.6 | 0.40 | 0.25 | 0.40 | 8.4 |
| 1852 + 1/2 | 66.67 | 0.03 | 10.9 | 2.72 | 2.72 | 1.00 | 1.01 | 1.00 | 0.052 | 2.23 | 14,7 | 28.9 | 38.8 | 0.40 | 0.25 | 0.40 | 8.0 |
| 1853 | 67.47 | 0.02 | 11.3 | 2.70 | 2.74 | 0.99 | 0.97 | 0.97 | 0.079 | 2.03 | 11,3 | 30.4 | 40.3 | 0.40 | 0.28 | 0.40 | 8.0 |
| 1853 + 1/2 | 68.32 | 0.04 | 11.8 | 2.75 | 2.75 | 1.00 | 0.99 | 0.99 | 0.065 | 2.36 | 14,8 | 32.1 | 41.0 | 0.40 | 0.28 | 0.40 | 8.0 |
| 1854 | 69.25 | 0.03 | 12.2 | 2.78 | 2.79 | 1.00 | 1.00 | 1.00 | 0.061 | 2.35 | 15,6 | 34.0 | 41.8 | 0.40 | 0.28 | 0.40 | 8.0 |
| 1854 + 1/2 | 70.24 | 0.02 | 12.7 | 2.85 | 2.81 | 1.02 | 1.03 | 1.02 | 0.054 | 2.35 | 15,7 | 34.5 | 43.6 | 0.40 | 0.27 | 0.40 | 8.0 |
| 1855 | 71.27 | 0.01 | 13.1 | 2.83 | 2.84 | 1.00 | 1.01 | 1.00 | 0.043 | 2.48 | 15,8 | 36.8 | 46.4 | 0.40 | 0.24 | 0.40 | 8.0 |
| 1855 + 1/2 | 72.33 | 0.01 | 13.3 | 2.83 | 2.85 | 0.99 | 0.99 | 0.99 | 0.037 | 2.75 | 15,8 | 38.5 | 49.4 | 0.40 | 0.21 | 0.40 | 8.0 |
| 1856 | 73.37 | 0.01 | 13.9 | 2.85 | 2.86 | 1.00 | 0.98 | 0.98 | 0.079 | 1.92 | 1,2 | 38.8 | 48.1 | 0.40 | 0.22 | 0.40 | 8.0 |
| 1856 + 1/2 | 74.41 | 0.01 | 14.2 | 2.87 | 2.89 | 0.99 | 0.99 | 0.99 | 0.052 | 2.49 | 15,3 | 38.6 | 47.0 | 0.40 | 0.21 | 0.40 | 9.0 |
| 1857 | 75.42 | 0.01 | 14.6 | 2.94 | 2.95 | 1.00 | 1.00 | 1.00 | 0.049 | 2.89 | 15,3 | 39.5 | 48.3 | 0.40 | 0.20 | 0.40 | 8.0 |
| 1857 + 1/2 | 76.40 | 0.01 | 15.1 | 3.02 | 2.99 | 1.01 | 1.01 | 1.01 | 0.052 | 2.80 | 15,3 | 39.4 | 50.8 | 0.40 | 0.21 | 0.40 | 8.0 |
| 1858 | 77.40 | 0.02 | 15.3 | 3.05 | 3.04 | 1.00 | 1.00 | 1.00 | 0.054 | 2.31 | 12,3 | 40.2 | 51.7 | 0.40 | 0.21 | 0.40 | 8.0 |
| 1858 + 1/2 | 78.43 | 0.03 | 15.5 | 3.07 | 3.08 | 1.00 | 1.00 | 1.00 | 0.035 | 2.92 | 12,3 | 38.9 | 52.6 | 0.40 | 0.20 | 0.40 | 8.0 |
| 1859 | 79.52 | 0.04 | 15.7 | 3.10 | 3.09 | 1.00 | 1.00 | 1.00 | 0.035 | 2.79 | 12,3 | 37.0 | 51.3 | 0.40 | 0.20 | 0.40 | 8.0 |
| 1859 + 1/2 | 80.70 | 0.05 | 16.0 | 3.12 | 3.10 | 1.01 | 1.00 | 1.00 | 0.039 | 2.67 | 12,3 | 35.5 | 48.8 | 0.40 | 0.20 | 0.40 | 8.0 |
| 1860 | 81.97 | 0.03 | 16.4 | 3.16 | 3.10 | 1.02 | 1.02 | 1.02 | 0.033 | 2.33 | 9,8 | 35.6 | 47.7 | 0.40 | 0.21 | 0.40 | 8.0 |
| 1860 + 1/2 | 83.32 | 0.03 | 16.7 | 3.21 | 3.10 | 1.04 | 1.04 | 1.04 | 0.035 | 2.32 | 9,8 | 36.2 | 48.3 | 0.41 | 0.20 | 0.40 | 8.0 |
| 1861 | 84.60 | 0.04 | 16.8 | 3.22 | 3.10 | 1.04 | 1.04 | 1.04 | 0.045 | 2.99 | 13,3 | 35.0 | 49.0 | 0.40 | 0.20 | 0.89 | 8.0 |
| 1861 + 1/2 | 85.81 | 0.03 | 17.2 | 3.22 | 3.10 | 1.04 | 1.02 | 1.02 | 0.052 | 3.10 | 13,3 | 33.6 | 48.7 | 0.40 | 0.22 | 0.90 | 8.0 |
| 1862 | 86.95 | 0.07 | 17.3 | 3.25 | 3.10 | 1.05 | 1.05 | 1.05 | 0.040 | 3.15 | 13,3 | 27.8 | 43.5 | 0.40 | 0.23 | 0.90 | 8.0 |
| 1862 + 1/2 | 87.95 | 0.10 | 17.6 | 3.32 | 3.10 | 1.07 | 1.05 | 1.05 | 0.051 | 2.94 | 15,5 | 24.8 | 46.5 | 0.41 | 0.24 | 0.90 | 8.0 |
| 1863 | 88.75 | 0.19 | 17.6 | 3.28 | 3.10 | 1.06 | 1.04 | 1.04 | 0.048 | 3.27 | 15,5 | 21.8 | 25.6 | 0.41 | 0.24 | 0.90 | 8.0 |
| 1863 + 1/2 | 89.18 | 0.18 | 17.4 | 3.24 | 3.10 | 1.05 | 1.04 | 1.04 | 0.046 | 2.95 | 14,3 | 22.4 | 27.7 | 0.41 | 0.23 | 0.90 | 8.0 |
| 1864 | 89.25 | 0.01 | 17.3 | 3.27 | 3.10 | 1.06 | 1.05 | 1.05 | 0.032 | 3.20 | 14,3 | 22.8 | 30.0 | 0.41 | 0.22 | 0.90 | 8.0 |
| 1864 + 1/2 | 89.29 | 0.10 | 17.3 | 3.22 | 3.10 | 1.04 | 1.03 | 1.03 | 0.043 | 3.07 | 14,3 | 23.0 | 32.2 | 0.41 | 0.22 | 0.41 | 13.2 |
| 1865 | 89.53 | 0.03 | 17.2 | 3.20 | 3.10 | 1.03 | 1.04 | 1.03 | 0.038 | 2.58 | 14,4 | 23.1 | 34.5 | 0.42 | 0.22 | 0.41 | 13.1 |
| 1865 + 1/2 | 89.84 | 0.03 | 17.2 | 3.23 | 3.10 | 1.04 | 1.05 | 1.04 | 0.035 | 2.82 | 14,4 | 23.5 | 36.8 | 0.42 | 0.22 | 0.42 | 8.0 |
| 1866 | 90.21 | 0.02 | 17.2 | 3.19 | 3.10 | 1.03 | 1.03 | 1.03 | 0.040 | 3.07 | 15,5 | 24.2 | 39.2 | 0.42 | 0.21 | 0.42 | 8.0 |
| 1866 + 1/2 | 90.63 | 0.13 | 17.2 | 3.19 | 3.10 | 1.03 | 1.04 | 1.03 | 0.023 | 3.18 | 15,5 | 24.7 | 41.1 | 0.42 | 0.19 | 0.42 | 8.0 |
| 1867 | 90.79 | 0.07 | 17.2 | 3.14 | 3.10 | 1.02 | 1.02 | 1.02 | 0.029 | 4.35 | 15,4 | 25.4 | 43.1 | 0.43 | 0.18 | 0.42 | 12.9 |
| 1867 + 1/2 | 90.80 | 0.06 | 17.2 | 3.09 | 3.09 | 1.00 | 1.01 | 1.00 | 0.021 | 3.20 | 15,4 | 26.2 | 45.4 | 0.43 | 0.17 | 0.43 | 12.8 |
| 1868 | 90.70 | 0.08 | 17.2 | 3.07 | 3.05 | 1.01 | 1.01 | 1.01 | 0.022 | 2.62 | 15,4 | 26.4 | 47.3 | 0.43 | 0.16 | 0.43 | 12.8 |
| 1868 + 1/2 | 90.43 | 0.03 | 17.0 | 3.00 | 3.02 | 0.99 | 0.99 | 0.99 | 0.041 | 2.68 | 13,7 | 26.9 | 48.6 | 0.44 | 0.15 | 0.43 | 8.0 |
| 1869 | 90.09 | 0.07 | 17.0 | 2.98 | 2.97 | 1.00 | 1.01 | 1.00 | 0.030 | 2.78 | 13,7 | 27.3 | 49.8 | 0.44 | 0.15 | 0.44 | 8.0 |
| 1869 + 1/2 | 89.90 | 0.01 | 16.9 | 2.94 | 2.94 | 1.00 | 0.99 | 0.99 | 0.034 | 2.33 | 12,8 | 27.6 | 50.7 | 0.45 | 0.14 | 0.44 | 8.0 |
| 1870 | 89.73 | 0.07 | 16.9 | 2.91 | 2.92 | 1.00 | 1.00 | 1.00 | 0.019 | 2.33 | 10,7 | 28.2 | 51.2 | 0.45 | 0.14 | 0.44 | 8.0 |
| 1870 + 1/2 | 89.70 | 0.09 | 16.8 | 2.90 | 2.91 | 1.00 | 0.99 | 0.99 | 0.030 | 2.81 | 13,8 | 29.0 | 51.4 | 0.45 | 0.15 | 0.45 | 8.0 |
| 1871 | 89.84 | 0.02 | 16.7 | 2.91 | 2.89 | 1.01 | 1.01 | 1.01 | 0.026 | 3.59 | 14,8 | 30.0 | 51.4 | 0.46 | 0.16 | 0.45 | 8.0 |
| 1871 + 1/2 | 90.03 | 0.04 | 16.7 | 2.87 | 2.87 | 1.00 | 1.00 | 1.00 | 0.033 | 2.85 | 14,8 | 31.0 | 51.4 | 0.46 | 0.17 | 0.45 | 8.0 |
| 1872 | 90.15 | 0.01 | 16.6 | 2.84 | 2.84 | 1.00 | 0.99 | 0.99 | 0.037 | 2.61 | 14,8 | 31.7 | 51.0 | 0.46 | 0.18 | 0.46 | 8.0 |
| 1872 + 1/2 | 90.25 | 0.15 | 16.5 | 2.81 | 2.82 | 1.00 | 1.00 | 1.00 | 0.028 | 2.06 | 14,6 | 32.6 | 50.7 | 0.46 | 0.19 | 0.46 | 8.0 |
| 1873 | 90.05 | 0.14 | 16.5 | 2.79 | 2.80 | 1.00 | 1.00 | 1.00 | 0.027 | 2.46 | 13,4 | 33.6 | 49.9 | 0.47 | 0.19 | 0.46 | 8.0 |
| 1873 + 1/2 | 89.56 | 0.01 | 16.5 | 2.78 | 2.78 | 1.00 | 1.00 | 1.00 | 0.027 | 2.30 | 13,4 | 34.4 | 48.8 | 0.47 | 0.20 | 0.47 | 8.0 |
| 1874 | 89.06 | 0.05 | 16.4 | 2.76 | 2.78 | 1.00 | 1.00 | 1.00 | 0.026 | 2.58 | 13,4 | 35.1 | 47.9 | 0.47 | 0.21 | 0.47 | 8.0 |
| 1874 + 1/2 | 88.46 | 0.14 | 16.3 | 2.77 | 2.76 | 1.00 | 1.00 | 1.00 | 0.035 | 2.32 | 11,8 | 34.7 | 46.9 | 0.47 | 0.18 | 0.47 | 8.0 |
| 1875 | 88.15 | 0.02 | 16.3 | 2.76 | 2.75 | 1.00 | 1.00 | 1.00 | 0.026 | 2.21 | 14,7 | 34.0 | 45.8 | 0.48 | 0.17 | 0.47 | 8.0 |
| 1875 + 1/2 | 87.79 | 0.14 | 16.3 | 2.74 | 2.72 | 1.00 | 1.01 | 1.00 | 0.020 | 2.33 | 4,5 | 34.3 | 44.5 | 0.48 | 0.19 | 0.48 | 8.0 |
| 1876 | 87.72 | 0.12 | 16.1 | 2.68 | 2.69 | 1.00 | 1.00 | 1.00 | 0.018 | 2.34 | 4,5 | 33.2 | 43.2 | 0.48 | 0.21 | 0.48 | 8.0 |
| 1876 + 1/2 | 87.41 | 0.07 | 16.0 | 2.65 | 2.66 | 1.00 | 0.99 | 0.99 | 0.025 | 2.43 | 4,5 | 32.4 | 41.7 | 0.48 | 0.23 | 0.48 | 8.0 |
| 1877 | 86.95 | 0.05 | 16.0 | 2.64 | 2.65 | 1.00 | 1.00 | 1.00 | 0.026 | 2.39 | 4,5 | 32.1 | 40.2 | 0.49 | 0.24 | 0.48 | 8.0 |
| 1877 + 1/2 | 86.60 | 0.07 | 16.0 | 2.55 | 2.65 | 0.96 | 0.97 | 0.96 | 0.007 | 2.78 | 15,5 | 31.9 | 38.8 | 0.49 | 0.26 | 0.49 | 8.0 |
| 1878 | 86.39 | 0.19 | 15.8 | 2.57 | 2.65 | 0.97 | 0.98 | 0.97 | 0.016 | 2.73 | 15,5 | 31.8 | 38.9 | 0.49 | 0.27 | 0.49 | 8.0 |
| 1878 + 1/2 | 86.57 | 0.01 | 15.8 | 2.53 | 2.65 | 0.96 | 0.96 | 0.96 | 0.016 | 2.48 | 11,6 | 32.0 | 40.4 | 0.49 | 0.28 | 0.49 | 8.0 |
| 1879 | 86.72 | 0.16 | 15.8 | 2.50 | 2.65 | 0.94 | 0.95 | 0.94 | 0.018 | 2.66 | 11,6 | 31.9 | 40.4 | 0.50 | 0.30 | 0.49 | 8.0 |
| 1879 + 1/2 | 87.19 | 0.01 | 15.8 | 2.52 | 2.65 | 0.95 | 0.97 | 0.95 | 0.011 | 2.68 | 11,6 | 32.0 | 39.8 | 0.50 | 0.29 | 0.49 | 8.0 |
| 1880 | 87.64 | 0.00 | 15.7 | 2.50 | 2.65 | 0.94 | 0.96 | 0.94 | 0.005 | 2.29 | 11,6 | 31.7 | 36.5 | 0.50 | 0.29 | 0.50 | 8.0 |
| 1880 + 1/2 | 88.10 | 0.04 | 15.5 | 2.49 | 2.65 | 0.94 | 0.96 | 0.94 | 0.003 | 2.25 | 3,5 | 31.9 | 36.7 | 0.51 | 0.28 | 0.50 | 8.0 |
| 1881 | 88.49 | 0.15 | 15.5 | 2.49 | 2.64 | 0.94 | 0.96 | 0.94 | 0.006 | 2.33 | 3,5 | 32.7 | 38.3 | 0.51 | 0.27 | 0.50 | 8.0 |
| 1881 + 1/2 | 88.59 | 0.02 | 15.5 | 2.50 | 2.64 | 0.94 | 0.95 | 0.94 | 0.019 | 2.31 | 3,5 | 33.0 | 40.5 | 0.51 | 0.26 | 0.50 | 8.0 |
| 1882 | 88.72 | 0.01 | 15.4 | 2.48 | 2.64 | 0.94 | 0.95 | 0.94 | 0.012 | 2.33 | 12,6 | 33.7 | 38.3 | 0.51 | 0.27 | 0.51 | 8.0 |
| 1882 + 1/2 | 88.88 | 0.05 | 15.4 | 2.53 | 2.64 | 0.96 | 0.97 | 0.96 | 0.018 | 2.55 | 12,7 | 34.6 | 38.7 | 0.51 | 0.27 | 0.51 | 8.0 |
| 1883 | 89.13 | 0.03 | 15.3 | 2.55 | 2.63 | 0.97 | 0.96 | 0.96 | 0.032 | 2.59 | 12,7 | 35.8 | 39.8 | 0.51 | 0.23 | 0.51 | 8.9 |
| 1883 + 1/2 | 89.46 | 0.08 | 15.3 | 2.59 | 2.63 | 0.99 | 1.00 | 0.99 | 0.013 | 2.57 | 2,5 | 36.8 | 40.9 | 0.51 | 0.20 | 0.51 | 8.9 |
| 1884 | 89.62 | 0.06 | 15.3 | 2.60 | 2.62 | 1.00 | 1.00 | 1.00 | 0.019 | 2.55 | 2,5 | 37.6 | 42.2 | 0.51 | 0.21 | 0.51 | 8.8 |
| 1884 + 1/2 | 89.67 | 0.01 | 15.2 | 2.62 | 2.60 | 1.01 | 1.00 | 1.00 | 0.036 | 2.48 | 2,5 | 38.1 | 43.4 | 0.51 | 0.22 | 0.51 | 8.6 |
| 1885 | 89.70 | 0.01 | 15.1 | 2.65 | 2.58 | 1.03 | 1.01 | 1.01 | 0.035 | 3.56 | 13,7 | 39.0 | 44.7 | 0.51 | 0.22 | 0.51 | 8.5 |
| 1885 + 1/2 | 89.75 | 0.11 | 15.1 | 2.70 | 2.57 | 1.05 | 1.04 | 1.04 | 0.028 | 4.12 | 13,7 | 40.1 | 46.5 | 0.51 | 0.20 | 0.51 | 8.3 |
| 1886 | 90.03 | 0.08 | 15.1 | 2.65 | 2.57 | 1.03 | 1.03 | 1.03 | 0.026 | 3.62 | 13,7 | 41.2 | 48.0 | 0.52 | 0.20 | 0.51 | 8.2 |
| 1886 + 1/2 | 90.16 | 0.11 | 15.0 | 2.67 | 2.56 | 1.04 | 1.03 | 1.03 | 0.039 | 2.73 | 13,8 | 42.2 | 48.2 | 0.52 | 0.21 | 0.52 | 8.0 |
| 1887 | 90.07 | 0.07 | 15.0 | 2.65 | 2.56 | 1.03 | 1.03 | 1.03 | 0.029 | 2.39 | 1,5 | 43.1 | 49.4 | 0.52 | 0.20 | 0.51 | 8.0 |
| 1887 + 1/2 | 89.83 | 0.04 | 15.0 | 2.66 | 2.56 | 1.04 | 1.05 | 1.04 | 0.021 | 3.09 | 14,8 | 43.8 | 50.3 | 0.52 | 0.21 | 0.52 | 8.0 |
| 1888 | 89.51 | 0.06 | 15.1 | 2.65 | 2.56 | 1.03 | 1.05 | 1.03 | 0.004 | 3.33 | 14,8 | 44.5 | 51.2 | 0.53 | 0.21 | 0.52 | 8.0 |
| 1888 + 1/2 | 89.30 | 0.01 | 14.9 | 2.66 | 2.56 | 1.04 | 1.05 | 1.04 | 0.023 | 2.98 | 15,8 | 45.0 | 52.4 | 0.53 | 0.21 | 0.53 | 8.2 |
| 1889 | 89.12 | 0.04 | 15.0 | 2.64 | 2.56 | 1.03 | 1.04 | 1.03 | 0.016 | 4.20 | 15,8 | 45.6 | 53.0 | 0.53 | 0.22 | 0.53 | 8.2 |
| 1889 + 1/2 | 88.86 | 0.06 | 14.8 | 2.67 | 2.56 | 1.04 | 1.05 | 1.04 | 0.020 | 4.53 | 15,8 | 45.9 | 53.8 | 0.53 | 0.22 | 0.53 | 8.1 |
| 1890 | 88.48 | 0.06 | 14.7 | 2.63 | 2.56 | 1.03 | 1.03 | 1.03 | 0.022 | 4.18 | 15,8 | 46.2 | 54.2 | 0.54 | 0.22 | 0.53 | 8.1 |
| 1890 + 1/2 | 88.22 | 0.00 | 14.6 | 2.64 | 2.56 | 1.03 | 1.04 | 1.03 | 0.015 | 3.57 | 15,8 | 46.3 | 54.5 | 0.54 | 0.24 | 0.54 | 8.0 |
| 1891 | 87.97 | 0.04 | 14.4 | 2.61 | 2.56 | 1.02 | 1.02 | 1.02 | 0.016 | 2.33 | 15,8 | 46.7 | 54.6 | 0.54 | 0.26 | 0.54 | 8.0 |
| 1891 + 1/2 | 87.63 | 0.11 | 14.1 | 2.57 | 2.57 | 1.00 | 1.00 | 1.00 | 0.026 | 2.37 | 12,0 | 46.9 | 54.7 | 0.55 | 0.28 | 0.54 | 8.0 |
| 1892 | 87.51 | 0.04 | 13.7 | 2.55 | 2.54 | 1.00 | 1.00 | 1.00 | 0.024 | 2.38 | 11,8 | 47.0 | 54.7 | 0.55 | 0.29 | 0.55 | 8.0 |
| 1892 + 1/2 | 87.31 | 0.10 | 13.4 | 2.51 | 2.51 | 1.00 | 1.00 | 1.00 | 0.024 | 2.65 | 11,8 | 47.3 | 54.7 | 0.55 | 0.29 | 0.55 | 8.0 |
| 1893 | 86.90 | 0.04 | 13.2 | 2.48 | 2.48 | 1.00 | 1.00 | 1.00 | 0.022 | 2.38 | 11,8 | 47.4 | 54.5 | 0.56 | 0.29 | 0.55 | 8.0 |
| 1893 + 1/2 | 86.41 | 0.09 | 12.8 | 2.45 | 2.44 | 1.00 | 1.00 | 1.00 | 0.019 | 2.30 | 15,7 | 47.6 | 54.3 | 0.56 | 0.29 | 0.56 | 8.0 |
| 1894 | 85.75 | 0.02 | 12.4 | 2.41 | 2.41 | 1.00 | 1.01 | 1.00 | 0.022 | 2.65 | 15,7 | 47.7 | 54.1 | 0.56 | 0.28 | 0.56 | 8.0 |
| 1894 + 1/2 | 85.11 | 0.04 | 12.3 | 2.36 | 2.37 | 1.00 | 0.99 | 0.99 | 0.031 | 1.99 | 15,7 | 47.8 | 53.9 | 0.56 | 0.29 | 0.56 | 8.0 |
| 1895 | 84.56 | 0.02 | 11.9 | 2.32 | 2.33 | 0.99 | 0.99 | 0.99 | 0.030 | 1.79 | 13,8 | 47.8 | 53.5 | 0.57 | 0.30 | 0.56 | 8.0 |
| 1895 + 1/2 | 84.05 | 0.01 | 11.8 | 2.31 | 2.28 | 1.01 | 1.01 | 1.01 | 0.026 | 2.18 | 13,0 | 47.9 | 53.0 | 0.57 | 0.30 | 0.57 | 8.0 |
| 1896 | 83.53 | 0.02 | 11.4 | 2.25 | 2.27 | 0.99 | 0.99 | 0.99 | 0.032 | 1.64 | 12,7 | 47.9 | 53.2 | 0.57 | 0.31 | 0.57 | 8.0 |
| 1896 + 1/2 | 83.04 | 0.04 | 11.2 | 2.23 | 2.23 | 1.00 | 1.00 | 1.00 | 0.017 | 1.65 | 12,7 | 47.8 | 53.2 | 0.58 | 0.31 | 0.57 | 8.0 |
| 1897 | 82.62 | 0.03 | 10.9 | 2.20 | 2.20 | 1.00 | 1.00 | 1.00 | 0.030 | 2.00 | 13,0 | 47.6 | 53.0 | 0.58 | 0.29 | 0.58 | 8.0 |
| 1897 + 1/2 | 82.27 | 0.02 | 10.5 | 2.17 | 2.18 | 1.00 | 1.00 | 1.00 | 0.021 | 1.55 | 12,7 | 47.1 | 52.4 | 0.58 | 0.29 | 0.58 | 8.0 |
| 1898 | 81.96 | 0.04 | 10.4 | 2.15 | 2.14 | 1.00 | 1.00 | 1.00 | 0.022 | 1.50 | 12,7 | 46.4 | 51.8 | 0.59 | 0.28 | 0.58 | 8.0 |
| 1898 + 1/2 | 81.72 | 0.05 | 10.0 | 2.10 | 2.13 | 0.99 | 0.98 | 0.98 | 0.041 | 1.36 | 10,6 | 45.4 | 50.8 | 0.59 | 0.34 | 0.41 | 8.0 |
| 1899 | 81.57 | 0.08 | 9.7 | 2.11 | 2.10 | 1.01 | 1.01 | 1.01 | 0.001 | 1.83 | 15,8 | 44.0 | 49.6 | 0.59 | 0.33 | 0.40 | 8.0 |
| 1899 + 1/2 | 81.58 | 0.01 | 9.3 | 2.07 | 2.10 | 0.99 | 0.99 | 0.99 | 0.031 | 1.62 | 13,8 | 42.3 | 48.0 | 0.60 | 0.39 | 0.38 | 8.0 |
| 1900 | 81.62 | 0.03 | 9.1 | 2.09 | 2.07 | 1.01 | 1.01 | 1.01 | 0.021 | 1.59 | 13,7 | 40.5 | 46.0 | 0.60 | 0.37 | 0.37 | 8.0 |
| 1900 + 1/2 | 81.60 | 0.01 | 8.9 | 2.06 | 2.07 | 1.00 | 1.00 | 1.00 | 0.027 | 1.80 | 13,8 | 38.8 | 43.7 | 0.60 | 0.38 | 0.36 | 8.0 |
| 1901 | 81.56 | 0.01 | 8.7 | 2.07 | 2.06 | 1.00 | 1.01 | 1.00 | 0.008 | 1.66 | 13,8 | 36.3 | 41.1 | 0.60 | 0.28 | 0.60 | 10.7 |
| 1901 + 1/2 | 81.49 | 0.02 | 8.5 | 2.05 | 2.05 | 1.00 | 1.00 | 1.00 | 0.025 | 1.86 | 13,8 | 33.6 | 38.2 | 0.61 | 0.35 | 0.34 | 8.0 |
| 1902 | 81.38 | 0.01 | 8.1 | 2.03 | 2.05 | 0.99 | 0.99 | 0.99 | 0.014 | 2.12 | 13,8 | 30.5 | 35.0 | 0.61 | 0.26 | 0.32 | 8.0 |
| 1902 + 1/2 | 81.26 | 0.03 | 8.0 | 2.03 | 2.04 | 1.00 | 0.99 | 0.99 | 0.019 | 1.94 | 13,8 | 27.5 | 31.8 | 0.62 | 0.22 | 0.61 | 10.6 |
| 1903 | 81.19 | 0.01 | 7.6 | 2.03 | 2.03 | 1.00 | 1.01 | 1.00 | 0.005 | 1.48 | 9,7 | 24.5 | 28.6 | 0.62 | 0.24 | 0.28 | 8.0 |
| 1903 + 1/2 | 81.15 | 0.02 | 7.4 | 2.04 | 2.03 | 1.01 | 1.01 | 1.01 | 0.017 | 1.67 | 14,8 | 21.5 | 25.4 | 0.63 | 0.20 | 0.26 | 8.0 |
| 1904 | 81.06 | 0.03 | 7.2 | 2.03 | 2.01 | 1.01 | 1.01 | 1.01 | 0.017 | 1.81 | 14,8 | 18.4 | 22.1 | 0.63 | 0.27 | 0.22 | 8.0 |
| 1904 + 1/2 | 81.03 | 0.02 | 6.9 | 2.00 | 2.00 | 1.00 | 1.00 | 1.00 | 0.018 | 1.64 | 14,8 | 15.3 | 18.8 | 0.64 | 0.15 | 0.18 | 8.0 |
| 1905 | 81.04 | 0.02 | 6.7 | 1.97 | 1.97 | 1.00 | 0.99 | 0.99 | 0.022 | 1.67 | 14,8 | 12.5 | 15.6 | 0.64 | 0.20 | 0.16 | 8.0 |
| 1905 + 1/2 | 81.09 | 0.00 | 6.3 | 1.94 | 1.94 | 1.00 | 1.01 | 1.00 | 0.006 | 1.62 | 14,8 | 9.9 | 12.8 | 0.65 | 0.17 | 0.13 | 8.0 |
| 1906 | 81.14 | 0.02 | 6.1 | 1.90 | 1.92 | 0.99 | 1.00 | 0.99 | 0.004 | 1.78 | 12,8 | 7.7 | 11.2 | 0.65 | 0.16 | 0.09 | 8.0 |
| 1906 + 1/2 | 81.14 | 0.02 | 5.8 | 1.90 | 1.89 | 1.00 | 1.00 | 1.00 | 0.009 | 1.75 | 12,8 | 6.0 | 10.3 | 0.66 | 0.16 | 0.06 | 8.0 |
| 1907 | 81.10 | 0.02 | 5.6 | 1.88 | 1.89 | 1.00 | 1.00 | 1.00 | 0.011 | 1.80 | 12,8 | 4.7 | 10.2 | 0.66 | 0.16 | 0.04 | 8.0 |
| 1907 + 1/2 | 81.02 | 0.02 | 5.2 | 1.88 | 1.87 | 1.00 | 1.01 | 1.00 | 0.012 | 1.99 | 0,6 | 3.7 | 7.8 | 0.67 | 0.12 | 0.02 | 8.0 |
| 1908 | 80.91 | 0.01 | 5.0 | 1.87 | 1.86 | 1.00 | 1.00 | 1.00 | 0.026 | 2.00 | 0,6 | 3.2 | 7.0 | 0.68 | 0.06 | 0.67 | 8.0 |
| 1908 + 1/2 | 80.78 | 0.00 | 4.8 | 1.85 | 1.85 | 1.00 | 0.99 | 0.99 | 0.026 | 2.02 | 0,6 | 2.8 | 6.0 | 0.68 | 0.05 | 0.68 | 8.0 |
| 1909 | 80.66 | 0.02 | 4.5 | 1.84 | 1.84 | 1.00 | 1.01 | 1.00 | 0.014 | 1.88 | 0,6 | 2.7 | 4.8 | 0.69 | 0.05 | 0.69 | 8.0 |
| 1909 + 1/2 | 80.49 | 0.01 | 4.3 | 1.83 | 1.83 | 1.00 | 1.00 | 1.00 | 0.020 | 1.78 | 13,8 | 2.4 | 4.2 | 0.70 | 0.04 | 0.69 | 8.0 |
| 1910 | 80.29 | 0.01 | 3.9 | 1.81 | 1.81 | 1.00 | 1.01 | 1.00 | 0.004 | 1.69 | 13,8 | 2.2 | 4.6 | 0.70 | 0.04 | 0.70 | 8.0 |
| 1910 + 1/2 | 80.12 | 0.01 | 3.8 | 1.79 | 1.79 | 1.00 | 1.00 | 1.00 | 0.006 | 1.76 | 15,6 | 2.2 | 3.9 | 0.71 | 0.03 | 0.71 | 8.0 |
| 1911 | 79.96 | 0.01 | 3.4 | 1.77 | 1.77 | 1.00 | 1.00 | 1.00 | 0.006 | 1.89 | 15,6 | 2.0 | 4.5 | 0.71 | 0.03 | 0.71 | 8.0 |
| 1911 + 1/2 | 79.84 | 0.01 | 3.2 | 1.74 | 1.75 | 0.99 | 0.99 | 0.99 | 0.007 | 2.15 | 15,6 | 1.9 | 3.9 | 0.72 | 0.02 | 0.72 | 8.7 |
| 1912 | 79.72 | 0.01 | 3.0 | 1.74 | 1.73 | 1.01 | 1.01 | 1.01 | 0.000 | 2.30 | 15,6 | 1.8 | 3.4 | 0.73 | 0.02 | 0.72 | 8.4 |
| 1912 + 1/2 | 79.63 | 0.01 | 2.7 | 1.72 | 1.71 | 1.00 | 1.00 | 1.00 | 0.002 | 2.31 | 15,6 | 1.7 | 4.0 | 0.73 | 0.02 | 0.73 | 8.6 |
| 1913 | 79.56 | 0.01 | 2.5 | 1.69 | 1.69 | 1.00 | 1.00 | 1.00 | 0.001 | 2.39 | 15,6 | 1.6 | 3.4 | 0.74 | 0.02 | 0.73 | 8.5 |
| 1913 + 1/2 | 79.51 | 0.01 | 2.3 | 1.66 | 1.65 | 1.00 | 1.00 | 1.00 | 0.003 | 2.19 | 15,6 | 1.6 | 3.2 | 0.74 | 0.02 | 0.74 | 8.4 |
| 1914 | 79.48 | 0.01 | 2.0 | 1.61 | 1.62 | 1.00 | 1.00 | 1.00 | 0.000 | 2.37 | 15,6 | 1.6 | 3.6 | 0.75 | 0.02 | 0.74 | 8.3 |
| 1914 + 1/2 | 79.46 | 0.00 | 1.8 | 1.58 | 1.56 | 1.01 | 1.01 | 1.01 | 0.000 | 2.35 | 15,6 | 1.6 | 3.5 | 0.75 | 0.02 | 0.74 | 8.3 |
| 1915 | 79.45 | 0.01 | 1.5 | 1.50 | 1.50 | 1.00 | 1.00 | 1.00 | 0.000 | 2.30 | 15,6 | 1.6 | 3.4 | 0.75 | 0.02 | 0.74 | 8.2 |
| 1915 + 1/2 | 79.45 | 0.00 | 1.3 | 1.42 | 1.41 | 1.01 | 1.01 | 1.01 | 0.000 | 2.23 | 15,6 | 1.5 | 3.0 | 0.76 | 0.02 | 0.75 | 8.2 |
| 1916 | 79.46 | 0.01 | 1.1 | 1.31 | 1.31 | 1.00 | 1.00 | 1.00 | 0.000 | 2.05 | 15,6 | 1.5 | 3.0 | 0.76 | 0.01 | 0.75 | 8.2 |
| 1916 + 1/2 | 79.49 | 0.01 | 0.9 | 1.20 | 1.21 | 0.99 | 0.99 | 0.99 | 0.000 | 1.73 | 15,6 | 1.5 | 2.9 | 0.76 | 0.01 | 0.75 | 8.1 |
| 1917 | 79.52 | 0.00 | 0.7 | 1.11 | 1.12 | 0.99 | 0.99 | 0.99 | 0.000 | 1.35 | 15,6 | 1.5 | 3.2 | 0.76 | 0.01 | 0.75 | 8.1 |
| 1917 + 1/2 | 79.55 | 0.00 | 0.6 | 1.04 | 1.05 | 0.99 | 0.99 | 0.99 | 0.000 | 1.25 | 4,5 | 1.5 | 3.1 | 0.76 | 0.01 | 0.75 | 8.1 |
| 1918 | 79.59 | 0.00 | 0.6 | 0.99 | 1.01 | 0.98 | 0.98 | 0.98 | 0.000 | 1.12 | 0,6 | 1.5 | 3.0 | 0.76 | 0.01 | 0.75 | 8.1 |
| 1918 + 1/2 | 79.64 | 0.00 | 0.5 | 0.96 | 0.99 | 0.97 | 0.97 | 0.97 | 0.000 | 1.08 | 2,1 | 1.5 | 3.0 | 0.76 | 0.01 | 0.75 | 8.1 |
| 1919 last | 79.69 | 0.00 | 0.5 | 0.96 | 0.99 | 0.97 | 0.97 | 0.97 | 0.000 | 1.07 | 10,8 | 1.5 | 3.0 | 0.76 | 0.01 | 0.75 | 8.1 |
| 1919 + 1/2 | 79.73 | 0.00 | 0.5 | 0.96 | 0.99 | 0.97 | 0.97 | 0.97 | 0.000 | 1.07 | 3,1 | 1.5 | 3.0 | 0.76 | 0.01 | 0.75 | 8.2 |
| 1920 | 79.78 | 0.00 | 0.5 | 0.97 | 0.99 | 0.98 | 0.98 | 0.98 | 0.000 | 1.10 | 7,6 | 1.4 | 3.0 | 0.76 | 0.01 | 0.75 | 8.2 |
| 1920 + 1/2 | 79.83 | 0.00 | 0.5 | 0.97 | 0.99 | 0.98 | 0.98 | 0.98 | 0.000 | 1.09 | 7,6 | 1.5 | 2.9 | 0.76 | 0.01 | 0.75 | 8.2 |
| 1921 | 79.88 | 0.00 | 0.5 | 0.97 | 0.99 | 0.98 | 0.98 | 0.98 | 0.000 | 1.07 | 15,3 | 1.5 | 3.0 | 0.76 | 0.01 | 0.75 | 8.2 |
| 1921 + 1/2 | 79.92 | 0.00 | 0.5 | 0.96 | 0.99 | 0.97 | 0.97 | 0.97 | 0.000 | 1.06 | 15,8 | 1.5 | 2.9 | 0.76 | 0.01 | 0.75 | 8.2 |
| 1922 | 79.97 | 0.00 | 0.5 | 0.97 | 0.99 | 0.98 | 0.98 | 0.98 | 0.000 | 1.09 | 13,6 | 1.5 | 2.8 | 0.76 | 0.01 | 0.75 | 8.1 |
| 1922 + 1/2 | 80.02 | 0.00 | 0.5 | 0.98 | 0.99 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 15,5 | 1.5 | 2.9 | 0.76 | 0.01 | 0.75 | 8.1 |
| 1923 | 80.07 | 0.00 | 0.5 | 0.98 | 0.99 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 3,2 | 1.5 | 2.9 | 0.76 | 0.01 | 0.75 | 8.1 |
| 1923 + 1/2 | 80.12 | 0.00 | 0.5 | 0.98 | 0.99 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 13,3 | 1.6 | 2.8 | 0.76 | 0.02 | 0.75 | 8.1 |
| 1924 | 80.16 | 0.00 | 0.5 | 0.99 | 0.99 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 9,4 |  |  |  |  |  |  |
| 1924 + 1/2 | 80.21 | 0.00 | 0.6 | 0.99 | 0.99 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 11,7 |  |  |  |  |  |  |
| 1925 | 80.26 | 0.00 | 0.5 | 0.98 | 0.99 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 12,6 |  |  |  |  |  |  |
| 1925 + 1/2 | 80.31 | 0.00 | 0.5 | 0.99 | 0.99 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 0,6 |  |  |  |  |  |  |
| 1926 | 80.36 | 0.00 | 0.5 | 0.99 | 0.99 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 4,2 |  |  |  |  |  |  |
| 1926 + 1/2 | 80.41 | 0.00 | 0.5 | 0.99 | 0.99 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 6,2 |  |  |  |  |  |  |
| 1927 | 80.46 | 0.00 | 0.6 | 1.00 | 0.99 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 14,0 |  |  |  |  |  |  |
| 1927 + 1/2 | 80.50 | 0.00 | 0.5 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 10,0 |  |  |  |  |  |  |
| 1928 | 80.56 | 0.00 | 0.6 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 13,7 |  |  |  |  |  |  |
| 1928 + 1/2 | 80.60 | 0.00 | 0.6 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 12,8 |  |  |  |  |  |  |
| 1929 | 80.65 | 0.00 | 0.5 | 1.01 | 1.01 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 11,5 |  |  |  |  |  |  |
| 1929 + 1/2 | 80.70 | 0.00 | 0.6 | 1.01 | 1.01 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 12,5 |  |  |  |  |  |  |
| 1930 | 80.75 | 0.00 | 0.6 | 1.02 | 1.01 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 12,5 |  |  |  |  |  |  |
| 1930 + 1/2 | 80.80 | 0.00 | 0.5 | 1.01 | 1.01 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 1,5 |  |  |  |  |  |  |
| 1931 | 80.86 | 0.00 | 0.6 | 1.01 | 1.01 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 11,7 |  |  |  |  |  |  |
| 1931 + 1/2 | 80.91 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### dive, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.12 from frame 1852 to the next, limit 1.2.
Largest pop score of one block: 10.49 from frame 1855 + 1/2 to the next, block column 15 row 8 from the top left, shown, not judged.
Largest change in place: 49.1 from frame 1897 to 8 film frames later, most at pixel 852, 276, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 1920 to 1931 + 1/2): change 0.7; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.062 from frame 1852 to the next, most at pixel 1022, 782, a patch of 220 by 152 px; 0 of 227 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 228 rows, which says nothing of them, quiet or not: frame 1931 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 1851 + 1/2 in /home/user/workspace/work/p6/he9/01/earth-dive-p1of2-pops-full.png, frame 1852 in /home/user/workspace/work/p6/he9/01/earth-dive-p1of2-pops-full.png, frame 1852 + 1/2 in /home/user/workspace/work/p6/he9/01/earth-dive-p1of2-pops-full.png, frame 1875 + 1/2 in /home/user/workspace/work/p6/he9/02/earth-dive-p2of2-pops-full.png.

With the carry at the full size the dive has no number over its limit.

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1818 | 0.1 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 8,2 | 1.0 | 1.4 | 0.30 | 1.00 | 0.310 | 0.310 | 0.999 | 0.303 | 778,502 | 200 by 196 |
| 1818 + 1/2 | 0.1 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 8,7 | 1.0 | 1.4 | 0.30 | 1.00 | 0.312 | 0.310 | 1.006 | 0.303 | 1042,874 | 48 by 72 |
| 1819 | 0.1 | 0.27 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.05 | 9,3 | 1.1 | 1.5 | 0.30 | 1.00 | 0.310 | 0.310 | 1.001 | 0.303 | 974,650 | 120 by 160 |
| 1819 + 1/2 | 0.1 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 0,3 | 1.1 | 1.5 | 0.30 | 1.00 | 0.310 | 0.310 | 0.998 | 0.304 | 790,590 | 212 by 164 |
| 1820 | 0.1 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 10,2 | 1.1 | 1.5 | 0.30 | 1.01 | 0.310 | 0.310 | 1.003 | 0.304 | 994,742 | 100 by 152 |
| 1820 + 1/2 | 0.1 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 8,2 | 1.1 | 1.5 | 0.30 | 1.00 | 0.310 | 0.310 | 1.000 | 0.304 | 762,882 | 140 by 88 |
| 1821 | 0.1 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 4,4 | 1.0 | 1.5 | 0.30 | 1.00 | 0.308 | 0.310 | 0.992 | 0.304 | 1058,562 | 84 by 96 |
| 1821 + 1/2 | 0.1 | 0.27 | 0.26 | 1.01 | 1.01 | 1.01 | 0.000 | 1.07 | 10,0 | 1.0 | 1.6 | 0.30 | 1.00 | 0.310 | 0.309 | 1.002 | 0.304 | 790,530 | 80 by 80 |
| 1822 | 0.1 | 0.27 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 4,6 | 1.0 | 1.5 | 0.30 | 1.01 | 0.311 | 0.309 | 1.006 | 0.304 | 962,702 | 64 by 56 |
| 1822 + 1/2 | 0.1 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 3,4 | 0.9 | 1.5 | 0.30 | 1.00 | 0.308 | 0.310 | 0.994 | 0.304 | 698,606 | 124 by 172 |
| 1823 | 0.1 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 8,6 | 1.0 | 1.5 | 0.30 | 1.00 | 0.310 | 0.311 | 0.996 | 0.304 | 994,742 | 120 by 108 |
| 1823 + 1/2 | 0.1 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 8,4 | 1.0 | 1.5 | 0.30 | 1.00 | 0.313 | 0.310 | 1.007 | 0.304 | 938,546 | 60 by 64 |
| 1824 | 0.1 | 0.26 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 10,5 | 1.0 | 1.6 | 0.30 | 1.00 | 0.311 | 0.312 | 0.999 | 0.304 | 958,654 | 116 by 152 |
| 1824 + 1/2 | 0.1 | 0.27 | 0.26 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 7,3 | 1.1 | 1.8 | 0.30 | 1.00 | 0.311 | 0.312 | 0.999 | 0.304 | 962,682 | 52 by 84 |
| 1825 | 0.1 | 0.26 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 6,4 | 1.2 | 2.3 | 0.30 | 1.00 | 0.312 | 0.311 | 1.004 | 0.304 | 1002,634 | 92 by 116 |
| 1825 + 1/2 | 0.1 | 0.26 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 11,2 | 1.3 | 2.9 | 0.30 | 1.00 | 0.310 | 0.312 | 0.996 | 0.304 | 926,858 | 92 by 104 |
| 1826 | 0.1 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.05 | 10,5 | 1.5 | 3.9 | 0.30 | 1.00 | 0.310 | 0.312 | 0.991 | 0.305 | 990,730 | 72 by 96 |
| 1826 + 1/2 | 0.1 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.05 | 7,5 | 1.7 | 5.2 | 0.30 | 1.00 | 0.313 | 0.311 | 1.005 | 0.305 | 954,646 | 100 by 80 |
| 1827 | 0.1 | 0.26 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.05 | 5,4 | 2.0 | 5.8 | 0.30 | 1.00 | 0.313 | 0.313 | 1.001 | 0.305 | 1018,618 | 188 by 228 |
| 1827 + 1/2 | 0.1 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 5,4 | 2.3 | 7.5 | 0.30 | 0.99 | 0.312 | 0.313 | 0.998 | 0.305 | 1050,814 | 104 by 92 |
| 1828 | 0.1 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 6,5 | 2.7 | 8.5 | 0.30 | 1.00 | 0.314 | 0.312 | 1.005 | 0.305 | 1114,370 | 192 by 164 |
| 1828 + 1/2 | 0.1 | 0.26 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.05 | 6,4 | 3.1 | 10.7 | 0.30 | 1.00 | 0.312 | 0.313 | 0.996 | 0.305 | 798,590 | 136 by 164 |
| 1829 | 0.1 | 0.26 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.04 | 7,4 | 3.5 | 11.9 | 0.30 | 0.99 | 0.312 | 0.312 | 0.998 | 0.305 | 918,478 | 84 by 84 |
| 1829 + 1/2 | 0.1 | 0.27 | 0.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.05 | 10,4 | 3.9 | 12.4 | 0.30 | 0.99 | 0.313 | 0.311 | 1.006 | 0.305 | 1026,354 | 148 by 80 |
| 1830 | 0.1 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.07 | 13,1 | 3.6 | 6.6 | 0.30 | 0.98 | 0.308 | 0.313 | 0.985 | 0.305 | 790,558 | 168 by 120 |
| 1830 + 1/2 | 0.2 | 0.27 | 0.27 | 0.99 | 0.99 | 0.99 | 0.000 | 1.06 | 1,0 | 3.9 | 6.1 | 0.30 | 0.96 | 0.311 | 0.314 | 0.990 | 0.305 | 794,534 | 304 by 368 |
| 1831 | 0.2 | 0.28 | 0.28 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 1,0 | 4.3 | 6.6 | 0.30 | 0.95 | 0.315 | 0.322 | 0.979 | 0.305 | 826,938 | 60 by 56 |
| 1831 + 1/2 | 0.3 | 0.29 | 0.29 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 7,1 | 4.6 | 7.9 | 0.30 | 0.96 | 0.333 | 0.335 | 0.993 | 0.306 | 810,874 | 100 by 132 |
| 1832 | 0.4 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.28 | 7,1 | 5.0 | 8.6 | 0.30 | 0.98 | 0.355 | 0.359 | 0.989 | 0.306 | 862,158 | 64 by 52 |
| 1832 + 1/2 | 0.6 | 0.32 | 0.32 | 1.01 | 1.01 | 1.01 | 0.000 | 1.36 | 7,1 | 5.4 | 8.8 | 0.30 | 0.99 | 0.386 | 0.379 | 1.018 | 0.307 | 830,786 | 276 by 380 |
| 1833 | 0.8 | 0.34 | 0.34 | 1.00 | 1.00 | 1.00 | 0.000 | 1.36 | 7,1 | 5.7 | 8.7 | 0.30 | 1.00 | 0.403 | 0.394 | 1.023 | 0.307 | 786,534 | 216 by 312 |
| 1833 + 1/2 | 1.1 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.000 | 1.32 | 6,4 | 6.0 | 9.5 | 0.30 | 1.01 | 0.403 | 0.402 | 1.001 | 0.309 | 726,638 | 152 by 268 |
| 1834 | 1.3 | 0.37 | 0.37 | 1.00 | 1.00 | 1.00 | 0.000 | 1.60 | 4,4 | 6.3 | 9.4 | 0.30 | 1.01 | 0.402 | 0.403 | 0.997 | 0.310 | 838,950 | 228 by 156 |
| 1834 + 1/2 | 1.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.61 | 4,4 | 6.4 | 9.6 | 0.31 | 1.01 | 0.403 | 0.404 | 0.998 | 0.311 | 786,854 | 204 by 96 |
| 1835 | 1.9 | 0.40 | 0.40 | 0.99 | 0.99 | 0.99 | 0.000 | 1.78 | 4,3 | 6.6 | 10.2 | 0.31 | 1.00 | 0.406 | 0.412 | 0.986 | 0.313 | 854,782 | 136 by 116 |
| 1835 + 1/2 | 2.0 | 0.42 | 0.42 | 1.01 | 1.01 | 1.01 | 0.000 | 1.92 | 4,3 | 6.8 | 10.5 | 0.31 | 1.00 | 0.420 | 0.416 | 1.009 | 0.315 | 858,918 | 80 by 76 |
| 1836 | 2.2 | 0.44 | 0.44 | 1.00 | 1.00 | 1.00 | 0.000 | 1.87 | 4,3 | 7.2 | 10.7 | 0.31 | 1.01 | 0.427 | 0.423 | 1.009 | 0.318 | 830,914 | 164 by 80 |
| 1836 + 1/2 | 2.5 | 0.46 | 0.45 | 1.00 | 1.01 | 1.00 | 0.001 | 1.99 | 4,3 | 7.5 | 10.8 | 0.31 | 1.00 | 0.426 | 0.429 | 0.993 | 0.321 | 746,594 | 104 by 132 |
| 1837 | 2.8 | 0.47 | 0.47 | 1.00 | 0.99 | 0.99 | 0.006 | 2.11 | 4,3 | 8.0 | 11.0 | 0.32 | 1.00 | 0.431 | 0.431 | 0.999 | 0.324 | 586,698 | 56 by 68 |
| 1837 + 1/2 | 2.9 | 0.49 | 0.49 | 1.01 | 1.00 | 1.00 | 0.008 | 1.88 | 4,3 | 8.4 | 11.0 | 0.32 | 1.00 | 0.436 | 0.437 | 0.998 | 0.328 | 778,550 | 76 by 100 |
| 1838 | 3.3 | 0.50 | 0.51 | 1.00 | 0.99 | 0.99 | 0.010 | 1.78 | 4,3 | 8.6 | 10.6 | 0.32 | 1.00 | 0.443 | 0.441 | 1.004 | 0.332 | 678,718 | 88 by 84 |
| 1838 + 1/2 | 3.4 | 0.52 | 0.52 | 1.01 | 1.01 | 1.01 | 0.009 | 1.82 | 4,6 | 8.9 | 10.7 | 0.32 | 1.00 | 0.447 | 0.445 | 1.005 | 0.337 | 602,742 | 72 by 80 |
| 1839 | 3.6 | 0.53 | 0.53 | 0.99 | 1.00 | 0.99 | 0.007 | 1.81 | 4,6 | 9.2 | 12.5 | 0.33 | 0.99 | 0.447 | 0.450 | 0.992 | 0.341 | 694,866 | 120 by 100 |
| 1839 + 1/2 | 3.9 | 0.55 | 0.55 | 1.00 | 1.00 | 1.00 | 0.008 | 1.59 | 9,0 | 9.6 | 11.6 | 0.33 | 1.00 | 0.453 | 0.452 | 1.003 | 0.347 | 1254,842 | 72 by 60 |
| 1840 | 4.1 | 0.56 | 0.57 | 0.99 | 0.99 | 0.99 | 0.009 | 1.69 | 12,5 | 9.9 | 12.3 | 0.33 | 0.99 | 0.456 | 0.461 | 0.990 | 0.353 | 658,734 | 112 by 188 |
| 1840 + 1/2 | 4.3 | 0.58 | 0.58 | 1.01 | 1.01 | 1.01 | 0.009 | 1.85 | 12,4 | 10.6 | 13.4 | 0.33 | 1.01 | 0.469 | 0.464 | 1.010 | 0.359 | 794,822 | 192 by 140 |
| 1841 | 4.6 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.006 | 2.09 | 5,8 | 11.0 | 13.7 | 0.34 | 1.00 | 0.475 | 0.470 | 1.009 | 0.365 | 566,722 | 64 by 96 |
| 1841 + 1/2 | 4.8 | 0.61 | 0.62 | 0.99 | 0.99 | 0.99 | 0.006 | 2.02 | 12,4 | 11.7 | 14.6 | 0.34 | 1.00 | 0.472 | 0.475 | 0.993 | 0.372 | 742,942 | 196 by 160 |
| 1842 | 4.9 | 0.63 | 0.63 | 1.01 | 1.00 | 1.00 | 0.007 | 2.25 | 12,4 | 12.4 | 15.6 | 0.34 | 1.00 | 0.476 | 0.477 | 0.999 | 0.378 | 622,826 | 104 by 140 |
| 1842 + 1/2 | 5.2 | 0.64 | 0.65 | 1.00 | 1.00 | 1.00 | 0.007 | 2.10 | 12,4 | 12.9 | 16.5 | 0.35 | 1.00 | 0.479 | 0.480 | 0.998 | 0.385 | 562,758 | 64 by 80 |
| 1843 | 5.4 | 0.66 | 0.66 | 1.00 | 1.00 | 1.00 | 0.006 | 1.98 | 11,0 | 13.5 | 17.7 | 0.35 | 1.01 | 0.488 | 0.481 | 1.014 | 0.392 | 662,706 | 84 by 180 |
| 1843 + 1/2 | 5.7 | 0.67 | 0.67 | 1.00 | 1.00 | 1.00 | 0.007 | 2.01 | 11,0 | 14.3 | 18.6 | 0.35 | 1.00 | 0.483 | 0.487 | 0.992 | 0.400 | 1354,794 | 80 by 84 |
| 1844 | 5.9 | 0.69 | 0.68 | 1.01 | 1.00 | 1.00 | 0.009 | 2.56 | 13,4 | 15.7 | 19.9 | 0.36 | 1.00 | 0.490 | 0.487 | 1.006 | 0.407 | 954,78 | 132 by 92 |
| 1844 + 1/2 | 6.2 | 0.69 | 0.70 | 0.99 | 1.00 | 0.99 | 0.005 | 2.82 | 13,5 | 16.8 | 21.0 | 0.36 | 1.00 | 0.487 | 0.490 | 0.994 | 0.416 | 954,702 | 120 by 140 |
| 1845 | 6.4 | 0.71 | 0.70 | 1.00 | 0.99 | 0.99 | 0.004 | 2.92 | 13,4 | 17.7 | 23.5 | 0.36 | 1.00 | 0.495 | 0.490 | 1.009 | 0.424 | 1362,814 | 72 by 88 |
| 1845 + 1/2 | 6.6 | 0.72 | 0.73 | 0.99 | 1.00 | 0.99 | 0.003 | 3.32 | 15,1 | 18.3 | 24.6 | 0.37 | 1.00 | 0.490 | 0.501 | 0.977 | 0.432 | 610,754 | 68 by 124 |
| 1846 | 6.9 | 0.75 | 0.73 | 1.02 | 1.03 | 1.02 | 0.004 | 3.36 | 13,5 | 19.4 | 24.8 | 0.37 | 1.01 | 0.509 | 0.501 | 1.015 | 0.441 | 958,706 | 124 by 156 |
| 1846 + 1/2 | 7.1 | 0.75 | 0.75 | 1.00 | 0.98 | 0.98 | 0.013 | 3.41 | 13,5 | 20.3 | 24.8 | 0.38 | 0.99 | 0.508 | 0.514 | 0.989 | 0.450 | 834,1038 | 120 by 44 |
| 1847 | 7.4 | 0.76 | 0.77 | 0.99 | 0.98 | 0.98 | 0.011 | 3.89 | 13,5 | 21.4 | 26.7 | 0.38 | 1.00 | 0.518 | 0.522 | 0.993 | 0.460 | 1310,938 | 68 by 56 |
| 1847 + 1/2 | 7.6 | 0.78 | 0.77 | 1.01 | 1.01 | 1.01 | 0.013 | 4.11 | 13,5 | 22.6 | 27.6 | 0.38 | 1.00 | 0.535 | 0.535 | 1.000 | 0.469 | 950,730 | 64 by 84 |
| 1848 | 7.9 | 0.79 | 0.80 | 0.99 | 1.00 | 0.99 | 0.012 | 4.33 | 13,6 | 23.7 | 30.0 | 0.39 | 1.00 | 0.552 | 0.560 | 0.987 | 0.480 | 986,34 | 84 by 36 |
| 1848 + 1/2 | 8.2 | 0.82 | 0.81 | 1.01 | 1.00 | 1.00 | 0.021 | 5.09 | 13,6 | 24.9 | 33.3 | 0.39 | 0.99 | 0.584 | 0.582 | 1.003 | 0.490 | 934,30 | 52 by 32 |
| 1849 | 8.5 | 0.83 | 0.83 | 1.00 | 1.00 | 1.00 | 0.027 | 4.53 | 13,6 | 26.5 | 35.2 | 0.40 | 0.99 | 0.613 | 0.613 | 0.999 | 0.501 | 970,498 | 52 by 48 |
| 1849 + 1/2 | 8.8 | 0.85 | 0.87 | 0.99 | 1.00 | 0.99 | 0.023 | 3.82 | 13,7 | 27.8 | 36.9 | 0.40 | 0.99 | 0.642 | 0.658 | 0.975 | 0.511 | 1326,1002 | 80 by 60 |
| 1850 | 9.1 | 0.90 | 0.89 | 1.01 | 1.02 | 1.01 | 0.034 | 4.34 | 14,5 | 29.6 | 38.4 | 0.40 | 1.01 | 0.703 | 0.709 | 0.992 | 0.523 | 966,862 | 76 by 96 |
| 1850 + 1/2 | 9.4 | 0.94 | 0.91 | 1.03 | 1.06 | 1.03 | 0.046 | 4.32 | 14,5 | 28.3 | 38.0 | 0.40 | 1.00 | 0.776 | 0.774 | 1.003 | 0.534 | 1026,670 | 276 by 312 |
| 1851 | 9.9 | 0.97 | 0.92 | 1.05 | 1.09 | 1.05 | 0.047 | 4.79 | 14,5 | 30.1 | 39.6 | 0.40 | 1.01 | 0.844 | 0.837 | 1.008 | 0.546 | 902,558 | 92 by 76 |
| 1851 + 1/2 | 10.4 | 1.02 | 0.93 | 1.10 | 1.14 | 1.10 | 0.042 | 4.75 | 14,6 | 31.9 | 37.5 | 0.40 | 1.01 | 0.898 | 0.871 | 1.032 | 0.557 | 1082,278 | 68 by 60 |
| 1852 | 10.4 | 1.05 | 0.93 | 1.12 | 1.13 | 1.12 | 0.070 | 5.30 | 14,7 | 32.0 | 38.7 | 0.40 | 1.00 | 0.929 | 0.874 | 1.062 | 0.569 | 1022,782 | 220 by 152 |
| 1852 + 1/2 | 10.9 | 1.04 | 0.94 | 1.11 | 1.16 | 1.11 | 0.050 | 6.58 | 14,7 | 33.5 | 41.7 | 0.40 | 1.00 | 0.897 | 0.875 | 1.026 | 0.582 | 1042,814 | 256 by 132 |
| 1853 | 11.3 | 1.01 | 0.94 | 1.07 | 1.03 | 1.03 | 0.076 | 6.94 | 14,7 | 34.8 | 42.9 | 0.40 | 0.97 | 0.851 | 0.841 | 1.012 | 0.594 | 906,846 | 64 by 72 |
| 1853 + 1/2 | 11.8 | 0.95 | 0.94 | 1.01 | 1.02 | 1.01 | 0.062 | 5.38 | 14,7 | 34.5 | 43.6 | 0.40 | 0.99 | 0.785 | 0.796 | 0.986 | 0.608 | 1098,266 | 72 by 64 |
| 1854 | 12.2 | 0.93 | 0.95 | 0.97 | 0.96 | 0.96 | 0.056 | 6.50 | 15,6 | 36.6 | 44.8 | 0.40 | 1.00 | 0.740 | 0.751 | 0.985 | 0.621 | 730,422 | 68 by 148 |
| 1854 + 1/2 | 12.7 | 0.94 | 0.96 | 0.98 | 1.01 | 0.98 | 0.052 | 8.52 | 15,7 | 35.2 | 44.4 | 0.40 | 1.02 | 0.718 | 0.705 | 1.018 | 0.635 | 902,1014 | 152 by 156 |
| 1855 | 13.1 | 0.92 | 0.96 | 0.96 | 1.01 | 0.96 | 0.039 | 9.10 | 15,7 | 37.5 | 46.9 | 0.40 | 1.00 | 0.670 | 0.694 | 0.964 | 0.649 | 882,1022 | 76 by 76 |
| 1855 + 1/2 | 13.3 | 0.94 | 0.96 | 0.98 | 1.01 | 0.98 | 0.032 | 10.49 | 15,8 | 40.6 | 48.8 | 0.40 | 0.99 | 0.659 | 0.670 | 0.983 | 0.663 | 866,1030 | 148 by 76 |
| 1856 | 13.9 | 0.94 | 0.96 | 0.98 | 0.94 | 0.94 | 0.073 | 5.10 | 15,3 | 40.8 | 48.5 | 0.40 | 0.98 | 0.671 | 0.667 | 1.007 | 0.679 | 886,934 | 56 by 60 |
| 1856 + 1/2 | 14.2 | 0.93 | 0.96 | 0.96 | 0.98 | 0.96 | 0.047 | 6.01 | 15,3 | 41.3 | 48.5 | 0.40 | 0.99 | 0.664 | 0.669 | 0.992 | 0.693 | 530,526 | 72 by 160 |
| 1857 | 14.6 | 0.94 | 0.96 | 0.98 | 0.98 | 0.98 | 0.044 | 6.06 | 15,3 | 40.3 | 48.6 | 0.40 | 1.00 | 0.671 | 0.665 | 1.009 | 0.708 | 526,494 | 108 by 124 |
| 1857 + 1/2 | 15.1 | 0.96 | 0.96 | 1.01 | 0.98 | 0.98 | 0.045 | 5.05 | 15,3 | 39.5 | 50.0 | 0.40 | 1.01 | 0.667 | 0.661 | 1.008 | 0.718 | 486,514 | 76 by 128 |
| 1858 | 15.3 | 0.96 | 0.96 | 1.00 | 0.97 | 0.97 | 0.050 | 3.44 | 15,3 | 39.9 | 50.5 | 0.40 | 1.00 | 0.658 | 0.669 | 0.984 | 0.728 | 970,730 | 56 by 64 |
| 1858 + 1/2 | 15.5 | 0.96 | 0.96 | 1.00 | 1.00 | 1.00 | 0.030 | 3.68 | 15,2 | 38.9 | 53.2 | 0.40 | 1.00 | 0.657 | 0.669 | 0.981 | 0.738 | 954,858 | 136 by 124 |
| 1859 | 15.7 | 0.96 | 0.96 | 1.00 | 0.99 | 0.99 | 0.028 | 3.66 | 15,2 | 37.5 | 52.8 | 0.40 | 1.00 | 0.672 | 0.671 | 1.001 | 0.748 | 234,1014 | 44 by 92 |
| 1859 + 1/2 | 16.0 | 0.96 | 0.96 | 1.00 | 0.99 | 0.99 | 0.033 | 3.07 | 15,2 | 35.9 | 49.1 | 0.40 | 1.00 | 0.684 | 0.686 | 0.998 | 0.756 | 938,878 | 72 by 60 |
| 1860 | 16.4 | 0.96 | 0.96 | 1.01 | 1.03 | 1.01 | 0.027 | 2.67 | 0,2 | 35.9 | 49.3 | 0.40 | 1.02 | 0.699 | 0.700 | 0.998 | 0.765 | 1222,918 | 72 by 64 |
| 1860 + 1/2 | 16.7 | 0.96 | 0.95 | 1.01 | 1.02 | 1.01 | 0.028 | 2.59 | 1,7 | 36.6 | 49.6 | 0.41 | 1.04 | 0.716 | 0.721 | 0.992 | 0.774 | 178,1018 | 48 by 132 |
| 1861 | 16.8 | 0.97 | 0.94 | 1.03 | 1.05 | 1.03 | 0.037 | 2.96 | 1,7 | 34.8 | 51.0 | 0.40 | 1.04 | 0.744 | 0.737 | 1.009 | 0.783 | 510,922 | 64 by 56 |
| 1861 + 1/2 | 17.2 | 0.97 | 0.94 | 1.03 | 1.00 | 1.00 | 0.045 | 3.00 | 1,7 | 35.0 | 49.2 | 0.40 | 1.02 | 0.758 | 0.757 | 1.001 | 0.791 | 134,958 | 44 by 128 |
| 1862 | 17.3 | 0.98 | 0.94 | 1.04 | 1.08 | 1.04 | 0.031 | 2.76 | 1,7 | 27.2 | 45.1 | 0.40 | 1.05 | 0.770 | 0.772 | 0.998 | 0.800 | 122,1014 | 36 by 124 |
| 1862 + 1/2 | 17.6 | 1.00 | 0.94 | 1.06 | 1.04 | 1.04 | 0.042 | 2.55 | 1,7 | 24.3 | 41.7 | 0.41 | 1.05 | 0.786 | 0.771 | 1.020 | 0.809 | 102,1006 | 36 by 108 |
| 1863 | 17.6 | 0.99 | 0.94 | 1.06 | 1.04 | 1.04 | 0.040 | 2.35 | 1,7 | 24.1 | 26.5 | 0.41 | 1.04 | 0.797 | 0.772 | 1.032 | 0.818 | 78,1002 | 52 by 144 |
| 1863 + 1/2 | 17.4 | 0.97 | 0.94 | 1.03 | 1.04 | 1.03 | 0.041 | 3.02 | 0,7 | 25.2 | 30.9 | 0.41 | 1.04 | 0.771 | 0.779 | 0.990 | 0.824 | 74,834 | 44 by 72 |
| 1864 | 17.3 | 0.97 | 0.93 | 1.04 | 1.06 | 1.04 | 0.025 | 2.73 | 0,7 | 25.5 | 31.4 | 0.41 | 1.05 | 0.773 | 0.761 | 1.015 | 0.830 | 46,842 | 40 by 60 |
| 1864 + 1/2 | 17.3 | 0.94 | 0.92 | 1.02 | 0.98 | 0.98 | 0.038 | 2.45 | 0,7 | 25.8 | 33.9 | 0.41 | 1.03 | 0.751 | 0.755 | 0.994 | 0.836 | 42,806 | 40 by 56 |
| 1865 | 17.2 | 0.91 | 0.94 | 0.97 | 0.99 | 0.97 | 0.032 | 2.19 | 0,7 | 25.3 | 36.2 | 0.42 | 1.03 | 0.740 | 0.744 | 0.995 | 0.840 | 54,658 | 44 by 68 |
| 1865 + 1/2 | 17.2 | 0.90 | 0.94 | 0.96 | 0.98 | 0.96 | 0.033 | 2.18 | 0,7 | 25.4 | 38.6 | 0.42 | 1.04 | 0.736 | 0.731 | 1.007 | 0.843 | 46,674 | 72 by 180 |
| 1866 | 17.2 | 0.87 | 0.94 | 0.93 | 0.94 | 0.93 | 0.040 | 2.02 | 1,3 | 25.8 | 40.8 | 0.42 | 1.03 | 0.723 | 0.720 | 1.004 | 0.847 | 1766,870 | 72 by 196 |
| 1866 + 1/2 | 17.2 | 0.86 | 0.94 | 0.91 | 0.95 | 0.91 | 0.021 | 1.69 | 1,3 | 26.4 | 42.9 | 0.42 | 1.03 | 0.704 | 0.704 | 1.000 | 0.850 | 1746,10 | 40 by 40 |
| 1867 | 17.2 | 0.83 | 0.94 | 0.88 | 0.90 | 0.88 | 0.027 | 1.67 | 15,4 | 28.0 | 45.0 | 0.43 | 1.02 | 0.685 | 0.687 | 0.998 | 0.852 | 1442,902 | 68 by 56 |
| 1867 + 1/2 | 17.2 | 0.82 | 0.94 | 0.87 | 0.88 | 0.87 | 0.020 | 1.58 | 0,4 | 28.2 | 46.9 | 0.43 | 1.00 | 0.667 | 0.678 | 0.984 | 0.855 | 38,538 | 24 by 56 |
| 1868 | 17.2 | 0.80 | 0.94 | 0.85 | 0.87 | 0.85 | 0.021 | 1.59 | 15,7 | 29.1 | 49.0 | 0.43 | 1.01 | 0.670 | 0.674 | 0.994 | 0.857 | 1854,886 | 40 by 72 |
| 1868 + 1/2 | 17.0 | 0.78 | 0.94 | 0.84 | 0.83 | 0.83 | 0.040 | 1.49 | 0,0 | 29.1 | 50.2 | 0.44 | 0.99 | 0.666 | 0.675 | 0.985 | 0.859 | 1570,890 | 64 by 60 |
| 1869 | 17.0 | 0.78 | 0.94 | 0.84 | 0.87 | 0.84 | 0.029 | 1.49 | 11,7 | 30.2 | 51.3 | 0.44 | 1.00 | 0.681 | 0.680 | 1.001 | 0.861 | 1862,18 | 36 by 52 |
| 1869 + 1/2 | 16.9 | 0.80 | 0.94 | 0.85 | 0.86 | 0.85 | 0.034 | 1.86 | 10,7 | 30.3 | 51.9 | 0.45 | 0.99 | 0.691 | 0.693 | 0.996 | 0.863 | 1838,910 | 56 by 56 |
| 1870 | 16.9 | 0.78 | 0.94 | 0.84 | 0.88 | 0.84 | 0.018 | 1.84 | 10,7 | 31.2 | 52.6 | 0.45 | 1.00 | 0.706 | 0.713 | 0.990 | 0.864 | 1554,726 | 92 by 68 |
| 1870 + 1/2 | 16.8 | 0.81 | 0.94 | 0.86 | 0.88 | 0.86 | 0.030 | 2.22 | 12,8 | 31.4 | 53.2 | 0.45 | 0.99 | 0.735 | 0.738 | 0.995 | 0.866 | 1662,974 | 80 by 76 |
| 1871 | 16.7 | 0.82 | 0.94 | 0.88 | 0.91 | 0.88 | 0.026 | 2.10 | 10,7 | 32.0 | 53.1 | 0.46 | 1.01 | 0.771 | 0.768 | 1.003 | 0.867 | 1690,990 | 68 by 68 |
| 1871 + 1/2 | 16.7 | 0.86 | 0.94 | 0.92 | 0.93 | 0.92 | 0.033 | 2.68 | 12,8 | 32.7 | 53.0 | 0.46 | 1.00 | 0.802 | 0.801 | 1.001 | 0.868 | 1710,1010 | 84 by 56 |
| 1872 | 16.6 | 0.89 | 0.94 | 0.95 | 0.94 | 0.94 | 0.035 | 2.67 | 12,8 | 33.2 | 52.5 | 0.46 | 0.99 | 0.832 | 0.834 | 0.998 | 0.869 | 1646,770 | 64 by 56 |
| 1872 + 1/2 | 16.5 | 0.92 | 0.94 | 0.98 | 0.99 | 0.98 | 0.027 | 2.62 | 15,7 | 33.8 | 51.7 | 0.46 | 1.00 | 0.865 | 0.861 | 1.004 | 0.870 | 1614,1014 | 88 by 60 |
| 1873 | 16.5 | 0.93 | 0.93 | 1.00 | 1.02 | 1.00 | 0.027 | 2.90 | 11,8 | 33.6 | 51.0 | 0.47 | 1.00 | 0.891 | 0.887 | 1.005 | 0.872 | 542,1026 | 88 by 56 |
| 1873 + 1/2 | 16.5 | 0.95 | 0.94 | 1.01 | 0.99 | 0.99 | 0.027 | 3.51 | 15,7 | 34.4 | 50.1 | 0.47 | 1.00 | 0.908 | 0.912 | 0.997 | 0.872 | 1846,838 | 76 by 296 |
| 1874 | 16.4 | 0.97 | 0.94 | 1.03 | 1.01 | 1.01 | 0.026 | 2.82 | 11,8 | 34.0 | 49.1 | 0.47 | 1.00 | 0.932 | 0.941 | 0.990 | 0.873 | 178,1034 | 80 by 48 |
| 1874 + 1/2 | 16.3 | 1.00 | 0.95 | 1.06 | 1.03 | 1.03 | 0.035 | 3.50 | 11,8 | 34.7 | 48.1 | 0.47 | 1.00 | 0.973 | 0.964 | 1.009 | 0.874 | 1350,1030 | 172 by 64 |
| 1875 | 16.3 | 1.00 | 0.95 | 1.06 | 1.05 | 1.05 | 0.026 | 2.27 | 4,5 | 34.0 | 46.8 | 0.48 | 1.00 | 0.997 | 0.995 | 1.002 | 0.875 | 1758,954 | 92 by 108 |
| 1875 + 1/2 | 16.3 | 1.04 | 0.95 | 1.10 | 1.10 | 1.10 | 0.020 | 2.60 | 4,5 | 33.6 | 45.4 | 0.48 | 1.00 | 1.036 | 0.995 | 1.041 | 0.877 | 1842,878 | 68 by 92 |
| 1876 | 16.1 | 1.02 | 0.95 | 1.07 | 1.07 | 1.07 | 0.017 | 2.63 | 4,5 | 33.7 | 43.9 | 0.48 | 1.00 | 1.017 | 0.995 | 1.022 | 0.877 | 1830,994 | 68 by 76 |
| 1876 + 1/2 | 16.0 | 0.99 | 0.96 | 1.04 | 1.04 | 1.04 | 0.024 | 2.55 | 4,5 | 32.6 | 42.4 | 0.48 | 0.99 | 0.993 | 0.994 | 0.999 | 0.878 | 1846,1018 | 56 by 60 |
| 1877 | 16.0 | 0.96 | 0.96 | 1.01 | 1.01 | 1.01 | 0.025 | 2.52 | 4,5 | 31.7 | 41.1 | 0.49 | 1.00 | 0.970 | 0.986 | 0.983 | 0.878 | 262,850 | 60 by 112 |
| 1877 + 1/2 | 16.0 | 0.97 | 0.96 | 1.01 | 1.03 | 1.01 | 0.006 | 2.25 | 15,5 | 31.9 | 39.6 | 0.49 | 0.96 | 0.971 | 0.975 | 0.996 | 0.879 | 1854,638 | 48 by 84 |
| 1878 | 15.8 | 0.98 | 0.96 | 1.02 | 1.02 | 1.02 | 0.015 | 2.61 | 15,5 | 32.2 | 38.3 | 0.49 | 0.97 | 0.980 | 0.968 | 1.013 | 0.880 | 1838,646 | 88 by 240 |
| 1878 + 1/2 | 15.8 | 0.96 | 0.96 | 0.99 | 1.00 | 0.99 | 0.015 | 2.14 | 3,7 | 32.4 | 39.3 | 0.49 | 0.96 | 0.962 | 0.969 | 0.993 | 0.881 | 174,906 | 64 by 132 |
| 1879 | 15.8 | 0.96 | 0.96 | 1.00 | 1.00 | 1.00 | 0.016 | 2.22 | 3,5 | 32.3 | 40.8 | 0.50 | 0.94 | 0.965 | 0.971 | 0.994 | 0.883 | 1562,1018 | 52 by 64 |
| 1879 + 1/2 | 15.8 | 0.96 | 0.96 | 1.00 | 1.01 | 1.00 | 0.010 | 2.42 | 3,5 | 32.5 | 41.3 | 0.50 | 0.95 | 0.967 | 0.964 | 1.004 | 0.882 | 426,934 | 48 by 92 |
| 1880 | 15.7 | 0.97 | 0.96 | 1.01 | 1.02 | 1.01 | 0.005 | 2.38 | 3,5 | 32.6 | 37.5 | 0.50 | 0.94 | 0.974 | 0.962 | 1.012 | 0.883 | 70,774 | 72 by 136 |
| 1880 + 1/2 | 15.5 | 0.96 | 0.97 | 0.99 | 1.00 | 0.99 | 0.003 | 2.27 | 3,5 | 32.8 | 36.5 | 0.51 | 0.94 | 0.959 | 0.959 | 1.000 | 0.883 | 70,986 | 52 by 164 |
| 1881 | 15.5 | 0.95 | 0.97 | 0.98 | 0.99 | 0.98 | 0.006 | 2.20 | 3,5 | 33.5 | 37.3 | 0.51 | 0.94 | 0.951 | 0.952 | 0.999 | 0.884 | 86,838 | 52 by 72 |
| 1881 + 1/2 | 15.5 | 0.94 | 0.97 | 0.97 | 0.97 | 0.97 | 0.018 | 1.94 | 3,5 | 34.4 | 43.7 | 0.51 | 0.94 | 0.946 | 0.951 | 0.994 | 0.884 | 110,910 | 76 by 116 |
| 1882 | 15.4 | 0.94 | 0.97 | 0.97 | 0.97 | 0.97 | 0.012 | 1.86 | 1,8 | 34.8 | 40.4 | 0.51 | 0.94 | 0.945 | 0.951 | 0.994 | 0.884 | 1598,1014 | 56 by 60 |
| 1882 + 1/2 | 15.4 | 0.95 | 0.98 | 0.97 | 0.98 | 0.97 | 0.018 | 1.91 | 2,5 | 35.5 | 39.1 | 0.51 | 0.96 | 0.951 | 0.955 | 0.996 | 0.885 | 1294,10 | 60 by 24 |
| 1883 | 15.3 | 0.96 | 0.98 | 0.98 | 0.97 | 0.97 | 0.032 | 2.09 | 2,5 | 36.8 | 40.1 | 0.51 | 0.96 | 0.964 | 0.954 | 1.010 | 0.884 | 70,1026 | 108 by 148 |
| 1883 + 1/2 | 15.3 | 0.97 | 0.97 | 0.99 | 1.00 | 0.99 | 0.013 | 2.10 | 2,5 | 38.1 | 41.5 | 0.51 | 0.99 | 0.971 | 0.961 | 1.010 | 0.883 | 74,1006 | 80 by 144 |
| 1884 | 15.3 | 0.96 | 0.97 | 0.98 | 0.98 | 0.98 | 0.018 | 2.13 | 2,5 | 39.2 | 43.0 | 0.51 | 1.00 | 0.958 | 0.967 | 0.991 | 0.883 | 54,798 | 32 by 88 |
| 1884 + 1/2 | 15.2 | 0.96 | 0.97 | 1.00 | 0.97 | 0.97 | 0.036 | 2.13 | 2,5 | 39.4 | 44.5 | 0.51 | 1.00 | 0.968 | 0.969 | 1.000 | 0.883 | 434,990 | 152 by 96 |
| 1885 | 15.1 | 0.96 | 0.97 | 1.00 | 0.98 | 0.98 | 0.034 | 1.94 | 2,5 | 40.1 | 45.8 | 0.51 | 1.01 | 0.966 | 0.977 | 0.989 | 0.883 | 1550,934 | 112 by 104 |
| 1885 + 1/2 | 15.1 | 0.98 | 0.97 | 1.02 | 1.00 | 1.00 | 0.028 | 1.90 | 0,7 | 41.1 | 47.0 | 0.51 | 1.04 | 0.986 | 0.977 | 1.009 | 0.882 | 66,858 | 92 by 236 |
| 1886 | 15.1 | 0.98 | 0.96 | 1.02 | 1.01 | 1.01 | 0.025 | 2.07 | 1,5 | 42.1 | 48.8 | 0.52 | 1.03 | 0.987 | 0.987 | 1.000 | 0.880 | 82,974 | 84 by 124 |
| 1886 + 1/2 | 15.0 | 0.98 | 0.96 | 1.02 | 1.01 | 1.01 | 0.037 | 2.04 | 1,5 | 43.0 | 49.9 | 0.52 | 1.03 | 0.988 | 0.987 | 1.001 | 0.880 | 118,858 | 72 by 120 |
| 1887 | 15.0 | 0.99 | 0.96 | 1.02 | 1.01 | 1.01 | 0.028 | 2.21 | 1,5 | 43.8 | 51.0 | 0.52 | 1.03 | 0.988 | 0.988 | 0.999 | 0.880 | 94,842 | 60 by 80 |
| 1887 + 1/2 | 15.0 | 0.99 | 0.96 | 1.03 | 1.04 | 1.03 | 0.021 | 2.20 | 13,8 | 44.6 | 52.3 | 0.52 | 1.04 | 0.989 | 0.989 | 1.000 | 0.879 | 58,866 | 36 by 72 |
| 1888 | 15.1 | 0.99 | 0.96 | 1.03 | 1.05 | 1.03 | 0.003 | 2.04 | 14,8 | 45.3 | 53.5 | 0.53 | 1.03 | 0.990 | 0.992 | 0.998 | 0.878 | 1150,898 | 68 by 72 |
| 1888 + 1/2 | 14.9 | 1.01 | 0.96 | 1.05 | 1.06 | 1.05 | 0.023 | 2.39 | 0,5 | 45.9 | 54.8 | 0.53 | 1.04 | 1.007 | 0.993 | 1.013 | 0.876 | 1446,6 | 56 by 36 |
| 1889 | 15.0 | 0.99 | 0.96 | 1.04 | 1.04 | 1.04 | 0.015 | 1.95 | 0,5 | 46.6 | 55.7 | 0.53 | 1.03 | 0.996 | 1.007 | 0.989 | 0.874 | 1546,466 | 56 by 52 |
| 1889 + 1/2 | 14.8 | 1.00 | 0.96 | 1.05 | 1.05 | 1.05 | 0.020 | 1.93 | 0,4 | 46.9 | 56.0 | 0.53 | 1.04 | 1.007 | 1.005 | 1.002 | 0.873 | 918,6 | 84 by 36 |
| 1890 | 14.7 | 1.01 | 0.96 | 1.05 | 1.06 | 1.05 | 0.021 | 1.84 | 0,5 | 47.3 | 56.9 | 0.54 | 1.03 | 1.010 | 1.000 | 1.010 | 0.871 | 150,1038 | 104 by 52 |
| 1890 + 1/2 | 14.6 | 1.00 | 0.96 | 1.04 | 1.05 | 1.04 | 0.014 | 1.74 | 0,4 | 47.6 | 57.1 | 0.54 | 1.03 | 1.004 | 0.998 | 1.006 | 0.868 | 1110,6 | 152 by 40 |
| 1891 | 14.4 | 0.98 | 0.96 | 1.03 | 1.03 | 1.03 | 0.014 | 1.83 | 14,6 | 47.9 | 56.9 | 0.54 | 1.02 | 0.988 | 0.987 | 1.001 | 0.865 | 74,1022 | 56 by 80 |
| 1891 + 1/2 | 14.1 | 0.97 | 0.95 | 1.02 | 1.02 | 1.02 | 0.024 | 1.63 | 13,6 | 48.1 | 57.3 | 0.55 | 1.00 | 0.971 | 0.969 | 1.002 | 0.863 | 86,634 | 80 by 76 |
| 1892 | 13.7 | 0.95 | 0.94 | 1.01 | 1.00 | 1.00 | 0.022 | 1.64 | 11,8 | 48.3 | 57.5 | 0.55 | 1.00 | 0.950 | 0.947 | 1.003 | 0.860 | 1858,482 | 44 by 60 |
| 1892 + 1/2 | 13.4 | 0.92 | 0.93 | 0.99 | 0.99 | 0.99 | 0.022 | 1.65 | 14,6 | 48.5 | 57.6 | 0.55 | 1.00 | 0.923 | 0.929 | 0.993 | 0.853 | 1610,86 | 48 by 52 |
| 1893 | 13.2 | 0.92 | 0.91 | 1.01 | 1.01 | 1.01 | 0.019 | 1.58 | 13,0 | 48.6 | 57.1 | 0.56 | 1.00 | 0.908 | 0.907 | 1.002 | 0.849 | 62,994 | 36 by 52 |
| 1893 + 1/2 | 12.8 | 0.89 | 0.89 | 1.00 | 1.00 | 1.00 | 0.018 | 1.88 | 15,7 | 48.7 | 56.8 | 0.56 | 1.00 | 0.891 | 0.891 | 1.001 | 0.844 | 1842,842 | 64 by 48 |
| 1894 | 12.4 | 0.87 | 0.87 | 1.00 | 1.00 | 1.00 | 0.020 | 2.07 | 0,6 | 48.8 | 57.1 | 0.56 | 1.00 | 0.873 | 0.873 | 1.000 | 0.841 | 54,738 | 48 by 132 |
| 1894 + 1/2 | 12.3 | 0.85 | 0.84 | 1.00 | 1.00 | 1.00 | 0.028 | 1.55 | 10,0 | 48.9 | 56.8 | 0.56 | 0.99 | 0.855 | 0.853 | 1.003 | 0.837 | 454,874 | 48 by 56 |
| 1895 | 11.9 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.027 | 1.56 | 10,0 | 48.9 | 56.2 | 0.57 | 0.99 | 0.832 | 0.835 | 0.996 | 0.832 | 954,90 | 60 by 40 |
| 1895 + 1/2 | 11.8 | 0.80 | 0.80 | 1.00 | 1.00 | 1.00 | 0.024 | 1.51 | 13,0 | 48.8 | 55.9 | 0.57 | 1.01 | 0.816 | 0.816 | 0.999 | 0.827 | 1846,718 | 48 by 48 |
| 1896 | 11.4 | 0.78 | 0.78 | 1.00 | 1.00 | 1.00 | 0.030 | 1.61 | 9,8 | 48.6 | 55.3 | 0.57 | 0.99 | 0.800 | 0.796 | 1.004 | 0.823 | 1074,958 | 164 by 112 |
| 1896 + 1/2 | 11.2 | 0.76 | 0.76 | 1.00 | 1.00 | 1.00 | 0.015 | 1.32 | 10,0 | 48.6 | 54.3 | 0.58 | 1.00 | 0.777 | 0.781 | 0.995 | 0.819 | 978,102 | 52 by 36 |
| 1897 | 10.9 | 0.74 | 0.75 | 1.00 | 0.99 | 0.99 | 0.027 | 1.31 | 13,0 | 49.1 | 53.9 | 0.58 | 1.00 | 0.762 | 0.766 | 0.995 | 0.815 | 1658,114 | 116 by 56 |
| 1897 + 1/2 | 10.5 | 0.73 | 0.73 | 1.00 | 1.01 | 1.00 | 0.018 | 1.40 | 9,8 | 48.7 | 53.3 | 0.58 | 1.00 | 0.755 | 0.754 | 1.000 | 0.811 | 1058,990 | 108 by 88 |
| 1898 | 10.4 | 0.72 | 0.72 | 1.01 | 1.01 | 1.01 | 0.019 | 1.56 | 9,8 | 47.0 | 51.9 | 0.59 | 1.00 | 0.746 | 0.742 | 1.006 | 0.807 | 1058,1034 | 216 by 68 |
| 1898 + 1/2 | 10.0 | 0.70 | 0.71 | 1.00 | 0.99 | 0.99 | 0.038 | 1.29 | 6,6 | 45.8 | 50.4 | 0.59 | 0.98 | 0.730 | 0.730 | 0.999 | 0.802 | 1578,954 | 68 by 52 |
| 1899 | 9.7 | 0.69 | 0.70 | 0.99 | 1.01 | 0.99 | 0.000 | 1.19 | 5,6 | 44.3 | 48.7 | 0.59 | 1.01 | 0.715 | 0.721 | 0.991 | 0.800 | 214,922 | 44 by 52 |
| 1899 + 1/2 | 9.3 | 0.69 | 0.68 | 1.00 | 1.00 | 1.00 | 0.028 | 1.43 | 13,8 | 42.8 | 46.7 | 0.60 | 0.99 | 0.712 | 0.707 | 1.007 | 0.796 | 1610,978 | 76 by 60 |
| 1900 | 9.1 | 0.67 | 0.68 | 0.98 | 0.98 | 0.98 | 0.019 | 1.22 | 14,2 | 41.1 | 44.4 | 0.60 | 1.01 | 0.699 | 0.700 | 0.998 | 0.792 | 1150,1042 | 48 by 32 |
| 1900 + 1/2 | 8.9 | 0.67 | 0.68 | 0.99 | 0.99 | 0.99 | 0.025 | 1.51 | 13,8 | 38.9 | 41.9 | 0.60 | 1.00 | 0.689 | 0.694 | 0.992 | 0.789 | 1650,1002 | 92 by 48 |
| 1901 | 8.7 | 0.67 | 0.67 | 0.99 | 1.00 | 0.99 | 0.007 | 1.56 | 13,8 | 36.5 | 39.2 | 0.60 | 1.00 | 0.689 | 0.689 | 0.999 | 0.786 | 1642,1014 | 88 by 52 |
| 1901 + 1/2 | 8.5 | 0.67 | 0.67 | 1.00 | 1.00 | 1.00 | 0.023 | 1.58 | 14,7 | 33.2 | 36.1 | 0.61 | 1.00 | 0.689 | 0.688 | 1.002 | 0.783 | 1714,874 | 72 by 64 |
| 1902 | 8.1 | 0.68 | 0.67 | 1.01 | 1.01 | 1.01 | 0.012 | 1.80 | 14,7 | 30.3 | 33.0 | 0.61 | 0.99 | 0.688 | 0.685 | 1.004 | 0.780 | 1778,182 | 64 by 48 |
| 1902 + 1/2 | 8.0 | 0.67 | 0.67 | 1.00 | 0.99 | 0.99 | 0.019 | 1.94 | 14,7 | 27.3 | 29.7 | 0.62 | 0.99 | 0.681 | 0.682 | 0.998 | 0.778 | 1750,894 | 84 by 60 |
| 1903 | 7.6 | 0.67 | 0.67 | 1.00 | 1.01 | 1.00 | 0.004 | 1.82 | 14,7 | 24.2 | 26.6 | 0.62 | 1.00 | 0.676 | 0.675 | 1.001 | 0.774 | 1774,902 | 88 by 52 |
| 1903 + 1/2 | 7.4 | 0.67 | 0.67 | 1.01 | 1.02 | 1.01 | 0.017 | 2.07 | 15,7 | 21.4 | 23.3 | 0.63 | 1.01 | 0.669 | 0.670 | 1.000 | 0.774 | 1226,950 | 64 by 48 |
| 1904 | 7.2 | 0.67 | 0.66 | 1.01 | 1.01 | 1.01 | 0.017 | 2.41 | 15,7 | 18.3 | 20.0 | 0.63 | 1.01 | 0.663 | 0.662 | 1.002 | 0.769 | 102,938 | 56 by 60 |
| 1904 + 1/2 | 6.9 | 0.65 | 0.63 | 1.03 | 1.03 | 1.03 | 0.018 | 2.47 | 15,7 | 15.3 | 16.9 | 0.64 | 1.00 | 0.655 | 0.636 | 1.030 | 0.768 | 1858,934 | 156 by 88 |
| 1905 | 6.7 | 0.59 | 0.59 | 1.00 | 0.98 | 0.98 | 0.023 | 2.17 | 15,7 | 12.4 | 13.8 | 0.64 | 0.99 | 0.608 | 0.611 | 0.995 | 0.765 | 1682,490 | 80 by 60 |
| 1905 + 1/2 | 6.3 | 0.53 | 0.54 | 0.98 | 1.00 | 0.98 | 0.006 | 1.71 | 15,7 | 9.9 | 11.1 | 0.65 | 1.00 | 0.568 | 0.568 | 1.001 | 0.763 | 902,890 | 80 by 68 |
| 1906 | 6.1 | 0.50 | 0.50 | 1.00 | 1.00 | 1.00 | 0.003 | 1.46 | 3,8 | 7.6 | 8.6 | 0.65 | 0.99 | 0.527 | 0.529 | 0.997 | 0.760 | 1118,998 | 84 by 68 |
| 1906 + 1/2 | 5.8 | 0.46 | 0.47 | 0.99 | 0.99 | 0.99 | 0.009 | 1.65 | 3,8 | 5.6 | 6.4 | 0.66 | 1.00 | 0.490 | 0.494 | 0.991 | 0.758 | 1338,946 | 64 by 76 |
| 1907 | 5.6 | 0.44 | 0.44 | 1.00 | 1.00 | 1.00 | 0.012 | 1.46 | 15,8 | 4.0 | 7.3 | 0.66 | 1.00 | 0.462 | 0.461 | 1.001 | 0.758 | 1486,1030 | 56 by 48 |
| 1907 + 1/2 | 5.2 | 0.41 | 0.41 | 0.99 | 1.00 | 0.99 | 0.013 | 1.66 | 15,8 | 2.7 | 7.4 | 0.67 | 1.00 | 0.433 | 0.434 | 0.996 | 0.755 | 954,1030 | 56 by 52 |
| 1908 | 5.0 | 0.39 | 0.39 | 1.00 | 0.99 | 0.99 | 0.027 | 1.51 | 15,8 | 1.9 | 5.7 | 0.68 | 1.00 | 0.407 | 0.408 | 0.997 | 0.754 | 1346,962 | 60 by 72 |
| 1908 + 1/2 | 4.8 | 0.37 | 0.38 | 1.00 | 0.99 | 0.99 | 0.027 | 1.60 | 1,0 | 1.6 | 4.2 | 0.68 | 0.99 | 0.384 | 0.389 | 0.988 | 0.755 | 1382,1018 | 60 by 64 |
| 1909 | 4.5 | 0.36 | 0.35 | 1.01 | 1.03 | 1.01 | 0.014 | 1.45 | 0,0 | 1.4 | 3.0 | 0.69 | 1.00 | 0.371 | 0.365 | 1.017 | 0.752 | 30,346 | 80 by 56 |
| 1909 + 1/2 | 4.3 | 0.33 | 0.34 | 0.98 | 0.97 | 0.97 | 0.021 | 1.34 | 0,0 | 1.2 | 2.4 | 0.70 | 1.00 | 0.345 | 0.353 | 0.978 | 0.753 | 1346,982 | 92 by 136 |
| 1910 | 3.9 | 0.32 | 0.33 | 0.98 | 0.99 | 0.98 | 0.004 | 1.34 | 9,8 | 1.1 | 2.3 | 0.70 | 1.00 | 0.334 | 0.340 | 0.981 | 0.750 | 1118,990 | 140 by 92 |
| 1910 + 1/2 | 3.8 | 0.32 | 0.32 | 1.01 | 1.01 | 1.01 | 0.006 | 1.21 | 12,6 | 1.1 | 2.2 | 0.71 | 1.00 | 0.335 | 0.332 | 1.007 | 0.750 | 1478,806 | 84 by 92 |
| 1911 | 3.4 | 0.32 | 0.32 | 1.00 | 1.00 | 1.00 | 0.006 | 1.30 | 15,8 | 1.0 | 2.2 | 0.71 | 1.00 | 0.331 | 0.332 | 0.997 | 0.750 | 1126,1006 | 112 by 68 |
| 1911 + 1/2 | 3.2 | 0.32 | 0.32 | 1.00 | 0.99 | 0.99 | 0.007 | 1.23 | 1,0 | 0.9 | 2.0 | 0.72 | 0.99 | 0.330 | 0.329 | 1.003 | 0.751 | 842,930 | 108 by 84 |
| 1912 | 3.0 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 15,5 | 0.9 | 2.0 | 0.73 | 1.01 | 0.327 | 0.328 | 0.998 | 0.753 | 1310,906 | 76 by 72 |
| 1912 + 1/2 | 2.7 | 0.31 | 0.31 | 1.01 | 1.01 | 1.01 | 0.002 | 1.39 | 13,8 | 0.8 | 1.7 | 0.73 | 1.00 | 0.326 | 0.324 | 1.006 | 0.753 | 1614,1070 | 64 by 28 |
| 1913 | 2.5 | 0.31 | 0.31 | 0.99 | 0.99 | 0.99 | 0.001 | 1.15 | 1,0 | 0.8 | 1.8 | 0.74 | 1.00 | 0.320 | 0.323 | 0.990 | 0.752 | 1422,930 | 208 by 108 |
| 1913 + 1/2 | 2.3 | 0.31 | 0.31 | 1.01 | 1.00 | 1.00 | 0.003 | 1.15 | 0,0 | 0.8 | 1.8 | 0.74 | 1.00 | 0.320 | 0.319 | 1.006 | 0.754 | 1710,906 | 60 by 56 |
| 1914 | 2.0 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 12,4 | 0.8 | 1.5 | 0.75 | 1.00 | 0.317 | 0.318 | 0.997 | 0.756 | 1198,1046 | 108 by 60 |
| 1914 + 1/2 | 1.8 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 9,2 | 0.7 | 1.4 | 0.75 | 1.01 | 0.316 | 0.315 | 1.002 | 0.756 | 1326,922 | 88 by 104 |
| 1915 | 1.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 13,2 | 0.7 | 1.6 | 0.75 | 1.00 | 0.314 | 0.314 | 0.998 | 0.756 | 1342,950 | 120 by 96 |
| 1915 + 1/2 | 1.3 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.15 | 13,2 | 0.7 | 1.4 | 0.76 | 1.01 | 0.313 | 0.312 | 1.001 | 0.756 | 1366,990 | 56 by 60 |
| 1916 | 1.1 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.22 | 13,2 | 0.7 | 1.5 | 0.76 | 1.00 | 0.311 | 0.312 | 0.996 | 0.756 | 1190,1058 | 76 by 48 |
| 1916 + 1/2 | 0.9 | 0.30 | 0.30 | 0.98 | 0.98 | 0.98 | 0.000 | 1.13 | 13,2 | 0.6 | 1.4 | 0.76 | 0.99 | 0.309 | 0.312 | 0.989 | 0.756 | 1434,630 | 68 by 60 |
| 1917 | 0.7 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 11,5 | 0.7 | 1.3 | 0.76 | 0.99 | 0.312 | 0.312 | 1.000 | 0.756 | 1274,910 | 84 by 68 |
| 1917 + 1/2 | 0.6 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.11 | 1,8 | 0.6 | 1.3 | 0.76 | 0.99 | 0.312 | 0.312 | 1.000 | 0.756 | 1318,922 | 76 by 96 |
| 1918 | 0.6 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 10,7 | 0.6 | 1.4 | 0.76 | 0.98 | 0.313 | 0.314 | 0.999 | 0.756 | 1366,1006 | 92 by 84 |
| 1918 + 1/2 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 10,7 | 0.6 | 1.5 | 0.76 | 0.97 | 0.316 | 0.314 | 1.006 | 0.757 | 1258,898 | 64 by 60 |
| 1919 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 10,8 | 0.6 | 1.5 | 0.76 | 0.97 | 0.315 | 0.316 | 0.997 | 0.756 | 1210,1070 | 52 by 24 |
| 1919 + 1/2 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 4,4 | 0.7 | 1.5 | 0.76 | 0.97 | 0.316 | 0.315 | 1.003 | 0.757 | 1202,1070 | 80 by 44 |
| 1920 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 9,8 | 0.6 | 1.4 | 0.76 | 0.98 | 0.316 | 0.315 | 1.002 | 0.757 | 1166,1070 | 104 by 56 |
| 1920 + 1/2 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 12,6 | 0.6 | 1.3 | 0.76 | 0.98 | 0.315 | 0.315 | 1.000 | 0.756 | 1330,950 | 68 by 68 |
| 1921 | 0.5 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.06 | 12,6 | 0.6 | 1.4 | 0.76 | 0.98 | 0.314 | 0.315 | 0.995 | 0.756 | 1006,1030 | 60 by 56 |
| 1921 + 1/2 | 0.5 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 9,8 | 0.7 | 1.3 | 0.76 | 0.97 | 0.314 | 0.315 | 0.997 | 0.756 | 1190,1054 | 64 by 56 |
| 1922 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 11,7 | 0.7 | 1.4 | 0.76 | 0.98 | 0.316 | 0.315 | 1.005 | 0.756 | 1194,1070 | 56 by 28 |
| 1922 + 1/2 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 12,6 | 0.7 | 1.3 | 0.76 | 0.99 | 0.315 | 0.316 | 0.997 | 0.756 | 1462,834 | 76 by 64 |
| 1923 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 1,8 | 0.6 | 1.4 | 0.76 | 0.99 | 0.316 | 0.316 | 0.998 | 0.757 | 1010,978 | 112 by 68 |
| 1923 + 1/2 | 0.5 | 0.30 | 0.30 | 1.01 | 1.01 | 1.01 | 0.000 | 1.10 | 4,4 | 0.7 | 1.3 | 0.76 | 0.99 | 0.318 | 0.316 | 1.006 | 0.756 | 1190,1070 | 64 by 72 |
| 1924 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 11,7 |  |  |  | 0.99 | 0.316 | 0.317 | 0.999 | 0.756 | 1322,950 | 88 by 60 |
| 1924 + 1/2 | 0.6 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 10,7 |  |  |  | 0.99 | 0.316 | 0.317 | 0.996 | 0.756 | 1266,914 | 124 by 104 |
| 1925 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 11,0 |  |  |  | 0.99 | 0.318 | 0.316 | 1.007 | 0.756 | 1254,922 | 72 by 68 |
| 1925 + 1/2 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 0,3 |  |  |  | 1.00 | 0.315 | 0.316 | 0.998 | 0.756 | 1322,950 | 52 by 52 |
| 1926 | 0.5 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.09 | 3,2 |  |  |  | 1.00 | 0.315 | 0.316 | 0.998 | 0.756 | 1334,978 | 80 by 92 |
| 1926 + 1/2 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 7,0 |  |  |  | 1.00 | 0.316 | 0.315 | 1.000 | 0.756 | 1114,1070 | 80 by 36 |
| 1927 | 0.6 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 0,7 |  |  |  | 1.00 | 0.316 | 0.316 | 0.999 | 0.756 | 1198,1026 | 60 by 60 |
| 1927 + 1/2 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 4,4 |  |  |  | 1.00 | 0.317 | 0.317 | 1.000 | 0.756 | 1318,990 | 148 by 116 |
| 1928 | 0.6 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 12,4 |  |  |  | 1.00 | 0.317 | 0.316 | 1.003 | 0.756 | 1102,1066 | 104 by 100 |
| 1928 + 1/2 | 0.6 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 10,7 |  |  |  | 1.00 | 0.317 | 0.317 | 1.001 | 0.756 | 1170,1070 | 60 by 24 |
| 1929 | 0.5 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.08 | 4,7 |  |  |  | 1.00 | 0.316 | 0.317 | 0.996 | 0.755 | 1242,906 | 52 by 76 |
| 1929 + 1/2 | 0.6 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 6,8 |  |  |  | 1.00 | 0.317 | 0.318 | 0.997 | 0.756 | 634,922 | 64 by 64 |
| 1930 | 0.6 | 0.30 | 0.30 | 1.01 | 1.01 | 1.01 | 0.000 | 1.07 | 5,7 |  |  |  | 1.00 | 0.319 | 0.317 | 1.006 | 0.755 | 330,442 | 104 by 76 |
| 1930 + 1/2 | 0.5 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 4,1 |  |  |  | 1.00 | 0.319 | 0.318 | 1.001 | 0.756 | 878,610 | 68 by 68 |
| 1931 | 0.6 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.06 | 11,8 |  |  |  | 1.00 | 0.318 | 0.319 | 0.997 | 0.756 | 1914,818 | 40 by 48 |
| 1931 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

### rise (earth.rise, frames 2100 to 2174, window 2088 to 2186, 198 draft frames at rate 2)

Largest level step: 0.25 at frame 2139 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.14 from frame 2183 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 6.79 from frame 2184 to the next, block column 13 row 0 from the top left, shown, not judged.
Largest change in place: 47.2 from frame 2118 + 1/2 to 8 film frames later, most at pixel 772, 408 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.38 from frame 2142 to 8 film frames later, most at pixel 916, 16, band 8.4 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 2088 to 2099 + 1/2): change 3.1, pattern 0.06.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 2172 + 1/2 in /home/user/workspace/work/p6/he9/04/earth-rise-p2of2-pops.png, frame 2182 in /home/user/workspace/work/p6/he9/04/earth-rise-p2of2-pops.png, frame 2182 + 1/2 in /home/user/workspace/work/p6/he9/04/earth-rise-p2of2-pops.png, frame 2183 + 1/2 in /home/user/workspace/work/p6/he9/04/earth-rise-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 2110 + 1/2 in no panel (a slice --frames 4221-4221 draws it), frame 2118 + 1/2 in no panel (a slice --frames 4237-4237 draws it), frame 2142 in /home/user/workspace/work/p6/he9/04/earth-rise-p2of2-changes.png, frame 2156 + 1/2 in /home/user/workspace/work/p6/he9/04/earth-rise-p2of2-changes.png.

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2088 | 106.83 |  | 1.2 | 1.83 | 1.82 | 1.00 | 1.00 | 1.00 | 0.002 | 1.22 | 15,0 | 3.1 | 5.1 | 0.73 | 0.06 | 0.73 | 8.0 |
| 2088 + 1/2 | 106.89 | 0.00 | 1.1 | 1.80 | 1.81 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 9,7 | 3.0 | 5.4 | 0.73 | 0.06 | 0.73 | 8.0 |
| 2089 | 106.94 | 0.00 | 1.1 | 1.79 | 1.79 | 1.00 | 1.00 | 1.00 | 0.002 | 1.17 | 10,5 | 3.0 | 6.1 | 0.74 | 0.06 | 0.73 | 8.0 |
| 2089 + 1/2 | 106.99 | 0.00 | 1.1 | 1.77 | 1.77 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 10,7 | 3.0 | 6.5 | 0.74 | 0.06 | 0.73 | 8.0 |
| 2090 | 107.04 | 0.00 | 1.1 | 1.76 | 1.76 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 9,7 | 3.0 | 6.6 | 0.74 | 0.05 | 0.73 | 8.0 |
| 2090 + 1/2 | 107.08 | 0.00 | 1.1 | 1.74 | 1.73 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 10,5 | 3.0 | 6.2 | 0.74 | 0.05 | 0.73 | 8.0 |
| 2091 | 107.12 | 0.00 | 1.0 | 1.71 | 1.71 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 10,7 | 2.9 | 5.6 | 0.74 | 0.05 | 0.73 | 8.0 |
| 2091 + 1/2 | 107.16 | 0.00 | 1.0 | 1.68 | 1.69 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 10,7 | 2.9 | 6.9 | 0.74 | 0.05 | 0.73 | 8.0 |
| 2092 | 107.19 | 0.00 | 1.0 | 1.66 | 1.66 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 11,0 | 2.9 | 6.8 | 0.74 | 0.05 | 0.73 | 8.1 |
| 2092 + 1/2 | 107.22 | 0.00 | 1.0 | 1.63 | 1.64 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 11,0 | 2.8 | 6.2 | 0.74 | 0.05 | 0.73 | 8.1 |
| 2093 | 107.25 | 0.00 | 1.0 | 1.61 | 1.61 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 3,0 | 2.8 | 5.3 | 0.74 | 0.04 | 0.73 | 8.1 |
| 2093 + 1/2 | 107.27 | 0.01 | 0.9 | 1.58 | 1.58 | 1.00 | 1.00 | 1.00 | 0.002 | 1.11 | 11,7 | 2.8 | 4.7 | 0.74 | 0.04 | 0.73 | 8.0 |
| 2094 | 107.29 | 0.00 | 0.9 | 1.56 | 1.56 | 1.00 | 1.00 | 1.00 | 0.001 | 1.09 | 13,6 | 2.7 | 4.6 | 0.74 | 0.04 | 0.73 | 8.0 |
| 2094 + 1/2 | 107.31 | 0.00 | 1.0 | 1.54 | 1.53 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 6,2 | 2.7 | 4.7 | 0.74 | 0.04 | 0.73 | 8.0 |
| 2095 | 107.33 | 0.00 | 0.9 | 1.51 | 1.52 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 10,0 | 2.7 | 5.0 | 0.74 | 0.04 | 0.73 | 8.2 |
| 2095 + 1/2 | 107.35 | 0.00 | 0.9 | 1.50 | 1.50 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 14,0 | 2.8 | 5.1 | 0.74 | 0.04 | 0.73 | 8.1 |
| 2096 | 107.36 | 0.00 | 0.9 | 1.47 | 1.50 | 0.98 | 0.98 | 0.98 | 0.000 | 1.08 | 8,0 | 2.9 | 5.2 | 0.74 | 0.05 | 0.73 | 8.1 |
| 2096 + 1/2 | 107.37 | 0.00 | 0.9 | 1.45 | 1.50 | 0.97 | 0.97 | 0.97 | 0.000 | 1.11 | 4,0 | 3.0 | 5.0 | 0.74 | 0.05 | 0.73 | 8.2 |
| 2097 | 107.38 | 0.00 | 0.9 | 1.45 | 1.50 | 0.96 | 0.96 | 0.96 | 0.000 | 1.21 | 0,0 | 3.2 | 5.2 | 0.74 | 0.05 | 0.73 | 8.2 |
| 2097 + 1/2 | 107.39 | 0.00 | 0.9 | 1.43 | 1.50 | 0.95 | 0.95 | 0.95 | 0.000 | 1.06 | 11,5 | 3.5 | 6.3 | 0.74 | 0.05 | 0.73 | 8.2 |
| 2098 | 107.40 | 0.00 | 0.9 | 1.42 | 1.50 | 0.94 | 0.94 | 0.94 | 0.000 | 1.20 | 0,0 | 3.6 | 7.5 | 0.74 | 0.05 | 0.73 | 8.2 |
| 2098 + 1/2 | 107.41 | 0.00 | 0.9 | 1.41 | 1.50 | 0.94 | 0.94 | 0.94 | 0.000 | 1.12 | 5,0 | 3.8 | 8.2 | 0.74 | 0.06 | 0.73 | 8.2 |
| 2099 | 107.42 | 0.00 | 0.8 | 1.40 | 1.50 | 0.93 | 0.93 | 0.93 | 0.000 | 1.12 | 1,0 | 4.0 | 9.6 | 0.74 | 0.06 | 0.73 | 8.2 |
| 2099 + 1/2 | 107.43 | 0.00 | 0.9 | 1.40 | 1.50 | 0.93 | 0.93 | 0.93 | 0.002 | 1.12 | 6,2 | 4.4 | 10.4 | 0.74 | 0.07 | 0.73 | 8.3 |
| 2100 first | 107.44 | 0.00 | 0.8 | 1.39 | 1.50 | 0.93 | 0.93 | 0.93 | 0.001 | 1.05 | 10,6 | 5.2 | 11.3 | 0.74 | 0.08 | 0.73 | 8.3 |
| 2100 + 1/2 | 107.45 | 0.00 | 0.8 | 1.39 | 1.50 | 0.92 | 0.92 | 0.92 | 0.000 | 1.09 | 2,7 | 6.2 | 12.5 | 0.74 | 0.10 | 0.73 | 8.3 |
| 2101 | 107.45 | 0.00 | 0.9 | 1.40 | 1.50 | 0.93 | 0.93 | 0.93 | 0.000 | 1.12 | 6,7 | 7.5 | 12.8 | 0.74 | 0.12 | 0.73 | 8.2 |
| 2101 + 1/2 | 107.46 | 0.00 | 0.9 | 1.41 | 1.50 | 0.94 | 0.94 | 0.94 | 0.000 | 1.18 | 5,8 | 9.1 | 13.2 | 0.74 | 0.14 | 0.73 | 8.2 |
| 2102 | 107.47 | 0.00 | 1.0 | 1.42 | 1.50 | 0.94 | 0.94 | 0.94 | 0.000 | 1.23 | 5,7 | 11.0 | 12.9 | 0.74 | 0.16 | 0.73 | 8.2 |
| 2102 + 1/2 | 107.50 | 0.01 | 1.1 | 1.44 | 1.50 | 0.96 | 0.96 | 0.96 | 0.004 | 1.32 | 6,7 | 13.2 | 15.5 | 0.74 | 0.19 | 0.73 | 8.3 |
| 2103 | 107.53 | 0.00 | 1.3 | 1.47 | 1.50 | 0.98 | 0.98 | 0.98 | 0.000 | 1.34 | 5,7 | 15.6 | 18.1 | 0.74 | 0.20 | 0.73 | 8.7 |
| 2103 + 1/2 | 107.57 | 0.00 | 1.5 | 1.50 | 1.52 | 0.98 | 0.98 | 0.98 | 0.000 | 1.33 | 5,7 | 18.1 | 20.7 | 0.74 | 0.21 | 0.73 | 8.8 |
| 2104 | 107.61 | 0.00 | 1.8 | 1.55 | 1.55 | 1.00 | 1.00 | 1.00 | 0.000 | 1.50 | 15,7 | 20.5 | 23.3 | 0.74 | 0.22 | 0.74 | 8.8 |
| 2104 + 1/2 | 107.65 | 0.01 | 2.0 | 1.60 | 1.60 | 1.00 | 1.00 | 1.00 | 0.000 | 1.57 | 13,8 | 22.9 | 25.8 | 0.74 | 0.22 | 0.74 | 8.8 |
| 2105 | 107.68 | 0.00 | 2.4 | 1.65 | 1.65 | 1.00 | 1.00 | 1.00 | 0.001 | 1.58 | 13,8 | 25.3 | 28.5 | 0.74 | 0.23 | 0.74 | 8.8 |
| 2105 + 1/2 | 107.70 | 0.01 | 2.6 | 1.71 | 1.70 | 1.01 | 1.00 | 1.00 | 0.016 | 1.64 | 13,8 | 27.5 | 31.1 | 0.74 | 0.23 | 0.74 | 8.8 |
| 2106 | 107.71 | 0.01 | 2.9 | 1.74 | 1.76 | 0.99 | 0.99 | 0.99 | 0.005 | 1.84 | 12,8 | 29.7 | 33.7 | 0.74 | 0.23 | 0.74 | 8.8 |
| 2106 + 1/2 | 107.70 | 0.01 | 3.2 | 1.81 | 1.80 | 1.01 | 1.01 | 1.01 | 0.003 | 1.73 | 12,8 | 31.9 | 35.9 | 0.74 | 0.23 | 0.74 | 9.2 |
| 2107 | 107.68 | 0.01 | 3.4 | 1.86 | 1.86 | 1.00 | 1.00 | 1.00 | 0.003 | 1.85 | 12,8 | 34.0 | 37.9 | 0.74 | 0.23 | 0.74 | 9.2 |
| 2107 + 1/2 | 107.63 | 0.01 | 3.9 | 1.91 | 1.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.70 | 12,8 | 35.9 | 39.9 | 0.75 | 0.23 | 0.74 | 9.3 |
| 2108 | 107.55 | 0.01 | 4.1 | 1.96 | 1.96 | 1.00 | 1.00 | 1.00 | 0.008 | 1.68 | 11,7 | 37.6 | 42.0 | 0.75 | 0.23 | 0.75 | 9.3 |
| 2108 + 1/2 | 107.45 | 0.02 | 4.4 | 2.00 | 2.01 | 0.99 | 0.99 | 0.99 | 0.002 | 1.67 | 10,7 | 39.3 | 43.3 | 0.75 | 0.23 | 0.75 | 9.3 |
| 2109 | 107.32 | 0.01 | 4.8 | 2.07 | 2.05 | 1.01 | 1.01 | 1.01 | 0.003 | 1.87 | 14,5 | 40.7 | 44.9 | 0.75 | 0.24 | 0.75 | 9.3 |
| 2109 + 1/2 | 107.16 | 0.00 | 5.1 | 2.11 | 2.13 | 0.99 | 0.99 | 0.99 | 0.008 | 1.79 | 10,7 | 41.9 | 46.3 | 0.75 | 0.24 | 0.75 | 9.4 |
| 2110 | 106.99 | 0.01 | 5.5 | 2.19 | 2.14 | 1.02 | 1.02 | 1.02 | 0.012 | 1.73 | 0,2 | 42.9 | 47.4 | 0.76 | 0.23 | 0.76 | 9.3 |
| 2110 + 1/2 | 106.79 | 0.01 | 5.8 | 2.20 | 2.18 | 1.01 | 1.00 | 1.00 | 0.015 | 2.29 | 0,2 | 43.7 | 48.3 | 0.76 | 0.23 | 0.76 | 9.3 |
| 2111 | 106.59 | 0.00 | 6.2 | 2.21 | 2.19 | 1.01 | 1.01 | 1.01 | 0.006 | 2.09 | 0,2 | 44.3 | 49.1 | 0.76 | 0.22 | 0.76 | 9.3 |
| 2111 + 1/2 | 106.39 | 0.02 | 6.5 | 2.20 | 2.19 | 1.01 | 1.00 | 1.00 | 0.017 | 1.86 | 13,4 | 44.7 | 49.7 | 0.76 | 0.21 | 0.76 | 9.2 |
| 2112 | 106.16 | 0.00 | 6.9 | 2.19 | 2.19 | 1.00 | 1.00 | 1.00 | 0.009 | 1.97 | 0,2 | 45.2 | 50.5 | 0.77 | 0.21 | 0.77 | 9.2 |
| 2112 + 1/2 | 105.92 | 0.01 | 7.1 | 2.19 | 2.19 | 1.00 | 1.00 | 1.00 | 0.011 | 1.82 | 0,2 | 45.6 | 51.0 | 0.77 | 0.22 | 0.77 | 9.2 |
| 2113 | 105.66 | 0.01 | 7.5 | 2.19 | 2.19 | 1.00 | 1.00 | 1.00 | 0.005 | 1.81 | 0,2 | 46.0 | 51.6 | 0.77 | 0.22 | 0.77 | 9.2 |
| 2113 + 1/2 | 105.38 | 0.02 | 7.6 | 2.19 | 2.19 | 1.00 | 1.00 | 1.00 | 0.012 | 1.85 | 3,8 | 46.2 | 52.5 | 0.78 | 0.22 | 0.78 | 9.3 |
| 2114 | 105.06 | 0.02 | 8.1 | 2.19 | 2.20 | 1.00 | 1.00 | 1.00 | 0.030 | 1.98 | 3,8 | 46.4 | 52.8 | 0.78 | 0.22 | 0.78 | 9.2 |
| 2114 + 1/2 | 104.71 | 0.01 | 8.2 | 2.18 | 2.20 | 0.99 | 0.99 | 0.99 | 0.026 | 1.86 | 3,8 | 46.5 | 53.2 | 0.78 | 0.21 | 0.78 | 8.8 |
| 2115 | 104.35 | 0.01 | 8.6 | 2.19 | 2.20 | 0.99 | 1.00 | 0.99 | 0.012 | 1.77 | 3,8 | 46.7 | 53.5 | 0.79 | 0.21 | 0.78 | 8.7 |
| 2115 + 1/2 | 103.96 | 0.04 | 8.8 | 2.20 | 2.22 | 0.99 | 1.00 | 0.99 | 0.004 | 1.63 | 3,8 | 46.8 | 53.6 | 0.79 | 0.21 | 0.79 | 8.4 |
| 2116 | 103.51 | 0.03 | 9.0 | 2.23 | 2.22 | 1.00 | 1.00 | 1.00 | 0.019 | 1.71 | 14,1 | 46.9 | 53.8 | 0.79 | 0.21 | 0.79 | 8.8 |
| 2116 + 1/2 | 102.99 | 0.03 | 9.4 | 2.24 | 2.25 | 1.00 | 1.00 | 1.00 | 0.006 | 2.02 | 14,1 | 47.0 | 53.7 | 0.79 | 0.21 | 0.79 | 8.2 |
| 2117 | 102.41 | 0.01 | 9.8 | 2.27 | 2.26 | 1.00 | 1.01 | 1.00 | 0.008 | 2.00 | 14,1 | 47.1 | 53.8 | 0.80 | 0.21 | 0.80 | 9.0 |
| 2117 + 1/2 | 101.82 | 0.03 | 10.2 | 2.28 | 2.28 | 1.00 | 1.00 | 1.00 | 0.016 | 1.82 | 14,1 | 47.2 | 53.7 | 0.80 | 0.21 | 0.80 | 9.1 |
| 2118 | 101.17 | 0.01 | 10.5 | 2.30 | 2.29 | 1.00 | 1.01 | 1.00 | 0.009 | 1.84 | 0,3 | 47.2 | 53.7 | 0.80 | 0.22 | 0.80 | 9.1 |
| 2118 + 1/2 | 100.49 | 0.01 | 10.9 | 2.30 | 2.30 | 1.00 | 1.00 | 1.00 | 0.029 | 2.10 | 13,1 | 47.2 | 53.2 | 0.81 | 0.23 | 0.80 | 9.1 |
| 2119 | 99.80 | 0.01 | 11.3 | 2.31 | 2.32 | 1.00 | 1.00 | 1.00 | 0.025 | 2.01 | 10,8 | 47.0 | 52.6 | 0.81 | 0.23 | 0.80 | 9.2 |
| 2119 + 1/2 | 99.13 | 0.01 | 11.8 | 2.34 | 2.33 | 1.00 | 1.00 | 1.00 | 0.039 | 2.47 | 10,8 | 46.8 | 52.2 | 0.81 | 0.25 | 0.80 | 9.3 |
| 2120 | 98.47 | 0.02 | 12.1 | 2.35 | 2.35 | 1.00 | 1.01 | 1.00 | 0.024 | 2.26 | 10,8 | 46.5 | 51.8 | 0.81 | 0.24 | 0.80 | 9.3 |
| 2120 + 1/2 | 97.84 | 0.03 | 12.3 | 2.37 | 2.36 | 1.01 | 1.00 | 1.00 | 0.042 | 2.02 | 10,8 | 46.1 | 51.5 | 0.81 | 0.23 | 0.80 | 9.4 |
| 2121 | 97.28 | 0.02 | 12.7 | 2.37 | 2.41 | 0.98 | 0.98 | 0.98 | 0.042 | 1.78 | 10,8 | 45.5 | 51.1 | 0.82 | 0.22 | 0.80 | 9.5 |
| 2121 + 1/2 | 96.76 | 0.01 | 13.1 | 2.44 | 2.41 | 1.01 | 1.01 | 1.01 | 0.042 | 1.99 | 2,3 | 45.1 | 50.6 | 0.82 | 0.21 | 0.81 | 9.4 |
| 2122 | 96.26 | 0.01 | 13.5 | 2.45 | 2.47 | 0.99 | 1.00 | 0.99 | 0.026 | 1.96 | 2,3 | 44.4 | 49.9 | 0.82 | 0.20 | 0.81 | 9.4 |
| 2122 + 1/2 | 95.78 | 0.00 | 13.8 | 2.50 | 2.50 | 1.00 | 1.00 | 1.00 | 0.033 | 1.91 | 2,3 | 43.7 | 48.8 | 0.82 | 0.19 | 0.81 | 9.4 |
| 2123 | 95.29 | 0.04 | 14.3 | 2.56 | 2.54 | 1.01 | 1.02 | 1.01 | 0.023 | 1.95 | 0,6 | 42.8 | 47.4 | 0.82 | 0.19 | 0.80 | 9.2 |
| 2123 + 1/2 | 94.87 | 0.04 | 14.6 | 2.57 | 2.58 | 1.00 | 0.99 | 0.99 | 0.045 | 2.17 | 0,6 | 42.0 | 47.1 | 0.83 | 0.19 | 0.81 | 9.0 |
| 2124 | 94.53 | 0.01 | 15.2 | 2.61 | 2.61 | 1.00 | 0.99 | 0.99 | 0.047 | 2.21 | 0,6 | 41.2 | 46.9 | 0.83 | 0.19 | 0.81 | 8.0 |
| 2124 + 1/2 | 94.18 | 0.01 | 15.9 | 2.65 | 2.66 | 1.00 | 1.01 | 1.00 | 0.036 | 2.58 | 0,6 | 40.5 | 47.0 | 0.83 | 0.19 | 0.81 | 8.0 |
| 2125 | 93.81 | 0.04 | 16.3 | 2.71 | 2.70 | 1.00 | 0.99 | 0.99 | 0.047 | 2.43 | 0,8 | 39.8 | 46.5 | 0.83 | 0.18 | 0.81 | 8.0 |
| 2125 + 1/2 | 93.53 | 0.05 | 16.9 | 2.75 | 2.73 | 1.01 | 1.01 | 1.01 | 0.037 | 2.69 | 0,7 | 40.2 | 46.2 | 0.83 | 0.19 | 0.81 | 8.0 |
| 2126 | 93.16 | 0.02 | 17.2 | 2.76 | 2.76 | 1.00 | 1.00 | 1.00 | 0.031 | 2.59 | 0,7 | 41.2 | 68.9 | 0.84 | 0.19 | 0.82 | 8.0 |
| 2126 + 1/2 | 92.82 | 0.04 | 17.0 | 2.78 | 2.76 | 1.00 | 1.00 | 1.00 | 0.030 | 2.42 | 0,8 | 42.0 | 67.6 | 0.84 | 0.20 | 0.82 | 8.0 |
| 2127 | 92.56 | 0.01 | 17.3 | 2.80 | 2.76 | 1.01 | 1.01 | 1.01 | 0.023 | 2.44 | 0,8 | 42.9 | 65.4 | 0.84 | 0.20 | 0.82 | 9.2 |
| 2127 + 1/2 | 92.33 | 0.00 | 17.6 | 2.83 | 2.76 | 1.02 | 1.03 | 1.02 | 0.017 | 2.51 | 1,6 | 42.8 | 63.3 | 0.85 | 0.21 | 0.83 | 9.2 |
| 2128 | 92.09 | 0.02 | 17.8 | 2.84 | 2.77 | 1.02 | 1.03 | 1.02 | 0.015 | 3.12 | 15,8 | 42.4 | 57.7 | 0.85 | 0.21 | 0.83 | 9.3 |
| 2128 + 1/2 | 91.81 | 0.15 | 18.1 | 2.89 | 2.78 | 1.04 | 1.05 | 1.04 | 0.005 | 2.97 | 15,8 | 41.6 | 53.2 | 0.85 | 0.21 | 0.84 | 9.3 |
| 2129 | 91.23 | 0.09 | 18.5 | 2.89 | 2.79 | 1.04 | 1.05 | 1.04 | 0.004 | 2.77 | 2,7 | 41.0 | 52.2 | 0.85 | 0.22 | 0.85 | 9.3 |
| 2129 + 1/2 | 90.46 | 0.06 | 18.7 | 2.91 | 2.80 | 1.04 | 1.06 | 1.04 | 0.004 | 3.10 | 6,0 | 40.6 | 52.8 | 0.85 | 0.22 | 0.85 | 9.4 |
| 2130 | 89.59 | 0.01 | 18.9 | 2.90 | 2.80 | 1.03 | 1.05 | 1.03 | 0.005 | 3.04 | 2,7 | 40.0 | 46.9 | 0.85 | 0.23 | 0.85 | 9.5 |
| 2130 + 1/2 | 88.70 | 0.05 | 19.1 | 2.86 | 2.80 | 1.02 | 1.03 | 1.02 | 0.007 | 2.83 | 2,6 | 39.8 | 47.1 | 0.85 | 0.21 | 0.85 | 9.4 |
| 2131 | 87.91 | 0.07 | 19.2 | 2.86 | 2.81 | 1.02 | 1.02 | 1.02 | 0.007 | 2.77 | 2,6 | 39.8 | 46.7 | 0.85 | 0.22 | 0.85 | 9.4 |
| 2131 + 1/2 | 87.25 | 0.03 | 19.3 | 2.85 | 2.81 | 1.01 | 1.01 | 1.01 | 0.014 | 2.85 | 3,7 | 40.3 | 52.9 | 0.85 | 0.20 | 0.84 | 9.4 |
| 2132 | 86.66 | 0.04 | 19.3 | 2.82 | 2.82 | 1.00 | 1.01 | 1.00 | 0.005 | 2.68 | 3,7 | 40.8 | 56.4 | 0.85 | 0.20 | 0.84 | 9.1 |
| 2132 + 1/2 | 86.14 | 0.09 | 19.4 | 2.82 | 2.83 | 1.00 | 1.00 | 1.00 | 0.012 | 2.75 | 3,6 | 41.8 | 56.7 | 0.84 | 0.16 | 0.83 | 8.8 |
| 2133 | 85.45 | 0.01 | 19.5 | 2.81 | 2.84 | 0.99 | 1.00 | 0.99 | 0.010 | 2.72 | 3,6 | 42.5 | 58.4 | 0.84 | 0.16 | 0.82 | 8.0 |
| 2133 + 1/2 | 84.72 | 0.08 | 19.4 | 2.80 | 2.85 | 0.98 | 0.99 | 0.98 | 0.011 | 2.86 | 3,6 | 42.3 | 52.3 | 0.84 | 0.15 | 0.83 | 8.5 |
| 2134 | 84.17 | 0.08 | 19.6 | 2.78 | 2.85 | 0.97 | 0.98 | 0.97 | 0.017 | 2.77 | 4,7 | 41.2 | 53.8 | 0.83 | 0.15 | 0.82 | 8.5 |
| 2134 + 1/2 | 83.78 | 0.06 | 19.6 | 2.77 | 2.86 | 0.97 | 0.97 | 0.97 | 0.015 | 2.60 | 4,7 | 40.3 | 56.1 | 0.83 | 0.14 | 0.82 | 8.3 |
| 2135 | 83.51 | 0.22 | 19.8 | 2.75 | 2.86 | 0.96 | 0.96 | 0.96 | 0.017 | 2.68 | 4,6 | 38.8 | 58.5 | 0.83 | 0.14 | 0.82 | 8.0 |
| 2135 + 1/2 | 83.69 | 0.16 | 19.8 | 2.75 | 2.87 | 0.96 | 0.95 | 0.95 | 0.017 | 2.76 | 4,6 | 38.0 | 61.0 | 0.83 | 0.14 | 0.83 | 8.0 |
| 2136 | 84.17 | 0.01 | 20.0 | 2.81 | 2.89 | 0.97 | 0.97 | 0.97 | 0.024 | 2.87 | 4,6 | 38.6 | 63.5 | 0.83 | 0.13 | 0.83 | 8.0 |
| 2136 + 1/2 | 84.69 | 0.16 | 20.0 | 2.80 | 2.89 | 0.97 | 0.96 | 0.96 | 0.023 | 2.85 | 4,6 | 39.0 | 65.8 | 0.83 | 0.13 | 0.82 | 8.0 |
| 2137 | 84.88 | 0.04 | 20.1 | 2.84 | 2.90 | 0.98 | 0.97 | 0.97 | 0.025 | 2.64 | 4,6 | 35.9 | 67.7 | 0.82 | 0.13 | 0.82 | 8.0 |
| 2137 + 1/2 | 85.15 | 0.06 | 20.3 | 2.86 | 2.90 | 0.99 | 0.98 | 0.98 | 0.031 | 2.79 | 15,8 | 35.9 | 69.2 | 0.82 | 0.13 | 0.82 | 8.0 |
| 2138 | 85.30 | 0.05 | 20.4 | 2.93 | 2.90 | 1.01 | 1.01 | 1.01 | 0.026 | 3.51 | 15,8 | 33.8 | 69.9 | 0.81 | 0.16 | 0.81 | 8.8 |
| 2138 + 1/2 | 85.34 | 0.03 | 20.5 | 2.91 | 2.91 | 1.00 | 1.00 | 1.00 | 0.025 | 3.92 | 15,8 | 30.2 | 70.4 | 0.81 | 0.18 | 0.81 | 8.8 |
| 2139 | 85.32 | 0.08 | 20.5 | 2.92 | 2.92 | 1.00 | 1.00 | 1.00 | 0.024 | 3.45 | 15,8 | 31.3 | 70.1 | 0.81 | 0.20 | 0.81 | 8.7 |
| 2139 + 1/2 | 85.15 | 0.25 | 20.8 | 2.90 | 2.94 | 0.98 | 0.99 | 0.98 | 0.029 | 3.42 | 15,8 | 28.9 | 69.8 | 0.81 | 0.24 | 0.80 | 8.1 |
| 2140 | 85.48 | 0.12 | 20.8 | 2.95 | 2.95 | 1.00 | 1.00 | 1.00 | 0.031 | 4.72 | 15,8 | 28.3 | 68.7 | 0.80 | 0.27 | 0.80 | 8.1 |
| 2140 + 1/2 | 85.57 | 0.03 | 20.9 | 2.98 | 2.96 | 1.01 | 1.00 | 1.00 | 0.034 | 4.78 | 15,7 | 27.6 | 67.2 | 0.80 | 0.29 | 0.80 | 9.2 |
| 2141 | 85.60 | 0.13 | 21.1 | 2.96 | 2.99 | 0.99 | 0.99 | 0.99 | 0.026 | 5.93 | 15,7 | 28.0 | 65.3 | 0.80 | 0.36 | 0.80 | 8.0 |
| 2141 + 1/2 | 85.37 | 0.11 | 21.2 | 2.99 | 3.00 | 1.00 | 1.01 | 1.00 | 0.016 | 4.36 | 15,6 | 27.9 | 62.6 | 0.80 | 0.38 | 0.79 | 8.4 |
| 2142 | 84.92 | 0.01 | 21.4 | 3.01 | 3.03 | 0.99 | 0.99 | 0.99 | 0.021 | 4.49 | 15,6 | 27.6 | 59.7 | 0.79 | 0.38 | 0.79 | 8.4 |
| 2142 + 1/2 | 84.46 | 0.05 | 21.5 | 3.07 | 3.05 | 1.01 | 1.00 | 1.00 | 0.026 | 3.90 | 14,6 | 27.4 | 56.0 | 0.79 | 0.38 | 0.79 | 8.0 |
| 2143 | 84.09 | 0.04 | 21.8 | 3.09 | 3.09 | 1.00 | 1.01 | 1.00 | 0.019 | 4.84 | 14,6 | 27.6 | 55.7 | 0.79 | 0.36 | 0.78 | 8.0 |
| 2143 + 1/2 | 83.80 | 0.00 | 22.0 | 3.10 | 3.12 | 1.00 | 1.01 | 1.00 | 0.016 | 3.91 | 14,6 | 28.0 | 57.2 | 0.78 | 0.34 | 0.78 | 8.0 |
| 2144 | 83.52 | 0.07 | 22.0 | 3.15 | 3.16 | 1.00 | 0.97 | 0.97 | 0.036 | 4.14 | 13,6 | 28.6 | 53.8 | 0.78 | 0.32 | 0.78 | 8.0 |
| 2144 + 1/2 | 83.38 | 0.10 | 22.4 | 3.21 | 3.21 | 1.00 | 1.01 | 1.00 | 0.023 | 4.38 | 15,2 | 29.9 | 54.1 | 0.78 | 0.29 | 0.78 | 8.0 |
| 2145 | 83.45 | 0.14 | 22.7 | 3.26 | 3.26 | 1.00 | 1.01 | 1.00 | 0.023 | 3.49 | 15,2 | 30.6 | 53.3 | 0.78 | 0.27 | 0.78 | 8.0 |
| 2145 + 1/2 | 83.23 | 0.03 | 23.0 | 3.34 | 3.27 | 1.02 | 1.03 | 1.02 | 0.027 | 2.97 | 13,6 | 31.1 | 51.6 | 0.78 | 0.25 | 0.78 | 8.0 |
| 2146 | 83.07 | 0.09 | 23.0 | 3.37 | 3.27 | 1.03 | 1.05 | 1.03 | 0.018 | 3.36 | 13,5 | 32.7 | 49.5 | 0.78 | 0.23 | 0.78 | 8.4 |
| 2146 + 1/2 | 82.73 | 0.06 | 23.1 | 3.43 | 3.27 | 1.05 | 1.07 | 1.05 | 0.014 | 3.78 | 12,8 | 32.5 | 48.9 | 0.78 | 0.20 | 0.78 | 8.2 |
| 2147 | 82.27 | 0.08 | 23.5 | 3.44 | 3.27 | 1.05 | 1.07 | 1.05 | 0.018 | 3.32 | 12,8 | 32.4 | 48.0 | 0.78 | 0.17 | 0.77 | 8.1 |
| 2147 + 1/2 | 81.65 | 0.06 | 23.6 | 3.46 | 3.27 | 1.06 | 1.07 | 1.06 | 0.028 | 2.98 | 14,3 | 32.4 | 47.5 | 0.78 | 0.15 | 0.77 | 8.0 |
| 2148 | 81.16 | 0.13 | 23.7 | 3.43 | 3.27 | 1.05 | 1.05 | 1.05 | 0.026 | 3.10 | 11,8 | 32.8 | 43.4 | 0.77 | 0.13 | 0.77 | 8.0 |
| 2148 + 1/2 | 80.41 | 0.02 | 23.8 | 3.38 | 3.27 | 1.03 | 1.04 | 1.03 | 0.021 | 2.92 | 11,8 | 33.1 | 43.2 | 0.77 | 0.11 | 0.77 | 8.0 |
| 2149 | 79.71 | 0.02 | 24.2 | 3.36 | 3.27 | 1.03 | 1.03 | 1.03 | 0.019 | 3.01 | 13,2 | 32.8 | 42.2 | 0.77 | 0.11 | 0.77 | 8.0 |
| 2149 + 1/2 | 78.96 | 0.01 | 24.1 | 3.31 | 3.27 | 1.01 | 1.02 | 1.01 | 0.024 | 2.92 | 13,3 | 32.4 | 42.0 | 0.77 | 0.11 | 0.77 | 8.0 |
| 2150 | 78.23 | 0.01 | 24.4 | 3.33 | 3.27 | 1.02 | 1.03 | 1.02 | 0.017 | 2.93 | 13,3 | 31.9 | 40.2 | 0.77 | 0.11 | 0.76 | 8.0 |
| 2150 + 1/2 | 77.48 | 0.01 | 24.2 | 3.35 | 3.27 | 1.02 | 1.03 | 1.02 | 0.023 | 2.45 | 13,3 | 31.0 | 40.3 | 0.76 | 0.15 | 0.76 | 8.0 |
| 2151 | 76.72 | 0.05 | 24.1 | 3.30 | 3.27 | 1.01 | 1.02 | 1.01 | 0.015 | 2.05 | 12,2 | 29.3 | 38.9 | 0.76 | 0.19 | 0.75 | 8.0 |
| 2151 + 1/2 | 76.06 | 0.07 | 24.2 | 3.33 | 3.27 | 1.02 | 1.03 | 1.02 | 0.016 | 2.43 | 10,7 | 28.7 | 38.5 | 0.75 | 0.21 | 0.74 | 8.0 |
| 2152 | 75.53 | 0.00 | 24.0 | 3.36 | 3.27 | 1.03 | 1.03 | 1.03 | 0.026 | 2.71 | 12,3 | 28.2 | 37.3 | 0.74 | 0.23 | 0.74 | 8.0 |
| 2152 + 1/2 | 75.01 | 0.02 | 23.8 | 3.34 | 3.27 | 1.02 | 1.02 | 1.02 | 0.025 | 2.59 | 10,7 | 27.4 | 36.8 | 0.73 | 0.25 | 0.73 | 8.0 |
| 2153 | 74.52 | 0.00 | 23.2 | 3.32 | 3.27 | 1.02 | 1.00 | 1.00 | 0.036 | 2.00 | 10,7 | 27.0 | 36.5 | 0.73 | 0.28 | 0.72 | 8.0 |
| 2153 + 1/2 | 74.03 | 0.03 | 23.2 | 3.28 | 3.27 | 1.00 | 1.00 | 1.00 | 0.033 | 1.67 | 12,2 | 26.1 | 36.0 | 0.72 | 0.29 | 0.71 | 8.0 |
| 2154 | 73.49 | 0.01 | 22.5 | 3.24 | 3.26 | 0.99 | 0.98 | 0.98 | 0.044 | 1.75 | 14,8 | 25.2 | 35.6 | 0.70 | 0.29 | 0.70 | 8.0 |
| 2154 + 1/2 | 72.96 | 0.06 | 22.2 | 3.16 | 3.24 | 0.97 | 0.99 | 0.97 | 0.025 | 1.73 | 10,6 | 24.5 | 35.8 | 0.70 | 0.30 | 0.68 | 8.0 |
| 2155 | 72.30 | 0.00 | 21.6 | 3.17 | 3.23 | 0.98 | 0.97 | 0.97 | 0.061 | 1.88 | 10,6 | 23.9 | 35.6 | 0.68 | 0.30 | 0.67 | 8.0 |
| 2155 + 1/2 | 71.64 | 0.10 | 21.5 | 3.22 | 3.20 | 1.00 | 1.00 | 1.00 | 0.052 | 1.91 | 10,6 | 23.0 | 35.2 | 0.66 | 0.30 | 0.65 | 8.0 |
| 2156 | 70.79 | 0.10 | 21.5 | 3.19 | 3.20 | 1.00 | 0.99 | 0.99 | 0.048 | 1.95 | 15,3 | 21.8 | 34.5 | 0.64 | 0.29 | 0.63 | 8.0 |
| 2156 + 1/2 | 69.73 | 0.04 | 21.3 | 3.15 | 3.19 | 0.99 | 0.98 | 0.98 | 0.057 | 2.29 | 15,8 | 20.3 | 33.9 | 0.63 | 0.30 | 0.62 | 8.0 |
| 2157 | 68.60 | 0.04 | 21.0 | 3.22 | 3.17 | 1.01 | 1.02 | 1.01 | 0.059 | 2.40 | 15,3 | 19.4 | 32.7 | 0.61 | 0.30 | 0.60 | 8.0 |
| 2157 + 1/2 | 67.39 | 0.07 | 20.5 | 3.23 | 3.16 | 1.02 | 1.04 | 1.02 | 0.046 | 2.76 | 15,3 | 18.6 | 29.2 | 0.59 | 0.28 | 0.59 | 8.0 |
| 2158 | 66.33 | 0.11 | 19.9 | 3.17 | 3.15 | 1.01 | 1.01 | 1.01 | 0.052 | 3.19 | 15,3 | 17.4 | 24.3 | 0.58 | 0.26 | 0.57 | 8.0 |
| 2158 + 1/2 | 65.49 | 0.03 | 19.1 | 3.19 | 3.13 | 1.02 | 1.02 | 1.02 | 0.079 | 3.32 | 15,3 | 16.1 | 21.6 | 0.56 | 0.23 | 0.56 | 8.0 |
| 2159 | 64.72 | 0.02 | 19.5 | 3.10 | 3.11 | 1.00 | 0.98 | 0.98 | 0.108 | 2.65 | 11,8 | 14.6 | 19.7 | 0.55 | 0.21 | 0.55 | 8.0 |
| 2159 + 1/2 | 63.91 | 0.02 | 18.6 | 3.07 | 3.08 | 1.00 | 0.98 | 0.98 | 0.103 | 2.49 | 11,8 | 13.6 | 19.0 | 0.53 | 0.22 | 0.53 | 8.0 |
| 2160 | 63.06 | 0.02 | 18.9 | 3.03 | 3.06 | 0.99 | 0.99 | 0.99 | 0.099 | 2.01 | 11,8 | 12.9 | 17.7 | 0.52 | 0.22 | 0.52 | 8.0 |
| 2160 + 1/2 | 62.26 | 0.01 | 17.7 | 3.00 | 3.04 | 0.98 | 0.97 | 0.97 | 0.094 | 1.87 | 13,2 | 12.0 | 17.2 | 0.51 | 0.23 | 0.51 | 8.0 |
| 2161 | 61.48 | 0.02 | 17.2 | 3.06 | 3.00 | 1.02 | 1.01 | 1.01 | 0.081 | 2.13 | 11,7 | 11.5 | 16.8 | 0.50 | 0.22 | 0.49 | 8.0 |
| 2161 + 1/2 | 60.74 | 0.04 | 16.9 | 2.99 | 2.93 | 1.02 | 1.05 | 1.02 | 0.068 | 2.33 | 11,7 | 11.2 | 15.1 | 0.48 | 0.25 | 0.48 | 8.0 |
| 2162 | 59.90 | 0.04 | 17.2 | 2.87 | 2.91 | 0.99 | 1.00 | 0.99 | 0.076 | 2.20 | 11,7 | 11.0 | 15.5 | 0.47 | 0.24 | 0.47 | 8.0 |
| 2162 + 1/2 | 59.00 | 0.03 | 16.7 | 2.83 | 2.81 | 1.01 | 1.01 | 1.01 | 0.048 | 1.88 | 11,6 | 11.0 | 20.9 | 0.46 | 0.24 | 0.46 | 8.0 |
| 2163 | 58.02 | 0.02 | 15.9 | 2.74 | 2.78 | 0.99 | 1.00 | 0.99 | 0.045 | 2.41 | 10,7 | 11.7 | 29.1 | 0.45 | 0.22 | 0.45 | 8.0 |
| 2163 + 1/2 | 57.08 | 0.01 | 15.2 | 2.73 | 2.71 | 1.01 | 0.98 | 0.98 | 0.066 | 2.76 | 10,7 | 12.2 | 34.8 | 0.44 | 0.21 | 0.44 | 8.0 |
| 2164 | 56.12 | 0.01 | 14.5 | 2.68 | 2.69 | 1.00 | 1.01 | 1.00 | 0.054 | 3.16 | 10,7 | 12.0 | 35.6 | 0.43 | 0.19 | 0.42 | 8.0 |
| 2164 + 1/2 | 55.18 | 0.03 | 14.0 | 2.66 | 2.65 | 1.00 | 1.01 | 1.00 | 0.039 | 2.86 | 10,7 | 12.1 | 33.6 | 0.42 | 0.18 | 0.41 | 8.0 |
| 2165 | 54.29 | 0.04 | 13.4 | 2.62 | 2.63 | 1.00 | 0.99 | 0.99 | 0.035 | 2.50 | 10,7 | 11.7 | 32.6 | 0.40 | 0.17 | 0.40 | 8.0 |
| 2165 + 1/2 | 53.47 | 0.05 | 12.5 | 2.61 | 2.58 | 1.01 | 1.01 | 1.01 | 0.028 | 1.98 | 10,7 | 10.9 | 31.3 | 0.39 | 0.15 | 0.39 | 8.0 |
| 2166 | 52.75 | 0.03 | 11.8 | 2.54 | 2.54 | 1.00 | 1.00 | 1.00 | 0.020 | 1.66 | 11,6 | 10.0 | 28.7 | 0.38 | 0.13 | 0.38 | 8.0 |
| 2166 + 1/2 | 52.10 | 0.03 | 11.1 | 2.38 | 2.50 | 0.95 | 0.95 | 0.95 | 0.019 | 1.77 | 11,6 | 9.3 | 25.2 | 0.37 | 0.12 | 0.37 | 8.0 |
| 2167 | 51.51 | 0.02 | 10.4 | 2.45 | 2.45 | 1.00 | 0.99 | 0.99 | 0.020 | 1.87 | 12,3 | 8.7 | 27.2 | 0.36 | 0.11 | 0.36 | 8.0 |
| 2167 + 1/2 | 50.95 | 0.00 | 9.5 | 2.47 | 2.41 | 1.03 | 1.02 | 1.02 | 0.017 | 1.86 | 12,3 | 7.9 | 22.6 | 0.35 | 0.09 | 0.35 | 8.0 |
| 2168 | 50.40 | 0.01 | 8.7 | 2.38 | 2.41 | 0.99 | 0.98 | 0.98 | 0.014 | 1.84 | 12,3 | 7.4 | 21.0 | 0.35 | 0.08 | 0.34 | 8.0 |
| 2168 + 1/2 | 49.87 | 0.03 | 7.8 | 2.43 | 2.38 | 1.02 | 1.03 | 1.02 | 0.006 | 1.65 | 12,3 | 7.0 | 19.3 | 0.34 | 0.07 | 0.34 | 8.0 |
| 2169 | 49.40 | 0.02 | 7.0 | 2.38 | 2.36 | 1.01 | 1.02 | 1.01 | 0.006 | 1.76 | 10,8 | 6.7 | 16.4 | 0.33 | 0.06 | 0.33 | 8.0 |
| 2169 + 1/2 | 48.95 | 0.01 | 6.4 | 2.25 | 2.36 | 0.95 | 0.96 | 0.95 | 0.004 | 1.57 | 12,4 | 6.3 | 13.9 | 0.32 | 0.06 | 0.32 | 8.0 |
| 2170 | 48.54 | 0.02 | 5.7 | 2.27 | 2.31 | 0.99 | 0.99 | 0.99 | 0.002 | 1.78 | 9,8 | 6.4 | 10.6 | 0.32 | 0.05 | 0.31 | 8.0 |
| 2170 + 1/2 | 48.16 | 0.01 | 4.9 | 2.35 | 2.26 | 1.04 | 1.04 | 1.04 | 0.000 | 2.30 | 10,8 | 6.3 | 10.0 | 0.31 | 0.05 | 0.31 | 8.0 |
| 2171 | 47.80 | 0.02 | 4.2 | 2.23 | 2.26 | 0.99 | 0.99 | 0.99 | 0.000 | 1.97 | 9,8 | 6.5 | 10.0 | 0.30 | 0.05 | 0.30 | 8.0 |
| 2171 + 1/2 | 47.48 | 0.00 | 3.4 | 2.02 | 2.24 | 0.90 | 0.91 | 0.90 | 0.000 | 1.30 | 0,4 | 7.1 | 10.8 | 0.30 | 0.06 | 0.30 | 8.0 |
| 2172 | 47.17 | 0.01 | 2.7 | 2.15 | 2.20 | 0.98 | 0.98 | 0.98 | 0.000 | 2.14 | 9,8 | 7.4 | 12.4 | 0.30 | 0.07 | 0.29 | 8.0 |
| 2172 + 1/2 | 46.88 | 0.01 | 2.1 | 2.27 | 2.09 | 1.09 | 1.09 | 1.09 | 0.000 | 3.07 | 9,8 | 7.9 | 14.1 | 0.29 | 0.08 | 0.29 | 8.0 |
| 2173 | 46.61 | 0.00 | 1.6 | 2.16 | 2.01 | 1.07 | 1.07 | 1.07 | 0.000 | 2.87 | 9,8 | 8.5 | 15.6 | 0.29 | 0.10 | 0.29 | 8.0 |
| 2173 + 1/2 | 46.35 | 0.01 | 1.3 | 2.01 | 1.91 | 1.05 | 1.05 | 1.05 | 0.000 | 2.51 | 9,8 | 8.8 | 16.8 | 0.28 | 0.11 | 0.28 | 8.0 |
| 2174 last | 46.10 | 0.00 | 1.0 | 1.79 | 1.81 | 0.99 | 0.99 | 0.99 | 0.000 | 1.79 | 9,8 | 9.2 | 17.5 | 0.28 | 0.13 | 0.28 | 8.0 |
| 2174 + 1/2 | 45.86 | 0.00 | 0.9 | 1.61 | 1.69 | 0.95 | 0.95 | 0.95 | 0.000 | 1.23 | 6,6 | 9.5 | 18.2 | 0.28 | 0.14 | 0.27 | 8.0 |
| 2175 | 45.61 | 0.00 | 0.9 | 1.57 | 1.60 | 0.98 | 0.99 | 0.98 | 0.000 | 1.26 | 10,2 | 9.6 | 18.6 | 0.27 | 0.14 | 0.27 | 8.0 |
| 2175 + 1/2 | 45.36 | 0.00 | 0.9 | 1.56 | 1.60 | 0.97 | 0.98 | 0.97 | 0.000 | 1.22 | 6,6 | 9.5 | 18.2 | 0.27 | 0.15 | 0.27 | 8.0 |
| 2176 | 45.10 | 0.00 | 0.8 | 1.53 | 1.60 | 0.96 | 0.97 | 0.96 | 0.000 | 1.25 | 11,2 | 9.1 | 17.3 | 0.27 | 0.15 | 0.26 | 8.0 |
| 2176 + 1/2 | 44.85 | 0.00 | 0.8 | 1.52 | 1.60 | 0.95 | 0.97 | 0.95 | 0.000 | 1.24 | 6,6 | 8.3 | 16.7 | 0.26 | 0.14 | 0.26 | 8.0 |
| 2177 | 44.59 | 0.00 | 0.8 | 1.49 | 1.59 | 0.93 | 0.95 | 0.93 | 0.000 | 1.30 | 11,2 | 7.8 | 15.0 | 0.26 | 0.13 | 0.26 | 8.0 |
| 2177 + 1/2 | 44.33 | 0.00 | 0.8 | 1.45 | 1.58 | 0.92 | 0.93 | 0.92 | 0.000 | 1.30 | 11,2 | 8.3 | 12.8 | 0.25 | 0.12 | 0.24 | 8.0 |
| 2178 | 44.08 | 0.00 | 0.8 | 1.41 | 1.57 | 0.89 | 0.91 | 0.89 | 0.000 | 1.45 | 8,3 | 7.8 | 12.0 | 0.23 | 0.09 | 0.23 | 8.0 |
| 2178 + 1/2 | 43.83 | 0.00 | 0.8 | 1.37 | 1.56 | 0.88 | 0.90 | 0.88 | 0.000 | 1.80 | 8,3 | 8.2 | 11.1 | 0.21 | 0.05 | 0.21 | 8.0 |
| 2179 | 43.59 | 0.00 | 0.9 | 1.33 | 1.56 | 0.85 | 0.87 | 0.85 | 0.000 | 2.15 | 8,3 |  |  |  |  |  |  |
| 2179 + 1/2 | 43.36 | 0.00 | 1.1 | 1.31 | 1.55 | 0.85 | 0.87 | 0.85 | 0.000 | 2.20 | 8,3 |  |  |  |  |  |  |
| 2180 | 43.13 | 0.00 | 1.4 | 1.38 | 1.53 | 0.91 | 0.92 | 0.91 | 0.000 | 1.75 | 8,7 |  |  |  |  |  |  |
| 2180 + 1/2 | 42.89 | 0.01 | 1.9 | 1.57 | 1.49 | 1.05 | 1.07 | 1.05 | 0.000 | 1.91 | 8,4 |  |  |  |  |  |  |
| 2181 | 42.65 | 0.01 | 2.5 | 1.43 | 1.49 | 0.96 | 0.97 | 0.96 | 0.000 | 1.45 | 8,7 |  |  |  |  |  |  |
| 2181 + 1/2 | 42.38 | 0.01 | 3.3 | 1.50 | 1.46 | 1.02 | 1.05 | 1.02 | 0.000 | 1.83 | 7,0 |  |  |  |  |  |  |
| 2182 | 42.10 | 0.01 | 4.2 | 1.60 | 1.45 | 1.10 | 1.12 | 1.10 | 0.006 | 2.61 | 13,0 |  |  |  |  |  |  |
| 2182 + 1/2 | 41.79 | 0.01 | 5.4 | 1.59 | 1.45 | 1.09 | 1.12 | 1.09 | 0.005 | 3.56 | 13,0 |  |  |  |  |  |  |
| 2183 | 41.45 | 0.01 | 6.8 | 1.44 | 1.46 | 0.98 | 0.98 | 0.98 | 0.009 | 4.73 | 13,0 |  |  |  |  |  |  |
| 2183 + 1/2 | 41.11 | 0.03 | 8.4 | 1.70 | 1.45 | 1.17 | 1.14 | 1.14 | 0.018 | 5.77 | 13,0 |  |  |  |  |  |  |
| 2184 | 40.71 | 0.10 | 10.1 | 1.62 | 1.45 | 1.12 | 1.08 | 1.08 | 0.026 | 6.79 | 13,0 |  |  |  |  |  |  |
| 2184 + 1/2 | 40.11 | 0.24 | 11.7 | 1.61 | 1.45 | 1.11 | 1.07 | 1.07 | 0.031 | 6.67 | 13,0 |  |  |  |  |  |  |
| 2185 | 39.04 | 0.10 | 13.5 | 1.56 | 1.45 | 1.07 | 1.00 | 1.00 | 0.037 | 4.15 | 13,0 |  |  |  |  |  |  |
| 2185 + 1/2 | 37.77 | 0.08 | 14.8 | 1.45 | 1.46 | 1.00 | 0.91 | 0.91 | 0.038 | 2.94 | 12,0 |  |  |  |  |  |  |
| 2186 | 36.33 | 0.01 | 15.8 | 1.47 | 1.45 | 1.02 | 0.94 | 0.94 | 0.034 | 3.45 | 12,0 |  |  |  |  |  |  |
| 2186 + 1/2 | 34.87 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### rise, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.25 from frame 2184 to the next, limit 1.2.
Largest pop score of one block: 11.50 from frame 2184 to the next, block column 5 row 0 from the top left, shown, not judged.
Largest change in place: 48.0 from frame 2118 + 1/2 to 8 film frames later, most at pixel 804, 416, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 2088 to 2099 + 1/2): change 1.0; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.101 from frame 2184 to the next, most at pixel 790, 118, a patch of 140 by 112 px; 0 of 197 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 198 rows, which says nothing of them, quiet or not: frame 2186 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 2157 + 1/2 in /home/user/workspace/work/p6/he9/04/earth-rise-p2of2-pops-full.png, frame 2183 in /home/user/workspace/work/p6/he9/04/earth-rise-p2of2-pops-full.png, frame 2183 + 1/2 in /home/user/workspace/work/p6/he9/04/earth-rise-p2of2-pops-full.png, frame 2184 in /home/user/workspace/work/p6/he9/04/earth-rise-p2of2-pops-full.png.

With the carry at the full size the rise has 1 number over the limit or not measured.

- FULL SIZE RED pop score 1.25 from frame 2184 to the next, limit 1.2 (3 frames over it, first 2183)

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2088 | 1.2 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.002 | 1.31 | 4,7 | 1.0 | 2.3 | 0.73 | 1.00 | 0.323 | 0.321 | 1.006 | 0.735 | 6,594 | 28 by 52 |
| 2088 + 1/2 | 1.1 | 0.30 | 0.30 | 0.99 | 1.00 | 0.99 | 0.000 | 1.31 | 4,7 | 1.0 | 2.0 | 0.73 | 1.00 | 0.320 | 0.322 | 0.995 | 0.735 | 1186,846 | 52 by 52 |
| 2089 | 1.1 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.001 | 1.33 | 4,7 | 0.9 | 2.1 | 0.74 | 1.00 | 0.321 | 0.321 | 1.001 | 0.734 | 650,818 | 96 by 56 |
| 2089 + 1/2 | 1.1 | 0.30 | 0.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 4,7 | 0.9 | 1.8 | 0.74 | 1.00 | 0.321 | 0.319 | 1.005 | 0.734 | 262,718 | 88 by 80 |
| 2090 | 1.1 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.22 | 4,7 | 0.9 | 1.8 | 0.74 | 1.00 | 0.319 | 0.319 | 0.998 | 0.734 | 662,854 | 112 by 76 |
| 2090 + 1/2 | 1.1 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.20 | 4,7 | 0.9 | 1.5 | 0.74 | 1.00 | 0.317 | 0.318 | 0.996 | 0.733 | 378,982 | 168 by 76 |
| 2091 | 1.0 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.24 | 6,8 | 0.8 | 1.6 | 0.74 | 1.00 | 0.318 | 0.318 | 1.000 | 0.733 | 762,1046 | 80 by 68 |
| 2091 + 1/2 | 1.0 | 0.30 | 0.30 | 0.98 | 0.98 | 0.98 | 0.000 | 1.16 | 4,7 | 0.8 | 1.9 | 0.74 | 1.00 | 0.316 | 0.318 | 0.993 | 0.733 | 38,1070 | 68 by 36 |
| 2092 | 1.0 | 0.30 | 0.30 | 0.99 | 0.99 | 0.99 | 0.000 | 1.16 | 6,8 | 0.8 | 1.4 | 0.74 | 1.00 | 0.319 | 0.320 | 0.996 | 0.732 | 134,718 | 120 by 80 |
| 2092 + 1/2 | 1.0 | 0.30 | 0.31 | 0.99 | 0.99 | 0.99 | 0.000 | 1.15 | 6,8 | 0.9 | 1.4 | 0.74 | 1.00 | 0.322 | 0.322 | 1.000 | 0.732 | 518,1010 | 128 by 80 |
| 2093 | 1.0 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 4,6 | 0.9 | 1.6 | 0.74 | 1.00 | 0.325 | 0.324 | 1.004 | 0.732 | 650,834 | 200 by 128 |
| 2093 + 1/2 | 0.9 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.002 | 1.14 | 7,8 | 0.9 | 1.7 | 0.74 | 1.00 | 0.326 | 0.327 | 0.998 | 0.731 | 1914,1002 | 36 by 52 |
| 2094 | 0.9 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.001 | 1.11 | 5,5 | 0.8 | 1.9 | 0.74 | 1.00 | 0.328 | 0.328 | 0.999 | 0.731 | 22,730 | 100 by 100 |
| 2094 + 1/2 | 1.0 | 0.31 | 0.31 | 1.01 | 1.01 | 1.01 | 0.000 | 1.12 | 1,8 | 0.8 | 1.9 | 0.74 | 1.00 | 0.330 | 0.329 | 1.005 | 0.731 | 542,874 | 84 by 180 |
| 2095 | 0.9 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 0,5 | 0.9 | 1.9 | 0.74 | 0.99 | 0.330 | 0.330 | 1.001 | 0.731 | 46,610 | 168 by 80 |
| 2095 + 1/2 | 0.9 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.07 | 8,3 | 1.1 | 1.8 | 0.74 | 1.00 | 0.330 | 0.331 | 0.995 | 0.730 | 334,938 | 96 by 84 |
| 2096 | 0.9 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 13,4 | 1.3 | 2.8 | 0.74 | 0.98 | 0.332 | 0.331 | 1.002 | 0.730 | 174,698 | 92 by 68 |
| 2096 + 1/2 | 0.9 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 2,7 | 1.7 | 3.9 | 0.74 | 0.97 | 0.332 | 0.332 | 0.999 | 0.730 | 6,598 | 36 by 68 |
| 2097 | 0.9 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 10,7 | 2.1 | 5.0 | 0.74 | 0.96 | 0.333 | 0.332 | 1.000 | 0.730 | 398,706 | 192 by 116 |
| 2097 + 1/2 | 0.9 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 7,5 | 2.6 | 6.2 | 0.74 | 0.95 | 0.333 | 0.332 | 1.002 | 0.729 | 1554,922 | 60 by 68 |
| 2098 | 0.9 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 10,3 | 2.9 | 7.4 | 0.74 | 0.94 | 0.333 | 0.333 | 1.002 | 0.729 | 154,1038 | 112 by 76 |
| 2098 + 1/2 | 0.9 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 5,0 | 3.2 | 8.4 | 0.74 | 0.94 | 0.331 | 0.333 | 0.995 | 0.729 | 406,714 | 88 by 72 |
| 2099 | 0.8 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.21 | 7,0 | 3.6 | 9.6 | 0.74 | 0.93 | 0.333 | 0.332 | 1.005 | 0.728 | 110,594 | 92 by 84 |
| 2099 + 1/2 | 0.9 | 0.31 | 0.31 | 1.00 | 0.99 | 0.99 | 0.002 | 1.12 | 6,0 | 4.0 | 10.5 | 0.74 | 0.93 | 0.331 | 0.333 | 0.997 | 0.728 | 182,918 | 84 by 208 |
| 2100 | 0.8 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.001 | 1.27 | 6,0 | 5.1 | 11.5 | 0.74 | 0.93 | 0.332 | 0.334 | 0.995 | 0.728 | 442,1014 | 104 by 88 |
| 2100 + 1/2 | 0.8 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.08 | 9,7 | 6.3 | 12.2 | 0.74 | 0.92 | 0.334 | 0.333 | 1.004 | 0.728 | 442,1010 | 76 by 84 |
| 2101 | 0.9 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 4,7 | 7.7 | 12.1 | 0.74 | 0.93 | 0.335 | 0.334 | 1.004 | 0.727 | 578,1026 | 156 by 88 |
| 2101 + 1/2 | 0.9 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.35 | 4,7 | 9.3 | 12.8 | 0.74 | 0.94 | 0.334 | 0.335 | 0.997 | 0.727 | 550,906 | 204 by 148 |
| 2102 | 1.0 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.000 | 1.34 | 4,7 | 11.3 | 13.8 | 0.74 | 0.94 | 0.334 | 0.335 | 0.997 | 0.728 | 778,1070 | 72 by 64 |
| 2102 + 1/2 | 1.1 | 0.32 | 0.32 | 1.00 | 1.00 | 1.00 | 0.003 | 1.27 | 4,6 | 13.5 | 15.2 | 0.74 | 0.96 | 0.336 | 0.335 | 1.004 | 0.728 | 578,774 | 284 by 180 |
| 2103 | 1.3 | 0.32 | 0.32 | 0.99 | 0.99 | 0.99 | 0.000 | 1.13 | 4,7 | 16.0 | 18.0 | 0.74 | 0.98 | 0.336 | 0.338 | 0.994 | 0.729 | 638,746 | 156 by 100 |
| 2103 + 1/2 | 1.5 | 0.32 | 0.32 | 1.00 | 1.00 | 1.00 | 0.000 | 1.71 | 7,0 | 18.5 | 20.8 | 0.74 | 0.98 | 0.339 | 0.340 | 0.998 | 0.730 | 778,1062 | 64 by 64 |
| 2104 | 1.8 | 0.33 | 0.33 | 0.99 | 0.99 | 0.99 | 0.000 | 1.17 | 5,7 | 21.0 | 23.4 | 0.74 | 1.00 | 0.344 | 0.346 | 0.994 | 0.730 | 122,1070 | 104 by 52 |
| 2104 + 1/2 | 2.0 | 0.34 | 0.34 | 1.00 | 1.00 | 1.00 | 0.000 | 1.30 | 1,8 | 23.4 | 26.2 | 0.74 | 1.00 | 0.352 | 0.354 | 0.996 | 0.731 | 202,1070 | 132 by 72 |
| 2105 | 2.4 | 0.35 | 0.35 | 1.00 | 1.01 | 1.00 | 0.001 | 1.40 | 7,0 | 25.8 | 28.7 | 0.74 | 1.00 | 0.364 | 0.364 | 1.002 | 0.732 | 794,1066 | 72 by 60 |
| 2105 + 1/2 | 2.6 | 0.36 | 0.36 | 0.99 | 0.98 | 0.98 | 0.015 | 1.23 | 1,8 | 28.2 | 31.4 | 0.74 | 1.00 | 0.375 | 0.378 | 0.992 | 0.733 | 802,1042 | 64 by 80 |
| 2106 | 2.9 | 0.37 | 0.38 | 1.00 | 1.00 | 1.00 | 0.005 | 1.29 | 1,8 | 30.5 | 34.0 | 0.74 | 0.99 | 0.391 | 0.392 | 0.996 | 0.734 | 158,1070 | 64 by 40 |
| 2106 + 1/2 | 3.2 | 0.39 | 0.39 | 0.99 | 1.00 | 0.99 | 0.002 | 1.31 | 1,8 | 32.6 | 36.1 | 0.74 | 1.01 | 0.410 | 0.414 | 0.991 | 0.736 | 790,1074 | 60 by 56 |
| 2107 | 3.4 | 0.41 | 0.42 | 1.00 | 1.00 | 1.00 | 0.003 | 1.41 | 1,8 | 34.6 | 38.4 | 0.74 | 1.00 | 0.437 | 0.437 | 0.999 | 0.737 | 174,1070 | 108 by 72 |
| 2107 + 1/2 | 3.9 | 0.44 | 0.44 | 0.99 | 1.00 | 0.99 | 0.000 | 1.36 | 2,8 | 36.5 | 40.5 | 0.75 | 1.00 | 0.465 | 0.468 | 0.993 | 0.739 | 234,1034 | 72 by 68 |
| 2108 | 4.1 | 0.47 | 0.47 | 0.99 | 0.99 | 0.99 | 0.005 | 1.40 | 2,8 | 38.3 | 42.3 | 0.75 | 1.00 | 0.499 | 0.501 | 0.995 | 0.741 | 194,1070 | 112 by 68 |
| 2108 + 1/2 | 4.4 | 0.50 | 0.51 | 0.99 | 0.99 | 0.99 | 0.002 | 1.51 | 2,8 | 39.9 | 44.1 | 0.75 | 0.99 | 0.538 | 0.540 | 0.996 | 0.743 | 250,1030 | 80 by 72 |
| 2109 | 4.8 | 0.55 | 0.55 | 0.99 | 1.00 | 0.99 | 0.002 | 1.55 | 2,8 | 41.3 | 45.6 | 0.75 | 1.01 | 0.581 | 0.581 | 1.000 | 0.745 | 1614,1074 | 48 by 24 |
| 2109 + 1/2 | 5.1 | 0.60 | 0.60 | 1.00 | 1.00 | 1.00 | 0.007 | 1.52 | 2,8 | 42.4 | 46.8 | 0.75 | 0.99 | 0.624 | 0.630 | 0.991 | 0.747 | 230,1070 | 104 by 64 |
| 2110 | 5.5 | 0.66 | 0.65 | 1.01 | 1.02 | 1.01 | 0.010 | 1.72 | 0,2 | 43.5 | 48.5 | 0.76 | 1.02 | 0.678 | 0.671 | 1.010 | 0.750 | 298,1042 | 100 by 64 |
| 2110 + 1/2 | 5.8 | 0.70 | 0.68 | 1.02 | 1.01 | 1.01 | 0.014 | 2.33 | 0,2 | 44.3 | 49.4 | 0.76 | 1.00 | 0.719 | 0.702 | 1.023 | 0.752 | 314,1046 | 120 by 68 |
| 2111 | 6.2 | 0.71 | 0.71 | 1.00 | 1.01 | 1.00 | 0.005 | 2.21 | 0,2 | 44.8 | 50.5 | 0.76 | 1.01 | 0.727 | 0.735 | 0.989 | 0.755 | 266,1074 | 48 by 32 |
| 2111 + 1/2 | 6.5 | 0.72 | 0.72 | 1.00 | 1.00 | 1.00 | 0.014 | 1.81 | 0,2 | 45.3 | 51.6 | 0.76 | 1.00 | 0.751 | 0.746 | 1.008 | 0.758 | 282,1074 | 144 by 72 |
| 2112 | 6.9 | 0.73 | 0.72 | 1.00 | 1.00 | 1.00 | 0.009 | 1.74 | 0,2 | 45.8 | 52.5 | 0.77 | 1.00 | 0.764 | 0.765 | 0.999 | 0.760 | 302,1074 | 96 by 56 |
| 2112 + 1/2 | 7.1 | 0.73 | 0.73 | 1.00 | 1.00 | 1.00 | 0.010 | 1.83 | 3,8 | 46.2 | 53.4 | 0.77 | 1.00 | 0.779 | 0.780 | 0.998 | 0.763 | 318,1074 | 44 by 36 |
| 2113 | 7.5 | 0.74 | 0.74 | 1.00 | 1.00 | 1.00 | 0.003 | 1.88 | 3,8 | 46.5 | 54.1 | 0.77 | 1.00 | 0.796 | 0.794 | 1.002 | 0.766 | 334,1074 | 92 by 68 |
| 2113 + 1/2 | 7.6 | 0.75 | 0.75 | 1.00 | 1.00 | 1.00 | 0.010 | 2.13 | 3,8 | 46.7 | 54.5 | 0.78 | 1.00 | 0.810 | 0.811 | 1.000 | 0.769 | 350,1074 | 100 by 72 |
| 2114 | 8.1 | 0.76 | 0.75 | 1.01 | 1.00 | 1.00 | 0.026 | 2.10 | 3,8 | 47.0 | 55.6 | 0.78 | 1.00 | 0.825 | 0.820 | 1.006 | 0.772 | 366,1074 | 108 by 72 |
| 2114 + 1/2 | 8.2 | 0.76 | 0.76 | 1.00 | 0.99 | 0.99 | 0.023 | 1.91 | 3,8 | 47.1 | 55.7 | 0.78 | 0.99 | 0.830 | 0.832 | 0.998 | 0.775 | 382,1074 | 104 by 72 |
| 2115 | 8.6 | 0.77 | 0.77 | 1.00 | 1.00 | 1.00 | 0.011 | 1.95 | 3,8 | 47.3 | 56.0 | 0.79 | 0.99 | 0.839 | 0.842 | 0.997 | 0.779 | 398,1074 | 60 by 32 |
| 2115 + 1/2 | 8.8 | 0.78 | 0.78 | 1.00 | 1.00 | 1.00 | 0.003 | 1.69 | 3,8 | 47.5 | 57.2 | 0.79 | 0.99 | 0.853 | 0.855 | 0.998 | 0.782 | 418,1074 | 52 by 32 |
| 2116 | 9.0 | 0.79 | 0.79 | 1.00 | 0.99 | 0.99 | 0.018 | 1.77 | 4,8 | 47.5 | 57.6 | 0.79 | 1.00 | 0.871 | 0.868 | 1.003 | 0.785 | 442,1074 | 96 by 80 |
| 2116 + 1/2 | 9.4 | 0.81 | 0.81 | 1.00 | 1.00 | 1.00 | 0.005 | 1.80 | 4,8 | 47.7 | 58.4 | 0.79 | 1.00 | 0.883 | 0.883 | 1.000 | 0.788 | 1730,194 | 60 by 44 |
| 2117 | 9.8 | 0.82 | 0.82 | 1.00 | 1.00 | 1.00 | 0.007 | 1.98 | 4,8 | 47.8 | 58.9 | 0.80 | 1.00 | 0.896 | 0.896 | 1.000 | 0.792 | 530,1006 | 92 by 96 |
| 2117 + 1/2 | 10.2 | 0.84 | 0.84 | 1.00 | 1.00 | 1.00 | 0.014 | 1.98 | 4,8 | 47.8 | 58.9 | 0.80 | 1.00 | 0.908 | 0.909 | 0.999 | 0.795 | 550,1006 | 132 by 100 |
| 2118 | 10.5 | 0.85 | 0.85 | 1.00 | 1.01 | 1.00 | 0.009 | 1.73 | 4,8 | 47.9 | 58.6 | 0.80 | 1.00 | 0.922 | 0.920 | 1.002 | 0.798 | 626,1074 | 164 by 104 |
| 2118 + 1/2 | 10.9 | 0.86 | 0.86 | 1.00 | 1.00 | 1.00 | 0.027 | 1.54 | 4,8 | 48.0 | 59.6 | 0.81 | 1.00 | 0.933 | 0.928 | 1.006 | 0.801 | 1682,174 | 72 by 52 |
| 2119 | 11.3 | 0.87 | 0.88 | 0.99 | 1.00 | 0.99 | 0.021 | 1.54 | 5,8 | 47.9 | 58.9 | 0.81 | 1.00 | 0.933 | 0.941 | 0.991 | 0.804 | 1914,698 | 44 by 80 |
| 2119 + 1/2 | 11.8 | 0.89 | 0.89 | 1.00 | 1.00 | 1.00 | 0.035 | 1.63 | 5,8 | 47.7 | 57.8 | 0.81 | 1.00 | 0.950 | 0.949 | 1.001 | 0.808 | 1174,1074 | 76 by 24 |
| 2120 | 12.1 | 0.91 | 0.91 | 1.00 | 1.01 | 1.00 | 0.022 | 1.49 | 5,8 | 47.4 | 56.6 | 0.81 | 1.00 | 0.964 | 0.959 | 1.005 | 0.811 | 1914,470 | 32 by 128 |
| 2120 + 1/2 | 12.3 | 0.92 | 0.93 | 0.99 | 0.99 | 0.99 | 0.038 | 1.50 | 13,1 | 47.1 | 55.7 | 0.81 | 1.00 | 0.969 | 0.978 | 0.991 | 0.814 | 1598,134 | 68 by 44 |
| 2121 | 12.7 | 0.95 | 0.95 | 1.00 | 1.00 | 1.00 | 0.037 | 1.33 | 13,1 | 46.7 | 55.5 | 0.82 | 0.98 | 0.992 | 0.993 | 0.998 | 0.817 | 526,1074 | 48 by 28 |
| 2121 + 1/2 | 13.1 | 0.98 | 0.98 | 1.01 | 1.00 | 1.00 | 0.036 | 1.46 | 15,4 | 46.2 | 53.8 | 0.82 | 1.01 | 1.018 | 1.010 | 1.007 | 0.820 | 1234,1074 | 48 by 32 |
| 2122 | 13.5 | 1.00 | 1.00 | 1.00 | 1.01 | 1.00 | 0.022 | 1.44 | 12,8 | 45.8 | 53.2 | 0.82 | 0.99 | 1.029 | 1.029 | 0.999 | 0.824 | 1634,170 | 56 by 76 |
| 2122 + 1/2 | 13.8 | 1.02 | 1.03 | 0.99 | 1.00 | 0.99 | 0.027 | 1.38 | 12,8 | 45.2 | 51.8 | 0.82 | 1.00 | 1.041 | 1.049 | 0.993 | 0.827 | 1354,1074 | 52 by 28 |
| 2123 | 14.3 | 1.06 | 1.05 | 1.01 | 1.03 | 1.01 | 0.020 | 1.85 | 12,8 | 44.6 | 50.9 | 0.82 | 1.01 | 1.069 | 1.060 | 1.009 | 0.830 | 1334,1062 | 56 by 48 |
| 2123 + 1/2 | 14.6 | 1.07 | 1.08 | 0.99 | 0.98 | 0.98 | 0.041 | 1.84 | 12,8 | 44.0 | 49.6 | 0.83 | 0.99 | 1.079 | 1.086 | 0.993 | 0.833 | 6,1018 | 40 by 116 |
| 2124 | 15.2 | 1.10 | 1.10 | 1.00 | 0.98 | 0.98 | 0.041 | 1.77 | 11,8 | 43.4 | 48.6 | 0.83 | 0.99 | 1.103 | 1.101 | 1.002 | 0.836 | 1326,1010 | 56 by 56 |
| 2124 + 1/2 | 15.9 | 1.13 | 1.13 | 1.00 | 1.02 | 1.00 | 0.031 | 1.65 | 11,8 | 42.7 | 47.8 | 0.83 | 1.00 | 1.124 | 1.126 | 0.998 | 0.838 | 1066,1074 | 52 by 32 |
| 2125 | 16.3 | 1.16 | 1.17 | 0.99 | 0.98 | 0.98 | 0.043 | 1.74 | 11,8 | 41.9 | 47.4 | 0.83 | 0.99 | 1.150 | 1.160 | 0.991 | 0.841 | 1314,974 | 52 by 52 |
| 2125 + 1/2 | 16.9 | 1.21 | 1.20 | 1.01 | 1.01 | 1.01 | 0.034 | 2.19 | 0,7 | 41.5 | 46.8 | 0.83 | 1.01 | 1.195 | 1.183 | 1.010 | 0.844 | 6,1074 | 44 by 36 |
| 2126 | 17.2 | 1.24 | 1.23 | 1.01 | 1.00 | 1.00 | 0.028 | 1.93 | 9,8 | 41.9 | 47.8 | 0.84 | 1.00 | 1.217 | 1.210 | 1.006 | 0.846 | 1914,34 | 28 by 32 |
| 2126 + 1/2 | 17.0 | 1.25 | 1.24 | 1.01 | 1.00 | 1.00 | 0.027 | 2.60 | 9,8 | 41.8 | 48.7 | 0.84 | 1.00 | 1.225 | 1.240 | 0.987 | 0.847 | 1130,1074 | 148 by 48 |
| 2127 | 17.3 | 1.29 | 1.24 | 1.04 | 1.05 | 1.04 | 0.022 | 3.08 | 9,8 | 41.5 | 50.9 | 0.84 | 1.01 | 1.263 | 1.246 | 1.014 | 0.849 | 106,1074 | 92 by 40 |
| 2127 + 1/2 | 17.6 | 1.31 | 1.24 | 1.06 | 1.07 | 1.06 | 0.016 | 2.56 | 9,8 | 40.9 | 47.7 | 0.85 | 1.02 | 1.270 | 1.266 | 1.003 | 0.850 | 150,1074 | 52 by 28 |
| 2128 | 17.8 | 1.31 | 1.24 | 1.06 | 1.08 | 1.06 | 0.013 | 2.45 | 9,8 | 40.4 | 47.3 | 0.85 | 1.02 | 1.268 | 1.268 | 0.999 | 0.850 | 186,1074 | 52 by 32 |
| 2128 + 1/2 | 18.1 | 1.33 | 1.24 | 1.07 | 1.11 | 1.07 | 0.003 | 2.60 | 9,8 | 39.8 | 46.8 | 0.85 | 1.04 | 1.274 | 1.269 | 1.004 | 0.851 | 218,1074 | 60 by 36 |
| 2129 | 18.5 | 1.33 | 1.24 | 1.07 | 1.11 | 1.07 | 0.003 | 2.97 | 6,0 | 39.7 | 46.5 | 0.85 | 1.04 | 1.267 | 1.270 | 0.997 | 0.852 | 6,566 | 40 by 56 |
| 2129 + 1/2 | 18.7 | 1.35 | 1.25 | 1.08 | 1.12 | 1.08 | 0.003 | 3.18 | 6,0 | 39.3 | 45.6 | 0.85 | 1.04 | 1.273 | 1.257 | 1.013 | 0.851 | 6,1074 | 28 by 48 |
| 2130 | 18.9 | 1.33 | 1.25 | 1.06 | 1.09 | 1.06 | 0.004 | 2.75 | 6,0 | 39.1 | 44.9 | 0.85 | 1.03 | 1.247 | 1.253 | 0.995 | 0.850 | 1914,594 | 28 by 60 |
| 2130 + 1/2 | 19.1 | 1.32 | 1.25 | 1.06 | 1.08 | 1.06 | 0.006 | 2.37 | 6,0 | 38.7 | 45.6 | 0.85 | 1.02 | 1.240 | 1.231 | 1.007 | 0.850 | 1666,1074 | 136 by 28 |
| 2131 | 19.2 | 1.30 | 1.25 | 1.04 | 1.06 | 1.04 | 0.006 | 2.58 | 6,0 | 38.0 | 46.5 | 0.85 | 1.02 | 1.214 | 1.227 | 0.989 | 0.849 | 1718,1054 | 68 by 60 |
| 2131 + 1/2 | 19.3 | 1.30 | 1.25 | 1.04 | 1.05 | 1.04 | 0.012 | 2.63 | 3,7 | 38.0 | 47.2 | 0.85 | 1.01 | 1.214 | 1.211 | 1.003 | 0.847 | 6,1074 | 24 by 44 |
| 2132 | 19.3 | 1.30 | 1.25 | 1.04 | 1.06 | 1.04 | 0.005 | 2.66 | 3,7 | 38.1 | 47.9 | 0.85 | 1.00 | 1.199 | 1.211 | 0.990 | 0.846 | 210,1074 | 52 by 36 |
| 2132 + 1/2 | 19.4 | 1.30 | 1.25 | 1.04 | 1.05 | 1.04 | 0.011 | 2.74 | 3,7 | 38.3 | 49.8 | 0.84 | 1.00 | 1.207 | 1.197 | 1.008 | 0.844 | 246,1074 | 56 by 36 |
| 2133 | 19.5 | 1.29 | 1.25 | 1.03 | 1.05 | 1.03 | 0.009 | 2.52 | 3,7 | 37.8 | 51.5 | 0.84 | 0.99 | 1.195 | 1.195 | 1.001 | 0.842 | 286,1074 | 64 by 44 |
| 2133 + 1/2 | 19.4 | 1.28 | 1.25 | 1.02 | 1.04 | 1.02 | 0.009 | 2.43 | 0,4 | 37.1 | 53.4 | 0.84 | 0.98 | 1.191 | 1.177 | 1.011 | 0.841 | 678,1074 | 108 by 44 |
| 2134 | 19.6 | 1.25 | 1.26 | 0.99 | 1.00 | 0.99 | 0.015 | 2.65 | 0,4 | 35.9 | 54.7 | 0.83 | 0.97 | 1.159 | 1.173 | 0.988 | 0.838 | 1790,1074 | 60 by 40 |
| 2134 + 1/2 | 19.6 | 1.24 | 1.26 | 0.98 | 1.00 | 0.98 | 0.013 | 2.65 | 0,4 | 34.8 | 56.5 | 0.83 | 0.97 | 1.155 | 1.148 | 1.006 | 0.836 | 154,1074 | 84 by 40 |
| 2135 | 19.8 | 1.21 | 1.26 | 0.96 | 0.98 | 0.96 | 0.016 | 2.61 | 4,7 | 33.9 | 58.0 | 0.83 | 0.96 | 1.132 | 1.157 | 0.979 | 0.834 | 782,1074 | 84 by 40 |
| 2135 + 1/2 | 19.8 | 1.21 | 1.25 | 0.97 | 0.97 | 0.97 | 0.016 | 2.66 | 4,6 | 33.9 | 59.6 | 0.83 | 0.95 | 1.138 | 1.166 | 0.975 | 0.831 | 1914,402 | 28 by 68 |
| 2136 | 20.0 | 1.24 | 1.24 | 1.00 | 0.99 | 0.99 | 0.022 | 2.31 | 4,6 | 34.0 | 61.5 | 0.83 | 0.97 | 1.178 | 1.164 | 1.012 | 0.829 | 1914,494 | 36 by 100 |
| 2136 + 1/2 | 20.0 | 1.24 | 1.24 | 1.00 | 1.00 | 1.00 | 0.022 | 2.45 | 4,6 | 32.1 | 62.3 | 0.83 | 0.96 | 1.190 | 1.188 | 1.001 | 0.826 | 1398,1074 | 108 by 32 |
| 2137 | 20.1 | 1.26 | 1.24 | 1.02 | 1.01 | 1.01 | 0.023 | 2.63 | 11,8 | 30.8 | 64.0 | 0.82 | 0.97 | 1.199 | 1.201 | 0.998 | 0.823 | 1914,1074 | 36 by 40 |
| 2137 + 1/2 | 20.3 | 1.27 | 1.24 | 1.03 | 1.02 | 1.02 | 0.029 | 2.94 | 12,8 | 29.5 | 65.1 | 0.82 | 0.98 | 1.215 | 1.194 | 1.018 | 0.820 | 1914,1074 | 36 by 52 |
| 2138 | 20.4 | 1.28 | 1.24 | 1.04 | 1.03 | 1.03 | 0.025 | 3.93 | 15,8 | 28.9 | 66.2 | 0.81 | 1.01 | 1.213 | 1.170 | 1.037 | 0.817 | 1914,726 | 80 by 152 |
| 2138 + 1/2 | 20.5 | 1.23 | 1.24 | 0.99 | 0.99 | 0.99 | 0.024 | 3.27 | 15,8 | 28.6 | 66.9 | 0.81 | 1.00 | 1.141 | 1.160 | 0.984 | 0.813 | 1914,1074 | 28 by 40 |
| 2139 | 20.5 | 1.21 | 1.24 | 0.98 | 0.98 | 0.98 | 0.022 | 3.14 | 15,8 | 28.6 | 67.6 | 0.81 | 1.00 | 1.107 | 1.089 | 1.017 | 0.809 | 1718,1074 | 136 by 36 |
| 2139 + 1/2 | 20.8 | 1.16 | 1.24 | 0.94 | 0.94 | 0.94 | 0.028 | 2.53 | 15,8 | 28.7 | 67.2 | 0.81 | 0.98 | 1.036 | 1.058 | 0.979 | 0.805 | 66,1026 | 96 by 192 |
| 2140 | 20.8 | 1.16 | 1.24 | 0.94 | 0.93 | 0.93 | 0.030 | 2.87 | 15,8 | 28.5 | 67.1 | 0.80 | 1.00 | 1.009 | 1.009 | 1.000 | 0.801 | 1914,1006 | 64 by 60 |
| 2140 + 1/2 | 20.9 | 1.17 | 1.24 | 0.95 | 0.92 | 0.92 | 0.033 | 2.89 | 0,6 | 28.5 | 65.9 | 0.80 | 1.00 | 0.982 | 0.970 | 1.012 | 0.797 | 1914,866 | 32 by 80 |
| 2141 | 21.1 | 1.15 | 1.24 | 0.93 | 0.92 | 0.92 | 0.024 | 2.63 | 0,6 | 28.1 | 64.7 | 0.80 | 0.99 | 0.932 | 0.933 | 0.998 | 0.794 | 1914,846 | 44 by 80 |
| 2141 + 1/2 | 21.2 | 1.13 | 1.24 | 0.91 | 0.92 | 0.91 | 0.016 | 3.34 | 0,7 | 28.3 | 62.1 | 0.80 | 1.00 | 0.885 | 0.895 | 0.989 | 0.790 | 1830,898 | 124 by 60 |
| 2142 | 21.4 | 1.14 | 1.24 | 0.92 | 0.92 | 0.92 | 0.021 | 4.21 | 0,7 | 28.9 | 57.9 | 0.79 | 0.99 | 0.858 | 0.860 | 0.998 | 0.787 | 1914,770 | 36 by 76 |
| 2142 + 1/2 | 21.5 | 1.12 | 1.24 | 0.90 | 0.90 | 0.90 | 0.025 | 3.26 | 0,7 | 30.2 | 54.5 | 0.79 | 1.00 | 0.835 | 0.839 | 0.995 | 0.784 | 1838,866 | 60 by 56 |
| 2143 | 21.8 | 1.13 | 1.24 | 0.91 | 0.91 | 0.91 | 0.018 | 2.66 | 0,7 | 29.9 | 51.5 | 0.79 | 1.00 | 0.820 | 0.832 | 0.984 | 0.782 | 914,1074 | 72 by 28 |
| 2143 + 1/2 | 22.0 | 1.15 | 1.24 | 0.93 | 0.94 | 0.93 | 0.015 | 2.11 | 0,8 | 29.6 | 49.2 | 0.78 | 1.00 | 0.820 | 0.832 | 0.986 | 0.779 | 1230,1074 | 48 by 36 |
| 2144 | 22.0 | 1.17 | 1.24 | 0.95 | 0.90 | 0.90 | 0.035 | 2.31 | 0,8 | 28.9 | 51.6 | 0.78 | 0.97 | 0.830 | 0.832 | 0.998 | 0.777 | 1914,286 | 32 by 68 |
| 2144 + 1/2 | 22.4 | 1.23 | 1.23 | 0.99 | 0.99 | 0.99 | 0.022 | 2.64 | 0,8 | 28.9 | 51.1 | 0.78 | 1.00 | 0.843 | 0.846 | 0.996 | 0.775 | 1826,1074 | 84 by 32 |
| 2145 | 22.7 | 1.26 | 1.23 | 1.03 | 1.01 | 1.01 | 0.022 | 2.87 | 1,5 | 29.3 | 51.5 | 0.78 | 1.00 | 0.862 | 0.861 | 1.000 | 0.774 | 1790,1074 | 68 by 36 |
| 2145 + 1/2 | 23.0 | 1.30 | 1.23 | 1.06 | 1.04 | 1.04 | 0.026 | 3.12 | 1,5 | 29.0 | 46.8 | 0.78 | 1.02 | 0.879 | 0.868 | 1.013 | 0.773 | 834,1074 | 84 by 28 |
| 2146 | 23.0 | 1.31 | 1.23 | 1.07 | 1.09 | 1.07 | 0.018 | 3.23 | 1,5 | 30.7 | 46.5 | 0.78 | 1.03 | 0.888 | 0.871 | 1.019 | 0.772 | 1478,1074 | 76 by 28 |
| 2146 + 1/2 | 23.1 | 1.29 | 1.22 | 1.06 | 1.11 | 1.06 | 0.013 | 3.07 | 12,8 | 31.0 | 44.8 | 0.78 | 1.05 | 0.875 | 0.874 | 1.001 | 0.771 | 1534,1074 | 120 by 52 |
| 2147 | 23.5 | 1.31 | 1.22 | 1.07 | 1.10 | 1.07 | 0.018 | 2.69 | 1,5 | 31.8 | 47.3 | 0.78 | 1.05 | 0.868 | 0.868 | 1.000 | 0.771 | 1294,1074 | 60 by 44 |
| 2147 + 1/2 | 23.6 | 1.29 | 1.23 | 1.05 | 1.08 | 1.05 | 0.026 | 2.68 | 1,6 | 32.0 | 46.0 | 0.78 | 1.06 | 0.861 | 0.860 | 1.001 | 0.771 | 1278,1074 | 64 by 52 |
| 2148 | 23.7 | 1.29 | 1.23 | 1.05 | 1.06 | 1.05 | 0.025 | 2.73 | 1,5 | 32.3 | 45.4 | 0.77 | 1.05 | 0.852 | 0.851 | 1.001 | 0.771 | 494,774 | 68 by 72 |
| 2148 + 1/2 | 23.8 | 1.29 | 1.23 | 1.04 | 1.06 | 1.04 | 0.020 | 2.79 | 1,5 | 33.9 | 44.5 | 0.77 | 1.03 | 0.841 | 0.835 | 1.008 | 0.769 | 1330,1074 | 72 by 44 |
| 2149 | 24.2 | 1.28 | 1.24 | 1.03 | 1.04 | 1.03 | 0.018 | 2.68 | 1,5 | 33.1 | 42.1 | 0.77 | 1.03 | 0.818 | 0.824 | 0.993 | 0.767 | 1318,1074 | 60 by 64 |
| 2149 + 1/2 | 24.1 | 1.24 | 1.24 | 1.00 | 1.01 | 1.00 | 0.023 | 2.36 | 1,5 | 33.0 | 43.3 | 0.77 | 1.01 | 0.806 | 0.800 | 1.007 | 0.764 | 518,734 | 72 by 80 |
| 2150 | 24.4 | 1.23 | 1.25 | 0.99 | 1.00 | 0.99 | 0.017 | 1.93 | 2,5 | 32.2 | 43.4 | 0.77 | 1.02 | 0.782 | 0.781 | 1.002 | 0.760 | 1218,946 | 56 by 56 |
| 2150 + 1/2 | 24.2 | 1.24 | 1.26 | 0.99 | 0.99 | 0.99 | 0.021 | 2.16 | 15,1 | 32.2 | 42.1 | 0.76 | 1.02 | 0.755 | 0.761 | 0.992 | 0.755 | 1478,850 | 56 by 56 |
| 2151 | 24.1 | 1.23 | 1.27 | 0.97 | 1.00 | 0.97 | 0.014 | 2.91 | 15,1 | 31.2 | 39.8 | 0.76 | 1.01 | 0.741 | 0.741 | 1.000 | 0.750 | 558,714 | 64 by 60 |
| 2151 + 1/2 | 24.2 | 1.22 | 1.27 | 0.96 | 0.97 | 0.96 | 0.016 | 3.27 | 15,1 | 30.2 | 38.5 | 0.75 | 1.02 | 0.727 | 0.732 | 0.992 | 0.744 | 1430,830 | 48 by 56 |
| 2152 | 24.0 | 1.21 | 1.27 | 0.95 | 0.94 | 0.94 | 0.025 | 3.15 | 15,1 | 30.1 | 36.8 | 0.74 | 1.03 | 0.722 | 0.725 | 0.996 | 0.737 | 818,790 | 72 by 52 |
| 2152 + 1/2 | 23.8 | 1.21 | 1.27 | 0.95 | 0.95 | 0.95 | 0.023 | 2.04 | 14,1 | 28.4 | 36.7 | 0.73 | 1.02 | 0.724 | 0.721 | 1.004 | 0.729 | 514,650 | 72 by 128 |
| 2153 | 23.2 | 1.20 | 1.27 | 0.95 | 0.91 | 0.91 | 0.035 | 2.39 | 14,1 | 28.4 | 37.1 | 0.73 | 1.00 | 0.720 | 0.721 | 0.998 | 0.721 | 538,638 | 76 by 116 |
| 2153 + 1/2 | 23.2 | 1.23 | 1.27 | 0.97 | 0.94 | 0.94 | 0.032 | 2.19 | 14,1 | 27.2 | 37.1 | 0.72 | 1.00 | 0.720 | 0.720 | 1.000 | 0.712 | 566,606 | 84 by 124 |
| 2154 | 22.5 | 1.25 | 1.25 | 1.00 | 0.93 | 0.93 | 0.042 | 2.08 | 5,6 | 26.4 | 36.8 | 0.70 | 0.98 | 0.717 | 0.720 | 0.996 | 0.703 | 1562,518 | 52 by 76 |
| 2154 + 1/2 | 22.2 | 1.22 | 1.25 | 0.98 | 0.97 | 0.97 | 0.024 | 2.22 | 15,3 | 25.3 | 36.8 | 0.70 | 0.97 | 0.719 | 0.737 | 0.976 | 0.692 | 1030,1034 | 124 by 136 |
| 2155 | 21.6 | 1.24 | 1.24 | 1.00 | 0.95 | 0.95 | 0.058 | 2.94 | 15,3 | 24.7 | 35.9 | 0.68 | 0.97 | 0.754 | 0.766 | 0.984 | 0.677 | 962,1074 | 92 by 60 |
| 2155 + 1/2 | 21.5 | 1.29 | 1.24 | 1.04 | 1.01 | 1.01 | 0.049 | 4.32 | 15,3 | 23.7 | 35.3 | 0.66 | 1.00 | 0.813 | 0.800 | 1.017 | 0.659 | 978,1074 | 112 by 80 |
| 2156 | 21.5 | 1.34 | 1.23 | 1.09 | 1.07 | 1.07 | 0.046 | 5.62 | 15,8 | 22.9 | 34.2 | 0.64 | 0.99 | 0.845 | 0.848 | 0.997 | 0.642 | 1094,270 | 76 by 60 |
| 2156 + 1/2 | 21.3 | 1.34 | 1.23 | 1.09 | 1.06 | 1.06 | 0.055 | 7.87 | 15,8 | 21.9 | 33.6 | 0.63 | 0.98 | 0.882 | 0.909 | 0.971 | 0.625 | 1386,626 | 48 by 56 |
| 2157 | 21.0 | 1.40 | 1.22 | 1.15 | 1.15 | 1.15 | 0.056 | 7.61 | 15,3 | 20.8 | 32.6 | 0.61 | 1.01 | 0.972 | 0.951 | 1.022 | 0.609 | 954,870 | 280 by 164 |
| 2157 + 1/2 | 20.5 | 1.46 | 1.22 | 1.20 | 1.24 | 1.197 | 0.043 | 7.58 | 15,6 | 20.4 | 28.3 | 0.59 | 1.02 | 1.054 | 0.960 | 1.098 | 0.593 | 1082,826 | 216 by 140 |
| 2158 | 19.9 | 1.43 | 1.21 | 1.18 | 1.17 | 1.17 | 0.050 | 8.97 | 15,3 | 19.0 | 25.6 | 0.58 | 1.01 | 1.020 | 0.960 | 1.063 | 0.577 | 910,582 | 156 by 112 |
| 2158 + 1/2 | 19.1 | 1.37 | 1.21 | 1.14 | 1.12 | 1.12 | 0.075 | 8.91 | 15,3 | 17.6 | 23.8 | 0.56 | 1.02 | 0.947 | 0.949 | 0.998 | 0.563 | 914,574 | 112 by 80 |
| 2159 | 19.5 | 1.29 | 1.21 | 1.07 | 1.04 | 1.04 | 0.102 | 7.08 | 14,3 | 17.1 | 22.8 | 0.55 | 0.98 | 0.878 | 0.865 | 1.016 | 0.549 | 1046,682 | 208 by 156 |
| 2159 + 1/2 | 18.6 | 1.26 | 1.19 | 1.06 | 0.99 | 0.99 | 0.100 | 7.68 | 14,3 | 16.1 | 21.5 | 0.53 | 0.98 | 0.782 | 0.797 | 0.981 | 0.535 | 910,682 | 164 by 128 |
| 2160 | 18.9 | 1.16 | 1.19 | 0.97 | 0.96 | 0.96 | 0.095 | 3.15 | 13,2 | 15.3 | 19.9 | 0.52 | 0.99 | 0.716 | 0.723 | 0.991 | 0.522 | 970,506 | 56 by 64 |
| 2160 + 1/2 | 17.7 | 1.14 | 1.17 | 0.98 | 0.94 | 0.94 | 0.093 | 3.18 | 14,5 | 14.4 | 18.7 | 0.51 | 0.97 | 0.664 | 0.666 | 0.996 | 0.509 | 990,510 | 60 by 60 |
| 2161 | 17.2 | 1.17 | 1.11 | 1.06 | 1.01 | 1.01 | 0.079 | 3.20 | 13,2 | 13.6 | 17.7 | 0.50 | 1.01 | 0.616 | 0.622 | 0.991 | 0.496 | 618,1002 | 80 by 72 |
| 2161 + 1/2 | 16.9 | 1.08 | 1.07 | 1.01 | 1.09 | 1.01 | 0.067 | 2.81 | 13,3 | 12.6 | 16.4 | 0.48 | 1.02 | 0.581 | 0.588 | 0.987 | 0.484 | 1190,1074 | 56 by 24 |
| 2162 | 17.2 | 1.00 | 1.02 | 0.98 | 0.98 | 0.98 | 0.071 | 3.15 | 13,6 | 11.8 | 15.8 | 0.47 | 0.99 | 0.559 | 0.571 | 0.980 | 0.472 | 854,1074 | 116 by 56 |
| 2162 + 1/2 | 16.7 | 0.96 | 0.97 | 0.99 | 0.97 | 0.97 | 0.047 | 3.54 | 13,4 | 11.7 | 21.8 | 0.46 | 1.01 | 0.561 | 0.550 | 1.019 | 0.461 | 878,1074 | 116 by 40 |
| 2163 | 15.9 | 0.94 | 0.94 | 1.00 | 1.04 | 1.00 | 0.045 | 3.72 | 13,4 | 11.6 | 29.3 | 0.45 | 0.99 | 0.542 | 0.547 | 0.989 | 0.449 | 734,1074 | 44 by 28 |
| 2163 + 1/2 | 15.2 | 0.92 | 0.91 | 1.01 | 0.92 | 0.92 | 0.066 | 3.77 | 13,6 | 11.2 | 33.3 | 0.44 | 0.98 | 0.531 | 0.539 | 0.986 | 0.438 | 638,766 | 68 by 96 |
| 2164 | 14.5 | 0.88 | 0.89 | 0.99 | 1.04 | 0.99 | 0.054 | 3.96 | 13,4 | 10.8 | 33.4 | 0.43 | 1.00 | 0.536 | 0.528 | 1.016 | 0.428 | 854,1026 | 192 by 136 |
| 2164 + 1/2 | 14.0 | 0.86 | 0.86 | 1.00 | 1.01 | 1.00 | 0.039 | 3.99 | 13,5 | 10.4 | 26.1 | 0.42 | 1.00 | 0.524 | 0.524 | 0.999 | 0.417 | 806,1074 | 64 by 36 |
| 2165 | 13.4 | 0.84 | 0.84 | 1.00 | 1.01 | 1.00 | 0.034 | 3.50 | 13,5 | 10.1 | 25.9 | 0.40 | 0.99 | 0.518 | 0.521 | 0.994 | 0.407 | 850,1074 | 128 by 52 |
| 2165 + 1/2 | 12.5 | 0.81 | 0.81 | 1.01 | 1.01 | 1.01 | 0.027 | 3.29 | 13,4 | 9.6 | 25.1 | 0.39 | 1.01 | 0.518 | 0.513 | 1.009 | 0.396 | 810,1038 | 128 by 76 |
| 2166 | 11.8 | 0.78 | 0.79 | 0.99 | 1.00 | 0.99 | 0.020 | 2.36 | 5,8 | 8.6 | 22.2 | 0.38 | 1.00 | 0.509 | 0.511 | 0.995 | 0.387 | 830,1038 | 164 by 76 |
| 2166 + 1/2 | 11.1 | 0.76 | 0.77 | 0.99 | 0.99 | 0.99 | 0.018 | 2.91 | 12,3 | 8.1 | 22.9 | 0.37 | 0.95 | 0.504 | 0.505 | 0.999 | 0.377 | 842,1030 | 140 by 64 |
| 2167 | 10.4 | 0.76 | 0.76 | 1.00 | 0.99 | 0.99 | 0.020 | 2.81 | 6,8 | 7.5 | 21.0 | 0.36 | 0.99 | 0.500 | 0.503 | 0.996 | 0.366 | 830,1014 | 120 by 60 |
| 2167 + 1/2 | 9.5 | 0.76 | 0.74 | 1.02 | 1.02 | 1.02 | 0.016 | 2.54 | 12,3 | 6.7 | 18.4 | 0.35 | 1.02 | 0.501 | 0.500 | 1.002 | 0.357 | 842,1010 | 144 by 76 |
| 2168 | 8.7 | 0.72 | 0.73 | 1.00 | 1.00 | 1.00 | 0.013 | 2.30 | 6,8 | 6.0 | 17.0 | 0.35 | 0.98 | 0.500 | 0.499 | 1.002 | 0.349 | 818,990 | 136 by 68 |
| 2168 + 1/2 | 7.8 | 0.69 | 0.69 | 1.00 | 1.01 | 1.00 | 0.006 | 1.97 | 6,8 | 5.2 | 15.8 | 0.34 | 1.02 | 0.498 | 0.497 | 1.002 | 0.341 | 842,994 | 152 by 108 |
| 2169 | 7.0 | 0.67 | 0.67 | 0.99 | 0.99 | 0.99 | 0.005 | 1.76 | 12,3 | 4.6 | 13.4 | 0.33 | 1.01 | 0.493 | 0.492 | 1.002 | 0.333 | 846,986 | 132 by 72 |
| 2169 + 1/2 | 6.4 | 0.65 | 0.65 | 1.00 | 0.99 | 0.99 | 0.004 | 1.78 | 6,7 | 4.4 | 11.5 | 0.32 | 0.95 | 0.487 | 0.488 | 0.999 | 0.326 | 846,978 | 100 by 48 |
| 2170 | 5.7 | 0.63 | 0.63 | 1.00 | 1.00 | 1.00 | 0.002 | 2.27 | 8,0 | 4.4 | 9.1 | 0.32 | 0.99 | 0.476 | 0.484 | 0.983 | 0.319 | 842,970 | 104 by 60 |
| 2170 + 1/2 | 4.9 | 0.62 | 0.62 | 1.00 | 1.00 | 1.00 | 0.000 | 1.99 | 8,0 | 4.3 | 8.0 | 0.31 | 1.04 | 0.482 | 0.478 | 1.008 | 0.313 | 854,962 | 112 by 64 |
| 2171 | 4.2 | 0.61 | 0.59 | 1.03 | 1.03 | 1.03 | 0.000 | 1.86 | 6,7 | 4.7 | 9.0 | 0.30 | 0.99 | 0.479 | 0.447 | 1.072 | 0.308 | 858,958 | 140 by 84 |
| 2171 + 1/2 | 3.4 | 0.55 | 0.57 | 0.98 | 0.98 | 0.98 | 0.000 | 1.64 | 8,0 | 4.8 | 9.3 | 0.30 | 0.90 | 0.419 | 0.443 | 0.945 | 0.302 | 814,882 | 92 by 60 |
| 2172 | 2.7 | 0.52 | 0.53 | 1.00 | 1.00 | 1.00 | 0.000 | 1.50 | 9,8 | 5.5 | 10.6 | 0.30 | 0.98 | 0.407 | 0.408 | 0.998 | 0.298 | 790,762 | 124 by 76 |
| 2172 + 1/2 | 2.1 | 0.50 | 0.50 | 0.99 | 0.99 | 0.99 | 0.000 | 1.52 | 9,8 | 6.2 | 11.9 | 0.29 | 1.09 | 0.397 | 0.401 | 0.990 | 0.293 | 834,770 | 144 by 76 |
| 2173 | 1.6 | 0.47 | 0.49 | 0.96 | 0.96 | 0.96 | 0.000 | 1.41 | 9,8 | 6.7 | 12.8 | 0.29 | 1.07 | 0.394 | 0.396 | 0.996 | 0.289 | 870,786 | 148 by 100 |
| 2173 + 1/2 | 1.3 | 0.45 | 0.49 | 0.92 | 0.92 | 0.92 | 0.000 | 1.64 | 8,8 | 7.0 | 13.6 | 0.28 | 1.05 | 0.392 | 0.395 | 0.995 | 0.286 | 1222,790 | 68 by 68 |
| 2174 | 1.0 | 0.44 | 0.49 | 0.89 | 0.89 | 0.89 | 0.000 | 1.35 | 8,8 | 7.3 | 13.9 | 0.28 | 0.99 | 0.395 | 0.394 | 1.002 | 0.282 | 774,670 | 176 by 272 |
| 2174 + 1/2 | 0.9 | 0.43 | 0.49 | 0.86 | 0.86 | 0.86 | 0.000 | 1.30 | 9,8 | 7.6 | 14.6 | 0.28 | 0.95 | 0.395 | 0.394 | 1.001 | 0.278 | 698,682 | 232 by 144 |
| 2175 | 0.9 | 0.42 | 0.49 | 0.85 | 0.85 | 0.85 | 0.000 | 1.24 | 9,8 | 7.6 | 15.1 | 0.27 | 0.98 | 0.394 | 0.397 | 0.992 | 0.275 | 1034,198 | 68 by 72 |
| 2175 + 1/2 | 0.9 | 0.42 | 0.49 | 0.86 | 0.86 | 0.86 | 0.000 | 1.25 | 8,8 | 7.2 | 14.2 | 0.27 | 0.97 | 0.400 | 0.397 | 1.009 | 0.272 | 750,578 | 140 by 160 |
| 2176 | 0.8 | 0.42 | 0.49 | 0.86 | 0.86 | 0.86 | 0.000 | 1.50 | 8,8 | 6.6 | 13.2 | 0.27 | 0.96 | 0.399 | 0.401 | 0.996 | 0.268 | 1010,586 | 68 by 56 |
| 2176 + 1/2 | 0.8 | 0.42 | 0.49 | 0.85 | 0.85 | 0.85 | 0.000 | 1.69 | 11,2 | 6.4 | 12.4 | 0.26 | 0.95 | 0.402 | 0.404 | 0.995 | 0.265 | 690,642 | 236 by 200 |
| 2177 | 0.8 | 0.42 | 0.49 | 0.85 | 0.85 | 0.85 | 0.000 | 1.73 | 11,2 | 7.5 | 11.5 | 0.26 | 0.93 | 0.407 | 0.404 | 1.005 | 0.262 | 746,638 | 160 by 256 |
| 2177 + 1/2 | 0.8 | 0.41 | 0.49 | 0.84 | 0.84 | 0.84 | 0.000 | 1.75 | 11,2 | 7.0 | 10.5 | 0.25 | 0.92 | 0.407 | 0.408 | 0.998 | 0.259 | 798,242 | 116 by 68 |
| 2178 | 0.8 | 0.40 | 0.49 | 0.82 | 0.82 | 0.82 | 0.000 | 1.63 | 11,2 | 7.2 | 9.5 | 0.23 | 0.89 | 0.410 | 0.409 | 1.002 | 0.256 | 826,578 | 144 by 232 |
| 2178 + 1/2 | 0.8 | 0.39 | 0.49 | 0.80 | 0.80 | 0.80 | 0.000 | 1.62 | 9,7 | 8.1 | 11.1 | 0.21 | 0.88 | 0.412 | 0.410 | 1.006 | 0.254 | 790,526 | 108 by 104 |
| 2179 | 0.9 | 0.38 | 0.49 | 0.78 | 0.79 | 0.78 | 0.000 | 1.88 | 8,7 |  |  |  | 0.85 | 0.410 | 0.413 | 0.994 | 0.252 | 734,590 | 140 by 240 |
| 2179 + 1/2 | 1.1 | 0.38 | 0.49 | 0.78 | 0.81 | 0.78 | 0.000 | 2.16 | 8,7 |  |  |  | 0.85 | 0.413 | 0.417 | 0.989 | 0.249 | 1050,794 | 72 by 92 |
| 2180 | 1.4 | 0.41 | 0.49 | 0.84 | 0.87 | 0.84 | 0.000 | 2.70 | 8,7 |  |  |  | 0.91 | 0.423 | 0.421 | 1.005 | 0.247 | 810,826 | 108 by 92 |
| 2180 + 1/2 | 1.9 | 0.45 | 0.49 | 0.91 | 0.97 | 0.91 | 0.000 | 2.73 | 8,7 |  |  |  | 1.05 | 0.441 | 0.425 | 1.037 | 0.245 | 798,502 | 116 by 88 |
| 2181 | 2.5 | 0.49 | 0.51 | 0.97 | 1.08 | 0.97 | 0.000 | 2.90 | 8,7 |  |  |  | 0.96 | 0.428 | 0.443 | 0.967 | 0.243 | 814,490 | 120 by 188 |
| 2181 + 1/2 | 3.3 | 0.54 | 0.52 | 1.04 | 1.20 | 1.04 | 0.000 | 3.83 | 5,1 |  |  |  | 1.02 | 0.444 | 0.436 | 1.019 | 0.240 | 642,678 | 108 by 120 |
| 2182 | 4.2 | 0.59 | 0.54 | 1.09 | 1.32 | 1.09 | 0.006 | 4.76 | 5,1 |  |  |  | 1.10 | 0.464 | 0.438 | 1.061 | 0.239 | 622,634 | 116 by 176 |
| 2182 + 1/2 | 5.4 | 0.63 | 0.55 | 1.15 | 1.40 | 1.15 | 0.005 | 7.39 | 6,0 |  |  |  | 1.09 | 0.431 | 0.455 | 0.946 | 0.238 | 794,462 | 92 by 164 |
| 2183 | 6.8 | 0.66 | 0.55 | 1.21 | 1.41 | 1.21 | 0.010 | 8.46 | 6,0 |  |  |  | 0.98 | 0.450 | 0.462 | 0.973 | 0.236 | 810,158 | 76 by 76 |
| 2183 + 1/2 | 8.4 | 0.67 | 0.55 | 1.22 | 1.37 | 1.22 | 0.016 | 10.70 | 5,0 |  |  |  | 1.14 | 0.461 | 0.480 | 0.959 | 0.235 | 830,114 | 108 by 60 |
| 2184 | 10.1 | 0.68 | 0.55 | 1.25 | 1.34 | 1.25 | 0.025 | 11.50 | 5,0 |  |  |  | 1.08 | 0.522 | 0.474 | 1.101 | 0.233 | 790,118 | 140 by 112 |
| 2184 + 1/2 | 11.7 | 0.64 | 0.55 | 1.17 | 1.25 | 1.17 | 0.031 | 7.70 | 13,0 |  |  |  | 1.07 | 0.510 | 0.503 | 1.014 | 0.229 | 794,74 | 124 by 100 |
| 2185 | 13.5 | 0.64 | 0.55 | 1.17 | 1.20 | 1.17 | 0.035 | 5.84 | 13,0 |  |  |  | 1.00 | 0.488 | 0.520 | 0.939 | 0.221 | 718,102 | 108 by 108 |
| 2185 + 1/2 | 14.8 | 0.64 | 0.55 | 1.18 | 1.18 | 1.18 | 0.036 | 5.63 | 10,0 |  |  |  | 0.91 | 0.518 | 0.517 | 1.001 | 0.211 | 658,122 | 72 by 64 |
| 2186 | 15.8 | 0.63 | 0.55 | 1.15 | 1.19 | 1.15 | 0.029 | 5.14 | 2,1 |  |  |  | 0.94 | 0.524 | 0.521 | 1.007 | 0.197 | 542,226 | 76 by 64 |
| 2186 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

## place

### dive (earth.dive, T at 1919, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

### rise (earth.rise, T at 2100, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 2x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 14.22, uhd 33.77.

Largest mean difference: 1.674 at frame 2156 (earth.rise), limit 12.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 0.399 at frame 2010 (earth.terrain), limit 3.2.
Largest level difference of one block (a grid of 16 by 9): -2.296 at frame 1755 (earth.hold), limit 12.
Largest level difference of the whole frame: -0.323 at frame 2010 (earth.terrain), limit 2.2.
Picture: r/out/work/smooth/earth-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1755 | earth.hold | 1.542 | 11.3 | 78 | -0.208 | -0.243 | 0.396 | 12.32 | -2.296 | 6,2 | 0.987 |
| 1853 | earth.dive | 1.581 | 9.4 | 86 | -0.067 | -0.116 | 0.385 | 7.83 | -1.018 | 4,5 | 1.069 |
| 1875 | earth.dive | 1.561 | 8.8 | 59 | 0.056 | 0.078 | 0.356 | 8.70 | 0.869 | 3,8 | 1.094 |
| 1898 | earth.dive | 1.469 | 8.7 | 52 | -0.194 | -0.265 | 0.318 | 10.39 | -1.367 | 10,6 | 1.131 |
| 2010 | earth.terrain | 1.543 | 8.9 | 61 | -0.323 | -0.400 | 0.399 | 6.18 | -1.354 | 9,8 | 0.932 |
| 2119 | earth.rise | 1.486 | 8.7 | 55 | -0.171 | -0.220 | 0.304 | 7.64 | -0.843 | 9,8 | 1.110 |
| 2138 | earth.rise | 1.583 | 9.1 | 61 | 0.022 | -0.042 | 0.326 | 9.17 | 0.468 | 7,3 | 1.144 |
| 2156 | earth.rise | 1.674 | 10.5 | 89 | 0.017 | 0.031 | 0.377 | 9.77 | 0.859 | 8,8 | 1.092 |
| 2213 | earth.travel | 1.283 | 7.5 | 93 | 0.005 | 0.006 | 0.162 | 6.96 | 0.195 | 14,7 | 1.483 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.

## counts

Film frames 1680 to 2249 in order on one fresh page, 1140 pictures at rate 2, tier draft at preview, 3910 s. Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): 5 warm draws. Its work counts for that picture and stands in brackets. Judged: dive, rise and travel, every picture.

| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |
|---|---|---|---|---|---|---|---|
| earth.hold | no | 300 | 1 | 1680 | 21 | 213 | 112 |
| earth.dive | yes | 180 | 0 |  | 0 | 0 | 0 |
| earth.terrain | no | 360 | 0 |  | 0 | 0 | 0 |
| earth.rise | yes | 150 | 0 |  | 0 | 0 | 0 |
| earth.travel | yes | 150 | 0 |  | 0 | 0 | 0 |

Every picture with work (of the warm start call in brackets):

| frame | segment | programs | texture uploads | buffers | warm draws |
|---|---|---|---|---|---|
| 1680 | earth.hold | 21 (21) | 213 (213) | 112 (112) | 5 |
