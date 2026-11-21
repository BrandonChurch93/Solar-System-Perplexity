import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geo

LUM = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
SCALE = 2
OUT = geo.WORK / "split"
OUT.mkdir(parents=True, exist_ok=True)
CLOUD = np.array([0.86, 0.88, 0.9], dtype=np.float32)
SHADOW = dict(height=0.006, strength=0.4, blur=5.0, even=14.0)
A0, A1 = 0.02, 0.12


def lum(x):
    return x @ LUM


def emissive(lin, f):
    night = geo.smooth(*geo.NIGHT, f["ndl"]) * f["hit"]
    coded = geo.encode(lin).astype(np.float32)
    r, g, b = coded[..., 0], coded[..., 1], coded[..., 2]
    yy, xx = np.mgrid[0:lin.shape[0], 0:lin.shape[1]].astype(np.float32) / SCALE
    zone = np.maximum(geo.smooth(-0.05, -0.15, f["ndl"]), geo.smooth(1700, 1800, xx) * geo.smooth(640, 560, yy)) * f["hit"]
    del yy, xx
    green = geo.smooth(0.05, 0.13, g - np.maximum(r, b) - 0.25 * b) * geo.smooth(0.15, 0.25, g) * zone
    green = geo.blur(cv2.dilate(green, np.ones((5, 5), np.uint8)), 3.0)
    green = np.clip(green * 1.5, 0, 1)
    small = cv2.resize(coded, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
    gm = cv2.resize(green, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
    fill = cv2.inpaint((small * 255).astype(np.uint8), (gm > 0.02).astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA).astype(np.float32) / 255
    fill = geo.blur(cv2.resize(fill, (coded.shape[1], coded.shape[0]), interpolation=cv2.INTER_LINEAR), 6.0)
    base = coded * (1 - green[..., None]) + fill * green[..., None]
    lin_base = geo.decode(base).astype(np.float32)
    aurora = np.maximum(lin - lin_base, 0) * green[..., None]
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))
    opened = cv2.morphologyEx(base, cv2.MORPH_OPEN, k)
    top = base - opened
    chroma = (base[..., 0] - base[..., 2]) / (base[..., 0] + base[..., 2] + 0.05)
    warm = geo.smooth(0.0, 0.08, chroma)
    gate = geo.smooth(0.012, 0.045, lum(top)) * warm * night
    core = cv2.dilate((gate > 0.15).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    half = cv2.resize(base, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
    cm = cv2.resize(core, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_NEAREST)
    under = cv2.inpaint((half * 255).astype(np.uint8), cm * 255, 5, cv2.INPAINT_TELEA).astype(np.float32) / 255
    under = geo.blur(cv2.resize(under, (base.shape[1], base.shape[0]), interpolation=cv2.INTER_LINEAR), 2.0)
    gate = np.clip(geo.blur(cv2.dilate(gate, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))), 2.0) * 1.6, 0, 1)
    surface = base * (1 - gate[..., None]) + np.minimum(under, base) * gate[..., None]
    lin_surface = geo.decode(surface).astype(np.float32)
    city = np.maximum(lin_base - lin_surface, 0) * gate[..., None]
    gate = np.maximum(gate, geo.blur(warm * night, 2.0))
    return lin_surface, city, aurora, gate, green


def main():
    f = geo.fields(SCALE)
    hit = f["hit"]
    C = geo.hero(SCALE)[..., :3]
    h, w = C.shape[:2]
    D = cv2.resize(geo.read(geo.WORK / "decloud" / "decloud-seedream-t1.png")[..., :3], (w, h), interpolation=cv2.INTER_CUBIC)
    sh = geo.shade(f["ndl"])
    haze, t = geo.limb_haze(f["cosv"], f["ndl"], sh)
    linC = geo.decode(C).astype(np.float32)
    linC, city, aurora, gate, green = emissive(linC, f)
    linD = geo.decode(np.clip(D, 0, 1)).astype(np.float32)
    den = sh * t
    floor = geo.blur(cv2.erode(lum(linC), np.ones((9, 9), np.uint8)), 4.0)
    haze = haze * np.minimum(1.0, 0.8 * floor / np.maximum(lum(haze), 1e-5))[..., None]
    np.save(OUT / "haze.npy", haze.astype(np.float16))
    AC = np.maximum(linC - haze, 0.0) / den
    AD = np.maximum(linD - haze, 0.0) / den
    AC[~hit] = 0
    AD[~hit] = 0
    del linD
    lc, ld = lum(AC), lum(AD)
    rough = (lc - ld) / np.maximum(lum(CLOUD) - ld, 0.2)
    clear = ((geo.blur(np.maximum(rough, 0), 6.0) < 0.05) & hit & (gate < 0.05) & (green < 0.05)).astype(np.float32)
    sig = 50.0
    num = np.stack([geo.blur(AC[..., c] * clear, sig) for c in range(3)], -1)
    dn = np.stack([geo.blur(AD[..., c] * clear, sig) for c in range(3)], -1)
    cover = geo.blur(clear, sig)
    gain = np.clip(num / np.maximum(dn, 1e-5), 0.5, 2.0)
    gain = np.where(cover[..., None] > 0.03, gain, 1.0)
    gain = np.stack([geo.blur(gain[..., c], 12.0) for c in range(3)], -1)
    SD = AD * gain
    del AD, num, dn
    night = geo.smooth(0.25, -0.05, f["ndl"])
    SD = SD * (1 - (night * np.clip(green + gate, 0, 1))[..., None]) + np.minimum(SD, AC) * (night * np.clip(green + gate, 0, 1))[..., None]
    def alpha_of(SD):
        ls = lum(SD)
        raw = np.clip((lc - ls) / np.maximum(lum(CLOUD) - ls, 0.25), 0, 1)
        raw = raw * geo.smooth(0.04, 0.14, geo.blur(raw, 1.5) + 0.6 * geo.blur(raw, 12.0))
        raw[~hit] = 0
        raw *= 1 - np.clip(gate, 0, 1) * geo.smooth(*geo.NIGHT, f["ndl"])
        return raw.astype(np.float32)

    a = alpha_of(SD)
    gap = ((a < 0.03) & hit).astype(np.float32)
    fine = 9.0
    cov = geo.blur(gap, fine)
    g2 = np.stack([geo.blur(AC[..., c] * gap, fine) / np.maximum(geo.blur(SD[..., c] * gap, fine), 1e-5) for c in range(3)], -1)
    g2 = np.clip(g2, 0.4, 1.6)
    g2 = 1 + (g2 - 1) * geo.smooth(0.03, 0.2, cov)[..., None]
    SD = SD * g2
    a = alpha_of(SD)
    del g2, cov, gap
    n = f["n"]
    ndl = f["ndl"]
    tang = geo.SUN[None, None, :].astype(np.float32) - n * ndl[..., None]
    shifted = n + tang * (SHADOW["height"] / np.maximum(ndl, 0.12))[..., None]
    shifted /= np.linalg.norm(shifted, axis=-1, keepdims=True)
    px, py, z = geo.CAM.project(shifted.astype(np.float64))
    soft = geo.blur(a, SHADOW["blur"])
    ash = cv2.remap(soft, (px * SCALE - 0.5).astype(np.float32), (py * SCALE - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    ash *= geo.smooth(-0.05, 0.1, ndl)
    shf = (1 - SHADOW["strength"] * ash)[..., None]
    del shifted, tang, px, py, z
    even = np.clip(geo.blur(shf[..., 0], SHADOW["even"]), 0.5, 1.0)[..., None]
    low = np.maximum(AC - a[..., None] * CLOUD, 0) / np.maximum((1 - a[..., None]) * even, 0.3)
    k = geo.smooth(A0, A1, a)[..., None]
    S = low * (1 - k) + SD * k
    W = np.where(a[..., None] > A0, (AC - (1 - a[..., None]) * S * shf) / np.maximum(a[..., None], A0), CLOUD)
    W = np.clip(W, 0.0, 6.0)
    comp = S * shf * (1 - a[..., None]) + W * a[..., None]
    err = np.abs(geo.encode(comp * den + haze) - geo.encode(linC))[hit & (f["cosv"] > 0.2)]
    print("recompose error in code values: mean %.3f p99 %.3f max %.3f" % (err.mean() * 255, np.percentile(err, 99) * 255, err.max() * 255))
    print("alpha: cover %.3f thick %.3f" % ((a[hit] > 0.05).mean(), (a[hit] > A1).mean()))
    np.save(OUT / "surface.npy", geo.encode(S).astype(np.float16))
    np.save(OUT / "cloud.npy", geo.encode(W).astype(np.float16))
    np.save(OUT / "alpha.npy", a.astype(np.float16))
    np.save(OUT / "hero-albedo.npy", geo.encode(AC).astype(np.float16))
    np.save(OUT / "city.npy", city.astype(np.float16))
    np.save(OUT / "aurora.npy", aurora.astype(np.float16))
    np.save(OUT / "shadow.npy", ash.astype(np.float16))
    view = geo.WORK / "view"
    s = (slice(None, None, 2), slice(None, None, 2))
    geo.write(view / "split-surface.jpg", geo.encode(S[s] * den[s]), 90)
    geo.write(view / "split-alpha.jpg", a[s], 90)
    geo.write(view / "split-cloud.jpg", geo.encode(W[s] * a[s][..., None] * den[s]), 90)
    geo.write(view / "split-emissive.jpg", geo.encode((city[s] + aurora[s]) * 1.0), 90)
    geo.write(view / "split-shadow.jpg", shf[s][..., 0], 90)
    geo.write(view / "split-comp.jpg", geo.encode(comp[s] * den[s] + haze[s]), 92)
    e = np.abs(geo.encode(comp * den + haze) - geo.encode(linC)).max(-1) * hit
    geo.write(view / "split-error.jpg", np.clip(e[s] * 6, 0, 1), 90)
    for name, (x, y) in dict(carib=(1250, 600), storm=(900, 560), limb=(800, 250), night=(1750, 600), aurora=(1740, 330), brazil=(1560, 880)).items():
        c = (slice(2 * y, 2 * y + 640), slice(2 * x, 2 * x + 800))
        geo.write(view / f"split-crop-{name}.jpg", np.hstack([C[c], geo.encode(S[c] * den[c] + haze[c]), geo.encode(comp[c] * den[c] + haze[c] + city[c] + aurora[c]), np.repeat(a[c][..., None], 3, -1), geo.encode((city[c] + aurora[c]) * 2)]), 90)


if __name__ == "__main__":
    main()
