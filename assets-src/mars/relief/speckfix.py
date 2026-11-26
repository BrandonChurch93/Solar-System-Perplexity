# One speck in the paint of L1 (handover_engineer, 01:04 and 03:43 UTC 26 November; MAIL 1392 point 5 of /root).
# relief-L1-color.jpg holds, on dark ground of about 24, 20, 17, a magenta texel group (50, 17, 28) with a green one (25, 31, 19)
# beside it at full x 3250 to 3260, y 872 to 878. The relief draws a crest's far side out with the texel of the ramp's far end,
# so the speck becomes a dark red mark of about 12 by 8 px at 2664 to 2672. It is a fault of colour alone: the file is coded
# 4:2:0 and the two colour planes of the 16 by 16 blocks there hold it; the brightness plane holds the paint's grain.
# This tool writes the JPEG's own coefficients: in the colour blocks of BOX every sample farther than FAR from the ground's
# colour (the median of the blocks round the box) is set to that colour and the block is coded anew with the file's own tables.
# The speck is also brighter than its ground (28 against 21): in the brightness blocks of LIGHT every sample over the ground's
# brightness (the median of the blocks round it) by more than OVER is set to that bound, so the paint's grain stays.
# Every other block keeps its numbers, so the rest of the picture decodes to the same bytes.
# Run from the repository root: python3 assets-src/mars/relief/speckfix.py [--check] [--dir DIR]
import sys

import jpeglib
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
BOX = (3240, 864, 3272, 888)  # full size texels: left, top, right, bottom
FAR = 4.0  # levels of a colour plane
LIGHT = (3248, 864, 3264, 880)  # full size texels: the speck itself
OVER = 3.0  # levels of brightness over the ground's
RING = 2  # blocks round the box that give the ground's colour
PASSES = 6

C = np.array([[(np.sqrt(0.125) if u == 0 else 0.5) * np.cos((2 * x + 1) * u * np.pi / 16) for x in range(8)] for u in range(8)])


def samples(comp: np.ndarray, qt: np.ndarray, by: int, bx: int) -> np.ndarray:
    return C.T @ (comp[by, bx].astype(np.float64) * qt) @ C


def mend(path: str, k: float) -> int:
    im = jpeglib.read_dct(path)
    if im.Cb.shape[0] * 2 < im.Y.shape[0] or im.Cb.shape == im.Y.shape:
        raise SystemExit('the tool is written for a 4:2:0 file')
    x0, y0, x1, y1 = (int(np.floor(BOX[0] * k / 16)), int(np.floor(BOX[1] * k / 16)), int(np.ceil(BOX[2] * k / 16)), int(np.ceil(BOX[3] * k / 16)))
    n = 0
    for comp, table in ((im.Cb, im.quant_tbl_no[1]), (im.Cr, im.quant_tbl_no[2])):
        qt = im.qt[table].astype(np.float64)
        ring = [samples(comp, qt, by, bx) for by in range(y0 - RING, y1 + RING) for bx in range(x0 - RING, x1 + RING) if not (y0 <= by < y1 and x0 <= bx < x1)]
        ground = float(np.median(np.stack(ring)))
        for by in range(y0, y1):
            for bx in range(x0, x1):
                s = samples(comp, qt, by, bx)
                bad = np.abs(s - ground) > FAR
                if not bad.any():
                    continue
                n += int(bad.sum())
                s[bad] = ground
                comp[by, bx] = np.round((C @ s @ C.T) / qt).astype(np.int16)
    qt = im.qt[im.quant_tbl_no[0]].astype(np.float64)
    x0, y0, x1, y1 = (int(np.floor(LIGHT[0] * k / 8)), int(np.floor(LIGHT[1] * k / 8)), int(np.ceil(LIGHT[2] * k / 8)), int(np.ceil(LIGHT[3] * k / 8)))
    ring = [samples(im.Y, qt, by, bx) for by in range(y0 - RING, y1 + RING) for bx in range(x0 - RING, x1 + RING) if not (y0 <= by < y1 and x0 <= bx < x1)]
    bound = float(np.median(np.stack(ring))) + OVER
    for by in range(y0, y1):
        for bx in range(x0, x1):
            s = samples(im.Y, qt, by, bx)
            bad = s > bound + 0.5
            if not bad.any():
                continue
            n += int(bad.sum())
            s[bad] = bound
            im.Y[by, bx] = np.round((C @ s @ C.T) / qt).astype(np.int16)
    if n and '--check' not in sys.argv:
        im.write_dct(path)
    return n


def main() -> None:
    d = sys.argv[sys.argv.index('--dir') + 1] if '--dir' in sys.argv else 'public/assets/mars'
    for key, k in (('full', 1.0), ('web', 0.5)):
        path = f'{d}/{key}/relief-L1-color.jpg'
        first = np.asarray(Image.open(path).convert('RGB'))
        total = 0
        for _ in range(PASSES):
            n = mend(path, k)
            total += n
            if not n or '--check' in sys.argv:
                break
        last = np.asarray(Image.open(path).convert('RGB'))
        changed = (last != first).any(2)
        ys, xs = np.nonzero(changed)
        box = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())) if changed.any() else None
        print(key, 'samples set:', total, 'texels changed:', int(changed.sum()), 'in the box', box, 'largest change:', int(np.abs(last.astype(int) - first.astype(int)).max()))


main()
