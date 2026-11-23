import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geom as g
from layback import WORK, layback

FULL = g.ROOT / 'public/assets/earth/full'


def canvas():
    ground = np.asarray(Image.open(FULL / g.RELIEF['ground']['file']).convert('RGB')).astype(np.float32)
    s = ground.shape[1] / g.BOX[2]
    t = g.RELIEF['towers']
    box = t['box']
    w, h = int(round(box[2] * s)), int(round(box[3] * s))
    rgba = np.asarray(Image.open(FULL / t['file']).convert('RGBA').resize((w, h), Image.LANCZOS)).astype(np.float32)
    x0, y0 = int(round((box[0] - g.BOX[0]) * s)), int(round((box[1] - g.BOX[1]) * s))
    ya, yb = max(y0, 0), min(y0 + h, ground.shape[0])
    xa, xb = max(x0, 0), min(x0 + w, ground.shape[1])
    part = rgba[ya - y0:yb - y0, xa - x0:xb - x0]
    a = part[..., 3:4] / 255
    ground[ya:yb, xa:xb] = ground[ya:yb, xa:xb] * (1 - a) + part[..., :3] * a
    return cv2.cvtColor(np.clip(ground, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR), s


if __name__ == '__main__':
    plate_deg = float(sys.argv[1])
    size = int(sys.argv[2])
    name = sys.argv[3]
    src, s = canvas()
    lay, sharp, inside = layback(src, s, plate_deg, size, over=1)
    cv2.imwrite(str(WORK / (name + '-lay.png')), lay)
    np.save(WORK / (name + '-sharp.npy'), sharp.astype(np.float32))
    np.save(WORK / (name + '-inside.npy'), inside.astype(np.float32))
    print(name, 'canvas scale', s, 'covered', float((inside > 0.5).mean()), 'at least 1 image px per plate px', float((sharp >= 1).mean()), 'at least 0.5', float((sharp >= 0.5).mean()))
