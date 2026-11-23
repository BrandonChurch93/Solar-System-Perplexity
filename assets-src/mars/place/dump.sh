#!/bin/sh
# Dumps the place picture of a Mars handover at its own resolution, as 3 x 3 windows, and joins them.
# Needs the engine's dump option (src/diagnostics/probe.ts, "dump=X,Y,image|alpha").
#   sh assets-src/mars/place/dump.sh dive 2454 out/work/place/dump
#   sh assets-src/mars/place/dump.sh rise 2700 out/work/place/dump
set -e
KIND=$1
FRAME=$2
OUT=$3
mkdir -p "$OUT"
for WHAT in image alpha; do
  for X in 0 1920 2576; do
    for Y in 0 1080 1588; do
      FILE="$OUT/$KIND-$WHAT-$X-$Y.png"
      [ -f "$FILE" ] || npm run -s still -- --frame "$FRAME" --tier draft --diag "ungraded/side=orbit/dump=$X,$Y,$WHAT" --out "$FILE"
    done
  done
done
