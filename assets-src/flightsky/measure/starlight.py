import json, sys, glob
import numpy as np, cv2
from PIL import Image
D, posefile = sys.argv[1], sys.argv[2]
REF = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != '-' else None
SEL = sys.argv[4] if len(sys.argv) > 4 else None
poses = {p['k']: p for p in json.load(open(posefile))}
ks = sorted(int(p[-10:-4]) for p in glob.glob(D + '/k*.png'))
LUMA = np.array([0.2126, 0.7152, 0.0722])
def rot(q):
    x, y, z, w = q
    return np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
def load(d, k): return np.asarray(Image.open('%s/k%06d.png' % (d, k)).convert('RGB')).astype(np.float64)
rgb = {k: load(D, k) for k in ks}
H, W = rgb[ks[0]].shape[:2]
def Kmat(fov):
    f = (H / 2) / np.tan(np.radians(fov) / 2)
    return np.array([[f, 0, -(W / 2 - 0.5)], [0, -f, -(H / 2 - 0.5)], [0, 0, -1.0]])
def hom(ka, kb):
    A, B = poses[ka], poses[kb]
    return Kmat(B['fov']) @ rot(B['rel']) @ rot(A['rel']).T @ np.linalg.inv(Kmat(A['fov']))
def scene(c):
    s = c / 255
    l = np.where(s <= 0.04045, s / 12.92, ((s + 0.055) / 1.055) ** 2.4)
    y = np.clip(l, 0, 0.985)
    a, b, cc, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return ((-k - np.sqrt(np.maximum(k * k - 4 * (cc * y - a) * e * y, 0))) / (2 * (cc * y - a))) @ LUMA
lum = {k: rgb[k] @ LUMA for k in ks}
sc = {k: scene(rgb[k]) * 1000 for k in ks}
def flux(img, x, y, R):
    x0, y0 = int(round(x)), int(round(y))
    w = img[y0 - R:y0 + R + 1, x0 - R:x0 + R + 1]
    ring = img[y0 - R - 3:y0 + R + 4, x0 - R - 3:x0 + R + 4].copy()
    m = np.ones(ring.shape, bool); m[2:-2, 2:-2] = False
    v = np.sort(ring[m]); bg = v[:int(len(v) * 0.7)].mean()
    return float((w - bg).sum()), float(w.max()), float(bg)
def centroid(img, x, y, r=2):
    x0, y0 = int(round(x)), int(round(y))
    w = img[y0 - r:y0 + r + 1, x0 - r:x0 + r + 1]
    bg = np.median(img[y0 - r - 3:y0 + r + 4, x0 - r - 3:x0 + r + 4])
    w = np.clip(w - bg, 0, None); s = max(w.sum(), 1e-9)
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
    return x0 + (w * xx).sum() / s, y0 + (w * yy).sum() / s
k0 = ks[0]
if SEL:
    seeds = [(s['x'], s['y'], s['kind']) for s in json.load(open(SEL))]
else:
    a = lum[k0]
    ref = load(REF, k0) @ LUMA if REF else None
    mx = cv2.dilate(a, np.ones((13, 13), np.uint8))
    ys, xs = np.where((a == mx) & (a > 45))
    seeds = []
    for x, y in zip(xs, ys):
        if not (20 < x < W - 20 and 20 < y < H - 20): continue
        pk = a[y, x]
        if pk > 240: continue
        big = a[y - 8:y + 9, x - 8:x + 9].copy(); bg = np.median(big)
        if pk - bg < 30 or bg > 60: continue
        big[8 - 3:8 + 4, 8 - 3:8 + 4] = 0
        if big.max() - bg > 0.3 * (pk - bg): continue
        kind = 'sprite'
        if ref is not None:
            rp = ref[y - 1:y + 2, x - 1:x + 2].max() - np.median(ref[y - 8:y + 9, x - 8:x + 9])
            kind = 'sprite' if rp > 0.5 * (pk - bg) else 'band'
        seeds.append((int(x), int(y), kind))
tracks = []
for x, y, kind in seeds:
    cx, cy = centroid(lum[k0], x, y)
    t = []; ok = True
    for k in ks:
        p = hom(k0, k) @ np.array([cx, cy, 1.0]); px, py = p[0] / p[2], p[1] / p[2]
        if not (14 < px < W - 14 and 14 < py < H - 14): ok = False; break
        f5 = flux(sc[k], px, py, 2); f7 = flux(sc[k], px, py, 3); fd = flux(lum[k], px, py, 2)
        qx, qy = centroid(lum[k], px, py)
        t.append((px, py, f5[0], f7[0], fd[0], fd[1], fd[2], qx - px, qy - py))
    if not ok: continue
    t = np.array(t)
    if np.abs(t[:, 7:9]).max() > 0.9 or t[:, 2].min() <= 0: continue
    tracks.append((x, y, kind, t))
step = lambda f: np.abs(np.diff(f)).max() / f.mean()
print(D, 'frames', ks[0] / 2, 'to', ks[-1] / 2, 'in halves; stars followed through all 20 pictures:', len(tracks), {k: sum(1 for t in tracks if t[2] == k) for k in ('sprite', 'band')})
for kind in ('sprite', 'band'):
    g = sorted([t for t in tracks if t[2] == kind], key=lambda t: t[3][:, 2].mean())
    if not g: continue
    n = len(g)
    for name, part in (('faint', g[:n // 3]), ('middle', g[n // 3:2 * n // 3]), ('bright', g[2 * n // 3:])):
        if not part: continue
        s5 = np.array([step(t[3][:, 2]) for t in part]); s7 = np.array([step(t[3][:, 3]) for t in part]); sd = np.array([step(t[3][:, 4]) for t in part])
        pk = np.array([(t[3][:, 5] - t[3][:, 6]).max() / max((t[3][:, 5] - t[3][:, 6]).min(), 1) for t in part])
        print(f'  {kind} {name}: {len(part)} stars, peak above ground {np.median([np.median(t[3][:, 5] - t[3][:, 6]) for t in part]):.0f} levels | largest step frame to frame as a share of the star\'s mean light, scene light 5x5: median {np.median(s5):.3f} 90th {np.percentile(s5, 90):.3f} largest {s5.max():.3f} | 7x7: median {np.median(s7):.3f} largest {s7.max():.3f} | display levels 5x5: median {np.median(sd):.3f} largest {sd.max():.3f} | peak level most over least: median {np.median(pk):.2f}')
if '--list' in sys.argv:
    for kind in ('sprite', 'band'):
        g = sorted([t for t in tracks if t[2] == kind], key=lambda t: t[3][:, 2].mean())
        n = len(g)
        if not n: continue
        idx = sorted(set(np.linspace(0, n - 1, 20 if kind == 'sprite' else 10).round().astype(int)))
        for i in idx:
            t = g[i]; f = t[3][:, 2]; j = int(np.abs(np.diff(f)).argmax())
            print(f"  {kind} ({t[0]},{t[1]}) peak {t[3][:, 5].min():.0f}..{t[3][:, 5].max():.0f}: " + ' '.join(f'{v:.0f}' for v in f) + f" | step {step(f):.3f} at {ks[j] / 2}")
json.dump([dict(x=t[0], y=t[1], kind=t[2], track=t[3].tolist()) for t in tracks], open(D.rstrip('/') + '-tracks.json', 'w'))
X0 = 1260
print('  carry of the sky right of x', X0, '(the next picture drawn back by the pose, bilinear): frame, mean level, mean left over, share of pixels over 6 levels')
for i in range(len(ks) - 1):
    ka, kb = ks[i], ks[i + 1]
    Hm = hom(ka, kb)
    wb = cv2.warpPerspective(lum[kb].astype(np.float32), Hm, (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderValue=np.nan)
    wa = cv2.warpPerspective(lum[ka].astype(np.float32), np.eye(3) + np.array([[0, 0, 0.5], [0, 0, 0.5], [0, 0, 0]]), (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderValue=np.nan)
    m = np.isfinite(wb); m[:, :X0] = False; m[:12] = False; m[-12:] = False; m[:, -12:] = False
    d = np.abs(wb - lum[ka])[m]
    print(f'   {ka / 2:.1f} level {lum[ka][m].mean():.2f} left {d.mean():.3f} over6 {(d > 6).mean():.4f} | move px {np.hypot(*((Hm @ np.array([1500, 540, 1.0]))[:2] / (Hm @ np.array([1500, 540, 1.0]))[2] - np.array([1500, 540]))):.2f}')
