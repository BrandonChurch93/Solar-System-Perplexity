import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geom as g
from layback import WORK, layback

if __name__ == '__main__':
    width = int(sys.argv[1])
    size = int(sys.argv[2])
    src = cv2.imread(str(g.ROOT / 'out/work/earth/relief/canvas-full-1x.png'))
    s = g.G.T @ g.SPOT
    lay, sharp, inside = layback(src, 1, width, size, c=s)
    patch = cv2.resize(cv2.imread(str(g.ROOT / ('public/assets/earth/full/patch-%d.jpg' % width))), (size, size), interpolation=cv2.INTER_AREA)
    a = cv2.GaussianBlur((inside > 0.99).astype(np.float32), (0, 0), size / 400)
    a = np.clip((a - 0.5) * 2, 0, 1)[..., None]
    both = (patch * (1 - a) + lay * a).astype(np.uint8)
    marked = both.copy()
    c = np.array(g.plate_xy(s, width, g.unit(g.local_to_body(np.zeros(3) + g.CENTRE + g.R * g.UP * 0) if False else g.direction(g.GLOBE['lon'], g.GLOBE['lat'])))) * size
    cv2.circle(marked, (int(c[0]), int(c[1])), max(size // 200, 3), (0, 0, 255), -1)
    cv2.circle(marked, (size // 2, size // 2), max(size // 200, 3), (0, 255, 255), -1)
    cv2.imwrite(str(WORK / ('onglobe%d.jpg' % width)), np.hstack([patch, marked]), [cv2.IMWRITE_JPEG_QUALITY, 90])
    cv2.imwrite(str(WORK / ('onglobe%d-lay.png' % width)), lay)
    np.save(WORK / ('onglobe%d-inside.npy' % width), inside.astype(np.float32))
    print(width, 'covered', float((inside > 0.5).mean()))
