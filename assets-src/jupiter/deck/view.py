import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geom
from layback import ROOT, canvas_display, core_display, linear_to_srgb, srgb_to_linear

STOP = os.path.join(ROOT, 'src', 'stops', 'jupiter')
PUBLIC = os.path.join(ROOT, 'public', 'assets', 'jupiter')
WORK = os.path.join(ROOT, 'out', 'work', 'jupiter', 'deck')
CFG = json.load(open(os.path.join(STOP, 'deck.json')))


class Surface:
    def __init__(self, kind='full'):
        f = json.load(open(os.path.join(STOP, 'deck-fields.json')))
        self.lo, self.hi = f['heightRange']
        self.maps = []
        for name in f['maps']:
            m = f['maps'][name]
            n = m['pixels'][kind]
            q = np.fromfile(os.path.join(PUBLIC, kind, 'deck-' + name + '-height.bin'), dtype='<u2').reshape(n, n).astype(np.float32) / 65535
            self.maps.append((m['centre'], m['size'], n, q))
        self.blend = CFG['look']['blend']

    def weights(self, gx, gy):
        out = []
        left = np.ones(gx.shape, np.float32)
        for c, size, n, q in self.maps:
            r = np.maximum(np.abs(gx - c[0]), np.abs(gy - c[1])) / (size / 2)
            t = np.clip((r - self.blend[0]) / (self.blend[1] - self.blend[0]), 0, 1)
            w = (left * (1 - t * t * (3 - 2 * t))).astype(np.float32)
            out.append(w)
            left = left - w
        return out

    def height(self, gx, gy):
        ws = self.weights(gx, gy)
        h = np.zeros(gx.shape, np.float32)
        for w, (c, size, n, q) in zip(ws, self.maps):
            u = ((gx - c[0]) / size + 0.5) * n - 0.5
            v = ((gy - c[1]) / size + 0.5) * n - 0.5
            h += (w * cv2.remap(q, u.astype(np.float32), v.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)).astype(np.float32)
        return self.lo * sum(ws).astype(np.float32) + h * (self.hi - self.lo)


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


def unseen(stored, shrink, px, py, dist):
    cx = np.clip(np.floor((px + 0.5) / shrink - 0.5).astype(np.int64), 0, stored.shape[1] - 2)
    cy = np.clip(np.floor((py + 0.5) / shrink - 0.5).astype(np.int64), 0, stored.shape[0] - 2)
    far = np.maximum(np.maximum(stored[cy, cx], stored[cy, cx + 1]), np.maximum(stored[cy + 1, cx], stored[cy + 1, cx + 1]))
    return dist / far - 1


def reflect(i, lo, hi):
    n = hi - lo
    if n <= 0:
        return np.full_like(i, lo)
    k = np.mod(i - lo, 2 * n)
    return lo + np.where(k > n, 2 * n - k, k)


def across(values, ok, need, ii, jj, sigma):
    size = (int(6 * sigma) | 1, 1)
    plane = np.zeros(need.shape, np.float32)
    plane[ii, jj] = ok
    den = cv2.GaussianBlur(plane, size, sigma)[ii, jj]
    out = np.zeros_like(values)
    for ch in range(values.shape[1]):
        plane[ii, jj] = values[:, ch] * ok
        out[:, ch] = cv2.GaussianBlur(plane, size, sigma)[ii, jj] / np.maximum(den, 1e-6)
    return out, den > 1e-3


def carry_fill(rgb, need, seen, c):
    k = c['fine']
    skip, sigma = c['hiddenSkip'] * k, c['fillSmooth'] * k
    rows_n = need.shape[0]
    rows = np.arange(rows_n, dtype=np.int32)[:, None]
    far_row = np.maximum.accumulate(np.where(need, -1, rows), axis=0)
    near_row = np.minimum.accumulate(np.where(need, rows_n, rows)[::-1], axis=0)[::-1]
    m = need.astype(np.float32)
    size = (int(6 * sigma) | 1, 1)
    den = np.maximum(cv2.GaussianBlur(m, size, sigma), 1e-6)
    ii, jj = np.nonzero(need)
    df = (cv2.GaussianBlur((rows - far_row).astype(np.float32) * m, size, sigma) / den)[ii, jj]
    dn = (cv2.GaussianBlur((near_row - rows).astype(np.float32) * m, size, sigma) / den)[ii, jj]
    del den, m
    free = seen & ~need

    def border(start, step):
        acc = np.zeros((len(ii), 3), np.float32)
        cnt = np.zeros(len(ii), np.float32)
        for b in range(int(c['fillMean'] * k)):
            r = start + step * b
            rc = np.clip(r, 0, rows_n - 1)
            ok = (r == rc) & free[rc, jj]
            acc += rgb[rc, jj] * ok[:, None]
            cnt += ok
        ok = cnt > 0
        colour = acc / np.maximum(cnt, 1)[:, None]
        fine, ok_fine = across(colour, ok, need, ii, jj, c['fillAcross'][0] * k)
        wide, ok_wide = across(colour, ok, need, ii, jj, c['fillAcross'][1] * k)
        return fine, wide, ok_fine

    far_fine, far_wide, ok_f = border(far_row[ii, jj], -1)
    near_fine, near_wide, ok_n = border(near_row[ii, jj] + skip, 1)
    deep = c['fillAcross'][2] * k
    sf = smooth(df / deep)[:, None]
    sn = smooth(dn / deep)[:, None]
    far_c = far_fine * (1 - sf) + far_wide * sf
    near_c = near_fine * (1 - sn) + near_wide * sn
    w = smooth((df / np.maximum(df + dn, 1e-6) - c['fillNear']) / (1 - c['fillNear']))
    wn = np.where(ok_f, w, 1) * ok_n
    wf = np.where(ok_n, 1 - w, 1) * ok_f
    total = wn + wf
    done = total > 1e-3
    fill = (near_c * wn[:, None] + far_c * wf[:, None]) / np.maximum(total, 1e-3)[:, None]
    inner = smooth((np.minimum(df, dn) / k - c['fillDetail'][1]) / (c['fillDetail'][2] - c['fillDetail'][1]))
    if c['fillDetail'][0] > 0:
        high = rgb - cv2.GaussianBlur(rgb, (0, 0), c['fillDetail'][3] * k)

        def mirrored(pos):
            p0 = np.clip(np.floor(pos), 0, rows_n - 2).astype(np.int64)
            f = np.clip(pos - p0, 0, 1)[:, None]
            ok = free[p0, jj] & free[p0 + 1, jj]
            return (high[p0, jj] * (1 - f) + high[p0 + 1, jj] * f) * ok[:, None]

        detail = mirrored(ii + 1 - 2 * df) * wf[:, None] + mirrored(ii + skip - 1 + 2 * dn) * wn[:, None]
        fill = np.maximum(fill + c['fillDetail'][0] * inner[:, None] * detail / np.maximum(total, 1e-3)[:, None], 0)
        del high
    out = rgb.copy()
    out[ii[done], jj[done]] = fill[done]
    left = np.zeros(need.shape, bool)
    left[ii[~done], jj[~done]] = True
    if left.any():
        code = np.round(np.clip(linear_to_srgb(out), 0, 1) * 255).astype(np.uint8)
        code = cv2.inpaint(code, left.astype(np.uint8), 4, cv2.INPAINT_TELEA)
        out[left] = srgb_to_linear(code[left].astype(np.float64) / 255).astype(np.float32)
    longer = np.ones(need.shape, np.float32)
    longer[ii, jj] = 1 + c['fillLength'] * (df + dn) / k * (1 - inner * min(c['fillDetail'][0], 1))
    return out, longer, int(done.sum()), int(left.sum())


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def build():
    v = CFG['view']
    core_cfg = CFG['tool']['canvas']['core']
    theta = np.radians(v['thetaDeg'])
    d_far = np.sqrt(2 * geom.R) - v['horizonMargin']
    psi = [float(psi_of(d_far)), float(np.radians(v['psiNearDeg']))]
    nt, npsi = v['pixels']
    k = v['fine']
    surface = Surface('full')
    gx, gy = view_grid(nt, npsi, theta, psi)
    h = surface.height(gx, gy)
    p = geom.from_chart(gx, gy, h)
    px, py = geom.project(p)
    margin = v['imageMargin']
    seen = (p[..., 2] < 0) & (px >= margin) & (px <= geom.W - 1 - margin) & (py >= margin) & (py <= geom.H - 1 - margin)
    dt = np.gradient(p, axis=1)
    dp = np.gradient(p, axis=0)
    n = np.cross(dt, dp)
    n /= np.maximum(np.linalg.norm(n, axis=-1, keepdims=True), 1e-12)
    dist = np.linalg.norm(p, axis=-1)
    cosv = np.abs(np.einsum('...k,...k->...', n, p) / dist)
    length = (dist / geom.F) / np.maximum(cosv, 1e-4)
    stored = np.load(os.path.join(WORK, 'image-range-full.npy'))
    shrink = CFG['image']['rangeShrink']['full']
    hid = unseen(stored, shrink, px, py, dist) > CFG['image']['hidden'][0]
    lmin, lmax = v['lengthRange']
    up = (p - geom.CENTRE) / geom.R
    level = (dist / geom.F) / np.maximum(-np.einsum('...k,...k->...', p, up) / dist, 1e-3)
    steep = seen & ~hid & (length > v['steep'] * level)
    steep = cv2.morphologyEx(steep.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)).astype(bool) & seen & ~hid
    need = seen & (hid | steep)
    length[need] = np.minimum(level, lmax)[need]
    cv2.imwrite(os.path.join(WORK, 'view-need.png'), np.ascontiguousarray(np.stack([np.zeros_like(seen), seen & steep, seen & hid], -1)[::-1].astype(np.uint8) * 255))
    inside = np.minimum(np.minimum(px - geom.OX, geom.OX + geom.W0 - 1 - px), np.minimum(py - geom.OY, geom.OY + geom.H0 - 1 - py))
    fine_w = smooth((inside - core_cfg['feather'][0]) / (core_cfg['feather'][1] - core_cfg['feather'][0]))
    print('steep share of seen', round(float(steep.sum() / max(seen.sum(), 1)), 4), 'core share of seen', round(float(fine_w[seen].mean()), 3))
    del dt, dp, n, up, cosv
    NT, NP = nt * k, npsi * k
    lin = srgb_to_linear(canvas_display().astype(np.float64)).astype(np.float32)
    core = srgb_to_linear(core_display().astype(np.float64)).astype(np.float32)
    kc = core_cfg['scale']
    gxf, gyf = view_grid(NT, NP, theta, psi)
    rgb = np.zeros((NP, NT, 3), np.float32)
    seen_f = np.zeros((NP, NT), bool)
    hid_f = np.zeros((NP, NT), bool)
    band = 256
    for r0 in range(0, NP, band):
        r1 = min(r0 + band, NP)
        gxb, gyb = gxf[r0:r1], gyf[r0:r1]
        pb = geom.from_chart(gxb, gyb, surface.height(gxb, gyb))
        pxb, pyb = geom.project(pb)
        seen_f[r0:r1] = (pb[..., 2] < 0) & (pxb >= margin) & (pxb <= geom.W - 1 - margin) & (pyb >= margin) & (pyb <= geom.H - 1 - margin)
        hid_f[r0:r1] = unseen(stored, shrink, pxb, pyb, np.linalg.norm(pb, axis=-1)) > CFG['image']['hidden'][0]
        wide = cv2.remap(lin, pxb.astype(np.float32), pyb.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        fine = cv2.remap(core, ((pxb - geom.OX) * kc + (kc - 1) / 2).astype(np.float32), ((pyb - geom.OY) * kc + (kc - 1) / 2).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        ins = np.minimum(np.minimum(pxb - geom.OX, geom.OX + geom.W0 - 1 - pxb), np.minimum(pyb - geom.OY, geom.OY + geom.H0 - 1 - pyb))
        w = smooth((ins - core_cfg['feather'][0]) / (core_cfg['feather'][1] - core_cfg['feather'][0]))[..., None].astype(np.float32)
        rgb[r0:r1] = np.clip(wide * (1 - w) + fine * w, 0, 1)
    del lin, core, gxf, gyf
    big = lambda m: cv2.resize(cv2.GaussianBlur(m.astype(np.float32), (0, 0), v['fillEdge']), (NT, NP), interpolation=cv2.INTER_CUBIC) > 0.5
    need_f = seen_f & (hid_f | big(steep))
    rgb, longer, filled, left = carry_fill(rgb, need_f, seen_f, v)
    print('filled', filled, 'left', left, 'longest', round(float(longer.max()), 1))
    length = cv2.resize(length.astype(np.float32), (NT, NP), interpolation=cv2.INTER_LINEAR) * longer
    a = 1 - np.clip(np.log2(np.clip(length, lmin, lmax) / lmin) / np.log2(lmax / lmin), 0, 1)
    a = np.where(seen_f, np.maximum(a, 3 / 255), 0)
    del longer
    print('view chart', NT, NP, 'seen', round(float(seen_f.mean()), 3), 'hidden of seen', round(float((hid & seen).sum() / max(seen.sum(), 1)), 3), 'filled', filled)
    out = np.concatenate([linear_to_srgb(rgb), a[..., None]], -1)
    out = np.round(np.clip(out, 0, 1) * 255).astype(np.uint8)
    for kind, half in (('full', 1), ('web', 2)):
        o = out if half == 1 else cv2.resize(out, (NT // half, NP // half), interpolation=cv2.INTER_AREA)
        cv2.imwrite(os.path.join(PUBLIC, kind, 'deck-view-color.png'), np.ascontiguousarray(o[::-1, :, [2, 1, 0, 3]]))
    show = cv2.resize(out[::-1, :, :3], (nt, npsi), interpolation=cv2.INTER_AREA)
    show[cv2.resize(a[::-1], (nt, npsi), interpolation=cv2.INTER_AREA) <= 0] //= 3
    cv2.imwrite(os.path.join(WORK, 'view-chart.png'), np.ascontiguousarray(show[..., ::-1]))
    f = json.load(open(os.path.join(STOP, 'deck-fields.json')))
    x0, y0 = geom.to_chart(np.zeros(3))
    eye = -geom.S
    f['view'] = {
        'origin': [float(x0), float(y0)],
        'eye': [float(eye @ geom.EX), float(eye @ geom.EY), float(eye @ geom.EN)],
        'theta': [float(theta[0]), float(theta[1])],
        'psi': psi,
        'pixels': {'full': [NT, NP], 'web': [NT // 2, NP // 2]},
        'lengthRange': [lmin, lmax],
        'focalPx': float(geom.F),
        'half': [geom.W / 2, geom.H / 2],
        'fade': v['fade'],
        'axes': [[float(a) for a in geom.EX], [float(a) for a in geom.EY], [float(a) for a in geom.EN]],
    }
    json.dump(f, open(os.path.join(STOP, 'deck-fields.json'), 'w'), indent=1)


if __name__ == '__main__':
    build()
