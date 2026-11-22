import json
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/relief')
sys.path.insert(0, 'assets-src/mercury/wrap')
import geo
import geom

Image.MAX_IMAGE_PIXELS = None
WORK = 'out/work/mercury/relief/'
TAKES = 'out/work/mercury/walls/'
BOX = (1344, 720, 2880, 1584)
SIGMA = 8.0
EPS = 0.004
LIT = (0.006, 0.03)
AGREE = (0.18, 0.45)
BORDER = 160.0
FLOOR = [(1000, 480), (1300, 420), (1700, 430), (1900, 560), (2050, 800), (2100, 1000), (2000, 1120), (1700, 1100), (1300, 1050), (1050, 900), (950, 700)]
FLOOR_SOFT = 30
PLAIN = [(1500, 0), (3072, 0), (3072, 900), (2960, 900), (2840, 680), (2600, 440), (2330, 300), (2080, 190), (1820, 60)]
TINT = 3.0
TILE = (1536, 864)
SHOWN = (1024, 576)
TILES = {'a': (1536, 200), 'b': (0, 560), 'c': (1236, 800)}


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def box2x():
    x0, y0, x1, y1 = BOX
    return ((geom.ML + x0) * 2, y0 * 2, (geom.ML + x1) * 2, y1 * 2)


def luma(img):
    return geo.to_linear(np.asarray(img).astype(np.float32) / 255) @ geo.LUMA


def prep():
    crop = Image.open(WORK + 'ext-2x.png').convert('RGB').crop(box2x())
    crop.save(TAKES + 'in.png')
    for name, (x, y) in TILES.items():
        t = crop.crop((x, y, x + TILE[0], y + TILE[1]))
        t.save(TAKES + 'tile-%s.png' % name)
        t.resize(SHOWN, Image.LANCZOS).save(TAKES + 'tile-%s-in.jpg' % name, quality=95, subsampling=0)
    print('walls in', crop.size, 'tiles', list(TILES))


def register(a, b):
    h, w = a.shape[:2]
    small = lambda v: cv2.resize(np.clip(geo.to_srgb(v) * 255, 0, 255).astype(np.uint8), (w // 2, h // 2), interpolation=cv2.INTER_AREA)
    f = cv2.calcOpticalFlowFarneback(small(a), small(b), None, 0.5, 6, 31, 5, 7, 1.5, 0) * 2
    mag = np.hypot(f[..., 0], f[..., 1])
    stats = (float(np.median(mag)), float(np.percentile(mag, 90)), float(np.percentile(mag, 99)))
    f = cv2.GaussianBlur(f, (0, 0), 10)
    return cv2.resize(f[..., 0], (w, h), interpolation=cv2.INTER_LINEAR), cv2.resize(f[..., 1], (w, h), interpolation=cv2.INTER_LINEAR), stats


def comp(takes, strength):
    base = Image.open(TAKES + 'in.png').convert('RGB')
    w, h = base.size
    blur = lambda v, s: cv2.GaussianBlur(v, (0, 0), s)
    la = luma(base)
    loga = np.log(la + EPS)
    higha = loga - blur(loga, SIGMA)
    num = np.zeros((h, w), np.float32)
    den = np.zeros((h, w), np.float32)
    have = np.zeros((h, w), np.float32)
    tw, th = TILE
    xx, yy = np.meshgrid(np.arange(tw, dtype=np.float32), np.arange(th, dtype=np.float32))
    edge = smooth(0, BORDER, np.minimum(np.minimum(xx, tw - 1 - xx), np.minimum(yy, th - 1 - yy)))
    for name, take in takes.items():
        x, y = TILES[name]
        t = np.asarray(Image.open(take).convert('RGB').resize(TILE, Image.LANCZOS))
        part = la[y:y + th, x:x + tw]
        for k in range(2):
            fx, fy, st = register(part, luma(t))
            print(name, take, 'pass %d, flow against the approved pixels: median %.2f p90 %.2f p99 %.2f px of %d' % ((k,) + st + (tw,)))
            t = cv2.remap(t, xx + fx, yy + fy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        Image.fromarray(t).save(TAKES + 'fit-%s.png' % name)
        logg = np.log(luma(t) + EPS)
        lowg = blur(logg, SIGMA)
        gap = blur(np.abs(lowg - blur(loga, SIGMA)[y:y + th, x:x + tw]), SIGMA)
        agree = 1 - smooth(AGREE[0], AGREE[1], gap)
        print(name, 'agreement mean %.3f' % float(agree.mean()))
        wt = edge ** 3
        num[y:y + th, x:x + tw] += (logg - lowg) * agree * wt
        den[y:y + th, x:x + tw] += wt
        have[y:y + th, x:x + tw] = np.maximum(have[y:y + th, x:x + tw], edge)
    lit = smooth(LIT[0], LIT[1], np.exp(blur(loga, 3.0)) - EPS)
    off = np.zeros((h, w), np.uint8)
    cv2.fillPoly(off, [np.array(FLOOR, np.int32), np.array(PLAIN, np.int32)], 255)
    region = 1 - blur(off.astype(np.float32) / 255, FLOOR_SOFT)
    g = num / np.maximum(den, 1e-4)
    m = lit * region * have * strength
    src = np.asarray(base).astype(np.float32) / 255
    lin = geo.to_linear(src)
    tint = blur(lin, TINT) / np.maximum(blur(la, TINT), 1e-5)[..., None]
    new = tint * np.maximum(np.exp(loga - higha + g) - EPS, 0)[..., None]
    mix = lin * (1 - m[..., None]) + new * m[..., None]
    out = np.where(m[..., None] > 0, np.clip(geo.to_srgb(mix), 0, 1) * 255 + 0.5, np.asarray(base)).astype(np.uint8)
    Image.fromarray(out).save(WORK + 'walls-2x.png')
    json.dump({'box': box2x(), 'takes': takes, 'strength': strength, 'sigma': SIGMA}, open(WORK + 'walls-2x.json', 'w'))
    on = m > 0.5 * strength
    diff = np.abs(out.astype(np.float32) - np.asarray(base)).mean(-1)
    print('weight: mean %.3f, over half on %.1f percent of the crop; mean change inside it %.2f codes; low pass of the change at %.0f px, rms %.2f codes' % (float(m.mean()), 100 * float(on.mean()), float(diff[on].mean()), 4 * SIGMA, float(np.sqrt((blur(out.astype(np.float32).mean(-1) - np.asarray(base).astype(np.float32).mean(-1), 4 * SIGMA)[on] ** 2).mean()))))
    Image.fromarray((m * 255 / max(strength, 1e-6)).astype(np.uint8)).save(TAKES + 'weight.png')


def paint(color):
    box = json.load(open(WORK + 'walls-2x.json'))['box']
    color = color.copy()
    color.paste(Image.open(WORK + 'walls-2x.png').convert('RGB'), tuple(box[:2]))
    print('wall detail painted')
    return color


if __name__ == '__main__':
    if sys.argv[1] == 'prep':
        prep()
    else:
        pairs = dict(a.split('=') for a in sys.argv[2:] if '=' in a)
        rest = [a for a in sys.argv[2:] if '=' not in a]
        comp(pairs, float(rest[0]) if rest else 1.0)
