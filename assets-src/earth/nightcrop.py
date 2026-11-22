import json
import sys

import cv2
import numpy as np

import limbstrip as L

BOX, ZOOM, AT = (168, 132), 3, (95.0, 125.0, 150.0)


def limb_xy(pose, pa, size):
    hh, ww = size
    world = np.asarray(pose['basis'], dtype=np.float64).reshape(4, 4).T[:3, :3]
    eye = L.UNSHAPE @ np.asarray(pose['eye'], dtype=np.float64)
    m = L.UNSHAPE @ world
    k = (hh / 2) / np.tan(np.radians(pose['vfov']) / 2)
    dist = np.linalg.norm(eye)
    axis = -eye / dist
    up = m[:, 1]
    e2 = up - axis * up.dot(axis)
    e2 /= np.linalg.norm(e2)
    e1 = np.cross(axis, e2)
    e1 = e1 if e1.dot(m[:, 0]) > 0 else -e1
    th = np.arcsin(1 / dist)
    a = np.radians(pa)
    d = np.cos(th) * axis + np.sin(th) * (np.sin(a) * e1 + np.cos(a) * e2)
    c = (L.SHAPE @ d) @ world
    return ww / 2 + c[0] / -c[2] * k, hh / 2 - c[1] / -c[2] * k


def crop(img, x, y, scale):
    w, h = int(BOX[0] * scale), int(BOX[1] * scale)
    x0 = int(np.clip(round(x - w / 2), 0, img.shape[1] - w))
    y0 = int(np.clip(round(y - h / 2), 0, img.shape[0] - h))
    c = img[y0:y0 + h, x0:x0 + w]
    return cv2.resize(c, (BOX[0] * ZOOM, BOX[1] * ZOOM), interpolation=cv2.INTER_NEAREST if scale == 1 else cv2.INTER_AREA if scale > ZOOM else cv2.INTER_CUBIC)


def main():
    out = sys.argv[1]
    gain = float(sys.argv[2])
    poses = {p['frame']: p for p in json.load(open('out/work/earth/p6/poses.json'))}
    rows = []
    for spec in sys.argv[3:]:
        frame, path = spec.split(':')
        frame = int(frame)
        img = cv2.imread(path, cv2.IMREAD_COLOR)
        scale = img.shape[0] / 1080
        for pa in AT:
            x, y = limb_xy(poses[frame], pa, img.shape[:2])
            c = crop(img, x, y, scale)
            g = np.clip(c.astype(np.float32) * gain, 0, 255).astype(np.uint8)
            cv2.putText(c, f'{path.split("/")[-1][:22]} f{frame} pa {pa:.0f}', (4, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)
            rows.append(np.concatenate([c, np.full((c.shape[0], 6, 3), 70, np.uint8), g], axis=1))
    cols = len(AT)
    lines = [np.concatenate([np.concatenate([r, np.full((r.shape[0], 10, 3), 70, np.uint8)], axis=1) for r in rows[i:i + cols]], axis=1) for i in range(0, len(rows), cols)]
    sheet = np.concatenate([np.concatenate([l, np.full((10, l.shape[1], 3), 70, np.uint8)]) for l in lines])
    cv2.imwrite(out, sheet)
    print(out, sheet.shape, 'per cell: native at', ZOOM, 'times, then times gain', gain)


if __name__ == '__main__':
    main()
