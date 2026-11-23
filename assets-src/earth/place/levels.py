import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geom as g
import ring
from layback import WORK, centre

Image.MAX_IMAGE_PIXELS = None
PUBLIC = g.ROOT / 'public/assets/earth'
HOLD = WORK / 'hold'
PLATES = g.PLACE['plates']
SPOT = g.G.T @ g.SPOT
P = centre()
SIGMA = PLATES['toneSigmaDeg']
FEATHER = PLATES['feather']
KEPT = PLATES['holdCommit']
MEND = json.loads((Path(__file__).resolve().parent / 'mend.json').read_text())


def hold_level(deg):
    HOLD.mkdir(parents=True, exist_ok=True)
    path = HOLD / ('patch-%d.jpg' % deg)
    if not path.exists():
        path.write_bytes(subprocess.run(['git', 'show', '%s:public/assets/earth/full/patch-%d.jpg' % (KEPT, deg)], cwd=g.ROOT, check=True, capture_output=True).stdout)
    return cv2.imread(str(path)).astype(np.float32)


def reproject(src, src_c, src_deg, dst_c, dst_deg, size, chunk=512, signed=False):
    ns = src.shape[0]
    r = (ns / src_deg) / (size / dst_deg)
    if r > 1.5:
        m = int(round(ns / r))
        src = cv2.resize(src, (m, m), interpolation=cv2.INTER_AREA)
        ns = m
    n, e, u = g.frame_at(dst_c)
    half = np.tan(np.radians(dst_deg) / 2)
    t = ((np.arange(size) + 0.5) / size - 0.5) * 2 * half
    out = np.zeros((size, size) + src.shape[2:], np.float32)
    ok = np.zeros((size, size), bool)
    for y0 in range(0, size, chunk):
        y1 = min(y0 + chunk, size)
        d = n + t[None, :, None] * e - t[y0:y1, None, None] * u
        x, y = g.plate_xy(src_c, src_deg, d)
        front = (d @ g.unit(src_c)) > 0
        out[y0:y1] = cv2.remap(src, (x * ns - 0.5).astype(np.float32), (y * ns - 0.5).astype(np.float32), cv2.INTER_LINEAR if signed else cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
        ok[y0:y1] = front & (x > 0) & (x < 1) & (y > 0) & (y < 1)
    return out, ok


def step(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def footprint(dst_c, dst_deg, size, src_c, src_deg, chunk=512):
    n, e, u = g.frame_at(dst_c)
    half = np.tan(np.radians(dst_deg) / 2)
    t = ((np.arange(size) + 0.5) / size - 0.5) * 2 * half
    w = np.zeros((size, size), np.float32)
    for y0 in range(0, size, chunk):
        y1 = min(y0 + chunk, size)
        d = n + t[None, :, None] * e - t[y0:y1, None, None] * u
        x, y = g.plate_xy(src_c, src_deg, d)
        q = np.maximum(np.abs(x - 0.5), np.abs(y - 0.5))
        w[y0:y1] = step(0.5, 0.5 - FEATHER, q) * ((d @ g.unit(src_c)) > 0)
    return w


def low(img, per_deg):
    return cv2.GaussianBlur(img, (0, 0), SIGMA * per_deg)


def save(path, img):
    im = Image.fromarray(cv2.cvtColor(np.clip(img + 0.5, 0, 255).astype(np.uint8), cv2.COLOR_BGR2RGB))
    im.save(PUBLIC / 'full' / path, quality=94, subsampling=0)
    im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(PUBLIC / 'web' / path, quality=94, subsampling=0)


def cast(comp, deg, spec):
    from farin import CANVAS, reach
    from layback import layback
    n = comp.shape[0]
    lay, _, inside = layback(cv2.imread(str(CANVAS)), 1, deg, n)
    cover = step(0.5, 1.0, cv2.GaussianBlur((inside > 0.99).astype(np.float32), (0, 0), spec['edgeDeg'] * n / deg))
    dist = reach(P, deg, n)
    pick = (cover > 0.9) & (dist >= spec['measureDeg'][0]) & (dist < spec['measureDeg'][1])

    def bright(img):
        v = img[pick]
        lum = v.mean(axis=1)
        lo, hi = np.percentile(lum, spec['bright'])
        return v[(lum >= lo) & (lum <= hi)].mean(axis=0)

    lay = lay.astype(np.float32)
    mean = (bright(lay) / bright(comp)).astype(np.float32)
    both = (cover * step(spec['cloud'][0], spec['cloud'][1], lay.min(axis=2)) * step(spec['cloud'][0], spec['cloud'][1], comp.min(axis=2)))[..., None]
    s = spec['wideDeg'] * n / deg
    share = cv2.GaussianBlur(both, (0, 0), s)
    local = cv2.GaussianBlur(lay * both, (0, 0), s) / np.maximum(cv2.GaussianBlur(comp * both, (0, 0), s), 1e-3)
    trust = step(spec['share'][0], spec['share'][1], share)[..., None]
    gain = np.clip(mean * (1 - trust) + local * trust, spec['limit'][0], spec['limit'][1]).astype(np.float32)
    return gain, mean, cover * step(spec['fromDeg'][0], spec['fromDeg'][1], dist)


def graded(hold, gain):
    cloud = np.clip((hold.min(axis=2, keepdims=True) - 150) / 60, 0, 1)
    return hold * gain * (1 - cloud) + hold * cloud


def open_sea(img, spec):
    cloud = np.clip((img.min(axis=2, keepdims=True) - 150) / 60, 0, 1)
    return (1 - cloud) * step(spec['blue'][0], spec['blue'][1], img[..., 0:1] - img[..., 2:3])


def main():
    deg = PLATES['levels'][0]['widthDeg']
    g12 = cv2.imread(str(WORK / (sys.argv[1] if len(sys.argv) > 1 else 'q12-g.png'))).astype(np.float32)
    size = PLATES['size']
    if g12.shape[0] != size:
        g12 = cv2.resize(g12, (size, size), interpolation=cv2.INTER_LANCZOS4)
    spec = ring.SPEC
    sheet = np.minimum(cv2.imread(str(WORK / spec['take'])).astype(np.float32) * np.array(spec['tint'], np.float32), 255)
    small = cv2.resize(sheet, (2048, 2048), interpolation=cv2.INTER_AREA)
    under, _ = reproject(hold_level(48), SPOT, 48, P, spec['widthDeg'], 2048)
    reach = ring.mask(small, under)
    print('ring share of its', spec['widthDeg'], 'degrees', round(float(reach.mean()), 4), flush=True)
    cs = MEND['cast']
    k = cs['size']
    m = cv2.resize(reach, (k, k), interpolation=cv2.INTER_AREA)[..., None]
    comp = cv2.resize(under, (k, k), interpolation=cv2.INTER_AREA) * (1 - m) + cv2.resize(small, (k, k), interpolation=cv2.INTER_AREA) * m
    del small, under
    inner, _ = reproject(g12, P, deg, P, spec['widthDeg'], k)
    w = footprint(P, spec['widthDeg'], k, P, deg)[..., None]
    comp = comp * (1 - w) + inner * w
    gain, mean, zone = cast(comp, spec['widthDeg'], cs)
    cv2.imwrite(str(WORK / 'cast-look.jpg'), np.hstack([np.clip(v, 0, 255).astype(np.uint8) for v in (comp, comp * (1 + (gain - 1) * (zone[..., None] + (1 - zone[..., None]) * m)))]), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print('cast, gain of the far zone and the deck (BGR): mean', np.round(mean, 3), 'local from', np.round(gain.reshape(-1, 3).min(axis=0), 3), 'to', np.round(gain.reshape(-1, 3).max(axis=0), 3), flush=True)
    own, _ = reproject(zone, P, spec['widthDeg'], P, deg, size, signed=True)
    part, _ = reproject(gain, P, spec['widthDeg'], P, deg, size, signed=True)
    g12 = g12 * (1 + (part - 1) * np.clip(own, 0, 1)[..., None])
    del own, part, comp, inner
    save(PLATES['levels'][0]['file'], g12)
    print('plate', deg, 'done', flush=True)
    for parent in (24, 48, 96):
        hold = hold_level(parent)
        n = hold.shape[0]
        far, ok = reproject(sheet, P, spec['widthDeg'], SPOT, parent, n)
        m, _ = reproject(reach, P, spec['widthDeg'], SPOT, parent, n, signed=True)
        m = (np.clip(m, 0, 1) * ok)[..., None]
        hold = hold * (1 - m) + far * m
        del far
        z, _ = reproject(zone, P, spec['widthDeg'], SPOT, parent, n, signed=True)
        z = (np.clip(z, 0, 1) * ok)[..., None]
        part, _ = reproject(gain, P, spec['widthDeg'], SPOT, parent, n, signed=True)
        hold = hold * (1 + (part - 1) * (z + (1 - z) * m))
        del z, m, part
        inner, _ = reproject(g12, P, deg, SPOT, parent, n)
        w = footprint(SPOT, parent, n, P, deg)[..., None]
        save('patch-%d.jpg' % parent, hold * (1 - w) + inner * w)
        print('level', parent, 'done, footprint share', round(float(w.mean()), 4), flush=True)
    tone = PLATES['tone']
    wide, n = tone['widthDeg'], tone['size']
    h48, ok = reproject(hold_level(48), SPOT, 48, P, wide, n)
    gain = np.array(PLATES['seaGain'], np.float32)
    d = low(graded(h48, gain) - h48, n / wide)
    own = MEND['tone']
    per = n / wide
    k = int(round(deg * own['perDeg']))
    plate, _ = reproject(cv2.resize(g12, (k, k), interpolation=cv2.INTER_AREA), P, deg, P, wide, n)
    w = footprint(P, wide, n, P, deg)[..., None]
    sea = w * open_sea(plate, own) * open_sea(h48, own)
    share = low(sea, per)[..., None]
    diff = low((plate - h48) * sea, per) / np.maximum(share, 1e-4)
    trust = low(w, per)[..., None] * step(own['share'][0], own['share'][1], share)
    d = d * (1 - trust) + diff * trust
    cv2.imwrite(str(WORK / 'tone-own.jpg'), np.hstack([np.clip(v, 0, 255).astype(np.uint8) for v in (h48, plate * w + h48 * (1 - w), (plate - diff) * w + h48 * (1 - w), np.repeat(trust * 255, 3, axis=2))]), [cv2.IMWRITE_JPEG_QUALITY, 90])
    t = np.abs((np.arange(n) + 0.5) / n - 0.5)
    edge = step(0.5, 0.5 - tone['edge'], np.maximum.outer(t, t))[..., None] * ok[..., None]
    d = d * edge
    rgba = np.concatenate([d[..., ::-1] / 255, edge], axis=2)[::-1].astype(np.float16)
    for s in ('full', 'web'):
        (PUBLIC / s / tone['file']).write_bytes(rgba.tobytes())
    np.save(WORK / 'tone.npy', d)
    look = np.clip(128 + d, 0, 255).astype(np.uint8)
    cv2.imwrite(str(WORK / 'tone-look.png'), look)
    print('tone', wide, 'degrees', n, 'px, range', round(float(d.min()), 1), round(float(d.max()), 1), flush=True)


if __name__ == '__main__':
    main()
