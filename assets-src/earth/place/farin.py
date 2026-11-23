import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geom as g
import levels as L
from layback import WORK, centre, layback

NADIR = g.direction(g.GLOBE['lon'], g.GLOBE['lat'])
CANVAS = g.ROOT / 'out/work/earth/relief/canvas-full-1x.png'


def reach(c, deg, size):
    return np.degrees(np.arccos(np.clip(g.plate_dirs(c, deg, size) @ NADIR, -1, 1))).astype(np.float32)


def plate(src, out, from_deg=(5.0, 6.2), edge_deg=0.12):
    deg = L.PLATES['levels'][0]['widthDeg']
    h = cv2.imread(str(WORK / src)).astype(np.float32)
    size = h.shape[0]
    lay = cv2.imread(str(WORK / 'q12-lay.png')).astype(np.float32)
    inside = np.load(WORK / 'q12-inside.npy').astype(np.float32)
    cover = L.step(0.5, 1.0, cv2.GaussianBlur((inside > 0.99).astype(np.float32), (0, 0), edge_deg * size / deg))
    far = (L.step(from_deg[0], from_deg[1], reach(centre(), deg, size)) * cover)[..., None]
    pic = np.clip(h * (1 - far) + lay * far, 0, 255).astype(np.uint8)
    cv2.imwrite(str(WORK / out), cv2.resize(pic, (1024, 1024), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 96])
    print('plate input, share put back from the lay back', round(float(far.mean()), 4))


def ring(src, out, deg=24, n=1024, from_deg=(8.0, 9.5), edge_deg=0.25):
    p = centre()
    inner_deg = L.PLATES['levels'][0]['widthDeg']
    base, _ = L.reproject(L.hold_level(48), L.SPOT, 48, p, deg, n)
    inner, _ = L.reproject(cv2.imread(str(WORK / src)).astype(np.float32), p, inner_deg, p, deg, n)
    w = L.footprint(p, deg, n, p, inner_deg)[..., None]
    comp = base * (1 - w) + inner * w
    lay, _, inside = layback(cv2.imread(str(CANVAS)), 1, deg, n)
    cover = L.step(0.5, 1.0, cv2.GaussianBlur((inside > 0.99).astype(np.float32), (0, 0), edge_deg * n / deg))
    far = (L.step(from_deg[0], from_deg[1], reach(p, deg, n)) * cover)[..., None]
    pic = comp * (1 - far) + lay.astype(np.float32) * far
    cv2.imwrite(str(WORK / out), np.clip(pic, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 96])
    print('ring input, share put back from the lay back', round(float(far.mean()), 4))


def fbm(n, seed, sigmas=(70, 36, 18, 9, 4), gains=(1, 0.8, 0.5, 0.3, 0.15)):
    rng = np.random.RandomState(seed)
    out = np.zeros((n, n), np.float32)
    for s, k in zip(sigmas, gains):
        f = cv2.GaussianBlur(rng.standard_normal((n, n)).astype(np.float32), (0, 0), s * n / 1024)
        out += k * f / f.std()
    out = (out - out.mean()) / out.std()
    return 0.5 + 0.25 * out


def deck(src, out, deg=24, n=1024):
    spec = L.ring.SPEC['deck']
    p = centre()
    inner_deg = L.PLATES['levels'][0]['widthDeg']
    base, _ = L.reproject(L.hold_level(48), L.SPOT, 48, p, deg, n)
    inner, _ = L.reproject(cv2.imread(str(WORK / src)).astype(np.float32), p, inner_deg, p, deg, n)
    w = L.footprint(p, deg, n, p, inner_deg)[..., None]
    north, east, up = g.frame_at(p)
    d = g.plate_dirs(p, deg, n)
    dist = reach(p, deg, n)
    rel = d - NADIR
    e0 = g.unit(np.cross(np.array([0.0, 1.0, 0.0]), NADIR))
    n0 = np.cross(NADIR, e0)
    bearing = np.degrees(np.arctan2(rel @ e0, rel @ n0))
    off = np.abs((bearing - g.GLOBE['azimuthDeg'] + 180) % 360 - 180)
    shape = L.step(spec['fromDeg'][0], spec['fromDeg'][1], dist) * (1 - L.step(spec['toDeg'][0], spec['toDeg'][1], dist)) * (1 - L.step(spec['sideDeg'][0], spec['sideDeg'][1], off))
    noise = fbm(n, spec['seed'])
    cover = L.step(spec['cut'][0], spec['cut'][1], shape + spec['rough'] * (noise - 0.5)).astype(np.float32)
    np.save(WORK / 'deck-cover.npy', cover)
    tone = np.array(spec['fill'], np.float32) + spec['fillVary'] * (fbm(n, spec['seed'] + 1, sigmas=(30, 12))[..., None] - 0.5)
    lay = cover[..., None] * (1 - w)
    pic = (base * (1 - w) + inner * w) * (1 - lay) + tone * lay
    cv2.imwrite(str(WORK / out), np.clip(pic, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 96])
    print('deck input, share of the picture marked', round(float(lay.mean()), 4))


if __name__ == '__main__':
    {'plate': plate, 'ring': ring, 'deck': deck}[sys.argv[1]](sys.argv[2], sys.argv[3])
