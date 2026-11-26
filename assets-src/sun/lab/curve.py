# Fits heat.curve of src/stops/sun/lab/lab.json: the one curve from heat to the heat the ramp shows, so that the
# percentiles 5 25 50 75 95 99 of the largest channel of the near ground of frame 90 come to the approved's.
# The ramp (src/stops/sun/convect.json) gives the display value of a heat; the curve in force is read from lab.json.
#   python3 assets-src/sun/lab/curve.py 0.224 0.353 0.569 0.753 0.949 1.0   (the six of the render, as pair.py prints)
# LAB_TAIL in the environment (1 if not set) scales the slope of the curve past the 99th percentile: under 1 the
# hottest places stay gold longer.
import json, os, sys
import numpy as np

lab = json.load(open('src/stops/sun/lab/lab.json'))
ramp = json.load(open('src/stops/sun/convect.json'))
lv = [0.0] + ramp['ramp']['levels'] + [1.0]
rd = [0.0] + [s[0] for s in ramp['ramp']['stops']] + [ramp['tone']['white'][0]]
want = [0.231, 0.404, 0.58, 0.761, 0.906, 0.965]
got = [float(v) for v in sys.argv[1:7]]
old = np.array(lab['heat']['curve'], dtype=float)
knots = [[0.0, 0.0]]
for g, w in zip(got, want):
    shown = np.interp(min(g, 0.995), rd, lv)
    heat = np.interp(shown, old[:, 1], old[:, 0])
    to = np.interp(w, rd, lv)
    if heat > knots[-1][0] + 0.01 and to > knots[-1][1]:
        knots.append([round(float(heat), 4), round(float(to), 4)])
last = knots[-1]
tail = float(os.environ.get('LAB_TAIL', '1'))
knots.append([round(last[0] + 0.3, 4), round(min(last[1] + tail * 0.3 * (1 - last[1]) / max(1.2 - last[0], 0.1), 1.0), 4)])
print(json.dumps(knots))
