import sys, hashlib, numpy as np
from PIL import Image
L = np.array([0.2126, 0.7152, 0.0722])
def ld(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.float64)
def low(a):
    lo = a[600:1080]; g = lo[..., 1]; l = lo @ L
    return 'low meanG %.1f medG %.1f p5 %.1f p95 %.1f rms %.1f' % (g.mean(), np.median(g), np.percentile(l, 5), np.percentile(l, 95), l.std())
ref = ld(sys.argv[1])
print(sys.argv[1], hashlib.sha256(open(sys.argv[1], 'rb').read()).hexdigest()[:16], 'meanRGB %.1f %.1f %.1f' % tuple(ref.reshape(-1, 3).mean(0)), low(ref))
for p in sys.argv[2:]:
    b = ld(p); d = np.abs(ref - b); m = d.max(axis=2)
    ys, xs = np.nonzero(m > 1)
    box = ('x %d to %d, y %d to %d' % (xs.min(), xs.max(), ys.min(), ys.max())) if len(xs) else 'none'
    print(p, hashlib.sha256(open(p, 'rb').read()).hexdigest()[:16], 'mad %.4f over1 %d over4 %d over10 %d max %d box %s' % (d.mean(), (m > 1).sum(), (m > 4).sum(), (m > 10).sum(), m.max(), box), 'meanRGB %.1f %.1f %.1f' % tuple(b.reshape(-1, 3).mean(0)), low(b))
