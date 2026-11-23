"""S1 check picture: the globe side drawn from the solved camera beside the close side at the same frame.

usage: python3 assets-src/sun/place/check.py GLOBE.png CLOSE.jpg OUT.jpg [GLOBE_TEXELS.png]
Draws the limb and the spot that src/stops/sun/place.json predicts on both, and, when the
texels view of the globe side is given, measures where the sphere's edge lies in it.
"""
import json
import sys
import numpy as np
import cv2

place = json.load(open('src/stops/sun/place.json'))
t = json.load(open('src/stops/sun/terrain.json'))
TY = np.tan(np.radians(place['vfovDeg']) / 2)
TX = TY * 16 / 9
centre = np.array(place['stage']['centre'])
R = place['stage']['radius']
down = centre / np.linalg.norm(centre)
alpha = np.arcsin(R / np.linalg.norm(centre))


def limb_row(ax, h):
    ys = (np.arange(h * 8) + 0.5) / (h * 8)
    d = np.stack([np.full_like(ys, (ax - 0.5) * 2 * TX), (0.5 - ys) * 2 * TY, -np.ones_like(ys)], 1)
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    hit = np.arccos(np.clip(d @ down, -1, 1)) < alpha
    return float(ys[int(np.argmax(hit))] * h) if hit.any() else -1.0


def mark(im):
    h, w = im.shape[:2]
    for x in range(0, w, 6):
        y = limb_row((x + 0.5) / w, h)
        if y >= 0:
            cv2.circle(im, (x, int(round(y))), 1, (255, 255, 0), -1, cv2.LINE_AA)
    sx, sy = t['spot'][0] * w, t['spot'][1] * h
    cv2.drawMarker(im, (int(sx), int(sy)), (255, 255, 0), cv2.MARKER_CROSS, 26, 1, cv2.LINE_AA)
    for f in t['feet']:
        cv2.drawMarker(im, (int(f[0] * w), int(f[1] * h)), (0, 255, 0), cv2.MARKER_TILTED_CROSS, 18, 1, cv2.LINE_AA)
    return im


def main():
    g = cv2.imread(sys.argv[1])
    c = cv2.imread(sys.argv[2])
    w = 1280
    size = (w, w * 9 // 16)
    g = cv2.resize(g, size, interpolation=cv2.INTER_AREA)
    c = cv2.resize(c, size, interpolation=cv2.INTER_AREA)
    clean = np.vstack([g, c])
    both = np.vstack([mark(g.copy()), mark(c.copy())])
    cv2.putText(both, 'globe side from the solved camera (place.json), frame 90', (16, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.putText(both, 'close side, frame 90 (kept still)', (16, size[1] + 28), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.imwrite(sys.argv[3], np.hstack([clean, both]), [cv2.IMWRITE_JPEG_QUALITY, 90])
    if len(sys.argv) > 4:
        tx = cv2.imread(sys.argv[4])
        h, wd = tx.shape[:2]
        body = tx[..., 1] > 127
        diffs = []
        for ax in np.arange(0.03, 0.98, 0.02):
            col = body[:, int(ax * wd)]
            if col.any() and not col[0]:
                diffs.append(float(np.argmax(col)) - limb_row(ax, h))
        d = np.array(diffs)
        print(json.dumps({'columns': len(d), 'meanPx': round(float(d.mean()), 2), 'maxAbsPx': round(float(np.abs(d).max()), 2), 'heightPx': h}))


main()
