set -e
mkdir -p out/work/u/sky/real
cp public/assets/uranus/full/sky-hold.webp out/work/u/sky/real/full-sky-hold.webp
python3 -c "
from PIL import Image
im = Image.open('public/assets/uranus/full/sky-hold.webp')
Image.new('RGB', im.size, (0, 0, 0)).save('public/assets/uranus/full/sky-hold.webp', lossless=True)
"
sed -i 's/export const show = { rings: true, moons: true }/export const show = { rings: false, moons: false }/' src/stops/uranus/look.ts
npm run build > /dev/null
npm run still -- --frame 4035 --tier review --out out/work/u/sky/glow.png | tail -1
sed -i 's/export const show = { rings: false, moons: false }/export const show = { rings: true, moons: true }/' src/stops/uranus/look.ts
cp out/work/u/sky/real/full-sky-hold.webp public/assets/uranus/full/sky-hold.webp
npm run build > /dev/null
