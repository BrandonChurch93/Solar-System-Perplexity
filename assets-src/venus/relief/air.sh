set -e
cp src/stops/venus/plan.ts out/work/venus/plan.keep
cp src/stops/venus/look.ts out/work/venus/look.keep
cp src/stops/venus/sky.json out/work/venus/sky.keep
sed -i 's/"gain": 10, "add": false, "ring": \[0.5, 0.5, -1, 0\]}}/"gain": 0, "add": false, "ring": [0.5, 0.5, -1, 0]}}/' src/stops/venus/sky.json
sed -i 's/terrainSkyGlow: [0-9.]*/terrainSkyGlow: 0/' src/stops/venus/plan.ts
sed -i 's/\] as \[number, number, number\], gain: 1 },/] as [number, number, number], gain: 0 },/' src/stops/venus/look.ts
npm run build > /dev/null
npm run still -- --frame 1440 --tier review --diag nograin --out out/work/venus/relief/base.png | tail -1
cp out/work/venus/plan.keep src/stops/venus/plan.ts
cp out/work/venus/look.keep src/stops/venus/look.ts
cp out/work/venus/sky.keep src/stops/venus/sky.json
python3 assets-src/venus/relief/air.py out/work/venus/relief/base.png $1
npm run build > /dev/null
