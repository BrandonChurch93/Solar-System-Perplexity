"""The blue law of the made ground of the place (MAIL 1484 point 4: the violet speck at 2466).

The speck is drawn from the land plates. Since bodyfull.py lays the approved picture's own ground on them (commit
5e92bb49) the plates hold texels far bluer than any ground of that picture: full set, blue over red by more than 26
levels: 383 texels of land-0p7, 334 of land-1p6, 472 of land-3p8, up to (0, 0, 254); every one inside the picture's field
on the plate (heights.py --picture-only), none at its border. The picture's ground itself has none: the largest blue
minus red in the colour files of the close set is 26 (relief-L0 26, L1 26, L2 13, C0 14, C1 13). They come from the
air law of bodyfull.py, which takes the picture's air out channel by channel and raises what is left: where red and
green are all air, the blue that is left is raised alone. In the film one such cluster is a violet speck of 5 px at 2466
(x 1015, y 289 to 294 at the draft tier); with these texels mended the frame holds no pixel with blue over red by 25.

The law: no texel of an own level of the place is bluer than the picture's ground (blue minus red at most the largest
of the close set's colour files, read from the set at each run). bodyfull.py holds its own result to it from now on
(the same function), and this tool mends the baked plates: a texel over the law keeps its light and takes the hue of
the ground about it (the mean of the texels within `reach` that keep the law; values plates.json takes.blueLaw). It writes the JPEG's own coefficients:
only the 8 x 8 blocks that hold such a texel are coded anew with the file's own tables (the plates are coded 4:4:4),
every other block keeps its numbers. The web plates are the full plates reduced by the area mean (webplates.py): their
blocks over the law take the reduced full plate, then the law itself.

  python3 assets-src/mars/place/bluelaw.py [--check]
"""
import glob
import json
import os
import sys

import cv2
import jpeglib
import numpy as np
from PIL import Image, JpegImagePlugin

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
V = json.load(open(os.path.join(ROOT, 'assets-src', 'mars', 'place', 'plates.json')))['takes']['blueLaw']
ROOM = V['room']      # a mended texel is written this far under the law, for the loss of the coding
REACH = V['reach']    # texels: the ground about a texel whose hue it takes
PASSES = V['passes']
LUMA = np.array([0.299, 0.587, 0.114])
C = np.array([[(np.sqrt(0.125) if u == 0 else 0.5) * np.cos((2 * x + 1) * u * np.pi / 16) for x in range(8)] for u in range(8)])


def picture_most(key):
    """The largest blue minus red of the approved picture's ground as the set holds it."""
    most = 0
    for path in sorted(glob.glob(os.path.join(ROOT, 'public', 'assets', 'mars', key, 'relief-*-color.jpg'))):
        c = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
        most = max(most, int((c[..., 2] - c[..., 0]).max()))
    return most


def over(rgb, limit):
    return rgb[..., 2].astype(np.int16) - rgb[..., 0].astype(np.int16) > limit


def held(rgb, limit, room=ROOM, reach=REACH):
    """rgb (float, 0 to 255) with every texel over limit - room given its own light in the hue of the ground about it."""
    rgb = rgb.astype(np.float64)
    bad = rgb[..., 2] - rgb[..., 0] > limit - room
    if not bad.any():
        return rgb
    ok = (~bad).astype(np.float64)
    k = 2 * reach + 1
    den = cv2.blur(ok, (k, k))
    hue = np.stack([cv2.blur(rgb[..., c] * ok, (k, k)) for c in range(3)], axis=-1) / np.maximum(den, 1e-6)[..., None]
    none = den < 1e-6
    hue[none] = (rgb[~bad].mean(axis=0) if (~bad).any() else np.array([120.0, 80.0, 60.0]))
    light = rgb @ LUMA
    new = hue * (light / np.maximum(hue @ LUMA, 1e-6))[..., None]
    new[..., 2] = np.minimum(new[..., 2], new[..., 0] + limit - room)
    out = rgb.copy()
    out[bad] = np.clip(new[bad], 0, 255)
    return out


def code_blocks(path, blocks, pixels):
    """Code the 8 x 8 blocks (by, bx) of the file anew from `pixels` (the whole picture, float RGB)."""
    im = jpeglib.read_dct(path)
    for by, bx in blocks:
        px = pixels[by * 8:by * 8 + 8, bx * 8:bx * 8 + 8]
        if px.shape[:2] != (8, 8):
            px = np.pad(px, ((0, 8 - px.shape[0]), (0, 8 - px.shape[1]), (0, 0)), mode='edge')
        r, g, b = px[..., 0], px[..., 1], px[..., 2]
        planes = (0.299 * r + 0.587 * g + 0.114 * b - 128, -0.168735892 * r - 0.331264108 * g + 0.5 * b, 0.5 * r - 0.418687589 * g - 0.081312411 * b)
        for plane, comp, table in zip(planes, (im.Y, im.Cb, im.Cr), im.quant_tbl_no):
            comp[by, bx] = np.round((C @ plane @ C.T) / im.qt[table]).astype(np.int16)
    im.write_dct(path, flags=['+OPTIMIZE_CODING'])  # the file's own way of coding (the plates were written with tables made for them)


def blocks_of(mask):
    ys, xs = np.nonzero(mask)
    return sorted(set(zip((ys // 8).tolist(), (xs // 8).tolist())))


def mend(path, limit, source=None):
    """Passes until no texel of the file is over the law. source: the picture the blocks take first (web: the full plate reduced)."""
    assert JpegImagePlugin.get_sampling(Image.open(path)) == 0, path + ': 4:4:4 wanted'
    for turn in range(PASSES):
        now = np.asarray(Image.open(path).convert('RGB'))
        bad = over(now, limit)
        if not bad.any():
            return turn
        base = source if (source is not None and turn == 0) else now
        code_blocks(path, blocks_of(bad), held(base, limit))
    return PASSES


def main():
    check = '--check' in sys.argv
    # --dir FOLDER: the plates of FOLDER/full and FOLDER/web instead of the tree's (plates not yet baked)
    base = sys.argv[sys.argv.index('--dir') + 1] if '--dir' in sys.argv else os.path.join(ROOT, 'public', 'assets', 'mars')
    files = [l['file'] for l in json.load(open(os.path.join(ROOT, 'src', 'stops', 'mars', 'levels.json')))['levels'] if l.get('own')]
    limit = {key: picture_most(key) for key in ('full', 'web')}
    print('the picture\'s ground, largest blue minus red: full %d, web %d' % (limit['full'], limit['web']))
    for name in files:
        full = os.path.join(base, 'full', name)
        web = os.path.join(base, 'web', name)
        first = {p: np.asarray(Image.open(p).convert('RGB')) for p in (full, web)}
        print(name, 'texels over the law: full %d, web %d' % (int(over(first[full], limit['full']).sum()), int(over(first[web], limit['web']).sum())))
        if check:
            continue
        mend(full, limit['full'])
        after = np.asarray(Image.open(full).convert('RGB'))
        mend(web, limit['web'], cv2.resize(after, first[web].shape[1::-1], interpolation=cv2.INTER_AREA))
        for key, p in (('full', full), ('web', web)):
            last = np.asarray(Image.open(p).convert('RGB'))
            changed = (last != first[p]).any(2)
            print('   %s: texels changed %d in %d blocks of 8 by 8, largest change %d levels, still over the law %d, bytes %d' % (
                key, int(changed.sum()), len(blocks_of(changed)), int(np.abs(last.astype(int) - first[p].astype(int)).max()) if changed.any() else 0, int(over(last, limit[key]).sum()), os.path.getsize(p)))


if __name__ == '__main__':
    main()
