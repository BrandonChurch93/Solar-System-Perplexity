set -e
sed -i 's/margin: 0.125, gain: 1 }/margin: 0.125, gain: 0 }/' src/stops/sun/look.ts
npm run build > /dev/null
npm run still -- --frame 360 --tier review | tail -1
cp out/work/stills/f00360-16x9-review-full.png out/work/sun/halo-only.png
sed -i 's/margin: 0.125, gain: 0 }/margin: 0.125, gain: 1 }/' src/stops/sun/look.ts
PYTHONPATH=assets-src/sun/orbit python3 assets-src/sun/orbit/sky.py hold references/approved/sun-hero.png out/work/sun/sky-fill-take1.png out/work/sun/halo-only.png public/assets/sun
npm run build > /dev/null
