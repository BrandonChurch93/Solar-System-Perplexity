"""The plates of the place made from the surface view's own ground, where the two meet (plan F).

Below ground.heights[1] of plates.json the globe side draws the ground of the surface view over the plates, by the height of
the camera. Whatever the plates hold there and the ground does not is seen as one picture of the place giving way to another.
So the plates under the ground are made from the ground itself: the close side, drawn from the film's own camera at the height
where the ground has half its weight (fcam.ts), is laid back through that camera onto the grid of every level, as tlay.py does
at T, and replaces the plate where that camera looks at the ground steeply enough and the ground of the surface view lies
(its layers, less ground.lay.margin at their sides and their lower edge). Over the rest of the ground in that frame the plate
keeps its forms and takes the tones of the draw. Tones go through the globe's own shading as in tlay.py: the globe side drawn
from the same camera with the ground off says how a plate value shows.

It starts from the plates of the film as they are (the files of the full set, put together for the levels that hold their
light alone) and writes the same files again.

python3 assets-src/venus/place/flay.py calib KIND          the shift between the globe's draw laid back and the plate it shows
python3 assets-src/venus/place/flay.py make KIND [TAG ...]  out/work/venus/place/f/<kind>-<tag>.png and the sheet f/<kind>-<tag>.jpg
python3 assets-src/venus/place/flay.py export KIND          public/assets/venus/{full,web}/place3-<tag>[-light]-<kind>.jpg, all levels, widest first
python3 assets-src/venus/place/flay.py differ KIND [SUFFIX] the globe draw f/globe-<kind><suffix>.png against the close draw, in the frame, of 255
"""
import json
import sys

import cv2
import numpy as np

import lay
import tlay

ROOT = lay.ROOT
SPEC = lay.SPEC
WORK = lay.WORK
F = WORK / 'f'
AT = SPEC['atT']
G = SPEC['ground']['lay']
SIZE = SPEC['size']
LEVELS = tlay.LEVELS
ORDER = [l['tag'] for l in SPEC['levels']]
RELIEF = json.loads((ROOT / 'src/stops/venus/relief.json').read_text())
APRONS = json.loads((ROOT / 'src/stops/venus/aprons.json').read_text())


def camera(kind):
    cam = json.loads((WORK / 'fcam.json').read_text())[kind]
    n, e, u = lay.frame(lay.centre_dir())
    se, sn = np.radians(AT['shiftDeg'][kind])
    cam['position'] = (np.array(cam['position']) + e * se + u * sn).tolist()
    return cam


def current(kind, tag, folder='full'):
    """The plate of a level as the film shows it at that handover, display values 0 to 1."""
    level = LEVELS[tag]
    path = ROOT / 'public/assets/venus' / folder / level['file'].replace('.jpg', f'-{kind}.jpg')
    if 'colour' not in level:
        return tlay.read(path)
    giver = ROOT / 'public/assets/venus' / folder / LEVELS[level['colour']]['file'].replace('.jpg', f'-{kind}.jpg')
    light = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    parent = cv2.imread(str(giver), cv2.IMREAD_COLOR)
    return lay.to_value(lay.put_together(light, parent, lay.colour_share(SPEC['levels'], tag), level['most']))


def footprint(tag):
    """Where the ground of the surface view lies, on the grid of a level: 1 well inside its layers, 0 outside. The layers are
    boxes of the close image's camera (relief.json, aprons.json); a ground point is taken as the point of the layer that camera
    sees it through, which is right to within the height of the relief, and the margin is larger than that."""
    n, e, u = lay.frame(lay.centre_dir())
    d = lay.grid(n, e, u, LEVELS[tag]['widthDeg'], SIZE)
    fx, fy, front, seen = lay.project(d)
    w, h = RELIEF['imageSize']['full']
    inside = np.full(fx.shape, -1.0)
    for box in [l['box'] for l in RELIEF['layers'].values() if not l['alpha']] + [l['box'] for l in APRONS['layers'].values()]:
        x0, y0, bw, bh = box
        a = np.minimum(np.minimum(fx * w - x0, x0 + bw - fx * w), np.minimum(fy * h - y0, y0 + bh * (1 - SPEC['ground']['foot']['share']) - fy * h)) / h
        inside = np.maximum(inside, a)
    return (lay.smooth(0.0, G['margin'], inside) * (front & (seen > 0))).astype(np.float32)


def weights(cam, tag):
    fx, fy, ok, elevation = tlay.project(cam, tag)
    inside = np.minimum(np.minimum(fx, 1 - fx) * 16 / 9, np.minimum(fy, 1 - fy))
    edge = lay.smooth(0.0, G['edge'], inside) * ok * footprint(tag)
    cover = edge * lay.smooth(G['coverSinElevation'][0], G['coverSinElevation'][1], elevation)
    trust = edge * lay.smooth(G['trustSinElevation'][0], G['trustSinElevation'][1], elevation)
    trust = lay.smooth(0.5, 0.95, cv2.GaussianBlur(trust.astype(np.float32), (0, 0), G['soft'] * SIZE))
    return fx, fy, cover.astype(np.float32), trust.astype(np.float32)


def draws(kind, suffix=''):
    return tlay.read(F / f'close-{kind}.png'), tlay.read(F / f'globe-{kind}{suffix}.png')


def make(kind, tag):
    cam = camera(kind)
    fx, fy, cover, trust = weights(cam, tag)
    close, globe = draws(kind)
    c = tlay.laid(close, fx, fy)
    g = tlay.laid(globe, fx, fy)
    old = current(kind, tag)
    sigma = AT['toneSigma'][tag] * SIZE
    lc, m = tlay.low(c, cover, sigma)
    lg, _ = tlay.low(g, cover, sigma)
    lo, _ = tlay.low(old, cover, sigma)
    known = lay.smooth(0.02, 0.2, m)[..., None]
    shows = 1 + known * (tlay.ratio(lo, lg) - 1)
    tones = 1 + (cover[..., None] * known) * (tlay.ratio(lc, lg) - 1)
    out = old * tones * (1 - trust[..., None]) + c * shows * trust[..., None]
    F.mkdir(parents=True, exist_ok=True)
    tlay.write(F / f'{kind}-{tag}.png', out)
    s = 1024
    small = lambda a: cv2.resize(a, (s, s), interpolation=cv2.INTER_AREA)
    tlay.write(F / f'{kind}-{tag}.jpg', np.hstack([small(old), small(out), np.repeat(small(trust)[..., None], 3, 2)]))
    print(kind, tag, 'share of the plate in the frame and on the ground', round(float((cover > 0.5).mean()), 4), 'share replaced by the draw', round(float((trust > 0.5).mean()), 4),
          'mean change of the plate, of 255', round(float(np.abs(out - old).mean() * 255), 2), 'inside the replaced part', round(float((np.abs(out - old).mean(2) * trust).sum() / max(trust.sum(), 1) * 255), 2))


def calib(kind, tag='d'):
    """The globe's own draw laid back against the plate it shows, by blocks of the part the camera looks at steeply."""
    per = LEVELS[tag]['widthDeg'] / SIZE
    cam = camera(kind)
    fx, fy, ok, elevation = tlay.project(cam, tag)
    inside = np.minimum(np.minimum(fx, 1 - fx) * 16 / 9, np.minimum(fy, 1 - fy))
    trust = lay.smooth(0.0, G['edge'], inside) * ok * lay.smooth(G['trustSinElevation'][0], G['trustSinElevation'][1], elevation)
    g = cv2.cvtColor(tlay.laid(draws(kind)[1], fx, fy), cv2.COLOR_BGR2GRAY)
    o = cv2.cvtColor(current(kind, tag), cv2.COLOR_BGR2GRAY)
    g -= cv2.GaussianBlur(g, (0, 0), 12)
    o -= cv2.GaussianBlur(o, (0, 0), 12)
    b = 512
    win = cv2.createHanningWindow((b, b), cv2.CV_64F)
    found = []
    for y in range(0, SIZE, b):
        for x in range(0, SIZE, b):
            if trust[y:y + b, x:x + b].mean() < 0.9:
                continue
            (dx, dy), r = cv2.phaseCorrelate(g[y:y + b, x:x + b].astype(np.float64), o[y:y + b, x:x + b].astype(np.float64), win)
            if r > 0.3:
                found.append((dx, dy))
    found = np.array(found)
    if len(found) == 0:
        print(kind, tag, 'no block found')
        return
    med = np.median(found, axis=0)
    print(kind, tag, 'blocks', len(found), 'with shiftDeg', AT['shiftDeg'][kind], 'plate against laid back globe, plate pixels', med.round(2), 'spread', found.std(axis=0).round(2),
          'as degrees east and north', [round(float(med[0] * per), 6), round(float(-med[1] * per), 6)])


def export(kind):
    """All levels, widest first: a level that holds its light alone is written against the new file of its colour level."""
    made = {}
    for tag in ORDER:
        p = F / f'{kind}-{tag}.png'
        made[tag] = cv2.imread(str(p), cv2.IMREAD_COLOR) if p.exists() else None
    # A level that was not made again keeps the picture it shows now, also when the file of its colour level changes.
    for tag in ORDER:
        if made[tag] is None:
            made[tag] = np.clip(current(kind, tag) * 255 + 0.5, 0, 255).astype(np.uint8)
    for tag in ORDER:
        level = LEVELS[tag]
        name = level['file'].replace('.jpg', f'-{kind}.jpg')
        for folder, size in (('full', SIZE), ('web', SIZE // 2)):
            out = made[tag] if size == SIZE else cv2.resize(made[tag], (size, size), interpolation=cv2.INTER_AREA)
            colour = None
            if 'colour' in level:
                giver = ROOT / 'public/assets/venus' / folder / LEVELS[level['colour']]['file'].replace('.jpg', f'-{kind}.jpg')
                colour = (cv2.imread(str(giver), cv2.IMREAD_COLOR), lay.colour_share(SPEC['levels'], tag), level['most'])
            lay.write_plate(ROOT / 'public/assets/venus' / folder / name, out, colour)
        print('exported', name, 'light alone' if 'colour' in level else 'with its colour')


def differ(kind, suffix=''):
    close, globe = draws(kind, suffix)
    e = np.abs(close - globe).max(2) * 255
    h = e.shape[0]
    print(kind, 'globe draw' + suffix, 'against the close draw, of 255: whole frame mean', round(float(e.mean()), 2), '99 percent within', round(float(np.percentile(e, 99)), 1),
          '; lower half mean', round(float(e[h // 2:].mean()), 2), '; lowest quarter mean', round(float(e[3 * h // 4:].mean()), 2))
    tlay.write(F / f'differ-{kind}{suffix}.jpg', cv2.resize(np.hstack([close, globe, np.repeat(np.clip(e / 255 * 4, 0, 1)[..., None], 3, 2)]), None, fx=0.25, fy=0.25, interpolation=cv2.INTER_AREA))


if __name__ == '__main__':
    cmd, kind = sys.argv[1], sys.argv[2]
    rest = sys.argv[3:]
    if cmd == 'calib':
        calib(kind)
    elif cmd == 'make':
        for tag in rest or ORDER:
            make(kind, tag)
    elif cmd == 'export':
        export(kind)
    elif cmd == 'differ':
        differ(kind, rest[0] if rest else '')
