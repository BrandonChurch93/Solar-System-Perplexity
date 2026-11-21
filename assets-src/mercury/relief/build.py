import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/relief')
import geom

WORK = 'out/work/mercury/relief/'
OUT = 'public/assets/mercury/'
GAIN = float(os.environ.get('RELIEF_GAIN', '1.6'))
WIDE = 300
NEAR, FARFADE = 3.5, 7.0
DIST_SCALE = 0.25
W, H, ML, MB, CW, CH = geom.W, geom.H, geom.ML, geom.MB, geom.CW, geom.CH


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def horizon():
    im = np.asarray(Image.open(WORK + 'ext-2816.png').convert('RGB')).astype(np.float32).mean(2)
    gy = cv2.Sobel(cv2.GaussianBlur(im, (0, 0), 1.5), cv2.CV_32F, 0, 1, ksize=3)
    model = geom.horizon_y()
    off = np.zeros(CW)
    for x in range(CW):
        y0 = int(model[x])
        a, b = max(0, y0 - 40), min(CH - 1, y0 + 40)
        off[x] = a + int(np.argmax(gy[a:b, x])) - y0
    off = cv2.medianBlur(off.astype(np.float32).reshape(1, -1), 5).ravel()
    k = 151
    med = np.array([np.median(off[max(0, i - k // 2):i + k // 2 + 1]) for i in range(CW)])
    med = cv2.GaussianBlur(med.reshape(1, -1), (0, 0), 24).ravel()
    xs = np.arange(CW)
    inside = smooth(ML - 96, ML, xs) * (1 - smooth(ML + W, ML + W + 96, xs))
    return np.maximum(med * (1 - inside), 0)


def main():
    drop = horizon()
    print('horizon drop in the margins, px at 2816: left max %.1f right max %.1f' % (drop[:ML].max(), drop[ML + W:].max()))
    depth = np.fromfile(WORK + 'ext-depth.raw', np.float32).reshape(CH, CW)
    d = geom.rays()
    t, hit, _ = geom.ground(d)
    yy = np.arange(CH)[:, None] + 0.5
    hy = geom.horizon_y()[None, :] + drop[None, :]
    land = hit & (yy > hy + 2)
    b = 1 / geom.FAR
    ok = land & (depth > 0.02) & (t < 0.8 * geom.FAR)
    x = np.log(depth[ok])
    y = np.log(1 / t[ok] - b)
    keep = np.ones(x.shape, bool)
    for _ in range(4):
        g, la = np.polyfit(x[keep], y[keep], 1)
        r = y - (g * x + la)
        keep = np.abs(r) < 2.0 * np.std(r[keep])
    a = float(np.exp(la))
    fit = 1 / (a * np.power(np.maximum(depth, 1e-3), g) + b)
    detail = np.where(land, np.log(fit) - np.log(t), 0).astype(np.float32)
    lt = np.log(t)
    edges = np.linspace(lt[land].min(), lt[land].max() + 1e-6, 49)
    mids, meds = [], []
    for i in range(48):
        sel = land & (lt >= edges[i]) & (lt < edges[i + 1])
        if sel.sum() > 200:
            mids.append((edges[i] + edges[i + 1]) / 2)
            meds.append(float(np.median(detail[sel])))
    detail = np.where(land, detail - np.interp(lt, mids, meds), 0).astype(np.float32)
    wt = land.astype(np.float32)
    low = cv2.GaussianBlur(detail * wt, (0, 0), WIDE) / np.maximum(cv2.GaussianBlur(wt, (0, 0), WIDE), 1e-3)
    fade = 1 - smooth(NEAR, FARFADE, t)
    relief = np.clip((detail - low) * GAIN, -0.4, 0.4) * fade * wt
    relief = cv2.GaussianBlur(relief.astype(np.float32), (0, 0), 2.0)
    dist = (t * np.exp(relief)).astype(np.float32)
    dist[~hit] = geom.FAR
    print('fit a %.5f g %.5f b %.5f; residual rms %.3f; relief p1 %.3f p99 %.3f' % (a, g, b, float(np.std(r[keep])), float(np.percentile(relief[land], 1)), float(np.percentile(relief[land], 99))))
    json.dump({'a': a, 'g': float(g), 'b': b, 'gain': GAIN, 'wide': WIDE}, open('assets-src/mercury/relief/depth-curve.json', 'w'), indent=1)
    np.save(WORK + 'relief-detail.npy', relief)
    vis = np.clip(0.5 + relief / 0.5, 0, 1)
    Image.fromarray((vis * 255).astype(np.uint8)).save(WORK + 'relief-detail.png')
    color = Image.open(WORK + 'ext-2x.png').convert('RGB')
    assert color.size == (CW * 2, CH * 2), color.size
    hy2 = np.interp((np.arange(CW * 2) + 0.5) / 2, np.arange(CW) + 0.5, geom.horizon_y() + drop)
    y2 = (np.arange(CH * 2)[:, None] + 0.5) / 2
    slope = np.gradient(hy2) * 2
    alpha = smooth(-0.9, 0.9, (y2 - hy2[None, :]) / np.sqrt(1 + slope[None, :] ** 2))
    alpha8 = (alpha * 255 + 0.5).astype(np.uint8)
    for name, s in (('full', 1.0), ('web', 0.5)):
        os.makedirs(OUT + name, exist_ok=True)
        cw, ch = int(CW * 2 * s), int(CH * 2 * s)
        c = color if s == 1 else color.resize((cw, ch), Image.BOX)
        c.save(OUT + name + '/relief-color.jpg', quality=93 if s == 1 else 90, subsampling=0)
        al = Image.fromarray(alpha8)
        (al if s == 1 else al.resize((cw, ch), Image.BOX)).save(OUT + name + '/relief-alpha.png', optimize=True)
        dw, dh = int(cw * DIST_SCALE), int(ch * DIST_SCALE)
        dm = np.exp(cv2.resize(np.log(dist), (dw, dh), interpolation=cv2.INTER_AREA)).astype('<f4')
        dm.tofile(OUT + name + '/relief-dist.bin')
        Image.new('RGB', (16, 16), (0, 0, 0)).save(OUT + name + '/relief-masks.png')
        print(name, 'color', (cw, ch), 'dist', (dw, dh))
    dw, dh = int(CW * 2 * DIST_SCALE), int(CH * 2 * DIST_SCALE)
    out = {
        'imageSize': {'full': [W * 2, H * 2], 'web': [W, H]},
        'vfovDeg': 60,
        'box': {'full': [-ML * 2, 0, CW * 2, CH * 2], 'web': [-ML, 0, CW, CH]},
        'distSize': {'full': [dw, dh], 'web': [dw // 2, dh // 2]},
        'files': {'color': 'relief-color.jpg', 'alpha': 'relief-alpha.png', 'dist': 'relief-dist.bin', 'masks': 'relief-masks.png'},
        'camera': {'pitchDownDeg': abs(geom.FIT['pitchDownDeg']), 'rollDeg': abs(geom.FIT['rollDeg']), 'dipDeg': geom.FIT['dipDeg'], 'up': geom.FIT['up'], 'planetRadius': geom.R, 'horizonDistance': geom.FAR},
    }
    json.dump(out, open('src/stops/mercury/relief.json', 'w'), indent=1)


if __name__ == '__main__':
    main()
