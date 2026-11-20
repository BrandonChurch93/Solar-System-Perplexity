import cv2
import numpy as np

from compose0 import lab, rgb


def blur_wrap(x, s):
    pad = int(3 * s) + 1
    y = np.concatenate([x[:, -pad:], x, x[:, :pad]], 1)
    y = cv2.GaussianBlur(y, (0, 0), s)
    return y[:, pad:-pad]


def push_pull(P, Wt, levels=10):
    stack = [(P, Wt)]
    for _ in range(levels):
        p, w = stack[-1]
        if min(w.shape) < 8:
            break
        stack.append((cv2.resize(p, (w.shape[1] // 2, w.shape[0] // 2), interpolation=cv2.INTER_AREA),
                      cv2.resize(w, (w.shape[1] // 2, w.shape[0] // 2), interpolation=cv2.INTER_AREA)))
    p, w = stack[-1]
    fill = p / np.maximum(w, 1e-6)[..., None]
    for p, w in reversed(stack[:-1]):
        up = cv2.resize(fill, (w.shape[1], w.shape[0]), interpolation=cv2.INTER_LINEAR)
        k = np.clip(w * 4, 0, 1)[..., None]
        fill = (p / np.maximum(w, 1e-6)[..., None]) * k + up * (1 - k)
    return fill


def merge(H, F, cf, sig=16, decay_deg=14.0):
    h, w = cf.shape
    s = 4
    Hl, Fl = lab(H), lab(F)
    loH = blur_wrap(Hl * cf[..., None], sig) / np.maximum(blur_wrap(cf, sig), 1e-4)[..., None]
    loF = blur_wrap(Fl, sig)
    hpH, hpF = Hl - loH, Fl - loF
    sdH = np.sqrt(blur_wrap(hpH[..., 0] ** 2 * cf, sig) / np.maximum(blur_wrap(cf, sig), 1e-4) + 0.05)
    sdF = np.sqrt(blur_wrap(hpF[..., 0] ** 2, sig) + 0.05)
    D = np.concatenate([loH - loF, np.log(sdH / sdF)[..., None]], -1)
    ws = (cf > 0.5).astype(np.float32)
    Ds = cv2.resize(D * ws[..., None], (w // s, h // s), interpolation=cv2.INTER_AREA)
    Ws = cv2.resize(ws, (w // s, h // s), interpolation=cv2.INTER_AREA)
    Dext = cv2.resize(push_pull(Ds, Ws), (w, h), interpolation=cv2.INTER_LINEAR)
    outside = (cf < 0.5).astype(np.uint8)
    pad = w // 8
    big = np.concatenate([outside[:, -pad:], outside, outside[:, :pad]], 1)
    dist = cv2.distanceTransform(big, cv2.DIST_L2, 5)[:, pad:-pad]
    deg = dist * 180.0 / h
    dec = np.exp(-(deg / decay_deg) ** 2)[..., None]
    Dext[..., 3] = np.clip(Dext[..., 3], -0.7, 0.7)
    Fl2 = loF + Dext[..., :3] * dec + hpF * np.exp(Dext[..., 3:] * dec)
    F2 = rgb(Fl2)
    return F2
