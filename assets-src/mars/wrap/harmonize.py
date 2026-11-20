import cv2
import numpy as np

from compose0 import lab, rgb
from geo import WORK

CB = np.linspace(0.0, 1.0, 21)
MB = np.linspace(-0.1, 1.0, 23)


def binfit(x, bins, r, w):
    idx = np.clip(np.round((x - bins[0]) / (bins[1] - bins[0])).astype(int), 0, len(bins) - 1)
    out = np.zeros((len(bins), r.shape[-1]))
    for i in range(len(bins)):
        s = idx == i
        if w[s].sum() > 200:
            out[i] = np.average(r[s], axis=0, weights=w[s])
    return out


def interp(x, bins, tab):
    return np.stack([np.interp(x, bins, tab[:, k]) for k in range(tab.shape[1])], -1)


def harmonize(de, cf, cosv, mu, sig=20):
    L = lab(de)
    lo = np.stack([cv2.GaussianBlur(L[..., k] * cf, (0, 0), sig) for k in range(3)], -1)
    wl = cv2.GaussianBlur(cf, (0, 0), sig)[..., None]
    lo = lo / np.maximum(wl, 1e-4)
    s = 3
    sel = (cf > 0.3)[::s, ::s]
    r = lo[::s, ::s][sel]
    w = cf[::s, ::s][sel]
    c = cosv[::s, ::s][sel]
    m = mu[::s, ::s][sel]
    ref = np.average(r[(c > 0.55) & (m > 0.4)], axis=0)
    oc = np.zeros((len(CB), 3))
    om = np.zeros((len(MB), 3))
    for _ in range(6):
        oc = binfit(c, CB, r - ref - interp(m, MB, om), w)
        oc[CB >= 0.6] = 0
        om = binfit(m, MB, r - ref - interp(c, CB, oc), w)
        om[MB >= 0.45] = 0
    off = interp(cosv, CB, oc) + interp(mu, MB, om)
    hp = L - lo
    sd = np.sqrt(np.maximum(cv2.GaussianBlur(hp[..., 0] ** 2 * cf, (0, 0), sig) / np.maximum(wl[..., 0], 1e-4), 1e-4))
    sdc = binfit(c, CB, sd[::s, ::s][sel][:, None], w)[:, 0]
    target = np.average(sdc[(CB >= 0.55) & (CB <= 0.85) & (sdc > 0)])
    gain_tab = np.where(sdc > 0, np.clip(target / np.maximum(sdc, 1e-3), 1.0, 2.2), 2.2)
    gain_tab[CB >= 0.6] = 1.0
    gain = np.interp(cosv, CB, gain_tab)[..., None]
    out = lo - off + hp * gain
    print("cosv offsets L,a,b", [(round(b, 2), oc[i].round(1).tolist()) for i, b in enumerate(CB) if i % 2 == 0 and b < 0.6])
    print("mu offsets L,a,b", [(round(b, 2), om[i].round(1).tolist()) for i, b in enumerate(MB) if i % 2 == 0 and b < 0.45])
    print("contrast gain by cosv", [(round(b, 2), round(float(g), 2)) for b, g in zip(CB, gain_tab) if b < 0.6])
    return rgb(out)


def run(W=4096):
    de = np.load(WORK / f"delit-{W}.npy").astype(np.float32)
    cf = np.load(WORK / f"conf-{W}.npy").astype(np.float32)
    hp = np.load(WORK / f"heropx-{W}.npy")
    out = harmonize(de, cf, hp[..., 2], hp[..., 3])
    np.save(WORK / f"delit-h-{W}.npy", out.astype(np.float16))


if __name__ == "__main__":
    run()
