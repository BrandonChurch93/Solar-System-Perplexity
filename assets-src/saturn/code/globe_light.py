"""The hold's light on the globe as a body map: by latitude and by longitude from the Sun.

Source: hold-light.bin (assets-src/saturn/shot/light.py hero): the approved hero over the film in scene light,
as the hero's lens sees the globe. Here each point of the true spheroid takes the value the hero's lens saw
there (the same projection and the same trust by the angle of view as the shader's shotLight had), and what
the hero's lens did not see takes the mean of what it saw at the same latitude and the same angle of the Sun.
The map belongs to the body and to the Sun: no lens stands in it once it is made.

usage: globe_light.py LENS.json OUT_DIR [ROOT]
  LENS.json  from lens_by_frame.ts (keys hero: eye, q, vfov; sunL), the hero's lens and the Sun in the body frame
writes globe-light.bin to public/assets/saturn/full and web, src/stops/saturn/globe-light.json, a preview in OUT_DIR
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(sys.argv[3]) if len(sys.argv) > 3 else Path(__file__).resolve().parents[3]
STOP = ROOT / 'src' / 'stops' / 'saturn'


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def rot(q, v):
    x, y, z, w = q
    u = np.array([x, y, z])
    return v + 2.0 * np.cross(u, np.cross(u, v) + w * v)


def bilinear(img, x, y):
    h, w = img.shape[:2]
    x = np.clip(x, 0, w - 1.001)
    y = np.clip(y, 0, h - 1.001)
    x0 = np.floor(x).astype(int)
    y0 = np.floor(y).astype(int)
    fx = (x - x0)[..., None]
    fy = (y - y0)[..., None]
    return (img[y0, x0] * (1 - fx) + img[y0, x0 + 1] * fx) * (1 - fy) + (img[y0 + 1, x0] * (1 - fx) + img[y0 + 1, x0 + 1] * fx) * fy


def main():
    lens = json.load(open(sys.argv[1]))
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    src = json.load(open(STOP / 'hold-light.json'))
    fit = json.load(open(STOP / 'fit.json'))
    cfg = json.load(open(STOP / 'globe-light.json')) if (STOP / 'globe-light.json').exists() else {}
    W = cfg.get('width', 720)
    H = cfg.get('height', 360)
    trust = cfg.get('trust', [0.03, 0.2])
    edge = cfg.get('edge', 0.03)
    bins = cfg.get('bins', [24, 36])
    sure = cfg.get('sure', [0.3, 0.5])
    least = cfg.get('least', 0.02)
    polar = fit['globe']['scale'][1]
    hero = lens['hero']
    eye = np.array(hero['eye'], dtype=np.float64)
    q = np.array(hero['q'], dtype=np.float64)
    sun = np.array(lens['sunL'], dtype=np.float64)
    sun = sun / np.linalg.norm(sun)
    sun_az = np.arctan2(sun[2], sun[0])
    light = np.fromfile(ROOT / 'public' / 'assets' / 'saturn' / 'full' / src['file'], dtype=np.float32).reshape(src['height'], src['width'], 4)[..., :3].astype(np.float64)

    lat = ((np.arange(H) + 0.5) / H - 0.5) * np.pi
    lam = ((np.arange(W) + 0.5) / W - 0.5) * 2.0 * np.pi
    LAM, LAT = np.meshgrid(lam, lat)
    phi = LAM + sun_az
    p = np.stack([np.cos(LAT) * np.cos(phi), np.sin(LAT), np.cos(LAT) * np.sin(phi)], -1)
    P = p * np.array([1.0, polar, 1.0])
    n = p / np.array([1.0, polar, 1.0])
    n = n / np.linalg.norm(n, axis=-1, keepdims=True)
    ndl = n @ sun
    # the hero's lens: the same projection as shot.ts shotMatrix and the globe shader's shotLight
    qi = np.array([-q[0], -q[1], -q[2], q[3]])
    rel = P - eye
    cam = rot(qi, rel.reshape(-1, 3)).reshape(rel.shape)
    depth = -cam[..., 2]
    t = np.tan(np.radians(hero['vfov']) / 2.0)
    aspect = 16.0 / 9.0
    u = cam[..., 0] / np.maximum(depth, 1e-4) / (t * aspect) * 0.5 + 0.5
    v = 0.5 - cam[..., 1] / np.maximum(depth, 1e-4) / t * 0.5
    e = np.minimum(np.minimum(u, 1 - u), np.minimum(v, 1 - v))
    inside = np.where(depth > 1e-3, smoothstep(0.0, edge, e), 0.0)
    to_eye = eye - P
    to_eye = to_eye / np.linalg.norm(to_eye, axis=-1, keepdims=True)
    cos_e = np.sum(n * to_eye, -1)
    k = inside * smoothstep(trust[0], trust[1], cos_e)
    seen = bilinear(light, u * src['width'] - 0.5, v * src['height'] - 0.5)

    # what the hero's lens did not see: the mean of what it saw, by the angle of the Sun and by latitude
    nb, lb = bins
    bi = np.clip(((ndl * 0.5 + 0.5) * nb).astype(int), 0, nb - 1)
    li = np.clip(((LAT / np.pi + 0.5) * lb).astype(int), 0, lb - 1)
    wsum = np.zeros((nb, lb))
    vsum = np.zeros((nb, lb, 3))
    wk = k * smoothstep(sure[0], sure[1], cos_e) * np.cos(LAT)
    np.add.at(wsum, (bi, li), wk)
    for c in range(3):
        np.add.at(vsum[..., c], (bi, li), wk * np.log(np.maximum(seen[..., c], 1e-4)))
    have = wsum > least * wsum.max()
    table = np.where(have[..., None], vsum / np.maximum(wsum, 1e-9)[..., None], 0.0)
    # bins the hero never saw take the nearest bin of the same latitude, then of the nearest latitude
    def grow(have, table, axis):
        changed = False
        for step in (1, -1):
            from_have = np.roll(have, step, axis)
            from_table = np.roll(table, step, axis)
            ok = np.ones_like(have)
            at = [slice(None), slice(None)]
            at[axis] = 0 if step == 1 else -1
            ok[tuple(at)] = False
            take = (~have) & from_have & ok
            if take.any():
                table[take] = from_table[take]
                have = have | take
                changed = True
        return have, table, changed

    while not have.all():
        have, table, changed = grow(have, table, 0)
        if not changed:
            have, table, changed = grow(have, table, 1)
            if not changed:
                break
    for _ in range(2):
        pad = np.pad(table, ((1, 1), (1, 1), (0, 0)), mode='edge')
        table = (pad[:-2, 1:-1] + pad[2:, 1:-1] + pad[1:-1, :-2] + pad[1:-1, 2:] + 4.0 * table) / 8.0
    # read the table smoothly (bilinear over the bin centres)
    fx = np.clip((ndl * 0.5 + 0.5) * nb - 0.5, 0, nb - 1)
    fy = np.clip((LAT / np.pi + 0.5) * lb - 0.5, 0, lb - 1)
    x0 = np.minimum(np.floor(fx).astype(int), nb - 2)
    y0 = np.minimum(np.floor(fy).astype(int), lb - 2)
    ax = (fx - x0)[..., None]
    ay = (fy - y0)[..., None]
    fill = np.exp((table[x0, y0] * (1 - ax) + table[x0 + 1, y0] * ax) * (1 - ay) + (table[x0, y0 + 1] * (1 - ax) + table[x0 + 1, y0 + 1] * ax) * ay)
    body = fill * (1 - k[..., None]) + seen * k[..., None]

    data = np.concatenate([body, np.ones((H, W, 1))], -1).astype(np.float32)
    for key in ('full', 'web'):
        data.tofile(ROOT / 'public' / 'assets' / 'saturn' / key / 'globe-light.bin')
    note = {
        'source': 'assets-src/saturn/code/globe_light.py: hold-light.bin laid on the true spheroid through the hero lens, the unseen part by the mean at the same latitude and angle of the Sun',
        'file': 'globe-light.bin', 'width': W, 'height': H,
        'axes': 'u = (azimuth of the point about the axis - azimuth of the Sun) / 360 + 0.5, v = latitude / 180 + 0.5 (latitude on the unit sphere before the polar scale)',
        'trust': trust, 'edge': edge, 'bins': bins, 'sure': sure, 'least': least,
        'trustNote': 'the cosine of the angle of view at the hero lens over which a point takes what the hero saw (the numbers the shader had); edge: the same for the border of the hero frame; bins: the fill table, by the angle of the Sun and by latitude; sure: the cosine of the angle of view over which a point counts for the fill table; least: the least weight of a bin of the table as a share of the heaviest',
        'hero': {'eye': [round(float(x), 6) for x in eye], 'q': [round(float(x), 6) for x in q], 'vfov': hero['vfov']},
        'sun': [round(float(x), 6) for x in sun],
        'share': round(float((k > 0.5).mean()), 4),
    }
    json.dump(note, open(STOP / 'globe-light.json', 'w'), indent=2)
    open(STOP / 'globe-light.json', 'a').write('\n')
    from PIL import Image
    vis = np.clip(np.log2(np.maximum(body, 1e-3)) / 2 + 0.5, 0, 1)
    Image.fromarray((vis * 255).astype(np.uint8)).save(out / 'globe-light-vis.png')
    Image.fromarray((np.clip(k, 0, 1) * 255).astype(np.uint8)).save(out / 'globe-light-seen.png')
    print('map', W, H, 'seen share %.3f' % (k > 0.5).mean(), 'range', [round(float(body[..., c].min()), 3) for c in range(3)], [round(float(body[..., c].max()), 3) for c in range(3)])


main()
