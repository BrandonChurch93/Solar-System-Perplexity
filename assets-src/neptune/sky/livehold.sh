#!/bin/bash
# livehold.sh NAME SCALE [format] [tier] [diag]: the film's own shared sky at the hold aim, frame 4605, orbit group hidden, hold patch off, field of view widened by SCALE
cd "$(dirname "$0")/../../.."
name=$1; scale=$2; format=${3:-uhd}; tier=${4:-review}; diag=${5:-ungraded}
S=src/stops/neptune
cp $S/set.ts /tmp/nep-set.bak; cp $S/fit.json /tmp/nep-fit.bak
wide=$(python3 -c "import math; print(round(2*math.degrees(math.atan(math.tan(math.radians(15))*$scale)),5))")
sed -i "s/\"vfovDeg\": 30.0,/\"vfovDeg\": $wide,/" $S/fit.json
sed -i "s/orbit.visible = inOrbit \&\& state.weight > 0/orbit.visible = false/" $S/set.ts
sed -i "s/for (const \[view, def\] of Object.entries(skyJson)) {/for (const [view, def] of Object.entries(skyJson)) {\n    if (view === 'orbit') continue/" $S/set.ts
mkdir -p out/work/nep/p6
npm run -s still -- --frame 4605 --tier $tier --format $format --diag $diag --out out/work/nep/p6/$name.png 2>&1 | tail -1
cp /tmp/nep-set.bak $S/set.ts; cp /tmp/nep-fit.bak $S/fit.json
git diff --stat -- $S/set.ts $S/fit.json
echo wide $wide DONE
