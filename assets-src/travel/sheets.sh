#!/bin/bash
# usage: sheets.sh TIER LABEL seg1 seg2 ...
cd "$(dirname "$0")/../.."
T=$1; L=$2; shift 2
mkdir -p out/work/travel/$L
for S in "$@"; do
  npm run -s sheet -- --segment $S --tier $T
  cp out/work/sheets/$S-16x9-$T.png out/work/travel/$L/$S-$T.png 2>/dev/null
  npm run -s looks -- --add out/work/travel/$L/$S-$T.png --stop travel --label "$L: contact sheet $S, $T tier"
done
echo SHEETSDONE
