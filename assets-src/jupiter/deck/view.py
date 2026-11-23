import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom
from layback import ROOT, canvas_display, linear_to_srgb, srgb_to_linear

STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')
PUBLIC = os.path.join(ROOT, 'public', 'assets', 'jupiter')
WORK = os.path.join(ROOT, 'out', 'work', 'jupiter', 'deck')
CFG = json.load(open(os.path.join(STOP, 'deck.json')))


class Surface:
    def __init__(self, kind='full'):
        f = json.load(open(os.path.join(STOP, 'deck-fields.json')))
        self.lo, self.hi = f['heightRange']
        self.maps = []
        for name in ('near', 'mid'):
            m = f['maps'][name]
            n = m['pixels'][kind]
            q = np.fromfile(os.path.join(PUBLIC, kind, 'deck-' + name + '-height.bin'), dtype='<u2').reshape(n, n).astype(np.float32) / 65535
            self.maps.append((m['centre'], m['size'], n, q))
        self.blend = CFG['look']['blend']

    def weights(self, gx, gy):
        out = []
        for c, size, n, q in self.maps[:2]:
            r = np.maximum(np.abs(gx - c[0]), np.abs(gy - c[1])) / (size / 2)
            t = np.clip((r - self.blend[0]) / (self.blend[1] - self.blend[0]), 0, 1)
            out.append(1 - t * t * (3 - 2 * t))
        wn = out[0]
        wm = (1 - wn) * out[1]
        return wn, wm, 1 - wn - wm

    def height(self, gx, gy):
        ws = self.weights(gx, gy)
        h = np.zeros(gx.shape, np.float32)
        for w, (c, size, n, q) in zip(ws, self.maps):
            u = ((gx - c[0]) / size + 0.5) * n - 0.5
            v = ((gy - c[1]) / size + 0.5) * n - 0.5
            h += (w * cv2.remap(q, u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)).astype(np.float32)
        return self.lo * (ws[0] + ws[1]).astype(np.float32) + h * (self.hi - self.lo)


    def flat(self, gx, gy, wide=4096):
        n = gx.shape[0]
        pad = (-n) % wide
        a = np.pad(gx, (0, pad)).reshape(-1, wide)
        b = np.pad(gy, (0, pad)).reshape(-1, wide)
        return self.height(a, b).reshape(-1)[:n]


def psi_of(d):
    return np.arctan2(1 + d * d / (2 * geom.R), d)


def view_grid(nt, npsi, theta, psi):
    th = theta[0] + (np.arange(nt) + 0.5) / nt * (theta[1] - theta[0])
    ps = psi[0] + (np.arange(npsi) + 0.5) / npsi * (psi[1] - psi[0])
    dd = np.linspace(0.02, np.sqrt(2 * geom.R) - 1e-4, 400000)
    pp = psi_of(dd)
    d = np.interp(ps, pp[::-1], dd[::-1])
    x0, y0 = geom.to_chart(np.zeros(3))
    gx = x0 + d[:, None] * np.sin(th)[None, :]
    gy = y0 + d[:, None] * np.cos(th)[None, :]
    return gx, gy


def hidden(surface, p, eye, steps, first, grow):
    to = eye - p
    far = np.linalg.norm(to, axis=-1)
    to = to / far[..., None]
    c = geom.S - geom.CENTRE
    out = np.zeros(p.shape[:-1], bool)
    s = first
    top = surface.hi
    live = np.ones(p.shape[:-1], bool)
    for i in range(steps):
        idx = np.nonzero(live)
        q = p[idx] + to[idx] * s
        rel = q - geom.CENTRE
        h = np.linalg.norm(rel, axis=-1) - geom.R
        gx = (q - geom.S) @ geom.EX
        gy = (q - geom.S) @ geom.EY
        below = h < surface.flat(gx, gy) - 0.003 * s
        out[idx] |= below
        done = below | (h > top) | (s > far[idx])
        live[idx] = ~done
        if not live.any():
            break
        s *= grow
    return out


def reflect(i, lo, hi):
    n = hi - lo
    if n <= 0:
        return np.full_like(i, lo)
    k = np.mod(i - lo, 2 * n)
    return lo + np.where(k > n, 2 * n - k, k)


def mirror_fill(rgb, need, known, skip):
    out = rgb.copy()
    rows = rgb.shape[0]
    filled = 0
    for j in np.nonzero(need.any(0))[0]:
        col = need[:, j]
        kn = known[:, j]
        edges = np.diff(np.concatenate([[0], col.astype(np.int8), [0]]))
        starts = np.nonzero(edges == 1)[0]
        ends = np.nonzero(edges == -1)[0] - 1
        for r0, r1 in zip(starts, ends):
            r = np.arange(r0, r1 + 1)
            n = r1 - r0 + 1
            a1 = r0 - 1 - skip
            a0 = a1
            while a0 - 1 >= 0 and kn[a0 - 1] and a1 - a0 < 4 * n:
                a0 -= 1
            b0 = r1 + 1 + skip
            b1 = b0
            while b1 + 1 < rows and kn[b1 + 1] and b1 - b0 < 4 * n:
                b1 += 1
            far_ok = a1 >= 0 and kn[max(a1, 0)]
            near_ok = b0 < rows and kn[min(b0, rows - 1)]
            if not far_ok and not near_ok:
                continue
            t = (r - r0 + 0.5) / n
            w = t * t * (3 - 2 * t)
            far = rgb[reflect(a1 - (r - r0), a0, a1), j] if far_ok else None
            near = rgb[reflect(b0 + (r1 - r), b0, b1), j] if near_ok else None
            if far is None:
                fill = near
            elif near is None:
                fill = far
            else:
                fill = near * w[:, None] + far * (1 - w[:, None])
            out[r, j] = fill
            filled += n
    return out, filled


def build():
    v = CFG['view']
    theta = np.radians(v['thetaDeg'])
    d_far = np.sqrt(2 * geom.R) - v['horizonMargin']
    psi = [float(psi_of(d_far)), float(np.radians(v['psiNearDeg']))]
    nt, npsi = v['pixels']
    surface = Surface('full')
    gx, gy = view_grid(nt, npsi, theta, psi)
    h = surface.height(gx, gy)
    p = geom.from_chart(gx, gy, h)
    px, py = geom.project(p)
    margin = v['imageMargin']
    seen = (p[..., 2] < 0) & (px >= margin) & (px <= geom.W - 1 - margin) & (py >= margin) & (py <= geom.H - 1 - margin)
    lin = srgb_to_linear(canvas_display().astype(np.float64)).astype(np.float32)
    rgb = cv2.remap(lin, px.astype(np.float32), py.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    rgb = np.clip(rgb, 0, 1)
    dt = np.gradient(p, axis=1)
    dp = np.gradient(p, axis=0)
    n = np.cross(dt, dp)
    n /= np.maximum(np.linalg.norm(n, axis=-1, keepdims=True), 1e-12)
    dist = np.linalg.norm(p, axis=-1)
    cosv = np.abs(np.einsum('...k,...k->...', n, p) / dist)
    length = (dist / geom.F) / np.maximum(cosv, 1e-4)
    k = v['hiddenShrink']
    small = p[k // 2::k, k // 2::k]
    hid = hidden(surface, small, np.zeros(3), v['hiddenSteps'], v['hiddenFirst'], v['hiddenGrow'])
    pad = 2 * v['hiddenPad'] + 1
    hid = cv2.dilate(hid.astype(np.uint8), np.ones((pad, pad), np.uint8))
    hid = cv2.resize(hid, (nt, npsi), interpolation=cv2.INTER_NEAREST).astype(bool)
    lmin, lmax = v['lengthRange']
    known = seen & ~hid
    rows = np.arange(npsi)
    filled = 0
    up = (p - geom.CENTRE) / geom.R
    level = (dist / geom.F) / np.maximum(-np.einsum('...k,...k->...', p, up) / dist, 1e-3)
    steep = seen & ~hid & (length > v['steep'] * level)
    steep = cv2.morphologyEx(steep.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)).astype(bool) & seen & ~hid
    need = seen & (hid | steep)
    length[need] = np.minimum(level, lmax)[need]
    rgb, filled = mirror_fill(rgb, need, known & ~steep, v['hiddenSkip'])
    print('steep share of seen', round(float(steep.sum() / max(seen.sum(), 1)), 4))
    a = 1 - np.clip(np.log2(np.maximum(length, lmin) / lmin) / np.log2(lmax / lmin), 0, 1)
    a = np.where(seen, np.maximum(a, 3 / 255), 0)
    print('view chart', nt, npsi, 'seen', round(float(seen.mean()), 3), 'hidden of seen', round(float((hid & seen).sum() / max(seen.sum(), 1)), 3), 'filled', filled)
    tt = np.degrees(np.arctan2(gx - geom.to_chart(np.zeros(3))[0], gy - geom.to_chart(np.zeros(3))[1]))
    print('theta of seen: min', round(float(tt[seen].min()), 1), 'max', round(float(tt[seen].max()), 1), 'length pcts of seen', np.round(np.percentile(length[seen], [1, 25, 50, 75, 99]), 4))
    out = np.concatenate([linear_to_srgb(rgb), a[..., None]], -1)
    out = np.round(np.clip(out, 0, 1) * 255).astype(np.uint8)
    for kind, shrink in (('full', 1), ('web', 2)):
        o = out if shrink == 1 else cv2.resize(out, (nt // shrink, npsi // shrink), interpolation=cv2.INTER_AREA)
        cv2.imwrite(os.path.join(PUBLIC, kind, 'deck-view-color.png'), np.ascontiguousarray(o[::-1, :, [2, 1, 0, 3]]))
    show = out[::-1, :, :3].copy()
    show[a[::-1] <= 0] //= 3
    cv2.imwrite(os.path.join(WORK, 'view-chart.png'), np.ascontiguousarray(show[..., ::-1]))
    f = json.load(open(os.path.join(STOP, 'deck-fields.json')))
    x0, y0 = geom.to_chart(np.zeros(3))
    eye = -geom.S
    f['view'] = {
        'origin': [float(x0), float(y0)],
        'eye': [float(eye @ geom.EX), float(eye @ geom.EY), float(eye @ geom.EN)],
        'theta': [float(theta[0]), float(theta[1])],
        'psi': psi,
        'pixels': {'full': [nt, npsi], 'web': [nt // 2, npsi // 2]},
        'lengthRange': [lmin, lmax],
        'focalPx': float(geom.F),
        'half': [geom.W / 2, geom.H / 2],
        'fade': v['fade'],
        'axes': [[float(a) for a in geom.EX], [float(a) for a in geom.EY], [float(a) for a in geom.EN]],
    }
    json.dump(f, open(os.path.join(STOP, 'deck-fields.json'), 'w'), indent=1)


if __name__ == '__main__':
    build()
