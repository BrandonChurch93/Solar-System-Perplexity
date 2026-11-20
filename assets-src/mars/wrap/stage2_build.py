import json
import sys

import cv2
import numpy as np

from faces import basis, splat
from geo import WORK
from stage1b_build import save
from geo import map_lonlat
from ringfix import ring_weight
from tiles import OUT, rows_for

W = 8192
SIG = 6.0


def load(p):
    return cv2.cvtColor(cv2.imread(str(p)), cv2.COLOR_BGR2RGB).astype(np.float32) / 255


def lock_low(t, ref):
    ref = cv2.resize(ref, t.shape[1::-1], interpolation=cv2.INTER_CUBIC)
    return np.clip(t - cv2.GaussianBlur(t, (0, 0), SIG) + cv2.GaussianBlur(ref, (0, 0), SIG), 0, 1)


def hellas(out, tiles, takes, k="s5"):
    from compose0 import lab, rgb
    from geo import map_lonlat
    from stage1c import ang_from, ss
    lo, la, fov = tiles[k]
    t = load(OUT / f"{takes.get(k, 't1')}-{k}.png")
    ref = cv2.resize(load(OUT / f"in-{k}.jpg"), t.shape[1::-1], interpolation=cv2.INTER_AREA)
    n = t.shape[0]
    yy, xx = np.mgrid[0:n, 0:n]
    ring = np.hypot(xx - n / 2, yy - n / 2) > n * 0.38
    Lt, Lr = lab(t), lab(ref)
    for c in range(3):
        a, b = Lt[..., c][ring], Lr[..., c][ring]
        Lt[..., c] = (Lt[..., c] - a.mean()) / a.std() * b.std() + b.mean()
    t = rgb(Lt)
    H = W // 2
    rows = rows_for(la, fov, H)
    a = np.zeros((rows.stop - rows.start, W, 3), np.float32)
    w = np.zeros((rows.stop - rows.start, W), np.float32)
    splat(a, w, t, basis(lo, la), fov, W, inner=0.92, rows=rows)
    LON, LAT = map_lonlat(W)
    z = (1 - ss(19, 27, ang_from(LON[rows], LAT[rows], 70, -42))) * w
    over = a / np.maximum(w, 1e-6)[..., None]
    out[rows] = out[rows] * (1 - z[..., None]) + over * z[..., None]
    return out


def main(takes_file=None):
    tiles = json.load(open(OUT / "tiles.json"))
    takes = json.load(open(takes_file)) if takes_file else {}
    H = W // 2
    acc = np.zeros((H, W, 3), np.float32)
    wacc = np.zeros((H, W), np.float32)
    for k, (lo, la, fov) in tiles.items():
        tk = takes.get(k, "t1")
        ring_take = tk.startswith("r")
        t = lock_low(load(OUT / f"{tk}-{k}.png"), load(OUT / (f"inr-{k}.jpg" if ring_take else f"in-{k}.jpg")))
        rows = rows_for(la, fov, H)
        LON, LAT = map_lonlat(W)
        rw = ring_weight(LON[rows], LAT[rows])
        del LON, LAT
        ex = None if ring_take else (1 - rw * 0.999).astype(np.float32)
        a = np.zeros((rows.stop - rows.start, W, 3), np.float32)
        w = np.zeros((rows.stop - rows.start, W), np.float32)
        splat(a, w, t, basis(lo, la), fov, W, inner=0.6, rows=rows, extra=ex)
        acc[rows] += a
        wacc[rows] += w
        del a, w
    base = np.load(WORK / "ringfix-4096.npy").astype(np.float32)
    base = cv2.resize(base, (W, H), interpolation=cv2.INTER_CUBIC)
    e = 1e-3
    out = (acc + base * e) / (wacc + e)[..., None]
    out = hellas(out, tiles, takes)
    print("min weight", float(wacc.min()), "px with weight < 0.05", int((wacc < 0.05).sum()))
    np.save(WORK / "stage2-8192.npy", out.astype(np.float16))
    save(WORK / "stage2-color-8192.jpg", out)
    save(WORK / "v_stage2.jpg", cv2.resize(np.clip(out, 0, 1), (2048, 1024), interpolation=cv2.INTER_AREA), 90)


if __name__ == "__main__":
    main(*sys.argv[1:])
