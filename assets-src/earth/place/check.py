import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
D = ROOT / 'out/work/earth/place/sides'


def horizon(img):
    g = cv2.GaussianBlur(img[..., 0].astype(np.float32), (0, 0), 1.5)
    h, w = g.shape
    rows = []
    for x in range(40, w - 40, 40):
        col = g[: h * 2 // 3, x]
        top = float(np.median(col[:20]))
        if top > 40:
            continue
        peak = float(col[: h // 2].max())
        level = top + 0.5 * (min(peak, 200) - top)
        k = int(np.argmax(col > level))
        if k < 25:
            continue
        rows.append((x, k + (level - col[k - 1]) / max(col[k] - col[k - 1], 1e-6) - 1))
    return np.array(rows)


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
