import json, sys, numpy as np, cv2
sys.path.insert(0, 'assets-src/mars/relief')
from geom import W, H, F, U, R

def load(setname='full', names=('L0', 'L2', 'L1')):
    meta = json.load(open('assets-src/mars/relief/relief.json'))
    out = []
    for k in names:
        m = meta['layers'][k]
        base = f'public/assets/mars/{setname}/relief-{k}'
        c = cv2.imread(base + '-color.jpg').astype(np.float32) / 255
        a = cv2.imread(base + '-alpha.png', cv2.IMREAD_UNCHANGED).astype(np.float32) / 255
        dw, dh = m['distSize'][setname]
        d = np.fromfile(base + '-dist.bin', '<f4').reshape(dh, dw)
        sc = 1 if setname == 'full' else 2
        out.append(dict(name=k, color=c, alpha=a, dist=d, box=[v / sc for v in (m['box']['x'], m['box']['y'], m['box']['x'] + m['box']['w'], m['box']['y'] + m['box']['h'])], scale=(2 * W) / sc))
    return out

def pose(forward=0.0, rise=0.0, pan_deg=0.0):
    fwd = np.array([0, 0, -1.0])
    C = fwd * forward + U * rise
    t = np.radians(pan_deg)
    k = U / np.linalg.norm(U)
    K = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    Rm = np.eye(3) + np.sin(t) * K + (1 - np.cos(t)) * K @ K
    return C, Rm

def render(layers, C, Rm, out_w, sample='dist', bg=(0.0, 1.0, 0.0)):
    out_h = out_w * H // W
    acc = np.zeros((out_h, out_w, 3), np.float32); cov = np.zeros((out_h, out_w), np.float32)
    stats = {}
    for L in layers:
        x0, y0, x1, y1 = L['box']
        if sample == 'dist':
            dh, dw = L['dist'].shape
            col = cv2.resize(L['color'], (dw, dh), interpolation=cv2.INTER_AREA)
            al = cv2.resize(L['alpha'], (dw, dh), interpolation=cv2.INTER_AREA)
            dist = L['dist']
        else:
            col, al = L['color'], L['alpha']
            dh, dw = al.shape
            dist = cv2.resize(L['dist'], (dw, dh), interpolation=cv2.INTER_LINEAR)
        s = (x1 - x0) / dw
        img_scale = W / L['scale']
        lc = np.zeros((out_h, out_w, 3), np.float32); la = np.zeros((out_h, out_w), np.float32); zb = np.full((out_h, out_w), np.inf, np.float32)
        maxst = []
        for r0 in range(0, dh, 512):
            r1 = min(dh, r0 + 512 + 1)
            yy = (y0 + (np.arange(r0, r1) + 0.5) * s) * img_scale
            xx = (x0 + (np.arange(dw) + 0.5) * s) * img_scale
            X, Y = np.meshgrid(xx, yy)
            d = np.stack([X - W / 2, -(Y - H / 2), -np.full_like(X, F)], -1)
            d /= np.linalg.norm(d, axis=-1, keepdims=True)
            Pp = (d * dist[r0:r1, :, None] - C) @ Rm
            z = -Pp[..., 2]
            px = (W / 2 + F * Pp[..., 0] / z) * (out_w / W)
            py = (H / 2 - F * Pp[..., 1] / z) * (out_w / W)
            sp = s * img_scale * (out_w / W)
            a_ = al[r0:r1]
            ex = np.abs(np.diff(px, axis=1)) / sp; ey = np.abs(np.diff(py, axis=0)) / sp
            m0 = np.minimum(a_[:, 1:], a_[:, :-1]) > 0.5
            m1 = np.minimum(a_[1:], a_[:-1]) > 0.5
            mag = dist[r0:r1] / np.linalg.norm(Pp, axis=-1)
            if m0.any(): maxst.append(np.max(ex[m0] / np.maximum(mag[:, 1:][m0], 1e-3)))
            if m1.any(): maxst.append(np.max(ey[m1] / np.maximum(mag[1:][m1], 1e-3)))
            if r1 != dh: sl = slice(0, -1)
            else: sl = slice(0, None)
            px, py, z, cc, aa = px[sl], py[sl], z[sl], col[r0:r1][sl], a_[sl]
            ix = np.floor(px).astype(np.int64); iy = np.floor(py).astype(np.int64)
            ok = (ix >= 0) & (ix < out_w) & (iy >= 0) & (iy < out_h) & (z > 0) & (aa > 0)
            ix, iy, z, cc, aa = ix[ok], iy[ok], z[ok], cc[ok], aa[ok]
            if ix.size == 0: continue
            lin = iy * out_w + ix
            o = np.lexsort((-z, lin))
            lin, z, cc, aa = lin[o], z[o], cc[o], aa[o]
            last = np.r_[lin[1:] != lin[:-1], True]
            lin, z, cc, aa = lin[last], z[last], cc[last], aa[last]
            zf = zb.reshape(-1); closer = z < zf[lin]
            lin, z, cc, aa = lin[closer], z[closer], cc[closer], aa[closer]
            zf[lin] = z; lc.reshape(-1, 3)[lin] = cc; la.reshape(-1)[lin] = aa
        acc = acc * (1 - la[..., None]) + lc * la[..., None]
        cov = cov * (1 - la) + la
        stats[L['name']] = float(max(maxst)) if maxst else 0.0
    bgc = np.array(bg, np.float32)
    img = acc + (1 - cov[..., None]) * bgc
    return img, cov, stats

def ground_need(C, Rm, out_w, margin_px=4):
    out_h = out_w * H // W
    xx = (np.arange(out_w) + 0.5) * (W / out_w); yy = (np.arange(out_h) + 0.5) * (W / out_w)
    X, Y = np.meshgrid(xx, yy)
    d = np.stack([X - W / 2, -(Y - H / 2), -np.full_like(X, F)], -1)
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    dw = d @ Rm.T
    h = 1 + float(C @ U)
    sdip = np.sqrt(1 - (R / (R + h)) ** 2)
    need = (dw @ U) < -sdip
    need = cv2.erode(need.astype(np.uint8), np.ones((1, 1), np.uint8))
    sh = int(np.ceil(margin_px * out_w / W * 2))
    need2 = np.zeros_like(need); need2[sh:] = need[:-sh] if sh > 0 else need
    return (need2 > 0) & (need > 0)
