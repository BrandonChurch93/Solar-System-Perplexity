import cv2
import numpy as np

from common import WORK, save, smooth

W, H = 8192, 4096
OUT = 'public/assets/jupiter'
WARM_FROM, WARM_TO, WARM = 58.0, 72.0, 0.8
REF = (56.0, 62.0)
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)


def warm_cap(canvas):
    lat = 90 - (np.arange(H) + 0.5) / H * 180
    rows = canvas.mean(1)
    ref = rows[(lat > REF[0]) & (lat < REF[1])].mean(0)
    ref = ref / (ref @ LUMA)
    for y in np.nonzero(lat > WARM_FROM)[0]:
        chroma = rows[y] / (rows[y] @ LUMA)
        gain = 1 + (ref / chroma - 1) * WARM * smooth(WARM_FROM, WARM_TO, lat[y])
        gain = gain / ((rows[y] * gain) @ LUMA) * (rows[y] @ LUMA)
        canvas[y] *= gain
    return canvas


canvas = warm_cap(np.load(f'{WORK}/far-canvas.npy'))
full = np.round(np.clip(canvas, 0, 255)).astype(np.uint8)
save(f'{OUT}/full/wrap-color.jpg', full, 94)
web = cv2.resize(full, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
save(f'{OUT}/web/wrap-color.jpg', web, 90)
cv2.imwrite('out/work/view/wrap.jpg', cv2.resize(full[..., ::-1], (2048, 1024), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
lat = 90 - (np.arange(H) + 0.5) / H * 180
for a in (84, 76, 68, 60):
    print(a, canvas[(lat > a - 2) & (lat < a + 2)].reshape(-1, 3).mean(0).round(0))
