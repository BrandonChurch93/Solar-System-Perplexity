import json
import os

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
OUT = 'out/work/u/wrap/'
DST = 'public/assets/uranus/'


def main():
    color = Image.open(OUT + 'wrap-color.png')
    cloud = Image.open(OUT + 'wrap-cloud.png')
    lut = np.load(OUT + 'light-lut.npy')
    rgba = np.concatenate([lut, np.ones(lut.shape[:2] + (1,), np.float32)], -1).transpose(1, 0, 2)
    shade = np.load(OUT + 'shade.npy')[::-1]
    shade = np.concatenate([shade, np.ones(shade.shape[:2] + (1,), np.float32)], -1)
    for name, width in (('full', 8192), ('web', 4096)):
        os.makedirs(DST + name, exist_ok=True)
        c = color if width == color.width else color.resize((width, width // 2), Image.LANCZOS)
        c.save(DST + name + '/wrap-color.jpg', quality=95, subsampling=0)
        k = cloud if width == cloud.width else cloud.resize((width, width // 2), Image.LANCZOS)
        k.save(DST + name + '/wrap-cloud.png', optimize=True)
        np.ascontiguousarray(rgba.astype('<f4')).tofile(DST + name + '/light.bin')
        np.ascontiguousarray(shade.astype('<f4')).tofile(DST + name + '/shade.bin')
        for f in ('wrap-color.jpg', 'wrap-cloud.png', 'light.bin'):
            print(name, f, round(os.path.getsize(DST + name + '/' + f) / 1e6, 2), 'MB')
    json.dump({'light': [int(lut.shape[0]), int(lut.shape[1])], 'shade': [int(shade.shape[1]), int(shade.shape[0])]}, open(OUT + 'sizes.json', 'w'))


main()
