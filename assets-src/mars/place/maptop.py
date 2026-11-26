"""The lit levels above the land (patch-19, patch-42, patch-wide) hold the place inside the globe's own tones (MAIL 1425).

landunder.py and the takes before it laid the place into these levels as factors on a pale picture (luminance 170 to 220 of
255 round the spot), out to under.aboveDeg from the spot. A lit form times its factor ran into 255 and lost its colour there
(a yellow white patch on the canyon's south rim, hot rims), and texels beside it fell to black. MEASURED on patch-19 before
this step, within 2.8 degrees of the spot: 7334 texels with a channel at 255, 382 texels under luminance 10; the globe's own
picture there (main's file, the level before any form of the place) has its 1st percentile of luminance at about 48 and its
99th at 217. From 2726 and 2427 the patch read as a glowing spot beside a black gash.

Here every texel within aboveDeg[1] of the spot is held between the globe's own dark and bright ground:

  top, floor  the `topPercentile` and `floorPercentile` of the luminance of the globe's own picture (`--before`) in that circle
  bright end  luminance L over the knee kt = top - (255 - top) goes to kt + (top - kt) * tanh((L - kt) / (top - kt));
              a texel whose largest channel is near 255 has lost its colour and takes the globe's own pale colour (the mean
              colour of `before` between its 90th percentile and its top), by smooth((largest - clipFrom) / (255 - clipFrom))
  dark end    luminance L under the knee kd = `toe` * floor goes to floor + L * (kd - floor) / kd, and takes the globe's own
              dark colour (the mean colour of `before` under its floor) by 1 - L / kd

The order of the tones is kept, nothing is blurred and no texel of `before` is copied: only its four numbers and two colours.
Values: plates.json block under.top.

  python3 assets-src/mars/place/maptop.py --dir DIR --before DIR --out OUT
"""
import argparse
import json
import math
import os

import numpy as np
from PIL import Image, JpegImagePlugin

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
W = np.array([0.2126, 0.7152, 0.0722], np.float32)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True, help='the levels as they stand')
    ap.add_argument('--before', required=True, help="the globe's own picture: the same levels before the place was laid in")
    ap.add_argument('--out', required=True)
    ap.add_argument('--plates', default=os.path.join(ROOT, 'assets-src', 'mars', 'place', 'plates.json'))
    ap.add_argument('--json', default=os.path.join(ROOT, 'src', 'stops', 'mars', 'levels.json'))
    args = ap.parse_args()
    U = json.load(open(args.plates))['under']
    K = U['top']
    levels = json.load(open(args.json))['levels']
    os.makedirs(args.out, exist_ok=True)
    for l in [x for x in levels if not x.get('own')]:
        f = Image.open(os.path.join(args.dir, l['file']))
        q, s = dict(f.quantization), JpegImagePlugin.get_sampling(f)
        src = np.asarray(f.convert('RGB'))
        now = src.astype(np.float32)
        before = np.asarray(Image.open(os.path.join(args.before, l['file'])).convert('RGB')).astype(np.float32)
        c = now.shape[0]
        per = c / (2 * math.tan(math.radians(l['widthDeg']) / 2))
        at = (np.arange(c, dtype=np.float32) + 0.5 - c / 2) / per
        deg = np.degrees(np.arctan(np.hypot(at[None, :], at[:, None])))
        inside = deg <= U['aboveDeg'][1]
        ys, xs = np.nonzero(inside)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        n, b0, m = now[y0:y1, x0:x1], before[y0:y1, x0:x1], inside[y0:y1, x0:x1]
        ln, lb = n @ W, b0 @ W
        top, floor, p90 = (float(np.percentile(lb[m], p)) for p in (K['topPercentile'], K['floorPercentile'], 90))
        pale = b0[m & (lb >= p90) & (lb <= top)].mean(axis=0)
        dark = b0[m & (lb <= floor)].mean(axis=0)
        kt, kd = top - (255 - top), K['toe'] * floor
        held = np.where(ln > kt, kt + (top - kt) * np.tanh((ln - kt) / (top - kt)), ln)
        held = np.where(ln < kd, floor + ln * (kd - floor) / kd, held)
        res = n * (held / np.maximum(ln, 1e-3))[..., None]
        lost = smooth((n.max(2) - K['clipFrom']) / (255 - K['clipFrom']))
        res += (pale[None, None, :] * (held / float(pale @ W))[..., None] - res) * lost[..., None]
        deep = np.clip(1 - ln / kd, 0, 1)
        res += (dark[None, None, :] * (held / float(dark @ W))[..., None] - res) * deep[..., None]
        res = np.where(m[..., None], res, n)
        o8 = src.copy()
        o8[y0:y1, x0:x1] = np.clip(res + 0.5, 0, 255).astype(np.uint8)
        same = np.abs(o8.astype(np.int16) - src.astype(np.int16)).max(2) == 0
        Image.fromarray(o8).save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s, optimize=True)
        r8 = o8[y0:y1, x0:x1].astype(np.float32)
        lo = r8 @ W
        print('%s: top %.1f, floor %.1f, pale %s, dark %s; inside %.1f degrees %d texels, changed %d; luminance %.0f to %.0f before this step, %.0f to %.0f after; texels with a channel at 255: %d before, %d after; under luminance 10: %d before, %d after; bytes %d to %d' % (
            l['file'], top, floor, np.round(pale).astype(int).tolist(), np.round(dark).astype(int).tolist(), U['aboveDeg'][1], int(m.sum()), int((~same).sum()),
            float(ln[m].min()), float(ln[m].max()), float(lo[m].min()), float(lo[m].max()),
            int((n.max(2) >= 255)[m].sum()), int((r8.max(2) >= 255)[m].sum()), int((ln < 10)[m].sum()), int((lo < 10)[m].sum()),
            os.path.getsize(os.path.join(args.dir, l['file'])), os.path.getsize(os.path.join(args.out, l['file']))))


if __name__ == '__main__':
    main()
