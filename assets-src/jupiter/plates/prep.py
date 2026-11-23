import json
import os
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import globe as G
from globe import ROOT, STOP
import place as P
import fields as F
from layback import approved_scene, blur_to, filmic, inverse_filmic, linear_to_srgb, srgb_to_linear
from relief import image_height

CFG = json.load(open(os.path.join(STOP, 'deck.json')))
PLACE = json.load(open(os.path.join(STOP, 'place.json')))
GEN = os.path.join(ROOT, 'out', 'work', 'jupiter', 'gen')
PL = CFG['plates']


def display(scene):
    return np.round(linear_to_srgb(filmic(scene)) * 255).astype(np.uint8)


def scene_of(display8):
    return inverse_filmic(srgb_to_linear(display8.astype(np.float64) / 255)).astype(np.float32)


def axes(m):
    (cx, cy), (sx, sy), (nx, ny) = m['centre'], m['size'], m['pixels']
    gx = cx - sx / 2 + (np.arange(nx) + 0.5) * sx / nx
    gy = cy - sy / 2 + (np.arange(ny) + 0.5) * sy / ny
    return gx, gy


def resample(field, src, dst, interp=cv2.INTER_CUBIC):
    sx, sy = axes(src)
    dx, dy = axes(dst)
    mx = ((dx - sx[0]) / (sx[1] - sx[0])).astype(np.float32)
    my = ((dy - sy[0]) / (sy[1] - sy[0])).astype(np.float32)
    X, Y = np.meshgrid(mx, my)
    return cv2.remap(field, X, Y, interp, borderMode=cv2.BORDER_REPLICATE)


def globe_albedo(m):
    gx, gy = axes(m)
    X, Y = np.meshgrid(gx, gy)
    d = P.surface(X, Y, PLACE)
    return scene_of(G.albedo(d, PLACE['solved']['local']) * 255)


def image_lay(m):
    scene = approved_scene()
    t = CFG['tool']
    himg, _ = image_height(t['heightGain'], t['reliefSigmaPx'], t['reliefReach'])
    himg = cv2.GaussianBlur(himg, (0, 0), t['depthBlurPx'])
    gx, gy = axes(m)
    X, Y = np.meshgrid(gx, gy)
    h = np.zeros_like(X)
    for i in range(10):
        p = F.geom.from_chart(X, Y, h)
        px, py = F.geom.project(p)
        seen_h = cv2.remap(himg, px.astype(np.float32), py.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        step = seen_h - h
        h = h + 0.6 * step
    p = F.geom.from_chart(X, Y, h)
    px, py = F.geom.project(p)
    toc = p - F.geom.CENTRE
    up = toc / np.linalg.norm(toc, axis=-1, keepdims=True)
    dist = np.linalg.norm(p, axis=-1)
    graze = np.einsum('...k,...k->...', up, -p) / dist
    margin = 6
    seen = (p[..., 2] < 0) & (graze > 0.01) & (px >= margin) & (px <= F.geom.W - 1 - margin) & (py >= margin) & (py <= F.geom.H - 1 - margin) & (np.abs(step) < PL['hiddenError'])
    along = dist / F.geom.F / np.maximum(graze, 1e-3)
    rgb = cv2.remap(scene, px.astype(np.float32), py.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return np.maximum(rgb, 0), h.astype(np.float32), seen, along.astype(np.float32)


def grade():
    path = os.path.join(GEN, 'grade.npy')
    if os.path.exists(path):
        return np.load(path)
    m = dict(PL['mid'])
    n = PL['gradePixels']
    m['pixels'] = [n, n]
    work = dict(m)
    work['pixels'] = [1024, 1024]
    rgb, h, seen, along = image_lay(work)
    alb = globe_albedo(work)
    k = cv2.erode(seen.astype(np.float32), np.ones((5, 5), np.uint8))
    s = PL['matchSigma'] / (work['size'][0] / work['pixels'][0])
    num = cv2.GaussianBlur(rgb * k[..., None], (0, 0), s)
    den = cv2.GaussianBlur(alb * k[..., None], (0, 0), s)
    wgt = cv2.GaussianBlur(k, (0, 0), s)
    ratio = num / np.maximum(den, 1e-6)
    out = ratio.copy()
    got = (wgt > 0.3).astype(np.float32)
    out *= got[..., None]
    s2 = s
    filled = got.copy()
    while filled.min() < 0.5:
        s2 *= 1.5
        a = cv2.GaussianBlur(ratio * got[..., None], (0, 0), s2, borderType=cv2.BORDER_REPLICATE)
        b = cv2.GaussianBlur(got, (0, 0), s2, borderType=cv2.BORDER_REPLICATE)
        ok = (b > 0.02) & (filled < 0.5)
        out[ok] = (a / np.maximum(b, 1e-6)[..., None])[ok]
        filled[ok] = 1
    soft = cv2.GaussianBlur(out, (0, 0), s * 0.75, borderType=cv2.BORDER_REPLICATE)
    edge = cv2.GaussianBlur(got, (0, 0), s * 0.75, borderType=cv2.BORDER_REPLICATE)[..., None]
    out = out * edge + soft * (1 - edge)
    small = cv2.resize(out, (n, n), interpolation=cv2.INTER_AREA).astype(np.float32)
    np.save(path, small)
    np.save(os.path.join(GEN, 'grade-known.npy'), cv2.resize(got, (n, n), interpolation=cv2.INTER_AREA))
    cv2.imwrite(os.path.join(GEN, 'grade.png'), np.clip(small[::-1, :, ::-1] * 255, 0, 255).astype(np.uint8))
    return small


def grade_at(m):
    g = dict(PL['mid'])
    g['pixels'] = [PL['gradePixels'], PL['gradePixels']]
    return np.maximum(resample(grade(), g, m), 1e-3)


def parent_albedo(name):
    i = PL['order'].index(name)
    if i == 0:
        return globe_albedo(PL[name])
    up = PL['order'][i - 1]
    return np.maximum(resample(np.load(os.path.join(GEN, up + '-plate.npy')), PL[up], PL[name]), 0)


def canvas(name):
    m = PL[name]
    step = m['size'][0] / m['pixels'][0]
    rgb, h, seen, along = image_lay(m)
    base = parent_albedo(name)
    lit = rgb / grade_at(m)
    known = cv2.erode(seen.astype(np.float32), np.ones((5, 5), np.uint8))
    blur = np.maximum(along / step * PL['softPx'], 0.3)
    soft, _ = blur_to(lit, known, blur)
    w = cv2.GaussianBlur(known, (0, 0), PL['feather'] / step)
    w = np.clip((w - 0.5) * 2, 0, 1)
    out = soft * w[..., None] + base * (1 - w[..., None])
    blur_map = blur * w + PL['parentBlurPx'] * (1 - w)
    return out.astype(np.float32), blur_map.astype(np.float32), w.astype(np.float32), h


if __name__ == '__main__':
    name = sys.argv[1]
    os.makedirs(GEN, exist_ok=True)
    out, blur, w, h = canvas(name)
    np.save(os.path.join(GEN, name + '-canvas.npy'), out)
    np.save(os.path.join(GEN, name + '-blur.npy'), blur)
    np.save(os.path.join(GEN, name + '-wedge.npy'), w)
    np.save(os.path.join(GEN, name + '-h.npy'), h)
    cv2.imwrite(os.path.join(GEN, name + '_in.png'), display(out)[::-1, :, ::-1])
    fin = (blur < PL['finishedPx']) & (w > 0.5)
    print(name, 'wedge share', round(float((w > 0.5).mean()), 3), 'finished share', round(float(fin.mean()), 3), 'blur px pcts in wedge', np.round(np.percentile(blur[w > 0.5], [5, 50, 95]), 2))
