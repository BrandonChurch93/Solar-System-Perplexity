#!/bin/sh
# Renders the two stills light.py needs: the globe side of a frame with the place picture off and every level of
# src/stops/mars/levels.json filled with one flat value. Puts the level files back afterwards from a copy.
#   sh assets-src/mars/place/flat.sh 2454 out/work/place/cal
set -e
FRAME=$1
OUT=$2
FULL=public/assets/mars/full
KEEP=out/work/place/keep-levels
mkdir -p "$OUT" "$KEEP"
FILES=$(python3 -c "import json; print(' '.join(l['file'] for l in json.load(open('src/stops/mars/levels.json'))['levels']))")
for f in $FILES; do cp "$FULL/$f" "$KEEP/$f"; done
for v in 77 179; do
  python3 -c "
import cv2, numpy as np, sys
for f in sys.argv[1:]:
    cv2.imwrite('$FULL/' + f, np.full((256, 256, 3), $v, np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 100])
" $FILES
  npm run -s still -- --frame "$FRAME" --tier draft --diag "ungraded/side=orbit/noplace" --out "$OUT/flat-$v.png"
done
for f in $FILES; do cp "$KEEP/$f" "$FULL/$f"; done
