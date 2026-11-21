#!/bin/bash
# [AIM="along, tilt, lift"] live.sh NAME SCALE [format] [tier] [diag]: the film's own shared sky at the terrain aim, frame 4860, terrain group hidden, terrain patch off, field of view widened by SCALE
cd "$(dirname "$0")/../../.."
name=$1; scale=$2; format=${3:-uhd}; tier=${4:-review}; diag=${5:-ungraded}
S=src/stops/neptune
cp $S/set.ts /tmp/nep-set.bak; cp $S/plan.ts /tmp/nep-plan.bak
wide=$(python3 -c "import math; print(round(2*math.degrees(math.atan(math.tan(math.radians(15))*$scale)),5))")
sed -i "s/terrain: { vfov: 30,/terrain: { vfov: $wide,/" $S/plan.ts
[ -n "$AIM" ] && sed -i -E "s/terrain: \[[-0-9., ]+\] \}/terrain: [$AIM] }/" $S/plan.ts
sed -i "s/terrain.visible = !inOrbit/terrain.visible = false/" $S/set.ts
sed -i "s/for (const \[view, def\] of Object.entries(skyJson)) {/for (const [view, def] of Object.entries(skyJson)) {\n    if (view === 'terrain') continue/" $S/set.ts
npm run -s still -- --frame 4860 --tier $tier --format $format --diag $diag --out out/work/nep/r3/$name.png 2>&1 | tail -1
cp /tmp/nep-set.bak $S/set.ts; cp /tmp/nep-plan.bak $S/plan.ts
git diff --stat -- $S/set.ts $S/plan.ts
echo wide $wide DONE
