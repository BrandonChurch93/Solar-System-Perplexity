import json
import sys

import cv2
import numpy as np

WORK = 'out/work/jupiter/relief'
FG = 'out/work/jupiter/fg'
SPEC = json.load(open('assets-src/jupiter/relief/tiers.json'))
X0, Y0, X1, Y1 = SPEC['box']


def picture():
    canvas = np.load(f'{WORK}/canvas-final.npy', mmap_mode='r')
    return np.clip(np.asarray(canvas[Y0:Y1, X0:X1]), 0, 255).astype(np.uint8)[..., ::-1].copy()


def trace(img, anchors, free):
    path = []
    for a, b in zip(anchors[:-1], anchors[1:]):
        if a[0] >= free:
            n = int(max(abs(b[0] - a[0]), abs(b[1] - a[1])))
            path.append(np.stack([np.linspace(a[0], b[0], n, endpoint=False), np.linspace(a[1], b[1], n, endpoint=False)], 1) - [X0, Y0])
            continue
        pad = 60
        x0 = max(min(a[0], b[0]) - X0 - pad, 0)
        y0 = max(min(a[1], b[1]) - Y0 - pad, 0)
        x1 = min(max(a[0], b[0]) - X0 + pad, img.shape[1])
        y1 = min(max(a[1], b[1]) - Y0 + pad, img.shape[0])
        tool = cv2.segmentation_IntelligentScissorsMB()
        tool.setEdgeFeatureCannyParameters(24, 72)
        tool.setGradientMagnitudeMaxLimit(120)
        tool.applyImage(np.ascontiguousarray(img[y0:y1, x0:x1]))
        tool.buildMap((int(a[0] - X0 - x0), int(a[1] - Y0 - y0)))
        seg = tool.getContour((int(min(b[0] - X0, img.shape[1] - 1) - x0), int(min(b[1] - Y0, img.shape[0] - 1) - y0))).reshape(-1, 2)
        path.append(seg + [x0, y0])
    return np.concatenate(path)


def overlay(img, paths, name, x, y, w, h):
    view = np.clip(255 * (img[y - Y0:y - Y0 + h, x - X0:x - X0 + w] / 255.0) ** 0.7, 0, 255).astype(np.uint8)
    view = np.ascontiguousarray(view)
    for k, p in enumerate(paths):
        q = (p - [x - X0, y - Y0]).astype(np.int32)
        cv2.polylines(view, [q.reshape(-1, 1, 2)], False, [(0, 255, 0), (255, 128, 0)][k % 2], 1)
    for gx in range((x // 100 + 1) * 100, x + w, 100):
        cv2.putText(view, str(gx), (gx - x + 2, 11), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (0, 255, 255), 1)
        cv2.line(view, (gx - x, 0), (gx - x, 6), (0, 255, 255), 1)
    for gy in range((y // 100 + 1) * 100, y + h, 100):
        cv2.putText(view, str(gy), (2, gy - y - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (0, 255, 255), 1)
        cv2.line(view, (0, gy - y), (6, gy - y), (0, 255, 255), 1)
    cv2.imwrite(f'out/work/view/{name}.jpg', view, [cv2.IMWRITE_JPEG_QUALITY, 88])


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'trace':
        img = picture()
        paths = []
        for t in SPEC['tiers']:
            p = trace(img, t['anchors'], t.get('free', 1e9))
            np.save(f"{FG}/path-{t['name']}.npy", p + [X0, Y0])
            paths.append(p)
            print(t['name'], len(p), 'points')
        overlay(img, paths, 'tiers_a', 1100, 1650, 1400, 700)
        overlay(img, paths, 'tiers_b', 2400, 1650, 1400, 700)
        overlay(img, paths, 'tiers_c', 1100, 2300, 1400, 700)
        overlay(img, paths, 'tiers_d', 2400, 2300, 1400, 700)
