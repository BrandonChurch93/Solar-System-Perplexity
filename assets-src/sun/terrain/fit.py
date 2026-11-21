import json
import numpy as np
import cv2
from scipy.optimize import least_squares
from scipy import ndimage as ndi

WORK = 'out/work/sun'
VFOV = 55.0
ASPECT = 16 / 9
TY = np.tan(np.radians(VFOV) / 2)
TX = TY * ASPECT


def edge(path):
    im = cv2.imread(path).astype(np.float32) / 255
    lum = cv2.GaussianBlur(im @ np.array([0.0722, 0.7152, 0.2126], dtype=np.float32), (0, 0), 2.5)
    body = ndi.uniform_filter1d(lum, 40, axis=0, origin=-19)
    hit = (lum > 0.2) & (body > 0.24)
    rows = hit.argmax(0).astype(np.float32)
    ok = hit.any(0)
    return rows, ok


def main():
    reg = json.load(open(f'{WORK}/register.json'))
    pts = []
    for name, file, keep in (('clean', 'close-clean-take1.png', lambda x: (x > 0.02) & (x < 0.98)), ('wide', 'close-wide-take1.png', lambda x: (x < 0.0) | (x > 1.0))):
        rows, ok = edge(f'{WORK}/{file}')
        m = np.array(reg[name]['matrix'])
        cols = np.arange(rows.size) + 0.5
        ax = (cols - m[0, 2]) / m[0, 0] / 2816
        ay = (rows - m[1, 2]) / m[1, 1] / 1584
        sel = ok & keep(ax)
        pts.append(np.stack([ax[sel], ay[sel]], 1))
        print(name, int(sel.sum()), 'points, x', ax[sel].min().round(3), ax[sel].max().round(3))
    p = np.concatenate(pts)
    med = ndi.median_filter(p[np.argsort(p[:, 0]), 1], 31)
    p = p[np.argsort(p[:, 0])]
    p = p[np.abs(p[:, 1] - med) < 0.01]
    d = np.stack([(p[:, 0] - 0.5) * 2 * TX, (0.5 - p[:, 1]) * 2 * TY, -np.ones(len(p))], 1)
    d /= np.linalg.norm(d, axis=1, keepdims=True)

    def centre(q):
        pitch, yaw = q[0], q[1]
        return np.array([np.sin(yaw) * np.cos(pitch), -np.sin(pitch), -np.cos(yaw) * np.cos(pitch)])

    def res(q):
        return np.arccos(np.clip(d @ centre(q), -1, 1)) - q[2]

    fit = least_squares(res, [np.radians(80), 0.0, np.radians(76)], loss='soft_l1', f_scale=0.002)
    for _ in range(3):
        ok = np.abs(res(fit.x)) < np.radians(0.6)
        d, p = d[ok], p[ok]
        fit = least_squares(res, fit.x, loss='soft_l1', f_scale=0.002)
    print('residual percentiles deg', np.degrees(np.percentile(res(fit.x), [2, 10, 50, 90, 98])).round(3))
    pitch, yaw, alpha = fit.x
    r = np.sin(alpha) / (1 - np.sin(alpha))
    c = centre(fit.x)
    out = {
        'vfovDeg': VFOV,
        'down': c.tolist(),
        'pitchDeg': float(np.degrees(pitch)), 'yawDeg': float(np.degrees(yaw)), 'alphaDeg': float(np.degrees(alpha)),
        'radius': float(r), 'horizonDistance': float(np.sqrt((r + 1) ** 2 - r ** 2)),
        'residualRmsDeg': float(np.degrees(np.sqrt(np.mean(res(fit.x) ** 2)))),
        'points': len(p),
        'canvas': {'left': float(-reg['wide']['matrix'][0][2] / reg['wide']['matrix'][0][0] / 2816), 'top': float(-reg['wide']['matrix'][1][2] / reg['wide']['matrix'][1][1] / 1584), 'width': float(reg['wide']['takeSize'][0] / reg['wide']['matrix'][0][0] / 2816), 'height': float(reg['wide']['takeSize'][1] / reg['wide']['matrix'][1][1] / 1584)},
    }
    print(json.dumps(out, indent=1))
    json.dump(out, open('assets-src/sun/terrain/fit.json', 'w'), indent=1)
    np.save(f'{WORK}/horizon-points.npy', p)
    im = cv2.imread(f'{WORK}/close-wide-take1.png')
    m = np.array(reg['wide']['matrix'])
    for x, y in p:
        cv2.circle(im, (int(x * 2816 * m[0, 0] + m[0, 2]), int(y * 1584 * m[1, 1] + m[1, 2])), 1, (255, 255, 0), -1)
    xs = np.linspace(-0.25, 1.25, 600)
    for x in xs:
        lo, hi = -0.3, 1.3
        for _ in range(30):
            mid = (lo + hi) / 2
            dd = np.array([(x - 0.5) * 2 * TX, (0.5 - mid) * 2 * TY, -1.0])
            dd /= np.linalg.norm(dd)
            if np.arccos(dd @ c) > alpha:
                lo = mid
            else:
                hi = mid
        cv2.circle(im, (int(x * 2816 * m[0, 0] + m[0, 2]), int(lo * 1584 * m[1, 1] + m[1, 2])), 1, (0, 0, 255), -1)
    cv2.imwrite(f'{WORK}/horizon-fit.jpg', im, [cv2.IMWRITE_JPEG_QUALITY, 88])


main()
