import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import geom as g
import band as B

SEA = json.loads((HERE / 'mend.json').read_text())['field']['density']['speck']['sea']
WORK = g.ROOT / 'out/work/earth/place/sea'
FILE = HERE / SEA['file']
step = B.step


def half():
    return np.tan(np.radians(SEA['widthDeg']) / 2)


def level_of(commit, lv):
    WORK.mkdir(parents=True, exist_ok=True)
    path = WORK / ('%s-%s' % (commit[:8], lv['file']))
    if not path.exists():
        path.write_bytes(subprocess.run(['git', 'show', '%s:public/assets/earth/full/%s' % (commit, lv['file'])], cwd=g.ROOT, check=True, capture_output=True).stdout)
    return cv2.imread(str(path)).astype(np.float32)


def half_size(img):
    return cv2.resize(img, (img.shape[1] // 2, img.shape[0] // 2), interpolation=cv2.INTER_AREA)


def on_raster(img, lv, c, d):
    hx, hy, k = B.plane(d, c)
    wide = 1 / (2 * np.tan(np.radians(lv['widthDeg']) / 2))
    scale = wide * lv['raster'] / lv['size']
    qx = (hx - lv['offset'][0] / (lv['raster'] * wide)) * scale
    qy = (hy - lv['offset'][1] / (lv['raster'] * wide)) * scale
    s = img.shape[0]
    px = cv2.remap(img, ((qx + 0.5) * s - 0.5).astype(np.float32), ((0.5 - qy) * s - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return px, ((k >= 0.3) * step(0.5, 0.5 - B.PLATES['feather'], np.maximum(np.abs(qx), np.abs(qy)))).astype(np.float32)


def cloud_of(bgr):
    c = bgr / 255
    return step(SEA['cloud'][0], SEA['cloud'][1], c.min(-1)) * (1 - step(SEA['warm'][0], SEA['warm'][1], c[..., 2] - c[..., 0]))


def puff_of(theirs, hold):
    return step(SEA['rise'][0], SEA['rise'][1], (theirs.min(-1) - hold.min(-1)) / 255)


def sea_of(bgr):
    return ((bgr[..., 0] > bgr[..., 2] + SEA['sea'][0]) & (bgr[..., 0] > bgr[..., 1] - SEA['sea'][1])).astype(np.float32)


def stack(commit, plain, d):
    out = None
    for lv in B.PLATES['under']:
        if lv['widthDeg'] not in SEA['levels']:
            continue
        img = level_of(commit, lv)
        px, w = on_raster(half_size(img), dict(lv, raster=img.shape[0], size=img.shape[0], offset=[0, 0]) if plain else lv, B.SPOT, d)
        out = px if out is None else out * (1 - w[..., None]) + px * w[..., None]
    return out


def build():
    n = SEA['size']
    d = B.grid(B.PC, half(), n)
    per = n / SEA['widthDeg']
    theirs, hold = stack(SEA['commit'], False, d), stack(B.PLATES['holdCommit'], True, d)
    puff, own, sea = puff_of(theirs, hold), cloud_of(hold), sea_of(hold)
    own = cv2.GaussianBlur(own, (0, 0), SEA['ownDeg'] * per)
    land = cv2.GaussianBlur(1 - sea, (0, 0), SEA['landDeg'] * per)
    arc = B.arc_of(d)
    x, y, front = g.project(g.body_to_local(d))
    side = step(-SEA['sidePx'], 0, x) * (1 - step(g.W, g.W + SEA['sidePx'], x)) * front
    hx, hy, k = B.plane(d, B.PC)
    edge = (0.5 - np.maximum(np.abs(hx), np.abs(hy)) / (2 * np.tan(np.radians(B.PLACE_WIDE) / 2) * B.STAND['times'])) * B.PLACE_WIDE * B.STAND['times']
    env = step(SEA['arcDeg'][0], SEA['arcDeg'][1], arc) * side * step(SEA['standDeg'][0], SEA['standDeg'][1], edge)
    gone = step(SEA['own'][0], SEA['own'][1], own)
    dry = step(SEA['land'][0], SEA['land'][1], land)
    cover = puff * (1 - gone) * (1 - dry) * env
    out = np.clip(np.round(np.stack([cover, 1 - dry], -1) * 255), 0, 255).astype(np.uint8)
    rings = [(a, (arc >= a) & (arc < a + 2) & (env > 0.5)) for a in range(5, 19, 2)]
    print('sea cover: km a texel %.2f; by degrees from the point under the close camera inside the envelope (share of the raster there, their cloud, of it the hold\'s own, not over sea, kept): ' % (SEA['widthDeg'] * 111.19 / n) + ', '.join('%d to %d: %.4f %.4f %.4f %.4f %.4f' % (a, a + 2, m.mean(), puff[m].mean(), (puff * gone)[m].mean(), (puff * dry)[m].mean(), cover[m].mean()) for a, m in rings if m.any()), flush=True)
    return out, theirs, hold, env, puff


def at(d):
    a = np.asarray(Image.open(FILE).convert('LA')).astype(np.float32) / 255
    hx, hy, k = B.plane(d, B.PC)
    s = 1 / (2 * half())
    u, v = hx * s + 0.5, hy * s + 0.5
    inside = (k >= 0.3) & (np.abs(u - 0.5) < 0.5) & (np.abs(v - 0.5) < 0.5)
    n = a.shape[0]
    return cv2.remap(a, (u * n - 0.5).astype(np.float32), ((1 - v) * n - 0.5).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0) * inside[..., None]


def main():
    out, theirs, hold, env, puff = build()
    if '--look' not in sys.argv:
        Image.fromarray(out, 'LA').save(FILE, optimize=True)
    a = out[..., :1].astype(np.float32) / 255
    look = np.hstack([theirs.astype(np.float32) * (0.45 + 0.55 * env[..., None]), hold.astype(np.float32) * (1 - a) + np.array([40, 40, 255], np.float32) * a])
    cv2.imwrite(str(WORK / 'sea-look.jpg'), cv2.resize(np.clip(look, 0, 255).astype(np.uint8), (2048, 1024), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])


if __name__ == '__main__':
    main()
