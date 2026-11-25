# smooth: mercury

Commit 9d59e6999a2ac769f1c2fd941b03a2ea9a0f700a. Capture rate 2. Parts: path, pictures, place, parity, counts.

Joined from the files of 1 machine(s), nothing is rendered, measured or counted here. The path: /home/user/workspace/work/p6/sm52/05/mercury (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The pictures: the dive /home/user/workspace/work/p6/sm52/01/mercury-dive-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm52/02/mercury-dive-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz); the rise /home/user/workspace/work/p6/sm52/03/mercury-rise-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm52/04/mercury-rise-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The place: /home/user/workspace/work/p6/sm52/05/mercury (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The parity: /home/user/workspace/work/p6/sm52/05/mercury (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The counts: /home/user/workspace/work/p6/sm52/06/mercury (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

VERDICT: red. 3 numbers over the limit or not measured.

## path

### dive (mercury.dive, frames 690 to 779, T at 760, window 678 to 791)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.0562 log of the height a film frame | 1.925 | 733 | 0.047 | 729 |  |  | 0.007 | 0.013 | 0.000 | 0.000 | 0.001 at 791 |
| whole frames | turn | 1.047 degrees a film frame | 2.038 | 733 | 0.053 | 724 |  |  | 0.003 | 0.012 | 0.003 | 0.000 | 0.000 at 785 |
| whole frames | speed | 4.329 px a film frame at the place | 1.753 | 732 | 0.055 over 8 | 695 |  |  | 0.004 | 0.006 | 0.000 | 0.025 over 8 | 0.005 at 791 |
| rate 2 | rate | 0.05591 log of the height a film frame | 1.938 | 733 + 1/2 | 0.047 | 730 | 0.024 | 730 | 0.009 | 0.011 | 0.000 | 0.000 | 0.001 at 791 + 1/2 |
| rate 2 | turn | 1.041 degrees a film frame | 2.052 | 733 + 1/2 | 0.053 | 724 + 1/2 | 0.027 | 724 | 0.004 | 0.009 | 0.006 | 0.000 | 0.000 at 785 |
| rate 2 | speed | 4.359 px a film frame at the place | 1.771 | 732 + 1/2 | 0.055 over 8 | 736 + 1/2 | 0.027 over 8 | 736 + 1/2 | 0.005 | 0.007 | 0.000 | 0.026 over 8 | 0.005 at 791 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 780, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.00918 of its height a film frame, the mean of its first 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 0.91 at frame 795 + 1/2, limit 0.87; inside the dive itself 1.01 at frame 780. Largest step from one capture frame to the next 0.18 at frame 777 + 1/2, shown. The part along the surface view's own direction of motion: 0.91 at the lowest, lowest 0.91 at frame 795 + 1/2, shown; under 0 the eye goes back.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 678 | hold orbit | 3.169e+0 | 0.006 |  |  | 0.045 |  |  | 0.043 |  |  | 0 |
| 679 | hold orbit | 3.168e+0 | 0.006 | 0.000 | 0.000 | 0.045 | 0.000 | 0.000 | 0.042 | 0.001 | 0.001 | 8 |
| 680 | hold orbit | 3.167e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.041 | 0.001 | 0.001 | 8 |
| 681 | hold orbit | 3.166e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.040 | 0.001 | 0.001 | 8 |
| 682 | hold orbit | 3.165e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.039 | 0.001 | 0.001 | 8 |
| 683 | hold orbit | 3.164e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.038 | 0.001 | 0.001 | 8 |
| 684 | hold orbit | 3.162e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.037 | 0.001 | 0.001 | 8 |
| 685 | hold orbit | 3.161e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.037 | 0.001 | 0.001 | 8 |
| 686 | hold orbit | 3.160e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.036 | 0.001 | 0.001 | 8 |
| 687 | hold orbit | 3.159e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.035 | 0.001 | 0.001 | 8 |
| 688 | hold orbit | 3.158e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.034 | 0.001 | 0.001 | 8 |
| 689 | hold orbit | 3.157e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.034 | 0.001 | 0.001 | 8 |
| 690 first | dive orbit | 3.156e+0 | 0.006 | 0.000 | 0.002 | 0.046 | 0.000 | 0.001 | 0.033 | 0.000 | 0.000 | 8 |
| 691 | dive orbit | 3.153e+0 | 0.013 | 0.007 | 0.019 | 0.043 | 0.003 | 0.006 | 0.037 | 0.004 | 0.014 | 8 |
| 692 | dive orbit | 3.146e+0 | 0.040 | 0.027 | 0.040 | 0.040 | 0.003 | 0.014 | 0.061 | 0.024 | 0.043 | 8 |
| 693 | dive orbit | 3.131e+0 | 0.085 | 0.044 | 0.047 | 0.067 | 0.026 | 0.039 | 0.111 | 0.050 | 0.054 | 8 |
| 694 | dive orbit | 3.108e+0 | 0.131 | 0.047 | 0.047 | 0.108 | 0.042 | 0.044 | 0.165 | 0.054 | 0.054 | 8 |
| 695 | dive orbit | 3.077e+0 | 0.178 | 0.047 | 0.047 | 0.153 | 0.045 | 0.046 | 0.220 | 0.055 | 0.054 | 8 |
| 696 | dive orbit | 3.038e+0 | 0.225 | 0.047 | 0.047 | 0.200 | 0.046 | 0.047 | 0.275 | 0.055 | 0.054 | 8 |
| 697 | dive orbit | 2.992e+0 | 0.272 | 0.047 | 0.047 | 0.246 | 0.047 | 0.047 | 0.329 | 0.054 | 0.054 | 8 |
| 698 | dive orbit | 2.939e+0 | 0.319 | 0.047 | 0.047 | 0.293 | 0.047 | 0.047 | 0.383 | 0.054 | 0.054 | 8 |
| 699 | dive orbit | 2.880e+0 | 0.366 | 0.047 | 0.047 | 0.340 | 0.047 | 0.048 | 0.437 | 0.054 | 0.054 | 8 |
| 700 | dive orbit | 2.813e+0 | 0.412 | 0.047 | 0.047 | 0.388 | 0.048 | 0.048 | 0.490 | 0.053 | 0.053 | 8 |
| 701 | dive orbit | 2.742e+0 | 0.459 | 0.047 | 0.047 | 0.436 | 0.048 | 0.048 | 0.543 | 0.053 | 0.053 | 8 |
| 702 | dive orbit | 2.665e+0 | 0.506 | 0.047 | 0.047 | 0.484 | 0.048 | 0.048 | 0.596 | 0.053 | 0.053 | 8 |
| 703 | dive orbit | 2.583e+0 | 0.553 | 0.047 | 0.047 | 0.532 | 0.048 | 0.049 | 0.648 | 0.052 | 0.052 | 8 |
| 704 | dive orbit | 2.498e+0 | 0.600 | 0.047 | 0.047 | 0.580 | 0.048 | 0.049 | 0.699 | 0.051 | 0.052 | 8 |
| 705 | dive orbit | 2.409e+0 | 0.647 | 0.047 | 0.047 | 0.629 | 0.049 | 0.049 | 0.750 | 0.051 | 0.051 | 8 |
| 706 | dive orbit | 2.317e+0 | 0.693 | 0.047 | 0.047 | 0.678 | 0.049 | 0.049 | 0.800 | 0.050 | 0.050 | 8 |
| 707 | dive orbit | 2.222e+0 | 0.740 | 0.047 | 0.047 | 0.727 | 0.049 | 0.050 | 0.850 | 0.049 | 0.050 | 8 |
| 708 | dive orbit | 2.126e+0 | 0.787 | 0.047 | 0.047 | 0.777 | 0.049 | 0.050 | 0.899 | 0.049 | 0.049 | 8 |
| 709 | dive orbit | 2.029e+0 | 0.834 | 0.047 | 0.047 | 0.826 | 0.050 | 0.050 | 0.947 | 0.048 | 0.048 | 8 |
| 710 | dive orbit | 1.931e+0 | 0.881 | 0.047 | 0.047 | 0.876 | 0.050 | 0.050 | 0.994 | 0.047 | 0.047 | 8 |
| 711 | dive orbit | 1.833e+0 | 0.927 | 0.047 | 0.047 | 0.927 | 0.050 | 0.051 | 1.040 | 0.046 | 0.047 | 8 |
| 712 | dive orbit | 1.735e+0 | 0.974 | 0.047 | 0.047 | 0.977 | 0.051 | 0.051 | 1.085 | 0.045 | 0.046 | 8 |
| 713 | dive orbit | 1.638e+0 | 1.021 | 0.047 | 0.047 | 1.028 | 0.051 | 0.051 | 1.130 | 0.044 | 0.045 | 8 |
| 714 | dive orbit | 1.543e+0 | 1.068 | 0.047 | 0.047 | 1.079 | 0.051 | 0.052 | 1.173 | 0.044 | 0.044 | 8 |
| 715 | dive orbit | 1.449e+0 | 1.115 | 0.047 | 0.047 | 1.131 | 0.051 | 0.052 | 1.216 | 0.043 | 0.043 | 8 |
| 716 | dive orbit | 1.358e+0 | 1.162 | 0.047 | 0.047 | 1.182 | 0.052 | 0.052 | 1.257 | 0.041 | 0.042 | 8 |
| 717 | dive orbit | 1.268e+0 | 1.208 | 0.047 | 0.047 | 1.234 | 0.052 | 0.052 | 1.298 | 0.040 | 0.041 | 8 |
| 718 | dive orbit | 1.182e+0 | 1.255 | 0.047 | 0.047 | 1.287 | 0.052 | 0.053 | 1.337 | 0.039 | 0.040 | 8 |
| 719 | dive orbit | 1.099e+0 | 1.302 | 0.047 | 0.047 | 1.339 | 0.052 | 0.053 | 1.375 | 0.038 | 0.039 | 8 |
| 720 | dive orbit | 1.018e+0 | 1.349 | 0.047 | 0.047 | 1.392 | 0.053 | 0.053 | 1.412 | 0.037 | 0.038 | 8 |
| 721 | dive orbit | 9.416e-1 | 1.396 | 0.047 | 0.047 | 1.445 | 0.053 | 0.053 | 1.448 | 0.036 | 0.036 | 8 |
| 722 | dive orbit | 8.682e-1 | 1.443 | 0.047 | 0.047 | 1.497 | 0.053 | 0.053 | 1.483 | 0.035 | 0.035 | 8 |
| 723 | dive orbit | 7.985e-1 | 1.489 | 0.047 | 0.047 | 1.551 | 0.053 | 0.053 | 1.516 | 0.033 | 0.034 | 8 |
| 724 | dive orbit | 7.325e-1 | 1.536 | 0.047 | 0.047 | 1.604 | 0.053 | 0.053 | 1.548 | 0.032 | 0.033 | 8 |
| 725 | dive orbit | 6.701e-1 | 1.583 | 0.047 | 0.047 | 1.657 | 0.053 | 0.053 | 1.579 | 0.031 | 0.032 | 8 |
| 726 | dive orbit | 6.115e-1 | 1.630 | 0.047 | 0.047 | 1.710 | 0.053 | 0.053 | 1.608 | 0.030 | 0.030 | 8 |
| 727 | dive orbit | 5.565e-1 | 1.677 | 0.047 | 0.047 | 1.763 | 0.053 | 0.053 | 1.637 | 0.028 | 0.029 | 8 |
| 728 | dive orbit | 5.051e-1 | 1.724 | 0.047 | 0.047 | 1.815 | 0.053 | 0.053 | 1.664 | 0.027 | 0.028 | 8 |
| 729 | dive orbit | 4.573e-1 | 1.770 | 0.047 | 0.047 | 1.868 | 0.052 | 0.053 | 1.689 | 0.026 | 0.026 | 8 |
| 730 | dive orbit | 4.129e-1 | 1.817 | 0.047 | 0.047 | 1.920 | 0.052 | 0.052 | 1.714 | 0.024 | 0.025 | 8 |
| 731 | dive orbit | 3.718e-1 | 1.864 | 0.047 | 0.047 | 1.971 | 0.052 | 0.052 | 1.737 | 0.023 | 0.024 | 8 |
| 732 | dive orbit | 3.341e-1 | 1.905 | 0.040 | 0.039 | 2.016 | 0.044 | 0.043 | 1.753 | 0.016 | 0.015 | 8 |
| 733 | dive orbit | 2.998e-1 | 1.925 | 0.021 | 0.018 | 2.038 | 0.022 | 0.020 | 1.751 | 0.002 | 0.014 | 8 |
| 734 | dive orbit | 2.691e-1 | 1.925 | 0.000 | 0.012 | 2.037 | 0.001 | 0.014 | 1.730 | 0.021 | 0.031 | 8 |
| 735 | dive orbit | 2.417e-1 | 1.906 | 0.019 | 0.030 | 2.016 | 0.022 | 0.035 | 1.694 | 0.036 | 0.046 | 8 |
| 736 | dive orbit | 2.176e-1 | 1.871 | 0.035 | 0.041 | 1.975 | 0.041 | 0.048 | 1.644 | 0.049 | 0.055 | 8 |
| 737 | dive orbit | 1.963e-1 | 1.830 | 0.041 | 0.042 | 1.927 | 0.048 | 0.049 | 1.591 | 0.053 | 0.054 | 8 |
| 738 | dive orbit | 1.776e-1 | 1.789 | 0.041 | 0.042 | 1.878 | 0.049 | 0.049 | 1.539 | 0.052 | 0.053 | 8 |
| 739 | dive orbit | 1.610e-1 | 1.747 | 0.041 | 0.042 | 1.829 | 0.049 | 0.049 | 1.487 | 0.051 | 0.052 | 8 |
| 740 | dive orbit | 1.462e-1 | 1.706 | 0.041 | 0.042 | 1.780 | 0.049 | 0.050 | 1.437 | 0.050 | 0.051 | 8 |
| 741 | dive orbit | 1.332e-1 | 1.665 | 0.041 | 0.042 | 1.731 | 0.049 | 0.050 | 1.388 | 0.049 | 0.050 | 8 |
| 742 | dive orbit | 1.216e-1 | 1.624 | 0.041 | 0.042 | 1.681 | 0.049 | 0.050 | 1.339 | 0.048 | 0.049 | 8 |
| 743 | dive orbit | 1.112e-1 | 1.582 | 0.041 | 0.042 | 1.632 | 0.049 | 0.050 | 1.292 | 0.048 | 0.048 | 8 |
| 744 | dive orbit | 1.020e-1 | 1.541 | 0.041 | 0.042 | 1.582 | 0.049 | 0.050 | 1.245 | 0.047 | 0.047 | 8 |
| 745 | dive orbit | 9.375e-2 | 1.500 | 0.041 | 0.042 | 1.533 | 0.049 | 0.050 | 1.199 | 0.046 | 0.046 | 8 |
| 746 | dive orbit | 8.637e-2 | 1.458 | 0.041 | 0.042 | 1.484 | 0.049 | 0.050 | 1.155 | 0.045 | 0.045 | 8 |
| 747 | dive orbit | 7.976e-2 | 1.417 | 0.041 | 0.042 | 1.434 | 0.049 | 0.049 | 1.111 | 0.044 | 0.044 | 8 |
| 748 | dive orbit | 7.383e-2 | 1.376 | 0.041 | 0.042 | 1.386 | 0.049 | 0.049 | 1.069 | 0.042 | 0.043 | 8 |
| 749 | dive orbit | 6.849e-2 | 1.334 | 0.041 | 0.042 | 1.337 | 0.049 | 0.049 | 1.028 | 0.041 | 0.042 | 8 |
| 750 | dive orbit | 6.369e-2 | 1.293 | 0.041 | 0.042 | 1.288 | 0.048 | 0.049 | 0.988 | 0.040 | 0.040 | 8 |
| 751 | dive orbit | 5.936e-2 | 1.252 | 0.041 | 0.042 | 1.240 | 0.048 | 0.048 | 0.950 | 0.038 | 0.038 | 8 |
| 752 | dive orbit | 5.546e-2 | 1.211 | 0.041 | 0.042 | 1.192 | 0.048 | 0.048 | 0.914 | 0.036 | 0.036 | 8 |
| 753 | dive orbit | 5.193e-2 | 1.169 | 0.041 | 0.042 | 1.145 | 0.048 | 0.048 | 0.880 | 0.034 | 0.034 | 8 |
| 754 | dive orbit | 4.874e-2 | 1.128 | 0.041 | 0.042 | 1.097 | 0.047 | 0.048 | 0.849 | 0.031 | 0.031 | 8 |
| 755 | dive orbit | 4.585e-2 | 1.087 | 0.041 | 0.042 | 1.050 | 0.047 | 0.047 | 0.822 | 0.028 | 0.028 | 8 |
| 756 | dive orbit | 4.324e-2 | 1.045 | 0.041 | 0.042 | 1.004 | 0.047 | 0.047 | 0.798 | 0.024 | 0.024 | 8 |
| 757 | dive orbit | 4.086e-2 | 1.004 | 0.041 | 0.042 | 0.957 | 0.046 | 0.047 | 0.779 | 0.019 | 0.019 | 8 |
| 758 | dive orbit | 3.871e-2 | 0.963 | 0.041 | 0.042 | 0.911 | 0.046 | 0.046 | 0.764 | 0.015 | 0.015 | 8 |
| 759 | dive orbit | 3.676e-2 | 0.922 | 0.041 | 0.042 | 0.866 | 0.046 | 0.046 | 0.753 | 0.011 | 0.011 | 8 |
| 760 T | dive terrain | 3.498e-2 | 0.880 | 0.041 | 0.042 | 0.820 | 0.045 | 0.046 | 0.745 | 0.008 | 0.008 | 8 |
| 761 | dive terrain | 3.337e-2 | 0.839 | 0.041 | 0.042 | 0.775 | 0.045 | 0.045 | 0.740 | 0.005 | 0.005 | 8 |
| 762 | dive terrain | 3.191e-2 | 0.798 | 0.041 | 0.042 | 0.731 | 0.045 | 0.045 | 0.736 | 0.003 | 0.003 | 8 |
| 763 | dive terrain | 3.058e-2 | 0.756 | 0.041 | 0.042 | 0.686 | 0.044 | 0.045 | 0.734 | 0.002 | 0.002 | 8 |
| 764 | dive terrain | 2.938e-2 | 0.715 | 0.041 | 0.042 | 0.642 | 0.044 | 0.044 | 0.734 | 0.001 | 0.001 | 8 |
| 765 | dive terrain | 2.828e-2 | 0.674 | 0.041 | 0.042 | 0.598 | 0.044 | 0.044 | 0.734 | 0.001 | 0.001 | 8 |
| 766 | dive terrain | 2.730e-2 | 0.633 | 0.041 | 0.042 | 0.555 | 0.044 | 0.044 | 0.736 | 0.001 | 0.002 | 8 |
| 767 | dive terrain | 2.640e-2 | 0.591 | 0.041 | 0.042 | 0.511 | 0.043 | 0.044 | 0.738 | 0.002 | 0.002 | 8 |
| 768 | dive terrain | 2.560e-2 | 0.550 | 0.041 | 0.042 | 0.468 | 0.043 | 0.043 | 0.740 | 0.002 | 0.003 | 8 |
| 769 | dive terrain | 2.488e-2 | 0.509 | 0.041 | 0.042 | 0.426 | 0.043 | 0.043 | 0.743 | 0.003 | 0.003 | 8 |
| 770 | dive terrain | 2.423e-2 | 0.467 | 0.041 | 0.042 | 0.383 | 0.043 | 0.043 | 0.746 | 0.003 | 0.003 | 8 |
| 771 | dive terrain | 2.366e-2 | 0.426 | 0.041 | 0.042 | 0.340 | 0.043 | 0.043 | 0.749 | 0.003 | 0.003 | 8 |
| 772 | dive terrain | 2.315e-2 | 0.385 | 0.041 | 0.042 | 0.298 | 0.042 | 0.043 | 0.752 | 0.003 | 0.003 | 8 |
| 773 | dive terrain | 2.271e-2 | 0.344 | 0.041 | 0.042 | 0.256 | 0.042 | 0.042 | 0.756 | 0.004 | 0.004 | 8 |
| 774 | dive terrain | 2.233e-2 | 0.302 | 0.041 | 0.042 | 0.214 | 0.042 | 0.042 | 0.759 | 0.003 | 0.004 | 8 |
| 775 | dive terrain | 2.200e-2 | 0.261 | 0.041 | 0.042 | 0.171 | 0.042 | 0.042 | 0.755 | 0.004 | 0.007 | 8 |
| 776 | dive terrain | 2.173e-2 | 0.220 | 0.041 | 0.042 | 0.129 | 0.042 | 0.042 | 0.749 | 0.006 | 0.006 | 8 |
| 777 | dive terrain | 2.152e-2 | 0.178 | 0.041 | 0.042 | 0.087 | 0.042 | 0.042 | 0.743 | 0.005 | 0.005 | 8 |
| 778 | dive terrain | 2.135e-2 | 0.138 | 0.041 | 0.041 | 0.046 | 0.041 | 0.042 | 0.740 | 0.004 | 0.004 | 8 |
| 779 last | dive terrain | 2.122e-2 | 0.107 | 0.031 | 0.029 | 0.015 | 0.031 | 0.029 | 0.740 | 0.000 | 0.004 | 8 |
| 780 | terrain terrain | 2.111e-2 | 0.094 | 0.013 | 0.011 | 0.003 | 0.012 | 0.009 | 0.746 | 0.006 | 0.007 | 8 |
| 781 | terrain terrain | 2.100e-2 | 0.092 | 0.002 | 0.001 | 0.002 | 0.000 | 0.000 | 0.746 | 0.000 | 0.004 | 8 |
| 782 | terrain terrain | 2.090e-2 | 0.091 | 0.001 | 0.001 | 0.002 | 0.000 | 0.000 | 0.742 | 0.004 | 0.004 | 8 |
| 783 | terrain terrain | 2.079e-2 | 0.091 | 0.001 | 0.001 | 0.002 | 0.000 | 0.000 | 0.737 | 0.004 | 0.004 | 8 |
| 784 | terrain terrain | 2.068e-2 | 0.090 | 0.001 | 0.001 | 0.002 | 0.000 | 0.000 | 0.733 | 0.004 | 0.004 | 8 |
| 785 | terrain terrain | 2.058e-2 | 0.090 | 0.001 | 0.001 | 0.002 | 0.000 | 0.000 | 0.728 | 0.005 | 0.005 | 8 |
| 786 | terrain terrain | 2.048e-2 | 0.089 | 0.001 | 0.001 | 0.002 | 0.000 | 0.000 | 0.724 | 0.005 | 0.005 | 8 |
| 787 | terrain terrain | 2.038e-2 | 0.088 | 0.001 | 0.001 | 0.002 | 0.000 | 0.000 | 0.719 | 0.005 | 0.005 | 8 |
| 788 | terrain terrain | 2.028e-2 | 0.088 | 0.001 | 0.001 | 0.001 | 0.000 | 0.000 | 0.714 | 0.005 | 0.005 | 8 |
| 789 | terrain terrain | 2.018e-2 | 0.087 | 0.001 | 0.001 | 0.001 | 0.000 | 0.000 | 0.709 | 0.005 | 0.005 | 8 |
| 790 | terrain terrain | 2.008e-2 | 0.086 | 0.001 | 0.001 | 0.001 | 0.000 | 0.000 | 0.705 | 0.005 | 0.005 | 8 |
| 791 | terrain terrain | 1.998e-2 | 0.086 | 0.001 | 0.001 | 0.001 | 0.000 | 0.000 | 0.700 | 0.005 | 0.005 | 8 |

### rise (mercury.rise, frames 960 to 1034, T at 977, window 948 to 1046)

| run | curve | mean | largest | at | step | at | step between capture frames | at | seam in | seam out | fall before | climb after | steps beyond the seams |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| whole frames | rate | 0.0701 log of the height a film frame | 1.896 | 999 | 0.076 | 1019 |  |  | 0.004 | 0.009 | 0.000 | 0.000 | 0.069 at 1046 |
| whole frames | turn | 1.227 degrees a film frame | 2.011 | 999 | 0.063 | 1008 |  |  | 0.003 | 0.011 | 0.000 | 0.000 | 0.000 at 1039 |
| whole frames | speed | 5.189 px a film frame at the place | 1.905 | 1000 | 0.073 over 8 | 995 |  |  | 0.013 | 0.010 | 0.005 over 8 | 0.017 over 8 | 3.141 at 1044 |
| rate 2 | rate | 0.06967 log of the height a film frame | 1.908 | 998 + 1/2 | 0.077 | 1019 | 0.039 | 1018 + 1/2 | 0.005 | 0.007 | 0.000 | 0.000 | 0.075 at 1046 + 1/2 |
| rate 2 | turn | 1.219 degrees a film frame | 2.026 | 998 + 1/2 | 0.063 | 1008 | 0.032 | 1008 | 0.004 | 0.008 | 0.000 | 0.000 | 0.000 at 1039 + 1/2 |
| rate 2 | speed | 5.094 px a film frame at the place | 1.902 | 1000 | 0.073 over 8 | 994 + 1/2 | 0.037 over 8 | 994 + 1/2 | 0.015 | 0.009 | 0.011 over 8 | 0.028 over 8 | 3.210 at 1044 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 960, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.0145 of its height a film frame, the mean of its last 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 0.93 at frame 944, limit 0.87; inside the rise itself 1.02 at frame 960 + 1/2. Largest step from one capture frame to the next 0.19 at frame 964 + 1/2, shown. The part along the surface view's own direction of motion: 0.12 at the lowest, lowest 0.12 at frame 944, shown; under 0 the eye goes back.

Rest between the rise and the travel (the seam into mercury.travel at film frame 1035, 12 film frames to each side, read at rate 2): a rise and the travel after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body's edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest 1.68 at frame 1037, against 23.21 at frame 1023 and 95.79 at frame 1046 + 1/2 at the ends of the window. The lowest is 0.072 of the slower end, limit 0.07. Near 0 the picture comes to rest between the rise and the travel.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 948 | terrain terrain | 1.794e-2 | 0.177 |  |  | 0.003 |  |  | 0.547 |  |  | 0 |
| 949 | terrain terrain | 1.818e-2 | 0.190 | 0.012 | 0.012 | 0.003 | 0.000 | 0.000 | 0.546 | 0.001 | 0.014 | 8 |
| 950 | terrain terrain | 1.844e-2 | 0.197 | 0.008 | 0.007 | 0.003 | 0.000 | 0.000 | 0.526 | 0.020 | 0.028 | 8 |
| 951 | terrain terrain | 1.870e-2 | 0.201 | 0.003 | 0.003 | 0.003 | 0.000 | 0.000 | 0.495 | 0.031 | 0.035 | 8 |
| 952 | terrain terrain | 1.896e-2 | 0.201 | 0.000 | 0.001 | 0.003 | 0.000 | 0.000 | 0.461 | 0.034 | 0.035 | 8 |
| 953 | terrain terrain | 1.923e-2 | 0.200 | 0.001 | 0.002 | 0.003 | 0.000 | 0.000 | 0.430 | 0.031 | 0.031 | 8 |
| 954 | terrain terrain | 1.950e-2 | 0.198 | 0.002 | 0.002 | 0.003 | 0.000 | 0.000 | 0.405 | 0.025 | 0.025 | 8 |
| 955 | terrain terrain | 1.977e-2 | 0.196 | 0.002 | 0.002 | 0.003 | 0.000 | 0.000 | 0.387 | 0.018 | 0.018 | 8 |
| 956 | terrain terrain | 2.004e-2 | 0.194 | 0.002 | 0.001 | 0.003 | 0.000 | 0.000 | 0.375 | 0.012 | 0.012 | 8 |
| 957 | terrain terrain | 2.031e-2 | 0.193 | 0.001 | 0.001 | 0.003 | 0.000 | 0.000 | 0.367 | 0.008 | 0.008 | 8 |
| 958 | terrain terrain | 2.059e-2 | 0.193 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.362 | 0.005 | 0.005 | 8 |
| 959 | terrain terrain | 2.087e-2 | 0.194 | 0.000 | 0.001 | 0.003 | 0.000 | 0.000 | 0.359 | 0.003 | 0.003 | 8 |
| 960 first | rise terrain | 2.116e-2 | 0.194 | 0.001 | 0.001 | 0.003 | 0.000 | 0.001 | 0.357 | 0.002 | 0.009 | 8 |
| 961 | rise terrain | 2.145e-2 | 0.198 | 0.004 | 0.011 | 0.006 | 0.003 | 0.011 | 0.344 | 0.013 | 0.015 | 8 |
| 962 | rise terrain | 2.178e-2 | 0.214 | 0.016 | 0.024 | 0.023 | 0.017 | 0.026 | 0.339 | 0.005 | 0.004 | 8 |
| 963 | rise terrain | 2.215e-2 | 0.242 | 0.028 | 0.036 | 0.055 | 0.032 | 0.041 | 0.346 | 0.008 | 0.015 | 8 |
| 964 | rise terrain | 2.259e-2 | 0.283 | 0.040 | 0.047 | 0.101 | 0.046 | 0.053 | 0.364 | 0.018 | 0.023 | 8 |
| 965 | rise terrain | 2.312e-2 | 0.330 | 0.047 | 0.048 | 0.154 | 0.054 | 0.055 | 0.389 | 0.024 | 0.025 | 8 |
| 966 | rise terrain | 2.374e-2 | 0.377 | 0.047 | 0.047 | 0.208 | 0.054 | 0.055 | 0.414 | 0.026 | 0.026 | 8 |
| 967 | rise terrain | 2.446e-2 | 0.424 | 0.047 | 0.047 | 0.263 | 0.054 | 0.055 | 0.440 | 0.026 | 0.026 | 8 |
| 968 | rise terrain | 2.528e-2 | 0.470 | 0.046 | 0.046 | 0.317 | 0.055 | 0.055 | 0.466 | 0.026 | 0.026 | 8 |
| 969 | rise terrain | 2.621e-2 | 0.516 | 0.046 | 0.046 | 0.372 | 0.055 | 0.055 | 0.492 | 0.026 | 0.026 | 8 |
| 970 | rise terrain | 2.726e-2 | 0.561 | 0.045 | 0.046 | 0.427 | 0.055 | 0.056 | 0.518 | 0.026 | 0.026 | 8 |
| 971 | rise terrain | 2.844e-2 | 0.606 | 0.045 | 0.045 | 0.482 | 0.055 | 0.056 | 0.545 | 0.026 | 0.027 | 8 |
| 972 | rise terrain | 2.977e-2 | 0.651 | 0.045 | 0.045 | 0.538 | 0.056 | 0.056 | 0.572 | 0.027 | 0.028 | 8 |
| 973 | rise terrain | 3.126e-2 | 0.696 | 0.045 | 0.045 | 0.594 | 0.056 | 0.056 | 0.600 | 0.028 | 0.029 | 8 |
| 974 | rise terrain | 3.292e-2 | 0.741 | 0.045 | 0.045 | 0.650 | 0.056 | 0.057 | 0.628 | 0.029 | 0.030 | 8 |
| 975 | rise terrain | 3.479e-2 | 0.785 | 0.045 | 0.045 | 0.706 | 0.057 | 0.057 | 0.659 | 0.030 | 0.031 | 8 |
| 976 | rise terrain | 3.687e-2 | 0.830 | 0.045 | 0.045 | 0.763 | 0.057 | 0.058 | 0.690 | 0.032 | 0.033 | 8 |
| 977 T | rise terrain | 3.920e-2 | 0.875 | 0.045 | 0.046 | 0.821 | 0.057 | 0.058 | 0.723 | 0.033 | 0.034 | 8 |
| 978 | rise orbit | 4.182e-2 | 0.921 | 0.045 | 0.046 | 0.878 | 0.058 | 0.058 | 0.758 | 0.035 | 0.036 | 8 |
| 979 | rise orbit | 4.475e-2 | 0.966 | 0.046 | 0.046 | 0.936 | 0.058 | 0.059 | 0.795 | 0.037 | 0.038 | 8 |
| 980 | rise orbit | 4.804e-2 | 1.013 | 0.046 | 0.047 | 0.995 | 0.058 | 0.059 | 0.834 | 0.039 | 0.041 | 8 |
| 981 | rise orbit | 5.174e-2 | 1.059 | 0.047 | 0.047 | 1.054 | 0.059 | 0.060 | 0.876 | 0.041 | 0.043 | 8 |
| 982 | rise orbit | 5.592e-2 | 1.107 | 0.047 | 0.048 | 1.113 | 0.059 | 0.060 | 0.919 | 0.044 | 0.045 | 8 |
| 983 | rise orbit | 6.063e-2 | 1.155 | 0.048 | 0.049 | 1.173 | 0.060 | 0.060 | 0.966 | 0.046 | 0.048 | 8 |
| 984 | rise orbit | 6.597e-2 | 1.204 | 0.049 | 0.050 | 1.233 | 0.060 | 0.061 | 1.015 | 0.049 | 0.050 | 8 |
| 985 | rise orbit | 7.203e-2 | 1.253 | 0.050 | 0.050 | 1.293 | 0.060 | 0.061 | 1.066 | 0.052 | 0.053 | 8 |
| 986 | rise orbit | 7.892e-2 | 1.304 | 0.050 | 0.051 | 1.354 | 0.061 | 0.061 | 1.120 | 0.054 | 0.056 | 8 |
| 987 | rise orbit | 8.678e-2 | 1.355 | 0.051 | 0.052 | 1.415 | 0.061 | 0.062 | 1.177 | 0.057 | 0.058 | 8 |
| 988 | rise orbit | 9.577e-2 | 1.407 | 0.052 | 0.053 | 1.477 | 0.061 | 0.062 | 1.236 | 0.059 | 0.060 | 8 |
| 989 | rise orbit | 1.061e-1 | 1.460 | 0.053 | 0.054 | 1.538 | 0.062 | 0.062 | 1.298 | 0.062 | 0.063 | 8 |
| 990 | rise orbit | 1.180e-1 | 1.514 | 0.054 | 0.055 | 1.600 | 0.062 | 0.062 | 1.362 | 0.064 | 0.065 | 8 |
| 991 | rise orbit | 1.317e-1 | 1.568 | 0.055 | 0.055 | 1.662 | 0.062 | 0.063 | 1.429 | 0.066 | 0.067 | 8 |
| 992 | rise orbit | 1.475e-1 | 1.624 | 0.055 | 0.056 | 1.724 | 0.062 | 0.063 | 1.497 | 0.069 | 0.069 | 8 |
| 993 | rise orbit | 1.660e-1 | 1.680 | 0.056 | 0.057 | 1.787 | 0.062 | 0.063 | 1.568 | 0.071 | 0.071 | 8 |
| 994 | rise orbit | 1.875e-1 | 1.737 | 0.057 | 0.057 | 1.849 | 0.062 | 0.063 | 1.640 | 0.073 | 0.073 | 8 |
| 995 | rise orbit | 2.126e-1 | 1.793 | 0.056 | 0.056 | 1.909 | 0.061 | 0.061 | 1.714 | 0.073 | 0.072 | 8 |
| 996 | rise orbit | 2.418e-1 | 1.839 | 0.046 | 0.045 | 1.958 | 0.049 | 0.047 | 1.779 | 0.065 | 0.063 | 8 |
| 997 | rise orbit | 2.757e-1 | 1.872 | 0.033 | 0.031 | 1.992 | 0.033 | 0.032 | 1.832 | 0.053 | 0.050 | 8 |
| 998 | rise orbit | 3.148e-1 | 1.891 | 0.019 | 0.017 | 2.009 | 0.018 | 0.016 | 1.871 | 0.039 | 0.037 | 8 |
| 999 | rise orbit | 3.596e-1 | 1.896 | 0.005 | 0.005 | 2.011 | 0.001 | 0.009 | 1.896 | 0.025 | 0.022 | 8 |
| 1000 | rise orbit | 4.104e-1 | 1.885 | 0.011 | 0.021 | 1.995 | 0.016 | 0.027 | 1.905 | 0.008 | 0.006 | 8 |
| 1001 | rise orbit | 4.674e-1 | 1.858 | 0.027 | 0.037 | 1.962 | 0.033 | 0.044 | 1.895 | 0.009 | 0.020 | 8 |
| 1002 | rise orbit | 5.309e-1 | 1.815 | 0.043 | 0.052 | 1.912 | 0.050 | 0.059 | 1.868 | 0.027 | 0.036 | 8 |
| 1003 | rise orbit | 6.006e-1 | 1.761 | 0.053 | 0.055 | 1.851 | 0.061 | 0.062 | 1.829 | 0.039 | 0.041 | 8 |
| 1004 | rise orbit | 6.769e-1 | 1.707 | 0.055 | 0.055 | 1.789 | 0.062 | 0.063 | 1.787 | 0.042 | 0.043 | 8 |
| 1005 | rise orbit | 7.600e-1 | 1.652 | 0.055 | 0.056 | 1.727 | 0.063 | 0.063 | 1.743 | 0.044 | 0.044 | 8 |
| 1006 | rise orbit | 8.500e-1 | 1.596 | 0.056 | 0.056 | 1.664 | 0.063 | 0.063 | 1.697 | 0.046 | 0.046 | 8 |
| 1007 | rise orbit | 9.469e-1 | 1.540 | 0.056 | 0.057 | 1.601 | 0.063 | 0.063 | 1.649 | 0.048 | 0.048 | 8 |
| 1008 | rise orbit | 1.051e+0 | 1.484 | 0.056 | 0.057 | 1.538 | 0.063 | 0.063 | 1.600 | 0.049 | 0.050 | 8 |
| 1009 | rise orbit | 1.161e+0 | 1.427 | 0.057 | 0.057 | 1.475 | 0.063 | 0.063 | 1.549 | 0.051 | 0.051 | 8 |
| 1010 | rise orbit | 1.278e+0 | 1.370 | 0.057 | 0.058 | 1.412 | 0.063 | 0.063 | 1.496 | 0.053 | 0.053 | 8 |
| 1011 | rise orbit | 1.401e+0 | 1.312 | 0.057 | 0.058 | 1.350 | 0.063 | 0.063 | 1.441 | 0.054 | 0.055 | 8 |
| 1012 | rise orbit | 1.530e+0 | 1.255 | 0.058 | 0.058 | 1.287 | 0.063 | 0.063 | 1.385 | 0.056 | 0.056 | 8 |
| 1013 | rise orbit | 1.664e+0 | 1.197 | 0.058 | 0.058 | 1.225 | 0.062 | 0.063 | 1.328 | 0.057 | 0.058 | 8 |
| 1014 | rise orbit | 1.802e+0 | 1.139 | 0.058 | 0.058 | 1.162 | 0.062 | 0.063 | 1.269 | 0.059 | 0.059 | 8 |
| 1015 | rise orbit | 1.944e+0 | 1.081 | 0.058 | 0.059 | 1.100 | 0.062 | 0.062 | 1.210 | 0.060 | 0.060 | 8 |
| 1016 | rise orbit | 2.089e+0 | 1.023 | 0.058 | 0.059 | 1.039 | 0.062 | 0.062 | 1.149 | 0.061 | 0.061 | 8 |
| 1017 | rise orbit | 2.235e+0 | 0.963 | 0.060 | 0.066 | 0.977 | 0.061 | 0.062 | 1.086 | 0.062 | 0.065 | 8 |
| 1018 | rise orbit | 2.379e+0 | 0.892 | 0.071 | 0.076 | 0.916 | 0.061 | 0.062 | 1.019 | 0.068 | 0.068 | 8 |
| 1019 | rise orbit | 2.519e+0 | 0.816 | 0.076 | 0.077 | 0.855 | 0.061 | 0.061 | 0.951 | 0.067 | 0.066 | 8 |
| 1020 | rise orbit | 2.654e+0 | 0.743 | 0.073 | 0.073 | 0.794 | 0.061 | 0.061 | 0.888 | 0.064 | 0.063 | 8 |
| 1021 | rise orbit | 2.783e+0 | 0.678 | 0.065 | 0.065 | 0.734 | 0.060 | 0.061 | 0.825 | 0.062 | 0.063 | 8 |
| 1022 | rise orbit | 2.906e+0 | 0.621 | 0.056 | 0.055 | 0.674 | 0.060 | 0.061 | 0.761 | 0.064 | 0.066 | 8 |
| 1023 | rise orbit | 3.026e+0 | 0.573 | 0.048 | 0.047 | 0.614 | 0.060 | 0.060 | 0.696 | 0.066 | 0.067 | 8 |
| 1024 | rise orbit | 3.140e+0 | 0.531 | 0.043 | 0.042 | 0.554 | 0.060 | 0.060 | 0.630 | 0.065 | 0.066 | 8 |
| 1025 | rise orbit | 3.250e+0 | 0.489 | 0.041 | 0.043 | 0.494 | 0.060 | 0.060 | 0.568 | 0.063 | 0.063 | 8 |
| 1026 | rise orbit | 3.353e+0 | 0.444 | 0.045 | 0.050 | 0.435 | 0.059 | 0.060 | 0.507 | 0.061 | 0.063 | 8 |
| 1027 | rise orbit | 3.446e+0 | 0.390 | 0.054 | 0.058 | 0.376 | 0.059 | 0.060 | 0.442 | 0.064 | 0.067 | 8 |
| 1028 | rise orbit | 3.527e+0 | 0.334 | 0.056 | 0.056 | 0.317 | 0.059 | 0.059 | 0.377 | 0.065 | 0.066 | 8 |
| 1029 | rise orbit | 3.598e+0 | 0.282 | 0.053 | 0.052 | 0.258 | 0.059 | 0.059 | 0.315 | 0.062 | 0.063 | 8 |
| 1030 | rise orbit | 3.657e+0 | 0.231 | 0.050 | 0.050 | 0.199 | 0.059 | 0.059 | 0.256 | 0.058 | 0.058 | 8 |
| 1031 | rise orbit | 3.704e+0 | 0.182 | 0.049 | 0.049 | 0.140 | 0.059 | 0.059 | 0.204 | 0.052 | 0.052 | 8 |
| 1032 | rise orbit | 3.739e+0 | 0.135 | 0.047 | 0.047 | 0.084 | 0.057 | 0.056 | 0.165 | 0.039 | 0.037 | 8 |
| 1033 | rise orbit | 3.765e+0 | 0.100 | 0.035 | 0.034 | 0.040 | 0.044 | 0.042 | 0.157 | 0.009 | 0.013 | 8 |
| 1034 last | rise orbit | 3.786e+0 | 0.079 | 0.021 | 0.020 | 0.012 | 0.028 | 0.026 | 0.174 | 0.017 | 0.018 | 8 |
| 1035 | travel orbit | 3.805e+0 | 0.070 | 0.009 | 0.007 | 0.001 | 0.011 | 0.008 | 0.184 | 0.010 | 0.009 | 8 |
| 1036 | travel orbit | 3.823e+0 | 0.068 | 0.002 | 0.001 | 0.002 | 0.000 | 0.000 | 0.182 | 0.002 | 0.006 | 8 |
| 1037 | travel orbit | 3.841e+0 | 0.066 | 0.002 | 0.002 | 0.002 | 0.000 | 0.000 | 0.170 | 0.013 | 0.023 | 8 |
| 1038 | travel orbit | 3.858e+0 | 0.064 | 0.002 | 0.002 | 0.002 | 0.000 | 0.000 | 0.187 | 0.018 | 0.246 * | 8 |
| 1039 | travel orbit | 3.875e+0 | 0.064 | 0.000 | 0.003 | 0.001 | 0.000 | 0.000 | 0.663 | 0.476 * | 0.878 * | 8 |
| 1040 | travel orbit | 3.894e+0 | 0.070 | 0.005 | 0.010 | 0.001 | 0.000 | 0.000 | 1.781 | 1.118 * | 1.588 * | 8 |
| 1041 | travel orbit | 3.917e+0 | 0.082 | 0.013 | 0.019 | 0.001 | 0.000 | 0.000 | 3.610 | 1.828 * | 2.305 * | 8 |
| 1042 | travel orbit | 3.946e+0 | 0.105 | 0.023 | 0.030 | 0.001 | 0.000 | 0.000 | 6.101 | 2.491 * | 2.877 * | 8 |
| 1043 | travel orbit | 3.984e+0 | 0.139 | 0.034 | 0.042 | 0.001 | 0.000 | 0.000 | 9.062 | 2.961 * | 3.178 * | 8 |
| 1044 | travel orbit | 4.036e+0 | 0.185 | 0.046 | 0.054 | 0.001 | 0.000 | 0.000 | 12.203 | 3.141 * | 3.210 * | 8 |
| 1045 | travel orbit | 4.106e+0 | 0.243 | 0.058 | 0.065 | 0.001 | 0.000 | 0.000 | 15.242 | 3.039 * | 3.073 * | 8 |
| 1046 | travel orbit | 4.196e+0 | 0.311 | 0.069 | 0.075 | 0.001 | 0.000 | 0.000 | 18.015 | 2.773 * | 2.789 * | 8 |

## pictures

Tier draft, rate 2, 28.17 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

The dive is joined from 2 parts: /home/user/workspace/work/p6/sm52/01/mercury-dive-p1of2 (capture frames 1356 to 1469, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm52/02/mercury-dive-p2of2 (capture frames 1470 to 1583, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

The rise is joined from 2 parts: /home/user/workspace/work/p6/sm52/03/mercury-rise-p1of2 (capture frames 1896 to 1994, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/sm52/04/mercury-rise-p2of2 (capture frames 1995 to 2093, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

### dive (mercury.dive, frames 690 to 779, window 678 to 791, 228 draft frames at rate 2)

Largest level step: 0.13 at frame 739 + 1/2 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.04 from frame 741 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 3.84 from frame 721 + 1/2 to the next, block column 5 row 7 from the top left, shown, not judged.
Largest change in place: 48.0 from frame 718 + 1/2 to 8 film frames later, most at pixel 1052, 580 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 1.13 from frame 717 to 8 film frames later, most at pixel 728, 844, band 14.0 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 780 to 791 + 1/2): change 3.9, pattern 0.03.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 741 in /home/user/workspace/work/p6/sm52/02/mercury-dive-p2of2-pops.png, frame 741 + 1/2 in /home/user/workspace/work/p6/sm52/02/mercury-dive-p2of2-pops.png, frame 742 in /home/user/workspace/work/p6/sm52/02/mercury-dive-p2of2-pops.png, frame 760 + 1/2 in /home/user/workspace/work/p6/sm52/02/mercury-dive-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 704 in /home/user/workspace/work/p6/sm52/01/mercury-dive-p1of2-changes.png, frame 717 in /home/user/workspace/work/p6/sm52/01/mercury-dive-p1of2-changes.png, frame 729 in /home/user/workspace/work/p6/sm52/01/mercury-dive-p1of2-changes.png, frame 757 in /home/user/workspace/work/p6/sm52/02/mercury-dive-p2of2-changes.png.

- RED the pattern of the picture changes in place by 1.13 from frame 717 to 8 film frames later, band 14.0 px, limit 0.45 (21 frames over it, first 712 + 1/2)

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 678 | 63.18 |  | 0.7 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.001 | 1.17 | 4,8 | 0.8 | 1.0 | 0.30 | 0.01 | 0.24 | 8.0 |
| 678 + 1/2 | 63.14 | 0.00 | 0.7 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.012 | 1.13 | 12,5 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 679 | 63.09 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.009 | 1.11 | 15,7 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 679 + 1/2 | 63.05 | 0.00 | 0.7 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.009 | 1.18 | 4,0 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 680 | 63.01 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 8,0 | 0.8 | 0.9 | 0.31 | 0.01 | 0.24 | 8.0 |
| 680 + 1/2 | 62.97 | 0.00 | 0.7 | 0.60 | 0.61 | 1.00 | 1.00 | 1.00 | 0.003 | 1.15 | 0,2 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 681 | 62.92 | 0.00 | 0.7 | 0.60 | 0.61 | 1.00 | 0.99 | 0.99 | 0.012 | 1.17 | 3,6 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 681 + 1/2 | 62.88 | 0.00 | 0.7 | 0.60 | 0.61 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 4,0 | 0.8 | 0.9 | 0.31 | 0.01 | 0.24 | 8.0 |
| 682 | 62.84 | 0.00 | 0.7 | 0.61 | 0.61 | 1.01 | 1.01 | 1.01 | 0.000 | 1.12 | 1,5 | 0.8 | 0.8 | 0.31 | 0.01 | 0.24 | 8.0 |
| 682 + 1/2 | 62.80 | 0.00 | 0.8 | 0.60 | 0.61 | 1.00 | 0.99 | 0.99 | 0.009 | 1.15 | 4,8 | 0.8 | 0.9 | 0.31 | 0.01 | 0.24 | 8.0 |
| 683 | 62.75 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.003 | 1.16 | 3,6 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 683 + 1/2 | 62.71 | 0.00 | 0.8 | 0.60 | 0.61 | 0.99 | 1.00 | 0.99 | 0.000 | 1.23 | 3,6 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 684 | 62.67 | 0.00 | 0.7 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.004 | 1.11 | 15,6 | 0.8 | 1.1 | 0.30 | 0.00 | 0.24 | 8.0 |
| 684 + 1/2 | 62.63 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.002 | 1.16 | 1,7 | 0.8 | 1.3 | 0.30 | 0.00 | 0.24 | 8.0 |
| 685 | 62.58 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.014 | 1.13 | 4,8 | 0.8 | 1.5 | 0.30 | 0.00 | 0.24 | 8.0 |
| 685 + 1/2 | 62.54 | 0.00 | 0.8 | 0.60 | 0.61 | 1.00 | 1.00 | 1.00 | 0.001 | 1.14 | 3,6 | 0.9 | 1.7 | 0.30 | 0.00 | 0.24 | 8.0 |
| 686 | 62.50 | 0.00 | 0.7 | 0.60 | 0.61 | 0.99 | 0.99 | 0.99 | 0.001 | 1.08 | 13,0 | 1.0 | 2.1 | 0.30 | 0.00 | 0.24 | 8.0 |
| 686 + 1/2 | 62.45 | 0.00 | 0.7 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.001 | 1.15 | 14,8 | 1.2 | 2.3 | 0.30 | 0.01 | 0.24 | 8.0 |
| 687 | 62.41 | 0.00 | 0.7 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.001 | 1.12 | 9,0 | 1.4 | 2.7 | 0.29 | 0.02 | 0.24 | 8.1 |
| 687 + 1/2 | 62.37 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.004 | 1.16 | 13,6 | 1.7 | 3.4 | 0.29 | 0.03 | 0.24 | 8.1 |
| 688 | 62.32 | 0.00 | 0.7 | 0.60 | 0.61 | 0.99 | 0.99 | 0.99 | 0.004 | 1.09 | 2,4 | 2.0 | 3.6 | 0.29 | 0.05 | 0.24 | 8.2 |
| 688 + 1/2 | 62.28 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 0.99 | 0.99 | 0.014 | 1.14 | 1,8 | 2.2 | 3.8 | 0.29 | 0.09 | 0.24 | 8.2 |
| 689 | 62.23 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.009 | 1.12 | 2,2 | 2.6 | 4.5 | 0.29 | 0.13 | 0.24 | 8.3 |
| 689 + 1/2 | 62.19 | 0.00 | 0.7 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.003 | 1.14 | 13,6 | 2.8 | 5.0 | 0.29 | 0.17 | 0.24 | 8.4 |
| 690 first | 62.14 | 0.00 | 0.8 | 0.61 | 0.61 | 0.99 | 0.99 | 0.99 | 0.000 | 1.19 | 5,8 | 3.0 | 5.2 | 0.29 | 0.24 | 0.24 | 8.4 |
| 690 + 1/2 | 62.10 | 0.00 | 0.8 | 0.62 | 0.62 | 0.99 | 0.99 | 0.99 | 0.013 | 1.07 | 7,8 | 3.3 | 6.0 | 0.29 | 0.31 | 0.24 | 8.6 |
| 691 | 62.07 | 0.01 | 0.7 | 0.63 | 0.64 | 0.99 | 0.99 | 0.99 | 0.009 | 1.15 | 5,1 | 3.6 | 6.2 | 0.28 | 0.36 | 0.24 | 8.6 |
| 691 + 1/2 | 62.05 | 0.01 | 0.6 | 0.66 | 0.67 | 0.99 | 0.99 | 0.99 | 0.017 | 1.43 | 5,1 | 3.8 | 6.1 | 0.28 | 0.40 | 0.24 | 8.8 |
| 692 | 62.06 | 0.02 | 0.7 | 0.70 | 0.72 | 0.98 | 0.97 | 0.97 | 0.020 | 1.82 | 5,1 | 3.8 | 6.5 | 0.29 | 0.39 | 0.24 | 8.9 |
| 692 + 1/2 | 62.10 | 0.02 | 0.8 | 0.78 | 0.80 | 0.98 | 0.98 | 0.98 | 0.001 | 2.15 | 5,1 | 4.0 | 6.6 | 0.29 | 0.36 | 0.23 | 9.2 |
| 693 | 62.17 | 0.01 | 0.9 | 0.89 | 0.89 | 1.00 | 1.00 | 1.00 | 0.004 | 2.00 | 5,1 | 4.1 | 6.3 | 0.29 | 0.29 | 0.23 | 9.4 |
| 693 + 1/2 | 62.26 | 0.02 | 1.2 | 1.01 | 1.00 | 1.01 | 1.01 | 1.01 | 0.001 | 1.95 | 5,1 | 4.1 | 6.3 | 0.29 | 0.23 | 0.23 | 9.6 |
| 694 | 62.39 | 0.01 | 1.4 | 1.11 | 1.10 | 1.01 | 1.01 | 1.01 | 0.001 | 1.86 | 5,1 | 4.1 | 6.1 | 0.28 | 0.21 | 0.23 | 9.8 |
| 694 + 1/2 | 62.55 | 0.01 | 1.7 | 1.19 | 1.18 | 1.01 | 1.01 | 1.01 | 0.009 | 1.76 | 5,1 | 4.4 | 6.1 | 0.28 | 0.19 | 0.23 | 10.0 |
| 695 | 62.73 | 0.01 | 1.9 | 1.24 | 1.24 | 1.00 | 1.00 | 1.00 | 0.007 | 1.61 | 9,3 | 4.5 | 6.2 | 0.29 | 0.17 | 0.23 | 10.3 |
| 695 + 1/2 | 62.93 | 0.01 | 2.2 | 1.30 | 1.27 | 1.02 | 1.03 | 1.02 | 0.011 | 1.62 | 9,3 | 4.7 | 6.6 | 0.28 | 0.11 | 0.22 | 8.5 |
| 696 | 63.16 | 0.01 | 2.6 | 1.31 | 1.30 | 1.01 | 1.02 | 1.01 | 0.020 | 1.62 | 15,4 | 4.7 | 6.3 | 0.28 | 0.11 | 0.22 | 8.6 |
| 696 + 1/2 | 63.41 | 0.01 | 2.7 | 1.32 | 1.30 | 1.02 | 1.02 | 1.02 | 0.010 | 1.63 | 13,5 | 4.9 | 6.5 | 0.28 | 0.11 | 0.22 | 8.8 |
| 697 | 63.70 | 0.01 | 3.0 | 1.32 | 1.30 | 1.02 | 1.01 | 1.01 | 0.023 | 1.63 | 14,6 | 5.1 | 6.8 | 0.27 | 0.16 | 0.02 | 8.0 |
| 697 + 1/2 | 64.00 | 0.01 | 3.3 | 1.30 | 1.32 | 0.98 | 0.99 | 0.98 | 0.007 | 1.60 | 12,5 | 5.3 | 7.0 | 0.27 | 0.14 | 0.04 | 8.0 |
| 698 | 64.31 | 0.01 | 3.5 | 1.30 | 1.32 | 0.98 | 0.98 | 0.98 | 0.013 | 1.81 | 12,6 | 5.4 | 7.6 | 0.27 | 0.15 | 0.22 | 9.1 |
| 698 + 1/2 | 64.65 | 0.01 | 3.8 | 1.30 | 1.33 | 0.98 | 0.98 | 0.98 | 0.018 | 1.67 | 12,6 | 5.5 | 9.1 | 0.27 | 0.17 | 0.23 | 9.3 |
| 699 | 65.01 | 0.01 | 4.0 | 1.33 | 1.34 | 1.00 | 0.98 | 0.98 | 0.022 | 1.78 | 12,6 | 5.2 | 8.3 | 0.27 | 0.17 | 0.22 | 9.6 |
| 699 + 1/2 | 65.39 | 0.01 | 4.3 | 1.35 | 1.37 | 0.99 | 1.00 | 0.99 | 0.008 | 1.49 | 15,0 | 5.0 | 6.9 | 0.27 | 0.24 | 0.14 | 8.0 |
| 700 | 65.77 | 0.01 | 4.7 | 1.40 | 1.39 | 1.01 | 1.01 | 1.01 | 0.026 | 1.65 | 1,4 | 5.1 | 7.7 | 0.27 | 0.24 | 0.17 | 8.0 |
| 700 + 1/2 | 66.17 | 0.01 | 4.8 | 1.42 | 1.43 | 0.99 | 1.00 | 0.99 | 0.020 | 1.80 | 2,7 | 5.6 | 8.5 | 0.27 | 0.27 | 0.19 | 8.0 |
| 701 | 66.59 | 0.00 | 5.3 | 1.46 | 1.44 | 1.02 | 1.01 | 1.01 | 0.014 | 2.01 | 2,7 | 5.9 | 10.1 | 0.27 | 0.32 | 0.22 | 8.0 |
| 701 + 1/2 | 67.02 | 0.02 | 5.5 | 1.46 | 1.46 | 1.00 | 1.00 | 1.00 | 0.035 | 2.06 | 2,7 | 6.2 | 12.3 | 0.27 | 0.33 | 0.23 | 8.0 |
| 702 | 67.41 | 0.02 | 5.7 | 1.47 | 1.46 | 1.00 | 1.01 | 1.00 | 0.028 | 2.10 | 2,7 | 6.5 | 11.2 | 0.27 | 0.36 | 0.25 | 8.0 |
| 702 + 1/2 | 67.77 | 0.01 | 6.3 | 1.47 | 1.47 | 1.00 | 1.00 | 1.00 | 0.028 | 2.32 | 2,7 | 7.1 | 10.5 | 0.27 | 0.40 | 0.26 | 8.0 |
| 703 | 68.10 | 0.02 | 6.4 | 1.47 | 1.47 | 1.00 | 1.01 | 1.00 | 0.029 | 2.39 | 2,7 | 7.6 | 10.5 | 0.28 | 0.41 | 0.27 | 8.0 |
| 703 + 1/2 | 68.40 | 0.01 | 6.8 | 1.47 | 1.47 | 1.00 | 1.00 | 1.00 | 0.037 | 2.30 | 2,7 | 7.9 | 11.8 | 0.28 | 0.43 | 0.29 | 8.0 |
| 704 | 68.69 | 0.01 | 6.9 | 1.45 | 1.47 | 0.99 | 0.99 | 0.99 | 0.049 | 2.14 | 2,7 | 8.6 | 12.1 | 0.28 | 0.448 | 0.30 | 8.0 |
| 704 + 1/2 | 68.95 | 0.01 | 7.6 | 1.48 | 1.47 | 1.00 | 1.01 | 1.00 | 0.029 | 1.94 | 11,0 | 9.1 | 12.2 | 0.29 | 0.44 | 0.31 | 8.0 |
| 705 | 69.20 | 0.01 | 7.7 | 1.48 | 1.48 | 1.00 | 0.99 | 0.99 | 0.040 | 1.96 | 11,0 | 9.8 | 13.1 | 0.29 | 0.42 | 0.32 | 8.0 |
| 705 + 1/2 | 69.42 | 0.01 | 8.0 | 1.49 | 1.48 | 1.01 | 1.01 | 1.01 | 0.028 | 1.81 | 11,0 | 10.1 | 13.3 | 0.28 | 0.44 | 0.24 | 11.2 |
| 706 | 69.63 | 0.01 | 8.6 | 1.47 | 1.48 | 0.99 | 0.99 | 0.99 | 0.043 | 1.62 | 11,0 | 10.6 | 14.6 | 0.28 | 0.44 | 0.24 | 11.2 |
| 706 + 1/2 | 69.82 | 0.01 | 9.0 | 1.48 | 1.49 | 1.00 | 0.99 | 0.99 | 0.053 | 1.87 | 2,8 | 11.3 | 16.6 | 0.28 | 0.41 | 0.24 | 11.3 |
| 707 | 69.98 | 0.02 | 9.4 | 1.49 | 1.50 | 1.00 | 0.99 | 0.99 | 0.043 | 1.72 | 0,5 | 12.0 | 18.3 | 0.29 | 0.43 | 0.24 | 11.3 |
| 707 + 1/2 | 70.11 | 0.02 | 9.7 | 1.51 | 1.51 | 1.00 | 1.00 | 1.00 | 0.045 | 1.72 | 13,3 | 12.7 | 19.8 | 0.28 | 0.38 | 0.24 | 11.4 |
| 708 | 70.21 | 0.03 | 10.0 | 1.53 | 1.52 | 1.01 | 1.01 | 1.01 | 0.036 | 2.08 | 13,3 | 12.9 | 21.2 | 0.29 | 0.38 | 0.24 | 11.5 |
| 708 + 1/2 | 70.26 | 0.02 | 10.3 | 1.54 | 1.54 | 1.00 | 1.00 | 1.00 | 0.047 | 2.03 | 13,3 | 13.4 | 21.3 | 0.28 | 0.34 | 0.24 | 11.5 |
| 709 | 70.26 | 0.01 | 10.7 | 1.55 | 1.55 | 1.00 | 1.00 | 1.00 | 0.052 | 2.01 | 13,3 | 13.9 | 21.4 | 0.28 | 0.35 | 0.24 | 11.6 |
| 709 + 1/2 | 70.24 | 0.02 | 11.2 | 1.56 | 1.56 | 1.00 | 1.00 | 1.00 | 0.055 | 1.99 | 13,3 | 14.4 | 21.5 | 0.28 | 0.29 | 0.24 | 11.7 |
| 710 | 70.19 | 0.04 | 11.6 | 1.56 | 1.57 | 0.99 | 1.00 | 0.99 | 0.039 | 2.00 | 10,0 | 14.9 | 21.6 | 0.28 | 0.28 | 0.24 | 11.8 |
| 710 + 1/2 | 70.07 | 0.04 | 12.0 | 1.58 | 1.58 | 1.00 | 1.00 | 1.00 | 0.047 | 2.26 | 10,0 | 15.3 | 21.7 | 0.28 | 0.27 | 0.24 | 11.4 |
| 711 | 69.87 | 0.03 | 12.2 | 1.60 | 1.59 | 1.00 | 1.00 | 1.00 | 0.051 | 1.47 | 15,2 | 15.7 | 21.9 | 0.28 | 0.25 | 0.42 | 8.0 |
| 711 + 1/2 | 69.63 | 0.04 | 12.8 | 1.60 | 1.61 | 0.99 | 0.99 | 0.99 | 0.053 | 1.82 | 0,8 | 16.1 | 22.5 | 0.29 | 0.28 | 0.24 | 11.4 |
| 712 | 69.30 | 0.04 | 13.2 | 1.63 | 1.64 | 0.99 | 0.98 | 0.98 | 0.058 | 1.50 | 15,2 | 17.9 | 23.6 | 0.29 | 0.36 | 0.24 | 11.5 |
| 712 + 1/2 | 68.88 | 0.06 | 13.7 | 1.69 | 1.66 | 1.02 | 1.03 | 1.02 | 0.059 | 1.47 | 15,2 | 20.0 | 26.0 | 0.29 | 0.48 | 0.24 | 11.6 |
| 713 | 68.34 | 0.06 | 13.7 | 1.68 | 1.72 | 0.98 | 0.98 | 0.98 | 0.058 | 1.49 | 15,2 | 22.4 | 30.8 | 0.29 | 0.53 | 0.24 | 11.6 |
| 713 + 1/2 | 67.67 | 0.05 | 14.2 | 1.75 | 1.74 | 1.01 | 1.01 | 1.01 | 0.047 | 1.56 | 14,1 | 25.1 | 35.5 | 0.29 | 0.60 | 0.25 | 11.8 |
| 714 | 66.91 | 0.03 | 15.0 | 1.79 | 1.80 | 1.00 | 0.98 | 0.98 | 0.032 | 1.58 | 14,1 | 28.3 | 40.7 | 0.30 | 0.64 | 0.25 | 11.8 |
| 714 + 1/2 | 66.08 | 0.05 | 14.7 | 1.85 | 1.86 | 1.00 | 1.01 | 1.00 | 0.025 | 1.56 | 12,2 | 31.6 | 44.5 | 0.30 | 0.69 | 0.25 | 11.9 |
| 715 | 65.16 | 0.04 | 15.3 | 1.92 | 1.90 | 1.01 | 1.01 | 1.01 | 0.038 | 1.85 | 15,1 | 34.2 | 49.2 | 0.30 | 0.76 | 0.25 | 13.7 |
| 715 + 1/2 | 64.15 | 0.06 | 15.5 | 1.95 | 1.98 | 0.99 | 0.98 | 0.98 | 0.023 | 1.86 | 15,1 | 36.7 | 52.5 | 0.30 | 0.83 | 0.25 | 13.9 |
| 716 | 63.03 | 0.04 | 15.9 | 2.04 | 2.01 | 1.01 | 1.01 | 1.01 | 0.048 | 1.84 | 15,0 | 39.3 | 55.6 | 0.30 | 1.01 | 0.26 | 14.1 |
| 716 + 1/2 | 61.82 | 0.01 | 16.0 | 2.07 | 2.08 | 0.99 | 0.99 | 0.99 | 0.054 | 2.39 | 15,0 | 41.5 | 58.3 | 0.30 | 1.12 | 0.26 | 14.3 |
| 717 | 60.59 | 0.01 | 16.5 | 2.12 | 2.12 | 1.00 | 1.00 | 1.00 | 0.023 | 2.32 | 15,0 | 43.5 | 60.9 | 0.29 | 1.13 | 0.26 | 14.0 |
| 717 + 1/2 | 59.33 | 0.01 | 16.9 | 2.18 | 2.17 | 1.01 | 1.01 | 1.01 | 0.036 | 2.00 | 15,0 | 45.4 | 62.9 | 0.28 | 1.08 | 0.26 | 14.0 |
| 718 | 58.05 | 0.04 | 16.7 | 2.21 | 2.21 | 1.00 | 1.00 | 1.00 | 0.058 | 1.68 | 6,7 | 47.2 | 64.4 | 0.28 | 1.00 | 0.26 | 14.2 |
| 718 + 1/2 | 56.86 | 0.04 | 17.0 | 2.25 | 2.26 | 0.99 | 0.99 | 0.99 | 0.043 | 1.97 | 5,6 | 48.0 | 65.6 | 0.28 | 0.89 | 0.26 | 14.6 |
| 719 | 55.76 | 0.03 | 17.4 | 2.31 | 2.29 | 1.01 | 1.01 | 1.01 | 0.027 | 2.63 | 6,7 | 47.8 | 64.1 | 0.28 | 0.77 | 0.26 | 14.8 |
| 719 + 1/2 | 54.71 | 0.02 | 17.5 | 2.33 | 2.35 | 0.99 | 0.99 | 0.99 | 0.040 | 2.77 | 6,7 | 46.0 | 60.8 | 0.28 | 0.66 | 0.60 | 8.0 |
| 720 | 53.71 | 0.05 | 18.1 | 2.39 | 2.37 | 1.01 | 1.01 | 1.01 | 0.044 | 2.87 | 6,7 | 43.0 | 56.6 | 0.28 | 0.59 | 0.61 | 8.0 |
| 720 + 1/2 | 52.80 | 0.04 | 18.6 | 2.41 | 2.42 | 1.00 | 1.00 | 1.00 | 0.039 | 3.15 | 5,7 | 39.4 | 51.1 | 0.27 | 0.50 | 0.62 | 8.0 |
| 721 | 51.96 | 0.05 | 18.3 | 2.46 | 2.44 | 1.01 | 1.01 | 1.01 | 0.058 | 3.81 | 5,7 | 35.5 | 45.6 | 0.27 | 0.50 | 0.27 | 8.8 |
| 721 + 1/2 | 51.22 | 0.01 | 18.9 | 2.46 | 2.49 | 0.99 | 0.99 | 0.99 | 0.094 | 3.84 | 5,7 | 31.3 | 39.5 | 0.27 | 0.53 | 0.27 | 8.1 |
| 722 | 50.50 | 0.06 | 18.8 | 2.51 | 2.50 | 1.00 | 1.00 | 1.00 | 0.080 | 3.63 | 5,7 | 29.1 | 33.8 | 0.27 | 0.53 | 0.27 | 8.4 |
| 722 + 1/2 | 49.90 | 0.05 | 19.1 | 2.54 | 2.54 | 1.00 | 1.00 | 1.00 | 0.092 | 3.05 | 5,7 | 27.5 | 33.5 | 0.27 | 0.53 | 0.27 | 8.4 |
| 723 | 49.40 | 0.03 | 19.7 | 2.58 | 2.56 | 1.01 | 1.01 | 1.01 | 0.060 | 2.59 | 6,8 | 27.5 | 34.2 | 0.27 | 0.44 | 0.27 | 8.4 |
| 723 + 1/2 | 48.96 | 0.06 | 19.5 | 2.58 | 2.59 | 1.00 | 1.00 | 1.00 | 0.084 | 2.21 | 5,8 | 28.5 | 33.0 | 0.27 | 0.39 | 0.27 | 8.6 |
| 724 | 48.65 | 0.05 | 19.8 | 2.65 | 2.60 | 1.02 | 1.01 | 1.01 | 0.110 | 2.23 | 5,1 | 29.4 | 31.3 | 0.27 | 0.38 | 0.27 | 8.4 |
| 724 + 1/2 | 48.43 | 0.01 | 20.7 | 2.61 | 2.66 | 0.98 | 0.99 | 0.98 | 0.132 | 2.24 | 0,3 | 30.0 | 32.1 | 0.27 | 0.35 | 0.27 | 8.6 |
| 725 | 48.23 | 0.04 | 20.5 | 2.68 | 2.66 | 1.01 | 1.01 | 1.01 | 0.130 | 2.25 | 2,1 | 31.1 | 33.1 | 0.27 | 0.29 | 0.27 | 8.8 |
| 725 + 1/2 | 48.10 | 0.02 | 20.8 | 2.67 | 2.69 | 0.99 | 1.01 | 0.99 | 0.112 | 2.45 | 0,3 | 32.0 | 34.1 | 0.27 | 0.27 | 0.27 | 8.7 |
| 726 | 47.92 | 0.07 | 21.0 | 2.69 | 2.72 | 0.99 | 0.98 | 0.98 | 0.162 | 2.22 | 2,1 | 32.4 | 35.7 | 0.27 | 0.27 | 0.27 | 8.5 |
| 726 + 1/2 | 47.88 | 0.06 | 20.7 | 2.76 | 2.74 | 1.01 | 1.01 | 1.01 | 0.136 | 2.29 | 0,1 | 32.9 | 35.2 | 0.27 | 0.25 | 0.27 | 8.4 |
| 727 | 47.96 | 0.06 | 21.3 | 2.79 | 2.79 | 1.00 | 0.99 | 0.99 | 0.133 | 2.30 | 4,0 | 33.1 | 36.3 | 0.27 | 0.26 | 0.27 | 8.0 |
| 727 + 1/2 | 48.16 | 0.02 | 21.1 | 2.82 | 2.81 | 1.00 | 1.01 | 1.00 | 0.107 | 2.24 | 0,6 | 33.4 | 34.7 | 0.27 | 0.30 | 0.27 | 8.0 |
| 728 | 48.39 | 0.01 | 20.5 | 2.88 | 2.82 | 1.02 | 1.01 | 1.01 | 0.159 | 2.13 | 0,0 | 33.6 | 35.1 | 0.27 | 0.32 | 0.27 | 8.0 |
| 728 + 1/2 | 48.64 | 0.03 | 21.3 | 2.83 | 2.85 | 0.99 | 1.01 | 0.99 | 0.097 | 2.03 | 1,8 | 34.1 | 37.7 | 0.27 | 0.31 | 0.27 | 8.0 |
| 729 | 48.83 | 0.02 | 21.1 | 2.85 | 2.86 | 1.00 | 1.00 | 1.00 | 0.131 | 1.93 | 1,7 | 34.6 | 37.0 | 0.28 | 0.30 | 0.27 | 8.0 |
| 729 + 1/2 | 49.07 | 0.08 | 21.2 | 2.85 | 2.88 | 0.99 | 0.98 | 0.98 | 0.164 | 1.95 | 1,8 | 34.4 | 37.0 | 0.28 | 0.31 | 0.28 | 8.0 |
| 730 | 49.46 | 0.02 | 21.3 | 2.88 | 2.89 | 0.99 | 0.99 | 0.99 | 0.208 | 1.74 | 1,8 | 33.8 | 36.2 | 0.28 | 0.28 | 0.28 | 8.0 |
| 730 + 1/2 | 49.88 | 0.04 | 20.9 | 2.91 | 2.91 | 1.00 | 0.99 | 0.99 | 0.227 | 1.72 | 0,1 | 33.5 | 35.9 | 0.29 | 0.23 | 0.28 | 8.0 |
| 731 | 50.39 | 0.01 | 21.4 | 2.95 | 2.93 | 1.01 | 1.01 | 1.01 | 0.187 | 1.63 | 0,1 | 33.3 | 35.6 | 0.29 | 0.23 | 0.29 | 8.0 |
| 731 + 1/2 | 50.92 | 0.06 | 21.6 | 2.95 | 2.97 | 0.99 | 0.99 | 0.99 | 0.134 | 1.67 | 0,1 | 32.6 | 35.7 | 0.30 | 0.23 | 0.29 | 8.0 |
| 732 | 51.58 | 0.02 | 21.9 | 3.00 | 2.99 | 1.00 | 1.01 | 1.00 | 0.176 | 1.95 | 0,1 | 31.6 | 34.8 | 0.30 | 0.27 | 0.30 | 8.0 |
| 732 + 1/2 | 52.21 | 0.01 | 21.9 | 3.03 | 3.03 | 1.00 | 0.99 | 0.99 | 0.206 | 1.81 | 12,8 | 30.1 | 33.5 | 0.31 | 0.30 | 0.30 | 8.0 |
| 733 | 52.81 | 0.04 | 20.9 | 3.07 | 3.06 | 1.00 | 1.00 | 1.00 | 0.178 | 1.74 | 12,8 | 28.8 | 33.4 | 0.31 | 0.29 | 0.31 | 8.0 |
| 733 + 1/2 | 53.49 | 0.02 | 20.9 | 3.10 | 3.12 | 0.99 | 0.99 | 0.99 | 0.204 | 1.56 | 12,5 | 26.7 | 32.2 | 0.32 | 0.30 | 0.31 | 8.0 |
| 734 | 54.22 | 0.04 | 20.9 | 3.18 | 3.15 | 1.01 | 1.01 | 1.01 | 0.193 | 1.75 | 13,8 | 25.0 | 30.4 | 0.32 | 0.29 | 0.32 | 8.0 |
| 734 + 1/2 | 54.86 | 0.07 | 22.2 | 3.21 | 3.20 | 1.00 | 1.01 | 1.00 | 0.144 | 2.27 | 13,8 | 21.9 | 30.0 | 0.33 | 0.32 | 0.33 | 8.0 |
| 735 | 55.37 | 0.00 | 20.7 | 3.23 | 3.25 | 0.99 | 0.99 | 0.99 | 0.179 | 2.23 | 13,8 | 18.4 | 29.9 | 0.33 | 0.32 | 0.33 | 8.0 |
| 735 + 1/2 | 55.88 | 0.01 | 21.8 | 3.29 | 3.27 | 1.01 | 1.01 | 1.01 | 0.184 | 2.64 | 13,8 | 16.8 | 29.6 | 0.34 | 0.29 | 0.34 | 8.0 |
| 736 | 56.41 | 0.03 | 20.9 | 3.31 | 3.32 | 1.00 | 1.00 | 1.00 | 0.172 | 2.49 | 13,8 | 15.9 | 27.0 | 0.35 | 0.28 | 0.34 | 8.0 |
| 736 + 1/2 | 56.88 | 0.01 | 21.1 | 3.35 | 3.34 | 1.00 | 0.99 | 0.99 | 0.189 | 2.34 | 13,8 | 14.6 | 22.7 | 0.35 | 0.27 | 0.35 | 8.0 |
| 737 | 57.33 | 0.07 | 21.5 | 3.37 | 3.38 | 1.00 | 1.01 | 1.00 | 0.147 | 1.92 | 13,8 | 13.5 | 22.0 | 0.36 | 0.22 | 0.35 | 8.8 |
| 737 + 1/2 | 57.64 | 0.01 | 20.9 | 3.40 | 3.39 | 1.00 | 1.00 | 1.00 | 0.168 | 1.75 | 13,8 | 12.8 | 23.8 | 0.36 | 0.18 | 0.36 | 8.0 |
| 738 | 57.96 | 0.02 | 19.7 | 3.46 | 3.41 | 1.02 | 1.00 | 1.00 | 0.163 | 1.91 | 14,8 | 11.9 | 29.3 | 0.37 | 0.15 | 0.36 | 8.0 |
| 738 + 1/2 | 58.24 | 0.07 | 21.0 | 3.48 | 3.43 | 1.01 | 1.00 | 1.00 | 0.081 | 2.22 | 14,8 | 10.3 | 24.9 | 0.37 | 0.13 | 0.37 | 8.0 |
| 739 | 58.38 | 0.02 | 20.6 | 3.50 | 3.45 | 1.01 | 1.00 | 1.00 | 0.091 | 2.30 | 14,8 | 9.7 | 21.8 | 0.38 | 0.12 | 0.37 | 8.0 |
| 739 + 1/2 | 58.56 | 0.13 | 20.1 | 3.49 | 3.45 | 1.01 | 1.01 | 1.01 | 0.080 | 2.15 | 14,8 | 9.5 | 20.5 | 0.38 | 0.10 | 0.38 | 8.0 |
| 740 | 58.99 | 0.03 | 20.1 | 3.53 | 3.47 | 1.02 | 1.02 | 1.02 | 0.062 | 2.17 | 14,8 | 9.6 | 22.1 | 0.39 | 0.10 | 0.38 | 8.0 |
| 740 + 1/2 | 59.47 | 0.04 | 19.5 | 3.55 | 3.48 | 1.02 | 1.03 | 1.02 | 0.038 | 2.06 | 14,8 | 9.9 | 22.4 | 0.39 | 0.11 | 0.67 | 8.0 |
| 741 | 59.89 | 0.01 | 19.5 | 3.60 | 3.48 | 1.03 | 1.04 | 1.03 | 0.040 | 2.15 | 15,8 | 10.4 | 23.1 | 0.40 | 0.15 | 0.66 | 8.0 |
| 741 + 1/2 | 60.31 | 0.03 | 19.2 | 3.62 | 3.49 | 1.04 | 1.04 | 1.04 | 0.029 | 2.68 | 15,8 | 11.4 | 29.5 | 0.40 | 0.20 | 0.66 | 8.0 |
| 742 | 60.80 | 0.01 | 19.0 | 3.64 | 3.51 | 1.04 | 1.04 | 1.04 | 0.028 | 2.90 | 15,8 | 11.3 | 29.6 | 0.41 | 0.23 | 0.66 | 8.0 |
| 742 + 1/2 | 61.27 | 0.08 | 18.6 | 3.59 | 3.53 | 1.02 | 1.02 | 1.02 | 0.030 | 2.80 | 15,8 | 11.2 | 30.9 | 0.41 | 0.29 | 0.65 | 8.0 |
| 743 | 61.58 | 0.01 | 18.4 | 3.54 | 3.54 | 1.00 | 1.00 | 1.00 | 0.031 | 2.59 | 15,8 | 11.4 | 33.7 | 0.42 | 0.34 | 0.64 | 8.0 |
| 743 + 1/2 | 61.90 | 0.01 | 18.0 | 3.52 | 3.56 | 0.99 | 0.99 | 0.99 | 0.014 | 2.43 | 15,8 | 11.6 | 31.7 | 0.42 | 0.36 | 0.64 | 8.0 |
| 744 | 62.26 | 0.00 | 17.6 | 3.45 | 3.58 | 0.96 | 0.96 | 0.96 | 0.033 | 1.92 | 15,8 | 12.1 | 28.8 | 0.43 | 0.38 | 0.63 | 8.0 |
| 744 + 1/2 | 62.60 | 0.00 | 17.3 | 3.41 | 3.60 | 0.95 | 0.95 | 0.95 | 0.031 | 1.59 | 15,7 | 13.0 | 28.4 | 0.43 | 0.38 | 0.62 | 8.0 |
| 745 | 62.95 | 0.02 | 17.0 | 3.45 | 3.61 | 0.96 | 0.96 | 0.96 | 0.025 | 1.51 | 0,2 | 13.8 | 23.2 | 0.43 | 0.36 | 0.62 | 8.0 |
| 745 + 1/2 | 63.24 | 0.02 | 16.8 | 3.48 | 3.62 | 0.96 | 0.96 | 0.96 | 0.018 | 1.50 | 15,7 | 14.8 | 24.7 | 0.44 | 0.28 | 0.61 | 8.0 |
| 746 | 63.50 | 0.04 | 16.5 | 3.57 | 3.63 | 0.99 | 0.99 | 0.99 | 0.011 | 1.50 | 5,0 | 15.9 | 25.4 | 0.44 | 0.27 | 0.61 | 8.0 |
| 746 + 1/2 | 63.84 | 0.01 | 16.3 | 3.61 | 3.63 | 1.00 | 1.00 | 1.00 | 0.020 | 1.55 | 14,5 | 14.6 | 26.5 | 0.44 | 0.25 | 0.60 | 8.0 |
| 747 | 64.20 | 0.03 | 15.8 | 3.68 | 3.63 | 1.01 | 1.01 | 1.01 | 0.028 | 1.62 | 4,1 | 14.5 | 28.1 | 0.45 | 0.18 | 0.60 | 8.0 |
| 747 + 1/2 | 64.63 | 0.03 | 15.7 | 3.68 | 3.63 | 1.01 | 1.01 | 1.01 | 0.016 | 1.57 | 4,1 | 15.4 | 30.4 | 0.45 | 0.14 | 0.44 | 8.0 |
| 748 | 64.98 | 0.08 | 15.4 | 3.69 | 3.65 | 1.01 | 1.01 | 1.01 | 0.010 | 1.59 | 4,1 | 17.1 | 32.4 | 0.45 | 0.14 | 0.45 | 8.0 |
| 748 + 1/2 | 65.17 | 0.00 | 15.1 | 3.68 | 3.66 | 1.00 | 1.00 | 1.00 | 0.010 | 1.57 | 4,1 | 17.4 | 33.3 | 0.45 | 0.15 | 0.45 | 8.0 |
| 749 | 65.37 | 0.00 | 14.8 | 3.66 | 3.66 | 1.00 | 1.00 | 1.00 | 0.005 | 1.57 | 6,1 | 17.7 | 35.5 | 0.46 | 0.17 | 0.45 | 8.0 |
| 749 + 1/2 | 65.57 | 0.02 | 14.6 | 3.67 | 3.67 | 1.00 | 1.00 | 1.00 | 0.009 | 1.62 | 5,1 | 16.9 | 32.0 | 0.46 | 0.18 | 0.45 | 8.0 |
| 750 | 65.73 | 0.09 | 14.3 | 3.63 | 3.68 | 0.99 | 0.99 | 0.99 | 0.005 | 1.52 | 5,2 | 17.5 | 32.9 | 0.46 | 0.19 | 0.46 | 8.0 |
| 750 + 1/2 | 65.71 | 0.06 | 14.1 | 3.63 | 3.68 | 0.99 | 0.99 | 0.99 | 0.004 | 1.52 | 3,5 | 17.5 | 34.3 | 0.46 | 0.19 | 0.46 | 8.0 |
| 751 | 65.56 | 0.03 | 13.8 | 3.66 | 3.68 | 0.99 | 0.99 | 0.99 | 0.007 | 1.64 | 3,5 | 17.7 | 35.7 | 0.47 | 0.19 | 0.46 | 8.0 |
| 751 + 1/2 | 65.48 | 0.08 | 13.6 | 3.66 | 3.69 | 0.99 | 0.99 | 0.99 | 0.003 | 1.70 | 3,5 | 17.8 | 36.9 | 0.47 | 0.19 | 0.46 | 8.0 |
| 752 | 65.55 | 0.04 | 13.3 | 3.69 | 3.70 | 1.00 | 1.00 | 1.00 | 0.004 | 1.91 | 3,5 | 18.0 | 37.5 | 0.47 | 0.19 | 0.47 | 8.0 |
| 752 + 1/2 | 65.69 | 0.04 | 13.1 | 3.71 | 3.72 | 1.00 | 1.00 | 1.00 | 0.007 | 1.69 | 3,5 | 18.1 | 36.7 | 0.47 | 0.20 | 0.47 | 8.0 |
| 753 | 65.76 | 0.03 | 12.8 | 3.75 | 3.74 | 1.00 | 1.00 | 1.00 | 0.000 | 1.80 | 3,5 | 18.4 | 36.7 | 0.48 | 0.19 | 0.47 | 8.0 |
| 753 + 1/2 | 65.77 | 0.02 | 12.6 | 3.77 | 3.78 | 1.00 | 1.00 | 1.00 | 0.001 | 1.70 | 3,5 | 18.9 | 36.8 | 0.48 | 0.17 | 0.48 | 8.0 |
| 754 | 65.82 | 0.01 | 12.3 | 3.81 | 3.80 | 1.00 | 1.00 | 1.00 | 0.009 | 1.95 | 2,5 | 19.0 | 36.5 | 0.48 | 0.18 | 0.48 | 8.0 |
| 754 + 1/2 | 65.84 | 0.02 | 12.0 | 3.83 | 3.83 | 1.00 | 1.00 | 1.00 | 0.013 | 2.11 | 2,5 | 19.3 | 36.7 | 0.49 | 0.18 | 0.48 | 8.0 |
| 755 | 65.82 | 0.03 | 11.7 | 3.84 | 3.82 | 1.00 | 1.00 | 1.00 | 0.012 | 1.99 | 2,5 | 19.8 | 37.7 | 0.49 | 0.18 | 0.49 | 8.0 |
| 755 + 1/2 | 65.75 | 0.04 | 11.5 | 3.84 | 3.82 | 1.01 | 1.00 | 1.00 | 0.012 | 2.19 | 2,5 | 21.4 | 40.3 | 0.49 | 0.18 | 0.49 | 8.0 |
| 756 | 65.75 | 0.04 | 11.3 | 3.84 | 3.82 | 1.01 | 1.00 | 1.00 | 0.011 | 1.93 | 2,5 | 21.3 | 40.6 | 0.50 | 0.18 | 0.49 | 8.0 |
| 756 + 1/2 | 65.83 | 0.04 | 11.0 | 3.84 | 3.82 | 1.01 | 1.00 | 1.00 | 0.019 | 1.85 | 1,5 | 21.7 | 40.8 | 0.50 | 0.17 | 0.49 | 8.0 |
| 757 | 65.98 | 0.06 | 10.8 | 3.89 | 3.82 | 1.02 | 1.01 | 1.01 | 0.013 | 2.07 | 1,5 | 21.8 | 42.2 | 0.50 | 0.16 | 0.50 | 8.0 |
| 757 + 1/2 | 66.25 | 0.03 | 10.6 | 3.92 | 3.82 | 1.03 | 1.03 | 1.03 | 0.007 | 2.02 | 1,5 | 21.8 | 42.6 | 0.50 | 0.16 | 0.50 | 8.0 |
| 758 | 66.59 | 0.05 | 10.3 | 3.91 | 3.82 | 1.02 | 1.02 | 1.02 | 0.010 | 1.82 | 1,5 | 20.9 | 43.5 | 0.51 | 0.15 | 0.50 | 8.0 |
| 758 + 1/2 | 66.83 | 0.06 | 10.1 | 3.93 | 3.82 | 1.03 | 1.03 | 1.03 | 0.009 | 1.91 | 1,5 | 20.2 | 44.4 | 0.51 | 0.15 | 0.51 | 8.0 |
| 759 | 66.95 | 0.05 | 9.9 | 3.95 | 3.82 | 1.03 | 1.03 | 1.03 | 0.012 | 1.83 | 1,5 | 19.9 | 42.6 | 0.52 | 0.14 | 0.51 | 8.0 |
| 759 + 1/2 | 66.98 | 0.03 | 9.7 | 3.94 | 3.82 | 1.03 | 1.03 | 1.03 | 0.017 | 1.85 | 1,5 | 19.8 | 40.8 | 0.52 | 0.14 | 0.52 | 8.0 |
| 760 | 66.94 | 0.01 | 9.4 | 3.90 | 3.82 | 1.02 | 1.03 | 1.02 | 0.008 | 1.58 | 0,5 | 19.3 | 40.1 | 0.52 | 0.14 | 0.52 | 8.0 |
| 760 + 1/2 | 66.87 | 0.00 | 9.2 | 3.95 | 3.82 | 1.03 | 1.04 | 1.03 | 0.008 | 1.81 | 0,5 | 18.9 | 39.5 | 0.53 | 0.14 | 0.52 | 8.0 |
| 761 | 66.80 | 0.03 | 9.0 | 3.93 | 3.82 | 1.03 | 1.03 | 1.03 | 0.012 | 1.80 | 0,6 | 18.4 | 39.3 | 0.53 | 0.14 | 0.53 | 8.0 |
| 761 + 1/2 | 66.79 | 0.02 | 8.7 | 3.90 | 3.82 | 1.02 | 1.02 | 1.02 | 0.011 | 1.97 | 0,6 | 18.2 | 39.9 | 0.53 | 0.14 | 0.53 | 8.0 |
| 762 | 66.74 | 0.02 | 8.4 | 3.90 | 3.82 | 1.02 | 1.02 | 1.02 | 0.006 | 2.01 | 0,6 | 18.2 | 40.7 | 0.54 | 0.14 | 0.53 | 8.0 |
| 762 + 1/2 | 66.66 | 0.07 | 8.3 | 3.85 | 3.82 | 1.01 | 1.02 | 1.01 | 0.002 | 2.03 | 0,6 | 18.1 | 40.9 | 0.54 | 0.14 | 0.54 | 8.0 |
| 763 | 66.43 | 0.02 | 8.0 | 3.81 | 3.81 | 1.00 | 1.00 | 1.00 | 0.008 | 1.98 | 11,8 | 17.8 | 41.2 | 0.55 | 0.14 | 0.54 | 8.0 |
| 763 + 1/2 | 66.15 | 0.00 | 7.8 | 3.79 | 3.78 | 1.00 | 1.00 | 1.00 | 0.007 | 2.09 | 11,8 | 17.8 | 42.3 | 0.55 | 0.13 | 0.55 | 8.0 |
| 764 | 65.88 | 0.01 | 7.6 | 3.75 | 3.74 | 1.00 | 1.00 | 1.00 | 0.008 | 1.95 | 11,8 | 17.7 | 43.1 | 0.55 | 0.13 | 0.55 | 8.0 |
| 764 + 1/2 | 65.65 | 0.04 | 7.4 | 3.70 | 3.69 | 1.00 | 1.00 | 1.00 | 0.005 | 2.00 | 11,8 | 17.8 | 43.4 | 0.56 | 0.13 | 0.56 | 8.0 |
| 765 | 65.48 | 0.03 | 7.2 | 3.63 | 3.66 | 0.99 | 0.99 | 0.99 | 0.009 | 1.81 | 11,8 | 18.0 | 43.8 | 0.56 | 0.13 | 0.56 | 8.0 |
| 765 + 1/2 | 65.25 | 0.04 | 6.9 | 3.62 | 3.61 | 1.00 | 1.00 | 1.00 | 0.011 | 1.76 | 11,8 | 18.0 | 44.6 | 0.57 | 0.13 | 0.57 | 8.0 |
| 766 | 65.09 | 0.02 | 6.7 | 3.58 | 3.57 | 1.00 | 1.01 | 1.00 | 0.006 | 1.64 | 11,8 | 18.7 | 44.2 | 0.57 | 0.12 | 0.57 | 8.0 |
| 766 + 1/2 | 64.97 | 0.00 | 6.5 | 3.52 | 3.55 | 0.99 | 0.99 | 0.99 | 0.009 | 1.45 | 11,8 | 18.4 | 45.0 | 0.58 | 0.12 | 0.57 | 8.0 |
| 767 | 64.85 | 0.03 | 6.2 | 3.51 | 3.48 | 1.01 | 1.01 | 1.01 | 0.009 | 1.37 | 0,4 | 18.8 | 45.4 | 0.58 | 0.12 | 0.58 | 8.0 |
| 767 + 1/2 | 64.79 | 0.00 | 6.1 | 3.43 | 3.47 | 0.99 | 0.99 | 0.99 | 0.000 | 1.40 | 2,8 | 18.7 | 46.5 | 0.59 | 0.12 | 0.58 | 8.0 |
| 768 | 64.72 | 0.03 | 5.7 | 3.44 | 3.40 | 1.01 | 1.01 | 1.01 | 0.001 | 1.48 | 15,1 | 18.6 | 45.7 | 0.59 | 0.11 | 0.59 | 8.0 |
| 768 + 1/2 | 64.61 | 0.01 | 5.6 | 3.37 | 3.38 | 1.00 | 1.00 | 1.00 | 0.002 | 1.34 | 0,4 | 18.7 | 45.6 | 0.60 | 0.11 | 0.60 | 8.0 |
| 769 | 64.52 | 0.02 | 5.4 | 3.33 | 3.33 | 1.00 | 1.00 | 1.00 | 0.002 | 1.42 | 3,5 | 17.6 | 45.0 | 0.60 | 0.10 | 0.60 | 8.0 |
| 769 + 1/2 | 64.39 | 0.01 | 5.1 | 3.30 | 3.28 | 1.01 | 1.01 | 1.01 | 0.001 | 1.57 | 15,1 | 17.9 | 44.6 | 0.61 | 0.10 | 0.61 | 8.0 |
| 770 | 64.25 | 0.00 | 5.0 | 3.24 | 3.25 | 1.00 | 0.99 | 0.99 | 0.001 | 1.45 | 3,5 | 17.6 | 43.2 | 0.62 | 0.09 | 0.61 | 8.0 |
| 770 + 1/2 | 64.12 | 0.00 | 4.7 | 3.21 | 3.20 | 1.00 | 1.00 | 1.00 | 0.000 | 1.38 | 7,8 | 17.4 | 42.3 | 0.62 | 0.08 | 0.62 | 8.0 |
| 771 | 63.99 | 0.01 | 4.4 | 3.17 | 3.16 | 1.00 | 1.00 | 1.00 | 0.000 | 1.48 | 3,5 | 16.4 | 41.2 | 0.63 | 0.07 | 0.62 | 8.0 |
| 771 + 1/2 | 63.88 | 0.03 | 4.3 | 3.12 | 3.11 | 1.00 | 1.00 | 1.00 | 0.000 | 1.42 | 14,1 | 15.5 | 39.0 | 0.63 | 0.06 | 0.63 | 8.0 |
| 772 | 63.83 | 0.00 | 4.1 | 3.06 | 3.08 | 0.99 | 0.99 | 0.99 | 0.000 | 1.39 | 14,1 | 15.0 | 36.9 | 0.64 | 0.06 | 0.64 | 8.0 |
| 772 + 1/2 | 63.79 | 0.00 | 3.9 | 3.04 | 3.01 | 1.01 | 1.01 | 1.01 | 0.000 | 1.46 | 14,1 | 13.7 | 34.5 | 0.64 | 0.05 | 0.64 | 8.0 |
| 773 | 63.75 | 0.01 | 3.6 | 2.97 | 2.98 | 0.99 | 0.99 | 0.99 | 0.000 | 1.47 | 14,0 | 12.3 | 31.7 | 0.65 | 0.04 | 0.65 | 8.0 |
| 773 + 1/2 | 63.74 | 0.00 | 3.4 | 2.93 | 2.92 | 1.00 | 1.00 | 1.00 | 0.000 | 1.56 | 5,6 | 11.1 | 27.8 | 0.65 | 0.04 | 0.65 | 8.0 |
| 774 | 63.74 | 0.00 | 3.2 | 2.88 | 2.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.65 | 1,6 | 9.6 | 25.1 | 0.66 | 0.04 | 0.66 | 8.0 |
| 774 + 1/2 | 63.74 | 0.00 | 3.0 | 2.80 | 2.81 | 1.00 | 1.00 | 1.00 | 0.000 | 1.67 | 1,6 | 8.8 | 22.4 | 0.66 | 0.03 | 0.66 | 8.9 |
| 775 | 63.74 | 0.01 | 2.8 | 2.75 | 2.73 | 1.01 | 1.01 | 1.01 | 0.000 | 1.71 | 1,6 | 7.9 | 19.7 | 0.67 | 0.03 | 0.67 | 8.8 |
| 775 + 1/2 | 63.73 | 0.00 | 2.6 | 2.65 | 2.70 | 0.98 | 0.98 | 0.98 | 0.000 | 1.73 | 1,6 | 6.3 | 16.3 | 0.67 | 0.03 | 0.67 | 8.0 |
| 776 | 63.73 | 0.01 | 2.3 | 2.64 | 2.63 | 1.01 | 1.01 | 1.01 | 0.000 | 1.66 | 1,6 | 5.4 | 14.0 | 0.67 | 0.03 | 0.67 | 8.8 |
| 776 + 1/2 | 63.74 | 0.00 | 2.1 | 2.59 | 2.62 | 0.99 | 0.99 | 0.99 | 0.000 | 1.73 | 0,6 | 5.0 | 11.8 | 0.68 | 0.03 | 0.67 | 8.8 |
| 777 | 63.77 | 0.01 | 1.9 | 2.60 | 2.60 | 1.00 | 1.00 | 1.00 | 0.000 | 1.48 | 0,6 | 4.6 | 9.6 | 0.68 | 0.03 | 0.68 | 8.8 |
| 777 + 1/2 | 63.80 | 0.00 | 1.7 | 2.59 | 2.60 | 1.00 | 1.00 | 1.00 | 0.000 | 1.40 | 0,6 | 4.3 | 8.1 | 0.68 | 0.03 | 0.68 | 8.7 |
| 778 | 63.84 | 0.00 | 1.5 | 2.59 | 2.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.27 | 0,6 | 4.0 | 6.6 | 0.68 | 0.03 | 0.68 | 8.7 |
| 778 + 1/2 | 63.87 | 0.00 | 1.4 | 2.60 | 2.58 | 1.01 | 1.01 | 1.01 | 0.000 | 1.25 | 3,8 | 3.8 | 6.7 | 0.68 | 0.03 | 0.68 | 8.7 |
| 779 last | 63.90 | 0.00 | 1.3 | 2.57 | 2.58 | 1.00 | 1.00 | 1.00 | 0.000 | 1.33 | 3,8 | 3.7 | 6.8 | 0.68 | 0.03 | 0.68 | 8.7 |
| 779 + 1/2 | 63.93 | 0.01 | 1.3 | 2.57 | 2.57 | 1.00 | 1.00 | 1.00 | 0.000 | 1.31 | 3,8 | 3.7 | 6.8 | 0.68 | 0.03 | 0.68 | 8.7 |
| 780 | 63.95 | 0.01 | 1.3 | 2.56 | 2.57 | 1.00 | 1.00 | 1.00 | 0.000 | 1.25 | 3,8 | 3.8 | 7.0 | 0.68 | 0.03 | 0.68 | 8.7 |
| 780 + 1/2 | 63.94 | 0.00 | 1.3 | 2.55 | 2.56 | 1.00 | 1.00 | 1.00 | 0.000 | 1.28 | 3,8 | 3.8 | 7.0 | 0.69 | 0.03 | 0.68 | 8.7 |
| 781 | 63.95 | 0.00 | 1.3 | 2.55 | 2.56 | 1.00 | 1.00 | 1.00 | 0.000 | 1.22 | 3,8 | 3.8 | 6.9 | 0.69 | 0.02 | 0.68 | 8.7 |
| 781 + 1/2 | 63.95 | 0.00 | 1.3 | 2.55 | 2.56 | 1.00 | 1.00 | 1.00 | 0.000 | 1.23 | 3,8 | 3.9 | 7.0 | 0.69 | 0.02 | 0.68 | 8.7 |
| 782 | 63.96 | 0.00 | 1.3 | 2.55 | 2.56 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 0,2 | 3.9 | 7.0 | 0.69 | 0.02 | 0.68 | 8.6 |
| 782 + 1/2 | 63.95 | 0.00 | 1.3 | 2.55 | 2.55 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 0,8 | 3.9 | 7.1 | 0.69 | 0.02 | 0.69 | 8.7 |
| 783 | 63.95 | 0.00 | 1.3 | 2.56 | 2.55 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 6,3 | 3.8 | 7.2 | 0.69 | 0.02 | 0.69 | 8.6 |
| 783 + 1/2 | 63.95 | 0.00 | 1.3 | 2.56 | 2.55 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 0,8 | 3.8 | 7.2 | 0.69 | 0.02 | 0.69 | 8.6 |
| 784 | 63.94 | 0.00 | 1.3 | 2.55 | 2.55 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 5,0 |  |  |  |  |  |  |
| 784 + 1/2 | 63.93 | 0.00 | 1.3 | 2.56 | 2.55 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 8,4 |  |  |  |  |  |  |
| 785 | 63.92 | 0.00 | 1.2 | 2.55 | 2.55 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 4,2 |  |  |  |  |  |  |
| 785 + 1/2 | 63.92 | 0.00 | 1.2 | 2.54 | 2.55 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 0,4 |  |  |  |  |  |  |
| 786 | 63.91 | 0.00 | 1.2 | 2.55 | 2.54 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 8,3 |  |  |  |  |  |  |
| 786 + 1/2 | 63.90 | 0.01 | 1.2 | 2.55 | 2.54 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 5,0 |  |  |  |  |  |  |
| 787 | 63.90 | 0.00 | 1.2 | 2.54 | 2.54 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 3,0 |  |  |  |  |  |  |
| 787 + 1/2 | 63.91 | 0.00 | 1.2 | 2.54 | 2.54 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 3,4 |  |  |  |  |  |  |
| 788 | 63.91 | 0.00 | 1.2 | 2.54 | 2.54 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 5,0 |  |  |  |  |  |  |
| 788 + 1/2 | 63.92 | 0.00 | 1.2 | 2.54 | 2.53 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 8,8 |  |  |  |  |  |  |
| 789 | 63.93 | 0.00 | 1.2 | 2.52 | 2.53 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 5,8 |  |  |  |  |  |  |
| 789 + 1/2 | 63.94 | 0.01 | 1.2 | 2.53 | 2.53 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 0,6 |  |  |  |  |  |  |
| 790 | 63.94 | 0.00 | 1.2 | 2.53 | 2.52 | 1.01 | 1.01 | 1.01 | 0.000 | 1.12 | 7,5 |  |  |  |  |  |  |
| 790 + 1/2 | 63.93 | 0.00 | 1.2 | 2.51 | 2.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 6,4 |  |  |  |  |  |  |
| 791 | 63.93 | 0.00 | 1.2 | 2.52 | 2.51 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 9,1 |  |  |  |  |  |  |
| 791 + 1/2 | 63.92 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

### rise (mercury.rise, frames 960 to 1034, window 948 to 1046, 198 draft frames at rate 2)

Largest level step: 0.33 at frame 1046 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.35 from frame 1044 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 17.67 from frame 1044 + 1/2 to the next, block column 11 row 2 from the top left, shown, not judged.
Largest change in place: 60.4 from frame 1000 + 1/2 to 8 film frames later, most at pixel 964, 480 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.86 from frame 1002 + 1/2 to 8 film frames later, most at pixel 352, 1076, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 948 to 959 + 1/2): change 7.3, pattern 0.17.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 1043 in /home/user/workspace/work/p6/sm52/04/mercury-rise-p2of2-pops.png, frame 1044 in /home/user/workspace/work/p6/sm52/04/mercury-rise-p2of2-pops.png, frame 1044 + 1/2 in /home/user/workspace/work/p6/sm52/04/mercury-rise-p2of2-pops.png, frame 1045 in /home/user/workspace/work/p6/sm52/04/mercury-rise-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 960 in no panel (a slice --frames 1920-1920 draws it), frame 968 in no panel (a slice --frames 1936-1936 draws it), frame 1002 + 1/2 in /home/user/workspace/work/p6/sm52/04/mercury-rise-p2of2-changes.png, frame 1012 in /home/user/workspace/work/p6/sm52/04/mercury-rise-p2of2-changes.png.

- RED pop score 1.35 from frame 1044 + 1/2 to the next, limit 1.2 (7 frames over it, first 1042)
- RED the pattern of the picture changes in place by 0.86 from frame 1002 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (30 frames over it, first 998 + 1/2)

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 948 | 76.18 |  | 2.9 | 3.37 | 3.53 | 0.95 | 0.95 | 0.95 | 0.000 | 1.35 | 8,1 | 7.1 | 15.7 | 0.70 | 0.17 | 0.69 | 8.5 |
| 948 + 1/2 | 76.34 | 0.01 | 2.9 | 3.33 | 3.54 | 0.94 | 0.94 | 0.94 | 0.000 | 1.31 | 15,8 | 7.1 | 13.9 | 0.70 | 0.17 | 0.70 | 8.5 |
| 949 | 76.50 | 0.00 | 2.8 | 3.30 | 3.56 | 0.93 | 0.93 | 0.93 | 0.000 | 1.31 | 14,8 | 7.1 | 13.0 | 0.70 | 0.17 | 0.70 | 8.7 |
| 949 + 1/2 | 76.64 | 0.00 | 2.7 | 3.27 | 3.58 | 0.91 | 0.91 | 0.91 | 0.003 | 1.25 | 14,8 | 7.0 | 13.1 | 0.71 | 0.17 | 0.70 | 8.7 |
| 950 | 76.79 | 0.00 | 2.6 | 3.28 | 3.58 | 0.92 | 0.92 | 0.92 | 0.000 | 1.27 | 14,8 | 7.1 | 11.3 | 0.71 | 0.16 | 0.70 | 8.7 |
| 950 + 1/2 | 76.94 | 0.00 | 2.6 | 3.39 | 3.59 | 0.94 | 0.94 | 0.94 | 0.000 | 1.33 | 14,8 | 7.1 | 11.4 | 0.71 | 0.16 | 0.71 | 8.6 |
| 951 | 77.08 | 0.00 | 2.5 | 3.53 | 3.66 | 0.96 | 0.96 | 0.96 | 0.000 | 1.30 | 14,8 | 7.2 | 12.3 | 0.71 | 0.16 | 0.71 | 8.6 |
| 951 + 1/2 | 77.21 | 0.01 | 2.4 | 3.73 | 3.71 | 1.01 | 1.01 | 1.01 | 0.000 | 1.40 | 14,8 | 7.3 | 15.1 | 0.71 | 0.15 | 0.71 | 8.6 |
| 952 | 77.32 | 0.00 | 2.4 | 3.84 | 3.86 | 1.00 | 1.00 | 1.00 | 0.000 | 1.30 | 14,8 | 7.4 | 15.5 | 0.71 | 0.16 | 0.71 | 8.0 |
| 952 + 1/2 | 77.43 | 0.00 | 2.3 | 3.98 | 3.91 | 1.02 | 1.02 | 1.02 | 0.000 | 1.23 | 14,8 | 7.3 | 16.5 | 0.71 | 0.15 | 0.71 | 8.0 |
| 953 | 77.54 | 0.01 | 2.2 | 4.03 | 3.91 | 1.03 | 1.03 | 1.03 | 0.000 | 1.27 | 13,7 | 7.9 | 16.3 | 0.71 | 0.15 | 0.71 | 8.0 |
| 953 + 1/2 | 77.62 | 0.00 | 2.2 | 4.07 | 3.91 | 1.04 | 1.04 | 1.04 | 0.000 | 1.21 | 7,7 | 8.9 | 17.3 | 0.72 | 0.15 | 0.71 | 8.0 |
| 954 | 77.71 | 0.00 | 2.2 | 4.11 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.19 | 2,8 | 11.3 | 20.5 | 0.72 | 0.14 | 0.71 | 8.0 |
| 954 + 1/2 | 77.78 | 0.00 | 2.1 | 4.11 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.21 | 2,8 | 13.9 | 24.7 | 0.72 | 0.14 | 0.72 | 8.0 |
| 955 | 77.86 | 0.00 | 2.1 | 4.14 | 3.91 | 1.06 | 1.06 | 1.06 | 0.000 | 1.26 | 5,7 | 16.8 | 28.9 | 0.72 | 0.14 | 0.72 | 8.0 |
| 955 + 1/2 | 77.93 | 0.00 | 2.1 | 4.13 | 3.91 | 1.06 | 1.06 | 1.06 | 0.000 | 1.22 | 4,7 | 19.6 | 32.5 | 0.73 | 0.15 | 0.72 | 8.0 |
| 956 | 78.00 | 0.00 | 2.1 | 4.13 | 3.91 | 1.06 | 1.06 | 1.06 | 0.000 | 1.25 | 0,7 | 22.6 | 35.7 | 0.73 | 0.15 | 0.72 | 8.0 |
| 956 + 1/2 | 78.07 | 0.00 | 2.1 | 4.12 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.24 | 4,7 | 25.3 | 39.8 | 0.73 | 0.15 | 0.72 | 8.0 |
| 957 | 78.14 | 0.00 | 2.1 | 4.11 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.28 | 0,7 | 28.2 | 44.6 | 0.73 | 0.16 | 0.72 | 8.4 |
| 957 + 1/2 | 78.21 | 0.00 | 2.0 | 4.09 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.22 | 4,6 | 31.2 | 48.8 | 0.74 | 0.17 | 0.72 | 8.4 |
| 958 | 78.29 | 0.00 | 2.1 | 4.11 | 3.91 | 1.05 | 1.05 | 1.05 | 0.001 | 1.31 | 0,7 | 34.1 | 53.5 | 0.73 | 0.18 | 0.72 | 8.4 |
| 958 + 1/2 | 78.37 | 0.00 | 2.1 | 4.08 | 3.91 | 1.04 | 1.04 | 1.04 | 0.000 | 1.28 | 7,6 | 37.1 | 58.1 | 0.73 | 0.20 | 0.72 | 8.4 |
| 959 | 78.45 | 0.00 | 2.0 | 4.12 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.41 | 9,6 | 39.9 | 62.6 | 0.73 | 0.22 | 0.72 | 8.3 |
| 959 + 1/2 | 78.55 | 0.00 | 2.1 | 4.06 | 3.91 | 1.04 | 1.04 | 1.04 | 0.000 | 1.27 | 8,6 | 42.8 | 66.9 | 0.73 | 0.24 | 0.72 | 8.3 |
| 960 first | 78.65 | 0.08 | 2.0 | 4.09 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.49 | 3,1 | 45.7 | 71.3 | 0.73 | 0.25 | 0.73 | 8.3 |
| 960 + 1/2 | 78.59 | 0.00 | 2.0 | 3.98 | 3.89 | 1.02 | 1.02 | 1.02 | 0.000 | 1.42 | 3,1 | 44.9 | 71.6 | 0.73 | 0.26 | 0.72 | 8.3 |
| 961 | 78.53 | 0.00 | 2.0 | 3.80 | 3.80 | 1.00 | 1.00 | 1.00 | 0.000 | 1.32 | 3,1 | 44.3 | 71.2 | 0.73 | 0.27 | 0.72 | 8.4 |
| 961 + 1/2 | 78.46 | 0.00 | 2.1 | 3.62 | 3.68 | 0.98 | 0.98 | 0.98 | 0.000 | 1.37 | 14,8 | 43.6 | 71.0 | 0.73 | 0.28 | 0.73 | 8.4 |
| 962 | 78.39 | 0.01 | 2.2 | 3.56 | 3.57 | 1.00 | 1.00 | 1.00 | 0.000 | 1.44 | 14,8 | 42.8 | 70.5 | 0.73 | 0.28 | 0.73 | 8.4 |
| 962 + 1/2 | 78.31 | 0.00 | 2.4 | 3.53 | 3.51 | 1.00 | 1.00 | 1.00 | 0.000 | 1.40 | 14,8 | 41.4 | 69.9 | 0.73 | 0.28 | 0.73 | 8.4 |
| 963 | 78.22 | 0.00 | 2.6 | 3.47 | 3.50 | 0.99 | 0.99 | 0.99 | 0.000 | 1.37 | 2,8 | 39.9 | 68.8 | 0.73 | 0.26 | 0.73 | 8.5 |
| 963 + 1/2 | 78.13 | 0.00 | 2.9 | 3.42 | 3.50 | 0.98 | 0.98 | 0.98 | 0.000 | 1.33 | 14,0 | 38.9 | 67.6 | 0.73 | 0.25 | 0.73 | 8.5 |
| 964 | 78.03 | 0.01 | 3.2 | 3.36 | 3.50 | 0.96 | 0.96 | 0.96 | 0.000 | 1.44 | 15,0 | 37.5 | 66.8 | 0.73 | 0.24 | 0.73 | 8.6 |
| 964 + 1/2 | 77.92 | 0.01 | 3.6 | 3.32 | 3.50 | 0.95 | 0.95 | 0.95 | 0.000 | 1.69 | 14,8 | 36.3 | 64.9 | 0.73 | 0.23 | 0.73 | 8.6 |
| 965 | 77.78 | 0.01 | 4.0 | 3.34 | 3.50 | 0.96 | 0.96 | 0.96 | 0.000 | 1.62 | 14,8 | 35.1 | 63.2 | 0.73 | 0.23 | 0.73 | 8.7 |
| 965 + 1/2 | 77.62 | 0.01 | 4.3 | 3.33 | 3.50 | 0.95 | 0.96 | 0.95 | 0.000 | 1.55 | 14,0 | 34.1 | 61.2 | 0.73 | 0.22 | 0.73 | 8.7 |
| 966 | 77.44 | 0.02 | 4.7 | 3.30 | 3.50 | 0.94 | 0.94 | 0.94 | 0.002 | 1.74 | 14,0 | 32.9 | 59.7 | 0.73 | 0.21 | 0.73 | 8.8 |
| 966 + 1/2 | 77.22 | 0.01 | 5.1 | 3.28 | 3.50 | 0.94 | 0.94 | 0.94 | 0.003 | 1.57 | 10,0 | 31.1 | 59.3 | 0.73 | 0.19 | 0.73 | 8.8 |
| 967 | 77.02 | 0.01 | 5.4 | 3.25 | 3.50 | 0.93 | 0.93 | 0.93 | 0.000 | 1.55 | 10,0 | 30.0 | 58.5 | 0.73 | 0.18 | 0.72 | 8.9 |
| 967 + 1/2 | 76.85 | 0.04 | 5.7 | 3.28 | 3.50 | 0.94 | 0.94 | 0.94 | 0.000 | 1.55 | 14,0 | 28.4 | 57.0 | 0.72 | 0.16 | 0.72 | 9.2 |
| 968 | 76.60 | 0.02 | 6.1 | 3.28 | 3.50 | 0.94 | 0.94 | 0.94 | 0.003 | 1.48 | 10,0 | 27.4 | 56.4 | 0.72 | 0.16 | 0.72 | 9.2 |
| 968 + 1/2 | 76.31 | 0.01 | 6.4 | 3.31 | 3.50 | 0.95 | 0.95 | 0.95 | 0.000 | 1.54 | 2,5 | 25.7 | 54.4 | 0.72 | 0.14 | 0.72 | 9.0 |
| 969 | 76.05 | 0.01 | 6.7 | 3.37 | 3.50 | 0.96 | 0.97 | 0.96 | 0.000 | 1.48 | 10,8 | 24.6 | 52.2 | 0.72 | 0.14 | 0.72 | 8.9 |
| 969 + 1/2 | 75.81 | 0.01 | 7.0 | 3.39 | 3.50 | 0.97 | 0.97 | 0.97 | 0.000 | 1.58 | 10,8 | 23.5 | 51.0 | 0.72 | 0.13 | 0.72 | 8.9 |
| 970 | 75.59 | 0.02 | 7.4 | 3.42 | 3.50 | 0.98 | 0.98 | 0.98 | 0.002 | 1.64 | 3,5 | 22.9 | 50.9 | 0.73 | 0.12 | 0.72 | 8.9 |
| 970 + 1/2 | 75.41 | 0.03 | 7.7 | 3.46 | 3.50 | 0.99 | 0.99 | 0.99 | 0.006 | 1.71 | 3,5 | 21.9 | 49.7 | 0.73 | 0.12 | 0.72 | 8.9 |
| 971 | 75.29 | 0.02 | 8.1 | 3.48 | 3.49 | 1.00 | 0.99 | 0.99 | 0.007 | 1.65 | 3,5 | 21.3 | 49.5 | 0.73 | 0.11 | 0.72 | 8.8 |
| 971 + 1/2 | 75.14 | 0.06 | 8.3 | 3.52 | 3.51 | 1.00 | 1.00 | 1.00 | 0.008 | 1.57 | 3,5 | 20.9 | 48.6 | 0.73 | 0.11 | 0.73 | 8.9 |
| 972 | 74.86 | 0.02 | 8.7 | 3.55 | 3.54 | 1.00 | 1.00 | 1.00 | 0.009 | 1.47 | 0,4 | 21.1 | 48.2 | 0.73 | 0.11 | 0.73 | 8.8 |
| 972 + 1/2 | 74.63 | 0.00 | 8.9 | 3.56 | 3.55 | 1.00 | 1.00 | 1.00 | 0.008 | 1.66 | 0,4 | 20.4 | 47.2 | 0.73 | 0.10 | 0.73 | 8.8 |
| 973 | 74.38 | 0.02 | 9.4 | 3.56 | 3.56 | 1.00 | 1.00 | 1.00 | 0.005 | 1.38 | 14,1 | 19.9 | 46.3 | 0.73 | 0.11 | 0.73 | 8.8 |
| 973 + 1/2 | 74.09 | 0.00 | 9.7 | 3.56 | 3.59 | 0.99 | 0.99 | 0.99 | 0.011 | 1.63 | 2,2 | 19.2 | 45.1 | 0.73 | 0.11 | 0.73 | 8.8 |
| 974 | 73.80 | 0.02 | 10.0 | 3.62 | 3.59 | 1.01 | 1.01 | 1.01 | 0.012 | 1.54 | 2,2 | 18.9 | 43.9 | 0.73 | 0.10 | 0.73 | 8.7 |
| 974 + 1/2 | 73.56 | 0.03 | 10.2 | 3.64 | 3.62 | 1.00 | 1.01 | 1.00 | 0.006 | 1.50 | 2,3 | 18.9 | 42.0 | 0.73 | 0.11 | 0.73 | 8.7 |
| 975 | 73.27 | 0.04 | 10.5 | 3.62 | 3.66 | 0.99 | 0.99 | 0.99 | 0.013 | 1.52 | 2,2 | 18.1 | 39.6 | 0.73 | 0.10 | 0.73 | 8.6 |
| 975 + 1/2 | 72.90 | 0.03 | 10.9 | 3.69 | 3.66 | 1.01 | 1.00 | 1.00 | 0.021 | 1.48 | 2,3 | 16.8 | 37.2 | 0.73 | 0.10 | 0.73 | 8.5 |
| 976 | 72.58 | 0.05 | 11.2 | 3.69 | 3.70 | 1.00 | 1.00 | 1.00 | 0.009 | 1.39 | 2,3 | 16.1 | 34.7 | 0.73 | 0.09 | 0.73 | 8.5 |
| 976 + 1/2 | 72.36 | 0.01 | 11.5 | 3.73 | 3.70 | 1.01 | 1.01 | 1.01 | 0.010 | 1.52 | 2,3 | 15.2 | 32.5 | 0.73 | 0.09 | 0.73 | 8.4 |
| 977 | 72.16 | 0.00 | 11.7 | 3.71 | 3.75 | 0.99 | 1.00 | 0.99 | 0.016 | 1.48 | 11,8 | 15.9 | 29.6 | 0.74 | 0.08 | 0.74 | 8.6 |
| 977 + 1/2 | 71.96 | 0.05 | 12.1 | 3.78 | 3.77 | 1.00 | 1.01 | 1.00 | 0.014 | 1.61 | 11,8 | 15.5 | 28.3 | 0.74 | 0.08 | 0.74 | 8.5 |
| 978 | 71.85 | 0.08 | 12.4 | 3.83 | 3.80 | 1.01 | 1.01 | 1.01 | 0.014 | 1.53 | 11,8 | 14.3 | 26.2 | 0.74 | 0.07 | 0.74 | 8.4 |
| 978 + 1/2 | 71.57 | 0.02 | 12.8 | 3.82 | 3.85 | 0.99 | 0.98 | 0.98 | 0.027 | 1.46 | 11,8 | 13.2 | 24.6 | 0.74 | 0.07 | 0.74 | 8.0 |
| 979 | 71.26 | 0.04 | 13.1 | 3.88 | 3.86 | 1.00 | 1.00 | 1.00 | 0.023 | 1.59 | 13,0 | 13.7 | 31.5 | 0.74 | 0.07 | 0.74 | 8.0 |
| 979 + 1/2 | 71.02 | 0.01 | 13.5 | 3.89 | 3.86 | 1.01 | 1.01 | 1.01 | 0.015 | 1.64 | 0,8 | 12.7 | 19.2 | 0.75 | 0.06 | 0.75 | 8.9 |
| 980 | 70.81 | 0.04 | 13.9 | 3.93 | 3.87 | 1.01 | 1.00 | 1.00 | 0.019 | 2.00 | 0,8 | 11.5 | 16.5 | 0.75 | 0.06 | 0.75 | 8.8 |
| 980 + 1/2 | 70.67 | 0.03 | 14.3 | 3.97 | 3.88 | 1.02 | 1.01 | 1.01 | 0.028 | 1.90 | 0,8 | 10.4 | 14.7 | 0.75 | 0.05 | 0.75 | 9.0 |
| 981 | 70.60 | 0.06 | 14.6 | 4.01 | 3.91 | 1.03 | 1.03 | 1.03 | 0.013 | 2.01 | 0,8 | 10.3 | 22.2 | 0.76 | 0.07 | 0.76 | 8.0 |
| 981 + 1/2 | 70.64 | 0.01 | 15.1 | 4.07 | 3.92 | 1.04 | 1.04 | 1.04 | 0.011 | 2.07 | 1,8 | 10.0 | 19.8 | 0.76 | 0.06 | 0.76 | 8.1 |
| 982 | 70.67 | 0.06 | 15.4 | 4.07 | 3.95 | 1.03 | 1.04 | 1.03 | 0.009 | 1.76 | 1,8 | 9.4 | 17.7 | 0.76 | 0.06 | 0.76 | 8.1 |
| 982 + 1/2 | 70.58 | 0.06 | 15.9 | 4.10 | 3.99 | 1.03 | 1.04 | 1.03 | 0.009 | 1.88 | 1,7 | 10.3 | 17.3 | 0.76 | 0.06 | 0.76 | 8.0 |
| 983 | 70.37 | 0.03 | 16.1 | 4.08 | 4.01 | 1.02 | 1.02 | 1.02 | 0.012 | 1.87 | 15,6 | 10.4 | 15.8 | 0.76 | 0.06 | 0.76 | 8.0 |
| 983 + 1/2 | 70.10 | 0.03 | 16.7 | 4.14 | 4.01 | 1.03 | 1.03 | 1.03 | 0.018 | 1.85 | 15,6 | 10.1 | 15.2 | 0.76 | 0.05 | 0.76 | 8.0 |
| 984 | 69.89 | 0.07 | 17.0 | 4.17 | 4.01 | 1.04 | 1.05 | 1.04 | 0.009 | 2.01 | 5,8 | 10.1 | 18.6 | 0.76 | 0.06 | 0.76 | 8.0 |
| 984 + 1/2 | 69.54 | 0.15 | 17.4 | 4.17 | 4.01 | 1.04 | 1.04 | 1.04 | 0.021 | 1.92 | 15,6 | 10.1 | 17.0 | 0.76 | 0.05 | 0.76 | 8.0 |
| 985 | 68.88 | 0.03 | 17.9 | 4.15 | 4.01 | 1.04 | 1.04 | 1.04 | 0.012 | 1.95 | 5,8 | 10.8 | 19.6 | 0.76 | 0.05 | 0.76 | 8.0 |
| 985 + 1/2 | 68.17 | 0.11 | 18.2 | 4.13 | 4.01 | 1.03 | 1.04 | 1.03 | 0.017 | 1.77 | 5,8 | 10.3 | 16.5 | 0.76 | 0.05 | 0.76 | 8.0 |
| 986 | 67.67 | 0.04 | 18.7 | 4.12 | 4.01 | 1.03 | 1.04 | 1.03 | 0.009 | 1.78 | 3,6 | 11.4 | 23.7 | 0.76 | 0.06 | 0.76 | 8.0 |
| 986 + 1/2 | 67.09 | 0.05 | 19.1 | 4.01 | 4.02 | 1.00 | 1.01 | 1.00 | 0.014 | 1.87 | 3,6 | 11.4 | 17.5 | 0.76 | 0.06 | 0.76 | 8.0 |
| 987 | 66.41 | 0.05 | 19.7 | 3.92 | 4.02 | 0.98 | 0.98 | 0.98 | 0.022 | 1.84 | 14,6 | 10.9 | 16.8 | 0.76 | 0.05 | 0.76 | 8.0 |
| 987 + 1/2 | 65.82 | 0.16 | 20.1 | 3.84 | 4.02 | 0.96 | 0.96 | 0.96 | 0.015 | 1.95 | 14,6 | 10.6 | 21.5 | 0.76 | 0.07 | 0.76 | 8.0 |
| 988 | 65.55 | 0.05 | 20.8 | 3.86 | 4.02 | 0.96 | 0.96 | 0.96 | 0.038 | 2.01 | 14,6 | 10.6 | 19.7 | 0.76 | 0.08 | 0.75 | 8.2 |
| 988 + 1/2 | 65.37 | 0.13 | 21.3 | 4.04 | 4.01 | 1.01 | 1.01 | 1.01 | 0.019 | 1.92 | 14,6 | 10.5 | 18.6 | 0.75 | 0.10 | 0.75 | 8.5 |
| 989 | 64.93 | 0.08 | 22.0 | 4.12 | 4.01 | 1.03 | 1.03 | 1.03 | 0.021 | 1.69 | 14,6 | 10.0 | 16.5 | 0.75 | 0.08 | 0.75 | 8.8 |
| 989 + 1/2 | 64.34 | 0.04 | 22.5 | 4.12 | 4.00 | 1.03 | 1.03 | 1.03 | 0.023 | 1.77 | 15,8 | 9.7 | 16.1 | 0.75 | 0.08 | 0.75 | 8.4 |
| 990 | 63.66 | 0.12 | 23.0 | 4.15 | 3.99 | 1.04 | 1.04 | 1.04 | 0.032 | 1.71 | 5,1 | 9.5 | 15.6 | 0.75 | 0.08 | 0.75 | 8.1 |
| 990 + 1/2 | 62.75 | 0.14 | 23.7 | 4.06 | 3.97 | 1.02 | 1.02 | 1.02 | 0.030 | 1.57 | 14,7 | 9.0 | 19.8 | 0.75 | 0.08 | 0.75 | 8.0 |
| 991 | 62.13 | 0.05 | 24.3 | 4.02 | 3.94 | 1.02 | 1.01 | 1.01 | 0.026 | 1.65 | 14,7 | 9.0 | 28.6 | 0.75 | 0.10 | 0.75 | 8.0 |
| 991 + 1/2 | 61.60 | 0.01 | 24.8 | 3.99 | 3.91 | 1.02 | 1.02 | 1.02 | 0.030 | 1.69 | 7,0 | 8.6 | 25.5 | 0.75 | 0.10 | 0.75 | 8.0 |
| 992 | 61.08 | 0.06 | 25.4 | 3.99 | 3.90 | 1.02 | 1.03 | 1.02 | 0.029 | 1.72 | 13,6 | 8.2 | 16.8 | 0.75 | 0.10 | 0.75 | 8.0 |
| 992 + 1/2 | 60.45 | 0.07 | 26.0 | 3.96 | 3.88 | 1.02 | 1.02 | 1.02 | 0.031 | 1.99 | 14,8 | 8.0 | 17.0 | 0.74 | 0.10 | 0.74 | 8.0 |
| 993 | 59.69 | 0.01 | 26.3 | 3.91 | 3.88 | 1.01 | 1.00 | 1.00 | 0.053 | 2.14 | 14,8 | 7.7 | 23.0 | 0.74 | 0.11 | 0.74 | 8.0 |
| 993 + 1/2 | 58.95 | 0.05 | 27.1 | 3.88 | 3.87 | 1.00 | 1.00 | 1.00 | 0.038 | 2.19 | 13,7 | 7.9 | 22.0 | 0.74 | 0.09 | 0.74 | 8.0 |
| 994 | 58.33 | 0.06 | 27.5 | 3.88 | 3.85 | 1.01 | 1.00 | 1.00 | 0.055 | 2.27 | 13,7 | 8.8 | 23.1 | 0.74 | 0.09 | 0.74 | 8.0 |
| 994 + 1/2 | 57.58 | 0.14 | 28.1 | 3.89 | 3.83 | 1.01 | 1.01 | 1.01 | 0.059 | 2.15 | 13,8 | 10.3 | 23.9 | 0.74 | 0.11 | 0.74 | 8.0 |
| 995 | 57.13 | 0.01 | 29.1 | 3.82 | 3.79 | 1.01 | 0.99 | 0.99 | 0.048 | 2.38 | 13,8 | 11.4 | 22.3 | 0.73 | 0.12 | 0.73 | 8.0 |
| 995 + 1/2 | 56.70 | 0.12 | 29.9 | 3.75 | 3.76 | 1.00 | 1.00 | 1.00 | 0.032 | 2.54 | 13,8 | 13.4 | 22.3 | 0.73 | 0.14 | 0.73 | 8.0 |
| 996 | 56.02 | 0.02 | 30.3 | 3.68 | 3.72 | 0.99 | 0.99 | 0.99 | 0.036 | 2.04 | 13,8 | 15.0 | 32.5 | 0.73 | 0.17 | 0.73 | 8.0 |
| 996 + 1/2 | 55.38 | 0.02 | 30.9 | 3.69 | 3.70 | 1.00 | 1.00 | 1.00 | 0.031 | 2.00 | 12,7 | 17.3 | 37.6 | 0.73 | 0.22 | 0.73 | 8.0 |
| 997 | 54.77 | 0.06 | 31.5 | 3.69 | 3.69 | 1.00 | 1.00 | 1.00 | 0.035 | 2.11 | 12,7 | 20.7 | 39.7 | 0.72 | 0.32 | 0.72 | 8.0 |
| 997 + 1/2 | 54.04 | 0.06 | 31.8 | 3.70 | 3.69 | 1.00 | 1.00 | 1.00 | 0.032 | 2.31 | 12,8 | 26.3 | 34.4 | 0.72 | 0.33 | 0.72 | 8.0 |
| 998 | 53.19 | 0.08 | 32.1 | 3.68 | 3.69 | 1.00 | 1.00 | 1.00 | 0.033 | 2.63 | 12,8 | 32.5 | 42.6 | 0.72 | 0.42 | 0.71 | 8.0 |
| 998 + 1/2 | 52.19 | 0.01 | 32.4 | 3.69 | 3.65 | 1.01 | 1.01 | 1.01 | 0.032 | 2.62 | 12,8 | 39.4 | 51.6 | 0.71 | 0.48 | 0.70 | 8.0 |
| 999 | 51.16 | 0.02 | 32.8 | 3.62 | 3.64 | 0.99 | 1.00 | 0.99 | 0.032 | 2.38 | 3,0 | 46.7 | 61.6 | 0.71 | 0.59 | 0.68 | 8.0 |
| 999 + 1/2 | 50.19 | 0.03 | 32.9 | 3.59 | 3.58 | 1.00 | 0.99 | 0.99 | 0.068 | 2.23 | 4,0 | 53.1 | 70.9 | 0.70 | 0.67 | 0.67 | 8.0 |
| 1000 | 49.27 | 0.12 | 33.0 | 3.55 | 3.56 | 1.00 | 0.99 | 0.99 | 0.045 | 2.15 | 2,0 | 58.0 | 78.9 | 0.70 | 0.76 | 0.67 | 8.0 |
| 1000 + 1/2 | 48.60 | 0.10 | 33.0 | 3.52 | 3.53 | 1.00 | 1.01 | 1.00 | 0.037 | 2.30 | 2,0 | 60.4 | 84.6 | 0.69 | 0.77 | 0.65 | 8.0 |
| 1001 | 48.13 | 0.08 | 33.0 | 3.51 | 3.49 | 1.01 | 1.01 | 1.01 | 0.036 | 2.25 | 0,1 | 60.0 | 85.4 | 0.69 | 0.82 | 0.66 | 8.0 |
| 1001 + 1/2 | 47.83 | 0.03 | 33.0 | 3.44 | 3.49 | 0.99 | 1.01 | 0.99 | 0.031 | 2.47 | 0,1 | 59.1 | 84.3 | 0.69 | 0.86 | 0.61 | 8.0 |
| 1002 | 47.47 | 0.08 | 32.3 | 3.46 | 3.41 | 1.02 | 0.97 | 0.97 | 0.116 | 2.68 | 0,1 | 57.8 | 83.5 | 0.69 | 0.83 | 0.63 | 8.0 |
| 1002 + 1/2 | 46.96 | 0.02 | 32.7 | 3.37 | 3.33 | 1.01 | 1.02 | 1.01 | 0.039 | 2.51 | 2,8 | 56.5 | 81.7 | 0.69 | 0.86 | 0.60 | 8.0 |
| 1003 | 46.48 | 0.03 | 32.5 | 3.22 | 3.28 | 0.98 | 1.00 | 0.98 | 0.042 | 2.33 | 2,7 | 54.5 | 79.6 | 0.68 | 0.81 | 0.59 | 8.0 |
| 1003 + 1/2 | 46.06 | 0.03 | 32.4 | 3.19 | 3.19 | 1.00 | 0.99 | 0.99 | 0.059 | 2.40 | 2,7 | 51.9 | 76.9 | 0.67 | 0.81 | 0.57 | 8.0 |
| 1004 | 45.58 | 0.02 | 32.3 | 3.17 | 3.15 | 1.01 | 1.01 | 1.01 | 0.056 | 2.29 | 2,2 | 48.6 | 73.4 | 0.67 | 0.81 | 0.55 | 8.0 |
| 1004 + 1/2 | 45.06 | 0.02 | 32.0 | 3.11 | 3.12 | 1.00 | 0.99 | 0.99 | 0.038 | 2.81 | 5,8 | 45.0 | 68.9 | 0.67 | 0.81 | 0.53 | 8.0 |
| 1005 | 44.59 | 0.01 | 31.8 | 3.08 | 3.09 | 1.00 | 1.00 | 1.00 | 0.033 | 3.17 | 5,8 | 40.9 | 63.5 | 0.66 | 0.79 | 0.52 | 8.0 |
| 1005 + 1/2 | 44.13 | 0.02 | 31.5 | 3.06 | 3.05 | 1.00 | 1.00 | 1.00 | 0.048 | 3.06 | 5,8 | 36.4 | 56.8 | 0.64 | 0.74 | 0.52 | 8.0 |
| 1006 | 43.63 | 0.02 | 30.9 | 3.02 | 3.03 | 1.00 | 1.00 | 1.00 | 0.037 | 3.86 | 6,8 | 31.7 | 49.2 | 0.63 | 0.70 | 0.51 | 8.0 |
| 1006 + 1/2 | 43.18 | 0.02 | 30.5 | 3.01 | 2.98 | 1.01 | 1.01 | 1.01 | 0.038 | 3.76 | 5,7 | 26.5 | 40.7 | 0.62 | 0.64 | 0.49 | 8.0 |
| 1007 | 42.68 | 0.01 | 30.3 | 2.94 | 2.92 | 1.01 | 1.00 | 1.00 | 0.048 | 3.72 | 5,7 | 22.7 | 31.9 | 0.61 | 0.54 | 0.48 | 8.0 |
| 1007 + 1/2 | 42.16 | 0.01 | 29.8 | 2.83 | 2.86 | 0.99 | 0.99 | 0.99 | 0.037 | 3.01 | 6,7 | 20.5 | 25.9 | 0.60 | 0.46 | 0.47 | 8.0 |
| 1008 | 41.62 | 0.06 | 29.8 | 2.79 | 2.73 | 1.02 | 1.01 | 1.01 | 0.060 | 3.10 | 6,7 | 18.7 | 24.9 | 0.58 | 0.41 | 0.46 | 8.0 |
| 1008 + 1/2 | 41.21 | 0.06 | 28.9 | 2.64 | 2.66 | 0.99 | 0.99 | 0.99 | 0.044 | 2.46 | 6,7 | 18.0 | 23.9 | 0.57 | 0.42 | 0.45 | 8.0 |
| 1009 | 40.92 | 0.04 | 28.9 | 2.54 | 2.55 | 0.99 | 1.00 | 0.99 | 0.042 | 1.97 | 6,7 | 17.3 | 23.0 | 0.55 | 0.46 | 0.43 | 8.0 |
| 1009 + 1/2 | 40.71 | 0.08 | 28.5 | 2.46 | 2.45 | 1.00 | 1.00 | 1.00 | 0.037 | 1.78 | 5,3 | 16.9 | 22.5 | 0.54 | 0.50 | 0.42 | 8.0 |
| 1010 | 40.66 | 0.09 | 28.0 | 2.37 | 2.37 | 1.00 | 1.01 | 1.00 | 0.047 | 2.08 | 13,3 | 16.6 | 22.4 | 0.53 | 0.54 | 0.41 | 8.0 |
| 1010 + 1/2 | 40.78 | 0.09 | 27.9 | 2.28 | 2.29 | 0.99 | 0.99 | 0.99 | 0.043 | 1.73 | 13,3 | 16.0 | 22.5 | 0.51 | 0.59 | 0.40 | 8.0 |
| 1011 | 41.10 | 0.10 | 27.5 | 2.21 | 2.18 | 1.01 | 1.01 | 1.01 | 0.036 | 1.69 | 14,3 | 15.2 | 21.4 | 0.50 | 0.62 | 0.39 | 8.0 |
| 1011 + 1/2 | 41.61 | 0.09 | 27.0 | 2.09 | 2.11 | 0.99 | 0.99 | 0.99 | 0.038 | 1.86 | 15,5 | 14.3 | 20.4 | 0.48 | 0.64 | 0.38 | 8.0 |
| 1012 | 42.30 | 0.07 | 26.5 | 2.01 | 2.00 | 1.00 | 1.01 | 1.00 | 0.045 | 2.04 | 15,3 | 13.4 | 19.0 | 0.47 | 0.65 | 0.37 | 8.0 |
| 1012 + 1/2 | 43.14 | 0.08 | 26.3 | 1.91 | 1.93 | 0.99 | 0.99 | 0.99 | 0.048 | 2.20 | 15,3 | 12.4 | 17.6 | 0.45 | 0.63 | 0.36 | 8.0 |
| 1013 | 44.13 | 0.10 | 25.7 | 1.85 | 1.86 | 1.00 | 0.99 | 0.99 | 0.051 | 1.78 | 15,2 | 11.3 | 15.9 | 0.44 | 0.59 | 0.35 | 8.0 |
| 1013 + 1/2 | 45.32 | 0.12 | 25.1 | 1.77 | 1.83 | 0.97 | 0.95 | 0.95 | 0.067 | 1.64 | 15,2 | 10.2 | 14.1 | 0.43 | 0.54 | 0.34 | 8.0 |
| 1014 | 46.77 | 0.12 | 25.1 | 1.74 | 1.80 | 0.97 | 0.97 | 0.97 | 0.047 | 1.48 | 13,8 | 9.2 | 13.7 | 0.42 | 0.48 | 0.33 | 8.0 |
| 1014 + 1/2 | 48.45 | 0.09 | 24.2 | 1.71 | 1.80 | 0.95 | 0.92 | 0.92 | 0.083 | 1.60 | 0,1 | 8.3 | 13.4 | 0.40 | 0.39 | 0.32 | 8.0 |
| 1015 | 50.33 | 0.10 | 23.8 | 1.70 | 1.80 | 0.94 | 0.92 | 0.92 | 0.082 | 2.07 | 0,1 | 7.7 | 13.0 | 0.39 | 0.32 | 0.31 | 8.0 |
| 1015 + 1/2 | 52.41 | 0.02 | 22.9 | 1.67 | 1.79 | 0.93 | 0.91 | 0.91 | 0.087 | 1.99 | 0,1 | 7.5 | 13.3 | 0.38 | 0.25 | 0.30 | 8.0 |
| 1016 | 54.53 | 0.01 | 22.6 | 1.68 | 1.78 | 0.94 | 0.92 | 0.92 | 0.056 | 2.00 | 15,8 | 7.7 | 13.9 | 0.37 | 0.17 | 0.29 | 8.0 |
| 1016 + 1/2 | 56.66 | 0.02 | 21.8 | 1.66 | 1.78 | 0.93 | 0.92 | 0.92 | 0.058 | 1.74 | 0,6 | 7.9 | 13.3 | 0.37 | 0.13 | 0.28 | 8.0 |
| 1017 | 58.84 | 0.00 | 21.0 | 1.69 | 1.77 | 0.96 | 0.94 | 0.94 | 0.048 | 2.02 | 0,7 | 8.1 | 13.8 | 0.37 | 0.08 | 0.28 | 8.0 |
| 1017 + 1/2 | 61.02 | 0.04 | 20.3 | 1.69 | 1.76 | 0.96 | 0.93 | 0.93 | 0.052 | 2.32 | 0,7 | 7.7 | 13.1 | 0.36 | 0.07 | 0.27 | 8.0 |
| 1018 | 63.13 | 0.04 | 19.7 | 1.66 | 1.75 | 0.95 | 0.92 | 0.92 | 0.079 | 2.10 | 15,0 | 6.8 | 12.8 | 0.34 | 0.07 | 0.26 | 8.0 |
| 1018 + 1/2 | 65.14 | 0.12 | 19.0 | 1.69 | 1.75 | 0.96 | 0.94 | 0.94 | 0.046 | 2.50 | 15,0 | 6.1 | 13.4 | 0.35 | 0.10 | 0.25 | 8.0 |
| 1019 | 66.91 | 0.21 | 18.4 | 1.72 | 1.75 | 0.98 | 0.94 | 0.94 | 0.043 | 1.72 | 1,8 | 5.6 | 13.3 | 0.35 | 0.12 | 0.25 | 8.0 |
| 1019 + 1/2 | 68.26 | 0.23 | 17.7 | 1.71 | 1.75 | 0.97 | 0.95 | 0.95 | 0.042 | 2.11 | 8,0 | 5.1 | 13.1 | 0.34 | 0.10 | 0.24 | 8.0 |
| 1020 | 69.14 | 0.18 | 16.8 | 1.76 | 1.75 | 1.01 | 0.95 | 0.95 | 0.043 | 2.32 | 1,4 | 5.0 | 13.1 | 0.34 | 0.09 | 0.24 | 8.0 |
| 1020 + 1/2 | 69.66 | 0.11 | 16.2 | 1.80 | 1.74 | 1.03 | 0.99 | 0.99 | 0.024 | 1.70 | 1,7 | 4.5 | 12.8 | 0.34 | 0.09 | 0.23 | 8.0 |
| 1021 | 69.97 | 0.11 | 15.4 | 1.80 | 1.74 | 1.03 | 0.99 | 0.99 | 0.023 | 2.14 | 1,7 | 4.3 | 12.9 | 0.33 | 0.10 | 0.23 | 8.0 |
| 1021 + 1/2 | 70.06 | 0.03 | 14.8 | 1.79 | 1.74 | 1.02 | 1.00 | 1.00 | 0.033 | 1.87 | 1,0 | 4.0 | 11.6 | 0.32 | 0.09 | 0.22 | 8.0 |
| 1022 | 70.09 | 0.05 | 14.2 | 1.80 | 1.74 | 1.04 | 1.04 | 1.04 | 0.012 | 1.94 | 0,2 | 3.8 | 12.1 | 0.32 | 0.08 | 0.22 | 8.0 |
| 1022 + 1/2 | 70.01 | 0.06 | 13.5 | 1.83 | 1.74 | 1.05 | 1.05 | 1.05 | 0.027 | 1.72 | 0,2 | 3.7 | 11.7 | 0.31 | 0.09 | 0.21 | 8.0 |
| 1023 | 69.82 | 0.04 | 13.0 | 1.78 | 1.74 | 1.03 | 1.03 | 1.03 | 0.011 | 1.62 | 1,0 | 3.6 | 11.7 | 0.31 | 0.07 | 0.21 | 8.0 |
| 1023 + 1/2 | 69.56 | 0.03 | 12.3 | 1.74 | 1.74 | 1.00 | 1.00 | 1.00 | 0.012 | 1.77 | 13,3 | 3.4 | 10.8 | 0.30 | 0.07 | 0.20 | 8.0 |
| 1024 | 69.23 | 0.01 | 11.7 | 1.74 | 1.74 | 1.00 | 1.00 | 1.00 | 0.009 | 1.58 | 6,0 | 3.4 | 9.8 | 0.29 | 0.06 | 0.20 | 8.0 |
| 1024 + 1/2 | 68.88 | 0.01 | 11.3 | 1.75 | 1.74 | 1.01 | 1.01 | 1.01 | 0.006 | 1.63 | 3,1 | 3.3 | 9.3 | 0.28 | 0.05 | 0.20 | 8.0 |
| 1025 | 68.51 | 0.01 | 10.5 | 1.77 | 1.74 | 1.02 | 1.03 | 1.02 | 0.000 | 1.93 | 2,4 | 3.4 | 9.7 | 0.28 | 0.05 | 0.19 | 8.0 |
| 1025 + 1/2 | 68.12 | 0.00 | 10.0 | 1.74 | 1.74 | 1.00 | 1.01 | 1.00 | 0.020 | 2.19 | 2,4 | 3.4 | 9.6 | 0.27 | 0.04 | 0.19 | 8.0 |
| 1026 | 67.74 | 0.00 | 9.2 | 1.73 | 1.74 | 0.99 | 1.01 | 0.99 | 0.000 | 2.21 | 2,4 | 3.2 | 9.1 | 0.27 | 0.04 | 0.19 | 8.0 |
| 1026 + 1/2 | 67.36 | 0.01 | 8.6 | 1.77 | 1.74 | 1.02 | 1.03 | 1.02 | 0.001 | 2.25 | 3,6 | 2.8 | 7.8 | 0.26 | 0.03 | 0.18 | 8.0 |
| 1027 | 66.99 | 0.01 | 8.0 | 1.83 | 1.74 | 1.05 | 1.06 | 1.05 | 0.008 | 2.13 | 3,6 | 2.7 | 7.6 | 0.26 | 0.03 | 0.18 | 8.0 |
| 1027 + 1/2 | 66.65 | 0.01 | 7.4 | 1.81 | 1.74 | 1.04 | 1.05 | 1.04 | 0.001 | 2.58 | 3,5 | 2.5 | 6.6 | 0.25 | 0.02 | 0.18 | 8.0 |
| 1028 | 66.33 | 0.01 | 6.8 | 1.76 | 1.74 | 1.01 | 1.01 | 1.01 | 0.005 | 2.62 | 3,6 | 2.6 | 6.9 | 0.24 | 0.02 | 0.18 | 8.0 |
| 1028 + 1/2 | 66.02 | 0.01 | 6.1 | 1.72 | 1.74 | 0.99 | 1.00 | 0.99 | 0.001 | 2.98 | 3,3 | 2.6 | 6.9 | 0.23 | 0.02 | 0.17 | 8.0 |
| 1029 | 65.74 | 0.01 | 5.5 | 1.80 | 1.73 | 1.04 | 1.05 | 1.04 | 0.001 | 3.47 | 3,3 | 2.5 | 6.5 | 0.23 | 0.02 | 0.17 | 8.0 |
| 1029 + 1/2 | 65.49 | 0.02 | 4.8 | 1.80 | 1.72 | 1.05 | 1.05 | 1.05 | 0.013 | 2.76 | 3,3 | 2.4 | 6.0 | 0.23 | 0.02 | 0.17 | 8.0 |
| 1030 | 65.26 | 0.02 | 4.2 | 1.70 | 1.72 | 0.99 | 0.99 | 0.99 | 0.007 | 2.38 | 4,7 | 2.2 | 4.9 | 0.23 | 0.01 | 0.17 | 8.0 |
| 1030 + 1/2 | 65.07 | 0.01 | 3.5 | 1.57 | 1.71 | 0.92 | 0.92 | 0.92 | 0.006 | 2.88 | 4,7 | 1.9 | 4.7 | 0.22 | 0.01 | 0.17 | 8.0 |
| 1031 | 64.90 | 0.01 | 2.6 | 1.71 | 1.64 | 1.04 | 1.04 | 1.04 | 0.002 | 3.09 | 3,5 | 1.7 | 4.5 | 0.22 | 0.01 | 0.17 | 8.0 |
| 1031 + 1/2 | 64.75 | 0.01 | 1.9 | 1.72 | 1.54 | 1.11 | 1.11 | 1.11 | 0.007 | 2.87 | 3,2 | 1.4 | 3.5 | 0.22 | 0.01 | 0.17 | 8.0 |
| 1032 | 64.63 | 0.01 | 1.4 | 1.51 | 1.38 | 1.10 | 1.10 | 1.10 | 0.003 | 2.58 | 3,2 | 1.1 | 1.9 | 0.22 | 0.01 | 0.16 | 8.1 |
| 1032 + 1/2 | 64.53 | 0.01 | 0.9 | 1.18 | 1.22 | 0.97 | 0.97 | 0.97 | 0.004 | 1.91 | 5,0 | 1.1 | 1.8 | 0.21 | 0.01 | 0.16 | 8.1 |
| 1033 | 64.46 | 0.01 | 0.7 | 0.89 | 1.06 | 0.84 | 0.85 | 0.84 | 0.009 | 1.68 | 5,0 | 1.3 | 2.3 | 0.21 | 0.01 | 0.16 | 8.1 |
| 1033 + 1/2 | 64.39 | 0.01 | 0.5 | 0.68 | 0.94 | 0.72 | 0.74 | 0.72 | 0.000 | 1.20 | 15,4 | 1.8 | 3.2 | 0.21 | 0.01 | 0.16 | 8.0 |
| 1034 last | 64.34 | 0.00 | 0.4 | 0.61 | 0.94 | 0.65 | 0.67 | 0.65 | 0.006 | 1.09 | 6,5 | 2.0 | 3.3 | 0.21 | 0.01 | 0.16 | 8.0 |
| 1034 + 1/2 | 64.30 | 0.00 | 0.4 | 0.61 | 0.94 | 0.65 | 0.67 | 0.65 | 0.004 | 1.12 | 8,8 | 2.3 | 3.4 | 0.21 | 0.01 | 0.16 | 8.0 |
| 1035 | 64.26 | 0.00 | 0.4 | 0.61 | 0.94 | 0.65 | 0.67 | 0.65 | 0.004 | 1.14 | 1,2 | 2.7 | 4.1 | 0.21 | 0.02 | 0.16 | 8.0 |
| 1035 + 1/2 | 64.22 | 0.00 | 0.5 | 0.60 | 0.94 | 0.64 | 0.66 | 0.64 | 0.010 | 1.12 | 3,2 | 3.2 | 5.0 | 0.20 | 0.02 | 0.16 | 8.0 |
| 1036 | 64.18 | 0.00 | 0.4 | 0.60 | 0.94 | 0.64 | 0.66 | 0.64 | 0.006 | 1.10 | 2,5 | 3.9 | 6.6 | 0.21 | 0.03 | 0.15 | 8.0 |
| 1036 + 1/2 | 64.14 | 0.00 | 0.4 | 0.59 | 0.94 | 0.63 | 0.65 | 0.63 | 0.001 | 1.21 | 5,8 | 4.2 | 7.8 | 0.21 | 0.03 | 0.15 | 8.0 |
| 1037 | 64.11 | 0.00 | 0.4 | 0.56 | 0.94 | 0.59 | 0.62 | 0.59 | 0.001 | 1.12 | 12,7 | 4.8 | 8.6 | 0.21 | 0.04 | 0.15 | 8.0 |
| 1037 + 1/2 | 64.07 | 0.00 | 0.4 | 0.53 | 0.94 | 0.57 | 0.60 | 0.57 | 0.004 | 1.83 | 7,4 | 5.8 | 10.2 | 0.20 | 0.06 | 0.15 | 8.0 |
| 1038 | 64.03 | 0.00 | 0.5 | 0.62 | 0.94 | 0.66 | 0.70 | 0.66 | 0.004 | 3.35 | 7,4 | 7.0 | 11.2 | 0.20 | 0.07 | 0.15 | 8.0 |
| 1038 + 1/2 | 63.98 | 0.01 | 0.7 | 0.78 | 0.93 | 0.83 | 0.91 | 0.83 | 0.002 | 4.87 | 7,4 | 7.9 | 14.8 | 0.20 | 0.06 | 0.14 | 8.0 |
| 1039 | 63.93 | 0.01 | 1.1 | 0.86 | 0.93 | 0.93 | 1.04 | 0.93 | 0.005 | 4.27 | 7,4 |  |  |  |  |  |  |
| 1039 + 1/2 | 63.86 | 0.01 | 1.5 | 0.84 | 0.91 | 0.93 | 1.06 | 0.93 | 0.001 | 3.85 | 7,4 |  |  |  |  |  |  |
| 1040 | 63.77 | 0.02 | 2.1 | 0.92 | 0.85 | 1.09 | 1.21 | 1.09 | 0.002 | 3.45 | 7,4 |  |  |  |  |  |  |
| 1040 + 1/2 | 63.65 | 0.01 | 2.9 | 0.83 | 0.85 | 0.97 | 1.12 | 0.97 | 0.004 | 3.77 | 7,4 |  |  |  |  |  |  |
| 1041 | 63.50 | 0.02 | 3.6 | 0.93 | 0.83 | 1.13 | 1.29 | 1.13 | 0.019 | 3.90 | 3,4 |  |  |  |  |  |  |
| 1041 + 1/2 | 63.32 | 0.02 | 4.7 | 0.95 | 0.80 | 1.18 | 1.32 | 1.18 | 0.016 | 4.33 | 3,4 |  |  |  |  |  |  |
| 1042 | 63.09 | 0.03 | 5.8 | 0.97 | 0.80 | 1.21 | 1.37 | 1.21 | 0.026 | 4.35 | 4,2 |  |  |  |  |  |  |
| 1042 + 1/2 | 62.81 | 0.02 | 6.9 | 0.97 | 0.80 | 1.21 | 1.36 | 1.21 | 0.025 | 7.10 | 11,3 |  |  |  |  |  |  |
| 1043 | 62.48 | 0.03 | 8.0 | 1.02 | 0.80 | 1.28 | 1.35 | 1.28 | 0.037 | 7.97 | 11,3 |  |  |  |  |  |  |
| 1043 + 1/2 | 62.10 | 0.04 | 9.2 | 1.00 | 0.80 | 1.25 | 1.25 | 1.25 | 0.042 | 10.56 | 11,2 |  |  |  |  |  |  |
| 1044 | 61.64 | 0.06 | 10.3 | 1.07 | 0.80 | 1.34 | 1.36 | 1.34 | 0.037 | 15.22 | 11,2 |  |  |  |  |  |  |
| 1044 + 1/2 | 61.06 | 0.06 | 11.3 | 1.08 | 0.80 | 1.35 | 1.36 | 1.35 | 0.034 | 17.67 | 11,2 |  |  |  |  |  |  |
| 1045 | 60.35 | 0.10 | 12.1 | 1.15 | 0.80 | 1.43 | 1.33 | 1.33 | 0.035 | 15.19 | 11,2 |  |  |  |  |  |  |
| 1045 + 1/2 | 59.44 | 0.18 | 13.2 | 1.15 | 0.80 | 1.44 | 1.11 | 1.11 | 0.058 | 14.61 | 10,0 |  |  |  |  |  |  |
| 1046 | 58.17 | 0.33 | 13.6 | 0.98 | 0.80 | 1.22 | 1.05 | 1.05 | 0.053 | 9.28 | 10,0 |  |  |  |  |  |  |
| 1046 + 1/2 | 56.24 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

## place

### dive (mercury.dive, T at 760, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

### rise (mercury.rise, T at 977, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 2x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 27.25, uhd 95.78.

Largest mean difference: 2.146 at frame 870 (mercury.terrain), limit 12.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 0.746 at frame 870 (mercury.terrain), limit 3.2.
Largest level difference of one block (a grid of 16 by 9): 3.807 at frame 998 (mercury.rise), limit 12.
Largest level difference of the whole frame: -0.696 at frame 870 (mercury.terrain), limit 2.2.
Picture: out/work/smooth/mercury-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 615 | mercury.hold | 1.312 | 7.4 | 103 | 0.040 | 0.058 | 0.247 | 11.46 | 1.314 | 9,7 | 1.093 |
| 713 | mercury.dive | 1.388 | 8.7 | 115 | 0.236 | 0.238 | 0.396 | 15.16 | 3.480 | 6,3 | 1.117 |
| 735 | mercury.dive | 1.827 | 9.6 | 169 | -0.165 | -0.180 | 0.458 | 11.51 | 3.745 | 13,8 | 1.003 |
| 758 | mercury.dive | 2.042 | 12.7 | 170 | -0.593 | -0.597 | 0.662 | 8.66 | -1.931 | 10,5 | 1.014 |
| 870 | mercury.terrain | 2.146 | 14.5 | 102 | -0.696 | -0.735 | 0.746 | 8.20 | -2.055 | 12,5 | 0.880 |
| 979 | mercury.rise | 1.828 | 11.2 | 129 | -0.444 | -0.466 | 0.523 | 7.30 | -1.934 | 10,7 | 1.016 |
| 998 | mercury.rise | 1.917 | 10.9 | 112 | -0.117 | -0.141 | 0.452 | 11.39 | 3.807 | 12,8 | 1.006 |
| 1016 | mercury.rise | 1.436 | 8.8 | 121 | 0.116 | 0.140 | 0.300 | 10.13 | 1.559 | 9,7 | 1.151 |
| 1073 | mercury.travel | 1.294 | 7.9 | 37 | 0.002 | 0.003 | 0.153 | 1.91 | 0.034 | 0,6 | 1.469 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.

## counts

Film frames 540 to 1109 in order on one fresh page, 1140 pictures at rate 2, tier draft at preview, 7454 s. Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): 7 warm draws. Its work counts for that picture and stands in brackets. Judged: dive, rise and travel, every picture.

| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |
|---|---|---|---|---|---|---|---|
| mercury.hold | no | 300 | 1 | 540 | 22 | 132 | 115 |
| mercury.dive | yes | 180 | 0 |  | 0 | 0 | 0 |
| mercury.terrain | no | 360 | 0 |  | 0 | 0 | 0 |
| mercury.rise | yes | 150 | 0 |  | 0 | 0 | 0 |
| mercury.travel | yes | 150 | 0 |  | 0 | 0 | 0 |

Every picture with work (of the warm start call in brackets):

| frame | segment | programs | texture uploads | buffers | warm draws |
|---|---|---|---|---|---|
| 540 | mercury.hold | 22 (22) | 132 (132) | 115 (110) | 7 |
