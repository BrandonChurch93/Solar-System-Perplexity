"""The far deck of T as a map in the frame of T (plates.json, atT.far.clear; RECIPE.md, the place, step 12).

The plates of the film hold the far deck as it is from above. The plates that `tlay.py far` makes hold it as the camera of T
sees it, the pale deck of the surface view. This tool writes what parts the two: for every direction from the foot of the
camera of T (across: the bearing about that foot, atT.far.clear.azDeg to each side of the level line of sight of T; down:
the sine of the elevation of the camera of T over the ground point, from the first value of atT.far.clear.sine at the top
row to the second), the logarithm to base 2 of the plate with the far deck over the plate of the film, in light, as the film
puts each level together. A cell takes the finest level that covers it (c over b over a over w, with the film's feather),
and is none where `tlay.py far` gave the plate no far deck. A channel holds 128 for none and 127 steps to each side that
reach atT.far.clear.octaves by the step to the power 1 / atT.far.clear.law; the file is a JPEG with every channel at the
full size (a file that keeps the colour at half size leaves its loss where the reader counts the pattern). The globe draws the plates of the film times 2 to the power of (map
times a share by the height of the eye).

Past the far end of the far deck (only when atT.far.clear.past is given) the camera of T sees no ground: its last rows under the limb, and the
ground behind its horizon. There the map holds the tone of the far end of the far deck on the same bearing (the mean of the
first `rows` rows of the far deck, eased over `sigmaDeg` of bearing) over the plate of the film, by a share that is all at
the far end of the far deck and none at the sine `to`: the pale deck does not end in a line on the ground, it goes over
into the plates' own ground behind the horizon of T.

python3 assets-src/venus/place/farmap.py KIND FAR MASKS [check] [to=FOLDER]
  KIND    dive or rise
  FAR     folder with the full set's plates after `tlay.py far` and `tlay.py export` (place3-<level>-KIND.jpg of w, a, b, c)
  MASKS   folder with the shares `tlay.py far` wrote (KIND-<tag>-far.png of w, a, b, c)
  check   also measure, per level, the plate of the film times the map against the plate with the far deck
  to=     write the two files under FOLDER/full and FOLDER/web (a trial) and not under public/assets/venus
The plates of the film are read from public/assets/venus/full; the map is written to both sets (the web set at half size).
No model, no random number. About 2 GB of memory, never beside a render."""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

import lay

SPEC = lay.SPEC
SIZE = SPEC['size']
LEVELS = {l['tag']: l for l in SPEC['levels']}
CLEAR = SPEC['atT']['far']['clear']
TAGS = ['w', 'a', 'b', 'c']
S0, S1 = CLEAR['sine']
PAST = CLEAR.get('past')


def axes(kind):
    """The eye of T in the frame of the plates, its height, the up at its foot, its level line of sight and the line to its right."""
    cam = json.loads((lay.WORK / 'tcam.json').read_text())[kind]
    eye = np.array(cam['position'])
    up = eye / np.linalg.norm(eye)
    fwd = -np.array(cam['z'])
    fwd = fwd - (fwd @ up) * up
    fwd /= np.linalg.norm(fwd)
    return eye, np.linalg.norm(eye) - 1, up, fwd, np.cross(fwd, up)


def together(folder, kind, tag):
    """The plate of a level in light, as the film puts it together."""
    level = LEVELS[tag]
    name = level['file'].replace('.jpg', f'-{kind}.jpg')
    if 'colour' not in level:
        return lay.to_light(cv2.imread(str(folder / name), cv2.IMREAD_COLOR).astype(np.float32) / 255)
    light = cv2.imread(str(folder / name), cv2.IMREAD_GRAYSCALE)
    parent = cv2.imread(str(folder / LEVELS[level['colour']]['file'].replace('.jpg', f'-{kind}.jpg')), cv2.IMREAD_COLOR)
    return lay.put_together(light, parent, lay.colour_share(SPEC['levels'], tag), level['most'])


def polar(kind, tag, fields, size, sub=(8, 2)):
    """Fields of the plate of tag at the cells of the map (the mean over sub points down and across each cell), and the
    weight the film gives that level there (the feather of its border)."""
    w, h = size
    _, height, up, fwd, right = axes(kind)
    n, e, u = lay.frame(lay.centre_dir())
    tw = np.tan(np.radians(LEVELS[tag]['widthDeg']) / 2)
    th = np.linspace(0, 0.9, 40001)
    mu = ((1 + height) * np.cos(th) - 1) / np.sqrt(1 + (1 + height) ** 2 - 2 * (1 + height) * np.cos(th))
    accs = [np.zeros((h, w) + f.shape[2:], np.float32) for f in fields]
    weight = np.zeros((h, w), np.float32)
    for k in range(sub[0]):
        t = np.interp(S0 + (np.arange(h) + (k + 0.5) / sub[0]) / h * (S1 - S0), mu[::-1], th[::-1])
        for j in range(sub[1]):
            az = ((np.arange(w) + (j + 0.5) / sub[1]) / w - 0.5) * 2 * np.radians(CLEAR['azDeg'])
            ct, st = np.cos(t)[:, None], np.sin(t)[:, None]
            p = ct[..., None] * up + (st * np.cos(az)[None, :])[..., None] * fwd + (st * np.sin(az)[None, :])[..., None] * right
            pn = p @ n
            qx, qy = (p @ e) / pn / tw / 2, (p @ u) / pn / tw / 2
            col = ((qx + 0.5) * SIZE - 0.5).astype(np.float32)
            row = ((0.5 - qy) * SIZE - 0.5).astype(np.float32)
            weight += (pn > 0) * (1 - lay.smooth(0.5 - SPEC['feather'], 0.5, np.maximum(np.abs(qx), np.abs(qy))))
            for acc, f in zip(accs, fields):
                acc += cv2.remap(f, col, row, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    count = sub[0] * sub[1]
    return [a / count for a in accs], weight / count


def encode(lr):
    step = np.sign(lr) * np.minimum(np.abs(lr) / CLEAR['octaves'], 1) ** CLEAR['law']
    return np.clip(np.rint(128 + 127 * step), 1, 255).astype(np.uint8)


def decode(code):
    step = (code.astype(np.float32) - 128) / 127
    return np.sign(step) * np.abs(step) ** (1 / CLEAR['law']) * CLEAR['octaves']


def write(path, code):
    """Blue, green, red in; a JPEG of quality atT.far.clear.quality with every channel at the full size out, and what the
    file holds, read back."""
    Image.fromarray(code[..., ::-1]).save(path, 'JPEG', quality=CLEAR['quality'], subsampling=0, optimize=True)
    return cv2.imread(str(path), cv2.IMREAD_COLOR)


def past_the_end(kind, lr, share, ground, held, sel, sine):
    """Past the far end of the far deck (atT.far.clear.past): the tone of that end on each bearing over the plate of the film.
    lr the map so far, share the far deck's share of each cell, ground the plate of the film (log2, in light), held the
    weight of the levels there, sel the far deck's cells, sine the sine of each row."""
    h, w = share.shape
    deck = ground + lr
    full = share > 0.95
    end = np.where(full.any(0), full.argmax(0), 0)
    near = share > 0.5
    has = near.sum(0) >= PAST['rows']
    tone = np.zeros((w, 3), np.float32)
    for x in np.nonzero(has)[0]:
        rows = np.nonzero(near[:, x])[0][:PAST['rows']]
        tone[x] = deck[rows, x].mean(0)
    sigma = PAST['sigmaDeg'] / (2 * CLEAR['azDeg']) * w
    there = cv2.GaussianBlur(has.astype(np.float32)[None, :], (0, 0), sigma)[0]
    tone = cv2.GaussianBlur((tone * has[:, None])[None, :, :], (0, 0), sigma)[0] / np.maximum(there, 1e-3)[:, None]
    across = np.clip(there * 2 - 1, 0, 1)
    step = float(sine[int(np.median(np.where(sel.any(0), sel.argmax(0), 0)[has]))])
    down = lay.smooth(PAST['to'], step, sine).astype(np.float32)
    past = (np.arange(h)[:, None] < end[None, :]) * (1 - share) * down[:, None] * across[None, :] * held
    lr = lr + past[..., None] * (tone[None, :, :] - ground)
    print(kind, 'past the far deck: cells', round(float((past > 0.5).mean()), 4), 'the far end of the far deck at sine', round(step, 4), 'log2 of the ratio there at percentiles 1, 50, 99:', [round(float(x), 3) for x in np.percentile(lr[past > 0.5], [1, 50, 99])], 'top row and side columns none:', bool(np.abs(lr[0]).max() < 1e-3 and np.abs(lr[:, 0]).max() < 1e-3 and np.abs(lr[:, -1]).max() < 1e-3))
    return lr


def make(kind, far, masks, to):
    w, h = CLEAR['size']
    film = lay.ROOT / 'public/assets/venus/full'
    lr = np.zeros((h, w, 3), np.float32)
    share = np.zeros((h, w), np.float32)
    ground = np.zeros((h, w, 3), np.float32)
    held = np.zeros((h, w), np.float32)
    for tag in TAGS:
        mask = masks / f'{kind}-{tag}-far.png'
        if not mask.exists():
            print(kind, tag, 'no far deck of T on this level')
            continue
        plate = np.log2(together(film, kind, tag) + 1e-4).astype(np.float32)
        one = (np.log2(together(far, kind, tag) + 1e-4) - plate).astype(np.float32)
        m = cv2.imread(str(mask), cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
        (one, m, plate), weight = polar(kind, tag, [one, m, plate], (w, h))
        lr = lr * (1 - weight[..., None]) + one * weight[..., None]
        share = share * (1 - weight) + m * weight
        ground = ground * (1 - weight[..., None]) + plate * weight[..., None]
        held = held * (1 - weight) + weight
        print(kind, tag, 'cells the level gives', round(float((weight > 0.5).mean()), 4), 'far deck among them', round(float((m[weight > 0.5] > 0.5).mean()), 4))
    gate = lay.smooth(0.0, 0.1, share).astype(np.float32)
    lr *= gate[..., None]
    sel = gate > 0.5
    ys, xs = np.nonzero(sel)
    sine = S0 + (np.arange(h) + 0.5) / h * (S1 - S0)
    print(kind, 'far deck cells', round(float(sel.mean()), 4), 'sine', round(float(sine[ys.min()]), 4), 'to', round(float(sine[ys.max()]), 4), 'bearing', round((xs.min() / w - 0.5) * 2 * CLEAR['azDeg'], 2), 'to', round((xs.max() / w - 0.5) * 2 * CLEAR['azDeg'], 2), 'deg')
    if PAST:
        lr = past_the_end(kind, lr, share, ground / np.maximum(held, 1e-3)[..., None], held, sel, sine)
    # A cell whose ratio no channel can hold keeps the colour of its ratio: all three channels are brought in by one factor.
    lr *= np.minimum(1, CLEAR['octaves'] / np.maximum(np.abs(lr).max(2), 1e-6))[..., None]
    print(kind, 'log2 of the ratio at percentiles 0.1, 1, 50, 99, 99.9:', [round(float(x), 3) for x in np.percentile(lr[sel], [0.1, 1, 50, 99, 99.9])], 'share of cells over the octaves held', round(float((np.abs(lr) > CLEAR['octaves']).any(2).mean()), 6))
    name = CLEAR['files'][kind]
    for folder, size in (('full', (w, h)), ('web', (w // 2, h // 2))):
        want = lr if size == (w, h) else cv2.resize(lr, size, interpolation=cv2.INTER_AREA)
        path = to / folder / name
        path.parent.mkdir(parents=True, exist_ok=True)
        held = decode(write(path, encode(want)))
        err = np.abs(held - want)
        print(folder, name, path.stat().st_size, 'bytes; held against made, octaves: mean', round(float(err.mean()), 4), '99 percent within', round(float(np.percentile(err, 99)), 4))


def check(kind, far, masks, to):
    """The plate of the film times the map of the full set against the plate with the far deck, per level, in 8 bit display values."""
    film = lay.ROOT / 'public/assets/venus/full'
    held = decode(cv2.imread(str(to / 'full' / CLEAR['files'][kind]), cv2.IMREAD_COLOR))
    h, w = held.shape[:2]
    eye, _, up, fwd, right = axes(kind)
    n, e, u = lay.frame(lay.centre_dir())
    for tag in TAGS:
        mask = masks / f'{kind}-{tag}-far.png'
        if not mask.exists():
            continue
        d = lay.grid(n, e, u, LEVELS[tag]['widthDeg'], SIZE).astype(np.float32)
        rel = eye.astype(np.float32) - d
        sine = (np.einsum('ijk,ijk->ij', rel, d) / np.linalg.norm(rel, axis=-1)).astype(np.float32)
        az = np.arctan2(d @ right.astype(np.float32), d @ fwd.astype(np.float32)).astype(np.float32)
        del d, rel
        x = ((az / np.radians(CLEAR['azDeg']) * 0.5 + 0.5) * w - 0.5).astype(np.float32)
        y = ((sine - S0) / (S1 - S0) * h - 0.5).astype(np.float32)
        got = cv2.remap(held, x, y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        value = lambda a: lay.to_value(a) * 255
        plate = together(film, kind, tag)
        target = value(together(far, kind, tag))
        sel = cv2.imread(str(mask), cv2.IMREAD_GRAYSCALE) > 127
        before = np.abs(target - value(plate)).mean(2)
        after = np.abs(target - value(plate * np.exp2(got))).mean(2)
        print(kind, tag, 'far deck share', round(float(sel.mean()), 4), 'mean difference of 255 there: the film against the far deck plate', round(float(before[sel].mean()), 2), 'the film times the map against it', round(float(after[sel].mean()), 2), 'elsewhere', round(float(before[~sel].mean()), 3), 'and', round(float(after[~sel].mean()), 3))


if __name__ == '__main__':
    kind, far, masks = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    to = ([Path(a[3:]) for a in sys.argv[4:] if a.startswith('to=')] + [lay.ROOT / 'public/assets/venus'])[0]
    make(kind, far, masks, to)
    if 'check' in sys.argv[4:]:
        check(kind, far, masks, to)
