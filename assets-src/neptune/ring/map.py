import sys

import cv2
import numpy as np
from scipy import ndimage as ndi

sys.path.insert(0, 'assets-src/neptune')
sys.path.insert(0, 'assets-src/neptune/ring')
import geo
import measure

HERO = 'references/approved/neptune-hero.png'
FORWARD, POWER = 2.5, 5.0
SCALE = 0.25
AZ = 10
WIDE = 56
FLOOR = 0.0008
STRAND = 2.2
BROAD = 36
TINT = [0.5, 0.85, 1.0]


def step(v, lo, hi):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    noring = sys.argv[1]
    out = sys.argv[2]
    hero = geo.decode(cv2.imread(HERO)[:, :, ::-1])
    film = geo.decode(cv2.imread(noring)[:, :, ::-1])
    film = cv2.resize(film.astype(np.float32), (hero.shape[1], hero.shape[0]), interpolation=cv2.INTER_CUBIC)
    diff = hero - film
    D, ok, over, rt, w, dn = measure.unwrap(diff)
    Hh, _, _, _, _, _ = measure.unwrap(hero)
    lum = Hh.max(-1)
    dark = 1 - step(ndi.gaussian_filter(lum, (3, 6)), 0.035, 0.07)
    rad = measure.R0 + (np.arange(measure.NR) + 0.5) / measure.NR * (measure.R1 - measure.R0)
    band = (step(rad, 1.455, 1.48) * (1 - step(rad, 1.57, 1.6)))[:, None]
    valid = ok.astype(np.float32) * np.where(over, dark * band, 1.0)
    edge = ndi.minimum_filter(valid, size=(9, 17))
    valid = ndi.gaussian_filter(edge, (3, 6))
    near = step(np.abs(rt - 1), 0.03, 0.07)
    valid = valid * ndi.gaussian_filter(near, (2, 4))
    med = ndi.median_filter(D, size=(1, 7, 1), mode='wrap')
    num = ndi.gaussian_filter(med * valid[..., None], (0, AZ, 0), mode='wrap')
    den = ndi.gaussian_filter(valid, (0, AZ), mode='wrap')
    along = num / np.maximum(den, 1e-3)[..., None]
    fine = med * 0.5 + along * 0.5
    bnum = ndi.gaussian_filter(med * valid[..., None], (6, BROAD, 0), mode=('nearest', 'wrap', 'nearest'))
    bden = ndi.gaussian_filter(valid, (6, BROAD), mode=('nearest', 'wrap'))
    broad = bnum / np.maximum(bden, 1e-3)[..., None]
    k = measure.NR // 10
    lo = broad[:k].mean(0)
    hi = broad[-k:].mean(0)
    t = np.clip((np.arange(measure.NR) - k / 2) / (measure.NR - k), 0, 1)[:, None, None]
    base = np.minimum(lo, hi)[None] * 0.5 + 0 * t
    glow = np.maximum(broad - base * 0, 0)
    strands = np.maximum(fine - broad - FLOOR, 0)
    tint = np.array(TINT)
    glow = glow.mean(-1, keepdims=True) * tint / tint.mean() * 0.7 + glow * 0.3
    strands = (strands.mean(-1, keepdims=True) * 0.6 + strands * 0.4) * STRAND
    med = glow + strands
    phase = 1 + FORWARD * np.maximum(dn @ geo.SUN, 0) ** POWER
    med = med / phase[..., None]
    if len(sys.argv) > 3:
        again = geo.decode(cv2.imread(sys.argv[3])[:, :, ::-1])
        again = cv2.resize(again.astype(np.float32), (hero.shape[1], hero.shape[0]), interpolation=cv2.INTER_CUBIC)
        E = measure.unwrap(hero - again)[0]
        E = ndi.median_filter(E, size=(1, 7, 1), mode='wrap')
        enum = ndi.gaussian_filter(E * valid[..., None], (6, BROAD, 0), mode=('nearest', 'wrap', 'nearest'))
        rest = enum / np.maximum(bden, 1e-3)[..., None]
        rest = rest.mean(-1, keepdims=True) * tint / tint.mean() * 0.7 + rest * 0.3
        print('second pass rest p10 p50 p90', np.percentile(rest[..., 2][valid > 0.5], [10, 50, 90]))
        med = np.maximum(med + rest / phase[..., None], 0)
    az = (np.arange(measure.NA) + 0.5) / measure.NA * 360 - 180
    prof = (med * valid[..., None]).sum(1) / np.maximum(valid.sum(1), 1e-3)[:, None]
    prof = ndi.gaussian_filter(prof, (1.5, 0)) * 0.8
    rr = (np.arange(measure.NR) + 0.5) / measure.NR
    taper = (step(rr, 0.0, 0.08) * (1 - step(rr, 0.92, 1.0)))[:, None, None]
    full = med * valid[..., None] + prof[:, None, :] * (1 - valid[..., None])
    full = full * taper
    print('ring level p50 p99 max', np.percentile(full[..., 2], 50), np.percentile(full[..., 2], 99), full.max(), 'valid', float((valid > 0.5).mean()))
    full = np.nan_to_num(np.maximum(full, 0))
    code = np.clip(np.sqrt(full / SCALE), 0, 1)
    img = (code[::-1, :, ::-1] * 255 + 0.5).astype(np.uint8)
    cv2.imwrite(out + '/full/ring.png', img, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    cv2.imwrite(out + '/web/ring.png', cv2.resize(img, (measure.NA // 2, measure.NR // 2), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_PNG_COMPRESSION, 9])
    vis = np.clip(full * 60, 0, 1) ** 0.5
    cv2.imwrite('out/work/nep/ring/map.jpg', (vis[::-1, :, ::-1] * 255).astype(np.uint8))
    cv2.imwrite('out/work/nep/ring/valid.jpg', (valid[::-1] * 255).astype(np.uint8))


main()
