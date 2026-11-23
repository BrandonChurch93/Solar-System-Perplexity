import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom
from layback import ROOT

WORK = os.path.join(ROOT, 'out', 'work', 'jupiter', 'deck')


def image_height(gain, sigma_px=120.0, reach=14.0):
    d = np.fromfile(os.path.join(WORK, 'close-depth.raw'), dtype='<f4').reshape(geom.H, geom.W).astype(np.float64)
    ys, xs = np.mgrid[0:geom.H, 0:geom.W]
    r = geom.rays(xs, ys)
    t = geom.hit(r)
    ground = np.isfinite(t)
    fit = ground & (t < 12)
    a, b = np.linalg.lstsq(np.stack([d[fit], np.ones(fit.sum())], 1), 1 / t[fit], rcond=None)[0]
    est = 1 / np.maximum(a * d + b, 1e-3)
    ts = np.where(ground, t, 1.0)
    logr = np.log(est / ts) * ground
    w = ground.astype(np.float64)
    lp = cv2.GaussianBlur(logr, (0, 0), sigma_px) / np.maximum(cv2.GaussianBlur(w, (0, 0), sigma_px), 1e-3)
    hp = (logr - lp) * ground
    fade = np.clip((reach - ts) / (reach * 0.5), 0, 1)
    p = r * (ts * np.exp(gain * hp * fade))[..., None]
    h = np.linalg.norm(p - geom.CENTRE, axis=-1) - geom.R
    h = np.where(ground, h, 0.0)
    return h.astype(np.float32), ground


if __name__ == '__main__':
    h, ground = image_height(1.0)
    print('height of the seen surface over the sphere, gain 1: pcts', np.round(np.percentile(h[ground], [0.5, 5, 25, 50, 75, 95, 99.5]), 4))
    cv2.imwrite(os.path.join(WORK, 'image-height.png'), (np.clip(0.5 + h * 3, 0, 1) * 255).astype(np.uint8))
