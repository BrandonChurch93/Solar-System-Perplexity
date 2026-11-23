#!/bin/sh
# From the takes to the baked pyramid, one step at a time (two jobs of 4096 px at once do not fit the machine).
#   sh assets-src/mars/place/plates.sh [lay] [force] [bake]
# lay: the land of dehaze.py laid back at the plate widths.
# force: the 8.5 deg plate is its top down take, tone matched at its rim to the old land (it is not held: the twin
#        sees it only along the ground). Then for every plate from 3.8 deg down: its base (the plate above, cropped,
#        with the take nested), held to the picture.
# bake: bake.py.
set -e
W=out/work/place
P=assets-src/mars/place
T=${TAKES:-$P/takes}
held() {
  python3 $P/force.py --kind dive --width-deg $1 --repaint $W/plate/base-$1.png --lay $W/lay/dive-land-$1 --t $W/lay/dive-t-$1.png --land $W/dehaze/dive-land.png --tpic $W/dehaze/dive-t.png --out $W/plate/p$1
}
for step in "$@"; do
  case $step in
    lay)
      python3 $P/dehaze.py --kind dive --out $W/dehaze/dive
      for w in 3.8 1.6 0.7 0.3; do
        python3 $P/layback.py --kind dive --width-deg $w --size 4096 --image $W/dehaze/dive-land.png --out $W/lay/dive-land-$w
        python3 $P/layback.py --kind dive --width-deg $w --size 4096 --image $W/dehaze/dive-t.png --out $W/lay/dive-t-$w
      done ;;
    force)
      python3 $P/bake.py --toned 8.5,$W/plate/toned-8.5.png
      python3 $P/nestbase.py --above $W/plate/toned-8.5.png,8.5 --width-deg 8.5 --below $T/p85-take1-x2.png,8.5 --out $W/plate/p8.5.png
      python3 $P/nestbase.py --above $W/plate/p8.5.png,8.5 --width-deg 3.8 --below $T/p38-take5-x2.png,3.8 --out $W/plate/base-3.8.png
      held 3.8
      python3 $P/nestbase.py --above $W/plate/p3.8.png,3.8 --width-deg 1.6 --below $T/p12-take1.png,1.2 --out $W/plate/base-1.6.png
      held 1.6
      python3 $P/nestbase.py --above $W/plate/p1.6.png,1.6 --width-deg 0.7 --below $T/p06-take1-x2.png,0.6 --out $W/plate/base-0.7.png
      held 0.7
      python3 $P/nestbase.py --above $W/plate/p0.7.png,0.7 --width-deg 0.3 --out $W/plate/base-0.3.png
      held 0.3 ;;
    bake)
      python3 $P/bake.py ;;
  esac
done
