"""The plates of the place as the close side shows it at the T of a handover (dive or rise).

The plates of build.py hold the close image laid back from the twin of the judged frame. At T the close side stands
elsewhere and its layers have shifted, so the globe under the place picture is not the picture. Here the close side
itself, drawn at T (tools still, side forced, shutter closed, no grain), is laid back through the film's own globe
camera at T (tcam.ts) onto the grid of every level, and the plates of build.py are changed with it:

- where the camera at T looks at the ground steeply enough (trust), the laid back picture replaces the plate;
- over the rest of the ground the frame holds (cover), the plate keeps its forms and takes the tones of the picture,
  measured at low frequency in the plate;
- outside the frame the plate stays as it is.

The tones are locked through the globe's own shading: the globe side drawn at T without the place picture, laid back
the same way, says how a plate value shows, and the new plate is set so it shows as the close side. A further pass
(lock) repeats that with a draw of the globe that already carries the new plates.

python3 assets-src/venus/place/tlay.py calib KIND TAG      the shift between the globe's draw laid back and the plate, to write to atT.shiftDeg
python3 assets-src/venus/place/tlay.py check KIND TAG      the globe's draw laid back beside the plate (is the camera right?)
python3 assets-src/venus/place/tlay.py make KIND [TAG ...]  out/work/venus/place/t/<kind>-<tag>.png from the plates of build.py
python3 assets-src/venus/place/tlay.py lock KIND SUFFIX [TAG ...]  the same plates, tones locked again with t/globe-<frame><suffix>.png
python3 assets-src/venus/place/tlay.py export KIND [TAG ...]  public/assets/venus/{full,web}/place3-<tag>-<kind>.jpg, or place3-<tag>-light-<kind>.jpg
                                                              for a level that holds its light alone (plates.json, lightNote)
python3 assets-src/venus/place/tlay.py split KIND [TAG ...]   measures such a level put together with the colour of its parent against its full plate
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

import lay

ROOT = lay.ROOT
SPEC = lay.SPEC
WORK = lay.WORK
T = WORK / 't'
AT = SPEC['atT']
SIZE = SPEC['size']
LEVELS = {l['tag']: l for l in SPEC['levels']}


def camera(kind, shifted=True):
    """The globe camera at T (tcam.ts), moved along the ground by the measured shift of plates.json (atT.shiftDeg):
    the globe draws its plates that far from where this camera alone would put them (see calib)."""
    cam = json.loads((WORK / 'tcam.json').read_text())[kind]
    if shifted:
        n, e, u = lay.frame(lay.centre_dir())
        se, sn = np.radians(AT['shiftDeg'][kind])
        cam['position'] = (np.array(cam['position']) + e * se + u * sn).tolist()
    return cam


def read(path):
    img = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit(f'missing {path}')
    return img.astype(np.float32) / 255


def write(path, img):
    cv2.imwrite(str(path), np.clip(img * 255 + 0.5, 0, 255).astype(np.uint8))


def old_plate(tag):
    return read(WORK / tag / 'plate-4096.png')


def project(cam, tag):
    """Where every pixel of the plate of tag lies in the frame of the camera at T (pixels of a frame w by h are fx * w, fy * h),
    whether it is in front and seen, and the sine of the elevation of the camera over it."""
    n, e, u = lay.frame(lay.centre_dir())
    d = lay.grid(n, e, u, LEVELS[tag]['widthDeg'], SIZE)
    pos = np.array(cam['position'])
    rel = d - pos
    cz = rel @ np.array(cam['z'])
    depth = np.maximum(-cz, 1e-9)
    th = np.tan(np.radians(cam['vfovDeg']) / 2)
    fx = (0.5 + (rel @ np.array(cam['x'])) / depth / (2 * th * 16 / 9)).astype(np.float32)
    fy = (0.5 - (rel @ np.array(cam['y'])) / depth / (2 * th)).astype(np.float32)
    seen = (d @ pos) - 1.0
    elevation = (seen / np.maximum(np.linalg.norm(rel, axis=-1), 1e-9)).astype(np.float32)
    ok = (cz < 0) & (seen > 0)
    return fx, fy, ok, elevation


def laid(img, fx, fy):
    h, w = img.shape[:2]
    return cv2.remap(img, fx * w - 0.5, fy * h - 0.5, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)


def weights(fx, fy, ok, elevation):
    """cover: the ground the frame at T holds. trust: where the laid back picture replaces the plate."""
    inside = np.minimum(np.minimum(fx, 1 - fx) * 16 / 9, np.minimum(fy, 1 - fy))
    edge = lay.smooth(0.0, AT['edge'], inside) * ok
    cover = edge * lay.smooth(AT['coverSinElevation'][0], AT['coverSinElevation'][1], elevation)
    trust = edge * lay.smooth(AT['trustSinElevation'][0], AT['trustSinElevation'][1], elevation)
    trust = lay.smooth(0.5, 0.95, cv2.GaussianBlur(trust.astype(np.float32), (0, 0), AT['soft'] * SIZE))
    return cover.astype(np.float32), trust.astype(np.float32)


def low(img, mask, sigma):
    """Mean of img about every pixel, counted only where mask has weight; and that weight."""
    m = cv2.GaussianBlur(mask, (0, 0), sigma)
    s = cv2.GaussianBlur(img * mask[..., None], (0, 0), sigma)
    return s / np.maximum(m, 1e-4)[..., None], m


def ratio(a, b):
    lo, hi = AT['ratio']
    return np.clip((a + AT['floor']) / (b + AT['floor']), lo, hi)


def frames(kind):
    f = camera(kind)['frame']
    return T / f'close-{f}.png', T / f'globe-{f}'


def make(kind, tag):
    cam = camera(kind)
    close, globe = frames(kind)
    fx, fy, ok, elevation = project(cam, tag)
    cover, trust = weights(fx, fy, ok, elevation)
    c = laid(read(close), fx, fy)
    g = laid(read(str(globe) + '.png'), fx, fy)
    old = old_plate(tag)
    sigma = AT['toneSigma'][tag] * SIZE
    lc, m = low(c, cover, sigma)
    lg, _ = low(g, cover, sigma)
    lo, _ = low(old, cover, sigma)
    known = lay.smooth(0.02, 0.2, m)[..., None]
    shows = 1 + known * (ratio(lo, lg) - 1)  # plate value over what it shows as, smooth
    tones = 1 + (cover[..., None] * known) * (ratio(lc, lg) - 1)  # the plate's forms with the tones of the picture
    out = old * tones * (1 - trust[..., None]) + c * shows * trust[..., None]
    write(T / f'{kind}-{tag}.png', out)
    write(T / f'{kind}-{tag}-cover.png', cover)
    write(T / f'{kind}-{tag}-trust.png', trust)
    print(kind, tag, 'share of the plate in the frame at T', round(float((cover > 0.5).mean()), 4), 'share replaced by the picture', round(float((trust > 0.5).mean()), 4), 'mean change of the plate, of 255', round(float(np.abs(out - old).mean() * 255), 2))


def lock(kind, suffix, tag):
    cam = camera(kind)
    close, globe = frames(kind)
    fx, fy, ok, elevation = project(cam, tag)
    cover, _ = weights(fx, fy, ok, elevation)
    c = laid(read(close), fx, fy)
    g = laid(read(str(globe) + suffix + '.png'), fx, fy)
    cur = read(T / f'{kind}-{tag}.png')
    sigma = AT['toneSigma'][tag] * SIZE
    lc, m = low(c, cover, sigma)
    lg, _ = low(g, cover, sigma)
    known = lay.smooth(0.02, 0.2, m)[..., None]
    out = cur * (1 + (cover[..., None] * known) * (ratio(lc, lg) - 1))
    write(T / f'{kind}-{tag}.png', out)
    print(kind, tag, 'locked again with', globe.name + suffix, 'mean change of the plate, of 255', round(float(np.abs(out - cur).mean() * 255), 2))


def check(kind, tag):
    """The globe's own draw at T laid back, beside the plate: the same forms must lie on the same pixels."""
    cam = camera(kind)
    _, globe = frames(kind)
    fx, fy, ok, elevation = project(cam, tag)
    cover, trust = weights(fx, fy, ok, elevation)
    g = laid(read(str(globe) + '.png'), fx, fy)
    old = old_plate(tag)
    s = 1024
    a = cv2.resize(g, (s, s), interpolation=cv2.INTER_AREA)
    b = cv2.resize(old, (s, s), interpolation=cv2.INTER_AREA)
    m = cv2.resize(trust, (s, s), interpolation=cv2.INTER_AREA)
    # shift between the two, by phase correlation of their fine parts inside the trusted part
    ga = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY)
    gb = cv2.cvtColor(b, cv2.COLOR_BGR2GRAY)
    ha = (ga - cv2.GaussianBlur(ga, (0, 0), 8)) * m
    hb = (gb - cv2.GaussianBlur(gb, (0, 0), 8)) * m
    (dx, dy), resp = cv2.phaseCorrelate(ha.astype(np.float64), hb.astype(np.float64))
    print(kind, tag, 'shift of the laid back globe against the plate, plate pixels of 4096:', round(dx * SIZE / s, 2), round(dy * SIZE / s, 2), 'response', round(resp, 3), 'trusted share', round(float((m > 0.5).mean()), 4))
    edge = (cv2.Canny((m * 255).astype(np.uint8), 50, 150) > 0)
    for im in (a, b):
        im[edge] = (0, 1, 1)
    write(T / f'check-{kind}-{tag}.jpg', np.hstack([a, b]))


def blocks(kind, tag, cam):
    """Shift of the plate against the laid back draw of the globe, in plate pixels, by blocks of the replaced part."""
    _, globe = frames(kind)
    fx, fy, ok, elevation = project(cam, tag)
    _, trust = weights(fx, fy, ok, elevation)
    g = cv2.cvtColor(laid(read(str(globe) + '.png'), fx, fy), cv2.COLOR_BGR2GRAY)
    o = cv2.cvtColor(old_plate(tag), cv2.COLOR_BGR2GRAY)
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
    return np.array(found)


def calib(kind, tag):
    """Measures the shift with the camera of tcam.ts alone and with the shift of plates.json, and prints the value to write there."""
    per = LEVELS[tag]['widthDeg'] / SIZE
    raw = blocks(kind, tag, camera(kind, False))
    med = np.median(raw, axis=0)
    print(kind, tag, 'blocks', len(raw), 'camera alone: plate against laid back globe, plate pixels', med.round(2), 'spread', raw.std(axis=0).round(2), 'as shiftDeg [east, north]', [round(float(med[0] * per), 6), round(float(-med[1] * per), 6)])
    now = blocks(kind, tag, camera(kind))
    print(kind, tag, 'with shiftDeg', AT['shiftDeg'][kind], 'left over, plate pixels', np.median(now, axis=0).round(2), 'spread', now.std(axis=0).round(2))


def export(kind, tag):
    """A level with `colour` in plates.json is written as its light alone (one channel) against the file of its colour level,
    which must have been written before it (the levels are exported widest first); the others with their colour."""
    img = cv2.imread(str(T / f'{kind}-{tag}.png'), cv2.IMREAD_COLOR)
    level = LEVELS[tag]
    name = level['file'].replace('.jpg', f'-{kind}.jpg')
    for folder, size in (('full', SIZE), ('web', SIZE // 2)):
        out = img if size == SIZE else cv2.resize(img, (size, size), interpolation=cv2.INTER_AREA)
        colour = None
        if 'colour' in level:
            giver = ROOT / 'public/assets/venus' / folder / LEVELS[level['colour']]['file'].replace('.jpg', f'-{kind}.jpg')
            colour = (cv2.imread(str(giver), cv2.IMREAD_COLOR), lay.colour_share(SPEC['levels'], tag), level['most'])
        lay.write_plate(ROOT / 'public/assets/venus' / folder / name, out, colour)
    print('exported', name, 'light alone' if 'colour' in level else 'with its colour')


def split(kind, tag):
    """How far the picture put together in the film (the files of the full set: the light of this level times the plate of its
    `colour` level at the same ground point) is from the full plate of this level, in 8 bit display values: at the size of the
    plate and reduced 4 and 16 times (both sides reduced in light, as the film filters them)."""
    level = LEVELS[tag]
    folder = ROOT / 'public/assets/venus/full'
    share = lay.colour_share(SPEC['levels'], tag)
    truth = lay.to_light(read(T / f'{kind}-{tag}.png'))
    light = cv2.imread(str(folder / level['file'].replace('.jpg', f'-{kind}.jpg')), cv2.IMREAD_GRAYSCALE)
    k = lay.under(cv2.imread(str(folder / LEVELS[level['colour']]['file'].replace('.jpg', f'-{kind}.jpg')), cv2.IMREAD_COLOR), share)
    v = light.astype(np.float32) / 255 * level['most']
    print(kind, tag, 'colour from', level['colour'], '1 in', round(1 / share, 2), 'share of texels at the most', round(float((light == 255).mean()), 6))
    for m in (1, 4, 16):
        small = (lambda a: a) if m == 1 else (lambda a: cv2.resize(a, (SIZE // m, SIZE // m), interpolation=cv2.INTER_AREA))
        e = (lay.to_value(small(k) * small(v)[..., None]) - lay.to_value(small(truth))) * 255
        worst = np.abs(e).max(2)
        print('  reduced', m, 'mean', round(float(np.abs(e).mean()), 2), 'signed', round(float(e.mean()), 2), '99 percent within', round(float(np.percentile(worst, 99)), 1), '99.9 percent within', round(float(np.percentile(worst, 99.9)), 1), 'most', round(float(worst.max())))


if __name__ == '__main__':
    cmd, kind = sys.argv[1], sys.argv[2]
    rest = sys.argv[3:]
    if cmd == 'lock':
        suffix, rest = rest[0], rest[1:]
    tags = rest or AT['tags']
    for tag in tags:
        if cmd == 'calib':
            calib(kind, tag)
        elif cmd == 'check':
            check(kind, tag)
        elif cmd == 'make':
            make(kind, tag)
        elif cmd == 'lock':
            lock(kind, suffix, tag)
        elif cmd == 'export':
            export(kind, tag)
        elif cmd == 'split':
            if 'colour' in LEVELS[tag]:
                split(kind, tag)
