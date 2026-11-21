set -e
W=out/work/u/sky/t
mkdir -p $W
python3 -c "
from PIL import Image
for k, s in (('full', (3520, 1980)), ('web', (1760, 990))):
    Image.new('RGB', s, (0, 0, 0)).save('public/assets/uranus/' + k + '/sky-terrain.webp', lossless=True)
"
sed -i 's/export const show = { rings: true, moons: true, deck: true }/export const show = { rings: false, moons: true, deck: true }/' src/stops/uranus/look.ts
npm run build > /dev/null
npm run still -- --frame 4290 --tier review --out $W/glow.png | tail -1
cp src/stops/uranus/sky.json $W/sky.json
cp src/stops/uranus/plan.ts $W/plan.ts
sed -i 's/"terrain": {\(.*\)"ring": \[0.5, 0.5, -1, 0\]/"terrain": {\1"ring": [0.5, 0.5, 10, 11]/' src/stops/uranus/sky.json
sed -i 's/sunRadiusDeg: 0.2, sunGlare: 0.65/sunRadiusDeg: 0.02, sunGlare: 0/' src/stops/uranus/plan.ts
sed -i 's/export const show = { rings: false, moons: true, deck: true }/export const show = { rings: false, moons: true, deck: false }/' src/stops/uranus/look.ts
npm run build > /dev/null
npm run still -- --frame 4290 --tier review --out $W/sky.png | tail -1
cp $W/sky.json src/stops/uranus/sky.json
cp $W/plan.ts src/stops/uranus/plan.ts
sed -i 's/export const show = { rings: false, moons: true, deck: false }/export const show = { rings: true, moons: true, deck: true }/' src/stops/uranus/look.ts
npm run build > /dev/null
