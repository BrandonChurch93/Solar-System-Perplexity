import sys

import cv2
import numpy as np
from PIL import Image

SRC = 'references/approved/mercury-close.jpg'
WORK = 'out/work/mercury/relief/'
W, H = 2816, 1584
ML, MB = 640, 348
CW, CH = W + 2 * ML, H + MB
KEY = (255, 0, 255)
PIECES = {'left': (0, 0, CH, CH), 'right': (CW - CH, 0, CH, CH), 'bottom': (1242, CH - 907, 1612, 907)}
GAP = (1700, 2400)


def canvas():
    c = np.zeros((CH, CW, 3), np.uint8)
    c[:] = KEY
    c[:H, ML:ML + W] = np.asarray(Image.open(SRC).convert('RGB'))
    return c


def known(c):
    return ~((c[..., 0] > 200) & (c[..., 1] < 90) & (c[..., 2] > 200))


def fit_take(path, box, base):
    x, y, w, h = box
    take = np.asarray(Image.open(path).convert('RGB').resize((w, h), Image.LANCZOS)).astype(np.float32)
    ref = base[y:y + h, x:x + w].astype(np.float32)
    k = known(base[y:y + h, x:x + w])
    a = cv2.cvtColor(np.clip(ref, 0, 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    b = cv2.cvtColor(np.clip(take, 0, 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    f = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 5, 31, 5, 7, 1.5, 0)
    mag = np.hypot(f[..., 0], f[..., 1])[k]
    print(path, 'flow in the known part: median %.2f p90 %.2f p99 %.2f px' % (np.median(mag), np.percentile(mag, 90), np.percentile(mag, 99)))
    kf = cv2.erode(k.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32)
    w8 = cv2.GaussianBlur(kf, (0, 0), 40) + 1e-4
    for ch in range(3):
        gain = (cv2.GaussianBlur(ref[..., ch] * kf, (0, 0), 40) / w8 + 4) / (cv2.GaussianBlur(take[..., ch] * kf, (0, 0), 40) / w8 + 4)
        near = np.clip(cv2.GaussianBlur(kf, (0, 0), 60) * 3, 0, 1)
        take[..., ch] *= 1 + (np.clip(gain, 0.6, 1.6) - 1) * near
    return np.clip(take, 0, 255)


def comp(names):
    c = canvas()
    out = c.astype(np.float32)
    done = known(c)
    for n in names:
        name, take = n.split('=')
        x, y, w, h = PIECES[name]
        t = fit_take(take, PIECES[name], np.where(done[..., None], out, np.array(KEY, np.float32)).astype(np.uint8))
        region = np.zeros((CH, CW), np.float32)
        region[y:y + h, x:x + w] = 1
        if name == 'bottom':
            region[:, :GAP[0]] = 0
            region[:, GAP[1]:] = 0
            region[:H] = 0
            region = cv2.GaussianBlur(region, (0, 0), 30)
            region[:H] = 0
        else:
            region[done] = 0
        full = np.zeros_like(out)
        full[y:y + h, x:x + w] = t
        out = out * (1 - region[..., None]) + full * region[..., None]
        done |= region > 0.5
    out[:H, ML:ML + W] = c[:H, ML:ML + W]
    return np.clip(out, 0, 255).astype(np.uint8), done


if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'prep':
        c = canvas()
        for name in ('left', 'right'):
            x, y, w, h = PIECES[name]
            Image.fromarray(c[y:y + h, x:x + w]).save(WORK + name + '-in.jpg', quality=95)
    elif mode == 'prepbottom':
        out, done = comp(sys.argv[2:])
        x, y, w, h = PIECES['bottom']
        piece = out[y:y + h, x:x + w].copy()
        gx0, gx1 = GAP[0] - x, GAP[1] - x
        piece[H - y:, gx0:gx1] = KEY
        Image.fromarray(piece).save(WORK + 'bottom-in.jpg', quality=95)
    elif mode == 'comp':
        out, done = comp(sys.argv[3:])
        print('filled', float(done.mean()))
        Image.fromarray(out).save(sys.argv[2])
