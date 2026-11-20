import json
import sys

import cv2
import numpy as np
from PIL import Image

from geo import WORK
from globe_view import ortho

Image.MAX_IMAGE_PIXELS = None


def u8(x):
    return cv2.cvtColor((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR)


def main(color, height, hw, hh):
    C = np.asarray(Image.open(color).convert("RGB")).astype(np.float32) / 255
    H8, W8 = C.shape[:2]
    res = {}
    edge = np.abs(C[:, 0] - C[:, -1]).mean()
    inner = np.abs(C[:, W8 // 2] - C[:, W8 // 2 - 1]).mean()
    res["seam_color_edge_vs_inner"] = [float(edge), float(inner)]
    rolled = np.roll(C, W8 // 2, axis=1)
    cv2.imwrite(str(WORK / "chk-seam.jpg"), u8(rolled[:, W8 // 2 - 768:W8 // 2 + 768][::2, ::2]), [cv2.IMWRITE_JPEG_QUALITY, 88])
    h = np.fromfile(height, "<u2").reshape(int(hh), int(hw)).astype(np.float32) / 65535
    res["seam_height_edge_vs_inner"] = [float(np.abs(h[:, 0] - h[:, -1]).mean()), float(np.abs(h[:, hw // 2] - h[:, hw // 2 - 1]).mean())]
    c4 = cv2.resize(C, (4096, 2048), interpolation=cv2.INTER_AREA)
    hz = cv2.resize(h, (4096, 2048), interpolation=cv2.INTER_LINEAR)
    for name, lat in (("n", 90), ("s", -90)):
        cv2.imwrite(str(WORK / f"chk-pole-{name}.jpg"), u8(ortho(c4, 0, lat, 1400)), [cv2.IMWRITE_JPEG_QUALITY, 90])
    views = []
    for lo, la, sun in ((-75, -10, (1, 0.6, 0.3)), (-75, -10, (-1, -0.3, 0.4)), (100, 10, (0.8, 0.5, 0.4)), (-150, -30, (-0.6, 0.8, 0.3))):
        from faces import basis
        c, r, u = basis(lo, la)
        sd = sun[0] * r + sun[1] * u + sun[2] * c
        views.append(u8(ortho(c4, lo, la, 1024, H=hz, sun=sd, k=20.0)))
    cv2.imwrite(str(WORK / "chk-relit.jpg"), np.vstack([np.hstack(views[:2]), np.hstack(views[2:])]), [cv2.IMWRITE_JPEG_QUALITY, 88])
    json.dump(res, open(WORK / "chk.json", "w"), indent=1)
    print(res)


if __name__ == "__main__":
    a = sys.argv
    main(a[1], a[2], int(a[3]), int(a[4]))
