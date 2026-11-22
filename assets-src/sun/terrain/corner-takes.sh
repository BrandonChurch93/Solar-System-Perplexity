#!/bin/bash
cd "$(git rev-parse --show-toplevel)"
export PYTHONPATH=assets-src/sun/terrain
D=out/work/sun/detail
for T in A-9 A-8; do
  python3 assets-src/sun/terrain/detail.py apron-place $D/apron-take-$T.png
  cp $D/apron-place.json $D/apron-place-$T.json
  python3 assets-src/sun/terrain/corner.py apron-crop $T
  python3 tools/ml/upscale.py --in $D/apron-take-corner-$T.png --out $D/apron-take-corner-x2-$T.png --width 2564
  python3 assets-src/sun/terrain/corner.py apron-paste $T
done
