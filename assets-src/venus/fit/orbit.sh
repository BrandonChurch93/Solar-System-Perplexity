set -e
W=out/work/venus
gain() { python3 -c "
import json,sys
f,k,g=sys.argv[1],sys.argv[2],float(sys.argv[3])
j=json.load(open(f)); j[k]['gain']=g; json.dump(j,open(f,'w'))" "$1" "$2" "$3"; }
shot() { npm run build 2>&1 | grep -iE "error" || true; npm run still -- --frame 1185 --tier review --diag "$1" --out "$2" 2>&1 | tail -1; }
gain src/stops/venus/haze.json limb 0
gain src/stops/venus/sky.json orbit 0
shot nograin $W/nolimb.png
shot layers $W/layers.png
python3 assets-src/venus/fit/limb.py build $W/nolimb.png $W/layers.png | head -2
gain src/stops/venus/haze.json limb 1
shot nograin $W/limb1.png
python3 assets-src/venus/fit/limb.py refine $W/limb1.png 0.8 | grep residual
shot nograin $W/limb2.png
python3 assets-src/venus/fit/limb.py refine $W/limb2.png 0.6 | grep residual
shot nograin $W/halo-only.png
python3 assets-src/venus/fit/limb.py refine $W/halo-only.png 0 | grep residual
python3 assets-src/venus/sky/patch.py hold references/approved/venus-hero.png $W/sky-fill-sd.png $W/halo-only.png public/assets/venus $W/sky-ext-sd.png
gain src/stops/venus/sky.json orbit ${1:-2.5}
npm run build 2>&1 | grep -iE "error" || true
