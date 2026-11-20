import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

Image.MAX_IMAGE_PIXELS = None
CX, CY, HW, HH = 2430, 969, 450, 305
EDGE = 90
SIGMA = 36


def main(wrap, take, out_full, out_web):
    full = Image.open(wrap).convert('RGB')
    box = (CX - HW, CY - HH, CX + HW, CY + HH)
    old = np.asarray(full.crop(box)).astype(np.float32) / 255
    new = np.asarray(Image.open(take).convert('RGB').resize((2 * HW, 2 * HH), Image.LANCZOS)).astype(np.float32) / 255
    blur = lambda a: np.stack([ndi.gaussian_filter(a[..., i], SIGMA) for i in range(3)], -1)
    ratio = np.clip((blur(old) + 0.02) / (blur(new) + 0.02), 0.6, 1.6)
    new = np.clip(new * ratio, 0, 1)
    yy, xx = np.mgrid[0:2 * HH, 0:2 * HW]
    d = np.minimum(np.minimum(xx, 2 * HW - 1 - xx), np.minimum(yy, 2 * HH - 1 - yy)) / EDGE
    t = np.clip(d, 0, 1)
    m = (t * t * (3 - 2 * t))[..., None]
    mix = old * (1 - m) + new * m
    full.paste(Image.fromarray((mix * 255 + 0.5).astype(np.uint8)), box[:2])
    full.save(out_full, quality=93, subsampling=0)
    full.resize((full.size[0] // 2, full.size[1] // 2), Image.LANCZOS).save(out_web, quality=93, subsampling=0)


if __name__ == '__main__':
    main(*sys.argv[1:5])
