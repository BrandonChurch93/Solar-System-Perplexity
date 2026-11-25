#!/usr/bin/env python3
"""The sheet is cut where the surface is cut (MAIL 1104).

For every crest that crests.py lists for the surface view (a step of a layer's
distance whose parallax over the film's path is larger than one cell of the
layer's grid) the near side of the step gets a layer of its own, and the
parent layer keeps the ground behind it:

- the cut layer C: the picture's own colour in a box about the crest; alpha 1
  on the near side of the step out to `band` cells behind the fill, then
  falling to 0 over `feather` cells; its edge at the step is the near side's
  outline at the texel, not a cell side. Its distance is the near side's own,
  carried on unchanged across the step (the nearest near texel), so that no
  cell of C spans the step. It stands `bias` nearer than the parent, so that
  it wins the depth test where both hold the same ground.
- the parent: under the near side, as far as `fill` times the crest's largest
  parallax, its distance is the far side's carried on (the nearest far texel,
  smoothed) and its colour the far side's (the nearest far pixel, smoothed
  over a third of the parallax):
  what the crest uncovers is the ground behind it, no hole and no second copy
  of the crest. Between there and the end of C's whole alpha the distance goes
  back to the layer's own; that wall is always behind C.

The files draw a step over a few texels; within `soft` texels of the other
side a texel belongs to neither, and both sides are carried on from beyond.

Near and far are told apart per texel within the zone about the step: by which
of the two carried on distances (from the step's near texels, from its far
texels) the texel's own is closer to, in log.

Inputs: the layers before the cut (--src, as build.py and the place's chain
left them), the crests of the surface view (crests.json and cut-<layer>.npy
written by crests.py --kinds terrain). Values: relief.json block cuts.
Writes relief-<id>-{color.jpg,alpha.png,dist.bin}, the parent's colour and
distance, for both sets, and the layers' rows in relief.json.

  python3 assets-src/mars/place/cutlayers.py --src out/work/place/saw/src --out public/assets/mars
"""
import argparse, json, os
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage
import jpeglib
Image.MAX_IMAGE_PIXELS = None

p = argparse.ArgumentParser()
p.add_argument('--src', required=True)
p.add_argument('--out', default='public/assets/mars')
p.add_argument('--relief', default='src/stops/mars/relief.json')
p.add_argument('--mesh', type=int, default=420)
a = p.parse_args()
R0 = json.load(open(os.path.join(a.src, 'relief.json')))
R = json.load(open(a.relief))
V = R['cuts']
crests = json.load(open(os.path.join(a.src, 'crests-terrain.json')))['crests']
W, H = R0['imageSize']['full']
smooth = lambda x: (lambda t: t * t * (3 - 2 * t))(np.clip(x, 0, 1))
layers = {k: dict(v) for k, v in R0['layers'].items()}
order = list(R0['drawOrder'])
work = {}
def blocks(src, im, out, changed):
    """Write a parent's picture again so that only the blocks of the file under the changed pixels differ from the file before the cut:
    the picture with the fill is coded with the tables of the file before (its other blocks would come back a little different from a
    second coding), and of that coding only the blocks that hold a changed pixel are put into the coefficients of the file before."""
    tmp = out + '.tmp.jpg'
    im.save(tmp, quality='keep', subsampling='keep')
    A, B = jpeglib.read_dct(src), jpeglib.read_dct(tmp)
    os.remove(tmp)
    assert np.array_equal(A.qt, B.qt) and A.Y.shape == B.Y.shape and A.Cb.shape == B.Cb.shape
    H, W = changed.shape
    n = 0
    for names, ref in ((('Y',), A.Y), (('Cb', 'Cr'), A.Cb)):
        by, bx = ref.shape[:2]; fy, fx = int(np.ceil(H / 8 / by)), int(np.ceil(W / 8 / bx))
        m = np.zeros((by * 8 * fy, bx * 8 * fx), bool); m[:H, :W] = changed
        m = m.reshape(by, 8 * fy, bx, 8 * fx).any(axis=(1, 3))
        for nm in names:
            c = getattr(A, nm); c[m] = getattr(B, nm)[m]; setattr(A, nm, c)
        n += int(m.sum())
    A.write_dct(out)
    return n


def parent(k):
    if k not in work:
        l = R0['layers'][k]; dw, dh = l['distSize']['full']
        work[k] = {'d': np.fromfile(os.path.join(a.src, 'full', 'relief-%s-dist.bin' % k), np.float32).reshape(dh, dw).copy(),
                   'c': Image.open(os.path.join(a.src, 'full', 'relief-%s-color.jpg' % k)),
                   'al': np.asarray(Image.open(os.path.join(a.src, 'full', 'relief-%s-alpha.png' % k)).convert('L')),
                   'cut': np.load(os.path.join(a.src, 'cut-%s.npy' % k))}
        work[k]['c'].load(); work[k]['rgb'] = np.asarray(work[k]['c']).copy(); work[k]['patches'] = []
    return work[k]
made = []
for n, cr in enumerate(crests):
    k = cr['layer']; pw = parent(k); l = R0['layers'][k]; b = l['box']; dw, dh = l['distSize']['full']
    nx = a.mesh if b['w'] >= b['h'] else round(a.mesh * b['w'] / b['h'])
    cell = b['w'] / nx                                   # picture px
    par = cr['parallaxPx'] / cr['cellPx'] * cell         # the crest's largest parallax in picture px
    wa = V['fill'] * par; wt = wa + V['band'] * cell; wf = wt + V['feather'] * cell
    # the box of the cut layer: the crest's box and the zone about it, on a grid of 4 px (the web set is half, the distance a quarter)
    g = 4; pad = wf + 2 * cell
    x0 = int(np.floor((cr['box'][0] - pad - b['x']) / g) * g); y0 = int(np.floor((cr['box'][1] - pad - b['y']) / g) * g)
    x1 = int(np.ceil((cr['box'][2] + pad - b['x']) / g) * g); y1 = int(np.ceil((cr['box'][3] + pad - b['y']) / g) * g)
    x0 = max(x0, 0); y0 = max(y0, 0); x1 = min(x1, b['w']); y1 = min(y1, b['h'])
    sx = b['w'] / dw; u0, v0, u1, v1 = int(x0 / sx), int(y0 / sx), int(x1 / sx), int(y1 / sx)
    d = pw['d'][v0:v1, u0:u1]; d0 = d.copy()
    cut = pw['cut'][v0:v1, u0:u1] > 0
    # only this crest's pairs
    cb = [(cr['box'][0] - b['x']) / sx - u0, (cr['box'][1] - b['y']) / sx - v0, (cr['box'][2] - b['x']) / sx - u0, (cr['box'][3] - b['y']) / sx - v0]
    yy, xx = np.mgrid[0:cut.shape[0], 0:cut.shape[1]]
    cut &= (xx >= cb[0] - 1) & (xx <= cb[2] + 1) & (yy >= cb[1] - 1) & (yy <= cb[3] + 1)
    # near and far texels of the step: a marked pair is the texel and its right or lower neighbour; take the 3 by 3 about the marks
    zone = ndimage.binary_dilation(cut, structure=np.ones((3, 3), bool))
    lo = ndimage.minimum_filter(d0, 3); hi = ndimage.maximum_filter(d0, 3)
    nears = zone & (d0 - lo < hi - d0); fars = zone & ~nears
    s = ndimage.distance_transform_edt(~cut) * sx       # picture px from the step
    _, (iy, ix) = ndimage.distance_transform_edt(~nears, return_indices=True); dn = d0[iy, ix]
    _, (fy, fx) = ndimage.distance_transform_edt(~fars, return_indices=True); df = d0[fy, fx]
    near = np.abs(np.log(d0 / dn)) < np.abs(np.log(d0 / df))
    near = ndimage.median_filter(near.astype(np.uint8), 3) > 0
    inz = s < wf + cell
    near &= inz
    # only the near side that hangs together with the step's own near texels (necks of a texel or two do not join)
    core = ndimage.binary_erosion(near, structure=np.ones((3, 3), bool), iterations=2)
    lab, _ = ndimage.label(core)
    keep = np.unique(lab[ndimage.binary_dilation(nears, structure=np.ones((3, 3), bool), iterations=3) & core]); keep = keep[keep > 0]
    near &= ndimage.binary_dilation(np.isin(lab, keep), structure=np.ones((3, 3), bool), iterations=3)
    # the cut layer
    # across the step the near side's distance carried on: the nearest near texel
    # the files draw a step over a few texels: within `soft` texels of the other side a texel holds a distance between the two, which
    # is neither side's. Both sides are carried on from their texels beyond that
    k3 = np.ones((3, 3), bool)
    pure_n = ndimage.binary_erosion(near, structure=k3, iterations=V['soft'])
    far = ~near
    pure_f = ndimage.binary_erosion(far, structure=k3, iterations=V['soft'])
    _, (ny_, nx_) = ndimage.distance_transform_edt(~pure_n, return_indices=True)
    cd = np.where(pure_n, d0, d0[ny_, nx_]).astype(np.float32) * (1 - V['bias'])
    ca = near * (1 - smooth((s - wt) / (wf - wt)))
    # the parent: the far side carried on under the near side
    _, (gy, gx) = ndimage.distance_transform_edt(~pure_f, return_indices=True)
    far_d = np.where(pure_f, d0, d0[gy, gx])
    sm = cv2.GaussianBlur(far_d.astype(np.float32), (0, 0), 1.5)
    far_d = np.where(pure_f, d0, sm)
    # the far side's own soft texels (beside the step) take the carried on distance too, by the same weight as the fill
    soft_f = far & ~pure_f & (s < wa)
    wA = np.maximum(near * (1 - smooth((s - wa) / (wt - wa))), soft_f.astype(np.float32))
    d[:] = np.exp(np.log(d0) * (1 - wA) + np.log(far_d) * wA)
    # colours at the full size
    hh, ww = y1 - y0, x1 - x0
    rgb = pw['rgb'][y0:y1, x0:x1].copy()
    held = ndimage.binary_dilation(near, structure=k3, iterations=V['soft'])
    nearF = cv2.resize(held.astype(np.float32), (ww, hh), interpolation=cv2.INTER_LINEAR)
    # C holds the near side and the `soft` texels beside it (the crest's own rim lies there in the picture). Its alpha is whole
    # wherever the parent is filled: the edge ramp lies one texel further out, over ground the parent still holds as the picture
    # has it, so that from the picture's own eye the cut gives the picture back
    ca = ndimage.binary_dilation(held, structure=k3) * (1 - smooth((s - wt) / (wf - wt)))
    caF = cv2.resize(ca.astype(np.float32), (ww, hh), interpolation=cv2.INTER_LINEAR) * (pw['al'][y0:y1, x0:x1] / 255.0)
    wAF = cv2.resize(wA.astype(np.float32), (ww, hh), interpolation=cv2.INTER_LINEAR)
    hard = nearF > 0.02
    _, (py_, px_) = ndimage.distance_transform_edt(hard, return_indices=True)
    fill = rgb[py_, px_].astype(np.float32)
    # the far side's colour carried on, smoothed over a third of the parallax so that no streak of single pixels is drawn out
    fill = np.where(hard[..., None], cv2.GaussianBlur(fill, (0, 0), max(2.0, par / 3)), fill)
    wfill = (hard & (cv2.resize((s < wt).astype(np.float32), (ww, hh), interpolation=cv2.INTER_NEAREST) > 0)).astype(np.float32)[..., None]
    prgb = np.clip(rgb * (1 - wfill) + fill * wfill, 0, 255).astype(np.uint8)
    pw['patches'].append((x0, y0, prgb))
    cid = 'C%d' % n
    # the cut layer's files hold only the box of its own alpha (on the grid of 4 px, one step of the grid about it): memory is
    # counted by the box, and outside its alpha a cut layer draws nothing
    ys_, xs_ = np.nonzero(caF > 0)
    tx0 = max(0, int(xs_.min()) // g * g - g); ty0 = max(0, int(ys_.min()) // g * g - g)
    tx1 = min(ww, -(-(int(xs_.max()) + 1) // g) * g + g); ty1 = min(hh, -(-(int(ys_.max()) + 1) // g) * g + g)
    tr = lambda x, q=1: x[ty0 // q:ty1 // q, tx0 // q:tx1 // q]
    q_ = int(round(sx)); assert abs(sx - q_) < 1e-9 and g % q_ == 0
    c_rgb, c_al, c_d = tr(rgb), tr(caF), tr(cd, q_)
    box = {'x': b['x'] + x0 + tx0, 'y': b['y'] + y0 + ty0, 'w': tx1 - tx0, 'h': ty1 - ty0}
    for key, kk in (('full', 1), ('web', 2)):
        o = os.path.join(a.out, key)
        cw, chh = box['w'], box['h']
        cc = c_rgb if kk == 1 else cv2.resize(c_rgb, (cw // 2, chh // 2), interpolation=cv2.INTER_AREA)
        aa = np.clip(c_al * 255 + 0.5, 0, 255).astype(np.uint8)
        if kk == 2: aa = cv2.resize(aa, (cw // 2, chh // 2), interpolation=cv2.INTER_AREA)
        dd = c_d if kk == 1 else cv2.resize(c_d, (c_d.shape[1] // 2, c_d.shape[0] // 2), interpolation=cv2.INTER_AREA)
        # without loss: from the picture's eye the cut layer gives the parent's own pixels back, not a second coding of them
        Image.fromarray(cc).save(os.path.join(o, 'relief-%s-color.png' % cid), optimize=True)
        Image.fromarray(aa).save(os.path.join(o, 'relief-%s-alpha.png' % cid), optimize=True)
        dd.astype('<f4').tofile(os.path.join(o, 'relief-%s-dist.bin' % cid))
    layers[cid] = {'files': {s_: {e: 'public/assets/mars/%s/relief-%s-%s' % (s_, cid, f) for e, f in (('color', 'color.png'), ('alpha', 'alpha.png'), ('dist', 'dist.bin'))} for s_ in ('full', 'web')},
                   'box': box, 'colorSize': {'full': [box['w'], box['h']], 'web': [box['w'] // 2, box['h'] // 2]}, 'distSize': {'full': [c_d.shape[1], c_d.shape[0]], 'web': [c_d.shape[1] // 2, c_d.shape[0] // 2]},
                   'distRange': [round(float(c_d.min()), 4), round(float(c_d.max()), 4)]}
    order.insert(order.index(k) + 1 + sum(1 for m in made if m['parent'] == k), cid)
    made.append({'id': cid, 'parent': k, 'crest': cr['box'], 'parallaxPx': cr['parallaxPx'], 'cellPx': cr['cellPx'], 'frame': cr['frame'], 'fillPx': round(wa, 1), 'wholePx': round(wt, 1), 'endPx': round(wf, 1)})
    print(cid, k, box, 'parallax in picture px %.1f, fill %.1f, whole to %.1f, ends %.1f; near texels %d' % (par, wa, wt, wf, int(near.sum())), flush=True)
    work.setdefault('view', []).append((cid, rgb, caF, prgb, d0, d.copy(), cd))
for k, pw in work.items():
    if k == 'view': continue
    im = pw['c']
    before = np.asarray(im).copy()
    for x0, y0, prgb in pw['patches']: im.paste(Image.fromarray(prgb), (x0, y0))
    changed = (np.asarray(im) != before).any(2); del before
    for key, kk in (('full', 1), ('web', 2)):
        o = os.path.join(a.out, key)
        if kk == 1:
            blocks(os.path.join(a.src, 'full', 'relief-%s-color.jpg' % k), im, os.path.join(o, 'relief-%s-color.jpg' % k), changed)
            pw['d'].astype('<f4').tofile(os.path.join(o, 'relief-%s-dist.bin' % k))
        else:
            wim = Image.open(os.path.join(a.src, 'web', 'relief-%s-color.jpg' % k)); wim.load()
            for x0, y0, prgb in pw['patches']:
                wim.paste(Image.fromarray(cv2.resize(prgb, (prgb.shape[1] // 2, prgb.shape[0] // 2), interpolation=cv2.INTER_AREA)), (x0 // 2, y0 // 2))
            wch = cv2.resize(changed.astype(np.uint8), (wim.size[0], wim.size[1]), interpolation=cv2.INTER_AREA) > 0
            blocks(os.path.join(a.src, 'web', 'relief-%s-color.jpg' % k), wim, os.path.join(o, 'relief-%s-color.jpg' % k), wch)
            wd = np.fromfile(os.path.join(a.src, 'web', 'relief-%s-dist.bin' % k), np.float32)
            l = R0['layers'][k]; dw2, dh2 = l['distSize']['web']; wd = wd.reshape(dh2, dw2).copy()
            dw, dh = l['distSize']['full']
            ch = np.abs(pw['d'] - np.fromfile(os.path.join(a.src, 'full', 'relief-%s-dist.bin' % k), np.float32).reshape(dh, dw)) > 0
            small = cv2.resize(pw['d'], (dw2, dh2), interpolation=cv2.INTER_AREA)
            chs = cv2.resize(ch.astype(np.uint8), (dw2, dh2), interpolation=cv2.INTER_AREA) > 0
            wd[chs] = small[chs]
            wd.astype('<f4').tofile(os.path.join(o, 'relief-%s-dist.bin' % k))
# relief.json: the text of the file before the cut with the new rows put in, so that no other line of it changes
V['made'] = made
text = open(os.path.join(a.src, 'relief.json')).read()
ind = lambda t, n: t.replace('\n', '\n' + ' ' * n)
head = text.index(' "drawOrder": ['); tail = text.index(']', head) + 1
text = text[:head] + ' "drawOrder": ' + ind(json.dumps(order, indent=1), 1) + text[tail:]
at = text.index('\n },\n "masks"')
text = text[:at] + ''.join(',\n  "%s": %s' % (m['id'], ind(json.dumps(layers[m['id']], indent=1), 2)) for m in made) + text[at:]
at = text.index(' "safeMove"')
text = text[:at] + ' "cuts": ' + ind(json.dumps(V, indent=1), 1) + ',\n' + text[at:]
json.loads(text)
open(a.relief, 'w').write(text)
# a sheet to look at: per cut the picture, C's alpha, the parent after, the distances before and after and C's
rows = []
for cid, rgb, caF, prgb, d0, d1, cd in work['view']:
    hh, ww = rgb.shape[:2]
    lo, hi = float(d0.min()), float(d0.max())
    col = lambda x: cv2.cvtColor(cv2.applyColorMap((255 * np.clip((cv2.resize(x, (ww, hh), interpolation=cv2.INTER_NEAREST) - lo) / (hi - lo), 0, 1)).astype(np.uint8), cv2.COLORMAP_TURBO), cv2.COLOR_BGR2RGB)
    row = np.hstack([rgb, (rgb * caF[..., None]).astype(np.uint8), prgb, col(d0), col(d1), col(cd)])
    rows.append(row)
wmax = max(r.shape[1] for r in rows)
sheet = np.vstack([np.pad(r, ((0, 4), (0, wmax - r.shape[1]), (0, 0))) for r in rows])
Image.fromarray(sheet).save(os.path.join(a.src, 'cuts-sheet.jpg'), quality=88)
