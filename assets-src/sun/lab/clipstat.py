"""A proxy for the life of the ground on a folder of capture frames (two a film frame), in the way of
tools/img/smooth.py pattern(): the change of the pattern from each picture to the one 8 film frames later (16 capture
frames, one direct flow, quarter size, detail between 8 and 40 px of the full picture, the lower 55 percent of the
picture as the body), its 99th percentile, and the same from each picture to the next. Not the judged reader.
  python3 assets-src/sun/lab/clipstat.py FOLDER [REACH]"""
import sys, glob
sys.path.insert(0, 'tools/img')
import numpy as np
import cv2
import smooth as S

files = sorted(glob.glob(sys.argv[1] + '/k*.png'))
reach = int(sys.argv[2]) if len(sys.argv) > 2 else 16
g = [S.small(S.grey(f), 0.25) for f in files]


def read(a, b):
    f = S.motion(a, b)
    w = S.motion(b, a)
    xs, ys = S.places(a.shape)
    mx, my, inside, sure = S.along(f, w, xs, ys)
    moved = cv2.remap(b.astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    ok = inside & sure
    ok[: int(a.shape[0] * 0.45)] = False
    p = S.pattern(a, moved, ok, 2.0, 10.0, 1.0)
    v = p[np.isfinite(p)]
    return float(np.percentile(v, 99)), float(np.median(v))


far = [read(g[i], g[i + reach]) for i in range(0, len(g) - reach)]
step = [read(g[i], g[i + 1]) for i in range(0, len(g) - 1)]
name = lambda i: files[i].split('/')[-1]
i = int(np.argmax([x[0] for x in far]))
j = int(np.argmax([x[0] for x in step]))
print('pictures %d' % len(g))
print('pattern over %d capture frames: largest 99th percentile %.3f at %s, mean of the 99th %.3f, mean of the medians %.3f' % (reach, far[i][0], name(i), np.mean([x[0] for x in far]), np.mean([x[1] for x in far])))
print('pattern from a picture to the next: largest 99th percentile %.3f at %s, mean of the 99th %.3f' % (step[j][0], name(j), np.mean([x[0] for x in step])))
