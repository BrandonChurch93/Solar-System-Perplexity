import json, os, sys, numpy as np, cv2
from scipy import ndimage as ndi
sys.path.insert(0, 'assets-src/mars/relief')
from geom import W, H, F, P, U, DIP, DH, rays, CF
from fill import pushpull
MARGIN = os.environ.get('MARGIN') == '1'
OX, MB = (338, 190) if MARGIN else (0, 0)
SFX = '-ext' if MARGIN else ''
HW, HH = W + 2 * OX, H + MB
FW, FH = 2 * HW, 2 * HH
cfg = json.load(open('assets-src/mars/relief/cuts.json'))
if MARGIN: cfg['joined'] = json.load(open('assets-src/mars/relief/margin-cuts.json'))['joined']
if MARGIN:
    up = cv2.imread('out/work/ext-full.png')
    pc = up.copy(); pc[:2 * H, 2 * OX:2 * OX + 2 * W] = cv2.imread('out/work/paint-comp-5632.png')
    logd = np.load('out/work/logd-ext.npy')
else:
    up = cv2.imread('out/work/mars-upscaled.png')
    pc = cv2.imread(os.environ.get('PAINT', 'out/work/paint-comp-5632.png'))
    logd = np.log(np.load('out/work/dist0.npy'))
assert up.shape[:2] == (FH, FW) and pc.shape[:2] == (FH, FW)

def on_frame(p):
    return p[0] <= -OX or p[1] <= 0 or p[0] >= W + OX - 1 or p[1] >= H + MB - 1

def joined_dist(k):
    m = np.zeros((HH, HW), np.uint8)
    j = cfg['joined'][k]
    for a, b in zip(j[:-1], j[1:]):
        if on_frame(a) and on_frame(b): continue
        cv2.line(m, (a[0] + OX, a[1]), (b[0] + OX, b[1]), 1, 1)
    return ndi.distance_transform_edt(1 - m).astype(np.float32)

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

def up2(a, interp=cv2.INTER_LINEAR):
    return cv2.resize(a, (FW, FH), interpolation=interp)

def horizon_rows(w):
    xs = (np.arange(w) + 0.5) * (HW / w) - OX
    ys = np.linspace(150, 600, 4501)
    out = np.zeros(w)
    for i, x in enumerate(xs):
        dd = np.stack([np.full_like(ys, x - W / 2), -(ys - H / 2), -np.full_like(ys, F)], -1)
        dd /= np.linalg.norm(dd, axis=-1, keepdims=True)
        out[i] = ys[np.argmin(np.abs(dd @ U + np.sin(DIP)))]
    return out * (w / HW)

L = {}
img_h = cv2.resize(up, (HW, HH), interpolation=cv2.INTER_AREA)
for k in ('L1', 'L2'):
    reg0 = np.load(f'out/work/{k}-region{SFX}.npy') > 0
    dcut = np.load(f'out/work/{k}-dcut{SFX}.npy')
    lum = cv2.cvtColor(img_h, cv2.COLOR_BGR2GRAY).astype(np.float32)
    ring = (~reg0) & (dcut > 8) & (dcut < 24)
    lbg = pushpull(lum, ring.astype(np.float32))
    lbg = cv2.GaussianBlur(lbg, (0, 0), 6)
    outside = (~reg0) & (dcut <= 9)
    seed = outside & (dcut <= 1.5)
    bright = outside & (lum > lbg + 14)
    lab, n = ndi.label(bright | seed)
    keep_ids = np.unique(lab[seed]); keep_ids = keep_ids[keep_ids > 0]
    grow = np.isin(lab, keep_ids)
    grow = ndi.binary_closing(grow | reg0, np.ones((3, 3))) & (dcut <= 9) | reg0
    grow = ndi.binary_opening(grow, np.ones((2, 2))) | reg0
    band = grow & ~reg0
    reg = grow.astype(np.float32)
    djoin = joined_dist(k)
    wcut = np.clip(1 - (dcut - 16) / 16, 0, 1)
    soft = cv2.GaussianBlur(reg, (0, 0), 8, borderType=cv2.BORDER_REPLICATE)
    hard_f = up2(cv2.GaussianBlur(reg, (0, 0), 0.7, borderType=cv2.BORDER_REPLICATE), cv2.INTER_CUBIC)
    hard_f = np.clip((hard_f - 0.5) * 2.5 + 0.5, 0, 1)
    wcut_f = up2(wcut); soft_f = up2(soft)
    alpha = np.clip(wcut_f * hard_f + (1 - wcut_f) * soft_f, 0, 1)
    alpha[alpha < 1 / 255] = 0
    L[k] = dict(band=band, reg=reg > 0, dcut=dcut, djoin=djoin, alpha=alpha, wcut=wcut)

pw = np.load('out/work/paint-wm-ext.npy') if MARGIN else np.load('out/work/paint-w.npy') * np.load('out/work/paint-mask.npy')
dj = np.minimum(L['L1']['djoin'], L['L2']['djoin'])
wpaint = pw * np.clip((dj - 25) / 20, 0, 1)
wpaint_f = (up2(wpaint) * (np.maximum(L['L1']['alpha'], L['L2']['alpha']) >= 0.5))[..., None]
col0 = up.astype(np.float32) * (1 - wpaint_f) + pc.astype(np.float32) * wpaint_f
del wpaint_f
bandall = cv2.dilate((L['L1']['band'] | L['L2']['band']).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
regall = L['L1']['reg'] | L['L2']['reg']
bf = pushpull(img_h.astype(np.float32), (~(bandall | regall)).astype(np.float32))
wb = up2(cv2.GaussianBlur(bandall.astype(np.float32), (0, 0), 1.0))[..., None]
wb = wb * (np.maximum(L['L1']['alpha'], L['L2']['alpha']) >= 0.5)[..., None]
col0 = col0 * (1 - wb) + up2(bf) * wb
del wb, bf
if MARGIN:
    inner = np.zeros((HH, HW), bool); inner[:H, OX:OX + W] = True
    hole = cv2.dilate((regall & ~inner).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    c0h = cv2.resize(col0, (HW, HH), interpolation=cv2.INTER_AREA)
    mf = pushpull(c0h, (~(hole | bandall)).astype(np.float32))
    wm = up2(cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 1.0))[..., None]
    wm = wm * (np.maximum(L['L1']['alpha'], L['L2']['alpha']) >= 0.5)[..., None]
    col0 = col0 * (1 - wm) + up2(mf) * wm
    del wm, mf, c0h
print('band px', int(L['L1']['band'].sum()), int(L['L2']['band'].sum()))

hy_f = horizon_rows(FW)
Y = np.arange(FH, dtype=np.float32)[:, None]
sky_a = smoothstep(hy_f[None, :] - 110, hy_f[None, :] + 10, Y)
band_rows = int(hy_f.max() + 40)
top = col0[:band_rows].copy()
ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
sf = cv2.morphologyEx(top, cv2.MORPH_OPEN, ker)
sf = cv2.GaussianBlur(sf, (0, 0), sigmaX=40, sigmaY=4)
keep = smoothstep(hy_f[None, :] - 24, hy_f[None, :] + 12, Y[:band_rows])[..., None]
col0[:band_rows] = sf * (1 - keep) + top * keep
alpha0 = sky_a

near_cut_bg = np.zeros((HH, HW), bool)
for k in ('L1', 'L2'):
    near_cut_bg |= (L[k]['dcut'] < 12)
F0 = (wpaint > 0) | near_cut_bg
if MARGIN: F0 |= hole
fill0 = pushpull(logd, (~F0).astype(np.float32))
wf = np.where(F0, 1.0, 0.0).astype(np.float32)
wf = np.maximum(wf, np.clip(wpaint * 2, 0, 1))
ld0 = wf * fill0 + (1 - wf) * logd
hy_h = horizon_rows(HW)
Yh = np.arange(HH, dtype=np.float32)[:, None]
s = smoothstep(hy_h[None, :] - 8, hy_h[None, :] + 8, Yh)
ld0 = s * ld0 + (1 - s) * np.log(DH)
def seamfix(ld, fade=40):
    inner = np.zeros(ld.shape, bool); inner[:H, OX:OX + W] = True
    dout, (iy, ix) = ndi.distance_transform_edt(~inner, return_indices=True)
    ring = (~inner) & (dout <= 1.5)
    delta = np.where(ring, ld[iy, ix] - ld, 0).astype(np.float32)
    _, (ry, rx) = ndi.distance_transform_edt(~ring, return_indices=True)
    dext = cv2.GaussianBlur(delta[ry, rx], (0, 0), 3)
    t = np.clip(dout / fade, 0, 1)
    return np.where(inner, ld, ld + dext * (1 - t * t * (3 - 2 * t)))
if MARGIN: ld0 = seamfix(ld0)
dist_L0 = np.minimum(np.exp(ld0), DH).astype(np.float32)

layers = {'L0': dict(color=col0, alpha=alpha0, dist=dist_L0, box=[0, 0, FW, FH])}
for k in ('L1', 'L2'):
    d = L[k]
    valid = (d['reg'] | (d['djoin'] < 30)) & (d['dcut'] >= 10)
    fk = pushpull(logd, valid.astype(np.float32))
    ldk = np.where(valid, logd, fk)
    if MARGIN: ldk = seamfix(ldk)
    dist_k = np.minimum(np.exp(ldk), DH).astype(np.float32)
    a = d['alpha']
    ys, xs = np.nonzero(a > 0)
    x0 = max(0, (xs.min() // 4) * 4); y0 = max(0, (ys.min() // 4) * 4)
    x1 = min(FW, -(-(xs.max() + 1) // 4) * 4); y1 = min(FH, -(-(ys.max() + 1) // 4) * 4)
    c = up[y0:y1, x0:x1].astype(np.float32)
    ac = a[y0:y1, x0:x1]
    core = ac >= 0.5
    zone = up2(d['wcut'])[y0:y1, x0:x1] > 0.3
    idx = ndi.distance_transform_edt(~core, return_distances=False, return_indices=True)
    fg = c[idx[0], idx[1]]
    rep = (~core) & zone
    c[rep] = fg[rep]
    edge = (ac > 0) & (ac < 0.5) & zone
    c[edge] = fg[edge]
    del idx, fg
    layers[k] = dict(color=c, alpha=ac, dist=dist_k[y0 // 2:y1 // 2, x0 // 2:x1 // 2], box=[int(x0), int(y0), int(x1), int(y1)])

orig = up.astype(np.float32)
c0 = layers['L0']['color']
cover = np.zeros((FH, FW), np.float32)
for k in ('L2', 'L1'):
    Ly = layers[k]
    x0, y0, x1, y1 = Ly['box']
    a = np.round(Ly['alpha'] * 255) / 255
    Ly['alpha'] = a
    o = orig[y0:y1, x0:x1]; b = c0[y0:y1, x0:x1]; cv_ = cover[y0:y1, x0:x1]
    lo = (a > 0) & (a < 0.5) & (cv_ == 0)
    al = a[lo][:, None]
    b[lo] = np.clip((o[lo] - al * Ly['color'][lo]) / (1 - al), 0, 255)
    hi = (a >= 0.5) & (a < 1)
    ah = a[hi][:, None]
    Ly['color'][hi] = np.clip((o[hi] - (1 - ah) * b[hi]) / ah, 0, 255)
    err = np.abs(a[..., None] * Ly['color'] + (1 - a[..., None]) * b - o).max(-1)
    fix = (a > 0) & (a < 1) & (err > 3)
    fix = cv2.dilate(fix.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    fix &= (a > 0) & (a < 1) & (cv_ == 0)
    b[fix] = o[fix]; Ly['color'][fix] = o[fix]
    cv_[:] = np.maximum(cv_, a)
os.makedirs('public/assets/mars/full', exist_ok=True); os.makedirs('public/assets/mars/web', exist_ok=True)
meta = {}
for k, Ly in layers.items():
    c8 = np.clip(Ly['color'] + 0.5, 0, 255).astype(np.uint8)
    a8 = np.clip(Ly['alpha'] * 255 + 0.5, 0, 255).astype(np.uint8)
    x0, y0, x1, y1 = Ly['box']
    for setname, sc in (('full', 1), ('web', 2)):
        cc = c8 if sc == 1 else cv2.resize(c8, ((x1 - x0) // 2, (y1 - y0) // 2), interpolation=cv2.INTER_AREA)
        aa = a8 if sc == 1 else cv2.resize(a8, ((x1 - x0) // 2, (y1 - y0) // 2), interpolation=cv2.INTER_AREA)
        dd = Ly['dist'] if sc == 1 else np.exp(cv2.resize(np.log(Ly['dist']), (Ly['dist'].shape[1] // 2, Ly['dist'].shape[0] // 2), interpolation=cv2.INTER_AREA)).astype(np.float32)
        base = f'public/assets/mars/{setname}/relief-{k}'
        cv2.imwrite(base + '-color.jpg', cc, [cv2.IMWRITE_JPEG_QUALITY, 94])
        cv2.imwrite(base + '-alpha.png', aa, [cv2.IMWRITE_PNG_COMPRESSION, 9])
        dd.astype('<f4').tofile(base + '-dist.bin')
    bx = Ly['box']
    meta[k] = dict(box=[bx[0] - 2 * OX, bx[1], bx[2] - 2 * OX, bx[3]], distSize=[int(Ly['dist'].shape[1]), int(Ly['dist'].shape[0])],
                   distRange=[float(Ly['dist'][Ly['alpha'][::2, ::2] > 0].min()), float(Ly['dist'][Ly['alpha'][::2, ::2] > 0].max())])
meta['_margin'] = dict(left=2 * OX, right=2 * OX, bottom=2 * MB)
json.dump(meta, open('out/work/build-meta.json', 'w'), indent=1)
np.save('out/work/hy_half.npy', hy_h)
print(json.dumps(meta, indent=1))
