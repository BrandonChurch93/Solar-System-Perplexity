import sys
from pathlib import Path

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import HERE, ROOT, WORK, basis, hero_camera, load_json, lum, normalize, srgb_to_linear

sys.path.insert(0, str(ROOT / "tools" / "assets"))
from lightcurve import inverse_filmic  # noqa: E402

HALF = float(sys.argv[1]) if len(sys.argv) > 1 else 4.0
LINES = int(sys.argv[2]) if len(sys.argv) > 2 else 41
NR = 3000
fit = load_json(HERE / "fit.json")
cam = hero_camera(fit)
n = normalize(fit["rings"]["normal"])
e1, e2, _ = basis(n)
hero = cv2.imread(str(ROOT / "references/approved/saturn-hero.png"))[..., ::-1].astype(np.float32) / 255
th = np.linspace(0, 2 * np.pi, 1440, endpoint=False)
x, _, _ = cam.project((np.cos(th)[:, None] * e1 + np.sin(th)[:, None] * e2) * 2.3)
t0 = th[np.argmin(x)]
rr = 1.10 + (np.arange(NR) + 0.5) / NR * 1.5
span = np.radians(np.linspace(-HALF, HALF, LINES))
P = (np.cos(t0 + span)[None, :, None] * e1 + np.sin(t0 + span)[None, :, None] * e2) * rr[:, None, None]
x, y, _ = cam.project(P)
pol = cv2.remap(hero, (x - 0.5).astype(np.float32), (y - 0.5).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
pol = inverse_filmic(srgb_to_linear(np.clip(pol, 0, 1)))
L = lum(pol)
idx = np.arange(NR)
mid = LINES // 2
ref = gaussian_filter1d(L[:, mid], 2.0, order=1)
ZONES = ((1.22, 1.60), (1.60, 1.99), (2.00, 2.40))
centres = [0.5 * (lo + hi) for lo, hi in ZONES]
rows, shifts = [], []
for c in range(LINES):
    col = gaussian_filter1d(L[:, c], 2.0, order=1)
    found = []
    for lo, hi in ZONES:
        m = (rr > lo) & (rr < hi)
        best = (-1e9, 0.0)
        for s in np.arange(-24, 24.25, 0.25):
            w = np.interp(idx + s, idx, col)[m]
            score = float((w * ref[m]).sum() / (np.sqrt((w * w).sum() * (ref[m] * ref[m]).sum()) + 1e-12))
            if score > best[0]:
                best = (score, s)
        found.append(best[1])
    shift = np.interp(rr, centres, found)
    shifts.append(found)
    rows.append(np.stack([np.interp(idx + shift, idx, pol[:, c, k]) for k in range(3)], -1))
S = np.sort(np.stack(rows), 0)
cut = LINES // 8
prof = S[cut:LINES - cut].mean(0)
np.save(WORK / "profile-hero-tip.npy", prof.astype(np.float32))
print("left ansa at ring azimuth", round(float(np.degrees(t0)), 2), "deg, hero px per row", round(float(np.hypot(x[1, mid] - x[0, mid], y[1, mid] - y[0, mid])), 3))
print("shifts in rows per zone, first to last line", [[round(float(v), 1) for v in s] for s in shifts[::8]])
