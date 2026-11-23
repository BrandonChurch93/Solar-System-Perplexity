import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom
from layback import ROOT, approved_scene, blur_to, canvas_display, filmic, grid, linear_to_srgb
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
    soft, den = blur_to(rgb, seen.astype(np.float32), sig) if name != 'fore' else (rgb, None)
    hsoft, _ = blur_to(h, seen.astype(np.float32), np.maximum(sig, m.get('heightBlur', CFG['tool']['heightBlur']) / step))
    np.save(os.path.join(WORK, name + '-rgb.npy'), soft.astype(np.float32))
    np.save(os.path.join(WORK, name + '-h.npy'), hsoft.astype(np.float32))
    np.save(os.path.join(WORK, name + '-trust.npy'), trust)
    np.save(os.path.join(WORK, name + '-resolved.npy'), resolved.astype(np.float32))
    show = (linear_to_srgb(filmic(soft)) * 255).astype(np.uint8)
    show[trust <= 0] = show[trust <= 0] // 3
    cv2.imwrite(os.path.join(WORK, name + '-lay.png'), show[::-1, :, ::-1])
    cv2.imwrite(os.path.join(WORK, name + '-h.png'), (np.clip(0.5 + hsoft[::-1] * 2.5 / max(CFG['tool']['heightGain'], 1e-6), 0, 1) * 255).astype(np.uint8))
    print(name, 'seen', round(float(seen.mean()), 3), 'trusted', round(float((trust > 0.5).mean()), 3), 'fixed point error p99', round(float(np.percentile(err[seen], 99)), 4), 'height pcts', np.round(np.percentile(hsoft[seen], [1, 50, 99]), 3))


def box(x, r):
    return cv2.blur(x, (2 * r + 1, 2 * r + 1), borderType=cv2.BORDER_REFLECT)


def guided(guide, p, r, eps):
    mean = [box(guide[..., c], r) for c in range(3)]
    mp = box(p, r)
    cov = [box(guide[..., c] * p, r) - mean[c] * mp for c in range(3)]
    var = {(a, b): box(guide[..., a] * guide[..., b], r) - mean[a] * mean[b] for a in range(3) for b in range(a, 3)}
    a11, a12, a13, a22, a23, a33 = var[(0, 0)] + eps, var[(0, 1)], var[(0, 2)], var[(1, 1)] + eps, var[(1, 2)], var[(2, 2)] + eps
    det = a11 * (a22 * a33 - a23 * a23) - a12 * (a12 * a33 - a23 * a13) + a13 * (a12 * a23 - a22 * a13)
    i11, i12, i13 = (a22 * a33 - a23 * a23) / det, (a13 * a23 - a12 * a33) / det, (a12 * a23 - a13 * a22) / det
    i22, i23, i33 = (a11 * a33 - a13 * a13) / det, (a12 * a13 - a11 * a23) / det, (a11 * a22 - a12 * a12) / det
    k = [i11 * cov[0] + i12 * cov[1] + i13 * cov[2], i12 * cov[0] + i22 * cov[1] + i23 * cov[2], i13 * cov[0] + i23 * cov[1] + i33 * cov[2]]
    rest = mp - k[0] * mean[0] - k[1] * mean[1] - k[2] * mean[2]
    return (box(k[0], r) * guide[..., 0] + box(k[1], r) * guide[..., 1] + box(k[2], r) * guide[..., 2] + box(rest, r)).astype(np.float32)


if __name__ == '__main__':
    scene = approved_scene()
    himg, _ = image_height(CFG['tool']['heightGain'], CFG['tool']['reliefSigmaPx'], CFG['tool']['reliefReach'])
    snapped = None
    for name in sys.argv[1:] or list(CFG['maps']):
        m = CFG['maps'][name]
        src = himg
        if 'edgeGuide' in m:
            if snapped is None:
                snapped = guided(canvas_display().astype(np.float32), himg, int(m['edgeGuide'][0]), m['edgeGuide'][1])
            src = snapped
        build(name, scene, cv2.GaussianBlur(src, (0, 0), m.get('depthBlurPx', CFG['tool']['depthBlurPx'])))
