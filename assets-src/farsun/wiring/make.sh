#!/bin/sh
# Writes one patch per owner with the far Sun's lines in their files, against BASE (the commit of main last merged into agent/farsun).
set -e
BASE=${1:-65fb91d8}
cd "$(git rev-parse --show-toplevel)"
out=assets-src/farsun/wiring
{
  cat "$out/travel.txt"
  git diff "$BASE" -- src/core/types.ts src/director/film.ts src/space/sky.ts
} > "$out/travel.patch"
{
  cat "$out/sun.txt"
  git diff "$BASE" -- src/stops/sun/set.ts
} > "$out/sun.patch"
{
  cat "$out/mercury.txt"
  git diff "$BASE" -- src/stops/mercury/set.ts
} > "$out/mercury.patch"
