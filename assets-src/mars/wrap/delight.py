import cv2
import numpy as np
from scipy.ndimage import gaussian_filter

from geo import WORK, hero, hero_geometry, map_lonlat, project_lonlat, FIT

MU = np.linspace(-0.1, 1.0, 23)
CV = np.linspace(0.0, 1.0, 21)
REF = (0.7, 0.6)


def table(img, g):
    m = g["hit"].copy()
    mo = FIT["moons"][0]
    h, w = m.shape
    yy, xx = np.mgrid[0:h, 0:w] + 0.5
    m &= np.hypot(xx - mo["cx"], yy - mo["cy"]) > mo["r"] + 10
    mu, cv = g["mu"][m], g["cosv"][m]
    col = np.log(np.clip(img[m], 1e-3, 1))
    T = np.full((len(MU), len(CV), 3), np.nan)
    N = np.zeros((len(MU), len(CV)))
    for i, a in enumerate(MU):
        si = np.abs(mu - a) < 0.05
        for j, b in enumerate(CV):
            s = si & (np.abs(cv - b) < 0.05)
            N[i, j] = s.sum()
            if s.sum() > 400:
                T[i, j] = np.median(col[s], 0)
    for c in range(3):
        t = T[..., c]
        ok = ~np.isnan(t)
        ii, jj = np.nonzero(ok)
        from scipy.interpolate import griddata
        gi, gj = np.mgrid[0:len(MU), 0:len(CV)]
        f = griddata((ii, jj), t[ok], (gi, gj), method="linear")
        f2 = griddata((ii, jj), t[ok], (gi, gj), method="nearest")
        f = np.where(np.isnan(f), f2, f)
        T[..., c] = gaussian_filter(f, 0.8, mode="nearest")
    return T, N


def lookup(T, mu, cv):
    fi = np.clip((mu - MU[0]) / (MU[1] - MU[0]), 0, len(MU) - 1).astype(np.float32)
    fj = np.clip((cv - CV[0]) / (CV[1] - CV[0]), 0, len(CV) - 1).astype(np.float32)
    out = np.stack([cv2.remap(T[..., c].astype(np.float32), fj, fi, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
                    for c in range(3)], -1)
    return out


def remove_veil(out, cosv, mu, bad):
    sel = (mu > 0.25) & (~bad) & (cosv > 0.03)
    s = 3
    o, c = out[::s, ::s][sel[::s, ::s]], cosv[::s, ::s][sel[::s, ::s]]
    bins = np.linspace(0.05, 0.95, 19)
    lo = np.array([np.percentile(o[np.abs(c - b) < 0.05], 4, axis=0) if (np.abs(c - b) < 0.05).sum() > 2000 else [np.nan] * 3
                   for b in bins])
    ok = ~np.isnan(lo[:, 0])
    base = np.nanmedian(lo[(bins > 0.6) & ok], 0)
    V = np.clip(lo - base, 0, None)
    for c_ in range(3):
        v = np.interp(bins, bins[ok], V[ok, c_])
        v = np.maximum.accumulate(v[::-1])[::-1]
        V[:, c_] = gaussian_filter(v, 1.0, mode="nearest")
    V[bins > 0.6] = 0
    mref = np.median(o[c > 0.6], 0)
    Vp = np.stack([np.interp(cosv, bins, V[:, k]) for k in range(3)], -1)
    print("veil at cosv", [(round(b, 2), V[i].round(3).tolist()) for i, b in enumerate(bins) if i % 3 == 0])
    return (out - Vp) / (1 - Vp / mref)


def run(W=4096):
    img = hero()
    g = hero_geometry()
    T, N = table(img, g)
    i0 = np.argmin(np.abs(MU - REF[0]))
    j0 = np.argmin(np.abs(CV - REF[1]))
    ref = T[i0, j0]
    np.save(WORK / "shade-table.npy", T)
    LON, LAT = map_lonlat(W)
    px, py, cosv, mu = project_lonlat(LON, LAT)
    src = np.ascontiguousarray(img)
    col = cv2.remap(src, (px - 0.5).astype(np.float32), (py - 0.5).astype(np.float32), cv2.INTER_LANCZOS4,
                    borderMode=cv2.BORDER_REFLECT)
    S = lookup(T, mu, cosv)
    gain = np.exp(ref - S)
    out = col * gain
    h, w = img.shape[:2]
    inside = (px > 1) & (px < w - 1) & (py > 1) & (py < h - 1) & (cosv > 0)
    mo = FIT["moons"][0]
    ph = np.hypot(px - mo["cx"], py - mo["cy"]) < mo["r"] + 6
    def ss(e0, e1, x):
        t = np.clip((x - e0) / (e1 - e0), 0, 1)
        return t * t * (3 - 2 * t)
    out = remove_veil(out, cosv, mu, ph | ~inside)
    dph = np.hypot(px - mo["cx"], py - mo["cy"]) - (mo["r"] + 6)
    edge = ss(0, 80, np.minimum.reduce([px, py, w - px, h - py]))
    conf = ss(0.0, 0.16, mu) * ss(0.06, 0.25, cosv) * inside * ss(0, 40, dph) * edge
    np.save(WORK / f"delit-{W}.npy", out.astype(np.float16))
    np.save(WORK / f"conf-{W}.npy", conf.astype(np.float16))
    np.save(WORK / f"phobos-{W}.npy", (ph & inside))
    np.save(WORK / f"heropx-{W}.npy", np.stack([px, py, cosv, mu], -1).astype(np.float32))
    vis = np.clip(out * conf[..., None], 0, 1)
    cv2.imwrite(str(WORK / "v_delit.jpg"), cv2.cvtColor((cv2.resize(vis, (2048, 1024), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
    print("ref", np.exp(ref), "max gain used", float(np.percentile(gain[conf > 0.5], 99.5)))


if __name__ == "__main__":
    run()
