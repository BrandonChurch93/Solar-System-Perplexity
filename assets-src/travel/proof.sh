#!/bin/bash
# usage: proof.sh LABEL
cd /home/user/workspace/repo
L=${1:-proof}
mkdir -p out/work/travel/$L
for N in 2325 2580 2427 2726; do
  npm run -s still -- --frame $N --tier final --out out/work/travel/$L/f$N.png
  sha256sum out/work/travel/$L/f$N.png | cut -c1-16
done
echo PROOFDONE
