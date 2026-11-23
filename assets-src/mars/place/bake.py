"""Bakes the Mars patch pyramid with the place plates as its deepest levels.

Everything is a square gnomonic picture about the spot, north at the top. The work runs in look values: what the
globe shows near the ground before haze (for a lit level: scene_of(texel) x light, for an own level: scene_of(texel)).
  1. The plates of the place (force.py, look values) are read; a plate without a file is the old land of main in
     look values. Look values are those at the height of the place picture: there the globe multiplies a lit level
     with lead.light times the tint of near.json (geom.near_tint), so the old land is brought to the picture's
     colours by height and not by place (lead.paletteMix is 0: no disc of another hue lies round the place).
  2. From the deepest plate up, every plate is faded into the plate above over nestFeather of its width at its rim
     and the plate above takes the result, sized down, as its middle: a feature of one level is at its place in
     the next.
  3. The widest plate goes the same way into a new lit level (the old levels of main resampled, as albedo).
  4. The lit levels above take the difference that step 3 made, sized down, times their share.
  5. Own plates are written as texel_of(look), lit levels as texel_of(look / light); JPEG 4:4:4; the web set is
     the full set at webShare of its size. levels.json of the stop is written with the ladder.
The old files are read from --old (main's bytes: git show origin/main:public/assets/mars/full/NAME).
  python3 assets-src/mars/place/bake.py [--only-check]
"""
import argparse
import json
import os
import subprocess
import cv2
import numpy as np
from PIL import Image
import geom

ap = argparse.ArgumentParser()
ap.add_argument('--config', default='assets-src/mars/place/plates.json')
ap.add_argument('--old', default='out/work/place/old')
ap.add_argument('--assets', default='public/assets/mars')
ap.add_argument('--work', default='out/work/place/bake')
ap.add_argument('--levels', default='src/stops/mars/levels.json')
ap.add_argument('--toned', default='', help='WIDTH,FILE: only write the toned old land of that width as a look plate (16 bit) and stop')
ap.add_argument('--no-write', action='store_true', help='keep public/assets and levels.json as they are, write only the work pictures')
a = ap.parse_args()
cfg = json.load(open(a.config))
bk, lead = cfg['bake'], cfg['lead']
N = bk['workSize']
os.makedirs(a.old, exist_ok=True)
os.makedirs(a.work, exist_ok=True)
light = np.array(lead['light'][::-1], np.float32) * geom.near_tint()


def old_file(name):
    path = os.path.join(a.old, name)
    if not os.path.exists(path):
        with open(path, 'wb') as f:
            f.write(subprocess.run(['git', 'show', '%s:public/assets/mars/full/%s' % (bk['oldRef'], name)], check=True, capture_output=True).stdout)
    return path


def read8(path):
    return cv2.imread(path, cv2.IMREAD_COLOR).astype(np.float32) / 255


def read_look(path):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    v = img[..., :3].astype(np.float32) / (65535 if img.dtype == np.uint16 else 255)
    if v.shape[0] != N:
        v = cv2.resize(v, (N, N), interpolation=cv2.INTER_CUBIC if v.shape[0] < N else cv2.INTER_AREA)
    return bent(geom.scene_of(np.clip(v, 0, 1)))


def bent(look):
    """No ground is brighter than lookMost: the luminance is bent over above lookKnee (pale glare of a take or of
    the picture's haze would read as a white spot from above)."""
    lum = look @ np.array([0.0722, 0.7152, 0.2126], np.float32)
    knee, most = bk['lookKnee'], bk['lookMost']
    to = np.where(lum > knee, knee + (most - knee) * (1 - np.exp(-(lum - knee) / (most - knee))), lum)
    return look * (to / np.maximum(lum, 1e-6))[..., None]


wrap = geom.mips(read8(old_file('wrap-color.jpg')))
old = [(geom.mips(read8(old_file(l['file']))), l['widthDeg']) for l in cfg['oldLadder']]


def old_scene(width_deg):
    """Main's ground as albedo scene values, every old level at full weight."""
    base, _ = geom.ground(wrap, old, width_deg, N, flat=True)
    return geom.scene_of(base)


def toned(look, width_deg):
    """lead.py's move of the old land toward the picture's colours near the place."""
    d = geom.patch_dirs(width_deg, N)
    n, _, _ = geom.patch_frame()
    r = np.degrees(np.arccos(np.clip(d @ n, -1, 1))).astype(np.float32)
    del d
    w = (1 - geom.smoothstep(lead['paletteCoreDeg'], lead['paletteEndDeg'], r))[..., None]
    hue = np.array(lead['paletteHue'][::-1], np.float32)
    lum = lambda v: v @ np.array([0.0722, 0.7152, 0.2126], np.float32)
    t = lum(look)[..., None] * (hue / lum(hue)) * lead['paletteLum']
    return look + (t - look) * (w * lead['paletteMix'])


def nest(child, child_deg, parent, parent_deg):
    """Fades the child into the parent at its rim; the parent takes the child, sized down, as its middle."""
    share = geom.half_tan(child_deg) / geom.half_tan(parent_deg)
    px = int(round(N * share / 2)) * 2
    o = (N - px) // 2
    up = cv2.resize(parent[o:o + px, o:o + px], (N, N), interpolation=cv2.INTER_CUBIC)
    c = (np.arange(N) + 0.5) / N
    e = np.minimum(c, 1 - c)
    k = geom.smoothstep(0, bk['nestFeather'], np.minimum(e[None, :], e[:, None]))[..., None].astype(np.float32)
    # colour match at the rim: the broad difference to the plate above, fading out inward
    reach = (1 - geom.smoothstep(0, bk['matchReach'], np.minimum(e[None, :], e[:, None])))[..., None].astype(np.float32)
    # (a gain, not a sum: a sum takes red out of the dark ground and leaves it teal)
    sig = bk['matchBlur'] * N
    gain = np.clip((cv2.GaussianBlur(up, (0, 0), sig) + 2e-3) / (cv2.GaussianBlur(child, (0, 0), sig) + 2e-3), bk['matchLeast'], bk['matchMost'])
    child = child * (1 + (gain - 1) * reach)
    del gain
    child = np.maximum(up * (1 - k) + child * k, 0)
    parent[o:o + px, o:o + px] = cv2.resize(child, (px, px), interpolation=cv2.INTER_AREA)
    return child


def save(texel, name, size):
    for key, s in (('full', size), ('web', int(round(size * bk['webShare'])))):
        img = texel if s == N else cv2.resize(texel, (s, s), interpolation=cv2.INTER_AREA)
        rgb = np.round(np.clip(img[..., ::-1], 0, 1) * 255).astype(np.uint8)
        if a.no_write:
            continue
        Image.fromarray(rgb).save(os.path.join(a.assets, key, name), quality=bk['jpegQuality'], subsampling=0)
    cv2.imwrite(os.path.join(a.work, name[:-4] + '.png'), np.round(np.clip(texel, 0, 1) * 255).astype(np.uint8))


if a.toned:
    w, path = a.toned.split(',')
    cv2.imwrite(path, np.round(np.clip(geom.texel_of(bent(toned(old_scene(float(w)) * light, float(w)))), 0, 1) * 65535).astype(np.uint16))
    raise SystemExit(0)

plates = bk['plates']
looks = []
for p in plates:
    looks.append(read_look(p['look']) if p['look'] else bent(toned(old_scene(p['widthDeg']) * light, p['widthDeg'])))
    print('plate %g deg read' % p['widthDeg'], flush=True)
lits = bk['lit']
S_old = [old_scene(l['widthDeg']) for l in lits]
L_lit = [S * light for S in S_old]
for i in range(len(plates)):
    parent, parent_deg = (looks[i + 1], plates[i + 1]['widthDeg']) if i + 1 < len(plates) else (L_lit[0], lits[0]['widthDeg'])
    looks[i] = nest(looks[i], plates[i]['widthDeg'], parent, parent_deg)
    save(geom.texel_of(looks[i]), plates[i]['file'], plates[i]['size'])
    print('plate %g deg nested into %g and written' % (plates[i]['widthDeg'], parent_deg), flush=True)
    looks[i] = None
for i in range(len(lits)):
    if i + 1 < len(lits):
        L_lit[i] = nest(L_lit[i], lits[i]['widthDeg'], L_lit[i + 1], lits[i + 1]['widthDeg'])
    save(geom.texel_of(L_lit[i] / light), lits[i]['file'], lits[i]['size'])
    print('lit level %g deg written' % lits[i]['widthDeg'], flush=True)
delta, deg = L_lit[-1] / light - S_old[-1], lits[-1]['widthDeg']
del S_old, L_lit
for d in bk['delta']:
    S = geom.scene_of(read8(old_file(d['file'])))
    if S.shape[0] != N:
        raise SystemExit('%s is %d px, the work size is %d' % (d['file'], S.shape[0], N))
    share = geom.half_tan(deg) / geom.half_tan(d['widthDeg'])
    px = int(round(N * share / 2)) * 2
    o = (N - px) // 2
    small = cv2.resize(delta, (px, px), interpolation=cv2.INTER_AREA) * d['share']
    T = S.copy()
    T[o:o + px, o:o + px] = np.maximum(T[o:o + px, o:o + px] + small, 0)
    save(geom.texel_of(T), d['file'], N)
    print('%s: the difference of the level below added at share %g, largest change %.4f of scene' % (d['file'], d['share'], float(np.abs(small).max())), flush=True)
    delta, deg = T - S, d['widthDeg']
if not a.no_write:
    ladder = [{'file': d['file'], 'widthDeg': d['widthDeg']} for d in reversed(bk['delta'])]
    ladder += [{'file': l['file'], 'widthDeg': l['widthDeg']} for l in reversed(lits)]
    ladder += [{'file': p['file'], 'widthDeg': p['widthDeg'], 'own': True} for p in reversed(plates)]
    out = {'levels': ladder, 'fadeMinor': bk['fadeMinor'], 'oneChannel': bk['oneChannel']}
    text = '{\n  "levels": [\n' + ',\n'.join('    ' + json.dumps(l) for l in ladder) + '\n  ],\n  "fadeMinor": %s,\n  "oneChannel": %s\n}\n' % (json.dumps(bk['fadeMinor']), json.dumps(bk['oneChannel']))
    open(a.levels, 'w').write(text)
