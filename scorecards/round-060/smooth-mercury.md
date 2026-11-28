# smooth: mercury

Commit 262b9a68df0a6bda8d77518539580de554bb0dc5. Capture rate 2. Parts: path, pictures, place, parity, counts.

Joined from the files of 1 machine(s), nothing is rendered, measured or counted here. The path: /home/user/workspace/work/p6/hm9/05/mercury (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The pictures: the dive /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hm9/02/mercury-dive-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz); the rise /home/user/workspace/work/p6/hm9/03/mercury-rise-p1of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hm9/04/mercury-rise-p2of2 (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The place: /home/user/workspace/work/p6/hm9/05/mercury (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The parity: /home/user/workspace/work/p6/hm9/05/mercury (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz). The counts: /home/user/workspace/work/p6/hm9/06/mercury (space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

VERDICT: red. 2 numbers over the limit or not measured.

VERDICT BESIDE IT, the pictures read with the carry at the full size (the verdict above is the one that counts and makes the exit code): red. 4 numbers over the limit or not measured.

GROUND POP BESIDE IT, a number without a limit that makes no verdict (1.3 is named as the limit to come), read with the carry at the full size on the ground both frames show: largest 1.144 from frame 960 to the next, most at pixel 462, 222, a patch of 424 by 92 px; 0 of 424 rows read over 1.3 (pictures of the rise). It is not the line "The ground beside it" of the pictures: that line gives the change in place and the pattern on the surface view before a rise or after a dive, this number is read on the globe's ground through the move itself. Ground pop NOT READ on 2 of 426 rows, which says nothing of them, quiet or not: frame 791 + 1/2: the last frame of the window, no next frame to carry onto it; frame 1046 + 1/2: the last frame of the window, no next frame to carry onto it.

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
| 678 | hold orbit | 3.169e+0 | 0.006 |  |  | 0.045 |  |  | 0.036 |  |  | 0 |
| 679 | hold orbit | 3.168e+0 | 0.006 | 0.000 | 0.000 | 0.045 | 0.000 | 0.000 | 0.035 | 0.000 | 0.000 | 8 |
| 680 | hold orbit | 3.167e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.035 | 0.000 | 0.000 | 8 |
| 681 | hold orbit | 3.166e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.035 | 0.000 | 0.000 | 8 |
| 682 | hold orbit | 3.165e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.034 | 0.000 | 0.000 | 8 |
| 683 | hold orbit | 3.164e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.034 | 0.000 | 0.000 | 8 |
| 684 | hold orbit | 3.162e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.034 | 0.000 | 0.000 | 8 |
| 685 | hold orbit | 3.161e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 8 |
| 686 | hold orbit | 3.160e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 8 |
| 687 | hold orbit | 3.159e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 8 |
| 688 | hold orbit | 3.158e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 8 |
| 689 | hold orbit | 3.157e+0 | 0.006 | 0.000 | 0.000 | 0.046 | 0.000 | 0.000 | 0.033 | 0.000 | 0.000 | 8 |
| 690 first | dive orbit | 3.156e+0 | 0.006 | 0.000 | 0.002 | 0.046 | 0.000 | 0.001 | 0.033 | 0.000 | 0.001 | 8 |
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
| whole frames | rate | 0.07022 log of the height a film frame | 1.893 | 999 | 0.075 | 1019 |  |  | 0.004 | 0.009 | 0.000 | 0.000 | 0.064 at 1046 |
| whole frames | turn | 1.227 degrees a film frame | 2.011 | 999 | 0.063 | 1008 |  |  | 0.003 | 0.011 | 0.000 | 0.000 | 0.000 at 1039 |
| whole frames | speed | 5.656 px a film frame at the place | 1.747 | 1000 | 0.067 over 8 | 995 |  |  | 0.012 | 0.008 | 0.005 over 8 | 0.010 over 8 | 2.086 at 1044 |
| rate 2 | rate | 0.0698 log of the height a film frame | 1.905 | 998 + 1/2 | 0.076 | 1019 | 0.038 | 1018 + 1/2 | 0.005 | 0.007 | 0.000 | 0.000 | 0.072 at 1046 + 1/2 |
| rate 2 | turn | 1.219 degrees a film frame | 2.026 | 998 + 1/2 | 0.063 | 1008 | 0.032 | 1008 | 0.004 | 0.008 | 0.000 | 0.000 | 0.000 at 1039 + 1/2 |
| rate 2 | speed | 5.576 px a film frame at the place | 1.738 | 1000 | 0.066 over 8 | 994 + 1/2 | 0.038 over 8 | 1037 | 0.014 | 0.008 | 0.010 over 8 | 0.015 over 8 | 2.118 at 1043 + 1/2 |

The speed is a mean over 8 ground points on a ring round the place (a circle of 96 px in the picture). A point counts only where it lies on what the camera sees of the place's own surface: the sphere of the body. Each step and each fall or climb compares the mean over the points that count in every frame it compares: "over N" is their count. A row with fewer than 5 of the 8 is shown and not judged. Fewest points in a frame of the move: whole frames 8, rate 2 8.

Rows of the speed shown and not judged: whole frames 0, rate 2 0.

Limits: step 0.08 of the mean over one film frame, from 2 film frames before the segment to 2 after it; fall before the largest value and climb after it 0.03 of the mean, inside the segment. Steps further into the neighbours are shown and not judged.

The eye against the near ground at the seam with the surface view (film frame 960, 16 film frames to each side, read at rate 2): the way of the eye over its own height above the ground, per film frame, over the same number of the surface view itself (0.0145 of its height a film frame, the mean of its last 2 film frames). A step is named by the frame it ends on; `tools/seam.ts` names it by the frame it starts on. Lowest 0.93 at frame 944, limit 0.87; inside the rise itself 1.02 at frame 960 + 1/2. Largest step from one capture frame to the next 0.19 at frame 964 + 1/2, shown. The part along the surface view's own direction of motion: 0.12 at the lowest, lowest 0.12 at frame 944, shown; under 0 the eye goes back.

Rest between the rise and the travel (the seam into mercury.travel at film frame 1035, 12 film frames to each side, read at rate 2): a rise and the travel after it are one flight, through the seam the speed of the picture falls once and rises once and never comes to rest. The fastest point of the body's edge, px a film frame (the way of its centre and the growth of its radius, from the path alone): lowest 5.80 at frame 1036 + 1/2, against 25.54 at frame 1023 and 92.82 at frame 1046 + 1/2 at the ends of the window. The lowest is 0.227 of the slower end, limit 0.07. Near 0 the picture comes to rest between the rise and the travel.

No number of the path is over its limit.

Every film frame of the window. rate, turn and speed are over the mean of the move; step is the change from the film frame before; a star marks a step over 0.08.

| frame | segment and side | height | rate | step | step at rate 2 | turn | step | step at rate 2 | speed | step | step at rate 2 | points |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 948 | terrain terrain | 1.794e-2 | 0.177 |  |  | 0.003 |  |  | 0.502 |  |  | 0 |
| 949 | terrain terrain | 1.818e-2 | 0.189 | 0.012 | 0.012 | 0.003 | 0.000 | 0.000 | 0.501 | 0.001 | 0.013 | 8 |
| 950 | terrain terrain | 1.844e-2 | 0.197 | 0.008 | 0.007 | 0.003 | 0.000 | 0.000 | 0.483 | 0.018 | 0.026 | 8 |
| 951 | terrain terrain | 1.870e-2 | 0.200 | 0.003 | 0.003 | 0.003 | 0.000 | 0.000 | 0.455 | 0.028 | 0.032 | 8 |
| 952 | terrain terrain | 1.896e-2 | 0.201 | 0.000 | 0.001 | 0.003 | 0.000 | 0.000 | 0.423 | 0.031 | 0.032 | 8 |
| 953 | terrain terrain | 1.923e-2 | 0.199 | 0.001 | 0.002 | 0.003 | 0.000 | 0.000 | 0.395 | 0.029 | 0.028 | 8 |
| 954 | terrain terrain | 1.950e-2 | 0.197 | 0.002 | 0.002 | 0.003 | 0.000 | 0.000 | 0.372 | 0.023 | 0.022 | 8 |
| 955 | terrain terrain | 1.977e-2 | 0.195 | 0.002 | 0.002 | 0.003 | 0.000 | 0.000 | 0.355 | 0.017 | 0.016 | 8 |
| 956 | terrain terrain | 2.004e-2 | 0.194 | 0.002 | 0.001 | 0.003 | 0.000 | 0.000 | 0.344 | 0.011 | 0.011 | 8 |
| 957 | terrain terrain | 2.031e-2 | 0.193 | 0.001 | 0.001 | 0.003 | 0.000 | 0.000 | 0.337 | 0.007 | 0.007 | 8 |
| 958 | terrain terrain | 2.059e-2 | 0.193 | 0.000 | 0.000 | 0.003 | 0.000 | 0.000 | 0.332 | 0.005 | 0.004 | 8 |
| 959 | terrain terrain | 2.087e-2 | 0.193 | 0.000 | 0.001 | 0.003 | 0.000 | 0.000 | 0.329 | 0.003 | 0.003 | 8 |
| 960 first | rise terrain | 2.116e-2 | 0.194 | 0.001 | 0.001 | 0.003 | 0.000 | 0.001 | 0.327 | 0.002 | 0.008 | 8 |
| 961 | rise terrain | 2.145e-2 | 0.198 | 0.004 | 0.011 | 0.006 | 0.003 | 0.011 | 0.316 | 0.012 | 0.014 | 8 |
| 962 | rise terrain | 2.178e-2 | 0.214 | 0.016 | 0.024 | 0.023 | 0.017 | 0.026 | 0.311 | 0.005 | 0.003 | 8 |
| 963 | rise terrain | 2.215e-2 | 0.242 | 0.028 | 0.036 | 0.055 | 0.032 | 0.041 | 0.318 | 0.007 | 0.013 | 8 |
| 964 | rise terrain | 2.259e-2 | 0.282 | 0.040 | 0.046 | 0.101 | 0.046 | 0.053 | 0.334 | 0.017 | 0.021 | 8 |
| 965 | rise terrain | 2.312e-2 | 0.329 | 0.047 | 0.048 | 0.154 | 0.054 | 0.055 | 0.357 | 0.022 | 0.023 | 8 |
| 966 | rise terrain | 2.374e-2 | 0.376 | 0.047 | 0.047 | 0.208 | 0.054 | 0.055 | 0.380 | 0.023 | 0.024 | 8 |
| 967 | rise terrain | 2.446e-2 | 0.423 | 0.047 | 0.047 | 0.263 | 0.054 | 0.055 | 0.404 | 0.024 | 0.024 | 8 |
| 968 | rise terrain | 2.528e-2 | 0.469 | 0.046 | 0.046 | 0.317 | 0.055 | 0.055 | 0.428 | 0.024 | 0.024 | 8 |
| 969 | rise terrain | 2.621e-2 | 0.515 | 0.046 | 0.046 | 0.372 | 0.055 | 0.055 | 0.451 | 0.024 | 0.024 | 8 |
| 970 | rise terrain | 2.726e-2 | 0.560 | 0.045 | 0.046 | 0.427 | 0.055 | 0.056 | 0.475 | 0.024 | 0.024 | 8 |
| 971 | rise terrain | 2.844e-2 | 0.605 | 0.045 | 0.045 | 0.482 | 0.055 | 0.056 | 0.500 | 0.024 | 0.025 | 8 |
| 972 | rise terrain | 2.977e-2 | 0.650 | 0.045 | 0.045 | 0.538 | 0.056 | 0.056 | 0.525 | 0.025 | 0.025 | 8 |
| 973 | rise terrain | 3.126e-2 | 0.695 | 0.045 | 0.045 | 0.594 | 0.056 | 0.056 | 0.550 | 0.026 | 0.026 | 8 |
| 974 | rise terrain | 3.292e-2 | 0.739 | 0.045 | 0.045 | 0.650 | 0.056 | 0.057 | 0.577 | 0.026 | 0.027 | 8 |
| 975 | rise terrain | 3.479e-2 | 0.784 | 0.045 | 0.045 | 0.706 | 0.057 | 0.057 | 0.604 | 0.028 | 0.028 | 8 |
| 976 | rise terrain | 3.687e-2 | 0.829 | 0.045 | 0.045 | 0.763 | 0.057 | 0.058 | 0.633 | 0.029 | 0.030 | 8 |
| 977 T | rise terrain | 3.920e-2 | 0.874 | 0.045 | 0.045 | 0.821 | 0.057 | 0.058 | 0.664 | 0.030 | 0.031 | 8 |
| 978 | rise orbit | 4.182e-2 | 0.919 | 0.045 | 0.046 | 0.878 | 0.058 | 0.058 | 0.696 | 0.032 | 0.033 | 8 |
| 979 | rise orbit | 4.475e-2 | 0.965 | 0.046 | 0.046 | 0.936 | 0.058 | 0.059 | 0.729 | 0.034 | 0.035 | 8 |
| 980 | rise orbit | 4.804e-2 | 1.011 | 0.046 | 0.047 | 0.995 | 0.058 | 0.059 | 0.765 | 0.036 | 0.037 | 8 |
| 981 | rise orbit | 5.174e-2 | 1.058 | 0.047 | 0.047 | 1.054 | 0.059 | 0.060 | 0.803 | 0.038 | 0.039 | 8 |
| 982 | rise orbit | 5.592e-2 | 1.105 | 0.047 | 0.048 | 1.113 | 0.059 | 0.060 | 0.844 | 0.040 | 0.041 | 8 |
| 983 | rise orbit | 6.063e-2 | 1.153 | 0.048 | 0.049 | 1.173 | 0.060 | 0.060 | 0.886 | 0.042 | 0.044 | 8 |
| 984 | rise orbit | 6.597e-2 | 1.201 | 0.049 | 0.049 | 1.233 | 0.060 | 0.061 | 0.931 | 0.045 | 0.046 | 8 |
| 985 | rise orbit | 7.203e-2 | 1.251 | 0.049 | 0.050 | 1.293 | 0.060 | 0.061 | 0.978 | 0.047 | 0.048 | 8 |
| 986 | rise orbit | 7.892e-2 | 1.301 | 0.050 | 0.051 | 1.354 | 0.061 | 0.061 | 1.028 | 0.050 | 0.051 | 8 |
| 987 | rise orbit | 8.678e-2 | 1.352 | 0.051 | 0.052 | 1.415 | 0.061 | 0.062 | 1.080 | 0.052 | 0.053 | 8 |
| 988 | rise orbit | 9.577e-2 | 1.404 | 0.052 | 0.053 | 1.477 | 0.061 | 0.062 | 1.134 | 0.054 | 0.055 | 8 |
| 989 | rise orbit | 1.061e-1 | 1.457 | 0.053 | 0.054 | 1.538 | 0.062 | 0.062 | 1.191 | 0.057 | 0.057 | 8 |
| 990 | rise orbit | 1.180e-1 | 1.511 | 0.054 | 0.055 | 1.600 | 0.062 | 0.062 | 1.250 | 0.059 | 0.059 | 8 |
| 991 | rise orbit | 1.317e-1 | 1.566 | 0.055 | 0.055 | 1.662 | 0.062 | 0.063 | 1.311 | 0.061 | 0.061 | 8 |
| 992 | rise orbit | 1.475e-1 | 1.621 | 0.055 | 0.056 | 1.724 | 0.062 | 0.063 | 1.373 | 0.063 | 0.063 | 8 |
| 993 | rise orbit | 1.660e-1 | 1.677 | 0.056 | 0.057 | 1.787 | 0.062 | 0.063 | 1.438 | 0.065 | 0.065 | 8 |
| 994 | rise orbit | 1.875e-1 | 1.734 | 0.057 | 0.057 | 1.849 | 0.062 | 0.063 | 1.505 | 0.067 | 0.066 | 8 |
| 995 | rise orbit | 2.126e-1 | 1.790 | 0.056 | 0.056 | 1.909 | 0.061 | 0.061 | 1.572 | 0.067 | 0.066 | 8 |
| 996 | rise orbit | 2.418e-1 | 1.836 | 0.046 | 0.045 | 1.958 | 0.049 | 0.047 | 1.632 | 0.060 | 0.057 | 8 |
| 997 | rise orbit | 2.757e-1 | 1.869 | 0.033 | 0.031 | 1.992 | 0.033 | 0.032 | 1.681 | 0.048 | 0.046 | 8 |
| 998 | rise orbit | 3.148e-1 | 1.888 | 0.019 | 0.017 | 2.009 | 0.018 | 0.016 | 1.717 | 0.036 | 0.034 | 8 |
| 999 | rise orbit | 3.596e-1 | 1.893 | 0.005 | 0.005 | 2.011 | 0.001 | 0.009 | 1.739 | 0.023 | 0.020 | 8 |
| 1000 | rise orbit | 4.104e-1 | 1.882 | 0.011 | 0.021 | 1.995 | 0.016 | 0.027 | 1.747 | 0.008 | 0.005 | 8 |
| 1001 | rise orbit | 4.674e-1 | 1.855 | 0.027 | 0.037 | 1.962 | 0.033 | 0.044 | 1.739 | 0.008 | 0.018 | 8 |
| 1002 | rise orbit | 5.309e-1 | 1.812 | 0.043 | 0.052 | 1.912 | 0.050 | 0.059 | 1.714 | 0.025 | 0.033 | 8 |
| 1003 | rise orbit | 6.006e-1 | 1.758 | 0.053 | 0.055 | 1.851 | 0.061 | 0.062 | 1.678 | 0.036 | 0.037 | 8 |
| 1004 | rise orbit | 6.769e-1 | 1.704 | 0.055 | 0.055 | 1.789 | 0.062 | 0.063 | 1.639 | 0.039 | 0.039 | 8 |
| 1005 | rise orbit | 7.600e-1 | 1.649 | 0.055 | 0.056 | 1.727 | 0.063 | 0.063 | 1.599 | 0.040 | 0.041 | 8 |
| 1006 | rise orbit | 8.500e-1 | 1.593 | 0.055 | 0.056 | 1.664 | 0.063 | 0.063 | 1.557 | 0.042 | 0.042 | 8 |
| 1007 | rise orbit | 9.469e-1 | 1.537 | 0.056 | 0.056 | 1.601 | 0.063 | 0.063 | 1.513 | 0.044 | 0.044 | 8 |
| 1008 | rise orbit | 1.051e+0 | 1.481 | 0.056 | 0.057 | 1.538 | 0.063 | 0.063 | 1.468 | 0.045 | 0.045 | 8 |
| 1009 | rise orbit | 1.161e+0 | 1.424 | 0.057 | 0.057 | 1.475 | 0.063 | 0.063 | 1.421 | 0.047 | 0.047 | 8 |
| 1010 | rise orbit | 1.278e+0 | 1.367 | 0.057 | 0.058 | 1.412 | 0.063 | 0.063 | 1.372 | 0.048 | 0.049 | 8 |
| 1011 | rise orbit | 1.401e+0 | 1.310 | 0.057 | 0.058 | 1.350 | 0.063 | 0.063 | 1.322 | 0.050 | 0.050 | 8 |
| 1012 | rise orbit | 1.530e+0 | 1.253 | 0.058 | 0.058 | 1.287 | 0.063 | 0.063 | 1.271 | 0.051 | 0.051 | 8 |
| 1013 | rise orbit | 1.664e+0 | 1.195 | 0.058 | 0.058 | 1.225 | 0.062 | 0.063 | 1.218 | 0.053 | 0.053 | 8 |
| 1014 | rise orbit | 1.802e+0 | 1.137 | 0.058 | 0.058 | 1.162 | 0.062 | 0.063 | 1.165 | 0.054 | 0.054 | 8 |
| 1015 | rise orbit | 1.944e+0 | 1.079 | 0.058 | 0.058 | 1.100 | 0.062 | 0.062 | 1.110 | 0.055 | 0.055 | 8 |
| 1016 | rise orbit | 2.089e+0 | 1.021 | 0.058 | 0.058 | 1.039 | 0.062 | 0.062 | 1.054 | 0.056 | 0.056 | 8 |
| 1017 | rise orbit | 2.235e+0 | 0.961 | 0.060 | 0.066 | 0.977 | 0.061 | 0.062 | 0.997 | 0.057 | 0.059 | 8 |
| 1018 | rise orbit | 2.379e+0 | 0.891 | 0.070 | 0.075 | 0.916 | 0.061 | 0.062 | 0.936 | 0.060 | 0.059 | 8 |
| 1019 | rise orbit | 2.519e+0 | 0.816 | 0.075 | 0.076 | 0.855 | 0.061 | 0.061 | 0.886 | 0.050 | 0.047 | 8 |
| 1020 | rise orbit | 2.654e+0 | 0.744 | 0.072 | 0.071 | 0.794 | 0.061 | 0.061 | 0.858 | 0.028 | 0.023 | 8 |
| 1021 | rise orbit | 2.784e+0 | 0.681 | 0.064 | 0.063 | 0.734 | 0.060 | 0.061 | 0.857 | 0.001 | 0.009 | 8 |
| 1022 | rise orbit | 2.909e+0 | 0.626 | 0.055 | 0.054 | 0.674 | 0.060 | 0.061 | 0.865 | 0.008 | 0.009 | 8 |
| 1023 | rise orbit | 3.030e+0 | 0.579 | 0.047 | 0.046 | 0.614 | 0.060 | 0.060 | 0.867 | 0.002 | 0.004 | 8 |
| 1024 | rise orbit | 3.147e+0 | 0.537 | 0.042 | 0.041 | 0.554 | 0.060 | 0.060 | 0.859 | 0.008 | 0.011 | 8 |
| 1025 | rise orbit | 3.258e+0 | 0.497 | 0.040 | 0.042 | 0.494 | 0.060 | 0.060 | 0.847 | 0.012 | 0.013 | 8 |
| 1026 | rise orbit | 3.363e+0 | 0.452 | 0.044 | 0.050 | 0.435 | 0.059 | 0.060 | 0.838 | 0.009 | 0.008 | 8 |
| 1027 | rise orbit | 3.459e+0 | 0.399 | 0.053 | 0.057 | 0.376 | 0.059 | 0.060 | 0.840 | 0.002 | 0.006 | 8 |
| 1028 | rise orbit | 3.543e+0 | 0.343 | 0.056 | 0.056 | 0.317 | 0.059 | 0.059 | 0.842 | 0.001 | 0.006 | 8 |
| 1029 | rise orbit | 3.616e+0 | 0.291 | 0.052 | 0.052 | 0.258 | 0.059 | 0.059 | 0.833 | 0.009 | 0.013 | 8 |
| 1030 | rise orbit | 3.678e+0 | 0.241 | 0.050 | 0.050 | 0.199 | 0.059 | 0.059 | 0.819 | 0.014 | 0.015 | 8 |
| 1031 | rise orbit | 3.728e+0 | 0.192 | 0.049 | 0.049 | 0.140 | 0.059 | 0.059 | 0.804 | 0.014 | 0.014 | 8 |
| 1032 | rise orbit | 3.767e+0 | 0.146 | 0.047 | 0.046 | 0.084 | 0.057 | 0.056 | 0.793 | 0.011 | 0.010 | 8 |
| 1033 | rise orbit | 3.796e+0 | 0.111 | 0.035 | 0.033 | 0.040 | 0.044 | 0.042 | 0.785 | 0.008 | 0.008 | 8 |
| 1034 last | rise orbit | 3.820e+0 | 0.089 | 0.021 | 0.020 | 0.012 | 0.028 | 0.026 | 0.778 | 0.007 | 0.008 | 8 |
| 1035 | travel orbit | 3.841e+0 | 0.081 | 0.009 | 0.007 | 0.001 | 0.011 | 0.008 | 0.771 | 0.008 | 0.008 | 8 |
| 1036 | travel orbit | 3.863e+0 | 0.079 | 0.002 | 0.001 | 0.002 | 0.000 | 0.000 | 0.765 | 0.006 | 0.006 | 8 |
| 1037 | travel orbit | 3.884e+0 | 0.077 | 0.001 | 0.002 | 0.002 | 0.000 | 0.000 | 0.799 | 0.034 | 0.246 * | 8 |
| 1038 | travel orbit | 3.906e+0 | 0.081 | 0.004 | 0.010 | 0.002 | 0.000 | 0.000 | 1.346 | 0.547 * | 1.095 * | 8 |
| 1039 | travel orbit | 3.932e+0 | 0.093 | 0.012 | 0.014 | 0.001 | 0.000 | 0.000 | 2.624 | 1.278 * | 1.447 * | 8 |
| 1040 | travel orbit | 3.961e+0 | 0.107 | 0.013 | 0.014 | 0.001 | 0.000 | 0.000 | 4.028 | 1.405 * | 1.456 * | 8 |
| 1041 | travel orbit | 3.996e+0 | 0.123 | 0.017 | 0.022 | 0.001 | 0.000 | 0.000 | 5.604 | 1.576 * | 1.849 * | 8 |
| 1042 | travel orbit | 4.038e+0 | 0.148 | 0.025 | 0.030 | 0.001 | 0.000 | 0.000 | 7.525 | 1.921 * | 2.063 * | 8 |
| 1043 | travel orbit | 4.090e+0 | 0.182 | 0.033 | 0.039 | 0.001 | 0.000 | 0.000 | 9.588 | 2.063 * | 2.118 * | 8 |
| 1044 | travel orbit | 4.154e+0 | 0.224 | 0.042 | 0.049 | 0.001 | 0.000 | 0.000 | 11.674 | 2.086 * | 2.116 * | 8 |
| 1045 | travel orbit | 4.236e+0 | 0.276 | 0.052 | 0.060 | 0.001 | 0.000 | 0.000 | 13.746 | 2.072 * | 2.103 * | 8 |
| 1046 | travel orbit | 4.338e+0 | 0.341 | 0.064 | 0.072 | 0.001 | 0.000 | 0.000 | 15.823 | 2.078 * | 2.111 * | 8 |

## pictures

Tier draft, rate 2, 34.08 s a rendered frame on space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz.

The dive is joined from 2 parts: /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2 (capture frames 1356 to 1469, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hm9/02/mercury-dive-p2of2 (capture frames 1470 to 1583, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

The rise is joined from 2 parts: /home/user/workspace/work/p6/hm9/03/mercury-rise-p1of2 (capture frames 1896 to 1994, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz), /home/user/workspace/work/p6/hm9/04/mercury-rise-p2of2 (capture frames 1995 to 2093, space-sandbox 4x Intel(R) Xeon(R) Processor @ 2.90GHz).

### dive (mercury.dive, frames 690 to 779, window 678 to 791, 228 draft frames at rate 2)

Largest level step: 0.33 at frame 722 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.09 from frame 704 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 4.35 from frame 722 + 1/2 to the next, block column 11 row 0 from the top left, shown, not judged.
Largest change in place: 34.2 from frame 729 + 1/2 to 8 film frames later, most at pixel 1244, 180 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.56 from frame 721 + 1/2 to 8 film frames later, most at pixel 1364, 888, band 8.6 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 780 to 791 + 1/2): change 3.9, pattern 0.03.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 702 + 1/2 in /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2-pops.png, frame 703 in /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2-pops.png, frame 703 + 1/2 in /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2-pops.png, frame 704 + 1/2 in /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 691 + 1/2 in /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2-changes.png, frame 721 + 1/2 in /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2-changes.png, frame 729 + 1/2 in /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2-changes.png, frame 737 + 1/2 in no panel (a slice --frames 1475-1475 draws it).

- RED the pattern of the picture changes in place by 0.56 from frame 721 + 1/2 to 8 film frames later, band 8.6 px, limit 0.45 (7 frames over it, first 720)

| frame | level | level step | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pattern | judged | band px |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 678 | 63.41 |  | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.005 | 1.16 | 4,8 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 678 + 1/2 | 63.36 | 0.00 | 0.7 | 0.61 | 0.61 | 0.99 | 0.99 | 0.99 | 0.005 | 1.10 | 1,6 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 679 | 63.32 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.010 | 1.10 | 2,4 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 679 + 1/2 | 63.28 | 0.00 | 0.7 | 0.61 | 0.61 | 1.00 | 1.01 | 1.00 | 0.002 | 1.16 | 4,0 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 680 | 63.24 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.008 | 1.16 | 1,6 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 680 + 1/2 | 63.19 | 0.00 | 0.7 | 0.60 | 0.61 | 0.99 | 0.99 | 0.99 | 0.007 | 1.18 | 1,6 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 681 | 63.15 | 0.00 | 0.7 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 3,6 | 0.8 | 0.8 | 0.30 | 0.01 | 0.24 | 8.0 |
| 681 + 1/2 | 63.11 | 0.00 | 0.7 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.009 | 1.10 | 0,6 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 682 | 63.06 | 0.00 | 0.7 | 0.61 | 0.61 | 1.00 | 1.01 | 1.00 | 0.002 | 1.13 | 1,5 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 682 + 1/2 | 63.02 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 1,6 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 683 | 62.98 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.003 | 1.17 | 3,6 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 683 + 1/2 | 62.93 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.000 | 1.24 | 3,6 | 0.8 | 0.9 | 0.30 | 0.01 | 0.24 | 8.0 |
| 684 | 62.89 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.002 | 1.12 | 9,0 | 0.8 | 1.0 | 0.29 | 0.00 | 0.24 | 8.0 |
| 684 + 1/2 | 62.85 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.007 | 1.19 | 1,7 | 0.8 | 1.3 | 0.29 | 0.00 | 0.24 | 8.0 |
| 685 | 62.81 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.009 | 1.14 | 13,0 | 0.9 | 1.5 | 0.29 | 0.00 | 0.24 | 8.0 |
| 685 + 1/2 | 62.76 | 0.00 | 0.8 | 0.61 | 0.61 | 1.00 | 0.99 | 0.99 | 0.011 | 1.13 | 3,6 | 0.9 | 1.7 | 0.29 | 0.00 | 0.24 | 8.0 |
| 686 | 62.72 | 0.00 | 0.7 | 0.61 | 0.61 | 0.99 | 0.99 | 0.99 | 0.000 | 1.10 | 13,2 | 1.0 | 2.0 | 0.29 | 0.01 | 0.24 | 8.0 |
| 686 + 1/2 | 62.68 | 0.00 | 0.7 | 0.61 | 0.61 | 1.00 | 1.00 | 1.00 | 0.002 | 1.15 | 14,8 | 1.2 | 2.4 | 0.29 | 0.01 | 0.24 | 8.0 |
| 687 | 62.63 | 0.00 | 0.7 | 0.62 | 0.61 | 1.01 | 1.01 | 1.01 | 0.004 | 1.14 | 1,7 | 1.4 | 2.6 | 0.29 | 0.02 | 0.24 | 8.0 |
| 687 + 1/2 | 62.59 | 0.00 | 0.8 | 0.62 | 0.61 | 1.01 | 1.00 | 1.00 | 0.011 | 1.17 | 13,6 | 1.7 | 3.2 | 0.29 | 0.03 | 0.24 | 8.1 |
| 688 | 62.54 | 0.00 | 0.7 | 0.61 | 0.62 | 0.99 | 0.99 | 0.99 | 0.005 | 1.12 | 15,6 | 2.0 | 3.6 | 0.29 | 0.06 | 0.24 | 8.1 |
| 688 + 1/2 | 62.50 | 0.00 | 0.8 | 0.61 | 0.62 | 0.99 | 0.99 | 0.99 | 0.013 | 1.10 | 9,3 | 2.2 | 3.9 | 0.29 | 0.09 | 0.24 | 8.1 |
| 689 | 62.46 | 0.00 | 0.8 | 0.62 | 0.62 | 1.00 | 1.00 | 1.00 | 0.006 | 1.13 | 4,7 | 2.6 | 4.4 | 0.29 | 0.14 | 0.24 | 8.2 |
| 689 + 1/2 | 62.41 | 0.00 | 0.8 | 0.62 | 0.62 | 1.00 | 1.00 | 1.00 | 0.002 | 1.17 | 13,6 | 2.8 | 4.9 | 0.29 | 0.19 | 0.24 | 8.2 |
| 690 first | 62.37 | 0.00 | 0.8 | 0.61 | 0.62 | 0.99 | 0.99 | 0.99 | 0.000 | 1.19 | 5,8 | 3.0 | 5.1 | 0.29 | 0.29 | 0.24 | 8.3 |
| 690 + 1/2 | 62.33 | 0.01 | 0.7 | 0.62 | 0.63 | 0.99 | 0.98 | 0.98 | 0.013 | 1.07 | 5,0 | 3.3 | 5.6 | 0.29 | 0.38 | 0.24 | 8.4 |
| 691 | 62.30 | 0.01 | 0.7 | 0.64 | 0.64 | 0.99 | 1.00 | 0.99 | 0.001 | 1.18 | 5,1 | 3.5 | 6.0 | 0.29 | 0.42 | 0.24 | 8.4 |
| 691 + 1/2 | 62.29 | 0.01 | 0.6 | 0.67 | 0.67 | 0.99 | 0.98 | 0.98 | 0.019 | 1.46 | 5,1 | 3.7 | 5.9 | 0.29 | 0.449 | 0.24 | 8.6 |
| 692 | 62.32 | 0.02 | 0.6 | 0.71 | 0.73 | 0.97 | 0.97 | 0.97 | 0.018 | 1.87 | 5,1 | 3.7 | 6.3 | 0.30 | 0.44 | 0.24 | 8.7 |
| 692 + 1/2 | 62.38 | 0.02 | 0.9 | 0.80 | 0.81 | 0.98 | 0.98 | 0.98 | 0.006 | 2.18 | 5,1 | 3.8 | 6.3 | 0.30 | 0.38 | 0.24 | 8.9 |
| 693 | 62.49 | 0.02 | 1.0 | 0.92 | 0.92 | 1.00 | 1.00 | 1.00 | 0.004 | 2.02 | 5,1 | 3.9 | 5.8 | 0.30 | 0.31 | 0.23 | 9.0 |
| 693 + 1/2 | 62.64 | 0.03 | 1.3 | 1.03 | 1.02 | 1.01 | 1.01 | 1.01 | 0.002 | 1.96 | 5,1 | 3.8 | 5.6 | 0.30 | 0.23 | 0.23 | 9.1 |
| 694 | 62.84 | 0.02 | 1.5 | 1.13 | 1.12 | 1.01 | 1.01 | 1.01 | 0.005 | 1.86 | 5,1 | 3.9 | 5.4 | 0.29 | 0.21 | 0.23 | 9.3 |
| 694 + 1/2 | 63.09 | 0.03 | 1.9 | 1.20 | 1.19 | 1.01 | 1.02 | 1.01 | 0.008 | 1.76 | 5,1 | 4.2 | 5.9 | 0.29 | 0.20 | 0.23 | 9.6 |
| 695 | 63.40 | 0.02 | 2.1 | 1.24 | 1.25 | 0.99 | 0.99 | 0.99 | 0.007 | 1.61 | 9,3 | 4.4 | 6.4 | 0.29 | 0.18 | 0.23 | 9.8 |
| 695 + 1/2 | 63.75 | 0.02 | 2.4 | 1.30 | 1.29 | 1.01 | 1.01 | 1.01 | 0.010 | 1.62 | 9,3 | 4.6 | 6.6 | 0.28 | 0.15 | 0.22 | 8.4 |
| 696 | 64.15 | 0.02 | 2.8 | 1.33 | 1.32 | 1.01 | 1.01 | 1.01 | 0.016 | 1.64 | 14,6 | 4.6 | 6.3 | 0.28 | 0.12 | 0.22 | 8.3 |
| 696 + 1/2 | 64.59 | 0.02 | 3.0 | 1.35 | 1.33 | 1.01 | 1.02 | 1.01 | 0.006 | 1.63 | 12,1 | 4.7 | 6.5 | 0.28 | 0.11 | 0.23 | 8.6 |
| 697 | 65.09 | 0.03 | 3.2 | 1.36 | 1.34 | 1.01 | 1.02 | 1.01 | 0.017 | 1.71 | 14,6 | 5.0 | 6.7 | 0.28 | 0.15 | 0.02 | 8.0 |
| 697 + 1/2 | 65.63 | 0.02 | 3.7 | 1.35 | 1.35 | 1.00 | 1.00 | 1.00 | 0.010 | 1.70 | 12,2 | 5.1 | 6.9 | 0.28 | 0.14 | 0.22 | 8.7 |
| 698 | 66.23 | 0.02 | 4.0 | 1.34 | 1.36 | 0.99 | 0.99 | 0.99 | 0.013 | 1.86 | 12,6 | 5.1 | 7.6 | 0.28 | 0.14 | 0.22 | 8.9 |
| 698 + 1/2 | 66.87 | 0.02 | 4.3 | 1.35 | 1.38 | 0.98 | 0.97 | 0.97 | 0.020 | 1.77 | 12,6 | 5.3 | 8.9 | 0.28 | 0.16 | 0.08 | 8.0 |
| 699 | 67.56 | 0.02 | 4.5 | 1.40 | 1.40 | 1.00 | 1.01 | 1.00 | 0.014 | 1.93 | 12,6 | 5.3 | 8.3 | 0.27 | 0.15 | 0.23 | 9.2 |
| 699 + 1/2 | 68.28 | 0.02 | 4.9 | 1.43 | 1.42 | 1.01 | 1.04 | 1.01 | 0.007 | 1.68 | 11,1 | 5.5 | 7.2 | 0.27 | 0.22 | 0.14 | 8.0 |
| 700 | 69.04 | 0.02 | 5.3 | 1.48 | 1.43 | 1.04 | 1.08 | 1.04 | 0.013 | 1.70 | 11,1 | 6.1 | 7.9 | 0.27 | 0.22 | 0.17 | 8.0 |
| 700 + 1/2 | 69.82 | 0.02 | 5.5 | 1.51 | 1.43 | 1.05 | 1.09 | 1.05 | 0.018 | 1.83 | 2,7 | 6.9 | 8.6 | 0.27 | 0.24 | 0.19 | 8.0 |
| 701 | 70.64 | 0.01 | 6.1 | 1.55 | 1.43 | 1.08 | 1.10 | 1.08 | 0.020 | 1.98 | 11,1 | 7.6 | 9.8 | 0.27 | 0.29 | 0.22 | 8.0 |
| 701 + 1/2 | 71.48 | 0.02 | 6.2 | 1.53 | 1.43 | 1.07 | 1.09 | 1.07 | 0.040 | 2.10 | 11,1 | 8.1 | 11.2 | 0.28 | 0.31 | 0.23 | 8.0 |
| 702 | 72.27 | 0.02 | 6.6 | 1.54 | 1.43 | 1.08 | 1.11 | 1.08 | 0.015 | 2.28 | 2,7 | 8.5 | 12.2 | 0.28 | 0.34 | 0.25 | 8.0 |
| 702 + 1/2 | 73.03 | 0.01 | 7.2 | 1.55 | 1.43 | 1.08 | 1.11 | 1.08 | 0.038 | 2.32 | 2,7 | 9.0 | 12.9 | 0.27 | 0.38 | 0.26 | 8.0 |
| 703 | 73.77 | 0.01 | 7.2 | 1.55 | 1.43 | 1.09 | 1.11 | 1.09 | 0.034 | 2.47 | 2,7 | 9.2 | 14.2 | 0.28 | 0.39 | 0.27 | 8.0 |
| 703 + 1/2 | 74.48 | 0.01 | 7.7 | 1.56 | 1.43 | 1.09 | 1.12 | 1.09 | 0.047 | 2.25 | 11,2 | 9.9 | 15.1 | 0.28 | 0.41 | 0.28 | 8.0 |
| 704 | 75.18 | 0.02 | 7.9 | 1.55 | 1.43 | 1.08 | 1.11 | 1.08 | 0.038 | 2.38 | 10,1 | 10.2 | 16.4 | 0.28 | 0.43 | 0.30 | 8.0 |
| 704 + 1/2 | 75.84 | 0.01 | 8.7 | 1.58 | 1.44 | 1.09 | 1.12 | 1.09 | 0.041 | 2.60 | 10,1 | 10.8 | 17.6 | 0.28 | 0.42 | 0.31 | 8.0 |
| 705 | 76.47 | 0.02 | 8.9 | 1.57 | 1.46 | 1.08 | 1.09 | 1.08 | 0.033 | 2.44 | 10,1 | 11.2 | 19.0 | 0.29 | 0.41 | 0.31 | 8.0 |
| 705 + 1/2 | 77.06 | 0.03 | 9.3 | 1.56 | 1.47 | 1.06 | 1.08 | 1.06 | 0.025 | 2.15 | 10,1 | 11.8 | 20.3 | 0.28 | 0.41 | 0.32 | 8.0 |
| 706 | 77.60 | 0.04 | 9.9 | 1.54 | 1.49 | 1.03 | 1.05 | 1.03 | 0.035 | 2.38 | 10,1 | 12.4 | 21.8 | 0.28 | 0.38 | 0.33 | 8.0 |
| 706 + 1/2 | 78.07 | 0.04 | 10.2 | 1.50 | 1.51 | 0.99 | 0.99 | 0.99 | 0.054 | 2.52 | 10,1 | 12.7 | 22.4 | 0.28 | 0.37 | 0.24 | 11.6 |
| 707 | 78.46 | 0.05 | 10.8 | 1.47 | 1.52 | 0.97 | 0.93 | 0.93 | 0.046 | 1.71 | 10,0 | 12.7 | 22.5 | 0.28 | 0.34 | 0.24 | 11.7 |
| 707 + 1/2 | 78.75 | 0.04 | 11.0 | 1.44 | 1.53 | 0.94 | 0.91 | 0.91 | 0.062 | 1.62 | 10,0 | 13.0 | 22.1 | 0.28 | 0.32 | 0.24 | 11.8 |
| 708 | 78.96 | 0.05 | 11.6 | 1.43 | 1.54 | 0.93 | 0.90 | 0.90 | 0.048 | 1.31 | 10,0 | 13.2 | 21.3 | 0.29 | 0.30 | 0.24 | 11.9 |
| 708 + 1/2 | 79.08 | 0.04 | 11.8 | 1.42 | 1.54 | 0.92 | 0.89 | 0.89 | 0.061 | 1.41 | 1,8 | 13.6 | 20.9 | 0.28 | 0.28 | 0.24 | 11.9 |
| 709 | 79.11 | 0.03 | 12.5 | 1.39 | 1.54 | 0.90 | 0.88 | 0.88 | 0.073 | 1.57 | 12,0 | 14.1 | 20.5 | 0.28 | 0.26 | 0.24 | 11.9 |
| 709 + 1/2 | 79.10 | 0.03 | 12.8 | 1.39 | 1.54 | 0.90 | 0.87 | 0.87 | 0.062 | 1.59 | 12,0 | 14.5 | 19.8 | 0.28 | 0.25 | 0.24 | 11.3 |
| 710 | 79.02 | 0.05 | 13.3 | 1.37 | 1.55 | 0.89 | 0.87 | 0.87 | 0.110 | 1.49 | 11,4 | 15.0 | 20.0 | 0.28 | 0.25 | 0.40 | 8.0 |
| 710 + 1/2 | 78.84 | 0.04 | 13.6 | 1.40 | 1.55 | 0.90 | 0.88 | 0.88 | 0.070 | 1.45 | 15,4 | 15.5 | 20.0 | 0.28 | 0.26 | 0.24 | 11.4 |
| 711 | 78.58 | 0.03 | 13.8 | 1.41 | 1.56 | 0.91 | 0.88 | 0.88 | 0.098 | 1.81 | 15,3 | 16.0 | 20.1 | 0.28 | 0.24 | 0.42 | 8.0 |
| 711 + 1/2 | 78.25 | 0.05 | 14.3 | 1.42 | 1.56 | 0.91 | 0.89 | 0.89 | 0.091 | 2.19 | 15,3 | 16.4 | 20.6 | 0.28 | 0.23 | 0.24 | 11.5 |
| 712 | 77.83 | 0.06 | 14.6 | 1.45 | 1.56 | 0.93 | 0.89 | 0.89 | 0.123 | 2.43 | 15,3 | 16.8 | 21.5 | 0.29 | 0.21 | 0.24 | 11.5 |
| 712 + 1/2 | 77.29 | 0.14 | 15.6 | 1.51 | 1.57 | 0.96 | 0.92 | 0.92 | 0.166 | 2.52 | 15,3 | 17.5 | 22.7 | 0.29 | 0.18 | 0.24 | 11.6 |
| 713 | 76.46 | 0.17 | 15.4 | 1.53 | 1.58 | 0.97 | 0.93 | 0.93 | 0.118 | 2.68 | 15,2 | 18.0 | 23.5 | 0.29 | 0.17 | 0.24 | 11.7 |
| 713 + 1/2 | 75.28 | 0.14 | 15.7 | 1.60 | 1.60 | 1.00 | 0.99 | 0.99 | 0.105 | 3.01 | 15,2 | 18.0 | 23.6 | 0.29 | 0.15 | 0.24 | 8.9 |
| 714 | 73.82 | 0.07 | 16.0 | 1.64 | 1.65 | 1.00 | 1.00 | 1.00 | 0.060 | 3.31 | 15,0 | 17.9 | 22.9 | 0.30 | 0.18 | 0.24 | 8.9 |
| 714 + 1/2 | 72.23 | 0.06 | 15.8 | 1.70 | 1.70 | 1.00 | 0.99 | 0.99 | 0.110 | 2.44 | 15,0 | 18.9 | 24.0 | 0.30 | 0.20 | 0.25 | 8.8 |
| 715 | 70.52 | 0.03 | 16.4 | 1.76 | 1.74 | 1.01 | 1.01 | 1.01 | 0.098 | 1.76 | 15,0 | 20.1 | 24.7 | 0.30 | 0.22 | 0.25 | 8.7 |
| 715 + 1/2 | 68.75 | 0.03 | 16.5 | 1.79 | 1.82 | 0.99 | 1.00 | 0.99 | 0.084 | 1.85 | 14,1 | 21.3 | 24.6 | 0.30 | 0.23 | 0.25 | 8.7 |
| 716 | 66.92 | 0.01 | 16.9 | 1.87 | 1.85 | 1.01 | 1.00 | 1.00 | 0.137 | 2.00 | 14,1 | 22.1 | 26.5 | 0.30 | 0.23 | 0.25 | 8.7 |
| 716 + 1/2 | 65.07 | 0.01 | 17.0 | 1.91 | 1.92 | 0.99 | 1.00 | 0.99 | 0.145 | 1.89 | 14,0 | 22.7 | 28.7 | 0.30 | 0.24 | 0.25 | 8.6 |
| 717 | 63.24 | 0.02 | 17.2 | 1.96 | 1.96 | 1.00 | 1.00 | 1.00 | 0.115 | 1.68 | 5,6 | 23.3 | 29.4 | 0.29 | 0.24 | 0.25 | 8.6 |
| 717 + 1/2 | 61.37 | 0.03 | 17.5 | 2.02 | 1.99 | 1.01 | 1.02 | 1.01 | 0.082 | 1.86 | 13,0 | 23.6 | 29.1 | 0.29 | 0.26 | 0.26 | 9.2 |
| 718 | 59.44 | 0.01 | 17.4 | 2.02 | 2.04 | 0.99 | 0.99 | 0.99 | 0.142 | 2.16 | 13,0 | 23.8 | 27.0 | 0.29 | 0.32 | 0.26 | 9.1 |
| 718 + 1/2 | 57.54 | 0.02 | 17.9 | 2.06 | 2.05 | 1.00 | 1.00 | 1.00 | 0.120 | 1.95 | 5,6 | 24.2 | 27.5 | 0.28 | 0.32 | 0.26 | 9.1 |
| 719 | 55.66 | 0.01 | 18.2 | 2.09 | 2.08 | 1.00 | 1.01 | 1.00 | 0.111 | 2.04 | 12,0 | 24.5 | 29.1 | 0.28 | 0.37 | 0.26 | 9.0 |
| 719 + 1/2 | 53.77 | 0.01 | 18.2 | 2.10 | 2.11 | 0.99 | 1.00 | 0.99 | 0.110 | 2.34 | 12,0 | 24.6 | 28.4 | 0.28 | 0.42 | 0.26 | 9.0 |
| 720 | 51.87 | 0.03 | 18.9 | 2.14 | 2.13 | 1.01 | 1.02 | 1.01 | 0.088 | 2.15 | 6,2 | 24.6 | 29.4 | 0.28 | 0.47 | 0.27 | 8.9 |
| 720 + 1/2 | 50.03 | 0.01 | 18.9 | 2.15 | 2.21 | 0.98 | 0.97 | 0.97 | 0.146 | 2.26 | 11,0 | 25.0 | 30.2 | 0.28 | 0.46 | 0.27 | 8.9 |
| 721 | 48.21 | 0.04 | 19.0 | 2.28 | 2.24 | 1.02 | 1.00 | 1.00 | 0.140 | 3.79 | 11,0 | 25.6 | 31.1 | 0.28 | 0.51 | 0.27 | 8.8 |
| 721 + 1/2 | 46.47 | 0.16 | 19.2 | 2.39 | 2.30 | 1.04 | 1.00 | 1.00 | 0.168 | 3.97 | 11,0 | 26.8 | 31.2 | 0.28 | 0.56 | 0.27 | 8.6 |
| 722 | 45.06 | 0.33 | 18.9 | 2.33 | 2.33 | 1.00 | 1.00 | 1.00 | 0.156 | 3.67 | 11,0 | 26.6 | 31.7 | 0.27 | 0.51 | 0.27 | 8.5 |
| 722 + 1/2 | 44.31 | 0.16 | 19.8 | 2.33 | 2.34 | 1.00 | 1.01 | 1.00 | 0.149 | 4.35 | 11,0 | 26.9 | 33.1 | 0.27 | 0.52 | 0.27 | 8.4 |
| 723 | 43.88 | 0.07 | 19.9 | 2.35 | 2.34 | 1.01 | 1.00 | 1.00 | 0.192 | 3.75 | 11,0 | 27.4 | 33.6 | 0.27 | 0.46 | 0.26 | 8.5 |
| 723 + 1/2 | 43.58 | 0.08 | 19.6 | 2.33 | 2.36 | 0.99 | 1.00 | 0.99 | 0.147 | 3.41 | 11,0 | 28.0 | 32.0 | 0.27 | 0.41 | 0.26 | 8.5 |
| 724 | 43.44 | 0.05 | 19.6 | 2.39 | 2.36 | 1.01 | 0.99 | 0.99 | 0.251 | 2.34 | 3,6 | 29.1 | 31.2 | 0.27 | 0.38 | 0.26 | 8.7 |
| 724 + 1/2 | 43.40 | 0.02 | 20.8 | 2.34 | 2.39 | 0.98 | 1.00 | 0.98 | 0.173 | 2.21 | 11,0 | 29.6 | 31.9 | 0.27 | 0.40 | 0.26 | 8.5 |
| 725 | 43.40 | 0.03 | 20.1 | 2.39 | 2.39 | 1.00 | 1.01 | 1.00 | 0.155 | 2.61 | 0,2 | 30.1 | 34.1 | 0.27 | 0.35 | 0.26 | 8.5 |
| 725 + 1/2 | 43.46 | 0.03 | 20.3 | 2.38 | 2.40 | 0.99 | 1.01 | 0.99 | 0.152 | 2.29 | 2,1 | 31.1 | 35.4 | 0.27 | 0.29 | 0.27 | 8.5 |
| 726 | 43.46 | 0.05 | 19.9 | 2.40 | 2.43 | 0.99 | 0.97 | 0.97 | 0.256 | 2.26 | 2,1 | 31.7 | 35.6 | 0.27 | 0.29 | 0.27 | 8.2 |
| 726 + 1/2 | 43.57 | 0.04 | 20.3 | 2.47 | 2.46 | 1.00 | 1.02 | 1.00 | 0.167 | 2.61 | 2,6 | 31.9 | 34.9 | 0.27 | 0.27 | 0.27 | 8.7 |
| 727 | 43.74 | 0.03 | 20.2 | 2.52 | 2.50 | 1.01 | 0.99 | 0.99 | 0.175 | 2.20 | 4,0 | 32.8 | 36.1 | 0.27 | 0.27 | 0.27 | 8.7 |
| 727 + 1/2 | 43.99 | 0.00 | 20.5 | 2.53 | 2.54 | 1.00 | 1.00 | 1.00 | 0.199 | 2.87 | 1,7 | 33.0 | 36.1 | 0.27 | 0.29 | 0.27 | 8.0 |
| 728 | 44.23 | 0.00 | 20.7 | 2.59 | 2.54 | 1.02 | 1.02 | 1.02 | 0.176 | 2.57 | 1,7 | 32.9 | 34.5 | 0.27 | 0.33 | 0.27 | 8.0 |
| 728 + 1/2 | 44.48 | 0.03 | 20.0 | 2.56 | 2.57 | 0.99 | 1.00 | 0.99 | 0.203 | 2.23 | 1,7 | 33.7 | 35.6 | 0.27 | 0.32 | 0.27 | 8.0 |
| 729 | 44.67 | 0.02 | 21.4 | 2.58 | 2.58 | 1.00 | 1.00 | 1.00 | 0.160 | 3.19 | 1,7 | 34.1 | 36.7 | 0.28 | 0.35 | 0.27 | 8.0 |
| 729 + 1/2 | 44.89 | 0.06 | 21.9 | 2.56 | 2.60 | 0.99 | 0.98 | 0.98 | 0.187 | 2.26 | 1,8 | 34.2 | 36.8 | 0.28 | 0.35 | 0.28 | 8.0 |
| 730 | 45.22 | 0.01 | 21.8 | 2.60 | 2.60 | 1.00 | 1.00 | 1.00 | 0.172 | 2.27 | 1,8 | 34.0 | 35.8 | 0.28 | 0.31 | 0.28 | 8.0 |
| 730 + 1/2 | 45.54 | 0.02 | 21.5 | 2.61 | 2.62 | 1.00 | 0.99 | 0.99 | 0.195 | 1.78 | 0,7 | 33.8 | 35.4 | 0.29 | 0.25 | 0.28 | 8.0 |
| 731 | 45.89 | 0.00 | 21.2 | 2.66 | 2.63 | 1.01 | 1.02 | 1.01 | 0.180 | 1.69 | 0,1 | 33.6 | 35.7 | 0.29 | 0.27 | 0.29 | 8.0 |
| 731 + 1/2 | 46.23 | 0.06 | 21.7 | 2.64 | 2.68 | 0.99 | 0.98 | 0.98 | 0.177 | 1.74 | 0,1 | 33.3 | 36.2 | 0.30 | 0.27 | 0.29 | 8.0 |
| 732 | 46.68 | 0.01 | 21.5 | 2.69 | 2.70 | 1.00 | 1.01 | 1.00 | 0.153 | 1.91 | 12,8 | 32.9 | 34.9 | 0.30 | 0.32 | 0.30 | 8.0 |
| 732 + 1/2 | 47.15 | 0.02 | 22.1 | 2.73 | 2.73 | 1.00 | 0.99 | 0.99 | 0.203 | 2.05 | 12,8 | 32.2 | 34.1 | 0.31 | 0.36 | 0.30 | 8.0 |
| 733 | 47.66 | 0.06 | 21.6 | 2.77 | 2.77 | 1.00 | 1.00 | 1.00 | 0.193 | 2.14 | 12,8 | 31.5 | 33.7 | 0.31 | 0.38 | 0.31 | 8.0 |
| 733 + 1/2 | 48.29 | 0.03 | 20.5 | 2.81 | 2.82 | 0.99 | 1.00 | 0.99 | 0.167 | 1.75 | 13,8 | 30.7 | 33.1 | 0.32 | 0.34 | 0.31 | 8.0 |
| 734 | 48.99 | 0.00 | 20.4 | 2.88 | 2.87 | 1.00 | 1.01 | 1.00 | 0.158 | 1.87 | 13,8 | 30.2 | 32.9 | 0.32 | 0.36 | 0.32 | 8.0 |
| 734 + 1/2 | 49.69 | 0.07 | 21.5 | 2.93 | 2.93 | 1.00 | 1.00 | 1.00 | 0.201 | 2.07 | 13,8 | 29.8 | 32.4 | 0.33 | 0.39 | 0.32 | 8.0 |
| 735 | 50.25 | 0.06 | 21.9 | 2.97 | 2.98 | 1.00 | 1.00 | 1.00 | 0.202 | 2.23 | 13,8 | 29.2 | 31.7 | 0.33 | 0.38 | 0.33 | 8.0 |
| 735 + 1/2 | 50.94 | 0.04 | 20.4 | 3.04 | 3.01 | 1.01 | 1.01 | 1.01 | 0.196 | 2.60 | 13,8 | 28.6 | 31.0 | 0.34 | 0.35 | 0.34 | 8.0 |
| 736 | 51.70 | 0.05 | 21.0 | 3.05 | 3.07 | 0.99 | 0.99 | 0.99 | 0.193 | 2.56 | 13,8 | 28.0 | 32.9 | 0.35 | 0.32 | 0.34 | 8.0 |
| 736 + 1/2 | 52.36 | 0.01 | 21.2 | 3.10 | 3.08 | 1.01 | 1.01 | 1.01 | 0.153 | 2.48 | 13,8 | 27.3 | 31.4 | 0.35 | 0.28 | 0.35 | 8.5 |
| 737 | 53.00 | 0.04 | 21.0 | 3.12 | 3.15 | 0.99 | 0.98 | 0.98 | 0.172 | 2.02 | 13,8 | 26.5 | 29.0 | 0.36 | 0.24 | 0.35 | 8.7 |
| 737 + 1/2 | 53.56 | 0.06 | 19.8 | 3.20 | 3.20 | 1.00 | 1.01 | 1.00 | 0.145 | 1.81 | 13,8 | 25.7 | 28.1 | 0.36 | 0.18 | 0.36 | 8.0 |
| 738 | 54.24 | 0.00 | 20.5 | 3.28 | 3.24 | 1.01 | 0.99 | 0.99 | 0.183 | 2.04 | 14,8 | 24.8 | 27.3 | 0.37 | 0.15 | 0.36 | 8.0 |
| 738 + 1/2 | 54.92 | 0.09 | 20.3 | 3.28 | 3.32 | 0.99 | 1.01 | 0.99 | 0.062 | 2.42 | 14,8 | 23.9 | 26.0 | 0.37 | 0.12 | 0.37 | 8.6 |
| 739 | 55.41 | 0.05 | 20.4 | 3.35 | 3.32 | 1.01 | 1.00 | 1.00 | 0.116 | 2.79 | 14,8 | 23.1 | 24.8 | 0.38 | 0.10 | 0.37 | 8.5 |
| 739 + 1/2 | 55.79 | 0.11 | 20.0 | 3.37 | 3.36 | 1.00 | 1.00 | 1.00 | 0.075 | 2.15 | 14,8 | 22.4 | 27.2 | 0.38 | 0.10 | 0.38 | 8.3 |
| 740 | 56.39 | 0.06 | 20.0 | 3.42 | 3.37 | 1.01 | 1.01 | 1.01 | 0.055 | 1.97 | 14,7 | 21.6 | 30.7 | 0.39 | 0.10 | 0.38 | 8.2 |
| 740 + 1/2 | 57.11 | 0.03 | 19.4 | 3.44 | 3.40 | 1.01 | 1.01 | 1.01 | 0.054 | 1.80 | 14,8 | 20.8 | 36.3 | 0.39 | 0.11 | 0.67 | 8.0 |
| 741 | 57.77 | 0.01 | 19.4 | 3.50 | 3.42 | 1.02 | 1.02 | 1.02 | 0.048 | 1.88 | 15,8 | 19.7 | 35.9 | 0.40 | 0.15 | 0.66 | 8.0 |
| 741 + 1/2 | 58.41 | 0.00 | 19.1 | 3.53 | 3.42 | 1.03 | 1.03 | 1.03 | 0.035 | 2.35 | 15,8 | 18.8 | 36.2 | 0.40 | 0.20 | 0.66 | 8.0 |
| 742 | 59.06 | 0.01 | 18.9 | 3.57 | 3.43 | 1.04 | 1.04 | 1.04 | 0.028 | 2.53 | 15,8 | 17.7 | 27.6 | 0.41 | 0.23 | 0.66 | 8.0 |
| 742 + 1/2 | 59.70 | 0.07 | 18.6 | 3.53 | 3.45 | 1.02 | 1.03 | 1.02 | 0.021 | 2.44 | 15,8 | 16.7 | 26.1 | 0.41 | 0.29 | 0.65 | 8.0 |
| 743 | 60.19 | 0.00 | 18.4 | 3.50 | 3.48 | 1.01 | 1.01 | 1.01 | 0.023 | 2.25 | 15,8 | 15.7 | 24.4 | 0.42 | 0.34 | 0.64 | 8.0 |
| 743 + 1/2 | 60.68 | 0.01 | 18.0 | 3.49 | 3.50 | 1.00 | 1.01 | 1.00 | 0.015 | 2.12 | 15,8 | 14.9 | 23.9 | 0.42 | 0.36 | 0.64 | 8.0 |
| 744 | 61.18 | 0.00 | 17.6 | 3.43 | 3.52 | 0.97 | 0.98 | 0.97 | 0.035 | 1.65 | 15,8 | 14.3 | 23.7 | 0.42 | 0.39 | 0.63 | 8.0 |
| 744 + 1/2 | 61.68 | 0.01 | 17.4 | 3.38 | 3.53 | 0.96 | 0.96 | 0.96 | 0.021 | 1.50 | 0,4 | 14.1 | 22.3 | 0.43 | 0.37 | 0.62 | 8.0 |
| 745 | 62.17 | 0.02 | 17.0 | 3.42 | 3.54 | 0.97 | 0.97 | 0.97 | 0.023 | 1.49 | 5,0 | 14.2 | 21.7 | 0.43 | 0.34 | 0.62 | 8.0 |
| 745 + 1/2 | 62.61 | 0.03 | 16.8 | 3.47 | 3.56 | 0.98 | 0.97 | 0.97 | 0.018 | 1.48 | 0,2 | 14.3 | 24.6 | 0.44 | 0.27 | 0.61 | 8.0 |
| 746 | 63.00 | 0.05 | 16.5 | 3.54 | 3.58 | 0.99 | 0.98 | 0.98 | 0.021 | 1.53 | 5,0 | 14.6 | 26.4 | 0.44 | 0.26 | 0.61 | 8.0 |
| 746 + 1/2 | 63.48 | 0.01 | 16.3 | 3.60 | 3.62 | 1.00 | 1.00 | 1.00 | 0.020 | 1.51 | 14,5 | 15.1 | 28.9 | 0.44 | 0.29 | 0.44 | 8.0 |
| 747 | 63.97 | 0.03 | 15.9 | 3.67 | 3.63 | 1.01 | 1.01 | 1.01 | 0.030 | 1.64 | 4,1 | 13.3 | 25.5 | 0.45 | 0.25 | 0.44 | 8.0 |
| 747 + 1/2 | 64.51 | 0.05 | 15.7 | 3.69 | 3.67 | 1.01 | 1.01 | 1.01 | 0.010 | 1.57 | 4,1 | 13.8 | 26.5 | 0.45 | 0.28 | 0.44 | 8.0 |
| 748 | 64.96 | 0.10 | 15.4 | 3.70 | 3.67 | 1.01 | 1.01 | 1.01 | 0.009 | 1.61 | 4,1 | 14.6 | 28.6 | 0.45 | 0.31 | 0.45 | 8.0 |
| 748 + 1/2 | 65.22 | 0.00 | 15.1 | 3.69 | 3.68 | 1.00 | 1.00 | 1.00 | 0.012 | 1.59 | 4,1 | 15.3 | 30.6 | 0.45 | 0.33 | 0.45 | 8.0 |
| 749 | 65.48 | 0.00 | 14.8 | 3.68 | 3.69 | 1.00 | 1.00 | 1.00 | 0.002 | 1.56 | 4,1 | 16.0 | 31.8 | 0.45 | 0.30 | 0.45 | 8.0 |
| 749 + 1/2 | 65.73 | 0.03 | 14.6 | 3.69 | 3.69 | 1.00 | 1.00 | 1.00 | 0.010 | 1.60 | 15,2 | 15.4 | 33.6 | 0.46 | 0.29 | 0.45 | 8.0 |
| 750 | 65.92 | 0.08 | 14.3 | 3.66 | 3.70 | 0.99 | 0.99 | 0.99 | 0.004 | 1.57 | 5,2 | 16.0 | 38.4 | 0.46 | 0.30 | 0.46 | 8.0 |
| 750 + 1/2 | 65.95 | 0.08 | 14.1 | 3.67 | 3.70 | 0.99 | 0.99 | 0.99 | 0.006 | 1.56 | 3,5 | 16.5 | 39.8 | 0.46 | 0.32 | 0.46 | 8.0 |
| 751 | 65.82 | 0.03 | 13.8 | 3.70 | 3.71 | 1.00 | 1.00 | 1.00 | 0.007 | 1.68 | 3,5 | 17.1 | 44.1 | 0.47 | 0.31 | 0.46 | 8.0 |
| 751 + 1/2 | 65.75 | 0.08 | 13.6 | 3.72 | 3.72 | 1.00 | 1.00 | 1.00 | 0.006 | 1.73 | 3,5 | 17.4 | 43.5 | 0.47 | 0.28 | 0.47 | 8.0 |
| 752 | 65.85 | 0.03 | 13.3 | 3.74 | 3.74 | 1.00 | 1.00 | 1.00 | 0.007 | 1.95 | 3,5 | 17.4 | 46.3 | 0.47 | 0.27 | 0.47 | 8.0 |
| 752 + 1/2 | 66.00 | 0.04 | 13.1 | 3.77 | 3.78 | 1.00 | 1.00 | 1.00 | 0.005 | 1.72 | 3,5 | 17.3 | 45.6 | 0.47 | 0.26 | 0.47 | 8.0 |
| 753 | 66.07 | 0.05 | 12.8 | 3.81 | 3.80 | 1.00 | 1.00 | 1.00 | 0.003 | 1.85 | 3,5 | 17.4 | 43.6 | 0.48 | 0.25 | 0.47 | 8.0 |
| 753 + 1/2 | 66.04 | 0.02 | 12.6 | 3.84 | 3.85 | 1.00 | 1.00 | 1.00 | 0.001 | 1.75 | 3,5 | 17.1 | 45.1 | 0.48 | 0.24 | 0.48 | 8.0 |
| 754 | 66.06 | 0.01 | 12.4 | 3.88 | 3.87 | 1.00 | 1.01 | 1.00 | 0.008 | 1.94 | 2,5 | 17.4 | 43.7 | 0.48 | 0.23 | 0.48 | 8.0 |
| 754 + 1/2 | 66.06 | 0.02 | 12.0 | 3.90 | 3.89 | 1.00 | 1.00 | 1.00 | 0.012 | 2.10 | 2,5 | 17.6 | 41.3 | 0.49 | 0.24 | 0.48 | 8.0 |
| 755 | 66.03 | 0.03 | 11.7 | 3.92 | 3.89 | 1.01 | 1.00 | 1.00 | 0.013 | 1.98 | 2,5 | 18.2 | 41.3 | 0.49 | 0.23 | 0.49 | 8.0 |
| 755 + 1/2 | 65.93 | 0.04 | 11.5 | 3.92 | 3.89 | 1.01 | 1.01 | 1.01 | 0.015 | 2.19 | 2,5 | 19.3 | 40.9 | 0.49 | 0.23 | 0.49 | 8.0 |
| 756 | 65.91 | 0.04 | 11.3 | 3.90 | 3.89 | 1.00 | 1.00 | 1.00 | 0.016 | 1.92 | 2,5 | 19.8 | 38.8 | 0.49 | 0.22 | 0.49 | 8.0 |
| 756 + 1/2 | 65.95 | 0.04 | 11.0 | 3.91 | 3.89 | 1.00 | 1.00 | 1.00 | 0.016 | 1.85 | 1,5 | 20.2 | 37.8 | 0.50 | 0.21 | 0.49 | 8.0 |
| 757 | 66.08 | 0.07 | 10.8 | 3.95 | 3.89 | 1.02 | 1.02 | 1.02 | 0.009 | 2.07 | 1,5 | 19.9 | 36.3 | 0.50 | 0.20 | 0.50 | 8.0 |
| 757 + 1/2 | 66.34 | 0.03 | 10.6 | 3.97 | 3.89 | 1.02 | 1.02 | 1.02 | 0.013 | 2.02 | 1,5 | 20.2 | 36.0 | 0.50 | 0.20 | 0.50 | 8.0 |
| 758 | 66.67 | 0.05 | 10.3 | 3.97 | 3.89 | 1.02 | 1.02 | 1.02 | 0.008 | 1.82 | 1,5 | 20.0 | 36.2 | 0.51 | 0.20 | 0.50 | 8.0 |
| 758 + 1/2 | 66.89 | 0.06 | 10.1 | 3.99 | 3.89 | 1.03 | 1.03 | 1.03 | 0.007 | 1.91 | 1,5 | 19.7 | 35.1 | 0.51 | 0.20 | 0.51 | 8.0 |
| 759 | 66.98 | 0.04 | 9.9 | 4.00 | 3.89 | 1.03 | 1.03 | 1.03 | 0.008 | 1.83 | 1,5 | 19.4 | 32.9 | 0.51 | 0.20 | 0.51 | 8.0 |
| 759 + 1/2 | 67.00 | 0.03 | 9.7 | 3.99 | 3.89 | 1.03 | 1.03 | 1.03 | 0.010 | 1.85 | 1,5 | 19.0 | 31.7 | 0.52 | 0.21 | 0.51 | 8.0 |
| 760 | 66.96 | 0.02 | 9.4 | 3.95 | 3.89 | 1.02 | 1.02 | 1.02 | 0.008 | 1.57 | 0,5 | 19.8 | 30.9 | 0.52 | 0.22 | 0.52 | 8.0 |
| 760 + 1/2 | 66.88 | 0.01 | 9.2 | 4.01 | 3.89 | 1.03 | 1.04 | 1.03 | 0.005 | 1.79 | 0,5 | 19.6 | 31.1 | 0.53 | 0.21 | 0.52 | 8.0 |
| 761 | 66.78 | 0.03 | 9.0 | 3.97 | 3.89 | 1.02 | 1.02 | 1.02 | 0.011 | 1.77 | 0,6 | 19.3 | 31.6 | 0.53 | 0.20 | 0.53 | 8.0 |
| 761 + 1/2 | 66.74 | 0.01 | 8.7 | 3.95 | 3.89 | 1.01 | 1.02 | 1.01 | 0.007 | 1.95 | 0,6 | 19.3 | 32.2 | 0.53 | 0.21 | 0.53 | 8.0 |
| 762 | 66.68 | 0.02 | 8.5 | 3.94 | 3.89 | 1.01 | 1.02 | 1.01 | 0.003 | 2.00 | 0,6 | 19.0 | 32.7 | 0.54 | 0.21 | 0.53 | 8.0 |
| 762 + 1/2 | 66.58 | 0.07 | 8.3 | 3.89 | 3.87 | 1.00 | 1.01 | 1.00 | 0.003 | 2.01 | 0,6 | 18.8 | 33.9 | 0.54 | 0.20 | 0.54 | 8.0 |
| 763 | 66.34 | 0.02 | 8.0 | 3.85 | 3.86 | 1.00 | 1.00 | 1.00 | 0.008 | 1.98 | 11,8 | 18.7 | 34.6 | 0.55 | 0.20 | 0.54 | 8.0 |
| 763 + 1/2 | 66.05 | 0.01 | 7.8 | 3.82 | 3.82 | 1.00 | 1.01 | 1.00 | 0.001 | 2.09 | 11,8 | 18.5 | 35.1 | 0.55 | 0.20 | 0.55 | 8.0 |
| 764 | 65.78 | 0.02 | 7.6 | 3.79 | 3.78 | 1.00 | 1.00 | 1.00 | 0.008 | 1.95 | 11,8 | 18.4 | 36.0 | 0.55 | 0.19 | 0.55 | 8.0 |
| 764 + 1/2 | 65.54 | 0.04 | 7.4 | 3.73 | 3.73 | 1.00 | 1.00 | 1.00 | 0.009 | 2.00 | 11,8 | 18.7 | 37.7 | 0.56 | 0.18 | 0.56 | 8.0 |
| 765 | 65.38 | 0.03 | 7.3 | 3.67 | 3.69 | 1.00 | 0.99 | 0.99 | 0.012 | 1.81 | 11,8 | 19.1 | 38.2 | 0.56 | 0.18 | 0.56 | 8.0 |
| 765 + 1/2 | 65.16 | 0.04 | 6.9 | 3.65 | 3.64 | 1.00 | 1.00 | 1.00 | 0.011 | 1.76 | 11,8 | 19.0 | 38.6 | 0.57 | 0.20 | 0.57 | 8.0 |
| 766 | 65.01 | 0.02 | 6.7 | 3.60 | 3.60 | 1.00 | 1.00 | 1.00 | 0.007 | 1.64 | 11,8 | 19.2 | 39.5 | 0.57 | 0.19 | 0.57 | 8.0 |
| 766 + 1/2 | 64.90 | 0.00 | 6.5 | 3.55 | 3.57 | 0.99 | 0.99 | 0.99 | 0.007 | 1.45 | 11,8 | 19.7 | 40.5 | 0.58 | 0.18 | 0.58 | 8.0 |
| 767 | 64.78 | 0.03 | 6.2 | 3.53 | 3.50 | 1.01 | 1.01 | 1.01 | 0.010 | 1.37 | 0,4 | 19.8 | 41.5 | 0.58 | 0.18 | 0.58 | 8.0 |
| 767 + 1/2 | 64.72 | 0.00 | 6.1 | 3.45 | 3.49 | 0.99 | 0.99 | 0.99 | 0.004 | 1.38 | 2,8 | 20.2 | 42.1 | 0.59 | 0.18 | 0.58 | 8.0 |
| 768 | 64.67 | 0.03 | 5.8 | 3.46 | 3.42 | 1.01 | 1.01 | 1.01 | 0.002 | 1.48 | 15,1 | 19.9 | 42.0 | 0.59 | 0.17 | 0.59 | 8.0 |
| 768 + 1/2 | 64.56 | 0.01 | 5.6 | 3.39 | 3.40 | 1.00 | 1.00 | 1.00 | 0.001 | 1.34 | 0,4 | 20.0 | 42.4 | 0.60 | 0.16 | 0.60 | 8.0 |
| 769 | 64.47 | 0.02 | 5.4 | 3.34 | 3.35 | 1.00 | 1.00 | 1.00 | 0.002 | 1.42 | 3,5 | 19.6 | 42.3 | 0.60 | 0.15 | 0.60 | 8.0 |
| 769 + 1/2 | 64.35 | 0.01 | 5.1 | 3.31 | 3.30 | 1.00 | 1.00 | 1.00 | 0.000 | 1.57 | 15,1 | 19.5 | 41.5 | 0.61 | 0.14 | 0.61 | 8.0 |
| 770 | 64.21 | 0.00 | 5.0 | 3.25 | 3.27 | 1.00 | 1.00 | 1.00 | 0.000 | 1.45 | 3,5 | 19.0 | 40.7 | 0.62 | 0.13 | 0.61 | 8.0 |
| 770 + 1/2 | 64.09 | 0.00 | 4.7 | 3.22 | 3.22 | 1.00 | 1.00 | 1.00 | 0.000 | 1.38 | 7,8 | 18.2 | 40.2 | 0.62 | 0.12 | 0.62 | 8.0 |
| 771 | 63.96 | 0.01 | 4.5 | 3.18 | 3.17 | 1.00 | 1.00 | 1.00 | 0.000 | 1.48 | 3,5 | 17.6 | 39.4 | 0.63 | 0.10 | 0.62 | 8.0 |
| 771 + 1/2 | 63.85 | 0.03 | 4.3 | 3.13 | 3.13 | 1.00 | 1.00 | 1.00 | 0.000 | 1.42 | 14,1 | 16.1 | 37.4 | 0.63 | 0.10 | 0.63 | 8.0 |
| 772 | 63.81 | 0.00 | 4.1 | 3.07 | 3.09 | 0.99 | 0.99 | 0.99 | 0.000 | 1.39 | 14,1 | 15.6 | 35.5 | 0.64 | 0.08 | 0.64 | 8.0 |
| 772 + 1/2 | 63.77 | 0.00 | 3.9 | 3.05 | 3.02 | 1.01 | 1.01 | 1.01 | 0.000 | 1.46 | 14,1 | 14.3 | 33.4 | 0.64 | 0.07 | 0.64 | 8.0 |
| 773 | 63.74 | 0.01 | 3.6 | 2.98 | 2.99 | 0.99 | 0.99 | 0.99 | 0.000 | 1.47 | 14,0 | 12.7 | 30.7 | 0.65 | 0.06 | 0.65 | 8.0 |
| 773 + 1/2 | 63.73 | 0.00 | 3.4 | 2.94 | 2.93 | 1.00 | 1.00 | 1.00 | 0.000 | 1.56 | 5,6 | 11.6 | 27.0 | 0.65 | 0.05 | 0.65 | 8.0 |
| 774 | 63.73 | 0.00 | 3.2 | 2.88 | 2.87 | 1.00 | 1.00 | 1.00 | 0.000 | 1.65 | 1,6 | 10.1 | 24.4 | 0.66 | 0.04 | 0.66 | 8.0 |
| 774 + 1/2 | 63.73 | 0.00 | 3.0 | 2.81 | 2.82 | 1.00 | 1.00 | 1.00 | 0.000 | 1.67 | 1,6 | 9.2 | 21.9 | 0.66 | 0.04 | 0.66 | 8.0 |
| 775 | 63.73 | 0.01 | 2.8 | 2.76 | 2.73 | 1.01 | 1.01 | 1.01 | 0.000 | 1.71 | 1,6 | 8.3 | 19.2 | 0.67 | 0.04 | 0.67 | 8.0 |
| 775 + 1/2 | 63.72 | 0.00 | 2.6 | 2.66 | 2.70 | 0.98 | 0.98 | 0.98 | 0.000 | 1.73 | 1,6 | 7.0 | 15.9 | 0.67 | 0.03 | 0.67 | 8.0 |
| 776 | 63.72 | 0.01 | 2.3 | 2.64 | 2.63 | 1.00 | 1.00 | 1.00 | 0.000 | 1.66 | 1,6 | 6.0 | 13.7 | 0.67 | 0.03 | 0.67 | 8.0 |
| 776 + 1/2 | 63.74 | 0.00 | 2.1 | 2.59 | 2.62 | 0.99 | 0.99 | 0.99 | 0.000 | 1.73 | 0,6 | 5.3 | 11.5 | 0.68 | 0.03 | 0.67 | 8.8 |
| 777 | 63.76 | 0.01 | 1.9 | 2.60 | 2.60 | 1.00 | 1.00 | 1.00 | 0.000 | 1.48 | 0,6 | 4.7 | 9.5 | 0.68 | 0.03 | 0.68 | 8.8 |
| 777 + 1/2 | 63.80 | 0.00 | 1.7 | 2.59 | 2.60 | 1.00 | 1.00 | 1.00 | 0.000 | 1.40 | 0,6 | 4.3 | 8.1 | 0.68 | 0.03 | 0.68 | 8.7 |
| 778 | 63.84 | 0.00 | 1.5 | 2.59 | 2.59 | 1.00 | 1.00 | 1.00 | 0.000 | 1.27 | 0,6 | 4.0 | 6.6 | 0.68 | 0.03 | 0.68 | 8.7 |
| 778 + 1/2 | 63.87 | 0.00 | 1.4 | 2.60 | 2.58 | 1.01 | 1.01 | 1.01 | 0.000 | 1.25 | 3,8 | 3.8 | 6.7 | 0.68 | 0.03 | 0.68 | 8.7 |
| 779 last | 63.90 | 0.00 | 1.3 | 2.58 | 2.58 | 1.00 | 1.00 | 1.00 | 0.000 | 1.33 | 3,8 | 3.7 | 6.8 | 0.68 | 0.03 | 0.68 | 8.7 |
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

#### dive, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.26 from frame 705 to the next, limit 1.2.
Largest pop score of one block: 7.17 from frame 740 to the next, block column 14 row 7 from the top left, shown, not judged.
Largest change in place: 35.0 from frame 729 to 8 film frames later, most at pixel 1240, 192, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 780 to 791 + 1/2): change 3.0; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.024 from frame 730 to the next, most at pixel 1502, 874, a patch of 76 by 60 px; 0 of 227 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 228 rows, which says nothing of them, quiet or not: frame 791 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 704 in /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2-pops-full.png, frame 704 + 1/2 in /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2-pops-full.png, frame 705 in /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2-pops-full.png, frame 705 + 1/2 in /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2-pops-full.png, frame 730 in /home/user/workspace/work/p6/hm9/01/mercury-dive-p1of2-pops-full.png.

With the carry at the full size the dive has 2 numbers over the limit or not measured.

- FULL SIZE RED pop score 1.26 from frame 705 to the next, limit 1.2 (5 frames over it, first 704)
- FULL SIZE RED the pattern of the picture changes in place by 0.56 from frame 721 + 1/2 to 8 film frames later, band 8.6 px, limit 0.45 (7 frames over it, first 720)

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 678 | 0.8 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.005 | 1.12 | 2,5 | 0.7 | 0.8 | 0.30 | 1.00 | 0.251 | 0.254 | 0.990 | 0.340 | 1058,498 | 60 by 96 |
| 678 + 1/2 | 0.7 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.005 | 1.07 | 0,3 | 0.7 | 0.8 | 0.30 | 0.99 | 0.253 | 0.253 | 0.999 | 0.340 | 870,506 | 124 by 72 |
| 679 | 0.8 | 0.27 | 0.28 | 1.00 | 0.99 | 0.99 | 0.010 | 1.07 | 12,1 | 0.7 | 0.8 | 0.30 | 1.00 | 0.253 | 0.253 | 1.001 | 0.340 | 506,402 | 204 by 144 |
| 679 + 1/2 | 0.7 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.002 | 1.08 | 10,7 | 0.7 | 0.9 | 0.30 | 1.00 | 0.254 | 0.253 | 1.002 | 0.340 | 822,550 | 224 by 168 |
| 680 | 0.8 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.008 | 1.06 | 2,6 | 0.7 | 0.9 | 0.30 | 1.00 | 0.253 | 0.253 | 0.996 | 0.340 | 1078,422 | 288 by 232 |
| 680 + 1/2 | 0.7 | 0.27 | 0.28 | 1.00 | 0.99 | 0.99 | 0.007 | 1.07 | 14,8 | 0.7 | 0.8 | 0.30 | 0.99 | 0.254 | 0.252 | 1.006 | 0.341 | 922,358 | 164 by 124 |
| 681 | 0.7 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 2,4 | 0.7 | 0.8 | 0.30 | 1.00 | 0.252 | 0.253 | 0.998 | 0.341 | 1058,494 | 100 by 112 |
| 681 + 1/2 | 0.7 | 0.27 | 0.28 | 1.00 | 0.99 | 0.99 | 0.009 | 1.10 | 3,2 | 0.7 | 0.8 | 0.30 | 1.00 | 0.252 | 0.252 | 1.000 | 0.341 | 882,506 | 68 by 72 |
| 682 | 0.7 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.002 | 1.07 | 11,7 | 0.7 | 0.8 | 0.30 | 1.00 | 0.253 | 0.252 | 1.003 | 0.341 | 870,526 | 140 by 156 |
| 682 + 1/2 | 0.8 | 0.27 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.09 | 10,2 | 0.7 | 0.9 | 0.30 | 1.00 | 0.252 | 0.253 | 0.996 | 0.341 | 926,474 | 208 by 216 |
| 683 | 0.8 | 0.27 | 0.28 | 0.99 | 0.99 | 0.99 | 0.003 | 1.07 | 12,0 | 0.7 | 0.9 | 0.30 | 1.00 | 0.252 | 0.253 | 0.998 | 0.341 | 1046,866 | 184 by 208 |
| 683 + 1/2 | 0.8 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.11 | 3,6 | 0.7 | 0.8 | 0.30 | 1.00 | 0.255 | 0.253 | 1.007 | 0.341 | 926,638 | 236 by 184 |
| 684 | 0.8 | 0.27 | 0.28 | 1.00 | 1.00 | 1.00 | 0.002 | 1.17 | 3,6 | 0.7 | 0.9 | 0.29 | 1.00 | 0.253 | 0.254 | 0.997 | 0.341 | 1022,374 | 80 by 72 |
| 684 + 1/2 | 0.8 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.007 | 1.12 | 3,6 | 0.7 | 0.9 | 0.29 | 1.00 | 0.255 | 0.254 | 1.007 | 0.341 | 938,418 | 128 by 168 |
| 685 | 0.8 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.010 | 1.09 | 3,2 | 0.7 | 0.9 | 0.29 | 1.00 | 0.253 | 0.254 | 0.997 | 0.341 | 938,578 | 76 by 92 |
| 685 + 1/2 | 0.8 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.011 | 1.07 | 11,6 | 0.7 | 1.0 | 0.29 | 0.99 | 0.254 | 0.254 | 1.001 | 0.342 | 878,486 | 92 by 100 |
| 686 | 0.7 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.000 | 1.13 | 2,6 | 0.8 | 1.0 | 0.29 | 0.99 | 0.254 | 0.254 | 0.998 | 0.342 | 862,350 | 68 by 80 |
| 686 + 1/2 | 0.7 | 0.28 | 0.28 | 1.01 | 1.01 | 1.01 | 0.002 | 1.12 | 2,6 | 0.8 | 1.1 | 0.29 | 1.00 | 0.254 | 0.254 | 1.001 | 0.342 | 866,518 | 56 by 64 |
| 687 | 0.7 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.004 | 1.08 | 12,3 | 1.0 | 1.3 | 0.29 | 1.01 | 0.254 | 0.254 | 1.002 | 0.342 | 886,590 | 80 by 84 |
| 687 + 1/2 | 0.8 | 0.27 | 0.28 | 1.00 | 0.99 | 0.99 | 0.011 | 1.13 | 3,2 | 1.1 | 1.4 | 0.29 | 1.00 | 0.253 | 0.254 | 0.997 | 0.342 | 1226,674 | 88 by 68 |
| 688 | 0.7 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.005 | 1.10 | 15,6 | 1.1 | 1.5 | 0.29 | 0.99 | 0.254 | 0.254 | 1.000 | 0.342 | 838,486 | 76 by 100 |
| 688 + 1/2 | 0.8 | 0.27 | 0.28 | 0.99 | 0.98 | 0.98 | 0.013 | 1.08 | 13,8 | 1.3 | 1.9 | 0.29 | 0.99 | 0.251 | 0.254 | 0.991 | 0.342 | 734,186 | 100 by 64 |
| 689 | 0.8 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.006 | 1.09 | 0,5 | 1.4 | 2.1 | 0.29 | 1.00 | 0.255 | 0.254 | 1.003 | 0.342 | 1046,666 | 168 by 148 |
| 689 + 1/2 | 0.8 | 0.28 | 0.28 | 1.00 | 1.00 | 1.00 | 0.002 | 1.06 | 10,7 | 1.6 | 2.3 | 0.29 | 1.00 | 0.254 | 0.255 | 0.998 | 0.342 | 870,730 | 288 by 196 |
| 690 | 0.8 | 0.28 | 0.28 | 0.99 | 1.00 | 0.99 | 0.000 | 1.09 | 13,2 | 1.9 | 2.7 | 0.29 | 0.99 | 0.255 | 0.258 | 0.989 | 0.343 | 862,642 | 72 by 72 |
| 690 + 1/2 | 0.7 | 0.28 | 0.28 | 1.00 | 0.99 | 0.99 | 0.014 | 1.13 | 4,1 | 2.2 | 3.2 | 0.29 | 0.98 | 0.261 | 0.262 | 0.996 | 0.343 | 898,478 | 52 by 64 |
| 691 | 0.7 | 0.28 | 0.28 | 1.00 | 1.01 | 1.00 | 0.001 | 1.21 | 6,2 | 2.4 | 3.7 | 0.29 | 0.99 | 0.269 | 0.272 | 0.991 | 0.343 | 870,522 | 88 by 108 |
| 691 + 1/2 | 0.6 | 0.28 | 0.28 | 0.99 | 0.98 | 0.98 | 0.019 | 1.36 | 6,3 | 2.7 | 4.2 | 0.29 | 0.98 | 0.282 | 0.277 | 1.021 | 0.343 | 726,282 | 264 by 348 |
| 692 | 0.6 | 0.29 | 0.29 | 1.00 | 0.99 | 0.99 | 0.018 | 1.35 | 6,3 | 3.1 | 4.7 | 0.30 | 0.97 | 0.287 | 0.283 | 1.014 | 0.344 | 766,394 | 112 by 176 |
| 692 + 1/2 | 0.9 | 0.29 | 0.30 | 0.98 | 0.98 | 0.98 | 0.006 | 1.26 | 7,4 | 3.4 | 5.1 | 0.30 | 0.98 | 0.284 | 0.288 | 0.986 | 0.345 | 866,526 | 80 by 120 |
| 693 | 1.0 | 0.31 | 0.31 | 1.00 | 1.00 | 1.00 | 0.004 | 1.26 | 7,4 | 3.7 | 5.7 | 0.30 | 1.00 | 0.289 | 0.291 | 0.993 | 0.346 | 870,510 | 140 by 128 |
| 693 + 1/2 | 1.3 | 0.32 | 0.32 | 1.00 | 1.00 | 1.00 | 0.002 | 1.26 | 6,0 | 3.9 | 5.3 | 0.30 | 1.01 | 0.295 | 0.292 | 1.007 | 0.347 | 922,550 | 100 by 156 |
| 694 | 1.5 | 0.34 | 0.34 | 0.99 | 0.99 | 0.99 | 0.005 | 1.28 | 7,0 | 4.3 | 5.9 | 0.29 | 1.01 | 0.296 | 0.297 | 0.997 | 0.349 | 726,282 | 88 by 88 |
| 694 + 1/2 | 1.9 | 0.35 | 0.35 | 1.00 | 1.00 | 1.00 | 0.008 | 1.41 | 9,1 | 4.6 | 6.4 | 0.29 | 1.01 | 0.300 | 0.300 | 0.999 | 0.351 | 870,594 | 52 by 72 |
| 695 | 2.1 | 0.37 | 0.37 | 1.00 | 1.00 | 1.00 | 0.007 | 1.51 | 6,0 | 5.0 | 7.9 | 0.29 | 0.99 | 0.304 | 0.302 | 1.008 | 0.354 | 786,390 | 116 by 184 |
| 695 + 1/2 | 2.4 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.010 | 1.51 | 6,0 | 5.3 | 8.8 | 0.28 | 1.01 | 0.303 | 0.305 | 0.994 | 0.356 | 942,550 | 104 by 100 |
| 696 | 2.8 | 0.41 | 0.41 | 1.01 | 1.01 | 1.01 | 0.016 | 1.57 | 7,0 | 5.3 | 8.9 | 0.28 | 1.01 | 0.307 | 0.305 | 1.005 | 0.360 | 866,514 | 112 by 72 |
| 696 + 1/2 | 3.0 | 0.42 | 0.43 | 0.99 | 1.00 | 0.99 | 0.005 | 1.80 | 6,0 | 5.6 | 7.2 | 0.28 | 1.01 | 0.307 | 0.307 | 1.002 | 0.363 | 826,462 | 72 by 120 |
| 697 | 3.2 | 0.44 | 0.44 | 1.01 | 1.00 | 1.00 | 0.017 | 1.72 | 12,2 | 6.2 | 7.9 | 0.28 | 1.01 | 0.306 | 0.308 | 0.995 | 0.367 | 750,374 | 68 by 64 |
| 697 + 1/2 | 3.7 | 0.45 | 0.46 | 0.99 | 1.00 | 0.99 | 0.010 | 1.84 | 2,6 | 6.3 | 8.2 | 0.28 | 1.00 | 0.308 | 0.307 | 1.005 | 0.372 | 774,406 | 56 by 80 |
| 698 | 4.0 | 0.47 | 0.47 | 1.00 | 1.01 | 1.00 | 0.013 | 1.89 | 2,6 | 6.2 | 8.2 | 0.28 | 0.99 | 0.310 | 0.307 | 1.009 | 0.377 | 774,414 | 72 by 80 |
| 698 + 1/2 | 4.3 | 0.49 | 0.49 | 1.00 | 0.99 | 0.99 | 0.020 | 1.72 | 11,0 | 6.6 | 9.3 | 0.28 | 0.97 | 0.306 | 0.310 | 0.987 | 0.382 | 730,366 | 52 by 72 |
| 699 | 4.5 | 0.50 | 0.50 | 1.00 | 1.04 | 1.00 | 0.013 | 1.84 | 11,0 | 7.4 | 11.1 | 0.27 | 1.00 | 0.310 | 0.312 | 0.995 | 0.388 | 690,82 | 116 by 76 |
| 699 + 1/2 | 4.9 | 0.51 | 0.50 | 1.03 | 1.08 | 1.03 | 0.006 | 2.06 | 11,0 | 7.5 | 10.2 | 0.27 | 1.01 | 0.313 | 0.312 | 1.004 | 0.394 | 810,438 | 60 by 68 |
| 700 | 5.3 | 0.52 | 0.50 | 1.05 | 1.09 | 1.05 | 0.013 | 2.10 | 11,0 | 8.0 | 11.1 | 0.27 | 1.04 | 0.313 | 0.315 | 0.993 | 0.399 | 762,386 | 60 by 68 |
| 700 + 1/2 | 5.5 | 0.52 | 0.50 | 1.05 | 1.09 | 1.05 | 0.017 | 2.08 | 11,0 | 7.7 | 10.2 | 0.27 | 1.05 | 0.318 | 0.318 | 0.999 | 0.406 | 718,354 | 68 by 60 |
| 701 | 6.1 | 0.54 | 0.50 | 1.09 | 1.11 | 1.09 | 0.019 | 2.17 | 12,3 | 8.5 | 12.8 | 0.27 | 1.08 | 0.323 | 0.322 | 1.005 | 0.412 | 818,38 | 72 by 40 |
| 701 + 1/2 | 6.2 | 0.55 | 0.50 | 1.10 | 1.11 | 1.10 | 0.039 | 2.21 | 1,4 | 9.5 | 12.0 | 0.28 | 1.07 | 0.326 | 0.324 | 1.006 | 0.420 | 858,38 | 60 by 40 |
| 702 | 6.6 | 0.56 | 0.50 | 1.12 | 1.15 | 1.12 | 0.013 | 2.47 | 2,7 | 10.0 | 12.8 | 0.28 | 1.08 | 0.328 | 0.324 | 1.012 | 0.426 | 686,42 | 68 by 48 |
| 702 + 1/2 | 7.2 | 0.57 | 0.50 | 1.14 | 1.16 | 1.14 | 0.036 | 2.40 | 2,7 | 9.8 | 11.8 | 0.27 | 1.08 | 0.324 | 0.325 | 0.998 | 0.434 | 666,30 | 72 by 36 |
| 703 | 7.2 | 0.58 | 0.50 | 1.17 | 1.20 | 1.17 | 0.032 | 2.52 | 2,7 | 10.0 | 13.2 | 0.28 | 1.09 | 0.322 | 0.325 | 0.990 | 0.443 | 706,338 | 56 by 64 |
| 703 + 1/2 | 7.7 | 0.60 | 0.50 | 1.20 | 1.22 | 1.197 | 0.045 | 2.69 | 1,5 | 11.1 | 14.0 | 0.28 | 1.09 | 0.324 | 0.325 | 0.996 | 0.449 | 898,638 | 72 by 60 |
| 704 | 7.9 | 0.61 | 0.50 | 1.22 | 1.26 | 1.22 | 0.036 | 2.46 | 1,5 | 11.7 | 15.4 | 0.28 | 1.08 | 0.326 | 0.327 | 0.996 | 0.458 | 1114,818 | 80 by 72 |
| 704 + 1/2 | 8.7 | 0.63 | 0.50 | 1.26 | 1.29 | 1.26 | 0.040 | 2.75 | 10,1 | 11.5 | 16.7 | 0.28 | 1.09 | 0.331 | 0.329 | 1.005 | 0.467 | 306,854 | 40 by 48 |
| 705 | 8.9 | 0.63 | 0.50 | 1.26 | 1.28 | 1.26 | 0.032 | 2.75 | 10,2 | 11.5 | 17.6 | 0.29 | 1.08 | 0.332 | 0.333 | 0.998 | 0.474 | 314,854 | 48 by 48 |
| 705 + 1/2 | 9.3 | 0.62 | 0.50 | 1.25 | 1.26 | 1.25 | 0.024 | 2.85 | 10,2 | 12.1 | 19.2 | 0.28 | 1.06 | 0.335 | 0.334 | 1.004 | 0.485 | 334,854 | 40 by 52 |
| 706 | 9.9 | 0.61 | 0.50 | 1.22 | 1.22 | 1.22 | 0.035 | 2.70 | 2,8 | 12.7 | 20.5 | 0.28 | 1.03 | 0.336 | 0.335 | 1.004 | 0.492 | 898,622 | 76 by 60 |
| 706 + 1/2 | 10.2 | 0.57 | 0.50 | 1.15 | 1.12 | 1.12 | 0.053 | 2.80 | 2,8 | 13.1 | 20.6 | 0.28 | 0.99 | 0.335 | 0.338 | 0.992 | 0.502 | 570,178 | 68 by 76 |
| 707 | 10.8 | 0.54 | 0.50 | 1.08 | 1.00 | 1.00 | 0.044 | 2.34 | 0,5 | 13.5 | 20.8 | 0.28 | 0.93 | 0.341 | 0.338 | 1.011 | 0.512 | 686,342 | 76 by 92 |
| 707 + 1/2 | 11.0 | 0.50 | 0.50 | 0.99 | 0.98 | 0.98 | 0.059 | 2.30 | 0,5 | 13.8 | 20.7 | 0.28 | 0.91 | 0.339 | 0.342 | 0.992 | 0.522 | 750,370 | 92 by 132 |
| 708 | 11.6 | 0.50 | 0.49 | 1.01 | 1.01 | 1.01 | 0.047 | 2.25 | 0,5 | 14.3 | 20.2 | 0.29 | 0.90 | 0.343 | 0.342 | 1.003 | 0.534 | 554,150 | 64 by 68 |
| 708 + 1/2 | 11.8 | 0.47 | 0.50 | 0.95 | 0.98 | 0.95 | 0.057 | 2.18 | 1,8 | 14.8 | 19.9 | 0.28 | 0.89 | 0.343 | 0.348 | 0.987 | 0.546 | 898,510 | 84 by 64 |
| 709 | 12.5 | 0.45 | 0.50 | 0.90 | 0.94 | 0.90 | 0.065 | 2.01 | 1,8 | 15.6 | 20.2 | 0.28 | 0.88 | 0.352 | 0.349 | 1.008 | 0.555 | 506,146 | 64 by 56 |
| 709 + 1/2 | 12.8 | 0.43 | 0.50 | 0.88 | 0.89 | 0.88 | 0.056 | 1.46 | 12,6 | 16.3 | 20.4 | 0.28 | 0.87 | 0.355 | 0.354 | 1.002 | 0.567 | 962,590 | 148 by 92 |
| 710 | 13.3 | 0.43 | 0.50 | 0.86 | 0.90 | 0.86 | 0.099 | 1.45 | 11,4 | 17.0 | 20.6 | 0.28 | 0.87 | 0.357 | 0.359 | 0.995 | 0.579 | 658,210 | 112 by 76 |
| 710 + 1/2 | 13.6 | 0.42 | 0.50 | 0.85 | 0.88 | 0.85 | 0.061 | 1.66 | 0,0 | 17.9 | 21.4 | 0.28 | 0.88 | 0.362 | 0.363 | 0.998 | 0.589 | 974,538 | 72 by 56 |
| 711 | 13.8 | 0.42 | 0.50 | 0.85 | 0.85 | 0.85 | 0.088 | 1.59 | 15,3 | 18.8 | 21.9 | 0.28 | 0.88 | 0.369 | 0.368 | 1.003 | 0.597 | 862,450 | 84 by 72 |
| 711 + 1/2 | 14.3 | 0.41 | 0.50 | 0.83 | 0.83 | 0.83 | 0.084 | 2.18 | 15,3 | 19.4 | 22.2 | 0.28 | 0.89 | 0.373 | 0.374 | 0.998 | 0.603 | 746,374 | 156 by 124 |
| 712 | 14.6 | 0.42 | 0.50 | 0.84 | 0.82 | 0.82 | 0.115 | 2.51 | 15,3 | 19.5 | 22.4 | 0.29 | 0.89 | 0.379 | 0.383 | 0.991 | 0.611 | 754,422 | 60 by 80 |
| 712 + 1/2 | 15.6 | 0.42 | 0.50 | 0.85 | 0.83 | 0.83 | 0.161 | 2.63 | 15,3 | 19.6 | 22.6 | 0.29 | 0.92 | 0.392 | 0.389 | 1.009 | 0.614 | 654,310 | 60 by 60 |
| 713 | 15.4 | 0.43 | 0.50 | 0.86 | 0.84 | 0.84 | 0.115 | 2.98 | 15,2 | 19.7 | 23.0 | 0.29 | 0.93 | 0.398 | 0.401 | 0.993 | 0.622 | 706,186 | 64 by 88 |
| 713 + 1/2 | 15.7 | 0.44 | 0.50 | 0.88 | 0.92 | 0.88 | 0.099 | 3.53 | 15,2 | 19.2 | 23.1 | 0.29 | 0.99 | 0.411 | 0.407 | 1.008 | 0.623 | 722,390 | 68 by 92 |
| 714 | 16.0 | 0.45 | 0.50 | 0.91 | 0.93 | 0.91 | 0.055 | 3.82 | 15,1 | 19.4 | 23.1 | 0.30 | 1.00 | 0.416 | 0.421 | 0.990 | 0.624 | 786,150 | 96 by 128 |
| 714 + 1/2 | 15.8 | 0.45 | 0.50 | 0.92 | 0.92 | 0.92 | 0.105 | 2.94 | 15,1 | 19.3 | 21.7 | 0.30 | 0.99 | 0.431 | 0.428 | 1.008 | 0.627 | 818,402 | 100 by 80 |
| 715 | 16.4 | 0.46 | 0.50 | 0.93 | 0.96 | 0.93 | 0.095 | 2.29 | 15,1 | 20.0 | 22.8 | 0.30 | 1.01 | 0.439 | 0.442 | 0.995 | 0.627 | 1090,834 | 96 by 64 |
| 715 + 1/2 | 16.5 | 0.48 | 0.50 | 0.96 | 0.98 | 0.96 | 0.082 | 2.19 | 15,0 | 21.0 | 23.0 | 0.30 | 0.99 | 0.452 | 0.452 | 1.000 | 0.630 | 410,154 | 56 by 76 |
| 716 | 16.9 | 0.48 | 0.50 | 0.98 | 0.96 | 0.96 | 0.135 | 2.41 | 14,0 | 21.4 | 22.8 | 0.30 | 1.00 | 0.465 | 0.462 | 1.007 | 0.631 | 826,558 | 92 by 88 |
| 716 + 1/2 | 17.0 | 0.50 | 0.49 | 1.00 | 0.99 | 0.99 | 0.140 | 2.76 | 14,0 | 22.6 | 34.1 | 0.30 | 0.99 | 0.471 | 0.476 | 0.990 | 0.634 | 766,462 | 164 by 80 |
| 717 | 17.2 | 0.50 | 0.50 | 1.00 | 1.00 | 1.00 | 0.112 | 3.04 | 14,0 | 23.0 | 30.4 | 0.29 | 1.00 | 0.487 | 0.483 | 1.008 | 0.636 | 930,466 | 72 by 60 |
| 717 + 1/2 | 17.5 | 0.52 | 0.51 | 1.02 | 1.03 | 1.02 | 0.082 | 2.36 | 14,0 | 23.6 | 30.3 | 0.29 | 1.01 | 0.495 | 0.495 | 0.999 | 0.634 | 1062,762 | 104 by 128 |
| 718 | 17.4 | 0.51 | 0.52 | 0.98 | 0.98 | 0.98 | 0.141 | 2.91 | 13,0 | 23.9 | 26.2 | 0.29 | 0.99 | 0.503 | 0.505 | 0.995 | 0.639 | 310,66 | 56 by 84 |
| 718 + 1/2 | 17.9 | 0.53 | 0.53 | 1.00 | 0.99 | 0.99 | 0.117 | 2.62 | 13,0 | 24.9 | 26.3 | 0.28 | 1.00 | 0.516 | 0.513 | 1.005 | 0.639 | 794,550 | 96 by 96 |
| 719 | 18.2 | 0.54 | 0.54 | 0.99 | 1.02 | 0.99 | 0.109 | 2.64 | 13,0 | 25.9 | 28.2 | 0.28 | 1.00 | 0.524 | 0.527 | 0.994 | 0.641 | 238,74 | 60 by 68 |
| 719 + 1/2 | 18.2 | 0.56 | 0.55 | 1.01 | 1.02 | 1.01 | 0.108 | 2.24 | 12,0 | 25.9 | 28.1 | 0.28 | 0.99 | 0.538 | 0.539 | 0.997 | 0.642 | 546,218 | 108 by 60 |
| 720 | 18.9 | 0.57 | 0.57 | 1.00 | 1.05 | 1.00 | 0.087 | 2.19 | 12,0 | 26.7 | 29.7 | 0.28 | 1.01 | 0.558 | 0.546 | 1.021 | 0.643 | 694,314 | 104 by 76 |
| 720 + 1/2 | 18.9 | 0.58 | 0.59 | 0.97 | 0.95 | 0.95 | 0.147 | 2.10 | 12,4 | 27.3 | 29.7 | 0.28 | 0.97 | 0.554 | 0.560 | 0.990 | 0.644 | 582,214 | 100 by 128 |
| 721 | 19.0 | 0.62 | 0.60 | 1.04 | 0.96 | 0.96 | 0.138 | 2.06 | 11,0 | 28.1 | 30.7 | 0.28 | 1.00 | 0.562 | 0.571 | 0.984 | 0.648 | 530,294 | 96 by 160 |
| 721 + 1/2 | 19.2 | 0.77 | 0.62 | 1.25 | 1.08 | 1.08 | 0.166 | 4.98 | 11,0 | 29.4 | 31.6 | 0.28 | 1.00 | 0.585 | 0.580 | 1.008 | 0.649 | 302,266 | 48 by 68 |
| 722 | 18.9 | 0.68 | 0.62 | 1.11 | 1.07 | 1.07 | 0.155 | 5.61 | 11,0 | 30.0 | 31.6 | 0.27 | 1.00 | 0.597 | 0.596 | 1.003 | 0.652 | 630,50 | 60 by 44 |
| 722 + 1/2 | 19.8 | 0.65 | 0.62 | 1.04 | 1.06 | 1.04 | 0.147 | 4.30 | 11,0 | 30.0 | 31.7 | 0.27 | 1.00 | 0.607 | 0.608 | 0.998 | 0.650 | 1238,650 | 64 by 60 |
| 723 | 19.9 | 0.63 | 0.62 | 1.00 | 0.99 | 0.99 | 0.195 | 2.50 | 11,0 | 30.1 | 33.2 | 0.27 | 1.00 | 0.619 | 0.620 | 0.999 | 0.652 | 206,246 | 48 by 60 |
| 723 + 1/2 | 19.6 | 0.62 | 0.63 | 0.99 | 1.00 | 0.99 | 0.147 | 1.91 | 3,1 | 31.3 | 33.9 | 0.27 | 0.99 | 0.633 | 0.634 | 0.997 | 0.652 | 394,194 | 140 by 112 |
| 724 | 19.6 | 0.63 | 0.63 | 1.00 | 0.93 | 0.93 | 0.253 | 1.91 | 3,1 | 31.8 | 34.1 | 0.27 | 0.99 | 0.650 | 0.651 | 0.998 | 0.653 | 394,230 | 84 by 104 |
| 724 + 1/2 | 20.8 | 0.63 | 0.63 | 1.00 | 1.02 | 1.00 | 0.172 | 2.01 | 6,1 | 32.3 | 34.1 | 0.27 | 0.98 | 0.669 | 0.661 | 1.012 | 0.654 | 814,206 | 100 by 76 |
| 725 | 20.1 | 0.62 | 0.64 | 0.96 | 0.98 | 0.96 | 0.154 | 1.94 | 2,1 | 33.0 | 34.3 | 0.27 | 1.00 | 0.672 | 0.672 | 1.001 | 0.656 | 270,118 | 72 by 84 |
| 725 + 1/2 | 20.3 | 0.62 | 0.65 | 0.95 | 0.99 | 0.95 | 0.152 | 1.73 | 6,1 | 33.7 | 34.9 | 0.27 | 0.99 | 0.674 | 0.679 | 0.993 | 0.657 | 78,246 | 52 by 44 |
| 726 | 19.9 | 0.63 | 0.66 | 0.96 | 0.94 | 0.94 | 0.257 | 1.71 | 2,1 | 34.1 | 35.5 | 0.27 | 0.97 | 0.686 | 0.691 | 0.993 | 0.657 | 346,382 | 84 by 92 |
| 726 + 1/2 | 20.3 | 0.64 | 0.66 | 0.97 | 1.01 | 0.97 | 0.166 | 1.75 | 4,0 | 34.3 | 35.5 | 0.27 | 1.00 | 0.707 | 0.697 | 1.015 | 0.659 | 174,90 | 64 by 72 |
| 727 | 20.2 | 0.65 | 0.67 | 0.97 | 0.97 | 0.97 | 0.176 | 1.92 | 4,0 | 34.5 | 36.1 | 0.27 | 0.99 | 0.708 | 0.716 | 0.988 | 0.660 | 282,370 | 96 by 88 |
| 727 + 1/2 | 20.5 | 0.66 | 0.68 | 0.97 | 0.99 | 0.97 | 0.201 | 1.84 | 3,0 | 34.9 | 36.3 | 0.27 | 1.00 | 0.726 | 0.722 | 1.005 | 0.661 | 250,362 | 100 by 132 |
| 728 | 20.7 | 0.66 | 0.69 | 0.96 | 1.00 | 0.96 | 0.176 | 1.98 | 3,0 | 35.0 | 36.5 | 0.27 | 1.02 | 0.736 | 0.738 | 0.998 | 0.663 | 374,130 | 100 by 108 |
| 728 + 1/2 | 20.0 | 0.68 | 0.70 | 0.98 | 1.00 | 0.98 | 0.203 | 2.12 | 3,0 | 34.5 | 35.6 | 0.27 | 0.99 | 0.749 | 0.747 | 1.003 | 0.664 | 102,158 | 92 by 68 |
| 729 | 21.4 | 0.69 | 0.71 | 0.97 | 1.02 | 0.97 | 0.159 | 1.84 | 12,8 | 35.0 | 39.7 | 0.28 | 1.00 | 0.758 | 0.761 | 0.997 | 0.666 | 122,346 | 120 by 104 |
| 729 + 1/2 | 21.9 | 0.70 | 0.72 | 0.97 | 0.99 | 0.97 | 0.187 | 1.91 | 4,0 | 34.9 | 36.4 | 0.28 | 0.98 | 0.772 | 0.776 | 0.995 | 0.667 | 362,54 | 176 by 76 |
| 730 | 21.8 | 0.72 | 0.71 | 1.02 | 1.04 | 1.02 | 0.171 | 1.81 | 12,7 | 34.3 | 37.0 | 0.28 | 1.00 | 0.803 | 0.783 | 1.024 | 0.668 | 1502,874 | 76 by 60 |
| 730 + 1/2 | 21.5 | 0.72 | 0.74 | 0.99 | 0.96 | 0.96 | 0.198 | 1.77 | 12,7 | 34.3 | 36.1 | 0.29 | 0.99 | 0.794 | 0.810 | 0.980 | 0.669 | 214,50 | 72 by 48 |
| 731 | 21.2 | 0.75 | 0.74 | 1.01 | 1.01 | 1.01 | 0.181 | 1.61 | 1,0 | 34.2 | 35.7 | 0.29 | 1.01 | 0.818 | 0.818 | 1.000 | 0.671 | 146,46 | 96 by 36 |
| 731 + 1/2 | 21.7 | 0.76 | 0.76 | 0.99 | 0.99 | 0.99 | 0.180 | 1.65 | 8,3 | 33.9 | 35.3 | 0.30 | 0.98 | 0.833 | 0.839 | 0.993 | 0.672 | 170,166 | 108 by 164 |
| 732 | 21.5 | 0.78 | 0.77 | 1.01 | 1.05 | 1.01 | 0.152 | 1.80 | 12,8 | 33.3 | 34.8 | 0.30 | 1.00 | 0.861 | 0.853 | 1.010 | 0.675 | 1534,1018 | 64 by 92 |
| 732 + 1/2 | 22.1 | 0.79 | 0.79 | 1.00 | 0.97 | 0.97 | 0.205 | 1.61 | 12,8 | 32.7 | 34.5 | 0.31 | 0.99 | 0.872 | 0.869 | 1.003 | 0.676 | 394,42 | 60 by 36 |
| 733 | 21.6 | 0.80 | 0.80 | 1.00 | 0.99 | 0.99 | 0.194 | 1.79 | 13,8 | 31.8 | 33.7 | 0.31 | 1.00 | 0.877 | 0.880 | 0.997 | 0.678 | 174,314 | 72 by 64 |
| 733 + 1/2 | 20.5 | 0.81 | 0.80 | 1.00 | 1.01 | 1.00 | 0.165 | 1.73 | 13,8 | 31.0 | 33.3 | 0.32 | 0.99 | 0.888 | 0.882 | 1.006 | 0.681 | 1558,822 | 72 by 72 |
| 734 | 20.4 | 0.81 | 0.81 | 1.00 | 1.01 | 1.00 | 0.158 | 2.15 | 13,7 | 30.4 | 32.7 | 0.32 | 1.00 | 0.888 | 0.886 | 1.002 | 0.683 | 1490,994 | 92 by 72 |
| 734 + 1/2 | 21.5 | 0.82 | 0.82 | 1.01 | 0.99 | 0.99 | 0.201 | 2.46 | 13,7 | 29.9 | 32.0 | 0.33 | 1.00 | 0.899 | 0.888 | 1.013 | 0.685 | 1578,1070 | 76 by 36 |
| 735 | 21.9 | 0.82 | 0.83 | 0.99 | 0.99 | 0.99 | 0.201 | 2.11 | 13,8 | 29.2 | 33.9 | 0.33 | 1.00 | 0.883 | 0.891 | 0.992 | 0.688 | 146,274 | 60 by 64 |
| 735 + 1/2 | 20.4 | 0.83 | 0.83 | 1.01 | 1.00 | 1.00 | 0.195 | 2.01 | 13,7 | 28.5 | 30.4 | 0.34 | 1.01 | 0.894 | 0.882 | 1.014 | 0.690 | 1626,1070 | 52 by 24 |
| 736 | 21.0 | 0.85 | 0.84 | 1.01 | 1.01 | 1.01 | 0.189 | 1.82 | 13,7 | 27.7 | 29.6 | 0.35 | 0.99 | 0.880 | 0.881 | 0.999 | 0.692 | 286,722 | 72 by 100 |
| 736 + 1/2 | 21.2 | 0.85 | 0.84 | 1.01 | 1.03 | 1.01 | 0.150 | 1.73 | 13,8 | 27.0 | 28.6 | 0.35 | 1.01 | 0.880 | 0.881 | 0.998 | 0.694 | 266,50 | 80 by 44 |
| 737 | 21.0 | 0.84 | 0.85 | 0.99 | 0.97 | 0.97 | 0.169 | 2.65 | 14,8 | 26.2 | 27.8 | 0.36 | 0.98 | 0.870 | 0.881 | 0.987 | 0.698 | 154,634 | 92 by 52 |
| 737 + 1/2 | 19.8 | 0.86 | 0.84 | 1.02 | 1.00 | 1.00 | 0.144 | 2.78 | 14,8 | 25.3 | 26.9 | 0.36 | 1.00 | 0.881 | 0.886 | 0.995 | 0.700 | 354,58 | 108 by 68 |
| 738 | 20.5 | 0.89 | 0.84 | 1.05 | 1.00 | 1.00 | 0.179 | 4.74 | 14,8 | 24.4 | 26.1 | 0.37 | 0.99 | 0.893 | 0.888 | 1.005 | 0.703 | 1722,1070 | 56 by 32 |
| 738 + 1/2 | 20.3 | 0.89 | 0.84 | 1.06 | 1.08 | 1.06 | 0.060 | 5.85 | 14,8 | 23.7 | 25.2 | 0.37 | 0.99 | 0.895 | 0.901 | 0.994 | 0.705 | 1754,1074 | 48 by 40 |
| 739 | 20.4 | 0.92 | 0.84 | 1.09 | 1.07 | 1.07 | 0.115 | 6.23 | 14,8 | 22.9 | 24.4 | 0.38 | 1.00 | 0.910 | 0.905 | 1.005 | 0.707 | 1766,1074 | 96 by 100 |
| 739 + 1/2 | 20.0 | 0.94 | 0.84 | 1.11 | 1.13 | 1.11 | 0.073 | 6.62 | 14,7 | 22.0 | 23.8 | 0.38 | 1.00 | 0.918 | 0.909 | 1.009 | 0.710 | 1746,998 | 116 by 136 |
| 740 | 20.0 | 0.94 | 0.84 | 1.11 | 1.15 | 1.11 | 0.054 | 7.17 | 14,7 | 21.2 | 23.1 | 0.39 | 1.01 | 0.915 | 0.909 | 1.006 | 0.712 | 1734,926 | 96 by 116 |
| 740 + 1/2 | 19.4 | 0.94 | 0.84 | 1.11 | 1.15 | 1.11 | 0.052 | 5.06 | 14,7 | 20.2 | 22.1 | 0.39 | 1.01 | 0.909 | 0.912 | 0.997 | 0.716 | 1710,850 | 112 by 144 |
| 741 | 19.4 | 0.94 | 0.84 | 1.12 | 1.17 | 1.12 | 0.047 | 4.35 | 14,6 | 19.2 | 21.1 | 0.40 | 1.02 | 0.908 | 0.901 | 1.008 | 0.719 | 1702,810 | 96 by 116 |
| 741 + 1/2 | 19.1 | 0.94 | 0.84 | 1.11 | 1.17 | 1.11 | 0.035 | 4.66 | 13,5 | 18.2 | 19.8 | 0.40 | 1.03 | 0.893 | 0.894 | 0.999 | 0.721 | 1658,726 | 124 by 144 |
| 742 | 18.9 | 0.93 | 0.84 | 1.10 | 1.17 | 1.10 | 0.027 | 4.92 | 13,5 | 17.0 | 18.5 | 0.41 | 1.04 | 0.880 | 0.874 | 1.006 | 0.724 | 1666,706 | 108 by 128 |
| 742 + 1/2 | 18.6 | 0.91 | 0.84 | 1.08 | 1.14 | 1.08 | 0.021 | 3.93 | 13,5 | 15.8 | 17.6 | 0.41 | 1.02 | 0.855 | 0.862 | 0.992 | 0.726 | 1634,654 | 108 by 128 |
| 743 | 18.4 | 0.89 | 0.84 | 1.06 | 1.12 | 1.06 | 0.022 | 3.78 | 13,4 | 14.7 | 16.5 | 0.42 | 1.01 | 0.845 | 0.848 | 0.996 | 0.729 | 1586,574 | 120 by 128 |
| 743 + 1/2 | 18.0 | 0.89 | 0.84 | 1.06 | 1.13 | 1.06 | 0.014 | 3.10 | 13,4 | 13.7 | 16.1 | 0.42 | 1.00 | 0.842 | 0.834 | 1.009 | 0.731 | 1554,534 | 116 by 104 |
| 744 | 17.6 | 0.87 | 0.84 | 1.03 | 1.09 | 1.03 | 0.036 | 3.12 | 12,3 | 13.3 | 16.2 | 0.42 | 0.97 | 0.823 | 0.828 | 0.994 | 0.733 | 1518,486 | 96 by 96 |
| 744 + 1/2 | 17.4 | 0.85 | 0.84 | 1.02 | 1.08 | 1.02 | 0.021 | 3.17 | 12,3 | 13.4 | 16.0 | 0.43 | 0.96 | 0.814 | 0.813 | 1.001 | 0.735 | 1502,462 | 100 by 96 |
| 745 | 17.0 | 0.84 | 0.83 | 1.01 | 1.07 | 1.01 | 0.022 | 2.44 | 12,3 | 13.5 | 17.1 | 0.43 | 0.97 | 0.803 | 0.798 | 1.006 | 0.737 | 1478,434 | 120 by 108 |
| 745 + 1/2 | 16.8 | 0.82 | 0.82 | 1.00 | 1.03 | 1.00 | 0.016 | 1.85 | 15,7 | 13.5 | 19.0 | 0.44 | 0.97 | 0.783 | 0.785 | 0.997 | 0.740 | 66,170 | 56 by 92 |
| 746 | 16.5 | 0.80 | 0.79 | 1.01 | 1.00 | 1.00 | 0.021 | 1.98 | 11,2 | 13.5 | 21.0 | 0.44 | 0.98 | 0.767 | 0.759 | 1.011 | 0.742 | 174,74 | 56 by 56 |
| 746 + 1/2 | 16.3 | 0.76 | 0.77 | 0.98 | 1.00 | 0.98 | 0.020 | 2.12 | 15,6 | 13.6 | 22.7 | 0.44 | 1.00 | 0.735 | 0.741 | 0.991 | 0.743 | 910,22 | 92 by 64 |
| 747 | 15.9 | 0.74 | 0.73 | 1.02 | 1.00 | 1.00 | 0.028 | 2.39 | 15,6 | 12.6 | 22.9 | 0.45 | 1.01 | 0.716 | 0.709 | 1.010 | 0.744 | 1238,954 | 56 by 52 |
| 747 + 1/2 | 15.7 | 0.71 | 0.71 | 0.99 | 1.00 | 0.99 | 0.010 | 1.75 | 15,6 | 11.4 | 23.2 | 0.45 | 1.01 | 0.683 | 0.689 | 0.991 | 0.745 | 1250,962 | 56 by 56 |
| 748 | 15.4 | 0.68 | 0.69 | 0.99 | 0.99 | 0.99 | 0.008 | 1.71 | 15,6 | 11.4 | 24.4 | 0.45 | 1.01 | 0.662 | 0.666 | 0.994 | 0.745 | 1266,970 | 52 by 56 |
| 748 + 1/2 | 15.1 | 0.67 | 0.67 | 1.00 | 0.99 | 0.99 | 0.011 | 1.67 | 4,4 | 11.6 | 25.6 | 0.45 | 1.00 | 0.649 | 0.654 | 0.993 | 0.746 | 1278,978 | 56 by 60 |
| 749 | 14.8 | 0.66 | 0.66 | 1.00 | 1.01 | 1.00 | 0.002 | 1.60 | 9,1 | 11.8 | 26.6 | 0.45 | 1.00 | 0.646 | 0.643 | 1.006 | 0.747 | 950,866 | 72 by 60 |
| 749 + 1/2 | 14.6 | 0.65 | 0.65 | 1.00 | 1.00 | 1.00 | 0.009 | 1.73 | 9,1 | 12.0 | 26.0 | 0.46 | 1.00 | 0.636 | 0.637 | 0.999 | 0.747 | 1422,838 | 68 by 128 |
| 750 | 14.3 | 0.64 | 0.64 | 0.99 | 0.99 | 0.99 | 0.004 | 1.69 | 9,1 | 12.7 | 27.2 | 0.46 | 0.99 | 0.624 | 0.632 | 0.988 | 0.748 | 1434,834 | 68 by 160 |
| 750 + 1/2 | 14.1 | 0.64 | 0.64 | 1.00 | 1.00 | 1.00 | 0.006 | 1.56 | 9,1 | 13.4 | 28.0 | 0.46 | 0.99 | 0.627 | 0.624 | 1.005 | 0.749 | 318,962 | 64 by 60 |
| 751 | 13.8 | 0.63 | 0.64 | 0.99 | 0.99 | 0.99 | 0.006 | 1.55 | 11,8 | 14.4 | 29.4 | 0.47 | 1.00 | 0.623 | 0.626 | 0.996 | 0.748 | 878,74 | 112 by 60 |
| 751 + 1/2 | 13.6 | 0.63 | 0.63 | 1.00 | 1.00 | 1.00 | 0.005 | 1.55 | 7,0 | 15.3 | 30.8 | 0.47 | 1.00 | 0.624 | 0.625 | 0.999 | 0.749 | 470,6 | 108 by 28 |
| 752 | 13.3 | 0.64 | 0.63 | 1.02 | 1.01 | 1.01 | 0.006 | 1.73 | 3,5 | 16.0 | 30.9 | 0.47 | 1.00 | 0.634 | 0.622 | 1.018 | 0.749 | 434,6 | 80 by 32 |
| 752 + 1/2 | 13.1 | 0.63 | 0.63 | 1.00 | 1.00 | 1.00 | 0.005 | 1.58 | 6,0 | 17.0 | 39.3 | 0.47 | 1.00 | 0.621 | 0.622 | 0.999 | 0.749 | 622,6 | 52 by 36 |
| 753 | 12.8 | 0.62 | 0.63 | 0.99 | 1.00 | 0.99 | 0.003 | 1.55 | 6,0 | 17.3 | 32.1 | 0.48 | 1.00 | 0.619 | 0.617 | 1.003 | 0.749 | 450,6 | 116 by 36 |
| 753 + 1/2 | 12.6 | 0.61 | 0.63 | 0.98 | 0.99 | 0.98 | 0.001 | 1.62 | 6,0 | 18.3 | 39.1 | 0.48 | 1.00 | 0.610 | 0.619 | 0.985 | 0.748 | 370,598 | 68 by 64 |
| 754 | 12.4 | 0.61 | 0.62 | 0.98 | 0.98 | 0.98 | 0.008 | 1.55 | 15,5 | 18.5 | 33.3 | 0.48 | 1.00 | 0.613 | 0.617 | 0.993 | 0.748 | 338,474 | 52 by 56 |
| 754 + 1/2 | 12.0 | 0.62 | 0.62 | 0.99 | 0.97 | 0.97 | 0.012 | 1.80 | 2,5 | 19.3 | 39.9 | 0.49 | 1.00 | 0.620 | 0.614 | 1.009 | 0.748 | 438,6 | 84 by 44 |
| 755 | 11.7 | 0.61 | 0.62 | 0.98 | 0.96 | 0.96 | 0.012 | 1.74 | 2,5 | 19.0 | 46.8 | 0.49 | 1.00 | 0.616 | 0.616 | 1.000 | 0.747 | 582,838 | 64 by 68 |
| 755 + 1/2 | 11.5 | 0.61 | 0.62 | 0.99 | 0.97 | 0.97 | 0.015 | 1.71 | 2,5 | 19.6 | 36.2 | 0.49 | 1.01 | 0.617 | 0.616 | 1.001 | 0.747 | 510,58 | 80 by 60 |
| 756 | 11.3 | 0.61 | 0.62 | 0.98 | 0.96 | 0.96 | 0.016 | 1.63 | 2,5 | 19.9 | 36.8 | 0.49 | 1.00 | 0.615 | 0.616 | 0.998 | 0.746 | 482,862 | 60 by 56 |
| 756 + 1/2 | 11.0 | 0.61 | 0.62 | 0.99 | 0.96 | 0.96 | 0.015 | 1.65 | 1,5 | 20.9 | 39.8 | 0.50 | 1.00 | 0.616 | 0.619 | 0.995 | 0.746 | 246,690 | 152 by 260 |
| 757 | 10.8 | 0.62 | 0.62 | 1.01 | 1.00 | 1.00 | 0.009 | 1.62 | 5,7 | 19.8 | 35.6 | 0.50 | 1.02 | 0.624 | 0.619 | 1.008 | 0.745 | 442,6 | 96 by 72 |
| 757 + 1/2 | 10.6 | 0.62 | 0.62 | 1.00 | 0.98 | 0.98 | 0.013 | 1.73 | 4,7 | 20.5 | 36.4 | 0.50 | 1.02 | 0.621 | 0.619 | 1.003 | 0.743 | 546,874 | 108 by 76 |
| 758 | 10.3 | 0.62 | 0.62 | 1.00 | 1.00 | 1.00 | 0.008 | 1.76 | 5,7 | 20.2 | 36.9 | 0.51 | 1.02 | 0.623 | 0.620 | 1.004 | 0.743 | 330,6 | 96 by 24 |
| 758 + 1/2 | 10.1 | 0.61 | 0.62 | 0.99 | 1.00 | 0.99 | 0.006 | 1.66 | 9,0 | 19.4 | 35.3 | 0.51 | 1.03 | 0.616 | 0.620 | 0.994 | 0.742 | 102,850 | 88 by 120 |
| 759 | 9.9 | 0.62 | 0.62 | 1.01 | 1.00 | 1.00 | 0.008 | 2.22 | 4,7 | 19.2 | 34.2 | 0.51 | 1.03 | 0.620 | 0.619 | 1.000 | 0.740 | 502,906 | 88 by 92 |
| 759 + 1/2 | 9.7 | 0.62 | 0.62 | 1.00 | 1.00 | 1.00 | 0.010 | 1.69 | 0,6 | 18.3 | 32.2 | 0.52 | 1.03 | 0.619 | 0.618 | 1.001 | 0.738 | 66,878 | 48 by 96 |
| 760 | 9.4 | 0.62 | 0.61 | 1.02 | 1.02 | 1.02 | 0.008 | 1.69 | 3,7 | 19.7 | 30.7 | 0.52 | 1.02 | 0.620 | 0.619 | 1.001 | 0.737 | 46,6 | 48 by 28 |
| 760 + 1/2 | 9.2 | 0.62 | 0.61 | 1.01 | 1.02 | 1.01 | 0.005 | 1.65 | 0,5 | 19.4 | 31.9 | 0.53 | 1.03 | 0.614 | 0.619 | 0.991 | 0.735 | 122,506 | 64 by 68 |
| 761 | 9.0 | 0.63 | 0.61 | 1.03 | 1.02 | 1.02 | 0.010 | 2.19 | 3,8 | 19.0 | 31.2 | 0.53 | 1.02 | 0.622 | 0.611 | 1.018 | 0.734 | 426,970 | 76 by 60 |
| 761 + 1/2 | 8.7 | 0.62 | 0.61 | 1.01 | 1.03 | 1.01 | 0.006 | 1.67 | 5,8 | 18.3 | 31.0 | 0.53 | 1.01 | 0.607 | 0.611 | 0.993 | 0.732 | 1330,1034 | 112 by 56 |
| 762 | 8.5 | 0.62 | 0.61 | 1.02 | 1.04 | 1.02 | 0.003 | 2.21 | 3,8 | 18.0 | 32.3 | 0.54 | 1.01 | 0.609 | 0.605 | 1.006 | 0.730 | 414,998 | 100 by 116 |
| 762 + 1/2 | 8.3 | 0.62 | 0.61 | 1.01 | 1.04 | 1.01 | 0.003 | 1.87 | 3,8 | 18.5 | 33.1 | 0.54 | 1.00 | 0.604 | 0.605 | 0.998 | 0.729 | 378,950 | 112 by 116 |
| 763 | 8.0 | 0.62 | 0.61 | 1.02 | 1.03 | 1.02 | 0.006 | 2.23 | 4,8 | 18.8 | 34.5 | 0.55 | 1.00 | 0.602 | 0.596 | 1.011 | 0.727 | 570,994 | 68 by 56 |
| 763 + 1/2 | 7.8 | 0.61 | 0.61 | 1.00 | 1.03 | 1.00 | 0.001 | 1.69 | 2,8 | 18.6 | 34.3 | 0.55 | 1.00 | 0.586 | 0.595 | 0.986 | 0.726 | 358,1022 | 164 by 56 |
| 764 | 7.6 | 0.60 | 0.60 | 1.01 | 1.02 | 1.01 | 0.007 | 2.13 | 4,8 | 18.6 | 35.4 | 0.55 | 1.00 | 0.588 | 0.581 | 1.011 | 0.725 | 550,1022 | 120 by 60 |
| 764 + 1/2 | 7.4 | 0.59 | 0.60 | 0.99 | 1.00 | 0.99 | 0.008 | 1.50 | 14,8 | 18.7 | 38.1 | 0.56 | 1.00 | 0.576 | 0.581 | 0.992 | 0.724 | 1770,1070 | 80 by 76 |
| 765 | 7.3 | 0.59 | 0.59 | 1.01 | 0.99 | 0.99 | 0.011 | 1.53 | 2,8 | 18.9 | 38.6 | 0.56 | 0.99 | 0.575 | 0.576 | 0.998 | 0.722 | 330,994 | 80 by 52 |
| 765 + 1/2 | 6.9 | 0.58 | 0.58 | 1.00 | 1.00 | 1.00 | 0.010 | 1.73 | 2,8 | 19.6 | 39.4 | 0.57 | 1.00 | 0.575 | 0.574 | 1.002 | 0.721 | 482,1026 | 76 by 60 |
| 766 | 6.7 | 0.58 | 0.57 | 1.01 | 1.01 | 1.01 | 0.006 | 1.51 | 3,8 | 19.7 | 38.8 | 0.57 | 1.00 | 0.574 | 0.568 | 1.011 | 0.720 | 410,1014 | 80 by 80 |
| 766 + 1/2 | 6.5 | 0.57 | 0.57 | 1.00 | 1.00 | 1.00 | 0.007 | 1.38 | 2,8 | 21.1 | 42.1 | 0.58 | 0.99 | 0.562 | 0.563 | 0.998 | 0.719 | 222,190 | 64 by 60 |
| 767 | 6.2 | 0.55 | 0.55 | 1.00 | 0.99 | 0.99 | 0.009 | 1.31 | 15,8 | 21.3 | 42.4 | 0.58 | 1.01 | 0.552 | 0.555 | 0.994 | 0.718 | 402,762 | 68 by 68 |
| 767 + 1/2 | 6.1 | 0.54 | 0.55 | 1.00 | 1.00 | 1.00 | 0.004 | 1.25 | 15,8 | 20.7 | 42.0 | 0.59 | 0.99 | 0.549 | 0.550 | 0.998 | 0.717 | 62,1006 | 60 by 60 |
| 768 | 5.8 | 0.54 | 0.53 | 1.01 | 1.01 | 1.01 | 0.002 | 1.38 | 2,6 | 22.1 | 44.0 | 0.59 | 1.01 | 0.547 | 0.542 | 1.010 | 0.717 | 326,770 | 160 by 64 |
| 768 + 1/2 | 5.6 | 0.53 | 0.53 | 0.99 | 0.99 | 0.99 | 0.001 | 1.22 | 4,3 | 20.8 | 42.9 | 0.60 | 1.00 | 0.535 | 0.539 | 0.992 | 0.716 | 154,998 | 52 by 56 |
| 769 | 5.4 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.002 | 1.22 | 4,3 | 22.3 | 43.5 | 0.60 | 1.00 | 0.529 | 0.533 | 0.993 | 0.717 | 710,878 | 64 by 56 |
| 769 + 1/2 | 5.1 | 0.52 | 0.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.26 | 4,3 | 21.0 | 43.4 | 0.61 | 1.00 | 0.531 | 0.527 | 1.009 | 0.714 | 706,886 | 52 by 48 |
| 770 | 5.0 | 0.51 | 0.51 | 1.00 | 1.00 | 1.00 | 0.000 | 1.24 | 1,4 | 21.6 | 43.7 | 0.62 | 1.00 | 0.524 | 0.525 | 0.999 | 0.716 | 706,890 | 64 by 48 |
| 770 + 1/2 | 4.7 | 0.51 | 0.51 | 0.99 | 0.99 | 0.99 | 0.000 | 1.25 | 1,4 | 20.8 | 45.0 | 0.62 | 1.00 | 0.520 | 0.521 | 0.997 | 0.716 | 414,702 | 72 by 148 |
| 771 | 4.5 | 0.51 | 0.50 | 1.01 | 1.01 | 1.01 | 0.000 | 1.26 | 1,4 | 20.0 | 43.6 | 0.63 | 1.00 | 0.519 | 0.516 | 1.006 | 0.715 | 694,894 | 84 by 52 |
| 771 + 1/2 | 4.3 | 0.50 | 0.50 | 0.99 | 0.99 | 0.99 | 0.000 | 1.24 | 2,3 | 18.3 | 39.2 | 0.63 | 1.00 | 0.512 | 0.514 | 0.995 | 0.716 | 322,822 | 68 by 52 |
| 772 | 4.1 | 0.49 | 0.49 | 1.00 | 1.00 | 1.00 | 0.000 | 1.24 | 3,7 | 17.8 | 37.3 | 0.64 | 0.99 | 0.509 | 0.509 | 1.000 | 0.715 | 1594,994 | 68 by 52 |
| 772 + 1/2 | 3.9 | 0.49 | 0.49 | 1.01 | 1.01 | 1.01 | 0.000 | 1.32 | 1,6 | 16.2 | 34.1 | 0.64 | 1.01 | 0.506 | 0.502 | 1.007 | 0.715 | 234,758 | 68 by 76 |
| 773 | 3.6 | 0.48 | 0.48 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 2,3 | 13.9 | 32.1 | 0.65 | 0.99 | 0.496 | 0.498 | 0.995 | 0.715 | 1430,790 | 68 by 64 |
| 773 + 1/2 | 3.4 | 0.48 | 0.47 | 1.01 | 1.01 | 1.01 | 0.000 | 1.22 | 11,4 | 12.3 | 27.9 | 0.65 | 1.00 | 0.491 | 0.490 | 1.003 | 0.716 | 298,846 | 68 by 56 |
| 774 | 3.2 | 0.47 | 0.47 | 0.99 | 0.99 | 0.99 | 0.000 | 1.27 | 1,6 | 10.7 | 25.1 | 0.66 | 1.00 | 0.484 | 0.485 | 0.996 | 0.716 | 678,922 | 60 by 52 |
| 774 + 1/2 | 3.0 | 0.46 | 0.46 | 1.01 | 1.01 | 1.01 | 0.000 | 1.40 | 11,4 | 9.7 | 22.6 | 0.66 | 1.00 | 0.480 | 0.477 | 1.005 | 0.717 | 678,922 | 68 by 48 |
| 775 | 2.8 | 0.46 | 0.46 | 1.00 | 1.00 | 1.00 | 0.000 | 1.41 | 11,4 | 8.6 | 19.8 | 0.67 | 1.01 | 0.471 | 0.473 | 0.997 | 0.720 | 934,1070 | 68 by 28 |
| 775 + 1/2 | 2.6 | 0.45 | 0.45 | 1.00 | 1.00 | 1.00 | 0.000 | 1.36 | 8,8 | 7.2 | 16.6 | 0.67 | 0.98 | 0.466 | 0.465 | 1.002 | 0.719 | 1050,1014 | 68 by 52 |
| 776 | 2.3 | 0.44 | 0.44 | 1.00 | 1.00 | 1.00 | 0.000 | 1.28 | 4,8 | 6.3 | 14.2 | 0.67 | 1.00 | 0.459 | 0.460 | 0.997 | 0.724 | 350,814 | 68 by 72 |
| 776 + 1/2 | 2.1 | 0.44 | 0.43 | 1.01 | 1.01 | 1.01 | 0.000 | 1.26 | 11,4 | 5.5 | 11.7 | 0.68 | 0.99 | 0.454 | 0.451 | 1.007 | 0.724 | 1458,786 | 72 by 56 |
| 777 | 1.9 | 0.43 | 0.43 | 0.99 | 0.99 | 0.99 | 0.000 | 1.19 | 6,5 | 4.7 | 9.5 | 0.68 | 1.00 | 0.443 | 0.447 | 0.992 | 0.730 | 666,938 | 60 by 48 |
| 777 + 1/2 | 1.7 | 0.42 | 0.42 | 0.99 | 0.99 | 0.99 | 0.000 | 1.18 | 6,5 | 4.1 | 7.5 | 0.68 | 1.00 | 0.438 | 0.441 | 0.991 | 0.731 | 1362,1046 | 72 by 60 |
| 778 | 1.5 | 0.42 | 0.42 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 5,5 | 3.7 | 5.9 | 0.68 | 1.00 | 0.439 | 0.438 | 1.004 | 0.732 | 1614,958 | 152 by 112 |
| 778 + 1/2 | 1.4 | 0.41 | 0.41 | 1.00 | 1.00 | 1.00 | 0.000 | 1.19 | 3,8 | 3.1 | 5.7 | 0.68 | 1.01 | 0.438 | 0.437 | 1.003 | 0.734 | 1050,1034 | 64 by 84 |
| 779 | 1.3 | 0.41 | 0.41 | 1.01 | 1.01 | 1.01 | 0.000 | 1.12 | 5,2 | 2.9 | 5.7 | 0.68 | 1.00 | 0.436 | 0.434 | 1.005 | 0.734 | 662,946 | 72 by 52 |
| 779 + 1/2 | 1.3 | 0.40 | 0.41 | 1.00 | 1.00 | 1.00 | 0.000 | 1.15 | 4,1 | 2.9 | 5.5 | 0.68 | 1.00 | 0.430 | 0.427 | 1.005 | 0.735 | 526,198 | 200 by 56 |
| 780 | 1.3 | 0.39 | 0.40 | 0.97 | 0.97 | 0.97 | 0.000 | 1.20 | 3,0 | 3.0 | 5.5 | 0.68 | 1.00 | 0.419 | 0.426 | 0.983 | 0.735 | 1506,746 | 88 by 76 |
| 780 + 1/2 | 1.3 | 0.39 | 0.40 | 0.99 | 0.99 | 0.99 | 0.000 | 1.27 | 3,0 | 2.9 | 5.5 | 0.69 | 1.00 | 0.419 | 0.421 | 0.995 | 0.736 | 1050,1042 | 76 by 60 |
| 781 | 1.3 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.39 | 3,0 | 3.0 | 5.5 | 0.69 | 1.00 | 0.422 | 0.419 | 1.007 | 0.735 | 218,862 | 76 by 60 |
| 781 + 1/2 | 1.3 | 0.39 | 0.39 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 5,7 | 2.9 | 5.5 | 0.69 | 1.00 | 0.419 | 0.421 | 0.995 | 0.736 | 258,474 | 124 by 68 |
| 782 | 1.3 | 0.40 | 0.39 | 1.01 | 1.01 | 1.01 | 0.000 | 1.38 | 3,0 | 2.9 | 5.5 | 0.69 | 1.00 | 0.424 | 0.421 | 1.005 | 0.736 | 1834,874 | 64 by 64 |
| 782 + 1/2 | 1.3 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.27 | 3,0 | 2.9 | 5.4 | 0.69 | 1.00 | 0.420 | 0.421 | 0.998 | 0.737 | 1902,826 | 44 by 60 |
| 783 | 1.3 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.12 | 3,8 | 2.9 | 5.5 | 0.69 | 1.00 | 0.422 | 0.422 | 1.001 | 0.737 | 1646,1006 | 64 by 112 |
| 783 + 1/2 | 1.3 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.18 | 1,7 | 2.9 | 5.5 | 0.69 | 1.00 | 0.420 | 0.423 | 0.993 | 0.737 | 206,874 | 104 by 72 |
| 784 | 1.3 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 13,4 |  |  |  | 1.00 | 0.424 | 0.422 | 1.003 | 0.737 | 150,1070 | 92 by 36 |
| 784 + 1/2 | 1.3 | 0.40 | 0.39 | 1.02 | 1.02 | 1.02 | 0.000 | 1.27 | 3,0 |  |  |  | 1.00 | 0.428 | 0.421 | 1.017 | 0.737 | 198,878 | 168 by 76 |
| 785 | 1.2 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 8,8 |  |  |  | 1.00 | 0.422 | 0.422 | 1.000 | 0.737 | 326,1070 | 60 by 48 |
| 785 + 1/2 | 1.2 | 0.39 | 0.39 | 0.99 | 0.99 | 0.99 | 0.000 | 1.19 | 3,0 |  |  |  | 1.00 | 0.418 | 0.422 | 0.990 | 0.738 | 10,846 | 36 by 64 |
| 786 | 1.2 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.20 | 5,0 |  |  |  | 1.00 | 0.421 | 0.421 | 0.998 | 0.738 | 254,486 | 100 by 92 |
| 786 + 1/2 | 1.2 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 11,5 |  |  |  | 1.00 | 0.422 | 0.421 | 1.002 | 0.738 | 1654,1014 | 64 by 56 |
| 787 | 1.2 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.16 | 0,4 |  |  |  | 1.00 | 0.421 | 0.421 | 1.000 | 0.738 | 194,886 | 68 by 52 |
| 787 + 1/2 | 1.2 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.14 | 3,8 |  |  |  | 1.00 | 0.421 | 0.421 | 1.000 | 0.738 | 406,1054 | 64 by 44 |
| 788 | 1.2 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.23 | 1,7 |  |  |  | 1.00 | 0.421 | 0.420 | 1.002 | 0.739 | 170,882 | 68 by 64 |
| 788 + 1/2 | 1.2 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 3,0 |  |  |  | 1.00 | 0.420 | 0.421 | 0.997 | 0.739 | 474,806 | 64 by 52 |
| 789 | 1.2 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 12,7 |  |  |  | 1.00 | 0.419 | 0.421 | 0.996 | 0.740 | 634,978 | 68 by 52 |
| 789 + 1/2 | 1.2 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.10 | 14,8 |  |  |  | 1.00 | 0.421 | 0.420 | 1.002 | 0.740 | 1678,974 | 64 by 96 |
| 790 | 1.2 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.26 | 4,0 |  |  |  | 1.01 | 0.420 | 0.420 | 1.001 | 0.740 | 150,890 | 84 by 60 |
| 790 + 1/2 | 1.2 | 0.39 | 0.39 | 1.00 | 1.00 | 1.00 | 0.000 | 1.17 | 15,8 |  |  |  | 1.00 | 0.421 | 0.421 | 1.000 | 0.740 | 630,982 | 60 by 48 |
| 791 | 1.2 | 0.39 | 0.39 | 0.99 | 0.99 | 0.99 | 0.000 | 1.12 | 1,8 |  |  |  | 1.00 | 0.417 | 0.421 | 0.991 | 0.741 | 46,902 | 68 by 56 |
| 791 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

### rise (mercury.rise, frames 960 to 1034, window 948 to 1046, 198 draft frames at rate 2)

Largest level step: 0.34 at frame 1007 (display values 0 to 255, the frame against the middle of its two neighbours), limit 1.3.
Largest pop score: 1.11 from frame 1031 + 1/2 to the next, limit 1.2. Every frame is read against the median of the 16 film frames round it: for the ends of the window 8 film frames before it and 8 after it are drawn and not judged.
Largest pop score of one block (a grid of 16 by 9): 11.81 from frame 1043 + 1/2 to the next, block column 12 row 3 from the top left, shown, not judged.
Largest change in place: 45.4 from frame 960 to 8 film frames later, most at pixel 448, 188 (display values 0 to 255: the later frame carried back along the motion, the difference smoothed over 20 px, its 99th percentile on the body), shown, not judged.
Largest change of the pattern alone: 0.64 from frame 1011 + 1/2 to 8 film frames later, most at pixel 764, 648, band 8 px (0 the same pattern, 1 an unrelated one: both pictures reduced to their detail between 8 and 40 px, the local mean taken out, divided by the local contrast, only where both have detail over 1; its 99th percentile on the body. Read on the nearer of the two frames, the farther one carried from its finer picture; the band is the width in px of the nearer frame under which the window at that pixel read nothing), limit 0.45.
The ground beside it, the same numbers on the surface view alone (frames 948 to 959 + 1/2): change 7.3, pattern 0.17.
The pattern is measured in every row.
The four largest pops, each with the next frame and what is left without the motion, are in the panels of the parts: frame 1031 + 1/2 in /home/user/workspace/work/p6/hm9/04/mercury-rise-p2of2-pops.png, frame 1040 + 1/2 in /home/user/workspace/work/p6/hm9/04/mercury-rise-p2of2-pops.png, frame 1041 in /home/user/workspace/work/p6/hm9/04/mercury-rise-p2of2-pops.png, frame 1043 in /home/user/workspace/work/p6/hm9/04/mercury-rise-p2of2-pops.png.
The two largest changes of the pattern and the largest changes in place, each with the later frame carried back, the difference and the change of the pattern, are in the panels of the parts: frame 962 + 1/2 in /home/user/workspace/work/p6/hm9/03/mercury-rise-p1of2-changes.png, frame 991 in no panel (a slice --frames 1982-1982 draws it), frame 999 in no panel (a slice --frames 1998-1998 draws it), frame 1011 + 1/2 in /home/user/workspace/work/p6/hm9/04/mercury-rise-p2of2-changes.png.

- RED the pattern of the picture changes in place by 0.64 from frame 1011 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (10 frames over it, first 1009 + 1/2)

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
| 952 + 1/2 | 77.43 | 0.00 | 2.3 | 3.98 | 3.91 | 1.02 | 1.02 | 1.02 | 0.000 | 1.23 | 14,8 | 7.3 | 16.5 | 0.71 | 0.15 | 0.71 | 8.6 |
| 953 | 77.54 | 0.01 | 2.2 | 4.03 | 3.91 | 1.03 | 1.03 | 1.03 | 0.000 | 1.27 | 13,7 | 8.0 | 16.3 | 0.71 | 0.16 | 0.71 | 8.0 |
| 953 + 1/2 | 77.62 | 0.00 | 2.2 | 4.07 | 3.91 | 1.04 | 1.04 | 1.04 | 0.000 | 1.21 | 7,7 | 9.0 | 17.3 | 0.72 | 0.15 | 0.71 | 8.0 |
| 954 | 77.71 | 0.00 | 2.2 | 4.11 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.19 | 2,8 | 11.4 | 20.5 | 0.72 | 0.15 | 0.71 | 8.0 |
| 954 + 1/2 | 77.78 | 0.00 | 2.1 | 4.11 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.21 | 2,8 | 13.9 | 24.7 | 0.72 | 0.15 | 0.72 | 8.0 |
| 955 | 77.86 | 0.00 | 2.1 | 4.14 | 3.91 | 1.06 | 1.06 | 1.06 | 0.000 | 1.26 | 5,7 | 16.9 | 28.9 | 0.72 | 0.15 | 0.72 | 8.0 |
| 955 + 1/2 | 77.93 | 0.00 | 2.1 | 4.13 | 3.91 | 1.06 | 1.06 | 1.06 | 0.000 | 1.22 | 4,7 | 19.7 | 32.5 | 0.73 | 0.16 | 0.72 | 8.0 |
| 956 | 78.00 | 0.00 | 2.1 | 4.13 | 3.91 | 1.06 | 1.06 | 1.06 | 0.000 | 1.25 | 0,7 | 22.7 | 35.6 | 0.73 | 0.16 | 0.72 | 8.7 |
| 956 + 1/2 | 78.07 | 0.00 | 2.1 | 4.12 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.24 | 4,7 | 25.5 | 39.4 | 0.73 | 0.17 | 0.72 | 8.0 |
| 957 | 78.14 | 0.00 | 2.1 | 4.11 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.28 | 0,7 | 28.1 | 44.0 | 0.73 | 0.18 | 0.72 | 8.8 |
| 957 + 1/2 | 78.21 | 0.00 | 2.0 | 4.09 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.22 | 4,6 | 31.2 | 48.1 | 0.74 | 0.20 | 0.72 | 8.0 |
| 958 | 78.29 | 0.00 | 2.1 | 4.11 | 3.91 | 1.05 | 1.05 | 1.05 | 0.001 | 1.31 | 0,7 | 34.1 | 52.3 | 0.73 | 0.22 | 0.72 | 8.4 |
| 958 + 1/2 | 78.37 | 0.00 | 2.1 | 4.08 | 3.91 | 1.04 | 1.04 | 1.04 | 0.000 | 1.28 | 7,6 | 37.0 | 56.8 | 0.73 | 0.23 | 0.72 | 8.4 |
| 959 | 78.45 | 0.00 | 2.0 | 4.12 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.41 | 9,6 | 39.9 | 61.1 | 0.73 | 0.25 | 0.72 | 8.4 |
| 959 + 1/2 | 78.55 | 0.00 | 2.1 | 4.06 | 3.91 | 1.04 | 1.04 | 1.04 | 0.000 | 1.27 | 8,6 | 42.6 | 65.2 | 0.73 | 0.27 | 0.72 | 8.3 |
| 960 first | 78.65 | 0.08 | 2.0 | 4.10 | 3.91 | 1.05 | 1.05 | 1.05 | 0.000 | 1.49 | 3,1 | 45.4 | 69.0 | 0.73 | 0.28 | 0.73 | 8.3 |
| 960 + 1/2 | 78.59 | 0.00 | 2.0 | 3.99 | 3.89 | 1.03 | 1.03 | 1.03 | 0.000 | 1.42 | 3,1 | 45.0 | 69.0 | 0.73 | 0.30 | 0.73 | 8.3 |
| 961 | 78.52 | 0.00 | 2.0 | 3.80 | 3.81 | 1.00 | 1.00 | 1.00 | 0.000 | 1.33 | 3,1 | 44.0 | 68.4 | 0.73 | 0.31 | 0.72 | 8.9 |
| 961 + 1/2 | 78.45 | 0.00 | 2.1 | 3.62 | 3.68 | 0.98 | 0.98 | 0.98 | 0.000 | 1.37 | 14,8 | 43.3 | 67.6 | 0.73 | 0.31 | 0.73 | 8.9 |
| 962 | 78.37 | 0.01 | 2.2 | 3.56 | 3.58 | 1.00 | 1.00 | 1.00 | 0.000 | 1.44 | 14,8 | 42.2 | 66.9 | 0.73 | 0.31 | 0.73 | 8.9 |
| 962 + 1/2 | 78.28 | 0.00 | 2.4 | 3.53 | 3.52 | 1.00 | 1.00 | 1.00 | 0.000 | 1.40 | 14,8 | 41.3 | 65.8 | 0.73 | 0.31 | 0.73 | 8.8 |
| 963 | 78.19 | 0.00 | 2.6 | 3.47 | 3.52 | 0.99 | 0.99 | 0.99 | 0.000 | 1.37 | 2,8 | 40.3 | 64.5 | 0.73 | 0.31 | 0.73 | 8.8 |
| 963 + 1/2 | 78.09 | 0.00 | 2.9 | 3.43 | 3.52 | 0.97 | 0.98 | 0.97 | 0.000 | 1.33 | 14,0 | 39.1 | 63.1 | 0.73 | 0.31 | 0.73 | 8.8 |
| 964 | 77.98 | 0.01 | 3.2 | 3.37 | 3.52 | 0.96 | 0.96 | 0.96 | 0.000 | 1.43 | 15,0 | 37.8 | 61.3 | 0.73 | 0.30 | 0.73 | 8.8 |
| 964 + 1/2 | 77.86 | 0.01 | 3.6 | 3.34 | 3.52 | 0.95 | 0.95 | 0.95 | 0.000 | 1.70 | 14,8 | 35.8 | 59.2 | 0.73 | 0.30 | 0.73 | 8.7 |
| 965 | 77.72 | 0.01 | 4.0 | 3.36 | 3.52 | 0.95 | 0.95 | 0.95 | 0.000 | 1.62 | 14,8 | 34.5 | 57.2 | 0.73 | 0.29 | 0.73 | 8.7 |
| 965 + 1/2 | 77.55 | 0.01 | 4.3 | 3.35 | 3.52 | 0.95 | 0.95 | 0.95 | 0.000 | 1.54 | 14,0 | 33.1 | 55.6 | 0.73 | 0.29 | 0.73 | 8.7 |
| 966 | 77.36 | 0.02 | 4.7 | 3.31 | 3.52 | 0.94 | 0.94 | 0.94 | 0.001 | 1.71 | 14,0 | 30.8 | 54.8 | 0.73 | 0.28 | 0.73 | 8.7 |
| 966 + 1/2 | 77.13 | 0.01 | 5.1 | 3.29 | 3.52 | 0.93 | 0.93 | 0.93 | 0.003 | 1.57 | 10,0 | 29.2 | 54.8 | 0.73 | 0.27 | 0.73 | 8.6 |
| 967 | 76.92 | 0.01 | 5.4 | 3.26 | 3.52 | 0.93 | 0.93 | 0.93 | 0.000 | 1.55 | 10,0 | 28.1 | 53.7 | 0.73 | 0.26 | 0.73 | 8.6 |
| 967 + 1/2 | 76.74 | 0.04 | 5.7 | 3.30 | 3.52 | 0.94 | 0.94 | 0.94 | 0.000 | 1.55 | 10,0 | 26.8 | 53.2 | 0.73 | 0.25 | 0.73 | 8.6 |
| 968 | 76.49 | 0.02 | 6.1 | 3.30 | 3.52 | 0.94 | 0.94 | 0.94 | 0.001 | 1.48 | 10,0 | 25.7 | 52.7 | 0.73 | 0.25 | 0.73 | 8.5 |
| 968 + 1/2 | 76.19 | 0.01 | 6.4 | 3.32 | 3.52 | 0.94 | 0.94 | 0.94 | 0.001 | 1.54 | 2,5 | 24.8 | 52.6 | 0.73 | 0.25 | 0.73 | 9.0 |
| 969 | 75.91 | 0.01 | 6.7 | 3.38 | 3.52 | 0.96 | 0.96 | 0.96 | 0.000 | 1.48 | 10,8 | 23.8 | 51.1 | 0.73 | 0.24 | 0.73 | 9.1 |
| 969 + 1/2 | 75.67 | 0.01 | 7.1 | 3.40 | 3.52 | 0.97 | 0.97 | 0.97 | 0.000 | 1.58 | 10,8 | 22.7 | 49.7 | 0.73 | 0.23 | 0.73 | 8.7 |
| 970 | 75.44 | 0.02 | 7.4 | 3.44 | 3.52 | 0.98 | 0.98 | 0.98 | 0.000 | 1.64 | 3,5 | 21.7 | 49.3 | 0.73 | 0.22 | 0.73 | 8.9 |
| 970 + 1/2 | 75.25 | 0.03 | 7.7 | 3.48 | 3.52 | 0.99 | 0.99 | 0.99 | 0.001 | 1.71 | 3,5 | 20.8 | 48.3 | 0.73 | 0.21 | 0.73 | 8.8 |
| 971 | 75.13 | 0.02 | 8.1 | 3.50 | 3.51 | 1.00 | 1.00 | 1.00 | 0.001 | 1.65 | 3,5 | 20.4 | 47.7 | 0.73 | 0.20 | 0.73 | 8.8 |
| 971 + 1/2 | 74.96 | 0.06 | 8.3 | 3.54 | 3.54 | 1.00 | 1.00 | 1.00 | 0.005 | 1.57 | 3,5 | 20.1 | 46.8 | 0.73 | 0.19 | 0.73 | 8.7 |
| 972 | 74.68 | 0.02 | 8.7 | 3.58 | 3.57 | 1.00 | 1.01 | 1.00 | 0.006 | 1.46 | 0,4 | 20.3 | 45.9 | 0.73 | 0.18 | 0.73 | 8.5 |
| 972 + 1/2 | 74.44 | 0.00 | 8.9 | 3.59 | 3.59 | 1.00 | 1.01 | 1.00 | 0.003 | 1.65 | 0,4 | 19.7 | 45.3 | 0.73 | 0.17 | 0.73 | 8.6 |
| 973 | 74.19 | 0.02 | 9.4 | 3.60 | 3.59 | 1.00 | 1.00 | 1.00 | 0.005 | 1.38 | 14,1 | 19.3 | 44.6 | 0.73 | 0.17 | 0.73 | 8.5 |
| 973 + 1/2 | 73.90 | 0.01 | 9.7 | 3.59 | 3.63 | 0.99 | 0.99 | 0.99 | 0.009 | 1.64 | 2,2 | 19.0 | 43.4 | 0.73 | 0.16 | 0.73 | 8.8 |
| 974 | 73.62 | 0.02 | 10.0 | 3.65 | 3.63 | 1.01 | 1.00 | 1.00 | 0.014 | 1.58 | 2,2 | 19.0 | 42.6 | 0.73 | 0.16 | 0.73 | 9.1 |
| 974 + 1/2 | 73.40 | 0.03 | 10.2 | 3.67 | 3.66 | 1.00 | 1.01 | 1.00 | 0.009 | 1.49 | 2,3 | 18.9 | 41.4 | 0.73 | 0.15 | 0.73 | 8.7 |
| 975 | 73.11 | 0.04 | 10.6 | 3.66 | 3.70 | 0.99 | 0.99 | 0.99 | 0.013 | 1.55 | 2,2 | 18.2 | 39.0 | 0.73 | 0.14 | 0.73 | 8.9 |
| 975 + 1/2 | 72.75 | 0.03 | 10.9 | 3.73 | 3.70 | 1.01 | 1.01 | 1.01 | 0.017 | 1.47 | 2,3 | 17.2 | 37.1 | 0.74 | 0.13 | 0.73 | 8.8 |
| 976 | 72.44 | 0.04 | 11.2 | 3.72 | 3.74 | 1.00 | 1.00 | 1.00 | 0.005 | 1.38 | 2,3 | 16.7 | 35.6 | 0.74 | 0.12 | 0.74 | 8.7 |
| 976 + 1/2 | 72.21 | 0.00 | 11.5 | 3.77 | 3.74 | 1.01 | 1.01 | 1.01 | 0.012 | 1.50 | 2,3 | 15.8 | 34.3 | 0.74 | 0.12 | 0.74 | 8.7 |
| 977 | 71.99 | 0.00 | 11.7 | 3.76 | 3.80 | 0.99 | 0.99 | 0.99 | 0.014 | 1.48 | 11,8 | 15.9 | 35.0 | 0.74 | 0.11 | 0.74 | 8.4 |
| 977 + 1/2 | 71.76 | 0.05 | 12.1 | 3.82 | 3.81 | 1.00 | 1.01 | 1.00 | 0.010 | 1.61 | 11,8 | 15.4 | 33.3 | 0.74 | 0.11 | 0.74 | 8.3 |
| 978 | 71.64 | 0.09 | 12.5 | 3.87 | 3.84 | 1.01 | 1.01 | 1.01 | 0.010 | 1.53 | 11,8 | 14.8 | 30.5 | 0.74 | 0.09 | 0.74 | 8.2 |
| 978 + 1/2 | 71.33 | 0.01 | 12.7 | 3.85 | 3.89 | 0.99 | 0.99 | 0.99 | 0.014 | 1.46 | 11,8 | 14.0 | 27.2 | 0.75 | 0.11 | 0.74 | 8.1 |
| 979 | 71.01 | 0.04 | 13.1 | 3.91 | 3.89 | 1.00 | 1.00 | 1.00 | 0.018 | 1.59 | 13,0 | 13.7 | 31.5 | 0.75 | 0.10 | 0.75 | 8.0 |
| 979 + 1/2 | 70.76 | 0.01 | 13.5 | 3.92 | 3.90 | 1.01 | 1.00 | 1.00 | 0.012 | 1.63 | 0,8 | 13.1 | 20.9 | 0.75 | 0.09 | 0.75 | 8.0 |
| 980 | 70.55 | 0.04 | 13.9 | 3.96 | 3.90 | 1.01 | 1.01 | 1.01 | 0.019 | 2.02 | 0,8 | 12.6 | 18.0 | 0.75 | 0.08 | 0.75 | 8.0 |
| 980 + 1/2 | 70.40 | 0.04 | 14.2 | 3.99 | 3.91 | 1.02 | 1.02 | 1.02 | 0.015 | 1.91 | 0,8 | 12.5 | 16.0 | 0.75 | 0.09 | 0.75 | 8.0 |
| 981 | 70.34 | 0.06 | 14.6 | 4.06 | 3.94 | 1.03 | 1.03 | 1.03 | 0.016 | 2.04 | 0,8 | 12.8 | 22.9 | 0.76 | 0.13 | 0.76 | 8.0 |
| 981 + 1/2 | 70.41 | 0.02 | 15.0 | 4.11 | 3.96 | 1.04 | 1.04 | 1.04 | 0.013 | 2.07 | 1,8 | 13.4 | 22.0 | 0.76 | 0.10 | 0.76 | 8.0 |
| 982 | 70.43 | 0.07 | 15.4 | 4.12 | 3.98 | 1.04 | 1.04 | 1.04 | 0.005 | 1.79 | 0,8 | 14.3 | 19.6 | 0.76 | 0.08 | 0.76 | 8.7 |
| 982 + 1/2 | 70.32 | 0.06 | 15.9 | 4.15 | 4.01 | 1.03 | 1.04 | 1.03 | 0.007 | 1.92 | 15,6 | 15.3 | 20.5 | 0.76 | 0.08 | 0.76 | 8.6 |
| 983 | 70.08 | 0.03 | 16.1 | 4.14 | 4.03 | 1.03 | 1.02 | 1.02 | 0.014 | 1.89 | 15,6 | 16.6 | 21.2 | 0.76 | 0.07 | 0.76 | 8.0 |
| 983 + 1/2 | 69.78 | 0.02 | 16.6 | 4.19 | 4.04 | 1.04 | 1.03 | 1.03 | 0.013 | 1.84 | 15,6 | 17.9 | 21.9 | 0.76 | 0.07 | 0.76 | 8.0 |
| 984 | 69.53 | 0.08 | 17.0 | 4.21 | 4.07 | 1.04 | 1.05 | 1.04 | 0.012 | 2.06 | 5,8 | 19.4 | 27.8 | 0.76 | 0.07 | 0.76 | 8.0 |
| 984 + 1/2 | 69.12 | 0.16 | 17.4 | 4.21 | 4.07 | 1.04 | 1.04 | 1.04 | 0.020 | 1.88 | 15,6 | 21.2 | 24.9 | 0.76 | 0.06 | 0.76 | 8.0 |
| 985 | 68.39 | 0.03 | 17.8 | 4.20 | 4.07 | 1.03 | 1.04 | 1.03 | 0.010 | 1.97 | 5,8 | 23.6 | 28.1 | 0.76 | 0.06 | 0.76 | 8.0 |
| 985 + 1/2 | 67.60 | 0.12 | 18.3 | 4.17 | 4.07 | 1.03 | 1.04 | 1.03 | 0.019 | 1.77 | 5,8 | 26.7 | 31.6 | 0.76 | 0.05 | 0.76 | 8.0 |
| 986 | 67.06 | 0.04 | 18.6 | 4.16 | 4.07 | 1.02 | 1.03 | 1.02 | 0.014 | 1.78 | 3,6 | 29.7 | 35.6 | 0.76 | 0.06 | 0.76 | 8.0 |
| 986 + 1/2 | 66.42 | 0.06 | 19.1 | 4.03 | 4.09 | 0.98 | 1.00 | 0.98 | 0.014 | 1.88 | 3,6 | 31.7 | 39.0 | 0.76 | 0.07 | 0.76 | 8.0 |
| 987 | 65.67 | 0.04 | 19.7 | 3.97 | 4.09 | 0.97 | 0.98 | 0.97 | 0.018 | 1.77 | 14,6 | 33.5 | 41.6 | 0.76 | 0.07 | 0.76 | 8.0 |
| 987 + 1/2 | 65.00 | 0.13 | 20.1 | 3.88 | 4.09 | 0.95 | 0.96 | 0.95 | 0.015 | 1.86 | 14,6 | 34.9 | 43.8 | 0.76 | 0.07 | 0.75 | 8.0 |
| 988 | 64.57 | 0.02 | 20.8 | 3.89 | 4.09 | 0.95 | 0.95 | 0.95 | 0.038 | 1.86 | 14,6 | 36.5 | 47.1 | 0.75 | 0.08 | 0.75 | 8.1 |
| 988 + 1/2 | 64.18 | 0.10 | 21.3 | 4.03 | 4.09 | 0.98 | 0.99 | 0.98 | 0.017 | 1.80 | 14,6 | 37.9 | 49.1 | 0.75 | 0.09 | 0.75 | 8.4 |
| 989 | 63.59 | 0.05 | 22.0 | 4.24 | 4.07 | 1.04 | 1.05 | 1.04 | 0.021 | 2.62 | 6,0 | 39.1 | 51.5 | 0.75 | 0.08 | 0.75 | 8.8 |
| 989 + 1/2 | 63.11 | 0.02 | 22.6 | 4.34 | 4.05 | 1.07 | 1.06 | 1.06 | 0.028 | 3.14 | 7,0 | 39.8 | 53.6 | 0.75 | 0.09 | 0.74 | 8.4 |
| 990 | 62.67 | 0.12 | 23.2 | 4.37 | 4.03 | 1.08 | 1.05 | 1.05 | 0.038 | 2.73 | 10,2 | 40.2 | 54.4 | 0.75 | 0.10 | 0.74 | 8.1 |
| 990 + 1/2 | 61.98 | 0.08 | 23.8 | 4.24 | 4.01 | 1.06 | 1.02 | 1.02 | 0.048 | 3.38 | 11,3 | 40.6 | 55.6 | 0.74 | 0.12 | 0.74 | 8.0 |
| 991 | 61.45 | 0.02 | 24.3 | 4.18 | 3.98 | 1.05 | 1.03 | 1.03 | 0.035 | 3.18 | 12,4 | 40.9 | 55.2 | 0.75 | 0.17 | 0.75 | 8.0 |
| 991 + 1/2 | 60.96 | 0.03 | 24.7 | 4.13 | 3.93 | 1.05 | 1.04 | 1.04 | 0.029 | 2.49 | 12,4 | 40.8 | 54.1 | 0.75 | 0.22 | 0.75 | 8.0 |
| 992 | 60.42 | 0.11 | 25.3 | 4.07 | 3.89 | 1.05 | 1.04 | 1.04 | 0.030 | 3.44 | 13,6 | 40.7 | 52.4 | 0.75 | 0.22 | 0.75 | 8.0 |
| 992 + 1/2 | 59.66 | 0.03 | 25.9 | 4.00 | 3.89 | 1.03 | 1.03 | 1.03 | 0.027 | 2.74 | 13,6 | 40.3 | 50.2 | 0.75 | 0.24 | 0.74 | 8.0 |
| 993 | 58.84 | 0.05 | 26.5 | 3.89 | 3.86 | 1.01 | 1.00 | 1.00 | 0.038 | 2.67 | 14,8 | 39.8 | 47.6 | 0.74 | 0.25 | 0.74 | 8.0 |
| 993 + 1/2 | 58.13 | 0.02 | 26.9 | 3.84 | 3.84 | 1.00 | 1.01 | 1.00 | 0.033 | 2.24 | 13,7 | 39.0 | 46.8 | 0.74 | 0.26 | 0.74 | 8.0 |
| 994 | 57.38 | 0.13 | 27.3 | 3.80 | 3.80 | 1.00 | 0.99 | 0.99 | 0.076 | 2.48 | 13,7 | 38.0 | 46.4 | 0.74 | 0.22 | 0.74 | 8.0 |
| 994 + 1/2 | 56.37 | 0.15 | 28.2 | 3.76 | 3.74 | 1.00 | 1.02 | 1.00 | 0.049 | 2.34 | 13,8 | 37.1 | 45.5 | 0.74 | 0.23 | 0.74 | 8.0 |
| 995 | 55.65 | 0.06 | 28.7 | 3.68 | 3.68 | 1.00 | 0.99 | 0.99 | 0.062 | 2.77 | 13,8 | 36.1 | 44.9 | 0.73 | 0.22 | 0.73 | 8.0 |
| 995 + 1/2 | 55.04 | 0.10 | 29.7 | 3.60 | 3.59 | 1.00 | 1.00 | 1.00 | 0.041 | 2.97 | 13,8 | 35.0 | 43.8 | 0.73 | 0.21 | 0.73 | 8.0 |
| 996 | 54.23 | 0.00 | 30.2 | 3.50 | 3.54 | 0.99 | 0.99 | 0.99 | 0.037 | 2.35 | 13,8 | 33.9 | 42.3 | 0.73 | 0.19 | 0.73 | 8.0 |
| 996 + 1/2 | 53.43 | 0.06 | 30.6 | 3.48 | 3.49 | 1.00 | 1.00 | 1.00 | 0.033 | 2.10 | 13,8 | 32.9 | 46.4 | 0.73 | 0.21 | 0.73 | 8.0 |
| 997 | 52.76 | 0.04 | 31.2 | 3.47 | 3.48 | 1.00 | 0.99 | 0.99 | 0.040 | 2.07 | 12,7 | 31.6 | 50.6 | 0.72 | 0.21 | 0.72 | 8.0 |
| 997 + 1/2 | 51.99 | 0.01 | 31.5 | 3.48 | 3.47 | 1.00 | 1.01 | 1.00 | 0.035 | 2.35 | 12,8 | 30.4 | 44.9 | 0.72 | 0.19 | 0.72 | 8.0 |
| 998 | 51.20 | 0.03 | 31.9 | 3.44 | 3.47 | 0.99 | 1.00 | 0.99 | 0.034 | 2.82 | 12,8 | 29.0 | 44.9 | 0.72 | 0.18 | 0.72 | 8.0 |
| 998 + 1/2 | 50.35 | 0.05 | 32.1 | 3.47 | 3.41 | 1.02 | 1.01 | 1.01 | 0.036 | 2.80 | 12,8 | 27.5 | 39.4 | 0.72 | 0.19 | 0.72 | 8.0 |
| 999 | 49.59 | 0.04 | 32.5 | 3.39 | 3.41 | 0.99 | 1.00 | 0.99 | 0.035 | 2.60 | 12,8 | 26.2 | 33.6 | 0.71 | 0.22 | 0.71 | 8.0 |
| 999 + 1/2 | 48.92 | 0.01 | 32.7 | 3.37 | 3.37 | 1.00 | 0.99 | 0.99 | 0.071 | 2.38 | 12,8 | 25.5 | 33.9 | 0.71 | 0.23 | 0.70 | 8.0 |
| 1000 | 48.27 | 0.05 | 32.7 | 3.36 | 3.35 | 1.00 | 1.01 | 1.00 | 0.039 | 2.11 | 2,0 | 24.0 | 32.1 | 0.71 | 0.22 | 0.70 | 8.0 |
| 1000 + 1/2 | 47.71 | 0.04 | 32.8 | 3.32 | 3.32 | 1.00 | 1.00 | 1.00 | 0.039 | 2.80 | 1,8 | 22.7 | 33.3 | 0.71 | 0.22 | 0.70 | 8.0 |
| 1001 | 47.23 | 0.06 | 32.6 | 3.29 | 3.25 | 1.01 | 1.01 | 1.01 | 0.049 | 2.35 | 1,7 | 21.6 | 32.3 | 0.70 | 0.22 | 0.70 | 8.0 |
| 1001 + 1/2 | 46.87 | 0.04 | 32.8 | 3.19 | 3.23 | 0.99 | 0.99 | 0.99 | 0.040 | 2.49 | 1,8 | 20.4 | 30.6 | 0.70 | 0.21 | 0.68 | 8.0 |
| 1002 | 46.43 | 0.06 | 32.7 | 3.18 | 3.15 | 1.01 | 1.01 | 1.01 | 0.037 | 2.58 | 0,1 | 19.3 | 28.8 | 0.70 | 0.19 | 0.66 | 8.0 |
| 1002 + 1/2 | 45.88 | 0.04 | 32.5 | 3.11 | 3.08 | 1.01 | 1.02 | 1.01 | 0.033 | 3.47 | 2,7 | 18.4 | 27.6 | 0.70 | 0.18 | 0.65 | 8.0 |
| 1003 | 45.41 | 0.08 | 32.4 | 2.97 | 3.02 | 0.98 | 0.99 | 0.98 | 0.039 | 3.60 | 2,7 | 17.6 | 27.1 | 0.69 | 0.17 | 0.63 | 8.0 |
| 1003 + 1/2 | 45.09 | 0.02 | 32.3 | 2.92 | 2.93 | 1.00 | 1.00 | 1.00 | 0.053 | 2.50 | 2,7 | 16.9 | 26.3 | 0.69 | 0.18 | 0.61 | 8.0 |
| 1004 | 44.81 | 0.02 | 32.2 | 2.89 | 2.87 | 1.01 | 1.01 | 1.01 | 0.055 | 2.38 | 2,2 | 16.2 | 26.6 | 0.68 | 0.20 | 0.58 | 8.0 |
| 1004 + 1/2 | 44.57 | 0.06 | 32.0 | 2.81 | 2.84 | 0.99 | 0.97 | 0.97 | 0.048 | 2.24 | 3,2 | 15.7 | 25.7 | 0.67 | 0.21 | 0.56 | 8.0 |
| 1005 | 44.45 | 0.06 | 31.7 | 2.77 | 2.80 | 0.99 | 0.99 | 0.99 | 0.036 | 2.48 | 3,2 | 15.6 | 24.5 | 0.66 | 0.22 | 0.54 | 8.0 |
| 1005 + 1/2 | 44.47 | 0.05 | 31.3 | 2.77 | 2.80 | 0.99 | 1.00 | 0.99 | 0.051 | 2.56 | 3,2 | 15.4 | 25.1 | 0.65 | 0.24 | 0.52 | 8.0 |
| 1006 | 44.59 | 0.10 | 30.8 | 2.75 | 2.79 | 0.98 | 1.00 | 0.98 | 0.034 | 2.23 | 3,2 | 15.2 | 24.1 | 0.64 | 0.26 | 0.51 | 8.0 |
| 1006 + 1/2 | 44.91 | 0.13 | 30.2 | 2.80 | 2.77 | 1.01 | 1.02 | 1.01 | 0.033 | 2.14 | 10,1 | 15.1 | 21.7 | 0.62 | 0.28 | 0.49 | 8.0 |
| 1007 | 45.49 | 0.34 | 30.1 | 2.80 | 2.75 | 1.02 | 0.99 | 0.99 | 0.054 | 2.56 | 12,3 | 14.8 | 19.6 | 0.61 | 0.33 | 0.48 | 8.0 |
| 1007 + 1/2 | 46.76 | 0.20 | 29.5 | 2.76 | 2.73 | 1.01 | 1.02 | 1.01 | 0.035 | 2.55 | 9,0 | 15.1 | 21.0 | 0.60 | 0.34 | 0.47 | 8.0 |
| 1008 | 48.43 | 0.05 | 29.3 | 2.72 | 2.68 | 1.01 | 1.01 | 1.01 | 0.061 | 2.34 | 12,3 | 15.4 | 21.3 | 0.59 | 0.35 | 0.46 | 8.0 |
| 1008 + 1/2 | 50.19 | 0.01 | 28.3 | 2.62 | 2.62 | 1.00 | 1.00 | 1.00 | 0.046 | 2.51 | 6,7 | 15.9 | 22.0 | 0.57 | 0.36 | 0.45 | 8.0 |
| 1009 | 51.98 | 0.01 | 28.0 | 2.53 | 2.54 | 1.00 | 1.02 | 1.00 | 0.055 | 2.95 | 13,3 | 15.8 | 22.1 | 0.55 | 0.42 | 0.43 | 8.0 |
| 1009 + 1/2 | 53.76 | 0.00 | 27.4 | 2.46 | 2.46 | 1.00 | 0.96 | 0.96 | 0.090 | 2.39 | 12,1 | 15.8 | 22.3 | 0.55 | 0.49 | 0.42 | 8.0 |
| 1010 | 55.54 | 0.00 | 26.8 | 2.39 | 2.38 | 1.00 | 1.01 | 1.00 | 0.087 | 2.20 | 13,4 | 15.8 | 22.2 | 0.54 | 0.53 | 0.41 | 8.0 |
| 1010 + 1/2 | 57.32 | 0.01 | 26.1 | 2.31 | 2.32 | 1.00 | 1.00 | 1.00 | 0.054 | 3.19 | 13,1 | 15.5 | 22.4 | 0.52 | 0.59 | 0.40 | 8.0 |
| 1011 | 59.09 | 0.01 | 25.1 | 2.24 | 2.22 | 1.01 | 1.02 | 1.01 | 0.043 | 2.99 | 14,3 | 15.0 | 21.0 | 0.51 | 0.62 | 0.39 | 8.0 |
| 1011 + 1/2 | 60.87 | 0.00 | 24.7 | 2.13 | 2.15 | 0.99 | 0.99 | 0.99 | 0.058 | 2.51 | 14,1 | 14.3 | 20.5 | 0.50 | 0.64 | 0.38 | 8.0 |
| 1012 | 62.66 | 0.01 | 24.2 | 2.07 | 2.03 | 1.02 | 0.99 | 0.99 | 0.068 | 3.07 | 14,1 | 13.4 | 19.0 | 0.48 | 0.64 | 0.37 | 8.0 |
| 1012 + 1/2 | 64.43 | 0.02 | 23.6 | 1.94 | 1.97 | 0.99 | 1.01 | 0.99 | 0.037 | 2.67 | 14,1 | 12.5 | 17.8 | 0.47 | 0.63 | 0.36 | 8.0 |
| 1013 | 66.16 | 0.00 | 23.1 | 1.87 | 1.89 | 0.99 | 0.99 | 0.99 | 0.049 | 2.67 | 15,1 | 11.6 | 17.9 | 0.45 | 0.58 | 0.35 | 8.0 |
| 1013 + 1/2 | 67.89 | 0.01 | 22.5 | 1.80 | 1.86 | 0.96 | 0.94 | 0.94 | 0.076 | 2.26 | 15,1 | 10.5 | 17.6 | 0.43 | 0.53 | 0.34 | 8.0 |
| 1014 | 69.64 | 0.03 | 22.6 | 1.77 | 1.85 | 0.96 | 0.96 | 0.96 | 0.051 | 1.58 | 15,1 | 9.7 | 17.3 | 0.42 | 0.47 | 0.33 | 8.0 |
| 1014 + 1/2 | 71.45 | 0.00 | 21.8 | 1.74 | 1.85 | 0.94 | 0.93 | 0.93 | 0.078 | 1.76 | 14,4 | 9.0 | 17.5 | 0.40 | 0.38 | 0.32 | 8.0 |
| 1015 | 73.25 | 0.00 | 21.4 | 1.74 | 1.85 | 0.94 | 0.92 | 0.92 | 0.083 | 2.06 | 0,1 | 8.6 | 17.5 | 0.39 | 0.31 | 0.31 | 8.0 |
| 1015 + 1/2 | 75.05 | 0.07 | 20.5 | 1.69 | 1.84 | 0.92 | 0.88 | 0.88 | 0.106 | 2.39 | 15,0 | 8.1 | 17.6 | 0.38 | 0.24 | 0.30 | 8.0 |
| 1016 | 76.72 | 0.13 | 20.4 | 1.74 | 1.82 | 0.96 | 0.92 | 0.92 | 0.059 | 5.05 | 15,0 | 8.0 | 16.7 | 0.37 | 0.18 | 0.29 | 8.0 |
| 1016 + 1/2 | 78.14 | 0.16 | 19.9 | 1.70 | 1.81 | 0.94 | 0.88 | 0.88 | 0.083 | 1.75 | 0,6 | 8.0 | 16.0 | 0.37 | 0.13 | 0.29 | 8.0 |
| 1017 | 79.24 | 0.16 | 19.0 | 1.72 | 1.80 | 0.96 | 0.93 | 0.93 | 0.058 | 2.02 | 0,7 | 7.5 | 14.4 | 0.37 | 0.10 | 0.28 | 8.0 |
| 1017 + 1/2 | 80.02 | 0.14 | 18.3 | 1.70 | 1.79 | 0.95 | 0.93 | 0.93 | 0.052 | 2.32 | 0,7 | 7.0 | 13.0 | 0.36 | 0.10 | 0.27 | 8.0 |
| 1018 | 80.52 | 0.08 | 18.0 | 1.73 | 1.79 | 0.96 | 0.92 | 0.92 | 0.063 | 1.99 | 0,7 | 6.2 | 11.7 | 0.35 | 0.10 | 0.26 | 8.0 |
| 1018 + 1/2 | 80.86 | 0.11 | 17.3 | 1.74 | 1.79 | 0.97 | 0.92 | 0.92 | 0.068 | 1.63 | 1,1 | 5.6 | 11.9 | 0.35 | 0.10 | 0.26 | 8.0 |
| 1019 | 80.99 | 0.13 | 16.8 | 1.75 | 1.79 | 0.97 | 0.92 | 0.92 | 0.061 | 1.72 | 1,8 | 4.8 | 10.7 | 0.34 | 0.10 | 0.25 | 8.0 |
| 1019 + 1/2 | 80.86 | 0.12 | 16.2 | 1.74 | 1.79 | 0.97 | 0.94 | 0.94 | 0.053 | 1.65 | 0,0 | 4.4 | 10.2 | 0.33 | 0.10 | 0.24 | 8.0 |
| 1020 | 80.48 | 0.11 | 15.5 | 1.77 | 1.79 | 0.99 | 0.96 | 0.96 | 0.025 | 1.73 | 1,7 | 4.1 | 9.4 | 0.33 | 0.09 | 0.24 | 8.0 |
| 1020 + 1/2 | 79.88 | 0.05 | 15.0 | 1.82 | 1.79 | 1.02 | 0.98 | 0.98 | 0.024 | 1.71 | 1,7 | 3.7 | 9.1 | 0.32 | 0.09 | 0.23 | 8.0 |
| 1021 | 79.20 | 0.08 | 14.6 | 1.85 | 1.79 | 1.03 | 0.98 | 0.98 | 0.047 | 2.14 | 1,7 | 3.3 | 9.0 | 0.32 | 0.08 | 0.23 | 8.0 |
| 1021 + 1/2 | 78.36 | 0.02 | 13.8 | 1.85 | 1.79 | 1.04 | 1.01 | 1.01 | 0.030 | 1.86 | 1,0 | 3.0 | 7.9 | 0.31 | 0.08 | 0.22 | 8.0 |
| 1022 | 77.48 | 0.02 | 13.4 | 1.86 | 1.79 | 1.04 | 1.05 | 1.04 | 0.013 | 1.94 | 0,2 | 2.9 | 7.1 | 0.30 | 0.08 | 0.22 | 8.0 |
| 1022 + 1/2 | 76.57 | 0.03 | 12.7 | 1.88 | 1.79 | 1.05 | 1.05 | 1.05 | 0.016 | 1.75 | 7,8 | 2.8 | 6.1 | 0.30 | 0.07 | 0.21 | 8.0 |
| 1023 | 75.61 | 0.00 | 12.3 | 1.83 | 1.79 | 1.02 | 1.03 | 1.02 | 0.005 | 1.71 | 6,0 | 2.9 | 5.9 | 0.29 | 0.07 | 0.21 | 8.0 |
| 1023 + 1/2 | 74.66 | 0.01 | 11.8 | 1.78 | 1.79 | 1.00 | 1.00 | 1.00 | 0.004 | 1.58 | 6,0 | 2.8 | 6.3 | 0.28 | 0.06 | 0.20 | 8.0 |
| 1024 | 73.72 | 0.01 | 11.2 | 1.79 | 1.79 | 1.00 | 1.00 | 1.00 | 0.012 | 1.59 | 6,0 | 2.8 | 5.9 | 0.27 | 0.06 | 0.20 | 8.0 |
| 1024 + 1/2 | 72.80 | 0.01 | 10.8 | 1.79 | 1.79 | 1.00 | 1.01 | 1.00 | 0.007 | 1.63 | 3,1 | 2.6 | 4.8 | 0.27 | 0.05 | 0.19 | 8.0 |
| 1025 | 71.90 | 0.01 | 10.2 | 1.80 | 1.79 | 1.01 | 1.02 | 1.01 | 0.007 | 1.91 | 2,4 | 2.5 | 4.5 | 0.26 | 0.04 | 0.19 | 8.0 |
| 1025 + 1/2 | 71.04 | 0.03 | 9.7 | 1.78 | 1.79 | 1.00 | 1.00 | 1.00 | 0.005 | 2.22 | 2,4 | 2.4 | 4.0 | 0.26 | 0.04 | 0.19 | 8.0 |
| 1026 | 70.22 | 0.02 | 9.0 | 1.79 | 1.79 | 1.00 | 1.01 | 1.00 | 0.007 | 2.07 | 2,4 | 2.3 | 4.0 | 0.25 | 0.04 | 0.18 | 8.0 |
| 1026 + 1/2 | 69.45 | 0.03 | 8.6 | 1.86 | 1.79 | 1.04 | 1.04 | 1.04 | 0.011 | 2.16 | 4,7 | 2.2 | 4.0 | 0.25 | 0.04 | 0.18 | 8.0 |
| 1027 | 68.73 | 0.03 | 7.8 | 1.92 | 1.79 | 1.07 | 1.08 | 1.07 | 0.012 | 2.15 | 4,7 | 2.3 | 3.8 | 0.24 | 0.04 | 0.18 | 8.0 |
| 1027 + 1/2 | 68.07 | 0.02 | 7.4 | 1.93 | 1.79 | 1.08 | 1.09 | 1.08 | 0.007 | 2.80 | 4,7 | 2.4 | 3.6 | 0.24 | 0.03 | 0.17 | 8.0 |
| 1028 | 67.45 | 0.02 | 6.7 | 1.87 | 1.79 | 1.04 | 1.06 | 1.04 | 0.005 | 2.63 | 3,5 | 2.3 | 3.6 | 0.24 | 0.03 | 0.17 | 8.0 |
| 1028 + 1/2 | 66.87 | 0.03 | 6.1 | 1.83 | 1.79 | 1.03 | 1.04 | 1.03 | 0.006 | 3.14 | 3,5 | 2.3 | 3.5 | 0.23 | 0.03 | 0.17 | 8.0 |
| 1029 | 66.35 | 0.03 | 5.6 | 1.93 | 1.79 | 1.08 | 1.09 | 1.08 | 0.012 | 3.56 | 3,3 | 2.3 | 3.9 | 0.23 | 0.03 | 0.17 | 8.0 |
| 1029 + 1/2 | 65.88 | 0.03 | 4.9 | 1.89 | 1.78 | 1.06 | 1.07 | 1.06 | 0.007 | 3.15 | 3,3 | 2.5 | 3.7 | 0.23 | 0.03 | 0.17 | 8.0 |
| 1030 | 65.47 | 0.03 | 4.4 | 1.76 | 1.78 | 0.99 | 0.99 | 0.99 | 0.002 | 2.48 | 4,7 | 2.8 | 3.8 | 0.23 | 0.03 | 0.16 | 8.0 |
| 1030 + 1/2 | 65.11 | 0.03 | 3.7 | 1.62 | 1.77 | 0.91 | 0.92 | 0.91 | 0.000 | 2.82 | 4,7 | 3.0 | 4.3 | 0.23 | 0.03 | 0.16 | 8.0 |
| 1031 | 64.81 | 0.03 | 2.9 | 1.75 | 1.69 | 1.04 | 1.04 | 1.04 | 0.004 | 3.56 | 3,5 | 3.1 | 4.7 | 0.22 | 0.03 | 0.16 | 8.0 |
| 1031 + 1/2 | 64.56 | 0.03 | 2.3 | 1.80 | 1.62 | 1.11 | 1.11 | 1.11 | 0.001 | 3.66 | 3,3 | 3.4 | 5.0 | 0.22 | 0.03 | 0.16 | 8.0 |
| 1032 | 64.36 | 0.02 | 1.7 | 1.61 | 1.47 | 1.10 | 1.09 | 1.09 | 0.002 | 3.27 | 3,3 | 3.9 | 5.5 | 0.22 | 0.03 | 0.16 | 8.0 |
| 1032 + 1/2 | 64.21 | 0.02 | 1.3 | 1.33 | 1.33 | 1.00 | 1.00 | 1.00 | 0.001 | 2.73 | 3,3 | 4.3 | 6.1 | 0.21 | 0.03 | 0.16 | 8.0 |
| 1033 | 64.09 | 0.01 | 1.1 | 1.04 | 1.13 | 0.92 | 0.93 | 0.92 | 0.007 | 1.96 | 3,3 | 4.1 | 6.0 | 0.21 | 0.04 | 0.16 | 8.0 |
| 1033 + 1/2 | 63.99 | 0.01 | 0.9 | 0.85 | 0.99 | 0.86 | 0.87 | 0.86 | 0.000 | 1.25 | 3,4 | 4.0 | 5.9 | 0.21 | 0.03 | 0.15 | 8.0 |
| 1034 last | 63.91 | 0.01 | 0.9 | 0.79 | 0.94 | 0.84 | 0.88 | 0.84 | 0.002 | 1.24 | 3,5 | 4.3 | 6.1 | 0.21 | 0.03 | 0.15 | 8.0 |
| 1034 + 1/2 | 63.84 | 0.00 | 0.9 | 0.80 | 0.94 | 0.85 | 0.89 | 0.85 | 0.001 | 1.24 | 5,7 | 4.6 | 6.3 | 0.21 | 0.04 | 0.15 | 8.0 |
| 1035 | 63.77 | 0.00 | 0.8 | 0.80 | 0.94 | 0.85 | 0.90 | 0.85 | 0.010 | 1.25 | 7,3 | 4.9 | 7.4 | 0.20 | 0.04 | 0.15 | 8.0 |
| 1035 + 1/2 | 63.71 | 0.00 | 0.8 | 0.79 | 0.94 | 0.85 | 0.90 | 0.85 | 0.002 | 1.42 | 7,3 | 5.6 | 7.7 | 0.20 | 0.04 | 0.15 | 8.0 |
| 1036 | 63.64 | 0.00 | 0.8 | 0.78 | 0.94 | 0.84 | 0.89 | 0.84 | 0.002 | 1.37 | 7,3 | 6.2 | 8.9 | 0.20 | 0.05 | 0.15 | 8.0 |
| 1036 + 1/2 | 63.57 | 0.00 | 0.8 | 0.80 | 0.93 | 0.86 | 0.91 | 0.86 | 0.004 | 1.41 | 7,3 | 6.7 | 10.7 | 0.20 | 0.06 | 0.14 | 8.0 |
| 1037 | 63.51 | 0.00 | 1.0 | 0.83 | 0.92 | 0.90 | 0.96 | 0.90 | 0.005 | 1.44 | 4,4 | 7.1 | 10.8 | 0.20 | 0.06 | 0.14 | 8.0 |
| 1037 + 1/2 | 63.44 | 0.01 | 1.3 | 0.83 | 0.92 | 0.90 | 0.97 | 0.90 | 0.004 | 2.00 | 4,5 | 8.0 | 9.8 | 0.20 | 0.07 | 0.14 | 8.0 |
| 1038 | 63.35 | 0.01 | 1.7 | 0.86 | 0.92 | 0.93 | 1.00 | 0.93 | 0.005 | 2.21 | 4,5 | 9.5 | 12.3 | 0.20 | 0.06 | 0.14 | 8.0 |
| 1038 + 1/2 | 63.25 | 0.01 | 2.3 | 0.89 | 0.91 | 0.97 | 1.05 | 0.97 | 0.005 | 2.79 | 4,5 | 11.3 | 15.1 | 0.19 | 0.08 | 0.13 | 8.0 |
| 1039 | 63.11 | 0.01 | 2.8 | 0.81 | 0.90 | 0.90 | 0.94 | 0.90 | 0.010 | 3.28 | 4,4 |  |  |  |  |  |  |
| 1039 + 1/2 | 62.95 | 0.01 | 3.4 | 0.90 | 0.87 | 1.03 | 1.06 | 1.03 | 0.011 | 4.44 | 4,4 |  |  |  |  |  |  |
| 1040 | 62.78 | 0.02 | 3.8 | 0.92 | 0.85 | 1.07 | 1.11 | 1.07 | 0.012 | 4.55 | 4,4 |  |  |  |  |  |  |
| 1040 + 1/2 | 62.57 | 0.02 | 4.6 | 0.93 | 0.84 | 1.11 | 1.13 | 1.11 | 0.012 | 4.70 | 4,4 |  |  |  |  |  |  |
| 1041 | 62.34 | 0.03 | 5.4 | 0.92 | 0.83 | 1.11 | 1.11 | 1.11 | 0.014 | 5.40 | 4,4 |  |  |  |  |  |  |
| 1041 + 1/2 | 62.05 | 0.04 | 6.2 | 0.92 | 0.83 | 1.11 | 1.07 | 1.07 | 0.028 | 4.69 | 4,4 |  |  |  |  |  |  |
| 1042 | 61.69 | 0.03 | 6.9 | 0.95 | 0.82 | 1.16 | 1.10 | 1.10 | 0.025 | 5.07 | 11,2 |  |  |  |  |  |  |
| 1042 + 1/2 | 61.28 | 0.04 | 7.7 | 0.98 | 0.82 | 1.19 | 1.08 | 1.08 | 0.028 | 6.86 | 11,1 |  |  |  |  |  |  |
| 1043 | 60.77 | 0.05 | 8.6 | 1.02 | 0.82 | 1.25 | 1.11 | 1.11 | 0.030 | 8.81 | 12,3 |  |  |  |  |  |  |
| 1043 + 1/2 | 60.17 | 0.08 | 9.2 | 1.07 | 0.82 | 1.31 | 1.07 | 1.07 | 0.030 | 11.81 | 12,3 |  |  |  |  |  |  |
| 1044 | 59.41 | 0.15 | 10.1 | 1.05 | 0.82 | 1.28 | 1.03 | 1.03 | 0.040 | 9.03 | 12,4 |  |  |  |  |  |  |
| 1044 + 1/2 | 58.36 | 0.22 | 10.5 | 0.92 | 0.83 | 1.12 | 0.99 | 0.99 | 0.045 | 10.10 | 12,4 |  |  |  |  |  |  |
| 1045 | 56.86 | 0.29 | 11.1 | 0.91 | 0.83 | 1.10 | 0.98 | 0.98 | 0.045 | 8.68 | 12,4 |  |  |  |  |  |  |
| 1045 + 1/2 | 54.78 | 0.26 | 11.7 | 0.82 | 0.82 | 1.00 | 1.03 | 1.00 | 0.039 | 10.70 | 12,5 |  |  |  |  |  |  |
| 1046 | 52.18 | 0.17 | 12.2 | 0.76 | 0.82 | 0.93 | 0.95 | 0.93 | 0.046 | 8.47 | 12,5 |  |  |  |  |  |  |
| 1046 + 1/2 | 49.24 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

#### rise, the carry at the full size

The same frames and the same flows read a second time, beside the reader above. What is left of a frame in the next, the pop, the pop of one block and the change in place take the later frame onto the first at the full size and reduce after: both frames through the same filter of 1 px, the way of the flows taken to the full size and set right once by the flow at half the full size, smoothed over 8 px, then both reduced the same way. Carried at the reduced size, a picture that only slides by a part of a pixel leaves a difference that is the reader's and not the film's (a reduced picture is not the reduced picture of the same ground a part of a pixel on); carried so, it leaves nothing. Not counted in what is left: the outermost 4 px of either frame and what arrives within 16 px of the edge from farther inside, where the picture enters. The pattern keeps its own carry.
The limits are the config's, and they were set while the reader counted its own resampling into every median: a pop is read against a smaller median here, so it stands higher where the film changes and lower where only the slide changed.
The level step and the pattern are one reading and stand in both. The reader above is the one that counts: its lines in red make the verdict and the exit code. The lines in red here make the verdict beside it.

Largest pop score: 1.36 from frame 1043 to the next, limit 1.2.
Largest pop score of one block: 12.44 from frame 1043 + 1/2 to the next, block column 10 row 0 from the top left, shown, not judged.
Largest change in place: 45.9 from frame 960 to 8 film frames later, most at pixel 460, 188, shown, not judged.
The ground beside it at the full size, the same number on the surface view alone (frames 948 to 959 + 1/2): change 3.1; the pattern is one reading and stands with the reader above.
Largest ground pop: 1.144 from frame 960 to the next, most at pixel 462, 222, a patch of 424 by 92 px; 0 of 197 rows read over 1.3, no limit, 1.3 named as the limit to come.
Ground pop NOT READ on 1 of 198 rows, which says nothing of them, quiet or not: frame 1046 + 1/2: the last frame of the window, no next frame to carry onto it.
The largest pops with the carry at the full size and the largest ground pop, each with the next frame and what is left without the motion by that carry, are in the panels of the parts: frame 960 in /home/user/workspace/work/p6/hm9/03/mercury-rise-p1of2-pops-full.png, frame 991 in /home/user/workspace/work/p6/hm9/03/mercury-rise-p1of2-pops-full.png, frame 991 + 1/2 in /home/user/workspace/work/p6/hm9/03/mercury-rise-p1of2-pops-full.png, frame 1043 in /home/user/workspace/work/p6/hm9/04/mercury-rise-p2of2-pops-full.png, frame 1043 + 1/2 in /home/user/workspace/work/p6/hm9/04/mercury-rise-p2of2-pops-full.png.

With the carry at the full size the rise has 2 numbers over the limit or not measured.

- FULL SIZE RED pop score 1.36 from frame 1043 to the next, limit 1.2 (10 frames over it, first 989 + 1/2)
- FULL SIZE RED the pattern of the picture changes in place by 0.64 from frame 1011 + 1/2 to 8 film frames later, band 8 px, limit 0.45 (10 frames over it, first 1009 + 1/2)

The ground pop stands beside these and has no limit: it makes no verdict and no exit code; 1.3 is named as the limit to come. It is what is left of a frame in the next on every pixel of the ground both frames show, with the carry at the full size, over the median of the same count in the 2 rows before and the 2 after (floor 0.25). The ground is the globe by the pose record, flattened as the stop draws it, 20 px inside its edge, the rings and what they cover left out; without a pose record it is the frame. A row is not read with fewer than 2 such rows in its run of frames or with ground on less than 0.02 of the frame; every row not read is named by its frame with why, and says nothing of that frame. Its place is where the row has most more than those rows at the same pixel, smoothed over 20 px; its patch is what stays over half of that round the place.

| frame | motion px | left | median round it | pop, every pixel | pop, carried only | pop | not carried | pop of one block | block | change in place | its largest | judged | pop by the reader above | left on the ground | median of its nearest rows | ground pop | ground, share of the frame | its place | its patch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 948 | 2.9 | 0.39 | 0.38 | 1.01 | 1.01 | 1.01 | 0.000 | 1.34 | 8,5 | 2.5 | 5.1 | 0.70 | 0.95 | 0.403 | 0.404 | 0.996 | 0.722 | 1074,642 | 132 by 100 |
| 948 + 1/2 | 2.9 | 0.38 | 0.38 | 1.01 | 1.01 | 1.01 | 0.000 | 1.31 | 11,4 | 2.6 | 5.3 | 0.70 | 0.94 | 0.401 | 0.403 | 0.996 | 0.721 | 454,242 | 68 by 52 |
| 949 | 2.8 | 0.39 | 0.38 | 1.02 | 1.02 | 1.02 | 0.000 | 1.40 | 2,3 | 2.7 | 5.6 | 0.70 | 0.93 | 0.406 | 0.401 | 1.012 | 0.723 | 346,398 | 76 by 64 |
| 949 + 1/2 | 2.7 | 0.39 | 0.38 | 1.01 | 1.01 | 1.01 | 0.003 | 1.42 | 8,8 | 2.8 | 5.8 | 0.71 | 0.91 | 0.401 | 0.400 | 1.003 | 0.725 | 854,258 | 80 by 60 |
| 950 | 2.6 | 0.38 | 0.38 | 1.01 | 1.01 | 1.01 | 0.000 | 1.26 | 13,5 | 2.9 | 6.1 | 0.71 | 0.92 | 0.398 | 0.399 | 0.999 | 0.727 | 1006,706 | 92 by 56 |
| 950 + 1/2 | 2.6 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.40 | 2,2 | 2.9 | 6.2 | 0.71 | 0.94 | 0.394 | 0.398 | 0.990 | 0.729 | 274,294 | 64 by 52 |
| 951 | 2.5 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.26 | 15,3 | 3.1 | 6.5 | 0.71 | 0.96 | 0.396 | 0.395 | 1.003 | 0.733 | 10,338 | 40 by 76 |
| 951 + 1/2 | 2.4 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.30 | 14,6 | 3.1 | 6.8 | 0.71 | 1.01 | 0.397 | 0.391 | 1.015 | 0.732 | 1614,878 | 96 by 96 |
| 952 | 2.4 | 0.38 | 0.38 | 0.98 | 0.98 | 0.98 | 0.000 | 1.23 | 3,0 | 3.2 | 7.0 | 0.71 | 1.00 | 0.388 | 0.394 | 0.986 | 0.732 | 342,414 | 80 by 60 |
| 952 + 1/2 | 2.3 | 0.37 | 0.38 | 0.98 | 0.98 | 0.98 | 0.000 | 1.16 | 7,2 | 3.2 | 6.9 | 0.71 | 1.02 | 0.385 | 0.393 | 0.981 | 0.731 | 6,494 | 48 by 60 |
| 953 | 2.2 | 0.38 | 0.38 | 0.99 | 0.99 | 0.99 | 0.000 | 1.27 | 15,5 | 5.5 | 8.2 | 0.71 | 1.03 | 0.392 | 0.388 | 1.010 | 0.731 | 1610,890 | 60 by 76 |
| 953 + 1/2 | 2.2 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.30 | 3,0 | 8.2 | 12.5 | 0.72 | 1.04 | 0.393 | 0.388 | 1.013 | 0.730 | 1070,674 | 88 by 64 |
| 954 | 2.2 | 0.37 | 0.38 | 0.98 | 0.98 | 0.98 | 0.000 | 1.15 | 2,2 | 11.2 | 16.9 | 0.72 | 1.05 | 0.387 | 0.393 | 0.986 | 0.729 | 298,306 | 76 by 60 |
| 954 + 1/2 | 2.1 | 0.38 | 0.38 | 0.99 | 0.99 | 0.99 | 0.000 | 1.30 | 4,0 | 14.0 | 21.0 | 0.72 | 1.05 | 0.389 | 0.393 | 0.991 | 0.729 | 174,490 | 116 by 72 |
| 955 | 2.1 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.24 | 10,5 | 17.0 | 25.5 | 0.72 | 1.06 | 0.398 | 0.388 | 1.024 | 0.728 | 1298,662 | 72 by 84 |
| 955 + 1/2 | 2.1 | 0.38 | 0.38 | 0.99 | 0.99 | 0.99 | 0.000 | 1.22 | 0,5 | 19.9 | 29.9 | 0.73 | 1.06 | 0.393 | 0.390 | 1.007 | 0.727 | 350,434 | 80 by 64 |
| 956 | 2.1 | 0.37 | 0.38 | 0.97 | 0.97 | 0.97 | 0.000 | 1.25 | 8,6 | 23.0 | 34.6 | 0.73 | 1.06 | 0.384 | 0.392 | 0.981 | 0.727 | 282,314 | 64 by 56 |
| 956 + 1/2 | 2.1 | 0.38 | 0.38 | 0.99 | 0.99 | 0.99 | 0.000 | 1.19 | 0,4 | 25.9 | 39.3 | 0.73 | 1.05 | 0.391 | 0.386 | 1.013 | 0.726 | 46,514 | 76 by 68 |
| 957 | 2.1 | 0.38 | 0.38 | 0.98 | 0.98 | 0.98 | 0.000 | 1.23 | 2,0 | 28.8 | 43.9 | 0.73 | 1.05 | 0.387 | 0.387 | 0.999 | 0.725 | 1826,718 | 72 by 68 |
| 957 + 1/2 | 2.0 | 0.38 | 0.38 | 0.98 | 0.98 | 0.98 | 0.000 | 1.27 | 1,4 | 31.7 | 48.4 | 0.74 | 1.05 | 0.386 | 0.389 | 0.990 | 0.725 | 186,510 | 88 by 68 |
| 958 | 2.1 | 0.38 | 0.38 | 0.99 | 0.99 | 0.99 | 0.001 | 1.22 | 2,0 | 34.8 | 52.7 | 0.73 | 1.05 | 0.388 | 0.389 | 0.998 | 0.724 | 306,326 | 80 by 56 |
| 958 + 1/2 | 2.1 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.26 | 8,5 | 37.6 | 57.8 | 0.73 | 1.04 | 0.391 | 0.387 | 1.010 | 0.723 | 6,1070 | 40 by 56 |
| 959 | 2.0 | 0.38 | 0.38 | 1.00 | 1.00 | 1.00 | 0.000 | 1.24 | 5,7 | 40.8 | 62.0 | 0.73 | 1.05 | 0.392 | 0.389 | 1.006 | 0.723 | 362,450 | 68 by 56 |
| 959 + 1/2 | 2.1 | 0.38 | 0.45 | 0.84 | 0.84 | 0.84 | 0.000 | 1.23 | 5,0 | 42.7 | 67.1 | 0.73 | 1.04 | 0.386 | 0.463 | 0.833 | 0.722 | 38,482 | 80 by 96 |
| 960 | 2.0 | 0.53 | 0.45 | 1.18 | 1.18 | 1.18 | 0.000 | 2.51 | 2,2 | 45.9 | 69.9 | 0.73 | 1.05 | 0.533 | 0.466 | 1.144 | 0.721 | 462,222 | 424 by 92 |
| 960 + 1/2 | 2.0 | 0.54 | 0.52 | 1.04 | 1.04 | 1.04 | 0.000 | 2.53 | 2,2 | 45.6 | 70.9 | 0.73 | 1.03 | 0.552 | 0.532 | 1.039 | 0.721 | 354,230 | 840 by 188 |
| 961 | 2.0 | 0.53 | 0.52 | 1.02 | 1.02 | 1.02 | 0.000 | 2.43 | 2,2 | 42.7 | 71.7 | 0.73 | 1.00 | 0.540 | 0.534 | 1.012 | 0.720 | 178,534 | 84 by 56 |
| 961 + 1/2 | 2.1 | 0.52 | 0.53 | 0.98 | 0.98 | 0.98 | 0.000 | 2.26 | 2,2 | 41.3 | 69.6 | 0.73 | 0.98 | 0.530 | 0.542 | 0.978 | 0.721 | 6,606 | 28 by 52 |
| 962 | 2.2 | 0.52 | 0.53 | 0.98 | 0.98 | 0.98 | 0.000 | 2.16 | 2,2 | 41.3 | 70.1 | 0.73 | 1.00 | 0.535 | 0.542 | 0.988 | 0.722 | 90,670 | 116 by 76 |
| 962 + 1/2 | 2.4 | 0.52 | 0.53 | 0.99 | 0.99 | 0.99 | 0.000 | 2.10 | 2,2 | 39.6 | 66.6 | 0.73 | 1.00 | 0.543 | 0.540 | 1.007 | 0.722 | 270,1074 | 60 by 32 |
| 963 | 2.6 | 0.52 | 0.53 | 0.98 | 0.98 | 0.98 | 0.000 | 2.00 | 2,2 | 39.0 | 64.2 | 0.73 | 0.99 | 0.544 | 0.547 | 0.994 | 0.722 | 298,1074 | 204 by 40 |
| 963 + 1/2 | 2.9 | 0.53 | 0.54 | 0.99 | 0.99 | 0.99 | 0.000 | 1.78 | 2,2 | 37.4 | 63.6 | 0.73 | 0.97 | 0.551 | 0.548 | 1.005 | 0.721 | 1386,1074 | 68 by 36 |
| 964 | 3.2 | 0.54 | 0.54 | 0.99 | 0.99 | 0.99 | 0.000 | 1.61 | 2,2 | 36.0 | 61.8 | 0.73 | 0.96 | 0.552 | 0.555 | 0.995 | 0.721 | 6,1074 | 28 by 44 |
| 964 + 1/2 | 3.6 | 0.54 | 0.55 | 0.99 | 0.99 | 0.99 | 0.000 | 1.49 | 2,2 | 34.8 | 60.5 | 0.73 | 0.95 | 0.559 | 0.560 | 0.998 | 0.721 | 6,1046 | 28 by 64 |
| 965 | 4.0 | 0.56 | 0.55 | 1.00 | 1.00 | 1.00 | 0.000 | 1.40 | 3,2 | 33.0 | 60.8 | 0.73 | 0.95 | 0.568 | 0.567 | 1.002 | 0.721 | 298,1074 | 116 by 44 |
| 965 + 1/2 | 4.3 | 0.56 | 0.56 | 1.00 | 1.00 | 1.00 | 0.000 | 1.37 | 3,2 | 32.7 | 58.7 | 0.73 | 0.95 | 0.575 | 0.573 | 1.003 | 0.721 | 1266,1074 | 60 by 36 |
| 966 | 4.7 | 0.57 | 0.57 | 1.00 | 1.00 | 1.00 | 0.001 | 1.39 | 14,8 | 29.2 | 54.1 | 0.73 | 0.94 | 0.579 | 0.579 | 1.000 | 0.721 | 1026,1074 | 56 by 24 |
| 966 + 1/2 | 5.1 | 0.58 | 0.58 | 1.00 | 0.99 | 0.99 | 0.003 | 1.31 | 14,8 | 27.4 | 52.5 | 0.73 | 0.93 | 0.582 | 0.581 | 1.002 | 0.721 | 1914,1074 | 40 by 28 |
| 967 | 5.4 | 0.58 | 0.58 | 1.00 | 1.01 | 1.00 | 0.000 | 1.36 | 14,6 | 26.8 | 52.0 | 0.73 | 0.93 | 0.584 | 0.583 | 1.002 | 0.721 | 766,1074 | 52 by 32 |
| 967 + 1/2 | 5.7 | 0.58 | 0.59 | 0.99 | 0.99 | 0.99 | 0.000 | 1.24 | 14,6 | 24.6 | 48.9 | 0.73 | 0.94 | 0.584 | 0.588 | 0.992 | 0.721 | 214,1074 | 104 by 44 |
| 968 | 6.1 | 0.60 | 0.59 | 1.01 | 1.01 | 1.01 | 0.001 | 1.25 | 15,4 | 23.7 | 47.8 | 0.73 | 0.94 | 0.592 | 0.589 | 1.006 | 0.722 | 78,1074 | 68 by 28 |
| 968 + 1/2 | 6.4 | 0.59 | 0.60 | 0.99 | 0.99 | 0.99 | 0.001 | 1.26 | 14,6 | 23.3 | 48.4 | 0.73 | 0.94 | 0.593 | 0.599 | 0.991 | 0.722 | 6,1074 | 40 by 32 |
| 969 | 6.7 | 0.61 | 0.60 | 1.01 | 1.01 | 1.01 | 0.000 | 1.35 | 1,8 | 23.5 | 49.3 | 0.73 | 0.96 | 0.612 | 0.599 | 1.021 | 0.723 | 210,1074 | 60 by 28 |
| 969 + 1/2 | 7.1 | 0.61 | 0.61 | 0.99 | 0.99 | 0.99 | 0.000 | 1.32 | 0,8 | 23.5 | 50.6 | 0.73 | 0.97 | 0.605 | 0.616 | 0.981 | 0.723 | 66,1074 | 120 by 28 |
| 970 | 7.4 | 0.62 | 0.62 | 1.00 | 1.00 | 1.00 | 0.000 | 1.32 | 4,8 | 21.7 | 48.4 | 0.73 | 0.98 | 0.621 | 0.622 | 0.998 | 0.724 | 534,1074 | 80 by 36 |
| 970 + 1/2 | 7.7 | 0.63 | 0.63 | 1.00 | 1.00 | 1.00 | 0.001 | 1.79 | 1,8 | 21.0 | 48.5 | 0.73 | 0.99 | 0.633 | 0.630 | 1.006 | 0.725 | 190,1074 | 96 by 36 |
| 971 | 8.1 | 0.63 | 0.64 | 1.00 | 1.00 | 1.00 | 0.000 | 1.62 | 1,8 | 20.2 | 47.6 | 0.73 | 1.00 | 0.638 | 0.639 | 0.998 | 0.726 | 598,1074 | 56 by 36 |
| 971 + 1/2 | 8.3 | 0.64 | 0.64 | 1.00 | 1.00 | 1.00 | 0.005 | 1.75 | 15,7 | 19.3 | 46.7 | 0.73 | 1.00 | 0.646 | 0.644 | 1.003 | 0.727 | 238,1030 | 92 by 104 |
| 972 | 8.7 | 0.65 | 0.65 | 1.00 | 1.00 | 1.00 | 0.005 | 1.76 | 15,7 | 18.8 | 45.8 | 0.73 | 1.00 | 0.650 | 0.653 | 0.996 | 0.728 | 942,1074 | 84 by 40 |
| 972 + 1/2 | 8.9 | 0.65 | 0.65 | 1.00 | 1.01 | 1.00 | 0.003 | 1.91 | 15,7 | 18.6 | 45.6 | 0.73 | 1.00 | 0.660 | 0.658 | 1.002 | 0.729 | 254,998 | 80 by 80 |
| 973 | 9.4 | 0.66 | 0.65 | 1.01 | 1.02 | 1.01 | 0.004 | 1.99 | 15,7 | 18.2 | 44.5 | 0.73 | 1.00 | 0.669 | 0.663 | 1.009 | 0.730 | 1810,1074 | 56 by 28 |
| 973 + 1/2 | 9.7 | 0.66 | 0.66 | 0.99 | 0.98 | 0.98 | 0.009 | 1.71 | 15,7 | 17.7 | 43.7 | 0.73 | 0.99 | 0.667 | 0.675 | 0.987 | 0.732 | 1794,1074 | 56 by 32 |
| 974 | 10.0 | 0.67 | 0.67 | 1.00 | 0.98 | 0.98 | 0.012 | 1.65 | 1,0 | 17.4 | 43.1 | 0.73 | 1.00 | 0.681 | 0.681 | 1.001 | 0.733 | 30,1074 | 52 by 32 |
| 974 + 1/2 | 10.2 | 0.68 | 0.67 | 1.01 | 1.00 | 1.00 | 0.008 | 1.81 | 14,7 | 17.2 | 43.5 | 0.73 | 1.00 | 0.692 | 0.689 | 1.004 | 0.734 | 66,1054 | 48 by 52 |
| 975 | 10.6 | 0.68 | 0.68 | 1.00 | 0.99 | 0.99 | 0.013 | 2.01 | 1,0 | 16.4 | 40.1 | 0.73 | 0.99 | 0.698 | 0.699 | 0.998 | 0.736 | 102,1030 | 52 by 64 |
| 975 + 1/2 | 10.9 | 0.69 | 0.68 | 1.01 | 1.01 | 1.01 | 0.015 | 2.02 | 1,0 | 15.7 | 38.4 | 0.74 | 1.01 | 0.708 | 0.702 | 1.009 | 0.738 | 6,814 | 56 by 84 |
| 976 | 11.2 | 0.69 | 0.69 | 0.99 | 1.01 | 0.99 | 0.005 | 2.18 | 1,0 | 14.9 | 35.7 | 0.74 | 1.00 | 0.706 | 0.711 | 0.993 | 0.739 | 166,994 | 92 by 112 |
| 976 + 1/2 | 11.5 | 0.69 | 0.69 | 1.00 | 0.99 | 0.99 | 0.013 | 2.25 | 1,0 | 14.0 | 33.6 | 0.74 | 1.01 | 0.715 | 0.711 | 1.006 | 0.741 | 266,1074 | 116 by 28 |
| 977 | 11.7 | 0.69 | 0.70 | 1.00 | 0.99 | 0.99 | 0.014 | 2.02 | 1,0 | 13.8 | 31.7 | 0.74 | 0.99 | 0.714 | 0.722 | 0.988 | 0.743 | 130,790 | 96 by 124 |
| 977 + 1/2 | 12.1 | 0.70 | 0.70 | 1.00 | 1.01 | 1.00 | 0.009 | 1.89 | 2,0 | 12.7 | 32.4 | 0.74 | 1.00 | 0.730 | 0.726 | 1.006 | 0.745 | 358,98 | 240 by 100 |
| 978 | 12.5 | 0.71 | 0.70 | 1.01 | 1.01 | 1.01 | 0.010 | 1.69 | 3,0 | 12.0 | 27.0 | 0.74 | 1.01 | 0.737 | 0.734 | 1.004 | 0.747 | 1322,1074 | 64 by 36 |
| 978 + 1/2 | 12.7 | 0.71 | 0.71 | 1.00 | 0.99 | 0.99 | 0.014 | 1.78 | 3,0 | 11.9 | 24.4 | 0.75 | 0.99 | 0.737 | 0.740 | 0.996 | 0.749 | 1294,1074 | 72 by 28 |
| 979 | 13.1 | 0.72 | 0.71 | 1.01 | 1.01 | 1.01 | 0.016 | 1.85 | 3,0 | 12.2 | 22.2 | 0.75 | 1.00 | 0.755 | 0.740 | 1.020 | 0.751 | 370,1074 | 76 by 36 |
| 979 + 1/2 | 13.5 | 0.71 | 0.72 | 0.98 | 0.99 | 0.98 | 0.010 | 1.69 | 10,8 | 11.3 | 19.5 | 0.75 | 1.00 | 0.744 | 0.761 | 0.978 | 0.752 | 6,1074 | 48 by 28 |
| 980 | 13.9 | 0.73 | 0.72 | 1.01 | 1.00 | 1.00 | 0.017 | 2.02 | 4,0 | 11.2 | 16.4 | 0.75 | 1.01 | 0.768 | 0.761 | 1.010 | 0.754 | 282,50 | 104 by 72 |
| 980 + 1/2 | 14.2 | 0.72 | 0.73 | 0.99 | 0.99 | 0.99 | 0.014 | 1.83 | 4,0 | 11.3 | 14.3 | 0.75 | 1.02 | 0.766 | 0.777 | 0.986 | 0.754 | 182,1074 | 68 by 32 |
| 981 | 14.6 | 0.74 | 0.73 | 1.02 | 1.02 | 1.02 | 0.014 | 1.90 | 0,8 | 11.5 | 13.1 | 0.76 | 1.03 | 0.785 | 0.779 | 1.009 | 0.758 | 6,1074 | 32 by 44 |
| 981 + 1/2 | 15.0 | 0.75 | 0.74 | 1.03 | 1.02 | 1.02 | 0.012 | 2.25 | 1,8 | 12.2 | 13.7 | 0.76 | 1.04 | 0.800 | 0.776 | 1.031 | 0.759 | 454,1074 | 60 by 28 |
| 982 | 15.4 | 0.75 | 0.74 | 1.01 | 1.03 | 1.01 | 0.004 | 1.91 | 5,0 | 13.4 | 14.8 | 0.76 | 1.04 | 0.789 | 0.781 | 1.010 | 0.760 | 98,1074 | 56 by 36 |
| 982 + 1/2 | 15.9 | 0.73 | 0.75 | 0.98 | 0.99 | 0.98 | 0.007 | 1.98 | 4,0 | 14.6 | 16.2 | 0.76 | 1.03 | 0.765 | 0.786 | 0.973 | 0.760 | 1170,1074 | 64 by 24 |
| 983 | 16.1 | 0.74 | 0.75 | 0.98 | 0.97 | 0.97 | 0.013 | 1.89 | 2,7 | 15.9 | 17.6 | 0.76 | 1.02 | 0.776 | 0.786 | 0.987 | 0.761 | 278,934 | 96 by 80 |
| 983 + 1/2 | 16.6 | 0.75 | 0.76 | 0.99 | 0.98 | 0.98 | 0.012 | 1.81 | 15,6 | 17.3 | 19.1 | 0.76 | 1.03 | 0.784 | 0.787 | 0.996 | 0.761 | 514,1074 | 60 by 28 |
| 984 | 17.0 | 0.76 | 0.76 | 1.00 | 1.01 | 1.00 | 0.011 | 1.76 | 15,6 | 18.7 | 20.7 | 0.76 | 1.04 | 0.797 | 0.792 | 1.006 | 0.761 | 838,1074 | 92 by 28 |
| 984 + 1/2 | 17.4 | 0.77 | 0.77 | 1.01 | 1.00 | 1.00 | 0.018 | 2.00 | 15,6 | 20.8 | 22.4 | 0.76 | 1.04 | 0.801 | 0.793 | 1.010 | 0.761 | 582,10 | 88 by 48 |
| 985 | 17.8 | 0.78 | 0.77 | 1.01 | 1.01 | 1.01 | 0.009 | 1.78 | 15,0 | 23.3 | 26.9 | 0.76 | 1.03 | 0.809 | 0.799 | 1.013 | 0.761 | 1174,1074 | 64 by 32 |
| 985 + 1/2 | 18.3 | 0.77 | 0.79 | 0.97 | 0.97 | 0.97 | 0.018 | 1.83 | 14,0 | 26.0 | 31.8 | 0.76 | 1.03 | 0.790 | 0.814 | 0.970 | 0.761 | 486,1074 | 116 by 32 |
| 986 | 18.6 | 0.81 | 0.80 | 1.01 | 1.02 | 1.01 | 0.013 | 1.91 | 14,0 | 29.1 | 36.2 | 0.76 | 1.02 | 0.818 | 0.814 | 1.005 | 0.761 | 1378,1074 | 52 by 32 |
| 986 + 1/2 | 19.1 | 0.81 | 0.82 | 0.99 | 0.99 | 0.99 | 0.013 | 2.16 | 14,0 | 31.1 | 39.5 | 0.76 | 0.98 | 0.818 | 0.832 | 0.984 | 0.760 | 1362,1074 | 44 by 44 |
| 987 | 19.7 | 0.84 | 0.83 | 1.01 | 1.01 | 1.01 | 0.016 | 2.18 | 12,1 | 32.9 | 42.2 | 0.76 | 0.97 | 0.845 | 0.837 | 1.010 | 0.759 | 298,1074 | 76 by 28 |
| 987 + 1/2 | 20.1 | 0.86 | 0.87 | 0.99 | 0.99 | 0.99 | 0.014 | 2.42 | 12,1 | 34.3 | 44.8 | 0.76 | 0.95 | 0.855 | 0.871 | 0.983 | 0.758 | 886,1074 | 84 by 28 |
| 988 | 20.8 | 0.90 | 0.89 | 1.01 | 0.99 | 0.99 | 0.035 | 2.70 | 12,1 | 35.8 | 47.7 | 0.75 | 0.95 | 0.896 | 0.894 | 1.003 | 0.757 | 1370,1074 | 108 by 28 |
| 988 + 1/2 | 21.3 | 0.93 | 0.99 | 0.95 | 0.97 | 0.95 | 0.016 | 2.61 | 12,1 | 37.0 | 50.2 | 0.75 | 0.98 | 0.932 | 1.032 | 0.903 | 0.755 | 894,1074 | 88 by 28 |
| 989 | 22.0 | 1.15 | 1.00 | 1.15 | 1.19 | 1.15 | 0.020 | 8.14 | 6,0 | 38.1 | 52.3 | 0.75 | 1.04 | 1.168 | 1.097 | 1.065 | 0.753 | 766,10 | 252 by 108 |
| 989 + 1/2 | 22.6 | 1.29 | 1.06 | 1.22 | 1.26 | 1.22 | 0.027 | 9.27 | 8,1 | 39.1 | 54.1 | 0.75 | 1.06 | 1.263 | 1.220 | 1.035 | 0.751 | 806,6 | 408 by 260 |
| 990 | 23.2 | 1.33 | 1.06 | 1.26 | 1.21 | 1.21 | 0.037 | 6.59 | 10,2 | 39.9 | 55.1 | 0.75 | 1.05 | 1.272 | 1.274 | 0.998 | 0.749 | 1238,310 | 288 by 260 |
| 990 + 1/2 | 23.8 | 1.32 | 1.06 | 1.25 | 1.21 | 1.21 | 0.047 | 7.61 | 11,3 | 40.4 | 55.9 | 0.74 | 1.02 | 1.285 | 1.294 | 0.993 | 0.746 | 1358,422 | 204 by 220 |
| 991 | 24.3 | 1.32 | 1.06 | 1.25 | 1.25 | 1.25 | 0.035 | 7.88 | 12,4 | 40.6 | 55.5 | 0.75 | 1.03 | 1.317 | 1.313 | 1.003 | 0.744 | 1502,590 | 172 by 208 |
| 991 + 1/2 | 24.7 | 1.32 | 1.06 | 1.25 | 1.31 | 1.25 | 0.028 | 10.78 | 13,5 | 40.6 | 54.3 | 0.75 | 1.04 | 1.341 | 1.334 | 1.006 | 0.742 | 1566,686 | 156 by 216 |
| 992 | 25.3 | 1.30 | 1.06 | 1.23 | 1.27 | 1.23 | 0.028 | 12.02 | 13,6 | 40.5 | 52.9 | 0.75 | 1.04 | 1.350 | 1.329 | 1.016 | 0.740 | 1610,774 | 136 by 212 |
| 992 + 1/2 | 25.9 | 1.29 | 1.06 | 1.22 | 1.29 | 1.22 | 0.026 | 7.62 | 13,6 | 40.2 | 50.4 | 0.75 | 1.03 | 1.361 | 1.327 | 1.026 | 0.738 | 1702,966 | 120 by 192 |
| 993 | 26.5 | 1.23 | 1.06 | 1.16 | 1.21 | 1.16 | 0.037 | 7.87 | 14,8 | 39.7 | 47.9 | 0.74 | 1.00 | 1.314 | 1.306 | 1.006 | 0.736 | 1718,1062 | 108 by 124 |
| 993 + 1/2 | 26.9 | 1.17 | 1.06 | 1.10 | 1.15 | 1.10 | 0.033 | 5.78 | 14,8 | 38.8 | 46.2 | 0.74 | 1.00 | 1.262 | 1.262 | 1.000 | 0.734 | 1694,1074 | 96 by 48 |
| 994 | 27.3 | 1.13 | 1.06 | 1.07 | 1.08 | 1.07 | 0.074 | 3.26 | 14,8 | 37.8 | 45.7 | 0.74 | 0.99 | 1.210 | 1.223 | 0.989 | 0.731 | 6,786 | 40 by 48 |
| 994 + 1/2 | 28.2 | 1.11 | 1.06 | 1.05 | 1.06 | 1.05 | 0.048 | 2.69 | 13,7 | 36.8 | 44.9 | 0.74 | 1.00 | 1.180 | 1.197 | 0.986 | 0.729 | 1594,1074 | 84 by 32 |
| 995 | 28.7 | 1.11 | 1.06 | 1.05 | 1.05 | 1.05 | 0.060 | 2.47 | 13,8 | 36.1 | 44.0 | 0.73 | 0.99 | 1.184 | 1.174 | 1.008 | 0.727 | 222,818 | 72 by 112 |
| 995 + 1/2 | 29.7 | 1.09 | 1.06 | 1.03 | 1.03 | 1.03 | 0.040 | 2.77 | 13,8 | 35.3 | 42.8 | 0.73 | 1.00 | 1.168 | 1.171 | 0.998 | 0.725 | 1646,1062 | 56 by 52 |
| 996 | 30.2 | 1.08 | 1.06 | 1.03 | 1.04 | 1.03 | 0.035 | 2.12 | 13,8 | 34.3 | 41.3 | 0.73 | 0.99 | 1.161 | 1.159 | 1.002 | 0.722 | 242,710 | 88 by 52 |
| 996 + 1/2 | 30.6 | 1.07 | 1.06 | 1.01 | 1.03 | 1.01 | 0.033 | 2.36 | 13,7 | 33.8 | 45.2 | 0.73 | 1.00 | 1.150 | 1.150 | 1.000 | 0.720 | 338,6 | 76 by 28 |
| 997 | 31.2 | 1.07 | 1.06 | 1.00 | 0.98 | 0.98 | 0.040 | 2.14 | 13,7 | 33.0 | 45.9 | 0.72 | 0.99 | 1.138 | 1.135 | 1.003 | 0.718 | 6,386 | 52 by 52 |
| 997 + 1/2 | 31.5 | 1.05 | 1.05 | 1.00 | 1.01 | 1.00 | 0.035 | 2.19 | 0,0 | 32.5 | 41.6 | 0.72 | 1.00 | 1.120 | 1.120 | 1.000 | 0.716 | 50,6 | 72 by 36 |
| 998 | 31.9 | 1.04 | 1.03 | 1.01 | 1.01 | 1.01 | 0.034 | 2.61 | 0,0 | 31.6 | 43.1 | 0.72 | 0.99 | 1.103 | 1.092 | 1.009 | 0.713 | 58,6 | 80 by 32 |
| 998 + 1/2 | 32.1 | 1.02 | 1.02 | 1.00 | 0.99 | 0.99 | 0.036 | 2.78 | 3,0 | 30.5 | 38.1 | 0.72 | 1.01 | 1.064 | 1.074 | 0.991 | 0.711 | 98,6 | 64 by 48 |
| 999 | 32.5 | 1.00 | 1.00 | 0.99 | 1.01 | 0.99 | 0.035 | 2.43 | 1,0 | 29.5 | 33.0 | 0.71 | 0.99 | 1.045 | 1.051 | 0.994 | 0.709 | 178,6 | 80 by 56 |
| 999 + 1/2 | 32.7 | 0.98 | 0.98 | 1.00 | 0.99 | 0.99 | 0.068 | 2.95 | 2,0 | 28.6 | 32.0 | 0.71 | 0.99 | 1.038 | 1.027 | 1.011 | 0.706 | 6,318 | 48 by 112 |
| 1000 | 32.7 | 0.97 | 0.97 | 0.99 | 1.00 | 0.99 | 0.040 | 2.35 | 2,0 | 27.4 | 31.6 | 0.71 | 1.00 | 1.009 | 1.019 | 0.991 | 0.704 | 6,66 | 44 by 60 |
| 1000 + 1/2 | 32.8 | 0.96 | 0.95 | 1.01 | 1.02 | 1.01 | 0.039 | 2.79 | 2,0 | 26.1 | 31.4 | 0.71 | 1.00 | 0.999 | 0.978 | 1.022 | 0.702 | 6,86 | 32 by 132 |
| 1001 | 32.6 | 0.92 | 0.95 | 0.98 | 0.99 | 0.98 | 0.048 | 2.12 | 0,1 | 25.3 | 30.4 | 0.70 | 1.01 | 0.946 | 0.966 | 0.980 | 0.699 | 50,6 | 88 by 36 |
| 1001 + 1/2 | 32.8 | 0.91 | 0.93 | 0.98 | 0.99 | 0.98 | 0.040 | 2.57 | 0,1 | 24.1 | 29.6 | 0.70 | 0.99 | 0.933 | 0.930 | 1.002 | 0.697 | 6,142 | 52 by 68 |
| 1002 | 32.7 | 0.90 | 0.92 | 0.98 | 0.99 | 0.98 | 0.037 | 2.23 | 0,1 | 23.1 | 28.5 | 0.70 | 1.01 | 0.914 | 0.908 | 1.007 | 0.694 | 390,114 | 88 by 76 |
| 1002 + 1/2 | 32.5 | 0.89 | 0.91 | 0.98 | 0.98 | 0.98 | 0.032 | 1.90 | 5,1 | 21.8 | 27.7 | 0.70 | 1.01 | 0.883 | 0.878 | 1.005 | 0.692 | 630,6 | 60 by 44 |
| 1003 | 32.4 | 0.86 | 0.91 | 0.95 | 0.95 | 0.95 | 0.038 | 2.01 | 4,2 | 20.8 | 27.0 | 0.69 | 0.98 | 0.842 | 0.848 | 0.993 | 0.689 | 322,434 | 124 by 120 |
| 1003 + 1/2 | 32.3 | 0.85 | 0.91 | 0.94 | 0.93 | 0.93 | 0.049 | 2.02 | 4,1 | 19.9 | 26.4 | 0.69 | 1.00 | 0.813 | 0.820 | 0.992 | 0.687 | 258,394 | 76 by 64 |
| 1004 | 32.2 | 0.84 | 0.90 | 0.94 | 0.93 | 0.93 | 0.051 | 1.93 | 3,3 | 19.0 | 25.3 | 0.68 | 1.01 | 0.798 | 0.792 | 1.008 | 0.684 | 46,282 | 88 by 88 |
| 1004 + 1/2 | 32.0 | 0.84 | 0.88 | 0.95 | 0.91 | 0.91 | 0.048 | 1.82 | 11,1 | 18.1 | 24.6 | 0.67 | 0.97 | 0.770 | 0.778 | 0.989 | 0.682 | 38,162 | 76 by 52 |
| 1005 | 31.7 | 0.85 | 0.87 | 0.98 | 0.97 | 0.97 | 0.036 | 2.18 | 11,1 | 17.6 | 23.6 | 0.66 | 0.99 | 0.759 | 0.755 | 1.005 | 0.679 | 6,106 | 32 by 60 |
| 1005 + 1/2 | 31.3 | 0.86 | 0.86 | 1.00 | 0.99 | 0.99 | 0.050 | 2.54 | 12,2 | 16.6 | 22.4 | 0.65 | 0.99 | 0.740 | 0.739 | 1.001 | 0.677 | 418,262 | 96 by 104 |
| 1006 | 30.8 | 0.87 | 0.86 | 1.02 | 1.04 | 1.02 | 0.033 | 3.71 | 12,2 | 16.4 | 21.6 | 0.64 | 0.98 | 0.719 | 0.725 | 0.992 | 0.674 | 538,258 | 64 by 64 |
| 1006 + 1/2 | 30.2 | 0.91 | 0.86 | 1.06 | 1.08 | 1.06 | 0.032 | 4.74 | 12,2 | 15.6 | 20.8 | 0.62 | 1.01 | 0.711 | 0.697 | 1.021 | 0.671 | 642,314 | 68 by 60 |
| 1007 | 30.1 | 0.93 | 0.86 | 1.09 | 1.03 | 1.03 | 0.053 | 6.27 | 12,2 | 15.3 | 20.2 | 0.61 | 0.99 | 0.674 | 0.675 | 0.998 | 0.668 | 334,330 | 48 by 64 |
| 1007 + 1/2 | 29.5 | 0.91 | 0.85 | 1.07 | 1.08 | 1.07 | 0.034 | 6.28 | 12,1 | 15.3 | 19.2 | 0.60 | 1.01 | 0.640 | 0.651 | 0.983 | 0.666 | 522,6 | 152 by 32 |
| 1008 | 29.3 | 0.87 | 0.85 | 1.02 | 1.01 | 1.01 | 0.061 | 6.05 | 12,1 | 15.5 | 19.3 | 0.59 | 1.01 | 0.627 | 0.630 | 0.996 | 0.663 | 798,598 | 148 by 156 |
| 1008 + 1/2 | 28.3 | 0.86 | 0.85 | 1.01 | 1.02 | 1.01 | 0.045 | 7.27 | 13,2 | 15.8 | 20.1 | 0.57 | 1.00 | 0.620 | 0.601 | 1.032 | 0.661 | 802,590 | 152 by 136 |
| 1009 | 28.0 | 0.85 | 0.85 | 1.00 | 1.01 | 1.00 | 0.052 | 8.09 | 13,2 | 16.0 | 20.5 | 0.55 | 1.00 | 0.574 | 0.583 | 0.986 | 0.658 | 462,362 | 48 by 60 |
| 1009 + 1/2 | 27.4 | 0.83 | 0.85 | 0.98 | 0.85 | 0.85 | 0.088 | 6.92 | 12,1 | 15.8 | 20.6 | 0.55 | 0.96 | 0.545 | 0.552 | 0.987 | 0.656 | 306,154 | 56 by 64 |
| 1010 | 26.8 | 0.85 | 0.84 | 1.01 | 0.96 | 0.96 | 0.084 | 7.25 | 13,2 | 15.7 | 20.7 | 0.54 | 1.00 | 0.530 | 0.528 | 1.004 | 0.653 | 606,386 | 96 by 128 |
| 1010 + 1/2 | 26.1 | 0.86 | 0.84 | 1.03 | 1.07 | 1.03 | 0.052 | 8.70 | 13,1 | 15.3 | 20.5 | 0.52 | 1.00 | 0.512 | 0.512 | 0.999 | 0.650 | 538,298 | 76 by 76 |
| 1011 | 25.1 | 0.85 | 0.82 | 1.05 | 1.11 | 1.05 | 0.041 | 9.93 | 13,1 | 14.7 | 19.5 | 0.51 | 1.01 | 0.494 | 0.500 | 0.989 | 0.648 | 798,238 | 64 by 84 |
| 1011 + 1/2 | 24.7 | 0.80 | 0.81 | 0.99 | 1.02 | 0.99 | 0.056 | 9.45 | 14,1 | 14.0 | 18.4 | 0.50 | 0.99 | 0.488 | 0.475 | 1.026 | 0.645 | 970,518 | 96 by 80 |
| 1012 | 24.2 | 0.79 | 0.77 | 1.02 | 0.98 | 0.98 | 0.067 | 10.63 | 14,1 | 13.2 | 17.2 | 0.48 | 0.99 | 0.456 | 0.467 | 0.976 | 0.641 | 618,310 | 152 by 80 |
| 1012 + 1/2 | 23.6 | 0.74 | 0.75 | 0.99 | 1.08 | 0.99 | 0.036 | 7.89 | 14,1 | 12.4 | 15.9 | 0.47 | 0.99 | 0.447 | 0.444 | 1.007 | 0.637 | 742,426 | 76 by 72 |
| 1013 | 23.1 | 0.71 | 0.73 | 0.98 | 1.04 | 0.98 | 0.047 | 8.66 | 15,1 | 11.4 | 15.1 | 0.45 | 0.99 | 0.432 | 0.430 | 1.005 | 0.631 | 738,430 | 96 by 88 |
| 1013 + 1/2 | 22.5 | 0.71 | 0.70 | 1.02 | 0.97 | 0.97 | 0.075 | 5.55 | 14,3 | 10.9 | 14.9 | 0.43 | 0.94 | 0.412 | 0.420 | 0.980 | 0.622 | 534,246 | 104 by 96 |
| 1014 | 22.6 | 0.67 | 0.70 | 0.96 | 0.96 | 0.96 | 0.050 | 4.03 | 15,1 | 10.4 | 14.7 | 0.42 | 0.96 | 0.408 | 0.402 | 1.016 | 0.612 | 950,506 | 108 by 156 |
| 1014 + 1/2 | 21.8 | 0.66 | 0.69 | 0.96 | 0.95 | 0.95 | 0.079 | 3.92 | 15,1 | 9.8 | 14.8 | 0.40 | 0.93 | 0.392 | 0.396 | 0.990 | 0.599 | 698,358 | 76 by 68 |
| 1015 | 21.4 | 0.68 | 0.68 | 0.99 | 0.95 | 0.95 | 0.083 | 3.33 | 0,1 | 9.9 | 15.1 | 0.39 | 0.92 | 0.384 | 0.387 | 0.993 | 0.585 | 714,362 | 60 by 64 |
| 1015 + 1/2 | 20.5 | 0.67 | 0.68 | 0.99 | 0.88 | 0.88 | 0.106 | 2.88 | 15,1 | 9.9 | 15.5 | 0.38 | 0.88 | 0.382 | 0.382 | 0.999 | 0.566 | 998,542 | 104 by 112 |
| 1016 | 20.4 | 0.66 | 0.67 | 0.97 | 0.96 | 0.96 | 0.059 | 2.95 | 2,0 | 9.5 | 15.5 | 0.37 | 0.92 | 0.379 | 0.378 | 1.004 | 0.547 | 886,462 | 84 by 64 |
| 1016 + 1/2 | 19.9 | 0.64 | 0.67 | 0.95 | 0.85 | 0.85 | 0.084 | 3.96 | 2,0 | 8.9 | 15.1 | 0.37 | 0.88 | 0.374 | 0.376 | 0.996 | 0.528 | 454,6 | 112 by 60 |
| 1017 | 19.0 | 0.63 | 0.67 | 0.94 | 0.94 | 0.94 | 0.056 | 3.83 | 2,0 | 8.1 | 13.4 | 0.37 | 0.93 | 0.373 | 0.370 | 1.008 | 0.511 | 1002,554 | 64 by 60 |
| 1017 + 1/2 | 18.3 | 0.66 | 0.67 | 0.98 | 1.01 | 0.98 | 0.052 | 3.30 | 3,0 | 7.8 | 12.5 | 0.36 | 0.93 | 0.365 | 0.368 | 0.993 | 0.494 | 538,6 | 128 by 56 |
| 1018 | 18.0 | 0.65 | 0.66 | 0.98 | 0.92 | 0.92 | 0.063 | 3.82 | 3,0 | 7.7 | 12.0 | 0.35 | 0.92 | 0.363 | 0.360 | 1.008 | 0.477 | 622,6 | 168 by 56 |
| 1018 + 1/2 | 17.3 | 0.64 | 0.66 | 0.97 | 0.92 | 0.92 | 0.068 | 4.47 | 3,0 | 7.1 | 10.0 | 0.35 | 0.92 | 0.354 | 0.357 | 0.993 | 0.461 | 1198,822 | 60 by 68 |
| 1019 | 16.8 | 0.61 | 0.66 | 0.93 | 0.85 | 0.85 | 0.061 | 4.51 | 3,0 | 6.4 | 9.6 | 0.34 | 0.92 | 0.351 | 0.354 | 0.993 | 0.446 | 962,590 | 124 by 108 |
| 1019 + 1/2 | 16.2 | 0.63 | 0.65 | 0.96 | 0.96 | 0.96 | 0.053 | 3.32 | 4,0 | 6.0 | 8.8 | 0.33 | 0.94 | 0.351 | 0.352 | 0.997 | 0.431 | 1122,826 | 96 by 100 |
| 1020 | 15.5 | 0.66 | 0.64 | 1.03 | 1.02 | 1.02 | 0.025 | 3.87 | 4,0 | 5.9 | 9.8 | 0.33 | 0.96 | 0.353 | 0.349 | 1.010 | 0.417 | 1154,230 | 92 by 132 |
| 1020 + 1/2 | 15.0 | 0.67 | 0.64 | 1.05 | 1.04 | 1.04 | 0.025 | 4.41 | 4,0 | 5.7 | 8.9 | 0.32 | 0.98 | 0.348 | 0.345 | 1.008 | 0.403 | 1186,274 | 68 by 96 |
| 1021 | 14.6 | 0.69 | 0.63 | 1.09 | 1.03 | 1.03 | 0.048 | 4.87 | 4,0 | 5.3 | 8.0 | 0.32 | 0.98 | 0.339 | 0.342 | 0.992 | 0.390 | 1086,578 | 116 by 136 |
| 1021 + 1/2 | 13.8 | 0.69 | 0.63 | 1.10 | 1.09 | 1.09 | 0.030 | 3.78 | 4,0 | 4.9 | 7.3 | 0.31 | 1.01 | 0.336 | 0.337 | 0.998 | 0.378 | 1038,558 | 112 by 128 |
| 1022 | 13.4 | 0.68 | 0.63 | 1.07 | 1.17 | 1.07 | 0.013 | 3.46 | 4,0 | 4.5 | 6.8 | 0.30 | 1.04 | 0.335 | 0.333 | 1.004 | 0.366 | 1118,782 | 56 by 92 |
| 1022 + 1/2 | 12.7 | 0.65 | 0.62 | 1.04 | 1.12 | 1.04 | 0.016 | 3.00 | 4,0 | 4.2 | 6.3 | 0.30 | 1.05 | 0.327 | 0.332 | 0.985 | 0.356 | 1038,662 | 96 by 80 |
| 1023 | 12.3 | 0.63 | 0.62 | 1.02 | 1.12 | 1.02 | 0.005 | 2.86 | 5,0 | 3.7 | 5.7 | 0.29 | 1.02 | 0.330 | 0.326 | 1.014 | 0.346 | 626,114 | 64 by 44 |
| 1023 + 1/2 | 11.8 | 0.62 | 0.61 | 1.01 | 1.10 | 1.01 | 0.004 | 2.61 | 5,0 | 3.4 | 5.2 | 0.28 | 1.00 | 0.324 | 0.324 | 0.999 | 0.337 | 834,430 | 64 by 60 |
| 1024 | 11.2 | 0.61 | 0.60 | 1.01 | 1.07 | 1.01 | 0.012 | 2.74 | 5,0 | 3.1 | 4.7 | 0.27 | 1.00 | 0.321 | 0.321 | 1.000 | 0.329 | 830,406 | 72 by 84 |
| 1024 + 1/2 | 10.8 | 0.59 | 0.59 | 0.99 | 1.05 | 0.99 | 0.006 | 2.26 | 5,0 | 2.8 | 4.4 | 0.27 | 1.00 | 0.318 | 0.320 | 0.996 | 0.320 | 878,442 | 92 by 104 |
| 1025 | 10.2 | 0.58 | 0.58 | 1.00 | 1.05 | 1.00 | 0.008 | 2.23 | 10,0 | 2.5 | 3.8 | 0.26 | 1.01 | 0.318 | 0.318 | 1.001 | 0.312 | 706,122 | 64 by 44 |
| 1025 + 1/2 | 9.7 | 0.57 | 0.57 | 1.00 | 1.04 | 1.00 | 0.005 | 2.50 | 10,0 | 2.1 | 3.3 | 0.26 | 1.00 | 0.318 | 0.317 | 1.002 | 0.305 | 962,622 | 280 by 220 |
| 1026 | 9.0 | 0.56 | 0.56 | 1.00 | 1.05 | 1.00 | 0.007 | 2.67 | 10,0 | 1.8 | 2.8 | 0.25 | 1.00 | 0.316 | 0.316 | 0.999 | 0.298 | 914,470 | 192 by 156 |
| 1026 + 1/2 | 8.6 | 0.55 | 0.55 | 1.01 | 1.05 | 1.01 | 0.011 | 2.55 | 10,0 | 1.5 | 2.4 | 0.25 | 1.04 | 0.313 | 0.315 | 0.994 | 0.291 | 846,394 | 156 by 176 |
| 1027 | 7.8 | 0.53 | 0.53 | 1.00 | 1.03 | 1.00 | 0.013 | 2.82 | 10,0 | 1.2 | 2.0 | 0.24 | 1.07 | 0.314 | 0.311 | 1.009 | 0.286 | 682,158 | 144 by 92 |
| 1027 + 1/2 | 7.4 | 0.51 | 0.51 | 1.00 | 1.00 | 1.00 | 0.007 | 2.71 | 10,0 | 1.0 | 1.8 | 0.24 | 1.08 | 0.310 | 0.311 | 0.996 | 0.281 | 1046,538 | 196 by 236 |
| 1028 | 6.7 | 0.49 | 0.49 | 1.00 | 1.01 | 1.00 | 0.005 | 2.79 | 10,0 | 0.8 | 1.5 | 0.24 | 1.04 | 0.309 | 0.307 | 1.005 | 0.276 | 710,158 | 56 by 48 |
| 1028 + 1/2 | 6.1 | 0.47 | 0.48 | 0.99 | 0.99 | 0.99 | 0.007 | 2.49 | 10,0 | 0.7 | 1.2 | 0.23 | 1.03 | 0.304 | 0.305 | 0.996 | 0.272 | 758,150 | 180 by 96 |
| 1029 | 5.6 | 0.46 | 0.45 | 1.01 | 1.01 | 1.01 | 0.012 | 2.49 | 10,0 | 0.7 | 1.0 | 0.23 | 1.08 | 0.302 | 0.303 | 0.998 | 0.267 | 754,250 | 192 by 120 |
| 1029 + 1/2 | 4.9 | 0.44 | 0.44 | 1.00 | 1.00 | 1.00 | 0.007 | 2.18 | 12,3 | 0.7 | 0.9 | 0.23 | 1.06 | 0.300 | 0.303 | 0.990 | 0.264 | 1082,546 | 252 by 244 |
| 1030 | 4.4 | 0.42 | 0.42 | 1.00 | 1.00 | 1.00 | 0.002 | 1.76 | 11,2 | 0.7 | 1.1 | 0.23 | 0.99 | 0.302 | 0.301 | 1.001 | 0.260 | 1030,418 | 80 by 108 |
| 1030 + 1/2 | 3.7 | 0.40 | 0.40 | 1.02 | 1.02 | 1.02 | 0.000 | 1.74 | 12,3 | 0.8 | 1.3 | 0.23 | 0.91 | 0.304 | 0.301 | 1.013 | 0.257 | 1018,386 | 168 by 116 |
| 1031 | 2.9 | 0.37 | 0.40 | 0.92 | 0.93 | 0.92 | 0.004 | 1.51 | 3,3 | 1.0 | 1.5 | 0.22 | 1.04 | 0.300 | 0.301 | 0.995 | 0.255 | 822,310 | 92 by 112 |
| 1031 + 1/2 | 2.3 | 0.34 | 0.40 | 0.85 | 0.87 | 0.85 | 0.001 | 1.58 | 3,3 | 1.2 | 1.9 | 0.22 | 1.11 | 0.301 | 0.300 | 1.004 | 0.253 | 974,478 | 120 by 184 |
| 1032 | 1.7 | 0.33 | 0.40 | 0.82 | 0.84 | 0.82 | 0.002 | 1.57 | 3,3 | 1.5 | 2.4 | 0.22 | 1.09 | 0.300 | 0.299 | 1.000 | 0.251 | 866,162 | 216 by 76 |
| 1032 + 1/2 | 1.3 | 0.31 | 0.40 | 0.79 | 0.80 | 0.79 | 0.001 | 1.84 | 3,4 | 1.7 | 2.8 | 0.21 | 1.00 | 0.299 | 0.300 | 0.996 | 0.249 | 918,406 | 148 by 188 |
| 1033 | 1.1 | 0.31 | 0.40 | 0.77 | 0.79 | 0.77 | 0.007 | 1.59 | 3,4 | 2.0 | 3.4 | 0.21 | 0.92 | 0.299 | 0.300 | 0.998 | 0.248 | 838,310 | 88 by 108 |
| 1033 + 1/2 | 0.9 | 0.30 | 0.40 | 0.76 | 0.78 | 0.76 | 0.000 | 1.36 | 3,4 | 2.4 | 4.0 | 0.21 | 0.86 | 0.300 | 0.300 | 1.002 | 0.246 | 1090,498 | 152 by 140 |
| 1034 | 0.9 | 0.30 | 0.40 | 0.75 | 0.77 | 0.75 | 0.002 | 1.53 | 3,4 | 2.9 | 4.7 | 0.21 | 0.84 | 0.300 | 0.300 | 1.000 | 0.245 | 1126,602 | 152 by 216 |
| 1034 + 1/2 | 0.9 | 0.30 | 0.40 | 0.77 | 0.78 | 0.77 | 0.001 | 1.46 | 5,7 | 3.4 | 5.8 | 0.21 | 0.85 | 0.304 | 0.300 | 1.013 | 0.244 | 1102,698 | 196 by 416 |
| 1035 | 0.8 | 0.30 | 0.40 | 0.77 | 0.78 | 0.77 | 0.010 | 1.32 | 3,4 | 4.1 | 6.8 | 0.20 | 0.85 | 0.300 | 0.300 | 1.001 | 0.242 | 1078,506 | 56 by 56 |
| 1035 + 1/2 | 0.8 | 0.30 | 0.40 | 0.76 | 0.77 | 0.76 | 0.002 | 1.44 | 4,5 | 4.8 | 7.8 | 0.20 | 0.85 | 0.300 | 0.301 | 0.997 | 0.241 | 1082,482 | 140 by 308 |
| 1036 | 0.8 | 0.30 | 0.40 | 0.75 | 0.77 | 0.75 | 0.002 | 1.43 | 4,5 | 5.6 | 8.8 | 0.20 | 0.84 | 0.300 | 0.301 | 0.999 | 0.240 | 1178,546 | 192 by 408 |
| 1036 + 1/2 | 0.8 | 0.30 | 0.40 | 0.76 | 0.80 | 0.76 | 0.004 | 1.48 | 4,5 | 6.8 | 10.5 | 0.20 | 0.86 | 0.301 | 0.301 | 1.000 | 0.239 | 1190,546 | 96 by 280 |
| 1037 | 1.0 | 0.31 | 0.40 | 0.79 | 0.84 | 0.79 | 0.005 | 1.70 | 4,4 | 8.0 | 12.2 | 0.20 | 0.90 | 0.301 | 0.303 | 0.993 | 0.238 | 1046,514 | 156 by 204 |
| 1037 + 1/2 | 1.3 | 0.33 | 0.40 | 0.84 | 0.92 | 0.84 | 0.004 | 2.05 | 4,4 | 8.8 | 13.0 | 0.20 | 0.90 | 0.306 | 0.304 | 1.006 | 0.236 | 1094,522 | 120 by 280 |
| 1038 | 1.7 | 0.36 | 0.40 | 0.90 | 0.99 | 0.90 | 0.005 | 2.77 | 10,2 | 9.7 | 13.4 | 0.20 | 0.93 | 0.307 | 0.308 | 0.997 | 0.235 | 1178,750 | 104 by 312 |
| 1038 + 1/2 | 2.3 | 0.37 | 0.40 | 0.94 | 1.08 | 0.94 | 0.005 | 3.37 | 10,2 | 12.2 | 16.2 | 0.19 | 0.97 | 0.310 | 0.309 | 1.000 | 0.234 | 786,178 | 68 by 68 |
| 1039 | 2.8 | 0.39 | 0.39 | 1.00 | 1.13 | 1.00 | 0.010 | 3.33 | 4,3 |  |  |  | 0.90 | 0.312 | 0.313 | 0.996 | 0.232 | 1122,526 | 92 by 256 |
| 1039 + 1/2 | 3.4 | 0.41 | 0.41 | 1.00 | 1.17 | 1.00 | 0.011 | 4.70 | 4,4 |  |  |  | 1.03 | 0.316 | 0.317 | 0.997 | 0.231 | 1078,498 | 84 by 204 |
| 1040 | 3.8 | 0.43 | 0.42 | 1.04 | 1.26 | 1.04 | 0.012 | 5.72 | 10,1 |  |  |  | 1.07 | 0.323 | 0.316 | 1.022 | 0.229 | 1078,498 | 92 by 180 |
| 1040 + 1/2 | 4.6 | 0.45 | 0.42 | 1.05 | 1.26 | 1.05 | 0.012 | 6.51 | 10,1 |  |  |  | 1.11 | 0.325 | 0.319 | 1.017 | 0.227 | 1134,522 | 64 by 224 |
| 1041 | 5.4 | 0.45 | 0.42 | 1.07 | 1.25 | 1.07 | 0.014 | 6.21 | 11,2 |  |  |  | 1.11 | 0.315 | 0.327 | 0.963 | 0.225 | 1182,530 | 56 by 204 |
| 1041 + 1/2 | 6.2 | 0.47 | 0.42 | 1.12 | 1.24 | 1.12 | 0.029 | 7.32 | 11,2 |  |  |  | 1.07 | 0.330 | 0.333 | 0.991 | 0.224 | 1158,470 | 72 by 176 |
| 1042 | 6.9 | 0.49 | 0.42 | 1.15 | 1.26 | 1.15 | 0.025 | 8.49 | 11,2 |  |  |  | 1.10 | 0.341 | 0.337 | 1.011 | 0.222 | 1278,710 | 128 by 128 |
| 1042 + 1/2 | 7.7 | 0.52 | 0.42 | 1.23 | 1.26 | 1.23 | 0.027 | 9.50 | 11,2 |  |  |  | 1.08 | 0.344 | 0.346 | 0.994 | 0.220 | 1390,434 | 60 by 264 |
| 1043 | 8.6 | 0.58 | 0.42 | 1.37 | 1.36 | 1.36 | 0.029 | 9.99 | 12,2 |  |  |  | 1.11 | 0.351 | 0.361 | 0.973 | 0.218 | 1406,418 | 36 by 100 |
| 1043 + 1/2 | 9.2 | 0.64 | 0.42 | 1.50 | 1.28 | 1.28 | 0.030 | 12.44 | 10,0 |  |  |  | 1.07 | 0.379 | 0.383 | 0.988 | 0.215 | 1198,106 | 152 by 148 |
| 1044 | 10.1 | 0.59 | 0.43 | 1.38 | 1.15 | 1.15 | 0.040 | 10.15 | 10,0 |  |  |  | 1.03 | 0.415 | 0.414 | 1.002 | 0.213 | 1410,262 | 68 by 116 |
| 1044 + 1/2 | 10.5 | 0.50 | 0.43 | 1.17 | 1.05 | 1.05 | 0.045 | 8.23 | 12,4 |  |  |  | 0.99 | 0.450 | 0.431 | 1.042 | 0.210 | 1482,386 | 40 by 68 |
| 1045 | 11.1 | 0.49 | 0.43 | 1.15 | 0.99 | 0.99 | 0.044 | 6.81 | 12,5 |  |  |  | 0.98 | 0.477 | 0.442 | 1.079 | 0.208 | 1514,374 | 36 by 80 |
| 1045 + 1/2 | 11.7 | 0.46 | 0.43 | 1.08 | 1.04 | 1.04 | 0.039 | 7.83 | 12,5 |  |  |  | 1.00 | 0.448 | 0.443 | 1.011 | 0.203 | 1398,102 | 80 by 80 |
| 1046 | 12.2 | 0.45 | 0.43 | 1.04 | 0.97 | 0.97 | 0.045 | 5.56 | 12,5 |  |  |  | 0.93 | 0.437 | 0.452 | 0.966 | 0.198 | 1570,426 | 44 by 84 |
| 1046 + 1/2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | not read |  |  |  |

## place

### dive (mercury.dive, T at 760, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

### rise (mercury.rise, T at 977, place window -1 to -1, frames -1 to -1 at rate 1)

Note: the stop draws no place picture: there is nothing to switch off.

## parity

The same film frame at uhd scaled down by 2 against 16x9, tier draft, display values 0 to 255. Seconds a rendered frame on space-sandbox 2x Intel(R) Xeon(R) Processor @ 2.90GHz: 16x9 36.23, uhd 128.88.

Largest mean difference: 2.146 at frame 870 (mercury.terrain), limit 12.
Largest mean difference at one 8th of the size (what is left when the fine grain is averaged away): 0.746 at frame 870 (mercury.terrain), limit 3.2.
Largest level difference of one block (a grid of 16 by 9): 3.443 at frame 713 (mercury.dive), limit 12.
Largest level difference of the whole frame: -0.696 at frame 870 (mercury.terrain), limit 2.2.
Picture: out/work/smooth/mercury-parity.png

| frame | segment | mean | 99th | max | level | colour | coarse mean | coarse max | block level | block | fine detail, 16x9 over uhd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 615 | mercury.hold | 1.316 | 7.5 | 130 | 0.038 | 0.055 | 0.247 | 10.34 | 1.288 | 7,4 | 1.095 |
| 713 | mercury.dive | 1.346 | 7.9 | 111 | 0.232 | 0.234 | 0.372 | 14.68 | 3.443 | 6,3 | 1.123 |
| 735 | mercury.dive | 1.685 | 8.8 | 170 | 0.259 | 0.264 | 0.385 | 9.57 | 3.211 | 13,8 | 1.027 |
| 758 | mercury.dive | 2.060 | 12.8 | 166 | -0.537 | -0.548 | 0.660 | 8.66 | -1.931 | 10,5 | 1.014 |
| 870 | mercury.terrain | 2.146 | 14.5 | 102 | -0.696 | -0.735 | 0.746 | 8.20 | -2.055 | 12,5 | 0.880 |
| 979 | mercury.rise | 1.837 | 11.3 | 127 | -0.389 | -0.389 | 0.525 | 7.31 | -1.934 | 10,7 | 1.017 |
| 998 | mercury.rise | 1.762 | 9.9 | 99 | 0.265 | 0.275 | 0.399 | 10.04 | 3.118 | 12,8 | 1.031 |
| 1016 | mercury.rise | 1.408 | 8.5 | 113 | 0.116 | 0.139 | 0.296 | 9.96 | 1.559 | 9,7 | 1.148 |
| 1073 | mercury.travel | 1.319 | 8.4 | 36 | 0.002 | 0.003 | 0.156 | 1.92 | 0.035 | 4,4 | 1.456 |

level: the mean of uhd less the mean of 16x9. colour: the largest of the three channel means, the same way. block level: the block whose mean differs most. fine detail: the mean strength of the finest detail in 16x9 over the same in uhd scaled down; 1 is the same grain.

## counts

Film frames 540 to 1109 in order on one fresh page, 1140 pictures at rate 2, tier draft at preview, 8749 s. Before each picture the warm start ran as the live player calls it (showcase.ahead, every due warm frame at the first picture): 7 warm draws. Its work counts for that picture and stands in brackets. Judged: dive, rise and travel, every picture.

| segment | judged | pictures | pictures with work | first | programs | texture uploads | buffers |
|---|---|---|---|---|---|---|---|
| mercury.hold | no | 300 | 1 | 540 | 22 | 142 | 115 |
| mercury.dive | yes | 180 | 0 |  | 0 | 0 | 0 |
| mercury.terrain | no | 360 | 0 |  | 0 | 0 | 0 |
| mercury.rise | yes | 150 | 0 |  | 0 | 0 | 0 |
| mercury.travel | yes | 150 | 0 |  | 0 | 0 | 0 |

Every picture with work (of the warm start call in brackets):

| frame | segment | programs | texture uploads | buffers | warm draws |
|---|---|---|---|---|---|
| 540 | mercury.hold | 22 (22) | 142 (142) | 115 (110) | 7 |
