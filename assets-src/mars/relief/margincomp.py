import sys, numpy as np, cv2
from scipy import ndimage as ndi
sys.path.insert(0, 'assets-src/mars/relief')
from fill import pushpull
OX, MB = 338, 190
W, H = 2816, 1584
EW, EH = W + 2 * OX, H + MB

def poisson_strip(sig, dmax):
    n = sig.shape[0]
    out = np.zeros((dmax, n, sig.shape[1]), np.float32)
    for d in range(1, dmax + 1):
        r = int(min(n, 12 * d + 4))
        x = np.arange(-r, r + 1, dtype=np.float32)
        k = d / (np.pi * (x * x + d * d)); k /= k.sum()
        pad = np.pad(sig, ((r, r), (0, 0)), mode='edge')
        for c in range(sig.shape[1]):
            out[d - 1, :, c] = np.convolve(pad[:, c], k, mode='valid')
    return out

def membrane(inner_ref, inner_new, outer_new, fade_px, ox, oy):
    eh, ew = outer_new.shape[:2]
    h, w = inner_ref.shape[:2]
    inside = np.zeros((eh, ew), bool); inside[oy:oy + h, ox:ox + w] = True
    diff0 = inner_ref.astype(np.float32) - inner_new.astype(np.float32)
    band = np.zeros((h, w), np.float32); bw = int(3 * fade_px)
    band[:, :bw] = 1; band[:, -bw:] = 1; band[-bw:, :] = 1
    low = pushpull(cv2.GaussianBlur(diff0 * band[..., None], (0, 0), fade_px) , cv2.GaussianBlur(band, (0, 0), fade_px))
    lowpad = np.zeros((eh, ew, 3), np.float32); lowpad[oy:oy + h, ox:ox + w] = low
    lw = np.zeros((eh, ew), np.float32); lw[oy:oy + h, ox:ox + w] = 1
    lowext = pushpull(lowpad, lw)
    dwide = ndi.distance_transform_edt(~inside)
    tw_ = np.clip(dwide / (8 * fade_px), 0, 1); fw = (1 - tw_ * tw_ * (3 - 2 * tw_))[..., None]
    outer_new = outer_new.astype(np.float32) + lowext * fw
    inner_new = inner_new.astype(np.float32) + low
    diff = inner_ref.astype(np.float32) - inner_new
    dmax = int(np.ceil(fade_px))
    ext = np.zeros((eh, ew, 3), np.float32)
    bl = np.pad(diff[:, 0], ((oy, eh - h - oy), (0, 0)), mode='edge')
    br = np.pad(diff[:, -1], ((oy, eh - h - oy), (0, 0)), mode='edge')
    bb = np.pad(diff[-1], ((ox, ew - w - ox), (0, 0)), mode='edge')
    sl = poisson_strip(bl, min(dmax, ox)); sr = poisson_strip(br, min(dmax, ew - w - ox)); sb = poisson_strip(bb, min(dmax, eh - h - oy))
    for d in range(sl.shape[0]): ext[:, ox - 1 - d] = sl[d]
    for d in range(sr.shape[0]): ext[:, ox + w + d] = sr[d]
    for d in range(sb.shape[0]): ext[oy + h + d, :] = sb[d]
    dout = ndi.distance_transform_edt(~inside)
    t = np.clip(dout / fade_px, 0, 1)
    fade = (1 - t * t * (3 - 2 * t))[..., None]
    out = outer_new.astype(np.float32) + ext * fade
    out[oy:oy + h, ox:ox + w] = inner_ref
    return np.clip(out, 0, 255), inside

if sys.argv[1] == 'half':
    take = sys.argv[2]
    o = cv2.imread('references/approved/mars-close.jpg')
    ta = cv2.imread(f'out/work/margin-{take}-aligned.png')[:EH]
    go = cv2.cvtColor(o, cv2.COLOR_BGR2GRAY); gt = cv2.cvtColor(ta[:H, OX:OX + W], cv2.COLOR_BGR2GRAY)
    fl = cv2.calcOpticalFlowFarneback(go, gt, None, 0.5, 6, 41, 5, 7, 1.5, cv2.OPTFLOW_FARNEBACK_GAUSSIAN)
    inside = np.zeros((EH, EW), bool); inside[:H, OX:OX + W] = True
    din = ndi.distance_transform_edt(inside)
    band = inside & (din >= 4) & (din <= 48)
    band[:300] = False
    full_fl = np.zeros((EH, EW, 2), np.float32); full_fl[:H, OX:OX + W] = fl
    full_fl = cv2.GaussianBlur(full_fl, (0, 0), 6)
    ext = pushpull(full_fl, band.astype(np.float32))
    ext = cv2.GaussianBlur(ext, (0, 0), 12)
    dout = ndi.distance_transform_edt(~inside)
    t = np.clip(dout / 400, 0, 1); dec = (1 - t * t * (3 - 2 * t))[..., None]
    ext = ext * dec
    gy, gx = np.mgrid[0:EH, 0:EW].astype(np.float32)
    tw = cv2.remap(ta, (gx + ext[..., 0]).astype(np.float32), (gy + ext[..., 1]).astype(np.float32), cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
    np.save('out/work/margin-flow-ext.npy', ext.astype(np.float16))
    print('edge flow at band: median', float(np.median(np.hypot(*full_fl[band].T))), 'p99', float(np.percentile(np.hypot(*full_fl[band].T), 99)))
    out, _ = membrane(o, tw[:H, OX:OX + W], tw, 0.015 * W, OX, 0)
    g = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)
    th = g - cv2.morphologyEx(g, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    inside = np.zeros(g.shape, bool); inside[:H, OX:OX + W] = True
    lab, n = ndi.label(th > 18)
    sizes = ndi.sum(np.ones_like(g), lab, np.arange(1, n + 1))
    small = np.isin(lab, np.nonzero(sizes <= 12)[0] + 1)
    spk = cv2.dilate((small & ~inside).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    spk &= ~inside
    med = cv2.medianBlur(np.clip(out, 0, 255).astype(np.uint8), 7).astype(np.float32)
    out[spk] = med[spk]
    print('despeckled margin px', int(spk.sum()))
    cv2.imwrite('out/work/ext-2816.png', np.round(out).astype(np.uint8))
else:
    up = cv2.imread('out/work/mars-upscaled.png')
    eu = cv2.imread('out/work/ext-5632.png')
    assert eu.shape[:2] == (2 * EH, 2 * EW)
    eu = eu.astype(np.float32)
    t2 = cv2.imread('out/work/margin-t2-aligned.png').astype(np.float32)
    X0, Y0, IW, IH, CW = 3600, 600, 2032, 1524, 2708
    a = np.ones((IH, CW), np.float32); r = np.arange(120, dtype=np.float32) / 120; r = r * r * (3 - 2 * r)
    a[:120] *= r[:, None]; a[-120:] *= r[::-1, None]; a[:, :120] *= r[None]
    x0 = 2 * OX + X0
    sl = eu[Y0:Y0 + IH, x0:x0 + CW]
    eu[Y0:Y0 + IH, x0:x0 + CW] = t2[:, :CW] * a[..., None] + sl * (1 - a[..., None])
    out, _ = membrane(up, eu[:2 * H, 2 * OX:2 * OX + 2 * W], eu, 16, 2 * OX, 0)
    out = np.round(out).astype(np.uint8)
    cv2.imwrite('out/work/ext-full.png', out)
    e2 = cv2.imread('out/work/ext-2816.png')
    sm = cv2.resize(out, (EW, EH), interpolation=cv2.INTER_AREA)
    e2[:, OX + W:] = sm[:, OX + W:]
    cv2.imwrite('out/work/ext-2816.png', e2)
