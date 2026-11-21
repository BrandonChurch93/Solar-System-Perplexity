import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/uranus')
import geo

OUT = 'out/work/u/rings2/'
N0 = np.array([-0.1989, -0.6042, 0.7716])
T = 3600
R0, R1, NR = 1.10, 1.80, 1400
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)
SHEARS = np.arange(-0.6, 0.601, 0.1)
WIN = 15
LOW = 0.0012
GAP = 14


def basis(n):
    n = n / np.linalg.norm(n)
    e1 = np.cross([0, 0, 1.0], n)
    e1 /= np.linalg.norm(e1)
    return n, e1, np.cross(n, e1)


def unwrap():
    im = np.asarray(Image.open('references/approved/uranus-hero.png').convert('RGB')).astype(np.float32) / 255
    lin = geo.scene(im).astype(np.float32)
    lum = lin @ LUMA
    resid = lum - ndi.median_filter(lum, size=7)
    ys, xs = np.mgrid[0:geo.H, 0:geo.W]
    for cx, cy, r in [(671.7, 343.9, 29.06), (2425.5, 444.2, 24.0)]:
        resid[np.hypot(xs - cx, ys - cy) < r + 5] = 0
    n, e1, e2 = basis(N0)
    th = (np.arange(T) + 0.5) / T * 2 * np.pi
    rr = R0 + (np.arange(NR) + 0.5) / NR * (R1 - R0)
    A, TH = np.meshgrid(rr, th, indexing='ij')
    P = A[..., None] * (np.cos(TH)[..., None] * e1 + np.sin(TH)[..., None] * e2)
    px, py = geo.project(P)
    v = P - geo.CAM
    dist = np.linalg.norm(v, axis=-1)
    d = v / dist[..., None]
    b = -(d @ geo.CAM)
    closest = np.sqrt(np.maximum(geo.CAM @ geo.CAM - b * b, 0))
    ok = (closest > 1.012) & (px > 4) & (px < geo.W - 5) & (py > 4) & (py < geo.H - 5)
    pol = cv2.remap(resid, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    col = cv2.remap(lin - np.dstack([ndi.median_filter(lin[..., c], size=7) for c in range(3)]), px.astype(np.float32), py.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    pol[~ok] = 0
    return pol, ok, col, P


def lines_only(pol):
    best = np.full(pol.shape, -1.0, np.float32)
    slope = np.zeros(pol.shape, np.float32)
    half = WIN // 2
    for s in SHEARS:
        stack = []
        for k in range(-half, half + 1):
            sh = ndi.shift(pol, (-s * k, 0), order=1, mode='constant') if abs(s * k) > 1e-6 else pol
            stack.append(np.roll(sh, -k, axis=1))
        med = np.median(np.stack(stack, 0), 0)
        better = med > best
        best[better] = med[better]
        slope[better] = s
    return np.maximum(best, 0), slope


def track(L, slope):
    S = ndi.gaussian_filter(L, (1.2, 0.8), mode=('constant', 'wrap'))
    tracks = []
    active = []
    for j in range(T):
        c = S[:, j]
        idx = np.flatnonzero((c[1:-1] > c[:-2]) & (c[1:-1] >= c[2:]) & (c[1:-1] > LOW)) + 1
        den = c[idx - 1] - 2 * c[idx] + c[idx + 1]
        sub = idx + np.where(np.abs(den) > 1e-12, 0.5 * (c[idx - 1] - c[idx + 1]) / den, 0)
        used = np.zeros(len(idx), bool)
        order = sorted(range(len(active)), key=lambda a: -len(active[a]['j']))
        for a in order:
            t = active[a]
            pred = t['r'][-1] + t['s'] * (j - t['j'][-1])
            if len(idx) == 0:
                continue
            dd = np.abs(sub - pred)
            dd[used] = 1e9
            k = int(np.argmin(dd))
            if dd[k] < 1.6 + 0.08 * (j - t['j'][-1]):
                if len(t['j']) >= 6:
                    span = t['j'][-1] - t['j'][-6]
                    new = (sub[k] - t['r'][-6]) / (j - t['j'][-6])
                    t['s'] = 0.7 * t['s'] + 0.3 * new
                t['j'].append(j)
                t['r'].append(float(sub[k]))
                t['a'].append(float(c[idx[k]]))
                used[k] = True
        keep = []
        for t in active:
            if j - t['j'][-1] > GAP:
                tracks.append(t)
            else:
                keep.append(t)
        active = keep
        for k in np.flatnonzero(~used):
            active.append({'j': [j], 'r': [float(sub[k])], 'a': [float(c[idx[k]])], 's': float(slope[idx[k], j])})
    tracks += active
    return tracks


def main():
    pol, ok, col, P = unwrap()
    L, slope = lines_only(pol)
    np.save(OUT + 'L.npy', L)
    np.save(OUT + 'ok.npy', ok)
    Image.fromarray((np.clip(L * 40, 0, 1) ** 0.6 * 255).astype(np.uint8)).resize((1800, 700), Image.LANCZOS).save(OUT + 'lines.jpg', quality=92)
    Image.fromarray((np.clip(np.abs(pol) * 40, 0, 1) ** 0.6 * 255).astype(np.uint8)).resize((1800, 700), Image.LANCZOS).save(OUT + 'resid.jpg', quality=92)
    tracks = track(L, slope)
    out = []
    for t in tracks:
        j = np.array(t['j'])
        if j[-1] - j[0] < 40 or len(j) < 30:
            continue
        a = np.array(t['a'])
        if np.median(a) < LOW * 1.3:
            continue
        out.append({'j': j.tolist(), 'r': [round(v, 2) for v in t['r']], 'a': [round(v, 5) for v in t['a']]})
    cm = L > 0.006
    c = np.median(col[cm], 0)
    c = c / (c @ LUMA)
    json.dump({'T': T, 'R0': R0, 'R1': R1, 'NR': NR, 'normal': N0.tolist(), 'color': [round(float(v), 4) for v in c], 'tracks': out}, open(OUT + 'tracks.json', 'w'))
    print(len(tracks), 'raw tracks', len(out), 'kept', 'colour', c.round(3))
    lens = sorted([(t['j'][-1] - t['j'][0]) / 10 for t in out], reverse=True)
    print('lengths deg', [round(v) for v in lens[:40]])
    show = np.zeros((NR, T, 3), np.uint8)
    show[...] = (np.clip(L * 40, 0, 1) ** 0.6 * 120)[..., None]
    rng = np.random.RandomState(3)
    for t in out:
        colr = rng.randint(90, 255, 3)
        jj = np.array(t['j'])
        ri = np.clip(np.round(t['r']).astype(int), 0, NR - 1)
        show[ri, jj] = colr
        show[np.clip(ri + 1, 0, NR - 1), jj] = colr
    Image.fromarray(show).resize((1800, 700), Image.LANCZOS).save(OUT + 'tracks.jpg', quality=92)


main()
