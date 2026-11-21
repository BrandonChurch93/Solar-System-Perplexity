#!/bin/bash
# usage: stills.sh TIER LABEL frames...
cd "$(dirname "$0")/../.."
T=$1; L=$2; shift 2
mkdir -p out/work/travel/$L
for N in "$@"; do
  npm run -s still -- --frame $N --tier $T --out out/work/travel/$L/f$N-$T.png
  npm run -s looks -- --add out/work/travel/$L/f$N-$T.png --stop travel --label "$L: frame $N, $T tier" > /dev/null
done
echo STILLSDONE
