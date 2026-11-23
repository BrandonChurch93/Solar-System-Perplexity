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
python3 assets-src/venus/place/tlay.py tone KIND             public/assets/venus/{full,web}/place-tone-<kind>.bin, the look of the place from above (plates.json, tone)
python3 assets-src/venus/place/tlay.py export KIND [TAG ...]  public/assets/venus/{full,web}/place-<tag>-<kind>.jpg
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


def light(img):
    """The light a plate value stands for: the display value taken back through the film curve (as inverseFilmic of src/post/chain.ts)."""
    v = np.where(img <= 0.04045, img / 12.92, ((img + 0.055) / 1.055) ** 2.4)
    y = np.clip(v, 0.0, 0.985).astype(np.float64)
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    k = d * y - b
    return ((-k - np.sqrt(np.maximum(k * k - 4 * (c * y - a) * e * y, 0))) / (2 * (c * y - a))).astype(np.float32)


def band(y, fine, sigma):
    """The spread of the logarithm of y about every point, counted in the forms smaller than fine."""
    d = y - cv2.GaussianBlur(y, (0, 0), fine)
    return np.sqrt(np.maximum(cv2.GaussianBlur(d * d, (0, 0), sigma), 1e-12))


def tone(kind, plate=None):
    """The look of the place from above, as a power and a factor on the light of the plates (plates.json, tone).
    Returns the map (factor blue, green, red; power), the plate as it then shows and as it is, for a look."""
    tn = SPEC['tone']
    tag = next(t for t, l in LEVELS.items() if abs(l['widthDeg'] - tn['widthDeg']) < 1e-6)
    work = 1024
    floor = tn['floor']
    p = np.log(np.maximum(light(cv2.resize(read(T / f'{kind}-{tag}.png') if plate is None else plate, (work, work), interpolation=cv2.INTER_AREA)), floor))
    g = np.log(np.maximum(light(cv2.resize(read(WORK / f'base-{tag}.png'), (work, work), interpolation=cv2.INTER_AREA)), floor))
    per = work / tn['widthDeg']
    sigma = tn['sigmaDeg'] * per
    luma = np.array([0.0722, 0.7152, 0.2126], np.float32)
    mp = cv2.GaussianBlur(p, (0, 0), sigma)
    mg = cv2.GaussianBlur(g, (0, 0), sigma)
    spread = band(p @ luma, tn['fineDeg'] * per, sigma)
    power = np.clip(tn['contrast'] / spread, tn['power'][0], tn['power'][1])
    power = cv2.GaussianBlur(power, (0, 0), sigma / 2)
    r = (np.arange(work, dtype=np.float32) + 0.5) / work * 2 - 1
    off = lay.smooth(tn['edge'][0], tn['edge'][1], np.maximum(np.abs(r)[:, None], np.abs(r)[None, :]))
    power = 1 + (power - 1) * (1 - off)
    # The power acts on the luminance, and of the colour of the plate only a share is kept (as the globe shader does): a power and a
    # factor per channel turned warm light red beside the pale haze.
    ly = np.log(np.maximum(np.exp(p) @ luma, floor))
    mly = cv2.GaussianBlur(ly, (0, 0), sigma)
    own = (1 - tn['colour'] * (1 - off))[..., None]  # the share of the plate's own colour that is kept
    factor = (mg - (power * mly)[..., None] - own * (mp - mly[..., None])) * (1 - off)[..., None]  # its logarithm
    top = np.exp(factor + (power * ly)[..., None] + own * (p - ly[..., None]))
    size = tn['size']
    m = np.dstack([np.exp(cv2.resize(factor, (size, size), interpolation=cv2.INTER_AREA))[..., ::-1], cv2.resize(power, (size, size), interpolation=cv2.INTER_AREA)]).astype(np.float32)
    return m, top, np.exp(p), spread


def film(x):
    """Light to display value (filmic of src/post/chain.ts, then the sRGB curve), for a look at a tone map."""
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    v = np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)
    return np.where(v <= 0.0031308, v * 12.92, 1.055 * v ** (1 / 2.4) - 0.055)


def tone_out(kind):
    m, top, p, _ = tone(kind)
    for folder in ('full', 'web'):
        np.ascontiguousarray(m[::-1]).tofile(str(ROOT / 'public/assets/venus' / folder / SPEC['tone']['files'][kind]))  # rows from south to north
    write(T / f'tone-{kind}-view.jpg', np.hstack([film(p), film(top)]))
    print(kind, 'tone map', m.shape, 'power', round(float(m[..., 3].min()), 3), 'to', round(float(m[..., 3].max()), 3), 'factor', round(float(m[..., :3].min()), 4), 'to', round(float(m[..., :3].max()), 3))


def export(kind, tag):
    q = [cv2.IMWRITE_JPEG_QUALITY, 92, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444]
    img = cv2.imread(str(T / f'{kind}-{tag}.png'), cv2.IMREAD_COLOR)
    name = LEVELS[tag]['file'].replace('.jpg', f'-{kind}.jpg')
    for folder, size in (('full', SIZE), ('web', SIZE // 2)):
        out = img if size == SIZE else cv2.resize(img, (size, size), interpolation=cv2.INTER_AREA)
        cv2.imwrite(str(ROOT / 'public/assets/venus' / folder / name), out, q)
    print('exported', name)


if __name__ == '__main__':
    cmd, kind = sys.argv[1], sys.argv[2]
    rest = sys.argv[3:]
    if cmd == 'tone':
        tone_out(kind)
        raise SystemExit(0)
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
