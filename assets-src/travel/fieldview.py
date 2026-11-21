import json, sys
import numpy as np
from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else '/tmp/field'
out = sys.argv[2] if len(sys.argv) > 2 else '/tmp/fieldview.png'
meta = json.load(open(src + '.json'))
pos = np.fromfile(src + '.pos', dtype=np.float32).reshape(-1, 3)
star = np.fromfile(src + '.star', dtype=np.float32).reshape(-1, 4)
col = np.fromfile(src + '.col', dtype=np.float32).reshape(-1, 3)
glow = np.fromfile(src + '.glow', dtype=np.float32).reshape(meta['height'], meta['width'])
W, H, FOV = 960, 540, 30.0
k = H / 2 / np.tan(np.radians(FOV) / 2)
views = [(0, 0), (70, 20), (140, -30), (200, 50), (260, -10), (320, 35)]
sheet = Image.new('RGB', (W * 3, H * 2))
print('map min %.2f median %.2f p90 %.2f max %.2f' % (glow.min(), np.median(glow), np.percentile(glow, 90), glow.max()))
for n, (lon, lat) in enumerate(views):
    a, b = np.radians(lon), np.radians(lat)
    f = np.array([np.cos(b) * np.sin(a), np.sin(b), np.cos(b) * np.cos(a)])
    r = np.cross([0, 1, 0], f); r /= np.linalg.norm(r)
    u = np.cross(f, r)
    z = pos @ f
    m = z > 0.5
    x = (pos[m] @ r) / z[m] * k + W / 2
    y = H / 2 - (pos[m] @ u) / z[m] * k
    inside = (x >= 1) & (x < W - 1) & (y >= 1) & (y < H - 1)
    x, y = x[inside], y[inside]
    br = star[m][inside][:, 1] * meta['level']
    c = col[m][inside]
    img = np.zeros((H, W, 3))
    yy, xx = np.mgrid[0:H, 0:W]
    d = ((xx - W / 2) / k)[..., None] * r + ((H / 2 - yy) / k)[..., None] * u + f
    d /= np.linalg.norm(d, axis=2, keepdims=True)
    gu = ((np.arctan2(d[..., 0], d[..., 2]) / (2 * np.pi) + 0.5) * meta['width']).astype(int) % meta['width']
    gv = np.clip(((np.arcsin(np.clip(d[..., 1], -1, 1)) / np.pi + 0.5) * meta['height']).astype(int), 0, meta['height'] - 1)
    img += glow[gv, gu][..., None] * meta['glow'] * np.array(meta['glowTint'])
    xi, yi = x.astype(int), y.astype(int)
    for ch in range(3):
        np.add.at(img[..., ch], (yi, xi), br * c[:, ch] * 2)
    print(lon, lat, 'stars in view', len(x), 'glow mean %.4f max %.4f' % ((glow[gv, gu] * meta['glow']).mean(), (glow[gv, gu] * meta['glow']).max()))
    px = (np.clip(img, 0, 1) ** (1 / 2.2) * 255).astype('uint8')
    sheet.paste(Image.fromarray(px), ((n % 3) * W, (n // 3) * H))
sheet.save(out)
