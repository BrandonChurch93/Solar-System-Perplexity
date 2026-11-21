import json, sys
import numpy as np, cv2

W, H = 1920, 1080
still = sys.argv[1] if len(sys.argv) > 1 else 'out/work/earth/still/t-2010.png'
f = cv2.imread(still).astype(np.float32)
a = cv2.resize(cv2.imread('references/approved/earth-close.jpg'), (f.shape[1], f.shape[0]), interpolation=cv2.INTER_AREA).astype(np.float32)
r = json.load(open('src/stops/earth/relief.json'))
g = r['ground']
s = f.shape[1] / r['imageSize'][0]
x = (np.arange(f.shape[1]) + 0.5) / s
hrow = np.polynomial.polynomial.polyval((x - g['horizonSpan'][0]) / g['horizonSpan'][1], np.array(g['horizon'])) * s
yy = np.arange(f.shape[0])[:, None] + 0.5
m = cv2.resize(cv2.imread('out/work/earth/relief/matte-t1-aligned.png', 0), (f.shape[1], f.shape[0]), interpolation=cv2.INTER_AREA) > 127
low = lambda v: cv2.GaussianBlur(v, (0, 0), 6)
d = f - a
dl = low(f) - low(a)
regions = {
    'sky': yy < hrow[None, :] - 40 * s,
    'limb': np.abs(yy - hrow[None, :]) <= 40 * s,
    'sea and land': (yy > hrow[None, :] + 40 * s) & ~m,
    'towers': m,
}
print('film minus approved close image, code values, frame', still)
print('| region | b | g | r | abs | abs low |')
for k, w in regions.items():
    print('| %s | %+.2f | %+.2f | %+.2f | %.2f | %.2f |' % (k, *d[w].mean(0), np.abs(d[w]).mean(), np.abs(dl[w]).mean()))
