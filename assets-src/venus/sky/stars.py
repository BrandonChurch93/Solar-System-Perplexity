import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
SRC = HERE / 'uncorrected'
OUT = 'public/assets/venus'
CORE = (2816, 1584)
FOOT = 0.8
QUANT = [30, 50, 70, 85, 92, 96, 98, 99, 99.5, 99.8, 99.9, 99.95, 99.99]
LIMIT = (0.4, 1.1)
RING = (1.1, 1.25)
LUMA = np.array([0.299, 0.587, 0.114], np.float32)
VIEWS = {
    'hold': dict(file='sky-hold.webp', ref='references/approved/venus-hero.png', over=120, disc=(1481, 787, 670)),
    'terrain': dict(file='sky-terrain.webp', ref='references/approved/venus-close.jpg', over=100, glow=(55.0, 100.0, 2.0)),
}
CALM = (31, 24.0)


def to_linear(a):
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def to_srgb(a):
    a = np.clip(a, 0, 1)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def unfilm(y):
    y = np.clip(y, 0, 0.985)
    ca, cb, cc, cd, ce = 2.51, 0.03, 2.43, 0.59, 0.14
    kk = cd * y - cb
    return (-kk - np.sqrt(np.maximum(kk * kk - 4 * (cc * y - ca) * ce * y, 0))) / (2 * (cc * y - ca))


def film(x):
    x = np.maximum(x, 0)
    return np.clip(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1)


def scene_of(level):
    return unfilm(to_linear(np.asarray(level, np.float64) / 255))


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def region(view, w=1920, h=1080):
    yy, xx = np.mgrid[0:h, 0:w]
    if view == 'hold':
        k = w / 2816
        return (np.hypot(xx - 1481 * k, yy - 787 * k) > 670 * k * 1.25) & (xx > 20 * w / 1920) & (xx < 1900 * w / 1920) & (yy > 20 * h / 1080) & (yy < 1060 * h / 1080)
    return (xx < 600 * w / 1920) & (yy < 260 * h / 1080)


def seen(patch):
    lin = to_linear(patch.astype(np.float32) / 255)
    return (to_srgb(cv2.GaussianBlur(lin, (0, 0), FOOT)) * 255) @ LUMA


def dark(view, shape, x0, y0):
    v = VIEWS[view]
    if 'glow' not in v:
        return np.ones(shape, np.float32)
    sys.path.insert(0, str(HERE.parent / 'relief'))
    import cam
    ref = np.asarray(Image.open(v['ref']).convert('RGB')).astype(np.float32) @ LUMA
    yy, xx = np.mgrid[0:cam.AH, 0:cam.AW]
    el = cam.elevation(cam.rays(xx + 0.5 + cam.MX, yy + 0.5))
    last = np.maximum((el > v['glow'][2]).sum(0) - 1, 0)
    held = ref[np.minimum(yy, last[None, :]), xx]
    back = cv2.GaussianBlur(cv2.medianBlur(np.clip(held + 0.5, 0, 255).astype(np.uint8), CALM[0]).astype(np.float32), (0, 0), CALM[1])
    wide = cv2.copyMakeBorder(back, y0, shape[0] - y0 - cam.AH, x0, shape[1] - x0 - cam.AW, cv2.BORDER_REPLICATE)
    return (1 - smooth(v['glow'][0], v['glow'][1], wide)).astype(np.float32)


def state():
    p = HERE / 'stars.json'
    return json.loads(p.read_text()) if p.exists() else {}


def build(view):
    v = VIEWS[view]
    src = np.asarray(Image.open(SRC / v['file']).convert('RGB'))
    h, w = src.shape[:2]
    x0, y0 = (w - CORE[0]) // 2, (h - CORE[1]) // 2
    cur = state().get(view)
    if cur is None:
        gain = np.ones((h, w), np.float32)
    else:
        gain = np.interp(seen(src), cur['levels'], cur['gains']).astype(np.float32)
    yy, xx = np.mgrid[0:h, 0:w]
    out_x = np.maximum(np.maximum(x0 - xx, xx - (x0 + CORE[0] - 1)), 0) / max(x0, 1)
    out_y = np.maximum(np.maximum(y0 - yy, yy - (y0 + CORE[1] - 1)), 0) / max(y0, 1)
    fade = v.get('fade', state().get('fade', 0.5))
    weight = 1 - smooth(0, fade, np.maximum(out_x, out_y))
    if 'disc' in v:
        cx, cy, r = v['disc']
        weight = weight * smooth(RING[0] * r, RING[1] * r, np.hypot(xx - x0 - cx, yy - y0 - cy))
    gain = 1 + (gain - 1) * weight * dark(view, (h, w), x0, y0)
    lin = unfilm(to_linear(src.astype(np.float32) / 255)) * gain[..., None]
    res = (to_srgb(film(lin)) * 255 + 0.5).astype(np.uint8)
    img = Image.fromarray(np.where(np.abs(gain[..., None] - 1) < 1e-6, src, res))
    img.save(f'{OUT}/full/{v["file"]}', lossless=True, quality=90, method=6)
    img.resize((w // 2, h // 2), Image.LANCZOS).save(f'{OUT}/web/{v["file"]}', lossless=True, quality=90, method=6)
    print(view, 'gain min', float(gain.min()), 'mean', float(gain.mean()))


def stats(view, still):
    v = VIEWS[view]
    ref = cv2.resize(cv2.imread(v['ref']), (1920, 1080), interpolation=cv2.INTER_AREA).astype(np.float32)[..., ::-1] @ LUMA
    got = cv2.imread(still).astype(np.float32)[..., ::-1] @ LUMA
    m = region(view)
    return ref[m], got[m]


def fit(view, still, relax=1.0):
    v = VIEWS[view]
    a, b = stats(view, still)
    s = state()
    cur = s.get(view)
    if cur is None:
        src = np.asarray(Image.open(SRC / v['file']).convert('RGB'))
        h, w = src.shape[:2]
        x0, y0 = (w - CORE[0]) // 2, (h - CORE[1]) // 2
        u = seen(src)[y0:y0 + CORE[1], x0:x0 + CORE[0]][region(view, CORE[0], CORE[1])]
        cur = dict(levels=[float(x) for x in np.percentile(u, QUANT)], gains=[1.0] * len(QUANT), passes=0)
    ratio = scene_of(np.percentile(a, QUANT)) / scene_of(np.percentile(b, QUANT))
    cur['gains'] = [float(np.clip(g * r ** relax, LIMIT[0], LIMIT[1])) for g, r in zip(cur['gains'], ratio)]
    cur['passes'] += 1
    s[view] = cur
    s.setdefault('fade', 0.5)
    (HERE / 'stars.json').write_text(json.dumps(s, indent=1) + '\n')
    print('ratios', np.round(ratio, 3).tolist())
    print('gains ', np.round(cur['gains'], 3).tolist())


def check(view, still):
    v = VIEWS[view]
    a, b = stats(view, still)
    line = lambda l: 'p30 %.2f median %.2f p99 %.2f p99.9 %.2f over %d: %d' % (np.percentile(l, 30), np.median(l), np.percentile(l, 99), np.percentile(l, 99.9), v['over'], int((l > v['over']).sum()))
    print(view, 'approved', line(a))
    print(view, 'film    ', line(b), '| count ratio %.3f median %+.2f' % ((b > v['over']).sum() / (a > v['over']).sum(), np.median(b) - np.median(a)))


if __name__ == '__main__':
    mode, view = sys.argv[1], sys.argv[2]
    if mode == 'build':
        build(view)
    elif mode == 'fit':
        fit(view, sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else 1.0)
    else:
        check(view, sys.argv[3])
