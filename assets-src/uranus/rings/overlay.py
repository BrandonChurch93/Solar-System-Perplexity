import json
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/uranus')
import geo

rings = json.load(open('out/work/u/rings/rings-fit.json'))
im = np.asarray(Image.open('references/approved/uranus-hero.png').convert('RGB')).astype(np.float32) / 255
b = (np.clip(im * 3.2, 0, 1) ** 0.8 * 255).astype(np.uint8)
over = b.copy()
rng = np.random.RandomState(4)
for i, r in enumerate(rings):
    n = np.array(r['normal'])
    e1 = np.cross([0, 0, 1.0], n)
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(n, e1)
    th = np.linspace(0, 2 * np.pi, 1441)
    p = r['radius'] * (np.cos(th)[:, None] * e1 + np.sin(th)[:, None] * e2)
    x, y = geo.project(p)
    front = np.einsum('ij,ij->i', p - geo.CAM, p - geo.CAM) < (geo.CAM @ geo.CAM - 1) + 0 * th
    hidden = ~front & (np.linalg.norm(np.cross(p - geo.CAM, -geo.CAM), axis=1) / np.linalg.norm(p - geo.CAM, axis=1) < 1)
    col = tuple(int(v) for v in rng.randint(100, 255, 3))
    pts = np.stack([x, y], 1)
    for k in range(len(th) - 1):
        if hidden[k] or k % 12 > 5:
            continue
        cv2.line(over, tuple(np.round(pts[k]).astype(int)), tuple(np.round(pts[k + 1]).astype(int)), col, 1, cv2.LINE_AA)
    k = (i * 97) % 1440
    cv2.putText(over, str(i), tuple(np.round(pts[k]).astype(int)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, col, 2)
out = np.concatenate([b[60:1560, 500:2500], over[60:1560, 500:2500]], 1)
Image.fromarray(out).resize((2000, 750), Image.LANCZOS).save('out/work/u/rings/overlay.jpg', quality=90)
Image.fromarray(over[60:1560, 500:2500]).save('out/work/u/rings/overlay-full.jpg', quality=90)
