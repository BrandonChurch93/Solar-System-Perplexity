import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geom as g
import band as B

Image.MAX_IMAGE_PIXELS = None
WEDGE = g.PLACE['plates']['wedge']
WORK = g.ROOT / 'out/work/earth/place/wedge'
step = B.step


def half():
    return np.tan(np.radians(WEDGE['widthDeg']) / 2)


def layer(d):
    wrap = np.asarray(Image.open(B.PUB / 'full' / WEDGE['layer']))
    h, w = wrap.shape[:2]
    x = ((np.arctan2(d[..., 0], d[..., 2]) / (2 * np.pi) + 0.5) * w - 0.5).astype(np.float32)
    y = ((0.5 - np.arcsin(np.clip(d[..., 1], -1, 1)) / np.pi) * h - 0.5).astype(np.float32)
    return cv2.remap(wrap, x, y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP).astype(np.float32) / 255


def seen_cloud(d):
    src = np.asarray(Image.open(B.WORK / 'ground-full.webp').convert('RGB'))
    k = WEDGE['read']['shrink']
    img = cv2.resize(src, (src.shape[1] // k, src.shape[0] // k), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    del src
    th, tw = img.shape[:2]
    lo, hi = img.min(-1), img.max(-1)
    rd = WEDGE['read']
    cloud = step(rd['cloud'][0], rd['cloud'][1], lo) * (1 - step(rd['grey'][0], rd['grey'][1], (hi - lo) / np.maximum(hi, 1e-3))) * (1 - step(rd['warm'][0], rd['warm'][1], img[..., 0] - img[..., 2]))
    x, y, seen = g.image_of(d)
    box = B.GROUND['box']
    cx, cy = (x - box[0]) * tw / box[2] - 0.5, (y - box[1]) * th / box[3] - 0.5
    line = np.polyval(B.GROUND['horizon'][8::-1], (x - B.GROUND['horizonSpan'][0]) / B.GROUND['horizonSpan'][1])
    ok = seen & (cx >= 0) & (cx <= tw - 1) & (cy >= 0) & (cy <= th - 1) & (y > line + rd['clearPx'])
    return cv2.remap(cloud, cx.astype(np.float32), cy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) * ok, ok.astype(np.float32)


def specks(n, km):
    rng = np.random.default_rng(WEDGE['seed'])
    f, weight = 0, 1.0
    for cell in WEDGE['cellKm']:
        s = cell / km / 2.5
        o = cv2.GaussianBlur(rng.standard_normal((n, n)).astype(np.float32), (0, 0), sigmaX=s * WEDGE['streak'], sigmaY=s)
        f = f + weight * o / o.std()
        weight *= WEDGE['cellGain']
    rank = np.empty(n * n, np.float32)
    rank[np.argsort(f.ravel())] = (np.arange(n * n, dtype=np.float32) + 0.5) / (n * n)
    return rank.reshape(n, n)


def colour_of(a, held, ring):
    edges = np.linspace(0, 1, 21)
    mid, rgb = [0.0], [np.zeros(3, np.float32)]
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = ring & (held[..., 3] >= lo) & (held[..., 3] < hi + (hi == 1))
        if m.sum() >= 50:
            mid.append(float(held[..., 3][m].mean()))
            rgb.append(held[..., :3][m].mean(0))
    rgb = np.array(rgb)
    return np.dstack([np.interp(a, mid, rgb[:, c]) for c in range(3)]).astype(np.float32)


def build():
    n = WEDGE['size']
    d = B.grid(B.PC, half(), n)
    arc = B.arc_of(d)
    per = n / WEDGE['widthDeg']
    km = WEDGE['widthDeg'] * 111.19 / n
    cloud, ok = seen_cloud(d)
    s = WEDGE['spreadDeg'] * per
    near = cv2.GaussianBlur(ok, (0, 0), s)
    read = cv2.GaussianBlur(cloud, (0, 0), s) / np.maximum(near, 1e-3)
    side = WEDGE['sideDeg'] * per
    wide = cv2.GaussianBlur(ok, (0, 0), side)
    carried = cv2.GaussianBlur(read * ok, (0, 0), side) / np.maximum(wide, 1e-3)
    inside = step(0.35, 0.5, near)
    read = read * inside + carried * (1 - inside)
    env = step(WEDGE['arcDeg'][0], WEDGE['arcDeg'][1], arc) * (1 - step(WEDGE['arcDeg'][2], WEDGE['arcDeg'][3], arc)) * step(WEDGE['sideShare'][0], WEDGE['sideShare'][1], wide)
    dens = np.minimum(WEDGE['gain'] * read, WEDGE['cap']) * env
    u = specks(n, km)
    held = layer(d)
    add = WEDGE['peak'] * step(0, 1, (dens - u) / np.maximum(WEDGE['soft'] * dens, 1e-6))
    add = cv2.GaussianBlur(add.astype(np.float32), (0, 0), WEDGE['blurPx'])
    add[(add < 1 / 255) | (env <= 0)] = 0
    ring = (arc >= WEDGE['arcDeg'][0]) & (arc < WEDGE['arcDeg'][3])
    rgb = colour_of(add, held, ring)
    out = np.clip(np.round(np.concatenate([rgb, add[..., None]], -1) * 255), 0, 255).astype(np.uint8)
    out[out[..., 3] == 0] = 0
    rim = 2
    out[:rim] = out[-rim:] = 0
    out[:, :rim] = out[:, -rim:] = 0
    view = ok > 0.5
    rings = [(a, (arc >= a) & (arc < a + 1) & view) for a in range(5, 14)]
    a8 = out[..., 3].astype(np.float32) / 255
    both = held[..., 3] + a8 * (1 - held[..., 3])
    print('wedge: km a texel %.2f; in view by degrees from the point under the close camera (cloud read off the approved band, cover wanted, cover added, the layer\'s own cover, both): ' % km + ', '.join('%d: %.3f %.3f %.3f %.3f %.3f' % (a, read[m].mean(), dens[m].mean(), a8[m].mean(), held[..., 3][m].mean(), both[m].mean()) for a, m in rings if m.any()), flush=True)
    sp = cv2.GaussianBlur(both, (0, 0), per)
    print('cover of the layer with the wedge spread over 1 degree, largest inside the wedge %.3f; the layer alone over the ring %g to %g degrees: 90th %.3f, 99th %.3f, largest %.3f' % (sp[env > 0].max(), WEDGE['arcDeg'][0], WEDGE['arcDeg'][2], *np.percentile(cv2.GaussianBlur(held[..., 3], (0, 0), per)[(arc >= WEDGE['arcDeg'][0]) & (arc < WEDGE['arcDeg'][2])], [90, 99, 100])), flush=True)
    print('texels changed %d of %d, outside the envelope %d' % ((out[..., 3] > 0).sum(), n * n, ((out[..., 3] > 0) & (env <= 0)).sum()), flush=True)
    return out, held, dens, ok, arc


def added(d):
    a = np.asarray(Image.open(B.PUB / 'full' / WEDGE['file']))[..., 3].astype(np.float32) / 255
    hx, hy, k = B.plane(d, B.PC)
    s = 1 / (2 * half())
    u, v = hx * s + 0.5, hy * s + 0.5
    inside = (k >= 0.3) & (np.abs(u - 0.5) < 0.5) & (np.abs(v - 0.5) < 0.5)
    n = a.shape[0]
    return cv2.remap(a, (u * n - 0.5).astype(np.float32), ((1 - v) * n - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0) * inside


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    out, held, dens, ok, arc = build()
    n = out.shape[0]
    dry = '--look' in sys.argv
    if not dry:
        Image.fromarray(out, 'RGBA').save(B.PUB / 'full' / WEDGE['file'], optimize=True)
        m = n // 2
        f = out.astype(np.float32)
        Image.fromarray(np.clip(np.round(cv2.resize(f, (m, m), interpolation=cv2.INTER_AREA)), 0, 255).astype(np.uint8), 'RGBA').save(B.PUB / 'web' / WEDGE['file'], optimize=True)
    a = out[..., 3:4].astype(np.float32) / 255
    was = held[..., :3] * 255
    now = was * (1 - a) + out[..., :3].astype(np.float32)
    sea = np.array([70, 40, 10], np.float32)
    look = np.hstack([sea * (1 - held[..., 3:4]) + was[..., ::-1], sea * (1 - (held[..., 3:4] + a * (1 - held[..., 3:4]))) + now[..., ::-1]])
    cv2.imwrite(str(WORK / 'wedge-look.jpg'), np.clip(look, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
    cv2.imwrite(str(WORK / 'wedge-density.png'), np.clip(dens * 255 * 2, 0, 255).astype(np.uint8))


if __name__ == '__main__':
    main()
