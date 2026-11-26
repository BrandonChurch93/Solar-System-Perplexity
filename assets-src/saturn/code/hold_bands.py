# hold_bands.py LABEL=IMG...: frame 3465 against the approved hero by band of width, and with the frame registered to the
# hero by the best shift and scale of the whole frame.
#   The hero: references/approved/saturn-hero.png, brought to 1920 x 1080 by a Lanczos filter, 8 bit. Levels are display
#   values 0 to 255.
#   PLAIN: the mean absolute difference over the frame and the three channels.
#   LOW BAND s: the same after both pictures are blurred by a Gaussian of s px (s = 1, 2, 4, 8, 16, 32, 64).
#   BAND a to b: luminance (0.2126, 0.7152, 0.0722), the root mean square of the difference of the blurs of a and b px
#   (0 is the picture itself), as a share of the hero's own in that band: 1 is as much structure as the hero has.
#   REGISTERED: the picture is scaled by S about the middle of the frame and moved by (DX, DY) px (right and down
#   positive), bilinear; S, DX and DY are those that make PLAIN least (searched at half size from nine starts, then at
#   full size). Pixels that would come from outside the picture are left out of the mean; their share is printed.
import sys, os, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
from PIL import Image
from scipy.ndimage import gaussian_filter, affine_transform
from scipy.optimize import minimize
SIG = [1, 2, 4, 8, 16, 32, 64]
LUM = np.array([0.2126, 0.7152, 0.0722])
hero = Image.open(os.path.join(ROOT, 'references', 'approved', 'saturn-hero.png')).convert('RGB').resize((1920, 1080), Image.LANCZOS)
ref = np.asarray(hero).astype(np.float32)
def blur(a, s): return gaussian_filter(a, (s, s, 0) if a.ndim == 3 else s, mode='nearest')
def ladder(lum): return [lum] + [blur(lum, s) for s in SIG]
refL = ladder(ref @ LUM.astype(np.float32)); refB = [blur(ref, s) for s in SIG]
refR = [float(np.sqrt(((refL[i] - refL[i + 1]) ** 2).mean())) for i in range(len(SIG))]
def warp(im, dx, dy, s):
    h, w = im.shape[:2]; cy, cx = (h - 1) / 2, (w - 1) / 2
    off = [cy - (cy + dy) / s, cx - (cx + dx) / s] + ([0] if im.ndim == 3 else [])
    return affine_transform(im, [1 / s, 1 / s] + ([1] if im.ndim == 3 else []), offset=off, order=1, mode='nearest')
def inside(shape, dx, dy, s):
    h, w = shape[:2]; cy, cx = (h - 1) / 2, (w - 1) / 2
    ys = (np.arange(h) - cy - dy) / s + cy; xs = (np.arange(w) - cx - dx) / s + cx
    return ((ys >= 0) & (ys <= h - 1))[:, None] & ((xs >= 0) & (xs <= w - 1))[None, :]
def cost(p, im, rf, unit):
    dx, dy, s = p[0] * unit, p[1] * unit, 1 + p[2] * 0.01
    m = inside(im.shape, dx, dy, s)
    if m.mean() < 0.8: return 1e3
    return float(np.abs(warp(im, dx, dy, s) - rf)[m].mean())
def half(a): return a.reshape(540, 2, 960, 2, 3).mean(axis=(1, 3))
print('hero bands, root mean square of luminance: ' + ' '.join('%.3f' % v for v in refR))
for item in sys.argv[1:]:
    lab, path = item.split('=', 1)
    im = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    print('== %s (%s)' % (lab, path))
    print('plain %.4f' % np.abs(im - ref).mean())
    print('low band, Gaussian of 1, 2, 4, 8, 16, 32, 64 px: ' + ' '.join('%.4f' % np.abs(blur(im, s) - refB[i]).mean() for i, s in enumerate(SIG)))
    L = ladder(im @ LUM.astype(np.float32))
    print('bands 0 to 1, 1 to 2, 2 to 4, 4 to 8, 8 to 16, 16 to 32, 32 to 64 px, share of the hero: ' + ' '.join('%.3f' % (np.sqrt(((L[i] - L[i + 1]) ** 2).mean()) / refR[i]) for i in range(len(SIG))))
    ih, rh = half(im), half(ref); best = None
    for sx in (-8, 0, 8):
        for sy in (-8, 0, 8):
            r = minimize(cost, [sx, sy, 0], args=(ih, rh, 1.0), method='Nelder-Mead', options={'xatol': 0.02, 'fatol': 1e-4, 'maxiter': 300, 'initial_simplex': [[sx, sy, 0], [sx + 3, sy, 0], [sx, sy + 3, 0], [sx, sy, 0.5]]})
            if best is None or r.fun < best.fun: best = r
    p0 = [best.x[0] * 2, best.x[1] * 2, best.x[2]]
    r = minimize(cost, p0, args=(im, ref, 1.0), method='Nelder-Mead', options={'xatol': 0.01, 'fatol': 1e-5, 'maxiter': 400, 'initial_simplex': [p0, [p0[0] + 1, p0[1], p0[2]], [p0[0], p0[1] + 1, p0[2]], [p0[0], p0[1], p0[2] + 0.1]]})
    dx, dy, s = r.x[0], r.x[1], 1 + r.x[2] * 0.01; m = inside(im.shape, dx, dy, s)
    print('registered: plain %.4f at shift %+.2f px right, %+.2f px down, scale %.5f; left out %.2f percent of the frame; the same mask without the move %.4f' % (r.fun, dx, dy, s, 100 * (1 - m.mean()), np.abs(im - ref)[m].mean()))
    w = warp(im, dx, dy, s)
    print('registered, low band of 1, 2, 4, 8, 16, 32, 64 px: ' + ' '.join('%.4f' % np.abs(blur(w, sg) - refB[i])[m].mean() for i, sg in enumerate(SIG)))
    Image.fromarray(np.clip(w + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(os.environ.get('OUT', '.'), 'reg_%s.png' % lab.replace(' ', '_')))
