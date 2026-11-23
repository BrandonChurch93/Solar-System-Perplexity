import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parents[3]
WORK = ROOT / 'out/work/mercury/place'
PATCHES = json.loads((ROOT / 'assets-src/mercury/patches/patches.json').read_text())
SPOT = (PATCHES['spot']['lonDeg'], PATCHES['spot']['latDeg'])


def basis(lon, lat):
    lo, la = math.radians(lon), math.radians(lat)
    n = np.array([math.cos(la) * math.sin(lo), math.sin(la), math.cos(la) * math.cos(lo)])
    east = np.cross(np.array([0.0, 1.0, 0.0]), n)
    east /= np.linalg.norm(east)
    return n, east, np.cross(n, east)


N, E, U = basis(*SPOT)


def gnomon(lon, lat):
    d = basis(lon, lat)[0]
    return np.array([d @ E, d @ U]) / (d @ N)


def half(width_deg):
    return math.tan(math.radians(width_deg) / 2)


def grid(off, width_deg, size, box=None):
    x0, y0, x1, y1 = box or (0, 0, size, size)
    u, v = np.meshgrid((np.arange(x0, x1) + 0.5) / size, (np.arange(y0, y1) + 0.5) / size)
    gx = off[0] + (u - 0.5) * 2 * half(width_deg)
    gy = off[1] + (0.5 - v) * 2 * half(width_deg)
    return gx, gy


def dirs(gx, gy):
    d = N + gx[..., None] * E + gy[..., None] * U
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


RELIEF = json.loads((ROOT / 'src/stops/mercury/relief.json').read_text())
WIDE = json.loads((ROOT / 'src/stops/mercury/wide.json').read_text())


def linear(v):
    v = np.asarray(v, np.float32) / 255
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4).astype(np.float32)


def srgb(v):
    v = np.clip(v, 0, 1)
    return np.where(v <= 0.0031308, v * 12.92, 1.055 * v ** (1 / 2.4) - 0.055).astype(np.float32)


def quat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def inside(v, size, vfov, box, border):
    z = np.maximum(-v[..., 2], 1e-9)
    f = size[1] / 2 / math.tan(math.radians(vfov) / 2)
    px = size[0] / 2 + f * v[..., 0] / z
    py = size[1] / 2 - f * v[..., 1] / z
    edge = np.minimum(np.minimum(px - box[0], box[0] + box[2] - px), np.minimum(py - box[1], box[1] + box[3] - py))
    return np.clip(edge / border, 0, 1) * (v[..., 2] < 0)


def valid(d, border=160):
    close = json.loads((WORK / 'tiles/cameras.json').read_text())['close']
    x = (d - np.array(close['origin'])) @ np.array(close['matrix']) * close['radius']
    a = inside(x, RELIEF['imageSize']['full'], RELIEF['vfovDeg'], RELIEF['box']['full'], border)
    b = inside((x - np.array(WIDE['position'])) @ quat(WIDE['quaternion']), WIDE['imageSize']['full'], WIDE['vfovDeg'], WIDE['box']['full'], border)
    return np.maximum(a, b).astype(np.float32)


class Place:
    def __init__(self, kind, folder=None, feather=120):
        cams = json.loads((WORK / 'tiles/cameras.json').read_text())[kind]
        self.position = np.array(cams['position'])
        self.vfov = cams['vfovDeg']
        self.feather = feather
        self.tiles = []
        folder = Path(folder or WORK / 'tiles' / kind)
        for t in cams['tiles']:
            img = linear(cv2.cvtColor(cv2.imread(str(folder / ('f%d.png' % t['frame']))), cv2.COLOR_BGR2RGB))
            self.tiles.append((np.array(t['matrix']), img))

    def sample(self, d):
        d = d.astype(np.float64)
        to = d - self.position
        slant = np.linalg.norm(to, axis=-1)
        cos = -(to * d).sum(-1) / slant
        front = cos > 0
        acc = np.zeros(d.shape[:-1] + (3,), np.float32)
        total = np.zeros(d.shape[:-1], np.float32)
        for m, img in self.tiles:
            h, w = img.shape[:2]
            f = h / 2 / math.tan(math.radians(self.vfov) / 2)
            c = to @ m
            z = -c[..., 2]
            zs = np.maximum(z, 1e-9)
            px = (w / 2 + f * c[..., 0] / zs - 0.5).astype(np.float32)
            py = (h / 2 - f * c[..., 1] / zs - 0.5).astype(np.float32)
            edge = np.minimum(np.minimum(px, w - 1 - px), np.minimum(py, h - 1 - py))
            wt = np.clip(edge / self.feather, 0, 1) * (z > 0) * front
            if not wt.any():
                continue
            wt = (wt * wt * (3 - 2 * wt)).astype(np.float32)
            res = cv2.remap(img, px, py, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
            acc += res * wt[..., None]
            total += wt
        rgb = acc / np.maximum(total, 1e-6)[..., None]
        ifov = math.radians(self.vfov) / self.tiles[0][1].shape[0]
        return rgb, np.minimum(total, 1) * valid(d), np.where(front, 1 / np.maximum(cos, 1e-6), np.inf).astype(np.float32), (slant * ifov).astype(np.float32)

    def level(self, off, width_deg, size, box=None, ss=1):
        x0, y0, x1, y1 = box or (0, 0, size, size)
        gx, gy = grid(off, width_deg, size * ss, (x0 * ss, y0 * ss, x1 * ss, y1 * ss))
        rgb, seen, elong, gsd = self.sample(dirs(gx, gy))
        if ss > 1:
            shape = (x1 - x0, y1 - y0)
            rgb = cv2.resize(rgb, shape, interpolation=cv2.INTER_AREA)
            seen = cv2.resize(seen, shape, interpolation=cv2.INTER_AREA)
            elong = cv2.resize(np.minimum(elong, 1e3), shape, interpolation=cv2.INTER_AREA)
            gsd = cv2.resize(gsd, shape, interpolation=cv2.INTER_AREA)
        return rgb, seen, elong, gsd


if __name__ == '__main__':
    kind, lon, lat, width, size, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
    p = Place(kind)
    rgb, seen, elong, gsd = p.level(gnomon(lon, lat), width, size)
    Image.fromarray((srgb(rgb * seen[..., None]) * 255 + 0.5).astype(np.uint8)).save(out)
    print('seen', round(float((seen > 0.5).mean()), 4), 'elong under 2:', round(float(((elong < 2) & (seen > 0.5)).mean()), 4), 'under 3:', round(float(((elong < 3) & (seen > 0.5)).mean()), 4))
