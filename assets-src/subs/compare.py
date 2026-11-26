#!/usr/bin/env python3
"""compare.py OFF ON T [OUT]: the page's frame with the layer (ON) beside subs.py's own picture over the frame without it (OFF) at film time T.
Prints the mean absolute difference of 255 inside the layer's band and where it lies; writes a side by side picture to OUT."""
import json, os, sys
import numpy as np, cv2
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import subs
subs.FONT = HERE + '/Lato-Medium.ttf'
off, on, t = sys.argv[1], sys.argv[2], float(sys.argv[3]); out = sys.argv[4] if len(sys.argv) > 4 else None
cues = json.load(open(ROOT + '/src/subs/cues.json'))
a = np.asarray(Image.open(off).convert('RGB')).copy(); b = np.asarray(Image.open(on).convert('RGB'))
Ht, Wd = a.shape[:2]
R = subs.Renderer(cues, Wd, Ht); L = R.L
outside = int(np.abs(a.astype(int) - b.astype(int))[:L.y0].max()) if L.y0 > 0 else 0
r = R.layer(t, parts=True)
ref = a.copy()
if os.environ.get('NODITHER'):
    P, A, At = r
    band = ref[L.y0:L.y1].astype(np.float32) / 255.0
    ref[L.y0:L.y1] = np.clip((band * (1 - A[..., None]) + P) * 255.0 + 0.5, 0, 255).astype(np.uint8)
else:
    R.over(ref, t, int(round(t * 30)))
d = np.abs(ref.astype(int) - b.astype(int))[L.y0:L.y1]
print('%s at %.3f s, %d x %d, band rows %d to %d' % (os.path.basename(on), t, Wd, Ht, L.y0, L.y1))
print('  outside the band the largest difference of the page from its own frame without the layer: %d' % outside)
print('  inside the band: mean abs %.4f of 255, largest %d, share of pixels over 2: %.4f percent, over 8: %.4f percent' % (d.mean(), d.max(), 100 * (d.max(2) > 2).mean(), 100 * (d.max(2) > 8).mean()))
if r is not None:
    P, A, At = r
    k = int(max(1, round(0.06 * L.em)))
    near = cv2.dilate((At > 0.02).astype(np.uint8), np.ones((2 * k + 1, 2 * k + 1), np.uint8)) > 0
    hz = (A > 0.004) & ~near
    print('  at the letters (%.2f percent of the band): mean abs %.4f, largest %d' % (100 * near.mean(), d[near].mean(), d[near].max()))
    print('  in the haze away from the letters (%.2f percent): mean abs %.4f, largest %d' % (100 * hz.mean(), d[hz].mean(), d[hz].max()))
    rest = ~(A > 0.004) & ~near
    if rest.any():
        print('  where the layer is clear (%.2f percent): mean abs %.4f, largest %d' % (100 * rest.mean(), d[rest].mean(), d[rest].max()))
if out:
    gap = np.full((8, Wd, 3), 255, np.uint8)
    dv = np.clip(d * 16, 0, 255).astype(np.uint8)
    sheet = np.vstack([b[L.y0:L.y1], gap, ref[L.y0:L.y1], gap, dv])
    Image.fromarray(sheet).save(out)
    print('  wrote', out, '(top the page, middle subs.py, bottom the difference times 16)')
