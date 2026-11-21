import cv2
import numpy as np
from scipy import ndimage

import geom

WORK = 'out/work/jupiter/relief'
CW, CH = geom.CANVAS['size']
OX, OY = geom.CANVAS['origin']
W, H = geom.W, geom.H
PHI = (-100.0, 100.0, 0.1)
ELEV = (0.0, 8.0, 0.025)


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
    fade = 1 - np.clip((elev - 2.0) / 3.0, 0, 1)
    fade = fade * fade * (3 - 2 * fade)
    night = 1 - np.clip((phi - 38.0) / 40.0, 0, 1) * 0.85
    return out * fade[:, None, None] * night[None, :, None]


def main():
    canvas = np.load(f'{WORK}/canvas.npy')
    image = cv2.imread('references/approved/jupiter-close.jpg')[..., ::-1].astype(np.float32)
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
    keep = np.clip((0.4 - elev) / 0.15, 0, 1)[..., None]
    inside = np.zeros((CH, CW, 1), np.float32)
    inside[OY:OY + H, OX:OX + W] = 1
    keep = keep * inside
    canvas[sky] = (canvas * keep + glow * (1 - keep))[sky]
    np.save(f'{WORK}/canvas-final.npy', canvas)

    core = cv2.imread(f'{WORK}/close2x.png')[..., ::-1].astype(np.float32)
    ys2, xs2 = np.mgrid[0:2 * H, 0:2 * W].astype(np.float64)
    d2 = geom.rays((xs2 + 0.5) / 2, (ys2 + 0.5) / 2)
    phi2, elev2 = geom.polar(d2)
    u2 = ((phi2 - PHI[0]) / PHI[2]).astype(np.float32)
    v2 = ((elev2 - ELEV[0]) / ELEV[2]).astype(np.float32)
    glow2 = cv2.remap(rim, u2, v2, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    keep2 = np.clip((0.4 - elev2) / 0.15, 0, 1)[..., None]
    core[elev2 > 0] = (core * keep2 + glow2 * (1 - keep2))[elev2 > 0]
    np.save(f'{WORK}/core-final.npy', core)
    resid = np.clip(image - canvas[OY:OY + H, OX:OX + W], 0, 255)
    cv2.imwrite(f'{WORK}/canvas-half.png', np.round(cv2.resize(canvas, (CW // 2, CH // 2), interpolation=cv2.INTER_AREA)[..., ::-1]).astype(np.uint8))
    cv2.imwrite('out/work/view/deck_canvas.jpg', cv2.resize(canvas[..., ::-1], (1408, 792), interpolation=cv2.INTER_AREA).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
    cv2.imwrite('out/work/view/deck_skyres.jpg', (np.clip(cv2.resize(resid[..., ::-1], (1408, 792), interpolation=cv2.INTER_AREA) * 3, 0, 255)).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])
    crop = canvas[OY:OY + 700, OX + 900:OX + 2300]
    cv2.imwrite('out/work/view/deck_rim_crop.jpg', np.clip(crop[..., ::-1] * 2, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 88])


main()
