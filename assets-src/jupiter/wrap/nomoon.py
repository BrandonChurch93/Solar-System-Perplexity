import cv2
import numpy as np

from common import WORK, blur, load, moon_mask, save

hero = load(f'{WORK}/hero2x.png')
h, w, _ = hero.shape
x0, y0, x1, y1 = 2364, 1500, 4156, 2508
src = hero[y0:y1, x0:x1].astype(np.float32)
fill = load(f'{WORK}/gen/ioremove_nbp_al.png').astype(np.float32)
m = moon_mask(w, h, 10)[y0:y1, x0:x1].astype(np.float32) / 255
keep = 1 - np.clip(blur(cv2.dilate(m, np.ones((41, 41), np.uint8)), 6), 0, 1)
s = 30
ratio = blur(src * keep[..., None], s) / np.maximum(blur(fill * keep[..., None], s), 1e-3)
ratio = np.clip(ratio, 0.8, 1.25)
far = blur(keep, s) < 0.05
ratio[far] = 1
ratio = blur(ratio, 20)
soft = np.clip(blur(cv2.dilate(m, np.ones((25, 25), np.uint8)), 7), 0, 1)[..., None]
out = hero.copy()
out[y0:y1, x0:x1] = np.round(np.clip(src * (1 - soft) + fill * ratio * soft, 0, 255)).astype(np.uint8)
save(f'{WORK}/hero2x-nomoon.png', out)
save('out/work/view/nomoon.jpg', cv2.resize(out[1300:2700, 2100:4500], (1400, 817), interpolation=cv2.INTER_AREA), 90)
