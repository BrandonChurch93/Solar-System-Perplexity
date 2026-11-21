import sys

import cv2
import numpy as np
from scipy import ndimage

import geom

sys.path.insert(0, 'assets-src/jupiter/sky')
import patch as skypatch

WORK = 'out/work/jupiter/relief'
CW, CH = geom.CANVAS['size']
OX, OY = geom.CANVAS['origin']
W, H = geom.W, geom.H
PHI = (-100.0, 100.0, 0.1)
ELEV = (0.0, 8.0, 0.025)
KEEP = (0.4, 0.6)


def table(image):
    phi = np.arange(PHI[0], PHI[1] + 1e-6, PHI[2])
    elev = np.arange(ELEV[0], ELEV[1] + 1e-6, ELEV[2])
    pp, ee = np.meshgrid(phi, elev)
    d = geom.unpolar(pp, ee)
    x, y = geom.project(d)
    ok = (d[..., 2] < -0.05) & (x >= 0) & (x <= W - 1) & (y >= 0) & (y <= H - 1)
    samp = cv2.remap(image, x.astype(np.float32), y.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    out = np.zeros_like(samp)
    cols = np.where(ok.any(0))[0]
    for r in range(len(elev)):
        valid = np.where(ok[r])[0]
        if len(valid) < 40:
            out[r] = out[r - 1] * 0.97 if r else 0
            continue
        a, b = valid[0], valid[-1]
        row = samp[r, a:b + 1]
        low = ndimage.percentile_filter(row, 25, size=(81, 1), mode='nearest')
        low = ndimage.gaussian_filter1d(low, 25, axis=0, mode='nearest')
        out[r, a:b + 1] = low
        out[r, :a] = low[0]
        out[r, b + 1:] = low[-1]
    out = ndimage.gaussian_filter1d(out, 1.5, axis=0, mode='nearest')
    high = (elev >= 5.0) & (elev <= 7.5)
    seen = ok[high].mean(0) > 0.6
    lin = skypatch.unfilm(skypatch.to_linear(out / 255))
    back = np.median(lin[high], axis=0)
    idx = np.where(seen)[0]
    back = back[np.clip(np.arange(len(phi)), idx[0], idx[-1])]
    back = ndimage.gaussian_filter1d(back, 50, axis=0, mode='nearest')
    print('sky background behind the rim glow, scene linear x1000', np.round(back[::200] * 1000, 1).tolist())
    out = skypatch.to_srgb(skypatch.film(np.maximum(lin - back[None], 0))) * 255
    fade = 1 - np.clip((elev - 2.0) / 3.0, 0, 1)
    fade = fade * fade * (3 - 2 * fade)
    night = 1 - np.clip((phi - 38.0) / 40.0, 0, 1) * 0.85
    return out * fade[:, None, None] * night[None, :, None]


def seam(canvas, image, scale=320.0, band=12, blend=24):
    x1, y1 = OX + W, OY + H

    def ratio(inner, outer):
        r = (inner + 2.0) / (outer + 2.0)
        return np.clip(ndimage.gaussian_filter1d(r, 12, axis=0, mode='nearest'), 0.3, 3.0)

    right = ratio(image[:, W - band:].mean(1), canvas[OY:y1, x1:x1 + band].mean(1))
    left = ratio(image[:, :band].mean(1), canvas[OY:y1, OX - band:OX].mean(1))
    bottom = ratio(image[H - band:].mean(0), canvas[y1:y1 + band, OX:x1].mean(0))
    top = np.ones((W, 3), np.float32)
    print('seam ratios right', np.round(np.percentile(right, [5, 50, 95]), 2), 'left', np.round(np.percentile(left, [5, 50, 95]), 2), 'bottom', np.round(np.percentile(bottom, [5, 50, 95]), 2))

    take = np.clip((blend - (np.arange(blend)[::-1] + 1)) / blend, 0, 1)
    take = take * take * (3 - 2 * take)
    core = canvas[OY:y1, OX:x1]
    stripe = core[:, W - blend:]
    stripe += (right[:, None, :] - 1) * (stripe - image[:, W - blend:] * (1 - take)[None, :, None])
    stripe = core[:, :blend]
    stripe += (left[:, None, :] - 1) * (stripe - image[:, :blend] * (1 - take[::-1])[None, :, None])
    stripe = core[H - blend:]
    stripe += (bottom[None, :, :] - 1) * (stripe - image[H - blend:] * (1 - take)[:, None, None])

    ys, xs = np.mgrid[0:CH, 0:CW]
    cx = np.clip(xs, OX, x1 - 1) - OX
    cy = np.clip(ys, OY, y1 - 1) - OY
    dx = np.abs(xs - (cx + OX)).astype(np.float32)
    dy = np.abs(ys - (cy + OY)).astype(np.float32)
    side = np.where((xs >= x1)[..., None], right[cy], left[cy])
    side = np.where(((xs >= OX) & (xs < x1))[..., None], 1.0, side)
    flat = np.where((ys >= y1)[..., None], bottom[cx], top[cx])
    w = (dx / np.maximum(dx + dy, 1e-6))[..., None]
    r = side * w + flat * (1 - w)
    fall = np.exp(-np.hypot(dx, dy) / scale)[..., None]
    outside = ((dx + dy) > 0)[..., None]
    canvas *= np.where(outside, 1 + (r - 1) * fall, 1.0)
    np.clip(canvas, 0, 255, out=canvas)


def main():
    canvas = np.load(f'{WORK}/canvas.npy')
    image = cv2.imread('references/approved/jupiter-close.jpg')[..., ::-1].astype(np.float32)
    seam(canvas, image)
    ys, xs = np.mgrid[0:CH, 0:CW].astype(np.float64)
    d = geom.rays(xs - OX + 0.5, ys - OY + 0.5)
    phi, elev = geom.polar(d)
    sky = elev > 0
    np.save(f'{WORK}/canvas-elev.npy', elev.astype(np.float32))
    np.save(f'{WORK}/canvas-phi.npy', phi.astype(np.float32))

    fill = canvas[OY:2 * OY, :OX][::-1]
    blank = np.zeros((CH, CW), bool)
    blank[:OY, :OX] = True
    part = canvas[:OY, :OX]
    part[:] = fill
    soft = ndimage.gaussian_filter(part, (12, 12, 0))
    w = np.clip(-elev[:OY, :OX] / 1.2, 0, 1)[..., None]
    top = np.percentile(canvas[OY:OY + 40, :OX].reshape(-1, 3), 70, axis=0)
    part[:] = soft * w + top * (1 - w)

    rim = table(image)
    np.save(f'{WORK}/rim-table.npy', rim.astype(np.float32))
    u = ((phi - PHI[0]) / PHI[2]).astype(np.float32)
    v = ((elev - ELEV[0]) / ELEV[2]).astype(np.float32)
    glow = cv2.remap(rim, u, v, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    lin = lambda a: skypatch.unfilm(skypatch.to_linear(a / 255))
    code = lambda a: skypatch.to_srgb(skypatch.film(a)) * 255
    box = (slice(OY, OY + H), slice(OX, OX + W))
    e, p = elev[box].astype(np.float64), phi[box].astype(np.float64)
    glow_lin = lin(glow[box])
    own = np.maximum(lin(image) - glow_lin, 0)
    x, y = geom.project(geom.unpolar(p, KEEP[0] + np.abs(e - KEEP[0])))
    mirror = cv2.remap(own, x.astype(np.float32), y.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    w = np.clip((e - KEEP[0] + 0.15) / 0.15, 0, 1)[..., None].astype(np.float32)
    patch = own * w + mirror * (1 - w)
    lost = ((x < 0) | (x > W - 1) | (y < 0) | (y > H - 1)) & (w[..., 0] < 1)
    head = np.cumprod(lost, axis=1).astype(bool)
    tail = np.cumprod(lost[:, ::-1], axis=1).astype(bool)[:, ::-1] & ~head
    cols = np.arange(W)[None, :]
    src = np.where(head, 2 * head.sum(1)[:, None] - 1 - cols, np.where(tail, 2 * (W - tail.sum(1))[:, None] - 1 - cols, cols))
    src = np.clip(src, 0, W - 1)
    rows = np.broadcast_to(np.arange(H)[:, None], src.shape)
    still = lost[rows, src]
    print('mirror samples outside the picture', int(lost.sum()), 'filled by row reflection', int((lost & ~still).sum()), 'left on the background', int(still.sum()))
    back = np.median(own[e > 2.0], axis=0)
    patch = np.where(lost[..., None], np.where(still[..., None], back, patch[rows, src]), patch).astype(np.float32)
    np.save(f'{WORK}/sky-lin.npy', patch.astype(np.float32))
    keep = np.clip((KEEP[1] - e) / (KEEP[1] - KEEP[0]), 0, 1)[..., None].astype(np.float32)
    calm = cv2.GaussianBlur(patch, (0, 0), 6)
    held = code(np.maximum(lin(image) - calm, 0) * keep + glow_lin * (1 - keep))
    canvas[sky] = glow[sky]
    part = canvas[box]
    part[sky[box]] = held[sky[box]]
    np.save(f'{WORK}/canvas-final.npy', canvas)

    core = cv2.imread(f'{WORK}/close2x.png')[..., ::-1].astype(np.float32)
    ys2, xs2 = np.mgrid[0:2 * H, 0:2 * W].astype(np.float64)
    d2 = geom.rays((xs2 + 0.5) / 2, (ys2 + 0.5) / 2)
    phi2, elev2 = geom.polar(d2)
    u2 = ((phi2 - PHI[0]) / PHI[2]).astype(np.float32)
    v2 = ((elev2 - ELEV[0]) / ELEV[2]).astype(np.float32)
    glow2 = cv2.remap(rim, u2, v2, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    keep2 = np.clip((KEEP[1] - elev2) / (KEEP[1] - KEEP[0]), 0, 1)[..., None].astype(np.float32)
    calm2 = cv2.resize(calm, (2 * W, 2 * H), interpolation=cv2.INTER_LINEAR)
    held2 = code(np.maximum(lin(core) - calm2, 0) * keep2 + lin(glow2) * (1 - keep2))
    core[elev2 > 0] = held2[elev2 > 0]
    np.save(f'{WORK}/core-final.npy', core)
    resid = np.clip(image - canvas[OY:OY + H, OX:OX + W], 0, 255)
    cv2.imwrite(f'{WORK}/canvas-half.png', np.round(cv2.resize(canvas, (CW // 2, CH // 2), interpolation=cv2.INTER_AREA)[..., ::-1]).astype(np.uint8))
    cv2.imwrite('out/work/view/deck_canvas.jpg', cv2.resize(canvas[..., ::-1], (1408, 792), interpolation=cv2.INTER_AREA).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
    cv2.imwrite('out/work/view/deck_skyres.jpg', (np.clip(cv2.resize(resid[..., ::-1], (1408, 792), interpolation=cv2.INTER_AREA) * 3, 0, 255)).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
    crop = canvas[OY:OY + 700, OX + 900:OX + 2300]
    cv2.imwrite('out/work/view/deck_rim_crop.jpg', np.clip(crop[..., ::-1] * 2, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])


main()
