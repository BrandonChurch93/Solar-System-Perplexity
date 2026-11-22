#!/bin/bash
# usage: rt.sh stills|sheets|bytes ARGS...   syncs the sources into a second tree and renders there, so the sources here can change while a chain runs
R="$(cd "$(dirname "$0")/../.." && pwd)"
W=${RT:-/tmp/base}
K=$1; shift
rsync -a --delete "$R/src" "$R/config" "$R/assets-src" "$R/tools" "$R/public" "$R/tests" "$W/"
cp "$R/index.html" "$R/package.json" "$R/vite.config.ts" "$R/tsconfig.json" "$W/"
(cd "$W" && bash assets-src/travel/$K.sh "$@")
if [ "$K" != bytes ]; then
  L=$2
  mkdir -p "$R/out/work/travel/$L"
  for F in "$W"/out/work/travel/$L/*.png; do
    [ "$F" -nt "$R/out/work/travel/$L/$(basename "$F")" ] || continue
    cp "$F" "$R/out/work/travel/$L/"
    (cd "$R" && npm run -s looks -- --add "out/work/travel/$L/$(basename "$F")" --stop travel --label "$L: $(basename "$F" .png)" > /dev/null)
  done
fi
echo RTDONE
