# The Sun in the travels (round 31, D6)

Made by `npx tsx assets-src/travel/turn.ts sun` and `npx tsx assets-src/travel/sunarc.ts` on the path of this commit. Every stop's world is placed so that its own Sun direction lies on the one world direction `sunWorld`, so the leaving stop's Sun and the arriving stop's Sun are the same direction in every travel frame and the table has one angle column. Radius and glare are the values the frame is drawn with; the heading of each block gives both stops' own values. Half field of view: 15.0 vertical, 25.5 horizontal, 28.7 to the corner, the same in every frame.

## Per travel

```
sun.travel | turn 22.9 | Sun to first axis 0.1 | Sun to last axis 22.9 | Sun off the turn's plane 0.1 | Sun along the turn from the first axis -0.0 | nearest on today's path 0.1 at 450 | radius 5 to 9.2 | glare 1 to 0.012
mercury.travel | turn 73.1 | Sun to first axis 48.8 | Sun to last axis 115.3 | Sun off the turn's plane 22.5 | Sun along the turn from the first axis -44.5 | nearest on today's path 48.8 at 1053 | radius 9.2 to 0.9 | glare 0.012 to 0.9
venus.travel | turn 94.6 | Sun to first axis 100.7 | Sun to last axis 120.9 | Sun off the turn's plane 55.8 | Sun along the turn from the first axis -109.3 | nearest on today's path 95.0 at 1645 | radius 0.9 to 1.8 | glare 0.9 to 0.85
earth.travel | turn 127.3 | Sun to first axis 120.9 | Sun to last axis 103.3 | Sun off the turn's plane 31.6 | Sun along the turn from the first axis -127.0 | nearest on today's path 103.2 at 2247 | radius 1.8 to 1.1 | glare 0.85 to 0.8
mars.travel | turn 78.5 | Sun to first axis 96.7 | Sun to last axis 132.3 | Sun off the turn's plane 47.7 | Sun along the turn from the first axis -99.9 | nearest on today's path 86.0 at 2784 | radius 1.1 to 0.5 | glare 0.8 to 0.75
jupiter.travel | turn 47.0 | Sun to first axis 76.5 | Sun to last axis 81.0 | Sun off the turn's plane 76.5 | Sun along the turn from the first axis -1.1 | nearest on today's path 65.6 at 3358 | radius 0.5 to 0.32 | glare 0.75 to 0.7
saturn.travel | turn 77.5 | Sun to first axis 99.9 | Sun to last axis 107.7 | Sun off the turn's plane 71.2 | Sun along the turn from the first axis -122.1 | nearest on today's path 99.9 at 3885 | radius 0.32 to 0.2 | glare 0.7 to 0.65
uranus.travel | turn 89.2 | Sun to first axis 69.9 | Sun to last axis 19.4 | Sun off the turn's plane 1.8 | Sun along the turn from the first axis 69.9 | nearest on today's path 2.2 at 4511 | radius 0.2 to 0.14 | glare 0.65 to 0.6
```

## Per frame (every fifth)

```

sun.travel 450 to 539: Sun radius deg 5 to 9.2, glare 1 to 0.012
frame | axis to Sun | half fov v | h | diagonal | Sun px | radius deg | glare
450 | 0.1 | 15.0 | 25.5 | 28.7 | 962,541 | 12.628 | 0.000
455 | 0.3 | 15.0 | 25.5 | 28.7 | 970,540 | 12.628 | 0.000
460 | 0.7 | 15.0 | 25.5 | 28.7 | 984,534 | 12.628 | 0.000
465 | 1.5 | 15.0 | 25.5 | 28.7 | 1011,521 | 12.628 | 0.002
470 | 2.8 | 15.0 | 25.5 | 28.7 | 1052,500 | 12.605 | 0.003
475 | 4.6 | 15.0 | 25.5 | 28.7 | 1107,471 | 11.864 | 0.005
480 | 6.8 | 15.0 | 25.5 | 28.7 | 1177,434 | 9.868 | 0.007
485 | 9.4 | 15.0 | 25.5 | 28.7 | 1259,391 | 9.225 | 0.009
490 | 12.3 | 15.0 | 25.5 | 28.7 | 1351,342 | 9.200 | 0.011
495 | 15.2 | 15.0 | 25.5 | 28.7 | 1449,290 | 9.200 | 0.012
500 | 18.0 | 15.0 | 25.5 | 28.7 | 1542,239 | 9.200 | 0.012
505 | 20.1 | 15.0 | 25.5 | 28.7 | 1611,195 | 9.200 | 0.012
510 | 21.4 | 15.0 | 25.5 | 28.7 | 1651,160 | 9.200 | 0.012
515 | 22.0 | 15.0 | 25.5 | 28.7 | 1666,136 | 9.200 | 0.012
520 | 22.2 | 15.0 | 25.5 | 28.7 | 1668,121 | 9.200 | 0.012
525 | 22.3 | 15.0 | 25.5 | 28.7 | 1669,112 | 9.200 | 0.012
530 | 22.5 | 15.0 | 25.5 | 28.7 | 1676,107 | 9.200 | 0.012
535 | 22.8 | 15.0 | 25.5 | 28.7 | 1685,106 | 9.200 | 0.012

mercury.travel 1035 to 1109: Sun radius deg 9.2 to 0.9, glare 0.012 to 0.9
frame | axis to Sun | half fov v | h | diagonal | Sun px | radius deg | glare
1035 | 48.8 | 15.0 | 25.5 | 28.7 | out | 9.200 | 0.012
1040 | 48.8 | 15.0 | 25.5 | 28.7 | out | 9.200 | 0.012
1045 | 48.8 | 15.0 | 25.5 | 28.7 | out | 9.200 | 0.012
1050 | 48.8 | 15.0 | 25.5 | 28.7 | out | 9.200 | 0.012
1055 | 48.9 | 15.0 | 25.5 | 28.7 | out | 9.168 | 0.015
1060 | 51.2 | 15.0 | 25.5 | 28.7 | out | 8.647 | 0.071
1065 | 57.8 | 15.0 | 25.5 | 28.7 | out | 7.624 | 0.181
1070 | 67.2 | 15.0 | 25.5 | 28.7 | out | 6.278 | 0.325
1075 | 76.4 | 15.0 | 25.5 | 28.7 | out | 4.786 | 0.484
1080 | 84.8 | 15.0 | 25.5 | 28.7 | out | 3.325 | 0.641
1085 | 93.0 | 15.0 | 25.5 | 28.7 | out | 2.072 | 0.775
1090 | 101.2 | 15.0 | 25.5 | 28.7 | out | 1.205 | 0.867
1095 | 109.0 | 15.0 | 25.5 | 28.7 | out | 0.900 | 0.900
1100 | 114.0 | 15.0 | 25.5 | 28.7 | out | 0.900 | 0.900
1105 | 115.5 | 15.0 | 25.5 | 28.7 | out | 0.900 | 0.900

venus.travel 1605 to 1679: Sun radius deg 0.9 to 1.8, glare 0.9 to 0.85
frame | axis to Sun | half fov v | h | diagonal | Sun px | radius deg | glare
1605 | 100.7 | 15.0 | 25.5 | 28.7 | out | 0.900 | 0.900
1610 | 100.7 | 15.0 | 25.5 | 28.7 | out | 0.900 | 0.900
1615 | 100.7 | 15.0 | 25.5 | 28.7 | out | 0.900 | 0.900
1620 | 100.7 | 15.0 | 25.5 | 28.7 | out | 0.900 | 0.900
1625 | 100.7 | 15.0 | 25.5 | 28.7 | out | 0.903 | 0.900
1630 | 100.8 | 15.0 | 25.5 | 28.7 | out | 0.960 | 0.897
1635 | 100.1 | 15.0 | 25.5 | 28.7 | out | 1.071 | 0.891
1640 | 97.1 | 15.0 | 25.5 | 28.7 | out | 1.217 | 0.882
1645 | 95.0 | 15.0 | 25.5 | 28.7 | out | 1.379 | 0.873
1650 | 97.2 | 15.0 | 25.5 | 28.7 | out | 1.537 | 0.865
1655 | 104.2 | 15.0 | 25.5 | 28.7 | out | 1.673 | 0.857
1660 | 113.2 | 15.0 | 25.5 | 28.7 | out | 1.767 | 0.852
1665 | 119.6 | 15.0 | 25.5 | 28.7 | out | 1.800 | 0.850
1670 | 121.0 | 15.0 | 25.5 | 28.7 | out | 1.800 | 0.850
1675 | 120.9 | 15.0 | 25.5 | 28.7 | out | 1.800 | 0.850

earth.travel 2175 to 2249: Sun radius deg 1.8 to 1.1, glare 0.85 to 0.8
frame | axis to Sun | half fov v | h | diagonal | Sun px | radius deg | glare
2175 | 120.9 | 15.0 | 25.5 | 28.7 | out | 1.800 | 0.850
2180 | 120.9 | 15.0 | 25.5 | 28.7 | out | 1.800 | 0.850
2185 | 120.9 | 15.0 | 25.5 | 28.7 | out | 1.800 | 0.850
2190 | 120.9 | 15.0 | 25.5 | 28.7 | out | 1.800 | 0.850
2195 | 121.0 | 15.0 | 25.5 | 28.7 | out | 1.797 | 0.850
2200 | 123.2 | 15.0 | 25.5 | 28.7 | out | 1.753 | 0.847
2205 | 129.9 | 15.0 | 25.5 | 28.7 | out | 1.667 | 0.841
2210 | 140.8 | 15.0 | 25.5 | 28.7 | out | 1.554 | 0.832
2215 | 152.2 | 15.0 | 25.5 | 28.7 | out | 1.428 | 0.823
2220 | 158.7 | 15.0 | 25.5 | 28.7 | out | 1.304 | 0.815
2225 | 151.4 | 15.0 | 25.5 | 28.7 | out | 1.199 | 0.807
2230 | 135.3 | 15.0 | 25.5 | 28.7 | out | 1.126 | 0.802
2235 | 118.3 | 15.0 | 25.5 | 28.7 | out | 1.100 | 0.800
2240 | 107.0 | 15.0 | 25.5 | 28.7 | out | 1.100 | 0.800
2245 | 103.3 | 15.0 | 25.5 | 28.7 | out | 1.100 | 0.800

mars.travel 2745 to 2819: Sun radius deg 1.1 to 0.5, glare 0.8 to 0.75
frame | axis to Sun | half fov v | h | diagonal | Sun px | radius deg | glare
2745 | 96.7 | 15.0 | 25.5 | 28.7 | out | 1.100 | 0.800
2750 | 96.7 | 15.0 | 25.5 | 28.7 | out | 1.100 | 0.800
2755 | 96.7 | 15.0 | 25.5 | 28.7 | out | 1.100 | 0.800
2760 | 96.7 | 15.0 | 25.5 | 28.7 | out | 1.100 | 0.800
2765 | 96.7 | 15.0 | 25.5 | 28.7 | out | 1.098 | 0.800
2770 | 96.0 | 15.0 | 25.5 | 28.7 | out | 1.060 | 0.797
2775 | 93.3 | 15.0 | 25.5 | 28.7 | out | 0.986 | 0.791
2780 | 88.3 | 15.0 | 25.5 | 28.7 | out | 0.889 | 0.782
2785 | 86.0 | 15.0 | 25.5 | 28.7 | out | 0.781 | 0.773
2790 | 90.4 | 15.0 | 25.5 | 28.7 | out | 0.675 | 0.765
2795 | 101.4 | 15.0 | 25.5 | 28.7 | out | 0.585 | 0.757
2800 | 115.0 | 15.0 | 25.5 | 28.7 | out | 0.522 | 0.752
2805 | 126.2 | 15.0 | 25.5 | 28.7 | out | 0.500 | 0.750
2810 | 131.2 | 15.0 | 25.5 | 28.7 | out | 0.500 | 0.750
2815 | 132.3 | 15.0 | 25.5 | 28.7 | out | 0.500 | 0.750

jupiter.travel 3315 to 3389: Sun radius deg 0.5 to 0.32, glare 0.75 to 0.7
frame | axis to Sun | half fov v | h | diagonal | Sun px | radius deg | glare
3315 | 76.5 | 15.0 | 25.5 | 28.7 | out | 0.500 | 0.750
3320 | 76.5 | 15.0 | 25.5 | 28.7 | out | 0.500 | 0.750
3325 | 76.5 | 15.0 | 25.5 | 28.7 | out | 0.500 | 0.750
3330 | 76.5 | 15.0 | 25.5 | 28.7 | out | 0.500 | 0.750
3335 | 76.4 | 15.0 | 25.5 | 28.7 | out | 0.499 | 0.750
3340 | 76.0 | 15.0 | 25.5 | 28.7 | out | 0.488 | 0.747
3345 | 74.1 | 15.0 | 25.5 | 28.7 | out | 0.466 | 0.741
3350 | 69.9 | 15.0 | 25.5 | 28.7 | out | 0.437 | 0.732
3355 | 66.1 | 15.0 | 25.5 | 28.7 | out | 0.404 | 0.723
3360 | 66.1 | 15.0 | 25.5 | 28.7 | out | 0.373 | 0.715
3365 | 69.6 | 15.0 | 25.5 | 28.7 | out | 0.345 | 0.707
3370 | 74.8 | 15.0 | 25.5 | 28.7 | out | 0.327 | 0.702
3375 | 79.0 | 15.0 | 25.5 | 28.7 | out | 0.320 | 0.700
3380 | 80.8 | 15.0 | 25.5 | 28.7 | out | 0.320 | 0.700
3385 | 81.1 | 15.0 | 25.5 | 28.7 | out | 0.320 | 0.700

saturn.travel 3885 to 3959: Sun radius deg 0.32 to 0.2, glare 0.7 to 0.65
frame | axis to Sun | half fov v | h | diagonal | Sun px | radius deg | glare
3885 | 99.9 | 15.0 | 25.5 | 28.7 | out | 0.320 | 0.700
3890 | 99.9 | 15.0 | 25.5 | 28.7 | out | 0.320 | 0.700
3895 | 99.9 | 15.0 | 25.5 | 28.7 | out | 0.320 | 0.700
3900 | 99.9 | 15.0 | 25.5 | 28.7 | out | 0.320 | 0.700
3905 | 100.0 | 15.0 | 25.5 | 28.7 | out | 0.320 | 0.700
3910 | 100.8 | 15.0 | 25.5 | 28.7 | out | 0.312 | 0.697
3915 | 103.8 | 15.0 | 25.5 | 28.7 | out | 0.297 | 0.691
3920 | 109.3 | 15.0 | 25.5 | 28.7 | out | 0.278 | 0.682
3925 | 114.5 | 15.0 | 25.5 | 28.7 | out | 0.256 | 0.673
3930 | 117.2 | 15.0 | 25.5 | 28.7 | out | 0.235 | 0.665
3935 | 116.5 | 15.0 | 25.5 | 28.7 | out | 0.217 | 0.657
3940 | 113.4 | 15.0 | 25.5 | 28.7 | out | 0.204 | 0.652
3945 | 110.0 | 15.0 | 25.5 | 28.7 | out | 0.200 | 0.650
3950 | 108.3 | 15.0 | 25.5 | 28.7 | out | 0.200 | 0.650
3955 | 107.8 | 15.0 | 25.5 | 28.7 | out | 0.200 | 0.650

uranus.travel 4455 to 4529: Sun radius deg 0.2 to 0.14, glare 0.65 to 0.6
frame | axis to Sun | half fov v | h | diagonal | Sun px | radius deg | glare
4455 | 69.9 | 15.0 | 25.5 | 28.7 | out | 0.200 | 0.650
4460 | 69.9 | 15.0 | 25.5 | 28.7 | out | 0.200 | 0.650
4465 | 69.9 | 15.0 | 25.5 | 28.7 | out | 0.200 | 0.650
4470 | 69.7 | 15.0 | 25.5 | 28.7 | out | 0.200 | 0.650
4475 | 67.9 | 15.0 | 25.5 | 28.7 | out | 0.200 | 0.650
4480 | 63.3 | 15.0 | 25.5 | 28.7 | out | 0.196 | 0.647
4485 | 56.5 | 15.0 | 25.5 | 28.7 | out | 0.189 | 0.641
4490 | 48.6 | 15.0 | 25.5 | 28.7 | out | 0.179 | 0.632
4495 | 39.1 | 15.0 | 25.5 | 28.7 | out | 0.168 | 0.623
4500 | 27.8 | 15.0 | 25.5 | 28.7 | out | 0.158 | 0.615
4505 | 15.3 | 15.0 | 25.5 | 28.7 | 500,238 | 0.148 | 0.607
4510 | 3.0 | 15.0 | 25.5 | 28.7 | 897,453 | 0.142 | 0.602
4515 | 9.6 | 15.0 | 25.5 | 28.7 | 1278,419 | 0.140 | 0.600
4520 | 16.6 | 15.0 | 25.5 | 28.7 | 1498,273 | 0.140 | 0.600
4525 | 19.1 | 15.0 | 25.5 | 28.7 | 1569,201 | 0.140 | 0.600
```
