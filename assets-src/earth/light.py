import json
import sys
from pathlib import Path

import numpy as np
from scipy.optimize import least_squares

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geo

KNOTS = 33
LUM = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
OUT = geo.ROOT / "src" / "stops" / "earth"


def percentiles(lin, sel, ndl, qs, lo=-1.0, hi=1.0, n=32):
    edges = np.linspace(lo, hi, n + 1)
    mid, rows = [], []
    for i in range(n):
        m = sel & (ndl >= edges[i]) & (ndl < edges[i + 1])
        if m.sum() < 1500:
            continue
        mid.append((edges[i] + edges[i + 1]) / 2)
        rows.append(np.percentile(lin[m], qs, axis=0))
    return np.array(mid), np.array(rows)


def monotone(v):
    v = np.maximum.accumulate(v)
    k = np.array([1, 2, 3, 2, 1], dtype=np.float64)
    k /= k.sum()
    p = np.pad(v, 2, mode="edge")
    return np.maximum.accumulate(np.convolve(p, k, mode="valid"))


def main():
    h = geo.hero(1)
    g = geo.hero_geometry(1)
    lin = geo.decode(h).astype(np.float32)
    hit, ndl, mu = g["hit"], g["ndl"], g["cosv"]
    lum = lin @ LUM
    centre = hit & (mu > 0.55)
    mid, rows = percentiles(lum[..., None], centre, ndl, [15, 50, 85])
    rows = rows[:, :, 0]
    ref = (mid > 0.25) & (mid < 0.55)
    norm = rows / np.exp(np.log(rows[ref]).mean(0))
    shape = np.exp(np.log(norm).mean(1))
    shape = monotone(shape)
    knots = np.linspace(-1, 1, KNOTS)
    s = np.interp(knots, mid, shape)
    cloud = np.interp(0.7, mid, rows[:, 2])
    s *= 2.0 / np.interp(0.7, knots, s)
    midc, rowc = percentiles(lin, centre, ndl, [15])
    floor = rowc[:, 0, :]
    day = floor[(midc > 0.25) & (midc < 0.55)].mean(0)
    night = floor[midc < -0.3].mean(0)
    tint = (night / day) / (night[1] / day[1])
    w = np.clip((0.12 - knots) / 0.3, 0, 1)
    w = w * w * (3 - 2 * w)
    curve = s[:, None] * (1 + (tint - 1)[None, :] * w[:, None])
    json.dump({"knots": KNOTS, "from": -1, "to": 1, "curve": [[round(float(x), 4) for x in r] for r in curve], "note": "measured from the approved hero: ocean floor, median and cloud percentiles per sun angle, view cosine above 0.55"}, open(OUT / "curve.json", "w"))
    print("night tint", tint, "cloud p85 at 0.7", cloud)
    for k, r in zip(knots, curve):
        print(f"{k:+.3f}  {r[0]:.4f} {r[1]:.4f} {r[2]:.4f}")

    def shade(x):
        t = np.clip(x * 0.5 + 0.5, 0, 1) * (KNOTS - 1)
        return np.stack([np.interp(t, np.arange(KNOTS), curve[:, c]) for c in range(3)], -1)

    mus = np.array([0.1, 0.13, 0.16, 0.2, 0.25, 0.3, 0.36, 0.43, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0])
    nds = np.array([0.1, 0.25, 0.4, 0.55, 0.7, 0.85])
    data = []
    for i in range(len(mus) - 1):
        for j in range(len(nds) - 1):
            m = hit & (mu >= mus[i]) & (mu < mus[i + 1]) & (ndl >= nds[j]) & (ndl < nds[j + 1])
            if m.sum() < 800:
                continue
            data.append((mu[m].mean(), ndl[m].mean(), np.percentile(lin[m], 12, axis=0)))
    M = np.array([d[0] for d in data])
    N = np.array([d[1] for d in data])
    V = np.array([d[2] for d in data])
    S = shade(N)

    def model(p, M, N, S):
        a = np.exp(p[0:3])
        pale = np.exp(p[3:6])
        depth, width, power, gamma = np.exp(p[[6, 6, 6]]), np.exp(p[9]), np.exp(p[10]), p[11]
        f = np.exp(-(M / width) ** power)[:, None]
        t = np.exp(-depth[None, :] * f)
        lit = (S[:, 1:2] / 2.0) ** gamma
        return a * S * t + pale * lit * (1 - t)

    def res(p):
        return (np.log(model(p, M, N, S) + 0.004) - np.log(V + 0.004)).ravel()

    p0 = np.log([0.02, 0.05, 0.06, 1.0, 1.1, 1.3, 1.0, 2.0, 3.0, 0.2, 1.2, 1])
    p0[11] = 0.7
    lo = np.log([1e-3, 1e-3, 1e-3, 0.1, 0.3, 0.3, 0.05, 0.05, 0.05, 0.05, 0.5, 1])
    hi = np.log([0.3, 0.3, 0.3, 3, 3, 3, 30, 30, 30, 0.7, 4, 1])
    lo[11], hi[11] = 0.2, 1.5
    fit = least_squares(res, p0, loss="soft_l1", f_scale=0.3, bounds=(lo, hi))
    p = fit.x
    out = {"ocean": np.exp(p[0:3]).round(4).tolist(), "pale": np.exp(p[3:6]).round(4).tolist(), "depth": np.exp(p[[6, 6, 6]]).round(4).tolist(), "width": round(float(np.exp(p[9])), 4), "power": round(float(np.exp(p[10])), 4), "gamma": round(float(p[11]), 4), "dayFrom": -0.25, "dayTo": 0.15, "keep": 1.0, "night": [0.0066, 0.0246, 0.0406]}
    print(out, "rms log", float(np.sqrt((fit.fun ** 2).mean())))
    json.dump(out, open(Path(__file__).resolve().parent / "limbhaze.json", "w"), indent=1)
    json.dump({k: out[k] for k in ("pale", "depth", "width", "power", "gamma", "dayFrom", "dayTo", "night")}, open(OUT / "limb.json", "w"), indent=1)
    pred = model(p, M, N, S)
    for mm, nn, v, q in zip(M, N, V, pred):
        if 0.55 < nn < 0.7 or nn < 0.2:
            print(f"mu {mm:.2f} ndl {nn:.2f} seen {v[0]:.3f} {v[1]:.3f} {v[2]:.3f} model {q[0]:.3f} {q[1]:.3f} {q[2]:.3f}")


if __name__ == "__main__":
    main()
