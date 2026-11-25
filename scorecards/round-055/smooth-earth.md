# smooth: earth

Commit 9d59e6999a2ac769f1c2fd941b03a2ea9a0f700a. Capture rate 2. Parts: path, pictures, place, parity, counts.

Joined from the files of 1 machine(s), nothing is rendered, measured or counted here. The path: /home/user/workspace/work/p6/sm55/05/earth (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The pictures: the dive /home/user/workspace/work/p6/sm55/01/earth-dive-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm55/02/earth-dive-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz); the rise /home/user/workspace/work/p6/sm55/03/earth-rise-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm55/04/earth-rise-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The place: /home/user/workspace/work/p6/sm55/05/earth (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The parity: /home/user/workspace/work/p6/sm55/05/earth (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The counts: /home/user/workspace/work/p6/sm55/06/earth (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

VERDICT: green. No number is over its limit.

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
| whole frames | rate | 0.06283 log of the height a film frame | 1.595 | 2144 | 0.054 | 2106 |  |  | 0.003 | 0.015 | 0.000 | 0.000 | 0.044 at 2186 |
| whole frames | turn | 1.262 degrees a film frame | 1.615 | 2146 | 0.072 | 2172 |  |  | 0.007 | 0.037 | 0.014 | 0.000 | 0.000 at 2186 |
| whole frames | speed | 4.629 px a film frame at the place | 1.606 | 2138 | 0.070 over 8 | 2126 |  |  | 0.002 | 0.031 | 0.001 over 8 | 0.002 over 8 | 5.471 at 2186 |
| rate 2 | rate | 0.06248 log of the height a film frame | 1.603 | 2144 + 1/2 | 0.054 | 2105 | 0.027 | 2105 | 0.004 | 0.013 | 0.000 | 0.000 | 0.063 at 2186 + 1/2 |
| rate 2 | turn | 1.254 degrees a film frame | 1.627 | 2146 | 0.073 | 2172 | 0.036 | 2172 | 0.009 | 0.036 | 0.016 | 0.000 | 0.000 at 2186 + 1/2 |
| rate 2 | speed | 4.551 px a film frame at the place | 1.607 | 2137 + 1/2 | 0.070 over 8 | 2126 | 0.035 over 8 | 2125 + 1/2 | 0.001 | 0.036 | 0.001 over 8 | 0.003 over 8 | 5.901 at 2186 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 2100, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.00403 of its height a film frame, the mean of its last 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 1.00 at frame 2084, limit 0.87; inside the rise itself 1.00 at frame 2100 + 1/2. Largest step from one capture frame to the next 0.57 at frame 2114 + 1/2, shown. The part along the surface view's own direction of motion: 0.61 at the lowest, lowest 0.61 at frame 2084, shown; under 0 the eye goes back.

Rest between the rise and the travel (the seam into earth.travel at film frame 2175, 12 film frames to each side, read at rate 2): a rise and the travel after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body's edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest 5.34 at frame 2175, against 32.77 at frame 2163 and 99.11 at frame 2186 + 1/2 at the ends of the window. The lowest is 0.163 of the slower end, limit 0.07. Near 0 the picture comes to rest between the rise and the travel.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2088 | terrain terrain | 3.227e-2 | 0.064 |  |  | 0.031 |  |  | 0.435 |  |  | 0 |
| 2089 | terrain terrain | 3.240e-2 | 0.064 | 0.000 | 0.001 | 0.031 | 0.000 | 0.000 | 0.421 | 0.014 | 0.015 | 8 |
| 2090 | terrain terrain | 3.252e-2 | 0.063 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.406 | 0.015 | 0.016 | 8 |
| 2091 | terrain terrain | 3.265e-2 | 0.062 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.390 | 0.015 | 0.016 | 8 |
| 2092 | terrain terrain | 3.278e-2 | 0.061 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.375 | 0.015 | 0.015 | 8 |
| 2093 | terrain terrain | 3.290e-2 | 0.059 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.361 | 0.014 | 0.015 | 8 |
| 2094 | terrain terrain | 3.302e-2 | 0.058 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.347 | 0.013 | 0.013 | 8 |
| 2095 | terrain terrain | 3.314e-2 | 0.057 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.336 | 0.012 | 0.012 | 8 |
| 2096 | terrain terrain | 3.325e-2 | 0.055 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.326 | 0.010 | 0.010 | 8 |
| 2097 | terrain terrain | 3.337e-2 | 0.054 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.318 | 0.008 | 0.008 | 8 |
| 2098 | terrain terrain | 3.348e-2 | 0.053 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.312 | 0.006 | 0.006 | 8 |
| 2099 | terrain terrain | 3.359e-2 | 0.053 | 0.001 | 0.001 | 0.031 | 0.000 | 0.000 | 0.308 | 0.004 | 0.004 | 8 |
| 2100 first | rise terrain | 3.370e-2 | 0.053 | 0.000 | 0.000 | 0.031 | 0.000 | 0.002 | 0.306 | 0.002 | 0.001 | 8 |
| 2101 | rise orbit | 3.382e-2 | 0.055 | 0.003 | 0.011 | 0.024 | 0.007 | 0.014 | 0.306 | 0.000 | 0.000 | 8 |
| 2102 | rise orbit | 3.397e-2 | 0.072 | 0.017 | 0.027 | 0.017 | 0.007 | 0.021 | 0.305 | 0.001 | 0.001 | 8 |
| 2103 | rise orbit | 3.420e-2 | 0.105 | 0.033 | 0.044 | 0.054 | 0.037 | 0.053 | 0.305 | 0.000 | 0.000 | 8 |
| 2104 | rise orbit | 3.453e-2 | 0.154 | 0.049 | 0.054 | 0.112 | 0.058 | 0.063 | 0.306 | 0.001 | 0.003 | 8 |
| 2105 | rise orbit | 3.498e-2 | 0.208 | 0.054 | 0.054 | 0.175 | 0.063 | 0.063 | 0.310 | 0.004 | 0.006 | 8 |
| 2106 | rise orbit | 3.556e-2 | 0.261 | 0.054 | 0.054 | 0.237 | 0.063 | 0.063 | 0.317 | 0.007 | 0.009 | 8 |
| 2107 | rise orbit | 3.627e-2 | 0.315 | 0.054 | 0.054 | 0.299 | 0.062 | 0.062 | 0.327 | 0.011 | 0.013 | 8 |
| 2108 | rise orbit | 3.712e-2 | 0.368 | 0.054 | 0.054 | 0.361 | 0.061 | 0.062 | 0.342 | 0.014 | 0.017 | 8 |
| 2109 | rise orbit | 3.812e-2 | 0.422 | 0.054 | 0.054 | 0.422 | 0.061 | 0.061 | 0.359 | 0.018 | 0.020 | 8 |
| 2110 | rise orbit | 3.928e-2 | 0.475 | 0.054 | 0.054 | 0.482 | 0.060 | 0.060 | 0.380 | 0.020 | 0.022 | 8 |
| 2111 | rise orbit | 4.060e-2 | 0.529 | 0.054 | 0.054 | 0.541 | 0.059 | 0.059 | 0.403 | 0.023 | 0.026 | 8 |
| 2112 | rise orbit | 4.212e-2 | 0.583 | 0.054 | 0.054 | 0.599 | 0.058 | 0.059 | 0.430 | 0.027 | 0.029 | 8 |
| 2113 | rise orbit | 4.383e-2 | 0.636 | 0.054 | 0.054 | 0.657 | 0.058 | 0.058 | 0.461 | 0.031 | 0.034 | 8 |
| 2114 | rise orbit | 4.578e-2 | 0.690 | 0.054 | 0.054 | 0.714 | 0.057 | 0.057 | 0.497 | 0.036 | 0.039 | 8 |
| 2115 | rise orbit | 4.796e-2 | 0.743 | 0.054 | 0.054 | 0.770 | 0.056 | 0.057 | 0.538 | 0.041 | 0.045 | 8 |
| 2116 | rise orbit | 5.042e-2 | 0.797 | 0.054 | 0.054 | 0.826 | 0.056 | 0.056 | 0.585 | 0.047 | 0.051 | 8 |
| 2117 | rise orbit | 5.319e-2 | 0.850 | 0.054 | 0.054 | 0.881 | 0.055 | 0.056 | 0.638 | 0.052 | 0.055 | 8 |
| 2118 | rise orbit | 5.630e-2 | 0.904 | 0.054 | 0.054 | 0.936 | 0.055 | 0.055 | 0.694 | 0.057 | 0.059 | 8 |
| 2119 | rise orbit | 5.979e-2 | 0.957 | 0.054 | 0.054 | 0.990 | 0.054 | 0.055 | 0.754 | 0.060 | 0.062 | 8 |
| 2120 | rise orbit | 6.371e-2 | 1.011 | 0.054 | 0.054 | 1.044 | 0.054 | 0.054 | 0.817 | 0.063 | 0.064 | 8 |
| 2121 | rise orbit | 6.812e-2 | 1.064 | 0.054 | 0.054 | 1.098 | 0.054 | 0.054 | 0.882 | 0.065 | 0.066 | 8 |
| 2122 | rise orbit | 7.307e-2 | 1.118 | 0.054 | 0.054 | 1.152 | 0.053 | 0.054 | 0.949 | 0.067 | 0.068 | 8 |
| 2123 | rise orbit | 7.866e-2 | 1.171 | 0.054 | 0.054 | 1.205 | 0.053 | 0.054 | 1.018 | 0.068 | 0.069 | 8 |
| 2124 | rise orbit | 8.495e-2 | 1.225 | 0.054 | 0.054 | 1.258 | 0.053 | 0.053 | 1.087 | 0.069 | 0.069 | 8 |
| 2125 | rise orbit | 9.205e-2 | 1.279 | 0.054 | 0.054 | 1.311 | 0.053 | 0.053 | 1.157 | 0.070 | 0.070 | 8 |
| 2126 | rise orbit | 1.001e-1 | 1.332 | 0.054 | 0.054 | 1.363 | 0.053 | 0.053 | 1.227 | 0.070 | 0.070 | 8 |
| 2127 | rise orbit | 1.092e-1 | 1.386 | 0.054 | 0.054 | 1.416 | 0.053 | 0.053 | 1.297 | 0.070 | 0.069 | 8 |
| 2128 | rise orbit | 1.195e-1 | 1.439 | 0.054 | 0.054 | 1.468 | 0.052 | 0.053 | 1.367 | 0.070 | 0.069 | 8 |
| 2129 | rise orbit | 1.313e-1 | 1.493 | 0.054 | 0.054 | 1.521 | 0.052 | 0.053 | 1.436 | 0.069 | 0.068 | 8 |
| 2130 | rise orbit | 1.446e-1 | 1.541 | 0.049 | 0.048 | 1.568 | 0.047 | 0.047 | 1.500 | 0.064 | 0.062 | 8 |
| 2131 | rise orbit | 1.597e-1 | 1.575 | 0.033 | 0.032 | 1.600 | 0.031 | 0.029 | 1.547 | 0.047 | 0.044 | 8 |
| 2132 | rise orbit | 1.765e-1 | 1.592 | 0.017 | 0.015 | 1.614 | 0.014 | 0.012 | 1.575 | 0.028 | 0.025 | 8 |
| 2133 | rise orbit | 1.951e-1 | 1.594 | 0.003 | 0.001 | 1.613 | 0.000 | 0.003 | 1.587 | 0.012 | 0.010 | 8 |
| 2134 | rise orbit | 2.156e-1 | 1.594 | 0.000 | 0.000 | 1.610 | 0.003 | 0.003 | 1.594 | 0.007 | 0.007 | 8 |
| 2135 | rise orbit | 2.383e-1 | 1.594 | 0.000 | 0.000 | 1.607 | 0.003 | 0.003 | 1.599 | 0.006 | 0.005 | 8 |
| 2136 | rise orbit | 2.635e-1 | 1.594 | 0.000 | 0.000 | 1.605 | 0.002 | 0.002 | 1.603 | 0.004 | 0.004 | 8 |
| 2137 | rise orbit | 2.912e-1 | 1.594 | 0.000 | 0.000 | 1.603 | 0.002 | 0.002 | 1.606 | 0.002 | 0.002 | 8 |
| 2138 | rise orbit | 3.219e-1 | 1.594 | 0.000 | 0.000 | 1.601 | 0.002 | 0.002 | 1.606 | 0.000 | 0.001 | 8 |
| 2139 | rise orbit | 3.558e-1 | 1.594 | 0.000 | 0.000 | 1.600 | 0.001 | 0.001 | 1.605 | 0.001 | 0.003 | 8 |
| 2140 | rise orbit | 3.933e-1 | 1.594 | 0.000 | 0.000 | 1.599 | 0.001 | 0.001 | 1.601 | 0.004 | 0.005 | 8 |
| 2141 | rise orbit | 4.348e-1 | 1.594 | 0.000 | 0.000 | 1.599 | 0.000 | 0.000 | 1.594 | 0.007 | 0.009 | 8 |
| 2142 | rise orbit | 4.806e-1 | 1.595 | 0.000 | 0.000 | 1.600 | 0.001 | 0.001 | 1.584 | 0.010 | 0.013 | 8 |
| 2143 | rise orbit | 5.312e-1 | 1.595 | 0.000 | 0.000 | 1.601 | 0.002 | 0.002 | 1.570 | 0.015 | 0.018 | 8 |
| 2144 | rise orbit | 5.872e-1 | 1.595 | 0.000 | 0.000 | 1.604 | 0.003 | 0.004 | 1.550 | 0.020 | 0.023 | 8 |
| 2145 | rise orbit | 6.490e-1 | 1.594 | 0.000 | 0.001 | 1.608 | 0.004 | 0.007 | 1.524 | 0.025 | 0.029 | 8 |
| 2146 | rise orbit | 7.172e-1 | 1.589 | 0.005 | 0.015 | 1.615 | 0.007 | 0.008 | 1.490 | 0.034 | 0.039 | 8 |
| 2147 | rise orbit | 7.914e-1 | 1.568 | 0.021 | 0.032 | 1.607 | 0.008 | 0.020 | 1.452 | 0.038 | 0.038 | 8 |
| 2148 | rise orbit | 8.713e-1 | 1.531 | 0.038 | 0.047 | 1.579 | 0.028 | 0.040 | 1.427 | 0.026 | 0.023 | 8 |
| 2149 | rise orbit | 9.563e-1 | 1.481 | 0.049 | 0.050 | 1.536 | 0.043 | 0.047 | 1.419 | 0.008 | 0.006 | 8 |
| 2150 | rise orbit | 1.046e+0 | 1.431 | 0.050 | 0.050 | 1.488 | 0.047 | 0.050 | 1.421 | 0.002 | 0.003 | 8 |
| 2151 | rise orbit | 1.141e+0 | 1.381 | 0.050 | 0.050 | 1.439 | 0.050 | 0.051 | 1.419 | 0.002 | 0.007 | 8 |
| 2152 | rise orbit | 1.241e+0 | 1.331 | 0.050 | 0.050 | 1.388 | 0.051 | 0.052 | 1.408 | 0.011 | 0.017 | 8 |
| 2153 | rise orbit | 1.345e+0 | 1.281 | 0.050 | 0.050 | 1.336 | 0.052 | 0.053 | 1.386 | 0.021 | 0.026 | 8 |
| 2154 | rise orbit | 1.453e+0 | 1.232 | 0.050 | 0.050 | 1.283 | 0.053 | 0.054 | 1.356 | 0.030 | 0.034 | 8 |
| 2155 | rise orbit | 1.565e+0 | 1.182 | 0.050 | 0.050 | 1.230 | 0.053 | 0.054 | 1.320 | 0.037 | 0.039 | 8 |
| 2156 | rise orbit | 1.680e+0 | 1.132 | 0.050 | 0.050 | 1.175 | 0.054 | 0.055 | 1.278 | 0.042 | 0.044 | 8 |
| 2157 | rise orbit | 1.798e+0 | 1.082 | 0.050 | 0.050 | 1.120 | 0.055 | 0.056 | 1.232 | 0.046 | 0.047 | 8 |
| 2158 | rise orbit | 1.919e+0 | 1.032 | 0.050 | 0.050 | 1.064 | 0.056 | 0.057 | 1.183 | 0.049 | 0.050 | 8 |
| 2159 | rise orbit | 2.041e+0 | 0.982 | 0.050 | 0.050 | 1.007 | 0.057 | 0.058 | 1.133 | 0.051 | 0.051 | 8 |
| 2160 | rise orbit | 2.164e+0 | 0.932 | 0.050 | 0.050 | 0.949 | 0.058 | 0.059 | 1.081 | 0.052 | 0.052 | 8 |
| 2161 | rise orbit | 2.288e+0 | 0.882 | 0.050 | 0.050 | 0.890 | 0.059 | 0.060 | 1.029 | 0.052 | 0.052 | 8 |
| 2162 | rise orbit | 2.410e+0 | 0.832 | 0.050 | 0.051 | 0.830 | 0.060 | 0.061 | 0.976 | 0.053 | 0.053 | 8 |
| 2163 | rise orbit | 2.532e+0 | 0.782 | 0.050 | 0.051 | 0.769 | 0.061 | 0.062 | 0.922 | 0.054 | 0.055 | 8 |
| 2164 | rise orbit | 2.651e+0 | 0.731 | 0.050 | 0.051 | 0.707 | 0.062 | 0.063 | 0.867 | 0.055 | 0.056 | 8 |
| 2165 | rise orbit | 2.767e+0 | 0.681 | 0.051 | 0.051 | 0.644 | 0.063 | 0.064 | 0.810 | 0.057 | 0.059 | 8 |
| 2166 | rise orbit | 2.878e+0 | 0.630 | 0.051 | 0.051 | 0.579 | 0.064 | 0.065 | 0.751 | 0.059 | 0.061 | 8 |
| 2167 | rise orbit | 2.985e+0 | 0.579 | 0.051 | 0.051 | 0.514 | 0.065 | 0.067 | 0.689 | 0.061 | 0.062 | 8 |
| 2168 | rise orbit | 3.086e+0 | 0.528 | 0.051 | 0.052 | 0.447 | 0.067 | 0.068 | 0.627 | 0.062 | 0.063 | 8 |
| 2169 | rise orbit | 3.179e+0 | 0.476 | 0.052 | 0.052 | 0.379 | 0.068 | 0.069 | 0.565 | 0.062 | 0.063 | 8 |
| 2170 | rise orbit | 3.265e+0 | 0.424 | 0.052 | 0.052 | 0.310 | 0.069 | 0.071 | 0.504 | 0.061 | 0.061 | 8 |
| 2171 | rise orbit | 3.343e+0 | 0.372 | 0.052 | 0.053 | 0.240 | 0.071 | 0.072 | 0.446 | 0.058 | 0.058 | 8 |
| 2172 | rise orbit | 3.410e+0 | 0.320 | 0.052 | 0.053 | 0.168 | 0.072 | 0.073 | 0.392 | 0.054 | 0.054 | 8 |
| 2173 | rise orbit | 3.469e+0 | 0.273 | 0.047 | 0.046 | 0.100 | 0.068 | 0.067 | 0.349 | 0.042 | 0.040 | 8 |
| 2174 last | rise orbit | 3.522e+0 | 0.241 | 0.032 | 0.030 | 0.046 | 0.053 | 0.052 | 0.329 | 0.020 | 0.018 | 8 |
| 2175 | travel orbit | 3.572e+0 | 0.225 | 0.015 | 0.013 | 0.009 | 0.037 | 0.036 | 0.325 | 0.004 | 0.019 | 8 |
| 2176 | travel orbit | 3.622e+0 | 0.220 | 0.005 | 0.005 | 0.002 | 0.008 | 0.003 | 0.295 | 0.031 | 0.036 | 8 |
| 2177 | travel orbit | 3.671e+0 | 0.214 | 0.007 | 0.009 | 0.002 | 0.000 | 0.000 | 0.281 | 0.013 | 0.011 | 8 |
| 2178 | travel orbit | 3.718e+0 | 0.203 | 0.011 | 0.014 | 0.002 | 0.000 | 0.000 | 0.289 | 0.008 | 0.075 | 8 |
| 2179 | travel orbit | 3.762e+0 | 0.187 | 0.016 | 0.018 | 0.002 | 0.000 | 0.000 | 0.476 | 0.187 * | 0.444 * | 8 |
| 2180 | travel orbit | 3.802e+0 | 0.168 | 0.019 | 0.020 | 0.002 | 0.000 | 0.000 | 1.099 | 0.623 * | 0.987 * | 8 |
| 2181 | travel orbit | 3.838e+0 | 0.148 | 0.020 | 0.020 | 0.002 | 0.000 | 0.000 | 2.326 | 1.227 * | 1.727 * | 8 |
| 2182 | travel orbit | 3.869e+0 | 0.131 | 0.017 | 0.017 | 0.002 | 0.000 | 0.000 | 4.347 | 2.020 * | 2.631 * | 8 |
| 2183 | travel orbit | 3.899e+0 | 0.120 | 0.011 | 0.010 | 0.002 | 0.000 | 0.000 | 7.293 | 2.946 * | 3.611 * | 8 |
| 2184 | travel orbit | 3.929e+0 | 0.121 | 0.001 | 0.011 | 0.002 | 0.000 | 0.000 | 11.197 | 3.904 * | 4.549 * | 8 |
| 2185 | travel orbit | 3.963e+0 | 0.140 | 0.019 | 0.034 | 0.002 | 0.000 | 0.000 | 15.975 | 4.778 * | 5.334 * | 8 |
| 2186 | travel orbit | 4.009e+0 | 0.184 | 0.044 | 0.063 | 0.002 | 0.000 | 0.000 | 21.446 | 5.471 * | 5.901 * | 8 |

## pictures

Tier draft, rate 2, 10.31 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

The dive is joined from 2 parts: /home/user/workspace/work/p6/sm55/01/earth-dive-p1of2 (capture frames 3636 to 3749, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm55/02/earth-dive-p2of2 (capture frames 3750 to 3863, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

The rise is joined from 2 parts: /home/user/workspace/work/p6/sm55/03/earth-rise-p1of2 (capture frames 4176 to 4274, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm55/04/earth-rise-p2of2 (capture frames 4275 to 4373, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

### dive (earth.dive, frames 1830 to 1919, window 1818 to 1931, 228 draft frames at rate 2)

Largest level step: 0.19 at frame 1878 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.04 from frame 1889 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 4.67 from frame 1847 to the next, block column 15 row 1 from the top left, shown, not judged.
Largest change in place: 47.9 from frame 1896 to 8 film frames later, most at pixel 800, 216 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.39 from frame 1899 + 1/2 to 8 film frames later, most at pixel 1207, 938, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 1920 to 1931 + 1/2): change 1.6, pattern 0.02.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 1860 + 1/2 in /home/user/workspace/work/p6/sm55/01/earth-dive-p1of2-pops.png, frame 1862 + 1/2 in /home/user/workspace/work/p6/sm55/01/earth-dive-p1of2-pops.png, frame 1863 in /home/user/workspace/work/p6/sm55/01/earth-dive-p1of2-pops.png, frame 1889 + 1/2 in /home/user/workspace/work/p6/sm55/02/earth-dive-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 1858 in no panel (a slice --frames 3716-3716 draws it), frame 1879 in /home/user/workspace/work/p6/sm55/02/earth-dive-p2of2-changes.png, frame 1891 + 1/2 in /home/user/workspace/work/p6/sm55/02/earth-dive-p2of2-changes.png, frame 1899 + 1/2 in /home/user/workspace/work/p6/sm55/02/earth-dive-p2of2-changes.png.

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
| 1837 + 1/2 | 46.58 | 0.01 | 2.9 | 2.10 | 2.09 | 1.01 | 1.00 | 1.00 | 0.009 | 1.59 | 10,6 | 8.9 | 12.5 | 0.32 | 0.13 | 0.31 | 8.9 |
| 1838 | 46.92 | 0.01 | 3.3 | 2.10 | 2.09 | 1.00 | 1.00 | 1.00 | 0.010 | 1.54 | 5,3 | 8.9 | 12.5 | 0.32 | 0.14 | 0.32 | 8.9 |
| 1838 + 1/2 | 47.28 | 0.02 | 3.4 | 2.09 | 2.10 | 1.00 | 0.99 | 0.99 | 0.010 | 1.53 | 10,6 | 9.0 | 12.5 | 0.32 | 0.14 | 0.32 | 8.9 |
| 1839 | 47.67 | 0.02 | 3.6 | 2.09 | 2.11 | 0.99 | 0.99 | 0.99 | 0.008 | 1.39 | 6,4 | 9.1 | 12.4 | 0.33 | 0.15 | 0.32 | 9.0 |
| 1839 + 1/2 | 48.10 | 0.01 | 3.9 | 2.13 | 2.12 | 1.00 | 1.01 | 1.00 | 0.009 | 1.44 | 14,1 | 9.1 | 12.3 | 0.33 | 0.15 | 0.33 | 9.1 |
| 1840 | 48.55 | 0.02 | 4.1 | 2.13 | 2.15 | 0.99 | 0.99 | 0.99 | 0.010 | 1.55 | 14,1 | 9.2 | 12.5 | 0.33 | 0.16 | 0.36 | 8.0 |
| 1840 + 1/2 | 49.04 | 0.02 | 4.3 | 2.17 | 2.16 | 1.01 | 1.01 | 1.01 | 0.010 | 1.58 | 14,1 | 9.5 | 12.9 | 0.33 | 0.18 | 0.38 | 8.0 |
| 1841 | 49.56 | 0.01 | 4.6 | 2.18 | 2.19 | 1.00 | 1.00 | 1.00 | 0.006 | 1.57 | 14,1 | 9.9 | 13.4 | 0.34 | 0.19 | 0.40 | 8.0 |
| 1841 + 1/2 | 50.11 | 0.01 | 4.8 | 2.21 | 2.20 | 1.00 | 1.00 | 1.00 | 0.006 | 1.56 | 10,7 | 10.4 | 14.1 | 0.34 | 0.19 | 0.42 | 8.0 |
| 1842 | 50.69 | 0.01 | 4.9 | 2.22 | 2.23 | 1.00 | 1.00 | 1.00 | 0.007 | 1.78 | 10,7 | 10.9 | 16.5 | 0.34 | 0.19 | 0.44 | 8.0 |
| 1842 + 1/2 | 51.29 | 0.01 | 5.2 | 2.25 | 2.25 | 1.00 | 1.00 | 1.00 | 0.008 | 1.73 | 10,7 | 11.5 | 16.6 | 0.35 | 0.16 | 0.46 | 8.0 |
| 1843 | 51.92 | 0.01 | 5.4 | 2.28 | 2.26 | 1.01 | 1.01 | 1.01 | 0.006 | 1.79 | 10,7 | 12.6 | 17.8 | 0.35 | 0.19 | 0.47 | 8.0 |
| 1843 + 1/2 | 52.58 | 0.01 | 5.7 | 2.27 | 2.27 | 1.00 | 1.00 | 1.00 | 0.004 | 1.75 | 15,1 | 13.7 | 18.6 | 0.35 | 0.22 | 0.49 | 8.0 |
| 1844 | 53.27 | 0.01 | 5.9 | 2.27 | 2.28 | 1.00 | 1.00 | 1.00 | 0.008 | 2.08 | 15,1 | 15.2 | 19.1 | 0.36 | 0.25 | 0.51 | 8.0 |
| 1844 + 1/2 | 53.97 | 0.01 | 6.2 | 2.28 | 2.29 | 0.99 | 0.99 | 0.99 | 0.005 | 2.39 | 15,1 | 16.4 | 21.0 | 0.36 | 0.27 | 0.52 | 8.0 |
| 1845 | 54.71 | 0.01 | 6.4 | 2.31 | 2.30 | 1.00 | 1.01 | 1.00 | 0.000 | 2.88 | 15,1 | 17.3 | 23.7 | 0.36 | 0.29 | 0.54 | 8.0 |
| 1845 + 1/2 | 55.47 | 0.00 | 6.6 | 2.32 | 2.33 | 1.00 | 1.00 | 1.00 | 0.006 | 4.13 | 15,1 | 18.1 | 24.5 | 0.37 | 0.29 | 0.56 | 8.0 |
| 1846 | 56.24 | 0.00 | 6.9 | 2.37 | 2.34 | 1.01 | 1.02 | 1.01 | 0.006 | 4.18 | 15,1 | 18.9 | 25.0 | 0.37 | 0.28 | 0.57 | 8.0 |
| 1846 + 1/2 | 57.02 | 0.01 | 7.1 | 2.35 | 2.38 | 0.99 | 0.99 | 0.99 | 0.012 | 3.55 | 15,1 | 19.6 | 24.8 | 0.38 | 0.25 | 0.59 | 8.0 |
| 1847 | 57.82 | 0.01 | 7.4 | 2.38 | 2.38 | 1.00 | 1.00 | 1.00 | 0.011 | 4.67 | 15,1 | 20.1 | 25.6 | 0.38 | 0.29 | 0.60 | 8.0 |
| 1847 + 1/2 | 58.64 | 0.01 | 7.6 | 2.39 | 2.39 | 1.00 | 1.00 | 1.00 | 0.014 | 3.50 | 15,1 | 20.9 | 26.2 | 0.38 | 0.26 | 0.62 | 8.0 |
| 1848 | 59.47 | 0.00 | 8.0 | 2.39 | 2.40 | 1.00 | 1.00 | 1.00 | 0.013 | 3.21 | 15,1 | 21.4 | 27.6 | 0.39 | 0.28 | 0.64 | 8.0 |
| 1848 + 1/2 | 60.31 | 0.00 | 8.2 | 2.42 | 2.43 | 1.00 | 0.99 | 0.99 | 0.028 | 2.96 | 15,1 | 21.7 | 29.9 | 0.39 | 0.27 | 0.66 | 8.0 |
| 1849 | 61.14 | 0.00 | 8.5 | 2.46 | 2.47 | 1.00 | 0.99 | 0.99 | 0.032 | 1.93 | 11,7 | 22.0 | 31.9 | 0.40 | 0.26 | 0.67 | 8.0 |
| 1849 + 1/2 | 61.97 | 0.00 | 8.8 | 2.51 | 2.53 | 0.99 | 0.99 | 0.99 | 0.024 | 2.20 | 10,8 | 22.4 | 33.4 | 0.40 | 0.24 | 0.69 | 8.0 |
| 1850 | 62.80 | 0.01 | 9.1 | 2.61 | 2.58 | 1.01 | 1.01 | 1.01 | 0.037 | 2.43 | 11,8 | 23.2 | 33.9 | 0.40 | 0.23 | 0.70 | 8.0 |
| 1850 + 1/2 | 63.62 | 0.02 | 9.4 | 2.65 | 2.67 | 1.00 | 1.00 | 1.00 | 0.049 | 2.48 | 11,8 | 24.1 | 34.7 | 0.40 | 0.23 | 0.40 | 8.4 |
| 1851 | 64.39 | 0.01 | 9.9 | 2.72 | 2.70 | 1.01 | 1.02 | 1.01 | 0.046 | 2.51 | 11,8 | 24.9 | 35.1 | 0.40 | 0.24 | 0.40 | 8.6 |
| 1851 + 1/2 | 65.16 | 0.01 | 10.4 | 2.75 | 2.74 | 1.01 | 1.01 | 1.01 | 0.046 | 2.26 | 11,8 | 25.8 | 35.3 | 0.40 | 0.25 | 0.40 | 8.5 |
| 1852 | 65.91 | 0.00 | 10.5 | 2.76 | 2.75 | 1.00 | 1.01 | 1.00 | 0.056 | 1.98 | 12,7 | 26.9 | 36.8 | 0.40 | 0.25 | 0.40 | 8.4 |
| 1852 + 1/2 | 66.66 | 0.03 | 11.0 | 2.75 | 2.75 | 1.00 | 1.00 | 1.00 | 0.053 | 2.24 | 14,7 | 29.0 | 39.0 | 0.40 | 0.25 | 0.40 | 8.0 |
| 1853 | 67.46 | 0.02 | 11.4 | 2.75 | 2.77 | 0.99 | 0.98 | 0.98 | 0.078 | 2.09 | 14,8 | 30.3 | 40.1 | 0.40 | 0.28 | 0.40 | 8.0 |
| 1853 + 1/2 | 68.30 | 0.04 | 11.7 | 2.79 | 2.79 | 1.00 | 0.99 | 0.99 | 0.067 | 2.46 | 14,8 | 32.6 | 40.9 | 0.40 | 0.28 | 0.40 | 8.0 |
| 1854 | 69.24 | 0.03 | 12.2 | 2.83 | 2.83 | 1.00 | 1.00 | 1.00 | 0.061 | 2.42 | 15,5 | 33.9 | 41.8 | 0.40 | 0.28 | 0.40 | 8.0 |
| 1854 + 1/2 | 70.22 | 0.02 | 12.7 | 2.89 | 2.85 | 1.01 | 1.03 | 1.01 | 0.049 | 2.51 | 14,8 | 34.6 | 43.6 | 0.40 | 0.27 | 0.40 | 8.0 |
| 1855 | 71.25 | 0.02 | 13.1 | 2.88 | 2.88 | 1.00 | 1.01 | 1.00 | 0.044 | 2.73 | 15,8 | 36.9 | 46.4 | 0.40 | 0.24 | 0.40 | 8.0 |
| 1855 + 1/2 | 72.31 | 0.01 | 13.4 | 2.87 | 2.89 | 0.99 | 0.99 | 0.99 | 0.040 | 2.94 | 15,8 | 38.6 | 49.4 | 0.40 | 0.22 | 0.40 | 8.0 |
| 1856 | 73.36 | 0.01 | 13.9 | 2.90 | 2.91 | 1.00 | 0.98 | 0.98 | 0.074 | 2.00 | 1,2 | 39.0 | 48.1 | 0.40 | 0.22 | 0.40 | 8.0 |
| 1856 + 1/2 | 74.39 | 0.01 | 14.3 | 2.93 | 2.94 | 1.00 | 0.99 | 0.99 | 0.051 | 2.50 | 15,3 | 38.7 | 47.0 | 0.40 | 0.21 | 0.40 | 9.0 |
| 1857 | 75.40 | 0.02 | 14.6 | 2.98 | 3.00 | 1.00 | 0.99 | 0.99 | 0.048 | 2.92 | 15,3 | 39.6 | 48.1 | 0.40 | 0.20 | 0.40 | 8.0 |
| 1857 + 1/2 | 76.38 | 0.01 | 15.1 | 3.06 | 3.04 | 1.01 | 1.02 | 1.01 | 0.040 | 2.86 | 15,3 | 39.4 | 50.6 | 0.40 | 0.21 | 0.40 | 8.0 |
| 1858 | 77.38 | 0.01 | 15.3 | 3.11 | 3.09 | 1.01 | 0.99 | 0.99 | 0.051 | 2.54 | 1,2 | 40.5 | 52.0 | 0.40 | 0.21 | 0.40 | 8.0 |
| 1858 + 1/2 | 78.41 | 0.03 | 15.6 | 3.12 | 3.13 | 1.00 | 1.00 | 1.00 | 0.035 | 2.92 | 12,3 | 38.9 | 52.5 | 0.40 | 0.20 | 0.40 | 8.0 |
| 1859 | 79.51 | 0.04 | 15.8 | 3.16 | 3.13 | 1.01 | 1.00 | 1.00 | 0.032 | 2.79 | 12,3 | 37.0 | 51.5 | 0.40 | 0.20 | 0.40 | 8.0 |
| 1859 + 1/2 | 80.69 | 0.05 | 16.1 | 3.17 | 3.13 | 1.01 | 1.01 | 1.01 | 0.035 | 2.67 | 12,3 | 35.5 | 49.0 | 0.40 | 0.20 | 0.40 | 8.0 |
| 1860 | 81.97 | 0.03 | 16.4 | 3.22 | 3.13 | 1.03 | 1.03 | 1.03 | 0.036 | 2.33 | 9,8 | 35.5 | 48.3 | 0.40 | 0.21 | 0.40 | 8.0 |
| 1860 + 1/2 | 83.31 | 0.03 | 16.7 | 3.27 | 3.13 | 1.04 | 1.04 | 1.04 | 0.037 | 2.32 | 9,8 | 36.1 | 48.3 | 0.41 | 0.21 | 0.40 | 8.0 |
| 1861 | 84.59 | 0.04 | 16.8 | 3.26 | 3.13 | 1.04 | 1.03 | 1.03 | 0.052 | 2.99 | 13,3 | 34.2 | 48.5 | 0.40 | 0.20 | 0.89 | 8.0 |
| 1861 + 1/2 | 85.80 | 0.03 | 17.2 | 3.29 | 3.13 | 1.05 | 1.04 | 1.04 | 0.043 | 3.10 | 13,3 | 31.9 | 48.4 | 0.40 | 0.22 | 0.90 | 8.0 |
| 1862 | 86.93 | 0.07 | 17.3 | 3.31 | 3.13 | 1.05 | 1.04 | 1.04 | 0.046 | 3.15 | 13,3 | 25.8 | 42.4 | 0.40 | 0.23 | 0.90 | 8.0 |
| 1862 + 1/2 | 87.92 | 0.10 | 17.6 | 3.35 | 3.13 | 1.07 | 1.04 | 1.04 | 0.056 | 2.83 | 13,3 | 23.5 | 46.5 | 0.41 | 0.24 | 0.90 | 8.0 |
| 1863 | 88.72 | 0.19 | 17.5 | 3.31 | 3.13 | 1.05 | 1.04 | 1.04 | 0.045 | 3.02 | 15,5 | 21.8 | 25.6 | 0.41 | 0.24 | 0.90 | 8.0 |
| 1863 + 1/2 | 89.14 | 0.18 | 17.4 | 3.26 | 3.13 | 1.04 | 1.03 | 1.03 | 0.048 | 2.95 | 14,3 | 22.4 | 27.7 | 0.41 | 0.23 | 0.90 | 8.0 |
| 1864 | 89.20 | 0.01 | 17.3 | 3.28 | 3.13 | 1.05 | 1.03 | 1.03 | 0.039 | 3.20 | 14,3 | 22.8 | 30.0 | 0.41 | 0.22 | 0.90 | 8.0 |
| 1864 + 1/2 | 89.24 | 0.10 | 17.3 | 3.23 | 3.13 | 1.03 | 1.03 | 1.03 | 0.038 | 3.07 | 14,3 | 23.0 | 32.2 | 0.41 | 0.22 | 0.41 | 13.2 |
| 1865 | 89.49 | 0.03 | 17.2 | 3.22 | 3.13 | 1.03 | 1.03 | 1.03 | 0.038 | 2.58 | 14,4 | 23.1 | 34.5 | 0.42 | 0.22 | 0.41 | 13.1 |
| 1865 + 1/2 | 89.80 | 0.03 | 17.2 | 3.24 | 3.13 | 1.03 | 1.05 | 1.03 | 0.026 | 2.82 | 14,4 | 23.6 | 36.8 | 0.42 | 0.21 | 0.41 | 8.0 |
| 1866 | 90.17 | 0.02 | 17.2 | 3.21 | 3.13 | 1.03 | 1.04 | 1.03 | 0.029 | 3.07 | 15,5 | 24.1 | 39.2 | 0.42 | 0.21 | 0.42 | 8.0 |
| 1866 + 1/2 | 90.59 | 0.13 | 17.2 | 3.19 | 3.13 | 1.02 | 1.02 | 1.02 | 0.035 | 3.18 | 15,5 | 24.6 | 41.1 | 0.42 | 0.19 | 0.42 | 8.0 |
| 1867 | 90.75 | 0.07 | 17.2 | 3.15 | 3.13 | 1.01 | 1.02 | 1.01 | 0.033 | 4.35 | 15,4 | 25.3 | 43.1 | 0.43 | 0.18 | 0.42 | 12.9 |
| 1867 + 1/2 | 90.77 | 0.06 | 17.1 | 3.10 | 3.11 | 1.00 | 1.00 | 1.00 | 0.028 | 3.20 | 15,4 | 26.2 | 45.4 | 0.43 | 0.16 | 0.42 | 12.8 |
| 1868 | 90.67 | 0.08 | 17.2 | 3.07 | 3.06 | 1.00 | 1.01 | 1.00 | 0.018 | 2.62 | 15,4 | 26.4 | 47.3 | 0.43 | 0.15 | 0.43 | 12.8 |
| 1868 + 1/2 | 90.40 | 0.03 | 17.0 | 3.01 | 3.02 | 1.00 | 0.98 | 0.98 | 0.040 | 2.68 | 13,7 | 26.9 | 48.6 | 0.43 | 0.14 | 0.43 | 12.7 |
| 1869 | 90.07 | 0.07 | 17.0 | 2.98 | 2.98 | 1.00 | 1.00 | 1.00 | 0.024 | 2.78 | 13,7 | 27.3 | 49.8 | 0.44 | 0.14 | 0.44 | 8.0 |
| 1869 + 1/2 | 89.88 | 0.01 | 17.0 | 2.94 | 2.95 | 1.00 | 0.99 | 0.99 | 0.033 | 2.33 | 12,8 | 27.7 | 50.7 | 0.44 | 0.14 | 0.44 | 8.0 |
| 1870 | 89.71 | 0.07 | 17.0 | 2.92 | 2.93 | 1.00 | 1.01 | 1.00 | 0.028 | 2.33 | 10,7 | 28.2 | 51.2 | 0.45 | 0.13 | 0.44 | 8.0 |
| 1870 + 1/2 | 89.68 | 0.09 | 16.8 | 2.91 | 2.92 | 1.00 | 0.99 | 0.99 | 0.036 | 2.81 | 13,8 | 29.0 | 51.4 | 0.45 | 0.13 | 0.45 | 8.0 |
| 1871 | 89.83 | 0.02 | 16.8 | 2.92 | 2.89 | 1.01 | 1.01 | 1.01 | 0.035 | 3.59 | 14,8 | 30.0 | 51.4 | 0.45 | 0.13 | 0.45 | 8.0 |
| 1871 + 1/2 | 90.02 | 0.04 | 16.7 | 2.87 | 2.88 | 1.00 | 1.00 | 1.00 | 0.036 | 2.85 | 14,8 | 31.0 | 51.4 | 0.46 | 0.14 | 0.45 | 8.0 |
| 1872 | 90.14 | 0.01 | 16.6 | 2.86 | 2.84 | 1.00 | 0.99 | 0.99 | 0.041 | 2.61 | 14,8 | 31.7 | 51.0 | 0.46 | 0.16 | 0.46 | 8.0 |
| 1872 + 1/2 | 90.24 | 0.15 | 16.5 | 2.81 | 2.82 | 1.00 | 1.02 | 1.00 | 0.015 | 2.06 | 14,6 | 32.6 | 50.7 | 0.46 | 0.17 | 0.46 | 8.0 |
| 1873 | 90.04 | 0.14 | 16.5 | 2.79 | 2.80 | 1.00 | 0.99 | 0.99 | 0.035 | 2.46 | 13,4 | 33.6 | 49.9 | 0.47 | 0.17 | 0.46 | 8.0 |
| 1873 + 1/2 | 89.55 | 0.01 | 16.5 | 2.78 | 2.78 | 1.00 | 1.00 | 1.00 | 0.031 | 2.30 | 13,4 | 34.4 | 48.8 | 0.47 | 0.18 | 0.47 | 8.0 |
| 1874 | 89.05 | 0.05 | 16.3 | 2.76 | 2.78 | 1.00 | 1.00 | 1.00 | 0.023 | 2.58 | 13,4 | 35.1 | 47.9 | 0.47 | 0.20 | 0.47 | 8.0 |
| 1874 + 1/2 | 88.45 | 0.14 | 16.3 | 2.77 | 2.76 | 1.00 | 1.01 | 1.00 | 0.023 | 2.32 | 11,8 | 34.6 | 46.9 | 0.48 | 0.20 | 0.47 | 8.0 |
| 1875 | 88.14 | 0.02 | 16.3 | 2.76 | 2.75 | 1.01 | 1.00 | 1.00 | 0.030 | 2.21 | 14,7 | 34.0 | 45.8 | 0.48 | 0.17 | 0.47 | 8.0 |
| 1875 + 1/2 | 87.79 | 0.14 | 16.2 | 2.74 | 2.72 | 1.00 | 1.00 | 1.00 | 0.025 | 2.33 | 4,5 | 34.3 | 44.5 | 0.48 | 0.18 | 0.47 | 8.0 |
| 1876 | 87.71 | 0.12 | 16.1 | 2.69 | 2.70 | 1.00 | 1.00 | 1.00 | 0.023 | 2.34 | 4,5 | 33.2 | 43.2 | 0.48 | 0.20 | 0.48 | 8.0 |
| 1876 + 1/2 | 87.40 | 0.07 | 16.0 | 2.65 | 2.66 | 1.00 | 0.99 | 0.99 | 0.025 | 2.43 | 4,5 | 32.4 | 41.7 | 0.48 | 0.23 | 0.48 | 8.0 |
| 1877 | 86.95 | 0.05 | 16.0 | 2.64 | 2.65 | 1.00 | 1.00 | 1.00 | 0.022 | 2.39 | 4,5 | 31.9 | 40.2 | 0.49 | 0.25 | 0.48 | 8.0 |
| 1877 + 1/2 | 86.60 | 0.07 | 16.0 | 2.55 | 2.65 | 0.96 | 0.97 | 0.96 | 0.009 | 2.78 | 15,5 | 31.8 | 38.8 | 0.49 | 0.27 | 0.49 | 8.0 |
| 1878 | 86.39 | 0.19 | 15.8 | 2.57 | 2.65 | 0.97 | 0.98 | 0.97 | 0.017 | 2.73 | 15,5 | 31.7 | 39.2 | 0.49 | 0.28 | 0.49 | 8.0 |
| 1878 + 1/2 | 86.57 | 0.01 | 15.7 | 2.54 | 2.65 | 0.96 | 0.96 | 0.96 | 0.022 | 2.49 | 11,6 | 32.0 | 40.2 | 0.49 | 0.29 | 0.49 | 8.0 |
| 1879 | 86.73 | 0.16 | 15.7 | 2.50 | 2.65 | 0.95 | 0.95 | 0.95 | 0.022 | 2.66 | 11,6 | 31.9 | 40.6 | 0.50 | 0.30 | 0.49 | 8.0 |
| 1879 + 1/2 | 87.20 | 0.01 | 15.8 | 2.53 | 2.65 | 0.96 | 0.96 | 0.96 | 0.015 | 2.68 | 11,6 | 32.0 | 39.2 | 0.50 | 0.30 | 0.50 | 8.0 |
| 1880 | 87.65 | 0.00 | 15.7 | 2.51 | 2.65 | 0.95 | 0.96 | 0.95 | 0.014 | 2.29 | 11,6 | 31.7 | 36.5 | 0.50 | 0.30 | 0.50 | 8.0 |
| 1880 + 1/2 | 88.11 | 0.04 | 15.5 | 2.50 | 2.65 | 0.95 | 0.96 | 0.95 | 0.009 | 2.25 | 3,5 | 31.9 | 36.7 | 0.51 | 0.29 | 0.50 | 8.0 |
| 1881 | 88.50 | 0.14 | 15.5 | 2.50 | 2.64 | 0.95 | 0.96 | 0.95 | 0.005 | 2.33 | 3,5 | 32.7 | 38.3 | 0.51 | 0.28 | 0.50 | 8.0 |
| 1881 + 1/2 | 88.59 | 0.02 | 15.5 | 2.50 | 2.64 | 0.95 | 0.96 | 0.95 | 0.009 | 2.31 | 3,5 | 33.0 | 40.5 | 0.51 | 0.27 | 0.51 | 8.0 |
| 1882 | 88.73 | 0.01 | 15.5 | 2.49 | 2.64 | 0.94 | 0.95 | 0.94 | 0.008 | 2.33 | 12,6 | 33.6 | 38.3 | 0.51 | 0.27 | 0.51 | 8.0 |
| 1882 + 1/2 | 88.88 | 0.05 | 15.4 | 2.54 | 2.64 | 0.96 | 0.96 | 0.96 | 0.031 | 2.55 | 12,7 | 34.6 | 38.6 | 0.51 | 0.27 | 0.51 | 8.0 |
| 1883 | 89.14 | 0.03 | 15.3 | 2.55 | 2.64 | 0.97 | 0.97 | 0.97 | 0.031 | 2.59 | 12,7 | 35.8 | 39.8 | 0.51 | 0.24 | 0.51 | 8.9 |
| 1883 + 1/2 | 89.46 | 0.08 | 15.3 | 2.60 | 2.63 | 0.99 | 0.99 | 0.99 | 0.023 | 2.57 | 2,5 | 36.8 | 40.8 | 0.51 | 0.20 | 0.51 | 8.9 |
| 1884 | 89.62 | 0.06 | 15.2 | 2.61 | 2.62 | 1.00 | 1.00 | 1.00 | 0.022 | 2.55 | 2,5 | 37.6 | 42.2 | 0.51 | 0.21 | 0.51 | 8.8 |
| 1884 + 1/2 | 89.67 | 0.01 | 15.2 | 2.62 | 2.60 | 1.01 | 1.00 | 1.00 | 0.026 | 2.48 | 2,5 | 38.1 | 43.4 | 0.51 | 0.23 | 0.51 | 8.6 |
| 1885 | 89.70 | 0.01 | 15.1 | 2.65 | 2.59 | 1.03 | 1.01 | 1.01 | 0.034 | 3.56 | 13,7 | 39.0 | 44.7 | 0.51 | 0.22 | 0.51 | 8.5 |
| 1885 + 1/2 | 89.75 | 0.11 | 15.1 | 2.70 | 2.57 | 1.05 | 1.03 | 1.03 | 0.038 | 4.12 | 13,7 | 40.1 | 46.3 | 0.51 | 0.20 | 0.51 | 8.3 |
| 1886 | 90.03 | 0.08 | 15.1 | 2.65 | 2.57 | 1.03 | 1.03 | 1.03 | 0.030 | 3.62 | 13,7 | 41.2 | 48.0 | 0.52 | 0.20 | 0.51 | 8.2 |
| 1886 + 1/2 | 90.16 | 0.11 | 15.0 | 2.67 | 2.57 | 1.04 | 1.03 | 1.03 | 0.039 | 2.73 | 13,8 | 42.2 | 48.2 | 0.52 | 0.21 | 0.52 | 8.0 |
| 1887 | 90.07 | 0.07 | 15.1 | 2.64 | 2.57 | 1.03 | 1.04 | 1.03 | 0.016 | 2.39 | 1,5 | 43.1 | 49.4 | 0.52 | 0.21 | 0.51 | 8.0 |
| 1887 + 1/2 | 89.83 | 0.04 | 14.9 | 2.67 | 2.57 | 1.04 | 1.04 | 1.04 | 0.037 | 3.09 | 14,8 | 43.8 | 50.3 | 0.52 | 0.21 | 0.52 | 8.0 |
| 1888 | 89.51 | 0.06 | 15.1 | 2.65 | 2.57 | 1.03 | 1.05 | 1.03 | 0.006 | 3.33 | 14,8 | 44.5 | 51.2 | 0.53 | 0.21 | 0.52 | 8.0 |
| 1888 + 1/2 | 89.30 | 0.01 | 14.9 | 2.66 | 2.57 | 1.03 | 1.05 | 1.03 | 0.019 | 2.98 | 15,8 | 45.0 | 52.4 | 0.53 | 0.21 | 0.53 | 8.2 |
| 1889 | 89.12 | 0.04 | 15.0 | 2.64 | 2.57 | 1.03 | 1.04 | 1.03 | 0.016 | 4.20 | 15,8 | 45.6 | 53.0 | 0.53 | 0.22 | 0.53 | 8.2 |
| 1889 + 1/2 | 88.86 | 0.06 | 14.8 | 2.68 | 2.57 | 1.04 | 1.05 | 1.04 | 0.027 | 4.53 | 15,8 | 45.9 | 53.8 | 0.53 | 0.22 | 0.53 | 8.1 |
| 1890 | 88.48 | 0.06 | 14.7 | 2.63 | 2.57 | 1.03 | 1.03 | 1.03 | 0.022 | 4.18 | 15,8 | 46.2 | 54.2 | 0.54 | 0.22 | 0.53 | 8.1 |
| 1890 + 1/2 | 88.23 | 0.00 | 14.7 | 2.65 | 2.57 | 1.03 | 1.04 | 1.03 | 0.016 | 3.57 | 15,8 | 46.3 | 54.5 | 0.54 | 0.24 | 0.54 | 8.0 |
| 1891 | 87.97 | 0.04 | 14.4 | 2.62 | 2.57 | 1.02 | 1.02 | 1.02 | 0.016 | 2.33 | 15,8 | 46.7 | 54.7 | 0.54 | 0.26 | 0.54 | 8.0 |
| 1891 + 1/2 | 87.63 | 0.11 | 14.1 | 2.58 | 2.58 | 1.00 | 0.99 | 0.99 | 0.030 | 2.37 | 12,0 | 46.9 | 54.7 | 0.55 | 0.28 | 0.54 | 8.0 |
| 1892 | 87.51 | 0.04 | 13.8 | 2.56 | 2.55 | 1.00 | 1.00 | 1.00 | 0.022 | 2.38 | 11,8 | 47.0 | 54.7 | 0.55 | 0.29 | 0.55 | 8.0 |
| 1892 + 1/2 | 87.31 | 0.11 | 13.4 | 2.52 | 2.52 | 1.00 | 1.00 | 1.00 | 0.021 | 2.65 | 11,8 | 47.3 | 54.7 | 0.55 | 0.29 | 0.55 | 8.0 |
| 1893 | 86.90 | 0.04 | 13.1 | 2.48 | 2.49 | 1.00 | 1.00 | 1.00 | 0.018 | 2.38 | 11,8 | 47.4 | 54.5 | 0.56 | 0.29 | 0.55 | 8.0 |
| 1893 + 1/2 | 86.42 | 0.09 | 12.8 | 2.46 | 2.45 | 1.00 | 1.00 | 1.00 | 0.019 | 2.30 | 15,7 | 47.6 | 54.3 | 0.56 | 0.29 | 0.56 | 8.0 |
| 1894 | 85.75 | 0.02 | 12.4 | 2.42 | 2.41 | 1.00 | 1.00 | 1.00 | 0.024 | 2.65 | 15,7 | 47.7 | 54.1 | 0.56 | 0.28 | 0.56 | 8.0 |
| 1894 + 1/2 | 85.12 | 0.04 | 12.3 | 2.36 | 2.37 | 1.00 | 0.99 | 0.99 | 0.027 | 1.99 | 15,7 | 47.8 | 53.9 | 0.56 | 0.29 | 0.56 | 8.0 |
| 1895 | 84.56 | 0.02 | 11.9 | 2.32 | 2.34 | 0.99 | 0.99 | 0.99 | 0.025 | 1.79 | 13,8 | 47.8 | 53.5 | 0.57 | 0.30 | 0.56 | 8.0 |
| 1895 + 1/2 | 84.05 | 0.01 | 11.8 | 2.31 | 2.29 | 1.01 | 1.01 | 1.01 | 0.024 | 2.18 | 13,0 | 47.8 | 53.0 | 0.57 | 0.30 | 0.57 | 8.0 |
| 1896 | 83.53 | 0.02 | 11.5 | 2.25 | 2.27 | 0.99 | 0.99 | 0.99 | 0.026 | 1.64 | 12,7 | 47.9 | 53.2 | 0.58 | 0.31 | 0.57 | 8.0 |
| 1896 + 1/2 | 83.04 | 0.04 | 11.2 | 2.23 | 2.23 | 1.00 | 1.00 | 1.00 | 0.015 | 1.65 | 12,7 | 47.8 | 53.2 | 0.58 | 0.30 | 0.57 | 8.0 |
| 1897 | 82.62 | 0.03 | 10.9 | 2.20 | 2.20 | 1.00 | 1.00 | 1.00 | 0.028 | 2.00 | 13,0 | 47.6 | 53.1 | 0.58 | 0.28 | 0.58 | 8.0 |
| 1897 + 1/2 | 82.28 | 0.02 | 10.5 | 2.17 | 2.18 | 1.00 | 1.00 | 1.00 | 0.014 | 1.55 | 12,7 | 47.1 | 52.5 | 0.58 | 0.28 | 0.58 | 8.0 |
| 1898 | 81.96 | 0.04 | 10.4 | 2.15 | 2.14 | 1.00 | 1.00 | 1.00 | 0.014 | 1.50 | 12,7 | 46.4 | 51.8 | 0.59 | 0.28 | 0.58 | 8.0 |
| 1898 + 1/2 | 81.72 | 0.05 | 10.0 | 2.11 | 2.13 | 0.99 | 0.99 | 0.99 | 0.031 | 1.36 | 10,6 | 45.4 | 50.8 | 0.59 | 0.34 | 0.41 | 8.0 |
| 1899 | 81.57 | 0.08 | 9.7 | 2.11 | 2.10 | 1.01 | 1.01 | 1.01 | 0.003 | 1.83 | 15,8 | 44.0 | 49.6 | 0.59 | 0.34 | 0.40 | 8.0 |
| 1899 + 1/2 | 81.58 | 0.01 | 9.3 | 2.07 | 2.10 | 0.99 | 0.99 | 0.99 | 0.027 | 1.62 | 13,8 | 42.3 | 48.0 | 0.60 | 0.39 | 0.38 | 8.0 |
| 1900 | 81.62 | 0.03 | 9.2 | 2.09 | 2.07 | 1.01 | 1.01 | 1.01 | 0.020 | 1.59 | 13,7 | 40.4 | 46.0 | 0.60 | 0.37 | 0.37 | 8.0 |
| 1900 + 1/2 | 81.60 | 0.01 | 8.9 | 2.06 | 2.07 | 1.00 | 1.00 | 1.00 | 0.021 | 1.80 | 13,8 | 38.8 | 43.7 | 0.60 | 0.38 | 0.36 | 8.0 |
| 1901 | 81.56 | 0.01 | 8.8 | 2.07 | 2.06 | 1.00 | 1.01 | 1.00 | 0.008 | 1.66 | 13,8 | 36.3 | 41.1 | 0.60 | 0.30 | 0.35 | 8.0 |
| 1901 + 1/2 | 81.49 | 0.02 | 8.5 | 2.05 | 2.05 | 1.00 | 1.00 | 1.00 | 0.023 | 1.86 | 13,8 | 33.6 | 38.2 | 0.61 | 0.35 | 0.34 | 8.0 |
| 1902 | 81.38 | 0.01 | 8.1 | 2.03 | 2.05 | 0.99 | 0.99 | 0.99 | 0.017 | 2.12 | 13,8 | 30.5 | 35.0 | 0.61 | 0.26 | 0.32 | 8.0 |
| 1902 + 1/2 | 81.26 | 0.03 | 8.0 | 2.03 | 2.04 | 1.00 | 0.99 | 0.99 | 0.017 | 1.94 | 13,8 | 27.5 | 31.8 | 0.62 | 0.22 | 0.61 | 10.6 |
| 1903 | 81.19 | 0.01 | 7.6 | 2.03 | 2.03 | 1.00 | 1.01 | 1.00 | 0.006 | 1.48 | 9,7 | 24.5 | 28.6 | 0.62 | 0.24 | 0.28 | 8.0 |
| 1903 + 1/2 | 81.15 | 0.02 | 7.4 | 2.04 | 2.03 | 1.01 | 1.01 | 1.01 | 0.011 | 1.67 | 14,8 | 21.5 | 25.5 | 0.63 | 0.20 | 0.26 | 8.0 |
| 1904 | 81.06 | 0.03 | 7.2 | 2.03 | 2.01 | 1.01 | 1.01 | 1.01 | 0.018 | 1.81 | 14,8 | 18.4 | 22.1 | 0.63 | 0.27 | 0.22 | 8.0 |
| 1904 + 1/2 | 81.03 | 0.02 | 6.9 | 2.00 | 2.00 | 1.00 | 1.00 | 1.00 | 0.018 | 1.64 | 14,8 | 15.3 | 18.8 | 0.64 | 0.15 | 0.18 | 8.0 |
| 1905 | 81.04 | 0.02 | 6.7 | 1.97 | 1.97 | 1.00 | 1.00 | 1.00 | 0.020 | 1.67 | 14,8 | 12.4 | 15.6 | 0.64 | 0.20 | 0.16 | 8.0 |
| 1905 + 1/2 | 81.09 | 0.00 | 6.3 | 1.94 | 1.94 | 1.00 | 1.00 | 1.00 | 0.006 | 1.62 | 14,8 | 9.9 | 12.8 | 0.65 | 0.17 | 0.13 | 8.0 |
| 1906 | 81.14 | 0.02 | 6.1 | 1.90 | 1.92 | 0.99 | 1.00 | 0.99 | 0.002 | 1.78 | 12,8 | 7.7 | 11.2 | 0.65 | 0.16 | 0.09 | 8.0 |
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

### rise (earth.rise, frames 2100 to 2174, window 2088 to 2186, 198 draft frames at rate 2)

Largest level step: 0.25 at frame 2139 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.12 from frame 2183 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 7.23 from frame 2184 + 1/2 to the next, block column 13 row 0 from the top left, shown, not judged.
Largest change in place: 47.2 from frame 2118 + 1/2 to 8 film frames later, most at pixel 772, 408 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.39 from frame 2142 to 8 film frames later, most at pixel 916, 16, band 8.4 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 2088 to 2099 + 1/2): change 3.1, pattern 0.06.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 2172 + 1/2 in /home/user/workspace/work/p6/sm55/04/earth-rise-p2of2-pops.png, frame 2173 in /home/user/workspace/work/p6/sm55/04/earth-rise-p2of2-pops.png, frame 2182 + 1/2 in /home/user/workspace/work/p6/sm55/04/earth-rise-p2of2-pops.png, frame 2183 + 1/2 in /home/user/workspace/work/p6/sm55/04/earth-rise-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 2110 + 1/2 in no panel (a slice --frames 4221-4221 draws it), frame 2118 + 1/2 in no panel (a slice --frames 4237-4237 draws it), frame 2142 in /home/user/workspace/work/p6/sm55/04/earth-rise-p2of2-changes.png, frame 2157 in /home/user/workspace/work/p6/sm55/04/earth-rise-p2of2-changes.png.

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
| 2105 + 1/2 | 107.70 | 0.01 | 2.6 | 1.71 | 1.70 | 1.01 | 1.00 | 1.00 | 0.017 | 1.64 | 13,8 | 27.5 | 31.1 | 0.74 | 0.23 | 0.74 | 8.8 |
| 2106 | 107.71 | 0.01 | 2.9 | 1.74 | 1.76 | 0.99 | 0.99 | 0.99 | 0.005 | 1.84 | 12,8 | 29.7 | 33.7 | 0.74 | 0.23 | 0.74 | 8.8 |
| 2106 + 1/2 | 107.70 | 0.01 | 3.2 | 1.81 | 1.80 | 1.01 | 1.01 | 1.01 | 0.003 | 1.73 | 12,8 | 31.9 | 35.9 | 0.74 | 0.23 | 0.74 | 9.2 |
| 2107 | 107.68 | 0.01 | 3.4 | 1.86 | 1.86 | 1.00 | 1.00 | 1.00 | 0.003 | 1.85 | 12,8 | 34.0 | 37.9 | 0.74 | 0.23 | 0.74 | 9.2 |
| 2107 + 1/2 | 107.63 | 0.01 | 3.9 | 1.91 | 1.91 | 1.00 | 1.00 | 1.00 | 0.000 | 1.70 | 12,8 | 35.9 | 39.9 | 0.75 | 0.23 | 0.74 | 9.3 |
| 2108 | 107.55 | 0.01 | 4.1 | 1.96 | 1.96 | 1.00 | 1.00 | 1.00 | 0.008 | 1.68 | 11,7 | 37.6 | 42.0 | 0.75 | 0.23 | 0.75 | 9.3 |
| 2108 + 1/2 | 107.45 | 0.02 | 4.4 | 2.00 | 2.01 | 0.99 | 0.99 | 0.99 | 0.002 | 1.67 | 10,7 | 39.3 | 43.3 | 0.75 | 0.23 | 0.75 | 9.4 |
| 2109 | 107.32 | 0.01 | 4.8 | 2.07 | 2.05 | 1.01 | 1.01 | 1.01 | 0.003 | 1.87 | 14,5 | 40.7 | 44.9 | 0.75 | 0.24 | 0.75 | 9.3 |
| 2109 + 1/2 | 107.16 | 0.00 | 5.1 | 2.11 | 2.13 | 0.99 | 0.99 | 0.99 | 0.008 | 1.79 | 10,7 | 41.9 | 46.3 | 0.75 | 0.24 | 0.75 | 9.4 |
| 2110 | 106.99 | 0.01 | 5.4 | 2.19 | 2.14 | 1.02 | 1.02 | 1.02 | 0.010 | 1.72 | 0,2 | 42.9 | 47.4 | 0.76 | 0.23 | 0.76 | 9.3 |
| 2110 + 1/2 | 106.79 | 0.01 | 5.8 | 2.20 | 2.18 | 1.01 | 1.00 | 1.00 | 0.014 | 2.29 | 0,2 | 43.7 | 48.3 | 0.76 | 0.23 | 0.76 | 9.3 |
| 2111 | 106.59 | 0.00 | 6.2 | 2.21 | 2.19 | 1.01 | 1.01 | 1.01 | 0.006 | 2.10 | 0,2 | 44.3 | 49.1 | 0.76 | 0.22 | 0.76 | 9.3 |
| 2111 + 1/2 | 106.39 | 0.02 | 6.5 | 2.20 | 2.19 | 1.01 | 1.00 | 1.00 | 0.017 | 1.86 | 13,4 | 44.7 | 49.7 | 0.76 | 0.21 | 0.76 | 9.2 |
| 2112 | 106.16 | 0.00 | 6.9 | 2.19 | 2.19 | 1.00 | 1.00 | 1.00 | 0.012 | 1.98 | 0,2 | 45.2 | 50.5 | 0.77 | 0.21 | 0.77 | 9.2 |
| 2112 + 1/2 | 105.92 | 0.01 | 7.1 | 2.19 | 2.19 | 1.00 | 1.00 | 1.00 | 0.009 | 1.83 | 0,2 | 45.6 | 51.0 | 0.77 | 0.22 | 0.77 | 9.2 |
| 2113 | 105.66 | 0.01 | 7.6 | 2.19 | 2.19 | 1.00 | 1.00 | 1.00 | 0.005 | 1.81 | 0,2 | 46.0 | 51.6 | 0.77 | 0.22 | 0.77 | 9.2 |
| 2113 + 1/2 | 105.38 | 0.02 | 7.6 | 2.19 | 2.19 | 1.00 | 1.00 | 1.00 | 0.014 | 1.85 | 3,8 | 46.2 | 52.5 | 0.78 | 0.22 | 0.78 | 9.3 |
| 2114 | 105.06 | 0.02 | 8.0 | 2.19 | 2.20 | 1.00 | 1.00 | 1.00 | 0.019 | 1.98 | 3,8 | 46.4 | 52.8 | 0.78 | 0.22 | 0.78 | 9.2 |
| 2114 + 1/2 | 104.71 | 0.01 | 8.2 | 2.18 | 2.20 | 0.99 | 0.99 | 0.99 | 0.021 | 1.86 | 3,8 | 46.4 | 53.2 | 0.78 | 0.21 | 0.78 | 8.8 |
| 2115 | 104.34 | 0.01 | 8.6 | 2.19 | 2.20 | 0.99 | 1.00 | 0.99 | 0.014 | 1.77 | 3,8 | 46.7 | 53.5 | 0.79 | 0.21 | 0.78 | 8.7 |
| 2115 + 1/2 | 103.96 | 0.04 | 8.8 | 2.20 | 2.22 | 0.99 | 1.00 | 0.99 | 0.004 | 1.63 | 3,8 | 46.8 | 53.6 | 0.79 | 0.21 | 0.79 | 8.4 |
| 2116 | 103.51 | 0.03 | 9.0 | 2.22 | 2.23 | 1.00 | 1.00 | 1.00 | 0.019 | 1.71 | 14,1 | 46.9 | 53.8 | 0.79 | 0.21 | 0.79 | 8.8 |
| 2116 + 1/2 | 102.98 | 0.03 | 9.5 | 2.25 | 2.25 | 1.00 | 1.00 | 1.00 | 0.007 | 2.02 | 14,1 | 47.0 | 53.7 | 0.79 | 0.21 | 0.79 | 8.0 |
| 2117 | 102.41 | 0.01 | 9.8 | 2.27 | 2.26 | 1.00 | 1.01 | 1.00 | 0.009 | 2.00 | 14,1 | 47.1 | 53.8 | 0.80 | 0.21 | 0.80 | 9.0 |
| 2117 + 1/2 | 101.81 | 0.03 | 10.1 | 2.28 | 2.28 | 1.00 | 1.00 | 1.00 | 0.016 | 1.82 | 14,1 | 47.2 | 53.7 | 0.80 | 0.21 | 0.80 | 9.1 |
| 2118 | 101.17 | 0.01 | 10.5 | 2.30 | 2.29 | 1.00 | 1.01 | 1.00 | 0.009 | 1.84 | 0,3 | 47.2 | 53.7 | 0.80 | 0.22 | 0.80 | 9.2 |
| 2118 + 1/2 | 100.49 | 0.01 | 10.9 | 2.30 | 2.30 | 1.00 | 1.00 | 1.00 | 0.032 | 2.12 | 13,1 | 47.2 | 53.2 | 0.81 | 0.23 | 0.80 | 9.1 |
| 2119 | 99.80 | 0.01 | 11.3 | 2.31 | 2.32 | 1.00 | 1.00 | 1.00 | 0.026 | 2.01 | 10,8 | 47.0 | 52.6 | 0.81 | 0.24 | 0.80 | 9.2 |
| 2119 + 1/2 | 99.12 | 0.01 | 11.7 | 2.34 | 2.33 | 1.00 | 1.00 | 1.00 | 0.041 | 2.47 | 10,8 | 46.8 | 52.2 | 0.81 | 0.25 | 0.80 | 9.3 |
| 2120 | 98.46 | 0.02 | 12.1 | 2.35 | 2.36 | 1.00 | 1.00 | 1.00 | 0.022 | 2.26 | 10,8 | 46.5 | 51.8 | 0.81 | 0.24 | 0.80 | 9.3 |
| 2120 + 1/2 | 97.84 | 0.03 | 12.3 | 2.38 | 2.36 | 1.01 | 1.00 | 1.00 | 0.042 | 2.02 | 10,8 | 46.1 | 51.5 | 0.81 | 0.23 | 0.80 | 9.4 |
| 2121 | 97.28 | 0.02 | 12.7 | 2.37 | 2.41 | 0.99 | 0.98 | 0.98 | 0.035 | 1.78 | 10,8 | 45.5 | 51.1 | 0.82 | 0.23 | 0.80 | 9.5 |
| 2121 + 1/2 | 96.76 | 0.01 | 13.1 | 2.44 | 2.42 | 1.01 | 1.01 | 1.01 | 0.027 | 2.00 | 2,3 | 45.0 | 50.6 | 0.82 | 0.22 | 0.81 | 9.4 |
| 2122 | 96.26 | 0.01 | 13.5 | 2.46 | 2.48 | 0.99 | 0.99 | 0.99 | 0.032 | 1.97 | 2,3 | 44.4 | 49.9 | 0.82 | 0.20 | 0.81 | 9.4 |
| 2122 + 1/2 | 95.78 | 0.00 | 13.8 | 2.51 | 2.51 | 1.00 | 1.00 | 1.00 | 0.027 | 1.92 | 2,3 | 43.7 | 48.8 | 0.82 | 0.19 | 0.81 | 9.4 |
| 2123 | 95.29 | 0.04 | 14.3 | 2.57 | 2.55 | 1.01 | 1.01 | 1.01 | 0.025 | 1.95 | 0,6 | 42.8 | 47.4 | 0.82 | 0.19 | 0.80 | 9.2 |
| 2123 + 1/2 | 94.87 | 0.04 | 14.6 | 2.59 | 2.60 | 1.00 | 0.99 | 0.99 | 0.040 | 2.17 | 0,6 | 42.0 | 47.1 | 0.83 | 0.19 | 0.81 | 9.0 |
| 2124 | 94.53 | 0.01 | 15.2 | 2.63 | 2.63 | 1.00 | 1.00 | 1.00 | 0.037 | 2.21 | 0,6 | 41.2 | 46.9 | 0.83 | 0.19 | 0.81 | 8.0 |
| 2124 + 1/2 | 94.18 | 0.01 | 15.9 | 2.67 | 2.67 | 1.00 | 1.00 | 1.00 | 0.035 | 2.58 | 0,6 | 40.5 | 47.0 | 0.83 | 0.19 | 0.81 | 8.0 |
| 2125 | 93.81 | 0.04 | 16.3 | 2.72 | 2.72 | 1.00 | 0.99 | 0.99 | 0.048 | 2.43 | 0,8 | 39.8 | 46.5 | 0.83 | 0.19 | 0.80 | 8.0 |
| 2125 + 1/2 | 93.53 | 0.05 | 16.8 | 2.77 | 2.75 | 1.01 | 1.01 | 1.01 | 0.038 | 2.69 | 0,7 | 40.2 | 46.2 | 0.83 | 0.19 | 0.81 | 8.0 |
| 2126 | 93.16 | 0.02 | 17.1 | 2.78 | 2.78 | 1.00 | 1.00 | 1.00 | 0.031 | 2.59 | 0,7 | 41.2 | 68.9 | 0.84 | 0.19 | 0.82 | 8.0 |
| 2126 + 1/2 | 92.82 | 0.04 | 17.0 | 2.80 | 2.78 | 1.01 | 1.01 | 1.01 | 0.026 | 2.42 | 0,8 | 42.0 | 67.6 | 0.84 | 0.19 | 0.82 | 9.1 |
| 2127 | 92.57 | 0.01 | 17.2 | 2.81 | 2.78 | 1.01 | 1.01 | 1.01 | 0.026 | 2.44 | 0,8 | 42.9 | 65.4 | 0.84 | 0.20 | 0.82 | 9.2 |
| 2127 + 1/2 | 92.33 | 0.00 | 17.6 | 2.85 | 2.78 | 1.02 | 1.03 | 1.02 | 0.019 | 2.51 | 1,6 | 42.8 | 63.3 | 0.85 | 0.21 | 0.83 | 9.3 |
| 2128 | 92.10 | 0.02 | 17.8 | 2.86 | 2.79 | 1.03 | 1.03 | 1.03 | 0.014 | 3.12 | 15,8 | 42.4 | 57.7 | 0.85 | 0.21 | 0.84 | 9.3 |
| 2128 + 1/2 | 91.81 | 0.15 | 18.1 | 2.91 | 2.80 | 1.04 | 1.05 | 1.04 | 0.007 | 2.97 | 15,8 | 41.6 | 53.2 | 0.85 | 0.22 | 0.84 | 9.3 |
| 2129 | 91.23 | 0.09 | 18.4 | 2.91 | 2.80 | 1.04 | 1.05 | 1.04 | 0.004 | 2.77 | 2,7 | 41.0 | 52.2 | 0.85 | 0.22 | 0.85 | 9.5 |
| 2129 + 1/2 | 90.46 | 0.06 | 18.7 | 2.93 | 2.81 | 1.04 | 1.06 | 1.04 | 0.004 | 3.02 | 6,0 | 40.6 | 52.8 | 0.85 | 0.22 | 0.85 | 9.5 |
| 2130 | 89.58 | 0.01 | 18.9 | 2.92 | 2.82 | 1.04 | 1.05 | 1.04 | 0.005 | 3.04 | 2,7 | 40.0 | 46.9 | 0.85 | 0.23 | 0.85 | 9.5 |
| 2130 + 1/2 | 88.69 | 0.05 | 19.1 | 2.88 | 2.82 | 1.02 | 1.02 | 1.02 | 0.006 | 2.83 | 2,6 | 39.8 | 47.1 | 0.85 | 0.22 | 0.85 | 9.6 |
| 2131 | 87.90 | 0.07 | 19.2 | 2.88 | 2.82 | 1.02 | 1.02 | 1.02 | 0.009 | 2.77 | 2,6 | 39.8 | 46.7 | 0.85 | 0.22 | 0.85 | 9.5 |
| 2131 + 1/2 | 87.24 | 0.03 | 19.3 | 2.87 | 2.83 | 1.01 | 1.01 | 1.01 | 0.011 | 2.85 | 3,7 | 40.3 | 52.9 | 0.85 | 0.20 | 0.84 | 9.3 |
| 2132 | 86.64 | 0.04 | 19.3 | 2.84 | 2.84 | 1.00 | 1.01 | 1.00 | 0.004 | 2.68 | 3,7 | 40.8 | 56.4 | 0.85 | 0.21 | 0.84 | 8.0 |
| 2132 + 1/2 | 86.12 | 0.09 | 19.3 | 2.84 | 2.85 | 0.99 | 1.00 | 0.99 | 0.009 | 2.75 | 3,6 | 41.8 | 56.7 | 0.84 | 0.16 | 0.83 | 8.8 |
| 2133 | 85.41 | 0.01 | 19.5 | 2.82 | 2.86 | 0.99 | 0.99 | 0.99 | 0.010 | 2.72 | 3,6 | 42.5 | 58.4 | 0.84 | 0.16 | 0.82 | 8.0 |
| 2133 + 1/2 | 84.69 | 0.08 | 19.4 | 2.81 | 2.86 | 0.98 | 0.98 | 0.98 | 0.011 | 2.86 | 3,6 | 42.3 | 52.3 | 0.84 | 0.15 | 0.82 | 8.4 |
| 2134 | 84.13 | 0.09 | 19.6 | 2.79 | 2.87 | 0.97 | 0.97 | 0.97 | 0.017 | 2.77 | 4,7 | 41.2 | 53.8 | 0.83 | 0.15 | 0.82 | 8.4 |
| 2134 + 1/2 | 83.74 | 0.06 | 19.6 | 2.78 | 2.88 | 0.97 | 0.97 | 0.97 | 0.013 | 2.60 | 4,7 | 40.3 | 56.1 | 0.83 | 0.14 | 0.82 | 8.3 |
| 2135 | 83.48 | 0.22 | 19.8 | 2.77 | 2.88 | 0.96 | 0.96 | 0.96 | 0.020 | 2.68 | 4,6 | 38.8 | 58.5 | 0.83 | 0.14 | 0.82 | 8.0 |
| 2135 + 1/2 | 83.65 | 0.15 | 19.8 | 2.76 | 2.89 | 0.95 | 0.95 | 0.95 | 0.015 | 2.76 | 4,6 | 38.0 | 61.0 | 0.83 | 0.14 | 0.82 | 8.0 |
| 2136 | 84.14 | 0.01 | 20.0 | 2.83 | 2.91 | 0.97 | 0.97 | 0.97 | 0.020 | 2.87 | 4,6 | 38.6 | 63.5 | 0.83 | 0.14 | 0.82 | 8.0 |
| 2136 + 1/2 | 84.65 | 0.16 | 20.0 | 2.82 | 2.91 | 0.97 | 0.95 | 0.95 | 0.029 | 2.85 | 4,6 | 39.0 | 65.8 | 0.82 | 0.13 | 0.82 | 8.0 |
| 2137 | 84.85 | 0.04 | 20.1 | 2.86 | 2.92 | 0.98 | 0.97 | 0.97 | 0.025 | 2.64 | 4,6 | 36.0 | 67.7 | 0.82 | 0.13 | 0.82 | 8.0 |
| 2137 + 1/2 | 85.12 | 0.06 | 20.3 | 2.87 | 2.92 | 0.98 | 0.98 | 0.98 | 0.029 | 2.79 | 15,8 | 36.0 | 69.2 | 0.82 | 0.13 | 0.82 | 8.0 |
| 2138 | 85.27 | 0.05 | 20.4 | 2.94 | 2.91 | 1.01 | 1.01 | 1.01 | 0.025 | 3.51 | 15,8 | 33.8 | 69.9 | 0.81 | 0.15 | 0.81 | 8.0 |
| 2138 + 1/2 | 85.31 | 0.03 | 20.5 | 2.93 | 2.92 | 1.00 | 1.00 | 1.00 | 0.030 | 3.92 | 15,8 | 30.4 | 70.4 | 0.81 | 0.17 | 0.81 | 8.0 |
| 2139 | 85.30 | 0.08 | 20.5 | 2.93 | 2.94 | 1.00 | 1.00 | 1.00 | 0.023 | 3.45 | 15,8 | 31.2 | 70.1 | 0.81 | 0.20 | 0.81 | 8.8 |
| 2139 + 1/2 | 85.13 | 0.25 | 20.7 | 2.91 | 2.96 | 0.98 | 0.98 | 0.98 | 0.030 | 3.42 | 15,8 | 29.0 | 69.8 | 0.81 | 0.24 | 0.80 | 8.1 |
| 2140 | 85.46 | 0.12 | 20.8 | 2.97 | 2.96 | 1.00 | 1.01 | 1.00 | 0.026 | 4.72 | 15,8 | 28.5 | 68.7 | 0.80 | 0.27 | 0.80 | 8.6 |
| 2140 + 1/2 | 85.56 | 0.03 | 20.9 | 2.99 | 2.97 | 1.01 | 1.00 | 1.00 | 0.032 | 4.78 | 15,7 | 27.7 | 67.2 | 0.80 | 0.30 | 0.80 | 9.2 |
| 2141 | 85.59 | 0.13 | 21.1 | 2.97 | 3.00 | 0.99 | 0.99 | 0.99 | 0.027 | 5.93 | 15,7 | 28.0 | 65.3 | 0.80 | 0.36 | 0.80 | 8.0 |
| 2141 + 1/2 | 85.36 | 0.11 | 21.3 | 3.01 | 3.01 | 1.00 | 1.01 | 1.00 | 0.017 | 4.36 | 15,6 | 27.9 | 62.6 | 0.80 | 0.38 | 0.79 | 8.4 |
| 2142 | 84.92 | 0.01 | 21.4 | 3.02 | 3.04 | 0.99 | 0.99 | 0.99 | 0.025 | 4.49 | 15,6 | 27.7 | 59.7 | 0.79 | 0.39 | 0.79 | 8.4 |
| 2142 + 1/2 | 84.46 | 0.04 | 21.5 | 3.08 | 3.06 | 1.01 | 1.01 | 1.01 | 0.023 | 3.90 | 14,6 | 27.5 | 56.0 | 0.79 | 0.38 | 0.79 | 8.0 |
| 2143 | 84.09 | 0.04 | 21.8 | 3.09 | 3.10 | 1.00 | 1.00 | 1.00 | 0.020 | 4.84 | 14,6 | 27.7 | 55.7 | 0.79 | 0.36 | 0.78 | 8.0 |
| 2143 + 1/2 | 83.81 | 0.00 | 22.0 | 3.11 | 3.12 | 1.00 | 1.01 | 1.00 | 0.017 | 3.91 | 14,6 | 28.3 | 57.2 | 0.78 | 0.34 | 0.78 | 8.0 |
| 2144 | 83.52 | 0.07 | 22.1 | 3.15 | 3.16 | 1.00 | 0.99 | 0.99 | 0.025 | 4.14 | 13,6 | 29.1 | 53.8 | 0.78 | 0.32 | 0.78 | 8.0 |
| 2144 + 1/2 | 83.39 | 0.10 | 22.4 | 3.22 | 3.21 | 1.00 | 1.00 | 1.00 | 0.027 | 4.38 | 15,2 | 30.1 | 54.1 | 0.78 | 0.29 | 0.78 | 8.0 |
| 2145 | 83.45 | 0.14 | 22.7 | 3.27 | 3.26 | 1.00 | 1.01 | 1.00 | 0.024 | 3.49 | 15,2 | 30.8 | 53.3 | 0.78 | 0.27 | 0.78 | 8.0 |
| 2145 + 1/2 | 83.24 | 0.02 | 23.0 | 3.35 | 3.27 | 1.02 | 1.03 | 1.02 | 0.024 | 2.97 | 13,6 | 31.8 | 51.6 | 0.78 | 0.25 | 0.78 | 8.0 |
| 2146 | 83.08 | 0.09 | 23.0 | 3.38 | 3.27 | 1.03 | 1.04 | 1.03 | 0.017 | 3.36 | 13,5 | 32.9 | 49.5 | 0.78 | 0.23 | 0.78 | 8.4 |
| 2146 + 1/2 | 82.74 | 0.06 | 23.1 | 3.43 | 3.27 | 1.05 | 1.07 | 1.05 | 0.017 | 3.78 | 12,8 | 32.6 | 47.2 | 0.78 | 0.20 | 0.78 | 8.2 |
| 2147 | 82.27 | 0.08 | 23.5 | 3.45 | 3.27 | 1.05 | 1.07 | 1.05 | 0.014 | 3.32 | 12,8 | 32.6 | 46.1 | 0.78 | 0.17 | 0.77 | 8.1 |
| 2147 + 1/2 | 81.65 | 0.06 | 23.6 | 3.46 | 3.27 | 1.06 | 1.07 | 1.06 | 0.023 | 2.98 | 14,3 | 32.6 | 45.4 | 0.78 | 0.15 | 0.77 | 8.0 |
| 2148 | 81.16 | 0.13 | 23.8 | 3.43 | 3.27 | 1.05 | 1.06 | 1.05 | 0.024 | 3.10 | 11,8 | 33.1 | 43.4 | 0.78 | 0.13 | 0.77 | 8.0 |
| 2148 + 1/2 | 80.41 | 0.02 | 23.8 | 3.38 | 3.27 | 1.03 | 1.04 | 1.03 | 0.021 | 2.92 | 11,8 | 33.0 | 43.2 | 0.77 | 0.11 | 0.77 | 8.0 |
| 2149 | 79.71 | 0.02 | 24.2 | 3.36 | 3.27 | 1.03 | 1.03 | 1.03 | 0.018 | 3.01 | 13,2 | 32.5 | 42.0 | 0.77 | 0.11 | 0.77 | 8.0 |
| 2149 + 1/2 | 78.96 | 0.01 | 24.1 | 3.32 | 3.27 | 1.01 | 1.02 | 1.01 | 0.023 | 2.92 | 13,3 | 32.2 | 41.3 | 0.77 | 0.11 | 0.77 | 8.0 |
| 2150 | 78.23 | 0.01 | 24.3 | 3.33 | 3.27 | 1.02 | 1.03 | 1.02 | 0.015 | 2.93 | 13,3 | 31.5 | 40.2 | 0.77 | 0.11 | 0.76 | 8.0 |
| 2150 + 1/2 | 77.48 | 0.01 | 24.2 | 3.35 | 3.27 | 1.02 | 1.03 | 1.02 | 0.023 | 2.45 | 13,3 | 30.5 | 40.0 | 0.76 | 0.15 | 0.75 | 8.0 |
| 2151 | 76.72 | 0.05 | 24.1 | 3.31 | 3.27 | 1.01 | 1.02 | 1.01 | 0.019 | 2.07 | 12,2 | 29.3 | 38.7 | 0.75 | 0.19 | 0.75 | 8.0 |
| 2151 + 1/2 | 76.05 | 0.07 | 24.1 | 3.33 | 3.27 | 1.02 | 1.03 | 1.02 | 0.015 | 2.43 | 10,7 | 28.7 | 38.4 | 0.75 | 0.22 | 0.74 | 8.0 |
| 2152 | 75.53 | 0.00 | 24.1 | 3.36 | 3.27 | 1.03 | 1.03 | 1.03 | 0.027 | 2.71 | 12,3 | 28.2 | 37.3 | 0.74 | 0.24 | 0.74 | 8.0 |
| 2152 + 1/2 | 75.00 | 0.02 | 23.8 | 3.34 | 3.27 | 1.02 | 1.02 | 1.02 | 0.025 | 2.59 | 10,7 | 27.5 | 36.8 | 0.73 | 0.25 | 0.73 | 8.0 |
| 2153 | 74.52 | 0.00 | 23.1 | 3.33 | 3.27 | 1.02 | 1.01 | 1.01 | 0.031 | 2.00 | 10,7 | 27.0 | 36.4 | 0.73 | 0.28 | 0.72 | 8.0 |
| 2153 + 1/2 | 74.03 | 0.03 | 23.2 | 3.28 | 3.27 | 1.00 | 1.00 | 1.00 | 0.033 | 1.67 | 12,2 | 26.1 | 36.1 | 0.72 | 0.30 | 0.71 | 8.0 |
| 2154 | 73.49 | 0.01 | 22.5 | 3.24 | 3.26 | 0.99 | 0.98 | 0.98 | 0.044 | 1.75 | 14,8 | 25.2 | 35.7 | 0.70 | 0.29 | 0.70 | 8.0 |
| 2154 + 1/2 | 72.96 | 0.06 | 22.2 | 3.16 | 3.24 | 0.98 | 0.99 | 0.98 | 0.023 | 1.73 | 10,6 | 24.5 | 35.8 | 0.70 | 0.29 | 0.68 | 8.0 |
| 2155 | 72.30 | 0.00 | 21.6 | 3.17 | 3.23 | 0.98 | 0.97 | 0.97 | 0.061 | 1.88 | 10,6 | 24.0 | 35.7 | 0.68 | 0.29 | 0.67 | 8.0 |
| 2155 + 1/2 | 71.64 | 0.10 | 21.5 | 3.22 | 3.20 | 1.00 | 0.99 | 0.99 | 0.052 | 1.91 | 10,6 | 23.1 | 35.4 | 0.66 | 0.30 | 0.65 | 8.0 |
| 2156 | 70.79 | 0.10 | 21.5 | 3.19 | 3.20 | 1.00 | 1.00 | 1.00 | 0.048 | 1.95 | 15,3 | 21.9 | 34.6 | 0.64 | 0.29 | 0.63 | 8.0 |
| 2156 + 1/2 | 69.73 | 0.04 | 21.3 | 3.15 | 3.19 | 0.99 | 0.98 | 0.98 | 0.057 | 2.29 | 15,8 | 20.5 | 34.1 | 0.63 | 0.30 | 0.62 | 8.0 |
| 2157 | 68.60 | 0.04 | 21.0 | 3.22 | 3.17 | 1.01 | 1.03 | 1.01 | 0.059 | 2.40 | 15,3 | 19.5 | 32.9 | 0.61 | 0.30 | 0.60 | 8.0 |
| 2157 + 1/2 | 67.39 | 0.07 | 20.5 | 3.24 | 3.16 | 1.02 | 1.04 | 1.02 | 0.048 | 2.77 | 15,3 | 18.7 | 29.5 | 0.59 | 0.29 | 0.59 | 8.0 |
| 2158 | 66.33 | 0.11 | 20.1 | 3.17 | 3.15 | 1.01 | 1.01 | 1.01 | 0.067 | 3.14 | 15,3 | 17.5 | 24.5 | 0.58 | 0.25 | 0.57 | 8.0 |
| 2158 + 1/2 | 65.49 | 0.03 | 19.1 | 3.19 | 3.13 | 1.02 | 1.01 | 1.01 | 0.088 | 3.33 | 15,3 | 16.1 | 21.6 | 0.56 | 0.23 | 0.56 | 8.0 |
| 2159 | 64.72 | 0.02 | 19.5 | 3.10 | 3.11 | 1.00 | 0.99 | 0.99 | 0.106 | 2.76 | 11,8 | 14.5 | 19.8 | 0.55 | 0.20 | 0.55 | 8.0 |
| 2159 + 1/2 | 63.91 | 0.02 | 18.6 | 3.07 | 3.08 | 1.00 | 0.98 | 0.98 | 0.111 | 2.54 | 11,8 | 13.6 | 18.9 | 0.53 | 0.22 | 0.53 | 8.0 |
| 2160 | 63.06 | 0.02 | 18.2 | 3.06 | 3.06 | 1.00 | 1.01 | 1.00 | 0.086 | 2.03 | 11,8 | 12.9 | 17.8 | 0.52 | 0.23 | 0.52 | 8.0 |
| 2160 + 1/2 | 62.26 | 0.01 | 17.7 | 2.99 | 3.06 | 0.98 | 0.97 | 0.97 | 0.089 | 1.93 | 11,7 | 12.1 | 17.2 | 0.51 | 0.23 | 0.51 | 8.0 |
| 2161 | 61.48 | 0.02 | 17.2 | 3.05 | 2.99 | 1.02 | 1.00 | 1.00 | 0.087 | 2.28 | 11,7 | 11.5 | 16.6 | 0.50 | 0.23 | 0.49 | 8.0 |
| 2161 + 1/2 | 60.74 | 0.04 | 16.8 | 2.99 | 2.93 | 1.02 | 1.05 | 1.02 | 0.074 | 2.40 | 11,7 | 11.2 | 15.4 | 0.48 | 0.25 | 0.48 | 8.0 |
| 2162 | 59.91 | 0.04 | 17.2 | 2.86 | 2.91 | 0.98 | 0.99 | 0.98 | 0.081 | 2.25 | 11,7 | 11.0 | 15.9 | 0.47 | 0.24 | 0.47 | 8.0 |
| 2162 + 1/2 | 59.01 | 0.04 | 16.7 | 2.82 | 2.80 | 1.01 | 1.01 | 1.01 | 0.068 | 1.87 | 11,6 | 11.1 | 19.7 | 0.46 | 0.24 | 0.46 | 8.0 |
| 2163 | 58.03 | 0.02 | 15.7 | 2.74 | 2.77 | 0.99 | 0.99 | 0.99 | 0.054 | 2.37 | 10,7 | 11.7 | 27.6 | 0.45 | 0.23 | 0.45 | 8.0 |
| 2163 + 1/2 | 57.09 | 0.01 | 15.1 | 2.72 | 2.71 | 1.00 | 0.99 | 0.99 | 0.061 | 2.72 | 10,7 | 12.3 | 35.1 | 0.44 | 0.21 | 0.44 | 8.0 |
| 2164 | 56.14 | 0.01 | 14.5 | 2.69 | 2.69 | 1.00 | 1.01 | 1.00 | 0.049 | 3.08 | 10,7 | 11.1 | 24.8 | 0.43 | 0.18 | 0.42 | 8.0 |
| 2164 + 1/2 | 55.20 | 0.03 | 14.0 | 2.67 | 2.65 | 1.00 | 1.01 | 1.00 | 0.039 | 2.76 | 10,7 | 11.1 | 32.3 | 0.41 | 0.17 | 0.41 | 8.0 |
| 2165 | 54.31 | 0.04 | 13.3 | 2.62 | 2.62 | 1.00 | 1.00 | 1.00 | 0.033 | 2.39 | 10,7 | 10.7 | 30.3 | 0.40 | 0.16 | 0.40 | 8.0 |
| 2165 + 1/2 | 53.50 | 0.05 | 12.4 | 2.58 | 2.58 | 1.00 | 1.01 | 1.00 | 0.026 | 1.89 | 10,7 | 10.2 | 25.5 | 0.39 | 0.15 | 0.39 | 8.0 |
| 2166 | 52.79 | 0.03 | 11.8 | 2.53 | 2.53 | 1.00 | 1.00 | 1.00 | 0.020 | 1.80 | 11,6 | 9.3 | 27.4 | 0.38 | 0.13 | 0.38 | 8.0 |
| 2166 + 1/2 | 52.14 | 0.03 | 11.0 | 2.38 | 2.50 | 0.95 | 0.95 | 0.95 | 0.018 | 1.77 | 12,3 | 8.6 | 25.8 | 0.37 | 0.11 | 0.37 | 8.0 |
| 2167 | 51.54 | 0.02 | 10.3 | 2.45 | 2.44 | 1.00 | 0.99 | 0.99 | 0.021 | 1.82 | 12,3 | 7.8 | 21.8 | 0.36 | 0.10 | 0.36 | 8.0 |
| 2167 + 1/2 | 50.99 | 0.01 | 9.4 | 2.47 | 2.40 | 1.03 | 1.03 | 1.03 | 0.016 | 1.84 | 12,3 | 7.3 | 22.2 | 0.35 | 0.08 | 0.35 | 8.0 |
| 2168 | 50.45 | 0.01 | 8.6 | 2.39 | 2.39 | 1.00 | 1.00 | 1.00 | 0.013 | 1.85 | 12,3 | 6.5 | 17.5 | 0.34 | 0.07 | 0.34 | 8.0 |
| 2168 + 1/2 | 49.92 | 0.03 | 7.7 | 2.41 | 2.37 | 1.01 | 1.02 | 1.01 | 0.007 | 1.64 | 12,3 | 5.8 | 16.1 | 0.34 | 0.06 | 0.33 | 8.0 |
| 2169 | 49.45 | 0.02 | 7.0 | 2.37 | 2.36 | 1.01 | 1.01 | 1.01 | 0.009 | 1.82 | 10,8 | 5.9 | 14.3 | 0.33 | 0.06 | 0.33 | 8.0 |
| 2169 + 1/2 | 49.01 | 0.01 | 6.3 | 2.25 | 2.35 | 0.96 | 0.96 | 0.96 | 0.003 | 1.47 | 12,4 | 6.2 | 11.7 | 0.32 | 0.06 | 0.32 | 8.0 |
| 2170 | 48.60 | 0.01 | 5.6 | 2.26 | 2.32 | 0.98 | 0.98 | 0.98 | 0.002 | 1.71 | 10,8 | 6.4 | 9.1 | 0.32 | 0.06 | 0.31 | 8.0 |
| 2170 + 1/2 | 48.23 | 0.02 | 4.8 | 2.34 | 2.26 | 1.04 | 1.04 | 1.04 | 0.001 | 2.31 | 10,8 | 6.5 | 8.6 | 0.31 | 0.06 | 0.31 | 8.0 |
| 2171 | 47.88 | 0.02 | 4.1 | 2.21 | 2.26 | 0.98 | 0.98 | 0.98 | 0.000 | 1.81 | 9,8 | 6.9 | 9.6 | 0.30 | 0.06 | 0.30 | 8.0 |
| 2171 + 1/2 | 47.56 | 0.01 | 3.3 | 2.02 | 2.23 | 0.90 | 0.90 | 0.90 | 0.002 | 1.30 | 0,4 | 7.3 | 10.6 | 0.30 | 0.07 | 0.30 | 8.0 |
| 2172 | 47.26 | 0.01 | 2.7 | 2.17 | 2.20 | 0.98 | 0.98 | 0.98 | 0.000 | 2.09 | 10,8 | 7.4 | 12.1 | 0.30 | 0.07 | 0.29 | 8.0 |
| 2172 + 1/2 | 46.97 | 0.01 | 2.1 | 2.30 | 2.09 | 1.10 | 1.10 | 1.10 | 0.000 | 2.85 | 9,8 | 7.7 | 13.6 | 0.29 | 0.08 | 0.29 | 8.0 |
| 2173 | 46.71 | 0.00 | 1.6 | 2.19 | 2.01 | 1.09 | 1.09 | 1.09 | 0.000 | 2.73 | 9,8 | 8.1 | 15.0 | 0.29 | 0.10 | 0.29 | 8.0 |
| 2173 + 1/2 | 46.45 | 0.01 | 1.3 | 2.01 | 1.91 | 1.05 | 1.06 | 1.05 | 0.000 | 2.39 | 9,8 | 8.6 | 16.2 | 0.28 | 0.11 | 0.28 | 8.0 |
| 2174 last | 46.21 | 0.00 | 1.0 | 1.80 | 1.82 | 0.99 | 0.99 | 0.99 | 0.000 | 1.94 | 9,8 | 9.2 | 16.9 | 0.28 | 0.13 | 0.28 | 8.0 |
| 2174 + 1/2 | 45.97 | 0.00 | 0.9 | 1.62 | 1.70 | 0.95 | 0.95 | 0.95 | 0.000 | 1.24 | 9,8 | 9.4 | 17.7 | 0.28 | 0.14 | 0.27 | 8.0 |
| 2175 | 45.73 | 0.00 | 0.9 | 1.59 | 1.61 | 0.99 | 1.00 | 0.99 | 0.000 | 1.20 | 10,2 | 9.6 | 17.7 | 0.27 | 0.14 | 0.27 | 8.0 |
| 2175 + 1/2 | 45.48 | 0.00 | 0.8 | 1.57 | 1.61 | 0.97 | 0.98 | 0.97 | 0.000 | 1.20 | 11,2 | 9.3 | 17.7 | 0.27 | 0.15 | 0.27 | 8.0 |
| 2176 | 45.23 | 0.00 | 0.8 | 1.56 | 1.61 | 0.97 | 0.98 | 0.97 | 0.000 | 1.31 | 11,2 | 8.8 | 16.2 | 0.27 | 0.15 | 0.26 | 8.0 |
| 2176 + 1/2 | 44.98 | 0.00 | 0.8 | 1.53 | 1.61 | 0.95 | 0.97 | 0.95 | 0.000 | 1.31 | 11,2 | 8.3 | 14.9 | 0.26 | 0.14 | 0.26 | 8.0 |
| 2177 | 44.72 | 0.00 | 0.8 | 1.52 | 1.60 | 0.95 | 0.97 | 0.95 | 0.000 | 1.36 | 11,2 | 7.9 | 13.5 | 0.26 | 0.13 | 0.26 | 8.0 |
| 2177 + 1/2 | 44.47 | 0.00 | 0.8 | 1.47 | 1.59 | 0.92 | 0.94 | 0.92 | 0.000 | 1.30 | 11,2 | 8.6 | 12.4 | 0.25 | 0.12 | 0.25 | 8.0 |
| 2178 | 44.23 | 0.00 | 0.7 | 1.45 | 1.59 | 0.91 | 0.93 | 0.91 | 0.000 | 1.41 | 8,4 | 7.9 | 11.8 | 0.24 | 0.11 | 0.23 | 8.0 |
| 2178 + 1/2 | 43.98 | 0.00 | 0.8 | 1.39 | 1.58 | 0.88 | 0.90 | 0.88 | 0.000 | 1.82 | 8,4 | 8.0 | 10.4 | 0.22 | 0.06 | 0.21 | 8.0 |
| 2179 | 43.75 | 0.00 | 0.8 | 1.34 | 1.56 | 0.86 | 0.88 | 0.86 | 0.000 | 1.89 | 8,4 |  |  |  |  |  |  |
| 2179 + 1/2 | 43.51 | 0.00 | 1.0 | 1.32 | 1.56 | 0.85 | 0.87 | 0.85 | 0.000 | 2.00 | 8,3 |  |  |  |  |  |  |
| 2180 | 43.29 | 0.00 | 1.4 | 1.36 | 1.54 | 0.88 | 0.90 | 0.88 | 0.000 | 1.73 | 8,4 |  |  |  |  |  |  |
| 2180 + 1/2 | 43.06 | 0.01 | 1.8 | 1.56 | 1.51 | 1.03 | 1.06 | 1.03 | 0.000 | 2.07 | 8,4 |  |  |  |  |  |  |
| 2181 | 42.83 | 0.00 | 2.5 | 1.46 | 1.51 | 0.96 | 0.99 | 0.96 | 0.000 | 1.72 | 9,7 |  |  |  |  |  |  |
| 2181 + 1/2 | 42.58 | 0.01 | 3.2 | 1.51 | 1.49 | 1.01 | 1.04 | 1.01 | 0.000 | 1.77 | 8,4 |  |  |  |  |  |  |
| 2182 | 42.31 | 0.02 | 4.2 | 1.58 | 1.48 | 1.07 | 1.08 | 1.07 | 0.007 | 2.29 | 8,4 |  |  |  |  |  |  |
| 2182 + 1/2 | 41.99 | 0.01 | 5.4 | 1.60 | 1.48 | 1.08 | 1.09 | 1.08 | 0.007 | 3.01 | 6,0 |  |  |  |  |  |  |
| 2183 | 41.64 | 0.01 | 6.8 | 1.45 | 1.49 | 0.98 | 0.97 | 0.97 | 0.009 | 3.69 | 13,0 |  |  |  |  |  |  |
| 2183 + 1/2 | 41.28 | 0.01 | 8.4 | 1.72 | 1.48 | 1.16 | 1.12 | 1.12 | 0.022 | 4.87 | 13,0 |  |  |  |  |  |  |
| 2184 | 40.90 | 0.06 | 10.0 | 1.64 | 1.48 | 1.11 | 1.03 | 1.03 | 0.030 | 6.59 | 13,0 |  |  |  |  |  |  |
| 2184 + 1/2 | 40.40 | 0.21 | 11.8 | 1.65 | 1.48 | 1.12 | 1.07 | 1.07 | 0.031 | 7.23 | 13,0 |  |  |  |  |  |  |
| 2185 | 39.46 | 0.18 | 13.6 | 1.60 | 1.48 | 1.08 | 0.99 | 0.99 | 0.039 | 5.45 | 13,0 |  |  |  |  |  |  |
| 2185 + 1/2 | 38.16 | 0.06 | 15.0 | 1.48 | 1.47 | 1.01 | 0.91 | 0.91 | 0.035 | 3.46 | 12,0 |  |  |  |  |  |  |
| 2186 | 36.74 | 0.02 | 16.2 | 1.50 | 1.47 | 1.02 | 0.92 | 0.92 | 0.039 | 2.91 | 12,0 |  |  |  |  |  |  |
| 2186 + 1/2 | 35.27 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

## place

### dive (earth.dive, T at 1919, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

### rise (earth.rise, T at 2100, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 2x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 13.98, uhd 32.74.

Largest mean difference: 1.674 at frame 2156 (earth.rise), limit 12.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 0.399 at frame 2010 (earth.terrain), limit 3.2.
Largest level difference of one block (a grid of 16 by 9): -2.296 at frame 1755 (earth.hold), limit 12.
Largest level difference of the whole frame: -0.323 at frame 2010 (earth.terrain), limit 2.2.
Picture: out/work/smooth/earth-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1755 | earth.hold | 1.542 | 11.3 | 78 | -0.208 | -0.243 | 0.396 | 12.32 | -2.296 | 6,2 | 0.987 |
| 1853 | earth.dive | 1.582 | 9.4 | 86 | -0.066 | -0.115 | 0.385 | 7.83 | -1.018 | 4,5 | 1.068 |
| 1875 | earth.dive | 1.561 | 8.8 | 59 | 0.058 | 0.079 | 0.356 | 8.70 | 0.869 | 3,8 | 1.094 |
| 1898 | earth.dive | 1.470 | 8.7 | 80 | -0.193 | -0.263 | 0.318 | 10.39 | -1.367 | 10,6 | 1.131 |
| 2010 | earth.terrain | 1.543 | 8.9 | 61 | -0.323 | -0.400 | 0.399 | 6.18 | -1.354 | 9,8 | 0.932 |
| 2119 | earth.rise | 1.487 | 8.7 | 55 | -0.169 | -0.215 | 0.304 | 7.64 | -0.843 | 9,8 | 1.109 |
| 2138 | earth.rise | 1.584 | 9.2 | 61 | 0.024 | 0.043 | 0.327 | 9.17 | 0.468 | 7,3 | 1.143 |
| 2156 | earth.rise | 1.674 | 10.5 | 89 | 0.017 | 0.031 | 0.377 | 9.77 | 0.859 | 8,8 | 1.092 |
| 2213 | earth.travel | 1.265 | 7.1 | 93 | 0.005 | 0.005 | 0.159 | 6.75 | 0.186 | 14,7 | 1.494 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.

## counts

Film frames 1680 to 2249 in order on one fresh page, 1140 pictures at rate 2, tier draft at preview, 3724 s. Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): 5 warm draws. Its work counts for that picture and stands in brackets. Judged: dive, rise and travel, every picture.

| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |
|---|---|---|---|---|---|---|---|
| earth.hold | no | 300 | 1 | 1680 | 21 | 195 | 112 |
| earth.dive | yes | 180 | 0 |  | 0 | 0 | 0 |
| earth.terrain | no | 360 | 0 |  | 0 | 0 | 0 |
| earth.rise | yes | 150 | 0 |  | 0 | 0 | 0 |
| earth.travel | yes | 150 | 0 |  | 0 | 0 | 0 |

Every picture with work (of the warm start call in brackets):

| frame | segment | programs | texture uploads | buffers | warm draws |
|---|---|---|---|---|---|
| 1680 | earth.hold | 21 (21) | 195 (195) | 112 (112) | 5 |
