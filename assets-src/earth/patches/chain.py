import math
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None


def load(path, size=None):
    im = Image.open(path).convert("RGB")
    if size and im.size != (size, size):
        im = im.resize((size, size), Image.LANCZOS)
    return np.asarray(im, dtype=np.float32) / 255


def save(path, img, quality=94):
    im = Image.fromarray(np.clip(img * 255 + 0.5, 0, 255).astype(np.uint8))
    if str(path).lower().endswith((".jpg", ".jpeg")):
        im.save(path, quality=quality, subsampling=0)
    else:
        im.save(path)


def lock(take, ref, sigma):
    return np.clip(take + cv2.GaussianBlur(ref - take, (0, 0), sigma), 0, 1)


def sub(parent, parent_deg, child_deg, size):
    n = parent.shape[0]
    f = math.tan(math.radians(child_deg) / 2) / math.tan(math.radians(parent_deg) / 2)
    xs = ((np.arange(size) + 0.5) / size - 0.5) * f * n + n / 2 - 0.5
    mx, my = np.meshgrid(xs.astype(np.float32), xs.astype(np.float32))
    return np.clip(cv2.remap(parent, mx, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT_101), 0, 1)


def nest(parent, child, parent_deg, child_deg, feather=0.12):
    n = parent.shape[0]
    f = math.tan(math.radians(child_deg) / 2) / math.tan(math.radians(parent_deg) / 2)
    m = int(round(n * f / 2)) * 2
    small = cv2.resize(child, (m, m), interpolation=cv2.INTER_AREA)
    t = (np.arange(m) + 0.5) / m
    e = np.clip(np.minimum(t, 1 - t) / feather, 0, 1)
    e = e * e * (3 - 2 * e)
    w = np.minimum.outer(e, e)[..., None].astype(np.float32)
    o = (n - m) // 2
    out = parent.copy()
    out[o:o + m, o:o + m] = out[o:o + m, o:o + m] * (1 - w) + small * w
    return out


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "lock":
        take, ref, sigma, out = sys.argv[2:6]
        r = load(ref)
        t = load(take, r.shape[0])
        save(out, lock(t, r, float(sigma)))
    elif cmd == "sub":
        parent, pdeg, cdeg, size, out = sys.argv[2:7]
        save(out, sub(load(parent), float(pdeg), float(cdeg), int(size)), 96)
    elif cmd == "nest":
        parent, child, pdeg, cdeg, out = sys.argv[2:7]
        save(out, nest(load(parent), load(child), float(pdeg), float(cdeg)))
    print(cmd, "done")
