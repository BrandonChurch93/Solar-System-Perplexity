# The hue law of the painted ground under the layers (MAIL 1303 of /root, the yellow green speck at 2684 and 2686).
# L0 holds, under L1 and L2, ground that the picture's eye never saw (painted takes, RECIPE.md of this folder). The seen ground
# of the approved picture has no texel in which green comes nearer to red than GAP levels where it is brighter than FROM
# (measured on relief-L0-color.jpg, full: 0 of 1,585,400 texels at or over red, the 0.01th percentile of red minus green 11);
# the painted ground held one lit ledge with green over red (53 texels at x 4025 to 4047, y 1042 to 1056, up to 245, 255, 184).
# The relief's shader takes a texel back through the film curve, where 255 stands for about 5 and 248 for about 3, so that ledge
# is a yellow green light several times the ground: it showed through the layers in front wherever the law of the stop gives
# them less than their whole share. This tool holds the painted ground to the seen ground's law: under L1 and L2 (alpha 255),
# where a texel is brighter than FROM, green is at most red minus GAP.
# It writes the JPEG's own coefficients: only the 8 x 8 blocks that hold such a texel are coded anew (with the file's own
# tables), every other block keeps its numbers, so the rest of the picture decodes to the same bytes as before.
# Run from the repository root: python3 assets-src/mars/relief/huefix.py [--check]
import json
import sys

import jpeglib
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
FROM = 120
GAP = 11
AIM = 17  # what a mended texel is written to, under the law by the loss of the coding
PASSES = 12

C = np.array([[(np.sqrt(0.125) if u == 0 else 0.5) * np.cos((2 * x + 1) * u * np.pi / 16) for x in range(8)] for u in range(8)])


def hidden(key: str, k: float, shape: tuple[int, int], layers: dict) -> np.ndarray:
    h, w = shape
    box0 = layers['L0']['box']
    out = np.zeros((h, w), bool)
    for name in ('L1', 'L2'):
        al = np.asarray(Image.open(f'public/assets/mars/{key}/relief-{name}-alpha.png').convert('L'))
        b = layers[name]['box']
        x0, y0 = round((b['x'] - box0['x']) * k), round((b['y'] - box0['y']) * k)
        hh, ww = min(al.shape[0], h - y0), min(al.shape[1], w - x0)
        out[y0:y0 + hh, x0:x0 + ww] |= al[:hh, :ww] == 255
    return out


def faults(rgb: np.ndarray, hid: np.ndarray, gap: int) -> np.ndarray:
    r, g = rgb[..., 0].astype(np.int16), rgb[..., 1].astype(np.int16)
    return hid & (np.maximum(r, g) >= FROM) & (r - g < gap)


def main() -> None:
    check = '--check' in sys.argv
    layers = json.load(open('src/stops/mars/relief.json'))['layers']
    for key, k in (('full', 1.0), ('web', 0.5)):
        path = f'public/assets/mars/{key}/relief-L0-color.jpg'
        first = np.asarray(Image.open(path).convert('RGB'))
        hid = hidden(key, k, first.shape[:2], layers)
        print(key, 'texels under the layers that break the law:', int(faults(first, hid, GAP).sum()))
        if check:
            continue
        # a block coded anew can ring over the law in a texel beside the one mended: the pass is repeated until none is left
        for _ in range(PASSES):
            if not mend(path, hid):
                break
        last = np.asarray(Image.open(path).convert('RGB'))
        changed = (last != first).any(2)
        ys, xs = np.nonzero(changed)
        print(key, 'texels changed:', int(changed.sum()), 'in blocks of 8 by 8:', len(set(zip((ys // 8).tolist(), (xs // 8).tolist()))), 'largest change:', int(np.abs(last.astype(int) - first.astype(int)).max()), 'still breaking the law:', int(faults(last, hid, GAP).sum()))


def mend(path: str, hid: np.ndarray) -> bool:
    before = np.asarray(Image.open(path).convert('RGB'))
    bad = faults(before, hid, GAP)
    if not bad.any():
        return False
    # in a block that holds a fault every texel of the painted ground nearer than AIM is set to AIM, so the coding has room
    wide = faults(before, hid, AIM)
    im = jpeglib.read_dct(path)
    ys, xs = np.nonzero(bad)
    blocks = sorted(set(zip((ys // 8).tolist(), (xs // 8).tolist())))
    for by, bx in blocks:
        px = before[by * 8:by * 8 + 8, bx * 8:bx * 8 + 8].astype(np.float64)
        m = wide[by * 8:by * 8 + 8, bx * 8:bx * 8 + 8]
        px[..., 1] = np.where(m, np.minimum(px[..., 1], px[..., 0] - AIM), px[..., 1])
        r, g, b = px[..., 0], px[..., 1], px[..., 2]
        planes = (0.299 * r + 0.587 * g + 0.114 * b - 128, -0.168735892 * r - 0.331264108 * g + 0.5 * b, 0.5 * r - 0.418687589 * g - 0.081312411 * b)
        for plane, comp, table in zip(planes, (im.Y, im.Cb, im.Cr), im.quant_tbl_no):
            comp[by, bx] = np.round((C @ plane @ C.T) / im.qt[table]).astype(np.int16)
    im.write_dct(path)
    return True


main()
