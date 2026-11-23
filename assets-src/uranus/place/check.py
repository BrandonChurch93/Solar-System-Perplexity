import json
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

place = json.load(open('src/stops/uranus/place.json'))


def horizon(path, near=None, reach=30):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255
    blue = gaussian_filter(a[..., 2] - a[..., 0], 2.0)
    g = blue[2:, :] - blue[:-2, :]
    if near is not None:
        rows = np.arange(g.shape[0])[:, None]
        g = np.where(np.abs(rows + 1 - near[None, :]) <= reach, g, -1.0)
    top = np.argmax(g, 0)
    strength = np.max(g, 0)
    cols = np.arange(a.shape[1])
    lo = g[np.clip(top - 1, 0, g.shape[0] - 1), cols]
    hi = g[np.clip(top + 1, 0, g.shape[0] - 1), cols]
    sub = 0.5 * (lo - hi) / np.minimum(lo - 2 * strength + hi, -1e-9)
    return a, top + 1.0 + sub, strength


def body_top(path):
    m = np.asarray(Image.open(path).convert('RGB')).astype(int).sum(-1) > 30
    return np.argmax(m, 0).astype(float), m.any(0).astype(float)


def main(globe, close, out, globe_layers=None, close_layers=None):
    a, ra, sa = horizon(globe)
    b, rb, sb = horizon(close, ra)
    if globe_layers and close_layers:
        ra, sa = body_top(globe_layers)
        rb, sb = body_top(close_layers)
    h, w, _ = a.shape
    x = np.arange(w)
    sun = place['sun']['screen'][0] * w
    ok = (sa > 0.01) & (sb > 0.01) & (ra > 4) & (ra < h - 4) & ((np.abs(x - sun) > 0.06 * w) | bool(globe_layers))
    d = (rb - ra)[ok]
    stats = {'columns': int(ok.sum()), 'closeBelowGlobe': True, 'meanPx': float(d.mean()), 'rmsPx': float(np.sqrt((d * d).mean())), 'p95AbsPx': float(np.percentile(np.abs(d), 95)), 'maxAbsPx': float(np.abs(d).max()), 'leftPx': float(d[: len(d) // 8].mean()), 'rightPx': float(d[-len(d) // 8:].mean()), 'height': h}
    sheet = Image.new('RGB', (w * 2, h * 2))
    sheet.paste(Image.fromarray((a * 255).astype(np.uint8)), (0, 0))
    sheet.paste(Image.fromarray((b * 255).astype(np.uint8)), (w, 0))
    split = a.copy()
    split[:, w // 2:] = b[:, w // 2:]
    sheet.paste(Image.fromarray((split * 255).astype(np.uint8)), (0, h))
    strips = a.copy()
    band = (x // (w // 16)) % 2 == 1
    strips[:, band] = b[:, band]
    im = Image.fromarray((strips * 255).astype(np.uint8))
    dr = ImageDraw.Draw(im)
    for i in range(0, w, 6):
        if ok[i]:
            dr.ellipse((i - 1, ra[i] - 1, i + 1, ra[i] + 1), fill=(255, 60, 60))
            dr.ellipse((i + 2, rb[i] - 1, i + 4, rb[i] + 1), fill=(255, 230, 40))
    sheet.paste(im, (w, h))
    dr = ImageDraw.Draw(sheet)
    for (px, py, text) in [(8, 8, 'globe side from the twin'), (w + 8, 8, 'close side, same frame'), (8, h + 8, 'left half globe side, right half close side'), (w + 8, h + 8, 'strips of both, horizon found: red globe, yellow close; close minus globe mean %.2f px, largest %.1f px of %d' % (stats['meanPx'], stats['maxAbsPx'], h))]:
        dr.text((px, py), text, fill=(255, 255, 255))
    sheet.resize((w, h), Image.LANCZOS).save(out, quality=90)
    print(json.dumps(stats))


main(*sys.argv[1:6])
