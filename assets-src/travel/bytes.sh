#!/bin/bash
# usage: bytes.sh LABEL [frames...]   draft stills of the frames no travel change may touch, with their hashes
cd "$(dirname "$0")/../.."
L=$1; shift
F="$@"
[ -z "$F" ] && F="2325 2427 2580 2726 90 360 615 870 1185 1440 1755 2010 2895 3150 3465 3720 4035 4290 4605 4860 5235 5360"
mkdir -p out/work/travel/$L
for N in $F; do
  npm run -s still -- --frame $N --tier draft --out out/work/travel/$L/f$N.png > /dev/null 2>&1
  echo "$N $(sha256sum out/work/travel/$L/f$N.png | cut -c1-16)"
done
echo BYTESDONE
