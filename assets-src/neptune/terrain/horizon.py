import json
import sys
import cv2
import numpy as np
from scipy.optimize import least_squares

CLOSE = 'references/approved/neptune-close.jpg'


def trace(img):
    b = cv2.medianBlur(img, 9).astype(np.float32)
    lum = cv2.GaussianBlur(b[:, :, 0] * 0.6 + b[:, :, 1] * 0.4, (0, 0), 3)
    h, w = lum.shape
    grad = lum[4:, :] - lum[:-4, :]
    pts = []
    for x in range(20, w - 20, 16):
        col = grad[:, x]
        top = int(np.argmax(col[: int(h * 0.6)] > 5.0))
        if top == 0:
            continue
        win = col[top: top + 40]
        y = top + int(np.argmax(win)) + 2
        pts.append((x, y))
    pts = np.array(pts, np.float64)
    keep = np.ones(len(pts), bool)
    for _ in range(8):
        c = np.polyfit(pts[keep, 0], pts[keep, 1], 3)
        err = np.abs(np.polyval(c, pts[:, 0]) - pts[:, 1])
        keep = err < max(3.0, 2.5 * np.median(err[keep]))
    return pts[keep]


def rays(pts, w, h, vfov):
    f = (h / 2) / np.tan(np.radians(vfov) / 2)
    d = np.stack([(pts[:, 0] - w / 2) / f, -(pts[:, 1] - h / 2) / f, -np.ones(len(pts))], 1)
    return d / np.linalg.norm(d, axis=1, keepdims=True)


def nadir(pitch, roll):
    n = np.array([0.0, -np.cos(pitch), -np.sin(pitch)])
    c, s = np.cos(roll), np.sin(roll)
    return np.array([c * n[0] - s * n[1], s * n[0] + c * n[1], n[2]])


def fit(pts, w, h, vfov):
    d = rays(pts, w, h, vfov)

    def res(p):
        return np.degrees(np.arccos(np.clip(d @ nadir(p[0], p[1]), -1, 1))) - p[2]

    r = least_squares(res, [0.3, 0.1, 75.0], loss='soft_l1', f_scale=0.05)
    return r.x, float(np.sqrt(np.mean(res(r.x) ** 2)))


if __name__ == '__main__':
    img = cv2.imread(CLOSE)
    h, w = img.shape[:2]
    pts = trace(img)
    vis = img.copy()
    for x, y in pts:
        cv2.circle(vis, (int(x), int(y)), 3, (0, 0, 255), -1)
    cv2.imwrite('out/work/nep/terrain/horizon-points.jpg', cv2.resize(vis, (1408, 792)))
    for vfov in [30, 40, 50, 60, 70, 80]:
        p, rms = fit(pts, w, h, vfov)
        alpha = np.radians(p[2])
        radius = np.sin(alpha) / (1 - np.sin(alpha))
        print('vfov %d pitch %.2f roll %.2f alpha %.3f dip %.3f R/h %.2f rms %.4f deg' % (vfov, np.degrees(p[0]), np.degrees(p[1]), p[2], 90 - p[2], radius, rms))
    if len(sys.argv) > 1:
        vfov = float(sys.argv[1])
        p, rms = fit(pts, w, h, vfov)
        alpha = np.radians(p[2])
        json.dump({'vfovDeg': vfov, 'pitchDeg': float(np.degrees(p[0])), 'rollDeg': float(np.degrees(p[1])), 'alphaDeg': float(p[2]), 'radius': float(np.sin(alpha) / (1 - np.sin(alpha))), 'nadir': nadir(p[0], p[1]).tolist(), 'rmsDeg': rms}, open('src/stops/neptune/close.json', 'w'), indent=1)
