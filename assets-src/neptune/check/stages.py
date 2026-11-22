import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'wrap'))
import geo
import sepmap

Image.MAX_IMAGE_PIXELS = None
WORK = os.path.join(geo.ROOT, 'out/work/nep/wrap')
LUM = np.array([0.2126, 0.7152, 0.0722], np.float32)


def report(name, ref, got, mask):
    r, g = ref @ LUM, got @ LUM
    k = np.ones((5, 5), np.uint8)
    top = lambda a: np.sort(a[mask])[-max(int(mask.sum()) // 1000, 1):].mean()
    crest = mask & (r >= np.percentile(r[mask], 99))
    pit = mask & (r <= np.percentile(r[mask], 5))
    hp = lambda a, s: (a - cv2.GaussianBlur(a, (0, 0), s))[mask].std()
    print('%-34s top %.1f / %.1f  p99 %.1f / %.1f  crest diff %+.2f (same texel %+.2f)  pit diff %+.2f  hp2 %.3f  hp6 %.3f  mean abs %.2f' % (
        name, top(r), top(g), np.percentile(r[mask], 99), np.percentile(g[mask], 99), (cv2.dilate(g, k)[crest] - cv2.dilate(r, k)[crest]).mean(), (g[crest] - r[crest]).mean(),
        (cv2.erode(g, k)[pit] - cv2.erode(r, k)[pit]).mean(), hp(g, 2.0) / hp(r, 2.0), hp(g, 6.0) / hp(r, 6.0), np.abs(g - r)[mask].mean()))


def main():
    img = cv2.imread(os.path.join(WORK, 'hero-map.png'), cv2.IMREAD_COLOR)[..., ::-1].astype(np.float32)
    g = np.load(os.path.join(WORK, 'hero-map-geo.npz'))
    ndl = g['ndl']
    x0, y0, x1, y1 = g['window']
    lay = np.load(os.path.join(WORK, 'hero-layers.npz'))
    mask = lay['weight'] > 0.99
    look = json.load(open(os.path.join(geo.ROOT, 'src/stops/neptune/curve.json')))
    shade = sepmap.shade_of(ndl, np.array(json.load(open(os.path.join(WORK, 'curves-measured.json')))['deck']))
    cloud = sepmap.shade_of(ndl, np.array(look['cloud']))
    deck, alpha = lay['deck'], lay['alpha'][..., None]
    enc = lambda a: geo.encode(a).astype(np.float32)
    report('separation, float', img, enc(deck * shade * (1 - alpha) + alpha * cloud), mask)
    report('separation, alpha not clipped at 1', img, enc(deck * shade), mask & (alpha[..., 0] < 0.02))
    code = look['code']
    d8 = np.round(geo.linear_to_srgb(np.clip(deck * code, 0, 1)) * 255) / 255
    a8 = np.round(np.clip(alpha, 0, 1) * 255) / 255
    report('8 bit, code %.2f' % code, img, enc(geo.srgb_to_linear(d8) / code * shade * (1 - a8) + a8 * cloud), mask)
    for name in sys.argv[1:]:
        w = np.asarray(Image.open(name).convert('RGBA'))
        s = w.shape[1] / 8192
        if s == 1:
            c = w[y0:y1, x0:x1].astype(np.float32) / 255
        else:
            c = cv2.resize(w, (8192, 4096), interpolation=cv2.INTER_LINEAR)[y0:y1, x0:x1].astype(np.float32) / 255
        dm, am = geo.srgb_to_linear(c[..., :3]) / code, c[..., 3:]
        report(os.path.basename(os.path.dirname(name)) + '/' + os.path.basename(name), img, enc(dm * shade * (1 - am) + am * cloud), mask)
        report('  its deck with the float alpha', img, enc(dm * shade * (1 - alpha) + alpha * cloud), mask)
        report('  its alpha with the float deck', img, enc(deck * shade * (1 - am) + am * cloud), mask)


main()
