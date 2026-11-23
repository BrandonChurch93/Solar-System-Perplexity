import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom
from layback import ROOT, approved_scene, blur_to, filmic, grid, linear_to_srgb
from relief import WORK, image_height

CFG = json.load(open(os.path.join(ROOT, 'src', 'stops', 'jupiter', 'deck.json')))


def lay(scene, himg, cx, cy, size, n, rounds=8):
    gx, gy = grid(cx, cy, size, n)
    h = np.zeros_like(gx)
    for i in range(rounds):
        p = geom.from_chart(gx, gy, h)
        px, py = geom.project(p)
        seen_h = cv2.remap(himg, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        step = seen_h - h
        h = h + 0.6 * step
    p = geom.from_chart(gx, gy, h)
    px, py = geom.project(p)
    toc = p - geom.CENTRE
    up = toc / np.linalg.norm(toc, axis=-1, keepdims=True)
    dist = np.linalg.norm(p, axis=-1)
    graze = np.einsum('...k,...k->...', up, -p) / dist
    margin = 6
    seen = (p[..., 2] < 0) & (graze > 0.01) & (px >= margin) & (px <= geom.W - 1 - margin) & (py >= margin) & (py <= geom.H - 1 - margin)
    across = dist / geom.F
    along = across / np.maximum(graze, 1e-3)
    rgb = cv2.remap(scene, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return rgb, h.astype(np.float32), seen, along.astype(np.float32), np.abs(step).astype(np.float32)


def build(name, scene, himg):
    m = CFG['maps'][name]
    cx, cy = m['centre']
    size, n = m['size'], m['pixels']
    step = size / n
    rgb, h, seen, along, err = lay(scene, himg, cx, cy, size, n)
    resolved = np.maximum(along * CFG['tool']['resolveFactor'], CFG['tool']['minResolve'])
    trust = seen.astype(np.float32) * np.clip((CFG['tool']['trustTo'] - resolved) / (CFG['tool']['trustTo'] - CFG['tool']['trustFrom']), 0, 1)
    sig = resolved / step
    soft, den = blur_to(rgb, seen.astype(np.float32), sig)
    hsoft, _ = blur_to(h, seen.astype(np.float32), np.maximum(sig, CFG['tool']['heightBlur'] / step))
    np.save(os.path.join(WORK, name + '-rgb.npy'), soft.astype(np.float32))
    np.save(os.path.join(WORK, name + '-h.npy'), hsoft.astype(np.float32))
    np.save(os.path.join(WORK, name + '-trust.npy'), trust)
    np.save(os.path.join(WORK, name + '-resolved.npy'), resolved.astype(np.float32))
    show = (linear_to_srgb(filmic(soft)) * 255).astype(np.uint8)
    show[trust <= 0] = show[trust <= 0] // 3
    cv2.imwrite(os.path.join(WORK, name + '-lay.png'), show[::-1, :, ::-1])
    cv2.imwrite(os.path.join(WORK, name + '-h.png'), (np.clip(0.5 + hsoft[::-1] * 2.5 / max(CFG['tool']['heightGain'], 1e-6), 0, 1) * 255).astype(np.uint8))
    print(name, 'seen', round(float(seen.mean()), 3), 'trusted', round(float((trust > 0.5).mean()), 3), 'fixed point error p99', round(float(np.percentile(err[seen], 99)), 4), 'height pcts', np.round(np.percentile(hsoft[seen], [1, 50, 99]), 3))


if __name__ == '__main__':
    scene = approved_scene()
    himg, _ = image_height(CFG['tool']['heightGain'])
    himg = cv2.GaussianBlur(himg, (0, 0), CFG['tool']['depthBlurPx'])
    for name in sys.argv[1:] or ['near', 'far']:
        build(name, scene, himg)
