#!/usr/bin/env python3
"""make.py: the font subset, the width table and the test fixtures of src/subs, all from subs.py and the cue list.
Run from the repo root: python3 assets-src/subs/make.py"""
import json, os, sys, math
import numpy as np, cv2
from PIL import ImageFont
from fontTools import subset
from fontTools.ttLib import TTFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import subs
TTF = HERE + '/Lato-Medium.ttf'; subs.FONT = TTF
cues = json.load(open(ROOT + '/src/subs/cues.json'))
chars = sorted(set(''.join(w['w'] for c in cues for w in c['words']) + ' '))

opt = subset.Options(); opt.layout_features = ['*']; opt.flavor = 'woff2'; opt.name_IDs = [0, 1, 2, 3, 4, 5, 6, 7, 13, 14]; opt.notdef_outline = True; opt.recalc_timestamp = False
f = TTFont(TTF, recalcTimestamp=False); s = subset.Subsetter(opt); s.populate(text=''.join(chars)); s.subset(f)
for n in f['name'].names:
    if n.nameID in (1, 16): n.string = 'Subs Sans'
    if n.nameID in (4,): n.string = 'Subs Sans Medium'
    if n.nameID == 6: n.string = 'SubsSans-Medium'
    if n.nameID == 3: n.string = 'Subs Sans Medium, a subset of Lato Medium 2.015'
f.flavor = 'woff2'; f.save(ROOT + '/src/subs/font/subs-sans-medium.woff2')

full = TTFont(TTF)
words = sorted(set(w['w'] for c in cues for w in c['words']))
def table(size):
    font = ImageFont.truetype(TTF, size)
    return dict(space=font.getlength(' '), widths={w: font.getlength(w) for w in words})
metrics = dict(upm=full['head'].unitsPerEm, ascent=full['hhea'].ascent, descent=-full['hhea'].descent, sizes={'108': table(108), '81': table(81)})
json.dump(metrics, open(ROOT + '/src/subs/metrics.json', 'w'), indent=1, sort_keys=True); open(ROOT + '/src/subs/metrics.json', 'a').write('\n')

fx = {}
fx['chars'] = ''.join(chars)
fx['mt'] = {str(seed): np.random.RandomState(seed).rand(6).tolist() for seed in (5, 11, 67)}
L11 = np.random.RandomState(11).rand(64, 32, 64).astype(np.float32)
fx['lattice11'] = [float(L11[0, 0, 0]), float(L11[1, 2, 3]), float(L11[63, 31, 63])]
fx['pil'] = {str(sz): list(ImageFont.truetype(TTF, sz).getmetrics()) for sz in (54, 72, 81, 96, 108, 120, 144, 162, 216)}
fx['kernel'] = {str(sg): cv2.getGaussianKernel(int(round(sg * 8 + 1)) | 1, sg, cv2.CV_32F).ravel().astype(float).tolist() for sg in (0.2, 0.75, 2.5, 4.59, 7.02)}
rng = np.random.RandomState(1); src = rng.rand(9, 14).astype(np.float32)
fx['blur'] = dict(src=src.astype(float).tolist(), sigma=2.5, out=cv2.GaussianBlur(src, (0, 0), 2.5).astype(float).tolist())
fx['layout'] = {}
for (Wd, Ht) in ((1920, 1080), (3840, 2160), (1280, 720), (960, 540)):
    R = subs.Renderer(cues, Wd, Ht); L = R.L
    lines = {}
    for c in cues:
        ln = L.lines[c['id']]
        lines[c['id']] = dict(rows=ln['rows'], items=[[it['i'], it['x'], it['base'], it['w'], it['row'], it['tx'], it['ty'], it['tile'].shape[1], it['tile'].shape[0]] for it in ln['items']])
    fx['layout']['%dx%d' % (Wd, Ht)] = dict(em=L.em, ss=L.ss, asc=L.asc, desc=L.desc, y0=L.y0, y1=L.y1, gw=R.gw, gh=R.gh, up=list(R.up), stars=[list(map(float, s)) for s in R.stars[:3]], nstars=len(R.stars), lines=lines)
R = subs.Renderer(cues, 1920, 1080)
grids = {}
real = cv2.resize
def spy(a, size, interpolation=None):
    spy.last = a if a.ndim == 3 and a.shape[2] == 4 else getattr(spy, 'last', None)
    return real(a, size, interpolation=interpolation)
cv2.resize = spy
fx['haze'] = []
pts = [(0, 0), (50, 240), (50, 100), (60, 300), (40, 200), (70, 255), (100, 479), (30, 150), (55, 330), (45, 220)]
for t in (1.2, 3.3, 5.5, 12.0, 40.5, 150.9, 175.9):
    R.layer(t); g = spy.last
    fx['haze'].append(dict(t=t, at=[[y, x] + [float(v) for v in g[y, x]] for (y, x) in pts], mean=[float(v) for v in g.reshape(-1, 4).mean(0)]))
cv2.resize = real
json.dump(fx, open(ROOT + '/tests/fixtures/subs.json', 'w'))
print('chars', ''.join(chars), 'woff2', os.path.getsize(ROOT + '/src/subs/font/subs-sans-medium.woff2'), 'fixture', os.path.getsize(ROOT + '/tests/fixtures/subs.json'))
