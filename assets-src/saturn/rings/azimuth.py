import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib import HERE, ROOT, WORK, basis, load_json, lum, normalize

sys.path.insert(0, str(ROOT / "tools" / "assets"))
from common import quat_to_mat  # noqa: E402

fit = load_json(HERE / "fit.json")
n = normalize(fit["rings"]["normal"])
e1, e2, _ = basis(n)
M = quat_to_mat(fit["globe"]["quaternion"])
pol = np.load(WORK / "polar-lin.npy")
ok = np.load(WORK / "polar-ok.npy")
prof = lum(np.nan_to_num(np.load(WORK / "profile-hero.npy")))
NR, NT = pol.shape[:2]
rr = 1.10 + (np.arange(NR) + 0.5) / NR * 1.5
L = lum(pol)
BANDS = ((1.30, 1.45), (1.55, 1.70), (1.78, 1.92), (2.05, 2.15), (2.20, 2.30))
STEP = 64
radii, coeffs = [], []
for lo, hi in BANDS:
    m = (rr > lo) & (rr < hi)
    ref = np.median(prof[m])
    phis, vals = [], []
    for a in range(0, NT, STEP):
        sel = ok[m, a:a + STEP]
        if sel.mean() < 0.9:
            continue
        th = (a + STEP / 2) / NT * 2 * np.pi
        p = (np.cos(th) * e1 + np.sin(th) * e2) @ M
        phis.append(np.arctan2(p[2], p[0]))
        vals.append(np.median(L[m, a:a + STEP][sel]) / ref)
    phis, vals = np.array(phis), np.array(vals)
    A = np.stack([np.ones_like(phis), np.cos(phis), np.sin(phis), np.cos(2 * phis), np.sin(2 * phis)], 1)
    reg = np.diag([0.0, 0.3, 0.3, 1.5, 1.5])
    c = np.linalg.solve(A.T @ A + reg, A.T @ vals)
    res = A @ c - vals
    grid = np.linspace(-np.pi, np.pi, 73)
    g = c[0] + c[1] * np.cos(grid) + c[2] * np.sin(grid) + c[3] * np.cos(2 * grid) + c[4] * np.sin(2 * grid)
    print(f"band {lo}-{hi}: samples {len(vals)} measured {vals.min():.2f} to {vals.max():.2f}, fit rms {np.sqrt((res ** 2).mean()):.3f}, fit range all azimuths {g.min():.2f} to {g.max():.2f}")
    radii.append(round((lo + hi) / 2, 4))
    coeffs.append([round(float(v), 4) for v in c])
out = {"radii": radii, "coeffs": coeffs, "source": "assets-src/saturn/rings/azimuth.py, hero ring brightness by azimuth in the ring frame, relative to the profile's source sector"}
(ROOT / "src/stops/saturn/azimuth.json").write_text(json.dumps(out, indent=1) + "\n")
