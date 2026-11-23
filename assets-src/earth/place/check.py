import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
D = ROOT / 'out/work/earth/place/sides'


def horizon(img):
    g = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 2.0)
    h, w = g.shape
    rows = []
    for x in range(40, w - 40, 40):
        col = g[: h * 2 // 3, x - 4 : x + 5].mean(axis=1)
        d = col[2:] - col[:-2]
        hit = np.nonzero((d[20:-20] > 12) & (d[20:-20] >= d[19:-21]) & (d[20:-20] >= d[21:-19]))[0]
        if len(hit) == 0:
            continue
        k = int(hit[0]) + 20
        k = k + int(np.argmax(d[k : k + 40]))
        den = d[k - 1] - 2 * d[k] + d[k + 1]
        rows.append((x, k + 1 + (0.5 * (d[k - 1] - d[k + 1]) / den if den < 0 else 0)))
    rows = np.array(rows)
    for _ in range(4):
        fit = np.polyfit(rows[:, 0] - 960, rows[:, 1], 2)
        res = np.abs(rows[:, 1] - np.polyval(fit, rows[:, 0] - 960))
        keep = res < max(3.0, 3 * float(np.median(res)))
        if keep.all():
            break
        rows = rows[keep]
    return rows


def rim(img, at):
    h, w = img.shape[:2]
    out = []
    for x in (w // 4, w // 2, 3 * w // 4):
        y = int(round(np.interp(x, at[:, 0], at[:, 1])))
        out.append([img[min(max(y + k, 0), h - 1), x - 6 : x + 7].reshape(-1, 3).mean(axis=0)[::-1].round().astype(int).tolist() for k in (-60, -30, -12, -4, 4, 12, 30, 60, 120, 240)])
    return out


for f in sys.argv[1:]:
    a = cv2.imread(str(D / (f + '-terrain.png')))
    b = cv2.imread(str(D / (f + '-orbit.png')))
    ha, hb = horizon(a), horizon(b)
    both = np.intersect1d(ha[:, 0], hb[:, 0])
    ha = ha[np.isin(ha[:, 0], both)]
    hb = hb[np.isin(hb[:, 0], both)]
    d = hb[:, 1] - ha[:, 1]
    fa = np.polyfit(ha[:, 0] - 960, ha[:, 1], 2)
    fb = np.polyfit(hb[:, 0] - 960, hb[:, 1], 2)
    print(f, 'horizon row, close side minus globe side over', len(d), 'columns: mean', round(float(-d.mean()), 2), 'px, largest', round(float(np.abs(d).max()), 1), 'px')
    print('  close side: row at centre', round(float(fa[2]), 1), 'tilt deg', round(float(np.degrees(np.arctan(fa[1]))), 2), 'curve', fa[0])
    print('  globe side: row at centre', round(float(fb[2]), 1), 'tilt deg', round(float(np.degrees(np.arctan(fb[1]))), 2), 'curve', fb[0])
    for name, img, at in (('close', a, ha), ('globe', b, hb)):
        for x, col in zip(('quarter', 'centre', 'three quarters'), rim(img, at)):
            print('  ' + name + ' side colour at rows -60 -30 -12 -4 4 12 30 60 120 240 from the horizon, ' + x + ':', ' '.join(','.join(str(v) for v in c) for c in col))
    h, w = a.shape[:2]
    mix = a.copy()
    mix[:, w // 2 :] = b[:, w // 2 :]
    cv2.line(mix, (w // 2, 0), (w // 2, h), (255, 255, 255), 1)
    row = np.vstack([np.hstack([a, b]), np.hstack([mix, cv2.addWeighted(a, 0.5, b, 0.5, 0)])])
    for x, y in ha:
        cv2.circle(row, (int(x) + w, int(y)), 3, (0, 0, 255), -1)
    cv2.putText(row, 'close side ' + f, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    cv2.putText(row, 'globe side from the twin, red dots: horizon of the close side', (w + 20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    cv2.putText(row, 'left half close, right half globe', (20, h + 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    cv2.putText(row, 'both sides, half and half', (w + 20, h + 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    cv2.imwrite(str(D / (f + '-check.jpg')), cv2.resize(row, (w, h), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
