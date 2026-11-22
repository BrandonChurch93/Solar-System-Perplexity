#!/bin/bash
cd "$(git rev-parse --show-toplevel)"
git checkout 7c765a6e -- src/stops/sun public/assets/sun
git show c63a012:public/assets/sun/full/apron.jpg > public/assets/sun/full/apron.jpg
cp out/work/sun/apron.base.json src/stops/sun/apron.json
sed -i 's/  boil: { reach: 0.25, period: 4.2/  boil: { reach: 0, period: 4.2/; s/  twinkle: { amount: 0.3, rate/  twinkle: { amount: 0, rate/' src/stops/sun/look.ts
grep -c "reach: 0, period: 4.2\|twinkle: { amount: 0, rate" src/stops/sun/look.ts
while [ -n "$1" ]; do
  cp "$2" public/assets/sun/full/plate.jpg
  npx tsx out/work/sun/frames.ts --frames 0 --dir out/work/sun/cn/$1 --tier draft --format uhd --diag nograin
  echo $1 $(sha256sum out/work/sun/cn/$1/f00000.png | cut -c1-16)
  shift 2
done
git checkout HEAD -- src/stops/sun public/assets/sun
git status --short -- src public | head
