"""The lit levels above the land hold the made ground inside the globe's own hues (MAIL 1303, MAIL 1425; sibling of maptop.py).

landunder.py and the takes before it laid the place into patch-19, patch-42 and patch-wide as factors on the file's values,
channel by channel, out to under.aboveDeg from the spot. In the shade of small forms the three factors differ (the plates' shade
is near grey in its file, their lit ground red), and a pale texel of the map times them came out dark teal or purple: colours
neither the globe's own picture nor the plates as drawn show there. From 2435 they stand as green specks south of the canyon.

MEASURED on patch-19 of 8397bfdc in a crop of 120 texels 0.84 to 1.11 degrees south of the spot: 343 texels with green over
0.95 of red; the globe's own picture (main 23f1089b) has none there.

Here every texel within aboveDeg[1] of the spot is held, at its own luminance, between the `huePercentile` pair of the globe's
own picture (`--before`) for green over red and for blue over red, read in `hueBins` bins of luminance over that circle and
taken between the bins by luminance. A texel inside the pair keeps its bytes' colour; one outside takes the bound, at its own
luminance. Nothing is blurred and no texel of `before` is copied: only the four curves. Values: plates.json under.top.

  python3 assets-src/mars/place/maphue.py --dir DIR --before DIR --out OUT
"""
import argparse, json, math, os
import numpy as np
from PIL import Image, JpegImagePlugin

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
W = np.array([0.2126, 0.7152, 0.0722], np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True)
    ap.add_argument('--before', required=True)
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
        before = np.asarray(Image.open(os.path.join(args.before, l['file'])).convert('RGB')).astype(np.float32)
        c = src.shape[0]
        per = c / (2 * math.tan(math.radians(l['widthDeg']) / 2))
        at = (np.arange(c, dtype=np.float32) + 0.5 - c / 2) / per
        deg = np.degrees(np.arctan(np.hypot(at[None, :], at[:, None])))
        inside = deg <= U['aboveDeg'][1]
        ys, xs = np.nonzero(inside)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        n, b0, m = src[y0:y1, x0:x1].astype(np.float32), before[y0:y1, x0:x1], inside[y0:y1, x0:x1]
        ln, lb = n @ W, b0 @ W
        # the globe's own hues by luminance: bins of equal count
        order = np.sort(lb[m])
        edges = order[np.linspace(0, len(order) - 1, K['hueBins'] + 1).astype(int)]
        mid, bounds = [], []
        for i in range(K['hueBins']):
            k = m & (lb >= edges[i]) & (lb <= edges[i + 1])
            p = b0[k]
            gr, br = (p[:, 1] + 1) / (p[:, 0] + 1), (p[:, 2] + 1) / (p[:, 0] + 1)
            mid.append(float(lb[k].mean()))
            bounds.append([float(np.percentile(gr, K['huePercentile'][0])), float(np.percentile(gr, K['huePercentile'][1])),
                           float(np.percentile(br, K['huePercentile'][0])), float(np.percentile(br, K['huePercentile'][1]))])
        mid, bounds = np.array(mid), np.array(bounds)
        lim = [np.interp(ln, mid, bounds[:, j]).astype(np.float32) for j in range(4)]
        r = n[..., 0] + 1
        gr = np.clip((n[..., 1] + 1) / r, lim[0], lim[1])
        br = np.clip((n[..., 2] + 1) / r, lim[2], lim[3])
        # the colour of those two ratios at the texel's own luminance
        red = (ln + 1) / (W[0] + W[1] * gr + W[2] * br)
        res = np.stack([red, red * gr, red * br], axis=-1) - 1
        out = ((n[..., 1] + 1) / r != gr) | ((n[..., 2] + 1) / r != br)
        res = np.where((m & out)[..., None], res, n)
        o8 = src.copy()
        o8[y0:y1, x0:x1] = np.where((m & out)[..., None], np.clip(res + 0.5, 0, 255).astype(np.uint8), src[y0:y1, x0:x1])
        Image.fromarray(o8).save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s, optimize=True)
        print('%s: %d bins of luminance %.0f to %.0f; bounds green over red %.3f..%.3f (dark end) to %.3f..%.3f (pale end), blue over red %.3f..%.3f to %.3f..%.3f; inside %.1f degrees %d texels, held %d (%.4f); bytes %d to %d' % (
            l['file'], K['hueBins'], mid[0], mid[-1], bounds[0, 0], bounds[0, 1], bounds[-1, 0], bounds[-1, 1], bounds[0, 2], bounds[0, 3], bounds[-1, 2], bounds[-1, 3],
            U['aboveDeg'][1], int(m.sum()), int((m & out).sum()), float((m & out).sum() / m.sum()),
            os.path.getsize(os.path.join(args.dir, l['file'])), os.path.getsize(os.path.join(args.out, l['file']))))


if __name__ == '__main__':
    main()
