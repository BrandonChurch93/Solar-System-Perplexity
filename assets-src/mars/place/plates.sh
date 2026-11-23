#!/bin/sh
# From the takes to the baked pyramid, one step at a time (two jobs of 4096 px at once do not fit the machine).
#   sh assets-src/mars/place/plates.sh [lay] [force] [bake]
# lay: the land of dehaze.py laid back at the plate widths; force: the takes held to the picture; bake: bake.py.
set -e
W=out/work/place
P=assets-src/mars/place
T=${TAKES:-$P/takes}
for step in "$@"; do
  case $step in
    lay)
      python3 $P/dehaze.py --kind dive --out $W/dehaze/dive
      for w in 3.25 1.2 0.6; do
        python3 $P/layback.py --kind dive --width-deg $w --size 4096 --image $W/dehaze/dive-land.png --out $W/lay/dive-land-$w
        python3 $P/layback.py --kind dive --width-deg $w --size 4096 --image $W/dehaze/dive-t.png --out $W/lay/dive-t-$w
      done ;;
    force)
      for pair in "0.6 $T/p06-take1-x2.png p0.6" "1.2 $T/p12-take1.png p1.2" "3.25 $T/p3-take4.png p3.25"; do
        set -- $pair
        python3 $P/force.py --kind dive --width-deg $1 --repaint $2 --lay $W/lay/dive-land-$1 --t $W/lay/dive-t-$1.png --land $W/dehaze/dive-land.png --tpic $W/dehaze/dive-t.png --out $W/plate/$3
      done ;;
    bake)
      python3 $P/bake.py ;;
  esac
done
