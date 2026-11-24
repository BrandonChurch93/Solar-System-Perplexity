"""The country round the close ground, drawn from the close ground itself (closelay.py, platetone.py, skirt.py, pyramid.py before this step).

The close ground is a picture from one low eye. Laid on the plates it is the true ground where that eye saw it well, near the
place. Everywhere else the plates held ground of another kind: a made plain, the made canyon as flat steps, and far out the
picture's own far ground stretched along the eye's rays. Seen from above that was a flat plain with a patch in it, and at the
change of view the canyon land came in over it. Here the plates of 3.8 degrees and under take, outside the well seen ground,
a take of the same land seen from straight above (takes r38, r16, r07, r03 of RECIPE.md, each led by the plate as laid):

  keep  = the laid ground (land-*-laid.png of closelay.py) where the close ground stands (a<width>-height.npy of
          heights.py --aprons, finite there), drawn in by softDeg, within the reach of the eye (block reach:
          1 within fromDeg of the spot, 0 beyond toDeg, the border wandering by a fixed field of the ground)
  tone  = the take follows the broad tone of the laid ground where both are known, less and less with the distance (toneDeg)
  plate = laid * keep + take * tone * (1 - keep)

The border lies on the ground: no height, time or eye is read. pyramid.py and landunder.py run after it.

  python3 assets-src/mars/place/countrytake.py --dir LAID --laid MASKS --foot FOOT --out OUT
"""
import argparse
import json
import math
import os

import cv2
import numpy as np
from PIL import Image, JpegImagePlugin

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


def half(width):
    return math.tan(math.radians(width) / 2)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def reach_mask(K, g=2048):
    wide = 2.2 * (K['toDeg'] + K['wanderDeg'])
    per = g / (2 * half(wide))
    at = (np.arange(g, dtype=np.float32) + 0.5 - g / 2) / per
    deg = np.degrees(np.arctan(np.hypot(at[None, :], at[:, None])))
    rng = np.random.default_rng(K['seed'])
    fld = np.zeros((g, g), np.float32)
    for size, share in K['field']:
        k = max(2, int(wide / size) + 2)
        fld += share * cv2.resize(rng.standard_normal((k, k)).astype(np.float32), (g, g), interpolation=cv2.INTER_CUBIC)
    fld = np.clip(fld / max(float(np.abs(fld).max()), 1e-6), -1, 1)
    return wide, 1 - smooth((deg + fld * K['wanderDeg'] - K['fromDeg']) / (K['toDeg'] - K['fromDeg']))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', required=True)
    ap.add_argument('--laid', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--foot', default=os.path.join(ROOT, 'out', 'work', 'place', 'ap'))
    ap.add_argument('--takes', default=os.path.join(ROOT, 'assets-src', 'mars', 'place', 'takes'))
    ap.add_argument('--plates', default=os.path.join(ROOT, 'assets-src', 'mars', 'place', 'plates.json'))
    ap.add_argument('--json', default=os.path.join(ROOT, 'src', 'stops', 'mars', 'levels.json'))
    args = ap.parse_args()
    P = json.load(open(args.plates))
    K, R = P['takes'], P['reach']
    own = [l for l in json.load(open(args.json))['levels'] if l.get('own')]
    os.makedirs(args.out, exist_ok=True)
    wide, mask = reach_mask(R)
    g = mask.shape[0]
    for l in own:
        f = Image.open(os.path.join(args.dir, l['file']))
        q, s = dict(f.quantization), JpegImagePlugin.get_sampling(f)
        laid = np.asarray(f.convert('RGB')).astype(np.float32)
        name = K['levels'].get('%g' % l['widthDeg'])
        if not name:
            f.save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s)
            print(l['file'], 'no take, kept')
            continue
        c = laid.shape[0]
        take = np.asarray(Image.open(os.path.join(args.takes, name)).convert('RGB')).astype(np.float32)
        take = cv2.resize(take, (c, c), interpolation=cv2.INTER_LANCZOS4 if take.shape[0] < c else cv2.INTER_AREA)
        per = c / l['widthDeg']  # texels a degree, near enough at these widths
        m = np.asarray(Image.open(os.path.join(args.laid, l['file'].replace('.jpg', '-laid.png'))).convert('L')).astype(np.float32) / 255
        foot = np.isfinite(np.load(os.path.join(args.foot, 'a%g-height.npy' % l['widthDeg']))).astype(np.float32)
        m = m * cv2.resize(foot, (c, c), interpolation=cv2.INTER_LINEAR)
        sg = max(K['softDeg'] * per, 1.0)
        m = smooth((cv2.GaussianBlur(m, (0, 0), sg) - K['inside']) / (1 - K['inside']) * 2)
        z = c * half(wide) / half(l['widthDeg']) / g
        A = np.float32([[z, 0, c / 2 - z * g / 2 + (z - 1) / 2], [0, z, c / 2 - z * g / 2 + (z - 1) / 2]])
        keep = m * cv2.warpAffine(mask, A, (c, c), flags=cv2.INTER_LINEAR if z > 1 else cv2.INTER_AREA, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        # the tone, on a small grid
        t = 512
        small = lambda a: cv2.resize(a, (t, t), interpolation=cv2.INTER_AREA)
        st = max(K['toneDeg'] * per * t / c, 1.0)
        k = small(keep)
        blur = lambda a: cv2.GaussianBlur(a, (0, 0), st)
        ratio = np.log(np.maximum(blur(small(laid) * k[..., None]), 1e-3) / np.maximum(blur(small(take) * k[..., None]), 1e-3))
        w = blur(k)
        far = smooth(w / K['toneFull'])
        gain = np.exp(np.clip(ratio, math.log(K['gain'][0]), math.log(K['gain'][1])) * far[..., None])
        gain = cv2.resize(gain, (c, c), interpolation=cv2.INTER_CUBIC)
        out = laid * keep[..., None] + take * gain * (1 - keep[..., None])
        Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8)).save(os.path.join(args.out, l['file']), 'JPEG', qtables=q, subsampling=s)
        print(l['file'], os.path.getsize(os.path.join(args.out, l['file'])), name, 'laid ground kept on %.3f of it, gain %.2f to %.2f' % (float((keep > 0.5).mean()), float(gain.min()), float(gain.max())))


if __name__ == '__main__':
    main()
