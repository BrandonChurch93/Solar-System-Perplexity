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


LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)


def nblur(field, weight, sigma):
    num = cv2.GaussianBlur(field * (weight[..., None] if field.ndim == 3 else weight), (0, 0), sigma)
    den = cv2.GaussianBlur(weight, (0, 0), sigma)
    return num / np.maximum(den[..., None] if field.ndim == 3 else den, 1e-6), den


def extend(value, got, sweeps=40):
    flat = value.ndim == 2
    v = (value[..., None] if flat else value).astype(np.float32)
    g = got.astype(np.float32)
    vs, gs = [v * g[..., None]], [g]
    while min(gs[-1].shape) > 8:
        h, w = gs[-1].shape
        size = (max(w // 2, 1), max(h // 2, 1))
        vs.append(cv2.resize(vs[-1], size, interpolation=cv2.INTER_AREA).reshape(size[1], size[0], -1))
        gs.append(cv2.resize(gs[-1], size, interpolation=cv2.INTER_AREA))
    out = np.broadcast_to(vs[-1].sum((0, 1)) / max(gs[-1].sum(), 1e-6), vs[-1].shape).copy()
    for vv, gg in zip(vs[::-1], gs[::-1]):
        h, w = gg.shape
        out = cv2.resize(out, (w, h), interpolation=cv2.INTER_LINEAR).reshape(h, w, -1)
        known = vv / np.maximum(gg, 1e-6)[..., None]
        share = np.clip(gg, 0, 1)[..., None]
        for i in range(sweeps):
            out = cv2.GaussianBlur(out, (0, 0), 1.2, borderType=cv2.BORDER_REPLICATE).reshape(h, w, -1)
            out = out * (1 - share) + known * share
    return out[..., 0] if flat else out


def grade():
    path = os.path.join(GEN, 'grade.json')
    if os.path.exists(path):
        return np.array(json.load(open(path))['far'], np.float32)
    work = dict(PL['mid'])
    work['pixels'] = [768, 768]
    unit = work['size'][0] / work['pixels'][0]
    rgb, h, seen, along = image_lay(work)
    base, _ = cleared_globe(work)
    k = cv2.erode(seen.astype(np.float32), np.ones((5, 5), np.uint8))
    s = PL['gradeScale'] / unit
    img, w = nblur(rgb, k, s)
    alb, _ = nblur(base, k, s)
    gx, gy = axes(work)
    X, Y = np.meshgrid(gx, gy)
    r = np.hypot(X - PLACE['vortex'][0], Y - PLACE['vortex'][1])
    sel = (w > 0.5) & (r < PL['gradeRadius'])
    far = np.median(img[sel] / np.maximum(alb[sel], 1e-6), axis=0)
    json.dump({'far': [round(float(v), 4) for v in far]}, open(path, 'w'))
    print('grade', np.round(far, 4), 'pixels', int(sel.sum()))
    return far.astype(np.float32)


def vblur(field, sigma_px, levels=(0.0, 1.0, 2.0, 4.0, 8.0, 16.0, 32.0, 64.0, 128.0, 256.0)):
    flat = field.ndim == 2
    f = field[..., None] if flat else field
    stack = []
    for s in levels:
        if s == 0:
            stack.append(f)
        elif s <= 16:
            stack.append(cv2.GaussianBlur(f, (0, 0), s, borderType=cv2.BORDER_REFLECT).reshape(f.shape))
        else:
            k = int(s / 8)
            small = cv2.resize(f, (f.shape[1] // k, f.shape[0] // k), interpolation=cv2.INTER_AREA)
            small = cv2.GaussianBlur(small, (0, 0), s / k, borderType=cv2.BORDER_REFLECT)
            stack.append(cv2.resize(small, (f.shape[1], f.shape[0]), interpolation=cv2.INTER_CUBIC).reshape(f.shape))
    lv = np.log2(np.maximum(np.array(levels), 0.5))
    pos = np.interp(np.log2(np.maximum(sigma_px, 0.5)), lv, np.arange(len(lv)))
    lo = np.clip(np.floor(pos).astype(int), 0, len(lv) - 2)
    t = (pos - lo).astype(np.float32)
    out = np.zeros_like(f)
    for i in range(len(lv) - 1):
        m = lo == i
        if m.any():
            out[m] = stack[i][m] * (1 - t[m])[..., None] + stack[i + 1][m] * t[m][..., None]
    return out[..., 0] if flat else out


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def lowpass(field, sigma_px):
    k = max(int(sigma_px / 6), 1)
    small = cv2.resize(field, (field.shape[1] // k, field.shape[0] // k), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), sigma_px / k, borderType=cv2.BORDER_REPLICATE)
    return cv2.resize(small, (field.shape[1], field.shape[0]), interpolation=cv2.INTER_CUBIC)


def cleared_globe(m):
    step = m['size'][0] / m['pixels'][0]
    wide = dict(m)
    c0, c1, cs = PL['clear']
    pad = 2.5 * cs
    wide['size'] = [m['size'][0] + 2 * pad, m['size'][1] + 2 * pad]
    px = 512
    wide['pixels'] = [px, int(round(px * wide['size'][1] / wide['size'][0]))]
    low = lowpass(globe_albedo(wide), cs / (wide['size'][0] / px))
    low = np.maximum(resample(low, wide, m), 0)
    alb = globe_albedo(m)
    gx, gy = axes(m)
    X, Y = np.meshgrid(gx, gy)
    r = np.hypot(X - PLACE['vortex'][0], Y - PLACE['vortex'][1])
    c = (1 - smooth((r - c0) / (c1 - c0)))
    return alb * (1 - c[..., None]) + low * c[..., None], c * cs / step


def base_of(name):
    m = PL[name]
    step = m['size'][0] / m['pixels'][0]
    up = PL['parents'][name]
    if up:
        base = np.maximum(resample(np.load(os.path.join(GEN, up + '-plate.npy')), PL[up], m), 0)
        blur = np.full(base.shape[:2], PL['parentBlurPx'], np.float32)
    else:
        base, clear = cleared_globe(m)
        soften = PL['globeSoftenPx'].get(name, 0)
        if soften > 0:
            base = cv2.GaussianBlur(base, (0, 0), soften)
        blur = np.maximum(PL['globeBlurPx'][name], clear).astype(np.float32)
    inset = np.zeros_like(base)
    edge = np.full(base.shape[:2], -1e6, np.float32)
    fine = PL['inset'].get(name)
    if fine:
        f = PL[fine]
        plate = np.load(os.path.join(GEN, fine + '-plate.npy'))
        k = step / (f['size'][0] / f['pixels'][0])
        plate = cv2.GaussianBlur(plate, (0, 0), k * 0.5)
        inset = resample(plate, f, m, cv2.INTER_LINEAR)
        gx, gy = axes(m)
        X, Y = np.meshgrid(gx, gy)
        edge = (np.minimum(f['size'][0] / 2 - np.abs(X - f['centre'][0]), f['size'][1] / 2 - np.abs(Y - f['centre'][1])) / step).astype(np.float32)
    return base.astype(np.float32), blur.astype(np.float32), inset.astype(np.float32), edge


def canvas(name):
    m = PL[name]
    step = m['size'][0] / m['pixels'][0]
    rgb, h, seen, along = image_lay(m)
    under, base_blur, inset, edge = base_of(name)
    bw, bb = PL['bandPx']
    wi = smooth(edge / bw)
    lit = rgb / grade()
    known = cv2.erode(seen.astype(np.float32), np.ones((5, 5), np.uint8))
    blur = np.maximum(along / step * PL['softPx'], 0.3)
    soft, _ = blur_to(lit, known, blur)
    u0, u1 = PL['useBlur']
    use = known * (edge <= 0) * (1 - smooth((blur * step - u0) / (u1 - u0)))
    if PL['parents'][name]:
        use = use * (blur < base_blur + 1.0)
    k = max(m['pixels'][0] // 512, 1)
    small = lambda x: cv2.resize(x, (x.shape[1] // k, x.shape[0] // k), interpolation=cv2.INTER_AREA)
    up = lambda x: cv2.resize(x, (under.shape[1], under.shape[0]), interpolation=cv2.INTER_CUBIC)
    us = small((use > 0.5).astype(np.float32))
    gx, gy = axes(m)
    X, Y = np.meshgrid(gx[k // 2::k][:us.shape[1]], gy[k // 2::k][:us.shape[0]])
    eye = F.geom.to_chart(np.zeros(3))
    d0, d1, scale = PL['flatten']
    f = smooth((np.hypot(X - eye[0], Y - eye[1]) - d0) / (d1 - d0))
    tone, wt = nblur(small(soft), us, scale / step / k)
    low = cv2.GaussianBlur(small(under), (0, 0), scale / step / k)
    haze = np.log(np.clip(tone / np.maximum(low, 1e-6), 0.05, 20.0)) * f[..., None]
    haze = np.where(wt[..., None] > 0.05, haze, 0)
    soft = soft * np.exp(-up(haze))
    w = cv2.GaussianBlur((use > 0.5).astype(np.float32), (0, 0), max(PL['feather'] / step, 2.0))
    w = np.clip((w - 0.5) * 2, 0, 1) * (1 - wi)
    base = under
    if not PL['parents'][name]:
        have = soft * w[..., None] + inset * wi[..., None]
        ws = small(w + wi)
        tone, wt = nblur(small(have), ws, PL['carry'][0] / step / k)
        low = cv2.GaussianBlur(small(under), (0, 0), PL['carry'][0] / step / k)
        ratio = np.log(np.clip(tone / np.maximum(low, 1e-6), 0.05, 20.0))
        got = wt > 0.5
        dist = cv2.distanceTransform((~got).astype(np.uint8), cv2.DIST_L2, 5) * step * k
        ratio = extend(ratio, got) * np.exp(-dist / PL['carry'][1])[..., None]
        base = under * np.exp(up(ratio))
    out = soft * w[..., None] + inset * wi[..., None] + base * (1 - w - wi)[..., None]
    blur_map = blur * w + 0.5 * wi + base_blur * (1 - w - wi)
    inside = (w > 0.5).astype(np.uint8)
    d_in = cv2.distanceTransform(inside, cv2.DIST_L2, 5)
    d_out = cv2.distanceTransform(1 - inside, cv2.DIST_L2, 5)
    dist = np.minimum(np.where(inside > 0, d_in, d_out), np.abs(edge))
    band = bb * np.exp(-(dist / bw) ** 2)
    extra = np.sqrt(np.maximum(band ** 2 - blur_map ** 2, 0)).astype(np.float32)
    out = vblur(out.astype(np.float32), extra)
    blur_map = np.maximum(blur_map, band)
    free = np.minimum(d_out, np.where(edge > 0, 0, -edge))
    tie = np.where((inside > 0) | (edge > 0), blur_map, np.minimum(blur_map, bb + free * PL['free']))
    return out.astype(np.float32), blur_map.astype(np.float32), tie.astype(np.float32), np.maximum(w, wi).astype(np.float32), h, base.astype(np.float32)


if __name__ == '__main__':
    name = sys.argv[1]
    os.makedirs(GEN, exist_ok=True)
    out, blur, tie, w, h, bare = canvas(name)
    np.save(os.path.join(GEN, name + '-canvas.npy'), out)
    np.save(os.path.join(GEN, name + '-blur.npy'), blur)
    np.save(os.path.join(GEN, name + '-tie.npy'), tie)
    np.save(os.path.join(GEN, name + '-wedge.npy'), w)
    np.save(os.path.join(GEN, name + '-h.npy'), h)
    if not PL['parents'][name]:
        _, base_blur, _, _ = base_of(name)
        np.save(os.path.join(GEN, name + '_bare-canvas.npy'), bare)
        np.save(os.path.join(GEN, name + '_bare-blur.npy'), base_blur)
        np.save(os.path.join(GEN, name + '_bare-tie.npy'), base_blur)
    cv2.imwrite(os.path.join(GEN, name + '_in.png'), display(out * grade())[::-1, :, ::-1])
    cv2.imwrite(os.path.join(GEN, name + '_bare_in.png'), display(bare * grade())[::-1, :, ::-1])
    fin = (blur < PL['finishedPx']) & (w > 0.5)
    print(name, 'image share', round(float((w > 0.5).mean()), 3), 'finished share', round(float(fin.mean()), 3), 'blur px pcts in the image part', np.round(np.percentile(blur[w > 0.5], [5, 50, 95]), 2))
