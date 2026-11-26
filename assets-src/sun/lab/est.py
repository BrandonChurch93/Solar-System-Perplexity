"""A quick reading of the change of the pattern between two stills, in the way of tools/img/smooth.py (one direct flow
in place of the chain of flows, the lower 55 percent of the picture in place of the body). Not the judged number.
  python3 assets-src/sun/lab/est.py A.png B.png [OUT.jpg]"""
import sys
sys.path.insert(0, 'tools/img')
import numpy as np
import cv2
import smooth as S

a = S.small(S.grey(sys.argv[1]), 0.25)
b = S.small(S.grey(sys.argv[2]), 0.25)
f = S.motion(a, b)
g = S.motion(b, a)
xs, ys = S.places(a.shape)
mx, my, inside, sure = S.along(f, g, xs, ys)
moved = cv2.remap(b.astype(np.float32), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
ok = inside & sure
ok[: int(a.shape[0] * 0.45)] = False
p = S.pattern(a, moved, ok, 2.0, 10.0, 1.0)
v = p[np.isfinite(p)]
print('pattern 99th %.3f  95th %.3f  median %.3f  share judged %.2f  flow px %.1f' % (np.percentile(v, 99), np.percentile(v, 95), np.median(v), np.isfinite(p).mean(), np.hypot(f[..., 0], f[..., 1]).mean() * 4))
if len(sys.argv) > 3:
    q = np.nan_to_num(p, nan=0.0)
    cv2.imwrite(sys.argv[3], np.hstack([a, moved, np.clip(q * 255, 0, 255)]).astype(np.uint8))
