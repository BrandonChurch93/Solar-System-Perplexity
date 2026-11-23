import json
import sys
import numpy as np
import cv2

APPROVED = 'references/approved/sun-close.jpg'
t = json.load(open('src/stops/sun/terrain.json'))
TY = np.tan(np.radians(t['vfovDeg']) / 2)
TX = TY * 16 / 9
down = np.array(t['down'], dtype=np.float64)
down /= np.linalg.norm(down)
alpha = np.radians(t['alphaDeg'])


def predicted(ax, h):
    ys = (np.arange(h * 4) + 0.5) / (h * 4)
    d = np.stack([np.full_like(ys, (ax - 0.5) * 2 * TX), (0.5 - ys) * 2 * TY, -np.ones_like(ys)], 1)
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    ang = np.arccos(np.clip(d @ down, -1, 1))
    i = int(np.argmax(ang < alpha))
    return ys[i] * h


def main():
    im = cv2.imread(APPROVED).astype(np.float32) / 255
    h, w = im.shape[:2]
    lum = cv2.GaussianBlur(im @ np.array([0.0722, 0.7152, 0.2126], dtype=np.float32), (0, 0), 3)
    out = []
    for ax in np.arange(0.02, 0.99, 0.01):
        if 0.30 < ax < 0.42 or 0.66 < ax < 0.82:
            continue
        col = lum[:, int(ax * w)]
        p = predicted(ax, h)
        lo, hi = int(max(p - 90, 0)), int(min(p + 90, h - 1))
        seg = col[lo:hi]
        sky = float(np.median(col[max(lo - 60, 0):lo + 10]))
        body = float(np.median(col[hi:hi + 80]))
        level = sky + 0.5 * (body - sky)
        hit = np.argmax(seg > level)
        out.append((ax, p, lo + hit, lo + hit - p))
    a = np.array(out)
    res = a[:, 3]
    print('columns', len(a), 'mean', res.mean().round(2), 'median', np.median(res).round(2), 'rms', np.sqrt((res ** 2).mean()).round(2), 'px of', h)
    for row in a[::6]:
        print('  x %.2f predicted row %.1f seen %.1f diff %+.1f' % tuple(row))
    if len(sys.argv) > 1:
        vis = cv2.imread(APPROVED)
        for ax in np.arange(0, 1, 0.002):
            p = predicted(ax, h)
            cv2.circle(vis, (int(ax * w), int(p)), 2, (255, 255, 0), -1)
        cv2.imwrite(sys.argv[1], cv2.resize(vis, (1408, 792), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
    json.dump({'columns': len(a), 'meanPx': round(float(res.mean()), 2), 'medianPx': round(float(np.median(res)), 2), 'rmsPx': round(float(np.sqrt((res ** 2).mean())), 2), 'imageHeight': h}, open('out/work/sun/pl/limb.json', 'w'))


main()
