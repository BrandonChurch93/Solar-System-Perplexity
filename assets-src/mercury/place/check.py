import math
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lay

W, H = 1920, 1080


def horizon(width, height):
    f = height / 2 / math.tan(math.radians(lay.VFOV) / 2)
    n = lay.P / np.linalg.norm(lay.P)
    up = lay.M.T @ n
    sin_dip = -math.sqrt(1 - 1 / float(lay.P @ lay.P))
    ys = np.linspace(-0.5, height - 0.5, height * 8 + 1)
    out = []
    for x in range(width):
        d = np.stack([np.full_like(ys, x + 0.5 - width / 2), -(ys + 0.5 - height / 2), np.full_like(ys, -f)], -1)
        d /= np.linalg.norm(d, axis=-1, keepdims=True)
        s = d @ up - sin_dip
        k = np.where(np.diff(np.sign(s)) != 0)[0]
        out.append(float(ys[k[0]] - s[k[0]] * (ys[k[0] + 1] - ys[k[0]]) / (s[k[0] + 1] - s[k[0]])) if len(k) else float('nan'))
    return np.array(out)


def edge(img, line, reach, sun):
    g = cv2.GaussianBlur(np.asarray(img.convert('L')).astype(np.float32), (0, 0), 2.0)
    rise = np.gradient(g, axis=0)
    out = []
    for x in range(40, W - 40, 40):
        y0 = line[x]
        if not np.isfinite(y0) or sun[0] < x / W < sun[1]:
            continue
        a, b = max(int(y0) - reach, 0), min(int(y0) + reach, H - 2)
        col = rise[a:b, x - 4:x + 5].mean(1) if sun[1] < 1 else np.diff((g[a:b + 1, x - 4:x + 5].mean(1) > 4).astype(np.float32))
        out.append((x, a + int(np.argmax(col)) - y0))
    return np.array(out)


def marked(img, line):
    im = img.copy()
    d = ImageDraw.Draw(im)
    for x in range(0, W, 2):
        if np.isfinite(line[x]) and (x // 24) % 2 == 0:
            d.point((x, round(line[x])), fill=(255, 60, 60))
    return im


globe = Image.open(sys.argv[1]).convert('RGB').resize((W, H), Image.LANCZOS)
close = Image.open(sys.argv[2]).convert('RGB').resize((W, H), Image.LANCZOS)
line = horizon(W, H)
for name, img, sun in (('globe side', globe, (2.0, 2.0)), ('close side', close, (0.12, 0.42))):
    e = edge(img, line, 30, sun)
    print(name, 'limb against the solved horizon, px at 1920 wide: columns', len(e), 'mean', round(float(e[:, 1].mean()), 2), 'largest', round(float(np.abs(e[:, 1]).max()), 2))
sheet = Image.new('RGB', (W * 2 + 12, H * 2 + 12), (20, 20, 20))
sheet.paste(marked(globe, line), (0, 0))
sheet.paste(marked(close, line), (W + 12, 0))
a, b = np.asarray(globe).astype(np.float32), np.asarray(close).astype(np.float32)
bright = np.clip(a * 2.2, 0, 255)
sheet.paste(Image.fromarray(((bright + b) / 2).astype(np.uint8)), (0, H + 12))
yy, xx = np.mgrid[0:H, 0:W]
mask = (((xx // 160) + (yy // 160)) % 2 == 0)[..., None]
sheet.paste(Image.fromarray(np.where(mask, bright, b).astype(np.uint8)), (W + 12, H + 12))
d = ImageDraw.Draw(sheet)
for (x, y, t) in ((8, 8, 'globe side from the twin, frame 870, no close picture laid on'), (W + 20, 8, 'close side, frame 870'), (8, H + 20, 'half and half (globe side gained 2.2)'), (W + 20, H + 20, 'squares, alternating (globe side gained 2.2)')):
    d.text((x, y), t, fill=(255, 220, 120))
sheet.resize((W, H), Image.LANCZOS).save(sys.argv[3], quality=92)
