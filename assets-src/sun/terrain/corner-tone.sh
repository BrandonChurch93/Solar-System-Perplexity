#!/bin/bash
cd "$(git rev-parse --show-toplevel)"
export PYTHONPATH=assets-src/sun/terrain
npx tsx out/work/sun/frames.ts --frames 90 --dir out/work/sun/cn/$2 --tier draft --diag nograin
python3 assets-src/sun/terrain/detail.py apron-tone out/work/sun/cn/$2/f00090.png
python3 assets-src/sun/terrain/detail.py apron-build out/work/sun/cn/apron-$1-full.jpg out/work/sun/cn/apron-$1-web.jpg out/work/sun/cn/apron-$1-check.jpg
cp out/work/sun/cn/apron-$1-full.jpg public/assets/sun/full/apron.jpg
cp out/work/sun/cn/apron-$1-web.jpg public/assets/sun/web/apron.jpg
