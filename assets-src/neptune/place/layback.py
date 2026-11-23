"""S2: lay the close side back onto the globe as top down gnomonic plates.

Each plate is centred on the spot of the patch pyramid, east to the right and
north up, like the levels of assets-src/neptune/patches. Sources are the layers
the close side itself draws (close-deck, close-cloud, their wide canvases and
the shadow factor of close-height), read through the camera of place.json: the
deck on the sphere, the cloud on the shell the globe carries its cirrus on.
"""
import json
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'patches'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'terrain'))
import cgeo  # noqa: E402
import flow  # noqa: E402
import gnomon  # noqa: E402

ASSETS = 'public/assets/neptune/full'
PLACE = json.load(open('src/stops/neptune/place.json'))
SHELL = 0.004


def matrix(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


QB = matrix(PLACE['toBody'])
_maps = {}


def load(name):
    if name not in _maps:
        img = cv2.imread(os.path.join(ASSETS, name), cv2.IMREAD_UNCHANGED)
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2RGBA if img.shape[2] == 4 else cv2.COLOR_BGR2RGB)
        _maps[name] = img
    return _maps[name]


def plate_dirs(width, size, centre=(0.0, 0.0)):
    lon0, lat0 = gnomon.spot()
    n, e, u = gnomon.basis(lon0, lat0)
    g = ((np.arange(size, dtype=np.float32) + 0.5) / size - 0.5) * 2 * gnomon.half(width)
    gx, gy = np.meshgrid(g + centre[0], -g + centre[1])
    d = n[None, None, :] + gx[..., None] * e + gy[..., None] * u
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    return d


def tangent(n, shell=0.0):
    p = cgeo.CENTRE[None, None, :] + cgeo.RADIUS * (1 + shell) * n
    seen = (p[..., 2] < 0) & ((p * n).sum(-1) < 0)
    z = np.minimum(p[..., 2], -1e-6)
    return p[..., 0] / -z, p[..., 1] / -z, seen, np.linalg.norm(p, axis=-1)


def sample(core, wide, tx, ty):
    ch, cw = core.shape[:2]
    wh, ww = wide.shape[:2]
    cx = ((tx / cgeo.TX + 1) / 2 * cw - 0.5).astype(np.float32)
    cy = ((1 - ty / cgeo.TY) / 2 * ch - 0.5).astype(np.float32)
    wx = ((tx - cgeo.LEFT) / (cgeo.RIGHT - cgeo.LEFT) * ww - 0.5).astype(np.float32)
    wy = ((cgeo.TOP - ty) / (cgeo.TOP - cgeo.BOTTOM) * wh - 0.5).astype(np.float32)
    a = cv2.remap(core, cx, cy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).astype(np.float32) / 255
    b = cv2.remap(wide, wx, wy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE).astype(np.float32) / 255
    inside = (np.abs(tx) < cgeo.TX) & (np.abs(ty) < cgeo.TY)
    out = np.where(inside[..., None], a, b)
    on = (tx > cgeo.LEFT) & (tx < cgeo.RIGHT) & (ty < cgeo.TOP) & (ty > cgeo.BOTTOM)
    edge = np.minimum(np.minimum(tx - cgeo.LEFT, cgeo.RIGHT - tx) / (cgeo.RIGHT - cgeo.LEFT) * ww, np.minimum(cgeo.TOP - ty, ty - cgeo.BOTTOM) / (cgeo.TOP - cgeo.BOTTOM) * wh)
    return out, on, inside, edge


def stretch(tx, ty):
    """Approved image pixels per plate pixel along the most stretched direction."""
    k = cgeo.W / (2 * cgeo.TX)
    px, py = tx * k, ty * k
    a, b = np.gradient(px, axis=1), np.gradient(px, axis=0)
    c, d = np.gradient(py, axis=1), np.gradient(py, axis=0)
    s = a * a + b * b + c * c + d * d
    det = np.abs(a * d - b * c)
    return np.sqrt(np.maximum(0.5 * (s - np.sqrt(np.maximum(s * s - 4 * det * det, 0))), 0))


def lay(width, size, centre=(0.0, 0.0), flat=True):
    d = plate_dirs(width, size, centre)
    n = (flow.deck_shown(d, PLACE['rest']) @ QB).astype(np.float32)
    nc = (flow.cloud_shown(d, PLACE['rest']) @ QB).astype(np.float32)
    tx, ty, seen, _ = tangent(n)
    deck, on, inside, edge = sample(load('close-deck.webp'), load('close-deck-wide.webp'), tx, ty)
    hgt = load('close-height.png')
    wx = ((tx - cgeo.LEFT) / (cgeo.RIGHT - cgeo.LEFT) * hgt.shape[1] - 0.5).astype(np.float32)
    wy = ((cgeo.TOP - ty) / (cgeo.TOP - cgeo.BOTTOM) * hgt.shape[0] - 0.5).astype(np.float32)
    shadow = cv2.remap(hgt, wx, wy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)[..., 1].astype(np.float32) / 255
    cx, cy, cseen, _ = tangent(nc, 0.0 if flat else SHELL)
    cloud, con, _, _ = sample(load('close-cloud.webp'), load('close-cloud-wide.webp'), cx, cy)
    under = np.degrees(np.arccos(np.clip(n @ (-cgeo.NADIR).astype(np.float32), -1, 1)))
    return {'deck': deck, 'shadow': shadow, 'cloud': cloud, 'seen': seen & on, 'cloudSeen': cseen & con, 'inside': inside, 'edge': edge, 'stretch': stretch(tx, ty), 'under': under}


if __name__ == '__main__':
    width = float(sys.argv[1])
    size = int(sys.argv[2]) if len(sys.argv) > 2 else 1024
    out = sys.argv[3] if len(sys.argv) > 3 else 'out/work/nep/place/lay-%g.jpg' % width
    r = lay(width, size)
    lin = lambda v: np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)
    enc = lambda v: np.where(v <= 0.0031308, v * 12.92, 1.055 * np.clip(v, 0, 1) ** (1 / 2.4) - 0.055)
    a = r['cloud'][..., 3:4] * r['cloudSeen'][..., None]
    pic = enc(lin(r['deck']) * r['shadow'][..., None] * (1 - a) + lin(r['cloud'][..., :3]) * a)
    pic = np.where(r['seen'][..., None], pic, [0.16, 0.0, 0.16])
    st = r['stretch']
    heat = np.dstack([np.clip(1 - st, 0, 1), np.clip(st, 0, 1), np.zeros_like(st)]) * r['seen'][..., None]
    row = np.concatenate([pic, heat], 1)
    cv2.imwrite(out, cv2.cvtColor((np.clip(row, 0, 1) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print('width', width, 'covered %.3f' % r['seen'].mean(), 'stretch at centre %.2f' % st[size // 2, size // 2], 'share with stretch over 0.5: %.3f' % ((st > 0.5) & r['seen']).mean())
