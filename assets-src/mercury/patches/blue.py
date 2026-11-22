import json
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CFG = json.loads((HERE / 'patches.json').read_text())
AT = (16.36, -5.94)
REACH = 0.04
BLUE = (0.22, 0.5)
GROW = 0.0025
BAND = (1.5, 6.0)
CALM = 0.8
LUM = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def direction(lon, lat):
    lo, la = np.radians(lon), np.radians(lat)
    return np.array([np.cos(la) * np.sin(lo), np.sin(la), np.cos(la) * np.cos(lo)])


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def repair(im, half):
    n = np.array(CFG['spot']['direction'])
    e = np.cross([0, 1, 0], n)
    e /= np.linalg.norm(e)
    u = np.cross(n, e)
    d = direction(*AT)
    g = np.array([d @ e, d @ u]) / (d @ n)
    w = im.shape[0]
    cx = (0.5 + g[0] / (2 * half)) * w
    cy = (0.5 - g[1] / (2 * half)) * w
    r = REACH / (2 * half) * w
    x0, x1, y0, y1 = max(int(cx - r), 0), min(int(cx + r) + 1, w), max(int(cy - r), 0), min(int(cy + r) + 1, w)
    box = im[y0:y1, x0:x1].astype(np.float32) / 255
    ys, xs = np.mgrid[y0:y1, x0:x1]
    far = np.hypot(xs + 0.5 - cx, ys + 0.5 - cy) / r
    lum = box @ LUM
    tone = box / np.maximum(lum[..., None], 1e-3)
    blue = tone[..., 2] - tone[..., 0]
    ring = (far > 0.6) & (far < 1) & (lum > 0.15)
    ref = np.median(tone[ring], axis=0)
    base = float(np.median(blue[ring]))
    k = max(GROW / (2 * half) * w, 1.0)
    mask = smooth(BLUE[0], BLUE[1], blue - base).astype(np.float32)
    mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(2 * k) | 1, int(2 * k) | 1)))
    mask = cv2.GaussianBlur(mask, (0, 0), k) * (1 - smooth(0.6, 0.95, far)).astype(np.float32)
    flat = lum - CALM * (cv2.GaussianBlur(lum, (0, 0), BAND[0] * k) - cv2.GaussianBlur(lum, (0, 0), BAND[1] * k))
    out = box + (flat[..., None] * ref - box) * mask[..., None]
    res = im.copy()
    res[y0:y1, x0:x1] = np.clip(np.round(out * 255), 0, 255).astype(np.uint8)
    return res, (x0, y0, x1, y1), float(mask.mean())


def main():
    dry = len(sys.argv) > 1
    for p in CFG['patches'][:3]:
        for key in ('full', 'web'):
            path = ROOT / 'public/assets' / p['files'][key]
            im = np.asarray(Image.open(path).convert('RGB'))
            res, box, share = repair(im, p['halfTan'])
            x0, y0, x1, y1 = box[0] // 8 * 8, box[1] // 8 * 8, -(-box[2] // 8) * 8, -(-box[3] // 8) * 8
            if dry:
                Image.fromarray(res).save(Path(sys.argv[1]) / (p['id'] + '-' + key + '.png'))
            else:
                import jpeglib
                whole = jpeglib.read_dct(str(path))
                with tempfile.TemporaryDirectory() as tmp:
                    part = str(Path(tmp) / 'part.jpg')
                    Image.fromarray(res[y0:y1, x0:x1]).save(part, quality=94, subsampling=0)
                    cut = jpeglib.read_dct(part)
                if not np.array_equal(cut.qt, whole.qt):
                    raise SystemExit('quantisation tables differ in ' + str(path))
                whole.Y[y0 // 8:y1 // 8, x0 // 8:x1 // 8] = cut.Y
                whole.Cb[y0 // 8:y1 // 8, x0 // 8:x1 // 8] = cut.Cb
                whole.Cr[y0 // 8:y1 // 8, x0 // 8:x1 // 8] = cut.Cr
                whole.write_dct(str(path))
                back = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
                diff = np.abs(back - im.astype(np.int16)).max(axis=2)
                inside = int((diff[y0:y1, x0:x1] > 2).sum())
                diff[y0:y1, x0:x1] = 0
                print(p['id'], key, 'pixels changed outside the box', int((diff > 0).sum()), 'inside over 2 codes', inside)
            print(p['id'], key, 'box', (x0, y0, x1, y1), 'mask share %.3f' % share)


if __name__ == '__main__':
    sys.exit(main())
