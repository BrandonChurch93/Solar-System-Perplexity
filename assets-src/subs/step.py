#!/usr/bin/env python3
"""step.py LINE WORD FPS DIR K...: one word's fade over neighbouring frames K of a capture at FPS frames a second.
DIR holds f<K>-subs1-r2.png and f<K>-subs0-r2.png (the page with and without the switch). Prints the word's state by subs.py's rule at t = K / FPS
and what the page shows; writes the word cut from each frame, enlarged, side by side."""
import json, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import subs
subs.FONT = HERE + '/Lato-Medium.ttf'
line, wi, fps, d = sys.argv[1], int(sys.argv[2]), float(sys.argv[3]), sys.argv[4]; ks = [int(k) for k in sys.argv[5:]]
cues = json.load(open(ROOT + '/src/subs/cues.json')); c = [x for x in cues if x['id'] == line][0]; w = c['words'][wi]
tiles = []; prev = None
for k in ks:
    on = np.asarray(Image.open('%s/f%d-subs1-r2.png' % (d, k)).convert('RGB')).astype(np.float32)
    off = np.asarray(Image.open('%s/f%d-subs0-r2.png' % (d, k)).convert('RGB')).astype(np.float32)
    Ht, Wd = on.shape[:2]
    if prev is None:
        R = subs.Renderer(cues, Wd, Ht); L = R.L; it = [i for i in L.lines[line]['items'] if i['i'] == wi][0]
    t = k / fps
    p = min(1.0, max(0.0, (t - (w['on'] - subs.WORD_AHEAD)) / subs.WORD_IN)); e = 1 - (1 - p) ** 3
    th, tw = it['tile'].shape; y = L.y0 + it['ty']; x = it['tx']
    cut = on[y:y + th, x:x + tw]
    peak = float(np.percentile(cut.min(2), 99.5)); lift = float((on - off)[y:y + th, x:x + tw].clip(0).mean())
    ref = off.astype(np.uint8).copy(); R.over(ref, t, k); diff = float(np.abs(ref[y:y + th, x:x + tw].astype(np.float32) - cut).mean())
    print('frame %d of %g a second, t %.4f s: %r of line %s is %.4f through its fade, shown %.4f, blur %.2f px, %.2f px under its place | page: letters at %.1f of 255, the tile lifted by %.2f, off subs.py in the tile by %.2f%s' % (
        k, fps, t, w['w'], line, p, e, (1 - e) * subs.WORD_SOFT * L.em, (1 - e) * subs.WORD_RISE * L.em, peak, lift, diff, '' if prev is None else ' | step of shown %.4f, of the letters %.1f' % (e - prev[0], peak - prev[1])))
    prev = (e, peak)
    tiles.append(np.asarray(Image.fromarray(cut.astype(np.uint8)).resize((tw * 3, th * 3), Image.LANCZOS)))
gap = np.full((tiles[0].shape[0], 6, 3), 255, np.uint8)
row = [tiles[0]]
for tl in tiles[1:]:
    row += [gap, tl]
out = '%s/step-%s-%d.png' % (d, line, wi); Image.fromarray(np.hstack(row)).save(out); print('wrote', out)
