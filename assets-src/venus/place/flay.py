"""The tones of the plates of the place under and beside the ground of the surface view (plan F, step 3).

Below ground.heights[1] of plates.json the globe side draws the ground of the surface view itself over the plates, where its
picture is fine enough for the frame (relief.ts). The plates under it hold the same picture laid flat, but they show in the
globe's light and the ground shows in the light of the place: where the two meet there is a step of tone, and where the ground
comes in a tone comes in with it. So the plates take the tones of the ground.

At a few heights of the handover (ground.lay.heights, radii over the cloud tops) the globe side is drawn still from the
film's own camera (fcam.ts, shutter closed, no grain), with the ground (a) and without it (b), and both again in the layers
view (la, lb): the ground is drawn where those two differ. All are laid back through that camera onto the grid of every
level. Where the ground is drawn, the broad tone of a over the broad tone of b says by how much the plate must change to show
as the ground does. That ratio is carried past the border of the ground and fades out over ground.lay.reachDeg. The forms of
the plates stay as they are: only their broad tone changes.

It starts from the plates of the film as they are (the files of the full set, put together for the levels that hold their
light alone) and writes the same files again. A second run with a new draw b (SUFFIX) measures what is left and goes on from
the plates of the first run.

npx tsx assets-src/venus/place/fcam.ts --json out/work/venus/place/f/cam-<height>.json --height <height>
  the draws: out/work/venus/place/f/<kind>-<height>-{a,b,la,lb}.png (diag nograin/side=orbit/t=<time> and layers/side=orbit/t=<time>)
python3 assets-src/venus/place/flay.py calib KIND HEIGHT    the shift between the globe's draw b laid back and the plate it shows
python3 assets-src/venus/place/flay.py tones KIND [SUFFIX]  out/work/venus/place/f/<kind>-<tag>.png and the sheet f/<kind>-<tag>.jpg
python3 assets-src/venus/place/flay.py export KIND          public/assets/venus/{full,web}/place3-<tag>[-light]-<kind>.jpg, all levels, widest first
python3 assets-src/venus/place/flay.py differ KIND [SUFFIX] broad tone of draw b<suffix> against draw a where the ground is drawn, in the frame, of 255
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


def name(height):
    return f'{height:g}'


def camera(kind, height):
    cam = json.loads((F / f'cam-{name(height)}.json').read_text())[kind]
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


def working(kind, tag):
    """The plate this tool goes on from: its own last result, or the plate of the film."""
    p = F / f'{kind}-{tag}.png'
    return tlay.read(p) if p.exists() else current(kind, tag)


def project(cam, tag, size):
    """As tlay.project, on a grid of any size."""
    n, e, u = lay.frame(lay.centre_dir())
    d = lay.grid(n, e, u, LEVELS[tag]['widthDeg'], size)
    pos = np.array(cam['position'])
    rel = d - pos
    cz = rel @ np.array(cam['z'])
    depth = np.maximum(-cz, 1e-9)
    th = np.tan(np.radians(cam['vfovDeg']) / 2)
    fx = (0.5 + (rel @ np.array(cam['x'])) / depth / (2 * th * 16 / 9)).astype(np.float32)
    fy = (0.5 - (rel @ np.array(cam['y'])) / depth / (2 * th)).astype(np.float32)
    seen = (d @ pos) - 1.0
    elevation = (seen / np.maximum(np.linalg.norm(rel, axis=-1), 1e-9)).astype(np.float32)
    return fx, fy, (cz < 0) & (seen > 0), elevation


def laid(img, fx, fy):
    h, w = img.shape[:2]
    return cv2.remap(img, fx * w - 0.5, fy * h - 0.5, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def draws(kind, height, suffix=''):
    """Draw a, draw b and where the ground is drawn (1 well inside it, 0 outside), in the frame."""
    h = name(height)
    a = tlay.read(F / f'{kind}-{h}-a.png')
    b = tlay.read(F / f'{kind}-{h}-b{suffix}.png')
    la = tlay.read(F / f'{kind}-{h}-la.png')
    lb = tlay.read(F / f'{kind}-{h}-lb.png')
    drawn = (np.abs(la - lb).max(2) > G['differs']).astype(np.float32)
    soft = cv2.GaussianBlur(drawn, (0, 0), G['insidePx'] * a.shape[0] / 1080)
    return a, b, lay.smooth(0.6, 0.95, soft).astype(np.float32)


def ratio(a, b):
    lo, hi = G['ratio']
    return np.clip((a + AT['floor']) / (b + AT['floor']), lo, hi)


def field(kind, tag, suffix=''):
    """The ratio by which the plate of a level changes and the share of it that is applied, on a grid of ground.lay.grid."""
    size = G['grid']
    per = size / LEVELS[tag]['widthDeg']
    sigma = G['sigmaDeg'] * per
    reach = G['reachDeg'] / 2 * per
    num = np.zeros((size, size, 3), np.float64)
    den = np.zeros((size, size), np.float64)
    wide = np.zeros((size, size, 3), np.float64)
    wden = np.zeros((size, size), np.float64)
    near = np.zeros((size, size), np.float32)
    for height in G['heights']:
        cam = camera(kind, height)
        a, b, ground = draws(kind, height, suffix)
        fx, fy, ok, elevation = project(cam, tag, size)
        inside = np.minimum(np.minimum(fx, 1 - fx) * 16 / 9, np.minimum(fy, 1 - fy))
        cover = lay.smooth(0.0, G['edge'], inside) * ok * lay.smooth(G['coverSinElevation'][0], G['coverSinElevation'][1], elevation)
        m = (laid(ground, fx, fy) * cover).astype(np.float32)
        la, w = tlay.low(laid(a, fx, fy), m, sigma)
        lb, _ = tlay.low(laid(b, fx, fy), m, sigma)
        num += w[..., None] * np.log(ratio(la, lb))
        den += w
        la, w2 = tlay.low(laid(a, fx, fy), m, reach)
        lb, _ = tlay.low(laid(b, fx, fy), m, reach)
        wide += w2[..., None] * np.log(ratio(la, lb))
        wden += w2
        near = np.maximum(near, w2)
    fine = num / np.maximum(den, 1e-6)[..., None]
    broad = wide / np.maximum(wden, 1e-6)[..., None]
    known = lay.smooth(0.02, 0.2, den)[..., None]
    r = np.exp(broad + known * (fine - broad)).astype(np.float32)
    share = lay.smooth(G['fade'][0], G['fade'][1], near).astype(np.float32)
    return r, share


def tones(kind, tag, suffix=''):
    r, share = field(kind, tag, suffix)
    up = lambda x: cv2.resize(x, (SIZE, SIZE), interpolation=cv2.INTER_CUBIC)
    r, share = up(r), np.clip(up(share), 0, 1)[..., None]
    old = working(kind, tag)
    out = old * (1 + share * (r - 1))
    F.mkdir(parents=True, exist_ok=True)
    tlay.write(F / f'{kind}-{tag}.png', out)
    s = 1024
    small = lambda x: cv2.resize(x, (s, s), interpolation=cv2.INTER_AREA)
    tlay.write(F / f'{kind}-{tag}.jpg', np.hstack([small(old), small(out), np.repeat(small(share[..., 0])[..., None], 3, 2)]))
    inside = share[..., 0] > 0.5
    print(kind, tag, 'share of the plate that changes', round(float((share > 0.02).mean()), 4), 'mean change there, of 255', round(float(np.abs(out - old)[share[..., 0] > 0.02].mean() * 255), 2) if (share > 0.02).any() else 0,
          'ratio inside (blue green red) median', np.median(r[inside], axis=0).round(3) if inside.any() else 'none', 'least', r[inside].min(axis=0).round(3) if inside.any() else 'none', 'most', r[inside].max(axis=0).round(3) if inside.any() else 'none')


def calib(kind, height, tag='c'):
    """The globe's own draw laid back against the plate it shows, by blocks of the part the camera looks at steeply."""
    per = LEVELS[tag]['widthDeg'] / SIZE
    cam = camera(kind, height)
    fx, fy, ok, elevation = project(cam, tag, SIZE)
    inside = np.minimum(np.minimum(fx, 1 - fx) * 16 / 9, np.minimum(fy, 1 - fy))
    trust = lay.smooth(0.0, G['edge'], inside) * ok * lay.smooth(AT['trustSinElevation'][0], AT['trustSinElevation'][1], elevation)
    b = tlay.read(F / f'{kind}-{name(height)}-b.png')
    g = cv2.cvtColor(laid(b, fx, fy), cv2.COLOR_BGR2GRAY)
    o = cv2.cvtColor(current(kind, tag), cv2.COLOR_BGR2GRAY)
    g = cv2.GaussianBlur(g, (0, 0), 6) - cv2.GaussianBlur(g, (0, 0), 24)
    o = cv2.GaussianBlur(o, (0, 0), 6) - cv2.GaussianBlur(o, (0, 0), 24)
    block = 512
    win = cv2.createHanningWindow((block, block), cv2.CV_64F)
    found = []
    for y in range(0, SIZE, block):
        for x in range(0, SIZE, block):
            if trust[y:y + block, x:x + block].mean() < 0.9:
                continue
            (dx, dy), resp = cv2.phaseCorrelate(g[y:y + block, x:x + block].astype(np.float64), o[y:y + block, x:x + block].astype(np.float64), win)
            if resp > 0.2:
                found.append((dx, dy))
    found = np.array(found)
    if len(found) == 0:
        print(kind, height, tag, 'no block found')
        return
    med = np.median(found, axis=0)
    print(kind, height, tag, 'blocks', len(found), 'with shiftDeg', AT['shiftDeg'][kind], 'plate against laid back globe, plate pixels', med.round(2), 'spread', found.std(axis=0).round(2),
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
        file = level['file'].replace('.jpg', f'-{kind}.jpg')
        for folder, size in (('full', SIZE), ('web', SIZE // 2)):
            out = made[tag] if size == SIZE else cv2.resize(made[tag], (size, size), interpolation=cv2.INTER_AREA)
            colour = None
            if 'colour' in level:
                giver = ROOT / 'public/assets/venus' / folder / LEVELS[level['colour']]['file'].replace('.jpg', f'-{kind}.jpg')
                colour = (cv2.imread(str(giver), cv2.IMREAD_COLOR), lay.colour_share(SPEC['levels'], tag), level['most'])
            lay.write_plate(ROOT / 'public/assets/venus' / folder / file, out, colour)
        print('exported', file, 'light alone' if 'colour' in level else 'with its colour')


def differ(kind, suffix=''):
    """What is left: the broad tone of the globe side without the ground against the ground, where the ground is drawn."""
    rows = []
    for height in G['heights']:
        a, b, ground = draws(kind, height, suffix)
        sigma = G['differPx'] * a.shape[0] / 1080
        la, w = tlay.low(a, ground, sigma)
        lb, _ = tlay.low(b, ground, sigma)
        e = np.abs(la - lb).max(2) * 255
        inside = ground > 0.5
        print(kind, 'height', height, 'draw b' + suffix, 'broad tone against draw a where the ground is drawn, of 255: mean', round(float(e[inside].mean()), 2), '95 percent within', round(float(np.percentile(e[inside], 95)), 1),
              'most', round(float(e[inside].max()), 1), '; share of the frame with the ground', round(float(inside.mean()), 3))
        rows.append(np.hstack([a, b, np.repeat(ground[..., None], 3, 2)]))
    tlay.write(F / f'differ-{kind}{suffix}.jpg', cv2.resize(np.vstack(rows), None, fx=0.34, fy=0.34, interpolation=cv2.INTER_AREA))


if __name__ == '__main__':
    cmd, kind = sys.argv[1], sys.argv[2]
    rest = sys.argv[3:]
    if cmd == 'calib':
        calib(kind, float(rest[0]))
    elif cmd == 'tones':
        for tag in ORDER:
            tones(kind, tag, rest[0] if rest else '')
    elif cmd == 'export':
        export(kind)
    elif cmd == 'differ':
        differ(kind, rest[0] if rest else '')
