#!/bin/bash
# usage: heroes.sh   sky statistics of the nine approved heroes, one box of sky away from the globe and the band, one box inside the band
cd "$(dirname "$0")/../.."
A=references/approved
S=assets-src/travel/skystats.py
python3 $S $A/sun-hero.png 0,0,330,250 $A/sun-hero.png 0,380,330,640 \
  $A/mercury-hero.png 0,20,330,300 $A/mercury-hero.png 1250,640,1900,1060 \
  $A/venus-hero.png 0,760,440,1060 $A/venus-hero.png 0,330,480,560 \
  $A/earth-hero.png 0,620,440,1060 $A/earth-hero.png 1500,400,1900,700 \
  $A/mars-hero.png 1650,650,1910,1060 $A/mars-hero.png 0,180,360,460 \
  $A/jupiter-hero.png 0,560,420,1060 $A/jupiter-hero.png 1470,330,1900,640 \
  $A/saturn-hero.png 1300,10,1620,230 $A/saturn-hero.png 0,0,700,210 \
  $A/uranus-hero.png 0,560,440,1060 $A/uranus-hero.png 1400,560,1900,900 \
  $A/neptune-hero.png 0,350,280,610 $A/neptune-hero.png 560,0,1100,110
