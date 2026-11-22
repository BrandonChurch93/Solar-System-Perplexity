import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets-src/neptune')
sys.path.insert(0, 'assets-src/neptune/check')
import geo
from undrift import undo


def main():
    view, ref_path, q = sys.argv[1], sys.argv[2], [float(v) for v in sys.argv[3].split(',')]
    ref = Image.open(ref_path).convert('RGB')
    for f in sys.argv[4:]:
        a8 = np.asarray(Image.open(f).convert('RGB'))
        h, w = a8.shape[:2]
        r = np.asarray(ref.resize((w, h), Image.LANCZOS)).astype(float)
        a = a8.astype(float)
        b = undo(a8, q).astype(float)
        raw = np.abs(a - r).mean()
        m = 8
        reg = np.abs(b - r)[m:-m, m:-m].mean()
        out = '%s  mean abs diff raw %.4f  drift undone %.4f' % (f, raw, reg)
        if view == 'hold':
            d = geo.hero_rays(w, h)
            bb = -(d @ geo.CAM)
            hit = (bb * bb - (geo.CAM @ geo.CAM - 1)) > 0
            wide = cv2.dilate(hit.astype(np.uint8), np.ones((25, 25), np.uint8)) > 0
            out += '  planet only: raw %.4f  drift undone %.4f  sky only raw %.4f' % (np.abs(a - r)[hit].mean(), np.abs(b - r)[hit].mean(), np.abs(a - r)[~wide].mean())
        print(out)


main()
