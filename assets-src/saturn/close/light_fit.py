import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import POLAR, ROOT, WORK, lum, spheroid_hit, srgb_to_linear

close = json.loads((ROOT / "src/stops/saturn/close.json").read_text())
img = cv2.imread(str(ROOT / "references/approved/saturn-close.jpg"))[..., ::-1].astype(np.float32) / 255
H, W = img.shape[:2]
t = np.tan(np.radians(close["vfov"]) / 2)
step = 4
xs, ys = np.meshgrid(np.arange(step / 2, W, step), np.arange(step / 2, H, step))
d = np.stack([(xs / W * 2 - 1) * t * W / H, (1 - ys / H * 2) * t, -np.ones_like(xs)], axis=-1)
d /= np.linalg.norm(d, axis=-1, keepdims=True)
c = np.array(close["centre"])
tilt, roll = np.radians(close["tiltDeg"]), np.radians(close["rollDeg"])
nc = np.array([-np.sin(roll) * np.cos(tilt), np.cos(roll) * np.cos(tilt), np.sin(tilt)])
o = -c
hit, th = spheroid_hit(o, d, nc)
p = o + d * th[..., None]
h = p @ nc
N = p + nc * (h * (1 / POLAR**2 - 1))[..., None]
N /= np.linalg.norm(N, axis=-1, keepdims=True)
tp = -(o @ nc) / (d @ nc)
ring = o + d * tp[..., None]
rr = np.linalg.norm(ring - nc * (ring @ nc)[..., None], axis=-1)
covered = (tp > 0) & (tp < th) & (rr > 1.0)
small = cv2.resize(img, (xs.shape[1], xs.shape[0]), interpolation=cv2.INTER_AREA)
L = lum(srgb_to_linear(small))
mu = -(N * d).sum(-1)
m = hit & ~covered & (h > 0.16) & (mu > 0.2)
Nm, Lm = N[m], L[m]
height = -c @ nc
hc = -c - nc * height
hc /= np.linalg.norm(hc)
side = np.cross(nc, hc)


def direction(az, el):
    a, e = np.radians(az), np.radians(el)
    return np.cos(e) * (-np.sin(a) * hc - np.cos(a) * side) + np.sin(e) * nc


def isotone(y, w):
    v, ww, n = [], [], []
    for yi, wi in zip(y, w):
        v.append(yi)
        ww.append(wi)
        n.append(1)
        while len(v) > 1 and v[-2] > v[-1]:
            tot = ww[-2] + ww[-1]
            v[-2] = (v[-2] * ww[-2] + v[-1] * ww[-1]) / tot
            ww[-2] = tot
            n[-2] += n[-1]
            v.pop()
            ww.pop()
            n.pop()
    return np.repeat(v, n)


def score(az, el):
    x = Nm @ direction(az, el)
    k = np.clip(((x + 1) * 60).astype(int), 0, 119)
    n = np.bincount(k, minlength=120)
    s1 = np.bincount(k, Lm, minlength=120)
    s2 = np.bincount(k, Lm * Lm, minlength=120)
    ok = n > 0
    mean = s1[ok] / n[ok]
    fit = isotone(mean, n[ok])
    return float(((s2[ok] - 2 * fit * s1[ok] + fit * fit * n[ok]).sum()) / len(Lm))


Ls = cv2.GaussianBlur(L, (0, 0), 2.0)
inside = cv2.erode(m.astype(np.uint8), np.ones((15, 15), np.uint8)) > 0
found = {}
for level in (0.02, 0.1, 0.3):
    edge = (cv2.morphologyEx((Ls > level).astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0) & inside
    Nt = N[edge]
    w, v = np.linalg.eigh(Nt.T @ Nt / len(Nt))
    s = v[:, 0]
    if (Nm[Lm > 0.3] @ s).mean() < 0:
        s = -s
    w2, v2 = np.linalg.eigh(np.cov(Nt.T))
    s2 = v2[:, 0] if v2[:, 0] @ s > 0 else -v2[:, 0]
    found[level] = (s, s2, Nt)
    for name, q in (("through the centre", s), ("free offset", s2)):
        print("level", level, name, "points", len(Nt), "azimuth", round(float(np.degrees(np.arctan2(-(q @ hc), -(q @ side)))), 2), "elevation", round(float(np.degrees(np.arcsin(q @ nc))), 2), "offset", round(float((Nt @ q).mean()), 4), "spread", round(float((Nt @ q).std()), 4))
dark = found[0.02][2]
cands = []
for a in np.arange(-14, 14.01, 1.0):
    for e in np.arange(-20, 12.01, 1.0):
        x = dark @ direction(a, e)
        if abs(float(x.mean())) < 0.03:
            cands.append((score(a, e), a, e, float(x.mean()), float(x.std())))
cands.sort()
for row in cands[:6]:
    print("candidate", [round(float(v), 4) for v in row])
sc, az, el = cands[0][:3]
print("close light: skim azimuth", az, "elevation", el, "score", sc)
s = direction(az, el)
x = Nm @ s
edges = np.linspace(-1, 1, 65)
curve = []
for a, b in zip(edges[:-1], edges[1:]):
    k = (x >= a) & (x < b)
    curve.append([float((a + b) / 2), float(np.median(Lm[k])) if k.sum() > 30 else None, int(k.sum())])
for row in curve:
    print(row)
(WORK / "close-light.json").write_text(json.dumps({"azimuthDeg": float(az), "elevationDeg": float(el), "curve": curve}))
