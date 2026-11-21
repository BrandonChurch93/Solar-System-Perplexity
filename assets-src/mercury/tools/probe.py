import json
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/mercury/wrap')
import geo

film = sys.argv[1]
W, H = 2816, 1584
c = geo.FIT['circle']
hero = geo.scene('references/approved/mercury-hero.png')
f = np.asarray(Image.open(film).convert('RGB')).astype(np.float32) / 255
if len(sys.argv) > 2:
    g0 = np.asarray(Image.open('references/approved/mercury-hero.png').convert('L').resize((f.shape[1], f.shape[0]), Image.LANCZOS)).astype(np.float32) / 255
    k = f.shape[1] / W
    x0, y0, x1, y1 = [int(v * k) for v in (c['cx'] - c['r'] * 0.2, c['cy'] - c['r'] * 0.75, c['cx'] + c['r'] * 0.75, c['cy'] + c['r'] * 0.6)]
    (sx, sy), _ = cv2.phaseCorrelate(g0[y0:y1, x0:x1], cv2.cvtColor(f, cv2.COLOR_RGB2GRAY)[y0:y1, x0:x1], cv2.createHanningWindow((x1 - x0, y1 - y0), cv2.CV_32F))
    print('disc offset of the film in film px', round(sx, 2), round(sy, 2), '(removed before measuring)')
    f = cv2.warpAffine(f, np.float32([[1, 0, -sx], [0, 1, -sy]]), (f.shape[1], f.shape[0]), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
f = geo.unfilm(geo.to_linear(np.clip(cv2.resize(f, (W, H), interpolation=cv2.INTER_CUBIC), 0, 1)))
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
dx, dy = xx + 0.5 - c['cx'], yy + 0.5 - c['cy']
d = np.hypot(dx, dy) / c['r']
pa = np.degrees(np.arctan2(dx, -dy))
sun = np.array(geo.FIT['sunDir'])
z = np.sqrt(np.maximum(1 - d * d, 0))
ndl = (dx / c['r']) * sun[0] + (-dy / c['r']) * sun[1] + z * sun[2]
med = lambda a, m: np.median(a[m], axis=0)
print('night side by radius (hero, film, ratio of luminance)')
for lo, hi in ((0, 0.3), (0.3, 0.6), (0.6, 0.8), (0.8, 0.9), (0.9, 0.96), (0.96, 0.99)):
    m = (d >= lo) & (d < hi) & (ndl < -0.2)
    a, b = med(hero, m), med(f, m)
    print(f'  r {lo:.2f}-{hi:.2f}  hero {a.round(4)}  film {b.round(4)}  ratio {(b @ geo.LUMA) / (a @ geo.LUMA):.2f}')
print('day side by ndl')
for lo, hi in ((0.0, 0.1), (0.1, 0.25), (0.25, 0.5), (0.5, 0.75), (0.75, 1.0)):
    m = (d < 0.9) & (ndl >= lo) & (ndl < hi)
    a, b = med(hero, m), med(f, m)
    print(f'  ndl {lo:.2f}-{hi:.2f}  hero {a.round(3)}  film {b.round(3)}  ratio {(b @ geo.LUMA) / (a @ geo.LUMA):.2f}')
print('outside the limb by position angle (hero, film) at 1.006-1.012, 1.02-1.03, 1.05-1.07, 1.1-1.14 radii')
for p0 in (-150, -110, -70, -30, 0, 20, 40, 60, 80, 100, 120, 150):
    row = []
    for lo, hi in ((1.006, 1.012), (1.02, 1.03), (1.05, 1.07), (1.1, 1.14)):
        m = (d >= lo) & (d < hi) & (np.abs(pa - p0) < 6)
        row.append(f'{med(hero, m) @ geo.LUMA:.3f}/{med(f, m) @ geo.LUMA:.3f}')
    print(f'  pa {p0:5d}  ' + '  '.join(row))
print('inside the limb by position angle (hero/film) at 0.90-0.95, 0.96-0.985, 0.988-0.996')
for p0 in (-30, 0, 20, 40, 60, 80, 100, 120, 150):
    row = []
    for lo, hi in ((0.90, 0.95), (0.96, 0.985), (0.988, 0.996)):
        m = (d >= lo) & (d < hi) & (np.abs(pa - p0) < 6)
        row.append(f'{med(hero, m) @ geo.LUMA:.3f}/{med(f, m) @ geo.LUMA:.3f}')
    print(f'  pa {p0:5d}  ' + '  '.join(row))
