#!/bin/bash
# usage: rt.sh LABEL TIER frames...   syncs the sources into a second tree and renders stills there, so the sources here can change while a chain runs
R="$(cd "$(dirname "$0")/../.." && pwd)"
W=${RT:-/tmp/work}
L=$1; T=$2; shift; shift
mkdir -p "$W"
rsync -a --delete --exclude /.git --exclude /out/work --exclude /dist "$R/" "$W/"
mkdir -p "$R/out/work/ending/$L"
cd "$W"
for N in "$@"; do
  npm run -s still -- --frame $N --tier $T --out "$R/out/work/ending/$L/f$N-$T.png" 2>&1 | tail -1
done
echo RTDONE
