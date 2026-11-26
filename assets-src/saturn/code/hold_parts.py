# hold_parts.py LENS.json IMG...: frame 3465 against the approved hero, the mean absolute level (RGB, display values 0 to
# 255) of the whole frame and by part. The parts are cut by the true body through the frame's own lens (rings as true
# circles, the globe as the spheroid): a part's line is its mean over its own pixels and, in brackets, what it adds to
# the whole frame's number (mean times its share of the frame).
import sys, json, os, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..')); sys.path.insert(0, HERE)
import ring_edges as e4
import globe_edges as g4
L = json.load(open(sys.argv[1])); s = L['frames']['3465']; pol = L['polar']; sun = np.array(L['sunL']); sun /= np.linalg.norm(sun)
ref = np.asarray(Image.open(os.path.join(ROOT, 'references', 'approved', 'saturn-hero.png')).convert('RGB').resize((1920, 1080), Image.LANCZOS)).astype(float)
ys, xs = np.mgrid[0:1080, 0:1920]; d = g4.rays(s, xs + 0.5, ys + 0.5); e = np.array(s['eye'])
h, t = g4.hit(e[None, :], d, pol)
with np.errstate(divide='ignore', invalid='ignore'):
    tp = np.where(np.abs(d[:, 1]) > 1e-9, -e[1] / d[:, 1], -1.0)
p = e + d * tp[:, None]; r = np.hypot(p[:, 0], p[:, 2]); ring = (tp > 0) & (r > 1.2458) & (r < 2.45)
front = ring & (~h | (tp < t)); globe = h & ~front
P = e + d * np.where(h, t, 0)[:, None]; n = P * np.array([1, 1 / (pol * pol), 1]); n /= np.maximum(np.linalg.norm(n, axis=-1), 1e-9)[:, None]; ndl = (n * sun).sum(-1)
shade = e4.blocked(p, np.tile(sun, (len(p), 1)), pol)[0]
parts = [('globe, day (cosine to the Sun over 0.15)', globe & (ndl > 0.15)), ('globe, twilight and night', globe & (ndl <= 0.15)),
         ('rings before the globe', front & h), ('rings in the globe shadow', front & ~h & shade)]
for a, b in [(1.2458, 1.53), (1.53, 1.95), (1.95, 2.03), (2.03, 2.27), (2.27, 2.45)]:
    parts.append(('rings %.2f to %.2f, lit' % (a, b), front & ~h & ~shade & (r >= a) & (r < b)))
used = np.zeros(len(d), bool)
for _n, m in parts: used |= m
parts.append(('sky', ~used))
imgs = [np.asarray(Image.open(f).convert('RGB')).astype(float) for f in sys.argv[2:]]
D = [np.abs(im - ref).mean(-1).reshape(-1) for im in imgs]
print('%-44s share' % 'part' + ''.join('  %22s' % ('picture %d' % (i + 1)) for i in range(len(imgs))))
print('%-44s 1.000' % 'whole frame' + ''.join('  %22.4f' % x.mean() for x in D))
for name, m in parts:
    sh = m.mean()
    print('%-44s %.3f' % (name, sh) + ''.join('  %10.3f (%8.4f)' % (x[m].mean() if m.any() else 0, x[m].sum() / len(x)) for x in D))
