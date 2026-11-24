"""Recipe of src/space/farsun/face.ts.

The far Sun draws its surface from functions (cells that are born and die, the limb law, its own shoulder).
The places of the hero's spots and bright regions are the one thing a function cannot know, so this recipe
reads them off the approved hero's wrap of the Sun (public/assets/sun/full/wrap-color.jpg) and writes them
as one small table of heat: 1024 by 512 values, one byte each, rows from the south pole to the north pole,
columns as the wrap's (u = atan2(x, z) / 2 pi + 0.5). The value is (level / MEAN) ** POWER / SCALE, where
level is the wrap's linear level (0.3 r + 0.5 g + 0.2 b). The table rides in the code, so the far Sun is the
same at every stop whether the Sun's own set is loaded or not, and no frame waits for a file.

Run from the repository root: python3 assets-src/farsun/make_face.py
"""
import base64
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
SOURCE = 'public/assets/sun/full/wrap-color.jpg'
OUT = 'src/space/farsun/face.ts'
W, H = 1024, 512
MEAN = 0.18
POWER = 0.45
SCALE = 2.4

im = Image.open(SOURCE).convert('RGB')
a = np.asarray(im).astype(np.float32) / 255
lin = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
lum = lin @ np.array([0.3, 0.5, 0.2], dtype=np.float32)
fy, fx = lum.shape[0] // H, lum.shape[1] // W
lum = lum[: H * fy, : W * fx].reshape(H, fy, W, fx).mean((1, 3))
heat = np.clip(lum / MEAN, 0.02, 6.0) ** POWER
table = np.clip(np.round(heat / SCALE * 255), 0, 255).astype(np.uint8)[::-1]
text = base64.b64encode(table.tobytes()).decode('ascii')
with open(OUT, 'w') as f:
    f.write("export const FACE = { width: %d, height: %d, scale: %s, mean: %s, power: %s, data: '%s' }\n" % (W, H, SCALE, MEAN, POWER, text))
print('face', W, H, 'mean heat', float(heat.mean()), 'bytes', len(text))
