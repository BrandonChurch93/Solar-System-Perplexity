import json
import sys
import numpy as np
from PIL import Image

data = json.loads(sys.stdin.read())
withdir, baredir = sys.argv[1:3]
frames = data['frames']
diff = []
for f in frames:
    a = np.asarray(Image.open('%s/f%05d-final.png' % (withdir, f)).convert('RGB')).astype(float)
    n = np.asarray(Image.open('%s/f%05d-final.png' % (baredir, f)).convert('RGB')).astype(float)
    diff.append((a - n).max(axis=2))
print('grains followed:', len(data['grains']), 'frames', frames[0], 'to', frames[-1])
steps = []
gone = 0
for g in data['grains']:
    seen = []
    for k, (x, y, nominal, length) in enumerate(g['path']):
        xi, yi = int(round(x - 0.5)), int(round(y - 0.5))
        box = diff[k][max(yi - 2, 0):yi + 3, max(xi - 2, 0):xi + 3]
        seen.append(int(box.max()) if box.size else 0)
    gone += sum(1 for v in seen if v == 0)
    steps += [abs(b - a) for a, b in zip(seen, seen[1:])]
    drift = np.hypot(g['path'][-1][0] - g['path'][0][0], g['path'][-1][1] - g['path'][0][1])
    print('  grain %5d  measured level per frame %s  nominal %.1f to %.1f  moved %.0f px in the frame' % (g['i'], seen, min(p[2] for p in g['path']), max(p[2] for p in g['path']), drift))
print('frames in which a followed grain is absent:', gone, ' largest change of level between two frames:', max(steps, default=0), ' mean change:', round(float(np.mean(steps)), 2) if steps else 0)
