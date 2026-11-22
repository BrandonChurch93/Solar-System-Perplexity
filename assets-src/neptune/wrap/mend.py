import json
import os
import numpy as np
import cv2
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
OUT = os.path.join(ROOT, 'public/assets/neptune')
WORK = os.path.join(ROOT, 'out/work/nep/mend')
X0, Y0, SIZE = 5000, 1900, 1024
ARC = [(2000, 5180), (2260, 5300), (2460, 5390), (2590, 5430)]
SEAM = (5448, 2595.0, -0.675)
REACH = (150, 300)
TOP = (2230, 2380)
STREAK = (5368, 2524, 95, 46, 30.0)
EDGE = 96
LOCAL = 8.0
BAND = 1.5
WIDE = 50.0


def run():
    cv2.setNumThreads(1)
    os.makedirs(WORK, exist_ok=True)
    wrap = np.asarray(Image.open(os.path.join(OUT, 'full/wrap.webp')).convert('RGBA'))
    H, W = wrap.shape[:2]
    pad = 256
    x0, y0, x1, y1 = X0 - pad, Y0 - pad, X0 + SIZE + pad, Y0 + SIZE + pad
    src = wrap[y0:y1, x0:x1, :3].astype(np.float32)
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
    arc = np.polyval(np.polyfit([a[0] for a in ARC], [a[1] for a in ARC], 2), yy)
    seam = SEAM[1] + SEAM[2] * (xx - SEAM[0])
    across = (yy - seam) / np.sqrt(1.0 + SEAM[2] * SEAM[2])
    above = np.clip((5.0 - across) / 3.0, 0, 1)
    right = np.clip((xx - arc + 12.0) / 8.0, 0, 1)
    top = np.clip((yy - TOP[0]) / (TOP[1] - TOP[0]), 0, 1)
    zone = above * right * top
    far = np.clip((xx - arc - REACH[0]) / 40.0, 0, 1)
    below = np.clip((across - 8.0) / 8.0, 0, 1) * np.clip((xx - arc - 40.0) / 40.0, 0, 1)
    known = np.maximum(far * right, below)
    lin = (src / 255.0) ** 2.2
    wide = cv2.GaussianBlur(lin * known[..., None], (0, 0), WIDE) / np.maximum(cv2.GaussianBlur(known, (0, 0), WIDE), 1e-4)[..., None]
    zl = np.maximum(cv2.GaussianBlur(zone, (0, 0), LOCAL), 1e-4)
    local = cv2.GaussianBlur(lin * zone[..., None], (0, 0), LOCAL) / zl[..., None]
    t = np.clip((arc + REACH[1] - xx) / (REACH[1] - REACH[0]), 0, 1)
    weight = zone * t * t * (3 - 2 * t)
    b = np.clip((12.0 - np.abs(across)) / 7.0, 0, 1)
    band = (b * b * (3 - 2 * b))[..., None]
    local = local * (1.0 - band) + cv2.GaussianBlur(lin, (0, 0), BAND) * band
    gain = np.clip(wide / np.maximum(local, 1e-5), 1.0 - 0.15 * band, 2.0)
    out = lin * (1.0 + (gain - 1.0) * weight[..., None])
    e = ((xx - STREAK[0]) / STREAK[2]) ** 2 + ((yy - STREAK[1]) / STREAK[3]) ** 2
    m = np.clip((1.0 - e) * 2.0, 0, 1)
    m = m * m * (3 - 2 * m)
    ring = 1.0 - np.clip((1.5 - e) * 2.0, 0, 1)
    around = cv2.GaussianBlur(out * ring[..., None], (0, 0), STREAK[4]) / np.maximum(cv2.GaussianBlur(ring, (0, 0), STREAK[4]), 1e-4)[..., None]
    lift = np.clip(around / np.maximum(cv2.GaussianBlur(out, (0, 0), 4.0), 1e-5), 1.0, 2.5)
    out = out * (1.0 + (lift - 1.0) * m[..., None])
    out8 = np.clip(np.round(np.clip(out, 0, 1) ** (1 / 2.2) * 255.0), 0, 255).astype(np.uint8)
    crop = out8[pad:pad + SIZE, pad:pad + SIZE]
    before = wrap[Y0:Y0 + SIZE, X0:X0 + SIZE, :3]
    d = np.minimum(np.minimum(np.arange(SIZE), SIZE - 1 - np.arange(SIZE))[None, :], np.minimum(np.arange(SIZE), SIZE - 1 - np.arange(SIZE))[:, None]).astype(np.float32)
    e = np.clip(d / EDGE, 0, 1)
    alpha = np.round(e * e * (3 - 2 * e) * 255).astype(np.uint8)
    changed = np.abs(crop.astype(np.int16) - before.astype(np.int16)).max(axis=2)
    rgba = np.dstack([crop, alpha])
    Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT, 'full/wrap-mend.webp'), quality=92, method=4, exact=True)
    Image.fromarray(cv2.resize(rgba, (SIZE // 2, SIZE // 2), interpolation=cv2.INTER_AREA), 'RGBA').save(os.path.join(OUT, 'web/wrap-mend.webp'), quality=88, method=4, exact=True)
    box = [X0 / W, 1 - (Y0 + SIZE) / H, (X0 + SIZE) / W, 1 - Y0 / H]
    json.dump({'box': box}, open(os.path.join(ROOT, 'src/stops/neptune/mend.json'), 'w'))
    cv2.imwrite(os.path.join(WORK, 'before-after.png'), np.hstack([before, crop])[..., ::-1])
    cv2.imwrite(os.path.join(WORK, 'weight.png'), np.round(weight[pad:pad + SIZE, pad:pad + SIZE] * 255).astype(np.uint8))
    edge = changed[alpha < 255]
    print('box', [round(b, 6) for b in box])
    print('texels changed by over 2 levels', int((changed > 2).sum()), 'largest', int(changed.max()), 'changed where the weight map is under 1:', int((edge > 2).sum()))
    for f in ('full/wrap-mend.webp', 'web/wrap-mend.webp'):
        print(f, os.path.getsize(os.path.join(OUT, f)))


if __name__ == '__main__':
    run()
